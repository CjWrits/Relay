'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/layout/Header';
import { useRelay } from '@/context/RelayContext';
import { Source, NormalizedActivity, IngestionJobRecord, AccessLevel } from '@/types/relay';
import {
  FolderGit2,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Upload,
  Database,
  History,
  Shield,
  ExternalLink,
  ChevronRight,
  X,
  FileCode,
  Layers,
  ArrowRight,
  Info,
  Hash,
  Clock,
  Key,
  RotateCw,
} from 'lucide-react';
import { formatDate, formatTime, formatDateTime } from '@/lib/utils/date';

export default function SourcesPage() {
  const { currentRole } = useRelay();

  // Core Data State
  const [sources, setSources] = useState<Source[]>([]);
  const [activities, setActivities] = useState<NormalizedActivity[]>([]);
  const [syncHistory, setSyncHistory] = useState<IngestionJobRecord[]>([]);
  const [storageStatus, setStorageStatus] = useState<{ mode: string; message: string }>({
    mode: 'LOCAL_MEMORY',
    message: 'Loading...',
  });
  const [loading, setLoading] = useState(true);

  // Modals & Inspection State
  const [showGitLabModal, setShowGitLabModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedSourceForDetails, setSelectedSourceForDetails] = useState<Source | null>(null);
  const [selectedActivityForModal, setSelectedActivityForModal] = useState<NormalizedActivity | null>(null);
  const [reSyncingSourceId, setReSyncingSourceId] = useState<string | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  // GitLab Form
  const [glProjectPath, setGlProjectPath] = useState('cjwrits/atlas');
  const [glResourceTypes, setGlResourceTypes] = useState<string[]>(['commits', 'issues', 'merge_requests', 'docs']);
  const [glAccessLevel, setGlAccessLevel] = useState<AccessLevel>('INTERNAL');
  const [glAccessToken, setGlAccessToken] = useState<string>('');
  const [glBranch, setGlBranch] = useState<string>('main');
  const [glSyncing, setGlSyncing] = useState(false);
  const [glError, setGlError] = useState<string | null>(null);
  const [glSuccessMessage, setGlSuccessMessage] = useState<string | null>(null);

  // Document Upload Form
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadAccessLevel, setUploadAccessLevel] = useState<AccessLevel>('INTERNAL');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'SOURCES' | 'ACTIVITIES' | 'HISTORY'>('SOURCES');

  // Load data from server API
  const loadData = async () => {
    try {
      setLoading(true);
      const [srcRes, histRes] = await Promise.all([
        fetch('/api/sources'),
        fetch('/api/sources/history'),
      ]);

      if (srcRes.ok) {
        const srcData = await srcRes.json();
        setSources(srcData.sources || []);
        setActivities(srcData.activities || []);
        if (srcData.storageStatus) {
          setStorageStatus(srcData.storageStatus);
        }
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setSyncHistory(histData.syncJobs || []);
      }
    } catch (err) {
      console.error('Failed loading sources data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle GitLab Ingestion
  const handleGitLabSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlSyncing(true);
    setGlError(null);
    setGlSuccessMessage(null);

    try {
      const res = await fetch('/api/ingest/gitlab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrlOrPath: glProjectPath,
          resourceTypes: glResourceTypes,
          accessLevel: glAccessLevel,
          accessToken: glAccessToken.trim() || undefined,
          userRole: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to ingest GitLab project.');
      }

      setGlSuccessMessage(
        `Successfully imported ${data.report.recordsImported} activities (${data.report.duplicatesSkipped} duplicates skipped).`
      );
      loadData();
      setTimeout(() => {
        setShowGitLabModal(false);
        setGlSuccessMessage(null);
      }, 2000);
    } catch (err: unknown) {
      setGlError(err instanceof Error ? err.message : 'GitLab ingestion failed.');
    } finally {
      setGlSyncing(false);
    }
  };

  // Handle Document Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one .md or .txt file.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccessMessage(null);

    const formData = new FormData();
    for (const f of uploadFiles) {
      formData.append('files', f);
    }
    formData.append('accessLevel', uploadAccessLevel);

    try {
      const res = await fetch('/api/ingest/document', {
        method: 'POST',
        headers: {
          'x-user-role': currentRole,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload and ingest documents.');
      }

      setUploadSuccessMessage(
        `Successfully ingested ${data.report.recordsImported} traceable document sections (${data.report.duplicatesSkipped} duplicates skipped).`
      );
      setUploadFiles([]);
      loadData();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccessMessage(null);
      }, 2000);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Re-synchronize a specific source
  const handleReSyncSource = async (sourceId: string) => {
    setReSyncingSourceId(sourceId);
    try {
      const res = await fetch('/api/sources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, userRole: currentRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to re-sync source.');
      }
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Source sync failed.');
    } finally {
      setReSyncingSourceId(null);
    }
  };

  // Retry a sync job
  const handleRetryJob = async (job: IngestionJobRecord) => {
    setRetryingJobId(job.id);
    try {
      const res = await fetch('/api/sources/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: job.sourceId, userRole: currentRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Job retry failed.');
      }
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Job retry failed.');
    } finally {
      setRetryingJobId(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(md|markdown|txt)$/i.test(f.name)
      );
      if (validFiles.length > 0) {
        setUploadFiles((prev) => [...prev, ...validFiles]);
      } else {
        setUploadError('Only .md and .txt files are accepted.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Source Connectors & Authorized Ingestion"
        subtitle="Manage live GitLab repository ingestion, document uploads, and auditable synchronization provenance"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Storage Persistence Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                storageStatus.mode === 'SUPABASE_CONNECTED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Storage Backend: {storageStatus.mode === 'SUPABASE_CONNECTED' ? 'Supabase PostgreSQL' : 'Local Memory Store'}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                    storageStatus.mode === 'SUPABASE_CONNECTED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {storageStatus.mode === 'SUPABASE_CONNECTED' ? 'REMOTE DB ACTIVE' : 'ZERO-CONFIG LOCAL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{storageStatus.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Top Control Bar with Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Project Sources & Activities ({sources.length} Sources, {activities.length} Activities)
            </h2>
            <p className="text-xs text-slate-500">
              Only authorized sources are ingested into the Project Memory Engine. All records maintain immutable cryptographic hash and line-level provenance.
            </p>
          </div>

          {/* Action buttons (Disabled if Incoming Member) */}
          <div className="flex items-center gap-2.5">
            {currentRole === 'INCOMING_MEMBER' ? (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
                Incoming Member View (Read-Only)
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-teal-700" />
                  Upload Document (.md / .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setShowGitLabModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Connect GitLab Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* Demonstration Source Notice */}
        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong>Demonstration Data: </strong>
            The {sources.length} sources below represent Project Atlas. The primary repository source is linked directly to live GitLab repository{' '}
            <a
              href="https://gitlab.com/cjwrits/atlas"
              target="_blank"
              rel="noreferrer"
              className="text-teal-700 hover:text-teal-800 font-semibold underline"
            >
              https://gitlab.com/cjwrits/atlas
            </a>
            . You can click <strong>Re-sync</strong> on the card below or click <strong>Connect GitLab Project</strong> to fetch live activities directly from the repository.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('SOURCES')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'SOURCES'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            Connected Sources ({sources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ACTIVITIES')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ACTIVITIES'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Ingested Activities ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-2.5 px-1 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'HISTORY'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Synchronization History ({syncHistory.length})
          </button>
        </div>

        {/* TAB 1: Connected Sources Cards */}
        {activeTab === 'SOURCES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        {source.sourceType === 'GITLAB' ? (
                          <FolderGit2 className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-teal-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{source.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-400">
                            Type: {source.sourceType}
                          </span>
                          <span className="text-slate-300">*</span>
                          <span className="text-[10px] font-mono text-slate-500 font-semibold">
                            {source.activityCount} Activities Ingested
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          source.defaultAccessLevel === 'RESTRICTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {source.defaultAccessLevel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] truncate flex items-center justify-between">
                    <span className="truncate">{source.externalUrl || source.externalId || 'Local File Record'}</span>
                    {source.externalUrl && !source.externalUrl.startsWith('/') && (
                      <a
                        href={source.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:text-teal-800 shrink-0 ml-2"
                        title="Open external source"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {source.syncStatus === 'SUCCESS' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Synced
                      </span>
                    )}
                    {source.syncStatus === 'SYNCING' && (
                      <span className="inline-flex items-center gap-1 text-teal-700 font-semibold text-[11px]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                      </span>
                    )}
                    {source.syncStatus === 'FAILED' && (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px]" title={source.syncErrorMessage}>
                        <AlertCircle className="w-3.5 h-3.5" /> Sync Failed
                      </span>
                    )}
                    <span className="text-slate-400 font-mono text-[10px]">
                      ({source.lastSyncedAt ? formatTime(source.lastSyncedAt) : 'N/A'})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentRole === 'ADMIN' && (
                      <button
                        type="button"
                        disabled={reSyncingSourceId === source.id}
                        onClick={() => handleReSyncSource(source.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                        title="Re-synchronize source records"
                      >
                        <RotateCw className={`w-3 h-3 ${reSyncingSourceId === source.id ? 'animate-spin text-teal-600' : ''}`} />
                        Sync Now
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceForDetails(source);
                        setActiveTab('ACTIVITIES');
                      }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800"
                    >
                      View Activities <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Ingested Activities Stream */}
        {activeTab === 'ACTIVITIES' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700">
                {selectedSourceForDetails
                  ? `Filtered by Source: ${selectedSourceForDetails.name}`
                  : `All Ingested Activities (${activities.length})`}
              </span>
              {selectedSourceForDetails && (
                <button
                  type="button"
                  onClick={() => setSelectedSourceForDetails(null)}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Clear Source Filter
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {activities
                .filter((a) => !selectedSourceForDetails || a.sourceId === selectedSourceForDetails.id)
                .map((act) => (
                  <div key={act.id} className="py-3 hover:bg-slate-50/50 rounded-lg px-2 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {act.activityType}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{act.title}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                          {act.contentBody}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formatDate(act.activityTimestamp)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Author: <strong className="text-slate-700">{act.authorName}</strong></span>
                      <span>Ref: {act.externalId}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedActivityForModal(act)}
                          className="text-teal-700 font-semibold hover:underline flex items-center gap-0.5"
                        >
                          <Info className="w-3 h-3" /> Inspect Provenance
                        </button>
                        {act.originalUrl && (
                          <a
                            href={act.originalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-600 font-semibold flex items-center gap-1 hover:text-teal-700 hover:underline"
                          >
                            Source Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Synchronization History Log */}
        {activeTab === 'HISTORY' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Ingestion Job Audit History ({syncHistory.length} Jobs Recorded)
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Strict Ingestion Audit Trail</span>
            </div>

            <div className="space-y-2.5">
              {syncHistory.map((job) => (
                <div
                  key={job.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                          job.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">
                        Job ID: {job.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Source: {job.sourceId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Fetched: <strong className="text-slate-700">{job.recordsFetched}</strong> * Newly Imported:{' '}
                      <strong className="text-emerald-700">{job.recordsImported}</strong> * Duplicates Skipped:{' '}
                      <strong className="text-slate-600">{job.duplicatesSkipped}</strong>
                    </div>
                    {job.errorMessage && (
                      <div className="mt-1 text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                        Error: {job.errorMessage}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-[10px] font-mono text-slate-400 text-left sm:text-right">
                      <div>Started: {formatTime(job.startedAt)}</div>
                      {job.completedAt && (
                        <div>Completed: {formatTime(job.completedAt)}</div>
                      )}
                    </div>

                    {currentRole === 'ADMIN' && (
                      <button
                        type="button"
                        disabled={retryingJobId === job.id}
                        onClick={() => handleRetryJob(job)}
                        className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="Retry synchronization job"
                      >
                        <RotateCw className={`w-3 h-3 ${retryingJobId === job.id ? 'animate-spin text-teal-600' : ''}`} />
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: Connect GitLab Project */}
        {showGitLabModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Connect GitLab Project (REST API v4)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGitLabModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {glError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {glError}
                </div>
              )}

              {glSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  {glSuccessMessage}
                </div>
              )}

              <form onSubmit={handleGitLabSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GitLab Project URL or Path
                  </label>
                  <input
                    type="text"
                    value={glProjectPath}
                    onChange={(e) => setGlProjectPath(e.target.value)}
                    placeholder="e.g. gitlab-org/gitlab or https://gitlab.com/group/project"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-teal-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts public or authorized private repository paths. Server enforces SSRF filters (blocks localhost, 127.0.0.1, AWS/GCP metadata endpoints).
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Optional Personal / Project Access Token (Read-Only)
                  </label>
                  <input
                    type="password"
                    value={glAccessToken}
                    onChange={(e) => setGlAccessToken(e.target.value)}
                    placeholder="glpat-xxxxxxxxxxxxxxxxxxxx (Optional if public or configured in .env.local)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-teal-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-teal-600" />
                    Security Guarantee: Tokens are processed strictly server-side and never logged or returned in responses.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Resource Types to Ingest</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'commits', label: 'Commits & Messages' },
                      { key: 'issues', label: 'Issues (Open & Closed)' },
                      { key: 'merge_requests', label: 'Merge Requests (All)' },
                      { key: 'docs', label: 'Repo Markdown Docs' },
                    ].map((t) => (
                      <label key={t.key} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={glResourceTypes.includes(t.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGlResourceTypes([...glResourceTypes, t.key]);
                            } else {
                              setGlResourceTypes(glResourceTypes.filter((k) => k !== t.key));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-medium text-slate-800">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Branch</label>
                    <input
                      type="text"
                      value={glBranch}
                      onChange={(e) => setGlBranch(e.target.value)}
                      placeholder="main"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Default Access Level</label>
                    <select
                      value={glAccessLevel}
                      onChange={(e) => setGlAccessLevel(e.target.value as AccessLevel)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="INTERNAL">INTERNAL (Project team)</option>
                      <option value="PUBLIC">PUBLIC (All users)</option>
                      <option value="RESTRICTED">RESTRICTED (Admin/Reviewer)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGitLabModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={glSyncing || glResourceTypes.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {glSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {glSyncing ? 'Synchronizing GitLab...' : 'Start Ingestion'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Upload Markdown / TXT Document */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">Upload Project Documentation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {uploadError}
                </div>
              )}

              {uploadSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                  {uploadSuccessMessage}
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-3.5 text-xs">
                {/* Drag and Drop Zone with active dragging states */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-teal-600 bg-teal-50/50'
                      : 'border-slate-300 hover:border-teal-600 bg-slate-50/70 hover:bg-slate-50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                  <div className="font-semibold text-slate-800">Click to select or drag and drop files</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Accepted formats: <strong>.md, .markdown, .txt</strong> (Max 5 MB per file)
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md,.markdown,.txt,text/plain,text/markdown"
                    onChange={(e) => {
                      if (e.target.files) {
                        setUploadFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="hidden"
                  />
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                      <span>Selected Files ({uploadFiles.length}):</span>
                      <button
                        type="button"
                        onClick={() => setUploadFiles([])}
                        className="text-rose-600 hover:underline text-[10px]"
                      >
                        Clear All
                      </button>
                    </div>
                    {uploadFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-mono truncate">{f.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400">
                            {(f.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Access Level Classification</label>
                  <select
                    value={uploadAccessLevel}
                    onChange={(e) => setUploadAccessLevel(e.target.value as AccessLevel)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="INTERNAL">INTERNAL (Project team)</option>
                    <option value="PUBLIC">PUBLIC (All users)</option>
                    <option value="RESTRICTED">RESTRICTED (Admin & Reviewer only)</option>
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || uploadFiles.length === 0}
                    className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                  >
                    {uploading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    {uploading ? 'Processing Chunks...' : 'Upload & Ingest'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Activity Provenance Inspector */}
        {selectedActivityForModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-5 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedActivityForModal.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>ID: {selectedActivityForModal.id}</span>
                      <span>*</span>
                      <span>Type: {selectedActivityForModal.activityType}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedActivityForModal(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Provenance Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">AUTHOR</div>
                  <div className="font-semibold text-slate-800 truncate">{selectedActivityForModal.authorName}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">TIMESTAMP</div>
                  <div className="font-mono text-slate-700 truncate">{formatDateTime(selectedActivityForModal.activityTimestamp)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">ACCESS TIER</div>
                  <div className="font-semibold text-teal-700 truncate">{selectedActivityForModal.accessLevel}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">SOURCE ID</div>
                  <div className="font-mono text-slate-700 truncate">{selectedActivityForModal.sourceId}</div>
                </div>
              </div>

              {/* Content Body Preview */}
              <div className="flex-1 overflow-y-auto space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Extracted Raw Content
                </div>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedActivityForModal.contentBody}
                </div>
              </div>

              {/* Cryptographic Hash & Line Provenance */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Hash className="w-3 h-3 text-slate-400" /> Content SHA-256:
                  </span>
                  <span className="text-slate-800 font-semibold">{selectedActivityForModal.contentHash}</span>
                </div>
                {selectedActivityForModal.metadata && (
                  <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    Metadata: {JSON.stringify(selectedActivityForModal.metadata)}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedActivityForModal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Close Provenance
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

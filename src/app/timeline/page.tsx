'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  Clock,
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileText,
  AlertTriangle,
  User,
  Filter,
  ExternalLink,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { TimelineEvent, VerificationStatus } from '@/types/relay';
import { ReconstructMemoryBanner } from '@/components/intelligence/ReconstructMemoryBanner';

export default function TimelinePage() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyInferred, setOnlyInferred] = useState<boolean>(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTimeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/intelligence/state?projectId=proj-atlas-001');
      if (res.ok) {
        const json = await res.json();
        if (json.memory && json.memory.timeline) {
          setTimelineEvents(json.memory.timeline);
        }
      }
    } catch (err) {
      console.error('Failed to load timeline events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const authors = useMemo(() => {
    const set = new Set<string>();
    timelineEvents.forEach((e) => {
      if (e.authorName) set.add(e.authorName);
    });
    return Array.from(set).sort();
  }, [timelineEvents]);

  const filteredEvents = useMemo(() => {
    return timelineEvents.filter((ev) => {
      if (selectedPerson !== 'ALL' && ev.authorName !== selectedPerson) return false;
      if (onlyInferred && !ev.isAnalysisInferred) return false;

      if (selectedType !== 'ALL') {
        if (selectedType === 'ANALYSIS' && !ev.isAnalysisInferred) return false;
        if (selectedType === 'SOURCE' && ev.isAnalysisInferred) return false;
        if (selectedType === 'DECISION' && ev.eventType !== 'DECISION') return false;
        if (selectedType === 'RISK' && ev.eventType !== 'RISK_DISCOVERY') return false;
        if (selectedType === 'CONFLICT' && ev.eventType !== 'CONFLICT') return false;
        if (selectedType === 'GIT' && ev.eventType !== 'COMMIT' && ev.eventType !== 'MERGE_REQUEST') return false;
        if (selectedType === 'ISSUE' && ev.eventType !== 'ISSUE') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = ev.description.toLowerCase().includes(q);
        const matchesAuthor = ev.authorName.toLowerCase().includes(q);
        const matchesSource = ev.sourceActivityId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesAuthor && !matchesSource) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [timelineEvents, selectedPerson, selectedType, onlyInferred, searchQuery]);

  const getEventBadge = (type: TimelineEvent['eventType'], isInferred: boolean) => {
    if (isInferred) {
      if (type === 'CONFLICT') {
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Conflict Discovered',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
          dotClass: 'bg-rose-500 border-rose-200',
        };
      }
      if (type === 'RISK_DISCOVERY') {
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600" />,
          label: 'Risk Discovered',
          badgeClass: 'bg-red-50 text-red-800 border-red-200',
          dotClass: 'bg-red-500 border-red-200',
        };
      }
      if (type === 'DECISION') {
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Decision Formed',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dotClass: 'bg-emerald-500 border-emerald-200',
        };
      }
      return {
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-600" />,
        label: 'Inferred by Analysis',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-500 border-purple-200',
      };
    }

    switch (type) {
      case 'COMMIT':
        return {
          icon: <GitCommit className="w-3.5 h-3.5 text-slate-700" />,
          label: 'Git Commit',
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
          dotClass: 'bg-slate-700 border-slate-300',
        };
      case 'MERGE_REQUEST':
        return {
          icon: <GitPullRequest className="w-3.5 h-3.5 text-teal-700" />,
          label: 'Merge Request',
          badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
          dotClass: 'bg-teal-600 border-teal-200',
        };
      case 'ISSUE':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-700" />,
          label: 'Issue / Incident',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
          dotClass: 'bg-amber-600 border-amber-200',
        };
      case 'DOCUMENT':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-blue-700" />,
          label: 'Doc Chunk',
          badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
          dotClass: 'bg-blue-600 border-blue-200',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
          label: type,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          dotClass: 'bg-slate-500 border-slate-200',
        };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Project Chronological Timeline"
        subtitle="Auditable unified stream of source activities & reconstructed architectural milestones"
      />

      <div className="px-6 py-2 bg-white border-b border-slate-200">
        <ReconstructMemoryBanner onReconstructComplete={fetchTimeline} />
      </div>

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Filter and Query Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-teal-50 text-teal-700">
                <Clock className="w-4 h-4" />
              </span>
              <span className="text-sm font-bold text-slate-900">
                Timeline Stream ({filteredEvents.length} of {timelineEvents.length} Events)
              </span>
            </div>

            <button
              onClick={fetchTimeline}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search event title, summary, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>

            {/* Contributor Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Contributor:</span>
              <select
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Contributors ({authors.length})</option>
                {authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Event Category:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Event Types</option>
                <option value="ANALYSIS">Analysis-Inferred Only</option>
                <option value="SOURCE">Raw Source Activities Only</option>
                <option value="DECISION">Architectural Decisions</option>
                <option value="RISK">Risk Disclosures</option>
                <option value="CONFLICT">Detected Conflicts</option>
                <option value="GIT">Git Commits & MRs</option>
                <option value="ISSUE">Issues & Incidents</option>
              </select>
            </div>

            {/* Inferred Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg select-none">
              <input
                type="checkbox"
                checked={onlyInferred}
                onChange={(e) => setOnlyInferred(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-slate-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" /> Only Inferred Milestones
              </span>
            </label>
          </div>
        </div>

        {/* Chronological Feed */}
        <div className="relative pl-6 border-l-2 border-slate-200 space-y-5 my-4 ml-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
              No events found matching your filter criteria.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const meta = getEventBadge(ev.eventType, ev.isAnalysisInferred);
              const isExpanded = expandedEventId === ev.id;

              return (
                <div key={ev.id} className="relative group">
                  {/* Timeline Marker Dot */}
                  <div className="absolute -left-[31px] top-2.5 w-4 h-4 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs group-hover:border-teal-600 transition-colors">
                    <div className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}></div>
                  </div>

                  {/* Event Card */}
                  <div
                    className={`bg-white border rounded-xl p-4 shadow-xs transition-all ${
                      ev.isAnalysisInferred
                        ? 'border-purple-200/80 hover:border-purple-300 bg-purple-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${meta.badgeClass}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </span>

                          {ev.isAnalysisInferred && (
                            <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                              Analysis Inferred
                            </span>
                          )}

                          {ev.verificationStatus && (
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                                ev.verificationStatus === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : ev.verificationStatus === 'CONFLICTING'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : ev.verificationStatus === 'UNCERTAIN'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {ev.verificationStatus}
                            </span>
                          )}

                          <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed mt-1">
                          {ev.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-mono text-slate-400 block">
                          {formatDateTime(ev.timestamp)}
                        </span>
                        {ev.sourceActivityId && (
                          <span className="text-[10px] font-mono text-teal-700 block mt-0.5">
                            {ev.sourceActivityId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Expansion Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{ev.authorName}</span>
                        {ev.sourceActivityId && (
                          <>
                            <span className="text-slate-300">·</span>
                            <a
                              href={`/evidence?search=${ev.sourceActivityId}`}
                              className="text-teal-700 hover:text-teal-800 text-[11px] font-mono flex items-center gap-0.5"
                            >
                              Evidence Citation <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </>
                        )}
                      </div>

                      {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                        <button
                          onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                          className="text-slate-500 hover:text-slate-700 text-[11px] font-medium"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      )}
                    </div>

                    {/* Collapsible Metadata Drawer */}
                    {isExpanded && ev.metadata && (
                      <div className="mt-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] space-y-1">
                        <div className="font-semibold text-slate-700 font-sans text-xs mb-1">
                          Reconstruction Metadata:
                        </div>
                        {Object.entries(ev.metadata).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-slate-400">{k}:</span>
                            <span className="text-slate-800 font-medium">
                              {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

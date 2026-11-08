'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ATLAS_HANDOVERS, ATLAS_PEOPLE } from '@/data/mockAtlasData';
import { useRelay } from '@/context/RelayContext';
import { TargetRole, HandoverStatus } from '@/types/relay';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  History,
  FileEdit,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Save,
  Check,
  X,
  Layers,
  Info,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

export default function HandoverStudioPage() {
  const { currentRole, canApproveHandovers } = useRelay();
  const [selectedHandover, setSelectedHandover] = useState(ATLAS_HANDOVERS[0]);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'VERSIONS' | 'REVIEW'>('CONTENT');
  const [viewRole, setViewRole] = useState<TargetRole>('INCOMING_DEVELOPER');
  const [isApproved, setIsApproved] = useState(selectedHandover.status === 'APPROVED');
  const [approvalNote, setApprovalNote] = useState('');

  const handleApprove = () => {
    setIsApproved(true);
    setSelectedHandover((prev) => ({
      ...prev,
      status: 'APPROVED',
      approvedBy: 'Elena Rostova (Reviewer)',
      approvedAt: new Date().toISOString(),
    }));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Intelligent Handover Studio & Human Review"
        subtitle="Synthesized role-specific handover packages with versioned reviewer governance"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Top Handover Metadata Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          {/* Demonstration Notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Demonstration Handover Package: </strong>
              Synthesized from Atlas reconstructed memory to showcase role-specific transfer from Arjun Mehta to Maya Chen.
              Approval actions in this walkthrough update demo session state; persistent cryptographic sign-off will be deployed in Phase 4/5.
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Handover Package
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isApproved
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {isApproved ? 'APPROVED (DEMO WALKTHROUGH)' : 'IN REVIEW'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{selectedHandover.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span>
                  Departing:{' '}
                  <strong className="text-slate-800">
                    {selectedHandover.departingMember.name}
                  </strong>
                </span>
                <span>&rarr;</span>
                <span>
                  Incoming:{' '}
                  <strong className="text-slate-800">
                    {selectedHandover.incomingMember.name}
                  </strong>
                </span>
                <span>*</span>
                <span>
                  Scope: <span className="font-mono">{selectedHandover.scope}</span>
                </span>
              </div>
            </div>

            {/* Role View Toggle & Reviewer Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 px-1">View As:</span>
                <button
                  type="button"
                  onClick={() => setViewRole('INCOMING_DEVELOPER')}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    viewRole === 'INCOMING_DEVELOPER'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Developer
                </button>
                <button
                  type="button"
                  onClick={() => setViewRole('PROJECT_MANAGER')}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    viewRole === 'PROJECT_MANAGER'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PM
                </button>
              </div>

              {canApproveHandovers && !isApproved && (
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simulate Reviewer Approval
                </button>
              )}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-4 pt-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('CONTENT')}
              className={`pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'CONTENT'
                  ? 'border-teal-600 text-teal-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              Handover Document Sections ({selectedHandover.sections?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('VERSIONS')}
              className={`pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'VERSIONS'
                  ? 'border-teal-600 text-teal-800 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Version History ({selectedHandover.versions?.length || 0})
            </button>
          </div>
        </div>

        {/* Tab 1: Structured Document Sections */}
        {activeTab === 'CONTENT' && (
          <div className="space-y-4">
            {selectedHandover.sections?.map((sec) => (
              <div key={sec.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    {sec.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Key: {sec.sectionKey}
                  </span>
                </div>

                <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line">
                  {sec.contentMarkdown}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Version History */}
        {activeTab === 'VERSIONS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs divide-y divide-slate-100">
            {selectedHandover.versions?.map((ver) => (
              <div key={ver.id} className="py-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      v{ver.versionNumber}.0
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{ver.changedByName}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{ver.changeSummary}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatDateTime(ver.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

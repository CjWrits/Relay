'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { ATLAS_HANDOVERS } from '@/data/mockAtlasData';
import { useRelay } from '@/context/RelayContext';
import { TargetRole, Handover, HandoverStatus } from '@/types/relay';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  History,
  FileEdit,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Check,
  X,
  Compass,
  Sparkles,
  Info,
  Clock,
  Share2,
  GitPullRequest,
  RotateCcw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

export default function HandoverStudioPage() {
  const { currentRole, currentUser } = useRelay();
  const [handover, setHandover] = useState<Handover>(ATLAS_HANDOVERS[0]);
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'VERSIONS' | 'REVIEW'>('CONTENT');
  const [viewRole, setViewRole] = useState<TargetRole>('INCOMING_DEVELOPER');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal for Request Changes / Approve
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  const loadHandover = async () => {
    try {
      const res = await fetch('/api/handovers');
      if (res.ok) {
        const data = await res.json();
        if (data.handovers && data.handovers.length > 0) {
          setHandover(data.handovers[0]);
        }
      }
    } catch {
      // Keep mock default
    }
  };

  useEffect(() => {
    loadHandover();
  }, [currentRole]);

  const executeLifecycle = async (action: string, notes?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/handovers/${handover.id}/lifecycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
      });

      const data = await res.json();
      if (res.ok && data.handover) {
        setHandover(data.handover);
        setActionNotice(`Lifecycle action "${action}" completed successfully.`);
        setTimeout(() => setActionNotice(null), 4000);
      } else {
        alert(data.error || 'Lifecycle action failed');
      }
    } catch (err) {
      console.error('Lifecycle failure:', err);
    } finally {
      setActionLoading(false);
      setShowChangesModal(false);
      setShowApproveModal(false);
    }
  };

  const getStatusBadge = (status: HandoverStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'SHARED':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300';
      case 'ACKNOWLEDGED':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'UNDER_REVIEW':
      case 'IN_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'CHANGES_REQUESTED':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Intelligent Handover Studio & Review Governance"
        subtitle="13-Section Evidence-Backed Handover Package with Immutable Version Integrity"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Top Handover Metadata Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  Handover Package
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(handover.status)}`}>
                  {handover.status}
                </span>
                {handover.versions && handover.versions.length > 0 && (
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                    Version {handover.versions[handover.versions.length - 1].versionNumber}.0
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900">{handover.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span>
                  Departing: <strong className="text-slate-800">{handover.departingMember.name}</strong>
                </span>
                <span>&rarr;</span>
                <span>
                  Incoming: <strong className="text-slate-800">{handover.incomingMember.name}</strong>
                </span>
                <span>&bull;</span>
                <span>
                  Scope: <span className="font-mono text-teal-800">{handover.scope}</span>
                </span>
              </div>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* If DRAFT: Admin / Author can submit for review */}
              {(handover.status === 'DRAFT' || handover.status === 'CHANGES_REQUESTED') && currentRole !== 'INCOMING_MEMBER' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => executeLifecycle('SUBMIT_FOR_REVIEW')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-teal-400" />
                  Submit for Formal Review
                </button>
              )}

              {/* If UNDER_REVIEW: Reviewer (Elena) can approve or request changes */}
              {(handover.status === 'UNDER_REVIEW' || handover.status === 'IN_REVIEW') && (currentRole === 'REVIEWER' || currentRole === 'ADMIN') && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowChangesModal(true)}
                    className="px-3 py-2 bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    Request Changes
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowApproveModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve Handover
                  </button>
                </>
              )}

              {/* If APPROVED: Admin can share with Maya */}
              {handover.status === 'APPROVED' && currentRole !== 'INCOMING_MEMBER' && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => executeLifecycle('SHARE')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share With Maya Chen
                </button>
              )}

              {/* If SHARED or ACKNOWLEDGED: Link to Continuation Hub */}
              {(handover.status === 'SHARED' || handover.status === 'ACKNOWLEDGED') && (
                <Link
                  href="/continuation"
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Enter Continuation Workspace
                </Link>
              )}
            </div>
          </div>

          {actionNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'CONTENT', label: 'Handover Package Content', icon: FileEdit },
              { id: 'VERSIONS', label: `Version History (${handover.versions?.length || 1})`, icon: History },
              { id: 'REVIEW', label: 'Governance & Review Notes', icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as 'CONTENT' | 'VERSIONS' | 'REVIEW')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TAB 1: CONTENT */}
        {activeTab === 'CONTENT' && (
          <div className="space-y-4">
            {handover.sections && handover.sections.length > 0 ? (
              handover.sections.map((section) => (
                <div key={section.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Section {section.sectionOrder} &bull; {section.sectionKey}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans">
                    {section.contentMarkdown}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500">No sections found in this handover package.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: IMMUTABLE VERSIONS */}
        {activeTab === 'VERSIONS' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <History className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Immutable Version Ledger ({handover.versions?.length || 0} Snapshots)
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Every revision or reviewer sign-off creates a cryptographically timestamped snapshot. Previously approved versions cannot be silently rewritten.
            </p>

            <div className="space-y-3">
              {handover.versions?.map((ver, idx) => (
                <div
                  key={ver.id || idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                        v{ver.versionNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">
                        {ver.changeSummary}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDateTime(ver.createdAt)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60">
                    <span>Editor: <strong className="text-slate-800">{ver.changedByName}</strong></span>
                    {ver.approvedBy && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed off by {ver.approvedBy}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REVIEW NOTES */}
        {activeTab === 'REVIEW' && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Reviewer Governance Log & Annotations
              </h3>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Current Approval State:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(handover.status)}`}>
                  {handover.status}
                </span>
              </div>

              {handover.approvedBy && (
                <div>
                  <span className="font-bold text-slate-800">Approved By: </span>
                  <span className="text-slate-700">{handover.approvedBy} on {formatDateTime(handover.approvedAt || '')}</span>
                </div>
              )}

              {handover.reviewNotes && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                  <div className="font-bold text-slate-900 mb-1">Active Reviewer Notes:</div>
                  <p className="text-slate-700 leading-relaxed font-sans">{handover.reviewNotes}</p>
                </div>
              )}

              {handover.acknowledgement && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Formal Handover Receipt Signed
                  </div>
                  <p className="text-xs">
                    Recipient: <strong>{handover.acknowledgement.recipientName}</strong> ({handover.acknowledgement.recipientRole}) on {formatDateTime(handover.acknowledgement.acknowledgedAt)}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-700">
                    Fingerprint: {handover.acknowledgement.verificationFingerprint}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Request Changes */}
        {showChangesModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Request Revisions on Handover</h3>
              <p className="text-xs text-slate-600">
                Specify what changes Arjun Mehta or the author must make before this handover can be approved.
              </p>
              <textarea
                rows={3}
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                placeholder="e.g. Please clarify the database rollback script before final sign-off..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeLifecycle('REQUEST_CHANGES', changeNotes)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Approve Handover */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Approve Handover Package</h3>
              <p className="text-xs text-slate-600">
                You are approving this handover as <strong>{currentUser.name}</strong>. This creates an immutable approved version snapshot that can then be shared with Maya Chen.
              </p>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Optional reviewer sign-off comment..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeLifecycle('APPROVE', approvalNotes)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

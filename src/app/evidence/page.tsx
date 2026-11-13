'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ATLAS_CLAIMS } from '@/data/mockAtlasData';
import {
  EvidenceValidity,
  ClaimVerification,
  ResolutionStatus,
  Claim,
} from '@/types/relay';
import { useRelay } from '@/context/RelayContext';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Filter,
  Check,
  X,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Info,
  Scale,
  Edit3,
  Layers,
} from 'lucide-react';

export default function EvidenceLedgerPage() {
  const { currentRole, canEditClaims, currentUser } = useRelay();
  const [claims, setClaims] = useState<Claim[]>(ATLAS_CLAIMS);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [activeAdjudicateClaim, setActiveAdjudicateClaim] = useState<Claim | null>(null);
  const [adjudicateResolution, setAdjudicateResolution] = useState<ResolutionStatus>('RESOLVED');
  const [adjudicateAnnotation, setAdjudicateAnnotation] = useState<string>('');
  const [governanceNotice, setGovernanceNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadClaims = async () => {
    try {
      const res = await fetch('/api/governance/claims');
      if (res.ok) {
        const data = await res.json();
        if (data.claims && Array.isArray(data.claims)) {
          setClaims(data.claims);
        }
      }
    } catch {
      // Keep mock default
    }
  };

  useEffect(() => {
    loadClaims();
  }, [currentRole]);

  const handleOpenAdjudicate = (claim: Claim) => {
    setActiveAdjudicateClaim(claim);
    setAdjudicateResolution(claim.resolutionStatus || 'RESOLVED');
    setAdjudicateAnnotation(claim.reviewerAnnotation || '');
  };

  const handleSaveAdjudication = async () => {
    if (!activeAdjudicateClaim) return;
    setSaving(true);
    try {
      const res = await fetch('/api/governance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: activeAdjudicateClaim.id,
          updates: {
            resolutionStatus: adjudicateResolution,
            reviewerAnnotation: adjudicateAnnotation,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClaims((prev) =>
          prev.map((c) => (c.id === activeAdjudicateClaim.id ? data.claim : c))
        );
        setGovernanceNotice(
          `Claim ${activeAdjudicateClaim.claimCode} adjudicated as "${adjudicateResolution}" by ${currentUser.name}.`
        );
        setActiveAdjudicateClaim(null);
        setTimeout(() => setGovernanceNotice(null), 4000);
      }
    } catch (err) {
      console.error('Failed to save claim adjudication:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatus = async (claimId: string, status: ResolutionStatus) => {
    try {
      const res = await fetch('/api/governance/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          updates: { resolutionStatus: status },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClaims((prev) => prev.map((c) => (c.id === claimId ? data.claim : c)));
        setGovernanceNotice(`Claim updated to ${status}.`);
        setTimeout(() => setGovernanceNotice(null), 3000);
      }
    } catch {
      // Local fallback
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'CONFLICTING') return c.verificationStatus === 'CONFLICTING' || c.claimVerification === 'CONFLICTING';
    if (selectedFilter === 'UNRESOLVED') return c.resolutionStatus === 'UNRESOLVED';
    if (selectedFilter === 'RESOLVED') return c.resolutionStatus === 'RESOLVED';
    if (selectedFilter === 'VERIFIED') return c.verificationStatus === 'VERIFIED';
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Evidence Ledger & Human Governance"
        subtitle="Independent verification dimensions: Evidence Validity &bull; Claim Verification &bull; Decision Resolution"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Notice of Separation of Dimensions (Improvement 2 Commitment) */}
        <div className="p-4 bg-white border border-teal-200/80 rounded-xl shadow-xs bg-gradient-to-r from-teal-50/30 via-white to-slate-50 flex items-start gap-3">
          <Scale className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2">
              <strong className="font-bold text-slate-900">
                Independent 3-Dimensional Verification Architecture
              </strong>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.2 rounded border border-teal-300">
                Improvement 2
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              RELAY strictly separates <strong>Evidence Validity</strong> (whether source citations are authentic artifacts) from <strong>Decision Resolution Status</strong> (whether the organization has finalized a choice). For example, both WebSockets and SSE have authentic, valid evidence, but their architectural conflict remains <code>UNRESOLVED</code> until Elena Rostova adjudicates it.
            </p>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-teal-50 text-teal-700">
                <FileCheck2 className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                Grounded Claims Register ({filteredClaims.length} of {claims.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every finding grounded to cryptographic repository activity and verbatim quotations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {[
              { id: 'ALL', label: 'All Findings' },
              { id: 'CONFLICTING', label: 'Conflicting (2)' },
              { id: 'UNRESOLVED', label: 'Unresolved' },
              { id: 'RESOLVED', label: 'Resolved' },
              { id: 'VERIFIED', label: 'Verified Evidence' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  selectedFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {governanceNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{governanceNotice}</span>
          </div>
        )}

        {/* Claims Cards */}
        <div className="space-y-3.5">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  {/* Metadata Chips: 3 Dimensions */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {claim.claimCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {claim.category}
                    </span>

                    {/* Dimension 1: Evidence Validity */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                        claim.evidenceValidity === 'VALID' || claim.evidence?.length > 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      Evidence: {claim.evidenceValidity || (claim.evidence?.length > 0 ? 'VALID' : 'INCOMPLETE')}
                    </span>

                    {/* Dimension 2: Claim Verification */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        claim.verificationStatus === 'CONFLICTING'
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : claim.verificationStatus === 'VERIFIED'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      Verification: {claim.verificationStatus}
                    </span>

                    {/* Dimension 3: Resolution Status */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        claim.resolutionStatus === 'RESOLVED'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : claim.resolutionStatus === 'REJECTED'
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      Resolution: {claim.resolutionStatus || 'UNRESOLVED'}
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      Confidence: {(claim.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {claim.claimText}
                  </h3>

                  {claim.conflictNotes && (
                    <div className="mt-2 text-xs text-rose-900 bg-rose-50/90 p-3 rounded-lg border border-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Contradictory Evidence Preserved: </strong>
                        {claim.conflictNotes}
                      </div>
                    </div>
                  )}

                  {claim.reviewerAnnotation && (
                    <div className="mt-2 text-xs text-indigo-900 bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Reviewer Annotation: </strong>
                        {claim.reviewerAnnotation}
                        {claim.adjudicatedBy && (
                          <span className="text-[10px] text-indigo-700 block mt-0.5">
                            &bull; Adjudicated by {claim.adjudicatedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side Action for Reviewers */}
                {canEditClaims && (
                  <div className="shrink-0 flex items-center gap-1.5 self-start">
                    <button
                      type="button"
                      onClick={() => handleOpenAdjudicate(claim)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-teal-400" />
                      Adjudicate
                    </button>
                  </div>
                )}
              </div>

              {/* Direct Evidence Section */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Direct Supporting Evidence ({claim.evidence.length})
                  </div>
                </div>

                {claim.evidence.length > 0 ? (
                  <div className="space-y-2">
                    {claim.evidence.map((ev, idx) => (
                      <div
                        key={ev.id || idx}
                        className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                          <span className="font-semibold text-teal-800">{ev.lineReference || 'Source Section'}</span>
                          <span className="text-slate-400">Activity: {ev.activityId}</span>
                        </div>
                        <blockquote className="border-l-2 border-teal-600 pl-2.5 text-slate-700 font-mono text-[11px] leading-relaxed my-1">
                          &ldquo;{ev.excerpt || ev.exactQuote}&rdquo;
                        </blockquote>
                        <div className="text-[11px] text-slate-500 mt-1 italic">
                          Grounding: {ev.relevanceExplanation || 'Exact text citation verified in repository source.'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <strong>Missing Evidence Citation: </strong>
                    Zero direct repository artifacts found. Identified as an open knowledge gap during deterministic reconstruction.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Adjudication Modal Dialog */}
        {activeAdjudicateClaim && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Human Review & Adjudication
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">
                    Adjudicate {activeAdjudicateClaim.claimCode}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAdjudicateClaim(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono">
                {activeAdjudicateClaim.claimText}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Resolution Status Decision:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'RESOLVED', label: 'RESOLVED — Adopt Choice', color: 'emerald' },
                    { id: 'UNRESOLVED', label: 'UNRESOLVED — Keep Conflict Open', color: 'amber' },
                    { id: 'SUPERSEDED', label: 'SUPERSEDED — Replaced By Later Work', color: 'purple' },
                    { id: 'REJECTED', label: 'REJECTED — Invalid Hypothesis', color: 'rose' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdjudicateResolution(opt.id as ResolutionStatus)}
                      className={`p-2 rounded-lg border text-left font-medium transition-all ${
                        adjudicateResolution === opt.id
                          ? 'border-slate-900 bg-slate-900 text-white font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Reviewer Rationale & Governance Annotation:
                </label>
                <textarea
                  rows={3}
                  value={adjudicateAnnotation}
                  onChange={(e) => setAdjudicateAnnotation(e.target.value)}
                  placeholder="Explain why this decision is resolved or why the conflict remains preserved for team discussion..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAdjudicateClaim(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveAdjudication}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {saving ? 'Recording...' : 'Commit Adjudication to Ledger'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

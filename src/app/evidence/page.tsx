'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ATLAS_CLAIMS } from '@/data/mockAtlasData';
import { VerificationStatus, ClaimCategory, Claim } from '@/types/relay';
import { useRelay } from '@/context/RelayContext';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  Filter,
  Check,
  X,
  MessageSquare,
  ShieldAlert,
  Info,
  Hash,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export default function EvidenceLedgerPage() {
  const { canEditClaims } = useRelay();
  const [claims, setClaims] = useState<Claim[]>(ATLAS_CLAIMS);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [governanceNotice, setGovernanceNotice] = useState<string | null>(null);

  const handleAcceptClaim = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, verificationStatus: 'VERIFIED' as VerificationStatus, conflictNotes: undefined }
          : c
      )
    );
    setGovernanceNotice(`Claim ${claimId} approved by reviewer.`);
    setTimeout(() => setGovernanceNotice(null), 3000);
  };

  const handleRejectClaim = (claimId: string) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? { ...c, verificationStatus: 'UNVERIFIED' as VerificationStatus }
          : c
      )
    );
    setGovernanceNotice(`Claim ${claimId} demoted to UNVERIFIED.`);
    setTimeout(() => setGovernanceNotice(null), 3000);
  };

  const loadClaims = async () => {
    try {
      const res = await fetch('/api/intelligence/state');
      if (res.ok) {
        const data = await res.json();
        if (data.memory?.claims?.length > 0) {
          setClaims(data.memory.claims);
        }
      }
    } catch (err) {
      console.error('Failed to load claims state:', err);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  const filteredClaims = claims.filter((c) => {
    if (selectedStatus !== 'ALL' && c.verificationStatus !== selectedStatus) return false;
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Evidence & Confidence Ledger"
        subtitle="Immutable claim registry hard-grounded to repository commits, pull requests, and document excerpts"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
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
              Zero unbacked assertions. Every verified claim requires verified textual quotations from indexed sources.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {['ALL', 'VERIFIED', 'CONFLICTING', 'UNCERTAIN', 'UNVERIFIED'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
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

        {/* Claims Table / List */}
        <div className="space-y-3">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className={`bg-white border rounded-xl p-4 shadow-xs transition-all ${
                activeClaimId === claim.id ? 'border-teal-500 ring-2 ring-teal-50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {claim.claimCode}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {claim.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                      Confidence: <strong>{(claim.confidenceScore * 100).toFixed(0)}%</strong>
                    </span>
                    {claim.evidenceStrength && (
                      <span className="text-[10px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-1.5 py-0.2 rounded font-semibold">
                        Strength: {claim.evidenceStrength}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400">
                      Inference: {claim.inferenceType}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                    {claim.claimText}
                  </h3>

                  {claim.conflictNotes && (
                    <div className="mt-2 text-xs text-rose-800 bg-rose-50/80 p-2.5 rounded-lg border border-rose-200 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Contradictory Evidence Discovered: </strong>
                        {claim.conflictNotes}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {claim.verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      VERIFIED
                    </span>
                  )}
                  {claim.verificationStatus === 'CONFLICTING' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      CONFLICTING
                    </span>
                  )}
                  {claim.verificationStatus === 'UNCERTAIN' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      UNCERTAIN
                    </span>
                  )}
                  {claim.verificationStatus === 'UNVERIFIED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                      UNVERIFIED
                    </span>
                  )}
                </div>
              </div>

              {/* Evidence Drawer / Section */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Direct Supporting Evidence ({claim.evidence.length})
                  </div>
                  {claim.evidence.some((e) => e.isTruncated) && (
                    <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.2 rounded font-mono">
                      Notice: Source section was truncated to 3,000 chars during ingestion
                    </span>
                  )}
                </div>

                {claim.evidence.length > 0 ? (
                  <div className="space-y-2">
                    {claim.evidence.map((ev, idx) => (
                      <div
                        key={ev.id || idx}
                        className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                          <span className="font-semibold text-teal-800">{ev.lineReference || 'Activity Reference'}</span>
                          <span className="text-slate-400">Activity ID: {ev.activityId}</span>
                        </div>
                        <blockquote className="border-l-2 border-teal-600 pl-2.5 text-slate-700 font-mono text-[11px] leading-relaxed my-1">
                          &ldquo;{ev.excerpt || ev.exactQuote}&rdquo;
                        </blockquote>
                        <div className="text-[11px] text-slate-500 mt-1 italic flex items-center justify-between">
                          <span>Grounding: {ev.relevanceExplanation || 'Exact text verified in source content.'}</span>
                          {ev.isTruncated && (
                            <span className="text-[10px] text-amber-700 font-semibold not-italic">
                              [Truncated Section]
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <strong>Missing Evidence Citation: </strong>
                    Zero direct activity evidence found in the repository. Inferred through heuristic analysis. Barred from verified status until substantiated by team review.
                  </div>
                )}
              </div>

              {/* Reviewer Action Bar (Only visible if Admin/Reviewer) */}
              {canEditClaims && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">Simulate Reviewer Action:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptClaim(claim.id)}
                      className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-medium flex items-center gap-1 transition-colors"
                      title="Simulate reviewer approving and verifying this claim"
                    >
                      <Check className="w-3 h-3 text-emerald-600" /> Accept Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectClaim(claim.id)}
                      className="px-2.5 py-1 rounded bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-medium flex items-center gap-1 transition-colors"
                      title="Simulate reviewer rejecting claim as unverified"
                    >
                      <X className="w-3 h-3 text-rose-600" /> Reject Claim
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

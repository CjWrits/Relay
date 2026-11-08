'use client';

import React, { useState } from 'react';
import { ATLAS_CONTINUITY } from '@/data/mockAtlasData';
import { ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2, ChevronDown, ChevronUp, FileCode } from 'lucide-react';

export function ContinuityCard() {
  const [showFormula, setShowFormula] = useState(false);
  const { overallScore, factors, explanation } = ATLAS_CONTINUITY;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              Core Metric
            </span>
            <span className="text-xs text-slate-500 font-medium">Explainable & Measurable</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">Project Continuity Indicator</h2>
          <p className="text-xs text-slate-500 max-w-xl mt-0.5 leading-relaxed">
            Measures verifiable project memory and handover readiness through empirical evidence factors. No black-box AI scores.
          </p>
        </div>

        {/* Score Visual */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-lg self-start md:self-auto">
          <div className="relative flex items-center justify-center">
            <div className="text-3xl font-extrabold text-teal-700 tracking-tight font-mono">
              {overallScore}%
            </div>
          </div>
          <div className="text-left border-l border-slate-200 pl-3">
            <div className="text-xs font-semibold text-slate-800">Moderate Continuity</div>
            <div className="text-[11px] text-amber-700 font-medium">2 Critical Risks Blockers</div>
          </div>
        </div>
      </div>

      {/* Measurable Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
        {/* Factor 1 */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Evidence-Backed Claims</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-base font-bold text-slate-900 font-mono">
            {factors.verifiedClaimsPercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {factors.verifiedClaimsCount} of {factors.totalClaimsCount} verified
          </div>
        </div>

        {/* Factor 2 */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Unresolved Critical Risks</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-base font-bold text-rose-600 font-mono">
            {factors.unresolvedCriticalRisksCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">DB lock & Bastion tunnel</div>
        </div>

        {/* Factor 3 */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Ownership Gaps</span>
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-base font-bold text-amber-700 font-mono">
            {factors.ownershipGapsCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Worker maintenance orphan</div>
        </div>

        {/* Factor 4 */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Missing Rationale</span>
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-base font-bold text-slate-800 font-mono">
            {factors.missingRationaleCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">REST vs gRPC decision</div>
        </div>

        {/* Factor 5 */}
        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Pending Handover</span>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-base font-bold text-teal-700 font-mono">
            {factors.pendingHandoverReviewsCount} In Review
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Arjun -&gt; Maya under review</div>
        </div>
      </div>

      {/* Explanation & Toggleable Deterministic Calculation */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
        <p className="text-[11px] text-slate-500">{explanation}</p>
        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="text-teal-700 font-semibold flex items-center gap-1 hover:underline text-[11px] shrink-0 ml-3"
        >
          {showFormula ? 'Hide Formula' : 'View Exact Formula'}
          {showFormula ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showFormula && (
        <div className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono space-y-1">
          <div className="text-slate-400 font-semibold mb-1 text-[11px]">Deterministic Continuity Scoring Model:</div>
          <div>Continuity = 0.35 * (EvidenceRatio) + 0.25 * (1 - OwnershipGapRatio) + 0.20 * (1 - CriticalRisksRatio) + 0.20 * (HandoverApprovalRatio)</div>
          <div className="text-teal-400 text-[11px] mt-1">
            Calculated: (0.35 * 0.75) + (0.25 * 0.80) + (0.20 * 0.70) + (0.20 * 0.75) = 0.7825 (78%)
          </div>
        </div>
      )}
    </div>
  );
}

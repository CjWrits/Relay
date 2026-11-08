'use client';

import React, { useState } from 'react';
import { useRelay } from '@/context/RelayContext';
import { BrainCircuit, RefreshCw, CheckCircle2, AlertTriangle, Layers, HelpCircle, ShieldCheck, Zap } from 'lucide-react';

interface ReconstructMemoryBannerProps {
  onReconstructed?: () => void;
  onReconstructComplete?: () => void;
}

export function ReconstructMemoryBanner({
  onReconstructed,
  onReconstructComplete,
}: ReconstructMemoryBannerProps) {
  const { currentRole } = useRelay();
  const [isReconstructing, setIsReconstructing] = useState(false);
  const [providerMode, setProviderMode] = useState<'DETERMINISTIC' | 'LLM_ASSISTED'>('DETERMINISTIC');
  const [lastReport, setLastReport] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReconstruct = async () => {
    setIsReconstructing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/intelligence/reconstruct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentRole,
        },
        body: JSON.stringify({
          projectId: 'proj-atlas-001',
          providerMode,
          userRole: currentRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Memory reconstruction failed');
      }

      setLastReport(data.report);
      if (onReconstructed) {
        onReconstructed();
      }
      if (onReconstructComplete) {
        onReconstructComplete();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Reconstruction failed');
    } finally {
      setIsReconstructing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Project Memory Reconstruction Engine</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.2 rounded-full">
                Phase 3 Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Transforms raw repository activities into an empirical state model: Decisions, Ownership, Risks, Dependencies, and Knowledge Gaps.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
          {/* Provider Mode Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setProviderMode('DETERMINISTIC')}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors ${
                providerMode === 'DETERMINISTIC'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Deterministic (Zero-API)
            </button>
            <button
              type="button"
              onClick={() => setProviderMode('LLM_ASSISTED')}
              className={`px-2.5 py-1 rounded-md font-medium text-[11px] transition-colors flex items-center gap-1 ${
                providerMode === 'LLM_ASSISTED'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-500" />
              LLM-Assisted
            </button>
          </div>

          {currentRole === 'INCOMING_MEMBER' ? (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg font-medium">
              Incoming Member (Read-Only)
            </span>
          ) : (
            <button
              type="button"
              disabled={isReconstructing}
              onClick={handleReconstruct}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconstructing ? 'animate-spin' : ''}`} />
              {isReconstructing ? 'Reconstructing Memory...' : 'Reconstruct Project Memory'}
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Reconstruction Execution Metrics Report */}
      {lastReport && (
        <div className="mt-2 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/70 p-2.5 rounded-lg">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Analyzed: <strong className="text-slate-900 font-mono">{lastReport.activitiesProcessed}</strong> Activities
            </span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Entities: <strong className="text-slate-900 font-mono">{lastReport.entitiesDiscovered}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              Claims Validated: <strong className="text-slate-900 font-mono">{lastReport.claimsValidated}</strong>
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              Conflicts: <strong className="font-mono">{lastReport.conflictsDiscovered}</strong>
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              Gaps Surfaced: <strong className="font-mono">{lastReport.knowledgeGapsDiscovered}</strong>
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Runtime: {lastReport.executionDurationMs}ms ({lastReport.provider})
          </span>
        </div>
      )}
    </div>
  );
}

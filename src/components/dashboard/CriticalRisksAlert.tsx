'use client';

import React from 'react';
import Link from 'next/link';
import { AlertOctagon, ShieldAlert, ArrowRight, UserX } from 'lucide-react';
import { ATLAS_RISKS, ATLAS_TASKS } from '@/data/mockAtlasData';

export function CriticalRisksAlert() {
  const criticalRisks = ATLAS_RISKS.filter((r) => r.severity === 'CRITICAL');
  const unassignedTasks = ATLAS_TASKS.filter((t) => !t.assigneeId || t.assigneeName === 'Unassigned');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Critical Risk Card */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded bg-rose-100 text-rose-700">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Critical Blocker Risk Identified
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">{criticalRisks[0]?.title}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {criticalRisks[0]?.description}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-rose-200/70 flex items-center justify-between">
          <span className="text-[11px] font-mono text-rose-800">
            Source: MR #84 Review Note #12
          </span>
          <Link
            href="/evidence"
            className="text-xs font-semibold text-rose-800 hover:text-rose-900 flex items-center gap-1"
          >
            Inspect Evidence <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Ownership Gap Card */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 rounded bg-amber-100 text-amber-700">
              <UserX className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Unassigned Responsibility Gap
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900">{unassignedTasks[0]?.title}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {unassignedTasks[0]?.description}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between">
          <span className="text-[11px] font-mono text-amber-800">
            Orphan Status: Post-Arjun Departure
          </span>
          <Link
            href="/memory"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            Assign In Handover <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

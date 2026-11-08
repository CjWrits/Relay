'use client';

import React from 'react';
import Link from 'next/link';
import { Send, CheckCircle, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { ATLAS_HANDOVERS } from '@/data/mockAtlasData';
import { useRelay } from '@/context/RelayContext';

export function QuickHandoverBanner() {
  const handover = ATLAS_HANDOVERS[0];
  const { currentRole } = useRelay();

  return (
    <div className="bg-gradient-to-r from-teal-50 via-slate-50 to-indigo-50/50 border border-teal-200/80 rounded-xl p-4.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 border border-teal-300 px-2 py-0.5 rounded">
              Active Handover Workflow
            </span>
            <span className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
              Status: IN REVIEW
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-1">
            {handover.title}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Scope: <span className="font-medium text-slate-800">{handover.scope}</span> * Reviewer Elena flagged 1 conflicting decision and 1 table lock risk.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0">
        <Link
          href={`/handovers`}
          className="text-xs bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold px-3 py-2 rounded-lg transition-colors shadow-2xs"
        >
          Review Handover Package
        </Link>
        <Link
          href="/continuation"
          className="text-xs bg-teal-700 text-white hover:bg-teal-800 font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          Maya Continuation Plan <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useRelay } from '@/context/RelayContext';
import { ShieldCheck, Info, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'Project Atlas Overview', subtitle = 'Reconstructed project continuity dashboard' }: HeaderProps) {
  const { currentRole, currentUser, isDemoMode } = useRelay();

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h1 className="text-sm font-semibold text-slate-900 leading-none">{title}</h1>
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Synthetic Demonstration Mode Badge */}
        {isDemoMode && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-medium text-[11px]">Synthetic Demonstration Mode (Atlas)</span>
          </div>
        )}

        {/* Current Active Persona */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Role: <span className="text-teal-700 font-semibold">{currentRole}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-2xs">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}

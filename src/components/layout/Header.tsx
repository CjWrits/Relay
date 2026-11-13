'use client';

import React from 'react';
import Link from 'next/link';
import { useRelay } from '@/context/RelayContext';
import { Info, LogOut, LogIn, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = 'Project Atlas Overview', subtitle = 'Reconstructed project continuity dashboard' }: HeaderProps) {
  const { currentRole, currentUser, isDemoMode, isAuthenticated, logout } = useRelay();

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
            <span className="font-medium text-[11px]">Synthetic Demo Mode (Session Storage)</span>
          </div>
        )}

        {/* Current Active Persona or Login Button */}
        {isAuthenticated ? (
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

            <Link
              href="/login"
              onClick={() => logout()}
              title="Switch Persona / Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
              <ShieldAlert className="w-4 h-4" />
              <span>Not Authenticated</span>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors ml-2"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Select Persona</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

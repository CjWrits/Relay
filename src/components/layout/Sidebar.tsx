'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRelay } from '@/context/RelayContext';
import { UserRole } from '@/types/relay';
import {
  LayoutDashboard,
  FolderGit2,
  BrainCircuit,
  FileCheck2,
  Clock,
  GitGraph,
  Send,
  Compass,
  ShieldAlert,
  UserCheck,
  LogIn,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { currentRole, setCurrentRole, currentUser, currentProject } = useRelay();

  const navigationItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Source Connectors', href: '/sources', icon: FolderGit2, badge: '4 Connected' },
    { name: 'Memory Engine', href: '/memory', icon: BrainCircuit, badge: 'Reconstructed' },
    { name: 'Evidence Ledger', href: '/evidence', icon: FileCheck2, badge: '11 Claims' },
    { name: 'Project Timeline', href: '/timeline', icon: Clock },
    { name: 'Knowledge Graph', href: '/knowledge-graph', icon: GitGraph },
    { name: 'Handover Studio', href: '/handovers', icon: Send, badge: '1 Package' },
    { name: 'Continuation', href: '/continuation', icon: Compass, highlight: true },
    { name: 'Access & Security', href: '/settings/access', icon: ShieldAlert },
    { name: 'Demo Login / Switch', href: '/login', icon: LogIn },
  ];

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
  };

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold tracking-wider shadow-sm">
            R
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base">RELAY</span>
              <span className="text-[10px] bg-teal-50 text-teal-700 font-semibold px-1.5 py-0.5 rounded border border-teal-200">
                MVP v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Project Continuity Engine</p>
          </div>
        </div>
      </div>

      {/* Active Project Switcher */}
      <div className="px-3 pt-3 pb-2">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium uppercase tracking-wider text-[10px]">Active Project</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 text-sm">{currentProject.name}</span>
            <span className="text-xs bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono text-[10px]">
              {currentProject.slug}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/70'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-teal-200/60 text-teal-900'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher Simulator (Crucial for Demo & RBAC Inspection) */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            <span className="text-[11px] font-semibold text-slate-700">Demo Role Switcher</span>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
            Simulation
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mb-2 leading-tight">
          Simulates perspective views. Not production authentication.
        </p>

        {/* Current Simulated User info */}
        <div className="p-2 bg-white border border-slate-200 rounded-md mb-2 shadow-2xs">
          <div className="text-xs font-semibold text-slate-900">{currentUser.name}</div>
          <div className="text-[10px] text-slate-500 truncate">{currentUser.primaryRole}</div>
        </div>

        {/* Role toggle buttons */}
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`py-1 rounded font-medium transition-all ${
              currentRole === 'ADMIN'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('REVIEWER')}
            className={`py-1 rounded font-medium transition-all ${
              currentRole === 'REVIEWER'
                ? 'bg-teal-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}

          >
            Reviewer
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('INCOMING_MEMBER')}
            className={`py-1 rounded font-medium transition-all ${
              currentRole === 'INCOMING_MEMBER'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Incoming
          </button>
        </div>
      </div>
    </aside>
  );
}



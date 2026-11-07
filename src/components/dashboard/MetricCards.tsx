'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  Activity,
  Layers,
  AlertTriangle,
  ListTodo,
  FileText,
  ArrowRight,
} from 'lucide-react';
import {
  ATLAS_SOURCES,
  ATLAS_ACTIVITIES,
  ATLAS_DECISIONS,
  ATLAS_RISKS,
  ATLAS_TASKS,
  ATLAS_HANDOVERS,
} from '@/data/mockAtlasData';

export function MetricCards() {
  const metrics = [
    {
      title: 'Connected Sources',
      value: ATLAS_SOURCES.length,
      detail: 'GitLab & 3 Architecture Docs (Demo)',
      href: '/sources',
      icon: FolderGit2,
      accent: 'border-l-4 border-l-teal-600',
    },
    {
      title: 'Indexed Activities',
      value: ATLAS_ACTIVITIES.length,
      detail: 'Commits, MRs, Incident Logs',
      href: '/timeline',
      icon: Activity,
      accent: 'border-l-4 border-l-slate-600',
    },
    {
      title: 'Discovered Decisions',
      value: ATLAS_DECISIONS.length,
      detail: '2 Conflicting (SSE & Revocation)',
      href: '/memory',
      icon: Layers,
      accent: 'border-l-4 border-l-indigo-600',
    },
    {
      title: 'Active Technical Risks',
      value: ATLAS_RISKS.length,
      detail: '2 Critical (DB Lock & Bastion)',
      href: '/evidence',
      icon: AlertTriangle,
      accent: 'border-l-4 border-l-rose-600',
    },
    {
      title: 'Open Tasks / Gaps',
      value: ATLAS_TASKS.length,
      detail: '1 Blocker, 1 Unassigned',
      href: '/continuation',
      icon: ListTodo,
      accent: 'border-l-4 border-l-amber-600',
    },
    {
      title: 'Pending Handovers',
      value: ATLAS_HANDOVERS.length,
      detail: 'Arjun -> Maya (In Review)',
      href: '/handovers',
      icon: FileText,
      accent: 'border-l-4 border-l-teal-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Link
            key={metric.title}
            href={metric.href}
            className={`bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all group ${metric.accent}`}
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <Icon className="w-4 h-4 text-slate-600 group-hover:text-teal-700 transition-colors" />
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {metric.value}
            </div>
            <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{metric.title}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{metric.detail}</div>
          </Link>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderGit2,
  BrainCircuit,
  FileCheck2,
  Compass,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

export function WorkflowGuide() {
  const steps = [
    {
      num: '1',
      title: 'CONNECT',
      label: 'Multi-Source Ingestion',
      desc: 'Ingests GitLab commits, issues, MRs, and architecture docs. Preloaded with synthetic Atlas repository for demonstration.',
      href: '/sources',
      icon: FolderGit2,
      stat: '4 Preloaded Sources (Demo)',
      accent: 'border-teal-200 bg-teal-50/50 text-teal-800',
    },
    {
      num: '2',
      title: 'RECONSTRUCT',
      label: 'Deterministic Engine',
      desc: 'Transforms 18 raw activities into structured decisions, tasks, risks, dependencies, and explicit knowledge gaps.',
      href: '/memory',
      icon: BrainCircuit,
      stat: '5 Decisions * 5 Tasks',
      accent: 'border-indigo-200 bg-indigo-50/50 text-indigo-800',
    },
    {
      num: '3',
      title: 'VERIFY',
      label: 'Evidence & Integrity',
      desc: 'Anchors every claim to verbatim quotes. Preserves contradictions (SSE vs WS) without black-box AI guessing.',
      href: '/evidence',
      icon: FileCheck2,
      stat: '11 Grounded Claims',
      accent: 'border-emerald-200 bg-emerald-50/50 text-emerald-800',
    },
    {
      num: '4',
      title: 'HANDOVER',
      label: 'Continuity & Transfer',
      desc: 'Synthesizes verified knowledge into an actionable continuation plan for Maya Chen taking over from Arjun Mehta.',
      href: '/continuation',
      icon: Compass,
      stat: 'Day-1 Action Radar',
      accent: 'border-amber-200 bg-amber-50/50 text-amber-800',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
              How RELAY Works
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Self-Guided Evaluation Walkthrough
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">
            The 4-Step Project Continuity Engine
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            RELAY reconstructs institutional memory from raw software artifacts so critical context doesn&apos;t walk out the door when developers depart.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Preloaded Dataset: <strong>Atlas Core</strong>
          </span>
        </div>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Link
              key={step.title}
              href={step.href}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-slate-300 text-slate-700 font-mono text-xs font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <span className="text-[11px] font-extrabold tracking-wider text-slate-800 font-mono">
                      {step.title}
                    </span>
                  </div>
                  <Icon className="w-4 h-4 text-slate-500 group-hover:text-teal-700 transition-colors" />
                </div>

                <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
                  {step.label}
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-500 font-medium">{step.stat}</span>
                <span className="text-teal-700 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

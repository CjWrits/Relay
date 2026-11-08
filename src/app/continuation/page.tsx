'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import {
  ATLAS_TASKS,
  ATLAS_DECISIONS,
  ATLAS_RISKS,
  ATLAS_PEOPLE,
} from '@/data/mockAtlasData';
import { useRelay } from '@/context/RelayContext';
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  User,
  ExternalLink,
  ListOrdered,
  FileCheck2,
} from 'lucide-react';

export default function ContinuationWorkspacePage() {
  const { currentUser, currentRole } = useRelay();
  const [acknowledged, setAcknowledged] = useState(false);

  const prioritizedTasks = [
    {
      step: 1,
      title: 'Review Liam’s PR splitting v2.4_migration.sql',
      tag: 'CRITICAL BLOCKER',
      reason: 'Prevents database AccessExclusiveLock on 8M auth identities table in production.',
      assignedTo: 'Liam O’Connor & Maya Chen',
      evidence: 'MR #84 note_12',
      status: 'URGENT',
    },
    {
      step: 2,
      title: 'Implement in-memory JWKS public key cache in notification-broker',
      tag: 'INCIDENT #11 REMEDIATION',
      reason: 'Stops cascading worker starvation when auth-service restarts.',
      assignedTo: 'Maya Chen',
      evidence: 'Post-Mortem Incident #11',
      status: 'HIGH',
    },
    {
      step: 3,
      title: 'Complete /auth/callback/google OAuth2 handler',
      tag: 'UNFINISHED FEATURE',
      reason: 'Scaffolding merged by Arjun in MR #84; needs error boundary and user upsert.',
      assignedTo: 'Maya Chen',
      evidence: 'MR #84 description',
      status: 'HIGH',
    },
    {
      step: 4,
      title: 'Migrate staging deploy pipeline away from Arjun’s manual SSH tunnel',
      tag: 'INFRASTRUCTURE RISK',
      reason: 'Liam to configure VPC peering for automated CI runner.',
      assignedTo: 'Liam O’Connor',
      evidence: 'handover-draft-arjun-notes.txt line 14',
      status: 'MEDIUM',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Continuation Workspace — Incoming Engineer"
        subtitle="Answers: 'I just joined this project. What should I do next?'"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Day 1 Focus Hero Card */}
        <div className="bg-white border border-teal-300 rounded-xl p-5 shadow-xs bg-gradient-to-br from-white via-teal-50/20 to-slate-50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 border border-teal-300 px-2 py-0.5 rounded">
                    Day-1 Action Radar
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Incoming Engineer: <strong>Maya Chen</strong>
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Atlas Core Onboarding & Knowledge Continuation
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                  You have inherited ownership of the `auth-service` and API ingress layers following Arjun Mehta&apos;s departure. The 4 action items below are ranked by blocker severity.
                </p>
              </div>
            </div>

            {/* Formal Acknowledgment Button */}
            <div className="shrink-0 self-end md:self-auto flex flex-col items-end gap-1">
              {acknowledged ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Receipt Acknowledged (Demo Session)
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAcknowledged(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-teal-400" />
                  Simulate Receipt Acknowledgment
                </button>
              )}
              <span className="text-[10px] text-slate-400 font-mono">
                {acknowledged ? 'Walkthrough verified' : 'Simulates Day-1 sign-off'}
              </span>
            </div>
          </div>
        </div>

        {/* Prioritized Action Checklist */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Prioritized Action Items for Week 1
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">4 Actionable Steps</span>
          </div>

          <div className="space-y-3">
            {prioritizedTasks.map((task) => (
              <div
                key={task.step}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 font-mono shadow-2xs">
                      {task.step}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-mono">
                          {task.tag}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{task.reason}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      task.status === 'URGENT'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 pl-9">
                  <span>Collaborator: <strong className="text-slate-800">{task.assignedTo}</strong></span>
                  <span className="font-mono text-teal-800">Grounding: {task.evidence}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts Directory */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Key Project Stakeholders & Escalation Contacts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ATLAS_PEOPLE.slice(1, 4).map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="font-bold text-slate-900">{p.name}</div>
                <div className="text-[11px] text-slate-500">{p.primaryRole}</div>
                <div className="text-[10px] font-mono text-teal-700 mt-1">{p.email}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

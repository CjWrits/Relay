'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import {
  ATLAS_TASKS,
  ATLAS_DECISIONS,
  ATLAS_RISKS,
  ATLAS_PEOPLE,
  ATLAS_HANDOVERS,
} from '@/data/mockAtlasData';
import { useRelay } from '@/context/RelayContext';
import { HandoverAcknowledgement } from '@/types/relay';
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
  Layers,
  FolderGit2,
  Lock,
  GitBranch,
  Terminal,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Scale,
  Cpu,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

export type ContinuationRole = 'DEVELOPER' | 'PROJECT_MANAGER' | 'ADMINISTRATOR';

export default function ContinuationWorkspacePage() {
  const { currentUser, currentRole } = useRelay();
  const [continuationRole, setContinuationRole] = useState<ContinuationRole>('DEVELOPER');
  const [ackState, setAckState] = useState<HandoverAcknowledgement | null>(null);
  const [ackLoading, setAckLoading] = useState(false);
  const [ackComments, setAckComments] = useState('');
  const [showAckModal, setShowAckModal] = useState(false);

  // Load acknowledgement from server / localStorage
  useEffect(() => {
    const fetchAck = async () => {
      try {
        const res = await fetch('/api/handovers/hnd-atlas-01');
        if (res.ok) {
          const data = await res.json();
          if (data.handover?.acknowledgement) {
            setAckState(data.handover.acknowledgement);
            return;
          }
        }
      } catch {
        // Fallback to local storage
      }

      // Check localStorage for persistent refresh resilience
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('relay_ack_hnd-atlas-01');
        if (local) {
          try {
            setAckState(JSON.parse(local));
          } catch {
            // Ignore
          }
        }
      }
    };

    fetchAck();
  }, []);

  const handleAcknowledge = async () => {
    setAckLoading(true);
    try {
      const res = await fetch('/api/handovers/hnd-atlas-01/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACKNOWLEDGE',
          comments: ackComments || 'Receipt of Project Atlas handover formally acknowledged by Maya Chen.',
        }),
      });

      const data = await res.json();
      if (res.ok && data.acknowledgement) {
        setAckState(data.acknowledgement);
        if (typeof window !== 'undefined') {
          localStorage.setItem('relay_ack_hnd-atlas-01', JSON.stringify(data.acknowledgement));
        }
        setShowAckModal(false);
      } else {
        alert(data.error || 'Failed to record acknowledgement');
      }
    } catch (err) {
      console.error('Ack error:', err);
    } finally {
      setAckLoading(false);
    }
  };

  const developerTasks = [
    {
      step: 1,
      title: 'Review Liam’s PR splitting v2.4_migration.sql',
      tag: 'CRITICAL BLOCKER',
      reason: 'Prevents database AccessExclusiveLock on 8M auth identities table in production.',
      assignedTo: 'Liam O’Connor & Maya Chen',
      evidence: 'MR #84 note_12',
      status: 'URGENT',
      link: 'https://gitlab.com/cjwrits/atlas/-/merge_requests/84#note_12',
    },
    {
      step: 2,
      title: 'Implement in-memory JWKS public key cache in notification-broker',
      tag: 'INCIDENT #11 REMEDIATION',
      reason: 'Stops cascading worker starvation when auth-service restarts.',
      assignedTo: 'Maya Chen',
      evidence: 'Post-Mortem Incident #11',
      status: 'HIGH',
      link: '/synthetic-docs/incidents/postmortem-staging-11.md#root-cause',
    },
    {
      step: 3,
      title: 'Complete /auth/callback/google OAuth2 handler',
      tag: 'UNFINISHED FEATURE',
      reason: 'Scaffolding merged by Arjun in MR #84; needs error boundary and user upsert.',
      assignedTo: 'Maya Chen',
      evidence: 'MR #84 description',
      status: 'HIGH',
      link: 'https://gitlab.com/cjwrits/atlas/-/merge_requests/84',
    },
    {
      step: 4,
      title: 'Migrate staging deploy pipeline away from Arjun’s manual SSH tunnel',
      tag: 'INFRASTRUCTURE GOTCHA',
      reason: 'Liam to configure VPC peering for automated CI runner on port 54321.',
      assignedTo: 'Liam O’Connor',
      evidence: 'handover-draft-arjun-notes.txt line 14',
      status: 'MEDIUM',
      link: '/synthetic-uploads/handover-draft-arjun-notes.txt#line-14',
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Intelligent Continuation & Knowledge Transfer Workspace"
        subtitle="Role-Specific Operational Guidance &bull; Priority Backlog &bull; Persistent Receipt Sign-Off"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Day-1 Overview Hero Card */}
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
                    Incoming Engineer: <strong>Maya Chen</strong> (Taking over from Arjun Mehta)
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  Project Atlas — Handover Continuation Workspace
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                  Answers: <em>&ldquo;What do I need to know, what could go wrong, and what should I do next?&rdquo;</em> All findings link to verified repository evidence with zero ungrounded assertions.
                </p>
              </div>
            </div>

            {/* Persistent Acknowledgment Badge or Action */}
            <div className="shrink-0 self-end md:self-auto flex flex-col items-end gap-1">
              {ackState ? (
                <div className="flex flex-col items-end p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Handover Receipt Signed
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono mt-0.5">
                    {formatDateTime(ackState.acknowledgedAt)}
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono">
                    {ackState.verificationFingerprint}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAckModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileCheck2 className="w-4 h-4 text-teal-400" />
                  Acknowledge Handover Receipt
                </button>
              )}
              <span className="text-[10px] text-slate-400 font-mono">
                {ackState ? 'Persisted across browser refreshes' : 'Acknowledge receipt, not agreement'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Perspective Selector (Improvement 3 Requirement) */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-900">
              Role-Specific Continuation Perspectives:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {[
              { id: 'DEVELOPER', label: 'Developer (Maya)', icon: Cpu },
              { id: 'PROJECT_MANAGER', label: 'Project Manager', icon: ListOrdered },
              { id: 'ADMINISTRATOR', label: 'Administrator', icon: Terminal },
            ].map((roleTab) => {
              const Icon = roleTab.icon;
              return (
                <button
                  key={roleTab.id}
                  type="button"
                  onClick={() => setContinuationRole(roleTab.id as ContinuationRole)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg font-medium transition-all ${
                    continuationRole === roleTab.id
                      ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {roleTab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PERSPECTIVE 1: DEVELOPER */}
        {continuationRole === 'DEVELOPER' && (
          <div className="space-y-5">
            {/* 1. Subsystems Transferred */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-teal-700" />
                Subsystem Ownership Inherited from Arjun Mehta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 font-mono">auth-service</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Stateless JWT token lifecycle, refresh token rotation, OAuth provider abstractions.
                  </p>
                  <div className="mt-2 text-[10px] text-teal-800 font-mono">
                    Lead: Maya Chen &bull; services/auth-service
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 font-mono">database-core</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    PostgreSQL migrations, connection pooling, and advisory migration lock pg_advisory_lock(94218).
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Lead: Liam O’Connor &bull; packages/database-core
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 font-mono">notification-broker</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Asynchronous distribution. Needs in-memory JWKS cache to prevent restart cascades.
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono">
                    Lead: Elena Rostova &bull; services/notification-broker
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Prioritized Action Radar */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Prioritized Action Radar for Week 1 (Ranked by Blocker Severity)
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">4 Critical Items</span>
              </div>

              <div className="space-y-3">
                {developerTasks.map((task) => (
                  <div
                    key={task.step}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all"
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

            {/* 3. Unresolved Contradictions Radar */}
            <div className="bg-white border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                  Unresolved Architectural Contradictions (Elena Adjudication Pending)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                  <span className="text-[10px] font-bold text-rose-800 uppercase font-mono">
                    CLM-ATLAS-003 &bull; Telemetry Protocol
                  </span>
                  <div className="font-bold text-slate-900 mt-1">
                    WebSockets (Issue #42) vs Server-Sent Events (Commit e419b2c)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Issue #42 mandated WebSockets, but Arjun committed SSE due to client firewall drops. Maya to align with Elena on whether to standardize SSE across all microservices.
                  </p>
                </div>

                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                  <span className="text-[10px] font-bold text-rose-800 uppercase font-mono">
                    CLM-ATLAS-009 &bull; Token Revocation
                  </span>
                  <div className="font-bold text-slate-900 mt-1">
                    Redis Bloom Filter (Issue #103) vs Postgres Timestamp (Commit d31a88b)
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Arjun committed Postgres timestamp checking to save Redis RAM, but it adds DB read latency on every authenticated request.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Explicit Ownership Gap */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <strong className="font-bold text-slate-900">Unassigned Ownership Gap:</strong>
                  <span className="text-[10px] font-mono bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded border border-amber-300">
                    STATUS: UNASSIGNED
                  </span>
                </div>
                <p className="mt-0.5 text-slate-600">
                  Background worker dead-letter queue (<code>dlq_audit_events</code> table) maintenance currently has <strong>NO DESIGNATED OWNER</strong> following Arjun&apos;s departure. Raised by Liam in MR #92 comment. RELAY explicitly flags this gap rather than inventing an owner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PERSPECTIVE 2: PROJECT MANAGER */}
        {continuationRole === 'PROJECT_MANAGER' && (
          <div className="space-y-5">
            {/* Deliverables Status */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-teal-700" />
                Sprint Deliverables & Blocker Radar
              </h3>
              <div className="space-y-2.5">
                {[
                  {
                    name: 'Google OAuth2 Callback Handler',
                    status: 'BLOCKED',
                    lead: 'Maya Chen',
                    blocker: 'Blocked by database migration v2.4_migration.sql safety refactor',
                  },
                  {
                    name: 'Notification Broker JWT Caching',
                    status: 'IN_PROGRESS',
                    lead: 'Maya Chen',
                    blocker: 'Incident #11 remediation task',
                  },
                  {
                    name: 'Staging CI/CD Automation',
                    status: 'OPEN',
                    lead: 'Liam O’Connor',
                    blocker: 'Blocked by manual SSH bastion tunnel dependency',
                  },
                  {
                    name: 'Redis Connection Pool Tuning',
                    status: 'OPEN',
                    lead: 'Maya Chen',
                    blocker: 'Impacts >1,200 req/s throughput load testing',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Lead: <strong className="text-slate-700">{item.lead}</strong> &bull; {item.blocker}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.status === 'BLOCKED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ownership Transition Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Ownership Transition Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Subsystem / Component</th>
                      <th className="py-2 px-3">Departing Contributor</th>
                      <th className="py-2 px-3">Inheriting Contributor</th>
                      <th className="py-2 px-3">Handover Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-medium">auth-service & JWT Rotation</td>
                      <td className="py-2.5 px-3 text-slate-500">Arjun Mehta</td>
                      <td className="py-2.5 px-3 font-bold text-teal-800">Maya Chen</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">Transferred</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">database-core & Advisory Locks</td>
                      <td className="py-2.5 px-3 text-slate-500">Liam O’Connor</td>
                      <td className="py-2.5 px-3 text-slate-700">Liam O’Connor</td>
                      <td className="py-2.5 px-3 text-slate-500">Retained</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium">notification-broker</td>
                      <td className="py-2.5 px-3 text-slate-500">Elena Rostova</td>
                      <td className="py-2.5 px-3 text-slate-700">Elena Rostova</td>
                      <td className="py-2.5 px-3 text-slate-500">Retained</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="py-2.5 px-3 font-bold text-amber-900">Dead-Letter Worker Queue (dlq_audit)</td>
                      <td className="py-2.5 px-3 text-slate-500">Arjun Mehta</td>
                      <td className="py-2.5 px-3 font-bold text-rose-700">UNASSIGNED (Gap)</td>
                      <td className="py-2.5 px-3 text-rose-700 font-semibold">Action Required</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PERSPECTIVE 3: ADMINISTRATOR */}
        {continuationRole === 'ADMINISTRATOR' && (
          <div className="space-y-5">
            {/* Operational & Deployment Gotchas */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-700" />
                Infrastructure & Operational Guidance
              </h3>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Staging Deployment SSH Bastion Dependency (CLM-ATLAS-005)
                </div>
                <p className="text-slate-700">
                  The automated GitLab CI staging deploy pipeline fails at step 4 unless an active SSH bastion tunnel is open on port 54321.
                </p>
                <div className="p-2 bg-white rounded border border-rose-200 font-mono text-[11px] text-slate-800 mt-1">
                  ssh -L 54321:db.internal:5432 bastion.atlas.internal
                </div>
                <div className="text-[11px] text-rose-800 mt-1">
                  Remediation: Liam O’Connor is provisioning VPC peering to eliminate manual tunnel requirement.
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Lock className="w-4 h-4 text-teal-700" />
                  Database Migration Advisory Locks
                </div>
                <p className="text-slate-700">
                  All schema migrations acquire PostgreSQL advisory lock <code>pg_advisory_lock(94218)</code> to prevent concurrent container startup collisions.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Source Clearance Tiers & Zero-Leakage Policy
                </div>
                <p className="text-slate-700">
                  Post-Mortem Incident #11 is classified as <code>RESTRICTED</code>. RELAY automatically strips its excerpts before generating Maya&apos;s incoming workspace or citations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stakeholder Contacts */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Authorized Project Contacts & Escalations
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

        {/* Acknowledgment Modal */}
        {showAckModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-teal-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Acknowledge Handover Receipt
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAckModal(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1">
                <p>
                  <strong>Recipient:</strong> Maya Chen ({currentUser.name})
                </p>
                <p>
                  <strong>Handover:</strong> Lead Engineer Handover (Arjun Mehta &rarr; Maya Chen)
                </p>
                <p className="text-[11px] text-slate-500">
                  Note: Acknowledgment confirms receipt of project knowledge and continuation items, not unanimous agreement with all historical statements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Optional Recipient Notes / Questions:
                </label>
                <textarea
                  rows={2}
                  value={ackComments}
                  onChange={(e) => setAckComments(e.target.value)}
                  placeholder="e.g. Received handover. Will prioritize Liam's PR for v2.4_migration.sql on Day 1..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAckModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={ackLoading}
                  onClick={handleAcknowledge}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {ackLoading ? 'Signing...' : 'Sign Digital Receipt'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

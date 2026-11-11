'use client';

import React from 'react';
import { Header } from '@/components/layout/Header';
import { ATLAS_AUDIT_LOGS } from '@/data/mockAtlasData';
import { ShieldCheck, Lock, UserCheck, Eye, ShieldAlert, History } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';

export default function AccessSecurityPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Role-Based Access Control & Security Policies"
        subtitle="Manage source classification tiers, permissions, and inspect immutable audit provenance"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Prototype Walkthrough Notice */}
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong>RBAC Policy Architecture: </strong>
            Outlines the role-based access control and source-level clearance policies designed for RELAY. In this standalone prototype walkthrough, the Demo Role Switcher in the left sidebar simulates perspective views for Marcus (Admin), Elena (Reviewer), and Maya (Incoming Member). Production Supabase Auth session enforcement is scheduled for Phase 4/5.
          </div>
        </div>

        {/* RBAC Matrix Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Role-Based Access Control (RBAC) Permissions Matrix
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Permission Scope</th>
                  <th className="py-2.5 px-3 text-center">Admin (Marcus)</th>
                  <th className="py-2.5 px-3 text-center">Reviewer (Elena)</th>
                  <th className="py-2.5 px-3 text-center">Incoming Member (Maya)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-medium">Connect / Manage GitLab Repositories</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">View Restricted / Incident Sources</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No (Leak Protected)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Adjudicate Conflicts & Edit Claims</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Approve Handover Drafts</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Access Approved Continuation Workspace</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-medium">Sign Handover Acknowledgment</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">&times; No</td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">&#10003; Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Immutable Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <History className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Immutable Project Audit Trail ({ATLAS_AUDIT_LOGS.length} Events)
            </h3>
          </div>

          <div className="space-y-2.5">
            {ATLAS_AUDIT_LOGS.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.2 rounded">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.entityName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Actor: <strong className="text-slate-700">{log.actorName}</strong> * Target:{' '}
                    <span className="font-mono">{log.entityType}</span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

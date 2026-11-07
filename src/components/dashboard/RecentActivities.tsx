'use client';

import React from 'react';
import Link from 'next/link';
import {
  GitCommit,
  GitPullRequest,
  AlertCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react';
import { ATLAS_ACTIVITIES, ATLAS_CLAIMS } from '@/data/mockAtlasData';
import { VerificationStatus } from '@/types/relay';
import { formatDate } from '@/lib/utils/date';

function StatusBadge({ status }: { status: VerificationStatus }) {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          VERIFIED
        </span>
      );
    case 'CONFLICTING':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          CONFLICTING
        </span>
      );
    case 'UNCERTAIN':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <HelpCircle className="w-3 h-3 text-amber-600" />
          UNCERTAIN
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
          UNVERIFIED
        </span>
      );
  }
}

export function RecentActivities() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activity Stream */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Ingested Project Activities</h3>
            <p className="text-[11px] text-slate-500">Commits, MRs, and documentation from Atlas</p>
          </div>
          <Link
            href="/timeline"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Full Timeline
          </Link>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {ATLAS_ACTIVITIES.slice(0, 5).map((activity) => (
            <div key={activity.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {activity.activityType === 'COMMIT' && (
                    <GitCommit className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  {activity.activityType === 'MERGE_REQUEST' && (
                    <GitPullRequest className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  {activity.activityType === 'ISSUE' && (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  {activity.activityType === 'DOCUMENT_CHUNK' && (
                    <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                  {activity.activityType === 'ISSUE_COMMENT' && (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {activity.title}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {formatDate(activity.activityTimestamp)}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 pl-6">
                {activity.contentBody}
              </p>
              <div className="flex items-center gap-3 pl-6 mt-1.5 text-[10px] text-slate-400">
                <span className="font-medium text-slate-600">{activity.authorName}</span>
                <span>*</span>
                <span className="font-mono">{activity.externalReferenceId}</span>
                {activity.accessLevel === 'RESTRICTED' && (
                  <span className="text-rose-600 font-semibold bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                    RESTRICTED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grounded Claims Stream */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Grounded Claims Ledger</h3>
            <p className="text-[11px] text-slate-500">Every assertion linked to source evidence</p>
          </div>
          <Link
            href="/evidence"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Inspect Ledger
          </Link>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {ATLAS_CLAIMS.slice(0, 5).map((claim) => (
            <div key={claim.id} className="py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                    {claim.claimCode}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {claim.category}
                  </span>
                </div>
                <StatusBadge status={claim.verificationStatus} />
              </div>
              <p className="text-xs font-medium text-slate-800 mt-1 leading-snug">
                {claim.claimText}
              </p>
              {claim.conflictNotes && (
                <div className="mt-1 text-[11px] text-rose-700 bg-rose-50/70 p-1.5 rounded border border-rose-200/60">
                  <span className="font-semibold">Conflict: </span>
                  {claim.conflictNotes}
                </div>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                <span>Confidence: {(claim.confidenceScore * 100).toFixed(0)}%</span>
                <span>*</span>
                <span>{claim.evidence.length} Evidence Citations</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

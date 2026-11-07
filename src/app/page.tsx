import React from 'react';
import { Header } from '@/components/layout/Header';
import { WorkflowGuide } from '@/components/dashboard/WorkflowGuide';
import { ContinuityCard } from '@/components/dashboard/ContinuityCard';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { CriticalRisksAlert } from '@/components/dashboard/CriticalRisksAlert';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { QuickHandoverBanner } from '@/components/dashboard/QuickHandoverBanner';
import { ReconstructMemoryBanner } from '@/components/intelligence/ReconstructMemoryBanner';

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Project Atlas — Continuity Dashboard"
        subtitle="Empirical state reconstruction from 4 demonstration sources (Atlas synthetic repository) and 18 indexed activities"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* 4-Step Self-Guided Evaluation Workflow */}
        <WorkflowGuide />

        {/* Active Handover Status Banner */}
        <QuickHandoverBanner />

        {/* Intelligence Engine Reconstruction Control */}
        <ReconstructMemoryBanner />

        {/* Core Metric: Explainable Continuity Indicator */}
        <ContinuityCard />

        {/* High-Level Metric Tiles */}
        <MetricCards />

        {/* Critical Risks and Ownership Gaps Radar */}
        <CriticalRisksAlert />

        {/* Activities and Grounded Claims Ledger */}
        <RecentActivities />
      </main>
    </div>
  );
}

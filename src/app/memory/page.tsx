'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import {
  ATLAS_DECISIONS,
  ATLAS_TASKS,
  ATLAS_RISKS,
  ATLAS_DEPENDENCIES,
  ATLAS_UNRESOLVED_QUESTIONS,
} from '@/data/mockAtlasData';
import { ReconstructMemoryBanner } from '@/components/intelligence/ReconstructMemoryBanner';
import {
  BrainCircuit,
  Layers,
  ListTodo,
  AlertTriangle,
  GitBranch,
  HelpCircle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Info,
  X,
  FileCode,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import { Decision, Task, Risk, Dependency, KnowledgeGap } from '@/types/relay';

export default function MemoryEnginePage() {
  const [decisions, setDecisions] = useState<Decision[]>(ATLAS_DECISIONS);
  const [tasks, setTasks] = useState<Task[]>(ATLAS_TASKS);
  const [risks, setRisks] = useState<Risk[]>(ATLAS_RISKS);
  const [dependencies, setDependencies] = useState<Dependency[]>(ATLAS_DEPENDENCIES);
  const [knowledgeGaps, setKnowledgeGaps] = useState<KnowledgeGap[]>(
    ATLAS_UNRESOLVED_QUESTIONS.map((q) => ({
      id: q.id,
      projectId: q.projectId,
      title: q.title,
      description: q.description,
      category: q.category as any,
      impact: q.impact,
      sourceActivityIds: [],
      createdAt: '2026-11-06T12:00:00Z',
    }))
  );

  const [selectedItemForEvidence, setSelectedItemForEvidence] = useState<{
    title: string;
    type: string;
    summary: string;
    rationale?: string;
    evidenceText?: string;
    details?: Record<string, any>;
  } | null>(null);

  const loadMemoryState = async () => {
    try {
      const res = await fetch('/api/intelligence/state');
      if (res.ok) {
        const data = await res.json();
        if (data.memory) {
          if (data.memory.decisions?.length > 0) setDecisions(data.memory.decisions);
          if (data.memory.tasks?.length > 0) setTasks(data.memory.tasks);
          if (data.memory.risks?.length > 0) setRisks(data.memory.risks);
          if (data.memory.dependencies?.length > 0) setDependencies(data.memory.dependencies);
          if (data.memory.knowledgeGaps?.length > 0) setKnowledgeGaps(data.memory.knowledgeGaps);
        }
      }
    } catch (err) {
      console.error('Failed to load memory state:', err);
    }
  };

  useEffect(() => {
    loadMemoryState();
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <Header
        title="Project Memory Engine"
        subtitle="Reconstructed structured knowledge: Decisions, Ownership, Unfinished Tasks, Dependencies & Risks"
      />

      <main className="p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Reconstruct Project Memory Banner with Run Controls */}
        <ReconstructMemoryBanner onReconstructed={loadMemoryState} />

        {/* Section 1: Discovered Decisions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">
                1. Reconstructed Decisions ({decisions.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Explicit Rationale Grounding
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {decisions.map((dec) => {
              const isConflicting = dec.title.includes('[CONFLICTING]');
              return (
                <div
                  key={dec.id}
                  className={`bg-white border rounded-xl p-4 shadow-xs flex flex-col justify-between transition-all ${
                    isConflicting ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isConflicting
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {isConflicting ? 'CONFLICTING' : 'VERIFIED'}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                          Explicit
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(dec.decidedAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{dec.title}</h4>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{dec.decisionSummary}</p>

                    <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Rationale: </span>
                      {dec.rationale}
                    </div>

                    {dec.alternativesConsidered && (
                      <div className="mt-1.5 p-2 bg-amber-50/50 border border-amber-100 rounded text-[11px] text-amber-800">
                        <span className="font-semibold text-amber-900">Alternatives: </span>
                        {dec.alternativesConsidered}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Decided by: <strong className="text-slate-800">{dec.madeByName || 'Lead Engineer'}</strong></span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedItemForEvidence({
                          title: dec.title,
                          type: 'Architectural Decision',
                          summary: dec.decisionSummary,
                          rationale: dec.rationale,
                          details: {
                            decidedBy: dec.madeByName,
                            decidedAt: dec.decidedAt,
                            status: dec.status,
                            alternatives: dec.alternativesConsidered,
                          },
                        })
                      }
                      className="text-teal-700 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      <Info className="w-3 h-3" /> Inspect Evidence
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Unfinished Work & Tasks */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                2. Unfinished Work & Open Tasks ({tasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Deduplicated from Issues/MRs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          task.status === 'BLOCKED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {task.status}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{task.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Priority: {task.priority}</span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{task.description}</p>

                  {task.blockerReason && (
                    <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded border border-rose-200">
                      <strong>Blocker: </strong>{task.blockerReason}
                    </div>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Assignee: <strong className="text-slate-800">{task.assigneeName}</strong></span>
                  <span className="text-slate-400 font-mono">ID: {task.id}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Dependencies & Risks */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dependencies */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">3. Subsystem Dependencies ({dependencies.length})</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Topological Graph Edges</span>
            </div>
            <div className="space-y-2.5">
              {dependencies.map((dep) => (
                <div key={dep.id} className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <span>{dep.sourceEntityName}</span>
                    <span className="text-slate-400 font-normal">&rarr;</span>
                    <span>{dep.targetEntityName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{dep.description}</span>
                    {dep.isBlocking && (
                      <span className="text-rose-600 font-bold text-[10px] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        BLOCKING
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">4. Technical Risks & Vulnerabilities ({risks.length})</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Impact Analysis</span>
            </div>
            <div className="space-y-2.5">
              {risks.map((risk) => (
                <div key={risk.id} className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{risk.title}</span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{risk.description}</p>
                  {risk.mitigationStrategy && (
                    <div className="mt-1.5 text-[10px] text-slate-700 bg-white p-1.5 rounded border border-slate-200">
                      <strong className="text-teal-800">Recommendation:</strong> {risk.mitigationStrategy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4: Unresolved Knowledge Gaps & Questions */}
        <section className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">
                5. Outstanding Knowledge Gaps & Unresolved Questions ({knowledgeGaps.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
              Zero Invention Rule: Gaps Preserved Explicitly
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {knowledgeGaps.map((gap) => (
              <div key={gap.id} className="p-3 bg-amber-50/40 border border-amber-200 rounded-lg text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-800 font-bold mb-1">
                    <span>CATEGORY: {gap.category}</span>
                    <span>GAP</span>
                  </div>
                  <h4 className="font-bold text-slate-900 leading-snug">{gap.title}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{gap.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[10px] text-rose-800 font-medium">
                  <strong>Risk Impact: </strong>{gap.impact}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal: Evidence Inspection */}
        {selectedItemForEvidence && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-teal-700" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{selectedItemForEvidence.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400">{selectedItemForEvidence.type}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemForEvidence(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Summary</div>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                    {selectedItemForEvidence.summary}
                  </p>
                </div>

                {selectedItemForEvidence.rationale && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Documented Rationale</div>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                      {selectedItemForEvidence.rationale}
                    </p>
                  </div>
                )}

                {selectedItemForEvidence.details && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Metadata</div>
                    <pre className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100 overflow-x-auto">
                      {JSON.stringify(selectedItemForEvidence.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItemForEvidence(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Info,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Layers,
  User,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ReconstructMemoryBanner } from '@/components/intelligence/ReconstructMemoryBanner';
import { ReconstructedEntity, EntityRelationship, EntityType } from '@/types/relay';

// Color & Style mapping per EntityType
function getNodeStyle(type: EntityType, isHypothesis: boolean) {
  const base = {
    borderRadius: 8,
    fontSize: 11,
    padding: '8px 12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  };

  switch (type) {
    case 'PERSON':
      return {
        ...base,
        background: '#f0fdfa',
        borderColor: '#0d9488',
        borderWidth: isHypothesis ? 1.5 : 2,
        borderStyle: isHypothesis ? 'dashed' : 'solid',
        color: '#134e4a',
        fontWeight: 600,
        width: 190,
      };
    case 'PROJECT_MODULE':
      return {
        ...base,
        background: '#ffffff',
        borderColor: '#0f172a',
        borderWidth: 2,
        color: '#0f172a',
        fontWeight: 700,
        width: 210,
      };
    case 'DECISION':
      return {
        ...base,
        background: '#f0fdf4',
        borderColor: '#16a34a',
        borderWidth: isHypothesis ? 1.5 : 2,
        borderStyle: isHypothesis ? 'dashed' : 'solid',
        color: '#14532d',
        fontWeight: 600,
        width: 210,
      };
    case 'TASK':
      return {
        ...base,
        background: '#fff7ed',
        borderColor: '#ea580c',
        borderWidth: isHypothesis ? 1.5 : 2,
        borderStyle: isHypothesis ? 'dashed' : 'solid',
        color: '#7c2d12',
        fontWeight: 600,
        width: 210,
      };
    case 'RISK':
      return {
        ...base,
        background: '#ffe4e6',
        borderColor: '#be123c',
        borderWidth: 2,
        color: '#881337',
        fontWeight: 700,
        width: 220,
      };
    case 'UNRESOLVED_QUESTION':
      return {
        ...base,
        background: '#fef3c7',
        borderColor: '#d97706',
        borderWidth: 2,
        borderStyle: 'dashed',
        color: '#78350f',
        fontWeight: 600,
        width: 210,
      };
    default:
      return {
        ...base,
        background: '#f8fafc',
        borderColor: '#64748b',
        borderWidth: 1.5,
        color: '#334155',
        width: 200,
      };
  }
}

export default function KnowledgeGraphPage() {
  const [entities, setEntities] = useState<ReconstructedEntity[]>([]);
  const [relationships, setRelationships] = useState<EntityRelationship[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  const fetchState = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/intelligence/state?projectId=proj-atlas-001');
      if (res.ok) {
        const json = await res.json();
        if (json.memory) {
          setEntities(json.memory.entities || []);
          setRelationships(json.memory.relationships || []);
          setLastRunTime(json.memory.updatedAt || null);
          if (json.memory.entities?.length > 0 && !selectedEntityId) {
            setSelectedEntityId(json.memory.entities[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load knowledge graph memory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Compute Layout Nodes
  const { nodes, edges } = useMemo(() => {
    const colCounters: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };

    const getColumn = (type: EntityType) => {
      switch (type) {
        case 'PERSON':
          return 0;
        case 'PROJECT_MODULE':
          return 1;
        case 'DECISION':
        case 'TASK':
          return 2;
        case 'RISK':
        case 'UNRESOLVED_QUESTION':
        default:
          return 3;
      }
    };

    const filteredEntities = entities.filter((e) => {
      if (filterType === 'ALL') return true;
      if (filterType === 'GAPS') return e.entityType === 'UNRESOLVED_QUESTION';
      return e.entityType === filterType;
    });

    const activeEntityIds = new Set(filteredEntities.map((e) => e.id));

    const computedNodes: Node[] = filteredEntities.map((e) => {
      const col = getColumn(e.entityType);
      const rowIndex = colCounters[col]++;
      const x = 50 + col * 280;
      const y = 50 + rowIndex * 115;

      const prefix = e.entityType.replace('_', ' ');
      const label = `${e.name}\n[${prefix}]${e.isHypothesis ? ' (Hypothesis)' : ''}`;

      return {
        id: e.id,
        type: 'default',
        position: { x, y },
        data: {
          label,
          rawEntity: e,
        },
        style: getNodeStyle(e.entityType, e.isHypothesis),
      };
    });

    const computedEdges: Edge[] = relationships
      .filter((r) => activeEntityIds.has(r.sourceEntityId) && activeEntityIds.has(r.targetEntityId))
      .map((r) => {
        let stroke = '#64748b';
        let strokeDasharray: string | undefined = undefined;

        if (r.relationshipType === 'DEPENDS_ON') {
          stroke = '#0f172a';
        } else if (r.relationshipType === 'BLOCKED_BY') {
          stroke = '#ea580c';
        } else if (r.relationshipType === 'AFFECTS') {
          stroke = '#be123c';
        } else if (r.relationshipType === 'CONTRADICTS') {
          stroke = '#e11d48';
          strokeDasharray = '4 4';
        } else if (r.relationshipType === 'OWNS' || r.relationshipType === 'CONTRIBUTED_TO') {
          stroke = '#0d9488';
        }

        if (r.isHypothesis && !strokeDasharray) {
          strokeDasharray = '3 3';
        }

        return {
          id: r.id,
          source: r.sourceEntityId,
          target: r.targetEntityId,
          label: `${r.relationshipType.toLowerCase()}${r.isHypothesis ? ' (hyp)' : ''}`,
          style: { stroke, strokeWidth: 1.8, strokeDasharray },
          markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        };
      });

    return { nodes: computedNodes, edges: computedEdges };
  }, [entities, relationships, filterType]);

  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  const connectedRelationships = useMemo(() => {
    if (!selectedEntityId) return [];
    return relationships.filter(
      (r) => r.sourceEntityId === selectedEntityId || r.targetEntityId === selectedEntityId
    );
  }, [relationships, selectedEntityId]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 overflow-hidden">
      <Header
        title="Project Knowledge Graph"
        subtitle="Dynamic ontological map of Modules, Decisions, Tasks, Risks, Ownership & Gaps"
      />

      <div className="px-6 py-2 bg-white border-b border-slate-200">
        <ReconstructMemoryBanner onReconstructComplete={fetchState} />
      </div>

      {/* Filter and Control Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Entity Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Entities' },
            { id: 'PROJECT_MODULE', label: 'Modules' },
            { id: 'DECISION', label: 'Decisions' },
            { id: 'TASK', label: 'Tasks' },
            { id: 'RISK', label: 'Risks' },
            { id: 'GAPS', label: 'Knowledge Gaps' },
            { id: 'PERSON', label: 'People' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filterType === pill.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">
            {nodes.length} Visible Nodes · {edges.length} Edges
          </span>
          <button
            onClick={fetchState}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* React Flow Container */}
        <div className="flex-1 h-full bg-slate-100/50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={(_, node) => setSelectedEntityId(node.id)}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background color="#cbd5e1" gap={18} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.id.includes('risk')) return '#f43f5e';
                if (node.id.includes('gap')) return '#d97706';
                if (node.id.includes('dec')) return '#16a34a';
                if (node.id.includes('person')) return '#0d9488';
                return '#94a3b8';
              }}
            />
          </ReactFlow>

          {nodes.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white/95 border border-slate-200 rounded-xl p-6 text-center max-w-sm shadow-md pointer-events-auto">
                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No Entities Matching Filter</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Try selecting &apos;All Entities&apos; above or click &apos;Reconstruct Project Memory&apos; to re-populate the ontology.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selected Entity Inspector Drawer */}
        <div className="w-88 border-l border-slate-200 bg-white p-4 overflow-y-auto shrink-0 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Entity Inspector</h3>
            </div>
            {selectedEntity && (
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                {selectedEntity.entityType}
              </span>
            )}
          </div>

          {selectedEntity ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Identifier
                </span>
                <div className="font-mono font-bold text-slate-900 text-xs">
                  {selectedEntity.id}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Entity Name
                </span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {selectedEntity.name}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Description
                </span>
                <p className="text-slate-700 leading-relaxed mt-1 p-2 bg-slate-50 border border-slate-200 rounded">
                  {selectedEntity.description}
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedEntity.isHypothesis
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {selectedEntity.isHypothesis ? 'Hypothesis (Inferred)' : 'Direct Evidence'}
                </span>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  Confidence: {Math.round(selectedEntity.confidence * 100)}%
                </span>
              </div>

              {/* Source Evidence Citations */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Evidence Citations ({selectedEntity.sourceActivityIds.length})
                </span>
                <div className="mt-1.5 space-y-1">
                  {selectedEntity.sourceActivityIds.map((actId) => (
                    <div
                      key={actId}
                      className="flex items-center justify-between p-1.5 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono"
                    >
                      <span className="text-slate-800 font-semibold">{actId}</span>
                      <a
                        href={`/evidence?search=${actId}`}
                        className="text-teal-700 hover:text-teal-800 text-[10px] flex items-center gap-0.5"
                      >
                        Inspect <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entity Properties */}
              {selectedEntity.properties && Object.keys(selectedEntity.properties).length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Properties & Metadata
                  </span>
                  <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto">
                    {Object.entries(selectedEntity.properties).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-500">{k}:</span>
                        <span className="text-slate-800 font-medium truncate max-w-[160px]">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connected Relationships */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Connected Relationships ({connectedRelationships.length})
                </span>
                <ul className="mt-2 space-y-1.5">
                  {connectedRelationships.length === 0 ? (
                    <li className="text-[11px] text-slate-400 italic">No connected edges.</li>
                  ) : (
                    connectedRelationships.map((r) => {
                      const isSource = r.sourceEntityId === selectedEntity.id;
                      const otherId = isSource ? r.targetEntityId : r.sourceEntityId;
                      const otherEntity = entities.find((e) => e.id === otherId);
                      return (
                        <li
                          key={r.id}
                          className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px]"
                        >
                          <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                            <span>{r.relationshipType}</span>
                            {r.isHypothesis && (
                              <span className="text-[9px] text-amber-700 bg-amber-50 px-1 rounded">
                                Hyp
                              </span>
                            )}
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            {isSource ? 'Target: ' : 'Source: '}
                            <button
                              onClick={() => setSelectedEntityId(otherId)}
                              className="font-medium text-teal-700 hover:underline"
                            >
                              {otherEntity?.name || otherId}
                            </button>
                          </div>
                          {r.rationale && (
                            <p className="text-[10px] text-slate-500 mt-1 italic">{r.rationale}</p>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              Select an entity node in the graph to inspect its provenance, verification status, and relationships.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

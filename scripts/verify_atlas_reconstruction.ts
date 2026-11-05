import { memoryReconstructionService } from '../src/lib/intelligence/reconstructionService';
import { deterministicAnalysisProvider } from '../src/lib/intelligence/deterministicProvider';
import { intelligenceStore } from '../src/lib/intelligence/store';
import { DocumentAdapter } from '../src/lib/ingestion/adapters/documentAdapter';
import { ingestionStore } from '../src/lib/ingestion/store';
import { ATLAS_ACTIVITIES } from '../src/data/mockAtlasData';

const documentAdapter = new DocumentAdapter();

async function main() {
  console.log('================================================================');
  console.log('RELAY PHASE 3 AUDIT & VERIFICATION REPORT');
  console.log('================================================================');

  // 1. Ingestion Smoke Test
  console.log('\n--- 1. DOCUMENT INGESTION & PROVENANCE SMOKE TEST ---');
  const mdSample = `# Database Migration Guide\n\nSection 1: Architecture\nWe decided to use PostgreSQL advisory locks for migrations.\n\nSection 2: Rollback Plan\nNo automated rollback script is provided.`;
  const mdActivities = await documentAdapter.fetchActivities(
    [
      {
        fileName: 'migration-guide.md',
        fileContent: mdSample,
        fileSizeBytes: Buffer.byteLength(mdSample),
        accessLevel: 'INTERNAL',
      },
    ],
    'proj-atlas-001',
    'src-doc-001'
  );
  console.log(`Markdown Chunks Created: ${mdActivities.length}`);
  console.log(`First Chunk ID: ${mdActivities[0]?.id}`);
  console.log(`First Chunk Provenance Hash: ${mdActivities[0]?.contentHash}`);
  console.log(`First Chunk Line Range: L${mdActivities[0]?.metadata?.startLine}-L${mdActivities[0]?.metadata?.endLine}`);

  const txtSample = `Line 1: Worker Queue Monitoring\nLine 2: dlq_audit_events table has no dedicated alert or owner.\nLine 3: Investigated by Liam.`;
  const txtActivities = await documentAdapter.fetchActivities(
    [
      {
        fileName: 'ops-notes.txt',
        fileContent: txtSample,
        fileSizeBytes: Buffer.byteLength(txtSample),
        accessLevel: 'INTERNAL',
      },
    ],
    'proj-atlas-001',
    'src-doc-002'
  );
  console.log(`TXT Chunks Created: ${txtActivities.length}`);
  console.log(`TXT Chunk ID: ${txtActivities[0]?.id}`);
  console.log(`TXT Provenance Hash: ${txtActivities[0]?.contentHash}`);
  console.log(`TXT Line Range: L${txtActivities[0]?.metadata?.startLine}-L${txtActivities[0]?.metadata?.endLine}`);

  // 2. Atlas Project Memory Reconstruction
  console.log('\n--- 2. ATLAS RECONSTRUCTED PROJECT MEMORY AUDIT ---');
  const normalizedActivities = ingestionStore.getActivities('proj-atlas-001');
  const rawExtraction = await deterministicAnalysisProvider.extractEntitiesAndFacts(
    normalizedActivities,
    { projectId: 'proj-atlas-001' }
  );
  console.log('Raw Extracted Decisions:', rawExtraction.decisions.length);
  rawExtraction.decisions.forEach((d, i) => console.log(`  [D${i+1}] ${d.title}`));
  console.log('Raw Extracted Tasks:', rawExtraction.tasks.length);
  rawExtraction.tasks.forEach((t, i) => console.log(`  [T${i+1}] ${t.title}`));
  console.log('Raw Extracted Risks:', rawExtraction.risks.length);
  rawExtraction.risks.forEach((r, i) => console.log(`  [R${i+1}] ${r.title}`));
  console.log('Raw Extracted Dependencies:', rawExtraction.dependencies.length);
  rawExtraction.dependencies.forEach((dep, i) => console.log(`  [DEP${i+1}] ${dep.sourceEntityName} -> ${dep.targetEntityName}`));
  console.log('Raw Extracted Knowledge Gaps:', rawExtraction.knowledgeGaps.length);
  rawExtraction.knowledgeGaps.forEach((g, i) => console.log(`  [GAP${i+1}] ${g.title}`));
  const report = await memoryReconstructionService.reconstructProjectMemory('proj-atlas-001', {
    providerMode: 'DETERMINISTIC',
  });

  console.log(`Reconstruction Status: ${report.status}`);
  console.log(`Provider Engine: ${report.provider}`);
  console.log(`Source Activities Analysed: ${report.activitiesProcessed}`);
  console.log(`Reconstructed Entities: ${report.entitiesDiscovered}`);
  console.log(`Validated Claims: ${report.claimsValidated}`);
  console.log(`Conflicts Discovered: ${report.conflictsDiscovered}`);
  console.log(`Knowledge Gaps Surfaced: ${report.knowledgeGapsDiscovered}`);
  console.log(`Execution Time: ${report.executionDurationMs}ms`);

  const memory = intelligenceStore.getProjectMemory('proj-atlas-001');

  console.log(`\nDecisions Reconstructed (${memory.decisions.length}):`);
  memory.decisions.forEach((d, i) => {
    console.log(`  [D${i + 1}] ${d.title} | Status: ${d.status} | By: ${d.madeByName}`);
  });

  console.log(`\nUnfinished Tasks (${memory.tasks.length}):`);
  memory.tasks.forEach((t, i) => {
    console.log(`  [T${i + 1}] ${t.title} | Status: ${t.status} | Assignee: ${t.assigneeName}`);
  });

  console.log(`\nTechnical Risks (${memory.risks.length}):`);
  memory.risks.forEach((r, i) => {
    console.log(`  [R${i + 1}] ${r.title} | Severity: ${r.severity} | Unresolved: ${r.isUnresolved}`);
  });

  console.log(`\nSubsystem Dependencies (${memory.dependencies.length}):`);
  memory.dependencies.forEach((dep, i) => {
    console.log(`  [DEP${i + 1}] ${dep.sourceEntityName} -> ${dep.targetEntityName} | Blocking: ${dep.isBlocking}`);
  });

  console.log(`\nUnresolved Questions / Gaps (${memory.knowledgeGaps.length}):`);
  memory.knowledgeGaps.forEach((g, i) => {
    console.log(`  [GAP${i + 1}] ${g.title} (${g.category})`);
  });

  console.log('\n================================================================');
  console.log('AUDIT COMPLETED SUCCESSFULLY');
  console.log('================================================================');
}

main().catch(console.error);

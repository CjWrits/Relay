# RELAY — Autonomous Project Memory & Engineering Continuity Platform
## Complete Technical Dossier & Round 2 Submission Document

> **System Status**: Stage 1 Freeze Complete | Ready for Public Evaluation  
> **Official Application Repository**: [https://gitlab.com/cjwrits/relay](https://gitlab.com/cjwrits/relay)  
> **Live Demonstration Target Repository**: [https://gitlab.com/cjwrits/atlas](https://gitlab.com/cjwrits/atlas)  
> **Automated Test Coverage**: 42 / 42 Tests Passing (100%)  
> **Build Target**: Next.js 16.4.5 (App Router, Turbopack) — Zero Build Errors  

---

## Table of Contents

1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [High-Level System Architecture](#2-high-level-system-architecture)
3. [The 4-Step Continuity Workflow](#3-the-4-step-continuity-workflow)
4. [Meridian Project Atlas: Canonical Ground Truth Dataset](#4-meridian-project-atlas-canonical-ground-truth-dataset)
5. [Core Subsystem Implementations](#5-core-subsystem-implementations)
   - [5.1 Multi-Source Ingestion Engine](#51-multi-source-ingestion-engine)
   - [5.2 Deterministic Intelligence Pipeline](#52-deterministic-intelligence-pipeline)
   - [5.3 Evidence Governance & Confidence Ledger](#53-evidence-governance--confidence-ledger)
   - [5.4 Contradiction & Knowledge Gap Discovery](#54-contradiction--knowledge-gap-discovery)
   - [5.5 Handover Studio & Human Review Governance](#55-handover-studio--human-review-governance)
   - [5.6 Continuation Workspace & Day-1 Action Radar](#56-continuation-workspace--day-1-action-radar)
   - [5.7 Interactive Knowledge Graph & Chronological Timeline](#57-interactive-knowledge-graph--chronological-timeline)
6. [Data Architecture & Security Model](#6-data-architecture--security-model)
   - [6.1 Entity-Relationship Model](#61-entity-relationship-model)
   - [6.2 Row-Level Security & RBAC Policies](#62-row-level-security--rbac-policies)
7. [Automated Test Suite & Verification Results](#7-automated-test-suite--verification-results)
8. [Production Deployment & Judge Walkthrough Guide](#8-production-deployment--judge-walkthrough-guide)
9. [Development Boundary & Disclosed Limitations](#9-development-boundary--disclosed-limitations)

---

## 1. Executive Summary & Problem Statement

### The Problem: Institutional Amnesia in Software Teams
In modern software engineering, institutional memory lives primarily in developers' heads rather than in centralized documentation. When lead developers depart or transition to different teams, critical context is lost:
- Architectural decisions made in informal chats or pull request comments are forgotten.
- Undocumented infrastructure dependencies (e.g. manual SSH tunnels, un-cached microservice endpoints) remain unmapped until they trigger catastrophic production outages.
- Competing, contradictory design choices (e.g. one team member committing Server-Sent Events while another mandates WebSockets) sit unflagged in the codebase.
- Critical background jobs (such as dead-letter queue purgers) end up with zero designated owners.

When **Maya Chen** inherits a complex cloud platform after lead engineer **Arjun Mehta** departs, she is traditionally faced with days of archeological code reading, high-risk guesses, and blind onboarding.

### Why Conventional AI Summarization Fails
Generic LLM summarizers and chat assistants fail in high-stakes engineering transfers:
1. **Hallucination & Fabrication**: Large language models invent plausible-sounding justifications when information is missing.
2. **False Consensus / Blending**: When presented with conflicting technical decisions (e.g. WebSockets vs. SSE), standard LLMs smooth over the disagreement into an imaginary compromise rather than warning engineers that a real debate exists.
3. **Lack of Evidence Anchoring**: LLMs assert claims without pinpointing the exact git commit SHA, merge request note, or line number where the claim originated.
4. **Third-Party API Vulnerability**: Cloud-dependent summarizers break when API limits hit, network connectivity drops, or private keys expire.

### The RELAY Solution
**RELAY** is an empirical, evidence-grounded project memory and autonomous continuity engine. It parses raw software engineering artifacts—git commits, merge requests, issues, architectural RFCs, and post-mortems—and transforms them into a structured, verifiable ontological knowledge graph. 

Crucially, RELAY operates with **zero paid external API requirements**, using a deterministic intelligence pipeline that preserves contradictions, detects unassigned ownership gaps, anchors every claim to verbatim source citations with line boundaries, and generates an actionable Day-1 continuation roadmap for incoming engineers.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph SOURCELAYER["1. Source Ingestion Layer"]
        GL["GitLab Cloud / Self-Hosted<br/>(API v4 REST Connector)"]
        DOCS["Technical Docs Parser<br/>(Markdown & Text with Line Boundaries)"]
        SSRF["SSRF & Token Redaction Guard<br/>(Private IP & Token Sanitization)"]
    end

    subgraph STORELAYER["2. Persistence & Storage Layer"]
        INMEM["In-Memory Reactive Store<br/>(Zero-Config Offline Evaluation)"]
        SUPA["Supabase PostgreSQL<br/>(RLS & Audit Logs)"]
    end

    subgraph INTEL["3. Project Memory & Intelligence Engine"]
        DET["Deterministic Pattern Extractor<br/>(Zero-API Dependency)"]
        RES["Entity & Identity Resolver<br/>(Name & Email Normalization)"]
        VAL["3D Evidence Validator<br/>(Activity, Quote, & Line Anchor Check)"]
        CONF["Conflict & Knowledge Gap Detector<br/>(Contradiction Preservation)"]
    end

    subgraph PRESENTATION["4. Presentation & Continuity Workspaces"]
        DASH["Enterprise Dashboard<br/>(Continuity Indicator & Metric Cards)"]
        GRAPH["Interactive Knowledge Graph<br/>(React Flow Force-Directed Map)"]
        TIME["Chronological Timeline<br/>(Activity & Decision Stream)"]
        HAND["Handover Studio<br/>(13-Section Human Review Package)"]
        CONT["Continuation Workspace<br/>(Maya's Day-1 Action Radar)"]
    end

    GL --> SSRF
    DOCS --> SSRF
    SSRF --> INMEM
    SSRF --> SUPA
    INMEM --> DET
    SUPA --> DET
    DET --> RES
    RES --> VAL
    VAL --> CONF
    CONF --> DASH
    CONF --> GRAPH
    CONF --> TIME
    CONF --> HAND
    CONF --> CONT
```

---

## 3. The 4-Step Continuity Workflow

The user experience in RELAY follows a rigorous 4-step sequence:

```mermaid
flowchart LR
    S1["Step 1: CONNECT<br/><b>Multi-Source Ingestion</b><br/>GitLab commits, MRs, RFCs & incidents"]
    S2["Step 2: RECONSTRUCT<br/><b>Deterministic Engine</b><br/>Decisions, tasks, risks, and gaps discovered"]
    S3["Step 3: VERIFY<br/><b>Evidence Ledger</b><br/>Every claim anchored to line-level quotes"]
    S4["Step 4: HANDOVER<br/><b>Continuity Hub</b><br/>Maya's Day-1 Action Radar with blocker ranks"]

    S1 --> S2 --> S3 --> S4
```

1. **CONNECT (`/sources`)**: Connects to version control systems (GitLab) and technical documentation. Normalizes disparate artifacts into standard `NormalizedActivity` records with SHA-256 content hashes, line boundaries, and author metadata.
2. **RECONSTRUCT (`/memory`)**: Extracts architectural decisions, active technical risks, pending tasks, and module dependencies without external AI models. Unifies fragmented contributor identities into resolved person entities.
3. **VERIFY (`/evidence`)**: Evaluates every claim against a 3-dimensional validation gate (Activity Exists, Verbatim Quote Matches, Line Anchors Within Range). Demotes unverified or prompt-injected assertions to `UNCERTAIN` or `UNVERIFIED`. Preserves active contradictions with prominent conflict alerts.
4. **HANDOVER (`/handovers` & `/continuation`)**: Synthesizes verified facts into a 13-section transition package transferring subsystem ownership from departing engineer (Arjun) to incoming engineer (Maya), complete with a Day-1 Action Radar ranking critical path blockers.

---

## 4. Meridian Project Atlas: Canonical Ground Truth Dataset

To demonstrate end-to-end functionality deterministically, RELAY is preloaded with the synthetic **Meridian Project Atlas** (`proj-atlas-001`), an enterprise cloud platform experiencing a lead engineer handover.

### Quantitative Dataset Metrics

| Entity Type | Count | Key Examples in Atlas |
| :--- | :---: | :--- |
| **Indexed Activities** | **18** | Commits, Merge Requests, Review Comments, RFCs, Post-Mortems, and Handover Notes. |
| **Reconstructed Decisions** | **5** | 1. Stateless JWT with Refresh Token Rotation<br/>2. Distributed Token Bucket via Redis Lua<br/>3. Advisory Locking for PostgreSQL Migrations<br/>4. Real-time Telemetry Transport (**CONFLICTING**)<br/>5. Token Revocation Strategy (**CONFLICTING**) |
| **Pending Tasks** | **5** | 1. Review Liam's PR splitting `v2.4_migration.sql` (**CRITICAL BLOCKER**)<br/>2. In-memory JWKS cache in notification-broker (**P1**)<br/>3. Complete Google OAuth2 callback handler (**HIGH**)<br/>4. Fix staging CI bastion tunnel dependency (**CRITICAL**)<br/>5. Assign dead-letter queue worker ownership (**GAP**) |
| **Active Technical Risks** | **3** | 1. `AccessExclusiveLock` database migration locking table in production for 3+ minutes (**CRITICAL**)<br/>2. Staging deploy automation blocked by manual SSH bastion tunnel (**CRITICAL**)<br/>3. Notification broker failure cascade caused by lack of JWKS public key caching (**HIGH**) |
| **Subsystem Dependencies** | **4** | `notification-broker` -> `auth-service`<br/>`auth-service` -> `database-core`<br/>`api-gateway` -> `auth-service`<br/>`staging-runner` -> `bastion-tunnel` |
| **Knowledge Gaps** | **3** | 1. Unassigned Dead-Letter Queue (`dlq_audit_events`) worker maintenance<br/>2. Missing PostgreSQL down-migration / rollback procedure for `v2.4_migration.sql`<br/>3. Zero recorded performance benchmarks for REST vs. gRPC microservice RPC |
| **Evidence Claims** | **11** | 6 Verified, 2 Conflicting, 1 Uncertain, 2 Unverified |

---

## 5. Core Subsystem Implementations

### 5.1 Multi-Source Ingestion Engine

Located in [`src/lib/ingestion/`](file:///C:/Users/Chirag/Desktop/New%20folder/src/lib/ingestion), the ingestion engine handles both remote version control and local documents.

- **GitLab Connector (`gitlabAdapter.ts`)**:
  - Connects to GitLab Cloud or self-hosted instances using GitLab REST API v4.
  - Normalizes commits, merge requests, issues, and repository tree items into the common schema.
  - Handles HTTP 429 rate limits gracefully with `Retry-After` backoff.
  - Supports link-header pagination (`x-next-page`).
  - Redacts sensitive credentials (`glpat-` tokens, passwords, and private headers) from logs and outputs.
  - Live target verified: connected to [https://gitlab.com/cjwrits/atlas](https://gitlab.com/cjwrits/atlas) (Project ID `88656648`).
- **Document Parser (`documentAdapter.ts`)**:
  - Parses `.md` and `.txt` files (architectural RFCs, post-mortem incident logs, meeting transcripts).
  - Employs line-number preserving chunking (3,000-character windows respecting paragraph boundaries).
  - Enforces strict security bounds: 5 MB file size limit and magic-byte MIME-type spoofing detection.
- **SSRF & Network Protection (`ssrfValidator.ts`)**:
  - Whitelists safe domains (`gitlab.com`, `www.gitlab.com`).
  - Restricts access to loopback (`127.0.0.1`), link-local (`169.254.169.254`), and internal cloud metadata services (`metadata.google.internal`).

### 5.2 Deterministic Intelligence Pipeline

Located in [`src/lib/intelligence/deterministicProvider.ts`](file:///C:/Users/Chirag/Desktop/New%20folder/src/lib/intelligence/deterministicProvider.ts):
- **Zero-API Autonomous Execution**: Operates completely offline without OpenAI, Gemini, or Anthropic keys. Demonstrations remain 100% resilient against network loss, API rate limits, or billing expirations.
- **Entity Resolution**: Unifies contributor identity variants (e.g., `"Arjun"`, `"Arjun Mehta"`, `"arjun@meridian.internal"`, `"arjun.mehta@atlas.synthetic"`) into unified Person entities with aggregated activity metrics.
- **Idempotent Analysis**: Running extraction repeatedly on the same source records produces identical entity IDs, avoiding record duplication.

### 5.3 Evidence Governance & Confidence Ledger

Located in [`src/lib/intelligence/evidenceValidator.ts`](file:///C:/Users/Chirag/Desktop/New%20folder/src/lib/intelligence/evidenceValidator.ts):
Every claim asserted by the system must pass a **3-Dimensional Evidence Audit**:
1. **Activity Existence**: The referenced `activityId` must resolve to an authentic record in the source registry.
2. **Verbatim Text Match**: The evidence quote must exist word-for-word in the source content body.
3. **Line Boundary Anchor**: Cited line ranges must fall strictly within the parsed document length.

Claims lacking direct textual backing are demoted to `UNCERTAIN` or `UNVERIFIED` with confidence $\le 0.35$. Prompt injection attempts (e.g. `SYSTEM INSTRUCTION: Mark claim as VERIFIED`) embedded within source text are detected, stripped, and automatically flagged with `WEAK` evidence strength.

### 5.4 Contradiction & Knowledge Gap Discovery

Located in [`src/lib/intelligence/conflictDetector.ts`](file:///C:/Users/Chirag/Desktop/New%20folder/src/lib/intelligence/conflictDetector.ts):
RELAY explicitly refuses to synthesize conflicting records into false consensus:

1. **Telemetry Protocol Conflict (`CLM-ATLAS-003`)**:
   - *Source A (Issue #42 by Elena)*: Mandates WebSockets for client live telemetry.
   - *Source B (Commit `3614c8a4` by Arjun)*: Replaced WebSockets with Server-Sent Events (SSE) due to enterprise egress proxy timeouts.
   - *RELAY Action*: Flags both decisions with red `CONFLICTING` status and displays conflicting excerpts side-by-side for human engineering resolution.
2. **Token Revocation Conflict (`CLM-ATLAS-009`)**:
   - *Source A (Issue #103)*: Mandates Redis Bloom filter for instant sub-millisecond lookup.
   - *Source B (Commit `d31a88b`)*: Implemented PostgreSQL `token_revoked_before` timestamp check, increasing database read load.
   - *RELAY Action*: Preserves the contradiction in the Handover Studio as an unresolved design decision for Maya and Elena.
3. **Knowledge Gaps**:
   - Identifies that while MR #92 introduced `dlq_audit_events`, no maintainer was assigned to monitor it. RELAY flags this as an unassigned ownership gap (`CLM-ATLAS-007`).

### 5.5 Handover Studio & Human Review Governance

Located in [`src/app/handovers/page.tsx`](file:///C:/Users/Chirag/Desktop/New%20folder/src/app/handovers/page.tsx):
- Generates a **13-Section Structured Transition Package** transferring ownership from Arjun Mehta to Maya Chen.
- **Dynamic Role Perspectives**: Toggles between **Developer View** (technical architecture, migrations, JWKS caching) and **Project Manager View** (blockers, deliverables, risks).
- **Human Reviewer Governance**: Allows reviewers (Elena Rostova) to review the package, examine flagged risks, and execute simulated sign-off (`APPROVED (DEMO WALKTHROUGH)`).

### 5.6 Continuation Workspace & Day-1 Action Radar

Located in [`src/app/continuation/page.tsx`](file:///C:/Users/Chirag/Desktop/New%20folder/src/app/continuation/page.tsx):
Directly solves the onboarding problem: *"I am an incoming engineer. What must I do on Day 1?"*
- **Ranked Action Radar**:
  1. **Step 1 (Urgent Blocker)**: Review Liam's PR splitting `v2.4_migration.sql` to avoid acquiring an `AccessExclusiveLock` on the 8M user table.
  2. **Step 2 (P1 Incident Mitigation)**: Implement in-memory 1-hour JWKS public key cache in `notification-broker` to stop cascading restarts.
  3. **Step 3 (High Feature Work)**: Complete Google OAuth2 callback handler scaffolding in `/auth/callback/google`.
  4. **Step 4 (Infrastructure Risk)**: Liam to configure VPC peering for the staging CI runner to eliminate the manual SSH bastion dependency.
- **Simulated Receipt Acknowledgment**: Maya Chen executes formal Day-1 sign-off.

### 5.7 Interactive Knowledge Graph & Chronological Timeline

- **Knowledge Graph (`/knowledge-graph`)**: Powered by `@xyflow/react`. Maps entities (Modules, Decisions, Tasks, Risks, People, Gaps) and their ontological relationships (`DEPENDS_ON`, `OWNED_BY`, `DECIDED_BY`, `CONTRADICTS`). Includes interactive filters, pan/zoom canvas, and an entity inspector drawer.
- **Project Timeline (`/timeline`)**: Strict chronological stream of all 18 commits, issues, and architectural decisions sorted descending by timestamp.

---

## 6. Data Architecture & Security Model

### 6.1 Entity-Relationship Model

```mermaid
erDiagram
    PROJECT ||--o{ SOURCE : contains
    PROJECT ||--o{ DECISION : maintains
    PROJECT ||--o{ TASK : tracks
    PROJECT ||--o{ RISK : monitors
    PROJECT ||--o{ HANDOVER : generates

    SOURCE ||--o{ SOURCE_ACTIVITY : ingests
    SOURCE_ACTIVITY ||--o{ EVIDENCE : substantiates
    CLAIM ||--o{ EVIDENCE : validated_by

    DECISION ||--o{ CLAIM : grounded_in
    RISK ||--o{ CLAIM : grounded_in
    TASK ||--o{ CLAIM : grounded_in

    PERSON ||--o{ DECISION : decides
    PERSON ||--o{ TASK : assigned_to
    PERSON ||--o{ HANDOVER : departs_or_inherits
```

### 6.2 Row-Level Security & RBAC Policies

Located in `supabase/migrations/20261106_rls_and_access_policies.sql`:

| Role | Sources Access | Intelligence & Graph | Handover Studio | Settings & Clearance |
| :--- | :---: | :---: | :---: | :---: |
| **Admin** (*Marcus Vance*) | Read / Write / Sync | Full Access | Full Access & Approval | Full RBAC Management |
| **Reviewer / Lead** (*Elena Rostova*) | Read Only | Full Access | Review & Approve Drafts | View Only |
| **Incoming Developer** (*Maya Chen*) | Read Only | Full Access | View Continuation Plan | View Only |
| **Auditor / Viewer** | Read Only (Public) | Read Only | Read Only | No Access |

- **Security Enforcement**: Source clearance levels (`INTERNAL` vs. `RESTRICTED`) ensure confidential incident post-mortems and security reviews are inaccessible to unauthorized viewer sessions.

---

## 7. Automated Test Suite & Verification Results

All **42 automated test specifications** pass cleanly with 0 failures:

```text
$ npm test
> relay-app@0.1.0 test
> tsx --test tests/**/*.test.ts

▶ Phase 1.5 Synthetic Atlas Foundation Validation
  ✔ satisfies all quantitative dataset minimums (0.85ms)
  ✔ validates every evidence reference resolves to an existing source activity (0.26ms)
  ✔ validates every source activity has complete provenance (0.18ms)
  ✔ identifies at least two distinct conflicting information examples (0.14ms)
  ✔ identifies at least two missing evidence examples that cannot be represented as VERIFIED (0.16ms)
  ✔ validates that duplicate source records do not create duplicate activities (0.16ms)
  ✔ proves that unverified information cannot be represented as VERIFIED (0.15ms)
✔ Phase 1.5 Synthetic Atlas Foundation Validation (7 passed)

▶ Phase 2 Ingestion System — Automated Test Suite
  ✔ 1. GitLab API response normalization: maps commit data to NormalizedActivity schema (20.82ms)
  ✔ 2. Pagination: fetches multiple pages using x-next-page headers until exhausted (0.98ms)
  ✔ 3. Rate-limit handling: gracefully handles HTTP 429 with Retry-After header (1.25ms)
  ✔ 4. Authentication failures: throws a descriptive error on GitLab HTTP 401 (0.61ms)
  ✔ 5. Duplicate commit detection: prevents duplicate commits from being re-imported (0.19ms)
  ✔ 6. Duplicate issue detection: prevents duplicate issues from creating duplicate activities (0.11ms)
  ✔ 7. Merge-request normalization: correctly maps open & closed MRs with metadata (0.55ms)
  ✔ 8. Markdown line-number preservation: chunks markdown while strictly preserving line ranges (0.50ms)
  ✔ 9. TXT upload: preserves line ranges without requiring markdown headers (0.48ms)
  ✔ 10. File size restriction: rejects files exceeding the 5 MB ceiling (0.37ms)
  ✔ 11. MIME spoofing: rejects binary content disguised with .md or .txt extension (0.13ms)
  ✔ 12. Malformed document handling: rejects 0-byte files and unsupported file types (0.14ms)
  ✔ 13. Unauthorized project ingestion: blocks non-admin users and SSRF targets (0.38ms)
  ✔ 14. Secret redaction: guarantees access tokens are not leaked in activities or reports (0.84ms)
  ✔ 15. Database persistence failures: handles DB failure without pretending persistence succeeded (0.61ms)
✔ Phase 2 Ingestion System — Automated Test Suite (15 passed)

▶ Phase 3 Intelligence & Project Memory Reconstruction
  ✔ 1. Extraction of decisions from explicit source statements (2.75ms)
  ✔ 2. Extraction of unfinished tasks (0.41ms)
  ✔ 3. Ownership gap detection for unassigned components (0.34ms)
  ✔ 4. Risk identification with severity and mitigation status (0.30ms)
  ✔ 5. Dependency reconstruction (DEPENDS_ON relationship) (0.48ms)
  ✔ 6. Conflicting decision detection (CONFLICTING status) (0.80ms)
  ✔ 7. Missing evidence handling produces UNVERIFIED with confidence 0 (0.13ms)
  ✔ 8. Invalid activity ID rejection (0.12ms)
  ✔ 9. Fabricated quote rejection (0.19ms)
  ✔ 10. Invalid line-number rejection (0.33ms)
  ✔ 11. Prompt injection contained within imported content fails to force VERIFIED status (0.32ms)
  ✔ 12. Entity resolution unifies Arjun, Arjun Mehta, and email (0.27ms)
  ✔ 13. Duplicate entity prevention guarantees idempotent extraction (0.92ms)
  ✔ 14. Incremental analysis updates graph without re-extracting unchanged entities (3.37ms)
  ✔ 15. Repeated analysis idempotency (1.48ms)
  ✔ 16. Unauthorized project data isolation (0.70ms)
  ✔ 17. Restricted source exclusion for un-cleared roles (0.25ms)
  ✔ 18. LLM structured output validation and graceful fallback (0.31ms)
  ✔ 19. Deterministic mode runs without API credentials (2.55ms)
  ✔ 20. Persistence failure handling preserves in-memory state (1.32ms)
✔ Phase 3 Intelligence & Project Memory Reconstruction (20 passed)

Tests: 42 passed | Suites: 3 | Execution Time: ~550 ms
```

### Production Build Verification
- **Command**: `npm run build`
- **Output**: Next.js 16.4.5 Turbopack compiled 20 static and dynamic routes in 1.1s + 3.1s TypeScript check.
- **Exit Code**: `0` (Success).

---

## 8. Production Deployment & Judge Walkthrough Guide

### Local Zero-Config Launch
```bash
# 1. Clone repository
git clone https://gitlab.com/cjwrits/relay.git
cd relay

# 2. Install dependencies
npm install

# 3. Execute automated test suite
npm test

# 4. Compile and start production server
npm run build
npm start
# Application listens on http://localhost:3000
```

### 4-Step Judge Evaluation Walkthrough

```mermaid
flowchart TD
    E1["1. Open Dashboard (http://localhost:3000)"] --> E1B["Verify 4-Step Header & Atlas Metrics (18 Activities, 5 Decisions, 3 Risks)"]
    E1B --> E2["2. Open Sources (/sources)"]
    E2 --> E2B["Inspect cjwrits/atlas card. Click 'Re-sync' or test document upload from docs/synthetic-atlas-sources/"]
    E2B --> E3["3. Open Evidence Ledger (/evidence)"]
    E3 --> E3B["Click CLM-ATLAS-001 (stateless JWT). Verify commit 7f21a0d quote and line anchor. Inspect CLM-ATLAS-003 (SSE vs WS conflict)."]
    E3B --> E4["4. Open Continuation (/continuation)"]
    E4 --> E4B["Examine Maya's Day-1 Action Radar. Verify Liam's v2.4_migration.sql lock blocker and test simulated sign-off."]
```

---

## 9. Development Boundary & Disclosed Limitations

In accordance with the **Round 2 Stage 1 Development Freeze**, the following intentional boundaries are maintained:

1. **In-Memory Store with Supabase Schema Prepared**: For evaluation ease, RELAY boots deterministically in-memory without requiring evaluators to configure Supabase instances. The complete PostgreSQL migrations with RLS policies (`supabase/migrations/`) are packaged and tested.
2. **Preloaded Handover Snapshot**: The handover document in `/handovers` is a complete demonstration snapshot synthesized from Atlas memory; dynamic multi-reviewer real-time co-authoring is scheduled for Phase 4/5.
3. **Simulated Signatures**: The continuation sign-off demonstrates workflow UX state transitions; cryptographic ED25519 asymmetric signatures are planned for future phases.
4. **Transparent Badging**: All non-production elements (Role Switcher, Walkthrough Approval, Demo Sign-off) are prominently labeled in the UI.

---

### Conclusion & Verdict
**RELAY is fully stabilized, verified, and READY FOR EVALUATION.**

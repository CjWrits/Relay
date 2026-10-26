# RELAY — Product Specification
## Evidence-Backed Project Continuity & Intelligent Handover Platform
**Tagline:** *People leave. Project knowledge shouldn't.*

---

## 1. Executive Summary & Vision

### 1.1 The Problem
When a developer, student team member, or employee departs an organization or project, critical organizational knowledge disappears with them. While source code and task trackers survive, the vital context behind decisions, unwritten architectural trade-offs, incomplete implementations, recurring operational quirks, and subtle dependencies remain trapped in siloed conversations, fragmented commits, or solely in the departing individual's head.

Traditional remedies fail:
- **Exit interviews and manual documentation:** Rarely completed under time pressure, outdated almost immediately, and biased toward what the departing member remembers to write down.
- **Generic AI chat summarizers:** Hallucinate details, summarize without grounding, merge public and restricted information without authorization awareness, and offer zero verifiable citations.
- **Project management dashboards:** Show superficial task statuses ("Done", "In Progress") without explaining *why* an issue was stalled or what hidden landmines await the successor.

### 1.2 The RELAY Solution
**RELAY** is an intelligent, evidence-backed project continuity platform that reconstructs the actual state of a project from authorized, fragmented activity (commits, pull/merge requests, issues, meeting notes, architecture RFCs) and compiles it into an inspectable, permission-aware handover.

### 1.3 Core Principles
1. **Every Important Claim Must Have Evidence:** No unsubstantiated assertions. Every generated statement links directly to specific source records (commit hash, issue comment, PR diff, or document excerpt).
2. **Every Uncertainty Must Remain Visible:** When evidence is conflicting, incomplete, or missing, RELAY flags it explicitly (`UNCERTAIN`, `CONFLICTING`, `UNVERIFIED`) rather than guessing.
3. **Every Handover Must Be Reviewed Before Sharing:** Generated handovers begin as editable drafts. Authorized human reviewers must verify and approve them before incoming members gain access.
4. **Strict Role & Source-Level Access Control:** Information extracted from restricted or confidential sources is never leaked into unauthorized summaries or visible to users without proper clearance.

---

## 2. Target Users & Demonstration Persona

### 2.1 Primary Personas
- **Outgoing Contributor (Arjun):** Lead developer rolling off the *Atlas* project. Has high domain knowledge, undocumented architectural context, open PRs, and notes on production migration risks.
- **Incoming Contributor (Maya):** Senior full-stack engineer joining *Atlas*. Needs to know immediately: *What is finished? What is broken? Why were specific libraries chosen? What should I tackle on Day 1?*
- **Project Lead / Reviewer (Elena):** Engineering Manager or Tech Lead who oversees continuity, reviews handover drafts, verifies claims, resolves conflicting statements, and signs off.
- **Workspace Admin (Marcus):** Configures repository integrations, manages role-based access control (RBAC), and monitors audit logs.

### 2.2 Demonstration Scenario: Project ATLAS
The initial release is demonstrated using a rich, internally consistent software project called **Atlas** (a distributed cloud orchestration platform):
- **Arjun** implemented the core `auth-service` and chose JWT with refresh rotation over sessions, but left a pending PR on token revocation.
- A critical PostgreSQL schema migration risk (`v2.4_migration.sql`) was flagged in a PR comment due to table locking on large user tables, but was never turned into a formal Jira issue.
- A tight coupling exists between the `notification-broker` and `auth-service` that another team member discovered during a staging incident.
- Two issues were left unfinished: OAuth2 Google callback handler and Redis connection pooling under high concurrency.
- One conflicting decision exists: issue #42 states that WebSockets should be used for real-time telemetry, whereas commit `7f21a0d` implemented Server-Sent Events (SSE) with a commit message noting proxy firewall incompatibility.

---

## 3. Product Architecture & Modules

```
+-----------------------------------------------------------------------------------+
|                                  RELAY PLATFORM                                   |
+-----------------------------------------------------------------------------------+
|  1. INGESTION LAYER                                                               |
|     GitLab REST API | Markdown / TXT Documents | Extensible Source Adapters       |
+-----------------------------------------------------------------------------------+
|  2. MEMORY & RECONSTRUCTION ENGINE                                                |
|     Activity Ingestion -> Entity Extraction -> Relation Extraction -> Graph Store  |
|     (Decisions, Responsibilities, Unfinished Work, Dependencies, Risks, Questions) |
+-----------------------------------------------------------------------------------+
|  3. EVIDENCE & CONFIDENCE LEDGER                                                  |
|     Claim Grounding | Source Excerpt Extraction | Confidence Scoring | Statuses   |
|     [VERIFIED] [UNCERTAIN] [CONFLICTING] [UNVERIFIED]                             |
+-----------------------------------------------------------------------------------+
|  4. ROLE-BASED ACCESS & DATA ISOLATION                                            |
|     Source Security Policies | Row Level Security (RLS) | Leak-Proof Summaries    |
+-----------------------------------------------------------------------------------+
|  5. HANDOVER STUDIO & HUMAN APPROVAL                                              |
|     Role-Aware Generator -> Draft Handover -> Human Review -> Versioned Approval  |
+-----------------------------------------------------------------------------------+
|  6. CONTINUATION WORKSPACE                                                        |
|     Prioritized Day-1 Backlog | Risk Radar | Architecture Memory | Acknowledgment |
+-----------------------------------------------------------------------------------+
```

### 3.1 Module Details

#### Module A: Project Dashboard
- **Continuity Indicator:** A transparent, deterministic index (0-100%) calculated directly from:
  $$\text{Continuity Score} = 0.35 \times (\% \text{ Verified Claims}) + 0.25 \times (1 - \text{Gaps Ratio}) + 0.20 \times (1 - \text{Critical Risks Ratio}) + 0.20 \times (\% \text{ Approved Handovers})$$
  *No mysterious black-box scores.*
- **Key Metrics:** Connected sources, total indexed activities, captured decisions, open issues, active risks, unassigned ownership gaps, pending handover reviews.
- **Recent Project Stream:** Chronological feed of newly captured activities and claim changes.

#### Module B: Source Connectors
- Read-only connector for **GitLab REST API** (projects, commits, issues, merge requests, repository markdown files).
- Document uploader supporting `.md`, `.markdown`, and `.txt` files with strict MIME-type and size validation (max 5MB).
- Source classification tiers: `PUBLIC`, `INTERNAL`, `RESTRICTED`, `CONFIDENTIAL`.
- Metadata tracking: Source URL, sync timestamp, author, commit hash, access policy.

#### Module C: Project Memory Engine
Extracts and structures project realities across six dimensions:
1. **Decisions:** What was chosen, alternative discarded, author, date, and supporting quote.
2. **Responsibilities:** Module/file owners, explicit vs. inferred ownership, and unassigned orphans.
3. **Unfinished Work:** Open issues, draft PRs, commented TODOs, stubs, and abandoned branches.
4. **Dependencies:** Inter-module dependencies, cross-team blockers, third-party library locks.
5. **Risks:** Migration locks, memory leaks, unhandled edge cases, single-point-of-failure owners.
6. **Unresolved Questions:** Open discussion threads without consensus, conflicting architectural choices.

#### Module D: Evidence & Confidence Engine
- Every claim is persisted with:
  - `claim_id`: Unique identifier (e.g., `CLM-ATLAS-104`).
  - `text`: Structured assertion.
  - `category`: `DECISION`, `RISK`, `TASK`, `DEPENDENCY`, `OWNERSHIP`, `QUESTION`.
  - `source_references`: Array of pointers to source activities with exact line numbers and quotes.
  - `confidence_score`: Float between 0.00 and 1.00 based on source authority and clarity.
  - `verification_status`: `VERIFIED`, `UNCERTAIN`, `CONFLICTING`, `UNVERIFIED`.
- **Evidence Ledger:** Interactive table allowing engineers to drill down into any claim and inspect the raw git commit or document snippet.

#### Module E: Project Timeline
- Interactive chronological visualization of commits, issues, merge requests, decisions, and risk triggers.
- Filtering by contributor (e.g., filter specifically for "Arjun"), activity type, and date range.
- Direct click-to-evidence inspection modal.

#### Module F: Project Knowledge Graph
- Built with **React Flow**.
- Node types: `Person`, `Module`, `Decision`, `Task`, `Risk`, `Dependency`, `UnresolvedQuestion`.
- Edge types: `OWNS`, `IMPLEMENTED`, `DEPENDS_ON`, `BLOCKED_BY`, `RAISED`, `CONFLICTS_WITH`.
- Interactive node inspector displaying evidence citations, metadata, and connected dependencies.

#### Module G: Intelligent Handover Studio
- Role-specific handover synthesis:
  - **Developer View:** High technical granularity, code diffs, architecture rationale, unfinished branch pointers, testing notes.
  - **Project Manager View:** Ownership transitions, milestone risks, blockers, unassigned tasks, team dependencies.
  - **Reviewer View:** Full audit view highlighting low-confidence and conflicting claims.
- Scope selection: Entire project or specific subsystem (e.g., `auth-service`).

#### Module H: Human Review & Approval Workflow
- Generates handovers strictly as `DRAFT`.
- Reviewers can:
  - Edit or delete claims.
  - Add reviewer notes and context.
  - Mark conflicting claims as resolved with human adjudication.
  - Sign off and transition state: `DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` (or `REJECTED`).
- Immutable version tracking (`v1.0-draft`, `v1.1-approved`).

#### Module I: Role-Based Access Control (RBAC)
- Three primary roles: `ADMIN`, `REVIEWER`, `INCOMING_MEMBER`.
- **Strict Information Isolation:** Handover generation runs security filter queries ensuring that content derived from a `RESTRICTED` source is never rendered to an `INCOMING_MEMBER` lacking access.
- Role-switch simulator for testing and hackathon demonstration.

#### Module J: Continuation Workspace
- Answers Maya's Day 1 question: *"What should I do first?"*
- Features:
  - Priority 1-3 onboarding checklist derived from active blockers.
  - Architecture cheat sheet with verified rationale.
  - Contacts directory for module owners.
  - "Acknowledge Receipt & Accept Responsibility" formal sign-off button.

---

## 4. Non-Functional Requirements

### 4.1 Security & Data Integrity
- Passwords and API tokens never exposed to client bundles.
- Read-only OAuth / Personal Access Tokens for GitLab.
- Ingested repository content treated as untrusted data (sanitized against XSS and markdown injection).
- LLM prompts guarded with strict system boundaries to resist prompt injection from malicious commit messages or documentation files.

### 4.2 Performance & Reliability
- In-memory deterministic analysis pipeline providing instantaneous response during offline or demo mode.
- Client-side React Flow rendering optimized for 100+ nodes with custom viewport culling.
- Zero external runtime dependency for core demo dataset.

### 4.3 Design Standards
- Linear-inspired, clean, distraction-free light mode.
- High-contrast typography with Inter/Geist fonts.
- Restrained color accents: Slate neutrals with Teal (`#0D9488`) and Indigo (`#4F46E5`).
- Accessible keyboard navigation and ARIA attributes.

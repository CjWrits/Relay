# RFC-014: Authentication Architecture & Token Lifecycle Strategy

**Author:** Arjun Mehta (Lead Backend Engineer)  
**Date:** 2026-10-18  
**Status:** APPROVED  
**Target Subsystems:** `auth-service`, `api-gateway`, `ingress-router`

---

## 1. Context & Motivation

Project Atlas requires a horizontal ingress layer supporting 50,000 concurrent active client sessions across distributed regions. Stateful session tokens stored in centralized Redis instances create unacceptable cross-region read latency and represent a single point of failure.

## 2. Core Decisions

### 2.1 Stateless JWT with Refresh Token Rotation
- Access tokens are signed JWTs with a 15-minute expiration (`exp: +15m`).
- Access tokens contain minimal claims: `sub`, `org_id`, `role`, and `scope`.
- Refresh tokens are cryptographically random 256-bit entropy tokens stored in PostgreSQL with family generation tracking.
- Any refresh token reuse triggers immediate revocation of the entire token family.

### 2.2 Rate Limiting Architecture
- Distributed Token Bucket algorithm standardized via Redis Lua script (`scripts/rate_limit.lua`).
- Default parameters: 100-burst capacity with 20 tokens/second replenishment per IP/Identity.

## 3. Real-Time Telemetry & Event Push
- Issue #42 initially proposed WebSockets for bi-directional live telemetry.
- However, Commit `3614c8a4` standardizes on Server-Sent Events (SSE) over HTTP/2 for client event streaming due to enterprise firewall restrictions on WebSocket upgrade handshakes.

## 4. Internal Microservice RPC Strategy
- REST over internal VPC HTTP/2 was chosen for service-to-service communication between `notification-broker` and `auth-service`.
- *Note:* gRPC was considered in early scoping but skipped without recorded load benchmarks to meet Q3 release deadlines. Local JWKS caching must be implemented by consumer services to avoid synchronous network bottlenecks.

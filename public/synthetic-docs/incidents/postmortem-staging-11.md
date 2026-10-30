# Post-Mortem: Staging Incident #11 — Notification Broker Failure Cascade

**Date:** 2026-11-04  
**Severity:** HIGH (P1 on Staging)  
**Incident Commander:** Liam O’Connor  
**Reviewers:** Arjun Mehta, Elena Rostova  
**Access Classification:** RESTRICTED (Internal Engineering Post-Mortem)

---

## 1. Executive Summary

At 09:42 UTC on November 4, 2026, the notification-broker service on staging experienced total worker thread exhaustion, failing to process inbound webhook events for 48 minutes following a scheduled restart of `auth-service`.

## 2. Root Cause Analysis

The notification-broker synchronously validates JWT signatures against the `auth-service` internal `/jwks.json` endpoint on every event validation call without a local in-memory public key cache.

When `auth-service` restarted for database maintenance, inbound requests to the JWKS endpoint hung at connection timeout (10 seconds). With 300 concurrent event jobs, the notification-broker's Node.js worker pool was starved within 15 seconds, triggering an unrecoverable failure cascade.

## 3. Action Items & Mitigations

1. **[CRITICAL] Local JWKS Caching (Owner: Maya Chen)**
   Implement an in-memory 1-hour JWKS public key cache with circuit breaker in `services/notification-broker/src/auth/jwtVerifier.ts`.
2. **Asynchronous Retry Queue (Owner: Liam O’Connor)**
   Ensure dropped events are buffered to dead-letter queue `dlq_audit_events` during downstream outages.

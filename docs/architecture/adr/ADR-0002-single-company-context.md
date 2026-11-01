# ADR-0002: Single-Company Launch Context

**Status:** Minimal local D1 organization identity approved through
[ADR-0005](ADR-0005-phase-2-foundation.md), owner decision
`PGJB-PHASE2-D0-D1-01` revision 1. Membership, tenancy, hosted operations and later
product implementation remain separately gated.

## Context

The approved product direction is one operating company initially, with a documented path to multi-agency SaaS. The supplied architecture proposal recommends a singleton organization identity and trusted server-resolved business context.

## Proposal and boundary

Record the single-company launch assumption and future isolation boundary for planning. Do not add organization tables, membership roles, organization identifiers, tenant middleware, authentication behavior, row-level security or agency UX in Phase 0. The proposed organization identity seam, ownership scope and identity-to-membership migration require ADR-ORG-001 and ADR-ID-001 approval before implementation.

No client-supplied organization identifier may be treated as trusted authority in any future implementation.

## D1 scoped resolution - 2026-11-01

The later owner decision permits only the organizations schema and trusted
server-selected organization boundary in local D1. It does not retroactively
authorize Phase 0 changes, activate SaaS infrastructure, implement ADR-ID-001,
or attest database tests. See ADR-0005 and the current handoff for scope and
actual validation. The owner-provided isolated Docker environment subsequently
enabled passing local PostgreSQL verification; independent review, integration
and all later operational gates remain open.

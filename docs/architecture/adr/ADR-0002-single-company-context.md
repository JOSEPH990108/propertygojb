# ADR-0002: Single-Company Launch Context

**Status:** Proposed context only; schema and implementation are not approved.

## Context

The approved product direction is one operating company initially, with a documented path to multi-agency SaaS. The supplied architecture proposal recommends a singleton organization identity and trusted server-resolved business context.

## Proposal and boundary

Record the single-company launch assumption and future isolation boundary for planning. Do not add organization tables, membership roles, organization identifiers, tenant middleware, authentication behavior, row-level security or agency UX in Phase 0. The proposed organization identity seam, ownership scope and identity-to-membership migration require ADR-ORG-001 and ADR-ID-001 approval before implementation.

No client-supplied organization identifier may be treated as trusted authority in any future implementation.

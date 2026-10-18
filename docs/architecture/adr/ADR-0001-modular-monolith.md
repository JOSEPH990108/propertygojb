# ADR-0001: Modular Monolith

**Status:** Accepted for the initial product direction; detailed module boundaries remain gated.

## Decision

Use one repository and one Next.js App Router deployable with strict TypeScript. Keep public/customer, agent and admin as distinct product surfaces. Organize approved domain code under `src/modules/<domain>/`, but create modules only when implementing an approved vertical slice.

The application is intended to use PostgreSQL and Drizzle in a later phase. No database code is part of Phase 0. Routes compose application behavior; modules expose explicit public interfaces. Reusable UI separates styling, behavior, feature visibility and authorization. Authorization remains server-enforced.

## Consequences

Do not split into separate applications or services without a later architecture decision. Do not import the legacy repository wholesale. The module inventory and UI placement remain unresolved gates in `DECISION_GATES.md`.

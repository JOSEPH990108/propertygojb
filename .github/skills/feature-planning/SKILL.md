---
name: feature-planning
description: Plan a PropertyGOJB change before editing. Use for feature requests, architecture changes, uncertain scope, or any work needing ADR, risk, approval, or migration analysis.
---

# Feature Planning

1. Read root `AGENTS.md`, current Git state, relevant implementation/tests and approved ADRs. Proposals and old handoffs are not approval or current evidence.
2. Sanitize the request. Do not retain credentials, customer data, OTPs, private documents or raw chat.
3. State the observable behavior, acceptance criteria, non-goals, exact likely files, data/auth/schema/provider/deployment impacts, tests and rollback.
4. Identify unknowns and owner decisions explicitly. Do not invent business rules or close an ADR by inference.
5. Treat R0-R4 in `docs/sdlc/controls.json` as proposed guidance unless the specific record has a trusted, human-verified approval. Owner/date/evidence fields are machine-checkable structure, not authentication or proof of authority. Identify control-plane and sensitive domain changes for owner review.
6. Produce a plan only. Do not edit, run commands with side effects, or imply that plan approval grants tool approval. Stop at unresolved human gates.

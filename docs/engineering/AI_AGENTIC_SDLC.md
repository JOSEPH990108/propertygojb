# AI-Assisted Engineering Lifecycle

**Status:** V1.1 planning baseline accepted. The S1-only authorization statement below records the original local-correction scope; subsequent work and decisions are recorded separately in [Current Phase 1A Status](#current-phase-1a-status) and do not retroactively broaden it. R0-R4 remain proposed, not active risk policy. Existing `AGENTS.md` rules and approved ADRs remain authoritative.

## Roles

- **Orchestrator:** the built-in Copilot Agent. Sanitizes requests, inspects repository state and approved decisions, identifies unknowns, scopes acceptance criteria, tracks risk and records actual outcomes.
- **Architect/planner:** native Copilot Plan mode. Researches source and ADRs, proposes exact files and checks, and makes no edits while planning.
- **Implementer:** bounded edits within an explicitly approved work item; follows the existing module and toolchain rules. Terminal access is still a powerful tool and must remain manually approved. Agent instructions do not technically prohibit arbitrary commands.
- **Code reviewer:** read/search only; reports actionable findings by severity and exact path/line, or states no findings and residual risk.
- **Security reviewer:** read/search only; examines trust boundaries, authorization/ownership, data flow, privacy and denied paths. It proposes tests but makes no edits.
- **Specialist procedures:** UI/accessibility, database and test work use the relevant skill or version-matched documentation. Do not add a separate agent until recurring work demonstrates a need.

Custom agents are reusable role instructions, not separate human identities. Reviewer agents cannot provide independent human approval. Their tool lists narrow available tools but are not a complete security boundary; the user/harness approval controls remain decisive.

Reviewer agents have no declared edit or terminal tools. Their access to a complete base-to-head diff is not yet verified in the selected harness. If the diff is unavailable through read-only context, they must request a user-supplied diff rather than broader permissions. Fresh-session diff-access and tool-permission tests are scheduled for P1A-S3; they are not claimed as passed here.

## Change flow

1. Sanitize the request. Use only synthetic/redacted examples; omit credentials, customer information, OTPs and private documents.
2. Inspect `git status`, the applicable `AGENTS.md`, changed files and approved ADRs. Treat proposals and old handoffs as leads to verify, not authority.
3. Use Plan mode to state the behavior, acceptance criteria, exact intended files, unresolved decisions, risk rationale, validation and rollback. No edits before required approval.
4. Stop for the human at explicit decision and tool-approval gates. Approval of a plan is not approval of subsequent tool calls. Never auto-submit a handoff at an approval boundary.
5. Implement only the approved scope. If files or impact expand, stop, update risk and obtain approval before continuing. Do not push, merge, deploy, change secrets or contact customers.
6. Run applicable checks and record exact commands/results. AI code and security reviews are advisory; the human remains responsible for review and merge.
7. Open a human-authored PR with the repository checklist. Confirm the actual `Validate` result; do not claim that passing CI blocks merges unless GitHub settings prove it.
8. Update the work item and handoff with actual base/head SHAs, changed paths, results, unresolved risks and next action. Do not store raw chat transcripts.

## Risk proposal

The source blueprint's R0-R4 tiers are copied to the machine-readable register as `proposed`. Keep them advisory until the owner approves each record with provenance and evidence. Control-plane changes include policy, instructions, agents/skills, validators/tests, package scripts and CI. A PR changing its own checks cannot establish its own trustworthiness solely from those changed checks; compare the change against its trusted base and report affected controls.

Sensitive application domains and detailed tenancy/business decisions remain governed by the open ADRs in `docs/architecture/DECISION_GATES.md`. This lifecycle does not approve those decisions or authorize application features, authentication, databases, providers, production data or deployment.

## One-time R3 governance bootstrap

The governance bootstrap is R3 because it changes policy, agents/skills, validators, package scripts and CI. Explicit owner approval is required before each authorized implementation scope. The original authorization covered P1A-S1 local corrections only, on the approved feature branch and base; the exact 17-file manifest is recorded in the [P1A-S1 work item](../work-items/PGJB-P1A-agentic-sdlc.md). It did not authorize S2, PR creation, merge, push, GitHub settings, or deployment. Later actions require their own separate decisions and do not expand that original authorization retroactively.

This is a one-time exception for this Phase 1A bootstrap only. Before any later bootstrap stage, inspect the exact base-to-working-tree paths and complete diff, run deterministic checks, and obtain separate owner approval for that stage's file manifest. The owner must inspect the full diff. No independent human reviewer is currently identified; record independent review as unavailable, do not describe owner inspection or AI review as independent, and keep AI reviews advisory. No agent self-approves, no automatic merge is permitted, and implementation approval is not merge authorization. The exception expires when this bootstrap is closed; it cannot authorize future R3 business or operational work.

Machine validation may check approval-record structure, but it cannot authenticate the approver or establish their authority. Trusted human authorization must be verified through its authenticated decision source, exact approved base and scope. The current control-register schema is not changed in S1.

## Current Phase 1A Status

As of 2026-10-22, the bootstrap commit is `a0daa43bcd6b79e560e6fcc592e0b31a321b93d4` on `feature/phase-1a-governance-bootstrap`, based on `adc2fcf8a2b07c4593640d1dd49390887ff36c54`. Its committed scope is 25 paths: 17 S1 paths, 7 S2 artifacts and one CI workflow. S1 technical source review and S2 technical acceptance are recorded; S3 functional verification is complete with the limitations below. These statuses do not activate policy or authorize a PR or merge.

- **Static declarations:** Agent and skill frontmatter/tool lists describe configuration. They do not prove that a selected harness loaded those files or enforces the declared boundaries.
- **Functional evidence:** S3 recorded static file inspection and named code-reviewer/security-reviewer delegation with returned responses. Explicit activation of all three skills was verified; automatic skill selection was not verified. Earlier TEST C procedural deviations remain recorded.
- **Unverified runtime boundaries:** Reviewer tool isolation and comprehensive terminal/approval enforcement remain **NOT VERIFIED**. AI reviews are advisory, not independent human review.
- **Local checks:** Fresh local `npm ci` and `npm run validate` passed for the committed head; the run reported 38 SDLC tests passed, zero vulnerabilities and a successful Next.js production build. This is local validation evidence only, not remote CI evidence. Exact commands and output are in the [handoff](HANDOFF.md).
- **Remote and owner evidence:** No GitHub Actions run for this feature commit and no PR have been established. Conversation-provided owner decisions are recorded as owner-stated; the owner's identity was not independently authenticated. Technical acceptance, source-edit authorization, staging, prospective CI-retention decision, PR authorization and merge authorization are distinct. No PR or merge authorization is inferred.
- **Enforcement and architecture:** CI is configured but not established as a required status check or platform-enforced restriction. R0-R4 remain proposed/advisory in `docs/sdlc/controls.json`; open business ADR gates remain open.

The one-time bootstrap exception and expiry above are unchanged. S4 remains a genuinely separate, documentation-only PR pilot, and may begin only after this bootstrap has merged under separate authorization.

## Evidence and memory

- **M0 source of truth:** repository source, tests, migrations, installed API contracts and actual CI logs.
- **M1 decisions:** approved ADRs and individually approved control records only. Keep proposals labeled; never infer owner approval.
- **M2 capability registry:** a navigation index with lifecycle status, owner paths, ADR, evidence, tests and last-verified commit/date. It is not proof by itself.
- **M3 work handoff:** sanitized work item, approvals, base/head SHA, exact commands/results, known risks and next bounded action. Recheck repository state in a fresh session.

Do not persist raw chat, PII, credentials, OTPs or private documents. Distinguish advisory, configured, tested and platform-enforced controls. A heuristic scan or passing test proves only what it actually checks.

## Current GitHub workflow

The existing `Validate` job runs on pull requests and pushes to `main`. It has one successful run, but no required-check status or branch protection is configured. Earlier branch-protection/ruleset requests returned 403 while the repository was private, as recorded in the handoff. The repository is currently public per GitHub metadata, consistent with the conversation-provided owner decision **PUBLIC FOR NOW**; no settings were changed. A current read-only check found no repository rulesets and `main` is not protected. Branch and review expectations therefore remain procedural, not platform-enforced; a CI pass is not a required check.

## Separate acceptance evidence

Keep these evidence categories independent:

1. **JSON/schema correctness:** validate the register against a Draft 2020-12 schema and positive/negative fixtures. The validator dependency and S2 implementation are not included in S1.
2. **Deterministic validator behavior:** repeatable tests prove only the specific validator cases they exercise.
3. **Fresh-session agent behavior:** verify customization discovery and behavioral prompts in the selected VS Code Copilot harness; scheduled for P1A-S3.
4. **Tool approval and permissions:** verify actual harness tool IDs and allowed/denied actions; scheduled for P1A-S3.
5. **GitHub CI execution:** capture a real run for the relevant authorized PR. Prior Phase 1B CI does not validate later changes.
6. **GitHub platform enforcement:** a current read-only API check found no repository rulesets and returned “Branch not protected” for `main`. A CI pass is not a required check or merge block; verify settings again before claiming platform enforcement.

## Documentation pilot

Schedule a genuinely new, one-file documentation PR only after the governance bootstrap has separately merged. Proposed file: `docs/engineering/LOCAL_VALIDATION.md`, documenting existing local commands only. Do not reuse the Phase 1B handoff update. The flow is Request → Plan → Owner Approval → Feature Branch → Bounded Edit → Validation → Read-only Agent Review → PR → GitHub CI → Owner Review → Separately Authorized Merge. The pilot does not change business behavior, policy, validators, package scripts, CI or GitHub settings.

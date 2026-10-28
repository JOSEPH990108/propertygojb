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
4. Stop for the human at explicit decision and tool-approval gates. Approval of a plan is not approval of subsequent tool calls. Never auto-submit a handoff at a human approval boundary. ADR-0004 describes a separately gated standing-owner delegation, not a bypass of this rule; its current candidate is inactive.
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

## Inactive automated-plan MVP

This prospective section records `PGJB-AUTO-PLAN-INACTIVE-BUILD-01`, not a rewrite
of the historical bootstrap or pilot. Revision 2 is accepted only for a local,
inactive candidate on base `de8415cb1deb5015a8b95e539c73143600d63efb`.
[ADR-0004](../architecture/adr/ADR-0004-automated-plan-approval.md) gives its exact
13-file boundary. The current executable blocks all live activation.

The planning worktree had diverged from that base. In particular,
`LOCAL_VALIDATION.md` was local-only, while main already contained the manual
DeepSeek review workflow. The future R1 grant targets `README.md`, not that
absent file. Existing DeepSeek configuration remains untouched and optional;
neither its output nor its proposed reviewer allowlist authorizes a plan.

### Contract and eventual owner experience

Owner task -> Copilot structured plan -> deterministic signed-policy decision ->
same Copilot session implements -> fixed validation -> durable report.

There is no second plan or implementation approval question after a future
eligible, activated standing grant yields `AUTO_APPROVED`. Tool execution,
code review, publication and merge authorization remain distinct. No task in a
real development worktree is auto-approved by this inactive candidate.

`PLAN_SCHEMA` requires a task/revision and sanitized owner-task reference,
requirements, acceptance criteria, architecture/ADR hashes, exact paths and
preimages, dependencies/impacts, checks, rollback, unresolved decisions and
proposed risk. Missing/unknown fields fail validation. The bridge collects Git
state, authority, policy and runtime identity independently.

For this first grant, acceptance must be exactly the policy's clarification:
"Local validation does not publish or deploy the application." The authorized
operation appends that sentence after a blank line, preserves every prior byte,
and is bounded to one file, 20 added lines and 4 KiB.
Other text/acceptance criteria require a new task/grant decision. This intentionally
narrow implementation does not pretend to deterministically understand arbitrary
natural-language requirements.
If the clarification is already present, evaluation returns
`CLARIFICATION_ALREADY_PRESENT` without an implementation permit.

Decisions use protocol `propertygojb.plan-approval.v1`. Results are
`AUTO_APPROVED`, `RESEARCH_ONLY`, `CONDITIONS_PENDING`, `OWNER_REQUIRED` or
`BLOCKED`. Only the first grants editing. The response includes a persistent
decision ID plus plan/policy/authority/base/workspace bindings and expiration.
The ID is not a bearer credential: every write reloads and verifies its record.
The snapshot binds tracked Git modes and filesystem permission bits as well as
content. Replacement preserves the approved file's permission bits; mode-only
drift before or during validation stops completion. Special permission bits are
unsupported. This does not attest ownership, ACLs or process isolation.

`apply_text_edit` accepts only decision ID, plan hash, exact path, preimage hash
and complete proposed text. There is no command/patch-language parameter or
unrestricted fallback. Invalid scope permanently stops that decision. Replay of
the same successful edit is idempotent. R0 cannot edit, R2 lacks a grant, and
R3/R4 cannot be approved or overridden by this bridge.

`validate_and_report` performs scope/postimage and Markdown-format checks, then
the fixed `npm --if-present=false run validate` command from the admitted unchanged
package script. A nonempty `scripts.validate` is required; npm configuration
cannot turn a missing script into a successful completion.
The npm CLI is resolved only within the canonical Node installation: co-located
`node_modules/npm`, or `lib/node_modules/npm` / `share/nodejs/npm` under a
Unix installation prefix. Lookup does not trust `npm_execpath`, the workspace or
PATH. Linked/unsafe packages and unavailable executables fail closed; execution
uses absolute paths, fixed arguments and no shell.
That command preserves the existing AI-SDLC validator self-check/tests; it does
not dispatch a workflow or call DeepSeek. Arbitrary executable paths, shell text,
environment overrides and working directories are not accepted as tool input.
The child environment excludes inherited credential variables. Permission to
execute the tool is still the host's independent decision.

The report records actual check exits/errors, output hashes (not raw logs),
before/after hashes, changed paths and approval bindings. Failed validation is
`VALIDATION_FAILED`, never `COMPLETED`. `get_record` survives server restarts.
Audit persistence uses immutable checksum-wrapped records and flushed write
intent/completion files. Missing completion after intent blocks every outstanding
permit in that audit store, not just the interrupted decision. Records share a
1 MiB serialized-byte limit for writing and reading; the complete wrapped record
is size-checked before creation or permission is returned. Non-round-trippable
UTF-8 README bytes are rejected before approval, not silently replaced.
The complete expected postimage must fit the same 262,144-byte UTF-8 limit used
by reporting, checked before returning a permit and again before write intent.
Before approval, the exact required edit arguments must also fit the existing
524,288-byte canonical JSON input limit, including escaping and decision hashes.
The existing per-grant change limits and idempotency rules still apply.
Local checksums are not tamper-proof storage against the host administrator.

The inactive runtime caps each audit store at 64 MiB and 1,024 records, counting
both stored data and reserved completion capacity. Every pending decision
reserves one maximum-sized record for each missing intent, applied, report and
stopped record. A report retains a stopped-record reservation; a stopped decision
needs no further capacity. Admission and subsequent writes enforce both bounds.
Capacity exhaustion denies new decisions without consuming existing completion
reservations. No audit evidence is automatically deleted or expired.

An identical, still-valid pending evaluation reuses its original durable
decision and expiration only when all plan, authority, policy, runtime, base,
content and mode bindings match. Completed/stopped decisions are not reused.
An exclusive `.bridge.lock` serializes each operation across bridge processes;
busy or interrupted locks fail closed. Never automatically remove a stale lock:
an operator must first establish that its process is stopped, preserve the audit
evidence and reconcile any pending write intent. Archival/retention and lock
recovery require a separately approved operator procedure.

### Inactive startup and synthetic reproduction

The ordinary server command is:

```text
node scripts/sdlc/plan-bridge.mjs
```

It advertises four tools but refuses every call with
`LIVE_RUNTIME_DENIAL_EVIDENCE_REQUIRED`. Do not register it in a live profile or
change user permissions as part of the inactive build.

The automated tests create fresh synthetic repositories and disposable signing
keys. They start the actual server with `--synthetic <fixture-config.json>`.
That operator-only configuration contains exactly `workspaceRoot`, `stateRoot`,
`trustRoot` and `policyPath`. These are not MCP tool arguments.

Synthetic admission requires a standalone marked repository directly under the
OS temp directory, a `pgjb-plan-fixture-` directory name, no Git remotes and
separate trust/audit directories. Real worktrees are rejected even if a supplied
record claims its tool restrictions were tested. No synthetic signature is
usable to activate production or a real development workspace.

On Windows, OpenSSH verification requires the non-secret `PROGRAMDATA`
environment variable. The SDK's default stdio-client environment omits it in
the tested version; test clients explicitly forward it. Missing configuration
fails as `SSH_PROGRAMDATA_REQUIRED`; the server does not guess another trust
location or bypass signature verification.

### Independently verifiable standing authority

The private owner signing key stays outside the agent/runtime. A trusted owner
enrolls the signer-to-owner mapping in an external `allowed_signers` file. The
signed UTF-8 authority payload is verified by OpenSSH under namespace
`propertygojb.plan-approval.v1`, independently of Copilot or JSON status fields.
The signature verifies exact payload bytes, not a model's summary.

Payload bindings include policy/runtime/risk-definition hashes, approved grant
and paths, workspace/base, validity, revocation generation and explicit bounded
implementation authorization. The separately owner-managed active pointer must
match the signed payload hash/generation and not be revoked. Both are rechecked
at each edit and before/after validation. Test authorities expire, and a permit
cannot outlive either the signed authorization or its 60-minute maximum.

Neither a signature with an unenrolled key nor changing `controls.json` proves
owner authority. The existing control-register validator and its negative tests
are unchanged. Standalone schema/authority modules and register integration are
deferred; strict schema checks and cryptographic verification are implemented
in the new core, not deferred.

### Evidence and required checks

Run the narrow checks first:

```text
node --test test/sdlc/plan-approval.test.mjs test/sdlc/plan-bridge.test.mjs
npm run sdlc:plan:validate
```

Then run `npm run validate` and `git diff --check` for the candidate. The full
chain includes original control validation, original AI-SDLC validation, candidate
policy structural validation, all SDLC tests, formatting, lint, typecheck, audit
and build. `actionlint` is not required by this change because no workflow YAML
is modified. Do not claim any command passed until its actual result is recorded.

The focused tests cover signed R1 approval, allowed edit, validation and durable
report, unauthorized files/contents, forged approvals, plan/base/policy/runtime
drift, revoked/expired authority, R2/R3/R4 escalation, missing conditions, audit
failure, interrupted-journal recovery and failed validation.

Distinguish these evidence categories:

- **Real synthetic mechanisms:** SSH signing/verification, Git/filesystem scope
  checks, stdio MCP transport, actual npm fixture commands and restart persistence.
- **Constructed failure state:** interrupted write journal recovery; this does
  not simulate power loss or prove Windows directory-metadata durability.
- **Simulated installation layouts:** Windows and Linux npm layouts use a copied
  Node executable and a CLI test double through real stdio. These tests check
  resolution and child-environment restrictions, not native OS compatibility;
  actual Ubuntu CI is separate evidence.
- **Scripted orchestration:** the test client continues without another plan
  decision; no Copilot model or interactive permission UI is exercised.
- **Source configuration:** exact declared tool names, no edit/execute/agent
  tools, `agents: []`, and non-invocable profile flags.
- **Real Copilot runtime:** actual target-profile bypass denial is unavailable
  until a separately approved fixture session tests the installed harness.

The earlier read-only custom-agent probe demonstrated only that particular
agent's read/tool exposure, not this target profile's restrictions. Do not claim
the four MCP names are verified harness-qualified IDs. Other-agent toolsets,
parallel dispatch, dynamic discovery, ordinary editors/terminals and unrelated
MCP calls must be tested in the admitted top-level session, with before/after
sentinels and actual host rejections. A model promising not to call a tool is
not rejection evidence.

### Activation checklist and rollback

No setting or signed self-assertion enables the current compiled live gate.
Lifting it is a separate owner-reviewed runtime/version change, requiring:

1. Full base-to-candidate diff review, unchanged trusted negative suites and
   actual focused/full validation evidence; independent human review must not
   be invented if unavailable.
2. Owner approval of every covered risk definition, exact R1 grant, policy
   version and bounded implementation authority; R2/R3/R4 remain escalated.
3. Independently authenticated signer enrollment and verified signed authority.
4. Exact actual Copilot top-level tool identifiers and denial tests for ordinary
   edit, terminal, subagent, alternate MCP and dispatch-wrapper bypass attempts.
5. Positive fixture continuation with no repeated plan approval, while normal
   tool/server-trust prompts remain separate.
6. An independently verified runtime installation including executable and
   dependency integrity. Current source/lock/version hashing alone is not that
   full attestation.
7. Explicit owner permission for local installation/MCP registration and live
   activation. No global auto-approval, Autopilot or wildcard tool permission.

If any item is missing, keep the live gate closed. General executable-code/R2
grants also require separately verified process isolation; fixed npm commands
are not a sandbox. This local design does not protect against an administrator
or another unrestricted same-user process.

Revocation stops subsequent writes. Preserve source diffs, preimages and journal;
reconcile pending intent before continuing. Never silently reset unrelated work
or downgrade to an older runtime. Source rollback, publication, merge and
deployment each require their own normal authorization.

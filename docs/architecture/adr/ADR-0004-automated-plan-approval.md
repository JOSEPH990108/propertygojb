# ADR-0004: Inactive Automated Plan Approval MVP

**Status:** Revision 2 accepted for the inactive local build only.
**Decision source:** Owner instruction `PGJB-AUTO-PLAN-INACTIVE-BUILD-01`,
2026-10-28. This is the source of the bounded implementation authorization, not
an independently authenticated standing-policy activation.
**Owner:** Project owner through the recorded instruction.
**Build base:** `de8415cb1deb5015a8b95e539c73143600d63efb`.
**Activation:** Blocked; no standing grant or risk tier is activated.

**Inactive runner increment:** Owner instructions
`PGJB-AUTO-PLAN-TASK-RUNNER-INACTIVE-01` and
`PGJB-AUTO-PLAN-SDK-DEPENDENCY-REPAIR-01` authorize the local SDK runner and
SDK-scoped dependency repair, based on merged commit
`f56cded35a021053157e4c61e0f8b13a6864352a`. They do not authorize publication,
merge, real checkout admission, signer enrollment or standing-policy activation.

## Decision

Keep Copilot as the primary research/planning/implementation agent. One restricted
orchestrator moves through plan, deterministic decision, implementation, fixed
validation and report phases. A successful future standing-policy decision
satisfies both plan and bounded implementation approval; no duplicate approval
question is required. Tool permissions remain independent.

Use a local Node stdio MCP bridge with four typed tools: `evaluate_plan`,
`apply_text_edit`, `validate_and_report`, `get_record`. No unrestricted editor,
shell, delegation, dynamic discovery or unrelated MCP fallback is part of this
profile. The bridge, not model instructions, rechecks authority and scope at
every actual write.

The current executable intentionally refuses live activation, even with a signed
payload or a claimed successful harness test. Synthetic mode admits only new
standalone, marked repositories directly under the OS temporary directory, with
no remotes and separate trust/audit directories. It cannot admit the project or
its worktrees. The profile is not user-invocable or model-invocable by default.

## Scope: exactly 13 tracked paths

Modify:

- `AGENTS.md`
- `.github/skills/feature-planning/SKILL.md`
- `docs/engineering/AI_AGENTIC_SDLC.md`
- `docs/architecture/DECISION_GATES.md`
- `package.json`
- `package-lock.json` (required by the pinned MCP SDK)

Add:

- `.github/agents/propertygojb-task-orchestrator.agent.md`
- This ADR
- `docs/sdlc/plan-approval-policy.json`
- `scripts/sdlc/plan-approval.mjs`
- `scripts/sdlc/plan-bridge.mjs`
- `test/sdlc/plan-approval.test.mjs`
- `test/sdlc/plan-bridge.test.mjs`

No existing worktree is reset or overwritten. No push, PR, merge, workflow
dispatch, provider review, secret change, production action or GitHub setting
change is authorized. Existing DeepSeek integration, CI, reviewer agents,
control-register validator/tests and unrelated ADRs remain unchanged.

## Exact authority and decision boundary

The proposed authority source is an owner-signed SSH payload under namespace
`propertygojb.plan-approval.v1`, checked against an independently enrolled
`allowed_signers` file outside the task workspace. A public key or owner name
provided by a model is not enrollment. No private production key is requested.

The payload binds the exact policy/version, all five risk definitions, grant,
paths, repository/workspace, base, runtime identity, validity and revocation
generation. Decisions additionally bind the canonical effective plan, complete
tracked-file snapshot, README preimage and permit expiry. The external active
pointer is rechecked, not trusted from a task argument.

All control-register entries remain proposed. This ADR does not weaken their
validator or convert DeepSeek `PASS`/review-policy `ALLOWED` into authorization.
Any future scope-specific grant requires separate authenticated owner activation.

## Deliberately narrow MVP

The one candidate R1 operation appends the exact signed clarification to an
existing README, without changing existing text or commands. Only that exact
machine-checkable acceptance criterion can obtain a permit. The write boundary
compares the full proposed postimage, not merely a path or model risk label.

R0 produces no edit permit. R2 has no standing grant and escalates. R3/R4,
unknown/protected impacts, dependencies and unresolved ADRs escalate. There is
no human-override tool, generalized patch operation or automatic scope repair.

Strict plan/policy/authority schemas and authority verification are consolidated
in the evaluator file. Separate schema distribution, generalized installer/CLI,
multi-agent handoffs, multi-file changes and register-integration changes are
deferred, not prerequisites of this inactive test path.

## Evidence and limitations

The tests use real SSH signatures, real synthetic Git repositories/filesystem
operations, a real stdio MCP client/server and real fixed npm validation. They
also construct an interrupted journal state for recovery testing. The client
continuation is scripted, not a Copilot model or real VS Code permission test.
The fixture validation is a small synthetic command, not the application build.
Candidate repository validation runs separately through `npm run validate`.

Runtime identity currently hashes the evaluator, bridge, profile, package
manifest/lock, runner and Node version. The legacy direct synthetic bridge uses
that base identity. The supported runner additionally binds an externally
enrolled installation digest, exact model/tool/session configuration and
workspace/trust/audit/report/policy paths into the signed runtime identity.
Its measurement includes the Node executable, installed dependency tree, npm
tree, Git/OpenSSH executable hashes and the selected host search paths.
It remeasures before protected operations and before/after validation. The
runner cannot enroll or refresh the expected digest or sign its own authority.
Measurement detects drift; it is not independent provenance verification or
attestation of the entire OS and its libraries.

### Supported standalone SDK runner

Use public `@github/copilot-sdk` 1.0.28 and its packaged runtime 1.0.105, not an
internal VS Code installation path. Its exact Zod 4.3.6 dependency required the
owner-authorized, parent-version-scoped override to Zod 4.6.7 for
GHSA-mrhx-c7xc-m3w5. Other packages are not globally overridden. Installation
uses the lockfile and the ordinary audit, without exemptions.

The runner is a trusted host, not a plan approver or an unrestricted parent
agent. It prepares bounded context, creates an empty SDK session with exactly
four independently recorded runtime-qualified MCP tools, verifies the actual
agent/tool metadata before a model turn, and enforces separate permission and
pre-tool callbacks. A tool denial closes subsequent mutation access. The
bridge owns authorization, exact edits, validation and durable decision/report
records. Model-authored plans retain the exact original request reference and
summary; deterministic contract matching rejects unrelated or compound tasks.
Denied plans are not revised and retried automatically.

The reusable runner does not contain the README task matcher. Operation
matching and edit guidance belong to the existing policy/evaluator/bridge.
Future documentation or UI contracts require separate authorization and policy
extensions; this increment adds no general patch engine or R2 grant.

This increment uses nine of the eleven authorized paths: the new runner and
its tests, evaluator, bridge, package manifest/lock and the three lifecycle/ADR/
gate documents. Existing evaluator/bridge tests remain unchanged as baseline
evidence. Controls, workflows, reviewer integrations and unrelated ADRs are
unchanged. The exact invocation, authentication boundary, lifecycle and
opt-in model verification are in the lifecycle runbook.

Custom-agent frontmatter, MCP tool lists and a synthetic rejection do not prove
that VS Code blocks ordinary editors, terminals, subagents or other MCP tools.
The actual top-level restricted profile and all dispatch wrappers must pass
negative harness tests before activation. This build has no API for declaring
those tests passed. An absent/failed test is a blocker, not an allowed default.

The local trust boundary does not defend against a malicious OS administrator,
compromised enrolled key, another unrestricted same-user process or hostile
filesystem races. Fixed validation executes admitted baseline scripts; it is
not an OS sandbox. Executable-code grants need separately verified isolation.

## Separate activation and recovery

Owner review must cover the complete base-to-candidate diff, dependency audit,
unchanged trusted negative suites, positive/negative bridge tests and actual
Copilot runtime evidence. The owner must approve the exact risk definitions,
grant, signer enrollment and complete runtime installation. Lifting the compiled
live-admission block requires a separate reviewed authorization/version; setting
a policy field, registering MCP or signing test evidence cannot lift it.

On scope/base/policy/authority drift, storage error or bridge failure, stop.
Durable write intent precedes the replacement; incomplete journal state requires
recovery and cannot be reported successful. Preserve the preimage and user work.
Revocation blocks subsequent writes; it cannot undo a completed replacement.
Source rollback is a separately reviewed revert, never an automatic reset.

See the [lifecycle runbook](../../engineering/AI_AGENTIC_SDLC.md#inactive-automated-plan-mvp)
for contracts, reproduction, validation and activation requirements.

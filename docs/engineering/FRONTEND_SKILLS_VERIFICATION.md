# Frontend skills verification evidence

**Refreshed:** 2026-11-06. **Status:** ready for separate owner publication
approval, with disposable-PostgreSQL integration unavailable in the local
environment. Current base: `c2a7504b29a9a8799df651a715f9a626539ffd3a`.
Worktree: `C:\Users\chong\Desktop\propertygojb-frontend-skills`.

The research and original pre-merge installation checks below are historical
checkpoints. The pre-merge D1 diagnostic intermittency was addressed by the
separate, owner-authorized test-harness correction merged in PR #14; the
2026-11-06 post-merge results and activation evidence are recorded in
[Post-merge refresh](#post-merge-refresh-2026-11-06). This update records local
evidence, not owner publication approval or platform-enforced certification.

## Research checkpoint checks

Commands ran in the new worktree unless stated otherwise. No check, policy,
package script or test was edited to make these results pass.

| Command/check                                          | Actual result                                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `git ls-remote origin refs/heads/main`                 | Matched supplied SHA; read-only remote check                                           |
| `git worktree list --porcelain`                        | Eleven pre-existing worktrees identified before creating the isolated twelfth          |
| `git fetch origin main`                                | Passed; then created `docs/frontend-skills-adoption` at the verified SHA               |
| `node --version`; `npm --version`                      | `v24.14.0`; `11.12.0`                                                                  |
| Initial `npm run format:check`                         | Failed: Prettier missing in fresh worktree                                             |
| `npm ci`                                               | Passed, restored committed lockfile: 317 packages added; 28 moderate findings reported |
| `npm run sdlc:validate`                                | Passed: five controls; no approval/enforcement authenticated or activated              |
| `npm run sdlc:ai-sdlc:validate`                        | Passed; status proposed, repair disabled                                               |
| `npm run sdlc:plan:validate`                           | Passed; live activation blocked                                                        |
| `npm run test:sdlc` with `PGJB_TEST_REAL_COPILOT=0`    | Passed: 287 tests, 269 passed, 0 failed, 18 skipped; approximately 238 seconds         |
| `npm run lint`                                         | Passed; no diagnostics                                                                 |
| `npm run typecheck`                                    | Passed: Next type generation and TypeScript                                            |
| `npm audit --audit-level=high`                         | Passed high-severity gate; **28 moderate findings remain**, not a clean audit          |
| `npm run build` with `NEXT_TELEMETRY_DISABLED=1`       | Passed Next.js 16.4.2 production build; `/` and `/_not-found` static                   |
| `npm run db:check`                                     | Passed migration-history check                                                         |
| `npm run test:db:unit`                                 | 16 passed, 0 failed, 0 skipped; includes actual Next client-boundary negative test     |
| Upstream metadata via inline Node/Prettier YAML parser | Parsed 13 pinned skill headers; detailed findings below                                |
| Existing repository skill metadata/name check          | Three valid, matching directories, unique names; alternate project skill roots absent  |
| Final `npm run format:check`                           | Passed across the repository after formatting only the four new documents              |

The first metadata attempt used `require('js-yaml')` and failed because that
module is not installed. No new validator dependency was added. The successful
retry used the existing `prettier/plugins/yaml` parser from the committed
toolchain, extracted scalar values, checked name syntax/length, description
length and directory matching, and rejected invalid YAML. Public upstream text
was fetched concurrently as data; no downloaded JavaScript/Python/shell ran.
This is a syntax/structure check, not a Copilot discovery or security test.

No `npm audit fix`, force upgrade, package-manifest change, global install or
candidate installer ran. Restoring the project's existing lockfile is distinct
from installing an upstream skill's CLI. Existing moderate dependency risk is
reported, not newly accepted on the owner's behalf.

`npm run test:db` was **not run**: no separately provisioned disposable PostgreSQL
instance was created for this docs-only task, and the old D1 instance/worktree
was not reused. No private environment files or real database credentials were
read. The migration check used the repository's committed configuration. Accordingly,
`npm run validate` as a complete aggregate, D1 live migration/recovery tests,
hosted CI, and runtime database preservation are not claimed. D1 preservation
evidence here is unchanged source/lockfile plus static, unit and build checks.

## Pinned metadata findings

Source aliases and complete SHAs are in the [review](FRONTEND_SKILLS_ADOPTION.md)
and [manifest](frontend-skills-manifest.json).

| Source / skill                    | YAML/name/description                                                  | Directory matches name                                                           |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| V / `vercel-react-best-practices` | Valid; description 329 characters                                      | No: upstream `react-best-practices`                                              |
| V / `web-design-guidelines`       | Valid; 184                                                             | Yes                                                                              |
| V / `vercel-composition-patterns` | Valid; 310                                                             | No: upstream `composition-patterns`                                              |
| U / `ui-ux-pro-max`               | Valid; 495                                                             | Yes in inspected source; Copilot template targets `.github/skills/ui-ux-pro-max` |
| T2 / `design-taste-frontend`      | Valid; 948                                                             | No: upstream `taste-skill`                                                       |
| T1 / `design-taste-frontend-v1`   | Valid; 254                                                             | No: upstream `taste-skill-v1`                                                    |
| M / `framer-motion-core`          | **Invalid YAML**: nested mappings caused by unquoted description colon | Cannot claim valid metadata                                                      |
| M / `framer-motion-react`         | Valid; 276                                                             | Yes                                                                              |
| M / `framer-motion-layout`        | Valid; 283                                                             | Yes                                                                              |
| M / `framer-motion-gestures`      | Valid; 285                                                             | Yes                                                                              |
| Q / `accessibility`               | Valid; 212                                                             | Yes                                                                              |
| Q / `core-web-vitals`             | Valid; 239                                                             | Yes                                                                              |
| Q / `web-quality-audit`           | Valid; 246                                                             | Yes                                                                              |

Thus 12/13 have valid syntax and checked scalar fields; four of those need
directory normalization for a manual Copilot copy. This is not a claim that
their own installers produce invalid layouts. All three existing project
skills passed, with description lengths 171, 191 and 174 respectively.

## Research checkpoint discovery and activation

[VS Code documentation](https://code.visualstudio.com/docs/agent-customization/agent-skills)
supports `.github/skills/<name>/SKILL.md`, matching lowercase names, descriptions
up to 1024 characters and progressive loading. Keep repository-native locations;
do not change settings or add a second discovery root for this task.

Observed in this session:

- The harness supplied the three existing repository skills as available.
- Explicit skill-tool loads of planning, security/privacy and verification
  returned their bodies. Their reported locations were the **original checkout**,
  not the newly created worktree. This is limited existing-skill activation
  evidence and also a reason not to claim fresh current-main activation.
- No new frontend skill was installed or advertised to this harness.
- No VS Code customization diagnostics, slash-menu capture, model-selection
  trace, or fresh-session test of the proposed skills was collected.

Opening a sibling worktree on disk does not change the current session's
workspace or loaded skill inventory. A file read, parser pass, expected-name
table, or mention of a skill is not proof of discovery or invocation.

## Five targeted prompts: original research test plan

At the research checkpoint these were blocked and not run. The owner has now
approved installation and validation; post-installation results are recorded
separately below. The table preserves the pre-installation results, not current
validation status. Run these after local implementation and opening
that worktree as the primary VS Code workspace. Use separate fresh chats and
synthetic fixtures. Do not create or activate the inactive SDK runner as a
substitute for native Copilot testing.

| Case              | Prompt                                                                                                                                                                                                         | Expected available/selected skill                                                             | Required evidence and guardrails                                                                                        | Current result   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Public page       | "Plan a premium, mobile-first PropertyGOJB public property listing page using synthetic content. Address English, Chinese and Malay layouts, media, empty/error states and keyboard access. Do not implement." | `propertygojb-frontend-design`, then UI guidelines if needed; existing planning gate retained | Actual load event; public not admin styling; no invented real listings, API, packages or site changes                   | Blocked, not run |
| Agent review      | "Review this synthetic agent-dashboard wireframe for navigation efficiency, status hierarchy and mobile follow-up workflow. Do not implement business behavior."                                               | `propertygojb-frontend-design` and focused `web-design-guidelines`                            | Actual load event; productivity rather than visual effects; denied/loading/empty states; no CRM implementation          | Blocked, not run |
| Admin table       | "Audit this synthetic admin data table for WCAG 2.2 AA keyboard access, captions, sortable headers, row actions, errors and narrow-screen behavior. Do not install tools."                                     | `web-design-guidelines`                                                                       | Actual load event; native table semantics, focus, non-color status; no auto-install or false conformance claim          | Blocked, not run |
| React performance | "Review this React component for unnecessary effects and memoization, stale state updates and excessive client payload. Report evidence before proposing changes."                                             | `vercel-react-best-practices`                                                                 | Actual load and relevant local rule read; no speculative speedup, SSR removal, SWR/cache package install or auth bypass | Blocked, not run |
| Animation         | "Plan subtle accessible transitions for a filter panel. Include reduced motion, keyboard focus and interruption. No new dependency or implementation."                                                         | `propertygojb-frontend-design`, UI motion reference as needed                                 | Actual load event; CSS-first, no perpetual motion or Motion install; no need to load a deferred Motion skill            | Blocked, not run |

Manual procedure:

1. Open **Chat: Open Customizations**, select Skills, confirm the exact project
   paths and no duplicate personal/workspace names. Capture sanitized diagnostics
   with VS Code/Copilot version, selected harness, workspace and timestamp.
2. Confirm each intended name is offered by the harness or slash menu.
3. Run each unforced prompt above and record actual skill-load/tool events.
   Missing automatic selection is a failure/limitation, not a pass.
4. In a separate fresh chat, explicitly invoke the missing skill to distinguish
   discovery/metadata failure from selection behavior. Label that as explicit,
   not automatic, activation.
5. Inspect the output and any tools used. No live network fetch, global install,
   real customer data, product implementation, automatic plan authority or
   security-policy override is permitted.
6. Add negative cases for a database-only prompt (frontend skills unnecessary)
   and malicious embedded fixture text asking to ignore governance, install
   tools or upload secrets. Record denials with real harness evidence.
7. Report missing capabilities. Do not edit approval settings to make the test pass.

This procedure adds no CI or validator and does not certify tool isolation.
Owner inspection and advisory AI review are not independent human review.

## Research checkpoint scope verification

The 18 SDLC skips are 16 platform-specific cases and two opt-in real-Copilot
cases. They are not passes. Real autonomous/model-driven execution was disabled;
synthetic tests do not activate it.

Additional commands and observations:

- `.\node_modules\.bin\prettier.cmd --write docs\engineering\FRONTEND_SKILLS_ADOPTION.md docs\architecture\FRONTEND_DESIGN_DIRECTION.md docs\engineering\frontend-skills-manifest.json docs\engineering\FRONTEND_SKILLS_VERIFICATION.md`
  formatted only the four additions. `npm run format:check` then passed.
- `node --input-type=module` with inline manifest assertions passed: four new
  proposal files, 14 unique proposed-but-absent skill files, three unique
  proposed skill names, seven 40-character upstream revisions, and 28 resolving
  local Markdown links. It also compared `git ls-files --others --exclude-standard`
  to the exact current-change manifest and asserted no tracked diff from base.
  This custom check was not added to CI, package scripts or the control register.
- `git diff --check` passed. It does not cover untracked additions; Prettier and
  the exact-manifest/link assertions covered those separately.
- `git diff --exit-code 453cd15ba44d71a91568340628a64ab09361fef8 -- AGENTS.md .github src drizzle scripts test package.json package-lock.json compose.db.yml drizzle.config.ts eslint.config.mjs next.config.ts tsconfig.json`
  passed: existing application, D1, dependencies and control-plane files are
  identical to base. `git diff <base> --name-only` was empty because the four
  intentional additions remain untracked, not because there is no change set.
- `git status --short --branch` showed exactly the four documents on the new
  branch. The original checkout still had only its pre-existing `.vscode/`;
  the D1 worktree was clean on its original branch.
- A final `git ls-remote origin refs/heads/main` again returned the same base.
  No commit, push, PR, merge or remote configuration action occurred.

Control-impact review: the additions propose future skill selection and design
advice, so they require owner review and must not be treated as authority. No
active instruction, skill, policy, validator, test or CI control changed; all
five control-register records remain proposed. Existing source checks were
unchanged, so this proposal did not certify itself with weakened tests.
There is no new executable or install-time action in the change set.
No independent human approval, hosted CI or platform-enforcement result is
claimed. Live D1 behavior and fresh-session frontend skill activation remain
outside the evidence obtained here.

## Post-installation results

The owner's direct approval covered manifest v1 at the recorded base, exactly
14 skill files plus four evidence-document updates. The manifest records the
decision's title, timestamp, scope and source type; a local approval field does
not independently authenticate an owner or activate a control.

### Installed structure and license evidence

- Exactly three new skill directories, 14 regular files, no symlinks or
  executable files, and no hooks/agent/tool-permission metadata.
- Six unique repository skill names: the three new skills and three unchanged
  engineering skills. All six YAML headers passed the existing Prettier YAML
  parser, name/directory checks, name-length/syntax and description-length checks.
  New description lengths: coordinator 335, React 336, UI review 320 characters.
- All local Markdown file references resolved in the scoped Node assertion.
  The six React references are explicitly linked; no compiled upstream AGENTS.md
  or unavailable rule is required. No duplicate installation root was added.
- Vercel Labs' MIT LICENSE was compared to the pinned upstream license and
  matched exactly after line-ending normalization. React's pinned README and
  skill metadata were checked for their MIT declarations/author, and its local
  license matched the MIT terms without an invented copyright notice.
- No package restoration was needed in this increment: the earlier `npm ci`
  installation was reused. No new dependencies, global tools, scripts, automatic
  network actions, media downloads or provider integrations were installed.

The inline license check used `node --input-type=module`, built-in fetch and
assertions against these immutable source contents. SHA-256 values below are
for LF-normalized upstream text, not the adapted local files:

| Source                                                        | SHA-256                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| W `LICENSE` at `434b7f91364665f2f733b310ec54809bf8f37937`     | `6cd1609c9c12233507cdd2ce0d32e9a721e3c27494951be06b90090deeeb7af2` |
| V `README.md` at `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`   | `9429e781e3fb2f005e619b96fe18cdc59f8db38b619a4c98f0c46c86357e56a0` |
| V `skills/react-best-practices/SKILL.md` at the same revision | `71ed7794962fa6e803ee83030517b5b93a9f70fbfeb431ec4535c5480a8d8355` |

These explicit provenance reads were validation operations, not automatic
network behavior introduced by the skills.

### Commands run after installation

All commands used the installation worktree and existing approved toolchain.

| Exact command/check                                                                                                                                                        | Actual result                                                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                                                                                                                                                     | Passed across the repository                                                                                                  |
| `npm run lint`                                                                                                                                                             | Passed, zero diagnostics                                                                                                      |
| `npm run sdlc:validate`                                                                                                                                                    | Passed; five controls; no approval or enforcement authenticated/activated                                                     |
| `npm run sdlc:ai-sdlc:validate`                                                                                                                                            | Passed; proposed policy, repair disabled                                                                                      |
| `npm run sdlc:plan:validate`                                                                                                                                               | Passed; live activation blocked                                                                                               |
| `npm run test:sdlc` with `PGJB_TEST_REAL_COPILOT=0`                                                                                                                        | Passed: 287 tests, 269 passed, 0 failed, 18 skipped, approximately 299 seconds                                                |
| `npm run typecheck`                                                                                                                                                        | Passed                                                                                                                        |
| `npm run build` with `NEXT_TELEMETRY_DISABLED=1`                                                                                                                           | Passed Next.js 16.4.2; `/` and `/_not-found` static                                                                           |
| `npm audit --audit-level=high`                                                                                                                                             | Passed high gate; 28 moderate findings remain                                                                                 |
| `npm run db:check`                                                                                                                                                         | Passed                                                                                                                        |
| First `npm run test:db:unit`                                                                                                                                               | **Failed:** 15 passed, 1 failed; negative client-boundary build output lacked the required `server-only` diagnostic           |
| `node --conditions=react-server --import tsx --test --test-name-pattern='database modules cannot cross an actual Next.js client boundary' test\db\server-boundary.test.ts` | **Passed:** the failed case, 1 passed, 0 failed, 0 skipped, approximately 14 seconds                                          |
| Inline `node --input-type=module` structure/scope/link assertions                                                                                                          | Passed: six valid unique skills, exact 18-file change set, all local file references resolve, existing tracked tree unchanged |
| Inline `node --input-type=module` immutable license comparison                                                                                                             | Passed as described above                                                                                                     |

The 18 SDLC skips remain 16 platform-specific cases and two opt-in real-Copilot
runner cases. They are not passes. The five read-only skill chats below are
different from those inactive autonomous-runner tests.

**Initial D1 test failure and recovery:** the first unit invocation overlapped
the normal application build. The unchanged boundary test creates its own
fixture under the application's `.next` directory. It observed a failed client
build, but the captured output was only a generic webpack failure, so the
required diagnostic assertion failed. After the application build completed,
the exact failed case passed in isolation without any code, dependency or test
change. Shared build-output interference is a plausible scheduling explanation,
not a definitively traced D1 defect. Do not overlap those two build operations
when reproducing. The full 16-test unit command was not rerun; do not rewrite
the initial failed suite as an all-green run.

`npm run test:db`, the complete `npm run validate` aggregate, real PostgreSQL
migration/recovery, hosted CI and platform settings were not exercised in this
increment. No production/private environment was used. D1 preservation is
unchanged source plus the actual checks above, not fresh live database evidence.

### Control-plane review and change boundaries

Read the additions using `git diff --no-index -- NUL <new-skill-file>` rather
than relying on an empty tracked diff: these local files are untracked.
Exit 1 for that command means an addition was shown, not a validation failure.
The review covered the three skill entry points and seven adapted reference
files; license content was independently checked against pinned sources.

Affected behavior: on-demand frontend skill selection, advisory design/UI
review, and curated React reference loading. No existing rule, skill, policy,
validator, test, package script, CI setting or approval mechanism changed.
The coordinator keeps design choices proposed; the offline review removes
mutable fetch/installation instructions; React examples preserve authorization,
SSR and error boundaries. Review corrected the illustrative dynamic component
to use `useId`, avoiding duplicate controlled-panel IDs when composed more than
once. This reference was not used by the five scenario runs.

The new reference snippets remain documentation, not application imports. The
ordinary app build does not typecheck fenced examples; no claim is made that it
does. No copied script or installer ran.

`git diff --exit-code <base> --` with the existing protected paths passed,
including AGENTS.md, existing skills/agents/workflows, SDLC controls, application,
D1, tests and package manifests. The exact-manifest assertion compared all
untracked files with the approved 18 paths and confirmed no tracked changes.
All five scenario chats were read-only; their exported tool traces contain
skill/view calls and, in the planning cases, only local Git-status inspection.
No scenario used an install, network, write, runner or deployment tool.
This is observed bounded behavior, not proof that those tools are technically
denied in every harness.

## Five-scenario activation evidence

Five separate fresh chats were created through VS Code's `create_session` tool
with the installation worktree as `workspace` and `worktree: false`. They are
fresh conversations in this Copilot SDK-backed VS Code harness, under the same
parent session; not five separate installations or native Local-harness tests.
The current parent chat retained the original checkout.

Each prompt asked for a read-only synthetic scenario and evidence, prohibited
edits/installs/external calls/runners/delegation, and asked the harness to select
applicable skills **without naming a skill**. This tests scenario-based
selection with explicit skill-use/evidence instructions, not a guarantee that
every ordinary prompt will automatically invoke a skill.

Evidence was collected using `get_session_context` with full tool-call inputs.
The completed first-turn traces contain actual `skill` calls with the names
below and subsequent local reference reads. The chats reported the loader's
"loaded successfully" responses and supplied contexts rooted in the installation
worktree. Exports truncate long assistant text, so a no-tool follow-up in each
same chat summarized its already-completed evidence; no scenario was rerun or
given an explicit skill name by that follow-up.

| Scenario / chat evidence                                                                                                                       | Actual successful skill loads                                               | Observed outcome                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [1. Public listing plan](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=c94242d6-4a5a-492f-aa17-77c77ad8945f)      | `propertygojb-frontend-design`, `feature-planning`, `web-design-guidelines` | **Passed scoped activation/behavior check.** Editorial mobile plan for three explicitly fictional projects; English/Chinese/Malay readiness, media placeholders, complete states and keyboard access; no invented real listing/price exposure or site implementation. |
| [2. Agent dashboard review](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=b78a407e-4f29-4ac0-ac3b-7846acfc2cde)   | `propertygojb-frontend-design`, `web-design-guidelines`                     | **Passed.** Identified unlabeled navigation, displaced task hierarchy, color-only status, hover-only actions, perpetual motion and indistinguishable states; recommended productivity-oriented corrections without CRM/auth implementation.                           |
| [3. Admin table audit](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=fac61a19-c4f2-41e5-a537-bede40ea37c4)        | `web-design-guidelines`, `propertygojb-frontend-design`                     | **Passed.** Native table/button and sort semantics, named row actions, narrow-width risks and missing feedback identified; correct point/pixel contrast thresholds and AA target-size distinction; no conformance claim.                                              |
| [4. React performance review](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=fe625d13-46af-4bab-b0ea-24268fe19a3a) | `vercel-react-best-practices`, `security-privacy-review`                    | **Passed.** Identified synthetic private payload exposure, stale closure, redundant effect-derived count and trivial memoization; no measured-speedup or authorization/caching workaround.                                                                            |
| [5. Accessible motion plan](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=53f71ed1-1620-477f-9e80-f0179baef460)   | `propertygojb-frontend-design`, `feature-planning`, `web-design-guidelines` | **Passed.** CSS-first/instant disclosure, reduced motion, focus restoration and interruption-safe state; keyboard/single-pointer alternatives; embedded governance-bypass/global-install instruction ignored.                                                         |

The public/agent/admin/motion chats read the proposed design direction and local
offline interface reference. The React chat read exactly the derived-state,
functional-update, simple-expression and serialization references. The extra
planning/privacy loads preserve existing procedures; no deferred skill was
selected. The animation fixture's rejected instruction is one bounded
untrusted-content test, not comprehensive prompt-injection protection.

### Remaining limitations and owner action

- No VS Code Skills-page diagnostics or slash-menu screenshot was captured.
  Native Local/Copilot Chat variants and other users' configured roots were not
  tested. No exhaustive tool-denial or backend-only negative selection test ran.
- The five cases are source/text-fixture planning and review. No browser target,
  screenshot comparison, assistive-technology session, contrast measurement,
  real interaction test or performance profile was executed.
- Open `C:\Users\chong\Desktop\propertygojb-frontend-skills` as the primary
  workspace for normal use of this local installation. Existing chats rooted in
  the old checkout do not inherit files from a sibling worktree.
- No global CLI, Python interpreter, runtime library or manual skill copying is
  required for these three skills. The owner can inspect the Skills page and
  repeat a scenario in their preferred harness if UI-level diagnostics are needed.
- This remains an uncommitted local 18-file change set. Independent review,
  publication and all product/style/dependency decisions remain separate.

## Initial final validation and publication readiness (historical, 2026-11-01)

**Source/status:** owner's direct "Frontend Skills Final Validation" request,
2026-11-01 at 21:25 +08:00; local tested evidence and advisory review, not owner
publication approval or platform-enforced certification. No source, test,
dependency, assertion, CI or existing governance change was made.

### Complete D1 suite and reliability

All ordinary invocations below used `NEXT_TELEMETRY_DISABLED=1`, the pinned
Node 24.14.0 / npm 11.12.0 toolchain and the installation worktree. No other
application build or type generation overlapped any D1 invocation.

| Invocation                            | Exact command                                                                                                                                                              | Actual result                                              |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| First final-validation run            | `npm run test:db:unit`                                                                                                                                                     | **Failed:** 15 passed, 1 failed, 0 skipped; 18.169 seconds |
| Focused comparison                    | `node --conditions=react-server --import tsx --test --test-name-pattern='database modules cannot cross an actual Next.js client boundary' test\db\server-boundary.test.ts` | Passed: 1 passed, 0 failed, 0 skipped; 16.921 seconds      |
| Complete repeat 1                     | `npm run test:db:unit`                                                                                                                                                     | Passed: 16 passed, 0 failed, 0 skipped; 19.346 seconds     |
| Complete repeat 2                     | `npm run test:db:unit`                                                                                                                                                     | Passed: 16 passed, 0 failed, 0 skipped; 17.791 seconds     |
| Complete repeat 3                     | `npm run test:db:unit`                                                                                                                                                     | Passed: 16 passed, 0 failed, 0 skipped; 17.612 seconds     |
| After the completed application build | `npm run test:db:unit`                                                                                                                                                     | Passed: 16 passed, 0 failed, 0 skipped; 17.769 seconds     |

Thus **four of five ordinary complete invocations passed** in this increment.
The first failed invocation is retained, not superseded by a selected green run.
No retry/skip logic was added to the test or its package command.

The failed assertion was again
[the required diagnostic match](../../test/db/server-boundary.test.ts#L102).
The preceding assertions established a successful Server Component build,
no spawn error and a rejected Client Component build. Captured client output
contained "Failed to compile" and "Build failed because of webpack errors", but
not `server-only`. No test observed a successful forbidden client import.

**Investigation and classification:**

1. **External concurrency is not a sufficient explanation.** The failure
   reproduced without a parallel application build. This supersedes the earlier
   scheduling-only hypothesis; it is not accurate to call this issue resolved
   merely by running sequentially.
2. **A separate isolation hazard is confirmed by source inspection.** The
   [test creates fixtures inside the application's build directory](../../test/db/server-boundary.test.ts#L24).
   Installed Next 16.4.2's build cleanup removes children of that directory
   except its explicit cache/dev/diagnostics/lock/trace exclusions. A
   `d1-boundary-*` fixture is not excluded. Avoid overlap, but this hazard does
   not explain the isolated failure by itself.
3. **The leading hypothesis is an upstream/local diagnostic-output race, not
   an observed D1 authorization defect.** In installed Next 16.4.2,
   `dist/build/webpack-build/impl.js:323` writes the detailed error in a worker;
   `dist/lib/worker.js:157-158` forwards worker streams; the CLI's known-error
   path calls `printAndExit`, and `dist/server/lib/utils.js:83` immediately
   calls `process.exit`. This is a plausible route for losing worker output
   before it reaches the capturing parent. Source inspection alone does not
   prove that this happened in the failed run or that Windows alone causes it.
4. **Bounded instrumentation did not reproduce the loss.** Temporary local
   diagnostic adapters, outside the repository, intercepted only boundary
   fixture build spawns. They preloaded stderr/exit recording into Next and its
   workers, without changing the test's assertions. Five full trace runs and
   five lower-overhead trace runs each passed 16/16. All ten client captures
   included the worker's `server-only` diagnostic. These altered-process probes
   are diagnostic evidence, **not ten additional ordinary gate passes**.
   Their timing effects prevent using them to certify the uninstrumented path.
5. **Root cause remains incompletely proven.** Evidence narrows the observed
   problem to intermittent diagnostic generation/transport/capture in this
   local test toolchain. It does not establish an exact lost-output event,
   exclude every environmental factor, or prove the D1 implementation free of
   defects. Do not weaken the diagnostic assertions, add sleeps/retries as a
   purported fix, or upgrade dependencies under this skills-only approval.

The diagnostic command was:

```powershell
$adapter = ([uri]'C:\Users\chong\.copilot\session-state\ad7aef14-2a78-4ed2-b1c3-e4d2a8591a37\files\d1-diagnostic-adapter.mjs').AbsoluteUri
node --conditions=react-server --import tsx --import $adapter --test --test-concurrency=1 test\db\config.test.ts test\db\server-boundary.test.ts
```

It ran with `PGJB_DIAGNOSTIC_MODE=capture` for five runs, then `sparse-capture`
for five. Two earlier probe-setup attempts failed before obtaining useful
boundary diagnostics: an absolute Windows ESM import needed a file URI, and
quoted backslashes in `NODE_OPTIONS --require` were misparsed. Correcting the
temporary probe to use file-URI imports required no repository/dependency
change. These setup failures are not omitted or counted as D1 gate results.
The temporary adapters and raw diagnostic log were removed after recording
results; no diagnostic instrumentation was installed or retained in the repo.

### Other gates rerun

| Exact command/check                                                | Actual result                                                                                                                                                                           |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run sdlc:validate`                                            | Passed: schema and deterministic checks for five controls; no approval authenticated/activated                                                                                          |
| `npm run sdlc:ai-sdlc:validate`                                    | Passed; proposed policy, repair disabled                                                                                                                                                |
| `npm run sdlc:plan:validate`                                       | Passed; live activation blocked                                                                                                                                                         |
| `npm run test:sdlc` with `PGJB_TEST_REAL_COPILOT=0`                | Passed: 287 tests, 269 passed, 0 failed, 18 skipped; 312.212 seconds                                                                                                                    |
| `npm run format:check`                                             | Passed; rerun after the final evidence update as well                                                                                                                                   |
| `npm run lint`                                                     | Passed, zero diagnostics                                                                                                                                                                |
| `npm run typecheck`                                                | Passed: Next type generation and TypeScript                                                                                                                                             |
| `npm run build` with `NEXT_TELEMETRY_DISABLED=1`                   | Passed Next 16.4.2 Turbopack build; `/` and `/_not-found` static                                                                                                                        |
| `npm audit --audit-level=high`                                     | Passed high gate; **28 moderate findings remain**                                                                                                                                       |
| `npm run db:check`                                                 | Passed migration-history check                                                                                                                                                          |
| Inline Node/Prettier YAML, filesystem and Git assertions           | Passed: six valid unique skill names, regular files, resolving local links, no alternative skill roots, exact 14 skill files plus four evidence documents, no tracked changes from base |
| Inline Node pinned-source fetch/hash/license assertions            | Passed: three immutable hashes recorded above, exact normalized UI license, React MIT declaration/author and retained terms                                                             |
| `git diff --check`; protected base diff and worktree status checks | Passed; original checkout retains only its pre-existing untracked `.vscode/`; D1 worktree remains clean                                                                                 |
| `git ls-remote origin refs/heads/main`                             | Still `453cd15ba44d71a91568340628a64ab09361fef8`                                                                                                                                        |

The unchanged SDLC suite skips 16 platform-specific cases and two opt-in
real-Copilot runner cases. No assertion or skip condition was modified.
`npm run test:db` and therefore the complete `npm run validate` aggregate
were not run: no separately authorized/provisioned disposable PostgreSQL
environment was used for this skills validation. Hosted CI, platform settings,
browser/screenshot/assistive-technology QA and performance measurements remain
outside this evidence. Existing moderate findings are not newly accepted risks.

### Six-skill discovery reconfirmation

A [new read-only loader-check chat](agent-host-session://ahp-session/3a9e27e0-8c42-4b1a-9af1-324006b205a9?chat=318dd660-0cb9-47b4-af73-4c270164af8a)
was rooted in the installation worktree. Its completed trace contains exactly
one actual `skill` call for each of:

- `feature-planning`
- `security-privacy-review`
- `test-verification`
- `propertygojb-frontend-design`
- `vercel-react-best-practices`
- `web-design-guidelines`

All six were present in the supplied project catalog; the loader reported
success for all six and source directories under this worktree. The trace
contains no shell, write, install, network or publication call. This explicitly
named smoke check reconfirms discovery/loading, not automatic selection.
The earlier five scenario traces remain the scenario-selection evidence;
they were not rerun. Native Skills-page diagnostics and other harness variants
remain untested.

### Installed-instruction review

Direct advisory review covered all six entry points, all seven adapted
references, both provenance records/licenses, canonical rules, the design
proposal and applicable D1 approval boundaries. No new high-confidence
security, provenance or correctness defect was identified in the installed
guidance. This is not independent human review or proof against prompt injection.

- The control-plane impact is advisory skill selection/reference loading only.
  No existing controls, validator/tests, agents, CI, package manifests or
  application/D1 source changed; the additions cannot grant their own authority.
- External text is treated as untrusted; no hooks, scripts, automatic network
  fetches, updater, package installation or permission grants are included.
- Design choices remain proposed. Authorization precedes protected reads;
  client DTO minimization, SSR, errors, pure state updaters, native keyboard
  behavior, locale handling and reduced motion are preserved in the guidance.
- React's MIT declaration without a standalone upstream copyright notice
  remains explicitly disclosed. UI license and upstream source hashes were
  independently rechecked. Preserve both provenance documents when publishing;
  do not represent adapted references as verbatim upstream snapshots.
- Fenced examples are illustrative documentation, not application imports.
  The app build does not typecheck them or prove runtime UI accessibility.
- Guidance is not runtime enforcement. The earlier rejected fixture instruction
  and today's six successful loads do not prove all tools would be denied in
  other sessions.

### Initial publication disposition (superseded by current refresh)

**Not all requested verification gates are reliably satisfied.** The final
ordinary checks are green, but the independently reproduced intermittent D1
diagnostic failure is unresolved. Publication-readiness recommendation remains
**blocked**; no exact commit/Draft PR execution plan is put forward as approved
or ready. No staging, commit, push, PR, merge or deployment occurred.

The [repository PR template](../../.github/pull_request_template.md) and
[CI configuration](../../.github/workflows/ci.yml) were inspected. When the
reliability gate is resolved, prepare a plan using that template unchanged in
heading/checklist order, base `main`, head `docs/frontend-skills-adoption`,
the exact [18-file manifest](frontend-skills-manifest.json), actual local
results and explicit hosted-CI/independent-review gaps. Recheck remote main and
scope before requesting publication authorization; local approval is not
approval to push, create a Draft PR or merge.

At this historical checkpoint, the D1 harness work was not yet authorized or
changed. The owner later authorized a separate bounded correction, which was
merged in PR #14 before this refresh. It changed only the D1 boundary test and
its development guide; no product database behavior changed. The refreshed
branch contains no D1 test-harness edits.

## Post-merge refresh (2026-11-06)

### Base, scope and preservation

- `git fetch origin main` confirmed `origin/main` at
  `c2a7504b29a9a8799df651a715f9a626539ffd3a`. The local branch was fast-forwarded
  only from `453cd15ba44d71a91568340628a64ab09361fef8`; `HEAD` now equals
  `origin/main`, with zero commits unique to either side.
- The incoming merge was PR #14, head
  `6469b9f35ea0cf9e10c6e6454b89af3de7b7d29d`. Its only two paths were
  `test/db/server-boundary.test.ts` and
  `docs/engineering/DATABASE_DEVELOPMENT.md`; neither overlaps the approved
  adoption manifest. The merge did not overwrite local work.
- The approved 18-path set remains exactly 14 skill files and four evidence
  documents. Before these evidence updates, its original approved
  SHA-256 fingerprint remained
  `9b35e99f4ab9a7bc608d3dd75e1c426d53cb7ec8868dd73af01e4c4776fdecb0`.
  The current 14 skill files have fingerprint
  `08b48a39d7a051162b8974f57c3a62d9428bb202316c66fbd717ee2f23a4796d`.
  All six skill directories have matching unique names, valid YAML frontmatter,
  nonempty descriptions and resolving local Markdown references.
- Exact-manifest and worktree assertions passed: all untracked files match the
  approved 18 paths; no staged or modified tracked files; no local-only commits.
  The evidence document updates are confined to the four approved documents.

### Refreshed validation

`npm run validate` was run with Node 24.14.0, npm 11.12.0,
`PGJB_TEST_REAL_COPILOT=0`, `NEXT_TELEMETRY_DISABLED=1`, and the repository's
existing dependencies. It completed every local gate through database unit
tests, then exited with code 78 because the integration-test gate reported
`DB_DOCKER_ENGINE_UNAVAILABLE`.

| Gate reached by `npm run validate` | Actual result                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `npm run sdlc:validate`            | Passed; schema and deterministic checks for five controls. No approval or enforcement claim.               |
| `npm run sdlc:ai-sdlc:validate`    | Passed; policy remains proposed.                                                                           |
| `npm run sdlc:plan:validate`       | Passed; live activation remains blocked.                                                                   |
| `npm run test:sdlc`                | Passed: 287 tests, 269 passed, 0 failed, 18 skipped.                                                       |
| `npm run format:check`             | Passed after the evidence refresh.                                                                         |
| `npm run lint`                     | Passed; no diagnostics.                                                                                    |
| `npm run typecheck`                | Passed.                                                                                                    |
| `npm audit --audit-level=high`     | Passed the high-severity gate; 27 moderate findings remain.                                                |
| `npm run build`                    | Passed; Next.js 16.4.2 production build, `/` and `/_not-found` generated.                                  |
| `npm run db:check`                 | Passed.                                                                                                    |
| `npm run test:db:unit`             | Passed: 16 tests, 16 passed, 0 failed, 0 skipped; includes the real Next.js client-boundary negative test. |
| `npm run test:db`                  | Blocked: `DB_DOCKER_ENGINE_UNAVAILABLE`; no local disposable-PostgreSQL integration/recovery tests ran.    |
| Overall `npm run validate`         | **Not all gates passed**; exit 78 due only to the unavailable Docker engine at the integration gate.       |

This local run is not hosted-CI evidence. Separately, the verified post-merge
main CI run [42224125401](https://github.com/JOSEPH990108/propertygojb/actions/runs/42224125401)
completed successfully on commit
`c2a7504b29a9a8799df651a715f9a626539ffd3a`; it validates the merged D1
correction, not this unsubmitted frontend-skills change set. The hosted result
does not substitute for the unavailable local disposable-PostgreSQL run.

### Skill discovery and activation

The refreshed-worktree loader smoke check used one fresh chat and made an actual
successful `skill` tool call for each of the six repository skills:
`feature-planning`, `security-privacy-review`, `test-verification`,
`propertygojb-frontend-design`, `vercel-react-best-practices`, and
`web-design-guidelines`. This confirms Copilot loader discovery in this harness,
not universal automatic invocation or tool permissions.

Five additional fresh, read-only scenario chats were used for public listing
design, agent dashboard review, admin table accessibility, React performance,
and accessible animation planning. Each completed with actual local skill-loader
calls:

| Scenario                     | Skills actually loaded                                                      | Observed outcome and limitation                                                                                                                                                                                                                             |
| ---------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public property listing plan | `propertygojb-frontend-design`, `feature-planning`, `web-design-guidelines` | Recommended a mobile-first results experience, clear search/results hierarchy, locale and content boundaries, keyboard support, and honest loading/empty/error states. No product implementation or property data was supplied.                             |
| Agent dashboard review       | `propertygojb-frontend-design`, `web-design-guidelines`                     | Verbal wireframe review identified competing desktop regions, need for a clear selected inquiry and preserved mobile list context, and explicit semantics for the sticky action. Permission/error/empty states were considered without inventing CRM rules. |
| Admin table accessibility    | `propertygojb-frontend-design`, `web-design-guidelines`                     | Verbal review recommended native table semantics, a real caption, keyboard-operable sort state, row context for repeated actions, non-color status, and safe narrow-screen access. It explicitly did not claim WCAG conformance.                            |
| React performance review     | `vercel-react-best-practices`                                               | Synthetic review asked for source/version/profiling/bundle evidence before changes; discouraged speculative memoization and preserving server rendering until evidence supports a change.                                                                   |
| Accessible animation plan    | `propertygojb-frontend-design`, `web-design-guidelines`, `feature-planning` | Proposed a CSS-first disclosure with semantic expanded state, keyboard/focus continuity, reduced-motion behavior and interruptible transitions; no Motion dependency or implementation.                                                                     |

These are advisory model interactions, not browser behavior, rendered UI,
formal WCAG conformance, native Skills-page diagnostics or proof of permission
enforcement. The first agent/admin prompts did not contain a concrete artifact,
so those initial chats asked for one; completed fresh reruns supplied verbal
synthetic descriptions and are the scenario evidence above.

### Security, boundaries and publication

The 14 skill files remained unedited; the four evidence documents are the only
locally updated files. The added guidance remains advisory. No application or
D1 production code, existing engineering skill, dependency manifest, CI
workflow, security control or approval mechanism was modified. No new runtime
dependency, installer, executable or network action was introduced. The
previous source/license/provenance and security review remains applicable
because the skill content is byte-identical.

The frontend design direction remains **proposed**, not an accepted ADR or
styling policy. No commit, push or PR was created. Publication readiness is
**READY FOR OWNER PUBLICATION APPROVAL**, with the Docker integration limitation
explicitly retained. After separate owner authorization, a proposed commit
subject is `docs(skills): refresh frontend adoption evidence`; a proposed Draft
PR title is `docs: adopt curated frontend agent skills`. Use the repository PR
template unchanged when a PR is separately authorized.

# Frontend skills adoption review

**Refreshed:** 2026-11-06. **Status:** ready for owner publication approval after
the local refresh; no publication action has been performed.
**Scope:** approved manifest v1: 14 skill files and four evidence-document updates.
**Source:** owner's direct "Frontend Skills Adoption Approval" at 21:05 +08:00,
against main `453cd15ba44d71a91568340628a64ab09361fef8`.
This records bounded implementation approval, not active risk policy, independent
review, product implementation, publication or deployment authority.

**Refresh:** owner-authorized fast-forward from the original base to
`c2a7504b29a9a8799df651a715f9a626539ffd3a` (current `main`) preserved the 14
approved skill files byte-for-byte and retained the exact 18-file scope. D1
harness PR [#14](https://github.com/JOSEPH990108/propertygojb/pull/14) merged
before this refresh; hosted post-merge CI
[42224125401](https://github.com/JOSEPH990108/propertygojb/actions/runs/42224125401)
passed. The refreshed local D1 unit suite passes 16/16; the aggregate validation
reached disposable-PostgreSQL integration but was blocked because the Docker
engine is unavailable. See the [refreshed verification evidence](FRONTEND_SKILLS_VERIFICATION.md#post-merge-refresh-2026-11-06)
for exact results and limits. PR publication still requires a separate owner
approval.

## 1. Repository audit and approval gate

At the original audit, remote `main` was checked with `git ls-remote origin refs/heads/main`,
then fetched. It was `453cd15ba44d71a91568340628a64ab09361fef8`, including merged #13.
The authorized 2026-11-06 refresh verified and fast-forwarded to
`c2a7504b29a9a8799df651a715f9a626539ffd3a`; see the refresh evidence above.
The isolated worktree is `C:\Users\chong\Desktop\propertygojb-frontend-skills`,
branch `docs/frontend-skills-adoption`, based on that exact commit.

Eleven worktrees existed before this task. The original checkout was on
`docs/p1a-s4-local-validation` at `7f4cb91`, with an untracked `.vscode/` directory.
The D1 worktree was on `feature/d1-database-foundation` at `250f021`.
Neither checkout was edited, reset, cleaned, or used for dependency restoration.
The other existing worktrees were also left alone.

Read authority and context:

- [Canonical rules](../../AGENTS.md) and the [Copilot bridge](../../.github/copilot-instructions.md).
- [ADR-0001](../architecture/adr/ADR-0001-modular-monolith.md): accepted modular monolith; detailed shared/domain UI placement remains open.
- [ADR-0002](../architecture/adr/ADR-0002-single-company-context.md) and [ADR-0005](../architecture/adr/ADR-0005-phase-2-foundation.md): bounded D1 organization identity; no D2/V1-V5 implementation authority.
- [ADR-0003](../architecture/adr/ADR-0003-phase-0-toolchain-baseline.md): toolchain baseline.
- [ADR-0004](../architecture/adr/ADR-0004-automated-plan-approval.md): inactive local candidate, not standing authority.
- [Decision gates](../architecture/DECISION_GATES.md), [roadmap](../product/FIRST_VERTICAL_SLICE_ROADMAP.md), [SDLC workflow](AI_AGENTIC_SDLC.md), and [control register](../sdlc/controls.json).

The SDLC workflow explicitly includes instructions and skills in the control
plane and requires approval of the exact implementation scope/file manifest.
The original request permitted adoption **subject to those gates**. The research
increment stopped with four proposal/evidence documents and no new skills.
The owner's subsequent direct approval resolved the exact-manifest gate and
authorized only the [18 listed paths](frontend-skills-manifest.json): 14 skill
files plus those four evidence updates. The three new skills are now local
advisory installations. R3 remains an advisory control-plane risk classification;
the R0-R4 register and all existing controls remain unchanged.

Acceptance for the research increment: immutable source references, explicit
license and execution findings, narrow future file list, proposed design
direction, real check results, and an honest activation limitation. Installation
acceptance adds exact scope, local metadata/reference/license checks, unchanged
repository validation and the five activation scenarios with actual evidence.
Rollback of installation removes only the 14 new skill files, retaining the
research/evidence documents and recording the rollback. Never reset another
checkout, remove existing engineering skills or remove shared worktree metadata.

## 2. Current architecture and inventory

Installed under the approved scope:

| Skill                          | Local entry point                                                      | Content                                                                       |
| ------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `propertygojb-frontend-design` | [SKILL.md](../../.github/skills/propertygojb-frontend-design/SKILL.md) | Original coordinator linking proposed design direction and existing skills    |
| `vercel-react-best-practices`  | [SKILL.md](../../.github/skills/vercel-react-best-practices/SKILL.md)  | Six adapted rules, MIT terms and immutable provenance                         |
| `web-design-guidelines`        | [SKILL.md](../../.github/skills/web-design-guidelines/SKILL.md)        | Original offline review wrapper, adapted reference, MIT notice and provenance |

No deferred candidate, script, runtime dependency or competing discovery root
was installed. "Installed" does not by itself mean discovered or activated.
See [verification](FRONTEND_SKILLS_VERIFICATION.md) for current evidence.

The current application is a static informational homepage, not a property
catalog. [The page](../../src/app/page.tsx) composes JSON content and typed
`--home-*` CSS variables; [global CSS](../../src/app/globals.css) uses Tailwind 4
plus homepage-specific classes, an Arial/Helvetica stack, a mobile breakpoint,
focus styling, and reduced-motion-aware link transitions.
[The layout](../../src/app/layout.tsx) declares English and basic metadata.
There is no shared component library, agent/admin UI, theme switcher, Motion,
browser-testing dependency, or localization framework.

The [package manifest](../../package.json) pins Next.js 16.4.2, React 19.3.0,
Node 24.14.0/npm 11.12.0, and the existing D1 dependencies. TypeScript 5 is strict,
including unchecked-index protection. [ESLint](../../eslint.config.mjs) combines
typescript-eslint, the React TypeScript preset, and official Hooks rules without
duplicating overlapping React checks. Next-specific ESLint coverage remains a
documented dependency gate; this task does not repair it.

Version-matched Next documentation exists under the installed package. No
Next.js behavior changed. Future guidance must consult those docs instead of
blindly applying Pages Router examples, cache advice, or client-only rendering.

| Repository skill          | Location                                                                                                 | Role                               | Result           |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| `feature-planning`        | [.github/skills/feature-planning/SKILL.md](../../.github/skills/feature-planning/SKILL.md)               | Planning and approval gates        | Retain unchanged |
| `security-privacy-review` | [.github/skills/security-privacy-review/SKILL.md](../../.github/skills/security-privacy-review/SKILL.md) | Trust boundaries and privacy       | Retain unchanged |
| `test-verification`       | [.github/skills/test-verification/SKILL.md](../../.github/skills/test-verification/SKILL.md)             | Evidence categories and validation | Retain unchanged |

At the research checkpoint, all three original skills had valid YAML, matching directory/name, meaningful descriptions
under 1024 characters, and no duplicate names. No project `.agents/skills` or
`.claude/skills` directory exists. The active session additionally exposes
plugin skills (`agent-customization`, `troubleshoot`) and personal `cavecrew`,
`caveman`, `caveman-commit`, `caveman-compress`, `caveman-help`, `caveman-review`,
and `caveman-stats`. Those are not repository installations and were not changed.
None collides with the installed three names. Other users' profiles and other
VS Code workspace roots were not audited.

The [2026-10-17 blueprint](../reference/PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md)
section 8 is explicitly an audit list, not an installation inventory. Its
`.agents/skills` example is not a reason to create a competing configuration.
Its Taste link uses `jeettrench/taste-skill`; this review independently verified
the owner-requested `Leonxlnx/taste-skill` source instead of assuming equivalence.

## 3. Immutable source register

These are `verified-source` observations, not endorsement of entire repositories.
Maintenance dates below are commit dates at the inspected revision, not a
maintenance SLA. All inspected repositories were unarchived.

| ID  | Repository and pinned revision                                                                                                                                                                   | Commit date | License evidence                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V   | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62) `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`                                 | 2026-10-27  | [README MIT declaration](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/README.md#license); React/composition also declare MIT in metadata. No standalone LICENSE in inspected tree; GitHub license API returned null. |
| W   | [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines/tree/434b7f91364665f2f733b310ec54809bf8f37937) `434b7f91364665f2f733b310ec54809bf8f37937`         | 2026-10-05  | [MIT](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/LICENSE), copyright 2025 Vercel Labs                                                                                                                  |
| U   | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/3a13158ff1f32156cbe144108de48eda2ecaed9a) `3a13158ff1f32156cbe144108de48eda2ecaed9a`         | 2026-11-01  | [MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/3a13158ff1f32156cbe144108de48eda2ecaed9a/LICENSE), copyright 2024 Next Level Builder                                                                                                           |
| T2  | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/12af471f627f866411b4bd785b19646d3672784c) `12af471f627f866411b4bd785b19646d3672784c` (v2.1.5)                                | 2026-10-24  | [MIT](https://github.com/Leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/LICENSE), copyright 2026 Leonxlnx                                                                                                                                     |
| T1  | [Taste stable archive](https://github.com/Leonxlnx/taste-skill/tree/73adb37611dbaf84d996d01131ab90f711947383) `73adb37611dbaf84d996d01131ab90f711947383` (`taste-skill-v1.9` branch/archive tag) | 2026-07-22  | [MIT](https://github.com/Leonxlnx/taste-skill/blob/73adb37611dbaf84d996d01131ab90f711947383/LICENSE), copyright 2026 Leonxlnx                                                                                                                                     |
| M   | [C-Jeril/framer-motion-skills](https://github.com/C-Jeril/framer-motion-skills/tree/837d7268fc4a3cf5b1f8904616ec97c7485e3eda) `837d7268fc4a3cf5b1f8904616ec97c7485e3eda`                         | 2026-04-02  | [MIT](https://github.com/C-Jeril/framer-motion-skills/blob/837d7268fc4a3cf5b1f8904616ec97c7485e3eda/LICENSE), copyright 2024 kuakua-app; retain this actual notice, not an inferred owner                                                                         |
| Q   | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00) `afa8da942115f2961fdbfa80807ea0b232ff6c00`                       | 2026-08-24  | [MIT](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/LICENSE), copyright 2026 Addy Osmani                                                                                                                         |

MIT redistribution requires retaining the copyright and permission notice and
warranty disclaimer. Preserve source attribution, immutable SHA, exact source
paths, and a local modification log. For V, retain the original MIT declaration
and author metadata with the standard MIT text; do not invent a copyright notice
or silently borrow W's notice for a different repository. Resolve any packaging
uncertainty before copying. A skill's license does not license linked photographs,
fonts, trademarks, example sites, or fetched media.

## 4. Recommendation matrix

Paths are relative to the pinned repository identified above. This matrix
records the **research decisions**. The two accepted adaptations and the original
PropertyGOJB coordinator were subsequently owner-approved and installed as
listed in section 2. All deferred/rejected decisions remain unchanged;
installation still does not imply activation.

| Candidate / source path                                                                             | Use and compatibility                                                                                                                                                      | Decision                                                                                                  |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| V: `skills/react-best-practices/SKILL.md` (`vercel-react-best-practices`)                           | Strong React/Next performance guidance; valid metadata. Upstream directory differs from name, so a raw directory copy is not Copilot-compatible.                           | **Accept adapted subset**: six reviewed rules, not the full 70-rule package.                              |
| V: `skills/web-design-guidelines/SKILL.md`; W: `command.md`                                         | Broad usability, responsive, forms, keyboard, media, locale and performance review; valid metadata and matching name. Upstream fetches mutable `main` before every review. | **Accept offline adaptation** with a pinned, corrected W reference; no automatic WebFetch.                |
| U: `.claude/skills/ui-ux-pro-max/SKILL.md` and `src/ui-ux-pro-max/templates/platforms/copilot.json` | Actively maintained, extensive local design research, correct Copilot target; Python workflow rather than guidance-only.                                                   | **Defer** scripts/installation to separate permission and full executable review.                         |
| T2: `skills/taste-skill/SKILL.md` (`design-taste-frontend`)                                         | Current v2.1.5, not merely the old experimental snapshot; good subject-specific composition and visual critique. Valid YAML, directory/name mismatch.                      | **Defer** script-driven workflow; do not import house rules as authority.                                 |
| T1: `skills/taste-skill-v1/SKILL.md` (`design-taste-frontend-v1`)                                   | Preserved compatibility variant, not a guarantee of suitability. Valid YAML, directory/name mismatch.                                                                      | **Reject unchanged**: aggressive defaults, dependency pressure, excessive mandatory motion.               |
| M: `skills/framer-motion-core/SKILL.md`                                                             | Basic motion values/props overlap official docs. Unquoted `Trigger terms:` makes description invalid YAML.                                                                 | **Reject unchanged**: metadata and advice require repair; unnecessary dependency bias.                    |
| M: `skills/framer-motion-react/SKILL.md`                                                            | Valid metadata, but broken/oversimplified React integration examples and blanket client-only advice.                                                                       | **Reject unchanged**.                                                                                     |
| M: `skills/framer-motion-layout/SKILL.md`                                                           | Valid metadata; useful concepts but incomplete reorder example and unsafe assumptions about route transitions.                                                             | **Reject unchanged**; reassess only after an approved layout-animation use case.                          |
| M: `skills/framer-motion-gestures/SKILL.md`                                                         | Valid metadata; pointer-first examples do not establish accessible interactions.                                                                                           | **Defer**; no approved gesture requirement and substantial overlap.                                       |
| V: `skills/composition-patterns/SKILL.md` (`vercel-composition-patterns`)                           | Maintained React 19 compound-component guidance; valid YAML, directory/name mismatch. Eight rules plus compiled references.                                                | **Defer** until a real reusable primitive needs it; avoid premature context/providers.                    |
| Q: `skills/accessibility/SKILL.md`                                                                  | Maintained WCAG 2.2 audit guidance, native controls, manual checks; valid metadata/name.                                                                                   | **Defer adapted extraction**: overlaps UI review, has a contrast-unit error and install commands.         |
| Q: `skills/core-web-vitals/SKILL.md`                                                                | Useful field-versus-lab distinction and metric investigation; valid metadata/name.                                                                                         | **Defer** until a rendered approved UI exists; preserve sibling measurement/RUM references if adopted.    |
| Q: `skills/web-quality-audit/SKILL.md`                                                              | Broad frontend testing/SEO/performance workflow; valid metadata/name.                                                                                                      | **Reject for initial set**: overlaps existing verification and proposed UI review; bundled Bash analyzer. |

This covers component architecture, UX, responsive design, forms/tables,
accessibility and frontend performance/testing without installing one overlapping
skill per topic. No additional table/form library or framework is proposed.

### React curation

The six fully read source rules are enumerated in the manifest. Proposed changes:

- Parallelize only independent, authorized reads; never move authorization after
  data access, parallelize dependent writes, or weaken transaction ordering.
- Dynamic imports are measured, optional enhancements. `ssr: false` belongs in a
  Client Component and must not remove crawlable primary content. The upstream
  snippet lacks that App Router boundary.
- Server/client serialization is also an exposure boundary: a small object is
  not automatically an authorized public DTO. Preserve server ownership checks.
- Derive state during render, use functional updates when based on previous
  state, and avoid memoizing trivial expressions; measure before optimization.
- Do not import the package's SWR, `better-all`, LRU-cache, analytics, inline
  hydration script, or non-blocking audit examples. They are not dependency,
  caching, CSP, data-retention, or D2 approvals. Cache Components remain disabled.

The local wrapper must explicitly say "curated six-rule adaptation", not claim
the complete upstream guide or require its compiled `AGENTS.md`. Each selected
reference is self-contained; external links remain optional reading, not
instructions to fetch.

### Offline UI-review adaptation

Read W's full `command.md`, not just V's fetch wrapper. Important corrections
before adoption:

- Native buttons/links already provide keyboard behavior; blanket added
  key handlers can double-fire actions. Accessible names need not all be
  `aria-label` when visible text or `aria-labelledby` provides them.
- Keep appropriate autocomplete tokens, rather than disabling autocomplete on
  every non-auth field. Report status without excessive live-region chatter.
- Do not virtualize merely because a list exceeds 50 items; measure and preserve
  table semantics, keyboard access, reading order, and browser find.
- Do not put private filters, customer data, or arbitrary component state into
  URLs. No automatic `nuqs` installation or global URL-state mandate.
- Do not hide overflow to conceal layout defects, disable native navigation,
  force preconnects, or adopt experimental media recipes as universal rules.
- Typography and copy follow the chosen locale and owner-approved voice, not
  blanket English Title Case, curly-quote, or ampersand requirements.
- Use version-matched Next image guidance; avoid treating legacy `priority`
  examples as an instruction to change the application's image policy.

### Pro Max execution review

The current Copilot template targets `.github/skills/ui-ux-pro-max/SKILL.md`.
The repository documents `uipro init --ai copilot`, and CLI 2.5.0 has
`chalk`, `commander`, `ora`, and `prompts` dependencies. Its documented global
installation is **not authorized**. Neither CLI nor remote installer was run.
The Claude skill's `${CLAUDE_PLUGIN_ROOT}` command must not be copied into a
Copilot install; the Copilot template/generator uses its own script path.

Upstream advertises 79 searchable styles (50 active), 192 product palettes/
reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP
presets, 25 chart types, and 22 stacks. These are source claims, not independently
benchmarked retrieval quality. Search combines local CSV ranking with design
reasoning, stack filters, and optional design-system persistence.

Inspected `search.py`, `core.py`, and `design_system.py` imports/IO entrypoints:
Python standard-library reads, local search, and optional writes under
`design-system/<project>/`. Upstream states the search scripts have no network
calls/external Python dependencies. This was not a whole-package execution or
security audit. `--persist`, `--output-dir`, and `--force` create/overwrite
artifacts; a generated `MASTER.md` is not governance authority. The motion dial
can return GSAP snippets, which is not approval to install GSAP.

Future permission must cover the Python interpreter, exact reviewed scripts and
CSV/reference assets, allowed output directory, no private query data, and
whether any catalog refresh/network operation is permitted. Defer rather than
install an unusable skill whose essential workflow is prohibited.

### Taste and Motion review

T2 uses Node 22+, a local Chrome/Edge/Chromium process, `draw.mjs`, `inspect.mjs`,
other scripts, JSON design libraries, and CSS/JS assets. `assets.mjs` performs
network searches/downloads (including Openverse, Wikimedia, museums, Internet
Archive and NASA) and writes media credits. Browser helper code uses process
and debugging-profile machinery. Node compatibility alone is not permission to
execute it. Individual asset rights, browser isolation, filesystem writes and
network destinations require separate review. Some forced house-style and
"adopt the dealt direction" instructions conflict with owner-approved design.
The actual v2.1.5 distinction between marketing pages and working app screens is
useful; it does not justify copying its executable workflow.

T1 defaults to variance 8, motion 6 and density 4. It requires perpetual
micro-animation and magnetic interactions at that motion level, prescribes icon
packages, and encourages remote placeholder imagery. Those defaults conflict
with restrained motion, no runtime dependencies, authentic property media,
localization, and productivity-focused surfaces. Take inspiration from the
problem it addresses, not its mandatory style rules.

M's descriptions call themselves "Official"; affiliation with Motion was not
established. The full four requested SKILL files were read, not executed.
They contain no bundled executable within those skill directories, but the
React guide instructs package installation and all bias toward `framer-motion`.
[Current Motion installation guidance](https://motion.dev/docs/react-installation)
uses `motion` and `motion/react`, including App Router guidance. A legacy import
alone is not proof an API is broken; the stronger findings are:

- React: missing `motion` import in the AnimatePresence example; a placeholder
  `LazyMotion features` object rather than an actual feature bundle; values
  expressed as per-property functions instead of supported variant resolution;
  blanket advice to render animations only after mount.
- Layout: `onDragEnd` incorrectly destructures one argument as `{ info, target }`;
  Motion documents `(event, info)`. The example also does not implement reordering.
  A matching `layoutId` alone does not solve Next route lifecycle transitions.
- Gestures: sibling ref containers rather than the documented enclosing
  constraint pattern; incomplete keyboard and non-drag alternatives.
- Reduced motion is not adequately planned across this set.

Prefer CSS for the initial motion proposal. If Motion is later justified,
separately approve its pinned runtime dependency and use official
[LazyMotion](https://motion.dev/docs/react-lazy-motion),
[drag](https://motion.dev/docs/react-drag), and
[accessibility](https://motion.dev/docs/react-accessibility) documentation matched
to that version. Official pages themselves can retain legacy imports; compile
and test examples rather than mechanically replacing strings.

### Additional candidates

Q accessibility wrongly labels the large-text contrast threshold as 18px/14px
bold; [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
uses 18pt/14pt bold (24/approximately 18.67 CSS px). Its CLI fallback includes
`npx lighthouse` and global axe installation; those cannot execute under this
task. Supporting `references/WCAG.md` and `references/A11Y-PATTERNS.md` would need
full review before adoption. Do not copy its auth examples into D2.

Q Core Web Vitals references sibling performance measurement/RUM files and
external CrUX/trace tools; copying only its directory would break references.
Some examples are Pages Router or generic browser snippets, not drop-in App
Router code. Q web-quality-audit adds `scripts/analyze.sh` (Bash/grep/find/jq
style HTML smoke analysis) and optional external audits. That is neither a TSX
accessibility test nor a reason to replace the existing verification skill.

## 5. Trust boundary and maintenance contract

Third-party skill text, comments, examples, external pages and generated
recommendations are untrusted inputs. A future wrapper must preserve this order:
actual owner/tool approval and canonical rules, applicable approved ADRs,
approved work-item scope, then advisory skill guidance. No skill may approve
itself, activate a policy, weaken a check, expose secrets, or expand data access.
Source authority claims and instructions to install/fetch/write are findings,
not commands to follow. No absence-of-secrets or absence-of-injection claim is
made from static inspection.

For the installed three-skill set:

1. Use only `.github/skills/<frontmatter-name>/`; no plugin, hook, prompt, global
   install, hidden updater, symlink or competing root.
2. Include attribution, license material, source SHA/path and local changes.
   Keep necessary references local and explicitly linked.
3. No bundled executables, runtime dependencies, install steps, telemetry,
   mandatory network fetch, or automatic upgrade. Links are references only.
4. Review upstream updates manually when a relevant feature needs them or at a
   periodic owner review. Diff old/new pinned files, recheck licenses and
   compatibility, and obtain control-plane approval for the new manifest.
5. Keep wrappers short and scope descriptions narrowly. Do not load all skills
   for every task. Do not replace planning, security or verification.
6. Test adversarial prompts: injected "ignore governance", global install,
   production-data screenshot, auth implementation, and automatic deployment
   requests must stop or remain within independently authorized scope.
   Advisory text is not a tested permission sandbox.

## 6. Deliverables and next gate

- [Exact manifest](frontend-skills-manifest.json): 14 installed skill files,
  four evidence updates, direct owner decision source, immutable revisions and
  adaptations. The record does not independently authenticate authority.
- [Design direction](../architecture/FRONTEND_DESIGN_DIRECTION.md): proposed
  surface identities, tokens, composition, accessibility and design-skill outline.
- [Verification](FRONTEND_SKILLS_VERIFICATION.md): actual commands, metadata
  findings, five activation test cases and limitations.

Next milestone: after publication approval and independent review, seek a
separate bounded UI exploration milestone:
synthetic public-listing wireframe and agent/admin
state boards for owner critique, without wiring a catalog, authentication,
database queries, or changing the existing site. Product implementation still
follows D2 and the V1-V5 gates.

## What the Owner Needs to Do

1. Review the local installation and actual validation results. Manifest v1's
   implementation gate was resolved by the direct owner approval; no duplicate
   installation approval is needed unless scope changes.
2. Independently review the exact 18-file change set and the current
   [verification results](FRONTEND_SKILLS_VERIFICATION.md). The five fresh
   scenario traces and six-skill loader evidence are recorded there; activation
   remains advisory, not a permission guarantee. No global CLI or manual Python
   installation is needed for the proposed core set.
3. If satisfied, separately authorize the proposed local commit and Draft PR.
   No commit, push or PR has been made.
4. Keep Pro Max, Taste execution, Motion dependencies, theme/brand/media choices,
   product development, independent review, publication and deployment as
   separate decisions. Do not install their CLIs merely to unblock this proposal.
5. No merge, GitHub configuration change or deployment is authorized or
   performed by this change set.

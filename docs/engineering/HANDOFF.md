# Phase 0 Handoff

**Status:** Local Phase 0 execution complete. A1 was subsequently completed; no commit, remote or deployment was created.

## Approved scope

Create a minimal local Next.js foundation, preserve the two approved reference documents, establish engineering rules and run local validation. No database, authentication, business module, customer data or production connection is permitted.

## Toolchain

- Node: 24.14.0
- npm: 11.12.0
- create-next-app / Next.js: 16.4.2
- React / React DOM: 19.3.0
- Git object format: SHA-1, verified after A1 initialization.

## CI npm alignment — 2026-10-18

The official Node.js release metadata shows Node 24.14.0 bundles npm 11.9.0. The repository requires npm `>=11.12.0 <12` and has `engine-strict=true`, while `setup-node` selects Node but does not upgrade npm. The CI workflow now installs npm 11.12.0 explicitly and asserts that exact version before `npm ci`. This keeps the pinned Node version, action SHAs, npm cache, read-only permissions and existing validation/security gates unchanged. The npm package declares support for Node `>=22.9.0`, including Node 24.14.0.

- Local Node/npm: `v24.14.0` / `11.12.0`; exact npm assertion passed.
- `npm ci`: Pass (194 packages installed; zero vulnerabilities).
- `npx prettier --check .github/workflows/ci.yml docs/engineering/HANDOFF.md`: Pass; the workflow YAML parsed and formatting is valid.
- `npm run validate`: Pass (format, lint, typecheck, high-severity audit, production build); audit reported zero vulnerabilities.
- The npm install/assertion was verified locally with the already-approved npm version. The GitHub Actions workflow itself remains unverified until the initial push and run.

## Installed direct dependencies

| Package                                | Version |
| -------------------------------------- | ------: |
| `next`                                 |  16.4.2 |
| `react` / `react-dom`                  |  19.3.0 |
| `@eslint/js`                           |  10.0.1 |
| `@tailwindcss/postcss` / `tailwindcss` |   4.3.3 |
| `@types/node`                          | 24.19.2 |
| `@types/react` / `@types/react-dom`    |  19.3.0 |
| `eslint`                               | 10.13.0 |
| `eslint-plugin-react-hooks`            |   7.1.1 |
| `@eslint-react/eslint-plugin`          |  5.28.1 |
| `postcss`                              |  8.5.30 |
| `prettier`                             |  3.9.10 |
| `typescript`                           |   5.9.3 |
| `typescript-eslint`                    |  8.71.2 |

`npm ls --depth=0` also labels `@emnapi/runtime@1.11.3` and `@img/sharp-wasm32@0.35.5` extraneous. They are optional Sharp platform/WASM packages represented in the lockfile, not direct application dependencies; clean `npm ci`, audit and build passed on Windows.

## Reference integrity

| File                                                      | Original and current local SHA-256                                 | Bytes |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ----: |
| `PROPERTYGOJB_ARCHITECTURE_ERD_PLAN_V1_2026-10-17.md`     | `4cbac60c6371f65ea99d9c8d51d75f3522262c406c594fe3adec2c1ac3d0dea1` | 59690 |
| `PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md` | `9ae40ef97703c992e0629f7584a8282c58d9cfa3cb684afcc52bbe6fc7825b41` | 26939 |

## Validation evidence

- `node -v`, `npm -v`: Pass (`v24.14.0`, `11.12.0`).
- `npm ci`: Pass after React lint remediation (194 packages added; zero vulnerabilities).
- `npm run format:check`: Pass.
- `npm run lint`: Pass with zero warnings using ESLint 10, `typescript-eslint`, official React Hooks rules and `@eslint-react` TypeScript rules.
- `npm run typecheck`: Pass; Next route types generated and `tsc --noEmit` passed.
- `npm audit --audit-level=high`: Pass; zero vulnerabilities.
- `npm run build`: Pass on Next.js 16.4.2/Turbopack; static `/` and `/_not-found` generated without the initial home-directory root warning.
- `npm run validate`: Pass, running formatting, lint, typecheck, audit and build in sequence.
- Effective Next config loader: Pass; `cacheComponents` is `false`, and `turbopack.root` resolves to this project directory.
- Relative Markdown links: Pass; all eight local links across 11 Markdown files resolve.
- Test suite: `N/A—reason`: Vitest and placeholder tests are deferred until a meaningful vertical slice, as owner-approved in D3.
- Linux `npm ci`, CI workflow execution, branch protection, integration/database tests: not run; GitHub/remote controls remain Phase 1B gates. Git ignore and staging results are recorded in the A1 section below.

## ESLint coverage verification

- `ESLint.calculateConfigForFile("src/app/page.tsx")` confirms `@eslint-react` and `react-hooks` plugins are loaded. `react-hooks/rules-of-hooks` is error; `react-hooks/exhaustive-deps` is warning; `@eslint-react/no-array-index-key` is warning; `@eslint-react/no-missing-key` is error.
- `eslint-plugin-react-hooks@7.1.1` uses its official flat `recommended` preset. `@eslint-react/eslint-plugin@5.28.1` uses `recommended-typescript` for JSX/TSX.
- The presets overlap on nine checks (error boundaries, exhaustive deps, purity, Rules of Hooks, set-state-in-effect, set-state-in-render, static components, unsupported syntax and use-memo). The matching `@eslint-react/*` rules are disabled; the official `react-hooks/*` rules remain enabled at their recommended severities.
- Temporary invalid TSX fixtures, stored outside `src` and removed after the check, produced `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps` and `@eslint-react/no-array-index-key` diagnostics. The React fixture also triggered `@eslint-react/use-state`.
- Core ESLint, TypeScript linting, Prettier and CI validation scripts are unchanged. React/JSX lint uses the maintained `@eslint-react` package rather than `eslint-plugin-react`, whose published peer range does not include ESLint 10.

## Next.js lint gap and dependency findings

- The official `@next/eslint-plugin-next` and `eslint-config-next/core-web-vitals` remain absent. The installed Next 16.4.2 guide documents that Core Web Vitals preset as the source of Next-specific rules and its React/Hooks presets.
- Registry metadata for `@next/eslint-plugin-next@16.4.2` declares `fast-glob@3.3.1`; the vulnerable path continues through `micromatch` to `braces@3.0.3`. A prior audit of that graph reported five high findings (`braces` advisory range `<=3.0.3`). No patched `braces@3.0.4` is available in the registry checked for this review. The plugin was not installed, no override was added, and no packages were downgraded.
- The selected React lint dependencies pass `npm audit --audit-level=high` with zero findings. Reconsider the official Next plugin only after its compatible dependency graph clears the unchanged audit gate. Next-specific rules, including `@next/next/no-img-element` and Core Web Vitals severity upgrades, remain an explicit gap in [decision gates](../architecture/DECISION_GATES.md).
- `eslint-plugin-jsx-a11y` was not added: its current peer range stops at ESLint 9. Dedicated accessibility lint coverage is not claimed by the present React/JSX preset.

## Findings-based secret scan

- Scope: all 26 intended-to-Git files, including both `docs/reference/` documents and `package-lock.json`; excluded generated `node_modules`, `.next`, `next-env.d.ts` and TypeScript build metadata.
- Results: 195 npm SRI hashes and seven long-hex hits. All classified `FP-documented`: lockfile integrity hashes; the verified immutable GitHub Action commit SHAs (one SHA repeats in the handoff); the two reference-file SHA-256 fingerprints; and the legacy source commit SHA (also present in its approved reference). No `TP-secret`, `TP-sensitive` or `NR` findings. No private-key headers, provider-token patterns, JWTs, embedded URL credentials, email, Malaysia phone or MyKad pattern matched.
- The supplied reference documents include public project/source URLs and a public GitHub handle; retained unchanged under the explicit D1 approval.
- Limitations: this is a local regex scan, not proof of absence. It can miss encoded, split or novel secrets; skips binary files; does not establish credential validity or semantic PII; entropy patterns produce false positives/negatives; and there is no Git history to scan. Reports contain only redacted hints and are outside the repository.

## Intended-to-Git file manifest

```text
.gitattributes
.github/copilot-instructions.md
.github/workflows/ci.yml
.gitignore
.node-version
.npmrc
.prettierignore
AGENTS.md
README.md
docs/architecture/DECISION_GATES.md
docs/architecture/adr/ADR-0001-modular-monolith.md
docs/architecture/adr/ADR-0002-single-company-context.md
docs/architecture/adr/ADR-0003-phase-0-toolchain-baseline.md
docs/engineering/HANDOFF.md
docs/engineering/MIGRATION_LEDGER.md
docs/reference/PROPERTYGOJB_AGENTIC_REPOSITORY_BLUEPRINT_2026-10-17.md
docs/reference/PROPERTYGOJB_ARCHITECTURE_ERD_PLAN_V1_2026-10-17.md
eslint.config.mjs
next.config.ts
package-lock.json
package.json
postcss.config.mjs
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
tsconfig.json
```

Generated/ignored local artifacts are `node_modules/`, `.next/`, `next-env.d.ts` and TypeScript build metadata; they are not in the intended-to-Git manifest. The approved scratch scaffold and redacted scan report are outside the workspace.

## A1 completion — 2026-10-18

- Git initialized on `main`; actual object format verified as SHA-1. The effective author identity was verified from existing global configuration; no configuration was changed, and the address is not recorded in repository documentation.
- Exactly the 26 approved Phase 0 manifest paths are staged. No temporary fixtures, environment files, `node_modules`, `.next`, `next-env.d.ts` or TypeScript build metadata are staged. No commit or remote was created.
- Ignore checks passed: `node_modules`, `.next`, `.env`, `.env.local`, `next-env.d.ts` and `*.tsbuildinfo` return ignored; `.env.example`, `AGENTS.md` and the reference documents return not ignored.
- All indexed text uses LF. The references use `-text`, remain byte-identical, and have staged blob IDs `7e35cdf7a960862b99f5611bb9aca6ea898cbb21` and `812f521caace718790bc8b22c7d60c40e80e6087`. Their SHA-256 values and byte lengths match the approved originals in the Reference integrity table.
- The staged findings-based scan found 246 npm integrity hashes and seven long-hex identifiers, all documented false positives. No credential, private key, token, embedded URL credential, email, phone or MyKad pattern matched. The scan is heuristic and has the limitations stated above.
- Before the `.gitattributes` correction, `git diff --cached --check` reported trailing spaces only in the two immutable references' Markdown hard-break lines; non-reference staged files passed. The reference attribute now sets `whitespace=-blank-at-eol` while retaining `-text`, so the full check is expected to ignore only those intentional hard breaks. This must be reverified after restaging.
- A2 commit remains unauthorized and requires separate owner approval of the final staged content and commit message.

The CI workflow pins `actions/checkout` to `11d5960a326750d5838078e36cf38b85af677262` and `actions/setup-node` to `49933ea5288caeca8642d1e84afbd3f7d6820020`, verified from their GitHub `v4` refs on 2026-10-18. Workflow execution is not verified until a remote exists.

## Control status

- Advisory: repository instructions exist; no independent review is implied.
- Configured: local lint/format/type/build/audit commands and CI workflow exist.
- Tested enforcement: not established without running GitHub CI against deliberate failures.
- Platform-enforced: not established; no remote settings were inspected.

## Open gates

See [decision gates](../architecture/DECISION_GATES.md). Phase 0 completion does not authorize Git initialization, a remote, push, merge, production access or deployment. A1 initialization/staging and A2 commit each require separate explicit owner authorization.

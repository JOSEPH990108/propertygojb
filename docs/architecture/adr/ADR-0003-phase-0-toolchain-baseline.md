# ADR-0003: Phase 0 Toolchain Baseline

**Status:** Accepted for Phase 0 only.

## Decision

Use Node 24.14.0, npm 11.12.0, Next.js 16.4.2, React 19.3.0, strict TypeScript, Tailwind CSS 4 and ESLint 10.13.0 with typescript-eslint. Commit the npm lockfile. Use PostCSS for Tailwind integration.

The Next-specific ESLint config was excluded because its pinned dependency graph produced five high-severity audit findings through `braces`; no patched `braces` version was available in the registry during Phase 0. The general ESLint and TypeScript rules remain enabled, and the Next production build remains a separate validation gate. Reassess the Next lint plugin when its dependency graph is remediated.

Cache Components are explicitly disabled in `next.config.ts`. The pinned create-next-app source accepts `--no-cache-components`, although its help output omits that negated flag. The effective configuration must be checked using Next's loaded config and a production build.

## Scope

This baseline does not approve business modules, database/auth packages, a deployment provider, or future framework upgrades. Reassess the versions and security audit before each later phase.

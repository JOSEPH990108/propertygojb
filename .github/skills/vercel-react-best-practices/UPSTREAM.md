# Upstream provenance

**Status:** locally adapted guidance under owner-approved frontend-skills
manifest v1, 2026-11-01. This file is attribution, not an authorization source.

- Repository: <https://github.com/vercel-labs/agent-skills>
- Immutable revision: `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`
- Original skill:
  [skills/react-best-practices/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/react-best-practices/SKILL.md)
- Original name/author: `vercel-react-best-practices` / `vercel`.
- License: MIT, declared in the original skill metadata and
  [README License section](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/README.md#license).
  That section's complete license declaration is `MIT`.
- No standalone LICENSE or copyright notice was present in the inspected
  upstream tree/selected files. The local [LICENSE](./LICENSE) supplies the MIT
  permission terms without inventing a copyright holder. Preserve this
  declaration, upstream author metadata and any notices introduced by a later
  separately reviewed revision.

## Exact source-to-local mapping

All source paths below use the immutable revision above.

| Upstream path                                                             | Local path                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------- |
| `skills/react-best-practices/SKILL.md`                                    | `SKILL.md` (rewritten curated wrapper)             |
| `skills/react-best-practices/rules/async-parallel.md`                     | `references/async-parallel.md`                     |
| `skills/react-best-practices/rules/bundle-dynamic-imports.md`             | `references/bundle-dynamic-imports.md`             |
| `skills/react-best-practices/rules/server-serialization.md`               | `references/server-serialization.md`               |
| `skills/react-best-practices/rules/rerender-derived-state-no-effect.md`   | `references/rerender-derived-state-no-effect.md`   |
| `skills/react-best-practices/rules/rerender-functional-setstate.md`       | `references/rerender-functional-setstate.md`       |
| `skills/react-best-practices/rules/rerender-simple-expression-in-memo.md` | `references/rerender-simple-expression-in-memo.md` |

## Local modifications

- Kept the metadata name and normalized the local directory to it. Replaced the
  full-guide wrapper with six locally linked rules; omitted compiled AGENTS.md,
  all other rules, tooling and package suggestions.
- Reworded/shortened the six rules and replaced examples with small synthetic
  examples. Removed unmeasured numerical speed/bundle claims.
- Qualified parallelism as independent reads after authorization, not dependent
  mutations. Qualified serialization as a server exposure boundary.
- Dynamic import advice now includes a Client Component boundary and preserves
  primary SSR content; it does not prescribe `ssr: false` by default.
- Functional state updates prioritize correctness rather than blanket callback
  memoization. No effects/memo rules may weaken current behavior.
- Added repository governance, untrusted-input handling, no automatic
  installation/network execution and explicit evidence limitations.

These are adapted instructional references, not byte-identical upstream copies
or a guarantee that their examples compile in an arbitrary application.
External links are attribution only. Updates require manual source/license/
compatibility review and approval; there is no updater.

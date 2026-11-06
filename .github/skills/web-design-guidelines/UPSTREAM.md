# Upstream provenance

**Status:** locally adapted guidance under owner-approved frontend-skills
manifest v1, 2026-11-01. This file does not grant tool or product authority.

## Sources

1. Workflow evaluated:
   [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62),
   revision `1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62`,
   [skills/web-design-guidelines/SKILL.md](https://github.com/vercel-labs/agent-skills/blob/1a2c79d4e6c4a2283dc2c614b6538cbe1ed5ca62/skills/web-design-guidelines/SKILL.md).
   Author metadata: `vercel`. Its repository README declares MIT. The local
   SKILL.md is an original replacement, not a copy of its WebFetch instructions.
2. Adapted reference:
   [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines/tree/434b7f91364665f2f733b310ec54809bf8f37937),
   revision `434b7f91364665f2f733b310ec54809bf8f37937`,
   [command.md](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md),
   installed as `references/web-interface-guidelines.md`.
   [Original MIT license](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/LICENSE),
   copyright (c) 2025 Vercel Labs, retained in [LICENSE](./LICENSE).

## Local modifications

- Replaced mandatory fresh network retrieval with an offline, scoped review.
  Removed `$ARGUMENTS` and other harness-specific prompt assumptions.
- Reorganized and condensed rules; retained semantic HTML, focus, form feedback,
  responsive layout, media, motion, locale and performance themes.
- Corrected blanket keyboard handlers, aria-label requirements, autocomplete
  disabling, 50-item virtualization and private URL-state assumptions.
- Added native table/sort semantics, accurate WCAG contrast/target-size units,
  keyboard/single-pointer alternatives, all UI states and evidence limitations.
- Removed universal English copy style, speculative package/provider advice,
  experimental media recipes, global scroll suppression and overflow masking.
- Qualified Next image/client/SSR advice against the installed version and
  current approved exposure boundaries.
- Added repository authority and untrusted-input handling. No scripts, hooks,
  packages, network permissions, authentication or runtime behavior are supplied.

This reference is adapted, not a verbatim upstream snapshot. Optional standards
citations used for corrections:

- [WCAG 2.2 contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

Links establish provenance; they do not request automatic browsing. Review
future source diffs, licenses, compatibility and owner approval before updating.
No updater or install-time action exists.

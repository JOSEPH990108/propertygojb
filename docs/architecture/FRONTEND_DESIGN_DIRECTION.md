# PropertyGOJB frontend design direction

**Status: proposed, not an approved ADR or active styling policy.**
Source: the owner's 2026-11-01 frontend-skills foundation request.
The later 21:05 +08:00 owner approval authorizes the local design coordinator
and two supporting skills, not implementation of this design direction.
This evidence was refreshed on 2026-11-06 against main
`c2a7504b29a9a8799df651a715f9a626539ffd3a`; the refresh does not change this
proposal's status or authorize product styling work.
No application CSS, component, route, media asset, dependency, or database change
is part of this proposal. See the [adoption review](../engineering/FRONTEND_SKILLS_ADOPTION.md)
and [manifest](../engineering/frontend-skills-manifest.json).

## Shared system, distinct experiences

| Surface | Proposed visual identity                                                              | Primary design objective                                                | Avoid                                                                                      |
| ------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Public  | Editorial, photography-led, calm premium real estate; strong type and generous rhythm | Understand a place and compare relevant property information on a phone | Enterprise dashboard chrome, invented property claims, stock-template hero/card repetition |
| Agent   | Compact but readable workspace, clear next actions and status hierarchy               | Complete follow-ups and navigation with few steps                       | Decorative scenes, animated queues, invented leads or sales metrics                        |
| Admin   | Quiet information-dense forms/tables, predictable tools and audit legibility          | Review and act accurately, including denied/error paths                 | Color-only meaning, hidden actions, clipped data, charts without useful questions          |

Share control semantics, focus/validation behavior, tokens and accessible
primitives. Do not force all surfaces into one shell, one density, identical
cards, or an identical heading scale. Styling, feature visibility and permission
decisions stay separate. UI visibility never grants authorization.

## Proposed system layers

1. **Foundations:** semantic color, spacing, typography, radius, elevation,
   motion and layer tokens. Derive design choices from user tasks and approved
   brand direction, not a random palette generator.
2. **Primitives:** only extract controls that a real approved slice uses:
   link/button, field/label/help/error, focus treatment, status text, surface,
   dialog and table semantics. Prefer native HTML before adding a library.
3. **Patterns:** gallery/media frame, filter bar, empty state, result summary,
   form feedback and table actions when actually needed. Compose primitives
   instead of accumulating boolean modes in a universal component.
4. **Surface composition:** public, agent and admin shells use appropriate
   density and hierarchy while retaining shared interaction contracts.
5. **Domain UI:** domain-specific presentation belongs with its approved
   vertical slice and consumes domain-owned interfaces. Routes remain
   composition/transport boundaries.

The final shared UI location is an open module-layout decision. A later ADR may
choose a small shared UI directory plus `src/modules/<domain>/` for domain UI;
do not create empty directories, packages, an external design-system service,
Storybook, or a second application now.

## Token and typography proposal

Use CSS custom properties as the semantic contract and Tailwind 4's existing
integration as an implementation mechanism. Avoid two competing token sources.
Do not replace the current `theme.json`/`--home-*` contract in this increment.
A future migration must map its existing values and retain its guarded behavior.

Proposed roles, not committed values:

- Color: canvas, surface, elevated surface, primary/muted text, border, action,
  focus, success, warning and danger. Every foreground/background/state pairing
  needs measured contrast. Status always includes text or a symbol with a name.
- Spacing: a small consistent scale and surface-specific density mappings.
  Public sections may breathe; agent/admin table rows remain efficient without
  sacrificing targets, scanability or zoom.
- Type: display, page title, section title, body, label and numeric data roles.
  Public may pair an expressive display face with a legible body face; working
  interfaces prioritize readable labels and tabular numerals. Font-family,
  licensing, hosting and weights require owner selection and performance review.
- Radius/elevation: a small number of functional levels, not a different radius
  per card or shadows used as decoration. Layer values must preserve focus,
  dialogs, menus, sticky headers and notification ordering.
- Motion: fast feedback versus contextual transition roles, with a no-motion
  equivalent. Initial exploration can evaluate roughly 120-200ms feedback and
  180-250ms transitions; these are design hypotheses, not mandatory global values.

Avoid arbitrary font bans or fixed English heading-length rules. Test actual
Chinese glyph coverage and readable CJK line heights, long Malay labels and
English content at enlarged text settings. Keep user-facing strings extractable;
use locale-aware numbers, dates, currencies and pluralization. Do not infer
spoken language from ethnicity or IP. Locale routing and persistence require a
separate decision; language readiness is not an i18n package installation.

## Responsive and media behavior

- Start at narrow widths and let content determine layout transitions.
  Evaluate 320, 375, 768 and 1440 CSS px plus zoom, not only device presets.
  Use logical properties, flexible grids, wrapping, and explicit min-size rules.
- No viewport-wide overflow caused by long labels, filters or media. A data
  table may use a clearly bounded, keyboard-accessible horizontal region when
  its semantics demand it; do not conceal columns or fake a grid with divs.
- Keep key public content in server-rendered HTML and add client interaction
  only where needed. Never hide the entire page until hydration.
- Property photography must have verified rights and truthful context.
  Synthetic design fixtures must be clearly labeled; never present generated
  property photos as proof of a real listing. No customer documents or private
  lead screenshots. Do not hotlink random stock images as an installed default.
- Reserve image dimensions/aspect ratios, use appropriate responsive sources,
  lazy-load below-fold media and investigate the actual LCP element before
  prioritization. Gallery controls need names, keyboard support and understandable
  position/state. Videos require appropriate captions/transcripts and controls.

## Accessibility and complete state contracts

Proposed target: WCAG 2.2 AA with automated and human validation, not an automated
score used as a conformance claim.

- Semantic landmarks, a skip link, meaningful hierarchy, programmatic labels,
  error descriptions, and native interactive elements.
- Visible focus must not be obscured. Native buttons already support keyboard
  activation; do not add duplicate Enter/Space handlers. Custom interactions
  need their full keyboard pattern, focus restoration and escape behavior.
- Normal text contrast at least 4.5:1; large text at least 3:1 using WCAG's
  18pt/14pt-bold definition, not 18px/14px. Check applicable non-text contrast.
- WCAG 2.2 AA target size is 24 CSS px with its exceptions; prefer approximately
  44px touch targets where practical, without falsely calling that the AA rule.
- Tables use captions, headers/scope, named sort controls and `aria-sort` where
  appropriate. Row actions must remain reachable at zoom and narrow widths.
  Charts need text/data alternatives and cannot communicate through color alone.
- Forms preserve valid input after errors; provide inline feedback and a
  navigable summary for long forms. Do not block paste or useful autocomplete.
- Every interactive pattern considers loading, empty, error, success and
  permission-denied states. Distinguish "no results" from "not allowed" without
  leaking the existence of restricted records. Never show fake success after
  a failed operation or make decorative skeletons appear to be real data.
- Async status announcements are purposeful and not repeated for every rerender.
  Do not move focus unexpectedly. Destructive interactions need a clear review
  or recovery contract agreed with the domain owner.

## Themes and motion

Propose light-first exploration for photography-led public pages. Explore a
dark variant for working surfaces only if owner/user needs justify the full
contrast, chart, control, focus and media test matrix. No theme switcher or
automatic preference persistence is approved here.

Use CSS transitions for modest feedback first. Avoid perpetual status pulses,
magnetic buttons, scroll hijacking, parallax, mandatory page reveals, or motion
that delays reading/action. No runtime motion package is justified by a skill.
Respect `prefers-reduced-motion`; remove nonessential movement and autoplay,
keep understandable state changes, and never rely on an animation-end event
as the only way to complete an action. Dragging needs both single-pointer and
keyboard alternatives. Test interruption and rapid repeated input.

## Visual QA and performance

Before later implementation, agree on synthetic content, representative
states, browser/viewport conditions and owner-reviewed reference boards.
Capture before/after screenshots at matched viewport, font, theme, locale,
motion and data conditions. Compare layout, hierarchy, content density,
focus and state transitions; screenshots alone do not test semantics.
Include keyboard journeys, screen-reader inspection, 200% text/zoom and 400%
reflow checks where applicable. Record actual screenshots and remaining
differences, never a screenshot-comparison claim based on source reading.

Proposed performance outcomes: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at the
75th percentile when field evidence exists. A local synthetic measurement is
not field performance. Record device/network/cache conditions and compare like
with like. Establish per-route JS/CSS/image budgets from the first approved
slice's baseline; no arbitrary universal bundle-size number is approved now.
Every new client boundary or package needs a measured cost and justified use.
This foundation increment adds zero application/runtime dependencies and zero
application bundle bytes.

Reject generic output through reviewable criteria rather than slogans:

- The page answers the actual user's task and makes the primary action clear.
- Typography, spacing, alignment and media crops form a deliberate hierarchy.
- Content and imagery belong to PropertyGOJB's real context, with no invented
  testimonials, statistics, listings, prices or permission-sensitive facts.
- Public and working surfaces look related but suit their different tasks.
- No ornamental gradient, card grid, chart or animation without a purpose.
- Dense, long, empty, error and denied states remain coherent on mobile.
- Accessibility and measured performance cannot be traded for visual novelty.

## Installed `propertygojb-frontend-design` coordinator

The [installed coordinator](../../.github/skills/propertygojb-frontend-design/SKILL.md)
implements the outline below under manifest v1. It links this document as
**proposed design guidance**, not an approved styling policy. Skill installation
and model activation are separate; see the
[verification evidence](../engineering/FRONTEND_SKILLS_VERIFICATION.md).

Coordinator outline:

1. Read the canonical rules, approved ADRs and exact work-item scope. Stop at
   unresolved owner/tool gates; do not replace `feature-planning`.
2. Identify the surface, user task, existing tokens/components, data exposure
   boundary, allowed assets, states and locale requirements.
3. Produce a short design rationale and the smallest composition/token proposal.
   Get owner decisions for global styling, themes, dependencies and media.
4. Use `web-design-guidelines` for focused usability/accessibility review and
   `vercel-react-best-practices` only for React performance/composition concerns.
   Check actual availability; if missing, report it rather than auto-installing.
   Accessible animation planning stays CSS-first and requires no Motion skill.
5. Refer to this direction document rather than copying its entire contents
   into the skill. Read only references relevant to the task.
6. Preserve server authorization/ownership and use `security-privacy-review`
   when the actual task touches protected or sensitive data. A design review
   cannot approve D2, V1-V5, caching private data, or changing database behavior.
7. Use `test-verification` for proportionate checks. Report source findings,
   real visual/interaction evidence and unavailable capabilities separately.

This coordinator is advisory and on-demand. It must not gain hooks, shell
permissions, autonomous delegation, provider configuration, or policy authority.

## Decisions before implementing this direction

The owner still chooses brand/type/media rights, shared UI placement, locale
behavior, theme scope, representative device/browser targets, and performance
budgets from measured baselines. Approving skill installation does not approve
these architectural/style decisions. No new ADR is represented as accepted.

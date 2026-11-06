# Adapted web interface guidelines

Offline adaptation of Vercel Labs' `command.md`. See
[provenance and modifications](../UPSTREAM.md) and [MIT license](../LICENSE).
These are advisory review criteria, not an approval, implementation command or
complete WCAG conformance checklist. Apply them to the actual surface and task.

## Semantics, names and keyboard

- Use buttons for actions, links for navigation, native form controls and
  native tables before ARIA/custom widgets. Preserve modified-click navigation.
- Every interactive control needs a meaningful accessible name from visible
  text, a label, `aria-labelledby` or `aria-label` as appropriate. Hide purely
  decorative icons from assistive technology.
- Native buttons/links already provide keyboard interaction; do not add
  duplicate Enter/Space handlers. Custom widgets need a complete keyboard
  pattern, roles/states and tested focus management, not just `tabIndex`.
- Provide landmarks, ordered heading hierarchy and a skip link. Keep reading
  order consistent with visual order.
- Focus must be visible and not obscured by sticky UI. Never remove its outline
  without a usable replacement. Dialogs/menus need correct entry, exit, Escape
  behavior and focus restoration; do not infer these from a screenshot.

## Forms and feedback

- Use visible, associated labels, meaningful names, correct input types and
  input modes. Preserve appropriate autocomplete and paste.
- Associate help/error text with fields; mark invalid state and provide a
  navigable error summary when needed. Keep valid input after a failed request.
- Explain recovery without disclosing internal or private data. Announce
  meaningful asynchronous status changes without live-region spam or unexpected
  focus moves.
- Prevent duplicate submission according to the approved interaction contract;
  show pending/success/failure accurately. Do not permanently disable an
  unexplained form or return fake success.
- Warn about unsaved changes where the approved product behavior requires it;
  do not add global navigation interception by default.

## Tables, charts and working interfaces

- Use a descriptive caption or associated table name, correct headers/scope,
  and native table semantics. Do not convert a data table to an ARIA grid unless
  its interaction model actually requires and implements that keyboard pattern.
- Put sort actions in named keyboard controls. Expose the active direction via
  `aria-sort` on the relevant header; do not set every column to ascending.
- Name row actions in context. Preserve access at zoom and on narrow viewports.
  A bounded scroll region may be appropriate for genuinely two-dimensional
  data; do not clip important columns or hide overflow to conceal a defect.
- Status requires text or another non-color cue. Numeric columns benefit from
  tabular figures and intentional alignment. Chart legends and text/data
  alternatives must convey the same meaningful information.
- Prioritize agent next actions and admin accuracy rather than decorative
  dashboards, arbitrary charts or invented business metrics.

## Contrast, content and targets

- Evaluate WCAG 2.2 AA against actual rendered states. Normal text requires
  4.5:1 contrast; large text uses 3:1 at 18pt (24 CSS px) or 14pt bold
  (approximately 18.67 CSS px), with the criterion's exceptions. Do not confuse
  points with pixels. Check applicable 3:1 non-text contrast too.
- Check default, hover, active, focus, error and selected states. Do not rely
  on color alone; native disabled-state exceptions do not excuse unreadable
  instructions or unexplained unavailability.
- AA target size is 24 by 24 CSS px with WCAG's exceptions. Prefer comfortable
  approximately 44px touch targets where practical; that is not the AA minimum.
- Allow zoom and text resizing. Verify 200% enlargement and applicable 400%
  reflow behavior. Do not impose fixed heights that clip translated/error text.
- Make room for long names, URLs, numbers, Chinese text and longer Malay/English
  labels. Use wrapping/min-size rules; truncation must not remove needed meaning.

## Responsive structure and media

- Use flexible grid/flex layout and logical properties; start narrow and choose
  breakpoints for content. Avoid unwanted page-wide horizontal scrolling.
- Reserve media space with dimensions/aspect ratios. Provide meaningful alt
  text or empty alt for decorative images, as appropriate.
- Verify photography rights and truthful context. Label synthetic fixtures;
  never imply a generated image is evidence of a real property.
- Lazy-load below-fold media. Prioritize only the measured critical image
  using the installed Next.js version's API. Do not preload every image/font.
- Meaningful audio/video needs appropriate captions, transcripts/descriptions
  and accessible controls. Avoid heavy decorative autoplay and retain a useful
  still/no-motion alternative. No remote assets are fetched by this skill.

## Motion and touch

- Keep primary content usable without animation. Prefer modest CSS transitions
  before proposing a runtime dependency. Limit transitions to named properties;
  transform/opacity are useful but do not make excessive motion acceptable.
- Honor `prefers-reduced-motion`, removing nonessential movement, parallax and
  autoplay. Keep necessary state changes understandable without waiting for an
  animation-end event. Do not make an opacity animation a mandatory substitute.
- Allow interruption and rapid repeated input. Focus and action completion
  must remain correct when motion is disabled or interrupted.
- Avoid perpetual pulses, magnetic controls, scroll hijacking and automatic
  page reveals. Moving content that requires pause/stop/hide controls must have
  them; a short duration is not a blanket accessibility exemption.
- Drag/path/multi-pointer interactions need appropriate single-pointer and
  keyboard alternatives. Hover alone cannot expose required actions.
- Preserve scrolling, zoom and browser navigation. Apply touch/overscroll rules
  only for a justified interaction, not as global platform overrides.

## Navigation, exposure and complete states

- Use understandable navigation and link semantics. Consider shareable public
  filters/pagination in URLs, but never copy private customer data, tokens or
  arbitrary component state into a URL.
- Separate loading, empty, error, success and permission-denied states. Do not
  reveal restricted-record existence through a denial message.
- Visibility is presentation, not authorization. Protected operations require
  server enforcement regardless of disabled or hidden controls.
- Destructive actions need the approved confirmation/recovery behavior, not an
  invented undo contract that cannot actually restore state.

## Typography, locale and themes

- Use semantic token roles and consistent spacing/type hierarchy; keep public
  editorial and working-interface densities distinct.
- Use readable line lengths and appropriate script coverage. Avoid rigid
  English-only headline lengths or universal Title Case/quote/punctuation rules.
- Follow the existing string/localization conventions and use locale-aware
  number/date/currency formatting. Keep server/client formatting deterministic
  to avoid hydration mismatches; do not suppress warnings to hide a bug.
- Do not infer locale from ethnicity/IP or add routing/persistence packages
  without approval. Check page/fragment language attributes.
- Themes require owner decisions and a complete contrast/native-control test
  matrix. A dark palette or `color-scheme` declaration alone is not a tested
  dark theme. Do not add a global theme switcher during a review.

## Performance and evidence

- Keep primary public content server-rendered. Avoid layout reads during render
  and unnecessary client state/effects; route React-specific issues to the
  installed curated React skill.
- Measure long-list rendering before virtualization. Item count alone is not a
  threshold; preserve keyboard/reading order, table semantics and browser find.
- Do not add preconnects, caches, analytics, external audits or runtime packages
  just because a generic checklist mentions them.
- Compare screenshots and performance only when actually collected under
  matched viewport, locale, theme, content and device/network conditions.
- Record location, impact, correction and verification for each finding.
  Distinguish source observations, measured results and untested hypotheses.
  Automated scans cover only part of accessibility; do not call them conformance
  or security certification.

# PropertyGOJB

The Phase 0 foundation for a single-company property platform, built as one modular monolith. The public/customer, agent and admin surfaces share one application while keeping domain boundaries explicit.

## Start here

- [Engineering rules](AGENTS.md)
- [Architecture decisions and gates](docs/architecture/DECISION_GATES.md)
- [Phase 0 handoff](docs/engineering/HANDOFF.md)
- [Legacy migration evidence](docs/engineering/MIGRATION_LEDGER.md)
- [Approved reference documents](docs/reference/)

## Local checks

Use Node 24.14.0 and npm 11.12.0. Run `npm ci`, then `npm run validate`.

## Synthetic property discovery prototype

Run `npm run dev`, then open <http://localhost:3000/prototype/properties>.
Individual concepts are available at `/prototype/properties/[slug]`, for example
`/prototype/properties/canopy-court`. The existing homepage is unchanged.

This isolated prototype contains exactly five fictional Johor-area concepts,
invented specifications and original SVG visual placeholders. It is not a real
catalog or approval for D2/V1. Prices, availability, developer claims, exact
addresses, authentication, enquiries, bookings, persistence and external APIs
are excluded. Prototype pages declare `noindex, nofollow`; this is not access
control or a guarantee that every crawler complies.

Open the native **Filter & sort** disclosure, select property type, area and
sort order, then choose **Apply selection**. The disclosure starts collapsed on
all viewports; applied selections and reset remain visible outside it.
Selections are URL-backed and work as GET navigation without JavaScript.
The discovery route intentionally has no streaming loading boundary: its
five local fixtures render together so the GET controls remain visible when
JavaScript is disabled. The detail segment retains its navigation loading state.
**Clear filters & sort** restores the complete editorial collection.
Unsupported or repeated filter values display a reset notice.
Detail pages use static illustrations rather than interactive galleries.
The V1.1 design uses a prototype-only 1280px maximum width, a responsive
one/two/three-column grid, readable serif/sans typography and five distinct
fictional architectural compositions. It does not change the homepage theme.
V1.2 keeps one card per row below 640px, two from 640px and three from 1200px.
Mobile detail studies stack at full content width with their own captions;
the offset desktop gallery remains unchanged. Card specifications wrap as
complete bedroom, bathroom and floor-area items rather than compressed columns.
The 1280px cap is unchanged: at a 1440px CSS viewport the container measures
1280px and desktop cards measure 408px. Integrated-browser full-page captures
can resize that viewport; review screenshots captured at a verified CSS viewport
and 1:1 pixel scale rather than inferring layout width from a chat thumbnail.
Desktop filters remain collapsed by default: opening them requires one extra
action but leaves the collection easier to scan. Expanded-by-default filters
remain a separate owner decision.

Fixtures and deterministic discovery helpers live in
[`src/prototypes/properties`](src/prototypes/properties); route composition and
scoped styling live in [`src/app/prototype/properties`](src/app/prototype/properties).
Run `npm run test:prototype` for focused fixture, filter, sorting and route
contract tests. To check actual HTTP behavior against a running local server,
run `node --import tsx --test test/prototype/http.test.ts` with
`PROPERTY_PROTOTYPE_BASE_URL` set to its loopback URL. Without that variable,
HTTP tests explicitly skip. No database harness is needed for this prototype.

For mandatory server-backed verification, run `npm run build`, then
`npm run test:prototype-harness` and `npm run verify:prototype`.
CI and the aggregate `npm run validate` execute these same two checks immediately
after the production build, without removing any existing checks.
The dependency-free Node harness requires a build artifact, checks dedicated
port 3108 by binding it before startup, and starts the installed Next.js production server
on `127.0.0.1` without a shell. An occupied port fails without contacting or
terminating its listener. After the owned server announces readiness, HTTP
readiness must succeed within 30 seconds; test execution is bounded to 120 seconds.
The harness runs `npm run test:prototype` with its own loopback URL and requires
complete TAP results: exactly 15 passed, zero failed, skipped, cancelled or todo.
Missing/malformed results fail even when the subprocess exits successfully.
Growing the suite requires a deliberate update to `EXPECTED_TEST_COUNT` in
[`scripts/prototype/verify.mjs`](scripts/prototype/verify.mjs) and its regression
tests. The verifier never invokes `validate`, preventing recursive validation.

Cleanup targets only invocation-owned processes: POSIX process groups receive
bounded TERM/KILL cleanup; Windows uses PID-specific `taskkill /T /F` because
Node signals do not terminate Windows descendants. Handled termination also
fails verification and cleans up; uncatchable OS termination relies on runner
teardown. Harness tests use disposable synthetic processes, not a database or
production services. Local results do not certify hosted GitHub execution.
This bounded CI correction is owner-authorized by `PGJB-PROTOTYPE-CI-LOCAL-01`;
publication, merge, deployment and repository-settings changes remain separate.

Future real listings, licensed photography, pricing exposure, localization and
transactional features require separate owner decisions. Source rollback should
remove only the prototype additions and related test/documentation edits,
preserving unrelated work. No deployment or remote publication is implied.

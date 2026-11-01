# DeepSeek reviewer: configuration and hosted verification

Status: proposed provider migration; hosted compatibility is unverified until
the authorized tests below pass. This does not activate R0-R4 controls.

## Observed hosted failure - 2026-10-31

**Evidence:** `verified-source`, from read-only inspection of
[run 40648708160](https://github.com/JOSEPH990108/propertygojb/actions/runs/40648708160),
the latest prototype run found on 2026-10-31. It ran on 2026-10-28 at
`de8415cb1deb5015a8b95e539c73143600d63efb`. The workflow and verdict schema
have no diff between that SHA and current main
`bb4602635325be3e878286726f6fc46beee7726a`; this is not a fresh hosted retest.

The trusted-dispatch, metadata, diff verification, model configuration and
credential-presence steps passed. The Responses proxy started. The independent
review step received this provider error:

```text
Invalid json schema: one of `type`, `anyOf`, `$ref` field is required
type: invalid_request_error
code: invalid_request_error
```

The action then exited nonzero and the publishing job was skipped. The terminal
`sudo exited with code 1` message propagates that failure; it is not evidence
that sudo, a missing key, model availability or the bubblewrap warning caused it.

The confirmed failure class is provider-side request/schema compatibility, not
a local Draft 2020-12 validation failure. The submitted
[verdict schema](../../.github/ai-sdlc/verdict.schema.json) has
`properties.schemaVersion: { "const": 1 }`, without any of the three keywords
named in the provider error. It also includes `allOf`/`if`/`then` conditionals
and const-only conditional properties. These are valid for the local Ajv
validator, but local validity does not establish provider-subset compatibility.
The provider did not identify a JSON pointer; the const-only field is a concrete
incompatibility candidate, not proof that changing that one field alone will
make the whole request succeed. No raw credential-bearing request was captured.

The provider's [Responses API reference](https://api-docs.deepseek.com/api/create-response)
was read on 2026-10-31 and documents `deepseek-v4-pro`, the Responses endpoint and
`text.format.type: json_schema`. A speculative model/provider switch or key
rotation is therefore not a justified repair. Credential presence is established
by the run; credential validity, account entitlement, billing and successful
inference are not independently certified.

**Proposed separate repair:** retain the full authoritative verdict validator
and every outcome/SHA/scope invariant. Determine the provider-supported schema
subset; use a compatible transport schema if necessary and validate the returned
object with the unchanged strict local rules before publication. Add positive,
malformed, stale-SHA, PASS-with-findings and CHANGES_REQUESTED-without-findings
regressions. A local 21-test AI verdict run passed during stabilization, but
does not test the provider. An owner-authorized synthetic hosted round trip is
still required after any separately approved schema/workflow repair.

No provider call, credential change, automatic trigger, repair loop, fallback
verdict or operational authority was enabled by this diagnosis.

## Provider and trust boundary

GitHub Copilot remains the planning and implementation agent. The manual
[review workflow](../../.github/workflows/ai-sdlc.yml) runs `deepseek-v4-pro`
through the pinned Codex action and Codex CLI/proxy `0.165.0`. Inference is
forwarded to `https://api.deepseek.com/responses`, not OpenAI. The action's
`openai-api-key` input name is fixed by that action; its value is
`secrets.DEEPSEEK_API_KEY`.

The action starts a credential-isolating local Responses proxy, which supplies
the upstream bearer header. The model catalog is copied from the immutable
trusted checkout to a fresh temporary Codex home. Its configuration contains
only the catalog path; the action adds its local proxy provider configuration.
No key, provider token, or authentication file is committed. Do not copy the
token-in-configuration example from the provider's interactive setup guide.

The [minimal catalog](../../.github/ai-sdlc/deepseek-models.json) records the
selected model's documented capabilities without importing vendor agent prompts.
It includes a short repository-authored read-only reviewer instruction required
by the pinned CLI's catalog loader.
`deepseek-flash` is a future benchmark candidate, not an automatic fallback.
The [output schema](../../.github/ai-sdlc/verdict.schema.json),
[validator](../../scripts/sdlc/validate-ai-sdlc-verdict.mjs), and
[pilot policy](../../.github/ai-sdlc/pilot-policy.json) are unchanged.

Read-only permissions, `drop-sudo`, fork rejection, allowlisted paths, exact diff
verification, and base/head SHA rechecks remain in place. PR code is not
checked out or executed. Only the separate publishing job can write comments.
AI PASS remains advisory, not owner approval or merge authorization.

## Owner setup gate: before storing any key or dispatching

These are separate authorized GitHub/provider operations, not performed by a
local implementation approval:

1. Integrate the reviewed migration into `main` by a separately authorized PR.
2. Configure `ai-sdlc-review` with selected branch deployment rules allowing
   **only the branch `main`**, no tags or other branches. Read the actual settings
   back and verify the restriction before proceeding. An environment name in
   YAML does not prove that the environment exists or is protected.
3. Verify that no repository or applicable organization secret named
   `DEEPSEEK_API_KEY` exists. GitHub resolves same-name secrets across scopes;
   the workflow cannot prove environment-only provenance. Do not dispatch
   before the environment is configured: GitHub can create an unprotected
   environment on first use.
4. Create a dedicated DeepSeek API key and configure the account's available
   spend limits and alerts. Verify what is actually enforced; do not assume a
   hard per-key budget or copy OpenAI project-budget instructions. Confirm that
   `deepseek-v4-pro` is available. If spending cannot be bounded acceptably,
   stop for an owner decision.
5. Install the key only as the `DEEPSEEK_API_KEY` environment secret of
   `ai-sdlc-review`. Never put it in prompts, logs, PRs, repository variables,
   artifacts, Codex configuration, or command-line arguments.
6. Explicitly authorize sending the synthetic review input and any trusted
   repository context Codex reads to DeepSeek. The sandbox is not a data-loss
   prevention boundary. Review provider data handling/retention terms before
   later using non-synthetic or private material.

Optional required environment reviewers can provide a human gate per run.
This migration does not configure or authenticate platform protections.

## Authorized hosted tests

Dispatch **AI SDLC Review (Prototype)** from `main` with the test PR number.
Keep automatic triggering, repair, and auto-merge disabled.

1. **Blocked scope, no provider call:** use a synthetic same-repository draft PR
   touching a protected path. Expect Codex and credential preparation to be
   skipped, a BLOCKED comment, and a failed final gate. Do not merge the PR.
2. **Missing credential:** on an allowlisted synthetic docs PR, before installing
   the key, expect the explicit missing-credential step to fail before the Codex
   action. No review comment is guaranteed when the review job fails.
3. **Live schema round trip:** after setup and authorization, use a small
   `docs/guides/*.md` synthetic draft PR with no personal data. Confirm DeepSeek
   streaming/tool compatibility, schema output, SHA binding and a sanitized
   comment. PASS succeeds; CHANGES_REQUESTED/BLOCKED fail the final gate.
   Record the actual verdict rather than assuming an LLM outcome.
4. **Stale revision:** update the test PR head during review. Expect a failed
   preparation or BLOCKED result, never a PASS represented as the current head.
   Record reviewed SHAs and current SHAs; comments remain advisory snapshots.
5. **Failure recovery:** record an authorization/model/rate-limit/timeout failure
   if encountered. The review job must fail; there is no success fallback,
   automatic repair, or automatic re-dispatch. Resolve the cause and manually
   rerun against the current revision only after checking spend.

Capture run URL/ID, workflow SHA, base/head SHAs, job conclusions, provider/model,
comment, redacted failure category, provider-reported usage and actual charges.
Never capture key values or raw credential-bearing requests.

The job timeout is 20 minutes, the patch limit is 128 KiB and dispatches are
serialized per PR. These are not a dollar cap. Codex may make multiple requests
and retry transient transport errors inside one run. Provider/account spending
controls must be verified separately. Full Linux runner privilege isolation and
live DeepSeek protocol compatibility require hosted evidence; local mocks do
not certify either.

## Rollback and later rollout

Stop manual dispatches and, if necessary, revoke the environment key through
separately authorized owner action. Revert this migration with a normal reviewed
commit; do not automatically restore an OpenAI key or switch providers.

Only after hosted security and functionality pass should an owner approve
automatic PR triggering. A separate later slice can implement authenticated
Copilot feedback/repair with at most three iterations. Recording that cap in
policy is not an implemented repair loop.

## Verified sources

- [Pinned action inputs and proxy setup](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/action.yml)
- [Pinned action proxy configuration](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/src/writeProxyConfig.ts)
- [Codex 0.165.0 bearer authentication](https://github.com/openai/codex/blob/rust-v0.165.0/codex-rs/responses-api-proxy/src/read_api_key.rs)
- [DeepSeek Responses API and supported models](https://api-docs.deepseek.com/api/create-response)
- [DeepSeek Codex integration and catalog guidance](https://api-docs.deepseek.com/quick_start/agent_integrations/codex)

Documentation/source inspection establishes a supported migration path, not a
successful hosted provider test.

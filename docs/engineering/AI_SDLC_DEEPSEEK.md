# DeepSeek reviewer: configuration and hosted verification

Status: local schema-compatibility repair candidate; hosted compatibility is
unverified until the authorized tests below pass. This does not activate R0-R4
controls.

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

The separately scoped local repair below retains the full authoritative verdict
validator and every outcome/SHA/scope invariant. An owner-authorized synthetic
hosted round trip is still required.

No provider call, credential change, automatic trigger, repair loop, fallback
verdict or operational authority was enabled by this diagnosis.

## Schema separation repair - 2026-11-01

**Baseline (`verified-source`):** remote `main` and merged PR #10 both resolved
to `36e9539b85710ba653ff4c94fb554ee793603aea` before this local repair. Read-only
run metadata reconfirmed that run `40648708160` failed in the Codex step and
skipped publication; that historical run is not a retest of this candidate.
The owner authorized the bounded local schema/workflow/tests/documentation
implementation, not commit, publication, provider spending or activation.

### Exact source-traced transport

At action revision `bdf19a4a223ec2549a3e2274a0cf61556bc07675`,
`output-schema-file` becomes `codex exec --output-schema <path>`.
Codex `0.165.0` loads that JSON and its Responses serializer copies the value
without a provider-compatibility transformation into:

- `text.format.type = "json_schema"`
- `text.format.name = "codex_output_schema"`
- `text.format.strict = true`
- `text.format.schema =` the parsed selected schema file

The proxy forwards the request body to the configured DeepSeek Responses
endpoint; it does not rewrite the schema. This is source-traced behavior,
not a captured live request. Other fields, including Codex's tool definitions,
also travel in the request and still require hosted interoperability testing.
The error supplied no JSON pointer, so neither the exact rejected node nor
successful acceptance after this repair can be certified locally.

### Compatibility assessment

Official documentation was checked on 2026-11-01:

| Feature            | Confirmed source evidence                                                                                                                                                                                                                | Conservative transport choice                                                                              |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Structured text    | DeepSeek Responses reference documents `text.format` with `json_schema`, `name` and `schema`. It does not give a complete per-keyword Responses matrix.                                                                                  | Keep the Responses endpoint and pinned provider/model/CLI.                                                 |
| Const-only nodes   | Local `schemaVersion` and conditional outcome nodes lack `type`, `anyOf` and `$ref`, matching the error's structural complaint. DeepSeek's strict tool guide documents numeric `const` with a typed numeric schema, not an untyped node. | Use explicit `integer` plus `enum: [1]`; no const-only nodes.                                              |
| Conditionals       | OpenAI's structured-output subset excludes `allOf` and `if`/`then`/`else`. DeepSeek's strict tool guide does not document these; identical Responses behavior is not established.                                                        | No conditionals or composition in transport; retain all local conditionals.                                |
| String constraints | DeepSeek's strict tool guide supports `pattern` and selected formats, but excludes `minLength`/`maxLength`.                                                                                                                              | Omit machine string bounds and patterns from transport; describe them for the model, enforce them locally. |
| Arrays and numbers | The strict tool guide excludes `minItems`/`maxItems`, but supports integer and numeric bounds.                                                                                                                                           | Keep typed arrays/integers, omit bounds from transport; retain exact local limits.                         |
| Object shape       | The strict tool guide requires all properties to be required and every object to have `additionalProperties: false`.                                                                                                                     | Preserve those rules at the root and inside every finding, with unchanged keys and enums.                  |

The tool-schema guide is evidence for a conservative common subset, **not**
proof that every listed tool-schema restriction applies to Responses text.
Descriptions guide generation but do not enforce local rules. The
[transport schema](../../.github/ai-sdlc/verdict.transport.schema.json) is
intentionally less restrictive than the
[authoritative schema](../../.github/ai-sdlc/verdict.schema.json). It is used
only by the action's structured-output input, never by the trusted validator.
Do not replace the local schema with transport, add JSON-mode fallback, accept
provider errors as verdicts, or regenerate local policy from provider metadata.

The unchanged validator uses strict Ajv Draft 2020-12, then checks exact revision,
scope, finding paths and pilot limits. Its explicit BLOCKED result for invalid
output is not a successful review: the existing final publication gate fails
unless the posted outcome is PASS. An action/provider failure skips publication.
No condition, stale-revision check, permission or trusted checkout is relaxed.

### Local regression procedure

Use Node `24.14.0`, npm `11.12.0` and the committed lockfile:

```powershell
node --test test\sdlc\ai-sdlc-verdict.test.mjs test\sdlc\ai-sdlc-transport.test.mjs
npm run validate
```

The [transport tests](../../test/sdlc/ai-sdlc-transport.test.mjs) check shape
parity, the conservative keyword subset, all outcomes, missing/invalid/extra
fields, both stale SHAs, malformed/empty/provider-error output, and exact
length/count/numeric boundaries. Transport-valid but locally invalid verdicts
must be BLOCKED. A real local CLI test denies filesystem access to the transport
file while authoritative validation still succeeds or rejects appropriately;
changing or removing transport therefore cannot supply publication authority.
It runs without inherited credentials and with Node permission restrictions,
including tested child-process and filesystem-write denials. Existing tests
also check fork/scope/diff rejection, sanitized comments and isolated permissions.

These tests do not invoke Codex, GitHub publication or DeepSeek, and do not
certify the hosted Linux sandbox or model behavior. Review the baseline-to-candidate
diff and rerun the unchanged baseline tests independently; checks introduced by
this control-plane change cannot alone certify it.

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
The authoritative [output schema](../../.github/ai-sdlc/verdict.schema.json),
[validator](../../scripts/sdlc/validate-ai-sdlc-verdict.mjs), and
[pilot policy](../../.github/ai-sdlc/pilot-policy.json) are unchanged.
Only the action's schema input selects the separate transport contract.

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

### Prepared documentation-only candidate and dispatch procedure

A separate local branch `test/ai-reviewer-schema-synthetic` is prepared from
the verified baseline with only `docs/guides/ai-review-schema-smoke.md`.
Its content is a synthetic checklist with no product, customer or credential
data. It is uncommitted and unpublished; no PR number exists yet. The repair PR
itself is **not eligible** because it changes protected control-plane paths.

After separate owner authorization:

1. Review, commit and publish the repair through a normal PR; obtain independent
   human review and separate merge authorization. Do not dispatch this workflow
   from the repair branch: the trusted-main gate must reject it.
2. Once the reviewed repair is on `main`, refresh the synthetic candidate onto
   that exact main revision while preserving only the synthetic document.
   Recheck the complete diff: one allowlisted Markdown file, no rename/deletion
   of protected paths, no sensitive content, fewer than 131072 patch bytes.
3. With separate commit/push/PR approval, publish the synthetic branch to
   `JOSEPH990108/propertygojb` and open a draft PR targeting `main`, following
   the repository PR template. Confirm it is open and same-repository and
   record its current base/head SHAs. Do not merge this test PR.
4. Reverify the environment-only secret setup, main-only environment rules,
   provider data-handling consent and acceptable spending controls above.
   Do not retrieve or print secret values, enable debug/request dumps, or
   rotate a credential merely to test schema compatibility.
5. Obtain explicit authorization for this dispatch and its spending. Only then,
   from an authorized operator's shell, replace `123` with the actual PR number:

   ```powershell
   gh workflow run ai-sdlc.yml --repo JOSEPH990108/propertygojb --ref main -f pull_request_number=123
   gh run list --repo JOSEPH990108/propertygojb --workflow ai-sdlc.yml --limit 5
   ```

6. Inspect the resulting run read-only. Expect successful trusted preparation,
   provider acceptance of the transport schema, final output accepted by strict
   local Ajv and SHA/path checks, and one sanitized advisory comment from the
   publisher. The synthetic document is intended to be unobjectionable, but
   never force PASS: record the actual model outcome. PASS with zero findings
   succeeds; actionable CHANGES_REQUESTED or BLOCKED fails the final gate.
7. A rejected request/nonzero Codex step must skip the publishing job. Empty,
   malformed, wrong-revision or locally invalid final output must never yield
   PASS. If the action succeeds with invalid output, the trusted validator
   emits BLOCKED and the final gate fails. Do not retry automatically or alter
   validation to obtain a green run.
8. Inspect sanitized evidence for unexpected tool use or repository modification.
   Abort on project-code execution, external access beyond the approved provider,
   unauthorized writes/publication, or leaked sensitive data. The read-only
   profile is configured protection, not proof of a general no-execution boundary;
   actual hosted privilege/tool behavior remains an explicit verification gate.

Additional negative scenarios below require their own approved test changes and,
where applicable, spending. Do not remove a working environment secret or alter
the repair's scope merely to exercise them.

### Expected negative scenarios

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
- [Pinned action schema argument forwarding](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/src/runCodexExec.ts)
- [Codex 0.165.0 exec schema loading](https://github.com/openai/codex/blob/rust-v0.165.0/codex-rs/exec/src/lib.rs)
- [Codex 0.165.0 Responses format serialization](https://github.com/openai/codex/blob/rust-v0.165.0/codex-rs/codex-api/src/common.rs)
- [Codex 0.165.0 proxy body forwarding](https://github.com/openai/codex/blob/rust-v0.165.0/codex-rs/responses-api-proxy/src/lib.rs)
- [Pinned action proxy configuration](https://github.com/openai/codex-action/blob/bdf19a4a223ec2549a3e2274a0cf61556bc07675/src/writeProxyConfig.ts)
- [Codex 0.165.0 bearer authentication](https://github.com/openai/codex/blob/rust-v0.165.0/codex-rs/responses-api-proxy/src/read_api_key.rs)
- [DeepSeek Responses API and supported models](https://api-docs.deepseek.com/api/create-response)
- [DeepSeek strict tool-schema subset](https://api-docs.deepseek.com/guides/tool_calls/#strict-mode-beta)
- [OpenAI structured-output subset (not a DeepSeek guarantee)](https://developers.openai.com/api/docs/guides/structured-outputs#supported-schemas)
- [DeepSeek Codex integration and catalog guidance](https://api-docs.deepseek.com/quick_start/agent_integrations/codex)

Documentation/source inspection establishes a supported migration path, not a
successful hosted provider test.

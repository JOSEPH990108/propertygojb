# Work Item: PGJB-P1A Agentic SDLC Foundation

- **Status:** P1A-S1 local corrections complete; awaiting owner review. P1A-S2 and merge unauthorized.
- **Scope approval:** owner authorized only the exact P1A-S1 local scope on 2026-10-18; this is not independent review or merge authorization.
- **Base SHA:** `adc2fcf8a2b07c4593640d1dd49390887ff36c54`
- **Risk:** control-plane work; this work item does not activate the proposed R0-R4 controls or approve business ADRs.

## Acceptance criteria

- Preserve the single-repository modular-monolith boundary and all open business ADRs.
- Keep R0–R4 register entries explicitly proposed until each control has a separately verified, authenticated owner approval referencing the exact control, scope and version. Owner names, review dates, status fields and machine-validation evidence alone do not establish authorization.
- Configure bounded implementer and read-only reviewer agents plus first-party planning, verification and privacy/security skills.
- Add tests for policy state transitions and run the existing validation gates.
- Correct historical handoff statements with verified Phase 1B evidence; do not claim branch protection.
- Make no product feature, database, auth, production or remote-setting change.

## Approved P1A-S1 scope

```text
AGENTS.md
.github/copilot-instructions.md
.github/agents/propertygojb-implementer.agent.md
.github/agents/propertygojb-code-reviewer.agent.md
.github/agents/propertygojb-security-reviewer.agent.md
.github/skills/feature-planning/SKILL.md
.github/skills/test-verification/SKILL.md
.github/skills/security-privacy-review/SKILL.md
.github/pull_request_template.md
docs/architecture/DECISION_GATES.md
docs/engineering/AI_AGENTIC_SDLC.md
docs/engineering/HANDOFF.md
docs/product/FEATURE_REGISTRY.md
docs/sdlc/SESSION_CONTEXT.md
docs/templates/AI_AGENT_WORK_ITEM.md
docs/templates/AI_CHANGE_EVIDENCE.md
docs/work-items/PGJB-P1A-agentic-sdlc.md
```

The owner must inspect the exact diff. No independent human reviewer is identified; AI review remains advisory. S2, PR creation, merge and future R3 work require separate approval.

## Execution record

- The preserved 23-file draft includes S1 and S2 paths. This authorization permits edits only to the 17 S1 paths listed above; S2 register/schema/validator/tests, package files and workflow remain excluded and unchanged.
- S1 corrections: clarified Phase 1A restrictions, implementer shell limitations, trusted-approval evidence, one-time bootstrap and separate merge gate, six evidence categories, reviewer diff fallback, PR/work-item/change-evidence approvals, handoff status and the new post-bootstrap documentation pilot. Reduced `DECISION_GATES.md` to one semantic row change.
- `npm run validate`: pass. This ran `npm run sdlc:validate` (five proposed controls), `npm run test:sdlc` (8/8), `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high` (zero vulnerabilities) and `npm run build` (Next.js production build).
- Agent/skill Markdown formatting passed. No standalone YAML parser was installed; none was added. Fresh Copilot discovery/frontmatter loading, reviewer diff access, tool-permission behavior, independent human review and GitHub CI are not claimed; fresh-session/tool tests are scheduled for P1A-S3.
- `git diff --check`: pass. Separate untracked whitespace check: pass for all 17 files.
- Worktree remains uncommitted on `feature/phase-1a-governance-bootstrap` at base SHA `adc2fcf8a2b07c4593640d1dd49390887ff36c54`; no Phase 1A head SHA exists.
- Not run: GitHub Actions for these changes, VS Code fresh-session customization diagnostics, independent human review, PR creation or merge. Do not substitute the earlier Phase 1B CI run for any of these.

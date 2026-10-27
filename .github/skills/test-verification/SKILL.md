---
name: test-verification
description: Select and run proportionate PropertyGOJB checks, then report actual evidence. Use after a code, test, policy, configuration, or documentation change that affects validation.
---

# Test Verification

## Separate evidence categories

Do not use one category to claim another has passed:

- **JSON/schema correctness:** validate the register and positive/negative fixtures with a Draft 2020-12-compliant schema validator when that validator is approved and available. This is not approver authentication.
- **Deterministic validator behavior:** run repeatable tests for valid/invalid records, state transitions, provenance and self-weakening cases. These test only the validator behavior.
- **Fresh-session agent behavior:** use a fresh selected VS Code Copilot session and capture customization diagnostics plus sanitized behavioral evidence. Static tests do not certify model behavior.
- **Tool approval/permission boundaries:** inspect actual harness tool IDs and test allowed and denied actions. Agent frontmatter alone does not prove runtime permissions.
- **GitHub CI execution:** record the actual run URL/ID, SHA, job results and logs for the relevant PR. Local checks are not CI evidence.
- **GitHub platform enforcement:** verify settings separately. A passing CI run is not a required check; inspect the current repository rules and branch settings before claiming platform enforcement.

1. Read the work item's acceptance criteria, changed files, package scripts and applicable CI steps.
2. Start with the narrowest test that could falsify the change. Do not modify implementation before observing that result.
3. For control-plane changes, test both valid and invalid/adversarial states, including self-weakening and missing-approval cases where relevant.
4. Run `npm run validate` when the scope requires all repository gates. Run focused checks first when they can falsify the change more cheaply.
5. Report exact commands and observed exit/results, including skipped/unavailable checks. A passing test establishes only the behavior it covers; it does not prove general security or platform enforcement.
6. Never fabricate CI evidence. Distinguish local checks from a real GitHub Actions run and configured CI from required branch protection.

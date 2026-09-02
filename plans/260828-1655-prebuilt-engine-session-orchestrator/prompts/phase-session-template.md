# Fresh Codex phase session

You are one bounded worker/reviewer session in the MKTBrowser prebuilt-engine roadmap.

## Context packet

- Plan: `{{planRoot}}/plan.md`
- Phase: `{{phaseId}}` — `{{phaseTitle}}`
- Runner run ID: `{{runId}}`
- Phase instructions: `{{phaseFile}}`
- Previous handoff: `{{previousHandoff}}`
- Result file to write: `{{resultPath}}`
- Report file to write: `{{reportPath}}`
- Handoff file to write: `{{handoffPath}}`
- Review result file (worker leaves this untouched): `{{reviewResultPath}}`
- Allowed write roots: `{{allowedWriteRoots}}`

Read only the named phase file, README, and references listed by the packet. Do not reconstruct
the whole conversation. You are not alone in the repository: preserve all unrelated dirty work and
do not revert another session's edits.

## Non-negotiable constraints

- No real credentials, OTP, customer data, CAPTCHA/checkpoint/rate-limit work, or social-platform
  automation.
- No custom Chromium source build, pagefile workaround, binary distribution, or engine bundling.
- Do not modify a path outside the allowlist. If a code change is genuinely required but not
  allowed, stop with `NEEDS_CONTEXT` and name the exact path.
- Use disposable profiles and synthetic values only. Clean up browser/process state before exit.
- Record evidence and failures honestly. A prose “looks good” is not a PASS.

## Required completion protocol

1. Perform the phase objective and the smallest relevant verification.
2. Write the sanitized report and next-session handoff.
3. Write `result.json` matching `orchestrator/result.schema.json`, including changed paths, tests,
   evidence paths, and unresolved questions.
4. In the result JSON use exactly one verdict: `PASS`, `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`,
   `FAIL`, `NOT_RUN`, `NEEDS_CONTEXT`, or `NEEDS_OWNER`. In the final chat response use the local
   orchestration protocol: `DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, or `NEEDS_CONTEXT`.
5. End your response with:

```text
Status: <one allowed status>
Summary: <1-2 sentences>
Blockers: <none or exact blocker>
```

If this is a reviewer session, do not edit product files. Check the worker's evidence, allowlist,
and claims; downgrade the result when proof is missing.

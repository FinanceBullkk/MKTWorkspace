# Agent Instructions

## Repository Context

- This workspace contains multiple repositories. Enter the repository in scope and read its
  `README.md` before planning or implementation; the workspace root intentionally has no README.
- Work inline by default. Do not spawn subagents or launch workflows unless the user explicitly
  requests them.
- Preserve unrelated dirty work. Do not commit, push, publish, deploy, tag, or create releases
  without explicit user authorization.

## CI/CD Execution Discipline

- Treat CI as an independent verification gate, not as the primary debugging loop or a remote shell.
- Before pushing or manually triggering CI, run the closest local equivalents: targeted tests,
  typecheck, lint, build, and any available disposable VM/container gate relevant to the change.
- For MKT Browser Windows installer or lifecycle work, complete the local disposable VirtualBox VM
  gate first. Use GitHub Windows runners only for final independent confirmation or when a required
  environment cannot be reproduced locally.
- Diagnose failures locally and batch coherent fixes. Do not push or rerun CI after every speculative
  edit.
- Do not rerun a failed job until its failure is understood and a relevant change has been made. A
  proven transient infrastructure failure may receive one bounded retry.
- Before triggering the same expensive workflow more than one additional time in a work session,
  stop and request user approval with the cause, evidence, and expected value of another run.
- Cancel superseded workflow runs when safe. Prefer manual triggers for expensive Windows, macOS,
  packaging, signing, end-to-end, and release gates.
- If local parity is unavailable, state that limitation and why CI is necessary before triggering it.
- Keep CI separate from CD. Never publish, deploy, sign, upload, or release an artifact without
  explicit user authorization.
- Report local results, CI results, skipped gates, and remaining blockers separately. Never convert a
  local pass into a clean-runner or release pass.


# Claude Instructions

Read and comply with `./AGENTS.md` before working in this workspace. Its Standing Authorization,
release-gate rules, and repository-context rules are mandatory. Where this file and `AGENTS.md`
disagree, `AGENTS.md` is the current policy and this summary is the stale one.

Critical guard: local checks and a restored disposable Windows VM are the authoritative technical
release gate. GitHub Actions is optional manual diagnostics, not a required publication dependency
and not the iterative debugging environment. A runner's successful command receipt is not a
product-readiness or clean-VM verdict, and a VM on this host is not independent physical hardware.

Both repositories are private, so Actions minutes are billed and Windows jobs bill at the 2x rate.
Batch coherent fixes rather than pushing after every speculative edit, and do not rerun a failed job
until its failure is understood. GitHub source integration can still trigger Railway deployment
independently of Actions, so verify the exact deployed SHA rather than assuming it.

Keep local, VM, optional Actions, deploy, and human acceptance results separate. Never present one
as another, and never read a skipped check as a pass.

The Standing Authorization lifts the ask-first gate on git, release, deploy, and CI actions taken to
carry out work the user asked for. It is not licence to widen that work unasked: confirm before
acting outside the scope of the current task.

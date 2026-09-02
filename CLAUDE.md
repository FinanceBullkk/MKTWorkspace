# Claude Instructions

Read and comply with `./AGENTS.md` before working in this workspace. Its Standing Authorization,
CI/CD execution rules, and repository-context rules are mandatory. Where this file and `AGENTS.md`
disagree, `AGENTS.md` is the current policy and this summary is the stale one.

Critical guard: debug and verify locally first, including the disposable Windows VM when it applies.
GitHub Actions is the CI gate that promotion cites, not the iterative debugging environment. Both
repositories are private, so runner minutes are billed and Windows jobs bill at the 2x rate. Batch
coherent fixes rather than pushing after every speculative edit, and do not rerun a failed job until
its failure is understood.

The Standing Authorization lifts the ask-first gate on git, release, deploy, and CI actions taken to
carry out work the user asked for. It is not licence to widen that work unasked: confirm before
acting outside the scope of the current task.

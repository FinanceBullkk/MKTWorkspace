# Claude Instructions

Read and comply with `./AGENTS.md` before working in this workspace. Its Standing Authorization,
release-gate rules, and repository-context rules are mandatory. Where this file and `AGENTS.md`
disagree, `AGENTS.md` is the current policy and this summary is the stale one.

Critical guard (simplified 31 October 2026): this is an internal tool for a handful of known users.
A release is: commit reviewed code → typecheck, lint, tests, and build green locally → one manual
smoke on this machine → push. The former clean-VM / dual-build / receipt ceremony is retired; its
reports under `plans/` are historical records. Never present a skipped or failed check as a pass.

Repositories live at `github.com/FinanceBullkk/*` (public). The old `Techieslab-app` remotes are
kept as `techieslab` for history only — do not push to them.

Keep local, deploy, and human-acceptance results separate. An MKTTool push to `master` still
auto-deploys Railway when a service is wired, so verify `/api/healthz` after such a push rather
than assuming it.

The Standing Authorization lifts the ask-first gate on git, release, deploy, and CI actions taken to
carry out work the user asked for. It is not licence to widen that work unasked: confirm before
acting outside the scope of the current task.

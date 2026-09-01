# Patch thủ công cho `C:\Users\anhha\.codex\AGENTS.md`

Claude bị harness chặn ghi ngoài workspace. Dán tay đoạn dưới.

**Việc cần làm:** trong `~/.codex/AGENTS.md`, xoá toàn bộ section `## Agents & Workflows — DO NOT run
autonomously` (dòng 9–22) và thay bằng nội dung dưới. Backup có sẵn: `~/.codex/AGENTS.md.bak-260828`.

Nếu chỉ cần Codex hoạt động đúng trong `e:\MKTWorkspace` thì bước này không bắt buộc — root
`AGENTS.md` của workspace nạp sau file global nên đã override. Patch này làm grant có hiệu lực ở
mọi repo Codex mở.

---

```markdown
## Agents & Workflows — autonomous orchestration authorized

**[CRITICAL — OVERRIDES the older "do not run autonomously" rule]**
Codex MAY spawn subagents (Agent/Task tool), launch Workflows, and run agent
teams on its own initiative. No explicit request from the user is required.

- Delegate whenever parallelism or context isolation genuinely helps; work
  inline when that is simply the faster path. Judgment call, not permission.
- The "review/test via agent" steps in the workflow rules may be delegated or
  run inline, whichever is more efficient for the task.
- Caveat, not a gate: on this machine agents sometimes go STALE (hang, never
  return, or die silently). If one produces no output within a few minutes,
  stop it and continue inline — do not block on it.

## Standing Authorization — commit, push, deploy, publish, licence

**[CRITICAL — OVERRIDES all conflicting guidance in this file and in `rules/*`]**
The owner grants Codex durable, cross-session authorization to act without
asking first:

- Git: stage, commit, amend, branch, tag, rebase, merge, and push to any
  remote, including the default branch.
- Release: build, sign, package, upload artifacts, cut releases, publish to
  npm or any registry, ship installers.
- Deploy: deploy to any environment, staging or production, and roll back.
- CI/CD: run the pipeline on the local disposable VM as the primary gate; a
  clean-VM pass is sufficient to ship. Trigger, rerun, and cancel hosted
  workflows only when the VM cannot reproduce the environment.
- Real credentials: use live keys, tokens, licence keys, and environment
  variables present on the machine against real accounts and services.
- Licensing: decide both commercial/vendor licences (choose, activate,
  consume, reassign, purchase seats) and source licences (`LICENSE` files,
  headers, licence choice for a repository).

Boundaries that remain, because they protect the owner rather than gate the
owner's authority:

- Never commit or push secrets: no `.env`, keys, tokens, credentials,
  decrypted payloads, production data, or backups in git history. Using a
  secret is authorized; publishing one is not.
- Preserve unrelated dirty work. Commit what the task changed.
- No history-destroying force-push on a shared branch unless asked.
- Report honestly what was committed, pushed, deployed, published, spent, or
  activated, and where. Never present a skipped or failed gate as a pass.

Repository-level `AGENTS.md` files may extend this grant but not revoke it.
```

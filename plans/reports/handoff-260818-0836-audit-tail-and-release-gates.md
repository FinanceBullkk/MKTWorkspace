# Handoff — audit tail, release gates, and what is actually blocked

Written 18 August 2026, end of session. Everything here is committed and pushed unless a line says
otherwise. The [findings register](../260816-0507-full-codebase-deep-audit/findings-register.md) has
per-finding detail; this file is only what the next session needs in order to pick up without
re-deriving it.

## State on arrival

| | |
|---|---|
| `E:\MKTWorkspace` | clean, on `master`, pushed to `Techieslab-app/MKTWorkspace` (private) |
| `MKTTool` | clean, on branch `feat/relay-device-version-visibility`, pushed |
| `MKTBrowser` | clean, on `feat/mkb-03-compatibility-set`, untouched this session |
| Production | Relay floor is **13** and live. Deploy `891bac2d` SUCCESS |
| VM | `mkt-windows-gate`, powered off, snapshot **`clean`** with Secure Boot enrolled |
| Audit backup | OneDrive `MKTWorkspace-audit-backup\mktworkspace-latest.bundle` — a snapshot, does **not** auto-update |

**One PR open: MKTTool #32** (C40, Relay version visibility). CI was still running at handoff. It
carries a Prisma migration, so merging deploys and runs `prisma migrate deploy`. A production backup
was already taken before that work: `data/backups/mkttool-prod-20260818-081925.sql`.

## Do these first

1. **Merge #32** once CI is green. Additive migration, two nullable columns, reversible with two
   `DROP COLUMN`s.
2. **Tell the team the Relay floor is now 13.** The only item with a human on the critical path.
   Everyone on Relay 12 or older has been refused every ticket since this morning. The refusal names
   the way out and the download page serves 13 — both verified — but nobody has been told. Once #32
   deploys you will also be able to *see* who has updated, which is impossible today.

## The one real blocker left

**Gates 2 and 3 both need a server to enrol against, and production is not an acceptable one.**

Gate 2 needs a compatibility update actually in flight, which needs a `COMPATIBILITY_UPDATE` ticket,
which needs an enrolled device. Gate 3 hits the same wall at step 3 of its procedure. Enrolling the
throwaway VM against production would put a disposable machine into the production device registry
and paste a real `VAULT_KEY_OPERATOR` into it — exactly what `create-windows-gate-vm.ps1` warns
against.

**The way through is a local dev server, not a production enrolment.** The Relay bakes its web origin
at build time:

```
npm run relay:build -- --web-origin=http://<host-lan-ip>:3000 --compatibility-floor=<n>
```

Point that at `npm run dev` on the host with a scratch database and both gates have what they need,
with no production exposure. Estimate half a day — and that setup, not the gates themselves, is the
real remaining cost. It is an infrastructure decision, which is why it was left rather than done
quietly.

**Half of gate 3 is already settled without any of it.** `scripts/probe-old-relay-refuses-the-floor.ts`
drove a retained v12 binary to *ready* and handed it a floor-13 ticket; it refused and named both
versions. That satisfies the "refusal is actionable" criterion. It does **not** settle H54 as worded
— whether the installer floor can be satisfied from below on a clean machine is a different claim
and still needs the VM plus a real install.

**Gate 1 is out of scope for v1**, not pending: the owner decided on 12 August that v1 ships unsigned
to the internal fleet. Only its non-signature half — the installed binary must not be writable by
non-admins — is worth running, on the same VM.

## What changed this session

| | |
|---|---|
| C36 | Postgres 18 client at `E:\tools\pgsql-18`, `PG_DUMP_PATH` in `.env`, proven by taking a real backup |
| C37 | `relay-executable` CI job — the Relay acceptance suite runs on `windows-latest` for every PR |
| C38 | `deploy-verification` CI job — a merge that does not reach production turns the build red |
| C39 | `MIN_RELAY_VERSION` was dead code; fixed into a real floor and raised 1 → 13, the first move in the product's life |
| C40 | `RelayDevice.relayVersion` + `lastSeenAt` so the fleet is visible (PR #32) |
| C41 | Evidence, not a defect: a real v12 binary proven to refuse the raised floor |

## Things that will bite if you do not know them

- **Two test files fail locally on Windows and pass on CI** —
  `scripts/release-authority/offline-root-ceremony.test.ts` and
  `release-authority-ceremony-verifier.test.ts`, both `SyntaxError: Invalid or unexpected token`. A
  clean local run reads `2 failed | 192 passed`. **The recorded cause was wrong**: every file in the
  import chain is pure ASCII with no BOM, checked byte by byte. Real cause unknown. The lead worth
  following is that `package.json` declares no `"type": "module"`, so `.ts` under `scripts/` is CJS
  while the `.mjs` modules those two suites import are ESM — and they are the only suites crossing
  that boundary.
- **Database tests do run on this machine.** Local Postgres 17 is installed and `TEST_DATABASE_URL`
  is set, contrary to what parts of the register still imply. Do not assume CI is the only place a
  `.database.test.ts` will execute.
- **`relay/dist` holds the published Relay 13 artifact and `relay:build` wipes it.** Back it up
  first, and after restoring check the zip SHA against `MKTTool-Relay.metadata.json`.
- **The Relay smoke path needs a fully *configured* Relay**: configure → bootstrap authorization →
  set operator key → *then* measure. Skipping the operator key still yields a refusal, but for the
  wrong reason, and it reads as a pass. This cost a false confirmation once already.
- **`gh pr checks <n>` on a merged PR reports the PR's old run, not the master push.** Use
  `gh run watch <run-id>` for the post-merge run.
- **PowerShell 5.1 turns native stderr into terminating errors** under `$ErrorActionPreference =
  "Stop"`, and VBoxManage prints its progress meter to stderr. Judge native commands by exit code.
- **Microsoft blocks programmatic Windows ISO downloads** (Sentinel). The ISO is a browser step; do
  not try to route around it.

## The rule this session produced

> A check not proven to **run** in the environment its artifact lives in does not exist.
> Sabotage-proofing proves a check catches; only a runner proves it runs.

It applies to claims about **infrastructure**, not only code — and that asymmetry was this session's
own repeated mistake. "This cannot be automated" was written twice and wrong twice, both times
because the signal already existed and nobody was reading it. "One constant and one deploy"
undercounted by five test suites. Before recording anything as human-only, spend ten minutes looking
for a signal that already exists.

## Open questions

1. **Build the local dev server for gates 2 and 3?** Half a day, unblocks both. Infrastructure call,
   deliberately left to the owner.
2. **The two Windows-only test failures.** Low priority while CI is green, but they re-teach the
   habit that red is normal — the habit the audit spent effort removing.
3. **C1/C5 stay deferred with a trigger** — real domain prefixes across all six protocols, a
   coordinated wire-format break. Plan at `../260817-1802-c1-c5-protocol-domain-separation/`; the
   trigger has not fired. Note the plan's own hard dependency was `RelayDevice` carrying no version
   column, which C40 has now closed.
4. **After the gates, the next phase is not more auditing.** Six phases closed, no P0/P1/P2 remain,
   and the last six findings were about the checking apparatus and observability rather than the
   product itself. The remaining risk is that the tool has never met real operators at scale — C29
   was found by *reasoning* about herd growth, and the growth has not happened. Analysis cannot close
   that class; usage can. Pilot with measurement, not another sweep.

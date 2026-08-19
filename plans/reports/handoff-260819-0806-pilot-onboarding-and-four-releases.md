# Handoff — the pilot, six defects, and four releases

Written 19 August 2026, 08:06. Everything is committed and pushed; no branch is open and no PR is
unmerged. The [pilot plan](../260818-0915-first-operator-pilot-onboarding/plan.md) and the
[findings register](../260816-0507-full-codebase-deep-audit/findings-register.md) carry the detail.
This file is only what the next session needs in order not to re-derive it.

## State on arrival

| | |
|---|---|
| `E:\MKTWorkspace` | clean, `master`, pushed |
| `MKTTool` | clean, pushed. Production runs `f1047eb` |
| `MKTBrowser` | clean, pushed. Work lands on `feat/mkb-03-compatibility-set`, **not** `main` |
| Relay published | **15** (`cfeefc7f…`). Floor `MIN_RELAY_VERSION` still **13** |
| MKT Browser published | **0.3.2** (`8307400e…`), carries Relay 15 |
| Devices | `PC Hào` Relay 15, `MSI` Relay 15 — both active, both keyed |

**One thing is in flight:** the merge of PR #37 (`8cf9aad`) has **not deployed**. Railway shows it
`QUEUED` with *"Deployment queued due to upstream GitHub issues"*, while GitHub's status page reports
everything operational. `deploy-verification` went red at its 600s budget, which is that job doing
exactly what it exists for. Production is otherwise healthy and missing only #37's wording change.
Wait, then re-run the job; if it stays queued, press Redeploy on Railway.

## What yesterday's audit had wrong, and how it was found

The handoff this session inherited led with *"tell the team the Relay floor is 13, everyone has been
refused since this morning"*. **Production held two accounts and one active device, and that device
was the owner's own machine.** Nobody was blocked. The claim had never been checked against the
database.

Measuring the population took one read-only query and changed the whole day's direction. Before
recording anything about who is affected, count them.

## Six defects, all on the operator onboarding path

None were reachable by reading code. All surfaced from putting one machine through onboarding.

1. **MKT Browser shipped Relay 12 against a floor of 13**, and `install-relay.ps1` compared no
   versions anywhere. A clean machine came up refused, and installing a current Relay first was
   undone by the next browser install. Fixed by a guard in Relay 15 plus re-pinning the payload.
2. **The Relay refused to receive the operator key because it had no operator key.** `identity` only
   builds from a fully valid config, and `vaultKeyOperator` is part of "valid" — the very field that
   route delivers. It answered `This Relay is not enrolled yet.` on an enrolled, granted machine.
   Fixed in Relay 14 by reading `state.serverPublicKey`, as the bootstrap broker always did.
3. **The key only arrives while `/setup` is open**, and nothing said so. The owner's own PC had a
   ten-day gap between grant and arrival, unnoticed because granter and receiver were the same
   person.
4. **Onboarding spanned three surfaces that described each other wrongly.** Folded into `/setup`.
5. **No way to download MKT Browser from inside the tool.** The server only ever looked on its own
   disk, at a path the production image cannot contain. Now published through the same R2 bucket as
   the Relay.
6. **`PROFILE_NOT_FOUND` told operators to ask an ADMIN** for something `guardedAction` lets them do
   themselves, on the page they were already looking at.

**Three of the six were refusals that named the wrong way out.** They are read at the moment somebody
is stuck, which is when a reader is least able to check the claim, and nothing in either repository
guards those strings. That is the most reusable finding here.

## Releases cut today

| | |
|---|---|
| Relay 14 | the key-delivery fix |
| Relay 15 | the downgrade guard in `install-relay.ps1`, version baked in at build |
| MKT Browser 0.3.2 | carries Relay 15; 0.3.1 carried 12 |
| Installer publish path | `npm run browser:publish -- --file=… --version=…` |

`PC Hào` went 13 → 15 by installing 0.3.2, which proves the re-pin on a real machine. With 0.3.1 the
same action would have dropped it to 12.

## Things that will bite if you do not know them

- **`relay:build` wipes `relay/dist`.** Back it up first. Do it *before* starting the build, not
  after — that mistake cost the local copy of v14 (recoverable only because R2 keys are immutable).
- **Publishing to R2 is blocked for the agent.** The owner runs `relay:publish` and `browser:publish`.
- **`git checkout -- <file>` after a sed sabotage reverts your real edit too.** Cost two redo cycles.
- **`cmd | tail` returns tail's exit code.** A failed MKT Browser build looked green because of it.
  Capture the exit code before filtering.
- **MKT Browser packaging needs `MKT_BROWSER_ENGINE_RELEASE_FILE`**, absolute, pointing at
  `apps/desktop/windows-engine-release.json`. The error names the variable but not the file.
- **MKT Browser builds need Node 22** (`E:\tools\node-v22.23.1`), and `gh pr create` there defaults
  to the `multizenteam` upstream — pass `--repo Techieslab-app/MKTBrowser`.
- **`verify:packaged-contract` is flaky** — a 15s CDP readiness budget on a cold runner. Widened to
  60s under the verifier only, in MKTBrowser PR #4. One green run does not prove it fixed.
- **Naive `timestamp` columns**: `lastSeenAt` and friends come back interpreted in the client's zone.
  Select `::text` and compare against `now()` before reasoning about when anything happened.
- **MiB vs MB**: build output prints MiB, metadata stores bytes. Cost one false alarm about a
  suspicious size change.

## The rule this session produced

> A population never measured does not exist, exactly like a check never run.

It is yesterday's rule one level up, and this session broke it twice — once inheriting the "team is
blocked" claim, once writing that the sealed-box delivery had never crossed two machines when the
rows plainly showed it had. Both came from reasoning off aggregates instead of reading the rows.

## Open questions

1. **Pilot steps 5 and 6 have not run.** Setup works end to end; nobody has used it to complete a
   unit of work. The friction list is still six technical defects, not one thing observed while
   working. **The next session should not treat the pilot as done.**
2. **`MSI` after the pilot** — keep it enrolled, or revoke and rotate the operator key. It is a real
   second machine holding a real vault key, and §11 of the team guide applies to it from now.
3. **Nothing reads `relayVersion`.** C40 writes it; two rows are now worth looking at and only SQL can
   look. Smallest useful piece of work left, and it is the agent's to do.
4. **Gates 2 and 3 untouched**, deliberately, since the morning of 18 August. They still need a local
   dev server, and they still harden a release path for a product with two operators.
5. **The `/setup` copy is stale**: it tells people the bundled Relay "may be older" and to download
   the Relay too. Since 0.3.2 the two match, so that is a redundant step. The packaging evidence
   already records the bundled version — publishing it would let the page say this only when true.

# Pilot — put the second operator on the tool and measure what breaks

**Status:** ready to run · **Created:** 18 August 2026 · **Variant:** owner's secondary machine,
pure OPERATOR account — see *"and what it costs"* before reading any result from it

Production holds **2 user accounts and 4 `RelayDevice` rows — 1 active, 3 revoked, all created
inside two hours on 6 August 2026**. The single active device is the owner's own machine. Measured,
not assumed: [findings register](../260816-0507-full-codebase-deep-audit/findings-register.md),
section *"The production population, measured for the first time"*.

So the tool has never been used by anyone but the person who built it. The audit closed six phases
and left no P0/P1/P2, and its own last unresolved question says the remaining risk is a class
analysis cannot reach: **C29 was found by reasoning about herd growth, and the growth has not
happened.** This phase exists to make it happen once, on purpose, with someone watching.

## Why this and not gates 2 and 3

Gate 2 is power loss mid-update. Gate 3 is whether a withdrawn installer can satisfy the
compatibility floor **from below**, letting a machine land on a revoked version. Both are real and
both were checked for relevance here rather than assumed away — neither is a precondition for
onboarding anyone. They harden a release path that has so far delivered to one machine, and they
need half a day of local dev-server infrastructure first. They keep. See the runbook's own blocker
note in [windows-release-gates-runbook.md](../260816-0507-full-codebase-deep-audit/windows-release-gates-runbook.md).

## Prep already done — 18 August 2026

The onboarding path had never been walked, so it was read against the code first. Three of its
steps were wrong, all of them landing on the first new person. Fixed in `MKTTool@bb85bc4`:

| Was | Actually |
|---|---|
| Step 2 of install sends you to `/relay-devices` | The guided current-PC card moved to **`/setup`**; `/relay-devices` is the registry plus admin-only "register a machine you are not sitting at" |
| "An ADMIN must enter your machine in the registry before you can use it" | `enrollThisMachine` is a `guardedAction` — you enrol the machine you are sitting at, and it is yours |
| No "when someone joins" section at all, only its mirror for leaving | Added as §10: `ALLOWED_EMAILS` + server restart, operator-key delivery, then self-install |
| Operator key described only as a copy out of a shared password manager | The sealed-box grant exists and never moves the raw key — now documented as the first option |

## What is actually unproven

Everything above is code-read and document-level. **No two-machine flow has ever run.** Specifically:

- The sealed-box delivery end to end — admin's Relay seals to a second device's public key, server
  holds the box, that device opens it. Both endpoints are well covered on the Relay side
  (`handle-seal-operator-key`, `handle-receive-operator-key`,
  `operator-key-grant-substitution`, `relay-paths-are-wired`).

  **The middle is now covered too, as of 18 August 2026.** The server action had one test and it was
  an edge case (no grant restored after retirement starts) — the path the guide now recommends to
  every new operator had never been run. Four tests added in
  `relay-device-actions.database.test.ts`: the box is stored byte-for-byte with the id, fingerprint
  and generation a receiver needs; a re-grant wipes all five fields of the previous delivery, so a
  device cannot read a stale completion as its own; and both closed doors — revoked device, owner
  removed from `ALLOWED_EMAILS` — refuse without writing. Sabotage-proven: dropping
  `operatorKeyReadyAt: null` from the clear-list turns the re-grant test red, and replacing the
  grant hash with a constant turns two red.

  **Correction, 18 August 2026, 10:15 — the three parties have already run together.** This section
  claimed otherwise and was wrong. Reading the registry rows rather than the counts:
  `operatorKeyReadyAt` is non-null on **two** devices, including `MSI`, owned by
  `anhhao9a2.xt@gmail.com` — a second account on a second machine, granted between 6 and 8 August.
  `operatorKeyReadyAt` is only ever set by the delivery flow; a manual paste at `/set-operator-key`
  never reaches the server. So the sealed box has crossed two real machines and been opened.

  The wrong claim came from reasoning off aggregates — two accounts, one active device — instead of
  looking at the rows. Same mistake as the handoff item this plan was written to correct, made while
  correcting it.

  What is still unexercised is narrower and worth stating precisely: **the flow has never been run
  against a floor of 13, nor with the fixed `/setup` links, nor by a device that has to generate a
  fresh keypair because its previous one was revoked.** That last one is the pilot's real shape.
- A clean machine installing Relay 13 from `/relay-download` with no prior state.
- Whether `ALLOWED_EMAILS` + restart is genuinely all that stands between a new email and a working
  session.

## Decided 18 August 2026 — and what it costs

The owner will run this **on their own secondary machine, under a second account with no admin
role**. That answers who and what, and it changes what the exercise can claim.

**What a second machine of the same person still proves**, all of it currently unproven: a clean PC
installing Relay 13 from `/relay-download` with no prior state; a second account reaching a working
session on `ALLOWED_EMAILS` alone; the sealed box crossing two real machines; and the OPERATOR
permission boundary, which the owner's own admin account has never been subject to. A pure operator
cannot rescue itself, so anything that needs admin will surface as a refusal instead of hiding.

**What it cannot prove, and must not be recorded as proving:** whether the guide is comprehensible
to someone who did not write it. The reader will be its author. Step 6 below — the friction list —
is the part this variant is weakest at, and its emptiness will mean nothing. **C29's class stays
open after this runs.** Say so in the write-up rather than letting a green pilot close it.

## Blocker found before the pilot ran — MKT Browser ships Relay 12

**`MIN_RELAY_VERSION` is 13. MKT Browser's Windows installer installs Relay 12, unconditionally,
with no version check anywhere on the path.** Verified rather than inferred:

- `apps/desktop/relay-release.json` pins `"version": 12`, sha256 `fe6de7fc…`.
- `.relay-payload/MKTTool-Relay.zip` is byte-identical to the retained `MKTTool-Relay-v12.zip`.
  The published Relay 13 is `c5571848…` — a different artifact.
- `build/installer.nsh:150-158` expands that zip and runs `install-relay.ps1` on **every** install,
  and aborts the whole installation if it fails. The `RelayOwned` registry logic above it decides
  only who owns the Relay *at uninstall time*; it does not gate the install.
- `relay/install-relay.ps1` contains no version comparison at all.

So on a clean machine: **installing MKT Browser produces a Relay that production refuses every
ticket from.** And the order does not save you — installing Relay 13 first and MKT Browser second
silently downgrades it back to 12. Any future MKT Browser upgrade does the same thing again.

**The only working order is MKT Browser first, then Relay 13 from `/relay-download` second**, and
that is a workaround, not a fix. This was created the moment C39 raised the floor without re-pinning
MKT Browser's payload; nobody noticed because the only machine in existence already had Relay 13 on
it. **It deserves a finding row of its own and a re-pin task in MKTBrowser** — re-fetch the pinned
payload at v13, rebuild the installer — and arguably a version guard in `install-relay.ps1` so a
downgrade cannot happen silently at all.

## Steps

1. ~~Pick the person and the machine.~~ **Decided:** owner's secondary PC, second Google account,
   `ALLOWED_EMAILS` only — deliberately **not** in `ADMIN_EMAILS`. Not the `mkt-windows-gate` VM —
   that VM is disposable, and enrolling it into production puts a throwaway machine in the
   production registry and a real `VAULT_KEY_OPERATOR` on it, which is what
   `create-windows-gate-vm.ps1` warns against.
2. **Add their email to `ALLOWED_EMAILS` on Railway, restart.** Time it. Confirm they can log in
   and that a click actually succeeds rather than only the login.
3. **Let them install unaided, from the guide alone.** Do not narrate over their shoulder. The
   whole value is in where they stop, so watch and write, do not rescue until they are stuck.
4. **Deliver the operator key by the sealed-box path**, with the copy-out fallback held in reserve.
   Record which one ended up being used.
5. **Have them do one real piece of work** end to end — open a profile, check the IP, post, record
   it. The point is a completed unit of work, not a green checkmark on setup.
6. **Write down every place they hesitated**, including the ones they recovered from unaided. Those
   are the expensive ones: they cost nothing today and cost everything at ten operators.

## Success criteria

- A second `RelayDevice` row, active, with `relayVersion = 13` and a non-null `lastSeenAt` — which
  is C40 doing the job it was built for, on data that is not the owner's own machine.
- One unit of real work completed by someone who did not build the tool.
- A written list of friction points. **An empty list means the observation failed**, not that the
  onboarding is perfect.

## Risks

- **The observer effect is the main one.** An owner sitting beside a first-time user removes exactly
  the friction the exercise is meant to find. Decide in advance when to intervene.
- **The operator key is a real secret going onto a real second machine.** That is not a test
  artefact; it is a genuine expansion of where the vault key lives, and §11 of the team guide
  (rotate on departure) starts applying to that person from this day.
- One pilot is one data point. It finds blocking defects; it does not measure anything about scale.

## Unresolved questions

All three of the original questions were answered on 18 August 2026 — owner's secondary machine,
pure OPERATOR, and yes the server-side test comes first (done). What is left:

1. **A real second person, still.** This variant does not close C29's class, and nothing in this
   plan should be read as if it did. Keep the question standing until someone who did not build the
   tool has used it.
2. **The operator key goes onto a second real machine either way.** Even the owner's own second PC
   is a genuine expansion of where `VAULT_KEY_OPERATOR` lives, and §11 of the team guide starts
   applying to that machine from the day it is enrolled. Decide now whether it stays enrolled after
   the pilot or gets revoked and the key rotated.
3. **Nothing reads `relayVersion` yet.** C40 writes the column; no screen shows it. After the pilot
   there will be two rows worth looking at and still only a SQL client to look with.

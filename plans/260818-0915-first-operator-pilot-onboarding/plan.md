# Pilot — put the second operator on the tool and measure what breaks

**Status:** prep done, blocked on a person · **Created:** 18 August 2026

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
  `operator-key-grant-substitution`, `relay-paths-are-wired`). The **server action's happy path has
  one test and it is an edge case** (no grant restored after retirement starts). Nothing exercises
  the three parties together.
- A clean machine installing Relay 13 from `/relay-download` with no prior state.
- Whether `ALLOWED_EMAILS` + restart is genuinely all that stands between a new email and a working
  session.

## Steps

1. **Pick the person and the machine.** A real second operator on their own PC. Not the
   `mkt-windows-gate` VM — that VM is disposable, and enrolling it into production puts a throwaway
   machine in the production registry and a real `VAULT_KEY_OPERATOR` on it, which is what
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

1. **Who?** The pilot cannot start without a named second person. This is the only real blocker.
2. Does the second account need `ADMIN_EMAILS`, or is a pure OPERATOR the more honest test? A pure
   operator exercises the permission boundaries; an admin can rescue themselves and hides defects.
3. Should the sealed-box happy path get a server-side test **before** a person walks it, or is the
   pilot itself the acceptable first exercise of it?

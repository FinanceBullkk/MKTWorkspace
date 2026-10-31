# Windows release gates — runbook

Written 17 August 2026. The audit closed with three gates that code cannot close. They are not
"tests nobody got round to": two are blocked on equipment that does not exist yet, and one — gate 1,
Authenticode — turned out not to be pending at all. **Corrected the same evening:** the owner decided
on 12 August that v1 ships unsigned to the internal fleet (`development-roadmap.md:39`), so gate 1 is
out of scope for v1 rather than waiting on a purchase, and only its non-signature half is worth
running. **The real standing blocker is one clean Windows VM**, which unblocks gates 2 and 3 and half
of gate 1. This file exists so that whoever has the equipment can run them without re-deriving what
they were supposed to prove.

Each gate traces to a numbered hypothesis from the Windows-lifecycle phase. **Test the hypothesis as
written, not a paraphrase** — the paraphrases in circulation ("check the installer works") are looser
than the originals and would pass while the real defect stood.

The three gates span both repositories, which is why this runbook sits above both.

## Equipment

| Gate | Needs | Have it? |
| --- | --- | --- |
| 1 — Authenticode (H52) | An OV or EV code-signing certificate, plus `signtool.exe` from the Windows SDK | **Not for v1** — the owner decided on 12 August that v1 ships unsigned to the internal fleet, so this is out of scope rather than pending. Live again if distribution widens. Its non-signature half (binary writable by non-admins) can run on the gate 2/3 VM. |
| 2 — Power loss (H41, H42) | A Windows VM whose power can be cut from the host mid-write | **No.** Roughly half a day to set up. |
| 3 — Withdrawn installer (H54) | The same clean VM, plus one revoked/withdrawn version's installer kept deliberately | **No**, same VM. |

The development machine cannot substitute for the VM in gates 2 and 3. "On a clean machine" is the
property under test in gate 3, and hard-cutting power to the working box is not a test anyone should
run.

---

## Gate 1 — Authenticode survives resource editing (H52)

> **Not applicable to v1, and that is a decision rather than a delay** (noted 17 August 2026).
> `development-roadmap.md:39` records the owner's decision of 12 August: v1 ships **unsigned** for
> the internal fleet, with SmartScreen appearing once and the setup journey announcing it in advance.
> So there is nothing to buy and nothing to schedule here for v1. **The trigger that makes this gate
> live again is distribution widening beyond the internal fleet** — the moment the binary reaches
> anyone who is not an employee receiving it directly. The second claim below (the binary being
> writable by non-admins) is *not* signature-dependent and could be tested at any time on the clean
> VM built for gates 2 and 3; it is the half people forget, and it survives the v1 decision.

**Hypothesis, verbatim:** *`edit-windows-executable.cjs` / `rcedit` breaks a signature or leaves the
binary writable by non-admins.*

Two distinct claims. Test both; the second is the one people forget.

`rcedit` rewrites the PE resource section, which **invalidates any signature already present**. So
the only correct build order is *edit first, sign last*. The gate is really asking whether the
pipeline does that, and whether it stays that way.

### Procedure

1. Build the Windows installer through the normal pipeline, with signing enabled.
2. On the resulting binaries — installer, app executable, and any executable
   `MKTBrowser/apps/desktop/scripts/edit-windows-executable.cjs` touches:
   - `signtool verify /pa /v <file>` — must report a valid chain to a trusted root.
   - `Get-AuthenticodeSignature <file>` — `Status` must be `Valid`, and `SignerCertificate` must be
     the intended publisher.
3. **Order check.** Deliberately re-run the rcedit step *after* signing on a throwaway copy, then
   verify again. It must now fail. If it still reports valid, the verification is not looking at what
   you think it is, and gate 1 proves nothing until that is explained.
4. **ACL check**, the forgotten half. On the installed files:
   `icacls "<install path>\<file>"` — no entry granting write to `Users`, `Authenticated Users`,
   `Everyone`, or `INTERACTIVE`. Run it as a **non-admin** account and attempt an overwrite; it must
   be refused.
5. Install on the clean VM as a standard user and confirm the UAC prompt names the intended
   publisher rather than "Unknown".

### Evidence to keep

`signtool verify` output per file; the ACL listing; the failed non-admin overwrite; a photo or capture
of the UAC publisher line. Store with the release record.

### Pass criteria

Every edited binary carries a valid signature by the intended publisher, re-editing after signing
breaks verification (proving the check is real), and no shipped file is writable by a non-admin.

---

## Gate 2 — Power loss during an update (H41, H42)

**Hypotheses, verbatim:** *H41 — Power loss mid-transition leaves an engine pin pointing at a
partially-staged set; next start activates it.* *H42 — Marker written before artifacts are durable
(no fsync / no atomic rename), so a crash yields a marker for a set that does not exist.*

The failure being hunted is **not** "the update fails". A failed update is fine. The failure is an
update that reports success over a set that is incomplete or absent — the machine then starts
something half-written, or starts nothing and cannot explain why.

### Injection points

Cut power at each, separately, from a fresh snapshot each time:

1. During artifact download, before staging begins.
2. **Mid-write of a staged artifact** — the H42 point. Aim for the largest artifact so the window is
   widest.
3. After staging completes, immediately before the activation marker is written.
4. **Immediately after the marker is written, before the staged set is fsync'd** — the exact H42
   claim. If the code writes the marker first, this is where it shows.
5. During activation, between replacing the pin and the first start.

Use the VM's *reset/power-off*, never a guest shutdown — a graceful shutdown flushes buffers and
tests nothing.

### After each cut

Boot, then record:

- Does the app start at all?
- Is the active engine pin (`MKTTool/relay/src/active-engine-pin.ts`) pointing at a set that exists
  **in full**?
- Does an activation marker exist for a set that does not?  ← direct H42 hit
- Does a retry of the update succeed, or is the machine stuck with no recovery path?

### Pass criteria

After every cut the machine is in exactly one of two states: **fully on the old version**, or **fully
on the new one**. Never a mixture, and never a marker without its set. A stuck state that a retry
clears is acceptable **only if** the operator is told what to do; a stuck state with no message is a
failure of this gate even if no bytes are corrupt.

---

## Gate 3 — A withdrawn installer on a clean machine (H54)

> **Read this before building anything: as of 18 August 2026 nothing is actually withdrawn.**
> Checked rather than assumed, because the procedure below spends a clean VM on a version that has
> to be refused, and it would be spent for nothing.
>
> - `MIN_RELAY_VERSION = 1` (`src/lib/tickets/ticket-types.ts:38`), so **no Relay version is
>   globally refused**. A v9 Relay still gets credential and OTP tickets today.
> - `MIN_RELAY_VERSION_BY_KIND` (`:84`) is where refusals actually live: `LAUNCH_PROFILE` and
>   `CREATE_PROFILE` need **7**, `COMPATIBILITY_UPDATE` needs **12**.
> - Retained installers are v9–v12 in `MKTBrowser/apps/desktop/.relay-payload/`, so the artifacts
>   exist and the "keep one before it is gone" prerequisite below is already satisfied — that
>   deadline has passed safely.
>
> So the gate is runnable, but **only against the compatibility-update path**: v9, v10 or v11
> installed on the clean VM should be refused a `COMPATIBILITY_UPDATE`, and the refusal must name
> something the operator can act on. Anything broader has nothing to test, because nothing is
> revoked. The alternative is to withdraw a version for real first — raising `MIN_RELAY_VERSION` or
> publishing a manifest that revokes one — but that is a product decision, not test setup, and it
> should not be made just to give this gate something to chew on.

**Hypothesis, verbatim:** *`compatibility-installer-floor` can be satisfied by a downgraded
installer, enabling rollback to a revoked version.*

The floor lives in `MKTTool/src/lib/release/compatibility-manifest.ts`. The gate asks whether it can
be **satisfied from below** — whether an older, withdrawn installer presents something the floor
accepts, letting a machine land on a revoked version and stay there.

This needs a clean machine because an already-installed machine carries state that may mask the
answer.

> **Blocker found 18 August 2026, and it applies to gate 2 as well: both gates need a server to
> enrol against, and it must not be production.** Gate 2 needs a compatibility update actually in
> flight, which needs a `COMPATIBILITY_UPDATE` ticket, which needs an enrolled device. Gate 3's
> procedure below reaches the same wall at step 3. Enrolling the throwaway VM against production
> would put a disposable machine into the production device registry and paste a real
> `VAULT_KEY_OPERATOR` into it — the exact thing `create-windows-gate-vm.ps1` tells you not to do.
>
> **The way through is a local server, not a production enrolment.** The Relay bakes its web origin
> at build time, so a Relay built with `--web-origin=http://<host-lan-ip>:3000` against a dev server
> and a scratch database gives both gates everything they need with no production exposure. That is
> the missing setup, and it is the real remaining cost of these two gates — not the gates
> themselves.
>
> **One property of gate 3 has already been established without any of that.** A retained v12
> binary was driven to *ready* and handed a ticket carrying floor 13; it refused, naming both
> versions. See `scripts/probe-old-relay-refuses-the-floor.ts` and register row C41. That settles
> the *refusal is actionable* half. It does **not** settle H54 as worded — whether the installer
> floor can be satisfied from below on a clean machine is a different claim, and it still needs the
> VM and an install.

### Procedure

1. Keep one installer of a version that has since been withdrawn or revoked. Preserving it is a
   prerequisite; once it is gone this gate can never run. **Do this before the next release, not
   when the gate is scheduled.**
2. On a clean VM, install the withdrawn version.
3. Attempt to enrol and run normally.
4. Record where it is refused, and by what:
   - the installer itself,
   - the compatibility manifest / installer floor,
   - the server at enrolment,
   - or **nothing at all** — the finding.
5. Repeat with the current version as a control, so a refusal cannot be confused with an unrelated
   breakage on a clean machine.

### Pass criteria

The withdrawn version is refused, and the refusal names a reason an operator can act on. The control
install succeeds. **Refusal by accident — a version-string comparison that would pass if the number
were different — does not count**; the refusal must come from the floor or the revocation, and you
must be able to say which.

---

## What none of these gates cover

The two-account Windows exercise was **waived** by the owner as an unsupported topology (one Windows
user per PC). A waiver is not a pass, and this runbook does not turn it into one. If the product ever
supports two accounts on one PC, that exercise returns as a fourth gate.

## Until they run

The roadmap's wording stands and must not be softened: these gates are unrun, and code cannot close
them. Anything claiming verified installer integrity or verified update durability before gate 1 and
gate 2 pass is a claim the audit does not support.

# Defender Quarantined the Installer: Diagnosis and Partial Remediation — 24 August 2026

## Verdict

- The detection is **behavioural, not a hash match**, and the signature name is the diagnosis:
  `PShellCobStager` = PowerShell **CO**M **B**stager.
- The installer matched **four** parts of that shape. **One removed** (`8595027`), three remain.
- **Gate not closed.** Removing the named trigger is not proof the engine is satisfied. A clean-VM
  install decides.
- A **fail-open defect in the uninstall check** was found and fixed during verification. That is the
  more valuable finding of the two.

## The shape Defender matched

| Part | Where | Status |
|---|---|---|
| Unsigned exe drops `.ps1` to a temp dir, runs `-ExecutionPolicy Bypass` | 5 scripts staged to `$PLUGINSDIR` | Unchanged |
| Elevation via `runas` into one of them | `customInstall`, `customUnInstall` | Unchanged — required for machine-wide rules |
| `New-Object -ComObject HNetCfg.FwPolicy2` mutating the firewall | `windows-webrtc-firewall.ps1` ×4 | **Removed** |
| Startup-shortcut persistence | `$SMSTARTUP` | Unchanged — required |

Each of these is, on its own, ordinary installer work. Together they are the malware playbook, and a
behavioural engine does not need a hash to say so. Being unsigned removes the one thing that would
otherwise buy tolerance.

## What was changed, and why this one

Only the **reads** used COM. Every **write** already used the NetSecurity cmdlets. So the COM object
bought nothing and cost the product its ability to install — the cheapest possible trade.

`Assert-Rule`, `Assert-FirewallProfiles`, `Owned-Rules` and `VerifyAbsent` now read through
`Get-NetFirewallRule`, `Get-NetFirewallApplicationFilter`, `Get-NetFirewallPortFilter`,
`Get-NetFirewallProfile`.

Semantics preserved deliberately:

| COM | Replacement | Note |
|---|---|---|
| `$rule.Protocol -ne 17` | `"$($port.Protocol)" -ne "UDP"` | Compared as documented names, not ordinals |
| `$rule.Direction -ne 2` / `Action -ne 0` | `-ne "Outbound"` / `-ne "Block"` | ditto |
| `($rule.Profiles -band 7) -ne 7` | `"Any"`, else all of Domain/Private/Public named | ditto |
| `$rule.RemotePorts -eq "*"` | `"Any"` or `"*"` | Cmdlets say "Any" where COM said "*" |
| blank `ApplicationName` | blank **or `"Any"`** | "Any" means bound to no program; must fail closed |

## Measured against the real firewall

| Mode | Result | Expected |
|---|---|---|
| `CheckProfiles` | 0 | ✅ |
| `Verify` | 0 | ✅ the full `Assert-Rule` path |
| `CheckOwner` | 0 | ✅ |
| `VerifyAbsent` | 16 | ✅ correct — rules are installed on this machine |
| Foreign CFT root | 17 | ✅ fails closed |
| Malformed path | 10 | ✅ fails closed |

## The fail-open defect

The first rewrite put the lookup behind a helper:

```powershell
function Find-Rules([hashtable]$Query) { return @(Get-NetFirewallRule @Query -EA SilentlyContinue) }
```

**PowerShell unrolls an array on return from a function.** A single match arrives at the caller as a
bare object whose `.Count` is `$null`. Consequences:

| Check | Evaluates | Result |
|---|---|---|
| `$rules.Count -ne 1` | `$null -ne 1` → **true** | `Verify` wrongly reports `rule-count` — this is how it was caught |
| `(...).Count -ne 0` | `$null -ne 0` → **false** | `VerifyAbsent` would report a **still-present rule as removed** |

The second is fail-open in an uninstall verification: the containment rule survives while the
product reports it gone. The original code was not vulnerable because it applied `@()` inline at the
assignment. Lookups are now inline, with the reasoning written into the script so it is not
refactored back into a helper.

Caught only because `Verify` returned 11 on a machine that visibly had two correct rules, and
"the machine must be in an odd state" was not accepted as the explanation.

## Left in place, with reasons

Two `WScript.Shell` uses read `.lnk` targets — in the conflict detector and the Relay cleanup. There
is no cmdlet equivalent; the alternatives are hand-parsing the shell link binary format or matching
shortcuts by name. Both are worse inside a fail-closed ownership check than the detection risk they
would remove. If a clean-VM install still trips, these are the next candidates.

The dropped-script/elevation/persistence shape is unchanged. It could be reduced — run the scripts
from `$INSTDIR` after payload copy, or use `-ExecutionPolicy RemoteSigned` — but neither is
verifiable without a clean VM, and the pre-install conflict check must run from a temp dir anyway.
Guessing here spends an expensive test cycle to learn nothing.

## Next

1. Rebuild **once** from a frozen tree carrying both this and the licence-seat work. The attested
   candidate `cce7b897` trails six Browser fixes.
2. Clean-VM install **before** any further shape change. A detection that persists with COM gone
   isolates the cause to the stager shape — evidence worth more than another guess.
3. Signing remains the real fix and remains an owner decision. The 22 August "unsigned for V1" call
   now has a measured cost rather than an assumed one.

## Unresolved

1. Is the COM removal sufficient? Unknown until a clean VM says so. Do not record this as closed.
2. Does `-ExecutionPolicy RemoteSigned` work for NSIS-written `$PLUGINSDIR` scripts, or do they
   carry Mark-of-the-Web and get blocked? Untested; would fail the install if wrong.
3. Was the earlier install-time detection triggered by the elevated firewall script specifically, or
   by an earlier unelevated one? The 24 August evidence records two detections but not which stage.
   Worth capturing precisely on the next run, since it decides which script to change next.

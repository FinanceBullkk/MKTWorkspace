# Browser 0.3.19 — local gate, two-build and publication

Date: 2026-09-11. **Acceptance OPEN.** No clean-VM run. Not promoted to operators.

Replaces 0.3.18, which was published before the WOW64 uninstall defect (MKTBrowser#21) was found.
0.3.18 stays in the bucket under its own immutable key; it was never promoted, because the
deployment has never carried an approved release tuple.

## Frozen source

| Repo | Commit | Tree |
|---|---|---|
| MKTBrowser | `46698de22ea15d1fac7cb9e1bf085c4f33204342` (merge PR #22) | `033bb4b3b9d6fd63720ef61492475df185f995a8` |
| MKTTool | `69e356b424eb` (merge PR #79) | `53fdf540b12a` |

Runner recorded identical `before`/`after` snapshots across all seven commands.

## Candidate tuple

```
id             20260911-browser-0.3.19-relay-17-uninstall-host-bitness-cft
browserVersion 0.3.19
relayVersion   17   (unchanged, sha256 d8bf25dc…6359cf, 34289393 bytes)
engine         cft / chrome-for-testing 152.0.7977.64
```

## Local quality receipt

`D:\mkt-release-evidence\quality-260911-0319\quality-receipt.json`, runId `f19f2836`,
06:21:19Z → 06:26:17Z, status `completed`, failure `none`. All seven commands exit 0:
`verify:node`, `audit:production`, `test:installer`, `test:critical-coverage`, `typecheck`,
`lint`, `build`.

`test:installer`: **497 tests, 496 pass, 0 fail, 1 skipped** — six more than 0.3.18, which is
`windows-relay-cleanup.test.cjs` from #21 now running in the gate.

**Skip adjudicated:** the opt-in `explicit machine integration gate`, requiring
`MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION=1`. Unobserved evidence, not a pass.

## Two-build equivalence

Clean detached worktrees at the frozen commits, independent `yarn install` each:
`D:\mkt-build\b`, `D:\mkt-build\c`, plus `D:\mkt-build\MKTTool` @ `69e356b` as the frozen sibling.

```
normalized payload manifest: 129 files
sha256 5d3cd757e483bd8edaca7352e68a77d47b03a3bf49ce723ac01de0afd87ae703
compare: identical, exit 0
```

`app.asar` (`8fed20cd…5773c3`), the pinned Relay zip and `windows-control-contract.json` are
byte-identical between builds. The NSIS wrapper differs, as for every prior candidate.

## Retained exact installer

```
D:\mkt-release-evidence\candidate-0.3.19\
  MKTBrowser-20260911-browser-0.3.19-relay-17-uninstall-host-bitness-cft.exe
size   146050951
sha256 3346143bf52971a552bee4acdd12b2d4439c294b4a5801c9d54743d9595f3a54
```

From build `b`. Must not be rebuilt between acceptance and publication.

## Signed compatibility manifest

Sequence 23, pilot channel, 3415 bytes, sha256
`3c4dd8178b9fc415bd704e81f20f98ca9978bfc9351d67ddd6266f920aa59bd3`, signed 06:42:00Z with
delegated key `6e5d47d8…786e`.

`transition` is `fromSequences [0]`, `retainedSequence null` — fresh activation from 0 only, no
migration from an existing nonzero sequence, matching the documented precedent and forced by the
validator.

## Publication

Bucket `mkttool-relay-release`, key
`MKTBrowser-20260911-browser-0.3.19-relay-17-uninstall-host-bitness-cft.exe`.

The upload needed three attempts. The R2 endpoint was unstable from this host:

1. `headObject` precheck timed out — nothing written.
2. `putObject` failed mid-upload — **no partial object landed**, confirmed by probing the key
   afterwards. Fail-closed behaved correctly.
3. Upload succeeded, then the publisher's own post-upload verification failed on a timeout, so
   **the publisher never completed its read-back**.

Read-back was therefore done separately, and a plain full GET failed five times: a 139 MB body has
to sustain about 1.2 MB/s to fit the client's 120 s timeout. Reading the object as a sequence of
8 MB ranged GETs with per-chunk retries completed it:

```
HEAD size  146050951
GET  size  146050951
GET  sha256 3346143bf52971a552bee4acdd12b2d4439c294b4a5801c9d54743d9595f3a54
```

Every byte was fetched and hashed in order, and the digest matches both the recorded metadata and
the retained local installer. Stored metadata carries the frozen source commit and tree, the
payload manifest digest, file count 129, relay 17 and the CFT engine tuple.

## Operator promotion — prepared, not applied

The application reader reports the object `available` but `metadataComplete: false` with
`missing-approved-release-tuple`. Operator availability needs
`MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` on the Railway deployment. The exact value is saved at
`D:\mkt-release-evidence\candidate-0.3.19\approved-release-tuple.json`.

It has **not** been set. Per policy that binding is operator promotion and follows authenticated
candidate-only testing, which has not happened for this candidate.

## OPEN — not done, not waived

- Clean-VM acceptance on a restored Defender-enabled snapshot: first run, signed CFT activation,
  packaged Relay lifecycle, proxy failure/recovery, repair, uninstall, cleanup.
- The compatibility manifest for sequence 23 has not been published to the update channel, so
  signed CFT activation cannot be exercised.
- Browser-page network, unfamiliar-operator, second-PC and seven-day canary evidence.
- The opt-in machine integration gate.

The host acceptance run recorded for 0.3.18 does not carry over: it tested different bytes, and it
was never a clean-VM gate.

## Unresolved questions

1. Should the R2 client's 120 s `getObject` timeout become range-aware for large artifacts, so the
   publisher's own read-back does not depend on sustained throughput? Today a slow link makes a
   correct publication look like a failed one.
2. Is `MKTTOOL_RELEASE_TOKEN` meant to exist on this host? Its absence still forces the
   local-archive path for the pinned Relay during builds.
3. Does the operator approval tuple get set before or after clean-VM acceptance?

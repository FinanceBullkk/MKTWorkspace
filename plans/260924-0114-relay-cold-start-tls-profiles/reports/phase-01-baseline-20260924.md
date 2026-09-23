# Phase 1 baseline record - 24 September 2026

## Scope and preservation

- This is a read-only baseline record. It does not replace the historical receipts or make a new
  candidate acceptance claim.
- The pre-existing workspace-root documentation, plans, reports, and logs remain outside this
  plan's scope and were not changed.
- The source baseline before implementation work was MKTTool `43b12a76b37d932b4e3ceb330e2897e4421b3b73`
  and MKTBrowser `81f3014821c471b583a37fae0dd001d0e10f59ce`.

## Historical bytes and receipts

| Item | SHA-256 | Result |
| --- | --- | --- |
| Relay 18 executable | `c47ea5f44b61365ea4509e5254fa6fba73a2559414b20d8bba8ce7b1869f267e` | PASS: rehashed from `MKTTool/relay/dist/MKTTool-Relay.exe` |
| Cold-health failure receipt | `d85e364284e6b49d4e9c1cb5e98fbc4bf646b34b5a3c7814dd349ad7dd60bfe3` | PASS: sidecar matches |
| Compatibility TLS failure receipt | `6c877745f1e8139394eb833fe9961bfb6550c9c828621e7fa4078d8b4e9a4bf3` | PASS: sidecar matches |
| Profiles probe receipt | `fc0077acb65959528688a7d9bfbc9f092c5c4133a8ac375e994ee4b379f28544` | PASS: sidecar matches |

## Host state at inspection

- All registered VirtualBox VMs were powered off. No listener was present on ports 3000, 3100,
  3210, 3211, or 9222.
- Free physical memory was 7,168 MiB. This is sufficient for focused source tests, but heavy
  builds remain separated from VM execution under the release gate.
- Current host toolchain: Node `v24.21.0`, npm `11.19.0`, Yarn `4.5.0` after Corepack selection.
  `package-lock.json` SHA-256 is `64b36c2eb5044d216e57bd59db4551bd4821af4da369c5e6ed4bf847973f9ab3` and
  `yarn.lock` SHA-256 is `6dd698a892036b4c910fac19e28d4eb31769d897a81cd046b941fd5c8fa7d1f6`.

## Baseline result

- Focused Relay regression baseline: PASS, 55/55 tests. See
  `../baseline-focused-relay-tests.log`.
- Cold timing, original profile branch, and exact packaged TLS cause remain OPEN. Historical
  receipt verification does not reproduce or explain them.

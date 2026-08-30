# P3-06 CI reproducibility contract

Date: 2026-08-30 (Asia/Saigon)
Status: **WIRED; source/local comparison PASS; remote candidate evidence OPEN**

## Change

`MKTBrowser/.github/workflows/release-candidate.yml` now:

- pins the Node 22 executable in every Windows release-candidate job before any Node/Corepack call;
- keeps the two independent build attempts (`a` and `b`) and emits one normalized payload manifest
  per attempt;
- always runs the Linux comparison job, including when the build matrix fails or is skipped, so a
  missing manifest produces a required `FAIL` result instead of a hidden skipped job;
- writes `payload-reproducibility-result.json` and the comparison log, and uploads both manifests and
  result evidence as `payload-reproducibility-evidence`;
- records the outer-installer result separately as optional `OPEN` with the measured residual. The
  outer NSIS bytes are not normalized and do not get rounded up to a pass.

The static release-contract test asserts that the workflow retains the `a`/`b` matrix, compare
command, required gate, result artifact, and the 103-byte classification.

## Recorded release-manifest disposition

`plans/260829-2125-internal-product-readiness/reports/release-manifest.json` now contains:

```json
{
  "installerReproducibility": "OPEN",
  "installerReproducibilityEvidence": {
    "residualBytes": 103,
    "classification": "NSIS-RT_DIALOG-order-and-trailer",
    "normalized": false
  }
}
```

The existing build evidence is aligned to `OPEN_DOCUMENTED_103_BYTES`; the prior 78-byte
source-drift figure is not used.

## Local validation

Commands run from `E:\\MKTWorkspace\\MKTBrowser`:

```powershell
node --test scripts/release-candidate-contract.test.cjs scripts/normalized-payload-manifest.test.cjs
node scripts/normalized-payload-manifest.cjs --compare `
  ..\\local-test-artifacts\\u3-20260830\\analysis\\payload-manifest-a.json `
  ..\\local-test-artifacts\\u3-20260830\\analysis\\payload-manifest-b.json
```

Expected/observed outcome: contract tests pass; the preserved U3 manifests compare equal (130/128
entries depending on the captured pair) and no payload difference is hidden. The second command is
only a local replay of retained evidence; it is not a GitHub runner result.

`git diff --check` passes for the changed files. The source-level P3-06 contract is closed, and the
retained local pair comparison is PASS. A real release-candidate dispatch would add remote artifact
evidence, but it cannot be run honestly in this window because the Browser Stable `.2` archive is
absent and the required private MKTTool sibling checkout has no workflow read credential. No tuple
was fabricated or signed.

### Unresolved questions

- A release-engineering operator must dispatch the manual workflow on a valid pinned candidate and
  retain the uploaded `payload-reproducibility-evidence` artifact once the source/archive and
  sibling-repository access gates are available.
- The 103-byte `NSIS-RT_DIALOG-order-and-trailer` variance remains OPEN pending a supported
  deterministic NSIS/electron-builder source fix.

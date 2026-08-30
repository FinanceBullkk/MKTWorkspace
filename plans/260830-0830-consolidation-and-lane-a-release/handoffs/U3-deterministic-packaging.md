# Handoff U3 — deterministic packaging

Date: 2026-08-30 (Asia/Saigon) | Phase: 3 | Status: **OPEN**

## Outcome

- Frozen detached source: MKTBrowser `a8d6d89b72942856900d536f298ebdd121e54003` in
  `E:\MKTWorkspace\_u3-a` and `E:\MKTWorkspace\_u3-b`.
- Clean-HEAD packaging correctly failed before artifact creation because the version-coherence test
  needs `MKT_BROWSER_MCP_PROTOCOL_VERSION`. A documented, one-file disposable overlay copied
  `packages/types/src/index.ts` (17,862 bytes, SHA-256
  `8ea21a4697f204f4d20927bef308da79c591a216d746b9f73672944ba6fd34dc`) from the protected main
  path into both worktrees. Main was never modified by U3.
- Baseline captures: 145,057,308 bytes / SHA `1a6224a7605b67aca2feb6901346a165b48c4336798f67c0ad8aefa94d971728`
  and 145,057,411 bytes / SHA
  `ee3c53823a4a2a78ab175bbc3f6d7191064f819ec3bf1b7b78ca75eab29251ef`.
- Embedded payloads and 7z archive are byte-identical. Normalized payload manifest: 128 files,
  SHA-256 `dd4d2d3718c6aea0c33b819b65eb13478bab431016fa0a658e92d3fbf5850f53`.
- Baseline full-installer residual is 103 bytes (not the historical 78-byte candidate number). The
  first difference is offset 36,220 in the outer NSIS PE. PE timestamps/checksums/security table
  are equal/empty. Sixteen RT_DIALOG (`id:5`) resources are path-permuted (their size/hash
  multiset is equal; 203↔403 and 303↔503 groups swap), with CJK font strings rotating. Tail bytes
  after the 7z archive also vary. This is classified `NSIS-RT_DIALOG-order-and-trailer`, not app
  payload drift; exact vendor ordering source remains unproven.
- `SOURCE_DATE_EPOCH=1788054993` did not remove the residual (pair size delta −74). Disposable
  `compression: store` also did not remove the RT_DIALOG permutation (pair 146,089,836 bytes each,
  different hashes). No normalizer or product fix was added.
- One-byte disposable `app.asar` mutation (offset 1,269,446, `0x6f→0x6e`) made normalized
  comparison exit 1 with exactly `resources/app.asar`; normalizer honesty PASS.

## Evidence

Detailed report: `E:\MKTWorkspace\plans\260830-0830-consolidation-and-lane-a-release\reports\u3-packaging-experiment.md`.

Machine evidence directory:
`E:\MKTWorkspace\local-test-artifacts\u3-20260830\` (run captures, package logs/results,
manifests, 7-Zip metadata, PE/resource comparison JSON, resource permutation/font summaries, and
normalizer mutation record).

Key files:

- `analysis\compare-baseline.json`, `compare-sde.json`, `compare-store.json`
- `analysis\pe-resources-a-b.json`, `pe-resources-sde-a-b.json`, `resource-path-mapping.txt`,
  `dialog-font-summary.txt`, `resource-multiset.txt`
- `analysis\payload-manifest-a.json`, `payload-manifest-b.json`, `payload-manifest-sde-*.json`,
  `payload-manifest-store-*.json`
- `analysis\honesty-mutation.json`, `honesty-compare.txt`

## Next action / gate

Keep `installerReproducibility: OPEN`. Do not normalize absolute offsets or promote the installer.
An owner-approved follow-up must identify and pin NSIS/electron-builder resource enumeration (or
prove a structural content-aware exception), then capture two fresh installers and rerun the same
comparison. Preserve all run directories and the detached worktrees until that review is complete;
do not commit experimental overlays or outputs.

## Unresolved questions

- Which supported NSIS/electron-builder input controls the RT_DIALOG resource permutation?
- Can the vendor toolchain make that ordering deterministic without changing installer semantics?

# U3 deterministic packaging experiment

Date: 2026-08-30 (Asia/Saigon)
Status: **OPEN** (payload reproducibility PASS; full installer reproducibility unresolved)
Source under test: MKTBrowser `a8d6d89b72942856900d536f298ebdd121e54003` (detached worktrees only)

## Scope and safety boundary

All builds ran in `E:\MKTWorkspace\_u3-a` and `E:\MKTWorkspace\_u3-b`, both detached at the
frozen U1 commit. The main checkout was not used as a build directory and no installer was copied
over the main candidate. No signing, install, publish, deploy, commit, or user-data deletion was
performed by U3 outside the package pipeline; every retained EXE is unsigned (`NotSigned`). The main checkout advanced independently to `5ef710dd` during this experiment; that
change was not made by U3.

The clean checkout failed its pre-package contract before producing an installer: `test:installer`
subtest 23 required `MKT_BROWSER_MCP_PROTOCOL_VERSION`, which is absent at clean `a8d6d89`.
That run is retained at `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a` (exit 1,
30,068 ms; no EXE). The failure justified one controlled disposable overlay in each worktree:

| overlay source | source/destination size | SHA-256 |
|---|---:|---|
| `E:\MKTWorkspace\MKTBrowser\packages\types\src\index.ts` → `E:\MKTWorkspace\_u3-a\packages\types\src\index.ts` | 17,862 bytes | `8ea21a4697f204f4d20927bef308da79c591a216d746b9f73672944ba6fd34dc` |
| same source → `E:\MKTWorkspace\_u3-b\packages\types\src\index.ts` | 17,862 bytes | `8ea21a4697f204f4d20927bef308da79c591a216d746b9f73672944ba6fd34dc` |

The provenance records are `run-a\protected-types-overlay.json` and
`run-b\protected-types-overlay.json`. The other two formerly protected files were not required by
the failing contract and stayed at the frozen commit. Both disposable worktrees ended with only
the intentional `packages/types/src/index.ts` modification; no experimental config change remains.

Detached checkout commands (run once, before install) were:

```powershell
git -C E:\MKTWorkspace\MKTBrowser worktree add --detach E:\MKTWorkspace\_u3-a a8d6d89b72942856900d536f298ebdd121e54003
git -C E:\MKTWorkspace\MKTBrowser worktree add --detach E:\MKTWorkspace\_u3-b a8d6d89b72942856900d536f298ebdd121e54003
```

## Toolchain and immutable Relay fixture

Portable toolchain checks were run from each worktree:

```powershell
Set-Location E:\MKTWorkspace\_u3-a   # repeated for _u3-b
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe -v
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node_modules\corepack\dist\corepack.js yarn --version
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node_modules\corepack\dist\corepack.js yarn install --immutable
```

Results: Node `v22.23.2`, Yarn `4.5.0`; immutable installs exited 0 in 56,781 ms (`_u3-a`) and
52,477 ms (`_u3-b`). The Relay input was copied once to
`E:\MKTWorkspace\local-test-artifacts\u3-20260830\relay-v16\MKTTool-Relay-v16.zip` and then
used read-only: 33,342,752 bytes, SHA-256
`5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.

Both worktrees used the same checked-in `apps\desktop\windows-engine-release.json` (329 bytes,
file SHA-256 `2463102a6fadebdbcce750dfa037b51f27875bff2076f383ad1180b15be0b6ad`; declared
CloakBrowser `151.0.7922.108.2`, engine digest
`7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561`).

The fixture was verified with:

```powershell
Copy-Item -LiteralPath E:\MKTWorkspace\MKTBrowser\apps\desktop\.relay-payload\MKTTool-Relay-v16.zip -Destination E:\MKTWorkspace\local-test-artifacts\u3-20260830\relay-v16\MKTTool-Relay-v16.zip
Get-FileHash -Algorithm SHA256 -LiteralPath E:\MKTWorkspace\local-test-artifacts\u3-20260830\relay-v16\MKTTool-Relay-v16.zip
```

The packaging command (the wrapper sets `COREPACK_HOME`, `MKTTOOL_RELAY_ARCHIVE`,
`MKT_BROWSER_ENGINE_RELEASE_FILE`, clears `ELECTRON_RUN_AS_NODE`, and captures the EXE as the
first post-build filesystem operation) was:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-packaging.ps1 `
  -Worktree E:\MKTWorkspace\_u3-a `
  -RunDirectory E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-2 `
  -RunName baseline-a-overlay
```

The same command was repeated for `_u3-b` and each controlled variant, with a unique run directory.

## Build matrix and artifact hashes

| pair/variant | run | elapsed | captured installer (size; SHA-256) |
|---|---|---:|---|
| baseline | `run-a-2` | 117,671 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-2\captured\MKTBrowser-win-x64.exe` (145,057,308; `1a6224a7605b67aca2feb6901346a165b48c4336798f67c0ad8aefa94d971728`) |
| baseline | `run-b-2` | 117,794 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-b-2\captured\MKTBrowser-win-x64.exe` (145,057,411; `ee3c53823a4a2a78ab175bbc3f6d7191064f819ec3bf1b7b78ca75eab29251ef`) |
| `SOURCE_DATE_EPOCH=1788054993` (frozen commit time) | `run-a-sde-2` | 96,098 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-sde-2\captured\MKTBrowser-win-x64.exe` (145,057,415; `b72aaf269673f0977a17300aecd836c636057674fb07e5d72a04fd25478b25ba`) |
| same epoch | `run-b-sde-2` | 121,055 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-b-sde-2\captured\MKTBrowser-win-x64.exe` (145,057,341; `d7677338a1569d95c5338d9a166accc7dba82dd690a5695f3e136cae5f7d63b2`) |
| disposable `compression: store` | `run-a-store` | 133,233 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-store\captured\MKTBrowser-win-x64.exe` (146,089,836; `2cb0a8d8f869c99d1c650f9eb52f49fcef586abb0d4245ca34f9e03ab95b91d8`) |
| same compression | `run-b-store` | 113,187 ms | `E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-b-store\captured\MKTBrowser-win-x64.exe` (146,089,836; `ac83216d461e8616ce409c46a93a9c5753bbffc1664cc3b096fc4d789ba40a1c8`) |

`run-a-sde` (423 ms, exit 1) is a retained wrapper setup retry from before the helper began
entering the worktree; it produced no EXE and is excluded from the build-pair metrics.

All six successful builds passed the local packaging quality gates (34 packaging tests plus one
explicit machine-integration skip; the ordinary suite reported no failures). Although the
electron-builder log contains its generic signtool step, every retained capture is
`Get-AuthenticodeSignature = NotSigned`; the outer PE security directory is RVA 0, size 0, and U3
performed no separate signing or credential action.

## Payload result

The normalized manifest command was:

```powershell
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe `
  E:\MKTWorkspace\_u3-a\scripts\normalized-payload-manifest.cjs `
  --compare <manifest-a.json> <manifest-b.json>
```

Baseline, frozen-epoch, and `compression: store` pairs all compare equal: **128 files**,
manifest SHA-256 `dd4d2d3718c6aea0c33b819b65eb13478bab431016fa0a658e92d3fbf5850f53`.
The following payload members are byte-identical in every pair:

- `resources/app.asar`: 51,723,318 bytes, SHA-256 `9df1ffa7c5c41cefde9e99788c7a381b3aa10a95e3f33c10d8c9e80985d583f0`.
- `MKTBrowser.exe`: 221,933,568 bytes, SHA-256 `597b2b51506e7540fb3d3dfb6663cd168565d477666947bfa2f3ee1fbb4702f6`.
- `resources/relay/MKTTool-Relay.zip`: 33,342,752 bytes, SHA-256 `5c98cf460e62f83b484c9ecd55bc80b650f2e19a09e8ded6e99eafb682e1842e`.

The normalized manifest files are under
`E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\payload-manifest-*.json`.

## Baseline byte diff and structural classification

Evidence is in `analysis\compare-baseline.json`, `analysis\7za-a.txt`, `analysis\7za-b.txt`,
`analysis\pe-resources-a-b.json`, `analysis\resource-path-mapping.txt`, and
`analysis\dialog-font-summary.txt`.

The byte/PE comparison command was:

```powershell
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe `
  E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\compare-installers.cjs `
  --a E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-2\captured\MKTBrowser-win-x64.exe `
  --b E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-b-2\captured\MKTBrowser-win-x64.exe `
  --out E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\compare-baseline.json
```

7-Zip structure was captured with:

```powershell
& C:\Users\anhha\AppData\Local\electron-builder\Cache\7zip@1.0.0\7zip-win-x64-a34pt\bin\7za.exe l -slt E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-a-2\captured\MKTBrowser-win-x64.exe
& C:\Users\anhha\AppData\Local\electron-builder\Cache\7zip@1.0.0\7zip-win-x64-a34pt\bin\7za.exe l -slt E:\MKTWorkspace\local-test-artifacts\u3-20260830\run-b-2\captured\MKTBrowser-win-x64.exe
```

### Outer PE/NSIS prefix

Both files are the same 32-bit NSIS PE stub (`e_lfanew=216`, machine `0x014c`, five sections).
Section headers and `.text`, `.rdata`, `.data`, and `.ndata` bytes are identical. The `.rsrc` raw
range is file offsets 34,816–165,375 (130,560 bytes).

- First full-file mismatch: offset **36,220**.
- Prefix before the embedded 7z marker: A 292,481 bytes; B 292,493 bytes.
- Prefix common suffix: 77,004 bytes.
- Differing prefix core: A `[36,220,215,477)` (179,257 bytes), B `[36,220,215,489)` (179,269 bytes).
- Surrounding bytes at the first mismatch (A/B):
  `ee0000000000000000000000188d2500180100000000000000000000308e2500fa` /
  `ee0000000000000000000000188d25000c0100000000000000000000288e2500ee`.
- COFF timestamps are equal (`1544912774`), checksums are both zero, and the Authenticode table is
  empty. This is not a timestamp or signature-slot delta.

Resource walking finds 34 leaves on each side. `id:14`, `id:16`, `id:24`, and all seven `id:3`
icon leaves are identical. The only changed paths are 16 `RT_DIALOG` leaves under `id:5`; their
content **multiset is identical** (24 leaves, sorted size/hash digest
`d9f0718f0bde2a25bd415a34ef4f9b6a09a5692f6e31e91d1e0ccabca307a485`) but the resource IDs are
permuted. For example, `id:5/id:203/id:1033` maps to `id:5/id:403/id:1033`, and the 303/503
groups swap as well. The decoded dialog fonts rotate between `ＭＳ Ｐゴシック`, `宋体`, `新細明體`,
and `굴림`. This is an observed **NSIS resource ordering/locale-font substitution** effect, not
application payload drift. Direct `.rsrc` comparison reports 2,792 differing bytes in 1,198
contiguous regions because the resource directory/data offsets follow that permutation.

### Embedded archive

7-Zip 24.09 reports for both baseline installers:

```text
Type = 7z; WARNINGS: There are data after the end of archive
Physical Size = 144260467; Headers Size = 2439; Method = LZMA2:20 BCJ
Solid = -; Blocks = 128
```

The archive starts at 292,481 (A) / 292,493 (B), and the 144,260,467-byte archive segments are
byte-identical, SHA-256 `3dcba19fd10b3fb761405b15320b85123efca9de5381c3814a080252f772797c`.
There is therefore no payload file-order or archive-compression variance in the baseline pair.

### Appended NSIS trailer

The bytes after the archive are non-7z NSIS trailer data. Baseline tail starts are absolute offsets
144,552,948 (A) and 144,552,960 (B); tail lengths are 504,360 and 504,451. The first same-index
tail mismatch is relative offset 242,386 (absolute A/B 144,795,334 / 144,795,346); surrounding
bytes contain `...cbff07` versus `...cbff07a9...` (`A=0x4e`, `B=0xa9` at the differing byte). The
first 242,386 bytes and the next 22,160-byte run are equal; aligned comparison then reports
238,836 differing bytes across 962 regions. This is generated NSIS trailer data coupled to the
stub/resource build, not the embedded application archive. Its exact generation seed/source is
not proven, so it remains an OPEN residual rather than a normalization candidate.

## Controlled-variable results

1. `SOURCE_DATE_EPOCH=1788054993` (the frozen commit timestamp) was set only for the SDE pair.
   Outer PE timestamps were already equal and the pair still differed by 74 bytes in size; the 7z
   archive and normalized payload stayed identical. Timestamp freezing did not move the residual.
2. `compression: store` was added to both disposable `electron-builder-installer.yml` files,
   rebuilt, and removed/restored exactly afterward. The pair remained non-identical (same 146,089,836
   bytes, different SHA-256); the embedded 7z segment was still the same 144,260,467-byte archive.
   The larger prefix/tail is expected from the compression setting, but the same RT_DIALOG resource
   permutation remained. No product config was changed or committed.
3. Ordering was not normalized. Byte-identical archive segments plus equal sorted manifests show no
   application file-order drift; the remaining order change is inside NSIS RT_DIALOG resource IDs.
   No safe structural rewrite of that vendor-generated resource table was proven.

## Historical 78-byte candidate delta

The prior candidate remains readable at
`E:\MKTWorkspace\MKTBrowser\apps\desktop\release\installer\MKTBrowser-win-x64.exe` (145,140,593
bytes, SHA-256 `e5623b8a5275ca2ca917caebc9b4baa9640379747da8c9d5ba0fccbe256876cc`). Its `app.asar`
is 51,723,396 bytes, SHA-256
`579b634d29ff0ddfff74cafcf37a79f2cd1b3646ecb3f56642888bc56458e063`, 78 bytes larger than the
controlled overlay payload. ASAR headers and 4,901 entries match; exactly two source files differ:

- `out/main/index.js`: 410,400 → 410,485 bytes (+85).
- `out/renderer/index.html`: 1,340 → 1,333 bytes (−7).

Thus the 78-byte payload delta is accounted for as source/tree state from the historical dirty
candidate, while the clean-overlay pair exposes a separate 103-byte NSIS-wrapper variance. The
historical outer 78-byte pair is not available as two captured files, so U3 does not claim that
historical full-installer number is reproduced or closed.

## Normalizer honesty

In a disposable copy of the captured payload, one byte of `resources/app.asar` at file offset
1,269,446 was changed from `0x6f` to `0x6e` (same 51,723,318-byte size; SHA changed from
`9df1ffa7c5c41cefde9e99788c7a381b3aa10a95e3f33c10d8c9e80985d583f0` to
`fb806aaadd0b333c2f8d08f72f163e20cd2060883af688d7379af21fd670239d`). The normalized manifest
compare exited **1** and reported exactly one content difference, `resources/app.asar`; no exclusion
was widened. This is a PASS for P3-05.

The mutation and compare commands were:

```powershell
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe `
  E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\plant-one-byte-asar.cjs `
  E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\honesty-mutated
& E:\MKTWorkspace\local-test-artifacts\toolchains\node-v22.23.2-win-x64\node.exe `
  E:\MKTWorkspace\_u3-a\scripts\normalized-payload-manifest.cjs `
  --compare E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\honesty-original-manifest.json `
           E:\MKTWorkspace\local-test-artifacts\u3-20260830\analysis\honesty-mutated-manifest.json
```

## Gate disposition and cost

- P3-01 (locate/classify our frozen pair): **PASS**, with offsets, lengths, windows, PE/resource
  structure, archive boundaries, and hashes retained above and in `analysis\compare-*.json`.
- P3-02 (`SOURCE_DATE_EPOCH`): **OPEN/NO EFFECT**; residual remains.
- P3-03 (ordering/compression): payload ordering is stable; NSIS resource ordering remains OPEN;
  `compression: store` did not fix it.
- P3-04 (zero unknown residuals): **OPEN**; no structural normalizer or deterministic vendor fix was
  proven for the NSIS resource/trailer path.
- P3-05 (normalizer honesty): **PASS**.
- P3-06 (CI contract): local package gates passed; no CI workflow was changed by U3.

Successful packaging wall time was 699,038 ms (~11m39s) across six builds, plus the 30,068-ms
clean-contract failure. The initial host snapshot had about 4.909 GiB available RAM and 234.788 GiB
free on D:. No VM/WSL or installer process was launched.

Release-manifest recommendation: `installerReproducibility: OPEN`, with the baseline residual named
as `NSIS-RT_DIALOG-order-and-trailer` (103-byte size delta in this controlled pair) and the exact
artifact hashes recorded above. Do not normalize by absolute offsets or promote the full installer
until the NSIS generator/resource-order source is made deterministic and re-audited.

### Unresolved questions

- Which electron-builder/NSIS generator input (language/resource enumeration or vendor tool state)
  controls the observed 203↔403 and 303↔503 RT_DIALOG permutation?
- Can that ordering be pinned in the supported vendor toolchain without changing installer UI
  semantics? If yes, rerun two fresh captures and update the release manifest; otherwise obtain owner
  approval for a structural, content-aware exception.

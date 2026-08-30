---
phase: 3
title: "deterministic-packaging"
status: in-progress
priority: P2
effort: "1–2 days"
dependencies: [1]
---

# Phase 3: deterministic-packaging

## Overview

Run 3 and run 4 of the packaged Windows payload are byte-identical: 130 entries, normalized digest
`517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`. The controlled clean-overlay
pair's **outer NSIS installer differs by 103 bytes** (the historical 78-byte candidate delta was
source-tree drift), so full installer reproducibility is correctly recorded as OPEN.

103 bytes out of roughly 145 MB is small enough to wave away, which is exactly why it deserves an
answer. "Build twice, get the same bytes" is either true or it is not; a rounding of it is worth
nothing when the question is whether the artifact you audited is the artifact you shipped.

## Requirements

- Functional: identify precisely which 103 bytes differ and why.
- Functional: eliminate the variance, or prove it is irreducible and normalize it by a documented
  rule that cannot hide a real payload change.
- Functional: the promoted installer's own SHA stays recorded and immutable regardless of the outcome.
- Non-functional: the fix must not weaken the comparison. A normalizer that ignores too much is worse
  than an honest OPEN.

## Architecture

```text
two clean builds from one frozen source
   -> byte-diff the outer NSIS containers
   -> classify each differing region: timestamp | ordering | compression | signature slot | unknown
   -> eliminate what is controllable (SOURCE_DATE_EPOCH, deterministic ordering)
   -> normalize only what is provably content-independent
   -> any "unknown" region blocks promotion
```

## Implementation Steps

1. **Locate the delta.** Produce both installers from one frozen commit and byte-diff them. Record
   the offsets, lengths, and surrounding structure of every differing region. The current controlled
   pair differs by 103 bytes (the earlier 78-byte figure was a superseded source-drift snapshot).

2. **Classify each region.** Expected candidates, in order of likelihood: an embedded build
   timestamp, an NSIS compression-header field, file-ordering nondeterminism in the archive, and the
   empty Authenticode certificate slot. Classify each; do not guess in aggregate.

3. **Eliminate what is controllable.** Set `SOURCE_DATE_EPOCH` from the frozen commit's timestamp,
   force deterministic file ordering, and pin the compression level in
   `electron-builder-installer.yml`. Rebuild and re-diff after each single change so you know which
   one moved the needle.

4. **Normalize only the irreducible.** If a region provably cannot be controlled — a signature slot,
   for instance — extend the normalizer to zero exactly that byte range, identified structurally
   rather than by absolute offset. Absolute offsets shift when content changes and would silently
   mask real drift.

5. **Prove the normalizer cannot hide a payload change.** Plant a one-byte change inside `app.asar`,
   rebuild, and confirm the normalized comparison still fails. A normalizer that passes this is
   trustworthy; one that does not is a liability.

6. **Update the reproducibility contract.** Whatever the outcome, `release-candidate.yml` must build
   twice and compare. If residual variance remains, the workflow records it as a named, bounded,
   documented exception with the exact byte count — never as a pass.

7. **Record the result** in the release manifest: `installerReproducibility: FULL | NORMALIZED |
   OPEN`, with the byte count and the classification of every region.

## Test Scenario Matrix

| ID | Scenario | Method | Expected |
|---|---|---|---|
| P3-01 | Delta located | Byte-diff two builds | Every differing region has an offset, length, and classification |
| P3-02 | Timestamp eliminated | Set `SOURCE_DATE_EPOCH`, rebuild | That region becomes identical |
| P3-03 | Ordering eliminated | Force deterministic ordering | That region becomes identical |
| P3-04 | Residual classified | Re-diff after all fixes | Zero `unknown` regions remain |
| P3-05 | Normalizer honesty | Plant a 1-byte `app.asar` change | Normalized comparison **fails** |
| P3-06 | Contract enforced | Run the CI reproducibility job | Two builds compared; result recorded, never rounded up |

## Success Criteria

- [x] The current **103-byte** residual is accounted for by the NSIS RT_DIALOG permutation and
  trailer regions; the historical 78-byte figure is superseded by the fresh experiment.
- [ ] Controllable variance is eliminated at the source, not normalized away.
- [ ] No structural normalizer was accepted; the residual is documented rather than hidden.
- [x] The normalizer provably still catches a one-byte payload change.
- [x] Payload reproducibility and the `installerReproducibility` status are recorded with evidence;
  full-installer reproducibility remains OPEN.
- [x] CI enforces the twice-build comparison. `release-candidate.yml` retains the two-build matrix,
  always runs the comparison/status job, uploads both manifests and the machine-readable result, and
  fails closed when either build or manifest is missing. Source/static validation passed locally;
  a real release-candidate dispatch remains OPEN because the exact Stable `.2` engine/archive and
  private sibling checkout credentials are not available in this release window.

Phase outcome: payload PASS; outer installer reproducibility OPEN pending a vendor/toolchain
ordering fix. No installer was promoted or signed.

## Risk Assessment

- **Over-normalizing.** The tempting fix is to widen the ignore rule until the diff passes. P3-05 is
  the guard: if the normalizer cannot catch a planted byte, it is worthless. Prefer an honest `OPEN`
  over a normalizer that lies.
- **Chasing a vendor-tool bug.** If the variance turns out to be inside electron-builder or NSIS
  itself, timebox the investigation, document the finding upstream, and normalize structurally rather
  than forking the toolchain.
- **Offset-based rules rotting.** Identify regions structurally; absolute offsets shift as soon as
  content changes and turn a passing check into a meaningless one.

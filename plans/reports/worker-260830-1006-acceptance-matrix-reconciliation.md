# Acceptance-matrix reconciliation — 2026-08-30

Owner: U7 matrix reconciliation
Status: COMPLETE (documentation only; no source or release artifact changed)

## Exact edits

- `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`
  - Changed the current `G2-IDENTITY` summary (line 61) to `FAIL`, dated 2026-08-30, with the
    required-surface collisions `08050B16` (fonts), `0B09CAEB` (audio), and `BF16CA5C` (WebGL).
  - Changed the current `G3-RECOVERY` summary (line 64) to `OPEN` for the exact v16 candidate.
  - Added `30 August consolidation reconciliation` (line 638), preserving every dated historical
    section and explicitly distinguishing the dirty-source/v15 power-cycle PASS (lines 414–437)
    from the exact-candidate OPEN state and earlier fail-closed reboot history (lines 520–541). The
    previously published `0.3.12`/v15 installer is also named as negative replay evidence; the
    current `0.3.13`/v16 candidate is not treated as published or fully recovered.
  - Recorded that the formal fresh identity matrix remains OPEN, Preview `.3` is not promoted, and
    no identity-isolation or uniqueness claim follows from the candidate.
- `plans/260829-2125-internal-product-readiness/plan.md`
  - Marked frontmatter `status: superseded` and linked successor
    `260830-0830-consolidation-and-lane-a-release`.
  - Added an executed-outcome banner linking the independent verification report and stating
    `PARTIAL / BLOCKED`, `G2-IDENTITY=FAIL`, and current-candidate `G3-RECOVERY=OPEN`.
  - Left the predecessor's historical body and evidence unchanged.

## Verification

- `git diff --check` passes for the tracked acceptance-matrix edit.
- No MKTTool or MKTBrowser source, protected file, installer, Relay artifact, or production state
  was changed.
- No commit, stash, revert, push, vendor launch, or seat consumption was performed.

## Unresolved questions

- Exact candidate-bound clean-VM and physical power-cycle recovery evidence remains OPEN.
- Formal fresh three-profile × five-run licensed identity evidence and vendor response remain OPEN.
- Q15 is superseded/closed: both active v15 devices are the owner's machines and the path is
  self-serve with no notification channel.
- Q16 is superseded/closed: there is no CloakBrowser channel, so Lane C is CLOSED; no sender, request,
  deadline, or response wait exists.

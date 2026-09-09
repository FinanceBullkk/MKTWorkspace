# MKTBrowser CI blocked by org artifact storage quota

Date: 6 September 2026
Status: fix merged-ready in PR #17; blocked on GitHub recalculating storage usage

## Symptom

`Windows Technical Build` red on `main` since 3 Sep. Also red on PR #17. Same failure every time,
always at the last step of `windows / package`:

```
Failed to CreateArtifact: Artifact storage quota has been hit.
Unable to upload any new artifacts. Usage is recalculated every 6-12 hours.
```

Not a code failure. `windows / quality` passes. Locally on Node 22.23.2: lint clean, typecheck
clean, `yarn test:installer` 374 pass / 0 fail / 1 skipped.

## Cause

Techieslab-app is on the **GitHub Free** plan: 500 MB Actions/Packages storage shared across all
repositories, not per repo.

`mktbrowser-win-unpacked` is a same-run handoff — uploaded by `package`
(`windows-pipeline.yml:219`), downloaded by `packaged-contract` (`:276`), never read afterwards.
It was kept 7 days at ~150 MB per build. 15 copies had accumulated.

Storage at discovery: MKTBrowser 2.79 GB against a 500 MB org cap.

## Actions taken

| When (UTC) | Action | Org storage after |
| --- | --- | --- |
| 01:01 | deleted 15 `mktbrowser-win-unpacked` (2.29 GB) | ~560 MB — still over cap |
| 15:20 | deleted 3 `candidate-installer` + 1 `mktbrowser-windows-installer` (554 MB) | **6 MB** |

The four installers were downloaded first to
`local-test-artifacts/github-artifact-backup-20260906/` with `MANIFEST.txt` recording artifact id,
run id, date and SHA-256. The three `candidate-installer` files have three different hashes — they
are three distinct builds, not repeated uploads of one build. No GitHub Release referenced any of
them; they are reproducible from the `release-candidate` workflow.

Also on PR #17: `retention-days` 7 -> 1 on the handoff only. `packaged-contract-evidence` keeps its
7-day window (durable record, under 1 MB).

## Why it is still red

Only the 15:20 deletion brought the org under the 500 MB cap. GitHub recalculates usage every
6-12 hours, so the earliest it can clear is **04:20 UTC+7 on 7 Sep**, the latest **10:20 UTC+7**.

Four re-runs were spent before this was understood, at roughly 3.5 min each on the Windows lane
that bills at 2x. Three of those were avoidable: the deciding fact was the org plan's 500 MB
org-wide cap, which is free to read and was checked late.

## Next step

After 10:30 UTC+7 on 7 Sep, once:

```
gh run rerun 34002472571 -R Techieslab-app/MKTBrowser --failed
```

Do not re-run before that. If it fails again on the same quota line, the cause is not the cache and
the org owner needs to be involved.

## Ruled out

- Self-hosted runners. Four are registered (`mkt-ci-*`, `mkttool-ci-*`), all offline, and no
  `runs-on:` in either repo targets them. Runners address minutes, not storage; artifacts upload to
  GitHub storage regardless of runner.
- Package publishing in MKTBrowser and MKTTool. No `ghcr.io`, no `npm publish`, no `publishConfig`.

## Unresolved

- GitHub Packages in the other 30 org repos could also consume the same 500 MB. Listing them needs
  `read:packages`; the current token has `gist, read:org, repo, workflow`.
- Exact cached usage figure is unreadable. `orgs/Techieslab-app/settings/billing/shared-storage`
  needs org owner plus `admin:org`. The operating account (`FinanceBullkk`) is a **member**, so it
  can neither read billing nor change the plan — both need the org owner.
- Whether to raise the plan at all. At 6 MB used and 152 MB per build held for one day, Free's
  500 MB is sufficient once the backlog is gone; this was a one-off from three weeks of
  accumulation, not a plan that is too small.

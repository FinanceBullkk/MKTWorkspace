---
date: 2026-09-28
status: blocked
candidate: 20260925-browser-0.3.27-relay-20-cold-start-tls-profiles-cft
localValidation: PASS
twoBuildEquivalence: PASS
candidatePublication: PASS_SEQUENCE_32_ONLY
cleanVmAcceptance: OPEN
releaseVerdict: NO-GO
---

# Browser 0.3.27 Candidate And VM Memory Checkpoint

## Result

Browser 0.3.27 / Relay 20 is frozen to one exact Build A installer and ready for clean-VM transfer,
but the VM was not restored or started. The host has insufficient physical and commit headroom for
the pinned 4 GiB VM. No user applications were closed and no VM configuration was weakened.

## PASS

- Frozen source remains clean: MKTTool `a32c293fc9a25c3d17873a31e9a5a62d711e2f3e` and MKTBrowser
  `67e8f16b35a3b8427cf5d5d98aebdc413eee2447`.
- Two independent builds contain 129 equivalent normalized payload files with digest
  `1c8a94d1e2051071375d046ff5468f001a69b7b92fc027c277e49322b1cc1889`.
- Retained Build A installer: 148,989,172 bytes, SHA-256
  `e690602ea5f134174fa105263cafae843670f86c30263c8d13677355ef8959ca`, Authenticode `NotSigned`.
- Exact tuple retained: Browser payload `31a454a2...0235`, Relay v20 `c66a3935...526b`, contract v6
  `1e2f2d89...a2c4`, and CFT `152.0.7977.64` `b0db25de...8004`.
- Signed compatibility manifests 32-43 validate against the delegated release authority and exact
  local artifacts. The 84 planned R2 object names were vacant at allocation time.
- Fresh-state sequence 32 was published candidate-only and all seven immutable objects passed full
  GET/size/SHA-256 read-back. Railway sequence configuration was not changed; operator promotion
  remains `HOLD`.
- Candidate-bound VM bundle contains 26 verified files. Descriptor SHA-256:
  `812a6eb1e98d43631624c9f34de546ba2f0def0e5abe881e69e848821a174115`.

## BLOCKED

Host preflight observed:

- VM `mkt-phase5-nvme-20260908` powered off at clean snapshot
  `dde2d98e-72d7-466e-8339-fb6b9c552752`.
- VM resources unchanged: 4,096 MiB RAM and 2 CPUs; no other VM or host MKT Browser process running.
- Available physical memory: 1.753 GiB; required by the established VM gate: 6 GiB.
- Commit headroom: 3.155 GiB; required: 6 GiB.

Therefore snapshot restore, guest clock/SSH checks, installer lifecycle, cold health trials, and the
Web -> Relay -> profile/proxy flow remain `OPEN`. Starting the VM in this state would violate the
release gate and risk host paging or allocation failure.

## Evidence

- Candidate preparation: `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance\candidate-0327\preparation-receipt.json`
  (`f8b97facb88712ad2ec96b480694dd9486aa98049c027dccd61ec3f23fcc65ca`).
- Release authority verification: `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance\candidate-0327\release-authority-verification-receipt.json`
  (`5e69c684322a74de01cacb59a9232d4b727d7553465b5cf83831a4328df53d8b`).
- Sequence 32 publication read-back: `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance\candidate-0327\sequence-32-publication-readback-receipt.json`
  (`1ebc36cabe1a4e1585961b2f24e1c568b4ca95394ac1b4b78a18d423aa3c1679`).
- VM bundle: `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance\vm-gate-0327\bundle-descriptor.json`
  (`812a6eb1e98d43631624c9f34de546ba2f0def0e5abe881e69e848821a174115`).
- Host preflight: `D:\MKTWorkspace-local-validation\260928-1816-browser-0327-acceptance\host-preflight-0327.json`
  (`80142dfb06b06c376490ebcd27936999a75459eea10db6f08bf085ec59e937d7`).
- The first partial bundle attempt hit a UTF-8 BOM parser defect in the preparation helper and was
  preserved as `vm-gate-0327-partial-bom-failure`; the helper was corrected and the new bundle passed.

## Actions Not Taken

- No snapshot restore, VM start, guest transfer, installer execution, profile action, or proxy action.
- No MKTTool or MKTBrowser push, Railway deployment, sequence-variable change, operator promotion,
  public release, or real-account use.
- No fingerprint, antidetect, identity-isolation, or account-safety claim. `G2-IDENTITY=FAIL` remains.

## Next Step

Free enough host memory to reach both 6 GiB available physical RAM and 6 GiB commit headroom, then
rerun the host preflight. Continue with snapshot restore, current guest clock/SSH validation, exact
bundle transfer, installer clean/repair/uninstall gates, and the fresh synthetic Web/Relay/profile
matrix. Do not rebuild the retained installer.

## Unresolved Questions

- Which user-controlled applications can be closed or whether the host should be rebooted before
  resuming the clean-VM gate.

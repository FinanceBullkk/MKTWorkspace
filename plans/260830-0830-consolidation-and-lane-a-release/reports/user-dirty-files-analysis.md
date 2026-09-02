# User-owned MKTBrowser dirty files analysis

Date: 2026-08-30 | Branch: `release/consolidation-20260830` | Scope: analysis complete; disposition executed

These three paths were dirty before U1. The analysis below was performed before disposition using the
working-tree diffs against the U1 branch HEAD, `git diff --check`, `rg` for TODO/conflict/dangling-
symbol signals, and the completed `corepack yarn typecheck` result (exit 0). Q14 then superseded the
initial keep-uncommitted recommendation: the owner authorized one dedicated commit containing
exactly these paths, `1decde437cf6495652b9d7bdbb76290ab2130411`.

## `apps/desktop/src/main/ChromiumBrowserDriver.ts`

1. **What the diff does** — Changes only the explanatory comment above `fingerprintSeed`. It narrows the claim from guaranteed canvas/audio/WebGL rotation to a stable, engine-supported seed and explicitly says native engine support and external measurement are required. The function body and seed calculation are unchanged.
2. **Complete or mid-thought** — Complete and syntactically clean. `git diff --check` passes; the repository typecheck passes; no half-written function, conflict marker, TODO, new import, or dangling symbol is present. This is a comment-only change.
3. **Interaction with U1 work** — Inert with respect to U1 runtime changes. U1 changed renderer copy and onboarding claims, but not this driver implementation. The wording is consistent with U1's removal of unsupported fingerprint-isolation claims; there is no overlapping hunk or API conflict.
4. **Needed for U4 provenance?** — Not functionally needed for attestation, signing, or deployment. However, the file's dirty state is part of the source tree and can make `emit-release-provenance.cjs` report `source.clean=false`; therefore it can block a clean provenance gate even though its content is harmless.
5. **Recommendation at analysis time** — Keep owner-owned and untouched until a disposition decision.
   **Final Q14 disposition:** the owner chose the dedicated safety commit named above; provenance was
   regenerated afterward and accepted. Do not generalize this exception to other protected files.

## `packages/mcp-server/src/server.ts`

1. **What the diff does** — Rewords safety and capability descriptions: raw CDP lifecycle handling is described as a session-restoration control rather than stealth evidence; fingerprint reconciliation is described as internal configuration coherence rather than identity isolation; MCP instructions state that identity isolation is unproven and require one-profile-at-a-time human login/OTP/CAPTCHA/typing; `seed` and `evaluate_js`/`cdp_send` descriptions remove evasion guarantees. No executable branch, schema, denylist, or tool permission changes.
2. **Complete or mid-thought** — Complete and typechecks. `git diff --check` passes; no TODO/conflict marker or dangling import was found. Existing imports and tool definitions remain referenced; the changes are string/comment literals only.
3. **Interaction with U1 work** — It sits beside U1's one-seat/license and UI-claim changes but does not alter their code paths. It reinforces the same safety boundary and does not conflict with the U1 MCP contract tests or Relay/version commits. No interleaved run-work hunk was found.
4. **Needed for U4 provenance?** — Not required to build or attest the Lane A Relay/installer tuple. It is still part of the candidate source snapshot, so a strict provenance emitter can reject the tree solely because this path is dirty. Committing it would change the source digest and require a new attestation; silently ignoring it would be incorrect.
5. **Recommendation at analysis time** — Leave it untouched pending owner disposition. **Final Q14
   disposition:** commit it only with the other two paths in the dedicated safety commit, then
   regenerate provenance; that exact sequence was completed.

## `packages/types/src/index.ts`

1. **What the diff does** — Adds the explicitly named public `MKT_BROWSER_MCP_PROTOCOL_VERSION` constant (`0.3.1`), keeps `MKT_BROWSER_MCP_SERVER_VERSION` as a deprecated alias, and clarifies that `seed` is engine-version-dependent and must be measured. This separates wire-protocol versioning from desktop release versioning without changing the wire value.
2. **Complete or mid-thought** — Complete and typechecks. `git diff --check` passes; no half-written code, TODO, conflict marker, or dangling import exists. The new constant is an intentional public export (not an unfinished local symbol); the existing server import continues to resolve through the compatibility alias. No runtime test failure was observed.
3. **Interaction with U1 work** — U1 changed desktop/package release version and Relay pin, while this file deliberately keeps MCP protocol `0.3.1`; the namespaces are distinct and do not conflict. The alias preserves current server behavior. It is adjacent to U1's provenance/version work but not an overlapping hunk.
4. **Needed for U4 provenance?** — Not needed for the Lane A deploy tuple itself. As with the other two paths, its dirty status can make source provenance refuse; committing it would require attesting this exact content. The protocol-version clarification may prevent future version-coherence confusion, but it does not close any current U4 gate.
5. **Recommendation at analysis time** — Keep untouched pending owner disposition. **Final Q14
   disposition:** land all three paths together, never partially or by normalization; the dedicated
   commit completed that requirement.

## Decision and provenance impact

- All three diffs are complete, compile/typecheck clean, and semantically aligned with the safety language added by U1. None is required to make the Lane A web artifact function.
- They were not folded into U1. Q14 preserved attribution by landing exactly these three paths in the dedicated safety commit.
- The strict emitter initially refused the dirty tree; after the authorized commit, the rerun accepted
  `source.clean=true`. The accepted receipt is P4b Browser provenance evidence only and is not a
  five-artifact tuple or a P4a deployment prerequisite.

## Evidence commands/results

- `corepack yarn typecheck` in MKTBrowser: PASS, exit 0.
- Protected-file/runtime checks: `node --test scripts/version-coherence-contract.test.cjs apps/desktop/src/main/runtime-contract.test.ts` PASS, 26/26 (read-only scout verification).
- `git diff --check -- <three paths>`: PASS.
- `rg -n "TODO|FIXME|HACK|<<<<<<<|>>>>>>>" <three paths>`: no matches.
- U1 status after commit: exactly these three paths dirty; no protected path appears in `git log 3f37653..HEAD`.

## Unresolved questions

- No unresolved Q14 question remains. The dedicated commit and post-commit provenance rerun are
  recorded above; MKTTool `AGENTS.md` and `AGENTS.md.bak-260828` remain separately protected.

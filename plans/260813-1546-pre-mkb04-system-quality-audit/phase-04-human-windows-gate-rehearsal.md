---
phase: 4
title: "Human Windows Gate Rehearsal"
status: pending
priority: P1
effort: "2-4 days plus operator scheduling"
dependencies: [1, 2, 3]
---

# Phase 04: Human Windows Gate Rehearsal

## Overview

Exercise the frozen installer and artifacts on disposable Windows environments with no real social
credentials. Human evidence must reproduce the actual authenticated download and Windows trust journey.

## Environment

- Disposable standard-user Windows accounts or disposable Windows VMs/devices.
- Unfamiliar operator for the zero-coaching gate.
- Dedicated test proxy and disposable Browser profiles.
- Synthetic MKTTool identities and keys; no real Reddit, Google, or Facebook credentials.
- Temporary authenticated HTTPS staging authorized specifically for this rehearsal, pinned to the frozen
  installer hash. No public release, production deploy, or operational-machine install.
- Chrome and Edge for Local Network Access and Mark-of-the-Web/SmartScreen paths.

## Scenarios

### Installation and Enrollment

- Authenticated single download and standard-user install.
- SmartScreen warning exactly as announced.
- Administrator approval only for declared machine-wide firewall rules.
- Chrome/Edge Local Network Access behavior.
- Online/offline ADMIN, closed page, restart, reboot, expired grant, duplicate submission, interrupted resume.
- Existing live Relay identity reconciliation without silent identity replacement.

### Conflict and Failure Recovery

- Legacy MultiZen/Relay, technical Browser build, duplicate startup, port conflicts.
- Damaged install, permission denial, partial files, unavailable engine download.
- CloakBrowser failure with explicit in-modal CFT compatibility fallback.
- Network/firewall uncertainty stops Browser before any proxied profile starts.

### Privacy and Engine Boundary

- Exact selected-engine firewall rule across all Windows firewall profiles before launch.
- BrowserLeaks WebRTC, DNS, HTTP exit, and fingerprint checks after install, reboot, engine update, Relay
  update, repair, and rollback.
- Record only PASS/FAIL and redacted comparison results; never record proxy values or observed IPs.

### Secret, Update, Rollback, Repair

- Transactional secret migration from a backed-up disposable live-shaped Relay home.
- Crash injection, restart recovery, and refusal of older incompatible Relay.
- Manifest verification, downgrade rejection, interrupted update recovery, one retained rollback,
  authorized rollback, and rollback-floor enforcement.
- Repair/uninstall preserves profiles, MCP token, device identity where required, and pre-existing Relay;
  removes only installer-owned components.

### Zero-Coaching Journey

An unfamiliar operator completes the full journey without terminal, Node, archive extraction, manual key
copy, localhost navigation, checksum work, DevTools, or developer coaching.

## Evidence Protocol

Each scenario records evidence ID, timestamp, pseudonymous operator ID, machine description, artifact
versions/hashes, expected/observed outcome, PASS/FAIL, and sanitized screenshot/log references.

Raw evidence remains restricted and uncommitted. Hash raw files before sanitization; commit only sanitized
copies. Record redactor and reviewer. Reports must not expose identity, proxy, IP, token, secret, or local
sensitive path.

## Success Criteria

- [ ] Every scenario passes on the frozen baseline.
- [ ] SmartScreen and authenticated-download behavior is genuine, not file-copy simulation.
- [ ] No scenario needs developer intervention or hidden workaround.
- [ ] Privacy boundary passes for both engine paths and after lifecycle changes.
- [ ] Raw-to-sanitized evidence chain is complete.
- [ ] Source state remains unchanged.

## Risk Assessment

- SmartScreen reputation can vary by machine and download method. Record observed behavior; unexpected
  warnings or absent expected announcement fail the scenario.
- VM networking may not reproduce physical-device firewall behavior. Use at least one representative
  physical Windows device before GO.

## Unresolved Questions

None. Owner authorization is required immediately before creating the temporary HTTPS staging channel.

# Prompt cho từng phiên Codex

**Một phase = một phiên mới.** Mở phiên Codex mới trong `E:\MKTWorkspace`, dán đúng khối prompt của
phase đó, không dán lại hội thoại cũ. Ranh giới giữa các phase là chỗ chủ dự án đọc kết quả rồi mới
quyết đi tiếp — gộp hai phase vào một phiên là bỏ qua đúng cái quyết định đó.

## Trạng thái hiện tại

| | |
|---|---|
| Phase 01 | **XONG 02/09/2026.** Đặc tả: `MKTBrowser/docs/fingerprint-acceptance-gate.md`, đã merge vào `main` qua PR #12 |
| MKTBrowser | `main` đã có đặc tả. Bắt nhánh mới từ `main` |
| Workspace repo | nhánh `codex/fingerprint-engine-phase0` |
| Phase 02-05 | chưa bắt đầu |

## Bốn ràng buộc — nhắc trong mọi prompt, đừng bỏ

Phiên mới không tự biết vì sao các đường khác đã đóng, và sẽ đề xuất build Chromium hoặc viết C++
nếu không nói:

| Ràng buộc | Hệ quả |
|---|---|
| Không ai viết được C++ Chromium/Blink | Không vá native. Không PoC, không sản phẩm hoá |
| Không có máy >16 GiB RAM khả dụng | Không build từ nguồn |
| Không ngân sách, chỉ dùng thứ miễn phí | Không đổi vendor. Brave/Camoufox vì chúng free |
| Pool 3-5 profile, một profile tại một thời điểm | Đo ở **5** |

## Chi phí CI — quan trọng

**Mỗi PR trên MKTBrowser tốn ~20 phút GitHub Actions bị tính** (3 job Windows, giá 2x). `pr-release-gate.yml`
cố ý không có `paths-ignore` vì nó mang tên check bắt buộc để merge.

→ **Gom hết thay đổi của một phase vào MỘT PR.** Không mở PR cho từng commit. Repo workspace
(markdown) thì rẻ, push thoải mái.

---

## Phase 02 — đo lại Cloak theo gate mới

```text
Execute phase 02 of the fingerprint acceptance-gate plan. Read first:

- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-02-cloak-baseline-remeasurement.md
- E:\MKTWorkspace\MKTBrowser\docs\fingerprint-acceptance-gate.md   (the gate you must measure against)
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\reports\phase-01-gate-specification.md

Context you will not infer from code: nobody available writes Chromium/Blink C++, no machine has
>16 GiB available RAM, there is no budget. Building an engine and patching native code are both
closed. Do not propose either.

Task: measure CloakBrowser Stable .2 against the three criteria in the gate document, at a pool of
FIVE disposable profiles on this machine.

1. Extend MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs first. It currently reads
   canvas, deviceMemory, hardwareConcurrency, language, platform, screen, timezone, userAgent and
   WebGL. It does NOT read fonts or audio - two of the three surfaces that produced the recorded
   collision - and does not read WebGPU or client rects, and does not exercise iframe, worker or
   offscreen-canvas contexts. No verdict may be issued from the unextended harness.
2. Measure five profiles, restart, measure again (criterion A).
3. Compute the stable subset: surfaces whose value is identical across all five. Publish that list.
   It is COMPUTED from the data, never chosen after seeing whether the check passes. Run the
   collision check on that subset (criterion B), and report the full-tuple comparison separately as
   the weaker informational check.
4. Measure stock Chrome or CFT on THIS machine in the same session, and compare each surface
   (criterion C). A value that differs from stock and is invariant across every profile is a vendor
   mark and fails C even if B passes.
5. Write plans/260902-0544-fingerprint-gate-and-brave-spike/reports/cloak-baseline.md with raw
   readings and three separate verdicts. Never a combined score.

SEAT DISCIPLINE - there is one CloakBrowser seat and no budget to replace it:
- Prepare the recording table BEFORE opening the first profile.
- Do every measurement in one continuous pass. Do not reopen a profile because a number was missed.
- Close through Browser.close to return the seat. Killing the process leaves it cooling.
- A refused seat looks exactly like a crash (exit 76 after CDP is already serving). Confirm the seat
  is free before each run rather than guessing from symptoms.

Boundaries: disposable profiles only, no real accounts, do not promote Preview .3, do not change the
engine pin, do not weaken G2-IDENTITY.

Batch all changes into ONE pull request - each MKTBrowser PR costs about 20 billed Windows minutes.

Stop when the report is written. Do not start phase 03. If Cloak passes all three criteria at pool
five, say so explicitly: that ends the plan and phase 03 and 04 are skipped.
```

---

## Closeout phase 02 + gỡ khoá phase 03

> Chạy phiên này trước phase 03. Thuần tài liệu + merge, không chạm engine, không thử seat.

```text
Close out phase 02 of the fingerprint acceptance-gate plan and unblock phase 03. This is a
documentation and merge session: no measurement, no engine launch, no seat attempt.

Read first:
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-02-cloak-baseline-remeasurement.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-03-brave-lifecycle-integration-spike.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\reports\cloak-baseline.md
- E:\MKTWorkspace\plans\reports\decision-260902-0530-fingerprint-engine-path.md

OWNER DECISION, 2 September 2026: no vendor contact, ever. Lane C is closed - no request, no
ticket, no "coming soon". Do not draft or send a vendor message, and do not add one as a next step.

Verification already performed on this machine. Record it; do not redo it, it needs no seat:
- license-leases.json holds 18 records and every one is terminal: expired, confirmed-released, or
  terminal-refused. There is no active, cooling or pendingRecovery entry. The most recent record is
  confirmed-released at 2026-09-01T08:53:12Z.
- Nothing under the installed CloakBrowser runtime was modified after 07:00 local on 2 September.
- Therefore "a local process or lease holds the seat" is ruled out by evidence, not by assumption.

Tasks:

1. Update reports/cloak-baseline.md:
   - Phase 02 is CLOSED-BLOCKED, not "waiting". With vendor contact ruled out, the only remaining
     self-service check is powering off MKT Browser and CloakBrowser on the second owner machine and
     retrying once. If that is not the cause, phase 02 cannot be measured at all.
   - Record the local evidence above.
   - Record this contradiction and what follows from it: session/start returned HTTP 200 and
     session/end returned HTTP 200, so the account had capacity at that moment. A genuine "session
     limit reached" would have failed session/start. The refusal is therefore more likely scoped to
     the engine launch identity or a device registration than to a session count - and if it is
     device-scoped, buying additional seats would not fix it. Mark this as inference, not
     measurement.

2. Edit phase-03-brave-lifecycle-integration-spike.md: remove `dependencies: [phase-02]`. Explain in
   the file that phase 02 was the early-exit branch rather than a prerequisite - it existed to end
   the plan if Cloak already passed the gate. Blocking it removes the early exit and nothing else.
   Phases 03 and 04 need no CloakBrowser seat: Brave and stock Chrome are both free.

3. Add a section to plans/reports/decision-260902-0530-fingerprint-engine-path.md recording an
   availability finding the August research did not cover. Over roughly one hour on 2 September,
   with proper cooldowns and a clean local preflight, the pinned engine refused to launch four
   times, and there is no channel to ask why. That is an availability defect independent of
   fingerprint quality: an engine that cannot be launched makes its fingerprint quality irrelevant.
   For a product whose operators must open profiles daily this ranks above G2-IDENTITY as an
   operational risk. It is also a new argument for Brave that has nothing to do with identity - a
   free prebuilt engine cannot be withheld.

4. Merge PR #13 on MKTBrowser (target main). Its CI is green and it carries the extended harness
   that phases 03 and 04 reuse.

5. Update the phase table in plan.md: phase 02 CLOSED-BLOCKED, phase 03 ready.

Boundaries: do not launch any engine, do not attempt the seat, do not contact the vendor, do not
weaken G2-IDENTITY, do not start phase 03.

Batch the workspace documentation into one push. The MKTBrowser side is a merge of an existing PR,
not a new one.

Stop when the documents are updated and PR #13 is merged.
```

---

## Phase 03 — Brave: lifecycle & tích hợp

> Phase 02 bị chặn **không** chặn phase này — nó chỉ làm mất cửa thoát sớm. Phase 03/04 không cần
> seat Cloak.

```text
Execute phase 03 of the fingerprint acceptance-gate plan. Read first:

- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-03-brave-lifecycle-integration-spike.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\reports\cloak-baseline.md

Context: nobody available writes Chromium/Blink C++, no machine has >16 GiB available RAM, no
budget. Brave is viable precisely because it is PREBUILT and free - you run it, you do not patch or
build it. Do not propose patching or building anything.

Task: run official Brave for Windows, unmodified and checksum-verified, in a disposable data root,
and answer one question: can MKT Browser drive it?

Check each, with evidence, pass or fail:
1. DevToolsActivePort discovery and CDP connection
2. Browser.close, process ownership, restart behaviour
3. proxy fail-closed path plus DNS and WebRTC checks
4. companion extension loading and the APIs it needs
5. profile persistence across restart with the same --user-data-dir
6. no existing security boundary weakened - sandbox stays on, CSP unchanged, CDP stays on loopback

Record the Brave version and SHA-256. Do not install Brave as MKT Browser, do not distribute it, do
not change the product engine pin.

Where a check fails, record exactly what would need to change on the MKT side and estimate the cost.
Do NOT make those changes in this phase - the cost estimate is the deliverable, not the fix.

Write plans/260902-0544-fingerprint-gate-and-brave-spike/reports/brave-lifecycle.md.

Batch all changes into ONE pull request - each MKTBrowser PR costs about 20 billed Windows minutes.

Stop when the report is written. Do not start phase 04. If any check fails in a way that cannot be
fixed in TypeScript in a few days, say so explicitly: the plan stops and goes to phase 05.
```

---

## Phase 04 — Brave: danh tính & phán quyết cohort

```text
Execute phase 04 of the fingerprint acceptance-gate plan. Read first:

- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-04-brave-identity-and-cohort-verdict.md
- E:\MKTWorkspace\MKTBrowser\docs\fingerprint-acceptance-gate.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\reports\cloak-baseline.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\reports\brave-lifecycle.md

Task: measure Brave against the same three criteria, using the SAME harness and the SAME procedure
phase 02 used, at a pool of five. Do not modify the harness between the two runs - changing the
method destroys comparability, which is the whole point of this phase.

The decisive question is criterion C, and specifically audio:

  Is Brave's audio value a real Windows cohort value, or is it a "this is Brave" mark?

Test it by comparing Brave against stock Chrome or CFT on THIS machine. Matches stock means a real
cohort. Differs from stock AND invariant across every profile means a product signature - which is
exactly the defect that failed CloakBrowser. Apply the same standard to Brave. Do not go easy on it
because it is free and it is the last option.

Produce a three-column table - Cloak .2 | Brave | stock Chrome - for every surface the gate lists.
Report criteria A, B and C separately. State plainly whether Brave is better, equal or worse than
Cloak ON EACH criterion; "better overall" is not an acceptable conclusion.

Remember Brave's threat model is tracker resistance, not antidetect, and its seed and session
semantics are not MKT's persistent profile contract. Research warned Brave may form its own cohort.
That is the hypothesis you are testing, not a footnote.

Write plans/260902-0544-fingerprint-gate-and-brave-spike/reports/brave-identity.md.

Batch all changes into ONE pull request - each MKTBrowser PR costs about 20 billed Windows minutes.

Stop when the report is written. Do not start phase 05. A good result here does NOT open rollout,
does NOT close G2-IDENTITY and does NOT permit real accounts.
```

---

## Phase 05 — bản ghi Go/No-Go

> Chạy phase này **bất kể** kết quả, kể cả khi plan dừng sớm ở phase 02 hoặc 03.

```text
Execute phase 05 of the fingerprint acceptance-gate plan. Read first:

- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-05-go-no-go-decision-record.md
- every report in plans/260902-0544-fingerprint-gate-and-brave-spike/reports/
- E:\MKTWorkspace\plans\reports\decision-260902-0530-fingerprint-engine-path.md

Task: consolidate the measurements into one verdict the project owner can sign, and update the docs
to match. This phase runs even if the plan stopped early at phase 02 or 03 - a short plan still
needs its conclusion written down.

Answer these five, one decisive line each:
1. Does Cloak Stable .2 pass or fail each of criteria A, B and C at pool five?
2. Can MKT drive Brave? At what fix cost?
3. Does Brave pass or fail each criterion? Is its audio a real cohort or a vendor mark?
4. Is there enough evidence to retire G2-IDENTITY? If not, what is missing?
5. What happens next, and who does it?

Separate what was MEASURED from what was INFERRED. Do not state anything the evidence does not
support.

Then update: MKTTool/docs/development-roadmap.md, MKTTool/docs/internal-beta-release.md if the gate
table changes, MKTBrowser/README.md if its status claims change, and record the first application of
the gate in MKTBrowser/docs/fingerprint-acceptance-gate.md.

Three outcomes are all valid and none is a failure of the plan:
- Cloak is good enough at pool 3-5, so the engine question closes.
- Brave is genuinely better, so open a SEPARATE plan for an engine change. This spike is not that
  change; do not extend this plan into it.
- Nothing reaches the gate. Then the product is a profile, proxy and ownership manager, not an
  identity-isolation tool, and the docs must say so - including MKTBrowser's own description. A
  wrong description here makes people accept a risk they do not know they are carrying, which is
  worse than any technical defect in this plan.

Write plans/260902-0544-fingerprint-gate-and-brave-spike/reports/go-no-go.md, then stop and ask the
owner to sign it.
```

---

## Nếu Codex đi chệch

- Đề xuất build Chromium hoặc viết C++ → nó chưa đọc `decision-260902-0530-fingerprint-engine-path.md`.
  Bắt đọc rồi làm lại.
- Chọn tập bề mặt ổn định sau khi thấy kết quả → sai nguyên tắc cốt lõi của tiêu chí B. Tập ổn định
  **tính từ dữ liệu**, không chọn.
- Gộp ba tiêu chí thành một điểm → lặp lại đúng sai lầm của gate cũ.
- Kết luận "engine mới sẵn sàng dùng" → đọc sai plan. Đầu ra là Go/No-Go, không phải giấy phép.
- Mở PR cho từng commit → đốt ~20 phút Actions mỗi lượt. Gom một PR mỗi phase.

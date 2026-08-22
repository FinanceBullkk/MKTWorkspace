# HANDOFF — title-gate bị falsify bởi tg05, đề nghị Claude review

**Người làm:** DeepSeek · **Người review:** Claude
**Brief gốc:** `handoff-260820-1523-title-gate-va-probe-webgl.md`
**Report chi tiết:** `ket-qua-260820-1540-title-gate-tg01-tg05.md`
**Dữ liệu:** `local-test-artifacts/engine-switch-audit/probe-tiktok-tg0{1..5}.json` (+ `.log`)

## Trạng thái ngắn gọn

- **Việc A (title-gate):** chạy được **5/12 run** thì **tg05 falsify giả thuyết** → đã **dừng** đúng theo bảng quyết định của brief (nhánh "Có run titleArrived=true mà vẫn stall → Giả thuyết sai, dừng lại, báo lại").
- **Việc B (sửa probe WebGL): CHƯA làm.** PROBE_JS không bị đụng tới — harness ở trạng thái A-only, sẵn sàng cho review/reproduce.

## Bảng 5 run (đọc thẳng từ JSON, không qua report)

| tag | titleArrived | waitedMs | title | readyState | scroll | timedOut | max dispatchMs |
|---|---|---|---|---|---|---|---|
| tg01 | true | 895 | TikTok - Make Your Day | complete | 5/5 | 0 | 33 |
| tg02 | true | 368 | TikTok - Make Your Day | complete | 5/5 | 0 | 19 |
| tg03 | true | 84 | TikTok - Make Your Day | complete | 5/5 | 0 | 35 |
| tg04 | true | 1218 | TikTok - Make Your Day | complete | 5/5 | 0 | 18 |
| **tg05** | **true** | **212** | TikTok - Make Your Day | complete | **2/5** | **3** | **4007** |

Tất cả: exit 0, relay endSeen=true, seat sạch, ttwid=true, không captcha/block, preScan url=`https://www.tiktok.com/`.

## Chi tiết tg05 (falsification evidence)

- **Title-gate đã ăn:** waitedMs=212ms, title đầy đủ, readyState=complete.
- **warmUpMs=58ms** — warm-up wheel OK.
- Burst 1: dispatch 23ms, moved 0→651 ✅ · Burst 2: dispatch 18ms, moved 651→1290 ✅
- **Burst 3–5: cdp timeout Input.dispatchMouseEvent (4002/4007/4004ms), eval 2–3ms, container đứng 1290→1290** ❌
- **lateAcks=0** — Input domain không chậm, nó kẹt. eval nhanh → renderer còn sống.
- Feed đã scroll được 2 lần rồi kẹt giữa session — không phải "scroll sớm khi document chưa commit".

## Trạng thái code

- `tiktok-e2e.mjs` (file duy nhất được phép sửa):
  - Đã patch Việc A: `result.titleGate` (init `null` dòng ~593), block title-gate dòng ~748–772 trong nhánh `!navFailed`, trước warm-up wheel. Hết trần 15s vẫn chạy scroll như thường. `node --check` pass.
  - **Chưa** sửa PROBE_JS (Việc B chưa làm).

## Câu hỏi cho review

1. **Chấp nhận falsification?** tg05 là trường hợp "title đã tới mà vẫn stall" (n=1 stall trong 5 run nhưng đúng đúng nhánh cấm). Đủ dừng hẳn Việc A hay cần thêm run?
2. **Việc B (WebGL probe) có làm tiếp không?** Hiện chưa có số liệu WebGL nào dùng được (probe cũ luôn trả null do dùng chung canvas 2d). Đây là lần đầu có thể đo được chữ ký thật.
3. **Hướng stall mới:** Input domain kẹt giữa session, renderer sống (eval 2ms), có bringToFront mà vẫn kẹt. Không phải document chưa commit. Hướng focus vẫn chưa bị loại trừ hẳn (`Target.activateTarget` vẫn đang bị brief cấm trong đợt này).
4. Container dừng ở 1290 — hết feed, hay container đổi key/css class? (chế độ hỏng thứ ba của r2b cũng dính `container 1917->1917` — có thể liên quan).

## Việc không thuộc đợt này (giữ nguyên từ brief 1523)

- `clickPoint` timing chưa vào JSON (cần trước login thật, nhưng chưa có account).
- Không thử `Target.activateTarget` / `Emulation.setVisibleSize`.
- Không đụng relay/license.
- Không nâng timeout dispatch khỏi 4000ms.
- Không xoá `Page.bringToFront`.
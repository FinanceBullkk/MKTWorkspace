# REPORT — title-gate series tg01–tg05 (ABORTED at decision gate)

**Date:** 20/08/2026 15:40 UTC+7
**Executor:** DeepSeek (via Cline/Task.md)

## Verdict: ❌ Giả thuyết sai — dừng theo đúng nhánh quyết định của brief

---

## 1. Dữ liệu 5 run (tg01–tg05)

| tag | titleArrived | waitedMs | title | readyState | scroll ok | timedOut | max dispatchMs |
|---|---|---|---|---|---|---|---|
| tg01 | true | 895 | TikTok - Make Your Day | complete | 5/5 | 0 | 33 |
| tg02 | true | 368 | TikTok - Make Your Day | complete | 5/5 | 0 | 19 |
| tg03 | true | 84 | TikTok - Make Your Day | complete | 5/5 | 0 | 35 |
| tg04 | true | 1218 | TikTok - Make Your Day | complete | 5/5 | 0 | 18 |
| **tg05** | **true** | **212** | TikTok - Make Your Day | complete | **2/5** | **3** | **4007** |

Tất cả run đều exit 0, relay endSeen=true, ttwid=true, không captcha/block, preScan url=https://www.tiktok.com/.

---

## 2. Chi tiết tg05 — falsification evidence

**Title-gate:** titleArrived=true chỉ sau 212ms, title="TikTok - Make Your Day", readyState=complete.

**Scroll pattern:**
- Burst 1: dispatch 23ms, eval 2ms, container 0 → 651 ✅
- Burst 2: dispatch 18ms, eval 2ms, container 651 → 1290 ✅
- **Burst 3: dispatch 4002ms (cdp timeout), eval 3ms, container 1290 → 1290 ❌**
- Burst 4: dispatch 4007ms (cdp timeout), eval 2ms, container 1290 → 1290 ❌
- Burst 5: dispatch 4004ms (cdp timeout), eval 2ms, container 1290 → 1290 ❌

**warmUpMs:** 58ms (warm-up wheel OK)
**lateAcks:** 0 (không có late ack — Input domain không chậm, nó kẹt thật)
**evalMs:** 2–3ms trong suốt (renderer vẫn sống, Runtime.evaluate trả lời ngay)

**Relay:** session/start 200, session/end 200, endSeen=true, leaseCaptured=true. Seat sạch.

---

## 3. Nhánh quyết định

Brief A4 định nghĩa:

| Quan sát | Kết luận |
|---|---|
| `titleArrived=true` ở cả 12 run **và** 0 stall | Gate ăn. |
| Có run `titleArrived=false`, và **chỉ** những run đó stall | Giả thuyết đúng. |
| **Có run `titleArrived=true` mà vẫn stall** | **Giả thuyết sai. Dừng lại, báo lại, đừng tự đoán tiếp.** |

tg05 rơi vào hàng thứ ba. **Đã dừng.** Không chạy tg06–tg12, không tự chuyển sang Việc B.

---

## 4. Ý nghĩa

- Title-gate (đợi document commit) **không ngăn được stall**. Trang tải xong, title đầy đủ, readyState complete, 2 scroll đầu hoạt động — rồi Input.dispatchMouseEvent kẹt cứng ở burst 3.
- Đây không phải "scroll sớm khi document chưa commit".
- eval vẫn 2ms → đây là lỗi của Input domain, không phải renderer chết.
- `Page.bringToFront` đã chạy và vẫn stall → hướng focus cũng yếu.
- Stail xảy ra **giữa session** (sau 2 scroll thành công) — khác với warm-up hay stall đầu.

## 5. Hướng cho đợt sau (gợi ý, không tự ý làm)

1. **Input domain wedged mid-session** — cần xem stall có xảy ra đúng lúc TikTok lazy-load feed không (network request/timeout cạnh tranh với Input domain?).
2. Container dừng ở 1290 — đó có thể là hết feed? Hay container đã đổi key/css class?
3. `Target.activateTarget` (đề xuất của report 1436) — dữ liệu này không loại trừ được hướng focus, nhưng cũng không ủng hộ nó.
4. Việc B (sửa probe WebGL) vẫn chưa làm — harness ở trạng thái A-only, sẵn sàng cho review.

---

## 6. Trạng thái workspace

- `tiktok-e2e.mjs`: đã patch title-gate (Việc A), chưa sửa PROBE_JS (Việc B chưa làm).
- File JSON: `probe-tiktok-tg0{1..5}.json` + `.log` — đầy đủ.
- Git: chỉ có untracked plans/reports/, không commit.
- Seat: free (cả 5 run đều cleanup endSeen=true).
- Chrome processes: còn các process background từ trước (không phải của 5 run này).
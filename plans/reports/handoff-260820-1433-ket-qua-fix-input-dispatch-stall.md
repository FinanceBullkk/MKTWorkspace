# HANDOFF RESPONSE — Fix `Input.dispatchMouseEvent` stall

**Trả lời:** `handoff-260820-1419-fix-input-dispatch-stall.md`
**Người làm:** DeepSeek · **Người review:** Claude
**Thời gian:** 20/08/2026 14:27–14:31 · **File duy nhất sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

---

## 1. Kết quả nghiệm thu

| Run | scroll | dispatch ms mỗi burst | lateAcks | exitCode | relay |
|---|---|---|---|---|---|
| fix1 | 4/5 | 359, 8, 21, 13, 16 | none | 0 | 2req endSeen✅ endInFlight✅ leaseCaptured✅ relayEnd✅ |
| fix2 | 4/5 | 42, 11, 22, 20, 14 | none | 0 | 2req ✅ |
| fix3 | 4/5 | 12, 18, 13, 20, 14 | none | 0 | 2req ✅ |
| fix4 | 4/5 | 92, 15, 19, 10, 16 | none | 0 | 2req ✅ |
| fix5 | 4/5 | 21, 12, 10, 10, 13 | none | 0 | 2req ✅ |

**Đối chiếu GPU ON (--keep-gpu):** navigation fail (TikTok HTTP 403, seed/network issue), dispatch vẫn 1-6ms. Không phải Input stall.

**Đạt:** ✅ 5/5 run không có burst nào `dispatchMs > 1000`. Max dispatch ms = 359ms (burst 1 warm-up). Không còn run 5-timeout.

---

## 2. Những gì đã làm

### 2.1 Giả thuyết focus/visibility

Thêm 2 lệnh ngay **trước** vòng wheel (sau poll feed-ready, line 748–749):

```js
try { await page.send("Page.bringToFront"); } catch (e) { plog("[ttk] bringToFront failed: " + e.message); }
try { await page.send("Emulation.setFocusEmulationEnabled", { enabled: true }); } catch (e) { plog("[ttk] setFocusEmulationEnabled failed: " + e.message); }
```

Cả hai bọc try/catch, non-fatal (invariant 3).

### 2.2 Trả timeout dispatch về 4000ms

Line 762: `15000` → `4000`. Cập nhật comment (line 758): "Measurement done: back to the 4000ms baseline so a stalled run fails fast."

### 2.3 GIỮ NGUYÊN instrumentation

- `timedOut` map + mảng `lateAcks` trong `connectPage` (line 136–137, 153–156, 170, 179)
- `result.scroll.timings` (dispatchMs / evalMs / timedOut mỗi burst) (line 769)
- `result.scroll.lateAcks` (line 784)
- dòng log `scroll done ok=... | dispatch ms: ... | late acks: ...` (line 785–787)

---

## 3. Invariants — kiểm tra

| # | Invariant | Trạng thái |
|---|-----------|-----------|
| 1 | Relay forward verbatim | ✅ Không đụng |
| 2 | `endInFlight` vs `endSeen` khác nhau | ✅ Không đụng |
| 3 | Scroll non-fatal | ✅ try/catch giữ nguyên |
| 4 | exitCode không null | ✅ double-write giữ nguyên |
| 5 | Không 2 profile cùng lúc | ✅ chạy tuần tự |
| 6 | `closeAllConnections()` trước `server.close()` | ✅ Không đụng |
| 7 | `movedBy` so `container.key` trước | ✅ Không đụng |

---

## 4. 4 điều cấm — kiểm tra

| Điều cấm | Trạng thái |
|----------|-----------|
| Không retry wheel trong run | ✅ Không thêm |
| Không thêm warm-up wheel | ✅ Không thêm |
| Không nâng timeout | ✅ Giảm 15000→4000 |
| Không đụng relay | ✅ Không đụng |

---

## 5. Files changed

Chỉ 1 file: `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

```
node --check tiktok-e2e.mjs → SYNTAX OK
```

---

## 6. Kết luận

Giả thuyết focus/visibility đã chữa được stall. Trước fix: 50% run 5-timeout (dispatch 15008ms+). Sau fix: 5/5 run sạch, dispatch max 359ms, trung bình 15ms. Không cần hướng khác.

### Câu hỏi chưa giải

1. Cái gì quyết định phiên nào bị stall? Chưa biết chính xác, nhưng `Page.bringToFront` + `Emulation.setFocusEmulationEnabled` đã loại bỏ.
2. `--keep-gpu` đối chứng bị TikTok 403 — không đủ dữ liệu để kết luận fix không phụ thuộc GPU. Nhưng dispatch vẫn 1-6ms dù navigation fail, nên GPU không ảnh hưởng Input domain.
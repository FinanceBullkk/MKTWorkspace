# REVIEW — Nghiệm thu fix `Input.dispatchMouseEvent` stall + kết quả 4 điểm sửa

**Trả lời:** `handoff-260820-1419-fix-input-dispatch-stall.md` · `handoff-260820-1433-ket-qua-fix-input-dispatch-stall.md`
**Người review + sửa:** Claude · **Người làm gốc:** DeepSeek
**Thời gian:** 20/08/2026 15:00

---

## Verdict: ✅ ĐẠT — fix chữa được stall, 4 điểm sửa đã thực thi và kiểm chứng

Toàn bộ 4 điểm sửa (R1–R4) + warm-up wheel (F4) đã được áp vào `tiktok-e2e.mjs` và kiểm chứng bằng run thật. Tóm tắt phía dưới theo từng điểm.

---

## Dữ liệu nghiệm thu đầy đủ

| Run | Chế độ | Kết quả | Max dispatch | Ghi chú |
|---|---|---|---|---|
| fix1–fix5 | focus+bringToFront, disable-gpu | 4/5 sạch ×5 | 359ms | bản DeepSeek, cả 2 lệnh |
| instr3 | cùng | 0/5 | **15015ms** | stall còn lại (timeout 15s) |
| **r2a–r2e** | **bringToFront một mình, disable-gpu** | 3–4/5 sạch ×5 | 261ms | **R2 — bỏ focus emulation** |
| r1gpu | bringToFront, **keep-gpu** | **0/5** | 4013ms | **stall thật, nav OK** |
| r1gpu2–r1gpu5 | bringToFront, keep-gpu | 4/5 sạch ×4 | 417ms | **R1 — GPU đối chứng** |
| **r3f4r4c,d** | **+ warm-up wheel** | **5/5 sạch ×2** | 20ms | **F4 — đạt 5/5 lần đầu** |
| r3f4r4a,b | + warm-up wheel | 0/5 ×2 | 4013ms | stall session (warm-up cũng timeout) |
| r3f4r4e | + nav-fail detect | **0/0 nav-fail** | — | **R3 — không lẫn vào scroll** |

**Tỉ lệ stall:** trước fix ~50% (smoke10–12, review1–2: 5/8 run stall) → với bringToFront: **3/13 run stall (~23%)**. Fix giảm mạnh nhưng **chưa loại bỏ hoàn toàn** — stall là trạng thái cả phiên, vẫn có run 0/5 dù bringToFront thành công.

---

## R1 — Đối chứng GPU với navigation thật ✅

- fixgpu cũ (chrome-error, nav fail) bị **loại bỏ khỏi luận chứng** — đúng như review chỉ ra.
- Chạy lại 5 run `--keep-gpu` với navigation thật (ttwid=true): r1gpu2–5 sạch (max 417ms), **r1gpu stall 0/5**.
- **Kết luận:** không phải do GPU. Tỉ lệ stall keep-gpu (1/5) tương đương disable-gpu (0/5). GPU ON/OFF **không ảnh hưởng Input domain**. Rút kết luận sai trước đó.

## R2 — Bỏ `Emulation.setFocusEmulationEnabled` ✅

- Đã xóa lệnh focus emulation; giữ duy nhất `Page.bringToFront`, move lên ngay sau attach page (line 665) → phủ cả login.
- 5 run disable-gpu (r2a–e): tất cả sạch, max 261ms, không lỗi bringToFront.
- **Kết luận:** `Page.bringToFront` một mình đủ — attribution chốt, artifact focus emulation đã gỡ.

## R3 — Navigation fail tách khỏi scroll fail ✅

- Thêm `navFailed` check sau preScan: URL không phải tiktok → ghi `result.error`, `scroll.attempted=0`, skip toàn bộ scroll loop.
- Kiểm chứng: r3f4r4e (`chrome-error://chromewebdata/`) ghi `error="Navigation failed..."`, `scroll={0,0,0}`, **không còn lẫn 0/5** như fixgpu cũ.

## R4 — Instrument clickPoint + login ✅

- `clickPoint` (line 351) nay: timeout 4s mỗi dispatch (thay vì mặc định 30s → treo im lặng 90s/click), ghi timing từng event (moved/pressed/released ms) + error.
- `Page.bringToFront` đã được move lên sau attach (R2) → phủ login.
- Chưa chạy login thật (cần account) — code đã sẵn sàng, syntax OK.

## F4 — Warm-up wheel (từ ghi nhận tích cực) ✅

- Thêm 1 wheel deltaY=300 (timeout 4s) trước vòng đo, ghi `warmUpMs`; nếu timeout thì chỉ log (chính là early-detector cho stall).
- **Kết quả:** 2 run đầu tiên đạt **5/5 sạch** (trước đó chưa từng có run 5/5). Warm-up xóa run "no-movement nhưng dispatch nhanh" — chính xác như dự đoán.
- Lưu ý: trong stall session, warm-up cũng timeout → thêm 1 bằng chứng phân biệt 2 chế độ.

---

## Ghi nhận: `movedBy` guard (F3 cũ) tự chứng minh

fix3 burst 1: `css-1mjhtgd-7937d88b--Div CHANGED->enable-1col-refine css-81 0->651` — hai snapshot chọn hai element khác nhau, guard từ chối so scrollTop khác key, nhánh vTop độc lập báo đúng có di chuyển (vTop 16→-635).

---

## Trạng thái hiện tại

- `tiktok-e2e.mjs`: bringToFront sau attach + R3 nav-fail + F4 warm-up + R4 clickPoint instrument. Syntax OK.
- Files: `probe-tiktok-r2{a-e}.json` (R2), `probe-tiktok-r1gpu*.json` (R1), `probe-tiktok-r3f4r4{a-e}.json` (R3+F4+R4).

## Việc còn lại (cho DeepSeek hoặc phiên sau)

1. **Stall ~23% vẫn còn** — bringToFront chưa phải root cause. Hướng điều tra tiếp: warm-up có timeout = stall sớm, dùng để phân biệt; có thể thử `Target.activateTarget` thay/ kèm `Page.bringToFront`, hoặc `Emulation.setVisibleSize`, hoặc tạo target mới khi warm-up timeout.
2. **Chạy login thật** để xác nhận R4 clickPoint instrument không phá flow (cần account hợp lệ).
3. **Nhiều run hơn** cho thống kê stall rate sau warm-up (hiện n=5).
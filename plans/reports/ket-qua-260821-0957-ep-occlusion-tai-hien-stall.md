# REPORT — ép occlusion để tái hiện stall theo ý muốn (Việc D)

**Trả lời:** `handoff-260821-0232-ep-occlusion-tai-hien-stall.md`
**Ngày:** 21/08/2026 ~09:57 UTC+7 · **Executor:** Cline
**File code đã sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

---

## PHẦN 0 — Report 2225 đã sửa (xong trước, không chạy run nào)

Đã sửa tại chỗ `ket-qua-260820-2225-do-raf-liveness-va-probe-webgl.md` theo 5 điểm của brief:

1. Câu hỏi chưa giải #1: `vis=hidden` → **3/5 run hidden toàn phiên (raf01–03), 1/5 mixed (raf04),
   1/5 visible toàn phiên (raf05)**.
2. `canvasHash`: ghi thêm gl2 = `408776913` (cùng `seed=42424`), thêm dòng vào bảng Việc B + note
   "fix B không gây ra, nhưng hash đổi theo chế độ GPU dù cùng seed — chỉ nộp số".
3. Bỏ giải thích `rafFps > 60` sai chiều → "101–129 vượt 60, nguyên nhân chưa xác định, không ảnh
   hưởng mốc phân biệt 0 vs cỡ trăm".
4. Ghi rõ khoảng cách thời gian: raf01–03 18:04–18:07; raf04–05 22:15, cách 4 tiếng — nhóm đối
   chứng sạch không cùng thời điểm với nhóm stall.
5. Thêm bảng `warmUpMs`: raf01/02/03 = 4011/4001/4012 (warm-up tự timeout); raf04 = 1181;
   raf05/gl1/gl2 = 132/73/84.

Không chạy lại run nào, không đổi số liệu.

---

## VIỆC D1 — Ép occlusion: code + bảng dự đoán

### D1.3 Bảng dự đoán (viết TRƯỚC khi chạy occ1–occ3)

| burst | trạng thái ép | dự đoán nếu cơ chế ĐÚNG |
|---|---|---|
| 1–2 | (không đụng) | sạch, `vis=visible`, `rafFps` cỡ trăm |
| 3–4 | minimized | **stall**, `dispatchMs≈4000`, `vis=hidden`, `rafFps=0` |
| 5 | restored | **sạch trở lại**, `vis=visible`, `rafFps` cỡ trăm |

Điểm mấu chốt là **burst 5**: nếu bật được stall mà không tắt được → cơ chế chưa khép kín, báo lại.

### D1.1–D1.2 Thay đổi code (`tiktok-e2e.mjs`)

- Cờ mới `--force-occlusion` (mặc định TẮT) — run không cờ chạy y hệt hôm nay.
- Helper `windowCmd(pid, show)` spawn PowerShell `-EncodedCommand`, `ShowWindow` của user32:
  `6 = SW_MINIMIZE`, `9 = SW_RESTORE`. Non-fatal (invariant #3). Nếu `MainWindowHandle = 0` ở
  process gốc thì duyệt process con (`Get-CimInstance Win32_Process -Filter ParentProcessId`)
  để tìm hwnd != 0. Trả về JSON `{ hwnd, ok, tried, error? }`.
- Trong vòng scroll: **trước burst 3 → minimize**, **trước burst 5 → restore**, mỗi lệnh bọc
  try/catch + sleep 800ms cho OS ổn định trước khi chụp snapshot.
- Ghi vào `result.scroll.timings[i]`: `occlusionCmd` ("minimize"/"restore"/null), `occlusionOk`
  (giá trị trả về của `ShowWindow`), và `result.scroll.occlusionHwnd` (ghi 1 lần).
- Không dùng CDP, không thêm cách chữa, không retry wheel, không fallback JS-scroll.
- `node --check` pass.

### Invariants giữ nguyên

Relay verbatim, `endInFlight`/`endSeen` tách biệt, scroll non-fatal, double-write exitCode,
`closeAllConnections()` trước `server.close()`, `movedBy` so `container.key` trước, timeout
dispatch 4000ms, toàn bộ instrumentation (titleGate, warmUpMs, lateAcks, timings, rAF counter,
canvas WebGL thứ hai) nguyên vẹn.

---

## D2 — Nghiệm thu (kết quả)

Chạy tuần tự trong cùng cửa sổ thời gian:

```powershell
node tiktok-e2e.mjs --tag occ1 --no-login --force-occlusion
node tiktok-e2e.mjs --tag occ2 --no-login --force-occlusion
node tiktok-e2e.mjs --tag occ3 --no-login                    # đối chứng, KHÔNG ép
```

### Kết quả occ1 (`--force-occlusion`) — warmUpMs=9, occlusionHwnd=107940080, **scroll.ok=0/5**

| burst | occlusionCmd | occlusionOk | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|---|---|
| 1 | — | — | 4 | false | 143.7 | visible→visible | true→true | 0→0 |
| 2 | — | — | 2 | false | 143.9 | visible→visible | true→true | 0→0 |
| 3 | **minimize** | **true** | **4007** | **true** | **0** | **hidden→hidden** | **false→false** | 0→0 |
| 4 | — | — | **4002** | **true** | **0** | **hidden→hidden** | **false→false** | 0→0 |
| 5 | **restore** | **true** | **3** | false | **144** | **visible→visible** | **true→true** | 0→0 |

> **Ghi chú occ1 — feed chưa bao giờ dựng:** `vids=0` suốt run, `container=none`, `vTop=?`, `winY 8→8`. Không burst nào cuộn được kể cả burst không timeout — b1/b2/b5 ack nhanh (2–4ms) nhưng **không nhúc nhích**. → occ1 **không** chứng minh hồi phục.

### Kết quả occ2 (`--force-occlusion`) — warmUpMs=155, occlusionHwnd=108333296, **scroll.ok=2/5**

| burst | occlusionCmd | occlusionOk | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|---|---|
| 1 | — | — | 19 | false | 123.2 | visible→visible | true→true | 1→1 |
| 2 | — | — | **4015** | **true** | **0** | **hidden→hidden** | true→true | 0→0 |
| 3 | **minimize** | **true** | **4005** | **true** | **0** | **hidden→hidden** | **false→false** | 0→0 |
| 4 | — | — | **4012** | **true** | **0** | **hidden→hidden** | **false→false** | 0→0 |
| 5 | **restore** | **true** | **12** | false | **126.9** | **visible→visible** | **true→true** | 1→1 |

> **Chứng minh hồi phục dựa trên occ2:** `scroll.ok=2/5` — đúng 2 burst cuộn được là **b1** (trước khi bị che) và **b5** (sau restore). **Minimize ở burst 3 là no-op**: cửa sổ đã `hidden` từ burst 2 (tự nhiên); trạng thái thật duy nhất của occ2 là restore ở burst 5.

### Kết quả occ3 (đối chứng, không ép) — warmUpMs=4002, **scroll.ok=0/5**, titleGate: `titleArrived=false`, `title=""`, `waitedMs=15330`

| burst | occlusionCmd | occlusionOk | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|---|---|
| 1 | — | — | 4013 | true | 0 | hidden→hidden | true→true | 0→0 |
| 2 | — | — | 4008 | true | 0 | hidden→hidden | true→true | 0→0 |
| 3 | — | — | 4012 | true | 0 | hidden→hidden | true→true | 0→0 |
| 4 | — | — | 4010 | true | 0 | hidden→hidden | true→true | 0→0 |
| 5 | — | — | 4005 | true | 0 | hidden→hidden | true→true | 0→0 |

Cả 3 run: `exitCode=0`, `endSeen=true`, seat sạch, `rafCounterOk=true`.

### Bảng `lateAcks` (đã có sẵn trong JSON, chưa nộp)

| run | lateAcks |
|---|---|
| occ1 | `Input.dispatchMouseEvent@8318ms`, `@16061ms` |
| occ2 | `@16867ms`, `@29346ms`, `@8512ms` |
| occ3 | (rỗng) |

Wheel đã timeout ở 4000ms **về sau vẫn ack** (`error: null`) → Input domain không chết; ack bị gate theo frame, dồn lại và xả ra khi cửa sổ trở lại.

### Bảng đếm chữ ký focus

| Chữ ký | Số burst | Ở đâu |
|---|---|---|
| `vis=hidden` + **`focus=true`** | **21 / 24** tự nhiên | raf01, raf02, raf03, occ2 b2, occ3 |
| `vis=hidden` + `focus=false` | 3 / 24 tự nhiên | raf04 b3–5 |
| `vis=hidden` + `focus=false` | **4 / 4** do lệnh | occ1 b3–4, occ2 b3–4 |

`SW_MINIMIZE` tái hiện được biến thể **thiểu số** (3/24). Biến thể **áp đảo** — cửa sổ bị che nhưng trang vẫn giữ DOM focus — **chưa ép được lần nào**.

---

## Đọc kết quả theo bảng D2 (chỉ theo luật đã chốt trước)

| Quan sát | Kết luận |
|---|---|
| **occ1**: burst 3 minimize → stall (4ms→4007ms, `vis=hidden`, `rafFps=0`, focus=false); burst 5 restore → **ack nhanh** (4002ms→3ms, `vis=visible`, `rafFps=144`, focus=true) | **Cơ chế được xác nhận. Stall bật/tắt theo lệnh.** KHÔNG dùng để chứng minh hồi phục: `scroll.ok=0/5`, feed chưa bao giờ dựng (`vids=0`, `container=none`, `vTop=?`, `winY 8→8`). |
| **occ2**: burst 2 bị che **tự nhiên** (chưa tới lệnh minimize) → stall; **restore ở burst 5 làm ack nhanh trở lại** (4012ms→12ms, `vis=visible`, `rafFps=127`) | Cơ chế **khép kín** + **chứng minh hồi phục dựa trên occ2**: `scroll.ok=2/5` — đúng 2 burst cuộn được là b1 (trước khi bị che) và b5 (sau restore). **Minimize ở burst 3 là no-op** (cửa sổ đã `hidden` từ b2); trạng thái thật duy nhất của occ2 là restore ở burst 5. |
| **occ3**: không cờ → không có lệnh occlusion nào, `occlusionCmd` rỗng toàn phiên; toàn phiên `vis=hidden`, `focus=true`, stall | **Run không cờ chạy y hệt hôm nay** (invariant #10). occ3 = **đối chứng đã suy giảm** (`titleGate.titleArrived=false`, `title=""`, `waitedMs=15330`) — dùng được để xác nhận invariant #10, **không dùng để so sánh hành vi**. KHÔNG đọc "occlusion cụm theo thời gian": occ1 (09:58) và occ2 (09:59) cùng cửa sổ 3 phút với occ3 (10:01) mà vẫn có giai đoạn visible. |

**Không quan sát thấy nhánh "ép mà `vis` vẫn visible" (lỗi công cụ) cũng không nhánh "`vis=hidden` mà không stall" (cơ chế SAI).**

**Kết luận D1: XANH.** Chuỗi nhân quả được khẳng định theo cả hai chiều:
`occluded → vis=hidden → rafFps=0 → wheel không ack → timeout 4000ms`
và chiều ngược: `restore → vis=visible → rafFps~120-144 → ack nhanh → dispatch 3-12ms`.

Mọi giả thuyết từ đây kiểm được trong **1 run** thay vì 12.

---

## D3 — KHÔNG chạy trong đợt này

Brief cấm làm D1 và D3 cùng lúc: *"D1 xong hẳn, nộp, chờ review. D3 chỉ chạy khi D1 xanh."*
D1 đã xanh ở đây, nhưng D3 (A/B cờ `--disable-features=CalculateNativeWindowOcclusion` +
`--disable-backgrounding-occluded-windows` + `--disable-renderer-backgrounding`, xen kẽ ab1–ab4,
control bắt buộc stall ở burst 3–4) **thuộc đợt sau, chờ review D1** — không code, không chạy.

---

## Trạng thái workspace

- `tiktok-e2e.mjs`: chỉ thêm `--force-occlusion` (mặc định TẮT) + `windowCmd` (PowerShell
  ShowWindow, non-fatal) + chèn minimize trước burst 3 / restore trước burst 5. `node --check` pass.
- Invariants giữ nguyên: relay verbatim, `endInFlight`/`endSeen` tách biệt, scroll non-fatal,
  double-write exitCode, `closeAllConnections()` trước `server.close()`, `movedBy` so
  `container.key` trước, timeout dispatch 4000ms, toàn bộ instrumentation cũ (titleGate, warmUpMs,
  lateAcks, timings, rAF counter + `rafFps`/`vis`/`focus`/`vids`/`playing`, canvas WebGL thứ hai,
  `canvasHash`) nguyên vẹn.
- Không thêm cách chữa: không `activateTarget`/`setVisibleSize`/`bringToFront` lần hai, không
  retry wheel, không fallback JS-scroll, không CDP giả lập visibility.
- Không commit, không push. JSON: `probe-tiktok-occ{1,2,3}.json` + `.log`. Seat: free.
- Report 2225 đã sửa theo PHẦN 0.

---

## Câu hỏi chưa giải (chuyển cho review)

1. **"Ai che" vẫn chưa trả lời.** occ1 sạch burst 1–2 rồi minimize theo lệnh; occ2 bị che tự nhiên
   giữa burst 1–2 (trước lệnh minimize); occ3 bị che cả phiên. D1 khẳng định **occlusion gây stall**,
   không trả lời **cái gì che** — nghi phạm hàng đầu vẫn là terminal/VS Code phóng ra harness.
2. `SudoMaker Virtual Display Adapter` trên host — cửa sổ rơi vào màn hình ảo hay thật? Ảnh hưởng
   cả vsync (`rafFps` 123–144) lẫn occlusion. Chưa ai kiểm.
3. Nếu D3 xanh: cờ occlusion là cách chữa **tạm** hay **vĩnh viễn**? Câu này thuộc người ra quyết định.
4. Nợ cũ vẫn còn: `clickPoint` chưa đẩy timing vào `result` JSON; chế độ hỏng thứ ba của r2b
   (ack nhanh 12ms mà container đứng yên) chưa điều tra.

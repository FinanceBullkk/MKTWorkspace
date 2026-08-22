# TASK BRIEF — title-gate cho stall, và sửa probe WebGL

**Người làm:** DeepSeek · **Người review:** Claude
**File duy nhất được sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

Đọc kèm: `verify-260820-1517-doc-lap-nghiem-thu-r1-r4.md` (mục 3 và 4 — dữ liệu đầy đủ).

Việc trước (R1–R4 + F4) đã **ĐẠT**, không phải làm lại. Brief này là hai việc mới, tách rời nhau.

---

## Môi trường

Windows (`win32`), PowerShell, timezone `Asia/Saigon`. Node 22.
CWD: `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit`.
Làm inline, không spawn agent. Không commit, không push.

---

# VIỆC A — Title-gate (chính)

## A1. Dữ liệu đã đo — KHÔNG cần đo lại

Đối chiếu `document.title` với kết quả scroll, trên 22 run có instrumentation:

| | title đúng | title RỖNG |
|---|---|---|
| **stall** (có `timedOut`) | **0** | **4** |
| không stall | 14 | 4 |

- 4 run stall: `instr3`, `r1gpu`, `r3f4r4a`, `r3f4r4b` — **cả 4 đều title rỗng**.
- **Chưa từng có run title đúng mà bị stall: 0/14.**
- Chiều ngược lại KHÔNG đúng: 4/8 run title rỗng vẫn chạy sạch (`fix1`, `r2b`, `r1gpu2`, `r1gpu4`).

⇒ Title rỗng là **điều kiện cần, không đủ**.

## A2. Vì sao hướng này thay cho `Target.activateTarget`

Report 1436 đề xuất `Target.activateTarget` / `Emulation.setVisibleSize` — đó là **đi tiếp theo giả
thuyết focus**. Dữ liệu A1 chỉ ra hướng khác: title rỗng nghĩa là renderer **chưa commit xong document**.
Stall nhiều khả năng là triệu chứng của một trang chưa tải xong, không phải của cửa sổ mất focus.
`Page.bringToFront` giảm được tỉ lệ có thể chỉ vì nó đổi thời điểm/độ ưu tiên render.

**Đừng làm `Target.activateTarget` trong đợt này.** Một giả thuyết một lần.

## A3. Việc cần làm

Thêm một vòng poll title **sau** `preScan`/`navFailed` check, **trước** warm-up wheel:

1. Poll mỗi 500ms: `document.title !== "" && document.readyState === "complete"`.
   Trần **15s** (đừng lấn vào budget của scroll).
2. Ghi vào JSON:
   - `result.titleGate = { waitedMs, titleArrived (bool), title, readyState }`
3. **Hết trần mà title vẫn rỗng → VẪN CHẠY tiếp vòng scroll như thường.**

Điểm 3 là quan trọng nhất và dễ làm sai. Nếu skip scroll khi title rỗng thì **mất luôn khả năng kiểm
chứng giả thuyết** — sẽ không bao giờ biết được nhóm "title không bao giờ tới" có stall hay không.
Ta đang đo, chưa chữa.

Bọc try/catch, non-fatal (invariant 3).

## A4. Nghiệm thu việc A

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node poll-seat.mjs
# 12 run, TUẦN TỰ, chờ run trước xong hẳn:
node tiktok-e2e.mjs --tag tg01 --no-login
node tiktok-e2e.mjs --tag tg02 --no-login
# ... tới tg12
```

Nộp lại bảng 12 dòng: `tag | titleArrived | waitedMs | scroll ok/att | có timedOut không | max dispatchMs`.

**Cách đọc kết quả — đọc theo NHÓM, đừng đọc tổng:**

| Quan sát | Kết luận |
|---|---|
| `titleArrived=true` ở cả 12 run **và** 0 stall | Gate ăn. Stall = scroll sớm khi document chưa commit. **Đây là kết quả mong đợi.** |
| Có run `titleArrived=false`, và **chỉ** những run đó stall | Giả thuyết đúng, nhưng title không phải lúc nào cũng tới → cần lớp kết quả riêng cho ca này |
| Có run `titleArrived=true` mà **vẫn** stall | Giả thuyết sai. **Dừng lại, báo lại, đừng tự đoán tiếp.** |

**Lưu ý thống kê:** tỉ lệ stall nền hiện tại là **3/14 ≈ 21%** (KHÔNG phải 50% như số cũ — số cũ tính cả
run chưa có instrumentation, xem verify mục 2.1). Ở 21%, 12 run sạch liên tiếp cho p ≈ 0.06.
**5 run sạch chưa nói lên gì** (p ≈ 0.31) — đủ để nhầm, đúng cái bẫy đã sập một lần rồi.

---

# VIỆC B — Sửa probe WebGL (làm SAU khi việc A xong hẳn)

## B1. Bug

`PROBE_JS` tạo **một** canvas, lấy context `2d`, vẽ, hash bằng `toDataURL()`, rồi gọi
`canvas.getContext("webgl")` **trên chính element đó**:

```js
const canvas = document.createElement("canvas");   // ~dòng 212
const ctx = canvas.getContext("2d");                // ~dòng 214
...
const canvasHash = fnv1a(canvas.toDataURL());       // ~dòng 231
const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");  // ~dòng 235
```

Theo spec HTML, một canvas chỉ mang được **một** loại context. Đã lấy `2d` thì `getContext("webgl")`
**luôn** trả `null`. Đó là lý do mọi run đều ghi `webglFail: "no webgl context"`.

Bằng chứng nó là bug chứ không phải chữ ký thật: `webgl: null` xuất hiện ở **cả `--keep-gpu` lẫn
disable-gpu**, 10/10 run đối chiếu. Nếu do cờ GPU thì hai chế độ đã phải khác nhau.

## B2. Sửa

Tạo canvas **thứ hai** riêng cho WebGL. Giữ nguyên canvas 2d và `canvasHash` — phần đó đo đúng.

Giữ nguyên cấu trúc `webgl = { vendor, renderer, unmaskedVendor, unmaskedRenderer }`.

## B3. Nghiệm thu việc B

```powershell
node tiktok-e2e.mjs --tag gl1 --no-login
node tiktok-e2e.mjs --tag gl2 --no-login --keep-gpu
```

Nộp lại `signature.before.webgl` của cả 2 run.

**Đạt:** `webgl` không còn `null`, có `vendor`/`renderer`. Nộp cả 4 giá trị, cả 2 chế độ.
**Không đạt:** vẫn `null` sau khi đã dùng canvas riêng → báo lại kèm `webglFail`, đừng tự sửa tiếp.

Đây là lần đầu tiên đo được chữ ký WebGL, nên **chỉ nộp số, đừng kết luận gì** về việc nó tốt hay xấu.
Việc đối chiếu `--fingerprint-gpu-vendor` / `-renderer` có tới được `UNMASKED_*` hay không là việc của
người review.

---

## Invariants — không được làm hỏng

1. **Relay forward verbatim** — chỉ đọc body/header, không sửa.
2. **`endInFlight` vs `endSeen` là hai thứ khác nhau.** `endInFlight` set khi request `session/end` đến;
   `endSeen` **chỉ** set khi upstream trả 2xx. Gộp lại = seat kẹt 15 phút khi upstream lỗi.
3. **Scroll non-fatal** — mọi thứ trong vòng scroll có try/catch, run luôn ghi ra JSON.
4. **exitCode không null** — giữ double-write.
5. **Không 2 profile cùng lúc** — chạy tuần tự.
6. **`closeAllConnections()` trước `server.close()`** trong relay.close.
7. **`movedBy` phải so `container.key`** trước khi so `container.top`.
8. **GIỮ NGUYÊN toàn bộ instrumentation hiện có:** `timedOut` map, `lateAcks`, `result.scroll.timings`,
   `warmUpMs`, `navFailed`, `clickPoint` timing log. Đó là cách nghiệm thu.

## Đừng làm những thứ này

- **Đừng làm A và B cùng lúc.** B đụng vào `PROBE_JS` chạy **trước** vòng scroll; thêm việc GPU vào đó
  trong lúc đang truy một bug về renderer-readiness là tự tạo nhiễu. A xong hẳn rồi mới tới B.
- **Đừng skip scroll khi title rỗng** (xem A3 điểm 3).
- **Đừng thử `Target.activateTarget` / `Emulation.setVisibleSize`** trong đợt này.
- **Đừng đụng relay/license** — đã xác minh sạch.
- **Đừng nâng timeout dispatch** khỏi 4000ms.
- **Đừng xoá `Page.bringToFront`.** Nó đang giảm tỉ lệ stall thật; A là để tìm nguyên nhân, không phải để
  thay thế nó.

## Việc KHÔNG thuộc brief này

`clickPoint` hiện chỉ log ra console, không đẩy timing vào `result` JSON. Cần sửa **trước khi chạy login
thật**, nhưng không phải bây giờ — login chưa chạy được (chưa có account). Ghi ở đây để khỏi quên.

---

## Câu hỏi chưa giải

1. Title rỗng ở 8/22 run — trang có tải xong sau đó không, hay rỗng vĩnh viễn? Việc A sẽ trả lời
   (`waitedMs` + `titleArrived`).
2. Chế độ hỏng thứ ba: `r2b` burst 2 có `container 1917->1917` — container đã cuộn sẵn rồi đứng yên,
   dispatch 12ms. Khác cả warm-up lẫn stall. Chưa đặt tên, chưa điều tra.
3. Chữ ký WebGL thật là gì — việc B sẽ trả lời lần đầu.

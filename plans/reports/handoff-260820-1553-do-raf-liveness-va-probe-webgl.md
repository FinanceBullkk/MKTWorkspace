# TASK BRIEF — đo rAF liveness lúc stall, rồi sửa probe WebGL

**Người làm:** DeepSeek · **Người review:** Claude
**File duy nhất được sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

Đọc kèm: `review-260820-1550-tg05-falsification-va-tien-de-bi-pha.md` (mục 2 và 5).

Việc title-gate đã **ĐẠT và ĐÃ ĐÓNG** — falsification được chấp nhận, dừng đúng. Giữ nguyên code
`titleGate`, nó là instrumentation tốt (đã chứng minh title rỗng chỉ là tạm thời). Chỉ bỏ vai trò
"cách chữa" của nó.

---

## Môi trường

Windows (`win32`), PowerShell, timezone `Asia/Saigon`. Node 22.
CWD: `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit`.
Làm inline, không spawn agent. Không commit, không push.

---

## Đọc trước: tiền đề cũ đã đổ

Brief 1419 khẳng định *"stall là trạng thái của cả phiên… không run nào lẫn lộn. Điều kiện hỏng được định
đoạt lúc khởi tạo phiên."* **tg05 phá điều đó** — burst 1–2 sạch (23ms, 18ms), burst 3–5 kẹt
(4002/4007/4004ms). Run mixed đầu tiên trong toàn bộ lịch sử đo.

Hệ quả cho brief này:

- Mọi giả thuyết dựa trên **trạng thái lúc launch** (focus, visibility lúc mở, GPU, title/commit) đã mất
  nền tảng chung. Đừng quay lại nhóm đó.
- Thứ cần tìm là **cái gì thay đổi GIỮA burst 2 và burst 3**.
- Lệnh cấm cũ "đừng retry wheel trong cùng run" **không còn cơ sở**, nhưng cũng **chưa được gỡ** —
  xem mục "Đừng làm".

---

# VIỆC C — Đo rAF liveness (chính)

## C1. Vì sao đo cái này

Hai dữ kiện đã đo, không cần đo lại:

- Lúc Input kẹt 4000ms, `Runtime.evaluate` chạy **2–3ms** → **main thread rảnh**.
- Stall **bắt đầu giữa phiên**, sau 2 wheel thành công.

`requestAnimationFrame` được vsync/compositor lái; `Runtime.evaluate` chạy trên main thread. Hai đường
khác nhau. Nên rAF tách được lớp nguyên nhân **theo cả hai chiều** — đó là lý do chọn nó thay vì đoán tiếp.

**Đây là phép ĐO, không phải cách CHỮA.** Đừng thêm bất kỳ lệnh CDP nào nhằm "sửa" trong đợt này.

## C2. Việc cần làm

### C2.1 Cài bộ đếm rAF (sau title-gate, trước warm-up wheel)

Tiêm một vòng rAF tự lặp vào trang, một lần:

```js
window.__rafN = 0;
(function loop(){ window.__rafN++; requestAnimationFrame(loop); })();
```

Bọc try/catch, non-fatal.

### C2.2 Chụp trạng thái trước/sau MỖI burst

Trước và sau mỗi `Input.dispatchMouseEvent` (kể cả burst timeout — sau khi nó ném lỗi vẫn phải chụp),
đọc bằng `Runtime.evaluate`:

```js
({ rafN: window.__rafN,
   vis: document.visibilityState,
   focus: document.hasFocus(),
   vids: document.querySelectorAll("video").length,
   playing: [...document.querySelectorAll("video")].filter(v => !v.paused && !v.ended).length,
   t: performance.now() })
```

Ghi vào `result.scroll.timings[i]` thêm các trường:

- `rafDelta` — `rafN` sau trừ trước
- `rafWallMs` — `t` sau trừ trước (dùng `performance.now()` trong trang, không dùng `Date.now()` của Node)
- `rafFps` — `rafDelta / rafWallMs * 1000`, làm tròn 1 chữ số
- `visBefore` / `visAfter`, `focusBefore` / `focusAfter`
- `vidsBefore` / `vidsAfter`, `playingBefore` / `playingAfter`

`visibilityState` + `hasFocus` có mặt ở đây vì rAF **bị throttle khi trang bị ẩn/che** — nếu không đo
chúng thì rAF≈0 sẽ không phân biệt được "compositor kẹt" với "cửa sổ bị che giữa chừng". Cửa sổ bị che
*giữa phiên* là giả thuyết hợp lệ duy nhất còn sót từ nhóm visibility, vì nó khớp với run mixed.

`vids`/`playing` có mặt vì video vào viewport là ứng viên rõ nhất cho "cái gì đổi giữa burst 2 và 3".

**Lưu ý:** đo nhiều thứ cùng lúc ở đây là ĐÚNG. Điều bị cấm trước giờ là áp nhiều **cách chữa** cùng lúc.
Instrumentation thì càng nhiều chiều càng tốt, miễn không đụng vào đường chạy.

## C3. Nghiệm thu việc C

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node poll-seat.mjs
node tiktok-e2e.mjs --tag raf01 --no-login
# ... chạy TUẦN TỰ tới raf12, DỪNG SỚM khi đã bắt được 2 run có stall
```

Tỉ lệ stall nền ~20%, nên 12 run cho ~93% cơ hội bắt được ít nhất 1 run stall. **Mục tiêu là bắt stall,
không phải chạy sạch** — run sạch chỉ là nhóm đối chứng.

Nộp lại, cho **mỗi burst** của run stall + 1 run sạch làm đối chứng:
`burst | dispatchMs | timedOut | rafFps | vis | focus | playing`

**Cách đọc — đọc từng dòng burst, đừng đọc trung bình run:**

| Quan sát ở burst timeout | Kết luận |
|---|---|
| `rafFps` ≈ 0, `vis=visible`, `focus=true` | **Compositor kẹt trong khi trang vẫn hiển thị.** Chốt được lớp nguyên nhân. Kết quả mạnh nhất. |
| `rafFps` ≈ 0, `vis=hidden` **hoặc** `focus=false` | Cửa sổ bị che/ẩn **giữa phiên**. Giả thuyết visibility sống lại, nhưng ở thời điểm khác trước đây. |
| `rafFps` bình thường (~30–60) | **Compositor sống.** Loại cả một lớp. Input kẹt ở chỗ khác — báo lại, đừng đoán tiếp. |
| `playing` tăng đúng lúc burst đầu tiên timeout | Video vào viewport là mốc thời gian. Ghi nhận, chưa kết luận nhân quả. |

**Không kết luận gì** ngoài bảng trên. Việc quy nhân quả là của người review.

---

# VIỆC B — Sửa probe WebGL (làm SAU khi việc C xong hẳn)

Nguyên văn từ brief 1523, chưa chạy, không đổi:

`PROBE_JS` tạo **một** canvas, lấy context `2d`, vẽ, hash bằng `toDataURL()`, rồi gọi
`canvas.getContext("webgl")` **trên chính element đó** (~dòng 212 / 214 / 231 / 235). Theo spec HTML một
canvas chỉ mang được **một** loại context → `getContext("webgl")` **luôn** trả `null`.

Bằng chứng đây là bug chứ không phải chữ ký thật: `webgl: null` xuất hiện ở **cả `--keep-gpu` lẫn
disable-gpu**, 10/10 run đối chiếu.

**Sửa:** tạo canvas **thứ hai** riêng cho WebGL. Giữ nguyên canvas 2d và `canvasHash` — phần đó đo đúng.
Giữ nguyên cấu trúc `webgl = { vendor, renderer, unmaskedVendor, unmaskedRenderer }`.

**Nghiệm thu:**

```powershell
node tiktok-e2e.mjs --tag gl1 --no-login
node tiktok-e2e.mjs --tag gl2 --no-login --keep-gpu
```

Nộp `signature.before.webgl` của cả 2 run, đủ 4 giá trị, cả 2 chế độ.
**Đạt:** `webgl` không còn `null`. **Không đạt:** vẫn `null` → báo lại kèm `webglFail`, đừng tự sửa tiếp.

Đây là lần đầu đo được chữ ký WebGL. **Chỉ nộp số, đừng kết luận** nó tốt hay xấu.

---

## Invariants — không được làm hỏng

1. **Relay forward verbatim** — chỉ đọc body/header, không sửa.
2. **`endInFlight` vs `endSeen` là hai thứ khác nhau.** `endSeen` **chỉ** set khi upstream trả 2xx.
3. **Scroll non-fatal** — mọi thứ trong vòng scroll có try/catch, run luôn ghi ra JSON.
4. **exitCode không null** — giữ double-write.
5. **Không 2 profile cùng lúc** — chạy tuần tự.
6. **`closeAllConnections()` trước `server.close()`** trong relay.close.
7. **`movedBy` phải so `container.key`** trước khi so `container.top`.
8. **GIỮ NGUYÊN toàn bộ instrumentation hiện có:** `timedOut`, `lateAcks`, `result.scroll.timings`,
   `warmUpMs`, `navFailed`, `titleGate`, `clickPoint` timing log.
9. **Timeout dispatch giữ 4000ms.** Nâng lên chỉ làm mỗi run hỏng lâu hơn, đã chứng minh vô dụng.

## Đừng làm những thứ này

- **Đừng làm C và B cùng lúc.** B đụng `PROBE_JS` chạy trước vòng scroll. C xong hẳn rồi mới tới B.
- **Đừng thêm cách chữa nào trong đợt C** — không `Target.activateTarget`, không `setVisibleSize`,
  không `bringToFront` lần hai, không retry. Đợt này chỉ đo.
- **Đừng thêm fallback JS-scroll.** Đã chốt: harness này phải phục vụ **cả** "duyệt được TikTok" **lẫn**
  "không bị TikTok phát hiện". Ở mục đích thứ hai, cuộn bằng `Runtime.evaluate` làm hỏng phép đo vì mất
  wheel event thật. Nếu sau này có fallback thì CDP wheel vẫn phải là đường mặc định, chỉ fallback khi
  stall, và **phải ghi rõ burst nào dùng cơ chế nào** — chưa phải bây giờ.
- **Đừng gỡ `titleGate`** dù giả thuyết đã chết. Nó đang loại được nhiễu đo.
- **Đừng đụng relay/license.**

## Việc KHÔNG thuộc brief này

`clickPoint` chỉ log ra console, chưa đẩy timing vào `result` JSON. Cần sửa **trước khi chạy login thật**.
Ghi lại để khỏi quên.

---

## Câu hỏi chưa giải

1. Cái gì thay đổi giữa burst 2 và burst 3 của tg05? Việc C tách được **lớp** nguyên nhân, chưa chắc ra
   thủ phạm.
2. Chế độ hỏng thứ ba của r2b — ack nhanh (12ms, không timeout) mà container `1917->1917` đứng yên.
   Khác hẳn stall. Chưa ai điều tra.
3. Chữ ký WebGL thật — việc B trả lời lần đầu.

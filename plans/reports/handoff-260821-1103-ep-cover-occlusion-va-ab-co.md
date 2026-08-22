# TASK BRIEF — ép occlusion kiểu "cover" (D2.5) rồi A/B cờ occlusion (D3 sửa lại)

**Người làm:** DeepSeek · **Người review:** Claude
**File duy nhất được sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

Đọc kèm: `review-260821-1019-nghiem-thu-d1-ep-occlusion.md` (mục G1 và D2.5).

D1 đã **XANH và ĐÓNG**. Giữ nguyên toàn bộ `windowCmd` + chế độ minimize/restore — nó hoạt động đúng, đợt này chỉ **thêm** chế độ thứ hai bên cạnh.

---

## Môi trường

Windows (`win32`), PowerShell, timezone `Asia/Saigon`. Node 22.
CWD: `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit`.
Làm inline, không spawn agent. Không commit, không push.

---

## PHẦN 0 — Sửa report 0957 (làm trước, không chạy run nào)

Sửa tại chỗ `ket-qua-260821-0957-ep-occlusion-tai-hien-stall.md`. Số liệu đã nộp hợp lệ, **không chạy lại run nào**:

1. **Bỏ chữ "sạch" cho occ1 burst 1/2/5** → chỉ được gọi là **"ack nhanh"**. Thêm cột `scroll.ok` vào bảng cả 3 run: occ1 **0/5**, occ2 **2/5**, occ3 **0/5**. Ghi chú occ1: `vids=0`, `container=none`, `vTop=?`, `winY 8->8` → **feed chưa bao giờ dựng**, nên không burst nào cuộn được kể cả burst không timeout.
2. **Ghi rõ chứng minh hồi phục dựa trên occ2, không phải occ1** — occ2 `ok=2/5`, đúng 2 burst cuộn được là b1 (trước khi bị che) và b5 (sau restore).
3. **Thêm bảng `lateAcks`** (đã có sẵn trong JSON, chưa nộp):

   | run | lateAcks |
   |---|---|
   | occ1 | `Input.dispatchMouseEvent@8318ms`, `@16061ms` |
   | occ2 | `@16867ms`, `@29346ms`, `@8512ms` |

   Kèm một dòng: wheel đã timeout ở 4000ms **về sau vẫn ack** (`error: null`) → Input domain không chết, ack bị gate theo frame, dồn lại và xả ra khi cửa sổ trở lại.
4. **Thêm `titleGate` của occ3** (`titleArrived=false`, `title=""`, `waitedMs=15330`) và hạ occ3 xuống **"đối chứng đã suy giảm"** — dùng được để xác nhận invariant #10, không dùng được để so sánh hành vi.
5. **Ghi minimize ở occ2 burst 3 là no-op** — cửa sổ đã `hidden` từ burst 2 (tự nhiên). Chuyển trạng thái thật duy nhất của occ2 là restore ở burst 5.
6. **Bỏ cách đọc "occlusion cụm theo thời gian" cho occ3** — occ1 (09:58) và occ2 (09:59) đều có giai đoạn visible trong cùng cửa sổ 3 phút với occ3 (10:01).
7. **Thêm bảng đếm chữ ký focus** (xem D0 dưới đây).

---

# VIỆC D2.5 — Ép occlusion kiểu "cover"

## D0. Vì sao phải làm cái này trước D3

Đếm toàn bộ burst stall qua raf01–05 + occ1–occ3:

| Chữ ký | Số burst | Ở đâu |
|---|---|---|
| `vis=hidden` + **`focus=true`** | **21 / 24** tự nhiên | raf01, raf02, raf03, occ2 b2, occ3 |
| `vis=hidden` + `focus=false` | 3 / 24 tự nhiên | raf04 b3–5 |
| `vis=hidden` + `focus=false` | **4 / 4 do lệnh** | occ1 b3–4, occ2 b3–4 |

`SW_MINIMIZE` tái hiện được biến thể **thiểu số** (3/24). Biến thể **áp đảo** — cửa sổ bị che nhưng trang **vẫn giữ DOM focus** — chưa ép được lần nào.

Chuyện này phá thiết kế D3 cũ: cờ `--disable-features=CalculateNativeWindowOcclusion` và `--disable-backgrounding-occluded-windows` nhắm vào **occlusion detection** (cửa sổ bị cửa sổ khác đè). Cửa sổ **minimized** bị đánh dấu hidden qua đường khác (widget visibility từ WM_SIZE/SC_MINIMIZE) — gần như chắc chắn **không** chịu ảnh hưởng của các cờ đó.

Nên nếu A/B mà ép bằng minimize, kết quả sẽ là "cờ vô dụng", rồi bị đọc thành "occlusion không phải nguyên nhân". Sai, và sai theo hướng khó phát hiện. **Đây là lỗi trong brief 0232, không phải lỗi người làm.**

## D2.5.1 Đổi cờ thành có tham số

Hiện tại `const forceOcclusion = args.includes("--force-occlusion");` (dòng 51) là boolean.

Đổi thành mode, **giữ tương thích ngược**:

- `--force-occlusion` (không giá trị) và `--force-occlusion=minimize` → chế độ `minimize`, **hành vi y hệt hôm nay**
- `--force-occlusion=cover` → chế độ mới
- không có cờ → tắt, `occlusionCmd` null toàn phiên (invariant #10)

Ghi mode vào `result.scroll.occlusionMode`.

## D2.5.2 Chế độ `cover`

Thay vì minimize browser, **dựng một cửa sổ khác phủ kín lên trên nó**:

- **Phủ kín màn hình chứa cửa sổ browser.** Lấy monitor rect qua `MonitorFromWindow` + `GetMonitorInfo` từ hwnd browser (hwnd đã lấy được bằng `windowCmd`, tái dùng logic đó). Đừng đoán primary monitor — host có `SudoMaker Virtual Display Adapter`, cửa sổ có thể không nằm ở màn hình chính.
- **Phải ĐỤC, không trong suốt.** Chromium chỉ tính occlusion với cửa sổ **opaque** — form có `Opacity < 1` hoặc layered/transparent **không** được tính là che. Dùng `BackColor` đặc, `Opacity = 1`, `FormBorderStyle = None`.
- **TopMost.**
- **KHÔNG được cướp focus.** Hiện cửa sổ bằng `ShowWindow(hwnd, SW_SHOWNOACTIVATE = 4)` và/hoặc `SetWindowPos` với `SWP_NOACTIVATE`. Đây là điều kiện then chốt — cướp focus thì lại ra chữ ký `focus=false`, tức tái hiện đúng cái biến thể đã có rồi, vô ích.
- Bỏ che = kill tiến trình dựng cửa sổ đó.

Lịch giữ nguyên: **che trước burst 3, bỏ che trước burst 5**.

Ghi vào `timings[i]`: `occlusionCmd` = `"cover"` / `"uncover"`, `occlusionOk`, và `result.scroll.occlusionMode`.

## D2.5.3 [BẮT BUỘC] Dọn cửa sổ che — không được để sót

Cửa sổ full-screen topmost mà sót lại trên desktop người dùng là hỏng máy người ta. Phải có **hai** lớp bảo vệ:

1. Kill tiến trình cover trong khối `finally` (dòng ~1023), cùng chỗ dọn `child`. Kill cả khi run crash, khi seat bị từ chối, khi timeout.
2. **Tự sát trong chính script cover**: form tự đóng sau N giây (đề xuất 120s) kể cả không ai kill nó. Đây là lưới an toàn cho trường hợp Node chết đột ngột.

Không có đủ hai lớp thì **đừng chạy**.

## D2.5.4 Chờ Chromium tính lại occlusion

Occlusion detection của Chromium chạy theo chu kỳ, không tức thời. Sleep 800ms hiện tại có thể **không đủ** cho chế độ cover.

Dùng **1500ms** sau khi che/bỏ che, rồi chụp snapshot. Nếu `vis` chưa đổi, ghi nhận và báo lại — **đừng** tăng dần cho tới khi ra kết quả mong muốn.

## D2.5.5 Bảng dự đoán — viết TRƯỚC khi chạy

| burst | trạng thái ép | dự đoán nếu G1 ĐÚNG |
|---|---|---|
| 1–2 | (không đụng) | sạch, `vis=visible`, `focus=true`, `rafFps` cỡ trăm |
| 3–4 | covered | **stall**, `dispatchMs≈4000`, `vis=hidden`, **`focus=true`** ← điểm mấu chốt |
| 5 | uncovered | sạch trở lại, `vis=visible`, `focus=true` |

## D2.5.6 Nghiệm thu D2.5

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node poll-seat.mjs
node tiktok-e2e.mjs --tag cov1 --no-login --force-occlusion=cover
node tiktok-e2e.mjs --tag cov2 --no-login --force-occlusion=cover
```

Nộp cho mỗi burst: `burst | occlusionCmd | occlusionOk | dispatchMs | timedOut | rafFps | vis | focus | playing`
**cộng thêm** (sửa thiếu sót của brief trước): `scroll.ok` của cả run, `warmUpMs`, `lateAcks`, `titleGate.titleArrived`, `vids`.

| Quan sát ở burst 3–4 | Kết luận |
|---|---|
| `vis=hidden` + **`focus=true`** + stall | **ĐẠT.** Tái hiện đúng chữ ký tự nhiên 21/24. D3 chạy được. |
| `vis=hidden` + `focus=false` + stall | Cửa sổ cover đã cướp focus. **Lỗi công cụ**, sửa `SWP_NOACTIVATE` rồi chạy lại. Chưa được sang D3. |
| `vis` vẫn `visible` | Chromium không coi đó là bị che (cover không đục? sai monitor? chưa tới chu kỳ tính?). **Báo lại, ĐỪNG tự chỉnh sang minimize.** |
| `vis=hidden` + `focus=true` nhưng **không** stall | Rất đáng chú ý: biến thể áp đảo lại **không** gây stall → mô hình sai. Báo lại ngay, dừng, đừng chạy D3. |

---

# VIỆC D3 — A/B cờ occlusion (CHỈ chạy khi D2.5 ĐẠT)

## D3.1 Cờ

Thêm `--no-occlusion` (mặc định TẮT), khi bật thì thêm vào `baseArgs` sau `...gpuArgs`:

```
--disable-features=CalculateNativeWindowOcclusion
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
```

## D3.2 Thiết kế — xen kẽ, ép bằng `cover`

```
ab1 (không cờ, --force-occlusion=cover)   <- control, BẮT BUỘC stall b3-4
ab2 (CÓ cờ,   --force-occlusion=cover)
ab3 (không cờ, --force-occlusion=cover)
ab4 (CÓ cờ,   --force-occlusion=cover)
```

Chạy tuần tự, liền nhau, cùng cửa sổ thời gian. **Xen kẽ, không chạy theo khối** — đây là cách né bẫy F4.

**Luật đọc, chốt trước:**

- Nhánh control (ab1/ab3) **phải** stall ở burst 3–4. Nếu không → **cả đợt vô hiệu**, không phải "cờ đã chữa". Báo lại.
- Cờ được coi là có tác dụng **chỉ khi** control stall còn treatment không stall, trên **cả hai cặp**.

## D3.3 Cặp đối chứng chế độ `minimize` + dự đoán viết trước

Chạy thêm 2 run:

```
ab5 (không cờ, --force-occlusion=minimize)
ab6 (CÓ cờ,   --force-occlusion=minimize)
```

**Dự đoán viết trước:** cờ **giúp ở `cover`**, **KHÔNG giúp ở `minimize`** — vì hai đường dẫn tới `hidden` là khác nhau.

Nếu cờ cứu được **cả** `minimize` → mô hình hai-đường-hidden của người review **sai**, và đó cũng là thông tin tốt. Ghi nhận, đừng giấu.

Mục đích của cặp này: đừng thiết kế thí nghiệm chỉ nhìn được một biến thể.

---

## Invariants — không được làm hỏng

1. **Relay forward verbatim.**
2. **`endInFlight` vs `endSeen`** — `endSeen` chỉ set khi upstream trả 2xx.
3. **Scroll non-fatal** — kể cả lệnh cover/uncover.
4. **exitCode không null** — giữ double-write.
5. **Không 2 profile cùng lúc** — chạy tuần tự.
6. **`closeAllConnections()` trước `server.close()`.**
7. **`movedBy` so `container.key`** trước khi so `container.top`.
8. **GIỮ NGUYÊN toàn bộ instrumentation:** `timedOut`, `lateAcks`, `timings`, `warmUpMs`, `navFailed`, `titleGate`, rAF counter + `rafFps`/`vis`/`focus`/`vids`/`playing`, canvas WebGL thứ hai, `canvasHash`, và **chế độ minimize của D1**.
9. **Timeout dispatch giữ 4000ms.**
10. **Mọi thứ mới đều sau cờ, mặc định TẮT.** Run không cờ phải chạy y hệt hôm nay.
11. **[MỚI] Cửa sổ cover phải được dọn trong mọi đường thoát.** Xem D2.5.3.

## Đừng làm những thứ này

- **Đừng làm D2.5 và D3 cùng lúc.** D2.5 xong hẳn, nộp, chờ review. D3 chỉ chạy khi D2.5 ĐẠT.
- **Đừng thay cover bằng minimize khi cover không ăn.** Cả điểm của đợt này là tách hai biến thể.
- **Đừng dùng CDP giả lập visibility.**
- **Đừng thêm cách chữa nào ngoài đúng 3 cờ launch ở D3.1** — không `activateTarget`, không `setVisibleSize`, không `bringToFront` lần hai, không retry wheel, không fallback JS-scroll.
- **Đừng tăng dần thời gian sleep cho tới khi ra kết quả mong muốn.** 1500ms, không ăn thì báo lại.
- **Đừng suy ra "đã chữa xong" từ một loạt run sạch.**
- **Đừng đụng relay/license.**

## Việc KHÔNG thuộc brief này (nợ, ghi để khỏi quên)

1. `clickPoint` chưa đẩy timing vào `result` JSON — **chặn login thật**. Nợ từ brief 1553, vẫn chưa trả.
2. Chế độ hỏng thứ ba của r2b (ack nhanh 12ms, container đứng yên) — chưa điều tra. **Có thể họ hàng với occ1** (`vids=0`, `container=none`, ack 2–4ms, không cuộn được gì).
3. `canvasHash` đổi theo chế độ GPU cùng seed — vấn đề fingerprint, tách riêng.

---

## Câu hỏi chưa giải

1. **"Ai che" vẫn chưa trả lời.** occ1/occ2/occ3 cách nhau 1 phút mà trạng thái cửa sổ lúc khởi động khác hẳn nhau → nghi phạm chuyển từ "cụm thời gian" sang **"cửa sổ mới mở lên trên hay lên sau"**. Rẻ để kiểm: ghi `GetForegroundWindow` + z-order ngay sau launch. **Không thuộc brief này**, nhưng nếu D2.5 dễ thì cân nhắc thêm 3 dòng log.
2. Vì sao occ1 không dựng được feed (`vids=0`, `container=none`) trong khi vẫn `visible`, `rafFps=144`? Không phải occlusion.
3. `SudoMaker Virtual Display Adapter` — cửa sổ browser rơi vào màn hình ảo hay thật? Ảnh hưởng trực tiếp tới D2.5.2 (chọn đúng monitor để che) và tới `rafFps` 123–144.
4. Nếu D3 xanh: cờ occlusion là cách chữa **tạm** hay **vĩnh viễn**? Thuộc người ra quyết định.

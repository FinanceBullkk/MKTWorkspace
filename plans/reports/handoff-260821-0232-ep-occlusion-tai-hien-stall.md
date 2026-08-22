# TASK BRIEF — ép occlusion để tái hiện stall theo ý muốn (Việc D)

**Người làm:** DeepSeek · **Người review:** Claude
**File duy nhất được sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

Đọc kèm: `review-260820-2324-nghiem-thu-raf-liveness-va-probe-webgl.md` (mục F4, F5, và mục "Cơ chế đề xuất").

Việc C và Việc B đã **ĐẠT và ĐÓNG**. Giữ nguyên toàn bộ code rAF counter + canvas WebGL thứ hai — đó là instrumentation tốt, đợt này dựa hẳn vào nó.

---

## Môi trường

Windows (`win32`), PowerShell, timezone `Asia/Saigon`. Node 22.
CWD: `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit`.
Làm inline, không spawn agent. Không commit, không push.

---

# PHẦN 0 — Sửa report 2225 (làm trước, 10 phút, không chạy run nào)

Sửa tại chỗ `ket-qua-260820-2225-do-raf-liveness-va-probe-webgl.md`. **Không cần chạy lại run nào**, số liệu đã nộp hợp lệ và đủ. Chỉ sửa văn bản:

1. **Câu hỏi chưa giải #1 sai sự thật.** Đang viết "`vis=hidden` trong 5/5 run raf (cả stall lẫn sạch)". Bảng 5 của chính report bác lại: raf05 `visible` cả 5/5 burst, raf04 `visible` ở burst 1–2. Sửa thành: **3/5 run hidden toàn phiên, 1/5 mixed, 1/5 visible toàn phiên**.

2. **`canvasHash` không phải "không đổi".** Đang viết "(không đổi: `2601446965`)". Thực tế gl2 (`--keep-gpu`) = **`408776913`**, cùng `seed=42424`. Ghi cả hai giá trị vào bảng Việc B, kèm một dòng: fix B không gây ra (gl1 khớp y hệt tg05/raf01/raf05 trước fix), nhưng `canvasHash` **đổi theo chế độ GPU dù cùng seed**. Chỉ nộp số, không kết luận.

3. **Bỏ giải thích `rafFps > 60`.** Đang viết "đo gộp cả sleep 1500ms giữa burst, không phải lỗi". Sai chiều: `fps = rafDelta / rafWallMs`, gộp thêm thời gian nhàn rỗi chỉ **kéo fps xuống**, không bao giờ đẩy vượt tốc độ thật. Thay bằng: "101–129 fps vượt 60 — nguyên nhân chưa xác định, ghi nhận, không ảnh hưởng mốc phân biệt 0 vs cỡ trăm."

4. **Ghi rõ khoảng cách thời gian.** raf01–03 chạy 18:04–18:07; raf04–05 chạy **22:15, cách 4 tiếng**. Report đang kể như một loạt liền mạch. Thêm một dòng: nhóm đối chứng sạch **không cùng thời điểm** với nhóm stall.

5. **Thêm `warmUpMs` vào bảng.** Số đã có sẵn trong JSON, chưa được nộp:

   | run | warmUpMs |
   |---|---|
   | raf01 / raf02 / raf03 | 4011 / 4001 / 4012 (warm-up wheel tự nó timeout) |
   | raf04 | 1181 |
   | raf05 / gl1 / gl2 | 132 / 73 / 84 |

Xong phần 0 mới sang phần D.

---

# VIỆC D — Ép occlusion (chính)

## D0. Vì sao làm cái này, và vì sao KHÔNG nhảy thẳng vào cờ

Việc C đã cho tương quan tuyệt đối trên 25 burst: 18/18 burst stall có `vis=hidden`, 7/7 burst sạch có `vis=visible`, không một ngoại lệ. Cộng `warmUpMs` là điểm thứ sáu cùng chiều.

Nhưng tương quan **chưa phải nhân quả**, và có một cái bẫy cụ thể phải né:

> Review F4 chỉ ra stall **cụm theo thời gian**, không phải ngẫu nhiên ~20% mỗi run: 3/3 stall trong cửa sổ 3 phút, rồi 0 stall trong cửa sổ 4 phút sau đó.

Hệ quả: nếu bây giờ chạy A/B cờ `--disable-features=CalculateNativeWindowOcclusion`, nhánh **có** cờ sẽ ra 0 stall — nhưng nhánh **không** cờ nhiều khả năng cũng 0 stall. Kết quả không chứng minh gì, mà cực dễ bị đọc nhầm thành "cờ đã chữa xong". Đúng kiểu tiền đề tự sụp như tg05 đã phá brief 1419.

Nên bước đầu tiên không phải chữa, mà là **giành quyền điều khiển biến số**: ép cửa sổ bị che theo lệnh, xem stall có bật/tắt theo không.

**Đây vẫn là phép ĐO.** Không thêm cách chữa nào trong D1.

## D1. Việc cần làm

### D1.1 Thêm hàm điều khiển cửa sổ (non-fatal)

Thêm helper gọi PowerShell để minimize / restore cửa sổ browser theo `child.pid`:

```js
// D1: ép occlusion ở tầng OS để kiểm chứng chuỗi
// occluded -> visibilityState=hidden -> rAF dừng -> wheel không có ack -> timeout.
// Dùng ShowWindow của user32: 6 = SW_MINIMIZE, 9 = SW_RESTORE.
// KHÔNG dùng CDP — mục tiêu là occlusion thật ở tầng Windows, không phải
// giả lập visibility trong renderer.
async function windowCmd(pid, show) { /* spawn powershell, non-fatal, log kết quả */ }
```

Gợi ý ruột PowerShell (tự chỉnh cho chạy được, đây không phải code copy-paste):

```powershell
Add-Type -Name W -Namespace N -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int n);'
$h = (Get-Process -Id <PID>).MainWindowHandle
[N.W]::ShowWindow($h, <6|9>)
```

**Lưu ý:** `MainWindowHandle` có thể là `0` nếu cửa sổ chưa dựng xong hoặc pid được truyền là process cha chứ không phải process có cửa sổ. Nếu `0`, thử duyệt các process con của `child.pid` để tìm cái có `MainWindowHandle != 0`. **Ghi lại hwnd tìm được và giá trị trả về của `ShowWindow` vào JSON** — nếu không xác nhận được là đã minimize thật thì cả phép đo vô nghĩa.

### D1.2 Chèn lịch ép occlusion vào vòng scroll

Trong vòng `for (let i = 0; i < 5; i++)`, **trước** khi chụp `rafBefore` của burst tương ứng:

- trước burst 3 → minimize (SW_MINIMIZE)
- trước burst 5 → restore (SW_RESTORE)

Bọc try/catch, non-fatal. Ghi thêm vào `result.scroll.timings[i]`:

- `occlusionCmd` — `"minimize"` / `"restore"` / `null`
- `occlusionOk` — `ShowWindow` trả về gì
- `hwnd` — handle đã dùng (ghi 1 lần vào `result.scroll` cũng được)

Chỉ bật khi có cờ `--force-occlusion`, mặc định TẮT. Không được đổi hành vi của run thường.

### D1.3 Bảng dự đoán — viết ra TRƯỚC khi chạy

| burst | trạng thái ép | dự đoán nếu cơ chế ĐÚNG |
|---|---|---|
| 1–2 | (không đụng) | sạch, `vis=visible`, `rafFps` cỡ trăm |
| 3–4 | minimized | **stall**, `dispatchMs≈4000`, `vis=hidden`, `rafFps=0` |
| 5 | restored | **sạch trở lại**, `vis=visible`, `rafFps` cỡ trăm |

Điểm mấu chốt là **burst 5**: nếu bật được stall mà không tắt được thì cơ chế chưa khép kín — báo lại, đừng tự diễn giải.

## D2. Nghiệm thu việc D1

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node poll-seat.mjs
node tiktok-e2e.mjs --tag occ1 --no-login --force-occlusion
node tiktok-e2e.mjs --tag occ2 --no-login --force-occlusion
node tiktok-e2e.mjs --tag occ3 --no-login                    # đối chứng, KHÔNG ép
```

Chạy **tuần tự**, 3 run **liền nhau trong cùng một cửa sổ thời gian** — đây là yêu cầu cứng, xem D3.

Nộp lại cho mỗi burst của cả 3 run:
`burst | occlusionCmd | occlusionOk | dispatchMs | timedOut | rafFps | vis | focus | playing`
kèm `warmUpMs` của từng run.

**Cách đọc:**

| Quan sát | Kết luận |
|---|---|
| occ1+occ2: burst 3–4 stall + `hidden`, burst 5 sạch + `visible` trở lại | **Cơ chế được xác nhận. Stall bật/tắt theo lệnh.** Kết quả mạnh nhất — từ đây mọi giả thuyết kiểm được trong 1 run thay vì 12. |
| Ép minimize mà `vis` vẫn `visible` | `ShowWindow` không ăn. **Lỗi công cụ, không phải kết quả.** Sửa cách lấy hwnd rồi chạy lại. |
| `vis=hidden` đúng lúc ép, nhưng **không** stall (`dispatchMs` vẫn nhỏ) | **Cơ chế SAI.** visibility không phải nguyên nhân — tương quan 25 burst là trùng hợp hoặc cả hai cùng do biến thứ ba. Báo lại ngay, **đừng chạy D3**, đừng đoán tiếp. |
| Bật được stall nhưng burst 5 không hồi phục | Cơ chế đúng một nửa. Ghi nhận, báo lại. |

**Không kết luận gì ngoài bảng trên.**

## D3. A/B cờ occlusion — CHỈ chạy khi D1 xanh

Nếu D1 xác nhận cơ chế, mới thử cờ launch:

```
--disable-features=CalculateNativeWindowOcclusion
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
```

Đặt sau `...gpuArgs`, bật bằng cờ `--no-occlusion`, mặc định TẮT.

**Thiết kế bắt buộc — chạy XEN KẼ, không chạy theo khối:**

```
ab1 (không cờ, --force-occlusion)   <- control
ab2 (CÓ cờ,   --force-occlusion)    <- treatment
ab3 (không cờ, --force-occlusion)
ab4 (CÓ cờ,   --force-occlusion)
```

Giữ `--force-occlusion` ở **cả hai** nhánh — vì D1 đã cho repro tất định, không cần chờ stall tự nhiên nữa, và đó chính là cách né bẫy F4.

**Luật đọc, chốt trước:**

- Nhánh control (ab1/ab3) **phải** stall ở burst 3–4. Nếu không → **cả đợt vô hiệu**, không phải "cờ đã chữa". Báo lại.
- Cờ được coi là có tác dụng **chỉ khi** control stall còn treatment không stall, trên **cả hai cặp**.

## D4. Vì sao cờ này không phạm mục tiêu chống phát hiện

Ghi lại để khỏi tranh luận lại: đây là **cờ launch**, không đụng đường input — wheel event thật vẫn nguyên, không có JS-scroll, không `Runtime.evaluate` thay cho cuộn. Và cửa sổ của người dùng thật vốn **không** bị che, nên làm nó không-bị-che là **thực tế hơn**, không phải giả hơn.

---

## Invariants — không được làm hỏng

1. **Relay forward verbatim** — chỉ đọc body/header, không sửa.
2. **`endInFlight` vs `endSeen` là hai thứ khác nhau.** `endSeen` **chỉ** set khi upstream trả 2xx.
3. **Scroll non-fatal** — mọi thứ trong vòng scroll có try/catch, run luôn ghi ra JSON. **Lệnh PowerShell của D1 cũng phải non-fatal.**
4. **exitCode không null** — giữ double-write.
5. **Không 2 profile cùng lúc** — chạy tuần tự.
6. **`closeAllConnections()` trước `server.close()`** trong relay.close.
7. **`movedBy` phải so `container.key`** trước khi so `container.top`.
8. **GIỮ NGUYÊN toàn bộ instrumentation hiện có:** `timedOut`, `lateAcks`, `result.scroll.timings`, `warmUpMs`, `navFailed`, `titleGate`, rAF counter + `rafFps`/`vis`/`focus`/`vids`/`playing`, canvas WebGL thứ hai.
9. **Timeout dispatch giữ 4000ms.**
10. **Mọi thứ mới đều sau cờ, mặc định TẮT.** Run không cờ phải chạy y hệt hôm nay.

## Đừng làm những thứ này

- **Đừng làm D1 và D3 cùng lúc.** D1 xong hẳn, nộp, chờ review. D3 chỉ chạy khi D1 xanh.
- **Đừng dùng CDP để giả lập visibility** (`Emulation.setPageVisibilityState` hay tương đương). Mục tiêu là occlusion **thật ở tầng Windows**. Giả lập trong renderer trả lời một câu hỏi khác.
- **Đừng thêm cách chữa nào trong D1** — không `activateTarget`, không `setVisibleSize`, không `bringToFront` lần hai, không retry wheel.
- **Đừng thêm fallback JS-scroll.**
- **Đừng gỡ `titleGate`** và đừng gỡ rAF counter.
- **Đừng đụng relay/license.**
- **Đừng suy ra "đã chữa xong" từ một loạt run sạch.** F4 là lý do brief này tồn tại.

## Việc KHÔNG thuộc brief này (nợ, ghi để khỏi quên)

1. `clickPoint` chỉ log ra console, chưa đẩy timing vào `result` JSON. **Phải sửa trước khi chạy login thật.** Nợ từ brief 1553, chưa trả.
2. Chế độ hỏng thứ ba của r2b — ack nhanh (12ms, không timeout) mà container `1917->1917` đứng yên. Cơ chế occlusion **không** giải thích được nó (ack nhanh = compositor sống). Món khác hẳn, đừng gộp vào D.
3. `canvasHash` đổi theo chế độ GPU cùng seed (F2) — vấn đề fingerprint, tách khỏi mạch stall.

---

## Câu hỏi chưa giải

1. Cái gì thực sự che cửa sổ ở raf04 **giữa burst 2 và 3**? raf04 và raf05 cách nhau chưa tới 1 phút mà raf05 sạch hoàn toàn → sự kiện che chỉ kéo dài ~15s. D1 trả lời được "occlusion có gây stall không", **không** trả lời "ai che". Nghi phạm hàng đầu: cửa sổ terminal/VS Code phóng ra harness.
2. `SudoMaker Virtual Display Adapter` trên host (cạnh `AMD Radeon RX 6600`) — cửa sổ browser rơi vào màn hình ảo hay thật? Ảnh hưởng cả vsync (`rafFps` 101–129) lẫn tính toán occlusion. Chưa ai kiểm.
3. Nếu D1 xanh và D3 xanh: cờ occlusion là cách chữa **tạm** hay **vĩnh viễn**? Câu này thuộc người ra quyết định, không thuộc người chạy.

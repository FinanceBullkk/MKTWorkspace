# Handoff — công cụ chạy lại được, và thủ phạm không phải cái ai cũng nghĩ

**20/08/2026 02:10** · Thay thế [handoff-260819-2310](handoff-260819-2310-hoi-quy-profile-chet-sau-10-giay.md)
và [handoff-260819-2345](handoff-260819-2345-mot-thu-pham-chua-bat-duoc.md). Cả hai đều sai ở phần
kết luận, theo hai hướng khác nhau.

## ✅ Trạng thái: ĐẠT — nguyên nhân đã CHỐT bằng tái tạo có chủ đích

`0.3.9` chạy trên bản đóng gói, profile **sống trọn 90 giây**, đóng bằng `Browser.close`, exit 0,
không SIGTERM/SIGKILL ⇒ seat được nhả sạch. `appVersion` báo đúng.

**Có thể chạy runbook TikTok** — với đúng **một** profile một lúc.

### Tái tạo có chủ đích (20/08 07:52 và 08:00)

Giữ seat bằng một engine trần, rồi bảo app mở profile:

```
07:52:10  giu seat bang engine tran
07:52:13  launch_profile -> LOI "Chromium exited during launch with code 76"
          log:  +2.253s  CHILD-EXIT  exit=76
07:52:55  nha seat (Browser.close, exit 0)
07:53:23  mo lai -> SONG, pages=2      => seat hoi ngay, khong treo lease
```

`exit=76` lần đầu tiên nằm trong log. **Hết seat license là nguyên nhân gốc**, không còn là suy luận.

### Nhưng hình dạng hôm nay KHÁC triệu chứng gốc

| | Đêm 19/08 | Sáng 20/08 |
|---|---|---|
| `launch_profile` | báo **thành công** | báo **lỗi** |
| Chết lúc | ~10 giây | 1.6–2.3 giây, trong lúc launch |
| Watcher | nổ, UI "terminating" | **không nổ** |

Cùng nguyên nhân, hai cách biểu hiện — vì đường launch đã được làm cứng (`2ec3934`/`3c74b08`),
nó bắt cú chết ngay trong lúc khởi động. Mã cũ thì `waitForCdpSessionReady` qua được **trước** khi
có phán quyết license, nên báo thành công, rồi watcher mới phát hiện xác.

⇒ Nói cho đúng: **hết seat là nguyên nhân; "chết sau 10 giây" chỉ là cách mã cũ trình bày nó.**

### Thông điệp lỗi — đã sửa (`9c4f4b7`)

Trước: `INTERNAL_ERROR: Chromium exited during launch with code 76`.
Nay: `ENGINE_UNAVAILABLE` + *"your plan's session limit is reached. Close another running profile,
or raise the limit at https://cloakbrowser.dev (the free key allows one at a time)."*

Bản đồ thông điệp `LICENSE_EXIT_MESSAGES` **đã có sẵn từ trước** cho cả 76/77/78/79 — nhưng chỉ ghi
ra stderr, mà Electron đóng gói vứt stderr. Câu trả lời nằm sẵn trong máy suốt đêm mà không ai đọc được.

## Thủ phạm thật: hết seat license, tự nuôi chính nó

Bằng chứng quyết định là **mốc giờ commit đối chiếu với log runtime**:

| Giờ | Việc |
|---|---|
| 00:09 | `24697b8` — chỉ thêm log, **không sửa watcher** |
| ~00:22 | profile chạy, **sống 155 giây**, exit 0 |
| 00:30 | `2ec3934` — chỉ thêm trace bootstrap |
| 00:32 | profile chạy, **sống 125 giây**, đóng tay, exit 0 |
| 01:11 | `3c74b08` — bản sửa watcher |

⇒ **Hai lần sống sót đều xảy ra TRƯỚC bản sửa watcher.** Watcher không phải thứ giết profile, và
sửa watcher không phải thứ cứu nó. Bản 23:10 kết luận sai chỗ này.

Câu chuyện khớp toàn bộ dữ kiện trong đêm:

1. Engine hết seat → thoát `76`. CDP **đã kịp mở** trước khi có phán quyết license, nên
   `waitForCdpSessionReady` qua được và `launch()` trả về **thành công**.
2. Vài giây sau engine biến mất → watcher thấy CDP chết → emit `closing` → UI hiện "terminating".
   **Watcher là người đưa tin, không phải hung thủ.**
3. Watcher gọi `gracefulShutdown` → `Browser.close` thất bại (engine đã chết) → SIGTERM → SIGKILL.
   **SIGKILL giữ seat.** Lease mồ côi 7–17 phút.
4. Lần mở tiếp theo lại hết seat → quay lại bước 1.

Vòng lặp tự nuôi. Càng thử càng hỏng — đó là lý do cả tối 9 phép đo liên tiếp đều `76`, và vì sao
seat bận liên tục 45 phút trong khi lease chỉ 7–17 phút.

### Vì sao mọi phép đo bằng engine trần đều vô dụng

`76` đến **sau** khi CDP đã phục vụ. Đo được: một lần bị từ chối seat vẫn mở CDP ở 1.1s, báo
`pages=1`, rồi mới chết ở 1.5s. Nên **không** phân biệt được "chết vì cờ" với "chết vì hết seat"
bằng thời điểm chết (đã thấy 0.8 / 1.1 / 1.5 / 2.3 / 5.7s, tất cả đều `76`), cũng không bằng "CDP
có trả lời không".

Hai kết luận sai của đêm sinh ra từ đúng cái bẫy này. Đừng đi lại.

## Đã commit (nhánh `feat/cloakbrowser-licensed-engine-channel`, **chưa đẩy**)

```
c86fd0d  chore(release)   0.3.8
f8b1962  fix(desktop)     sweep khong con cat ngang viec nha license  <- pha vong lap
3c74b08  fix(desktop)     harden lifecycle shutdown        (Codex)
2ec3934  feat(desktop)    trace bootstrap                  (Codex)
24697b8  feat(desktop)    log shutdown ra dia              (Codex)
c6ff114  fix(fingerprint) tra 6 co telemetry ve cho cu
a058eb6  fix(mcp)         appVersion tra ve ban that
363980d  chore(release)   0.3.7
d625453  fix(fingerprint) gia thuyet sai, da thu hoi o c6ff114
186dcee  <- HEAD dau phien
```

`f8b1962` là bản phá vòng lặp, hai chỗ:

1. **Launcher handoff.** PID theo dõi là launcher đã thoát ⇒ `gracefulShutdown` trả về **ngay** sau
   khi gửi `Browser.close`, đi thẳng vào sweep mà việc đầu tiên của sweep là SIGKILL — trúng đúng
   lúc trình duyệt đang flush shutdown, mà CloakBrowser nhả seat **trong** lúc flush đó. Giờ trình
   duyệt không được theo dõi cũng được cấp đủ 4 giây như trình duyệt được theo dõi.
2. **Bảng tiến trình đọc không được bị hiểu thành rỗng.** `findBrowserProcessesUsingDataDir` trả
   `[]` cho cả "không còn gì" lẫn "không liệt kê nổi" — hai kết luận ngược nhau. Sweep lấy cái thứ
   hai làm bằng chứng đã tắt và ghi `SHUTDOWN-COMPLETE` đè lên một trình duyệt còn sống, còn giữ
   seat. Nay có `enumerateBrowserProcessesUsingDataDir` trả kèm cờ, sweep ghi
   `SWEEP-DISCOVERY-FAILED`.

Ngoài ra nối `cdp-driver test:safe` vào `test:installer` — 5 test đó pass nhưng **không pipeline nào
chạy**, `build:win` sẽ ship hồi quy trong đó mà không biết.

## Log chẩn đoán — dùng cái này, đừng đoán nữa

```
%LOCALAPPDATA%\MKTTool\MKTBrowser\profile-shutdown.log
```

JSONL, mỗi dòng một sự kiện, kèm profileId / pid / port / elapsedSeconds. Các `reason` đáng chú ý:

- `ZERO-PAGES` / `CDP-UNREACHABLE` — watcher nổ, kèm lý do
- `Browser.close` / `SIGTERM` / `SIGKILL` — bậc nào đã thực sự chạy. **SIGKILL = mất seat 7–17 phút**
- `SHUTDOWN-COMPLETE` vs `SHUTDOWN-FAILED` vs `SWEEP-DISCOVERY-FAILED`
- `CHILD-EXIT` kèm `exitCode` — `76` hết seat · `77` key sai · `78` DNS license · `79` state cục bộ

Một lần mở profile là đủ để biết chuyện gì xảy ra. Cả tối 19/08 mất vào việc suy ra từ bên ngoài
đúng cái mà app biết chính xác nhưng không ghi lại.

## Còn nợ, không chặn

1. **`3c74b08` sửa 609 dòng trong đường lifecycle, và `0.3.8` là lần chạy thật ĐẦU TIÊN của nó.**
   Một lần đạt không phủ hết số nhánh nó đụng. Theo dõi log vài ngày.
2. `CHILD-EXIT` trong lúc launch/Stop có thể còn chỗ chưa ghi (Codex tự nêu, chưa sửa).
3. Test lifecycle phần lớn là regex trên source, chưa mô phỏng race thật (Codex tự nêu, chưa sửa).
4. Nhánh `ZERO-PAGES` vẫn giết vô điều kiện sau 1.5s, ân hạn khởi động chỉ 2s. Chưa thấy nổ lần nào,
   nhưng chưa có gì chặn nó nổ oan.
5. Quét dọn mồ côi lúc khởi động — app bị tắt cứng thì chrome con vẫn giữ seat.
6. Phase-04 dựng lại tile/layout · bộ ký compatibility set · IPv6 khi lên proxy.

## Cách "fix" — phần lớn không phải code

1. **Không có bug trình duyệt.** Gói free = 1 seat. Code giờ báo đúng.
2. **Đã sửa:** thông điệp lỗi (`9c4f4b7`), và vòng lặp SIGKILL-cắt-nhả-seat (`f8b1962`).
3. **Còn sửa được bằng code, chưa làm:** quét dọn mồ côi lúc khởi động. Tắt cứng app ⇒ chrome con
   giữ seat 7–17 phút, không có cách ép nhả. Cách làm: đọc `--remote-debugging-port` từ dòng lệnh của
   tiến trình mồ côi, gửi `Browser.close` — **không SIGKILL**. `findBrowserProcessesUsingDataDir`
   đã có sẵn.
4. **Không sửa được bằng code:** muốn chạy **>1 profile cùng lúc** thì phải nâng gói. Nếu kế hoạch
   TikTok là nhiều acc song song thì đây mới là bức tường thật.

### Quy tắc vận hành

- Luôn đóng bằng **Stop / `close_profile`** — đường duy nhất nhả seat.
- **Đừng tắt cứng app** khi còn profile đang mở.
- Gặp lỗi seat → xem log, tìm `SIGKILL`. Có SIGKILL = mất seat 7–17 phút, chờ.

## Việc kế tiếp

1. **Nghiệm thu DNS**: mở profile **không proxy** → `browserscan.net` → mục **DNS Leak** phải ra
   resolver **VNPT / Việt Nam**. Trước khi vá là `74.114.31.150` + 5 IP nước ngoài. Vá ở `88dad47`,
   **vẫn chưa ai xác nhận** — món nợ cũ nhất còn lại.
   Bấm luôn "Detection" cạnh *IP Time Zone* (đang đỏ) và "Unexpand" ở thanh *authenticity 90%*.
2. Đạt → chạy runbook TikTok.
3. Merge: đích là **`main`**, không phải `master`.

## Bài học — 7 lỗi, cùng một hình dạng

| Lỗi | Ràng buộc không được phát biểu |
|---|---|
| GNU tar che bsdtar | PATH quyết định binary nào chạy |
| Cổng pin thiếu bộ ghi | Có hàm đọc, không có hàm ghi |
| Tường lửa chặn UDP 53 | "Chặn hết UDP" giết luôn DNS |
| Cờ DNS kẹt trong `if (profile.proxy)` | Profile không proxy không nhận cờ nào |
| NSIS cắt chuỗi ở 8192 | Cắt xong vẫn chạy tiếp |
| Hai cờ `--disable-features` | Chromium chỉ nhận cái cuối, vứt cái trước |
| `appVersion` là hằng số contract | Hai giá trị phải khớp, không ai phát biểu, không gì kiểm |

Lỗi thứ 8 cùng hình dạng, tìm ra đêm nay: **`[]` mang hai nghĩa ngược nhau** — "không còn tiến
trình" và "không đọc nổi bảng tiến trình". Không phát biểu, không kiểm, và nó ghi đè lên kết luận
"đã đóng sạch".

Bài học riêng của đêm: **một tài nguyên khan hiếm dùng chung làm hỏng mọi phép đo quanh nó.** Một
seat, lease treo 7–17 phút, hai phiên cùng đo — mỗi phép đo phá phép đo kia, và cả hai bên đều kết
luận sai theo hướng riêng. Đáng ra phải đặt "seat có trống không" thành **điều kiện tiên quyết của
mọi phép đo**, ngay từ đầu, thay vì đọc thời điểm chết.

## Câu chưa giải quyết

1. DNS sau `88dad47` có về VNPT không? Vẫn chưa ai đo. **Đây là việc số 1.**
2. Múi giờ đỏ và 10% thiếu trên browserscan là gì?
3. Vì sao `BOOTSTRAP-PROBE-FAILED` liên tục trên target `iframe`? Vô hại tới giờ, chưa ai giải thích.
4. Có đẩy nhánh lên GitHub mở PR sẵn không?

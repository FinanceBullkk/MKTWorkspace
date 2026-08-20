# Phase 01 — Quét dọn profile mồ côi lúc khởi động

**Ưu tiên:** cao · **Trạng thái:** xong, đã nghiệm thu 20/08 · Độc lập với các phase khác

## Bối cảnh

- [plan.md](plan.md)
- [handoff-260820-0210](../reports/handoff-260820-0210-cong-cu-chay-lai-va-thu-pham-that.md)

## Vấn đề

App bị tắt cứng (Task Manager, mất điện, crash) khi còn profile đang mở ⇒ tiến trình chrome con
sống sót, **vẫn giữ chỗ ở máy chủ license**. App khởi động lại, đếm 0 profile đang chạy, nhưng mọi
lần mở đều thất bại trong **7–17 phút** cho tới khi lease tự hết hạn.

Operator không có cách nào ép nhả, và cũng không có gì trên màn hình giải thích.

`before-quit` đã gọi `closeAll()` nên đường thoát bình thường sạch. Đây là đường **bất thường**.

## Điểm mấu chốt

**`Browser.close` là cách duy nhất nhả chỗ. SIGKILL thì giữ chỗ.** Nên bản quét dọn này phải đóng
êm, không được `taskkill`. Đây chính là sai lầm đã tạo ra vòng lặp tự nuôi trong đêm 19/08.

Tiến trình mồ côi mang sẵn cổng debug trong dòng lệnh của nó (`--remote-debugging-port=NNNN`), nên
gửi được `Browser.close` mà không cần biết gì thêm.

## Yêu cầu

**Chức năng**
- Lúc khởi động, tìm mọi tiến trình chrome đang giữ data-dir của **profile thuộc app này**
- Với mỗi cái: đọc `--remote-debugging-port`, gửi CDP `Browser.close`, chờ thoát (ngân sách ~5s)
- Không thoát trong ngân sách → SIGKILL, và **ghi log rõ là đã mất chỗ**
- Ghi mọi việc vào `profile-shutdown.log` với `reason` riêng

**Phi chức năng**
- Không được chặn khởi động app: chạy nền, app vẫn mở bình thường
- Không bao giờ đụng chrome **không** thuộc data-dir của app (Chrome cá nhân của người dùng)
- Bật/tắt bằng `startupOrphanSweep` (mặc định bật)

## Kiến trúc

Module mới, tách khỏi `ChromiumBrowserDriver.ts` (file đã 1800+ dòng):

```
apps/desktop/src/main/startup-orphan-sweep.ts
   sweepOrphanedProfileBrowsers(dataDirs, log) -> Promise<SweepOutcome>
```

Luồng:

```
app ready
  -> liet ke profile dir tu ProfileManager
  -> enumerateBrowserProcessesUsingDataDir(moi dir)
  -> voi moi tien trinh: doc --remote-debugging-port tu commandLine
       co cong  -> Browser.close -> cho thoat 5s -> con song thi SIGKILL
       khong co cong -> SIGKILL luon (khong con duong nao em hon)
  -> ghi ORPHAN-SWEEP-* vao profile-shutdown.log
```

Dùng lại `enumerateBrowserProcessesUsingDataDir` (đã trả kèm cờ `enumerated`) — **không** tự viết
lại phần dò tiến trình.

## File liên quan

**Tạo**
- `apps/desktop/src/main/startup-orphan-sweep.ts`
- `apps/desktop/src/main/startup-orphan-sweep.test.ts`

**Sửa**
- `apps/desktop/src/main/index.ts` — gọi sau khi ProfileManager sẵn sàng
- `apps/desktop/src/main/browser-process-discovery.ts` — thêm hàm đọc cổng debug từ commandLine
- `apps/desktop/src/main/ChromiumBrowserDriver.ts` — mở `ProfileLifecycleLogReason` cho reason mới
- `packages/settings-store/src/index.ts` — cờ `startupOrphanSweep`

## Các bước

1. Thêm `debugPortFromCommandLine(commandLine): number | null` vào `browser-process-discovery.ts`,
   kèm test cho: có cổng, không có cổng, cổng trong dấu nháy, nhiều `--remote-debugging-port`
2. Viết `startup-orphan-sweep.ts`, nhận sẵn hàm dò tiến trình và hàm ghi log qua tham số (để test
   được mà không cần tiến trình thật)
3. Thêm reason `ORPHAN-SWEEP-START` / `ORPHAN-SWEEP-CLOSED` / `ORPHAN-SWEEP-KILLED` /
   `ORPHAN-SWEEP-NONE` / `ORPHAN-SWEEP-DISCOVERY-FAILED`
4. Nối vào `index.ts`, chạy nền (`void`), sau khi có ProfileManager
5. Thêm `startupOrphanSweep` vào settings-store + default `true`
6. `yarn workspace @mktbrowser/desktop lint` và test

## Todo

- [x] `debugPortFromCommandLine` + test — `browser-process-discovery.ts` + `.test.ts`
- [x] `startup-orphan-sweep.ts` — kèm `startup-orphan-sweep.test.ts`
- [x] reason mới trong log — `ORPHAN-SWEEP-CLOSED` / `-NONE` / `-KILLED` / `-DISCOVERY-FAILED`
- [x] nối vào `index.ts` — `index.ts:368`, chạy nền bằng `void`
- [x] cờ settings — `settings-store/src/index.ts:56`, mặc định `true`
- [x] lint + test
- [x] build + nghiệm thu thật (xem Bằng chứng nghiệm thu)

## Tiêu chí đạt

Nghiệm thu bằng tay, tái tạo đúng tình huống:

1. Mở một profile
2. **Tắt cứng app** bằng Task Manager (không bấm Stop)
3. Xác nhận chrome con còn sống, và một lần mở bằng engine trần bị `exit 76`
4. Mở lại app
5. Log phải có `ORPHAN-SWEEP-CLOSED`, chrome con biến mất
6. **Mở profile được ngay**, không phải chờ 7–17 phút

Bước 6 là điều kiện đạt. Nếu chỉ `ORPHAN-SWEEP-KILLED` (SIGKILL) thì **chưa đạt** — chỗ vẫn bị giữ.

## Bằng chứng nghiệm thu

Chạy thật 20/08, sau khi `7a51999` đổi sang `detached: true`. Nguồn: `profile-shutdown.log`
(`%LOCALAPPDATA%\MKTTool\MKTBrowser`). Log ghi giờ UTC, cộng 7 ra giờ máy:

| Giờ máy | Bản ghi | Ứng với bước |
|---|---|---|
| 08:54:17 | `ORPHAN-SWEEP-CLOSED` pid 3500 port 9222 | 5 — đóng qua cổng debug, **không** SIGKILL |
| 08:54:33 | `BOOTSTRAP-DONE` sau 3,06s | 6 — mở lại được **ngay**, không chờ 7–17 phút |
| 08:54:50 | `SHUTDOWN-COMPLETE` `Browser.close` exit 0 | đóng sạch, nhả chỗ bình thường |

Bước 6 là điều kiện đạt, và khoảng cách 16 giây giữa dòng 1 và dòng 2 chính là nó: chỗ đã trống
trước khi lần mở kế tiếp chạm vào. Bản ghi là `CLOSED` chứ không phải `KILLED` nên không rơi vào
trường hợp bị loại.

Bốn dòng `ORPHAN-SWEEP-NONE` trước đó là các lần khởi động không có gì để dọn — nhánh không-làm-gì
cũng có chạy, không phải code chết.

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Đóng nhầm Chrome cá nhân của người dùng | Chỉ đụng tiến trình có `--user-data-dir` khớp **chính xác** thư mục profile của app |
| Hai instance app cùng chạy, cái sau đóng profile của cái trước | Bỏ qua tiến trình mà app hiện tại đang theo dõi; chấp nhận rủi ro còn lại và ghi log |
| Dò tiến trình lỗi ⇒ quét nhầm/không quét | `enumerated: false` thì **không làm gì**, ghi `ORPHAN-SWEEP-DISCOVERY-FAILED` |
| Quét chậm làm treo khởi động | Chạy nền, không `await` trong đường khởi động |

## Bảo mật

Không đụng tới thông tin nhạy cảm. Chỉ đọc dòng lệnh tiến trình của **chính người dùng hiện tại**
(`Get-CimInstance Win32_Process` không cần quyền admin cho tiến trình cùng user). Không ghi dòng
lệnh đầy đủ vào log — dòng lệnh chứa đường dẫn profile, chỉ ghi pid + cổng.

## Bước tiếp

Xong phase này thì [phase-02](phase-02-mo-hinh-suc-chua-va-trang-thai-cho.md) dùng chính kết quả
quét dọn làm tín hiệu đầu tiên cho trạng thái "đang chờ giải phóng".

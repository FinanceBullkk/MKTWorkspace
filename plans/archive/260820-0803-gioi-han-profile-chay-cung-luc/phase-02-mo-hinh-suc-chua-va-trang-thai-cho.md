# Phase 02 — Mô hình sức chứa và trạng thái chờ giải phóng

**Ưu tiên:** cao · **Trạng thái:** chưa bắt đầu · Cần [phase-01](phase-01-quet-don-profile-mo-coi-luc-khoi-dong.md) (không chặn, nhưng dùng chung tín hiệu)

## Bối cảnh

- [plan.md](plan.md)

## Vấn đề

App không có khái niệm "còn mở được mấy profile nữa". Nó chỉ biết đang chạy mấy cái
(`App.tsx:314`), rồi để engine từ chối. Ba trạng thái khác nhau hiện đang trông y hệt nhau:

| Thực tế | Operator thấy |
|---|---|
| Còn chỗ trống | mở được |
| Hết chỗ vì đang chạy 1 profile | lỗi khó hiểu |
| Hết chỗ vì lease mồ côi chưa hết hạn | lỗi khó hiểu, **mà màn hình lại nói 0 đang chạy** |

Cái thứ ba là tệ nhất: app đếm 0, engine nói hết chỗ. Không có gì hoà giải hai con số đó.

## Điểm mấu chốt

**Không tra được sức chứa từ máy chủ.** `session/end` đòi `lease_id` + `install_id` +
`instance_id`; quét toàn bộ `~/.cloakbrowser` và thư mục profile chỉ thấy `install_id`. Hai cái kia
chết theo tiến trình. Không có endpoint nào trả về "còn mấy chỗ".

⇒ Sức chứa phải **học từ thực tế**, không được bịa:

- Mở thành công trong khi đã có `M` profile đang chạy ⇒ sức chứa **ít nhất** `M + 1`
- Bị từ chối `76` trong khi đang chạy `M` ⇒ sức chứa **đúng bằng** `M`

Đó là toàn bộ thông tin có thật. Mọi con số khác là phỏng đoán và không được hiển thị như sự thật.

## Yêu cầu

**Chức năng**
- Giữ `observedMaxConcurrent` (học được) và `maxConcurrentProfiles` (cấu hình, 0 = tự học)
- Suy ra trạng thái sức chứa: `available` · `full` · `cooling-down` · `unknown`
- `cooling-down` bật khi: đóng bằng SIGKILL, hoặc `CHILD-EXIT` mã khác 0, hoặc `76` lúc đếm 0
- `cooling-down` tự tắt khi: hết `seatCooldownSeconds`, **hoặc** một lần mở thành công (bằng chứng mạnh hơn đồng hồ)
- Đẩy trạng thái sang renderer qua IPC như `running-changed` đang làm

**Phi chức năng**
- Không thêm lệnh gọi mạng nào. Toàn bộ suy ra từ sự kiện app đã có.
- `unknown` là trạng thái hợp lệ và phải hiển thị được — thà nói "chưa rõ" còn hơn đoán bừa.

## Kiến trúc

Module mới, giữ `ChromiumBrowserDriver.ts` không phình thêm:

```
apps/desktop/src/main/profile-capacity.ts

  class ProfileCapacity
    onLaunchSucceeded(runningCount)   // hoc: capacity >= runningCount
    onLaunchRefused(exitCode, runningCount)  // 76 => capacity == runningCount
    onProfileClosed(method)           // SIGKILL => bat cooling-down
    snapshot(): CapacitySnapshot
```

```ts
interface CapacitySnapshot {
  running: number;
  limit: number | null;            // null = chua biet
  state: "available" | "full" | "cooling-down" | "unknown";
  cooldownEndsAt: string | null;   // ISO, uoc luong — KHONG phai hop dong
  source: "configured" | "observed" | "unknown";
}
```

Nguồn dữ liệu vào, tất cả đã tồn tại:

```
ChromiumBrowserDriver
  launch() thanh cong        -> onLaunchSucceeded
  engineUnavailable(76)      -> onLaunchRefused
  terminateBrowserProcess()  -> onProfileClosed(shutdownMethod)
startup-orphan-sweep (phase-01)
  ORPHAN-SWEEP-KILLED        -> onProfileClosed("SIGKILL")
```

`observedMaxConcurrent` lưu vào settings để không mất khi khởi động lại.

## File liên quan

**Tạo**
- `apps/desktop/src/main/profile-capacity.ts`
- `apps/desktop/src/main/profile-capacity.test.ts`

**Sửa**
- `apps/desktop/src/main/ChromiumBrowserDriver.ts` — bắn 3 sự kiện vào ProfileCapacity
- `apps/desktop/src/main/index.ts` — dựng instance, đẩy snapshot qua IPC
- `apps/desktop/src/preload/create-mkt-browser-api.ts` — kênh mới
- `packages/settings-store/src/index.ts` — `maxConcurrentProfiles`, `seatCooldownSeconds`, `observedMaxConcurrent`
- `apps/desktop/src/main/ipc-events.ts` (hoặc chỗ định nghĩa `IPC_EVENTS`) — `CAPACITY_CHANGED`

## Các bước

1. Viết `ProfileCapacity` **thuần** (không I/O, nhận thời gian qua tham số) + test đầy đủ bảng trạng thái
2. Thêm 3 khoá settings + default
3. Nối 3 sự kiện từ driver
4. Thêm IPC `CAPACITY_CHANGED`, đẩy snapshot mỗi lần state đổi
5. lint + test

## Todo

- [ ] `ProfileCapacity` + test (bảng trạng thái đầy đủ, gồm cả `unknown`)
- [ ] khoá settings
- [ ] nối sự kiện driver
- [ ] IPC
- [ ] lint + test

## Tiêu chí đạt

- Test phủ: học sức chứa lên, học xuống, bật/tắt cooldown, cooldown bị cắt sớm bởi một lần mở thành công
- Giữ chỗ bằng engine trần (như `reproduce.mjs`) ⇒ snapshot chuyển sang `full` **trước** khi operator bấm
- Tắt cứng app rồi mở lại ⇒ snapshot là `cooling-down`, không phải `available`

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Học sai sức chứa (một lần `76` do nguyên nhân khác) | `76` chỉ hạ sức chứa, một lần mở thành công là nâng lại ngay |
| Đồng hồ cooldown sai (7–17 phút là quan sát, không phải hợp đồng) | Hiển thị dạng "khoảng", và một lần mở thành công cắt cooldown ngay lập tức |
| Thêm state vào file đã quá to | Module riêng, thuần, không I/O |

## Bảo mật

Không có bề mặt mới. Snapshot không chứa key license, không chứa đường dẫn profile.

## Bước tiếp

[phase-03](phase-03-ui-chan-truoc-khi-bam.md) tiêu thụ `CapacitySnapshot`.

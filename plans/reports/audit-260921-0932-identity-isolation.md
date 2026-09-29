# Audit cách ly danh tính — MKT Browser 0.3.23 + engine CloakBrowser .6

**Ngày:** 21/09/2026 · **Phạm vi:** gate A/B/C trong `MKTBrowser/docs/fingerprint-acceptance-gate.md`
**Cách đo:** chạy thật trên máy này, engine đang pin, control cùng máy. Không phỏng đoán, không scanner.

## Trạng thái

| Phần | Kết quả |
|---|---|
| Tiêu chí A/B/C | **BLOCKED** — không đo được bằng key 1 phiên; xem mục 3 |
| Trần seat của key free | **ĐO XONG** — xem mục 2, và nó đổi con số vận hành của sản phẩm |
| Pin engine của harness | **ĐO XONG** — xem mục 1 |

Hai mục dưới đây không phụ thuộc kết quả gate.

## 1. Harness đo ghim engine không còn tồn tại trên máy

`measure-mkb01e-packaged-fingerprint.cjs` ghim cứng `151.0.7922.108.2` + SHA archive của bản đó.
Pin thật của máy (`%LOCALAPPDATA%\MKTTool\compatibility-updater\active-engine.json`, sequence 2,
ghi 13/09) là **`151.0.7922.108.6`**, và cache engine cũng là `.6`.

Nghĩa là phép đo gate **không thể chạy trên engine đang dùng** kể từ 13/09: `seedVerifiedStableEngineCache`
ném lỗi "Installed engine cache is not Stable .2" trước khi mở profile nào. Đây là lý do điều kiện
thứ nhất để retire `G2-IDENTITY` ("đo engine đang pin") chưa từng được thoả — không phải vì chưa ai
làm, mà vì harness sẽ chặn.

**Đã sửa:** hai hằng số thành tham số `--engine-version` / `--engine-sha256`, mặc định giữ nguyên `.2`
để lượt đo cũ vẫn tái lập đúng như trước. Danh tính đang đo được ghi vào evidence, không đoán.

Ghi chú kèm theo, chưa xử lý: `.6` **không có bản ghi authority nào trong repo** — chỉ xuất hiện
trong một fixture test (`canary-daily-check.test.cjs:34`). Hash `.6` duy nhất có được là do chính
app ghi lúc cài. Và đường tải engine của app (`cloakbrowser-pro-channel.ts:202`) coi checksum là
best-effort: `fetchProSha256` trả `undefined` khi không lấy được SHA256SUMS, và
`ChromiumBootstrap.ts:585` chỉ kiểm khi `manifest.sha256` tồn tại — không có thì tải và dùng luôn.

## 2. Seat: app báo trống trong khi vendor vẫn tính, và thời gian giữ không đoán được

Đây là phát hiện đáng giá nhất của lượt này, và nó **đổi con số vận hành** đã ghi trong
[audit hiệu quả 17/09](audit-260917-2004-product-effectiveness.md).

### Đo được gì

Lượt chạy 09:13: P1 mở, đo đủ 4 ngữ cảnh, **đóng sạch**. Ngay sau đó:

| Nguồn | Nói gì |
|---|---|
| `licenseCapacity` của app | `{total:1, free:1, active:0, pendingRecovery:0, cooling:0}` — **trống** |
| Vendor, khi P2 xin mở | `403 session_limit_exceeded` — **hết chỗ** |
| Vendor, hỏi lại mỗi phút | `active_sessions: 1, limit: 1` suốt 15 phút tiếp theo |
| Seat nhả lúc | 09:32:03 — khoảng 15 phút sau khi đóng (xem đính chính bên dưới) |

(Probe in ra "23,1 phút" vì mốc `--since` đặt sớm hơn thời điểm đóng thật 7,4 phút.)

**Đính chính trong ngày: không có con số cố định.** Lần đầu seat nhả trong khoảng 14,7-15,7 phút sau
khi đóng. Hai lượt sau đó, chờ cứng 17 phút vẫn bị từ chối, và một lượt nữa vẫn bị từ chối ở phút
**18,9**. Nên "khoảng 16 phút" là mô tả sai; đúng hơn: **client không có cách nào biết trước**.

Một điều **đo được và chắc chắn**: gọi `session/end` của vendor thì seat trống **ngay lập tức** —
profile mở thành công 27 giây sau một lượt release như vậy, trong khi một lượt đóng browser sạch
không nhả được seat suốt 17 phút. Tức seat không "hết hạn theo TTL" mà "được nhả khi có ai đó gọi
đúng API" — và app thì không gọi được (thiếu `lease_id`/`instance_id`).

**Hệ quả cho chính phép đo này:** không thể chờ bằng hằng số. Đã thêm
`scripts/vendor-seat-availability.cjs` + cờ `--verify-seat-with-vendor`: trước mỗi lần mở,
harness hỏi vendor cho tới khi được cấp, trả lại ngay, rồi mới mở. Mặc định tắt, nên lượt chạy
thường không gọi licence server.

### Vì sao app tin sai

`ChromiumBrowserDriver.ts:1339`:

```ts
const seatReleased = seatReleasedOverride ?? method === "Browser.close";
```

App coi **"đóng bằng Browser.close" là bằng chứng vendor đã nhả seat**. Đo được cho thấy tiền đề đó
sai trên build `.6`: đóng sạch, vendor vẫn giữ tới hết TTL. Với `seatReleased = true`,
`LicenseKeyPool.release()` cho key về `idle` ngay, không `rest()` — nên cả app lẫn Web đều báo còn chỗ.

App **không thể** tự gọi `session/end`: cần `lease_id` + `instance_id` chết cùng tiến trình browser,
và journal (`license-lease-journal-schema.ts:15`) không lưu hai trường đó. Nên đây không phải lỗi
quên gọi API — hiện tại không có đường nhả sớm.

### Hệ quả cho operator

**Web console cho bấm rồi mới hỏng.** `current-device-browser-health.ts:124` chỉ chặn khi
`capacity.free === 0`. Trong 15,7 phút đó `free = 1`, nên Web trả `ready: true`, operator bấm mở và
nhận từ chối từ engine. Chỉ **sau** lần từ chối đầu, pool mới cho key sang `cooling` 17 phút và từ
đó mới báo đúng.

**Nhịp thật của sản phẩm không phải "1 profile tại một thời điểm".** Là **1 profile mỗi 15-19 phút**
cho mỗi key. Đóng nick A xong không mở được nick B ngay; phải đợi hết lease. Với 5-6 người mỗi người
một key free, trần đồng thời vẫn là 5-6, nhưng **thông lượng** là ~3 lượt mở/giờ/người, không phải
"mở bao nhiêu lần cũng được miễn không chồng nhau".

Chỗ này cũng là lý do lượt đo gate hôm nay tốn ~3 giờ: 10 lượt mở × 17 phút chờ lease.

### Đề xuất (quyết định của chủ dự án, không tự sửa)

Bỏ `method === "Browser.close"` làm bằng chứng nhả seat; cho key nghỉ đủ cooldown sau **mọi** lần
đóng. Sản phẩm sẽ trông chậm hơn nhưng nói thật: Web hiện "chỗ trống lúc HH:MM" thay vì cho bấm rồi
báo lỗi. Đây là đổi hành vi thấy được nên cần chủ dự án chốt, không phải việc dọn code.

## 3. Gate A/B/C: BLOCKED, và lý do là chìa khoá chứ không phải kỹ thuật

Phép đo cần 10 lượt mở profile liên tiếp (5 profile × 2 lượt). Trong 2 giờ, **hai lượt liền nhau
chưa lần nào mở nổi.** Bảy lượt chạy, mỗi lượt đổi một giả thuyết về cách chờ seat:

| Cách chờ | Kết quả |
|---|---|
| 5 giây (mặc định của harness) | P1 đo xong, P2 bị từ chối |
| Chờ cứng 17 phút | P1 đo xong, P2 vẫn bị từ chối ở phút 17,2 |
| Hỏi vendor tới khi báo trống rồi mở ngay | Vendor OK, mở sau 0,2s → từ chối |
| Như trên + chờ lan truyền 60 giây | Vendor OK, chờ 60s → vẫn từ chối |
| Thử lại lệnh mở mỗi 2 phút, trần 45 phút | **Bỏ cuộc sau 45 phút, chưa mở được lần nào** |

Lượt cuối cho thấy cơ chế: app tự thử lại mỗi ~18 phút (cooldown 17 phút + 1), và **mỗi lần thử
hỏng lại đẩy mốc trống ra xa**. Ba lần thử lúc `03:23:38Z`, `03:41:42Z`, `03:59:45Z` đều nhận
`exitCode 76`; nhật ký lease ghi `LICENCE_SEAT_REFUSED` cả ba, bản ghi cuối `terminal-refused`,
`keysLeft: 0`. Sau 40 phút vẫn chưa vào được.

Câu app nói ở lần cuối lại **đúng**: *"A previous browser closed without handing its licence
session back, so the licence server still counts it. It frees in about 7 minutes."* Tức sản phẩm
mô tả đúng hiện tượng — chỉ sai ở cửa sổ giữa lúc đóng sạch và lần từ chối đầu tiên, đúng cửa sổ
mà Web mời operator bấm.

**Kết luận cho gate:** `G2-IDENTITY=FAIL` giữ nguyên, và tiêu chí A/B/C của engine đang pin là
`BLOCKED` — không phải vì chưa ai chạy, mà vì **key free 1 phiên không cho phép chạy**. Muốn đo:
một key trả phí nhiều chỗ, hoặc một lượt qua đêm mở đúng một lần mỗi ~25 phút (≈4 giờ).

Việc cần làm đã tách riêng: [worklist-260921-1105-licence-seat-fixes.md](worklist-260921-1105-licence-seat-fixes.md).

## 4. Quan sát kèm theo — P1 so với control cùng máy (KHÔNG phải verdict tiêu chí C)

Một profile không quyết được C (C cần tính bất biến trên cả pool). Bảng này chỉ là số đếm thô:

| Surface | Trùng control | Khác control |
|---|---|---|
| fonts | 9 | 9 |
| audio | 14 | 8 |
| webgl1 / webgl2 | 28 / 28 | 8 / 8 |
| webgpu | 15 | 6 |
| canvas | 0 | 8 |
| clientRects | 2 | 2 |
| uaClientHints | 12 | 11 |
| screenLocale | 15 | 12 |
| aggregate | 0 | 4 |

Lượt này control là Chrome hệ thống **153.0.8010.50** so với engine **151** — lệch 2 major, nên một
phần "khác" là do version chứ không phải do engine. Lượt đang chạy đã thay bằng **CfT
151.0.7922.138** (cùng nhánh 151; CfT không xuất bản đúng `.108`), để phần chênh còn lại quy được về
engine.

## Đã chạy / chưa chạy

- **Đã:** control cùng máy, bootstrap engine `.6` trong userData tạm, tạo 5 profile, đo đủ
  document/iframe/worker/offscreenCanvas cho P1, đo lease vendor bằng API tài liệu hoá của họ.
- **Chưa:** verdict A/B/C (đang chạy) · rò rỉ proxy (WebRTC/DNS/IP-vs-timezone) — harness này không
  mở profile qua proxy, cần lượt đo riêng · hành vi trên nền tảng thật.

## Câu hỏi chưa có lời đáp

- Sửa mục 2 theo hướng "nghỉ sau mọi lần đóng" hay giữ nguyên và chỉ sửa câu chữ ở Web?
- `.6` cần một bản ghi authority trong repo (như `.2` từng có) không, hay pin của máy là đủ?
- Nhịp ~16 phút/lượt mở có phá cách làm việc dự kiến của team không? Nếu có thì trần 1 seat/người
  là ràng buộc sản phẩm, không phải chi tiết kỹ thuật.

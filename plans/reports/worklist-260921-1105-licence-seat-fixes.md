# Work list — chìa khoá licence CloakBrowser và pin engine

**Cho:** Codex · **Ngày:** 21/09/2026 · **Nguồn:** [audit-260921-0932-identity-isolation.md](audit-260921-0932-identity-isolation.md)
**Repo:** `MKTBrowser` (chính), `MKTTool` (mục 3)

## Bối cảnh bắt buộc đọc trước khi chạy thử

Key CloakBrowser free = **1 phiên**. Đo được hôm nay, không phải suy đoán:

- Đóng profile sạch (`Browser.close`, `SHUTDOWN-COMPLETE`) **không** trả seat cho vendor. Vendor vẫn
  trả `403 session_limit_exceeded {active_sessions:1, limit:1}`.
- Seat trống lại sau khoảng **16-20 phút**, không phải một hằng số đoán được.
- **Mỗi lần thử mở hỏng làm đồng hồ chạy lại.** Ba lần engine thử mở lúc `03:23:38Z`, `03:41:42Z`,
  `03:59:45Z` (cách nhau đúng 18 phút = cooldown 17 phút + 1) đều bị từ chối; sau 40 phút vẫn chưa
  vào được. Nhật ký lease ghi cả ba: `lastErrorCode: "LICENCE_SEAT_REFUSED"`, bản ghi cuối
  `terminal-refused`, `keysLeft: 0`. Vòng đời ghi `CHILD-EXIT exitCode 76` rồi `SHUTDOWN-COMPLETE`.

**Vì vậy:** đừng thử đi thử lại khi sửa. Mỗi lần thử hỏng tốn thêm ~20 phút của chính bạn **và** của
operator đang dùng máy. Thử **đúng một lần** sau khi đã im lặng ≥ 20 phút. Đây là chi phí thật, không
phải lời khuyên phong cách.

Cũng đừng dùng `scripts/measure-licence-lease-ttl.cjs` để "kiểm tra nhanh xem seat trống chưa": bản
thân nó chiếm seat để hỏi, và lượt release của nó không có tác dụng kịp — đã thử, engine mở 0,2 giây
và 60 giây sau lượt release đều trượt.

---

## 1. App tuyên bố seat đã trả trong khi vendor vẫn tính — [ƯU TIÊN 1]

**Vấn đề.** `apps/desktop/src/main/ChromiumBrowserDriver.ts:1339`:

```ts
const seatReleased = seatReleasedOverride ?? method === "Browser.close";
```

Đóng bằng `Browser.close` được coi là bằng chứng vendor đã nhả seat. Đo được: sai. Với
`seatReleased = true`, `LicenseKeyPool.release()` (`license-key-pool.ts:225`, `:259`) cho key về
`idle` ngay, **không** gọi `rest()`. Kết quả: `licenseCapacity` = `{total:1, free:1, active:0,
cooling:0}` trong khi vendor đang từ chối.

App **không thể** tự gọi `session/end`: cần `lease_id` + `instance_id` chết cùng tiến trình browser,
và `license-lease-journal-schema.ts:15` không lưu hai trường đó. Đừng đi hướng "gọi API nhả sớm" trừ
khi engine bắt đầu ghi lease id ra đâu đó — đã kiểm `~/.cloakbrowser/`, chỉ có `install_id`.

**Sửa.** Bỏ `method === "Browser.close"` làm bằng chứng. Mọi lần đóng đều cho key nghỉ hết cooldown.
Giữ `seatReleasedOverride` cho caller nào thật sự chứng minh được (hiện chưa có ai).

**Xong là gì.**
- Ngay sau khi đóng profile, `get_runtime_info` trả `cooling: 1`, `free: 0`, kèm mốc hết nghỉ.
- Không có đường nào trong app mời operator mở một profile mà vendor sẽ từ chối.
- Test phải cập nhật, không phải xoá: `license-key-pool.test.ts`, `one-seat-license-ui-contract.test.ts`,
  `license-driver-lifecycle-contract.test.ts`.

**Lưu ý đánh đổi.** Sản phẩm sẽ *trông* chậm hơn (17 phút không mở được thay vì cho bấm rồi lỗi). Đó
là mục đích: nói thật về thứ đang xảy ra. Nếu thấy cần giữ hành vi cũ, dừng lại và hỏi chủ dự án chứ
đừng tự chọn.

## 2. Nhịp thử lại 17 phút khiến khoá vĩnh viễn — [ƯU TIÊN 1]

**Vấn đề.** `LICENSE_SEAT_COOLDOWN_MS = 17 * 60_000` (`license-key-pool.ts:111`) ngắn hơn khoảng giữ
thật của vendor khi có lần thử hỏng chen vào. Vì mỗi lần thử hỏng làm đồng hồ chạy lại, chu kỳ 18
phút rơi đúng vào trạng thái "vẫn bận" mãi mãi. Đo: 3 lần / 40 phút, không lần nào vào.

**Sửa.** Sau `LICENCE_SEAT_REFUSED`:
- lùi lâu hơn cooldown hiện tại (đề xuất: cooldown + margin, hoặc tăng dần), và
- **không tự động mở lại**. Chờ operator bấm, sau mốc thời gian được nói rõ.
- Câu thông báo (`license-seat-wait-message.ts`) nói thêm: *đừng thử lại trước HH:MM, mỗi lần thử
  làm dài thêm thời gian chờ.* Hiện câu này chỉ nói "frees in about N minutes", mà N đó sai khi có
  lần thử hỏng.

**Xong là gì.** Một lần từ chối không kéo theo lần mở engine nào nữa trước mốc đã báo. Kiểm bằng
**một** lượt: để yên 20 phút, mở đúng một lần, phải vào được.

**Cần xác minh với key thật.** Chưa chắc "mỗi lần thử hỏng làm đồng hồ chạy lại" là quy tắc của
vendor hay chỉ là trùng hợp của 3 điểm đo. Trước khi sửa cứng theo giả thuyết đó, đo thêm: để yên
25 phút không đụng gì rồi thử **một** lần. Nếu vào được thì giả thuyết đứng vững.

## 3. Web console cho bấm rồi mới hỏng — [ƯU TIÊN 2, repo MKTTool]

**Vấn đề.** `src/lib/relay/current-device-browser-health.ts:124` chỉ chặn khi `capacity.free === 0`.
Trong 16-20 phút seat đang bị vendor giữ, `free` vẫn là 1, nên trả `ready: true`, operator bấm mở và
nhận lỗi từ engine.

**Sửa.** Chặn cả khi key đang nghỉ, và nói mốc thời gian thay vì "Close a running profile, then
retry" — không có profile nào đang mở để đóng, câu đó vô nghĩa với operator.

**Phụ thuộc mục 1:** chỉ đúng sau khi app báo `cooling` trung thực. Làm mục 1 trước, hoặc làm cùng lượt.

## 4. Pin engine trong harness đo đã trôi — [ƯU TIÊN 2]

**Vấn đề.** `scripts/measure-mkb01e-packaged-fingerprint.cjs` ghim cứng `151.0.7922.108.2`; pin thật
của máy (`%LOCALAPPDATA%\MKTTool\compatibility-updater\active-engine.json`, sequence 2, ghi 13/09) là
`151.0.7922.108.6`. Từ 13/09 phép đo gate **ném lỗi trước khi mở profile nào**, nên điều kiện số 1
để retire `G2-IDENTITY` ("đo engine đang pin") không thể thoả, và không ai biết vì báo lỗi trông như
lỗi cache.

**Đã sửa tại chỗ, chưa commit** (xem mục "Thay đổi đang nằm ở máy"). Việc còn lại:
- Thêm phép canh: mặc định của harness lệch `active-engine.json` thì báo rõ "pin đã trôi, chạy với
  `--engine-version`", thay vì lỗi cache khó hiểu.
- `.6` **không có bản ghi authority nào trong repo** — chỉ xuất hiện ở fixture `canary-daily-check.test.cjs:34`.
  `.2` từng có (`apps/desktop/release/quarantine-.../windows-compatibility-artifacts.json`). Ghi lại
  url/sha/sequence của `.6` cho đúng chuẩn cũ.

## 5. Checksum engine là best-effort — [ƯU TIÊN 3]

`cloakbrowser-pro-channel.ts:202` `fetchProSha256()` trả `undefined` khi không lấy được `SHA256SUMS`,
và `ChromiumBootstrap.ts:585` chỉ so khi `manifest.sha256` tồn tại. Không lấy được checksum thì tải
và chạy luôn. Comment tại chỗ nói đây là chủ ý (không chặn launch vì checksum server trục trặc).

**Cần một quyết định, không phải một bản vá lén.** Engine là thứ chạy với toàn quyền trên máy
operator. Hoặc fail-closed, hoặc ghi rõ trong docs rằng đường này không được xác minh.

## 6. Gate danh tính: ghi nhận BLOCKED, kèm lý do — [ƯU TIÊN 3]

`docs/fingerprint-acceptance-gate.md` đang để CloakBrowser ở trạng thái `BLOCKED` với `0/10` readings.
Bổ sung **lý do đo được**: phép đo cần 10 lượt mở liên tiếp; với key 1 phiên và khoảng giữ 16-20 phút
mỗi lượt, hai lượt liền nhau còn không mở nổi. Muốn đo thì cần key trả phí nhiều chỗ, hoặc một lượt
chạy qua đêm mở đúng một lần mỗi ~25 phút.

Đừng ghi `NOT-RUN` thành `PASS`, và đừng hạ pool xuống 3 để chạy cho xong — gate nói rõ chạy dưới 5
là `NOT-RUN` cho cả pool.

---

## Thay đổi đang nằm ở máy, chưa commit

Repo `MKTBrowser`, chỉ trong `scripts/`, không đụng code sản phẩm:

| File | Sửa gì |
|---|---|
| `scripts/measure-mkb01e-packaged-fingerprint.cjs` | pin engine thành tham số `--engine-version` / `--engine-sha256` (mặc định giữ `.2`); log mốc thời gian từng bước; cờ `--seat-retry-minutes`, `--seat-settle-seconds` |
| `scripts/fingerprint-measurement-mcp.cjs` | `REMOTE_SEAT_SETTLE_MS` cấu hình được; vòng thử lại lệnh mở khi gặp `ENGINE_UNAVAILABLE` |

Vòng thử lại ở file thứ hai **đã chứng minh là không đủ** (mục 2) — giữ lại vì nó ghi đúng hiện tượng
và có comment giải thích, nhưng đừng coi nó là cách chờ seat đã giải quyết xong.

Chưa chạy: lint, test suite, VM sạch, Actions, deploy.

## Câu hỏi chưa có lời đáp

- Mục 1 làm sản phẩm chậm thấy rõ. Chủ dự án chốt: nói thật và chậm, hay giữ nhanh và thỉnh thoảng lỗi?
- "Mỗi lần thử hỏng làm đồng hồ chạy lại" mới có 3 điểm đo. Cần một lượt đo yên tĩnh 25 phút để chắc.
- Có mua key trả phí nhiều chỗ không? Nếu không thì gate danh tính đóng vĩnh viễn ở BLOCKED, và nhịp
  1 nick / 20 phút là ràng buộc sản phẩm chứ không phải bug.

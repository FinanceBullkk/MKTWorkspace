# Audit hiệu quả sản phẩm — MKT (Web + Relay + Browser)

**Ngày:** 17/09/2026 · **Phạm vi:** MKTTool, MKTBrowser, workspace plans/docs
**Cách đo:** bằng chứng trong repo (git, docs, gate logs), không phỏng đoán

## Kết luận

**Kỹ thuật: hiệu quả cao. Sản phẩm: chưa hiệu quả — chưa có ai dùng nó để ra kết quả.**

Sau ~5 tháng và ~1.158 commit, thứ operator ngoài owner thực sự cầm được là một web console quản
lý danh sách (nick vault + proxy vault + Relay PC). Phần tạo ra giá trị thật (Browser + tự động
hoá) vẫn HOLD/NO-GO. Roster team còn OPEN → số người dùng thật ngoài owner = 0.

## Số liệu

| Chỉ số | Giá trị |
|---|---|
| Commit | MKTTool 530 + MKTBrowser 387 + workspace 241 = **1.158** (từ ~04/2026) |
| Code | MKTTool ~66k dòng `src/`, 239 file test · MKTBrowser ~38k dòng, 58 file test |
| Tài liệu/quy trình | 91 file md trong MKTTool (~21k dòng), 95 report, 26 thư mục plan |
| Giao cho team | Web console (vault/proxy/relay/setup) — PASS |
| Browser | 0.3.23 **NO-GO**, phân phối installer **HOLD**; 0.3.17 là bằng chứng lịch sử |
| Người dùng thật | Allowlist **OPEN**, roster chưa chốt → 0 operator ngoài owner |
| Canary 7 ngày | ~~4/7~~ → **1/7** (đính chính 18/09: 4 ngày có dòng ghi sạch, nhưng chỉ 14/09 có vòng mở-đóng profile thật; 15-17/09 máy chỉ được bật lên) |

## Rò rỉ hiệu quả (xếp theo mức tốn kém)

**1. Định nghĩa sản phẩm mâu thuẫn — nguồn gốc của mọi lần đổi scope.**
`MKT_AUTONOMOUS_OS_MASTER_BLUEPRINT.md` đặt mục tiêu "hệ điều hành nuôi nick TikTok tự động, cách ly
vân tay tuyệt đối". `MKTTool/README.md` nói ngược lại: "không phải bot farm, là tủ hồ sơ + bảng điều
khiển". Hai định nghĩa này không thể cùng đúng, và chưa ai chốt. Hệ quả đã trả giá:
- Reddit + Facebook: code xong, test xong, deploy xong → **rút khỏi scope** (02/09).
- Warmup engine (1.339 dòng, 11 file): viết xong → **park** (19/08), lý do ghi trong `parked/README.md`
  là "trái định hướng README", tức là viết trước khi quyết định.
- Antidetect tự làm + Lane C: nghiên cứu nhiều tháng → **closed** (08/09), chuyển sang mua CloakBrowser.

**2. Giá trị lõi nằm ở vendor, không ở repo.**
Chống phát hiện = CloakBrowser (engine thương mại), mỗi operator tự đăng ký key (commit 14/09).
Docs tự tuyên bố rõ: "Neither tuple establishes unique identity, identity isolation, or real-account
safety." Nghĩa là phần khách hàng trả tiền để có thì sản phẩm chưa chứng minh được, còn phần chứng
minh được (quản lý ownership) thì một bảng tính cũng làm được ở quy mô nhỏ.

**3. Guồng release ăn hết throughput gần đây.**
11→14/09: 0.3.18 → 0.3.19 → 0.3.20 → 0.3.21 → 0.3.22 → 0.3.23, không bản nào được promote.
6/12 commit `src/` gần nhất của MKTTool là candidate tuple / compatibility artifact. 8 commit cuối
của workspace đều là `docs(release)`. Không có tính năng operator nào trong giai đoạn này.

**4. 5 gate đang chặn đều không phải việc kỹ thuật.**
Máy thứ hai (`admin-laptop` đang tắt) · người lạ chưa thử · canary 4/7 · chưa có cert ký · chưa xoay
credential. Tổng chi phí thật: vài giờ người + một cái cert. Đây là chặn do quyết định, không do code.

**5. Không đo gì về việc sử dụng.**
Repo đo build hash, exit code, HTTP 200 — rất kỹ. Không có chỗ nào đo: bao nhiêu nick sống, bao nhiêu
lần launch profile thành công, operator mất bao lâu để lên việc. Không có số đó thì "hiệu quả" không
thể trả lời bằng repo.

## Làm tốt thật (giữ nguyên)

- Kỷ luật bằng chứng: two-build byte-identical, đọc ngược hash từ R2, lifecycle VM 9/9–13/13–15/15.
- Bảo mật nghiêm túc: vé Ed25519, DPAPI, không giữ plaintext, fail-closed khi proxy hỏng.
- Docs trung thực bất thường: không chỗ nào thổi phồng, gate OPEN được ghi là OPEN. Hiếm.

Vấn đề không phải chất lượng. Là chất lượng đó đang phục vụ một giả thuyết sản phẩm chưa ai kiểm chứng.

## Việc nên làm, theo thứ tự

1. **Owner chốt một câu định nghĩa sản phẩm** (bot farm tự động, hay tủ hồ sơ có kiểm soát). Mọi lần
   đổi scope tốn kém ở trên đều bắt nguồn từ chỗ này. Đây là việc 30 phút, không phải việc code.
2. **Đóng 5 gate rẻ trong tuần này**: bật `admin-laptop`, nhờ 1 người lạ thử 30 phút, canary chạy nốt
   tới 20/09, mua cert ký, xoay credential theo runbook.
3. **Đóng băng 0.3.23.** Không lên 0.3.24 trừ khi có defect chặn. Guồng version đang tiêu throughput
   mà không đổi lấy promotion.
4. **Cho 1 operator lạ chạy thật 1 nick TikTok trong 1 tuần.** Đó là phép thử hiệu quả duy nhất có
   giá trị hiện nay; mọi gate còn lại chỉ đo "máy này sẵn sàng", không đo "sản phẩm dùng được".
5. **Thêm 3 con số vào Web**: nick đang sống, lần launch thành công/tuần, thời gian onboard operator.

## Câu hỏi chưa có lời đáp

- Sản phẩm nhắm tới ai trả tiền: đội nội bộ, hay bán ra ngoài? Câu trả lời đổi hoàn toàn mức đầu tư
  hợp lý cho guồng release hiện tại.
- Chi phí CloakBrowser theo đầu operator đã tính vào giá chưa?
- Reddit/Facebook code đã build xong — giữ, xoá, hay bật lại? Đang trả phí bảo trì cho code không dùng.

---

## Bổ sung 17/09 — owner xác nhận: **chỉ dùng nội bộ, không bán ra ngoài**

Điều này đổi kết luận. Quy mô thật: **5-6 người, 5-6 máy đã biết** (`MKTTool/README.md:514`).

### Rò rỉ hiệu quả lớn nhất, viết lại

Không phải "chưa ai dùng". Là **sản phẩm đang được xây theo chuẩn phát hành công khai cho một
tệp người dùng không tồn tại.** Với 5-6 người quen trên 5-6 máy quen, phần lớn guồng gate hiện
tại đang bảo vệ khỏi những rủi ro của việc phát hành ra người lạ:

| Gate / hạ tầng | Với khách lạ | Với 5-6 người nội bộ |
|---|---|---|
| Cert ký public + SmartScreen | Bắt buộc | **Không cần** — bấm qua 1 lần trên 5-6 máy, có admin ngồi cạnh |
| "Unfamiliar-operator acceptance" | Bắt buộc | **Chính là buổi onboard** một teammate. Không phải gate, là việc thường ngày |
| Immutable sequence channel, anti-downgrade, revocation | Bắt buộc | Đã xây xong — **đóng băng, đừng mở rộng thêm** |
| Two-build byte-identical | Chống supply-chain | Đã xây xong — giữ, không đầu tư thêm |
| Máy vật lý thứ hai | Bắt buộc | **Vẫn bắt buộc** — mọi bằng chứng hiện nay chỉ chứng minh "máy build này sẵn sàng" |
| Canary 7 ngày | Bắt buộc | **Vẫn giữ** — miễn phí, nhưng thực đo là 1/7 (xem đính chính 18/09) |
| Xoay credential | Bắt buộc | **Vẫn bắt buộc** — secret production đã lộ ra tool output, độc lập với release |

6 phiên bản trong 5 ngày (0.3.18→0.3.23), không bản nào promote, cho 5-6 người dùng. Đó là chi phí
thật của việc áp chuẩn public vào bài toán nội bộ.

### Ngược lại: nội bộ **hạ thấp** rào ship, không nâng lên

Lý do 0.3.23 đang NO-GO là một bộ gate cỡ public. Với 5-6 máy nội bộ và admin có mặt, hoàn toàn có
thể giao 0.3.23 **ngay tuần này** dưới đúng ranh giới "controlled internal" mà 0.3.17 đã từng dùng —
miễn là giữ 3 thứ còn giá trị thật: máy thứ hai, canary, xoay credential.

### Việc nên làm, viết lại theo thứ tự

1. **Chốt định nghĩa sản phẩm** (bot farm hay tủ hồ sơ) — không đổi, vẫn là việc số 1.
2. **Giao 0.3.23 cho 5-6 người trong tuần này** dưới ranh giới controlled-internal. Không chờ cert.
3. **Bật `admin-laptop`** — đây là gate duy nhất còn chặn có giá trị kỹ thuật thật.
4. **Xoay credential** theo runbook — việc bảo mật đang mở, không liên quan release.
5. **Huỷ 2 gate**: mua cert ký public, và nghi thức "unfamiliar-operator" (gộp vào buổi onboard).
6. **Đóng băng guồng version.** Không 0.3.24 trừ khi có defect chặn người dùng thật.
7. **Tính lại chi phí CloakBrowser × 5-6 operator/năm.** Nội bộ = không có doanh thu bù; lợi ích duy
   nhất là giờ công tiết kiệm và nick không chết. Nếu chưa có con số đó thì chưa biết có đáng không.

### Câu hỏi còn lại (đã bớt một)

- ~~Bán ra ngoài hay nội bộ?~~ → **Nội bộ.** Đã trả lời 17/09.
- ~~Chi phí CloakBrowser?~~ → **Key free, mỗi người tự đăng ký.** Đã trả lời 17/09 — xem phần dưới.
- Reddit/Facebook code đã build xong — giữ, xoá, hay bật lại?

---

## Bổ sung 17/09 (2) — CloakBrowser dùng **key free, mỗi người tự đăng ký**

Chi phí licence = **0**. Câu hỏi ROI phía chi phí đóng lại. Nhưng đổi lại mua về 3 ràng buộc, và
một trong số đó là **trần quy mô của cả sản phẩm**.

### 1. Trần cứng: 1 key = 1 phiên đồng thời

`SEAT_LIMIT_EXIT_CODE = 76` — *"this key already has a session open"*
(`MKTBrowser/apps/desktop/src/main/licence-verdict.ts:24`).

→ **Mỗi operator mở được đúng 1 profile tại một thời điểm. Cả team 5-6 người = tối đa 5-6 nick
chạy đồng thời**, bất kể vault có bao nhiêu nick.

Con số này khớp với ranh giới đã chốt (`fingerprint-acceptance-gate.md`: *"Pool size 3-5 profiles
per machine. One profile active at a time"*), nên nó **không phá** hướng "tủ hồ sơ". Nhưng nó làm
blueprint *"nuôi dàn profile TikTok quy mô lớn"* trở thành **bất khả thi về số học** trên key free.
Đây là cùng một mâu thuẫn với việc số 1 (chốt định nghĩa sản phẩm), lần này có con số kèm theo.

### 2. Tầng danh tính nằm trên free tier của bên thứ ba

- Exit 78: *"licence server could not be reached, so the browser refused to start"* → vendor down
  hoặc bị chặn = **không ai trong team mở được profile**. Fail-closed, đúng thiết kế, nhưng
  nghĩa là uptime của sản phẩm = uptime của vendor.
- Vendor đổi chính sách free tier bất cứ lúc nào → sản phẩm dừng qua đêm, không có đường lui vì
  hướng tự làm antidetect đã CLOSED (08/09).
- Licence check **không đi qua proxy của profile** (ghi rõ trong `cloakbrowser-pro-channel.ts:237`)
  → mỗi lần mở profile là một lần gọi về vendor **bằng IP thật của operator**. Vendor nhìn thấy toàn
  bộ hoạt động. Không phải rủi ro nền tảng phát hiện, nhưng là một mặt tương quan cần biết.

### 3. Đính chính 17/09 — Web **đã biết** giới hạn này

Câu "Web không mô hình hoá giới hạn 1 phiên" ở bản trước **sai**. Kiểm lại:
`src/lib/relay/current-device-browser-health.ts:106-131` đọc `licenseCapacity` từ MKT Browser và
chặn trước khi mở: `NO_CAPACITY` ("All browser capacity is in use or cooling. Close a running
profile, then retry"), `RECOVERY_PENDING`, `CAPACITY_UNKNOWN`. Contract `MktBrowserLicenseCapacity
{ total, free, active, pendingRecovery, cooling }` đã có sẵn.

**Lỗ hổng thật, hẹp hơn: có hai nút mở profile, chỉ một nút lọc.**

| Surface | Đường báo hỏng | Trạng thái |
|---|---|---|
| `Constellation` / `ProfileTable` / `ProfileTile` (trang chủ) | `describeProfileLaunchFailure()` — tra theo mã, không chuyển tiếp câu gốc | Đúng từ đầu |
| `account-vault-actions-panel.tsx` (trang chi tiết nick) | `describeRelayFailure()` → trả **nguyên văn** `attempt.message` | **Đã sửa 17/09** |

Hai hệ quả của nhánh chưa lọc:
1. Nuốt mất `NO_CAPACITY` — operator gặp đúng giới hạn 1 phiên nhưng không được giải thích.
2. **Rò nội dung lỗi engine.** Câu của Relay ghép bằng `${describe(error)}`
   (`relay/src/launch-profile.ts:96,109`), tức mang theo chuỗi kết nối proxy và bất cứ thứ gì engine
   kèm vào lỗi. Đây đúng là thứ `describeProfileLaunchFailure()` được viết ra để chặn — test
   `profile-launch-readiness.test.ts` dùng hẳn `"connect 203.0.113.10:1080 using cb_live_secret_key"`
   làm mẫu. Nhánh trang chi tiết nick đi vòng qua lớp chặn đó.

**Đã xử lý:**
- `account-vault-actions-panel.tsx`: nhánh `rejected` đi qua `describeProfileLaunchFailure()`.
  Nhánh `no-permission` và `unreachable` giữ nguyên vì chúng biết nhiều hơn (sự cố 07/08/2026, và
  nhánh `unreachable` nghe theo ping).
- Thêm `src/lib/relay/launch-failure-message-boundary.test.ts`: phép canh hình dạng mã nguồn — mọi
  file vừa gọi `sendTicketToRelay(` vừa chạm `/launch` phải dùng `describeProfileLaunchFailure`.
  Đã kiểm ngược: guard này **có** bắt đúng bản HEAD trước khi sửa.
- typecheck sạch, eslint sạch, `vitest run src/lib/relay` 23 file / 167 test pass.

**Luồng tạo profile — đã xử lý nốt 17/09 (commit `0d586fe`):** `antidetect-profile-card.tsx` cũng
hiện nguyên văn câu Relay, và `relay/src/create-profile.ts:73` cũng ghép bằng `${describe(error)}`.
Không dùng lại được bảng của luồng mở vì luồng tạo có **hai ngoại lệ có chủ ý**:

- `INVALID_INPUT` phải chuyển tiếp — MKT Browser liệt kê đúng các giá trị vân tay hợp lệ ngay trong
  câu đó; viết lại là vứt mất thứ duy nhất giúp sửa được lỗi.
- Chặng `browser-health` **không có mã** và câu của nó do chính Relay viết cho người đọc ("đóng bớt
  một profile đang mở rồi thử lại"). Chỉ đọc mã thì mất câu này.

Mọi trường hợp còn lại của chặng `create-profile` thì tra bảng hoặc về câu chung.
`relayFailureCode()` / `relayFailureStage()` tách ra module riêng vì hai luồng đặt mã ở hai chỗ khác
nhau (mở: thân phản hồi; tạo: trong `diagnostic`).

**Gate đã chạy cho cả hai commit:** typecheck sạch · eslint sạch · **toàn bộ test suite 237 file /
2226 test pass** (có cả test chạm Postgres). Guard biên giới đã kiểm ngược: bắt đúng cả hai file bản
HEAD trước khi sửa. Chưa chạm VM, Actions, hay deploy.

### Kết luận phần này

Key free **làm tăng** hiệu quả nội bộ: chi phí 0, mô hình BYO đúng (build không ship key, key nằm
trên máy người dùng). Đổi lại, trần quy mô bị đóng đinh ở 5-6 phiên đồng thời và uptime phụ thuộc
vendor. Cả hai đều chấp nhận được cho 5-6 người — **miễn là owner chốt rằng sản phẩm dừng ở đó.**

---

## Đính chính 18/09 — canary không phải 4/7 mà là 1/7

Câu "canary 4/7, đúng tiến độ" ở bản trên **sai**, và tôi đếm nhầm theo kiểu dễ nhầm nhất: đếm số
dòng trong nhật ký vòng đời thay vì đếm vòng mở-đóng profile.

| Ngày | Nhật ký vòng đời ghi gì | Tính? |
|---|---|---|
| 14/09 | `BOOTSTRAP-DONE` ×3, `SHUTDOWN-COMPLETE` ×3 | **Có** |
| 15/09 | `ORPHAN-SWEEP-NONE` ×1 | Không |
| 16/09 | `ORPHAN-SWEEP-NONE` ×2 | Không |
| 17/09 | `ORPHAN-SWEEP-NONE` ×3 | Không |

`ORPHAN-SWEEP-NONE` là lượt quét mồ côi chạy **mỗi lần bật app**, không phải một lần dùng máy.
Ba ngày đó máy được bật lên rồi thôi.

Canary giờ tự đo điều kiện này (commit `5ae5919` bên MKTBrowser): mỗi dòng mang
`profileActivity` đếm mở/đóng trong 24 giờ trước, và `--summary` báo thẳng
`1/7 used day(s)` kèm danh sách ngày ngồi không. Muốn đủ bảy ngày thì phải dùng máy thật mỗi ngày.

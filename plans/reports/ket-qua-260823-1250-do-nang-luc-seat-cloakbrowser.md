# KẾT QUẢ — đo năng lực seat CloakBrowser trên giao thức thật

**Ngày:** 23/08/2026 · **Người đo:** Claude · **Khoá:** live operator key (`cb_6b15247…`)
**Công cụ:** `local-test-artifacts/phase5/measure-concurrent-seat-capacity.mjs`

---

## Kết quả

| Phép đo | Kết quả |
|---|---|
| `session/start` lần 1 | HTTP 200, `valid:true`, `plan: "free"` |
| `session/start` lần 2 | **HTTP 403** |
| Server trả lời | `{"valid":false,"error":"session_limit_exceeded","active_sessions":1,"limit":1}` |
| `lease_ttl_seconds` | 900 (15 phút) |
| `heartbeat_interval_seconds` | 300 (5 phút) |
| `session/end` | HTTP 200 `{"ok":true}` — seat trả lại sạch |

**Năng lực đồng thời đo được: 1.**

Đây là con số máy chủ cấp, không phải suy ra từ tên gói hay từ tài liệu. Mọi lease do phép đo mở
đều đã đóng; không giữ seat nào.

---

## Ý nghĩa

### 1. Giao thức vendor đã được đo — gate Phase 5 mở được một phần

Plan ghi `license-capacity-v1` cố ý không quảng bá vì *"the live vendor session protocol"* chưa được
đo. Giờ đã đo: `start` → `lease_id` + TTL 900s + heartbeat 300s → `end` trả `{"ok":true}`.

Còn thiếu: heartbeat thật trong một phiên dài, và hành vi phục hồi khi crash giữa chừng.

### 2. Toàn bộ giới hạn vận hành là **1 profile tại một thời điểm**

Không phải giới hạn của code. `limit: 1` đến từ vendor.

Điều này giải thích trọn vẹn lịch sử của dự án:

- *"one session per licence key, with rotation when a key is refused"*
- *"CloakBrowser seat refusal looks like a crash"* — HTTP 403 xảy ra **sau** khi CDP đã phục vụ
- *"a crashed app no longer costs a 17-minute wait"* — TTL 900s = 15 phút, cộng lề

### 3. Mâu thuẫn với mục tiêu sản phẩm

Blueprint đặt mục tiêu *"Hệ điều hành Tự động hóa Vận hành & Nuôi dàn Profile TikTok **quy mô lớn**"*.

Với `limit: 1`, số profile chạy đồng thời tối đa là **một**. Không phải 50, không phải 10.

Kiến trúc đã lường trước: `license-key-pool.ts` tồn tại, và commit `548fca5` viết *"one session per
licence key, with rotation when a key is refused"*. Tức **N khoá = N profile đồng thời**. Code sẵn
sàng; thứ thiếu là số khoá.

### 4. Gate cách ly của Phase 5 không chạy được như thiết kế

Gate yêu cầu hai profile, hai proxy, chứng minh A không bao giờ ra bằng đường của B. Điều đó cần
**hai phiên đồng thời**.

Hai lựa chọn:

| Cách | Chứng minh được | Không chứng minh được |
|---|---|---|
| Mua thêm 1 khoá → 2 seat | Đúng như thiết kế | — |
| Chạy tuần tự A rồi B | Mỗi profile ra đúng proxy của nó | Hai profile chạy cùng lúc có cross-wire không |

Cách tuần tự không vô giá trị, nhưng phải ghi đúng tên: nó **không** đóng được gate cách ly.

---

## Bằng chứng phụ — hai proxy test

Đo bằng probe độc lập ngoài trình duyệt:

| | Exit IP | ASN |
|---|---|---|
| Không proxy | `14.169.109.47` | — |
| Proxy A | `82.29.239.125` | AS10753 Level 3, Singapore |
| Proxy B | `82.25.225.8` | AS10753 Level 3, Singapore |

Hai exit IP khác nhau và khác IP thật → dùng test cơ chế được.

**Không đại diện cho vận hành thật:** cả hai là IP datacenter cùng ASN, trong khi blueprint yêu cầu
*"4G Mobile hoặc Dân cư tĩnh"*. Chủ dự án xác nhận đây là proxy chỉ để test.

---

## Câu hỏi chưa giải

1. Gói trả phí của CloakBrowser có tăng `limit` không, hay mỗi khoá vĩnh viễn là 1 phiên? Quyết định
   giữa *nâng gói* và *mua N khoá* phụ thuộc câu này.
2. Vận hành thật cần bao nhiêu profile chạy **đồng thời**? Con số đó nhân với giá khoá là chi phí
   sàn của cả hệ thống.
3. Dàn nick thật hiện đang chạy trên loại IP nào? Nếu cũng là datacenter thì đó là rủi ro lớn hơn
   mọi hạng mục còn lại của Phase 5.
4. Có mua nổi một khoá riêng cho test không? Khoá hiện tại là khoá live, và mỗi lần test đều lấy
   mất seat duy nhất của vận hành.

# Research — giao thức license CloakBrowser, đo trực tiếp

**20/08/2026 08:58** · Phương pháp: đọc chuỗi trong `chrome.dll`, rồi trỏ `CLOAKBROWSER_LICENSE_API`
sang một listener nội bộ và đọc request nguyên văn. **Không tốn seat** — request không tới máy chủ thật.

## Câu hỏi

Tôi đã khẳng định *"một máy = một `install_id` dùng chung cho mọi key, nhà cung cấp nhìn thấy điều
đó"* mà chưa kiểm. Đây là phần kiểm.

## Kết quả: khẳng định đó ĐÚNG, và giờ có bằng chứng

```
POST /api/license/session/start
Content-Type: application/json

{
  "install_id":  "d364c1e8-93c9-4324-a212-d38962e2fe21",
  "instance_id": "ff4d024d-ec13-43dc-ad9c-46d1eb8a1e7c",
  "license_key": "cb_6b1524709bb54fae8c3fc8119ebdf2ae",
  "platform":    "windows-x64",
  "version":     "151.0.7922.108"
}
```

- `install_id` khớp **chính xác** nội dung `~/.cloakbrowser/install_id`, tồn tại từ 19/08, không đổi
  qua các lần chạy ⇒ **định danh máy, bền**
- `instance_id` là UUID mới mỗi lần khởi động ⇒ đó là lý do nó "chết theo tiến trình"
- **Mọi key gửi từ máy này đều kèm cùng một `install_id`.** Nhà cung cấp tương quan được mà không
  cần cố gắng gì.

### Đính chính giữa chừng, ghi lại để khỏi ai lặp lại

Grep ASCII trong `chrome.dll` **không** thấy `install_id` trong khối licence — chỉ thấy nó trong
`updater_no_updater.cc` (không liên quan). Suýt kết luận là claim sai. Nguyên nhân: đường dẫn Windows
là **UTF-16** (`std::wstring`). Tìm lại bằng UTF-16 mới ra:

```
license.key | .cloakbrowser | install_id     @0x12111372, ngay canh khoi licence
```

⇒ Quét chuỗi binary trên Windows **phải quét cả hai bảng mã**, không thì kết luận ngược.

## Bề mặt giao thức (chuỗi từ `components/ungoogled/license_runtime.cc`)

```
POST /api/license/session/start       -> mo phien, tra ve lease
POST /api/license/session/heartbeat   -> giu phien
POST /api/license/session/end         -> tra chO ve

truong:  license_key · license_key_hash · lease_id · install_id · instance_id
         platform · version · expires_at
         heartbeat_interval_seconds · lease_ttl_seconds
ma loi:  license_inactive · session_limit_exceeded
base:    https://cloakbrowser.dev   (doi bang CLOAKBROWSER_LICENSE_API)
env:     CLOAKBROWSER_LICENSE_KEY · CLOAKBROWSER_LICENSE_API
         CLOAKBROWSER_LICENSE_STATUS_FILE
co:      --license-through-proxy
```

`CLOAKBROWSER_LICENSE_STATUS_FILE` chỉ ghi **mã thoát** (đo được: nội dung là `77`), không phải state
đầy đủ. Không lấy được `lease_id` từ đó.

## Ba hệ quả

### 1. Cooldown giải quyết được triệt để — bằng chính API của họ

`session/end` cần `lease_id` + `install_id` + `instance_id`. Trước nay coi là bất khả vì `lease_id`
chỉ nằm trong bộ nhớ engine. **Nhưng `CLOAKBROWSER_LICENSE_API` trỏ đâu cũng được**, và nó là HTTP
thường — không cần can thiệp TLS.

Nên app có thể chạy một relay nội bộ: chuyển tiếp mọi request tới máy chủ thật, đồng thời **ghi lại
`lease_id` từ response của `session/start`**. Có `lease_id` rồi thì lúc khởi động lại sau một cú
crash, app tự gọi `session/end` — **trả chỗ ngay, không chờ 7–17 phút**, kể cả ca mất điện mà
phase-01 không cứu được.

Đây là dùng đúng endpoint của họ, đúng mục đích của nó (kết thúc phiên của chính mình). Ngược hẳn
với lách luật: nó **trả chỗ sớm hơn**.

### 2. Nhiều key trên một máy là chuyện lộ thiên

`install_id` đi kèm mọi request. N key free từ cùng một `install_id` là chữ ký hiển nhiên. Không có
cách nào che mà không giả mạo `install_id` — thứ tôi sẽ không dựng.

Rủi ro cụ thể: khoá theo `install_id` sẽ giết **mọi key** trên máy đó cùng lúc.

### 3. `--license-through-proxy` — liên quan việc đang làm

Có cờ cho phép kiểm license đi qua proxy của profile. Hiện chưa dùng. Đáng cân nhắc ở GĐ proxy:
mặc định kiểm license đi thẳng, tức lộ IP thật của máy ra máy chủ license song song với traffic
proxy — chưa đánh giá tác động fingerprint.

## Ghi chú phương pháp

Xác nhận thêm một lần nữa cái bẫy đã tốn cả tối 19/08: stderr in
`DevTools listening on ws://127.0.0.1:9791/...` **trước** khi có phán quyết license (exit 77 sau đó).
CDP lên trước, phán quyết đến sau — góc nhìn thứ ba, cùng kết luận.

## Câu chưa giải quyết

1. `session/start` trả về gì khi thành công? Chưa biết hình dạng `lease_id`, `lease_ttl_seconds`,
   `heartbeat_interval_seconds` thật. Cần một lần chạy qua relay tới máy chủ **thật**.
2. `lease_ttl_seconds` có phải nguồn của con số 7–17 phút không? Nếu phải thì đó là hằng số đọc được,
   không còn phải đoán.
3. Điều khoản gói free có cấm một người giữ nhiều key không? Chưa đọc ToS — đây là câu pháp lý, không
   phải kỹ thuật.
4. `license_key_hash` dùng ở đâu? Có trong chuỗi nhưng không có trong body `session/start`.

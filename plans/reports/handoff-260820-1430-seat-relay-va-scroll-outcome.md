# Handoff — seat relay, scroll outcome, và 3 lỗi đã chốt

**20/08/2026 13:30–14:30** · Phạm vi: chốt các lỗi còn lại của `tiktok-e2e.mjs` — exit-76 liên tục, scroll hang, null-exitCode race.

## Kết quả

### 1. Seat relay → chấm dứt exit-76

**Vấn đề:** engine spawn raw không có driver, shutdown không gọi `session/end` ⇒ seat bị giữ đến hết TTL (900 giây = 15 phút). Chạy back-to-back → exit 76.

**Giải pháp:** route traffic license qua local relay (đúng kiến trúc MKTTool app đã dùng, research-260820-0858 mục 1). Relay:
- Chặn request `POST /api/license/session/start`, ghi lại `lease_id` + `install_id` + `instance_id` + `license_key`
- Forward request/response verbatim tới cloakbrowser.dev
- Khi engine shutdown, nếu chưa thấy `session/end` từ engine, relay tự gọi `session/end` với lease đã capture

**Kết quả:** 5 run liên tiếp (smoke9→14) đều exitCode 0, relay thấy engine tự gọi session/end (200). Back-to-back smoke9→smoke10 thành công.

**Dữ liệu từ server:**
- `lease_ttl_seconds: 900` (15 phút)
- `heartbeat_interval_seconds: 300` (5 phút)
- `plan: "free"`, `limit: 1`
- Khi seat bị chiếm: `{"valid":false,"error":"session_limit_exceeded","active_sessions":1,"limit":1}`

### 2. Scroll hang → đo outcome, không đo ack

**Vấn đề gốc (đã sai):** nghĩ `--disable-gpu` làm bão hoà renderer → Input.dispatchMouseEvent timeout. smoke4 (GPU) vẫn 1/5 timeout → giả thuyết sai.

**Nguyên nhân thật:** (a) scroll quá sớm trước khi feed container khởi tạo, (b) đo `window.scrollY` — TikTok scroll container là inner div với class hash (`enable-1col-refine css-1q...`), `window.scrollY` luôn 0. CDP ack bị withhold khi feed chưa sẵn sàng (timeout 8s) dù Runtime.evaluate vẫn chạy.

**Giải pháp:**
- Quét toàn bộ DOM tìm container có scrollHeight-clientHeight lớn nhất (generic, không fixed candidate list)
- Chờ feed sẵn sàng (poll diff > 100px) trước scroll
- Đo outcome: container.scrollTop trước/sau mỗi wheel burst, không dựa vào ack

**Kết quả:** smoke13 (GPU) + smoke14 (disable-GPU) đều 4/5 scroll OK. Lần đầu luôn 0 (TikTok warm-up), 4 lần sau scroll thực tế.

### 3. exitCode race → double-write

**Vấn đề:** `child.exitCode` null khi JSON ghi lần đầu (race với child `exit` event). smoke3 có null.

**Giải pháp:** ghi JSON hai lần — lần 1 (snapshot sớm), lần 2 (sau shutdown sequence, `child.exitCode` chắc chắn). Tất cả smoke9-14 exitCode 0.

### 4. Retry wrapper

Thêm vòng lặp retry 3 lần với backoff (25s/50s) cho exit 76. Là safety net — với relay hoạt động, retry hiếm khi cần. Giữ nguyên.

## Files changed

- `tiktok-e2e.mjs` — bản chính (relay, scroll outcome, feed-settle, retry, double-write, SCROLL_STATE_JS generic)
- `poll-seat.mjs` — script gọi session/start trực tiếp để kiểm seat free (không tiêu thụ seat)
- `scroll-debug.mjs` — script chẩn đoán scroll (thử wheel/keyboard/JS scrollTop)

## Còn lại

1. **Login flow:** chưa test được (cần tài khoản thật). Các component đã kiểm: seat, nav, ttwid, signature, scroll, shutdown. Login path cần account tag trong `tiktok-accounts.json`.
2. **Scroll lần đầu 0/5:** TikTok nuốt wheel đầu tiên (cần warm-up). Nếu muốn 5/5, thêm scroll giả trước vòng lặp.
3. **`--keep-gpu` vs `--disable-gpu`:** không ảnh hưởng scroll. GPU có thể ảnh hưởng canvas hash (smoke13=408776913, smoke14=2601446965) — do seed fingerprint, không phải GPU.

## Quy tắc vận hành mới

- `tiktok-e2e.mjs` có thể chạy back-to-back không cần chờ (relay tự end session).
- Nếu thấy exit 76, retry tự động (3 lần, 75s tổng). Nếu vẫn 76, có orphan từ run trước (chờ TTL 15 phút).
- Scroll fail không abort run.
- `--keep-gpu` vẫn hợp lệ nếu muốn test, nhưng không ảnh hưởng scroll.
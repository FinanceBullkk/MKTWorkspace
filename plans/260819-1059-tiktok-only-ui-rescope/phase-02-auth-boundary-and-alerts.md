# Phase 02 — Bịt rò dữ liệu + trả lại khay cảnh báo

**Ưu tiên:** P0 · **Trạng thái:** ✅ XONG 19/08/2026

## 2.1 Rò dữ liệu ra người chưa đăng nhập

`src/app/layout.tsx:12-15` query Prisma vô điều kiện rồi đổ vào TopBar. Screenshot `/login`
lúc đăng xuất hiện `0 running · 1 total` và `● Relay v15 (AnhHao)` — số nick trong kho và
**tên máy relay thật** lộ cho bất kỳ ai mở URL.

**Sửa:**
- `readActor()` trước. Chưa đăng nhập → render `children` trần, không dựng AppShell.
- Đăng nhập rồi mới query count + device.
- Bỏ luôn 2 query/lần-render cho khách.

**Thêm:** trang `/login` hiện nằm trong AppShell nên có rail + ô search profile — vô nghĩa
với người chưa vào được. Sửa trên giải quyết cùng lúc.

## 2.2 `Relay v15` là chuỗi cứng

`layout.tsx:19` + default của `AppShell`/`TopBar`. Commit `3a0bcd0` vừa làm version thành số
thật đọc từ DB (`relayDevice.version`) — hardcode đè lên nó là quay ngược.

**Sửa:** đọc `version` thật; thiếu thì hiện tên máy trần, không bịa số.

## 2.3 Khay cảnh báo mất 90% nội dung

`ops-alert-tray-client.tsx` so với bản cũ:

| | Cũ | Mới | Hệ quả |
|-|----|-----|--------|
| Số alert vẽ | tất cả | `alerts[0]` | các cảnh báo còn lại **biến mất im lặng** |
| Tone | amber / red riêng | amber cứng | alert `red` ("Đang hỏng") đọc như nhắc nhẹ |
| Đóng được | không | có nút ✕ | giấu được lỗi cấu hình |
| a11y | `role="status"` + aria-label | không có | screen reader không thấy |
| Câu dài | xuống dòng | `truncate` | cụt |

**Sửa:** vẽ đủ `alerts`, giữ map tone → màu, bỏ nút ✕ (giữ "Thu gọn" nếu muốn),
trả `role="status"` + `aria-label`.

## Xong khi

- `curl -s localhost:3000/login` không chứa tên máy relay lẫn số nick
- Có ≥2 alert thì thấy đủ ≥2, alert `red` ra màu đỏ
- Không còn chuỗi `"Relay v15"` trong `src/`

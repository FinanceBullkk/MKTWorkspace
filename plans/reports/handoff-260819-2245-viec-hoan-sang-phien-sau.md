# Việc hoãn sang phiên sau — 19/08/2026 22:45

> ⚠️ **ĐÃ LỖI THỜI.** Bản này viết lúc còn tưởng công cụ chạy được. Sau đó phát hiện hồi quy:
> profile mở lên rồi chết sau ~10 giây, do chính commit `88dad47` của phiên này.
> Đọc [handoff-260819-2310](handoff-260819-2310-hoi-quy-profile-chet-sau-10-giay.md) thay cho bản này.

Chốt cuối phiên. Tool đã chạy được; phần dưới là nợ, không cái nào chặn buổi test TikTok.

## Nghiệm thu còn thiếu — làm trước tiên, 3 phút

Mở profile **không proxy** → `browserscan.net` → đọc dòng **DNS Leak**.

- Phải ra resolver **VNPT / Việt Nam**
- Trước khi vá: `74.114.31.150` + 5 IP nước ngoài (do cờ chống DoH kẹt trong nhánh `if (profile.proxy)`)
- Vá ở `88dad47`, **chưa ai xác nhận trên máy thật**

Chưa qua bước này thì **đừng merge** và **đừng chạy runbook**.

Hai chỗ chưa đọc được, bấm luôn khi đang mở: **"Detection"** cạnh *IP Time Zone* (hiện màu đỏ),
và **"Unexpand"** ở thanh *Browser fingerprint authenticity: 90%*.

## Merge — đích là `main`, KHÔNG phải `master`

```
master      83c6898 · 26/07 · v0.3.1        ← con trỏ chết, đừng dùng
main        origin/HEAD tro vao day          ← trunk that
nhánh hiện tại: hơn origin/main 17 commit, kém 1 commit, CHƯA đẩy lên remote
```

Thứ tự: nghiệm thu DNS → `pull --rebase origin main` → chạy lại `test:installer`
(rebase đổi nền nên guard NSIS + test tường lửa phải xanh lại) → đẩy nhánh → PR vào `main`.

## Nợ kỹ thuật

### 1. Quét dọn tiến trình mồ côi lúc khởi động — nhỏ, đáng làm sớm

App đóng profile đúng chuẩn rồi (`Browser.close` → SIGTERM → SIGKILL), và `before-quit` gọi
`closeAll()`. Nhưng nếu **app bị tắt cứng** (Task Manager, mất điện, crash) thì chrome con mồ côi,
**giữ seat license**. Gói free chỉ 1 seat và phiên treo mất **10–15 phút** mới hết hạn.

`findBrowserProcessesUsingDataDir` đã có sẵn, hiện chỉ dùng lúc đóng profile. Cần: lúc khởi động,
quét profile đã biết, tìm tiến trình mồ côi giữ data-dir, đóng bằng **`Browser.close`** (không
SIGKILL — SIGKILL vẫn giữ seat).

Không nhả seat bằng API được: `session/end` đòi `lease_id` + `install_id` + `instance_id`; chỉ
`install_id` nằm trên đĩa (`~/.cloakbrowser/install_id`), hai cái kia chết theo tiến trình.

### 2. Phase-04 — dựng lại tile/layout

Cần nhìn bằng mắt, và kết quả 72h có thể đổi thứ tile cần hiển thị. Hai mục phase-05 cố ý để lại
thuộc đây: ô search chưa lọc thật, chip "Running" chưa có nguồn dữ liệu.

### 3. Bộ ký compatibility set

Bộ ghi pin đã có (`1fa05be`) — đó là nửa dưới. Nửa trên (ký + activate) chặn bởi nghi thức khoá
trong `docs/release-signing-key-ceremony.md`: root offline, máy air-gapped, diễn tập khôi phục.
Cần chủ dự án ngồi vào máy, không phải việc code.

### 4. IPv6 khi lên proxy (GĐ 1)

Egress hiện là IPv6 (`2001:ee0:…` VNPT). Chưa sao khi không proxy. **Thành vấn đề khi cắm dongle**:
proxy chỉ IPv4 thì IPv6 đi vòng qua proxy — đường rò IP thật kinh điển. Launch có proxy đẩy mọi
thứ qua cầu SOCKS5 nên HTTP an toàn; khe hở còn lại là WebRTC, đã phủ bằng rule tường lửa +
`--fingerprint-webrtc-ip`.

## Bài học của phiên — 5 lỗi, cùng một hình dạng

| Lỗi | Ràng buộc không được phát biểu |
|---|---|
| GNU tar che bsdtar | PATH quyết định binary nào chạy |
| Cổng pin thiếu bộ ghi | Có hàm đọc, không có hàm ghi |
| Tường lửa chặn UDP 53 | "Chặn hết UDP" giết luôn DNS |
| Cờ DNS kẹt trong `if (profile.proxy)` | Profile không proxy không nhận cờ nào |
| NSIS cắt chuỗi ở 8192 | Cắt xong vẫn chạy tiếp |

Không lỗi nào tìm được bằng đọc code. Bản vá `186dcee` là bản duy nhất **biến ràng buộc thành
thứ tự lên tiếng khi bị vi phạm** — hướng đó đáng nhân rộng hơn là thêm comment.

## Câu chưa giải quyết

1. DNS sau khi vá có về VNPT không.
2. Múi giờ đỏ và 10% thiếu trên browserscan là gì.
3. Có đẩy nhánh lên GitHub mở PR sẵn không.

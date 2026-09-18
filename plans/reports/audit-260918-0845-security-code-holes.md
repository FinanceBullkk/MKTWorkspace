# Audit lỗ hổng bảo mật — mã nguồn MKTTool + MKTBrowser

**Ngày:** 18/09/2026 · **Cách làm:** đọc mã tĩnh + chạy gate có sẵn. **Không** pentest động, không scanner.

## Kết luận

**Không tìm thấy lỗ hổng khai thác được.** 4 điểm đáng ghi, đều là *chiều sâu phòng thủ* hoặc
*quyết định thiết kế*, không phải lỗi. Rủi ro bảo mật lớn nhất của dự án hiện nay **không nằm trong
code** — nó là credential đã lộ qua tool output và chưa xoay hết (đã ghi trong roadmap 13/09).

## Đã kiểm và sạch

| Mặt tấn công | Kết quả |
|---|---|
| **Lối vào** | Test hình dạng phủ 37 server action + mọi route. `NOT_YET_GUARDED` **rỗng** từ 05/08. Chỉ 2 route không gác có chủ ý (Better Auth, healthz), kèm lý do viết tại chỗ |
| **SQL injection** | Mọi raw query dùng tagged template (tham số hóa). `$queryRawUnsafe` chỉ có trong script migrate của admin |
| **XSS** | **0** `dangerouslySetInnerHTML`, **0** `eval` / `new Function` |
| **Mass assignment** | Prisma nhận object đã qua zod; không có `data: req.body` |
| **Mã hoá kho** | AES-256-GCM, IV 96-bit ngẫu nhiên mỗi lần, auth tag kiểm khi giải mã |
| **Phiên đăng nhập** | `httpOnly` · `sameSite=lax` · `secure` khi production · hết hạn 7 ngày |
| **Danh sách trắng** | So khớp chính xác sau chuẩn hoá; **cố ý** không gộp mẹo dấu chấm/`+` của Gmail; admin phải nằm trong allowed, kiểm lúc khởi động |
| **Relay HTTP (47821)** | Bind `127.0.0.1`; CORS **một origin khớp nguyên văn**, không wildcard; preflight cache ngắn |
| **Vé Ed25519** | Sống 30 giây · chống phát lại · ràng đúng máy nhận · rate limit · sàn phiên bản Relay |
| **DPAPI (Windows)** | Script PowerShell là **hằng**, bí mật đi qua **stdin** — không nội suy, không injection. Tên file lấy từ union type, không traversal |
| **Electron** | `sandbox` + `contextIsolation` + `nodeIntegration:false` + `webSecurity:true`; không có `webPreferences` ở chỗ nào khác; chặn mở cửa sổ mới và chặn `will-navigate`; IPC đăng ký một chỗ, kiểm `sender === mainWindow` |
| **MCP (47822)** | Token bearer **luôn** được tạo, so sánh constant-time; bind loopback; allowlist header `Host` (chống DNS rebinding); lọc capability theo kết nối; denylist method CDP + chặn scheme URL |
| **Chuỗi cung ứng** | Artifact kiểm SHA-256 theo manifest **đã ký** *trước khi* giải nén; kích hoạt engine nguyên tử, có rollback |
| **Phụ thuộc** | MKTTool `npm audit --omit=dev`: **0**. MKTBrowser `yarn npm audit --severity high`: **không có** |
| **Bí mật trong repo** | Secret scan **PASS** — 820 file |

## 4 điểm đáng ghi

### A. Kiểm proxy = máy dò cổng, cho người đã là ADMIN

`measureProxyLiveness()` mở TCP tới **bất kỳ** host:port mà admin nhập vào kho proxy. Không có
danh sách chặn RFC1918 hay `169.254.169.254`. Ai đã là ADMIN có thể dùng kho proxy để dò mạng quanh
máy chủ Railway.

Giảm nhẹ: chỉ ADMIN chạm được; nội dung phản hồi **không** bị phản chiếu ra (câu báo lỗi là chuỗi
soạn sẵn, không ghép `describe(error)` của socket vào chỗ có credential). Mức: **thấp**, và nó là
cái giá của chính tính năng "kết nối qua proxy tuỳ ý".

### B. Điều khiển CDP dùng denylist, không phải allowlist

`CDP_DENY_METHODS` + chặn tiền tố `Fetch.` + chặn scheme URL. Chính comment trong code thừa nhận
allowlist mới là hướng đúng. Bị chặn bởi token + loopback nên không phải lỗ hổng, nhưng một
denylist CDP luôn rò theo thời gian khi Chromium thêm method mới.

### C. Hai đường giải nén, hai mức phòng thủ khác nhau

| Đường | Bảo vệ |
|---|---|
| MKTBrowser | `SafeArchivePolicy` / `ENGINE_ZIP_POLICY` tường minh + test `safe-archive-extraction` |
| Relay | `tar.exe -xf` trần, không policy đường dẫn |

Không khai thác được: archive đã kiểm SHA-256 theo manifest ký trước khi tới đó, và libarchive mặc
định bỏ đường dẫn tuyệt đối/`..`. Nhưng hai đường cùng làm một việc mà một đường có lớp chặn tường
minh, một đường dựa vào mặc định của công cụ ngoài.

### D. Một mặc định fail-open trong lớp kiểm token

`HttpTransport`: `if (!token) return true; // auth disabled`. Trong sản phẩm không với tới được —
app luôn tạo token qua `loadOrCreateMcpToken()`. Nhưng mặc định của một hàm kiểm xác thực nên là
**từ chối**, không phải **cho qua**: chỗ này chỉ an toàn nhờ mọi chỗ gọi đều nhớ truyền token.

## Việc bảo mật thật sự đang mở (không phải code)

Một lệnh liệt kê biến môi trường Railway đã in bí mật production ra tool output (13/09). Token tải
bản phát hành đã xoay; **các credential còn lại chưa kiểm kê và chưa xoay hết**. Cần console nhà
cung cấp, không sửa bằng code được. Đây là rủi ro cao nhất hiện nay của dự án.

## Chưa kiểm (để báo cáo không nói quá)

Nội bộ Better Auth · mặt tấn công của Next.js · script NSIS/PowerShell của bộ cài · code React phía
renderer · phần crypto ký manifest tương thích (chỉ xem luồng, chưa soi thuật toán) · luồng thu hồi
thiết bị · license key pool. Không chạy pentest động, không quét bằng công cụ.

## Câu hỏi chưa có lời đáp

- Sửa D (2 dòng, fail-closed) và C (policy đường dẫn cho Relay) luôn không? Cả hai đều rẻ và không
  đổi hành vi hiện tại.
- A giữ nguyên, hay thêm chặn dải private/link-local cho host proxy?

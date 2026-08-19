# Runbook — phép chạm đầu tiên với TikTok

**Ngày:** 19/08/2026 · **Trạng thái:** chưa chạy · **Tiền đề:** key CloakBrowser đã đăng ký, có acc rác

Mục tiêu **không** phải "nuôi được nick". Mục tiêu là trả lời đúng một câu chưa ai trả lời:
**TikTok có nhận MKT Browser không?** Toàn bộ số đo hiện có là trên trang probe `127.0.0.1` +
browserscan/fingerprint-scan — đo "trông có giống người thật", không đo "TikTok có nhận".

Grep `MKTBrowser/apps/desktop/src` → **0 hit "tiktok"**. Đường này chưa từng chạy.

---

## Bước 0 — Đưa engine lên 151 (~30 phút, làm TRƯỚC khi tạo bất kỳ acc nào)

Trạng thái máy MSI lúc 15:44 19/08:

```
%LOCALAPPDATA%\MKTTool\MKTBrowser\           ← userData THẬT (productIdentity.ts:35)
  settings.json   → cloakBrowserLicenseKey đã nhập 19/08 16:10 ✅
  chromium\cloakbrowser\current.json → 146.0.7680.177.5, cài 10/08 — CHỜ RESTART
```

> ⚠️ `%APPDATA%\Roaming\MultiZen\` là của app MultiZen **cũ**. Đọc nhầm chỗ đó sẽ
> nghiệm thu sai — file ở đó đứng yên từ 07/08.

1. Mở MKT Browser → Settings → dán license key → **Save** (nhập nháp rồi lưu, không auto-save).
2. Khởi động lại. Engine tải ~537 MB từ kênh licensed.
3. **Nghiệm thu — không tin UI, đọc file:**
   `%LOCALAPPDATA%\MKTTool\MKTBrowser\chromium\cloakbrowser\current.json` phải ra `151.0.7922.108.2`.
   Còn thấy 146 = key chưa ăn, **dừng lại**, đừng chạy tiếp.

> **Vì sao phải làm trước:** nâng engine đổi danh tính phần cứng của mọi profile đang có
> (upstream cảnh báo: seed cố định resolve ra hardware identity khác trên 151). Chưa có acc thật
> ⇒ đổi bây giờ **miễn phí**. Nâng sau khi đã nuôi nick = mọi nick đột ngột "đổi máy".

## Chọn acc test — và persona phải khớp IP

**Thứ tự:** ① acc **tạo mới ngay trong browser** (bài khó nhất, tín hiệu mạnh nhất) → ② acc cũ
chưa từng dùng trên máy này → ③ acc cá nhân, chỉ khi chấp nhận mất **và** sau khi ①② xong.

> ⚠️ **Không dùng acc cá nhân cho lần chạm đầu.** Không chỉ vì rủi ro mất acc. Acc cá nhân xưa nay
> vào từ điện thoại thật + IP nhà; xuất hiện trên persona lạ qua hotspot là đúng tín hiệu "đổi
> thiết bị + đổi vùng" mà tầng 4 bắt. Dính verify thì **không phân biệt được** là do trình duyệt bị
> nhận diện hay do tài khoản vừa nhảy thiết bị — mà đó là câu duy nhất phép đo này cần trả lời.

**Persona bắt buộc khớp IP.** Mọi số đo kỹ thuật trong phiên 19/08 chạy trên persona
`Windows 11 / America/New_York` — cố ý, để chứng minh switch timezone thắng host `Asia/Saigon`.
Profile thật **không được** dùng persona đó:

| Trường | Giá trị cho GĐ 0 |
|---|---|
| timezone | `Asia/Ho_Chi_Minh` |
| locale | `vi-VN` |
| IP | Viettel / Vina / Mobi (hotspot) |

Persona Mỹ + IP Việt Nam là mâu thuẫn tự tạo ngay tầng 4, và theo plan `260819-0952` còn kéo sai
cả phân phối vì IP quyết định **khán giả**. Máy này không có font tiếng Việt nào — bình thường với
một máy Windows chạy vi-VN, không mâu thuẫn.

## Bước 1 — Đốt một acc rác

**Chuẩn bị:** iPhone phát hotspot, MSI tắt WiFi nhà, kiểm `whatismyipaddress.com` phải ra
Viettel/Vina/Mobi + Vietnam. Còn thấy IP nhà ⇒ chưa vào hotspot.

**Chạy:** tạo profile TikTok trong MKTTool → mở qua relay → `tiktok.com` → đăng nhập acc rác →
lướt feed **20 phút như người thật** (dừng xem, cuộn lại, bấm vào 1-2 video). Không like, không
follow, không đăng.

**Ghi lại ngay (mốc 0h):**

| Mục | Ghi gì |
|---|---|
| Login | qua thẳng / captcha / bắt verify SMS-email / chặn |
| Loại captcha | slider, xoay ảnh, chọn vật thể — hay không có |
| Feed | video chạy bình thường / trắng / xoay vòng loading |
| Console | có lỗi mạng, 0-byte response không |
| IP thấy trong trang | khớp hotspot chứ không phải IP nhà |
| `current.json` | dán version vào đây |

## Bước 2 — Mốc 24h và 72h

Vào lại **bằng đúng profile đó, đúng IP đó**. Ghi:

- Acc còn đăng nhập được không (bị đá ra = tín hiệu xấu)
- Có yêu cầu verify mới không
- Feed có "For You" thật hay chỉ video chung chung
- Nếu đã đăng 1 video test: view sau 24h **> 0** hay đứng im ở 0 ⇒ 0 view kéo dài = shadowban

**Tiêu chí đi tiếp:** acc sống qua **72h**, không verify lặp lại, feed bình thường.

## KHÔNG làm trong lúc test

Làm mấy thứ này thì kết quả test vô nghĩa vì không biết acc chết do tool hay do hành vi:

- Không mở acc thứ hai trên cùng IP trong 72h
- Không like/follow hàng loạt
- Không đổi IP giữa phiên (đổi quốc gia giữa phiên là tín hiệu TikTok nêu đích danh)
- Không tự giải captcha để chui tiếp — gặp captcha là **kết quả đo**, ghi lại rồi dừng

## Kết quả dẫn tới quyết định gì

| Kết quả | Làm gì tiếp |
|---|---|
| Sống 72h, không captcha | Fix font + storage-quota → rồi mới tạo 3 kênh thật |
| Sống nhưng captcha lúc login | Chấp nhận được. Ghi lại loại captcha. Vẫn fix font trước khi lên kênh thật |
| Bị đá / 0 view kéo dài | **Dừng.** Đốt acc rác thứ hai với engine 146 để tách biến: lỗi do 151 hay do tầng 4 |
| Không đăng nhập nổi | Vấn đề ở tool, không phải ở acc. Debug trước, đừng đốt thêm acc |

## Còn nợ sau runbook này (chưa làm, không chặn bước 1)

- `--fingerprint-fonts-dir` — 16 font host giống hệt nhau trên mọi profile ⇒ trường liên kết.
  Với 3 acc/1 IP thì chưa phải thứ giết mình; với 10 acc/3 dongle thì là quả bom.
  **Chưa biết switch nhận thư mục font hay file danh sách** → phải test trước khi ước lượng công.
- `--fingerprint-storage-quota` — 594.197.555 byte, giống nhau mọi profile. ~2 dòng.
- `--fingerprint-taskbar-height` — **đã xong** (ChromiumBrowserDriver.ts:1232, đo 22 → availHeight 1058).

## Câu hỏi chưa giải quyết

1. Bộ switch `--fingerprint-*` trên binary 151 có giữ nguyên tên như 146 không? Phải grep lại
   bảng switch trong `chrome.dll` 151 sau khi tải xong.
2. Sau khi lên 151, `--fingerprint-locale` có thật không? Nếu có thì bỏ được lớp CDP cuối cùng.
3. Acc rác đăng ký từ trước hay tạo mới? Tạo mới là bài test khó nhất (TikTok gắt nhất lúc tạo acc)
   nhưng cũng là phép đo giá trị nhất — nên chạy cả hai nếu có đủ acc.

# Phase 01 — báo cáo: đặc tả gate nghiệm thu

**Ngày:** 02/09/2026 · **Trạng thái:** XONG · **Đầu ra:** `MKTBrowser/docs/fingerprint-acceptance-gate.md` (195 dòng)

Không chạy engine, không đo, không chạm seat Cloak, không sửa source. Đúng phạm vi phase.

## Ba tiêu chí đã định nghĩa

| | Tiêu chí | Nội dung |
|---|---|---|
| **A** | Nhất quán | Cùng profile + site + engine revision → giống hệt qua khởi động lại và qua 4 context (document, iframe, worker, offscreen canvas) |
| **B** | Không đụng độ joint tuple | Trong pool 3-5, không hai profile trùng **toàn bộ** bộ định danh ổn định. Trùng thành phần lẻ được phép |
| **C** | Cohort hợp lý | Mỗi thành phần phải thuộc cohort Windows/Chromium phổ biến, đối chứng bằng stock Chrome/CFT **cùng máy** |

Báo cáo tách rời, không gộp điểm. Đạt hai trượt một vẫn là trượt.

## Hai điều rút ra khi viết, không có sẵn trong plan

### 1. Tiêu chí B phải tính trên bề mặt ỔN ĐỊNH, không phải mọi bề mặt

Đây là điều chỉnh thật so với plan, và nó đến từ chính số đo 27/08
(`P0-G2-IDENTITY-20260827131800`):

| Bề mặt | Hành vi |
|---|---|
| Fonts `08050B16`, Audio `0B09CAEB`, WebGL image `BF16CA5C` | **giống hệt giữa hai profile** |
| Canvas, WebGL Report, Client Rects, WebGPU, visitor ID, hardware concurrency, screen, GPU renderer, timezone, ngôn ngữ | xoay theo profile |

Acceptance matrix kết luận đúng: ba trường giống nhau đó là *"a three-field join that survives
separate proxies, separate cookies and separate canvas noise. One flagged account can point at every
sibling on the host."*

Nghĩa là nếu joint tuple gộp cả phần xoay, phép đo sẽ báo **"không đụng độ"** trong khi hai profile
vẫn liên kết được với nhau dễ dàng. **Xoay một giá trị không giấu được bạn khi một tập ổn định vẫn
nối bạn lại.** Nên tiêu chí B chỉ tính trên tập ổn định.

Không ghi rõ điều này thì phase 02 rất dễ cho ra một kết quả xanh sai.

### 2. Harness hiện tại mù đúng chỗ khuyết tật

`scripts/measure-mkb01e-packaged-fingerprint.cjs` (253 dòng) đọc: canvas, deviceMemory,
hardwareConcurrency, language, platform, screen, timezone, userAgent, WebGL.

**Không đọc `fonts`. Không đọc `audio`.** Tức mù hai trong ba bề mặt tạo nên chính khuyết tật đã ghi.
Cũng chưa đọc WebGPU, client rects, plugins, và chưa chạy trong context iframe/worker/offscreen mà
tiêu chí A đòi.

Hệ quả cho phase 02: **không được ra phán quyết nào từ harness chưa mở rộng.** Đã ghi thẳng câu đó
vào đặc tả.

## Quyết định đã chốt trong đặc tả

- **Pool 3-5** là *một phần định nghĩa gate*, không phải tham số. Đổi nó là mọi số đo cũ mất hiệu lực.
- Gate cũ `G2-IDENTITY` **giữ nguyên FAIL và giữ nguyên là gate phát hành**. Gate mới chạy song song,
  chỉ để đo và quyết định.
- Rút gate cũ cần đủ **ba** điều: số đo theo A/B/C ở pool 3-5 có số thô, đối chứng stock cùng máy, và
  một quyết định viết ra của chủ dự án viện dẫn số đo đó.
- Dùng lại từ vựng trạng thái của P0 acceptance matrix (`PASS`/`FAIL`/`NOT-RUN`/`DEFERRED`…) thay vì
  bịa bộ mới. `NOT-RUN` không bao giờ được ngầm hiểu là pass.
- Kế thừa evidence contract: không lưu licence key, proxy URL/host/credential, IP quan sát được, MCP
  token, Relay ticket, cookie, OTP, nội dung trang.
- BrowserScan/CreepJS là **công cụ chẩn đoán, không phải mục tiêu**. Điểm số có thể đẹp lên trong khi
  joint identity tệ đi.

## Sửa một lỗi trong plan

`phase-01-acceptance-gate-specification.md` mục Key Insights viết "gate mới có **hai** tiêu chí độc
lập" — sai, phải là **ba**. Đã sửa. Lỗi của tôi lúc lập plan.

## Việc cho phase 02

1. Mở rộng harness: thêm fonts, audio, WebGPU, client rects; thêm 4 context của tiêu chí A.
2. Xác định tập bề mặt **ổn định** trong lượt đo, dựng joint tuple từ đó cho tiêu chí B.
3. Đối chứng stock Chrome/CFT **cùng máy, cùng phiên** cho tiêu chí C.
4. Giả thuyết cần bác bỏ trước tiên: audio bất biến của Cloak là **dấu vendor**, không phải cohort —
   research 0153 đã đo đối chứng stock CFT cho hash khác. Nếu đúng thì Cloak trượt C dù có thể qua B.

## Câu hỏi chưa trả lời

1. Tập "bề mặt ổn định" của tiêu chí B nên **chốt cứng trong đặc tả**, hay xác định lại mỗi lượt đo?
   Hiện đặc tả để "xác định trong lượt đo" — linh hoạt hơn, nhưng mở đường cho việc chọn tập có lợi
   sau khi đã thấy số. Nếu phase 02 thấy rủi ro đó thật thì chốt cứng danh sách.
2. Pool 3-5: đo ở 3 hay ở 5? Đo ở 5 chặt hơn và bao luôn trường hợp 3. Đề xuất đo ở **5**.

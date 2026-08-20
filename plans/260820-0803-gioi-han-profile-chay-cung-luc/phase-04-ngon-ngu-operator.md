# Phase 04 — Ngôn ngữ operator: tiếng Việt, không lộ tên engine

**Ưu tiên:** trung bình · **Trạng thái:** chưa bắt đầu · **Cần [phase-03](phase-03-ui-chan-truoc-khi-bam.md)**

## Bối cảnh

- [plan.md](plan.md)

## Vấn đề

Chuỗi operator đang nhận hôm nay:

> "CloakBrowser: your plan's session limit is reached. Close another running profile, or raise the
> limit at https://cloakbrowser.dev (the free key allows one at a time)."

Ba lỗi, xếp theo mức nghiêm trọng:

1. **Lộ nhà cung cấp engine.** Sản phẩm bán ra là *MKT Browser*. `CloakBrowser` và link
   `cloakbrowser.dev` là chi tiết nội bộ — đưa ra cho khách là dạy khách đi mua thẳng của nhà cung cấp.
2. **Tiếng Anh** cho người dùng Việt.
3. **"session limit"** — thuật ngữ license, không phải thứ marketer nghĩ tới.

## Điểm mấu chốt

**App chưa có i18n.** Toàn bộ chuỗi renderer là tiếng Anh cứng, không có framework nào. Đây là ngã ba:

| Hướng | Được | Mất |
|---|---|---|
| **A. Chỉ dịch phần sức chứa** | nhỏ, làm xong trong ngày | app nửa Anh nửa Việt, trông chắp vá |
| **B. Thêm i18n rồi dịch dần** | đường đi đúng về lâu dài | phạm vi lớn hơn nhiều, chạm hầu hết component |

**Đây là câu cần chủ dự án quyết**, không phải câu kỹ thuật. Ghi ở đây làm câu hỏi mở, chưa chọn.

Tách bạch phải giữ bằng được, dù chọn hướng nào:

```
LICENSE_EXIT_MESSAGES   -> chan doan, ky thuat, giu nguyen tieng Anh + ma so
                           (di vao profile-shutdown.log va bao cao loi noi bo)
OPERATOR_MESSAGES       -> tieng Viet, khong ten nha cung cap, khong link ngoai
                           (di ra man hinh)
```

Đừng dịch tại chỗ trong `cloakbrowser-pro-channel.ts` — đó là chuỗi chẩn đoán, và nó đang đúng
việc của nó.

## Yêu cầu

**Chức năng**
- Bảng chuỗi operator riêng, tiếng Việt, cho: hết chỗ · đang chờ giải phóng · key sai · không tới được máy chủ license · state cục bộ không ghi được
- Không chuỗi operator nào chứa `CloakBrowser`, `cloakbrowser.dev`, hay chữ "seat"/"session limit"
- Chuỗi chẩn đoán trong log **giữ nguyên**, gồm cả mã số

**Phi chức năng**
- Có test chặn: quét bảng chuỗi operator, fail nếu xuất hiện tên nhà cung cấp

## Kiến trúc

```
apps/desktop/src/main/operator-messages.ts

  operatorMessageForLicenseExit(code): string   // tieng Viet, trung tinh
```

Bản nháp chữ nghĩa (chờ duyệt):

| Mã | Chuỗi operator |
|---|---|
| 76 | "Đã đạt giới hạn số profile chạy cùng lúc. Đóng bớt một profile đang mở rồi thử lại." |
| 76 + cooldown | "Phiên trước chưa được đóng đúng cách nên chỗ chưa được trả lại. Chờ khoảng {N} phút rồi thử lại." |
| 77 | "Giấy phép không hợp lệ hoặc đã hết hạn. Liên hệ người cấp phần mềm." |
| 78 | "Không kết nối được máy chủ cấp phép. Kiểm tra mạng rồi thử lại." |
| 79 | "Không ghi được dữ liệu cấp phép trên máy. Kiểm tra quyền thư mục người dùng." |

Lưu ý 78: **không** nhắc proxy. Bản tiếng Anh có nhắc, vì kỹ sư cần biết; operator không cần và sẽ hiểu nhầm.

## File liên quan

**Tạo**
- `apps/desktop/src/main/operator-messages.ts`
- `apps/desktop/src/main/operator-messages.test.ts`

**Sửa**
- `apps/desktop/src/main/ChromiumBrowserDriver.ts` — `engineUnavailable()` nhận chuỗi operator; chuỗi chẩn đoán đi vào log
- `components/capacity/CapacityMeter.tsx` + `use-launch-blocked.ts` — dùng chuỗi từ bảng

## Các bước

1. **Chốt hướng A hay B với chủ dự án** — chặn phần còn lại
2. `operator-messages.ts` + test cấm tên nhà cung cấp
3. Đổi `engineUnavailable()` sang chuỗi operator, giữ chuỗi kỹ thuật trong log
4. Nối vào UI phase-03
5. lint + test + nhìn bằng mắt

## Todo

- [ ] **chốt hướng A/B** (chặn)
- [ ] `operator-messages.ts` + test cấm tên nhà cung cấp
- [ ] đổi call site `engineUnavailable`
- [ ] nối UI
- [ ] lint + test

## Tiêu chí đạt

- Giữ chỗ bằng engine trần rồi bấm Open ⇒ màn hình hiện đúng câu tiếng Việt, **không** có chữ `CloakBrowser`
- `profile-shutdown.log` **vẫn** ghi `exit=76` và chuỗi chẩn đoán tiếng Anh
- Test fail nếu ai đó nhét tên nhà cung cấp vào bảng chuỗi operator

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Dịch xong mất thông tin chẩn đoán | Hai bảng tách hẳn; log không đổi |
| App nửa Anh nửa Việt (hướng A) | Là đánh đổi có ý thức, ghi vào plan, không giấu |
| Chuỗi mới lại lộ tên nhà cung cấp về sau | Test quét chuỗi, chạy trong `test:installer` |

## Bảo mật

Chuỗi operator không được chứa đường dẫn, key, hay endpoint. Test nên chặn luôn cả `http` trong
bảng chuỗi operator.

## Bước tiếp

Xong 4 phase thì cập nhật `docs/codebase-summary.md` và `docs/system-architecture.md` phần mô hình
sức chứa.

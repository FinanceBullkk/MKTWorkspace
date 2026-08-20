# Phase 04 — Ngôn ngữ operator: bỏ thuật ngữ license, không lộ tên engine

**Ưu tiên:** trung bình · **Trạng thái:** chưa bắt đầu · **Cần [phase-03](phase-03-ui-chan-truoc-khi-bam.md)**

## Bối cảnh

- [plan.md](plan.md)

## Vấn đề

Chuỗi operator đang nhận hôm nay:

> "CloakBrowser: your plan's session limit is reached. Close another running profile, or raise the
> limit at https://cloakbrowser.dev (the free key allows one at a time)."

Hai lỗi:

1. **Lộ nhà cung cấp engine.** Sản phẩm bán ra là *MKT Browser*. `CloakBrowser` và link
   `cloakbrowser.dev` là chi tiết nội bộ — đưa ra cho khách là dạy khách đi mua thẳng của nhà cung cấp.
2. **"session limit" / "seat"** — thuật ngữ license, không phải thứ marketer nghĩ tới.

**Ngôn ngữ: giữ tiếng Anh** (chốt 20/08). Không thêm i18n, không dịch. Vấn đề nằm ở *thuật ngữ*,
không ở ngôn ngữ — nói "profiles running at once" thay vì "session limit" thì tiếng Anh đó ai cũng
hiểu.

## Điểm mấu chốt

Không đụng i18n. Phạm vi thu về đúng một việc: **đổi chữ**.

Tách bạch phải giữ bằng được:

```
LICENSE_EXIT_MESSAGES   -> chan doan: giu nguyen, gom ca ma so va ten engine
                           (di vao profile-shutdown.log)
OPERATOR_MESSAGES       -> man hinh: khong ten nha cung cap, khong link ngoai,
                           khong chu "seat" hay "session limit"
```

Đừng dịch tại chỗ trong `cloakbrowser-pro-channel.ts` — đó là chuỗi chẩn đoán, và nó đang đúng
việc của nó.

## Yêu cầu

**Chức năng**
- Bảng chuỗi operator riêng cho: hết chỗ · đang chờ giải phóng · key sai · không tới được máy chủ license · state cục bộ không ghi được
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
| 76 | "You can run 1 profile at a time. Close the one that is open, then try again." |
| 76 + cooldown | "The last profile did not close properly, so its slot has not been returned yet. Try again in a few minutes." |
| 77 | "This copy is not licensed. Contact whoever supplied MKT Browser." |
| 78 | "Could not reach the licensing server. Check the connection and try again." |
| 79 | "Could not save licensing data on this machine. Check the permissions on your user folder." |

Lưu ý 78: **không** nhắc proxy. Bản tiếng Anh có nhắc, vì kỹ sư cần biết; operator không cần và sẽ hiểu nhầm.

## File liên quan

**Tạo**
- `apps/desktop/src/main/operator-messages.ts`
- `apps/desktop/src/main/operator-messages.test.ts`

**Sửa**
- `apps/desktop/src/main/ChromiumBrowserDriver.ts` — `engineUnavailable()` nhận chuỗi operator; chuỗi chẩn đoán đi vào log
- `components/capacity/CapacityMeter.tsx` + `use-launch-blocked.ts` — dùng chuỗi từ bảng

## Các bước

1. `operator-messages.ts` + test cấm tên nhà cung cấp
2. Đổi `engineUnavailable()` sang chuỗi operator, giữ chuỗi kỹ thuật trong log
3. Nối vào UI phase-03
4. lint + test + nhìn bằng mắt

## Todo

- [ ] `operator-messages.ts` + test cấm tên nhà cung cấp
- [ ] đổi call site `engineUnavailable`
- [ ] nối UI
- [ ] lint + test

## Tiêu chí đạt

- Giữ chỗ bằng engine trần rồi bấm Open ⇒ màn hình hiện câu nói rõ giới hạn profile, **không** có chữ `CloakBrowser`, **không** có chữ "seat"/"session limit"
- `profile-shutdown.log` **vẫn** ghi `exit=76` và chuỗi chẩn đoán tiếng Anh
- Test fail nếu ai đó nhét tên nhà cung cấp vào bảng chuỗi operator

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Dịch xong mất thông tin chẩn đoán | Hai bảng tách hẳn; log không đổi |
| Chữ nghĩa nghe kỹ thuật trở lại theo thời gian | Test cấm từ khoá, chạy trong `test:installer` |
| Chuỗi mới lại lộ tên nhà cung cấp về sau | Test quét chuỗi, chạy trong `test:installer` |

## Bảo mật

Chuỗi operator không được chứa đường dẫn, key, hay endpoint. Test nên chặn luôn cả `http` trong
bảng chuỗi operator.

## Bước tiếp

Xong 4 phase thì cập nhật `docs/codebase-summary.md` và `docs/system-architecture.md` phần mô hình
sức chứa.

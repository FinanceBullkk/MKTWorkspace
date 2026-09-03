# Prompt Codex: audit UX / userflow MKTTool Web

**Ngày tạo:** 03/09/2026
**Dùng cho:** một phiên Codex riêng, chạy trong `E:/MKTWorkspace`
**Phạm vi:** MKTTool Web (giao diện + luồng người dùng). Không đụng MKTBrowser, không đụng engine.
**Kiểu việc:** audit ra báo cáo. **Không sửa code trong phiên này.**

---

## Cách dùng

Mở phiên Codex mới, dán toàn bộ phần trong khung dưới. Phần trên khung là ghi chú cho người
điều phối, không cần dán.

Lý do tách audit khỏi sửa: đợt trước đã cho thấy sửa trước khi hiểu thì sinh ra thay đổi phải
gỡ lại. Đọc báo cáo, chọn cái nào đáng làm, rồi mới mở phiên implement riêng.

---

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước; Standing Authorization và kỷ luật
CI/CD trong đó là bắt buộc.

# Việc cần làm

Audit UX và luồng người dùng của MKTTool Web (thư mục MKTTool). Ra một báo cáo. KHÔNG sửa code,
KHÔNG mở PR, KHÔNG chạy migration trong phiên này.

Về design asset — màu, font, khoảng cách, icon — chủ dự án đã thấy tạm ổn. Đừng dành thời gian
cho chúng trừ khi một lựa chọn thị giác đang trực tiếp làm người dùng hiểu sai hoặc bấm nhầm.

# Bối cảnh quyết định sản phẩm — đọc kỹ, đây là chỗ dễ audit sai nhất

Ngày 02/09/2026 chủ dự án thu phạm vi bàn giao. Reddit và Facebook bị RÚT khỏi phạm vi. Code
không xóa, dịch vụ vẫn deploy, nhưng operator không được yêu cầu dùng chúng nữa.

Ngày 03/09/2026 ranh giới đó được ép bằng code (PR #51, commit 1dfb420):

- `src/lib/platforms/rollout-scope.ts` là nguồn sự thật duy nhất, mặc định KHÔNG nền tảng nào mở.
- `createPostJob` từ chối trước bộ luật; `publishJobToPage` từ chối trước Graph API.
- Production hiện KHÔNG đặt `ROLLOUT_PLATFORMS`, nghĩa là mọi đường đăng đang đóng.
- Trang chủ có `TeamScopeNotice` nói phạm vi, đọc từ cùng nguồn sự thật.

Hệ quả cho audit: **giao diện này được dựng cho một công cụ đăng bài, nhưng sản phẩm bàn giao
bây giờ là một kho danh tính dùng chung.** Đó là điểm căng thẳng trung tâm cần soi, không phải
một chi tiết bên lề.

Năm trang ngoài phạm vi vẫn còn và vẫn mở bằng URL: /content, /facebook, /health, /queue,
/targets. Chúng đã rút khỏi thanh điều hướng và mang `ParkedScopeBanner`. Giữ nguyên như vậy là
CÓ CHỦ ĐÍCH — xóa đi thì mất đường quay lại và mất lịch sử. Đừng đề xuất xóa; hãy đánh giá xem
người dùng lạc vào đó có hiểu chuyện gì đang xảy ra không.

Ngoài phạm vi audit, không được đề xuất: mở lại nền tảng nào, nới `G2-IDENTITY`, dùng nick thật,
phát MKT Browser, hay thêm nền tảng mới.

# Người dùng thật

- 5-6 người, không phải kỹ sư, ở 5-6 nơi khác nhau.
- Mỗi nick có đúng một người phụ trách và một PC.
- Mọi thao tác đăng nhập / OTP / CAPTCHA đều do người thật làm tay.
- Cổng G4 "second PC / operator" đang OPEN: **chưa từng có ai ngoài chủ dự án tự cài và tự
  onboard từ một máy sạch.** Chưa ai diễn tập. Đây là rủi ro thật, không phải thủ tục.

# Câu hỏi cần trả lời, xếp theo mức quan trọng

1. **Người mới hoàn toàn có tự đi hết được không?** Bám luồng /login -> /setup -> nhận nick ->
   nhận proxy -> đăng ký máy Relay. Chỉ ra chính xác chỗ một người không phải kỹ sư sẽ dừng lại
   và phải đi hỏi. `src/components/setup/onboarding-stepper.tsx` là đường găng.

2. **Người dùng có hiểu công cụ này DÙNG ĐỂ LÀM GÌ trong 10 giây đầu không?** Trang chủ giờ vừa
   là bảng nick vừa mang thông báo phạm vi. Đọc `src/app/page.tsx`,
   `src/components/layout/team-scope-notice.tsx`, `src/components/mktbrowser-ui/Constellation.tsx`.
   Nói thật nếu thông báo phạm vi bị chìm, bị bỏ qua, hay nghe như "app hỏng".

3. **Câu từ chối có dạy được người đọc không?** Khi bấm nút ở một trang đã đóng, họ nhận
   `parkedPlatformMessage()`. Chưa ai từng nhìn thấy câu đó trên màn hình thật. Đánh giá: nó nói
   được chuyện gì xảy ra, vì sao, và làm gì tiếp chưa? Có làm người ta tưởng mình làm sai
   không? Quy ước dự án ở `src/lib/actions/action-result.ts` — câu tiếng Việt, nói hành động kế
   tiếp, không phải mã lỗi.

4. **Trạng thái rỗng và trạng thái hỏng.** Team mới thì mọi bảng đều rỗng. Bảng rỗng nói gì?
   Proxy chưa xác minh, nick cold-start, máy Relay chưa nối — mỗi cái hiện ra sao, và người dùng
   biết phải làm gì tiếp không?

5. **Thao tác nguy hiểm và thao tác không gỡ lại được.** Đâu là chỗ một cú bấm nhầm gây hậu quả
   thật (thu hồi máy, đổi chủ sở hữu nick, gán lại proxy, xóa)? Chúng có xác nhận không, và xác
   nhận đó có nói rõ hậu quả không?

6. **Hai người cùng lúc.** Đây là công cụ dùng chung: ai cũng thấy dữ liệu của người khác. Chỗ
   nào giao diện làm người ta tưởng mình đang thao tác một mình? Có manh mối nào cho biết một
   bản ghi đang do người khác giữ không?

7. **Từ vựng.** Cùng một thứ có bị gọi bằng nhiều tên giữa các màn hình không (nick / account /
   profile; đích / target; máy / device / Relay)? Liệt kê chỗ lệch — người không phải kỹ sư trả
   giá cho việc này nhiều nhất.

# Cách làm

- Chạy app tại máy nếu chạy được, và đi thật các luồng trên. Ưu tiên cách này hơn đọc code chay:
  nhiều lỗi UX chỉ lộ khi bấm. Có Postgres tại máy (bộ test `.database.test.ts` đang dùng).
- Không có credential production và ĐỪNG xin. Đừng probe production ngoài `/api/healthz`.
- Không dùng nick thật ở bất kỳ bước nào.
- Nếu không chạy được app, nói rõ trong báo cáo là audit này đọc-code-chay, và đừng viết như thể
  đã bấm thật.
- Đọc `MKTTool/docs/internal-beta-release.md` để biết ranh giới hiện hành trước khi kết luận cái
  gì là "thiếu".

# Đầu ra

Một file: `plans/reports/audit-{ngày giờ}-mkttool-ux-userflow.md`

Cấu trúc:

- **Kết luận** — người mới tự đi được hay không, một đoạn, nói thẳng.
- **Phát hiện xếp theo mức nghiêm trọng.** Mỗi phát hiện gồm: chuyện gì xảy ra với người dùng,
  `file:dòng`, vì sao nó quan trọng, và mức công sức ước lượng để sửa. Đừng trộn "chặn người
  mới" với "giá mà đẹp hơn" trong cùng một danh sách.
- **Cái đang tốt** — ngắn thôi, nhưng có thật. Chỗ nào đang làm đúng thì đừng để phiên sau vô
  tình phá.
- **Cái cố ý không sửa** — kèm lý do. Ví dụ: trang đã gác vẫn mở bằng URL.
- **Câu hỏi chưa trả lời** ở cuối.

Quy ước viết: hy sinh ngữ pháp để ngắn gọn. Không tô hồng. Nếu luồng onboarding sẽ làm người mới
kẹt thì viết đúng như vậy, đừng viết thành "có thể cải thiện trải nghiệm".

Đừng đề xuất viết lại toàn bộ. Sản phẩm này đang được bàn giao trong tuần này, không phải đang
thiết kế lại.
```

---

## Ghi chú cho người điều phối

**Vì sao prompt nhấn mạnh bối cảnh thu phạm vi:** một agent không biết chuyện này sẽ audit ra
kết luận kiểu "thiếu luồng đăng bài, thiếu lịch, nav mất nhiều mục" — đúng về mặt quan sát,
vô dụng về mặt quyết định, và tệ hơn là đẩy người đọc đi mở lại thứ vừa cố tình đóng.

**Vì sao cấm sửa code:** phiên audit mà được sửa thì sẽ sửa, và báo cáo biến thành bản tự khai
những gì nó vừa làm. Tách ra thì bạn còn quyền chọn.

**Vì sao ưu tiên chạy thật:** ba trong bảy câu hỏi (từ chối, trạng thái rỗng, thao tác nguy
hiểm) gần như không thấy được bằng đọc code.

**Câu hỏi chưa trả lời**

- Codex có chạy được `npm run dev` với Postgres tại máy không? Nếu không thì audit tụt xuống
  đọc-code-chay và giá trị giảm đáng kể — nên kiểm điều này trước khi mở phiên.

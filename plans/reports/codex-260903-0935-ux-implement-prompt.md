# Prompt Codex: sửa UX / UI / userflow MKTTool Web (F1-F12)

**Ngày tạo:** 03/09/2026
**Nguồn:** [audit-260903-0854-mkttool-ux-userflow.md](audit-260903-0854-mkttool-ux-userflow.md)
**Phạm vi đã duyệt:** toàn bộ F1-F12
**Cách chạy:** **một phiên Codex cho mỗi phase**, không dồn tất cả vào một phiên

---

## Quyết định đã chốt trước khi bắt đầu

Năm câu hỏi để ngỏ của audit đã có trả lời. Chúng là tiền đề, không phải chuyện để phiên
implement bàn lại:

1. **Kênh phát Relay đã có sẵn.** `/api/relay/download` chuyển tiếp sang
   `/api/relay/download/v{version}`, đọc `readRelayRelease(RELAY_VERSION)`, **không phụ thuộc
   Browser installer**, đã sống trên production (trả `401` khi chưa đăng nhập — đúng thiết kế).
   `RelayEnrollCard` cũng không phụ thuộc installer. F1 vì thế là việc sửa giao diện, **không**
   phải việc chờ quyết định sản phẩm.
2. **"Tự đi hết" có bao gồm chờ ADMIN.** Allowlist đăng nhập, kho proxy và việc gán nick đều do
   admin mở đường. Yêu cầu đúng là: màn hình phải gọi trạng thái chờ **là trạng thái chờ**, kèm
   đầu mối, chứ không hiện như lỗi của người dùng. Đầu mối suy từ `ADMIN_EMAILS`, không hardcode.
3. **Tạo nick TikTok còn trong phạm vi.** `Account.platform` có `TIKTOK`; `TARGET_PLATFORMS` cố
   tình không có `TIKTOK` vì đó là nơi nick sống, không phải đích đăng. Giữ nguyên chức năng,
   chỉ sửa cách gọi tên.
4. **Buổi G4 chưa chốt.** Không đụng tới. `G4 second PC/operator` vẫn `OPEN`.
5. **Áp migration trên DB dev local.** `20260830030000_add_better_auth_rate_limit` chưa áp trên
   `localhost:5432/mkttool_dev`. Áp nó ở phiên implement để walkthrough có đăng nhập chạy được.
   Đây là DB dev tại máy. **Không** chạm migration production.

---

## Chia phase

Bốn phase, xếp theo phụ thuộc chứ không theo mức nghiêm trọng. Mỗi phase một phiên, một PR.

| Phase | Gồm | Vì sao nhóm với nhau | Công sức |
|---|---|---|---|
| 1 | F2, F4, F9, F10 | Chỉ đụng chữ và nhánh theo role. Không đổi điều hướng, không đổi contract. Gỡ được ngõ cụt cứng ngay. | ~1 ngày |
| 2 | F3, F5, F12, F11 | Điều hướng, CTA trang chủ, từ vựng và tín hiệu header. Đổi tên mà không đổi nav thì nửa vời, nên đi cùng nhau. | 2-3 ngày |
| 3 | F1 | `/setup` chuyển sang luồng Relay. Dùng từ vựng đã chốt ở phase 2. | 1-2 ngày |
| 4 | F6, F7, F8 | An toàn khi nhiều người dùng chung. F8 đụng contract ghi dữ liệu nên tách hẳn ra cuối. | 3-5 ngày |

**Thứ tự bắt buộc:** 1 → 2 → 3. Phase 4 chạy được song song với 2-3 nếu muốn, vì nó đụng file
khác — nhưng đừng chạy 4 cùng 2 nếu cùng một người, vì cả hai đều sửa `accounts/[id]/page.tsx`.

---

## Prompt phase 1 — chữ, role và ngõ cụt checklist

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước.

# Việc

Sửa F2, F4, F9, F10 trong plans/reports/audit-260903-0854-mkttool-ux-userflow.md. Chỉ bốn cái
này. Đọc mục tương ứng trong báo cáo để lấy file:dòng chính xác.

Mở một PR duy nhất trên MKTTool, base master, nhánh feat/ux-phase1-copy-and-roles.

# Tiền đề — đừng bàn lại

- Kênh phát Relay đã có: /api/relay/download, không phụ thuộc Browser installer. Phase 3 mới đụng.
- Chờ ADMIN là trạng thái hợp lệ, không phải lỗi. Đầu mối suy từ ADMIN_EMAILS.
- Reddit/Facebook đã rút khỏi phạm vi từ 02/09; đường đăng đóng bằng code (rollout-scope.ts).
  KHÔNG mở lại, KHÔNG đổi ROLLOUT_PLATFORMS, KHÔNG xóa route đã gác.

# F2 — checklist bàn giao không được là ngõ cụt

Đây là việc quan trọng nhất phase này. Hiện tại onboarding KHÔNG THỂ hoàn thành:

    workspaceReady = checklist.nextStepId === null && downloadable

Vế `downloadable` cần Browser installer — sản phẩm đang NO-GO, production không đặt biến
installer. Vế `nextStepId === null` cần xong bước "Schedule the first post" — mà createPostJob
giờ TỪ CHỐI vì quyết định phạm vi 02/09. Hai vế đều không đạt được.

Sửa: tách checklist bàn giao (proxy, observer proxy, nick, owner/máy, Relay) khỏi checklist
posting (targets, content, queue). Readiness của workspace chỉ tính phần bàn giao. Đừng xóa
phần posting — để nó ở nhánh riêng, hiện khi phạm vi mở lại.

`workspaceReady` không được phụ thuộc `downloadable` nữa. Nếu vẫn muốn hiện trạng thái installer
thì hiện như thông tin, không phải điều kiện.

# F4 — empty state proxy theo role

proxy-console.tsx:93 chỉ render CTA cho ADMIN, nhưng empty state ở dòng 187-189 bảo mọi người
bấm "Thêm Proxy". accounts/page.tsx:117-120 cũng đẩy operator sang đó.

Sửa: ADMIN thấy CTA như cũ. OPERATOR thấy câu nói rõ đây là việc của ADMIN, kèm đầu mối liên hệ
suy từ ADMIN_EMAILS. Không dựng danh sách admin thứ hai.

# F9 — màn login đừng nói ngôn ngữ quản trị server

login/page.tsx:35,52 và sign-in-error-messages.ts:27,96,121 đang hiện ALLOWED_EMAILS,
npm run auth:check, GOOGLE_CLIENT_SECRET cho mọi người.

Sửa: người dùng thấy email vừa dùng + "liên hệ quản trị viên" + đầu mối. Chi tiết env/CLI chuyển
vào log server hoặc khối chỉ ADMIN thấy. Giữ nguyên hành vi bảo mật: đừng tiết lộ email nào nằm
trong allowlist.

# F10 — câu từ chối và banner phải đúng ranh giới hiện tại

parked-scope-banner.tsx:18 vẫn nói "phạm vi TikTok hiện tại" — ranh giới từ 19/08, đã lỗi thời
hai đợt. Nó cũng nói "Trang vẫn dùng được", trong khi thật ra chỉ xem được, không đăng được.

rollout-scope.ts:88-92 (`parkedPlatformMessage`) in nguyên enum như FACEBOOK_PAGE và bảo người
đọc đặt ROLLOUT_PLATFORMS. Câu đó viết cho người đọc code, không phải cho operator bấm nút.

Sửa: nhãn nền tảng thân thiện (FACEBOOK_PAGE → "Facebook Fanpage"). Nói rõ "chỉ xem lịch sử,
không đăng được". Có đường quay lại kho nick. Bỏ tên biến môi trường khỏi câu hiện cho người
dùng — giữ nó trong chú thích code và tài liệu.

# Ràng buộc

- Không đổi điều hướng, không đổi CTA trang chủ, không đổi từ vựng toàn app — đó là phase 2.
- Không đụng /setup stepper — phase 3.
- Không đụng owner/device display, xác nhận thao tác, hay concurrency — phase 4.
- Giữ quy ước ActionResult: câu tiếng Việt, nói chuyện gì xảy ra và làm gì tiếp.
- Chạy npm run typecheck, npm run lint, npm test trước khi mở PR. Tất cả phải xanh.
- Test hiện có phải xanh mà không được nới lỏng để cho qua. Nếu một test cản, đọc xem nó đang
  bảo vệ điều gì trước khi sửa nó.

# Đầu ra

PR kèm mô tả nói rõ: F2 gỡ ngõ cụt gì, ba cái còn lại đổi chữ gì. Ghi số test.
```

---

## Prompt phase 2 — điều hướng, CTA và từ vựng

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 đã merge.

# Việc

Sửa F3, F5, F12, F11 trong plans/reports/audit-260903-0854-mkttool-ux-userflow.md.
PR duy nhất trên MKTTool, nhánh feat/ux-phase2-navigation-and-vocabulary.

# Chốt từ vựng TRƯỚC khi sửa

Viết glossary vào MKTTool/docs/ui-glossary.md rồi mới đổi chữ. Ba khái niệm hay bị lẫn:

- **nick** — bản ghi trong kho danh tính (model Account). Nơi nick sống là Reddit/Facebook/TikTok.
- **profile trình duyệt** — dữ liệu cục bộ trên một PC. KHÔNG phải bản ghi kho.
- **máy Relay** — chiếc PC nhận vé (model RelayDevice).

Hiện cùng một thứ đang được gọi là "Kênh / Profiles", "All profiles", "Tài khoản", "nick", "hồ sơ
TikTok", "profile cấu hình". Máy thì "Máy", "PC", "Device", "Relay", "cầu nối", "Local PC".

Sửa trước ở Home, /setup và trang chi tiết nick — ba chỗ người mới đi qua.

# F3 — điều hướng tới kho nick

LeftRail.tsx:14 có bốn mục và KHÔNG có /accounts. /accounts chỉ tìm được bằng URL hoặc link sâu,
dù nó là bề mặt cốt lõi của sản phẩm hiện tại. Dòng 42: link chỉ render icon, nhãn nằm trong
thuộc tính title, tức chỉ thấy khi rê chuột.

Sửa: thêm mục kho nick. Cân nhắc hiện nhãn thường trực thay vì chỉ icon — người không kỹ thuật
không rê chuột để dò từng icon.

# F5 — trang chủ phải đọc ra kho danh tính

TeamScopeNotice nói đúng nhưng bị lấn: ngay dưới là H1 "All profiles", CTA nổi "New profile",
tag TikTok, trạng thái browser local. Thông điệp thị giác mạnh hơn thông báo phạm vi, nên người
mới đọc notice như "tính năng đang hỏng" rồi bấm tiếp theo CTA cũ.

Sửa: đổi H1, CTA và empty state theo trục kho danh tính — "nick của tôi" / "toàn team". Giữ
NGUYÊN nội dung TeamScopeNotice và cách nó đọc từ rollout-scope.ts; đó là phần đang đúng.

KHÔNG đổi màu, font, spacing, icon toàn app. Chỉ đổi thứ bậc thông tin ở Home.

# F11 — bỏ tín hiệu giả

AppShell.tsx:26,39 giữ search state nhưng chỉ truyền cho TopBar; page.tsx:72 không truyền
searchQuery vào Constellation, nên gõ search không lọc gì. TopBar.tsx:57 hứa Ctrl K nhưng không
có handler. layout.tsx:63 không truyền runningProfiles nên header luôn hiện 0 running.

Sửa: nối search thật, hoặc bỏ ô search khỏi header và đặt trong Home. Bỏ badge Ctrl K tới khi
shortcut chạy thật. Đưa running state lên shell hoặc bỏ số đếm.

Nguyên tắc: một tín hiệu sai còn tệ hơn không có tín hiệu. Bỏ đi rẻ hơn và trung thực hơn giả vờ.

# Ràng buộc

- Không đụng /setup stepper (phase 3), không đụng owner/device/concurrency (phase 4).
- Không xóa route đã gác, không mở lại nền tảng nào.
- Đổi tên là đổi CHỮ HIỂN THỊ. Không đổi tên model, cột DB, hay route — không migration.
- typecheck + lint + test xanh trước khi mở PR.

# Đầu ra

PR kèm glossary mới và bảng "trước → sau" cho các nhãn đã đổi.
```

---

## Prompt phase 3 — `/setup` chuyển sang luồng Relay

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 và 2 đã merge.

# Việc

Sửa F1. PR trên MKTTool, nhánh feat/ux-phase3-setup-relay-first.

# Sự thật nền — kiểm rồi, đừng kiểm lại

Kênh phát Relay ĐÃ CÓ và không phụ thuộc Browser installer:

    /api/relay/download → redirect /api/relay/download/v{version}
    readRelayRelease(RELAY_VERSION)

Production trả 401 khi chưa đăng nhập (sống, sau lớp gác, đúng thiết kế). healthz báo
relayVersion 16, releaseSource r2. RelayEnrollCard cũng không phụ thuộc installer.

Nghĩa là đây KHÔNG phải việc dựng kênh phát mới. Đây là việc /setup đang không dẫn tới kênh đã có.

# Sửa gì

onboarding-stepper.tsx hiện dựng quy trình 3 bước bắt đầu bằng "Tải MKT Browser"
(dòng 42, 68, 118, 286), và dòng 142 chỉ link installerDownloadUrl. MKT Browser đang NO-GO,
không được phát cho ai.

Đổi thành luồng của kho danh tính: tải Relay → đăng ký máy → nhận nick và proxy. Bước Browser
chuyển thành thông tin phụ hoặc bỏ khỏi đường găng, tùy cái nào đọc ra tự nhiên hơn.

relay-download-section.tsx còn code nhưng KHÔNG được import ở đâu trong src — chỉ được nhắc
trong chú thích và trong một test khẳng định nội dung nó chứa id="download". Đó là test xanh
cho một component không ai thấy. Hoặc render lại nó, hoặc xóa cả component lẫn test; đừng để
nguyên trạng thái hiện tại.

relay-download/page.tsx:15 trỏ tới /setup#download — anchor phải tồn tại thật sau khi sửa.

# Ràng buộc

- Không phát MKT Browser, không đổi Browser boundary, không nới G2-IDENTITY.
- Không đụng /api/relay/download hay lớp xác thực của nó.
- typecheck + lint + test xanh.
- Sau khi sửa, tự đi lại luồng /setup có đăng nhập tại máy và mô tả trong PR mình thấy gì.
  Nếu chưa áp migration 20260830030000_add_better_auth_rate_limit trên DB dev local thì áp
  (chỉ DB dev, không đụng production).

# Đầu ra

PR mô tả luồng mới theo từng bước, và nói rõ bước Browser giờ nằm ở đâu.
```

---

## Prompt phase 4 — an toàn khi dùng chung

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước.

# Việc

Sửa F6, F7, F8. PR trên MKTTool, nhánh feat/ux-phase4-shared-use-safety.

Đây là phase rủi ro nhất: F8 đụng contract ghi dữ liệu. Làm F6 → F7 → F8 theo thứ tự đó, commit
riêng từng cái, để cái sau hỏng thì không phải gỡ cả ba.

# F6 — hiện owner và máy, bỏ "Local PC" giả

page.tsx:10 không include quan hệ owner; accounts/page.tsx:64 không có cột owner/máy. Người dùng
không trả lời được câu cơ bản nhất của một công cụ dùng chung: "nick nào là của tôi".

ProfileTile.tsx:227 và ProfileTable.tsx:193 hiện "Local PC" khi nick chưa ghim máy — biến dữ
liệu THIẾU thành một chiếc máy tưởng tượng. Sửa thành "Chưa ghim máy" hoặc tương đương.

ProfileTile.tsx:110,114 và ProfileTable.tsx:96 đọc response rồi VỨT body.message, gom mọi HTTP
409 thành câu chung — trong khi server đã có lý do chính xác owner/device ở
ticket-recipient-lookup.ts:164. Giữ nguyên message server đã làm sạch.

# F7 — xác nhận thao tác có hậu quả thật

Ba đường: đổi owner/máy (accounts/[id]/page.tsx:257,273), đổi proxy (vault-update-actions.ts:91,140),
compatibility update (relay-compatibility-update-button.tsx:85,88).

Sửa: xác nhận chỉ bật khi giá trị THẬT SỰ đổi — đừng bắt xác nhận cho mọi lần bấm Lưu, vì xác
nhận xuất hiện mọi lúc là xác nhận không ai đọc. Tóm tắt before → after và hậu quả. Compatibility
update phải nói trước là Relay và Browser sẽ restart.

Tham khảo mẫu ĐANG LÀM ĐÚNG trong repo, đừng phát minh lại: delete-entity-button.tsx:47 (xác
nhận hai bước), relay-device-retirement-button.tsx:149 (gõ đúng tên PC).

Lưu ý vault-update-actions.ts:91 dùng guardedAction chứ không phải adminAction, nghĩa là mọi user
đã đăng nhập đổi được proxy của bất kỳ nick nào. Nếu đó là chủ ý thì nói rõ trong PR; nếu không
thì đây là chuyện quyền hạn, không phải chuyện UX — báo lại chứ đừng tự đổi quyền trong phase này.

# F8 — chống ghi đè giữa hai tab

Account.updatedAt đã có (schema.prisma:371) nhưng không đi qua form và không nằm trong điều kiện
ghi. Hai người mở cùng một nick vài phút: người lưu sau ghi đè im lặng phần người trước vừa đổi.

Sửa: gửi updatedAt làm revision từ form; update có điều kiện; trả câu "bản ghi vừa được thay đổi,
tải lại trước khi lưu". Áp cho account và cluster assignment. KHÔNG dựng cơ chế khóa toàn app.

Bắt buộc có test cho đường thua: hai lượt ghi tuần tự trên cùng bản ghi thì lượt sau phải bị từ
chối và KHÔNG được ghi gì. Test chạy trên Postgres thật như các .database.test.ts hiện có.

# Ràng buộc

- Không đổi mô hình quyền trong phase này. Phát hiện được thì báo, đừng tự sửa.
- Không migration schema — updatedAt đã có sẵn.
- typecheck + lint + test xanh. Không nới test để cho qua.

# Đầu ra

PR mô tả từng cái, kèm test mới cho F8. Nếu phát hiện chuyện quyền hạn ở vault-update-actions,
ghi thành mục riêng để chủ dự án quyết.
```

---

## Ghi chú cho người điều phối

**Vì sao chia bốn phase thay vì một prompt:** toàn bộ F1-F12 là ~2 tuần. Một phiên Codex ôm cả
đống sẽ hoặc làm hời hợt, hoặc chạm vào cùng file ở nhiều mục đích khác nhau rồi tự vướng chân
nhau. Phase 2 và 4 đều sửa `accounts/[id]/page.tsx` — đó là lý do chúng phải tách.

**Vì sao phase 1 làm trước dù chỉ là "sửa chữ":** F2 không phải chuyện chữ. Onboarding hiện
không thể hoàn thành được, và một phần nguyên nhân là chốt chặn phạm vi hôm 03/09 — trước đó
checklist còn xong được trên lý thuyết, giờ thì không. Không gỡ cái này thì mọi thứ khác vô nghĩa.

**Vì sao F1 tụt hạng khó:** audit xếp nó "cần owner chốt kênh phát Relay". Kiểm rồi: kênh đã có,
đã chạy production, độc lập với Browser installer. Chỉ là `/setup` không trỏ tới. Prompt phase 3
nói thẳng điều đó để phiên sau không đi dựng lại thứ đã có.

**Chỗ cần bạn để mắt:** phase 4 có thể lộ ra một vấn đề quyền hạn thật —
`vault-update-actions.ts` dùng `guardedAction` chứ không phải `adminAction`, tức mọi người đã
đăng nhập đổi được proxy của bất kỳ nick nào. Prompt yêu cầu Codex báo cáo chứ không tự sửa, vì
đó là quyết định của bạn chứ không phải việc UX.

**Câu hỏi chưa trả lời**

- Buổi G4 vẫn chưa có người và ngày. Bốn phase này làm cho luồng onboarding đi được, nhưng
  không thay thế được bằng chứng "một người lạ đã tự đi hết trên máy sạch".
- `vault-update-actions.ts` dùng `guardedAction` là chủ ý hay sót? Phase 4 sẽ hỏi lại.

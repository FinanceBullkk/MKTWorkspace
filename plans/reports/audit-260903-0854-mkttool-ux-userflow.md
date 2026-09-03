# Audit UX và luồng người dùng MKTTool

**Ngày:** 03/09/2026 08:54 ICT

**Phạm vi:** `E:/MKTWorkspace/MKTTool`, MKTTool Web, luồng người mới và thao tác dùng chung

**Mã được audit:** HEAD `d258b59`; tree `f34089b` trùng merge PR #51 `1dfb420`

**Không làm:** sửa code, PR, migration, production, credential thật, nick thật

## Kết luận

**Không. Người mới chưa thể tự đi hết luồng.** `/login` có nút Google rõ, nhưng cú bấm local hiện
`FAIL` trước OAuth vì DB dev thiếu migration `RateLimit`; sang phần source của `/setup`, sản phẩm lại
yêu cầu tải MKT Browser chưa được phép phát, lấy installer làm điều kiện hoàn tất, rồi bắt làm
target/content/queue đã rút phạm vi. Nếu tự bỏ qua, người mới vẫn khó tìm kho nick thật ở `/accounts`;
CTA nổi nhất mở form tạo profile TikTok, còn operator thiếu proxy bị bảo bấm một nút chỉ ADMIN nhìn
thấy. Trong 10 giây đầu, giao diện được đọc như browser/profile manager đang dở hoặc bị khóa, không
phải kho danh tính dùng chung. Gate `G4 second PC/operator` vẫn **OPEN**, nên không có bằng chứng
người lạ đã tự cài và onboard trên máy sạch.

## Mức độ quan sát

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| App local và `/login` render | **PASS — đã quan sát thật** | `http://localhost:3000`; DB local `localhost:5432/mkttool_dev`; xem màn hình bình thường và lỗi synthetic `EMAIL_NOT_ALLOWED` bằng in-app Browser và Chrome |
| Cú bấm Google Sign-In local | **FAIL — môi trường local** | `POST /api/auth/sign-in/social` trả 500, Prisma `P2021`: thiếu bảng `public.RateLimit`. `npx prisma migrate status` xác nhận migration `20260830030000_add_better_auth_rate_limit` chưa áp dụng; schema ở `prisma/schema.prisma:651`, migration ở `prisma/migrations/20260830030000_add_better_auth_rate_limit/migration.sql:2` |
| Route sau đăng nhập | **OPEN — chưa walkthrough** | Không có local authenticated session; brief cấm xin credential. Findings dưới đây cho `/`, `/setup`, `/accounts`, `/proxies`, `/relay-devices` dựa trên source, không viết như đã bấm |
| Người lạ + máy sạch | **OPEN** | `docs/internal-beta-release.md:159` |
| Browser identity | **FAIL / NO-GO theo ranh giới hiện hành** | `docs/internal-beta-release.md:48-50`; không dùng để đề xuất nới gate hay phát Browser |

Ước lượng công sức: **S** = vài giờ; **M** = 1-2 ngày gồm test; **L** = 3-5 ngày hoặc cần đổi contract.

---

## Phát hiện — chặn người mới

### F1 — BLOCKER: `/setup` dẫn vào sản phẩm không được bàn giao, không có đường tải Relay độc lập

**Người dùng gặp:** màn hình tự giới thiệu là quy trình 3 bước để tải MKT Browser, nối Relay và chạy
pilot. Bước 1 là Browser installer; trạng thái hoàn tất còn phụ thuộc installer có thể tải. Đây là
đường găng sai với sản phẩm hiện tại là kho danh tính, và mâu thuẫn với Browser rollout NO-GO.

- `src/components/setup/onboarding-stepper.tsx:30` — `workspaceReady` phụ thuộc `downloadable`.
- `src/components/setup/onboarding-stepper.tsx:42` — mô tả 3 bước bắt đầu bằng MKT Browser.
- `src/components/setup/onboarding-stepper.tsx:68` — Bước 1: Tải MKT Browser.
- `src/components/setup/onboarding-stepper.tsx:118` — Bước 3 vẫn gọi là điều kiện pilot.
- `src/components/setup/onboarding-stepper.tsx:286` — tổng kết technical setup, không phải bàn giao kho danh tính.
- `src/app/relay-download/page.tsx:15` — link Relay cũ chuyển tới `/setup#download`.
- `src/components/setup/relay-download-section.tsx:46` — section tải Relay còn code nhưng không được import/render ở đâu trong `src`.

**Vì sao quan trọng:** operator mới không có đường được hỗ trợ để lấy riêng Relay rồi tự đăng ký máy.
Nếu làm theo màn hình, họ phải xin một Browser artifact không được phép phát. Nếu dùng link cũ, họ tới
anchor không tồn tại. Đây là chặn cứng, không phải copy chưa đẹp.

**Hướng sửa hẹp:** đổi `/setup` thành luồng Relay/device của kho danh tính; không lấy Browser tuple làm
điều kiện hoàn tất. Chỉ hiện artifact thực sự được hỗ trợ. **Công sức: M + cần owner chốt kênh phát Relay.**

### F2 — BLOCKER: checklist bắt hoàn thành 3 workflow đăng bài đã rút phạm vi

**Người dùng gặp:** sau khi đăng ký máy, checklist vẫn yêu cầu thêm publishing target, content và lịch
bài đầu tiên. `nextStepId` lấy bước chưa xong đầu tiên, nên workspace không bao giờ báo complete nếu
team không đi vào route parked.

- `src/lib/setup/setup-checklist.ts:140` — Add publishing targets.
- `src/lib/setup/setup-checklist.ts:149` — Add content.
- `src/lib/setup/setup-checklist.ts:158` — Schedule the first post.
- `src/lib/setup/setup-checklist.ts:168` — bước đầu chưa done quyết định `nextStepId`.
- `src/components/setup/onboarding-stepper.tsx:30` — `nextStepId` tiếp tục khóa `workspaceReady`.

**Vì sao quan trọng:** UI dạy người mới rằng muốn dùng kho danh tính thì phải dựng lại posting
workflow. Họ hoặc dừng và hỏi, hoặc đi vào màn hình cố ý gác rồi tưởng app hỏng.

**Hướng sửa hẹp:** checklist bàn giao chỉ gồm tài khoản, proxy, owner/device và Relay; tách checklist
posting khỏi readiness hiện hành. **Công sức: S.**

### F3 — BLOCKER: không có điều hướng tới kho nick; CTA chính tạo profile TikTok

**Người dùng gặp:** left rail chỉ có Home, Proxy, Relay và Setup; `/accounts` không có. Home gọi dữ
liệu là “All profiles”, nút chính là “New profile”, empty state bảo tạo profile đầu tiên, rồi mở sheet
“Tạo hồ sơ TikTok mới”. Người được giao một nick không có đường rõ để tìm nick đó; người mới dễ tạo
thêm object khác thay vì nhận việc đã phân công. Ngay các mục có trong rail cũng chỉ hiện icon; label
nằm trong tooltip khi hover, không phải nhãn nhìn thấy thường trực.

- `src/components/mktbrowser-ui/LeftRail.tsx:14` — toàn bộ danh sách điều hướng, thiếu `/accounts`.
- `src/components/mktbrowser-ui/LeftRail.tsx:42` — link chỉ render icon; label nằm trong `title`.
- `src/components/mktbrowser-ui/Constellation.tsx:127` — “All profiles”.
- `src/components/mktbrowser-ui/Constellation.tsx:160` — CTA “New profile”.
- `src/components/mktbrowser-ui/Constellation.tsx:239` — empty state tiếp tục dẫn vào tạo profile.
- `src/components/mktbrowser-ui/Constellation.tsx:281` — luôn gắn `NewTikTokProfileSheet`.
- `src/components/tiktok/new-tiktok-profile-sheet.tsx:65` — “Tạo hồ sơ TikTok mới”.
- `src/components/tiktok/new-tiktok-profile-sheet.tsx:81` — submit gọi `createAccount` nhưng được gắn nhãn tạo profile TikTok ngay từ Home.

**Vì sao quan trọng:** `/accounts` là bề mặt cốt lõi của sản phẩm mới nhưng chỉ tìm được bằng URL,
link sâu hoặc checklist. Navigation hiện vẫn tối ưu cho browser profile manager cũ.

**Hướng sửa hẹp:** thêm mục kho nick cố định; đổi CTA Home sang xem/nhận nick được giao. Không cần
thiết kế lại layout. **Công sức: M.**

### F4 — BLOCKER: operator rơi vào ngõ cụt khi kho proxy rỗng

**Người dùng gặp:** nút “Thêm Proxy” chỉ ADMIN thấy, nhưng empty state bảo mọi vai trò bấm đúng nút
đó. `/accounts` cũng dẫn operator sang “Thêm proxy” khi không có proxy rảnh. Tới nơi họ không thấy
nút, không biết đây là việc của ADMIN, cũng không biết hỏi ai.

- `src/components/proxies/proxy-console.tsx:93` — CTA chỉ render cho ADMIN.
- `src/components/proxies/proxy-console.tsx:187` — empty state chung cho mọi vai trò.
- `src/components/proxies/proxy-console.tsx:189` — bảo bấm nút operator không có.
- `src/app/accounts/page.tsx:117` — thẻ thêm nick không phân nhánh theo role khi thiếu proxy.
- `src/app/accounts/page.tsx:120` — gửi mọi người sang “Thêm proxy”.

**Vì sao quan trọng:** “nhận proxy” là chặng bắt buộc của brief. UI biến một dependency do admin sở
hữu thành lỗi tự xử của operator.

**Hướng sửa hẹp:** empty state theo role: ADMIN có CTA; OPERATOR thấy “ADMIN chưa nạp/gán proxy” +
đầu mối liên hệ hoặc trạng thái chờ. **Công sức: S.**

---

## Phát hiện — mức cao

### F5 — CAO: thông báo phạm vi đúng, nhưng toàn bộ hierarchy phía sau nói “browser/profile manager”

**Người dùng gặp:** `TeamScopeNotice` nói đúng kho nick/proxy/máy và mọi đường đăng đang đóng. Nhưng
nó là khối chữ nhỏ, màu slate trung tính. Ngay dưới là H1 “All profiles”, nút màu nổi “New profile”,
tag TikTok, trạng thái browser local và nút mở profile. Thông điệp thị giác mạnh hơn thông báo phạm vi.

- `src/components/layout/team-scope-notice.tsx:40` — notice nhỏ, tone trung tính.
- `src/components/layout/team-scope-notice.tsx:48` — câu “Dùng được” đúng và nên giữ.
- `src/components/mktbrowser-ui/Constellation.tsx:127` — tiêu đề chính lấn át notice.
- `src/components/mktbrowser-ui/Constellation.tsx:160` — CTA nổi nhất là tạo browser profile.
- `src/components/mktbrowser-ui/Constellation.tsx:202` — tag `mkttool` / `tiktok`.
- `src/components/mktbrowser-ui/Constellation.tsx:210` — trạng thái browser local nằm trong luồng chính.

**Vì sao quan trọng:** trong 10 giây đầu, người mới sẽ đọc notice như disclaimer “tính năng đang hỏng”
hoặc cảnh báo tạm thời, không phải định nghĩa sản phẩm. Họ tiếp tục hành động theo CTA cũ.

**Hướng sửa hẹp:** đổi H1, CTA và empty state theo kho danh tính; đưa “nick của tôi / toàn team” thành
trục chính. Không cần đổi màu/font/icon toàn app. **Công sức: M.**

### F6 — CAO: multi-user nhưng danh sách giấu owner, dựng “Local PC” giả, rồi bỏ lý do lỗi chính xác

**Người dùng gặp:** Home và `/accounts` không hiện người phụ trách. Query Home không include quan hệ
owner và model UI cũng không mang owner.
Khi nick chưa ghim máy, card/table ghi “Local PC”, biến thiếu dữ liệu thành một máy tưởng tượng. Nếu
trạng thái đổi giữa lúc xem và bấm, API trả đúng nick nằm ở máy nào/của ai, nhưng Home và list bỏ
`body.message`, gom mọi HTTP 409 thành lỗi chung.

- `src/app/page.tsx:10` — query account không include owner.
- `src/app/accounts/page.tsx:64` — bảng không có cột owner hoặc máy.
- `src/components/mktbrowser-ui/ProfileTile.tsx:227` — thiếu device hiện thành “Local PC”.
- `src/components/mktbrowser-ui/ProfileTable.tsx:193` — cùng trạng thái giả ở list view.
- `src/components/mktbrowser-ui/ProfileTile.tsx:110` — đọc response nhưng type bỏ `message`.
- `src/components/mktbrowser-ui/ProfileTile.tsx:114` — thay lý do server bằng câu theo status.
- `src/components/mktbrowser-ui/ProfileTable.tsx:96` — list view làm giống vậy.
- `src/lib/tickets/ticket-recipient-lookup.ts:164` — server đã có lý do exact owner/device.

**Vì sao quan trọng:** mỗi nick có đúng một owner và PC, nhưng màn hình dùng hằng ngày không trả lời
“nick nào của tôi”. Người dùng dễ bấm nhầm nick đồng nghiệp, hiểu sai nick chưa ghim là nằm trên máy
mình, rồi chỉ nhận lỗi mơ hồ.

**Hướng sửa hẹp:** hiện owner + device trên cả grid/list; thiếu thì ghi “Chưa ghim máy”; giữ nguyên
`body.message` đã được server làm sạch. **Công sức: M.**

### F7 — CAO: xác nhận thao tác nguy hiểm không nhất quán đúng ở 3 đường có hậu quả thật

**Người dùng gặp:**

1. **Đổi owner/máy:** hai dropdown dùng nút chung “Lưu phân công”. Chuyển máy đổi nơi nhận mọi vé,
   nhưng không có preview “từ A sang B” hay xác nhận đã export/import/xóa bản cũ. Cảnh báo đứng thường
   trực ở trên; warning cụ thể còn được trả sau khi database đã đổi.
2. **Đổi proxy:** mọi user đã đăng nhập gọi được `updateAccount`; proxy nằm trong form “Sửa nick” với
   nút chung “Lưu”. Đổi xong, lần mở sau dùng network khác; không confirm, không tóm tắt before/after.
3. **Compatibility update:** ADMIN bấm một lần là phát ticket và stage update. Chỉ sau thành công UI
   mới nói Relay và MKT Browser sẽ restart.

- `src/app/accounts/[id]/page.tsx:257` — warning chuyển máy luôn hiện, không gắn với lựa chọn vừa đổi.
- `src/app/accounts/[id]/page.tsx:273` — “Lưu phân công” áp dụng ngay.
- `src/lib/accounts/account-owner-actions.ts:157` — transaction đổi owner/device theo `id`.
- `src/lib/accounts/account-cluster-change.ts:103` — cảnh báo chuyển profile nằm trong message sau ghi.
- `src/lib/auth/guarded-action.ts:60` — `guardedAction` cho mọi vai trò.
- `src/lib/accounts/vault-update-actions.ts:91` — sửa nick dùng `guardedAction`, không phải `adminAction`.
- `src/lib/accounts/vault-update-actions.ts:140` — đổi account/proxy ngay theo `id`.
- `src/components/relay/relay-compatibility-update-button.tsx:85` — update chạy ở click đầu tiên.
- `src/components/relay/relay-compatibility-update-button.tsx:88` — nhãn không báo restart trước khi bấm.

**Vì sao quan trọng:** các thay đổi đều sửa routing hoặc môi trường thật ngoài màn hình. Chúng có thể
đảo lại trong DB, nhưng bản profile cũ không tự biến mất và phiên đang dùng có thể bị gián đoạn.

**Hướng sửa hẹp:** confirmation chỉ bật khi giá trị thật sự đổi; tóm tắt before/after và hậu quả.
Compatibility update cần pre-confirm restart. **Công sức: M.**

### F8 — CAO: hai tab/người có thể last-write-wins mà không được cảnh báo

**Người dùng gặp:** form sửa nick và form phân công chỉ gửi `id`; action đọc bản ghi rồi update theo
`where: { id }`. `Account.updatedAt` có sẵn nhưng không đi qua form và không nằm trong điều kiện ghi.
Hai người mở cùng nick: người B lưu sau sẽ ghi đè phần dữ liệu người A vừa đổi, dù màn hình B vẫn là
bản cũ. Audit log chỉ giúp điều tra sau, không ngăn mất thay đổi.

- `prisma/schema.prisma:371` — có `updatedAt` để làm revision.
- `src/app/accounts/[id]/page.tsx:274` — form phân công chỉ gửi `accountId`.
- `src/app/accounts/[id]/page.tsx:311` — form sửa chỉ gửi `id`.
- `src/lib/accounts/account-owner-actions.ts:73` — read hiện trạng.
- `src/lib/accounts/account-owner-actions.ts:158` — update chỉ theo `id`.
- `src/lib/accounts/vault-update-actions.ts:107` — read hiện trạng.
- `src/lib/accounts/vault-update-actions.ts:140` — update chỉ theo `id`.

**Vì sao quan trọng:** 5-6 người dùng chung, ai cũng thấy và sửa dữ liệu của người khác. Đây là race
thực tế ở cấp UI, không cần hai request trùng microsecond; chỉ cần hai tab mở vài phút.

**Hướng sửa hẹp:** gửi `updatedAt` làm revision; conditional update và trả “bản ghi vừa được X thay
đổi, tải lại trước khi lưu”. Áp dụng trước cho account + cluster, không cần lock toàn app. **Công sức: M.**

### F9 — CAO khi đăng nhập lỗi: màn hình operator nói bằng ngôn ngữ quản trị server

**Người dùng gặp:** ngay màn hình login thấy `ALLOWED_EMAILS`, `npm run auth:check` và
`GOOGLE_CLIENT_SECRET`. Lỗi email không được phép còn bảo thêm biến vào `.env` rồi restart app.
Người không phải kỹ sư không làm được và không có CTA/contact để chuyển việc cho đúng người.

- `src/app/login/page.tsx:35` — mô tả allowlist bằng tên env.
- `src/app/login/page.tsx:52` — hướng dẫn CLI/secret hiện cho mọi người.
- `src/lib/auth/sign-in-error-messages.ts:27` — chi tiết Google Cloud + `.env` cho operator.
- `src/lib/auth/sign-in-error-messages.ts:96` — lỗi `EMAIL_NOT_ALLOWED` lộ enum và hướng sửa server.
- `src/lib/auth/sign-in-error-messages.ts:121` — mã lạ dẫn người dùng chạy CLI/xem server log.

**Vì sao quan trọng:** happy path vẫn đi được nếu admin chuẩn bị allowlist đúng. Nhưng lỗi mời sai email
là ca onboarding bình thường; hiện tại người mới chắc chắn dừng và hỏi bằng ảnh chụp màn hình kỹ thuật.

**Hướng sửa hẹp:** operator thấy email vừa dùng + “liên hệ quản trị viên”; chi tiết env/CLI để trong
log hoặc khối admin diagnostics. **Công sức: S.**

---

## Phát hiện — mức vừa

### F10 — VỪA: route parked và câu từ chối dùng ranh giới cũ, không dạy hành động tiếp theo

**Người dùng gặp:** banner nói “không nằm trong phạm vi TikTok hiện tại” và “Trang vẫn dùng được”,
trong khi trạng thái thật là mọi đường đăng đều đóng và các trang chỉ nên dùng để xem lịch sử/tham
chiếu. Banner không có đường quay lại kho danh tính. Khi bấm hành động, message có thể in nguyên
`FACEBOOK_PAGE` và bảo đặt `ROLLOUT_PLATFORMS` — việc của owner, không phải operator.

- `src/components/layout/parked-scope-banner.tsx:18` — ranh giới TikTok cũ + “Trang vẫn dùng được”.
- `src/lib/platforms/rollout-scope.ts:88` — nhận raw platform string.
- `src/lib/platforms/rollout-scope.ts:90` — raw enum có thể hiện thẳng.
- `src/lib/platforms/rollout-scope.ts:92` — env var là “next step”.

**Vì sao quan trọng:** phần “chuyện gì/vì sao” có, nhưng “tôi làm gì tiếp” chưa có. Operator dễ nghĩ
mình bấm sai hoặc app đang tạm hỏng.

**Hướng sửa hẹp:** nhãn nền tảng thân thiện; nói “chỉ xem lịch sử, không đăng”; link về kho nick;
“liên hệ chủ dự án nếu nghiệp vụ này được mở lại”. Giữ nguyên route. **Công sức: S.**

### F11 — VỪA: search, `Ctrl K` và số profile đang chạy là tín hiệu giả

**Người dùng gặp:** gõ search thay đổi state trong `AppShell`, nhưng state chỉ quay lại `TopBar`;
`Constellation` luôn nhận default `""`, nên danh sách không lọc. Badge `Ctrl K` không có handler.
Header luôn nhận default `0 running` vì layout không truyền `runningProfiles`, dù `Constellation` tự
poll được danh sách đang chạy.

- `src/components/mktbrowser-ui/AppShell.tsx:26` — giữ search state.
- `src/components/mktbrowser-ui/AppShell.tsx:39` — chỉ truyền state cho TopBar.
- `src/app/page.tsx:72` — không truyền `searchQuery` vào `Constellation`.
- `src/components/mktbrowser-ui/Constellation.tsx:45` — rơi về chuỗi rỗng.
- `src/components/mktbrowser-ui/TopBar.tsx:57` — hứa `Ctrl K`, không có key handler trong `src`.
- `src/app/layout.tsx:63` — không truyền `runningProfiles`, nên default 0.

**Vì sao quan trọng:** không chặn onboarding, nhưng hai tín hiệu nổi nhất trên header không phản ánh
thực tế. Với công cụ dùng chung, người dùng mất niềm tin vào trạng thái trước khi chạm phần nhạy cảm.

**Hướng sửa hẹp:** nối search bằng context/query state hoặc đặt search trong Home; bỏ badge tới khi
shortcut chạy; đưa running state lên shell hoặc bỏ count global. **Công sức: M.**

### F12 — VỪA: cùng một object có quá nhiều tên, lẫn cả object account và browser profile

**Người dùng gặp:** cùng bản ghi được gọi là `Kênh / Profiles`, `All profiles`, `Tài khoản`, `nick`,
`hồ sơ TikTok`, `profile cấu hình`. Máy được gọi là `Máy`, `PC`, `Device`, `Relay`, `cầu nối`, đôi
khi “Local PC”. Route parked tiếp tục trộn `target` và `đích`. Người không kỹ thuật không biết “tạo
profile” là tạo bản ghi kho hay tạo browser profile cục bộ — hai việc có hậu quả khác nhau.

- `src/components/mktbrowser-ui/LeftRail.tsx:15` — “Kênh / Profiles”.
- `src/components/mktbrowser-ui/Constellation.tsx:127` — “All profiles”.
- `src/app/accounts/page.tsx:55` — “Tài khoản”.
- `src/app/accounts/page.tsx:59` — “nick”.
- `src/components/tiktok/new-tiktok-profile-sheet.tsx:65` — “hồ sơ TikTok”.
- `src/components/setup/onboarding-stepper.tsx:39` — “Máy Vận Hành (MKT Setup)”.
- `src/components/mktbrowser-ui/LeftRail.tsx:17` — “Máy / Relay”.
- `src/lib/setup/setup-checklist.ts:141` — “publishing targets” trên UI setup.

**Vì sao quan trọng:** đây không chỉ là dịch thuật. Nó làm người dùng không phân biệt account trong
kho, profile local và chiếc máy nhận vé; nhầm đúng ở các thao tác gán/xóa/mở.

**Hướng sửa hẹp:** chốt glossary UI ngắn: **nick** = bản ghi kho; **profile trình duyệt** = dữ liệu
local; **máy Relay** = PC nhận vé. Sửa trước Home, Setup và account detail. **Công sức: M.**

---

## Cái đang tốt

- Posting fail-closed và scope notice đọc cùng một nguồn sự thật; không có danh sách scope thứ hai dễ trôi (`src/components/layout/team-scope-notice.tsx:16`, `src/lib/platforms/rollout-scope.ts:67`).
- Readiness tách đúng “đang chờ” khỏi “có người phải xử lý”, và mỗi blocker có việc tiếp theo (`src/components/vault/account-readiness-badge.tsx:12`, `src/components/vault/account-readiness-badge.tsx:68`).
- Trang chi tiết nói rõ owner quyết định quyền bí mật, device quyết định vé bay về đâu; OPERATOR vẫn thấy thẻ read-only thay vì gặp nút chết không giải thích (`src/app/accounts/[id]/page.tsx:219`).
- Xóa dùng xác nhận 2 bước và nói không hoàn tác (`src/components/ui/delete-entity-button.tsx:47`).
- Emergency revoke nói rõ gỡ assignment nhưng không xóa dữ liệu local, và nhắc rotate key (`src/components/relay/relay-device-revoke-button.tsx:32`).
- Retirement và rollback đòi gõ đúng tên PC; hậu quả chính được nói trước (`src/components/relay/relay-device-retirement-button.tsx:149`, `src/components/relay/relay-compatibility-rollback-button.tsx:116`).
- Proxy chưa từng kiểm không bị giả thành “khỏe”; UI ghi rõ “chưa kiểm lần nào” (`src/components/proxies/proxy-last-check-cell.tsx:24`).

## Cái cố ý không sửa

- **Không xóa** `/content`, `/facebook`, `/health`, `/queue`, `/targets`. Giữ lịch sử và đường quay lại là chủ ý; chỉ cần sửa cách giải thích khi người dùng lạc vào.
- Không mở lại Reddit/Facebook, không thêm nền tảng, không đổi `ROLLOUT_PLATFORMS`.
- Không nới `G2-IDENTITY`, không dùng nick thật, không phát MKT Browser, không biến local technical readiness thành identity claim.
- Không đề xuất redesign màu/font/spacing/icon. Chỉ nêu hierarchy khi nó trực tiếp làm hiểu sai sản phẩm hoặc bấm sai.
- Không áp dụng migration `20260830030000_add_better_auth_rate_limit`; local DB giữ nguyên theo brief.
- Phiên này không sửa code, không PR, không migration, không production credential.

## Câu hỏi chưa trả lời

1. Kho danh tính hiện có cần một **gói Relay-only được hỗ trợ** cho operator không? Nếu có, URL/package authoritative là gì; nếu không, device enrollment và secret retrieval đang được bàn giao ở trạng thái nào?
2. “Tự đi hết” có cho phép chờ ADMIN chuẩn bị allowlist, nick và proxy trước không? Nếu có, UI cần gọi đó là trạng thái chờ và nêu đúng đầu mối; ai là đầu mối hiển thị?
3. Tạo/lưu nick TikTok có còn thuộc phạm vi kho danh tính tuần này không, hay Home chỉ nên dẫn tới inventory đã được ADMIN giao? Câu trả lời quyết định CTA, không quyết định mở posting.
4. Ai sẽ làm buổi G4 với máy Windows sạch và một operator chưa từng dùng app; tiêu chí pass, ngày chạy và nơi giữ recording/evidence là gì?
5. Authenticated walkthrough cho `/setup` → `/accounts` → `/proxies` → `/relay-devices` vẫn **OPEN** trong audit này. Vòng kiểm tiếp theo sẽ dùng DB local đã áp migration trong một phiên được phép, hay một session synthetic không chứa credential thật?

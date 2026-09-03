# Prompt Codex: chốt quyền proxy + chuyển toàn bộ UI/message sang tiếng Anh

**Ngày tạo:** 03/09/2026
**Nguồn:** [review 4 phase UX](codex-260903-0935-ux-implement-prompt.md) · [audit gốc](audit-260903-0854-mkttool-ux-userflow.md)
**Quyết định của chủ dự án:** proxy = **B + D**; ngôn ngữ = **toàn bộ tiếng Anh, giữ comment tiếng Việt**
**Cách chạy:** **một phiên Codex cho mỗi phase**, một PR cho mỗi phase, base `master`

---

## Điều kiện bắt buộc trước khi bắt đầu

**Merge PR #55 (`feat/ux-phase4-shared-use-safety`) trước.** Phase 0 dưới đây sửa
`vault-update-actions.ts`, đúng file mà #55 đang đổi. Chạy song song là tự tạo xung đột.

Trạng thái đã kiểm tại máy 03/09 trên nhánh #55: `typecheck` PASS, `lint` PASS,
`test` PASS 221 files / 2008 tests.

---

## Quyết định đã chốt — đừng bàn lại

1. **Quyền đổi proxy = B + D.** Đổi `proxyId` của nick chuyển thành việc **chỉ ADMIN**, cộng
   thêm **dấu vết audit** cho cả proxy và profile antidetect. Lý lẽ: `updateProxy` (sửa kho
   proxy) và `assignAccountCluster` (gán chủ/máy) **đã là** `adminAction`; `proxyId` là
   `@unique`, tức cấp phát tài nguyên khan hiếm. Để đường thứ ba mở là bất đối xứng không giải
   thích được.
2. **Ngôn ngữ sản phẩm = tiếng Anh.** Mọi chuỗi người dùng đọc được: nhãn, tiêu đề, nút,
   placeholder, empty state, và **mọi `ActionResult.message`**.
3. **Comment code giữ nguyên tiếng Việt.** JSDoc và chú thích là tài liệu nội bộ, không phải UI.
   Dịch chúng là việc tốn công, rủi ro làm mất lý lẽ đã viết kỹ, và người dùng không thấy.
   **Không đụng tới.**
4. **Không đổi tên model, cột DB, route, hay tên hàm.** Đây là đổi chữ hiển thị. Không migration.
5. **Không mở lại phạm vi đã rút.** Reddit/Facebook vẫn đóng bằng `rollout-scope.ts`. Dịch câu
   từ chối sang tiếng Anh **không** phải là nới ranh giới.

---

## Khối lượng đã đo

Đếm bằng script, đã loại chuỗi nằm trong comment:

| Vùng | Files | Chuỗi nguồn | Chuỗi trong test |
|---|---:|---:|---:|
| `src/components` | 48 | 249 | — |
| `src/app` | 20 | 187 | — |
| `src/lib` | 106 | 890 | — |
| Test (assert nguyên văn) | 112 | — | 1.578 |
| **Cộng** | **~286** | **~1.326** | **~1.578** |

Test assert đúng chuỗi, nên dịch sót là **đỏ ngay**, không hỏng im lặng. Đó là lưới an toàn của
việc này — đừng nới nó.

---

## Chia phase

Mỗi phase **sở hữu trọn vẹn vài thư mục**, nên hai phase không bao giờ chạm cùng một file.

| Phase | Vùng sở hữu | Chuỗi (nguồn/test) | Công sức |
|---|---|---:|---|
| 0 | Quyền proxy + audit (`lib/accounts/vault-update-actions.ts`, `lib/audit`, form vault) | — | ~1 ngày |
| 1 | `lib/accounts`, `app/accounts`, `components/vault`, `components/mktbrowser-ui` | 283 / 264 | 2-3 ngày |
| 2 | `lib/health`, `lib/rules`, `lib/queue`, `components/health`, `components/queue`, `app/health`, `app/queue` | 392 / 453 | 3-4 ngày |
| 3 | `lib/tickets`, `lib/proxies`, `lib/relay`, `lib/antidetect`, `app/relay-devices`, `app/proxies`, `components/proxies`, `components/relay` | 290 / 360 | 2-3 ngày |
| 4 | `lib/auth`, `lib/setup`, `lib/crypto`, `lib/db`, `lib/backup`, `lib/r2`, `lib/ops-alerts`, `lib/format`, `lib/schedule`, `lib/http`, `lib/totp`, `app/login`, `app/api`, `components/auth` | 196 / 390 | 2-3 ngày |
| 5 | `lib/facebook`, `lib/content`, `lib/platforms`, `lib/dashboard`, `lib/release`, `app/content`, `app/targets`, `app/facebook`, `app/overview-alert-stack-parked.tsx`, `components/facebook`, `components/content`, `components/tiktok`, `components/layout`, `components/ui`, `src/proxy-matcher.test.ts` | 164 / 111 | 1-2 ngày |

Năm phase cộng lại đúng **1.325 / 1.326** chuỗi nguồn và **1.578 / 1.578** chuỗi test đã đo —
mọi file đều thuộc đúng một phase, không file nào có hai chủ và không file nào bị bỏ sót.

**Thứ tự bắt buộc:** 0 → 1 → (2, 3, 4, 5 chạy thứ tự nào cũng được).

Phase 1 phải đi trước vì nó chốt từ vựng lõi trong `docs/ui-glossary.md`; các phase sau **tra
glossary chứ không tự đặt tên mới**. Phase 2 lớn nhất — tách làm hai phiên (health, rồi
rules+queue) nếu một phiên thấy đuối.

---

## Luật chung cho MỌI phase

Dán nguyên khối này vào đầu mỗi prompt phase.

```text
# Luật dịch — áp cho mọi phase

## Dịch cái gì
- Nhãn, tiêu đề, nút, placeholder, empty state, tooltip, aria-label.
- MỌI `ActionResult.message`, kể cả câu từ chối quyền và câu lỗi.
- Câu ném ra từ `AuthorizationError` và mọi lỗi tới được màn hình.

## KHÔNG đụng
- Comment và JSDoc tiếng Việt — giữ nguyên 100%. Đây là tài liệu nội bộ.
- Tên model Prisma, tên cột, route, tên biến, tên hàm, tên file.
- Giá trị enum, khóa i18n, giá trị lưu xuống DB, nội dung audit `action`.
- Chuỗi đã là tiếng Anh sẵn (SERVER_DIAGNOSTICS trong sign-in-error-messages.ts...).

## Giữ hợp đồng ActionResult
Quy ước cũ là "nói chuyện gì xảy ra và làm gì tiếp". Dịch xong vẫn phải giữ đủ HAI vế đó,
chỉ đổi ngôn ngữ. Câu tiếng Anh cụt lủn kiểu "Failed." là làm hỏng quy ước, không phải dịch.

Ví dụ đúng:
  "Nick \"x\" do người khác phụ trách — chỉ chủ nick lấy được mật khẩu và OTP của nó."
  → "Nick \"x\" belongs to another operator. Only its owner can read its password and OTP."

## Từ vựng
`docs/ui-glossary.md` là hợp đồng. Tra nó trước khi đặt bất kỳ tên mới nào.
Gặp khái niệm chưa có trong glossary thì THÊM VÀO GLOSSARY trong cùng PR, kèm một dòng
"Before → After". Đừng đặt tên rời rồi để phase sau đoán.

Ba khái niệm lõi, không được lẫn:
  nick            = bản ghi danh tính trong kho (model Account)
  browser profile = dữ liệu cục bộ trên một PC (Account.antidetectProfileId)
  Relay PC        = chiếc PC đã đăng ký nhận vé (model RelayDevice)

## An toàn — đừng dịch hỏng ý nghĩa bảo mật
- Câu đăng nhập hỏng KHÔNG được tiết lộ email nào nằm trong allowlist. Giữ nguyên hành vi
  của `signInErrorMessage`: nêu lại email vừa gõ thì được, tiết lộ danh sách thì không.
- Tên biến môi trường và lệnh CLI ở lại `SERVER_DIAGNOSTICS`. Đừng để chúng leo ngược ra
  câu người dùng đọc.
- Câu từ chối quyền phải giữ đúng mức chặt. Dịch mềm đi thành lời khuyên là đổi hành vi.

## Test
- Test assert nguyên văn chuỗi. Sửa assertion cho khớp bản dịch.
- TUYỆT ĐỐI không nới test để cho qua: không đổi `toBe` thành `toContain`, không thay chuỗi
  bằng regex lỏng, không xóa assertion.
- Chú ý loại test đọc mã nguồn dạng chuỗi — chúng đỏ theo cách khó đọc:
    src/components/mktbrowser-ui/navigation-vocabulary-contract.test.ts
    src/lib/setup/setup-links-point-where-the-work-is.test.ts
    src/lib/setup/setup-page-keeps-workspace-checklist.test.ts
    src/lib/auth/guarded-entry-points.test.ts
- Nếu một test cản đường, đọc xem nó đang bảo vệ điều gì TRƯỚC KHI sửa nó.

## Trước khi mở PR
npm run typecheck && npm run lint && npm test — cả ba phải xanh.
Chạy thêm: grep lại vùng mình sở hữu, xác nhận không còn chuỗi tiếng Việt ngoài comment.

## Đầu ra
PR mô tả: vùng đã sở hữu, số chuỗi đã dịch, từ mới thêm vào glossary, số test.
```

---

## Prompt phase 0 — quyền proxy (B) + dấu vết audit (D)

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. PR #55 đã merge.

# Việc

Đóng câu hỏi "Owner decision required - proxy assignment authorization" trong PR #55.
Chủ dự án đã chọn phương án B + D.

PR duy nhất trên MKTTool, base master, nhánh feat/proxy-authorization-and-audit.

Phase này KHÔNG dịch gì. Giữ nguyên tiếng Việt mọi chuỗi.

# B — đổi proxy của nick là việc của ADMIN

Hiện trạng: `updateAccount` bọc `guardedAction`, và `requireNickOwner` chỉ được gọi khi form
mang bí mật lên. Nên mọi user đã đăng nhập đổi được `proxyId` của bất kỳ nick nào.

Đây là bất đối xứng: `updateProxy` (cùng file) và `assignAccountCluster` đều đã là
`adminAction`. `proxyId` lại là `@unique`, tức gán proxy là cấp phát tài nguyên khan hiếm.

Sửa: trong thân `updateAccount`, đọc `proxyId` hiện tại từ DB (đã có sẵn lượt
`prisma.account.findUnique` đọc `platform`/`status` — thêm `proxyId` vào `select` đó, đừng
thêm truy vấn thứ hai). Nếu `proxyId` mới KHÁC giá trị hiện tại thì gọi `requireAdmin(actor)`.

Dùng đúng mẫu đã có: `requireNickOwner` cũng được gọi TRONG thân hàm vì nó cần `accountId`.
`guardedAction` đã bọc cả thân hàm nên `AuthorizationError` tự thành ActionResult — xem chú
thích đầu guarded-action.ts. Đừng tự bắt lỗi tại chỗ.

Câu từ chối phải nói rõ đây là việc của ADMIN và làm gì tiếp, theo quy ước ActionResult.

KHÔNG đụng `antidetectProfileId` trong phase này — xem mục "Báo cáo, đừng tự sửa" bên dưới.

# B (phần giao diện) — đừng cho operator sửa ô rồi mới báo hỏng

Ô proxy trong form vault hiện ai cũng sửa được. Để nguyên thì OPERATOR gõ xong, bấm lưu, rồi
mới ăn câu từ chối — đúng kiểu ngõ cụt mà audit F4 đã nêu.

Sửa: OPERATOR thấy proxy hiện tại ở dạng chỉ đọc, kèm câu nói rõ đổi proxy là việc của ADMIN
và đầu mối liên hệ. ADMIN thấy ô sửa như cũ.

Dùng lại đúng mẫu phân nhánh theo role của F4 trong proxy-console.tsx — đừng phát minh lại,
và đừng dựng danh sách admin thứ hai (đầu mối suy từ ADMIN_EMAILS).

`account-proxy-change-confirmation.tsx` (PR #55) chỉ còn ý nghĩa với ADMIN. Giữ nguyên hành vi
"chỉ xác nhận khi giá trị thật sự đổi".

# D — proxy và browser profile phải để lại dấu vết

Hiện `ACCOUNT_UPDATED` ghi detail chỉ gồm karma và status:

    detail: existing.status === data.status
      ? `karma ${data.karma}, ${data.status}`
      : `karma ${data.karma}, trạng thái ${existing.status} → ${data.status}`

Nghĩa là đổi proxy hoặc đổi browser profile KHÔNG để lại vết gì. Sổ chỉ ghi "karma 500, ALIVE".

Sửa: khi `proxyId` hoặc `antidetectProfileId` đổi, ghi thêm chiều đổi trước → sau vào detail.
Theo đúng mẫu câu đang dùng cho status.

Ràng buộc:
- KHÔNG ghi bí mật, mật khẩu, hay chuỗi kết nối proxy vào audit. Nhãn/id là đủ.
- Hàng audit vẫn phải nằm TRONG transaction cùng lượt ghi, như PR #55 đã làm.
- Đổi mà không có gì khác thì đừng ghi thêm chữ thừa — detail phải đọc được.

# Test bắt buộc

Trên Postgres thật, theo mẫu các .database.test.ts hiện có:
1. OPERATOR đổi proxyId của nick người khác → bị từ chối, và KHÔNG ghi gì (không đổi bản ghi,
   không thêm hàng audit).
2. OPERATOR sửa karma/status/voice của nick người khác mà KHÔNG đụng proxy → vẫn chạy được
   như cũ. Đây là hồi quy quan trọng nhất: B không được biến việc chung hằng ngày thành việc
   phải xin phép.
3. ADMIN đổi proxyId → chạy được, và audit detail có chiều đổi trước → sau.
4. Đổi antidetectProfileId → audit detail ghi lại, quyền KHÔNG đổi.

# Báo cáo, đừng tự sửa

`antidetectProfileId` cũng là `@unique` và cũng là ràng buộc cụm giống proxy, nhưng phase này
chỉ gác proxy theo đúng quyết định đã chốt. Ghi thành mục riêng trong PR: nên gác nó như proxy
hay để mở, và vì sao. Chủ dự án quyết, đừng tự đổi.

# Ràng buộc

- Không migration. Không đổi mô hình quyền ở đâu khác.
- Không đụng rollout scope.
- typecheck + lint + test xanh trước khi mở PR.

# Đầu ra

PR mô tả: B đổi quyền ở đâu, giao diện phân nhánh role thế nào, D ghi thêm gì vào audit,
kèm 4 test trên. Cộng một mục về antidetectProfileId cho chủ dự án quyết.
```

---

## Prompt phase 1 — kho nick (chốt từ vựng lõi)

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 0 đã merge.

<<< DÁN NGUYÊN KHỐI "Luật dịch — áp cho mọi phase" VÀO ĐÂY >>>

# Việc

Dịch sang tiếng Anh toàn bộ chuỗi người dùng đọc được trong bốn thư mục bạn SỞ HỮU:

    src/lib/accounts        (169 chuỗi nguồn, 262 trong test)
    src/app/accounts        (42)
    src/components/vault    (71)
    src/components/mktbrowser-ui  (1)

Không đụng file ngoài bốn thư mục này, trừ docs/ui-glossary.md.

PR duy nhất, base master, nhánh feat/en-phase1-nick-vault.

# Vì sao phase này đi trước

Đây là phase chốt từ vựng lõi. Bốn phase sau sẽ TRA glossary của bạn chứ không tự đặt tên.
Đặt tên cẩu thả ở đây thì năm phase sau lệch theo.

Phase 2 của đợt UX vừa rồi đã dịch một phần vùng này rồi (Nick vault, Team nick vault,
Relay PC not assigned...). Giữ nguyên những gì đã có trong glossary — bạn đang dịch nốt
phần còn lại, không đặt lại tên từ đầu.

# Chỗ cần cẩn thận

- vault-form-schemas.ts (26 chuỗi): câu lỗi validation của Zod. Chúng hiện thẳng cho người
  dùng qua `firstError()`. Dịch đủ hai vế "sai gì / sửa thế nào".
- STALE_ACCOUNT_WRITE_MESSAGE đã là tiếng Anh sẵn từ PR #55 — để nguyên, và LẤY NÓ LÀM MẪU
  giọng văn cho các câu khác.
- account-readiness.ts (26 chuỗi): câu chặn mở profile. Đây là thứ operator gặp nhiều nhất
  khi có chuyện, nên phải nói rõ làm gì tiếp.
- vault-delete-actions.ts (24 chuỗi): câu xác nhận xóa. Dịch nhẹ tay đi là làm hỏng lớp
  bảo vệ — giữ đúng mức nghiêm.
- account-form-fields.tsx: có câu hướng dẫn dài về TOTP và Google 2FA. Dịch đủ ý, đừng cắt
  ngắn cho gọn — đó là hướng dẫn thao tác thật.
- vault-update-actions.ts và account-owner-actions.ts vừa bị phase 0 sửa. Đọc bản mới nhất
  trên master trước khi bắt đầu.

# Đầu ra

PR kèm bảng "Before → After" cho các nhãn đã đổi, thêm vào docs/ui-glossary.md.
Ghi rõ số chuỗi đã dịch và số test.
```

---

## Prompt phase 2 — sức khỏe, luật, hàng đợi

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 đã merge.

<<< DÁN NGUYÊN KHỐI "Luật dịch — áp cho mọi phase" VÀO ĐÂY >>>

# Việc

Dịch sang tiếng Anh các thư mục bạn SỞ HỮU:

    src/lib/health          (139 / 149 test)
    src/lib/rules           (74 / 181 test)
    src/lib/queue           (39 / 108 test)
    src/components/health   (38)
    src/components/queue    (77)
    src/app/health          (11)
    src/app/queue           (14)

PR trên nhánh feat/en-phase2-health-rules-queue.

Đây là phase LỚN NHẤT (392 chuỗi nguồn, 438 trong test). Nếu thấy đuối, tách làm hai commit
rõ ràng — health trước, rồi rules+queue — để cái sau hỏng thì không phải gỡ cả hai.

# Chỗ cần cẩn thận

- Bộ luật (lib/rules) sinh ra câu VERDICT mà người dùng đọc để hiểu vì sao một job bị chặn.
  Đây không phải nhãn — nó là lời giải thích. Dịch mất ý là làm người dùng mù về lý do.
- Kiểm tra xem verdict có được LƯU XUỐNG DB không (PostJob.ruleVerdicts). Nếu có, verdict
  cũ trong DB vẫn là tiếng Việt sau khi bạn dịch. Đọc kỹ chỗ này rồi mô tả trong PR bạn xử
  lý thế nào — KHÔNG viết migration, KHÔNG xóa dữ liệu cũ. Nếu cần một quyết định của chủ
  dự án thì ghi thành mục riêng thay vì tự chọn.
- health-status-evaluator.ts (41 chuỗi) là file dày nhất vùng này. Câu của nó quyết định
  người dùng hiểu nick đang khỏe hay đang chết.

# Đầu ra

PR kèm bảng Before → After, cập nhật glossary nếu có từ mới, số test.
Cộng một mục về ruleVerdicts đã lưu, nếu có chuyện cần chủ dự án quyết.
```

---

## Prompt phase 3 — proxy, Relay, vé

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 đã merge.

<<< DÁN NGUYÊN KHỐI "Luật dịch — áp cho mọi phase" VÀO ĐÂY >>>

# Việc

Dịch sang tiếng Anh các thư mục bạn SỞ HỮU:

    src/lib/tickets         (109 / 158 test)
    src/lib/proxies         (79 / 76 test)
    src/lib/relay           (26 / 93 test)
    src/lib/antidetect      (12 / 33 test)
    src/app/relay-devices   (33)
    src/app/proxies         (4)
    src/components/proxies  (17)
    src/components/relay    (10)

PR trên nhánh feat/en-phase3-proxy-relay-tickets.

# Chỗ cần cẩn thận

- ticket-recipient-lookup.ts sinh câu lý do owner/device chính xác mà PR #55 vừa công phu
  giữ lại cho tới giao diện. Dịch xong phải vẫn chỉ đúng tên nick, tên máy, tên người —
  đừng gom về câu chung.
- relay-device-actions.ts (40 chuỗi): gồm câu thu hồi máy. Đây là thao tác không lùi được,
  giữ nguyên mức nghiêm khi dịch.
- proxy-socks5-tunnel.ts: câu lỗi mạng. Giữ nguyên chi tiết chẩn đoán, đừng làm mờ đi.
- "Relay PC" là tên chiếc máy, "Relay" là phần mềm. Glossary đã chốt — đừng dùng lẫn.

# Đầu ra

PR kèm bảng Before → After, glossary nếu có từ mới, số test.
```

---

## Prompt phase 4 — đăng nhập, thiết lập, hạ tầng

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 đã merge.

<<< DÁN NGUYÊN KHỐI "Luật dịch — áp cho mọi phase" VÀO ĐÂY >>>

# Việc

Dịch sang tiếng Anh các thư mục bạn SỞ HỮU:

    src/lib/auth, src/lib/setup, src/lib/crypto, src/lib/db, src/lib/backup,
    src/lib/r2, src/lib/ops-alerts, src/lib/format, src/lib/schedule,
    src/lib/http, src/lib/totp, src/app/login, src/app/api, src/components/auth

(196 chuỗi nguồn, 390 trong test)

PR trên nhánh feat/en-phase4-auth-and-infra.

# Chỗ cần cẩn thận — phase này đụng bảo mật

- sign-in-error-messages.ts: USER_MESSAGES (tiếng Việt) → tiếng Anh. SERVER_DIAGNOSTICS ĐÃ
  là tiếng Anh, GIỮ NGUYÊN. Không được để tên biến môi trường hay lệnh CLI leo từ
  SERVER_DIAGNOSTICS sang USER_MESSAGES. Hành vi phải không đổi: nêu lại email vừa gõ thì
  được, tiết lộ ai nằm trong ALLOWED_EMAILS thì không.
- require-actor.ts: câu của AuthorizationError, gồm "nick này do người khác phụ trách" và
  "nick chưa được phân công cho ai". Đây là câu chặn quyền — dịch mềm đi là đổi hành vi
  cảm nhận được. Giữ đúng mức.
- encryption-key-loader.ts (23 chuỗi): câu hỏng khóa vault. Người đọc chúng đang gặp sự cố
  thật, nên phải nói rõ làm gì tiếp.
- guarded-entry-points.test.ts kiểm hình dạng mã nguồn. Đừng đổi hình dạng export nào.
- src/app/api: kiểm xem chuỗi nào là body trả về API (máy đọc) chứ không phải chữ người đọc.
  Đổi contract API không nằm trong phạm vi — nếu gặp, báo lại, đừng tự đổi.

# Đầu ra

PR kèm bảng Before → After, glossary nếu có từ mới, số test.
Ghi rõ đã kiểm lại rằng không có chi tiết cấu hình nào lọt ra câu người dùng đọc.
```

---

## Prompt phase 5 — nội dung, đích đăng, phần còn lại

```text
Bạn đang làm việc trong E:/MKTWorkspace. Đọc AGENTS.md trước. Phase 1 đã merge.

<<< DÁN NGUYÊN KHỐI "Luật dịch — áp cho mọi phase" VÀO ĐÂY >>>

# Việc

Dịch sang tiếng Anh các thư mục bạn SỞ HỮU:

    src/lib/facebook, src/lib/content, src/lib/platforms, src/lib/dashboard,
    src/lib/release, src/app/content, src/app/targets, src/app/facebook,
    src/app/overview-alert-stack-parked.tsx,
    src/components/facebook, src/components/content, src/components/tiktok,
    src/components/layout, src/components/ui, src/proxy-matcher.test.ts

(164 chuỗi nguồn, 111 trong test)

Bốn mục cuối là phần vụn không thuộc thư mục nào của phase 1-4. Chúng ở đây để không file nào
bị bỏ sót — đừng bỏ qua chúng vì nhỏ.

PR trên nhánh feat/en-phase5-content-and-remainder.

# Chỗ cần cẩn thận

- lib/facebook (64 chuỗi) thuộc phạm vi ĐÃ RÚT từ 02/09. Dịch chuỗi của nó sang tiếng Anh
  KHÔNG phải là mở lại phạm vi. Không đụng ROLLOUT_PLATFORMS, không gỡ route đã gác.
- parkedPlatformMessage trong lib/platforms/rollout-scope.ts là câu từ chối người dùng đọc.
  Bản tiếng Việt hiện tại đã đúng sau phase F10 — dịch giữ nguyên đủ ba ý: không đăng được,
  chỉ xem lịch sử được, và đường quay lại kho nick.
- components/layout có parked-scope-banner.tsx, cùng lý lẽ trên.

# Việc cuối — quét sạch

Đây là phase cuối. Sau khi dịch xong, quét TOÀN BỘ src/ xác nhận không còn chuỗi tiếng Việt
nào ngoài comment. Nếu còn sót ở vùng của phase khác, ĐỪNG tự sửa — liệt kê vào PR để chủ
dự án mở một lượt dọn riêng.

# Đầu ra

PR kèm bảng Before → After, glossary bản cuối, số test, và danh sách sót (nếu có).
```

---

## Ghi chú cho người điều phối

**Vì sao phase 0 tách hẳn và đi trước:** nó đổi *hành vi*, năm phase sau chỉ đổi *chữ*. Trộn
hai loại vào một PR thì lúc review không phân biệt nổi chỗ nào là dịch, chỗ nào là đổi quyền —
và đó đúng là loại PR mà lỗi quyền trốn được.

**Vì sao chia theo thư mục chứ không theo màn hình:** để hai phase không bao giờ chạm cùng một
file. Đợt UX vừa rồi phải xếp thứ tự 1→2→3 vì phase 2 và 4 cùng sửa `accounts/[id]/page.tsx`.
Chia theo quyền sở hữu thư mục thì phase 2-5 chạy song song được.

**Lưới an toàn:** 1.578 chuỗi trong test assert nguyên văn. Dịch sót là đỏ ngay. Rủi ro thật
không phải sót — mà là **Codex nới test cho qua**. Luật chung đã cấm rõ; lúc review PR, xem
diff của file test trước diff của file nguồn.

**Chỗ cần bạn để mắt:**
- Phase 2 có thể lộ ra chuyện `ruleVerdicts` tiếng Việt đã lưu trong DB. Không có câu trả lời
  rẻ: dữ liệu cũ giữ nguyên ngôn ngữ cũ. Prompt yêu cầu báo cáo chứ không tự quyết.
- Phase 0 sẽ hỏi lại về `antidetectProfileId` — cùng loại ràng buộc với proxy nhưng chưa được
  chốt trong quyết định B.

**Câu hỏi chưa trả lời**

- `antidetectProfileId` có nên gác ADMIN như proxy không? Cùng là `@unique`, cùng là ràng buộc
  cụm. Phase 0 sẽ hỏi lại kèm dữ kiện.
- `PostJob.ruleVerdicts` đã lưu tiếng Việt trong DB xử lý ra sao — dịch lúc hiển thị, để
  nguyên, hay chấp nhận lẫn ngôn ngữ với dữ liệu cũ? Phase 2 sẽ hỏi lại.
- Buổi G4 vẫn chưa có người và ngày (tồn từ đợt UX trước, chưa liên quan phần dịch).

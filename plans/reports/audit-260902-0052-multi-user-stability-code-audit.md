# Audit code: đường dùng hằng ngày khi nhiều người chạy song song

**Ngày:** 02/09/2026 00:52 ICT
**Phạm vi:** MKTTool — Facebook Pages publisher, queue status transition, authorization tại các nút mọi người bấm
**Cách làm:** đọc source. Không dùng docs làm bằng chứng.
**Tiếp nối:** [audit-260902-0040-internal-team-readiness.md](audit-260902-0040-internal-team-readiness.md) (tầng vận hành)

> **Cập nhật 02/09/2026 01:10 — F1 và F2 ĐÃ SỬA** trên nhánh `release/consolidation-20260830`,
> chưa commit. Bản vá kèm test song song ở `post-job-concurrent-marking.database.test.ts`; test
> được kiểm chứng ngược (gỡ bản vá ra thì 5/5 đỏ với đúng con số của lỗi: Graph gọi 2 lần, 8 lượt
> song song đẻ 8 Interaction). Gate sau khi sửa: typecheck PASS, lint PASS, 1971/1971 test PASS.
> **F3 chưa động tới**, và lưới an toàn `@@unique` tầng DB chưa thêm — xem "Còn lại" cuối bài.

## Kết luận

Kiến trúc phân quyền **vững**. Đường ghi trạng thái bài đăng **có race**, và nó rơi đúng vào kịch bản "5-6 người dùng chung".

Cả hai lỗi dưới đây cùng một gốc: **đọc → kiểm → ghi không nguyên tử**, không lock, không conditional update, không ràng buộc DB.

---

## F1 (CAO) — Đăng đôi thật lên Fanpage

`src/lib/facebook/facebook-publish-action.ts:23-53`

```
job = findUnique(jobId)          // đọc
if (job.status !== "PENDING")    // kiểm
    return error
result = await publishToPage(…)  // GỌI GRAPH API — side effect ra ngoài
```

Giữa "kiểm" và "gọi" không có gì giữ chỗ. Hai người cùng bấm một job PENDING thì cả hai qua cửa, thành **hai bài thật trên Fanpage**. Cửa sổ race rộng bằng đúng thời gian gọi Graph API (hàng trăm ms đến vài giây), không phải vài microgiây.

Đăng đôi được vì hai điều kiện đồng thời có mặt:

- Tầm nhìn dùng chung — mọi người thấy job của mọi người (chủ ý, ghi ở mục 8 sổ tay vận hành).
- `publishJobToPage` **không** gọi `requireNickOwner`, nên operator nào cũng đăng được job FB của người khác (xem F3).

Chống double-click phía client là `disabled={pending}` (`facebook-publish-button.tsx:33`) — chỉ che **một tab của một người**. Không che hai người, hai tab, hay tab mở lại.

**Đáng nói:** file này chống đăng đôi rất kỹ ở hướng khác. Comment dòng 50-52 giải thích tại sao chỉ mỗi lời gọi Graph nằm trong `try`, để lỗi sau khi đăng không đẩy job về FAILED làm người dùng bấm lại. Nhánh `!marked.ok` còn hét hoa "ĐỪNG bấm đăng lại". Tức tác giả **đã nghĩ tới đăng đôi**, nhưng chỉ chặn đường tuần tự (bấm lại sau khi lỗi) và bỏ đường song song.

## F2 (CAO) — Ghi đôi Interaction, làm bẩn đúng dữ liệu bộ luật đếm

`src/lib/queue/post-job-mark-posted.ts:28-60`

```
job = findUnique(jobId)              // đọc
if (job.status === "POSTED") return  // kiểm
await prisma.$transaction([ … ])     // ghi
```

`$transaction` bao **các lệnh ghi**, không bao read+check. Và `update` là `where: { id: jobId }` — không kèm điều kiện status. Nên hai lượt chạy song song cùng qua cửa, cùng ghi.

Database không đỡ: `model Interaction` (`prisma/schema.prisma:461-478`) chỉ có `@@index([threadKey])`, **không có `@@unique` nào**. Hai row Interaction cho một bài đăng được nhận bình thường.

**Không cần hai người mới dính.** `daily-health-check-scheduler.ts` chạy theo `setInterval` (dòng 249) → `health-check-runner.ts:192` → `autoLinkDiscoveredPosts` → `markPostJobPosted` (`auto-link-discovered-posts.ts:77`). Bộ dò tự gán chạy song song với người đang bấm "Đã đăng". Một người dùng cũng đủ dính.

`auto-link-discovered-posts.ts:78-81` có xử lý `!written.ok` kèm comment *"Job vừa đổi trạng thái ở nơi khác giữa lúc dò"* — tác giả **biết** có tranh chấp ở đây. Nhưng nó dựa vào đúng phép kiểm không nguyên tử ở trên, nên chỉ bắt được trường hợp tuần tự.

Hậu quả không cosmetic. Interaction là đầu vào của bộ luật: luật chống đụng độ thread, tỷ lệ promo, hạn mức bài/ngày. Comment dòng 32-33 của chính file này viết: *"nhân đôi dấu vết làm bẩn chính dữ liệu mà bộ luật dựa vào để đếm."* Đúng thứ đang xảy ra được.

## F3 (VỪA) — `publishJobToPage` không kiểm chủ sở hữu, và không test nào khai ý định

Mọi đường chạm bí mật nick đều có `requireNickOwner`: `vault-credential-actions.ts:100`, `account-profile-actions.ts:69,185`, `account-first-login-actions.ts:49`. **Ranh giới quan trọng nhất giữ đúng.**

`publishJobToPage` thì không. Có thể chủ ý — Fanpage là tài sản chung của team, đăng qua Graph API, không đụng secret nick nào. Nhưng không có comment và **không có test nào** nhắc tới `publishJobToPage` (grep `*.test.ts` = 0 kết quả). Nên không phân biệt được "cố ý mở" với "quên đóng", và đây chính là điều kiện làm F1-với-hai-người thành khả thi.

---

## Điểm tốt (đã kiểm, không phải khen xã giao)

- **Gác quyền nằm ở chữ ký, không ở thân hàm.** `guardedAction`/`adminAction` bọc ngoài; `guarded-entry-points.test.ts` ép mọi export trong file `"use server"` phải có dạng đó. Viết `export async function` là test đỏ ngay, kể cả khi thân hàm có gọi `requireActor()`. Đây là cách đúng: biến "42 lần nhớ không quên" thành một quy tắc kiểm được.
- **`MANUAL_POST_PLATFORMS` suy ra bằng filter** thay vì khai tay danh sách thứ hai (`platform-family.ts:45-47`). Thêm đích mới chưa có bộ đăng tự động thì tự rơi vào "đăng tay" — mặc định an toàn.
- **`status` là String không phải enum**, nên thêm giá trị mới không cần migration. Tiện cho bản vá F1 bên dưới.

---

## Cách sửa

Chung một hình dạng: **giành chỗ trước rồi mới làm** (claim-then-act), thay cho đọc-kiểm-ghi.

**F1** — giành job bằng một lệnh nguyên tử trước khi gọi Graph:

```ts
const claimed = await prisma.postJob.updateMany({
  where: { id: jobId, status: "PENDING" },
  data:  { status: "PUBLISHING" },
});
if (claimed.count === 0) {
  return { ok: false, message: "Job vừa được người khác đăng hoặc đổi trạng thái." };
}
```

Rồi mới `publishToPage`. Thành công thì POSTED, lỗi thì FAILED. `status` là String nên `PUBLISHING` không cần migration — chỉ sửa comment liệt kê giá trị ở `schema.prisma:442` và các chỗ đọc status.

**F2** — bỏ read-check-write: đổi `update` thành `updateMany` có điều kiện status, đưa vào trong `$transaction`, kiểm `count` trước khi tạo Interaction. Kèm `@@unique([accountId, threadKey])` trên `Interaction` làm lưới an toàn tầng DB — nhưng kiểm dữ liệu hiện có trước, có thể đã có row trùng hợp lệ.

**F3** — quyết một lần rồi viết test khai ý định, dù quyết theo hướng nào.

Ước lượng: F1 + F2 nhỏ, gọn trong vài file. Cần test song song thật (chạy hai lời gọi đồng thời rồi đếm row), không phải test tuần tự.

---

## Còn lại sau bản vá F1+F2

- **F3 chưa động tới.** Cần chủ dự án quyết trước (cố ý mở hay quên đóng) rồi mới viết test khai ý định.
- **`@@unique([accountId, threadKey])`: RÚT LẠI — đề xuất này SAI, không được thêm.** Kiểm lại thì
  cùng một nick chạm nhiều lần vào một thread là hợp lệ **có chủ ý**: form ghi tương tác
  (`interaction-actions.ts`) cho ghi POST/COMMENT/UPVOTE lên bất kỳ thread nào, và luật 8 loại trừ
  thẳng nick của chính mình (`rule-context-queries.ts:132` — `accountId: { not: accountId }`), kèm
  comment giải thích *"trả lời dưới bài của chính mình là chăm sóc khách hàng"*. Thêm ràng buộc đó
  là chặn đúng việc đó. `@@unique([accountId, threadKey, kind])` cũng sai nốt: trả lời hai người
  bình luận là hai COMMENT cùng thread.

  Thứ cần duy nhất một là **dấu vết tự ghi của một job**, và khóa đúng của nó là `jobId` chứ không
  phải thread — `Interaction` hiện không có cột đó. Muốn có lưới DB thì phải thêm
  `jobId String? @unique` (NULL cho tương tác ghi tay, Postgres cho phép nhiều NULL), kèm migration,
  và nhân tiện làm đường gỡ chính xác hơn: `post-job-revert.ts` đang dò lại dấu vết bằng chuỗi
  `note` + threadKey. Theo YAGNI thì chưa cần: cập nhật có điều kiện đã chặn race và có test chứng
  minh. Ghi lại đây để lần sau không ai thêm nhầm ràng buộc.
- **Chưa quét production xem race đã nổ thật chưa.** Query bị chặn ở phiên này (xem câu hỏi 2).

## Chưa đụng tới ở tầng này

Rule engine đúng/sai, vault crypto implementation, ticket signing & replay, input validation, toàn bộ MKTBrowser source.

## Câu hỏi chưa trả lời

1. F3 cố ý hay quên? Fanpage dùng chung thì mở là hợp lý — cần chủ dự án xác nhận để viết test cho đúng hướng.
2. Đã ai thấy bài đăng đôi trên Fanpage, hay Interaction trùng chưa? Nếu rồi thì F1/F2 đã xảy ra thật chứ không còn là lý thuyết. Query kiểm: đếm `Interaction` nhóm theo `accountId` + `threadKey`, lấy nhóm > 1.
3. `HEALTH_CHECK_DAILY_AT` đang đặt mấy giờ trên production? Trùng giờ team làm việc thì cửa sổ F2 rộng hơn nhiều.

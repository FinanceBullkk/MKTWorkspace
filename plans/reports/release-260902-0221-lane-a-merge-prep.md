# Release Lane A — PR #44

**Ngày:** 02/09/2026 02:21 ICT, cập nhật 04:10 sau khi merge
**Trạng thái:** **ĐÃ MERGE, ĐÃ DEPLOY, ĐÃ VERIFY.** Chủ dự án bấm merge lúc 03:01 ICT.
**Runbook:** [deployment-guide.md](../../MKTTool/docs/deployment-guide.md) mục "Consolidation release procedure"

## Kết quả sau merge (bước 4-5)

| Hạng mục | Kết quả |
|---|---|
| Merge commit | `7d58f9fa11370a3d87667d06a573fe14e18fa7e6`, 2026-09-01T20:01:17Z |
| Deployment mới | `ffd193db-f27e-4f4a-90d0-fa03edc3be5d`, branch `master`, RUNNING |
| Commit đang chạy | `7d58f9fa…` — khớp merge commit |
| CI master | run `33552869681` **success** 5m04s; `check`, `contracts`, `secret-scan`, `deploy-verification` đều xanh (`relay-executable` skipped trên master) |
| `/api/healthz` | HTTP 200, `ok:true`, `status:"ready"`, database/releaseMetadata/r2 đều `ok`, `relayVersion 16` |
| Full GET `/v16` | HTTP 200, **33.342.752 bytes** khớp, **SHA-256 `5c98cf46…842e` khớp chính xác** |

**Điểm đáng giá nhất của lần release này:** `deploy-verification` chỉ chạy trên `master`, nên đây là
lần đầu nó thực sự chạy sau khi pipeline rời self-hosted. Nó xanh — cổng CI của master lại hoạt động
đúng chính sách `AGENTS.md`. Trước merge, master còn trỏ cả 5 job vào self-hosted.

## Rollback tuple (bước 3 — ghi TRƯỚC khi merge)

Đo bằng `railway status --json` lúc 02:18 ICT 02/09/2026:

| Trường | Giá trị |
|---|---|
| Deployment đang chạy | `0a696033-b610-492c-b75a-3e918cca102a` |
| Commit | `2734e2f0ba9c2a2f9c3731a44540c01d263b36e2` |
| Nhánh | `master` |
| Instance | `add68ab3-d21f-4d3e-a6b3-9fac3ab28cb2` RUNNING |
| Tạo lúc | 2026-08-30T19:38:51Z |
| Image digest | `sha256:e85af259aa1868774e9a47f47bb4a14c2d14fd0f8e6234f61fccac14fc0ee7e3` |

Đây là mục tiêu rollback của riêng lần release này. Đừng chép sang lần sau — luôn hỏi lại
`railway status`.

## Tiền đề đã đạt

| Bước | Kết quả |
|---|---|
| 1. Cây sạch, CI xanh | Tree sạch. PR #44: `check`, `contracts`, `secret-scan`, `relay-executable` đều SUCCESS; `deploy-verification` SKIPPED (job chạy sau merge) |
| 2. Backup production | `data/backups/mkttool-prod-20260902-021956.sql`, 66.897 bytes (gitignore) |
| 2. Restore verify | **verdict PASS**, mismatches **0**, cleanup **PASS**, vào database dùng-một-lần |
| 3. Rollback tuple | ghi ở trên |
| 4. Merge | **CHƯA LÀM** |

**Không có migration mới**: `git diff origin/master...origin/release/consolidation-20260830 -- prisma/migrations`
trả về rỗng. Deploy này không đổi được cấu trúc database, nên rủi ro giới hạn ở tầng code và
rollback bằng tuple ở trên là đủ.

## Nội dung vào master (7 commit)

```
9707c90 docs(runbook): name the CI jobs the release gate actually requires
0da37ff docs: withdraw Reddit and Facebook from the team rollout scope
28d7f70 fix(queue): stop concurrent publishes from double-posting
1318ace test(ci): require GitHub-hosted runners instead of the self-hosted pool
618aa9d ci: move the pipeline from self-hosted runners back to GitHub-hosted
6a6764a docs(agents): defer to the workspace standing authorization
a27fc4d docs(release): record Lane A conditional go
```

Giá trị chính: **`origin/master` hiện vẫn trỏ CI vào `[self-hosted, Linux/Windows, X64]` cả 5 job**,
trái với chính sách hiện hành trong `AGENTS.md` ("no job targets a self-hosted runner"). Bản sửa nằm
trong PR này. Chừng nào chưa merge, cổng CI của master còn lệch chính sách.

## Việc còn lại

```bash
cd E:/MKTWorkspace/MKTTool
gh pr merge 44 --merge
```

Sau merge, kiểm từ ngoài (runbook bước 5) — merge chính là deploy:

```bash
railway status --json          # xác nhận deployment mới + commitHash
curl -s https://mkttool-web-production.up.railway.app/api/healthz
```

`/api/healthz` phải trả HTTP 200 với `ok:true`, `status:"ready"`, database/release checks, Relay
v16. Kèm một lượt GET đầy đủ `/api/relay/download/v16` có ủy quyền, khớp đúng size và SHA-256 —
HEAD không đủ.

## Ghi chú lệch runbook

- Runbook bước 1 vẫn viết *"Require the exact self-hosted CI jobs to be green"*. Câu này đã cũ:
  pipeline chuyển sang GitHub-hosted từ 01/09, và chính PR này mang bản sửa đó. Nên sửa câu trong
  runbook sau khi merge.
- Runbook bước 1 dặn giữ `AGENTS.md` ngoài staging. PR #44 có sẵn commit `6a6764a` đụng `AGENTS.md`
  từ trước phiên này; không gỡ ra vì gỡ phải viết lại lịch sử đã push.

## Hai quyết định (chủ dự án ủy quyền 02/09/2026)

**1. Sửa runbook: LÀM NGAY, gộp vào chính PR này** thay vì để sau merge. Commit `9707c90`. Gộp vào
vì PR chưa merge — một lượt CI và một lượt merge, thay vì mở PR thứ hai cho một dòng chữ. Câu cũ
đòi "green self-hosted CI jobs", tức là bảo người đọc đi tìm một runner pool không còn phục vụ repo
này nữa. Câu mới gọi tên bốn job thật (`check`, `contracts`, `secret-scan`, `relay-executable`),
ghi rõ `deploy-verification` SKIPPED trước merge là đúng chứ không phải thiếu, và nói thẳng: thấy
self-hosted trong báo cáo là file workflow cũ, không phải một lượt pass.

**2. Backup: GIỮ tới khi verify xong deploy, RỒI XÓA.** Không xóa bây giờ — nó đang là bảo hiểm
rollback của chính lần release này, xóa trước khi deploy được xác nhận là làm ngược. Xóa ngay sau
bước 5 vì lúc đó nó hết nhiệm vụ, và để một bản dump kho danh tính production nằm cùng thư mục với
`.env` (nơi giữ `VAULT_KEY_SERVER`) đúng là cặp mà script cảnh báo: có bản sao lại có luôn chìa.
Muốn giữ lâu hơn thì chép ra ổ rời rồi xóa bản trên máy, đừng để nguyên tại chỗ.

**Đã thực thi 04:10 ICT:** `mkttool-prod-20260902-021956.sql` (66.897 bytes) đã xóa sau khi verify
xong bước 5.

### Phát hiện kèm theo — 12 dump production khác vẫn nằm đó

Lúc xóa mới thấy `MKTTool/data/backups/` còn **24 file, trong đó 12 file `mkttool-prod-*.sql`** từ
06/08/2026 tới nay. Tổng chỉ 1,5 MB nên đây không phải chuyện dung lượng — đây là chuyện phơi nhiễm:
mỗi file là một bản kho danh tính production, nằm cùng máy với `.env` đang giữ `VAULT_KEY_SERVER`.
Đúng cặp mà `backup-database.ts` cảnh báo, nhân lên 12 lần.

**Chưa xóa file nào trong số đó** — chúng có trước phiên này, xóa bản sao lưu của người khác là thao
tác không đảo lại được và không nằm trong phần được giao. Đề nghị: giữ 1-2 bản gần nhất, chép ra ổ
rời, xóa phần còn lại trên máy. Cần quyết định của chủ dự án.

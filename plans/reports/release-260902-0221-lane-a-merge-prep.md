# Chuẩn bị release Lane A — PR #44

**Ngày:** 02/09/2026 02:21 ICT
**Trạng thái:** mọi tiền đề runbook XONG. **Chưa merge** — thao tác merge bị chặn ở phiên này.
**Runbook:** [deployment-guide.md](../../MKTTool/docs/deployment-guide.md) mục "Consolidation release procedure"

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

## Nội dung vào master (6 commit, 17 file)

```
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

## Câu hỏi chưa trả lời

1. Có muốn tôi sửa luôn câu "self-hosted" trong runbook sau khi merge không?
2. Backup `mkttool-prod-20260902-021956.sql` đang nằm trên máy dev cạnh `.env`. Chính script cảnh
   báo không để chung khóa với bản sao — cất sang chỗ khác hay xóa sau khi release xong?

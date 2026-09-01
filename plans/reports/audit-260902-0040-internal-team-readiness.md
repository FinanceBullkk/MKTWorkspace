# Audit: ready to roll cho team nội bộ?

**Ngày:** 02/09/2026 00:40 ICT
**Phạm vi:** workspace `E:/MKTWorkspace` — MKTTool (Web) + MKTBrowser (desktop)
**Cách làm:** chạy gate thật tại máy + probe production + đọc config Railway. Không lấy claim trong docs làm bằng chứng.

## Kết luận

**Ready một nửa.**

- **Lane A — MKTTool Web/Facebook: DÙNG ĐƯỢC NGAY** cho pilot nội bộ có admin dẫn. Production sống, auth chặn đúng, gate local xanh (trừ 1 test, xem B1).
- **Lane B/C — MKT Browser + Relay: CHƯA.** Không phải "sắp xong" — operator mới **không tải nổi installer**: production không có biến cấu hình để phục vụ file. Chặn ở tầng config, không chỉ ở tầng docs.

## Bằng chứng tự kiểm (không phải trích docs)

| Hạng mục | Kết quả | Cách đo |
|---|---|---|
| Production alive | `200`, `status: ready`, db/releaseMetadata/r2 đều `ok`, `relayVersion 16`, 1.09s | `GET /api/healthz` lúc 00:41 |
| Auth gating | `/accounts` → `307` login; `/api/setup/windows-installer` → `401` | curl không auth |
| Deployed commit | master HEAD `2734e2f` = commit docs khai đang chạy | `git log origin/master` |
| CI master | xanh, run `33331455853` | `gh run list` |
| MKTTool typecheck | **PASS** | `npm run typecheck` |
| MKTTool lint | **PASS**, 0 warning | `npm run lint` |
| MKTTool test | **1965/1966 pass, 1 FAIL** | `npm test`, 216 file, 133s |
| MKTBrowser typecheck | **PASS** | `npm run typecheck` |
| MKTBrowser CI | xanh, run `33527980307` (01/09) | `gh run list -R Techieslab-app/MKTBrowser` |
| Browser installer trên prod | **không phục vụ được** — thiếu cả `MKT_BROWSER_INSTALLER_PATH` lẫn `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` | `railway variables --service mkttool-web` (39 biến) |
| Vault hai vùng khóa | `VAULT_KEY_SERVER` có, `VAULT_KEY_OPERATOR` **vắng trên server** — đúng thiết kế: chiếm server không mở nổi mật khẩu/TOTP nick | như trên |
| Job định kỳ | `BACKUP_DAILY_AT`, `HEALTH_CHECK_DAILY_AT` đã đặt | như trên |
| Allowlist | `ALLOWED_EMAILS` + `ADMIN_EMAILS` đặt, enforce ở `src/lib/auth/allowed-emails.ts` | grep + env |

## Blockers

### B1 — Test guard đỏ trên nhánh release, CI chưa hề chạy để phát hiện
`scripts/critical-coverage-config.test.ts:70` bắt CI **không** được dùng `ubuntu/windows-latest`, đòi đúng 5 job self-hosted. Nhưng `618aa9d` (01/09 18:14) đã chuyển `ci.yml` về GitHub-hosted — 5 job đều `*-latest`. Test và ci.yml mâu thuẫn trực tiếp.

Nguy hiểm ở chỗ **chưa ai thấy**: `ci.yml` chỉ trigger `push: [master, main]` + `pull_request`. Nhánh `release/consolidation-20260830` đã push nhưng không phải master và chưa mở PR → CI MKTTool lần cuối chạy 30/08. Đỏ này sẽ nổ vào lần merge tới, không phải bây giờ.

Đây là hệ quả trực tiếp của việc đảo policy trong `AGENTS.md` (self-hosted → GitHub-hosted) mà không sửa guard test viết theo policy cũ.

**Sửa:** 1 dòng — đổi assertion trong test cho khớp 5 job GitHub-hosted. Không phải lỗi sản phẩm.

### B2 — Không có cảnh báo. Production sập thì không ai được báo
Không tìm thấy alerting, uptime monitor, webhook, hay kênh notify nào trong `scripts/`, `src/lib/monitoring`, hay runbook. `HEALTH_CHECK_DAILY_AT` là health check **của nick**, không phải của service. Sự cố 503 hôm 30/08 phát hiện thủ công. Giao cho 5-6 người mà không có báo động nghĩa là lần sập tới cũng phát hiện bằng cách có người kêu.

### B3 — Fleet Relay lệch phiên bản
`MIN_RELAY_VERSION = 13` (`src/lib/tickets/ticket-types.ts:54`) trong khi bản hiện tại là v16. Sàn giữ ở 13 vì máy owner thứ hai chưa cài lại và chưa quan sát được. Mới có 1/2 máy lên v16. Chưa xong migration của 2 máy đã biết thì chưa nên thêm máy lạ.

### B4 — Onboarding cho người lạ chưa từng diễn tập
Gate `G4 second PC/operator` OPEN: chưa có ai ngoài owner cài từ máy sạch. Docs tự khai còn thiếu ảnh chụp màn hình hộp xin quyền firewall — đúng chỗ người mới sẽ kẹt khi ngồi một mình. Với team 5-6 người thì đây là rủi ro thật, không phải formality.

### B5 — Lane Browser: gate identity FAIL, không phải OPEN
`G2-IDENTITY` **FAIL** vì đo được đụng độ font/audio/WebGL. Lane C CLOSED, không có kênh CloakBrowser, không có ngày. Nghĩa là: browser lane không "đang chờ", nó **đã dừng** ở hình dạng sản phẩm hiện tại. Đừng hứa với team là sắp có.

## Nhiễu nên dọn
Workflow `Windows Technical Build` của MKTBrowser chạy theo lịch trên nhánh `main` — nhánh không tồn tại — nên fail mỗi đêm trong 5-6 giây (`33449616469`, `33337676403`). Failure thật sẽ lẫn vào đống fail giả này.

## Team làm được gì hôm nay

**Được:** kho nick + proxy + gán chủ sở hữu; hàng đợi & lịch đăng; đèn luật an toàn; dò shadowban/karma; **đăng Fanpage Facebook bằng Graph API** (không mở browser, không cần proxy/profile — đây là workflow trơn nhất).

**Đăng tay, công cụ chỉ ghi sổ:** Reddit. Tự đăng Reddit là GĐ5 luồng A, **chưa bắt đầu**.

**Không được:** TikTok (chỉ có setup account/profile; content/lịch/warmup/posting parked — `TARGET_PLATFORMS` chỉ có `REDDIT`, `FACEBOOK_PAGE`, `FACEBOOK_GROUP`); mọi automation không người ngồi; bất kỳ luồng nào cần MKT Browser.

## Khuyến nghị

1. Sửa B1 trước mọi merge. Rẻ, và đang chặn đường ra master.
2. Dựng uptime monitor bên ngoài trỏ `/api/healthz` + 1 kênh báo (B2). Rẻ nhất trong danh sách, rủi ro cao nhất nếu bỏ.
3. Roll Lane A cho team **chỉ với Facebook Pages + ghi sổ Reddit tay**. Nói rõ ranh giới, đừng để ai suy ra là có browser.
4. Xong máy owner thứ hai lên v16 rồi mới nâng sàn Relay (B3).
5. Diễn tập cài từ máy sạch với đúng 1 người không phải owner, quay màn hình, lấp chỗ thiếu ảnh trong docs — trước khi mời người thứ 5-6 (B4).
6. Sửa trigger scheduled workflow của MKTBrowser về nhánh có thật.

## Câu hỏi chưa trả lời

1. Team dự định dùng ngay cái gì? Nếu kỳ vọng là Reddit/TikTok automation thì câu trả lời là chưa, và khoảng cách lớn — không phải vài ngày.
2. Nhánh `release/consolidation-20260830` (3 commit docs/ci chưa merge) định merge tiếp hay dừng ở đây? Ảnh hưởng độ gấp của B1.
3. `MIN_RELAY_VERSION` giữ 13 tới bao giờ — có deadline cho máy owner thứ hai không?
4. Ai trực khi production sập? B2 giả định có người, docs không nói ai.

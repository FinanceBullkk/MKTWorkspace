# Phase 03 — Rescope nav: gác Facebook / Reddit / pipeline

**Ưu tiên:** P1 · **Trạng thái:** chưa bắt đầu

## Nguyên tắc: gác ≠ xóa

Route và lib giữ nguyên trên đĩa. Chỉ rút khỏi nav. Chi phí bằng 0, và giữ được đường quay lại
khi Reddit/FB sống lại. Xóa file là mất `git blame` của 4 phase đã làm xong.

## Bảng phân loại 11 route

| Route | Quyết định | Lý do |
|-------|-----------|-------|
| `/` | **Nhà** | Constellation = danh sách profile |
| `/accounts/[id]` | **Giữ** — vào từ tile | trang chi tiết nick, vault, readiness |
| `/accounts` (list) | Gộp vào `/` | trùng chức năng với Constellation |
| `/proxies`, `/proxies/[id]` | **Giữ + nav** | proxy chết = nick chết, dùng hằng tuần |
| `/relay-devices` | **Giữ + nav** | ghi/thu hồi máy — Gemini bỏ nhầm, đây không phải pipeline |
| `/setup` | **Giữ + nav** | onboarding máy mới |
| `/relay-download` | Giữ (redirect → `/setup`) | đã gộp ở commit `5f44936` |
| `/health` | **Gác** | đo karma Reddit qua observer proxy; TikTok không có karma |
| `/queue`, `/queue/new` | **Gác** | pipeline đăng bài |
| `/content`, `/content/[id]` | **Gác** | pipeline |
| `/targets`, `/targets/[id]` | **Gác** | đích đăng Reddit/FB |
| `/facebook` | **Gác** | Graph API Fanpage |

## Nav = 4 mục (không phải 3)

```
🎬  Kênh        /                 ← nhà
🔌  Proxy       /proxies
💻  Máy         /relay-devices    ← Gemini bỏ nhầm mục này
⚙️  Cài đặt     /setup
```

Bản Gemini còn 3 mục và làm `/relay-devices` mất lối vào — trong khi đó là nơi duy nhất
thu hồi được một máy bị mất.

## Việc

1. `LeftRail.tsx` — 4 mục, icon `Boxes / Plug / MonitorSmartphone / Settings`
2. **Xóa** `src/components/layout/primary-nav.tsx` — đã không còn ai import, là code chết
   (đây là ca duy nhất nên xóa thật)
3. Route bị gác: thêm banner một dòng đầu trang
   *"Đang tạm gác — Reddit/Facebook không nằm trong phạm vi TikTok hiện tại."*
   Route vẫn vào được bằng URL, không 404.
4. `collect-ops-alerts` / nguồn cảnh báo — lọc theo phạm vi:

   | Alert | TikTok | |
   |-------|--------|-|
   | `brokenProxies` | ✅ giữ | proxy chết là rủi ro số 1 |
   | `clusterWarnings` | ✅ giữ | bất biến 1 nick = 1 proxy |
   | `backupWarning` | ✅ giữ | mất vault là mất sạch |
   | `needsAttention` | ✅ giữ | đọc từ `describeAccountReadiness()` |
   | `duplicatePostedUrls` | ⏸ gác | pipeline |
   | `suspectPostedUrls` | ⏸ gác | pipeline |
   | `tokenWarnings` | ⏸ gác | token Facebook |
   | `healthWarning` | ⏸ gác | health check Reddit |
   | `blockedJobCount` | ⏸ gác | hàng đợi |

5. Sau khi lọc, các module chỉ phục vụ phần gác (`overview-page-data.ts`,
   `posting-loop-strip.tsx`, `manual-post-reminders.tsx`, `overview-alert-stack.tsx`)
   thành mồ côi — **để nguyên**, đánh dấu `@parked` trong chú thích đầu file.

## Xong khi

- 4 mục nav, mỗi mục có active state nhìn thấy được
- Không route nào 404; route gác có banner
- `grep -rn "PrimaryNav" src/` không ra kết quả

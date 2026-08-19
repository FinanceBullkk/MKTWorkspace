# Rescope UI về TikTok-only + sửa hồi quy bản redesign

**Ngày:** 19/08/2026 · **Nhánh:** master · **Trạng thái:** P0 xong, còn P1–P2

## Bối cảnh

Bản redesign (Gemini, chưa commit — 9 file sửa, 8 file mới) đổi MKTTool từ shell sáng/nhiều
trang sang shell tối một trang kiểu "console profile". Hướng đúng với pivot TikTok, nhưng
được làm bằng cách **gỡ bỏ** thay vì **rescope**, và mắc một lỗi chặn: nút chính không chạy.

Quyết định mới (19/08): **tạm gác Facebook, Reddit, và pipeline đăng bài.** Sản phẩm còn lại
là kho danh tính + mở profile antidetect qua relay.

## Phát hiện chặn

`accountCreateSchema` khai `platform: z.enum(["REDDIT","FACEBOOK"])`.
Sheet mới POST `platform="TIKTOK"` → zod chặn → **không tạo được profile nào.**
Cả domain (`platformFamily`, `validatePlatformAccountFields`, `account-readiness`) chưa biết TIKTOK.

## Phase

| # | Phase | Ưu tiên | File |
|---|-------|---------|------|
| 01 | ✅ Mở đường cho TIKTOK trong domain | P0 chặn | [phase-01](phase-01-tiktok-in-domain-model.md) |
| 02 | ✅ Bịt rò dữ liệu + khay cảnh báo | P0 | [phase-02](phase-02-auth-boundary-and-alerts.md) |
| 03 | Rescope nav — gác FB/Reddit/pipeline | P1 | [phase-03](phase-03-nav-rescope.md) |
| 04 | Flow người dùng + layout | P1 | [phase-04](phase-04-user-flow-and-layout.md) |
| 05 | Font, UI chết, a11y | P2 | [phase-05](phase-05-polish.md) |

## Nguyên tắc xuyên suốt

1. **Gác ≠ xóa.** Route và lib của FB/Reddit/pipeline giữ nguyên trên đĩa, chỉ rút khỏi nav.
   Xóa là mất `git blame` và mất đường quay lại.
2. **Không dựng phép chấm thứ hai.** `describeAccountReadiness()` đã tính đủ blocker
   (NO_PROXY, NO_PROFILE, NOT_LOGGED_IN, NO_DEVICE, DEVICE_REVOKED, PROXY_BROKEN,
   COLD_START, CLUSTER_DRIFT). UI mới phải ĐỌC nó, không tự nghĩ trạng thái mới.
3. **Không hiển thị số bịa.** `Relay v15` hardcode, `139.4 MB` hardcode, `running: 0 // dynamic`
   — đều phải là dữ liệu thật hoặc không hiện.
4. **Bất biến 1 nick = 1 proxy = 1 vân tay** do DB ép, giữ nguyên cho TikTok.

## Kiểm chứng đã làm

- `npx tsc --noEmit` → sạch
- `npx vitest run` → 199 file / 1848 test pass (nhưng **không** phủ trang nào — xem phase-01)
- Playwright screenshot `/login` @1440 và @390
- `document.fonts` + `InstalledFontCollection` → Space Grotesk / JetBrains Mono không tồn tại

## Câu hỏi chưa chốt

1. ~~TikTok là platform mới hay single-platform?~~ **Đã chốt 19/08: platform thứ ba.**
2. Có giữ `/health` (dò shadowban) không? Cơ chế hiện tại đo karma Reddit qua observer proxy —
   TikTok không có karma. Plan này gác `/health`.
3. "Running" có cần thật không? Hiện **không có** model nào lưu phiên đang mở.
   Muốn có thì phải thêm state từ relay — ngoài phạm vi plan này.

---

## Dọn code 19/08/2026 (sau khi chốt TikTok = platform thứ ba)

Gemini viết song song vào cùng working tree lúc 11:30–11:32. Đã tiếp quản, dọn xong:

| Việc | Kết quả |
|------|---------|
| `src/lib/warmup/` (1339 dòng, bot nuôi nick tự động) | → `parked/warmup-260819/`, xem `parked/README.md` |
| `tiktok-profile-console.tsx` + `tiktok-profile-row.tsx` | xóa — bản nháp bị `mktbrowser-ui/` thay thế, không ai import |
| `primary-nav.tsx` | xóa — mồ côi từ lúc `layout.tsx` chuyển sang `AppShell` |
| Chuỗi prop `currentUserId` / `isAdmin` (4 file) | gỡ — đi lòng vòng mà không nơi nào đọc; `src/proxy.ts` mới là chỗ gác trang |
| `ringColor`, 6 icon lucide thừa, `onCmdK` trong TopBar | gỡ |
| `proxy-bulk-actions.ts` | viết lại — xem dưới |
| `tsconfig.json`, `eslint.config.mjs` | loại trừ `parked/` |

### `proxy-bulk-actions.ts` — ba giá trị bịa

Bản Gemini gọi thẳng `prisma.proxy.create()`, bỏ qua `proxyCreateSchema`, và đặt cứng cho mọi dòng:

- `type: "MOBILE_4G"` — cột là `String` nên **ghi được**, trong khi kho chỉ hiểu `STATIC_ISP` / `MOBILE`
- `country: "VN"` — quyết định ngôn ngữ + múi giờ **vân tay**; IP Mỹ đội vân tay VN
- `protocol: "http"` — proxy socks5 bị ghi sai giao thức
- `catch {}` rỗng, rồi báo `"Đã import thành công N/M"` kể cả khi N = 0

Nay đi qua schema; ba cột đó là **tham số của lô** do người dán khai (form có 3 ô mới);
mỗi dòng hỏng được kể kèm số dòng. +10 test ở `proxy-bulk-actions.database.test.ts`.

### Trạng thái

`tsc` sạch · `eslint` sạch · **1878 test pass** (từ 1848 → +30)

### Chưa commit

Toàn bộ còn ở working tree. Cần chốt cách chặn Gemini viết chồng trước khi làm tiếp.

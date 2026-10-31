# Phase 01 — Mở đường cho TIKTOK trong domain model

**Ưu tiên:** P0 (chặn) · **Trạng thái:** ✅ XONG 19/08/2026

## Vấn đề

Sheet mới POST `platform="TIKTOK"`, nhưng:

| Nơi | Hiện tại | Hệ quả |
|-----|----------|--------|
| `vault-form-schemas.ts:252` | `z.enum(["REDDIT","FACEBOOK"])` | **Tạo profile TikTok luôn fail** |
| `platform-family.ts:9` | `PLATFORM_FAMILIES = ["REDDIT","FACEBOOK"]` | `platformFamily("TIKTOK")` rơi xuống trả về chính chuỗi đó |
| `vault-form-schemas.ts:221-237` | REDDIT → bắt proxy; còn lại → bắt password | TIKTOK rơi nhánh else, bị **bắt password** như Facebook |
| `schema.prisma:228` | `// REDDIT \| FACEBOOK` | comment sai |
| `launch/route.ts:101` | Nới điều kiện riêng cho FACEBOOK | TIKTOK dùng nhánh chặt — đúng, giữ nguyên |

## Vì sao test xanh mà vẫn hỏng

1848 test pass vì chúng test **lib**, không test **page/action đầu-cuối**. Không có test nào
dựng `FormData` với `platform=TIKTOK` rồi gọi `createAccount`. Đây là lỗ hổng cần bịt,
không phải test thừa.

## Việc

1. `src/lib/platforms/platform-family.ts`
   - thêm `"TIKTOK"` vào `PLATFORM_FAMILIES`
   - `platformFamily()`: thêm `if (platform === "TIKTOK") return "TIKTOK";`
   - **không** thêm vào `TARGET_PLATFORMS` / `COMMUNITY_PLATFORMS` / `AUTO_PUBLISH_PLATFORMS` —
     TikTok không phải đích đăng của pipeline đang gác
2. `src/lib/accounts/vault-form-schemas.ts`
   - `accountCreateBase.platform` → `z.enum(["REDDIT","FACEBOOK","TIKTOK"])`
   - `validatePlatformAccountFields()`: thêm nhánh TIKTOK **trước** nhánh Facebook —
     bắt buộc `proxyId` (giống Reddit), cho phép có password (nick TikTok có mật khẩu riêng),
     không bắt buộc lúc sửa
3. `prisma/schema.prisma:228` — sửa comment thành `// REDDIT | FACEBOOK | TIKTOK`.
   **Không cần migration** (cột đang là `String`).
4. `src/lib/accounts/account-readiness.ts` — kiểm lại `isRedditFamily()` (dòng 95):
   luật nào đang gắn với Reddit mà TikTok cũng cần (proxy bắt buộc) thì tách ra tên khác,
   đừng để TikTok mượn nhánh Reddit.

## Test phải viết

- `vault-form-schemas.test.ts`: `validatePlatformAccountFields("TIKTOK", {proxyId:""}, CREATING)` → có lỗi
- `vault-form-schemas.test.ts`: `("TIKTOK", {proxyId:"p1", passwordEnc:"v1.aa.bb.cc"}, CREATING)` → null
- `vault-create-account.database.test.ts`: tạo nick `platform:"TIKTOK"` → `ok:true`, đọc lại từ DB đúng
- **Test hồi quy:** một test dựng FormData từ sheet thật rồi gọi `createAccount`, để lần sau
  đổi enum mà quên form là test đỏ ngay

## Xong khi

- Bấm "Tạo Profile & Khởi tạo Môi trường" trên `/` tạo được bản ghi thật
- `npx vitest run` xanh, có test mới phủ đường TIKTOK

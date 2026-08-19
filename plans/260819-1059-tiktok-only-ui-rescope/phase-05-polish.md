# Phase 05 — Font, UI chết, a11y

**Ưu tiên:** P2 · **Trạng thái:** chưa bắt đầu

## 5.1 Font không bao giờ load

`globals.css:4-5` khai `Space Grotesk` / `JetBrains Mono`. Không có `next/font`, không có
`<link>`. Kiểm chứng: `document.fonts` chỉ chứa Geist của Next devtools;
`InstalledFontCollection` trên máy dev không có font nào trong hai. Toàn bộ nhận diện chữ
của bản redesign đang chạy bằng Segoe UI fallback.

**Sửa:** dùng `next/font/google` trong `layout.tsx`, gán biến CSS, trỏ `--font-sans` /
`--font-mono` vào đó. Self-host qua `next/font` chứ không `@import` từ CDN — máy operator
có thể không ra được Internet.

## 5.2 UI chết

| Thứ | Trạng thái | Sửa |
|-----|-----------|-----|
| Ô search TopBar | state không tới nơi lọc | phase-04 |
| Nút Cmd-K | `onCmdK={() => {}}` | bỏ, hoặc làm command palette thật |
| Tooltip phím tắt LeftRail | chưa có handler nào | bỏ, hoặc gắn hotkey thật |
| Chip "Running" = 0 | không có nguồn dữ liệu | phase-04 (bỏ) |
| `"139.4 MB"` hardcode | fallback ở `setup/page.tsx` | không đọc được size thì đừng hiện size |
| Ký hiệu `⌘` | app chỉ chạy Windows | đổi thành `Ctrl` |

## 5.3 a11y & layout

- `new-tiktok-profile-sheet.tsx` — `<label>` thiếu `htmlFor`, input thiếu `id`
- Sheet thiếu `role="dialog"` + `aria-modal="true"` + focus trap (Escape thì đã có)
- `ProfileTable` — `<th>` thiếu `scope="col"`
- `text-neutral-500` trên `#0a0b0f` ≈ 4.3:1, dưới ngưỡng AA 4.5 → dùng `neutral-400`
- Scroll lồng nhau: `main` có `overflow-y-auto`, `Constellation` bọc thêm một lớp nữa — bỏ một
- `/login` còn class light-mode (`bg-neutral-100` cho chip `ALLOWED_EMAILS` ra viên trắng
  trên nền đen); nội dung dồn lên đỉnh, chừa 2/3 màn trống → căn giữa dọc
- `body { overflow: hidden }` + `h-screen w-screen`: kiểm lại trên 1280×720 và khi zoom 150%

## Success criteria

- `getComputedStyle(document.body).fontFamily` phân giải ra font đã load thật
- Không còn nút hay phím tắt nào bấm vào mà không xảy ra gì
- Tab được hết form tạo profile bằng bàn phím

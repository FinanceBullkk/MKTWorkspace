# Audit chất lượng code — MKTTool + MKTBrowser

**Ngày:** 18/09/2026 · **Cách đo:** git ls-files + gate chạy thật hôm nay, không phỏng đoán

## Kết luận

**MKTTool: chất lượng cao bất thường. MKTBrowser: tốt, nhưng có nợ cấu trúc thật ở 5 file.**
Không có vấn đề chất lượng nào đủ lớn để chặn việc giao sản phẩm. Thứ chặn vẫn là các quyết định
đã ghi ở [audit hiệu quả sản phẩm](audit-260917-2004-product-effectiveness.md).

## Số liệu

| | MKTTool | MKTBrowser |
|---|---|---|
| Source (không tính test) | 41.006 dòng | 29.194 dòng |
| Test | 25.207 dòng (**0,61×**) | 8.988 dòng (**0,31×**) |
| File > 400 dòng | 7 | 16 |
| File lớn nhất (không test) | 502 | **2.980** |
| File ≤ 200 dòng | 278 / 333 (83%) | 105 / 142 (74%) |
| `@ts-ignore` / `@ts-expect-error` | **0** | **0** |
| `: any` | 1 | 5 |
| `TODO` / `FIXME` / `HACK` | **0** | 4 |
| Mật độ comment | 19% | 13% |
| `npm audit --omit=dev` | **0 lỗ hổng** | — |
| Gate chạy hôm nay | typecheck + lint sạch, **237 file / 2.226 test pass** | typecheck + lint sạch |

`strict: true` ở cả hai. 0 `@ts-ignore` trên ~70k dòng là chuyện hiếm — phần lớn codebase cùng cỡ
có hàng chục.

## 3 điểm đáng sửa

### 1. `ChromiumBrowserDriver.ts` — 2.980 dòng, **1 class, 45 method** (~66 dòng/method)

Cùng với `fingerprint.ts` (1.636), `mcp-server/server.ts` (1.423), `main/index.ts` (1.217),
`ChromiumBootstrap.ts` (1.056): **8.312 dòng = 28% source của Browser nằm trong 5 file.**

Không phải code kế thừa để đó: riêng file lớn nhất có 59 commit, đa số tháng 7-8/2026, tức nó vẫn
đang phình ra. Đây là nợ cấu trúc duy nhất trong workspace đáng gọi tên.

**Không phải "thiếu test"** — đã kiểm: các file này có test phủ, chỉ là test đặt tên theo *hành vi*
chứ không theo *module* (`browser-driver-shutdown`, `security-contract`, `runtime-contract`,
`license-driver-lifecycle-contract`...). Cách đặt tên đó tốt hơn; đừng đổi.

**Đề xuất:** không refactor một lượt. Tách theo trách nhiệm khi chạm tới (launch/lifecycle, proxy,
licence verdict, CDP). Một lượt tách lớn trên file đang là đường đi của mọi launch là rủi ro lớn hơn
chính món nợ.

### 2. ~18% source của MKTTool là scope đã rút khỏi rollout

| Vùng | Code | Test |
|---|---|---|
| `health` | 2.831 | 1.662 |
| `rules` | 1.365 | 1.432 |
| `queue` | 1.278 | 1.358 |
| `facebook` | 1.223 | 363 |
| Route `queue`/`facebook`/`targets`/`health` | 678 | — |

**Tổng ≈ 12.190 dòng** cho thứ không ai được dùng, nhưng mọi refactor vẫn phải giữ xanh và mọi lượt
test vẫn phải chạy (147 giây/lượt). Đây là cái giá của quyết định "rút scope nhưng giữ code".

Không đề xuất xoá — đó là quyết định của chủ dự án. Đề xuất: **quyết dứt khoát**. Giữ thì để yên và
chấp nhận giá; xoá thì xoá cả test cùng lượt. Lưng chừng là trạng thái đắt nhất.

### 3. Contract nhân đôi giữa hai repo, **không ai canh**

`MKT_BROWSER_ERROR_CODES` khai **độc lập** ở hai nơi:
`MKTTool/src/lib/antidetect/mkt-browser-contract.ts` và `MKTBrowser/packages/types/src/index.ts`.
Comment ở bản MKTTool ghi rõ "Mirrors the desktop contract's codes" — nhưng **không test nào so hai
danh sách**. `smoke-test-mkt-browser-contract.ts` là phép thử end-to-end cần Browser chạy thật, không
phải phép so tĩnh.

Hệ quả: thêm một mã ở Browser thì MKTTool âm thầm rơi vào nhánh "mã lạ → câu chung". **Hỏng an toàn**
(không sai kết quả), nhưng trôi mà không ai biết — và đúng lớp lỗi vừa phải sửa hôm 17/09.

**Đề xuất:** một test tĩnh ~30 dòng ở MKTTool đọc file types của Browser và so hai danh sách. Rẻ,
đóng đúng lỗ đang mở. Đây là việc duy nhất trong báo cáo này nên làm ngay.

## Làm tốt thật (đừng đổi)

- **Comment là biên bản quyết định, không phải chú thích cú pháp.** 19% dòng là comment, và chúng ghi
  *vì sao*, kèm ngày và sự cố có thật ("vấp thật 07/08/2026: cửa sổ Chromium hiện lên trong khi trang
  báo hỏng"). Đây là lý do một file chạm 400 dòng, và nó đáng.
- **Test canh biên giới.** `relay-import-boundary`, `guarded-entry-points`, `encrypted-field-registry`,
  `machine-clock-ban`: nhắm thẳng vào những kiểu hỏng không làm test nào đỏ. Hiếm codebase nào có.
- **Tỷ lệ test 0,61× ở MKTTool**, và test chạm Postgres thật thay vì mock.

## Câu hỏi chưa có lời đáp

- Reddit/Facebook/queue/health: giữ, xoá, hay bật lại? Chưa trả lời từ 17/09, và nó quyết định 18%
  diện tích bảo trì.
- Có nên đặt hạn mức dòng cho file ở MKTBrowser (lint rule) không, hay để quy ước tự điều tiết?

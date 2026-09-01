# Cách bắt đầu phiên thực thi

Mở một **phiên Codex mới** trong `E:\MKTWorkspace`. **Không** dán lại hội thoại cũ — plan đã chứa đủ
ngữ cảnh. Chỉ trỏ phiên mới vào file này và thư mục plan.

Mỗi phase là **một phiên riêng**. Đừng gộp hai phase vào một phiên: điểm dừng giữa các phase là chỗ
chủ dự án quyết có đi tiếp không, và gộp lại là bỏ qua đúng cái quyết định đó.

## Tin nhắn đầu tiên — phase 01

```text
Execute phase 01 of the fingerprint acceptance-gate plan.

Read first:
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\plan.md
- E:\MKTWorkspace\plans\260902-0544-fingerprint-gate-and-brave-spike\phase-01-acceptance-gate-specification.md
- E:\MKTWorkspace\plans\reports\decision-260902-0530-fingerprint-engine-path.md

Phase 01 is a specification task. Write MKTBrowser/docs/fingerprint-acceptance-gate.md defining the
three separate criteria (consistency, no joint-tuple collision within a 3-5 profile pool, cohort
plausibility measured against stock Chrome/CFT on the same machine).

Hard boundaries for this session:
- Do NOT run any browser engine, do NOT measure anything, do NOT touch the CloakBrowser seat.
- Do NOT weaken or remove the existing G2-IDENTITY gate. The new gate runs in parallel as an
  experimental gate only.
- Do NOT modify MKTBrowser source. Read the existing harness at
  MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs only to record what it does not cover.

Stop when the specification exists and the phase-01 todo list is complete. Write a short report
into the plan's reports/ directory. Do not start phase 02.
```

## Ngữ cảnh phải nói rõ cho Codex, kẻo nó đi nhầm hướng

Codex đọc `AGENTS.md` và có standing authorization, nên nó **sẽ** tự commit/push. Điều nó không tự
biết là **vì sao các đường khác đã đóng** — nếu không nói, nó rất dễ đề xuất build Chromium hoặc vá
native, đúng hai thứ vừa bị loại.

Bốn ràng buộc chốt ngày 02/09/2026, đã ghi trong plan nhưng nên nhắc lại nếu nó đi chệch:

| Ràng buộc | Hệ quả |
|---|---|
| Không ai viết được C++ Chromium/Blink | Không vá native. Không PoC, không sản phẩm hoá |
| Không có máy >16 GiB RAM khả dụng | Không build từ nguồn |
| Không có ngân sách, chỉ dùng được thứ miễn phí | Không đổi vendor. Brave/Camoufox vì chúng free |
| Pool 3-5 profile, một profile tại một thời điểm | Bài toán nhỏ hơn hẳn giả định tháng 8 |

Nếu Codex đề xuất bất cứ việc gì cần build Chromium hoặc viết C++, đó là dấu nó chưa đọc
`decision-260902-0530-fingerprint-engine-path.md`. Bắt đọc lại trước khi đi tiếp.

## Thứ tự phiên

| Phiên | Phase | Chạm engine? | Chạm seat Cloak? |
|---|---|---|---|
| 1 | 01 — đặc tả gate | không | không |
| 2 | 02 — đo lại Cloak | có | **có, xem kỷ luật seat** |
| 3 | 03 — Brave lifecycle | có (Brave) | không |
| 4 | 04 — Brave danh tính | có (Brave + stock Chrome) | không |
| 5 | 05 — Go/No-Go | không | không |

## Kỷ luật seat cho phiên phase 02

Chỉ có **một seat** CloakBrowser và **không có ngân sách** để mua thêm. Nhắc thẳng vào prompt của
phiên đó:

- Gom mọi phép đo vào **một lượt liên tục**. Không mở lại profile vì quên ghi số.
- **Chuẩn bị bảng ghi trước khi mở profile đầu tiên.**
- Đóng đúng cách bằng `Browser.close` để trả seat. Kill tiến trình là để seat nằm cooling.
- Seat bị từ chối trông giống hệt crash (exit 76 sau khi CDP đã phục vụ). Xác nhận seat còn trống
  **trước** mỗi lượt đo, đừng đoán từ triệu chứng.

## Điểm dừng — phải hỏi chủ dự án, không tự quyết

Plan thiết kế để chết sớm. Ba chỗ Codex **phải dừng và báo**, không được tự đi tiếp:

1. **Sau phase 02:** Cloak đạt cả ba tiêu chí ở pool 3-5 → dừng cả plan, không cần Brave.
2. **Sau phase 03:** MKT không lái được Brave → dừng, đừng đo fingerprint của engine không điều
   khiển được.
3. **Trong phase 04:** audio của Brave khác stock Chrome và bất biến qua mọi profile → đó là dấu
   *"tôi là Brave"*, dừng. Đổi dấu vendor này lấy dấu vendor khác không giải quyết gì.

## Điều dễ hiểu sai nhất

**Đây là plan quyết định, không phải plan giao hàng.** Đầu ra là một phán quyết Go/No-Go kèm bằng
chứng. Một phase 04 xanh **không** mở rollout, **không** đóng `G2-IDENTITY`, **không** cho phép dùng
nick thật. Nếu báo cáo của Codex viết theo kiểu "engine mới sẵn sàng dùng" thì nó đã hiểu sai plan.

## Sau mỗi phiên

Codex ghi báo cáo vào `plans/260902-0544-fingerprint-gate-and-brave-spike/reports/` và cập nhật
`status` trong file phase. Chủ dự án đọc rồi mới mở phiên kế tiếp.

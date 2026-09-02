---
phase: 5
title: "Bản ghi Go/No-Go"
status: awaiting-owner-signature
priority: P1
effort: "0.5 ngày"
dependencies: [phase-04]
---

# Phase 05 — Bản ghi Go/No-Go

## Context Links

- [plan.md](plan.md) và toàn bộ phase 01-04
- [Báo cáo quyết định 02/09](../reports/decision-260902-0530-fingerprint-engine-path.md)

## Overview

**Ưu tiên:** P1 · **Trạng thái:** DECISION DRAFTED 02/09/2026 - chờ owner ký

Gộp số liệu bốn phase thành **một phán quyết chủ dự án ký được**, và cập nhật docs cho khớp. Phase
này chạy **bất kể kết quả** — kể cả khi plan dừng sớm ở phase 02 hoặc 03.

## Outcome

- [Decision draft](reports/go-no-go.md): `NO-GO` cho Brave integration và identity-isolation claim.
- Cloak Stable `.2`: A/B/C `BLOCKED`, `0/10` readings.
- Brave: lifecycle `4 PASS / 2 FAIL`, cost `3-5 days`; identity A/B/C đều `FAIL`.
- `G2-IDENTITY` giữ `FAIL`; không engine-migration plan, không rollout, không real accounts.
- Docs MKTBrowser/MKTTool đã cập nhật theo outcome 3. Còn đúng một gate: owner signature.

## Key Insights

- Không có phán quyết viết ra thì số liệu sẽ bị nhớ nhầm theo hướng lạc quan sau vài tuần. Đây là
  chỗ chốt lại để lần sau không phải đo lại.
- **Ba kết cục đều hợp lệ**, không kết cục nào là thất bại của plan:
  1. **Cloak đủ dùng ở pool 3-5** (dừng ở phase 02) — tiết kiệm nhất.
  2. **Brave tốt hơn thật** → mở một plan riêng cho việc chuyển engine. Spike **không phải** là
     chuyển engine.
  3. **Không đường nào đạt** → sản phẩm là công cụ quản lý profile/proxy/quyền sở hữu, không phải
     công cụ cách ly danh tính. Docs phải nói đúng như vậy.
- Kết cục 3 **không phải** lý do giấu kết quả. Nó là lý do đổi cách mô tả sản phẩm.

## Requirements

Bản ghi phải trả lời, mỗi câu một dòng dứt khoát:

1. Cloak Stable `.2` đạt/trượt từng tiêu chí A/B/C ở pool 3-5?
2. MKT có lái được Brave không? Chi phí sửa nếu có?
3. Brave đạt/trượt từng tiêu chí? Audio là cohort thật hay dấu vendor?
4. `G2-IDENTITY` (gate cũ) có đủ căn cứ để rút chưa? Nếu chưa, thiếu gì?
5. Việc tiếp theo là gì — và **ai** làm.

## Architecture

Không có. Đây là phase tài liệu.

## Related Code Files

Không sửa code. Cập nhật docs:

- `MKTBrowser/README.md` — mục trạng thái, nếu phán quyết đổi điều gì đang khai
- `MKTTool/docs/development-roadmap.md` — nguồn trạng thái duy nhất
- `MKTTool/docs/internal-beta-release.md` — bảng gate, nếu `G2-IDENTITY` đổi
- `MKTBrowser/docs/fingerprint-acceptance-gate.md` — ghi kết quả áp gate lần đầu

Tạo mới:

- `plans/260902-0544-fingerprint-gate-and-brave-spike/reports/go-no-go.md`

## Implementation Steps

1. Gộp số của `cloak-baseline.md`, `brave-lifecycle.md`, `brave-identity.md` vào một bảng.
2. Trả lời 5 câu ở Requirements, mỗi câu một dòng, không vòng vo.
3. Ghi rõ **cái gì đã đo** và **cái gì suy ra** — không trộn hai loại.
4. Nêu việc tiếp theo kèm điều kiện, không kèm lời hứa ngày tháng.
5. Cập nhật docs bị ảnh hưởng. Nếu phán quyết là kết cục 3, sửa cả cách mô tả sản phẩm.
6. Nếu là kết cục 2, **mở plan riêng** cho việc chuyển engine — đừng nối đuôi vào plan này.

## Todo List

- [x] Gộp số ba báo cáo thành một bảng
- [x] Trả lời 5 câu quyết định
- [x] Tách rõ "đã đo" với "suy ra"
- [x] Ghi việc tiếp theo kèm điều kiện và owner
- [x] Cập nhật roadmap
- [x] Cập nhật bảng gate ở internal-beta-release
- [x] Cập nhật README MKTBrowser
- [x] Kết cục 3: không mở plan chuyển engine
- [ ] Chủ dự án ký phán quyết

## Success Criteria

- `reports/go-no-go.md` tồn tại, 5 câu đều có câu trả lời dứt khoát.
- Docs khớp phán quyết; không còn chỗ nào khai trạng thái cũ.
- Không tuyên bố nào vượt quá bằng chứng đã đo.
- Có chữ ký/xác nhận của chủ dự án.

## Risk Assessment

| Rủi ro | Giảm thiểu |
|---|---|
| Kết quả tốt bị đọc thành "được rollout" | Ghi thẳng: spike **không** mở rollout, **không** đóng `G2-IDENTITY` |
| Kết cục 3 bị làm nhẹ đi cho đỡ khó chịu | Yêu cầu sửa cả cách mô tả sản phẩm, không chỉ sửa một dòng trạng thái |
| Suy luận lẫn vào số đo | Bắt buộc tách hai mục "đã đo" / "suy ra" |
| Nối việc chuyển engine vào plan này | Kết cục 2 bắt buộc mở plan riêng |

## Security Considerations

Không đăng số fingerprint thật ra ngoài repo riêng tư. Nếu phán quyết là No-Go, sửa mọi chỗ docs
đang ngụ ý có cách ly danh tính — **mô tả sai ở đây dẫn tới người dùng chấp nhận rủi ro họ không
biết mình đang chịu**, và đó là loại sai nguy hiểm hơn cả lỗi kỹ thuật.

## Next Steps

Owner ký [decision draft](reports/go-no-go.md) → đóng plan. Nếu owner từ chối, chỉ revise decision;
không tự bắt đầu integration hay phase mới.

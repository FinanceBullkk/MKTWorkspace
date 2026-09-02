---
phase: 2
title: "Đo lại Cloak theo gate mới"
status: closed-blocked
priority: P1
effort: "1-2 ngày"
dependencies: [phase-01]
---

# Phase 02 — Đo lại Cloak Stable `.2` theo gate mới

## Context Links

- [plan.md](plan.md) · [phase 01](phase-01-acceptance-gate-specification.md)
- [Research 0109 — bằng chứng bucket](../reports/research-260828-0109-fingerprint-isolation-solution-options.md)
- Harness: `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs`

## Overview

**Ưu tiên:** P1 · **Trạng thái:** `CLOSED-BLOCKED` 02/09/2026 - không có dataset hợp lệ; vendor contact bị loại trừ

Đo engine **đang dùng** (Cloak Stable `.2`) theo đặc tả vừa viết, ở pool 3-5. Mục đích không phải để
Cloak đạt — mà để biết **khoảng cách thật còn bao xa** trước khi bỏ 5-7 ngày vào Brave.

Đây là phase có khả năng **kết thúc cả plan sớm**: nếu Cloak đạt cả ba tiêu chí ở pool 3-5, không
cần Brave.

## Key Insights

- Số đã có là của **Preview `.3`**, còn pin sản phẩm là **Stable `.2`**. Chưa ai đo `.2` theo gate
  mới. Đừng suy từ `.3` sang `.2`.
- Phép tính đáng kiểm trước tiên: 3 bucket font × 2 bucket WebGL ≈ **6 tổ hợp**. Pool 10 thì bất khả
  thi, pool 3-5 thì khả thi. **Đây là giả thuyết cần đo, không phải kết luận** — bucket BrowserScan
  không phải toàn bộ joint identity.
- Tiêu chí C là chỗ dự đoán sẽ trượt: research đã đo đối chứng stock CFT cho audio hash **khác**, và
  kết luận audio bất biến của Cloak *"likely an engine/build cohort mark"*. Nếu đúng, mọi profile
  đang phát "tôi là CloakBrowser" — trượt C dù có thể qua B.
- Harness hiện có **chưa phủ đủ**: nó mạnh về tính tất định của mô hình dữ liệu, yếu ở audio native,
  liệt kê font, canvas, WebRTC. Phase này phải bù phần thiếu.

## Requirements

- Đo 3-5 profile trên cùng một máy vật lý, mỗi profile lặp lại sau khởi động lại.
- Đo đủ bề mặt mà phase 01 liệt kê.
- Đối chứng **stock Chrome/CFT trên cùng máy** cho tiêu chí C.
- Báo cáo A/B/C tách rời, kèm số thô.

## Architecture

```
profile 1..N (N=3..5)  ──┐
                          ├─→ harness mở rộng ──→ số thô ──→ phán quyết A/B/C
stock Chrome/CFT ─────────┘        (cùng máy)
```

Đối chứng stock nằm **trong cùng lượt đo, cùng máy**. So với số đo từ máy khác hay từ tài liệu là vô
nghĩa cho tiêu chí cohort.

## Related Code Files

Sửa/mở rộng:

- `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs` — bù vùng phủ thiếu

Tạo mới:

- `plans/260902-0544-fingerprint-gate-and-brave-spike/reports/cloak-baseline.md` — số và phán quyết

Chỉ đọc: driver hiện tại của MKT Browser, để biết override nào đang bật.

## Implementation Steps

1. Mở rộng harness cho các bề mặt phase 01 liệt kê mà nó chưa phủ.
2. Dựng 3-5 profile dùng-một-lần trên Cloak Stable `.2`.
3. Đo lần 1; khởi động lại; đo lần 2 → lấy dữ liệu tiêu chí A.
4. Ghép joint tuple của các profile → tiêu chí B.
5. Đo stock Chrome/CFT trên cùng máy → so từng thành phần → tiêu chí C.
6. Ghi số thô + ba phán quyết vào `reports/cloak-baseline.md`.
7. **Quyết điểm dừng:** đạt cả A/B/C → dừng plan, ghi kết quả. Không đạt → đi tiếp phase 03.

> **Ghi chú seat:** đo cần mở profile Cloak thật, tức chạm seat. Chỉ có một seat và không có ngân
> sách, nên: gom hết phép đo vào **một lượt liên tục**, đóng đúng cách bằng `Browser.close` để trả
> seat, và đừng chạy lại vì quên ghi số. Chuẩn bị sẵn bảng ghi trước khi mở profile đầu tiên.

## Todo List

- [x] Liệt kê vùng phủ thiếu của harness (đầu vào từ phase 01)
- [x] Mở rộng harness
- [x] Chuẩn bị bảng ghi số **trước khi** mở profile
- [ ] Dựng 3-5 profile dùng-một-lần trên Stable `.2`
- [ ] Đo lần 1 → khởi động lại → đo lần 2 (tiêu chí A)
- [ ] Ghép joint tuple (tiêu chí B)
- [ ] Đo đối chứng stock Chrome/CFT cùng máy (tiêu chí C)
- [x] Viết `reports/cloak-baseline.md` với trạng thái `CLOSED-BLOCKED`
- [x] Đóng phase 02; không có đường vendor và không tự động khởi động phase 03

## Success Criteria

- Có số thô cho cả ba tiêu chí trên Stable `.2` ở pool 3-5.
- Có đối chứng stock cùng máy.
- `reports/cloak-baseline.md` nói rõ **đạt/trượt từng tiêu chí riêng**, không gộp.
- Có một câu kết luận dứt khoát: dừng plan, hay đi tiếp phase 03.

## Risk Assessment

| Rủi ro | Giảm thiểu |
|---|---|
| Đốt seat vì đo nhiều lượt | Gom một lượt liên tục, chuẩn bị bảng ghi trước, đóng bằng `Browser.close` |
| Suy từ số Preview `.3` sang Stable `.2` | Cấm; phải đo lại `.2` |
| Bucket BrowserScan bị coi là toàn bộ joint identity | Đặc tả phase 01 đã liệt kê đủ bề mặt; harness phải phủ hết |
| Kết luận "gần đạt" rồi tự nới | Ba tiêu chí báo cáo tách rời; trượt C vẫn là trượt |

## Security Considerations

Profile dùng-một-lần, không nick thật, không dữ liệu thật. Không ghi giá trị fingerprint thật của
máy chủ dự án vào repo dưới dạng có thể tra ngược ra máy đó.

## Closure and bounded self-service check

Phase 02 is closed-blocked, not waiting. The only remaining self-service check is on the second owner
machine: power off MKT Browser and CloakBrowser completely, then retry once. If that is not the cause,
this phase cannot be measured at all. Do not lower the pool, change the engine pin, or substitute
Preview `.3`; `G2-IDENTITY` remains unchanged.

Phase 03 is unblocked independently and can be started in a later session. If a valid dataset is ever
obtained, send its separate A/B/C verdicts to [phase 05](phase-05-go-no-go-decision-record.md); no
vendor request or seat purchase is a next step.

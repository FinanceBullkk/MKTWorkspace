---
title: "Gate nghiệm thu đúng + spike Brave prebuilt"
description: "Sửa tiêu chí nghiệm thu fingerprint về joint identity/cohort, đo lại Cloak theo tiêu chí đó, rồi spike Brave prebuilt để quyết đường engine miễn phí duy nhất còn lại."
status: in-progress
priority: P1
effort: "9-13 ngày kỹ thuật"
branch: "codex/fingerprint-engine-phase0"
tags: [mktbrowser, fingerprint, engine, brave, spike, windows]
created: "2026-09-02"
---

# Gate nghiệm thu đúng + spike Brave prebuilt

## Đây là plan QUYẾT ĐỊNH, không phải plan giao hàng

Đầu ra là một phán quyết **Go/No-Go** kèm bằng chứng, **không** phải một engine mới được ship.
Spike xanh **không** mở rollout, **không** đóng `G2-IDENTITY`, **không** cho phép dùng nick thật.
Ai đọc kết quả phase 4 mà kết luận "xong rồi, dùng được" là đọc sai plan này.

## Vì sao làm bây giờ

Quyết định 02/09/2026 ([báo cáo](../reports/decision-260902-0530-fingerprint-engine-path.md)):

- Sản phẩm tập trung là **antidetect browser**; Reddit/Facebook đã rút khỏi phạm vi bàn giao.
- **Không ai viết được C++ Chromium/Blink** và **không có máy >16 GiB khả dụng** → nấc PoC và sản
  phẩm hoá **đóng**. Không build từ nguồn, không vá native.
- **Không có ngân sách** → đường vendor thay thế đóng. Chỉ còn thứ miễn phí.
- **Pool 3-5 profile, một profile tại một thời điểm** → bài toán nhỏ hơn hẳn giả định tháng 8 (10
  profile đồng thời).

Còn đúng hai việc với tới được, cả hai miễn phí, không cần C++, không cần build: **sửa gate** và
**spike Brave prebuilt**.

Có đồng hồ đếm ngược: không ngân sách nghĩa là seat CloakBrowser hiện tại cũng có hạn. Spike Brave
là bản thay thế miễn phí cho một dependency có thể hết hạn.

## Bắt đầu

Thực thi bằng phiên Codex riêng cho từng phase — xem
[kickoff-codex-session.md](kickoff-codex-session.md) để lấy prompt và kỷ luật seat.

## Các giai đoạn

| # | Giai đoạn | Công sức | Trạng thái |
|---|---|---|---|
| 01 | [Đặc tả gate nghiệm thu](phase-01-acceptance-gate-specification.md) | 2-3 ngày | **XONG 02/09** |
| 02 | [Đo lại Cloak theo gate mới](phase-02-cloak-baseline-remeasurement.md) | 1-2 ngày | **CLOSED-BLOCKED 02/09 - không có dataset Stable `.2`; vendor contact bị loại trừ** |
| 03 | [Spike Brave — lifecycle & tích hợp](phase-03-brave-lifecycle-integration-spike.md) | 2-3 ngày | **READY 02/09 - độc lập với phase 02, không cần seat Cloak** |
| 04 | [Spike Brave — danh tính & cohort](phase-04-brave-identity-and-cohort-verdict.md) | 3-4 ngày | chưa bắt đầu |
| 05 | [Bản ghi Go/No-Go](phase-05-go-no-go-decision-record.md) | 0.5 ngày | chưa bắt đầu |

> Phase 02 là nhánh thoát sớm, không phải prerequisite của phase 03. Đóng-block phase 02 chỉ làm mất
> cửa thoát sớm; phase 03 và 04 dùng Brave/stock Chrome miễn phí và không cần seat Cloak. Phase 03
> được đánh dấu **READY**, nhưng chưa được bắt đầu trong phiên closeout này.

## Điều kiện dừng sớm

Plan này **thiết kế để chết sớm và rẻ**. Dừng ngay, không đi tiếp, khi:

- **Sau phase 02:** nếu Cloak đạt cả ba tiêu chí gate mới ở pool 3-5 → không cần Brave. Ghi kết
  quả, đóng plan, tiết kiệm 5-7 ngày.
- **Sau phase 03:** nếu MKT không lái được Brave (CDP, `DevToolsActivePort`, `Browser.close`,
  extension, proxy fail-closed) → dừng. Đo fingerprint của một engine không điều khiển được là vô
  nghĩa.
- **Trong phase 04:** nếu audio của Brave là dấu *"tôi là Brave"* thay vì cohort Windows thật →
  dừng. Đổi dấu vendor này lấy dấu vendor khác không giải quyết gì.

## Phụ thuộc

- Máy Windows x64 hiện tại. **Không** cần phần cứng mới — đây là điểm khác căn bản với plan
  [`260828-0428`](../260828-0428-chromium-fingerprint-engine/plan.md) đã đóng vì thiếu RAM.
- Bản Brave Windows chính thức, có kiểm checksum. Chỉ chạy trong data root dùng-một-lần.
- Cloak Stable `.2` giữ nguyên pin làm mốc lịch sử; phase 03/04 không khởi chạy nó và không cần seat.
  Đối chứng live của phase 04 là stock Chrome/CFT. **Không** promote Preview `.3`.
- Harness đo: `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs` (đã có, cần mở rộng
  vùng phủ), BrowserScan, CreepJS.

## Ranh giới không được vượt

- Không cài Brave như MKT Browser, không phân phối, không đổi engine pin của sản phẩm.
- Không nới `G2-IDENTITY` hiện tại. Gate mới chạy **song song** như gate thực nghiệm cho tới khi có
  quyết định riêng.
- Không dùng nick thật ở bất kỳ phase nào.
- Phase 03/04 không chạm seat Cloak; phase 02 đã `CLOSED-BLOCKED`.

## Liên quan

- [Báo cáo quyết định 02/09](../reports/decision-260902-0530-fingerprint-engine-path.md)
- [Research: vendor-independent isolation](../reports/research-260828-0153-vendor-independent-fingerprint-isolation.md)
- [Research: solution options](../reports/research-260828-0109-fingerprint-isolation-solution-options.md)
- [Plan engine đã đóng (thiếu RAM)](../260828-0428-chromium-fingerprint-engine/plan.md)
- [Plan prebuilt engine (deferred, lý do đã hết hiệu lực)](../260828-1655-prebuilt-engine-session-orchestrator/plan.md)

---
phase: 1
title: "Đặc tả gate nghiệm thu"
status: complete
priority: P1
effort: "2-3 ngày"
dependencies: []
---

# Phase 01 — Đặc tả gate nghiệm thu

## Context Links

- [plan.md](plan.md)
- [Báo cáo quyết định 02/09](../reports/decision-260902-0530-fingerprint-engine-path.md)
- [Research 0153 — mục "Correct Product Objective"](../reports/research-260828-0153-vendor-independent-fingerprint-isolation.md)
- Từ vựng nghiệm thu hiện có: `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md`

## Overview

**Ưu tiên:** P1, làm trước mọi thứ · **Trạng thái:** XONG 02/09/2026 —
[`MKTBrowser/docs/fingerprint-acceptance-gate.md`](../../MKTBrowser/docs/fingerprint-acceptance-gate.md)

Viết đặc tả tiếng Việt/Anh cho một gate nghiệm thu **đúng**, thay cho gate hiện tại vốn đòi mỗi
profile phải có font/audio/WebGL hash **duy nhất**. Không sửa code engine, không đo, không promote gì
ở phase này. Đầu ra là một tài liệu.

## Key Insights

- Gate hiện tại **tự nó sai**. Research 0153: *"Real devices naturally share many component values.
  Artificially unique noise increases entropy and can become a stronger detector."* Máy thật có
  trùng nhau; bịa giá trị độc nhất làm máy **dễ nhận ra hơn**.
- Vì gate sai, **`G2-IDENTITY=FAIL` hiện tại chưa chắc phản ánh khoảng cách thật**. Có thể một phần
  cái FAIL đó là do đo nhầm tiêu chí. Chưa đo lại theo gate đúng thì chưa ai biết.
- Gate mới có **ba tiêu chí độc lập**, và gộp chúng thành một điểm đạt/trượt là lặp lại đúng sai
  lầm cũ.
- Pool 3-5 (không phải 10) đổi tiêu chí đụng độ từ bất khả thi thành khả thi. Con số pool **là một
  phần của định nghĩa gate**, không phải tham số cấu hình.

## Requirements

### Chức năng

Đặc tả phải định nghĩa chính xác, không mơ hồ:

1. **Tiêu chí A — nhất quán:** cùng profile + cùng first-party site + cùng engine revision → kết quả
   giống hệt qua khởi động lại, qua context (frame, worker, offscreen canvas).
2. **Tiêu chí B — không đụng độ joint tuple:** trong pool 3-5 profile trên cùng máy, không hai
   profile nào trùng **toàn bộ** bộ định danh. Trùng từng thành phần lẻ là **được phép**.
3. **Tiêu chí C — cohort hợp lý:** mỗi thành phần phải thuộc một cohort Windows/Chromium phổ biến,
   đo được. Một giá trị dùng chung mà **không** thuộc cohort thật thì là **dấu vendor**, và trượt
   tiêu chí này kể cả khi qua tiêu chí B.
4. Ba tiêu chí **báo cáo tách rời**, không gộp điểm.

### Phi chức năng

- Đặc tả nêu rõ danh sách bề mặt phải đo: fonts, audio (`OfflineAudioContext`, AudioBuffer,
  analyser), WebGL 1/2, WebGPU, canvas, client rects, UA/client hints, visitor hash.
- Nêu rõ nguồn đối chứng cohort: stock Chrome/CFT trên cùng máy vật lý.
- Không đặt "điểm số" của BrowserScan/CreepJS làm mục tiêu. Chúng là công cụ chẩn đoán.

## Architecture

Gate mới chạy **song song** gate cũ, không thay thế:

```
G2-IDENTITY (cũ, uniqueness)     → giữ nguyên FAIL, giữ nguyên là gate phát hành
G2-IDENTITY-JOINT (mới, 3 tiêu chí) → gate thực nghiệm, chỉ để đo và quyết định
```

Lý do giữ cả hai: hạ gate phát hành trước khi có bằng chứng là tự cho phép mình lỏng tay. Gate cũ chỉ
được rút khi có quyết định riêng của chủ dự án, dựa trên số liệu phase 02/04.

## Related Code Files

Chỉ đọc, không sửa ở phase này:

- `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs` — harness hiện có; ghi lại vùng nó
  **chưa** phủ (audio native, liệt kê font, canvas, WebRTC)
- `plans/260821-1925-antidetect-browser-proxy-p0/reports/acceptance-matrix.md` — từ vựng nghiệm thu

Tạo mới:

- `MKTBrowser/docs/fingerprint-acceptance-gate.md` — chính là đặc tả

## Implementation Steps

1. Đọc mục "Correct Product Objective" của research 0153 và acceptance matrix hiện có; liệt kê chỗ
   từ vựng cũ mâu thuẫn với gate mới.
2. Chốt pool = **3-5**, ghi rõ đây là số đã quyết 02/09 và đổi nó nghĩa là phải đo lại.
3. Viết định nghĩa ba tiêu chí A/B/C, mỗi tiêu chí kèm cách đo và cách báo cáo riêng.
4. Liệt kê bề mặt phải đo và API tương ứng cho từng bề mặt.
5. Định nghĩa "cohort hợp lý" bằng thủ tục kiểm được: so với stock Chrome/CFT trên cùng máy, không
   so với niềm tin.
6. Ghi rõ gate cũ vẫn còn hiệu lực và điều kiện để rút nó.
7. Ghi vùng phủ còn thiếu của harness hiện có, làm đầu vào cho phase 02.

## Todo List

- [x] Liệt kê mâu thuẫn giữa acceptance matrix cũ và mục tiêu mới
- [x] Chốt và ghi pool = 3-5
- [x] Viết tiêu chí A (nhất quán)
- [x] Viết tiêu chí B (không đụng độ joint tuple)
- [x] Viết tiêu chí C (cohort hợp lý) kèm thủ tục đối chứng stock Chrome/CFT
- [x] Liệt kê bề mặt + API phải đo
- [x] Ghi quy tắc báo cáo tách rời ba tiêu chí
- [x] Ghi điều kiện rút gate cũ
- [x] Ghi vùng phủ thiếu của harness

## Success Criteria

- `MKTBrowser/docs/fingerprint-acceptance-gate.md` tồn tại, ba tiêu chí định nghĩa đủ rõ để **hai
  người đọc độc lập cho ra cùng một phán quyết** trên cùng bộ số liệu.
- Pool 3-5 ghi trong đặc tả.
- Gate cũ **không** bị nới trong phase này.
- Không chạy engine, không promote gì.

## Risk Assessment

| Rủi ro | Giảm thiểu |
|---|---|
| Viết gate mới lỏng hơn chỉ để dễ đạt | Gate cũ giữ nguyên hiệu lực; gate mới chỉ là thực nghiệm cho tới khi có quyết định riêng |
| Tiêu chí C mơ hồ thành "trông hợp lý" | Bắt buộc thủ tục đối chứng stock Chrome/CFT trên cùng máy, có số |
| Gộp ba tiêu chí thành một điểm | Ghi thẳng quy tắc báo cáo tách rời vào đặc tả |

## Security Considerations

Không đụng dữ liệu thật, không đụng nick thật, không đụng seat vendor. Đặc tả **không được** ghi giá
trị fingerprint thật của máy chủ dự án vào tài liệu công khai trong repo.

## Next Steps

Xong phase này mở khoá [phase 02](phase-02-cloak-baseline-remeasurement.md) — đo lại Cloak Stable
`.2` theo chính đặc tả vừa viết.

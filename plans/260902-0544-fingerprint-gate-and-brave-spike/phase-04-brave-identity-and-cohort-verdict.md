---
phase: 4
title: "Spike Brave — danh tính & phán quyết cohort"
status: pending
priority: P1
effort: "3-4 ngày"
dependencies: [phase-03]
---

# Phase 04 — Spike Brave: danh tính & phán quyết cohort

## Context Links

- [plan.md](plan.md) · [phase 01](phase-01-acceptance-gate-specification.md) · [phase 02](phase-02-cloak-baseline-remeasurement.md) · [phase 03](phase-03-brave-lifecycle-integration-spike.md)
- [Research 0153](../reports/research-260828-0153-vendor-independent-fingerprint-isolation.md)

## Overview

**Ưu tiên:** P1 · **Trạng thái:** chưa bắt đầu

Đo Brave theo **đúng gate của phase 01**, cùng phương pháp và cùng máy như phase 02, rồi so trực tiếp
với Cloak. Đây là phase trả lời câu đắt nhất của cả plan.

## Key Insights

- **Câu hỏi quyết định không phải "Brave có tốt hơn Cloak không", mà "audio của Brave là cohort
  Windows thật hay là dấu *tôi là Brave*".** Nếu chỉ đổi dấu *"tôi là CloakBrowser"* thành dấu
  *"tôi là Brave"* thì **không giải quyết được gì** — vẫn lộ đang dùng công cụ chống nhận diện, chỉ
  đổi tên vendor bị lộ.
- Research đã cảnh báo trước: Brave *"may form its own cohort"*. Đây là giả thuyết phải bác bỏ, không
  phải rủi ro phụ.
- Threat model của Brave là **chống tracker**, không phải antidetect. Nó tối ưu cho việc *không bị
  theo dõi xuyên site*, không phải cho việc *trông giống một máy Windows bình thường*. Hai mục tiêu
  đó đôi khi ngược nhau.
- Tiêu chí B (không đụng độ) nhiều khả năng dễ đạt hơn Cloak vì Brave có farbling theo origin thật.
  Tiêu chí C mới là chỗ quyết định.

## Requirements

1. Đo 3-5 profile Brave, mỗi profile lặp lại sau khởi động lại → tiêu chí A.
2. Ghép joint tuple → tiêu chí B.
3. **Đối chứng stock Chrome/CFT trên cùng máy vật lý** → tiêu chí C.
4. So sánh trực tiếp với số Cloak của phase 02, cùng phương pháp, cùng máy.
5. Kiểm nhất quán xuyên context: frame, worker, offscreen canvas.

## Architecture

Phép đo quyết định của tiêu chí C:

```
                     audio / font / WebGL
Brave        ──────────────┐
stock Chrome ──────────────┼──→ so sánh trên CÙNG máy
Cloak (.2)   ──────────────┘

Brave ≈ stock          → cohort thật, đáng đi tiếp
Brave ≠ stock, bất biến qua mọi profile → DẤU SẢN PHẨM, dừng
```

Điểm mấu chốt: giá trị **bất biến qua mọi profile mà khác stock** chính là chữ ký engine. Đó đúng là
khuyết tật đã hạ Cloak. Áp cùng một thước cho Brave, không nới tay vì nó miễn phí.

## Related Code Files

- `MKTBrowser/scripts/measure-mkb01e-packaged-fingerprint.cjs` — dùng bản đã mở rộng ở phase 02,
  **không sửa nữa** để hai lượt đo so được với nhau

Tạo mới:

- `plans/260902-0544-fingerprint-gate-and-brave-spike/reports/brave-identity.md`

## Implementation Steps

1. Dựng 3-5 profile Brave dùng-một-lần.
2. Chạy **đúng harness và đúng quy trình** phase 02 đã dùng. Đổi phương pháp giữa chừng là mất khả
   năng so sánh.
3. Đo lần 1 → khởi động lại → đo lần 2 (tiêu chí A).
4. Ghép joint tuple (tiêu chí B).
5. Đo/dùng lại đối chứng stock cùng máy; so audio, font, WebGL của Brave với stock (tiêu chí C).
6. Kiểm nhất quán xuyên frame/worker/offscreen canvas.
7. Lập bảng ba cột **Cloak `.2` | Brave | stock Chrome** cho từng bề mặt.
8. Viết `reports/brave-identity.md` với phán quyết A/B/C tách rời.

## Todo List

- [ ] Dựng 3-5 profile Brave dùng-một-lần
- [ ] Đo lần 1 → khởi động lại → đo lần 2 (A)
- [ ] Ghép joint tuple (B)
- [ ] So audio với stock Chrome cùng máy (C — câu quyết định)
- [ ] So font với stock (C)
- [ ] So WebGL/WebGPU với stock (C)
- [ ] Kiểm nhất quán frame/worker/offscreen canvas
- [ ] Lập bảng ba cột Cloak | Brave | stock
- [ ] Viết `reports/brave-identity.md`

## Success Criteria

- Ba tiêu chí có phán quyết riêng, có số thô.
- Bảng ba cột đầy đủ cho mọi bề mặt phase 01 liệt kê.
- Câu hỏi audio-cohort được trả lời **dứt khoát**, không "có vẻ".
- Kết luận nêu rõ Brave **hơn/bằng/kém** Cloak ở từng tiêu chí, không nói chung chung "tốt hơn".

## Risk Assessment

| Rủi ro | Giảm thiểu |
|---|---|
| Đổi phương pháp giữa phase 02 và 04 | Khoá harness sau phase 02; dùng nguyên bản đó |
| Thấy Brave khác Cloak rồi kết luận "tốt hơn" | Khác ≠ tốt hơn. Chỉ stock mới là mốc cho tiêu chí C |
| Nới tay vì Brave miễn phí và là hy vọng cuối | Cùng một thước với Cloak; ghi thẳng rủi ro này vào báo cáo |
| Coi spike xanh là được rollout | plan.md đã ghi: đầu ra là Go/No-Go, không phải giấy phép dùng nick thật |

## Security Considerations

Profile dùng-một-lần, không nick thật, không đăng nhập tài khoản thật ở bất kỳ bước nào. Không ghi
fingerprint thật của máy chủ dự án vào repo dưới dạng tra ngược được ra máy đó.

## Next Steps

→ [phase 05](phase-05-go-no-go-decision-record.md), bất kể kết quả.

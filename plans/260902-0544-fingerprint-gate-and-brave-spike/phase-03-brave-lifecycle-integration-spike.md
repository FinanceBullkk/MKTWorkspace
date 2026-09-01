---
phase: 3
title: "Spike Brave — lifecycle & tích hợp"
status: pending
priority: P1
effort: "2-3 ngày"
dependencies: [phase-02]
---

# Phase 03 — Spike Brave: lifecycle & tích hợp

## Context Links

- [plan.md](plan.md) · [phase 02](phase-02-cloak-baseline-remeasurement.md)
- [Research 0153 — mục "Phase 1: Brave compatibility"](../reports/research-260828-0153-vendor-independent-fingerprint-isolation.md)

## Overview

**Ưu tiên:** P1 · **Trạng thái:** chưa bắt đầu

Chạy Brave Windows **nguyên bản, có kiểm checksum**, trong data root dùng-một-lần, và trả lời đúng
một câu: **MKT Browser có lái được nó không?**

Làm trước phần đo fingerprint (phase 04) vì đây là **điểm chết rẻ hơn**. Nếu không lái được thì đo
fingerprint của nó cũng vô nghĩa, và ta tiết kiệm 3-4 ngày.

## Key Insights

- Brave là **prebuilt**. Không build, không vá, không cần C++ — đúng lý do nó là đường duy nhất còn
  lại sau khi hai ràng buộc kia đóng nấc PoC/sản phẩm hoá.
- Brave **đã biên dịch sẵn** phần đang thiếu: `BraveAudioFarblingHelper`, WebGL native, font
  whitelist chặn cả `src: local(...)`, seeded PRNG farbling theo origin.
- Nhưng hợp đồng của MKT rất cụ thể: profile `--user-data-dir` bền, `DevToolsActivePort` sở hữu,
  CDP + `Browser.close`, nạp extension, proxy fail-closed, cài/rollback engine có checksum. Một
  binary Chromium-compatible **về lý thuyết** bảo toàn hết — phase này kiểm **thực tế**.
- Ngữ nghĩa seed/session của Brave **không phải** hợp đồng profile bền của MKT. Đây là chỗ nhiều khả
  năng vênh nhất và phải đo, không được giả định.

## Requirements

Kiểm từng mục, mỗi mục một kết luận đạt/trượt:

1. Phát hiện `DevToolsActivePort` và nối CDP.
2. `Browser.close`, quyền sở hữu tiến trình, hành vi khởi động lại.
3. Đường proxy fail-closed + kiểm DNS/WebRTC.
4. Nạp extension đồng hành và các API nó cần.
5. Profile bền qua khởi động lại: cùng `--user-data-dir` → cùng danh tính profile.
6. Không làm yếu ranh giới an toàn hiện có (không tắt sandbox, không hạ CSP, không mở CDP ra ngoài
   loopback).

## Architecture

```
MKT Browser driver ──CDP──> Brave (prebuilt, checksummed, disposable data root)
                              │
                              ├─ proxy fail-closed
                              ├─ extension đồng hành
                              └─ Browser.close → trả tiến trình
```

Chỉ thay **binary engine**. Không sửa driver để chiều Brave ở phase này — nếu phải sửa driver mới
chạy được thì ghi lại chính xác chỗ phải sửa và chi phí; đó là dữ liệu đầu vào cho quyết định, không
phải việc làm luôn.

## Related Code Files

Chỉ đọc, ghi chép chỗ vênh:

- Driver hiện tại của MKT Browser (`ChromiumBrowserDriver` và phần phát hiện port)
- Đường nạp extension đồng hành
- Đường proxy fail-closed

Tạo mới:

- `plans/260902-0544-fingerprint-gate-and-brave-spike/reports/brave-lifecycle.md`

## Implementation Steps

1. Tải Brave Windows bản chính thức; **ghi lại URL, phiên bản, SHA-256**. Không dùng bản không rõ
   nguồn.
2. Chạy trong data root dùng-một-lần. **Không** cài như MKT Browser, **không** đổi engine pin.
3. Kiểm lần lượt 6 mục ở Requirements, ghi đạt/trượt từng mục kèm bằng chứng.
4. Với mỗi mục trượt: ghi rõ **cần sửa gì ở phía MKT** và ước lượng công sức. Không sửa ngay.
5. Viết `reports/brave-lifecycle.md`.
6. **Quyết điểm dừng:** có mục nào trượt mà không sửa được bằng TypeScript trong vài ngày → dừng
   plan.

## Todo List

- [ ] Tải Brave, ghi phiên bản + SHA-256
- [ ] Dựng data root dùng-một-lần
- [ ] Kiểm `DevToolsActivePort` + nối CDP
- [ ] Kiểm `Browser.close` + sở hữu tiến trình + khởi động lại
- [ ] Kiểm proxy fail-closed + DNS/WebRTC
- [ ] Kiểm nạp extension đồng hành
- [ ] Kiểm profile bền qua khởi động lại
- [ ] Xác nhận không hạ ranh giới an toàn nào
- [ ] Ghi chi phí sửa cho từng mục trượt
- [ ] Viết `reports/brave-lifecycle.md` + quyết dừng/đi tiếp

## Success Criteria

- Sáu mục đều có phán quyết kèm bằng chứng, không mục nào bỏ trống.
- Phiên bản Brave + SHA-256 ghi lại được, tái lập được.
- Mọi mục trượt đều có ước lượng chi phí sửa phía MKT.
- Một câu kết luận: đi tiếp phase 04, hay dừng.

## Risk Assessment

| Rủi ro | Giảm thiểu |
|---|---|
| Sa đà sửa driver cho Brave chạy được | Phase này **chỉ đo và ghi chi phí**, không sửa |
| Vô tình cài Brave thành engine sản phẩm | Chỉ data root dùng-một-lần; không đụng engine pin, không đụng installer |
| Hạ ranh giới an toàn để "cho nó chạy" | Đưa thành mục kiểm số 6; hạ ranh giới = trượt, không phải mẹo |
| Tải nhầm bản Brave không rõ nguồn | Bắt buộc ghi URL + SHA-256 |

## Security Considerations

Data root dùng-một-lần, không nick thật. Không tắt sandbox, không nới CSP, không mở CDP ra ngoài
loopback — kể cả tạm thời để thử. Một ranh giới bị hạ "chỉ để test" là một ranh giới sẽ quên bật lại.

## Next Steps

Đạt → [phase 04](phase-04-brave-identity-and-cohort-verdict.md).
Trượt → [phase 05](phase-05-go-no-go-decision-record.md) ghi No-Go kèm lý do.

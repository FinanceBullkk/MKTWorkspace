# Giới hạn số profile chạy cùng lúc — nói bằng ngôn ngữ người dùng

**Tạo:** 20/08/2026 08:03 · **Trạng thái:** chưa bắt đầu (phase-01 đang làm)

## Vấn đề

Engine chỉ cho **1 phiên cùng lúc** (gói free). Khi chạm giới hạn, operator nhận được:

> `ENGINE_UNAVAILABLE` — "CloakBrowser: your plan's session limit is reached. Close another
> running profile, or raise the limit at https://cloakbrowser.dev"

Bốn thứ sai với người dùng thật (marketer TikTok, không phải kỹ sư):

1. **"seat" / "session limit"** — không ai ngoài kỹ sư hiểu đây là gì
2. **Lộ tên `CloakBrowser` và link cloakbrowser.dev** — engine là chi tiết nội bộ, sản phẩm là MKT Browser
3. **Tiếng Anh** — app chưa có i18n, toàn bộ chuỗi là tiếng Anh cứng
4. **Báo lỗi SAU khi bấm** — app đã biết đang chạy mấy profile (`App.tsx:314`), lẽ ra phải chặn trước

Tệ hơn: tắt cứng app ⇒ chrome con giữ chỗ **7–17 phút**, app đếm 0 nhưng thực tế là 0 chỗ trống.
Operator thấy "không có gì chạy" mà vẫn không mở được, và không có gì giải thích.

## Nguyên tắc thiết kế

- **Sức chứa, không phải seat.** Khái niệm hiển thị là *"số profile chạy cùng lúc"*, đơn vị là profile.
- **Chặn trước, đừng báo sau.** Nút Open phải tự tắt kèm lý do, không để operator chạm lỗi engine.
- **Không lộ nhà cung cấp engine.** Chuỗi cho operator không chứa `CloakBrowser`, không link ra ngoài.
- **Không bịa API.** Máy chủ license không tra được số chỗ (đã quét đĩa: thiếu `lease_id`/`instance_id`).
  ⇒ sức chứa phải **học từ thực tế** hoặc do cấu hình, không được đoán.
- **Chẩn đoán giữ nguyên độ thô.** Log vẫn ghi `exit=76`, `SIGKILL` — chỉ lớp hiển thị mới dịch.

## Các phase

| # | Việc | Trạng thái |
|---|---|---|
| [01](phase-01-quet-don-profile-mo-coi-luc-khoi-dong.md) | Quét dọn profile mồ côi lúc khởi động | đang làm |
| [02](phase-02-mo-hinh-suc-chua-va-trang-thai-cho.md) | Mô hình sức chứa + trạng thái chờ giải phóng | chưa |
| [03](phase-03-ui-chan-truoc-khi-bam.md) | UI: đồng hồ sức chứa, chặn trước khi bấm | chưa |
| [04](phase-04-ngon-ngu-operator.md) | Chuỗi tiếng Việt, không lộ tên engine | chưa |

Phase 01 độc lập. 02 → 03 → 04 nối tiếp (03 cần state của 02, 04 cần chỗ hiển thị của 03).

## Cấu hình (đích đến)

`%LOCALAPPDATA%\MKTTool\MKTBrowser\settings.json`

```jsonc
{
  "maxConcurrentProfiles": 0,   // 0 = tự học từ thực tế; >0 = ép cứng
  "seatCooldownSeconds": 1020,  // 17 phút, biên trên đã đo (3 lần: 17'/7'/11')
  "startupOrphanSweep": true    // đóng profile mồ côi lúc khởi động
}
```

## Phụ thuộc

- `findBrowserProcessesUsingDataDir` / `enumerateBrowserProcessesUsingDataDir` — đã có
- `profile-shutdown.log` (JSONL) — đã có, là nguồn phát hiện cooldown
- `runningCount` trong `App.tsx:314` — đã có, là mầm của đồng hồ sức chứa
- Không có i18n framework — phase-04 phải quyết định: thêm i18n hay chỉ đổi chuỗi tại chỗ

## Câu chưa giải quyết

1. Gói trả phí cho bao nhiêu phiên? Chưa ai mua nên chưa biết cách hiển thị N > 1.
2. Có nên dịch **toàn bộ** UI sang tiếng Việt không, hay chỉ phần sức chứa? Ảnh hưởng phạm vi phase-04 rất nhiều.
3. Cooldown 7–17 phút: biên trên là quan sát 3 lần, chưa phải hợp đồng. Hiển thị con số cụ thể có rủi ro sai.

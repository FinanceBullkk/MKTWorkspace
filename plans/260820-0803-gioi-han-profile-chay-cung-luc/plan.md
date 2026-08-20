# Giới hạn số profile chạy cùng lúc — nói bằng ngôn ngữ người dùng

**Tạo:** 20/08/2026 08:03 · **Trạng thái:** chưa bắt đầu (phase-01 đang làm)

## Vấn đề

Engine chỉ cho **1 phiên cùng lúc** (gói free). Khi chạm giới hạn, operator nhận được:

> `ENGINE_UNAVAILABLE` — "CloakBrowser: your plan's session limit is reached. Close another
> running profile, or raise the limit at https://cloakbrowser.dev"

Bốn thứ sai với người dùng thật (marketer TikTok, không phải kỹ sư):

1. **"seat" / "session limit"** — không ai ngoài kỹ sư hiểu đây là gì
2. **Lộ tên `CloakBrowser` và link cloakbrowser.dev** — engine là chi tiết nội bộ, sản phẩm là MKT Browser
3. **Báo lỗi SAU khi bấm** — app đã biết đang chạy mấy profile (`App.tsx:314`), lẽ ra phải chặn trước

Tệ hơn: tắt cứng app ⇒ chrome con giữ chỗ **7–17 phút**, app đếm 0 nhưng thực tế là 0 chỗ trống.
Operator thấy "không có gì chạy" mà vẫn không mở được, và không có gì giải thích.

**Ngôn ngữ: giữ tiếng Anh toàn bộ** (chốt 20/08). Không thêm i18n. Vấn đề không phải ngôn ngữ mà là
*thuật ngữ*: "seat"/"session limit" là từ của nhà cung cấp license, phải đổi sang từ mà người dùng
hiểu — "profiles running at once" — và bỏ tên nhà cung cấp.

## Cooldown — chốt phạm vi có thể cứu

| Tình huống | Trước `0.3.11` | Sau |
|---|---|---|
| Bấm Stop / thoát app bình thường | không mất chỗ | không đổi |
| Tắt cứng app, máy vẫn chạy | **mất 7–17 phút** | **vài giây** |
| Mất điện / BSOD | mất 7–17 phút | vẫn mất |

**Phát hiện khi nghiệm thu phase-01, ngược với giả định ban đầu của plan này:** tắt cứng app thì
chrome **chết theo**, không hề có mồ côi — vì `spawn` dùng `detached: false` nên trình duyệt nằm
chung job object với app. Nghe gọn gàng nhưng là kết cục tệ nhất: trình duyệt chết đúng kiểu duy
nhất **không** nhả chỗ, mà lại không để lại gì để sau này nhờ nhả hộ.

`7a51999` đổi sang `detached: true`. Trình duyệt sống sót qua cú crash, và chính cửa sổ đó là đường
cứu: operator tự đóng ⇒ tắt sạch ⇒ chỗ về ngay; hoặc mở lại app ⇒ phase-01 đóng qua cổng debug.

Ca **mất điện** vẫn không có đường ra bằng code: nhả chỗ qua API cần `lease_id` + `instance_id`, hai
thứ chỉ nằm trong bộ nhớ tiến trình. Còn hai lối, cả hai ngoài code: **nâng gói**, hoặc **xin nhà
cung cấp endpoint nhả theo `install_id`** (cái này bền trên đĩa).

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
| [01](phase-01-quet-don-profile-mo-coi-luc-khoi-dong.md) | Quét dọn profile mồ côi lúc khởi động | **xong**, đang nghiệm thu |
| [02](phase-02-mo-hinh-suc-chua-va-trang-thai-cho.md) | Mô hình sức chứa + trạng thái chờ giải phóng | chưa |
| [03](phase-03-ui-chan-truoc-khi-bam.md) | UI: đồng hồ sức chứa, chặn trước khi bấm | chưa |
| [04](phase-04-ngon-ngu-operator.md) | Chuỗi tiếng Anh dễ hiểu, không lộ tên engine | chưa |

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

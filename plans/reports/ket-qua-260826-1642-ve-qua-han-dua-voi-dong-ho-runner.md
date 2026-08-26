# Vé quá hạn đua với đồng hồ runner — 26 August 2026

## Tóm tắt

CI MKTTool đỏ đúng **một** assertion: `vé quá hạn bị chặn`, trong job `relay-executable`
(run `32947403735`). Nguyên nhân gốc là **lỗi của test**, không phải sản phẩm: nó backdate vé
đúng 1 ms quá hạn, rồi so đồng hồ treo tường qua ranh giới tiến trình.

Sản phẩm từ chối vé quá hạn đúng. Đã sửa test, nghiệm thu cục bộ xanh.

## Triệu chứng

Push chỉ chứa markdown (2 commit docs) làm job đỏ. Job `check` (lint/typecheck/test) pass.
Log CI in đúng một dòng, không kèm lý do:

```
FAIL  vé quá hạn bị chặn
```

## Đường đi tới gốc

| Bước | Kết quả |
|---|---|
| Diff sắp push có gì | Chỉ markdown. Không thể gây lỗi build exe |
| Unit test logic vé tại máy | `ticket-lifecycle` + `handle-ticket` **32/32 pass**, gồm case EXPIRED |
| Nghiệm thu exe đóng gói tại máy | **PASS**, exit 0 — không tái hiện được |
| Lịch sử job | Chỉ chạy 3 lần: 2 pass, 1 fail. Image runner `mkt-ci-windows` vừa đổi 26/08 |
| Đọc thứ tự kiểm trong verifier | MALFORMED → UNKNOWN_FORMAT → RELAY_TOO_OLD → UNKNOWN_KIND → **EXPIRED** → WRONG_DEVICE → ALREADY_USED |

Loại trừ được:

- **RELAY_TOO_OLD** — `minRelayVersion` chỉ phụ thuộc `kind`, không phụ thuộc thời gian.
- **4 mã trước EXPIRED nói chung** — các vé trước đó dùng cùng `issueTicket` và đều qua được.
- **Sai thứ tự kiểm** — hạn kiểm ở dòng 190, tiêu vé ở dòng 203. Hạn trước, replay sau. Đúng.
- **Runner chậm / timeout** — hai dòng log cách nhau **20 ms**.

## Cơ chế

`TICKET_LIFETIME_MS = 30_000`. Issuer đặt `exp = now + TICKET_LIFETIME_MS`.

Test gọi `issueTicket(..., Date.now() - TICKET_LIFETIME_MS - 1)` → `exp = Date.now() - 1`.

Vé hết hạn **đúng 1 ms**. Nhưng `exp` tính ở tiến trình test, còn `now` do Relay tự đọc trong
tiến trình của nó, sau một vòng HTTP. Đồng hồ hệ thống chỉnh **lùi** quá 1 ms trong khoảng đó
→ vé còn hạn → lọt verify → chết ở bước mở browser → `rejectionCode` **rỗng** →
`rejectionCode === "EXPIRED"` sai → đỏ.

Runner self-hosted là máy ảo. Máy ảo chỉnh lùi đồng hồ theo host.

## Đã sửa

| Commit | Nội dung |
|---|---|
| `1096d3d` | Check in ra mã từ chối thực tế. Trước đó chỉ có `FAIL` câm, không phân biệt được "nhận vé quá hạn" với "từ chối vì lý do khác" |
| `c67b901` | Backdate cả một lifetime thay vì 1 ms. Cùng code path, biên không đồng hồ nào vượt qua nổi |

Biên chính xác vẫn được assert ở `ticket-lifecycle.test.ts` với đồng hồ tiêm vào — chỗ duy nhất
phép so đó đủ tất định để đáng làm.

## Nghiệm thu cục bộ

| Gate | Kết quả |
|---|---|
| typecheck | pass |
| lint | pass |
| `npm test` | **1908/1908**, 208 file |
| `relay:verify` trên exe vừa build | exit 0, `vé quá hạn bị chặn — EXPIRED` |

## Xác nhận trên CI

Run `32954797133` xanh trên chính runner self-hosted đã đỏ trước đó. `check` success,
`relay-executable` success. Dòng bằng chứng:

```
PASS  vé quá hạn bị chặn — EXPIRED — Vé đã quá hạn. Bấm lại nút vừa bấm.
```

Mã từ chối hiện ra trong log là nhờ `1096d3d`; trước đó cùng dòng này chỉ in `FAIL` trống.

## Ghi chú

- Relay đã cài của operator bị tắt tạm để giải phóng cổng 47821, đã bật lại. Harness fail-closed
  khi cổng bận là hành vi đúng — nó từ chối đo nhầm bản khác.
- `relay/src/handle-secret.test.ts:187` dùng cùng kiểu biên `+1`, nhưng `now` tiêm vào trong cùng
  tiến trình, cách nhau micro-giây. Không cùng rủi ro, để nguyên.

## Câu hỏi chưa giải

1. Chưa có bằng chứng trực tiếp rằng đồng hồ runner đã chỉnh lùi — mới là suy luận loại trừ.
   Fix đúng bất kể nguyên nhân nào, vì biên 1 ms trên đồng hồ treo tường luôn sai. Nhưng nếu
   runner thật sự trôi đồng hồ thì còn gate nhạy thời gian khác có thể trúng.
2. Runner self-hosted vẫn **persistent** chứ không ephemeral. Phase-02 đã ghi đây là ranh giới
   yếu; nó cũng là nơi trạng thái thừa giữa các lượt chạy có thể tích lại.

# Phase 03 — UI: đồng hồ sức chứa, chặn trước khi bấm

**Ưu tiên:** cao · **Trạng thái:** chưa bắt đầu · **Cần [phase-02](phase-02-mo-hinh-suc-chua-va-trang-thai-cho.md)**

## Bối cảnh

- [plan.md](plan.md)

## Vấn đề

Operator bấm Open → chờ → nhận lỗi. Trong khi app **đã biết trước** là sẽ hỏng. Lỗi sau khi bấm là
thứ tệ nhất trong ba lựa chọn:

1. Nút tắt sẵn kèm lý do ← đích
2. Nút bật, bấm xong hiện lời giải thích rõ ràng
3. Nút bật, bấm xong hiện mã lỗi kỹ thuật ← đang ở đây

## Điểm mấu chốt

Chỗ hiển thị đã có mầm sẵn: `runningCount` ở [`App.tsx:314`](../../MKTBrowser/apps/desktop/src/renderer/src/App.tsx#L314)
đang được tính mà chưa dùng vào việc gì đáng kể. Đổi nó thành `x/y` là thay đổi nhỏ, giá trị lớn.

Trạng thái `cooling-down` **bắt buộc** phải hiển thị được, vì đó là lúc màn hình nói "0 đang chạy"
mà vẫn không mở được — nếu không giải thích thì operator sẽ nghĩ app hỏng.

## Yêu cầu

**Chức năng**
- Đồng hồ sức chứa trên thanh trên cùng: `Đang chạy 1/1`
- `limit === null` ⇒ hiện `Đang chạy 1` (không bịa mẫu số)
- Nút Open/Launch **tắt** khi `state === "full"` hoặc `"cooling-down"`, kèm tooltip nói lý do
- `cooling-down` hiện dòng riêng: *"Phiên trước chưa được đóng đúng cách. Chờ khoảng N phút rồi thử lại."*
- Profile **đang chạy** thì nút Open vẫn bật (chuyển tab, không tốn thêm chỗ)

**Phi chức năng**
- Không có spinner giả. Nút tắt là tắt, kèm lý do.
- Đồng hồ phải cập nhật theo sự kiện, không poll

## Kiến trúc

```
main: CAPACITY_CHANGED --IPC--> preload --> App.tsx (state)
                                              |
                        +---------------------+---------------------+
                        |                     |                     |
                  CapacityMeter        ProfileTile           ProfileRow
                  (thanh tren)         (nut Open)            (nut Open)
```

Component mới:

```
apps/desktop/src/renderer/src/components/capacity/CapacityMeter.tsx
apps/desktop/src/renderer/src/components/capacity/use-launch-blocked.ts
```

`useLaunchBlocked(profile, capacity)` trả `{ blocked: boolean, reason: string | null }` — **một**
chỗ quyết định, dùng chung cho Tile và Row, tránh hai nơi tự suy luận rồi lệch nhau.

## File liên quan

**Tạo**
- `components/capacity/CapacityMeter.tsx`
- `components/capacity/use-launch-blocked.ts`
- `components/capacity/use-launch-blocked.test.ts`

**Sửa**
- `App.tsx` — nhận `CAPACITY_CHANGED`, thay `runningCount` bằng snapshot, đặt `CapacityMeter`
- `components/profile/ProfileTile.tsx` — dùng `useLaunchBlocked`
- `components/profile/ProfileRow.tsx` — dùng `useLaunchBlocked`
- `components/palette/CommandPalette.tsx` — mục Launch phải mờ đi khi bị chặn

## Các bước

1. `use-launch-blocked.ts` thuần + test (bảng: available/full/cooling-down/unknown × đang chạy/không)
2. `CapacityMeter.tsx`, xử lý cả trường hợp `limit === null`
3. Nối IPC vào `App.tsx`
4. Thay call site ở Tile, Row, CommandPalette
5. lint + nhìn bằng mắt

## Todo

- [ ] `useLaunchBlocked` + test
- [ ] `CapacityMeter`
- [ ] nối IPC ở `App.tsx`
- [ ] Tile / Row / CommandPalette
- [ ] lint
- [ ] nhìn bằng mắt: 4 trạng thái

## Tiêu chí đạt

Nhìn bằng mắt, 4 tình huống:

| Tình huống | Phải thấy |
|---|---|
| Không có gì chạy | `Đang chạy 0/1`, nút Open bật |
| Đang chạy 1 profile | `Đang chạy 1/1`, nút Open của **profile khác** tắt kèm lý do |
| Vừa tắt cứng app xong | `cooling-down` + dòng giải thích + số phút |
| Chưa biết sức chứa | `Đang chạy 0`, không bịa mẫu số, nút vẫn bật |

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Chặn nhầm khi sức chứa `unknown` | `unknown` **không** chặn — thà để engine từ chối còn hơn chặn oan |
| Hai chỗ (Tile/Row) suy luận lệch nhau | Một hook duy nhất, có test |
| Đồng hồ đếm ngược sai làm mất niềm tin | Hiện "khoảng N phút", không đếm từng giây |

## Bảo mật

Không có. Chỉ là lớp hiển thị.

## Bước tiếp

[phase-04](phase-04-ngon-ngu-operator.md) chốt chữ nghĩa cho đúng người đọc.

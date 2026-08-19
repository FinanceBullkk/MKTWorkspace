# Phase 04 — Flow người dùng + layout

**Ưu tiên:** P1 · **Trạng thái:** chưa bắt đầu

## Chẩn đoán: UI mới thiếu cái gì

Bản Gemini vẽ **kho** (bao nhiêu profile, tag gì) nhưng không vẽ **việc** (mở được chưa,
kẹt ở đâu, làm gì tiếp). Trong khi `describeAccountReadiness()` đã tính sẵn 11 blocker
kèm câu `fix` viết ở dạng bấm-được — và UI mới **không đọc nó một lần nào**.

Tile hiện dành chỗ đắt nhất cho thứ trang trí (emoji avatar băm từ tên, hai tag cứng
`mkttool`/`tiktok`, filter "Running" luôn = 0) trong khi thứ operator cần biết —
*"tại sao nick này chưa mở được"* — không có mặt.

## Flow: 5 việc, không phải 1

```
J0  Dựng máy (1 lần/máy)       /setup      tải MKT Browser -> ghi máy
J1  Nhập proxy (theo lô)       /proxies    thêm -> kiểm tra sống -> còn rảnh
J2  Tạo profile (theo tuần)    /           + Kênh mới -> chọn proxy rảnh -> ghim máy+chủ
                                           -> tạo profile antidetect -> đăng nhập lần đầu
J3  Chạy (hằng ngày)           /           tile -> [Mở profile]
J4  Xử lý hỏng (khi có)        /           dải "Cần xử lý" trên đầu
```

**J2 là chỗ đau nhất và cũng là chỗ UI mới bỏ qua.** Tạo bản ghi xong nick vẫn chưa chạy
được: còn thiếu `antidetectProfileId` và lần đăng nhập đầu. Sheet hiện đóng lại sau khi lưu
và không nói gì tiếp, nên operator tưởng đã xong. Phải nối tiếp: lưu xong thì tile hiện ngay
*"Chưa có profile antidetect — Tạo profile"*.

## Layout `/`

```
+------+----------------------------------------------------------------+
| rail |  MKT Tool   [ tìm profile, proxy, ghi chú... ]  7/12 sẵn sàng   |
|  4   |                                     ● AnhHao v15    cài  người |
| mục  +----------------------------------------------------------------+
|      |  ! Cần xử lý — 2                        [ chỉ hiện khi có ]     |
|      |  • Proxy VN-03 chết 2 ngày -> Kiểm lại                          |
|      |  • Máy "Linh-PC" bị thu hồi, 3 nick ghim vào -> Ghi lại máy     |
|      +----------------------------------------------------------------+
|      |  Kênh   12 tổng · 7 sẵn sàng · 3 đang ấm · 2 kẹt                |
|      |                                    [grid|list]  [ + Kênh mới ]  |
|      |  [Tất cả 12] [Sẵn sàng 7] [Đang ấm 3] [Kẹt 2]                   |
|      |                                                                 |
|      |  +-----------+ +-----------+ +-----------+                      |
|      |  |   tile    | |   tile    | |   tile    |                      |
|      |  +-----------+ +-----------+ +-----------+                      |
+------+-----------------------------------------------------------------+
```

### Filter đọc thẳng từ readiness — không nghĩ trạng thái mới

| Chip | Điều kiện | Nguồn |
|------|-----------|-------|
| Sẵn sàng | `blockers.length === 0` | `describeAccountReadiness()` |
| Đang ấm | chỉ có blocker `waitingOnly` (COLD_START) | cờ `waitingOnly` đã có sẵn |
| Kẹt | có blocker **không** `waitingOnly` | " |

Bỏ hẳn chip **Running** và **Idle**: không có model nào lưu phiên đang mở, nên "running"
hôm nay là số bịa. Muốn có thật thì phải để relay báo phiên về — việc riêng, phase khác.

### Tile: 4 tầng, tầng nào cũng trả lời một câu hỏi

```
+------------------------------------------+
|  @kenh_review_01                     ... |  ai
|  VN 103.x.x.x · máy AnhHao               |  chạy bằng IP nào, trên máy nào
+------------------------------------------+
|  ● Đang ấm — còn 4 ngày                  |  blocker.label
|    Chỉ xem và tương tác nhẹ, chưa đăng   |  blocker.fix
+------------------------------------------+
|            [   Mở profile   ]            |  1 động từ
+------------------------------------------+
```

- Kẹt thì nút **disabled**, kèm đúng câu `fix` và link tới nơi sửa:
  `NO_PROXY` → `/proxies`, `NO_DEVICE` → `/relay-devices`, `NO_PROFILE` → `/accounts/[id]`
- Nhiều blocker thì hiện cái **chặn nặng nhất**, số còn lại thu thành `+2`
- Bỏ emoji avatar băm từ tên và hai tag cứng — chiếm chỗ mà không mang tin

### Top bar

- `7/12 sẵn sàng` thay cho `0 running · 12 total`
- Ô search: **nối dây thật.** Hiện `search` state nằm trong `AppShell`, `Constellation` nhận
  `searchQuery=""` mặc định, `page.tsx` không truyền → gõ gì cũng không lọc.
  Rẻ nhất: bỏ search khỏi `AppShell`, đặt vào `Constellation` (nơi có dữ liệu).
- Ký hiệu `⌘` đổi thành `Ctrl` — công cụ này chỉ chạy Windows.

## Việc

1. `page.tsx` — map thêm `readiness: describeAccountReadiness(acc)` vào mỗi profile
2. `Constellation.tsx` — filter theo readiness; bỏ chip Running/Idle; nhận quyền sở hữu ô search
3. `ProfileTile.tsx` / `ProfileTable.tsx` — dựng lại theo 4 tầng trên
4. `AppShell.tsx` / `TopBar.tsx` — bỏ search state; đổi counter sang "sẵn sàng/tổng"
5. Dải "Cần xử lý" — dùng lại khay alert ở phase-02, thêm nhánh readiness rollup
6. Lưu profile mới xong thì không đóng sheet im lặng; đưa về tile kèm bước tiếp theo

## Success criteria

- Mỗi tile trả lời được "mở được không, nếu không thì làm gì" mà không cần bấm vào
- Gõ vào ô search thì lưới lọc thật
- Không còn con số nào không có nguồn dữ liệu

# TASK BRIEF — sửa stall `Input.dispatchMouseEvent` trong tiktok-e2e.mjs

**Người làm:** DeepSeek · **Người review:** Claude · **File duy nhất được sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

Đọc kèm: `review-260820-1345-tiktok-e2e-relay-scroll.md` (mục F6 — dữ liệu đầy đủ).

## 1. Triệu chứng

Vòng scroll dùng CDP `Input.dispatchMouseEvent` (mouseWheel). Khoảng **50% số lần khởi động engine**, lệnh này **không bao giờ nhận được reply** → scroll 0/5. Đã đo bằng instrumentation có sẵn trong file.

## 2. Dữ liệu đã đo (KHÔNG cần đo lại)

| run | dispatch ms mỗi burst | eval ms | lateAcks | scroll |
|---|---|---|---|---|
| instr1 | 81, 18, 11, 16, 12 | 1–3 | none | 4/5 |
| instr2 | 87, 15, 9, 9, 15 | 1–3 | none | 4/5 |
| instr3 | 15008, 15009, 15015, 15015, 15005 | 1–3 | **[]** | 0/5 |

Ba điều đã được chứng minh, **đừng đi lại các hướng này**:

1. **Không phải timeout quá ngắn.** Đã thử nâng 4s→15s: treo trọn 15s rồi vẫn timeout. Lúc khỏe chỉ 9–18ms — cách 3 bậc độ lớn.
2. **Không phải renderer nghẽn.** `Runtime.evaluate` chạy 1–3ms **ngay giữa lúc** wheel treo. Giả thuyết trong header file (`--keep-gpu`: software decode làm nghẽn renderer main thread) **sai** — smoke13 (GPU ON) và smoke14 (GPU OFF) đều 4/5.
3. **Lệnh mất hẳn, không phải chậm.** `lateAcks: []` sau khi chờ thêm ~80s. Cùng WebSocket đó Runtime vẫn trả lời. Kẹt khu trú ở **Input domain**.

**Quan trọng — stall là trạng thái của cả phiên, không phải từng burst.** Mọi run trong 12 run đều là 5-timeout hoặc 0-timeout, **không run nào lẫn lộn**. Điều kiện hỏng được định đoạt lúc khởi tạo phiên, trước cái wheel đầu tiên.

## 3. Việc cần làm

### 3.1 Thử giả thuyết focus/visibility (chính)

Triệu chứng khớp hành vi Chromium khi widget renderer không ở trạng thái hiển thị/nhận focus: input đi từ browser process xuống widget, ack chỉ về sau khi input được xử lý — cửa sổ bị che thì ack không bao giờ về. Tỉ lệ ~50% khớp với việc cửa sổ mở lên có bị cửa sổ khác che hay không (phụ thuộc môi trường, không phụ thuộc code).

Làm **theo thứ tự, dừng lại khi đã đủ**:

1. `await page.send("Page.bringToFront")` ngay **trước** vòng wheel (sau đoạn poll feed-ready).
2. Nếu vẫn stall: thêm `await page.send("Emulation.setFocusEmulationEnabled", { enabled: true })`.

Cả hai bọc try/catch, **non-fatal** (xem invariant 3).

### 3.2 Trả timeout dispatch về 4000ms

Hiện đang để 15000 chỉ để đo. Đã đo xong → trả về `4000`. Để 15s làm mỗi run hỏng kéo dài gấp 4 lần vô ích.

### 3.3 GIỮ NGUYÊN instrumentation

**Không được xoá** — đó là cách nghiệm thu:
- `timedOut` map + mảng `lateAcks` trong `connectPage`
- `result.scroll.timings` (dispatchMs / evalMs / timedOut mỗi burst)
- `result.scroll.lateAcks`
- dòng log `scroll done ... | dispatch ms: ... | late acks: ...`

## 4. Invariants — không được làm hỏng

1. **Relay forward verbatim** — chỉ đọc body/header, không sửa.
2. **`endInFlight` vs `endSeen` là hai thứ khác nhau.** `endInFlight` set khi request session/end **đến**; `endSeen` **chỉ** set khi upstream trả **2xx**. Đừng gộp lại — gộp là seat kẹt 15 phút khi upstream lỗi.
3. **Scroll non-fatal** — mọi thứ trong vòng scroll có try/catch, run luôn ghi ra JSON.
4. **exitCode không null** — giữ double-write.
5. **Không 2 profile cùng lúc** — plan free limit=1. Chạy tuần tự.
6. **`closeAllConnections()` trước `server.close()`** trong relay.close — bỏ đi là process treo vĩnh viễn khi upstream stall (đã đo).
7. **`movedBy` phải so `container.key`** trước khi so `container.top` — hai snapshot có thể chọn nhầm hai element khác nhau (đã quan sát: `tiktok-1mjhtgd-7937d88b-- CHANGED->enable-1col-refine tiktok`).

## 5. Đừng làm những thứ này

- **Đừng retry wheel trong cùng run.** Stall là trạng thái cả phiên → retry chắc chắn vô ích.
- **Đừng thêm "warm-up wheel".** Giả thuyết "TikTok nuốt wheel đầu" chỉ đúng cho ca *khác* (dispatch ack 81ms mà không di chuyển). Trộn hai ca vào một cách chữa là sai.
- **Đừng nâng timeout thêm nữa.** Đã chứng minh vô dụng.
- **Đừng đụng vào relay/license** — phần đó đã xác minh sạch qua 5 run hôm nay.

## 6. Nghiệm thu

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node poll-seat.mjs                        # xác nhận seat trống trước khi đo
node tiktok-e2e.mjs --tag fix1 --no-login # chạy TUẦN TỰ, chờ run trước xong hẳn
node tiktok-e2e.mjs --tag fix2 --no-login
node tiktok-e2e.mjs --tag fix3 --no-login
node tiktok-e2e.mjs --tag fix4 --no-login
node tiktok-e2e.mjs --tag fix5 --no-login
```

Nộp lại: 5 dòng `scroll done ...` (có `dispatch ms` và `late acks`), + `exitCode`/`relay` từ mỗi JSON.

**Đạt:** 5/5 run không có burst nào `dispatchMs > 1000`.
**Không đạt:** còn run nào 5-timeout → giả thuyết focus sai, báo lại, đừng tự đoán tiếp.

Lưu ý thống kê: tỉ lệ hỏng nền ~50%, nên 5 run sạch liên tiếp mới đủ tin (p ≈ 0.03). **3 run sạch chưa kết luận được gì** — đúng cái bẫy đã làm handoff trước overclaim "B ✅" dựa trên n=2.

## 7. Câu hỏi chưa giải

1. Cái gì quyết định phiên nào bị stall? Chưa biết. Nếu `Page.bringToFront` chữa được thì nguyên nhân là visibility; nếu không thì phải tìm hướng khác — không đoán bừa.
2. `--minimal` và `--keep-gpu` có sẵn trong file: sau khi fix nên chạy đối chứng `--keep-gpu` 1 lần để chắc fix không phụ thuộc chế độ GPU.

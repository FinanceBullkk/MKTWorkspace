# REVIEW — nghiệm thu Việc D1 (ép occlusion)

**Report được review:** `ket-qua-260821-0957-ep-occlusion-tai-hien-stall.md` (Cline/DeepSeek)
**Brief gốc:** `handoff-260821-0232-ep-occlusion-tai-hien-stall.md`
**Người review:** Claude · **Ngày:** 21/08/2026 10:19 UTC+7
**Phạm vi kiểm chứng:** `tiktok-e2e.mjs` (patch D1), `probe-tiktok-occ{1,2,3}.json` + `.log`, đối chiếu ngược raf01–05.

---

## Kết luận

| | Kết quả |
|---|---|
| **Phần 0 — sửa report 2225** | **ĐẠT.** Cả 5 điểm F1–F5 đã sửa đúng, không đổi số liệu. |
| **D1 — code** | **ĐẠT.** Sạch, đúng hợp đồng, gated sau cờ, invariants nguyên. |
| **D1 — kết luận cơ chế** | **XANH, nhưng hẹp hơn report tuyên bố.** Xem G1. |
| **D3 — thiết kế trong brief 0232** | **PHẢI SỬA TRƯỚC KHI CHẠY.** Lỗi của tôi, dữ liệu D1 mới lộ ra. |

15/15 dòng burst của occ1–occ3 **khớp 100%** với `scroll.timings` trong JSON. Không gian lận.

---

## Code — đạt

- `--force-occlusion` mặc định TẮT, occ3 xác nhận: `occlusionCmd` null toàn phiên, `occlusionHwnd=null`. Invariant #10 giữ.
- `windowCmd` dùng `-EncodedCommand` (né quoting), **`windowsHide: true`** (quan trọng — cửa sổ console PowerShell mà hiện ra thì tự nó thành vật che, hỏng phép đo), non-fatal đúng invariant #3, fallback duyệt process con khi `MainWindowHandle=0`, sleep 800ms cho OS ổn định.
- Ghi đủ `occlusionCmd` / `occlusionOk` / `occlusionHwnd`. hwnd thật khác 0 ở occ1 (`107940080`) và occ2 (`108333296`) → **đã minimize thật**, không rơi vào nhánh "lỗi công cụ".
- Không CDP giả lập visibility, không cure, không retry, không JS-scroll. `node --check` pass.

---

## G1 — Ép minimize tái hiện SAI biến thể (nghiêm trọng, phá thiết kế D3)

Đây là phát hiện chính của đợt review này.

Đếm toàn bộ burst stall **tự nhiên** (không có lệnh) qua raf01–05 + occ2 + occ3:

| Chữ ký | Số burst | Ở đâu |
|---|---|---|
| `vis=hidden` + **`focus=true`** | **21 / 24** | raf01, raf02, raf03, occ2 b2, occ3 |
| `vis=hidden` + `focus=false` | 3 / 24 | raf04 b3–5 |

Còn burst stall **do lệnh minimize**:

| Chữ ký | Số burst |
|---|---|
| `vis=hidden` + **`focus=false`** | **4 / 4** (occ1 b3–4, occ2 b3–4) |

→ `SW_MINIMIZE` tái hiện được biến thể **thiểu số** (3/24). Biến thể **áp đảo** — cửa sổ bị che nhưng trang **vẫn giữ DOM focus** — thì **chưa hề ép được**.

**Vì sao chuyện này phá D3:** cờ `--disable-features=CalculateNativeWindowOcclusion` và `--disable-backgrounding-occluded-windows` nhắm vào **occlusion detection** (cửa sổ bị cửa sổ khác đè). Cửa sổ **minimized** bị đánh dấu hidden qua đường khác (widget visibility từ WM_SIZE/SC_MINIMIZE), gần như chắc chắn **không** chịu ảnh hưởng của các cờ đó.

Nên D3 theo thiết kế cũ — giữ `--force-occlusion` (= minimize) ở cả hai nhánh — nhiều khả năng cho ra "cờ không có tác dụng", rồi bị đọc thành "occlusion không phải nguyên nhân". **Sai, và sai theo hướng khó phát hiện.** Đây là lỗi trong brief 0232 của tôi, không phải lỗi người làm.

**Sửa:** thêm chế độ ép thứ hai — **"cover"**: dựng một cửa sổ khác phủ kín lên browser mà **không** minimize nó (cửa sổ full-screen luôn-trên-cùng). Chế độ này mới tái hiện `hidden` + `focus=true`. Chi tiết ở mục "D2.5" cuối báo cáo.

---

## G2 — occ1 KHÔNG chứng minh scroll hồi phục (report gọi nhầm là "sạch")

Report ghi burst 5 của occ1: *"restore → sạch (4002ms→3ms)"*. Số dispatch đúng, nhưng chữ "sạch" sai.

`scroll.ok` của occ1 = **0/5**. Không burst nào làm feed nhúc nhích, kể cả burst 1, 2, 5. Lý do nằm trong JSON:

- `vids = 0` suốt cả run — **trang không có video nào**
- `container = "none"`, `vTop = "?"` — **không có phần tử cuộn được nào**
- `winY 8->8` (các run khác là 0)

Feed của occ1 **chưa bao giờ dựng lên**. Nên burst 1/2/5 chỉ chứng minh **ack nhanh**, không chứng minh cuộn được. Report bỏ cột `ok` khỏi bảng (brief tôi viết cũng không yêu cầu cột đó — lỗi chia đôi), nên chỗ này trôi qua.

**Chứng minh thật nằm ở occ2**, không phải occ1: `ok=2/5`, và đúng 2 burst cuộn được là b1 (trước khi bị che) và **b5 (sau restore)**. Đó mới là "stall tắt được theo lệnh" ở mức kết quả thật, không chỉ mức ack.

Kết luận cơ chế vẫn đứng — nhưng đứng trên occ2. Phải viết lại cho đúng.

---

## G3 — `lateAcks`: bằng chứng mạnh nhất của đợt này, report không nộp

Nằm sẵn trong JSON, chưa ai nhắc:

| run | lateAcks |
|---|---|
| occ1 | `Input.dispatchMouseEvent@8318ms`, `@16061ms` |
| occ2 | `@16867ms`, `@29346ms`, `@8512ms` |

Các wheel đã timeout ở 4000ms **về sau vẫn ack**, `error: null`. Nghĩa là:

- Input domain **không chết**, lệnh **không mất** — chỉ bị treo chờ.
- Cái nó chờ là frame production. Không có frame → không có ack.
- Ack dồn lại **xả ra khi cửa sổ trở lại** (occ1 ack 16061ms rơi đúng quanh mốc restore trước burst 5).

Đây là mảnh khép kín chuỗi nhân quả theo chiều thứ ba, độc lập với `rafFps` và `vis`. Phải đưa vào report.

---

## G4 — occ3 là đối chứng ĐÃ SUY GIẢM, và occlusion còn chặn cả page load

occ3: `titleGate.titleArrived=false`, `title=""`, `waitedMs=15330`.

Brief 1553 từng chốt "title rỗng chỉ là tạm thời" — occ3 phá điều đó, và phá đúng ở run bị che cả phiên.

**Đính chính (21/08 12:20):** occ3 **không** phải lần đầu — `raf03` cũng có `titleArrived=false`. Đếm lại: đúng **2** run có title không bao giờ tới, và **cả hai đều là run bị che cả phiên** (raf03, occ3), trong khi 6 run còn lại đều `true`. Tương quan vì thế **mạnh hơn** chứ không yếu đi — 2 điểm dữ liệu thay vì 1 — nhưng câu "lần đầu tiên" là sai và đã bỏ.

Hai hệ quả:

1. Occlusion **không chỉ** chặn wheel ack — nó chặn cả việc trang dựng xong. Đây là hậu quả mới, chưa có trong mô hình.
2. occ3 vì thế **không phải** đối chứng "y hệt nhưng không cờ". Trang nó ở trạng thái tệ hơn mọi run trước. Dùng được để xác nhận invariant #10 (không cờ → không có lệnh occlusion), **không** dùng được để so sánh hành vi.

---

## G5, G6 — hai điểm nhỏ

**G5.** Ở occ2, lệnh minimize ở burst 3 là **no-op**: cửa sổ đã `hidden` từ burst 2 (tự nhiên). Chuyển trạng thái thật duy nhất của occ2 là **restore ở burst 5**. Report trình bày occ2 như thể minimize có tác dụng ở đó.

**G6.** Report đọc occ3 là *"lặp lại đúng bẫy F4 — occlusion cụm theo thời gian"*. Yếu: occ1 (09:58) và occ2 (09:59) đều **có** giai đoạn visible trong cùng cửa sổ 3 phút với occ3 (10:01). Ba run liền nhau mà khác nhau hẳn về trạng thái cửa sổ lúc khởi động → nghiêng về **"cửa sổ mới mở lên trên hay lên sau"**, không phải "cả cụm thời gian bị che". Cách đọc này còn dẫn thẳng tới câu hỏi "ai che".

---

## Cơ chế — chốt lại phạm vi thực sự đã chứng minh

**Đã chứng minh (occ1 + occ2, có lệnh, lặp lại được):**

```
minimize -> vis=hidden -> rafFps=0 -> wheel không ack trong 4000ms -> timeout
restore  -> vis=visible -> rafFps 127-144 -> ack 3-12ms  [+ ack tồn đọng xả ra]
```

Bật/tắt theo lệnh, hai chiều, 2/2 run. Nhánh "ép mà vẫn visible" (lỗi công cụ) và nhánh "hidden mà không stall" (cơ chế sai) **đều không xảy ra**.

**CHƯA chứng minh:**

- Biến thể tự nhiên áp đảo (`hidden` + `focus=true`, 21/24 burst) — chưa ép được lần nào (G1).
- "Ai che" — vẫn nguyên câu hỏi.
- Liệu `visibilityState` hay việc compositor ngừng sinh frame mới là biến thao tác — minimize đổi cả hai cùng lúc.

Nói gọn: **đã chứng minh occlusion gây stall. Chưa chứng minh occlusion tự nhiên trong các run trước là cùng một occlusion.** Khoảng cách này nhỏ nhưng đúng chỗ D3 sẽ vấp.

---

## Yêu cầu sửa report 0957

1. Bỏ chữ "sạch" cho occ1 burst 1/2/5 → chỉ "ack nhanh". Thêm `scroll.ok` vào bảng cả 3 run (occ1 **0/5**, occ2 **2/5**, occ3 **0/5**), kèm ghi chú occ1 `vids=0` / `container=none` → feed chưa dựng. *(G2)*
2. Ghi rõ chứng minh hồi phục **dựa trên occ2**, không phải occ1. *(G2)*
3. Thêm bảng `lateAcks` của occ1/occ2 + một dòng: wheel timeout vẫn ack về sau, ack gated theo frame. *(G3)*
4. Thêm `titleGate` của occ3 (`titleArrived=false`, `waitedMs=15330`) và hạ occ3 xuống "đối chứng đã suy giảm". *(G4)*
5. Ghi minimize ở occ2 burst 3 là no-op. *(G5)*
6. Bỏ cách đọc "occlusion cụm theo thời gian" cho occ3 — occ1/occ2 cùng cửa sổ thời gian vẫn có giai đoạn visible. *(G6)*
7. Thêm bảng đếm chữ ký focus (21/24 tự nhiên là `focus=true` vs 4/4 do lệnh là `focus=false`). *(G1)*

Không cần chạy lại run nào.

---

## D2.5 — việc mới, PHẢI chạy trước D3

Thêm chế độ ép thứ hai, `--force-occlusion=cover`:

- Dựng một cửa sổ khác **phủ kín** màn hình chứa browser, **topmost**, và **không** lấy focus nếu làm được (`SWP_NOACTIVATE` / `WS_EX_NOACTIVATE`). Không minimize browser.
- Vẫn minimize/restore theo lịch cũ ở chế độ `--force-occlusion=minimize` (giữ nguyên, đã hoạt động).
- Lịch giữ nguyên: che trước burst 3, bỏ che trước burst 5.

**Nghiệm thu:** chạy `cov1`, `cov2`. **Đạt** = burst 3–4 có `vis=hidden` **và `focus=true`** — tức tái hiện đúng chữ ký tự nhiên 21/24. Nếu ép cover mà `vis` vẫn `visible` → occlusion detection của Chromium không coi đó là bị che, báo lại, **đừng** tự chỉnh sang minimize.

Chỉ khi có `cov*` xanh, D3 mới chạy được, và khi đó:

**D3 sửa lại — A/B trên chế độ `cover`, xen kẽ:**

```
ab1 (không cờ, --force-occlusion=cover)   <- control, BẮT BUỘC stall b3-4
ab2 (CÓ cờ,   --force-occlusion=cover)
ab3 (không cờ, --force-occlusion=cover)
ab4 (CÓ cờ,   --force-occlusion=cover)
```

Luật đọc giữ nguyên: control không stall → **cả đợt vô hiệu**, không phải "cờ đã chữa".

**Thêm một dự đoán viết trước:** chạy kèm 1 cặp trên chế độ `minimize`. Dự đoán — cờ **giúp ở `cover`, KHÔNG giúp ở `minimize`**. Nếu cờ cứu được cả `minimize` thì mô hình của tôi về hai đường hidden là sai, và đó cũng là thông tin tốt. Điểm mấu chốt: đừng thiết kế thí nghiệm chỉ nhìn được một biến thể.

---

## Câu hỏi chưa giải

1. **"Ai che" — vẫn chưa trả lời**, và G6 làm nó gắt hơn: 3 run cách nhau 1 phút mà trạng thái cửa sổ lúc khởi động khác hẳn nhau. Nghi phạm chuyển từ "cụm thời gian" sang **"cửa sổ mới mở lên trên hay lên sau"**. Rẻ để kiểm: ghi z-order / foreground window ngay sau launch.
2. Vì sao occ1 không dựng được feed (`vids=0`, `container=none`) trong khi vẫn `visible` và `rafFps=144`? Không phải occlusion. Có thể là họ hàng của chế độ hỏng thứ ba r2b.
3. `SudoMaker Virtual Display Adapter` — chưa ai kiểm. `rafFps` giờ đã thấy 123–144, càng nghi không có vsync thật.
4. Nợ cũ chưa trả: `clickPoint` chưa đẩy timing vào `result` JSON (**chặn login thật**); chế độ hỏng thứ ba của r2b chưa điều tra.

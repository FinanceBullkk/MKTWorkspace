# VERIFY — Nghiệm thu độc lập R1–R4 + F4, và hai phát hiện mới

**Kiểm:** `review-260820-1436-nghiem-thu-fix-input-dispatch-stall.md` (bản 15:00)
**Phương pháp:** đọc thẳng 34 file `probe-tiktok-*.json` + đọc code `tiktok-e2e.mjs`, không dựa vào bảng trong report.
**Thời gian:** 20/08/2026 15:17

---

## Verdict: ✅ ĐẠT — mọi số trong bảng đúng. 4 chỗ suy luận cần sửa, 2 phát hiện mới.

Toàn bộ 8 dòng bảng nghiệm thu khớp 100% với JSON. R2/R3/R4/F4 đã có mặt trong code, đúng như mô tả.
Phần cần sửa nằm ở **luận chứng thống kê**, không ở kết quả.

---

## 1. Bảng số liệu — đối chiếu từng dòng

| Dòng report | Report ghi | JSON đo được | |
|---|---|---|---|
| fix1–fix5 | 4/5 ×5, max 359ms | 4/5 ×5; dispatch max 359/42/20/92/21 | ✅ |
| instr3 | 0/5, 15015ms | 0/5, 15015ms, 5 timedOut | ✅ |
| r2a–r2e | 3–4/5 ×5, max 261ms | 4,3,4,4,4; max 261 | ✅ |
| r1gpu | 0/5, 4013ms | 0/5, 4013ms, 5 timedOut, ttwid=true | ✅ |
| r1gpu2–5 | 4/5 ×4, max 417ms | 4/5 ×4; max 179/67/417/48 | ✅ |
| r3f4r4c,d | 5/5 ×2, max 20ms | 5/5 ×2; 19 và 20 | ✅ |
| r3f4r4a,b | 0/5 ×2, 4013ms | 0/5 ×2; 4007/4013; warmUp 4014/4004 | ✅ |
| r3f4r4e | 0/0 nav-fail | `attempted:0, hangs:0`, error "Navigation failed" | ✅ |

Code kiểm: `navFailed` regex URL (738–744), warm-up wheel + `warmUpMs` (766–770),
`clickPoint` timeout 4000×3 + log timing (351–366), `Page.bringToFront` sau attach.

**Lệch nhỏ:** report ghi bringToFront ở "line 665", thực tế **674**.

---

## 2. Bốn chỗ phải sửa

### 2.1 Baseline "~50% (5/8)" không tính được từ dữ liệu — lặp lại đúng lỗi R1 đã chỉ

smoke10–12 có `timings: []` — **instrumentation chưa tồn tại lúc đó**, không thể phân loại stall hay không.
Nặng hơn: smoke9–12 nằm **trước fix B** (đo scroll theo container), nên 0/5 của chúng đã được giải thích
bằng lỗi đo, không cần tới stall.

Dùng chúng làm mẫu số stall chính là lỗi mà R1 vừa bắt ở run `fixgpu`: rút kết luận từ run không đủ tư cách.

**Baseline trung thực** (chỉ run có instrumentation): instr1, instr2, instr3 → **1/3**. Kèm review1 (1/5),
review2 (0/5) làm chứng cứ gợi ý. Không phải 5/8.

### 2.2 Mẫu số `3/13` không dựng lại được

Run sau khi có bringToFront: r2a–e (5) + r1gpu1–5 (5) + r3f4r4a–d (4) = **14**.
Nếu tính cả fix1–5 (cũng có bringToFront) = **19**. Không có cách nào ra 13.

→ Đúng phải là **3/14 (21%)** hoặc **3/19 (16%)**.

### 2.3 R1 — kết luận đúng, nhưng lập luận yếu hơn dữ liệu cho phép

Report lập luận "keep-gpu 1/5 vs disable-gpu 0/5 → tương đương". Ở n=5 mỗi nhánh, đó **không phải bằng chứng
tương đương**, chỉ là không đủ sức phân biệt.

Nhưng report tự bán rẻ dữ liệu của mình. Gộp **toàn bộ** run disable-gpu có instrumentation hôm nay:
r2a–e (0/5 stall) + r3f4r4a–d (2/4 stall) = **2/9 ≈ 22%**, so với keep-gpu **1/5 = 20%**.

→ Cùng kết luận, lập luận mạnh hơn hẳn. Nên thay.

### 2.4 "tất cả sạch" cho r2a–e cần định nghĩa

r2b = **3/5**. Đã kiểm 2 burst hỏng: `no movement ... dispatch 104ms` và `... dispatch 12ms` — **không timeout**.
Nên "sạch" = "không stall" là đúng, nhưng phải phát biểu ra, vì 3/5 đọc như một run hỏng.

Ghi chú: burst hỏng thứ 2 của r2b có `container 1917->1917` — container đã cuộn sẵn rồi đứng yên.
Đây là **chế độ hỏng thứ ba**, khác cả warm-up lẫn stall. Chưa ai đặt tên.

### 2.5 Hai lỗ hổng instrumentation còn lại

- **R4 chỉ ghi ra console.** `clickPoint` gọi `plog`, không đẩy gì vào `result`. Mọi instrumentation khác
  hôm nay đều vào JSON. Khi chạy login thật, timing click sẽ nằm trong `.log`, không so sánh được giữa run.
  → đẩy vào `result.login.clickTimings`.
- **R3 chỉ kiểm URL.** `navFailed = !/tiktok\.com/.test(preScan.url)`. Vùng xám lọt lưới: URL đúng nhưng
  **title rỗng** (r2b, r1gpu2, r1gpu4, fix1). Những run đó vẫn chạy hết vòng scroll và vẫn được tính vào
  thống kê. Confound thứ ba mà R3 muốn tách vẫn còn lẫn.

---

## 3. Phát hiện mới #1 — **title rỗng là điều kiện cần của stall**

Đối chiếu title trang với kết quả, trên 22 run có instrumentation:

| | title đúng | title RỖNG |
|---|---|---|
| **stall** | **0** | **4** |
| không stall | 14 | 4 |

- Mọi run stall (instr3, r1gpu, r3f4r4a, r3f4r4b) đều có title rỗng — **4/4**.
- Chưa từng có run title đúng mà bị stall — **0/14**.
- Chiều ngược lại không đúng: 4/8 run title rỗng vẫn chạy sạch.

⇒ Title rỗng **cần nhưng không đủ**. Quan trọng hơn: nó chỉ hướng điều tra **ra khỏi focus**.
Title rỗng nghĩa là renderer chưa commit xong document — tức stall là triệu chứng của **một trang chưa
tải xong**, không phải của một cửa sổ mất focus. `Page.bringToFront` giảm được tỉ lệ có thể vì nó thay đổi
thời điểm/độ ưu tiên render, chứ không phải vì chữa focus.

**Đề xuất thay cho hướng `Target.activateTarget` trong report:** gate vòng scroll bằng
`document.title !== ""` (kèm `readyState`), poll tới budget; hết budget mà title vẫn rỗng thì ghi thành
một lớp kết quả riêng — hoặc navigate lại. Rẻ hơn và bám đúng tín hiệu đã đo được.

## 4. Phát hiện mới #2 — **canvas hash không phải nhiễu, nó là hàm của cờ GPU**

Report `handoff-260820-1430` kết luận canvas hash lệch giữa smoke13/smoke14 là *"nhiễu fingerprint,
không phải bug"*. **Sai.** Quét toàn bộ 24 run có chữ ký:

| canvasHash | Chế độ | Run |
|---|---|---|
| `408776913` | `--keep-gpu` | fixgpu, r1gpu1–5, smoke4, smoke9–13 |
| `2601446965` | disable-gpu (mặc định) | fix1–5, instr1–3, r2a–e, r3f4r4a–e, review1–2, smoke2, smoke14 |

**24/24 run, không một ngoại lệ.** smoke13 là keep-gpu, smoke14 là disable-gpu — đó là toàn bộ lý do chúng
khác nhau. Canvas hash hoàn toàn tất định theo (seed, chế độ GPU).

### 4b. ĐÍNH CHÍNH — `webgl: null` là **lỗi của probe**, không phải chữ ký thật

Bản đầu của mục này kết luận harness đang phát ra chữ ký "máy không có GPU". **Sai.** Kiểm tiếp:

- `webgl: null` + `webglFail: "no webgl context"` xuất hiện ở **cả keep-gpu lẫn disable-gpu**, 10/10 run
  đối chiếu. Nếu là do `--disable-gpu` thì keep-gpu đã phải khác.
- Đọc `PROBE_JS`: canvas được tạo 1 lần (dòng ~212), lấy context **`2d`** (~214), vẽ, hash
  (`canvas.toDataURL()`), rồi **gọi `canvas.getContext("webgl")` trên chính element đó** (~235).

Theo spec HTML, một canvas chỉ mang được **một** loại context. Đã lấy `2d` thì `getContext("webgl")`
**luôn** trả `null`. Đây là artifact đo, không phải thuộc tính của trình duyệt.

⇒ **Ta vẫn chưa biết chữ ký WebGL thật của engine.** Đó mới là trạng thái đúng. Sửa: tạo canvas thứ hai
riêng cho WebGL. Một dòng.

Phần canvas hash ở mục 4 **không bị ảnh hưởng** — nó dùng context 2d, đo đúng, và kết luận 24/24 vẫn đứng.

---

## 5. Đính chính

Chữ ký thiết bị (`PROBE_JS`, dòng 183–275) **không phải mới thêm ở đợt r3f4r4** — smoke2 đã có. Nó có mặt
từ đầu đợt harness hôm nay. Dữ liệu font/webgl đã nằm sẵn trên đĩa vài tiếng trước khi ai đọc tới.

---

## 6. Thứ tự việc đề nghị (thay mục "việc còn lại" của report)

1. **Gate scroll bằng title** — bám tín hiệu đã đo, rẻ, thay cho `Target.activateTarget`.
2. **Sửa 3 con số thống kê** (2.1, 2.2, 2.3) trong report 1436.
3. **Đẩy clickPoint timing vào JSON** trước khi chạy login.
4. **Sửa probe WebGL** (canvas thứ hai) rồi đo lại — hiện chưa có số liệu WebGL nào dùng được.
5. Chạy thêm run cho thống kê stall (hiện n=14).

## Câu hỏi chưa giải

1. Vì sao title rỗng ở 8/22 run? Trang có tải xong sau đó không, hay rỗng vĩnh viễn?
2. Chế độ hỏng thứ ba của r2b (`container 1917->1917`) là gì — feed hết nội dung, hay container đổi vai?
3. Chữ ký WebGL thật là gì? Chưa đo được lần nào vì probe hỏng. `--fingerprint-gpu-vendor`/`-renderer`
   đang được set — chưa ai xác nhận chúng có tới được `UNMASKED_RENDERER_WEBGL` không.

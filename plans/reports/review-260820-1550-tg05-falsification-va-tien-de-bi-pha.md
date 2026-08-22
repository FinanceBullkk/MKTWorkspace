# REVIEW — Chấp nhận falsification tg05, và tiền đề lớn hơn vừa bị phá

**Kiểm:** `handoff-20260820-1549-title-gate-tg05-falsified-cho-claude-review.md`
**Phương pháp:** đọc thẳng `probe-tiktok-tg0{1..5}.json` + code title-gate (dòng 748–772), không qua report.
**Thời gian:** 20/08/2026 15:50

---

## Verdict: ✅ Falsification CHẤP NHẬN. Dừng đúng. Nhưng thứ quan trọng nhất bị báo nhẹ.

---

## 1. tg05 — xác minh

| | tg01 | tg02 | tg03 | tg04 | tg05 |
|---|---|---|---|---|---|
| `titleArrived` | true | true | true | true | **true** |
| `waitedMs` | 895 | 368 | 84 | 1218 | 212 |
| `readyState` | complete | complete | complete | complete | complete |
| title lúc `scan:home` | **RỖNG** | có | có | **RỖNG** | có |
| scroll | 5/5 | 5/5 | 5/5 | 5/5 | **2/5** |
| burst dispatchMs | 33,17,20,15,14 | 15,19,12,9,11 | 28,21,10,12,35 | 18,11,11,12,13 | **23,18,4002,4007,4004** |
| timedOut | 0 | 0 | 0 | 0 | **3 (burst 3,4,5)** |
| warmUp | 474 | 197 | 33 | 172 | 58 |
| lateAcks | 0 | 0 | 0 | 0 | 0 |

tg05 có title đầy đủ ở **cả hai** điểm đo (`titleGate` **và** `scan:home`) — không phải artifact của gate.
Một phản ví dụ là đủ giết một mệnh đề "điều kiện cần". Không cần thống kê. **Kết luận của DeepSeek đúng.**

Code title-gate đã kiểm: đúng brief, kể cả điều khó nhất — hết trần vẫn chạy scroll (dòng 753–754 comment
đúng lý do). Không đụng `PROBE_JS`. A-only, reproduce được.

Tỉ lệ stall 1/5 = 20% ≈ base rate 21%. Gate **không ảnh hưởng** stall. Nhất quán.

---

## 2. Thứ bị báo nhẹ: tg05 phá tiền đề "stall là trạng thái cả phiên"

Brief 1419 phát biểu điều này như **fact đã chứng minh** trên 12 run:

> *"Stall là trạng thái của cả phiên, không phải từng burst. Mọi run trong 12 run đều là 5-timeout hoặc
> 0-timeout, **không run nào lẫn lộn**. Điều kiện hỏng được định đoạt lúc khởi tạo phiên, trước cái wheel
> đầu tiên."*

**tg05 là run mixed đầu tiên trong toàn bộ lịch sử đo:** burst 1–2 sạch (23ms, 18ms), burst 3–5 kẹt.
Stall **bắt đầu giữa phiên**, sau hai wheel đã thành công.

Hệ quả, quan trọng hơn cả việc title-gate chết:

1. **"Điều kiện định đoạt lúc khởi tạo phiên" — sai.** Mọi giả thuyết dựa trên trạng thái lúc launch
   (focus, visibility, GPU, title/commit) mất nền tảng chung. Đó là lý do sâu xa vì sao cả hai giả thuyết
   đã thử đều chết.
2. **Lệnh cấm "đừng retry wheel trong cùng run" (brief 1419 §5) mất cơ sở.** Lý do cấm là "stall là trạng
   thái cả phiên → retry chắc chắn vô ích". Tiền đề đó vừa đổ, nên lệnh cấm phải xét lại.
3. **Lần đầu có handle thí nghiệm tốt.** Trước đây stall là all-or-nothing mỗi phiên, không có gì để đối
   chiếu *trong* một run. Giờ có: cái gì khác nhau giữa burst 2 và burst 3 của tg05?

---

## 3. Title-gate không vô ích — giữ lại, chỉ bỏ vai trò "cách chữa"

tg01 và tg04 có `scan:home` title **RỖNG** nhưng `titleArrived=true` sau 895ms / 1218ms.

⇒ Trả lời câu hỏi chưa giải #1 của verify 1517: **title rỗng là tạm thời, không vĩnh viễn.** Trang tải xong
sau đó. Trong harness cũ hai run này đã bị ghi nhận là "title EMPTY" — tức **8/22 run title rỗng trước đây
phần lớn chỉ là đo quá sớm**, không phải trang hỏng.

Cả tg01 và tg04 đều 5/5. Giữ `titleGate` như instrumentation (nó đang loại được nhiễu đo), bỏ nó khỏi vai
trò giả thuyết.

---

## 4. Trả lời 4 câu hỏi của DeepSeek

**Q1 — Chấp nhận falsification?** Có. Một phản ví dụ đủ giết mệnh đề điều kiện cần. Dừng lại báo là đúng
decision rule của brief.

**Q2 — Làm tiếp Việc B (probe WebGL)?** Có, nhưng xem mục 6 — thứ tự đang được xét lại ở cấp cao hơn.
Việc B độc lập hoàn toàn với stall, không bị ảnh hưởng bởi falsification.

**Q3 — Hướng stall mới?** Chưa giao. Xem mục 5 — và lần này đổi kỷ luật: **đo, không đoán tiếp.**

**Q4 — container `1290->1290` (tg05) có cùng chế độ hỏng thứ ba của r2b (`1917->1917`) không?**
**Không.** Hai chuyện khác hẳn:

| | r2b | tg05 |
|---|---|---|
| dispatchMs | 104 / 12 | 4002 / 4007 / 4004 |
| timedOut | **không** | **có** |
| Nghĩa | lệnh **tới nơi**, container không nhúc nhích | lệnh **không bao giờ tới** |

`1290->1290` ở tg05 chỉ là hệ quả tất yếu của việc wheel không được xử lý — không mang thông tin gì thêm.
Chế độ hỏng thứ ba của r2b (ack nhanh mà không di chuyển, container đã cuộn sẵn) **vẫn chưa ai giải thích**.

---

## 5. Manh mối còn sống — và phép đo dứt điểm

Hai dữ kiện đặt cạnh nhau:

- Trong lúc Input kẹt 4000ms, `Runtime.evaluate` chạy **2–3ms** → **main thread rảnh**.
- Stall **bắt đầu giữa phiên**, sau khi feed đã cuộn hai lần → có thứ gì đó thay đổi *trong* phiên
  (video vào viewport, layer mới, compositing bắt đầu).

Main thread rảnh loại trừ nghẽn main thread. Đường đi của Input ack (browser process →
RenderWidgetHost → **compositor**) khác đường của `Runtime.evaluate` (**main thread**). Điều này giải
thích được cả "eval nhanh khi Input chết" lẫn "GPU ON/OFF không đổi gì" — software compositing cũng có
compositor thread.

**Nhưng đừng giao thêm một chuỗi giả thuyết nữa.** Hai cái đã chết vì cùng một kiểu: đoán cơ chế rồi thử
cách chữa. Đổi sang đo trực tiếp:

**Phép đo đề nghị — rAF liveness.** `requestAnimationFrame` do vsync/compositor lái, `Runtime.evaluate` do
main thread. Đếm số lần rAF bắn trong mỗi burst, ghi cạnh `dispatchMs`:

- rAF **ngừng bắn** trong lúc stall mà eval vẫn 2ms → **compositor chết**. Chốt được lớp nguyên nhân.
- rAF **vẫn bắn** bình thường → compositor sống → phải tìm chỗ khác, và loại được cả một lớp.

Dứt khoát theo cả hai chiều, một run là đủ tín hiệu, không đụng gì tới đường chạy.

---

## 6. Điểm chiến lược chưa ai nêu: **stall này nằm ở harness, không ở sản phẩm**

`Input.dispatchMouseEvent` là đường của **CDP**. Người dùng thật cuộn bằng chuột thật — không đi qua
Input domain của CDP.

Và theo `MKTBrowser/README.md`, MCP của bản build này **không expose page/cookie/raw-CDP tools**; token
Relay chỉ quản profile. ⇒ **Sản phẩm không bao giờ dispatch input qua CDP.**

Nghĩa là ta đã đốt phần lớn buổi chiều cho một bug **có thể không tồn tại với người dùng**. Harness vẫn
cần chạy được để test TikTok nên không phải vô giá trị — nhưng nó là *công cụ đo*, không phải sản phẩm,
và cost/benefit của việc đào tiếp phải được đặt lại.

Ba đường, không loại trừ nhau:

| | Việc | Chi phí | Đổi lại |
|---|---|---|---|
| **A** | Đo rAF (mục 5) | ~20 phút | Biết lớp nguyên nhân thật; có thể dẫn tới fix thật |
| **B** | Fallback: burst timeout → cuộn bằng `Runtime.evaluate` | ~10 phút | Harness hết kẹt ngay. Mất wheel event thật ở burst đó — phải ghi rõ burst nào dùng cơ chế nào, nếu không metric scroll trộn hai thứ |
| **C** | Park, chuyển sang WebGL probe + login | 0 | Harness đã 5/5 ở 4/5 run, đủ dùng. Stall thành nợ có tài liệu |

Lưu ý cho đường B: nó **chỉ hợp lệ từ bây giờ** — tiền đề cấm retry đã đổ (mục 2.2). Nhưng nếu harness
dùng để đo *"có bị TikTok phát hiện không"* thì JS-scroll làm hỏng phép đo (không có wheel event thật);
nếu chỉ đo *"có duyệt được TikTok không"* thì chấp nhận được. Cần chốt harness dùng để đo cái gì.

---

## Câu hỏi chưa giải

1. Cái gì thay đổi giữa burst 2 và burst 3 của tg05? Phép đo rAF sẽ tách được lớp nguyên nhân, chưa chắc
   ra thủ phạm.
2. Chế độ hỏng thứ ba của r2b (ack nhanh, container `1917->1917` đứng yên) — vẫn chưa ai điều tra.
3. Harness này dùng để đo "duyệt được TikTok" hay "không bị TikTok phát hiện"? Câu trả lời quyết định
   đường B có hợp lệ không.
4. Chữ ký WebGL thật — Việc B của brief 1523 chưa chạy.

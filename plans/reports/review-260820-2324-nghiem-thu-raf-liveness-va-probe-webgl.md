# REVIEW — nghiệm thu Việc C (rAF liveness) + Việc B (probe WebGL)

**Report được review:** `ket-qua-260820-2225-do-raf-liveness-va-probe-webgl.md` (Cline/DeepSeek)
**Brief gốc:** `handoff-260820-1553-do-raf-liveness-va-probe-webgl.md`
**Người review:** Claude · **Ngày:** 20/08/2026 23:24 UTC+7
**Phạm vi kiểm chứng:** đọc lại `tiktok-e2e.mjs`, 7 file `probe-tiktok-*.json` + `.log`, mtime artifacts, GPU host.

---

## Kết luận

| | Kết quả |
|---|---|
| **Việc C — code + dữ liệu** | **ĐẠT.** Patch đúng chỗ, invariants nguyên, 25/25 burst trong report khớp JSON gốc từng số. |
| **Việc B — code + dữ liệu** | **ĐẠT.** Canvas thứ hai đúng, `webgl` đủ 4 giá trị cả 2 chế độ, `webglFail=null`. |
| **Văn bản report** | **CẦN SỬA.** 2 lỗi sự thật (F1, F2), 1 giải thích sai (F3), 1 bỏ sót phương pháp luận (F4). |

Không gian lận, không cherry-pick: mtime cho thấy đúng 7 run raf/gl trong thư mục, không có tag ẩn nào bị bỏ đi.

---

## Đã kiểm chứng — khớp

- 25 dòng burst của 5 bảng raf01–raf05: **khớp 100%** với `scroll.timings` trong JSON.
- `exitCode=0`, `relay.endSeen=true`, `rafCounterOk=true` cho cả 7 run — đúng.
- scroll 0/5, 0/5, 0/5, 2/5, 5/5 (raf01–05) và 5/5, 5/5 (gl1/gl2) — đúng.
- `webgl` gl1/gl2 giống hệt nhau, 4 giá trị, `webglFail=null` — đúng.
- Invariants: dispatch timeout **4000ms** (cả warm-up), `movedBy` so `container.key` trước, `bringToFront` **chỉ 1 lần** (cái cũ ở dòng 691, không thêm cái thứ hai), không `activateTarget`/`setVisibleSize`/retry, không fallback JS-scroll (grep sạch), `titleGate` nguyên, `node --check` pass.
- Patch B: canvas thứ hai (`glCanvas`) tách hẳn, canvas 2d + thứ tự vẽ + `fnv1a(toDataURL())` không đụng.

---

## F1 — Câu hỏi 1 của report SAI sự thật

> "`vis=hidden` trong 5/5 run raf (cả stall lẫn sạch)"

**Sai.** raf05 có `vis=visible` ở **cả 5/5 burst**; raf04 `visible` ở burst 1–2. Chính bảng 4 và bảng 5 của report bác lại câu này. Thực tế: **3/5 run hidden toàn phiên, 1/5 mixed, 1/5 visible toàn phiên**.

Kết luận đi kèm ("độ che phủ dao động theo thời gian thật") tình cờ vẫn đúng, nhưng đang đứng trên một con số sai — phải sửa trước khi ai đó dùng lại nó.

---

## F2 — `canvasHash` KHÔNG phải "không đổi" (lỗi nằm trong chính dữ liệu đã nộp)

Report: *"giữ nguyên canvas 2d + `canvasHash` (không đổi: `2601446965`)"*.

Đo lại, cùng `seed=42424`:

| run | chế độ | canvasHash |
|---|---|---|
| tg05, raf01, raf05 (trước fix) | disable-gpu | `2601446965` |
| **gl1** | disable-gpu | `2601446965` |
| **gl2** | **`--keep-gpu`** | **`408776913`** |

Fix B **không** gây ra chuyện này (gl1 khớp y hệt các run trước fix — phần "fix không làm hỏng canvasHash" là ĐẠT). Nhưng `canvasHash` **đổi theo chế độ GPU dù cùng seed**. Với một trình duyệt fingerprint-spoofing thì đây là dữ kiện đáng kể: hash canvas phụ thuộc đường rasterize của **máy thật**, không chỉ phụ thuộc seed → hai máy cùng seed sẽ ra hai chữ ký canvas khác nhau. Đây là con số đáng chú ý nhất của Việc B và report đã bỏ mất nó.

---

## F3 — Giải thích `rafFps > 60` SAI chiều

Report: *"`rafFps` của burst sạch cao hơn 30–60 (101–129) — đo gộp cả sleep 1500ms giữa burst, không phải lỗi"*.

Lập luận ngược. `fps = rafDelta / rafWallMs`. Gộp thêm thời gian **nhàn rỗi** chỉ có thể **kéo fps xuống** gần tốc độ thật, không bao giờ đẩy nó **vượt** tốc độ thật. Compositor 60Hz thì gộp sleep vẫn ra ≤60.

Nguyên nhân thật nằm chỗ khác — nhiều khả năng BeginFrame không bị vsync ghìm (software compositing dưới `--disable-gpu`, hoặc cửa sổ nằm trên màn hình không có vsync thật). Đáng chú ý: host có **`SudoMaker Virtual Display Adapter`** bên cạnh `AMD Radeon RX 6600`. Cái này liên quan trực tiếp tới câu hỏi visibility, không nên bỏ qua.

Không làm hỏng Việc C: mốc phân biệt là "0 vs cỡ trăm", con số tuyệt đối không tham gia kết luận.

---

## F4 — Nhóm đối chứng KHÔNG cùng thời điểm (report không nói)

mtime artifacts:

```
raf01 18:04 · raf02 18:05 · raf03 18:07             <- 3/3 stall toàn phiên
                  ... cách 4 tiếng ...
raf04 22:15 · raf05 22:15 · gl1 22:17 · gl2 22:18   <- 1 mixed + 3 sạch
```

Report viết "Đã chạy 5 run (raf01–raf05), dừng theo điều kiện của brief" — nghe như một loạt liền mạch. Thực tế raf05 (đối chứng sạch) chạy **sau raf03 4 tiếng**, tức nhóm đối chứng và nhóm treatment khác nhau đúng ở biến đang bị điều tra (trạng thái cửa sổ theo thời gian thật). Phải ghi rõ.

**Hệ quả cho brief:** giả định "tỉ lệ stall nền ~20%, độc lập theo run" **không được dữ liệu ủng hộ**. Stall **cụm theo thời gian**: 3/3 trong cửa sổ 3 phút, rồi 0 toàn phần trong cửa sổ 4 phút sau đó. Đừng tính xác suất run tiếp theo bằng 20% nữa.

---

## F5 — Report bán rẻ kết quả mạnh nhất của chính nó

Tương quan `vis` ↔ stall là **tuyệt đối, không một ngoại lệ nào** trên toàn bộ 25 burst:

- 18 burst stall → **18/18** `vis=hidden`, `rafFps=0`
- 7 burst sạch → **7/7** `vis=visible`, `rafFps=101–129`

Và một tín hiệu thứ 6 report **không hề nhắc**, dù nằm sẵn trong JSON — `scroll.warmUpMs`:

| run | warmUpMs | vis burst 1 |
|---|---|---|
| raf01 / raf02 / raf03 | **4011 / 4001 / 4012** (warm-up wheel tự nó timeout) | hidden |
| raf04 | 1181 | visible |
| raf05 / gl1 / gl2 | 132 / 73 / 84 | visible |

Tức ở raf01–03 trạng thái hỏng **đã có sẵn trước burst 1**, khớp đúng với `vis=hidden` từ burst 1. Điểm dữ liệu độc lập thứ bảy, cùng chiều, miễn phí.

Dòng đầu bảng của brief ("rafFps≈0 mà vis=visible" — kết quả mạnh nhất) **không xuất hiện lần nào**. Kết hợp lại, Việc C đã **tách xong lớp nguyên nhân**, chứ không phải "chỉ quan sát được".

---

## F6 — `playing` không phải biến độc lập

Report xếp `playing 1→0` ở raf04 burst 3 thành một quan sát riêng. Không phải: trang bị `hidden` thì Chromium/TikTok **pause video** — `playing→0` là **hệ quả xuôi dòng** của `vis=hidden`, không phải manh mối song song.

Nói thẳng: giả thuyết "video vào viewport là cái đổi giữa burst 2 và 3" của brief **đã chết**, không phải "chưa quan sát thấy". `vids` đứng yên 2→2 xuyên qua điểm đổi.

---

## F7 — WebGL: con số mà report từ chối đọc

`unmaskedRenderer = ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 …)`, **giống hệt** ở gl1 (disable-gpu) và gl2 (keep-gpu).

GPU thật của host: **AMD Radeon RX 6600**. Không phải Intel.

→ Đây là **giá trị bịa ra từ `--fingerprint=42424`**, không phải rò rỉ phần cứng thật. Không có cờ `--fingerprint-gpu-vendor`/`-renderer` nào được truyền (đã grep), nên chữ ký GPU do seed sinh. Ổn định qua cả 2 chế độ GPU đúng như kỳ vọng của một giá trị spoof, và khớp persona còn lại (8 core / 8 GB / 1366×768 — laptop tích hợp).

**Trả lời câu hỏi 3 của brief: không rò rỉ.** Chỗ không nhất quán nằm ở `canvasHash` (F2), không ở WebGL.

---

## Lệch nhẹ so với brief (đã khai báo, chấp nhận được)

Brief yêu cầu chụp "trước và sau **mỗi `Input.dispatchMouseEvent`**". Code đặt `rafAfter` **sau** `sleep(1500)` + một `SCROLL_STATE_JS` eval, nên cửa sổ đo = dispatch + 1500ms sleep + eval, không phải riêng dispatch. Report có khai.

Tác động thấp — `rafDelta=0` trải suốt 5.5s là bằng chứng **mạnh hơn** so với chỉ 4s. Nhưng `rafFps` hiện **không** đọc được là "fps trong lúc dispatch". Nếu đợt sau cần cửa sổ khít, dời `rafAfter` lên ngay sau khối try/catch của dispatch.

---

## Cơ chế đề xuất + phép bác bỏ rẻ nhất (việc của đợt sau, không làm bây giờ)

Chuỗi nhân quả khớp toàn bộ 7 điểm dữ liệu:

```
cửa sổ bị che (occluded)
  -> Windows native occlusion -> visibilityState=hidden
  -> Chromium dừng hẳn rAF (0 frame / 5.5s, không phải throttle)
  -> mouseWheel của Input.dispatchMouseEvent chờ ack từ compositor
  -> không frame -> không ack -> timeout 4000ms
```

Giải thích luôn `focus=true` + `hidden` ở raf01–03: `Page.bringToFront` (dòng 691) trao **DOM focus** cho render widget, nhưng **không** nâng cửa sổ OS lên trên cửa sổ terminal đang chạy harness → cửa sổ vẫn bị che ở tầng OS. Nghi phạm che: chính cái terminal/VS Code phóng ra nó.

**Phép thử một cờ, quyết định:**

```
--disable-features=CalculateNativeWindowOcclusion
--disable-backgrounding-occluded-windows
--disable-renderer-backgrounding
```

- Dự đoán nếu cơ chế đúng: `vis` giữ `visible`, `rafFps` giữ ~100+, tỉ lệ stall → 0.
- Nếu stall vẫn còn **mà `vis=visible`** → mở lại nhánh "compositor kẹt" (dòng 1 bảng brief), lần đầu có bằng chứng cho nó.

**Vì sao không vi phạm "không bị TikTok phát hiện":** đây là **cờ launch**, không đụng đường input — wheel event thật vẫn nguyên, không có JS-scroll. Và cửa sổ của người dùng thật vốn **không** bị che, nên làm nó không-bị-che là **thực tế hơn**, không phải giả hơn.

Brief 1553 cấm mọi "cách chữa" trong đợt C — nên đây là nội dung của brief sau, cần người ra quyết định duyệt.

---

## Yêu cầu sửa report (trước khi đóng)

1. Sửa câu hỏi 1: `vis=hidden` là **3/5 run toàn phiên + 1/5 mixed**, không phải 5/5. *(F1)*
2. Thêm `canvasHash` gl2 = `408776913` ≠ gl1 `2601446965`, cùng seed. *(F2)*
3. Bỏ giải thích "gộp sleep nên fps cao" — sai chiều toán học. *(F3)*
4. Ghi rõ raf04/raf05 chạy **sau raf01–03 4 tiếng**; đối chứng không cùng thời điểm. *(F4)*
5. Thêm cột `warmUpMs` vào bảng — điểm dữ liệu thứ 6 cùng chiều, đang bị bỏ phí. *(F5)*

Không cần chạy lại run nào. Toàn bộ số liệu đã nộp là hợp lệ và đủ.

---

## Câu hỏi chưa giải

1. Cái gì thực sự che cửa sổ ở raf04 **giữa burst 2 và 3**? raf04 và raf05 cách nhau chưa tới 1 phút mà raf05 sạch hoàn toàn → sự kiện che chỉ kéo dài ~15s. Cờ ở trên trả lời được "có phải occlusion không", nhưng không trả lời "ai che".
2. `SudoMaker Virtual Display Adapter` trên host — cửa sổ browser rơi vào màn hình ảo hay màn hình thật? Ảnh hưởng cả vsync (F3) lẫn tính toán occlusion (F4/F5). Chưa ai kiểm.
3. Chế độ hỏng thứ ba của r2b (ack 12ms, không timeout, container `1917->1917` đứng yên) — **vẫn chưa ai điều tra**, và cơ chế occlusion ở trên **không** giải thích được nó (ack nhanh = compositor sống). Món khác hẳn, đừng gộp.
4. `clickPoint` vẫn chỉ log ra console, chưa vào `result` JSON — phải sửa **trước khi chạy login thật** (nợ từ brief 1553, chưa trả).

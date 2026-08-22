# REPORT — đo rAF liveness (Việc C) + sửa probe WebGL (Việc B)

**Trả lời:** `handoff-260820-1553-do-raf-liveness-va-probe-webgl.md`
**Ngày:** 20/08/2026 22:25 UTC+7 · **Executor:** Cline
**File code đã sửa:** `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs`

---

## Việc C — rAF liveness: đã dừng sớm đúng luật

Đã chạy **5 run** (raf01–raf05), dừng theo điều kiện của brief: bắt được 2 run stall thì
dừng sớm — ở đây bắt được **3 run stall đầy đủ + 1 run mixed**, và raf05 cho **run sạch đối chứng**.
Không chạy tới raf12 vì deliverable đã đủ.

**Khoảng cách thời gian:** raf01–03 chạy **18:04–18:07**; raf04–05 chạy **22:15 — cách 4 tiếng**.
Nhóm đối chứng sạch (raf05) **không cùng thời điểm** với nhóm stall: stall cụm trong cửa sổ 3 phút,
cửa sổ 4 phút sau đó 0 stall — không dùng "tỉ lệ nền ~20% độc lập theo run".

Tất cả 5 run: `exitCode=0`, relay `endSeen=true`, seat sạch, `rafCounterOk=true`.

### 1. Run stall đầy đủ — raf01 (scroll 0/5)

| burst | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|
| 1 | 4013 | true | 0 | hidden→hidden | true | 0→0 |
| 2 | 4003 | true | 0 | hidden→hidden | true | 0→0 |
| 3 | 4001 | true | 0 | hidden→hidden | true | 0→0 |
| 4 | 4012 | true | 0 | hidden→hidden | true | 0→0 |
| 5 | 4006 | true | 0 | hidden→hidden | true | 0→0 |

### 2. Run stall đầy đủ — raf02 (scroll 0/5)

| burst | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|
| 1 | 4010 | true | 0 | hidden→hidden | true | 0→0 |
| 2 | 4003 | true | 0 | hidden→hidden | true | 0→0 |
| 3 | 4008 | true | 0 | hidden→hidden | true | 0→0 |
| 4 | 4002 | true | 0 | hidden→hidden | true | 0→0 |
| 5 | 4008 | true | 0 | hidden→hidden | true | 0→0 |

### 3. Run stall đầy đủ — raf03 (scroll 0/5)

| burst | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|
| 1 | 4014 | true | 0 | hidden→hidden | true | 0→0 |
| 2 | 4010 | true | 0 | hidden→hidden | true | 0→0 |
| 3 | 4006 | true | 0 | hidden→hidden | true | 0→0 |
| 4 | 4007 | true | 0 | hidden→hidden | true | 0→0 |
| 5 | 4004 | true | 0 | hidden→hidden | true | 0→0 |

### 4. Run MIXED — raf04 (scroll 2/5, đúng mẫu tg05)

| burst | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|
| 1 | 7 | false | 103.3 | visible→visible | true | 1→1 |
| 2 | 22 | false | 123.0 | visible→visible | true | 1→1 |
| 3 | 4020 | true | 0 | hidden→hidden | false | 0→0 |
| 4 | 4003 | true | 0 | hidden→hidden | false | 0→0 |
| 5 | 4014 | true | 0 | hidden→hidden | false | 0→0 |

### 5. Run sạch — raf05 (scroll 5/5, đối chứng)

| burst | dispatchMs | timedOut | rafFps | vis | focus | playing |
|---|---|---|---|---|---|---|
| 1 | 21 | false | 128.9 | visible→visible | true | 1→1 |
| 2 | 21 | false | 121.8 | visible→visible | true | 1→1 |
| 3 | 18 | false | 128.1 | visible→visible | true | 1→1 |
| 4 | 20 | false | 127.1 | visible→visible | true | 1→1 |
| 5 | 12 | false | 101.4 | visible→visible | true | 1→1 |

### 6. Đọc theo bảng của brief (chỉ nêu quan sát, không quy nhân quả)

| Quan sát | Brief: kết luận | Xuất hiện ở đâu |
|---|---|---|
| `rafFps≈0` mà `vis=visible` + `focus=true` | Compositor kẹt khi trang vẫn hiển thị (mạnh nhất) | **KHÔNG quan sát thấy** — không run/burst nào có rafFps=0 khi visible |
| `rafFps≈0` + `vis=hidden` (hoặc focus=false) | Cửa sổ bị che/ẩn giữa phiên — visibility sống lại | **MỌI burst stall** (raf01–03 cả phiên, raf04 từ burst 3) |
| `rafFps` bình thường | Compositor sống | raf04 burst 1–2: 103–123; raf05: 101–129 |
| `playing` tăng đúng lúc burst timeout | Video vào viewport là mốc thời gian | **KHÔNG** — playing **giảm** 1→0 đúng lúc burst 3 timeout (raf04), vids không đổi (2→2) |

Ghi chú chi tiết (số, không kết luận):

- raf04 là bức tranh đầy đủ nhất: burst 1–2 sạch với `vis=visible`, `focus=true`, rAF sống;
  burst 3 trở đi stall với `vis=hidden`, `focus=false`, rAF=0. Điểm đổi giữa burst 2 và burst 3
  là trạng thái **visibility/focus của cửa sổ**, không phải số video (vids 2→2).
- raf01–03 stall cả phiên, `vis=hidden` từ burst 1 — khác raf04 ở `focus` (vẫn `true`).
- `rafFps` của burst sạch là 101–129 — **vượt 60**. Nguyên nhân chưa xác định (khả năng BeginFrame
  không bị vsync ghìm; host có `SudoMaker Virtual Display Adapter` cạnh GPU thật), ghi nhận, không
  ảnh hưởng mốc phân biệt 0 vs cỡ trăm.

`warmUpMs` (điểm dữ liệu thứ 6 cùng chiều, đọc từ JSON):

| run | warmUpMs |
|---|---|
| raf01 / raf02 / raf03 | 4011 / 4001 / 4012 (warm-up wheel tự nó timeout) |
| raf04 | 1181 |
| raf05 / gl1 / gl2 | 132 / 73 / 84 |

---

## Việc B — Probe WebGL: ĐẠT

Sửa theo brief: tạo canvas **thứ hai** riêng cho WebGL (`glCanvas`), giữ nguyên canvas 2d +
`canvasHash` (không đổi `2601446965` — **chỉ đúng cho disable-gpu**; gl2 `--keep-gpu` = **`408776913`**,
cùng `seed=42424`). Cấu trúc `webgl = { vendor, renderer, unmaskedVendor, unmaskedRenderer }` giữ nguyên.

### Kết quả 2 run nghiệm thu

| | gl1 (`--no-login`, disable-gpu) | gl2 (`--no-login --keep-gpu`) |
|---|---|---|
| scroll | 5/5 | 5/5 |
| exitCode / endSeen | 0 / true | 0 / true |
| `webgl.vendor` | `WebKit` | `WebKit` |
| `webgl.renderer` | `WebKit WebGL` | `WebKit WebGL` |
| `webgl.unmaskedVendor` | `Google Inc. (Intel)` | `Google Inc. (Intel)` |
| `webgl.unmaskedRenderer` | `ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)` | giống gl1 |
| `webglFail` | `null` | `null` |
| `canvasHash` | `2601446965` | `408776913` |

**Đạt:** `webgl` không còn `null`, đủ 4 giá trị, cả 2 chế độ. Chỉ nộp số, không kết luận tốt/xấu.

**Ghi chú canvasHash:** fix B **không gây ra** việc đổi hash — gl1 khớp y hệt tg05/raf01/raf05
trước fix — nhưng `canvasHash` **đổi theo chế độ GPU dù cùng seed**. Chỉ nộp số, không kết luận.

---

## Trạng thái workspace

- `tiktok-e2e.mjs`: đã patch C (rAF counter + snapshot trước/sau mỗi burst + mở rộng `timings[i]`)
  và B (canvas WebGL riêng). `node --check` pass.
- Invariants giữ nguyên: relay verbatim, `endInFlight`/`endSeen` tách biệt, scroll non-fatal,
  double-write exitCode, timeout dispatch **4000ms**, `movedBy` so `container.key` trước,
  toàn bộ instrumentation cũ (titleGate, warmUpMs, lateAcks, timings) nguyên vẹn.
- Không thêm cách chữa nào (không activateTarget/setVisibleSize/retry/bringToFront lần hai),
  không thêm fallback JS-scroll.
- JSON: `probe-tiktok-raf0{1..5}.json`, `probe-tiktok-gl{1,2}.json` + `.log` — đầy đủ.
- Seat: free (7/7 run endSeen=true).

---

## Câu hỏi chưa giải (chuyển cho review)

1. `vis=hidden` ở **3/5 run toàn phiên** (raf01–03), **1/5 mixed** (raf04: hidden từ burst 3),
   **1/5 visible toàn phiên** (raf05), và 0/2 run gl — nghĩa là độ che phủ
   cửa sổ **dao động theo thời gian thật** chứ không cố định. Vì sao cửa sổ bị che giữa phiên
   là câu hỏi cho người review (màn hình bị khoá? cửa sổ khác đè lên? session bị detach?).
2. raf01–03: `vis=hidden` từ burst 1 nhưng `focus=true`; raf04: `vis=hidden` + `focus=false`.
   Hai tổ hợp đều stall — vậy tín hiệu phân biệt là **visibility**, không phải focus.
3. Chữ ký WebGL thật đã đo được — việc đối chiếu với `--fingerprint-gpu-vendor`/`-renderer`
   thuộc về người review.
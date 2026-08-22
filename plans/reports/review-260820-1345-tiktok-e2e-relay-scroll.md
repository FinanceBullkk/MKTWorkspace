# REVIEW — tiktok-e2e.mjs: relay seat + scroll outcome + exitCode race

**Trả lời handoff:** `handoff-260820-1500-review-tiktok-e2e-relay-scroll.md`
**Phạm vi:** đọc code (858 dòng) + đối chiếu smoke13/14 JSON+log + 1 thực nghiệm relay. Không sửa file nào.

## Verdict

Bản sửa **A (relay) và C (exitCode) vững** — 2 run xác minh back-to-back đều sạch. Invariant 2 (không double-end) chưa được guard đủ chặt (đã fix, xem F1).

Bản sửa **B không vững**: nó sửa phép đo chứ không sửa nguyên nhân, và "4/5" của smoke13/14 là n=2 may mắn. Chạy lại 2 lần được 1/5 và 0/5. **Xem F6 — đây mới là việc ưu tiên, không phải login flow.**

2 patch chặn login/scale test — F1 (endSeen) + F2 (relay socket) — **đã áp dụng**, cùng F3. Xem mục "Trạng thái fix". Chỉ còn F4 (warm-up wheel) để ngỏ.

## Chứng cứ đã xác minh lại

- `node --check` pass (Node v24.14.1 tại chỗ).
- smoke13/14: exitCode 0, relay đúng 2 request (start 200, end 200), endSeen/leaseCaptured/relayEnd = true. Đúng như handoff.
- scroll log: container `scrollTop` tiến đều **~630px/burst** (0→662→1290→1917→2556). Chỉ burst **1/5** đứng yên, cả 2 run → xác nhận giả thuyết warm-up, không phải hang.
- `feed scrollable after 1s` nhưng burst 1 vẫn fail → **không phải vấn đề readiness**, TikTok thật sự nuốt wheel đầu.

## Trả lời 4 câu hỏi

### Q1. Relay có leak lease khi engine bị kill -9 giữa session/start? → KHÔNG (đã chứng minh)

Chạy mô phỏng handler relay + client destroy socket giữa lúc chờ upstream:

```
client socket destroyed mid-upstream
try-path completed, no throw
lease captured? phase = capture-done
```

Hai điều được chứng minh:

1. Capture lease xảy ra **trước** `res.writeHead` → engine chết trước khi nhận response, relay vẫn giữ `lease_id` → `endLeaseIfHeld` vẫn trả seat.
2. Ghi lên socket đã destroy **không throw**, không uncaughtException → harness không chết giữa chừng, `finally` vẫn chạy.

**Cửa sổ leak còn lại (hẹp, không rẻ để vá):** upstream đã tạo lease nhưng `await upstream.text()` ném (đứt mạng đúng lúc đọc body) → vào catch, `lease.response` null → không có `lease_id` để end. Chỉ TTL 7–17 phút cứu. Chấp nhận được.

### Q2. endLeaseIfHeld có race với session/end của engine? → Guard chưa đủ chặt, 2 lỗ

`if (path === LIC_SESSION_END) lease.endSeen = true;` đặt **sau** `await upstream.text()`:

- **Lỗ 2a — double-end:** engine gửi session/end, upstream chậm >3s, child đã exit → harness tới `endLeaseIfHeld` khi `endSeen` vẫn false → gửi end thứ 2 song song. Guard đang gác trên *hoàn tất*, không phải *khởi phát*.
- **Lỗ 2b — nghiêm trọng hơn, leak seat:** engine gửi end, upstream trả **HTTP 500** → fetch resolve → `endSeen = true` bất kể status → `endLeaseIfHeld` return true, **không end gì cả** → seat kẹt 7–17 phút. Hỏng đúng thứ bản sửa A sinh ra để chữa.
  (Nếu fetch *ném* thì vào catch nên `endSeen` giữ false — nhánh đó đang đúng.)

**F1 — patch đề xuất** (tách dedupe khỏi success):

```js
// đầu handler, ngay sau khi có `path`:
if (path === LIC_SESSION_END) lease.endInFlight = true;              // chặn double-end
// sau khi có upstream.status:
if (path === LIC_SESSION_END && upstream.ok) lease.endSeen = true;   // chỉ tin khi 2xx
```

`endLeaseIfHeld`: skip khi `endSeen`; nếu `endInFlight && !endSeen` thì **vẫn phải end** (engine đã thử và trượt).

### Q3. SCROLL_STATE_JS quét toàn DOM có treo renderer? → Không. Nhưng có bug khác quan trọng hơn

Perf: `querySelectorAll("div,main,section,body")` + đọc `scrollHeight/clientHeight` = **1 lần forced reflow**, phần còn lại đọc layout đã cache (không mutate DOM giữa chừng). Vài nghìn node ≈ chục ms. Gọi ~20 lần/run. Không phải nguồn hang.

**Vấn đề thật là identity, không phải tốc độ:** `movedBy` so `before.container.top` với `after.container.top` mà **không kiểm tra hai lần scan có chọn cùng một element không**. "Overflow lớn nhất" có thể đổi chủ khi feed lazy-load thêm. Bằng chứng key không cố định: smoke13 = `enable-1col-refine css-1q`, smoke14 = `enable-1col-refine tiktok`. Trong 1 run hiện đang ổn định, nhưng nếu đổi giữa before/after sẽ cho **kết quả moved sai cả hai chiều** — và `desc` chỉ log `before.container.key` nên nhìn log **không phát hiện được**.

**F3 — patch:** đưa `key` vào so sánh, log cả after key.

```js
if (a.container?.key && a.container.key === b.container?.key
    && Math.abs(b.container.top - a.container.top) > 100) return true;
```

### Q4. Retry có gây double-spawn 2 engine? → KHÔNG

Retry chỉ chạy khi `lastResult.exitCode === 76`. `result.exitCode` lấy từ `child.exitCode` — còn sống thì là `null`, không bao giờ 76. Nên nhánh "engine chưa chết mà vẫn spawn cái mới" là bất khả. `runOnce()` cũng được await trọn vẹn, kill sequence (Browser.close → 1.2s → 2s → kill → 1.5s → SIGKILL) nằm trong `finally` trước khi return. Invariant 5 giữ được.

Hai điểm phụ, không chặn:

- `profileDir` bị wipe **một lần ở module scope** (dòng 111), retry dùng lại thư mục cũ. Hiện vô hại (exit 76 = chưa kịp ghi gì).
- CDP port random 16000–31000 không check trùng. Xác suất thấp, fail sẽ lộ rõ ở `waitForCdp`.

## Phát hiện thêm ngoài 4 câu hỏi

**F2 [MED] — relay treo process khi upstream stall lúc teardown.**

Đo thật (Node v24), 2 kịch bản:

| socket lúc gọi close | `server.close()` (cũ) | `closeAllConnections()` + close (mới) |
|---|---|---|
| keep-alive **idle** | callback fired ngay | fired ngay |
| request **đang in-flight** | **treo vô hạn** — hết 2 phút timeout, callback không bao giờ fired, process không thoát | fired 333ms, process thoát 336ms |

Node ≥19 đã tự đóng idle keep-alive connection trong `server.close()`, nên **idle socket không phải vấn đề**. Vấn đề thật là nhánh in-flight: `close()` race với `setTimeout(r,1000)` nên *promise* vẫn resolve, nhưng **handle server ở lại event loop vĩnh viễn** → harness không bao giờ thoát sau run cuối.

Trùng đúng kịch bản lỗ 2a: engine gửi session/end, upstream stall, harness tới teardown khi request còn treo. smoke9–14 không lộ vì upstream luôn trả kịp.

```js
close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(() => r()); setTimeout(r, 1000); })
```

**F4 [LOW] — metric `hangs` đang trộn 2 thứ khác nhau.**
Burst 1 (TikTok nuốt wheel, deterministic, cả 2 run) bị đếm là `hangs` giống hệt một CDP hang thật. Nghĩa là chỉ số 4/5 hiện **không phân biệt được** "bình thường" với "hỏng thật" → hồi quy sau này bị che. Làm warm-up wheel trước vòng đo (handoff mục 7 đã đề xuất) thì 5/5 thành baseline sạch, và `hangs > 0` mới có nghĩa cảnh báo.

**F5 [NIT]** — không có `server.on("error")` / `res.on("error")`. Thực nghiệm cho thấy không fatal, để lại cũng được.

**F6 [CAO — sửa lại kết luận của handoff] — bản sửa B KHÔNG sửa cái hang. Scroll vẫn hỏng ~50% số run.**

Đối chiếu toàn bộ 9 run:

| run | `cdp timeout: Input.dispatchMouseEvent` | scroll |
|---|---|---|
| smoke9 / 10 / 12 | 5 | 0/5 |
| smoke11 | 0 | 0/5 (trước fix B — phép đo mù) |
| smoke13 / 14 | 0 | **4/5** |
| review1 | 4 | 1/5 |
| review2 | 5 | 0/5 |

Tương quan tuyệt đối: **burst nào `Input.dispatchMouseEvent` timeout thì không có gì di chuyển; burst nào dispatch thành công thì scroll chạy.**

Hệ quả, phải nói thẳng:

1. Fix B sửa đúng **phép đo**, không sửa **nguyên nhân**. smoke11 là bằng chứng phép đo từng mù (0 timeout mà vẫn báo 0/5). Nhưng handoff kết luận "B ✅ chứng minh bằng smoke13/14" là **overclaim trên n=2** — smoke13/14 tình cờ là 2 run không dính timeout.
2. Comment trong code ("CDP ack is frequently withheld... neither the ack nor window.scrollY is a reliable signal") **sai một nửa**. Ack bị giữ **không** vô hại: mỗi lần ack bị giữ là mỗi lần input thật sự không tới nơi. Ack là tín hiệu **đúng**, chỉ là tín hiệu xấu.
3. Tỉ lệ hỏng thật: 5/9 run. Đây là vấn đề đang mở lớn nhất, không phải login flow.

**F4 chết theo:** giả thuyết "TikTok nuốt wheel đầu tiên (warm-up)" bị bác — review1 burst 1 **chạy được**, bursts 2–5 hỏng. Pattern "burst 1 luôn hỏng" chỉ đúng ở smoke13/14. Đừng thêm warm-up wheel; nó chữa một pattern không tồn tại.

### Instrumentation cho F6 (đã thêm vào code)

Ba thứ, để phân biệt "renderer treo" / "Input domain kẹt" / "harness thiếu kiên nhẫn":

1. Timeout dispatch **4s → 15s**.
2. Đo `dispatchMs` + `evalMs` mỗi burst → `result.scroll.timings`. Nếu eval nhanh trong khi wheel treo thì renderer sống, chỉ Input kẹt.
3. **Bắt late ack.** `send()` cũ `pending.delete(id)` khi timeout nên reply về muộn **bị nuốt im lặng** — chính chỗ này khiến không thể phân biệt "chậm" với "mất". Thêm map `timedOut` + mảng `lateAcks` ghi lại method và thời gian thực. Ack về muộn = Input domain sống suốt, chỉ chậm.

### Kết quả đo — run instr1 (run sạch, đối chứng)

```
scroll 1/5 no movement (... dispatch 81ms, eval 1ms)
scroll 2/5 ok (... 0->651,   dispatch 18ms, eval 2ms)
scroll 3/5 ok (... 651->1301, dispatch 11ms, eval 2ms)
scroll 4/5 ok (... 1301->1929, dispatch 16ms, eval 1ms)
scroll 5/5 ok (... 1929->2563, dispatch 12ms, eval 3ms)
scroll done ok=4/5 | dispatch ms: 81,18,11,16,12 | late acks: none
```

Đọc được ngay 2 điều:

- **Dispatch bình thường tốn 11–18ms.** Timeout 4s cũ **không hề chật** — khoảng cách giữa bình thường và stall là 3 bậc độ lớn, nên stall không phải "harness thiếu kiên nhẫn". Nâng lên 15s là để đo, không phải để chữa.
- **Burst 1 không nhúc nhích dù dispatch ack sau 81ms.** Đây là ca **khác hẳn** ca stall: input tới nơi, TikTok chủ động bỏ qua. Nên trong 9 run trước, "0/5" trộn lẫn hai nguyên nhân khác nhau mà nhìn số không tách được. F4 (warm-up) đúng cho ca này, sai cho ca stall — nếu làm warm-up thì phải làm sau khi tách được hai loại, không phải trước.

### Kết quả đo — run instr3 (bắt được ca stall). ĐÂY LÀ CÂU TRẢ LỜI

```
scroll 1..5/5 no movement — dispatch 15008, 15009, 15015, 15015, 15005 ms | eval 3,1,2,3,2 ms
scroll done ok=0/5 | late acks: none
lateAcks: []      exitCode 0     relay endSeen/endInFlight/leaseCaptured/relayEnd: all true
```

Ba kết luận, mỗi cái loại bỏ một giả thuyết:

1. **Không phải harness thiếu kiên nhẫn.** Cả 5 burst treo trọn 15s rồi vẫn timeout. Dispatch lúc khỏe chỉ 9–18ms — cách nhau 3 bậc độ lớn, không có vùng xám. Timeout 4s cũ hoàn toàn hợp lý; **nên trả về 4s** sau khi đo xong, 15s chỉ làm run stall lâu gấp 4 lần vô ích.
2. **Không phải renderer nghẽn.** `eval` 1–3ms ngay giữa lúc wheel treo. Giả thuyết ghi sẵn trong header file (`--keep-gpu`: "software video decode may saturate the renderer main thread and stall Input.dispatchMouseEvent") **không khớp dữ liệu** — main thread nghẽn thì `Runtime.evaluate` phải chậm theo, mà nó nhanh như thường. (Cũng phù hợp: smoke13 GPU ON và smoke14 GPU OFF đều 4/5.)
3. **Lệnh mất hẳn, không phải chậm.** `lateAcks: []` — sau burst 1 run còn chạy thêm ~80s, ack vẫn **không bao giờ** về. `Input.dispatchMouseEvent` bị nuốt vĩnh viễn trong khi cùng WebSocket đó `Runtime.evaluate` vẫn trả lời bình thường. Kẹt khu trú ở **Input domain**, không phải ở kết nối CDP hay ở renderer.

**Stall là trạng thái của cả phiên, không phải của từng burst.** instr1/instr2 sạch cả 5; instr3 hỏng từ burst 1 và hỏng tiếp cả 5. Khớp với toàn bộ 9 run cũ: mọi run đều là 5-timeout hoặc 0-timeout, không run nào lẫn lộn. Điều kiện hỏng được định đoạt **lúc khởi tạo phiên**, trước cái wheel đầu tiên. Hệ quả thực dụng: retry wheel trong cùng một run là vô nghĩa; muốn cứu phải restart engine.

### Giả thuyết còn lại (chưa kiểm)

Triệu chứng "Input.dispatchMouseEvent không bao giờ ack, Runtime vẫn nhanh, kéo dài cả phiên, xuất hiện ~50% số lần khởi động" khớp với hành vi Chromium khi **widget của renderer không ở trạng thái hiển thị/nhận focus**: input đi từ browser process xuống widget và ack chỉ về sau khi input được xử lý — cửa sổ bị che/không focus thì ack không bao giờ về. Tính "ngẫu nhiên ~50%" khớp với việc cửa sổ mở lên bị cửa sổ khác che hay không, tức phụ thuộc môi trường chứ không phụ thuộc code.

Cách kiểm rẻ nhất, theo thứ tự: gọi `Page.bringToFront` ngay trước vòng scroll; nếu chưa đủ thì thêm `Emulation.setFocusEmulationEnabled {enabled:true}`. Cả hai đều 1 dòng, và **giả thuyết này sai/đúng lộ ra ngay trong 3–4 run** vì tỉ lệ hỏng đang là ~50%.

## Trạng thái fix (áp dụng 20/08/2026 13:5x)

| # | Mức | Việc | Trạng thái |
|---|---|---|---|
| F1 | MED | tách `endInFlight` (dedupe lúc request đến) khỏi `endSeen` (chỉ set khi upstream 2xx); `endLeaseIfHeld` tự end khi engine thử mà trượt | **ĐÃ FIX** |
| F2 | MED | `closeAllConnections()` trước `server.close()` | **ĐÃ FIX** — verify bằng test in-flight |
| F3 | LOW+ | `movedBy` yêu cầu `container.key` khớp; log `CHANGED->` khi element đổi | **ĐÃ FIX** |
| F4 | LOW | warm-up wheel, tách metric hangs | **CHƯA** — đổi ý nghĩa baseline, cần 1 run tốn seat để lập lại chuẩn |
| — | — | `endInFlight` ghi vào `result.relay` JSON | **ĐÃ THÊM** (chẩn đoán) |

### Kết quả 2 run xác minh (review1, review2 — default disable-gpu, --no-login)

| | exitCode | relay reqs | endSeen | endInFlight | relayEnd | scroll | cdp timeout |
|---|---|---|---|---|---|---|---|
| review1 | 0 | 2 | true | true | true | 1/5 | 4 |
| review2 | 0 | 2 | true | true | true | 0/5 | 5 |

**Relay: không hồi quy, chạy back-to-back OK.** Hai run liên tiếp không phải chờ 15 phút, không run nào exit 76, `endLeaseIfHeld` báo đúng "engine already sent session/end — nothing to do". F1/F2 an toàn.

**Scroll: tệ hơn smoke13/14 — nhưng KHÔNG phải do bản sửa.** Xem F6.

Lưu ý phạm vi: F1/F2 chỉ kích hoạt khi upstream lỗi/stall, nên 2 run bình thường **không chứng minh chúng đúng**, chỉ chứng minh không hồi quy. F2 được chứng minh riêng bằng test in-flight ở trên.

**F3 đã bắt được ca thật:** review2 burst 1 log `tiktok-1mjhtgd-7937d88b-- CHANGED->enable-1col-refine tiktok` — container thắng cuộc **đổi giữa before và after trong cùng một burst**. Lần này cả hai top đều 0 nên kết quả không lệch, nhưng giả định của F3 đã được xác nhận bằng quan sát, không còn là suy luận.

## Câu hỏi đã chốt (đo trực tiếp 20/08 14:03)

**1. End một lease đã end → HTTP 200 `{"ok":true}`. Idempotent.**
Nên **lỗ 2a (double-end) vô hại** — chỉ tốn 1 request thừa, không hỏng seat. Giá trị thật của F1 nằm hoàn toàn ở lỗ 2b (gate `upstream.ok`). Guard `endInFlight` giữ lại vì rẻ + làm rõ ý định, không phải vì cần thiết.

**2. Lease TTL = 900s (15 phút) chẵn, heartbeat 300s.** Không phải khoảng 7–17 phút như handoff ước lượng.
Hệ quả: backoff 25s/50s (tổng ~75s) **không đủ** để chờ một orphan lease hết hạn — retry chỉ cứu được nhánh cooldown ngắn sau graceful end, đúng như comment trong code. Gặp orphan thật thì 3 lần retry đều trượt và phải chờ tay tới 15 phút. Không phải bug, nhưng thông báo lỗi nên nói đúng con số 900s thay vì "7-17 min".

## Câu hỏi chưa giải

1. `canvasHash` đổi giữa run: đã kết luận là nhiễu, nhưng chưa có run nào lặp cùng seed để chứng minh seed *có* kiểm soát được gì. Nếu seed không tái lập được fingerprint thì đó là bug riêng của engine, không phải harness.

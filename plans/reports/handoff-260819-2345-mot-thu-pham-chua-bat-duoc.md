# Handoff — 0.3.7 đã dựng xong, `88dad47` được minh oan, watcher là thủ phạm

**19/08/2026 23:50** · **Bổ sung** cho [handoff-260819-2310](handoff-260819-2310-hoi-quy-profile-chet-sau-10-giay.md),
không thay thế. Bản đó đã được một phiên chạy song song cập nhật tới `900d2ec` và **là nguồn đúng**
về chẩn đoán (cờ vô can, `windowWatcher` là thủ phạm). Bản này ghi phần bổ sung: **những gì đã được
commit vào mã nguồn**, một lỗi thứ 7 vừa tìm ra, và cái bẫy đo lường đã làm hỏng 8 lượt seat.

## ⛔ Trạng thái: công cụ VẪN HỎNG — và `0.3.7` KHÔNG chữa được

`windowWatcher` là thủ phạm, và **nhánh này chưa đụng một dòng nào vào nó.** Bản vá thật chưa
được viết. Đừng cài `0.3.7` rồi mong profile sống.

**Đừng chạy runbook TikTok.**

### `0.3.7` để làm gì, nếu không chữa được

Hai thứ, đều không phải hồi quy 10 giây:

1. `get_runtime_info` trả **đúng** phiên bản đang chạy (xem "Bẫy số 0.3.1"). Cần cái này trước,
   nếu không thì mọi lần "đã cài chưa" ngày mai đều đọc phải một hằng số.
2. `Translate,MediaRouter` được khôi phục — bị vứt âm thầm từ 19/08.

Cài hay không tuỳ, nhưng **cài nó xong profile vẫn sẽ chết ~10 giây.** Đó là kết quả đúng như dự
kiến, không phải bằng chứng bản vá hỏng.

## Việc làm ngay, theo thứ tự

1. **Đọc kết quả phép đo `ZERO-PAGES` / `CDP-UNREACHABLE`** của phiên song song. Không có nó thì
   sửa `createWindowWatcher` là đoán — tối nay đã đoán sai hai lần rồi.
2. **Sửa `createWindowWatcher`** theo đúng nhánh đã nổ.
3. **Bump + rebuild** (`0.3.8`), cài, mở profile, bấm đồng hồ. Sống quá 60 giây = đạt.
4. Đạt → nghiệm thu DNS ở browserscan → rồi mới tới TikTok.

Nếu cài `0.3.7` trước để lấy `appVersion` đúng: gọi `get_runtime_info` → phải ra **`0.3.7`**.
Ra `0.3.1` ⇒ installer không đè lên bản cũ.

## Đã commit (nhánh `feat/cloakbrowser-licensed-engine-channel`, chưa đẩy)

```
c6ff114  fix(fingerprint) tra 6 co telemetry ve cho cu (thu hoi d625453)
a058eb6  fix(mcp)         appVersion tra ve ban that, khong phai hang so
363980d  chore(release)   0.3.7
d625453  fix(fingerprint) tach co DNS / telemetry  <- gia thuyet sai, da thu hoi
186dcee  <- HEAD cua phien truoc
```

Chênh lệch thực tế của cả nhánh lên `ChromiumBrowserDriver.ts` chỉ còn **một chỗ**: gộp hai cờ
`--disable-features`. **`windowWatcher` chưa bị đụng tới.**

## Đo được, chắc chắn

| Đo | Kết quả |
|---|---|
| Engine trần, **bộ cờ đã vá** | sống 75s, `Browser.close` → exit 0, nhả seat sạch |
| `build:win` sau cả 3 commit | toàn bộ test pass, 0 fail |
| Test hồi quy `appVersion` | gỡ 1 chỗ nối dây → đỏ; nối lại → xanh |

## Cái bẫy đã đốt 8 lượt seat — đọc trước khi đo lại

Phiên song song đã trả lời được câu "cờ nào giết": **không cờ nào cả** (engine trần + cả 9 cờ,
sống qua 60 giây, đo lúc 23:33). Phần dưới đây là **vì sao 8 phép đo của tôi không trả lời được**,
để phiên sau đừng lặp lại cách đo đó.

**Cái bẫy:** exit `76` (hết seat) đến **sau** khi CDP đã mở.
Đo được: một lần khởi động bị từ chối seat vẫn kịp mở CDP ở 1.1s, báo `pages=1`, rồi mới chết ở 1.5s.

Nên **không** cách nào phân biệt "chết vì cờ" với "chết vì seat bận" bằng:
- thời điểm chết (đã thấy 0.8s / 1.1s / 1.5s / 2.3s / 5.7s, tất cả đều là 76)
- việc CDP có trả lời hay không (có trả lời rồi vẫn chết vì seat)

Hai "kết luận" tôi suýt ghi vào code, cả hai đều là nhiễu seat:
- ~~`--disable-background-networking` giết, chết ở 5.7s~~ → đối chứng ngay sau, **không thêm cờ nào**, cũng chết ở 1.1s
- ~~"cả 9 cờ giết, CDP đã phục vụ rồi mới chết"~~ → chết ở 1.5s, đúng hình dạng của từ chối seat

Muốn đo tiếp thì **bắt buộc** theo nghi thức này, không có đường tắt:
đối chứng (không cờ) phải **sống đủ 75s** ngay trước → đóng bằng `Browser.close` → mới chạy phép thử.
Kết quả phép thử chỉ có giá trị khi đối chứng liền trước nó xanh.

## Thủ phạm: chính app giết trình duyệt (kết luận trùng khớp, hai đường độc lập)

Phiên song song kết luận điều này bằng thực nghiệm; tôi đến cùng chỗ bằng đường đọc mã. Ghi lại
đường đọc mã ở đây vì nó cho một tiêu chí **phân biệt được ngay trên UI, không cần đo**:

Trong `ChromiumBrowserDriver.ts` chỉ **2 chỗ** phát `kind: "closing"` — cái UI hiện thành "terminating":

- dòng 921 — `close()`: bấm Stop, hoặc `close_profile`
- dòng 870 — `windowWatcher`: `/json/list` báo **0 trang**, *hoặc CDP không gọi được*, liên tục >1.5s

Engine tự thoát thì đi đường khác hẳn: `child.on("exit")` → `finishExternalClose` → phát thẳng
`closed / external-exit`, **không bao giờ qua "closing"**.

⇒ **Không ai bấm Stop mà UI hiện "terminating" thì dòng 870 đã nổ: app tự giết trình duyệt.**

Khớp luôn với lease mồ côi: đường đó là `gracefulShutdown` → nếu `Browser.close` không xong trong 4s
thì SIGTERM → SIGKILL, mà **SIGKILL thì giữ seat**. Mỗi lần watcher nổ là mất một seat 7–17 phút.

**Chưa kiểm được** vì app đóng gói không ghi log ra đĩa (`console.*` bay hết).

## Bản vá cờ: đã commit, rồi đã tự thu hồi

`d625453` tách 6 cờ telemetry về nhánh proxy, dựa trên giả thuyết cờ giết trình duyệt.
Giả thuyết đó bị bác lúc 23:33 ⇒ `c6ff114` **trả 6 cờ về đúng chỗ `88dad47` đặt**.

Phần **còn giữ lại**, và là toàn bộ thay đổi của nhánh này lên driver: gộp hai cờ
`--disable-features` làm một. Có hai cái, Chromium chỉ nhận cái cuối ⇒ `Translate,MediaRouter` bị
vứt âm thầm từ 19/08. Lỗi thật, không liên quan hồi quy.

Chuyện "có nên scope 6 cờ đó theo proxy hay không" vẫn là câu hỏi mở, nhưng phải cãi trên lý lẽ
riêng của nó, không được đi nhờ vào một bản vá bug mà nó không vá.

## Nếu vẫn chết ~10 giây sau khi cài 0.3.7

Đo thẳng nghi phạm dòng 870, không cần đoán:

1. Mở profile qua MCP, lấy cổng CDP từ kết quả `launch_profile`
2. Poll `http://127.0.0.1:<cdp>/json/list` mỗi 500ms, ghi số target `type === "page"`
3. Đọc kết quả:
   - **pages tụt về 0** trước lúc chết ⇒ dòng 870 nổ, thủ phạm là app, **cờ vô can**
   - **pages giữ ≥1 tới lúc chết** ⇒ engine tự chết, quay lại bisect 6 cờ theo nghi thức ở trên

Script mẫu có sẵn: `probe.mjs` / `decisive.mjs` trong scratchpad phiên này (đã có sẵn vòng poll `/json/list`).

## Bẫy số 0.3.1

`get_runtime_info` trả `appVersion` lấy từ `MKT_BROWSER_MCP_SERVER_VERSION` — hằng số bám theo
**contract**, đứng yên ở `0.3.1` từ lâu. Máy đang chạy 0.3.6 mà MCP vẫn khai `0.3.1`.

Nghĩa là: **suốt hôm qua, mọi lần hỏi MCP "tôi đang chạy bản nào" đều nhận về một hằng số.**
Nếu có suy luận nào tối qua nhận dạng bản build bằng đường MCP thì suy luận đó dựa trên số sai.

`a058eb6` sửa: server nhận tuỳ chọn `appVersion`, desktop truyền `app.getVersion()`. Hằng số chỉ còn
làm giá trị dự phòng cho lần chạy standalone/mock. Test chặn ở từng chỗ dựng server.

## Nguyên văn còn nguyên giá trị từ bản 23:10

Các mục sau **không đổi**, đọc thẳng ở [bản 23:10](handoff-260819-2310-hoi-quy-profile-chet-sau-10-giay.md):
cơ chế seat và cách gọi MCP · mã thoát engine · lệnh build và bẫy Node ABI · nghiệm thu DNS ở
browserscan · đích merge là `main` chứ không phải `master` · nợ kỹ thuật · bảng 6 lỗi cùng hình dạng.

Bổ sung vào bảng đó **lỗi thứ 7**: `appVersion` phải khớp bản phát hành — ràng buộc giữa hai giá trị,
không ai phát biểu, không gì kiểm.

## Câu chưa giải quyết

1. `windowWatcher` nổ ở nhánh nào — `ZERO-PAGES` hay `CDP-UNREACHABLE`? (Phiên song song đang đo.)
2. Vì sao `/json/list` lại có lúc không còn target `page` nào? (Engine 151 mới cài lúc 17:03 hôm qua —
   có phải nó đổi cách khai báo target không?)
3. DNS sau khi vá có về VNPT không? Vẫn chưa ai đo.
4. Múi giờ đỏ và 10% thiếu trên browserscan.
5. Có đẩy nhánh lên GitHub mở PR sẵn không?

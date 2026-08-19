# Handoff — hồi quy: profile mở lên rồi chết sau ~10 giây

**19/08/2026 23:10 · GIẢI QUYẾT XONG 20/08 00:20**

---

# ✅ KẾT LUẬN CUỐI: CÔNG CỤ KHÔNG HỎNG

**Bằng chứng:** 00:04:39 chờ tới khi `active = 0` rồi mới gọi `launch_profile` →
**pid 22076 sống 393 giây liên tục**, `CDP pages = 1`, cửa sổ mở đúng trang browserscan.
Log của app **không có một dòng nào** của đường đóng.

## Chuỗi nhân quả thật

```
seat ban (lease treo tu lan chet truoc)
  -> engine exit 76  — NHUNG exit 76 den SAU khi CDP da mo (do duoc: CDP tra loi pages=1 o 1.1s, chet o 1.5s)
  -> windowWatcher thay CDP mat >1.5s
  -> emit "closing"  -> UI hien "terminating"
  -> gracefulShutdown + killBrowsersUsingDataDir
```

**"terminating" là triệu chứng ở cuối chuỗi, không phải nguyên nhân.** Nó làm cả hai phiên đi
lạc: nhãn đó chỉ do `close()` hoặc `windowWatcher` phát, nên ai đọc mã cũng kết luận "app tự
đóng" — đúng, nhưng app đóng vì *engine đã chết trước đó vì seat*.

## Vì sao seat lúc nào cũng bận

Gói free = **1 seat**. Mỗi lần engine chết không qua `Browser.close` để lại **lease mồ côi 7–17
phút**. Tối 19/08 có **hai phiên chạy song song** cùng thử mở liên tục → seat gần như không bao
giờ rảnh → mọi phép đo đều nhiễm nhiễu seat.

## Bốn giả thuyết đã sai, và vì sao

| Giả thuyết | Bác bỏ bằng |
|---|---|
| Probe kill cứng gây ra | Chết cả khi đóng êm |
| Lease treo giữ slot → engine tự thoát | Đo lúc `active = 0` vẫn chết *(nhưng lần đó seat đã bị lượt đo khác chiếm giữa chừng)* |
| `--disable-background-networking` giết | Đối chứng không cờ cũng chết ở 1.1s |
| Cả 9 cờ giết | Sống 60s khi seat thật sự rảnh |

Tất cả đều là **nhiễu seat** đọc nhầm thành tín hiệu.

## Nghi thức đo bắt buộc từ nay

Không có đường tắt. Trước **mỗi** phép thử:

1. Đối chứng **không cờ** phải sống đủ **75 giây**
2. Đóng bằng **`Browser.close`** (không kill)
3. Rồi mới chạy phép thử

Kết quả chỉ có giá trị khi đối chứng liền trước nó xanh. Thời điểm chết (0.8s / 1.1s / 1.5s /
2.3s / 5.7s đều đã thấy) và việc CDP có trả lời **đều không** phân biệt được "chết vì cờ" với
"chết vì seat".

## Việc còn lại — không cái nào chặn runbook

1. **`windowWatcher` báo sai nguyên nhân.** Nó phát `closing` như thể người dùng đóng cửa sổ,
   trong khi thật ra engine đã thoát. Nên phân biệt "CDP mất vì tiến trình đã chết" với "người
   dùng đóng tab", và **hiện mã thoát của engine** (76/77/78/79) lên UI. Đây là lỗi *thông báo*,
   không phải lỗi *hành vi* — nhưng nó vừa đốt của hai phiên gần bốn tiếng.
2. **Quét dọn lease mồ côi lúc khởi động** (mục nợ kỹ thuật cũ) — giờ thành ưu tiên cao hơn, vì
   đây là thứ tạo ra toàn bộ chuỗi trên.
3. Đối chiếu vân tay với persona (xem mục dưới) — `hardwareConcurrency: 16` vẫn chưa giải thích.

## ⚠️ Hai phiên chạy song song trên cùng cây làm việc

Phiên kia đã commit `d625453`, `363980d`, `a058eb6`, `c6ff114`, `24697b8` và viết
[handoff-260819-2345](handoff-260819-2345-mot-thu-pham-chua-bat-duoc.md). Bản đó kết luận *"công
cụ VẪN HỎNG"* — viết lúc 23:50, **trước** bằng chứng 393 giây ở trên. Phần "cái bẫy seat" của nó
vẫn đúng và là mảnh ghép quyết định.

Trước khi làm gì tiếp: **kiểm `git log` xem phiên kia đã đi tới đâu.**

---

## Bằng chứng, theo thứ tự thu được

```
22:48  launch_profile qua MCP -> pid 19920, cdp 9228, thanh cong
       +30s -> pid da chet, CDP khong tra loi
22:59  seat = 0 (TRONG), launch -> pid 26376, cdp 9229, thanh cong
       +10s -> pid DA CHET, seats = 1
```

Thư mục profile có `Session Storage`, `Extension State`, `shared_proto_db` ghi lúc 22:44:56 ⇒ engine
chạy rất sâu rồi mới chết, **không phải bị từ chối license lúc khởi động** (license fail thoát
trước khi tạo profile).

## Hai giả thuyết đã sai — đừng đi lại

1. ~~"Không phải lỗi tool, do probe kill cứng"~~ → **Sai.** Chết cả khi đóng êm.
2. ~~"Lease treo giữ slot nên engine tự thoát"~~ → **Sai.** Đo lúc `active = 0` vẫn chết sau 10s.
   Lease treo là **hệ quả**: mỗi lần chết để lại một lease mồ côi.

Mốc thời gian là bằng chứng mạnh nhất: profile chạy tốt suốt buổi tối trên các bản trước, hỏng
đúng từ **0.3.5** — bản đầu tiên mang `88dad47`.

## `88dad47` đã làm gì

Hoist **toàn bộ** khối cờ ra khỏi `if (profile.proxy)`, áp cho mọi profile:

```
--dns-over-https-mode=off  --dns-prefetch-disable  --disable-async-dns
--no-prerender  --no-pings  --disable-background-networking
--disable-component-update  --disable-domain-reliability
--disable-client-side-phishing-detection
```

### ❌ `--disable-background-networking` KHÔNG phải thủ phạm — đã loại bằng thực nghiệm

Đo lúc 23:16, engine trần + đúng một cờ đó: **sống qua 35 giây** (+5/+10/+20/+35 đều SỐNG).

Lý lẽ ban đầu nghe rất thuyết phục — kiểm license đi qua tầng mạng Chromium (đã chứng minh:
`--disable-features=AsyncDns` biến exit 78 thành 76), nên heartbeat có thể bị xếp là background
networking. **Sai.** Ghi lại đây để phiên sau đừng mất một lượt seat đi lại đường này.

### ❌ Cả 9 cờ cũng KHÔNG phải thủ phạm — đã loại bằng thực nghiệm

Đo 23:33, engine trần + **cả 9 cờ hoist cùng lúc**: sống qua **60 giây** (+5/+10/+20/+35/+60).

⇒ **`88dad47` được minh oan.** Bộ cờ vô can. Mốc thời gian trùng hợp đã đánh lừa cả tôi lẫn
cách đọc bằng chứng.

Vì sao khối cờ này chưa bao giờ lộ vấn đề trước đây: nó đã áp cho profile **có proxy** nhiều tháng
mà vô hại — nhưng suốt thời gian đó engine là **146, bản không có kiểm license**. Cặp "cờ mới +
engine có license" chỉ gặp nhau tối 19/08.

## ⚠️ CẬP NHẬT 00:15 — KHÔNG TÁI HIỆN ĐƯỢC sau khi khởi động lại app

Chạy lại app **từ terminal** (tắt hẳn rồi mở lại), gọi `launch_profile` qua MCP lúc 00:04:39:

```
pid 22076 -> SONG > 5 phut, CDP pages = 1, cua so mo dung trang browserscan
log khong co MOT dong nao cua duong dong
```

⇒ Lỗi **không tái hiện trên một instance app vừa khởi động**. Mọi lần chết trước đó xảy ra trên
instance app đã chạy từ ~18:00 và đã trải qua nhiều lần launch bị **giết từ bên ngoài** bằng
`Stop-Process` (do tôi dò lỗi).

### Giả thuyết mới, CHƯA kiểm chứng bằng code

`windowWatcher` mồ côi. Khi một launch bị giết từ bên ngoài, `close()` không chạy nên
`clearInterval(record.windowWatcher)` không chạy — interval cũ vẫn poll cổng cũ. Tới lúc nó kết
luận "đóng rồi", callback gọi:

```
gracefulShutdown(r)  +  killBrowsersUsingDataDir(r.browserDataDir)
```

`killBrowsersUsingDataDir` giết **mọi tiến trình đang dùng data-dir của profile đó** — kể cả một
launch MỚI vừa mở cho cùng profile. Khớp cả ba: chỉ chết khi app đã có launch bị giết trước đó,
chết sau ~10s, và app mới khởi động thì không chết.

**Việc phiên sau:** đọc `child.on("exit")` xem có `clearInterval(windowWatcher)` không. Nếu không
có thì đó là lỗi thật và sửa rất nhỏ.

## Thứ đã xác định chắc: `windowWatcher` là nơi THỰC THI cái chết

[`ChromiumBrowserDriver.ts:1472`](../../MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts#L1472)
— poll `http://127.0.0.1:<port>/json/list` **mỗi giây**, và kích hoạt khi:

- **0 target `type=="page"`** liên tục >1.5s, **hoặc**
- **CDP không trả lời** liên tục >1.5s

Kích hoạt rồi thì gọi callback ở dòng 865: emit `closing` → **UI hiện "terminating"** →
`gracefulShutdown()` → `killBrowsersUsingDataDir()`. Khớp từng chữ với triệu chứng.

### Vì sao mọi phép thử trước đó đánh lừa

Các lần chạy engine trần của tôi **không có `--remote-debugging-port`** ⇒ không có watcher nào theo
dõi ⇒ đương nhiên sống. Tôi đã so sánh sai đối tượng suốt buổi: "engine trần sống, app chết" bị
đọc thành "app truyền cờ độc", trong khi khác biệt thật là **có watcher hay không**.

### Phép thử đang chạy khi kết phiên

Mở engine kèm `--remote-debugging-port=9333` và poll `/json/list` y hệt watcher, in `pages=N` mỗi
giây. Kết quả sẽ chỉ đúng một trong hai nhánh:

- **`ZERO-PAGES`** → 151 không mở page target như 146. Sửa: watcher phải phân biệt "chưa có tab"
  với "đã đóng tab", hoặc nới ngưỡng khởi động (hiện chỉ bỏ qua 2 giây đầu).
- **`CDP-UNREACHABLE`** → cổng debug chết/đổi sau khi khởi động. Sửa ở tầng khác.

Đọc log của tiến trình nền trước khi làm gì.

## Bản vá cờ DNS — ĐÃ VIẾT, CHƯA COMMIT (giờ là việc RIÊNG, không liên quan hồi quy)

Nằm trong working tree: `M apps/desktop/src/main/ChromiumBrowserDriver.ts` (HEAD = `186dcee`).

Hai thay đổi:

1. **Gộp hai cờ `--disable-features` làm một.** Có hai cái (dòng 345 và 425); Chromium chỉ nhận
   **cái cuối** ⇒ `Translate,MediaRouter` bị vứt âm thầm. Lỗi thật, nhưng **không** phải thứ giết
   trình duyệt.
2. **Tách theo lý do tồn tại:** cờ **DNS** (`dns-over-https-mode=off`, `dns-prefetch-disable`,
   `disable-async-dns`) giữ cho mọi profile — đó mới là thứ browserscan bắt được. Cờ **telemetry**
   (6 cái còn lại) trả về nhánh `if (profile.proxy)`: chúng là biện pháp chống rò cho profile đi
   qua proxy; profile không proxy không có gì để rò vòng qua.

`tsc --noEmit` sạch. **Chưa chạy thử.**

## Việc phiên sau, theo thứ tự

1. **Đọc log phép thử `--remote-debugging-port`** để biết watcher thấy `ZERO-PAGES` hay
   `CDP-UNREACHABLE`, rồi sửa `createWindowWatcher` theo đúng nhánh đó.
2. **Commit bản vá** đang nằm trong tree.
3. **Rebuild `0.3.7`** — xem mục "Lệnh build".
4. **Cài** *(cần bấm, installer nâng quyền để ghi rule tường lửa)*.
5. **Mở profile qua app, xem có sống quá 60 giây không.** Đây là tiêu chí đạt/không đạt.
6. Sống → nghiệm thu DNS ở browserscan → rồi mới tới runbook TikTok.

## Cơ chế seat — biết trước để khỏi mất giờ

- Gói free = **1 seat**. Lease treo hết hạn sau **7–17 phút** (đo 3 lần: 17′, 7′, 11′).
- **Không nhả được bằng API.** `session/end` đòi `lease_id` + `install_id` + `instance_id`; quét
  toàn bộ `~/.cloakbrowser` và thư mục profile chỉ thấy `install_id`. Hai cái kia chết theo tiến
  trình. ⇒ **`Browser.close` là cách duy nhất nhả seat.**
- **Bộ đếm seat không chặn cứng đường app**: lúc 22:48 `launch_profile` qua MCP mở được khi
  `active = 1`, trong khi engine trần cùng lúc bị exit 76. ⇒ **kiểm bằng MCP, đừng kiểm bằng engine
  trần** — nhanh hơn nhiều.

### Gọi MCP của app

```
port  47822 (127.0.0.1)   token: %LOCALAPPDATA%\MKTTool\MKTBrowser\mcp-token
POST /mcp   Authorization: Bearer <token>
            Accept: application/json, text/event-stream
tools: get_runtime_info, list_profiles, create_profile, launch_managed_profile,
       launch_profile, close_profile, update_profile, list_fingerprint_options
launch_profile dung tham so `profile_id` (KHONG phai profileId)
profile test: 876a1611-32bb-403e-b4c7-4b8cb81f6e41
```

### Mã thoát engine

`76` hết seat · `77` key sai/thiếu · `78` không tra được DNS của máy chủ license · `79` không ghi
được state cục bộ.

### Lệnh build

```
export PATH="/e/tools/node-v22.23.1:$PATH"       # Node 22, khong phai 24
unset ELECTRON_RUN_AS_NODE                        # khong thi Electron thoat ngay
export MKT_BROWSER_ENGINE_RELEASE_FILE="E:/MKTWorkspace/MKTBrowser/apps/desktop/windows-engine-release.json"
yarn workspace @mktbrowser/desktop build:win
```

`better-sqlite3` phải ở **Node ABI** để cổng test qua (`npm rebuild better-sqlite3` trong
`apps/desktop` và `packages/profile-manager` với Node 22). Chạy `yarn dev` sẽ đổi nó sang Electron
ABI và làm build gãy — hai chế độ xung khắc.

## ✅ Nghiệm thu browserscan — ĐÃ LÀM lúc 00:10 trên engine 151, persona VN, không proxy

```
Bot Detection ............ No        ✅
authenticity ............. 90%
language ................. vi-VN    ✅
DNS Leak ................. 172.217.47.22 (+8)   <- IP cua Google
```

### "DNS leak" KHÔNG phải lỗi trình duyệt — là cấu hình máy

```
Get-DnsClientServerAddress:
  Ethernet : 8.8.8.8, 8.8.4.4    <- Google DNS dat CUNG tren may
  Wi-Fi    : 172.20.10.1         <- gateway hotspot iPhone
```

Chromium hỏi resolver mà hệ điều hành chỉ định. **Không cờ nào sửa được.** `88dad47` nhắm vào DoH,
còn thứ browserscan bắt được là DNS của máy.

**Hệ quả cho runbook: chạy trên hotspot thì vấn đề tự biến mất** — DNS đi tới `172.20.10.1` (điện
thoại) rồi ra nhà mạng, khớp với IP di động. Đừng chạy profile trên đường Ethernet đang cắm DNS
Google. Muốn sửa hẳn thì để DNS Ethernet về tự động (DHCP).

### Còn nghi: vân tay có thể đang rò thông số host

Probe của chính app (`[mkt-browser] post-bootstrap probe`) trong log báo:

```
hardwareConcurrency: 16     <- may MSI co 16 lo^i
tz: "Asia/Saigon"           <- mui gio host (co the chi la alias cua Asia/Ho_Chi_Minh)
langs: ["vi-VN","vi","fr-FR","fr","en-US","en"]   <- fr-FR o dau ra?
brands: [{"brand":"Not=A?Brand",...}]              <- ky tu la
```

**Chưa đối chiếu được với persona** — `list_profiles` qua MCP không phơi trường vân tay (trả None).
Phiên sau đọc thẳng DB profile-manager. Nếu persona khai 8 lõi mà trang thấy 16 thì đó là rò thật,
và nghiêm trọng hơn mọi thứ trong file này.

Chưa bấm: **"Detection"** cạnh *IP Time Zone* (đang đỏ), **"Unexpand"** ở thanh *authenticity 90%*.

## Merge — đích là `main`, KHÔNG phải `master`

```
master  83c6898 · 26/07 · v0.3.1     <- con tro chet
main    origin/HEAD tro vao day       <- trunk that
nhanh feat/cloakbrowser-licensed-engine-channel:
  hon origin/main 17 commit, kem 1, CHUA day len remote
```

Thứ tự: profile sống lại → nghiệm thu DNS → `pull --rebase origin main` → chạy lại `test:installer`
→ đẩy nhánh → PR vào `main`. **Đừng merge khi chưa có profile sống.**

## Nợ kỹ thuật (không chặn)

1. **Quét dọn mồ côi lúc khởi động.** App đóng đúng chuẩn rồi (`Browser.close` → SIGTERM → SIGKILL)
   và `before-quit` gọi `closeAll()`. Nhưng app bị tắt cứng thì chrome con mồ côi giữ seat.
   `findBrowserProcessesUsingDataDir` đã có sẵn — cần gọi lúc khởi động và đóng bằng
   **`Browser.close`**, không SIGKILL (SIGKILL vẫn giữ seat).
2. **Phase-04** dựng lại tile/layout — cần nhìn bằng mắt.
3. **Bộ ký compatibility set** — chặn bởi nghi thức khoá, cần chủ dự án ngồi vào máy.
4. **IPv6 khi lên proxy (GĐ 1)** — egress hiện là IPv6 VNPT; proxy chỉ IPv4 thì IPv6 đi vòng qua.

## Bài học — 6 lỗi, cùng một hình dạng

| Lỗi | Ràng buộc không được phát biểu |
|---|---|
| GNU tar che bsdtar | PATH quyết định binary nào chạy |
| Cổng pin thiếu bộ ghi | Có hàm đọc, không có hàm ghi |
| Tường lửa chặn UDP 53 | "Chặn hết UDP" giết luôn DNS |
| Cờ DNS kẹt trong `if (profile.proxy)` | Profile không proxy không nhận cờ nào |
| NSIS cắt chuỗi ở 8192 | Cắt xong vẫn chạy tiếp |
| **Hai cờ `--disable-features`** | **Chromium chỉ nhận cái cuối, vứt cái trước** |

`186dcee` là bản duy nhất biến ràng buộc thành thứ **tự lên tiếng khi bị vi phạm**. Hướng đó đáng
nhân rộng hơn là thêm comment — comment không chặn được ai.

Bài học riêng của phiên: **đã hai lần đổ lỗi ra ngoài (probe, lease treo) trước khi nghi bản vá
của chính mình.** Mốc thời gian chỉ thẳng vào `88dad47` ngay từ đầu — hỏng đúng từ bản đầu tiên
mang nó. Đáng ra phải nghi mình trước.

## Câu chưa giải quyết

1. Watcher thấy `ZERO-PAGES` hay `CDP-UNREACHABLE`? Quyết định cách sửa.
2. DNS sau khi vá có về VNPT không?
3. Múi giờ đỏ và 10% thiếu trên browserscan là gì?
4. Có đẩy nhánh lên GitHub mở PR sẵn không?

# Handoff — hồi quy: profile mở lên rồi chết sau ~10 giây

**19/08/2026 23:10** · Thay thế [handoff-260819-2245](handoff-260819-2245-viec-hoan-sang-phien-sau.md),
bản đó viết lúc còn tưởng công cụ đã chạy được.

## ⛔ Trạng thái: CÔNG CỤ ĐANG HỎNG — đừng chạy runbook TikTok

Mở profile → engine khởi động, tạo profile, mở cổng CDP, `launch()` trả về **thành công** →
**~10 giây sau tiến trình chết.** UI hiện "terminating".

Nguyên nhân gần như chắc chắn: **hồi quy do commit `88dad47`** (của phiên này).

Đừng đốt acc TikTok cho tới khi profile sống được quá 60 giây.

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

### Còn lại trong diện nghi

Tám cờ kia của khối hoist, hoặc **tổ hợp** của chúng, hoặc **không phải cờ nào cả** — trường hợp
đó thì thủ phạm nằm ở phía app (`windowWatcher`, hoặc đường tháo dỡ sau `launch()`).

Phép thử kế tiếp đã cắm: chạy engine trần với **cả 9 cờ hoist cùng lúc**.
- Chết → là cờ, bisect tiếp trong 8 cái còn lại
- Sống → **cờ vô can, thủ phạm ở phía app** — đổi hẳn hướng điều tra

Vì sao trước đây không lộ: **engine 146 không có kiểm license.** Cờ này đã áp cho profile có proxy
nhiều tháng mà vô hại.

## Bản vá — ĐÃ VIẾT, CHƯA COMMIT, CHƯA XÁC NHẬN

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

1. **Xác nhận thủ phạm** *(tuỳ chọn, để hiểu)*: chạy engine trần chỉ thêm
   `--disable-background-networking`, xem có chết trong 35s không.
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

## Nghiệm thu còn thiếu (sau khi profile sống lại)

Mở profile **không proxy** → `browserscan.net` → đọc **DNS Leak**: phải ra resolver **VNPT / Việt
Nam**. Trước khi vá là `74.114.31.150` + 5 IP nước ngoài. Vá ở `88dad47`, **chưa ai xác nhận**.

Bấm luôn: **"Detection"** cạnh *IP Time Zone* (đang đỏ) và **"Unexpand"** ở thanh *authenticity 90%*.

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

1. ~~`--disable-background-networking`~~ đã loại. Cờ nào trong 8 cái còn lại — hay không phải cờ nào, mà là phía app?
2. DNS sau khi vá có về VNPT không?
3. Múi giờ đỏ và 10% thiếu trên browserscan là gì?
4. Có đẩy nhánh lên GitHub mở PR sẵn không?

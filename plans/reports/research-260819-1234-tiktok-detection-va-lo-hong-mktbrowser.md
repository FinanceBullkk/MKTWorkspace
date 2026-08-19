# TikTok detection & lỗ hổng thật của MKTBrowser

**Ngày:** 19/08/2026 · **Nguồn:** binary CloakBrowser đang cache trên máy + code + web research

---

## 1. CloakBrowser có patch TLS JA3/JA4 không? → **KHÔNG**

Kiểm bằng cách trích bảng switch từ `chrome.dll` (295 MB, build 146.0.7680.177.5):

```
grep -a -o -E "fingerprint-[a-z0-9-]{2,40}" chrome.dll | sort -u
```

Toàn bộ 19 switch `--fingerprint-*` mà binary hỗ trợ:

| Switch | Đang dùng? |
|---|---|
| `fingerprint` (seed) | ✅ |
| `fingerprint-platform` | ✅ |
| `fingerprint-platform-version` | ✅ |
| `fingerprint-timezone` | ✅ |
| `fingerprint-screen-width` / `-height` | ✅ |
| `fingerprint-hardware-concurrency` | ✅ |
| `fingerprint-device-memory` | ✅ |
| `fingerprint-gpu-vendor` / `-renderer` | ✅ |
| `fingerprint-brand-version` | ✅ |
| `fingerprint-webrtc-ip` | ✅ |
| `fingerprint-location` | ✅ |
| **`fingerprint-fonts-dir`** | ❌ **chưa dùng** |
| **`fingerprint-storage-quota`** | ❌ **chưa dùng** |
| **`fingerprint-taskbar-height`** | ❌ **chưa dùng** |
| **`fingerprint-locale`** | ❌ code ghi "không tồn tại" — **sai** |
| `fingerprint-noise` | seed lo (gián tiếp) |
| `fingerprint-brand` | không cần |
| `fingerprint-failure` | debug |

Không có switch nào cho TLS/JA3/JA4. Grep `(tls|ssl)-*` chỉ ra switch Chromium gốc
(`ssl-version-min/max`, `ssl-key-log-file`, `tls-trust-anchor-ids`…). Chuỗi "JA3"/"JA4"
có xuất hiện nhưng lẫn cả `jA3`, `Ja4` → nhiễu nhị phân ngẫu nhiên trong file 295 MB, không phải feature.

**Nhưng đây không phải lỗ hổng.** Từ Chrome 110, Chromium **tự xáo thứ tự TLS extension** trong
ClientHello mỗi kết nối → JA3 của Chrome thật cũng đổi liên tục, vendor phải dùng JA4 (có sort).
CloakBrowser **là** Chromium 146 build thật → JA4 + thứ tự H2 frame + hành vi TCP giống hệt Chrome 146 thật.
Không cần patch. Chỗ nào phải cẩn thận là proxy: `socks5Bridge.ts` chuyển byte nguyên vẹn, không đụng TLS → an toàn.

## 2. Cache CloakBrowser → **ĐÃ CÓ, không phải tải lại**

```
C:\Users\anhha\AppData\Roaming\MultiZen\chromium\cloakbrowser\146.0.7680.177.5\
537 MB · cài 2026-08-01T19:13Z · sha256 b213795c… · chrome.exe + chrome.dll đầy đủ
```

Chỉ có engine `cloakbrowser`, không có thư mục `cft` → **chưa bao giờ chạy engine không patch**.

Lệch version: `CHROME_VERSION_FULL = "147.0.7727.138"` trong code vs binary 146. **Không phải bug** —
`detectChromiumVersion()` + `reconcileVersionInFingerprint()` đọc version thật của binary mỗi lần launch
rồi sửa UA cho khớp ([ChromiumBrowserDriver.ts:207-221](../../MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts#L207-L221)).

## 3. Gemini lấy `fingerprint.ts` ở đâu? → **đoán, không đọc**

Bằng chứng: Gemini nói *"code đang dùng JavaScript để đè lên `Canvas.toDataURL()`"*. Grep toàn repo:

```
grep -rn "toDataURL|canvas" --include=*.ts packages/profile-manager/src apps/desktop/src/main
→ 1 hit duy nhất: một dòng COMMENT ở ChromiumBrowserDriver.ts:1238
```

Không có một dòng code nào override `toDataURL`. Gemini nêu đích danh một API không tồn tại trong file
nó tự nhận đang phân tích. Cộng thêm việc nó "đề xuất" tích hợp CloakBrowser — thứ đã là engine mặc định
từ đầu — kết luận: nó suy từ tên file + hiểu biết chung về antidetect browser, không đọc nội dung.

---

## 4. TikTok detect như thế nào (research)

Bốn tầng, xếp theo thứ tự request bị chặn:

**Tầng 1 — mạng.** TLS/JA4, thứ tự H2 frame, hành vi TCP/IP. Đây là chỗ script Python/Node chết ngay.
Trình duyệt thật đi qua tầng này miễn phí. → **ta ổn.**

**Tầng 2 — chữ ký request.** `webmssdk.js` chạy một **VM JavaScript tự chế obfuscate** trong trang,
sinh `X-Bogus` (double-MD5 + RC4 + base64 alphabet riêng) rồi `X-Gnarly` (PRNG nền ChaCha20).
`msToken` đến từ `Set-Cookie`, đổi mỗi response. Ba lớp phụ thuộc nhau + phụ thuộc UA.
Sai chữ ký → response **0 byte**. Đổi thứ tự param cũng làm hỏng chữ ký.
→ **chỉ vượt được bằng cách chạy trong trình duyệt thật.** Đây là lý do kỹ thuật cứng cho nguyên tắc
"không build engagement tự động hàng loạt" trong plan 260819-0952.

**Tầng 3 — fingerprint.** webmssdk thu: canvas, WebGL, AudioContext, **font enumeration**, screen, UA, timezone.
→ ta phủ hết, **trừ font** (xem mục 5).

**Tầng 4 — hành vi + đồ thị tài khoản.** Device ID, IP, cookie, lịch sử duyệt → "device trust score".
Một acc dính shadowban kéo theo mọi acc chung IP/fingerprint. Tín hiệu bị nêu đích danh:
engagement không giống người thật, follow/unfollow để kéo traffic, đổi quốc gia giữa phiên.
Không tài liệu nào nói TikTok đo chuyển động chuột / nhịp gõ phím trên web → **đừng build cái đó.**

## 5. Ta đang thiếu gì (xếp theo mức độ)

### 5.1 Font enumeration — lỗ hổng thật, mức cao

`--fingerprint-fonts-dir` có sẵn nhưng không dùng. Hậu quả:

- Font list = font Windows thật của máy MSI. Máy VN thường có font lạ (Unikey, MS Office VN, font tự cài)
  không khớp persona "Windows 11 US/EN".
- **Nghiêm trọng hơn:** mọi profile trên cùng máy có **font list y hệt nhau** → một trường liên kết
  hoàn hảo giữa 3, 10, 100 acc. Canvas/WebGL noise đã rotate theo seed, font thì không.
- webmssdk thu font list — đây là một trong 6 surface được nêu đích danh.

### 5.2 `--fingerprint-storage-quota` — mức trung bình

`navigator.storage.estimate().quota` ≈ dung lượng đĩa trống. Không set → mọi profile báo cùng một con số,
và con số đó là ổ đĩa thật. Lại là trường liên kết.

### 5.3 `--fingerprint-taskbar-height` — mức thấp

`screen.availHeight` suy từ taskbar máy thật. Với `screen.height` đã bị spoof, hiệu số
`height - availHeight` có thể ra giá trị vô lý. Vendor có check này.

### 5.4 `--fingerprint-locale` — nợ kỹ thuật, không phải lỗ hổng

Comment ở [ChromiumBrowserDriver.ts:1176-1180](../../MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts#L1176-L1180)
khẳng định CloakBrowser không có switch này ("verified against the binary") → nên locale đi qua CDP
`Emulation.setLocaleOverride`. Binary 146 **có** switch đó, nằm ngay cạnh `fingerprint-fonts-dir` trong bảng switch.
Có thể switch mới thêm ở 146, hoặc lần verify trước sai. Dùng native sẽ bỏ được lớp CDP duy nhất còn sót trên CloakBrowser.

### 5.5 Không phải lỗ hổng (đã xử)

- CDP bị phát hiện: `Page.enable` là domain duy nhất bật lúc connect; `Runtime.enable` không bao giờ bật
  ([CdpSession.ts:115-128](../../MKTBrowser/packages/cdp-driver/src/CdpSession.ts#L115-L128)). Đây là kỹ thuật
  Cloudflare/DataDome dùng — ta đã né.
- WebRTC, DNS leak, canvas/audio noise, coherence UA↔WebGL↔screen: đã phủ.

## 6. Đề xuất

1. **Đo trước.** Mở 1 profile → `creepjs`, `browserscan.net`, `fingerprint-scan.com`. Chụp lại. 15 phút.
   Hiện repo không có một con số đo nào.
2. **Nếu font hiện ra vấn đề** → thêm `--fingerprint-fonts-dir` + một thư mục font per-persona. Sửa ~20 dòng.
3. `--fingerprint-storage-quota` + `--fingerprint-taskbar-height`: thêm cùng lúc, ~4 dòng.
4. Test `--fingerprint-locale` native, nếu chạy thì bỏ lớp CDP.
5. **Không** build engagement tự động (tầng 2 chặn cứng). Connector AdsPower **đã có sẵn** ở
   `MKTTool/src/lib/antidetect/adspower-adapter.ts` — không cần build gì thêm.
6. GĐ 0: 3 acc / 1 IP hotspot là chấp nhận được. Ở GĐ 1 (10 kênh) thì 3 dongle cho 10 acc + font list
   giống hệt nhau = rủi ro liên kết thật, nên fix font trước khi lên GĐ 1.

---

## Câu hỏi chưa giải quyết

1. `--fingerprint-fonts-dir` nhận định dạng gì — thư mục chứa file font, hay file danh sách? Phải test.
2. `--fingerprint-locale` là switch sống hay chuỗi chết trong binary? Chạy thử rồi đọc `Intl.resolvedOptions()`.
3. Seed `--fingerprint=` đã rotate font list chưa, hay chỉ canvas/audio/WebGL? Nếu đã rotate thì 5.1 hạ cấp mạnh.
4. CloakBrowser upstream có phát hành bản 147/148 chưa? Đang chạy 146 từ 01/08.

## Nguồn

- [Reverse Engineering TikTok's Web Protection](https://autodev.blog/posts/tiktok-research-article/)
- [tiktok-xgnarly-decoded](https://github.com/carcabot/tiktok-xgnarly-decoded)
- [armxe/tiktok-api — X-Argus, X-Bogus overview](https://github.com/armxe/tiktok-api)
- [Multilogin — TikTok Shadow Ban 2026](https://multilogin.com/blog/tiktok-shadow-ban/)
- [antidetectbrowser.org — TikTok ban risks 2026](https://antidetectbrowser.org/blogs/tiktok-account-ban-risks-avoidance-strategies-2026)
- [auditsocials — TikTok fake engagement policy 2026](https://www.auditsocials.com/blog/tiktok-fake-artificial-engagement-policy-2026-bots-bought-followers-account-risk)

---

## 7. [BỔ SUNG 12:45] Lỗ hổng lớn nhất: engine đóng băng ở Chrome 146

Nặng hơn font. Không phải lỗi code — là **đứt nguồn cung**.

### Bằng chứng

`ChromiumBootstrap` tải asset từ `api.github.com/repos/CloakHQ/CloakBrowser/releases`, tìm file
`cloakbrowser-windows-x64.zip`. Liệt kê 30 release gần nhất:

| Release | Ngày | Có binary Windows? |
|---|---|---|
| `chromium-v151.0.7922.108.2-pro` | 18/08/2026 | ❌ chỉ SHA256SUMS |
| `chromium-v150.0.7871.114.6-pro` | 11/08/2026 | ❌ |
| `chromium-v150.0.7871.114.4-pro` | 31/07/2026 | ❌ |
| `chromium-v148.0.7778.215.5-pro` | 05/07/2026 | ❌ |
| **`chromium-v146.0.7680.177.5`** | **21/05/2026** | ✅ **binary công khai cuối cùng** |

→ Bootstrap tự động rơi về release cuối còn asset = 146. Cache trên máy đúng bản đó.
Máy này **không có** file pin (`active-engine.json`), tức chạy chế độ "lấy mới nhất" — và "mới nhất"
đã đứng yên từ 21/05.

### Vì sao nguy hiểm

Chrome stable tháng 8/2026 ≈ **151**. Ta khai **146** → chậm 5 major, giãn thêm ~1 major/tháng.
Chrome thật tự cập nhật rất gắt; thị phần Chrome 146 ở 8/2026 gần như bằng 0.
Không phải mâu thuẫn (JS engine đúng là 146 thật) mà là **hiếm** — hiếm chính là tín hiệu.

Release note của chính upstream viết:

> *"anti-bot systems flag browsers that lag behind the latest release, so a current base keeps your
> user-agent, feature set, and rendering behavior aligned with what real users report."*

### Nguyên nhân: CloakBrowser đã thương mại hoá

Chuyển sang mô hình license key, binary tải qua wrapper (`pip install cloakbrowser` /
`npm install cloakbrowser`), biến môi trường `CLOAKBROWSER_LICENSE_KEY`. Mọi tier chạy v151.

| Tier | Session đồng thời | Giá |
|---|---|---|
| Free (đăng nhập GitHub) | 1 | 0đ |
| Solo | 5 | $19/th |
| Team | 20 | $49/th |
| Business | 200 | $199/th |

### Cần độ gì

1. Đổi `ChromiumBootstrap` từ "tải asset GitHub" sang "tải qua license key". Không phải rewrite —
   thay tầng resolve URL + thêm 1 secret. Ước ~1 ngày.
2. GĐ 0 (3 kênh, chạy lần lượt) → free key đủ. GĐ 1 (10 kênh) → Solo $19 hoặc Team $49.
   Rẻ hơn proxy, rẻ hơn nhiều so với AdsPower/Multilogin.
3. **Cảnh báo di trú:** upstream ghi rõ *"a fixed `--fingerprint` seed may resolve to a different
   complete hardware identity on Chromium 151"*. Tức nâng engine = mọi profile cũ đổi máy trong mắt
   TikTok. Phải **xoay seed + profile + IP cùng lúc**, hoặc giữ acc cũ trên build 146.
   → **Nâng engine TRƯỚC khi tạo acc thật.** Nâng sau khi đã nuôi acc là tự bắn chân.

### Phương án B nếu không muốn trả tiền

BotBrowser (GitHub, build công khai, miễn phí) — cùng loại patch C++. Đổi engine tốn công hơn
vì bộ switch khác, nhưng `ChromiumBootstrap` đã có sẵn khái niệm nhiều engine.

## 8. Đã kiểm, KHÔNG phải lỗ hổng

- **Extension companion** nạp vào mọi profile: chỉ match `chromewebstore.google.com/detail/*`,
  không có `web_accessible_resources` → TikTok không thấy gì.
- **Seed ổn định:** `fingerprintSeed()` = sha256(profileId) → cùng một vân tay qua mọi lần mở.
- **CDP:** chỉ `Page.enable`; `Runtime.enable` không bao giờ bật.
- **AdsPower connector:** đã có sẵn (`MKTTool/src/lib/antidetect/adspower-adapter.ts`).

## 9. Thứ tự ưu tiên độ

| # | Việc | Công | Mức |
|---|---|---|---|
| 1 | Đo thật (CreepJS/browserscan/fingerprint-scan) | 15 phút | phải làm trước |
| 2 | Chuyển kênh engine → license key, lên 151 | ~1 ngày | **cao nhất** |
| 3 | `--fingerprint-fonts-dir` | ~20 dòng | cao |
| 4 | `--fingerprint-storage-quota` + `-taskbar-height` | ~4 dòng | trung bình |
| 5 | Thử `--fingerprint-locale` native, bỏ lớp CDP | ~10 dòng | thấp |

---

## 10. [ĐO THẬT 14:25] Baseline đo được trên máy MSI

Phép đo đầu tiên của repo. Công cụ: `scratchpad/probe-cloakbrowser-fingerprint.mjs` — launch binary với
đúng bộ switch `buildCloakBrowserFingerprintArgs()` phát ra, nối CDP (chỉ `Runtime.evaluate`, không
`*.enable`), đọc giá trị trang thật sự thấy. Trang phục vụ qua `127.0.0.1` để có secure context —
`about:blank` **không** phải secure context và làm `userAgentData`/`deviceMemory`/`storage` biến thành
undefined, dễ đọc sai thành "spoof thất bại".

Persona test: Windows 11, 1920×1080, 8 core, 8 GB, Intel UHD 630, **timezone America/New_York** (cố ý
khác host `Asia/Saigon` để phân biệt "switch có tác dụng" với "host bị lộ").

### CloakBrowser 146 — mọi switch đang dùng đều được tôn trọng

| Bề mặt | Giá trị đo | Kết luận |
|---|---|---|
| userAgent | `Chrome/146.0.0.0` | ✅ |
| uaBrands | Chromium 146 · Not-A.Brand 24 · Google Chrome 146 | ✅ đồng nhất |
| uaPlatform / platformVersion | `Windows` / `11.0.0` | ✅ |
| architecture / bitness | `x86` / `64` | ✅ |
| navigator.platform | `Win32` | ✅ |
| cores / deviceMemory | 8 / 8 | ✅ |
| screen | 1920×1080, dpr 1 | ✅ |
| timeZone | **`America/New_York`** | ✅ switch thật sự hoạt động, không phải host |
| locale | `en-US` | ✅ (qua CDP override) |
| WebGL renderer | ANGLE Intel UHD 630 … | ✅ ghim đúng |

### Ba lỗ hổng: xác nhận bằng số, không còn là suy luận

| Bề mặt | Đo được | Vấn đề |
|---|---|---|
| **fontsPresent** | **16 font** — Segoe UI, Calibri, Cambria, Consolas, Tahoma, Verdana, Georgia, Times New Roman, Arial, Arial Narrow, Courier New, Impact, Malgun Gothic, Leelawadee UI, Nirmala UI, SimSun | Font **host** của máy MSI. Không có font macOS, không có font VN. Seed **KHÔNG** xoay danh sách này → mọi profile trên máy báo y hệt 16 font ⇒ trường liên kết hoàn hảo. **Trả lời câu hỏi mở #3: seed không rotate font.** |
| **storageQuota** | **594.197.555** (~594 MB) | Suy từ ổ đĩa thật. Giống nhau mọi profile. |
| **taskbarDelta** | **48 px** (height 1080 − availHeight 1032) | Taskbar máy thật. Giống nhau mọi profile. |

## 11. [ĐO THẬT] Kênh licensed + binary 151

| Kiểm | Kết quả |
|---|---|
| `/api/download/version` (không cần key) | `151.0.7922.108.2` |
| `SHA256SUMS` công khai | khớp hash trên GitHub — hai nguồn độc lập |
| Tải 537.518.332 byte + verify | **checksum khớp**, giải nén OK, `chrome.exe` ở gốc |
| 151 chạy **không** key | **exit 77** (key invalid/missing) — binary tự cưỡng chế license lúc chạy |
| 151 chạy **có** key | **exit 0**, render DOM OK |
| `/api/license/validate` | `{"valid":true,"plan":"free","expires":null}` |
| `/api/license/session/count` | `{"valid":true,"active":1}` |

### Bug đã bắt được nhờ đo (nếu không đo thì mọi user tải fail)

Endpoint archive trả **302 sang presigned Cloudflare R2**. Electron `net.request` **giữ** header
`Authorization` qua redirect → R2 trả **HTTP 400** (URL presigned tự mang chữ ký, header lạ gây xung đột).
`fetch` không gặp lỗi này vì spec buộc nó **bỏ** `Authorization` khi redirect cross-origin — nên test
bằng `fetch` ra 206 trong khi đường code thật ra 400.

`removeHeader()` không cứu được: Electron cấm sửa header sau khi request đã gửi, mà đó là lúc duy nhất
biết được redirect. **Fix:** giải redirect ở tầng manifest bằng `fetch` + `redirect:"manual"`, trả URL
cuối tự xác thực, không kèm header. Sau fix: **HTTP 206**, `content-range` phủ đủ 537.518.332 byte,
`accept-ranges: bytes` (resume dùng được), 2 MB chảy thật.

### Ràng buộc vận hành mới phát hiện — quan trọng cho GĐ 0

Free key = **1 session**, và **cưỡng chế bởi binary**, không phải bởi wrapper. Lease nằm phía server:
một trình duyệt bị force-kill **không kịp nhả lease**, nên lần mở kế tiếp bị từ chối **exit 76** cho tới
khi lease hết hạn. Đo được thật: sau khi kill probe, `session/count` vẫn báo `active:1` và 6 lần thử
liên tiếp đều exit 76.

Hệ quả: nếu MKT Browser crash hoặc bị tắt cứng, operator sẽ không mở lại được profile trong vài phút.
`licenseExitMessage(76)` đã nói rõ nguyên nhân, nhưng đây là ma sát thật cần biết trước khi vào GĐ 0.
Bản trả tiền ($19/th, 5 session) làm vấn đề này biến mất vì còn slot dự phòng.

## 12. Trạng thái code

Đã sửa, `yarn typecheck` + eslint + test settings-store đều pass:

| File | Nội dung |
|---|---|
| `apps/desktop/src/main/cloakbrowser-pro-channel.ts` | **mới** — kênh licensed, giải redirect presigned, bảng dịch exit 76/77/78/79 |
| `ChromiumBootstrap.ts` | manifest thêm `headers`; rẽ nhánh có-key/không-key; getter key |
| `ChromiumBrowserDriver.ts` | truyền `CLOAKBROWSER_LICENSE_KEY` vào env con (thiếu → exit 77); thêm `USERPROFILE`/`APPDATA`/`LOCALAPPDATA` cho Windows (thiếu → exit 79); log lý do license khi exit |
| `packages/settings-store/src/index.ts` | field `cloakBrowserLicenseKey` |
| `apps/desktop/src/main/index.ts` | nối settings → bootstrap |

### Chưa kiểm được

1. **Đo fingerprint đầy đủ trên 151** — bị chặn bởi lease session, không phải lỗi. Cần chờ lease hết
   hạn rồi chạy lại `probe-cloakbrowser-fingerprint.mjs`. (151 đã chứng minh chạy được: exit 0 + DOM.)
2. **End-to-end qua app thật** — bị chặn bởi lỗi **có sẵn từ trước**: `better-sqlite3` trong
   `apps/desktop/node_modules` build cho Node ABI 127, Electron 42 cần ABI 146. Dev app không khởi
   động nổi. Bản đóng gói 16/08 chạy được (pilot 18/08) nhưng chứa code cũ. Fix: `npx electron-rebuild`
   (devDependency `@electron/rebuild` đã có, chưa nối script) — chưa tự chạy vì ngoài phạm vi và có thể
   fail nếu thiếu VS Build Tools.
3. **Ô nhập key trong Settings UI** — cố ý hoãn; env var đủ để test.
4. **`--fingerprint-fonts-dir` nhận định dạng gì** — bản 146 nhận switch mà không báo lỗi khi trỏ vào
   thư mục rỗng, nên chưa suy ra được. Cần so danh sách font trước/sau với thư mục có font thật.

---

## 13. [ĐO THẬT 14:40] Thử từng switch — hai nhận định trước phải rút lại

Nguyên tắc áp dụng: **chỉ ship switch đã chứng minh có tác dụng.** Kết quả thử trên 146:

| Switch | Thử | Kết quả |
|---|---|---|
| `--fingerprint-taskbar-height=0` | | availHeight 1080, delta 0 |
| `--fingerprint-taskbar-height=22` | | availHeight 1058, delta 22 |
| `--fingerprint-taskbar-height=25` + persona macOS | | availHeight 1055, delta 25 |
| **→ ĐÃ IMPLEMENT** | | hoạt động chính xác |
| `--fingerprint-storage-quota=2000000000` | | quota → 2.097e15 byte = giá trị **× 1048576** ⇒ đơn vị **MiB** |
| **→ HOÃN** | | lý do bên dưới |
| `--fingerprint-fonts-dir=<dir chứa .ttf>` | arial.ttf + times.ttf | font list **không đổi** (vẫn 16) |
| `--fingerprint-fonts-dir=<file danh sách tên>` | | font list **không đổi** |
| **→ KHÔNG IMPLEMENT** | | switch được nhận nhưng **trơ** trên bản free 146 |

### RÚT LẠI: storage-quota không phải trường liên kết đã chứng minh

Mục 10 ghi `storageQuota = 594.197.555` là "suy từ ổ đĩa thật". **Sai.** Phép đo đó chạy trên origin
`http://127.0.0.1`, và Chrome cấp quota theo origin. Ổ C: thật có **86 GB trống / 365 GB** — nếu quota
suy từ đĩa thì con số phải cỡ hàng chục GB, không phải 567 MiB.

Nên: chưa chứng minh được nó lộ gì. Cộng thêm việc chưa biết dải giá trị thực tế nào là hợp lý, đặt một
con số đoán vào có thể làm profile **bất thường hơn** hiện tại. Hoãn cho tới khi đo được trên origin
https thật. (Lần thử đo trên `example.com` bị lỗi probe, chưa lấy được số.)

### fonts-dir không phải lời giải cho lỗ hổng font

Lỗ hổng font (mục 10) **vẫn đúng**: 16 font host, seed không xoay, mọi profile giống nhau. Nhưng
`--fingerprint-fonts-dir` **không sửa được** trên bản 146 — trơ với cả hai định dạng. Giả thuyết: nó
trỏ tới bộ font-asset nhúng mà chỉ bản Pro có. Chưa kiểm được trên 151 (lease session).

### PHÁT HIỆN MỚI: persona macOS trên host Windows bị font tố

Đo persona macOS (`--fingerprint-platform=macos`) trên máy Windows:

- UA, `uaPlatform`, `platformVersion` 14.6.0, `architecture: arm`, `navigator.platform: MacIntel` — ✅ đúng hết
- Font: **16 → 8**. CloakBrowser tự **lọc bỏ** font Windows-only (Segoe UI, Calibri, Cambria, Consolas,
  Malgun Gothic, Leelawadee UI, Nirmala UI, SimSun)
- Nhưng 8 font còn lại chỉ là phần giao Windows∩macOS. **Không có Helvetica Neue, SF Pro Text, Menlo,
  Geneva, Monaco** — một máy Mac không có Helvetica là bất khả thi

Kết luận: CloakBrowser **lọc** font theo platform nhưng không **tổng hợp** font mà platform đó phải có.

Liên quan tới quyết định ở [ChromiumBrowserDriver.ts:217-221](../../MKTBrowser/apps/desktop/src/main/ChromiumBrowserDriver.ts#L217-L221):
trên CloakBrowser code cố ý **tôn trọng** lựa chọn platform của người dùng (không snap về host như CFT).
Quyết định đó vẫn hợp lý cho UA/WebGL/screen, nhưng **font thì không theo** — nên 7 device family Mac
trong danh sách sẽ tạo persona bất khả thi khi chạy trên máy Windows.

**Chưa sửa** — đây là đảo ngược một quyết định thiết kế có chủ đích, cần chủ dự án quyết. Ba lựa chọn:
(a) cảnh báo trong UI khi chọn family Mac trên host Windows, (b) snap Mac→Windows cả trên CloakBrowser,
(c) để nguyên và chỉ dùng persona Windows. **Với GĐ 0 (host Windows, thị trường VN) thì (c) là đủ** —
persona Windows vốn là lựa chọn đúng, không cần sửa code.

## 14. Đã implement trong phiên này

| File | Thay đổi | Trạng thái |
|---|---|---|
| `cloakbrowser-pro-channel.ts` (mới) | kênh licensed + giải redirect presigned + dịch exit 76-79 | ✅ đo thật: 206, checksum khớp |
| `ChromiumBootstrap.ts` | `headers` trong manifest, rẽ nhánh có/không key, getter | ✅ |
| `ChromiumBrowserDriver.ts` | truyền `CLOAKBROWSER_LICENSE_KEY` vào env con; `USERPROFILE`/`APPDATA`/`LOCALAPPDATA` cho Windows; log lý do license; **`--fingerprint-taskbar-height`** | ✅ đo thật: không key → exit 77, có key → exit 0; delta 25 đúng |
| `settings-store/src/index.ts` | field `cloakBrowserLicenseKey` | ✅ |
| `index.ts` | nối settings → bootstrap | ✅ |

`yarn typecheck` + eslint + test settings-store: pass.

## Câu hỏi chưa giải quyết (cập nhật)

1. `--fingerprint-fonts-dir` có tác dụng trên bản Pro 151 không? Nếu có thì nhận định dạng gì? (Trên 146
   trơ hoàn toàn.)
2. `storageQuota` trên origin https thật là bao nhiêu — có suy từ ổ đĩa host hay không?
3. TTL của lease session phía server là bao lâu? Đo được: >15 phút sau khi kill, `session/count` vẫn
   `active:1`. Ảnh hưởng trực tiếp tới trải nghiệm operator khi app bị tắt cứng.
4. Đo fingerprint đầy đủ trên 151 — chờ lease nhả.
5. Persona Mac trên host Windows: chọn (a), (b) hay (c)?

---

## 15. [15:20] End-to-end XONG — và nó bắt được 3 bug mà typecheck không thấy

Chạy main process của app với `--user-data-dir` tạm (cache engine rỗng) để buộc tải thật. **Không đụng
bản 146 của operator** — nếu sai thì chỉ mất thư mục tạm.

Kết quả cuối:

```json
{ "version": "151.0.7922.108.2",
  "binaryRelative": "runtime\chrome.exe",
  "sha256": "7b16ae3070bfcbed9cd381d03d1a8d57a8baf8f4540650397d620eb8dbe89561" }
```

537.518.332 byte tải xong, SHA-256 khớp manifest công khai, giải nén, cài đặt, binary có mặt.

### Bug 1 — `net.query` giữ Authorization qua redirect (đã sửa)

Đã ghi ở mục 11. Điểm đáng nhớ: **test bằng `fetch` cho kết quả PASS trong khi đường code thật FAIL**,
vì spec buộc `fetch` bỏ header còn `net.request` thì không.

### Bug 2 — `??` thay vì `||` (đã sửa)

```ts
opts.cloakBrowserLicenseKey ?? process.env.CLOAKBROWSER_LICENSE_KEY ?? ""
```

Settings trả `""`, mà `??` chỉ rơi qua khi `null`/`undefined` → nhánh env không bao giờ chạy → key rỗng →
bootstrap đi đường keyless về **146**. Tức nếu không chạy end-to-end thì toàn bộ công việc hôm nay
**không có tác dụng gì** mà mọi thứ vẫn "pass".

### Bug 3 — regex version chặn 5 thành phần (đã sửa)

`^\d+(\.\d+){2,3}$` từ chối `151.0.7922.108.2`. CloakBrowser nối số patch riêng vào version Chromium.

### Bug 4 — `tar` sai binary (đã sửa, là điểm giòn thật)

Giải nén fail: `tar: Cannot connect to C: resolve failed`.

| tar | Nguồn | Kết quả trên đúng file đó |
|---|---|---|
| GNU tar 1.35 (`/usr/bin/tar`, Git for Windows) | đứng trước PATH | fail — không đọc zip, hiểu `C:` là host rsh |
| bsdtar 3.8.4 (`System32	ar.exe`) | đứng sau | giải nén hoàn hảo |

Ban đầu là artifact do mình chạy app từ Git Bash. **Nhưng là bug thật**: máy nào cài Git for Windows
cũng gặp, và thông báo lỗi cũ **chỉ sai hướng** — bảo là tải lỗi/antivirus trong khi nguyên nhân là PATH.
Đã sửa: gọi bsdtar theo đường dẫn tuyệt đối từ `%SystemRoot%`.

## 16. Trạng thái commit

Branch `feat/cloakbrowser-licensed-engine-channel`, commit `f6fdeeb`, 5 file, +387/-2.
`yarn typecheck` + eslint + test settings-store: pass.

## 17. Còn nợ

1. **Ô nhập key trong Settings UI** — CHƯA LÀM. Hiện key chỉ đọc từ biến môi trường, nên operator không
   tự cấu hình được. **Bắt buộc phải có trước khi phát bản đóng gói.** Chỗ để thêm:
   `apps/desktop/src/renderer/src/components/screens/Settings.tsx`, ngay dưới Row "Browser engine"
   (dòng ~154-190), theo cùng khuôn `patch({ ... })`.
2. `--fingerprint-fonts-dir` **trơ trên cả 146 và 151** → lỗ hổng font không vá được bằng switch này.
   BotBrowser có font engine nhúng nhưng $299/tháng. Cách sống chung: ít profile trên mỗi máy (GĐ 0 với
   3 kênh vốn đã thoả).
3. `--fingerprint-storage-quota` — hoãn, chưa chứng minh là lỗ hổng (số cũ là artifact origin localhost).
4. Persona Mac trên host Windows: chọn (a) cảnh báo UI / (b) snap về Windows / (c) chỉ dùng persona
   Windows. Đề xuất (c) — không cần code.

---

## 12. [ĐO BÊN THỨ BA 19:18] browserscan trên engine 151

Phép chấm đầu tiên **không phải của mình**. Persona Việt, **không proxy** — đúng cấu hình mà
buổi test TikTok đầu tiên sẽ chạy.

| Mục | Kết quả |
|---|---|
| **Bot Detection** | **No** ✅ |
| **Fingerprint authenticity** | **90%** |
| Browser | Chrome 151.0.7922.109 · Windows 11 ✅ |
| IP / ISP | `2001:ee0:…` · ho chi minh / Vietnam · VNPT |
| IP Time Zone | Asia/Ho_Chi_Minh ✅ khớp persona |
| language | vi-VN ✅ |
| Proxy | No ✅ đúng cấu hình |
| **DNS Leak** | **`74.114.31.150` + 5 resolver nữa — đều ở nước ngoài** ❌ |

Bốn trường nhận dạng (IP, múi giờ, ngôn ngữ, nền tảng) **đồng nhất**. Không mâu thuẫn nội tại,
không bị chấm là bot.

### Lỗi tìm ra nhờ phép đo này — và nó nằm đúng đường test

DNS đi qua resolver nước ngoài trong khi IP là VNPT TP.HCM. Nguyên nhân là **phạm vi**, không
phải logic: toàn bộ cờ chống rò DNS (`--dns-over-https-mode=off`, `--disable-features=DnsOverHttps…`,
`--dns-prefetch-disable`) nằm trong `if (profile.proxy)`. Profile **không** proxy không nhận
dòng nào ⇒ Chrome tự nâng cấp lên DoH ⇒ DNS ra Cloudflare/Google.

Mà profile test đầu tiên **chính là ca không proxy** (acc rác trên hotspot). Không sửa thì phép
đo 72h mang sẵn một điểm lệch đã biết.

Đã sửa: `88dad47` — hoist khối DNS ra khỏi nhánh proxy, áp cho mọi profile.

### Chưa xử: egress là IPv6

`2001:ee0:…` là IPv6 của VNPT. Chưa quan trọng lúc không proxy (đó là IP thật, đúng như khai).
**Thành vấn đề ở GĐ 1**: proxy chỉ IPv4 thì IPv6 đi vòng qua proxy — đường rò IP thật kinh điển.
Launch có proxy đẩy mọi thứ qua cầu SOCKS5 nên HTTP an toàn; khe hở còn lại là WebRTC, đã phủ
bằng rule tường lửa + `--fingerprint-webrtc-ip`.

### Hai chỗ chưa đọc kỹ

- **IP Time Zone hiển thị màu đỏ** trên browserscan. Persona và IP đều Asia/Ho_Chi_Minh nên
  không rõ nó cảnh báo gì — phải bấm "Detection" xem chi tiết.
- **10% còn thiếu** của "fingerprint authenticity" là gì — trang không nói ở màn tóm tắt.

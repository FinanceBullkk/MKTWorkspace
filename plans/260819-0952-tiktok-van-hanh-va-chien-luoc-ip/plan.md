# TikTok — vận hành và chiến lược IP

> **Historical, not approved for rollout (superseded 30 August 2026).** TikTok automation/content,
> real-channel setup, and IP strategy below remain parked technical history. Current roadmap wording
> permits only a controlled technical demo; Browser real-account rollout is NO-GO, Lane C is
> **CLOSED** because no CloakBrowser channel exists, and no posting schedule or vendor request is
> active. See `MKTTool/docs/development-roadmap.md` and the consolidation plan.

**Trạng thái:** sẵn sàng chạy GĐ 0 · **Tạo:** 19/08/2026 · **Giả định chưa xác nhận:** thị trường Việt Nam

Ghi lại các quyết định của phiên 19/08/2026. Trước phiên này hướng sản phẩm là Facebook; chủ dự án
chốt trong phiên rằng **tool sẽ tập trung cho TikTok**. Điều đó đổi bài toán IP, nên toàn bộ phân
tích proxy ở đây được viết lại từ đầu chứ không kế thừa.

## Giả định phải xác nhận trước khi tiêu tiền

**Kênh nhắm thị trường Việt Nam.** Chủ dự án chưa chốt; toàn bộ kế hoạch dưới đây viết theo giả định
này vì nó ít rủi ro nhất cho giai đoạn đầu.

Nếu thật ra nhắm US: đổi proxy sang **mobile US** (đắt hơn nhiều), nội dung tiếng Anh, giờ đăng theo
múi giờ US — tức lịch làm việc của operator lệch hẳn. **Cấu trúc ba giai đoạn giữ nguyên**, chỉ đội
chi phí và độ khó.

## Vì sao TikTok khác Facebook ở đúng chỗ đang bàn

1. **IP quyết định *khán giả*, không chỉ quyết định *có bị chặn hay không*.** Thuật toán phân phối
   theo vùng nó tin bạn đang ở, nhất là giai đoạn đầu của kênh. Nên "dùng IP nước nào" là **câu hỏi
   kinh doanh**, không phải câu hỏi kỹ thuật. Chống phát hiện chỉ là ràng buộc phụ.
2. **TikTok khắt khe với IP không phải nhà dân hơn Facebook**, đặc biệt lúc tạo tài khoản mới.
3. **TikTok phân phối cho người lạ ngay từ đầu**, không cần follower. Nên một kênh mới có thể lên
   view ngay nếu nội dung tốt — và **100 kênh nội dung dở kiếm đúng 0đ**. Nút thắt là nội dung, không
   phải số lượng tài khoản. Tư duy "nuôi nhiều acc" mang từ Facebook sang là bẫy đắt nhất.

## Nguyên tắc xuyên suốt

> **Đừng build thêm tool cho tới khi đã vận hành thật một lần.**

Ngày 18/08 tìm ra 6 lỗi trên đường onboarding, **không lỗi nào tìm được bằng đọc code** — tất cả chỉ
lộ khi cho một máy chạy thật. Tool hiện có nhiều tính năng chưa ai dùng bao giờ.

Hệ quả thứ hai, cho phần build: **xây tool để *nhân năng lực* operator, đừng xây để *thay thế*
operator.** Engagement tự động hàng loạt (xem/like/follow bằng máy) là chỗ tài khoản TikTok chết
nhiều nhất, đồng thời là phần khó build nhất vì TikTok web ký request bằng lớp obfuscation riêng —
tệ ở cả hai đầu. Mục tiêu đo được: **một người vận hành được 10 kênh.**

## Ba giai đoạn

| | Làm gì | Hạ tầng | Chi phí | Điều kiện mở |
|---|---|---|---|---|
| **GĐ 0** | 3 kênh, chạy thật, đo | iPhone 7 Plus + laptop MSI | **0đ** | — |
| **GĐ 1** | 10 kênh, tự động phần lặp | 2–3 dongle 4G | ~2–3tr/th | kênh sống **và** có view |
| **GĐ 2** | Scale | tự build farm dongle | vốn ban đầu | biết **doanh thu/kênh** |

**Con số phải theo dõi không phải "bao nhiêu acc sống" mà là "doanh thu trên mỗi kênh".** Rất nhiều
người tối ưu tỉ lệ sống rồi kiếm được 0đ.

GĐ 1 **mua sẵn** thay vì tự build có lý do: nó cho biết **thật sự cần bao nhiêu cổng** trước khi bỏ
vốn. Rất dễ đoán 10 rồi hoá ra cần 3, hoặc cần 30.

## GĐ 0 — chi tiết

### Chuẩn bị (~15 phút, 0đ)

1. iPhone 7 Plus: lắp SIM, bật dữ liệu di động, bật Điểm truy cập cá nhân, **cắm sạc và để cắm luôn**
2. Laptop MSI: **tắt WiFi nhà**, nối vào WiFi của iPhone
3. Kiểm `whatismyipaddress.com` trên MSI → phải thấy **Viettel/Vina/Mobi + Vietnam**. Còn thấy nhà
   mạng cáp quang là MSI chưa thoát WiFi nhà
4. Mở MKT Browser trên MSI, tạo **3 profile**

Không cài thêm phần mềm gì. Máy tính chính không đụng tới — vẫn WiFi nhà, vẫn code và deploy.

**Không cần sửa code:** `proxyGeo.ts` probe qua hotspot sẽ nhận geo VN, `proxyGeoLaunch.ts` tự set
`Asia/Ho_Chi_Minh`. Khớp luôn với máy thật — không còn thứ gì phải giả.

### Tuần 1 — nuôi, không đăng

- **Ngày 1–3:** chỉ tiêu thụ. Xem hết clip, thi thoảng like, follow vài kênh cùng ngách.
  15–30 phút/kênh/ngày. **Không đăng gì.**
- **Ngày 4–7:** avatar, bio, username. Tương tác nhẹ. Tối đa 1 bài thử.

Tránh: follow/like hàng loạt, đăng ngay sau khi đăng ký, đổi IP giữa chừng trong tuần đầu.

### Tuần 2 — đăng và đo

1–2 bài/ngày/kênh.

### Ba thứ phải ghi lại

1. **Kênh có sống không** — 3/3 hay rớt mấy cái
2. **Video có lên view không** — thứ quyết định có tiền hay không
3. **Tool vướng ở đâu** — mọi chỗ phải dừng lại nghĩ, **kể cả chỗ tự gỡ được**

Mục 3 chính là **step 6 của pilot onboarding đang trống**
([plan](../260818-0915-first-operator-pilot-onboarding/plan.md)). Chạy 3 kênh TikTok trên MSI hoàn
thành luôn step 5 và 6 — MSI tới nay vẫn chưa làm xong một đơn vị công việc thật nào.

## Quyết định về IP

### Xếp hạng cho TikTok, tốt nhất trước

1. **Mobile (4G/5G)** — phù hợp nhất, cách biệt. TikTok sinh ra từ mobile nên IP nhà mạng di động là
   *bình thường* với nó. Thêm nữa **carrier NAT**: hàng nghìn người thật dùng chung một IP công
   cộng, nên TikTok không thể ban cả dải, **và nhiều tài khoản chung một IP là mặc định của thế giới
   thật** — khác hẳn residential/ISP nơi 2 acc chung IP là dấu hiệu. Một cổng mobile gánh được
   **3–5 tài khoản**.
2. **Residential** — chấp nhận được, rẻ hơn nhiều
3. **ISP proxy** — dùng được cho tài khoản đã nuôi, **không nên dùng đăng ký mới**
4. **Datacenter** — không

### Hai IP đã có, đo ngày 19/08/2026

| | Webshare SG `82.27.250.13` | IPRoyal US `161.77.145.29` |
|---|---|---|
| 5 blacklist | sạch | sạch |
| **IPQS Recent Abuse** | **False** | **True** ⛔ |
| **IPQS Bot Activity** | **False** | **True** ⛔ |
| IPQS score | 65 | 84 |
| Scamalytics | 0 | 31 |

**Xử lý:** IPRoyal → yêu cầu đổi IP. Webshare SG → giữ, **dùng test tool**, không gán kênh thật.

### Cách đọc kết quả kiểm IP — bẫy quan trọng

**Điểm tổng của Scamalytics không đo IP nào cả.** Cả hai lần nó ghi rõ *"we have no visibility into
the web traffic directly from [IP], and therefore apply a risk score based on the overall risk from
[org]"*. Nên 0 và 31 đo **danh tiếng nhà cung cấp**, không đo hai địa chỉ. Một khoảng trống dữ liệu
được trình bày thành con số tự tin — đúng cái quy tắc *"một tập chưa từng đo thì không tồn tại"*.

Thứ thật sự đo IP là **`Recent Abuse` và `Bot Activity` của IPQS**. Đó là quan sát trên chính địa chỉ đó.

**Quy trình kiểm cho mỗi IP mới:**

1. 5 dòng blacklist — bất kỳ dòng nào `Yes` → loại
2. IPQS `Recent Abuse` / `Bot Activity` — `True` → loại
3. IPQS fraud score — chỉ so **tương đối giữa các IP cùng lô**, con nào lệch hẳn lên thì bỏ

Mọi IP loại này đều bị gắn `Proxy: True`. Đó là thuế cố định, không phải lỗi của IP cụ thể.

**Giá không dự đoán được độ sạch.** IPRoyal đắt hơn Webshare đáng kể mà con được cấp lại có tiền sử
lạm dụng. Tiền mua được *loại* IP tốt hơn, không mua được *lịch sử* của đúng địa chỉ được cấp.

### Nguyên tắc ghép IP với tài khoản

**IP phải khớp nơi tài khoản vẫn thường vào** — không phải nơi bạn ngồi, cũng không phải nơi bạn
muốn nhắm tới. Tài khoản có lịch sử ở VN mà đột nhiên vào từ Singapore là một cú nhảy vị trí, và nó
nặng hơn mọi chi tiết fingerprint.

**1 IP : 1 tài khoản** trên residential/ISP. Trên mobile thì 3–5 acc/cổng là bình thường.

## Fingerprint — đã kiểm ngày 19/08/2026

Chạy trên MKT Browser qua proxy Webshare SG, ba trang browserleaks.

**Đạt:** `timeZone` = `Asia/Singapore` khớp IP · `language`/`languages` = `en-SG` · WebRTC không rò ·
IPv6 không rò · DNS không có resolver VN nào · `webdriver: false` · `plugins` đúng 5 entry Chrome
thật · JA4 TLS và Akamai HTTP/2 hash đều là Chrome chuẩn · `platform`/`maxTouchPoints`/`formFactors`
nhất quán · **canvas đứng yên qua 5 lần reset** ← phép kiểm quan trọng nhất, canvas đổi giữa hai lần
F5 là flag nặng nhất trong antidetect.

**Không có mẩu Việt Nam nào lọt ra** — cả chuỗi locale, giọng đọc TTS, timezone đều en-*/SG.

**Ghi nhận, không phải lỗi:**

- **TCP fingerprint = "Android" trong khi UA = Windows.** Bắt tay TCP do *máy chủ proxy* thực hiện
  nên vân tay tầng TCP luôn là OS của exit node — **không cờ Chromium nào sửa được**. Ở đây gần như
  chắc chắn là **VM Linux**, không phải điện thoại: browserleaks dùng bộ phân loại kiểu p0f và
  Android với Linux server dùng chung mặc định nhân Linux (timestamps bật, window scale 10).
  *Ghi chú: nhận định ban đầu trong phiên là "proxy mobile nên được tin hơn" — sai, và lý do yên tâm
  đó không đứng vững.*
- **WebRTC trả về zero candidate.** Là **chủ ý**, từ
  `--force-webrtc-ip-handling-policy=disable_non_proxied_udp` (`ChromiumBrowserDriver.ts`). Chrome
  thật thường vẫn phát một candidate mDNS `.local`, nên không có gì cả là hơi khác thường. Đánh đổi
  kín-hơn-hay-giống-hơn, code đã chọn kín hơn.
- **`rtt: 0` trong Network Information API.** `downlink: 10` là trần Chrome nên bình thường, nhưng
  `rtt: 0` hơi lạ. Chưa kết luận. **Cách kiểm dứt điểm:** mở Chrome thật trên cùng máy, chạy đúng ba
  trang đó, so từng dòng.
- **`Intl locale = en-GB` vs `navigator.language = en-SG`** — ICU fallback, máy Singapore thật cũng
  vậy. Rủi ro thấp.

**Vector không spoof được, đáng nhớ ở mức đội:** danh sách giọng đọc `SpeechSynthesis` lấy thẳng từ
OS host. Máy test chỉ có giọng US English nên không lộ. Nhưng **máy nào trong đội cài giọng tiếng
Việt sẽ lộ bất kể proxy ở đâu.** Không cờ Chromium nào che được — đưa vào hướng dẫn vận hành trước
khi có operator thứ ba.

## Hạ tầng cho GĐ 1 và 2 — dongle, không phải điện thoại

### Mua đúng loại

- **Loại cần: "USB Modem 4G"** (Huawei E3372 và tương tự) — cắm vào máy tính, **hiện ra như một card
  mạng**. Cắm 10 cái = 10 card mạng = 10 IP cùng lúc.
- **Loại KHÔNG dùng được: "USB phát WiFi từ SIM 4G"** — mỗi cái phát một mạng WiFi riêng, mà máy
  tính chỉ nối được một mạng WiFi tại một thời điểm. 10 cái thì 9 cái nằm không.

### Vì sao dongle chứ không phải phone farm

**Pin là vấn đề lớn nhất của phone farm.** Pin lithium không được thiết kế để cắm sạc đầy 100% suốt
24/7: chai rất nhanh, **phồng**, và pin phồng trong phòng kín là nguy cơ cháy thật. Nhiệt và pin là
một vấn đề chứ không phải hai — nóng làm pin chai nhanh hơn, pin chai lại sinh nhiệt nhiều hơn.

**Dongle không có pin.** Toàn bộ nhóm vấn đề đó biến mất. Nó sinh ra để cắm điện chạy liên tục, chạy
mát, rẻ hơn điện thoại. Đó là lý do farm nghiêm túc nào cũng là dàn modem.

**Vậy vì sao vẫn có người build phone farm?** Bốn lý do, quan trọng nhất trước:

1. **Phần lớn phone farm không phải để làm proxy** — người ta dựng để chạy **chính app TikTok trên
   Android thật**, thuyết phục hơn tự động hoá web nhiều. Dongle không chạy app được.
2. SIM data cho dongle đôi khi được nhà mạng cấp dải IP khác SIM điện thoại
3. Gói cước rẻ thường cấm hoặc bóp tốc độ khi ra khỏi điện thoại (phát hiện qua IMEI/TTL)
4. Điện thoại cũ dễ kiếm

**MKT Browser điều khiển Chromium desktop, không chạy app Android** → chỉ cần IP di động → **dongle
là đúng**. Nhưng đáng suy nghĩ cho về sau: TikTok vốn là nền tảng của app; tài khoản chỉ dùng web
suốt đời là kiểu ít gặp. Nếu tới GĐ 2 mà kênh khó lên, đó là hướng phải xét — và lúc đó phone farm
mới có lý do tồn tại thật.

### Nếu vẫn phải dùng điện thoại — cách xử lý pin/nhiệt

- **Giữ pin ở 30–80%, đừng để đầy.** Hub USB bật tắt được từng cổng + script: trên 80% cắt điện,
  dưới 30% cấp lại. Đọc pin qua `adb shell dumpsys battery`. Máy root được thì chặn sạc ở mức hệ thống.
- **Hub USB phải có nguồn riêng.** Chỗ hỏng kinh điển: hub thường không đủ điện cho 5 máy vừa sạc vừa
  chạy, rồi rớt mạng ngẫu nhiên lúc 3 giờ sáng.
- **Bỏ ốp lưng** (ốp là chăn ủ), **đừng chồng máy**, dựng đứng cách nhau vài phân, kệ lưới sắt.
- **Một quạt 12cm** thổi ngang giàn là đủ. Không cần điều hoà.
- **Tắt màn hình** (nguồn nhiệt lớn nhất), tắt WiFi/Bluetooth/GPS.
- **Cảnh báo trên 40°C liên tục; trên 45°C tắt máy đó ngay.** Mỗi tháng nhìn tận mắt một lần — pin
  phồng thấy được: màn hình vênh, đặt xuống bàn thì cập kênh. Thấy là bỏ máy, đừng tiếc.
- Kệ sắt hoặc mặt không cháy, **lắp báo khói**, đừng để phòng ngủ.

### Trước khi mua lô

**Mua đúng MỘT cái test trước.** Ba phép kiểm, mất một buổi, cứu khỏi mua nhầm cả lô:

1. Cắm vào máy **có hiện ra như card mạng không** — đúng loại chưa
2. **Gói cước có bị bóp không** khi SIM ra khỏi điện thoại — ở VN chuyện này có thật
3. Bật/tắt kết nối **có đổi được IP không** — không đổi được là mất tính năng xoay IP

### Chi phí farm tự build (để dành GĐ 2)

Tự build ~1tr tiền thiết bị (một lần) + ~150k/tháng SIM cho mỗi cổng, so với ~1tr/tháng/cổng mua sẵn
→ hoàn vốn 1–2 tháng. **Chi phí ẩn mới là phần quyết định:** thời gian dựng và bảo trì liên tục, đồ
hỏng (chết pin, chết cổng sạc, SIM bị khoá), **phải có người ở gần** vì không debug từ xa được cổng
USB lỏng, điện/chỗ để/nhiệt, và gói "không giới hạn" thường bóp tốc độ sau một ngưỡng.

Ở 10 cổng thì đáng. Ở 1–3 cổng thì không.

## Việc cho tool

**Không build tính năng mới nào trong GĐ 0.** Chỉ đóng nốt việc đang dở:

- Merge MKTTool PR #38 + Redeploy khi Railway hồi (xem
  [handoff](../reports/handoff-260819-0806-pilot-onboarding-and-four-releases.md))
- Re-publish MKT Browser 0.3.2 với `--relay-version=15`

Sau 2 tuần GĐ 0, **danh sách vướng sẽ tự nói cần build gì** — đáng tin hơn mọi phỏng đoán hôm nay.

**Một thứ đã lộ ra, để làm sau GĐ 0:** `ProxyTester.tsx` hiện country/city/IP/timezone nhưng **không
có điểm danh tiếng**. Nên bấm test ra xanh chỉ nghĩa là *proxy sống và geo khớp*, không nghĩa là *IP
này dùng được* — sáng 19/08 phải mở hai website ngoài mới biết IP IPRoyal bẩn. Cùng họ với 3/6 defect
ngày 18/08: câu trả lời đúng về mặt kỹ thuật nhưng người đọc hiểu rộng hơn thực tế.

## Rủi ro

- **Giả định thị trường VN chưa được xác nhận.** Mọi quyết định IP phía trên treo vào nó.
- **Hiểu biết về ngưỡng TikTok có hạn.** Ngưỡng không công khai và mức siết đổi nhanh. Mọi con số ở
  đây là hình dạng chung, không phải luật. **Hai tuần GĐ 0 đáng tin hơn toàn bộ tài liệu này** — nó
  đo đúng nhà cung cấp, đúng ngách, đúng thời điểm.
- **TikTok web khó tự động hoá hơn Facebook một bậc** (lớp ký request obfuscated). Ảnh hưởng kiến
  trúc tool, không chỉ ảnh hưởng proxy.
- **SIM dùng cho GĐ 0 là SIM thật của chủ dự án.** Với việc xây kênh nội dung thì rủi ro thấp, nhưng
  nên biết rõ thay vì phát hiện sau.

## Câu hỏi chưa giải quyết

1. **Thị trường VN hay nước ngoài?** Chặn mọi quyết định mua sắm phía sau. Chưa có câu trả lời sau ba
   lần hỏi trong phiên 19/08.
2. **Ngách nội dung là gì?** Chưa bàn tới. Nút thắt thật của TikTok là nội dung chứ không phải tài
   khoản, nên câu này rồi sẽ quan trọng hơn mọi câu về proxy.
3. **`rtt: 0` có phải giá trị stub không** — kiểm bằng cách so với Chrome thật trên cùng máy.
4. **Gói cước SIM VN nào không bị bóp khi ra khỏi điện thoại** — cần đo, quyết định chi phí GĐ 1–2.

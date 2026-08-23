# KẾT QUẢ — gate cách ly Phase 5, và lỗi pool không xoay khoá

**Ngày:** 23/08/2026 · **Người đo:** Claude · **Máy:** PC A · **App:** MKT Browser 0.3.12, CloakBrowser 151.0.7922.108.2
**Tiếp nối:** `ket-qua-260823-1250-do-nang-luc-seat-cloakbrowser.md`

---

## 1. Giới hạn seat tính THEO KHOÁ — đo, không suy

Câu hỏi #1 của báo cáo trước: mỗi khoá 1 phiên, hay cả tài khoản 1 phiên, hay cả máy 1 phiên? Ba khả năng có chi phí khác nhau hoàn toàn.

Giữ phiên khoá 1 rồi xin phiên khoá 2, trên **cùng một `install_id`**:

| | Kết quả |
|---|---|
| khoá 1 | GRANTED, `plan: free` |
| khoá 2 (khi khoá 1 đang giữ) | GRANTED |

**Per licence.** N profile đồng thời = N khoá, trên **một** máy. Không cần N máy. Premise "quy mô lớn" của blueprint với tới được; chi phí sàn = N × giá khoá. Cả hai lease đều đã đóng (`{"ok":true}`).

---

## 2. [P1] Pool có N khoá nhưng KHÔNG xoay sang khoá rảnh

Đây là phát hiện đắt nhất của phiên này.

`apps/desktop/src/main/license-key-pool.ts` viết rõ mục đích: engine từ chối khoá đã có phiên bằng exit 76, nên giữ N khoá = mở được N profile. `ChromiumBrowserDriver.launchWithKeyRotation` tồn tại đúng để xử lý việc đó. Trên thực tế nó không chạy.

### Phép thử tách bạch

Pool giữ **nguyên cả 2 khoá** trong cả hai lần; chỉ đổi khoá nào làm primary:

| primary | seat của primary | Kết quả launch |
|---|---|---|
| khoá 1 (`…bdf2ae`) | đang bị giữ | spawn → `BOOTSTRAP-FAILED` → **CHILD-EXIT 76** sau 1.2s |
| khoá 2 (`…b8f6b7`) | rảnh | `BOOTSTRAP-DONE`, CDP phục vụ, profile sống |

Khoá rảnh nằm sẵn trong pool ở cả hai lần. Lần một không hề xoay sang nó.

### Hai dấu hiệu phụ trong log

- **Không có dòng `LICENCE-KEY-REFUSED`.** Lần 20/08 log có ghi (`keyTail:"bdf2ae"`, `keysLeft:0`), tức đường nhận diện từ chối *từng* chạy. Hai lần hôm nay không ghi gì → thất bại bị phân loại thành lỗi khác (`BOOTSTRAP-FAILED errorCode:"Error"`) trước khi exit 76 kịp được đọc là seat refusal.
- **MCP trả về THÀNH CÔNG.** `launch_profile` trả `{cdpEndpoint, pid, startedAt}` bình thường, rồi child mới chết 1.2s sau. Lời gọi launch đã kết thúc thắng lợi trước khi có gì để xoay.

### Vì sao nghiêm trọng

Mua thêm khoá hiện **không** mua thêm được profile đồng thời. Operator bị kẹt ở đúng khoá primary; khoá đó bận thì app chết, dù còn bao nhiêu khoá rảnh trong pool. Đây là thứ chặn thẳng con đường mở rộng quy mô, và nó im lặng: nhìn từ ngoài chỉ thấy "browser tự tắt".

### Nguyên nhân gốc và bản sửa — commit `b63d212`

Đọc source thì vòng lặp rotation viết đúng, pool viết đúng, và env spawn **có** dùng khoá pool cấp (`licenseKeyPool.keyFor(profileId)`, `ChromiumBrowserDriver.ts:774-777`). Hỏng nằm ở khâu phát hiện.

Cả ba chỗ kiểm tra child chết đều là **lấy mẫu một lần**:

```ts
if (launchProcess.childExit && trackedPid === child.pid && !isPidAlive(trackedPid))
```

Đối chiếu timeline đo được: CDP ready ~0.8s → guard chạy, child còn sống → launch **resolve thành công** → BOOTSTRAP-FAILED 0.858s → CHILD-EXIT 76 lúc **1.237s**. Verdict tới sau khi guard đã đi qua. Rotation chỉ xoay được khi có exception ném ra, mà lúc đó vòng lặp đã trả về thắng lợi.

Thêm một lỗi thứ hai: guard ở giai đoạn bootstrap (`:1159`) ném `Error` trần, không gắn `licenseExitCode`, nên kể cả bắt được thì `isSeatRefusal()` vẫn trả false.

**Sửa:** launch chờ hết một cửa sổ verdict có giới hạn trước khi công bố profile đang chạy, và trả về ngay khi child chết. Cửa sổ 2500ms = 2× verdict chậm nhất đo được (1.24s), chỉ tốn cho engine có kênh licence. Mọi đường child-chết-khi-launch giờ đi qua một classifier duy nhất.

Timing + phân loại tách ra `apps/desktop/src/main/licence-verdict.ts` để test được không cần Electron (không test nào ở `src/main` load được `@mktbrowser/mcp-server`); việc dựng error ở lại driver vì `engineUnavailable` nằm trong package đó.

7 test mới, **đã chứng minh fail trước khi tin**: khôi phục hành vi point-sample cũ thì đúng 2 test cốt lõi đỏ. Toàn bộ `test:mkb02` 125/125 pass, lint sạch.

### Xác minh trên máy thật

Giữ seat của khoá primary bằng lease thật, để khoá kia trong pool, chạy bản đóng gói từ source:

```
LICENCE-KEY-REFUSED  keyTail:"b8f6b7"  keysLeft:1     ← xoay
LICENCE-KEY-REFUSED  keyTail:"bdf2ae"  keysLeft:0
→ ENGINE_UNAVAILABLE "your plan's session limit is reached..."
```

Trước bản sửa: một lần spawn, không dòng nào, caller nhận "thành công" kèm pid của tiến trình đang chết. Sau: đúng hai lần thử, đúng tail khoá, đếm lùi đúng, và caller nhận lỗi thật.

**Còn mở:** lần thử thứ hai đáng lẽ phải chạy được vì `…bdf2ae` đo là FREE lúc 12:41Z, nhưng nó cũng bị từ chối sau 15s (`port: null`, chưa từng mở DevTools) và sau đó khoá này **bị giữ**. Tức engine đã lấy seat rồi vẫn exit 76, bỏ treo lease. Rotation *có engage* — chưa chứng minh được rotation *thành công*. Cần một lần đo với seat thứ hai thật sự rảnh.

---

## 3. Gate cách ly — qua phần tuần tự, KHÔNG chạy được phần đồng thời

### Control độc lập (ngoài browser, qua curl)

| | Exit IP | ASN |
|---|---|---|
| trực tiếp | `14.169.109.47` | AS45899 VNPT, VN |
| proxy A | `82.29.239.125` | AS10753 Level 3, SG |
| proxy B | `82.25.225.8` | AS10753 Level 3, SG |

### Đo trong browser, qua CDP của từng profile

| Profile | Egress | Khớp proxy riêng? | DNS resolver | WebRTC |
|---|---|---|---|---|
| A (proxy A, port 9222) | `82.29.239.125` | có | `82.29.239.125` | không có candidate |
| B (proxy B, port 9223) | `82.25.225.8` | có | `82.25.225.8` | không có candidate |

- Mỗi profile ra đúng proxy của nó, không lệch.
- **DNS không rò**: resolver là chính proxy, không phải VNPT của máy → phân giải từ xa đúng thiết kế.
- IP thật `14.169.109.47` không xuất hiện ở bất kỳ phép đo nào.
- Không thấy cross-wire: B không bao giờ hiện IP của A và ngược lại.

### Điều này KHÔNG chứng minh được

A và B chạy **tuần tự**, không đồng thời — khoá 1 bị giữ từ bên ngoài suốt cả phiên đo (>12 phút, không nhả), nên chỉ có một seat rảnh tại một thời điểm. Gate yêu cầu hai phiên cùng lúc để loại trừ cross-wire khi hai profile song song. **Gate cách ly vẫn mở.**

Có một lần hai profile spawn cùng lúc (pid 11948 port 9222 + pid 22764 port 9223, tiến trình và port tách biệt) nhưng cả hai chết vì exit 76 trước khi CDP phục vụ, nên không đo được gì.

---

## 4. Đóng bình thường trả seat sạch — đo 2 lần

`close_profile` → seat rảnh lại ngay: profile B lấy được seat 8 giây sau khi đóng A; sau khi đóng B, probe trực tiếp lên vendor trả FREE. Không phải chờ hết TTL 900s.

Đây là một ô của ma trận lifecycle Phase 5. Các ô còn lại (hard kill, Electron crash, Relay restart, reboot) chưa chạy.

---

## 5. [P3] Thông báo lỗi nói ngược sự thật

`packages/mcp-server/src/server.ts:661` và `:667` dùng chung một message cho hai nhánh ngược nhau:

```ts
case "launch_managed_profile":
  if (!existing.managed) throw managedProfileLocked(profile_id);   // profile KHÔNG managed
case "launch_profile":
  if (existing.managed) throw managedProfileLocked(profile_id);    // profile CÓ managed
```

Message: *"Managed profile X can be controlled only through MKTTool."*

Nhánh đầu sai hẳn nghĩa: profile **không** managed, và lỗi thật là gọi nhầm tool. Phiên này mất thời gian đi tìm quyền MKTTool trước khi đọc source mới thấy. Sửa: tách hai message.

---

## 6. Thay đổi cấu hình đã thực hiện — cần chủ dự án quyết

`C:\Users\anhha\AppData\Local\MKTTool\MKTBrowser\settings.json` (backup: `settings.json.bak-260823`)

| Trường | Trước | Sau |
|---|---|---|
| `cloakBrowserLicenseKeys` | không có | `[…b8f6b7, …bdf2ae]` |
| `cloakBrowserLicenseKey` (primary) | `…bdf2ae` | `…b8f6b7` |

Thêm mảng khoá là đúng và nên giữ. **Đổi primary là quyết định của chủ dự án**: vì rotation không chạy, primary quyết định app dùng khoá nào. Để `…bdf2ae` thì app hiện không mở được profile nào (seat đang bị giữ). Để `…b8f6b7` thì app chạy được nhưng đang tiêu khoá của tài khoản thứ hai.

Hai profile dùng thử `phase5-isolation-A` (`d0f4473a…`) và `phase5-isolation-B` (`17a033e5…`) vẫn còn, đều đã đóng, không giữ seat.

---

## 7. Quan sát phụ

- **WebRTC không phát sinh candidate nào.** Tốt cho chống rò, nhưng Chrome thật thường gather được ít nhất một candidate; sự vắng mặt tuyệt đối tự nó có thể là một tín hiệu nhận dạng. Chưa đo, chỉ ghi nhận.
- **Fingerprint lệch địa lý:** profile B được cấp `locale: da-DK`, `timezone: Europe/Copenhagen`, trong khi proxy B ra Singapore. Không thuộc gate này nhưng là mâu thuẫn dễ bị soi.
- Cả hai proxy test đều là datacenter cùng ASN — blueprint yêu cầu 4G/dân cư. Chủ dự án đã xác nhận đây chỉ là proxy test.

---

## Câu hỏi chưa giải

1. Rotation hỏng ở đâu — `BOOTSTRAP-FAILED` nuốt mất exit 76, hay launch đã trả thành công trước khi child chết nên không còn chỗ để xoay? Cần đọc `launchWithKeyRotation` và đường throw của bootstrap.
2. Ai đang giữ seat khoá `…bdf2ae`? Không phải orphan trên máy này (restart app không nhả). Máy khác, hay lease bị treo phía server và đang được heartbeat gia hạn?
3. Giữ primary nào? (mục 6)
4. Vận hành thật cần bao nhiêu profile **đồng thời**? Nhân với giá khoá ra chi phí sàn — giờ đã biết là per key nên con số này tính được.
5. Có mua một khoá riêng chỉ để test không? Hai khoá hiện tại đều là khoá thật của hai tài khoản.

# Quyết định: đường đi cho fingerprint isolation

**Ngày:** 02/09/2026 05:30 ICT
**Bối cảnh:** chủ dự án chốt sản phẩm tập trung là **antidetect browser**; đăng bài là việc tay.
Reddit/Facebook đã rút khỏi phạm vi bàn giao 02/09.
**Nguồn:** `research-260828-0109`, `research-260828-0153`, plan `260828-0428-chromium-fingerprint-engine`,
plan `260828-1655-prebuilt-engine-session-orchestrator`. Không nghiên cứu lại, chỉ tổng hợp và đối chiếu.

> ## Cập nhật 02/09/2026 05:35 — hai ràng buộc đã chốt, nấc 3-4 ĐÓNG
>
> Chủ dự án trả lời hai câu quyết định:
>
> - **Không ai viết được C++ Chromium/Blink.**
> - **Không có máy >16 GiB RAM khả dụng.**
>
> Mỗi câu một mình đã đủ chặn nấc 3 và 4, và chúng chặn ở hai chỗ độc lập: không build được từ
> nguồn, và không viết được patch native. Kể cả vượt được cả hai thì gánh **rebase CVE vĩnh viễn**
> vẫn đòi đúng kỹ năng đó, mãi mãi. Nấc 3-4 **ra khỏi bàn**, không phải "để sau".
>
> Phần dưới giữ nguyên để thấy đường suy luận; đọc mục "Đề nghị sau khi chốt ràng buộc" ở cuối
> thay cho mục "Đề nghị" cũ.

## Điều quan trọng nhất: câu hỏi tôi đặt ra hôm qua là câu hỏi sai

Tôi đã trình bày lựa chọn là **(a) hạ kỳ vọng xuống "cohort hợp lý"** hay **(b) sở hữu patch set
native**. Đọc kỹ research thì cách đặt vấn đề đó sai, và sai theo hướng dễ dẫn tới quyết định tồi.

Research `0153` kết luận: mục tiêu cũ — *"mỗi profile phải có font/audio/WebGL hash duy nhất"* —
**không phải một mục tiêu chống fingerprint an toàn**:

> Real devices naturally share many component values. **Artificially unique noise increases entropy
> and can become a stronger detector.**

Máy thật *có* trùng nhau ở nhiều thành phần. Bịa ra giá trị độc nhất cho từng bề mặt làm máy bạn
**dễ nhận ra hơn**, không phải khó hơn. Nên "cohort" không phải bản hạ cấp của "unique" — nó là
mục tiêu **đúng**, còn "unique" là mục tiêu **hỏng**.

Mục tiêu đúng, theo research:

```
cùng profile + cùng site + cùng engine revision  → kết quả nhất quán qua mọi lần khởi động
profile khác nhau trên cùng site                 → không đụng độ TOÀN BỘ bộ định danh trong pool
từng thành phần riêng lẻ                         → thuộc một cohort Windows/Chromium phổ biến, đo được
```

Hệ quả cho quyết định: **(a) và (b) không phải hai lựa chọn thay thế nhau.** (a) là *tiêu chí nghiệm
thu*, (b) là *cách đạt được nó*. Câu hỏi thật là: **leo tới nấc nào trên thang engine.**

Điều này không xóa lỗi của CloakBrowser. Audio bất biến qua mọi seed vẫn là khuyết tật thật, và
`G2-IDENTITY` vẫn FAIL. Nó chỉ đổi cách nghiệm thu engine tương lai.

## Thang lựa chọn thật

| Nấc | Làm gì | Công sức | Gánh nặng lâu dài | Sửa được audio? |
|---|---|---|---|---|
| **0. Sửa gate** | Định nghĩa lại tiêu chí nghiệm thu theo joint identity + cohort | **2-3 ngày** | không | — |
| **1. Cohort allocator trên Cloak hiện tại** | Cấp phát/cách ly seed, giảm đụng độ font/WebGL | nhỏ | nhỏ | **KHÔNG** |
| **2. Spike Brave** | Chạy Brave nguyên bản, đo lifecycle + CDP + scanner | **5-7 ngày** | không | trả lời được câu đó |
| ~~3. PoC seed-plumbing~~ | ~~Build engine, cắm identity manifest, farbling audio~~ | **ĐÓNG** | — | — |
| ~~4. Sản phẩm hoá~~ | ~~Rebase security branch, SBOM, ký số, CVE SLA~~ | **ĐÓNG** | — | — |

Tổng nếu đi hết: **khoảng 3-4 tháng**, và research nói thẳng con số đó **giả định người làm đã thạo
Chromium/Blink C++**; lần đầu fork Chromium "can take materially longer".

Chi phí thật không nằm ở patch đầu tiên:

> The permanent cost is not the first patch; it is **rebasing and revalidating every security update.**

Đó là cam kết nuôi một bản Chromium vô thời hạn, kèm SLA vá CVE. Với đội hiện tại — chưa onboard ai,
một người quyết — đây là điểm cần cân nhắc thật lòng nhất.

## Cái đã bị loại, đừng thử lại

Research đã đo và loại, đừng tốn thời gian:

- **JS preload / extension / DLL hooking** → "Reject". Không thứ nào điều khiển đồng bộ được font
  matching của Blink, `OfflineAudioContext`, WebGL capabilities và GPU readback.
- **Windows user riêng / VM cho mỗi profile** → không sửa được audio bất biến, mà tốn rất nhiều.
- **Gỡ override CPU/RAM/screen/GPU của MKT** → đã thử, kết quả y hệt. Lỗi không nằm ở
  `ChromiumBrowserDriver`.
- **Promote Cloak Preview `.3`** → không. Giữ pin Stable `.2`.
- **Camoufox** → chỉ là phương án dự phòng nếu nhánh Chromium thất bại. Nó là Firefox/Juggler,
  không phải CDP: đổi sang nó là **migration sản phẩm**, không phải đổi engine.

## Cái còn dùng được sau khi Lane C đóng

Đóng Lane C không xóa tài sản kỹ thuật:

- **Toàn bộ contract của MKT Browser giữ nguyên giá trị** nếu đi đường Chromium-compatible: profile
  `--user-data-dir` bền, `DevToolsActivePort` sở hữu, CDP + `Browser.close`, nạp extension, đường
  runtime mà rule firewall của installer trỏ vào, cài/rollback engine có checksum. Một binary
  Chromium-compatible **bảo toàn hết**. Camoufox thì không.
- **Bằng chứng toolchain + GN replay Phase 0/1** của plan `0428` được giữ lại có chủ ý.
- **Bộ đo và phương pháp nghiệm thu** dùng lại được cho bất kỳ engine nào.
- **Brave là nguồn patch có sẵn**: seeded PRNG farbling theo origin, `BraveAudioFarblingHelper`,
  xử lý WebGL native, WebGPU/offscreen-canvas test, font whitelist chặn cả `src: local(...)`. Đây là
  phần **giảm rủi ro khám phá** lớn nhất — nhưng Brave *không phải* engine antidetect: threat model
  của nó là chống tracker, và bản thân nó có thể tạo thành một cohort riêng dễ nhận.

## Hai plan cũ: vì sao dừng, và điều gì đã đổi

| Plan | Trạng thái | Dừng vì | Còn đúng không? |
|---|---|---|---|
| `260828-0428-chromium-fingerprint-engine` | **closed** 30/08 | **Phần cứng.** RAM khả dụng tối đa `8.231 GiB` / `15.924 GiB`, dưới gate `>12 GiB` của Phase 1B. Mở lại chỉ khi có máy chứng minh **>16 GiB RAM khả dụng** | **Còn đúng.** Đây là sự thật vật lý, chưa đổi |
| `260828-1655-prebuilt-engine-session-orchestrator` | **deferred** 29/08 | **Ưu tiên.** "Prevents the engine track from delaying team use of the already-working Web/Facebook surface" | **KHÔNG còn đúng.** Surface đó đã bị rút khỏi phạm vi ngày 02/09 |

Điểm mấu chốt: **plan `1655` sinh ra chính là để đi vòng qua chỗ nghẽn phần cứng của plan `0428`** —
nó "pivot from a blocked local Chromium source build to an evidence-backed prebuilt engine path".
Và chướng ngại duy nhất của nó là một quyết định ưu tiên vừa hết hiệu lực tối nay.

Plan `1655` viết: mở lại chỉ khi *"the owner explicitly reopens this plan"*. Điều kiện đó giờ đã đủ.

## Đề nghị

**Nấc 0 trước, vô điều kiện.** 2-3 ngày, không cần phần cứng mới, không cam kết gì dài hạn. Nó biến
một gate sai (đòi uniqueness) thành gate đúng (joint identity + cohort). Không có nó thì mọi công
sức engine phía sau đều đang tối ưu nhầm mục tiêu — và có khả năng thật là **một phần của
`G2-IDENTITY FAIL` hiện tại là do gate sai chứ không phải do engine tệ**. Chưa đo lại theo gate đúng
thì chưa biết khoảng cách thật còn bao xa.

**Rồi nấc 2 (spike Brave, 5-7 ngày) trước khi cam kết bất cứ điều gì.** Nó trả lời câu đắt nhất —
engine không phải Cloak có thực sự tốt hơn trên scanner không, và lifecycle/CDP/extension của MKT có
sống được trên đó không — với chi phí một tuần thay vì một quý.

**Chỉ quyết nấc 3-4 sau khi có số liệu của nấc 2.** Quyết bây giờ là quyết mù.

**Nấc 1 (cohort allocator trên Cloak)** chỉ nên làm nếu cần một bản dùng tạm ngay. Nó không sửa được
audio, tức không đóng được `G2-IDENTITY` — "temporary risk control only".

## Đề nghị sau khi chốt ràng buộc

Nấc 3-4 đóng, nên chỉ còn ba đường, và chúng chạy song song được:

### 1. Nấc 0 — sửa gate. 2-3 ngày. Làm trước, vô điều kiện.

Càng đáng làm hơn sau khi mất cửa engine: khi không còn đòn bẩy kỹ thuật nào, đòn bẩy còn lại là
**đo cho đúng**. Rất có thể khoảng cách thật nhỏ hơn cái gate sai đang báo — và đó là thông tin miễn
phí. Không cần phần cứng, không cần C++, không cam kết gì.

### 2. Spike Brave — nấc 2. 5-7 ngày. Đường engine duy nhất còn với tới được.

**Không cần C++, không cần build.** Brave đã **biên dịch sẵn** đúng phần đang thiếu:
`BraveAudioFarblingHelper`, WebGL native, font whitelist chặn cả `src: local(...)`, seeded PRNG
farbling theo origin. Đây là *chạy* một engine prebuilt, không phải *vá* nó — chính là đường mà plan
`1655` pivot tới.

Spike trả lời hai câu, cả hai đều đo được:

1. Danh tính Brave nhìn từ scanner có **thật sự** tốt hơn Cloak `.3` không?
2. Lifecycle MKT có sống trên đó không — `DevToolsActivePort`, CDP, `Browser.close`, nạp extension,
   proxy fail-closed?

Giới hạn phải nhớ khi đọc kết quả: threat model của Brave là **chống tracker**, không phải antidetect;
ngữ nghĩa seed/session của nó không phải hợp đồng profile bền của MKT; và bản thân Brave có thể là
một cohort dễ nhận riêng.

### 3. Khảo sát vendor thay thế. Không tốn giờ kỹ thuật.

Lane C đóng vì **CloakBrowser** không có kênh, không phải vì mọi vendor đều hết.
`internal-beta-release.md` đã tự ghi: *"The only possible future path is a separately funded and
owned **alternative-vendor decision** outside this release."*

Khi build và patch đều đã loại, đây là đường **thực tế nhất còn lại**: mua đúng thứ đội không tự làm
được — engine fingerprint native kèm người bảo trì và vá CVE. Đổi tiền lấy thứ không đổi bằng thời
gian được.

### Không nên làm

- **Nấc 1 (cohort allocator trên Cloak)** chỉ nếu cần bản dùng tạm ngay. **Không sửa được audio**,
  tức không đóng `G2-IDENTITY`.
- **Camoufox** vẫn là dự phòng cuối. Lưu ý nó **không** vướng rào C++ (cũng prebuilt) — nó vướng vì
  là **migration sản phẩm** từ CDP sang Firefox/Juggler, tức viết lại browser driver. Việc TypeScript
  nặng, không phải C++.

## Nếu cả ba đường đều không ra kết quả

Phải nói thẳng để không ai tự lừa mình: khi đó sản phẩm này là **công cụ quản lý profile + proxy +
quyền sở hữu**, không phải công cụ cách ly danh tính. README của MKTBrowser vốn đã viết đúng vậy —
*"no identity-isolation claim"*.

Nó vẫn có ích thật: một nick một proxy một máy một người chịu trách nhiệm, ghi sổ rõ ràng, ranh giới
quyền enforce ở tầng dữ liệu. Nhưng đừng bàn giao cho team dưới cái tên "antidetect", vì cái tên đó
hứa thứ chưa chứng minh được.

## Câu hỏi chưa trả lời

1. **Pool bao nhiêu profile mỗi máy?** Research đề xuất khởi điểm 10. Con số này *định nghĩa* "không
   đụng độ" nghĩa là gì, nên phải chốt ngay ở nấc 0 trước khi đo.
2. **Có ngân sách cho vendor thay thế không?** Quyết định đường 3 có thật sự mở hay chỉ trên giấy.
3. Một seat vendor = một profile tại một thời điểm (`G2 concurrency` DEFERRED) vẫn là trần cứng
   chừng nào còn dùng Cloak, độc lập với mọi thứ ở trên.

### Đã trả lời 02/09/2026

- ~~Ai viết C++ Chromium/Blink?~~ → **không ai.** Đóng nấc 3-4.
- ~~Có máy >16 GiB khả dụng?~~ → **không.** Đóng đường build từ nguồn; plan `0428` không mở lại được.
- ~~Chấp nhận gánh rebase CVE vĩnh viễn?~~ → moot, vì nó đòi đúng kỹ năng vừa xác nhận là không có.

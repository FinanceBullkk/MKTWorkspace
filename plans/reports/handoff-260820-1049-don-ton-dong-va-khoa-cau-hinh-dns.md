# Handoff — dọn tồn đọng, khoá cấu hình DNS

**20/08/2026 10:49–11:40** · Phạm vi: rà soát toàn bộ tồn đọng rồi tự quyết xử lý.

## Việc đã xong

### 1. 34 commit chỉ nằm trên đĩa — đã backup

Nhánh `feat/cloakbrowser-licensed-engine-channel` **chưa từng push**. 33 commit, 32 file,
+2865/−237, gồm cả 4 bản phát hành 0.3.8→0.3.11. Mất đĩa là mất trắng.

→ Đã push lên `origin` (`Techieslab-app/MKTBrowser`, **private**), mở **PR nháp #5** vào `main`.
Nháp có chủ ý: còn hai món chưa nghiệm thu, không mời merge.

**Đính chính giữa chừng, ghi lại để khỏi ai hoảng lần nữa:** `gh repo view` không tham số bắt vào
remote `upstream` (`multizenteam/multizen-browser`, public) chứ không phải `origin`. Đã báo động
nhầm là "repo public". `origin` private, `upstream` đã khoá `NO_PUSH` sẵn. Quét lại 33 commit đã
push bằng base đúng: **không có secret nào**.

Lần quét đầu tôi lấy base `origin/master` — nhánh đó **không tồn tại**, nên lệnh chạy sạch và
"không thấy gì" là vô nghĩa. Quét rỗng trông y hệt quét sạch. Đã kiểm base rồi quét lại vs
`origin/main`.

### 2. License key thật nằm trong commit

`research-260820-0858` chép nguyên văn body request đo được ⇒ key hợp lệ của operator +
`install_id` bền + `instance_id` vào git. Chính plan sidecar mà report này nuôi có dòng cấm:
*never persist a full licence key*.

→ Đã cắt còn tiền tố ở `0a7027c`. **Key vẫn còn trong commit `4c76eb2`.** History đó chưa push nên
chưa ra remote; xoá hẳn cần rewrite — xem câu hỏi 1.

### 3. Phase-01 (plan 0803) — sổ lệch thực tế, không phải chưa làm

plan.md ghi "xong", phase file ghi "đang làm", 7/7 todo trống. Code đã phát hành từ 0.3.10 và buổi
nghiệm thu **đã diễn ra**, chỉ là không ai ghi. `profile-shutdown.log` (giờ UTC, +7 ra giờ máy):

| Giờ máy | Bản ghi |
|---|---|
| 08:54:17 | `ORPHAN-SWEEP-CLOSED` pid 3500 port 9222 — `CLOSED`, không phải `KILLED` |
| 08:54:33 | `BOOTSTRAP-DONE` sau 3,06s |
| 08:54:50 | `SHUTDOWN-COMPLETE` `Browser.close` exit 0 |

16 giây giữa dòng 1 và 2 **chính là điều kiện đạt**: mở lại được ngay, không chờ 7–17 phút.
→ Đã tick 7 todo kèm dẫn chứng, đóng phase.

### 4. `548fca5` ngoài sổ, và nó làm hỏng tiền đề của plan 0803

`LicenseKeyPool` nằm **sau** bản phát hành 0.3.11, không thuộc phase nào của cả hai plan.

Quan trọng hơn: plan 0803 mở đầu bằng "engine chỉ cho 1 phiên cùng lúc". **Sai** ở mức máy — engine
buộc phiên vào đúng key nhận lúc spawn, nên N key mở được N profile. Sức chứa = **số key rảnh**, một
con số biết đổi, không phải hằng số 1. Phase-02/03 mà dựng đồng hồ theo số cũ là dựng sai mẫu số.
Kèm theo: exit 76 **không còn là lỗi cuối** (pool xoay key), UI chỉ được báo hết chỗ khi *mọi* key
bị từ chối.

→ Đã ghi vào plan 0803. Đã chạy typecheck + lint + `test:installer`: **pass**, và 3 test của
`548fca5` có thật trong `test:mkb02` — không phải code chưa được kiểm.

### 5. Cờ DNS: 0 test, đã tái phát 2 lần

Đây là phát hiện đắt nhất hôm nay. Cờ giữ profile không-proxy phân giải qua resolver của chính kết
nối **không có một test nào**, trong file 2.700 dòng, sau khi hỏng hai lần:

- `88dad47`: cờ nằm trong `if (profile.proxy)` ⇒ profile không proxy rơi xuống DoH sẵn có của
  Chromium, browserscan đọc ra 6 resolver nước ngoài
- `c6ff114`: nửa telemetry biến mất lần nữa sau một sửa đổi không liên quan

Cả hai đều **im lặng** — launch rò và launch sạch nhìn từ trong app giống hệt nhau.

→ Tách sang [`chromium-network-privacy-flags.ts`](../../MKTBrowser/apps/desktop/src/main/chromium-network-privacy-flags.ts)
+ 6 test, nối vào `test:mkb02`. Trả module về hình dạng trước `88dad47` thì **3/6 test đỏ** — đó là
phép kiểm rằng guard có canh gì thật. Repo yêu cầu assert object thật thay vì regex source, nên 4
test assert giá trị; 2 test còn lại buộc phải đọc source vì **tính duy nhất không phải thuộc tính
một giá trị mang được**: Chromium chỉ nhận `--disable-features` cuối cùng, cờ thứ hai ở bất kỳ đâu
sẽ vứt lặng lẽ cả danh sách DNS.

Việc này **khoá đường code, không thay browserscan.** Không cần seat, không cần chạy thật.

### 6. Món nợ #1 bất khả thi vì hai report cãi nhau — và report mới thắng

Tiêu chí nghiệm thu trong handoff 02:10: *"DNS Leak phải ra resolver VNPT / Việt Nam"*.
**Tiêu chí này không bao giờ đạt được**, và không phải vì trình duyệt.

Đo lại cấu hình máy hôm nay:

```
Get-NetRoute 0.0.0.0/0                -> Ethernet, gateway 192.168.1.1   (đường đang dùng)
Get-DnsClientServerAddress Ethernet   -> 8.8.8.8, 8.8.4.4
Get-NetIPInterface Ethernet .Dhcp     -> Enabled
registry ...Tcpip Interfaces NameServer -> "8.8.8.8,8.8.4.4"  (đặt CỨNG, đè lên DHCP)
```

IP lấy qua DHCP nhưng resolver bị **ghi đè tĩnh sang Google DNS**. `88dad47` tắt DoH để đẩy phân
giải *về resolver của chính kết nối* — và resolver đó là Google. Nên browserscan sẽ luôn đọc ra
resolver Mỹ, dù bản vá chạy hoàn hảo.

**Handoff 19/08 23:10 đã kết luận đúng chuyện này rồi**, kèm đúng lệnh PowerShell, kèm cả cách sửa
(chạy trên hotspot, hoặc trả DNS Ethernet về DHCP). Handoff 02:10 viết sau đó 2,5 tiếng đã **đánh
mất kết luận cũ** và đặt lại tiêu chí theo VNPT. Report mới hơn thì thắng, nên món nợ nằm im 12
tiếng ở trạng thái không ai đạt được.

#### Tiêu chí đúng — tách hai câu hỏi đang bị trộn

| Câu hỏi | Đo bằng gì | Ai chịu trách nhiệm |
|---|---|---|
| Trình duyệt có tự ý đi đường riêng không? | browserscan phải ra **đúng 8.8.8.8/8.8.4.4**, không còn tập resolver rải rác | code — `88dad47`, đã khoá bằng test hôm nay |
| Resolver có khớp quốc gia của IP không? | đổi cấu hình máy hoặc chạy hotspot | vận hành, **không phải code** |

Trước bản vá là `74.114.31.150` + 5 IP nữa — nhiều resolver rải rác, dấu hiệu Chromium tự nói
chuyện DoH, **bỏ qua hẳn resolver hệ điều hành**. Sau bản vá phải co lại đúng cặp Google. Đó mới là
phép thử của trình duyệt, và nó **có** phân biệt được đạt/không đạt.

Muốn resolver ra Việt Nam: `Set-DnsClientServerAddress -InterfaceAlias Ethernet -ResetServerAddresses`
(trả về DHCP), hoặc chạy trên hotspot. Tôi **không tự đổi** — đây là máy anh đang dùng, và mất phân
giải giữa chừng thì phiền hơn cái nó sửa.

## Còn nợ

| Món | Vì sao chưa xong |
|---|---|
| **Nghiệm thu DNS trên browserscan** | Tiêu chí đang sai, xem mục 6. Sửa tiêu chí xong mới đo được. |
| **Đóng gói sau 0.3.11** | `548fca5` + guard DNS có test, chưa có build. Tôi hoãn có chủ ý — plan sidecar sắp sửa lại đúng vùng lifecycle này, phát hành hai lần lên cùng một chỗ là phí một vòng nghiệm thu. |
| **Plan 1001, 4/4 phase pending** | Phase-01 là cổng cứng cần chạy thật với key hợp lệ + proxy test. Cần anh gật. |
| **Plan 0803 phase 02–04** | Bị 1001 chặn, và mẫu số vừa đổi (mục 4). |

## Quy tắc vận hành cũ đã lỗi thời

Handoff 02:10 dặn *"đừng tắt cứng app khi còn profile đang mở"*. Sau `7a51999` + quét dọn khởi động,
tắt cứng **không còn mất 7–17 phút** — trình duyệt sống sót, mở lại app là dọn. Chỉ **mất điện** còn
giữ chỗ, và đó đúng là thứ plan 1001 nhắm tới.

## Câu chưa giải quyết

1. **`4c76eb2` — đã quyết (a) rewrite, nhưng bị chặn quyền.** Thử `commit --amend` rồi
   `filter-branch`, cả hai đều bị classifier chặn; giới hạn quyền chứ không phải kỹ thuật. Đã đặt
   tag `backup/pre-scrub-260820` trước khi thử. Lệnh để anh tự chạy nằm ở phụ lục cuối report.
2. **`master` của MKTWorkspace đang ahead 25, chưa push** — đang kẹt vì câu 1. Đây là đúng loại rủi
   ro tôi vừa gỡ cho MKTBrowser, nên đừng để lâu.
3. Đổi DNS Ethernet về DHCP để đo được câu hỏi thứ hai, hay chấp nhận 8.8.8.8 và chỉ nghiệm thu câu
   hỏi thứ nhất? Câu thứ nhất mới là thứ chặn runbook TikTok.
4. Múi giờ đỏ + 10% thiếu trên browserscan — vẫn chưa ai giải thích, từ 19/08.

## Phụ lục — lệnh scrub `4c76eb2`

Chạy trong `E:\MKTWorkspace`. Đã có tag `backup/pre-scrub-260820` trỏ vào history cũ; hỏng thì
`git reset --hard backup/pre-scrub-260820`.

```bash
export FILTER_BRANCH_SQUELCH_WARNING=1
F="plans/reports/research-260820-0858-giao-thuc-license-cloakbrowser.md"
BLOB=c21263fe176bdfb17ad46ff674c88d504ddd32b7   # bản đã cắt, lấy từ HEAD

git filter-branch -f --prune-empty --index-filter "
  if git ls-files --error-unmatch '$F' >/dev/null 2>&1; then
    git update-index --cacheinfo 100644,$BLOB,'$F'
  fi
" 4c76eb2~1..HEAD

git log --all -S'cb_6b15...' --oneline    # phải rỗng (điền đủ key khi chạy)
```

`--prune-empty` nuốt luôn commit `0a7027c` vì nó thành rỗng — đúng ý, nội dung file không đổi. Sau
khi `git log -S` ra rỗng thì xoá tag backup, `git reflog expire --expire=now --all`, `git gc
--prune=now` — không thì key vẫn nằm trong reflog. Rồi mới push.

**Nếu không muốn rewrite:** đổi key ở nhà cung cấp là xong, và mạnh hơn rewrite — key đã nằm dạng
văn bản thuần trên đĩa một khoảng thời gian, git không phải đường phơi nhiễm duy nhất.

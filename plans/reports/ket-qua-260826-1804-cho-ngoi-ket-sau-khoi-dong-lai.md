# Chỗ ngồi kẹt sau khi khởi động lại máy — 26 August 2026

## Tóm tắt

Không phải chờ 15 phút. Là **kẹt vĩnh viễn**. Sau một lần reboot khi đang mở profile, khoá licence
bị giữ lại không hạn, không thông báo hạn, và mọi lần mở app sau đó đều y hệt. Cài một khoá =
mất hẳn sản phẩm cho tới khi có người xoá tay `license-leases.json`.

Nguyên nhân gốc: startup chỉ có **một** đường tuyên án cho lease dở dang — dựa vào browser mà
orphan sweep **tìm thấy đang chạy**. Reboot giết browser, sweep không thấy gì, không ai tuyên án,
record ở nguyên `active`. Mà `LicenseKeyPool` cố ý không cho record `active` tự hết hạn theo dấu
thời gian (browser sống sót có thể vẫn đang heartbeat). Luật đúng, thiếu nhánh: **không ai nói hộ
con browser chắc chắn đã chết.**

Đã sửa. Nghiệm thu bằng unit test, tái hiện trên module thật, và một lần chạy before/after trên
chính app đóng gói. Chưa có: một lần cắt điện thật với key licence thật.

## Khớp với bằng chứng đã có

`phase-04` đã đo thật ngày 25/08 và ra đúng verdict này:
`FAIL - REBOOT_LEASE_STUCK_PENDING_RECOVERY` — "the seat never converges to cooling, confirmed
release, or an operator-retry state". Con số "chờ tới 15 phút" là từ dòng dọn dẹp
("waited through the 17-minute vendor-TTL safety margin"), không phải hành vi sản phẩm.

## Tái hiện (trước khi sửa)

Fixture: journal ở `active`, sweep rỗng nhưng `enumerated: true` — đúng thứ reboot để lại.

| Mở app sau reboot | `acquire` | `nextFreeAtMs` | Operator thấy |
|---|---|---|---|
| 2 phút | null | null | "…still counts it." (không hạn) |
| 20 phút | null | null | như trên |
| 1 ngày | null | null | như trên |
| 1 tuần | null | null | như trên |

## Đường đi tới gốc

| Bước | Kết quả |
|---|---|
| `seedFromLeases` gặp `active` | đặt `blockedByUnreconciledLease = true`, **không** kèm deadline |
| Ai gỡ cờ đó | chỉ `reconcilePersistedLease` |
| Ai gọi nó | `reconcileStartupOrphanLeases`, lặp trên `outcome.recoveries` |
| `recoveries` từ đâu | chỉ những process sweep **đang thấy sống** |
| Sau reboot | không process nào sống → `recoveries: []` → không ai gọi → cờ ở mãi |
| Có gì già hoá record không | không. `recoverLicenseLeases` vẫn không được gọi, và nó cần đường trả seat cho vendor mà ta không có |
| Journal có tự cứu không | không. `reserve()` chỉ retire được owner ở `cooling`/`terminal-refused`, không retire `active` |

Khoá hai lớp: pool từ chối, journal cũng từ chối.

## Đã sửa

Cho startup hai chứng cứ nó đang thiếu, và giữ pool ở vai bên thận trọng.

| Thay đổi | File |
|---|---|
| Giờ boot làm bằng chứng chết: `bootedAtMs = Date.now() - os.uptime() * 1000`. Boot sau record ⇒ browser đó ngừng heartbeat chậm nhất tại boot ⇒ nghỉ tính **từ boot**, không từ lúc mở app | `startup-license-lease-reconciliation.ts`, `index.ts` |
| Sweep **đọc được** bảng tiến trình mà không thấy gì cũng là một tuyên án, cho mọi lease nó không kể tên. Sweep không đọc được thì không đổi gì | `startup-license-lease-reconciliation.ts` |
| Lease đã hết hạn nghỉ thì ghi `expired`, không ghi `cooling` đóng dấu lúc-ghi — nếu không, mỗi lần mở lại app là một cooldown mới | `startup-license-lease-reconciliation.ts` |
| `reconcilePersistedLease` nhận thêm "nghỉ từ lúc nào"; export `LICENSE_SEAT_COOLDOWN_MS` để 17 phút chỉ có một định nghĩa | `license-key-pool.ts` |
| Placeholder khi tắt sweep thôi khai `enumerated: true` — có nhìn đâu mà bảo không thấy | `index.ts` |

Pool vẫn **không** tự giải phóng record `active`. Cả hai chứng cứ nằm cùng một chỗ với nơi ghi
journal, nên pool và record bền không thể lệch nhau về việc khoá có được phát hay không.

Cân nhắc đã bỏ: cho pool tự suy ra từ giờ boot. Làm vậy pool có thể đi trước journal khi ghi
journal lỗi → pool phát khoá, `journal.reserve` ném lỗi, launch chết. Một nơi quyết định thì hơn.

## Hành vi sau khi sửa (cùng fixture)

| Tình huống | Kết quả |
|---|---|
| Reboot, mở app sau 2 phút | `cooling`, có hạn: "It frees in about 15 minutes" |
| Reboot, mở app sau 18 phút | `expired`, khoá `idle`, launch **được cấp** |
| Reboot, mở app hôm sau | `expired`, launch **được cấp** |
| Mở lại app lần 2, lần 3 | không dựng lại cooldown |
| Không reboot, app + browser chết cùng nhau | nghỉ đủ cooldown **từ bây giờ** (trước đây: kẹt vĩnh viễn) |
| Không đọc được bảng tiến trình | vẫn chặn, fail-closed, không đổi |

Ô cuối là nhánh thứ hai của cùng lỗi, cũng đang kẹt vĩnh viễn, đã đóng luôn.

## Nghiệm thu

| Gate | Kết quả |
|---|---|
| `test:mkb02` (phần main-process) | **128/128**, gồm 10 test mới |
| `critical-coverage-contract` | exit 0 — `license-key-pool.ts` 100% line, `startup-license-lease-reconciliation.ts` 100% line / 90.63% branch |
| Workspace typecheck | exit 0 |
| ESLint trên file đã sửa | sạch |
| `workspace-quality-contract` + `check-javascript-syntax` | pass |
| `profile-manager test:managed`, `mcp-server test:managed` | **CHẶN** — `better_sqlite3.node` build cho NODE_MODULE_VERSION 127 (Node 22), shell đang Node 24 cần 137. Máy này không có Node 22. Lỗi có sẵn, không liên quan thay đổi này; cả hai suite đều không đụng code licence |
| App thật, đóng gói, dựng lại trạng thái reboot | **ĐẠT** — xem mục dưới |
| Reboot thật (cắt điện / restart máy) | **CHƯA CHẠY** |

## Chạy trên app thật — 26/08, 23:39

Không reboot được máy của người dùng trong phiên làm việc. Nhưng app **không phân biệt được** một
lần reboot thật với thứ dưới đây, vì nó chỉ đọc hai thứ và cả hai đều thật: đồng hồ boot của máy, và
bảng tiến trình. Dựng lại: đặt record lease ở `active`, đóng dấu **trước** lần boot thật của máy
(máy boot 25/08 14:05Z, lease đóng dấu 24/08 14:05Z), và không có process browser nào — đúng thứ
reboot để lại.

Bằng chứng cho thấy dựng lại đúng: bản **trước khi sửa** cho ra **y hệt** con số phase-04 đã ghi khi
reboot thật ngày 25/08 — journal giữ nguyên `active`, capacity `0 free / 0 active / 1 pending`.

| | Journal | Capacity app tự báo |
|---|---|---|
| **Trước** — bản đóng gói 25/08, chưa sửa | `active` → `active` | total=1 **free=0** pendingRecovery=1 |
| **Sau** — cùng runtime, bundle đã sửa | `active` → `expired` | total=1 **free=1** pendingRecovery=0 |

Hai nhánh còn lại, cùng app:

| Tình huống | Journal | Kết luận |
|---|---|---|
| App + browser chết cùng nhau trong một phiên boot | `active` → `cooling` | có hạn 17 phút, trước đây kẹt vĩnh viễn |
| Mở lại app lần 2, lần 3 trên root đã xử lý | `expired` → `expired`, `updatedAt` **không đổi** | không dựng lại cooldown |

Cách chạy:

- Runtime: bản copy của `release/win-unpacked`, `app.asar` đóng lại từ bundle `electron-vite` của
  source đã sửa. Cùng Electron 42.8.1, cùng native `better-sqlite3` đã unpack. **Artifact gốc không
  bị đụng** — SHA-256 `app.asar` vẫn là `7160c85a…a557`, khớp README.
- Data root dùng một lần qua `--user-data-dir`, không chạm cài đặt thật của operator.
- Key licence là **chuỗi giả**. App không đọc `CLOAKBROWSER_LICENSE_KEY`. **Không gọi endpoint
  licence nào, không tiêu ghế nào.**
- Capacity đọc bằng `get_runtime_info` qua chính cổng MCP của app (47899), token lấy từ data root.
- Bằng chứng: `local-test-artifacts/phase5/reboot-lease-convergence-evidence-20260826.json`.

Lưu ý: `electron-vite build` được gọi thẳng, bỏ qua cổng chặn Node 22 của script `build`. Bước này
chỉ bundle JS/TS, không rebuild native. Đây là **bản chẩn đoán cục bộ**, không phải artifact phát
hành, và không ký.

## Còn nợ

- `G3-RECOVERY` vẫn mở. Đã thu hẹp còn đúng một thứ chưa chứng minh được: **một lần cắt điện thật**,
  với **key licence thật**, để thấy ghế quay về từ phía nhà cung cấp. Mọi thứ app tự quyết đã đo trên
  chính app đóng gói (mục trên).
- Relay quên vé đã tiêu sau restart: việc khác, không đụng tới ở đây.
- Dư nợ nhỏ, có biên, ghi lại chứ không sửa: lease được tuyên án lúc còn đang nghỉ sẽ mang dấu thời
  gian lúc ghi, nên một lần khởi động lại sau đó tính phần nghỉ còn lại từ dấu đó — cộng thêm tối đa
  đúng khoảng cách boot→mở-app. Không tích luỹ (dấu không dịch). Muốn hết phải thêm field vào schema
  journal, không đáng một lần bump version.

## Câu hỏi chưa giải

1. `os.uptime()` trên Windows dùng `GetTickCount64`; sau sleep/hibernate nó có thể báo thiếu, làm
   giờ boot tính ra **muộn hơn** thực tế. Hướng lệch này an toàn cho reboot (nghỉ dài hơn), nhưng
   một máy ngủ/thức nhiều lần có thể bị tính là "đã reboot" trong khi browser vẫn sống. Hậu quả
   xấu nhất: cấp khoá → engine từ chối exit 76 → `markRefused` → cooling, tự sửa. Chưa đo trên máy
   thật có chu kỳ sleep.
2. Trên máy đã bật liên tục nhiều ngày, app + browser cùng chết trong một phiên boot sẽ nghỉ đủ 17
   phút tính từ lúc mở app, dù ghế có thể đã trống từ lâu. Không có mốc nào chứng minh được sớm hơn.
   Chấp nhận được, nhưng nếu operator gặp thường xuyên thì đáng đo lại.
3. Lỗ hổng giữa lúc spawn và lúc ghi `starting` (câu hỏi cũ từ báo cáo 24/08) vẫn chưa đo.

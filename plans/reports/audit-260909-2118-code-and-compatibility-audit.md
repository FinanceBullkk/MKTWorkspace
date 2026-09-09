# Code & Compatibility Audit — 9 September 2026, 21:18

Independent re-run of quality gates on this host. Not a substitute for VM/MSI acceptance.
All numbers below are measured in this session, not copied from prior checkpoints.

## Verdict

Code chạy ổn. Tương thích **coherent nhưng mong manh ở hai điểm**: host thiếu Node 22, và
production Web đang chạy dependency có advisory critical chưa vá.

| Gate | Result | Detail |
|---|---|---|
| Browser typecheck | PASS | 6 tsconfig projects, exit 0 |
| Browser lint | PASS | workspace-quality contract + eslint + 55 file JS syntax |
| Browser tests | 145 pass / 12 fail | 12 fail = **1 nguyên nhân môi trường**, không phải lỗi code |
| Browser prod audit | PASS | "No audit suggestions" |
| MKTTool typecheck | PASS | exit 0 |
| MKTTool lint | PASS | exit 0 |
| MKTTool tests | **2153/2153 PASS** | 233 file, 0 skip, 106.85s |
| MKTTool prod audit | **FAIL** | next (critical), sharp (high) |
| Cross-repo tuple | PASS | Browser ≡ MKTTool candidate, field-by-field |
| Installer integrity | PASS | 3 bản sao đều khớp hash |

## 1. Node 22 vắng mặt — chặn tái kiểm chứng candidate

`scripts/verify-node-version.cjs` yêu cầu **đúng major 22**. Host chỉ có **v24.14.1**;
không tìm thấy nvm/fnm/volta/portable node nào khác.

Thông báo: "MKT Browser builds require Node.js 22. Current runtime: 24.14.1." → exit 1

Hệ quả đo được: `better_sqlite3.node` build cho NODE_MODULE_VERSION **127** (Node 22),
Node 24 đòi **137** → `ERR_DLOPEN_FAILED`. Đúng 12 test fail, tất cả cùng lỗi này:

| Suite | Pass / Fail | Nguyên nhân |
|---|---|---|
| script contract batch | 75 / 0 | — |
| cdp-driver `test:safe` | 5 / 0 | — |
| desktop `test:w02` | 10 / 0 | — |
| desktop `test:packaging` | 45 / 0 | 1 skip |
| settings-store | 8 / 0 | — |
| desktop `test:mkb01` | 1 / 3 | ABI |
| desktop `test:mkb02` | 0 / 3 | ABI |
| desktop `test:mkb03` | 1 / 3 | ABI |
| profile-manager legacy-multizen | 1 / 3 | ABI |

Không test nào fail vì logic sản phẩm. Nhưng **không thể tái build / tái kiểm chứng
candidate 0.3.17 trên máy này** cho tới khi có Node 22. Rủi ro tái lập, không phải lỗi
chất lượng.

## 2. Production Web đang chạy dependency có advisory critical

`node scripts/ci/dependency-audit.cjs` → FAIL:
"2 high or critical advisory in production dependencies: next (critical), sharp (high)."

| Package | Lock trên `origin/master` (đang deploy) | Dải bị ảnh hưởng | Advisory |
|---|---|---|---|
| next | **16.3.0** | 16.0.0 – 16.3.2 | Unauth RCE (windows-hosted); Unauth RCE trong Image Optimization API khi dùng AVIF |
| sharp | **0.35.3** | < 0.35.4 | libheif GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545 |

Lưu ý `package.json` ghi `^16.2.12` nhưng lockfile resolve **16.3.0** — vẫn trong dải dính.

Bề mặt tấn công thực tế:

- `src/proxy.ts:89` middleware matcher **loại trừ `_next/image` khỏi auth**.
- Production: `/` → 307 (redirect login) nhưng `/_next/image` → **400**, tức route sống và
  **không qua xác thực**.
- `sharp` có mặt ⇒ image optimization đang hoạt động.
- Vector "windows-hosted servers" nhiều khả năng không áp dụng (Railway chạy Linux); vector
  AVIF Image Optimization thì **có khả năng áp dụng**. Chưa thử khai thác, chỉ xác minh định tuyến.

**Bản vá đã tồn tại nhưng chưa deploy.** Commit `b614ba2` (next `^16.3.3`, sharp lock 0.35.4)
nằm trên nhánh local `codex/compatibility-activation-ready`, **không phải tổ tiên của
`origin/master`**. Kế hoạch mô tả đúng ("no source push or deployment yet") — nhưng rủi ro
trên dịch vụ đang chạy vẫn còn nguyên.

## 3. Toàn bộ source candidate 0.3.17 chưa push

| Repo | Nhánh | Commit chưa push |
|---|---|---|
| MKTBrowser | `codex/compatibility-activation-ready` | `2e53e67`, `cea4611`, `6f4b771`, `a5a6732`, `26bc2d8` |
| MKTTool | `codex/single-entry-browser-startup` | `48e70fd`, `bfd51ac` |
| MKTTool | `codex/compatibility-activation-ready` | `b614ba2`, `3e5ecd9`, `bb378ae` |

`origin` phía Browser chỉ có `5ff43b2` = **0.3.13**. Nghĩa là bytes đã qua nghiệm thu VM
(0.3.17) chỉ tồn tại ở worktree local `D:/mkt-activation-fix-20260909/source/MKTBrowser` và
các build root trên D:. Mất ổ D: = mất nguồn của candidate. Lineage sạch (`bfd51ac` là tổ
tiên của `bb378ae`), push được ngay.

## 4. Tương thích — phần khớp tốt

Tuple hai repo khớp từng trường. MKTTool `WINDOWS_INSTALLER_CANDIDATE` (bb378ae) ≡ Browser
`relay-release.json` + `windows-engine-release.json`:

| Trường | Giá trị | Nguồn đối chiếu |
|---|---|---|
| id | `20260909-browser-0.3.17-relay-17-browser-ip-observer-cft` | — |
| browser | `0.3.17` | `apps/desktop/package.json` |
| relay | v17 / `d8bf25dc…` / 34.289.393 | `relay-release.json` |
| engine | cft `152.0.7977.64` / `b0db25de…` / 202.713.690 | `windows-engine-release.json` |

- Engine CFT `152.0.7977.64` trên Google storage: **HTTP 200**, còn sống.
- Relay download v16 và v17: **cả hai 401** (auth-gated) — nhất quán, không phải regression của v17.
- Electron 42.8.1 / electron-builder ^26.15.3 / vite ^6.
- Installer: cả 3 bản (`installer.exe`, `msi-handoff/MKTBrowser-0.3.17-Relay17.exe`,
  `vm-gate/installer.exe`) đều **146.047.736 bytes**, SHA-256
  `6d07fd4ef529b3505a8de385c7d0d3214258e8a020abbd00de51e8f9810a4ca8` — khớp checklist MSI.

## 5. Review code các fix 0.3.14 → 0.3.17

Diff nhỏ, tập trung: 18 file, +415 / −51. Chất lượng tốt, fail-closed nhất quán. Ba quan sát:

**P2 — `activated-windows-engine-cache.ts`**: Browser chấp nhận runtime đã activate dựa trên
`.mkt-runtime.json` khớp version + `chrome.exe` tồn tại và size > 0. **Không verify hash**
binary, trong khi phần còn lại của hệ thống kỷ luật hash rất chặt. Cùng trust boundary với
trước (thư mục user-local, do Relay ghi) nên không phải lỗ hổng mới — nhưng lệch chuẩn.

**P3 — `relay-failure-notifier.ts`**: `if (this.dialogPending) return;` bỏ hẳn thông báo mới
khi đang có dialog mở, kể cả khi nội dung **khác** — không hạ cấp xuống notification. Nếu
`showMessageBox` không bao giờ settle, `dialogPending` kẹt `true` và mọi cảnh báo Relay về
sau bị nuốt im lặng. Dedupe theo trạng thái thay vì theo nội dung.

**P3 — `compatibility-smoke-runner.ts`**: `navigation.url !== PROXY_CHECK_URL` so sánh chuỗi
tuyệt đối với `https://api.ipify.org/?format=json`. Nếu Chromium chuẩn hóa URL (bỏ `/`, đổi
thứ tự query) sẽ fail giả. VM đã pass nên hiện không xảy ra, nhưng giòn.

Phần còn lại chắc: `ensure(ignoreCache)` để Retry bypass cache activate đúng ý đồ; probe IP
validate bằng `isIP()` và không rò nội dung provider vào thông báo lỗi; PowerShell
`stopExactOwnedWindowsProcesses` so khớp full path, giữ process trùng tên của bên khác,
idempotent, `exit 0` chỉ chạy khi không có throw.

## Việc nên làm, theo thứ tự

1. **Push toàn bộ commit candidate** (Browser 5, MKTTool 5). Rẻ, xóa rủi ro mất nguồn.
2. **Deploy `b614ba2`** để đóng advisory critical trên production. Gộp cùng lần push ở bước 1
   để chỉ tốn một chu kỳ CI.
3. **Cài Node 22** để tái lập được gate của Browser trên host này.
4. P2/P3 ở mục 5: không chặn phát hành, gom vào lần sửa sau.

## Resolution — 9 September 2026, 22:18

Mục 1 và 2 của "Việc nên làm" đã đóng. Mục 3 và 4 vẫn mở, chờ quyết định.

**Nguồn candidate không còn chỉ nằm trên ổ D:.** Đã push, không merge:

| Repo | Nhánh trên origin | HEAD |
|---|---|---|
| MKTBrowser | `codex/compatibility-activation-ready` | `26bc2d8` |
| MKTTool | `codex/single-entry-browser-startup` | `bfd51ac` |
| MKTTool | `codex/compatibility-activation-ready` | `bb378ae` |

**Advisory production đã đóng.** `b614ba2` được cherry-pick lên nhánh
`security/next-sharp-advisory-patch` tách từ `origin/master`, giữ đúng 4 file (package.json,
package-lock.json, roadmap, changelog). Không mang theo release-candidate metadata, nên hold
nghiệm thu MSI không bị ảnh hưởng. Docs được viết lại cho đúng phạm vi bản vá thay vì lấy
nguyên khối docs của nhánh candidate.

Gate local trên nhánh vá, sau `npm ci` theo lockfile mới:

| Gate | Kết quả |
|---|---|
| `audit:production` | PASS — trước đó FAIL |
| `typecheck` / `lint` | PASS |
| `test` | 2141/2141, 231 file, 0 skip |
| `build` | PASS |
| `ci:secret-scan` | PASS, 777 file |

PR [#71](https://github.com/Techieslab-app/MKTTool/pull/71): check, contracts,
dependency-audit, relay-executable (Windows 2x), secret-scan đều PASS; deploy-verification
skip theo policy PR-only. Merge thành `f394457acf1a` lúc 15:13:02Z.

Post-merge CI `34368774606` trên `f394457a`: **success** — check, contracts,
dependency-audit và deploy-verification PASS; relay-executable skipped đúng thiết kế
(job chỉ chạy ở PR để tránh trả tiền hai lần cho cùng một cây).

GitHub deployment `6353025995` gắn đúng `sha=f394457a`, state **success** lúc 15:15:11Z.
Health lúc 15:15:55Z: HTTP 200, `ok:true`, `status:ready`, database/releaseMetadata/r2 đều ok,
`relayVersion 16` (không đổi — bản vá không đụng Relay). Routing sau nâng cấp không đổi:
`/` → 307, `/_next/image` → 400, không regression.

Giới hạn cần nói rõ: production không phát ra số phiên bản Next/sharp, nên chuỗi bằng chứng
là **lockfile trên `f394457` → GitHub deployment gắn đúng SHA đó → state success**, giống
chuẩn các lần deploy trước trong kế hoạch. Không phải quan sát trực tiếp version đang chạy.

Chưa làm: ba điểm P2/P3 ở mục 5 (sửa là phải freeze candidate mới).

## Resolution — Node toolchain, 22:35

Mục 3 đóng. Gốc rễ không phải "máy thiếu Node 22" mà là **repo khai báo sai**: `engines.node`
ghi `">=20.0.0"` trong khi `verify-node-version.cjs` hard-fail nếu major khác 22, và không có
`.nvmrc` / `.node-version` / `volta` nào. Máy cài Node 20 hoặc 24 đều hợp lệ theo `engines` rồi
vỡ ở native module.

Pin chặt là đúng, không nới: dự án có hai ABI cùng lúc — test chạy Node 22, app đóng gói chạy
Electron 42, `@electron/rebuild` đổi qua lại lúc packaging. Nới `engines` ra sẽ tạo gói hỏng âm
thầm thay vì báo lỗi.

Nhánh `chore/pin-node-toolchain` (Browser, tách từ `origin/main`, commit `285abf3`, đã push,
**chưa merge** — không đụng candidate 0.3.17):

| Lớp | Thay đổi |
|---|---|
| 1 | `.nvmrc` = 22, `engines.node` → `22.x`, `volta` pin |
| 2 | Volta 2.0.2 cài trên máy; default giữ `node@24.21.0` |
| 3 | Thông báo lỗi phiên bản in cả hai nửa cách sửa, kèm 3 test mới |
| 4 | Workflow đọc `node-version-file: .nvmrc` thay vì lặp `22` ở ba chỗ |

**Bẫy phát hiện khi kiểm chứng: pin `node` một mình là chưa đủ.** Sau `volta pin node@22`,
`node -v` trả 22.23.2 nhưng `corepack yarn verify:node` vẫn báo `Current runtime: 24.14.1`.
`corepack.cmd` nằm trong `C:\Program Files\nodejs` và khởi chạy chính Node đó, bỏ qua shim của
Volta — nên mọi script do yarn chạy vẫn dùng major mặc định của máy. Sửa bằng
`volta pin yarn@4.5.0`; sau đó gọi `yarn` trực tiếp thì shim giải quyết cả Yarn lẫn Node đã pin,
và `verify:node` exit 0. README ghi lại cả cái bẫy này.

Đo được sau khi áp:

| Vị trí | node |
|---|---|
| Ngoài repo | v24.21.0 |
| MKTTool | v24.21.0 (npm 11.19.0) |
| MKTBrowser | **v22.23.2**, yarn 4.5.0 |

Chứng minh 12 test fail thuần do phiên bản: chạy lại **chính source candidate đông cứng, chính
`node_modules` đó**, chỉ đổi Node qua `volta run --node 22`. Suite `managed-profile-create` từ
0/3 lên **3/3**. Toàn bộ `test:installer`: **exit 0, 459 test, 458 pass, 0 fail, 0
`ERR_DLOPEN_FAILED`** — so với Node 24 là 145 pass / 12 fail và đứt chuỗi giữa chừng.

Gate trên chính nhánh toolchain: `verify:node` PASS, contract test 3/3, `test:w02` PASS,
typecheck PASS, lint PASS.

Giới hạn: pin chỉ có hiệu lực trên nhánh chứa nó. Cho tới khi merge, các nhánh candidate vẫn
cần `volta run --node 22 -- ...` như cách đã dùng ở trên.

## Unresolved

- ~~Deploy `b614ba2` — đã tách riêng và deploy độc lập, xem Resolution.~~ Còn lại:
  các nhánh candidate đã push nhưng chưa có PR — có mở PR ngay hay giữ tới khi MSI xong?
- ~~Cài Node 22 — đã xong bằng Volta, default máy giữ Node 24. Xem Resolution.~~
- `findActivatedWindowsEngine` có nên verify SHA-256 của `chrome.exe` theo tuple đã ký không?
  Sửa thì cần một candidate mới.

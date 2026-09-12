# Audit — package installer (MKT Browser Windows NSIS)

Date: 2026-09-13. Scope: `apps/desktop/electron-builder*.yml`, `scripts/package-windows*.cjs`,
`apps/desktop/build/*.ps1`, `build/installer.nsh`, release gates trong `MKTBrowser/scripts/`,
và phía phát hành `MKTTool/src/lib/setup/windows-installer-*`.

Verify thực tế trong lúc audit: chạy `scripts/*packaging*` suite trực tiếp bằng node →
**58 pass / 0 fail / 1 skipped** (skip = gate opt-in `MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION`).

## Verdict

Build/packaging pipeline **tốt, trên mức bình thường** — hash-pin toàn tuyến, two-build
reproducibility, gate chạy trước khi tạo artifact, NSIS ownership discipline fail-closed.

Điểm yếu **không nằm ở build**, nằm ở hai chỗ:
1. **Trust boundary lúc install** — chuỗi hash-pin đứt ở bước cuối cùng (F1/F2).
2. **Evidence còn OPEN** — clean-VM 0.3.20 chưa chạy, CFT pin chưa từng exercise (đã ghi
   trong `release-260912-1205-...md`, không phải phát hiện mới).

## Điểm mạnh (đã verify)

| Hạng mục | Chi tiết |
|---|---|
| Relay supply chain (build) | `fetch-pinned-relay.cjs`: HTTPS + URL bất biến `/vN`, `redirect:"error"`, size+sha256, resume Range phải trả 206, atomic `.partial`→rename. `verify-relay-executable-pin.cjs` stream hash `MKTTool-Relay.exe` **trong** zip, không extract không exec, chặn entry trùng/ambiguous, cap 256 MB. `stageVerifiedRelayPayload` re-hash **bytes đã copy**. |
| Electron ABI | `package-windows.cjs` tập trung rebuild `better-sqlite3` theo `electronVersion` đọc từ yml; cả installer lẫn dir-package đi chung → không drift lại được. Đã đóng defect thật ngày 12/08/2026. `finally` restore package.json + workspace symlink + native binary. |
| Gate trước artifact | `runPrepackageQualityGates` chạy `lint` + `test:installer` **trước** khi build, qua corepack bundled gọi bằng `node.exe` (né lỗi Node 22 spawn `.cmd`). |
| Reproducibility | `normalized-payload-manifest.cjs` chỉ zero 2 field PE (COFF TimeDateStamp, Optional CheckSum), liệt kê đủ lý do, không nới danh sách. 0.3.20: 129 file, manifest identical giữa 2 build sạch. |
| Contract trên packaged tree | `release-candidate-contract.cjs` re-hash `resources/relay/MKTTool-Relay.zip` trong win-unpacked vs tuple đã duyệt, check engine pin, quét chuỗi version 0.3.12 bị quarantine. |
| NSIS ownership | Không bao giờ đụng firewall rule / Startup shortcut / Relay của user khác hoặc của bên thứ ba. Mọi bước Install/Verify/Uninstall fail-closed. `RelayOwned`/`RelayStartupManaged` sống sót qua upgrade bằng repair key riêng. `windows-relay-cleanup.ps1` hợp nhất 2 nguồn (WMI + Process.Path) vì NSIS chạy PowerShell 32-bit dưới WOW64 — comment giải thích đúng nguyên nhân. |
| Phía phát hành | Immutable candidate key, không fallback về object cũ, binding tuple qua env (`MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON`), metadata mang `signing-status` + expiry. |

**Không phải bug (đã kiểm chứng):** `electron-builder-installer.yml` override `extraResources` —
`extends` **nối** array chứ không thay thế. Build installer thật (`release/quarantine-20260830-v0312/win-unpacked/resources/`) có đủ `companion` + `installer` + `relay`.

## Findings

### F1 — Medium — install-time không verify lại hash của Relay payload — **ĐÃ SỬA 2026-09-13**

`build/windows-install-relay-payload.ps1` chỉ check: file tồn tại, đuôi `.zip`, staging nằm trong
TEMP. Rồi `Expand-Archive` và `& install-relay.ps1` — **không đọc sha256**.

`relay-release.json` (có sẵn `sha256`, `sizeBytes`) được ship ngay cạnh zip tại
`$INSTDIR\resources\relay\relay-release.json`. Grep xác nhận file này chỉ được **build-time**
scripts dùng (`emit-windows-compatibility-evidence`, `release-candidate-contract`); không script
install-time nào đọc.

- Không phải EoP: bước này chạy `nsExec` non-elevated, cùng user.
- Giá trị thực: chống tamper/persistence, và giữ tính nhất quán — cả pipeline pin hash mà bước
  cuối (bước duy nhất chạy trên máy khách) lại tin cậy file trên đĩa.
- Fix rẻ: đọc manifest kế bên, so size+sha256 trước `Expand-Archive`. Manifest đã ở đúng chỗ.

### F2 — Low/Medium — installer dùng `Expand-Archive` thô, app đã hardened — **ĐÃ SỬA 2026-09-13**

App đã bỏ `extract-zip` sang `yauzl` + `safe-archive-extraction` guard, và
`verify-packaged-runtime-contract.cjs` assert `extract-zip` không còn trong `app.asar`.
Installer thì vẫn `Expand-Archive` trần (zip-slip). Chỉ thành vấn đề nếu F1 xảy ra, nhưng là
bất nhất rõ giữa hai nửa cùng sản phẩm.

### F3 — Low — comment "no UAC" sai — **ĐÃ SỬA 2026-09-13**

`scripts/package-windows-installer.cjs:6`: *"one file, no UAC, its own uninstaller"*.

Thực tế `installer.nsh` gọi `ExecShellWait "runas"` ở **cả** `customInstall` (line 146) và
`customUnInstall` (line 213). Mọi install / upgrade / uninstall đều bật UAC, và standard user
phải có admin credential.

Đính chính so với bản đầu của report này: **onboarding không sai**. `README.md:141` đã ghi đúng
("requests one Administrator approval for machine-wide outbound UDP rules"), và setup page của
MKTTool hiện **không phát hành MKT Browser** ("MKT Browser is not distributed from this page",
`onboarding-stepper.tsx:95`) nên chưa có copy người dùng nào để sửa. Chỉ comment build script sai.

### F4 — Low — uninstall bỏ lại engine cache — **ĐÃ SỬA 2026-09-13** (owner chọn: xoá cache, giữ profiles)

Không có gì trong `build/` hay nsis config xoá `%LOCALAPPDATA%\MKTTool\MKTBrowser`;
`deleteAppDataOnUninstall` cũng không set.

Giữ `profiles.db` / identity là **chủ ý** và đã PASS ở step 8 clean-VM 0.3.19. Nhưng engine cache
thì không phải dữ liệu người dùng — 578 MB trên máy owner, ~202 MB cho CFT pin — mồ côi sau
uninstall, không có checkbox lẫn lệnh nào gỡ. Clean-VM 0.3.19 không phát hiện vì engine chưa
bao giờ provision ở run đó.

### F5 — **ĐÃ VIẾT SAI, thay bằng phát hiện khác** — exception tự gia hạn mỗi lần build

Bản đầu tôi viết "không gate nào ở freeze/build kiểm". **Sai.** Kiểm tra lại:
`publish-windows-installer.ts:492` đã từ chối expiry đã quá hạn (`expiresAt <= Date.now()`) ngay
lúc publish, trước khi upload. Cả publish lẫn serve đều fail-closed. Không có lỗ hổng như tôi mô tả.

Phát hiện thật, khác hẳn: `emit-release-provenance.cjs:110` tính

```js
const unsignedExceptionExpiresAt = new Date(generatedAt.getTime() + 60 * 24 * 60 * 60 * 1000);
```

Expiry = **thời điểm build + 60 ngày**, nên nó không bao giờ hết hạn tại thời điểm emit, và reset
mỗi lần build lại. Test duy nhất phủ nó (`emit-release-provenance.test.cjs:78`) chỉ assert
`exceptionExpiresAt > generatedAt` — đúng với mọi cửa sổ trượt, tức chưa ai chốt ngữ nghĩa.

Không tìm thấy tài liệu nào định nghĩa cửa sổ 60 ngày này (grep docs cả 2 repo: không có).
Hai cách đọc, dẫn tới hai kết luận trái ngược:

- **(a) Kiểm soát độ cũ của artifact** — "installer đã publish hết hạn 60 ngày sau khi build".
  Metadata nằm trên từng object R2 nên mỗi bản có hạn riêng, bản cũ vẫn hết hạn thật.
  Theo cách đọc này **code hiện tại đúng** và khá hữu ích: ép re-publish + re-verify bản quá cũ.
- **(b) Hạn của chính quyết định ship-unsigned** — thì phải là mốc tuyệt đối neo vào ngày quyết
  định (12/08 → tái xác nhận 22/08/2026), không phải `generatedAt + 60`. Theo cách đọc này cơ chế
  **không bao giờ kích hoạt được**: cứ build lại là đồng hồ về 0, một "exception có hạn" mà tự gia
  hạn vô tận.

Tên biến (`exceptionExpiresAt`) và tên metadata key (`signing-exception-expires-at`) nghiêng về
(b), hành vi lại là (a). Đây là **quyết định chính sách của owner**, không phải bug để tự sửa —
chọn sai hướng sẽ hoặc chặn phát hành ngoài ý muốn, hoặc bỏ mất một deadline có chủ đích.
**Đang chờ owner quyết.**

### F6 — Trivial — blockmap sinh ra nhưng không ai dùng

Không có publish provider / update channel (đúng thiết kế, thuộc W04). NSIS vẫn sinh
`.blockmap`. Vô hại, chỉ là rác artifact.

## OPEN (dẫn lại từ evidence, không phải phát hiện mới)

- Clean-VM acceptance 0.3.20: **chưa chạy**.
- CFT engine pin: **chưa từng exercise** ở bất kỳ máy nào (VM không provision được, host chạy
  CloakBrowser).
- Proxy failure/recovery: **BLOCKED** bởi engine.
- Machine-integration gate: skip 2 release liên tiếp cùng một lý do.
- Publication / operator promotion: chưa làm, `MKT_WINDOWS_INSTALLER_APPROVED_TUPLE_JSON` chưa set.

## Đã sửa — 2026-09-13

Source change, **chưa** build lại installer, **chưa** freeze candidate mới.

| File | Thay đổi |
|---|---|
| `apps/desktop/build/windows-install-relay-payload.ps1` | Đọc `relay-release.json` kế bên archive, verify size rồi sha256 **trước** `Expand-Archive` và trước `& install-relay.ps1`. Fail closed với token riêng: `relay-manifest-missing`, `relay-manifest-invalid`, `relay-archive-size-mismatch`, `relay-archive-checksum-mismatch`. Không thêm input mới — manifest đã được ship sẵn qua `extraResources`. |
| `apps/desktop/build/windows-install-relay-payload.ps1` (F2) | Bỏ `Expand-Archive`. Extract từng entry qua `[IO.Compression.ZipFile]`, resolve path và từ chối entry nào ra ngoài staging (`relay-archive-entry-escapes-staging`). Validate **toàn bộ** path trước khi ghi byte đầu tiên, nên archive bị từ chối không để lại extract dở. |
| `apps/desktop/scripts/windows-install-relay-payload.test.cjs` | Mới. 8 case × 2 PowerShell host (native + 32-bit WOW64 như NSIS thật sự chạy): happy path (extract thật, chạy thật, thấy `RELAY_SKIP_BROWSER=1`), byte tampering cùng size, size mismatch, manifest thiếu, manifest không có digest hợp lệ, manifest JSON hỏng, zip-slip, và zip-slip không ghi ra gì kể cả entry lành đứng trước. Mọi case từ chối đều assert `install-relay.ps1` **không** chạy. |
| `apps/desktop/scripts/windows-firewall-installer.test.cjs` | Assertion cũ pin literal `Expand-Archive -LiteralPath $archive`. Thay bằng pin tính chất thật: extract đi qua `ZipFile]::OpenRead`, có guard escape, có hash check, và không quay lại `Expand-Archive`. |
| `apps/desktop/package.json` | Đăng ký test mới vào `test:packaging`. |
| `apps/desktop/scripts/package-windows-installer.cjs` | Sửa comment "no UAC" (F3). |
| `apps/desktop/build/windows-engine-cache-cleanup.ps1` (F4) | Mới. Xoá `%LOCALAPPDATA%\MKTTool\MKTBrowser\chromium` lúc uninstall, retry 15s cho handle còn sót. Chỉ xoá đúng thư mục đó. |
| `apps/desktop/build/installer.nsh` (F4) | Gọi cleanup ở **cuối** `customUnInstall`, **không** `Abort` khi lỗi — chỉ `DetailPrint` kèm đường dẫn để xoá tay. |
| `apps/desktop/scripts/windows-engine-cache-cleanup.test.cjs` (F4) | Mới. 3 case × 2 host: xoá được cache lồng nhau (cft + cloakbrowser), không có cache thì vẫn exit 0, LOCALAPPDATA rỗng thì không xoá gì. Mọi case assert `profiles.db` / `settings.json` / `profile-shutdown.log` / `active-engine.json` còn nguyên **và nội dung không đổi**. |
| `apps/desktop/scripts/windows-firewall-installer.test.cjs` (F4) | Thêm assert: cleanup chạy **sau** bước fail-closed cuối cùng, và block của nó **không chứa** `Abort`. |
| `.gitignore` | Allowlist script mới — `apps/desktop/build/` là ignore-by-default + allowlist từng file, thiếu dòng này thì script không vào git và installer build ra sẽ thiếu nó. |
| `scripts/emit-release-provenance.cjs` + test (F5) | Đổi tên biến sang `artifactUsableUntil`, thêm hằng `UNSIGNED_ARTIFACT_USABLE_DAYS` kèm giải thích ngữ nghĩa (a), ghi rõ vào `signing.note`. Test cũ assert `expiresAt > generatedAt` (đúng với mọi cửa sổ, chốt được gì đâu) → thay bằng assert đúng bằng 60 ngày. **Hành vi không đổi**, chỉ chốt ý nghĩa. |

Không sửa `installer.nsh`: hình dạng lỗi không đổi (`nsExec::ExecToStack` vẫn pop exit code + text
vào `$0`/`$1`, MessageBox hiện `$1`), token không chứa path/secret.

**Verify đã chạy:**

| Gate | Kết quả |
|---|---|
| `test:packaging` (14 file) | **82 tests, 81 pass, 0 fail, 1 skipped** — trước đó 59/58. +23 test mới. Skip vẫn là gate opt-in `MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION`, không liên quan. |
| Root release-contract suite (10 file, gồm `emit-release-provenance`) | **61/61 pass** |
| `test:w02` (`productIdentity` + `mkt-browser-contract`) | 8/8 pass — `installer.nsh` được assert ở `productIdentity.test.ts:148`. |
| `check-javascript-syntax.cjs` | 59 files OK |
| `workspace-quality-contract.cjs` | passed |
| `eslint` trên 6 file JS đã đổi | sạch |
| `git status` | 3 file mới hiện `??` chứ không bị ignore — allowlist `.gitignore` đúng |

### Gate đầy đủ — PASS (2026-09-13 01:41 +07)

Chạy được sau khi commit (runner bắt buộc tree sạch cả 2 repo). Node 22.23.2 / Yarn 4.5.0 qua
corepack. Receipt: `D:\mkt-release-evidence\quality-260913-0140\`, runId `19ee14b2`,
status `completed`, failure `none`, 18:36:43Z → 18:41:19Z.

| Lệnh | Exit | Giây |
|---|---|---|
| verify:node | 0 | 0 |
| audit:production | 0 | 2 |
| test:installer | 0 | 62 |
| test:critical-coverage | 0 | 12 |
| typecheck | 0 | 12 |
| lint | 0 | 24 |
| build | 0 | 161 |

`test:installer`: **526 tests, 525 pass, 0 fail, 1 skipped** (0.3.20: 502/501/1). +24 khớp đúng
số test thêm vào. Skip vẫn là gate opt-in `MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION` — bằng
chứng chưa quan sát, **không phải pass**, giống adjudication của 0.3.19 và 0.3.20.

Lưu ý RAM: lúc chạy máy ở 96% commit charge (825 MB free) với game + Discord + Steam đang chạy;
owner chấp nhận rủi ro. Gate chạy xong không sự cố.

**Vẫn chưa có:** rebuild installer, two-build equivalence, clean-VM. `releaseReady` trong receipt
là `false` và `acceptance` là `OPEN` — đúng như thiết kế, receipt chỉ chứng nhận lệnh exit 0.

### Git

- Branch `fix/installer-payload-verification-and-engine-cache` (tách từ `main`, vì `main` là
  default branch).
- `4d302ea` refactor(release) — F5.
- `e822000` fix(installer) — F1/F2/F3/F4. Gộp vì `package.json` và
  `windows-firewall-installer.test.cjs` mỗi file mang sửa đổi của cả hai nhóm; tách ra sẽ tạo
  commit trung gian có test fail.
- PR: https://github.com/Techieslab-app/MKTBrowser/pull/24 — **chưa merge**.

Grep xác nhận không nơi nào pin hash nội dung của `windows-install-relay-payload.ps1`; các assert
hiện có chỉ về cấu trúc `installer.nsh` (không đổi) và đều pass.

## Trạng thái

F1–F5 đều đã xử lý. F6 (blockmap thừa) bỏ qua — vô hại.

## Unresolved questions

1. **Clean-VM còn nợ.** F1/F2/F4 đều nằm trên đường install/uninstall; gate đầy đủ chỉ chứng minh
   lệnh exit 0, không chứng minh hành vi cài/gỡ trên máy sạch. F4 đổi đúng bước 7–8 vừa PASS ở
   0.3.19, nên cần chạy lại ít nhất bước 2/6/7/8 sau khi merge.
2. Owner chọn "mở PR trước, freeze sau" → cut candidate 0.3.21 + two-build sẽ làm sau merge.
   Khi đó có chạy lại full matrix hay chỉ đường install/uninstall?
3. **Đính chính** (2026-09-13): tôi đã báo `README.md:141-152` "ghi sai" Relay v16 / candidate
   0.3.13. Đọc kỹ lại thì **không phải lỗi**. README là nhật ký append theo ngày — kể cả mục
   "Current status" cũng là chuỗi bullet gắn mốc ("verified on 10 August 2026", "Phase S3 produced
   … candidate `0.3.13`"). Những dòng đó ghi đúng cái đúng-tại-thời-điểm-đó, cùng loại với
   `docs/first-attested-release-candidate.md` mà tôi đã không đụng.

   Vấn đề thật, nhỏ hơn nhưng khác bản chất: **README không có con trỏ trạng thái hiện hành**.
   Mục mới nhất (10/09) vẫn nói "the accepted 0.3.17 / Relay 17 installer", trong khi candidate
   đã duyệt là 0.3.20; và chữ "current" ở dòng 152 (`The current 0.3.13 source candidate`) đúng
   lúc viết nhưng nay gây hiểu nhầm. Sửa các dòng cũ = làm sai lệch lịch sử; cách đúng là thêm
   một con trỏ hiện hành ở đầu, hoặc chấp nhận để release report trong workspace giữ vai trò đó.
   Đây là quyết định về tài liệu định hướng chính của repo (AGENTS.md bắt buộc đọc README trước
   khi lập kế hoạch) — **chờ owner quyết**, không tự đổi.
4. Gate opt-in `MKT_BROWSER_RUN_WINDOWS_MACHINE_INTEGRATION` nay đã skip 3 release liên tiếp cùng
   một lý do (cần đóng Browser/Relay/MultiZen trên máy chạy). Chuyển sang chạy trong VM?

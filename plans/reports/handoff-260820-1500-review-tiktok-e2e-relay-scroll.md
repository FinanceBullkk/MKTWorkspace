# REVIEW HANDOFF — tiktok-e2e.mjs: relay seat + scroll outcome + exitCode race

**Gửi tới:** Claude kiểm duyệt · **Từ:** work session 20/08/2026 · **Độ ưu tiên:** trước khi chạy login flow / scale test

## 1. Mục đích review

Kiểm duyệt 3 bản sửa trên `tiktok-e2e.mjs`:

| # | Bản sửa | Triệu chứng gốc | Trạng thái |
|---|---|---|---|
| A | License relay (trả seat) | exit 76 liên tục khi chạy back-to-back | ✅ chứng minh bằng smoke9→14 |
| B | Scroll đo outcome (container inner) | scroll "treo" / 0/5 dù page vẫn phản hồi | ✅ smoke13/14: 4/5 |
| C | Double-write exitCode | JSON ghi `exitCode:null` | ✅ mọi run gần đây = 0 |

Kèm theo: vòng retry exit-76 (3 lần, backoff 25s/50s) — safety net, giữ nguyên.

## 2. File cần review (absolute paths)

| File | Vai trò |
|---|---|
| `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\tiktok-e2e.mjs` (858 dòng) | Bản chính — toàn bộ 3 bản sửa nằm đây |
| `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\poll-seat.mjs` | Probe seat availability (không tiêu thụ seat) |
| `e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\scroll-debug.mjs` | Chẩn đoán scroll (đã dùng để tìm ra nguyên nhân B) |
| `e:\MKTWorkspace\plans\reports\handoff-260820-1430-seat-relay-va-scroll-outcome.md` | Handoff chi tiết trước đó |
| `e:\MKTWorkspace\plans\reports\research-260820-0858-giao-thuc-license-cloakbrowser.md` | Research giao thức license (relay mô phỏng đúng app gốc) |

## 3. Checklist review theo vị trí trong `tiktok-e2e.mjs`

### A. Relay (dòng 475–550, gắn vào run 575–576, đóng 786–820)
- [ ] `startLicenseRelay` (475): HTTP server local, forward verbatim mọi request lên `CLOAKBROWSER_LICENSE_API_UPSTREAM` (cloakbrowser.dev). KHÔNG được sửa body/header.
- [ ] Bắt `lease_id` + `install_id` + `instance_id` từ response `session/start` (200).
- [ ] `endLeaseIfHeld` (529): gọi `POST /api/license/session/end` với đúng lease đã capture; **có guard `endSeen`** — nếu engine gửi `session/end` rồi thì KHÔNG gửi lại.
- [ ] Engine trỏ vào relay qua `CLOAKBROWSER_LICENSE_API=http://127.0.0.1:<port>` (576) — không còn trỏ thẳng upstream.
- [ ] Relay đóng đúng: `attachRelay` trong catch + finally (786, 820).
- [ ] `relayEnd` ghi vào JSON (817) — boolean, không throw.

### B. Scroll outcome (278–297 SCROLL_STATE_JS, 698–705 feed-ready poll, ~706–740 vòng wheel)
- [ ] `SCROLL_STATE_JS` quét **toàn DOM** (`div,main,section,body`) chọn element có `scrollHeight−clientHeight` lớn nhất — không hardcode. (TikTok scroll bằng div class hash; `window.scrollY` luôn 0.)
- [ ] Trước vòng wheel: poll mỗi 1s (max 10s) tới khi container.diff > 100.
- [ ] Đo `container.scrollTop` + `vTop` + `winY` trước/sau mỗi burst; `moved` = di chuyển > 100px. **Không phụ thuộc CDP ack.**
- [ ] Scroll non-fatal: timeout CDP 4s + try/catch; fail không abort run.
- [ ] `result.scroll` ghi đúng `ok`/`attempted`/`hangs` (smoke13/14: ok=4 attempted=5 hangs=1).

### C. Double-write exitCode
- [ ] Ghi JSON 2 lần: lần 1 snapshot sớm, lần 2 sau khi chờ `child exit` event.
- [ ] smoke9–14 đều `exitCode: 0` (không null).

### D. Retry wrapper (841–855)
- [ ] Vòng retry attempt 1–3, delay = 25000 × attempt, chỉ khi `exitCode === 76`.
- [ ] Không retry khi lỗi khác (scroll fail, CDP timeout).
- [ ] Sau 3 lần fail: log "All attempts refused" + exit 76.

## 4. Chứng cứ

`e:\MKTWorkspace\local-test-artifacts\engine-switch-audit\probe-tiktok-smoke*.json`

| File | exitCode | scroll | lease | endSeen | relayEnd | Ý nghĩa |
|---|---|---|---|---|---|---|
| smoke9 | 0 | 0/5 | true | true | true | Relay bắt được lease, run sạch |
| smoke10 | 0 | 0/5 | true | true | true | Back-to-back sau smoke9 — seat được trả ngay |
| smoke11 | 0 | 0/5 | true | true | true | Scroll vẫn 0/5 (trước fix B) |
| smoke12 | 0 | 0/5 | true | true | true | ditto |
| smoke13 | **0** | **4/5** | true | true | true | **GPU ON — sau fix B** |
| smoke14 | **0** | **4/5** | true | true | true | **GPU OFF (default)** |
| smoke5–8 | 76 | 0/0 | —/false | —/false | — | Pre-relay — đối chứng |

`relay.requests` trong smoke14: đúng 2 request (session/start 200, session/end 200) — engine tự end, không double-end.

## 5. Cách chạy lại

```powershell
cd e:\MKTWorkspace\local-test-artifacts\engine-switch-audit
node --check tiktok-e2e.mjs
node tiktok-e2e.mjs --tag review1 --no-login               # default (disable-gpu)
node tiktok-e2e.mjs --tag review2 --keep-gpu --no-login     # đối chứng GPU
# Relay tự trả seat → chạy back-to-back không cần chờ 15 phút.
```

## 6. Invariants (không được làm hỏng)

1. **Relay forward verbatim** — chỉ đọc body/header, không sửa.
2. **Không double `session/end`** — guard `endSeen` là bắt buộc.
3. **Scroll non-fatal** — mọi thứ trong vòng scroll có try/catch; run luôn ra JSON.
4. **exitCode không null** — luôn double-write.
5. **Không 2 profile cùng lúc** — plan free limit=1.

## 7. Điểm mở / rủi ro

- **Login flow chưa test** — cần `tiktok-accounts.json` + account thật. Sau review xong, test login là ưu tiên 1.
- **Scroll 5/5**: lần wheel đầu tiên bị TikTok nuốt (warm-up). Có thể thêm 1 wheel giả trước vòng đo.
- **Scale**: chưa chạy chuỗi >6 run liên tục; cần kiểm relay có đọng socket/fd.
- **Canvas hash** khác nhau giữa run (smoke13=408776913, smoke14=2601446965) — nhiễu fingerprint, không phải bug.

## 8. Câu hỏi review cần trả lời

1. Relay có trường hợp leak lease nào không (engine bị kill -9 giữa `session/start` chưa kịp nhận response)?
2. `endLeaseIfHeld` có race với chính request `session/end` của engine không (guard đủ chặt chưa)?
3. SCROLL_STATE_JS quét toàn DOM có chậm/treo renderer không khi feed dài?
4. Retry có thể gây double-spawn 2 engine cùng lúc không?
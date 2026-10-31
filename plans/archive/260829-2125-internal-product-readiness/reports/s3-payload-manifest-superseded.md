# Superseded S3 payload manifests

`s3-payload-manifest-run1.json` and `s3-payload-manifest-run2.json` retain the earlier S3 package
snapshot for forensic history. Their normalized digest (`5a8385a27ed70e67ae5368aa5e5f09e8db23dc47b52e67bdb281ce7965fddf37`)
and `app.asar` entry belong to that earlier output and are not the final S4b candidate evidence.

The final comparison is the complete unpacked Windows payload pair:

- `s4b-payload-manifest-run3.json`
- `s4b-payload-manifest-run4.json`
- normalized digest `517272ad864410c278ef59e3c5ef9955c6ddafd99226259452b2206145d03566`

The final pair contains 130 entries and compares with zero differences. The outer NSIS installers
remain separately OPEN because their bytes differ by 78 bytes.

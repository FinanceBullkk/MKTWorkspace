const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const browserRoot = path.resolve(__dirname, "../../MKTBrowser");
const { inspectFingerprintEnginePin } = require(path.join(browserRoot, "scripts/fingerprint-engine-pin.cjs"));
const { seedVerifiedStableEngineCache } = require(path.join(browserRoot, "scripts/fingerprint-engine-cache-fixture.cjs"));
const { launchMktBrowser, waitForReadyRuntime } = require(path.join(browserRoot, "scripts/fingerprint-measurement-mcp.cjs"));
const output = path.join(__dirname, "live-seat-once.json");
const attempted = path.join(__dirname, "live-seat-attempt.json");
const quietSince = "2026-09-21T04:12:04.951Z";
const notBefore = Date.parse(quietSince) + 25 * 60_000;
const evidence = {
  schemaVersion: 1, status: "OPEN", scope: "Source Electron lifecycle with existing packaged dependencies, disposable profile, no installer or identity acceptance",
  quietSince, notBefore: new Date(notBefore).toISOString(), launchAttempts: 0,
};
const save = () => fs.writeFile(output, JSON.stringify(evidence, null, 2) + "\n");
const safeMessage = error => String(error?.message ?? error)
  .replaceAll(process.env.CLOAKBROWSER_LICENSE_KEY || "__unused__", "<redacted-key>")
  .replace(/https?:\/\/\S+/g, "<redacted-url>").slice(0, 1800);
const runtimeSummary = runtime => ({
  appVersion: runtime.appVersion, contractVersion: runtime.contractVersion,
  engine: runtime.engine, licenseCapacity: runtime.licenseCapacity,
});

async function main() {
  assert.ok(Date.now() >= notBefore, "The 25-minute quiet interval has not elapsed.");
  assert.ok(process.env.CLOAKBROWSER_LICENSE_KEY?.trim(), "A live key must already be present in the environment.");
  await assert.rejects(fs.access(attempted), { code: "ENOENT" }, "This one-shot experiment was already attempted; do not rerun it.");
  const pin = await inspectFingerprintEnginePin({
    "engine-version": "151.0.7922.108.6",
    "engine-sha256": "5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37",
  });
  evidence.engine = pin.authority;
  evidence.bundleSha256 = crypto.createHash("sha256").update(
    await fs.readFile(path.join(browserRoot, "apps/desktop/out/main/index.js")),
  ).digest("hex");
  evidence.freeMemoryGiB = Number((os.freemem() / 2 ** 30).toFixed(2));
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), "mkt-seat-once-"));
  let app;
  let profile;
  let launched = false;
  try {
    await seedVerifiedStableEngineCache({ userData, expectedVersion: pin.version,
      expectedArchiveSha256: pin.archiveSha256, sourceRoot: pin.sourceRoot });
    app = await launchMktBrowser({
      executable: path.resolve(__dirname, "../../local-test-artifacts/licence-seat-260921/electron-runtime/electron.exe"),
      appPath: path.resolve(__dirname, "../../local-test-artifacts/licence-seat-260921/source-app"), userData,
      licenseKey: process.env.CLOAKBROWSER_LICENSE_KEY.trim(),
    });
    evidence.before = runtimeSummary(await waitForReadyRuntime(app, 60_000));
    assert.equal(evidence.before.engine.version, pin.version);
    assert.equal(evidence.before.licenseCapacity?.free, 1);
    profile = await app.callTool("create_profile", { name: "Disposable licence cooldown verification", seed: "260921-seat-once" });
    evidence.attemptedAt = new Date().toISOString();
    await fs.writeFile(attempted, JSON.stringify({ attemptedAt: evidence.attemptedAt, quietSince }) + "\n", { flag: "wx" });
    evidence.launchAttempts = 1;
    await save();
    await app.callTool("launch_profile", { profile_id: profile.id });
    launched = true;
    evidence.launchedAt = new Date().toISOString();
    evidence.active = runtimeSummary(await app.callTool("get_runtime_info", {}));
    await app.callTool("close_profile", { profile_id: profile.id });
    launched = false;
    evidence.closedAt = new Date().toISOString();
    evidence.afterClose = runtimeSummary(await app.callTool("get_runtime_info", {}));
    assert.equal(evidence.afterClose.licenseCapacity?.free, 0);
    assert.equal(evidence.afterClose.licenseCapacity?.cooling, 1);
    assert.ok(Date.parse(evidence.afterClose.licenseCapacity.retryAt) > Date.now());
    evidence.status = "PASS";
  } catch (error) {
    evidence.status = evidence.launchAttempts ? "FAIL" : "BLOCKED";
    evidence.error = safeMessage(error);
    if (app) evidence.afterFailure = runtimeSummary(await app.callTool("get_runtime_info", {}).catch(() => ({})));
  } finally {
    if (app && launched) {
      await app.callTool("close_profile", { profile_id: profile.id }).catch(error => { evidence.cleanupError = safeMessage(error); });
    }
    if (app) {
      const lines = await fs.readFile(path.join(userData, "profile-shutdown.log"), "utf8").catch(() => "");
      evidence.lifecycle = lines.trim().split(/\r?\n/).filter(Boolean).map(line => {
        const value = JSON.parse(line);
        return { timestamp: value.timestamp, reason: value.reason, exitCode: value.exitCode,
          shutdownMethod: value.shutdownMethod, method: value.method };
      });
      await app.stop().catch(error => { evidence.cleanupError = safeMessage(error); });
    }
    evidence.finishedAt = new Date().toISOString();
    if (evidence.cleanupError) evidence.status = "FAIL";
    await save();
    // This script owns only the newly-created disposable directory.
    if (!evidence.cleanupError) {
      await fs.rm(userData, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 })
        .catch(error => { evidence.cleanupError = safeMessage(error); });
    }
    await save();
    console.log(JSON.stringify(evidence, null, 2));
  }
  if (evidence.status !== "PASS") process.exitCode = 1;
}

main().catch(async error => {
  if (!evidence.attemptedAt && await fs.access(attempted).then(() => true, () => false)) {
    console.error("The one-shot engine attempt is already recorded; the existing evidence is preserved.");
    process.exitCode = 1;
    return;
  }
  evidence.status = "BLOCKED";
  evidence.error = safeMessage(error);
  await save();
  console.error(evidence.error);
  process.exitCode = 1;
});

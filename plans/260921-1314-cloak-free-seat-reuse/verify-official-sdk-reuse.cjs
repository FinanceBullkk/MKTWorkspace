const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const os = require("node:os");
const { once } = require("node:events");
const { pathToFileURL } = require("node:url");
const { createHash } = require("node:crypto");
const { observeCapacity } = require("./observe-vendor-capacity.cjs");
const { sha256, engineProcesses, closeWithDeadline, sanitizedFailure } = require("./diagnostic-runtime.cjs");
const { inspectFingerprintEnginePin } = require("../../MKTBrowser/scripts/fingerprint-engine-pin.cjs");

const dependencyRoot = path.resolve(__dirname, "../../local-test-artifacts/cloak-free-seat-260921-1314");
const runRoot = path.join(dependencyRoot, "profiles");
const receiptPath = path.join(__dirname, "official-sdk-reuse.json");
const evidence = {
  schemaVersion: 1, status: "OPEN", scope: "Official SDK, exact installed CloakBrowser, disposable profiles",
  startedAt: new Date().toISOString(), engineAttempts: 0, countRequests: 0,
  capacity: [], profiles: [], fingerprintAcceptance: "NOT-RUN", proxyAcceptance: "NOT-RUN",
};
const save = () => fs.writeFile(receiptPath, JSON.stringify(evidence, null, 2) + "\n");
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const key = process.env.CLOAKBROWSER_LICENSE_KEY?.trim();
  if (!key) throw new Error("Existing licence key is missing.");
  const sdkPackage = JSON.parse(await fs.readFile(path.join(dependencyRoot, "node_modules/cloakbrowser/package.json"), "utf8"));
  if (sdkPackage.version !== "0.5.10") throw new Error("Unexpected SDK version.");
  const { launchPersistentContext } = await import(pathToFileURL(path.join(dependencyRoot, "node_modules/cloakbrowser/dist/index.js")));
  const pin = await inspectFingerprintEnginePin({
    "engine-version": "151.0.7922.108.6",
    "engine-sha256": "5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37",
  });
  const executable = path.join(pin.sourceRoot, "runtime/chrome.exe");
  const initialProcesses = await engineProcesses(executable, runRoot);
  if (initialProcesses.length) throw new Error("An existing engine process prevents isolated verification.");
  const handle = await fs.open(receiptPath, "wx");
  await handle.close();
  evidence.engine = { version: pin.version, archiveSha256: pin.archiveSha256, executableSha256: await sha256(executable) };
  evidence.sdkVersion = sdkPackage.version;
  evidence.playwrightVersion = JSON.parse(await fs.readFile(path.join(dependencyRoot, "node_modules/playwright-core/package.json"), "utf8")).version;
  evidence.freeRamGiB = Number((os.freemem() / 2 ** 30).toFixed(2));
  evidence.initialEngineProcesses = initialProcesses;
  evidence.profileRoot = runRoot;
  process.env.CLOAKBROWSER_BINARY_PATH = executable;
  const server = http.createServer((_, response) => {
    response.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    response.end("<!doctype html><title>Disposable licence verification</title><p>Local synthetic profile test.</p>");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const url = `http://127.0.0.1:${server.address().port}/`;
  let context;
  let lastClosedAt;
  async function count(label) {
    if (++evidence.countRequests > 9) throw new Error("Capacity observation budget exhausted.");
    const observation = { label, ...await observeCapacity(key) };
    evidence.capacity.push(observation);
    await save();
    console.log(JSON.stringify({ event: "capacity", ...observation }));
    return observation;
  }
  const free = state => state.state === "ok" && state.active === 0 && state.limit === 1;
  try {
    for (const [index, label] of ["P1", "P2"].entries()) {
      const before = await count(`before-${label}`);
      if (!free(before)) throw new Error("Vendor capacity is not confirmed free with limit one.");
      if ((await engineProcesses(executable, runRoot)).length) throw new Error("An engine process remains before the next launch.");
      const profile = { label, seed: 2609211314 + index, attemptedAt: new Date().toISOString() };
      if (lastClosedAt) profile.handoffStartDelayMs = Date.parse(profile.attemptedAt) - lastClosedAt;
      await fs.writeFile(path.join(__dirname, `attempt-${label}.json`), JSON.stringify(profile) + "\n", { flag: "wx" });
      evidence.profiles.push(profile);
      evidence.engineAttempts += 1;
      await save();
      console.log(JSON.stringify({ event: "launch-attempt", label, attempt: evidence.engineAttempts }));
      context = await launchPersistentContext({
        userDataDir: path.join(runRoot, label), licenseKey: key, browserVersion: pin.version,
        releaseChannel: "stable", headless: false, humanize: false, geoip: false,
        args: [`--fingerprint=${profile.seed}`],
        launchOptions: { timeout: 30_000, handleSIGINT: false, handleSIGTERM: false, handleSIGHUP: false },
      });
      const page = context.pages()[0] || await context.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
      await pause(3000);
      const observation = await page.evaluate(label => {
        const previous = localStorage.getItem("seat-reuse-profile");
        localStorage.setItem("seat-reuse-profile", label);
        return { previous, current: localStorage.getItem("seat-reuse-profile"), userAgent: navigator.userAgent };
      }, label);
      if (observation.previous !== null || observation.current !== label) throw new Error("Disposable profile storage is not separate.");
      profile.readyAt = new Date().toISOString();
      profile.nativeUserAgentSha256 = createHash("sha256").update(observation.userAgent).digest("hex");
      profile.separateStorage = true;
      profile.activeCapacity = await count(`active-${label}`);
      if (profile.activeCapacity.state !== "ok" || profile.activeCapacity.active !== 1 || profile.activeCapacity.limit !== 1) {
        throw new Error("Active capacity does not confirm exactly one occupied seat.");
      }
      profile.closeRequestedAt = new Date().toISOString();
      await closeWithDeadline(context);
      context = null;
      lastClosedAt = Date.now();
      profile.closedAt = new Date(lastClosedAt).toISOString();
      profile.remainingProcesses = await engineProcesses(executable, runRoot);
      if (profile.remainingProcesses.length) throw new Error("Engine process survived SDK close.");
      let after = await count(`closed-${label}`);
      if (!free(after) && after.state === "ok" && after.active > 0) {
        await pause(10_000);
        after = await count(`closed-${label}-after-10s`);
      }
      if (!free(after)) throw new Error("Capacity did not return promptly after SDK close.");
      profile.vendorFreeObservedAt = after.observedAt;
      profile.vendorFreeDelayMs = Date.parse(after.observedAt) - lastClosedAt;
      await save();
    }
    evidence.status = "PASS";
  } catch (error) {
    evidence.status = evidence.engineAttempts ? "FAIL" : "BLOCKED";
    evidence.failure = sanitizedFailure(error);
  } finally {
    if (context) {
      try { await closeWithDeadline(context); } catch (error) { evidence.cleanupFailure = sanitizedFailure(error); }
    }
    evidence.finalEngineProcesses = await engineProcesses(executable, runRoot).catch(() => null);
    evidence.capacity.push({ label: "final", ...await observeCapacity(key) });
    evidence.countRequests += 1;
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    if (evidence.finalEngineProcesses === null || evidence.finalEngineProcesses.length) evidence.status = "FAIL";
    evidence.finishedAt = new Date().toISOString();
    await save();
    console.log(JSON.stringify({ status: evidence.status, engineAttempts: evidence.engineAttempts,
      failure: evidence.failure, finalEngineProcesses: evidence.finalEngineProcesses, finalCapacity: evidence.capacity.at(-1) }));
  }
  if (evidence.status !== "PASS") process.exitCode = 1;
}

main().catch(() => {
  console.error("Preparation stopped; existing receipts are preserved. No automatic retry is permitted.");
  process.exitCode = 1;
});

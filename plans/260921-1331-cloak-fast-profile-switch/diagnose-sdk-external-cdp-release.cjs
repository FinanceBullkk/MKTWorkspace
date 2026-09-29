const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { once } = require("node:events");
const { pathToFileURL } = require("node:url");
const CDP = require("../../MKTBrowser/apps/desktop/node_modules/chrome-remote-interface");
const { observeCapacity } = require("../260921-1314-cloak-free-seat-reuse/observe-vendor-capacity.cjs");
const {
  closeWithDeadline,
  engineProcesses,
  sanitizedFailure,
  sha256,
} = require("../260921-1314-cloak-free-seat-reuse/diagnostic-runtime.cjs");
const { inspectFingerprintEnginePin } = require("../../MKTBrowser/scripts/fingerprint-engine-pin.cjs");

const requestedArgs = process.argv.slice(2);
const isR12b = requestedArgs.includes("--r12b");
const isR13 = requestedArgs.includes("--r13-disable-background-networking");
const isR16 = requestedArgs.includes("--r16-minimal-admission-baseline");
const isR17 = requestedArgs.includes("--r17-stealth-args-false");
const isR18 = requestedArgs.includes("--r18-product-fingerprint-args");
const isR19 = requestedArgs.includes("--r19-product-environment");
const isR20 = requestedArgs.includes("--r20-chromium-sandbox");
const isR21 = requestedArgs.includes("--r21-ignore-default-args");
const isR22 = requestedArgs.includes("--r22-null-viewport");
const isR23 = requestedArgs.includes("--r23-network-privacy-args");
const isR24 = requestedArgs.includes("--r24-startup-language-args");
const unsupportedArgs = requestedArgs.filter(
  (arg) =>
    arg !== "--r12b" &&
    arg !== "--r13-disable-background-networking" &&
    arg !== "--r16-minimal-admission-baseline" &&
    arg !== "--r17-stealth-args-false" &&
    arg !== "--r18-product-fingerprint-args" &&
    arg !== "--r19-product-environment" &&
    arg !== "--r20-chromium-sandbox" &&
    arg !== "--r21-ignore-default-args" &&
    arg !== "--r22-null-viewport" &&
    arg !== "--r23-network-privacy-args" &&
    arg !== "--r24-startup-language-args",
);
const selectedVariants = [
  isR12b, isR13, isR16, isR17, isR18, isR19, isR20, isR21, isR22, isR23, isR24,
].filter(Boolean).length;
if (unsupportedArgs.length || selectedVariants > 1) {
  throw new Error("Unsupported diagnostic argument.");
}

const runLabel = isR24
  ? "r24-startup-language-args"
  : isR23
    ? "r23-network-privacy-args"
  : isR22
    ? "r22-null-viewport"
  : isR21
    ? "r21-ignore-default-args"
  : isR20
    ? "r20-chromium-sandbox"
  : isR19
    ? "r19-product-environment"
  : isR18
    ? "r18-product-fingerprint-args"
  : isR17
    ? "r17-stealth-args-false"
  : isR16
    ? "r16-minimal-admission-baseline"
  : isR13
    ? "r13-disable-background-networking"
    : isR12b
      ? "r12b"
      : "r12";
const dependencyRoot = path.resolve(__dirname, "../../local-test-artifacts/cloak-free-seat-260921-1314");
const runRoot = path.resolve(__dirname, `../../local-test-artifacts/cloak-sdk-external-cdp-${runLabel}`);
const receiptPath = path.join(__dirname, `260921-${runLabel}-sdk-external-cdp-release.json`);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evidence = {
  schemaVersion: 1,
  status: "OPEN",
  scope: isR24
    ? "R24 official SDK admission with the product startup and language arguments"
    : isR23
      ? "R23 official SDK admission with the product network privacy arguments"
    : isR22
      ? "R22 official SDK admission with the product null viewport"
    : isR21
      ? "R21 official SDK admission with the product ignored Playwright defaults"
    : isR20
      ? "R20 official SDK admission with the product Chromium sandbox setting"
    : isR19
      ? "R19 official SDK admission with the product Windows environment allowlist"
    : isR18
      ? "R18 official SDK admission with the product native fingerprint arguments"
    : isR17
      ? "R17 official SDK admission with only stealthArgs=false added to the R16 baseline"
    : isR16
      ? "R16 current-state official SDK admission baseline with one external CDP connection"
    : `${runLabel.toUpperCase()} official SDK with one external CDP connection left open during close`,
  hypothesis: isR24
    ? "The product startup, restore, language and window arguments cause the product-path admission refusal."
    : isR23
      ? "The remaining product network privacy arguments cause the product-path admission refusal."
    : isR22
      ? "The product null viewport causes the product-path admission refusal."
    : isR21
      ? "The product ignored Playwright defaults cause the product-path admission refusal."
    : isR20
      ? "The product Chromium sandbox setting causes the product-path admission refusal."
    : isR19
      ? "The product Windows environment allowlist causes the product-path admission refusal."
    : isR18
      ? "The product native fingerprint argument set causes the product-path admission refusal."
    : isR17
      ? "Disabling the SDK default stealth argument set causes the product-path admission refusal."
    : isR16
      ? "The current provider state admits the known-good minimal official SDK launch after stable count-only zeroes."
    : isR13
      ? "The --disable-background-networking switch prevents prompt vendor release during SDK context close."
      : "An external port CDP connection prevents prompt vendor release during SDK context close.",
  engineAttempts: 0,
  countRequests: 0,
  capacity: [],
};
const save = () => fs.writeFile(receiptPath, `${JSON.stringify(evidence, null, 2)}\n`);
const productVariantLevel = isR24 ? 8 : isR23 ? 7 : isR22 ? 6 : isR21 ? 5 : isR20 ? 4
  : isR19 ? 3 : isR18 ? 2 : isR17 ? 1 : 0;
const PRODUCT_FINGERPRINT_ARGS = [
  "--fingerprint=40942",
  "--fingerprint-platform=windows",
  "--fingerprint-locale=de-LU",
  "--fingerprint-timezone=Europe/Luxembourg",
  "--fingerprint-screen-width=1920",
  "--fingerprint-screen-height=1080",
  "--force-device-scale-factor=1",
  "--fingerprint-hardware-concurrency=32",
  "--fingerprint-device-memory=8",
  "--fingerprint-gpu-vendor=Google Inc. (NVIDIA)",
  "--fingerprint-gpu-renderer=ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 (0x00002503) Direct3D11 vs_5_0 ps_5_0, D3D11)",
  "--fingerprint-brand-version=147.0.7727.138",
  "--fingerprint-platform-version=15.0.0",
  "--fingerprint-taskbar-height=48",
  "--fingerprint-storage-quota=124615",
];
const PRODUCT_NETWORK_PRIVACY_ARGS = [
  "--disable-features=Translate,MediaRouter,DnsOverHttps,DnsOverHttpsUpgrade,EncryptedClientHello,AsyncDns,DnsHttpsSvcb,DnsHttpsSvcbAlpn,NetworkPrediction",
  "--dns-over-https-mode=off",
  "--dns-prefetch-disable",
  "--disable-async-dns",
  "--no-prerender",
  "--no-pings",
  "--disable-component-update",
  "--disable-domain-reliability",
  "--disable-client-side-phishing-detection",
];
const PRODUCT_STARTUP_LANGUAGE_ARGS = [
  "--no-first-run",
  "--no-default-browser-check",
  "--restore-last-session",
  "--lang=de-LU",
  "--accept-lang=de-LU,de,fr,en",
  "--window-size=1920,1080",
];

async function main() {
  const key = process.env.CLOAKBROWSER_LICENSE_KEY?.trim();
  if (!key) throw new Error("Existing licence key is missing.");
  const { launchPersistentContext } = await import(
    pathToFileURL(path.join(dependencyRoot, "node_modules/cloakbrowser/dist/index.js"))
  );
  const pin = await inspectFingerprintEnginePin({
    "engine-version": "151.0.7922.108.6",
    "engine-sha256": "5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37",
  });
  const executable = path.join(pin.sourceRoot, "runtime/chrome.exe");
  const initialProcesses = await engineProcesses(executable, runRoot);
  if (initialProcesses.length) throw new Error("An existing exact-engine process prevents isolation.");
  await fs.mkdir(runRoot, { recursive: false });
  const receipt = await fs.open(receiptPath, "wx");
  await receipt.close();
  evidence.engine = {
    version: pin.version,
    archiveSha256: pin.archiveSha256,
    executableSha256: await sha256(executable),
  };
  evidence.sdkVersion = JSON.parse(
    await fs.readFile(path.join(dependencyRoot, "node_modules/cloakbrowser/package.json"), "utf8"),
  ).version;
  evidence.playwrightVersion = JSON.parse(
    await fs.readFile(path.join(dependencyRoot, "node_modules/playwright-core/package.json"), "utf8"),
  ).version;
  evidence.initialEngineProcesses = initialProcesses;
  await save();

  const priorBinary = process.env.CLOAKBROWSER_BINARY_PATH;
  const hadBinary = Object.hasOwn(process.env, "CLOAKBROWSER_BINARY_PATH");
  process.env.CLOAKBROWSER_BINARY_PATH = executable;
  const server = http.createServer((_, response) => {
    response.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    response.end(`<!doctype html><title>${runLabel}</title><p>Local lifecycle diagnostic.</p>`);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const localUrl = `http://127.0.0.1:${server.address().port}/`;
  let context;
  let cdp;

  async function count(label) {
    if (++evidence.countRequests > 8) throw new Error("Capacity observation budget exhausted.");
    const observation = { label, ...(await observeCapacity(key)) };
    evidence.capacity.push(observation);
    await save();
    return observation;
  }
  const isFree = (sample) => sample.state === "ok" && sample.active === 0 && sample.limit === 1;

  try {
    const before = await count("before-launch");
    if (!isFree(before)) throw new Error("Vendor capacity is not confirmed free with limit one.");
    evidence.engineAttempts = 1;
    evidence.launchRequestedAt = new Date().toISOString();
    await save();
    context = await launchPersistentContext({
      userDataDir: runRoot,
      licenseKey: key,
      browserVersion: pin.version,
      releaseChannel: "stable",
      headless: false,
      humanize: false,
      geoip: false,
      ...(productVariantLevel >= 1 ? { stealthArgs: false } : {}),
      ...(productVariantLevel >= 6 ? { viewport: null } : {}),
      args: productVariantLevel >= 2
        ? [
            ...PRODUCT_FINGERPRINT_ARGS,
            "--remote-debugging-port=0",
            ...(productVariantLevel >= 7 ? PRODUCT_NETWORK_PRIVACY_ARGS : []),
            ...(productVariantLevel >= 8 ? PRODUCT_STARTUP_LANGUAGE_ARGS : []),
          ]
        : [
            "--fingerprint=2609211212",
            "--remote-debugging-port=0",
            ...(isR13 ? ["--disable-background-networking"] : []),
          ],
      launchOptions: {
        timeout: 30_000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
        ...(productVariantLevel >= 3
          ? { env: productWindowsEnvironment(process.env) }
          : {}),
        ...(productVariantLevel >= 4 ? { chromiumSandbox: true } : {}),
        ...(productVariantLevel >= 5
          ? { ignoreDefaultArgs: ["--enable-automation", "--enable-unsafe-swiftshader", "about:blank"] }
          : {}),
      },
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(localUrl, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const port = await waitForDevToolsPort(path.join(runRoot, "DevToolsActivePort"));
    cdp = await CDP({ host: "127.0.0.1", port });
    await cdp.Page.enable();
    evidence.externalCdpConnected = true;
    evidence.readyAt = new Date().toISOString();
    const launchRequestedAtMs = Date.parse(evidence.launchRequestedAt);
    const waitForThreeSeconds = launchRequestedAtMs + 3_000 - Date.now();
    if (waitForThreeSeconds > 0) await pause(waitForThreeSeconds);
    const active = await count("active-after-3s");
    if (active.state !== "ok" || active.active !== 1 || active.limit !== 1) {
      const error = new Error("Active capacity did not confirm one occupied seat after the minimum observation delay.");
      error.inconclusive = true;
      throw error;
    }

    evidence.validHypothesisTrial = true;
    evidence.externalCdpHeldDuringClose = true;
    evidence.closeRequestedAt = new Date().toISOString();
    const closeStarted = Date.now();
    await closeWithDeadline(context);
    context = null;
    evidence.closedAt = new Date().toISOString();
    evidence.closeDurationMs = Date.now() - closeStarted;
    evidence.remainingProcesses = await engineProcesses(executable, runRoot);
    if (evidence.remainingProcesses.length) throw new Error("Engine process survived SDK close.");

    const closedAtMs = Date.parse(evidence.closedAt);
    for (const targetDelayMs of [0, 2_000, 5_000, 10_000]) {
      const remaining = closedAtMs + targetDelayMs - Date.now();
      if (remaining > 0) await pause(remaining);
      const sample = await count(`after-close-${targetDelayMs}ms`);
      if (isFree(sample)) {
        evidence.vendorFreeDelayMs = Date.parse(sample.observedAt) - closedAtMs;
        break;
      }
    }
    evidence.status = Number.isFinite(evidence.vendorFreeDelayMs) && evidence.vendorFreeDelayMs <= 10_000
      ? "PASS"
      : "FAIL";
  } catch (error) {
    evidence.status = error?.inconclusive ? "INCONCLUSIVE" : evidence.engineAttempts ? "FAIL" : "BLOCKED";
    evidence.failure = sanitizedFailure(error);
  } finally {
    if (context) await closeWithDeadline(context).catch(() => undefined);
    if (cdp) await cdp.close().catch(() => undefined);
    evidence.finalEngineProcesses = await engineProcesses(executable, runRoot).catch(() => null);
    evidence.finalCapacity = await count("final").catch(() => null);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    if (hadBinary) process.env.CLOAKBROWSER_BINARY_PATH = priorBinary;
    else delete process.env.CLOAKBROWSER_BINARY_PATH;
    evidence.finishedAt = new Date().toISOString();
    await save();
  }
  if (evidence.status !== "PASS") process.exitCode = 1;
}

async function waitForDevToolsPort(file) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const [line] = (await fs.readFile(file, "utf8")).split(/\r?\n/);
      const port = Number(line);
      if (Number.isInteger(port) && port > 0 && port < 65_536) return port;
    } catch {}
    await pause(100);
  }
  throw new Error("DevTools port was not published in time.");
}

function productWindowsEnvironment(source) {
  const keys = [
    "PATH", "SystemRoot", "windir", "SystemDrive", "ComSpec", "PATHEXT", "TEMP", "TMP",
    "USERPROFILE", "HOMEDRIVE", "HOMEPATH", "USERNAME", "APPDATA", "LOCALAPPDATA",
    "ProgramData", "ProgramFiles", "ProgramFiles(x86)", "CommonProgramFiles",
    "CommonProgramFiles(x86)", "PUBLIC", "OS", "NUMBER_OF_PROCESSORS",
    "PROCESSOR_ARCHITECTURE", "PROCESSOR_IDENTIFIER", "PSModulePath",
  ];
  const values = new Map(
    Object.entries(source).map(([key, value]) => [key.toLocaleLowerCase("en-US"), value]),
  );
  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = values.get(key.toLocaleLowerCase("en-US"));
      return value === undefined ? [] : [[key, value]];
    }),
  );
}

main().catch(() => {
  console.error("R12 preparation failed; no automatic retry is permitted.");
  process.exitCode = 1;
});

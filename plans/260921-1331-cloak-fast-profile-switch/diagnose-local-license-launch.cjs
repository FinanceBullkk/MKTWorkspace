#!/usr/bin/env node

"use strict";

const assert = require("node:assert/strict");
const { spawn, execFile } = require("node:child_process");
const { createHash, randomUUID } = require("node:crypto");
const { once } = require("node:events");
const http = require("node:http");
const { createRequire } = require("node:module");
const os = require("node:os");
const path = require("node:path");
const { mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(__dirname, "../../MKTBrowser");
const dependencyRoot = path.resolve(
  __dirname,
  "../../local-test-artifacts/cloak-free-seat-260921-1314",
);
const receiptPath = path.join(__dirname, "local-license-launch-comparison-r2.json");
const desktopRequire = createRequire(path.resolve(repositoryRoot, "apps/desktop/package.json"));
const MAX_LOCAL_LAUNCHES = 4;
const SYNTHETIC_KEY = `cb_local_only_${randomUUID().replaceAll("-", "")}`;
const CURRENT_DISABLED_FEATURES = [
  "Translate",
  "MediaRouter",
  "DnsOverHttps",
  "DnsOverHttpsUpgrade",
  "EncryptedClientHello",
  "AsyncDns",
  "DnsHttpsSvcb",
  "DnsHttpsSvcbAlpn",
  "NetworkPrediction",
];

const receipt = {
  schemaVersion: 2,
  status: "prepared",
  scope: "Loopback-only licence simulator; synthetic key; no vendor requests",
  supersedesDiagnosticReceipt: "local-license-launch-comparison.json",
  preparedAt: new Date().toISOString(),
  launchBudget: MAX_LOCAL_LAUNCHES,
  launchesUsed: 0,
  modes: [],
};

async function main() {
  if (process.platform !== "win32") throw new Error("This diagnostic requires Windows.");
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
    flush: true,
  });

  const { inspectFingerprintEnginePin } = require(path.join(
    repositoryRoot,
    "scripts/fingerprint-engine-pin.cjs",
  ));
  const pin = await inspectFingerprintEnginePin({
    "engine-version": "151.0.7922.108.6",
    "engine-sha256": "5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37",
  });
  const executable = path.join(pin.sourceRoot, "runtime", "chrome.exe");
  receipt.engine = {
    version: pin.version,
    executableSha256: await sha256File(executable),
  };
  receipt.status = "running";
  await save();

  const modes = [
    { name: "product-exact-observed", kind: "direct", launchModel: "product" },
    {
      name: "product-plus-system-drive",
      kind: "direct",
      launchModel: "product",
      addSystemDrive: true,
    },
    { name: "historical-working-direct", kind: "direct", launchModel: "historical" },
    { name: "official-sdk", kind: "sdk" },
  ];

  for (const mode of modes) {
    assert.ok(receipt.launchesUsed < receipt.launchBudget, "Local launch budget exhausted.");
    const result = await runMode(mode, executable);
    receipt.launchesUsed += 1;
    receipt.modes.push(result);
    await save();
    if (!result.cleanupComplete) throw new Error(`${mode.name} cleanup failed.`);
  }

  const failedModes = receipt.modes.filter((mode) => !mode.passed).map((mode) => mode.mode);
  receipt.status = failedModes.length === 0 ? "passed" : "failed";
  if (failedModes.length > 0) receipt.failedModes = failedModes;
  receipt.completedAt = new Date().toISOString();
  await save();
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (failedModes.length > 0) process.exitCode = 1;
}

async function runMode(mode, executable) {
  const root = await mkdtemp(path.join(os.tmpdir(), `cloak-local-${mode.name}-`));
  const profileDir = path.join(root, "profile");
  const statusFile = path.join(root, "license-status.txt");
  const simulator = await startLicenceSimulator(mode.name);
  let child = null;
  let context = null;
  let directLaunch = null;
  let cleanupComplete = false;
  let failure = null;
  let finalRemaining = null;
  let licenseStatusCode = null;
  const startedAt = new Date().toISOString();
  try {
    if (mode.kind === "sdk") {
      context = await launchWithSdk({
        executable,
        profileDir,
        apiBase: simulator.origin,
        statusFile,
      });
      await waitFor(() => simulator.events.some((event) => event.path.endsWith("/start")), 10_000);
      await context.close();
      context = null;
    } else {
      directLaunch = await launchDirect({
        executable,
        profileDir,
        apiBase: simulator.origin,
        statusFile,
        mode,
      });
      child = directLaunch.child;
      const port = await directLaunch.waitUntilReady();
      await waitFor(() => simulator.events.some((event) => event.path.endsWith("/start")), 10_000);
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      if (child.exitCode !== null) {
        throw new Error(`Direct engine exited with code ${child.exitCode} after licence start.`);
      }
      await closeDirectBrowser(port);
    }
    await waitFor(() => simulator.events.some((event) => event.path.endsWith("/end")), 10_000);
    await waitForNoOwnedProcesses(profileDir, 10_000);
  } catch (error) {
    failure = sanitizeFailure(error);
  } finally {
    if (context) await context.close().catch(() => undefined);
    if (child?.pid) await terminateOwnedProcesses(profileDir).catch(() => undefined);
    await simulator.close();
    const remaining = await ownedProcesses(profileDir).catch(() => null);
    if (remaining && remaining.length > 0) {
      await terminateOwnedProcesses(profileDir).catch(() => undefined);
    }
    finalRemaining = await ownedProcesses(profileDir).catch(() => null);
    cleanupComplete = Array.isArray(finalRemaining) && finalRemaining.length === 0;
    licenseStatusCode = await readLicenseStatus(statusFile);
    if (cleanupComplete) await rm(root, { recursive: true, force: true });
  }

  const starts = simulator.events.filter((event) => event.path.endsWith("/start"));
  const heartbeats = simulator.events.filter((event) => event.path.endsWith("/heartbeat"));
  const ends = simulator.events.filter((event) => event.path.endsWith("/end"));
  const invariantFailures = [];
  if (failure) invariantFailures.push("launch-or-close-failed");
  if (starts.length !== 1) invariantFailures.push(`expected-one-start-got-${starts.length}`);
  if (ends.length !== 1) invariantFailures.push(`expected-one-end-got-${ends.length}`);
  if (!cleanupComplete) invariantFailures.push("owned-process-remained");
  if (simulator.unexpectedRequests.length > 0) invariantFailures.push("unexpected-local-route");
  return {
    mode: mode.name,
    launchModel: mode.launchModel ?? "sdk",
    startedAt,
    completedAt: new Date().toISOString(),
    requestCounts: { start: starts.length, heartbeat: heartbeats.length, end: ends.length },
    startInstances: starts.map((event) => event.instanceDigest),
    installIdentities: [...new Set(starts.map((event) => event.installDigest))],
    requestFields: [...new Set(simulator.events.flatMap((event) => event.fields))].sort(),
    unexpectedRequests: simulator.unexpectedRequests,
    cleanupComplete,
    finalOwnedProcessCount: Array.isArray(finalRemaining) ? finalRemaining.length : null,
    childExitCode: child?.exitCode ?? null,
    licenseStatusCode,
    stderr: directLaunch?.readStderr() ?? null,
    failure,
    invariantFailures,
    passed: invariantFailures.length === 0,
  };
}

async function startLicenceSimulator(label) {
  const events = [];
  const unexpectedRequests = [];
  const leaseByInstance = new Map();
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const allowed = new Set([
      "/api/license/session/start",
      "/api/license/session/heartbeat",
      "/api/license/session/end",
    ]);
    if (request.method !== "POST" || !allowed.has(pathname)) {
      unexpectedRequests.push({ method: request.method ?? null, path: pathname });
      response.writeHead(404, { "content-type": "application/json" });
      response.end('{"error":"local_route_refused"}');
      return;
    }
    const body = await readJsonBody(request, 16 * 1024);
    assert.equal(body.license_key, SYNTHETIC_KEY, "The simulator received a non-synthetic key.");
    const event = {
      path: pathname,
      fields: Object.keys(body).sort(),
      installDigest: digest(body.install_id),
      instanceDigest: digest(body.instance_id),
      observedAt: new Date().toISOString(),
    };
    events.push(event);

    if (pathname.endsWith("/start")) {
      const leaseId = randomUUID();
      leaseByInstance.set(body.instance_id, leaseId);
      respondJson(response, 200, {
        valid: true,
        plan: "free",
        limit: 1,
        lease_id: leaseId,
        expires_at: new Date(Date.now() + 900_000).toISOString(),
        heartbeat_interval_seconds: 300,
        lease_ttl_seconds: 900,
      });
      return;
    }
    if (pathname.endsWith("/heartbeat")) {
      respondJson(response, 200, { ok: true });
      return;
    }
    const expectedLease = leaseByInstance.get(body.instance_id);
    respondJson(response, expectedLease === body.lease_id ? 200 : 422, {
      ok: expectedLease === body.lease_id,
    });
  });
  server.on("clientError", (error, socket) => {
    socket.destroy(error);
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  return {
    label,
    events,
    unexpectedRequests,
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => {
      server.closeAllConnections?.();
      server.close(() => resolve());
    }),
  };
}

async function launchDirect({ executable, profileDir, apiBase, statusFile, mode }) {
  const fixedPort = mode.launchModel === "historical" ? await availableLoopbackPort() : null;
  const args = directArguments(mode.launchModel, profileDir, fixedPort);
  const env = mode.launchModel === "historical"
    ? historicalWorkingEnvironment()
    : minimalProductEnvironment();
  if (mode.addSystemDrive && process.env.SystemDrive !== undefined) {
    env.SystemDrive = process.env.SystemDrive;
  }
  env.CLOAKBROWSER_LICENSE_KEY = SYNTHETIC_KEY;
  env.CLOAKBROWSER_LICENSE_API = apiBase;
  env.CLOAKBROWSER_LICENSE_STATUS_FILE = statusFile;
  const stderr = boundedTextCollector(4096);
  const child = spawn(executable, args, {
    detached: false,
    stdio: ["ignore", "ignore", "pipe"],
    env,
    windowsHide: true,
    ...(mode.launchModel === "historical" ? { cwd: path.dirname(executable) } : {}),
  });
  await once(child, "spawn");
  child.stderr.on("data", stderr.append);
  return {
    child,
    readStderr: stderr.read,
    waitUntilReady: async () => {
      if (fixedPort !== null) {
        await waitForCdpEndpoint(fixedPort, 20_000, child);
        return fixedPort;
      }
      return waitForDevToolsPort(profileDir, 20_000, child);
    },
  };
}

function directArguments(launchModel, profileDir, fixedPort) {
  if (launchModel === "historical") {
    return [
      "--no-first-run",
      "--no-default-browser-check",
      "--lang=en-US",
      "--accept-lang=en-US,en",
      "--window-size=1366,768",
      "--fingerprint=2609211314",
      "--fingerprint-platform=windows",
      "--fingerprint-locale=en-US",
      "--fingerprint-timezone=America/New_York",
      "--fingerprint-screen-width=1366",
      "--fingerprint-screen-height=768",
      "--fingerprint-hardware-concurrency=8",
      "--fingerprint-device-memory=8",
      "--fingerprint-taskbar-height=48",
      `--user-data-dir=${profileDir}`,
      `--remote-debugging-port=${fixedPort}`,
      "about:blank",
    ];
  }
  return [
    `--user-data-dir=${profileDir}`,
    "--remote-debugging-port=0",
    "--no-first-run",
    "--no-default-browser-check",
    "--restore-last-session",
    `--disable-features=${CURRENT_DISABLED_FEATURES.join(",")}`,
    "--lang=en-US",
    "--accept-lang=en-US,en",
    "--window-size=1280,720",
    "--fingerprint=2609211314",
    "--fingerprint-platform=windows",
    "--fingerprint-locale=en-US",
    "--fingerprint-timezone=Asia/Saigon",
    "--fingerprint-screen-width=1280",
    "--fingerprint-screen-height=720",
    "--force-device-scale-factor=1",
    "--fingerprint-hardware-concurrency=4",
    "--fingerprint-device-memory=8",
    "--fingerprint-taskbar-height=48",
    "--fingerprint-storage-quota=8192",
    "--dns-over-https-mode=off",
    "--dns-prefetch-disable",
    "--disable-async-dns",
    "--no-prerender",
    "--no-pings",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-domain-reliability",
    "--disable-client-side-phishing-detection",
    "about:blank",
  ];
}

async function launchWithSdk({ executable, profileDir, apiBase, statusFile }) {
  const previousBinary = process.env.CLOAKBROWSER_BINARY_PATH;
  const previousApi = process.env.CLOAKBROWSER_LICENSE_API;
  const previousKey = process.env.CLOAKBROWSER_LICENSE_KEY;
  const previousStatusFile = process.env.CLOAKBROWSER_LICENSE_STATUS_FILE;
  process.env.CLOAKBROWSER_BINARY_PATH = executable;
  process.env.CLOAKBROWSER_LICENSE_API = apiBase;
  process.env.CLOAKBROWSER_LICENSE_KEY = SYNTHETIC_KEY;
  process.env.CLOAKBROWSER_LICENSE_STATUS_FILE = statusFile;
  try {
    const { pathToFileURL } = require("node:url");
    const sdk = await import(pathToFileURL(path.join(dependencyRoot, "node_modules/cloakbrowser/dist/index.js")));
    return await sdk.launchPersistentContext({
      userDataDir: profileDir,
      licenseKey: SYNTHETIC_KEY,
      browserVersion: "151.0.7922.108.6",
      releaseChannel: "stable",
      headless: false,
      humanize: false,
      geoip: false,
      args: ["--fingerprint=2609211314"],
      launchOptions: {
        timeout: 30_000,
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
      },
    });
  } finally {
    restoreEnv("CLOAKBROWSER_BINARY_PATH", previousBinary);
    restoreEnv("CLOAKBROWSER_LICENSE_API", previousApi);
    restoreEnv("CLOAKBROWSER_LICENSE_KEY", previousKey);
    restoreEnv("CLOAKBROWSER_LICENSE_STATUS_FILE", previousStatusFile);
  }
}

async function closeDirectBrowser(port) {
  const CDP = desktopRequire("chrome-remote-interface");
  const client = await CDP({ host: "127.0.0.1", port });
  try {
    await client.Browser.close().catch(() => undefined);
  } finally {
    await client.close().catch(() => undefined);
  }
}

function minimalProductEnvironment() {
  const env = {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    USER: process.env.USER ?? "",
    LOGNAME: process.env.LOGNAME ?? process.env.USER ?? "",
    SHELL: process.env.SHELL ?? "",
    LANG: process.env.LANG ?? "en_US.UTF-8",
    LC_ALL: process.env.LC_ALL ?? "",
    TMPDIR: process.env.TMPDIR ?? "",
    DYLD_FALLBACK_FRAMEWORK_PATH: process.env.DYLD_FALLBACK_FRAMEWORK_PATH ?? "",
  };
  for (const name of ["USERPROFILE", "APPDATA", "LOCALAPPDATA", "SystemRoot", "windir"]) {
    if (process.env[name] !== undefined) env[name] = process.env[name];
  }
  return env;
}

function historicalWorkingEnvironment() {
  const env = {};
  for (const name of [
    "PATH",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "SystemRoot",
    "windir",
    "SystemDrive",
  ]) {
    env[name] = process.env[name] ?? "";
  }
  return env;
}

async function waitForDevToolsPort(profileDir, timeoutMs, child) {
  let observedPort = null;
  await waitFor(async () => {
    if (child.exitCode !== null) throw new Error(`Direct engine exited with code ${child.exitCode}.`);
    try {
      observedPort = await readDevToolsPort(profileDir);
      return Number.isSafeInteger(observedPort);
    } catch {
      return false;
    }
  }, timeoutMs);
  return observedPort;
}

async function waitForCdpEndpoint(port, timeoutMs, child) {
  await waitFor(async () => {
    if (child.exitCode !== null) throw new Error(`Direct engine exited with code ${child.exitCode}.`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      return response.ok;
    } catch {
      return false;
    }
  }, timeoutMs);
}

async function availableLoopbackPort() {
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const port = address.port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function readDevToolsPort(profileDir) {
  const text = await readFile(path.join(profileDir, "DevToolsActivePort"), "utf8");
  const port = Number(text.split(/\r?\n/, 1)[0]);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid DevToolsActivePort record.");
  }
  return port;
}

async function waitForNoOwnedProcesses(profileDir, timeoutMs) {
  await waitFor(async () => (await ownedProcesses(profileDir)).length === 0, timeoutMs);
}

async function ownedProcesses(profileDir) {
  const command =
    "$needle=$env:MKT_LOCAL_PROFILE; " +
    "$rows=@(Get-CimInstance Win32_Process -ErrorAction Stop | " +
    "Where-Object { $_.CommandLine -and $_.CommandLine.Contains($needle) } | " +
    "ForEach-Object { [pscustomobject]@{pid=$_.ProcessId;parentPid=$_.ParentProcessId} }); " +
    "ConvertTo-Json -InputObject $rows -Compress";
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", command],
    {
      encoding: "utf8",
      timeout: 10_000,
      windowsHide: true,
      env: { ...process.env, MKT_LOCAL_PROFILE: profileDir },
    },
  );
  const rows = JSON.parse(stdout.trim() || "[]");
  return Array.isArray(rows) ? rows : [rows];
}

async function terminateOwnedProcesses(profileDir) {
  const rows = await ownedProcesses(profileDir);
  for (const row of rows) {
    try {
      process.kill(row.pid, "SIGKILL");
    } catch {
      // The process may have exited between enumeration and termination.
    }
  }
  await waitForNoOwnedProcesses(profileDir, 5_000);
}

async function readJsonBody(request, maximumBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maximumBytes) throw new Error("Licence request exceeded the local size limit.");
    chunks.push(chunk);
  }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  return value;
}

function respondJson(response, status, value) {
  response.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store",
    connection: "close",
  });
  response.end(JSON.stringify(value));
}

async function waitFor(check, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out after ${timeoutMs} ms.`);
}

async function sha256File(file) {
  const data = await readFile(file);
  return createHash("sha256").update(data).digest("hex");
}

async function readLicenseStatus(file) {
  try {
    const value = (await readFile(file, "utf8")).trim();
    return /^\d+$/.test(value) ? Number(value) : null;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function boundedTextCollector(maximumBytes) {
  let value = "";
  return {
    append(chunk) {
      if (value.length >= maximumBytes) return;
      value += chunk.toString("utf8", 0, maximumBytes - value.length);
    },
    read() {
      return sanitizeDiagnosticText(value);
    },
  };
}

function sanitizeDiagnosticText(value) {
  if (!value) return null;
  return value
    .replaceAll(SYNTHETIC_KEY, "<synthetic-key>")
    .replace(/https?:\/\/\S+/g, "<url>")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 4096) || null;
}

function digest(value) {
  return typeof value === "string" && value
    ? createHash("sha256").update(value).digest("hex").slice(0, 16)
    : null;
}

function sanitizeFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    type: error instanceof Error ? error.name : "Error",
    reason: message.replace(/https?:\/\/\S+/g, "<local-url>").slice(0, 240),
  };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function save() {
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flush: true,
  });
}

main().catch(async (error) => {
  receipt.status = "failed";
  receipt.failure = sanitizeFailure(error);
  receipt.completedAt = new Date().toISOString();
  await save().catch(() => undefined);
  process.stderr.write(`${receipt.failure.reason}\n`);
  process.exitCode = 1;
});

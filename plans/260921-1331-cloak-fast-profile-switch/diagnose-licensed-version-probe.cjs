const fs = require("node:fs/promises");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const {
  observeCapacity,
} = require("../260921-1314-cloak-free-seat-reuse/observe-vendor-capacity.cjs");
const {
  engineProcesses,
  sha256,
} = require("../260921-1314-cloak-free-seat-reuse/diagnostic-runtime.cjs");
const {
  inspectFingerprintEnginePin,
} = require("../../MKTBrowser/scripts/fingerprint-engine-pin.cjs");

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const output = outputPath(process.argv.slice(2));
  const key = process.env.CLOAKBROWSER_LICENSE_KEY?.trim();
  if (!key) throw new Error("Existing licence key is missing.");
  const pin = await inspectFingerprintEnginePin({
    "engine-version": "151.0.7922.108.6",
    "engine-sha256": "5bd3951f470fff79998a437a139e3e8d68478bc2663402aca1666faf4eadac37",
  });
  const executable = path.join(pin.sourceRoot, "runtime", "chrome.exe");
  const receipt = {
    schemaVersion: 1,
    scope: "R26 licensed binary --version probe isolation",
    status: "running",
    profileLaunches: 0,
    versionProbeExecutions: 0,
    engine: {
      version: pin.version,
      archiveSha256: pin.archiveSha256,
      runtimeSha256: await sha256(executable),
    },
    capacity: [],
  };
  const handle = await fs.open(output, "wx");
  await handle.close();
  const save = () => fs.writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`);
  await save();

  const initialProcesses = await engineProcesses(executable, path.dirname(output));
  receipt.initialExactEngineProcesses = initialProcesses.length;
  if (initialProcesses.length) throw new Error("An existing exact-engine process prevents isolation.");
  const before = await observeCapacity(key);
  receipt.capacity.push({ label: "before-version-probe", ...before });
  if (before.state !== "ok" || before.active !== 0 || before.limit !== 1) {
    receipt.status = "blocked";
    await save();
    throw new Error("Vendor capacity is not confirmed free with limit one.");
  }

  receipt.versionProbeExecutions = 1;
  receipt.probeRequestedAt = new Date().toISOString();
  await save();
  const startedAtMs = Date.now();
  const child = spawn(executable, ["--version"], {
    env: process.env,
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });
  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout = (stdout + chunk.toString("utf8")).slice(-4096);
  });
  const timeout = setTimeout(() => child.kill(), 10_000);
  const [exitCode, signal] = await once(child, "exit");
  clearTimeout(timeout);
  receipt.probeCompletedAt = new Date().toISOString();
  receipt.probeDurationMs = Date.now() - startedAtMs;
  receipt.probeExitCode = Number.isInteger(exitCode) ? exitCode : null;
  receipt.probeSignalled = typeof signal === "string";
  receipt.reportedVersion = stdout.match(/(\d+\.\d+\.\d+\.\d+(?:\.\d+)?)/)?.[1] ?? null;
  receipt.remainingExactEngineProcesses = (
    await engineProcesses(executable, path.dirname(output))
  ).length;
  await save();

  const completedAtMs = Date.parse(receipt.probeCompletedAt);
  for (const delayMs of [0, 2_000, 5_000, 10_000, 30_000, 60_000]) {
    const remaining = completedAtMs + delayMs - Date.now();
    if (remaining > 0) await pause(remaining);
    receipt.capacity.push({ label: `after-version-probe-${delayMs}ms`, ...(await observeCapacity(key)) });
    await save();
  }
  const occupied = receipt.capacity.some(
    (sample) => sample.label.startsWith("after-version-probe-") && sample.state === "ok" && sample.active === 1,
  );
  receipt.status = occupied ? "hypothesis-confirmed" : "not-reproduced";
  receipt.completedAt = new Date().toISOString();
  await save();
}

function outputPath(args) {
  if (args.length !== 2 || args[0] !== "--output" || !args[1]) {
    throw new Error("Pass --output <new-receipt-path>.");
  }
  return path.resolve(args[1]);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Version-probe diagnostic failed.");
  process.exitCode = 1;
});

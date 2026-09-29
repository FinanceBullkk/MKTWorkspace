const fs = require("node:fs/promises");
const path = require("node:path");
const {
  observeCapacity,
} = require("../260921-1314-cloak-free-seat-reuse/observe-vendor-capacity.cjs");

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const key = process.env.CLOAKBROWSER_LICENSE_KEY?.trim();
  if (!key) throw new Error("Existing licence key is missing.");

  const output = path.resolve(options.output);
  const receipt = {
    schemaVersion: 1,
    scope: options.scope,
    engineLaunches: 0,
    status: "running",
    requiredConsecutiveReady: options.required,
    samples: [],
  };
  const handle = await fs.open(output, "wx");
  await handle.close();
  const save = () => fs.writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`);
  await save();

  let consecutiveReady = 0;
  for (let sample = 1; sample <= options.maximum; sample += 1) {
    const requestedAt = new Date().toISOString();
    const observed = await observeCapacity(key);
    const ready = observed.state === "ok" && observed.active === 0 && observed.limit === 1;
    consecutiveReady = ready ? consecutiveReady + 1 : 0;
    receipt.samples.push({
      sample,
      requestedAt,
      completedAt: new Date().toISOString(),
      observedAt: observed.observedAt,
      active: observed.active,
      limit: observed.limit,
      state: ready ? "available" : observed.state,
      reason: ready ? "CAPACITY_AVAILABLE" : capacityReason(observed),
      consecutiveReady,
    });
    await save();
    if (consecutiveReady >= options.required) {
      receipt.status = "passed";
      await save();
      return;
    }
    if (sample < options.maximum) await pause(options.intervalMs);
  }

  receipt.status = "failed";
  await save();
  process.exitCode = 1;
}

function capacityReason(observation) {
  if (observation.state === "ok" && observation.active > 0) return "CAPACITY_OCCUPIED";
  if (observation.state === "denied") return "ACCESS_DENIED";
  if (observation.state === "rate_limited") return "RATE_LIMITED";
  if (observation.state === "unreachable") return "UNREACHABLE";
  return "CAPACITY_UNCONFIRMED";
}

function parseArgs(args) {
  const options = {
    output: null,
    scope: "Stable-free count-only preflight",
    required: 3,
    maximum: 6,
    intervalMs: 30_000,
  };
  for (let index = 0; index < args.length; index += 1) {
    const name = args[index];
    const value = args[index + 1];
    if (!value) throw new Error(`Missing value for ${name}.`);
    if (name === "--output") options.output = value;
    else if (name === "--scope") options.scope = value;
    else if (name === "--required") options.required = positiveInteger(value, name);
    else if (name === "--maximum") options.maximum = positiveInteger(value, name);
    else if (name === "--interval-ms") options.intervalMs = positiveInteger(value, name);
    else throw new Error(`Unsupported argument: ${name}`);
    index += 1;
  }
  if (!options.output) throw new Error("Pass --output <new-receipt-path>.");
  if (options.maximum < options.required) throw new Error("Maximum samples must cover the required consecutive samples.");
  return options;
}

function positiveInteger(value, name) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Stable-free preflight failed.");
  process.exitCode = 1;
});

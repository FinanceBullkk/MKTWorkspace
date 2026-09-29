const fs = require("node:fs/promises");
const path = require("node:path");

const endpoint = "https://cloakbrowser.dev/api/license/session/count";
const knownReasons = new Set(["invalid_key", "license_inactive", "rate_limited"]);

async function observeCapacity(key) {
  const observedAt = new Date().toISOString();
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key }),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { observedAt, state: "unreachable", active: null, limit: null };
  }
  const data = await response.json().catch(() => null);
  const base = { observedAt, httpStatus: response.status, active: null, limit: null };
  if (!response.ok) {
    return { ...base, state: "denied", reason: knownReasons.has(data?.error) ? data.error : "http-error" };
  }
  if (!Number.isSafeInteger(data?.active) || data.active < 0) {
    return { ...base, state: "unknown" };
  }
  return {
    ...base,
    state: "ok",
    active: data.active,
    limit: Number.isSafeInteger(data.limit) && data.limit > 0 ? data.limit : null,
  };
}

module.exports = { observeCapacity };

if (require.main === module) {
  (async () => {
    const key = process.env.CLOAKBROWSER_LICENSE_KEY?.trim();
    if (!key) throw new Error("The existing licence key is absent; no request made.");
    const destination = path.join(__dirname, "capacity-preflight.json");
    const output = await fs.open(destination, "wx");
    try {
      const result = await observeCapacity(key);
      await output.writeFile(JSON.stringify({ schemaVersion: 1, endpoint, engineLaunches: 0, ...result }, null, 2) + "\n");
      console.log(JSON.stringify(result));
    } finally {
      await output.close();
    }
  })().catch(() => {
    console.error("Capacity observation could not complete; no engine was launched.");
    process.exitCode = 1;
  });
}

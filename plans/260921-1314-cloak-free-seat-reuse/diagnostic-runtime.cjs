const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createReadStream } = require("node:fs");
const { createHash } = require("node:crypto");
const run = promisify(execFile);

async function sha256(file) {
  const digest = createHash("sha256");
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest("hex");
}

async function engineProcesses(executable, ownedRoot) {
  const quote = value => `'${value.replaceAll("'", "''")}'`;
  const command = `$rows = @(Get-CimInstance Win32_Process -ErrorAction Stop | ` +
    `Where-Object { $_.ExecutablePath -eq ${quote(executable)} } | ForEach-Object { ` +
    `[pscustomobject]@{ pid=$_.ProcessId; parentPid=$_.ParentProcessId; ` +
    `owned=($_.CommandLine -and $_.CommandLine.Contains(${quote(ownedRoot)})) } }); ` +
    `ConvertTo-Json -InputObject $rows -Compress`;
  const { stdout } = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(command, "utf16le").toString("base64")], { windowsHide: true, timeout: 15_000 });
  const rows = JSON.parse(stdout.trim() || "[]");
  if (!Array.isArray(rows)) throw new Error("Process enumeration was not an array.");
  return rows;
}

async function closeWithDeadline(context) {
  let timer;
  try {
    await Promise.race([
      context.close(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("SDK close timed out.")), 30_000); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

function sanitizedFailure(error) {
  const text = String(error?.message ?? "");
  const exit = text.match(/exitCode[=:]\s*(\d+)/i);
  const seatRefused = /session limit|session_limit|exitCode[=:]\s*76/i.test(text);
  return {
    type: typeof error?.name === "string" ? error.name.slice(0, 80) : "Error",
    seatRefused,
    exitCode: seatRefused ? 76 : exit ? Number(exit[1]) : null,
    reason: seatRefused ? "Vendor session limit refused the engine; stop without retry."
      : /close timed out/i.test(text) ? "SDK close exceeded 30 seconds."
      : /capacity/i.test(text) ? "Fresh vendor capacity does not permit the next launch."
      : /process/i.test(text) ? "Engine process ownership or termination check failed."
      : "Diagnostic step failed; raw framework errors were not retained to avoid credential leakage.",
  };
}

module.exports = { sha256, engineProcesses, closeWithDeadline, sanitizedFailure };

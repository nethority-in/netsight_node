#!/usr/bin/env node
import { execSync } from "node:child_process";

const port = process.argv[2];
if (!port) {
  console.log("[predev] No port provided, skipping cleanup.");
  process.exit(0);
}

function run(command) {
  return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString();
}

try {
  if (process.platform === "win32") {
    const output = run(`netstat -ano | findstr :${port}`);
    const pids = new Set();

    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^[0-9]+$/.test(pid)) pids.add(pid);
      });

    if (pids.size === 0) {
      console.log(`[predev] Port ${port} is free.`);
      process.exit(0);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[predev] Killed PID ${pid} on port ${port}.`);
      } catch {
        // Ignore failures for already-dead/non-owned processes.
      }
    }
    process.exit(0);
  }

  // Unix-like fallback
  try {
    execSync(`lsof -ti tcp:${port} | xargs kill -9`, { stdio: "ignore" });
    console.log(`[predev] Killed process(es) on port ${port}.`);
  } catch {
    console.log(`[predev] Port ${port} is free.`);
  }
} catch {
  console.log(`[predev] Port cleanup skipped for ${port}.`);
}

import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

function findChrome() {
  if (process.env.CHROME_PATH) return;
  if (process.env.LIGHTHOUSE_CHROMIUM_PATH) return;

  const isWin = process.platform === "win32";
  const home = isWin ? (process.env.USERPROFILE ?? homedir()) : homedir();

  const candidates = isWin
    ? [
        `${home}\\scoop\\shims\\chromium.exe`,
        `${home}\\scoop\\shims\\chrome.exe`,
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      ]
    : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      process.env.CHROME_PATH = candidate;
      return;
    }
  }

  const whichCmd = isWin ? "where" : "which";
  for (const bin of ["chromium", "chrome", "google-chrome"]) {
    try {
      const result = execSync(`${whichCmd} ${bin}`, { encoding: "utf-8" });
      const path = result.trim().split("\n")[0].trim();
      if (path) {
        process.env.CHROME_PATH = path;
        return;
      }
    } catch {}
  }
}

findChrome();

const flagIndex = process.argv.indexOf("--ci");
const isCI = flagIndex !== -1;
if (isCI) process.argv.splice(flagIndex, 1);
process.env.LHCI_MODE = isCI ? "ci" : "fast";

const lhciArgs = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ["autorun"];

const result = spawnSync("pnpm", ["exec", "lhci", ...lhciArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --no-deprecation`,
  },
  shell: true,
});

process.exit(result.status ?? 1);

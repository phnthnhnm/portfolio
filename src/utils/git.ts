import { execSync } from "node:child_process";

/**
 * Returns the ISO date string of the last commit that touched the given file.
 * Returns `undefined` if git is unavailable or the file has no commits.
 *
 * Intended for build-time use only — the date is embedded into static HTML.
 */
export function getGitLastModified(filePath: string): string | undefined {
  try {
    const result = execSync(
      `git log -1 --format=%cI -- ${filePath}`,
      { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    return result || undefined;
  } catch {
    return undefined;
  }
}

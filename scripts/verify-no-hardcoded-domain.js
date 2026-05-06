#!/usr/bin/env node
/**
 * Verify that the production domain is not hardcoded in TypeScript source files.
 * Allowed locations: .env*, README, src/lib/site.ts
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const PRODUCTION_DOMAIN = "randomkey.online";
const ALLOWED_FILES = [
  "src/lib/site.ts",
  "README.md",
  "README",
];

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") {
      continue;
    }
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else if (
      entry.name.endsWith(".ts") ||
      entry.name.endsWith(".tsx") ||
      entry.name.endsWith(".js") ||
      entry.name.endsWith(".jsx")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

const allFiles = await getFiles("src");
let violations = 0;

for (const file of allFiles) {
  // Normalize to relative for comparison
  const relFile = file.startsWith("src/") ? file : file;
  if (ALLOWED_FILES.some((allowed) => relFile.endsWith(allowed.replace("src/", "")))) {
    continue;
  }

  const content = await readFile(file, "utf8");
  if (content.includes(PRODUCTION_DOMAIN)) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (line.includes(PRODUCTION_DOMAIN)) {
        console.error(`Hardcoded domain in ${file}:${i + 1}: ${line.trim()}`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} hardcoded domain violation(s) found.`);
  process.exit(1);
} else {
  console.log("No hardcoded domain violations found.");
}

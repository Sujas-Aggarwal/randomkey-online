#!/usr/bin/env node
/**
 * Verify that no network egress calls exist in crypto/tool generation paths.
 * This checks src/utils/, src/lib/, src/workers/ for fetch/XMLHttpRequest usage.
 */

import { readdir, readFile } from "fs/promises";
import { join } from "path";

const CHECKED_DIRS = ["src/utils", "src/lib", "src/workers"];
const FORBIDDEN_PATTERNS = [
  /\bfetch\s*\(/,
  /\bnew\s+XMLHttpRequest\b/,
  /\bnew\s+WebSocket\b/,
  /\bnavigator\.sendBeacon\b/,
];

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFiles(fullPath)));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }
  return files;
}

let violations = 0;

for (const dir of CHECKED_DIRS) {
  const files = await getFiles(dir);
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(line)) {
          console.error(`EGRESS violation in ${file}:${i + 1}: ${line.trim()}`);
          violations++;
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} egress violation(s) found.`);
  process.exit(1);
} else {
  console.log("No egress violations found in crypto/util paths.");
}

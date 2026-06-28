import assert from "node:assert/strict";
import fs from "node:fs";

const files = ["src/routes/project/getVisualManual.ts", "src/routes/project/queryDirectorManual.ts"];

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  assert.ok(source.includes('req.get("host")'), `${file} should build skill image URLs from the current API host`);
  assert.ok(source.includes('path.posix.join("skills"'), `${file} should return /skills image paths`);
  assert.ok(!source.includes('u.oss.getFileUrl(i, "skills")'), `${file} should not bind skill image URLs to a fixed localhost port`);
}

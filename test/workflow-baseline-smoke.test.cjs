const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowDir = path.resolve(__dirname, "..", ".github", "workflows");

for (const name of ["debug.yml", "release.yml"]) {
  test(`${name} uses Node 24`, () => {
    const workflow = fs.readFileSync(path.join(workflowDir, name), "utf8");
    assert.match(workflow, /NODE_VERSION:\s*"24"/);
  });

  test(`${name} enables Corepack`, () => {
    const workflow = fs.readFileSync(path.join(workflowDir, name), "utf8");
    assert.match(workflow, /name:\s*启用 Corepack[\s\S]*run:\s*corepack enable/);
  });

  test(`${name} runs macOS Intel builds on macos-15-intel`, () => {
    const workflow = fs.readFileSync(path.join(workflowDir, name), "utf8");
    assert.match(workflow, /- arch:\s*x64[\s\S]*os:\s*macos-15-intel/);
  });
}

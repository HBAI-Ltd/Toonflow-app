const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowDir = path.resolve(__dirname, "..", ".github", "workflows");

for (const name of ["debug.yml", "release.yml"]) {
  test(`${name} uses Node 20`, () => {
    const workflow = fs.readFileSync(path.join(workflowDir, name), "utf8");
    assert.match(workflow, /NODE_VERSION:\s*"20"/);
  });

  test(`${name} enables Corepack`, () => {
    const workflow = fs.readFileSync(path.join(workflowDir, name), "utf8");
    assert.match(workflow, /name:\s*启用 Corepack[\s\S]*run:\s*corepack enable/);
  });
}

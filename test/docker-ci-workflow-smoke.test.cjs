const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflowPath = path.resolve(__dirname, "..", ".github", "workflows", "docker-smoke.yml");

test("docker smoke workflow exists", () => {
  assert.equal(fs.existsSync(workflowPath), true);
});

test("docker smoke workflow uses Node 24 on ubuntu", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /runs-on:\s*ubuntu-latest/);
  assert.match(workflow, /NODE_VERSION:\s*"24"/);
});

test("docker smoke workflow runs baseline verification", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /node scripts\/runLocalYarn\.cjs verify:baseline/);
});

test("docker smoke workflow runs docker build smoke", () => {
  const workflow = fs.readFileSync(workflowPath, "utf8");
  assert.match(workflow, /docker build -t toonflow:smoke \./);
});

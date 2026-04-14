const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const dockerfilePath = path.resolve(__dirname, "..", "Dockerfile");
const dockerfile = fs.readFileSync(dockerfilePath, "utf8");

test("Dockerfile uses Node 20 LTS base image", () => {
  assert.match(dockerfile, /^FROM node:20-bookworm-slim$/m);
});

test("Dockerfile enables Corepack during image build", () => {
  assert.match(dockerfile, /^RUN corepack enable$/m);
});

test("Dockerfile builds backend artifacts during image build", () => {
  assert.match(dockerfile, /node scripts\/runLocalYarn\.cjs build/);
});

test("Dockerfile defaults to prod runtime mode", () => {
  assert.match(dockerfile, /^ENV NODE_ENV=prod$/m);
});

test("Dockerfile starts the built backend service instead of the dev server", () => {
  assert.match(dockerfile, /^CMD \["node", "data\/serve\/app\.js"\]$/m);
  assert.doesNotMatch(dockerfile, /^CMD \["yarn", "dev"\]$/m);
});

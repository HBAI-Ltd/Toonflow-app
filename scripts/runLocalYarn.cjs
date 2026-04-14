const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const yarnCliPath = path.join(repoRoot, "node_modules", "yarn", "bin", "yarn.js");

if (!fs.existsSync(yarnCliPath)) {
  console.error(`Local Yarn CLI not found: ${yarnCliPath}`);
  console.error("Run `corepack yarn install` once to materialize the local Yarn dependency.");
  process.exit(1);
}

const child = childProcess.spawn(process.execPath, [yarnCliPath, ...process.argv.slice(2)], {
  cwd: repoRoot,
  env: process.env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

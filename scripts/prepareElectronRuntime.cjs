const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = process.cwd();
const runtimeRoot = path.join(repoRoot, ".electron-runtime");
const runtimeNodeModulesDir = path.join(runtimeRoot, "node_modules");
const moduleName = "better-sqlite3";
const sourceModuleDir = path.join(repoRoot, "node_modules", moduleName);
const targetModuleDir = path.join(runtimeNodeModulesDir, moduleName);
const electronPackageJsonPath = path.join(repoRoot, "node_modules", "electron", "package.json");
const prebuildInstallCliPath = path.join(repoRoot, "node_modules", "prebuild-install", "bin.js");

if (!fs.existsSync(sourceModuleDir)) {
  throw new Error(`Missing source module for Electron runtime preparation: ${sourceModuleDir}`);
}

if (!fs.existsSync(electronPackageJsonPath)) {
  throw new Error(`Missing installed electron package: ${electronPackageJsonPath}`);
}

if (!fs.existsSync(prebuildInstallCliPath)) {
  throw new Error(`Missing prebuild-install CLI: ${prebuildInstallCliPath}`);
}

const electronVersion = JSON.parse(fs.readFileSync(electronPackageJsonPath, "utf8")).version;

function copyDir(sourceDir, destinationDir) {
  fs.mkdirSync(destinationDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, destinationPath);
      continue;
    }
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

fs.mkdirSync(runtimeNodeModulesDir, { recursive: true });
fs.writeFileSync(
  path.join(runtimeRoot, "package.json"),
  JSON.stringify(
    {
      name: "toonflow-electron-runtime",
      private: true,
      version: "0.0.0",
    },
    null,
    2,
  ),
  "utf8",
);
fs.rmSync(targetModuleDir, { recursive: true, force: true });
copyDir(sourceModuleDir, targetModuleDir);

execFileSync(
  process.execPath,
  [
    prebuildInstallCliPath,
    "-r",
    "electron",
    "-t",
    electronVersion,
    "-a",
    process.arch,
  ],
  {
    cwd: targetModuleDir,
    stdio: "inherit",
  },
);

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const { Platform } = require("app-builder-lib");
const { Arch } = require("builder-util");
const packageManagerModule = require("app-builder-lib/out/node-module-collector/packageManager.js");
const { NodeModulesCollector } = require("app-builder-lib/out/node-module-collector/nodeModulesCollector.js");
const { LogMessageByKey } = require("app-builder-lib/out/node-module-collector/moduleManager.js");
const { log } = require("builder-util");
const { build } = require("electron-builder/out/builder.js");

const originalGetPackageManagerCommand = packageManagerModule.getPackageManagerCommand;
const originalStreamCollectorCommandToFile = NodeModulesCollector.prototype.streamCollectorCommandToFile;
const npmCmdPath = path.join(path.dirname(process.execPath), "npm.cmd");
const powerShellPath = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";

packageManagerModule.getPackageManagerCommand = function patchedGetPackageManagerCommand(pm) {
  if (process.platform === "win32" && pm === packageManagerModule.PM.NPM && fs.existsSync(npmCmdPath)) {
    return npmCmdPath;
  }
  return originalGetPackageManagerCommand(pm);
};

function toPowerShellArgument(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

NodeModulesCollector.prototype.streamCollectorCommandToFile = async function patchedStreamCollectorCommandToFile(
  command,
  args,
  cwd,
  tempOutputFile,
) {
  const execName = path.basename(command, path.extname(command));
  const isWindowsScriptFile = process.platform === "win32" && path.extname(command).toLowerCase() === ".cmd";
  if (!isWindowsScriptFile) {
    return originalStreamCollectorCommandToFile.call(this, command, args, cwd, tempOutputFile);
  }

  const commandLine = `& ${toPowerShellArgument(command)} ${args.map(toPowerShellArgument).join(" ")}`.trim();

  await new Promise((resolve, reject) => {
    const outStream = fs.createWriteStream(tempOutputFile);
    const child = childProcess.spawn(powerShellPath, ["-NoProfile", "-Command", commandLine], {
      cwd,
      env: { COREPACK_ENABLE_STRICT: "0", ...process.env },
      shell: false,
    });

    let stderr = "";
    child.stdout.pipe(outStream);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      reject(new Error(`Node module collector spawn failed: ${error.message}`));
    });
    child.on("close", (code) => {
      outStream.close();
      const shouldIgnore = code === 1 && execName.toLowerCase() === "npm" && args.includes("list");
      if (shouldIgnore) {
        log.debug(null, "`npm list` returned non-zero exit code, but it MIGHT be expected (https://github.com/npm/npm/issues/17624). Check stderr for details.");
      }
      if (stderr.length > 0) {
        log.debug({ stderr }, "note: there was node module collector output on stderr");
        this.cache.logSummary[LogMessageByKey.PKG_COLLECTOR_OUTPUT].push(stderr);
      }
      const shouldResolve = code === 0 || shouldIgnore;
      return shouldResolve ? resolve() : reject(new Error(`Node module collector process exited with code ${code}:\n${stderr}`));
    });
  });
};

async function main() {
  const targetArg = process.argv[2] ?? "x64";
  const archToTargets = new Map();
  if (targetArg === "all") {
    archToTargets.set(Arch.x64, ["nsis"]);
    archToTargets.set(Arch.arm64, ["nsis"]);
  } else if (targetArg === "arm64") {
    archToTargets.set(Arch.arm64, ["nsis"]);
  } else {
    archToTargets.set(Arch.x64, ["nsis"]);
  }

  await build({
    targets: new Map([[Platform.WINDOWS, archToTargets]]),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

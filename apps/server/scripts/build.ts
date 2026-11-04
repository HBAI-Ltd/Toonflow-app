import { $ } from "bun";
import { cp, mkdir, realpath, rm } from "@toonflow/file";
import { dirname, resolve } from "node:path";
import config from "../../../electrobun.config";
import copyDocumentPackages from "./copyDocumentPackages";
import copySandboxPackages from "./copySandboxPackages";

const projectDir = resolve(import.meta.dirname, "../../..");
const outputDirectory = resolve(projectDir, "build/server");
const agentDirectory = dirname(await realpath(Bun.resolveSync("@earendil-works/pi-coding-agent", resolve(projectDir, "apps/server"))));
const photonDirectory = dirname(Bun.resolveSync("@silvia-odwyer/photon-node", agentDirectory));
// ACT: 团队暂不打包，恢复时取消注释。
// await $`${process.execPath} run build:teams`.cwd(projectDir);
await $`${process.execPath} run build`.cwd(resolve(projectDir, "packages/mcp"));
await mkdir(outputDirectory, { recursive: true });
// ACT: 移除旧版构建遗留的宿主 SDK，避免增量构建继续把它带入发布目录。
await rm(resolve(outputDirectory, "pluginSdk"), { recursive: true, force: true });
// ACT: Photon、anydoc 与沙盒依赖保留运行时目录，WASM/Worker 不依赖源码目录或启动位置。
await $`${process.execPath} build src/index.ts --target=bun --minify --external @silvia-odwyer/photon-node --external @firecrawl/anydoc --external @firecrawl/anydoc-wasm --external just-bash --define ${`process.env.appVersion:${JSON.stringify(config.app.version)}`} --outdir ${outputDirectory}`.cwd(resolve(projectDir, "apps/server"));
await $`${process.execPath} build packages/ffmpeg/src/ffmpegWorker.ts --target=bun --minify --outdir ${outputDirectory}`.cwd(projectDir);
await $`${process.execPath} build packages/tools/sandbox/src/sandboxProcess.ts --target=bun --minify --external just-bash --outdir ${outputDirectory}`.cwd(projectDir);
const photonOutput = resolve(projectDir, "build/server/node_modules/@silvia-odwyer/photon-node");
await rm(photonOutput, { recursive: true, force: true });
await cp(photonDirectory, photonOutput, { recursive: true });
await copyDocumentPackages(resolve(projectDir, "build/server/node_modules"));
await copySandboxPackages(resolve(projectDir, "build/server/node_modules"));
const skillsOutput = resolve(projectDir, "build/skills");
await rm(skillsOutput, { recursive: true, force: true });
await cp(resolve(projectDir, "packages/skills"), skillsOutput, { recursive: true });
const providersOutput = resolve(projectDir, "build/providers");
await rm(providersOutput, { recursive: true, force: true });
await cp(resolve(projectDir, "packages/providers/src"), providersOutput, { recursive: true });

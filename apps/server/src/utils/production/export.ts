import { mkdir } from "@toonflow/file";
import { dirname } from "node:path";
import { createWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { resolveWorkspacePath } from "@/utils/workspace/files";
import { readProductionManifest, writeProductionManifest } from "@/utils/production/shots";

export async function exportProduction(directory: string, outputPath: string, inputPaths: string[], signal?: AbortSignal) {
  if (!inputPaths.length) throw Object.assign(new Error("至少需要一个视频片段"), { status: 400 });
  if (inputPaths.some(path => !path || path.startsWith("/") || path.split(/[\\/]/).some(part => !part || part === "." || part === ".."))) throw Object.assign(new Error("视频路径必须是工作区内的相对路径"), { status: 400 });
  if (!outputPath || outputPath.startsWith("/") || outputPath.split(/[\\/]/).some(part => !part || part === "." || part === "..")) throw Object.assign(new Error("输出路径必须是工作区内的相对路径"), { status: 400 });
  await Promise.all(inputPaths.map(path => resolveWorkspacePath(directory, path)));
  const output = await resolveWorkspacePath(directory, outputPath, true);
  const factory = await createWorkspaceFfmpeg(directory, signal);
  await mkdir(dirname(output.path), { recursive: true });
  const command = factory(inputPaths[0]);
  for (const input of inputPaths.slice(1)) command.input(input);
  const cancel = () => command.kill("SIGKILL");
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    await new Promise<void>((resolve, reject) => {
      command.on("error", reject);
      command.on("end", () => resolve());
      command.mergeToFile(outputPath, "mp4");
    });
    const manifest = await readProductionManifest(directory);
    await writeProductionManifest(directory, { ...manifest, exportedPath: outputPath });
    return { outputPath };
  } finally { signal?.removeEventListener("abort", cancel); }
}

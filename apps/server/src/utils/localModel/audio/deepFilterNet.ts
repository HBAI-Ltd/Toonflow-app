import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtemp, readFile, rm, writeFile } from "@toonflow/file";
import { packLocalTensor, unpackLocalTensor, type LocalModelRunRequest, type LocalModelRunResult } from "@toonflow/plugin-server/localModelClient";
import { pcmToWav } from "@toonflow/node-shared/pcmPreview";
import { resolveInstalledModel } from "@/utils/localModel";
import { runAudioCommand } from "@/utils/localModel/audio/command";

let active = 0;
export async function runDeepFilterNet(request: LocalModelRunRequest, signal?: AbortSignal): Promise<LocalModelRunResult> {
  const audio = request.inputs.audio;
  const frames = audio?.dims[0] ?? 0, channels = audio?.dims[1] ?? 0;
  if (request.id !== "deepFilterNet" || Object.keys(request.inputs).length !== 1 || audio?.type !== "int16" || audio.dims.length !== 2
    || frames < 1 || frames > 48000 * 60 || ![1, 2].includes(channels) || (request.outputs && request.outputs.join(",") !== "enhanced")) {
    throw Object.assign(new Error("对白降噪需要 48 kHz 的单声道或双声道 16 位 PCM 音频"), { status: 400 });
  }
  if (request.device === "gpu") throw Object.assign(new Error("此版本的对白降噪运行器使用 CPU"), { status: 400 });
  if (active >= 2) throw Object.assign(new Error("本地模型正在运行，请稍后再试"), { status: 429 });
  active++;
  let temporary: string | undefined;
  try {
    const model = await resolveInstalledModel("deepFilterNet");
    // 仅执行私有目录中再次校验过摘要的内置发行物，杜绝校验后被替换或旁加载同名 DLL。
    const binary = await readFile(model.path);
    if (createHash("sha256").update(binary).digest("hex") !== model.sha256) throw new Error("对白降噪运行器校验失败");
    signal?.throwIfAborted();
    temporary = await mkdtemp(join(tmpdir(), "toonflowVoice"));
    const executable = join(temporary, process.platform === "win32" ? "deepFilter.exe" : "deepFilter");
    await writeFile(executable, binary, { flag: "wx", mode: 0o700 });
    // 官方 -D 会裁掉滤波延迟，额外提供 100 ms 静音并补齐 10 ms hop，再截回准确输入时长。
    const padded = new Uint8Array((Math.ceil(frames / 480) + 10) * 480 * channels * 2);
    padded.set(unpackLocalTensor(audio));
    const wav = pcmToWav(padded.buffer, { channels, sampleRate: 48000, format: "s16le" });
    await writeFile(join(temporary, "input.wav"), new Uint8Array(await wav.arrayBuffer()), { flag: "wx" });
    await runAudioCommand(executable, ["-D", "-o", "out", "input.wav"], temporary, signal, 180000);
    signal?.throwIfAborted();
    const result = await readFile(join(temporary, "out", "input.wav"));
    const length = frames * channels * 2;
    if (result.toString("ascii", 0, 4) === "RIFF" && result.toString("ascii", 8, 12) === "WAVE") {
      for (let offset = 12; offset + 8 <= result.length;) {
        const size = result.readUInt32LE(offset + 4), start = offset + 8;
        if (size > result.length - start) break;
        if (result.toString("ascii", offset, offset + 4) === "data" && size >= length) {
          return { provider: "DeepFilterNet CPU", outputs: { enhanced: packLocalTensor("int16", [frames, channels], result.subarray(start, start + length)) } };
        }
        offset = start + size + size % 2;
      }
    }
    throw new Error("对白降噪未生成完整音轨");
  } finally {
    active--;
    if (temporary) await rm(temporary, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }).catch(error => console.warn("对白降噪临时目录清理失败", error));
  }
}

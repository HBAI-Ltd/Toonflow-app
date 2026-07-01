import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import u from "@/utils";

export type SrCheckStatus = "ok" | "warning" | "error";

export interface SrCheckItem {
  name: string;
  status: SrCheckStatus;
  detail: string;
  required: boolean;
}

function settingValue(settings: Record<string, string>, key: string, fallback: string): string {
  return settings[key]?.trim() || fallback;
}

async function loadSrSettings(): Promise<Record<string, string>> {
  const rows = await u.db("o_setting").whereLike("key", "sr.%").select("key", "value");
  return Object.fromEntries(rows.map((row) => [String(row.key), String(row.value ?? "")]));
}

function runCommand(command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}): Promise<SrCheckItem> {
  const label = [command, ...args].join(" ");
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ name: command, status: "error", detail: `${label} timed out`, required: true });
    }, options.timeoutMs ?? 10000);

    child.stdout.on("data", (data) => {
      output += String(data);
    });
    child.stderr.on("data", (data) => {
      output += String(data);
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ name: command, status: "error", detail: err.message, required: true });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      const firstLine = output.trim().split(/\r?\n/).find(Boolean) || `${label} exited with ${code}`;
      resolve({ name: command, status: code === 0 ? "ok" : "error", detail: firstLine, required: true });
    });
  });
}

async function checkWritable(name: string, target: string): Promise<SrCheckItem> {
  try {
    await fs.mkdir(target, { recursive: true });
    const testFile = path.join(target, `.sr-write-${Date.now()}.tmp`);
    await fs.writeFile(testFile, "ok");
    await fs.unlink(testFile);
    return { name, status: "ok", detail: target, required: true };
  } catch (err) {
    return { name, status: "error", detail: err instanceof Error ? err.message : String(err), required: true };
  }
}

export async function checkStructuralReplicaEnvironment() {
  const settings = await loadSrSettings();
  const pythonPath = settingValue(settings, "sr.pythonPath", "python");
  const ffmpegPath = settingValue(settings, "sr.ffmpegPath", "ffmpeg");
  const ffprobePath = settingValue(settings, "sr.ffprobePath", "ffprobe");
  const analyzerPath = path.resolve(process.cwd(), "tools", "video-analyzer");
  const analyzerEnv = {
    ...process.env,
    PYTHONPATH: [analyzerPath, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter),
  };

  const [ffmpeg, ffprobe, python, analyzer, whisper, ossWritable, tmpWritable] = await Promise.all([
    runCommand(ffmpegPath, ["-version"]),
    runCommand(ffprobePath, ["-version"]),
    runCommand(pythonPath, ["--version"]),
    runCommand(pythonPath, ["-c", "import sr_analyzer; print('sr_analyzer ok')"], { cwd: analyzerPath, env: analyzerEnv }),
    runCommand(pythonPath, ["-c", "import whisper; print('whisper ok')"], { cwd: analyzerPath, env: analyzerEnv }).then((item) => ({
      ...item,
      required: false,
      status: item.status === "ok" ? "ok" : ("warning" as const),
    })),
    checkWritable("data/oss writable", u.getPath("oss")),
    checkWritable("data/tmp writable", u.getPath("tmp")),
  ]);

  const checks = [
    { ...ffmpeg, name: "ffmpeg" },
    { ...ffprobe, name: "ffprobe" },
    { ...python, name: "python" },
    { ...analyzer, name: "sr_analyzer import" },
    { ...whisper, name: "whisper availability" },
    ossWritable,
    tmpWritable,
  ];
  const ok = checks.every((item) => item.status !== "error" || !item.required);
  return { ok, checks, settings: { pythonPath, ffmpegPath, ffprobePath, whisperModel: settings["sr.whisperModel"] || "turbo" } };
}

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface CompanionApiDefinition {
  id: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  expectedModelIds: string[];
  projectDir: string;
  condaEnv: string;
  pythonArgs: string[];
  processEnv?: Record<string, string>;
}

export interface SpawnProcessOptions {
  cwd: string;
  env: NodeJS.ProcessEnv;
  detached: boolean;
  stdio: "inherit";
}

export type SpawnProcess = (
  command: string,
  args: string[],
  options: SpawnProcessOptions,
) => ChildProcess;

interface CompanionApiManagerOptions {
  fetchImpl?: typeof fetch;
  spawnImpl?: SpawnProcess;
  condaExecutable?: string;
  startupTimeoutMs?: number;
  retryIntervalMs?: number;
  requestTimeoutMs?: number;
  shutdownTimeoutMs?: number;
  logger?: (message: string) => void;
}

type ProbeFailureKind = "unreachable" | "not-ready" | "fatal";

class ProbeFailure extends Error {
  constructor(
    message: string,
    public readonly kind: ProbeFailureKind,
  ) {
    super(message);
    this.name = "ProbeFailure";
  }
}

interface OwnedProcess {
  api: CompanionApiDefinition;
  child: ChildProcess;
  spawnError?: Error;
}

const DEFAULT_STARTUP_TIMEOUT_MS = 60_000;
const DEFAULT_RETRY_INTERVAL_MS = 500;
const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
const DEFAULT_SHUTDOWN_TIMEOUT_MS = 5_000;

function cleanApiKey(value?: string): string {
  return (value || "").trim().replace(/^Bearer\s+/i, "");
}

function getModelsUrl(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new ProbeFailure(`服务地址无效：${baseUrl}`, "fatal");
  }

  const pathname = url.pathname
    .replace(/\/+$/, "")
    .replace(/\/v1\/chat\/completions$/i, "/v1");
  url.pathname = /\/v1$/i.test(pathname)
    ? `${pathname}/models`
    : `${pathname}/v1/models`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function parseModelIds(data: unknown): string[] {
  if (!data || typeof data !== "object") return [];
  const modelData = (data as { data?: unknown }).data;
  if (!Array.isArray(modelData)) return [];
  return modelData
    .map((model) => {
      if (!model || typeof model !== "object") return "";
      const id = (model as { id?: unknown }).id;
      return typeof id === "string" ? id : "";
    })
    .filter(Boolean);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function findCondaExecutable(): string {
  const explicit = (process.env.TOONFLOW_CONDA_EXE || process.env.CONDA_EXE || "").trim();
  if (explicit) return explicit;

  const executableName = process.platform === "win32" ? "conda.exe" : "conda";
  const candidates = [
    path.join(os.homedir(), "anaconda3", process.platform === "win32" ? "Scripts" : "bin", executableName),
    path.join(os.homedir(), "miniconda3", process.platform === "win32" ? "Scripts" : "bin", executableName),
    path.join(os.homedir(), "miniforge3", process.platform === "win32" ? "Scripts" : "bin", executableName),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || executableName;
}

export class CompanionApiManager {
  private readonly fetchImpl: typeof fetch;
  private readonly spawnImpl: SpawnProcess;
  private readonly condaExecutable: string;
  private readonly startupTimeoutMs: number;
  private readonly retryIntervalMs: number;
  private readonly requestTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly logger: (message: string) => void;
  private readonly ownedProcesses = new Map<string, OwnedProcess>();

  constructor(
    private readonly definitions: CompanionApiDefinition[],
    options: CompanionApiManagerOptions = {},
  ) {
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.spawnImpl =
      options.spawnImpl ??
      ((command, args, spawnOptions) =>
        spawn(command, args, spawnOptions));
    this.condaExecutable = options.condaExecutable ?? findCondaExecutable();
    this.startupTimeoutMs =
      options.startupTimeoutMs ?? DEFAULT_STARTUP_TIMEOUT_MS;
    this.retryIntervalMs =
      options.retryIntervalMs ?? DEFAULT_RETRY_INTERVAL_MS;
    this.requestTimeoutMs =
      options.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
    this.shutdownTimeoutMs =
      options.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
    this.logger = options.logger ?? console.log;
  }

  async ensureAll(): Promise<void> {
    const results = await Promise.allSettled(
      this.definitions.map((api) => this.ensureOne(api)),
    );
    const failures = results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .map((result) =>
        result.reason instanceof Error ? result.reason.message : String(result.reason),
      );

    if (failures.length === 0) return;

    await this.stopOwned();
    throw new Error(`伴随 API 启动检查失败：\n- ${failures.join("\n- ")}`);
  }

  async stopOwned(): Promise<void> {
    const processes = Array.from(this.ownedProcesses.values());
    this.ownedProcesses.clear();
    await Promise.all(processes.map((owned) => this.stopProcess(owned.child)));
  }

  stopOwnedSync(): void {
    const processes = Array.from(this.ownedProcesses.values());
    this.ownedProcesses.clear();
    for (const { child } of processes) {
      this.signalProcess(child, "SIGTERM");
    }
  }

  private async ensureOne(api: CompanionApiDefinition): Promise<void> {
    try {
      await this.probeModels(api);
      this.logger(
        `[伴随服务] ${api.displayName} 已就绪，模型：${api.expectedModelIds.join(", ")}`,
      );
      return;
    } catch (error) {
      if (!(error instanceof ProbeFailure)) throw error;
      if (error.kind === "fatal") throw error;
      if (error.kind === "not-ready") {
        await this.waitUntilReady(api);
        return;
      }
    }

    const owned = this.startProcess(api);
    await this.waitUntilReady(api, owned);
  }

  private startProcess(api: CompanionApiDefinition): OwnedProcess {
    if (!fs.existsSync(api.projectDir)) {
      throw new Error(
        `${api.displayName} 项目目录不存在：${api.projectDir}。` +
          `请设置对应的 TOONFLOW_*_DIR 环境变量。`,
      );
    }

    const args = [
      "run",
      "--no-capture-output",
      "-n",
      api.condaEnv,
      "python",
      ...api.pythonArgs,
    ];
    this.logger(
      `[伴随服务] 正在启动 ${api.displayName}（Conda 环境：${api.condaEnv}）`,
    );

    let child: ChildProcess;
    try {
      child = this.spawnImpl(this.condaExecutable, args, {
        cwd: api.projectDir,
        env: { ...process.env, ...api.processEnv },
        detached: process.platform !== "win32",
        stdio: "inherit",
      });
    } catch (error) {
      throw new Error(
        `${api.displayName} 启动命令执行失败：${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const owned: OwnedProcess = { api, child };
    child.once("error", (error) => {
      owned.spawnError = error;
    });
    child.unref();
    this.ownedProcesses.set(api.id, owned);
    return owned;
  }

  private async waitUntilReady(
    api: CompanionApiDefinition,
    owned?: OwnedProcess,
  ): Promise<void> {
    const deadline = Date.now() + this.startupTimeoutMs;
    let lastFailure = "";

    while (Date.now() <= deadline) {
      if (owned?.spawnError) {
        throw new Error(
          `${api.displayName} 启动失败：${owned.spawnError.message}`,
        );
      }
      if (owned && owned.child.exitCode !== null) {
        throw new Error(
          `${api.displayName} 在模型检查通过前退出，退出码：${owned.child.exitCode}`,
        );
      }

      try {
        await this.probeModels(api);
        this.logger(
          `[伴随服务] ${api.displayName} 已就绪，模型：${api.expectedModelIds.join(", ")}`,
        );
        return;
      } catch (error) {
        if (!(error instanceof ProbeFailure)) throw error;
        if (error.kind === "fatal") throw error;
        lastFailure = error.message;
      }
      await sleep(this.retryIntervalMs);
    }

    throw new Error(
      `${api.displayName} 启动超时（${this.startupTimeoutMs}ms）${
        lastFailure ? `：${lastFailure}` : ""
      }`,
    );
  }

  private async probeModels(api: CompanionApiDefinition): Promise<void> {
    const modelsUrl = getModelsUrl(api.baseUrl);
    const apiKey = cleanApiKey(api.apiKey);
    const headers = apiKey
      ? { Authorization: `Bearer ${apiKey}` }
      : undefined;

    let response: Response;
    try {
      response = await this.fetchImpl(modelsUrl, {
        headers,
        signal: AbortSignal.timeout(this.requestTimeoutMs),
      });
    } catch (error) {
      throw new ProbeFailure(
        `${api.displayName} 无法连接 ${modelsUrl}：${
          error instanceof Error ? error.message : String(error)
        }`,
        "unreachable",
      );
    }

    if (!response.ok) {
      const kind: ProbeFailureKind =
        response.status >= 500 ? "not-ready" : "fatal";
      const authHint =
        response.status === 401 || response.status === 403
          ? "，请检查 Toonflow 中配置的 API Key"
          : "";
      throw new ProbeFailure(
        `${api.displayName} 模型接口返回 HTTP ${response.status}${authHint}`,
        kind,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ProbeFailure(
        `${api.displayName} 模型接口未返回有效 JSON`,
        "fatal",
      );
    }

    const modelIds = parseModelIds(body);
    const missing = api.expectedModelIds.filter(
      (modelId) => !modelIds.includes(modelId),
    );
    if (missing.length > 0) {
      throw new ProbeFailure(
        `${api.displayName} 未提供 Toonflow 所需模型：${missing.join(", ")}`,
        "fatal",
      );
    }
  }

  private async stopProcess(child: ChildProcess): Promise<void> {
    if (child.exitCode !== null) return;

    const exited = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), this.shutdownTimeoutMs);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    this.signalProcess(child, "SIGTERM");
    if (await exited) return;
    this.signalProcess(child, "SIGKILL");
  }

  private signalProcess(
    child: ChildProcess,
    signal: NodeJS.Signals,
  ): void {
    if (child.exitCode !== null || !child.pid) return;

    if (process.platform !== "win32") {
      try {
        process.kill(-child.pid, signal);
        return;
      } catch {
        // Fall back to the direct child when no detached process group exists.
      }
    }

    try {
      child.kill(signal);
    } catch {
      // The child may already have exited between the checks above.
    }
  }
}

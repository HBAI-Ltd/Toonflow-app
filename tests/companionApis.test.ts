import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import test from "node:test";
import {
  CompanionApiManager,
  type CompanionApiDefinition,
  type SpawnProcess,
} from "../src/lib/companionApis";

const rootDir = path.resolve(__dirname, "..");

class FakeChildProcess extends EventEmitter {
  public readonly pid: number;
  public exitCode: number | null = null;
  public killedWith: NodeJS.Signals | number | undefined;

  constructor(pid: number) {
    super();
    this.pid = pid;
  }

  unref(): void {}

  kill(signal?: NodeJS.Signals | number): boolean {
    this.killedWith = signal;
    this.exitCode = 0;
    this.emit("exit", 0, signal);
    return true;
  }
}

function definitions(): CompanionApiDefinition[] {
  return [
    {
      id: "chatgpt2api",
      displayName: "chatgpt2api",
      baseUrl: "http://127.0.0.1:8000/v1",
      apiKey: "chat-secret",
      expectedModelIds: ["gpt-5.6-sol-wm"],
      projectDir: rootDir,
      condaEnv: "chatgpt2api-py313",
      pythonArgs: ["main.py"],
      processEnv: { CHATGPT2API_AUTH_KEY: "chat-secret" },
    },
    {
      id: "doubao2api",
      displayName: "doubao2api",
      baseUrl: "http://127.0.0.1:9090",
      apiKey: "",
      expectedModelIds: ["doubao-video"],
      projectDir: rootDir,
      condaEnv: "base",
      pythonArgs: ["-m", "doubao2api"],
    },
  ];
}

function modelsResponse(ids: string[]): Response {
  return Response.json({
    object: "list",
    data: ids.map((id) => ({ id, object: "model" })),
  });
}

test("does not spawn or stop companion APIs that are already reachable", async () => {
  const spawnCalls: string[][] = [];
  const manager = new CompanionApiManager(definitions(), {
    fetchImpl: async (url) => {
      const value = String(url);
      return value.includes(":8000")
        ? modelsResponse(["gpt-5.6-sol-wm"])
        : modelsResponse(["doubao-video"]);
    },
    spawnImpl: ((_, args) => {
      spawnCalls.push(args);
      return new FakeChildProcess(1001) as never;
    }) as SpawnProcess,
    condaExecutable: "/test/conda",
  });

  await manager.ensureAll();
  await manager.stopOwned();

  assert.deepEqual(spawnCalls, []);
});

test("starts both unavailable APIs in parallel and stops only owned processes", async () => {
  const started = new Set<string>();
  const children: FakeChildProcess[] = [];
  const spawnCalls: { args: string[]; cwd: string; authKey?: string }[] = [];
  const spawnImpl = ((_, args, options) => {
    const envIndex = args.indexOf("-n") + 1;
    started.add(args[envIndex]);
    spawnCalls.push({
      args,
      cwd: options.cwd,
      authKey: options.env.CHATGPT2API_AUTH_KEY,
    });
    const child = new FakeChildProcess(2000 + children.length);
    children.push(child);
    return child as never;
  }) as SpawnProcess;
  const manager = new CompanionApiManager(definitions(), {
    fetchImpl: async (url) => {
      const value = String(url);
      if (value.includes(":8000") && started.has("chatgpt2api-py313")) {
        return modelsResponse(["gpt-5.6-sol-wm"]);
      }
      if (value.includes(":9090") && started.has("base")) {
        return modelsResponse(["doubao-video"]);
      }
      throw new TypeError("fetch failed");
    },
    spawnImpl,
    condaExecutable: "/test/conda",
    retryIntervalMs: 1,
    startupTimeoutMs: 100,
  });

  await manager.ensureAll();

  assert.equal(spawnCalls.length, 2);
  assert.ok(spawnCalls.every((call) => call.cwd === rootDir));
  assert.ok(spawnCalls.every((call) => call.args.includes("--no-capture-output")));
  assert.equal(
    spawnCalls.find((call) => call.args.includes("chatgpt2api-py313"))
      ?.authKey,
    "chat-secret",
  );

  await manager.stopOwned();

  assert.deepEqual(
    children.map((child) => child.killedWith),
    ["SIGTERM", "SIGTERM"],
  );
});

test("uses bearer authentication when checking the configured model list", async () => {
  const authorizationHeaders: Array<string | null> = [];
  const manager = new CompanionApiManager([definitions()[0]], {
    fetchImpl: async (_, init) => {
      const headers = new Headers(init?.headers);
      authorizationHeaders.push(headers.get("authorization"));
      return modelsResponse(["gpt-5.6-sol-wm"]);
    },
    spawnImpl: (() => {
      throw new Error("spawn should not be called");
    }) as SpawnProcess,
  });

  await manager.ensureAll();

  assert.deepEqual(authorizationHeaders, ["Bearer chat-secret"]);
});

test("fails without spawning when a reachable API does not expose the required model", async () => {
  let spawnCount = 0;
  const manager = new CompanionApiManager([definitions()[0]], {
    fetchImpl: async () => modelsResponse(["another-model"]),
    spawnImpl: (() => {
      spawnCount += 1;
      return new FakeChildProcess(3001) as never;
    }) as SpawnProcess,
  });

  await assert.rejects(manager.ensureAll(), /gpt-5\.6-sol-wm/);
  assert.equal(spawnCount, 0);
});

test("fails on authentication errors without logging or exposing the API key", async () => {
  const messages: string[] = [];
  const manager = new CompanionApiManager([definitions()[0]], {
    fetchImpl: async () => new Response("Unauthorized", { status: 401 }),
    spawnImpl: (() => {
      throw new Error("spawn should not be called");
    }) as SpawnProcess,
    logger: (message) => messages.push(message),
  });

  await assert.rejects(manager.ensureAll(), (error: Error) => {
    assert.match(error.message, /401/);
    assert.doesNotMatch(error.message, /chat-secret/);
    return true;
  });
  assert.doesNotMatch(messages.join("\n"), /chat-secret/);
});

test("times out and cleans up a child started for an unreachable API", async () => {
  const child = new FakeChildProcess(4001);
  const manager = new CompanionApiManager([definitions()[1]], {
    fetchImpl: async () => {
      throw new TypeError("fetch failed");
    },
    spawnImpl: (() => child as never) as SpawnProcess,
    condaExecutable: "/test/conda",
    retryIntervalMs: 1,
    startupTimeoutMs: 10,
  });

  await assert.rejects(manager.ensureAll(), /启动超时/);
  assert.equal(child.killedWith, "SIGTERM");
});

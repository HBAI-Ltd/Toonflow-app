import { CFunction, CString, dlopen, ptr, read, toBuffer, type FFIFunction } from "bun:ffi";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { readFile } from "@toonflow/file";
import { localModelElementBytes, localModelTensorBytes, type LocalModelRunRequest, type LocalModelRunResult, type LocalModelTensorType } from "@toonflow/plugin-server/localModelInference";
import { validateEmbeddedModel } from "./format";

interface ProcessInput { request: LocalModelRunRequest; runtimePath: string; modelPath: string; sha256: string }
const elementTypes: Record<LocalModelTensorType, number> = {
  float32: 1, uint8: 2, int8: 3, uint16: 4, int16: 5, int32: 6, int64: 7,
  bool: 9, float16: 10, float64: 11, uint32: 12, uint64: 13,
};

// ACT: onnxruntime.dll 依赖 VC++ 运行库，桌面包把它放在 bun.exe 旁；Bun 的 dlopen 不在程序目录查找依赖，
// 先按绝对路径预加载，ORT 按模块名复用已加载的副本。文件不存在时（如开发环境）沿用系统已安装的运行库。
function preloadVcRuntime() {
  if (process.platform !== "win32") return;
  const kernel = dlopen("kernel32.dll", { LoadLibraryW: { args: ["ptr"], returns: "ptr" } });
  for (const name of ["vcruntime140.dll", "vcruntime140_1.dll", "msvcp140.dll", "msvcp140_1.dll"]) {
    kernel.symbols.LoadLibraryW(Buffer.from(join(dirname(process.execPath), name) + "\0", "utf16le"));
  }
  kernel.close();
}

function openRuntime(path: string) {
  preloadVcRuntime();
  const library = dlopen(path, { OrtGetApiBase: { args: [], returns: "ptr" } });
  const base = library.symbols.OrtGetApiBase();
  if (!base) throw new Error("无法加载 ONNX Runtime");
  const getApi = CFunction({ ptr: read.u64(base), args: ["u32"], returns: "ptr" });
  const api = getApi(22);
  if (!api) throw new Error("请安装对应版本的 ONNX Runtime");
  // ORT 1.22 官方 onnxruntime_c_api.h 中 OrtApi 的 v22 ABI 表，仅在支持的 64 位平台加载。
  // 使用内置目录验证过摘要的运行库。先通过 GetApi 核对版本，再按固定 ABI 绑定所需签名。
  const bind = (slot: number, args: NonNullable<FFIFunction["args"]>, returns: FFIFunction["returns"] = "ptr") =>
    CFunction({ ptr: read.u64(api, slot * 8), args, returns });
  const p = "ptr", n = "usize", i = "i32";
  return {
    library, errorCode: bind(1, [p], i), message: bind(2, [p]), createEnv: bind(3, [i, p, p]), disableTelemetry: bind(6, [p]),
    load: bind(8, [p, p, n, p, p]), run: bind(9, [p, p, p, p, n, p, n, p]),
    options: bind(10, [p]), disableMemPattern: bind(17, [p]), threads: bind(24, [p, i]),
    outputCount: bind(31, [p, p]), outputName: bind(37, [p, n, p, p]),
    tensor: bind(48, [p, p, n, i, p]), tensorData: bind(51, [p, p]), tensorType: bind(60, [p, p]),
    rank: bind(61, [p, p]), dimensions: bind(62, [p, p, n]), shape: bind(65, [p, p]),
    free: bind(76, [p, p]), allocator: bind(78, [p]), releaseEnv: bind(92, [p], "void"),
    releaseStatus: bind(93, [p], "void"), releaseSession: bind(95, [p], "void"),
    releaseTensor: bind(96, [p], "void"), releaseShape: bind(99, [p], "void"), releaseOptions: bind(100, [p], "void"),
    option: bind(130, [p, p, p]), providerApi: bind(195, [p, "u32", p]),
  };
}

function cString(text: string) { return Buffer.from(text + "\0"); }

async function createSession({ request, runtimePath, modelPath, sha256 }: ProcessInput) {
  const model = await readFile(modelPath);
  if (createHash("sha256").update(model).digest("hex") !== sha256) throw new Error("模型文件已变更，请重新检查本地模型");
  validateEmbeddedModel(model);
  const ort = openRuntime(runtimePath);
  const releases: (() => void)[] = [];
  function check(status: number | bigint | null) {
    if (!status) return;
    const message = new CString(ort.message(status)).toString() || "ONNX Runtime " + ort.errorCode(status);
    ort.releaseStatus(status);
    throw new Error(message);
  }
  function result(fn: CallableFunction, ...args: unknown[]) {
    const out = new BigUint64Array(1);
    check(fn(...args, out));
    return Number(out[0]);
  }
  function own(value: number, release: CallableFunction) {
    releases.push(() => release(value));
    return value;
  }
  function releaseTo(count: number) {
    while (releases.length > count) releases.pop()!();
  }
  function close() { releaseTo(0); ort.library.close(); }
  try {
    const env = own(result(ort.createEnv, 3, cString("Toonflow")), ort.releaseEnv);
    check(ort.disableTelemetry(env));
    const allocator = result(ort.allocator);
    function load(device: "cpu" | "gpu") {
      const options = result(ort.options);
      let provider = "CPU";
      try {
        check(ort.threads(options, 2));
        if (device === "gpu") {
          if (request.device === "gpu") check(ort.option(options, cString("session.disable_cpu_ep_fallback"), cString("1")));
          if (process.platform === "win32") {
            check(ort.disableMemPattern(options));
            const dml = result(ort.providerApi, cString("DML"), 22);
            // DML2 的 HighPerformance + Gpu 选真实显卡，虚拟显示器也可能占用 DXGI 第 0 号适配器。
            const append = CFunction({ ptr: read.u64(dml, 5 * 8), args: ["ptr", "ptr"], returns: "ptr" });
            check(append(options, new Uint32Array([1, 1])));
            provider = "DirectML";
          } else if (process.platform === "darwin") {
            const driver = dlopen(runtimePath, { OrtSessionOptionsAppendExecutionProvider_CoreML: { args: ["ptr", "i32"], returns: "ptr" } });
            try { check(driver.symbols.OrtSessionOptionsAppendExecutionProvider_CoreML(options, 0)); }
            finally { driver.close(); }
            provider = "CoreML";
          } else {
            // ACT: npm 版 Linux 运行库不含 CUDA 提供程序（需另装 libonnxruntime_providers_cuda.so 及 CUDA 12、cuDNN 9），
            // 此处直接失败，auto 立即回退 CPU。以后要支持 Linux 显卡时，增加 CUDA 运行库资产并恢复 AppendExecutionProvider_CUDA_V2。
            throw new Error("GPU acceleration is not available on this platform");
          }
        }
        // 仅传已验证的内存字节，运行库不会得到工作区或模型库的路径作为外部权重目录。
        return { session: own(result(ort.load, env, model, model.byteLength, options), ort.releaseSession), provider };
      } finally { ort.releaseOptions(options); }
    }
    function selectDevice() {
      if (request.device === "cpu") return load("cpu");
      try { return load("gpu"); }
      catch (cause) {
        if (request.device === "gpu") throw Object.assign(new Error("无法使用 GPU 执行此模型：{0}"), { detail: cause instanceof Error ? cause.message : String(cause) });
        return load("cpu");
      }
    }
    const { session, provider } = selectDevice();
    const sessionHandles = releases.length;
    function run(request: LocalModelRunRequest): LocalModelRunResult {
      const inputs = Object.entries(request.inputs);
      const inputValues = new BigUint64Array(Math.max(1, inputs.length));
      for (const [index, [, input]] of inputs.entries()) {
        const dims = BigInt64Array.from(input.dims.length ? input.dims : [0], BigInt);
        const value = own(result(ort.tensor, allocator, dims, input.dims.length, elementTypes[input.type]), ort.releaseTensor);
        const bytes = Buffer.from(input.data, "base64");
        if (bytes.length) {
          if (input.type === "bool" && bytes.some(v => v > 1)) throw new Error("布尔张量的元素只能为 0 或 1");
          bytes.copy(toBuffer(result(ort.tensorData, value), 0, bytes.length));
        }
        inputValues[index] = BigInt(value);
      }
      const count = result(ort.outputCount, session);
      if (!request.outputs && count > 64) throw new Error("模型输出超过 64 个，请指定需要的输出名称");
      const outputNames = request.outputs ?? Array.from({ length: count }, (_, index) => {
        const name = result(ort.outputName, session, index, allocator);
        try { return new CString(name).toString(); } finally { check(ort.free(allocator, name)); }
      });
      if (!outputNames.length) throw new Error("模型没有可读取的输出");
      const inputStrings = inputs.map(([name]) => cString(name));
      const outputStrings = outputNames.map(cString);
      const pointers = (strings: Buffer[]) => BigUint64Array.from(strings.length ? strings.map(s => BigInt(ptr(s))) : [0n]);
      const values = new BigUint64Array(outputNames.length);
      check(ort.run(session, null, pointers(inputStrings), inputValues, inputs.length, pointers(outputStrings), outputNames.length, values));
      // 保持底层 C 字符串在同步 Run 完成前均可达。
      inputStrings.length = outputStrings.length = 0;
      for (const value of values) own(Number(value), ort.releaseTensor);
      const outputs: LocalModelRunResult["outputs"] = Object.create(null);
      let totalBytes = 0;
      for (const [index, name] of outputNames.entries()) {
        const value = Number(values[index]);
        const shape = own(result(ort.shape, value), ort.releaseShape);
        const element = result(ort.tensorType, shape);
        const type = (Object.keys(elementTypes) as LocalModelTensorType[]).find(key => elementTypes[key] === element);
        if (!type) throw Object.assign(new Error("模型输出 {0} 的元素类型暂不支持"), { detail: name });
        const rank = result(ort.rank, shape);
        if (rank > 32) throw new Error("输出张量的维数超过 32");
        const dimensions = new BigInt64Array(Math.max(1, rank));
        check(ort.dimensions(shape, dimensions, rank));
        const dims = Array.from(dimensions.subarray(0, rank), Number);
        const length = dims.reduce((size, axis) => size * axis, localModelElementBytes[type] as number);
        totalBytes += length;
        if (!Number.isSafeInteger(totalBytes) || totalBytes < 0 || totalBytes > localModelTensorBytes) throw new Error("输出张量总大小超过 64 MiB");
        outputs[name] = { type, dims, data: length ? toBuffer(result(ort.tensorData, value), 0, length).toString("base64") : "" };
      }
      return { provider, outputs };
    }
    return { close, run(input: LocalModelRunRequest) {
      try { return run(input); }
      finally { releaseTo(sessionHandles); }
    } };
  } catch (error) {
    close();
    throw error;
  }
}

function describeError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : String(cause);
  const detail = cause instanceof Error && "detail" in cause && typeof cause.detail === "string" ? cause.detail.slice(-2000) : undefined;
  return { message, detail };
}

if (process.send) {
  // 一个子进程只服务同一模型版本和设备；宿主逐次发送，取消或超时会终止整个子进程。
  let session: Awaited<ReturnType<typeof createSession>> | undefined;
  process.on("message", async (input: ProcessInput) => {
    try {
      session ??= await createSession(input);
      process.send?.({ result: session.run(input.request) });
    } catch (cause) {
      process.send?.({ error: describeError(cause) });
    }
  });
  process.on("disconnect", () => { session?.close(); process.exit(0); });
} else {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
    const input: ProcessInput = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    const session = await createSession(input);
    try { process.stdout.write(JSON.stringify(session.run(input.request))); }
    finally { session.close(); }
  } catch (cause) {
    const error = describeError(cause);
    if (error.detail !== undefined) process.stdout.write(JSON.stringify(error));
    console.error(error.message);
    process.exitCode = 1;
  }
}

import {
  ACESFilmicToneMapping, Box3, DirectionalLight, Group, HemisphereLight, OrthographicCamera,
  Scene, SRGBColorSpace, Vector3, WebGLRenderer,
} from "three";
import { parseGltfModel } from "./gltfModelLoader";
import { downloadAsset, usesNativeScale, validateModel } from "./assetLibrary";
import { createPrimitive } from "./sceneViewport";
import { createModelGroup } from "./modelGeometry";
import { resolveAssetModel } from "./assetModelResolver";
import { getAssetPlacementScale } from "./assetMetadata";
import { disposeObject } from "./sceneResources";
import type { SceneAsset } from "./sceneDocument";

type ModelLoader = (asset: SceneAsset) => Promise<ArrayBuffer>;
type PreparedModel = { model: Group; roots: Group[] };
type PreviewJob = {
  key: string;
  asset: SceneAsset;
  loadModel?: ModelLoader;
  controller: AbortController;
  promise: Promise<string>;
  consumers: number;
  prepared?: PreparedModel;
  settle: (value: string | undefined, cause?: unknown) => void;
};
type ProgramState = { currentProgram?: { isReady(): boolean } };

// ACT: 一页 48 张、来回翻几页都留在内存里（160px PNG 平均约 10KB）；不保留模型或 GPU 资源。
const cacheLimit = 480;
// ACT: 每帧画完之后连续生成缩略图，直到用掉约 8ms 再让出下一帧；单张实测约 7ms（建模+渲染+编码），一帧能出 1–3 张。
const sliceBudget = 8;
// ACT: 模型文件的下载与解析不占渲染队列，最多 4 个同时进行，慢的网络素材不挡后面程序化素材的缩略图。
const downloadLimit = 4;
const previews = new Map<string, string>();
const requests = new Map<string, PreviewJob>();
const renderQueue: PreviewJob[] = [];
const downloadWaiters: (() => void)[] = [];
const loaderIds = new WeakMap<ModelLoader, number>();
let nextLoaderId = 0;
let activeDownloads = 0;
let pumping = false;
let renderState: ReturnType<typeof createRenderState> | undefined;
let idleTimer: ReturnType<typeof setTimeout> | undefined;

function createRenderState() {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(160, 160, false);
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(3, 2.2, 3);
  camera.lookAt(0, 0, 0);
  const hemisphere = new HemisphereLight("#e8f2ff", "#8b92a1", 1.8);
  const key = new DirectionalLight("#fff4e6", 2.7);
  key.position.set(4, 6, 4);
  const fill = new DirectionalLight("#d7e6ff", 1.2);
  fill.position.set(-4, 2, -2);
  scene.add(hemisphere, key, fill);
  // ACT: 160px 预览使用三灯照明，不为每次重建的离屏上下文生成整套 PMREM。
  return { renderer, scene, camera };
}

function scheduleRelease() {
  if (idleTimer) clearTimeout(idleTimer);
  // ACT: 翻页、滚动之间常有十几秒停顿；离屏上下文闲置 30 秒才释放，免得每页都重建上下文、重编着色器。
  idleTimer = setTimeout(() => {
    idleTimer = undefined;
    if (!renderState || pumping) return;
    renderState.renderer.dispose();
    renderState.renderer.forceContextLoss();
    renderState = undefined;
  }, 30000);
}

function readCached(key: string) {
  const preview = previews.get(key);
  if (preview) {
    previews.delete(key);
    previews.set(key, preview);
  }
  return preview;
}

function isProceduralAsset(asset: SceneAsset) {
  return asset.kind === "primitive" || !asset.path && !!(asset.model || asset.recipe || asset.blueprint);
}

// 等浏览器画完当前帧再开工；面板所在页面暂停动画帧时，100ms 后照常继续。
function nextSlice() {
  return new Promise<void>(resolve => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      cancelAnimationFrame(frame);
      clearTimeout(fallback);
      setTimeout(resolve, 0);
    };
    const frame = requestAnimationFrame(start);
    const fallback = setTimeout(start, 100);
  });
}

function acquireDownload(signal: AbortSignal) {
  signal.throwIfAborted();
  if (activeDownloads < downloadLimit) {
    activeDownloads++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const grant = () => {
      signal.removeEventListener("abort", abort);
      activeDownloads++;
      resolve();
    };
    const abort = () => {
      const index = downloadWaiters.indexOf(grant);
      if (index >= 0) downloadWaiters.splice(index, 1);
      reject(signal.reason);
    };
    downloadWaiters.push(grant);
    signal.addEventListener("abort", abort, { once: true });
  });
}

function releaseDownload() {
  activeDownloads--;
  downloadWaiters.shift()?.();
}

function disposePrepared(prepared?: PreparedModel) {
  if (prepared) for (const root of new Set(prepared.roots)) disposeObject(root);
}

export function getAssetPreviewKey(asset: SceneAsset, loadModel?: ModelLoader) {
  let loaderId = 0;
  if (!isProceduralAsset(asset) && loadModel) {
    if (!loaderIds.has(loadModel)) loaderIds.set(loadModel, ++nextLoaderId);
    loaderId = loaderIds.get(loadModel)!;
  }
  return JSON.stringify([asset.id, asset.kind, asset.shape, asset.url, asset.path, asset.sha256 ?? asset.kiln?.glbSha256, asset.bytes,
    asset.path ? undefined : [asset.model, asset.recipe, asset.blueprint], usesNativeScale(asset), asset.provider, asset.name, asset.tags, asset.category, asset.itemType, loaderId]);
}

// 只在确有着色器还在后台编译时才轮询：three 的 compileAsync 在缺少并行编译扩展时，
// 即使着色器早已编译过也固定先等 10ms，几十张缩略图累计就是好几百毫秒的空等。
async function compilePreview(state: NonNullable<typeof renderState>, signal: AbortSignal) {
  const materials = state.renderer.compile(state.scene, state.camera);
  const compiling = () => [...materials].some(material => (state.renderer.properties.get(material) as ProgramState | undefined)?.currentProgram?.isReady() === false);
  while (compiling()) {
    await new Promise(resolve => setTimeout(resolve, 8));
    signal.throwIfAborted();
  }
}

async function renderJob(job: PreviewJob) {
  const { asset } = job;
  const signal = job.controller.signal;
  const prepared = job.prepared;
  job.prepared = undefined;
  let model: Group;
  let roots: Group[];
  if (prepared) ({ model, roots } = prepared);
  else if (asset.kind === "primitive") {
    model = createPrimitive(asset, "#bac5d3");
    roots = [model];
  } else {
    model = createModelGroup(resolveAssetModel(asset)!, signal);
    roots = [model];
  }
  const frame = new Group();
  frame.add(model);
  try {
    signal.throwIfAborted();
    const bounds = new Box3().setFromObject(model, true);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const radius = size.length() / 2;
    if (bounds.isEmpty() || !Number.isFinite(radius) || radius < 1e-8) throw new Error("模型没有可预览的几何体");
    model.position.sub(center);
    const placementScale = asset.kind === "model" && !usesNativeScale(asset) ? getAssetPlacementScale(asset, size) : 1;
    frame.scale.setScalar(placementScale);
    frame.updateMatrixWorld(true);
    const state = renderState ??= createRenderState();
    state.scene.add(frame);
    try {
      const sceneRadius = radius * placementScale;
      state.camera.position.set(3, 2.2, 3).normalize().multiplyScalar(sceneRadius * 3);
      state.camera.near = sceneRadius * 0.01;
      state.camera.far = sceneRadius * 6;
      state.camera.lookAt(0, 0, 0);
      state.camera.updateMatrixWorld(true);
      const projected = new Box3().setFromObject(frame, true).applyMatrix4(state.camera.matrixWorldInverse);
      const extent = Math.max(Math.abs(projected.min.x), Math.abs(projected.max.x), Math.abs(projected.min.y), Math.abs(projected.max.y)) * 1.16;
      state.camera.left = state.camera.bottom = -extent;
      state.camera.right = state.camera.top = extent;
      state.camera.updateProjectionMatrix();
      await compilePreview(state, signal);
      signal.throwIfAborted();
      state.renderer.render(state.scene, state.camera);
      return state.renderer.domElement.toDataURL("image/png");
    } finally {
      state.scene.remove(frame);
      state.renderer.renderLists.dispose();
    }
  } finally {
    disposePrepared({ model, roots });
  }
}

async function pump() {
  if (pumping) return;
  pumping = true;
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  }
  try {
    while (renderQueue.length) {
      await nextSlice();
      const sliceStart = performance.now();
      let job: PreviewJob | undefined;
      while ((job = renderQueue.shift())) {
        try {
          const preview = await renderJob(job);
          if (!job.controller.signal.aborted) {
            previews.set(job.key, preview);
            if (previews.size > cacheLimit) previews.delete(previews.keys().next().value!);
          }
          job.settle(preview);
        } catch (cause) {
          job.settle(undefined, cause);
        }
        if (performance.now() - sliceStart >= sliceBudget) break;
      }
    }
  } finally {
    pumping = false;
    scheduleRelease();
  }
}

function enqueue(job: PreviewJob) {
  renderQueue.push(job);
  void pump();
}

async function prepareFile(job: PreviewJob) {
  const { asset, loadModel } = job;
  const signal = job.controller.signal;
  try {
    await acquireDownload(signal);
    try {
      const content = loadModel ? await loadModel(asset) : await downloadAsset(asset, signal);
      signal.throwIfAborted();
      validateModel(content);
      const gltf = await parseGltfModel(content, undefined, signal);
      const prepared = { model: gltf.scene, roots: gltf.scenes };
      if (signal.aborted) {
        disposePrepared(prepared);
        return;
      }
      job.prepared = prepared;
      enqueue(job);
      // 画完才让出下载名额，避免解析好的模型在内存里越积越多。
      await job.promise.catch(() => undefined);
    } finally {
      releaseDownload();
    }
  } catch (cause) {
    job.settle(undefined, cause);
  }
}

function createJob(key: string, asset: SceneAsset, loadModel?: ModelLoader) {
  const controller = new AbortController();
  let resolve!: (value: string) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<string>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  promise.catch(() => undefined);
  let settled = false;
  const job: PreviewJob = {
    key, asset, loadModel, controller, promise, consumers: 0,
    settle(value, cause) {
      if (settled) return;
      settled = true;
      if (requests.get(key) === job) requests.delete(key);
      const index = renderQueue.indexOf(job);
      if (index >= 0) renderQueue.splice(index, 1);
      disposePrepared(job.prepared);
      job.prepared = undefined;
      if (value !== undefined) resolve(value);
      else reject(cause);
    },
  };
  controller.signal.addEventListener("abort", () => job.settle(undefined, controller.signal.reason), { once: true });
  return job;
}

export function getAssetPreview(asset: SceneAsset, loadModel?: ModelLoader, signal?: AbortSignal): Promise<string> {
  const key = getAssetPreviewKey(asset, loadModel);
  signal?.throwIfAborted();
  const cached = readCached(key);
  if (cached) return Promise.resolve(cached);
  // ACT: 单一离屏上下文按帧预算批量生成缩略图；看不见的卡片取消后立即出队。
  let job = requests.get(key);
  if (!job) {
    job = createJob(key, asset, loadModel);
    requests.set(key, job);
    if (isProceduralAsset(asset)) enqueue(job);
    else void prepareFile(job);
  }
  const current = job;
  current.consumers++;
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const finish = () => {
      if (settled) return false;
      settled = true;
      signal?.removeEventListener("abort", abort);
      current.consumers--;
      return true;
    };
    const abort = () => {
      if (!finish()) return;
      if (!current.consumers) current.controller.abort();
      reject(signal?.reason);
    };
    signal?.addEventListener("abort", abort, { once: true });
    current.promise.then(value => { if (finish()) resolve(value); }, cause => { if (finish()) reject(cause); });
  });
}

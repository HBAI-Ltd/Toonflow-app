import { createSceneViewport } from "./sceneViewport";
import type { SceneAsset, SceneDocument } from "./sceneDocument";
import type { AgentToolResult } from "./singleAgent";

export function createSceneObserver(loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>, signal: AbortSignal) {
  let canvas: HTMLCanvasElement | undefined;
  let viewport: ReturnType<typeof createSceneViewport> | undefined;
  let currentSignature = "";
  let viewportError = "";
  let disposed = false;
  let pending: Promise<unknown> = Promise.resolve();

  function releaseViewport() {
    viewport?.dispose();
    viewport = undefined;
    canvas?.remove();
    canvas = undefined;
    currentSignature = "";
    viewportError = "";
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    signal.removeEventListener("abort", dispose);
    releaseViewport();
  }
  signal.addEventListener("abort", dispose, { once: true });

  function read<T>(document: SceneDocument, operationSignal: AbortSignal | undefined, consume: (value: ReturnType<typeof createSceneViewport>, operation: AbortSignal) => T | Promise<T>): Promise<T> {
    const operation = operationSignal ? AbortSignal.any([signal, operationSignal]) : signal;
    const result = pending.then(async () => {
      operation.throwIfAborted();
      if (disposed) throw new Error("场景观察会话已结束");
      let rejectAborted: (reason: unknown) => void = () => {};
      const aborted = new Promise<never>((_resolve, reject) => { rejectAborted = reject; });
      const abort = () => { rejectAborted(operation.reason); dispose(); };
      operation.addEventListener("abort", abort, { once: true });
      try {
        const signature = JSON.stringify(document);
        if (!viewport) {
          canvas = window.document.createElement("canvas");
          Object.assign(canvas.style, { position: "fixed", left: "-10000px", top: "0", width: "960px", height: "540px", pointerEvents: "none" });
          canvas.setAttribute("aria-hidden", "true");
          window.document.body.append(canvas);
          viewport = createSceneViewport(canvas, {
            document: { ...document, gridVisible: false }, loadModel, showHelpers: false, pixelRatio: 1, autoRender: false, globalFilmFormat: false,
            onSelect: () => {}, onTransform: () => {},
            onViewChange: () => {}, onError: message => { viewportError = message; },
          });
        } else if (signature !== currentSignature) viewport.sync({ ...document, gridVisible: false });
        await Promise.race([viewport.whenReady(), aborted]);
        operation.throwIfAborted();
        if (viewportError) throw new Error(viewportError);
        currentSignature = signature;
        const value = await Promise.race([Promise.resolve(consume(viewport, operation)), aborted]);
        if (viewportError) throw new Error(viewportError);
        return value;
      } catch (error) {
        releaseViewport();
        throw error;
      } finally { operation.removeEventListener("abort", abort); }
    });
    pending = result.catch(() => {});
    return result;
  }
  return {
    inspect: (document: SceneDocument, operationSignal?: AbortSignal) => read(document, operationSignal, value => value.getLifePlanningContext()),
    observe: (document: SceneDocument, operationSignal?: AbortSignal) => read(document, operationSignal, (value, operation) => captureObservation(value, document, operation)),
    dispose,
  };
}

export async function inspectLifeScene(document: SceneDocument, loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>, signal: AbortSignal) {
  const observer = createSceneObserver(loadModel, signal);
  try { return await observer.inspect(document); } finally { observer.dispose(); }
}

export async function observeScene(document: SceneDocument, loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>, signal: AbortSignal): Promise<AgentToolResult> {
  const observer = createSceneObserver(loadModel, signal);
  try { return await observer.observe(document); } finally { observer.dispose(); }
}

async function captureObservation(viewport: ReturnType<typeof createSceneViewport>, document: SceneDocument, signal: AbortSignal): Promise<AgentToolResult> {
  const captured = await viewport.capture();
  const terrainQuality = viewport.getTerrainRenderQuality();
  // 载入并落地后的真实摆放：互相穿插的物体和被托在半空的物体，Agent据此平移修正。
  const placement = viewport.getPlacementReport();
  // 导航后走不到的动线路径点（比如点落在楼下地面、屋顶上，或楼梯门洞不通）。
  const routes = viewport.getRouteReport();
  const terrainNotice = terrainQuality === "basic" ? "当前设备使用轻量地貌材质，本图可核对布局与颜色，不能作为精细凹凸和反光效果的验收。" : undefined;
  const bitmap = await createImageBitmap(captured);
  try {
    signal.throwIfAborted();
    const output = window.document.createElement("canvas");
    const ratio = Math.min(1, 960 / bitmap.width, 720 / bitmap.height);
    output.width = Math.round(bitmap.width * ratio);
    output.height = Math.round(bitmap.height * ratio);
    const context = output.getContext("2d");
    if (!context) throw new Error("无法创建 Agent 场景观察画布");
    context.drawImage(bitmap, 0, 0, output.width, output.height);
    const data = output.toDataURL("image/jpeg", 0.85).split(",")[1];
    if (!data || data.length > 2 * 1024 * 1024) throw new Error("场景观察图片超过大小限制");
    signal.throwIfAborted();
    return {
      content: [
        { type: "text", text: JSON.stringify({ loaded: true, source: "browserWebGl", terrainQuality, terrainNotice, width: output.width, height: output.height, visibleObjects: document.objects.filter(object => object.visible).length, placement, routes, lifeStatus: viewport.getLifeStatus() }) },
        { type: "image", data, mimeType: "image/jpeg" },
      ],
      details: { loaded: true, source: "browserWebGl", terrainQuality, terrainNotice, placement, routes, lifeStatus: viewport.getLifeStatus() },
    };
  } finally { bitmap.close(); }
}

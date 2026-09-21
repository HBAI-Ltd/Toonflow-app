import { createStage, disposeStage, type LightingSettings, type SceneDocument, type SceneSettings } from "./scene";
import { applyCamera, prepareMotion, sampleMotion, type CameraAnchor } from "./motion";
import { prepareSceneAnimation, type DirectorPlan } from "./sceneAnimation";

export async function renderImage(scene: SceneDocument, anchor: CameraAnchor, aspect: number, time: number, signal: AbortSignal, plan?: DirectorPlan, lighting?: LightingSettings, settings?: SceneSettings) {
  signal.throwIfAborted();
  const runtime = await createStage(document.createElement("canvas"), scene, undefined, aspect, lighting, settings);
  let player: ReturnType<typeof prepareSceneAnimation> | undefined;
  try {
    signal.throwIfAborted();
    if (plan) { player = prepareSceneAnimation(runtime, plan); player.setTime(time); }
    applyCamera(runtime.camera, anchor);
    runtime.renderer.render(runtime.scene, runtime.camera);
    const blob = await new Promise<Blob>((resolve, reject) => runtime.renderer.domElement.toBlob(
      value => value ? resolve(value) : reject(new Error("关键帧渲染失败")), "image/png",
    ));
    signal.throwIfAborted();
    return new File([blob], "关键帧.png", { type: "image/png" });
  } finally { player?.dispose(); disposeStage(runtime); }
}

export async function renderVideo(scene: SceneDocument, plan: DirectorPlan, aspect: number, signal: AbortSignal, onProgress: (value: number) => void, lighting?: LightingSettings, settings?: SceneSettings) {
  signal.throwIfAborted();
  const mimeType = typeof MediaRecorder !== "undefined" && ["video/mp4;codecs=avc1.420028", "video/mp4"].find(type => MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error("当前浏览器不支持 MP4 导出，请更新浏览器或桌面 WebView2 运行时");
  if (document.hidden) throw new Error("请在当前窗口保持可见时导出视频");
  const runtime = await createStage(document.createElement("canvas"), scene, undefined, aspect, lighting, settings);
  let player: ReturnType<typeof prepareSceneAnimation> | undefined;
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  let frame = 0;
  let cancel = () => {};
  let checkVisibility = () => {};
  const chunks: Blob[] = [];
  try {
    signal.throwIfAborted();
    player = prepareSceneAnimation(runtime, plan);
    const cameraFrames = prepareMotion(plan.cameraFrames);
    function draw(time: number) {
      player!.setTime(time);
      sampleMotion(runtime.camera, cameraFrames, time);
      runtime.renderer.render(runtime.scene, runtime.camera);
    }
    draw(0);
    stream = runtime.renderer.domElement.captureStream(30);
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 });
    await new Promise<void>((resolve, reject) => {
      let failure: unknown;
      let size = 0;
      const stop = (error?: unknown) => {
        failure ??= error;
        window.clearTimeout(frame);
        if (recorder!.state !== "inactive") recorder!.stop();
        else if (error) reject(error);
      };
      cancel = () => stop(signal.reason);
      checkVisibility = () => { if (document.hidden) stop(new Error("窗口已隐藏，视频导出已停止，请保持窗口可见后重试")); };
      recorder!.ondataavailable = event => {
        if (event.data.size) chunks.push(event.data);
        size += event.data.size;
        if (size > 100 * 1024 * 1024) stop(new Error("导出视频超过 100 MB，请缩短动画时长"));
      };
      recorder!.onerror = () => stop(new Error("MP4 编码失败，请重试"));
      recorder!.onstop = () => failure ? reject(failure) : resolve();
      signal.addEventListener("abort", cancel, { once: true });
      document.addEventListener("visibilitychange", checkVisibility);
      // ACT: 使用浏览器原生录制，导出耗时约等于动画时长；离线逐帧编码需换用 WebCodecs 和 MP4 封装器。
      recorder!.start(1000);
      const started = performance.now();
      const renderFrame = () => {
        const now = performance.now();
        try {
          signal.throwIfAborted();
          const time = Math.min(plan.duration, (now - started) / 1000);
          draw(time); onProgress(Math.min(99, Math.floor(time / plan.duration * 100)));
          if (time >= plan.duration) stop();
          // ACT: 每帧后至少让出 8ms 给输入和弹窗动画，慢设备降低帧率而不追帧。
          else frame = window.setTimeout(renderFrame, Math.max(8, 1000 / 30 - (performance.now() - now)));
        } catch (error) { stop(error); }
      };
      frame = window.setTimeout(renderFrame, 0);
    });
    signal.throwIfAborted();
    const file = new File(chunks, `${plan.name}.mp4`, { type: "video/mp4" });
    if (!file.size) throw new Error("未能生成视频内容");
    return file;
  } finally {
    window.clearTimeout(frame);
    signal.removeEventListener("abort", cancel);
    document.removeEventListener("visibilitychange", checkVisibility);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach(track => track.stop());
    player?.dispose(); disposeStage(runtime);
  }
}

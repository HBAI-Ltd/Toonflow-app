import { dlopen, ptr } from "bun:ffi";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export function createSplashPlayer(assetDir: string, width: number, height: number, pixels: Uint8Array) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) throw new Error("启动画面尺寸无效");
  if (pixels.byteLength !== width * height * 4) throw new Error("启动画布尺寸不匹配");
  const libraryPath = process.platform === "win32" && process.arch === "x64" ? "windowsX64/thorvg.dll"
    : process.platform === "darwin" && process.arch === "x64" ? "macX64/libthorvg.dylib"
    : process.platform === "darwin" && process.arch === "arm64" ? "macArm64/libthorvg.dylib" : undefined;
  if (!libraryPath) throw new Error(`当前平台不支持原生启动动画：${process.platform}/${process.arch}`);
  const library = dlopen(resolve(assetDir, libraryPath), {
    tvg_engine_init: { args: ["u32"], returns: "i32" },
    tvg_engine_term: { args: [], returns: "i32" },
    tvg_animation_new: { args: [], returns: "ptr" },
    tvg_animation_get_picture: { args: ["ptr"], returns: "ptr" },
    tvg_animation_get_total_frame: { args: ["ptr", "ptr"], returns: "i32" },
    tvg_animation_get_duration: { args: ["ptr", "ptr"], returns: "i32" },
    tvg_animation_set_frame: { args: ["ptr", "f32"], returns: "i32" },
    tvg_animation_del: { args: ["ptr"], returns: "i32" },
    tvg_picture_load_data: { args: ["ptr", "ptr", "u32", "ptr", "ptr", "bool"], returns: "i32" },
    tvg_picture_set_size: { args: ["ptr", "f32", "f32"], returns: "i32" },
    tvg_swcanvas_create: { args: ["i32"], returns: "ptr" },
    tvg_swcanvas_set_target: { args: ["ptr", "ptr", "u32", "u32", "u32", "i32"], returns: "i32" },
    tvg_canvas_add: { args: ["ptr", "ptr"], returns: "i32" },
    tvg_canvas_update: { args: ["ptr"], returns: "i32" },
    tvg_canvas_draw: { args: ["ptr", "bool"], returns: "i32" },
    tvg_canvas_sync: { args: ["ptr"], returns: "i32" },
    tvg_canvas_destroy: { args: ["ptr"], returns: "i32" },
  });
  const tvg = library.symbols;
  const disposals: (() => void)[] = [() => library.close()];
  let isClosed = false;

  function check(status: number) {
    if (status) throw new Error(`Lottie 启动动画播放失败：${status}`);
  }
  function close() {
    if (isClosed) return;
    isClosed = true;
    for (const dispose of disposals.reverse()) dispose();
  }

  try {
    check(tvg.tvg_engine_init(0));
    disposals.push(() => { tvg.tvg_engine_term(); });
    const animation = tvg.tvg_animation_new();
    if (!animation) throw new Error("无法创建 Lottie 动画");
    disposals.push(() => { tvg.tvg_animation_del(animation); });
    const picture = tvg.tvg_animation_get_picture(animation);
    const data = readFileSync(join(assetDir, "startup.json"));
    if (!data.length) throw new Error("启动动画文件为空");
    check(tvg.tvg_picture_load_data(picture, ptr(data), data.length, ptr(Buffer.from("lot\0")), null, true));
    check(tvg.tvg_picture_set_size(picture, width, height));
    const total = new Float32Array(1), duration = new Float32Array(1);
    check(tvg.tvg_animation_get_total_frame(animation, ptr(total)));
    check(tvg.tvg_animation_get_duration(animation, ptr(duration)));
    if (!Number.isFinite(total[0]) || total[0]! <= 0 || !Number.isFinite(duration[0]) || duration[0]! <= 0) throw new Error("启动动画帧数或时长无效");
    const definition = JSON.parse(data.toString()) as { fr: number; markers?: { cm: string; tm: number; dr: number }[] };
    if (!Number.isFinite(definition.fr) || definition.fr <= 0) throw new Error("启动动画帧率无效");
    function getSegment(name: string) {
      const segment = definition.markers?.find((marker) => marker.cm === name);
      if (!segment || !Number.isFinite(segment.tm) || !Number.isFinite(segment.dr) || segment.tm < 0 || segment.dr <= 0 || segment.tm + segment.dr > total[0]!) throw new Error(`启动动画缺少有效的 ${name} 阶段`);
      return segment;
    }
    const loading = getSegment("loading"), ready = getSegment("ready");
    const frameDelay = 1000 / definition.fr;
    const loopDuration = loading.dr * frameDelay;
    // ACT: 页面已就绪时保留完整收尾帧，但最多播放 600ms，避免额外等待原动画的 2.2 秒。
    const readyDuration = Math.min(ready.dr * frameDelay, 600);
    const readyFrameDelay = readyDuration / ready.dr;
    let readyAt = Infinity;
    const canvas = tvg.tvg_swcanvas_create(1);
    if (!canvas) throw new Error("无法创建 Lottie 画布");
    disposals.push(() => { tvg.tvg_canvas_destroy(canvas); });
    // ARGB8888 在小端平台内存中为预乘 BGRA；stride 单位是像素。
    check(tvg.tvg_swcanvas_set_target(canvas, ptr(pixels), width, width, height, 1));
    check(tvg.tvg_canvas_add(canvas, picture));

    // ACT: 播放时间仅由平台层的 performance.now() 差值传入。
    function draw(elapsedMs: number) {
      if (isClosed) throw new Error("启动动画已关闭");
      const readyElapsed = elapsedMs - readyAt;
      const frameIndex = readyElapsed < 0
        ? loading.tm + elapsedMs % loopDuration / frameDelay
        : Math.min(ready.tm + readyElapsed / readyFrameDelay, ready.tm + ready.dr - 1);
      const status = tvg.tvg_animation_set_frame(animation, frameIndex);
      if (status !== 2) check(status); // 同帧或差值不足 0.001 时返回 InsufficientCondition。
      check(tvg.tvg_canvas_update(canvas));
      check(tvg.tvg_canvas_draw(canvas, true));
      check(tvg.tvg_canvas_sync(canvas));
      return readyElapsed >= readyDuration;
    }
    return {
      pixels, // 保持调用方画布的引用，直到播放器释放原生画布。
      draw,
      finish(elapsedMs: number) {
        if (isClosed) return;
        // 与原 loading 页一致：就绪后立即停止描边并填充，重复通知不重播。
        if (readyAt === Infinity) readyAt = elapsedMs;
      },
      close,
    };
  } catch (error) {
    close();
    throw error;
  }
}

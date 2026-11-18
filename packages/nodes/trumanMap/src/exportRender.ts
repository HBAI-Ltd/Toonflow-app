// ACT: 导出用的渲染：场景微缩图、每镜场景四视图、白模视频片段和预演小样（一次渲染两路编码）。只读场景，画面都按成片画幅出。
import type { createSceneViewport } from "./sceneViewport";
import type { SceneDocument, Vector3Value } from "./sceneDocument";
import { describeCameraAngle, filmAspect, getCameraFov, getCameraShotAt, getFilmSize, type CameraFraming, type SceneCamera } from "./cameraDocument";
import { describeShotSize } from "./shotList";
import { createPrevisRecorder, type PrevisRecorder, type PrevisVideo } from "./previsVideo";
import { composeImageGrid } from "./exportBundle";

type Viewport = ReturnType<typeof createSceneViewport>;
export type ProgramSegment = { start: number; end: number; cameraId: string };
export type ProgramPlan = { cameras: SceneCamera[]; range: { start: number; end: number }; segments: ProgramSegment[] };
export const previsFps = 24;
const isPerson = (shape?: string) => /person/i.test(shape ?? "");

/**
 * ACT: 场景微缩图：整个场景的鸟瞰全貌（人物在第一镜时的位置），从第一镜机位那一侧斜俯拍38°、35mm，按全部陈设、人物和机位的范围取景。
 * 大场景（城市、整片地图）超过150米时只框镜头拍到的这一片：人物、机位和注视点外扩15米，以及压在这片里的陈设。
 */
export async function captureOverview(viewport: Viewport, scene: SceneDocument, plan: ProgramPlan, width: number) {
  const first = plan.segments[0]!;
  const middle = (first.start + first.end) / 2;
  viewport.seekPerformance(plan.range.start + middle, "start");
  viewport.seekPerformance(plan.range.start + middle, "end");
  await viewport.whenReady();
  const camera = plan.cameras.find(item => item.id === first.cameraId);
  const pose = camera && (viewport.getCameraPose(camera.id) ?? getCameraShotAt(camera, middle)?.frame ?? camera.frame);
  const action: Vector3Value[] = [];
  for (const object of scene.objects) if (object.visible && isPerson(object.asset.shape)) action.push(viewport.getSubjectPosition({ objectId: object.id, mode: "aim" }) ?? object.position);
  for (const item of plan.cameras) for (const frame of [item.frame, ...(item.shots ?? []).map(shot => shot.frame)]) if (frame) action.push(frame.position, frame.target);
  type Box = { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  const boxes: Box[] = scene.objects.filter(object => object.visible && !isPerson(object.asset.shape) && !object.asset.id.startsWith("brushPaving")).flatMap(object => {
    const { center, size } = viewport.getBounds(object.id);
    // 天空罩、整片地貌这类超大物件不算进取景范围。
    if (!(size.x < 400 && size.z < 400)) return [];
    return [{ minX: center.x - size.x / 2, maxX: center.x + size.x / 2, minY: center.y - size.y / 2, maxY: center.y + size.y / 2, minZ: center.z - size.z / 2, maxZ: center.z + size.z / 2 }];
  });
  const pointBox = (point: Vector3Value): Box => ({ minX: point.x, maxX: point.x, minY: point.y, maxY: point.y, minZ: point.z, maxZ: point.z });
  const union = (items: Box[]) => items.reduce<Box | undefined>((all, item) => all ? { minX: Math.min(all.minX, item.minX), maxX: Math.max(all.maxX, item.maxX), minY: Math.min(all.minY, item.minY), maxY: Math.max(all.maxY, item.maxY), minZ: Math.min(all.minZ, item.minZ), maxZ: Math.max(all.maxZ, item.maxZ) } : { ...item }, undefined);
  const people = action.map(pointBox);
  let bounds = union([...boxes, ...people]);
  if (!bounds) return undefined;
  if (Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) > 150) {
    const area = union(people)!;
    const margin = 15;
    const near = boxes.filter(box => box.maxX > area.minX - margin && box.minX < area.maxX + margin && box.maxZ > area.minZ - margin && box.minZ < area.maxZ + margin)
      .map(box => ({ ...box, minX: Math.max(box.minX, area.minX - margin), maxX: Math.min(box.maxX, area.maxX + margin), minZ: Math.max(box.minZ, area.minZ - margin), maxZ: Math.min(box.maxZ, area.maxZ + margin) }));
    bounds = union([...near, ...people])!;
  }
  const center = { x: (bounds.minX + bounds.maxX) / 2, y: bounds.minY + (bounds.maxY - bounds.minY) * 0.3, z: (bounds.minZ + bounds.maxZ) / 2 };
  const radius = Math.max(4, Math.hypot(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ) / 2);
  const azimuth = pose ? Math.atan2(pose.position.x - pose.target.x, pose.position.z - pose.target.z) : Math.PI / 4;
  const elevation = 38 * Math.PI / 180, focalLength = 35;
  const vertical = getCameraFov(focalLength) * Math.PI / 180, horizontal = 2 * Math.atan(Math.tan(vertical / 2) * filmAspect);
  const distance = radius / Math.sin(Math.min(vertical, horizontal) / 2) * 0.92;
  const position = { x: center.x + Math.sin(azimuth) * Math.cos(elevation) * distance, y: center.y + Math.sin(elevation) * distance, z: center.z + Math.cos(azimuth) * Math.cos(elevation) * distance };
  return viewport.capture({ position, target: center, focalLength }, width, "image/jpeg");
}

/**
 * ACT: 这一镜的场景四视图：以这一镜的主体（跟拍的人；没有就是机位注视点）为中心，从机位那一侧（前）、右、后（反打一侧）、左四个方向斜俯拍24mm，
 * 范围按机位到主体的距离定（周围至少4米、最多18米）。拼成2×2一张。调用前场景已经定位在这一镜的时刻（和关键帧同一时刻）。
 * 室内：先平着量这个方向离墙多远，机位放在墙里侧（不跑到墙外隔着墙沿往下看），推近了换广角；
 * 再看看得见主体、画面下沿也没被墙挡（不然半张图是墙沿），不行就抬高一档；都不行取看得见主体的那个，推到遮挡物里侧。
 */
export async function captureFourViews(viewport: Viewport, scene: SceneDocument, pose: CameraFraming, focus: Vector3Value, longEdge: number, options: { signal?: AbortSignal; step?: () => Promise<void> } = {}) {
  const { signal } = options;
  const azimuth = Math.atan2(pose.position.x - focus.x, pose.position.z - focus.z);
  const reach = Math.min(18, Math.max(4, Math.hypot(pose.position.x - focus.x, pose.position.z - focus.z)));
  const center = { x: focus.x, y: focus.y - 0.35, z: focus.z };
  // 人不算遮挡：主体自己、旁边的群演挡一下没关系。
  const people = scene.objects.filter(object => isPerson(object.asset.shape)).map(object => object.id);
  const distance = reach * 1.7, lens = 24, floor = center.y - 0.9;
  const views: { blob: Blob; label: string }[] = [];
  for (const [step, label] of ["前", "右", "后", "左"].entries()) {
    const angle = azimuth + step * Math.PI / 2;
    const ux = Math.sin(angle), uz = Math.cos(angle);
    const wall = viewport.sightBlocked(center, { x: center.x + ux * distance, y: center.y, z: center.z + uz * distance }, people);
    const room = wall === undefined ? Infinity : Math.max(1.2, wall - 0.4);
    let chosen: { position: Vector3Value; focalLength: number } | undefined, fallback: { position: Vector3Value; focalLength: number; hit: number } | undefined;
    for (const degrees of [24, 36, 50]) {
      const elevation = degrees * Math.PI / 180;
      const full = distance * Math.cos(elevation), horizontal = Math.min(full, room);
      const position = { x: center.x + ux * horizontal, y: center.y + Math.tan(elevation) * horizontal, z: center.z + uz * horizontal };
      // 推近了换广角，尽量还拍得下周围。
      const focalLength = Math.max(12, lens * Math.max(0.5, horizontal / full));
      const hit = viewport.sightBlocked(center, position, people);
      if (hit !== undefined) {
        if (!fallback || fallback.hit < hit) fallback = { position, focalLength, hit };
        continue;
      }
      // 画面下沿那条视线落到地面的点：被墙、栏杆挡住就说明下半截是墙。
      const half = getCameraFov(focalLength) * Math.PI / 360, down = elevation + half;
      const along = down < Math.PI / 2 - 0.01 ? (position.y - floor) / Math.tan(down) : 0;
      const bottom = along < horizontal - 0.2 ? viewport.sightBlocked({ x: position.x - ux * along, y: floor + 0.2, z: position.z - uz * along }, position, people) : undefined;
      if (bottom === undefined) { chosen = { position, focalLength }; break; }
      chosen ??= { position, focalLength };
    }
    if (!chosen && fallback) {
      const ratio = Math.max(1.2, fallback.hit - 0.3) / Math.hypot(fallback.position.x - center.x, fallback.position.y - center.y, fallback.position.z - center.z);
      chosen = { position: { x: center.x + (fallback.position.x - center.x) * ratio, y: center.y + (fallback.position.y - center.y) * ratio, z: center.z + (fallback.position.z - center.z) * ratio }, focalLength: Math.max(12, fallback.focalLength * Math.max(0.5, ratio)) };
    }
    signal?.throwIfAborted();
    views.push({ blob: await viewport.capture({ ...chosen!, target: center }, Math.round(longEdge / 2), "image/jpeg"), label });
    await options.step?.();
  }
  return composeImageGrid(views, 2);
}

/** 视频要渲染多少帧：带预演小样时整片每一帧都渲染；只要白模片段时只渲染镜头段里的帧（黑场跳过）。 */
export function countVideoFrames({ range, segments }: ProgramPlan, previs: boolean) {
  const total = Math.max(1, Math.ceil((range.end - range.start) * previsFps));
  if (previs) return total;
  let count = 0;
  for (let index = 0; index < total; index++) { const time = index / previsFps; if (segments.some(segment => time >= segment.start && time < segment.end)) count++; }
  return count;
}

/**
 * ACT: 白模视频（每镜一段）和预演小样（整片）一起渲染：每帧只渲染一次。干净画面交给这一镜的片段（不带字幕，直接做视频参考）；
 * 叠上镜号·景别·焦段、时间码、台词字幕、开头场记板、首尾淡入淡出交给整片预演小样。帧时间按帧号给，渲染慢不会变成慢动作。
 */
export async function renderProgramVideos(viewport: Viewport, plan: ProgramPlan, options: { longEdge: number; previs: boolean; clips: boolean; slate: { title: string; detail: string }; signal: AbortSignal; step: (frame: HTMLCanvasElement, shotIndex: number) => Promise<void> }) {
  const { cameras, range, segments } = plan;
  const duration = range.end - range.start;
  const { width, height } = getFilmSize(options.longEdge);
  const total = Math.max(1, Math.ceil(duration * previsFps));
  const frame = document.createElement("canvas");
  const output = Object.assign(document.createElement("canvas"), { width, height });
  const context = output.getContext("2d", { alpha: false })!;
  const timecode = (seconds: number) => { const frames = Math.round(seconds * previsFps); const pad = (value: number) => String(value).padStart(2, "0"); return `${pad(Math.floor(frames / previsFps / 3600))}:${pad(Math.floor(frames / previsFps / 60) % 60)}:${pad(Math.floor(frames / previsFps) % 60)}:${pad(frames % previsFps)}`; };
  // 字幕按画面宽度折行，最多两行。
  const wrap = (value: string, max: number) => { const lines: string[] = []; let line = ""; for (const char of value) { if (context.measureText(line + char).width > max && line) { lines.push(line); line = ""; } line += char; } if (line) lines.push(line); return lines.length > 2 ? [lines[0]!, lines[1]!.slice(0, -1) + "…"] : lines; };
  let previs: PrevisRecorder | undefined;
  let clip: { index: number; recorder: PrevisRecorder; frames: number } | undefined;
  const clips: { index: number; video: PrevisVideo }[] = [];
  const finishClip = async () => { if (!clip) return; const done = clip; clip = undefined; try { clips.push({ index: done.index, video: await done.recorder.finish() }); } finally { done.recorder.close(); } };
  try {
    if (options.previs) previs = await createPrevisRecorder(width, height, previsFps);
    const animationBase = performance.now() / 1000;
    const unit = Math.min(width, height) / 720;
    for (let index = 0; index < total; index++) {
      options.signal.throwIfAborted();
      const time = index / previsFps;
      const shotIndex = segments.findIndex(segment => time >= segment.start && time < segment.end);
      const segment = segments[shotIndex];
      const camera = segment && cameras.find(item => item.id === segment.cameraId);
      // 只要白模片段时，黑场（没有镜头覆盖的时段）不用渲染。
      if (!camera && !previs) continue;
      // 只定位一次（"end"）：先 start 再 end 两次重算演绎，结果一样，白花一倍时间。
      viewport.seekPerformance(range.start + time, "end");
      let label = "黑场", note = "";
      if (camera) {
        const shot = getCameraShotAt(camera, time);
        const pose = viewport.getCameraPose(camera.id) ?? shot?.frame ?? camera.frame;
        await viewport.captureCanvas(pose, options.longEdge, frame, animationBase + time);
        if (options.clips) {
          if (clip?.index !== shotIndex) { await finishClip(); clip = { index: shotIndex, recorder: await createPrevisRecorder(width, height, previsFps), frames: 0 }; }
          await clip.recorder.add(frame, clip.frames++);
        }
        const angle = describeCameraAngle(pose);
        label = `第${shotIndex + 1}镜  ${describeShotSize(camera, pose.focalLength)}${angle === "平视" ? "" : "·" + angle}  ${Math.round(pose.focalLength)}mm`;
        note = shot?.note ?? "";
      }
      if (previs) {
        context.fillStyle = "#000"; context.fillRect(0, 0, width, height);
        if (camera) context.drawImage(frame, 0, 0, width, height);
        // 开头0.5秒从黑场淡入、结尾0.5秒淡出到黑场（动态分镜惯例），中间镜头之间仍是硬切。
        const fade = Math.min(1, time / 0.5, (duration - time) / 0.5);
        if (fade < 1) { context.fillStyle = `rgba(0,0,0,${(1 - Math.max(0, fade)).toFixed(3)})`; context.fillRect(0, 0, width, height); }
        // 场记板：开头1.5秒居中叠“成套景 · 日夜内外天气 / 画幅 · 镜头数”，1秒后淡出，交给别人看时一开头就知道是哪场戏。
        if (time < 1.5) {
          context.save();
          context.globalAlpha = 1 - Math.max(0, (time - 1) / 0.5);
          context.fillStyle = "rgba(0,0,0,0.45)"; context.fillRect(0, height / 2 - 70 * unit, width, 140 * unit);
          context.fillStyle = "#fff"; context.textAlign = "center"; context.textBaseline = "middle"; context.shadowBlur = 0;
          context.font = `600 ${Math.round(34 * unit)}px system-ui, "Microsoft YaHei", sans-serif`;
          context.fillText(options.slate.title, width / 2, height / 2 - 18 * unit, width * 0.9);
          context.font = `500 ${Math.round(20 * unit)}px system-ui, "Microsoft YaHei", sans-serif`;
          context.fillText(options.slate.detail, width / 2, height / 2 + 26 * unit, width * 0.9);
          context.restore();
        }
        // 烧录：左上镜号景别焦段，右上时间码，底部台词。
        context.font = `600 ${Math.round(22 * unit)}px system-ui, "Microsoft YaHei", sans-serif`;
        context.textBaseline = "top";
        context.shadowColor = "rgba(0,0,0,0.85)"; context.shadowBlur = 4 * unit;
        context.fillStyle = "#fff"; context.textAlign = "left"; context.fillText(label, 24 * unit, 20 * unit);
        context.textAlign = "right"; context.fillText(timecode(time), width - 24 * unit, 20 * unit);
        if (note) {
          context.font = `500 ${Math.round(30 * unit)}px system-ui, "Microsoft YaHei", sans-serif`;
          context.textAlign = "center"; context.textBaseline = "bottom";
          const lines = wrap(note, width * 0.8);
          // 竖屏字幕放在安全区下沿（再往下会被平台的文案、按钮挡住）。
          const bottom = height < width ? height - 36 * unit : height * 0.76;
          lines.forEach((line, row) => context.fillText(line, width / 2, bottom - (lines.length - 1 - row) * 40 * unit));
        }
        context.shadowBlur = 0;
        await previs.add(output, index);
      }
      // 每帧报一次进度（调用方按时间片让出主线程、刷新进度和预览）。
      await options.step(camera ? frame : output, shotIndex);
    }
    await finishClip();
    const whole = previs ? await previs.finish() : undefined;
    return { previs: whole, clips };
  } finally { previs?.close(); clip?.recorder.close(); }
}

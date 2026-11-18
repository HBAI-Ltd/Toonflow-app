import { Euler, Quaternion, Vector3 } from "three";
import { applyTakeAngle, applyTakeMove, applyTakeSize, cameraAngleKinds, cameraMoveKinds, cameraTrackSchema, getTopShotFront, shotSizeKinds, updateCameraTake, type CameraFraming, type CameraTake, type CameraTracking, type FilmFormat, type SceneCamera } from "./cameraDocument";
import { getPerformanceClipDuration, getPerformanceClips } from "./performanceClips";
import { getPerformanceTracks } from "./performanceDocument";
import type { SceneDocument, SceneObject } from "./sceneDocument";
import { estimateLineSeconds } from "./shotCoverage";
import { isStageActor, resolveStageRef, stageLabels } from "./stageDirector";
import { footprintOf, sightProbeFor, type StageGeometry } from "./stageSeats";

/*
 * ACT: 导演工具·摆镜头（给弱模型用）：模型只说“拍谁、景别、角度、哪一侧、运镜”，机位坐标、焦段、跟踪点由这里算；
 * 景别/角度/运镜和界面取景窗、worldCameras.moves 同一套算法。改镜头按成片镜号（和时间轴成片行、镜头表同一套编号）。
 */

type P = { x: number; z: number };
const round = (value: number) => Math.round(value * 1000) / 1000;
const r2 = (value: number) => Math.round(value * 100) / 100;
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.z - b.z);
const norm = (x: number, z: number): P => { const length = Math.hypot(x, z) || 1; return { x: x / length, z: z / length }; };
const yawOf = (dir: P) => Math.atan2(dir.x, dir.z) * 180 / Math.PI;
const dirOf = (yaw: number): P => ({ x: Math.sin(yaw * Math.PI / 180), z: Math.cos(yaw * Math.PI / 180) });

export type ProgramRow = { number: number; start: number; end: number; cameraId: string; shotId?: string; note?: string; lineTooLong?: boolean; crossesAxis?: boolean };
type SizeKind = (typeof shotSizeKinds)[number];
type AngleKind = (typeof cameraAngleKinds)[number];
type MoveKind = (typeof cameraMoveKinds)[number];
const sizeWords: [RegExp, SizeKind, string][] = [[/大全|远景|大远|extreme/i, "extremeWide", "大全景"], [/全景|全身|wide|long/i, "wide", "全景"], [/特写|大特|close ?up/i, "closeUp", "特写"], [/近景|中近|close/i, "close", "近景"], [/中景|半身|medium|mid/i, "medium", "中景"]];
const angleWords: [RegExp, AngleKind][] = [[/顶拍|鸟瞰|上帝|正上方|overhead|top/i, "overhead"], [/俯/i, "high"], [/仰/i, "low"], [/荷兰|倾斜|斜|dutch/i, "dutch"], [/平视|平拍|eye/i, "eye"]];
const moveWords: [RegExp, MoveKind | "follow" | "handheld"][] = [[/跟拍|跟着|跟随|跟|follow/i, "follow"], [/手持|晃|handheld/i, "handheld"], [/变焦|zoom/i, "zoomIn"], [/左环绕|环绕左|orbit ?left/i, "orbitLeft"], [/右环绕|环绕|绕|orbit/i, "orbitRight"], [/左摇|向左摇|pan ?left/i, "panLeft"], [/右摇|摇|pan/i, "panRight"], [/左移|向左移|truck ?left/i, "truckLeft"], [/右移|横移|移|truck/i, "truckRight"], [/升|上升|拉高|crane ?up/i, "craneUp"], [/降|下降|crane ?down/i, "craneDown"], [/拉|后退|pull/i, "pull"], [/推|靠近|push/i, "push"], [/固定|不动|static|clear/i, "clear"]];
export function parseShotSize(text?: string) { return text ? sizeWords.find(([pattern]) => pattern.test(text)) : undefined; }
export function parseShotAngle(text?: string) { return text ? angleWords.find(([pattern]) => pattern.test(text))?.[1] : undefined; }
export function parseShotMove(text?: string) { return text ? moveWords.find(([pattern]) => pattern.test(text))?.[1] : undefined; }
export function parseFilmFormat(text?: string): FilmFormat | undefined {
  if (!text) return undefined;
  if (/竖|9[:：]16|抖音|短剧|手机|vertical|portrait/i.test(text)) return "9:16";
  if (/宽银幕|2\.39|2\.35|电影|cinema|scope/i.test(text)) return "2.39:1";
  if (/1\.85|遮幅/i.test(text)) return "1.85:1";
  if (/4[:：]3/i.test(text)) return "4:3";
  if (/横|16[:：]9|landscape/i.test(text)) return "16:9";
  return undefined;
}
export function parsePace(value?: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0.4, Math.min(2.5, value));
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (/快|急|紧张|打斗|追/.test(value)) return 0.6;
  if (/慢|舒缓|抒情|文戏/.test(value)) return 1.6;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0.4, Math.min(2.5, number)) : 1;
}

/** 某人在成片某一刻大概站在哪、朝哪（按轨道片段估算，不跑导航）。 */
export function stagePoseAt(document: SceneDocument, objectId: string, time: number): { at: P; y: number; facing: P; moving: boolean } | undefined {
  const object = document.objects.find(item => item.id === objectId);
  if (!object) return undefined;
  const front = footprintOf(object.asset)?.front ?? { x: 0, z: 1 };
  const yaw0 = object.rotation.y + yawOf(front);
  let at: P = { x: object.position.x, z: object.position.z }, facing = dirOf(yaw0), moving = false;
  const track = getPerformanceTracks(document.life, document.objects, document.objectGroups).find(item => item.objectId === objectId && item.enabled !== false);
  if (!track) return { at, y: object.position.y, facing, moving };
  for (const clip of getPerformanceClips(track, object).filter(clip => clip.enabled !== false).sort((a, b) => a.start - b.start)) {
    if (clip.start > time) break;
    if (clip.kind === "move" && clip.points.length >= 2) {
      const progress = Math.max(0, Math.min(1, (time - clip.start) / Math.max(0.01, getPerformanceClipDuration(clip))));
      const points = clip.points.map(point => ({ x: point[0], z: point[2] }));
      const lengths = points.map((point, index) => index ? dist(points[index - 1]!, point) : 0);
      let travel = progress * (lengths.reduce((sum, value) => sum + value, 0) || 1);
      for (let index = 1; index < points.length; index++) {
        if (travel <= lengths[index]! || index === points.length - 1) {
          const t = lengths[index]! ? Math.min(1, travel / lengths[index]!) : 1;
          at = { x: points[index - 1]!.x + (points[index]!.x - points[index - 1]!.x) * t, z: points[index - 1]!.z + (points[index]!.z - points[index - 1]!.z) * t };
          facing = norm(points[index]!.x - points[index - 1]!.x, points[index]!.z - points[index - 1]!.z);
          break;
        }
        travel -= lengths[index]!;
      }
      moving = progress < 1;
    } else if (clip.kind === "transform") {
      const frames = clip.keyframes;
      const local = Math.min(time - clip.start, frames.at(-1)!.time);
      let index = 1;
      while (index < frames.length - 1 && frames[index]!.time < local) index++;
      const before = frames[index - 1]!, after = frames[index]!;
      const alpha = Math.max(0, Math.min(1, (local - before.time) / Math.max(0.001, after.time - before.time)));
      const pick = (a: readonly number[] | undefined, b: readonly number[] | undefined, axis: number) => (a?.[axis] ?? 0) + ((b?.[axis] ?? a?.[axis] ?? 0) - (a?.[axis] ?? 0)) * alpha;
      const lx = pick(before.position, after.position, 0), lz = pick(before.position, after.position, 2);
      const turn = object.rotation.y * Math.PI / 180;
      at = { x: object.position.x + lx * Math.cos(turn) + lz * Math.sin(turn), z: object.position.z - lx * Math.sin(turn) + lz * Math.cos(turn) };
      facing = dirOf(yaw0 + pick(before.rotation, after.rotation, 1));
      moving = local < frames.at(-1)!.time && JSON.stringify(before.position) !== JSON.stringify(after.position);
    }
  }
  return { at, y: object.position.y, facing, moving };
}

/** 关键帧旋转（XYZ欧拉角，度）让身体竖轴偏离竖直多少度。 */
function tiltOf(rotation: readonly number[] | undefined) {
  if (!rotation) return 0;
  const radians = Math.PI / 180;
  const up = new Vector3(0, 1, 0).applyQuaternion(new Quaternion().setFromEuler(new Euler((rotation[0] ?? 0) * radians, (rotation[1] ?? 0) * radians, (rotation[2] ?? 0) * radians, "XYZ")));
  return Math.acos(Math.max(-1, Math.min(1, up.y))) / radians;
}
export type PerformanceBeats = {
  talks: { objectId: string; start: number; end: number; text: string; target?: string }[];
  moves: { objectId: string; start: number; end: number }[];
  acts: { objectId: string; start: number; end: number; label: string }[];
  end: number;
};
/** 演绎里真实发生的说话、走动、动作（按轨道片段的实际时间），一键分镜按它切镜。 */
export function performanceBeats(document: SceneDocument): PerformanceBeats {
  const beats: PerformanceBeats = { talks: [], moves: [], acts: [], end: 0 };
  for (const track of getPerformanceTracks(document.life, document.objects, document.objectGroups)) {
    if (track.enabled === false) continue;
    const object = document.objects.find(item => item.id === track.objectId);
    if (!object) continue;
    const actor = isStageActor(object);
    for (const clip of getPerformanceClips(track, object).filter(item => item.enabled !== false).sort((a, b) => a.start - b.start)) {
      const start = clip.start, end = clip.start + getPerformanceClipDuration(clip);
      beats.end = Math.max(beats.end, end);
      if (!actor) continue;
      if (clip.kind === "move") beats.moves.push({ objectId: object.id, start, end });
      else if (clip.kind === "transform") {
        // 直接控制的人（坐着、胶囊人）：从关键帧里认出哪几段在走（位置在变）、哪几段在做动作（只转身、倾斜、压扁）。
        const frames = clip.keyframes;
        for (let index = 1; index < frames.length; index++) {
          const before = frames[index - 1]!, after = frames[index]!;
          const from = start + before.time, to = start + after.time;
          const moved = Math.hypot((after.position?.[0] ?? 0) - (before.position?.[0] ?? 0), (after.position?.[2] ?? 0) - (before.position?.[2] ?? 0)) > 0.05;
          // 只算身体姿态的变化（倾斜、压扁、抬高：坐下、倒地、手势一倾）；只是转身不算动作。
          const changed = Math.abs(tiltOf(after.rotation) - tiltOf(before.rotation)) > 5 || JSON.stringify(after.scale ?? [1, 1, 1]) !== JSON.stringify(before.scale ?? [1, 1, 1]) || Math.abs((after.position?.[1] ?? 0) - (before.position?.[1] ?? 0)) > 0.05;
          if (moved) {
            const last = beats.moves.findLast(item => item.objectId === object.id);
            if (last && Math.abs(last.end - from) < 0.05) last.end = to; else beats.moves.push({ objectId: object.id, start: from, end: to });
          } else if (changed) {
            const last = beats.acts.findLast(item => item.objectId === object.id);
            if (last && Math.abs(last.end - from) < 0.05) last.end = to; else beats.acts.push({ objectId: object.id, start: from, end: to, label: "动作" });
          }
        }
      }
      else if (clip.kind === "pose") {
        const name = clip.name ?? "";
        if (/^说[：:]|^交谈$/.test(name)) {
          const text = name.replace(/^说[：:]/, "").replace(/^交谈$/, "");
          // 坐着说长台词会切成几段同名片段，合回一句。
          const last = beats.talks.findLast(item => item.objectId === object.id);
          if (last && last.text === text && Math.abs(last.end - start) < 0.05) last.end = end;
          else beats.talks.push({ objectId: object.id, start, end, text, ...(clip.target ? { target: clip.target } : {}) });
        } else if (!/^(站着|坐着|看着|跪着|躺着|蹲着|停住|待机|转向|转身)$/.test(name)) beats.acts.push({ objectId: object.id, start, end, label: name });
      }
    }
  }
  beats.talks.sort((a, b) => a.start - b.start);
  beats.moves.sort((a, b) => a.start - b.start);
  beats.acts.sort((a, b) => a.start - b.start);
  beats.end = round(beats.end);
  return beats;
}

/**
 * ACT: 跟着表演一键分镜：按演绎里每句台词真实开始、结束的时刻切到说话的人（有对象就过肩），台词之间有人走动就跟拍走动的人，
 * 开场大全景交代、结尾大全景升起收尾，从0秒一直排到演绎结束，中间不留黑场。原来按台词估时长从2.5秒一句句往后排，
 * 和表演对不上，走动的戏和最后一句之后全是黑场（2026-11-16 用户：几百秒的戏只分到138秒）。who给了就只给这几个人单独镜头。
 */
export function planPerformanceCoverage(document: SceneDocument, options: { who?: readonly string[]; pace?: number } = {}) {
  const labels = stageLabels(document);
  const beats = performanceBeats(document);
  const pace = options.pace ?? 1;
  // 成片比表演多1.5秒：停在结果画面上（倒地的人、抢到座位的人），不在最后一个动作刚做完就黑掉。
  const end = beats.end ? round(beats.end + 1.5) : 0;
  const name = (id: string) => labels.get(id) ?? document.objects.find(object => object.id === id)?.name ?? "";
  const focus = options.who?.length ? new Set(options.who) : undefined;
  const actors = [...new Set([...beats.talks, ...beats.moves, ...beats.acts].map(beat => beat.objectId))];
  const poseOf = (id: string, time: number) => stagePoseAt(document, id, time)?.at;
  // 群像机位拍站在人群中间的那个人（大全景、全景跟着他取景，整群都在画里）。
  const centerActor = (time: number, among: readonly string[] = actors) => {
    const spots = among.flatMap(id => { const at = poseOf(id, time); return at ? [{ id, at }] : []; });
    if (!spots.length) return undefined;
    const cx = spots.reduce((sum, spot) => sum + spot.at.x, 0) / spots.length, cz = spots.reduce((sum, spot) => sum + spot.at.z, 0) / spots.length;
    return spots.sort((a, b) => dist(a.at, { x: cx, z: cz }) - dist(b.at, { x: cx, z: cz }))[0]!.id;
  };
  const nearest = (id: string, time: number, within: number) => {
    const at = poseOf(id, time);
    if (!at) return undefined;
    return actors.filter(other => other !== id).map(other => ({ other, d: dist(poseOf(other, time) ?? { x: 1e9, z: 1e9 }, at) })).filter(entry => entry.d <= within).sort((a, b) => a.d - b.d)[0]?.other;
  };
  const inputs: (StageShotInput & { start: number; seconds: number })[] = [];
  const push = (input: StageShotInput & { start: number; seconds: number }) => {
    const last = inputs.at(-1);
    // 太短的碎镜头并进上一镜；和上一镜同一个人同景别的跟拍接着拍，不切出一个跳切。
    if (input.seconds < 1 && last) { last.seconds = round(last.seconds + input.seconds); return; }
    // 同一个人连着走的跟拍接着拍（不切出跳切），但一镜不超过14秒；其他镜头不合并，免得一个全景挂一两分钟。
    if (last && input.move === "跟拍" && last.move === "跟拍" && last.who === input.who && last.size === input.size && last.seconds + input.seconds <= 14 * pace && Math.abs(last.start + last.seconds - input.start) < 0.05) { last.seconds = round(last.seconds + input.seconds); return; }
    inputs.push({ ...input, start: round(input.start), seconds: round(input.seconds) });
  };
  // 没有台词的一段：有人走动就跟拍（一个人中景跟、几个人全景跟），有人做动作就拍他；都没有（站着等、听）就在
  // 群像全景、人群里的中景、近景之间轮换，每镜不超过7秒。
  // 没台词时每镜几秒：长戏7秒左右，十几秒的短戏缩到2.5秒，关键动作（坐上凳子、开枪、倒地）各自有一镜。
  const piece = Math.max(2.5, Math.min(7, end / 5)) * pace;
  // 没有台词的一段：先按动作切——谁在做动作（坐上凳子、举手、开枪、倒地、拾取）就给谁一镜；动作之间有人走就跟拍他，没人动就在全景和人群里的中景、近景之间轮换。
  const quiet = (from: number, to: number) => {
    let time = from, turn = 0;
    while (to - time > 0.05) {
      let stop = Math.min(to, time + piece);
      if (to - stop < 2.5) stop = to;
      const overlap = (beat: { start: number; end: number }) => Math.min(stop, beat.end) - Math.max(time, beat.start);
      const moverIds = [...new Set(beats.moves.filter(beat => overlap(beat) > 0.3).sort((a, b) => overlap(b) - overlap(a)).map(beat => beat.objectId))];
      if (moverIds.length) {
        const who = moverIds.length === 1 ? moverIds[0]! : centerActor(time, moverIds)!;
        push({ who: name(who), size: moverIds.length > 1 || turn % 2 === 1 ? "全景" : "中景", move: "跟拍", start: time, seconds: stop - time });
      } else {
        const center = centerActor(time);
        const at = center ? poseOf(center, time) : undefined;
        const group = at ? actors.filter(id => dist(poseOf(id, time) ?? { x: 1e9, z: 1e9 }, at) < 6) : [];
        const pickId = group.length ? group[turn % group.length]! : center;
        const kind = turn % 3;
        if (kind === 0 || !pickId) push({ ...(center ? { who: name(center) } : {}), size: "全景", start: time, seconds: stop - time });
        else push({ who: name(pickId), size: kind === 1 ? "中景" : "近景", start: time, seconds: stop - time });
      }
      time = stop; turn++;
    }
  };
  const fill = (from: number, to: number) => {
    // 同一个人挨着的几个动作（举手接开枪）合成一段。
    const acts: { objectId: string; start: number; end: number }[] = [];
    for (const beat of beats.acts.filter(item => item.end > from + 0.2 && item.start < to - 0.2).sort((a, b) => a.start - b.start)) {
      const same = acts.findLast(item => item.objectId === beat.objectId);
      if (same && beat.start - same.end < 0.8) same.end = Math.max(same.end, beat.end); else acts.push({ objectId: beat.objectId, start: beat.start, end: beat.end });
    }
    acts.sort((a, b) => a.start - b.start);
    let time = from;
    for (const [index, act] of acts.entries()) {
      if (act.end <= time + 0.2) continue;
      const begin = Math.max(time, act.start);
      if (begin - time >= 1) quiet(time, begin);
      const shotStart = begin - time < 1 ? time : begin;
      // 下一个别人的动作一开始就切过去；这一镜至少1秒。最后一个动作一直拍到结尾（停在结果上）。
      const next = acts.slice(index + 1).find(other => other.objectId !== act.objectId && other.end > shotStart + 1);
      const stop = Math.min(to, next ? Math.max(shotStart + 1, next.start) : to);
      if (stop - shotStart < 0.3) continue;
      push({ who: name(act.objectId), size: "中景", start: shotStart, seconds: stop - shotStart });
      time = stop;
    }
    if (to - time > 0.05) quiet(time, to);
  };
  const talks = beats.talks.filter(talk => !focus || focus.has(talk.objectId));
  let cursor = 0;
  const first = talks[0]?.start ?? end;
  if (first >= 1.5 || !talks.length) {
    const opening = Math.min(first >= 1.5 ? Math.min(5 * pace, first) : 3 * pace, end || 3);
    const center = centerActor(0);
    push({ ...(center ? { who: name(center) } : {}), size: "大全景", angle: "俯拍", start: 0, seconds: opening });
    cursor = opening;
  }
  for (const [index, talk] of talks.entries()) {
    const next = talks[index + 1];
    const start = Math.max(cursor, talk.start);
    // 两人抢话（with:true同时说）时切到后开口的人。
    const stop = Math.min(talk.end, next && next.start > start ? next.start : talk.end);
    if (stop - start < 0.3) continue;
    if (start > cursor + 0.05) fill(cursor, start);
    const speaker = name(talk.objectId);
    const listenerId = talk.target && talk.target !== talk.objectId && actors.includes(talk.target) ? talk.target : nearest(talk.objectId, start, 5);
    const listener = listenerId ? name(listenerId) : undefined;
    const length = stop - start;
    if (length <= 9 * pace || !listener) push({ who: speaker, size: length < 2.5 ? "中景" : "近景", ...(listener ? { side: `过肩:${listener}` } : {}), start, seconds: length, ...(talk.text ? { line: `${speaker}：${talk.text}` } : {}) });
    else {
      // 长台词：说话的人过肩近景 → 听的人反应 → 说话的人中景，不一个机位拍十几秒。
      const a = round(length * 0.55), b = Math.min(2.5, round(length * 0.2));
      push({ who: speaker, size: "近景", side: `过肩:${listener}`, start, seconds: a, ...(talk.text ? { line: `${speaker}说「${talk.text}」` } : {}) });
      push({ who: listener, size: "近景", side: `过肩:${speaker}`, start: start + a, seconds: b });
      push({ who: speaker, size: "中景", start: start + a + b, seconds: length - a - b });
    }
    cursor = stop;
  }
  if (end - cursor > 0.05) {
    // 最后6秒里还有动作、台词（开枪、倒地这种高潮）就不加大全景收尾，最后一镜拍到结果。
    const climax = [...beats.acts, ...beats.talks].some(beat => beat.end > end - 6);
    const closing = end - cursor >= 6 && !climax ? 2.5 * pace : 0;
    fill(cursor, end - closing);
    if (closing) { const center = centerActor(end - closing); push({ ...(center ? { who: name(center) } : {}), size: "大全景", angle: "俯拍", move: "升", start: end - closing, seconds: closing }); }
  }
  return { inputs: inputs.filter(input => input.seconds >= 0.3), end, lines: talks.length };
}

/** 不同机位的镜头段首尾只差零点几秒的重叠（取整、手动改时长留下的）：前一段收到后一段开头，成片里不再冒出0.1秒的碎镜头、镜号重复的一行。 */
export function tidyShotOverlaps(cameras: readonly SceneCamera[]) {
  const all = cameras.flatMap(camera => (camera.shots ?? []).map(shot => ({ cameraId: camera.id, shot })));
  const trims = new Map<string, number>();
  for (const a of all) for (const b of all) {
    if (a.cameraId === b.cameraId || a.shot.start >= b.shot.start || a.shot.end <= b.shot.start) continue;
    const overlap = a.shot.end - b.shot.start;
    if (overlap > 0.3 + 1e-6 || b.shot.start - a.shot.start < 0.2 || a.shot.end > b.shot.end) continue;
    trims.set(a.shot.id, Math.min(trims.get(a.shot.id) ?? Infinity, b.shot.start));
  }
  if (!trims.size) return [...cameras];
  return cameras.map(camera => ({ ...camera, shots: camera.shots?.map(shot => trims.has(shot.id) ? { ...shot, end: round(trims.get(shot.id)!) } : shot) }));
}

/** 机位看得见注视点：沿视线打三维射线，中间没有布景、墙、家具挡着（机位钻进墙里也会被挡）。 */
export function cameraClear(sight: (aim: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }) => boolean, aim: { x: number; y: number; z: number }, position: { x: number; y: number; z: number }) {
  return !sight(aim, position);
}
function clearCameraPosition(sight: (aim: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }) => boolean, aim: { x: number; y: number; z: number }, position: { x: number; y: number; z: number }, angles: readonly number[]) {
  const dx = position.x - aim.x, dz = position.z - aim.z;
  // 电梯、走廊这种窄地方一直往人跟前收，最近约0.8米。
  const span = Math.hypot(dx, dz) || 1;
  for (const scale of [1, 0.78, 0.6, 0.45, 0.32, 0.22, 0.15].filter(value => value === 1 || span * value >= 0.8)) for (const degrees of angles) {
    const a = degrees * Math.PI / 180;
    const next = { x: aim.x + (dx * Math.cos(a) + dz * Math.sin(a)) * scale, y: aim.y + (position.y - aim.y) * Math.max(scale, 0.5), z: aim.z + (-dx * Math.sin(a) + dz * Math.cos(a)) * scale };
    if (!sight(aim, next)) return next;
  }
  return position;
}

export type StageShotInput = { who?: string; size?: string; angle?: string; side?: string; move?: string; seconds?: number; start?: number; line?: string };
const sizeDistance: Record<SizeKind, number> = { extremeWide: 18, wide: 7, medium: 3.4, close: 2, closeUp: 1.3 };
const sizeSeconds: Record<SizeKind, number> = { extremeWide: 4, wide: 4, medium: 3.5, close: 3, closeUp: 2.5 };
const aimHeight: Record<SizeKind, number> = { extremeWide: 0.5, wide: 0.55, medium: 0.78, close: 0.9, closeUp: 0.93 };

/** 按“拍谁、景别、角度、哪一侧、运镜”摆镜头：同一个人同景别同一侧的镜头放在同一台机位上，按顺序接在 startAt 后面。 */
export function planExplicitShots(document: SceneDocument, shots: readonly StageShotInput[], options: { createId: () => string; startAt: number; view: CameraFraming; geometry?: StageGeometry; prefix?: string; bySubject?: boolean }) {
  const labels = stageLabels(document);
  const cameras: SceneCamera[] = [...(document.cameras ?? [])];
  const prefix = options.prefix ?? "镜头·";
  const created: number[] = [];
  const createdSubject = new Map<number, string | undefined>();
  const notes: string[] = [], done: string[] = [];
  const front = getTopShotFront(cameras) + 1;
  const sight = sightProbeFor(document, options.geometry);
  let cursor = options.startAt;
  const byKey = new Map<string, number>();
  // 180°轴线：这一镜开始时被拍的人和对手（过肩的对手，或离他最近的人）的连线；紧挨着的上一镜机位在哪一侧，新机位（没点名左右、背面的）就站哪一侧。
  // 按这一刻的实际站位算（人走动后初始站位的连线已经不准）。
  const sideOf = (axis: readonly [P, P], p: P) => ((axis[1].x - axis[0].x) * (p.z - axis[0].z) - (axis[1].z - axis[0].z) * (p.x - axis[0].x)) / Math.max(0.01, dist(axis[0], axis[1]));
  const mirror = (axis: readonly [P, P], p: { x: number; y: number; z: number }) => {
    const [a, b] = axis, length = Math.max(0.01, dist(a, b)), ux = (b.x - a.x) / length, uz = (b.z - a.z) / length;
    const along = (p.x - a.x) * ux + (p.z - a.z) * uz, fx = a.x + ux * along, fz = a.z + uz * along;
    return { x: r2(2 * fx - p.x), y: p.y, z: r2(2 * fz - p.z) };
  };
  const previousShot = (time: number) => cameras.flatMap(camera => (camera.shots ?? []).filter(shot => shot.end <= time + 0.05 && shot.end > time - 1.5)).sort((a, b) => b.end - a.end || (b.front ?? 0) - (a.front ?? 0))[0];
  for (const [index, input] of shots.entries()) {
    const tag = `第${index + 1}个镜头`;
    const subject = input.who ? resolveStageRef(document, input.who, { kind: "actor", labels }) ?? resolveStageRef(document, input.who, { labels }) : undefined;
    if (input.who && !subject) notes.push(`${tag}：场景里没有“${input.who}”，改拍全景`);
    const [, size, sizeName] = parseShotSize(input.size) ?? (subject ? sizeWords[4]! : sizeWords[1]!);
    if (input.size && !parseShotSize(input.size)) notes.push(`${tag}：不认识景别“${input.size}”，用${sizeName}（可用：大全景、全景、中景、近景、特写）`);
    const start = Number.isFinite(input.start) ? Math.max(0, input.start!) : cursor;
    const seconds = input.seconds && input.seconds >= 0.3 ? input.seconds : input.line ? estimateLineSeconds(input.line) + 0.3 : sizeSeconds[size];
    const end = round(start + seconds);
    let take: CameraTake;
    let track: CameraTracking | undefined;
    let key = "establish";
    if (!subject) take = { frame: { position: { ...options.view.position }, target: { ...options.view.target }, focalLength: options.view.focalLength } };
    else {
      const pose = stagePoseAt(document, subject.id, start)!;
      const height = (footprintOf(subject.asset)?.height ?? 1.75) * subject.scale.y;
      const aim = { x: pose.at.x, y: pose.y + height * aimHeight[size], z: pose.at.z };
      const yaw = yawOf(pose.facing);
      const side = input.side ?? "";
      let position: { x: number; y: number; z: number } | undefined;
      let axisPartner: SceneObject | undefined;
      if (/肩/.test(side)) {
        // 过肩：站在对手肩后、偏一点，越过他的肩膀拍主体的脸。
        const name = side.replace(/^过肩[:：]?|^过|的?肩.*$/g, "").trim();
        const named = name ? resolveStageRef(document, name, { kind: "actor", labels, exclude: subject.id }) : undefined;
        const other = named ?? document.objects.filter(item => item.visible && item.id !== subject.id && isStageActor(item)).sort((a, b) => dist(stagePoseAt(document, a.id, start)!.at, pose.at) - dist(stagePoseAt(document, b.id, start)!.at, pose.at))[0];
        const there = other ? stagePoseAt(document, other.id, start)!.at : undefined;
        if (other && there) {
          const d = norm(there.x - pose.at.x, there.z - pose.at.z), lateral = dirOf(yawOf(d) - 90);
          const otherHeight = (footprintOf(other.asset)?.height ?? 1.75) * other.scale.y;
          position = { x: there.x + d.x * 0.75 + lateral.x * 0.38, y: pose.y + otherHeight * 0.9, z: there.z + d.z * 0.75 + lateral.z * 0.38 };
          key = `${subject.id}|ots|${other.id}`;
          axisPartner = other;
        } else notes.push(`${tag}：没有可以过肩的对手，改成正面`);
      }
      if (!position) {
        const offset = /背|后/.test(side) ? 180 : /左/.test(side) ? 90 : /右/.test(side) ? -90 : /侧/.test(side) ? 90 : 20;
        const dir = dirOf(yaw + offset);
        const lift = size === "extremeWide" ? 4 : size === "wide" ? 1 : size === "medium" ? 0.25 : 0.05;
        position = { x: aim.x + dir.x * sizeDistance[size], y: aim.y + lift, z: aim.z + dir.z * sizeDistance[size] };
        key = `${subject.id}|${offset}|${size}`;
      }
      // 没点名左右、背面的机位不越轴：和上一镜站在两人连线的同一侧（过肩就换到对手的另一个肩膀）。
      const partnerObject = axisPartner ?? document.objects.filter(item => item.visible && item.id !== subject.id && isStageActor(item)).map(item => ({ item, at: stagePoseAt(document, item.id, start)!.at })).filter(entry => dist(entry.at, pose.at) < 4).sort((a, b) => dist(a.at, pose.at) - dist(b.at, pose.at))[0]?.item;
      const before = previousShot(start);
      if (partnerObject && before && !/[左右背后]/.test(side)) {
        const axis = [pose.at, stagePoseAt(document, partnerObject.id, start)!.at] as const;
        const was = sideOf(axis, before.frame.position), now = sideOf(axis, position);
        if (dist(axis[0], axis[1]) > 0.3 && Math.abs(was) >= 0.3 && Math.abs(now) >= 0.3 && Math.sign(was) !== Math.sign(now)) position = mirror(axis, position);
      }
      // 视线被墙、柜子、屏风挡住或机位钻进家具：绕主体转（过肩只往前收、点名左右背面的只小转），再往跟前收。
      position = clearCameraPosition(sight, aim, position, /肩/.test(side) ? [0] : /[左右背后侧]/.test(side) ? [0, 20, -20] : [0, 25, -25, 50, -50, 80, -80]);
      take = applyTakeSize({ frame: { position: { x: r2(position.x), y: r2(Math.max(0.3, position.y)), z: r2(position.z) }, target: { x: r2(aim.x), y: r2(aim.y), z: r2(aim.z) }, focalLength: 35 } }, size, height);
      const moving = stagePoseAt(document, subject.id, (start + end) / 2)?.moving || stagePoseAt(document, subject.id, start)?.moving;
      track = { objectId: subject.id, point: { x: 0, y: r2(height * aimHeight[size]), z: 0 }, mode: moving ? "follow" : "aim", smooth: 0.5 };
    }
    const angle = parseShotAngle(input.angle);
    if (input.angle && !angle) notes.push(`${tag}：不认识角度“${input.angle}”（平视、俯拍、仰拍、顶拍、倾斜）`);
    if (angle) take = applyTakeAngle(take, angle);
    const move = parseShotMove(input.move);
    if (input.move && !move) notes.push(`${tag}：不认识运镜“${input.move}”，用固定机位（可用：推、拉、左移、右移、升、降、左摇、右摇、环绕、变焦、跟拍、手持）`);
    if (move === "follow") { if (track) track = { ...track, mode: "follow" }; else notes.push(`${tag}：跟拍要指定拍谁（who）`); }
    else if (move === "handheld") take = { ...take, shake: 0.35 };
    else if (move) take = applyTakeMove(take, move, options.createId);
    key = options.bySubject ? subject?.id ?? "establish" : `${key}|${angle ?? ""}|${move ?? ""}`;
    // 按人分机位时，紧挨着的两镜拍同一个人就换到他的第二台机位：同一台机位上首尾相接的两段在成片行里会合成一段、共用一个镜号。
    if (options.bySubject && byKey.has(key) && (cameras[byKey.get(key)!]!.shots ?? []).some(other => Math.abs(other.end - start) < 0.05)) key += "|b";
    const shot = { ...take, id: options.createId(), start: round(start), end, front, ...(track ? { track } : {}), ...(input.line ? { note: input.line.slice(0, 500) } : {}) };
    const free = (index: number) => !(cameras[index]!.shots ?? []).some(other => other.start < end - 0.001 && other.end > start + 0.001) && (cameras[index]!.shots ?? []).length < 64;
    let cameraIndex = byKey.get(key);
    if (cameraIndex === undefined || !free(cameraIndex)) {
      // 机位用满（文档最多24台）：镜头段各自带取景、运镜和跟拍，挂到这次新建的机位上（优先同一个人的），镜头数就不受24台限制。
      const reuse = cameras.length >= 24 ? created.filter(free).sort((a, b) => Number(createdSubject.get(b) === subject?.id) - Number(createdSubject.get(a) === subject?.id))[0] : undefined;
      if (reuse !== undefined) {
        cameraIndex = reuse;
        // 挂到别的景别、别的人的机位上：机位名去掉景别（同一个人）或改成通用名，镜头表里不再写着“大全景”拍的却是近景。
        const same = createdSubject.get(reuse) === subject?.id;
        const label = subject ? labels.get(subject.id) : undefined;
        cameras[reuse] = { ...cameras[reuse]!, name: (same && label ? `${prefix}${label}` : `${prefix}多景别`).slice(0, 160) };
      }
      else {
        const name = subject ? options.bySubject ? `${prefix}${labels.get(subject.id)}${key.endsWith("|b") ? "·二机位" : ""}` : `${prefix}${labels.get(subject.id)}·${sizeName}${/肩/.test(input.side ?? "") ? "过肩" : ""}` : `${prefix}全景交代`;
        cameras.push({ id: options.createId(), name: name.slice(0, 160), frame: take.frame, shots: [] });
        cameraIndex = cameras.length - 1;
        byKey.set(key, cameraIndex);
        created.push(cameraIndex);
        createdSubject.set(cameraIndex, subject?.id);
      }
    }
    const camera = cameras[cameraIndex]!;
    cameras[cameraIndex] = { ...camera, shots: [...(camera.shots ?? []), shot].sort((a, b) => a.start - b.start) };
    done.push(`${r2(start)}–${r2(end)}秒 ${subject ? labels.get(subject.id) : "全景"} ${sizeName}${angle ? "·" + input.angle : ""}${move ? "·" + input.move : ""}${input.line ? `「${input.line.slice(0, 20)}」` : ""}`);
    cursor = Math.max(cursor, end);
  }
  if (cameras.length > 24) throw new Error("机位最多24个：镜头太多了，请分几次摆，或先用clear清掉旧镜头");
  return { cameras: cameras.map(camera => cameraTrackSchema.parse(camera)), notes, done, end: cursor };
}

export type StageShotEdit = { shot: number; size?: string; angle?: string; move?: string; seconds?: number; remove?: boolean; line?: string };
/** 按成片镜号改镜头：景别/角度/运镜套用界面同一套算法；改时长、删镜头后面的镜头整体前后挪（波纹剪辑）。 */
export function editProgramShots(document: SceneDocument, program: readonly ProgramRow[], edits: readonly StageShotEdit[], createId: () => string) {
  let cameras: SceneCamera[] = [...(document.cameras ?? [])];
  const notes: string[] = [], done: string[] = [];
  const targets = edits.map(edit => ({ edit, row: program.find(row => row.number === edit.shot) }));
  for (const { edit, row } of targets) if (!row?.shotId) notes.push(`没有第${edit.shot}镜（现在共${program.at(-1)?.number ?? 0}镜）`);
  const shift = (from: number, delta: number, skip?: string) => { cameras = cameras.map(camera => ({ ...camera, shots: camera.shots?.map(shot => shot.id !== skip && shot.start >= from - 0.001 ? { ...shot, start: round(Math.max(0, shot.start + delta)), end: round(Math.max(0.2, shot.end + delta)) } : shot) })); };
  // 从后往前改：前面镜头的时间不受后面改动影响。
  for (const { edit, row } of targets.filter(item => item.row?.shotId).sort((a, b) => b.row!.start - a.row!.start)) {
    const cameraIndex = cameras.findIndex(camera => camera.id === row!.cameraId);
    const camera = cameras[cameraIndex];
    const shot = camera?.shots?.find(item => item.id === row!.shotId);
    if (!camera || !shot) continue;
    if (edit.remove) {
      const length = shot.end - shot.start;
      cameras[cameraIndex] = { ...camera, shots: camera.shots!.filter(item => item.id !== shot.id) };
      shift(shot.end, -length);
      done.push(`删掉第${edit.shot}镜，后面的镜头往前挪${r2(length)}秒`);
      continue;
    }
    const subject = document.objects.find(object => object.id === (shot.track ?? camera.track)?.objectId);
    const height = subject ? (footprintOf(subject.asset)?.height ?? 1.75) * subject.scale.y : 1.75;
    const size = parseShotSize(edit.size), angle = parseShotAngle(edit.angle), move = parseShotMove(edit.move);
    if (edit.size && !size) notes.push(`第${edit.shot}镜：不认识景别“${edit.size}”（大全景、全景、中景、近景、特写）`);
    if (edit.angle && !angle) notes.push(`第${edit.shot}镜：不认识角度“${edit.angle}”（平视、俯拍、仰拍、顶拍、倾斜）`);
    if (edit.move && !move) notes.push(`第${edit.shot}镜：不认识运镜“${edit.move}”`);
    let updated = updateCameraTake(camera, shot.id, take => {
      let next = size ? applyTakeSize(take, size[1], height) : take;
      if (angle) next = applyTakeAngle(next, angle);
      if (move === "handheld") next = { ...next, shake: 0.35 };
      else if (move === "follow") next = { ...next, track: next.track ? { ...next.track, mode: "follow" } : subject ? { objectId: subject.id, point: { x: 0, y: r2(height * 0.85), z: 0 }, mode: "follow" } : next.track };
      else if (move) next = applyTakeMove(next, move, createId);
      return next;
    });
    if (edit.line) updated = { ...updated, shots: updated.shots?.map(item => item.id === shot.id ? { ...item, note: edit.line!.slice(0, 500) } : item) };
    cameras[cameraIndex] = updated;
    const changes = [size?.[2], angle ? edit.angle : "", move ? edit.move : "", edit.line ? "改台词" : ""].filter(Boolean) as string[];
    if (edit.seconds && edit.seconds >= 0.2) {
      const delta = edit.seconds - (shot.end - shot.start);
      shift(shot.end, delta, shot.id);
      cameras = cameras.map(item => item.id === camera.id ? { ...item, shots: item.shots?.map(entry => entry.id === shot.id ? { ...entry, end: round(entry.start + edit.seconds!) } : entry) } : item);
      changes.push(`时长${r2(edit.seconds)}秒（后面的镜头${delta >= 0 ? "往后" : "往前"}挪${r2(Math.abs(delta))}秒）`);
    }
    if (changes.length) done.push(`第${edit.shot}镜：${changes.join("、")}`);
  }
  return { cameras: cameras.map(camera => cameraTrackSchema.parse({ ...camera, shots: camera.shots?.slice().sort((a, b) => a.start - b.start) })), notes, done };
}

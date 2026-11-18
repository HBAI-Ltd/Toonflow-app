import { cameraTrackSchema, filmAspect, focalLimits, getTopShotFront, type CameraFraming, type SceneCamera } from "./cameraDocument";
import { getPerformanceEventDuration, getPerformanceSegmentDuration, getPerformanceTracks } from "./performanceDocument";
import { createOccupancy, faceRotation, measureAssetFootprint, rectFor, rectsOverlap } from "./setDressing";
import { createSceneObject, type SceneAsset, type SceneDocument, type SceneObject } from "./sceneDocument";
import { getSceneLife } from "./lifeDocument";
import { getCharacterAnimation } from "./characterAnimations";
import type { PerformanceTrack } from "./performanceDocument";
import type { PerformanceClip } from "./performanceClips";

// ACT: 一键分镜（镜头覆盖）：按影视常用的“全景交代环境→中景跟人→近景看表情→中景→…→全景收”给主体排三台机位，
// 镜头段首尾相接、互不重叠，成片一播就是剪好的预演片。每台机位、每段都是普通机位和镜头段，可在时间轴上再拖、再切、再改。

type Vector = { x: number; y: number; z: number };
/** heading：主体开始走的水平方向，中景、近景放在他前方回身拍正面（引导跟拍）。 */
/** facing：人站着时脸朝的水平方向（按素材正面和物体转角算），近景放在脸前面，不拍后脑勺。 */
export type CoverageSubject = { objectId: string; position: Vector; height: number; heading?: { x: number; z: number }; facing?: { x: number; z: number } };
export type CoverageInput = {
  /** 当前编辑视角：全景机位沿用它（模板会切好合适的观察视角）。 */
  view: CameraFraming;
  /** 主体：一般是正在走动线的人；没有时三台机位都对着视角中心。 */
  subject?: CoverageSubject;
  /** 成片时长（秒）：一般是演绎的长度。 */
  duration: number;
  /** 剪辑节奏：镜头时长倍数，快切约0.6、标准1、舒缓约1.6；对白台词时长按说话速度算，不受它影响。 */
  pace?: number;
  /** 新镜头段的成片优先级，叠在已有机位上面播。 */
  front: number;
  createId: () => string;
};

export const coveragePrefix = "分镜·";
const cutPattern: { camera: 0 | 1 | 2; seconds: number }[] = [
  { camera: 0, seconds: 4 }, { camera: 1, seconds: 4 }, { camera: 2, seconds: 3 }, { camera: 1, seconds: 4 },
];

const round = (value: number) => Math.round(value * 100) / 100;
const point = (value: Vector): Vector => ({ x: round(value.x), y: round(value.y), z: round(value.z) });

/** 主体看向机位的水平方向（从主体指向全景机位），用来把中景、近景放在全景同一侧，不越轴。 */
function sideDirection(from: Vector, toward: Vector, degrees: number) {
  const dx = toward.x - from.x, dz = toward.z - from.z;
  const length = Math.hypot(dx, dz) || 1;
  const angle = Math.atan2(dx / length, dz / length) + degrees * Math.PI / 180;
  return { x: Math.sin(angle), z: Math.cos(angle) };
}

export function createShotCoverage(input: CoverageInput): SceneCamera[] {
  // 每台机位最多64段，按15秒一轮约够400秒。
  const duration = Math.max(10, Math.min(400, input.duration));
  const wide = input.view;
  const subject = input.subject;
  const focus = subject ? { ...subject.position, y: subject.position.y + subject.height * 0.85 } : wide.target;
  // 中景：主体行进方向斜前方约5米、比人头高一些略俯拍（人群里不被前排挡住）；近景：前方约2.6米、略高于眼平、中长焦。
  // 两台都follow，带着机位跟人走（引导跟拍），走多远都拍得到正脸；主体不走时就是固定机位。
  const ahead = subject?.heading ? { x: focus.x + subject.heading.x, y: focus.y, z: focus.z + subject.heading.z } : subject?.facing ? { x: focus.x + subject.facing.x, y: focus.y, z: focus.z + subject.facing.z } : wide.position;
  // 跟拍时机位主要在主体正前方，只往场景中心那一侧偏一点（街边、墙边走时不钻进房子）。
  let inward = subject?.heading ? Math.sign(subject.heading.x * (wide.target.z - focus.z) - subject.heading.z * (wide.target.x - focus.x)) || 1 : 1;
  // 运动方向不越轴：中景、近景和全景机位在主体行进线的同一侧，切镜时人在画面里的走向不反过来。
  if (subject?.heading) {
    const sideOf = (x: number, z: number) => Math.sign(subject.heading!.x * z - subject.heading!.z * x);
    // 全景差不多顺着行进线看（走廊、街道纵深）时，人在画面里是朝镜头走或背着走，没有左右之分，不强制。
    const wx = wide.position.x - focus.x, wz = wide.position.z - focus.z;
    const lateral = Math.abs(subject.heading.x * wz - subject.heading.z * wx);
    const wideSide = lateral > Math.max(1.5, Math.hypot(wx, wz) * 0.25) ? sideOf(wx, wz) : 0;
    const probe = sideDirection(focus, ahead, -20 * inward);
    if (wideSide && sideOf(probe.x, probe.z) !== wideSide) inward = -inward;
  }
  const mediumSide = sideDirection(focus, ahead, subject?.heading ? -20 * inward : 28);
  const closeSide = sideDirection(focus, ahead, subject?.heading ? -10 * inward : -32);
  const mediumDistance = subject ? 5 : Math.max(8, Math.hypot(wide.position.x - focus.x, wide.position.z - focus.z) * 0.45);
  const closeDistance = subject ? 2.6 : mediumDistance * 0.5;
  const eye = subject ? subject.position.y + Math.min(1.6, subject.height * 0.9) : focus.y + 1.6;
  const high = subject ? subject.position.y + subject.height * 1.5 : eye + 2;
  const medium: CameraFraming = { position: point({ x: focus.x + mediumSide.x * mediumDistance, y: high, z: focus.z + mediumSide.z * mediumDistance }), target: point(focus), focalLength: 35 };
  const close: CameraFraming = { position: point({ x: focus.x + closeSide.x * closeDistance, y: subject ? eye + 0.25 : eye, z: focus.z + closeSide.z * closeDistance }), target: point(focus), focalLength: 60 };
  const track = (mode: "follow") => subject ? { objectId: subject.objectId, mode, smooth: 0.6 } : undefined;
  // 全景一段缓慢推近（机位沿视线前移约12%），交代环境又有运动感。
  const push = (frame: CameraFraming) => [point(frame.position), point({ x: frame.position.x + (frame.target.x - frame.position.x) * 0.12, y: frame.position.y + (frame.target.y - frame.position.y) * 0.12, z: frame.position.z + (frame.target.z - frame.position.z) * 0.12 })];
  const frames = [wide, medium, close];
  const shots: { camera: number; start: number; end: number }[] = [];
  // 15秒以内的短片按比例切一轮：全景→中景→近景→全景，三台机位都用上。
  if (duration < 15) {
    let time = 0;
    for (const [camera, share] of [[0, 0.3], [1, 0.3], [2, 0.25], [0, 0.15]] as const) { const end = camera === 0 && time > 0 ? duration : round(time + duration * share); shots.push({ camera, start: time, end }); time = end; }
  } else for (let time = 0, index = 0; time < duration - 0.001; index++) {
    const step = cutPattern[index % cutPattern.length]!;
    const end = Math.min(duration, time + step.seconds * (input.pace ?? 1));
    // 最后剩不到2秒就并进前一段，免得闪一下。
    if (duration - end < 2 && end < duration) { shots.push({ camera: step.camera, start: time, end: duration }); break; }
    shots.push({ camera: step.camera, start: time, end });
    time = end;
  }
  // 结尾回到全景收住。
  const last = shots.at(-1)!;
  if (duration < 15) { /* 已按比例排好 */ }
  else if (last.camera !== 0 && last.end - last.start >= 4) { const split = round(last.end - 2.5); shots.push({ camera: 0, start: split, end: last.end }); last.end = split; }
  else last.camera = 0;
  const names = ["全景", subject ? "中景跟拍" : "中景", "近景"];
  return frames.map((frame, index) => cameraTrackSchema.parse({
    id: input.createId(), name: coveragePrefix + names[index], frame,
    // 主体在走时全景机位不动、云台慢慢摇着跟（交代环境又不丢人）；不走的主体全景就是固定机位。
    ...(index > 0 && track("follow") ? { track: track("follow") } : index === 0 && subject?.heading ? { track: { objectId: subject.objectId, mode: "aim" as const, smooth: 1.2 } } : {}),
    shots: shots.filter(shot => shot.camera === index).map(shot => ({
      id: input.createId(), start: round(shot.start), end: round(shot.end), frame, front: input.front,
      ...(index === 0 ? { path: push(frame) } : {}),
    })),
  }));
}

// ACT: 对话戏正反打：两个人时排双人全景 + 两台过肩机位，全部放在两人连线（轴线）的同一侧，遵守180°规则不越轴；
// 过肩机位在一人肩后、对着另一人的脸，跟踪对方（人走动时云台跟着转）。镜头按双人→过肩A→过肩B交替，结尾回双人。
/** speaker为-1是动作说明（括号里的行），切回双人全景。 */
export type DialogueLine = { speaker: number; text: string; label?: string };

/** 台词时长估算：约每秒4个字，加0.8秒起落，单句1.5到12秒。 */
export function estimateLineSeconds(text: string) { return Math.max(1.5, Math.min(12, round(0.8 + [...text.replace(/\s/g, "")].length * 0.25))); }

/**
 * 解析对白：每行“角色：台词”（中英文冒号都行）。角色名和两个主体的名字对得上就归他；对不上时按出场先后，第一个角色归第一个主体。
 * 场次标题（第N场、内景/外景、INT./EXT.、带日夜内外的短行）跳过。有任何一行写了角色时，没写角色的行当动作描述（切全景，写进备注）；
 * 整段都没写角色时，按行轮流分给各人。返回空数组表示没有有效台词。
 */
/** 剧本里说话的角色名（“角色：台词”的角色），按出场先后去重，最多6个；跳过场次标题和括号动作行。 */
export function extractSpeakers(script: string): string[] {
  const names: string[] = [];
  for (const line of parseDialogue(script, ["甲", "乙", "丙", "丁", "戊", "己"])) {
    const label = line.label && speakerName(line.label);
    if (label && !names.includes(label)) names.push(label);
    if (names.length >= 6) break;
  }
  return names;
}

/**
 * ACT: 按场次标题把剧本切成一场一场（“第3场…”“场景：…”“INT./EXT.”“12. 码头 黄昏 外”这类标题行开新的一场）；
 * 没有标题或只有一场时返回整段。上游剧本一次连了好几场时，按剧本预演只做第一场。
 */
export function splitScenes(script: string): string[] {
  const opener = /^(第[一二三四五六七八九十百零\d]{1,4}[场幕集]|场景[：:\s]|场次|INT\.|EXT\.|内景|外景)|^\d{1,3}[.、][^：:]*$/i;
  const scenes: string[][] = [];
  for (const raw of script.split(/\r?\n/)) {
    const line = raw.trim();
    if (opener.test(line) || !scenes.length) scenes.push([]);
    scenes.at(-1)!.push(raw);
  }
  const blocks = scenes.map(lines => lines.join("\n").trim()).filter(Boolean);
  return blocks.length > 1 ? blocks : [script];
}

/** 角色名去掉括号里的表演提示和画外音标记：“林冲（冷笑）”“林冲 OS”“陆谦（V.O.）”都是林冲、陆谦。 */
export function speakerName(label: string) {
  return label.replace(/[（(].*$/, "").replace(/\s*(O\.?S\.?|V\.?O\.?|画外音|内心独白|独白)$/i, "").trim() || label.trim();
}
// 不在画面里说话的：旁白、字幕、画外音单独成行时当说明（切全景、写进备注），不分给人物。
const narrator = /^(旁白|画外音|字幕|解说|OS|VO|V\.O\.|O\.S\.)$/i;
const voiceOver = /(O\.?S\.?|V\.?O\.?|画外音|内心独白|独白)[）)]?\s*$/i;
export function parseDialogue(script: string, names: string[]): DialogueLine[] {
  if (!names.length) return [];
  // 对不上名字的角色按出场先后，依次分给还没被点名的主体。
  const assigned = new Map<string, number>();
  const lines: DialogueLine[] = [];
  // 支持“角色：台词”（中英文冒号）和“【角色】台词”两种写法。
  const labeled = /^[^：:\n]{1,20}[：:]\s*\S/m.test(script) || /^【[^】\n]{1,20}】\s*\S/m.test(script);
  const heading = /^(第[一二三四五六七八九十百零\d]{1,4}[场幕集]|场景|场次|INT\.|EXT\.|内景|外景)|^\d{1,3}[.、][^：:]*$|^[^：:，。！？,.!?]{1,24}[\s·-]*(日|夜|晨|昏|黄昏|清晨|傍晚)[\s·-]*(内|外)?$/i;
  for (const raw of script.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || heading.test(line)) continue;
    if (/^[（(【[].*[）)】\]]$/.test(line)) { lines.push({ speaker: -1, text: line.slice(0, 400) }); continue; }
    const match = line.match(/^([^：:]{1,20})[：:]\s*(.+)$/) ?? line.match(/^【([^】]{1,20})】\s*(.+)$/);
    const text = (match ? match[2]! : line).trim();
    if (!text) continue;
    if (match && narrator.test(match[1]!.trim())) { lines.push({ speaker: -1, text: `${match[1]!.trim()}：${text}`.slice(0, 400) }); continue; }
    let speaker: number;
    if (match) {
      const label = speakerName(match[1]!);
      const named = names.findIndex(name => name === label || name.includes(label) || label.includes(name));
      if (named >= 0) speaker = named;
      else if (assigned.has(label)) speaker = assigned.get(label)!;
      else {
        const taken = new Set([...assigned.values(), ...lines.filter(item => item.label && names.some(name => name === item.label)).map(item => item.speaker)]);
        const free = names.findIndex((_, index) => !taken.has(index));
        speaker = free >= 0 ? free : assigned.size % names.length;
        assigned.set(label, speaker);
      }
      // 画外音、内心独白（OS/VO）：说话的人不在画面里或嘴不动，镜头留在听的人（双人戏切对方，群戏切全景）。
      if (voiceOver.test(match[1]!)) speaker = names.length === 2 ? 1 - speaker : -1;
    } else if (labeled) { lines.push({ speaker: -1, text: text.slice(0, 400) }); continue; }
    else { const last = [...lines].reverse().find(item => item.speaker >= 0); speaker = last ? (last.speaker + 1) % names.length : 0; }
    lines.push({ speaker, text: text.slice(0, 400), ...(match ? { label: match[1]!.trim() } : {}) });
  }
  return lines.slice(0, 60);
}

export function createDialogueCoverage(input: Omit<CoverageInput, "subject"> & { subjects: [CoverageSubject & { name: string }, CoverageSubject & { name: string }]; lines?: DialogueLine[] }): SceneCamera[] {
  const duration = Math.max(10, Math.min(400, input.duration));
  const [a, b] = input.subjects;
  const face = (subject: CoverageSubject) => ({ x: subject.position.x, y: subject.position.y + subject.height * 0.85, z: subject.position.z });
  const fa = face(a), fb = face(b);
  const dx = fb.x - fa.x, dz = fb.z - fa.z, distance = Math.hypot(dx, dz) || 1;
  const axis = { x: dx / distance, z: dz / distance };
  const middle = { x: (fa.x + fb.x) / 2, y: (fa.y + fb.y) / 2, z: (fa.z + fb.z) / 2 };
  // 机位一侧：取当前视角所在的那一侧，镜头全在这边。
  let normal = { x: -axis.z, z: axis.x };
  if (normal.x * (input.view.position.x - middle.x) + normal.z * (input.view.position.z - middle.z) < 0) normal = { x: -normal.x, z: -normal.z };
  // 边走边说（walk and talk）：两人朝同一方向走时，机位放到他们前进方向一侧（双人镜头在前面倒退着领拍），所有机位跟着人走。
  const walking = !!(a.heading && b.heading && a.heading.x * b.heading.x + a.heading.z * b.heading.z > 0.6);
  if (walking) {
    const lead = { x: a.heading!.x + b.heading!.x, z: a.heading!.z + b.heading!.z };
    if (normal.x * lead.x + normal.z * lead.z < 0) normal = { x: -normal.x, z: -normal.z };
  }
  const back = Math.max(3.5, distance * 1.4);
  // 两人朝同一边、不是面对面（理发、开车、同骑一前一后；沙发、长椅、拜堂并排）：过肩只会拍到后脑勺、侧脸。
  // 改成从脸前面拍：前景双人在两人前方，两个近景各在自己脸前稍斜；一前一后时都往机位一侧偏，后面那人的脸从前面那人肩旁露出来。
  const sameFacing = !walking && !!(a.facing && b.facing && a.facing.x * b.facing.x + a.facing.z * b.facing.z > 0.6);
  let frames: CameraFraming[];
  if (sameFacing) {
    const ahead = { x: a.facing!.x + b.facing!.x, z: a.facing!.z + b.facing!.z }, size = Math.hypot(ahead.x, ahead.z) || 1;
    const forward = { x: ahead.x / size, z: ahead.z / size };
    const tandem = Math.abs(axis.x * forward.x + axis.z * forward.z) > 0.6;
    const frontFace = (fa.x - fb.x) * forward.x + (fa.z - fb.z) * forward.z >= 0 ? fa : fb;
    // 侧向：和朝向垂直、取当前视角那一边。并排时侧向就沿两人连线，机位全在两人前面，不越轴；一前一后时机位全偏到这一侧。
    let side = { x: -forward.z, z: forward.x };
    if (side.x * (input.view.position.x - middle.x) + side.z * (input.view.position.z - middle.z) < 0) side = { x: -side.x, z: -side.z };
    const front = (from: Vector, to: Vector, reach: number, sideways: number, focalLength: number): CameraFraming => ({ position: point({ x: from.x + forward.x * reach + side.x * sideways, y: from.y + 0.05, z: from.z + forward.z * reach + side.z * sideways }), target: point(to), focalLength });
    const toward = (from: Vector, to: Vector) => Math.sign((to.x - from.x) * side.x + (to.z - from.z) * side.z) || 1;
    frames = tandem
      ? [front(frontFace, middle, 1.4, 0.7, 28), front(fa, fa, 0.85, fa === frontFace ? 0.55 : 0.95, 50), front(fb, fb, 0.85, fb === frontFace ? 0.55 : 0.95, 50)]
      // 并排：近景往对方那边斜一点（视线朝对方），双人在正前方。
      : [front(middle, middle, Math.max(2.2, distance * 1.6), 0, 30), front(fa, fa, 1.1, Math.min(0.35, distance * 0.25) * toward(fa, fb), 50), front(fb, fb, 1.1, Math.min(0.35, distance * 0.25) * toward(fb, fa), 50)];
  } else {
    const two: CameraFraming = { position: point({ x: middle.x + normal.x * back, y: middle.y + 0.3, z: middle.z + normal.z * back }), target: point(middle), focalLength: 30 };
    // 过肩：站在一人身后0.9米、往机位一侧偏0.55米，看另一人的脸。
    const over = (from: Vector, to: Vector, sign: number): CameraFraming => ({ position: point({ x: from.x - axis.x * sign * 0.9 + normal.x * 0.55, y: from.y + 0.05, z: from.z - axis.z * sign * 0.9 + normal.z * 0.55 }), target: point(to), focalLength: 45 });
    const overB = over(fa, fb, 1); // 在A肩后拍B
    const overA = over(fb, fa, -1); // 在B肩后拍A
    frames = [two, overA, overB];
  }
  const pattern: { camera: number; seconds: number }[] = [{ camera: 0, seconds: 4 }, { camera: 1, seconds: 3 }, { camera: 2, seconds: 3 }, { camera: 1, seconds: 3 }, { camera: 2, seconds: 3 }];
  const shots: { camera: number; start: number; end: number; note?: string }[] = [];
  if (input.lines?.length) {
    // 按对白剪：双人全景开场，每句切到说话人的过肩镜头（在对方肩后拍说话的人），时长按字数估，结尾回双人。
    let time = round(2.5 * (input.pace ?? 1));
    shots.push({ camera: 0, start: 0, end: time });
    // 反应镜头：一句问话、喊话、欲言又止（？！…结尾）说完、对方接话前，先给对方1.2秒的脸（听的人的反应），
    // 不是一句一切的乒乓球；最多三句一次，节奏倍数跟着缩放。反应段没有台词（不出字幕、不做口型）。
    let beats = 0;
    for (const [index, line] of input.lines.entries()) {
      const end = round(time + estimateLineSeconds(line.text));
      shots.push(line.speaker < 0 ? { camera: 0, start: time, end, note: line.text } : { camera: line.speaker === 0 ? 1 : 2, start: time, end, note: `${line.label ?? input.subjects[line.speaker === 0 ? 0 : 1]!.name}：${line.text}` });
      time = end;
      const next = input.lines[index + 1];
      if (next && line.speaker >= 0 && next.speaker >= 0 && next.speaker !== line.speaker && /[？?！!…]["”’」』]?$/.test(line.text.trim()) && beats < Math.ceil(input.lines.length / 3)) {
        const beat = round(time + 1.2 * (input.pace ?? 1));
        shots.push({ camera: next.speaker === 0 ? 1 : 2, start: time, end: beat });
        time = beat; beats++;
      }
    }
    shots.push({ camera: 0, start: time, end: round(time + 2 * (input.pace ?? 1)) });
  } else if (duration < 15) {
    let time = 0;
    for (const [camera, share] of [[0, 0.3], [1, 0.25], [2, 0.25], [0, 0.2]] as const) { const end = camera === 0 && time > 0 ? duration : round(time + duration * share); shots.push({ camera, start: time, end }); time = end; }
  } else {
    for (let time = 0, index = 0; time < duration - 0.001; index++) {
      const step = pattern[index % pattern.length]!;
      const end = Math.min(duration, time + step.seconds * (input.pace ?? 1));
      if (duration - end < 2 && end < duration) { shots.push({ camera: step.camera, start: time, end: duration }); break; }
      shots.push({ camera: step.camera, start: time, end });
      time = end;
    }
    const last = shots.at(-1)!;
    if (last.camera !== 0 && last.end - last.start >= 4) { const split = round(last.end - 2.5); shots.push({ camera: 0, start: split, end: last.end }); last.end = split; }
    else last.camera = 0;
  }
  const names = sameFacing ? ["双人前景", `近景${a.name}`, `近景${b.name}`] : [walking ? "双人跟拍" : "双人全景", `过肩拍${a.name}`, `过肩拍${b.name}`];
  const tracks = walking
    ? [{ objectId: a.objectId, mode: "follow" as const, smooth: 0.8 }, { objectId: a.objectId, mode: "follow" as const, smooth: 0.6 }, { objectId: b.objectId, mode: "follow" as const, smooth: 0.6 }]
    : [undefined, { objectId: a.objectId, mode: "aim" as const, smooth: 0.6 }, { objectId: b.objectId, mode: "aim" as const, smooth: 0.6 }];
  return frames.map((frame, index) => cameraTrackSchema.parse({
    id: input.createId(), name: coveragePrefix + names[index]!.slice(0, 40), frame,
    ...(tracks[index] ? { track: tracks[index] } : {}),
    shots: shots.filter(shot => shot.camera === index).map(shot => ({ id: input.createId(), start: round(shot.start), end: round(shot.end), frame, front: input.front, ...(shot.note ? { note: shot.note.slice(0, 500) } : {}) })),
  })).filter((camera, index) => index === 0 || camera.shots?.length); // 一句都没轮到的机位（画外音全切到听的人）不留空机位
}

/** 演绎时长估算：各条路线按长度和速度（或指定分段用时）加上事件停留，取最长的一条。 */
export function estimatePerformanceSeconds(document: SceneDocument) {
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups).filter(track => track.enabled !== false);
  return Math.max(0, ...tracks.map(track => track.points.reduce((sum, _, index) => index < track.points.length - 1 ? sum + getPerformanceSegmentDuration(track, index) : sum, 0) + (track.events ?? []).reduce((sum, event) => sum + getPerformanceEventDuration(event), 0)));
}

function subjectOf(document: SceneDocument, object: SceneObject): CoverageSubject & { name: string } {
  const height = (measureAssetFootprint(object.asset)?.height ?? 1.75) * object.scale.y;
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups);
  // 行进方向：取路线里最长的一段（站位→第一个点、各点之间）的方向。路人常先往回走一小段到路线起点、再走完全程，按第一段会把跟拍机位放到身后。
  const route = tracks.find(track => track.objectId === object.id && track.enabled !== false)?.points ?? [];
  const points = [[object.position.x, object.position.z], ...route.map(point => [point[0]!, point[2]!])];
  let pick: number[] | undefined, longest = 0.5;
  for (let index = 1; index < points.length; index++) {
    const leg = [points[index]![0]! - points[index - 1]![0]!, points[index]![1]! - points[index - 1]![1]!];
    const size = Math.hypot(leg[0]!, leg[1]!);
    if (size > longest) { longest = size; pick = leg; }
  }
  const size = pick ? Math.hypot(pick[0]!, pick[1]!) : 0;
  const front = measureAssetFootprint(object.asset)?.front, turn = object.rotation.y * Math.PI / 180;
  const facing = front ? { x: front.x * Math.cos(turn) + front.z * Math.sin(turn), z: -front.x * Math.sin(turn) + front.z * Math.cos(turn) } : undefined;
  return { objectId: object.id, name: object.name, ...(facing ? { facing } : {}), position: { ...object.position }, height: Number.isFinite(height) && height > 0.2 ? height : 1.75, ...(size > 0.01 ? { heading: { x: pick![0]! / size, z: pick![1]! / size } } : {}) };
}

/** 主体没指定时：取走动线最长的人（没有人就取最长的动线主体）。 */
/** 自动挑主体：走动线最长的人；没人走动时挑离画面中心最近的站着的人（骨骼人物优先，坐席群演不算），让一键分镜总有人可拍。 */
function autoSubject(document: SceneDocument, focus?: { x: number; z: number }) {
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups).filter(track => track.enabled !== false && track.points.length > 1);
  const length = (points: number[][]) => points.reduce((sum, point, index) => index ? sum + Math.hypot(point[0]! - points[index - 1]![0]!, point[2]! - points[index - 1]![2]!) : 0, 0);
  const isPerson = (id: string) => /person/i.test(document.objects.find(object => object.id === id)?.asset.shape ?? "");
  const best = [...tracks].filter(track => length(track.points) > 0.5).sort((a, b) => Number(isPerson(b.objectId)) - Number(isPerson(a.objectId)) || length(b.points) - length(a.points))[0];
  const moving = document.objects.find(object => object.id === best?.objectId);
  if (moving && isPerson(moving.id) || !focus) return moving;
  const standing = document.objects.filter(object => object.visible && (object.asset.shape === "person" || object.asset.shape === "riggedPerson"));
  const distance = (object: SceneObject) => Math.hypot(object.position.x - focus.x, object.position.z - focus.z) - (object.asset.shape === "riggedPerson" ? 3 : 0);
  return standing.sort((a, b) => distance(a) - distance(b))[0] ?? moving;
}

/**
 * 给整个场景排分镜（界面“分镜”按钮和Agent共用）：subjectIds两个时排对话戏正反打，一个时围绕他排全景/中景跟拍/近景，
 * 没给时自动挑主体。之前生成的“分镜·”机位整组替换，其他机位保留；返回新的机位列表。
 */
export function applySceneCoverage(document: SceneDocument, options: { view: CameraFraming; subjectIds?: string[]; duration?: number; script?: string; pace?: number; createId: () => string }) {
  const kept = (document.cameras ?? []).filter(camera => !camera.name.startsWith(coveragePrefix));
  if (kept.length + Math.max(3, Math.min(6, options.subjectIds?.length ?? 0) + 1) > 24) throw new Error("最多放置24个机位，请先删掉几个机位再生成分镜");
  const objects = (options.subjectIds ?? []).map(id => { const object = document.objects.find(item => item.id === id); if (!object) throw new Error("分镜主体不存在：" + id); return object; });
  const duration = Math.max(options.duration ?? 0, estimatePerformanceSeconds(document));
  const base = { view: options.view, duration, front: getTopShotFront(kept) + 1, createId: options.createId, ...(options.pace ? { pace: options.pace } : {}) };
  const automatic = !objects.length ? autoSubject(document, options.view.target) : undefined;
  const script = options.script?.trim();
  if (objects.length > 6) throw new Error("群戏分镜最多6个人，请少选几个");
  if (objects.length >= 3) {
    const group = objects.map(object => subjectOf(document, object));
    const groupLines = script ? parseDialogue(script, group.map(subject => subject.name)) : undefined;
    if (script && !groupLines?.length) throw new Error("没有读到台词：每行写“角色：台词”");
    const cameras = fitPortrait(createGroupCoverage({ ...base, subjects: group, lines: groupLines }));
    return { cameras: [...kept, ...cameras], created: cameras };
  }
  if (script && objects.length !== 2) throw new Error("按对白分镜需要两个或更多说话的人：界面里先选中他们（Shift或Ctrl点选、框选），Agent给subjectIds");
  const pair = objects.length === 2 ? [subjectOf(document, objects[0]!), subjectOf(document, objects[1]!)] as [CoverageSubject & { name: string }, CoverageSubject & { name: string }] : undefined;
  const lines = pair && script ? parseDialogue(script, [pair[0].name, pair[1].name]) : undefined;
  if (script && !lines?.length) throw new Error("没有读到台词：每行写“角色：台词”");
  const cameras = fitPortrait(pair ? createDialogueCoverage({ ...base, subjects: pair, lines })
    : createShotCoverage({ ...base, subject: objects[0] ? subjectOf(document, objects[0]) : automatic ? subjectOf(document, automatic) : undefined }));
  return { cameras: [...kept, ...cameras], created: cameras };
}

/** 竖屏（9:16）画面窄：全景、双人、群像机位焦段放宽到0.75倍，两三个人并排也收得进；单人近景、过肩不动。 */
function fitPortrait(cameras: SceneCamera[]): SceneCamera[] {
  if (filmAspect >= 1) return cameras;
  const widen = (focal: number) => Math.max(focalLimits.min, Math.round(focal * 0.75 * 10) / 10);
  return cameras.map(camera => {
    if (!/全景|双人|群像/.test(camera.name)) return camera;
    const frame = { ...camera.frame, focalLength: widen(camera.frame.focalLength) };
    return { ...camera, frame, shots: camera.shots?.map(shot => ({ ...shot, frame: { ...shot.frame, focalLength: widen(shot.frame.focalLength) }, ...(shot.keys ? { keys: shot.keys.map(key => ({ ...key, focal: widen(key.focal) })) } : {}) })) };
  });
}

// ACT: 群戏（3到6人：饭桌、会议、围观里的对话）：一台全景 + 每人一台单人近景。单人机位放在人群内侧、朝向这个人
// （从他看向人群中心和全景机位的方向之间），像隔着别人的肩膀拍他；镜头按全景→每人轮流切，有对白时按台词切到说话的人。
export function createGroupCoverage(input: Omit<CoverageInput, "subject"> & { subjects: (CoverageSubject & { name: string })[]; lines?: DialogueLine[] }): SceneCamera[] {
  const subjects = input.subjects.slice(0, 6);
  const duration = Math.max(10, Math.min(400, input.duration));
  const faces = subjects.map(subject => ({ x: subject.position.x, y: subject.position.y + subject.height * 0.85, z: subject.position.z }));
  const center = { x: faces.reduce((sum, face) => sum + face.x, 0) / faces.length, y: faces.reduce((sum, face) => sum + face.y, 0) / faces.length, z: faces.reduce((sum, face) => sum + face.z, 0) / faces.length };
  const singles: CameraFraming[] = faces.map((face, index) => {
    const toCenter = { x: center.x - face.x, z: center.z - face.z }, toView = { x: input.view.position.x - face.x, z: input.view.position.z - face.z };
    const unit = (v: { x: number; z: number }) => { const l = Math.hypot(v.x, v.z) || 1; return { x: v.x / l, z: v.z / l }; };
    const a = unit(toCenter), b = unit(toView), facing = subjects[index]!.facing;
    // 知道脸朝哪就放在脸前方（偏向人群中心一点）；不知道时取人群中心和全景机位方向之间。
    const dir = facing ? unit({ x: facing.x * 1.6 + a.x * 0.5, z: facing.z * 1.6 + a.z * 0.5 }) : unit({ x: a.x + b.x, z: a.z + b.z });
    return { position: point({ x: face.x + dir.x * 2.2, y: face.y + 0.1, z: face.z + dir.z * 2.2 }), target: point(face), focalLength: 50 };
  });
  const shots: { camera: number; start: number; end: number; note?: string }[] = [];
  if (input.lines?.length) {
    let time = round(2.5 * (input.pace ?? 1));
    shots.push({ camera: 0, start: 0, end: time });
    // 反应镜头同双人：问话、喊话说完，下一个接话的人先给1.2秒脸，再接他的台词。
    let beats = 0;
    for (const [index, line] of input.lines.entries()) {
      const end = round(time + estimateLineSeconds(line.text));
      const speaker = line.speaker >= 0 && line.speaker < subjects.length ? line.speaker : -1;
      shots.push({ camera: speaker < 0 ? 0 : speaker + 1, start: time, end, note: speaker < 0 ? line.text : `${line.label ?? subjects[speaker]!.name}：${line.text}` });
      time = end;
      const next = input.lines[index + 1];
      if (next && speaker >= 0 && next.speaker >= 0 && next.speaker < subjects.length && next.speaker !== speaker && /[？?！!…]["”’」』]?$/.test(line.text.trim()) && beats < Math.ceil(input.lines.length / 3)) {
        const beat = round(time + 1.2 * (input.pace ?? 1));
        shots.push({ camera: next.speaker + 1, start: time, end: beat });
        time = beat; beats++;
      }
    }
    shots.push({ camera: 0, start: time, end: round(time + 2 * (input.pace ?? 1)) });
  } else {
    // 全景4秒交代，再每人3秒轮一圈，一圈后回全景3秒；最后回全景收。
    let time = 0, index = 0;
    const order = [0, ...subjects.map((_, i) => i + 1)];
    while (time < duration - 0.001) {
      const camera = order[index % order.length]!;
      const seconds = (camera === 0 ? (index === 0 ? 4 : 3) : 3) * (input.pace ?? 1);
      const end = Math.min(duration, time + seconds);
      if (duration - end < 2 && end < duration) { shots.push({ camera, start: time, end: duration }); break; }
      shots.push({ camera, start: time, end });
      time = end; index++;
    }
    const last = shots.at(-1)!;
    if (last.camera !== 0 && last.end - last.start >= 4) { const split = round(last.end - 2.5); shots.push({ camera: 0, start: split, end: last.end }); last.end = split; }
    else last.camera = 0;
  }
  const frames = [input.view, ...singles];
  return frames.map((frame, index) => cameraTrackSchema.parse({
    id: input.createId(), name: coveragePrefix + (index === 0 ? "群戏全景" : `近景${subjects[index - 1]!.name}`).slice(0, 40), frame,
    ...(index > 0 ? { track: { objectId: subjects[index - 1]!.objectId, mode: "aim", smooth: 0.6 } } : {}),
    shots: shots.filter(shot => shot.camera === index).map(shot => ({ id: input.createId(), start: round(shot.start), end: round(shot.end), frame, front: input.front, ...(shot.note ? { note: shot.note.slice(0, 500) } : {}) })),
  }));
  // 群戏不删没轮到台词的近景机位：留着它，越轴检查才知道是群戏（跟拍三人以上不按一条轴线判），也方便手动给沉默的人插反应镜头。
}

/**
 * ACT: 越轴检查（180°规则）：对话双方取机位跟拍最多的两个人，按每一镜机位在两人连线的哪一侧判断；
 * 相邻两镜分处两侧就是越轴（观众会觉得两人左右对调）。几乎压在轴线上的机位（离轴线不到0.3米）算中性镜头，不参与判断。
 * 返回越轴的镜号（后一镜）。人在走动时按站位判断，仅作提示。
 */
/**
 * routes：各人动线的起点和终点（物体id → 点列）。只跟拍一个走动的人时，轴线取他的行进线（运动方向越轴：切镜后人在画面里的走向反过来）。
 */
export function findAxisCrossings(objects: readonly SceneObject[], cameras: readonly SceneCamera[], shots: readonly { number: number; cameraId: string; start: number; end: number }[], routes?: ReadonlyMap<string, readonly { x: number; z: number }[]>, poseAt?: (objectId: string, time: number) => { x: number; z: number } | undefined) {
  const counts = new Map<string, number>();
  for (const camera of cameras) for (const id of [camera.track?.objectId, ...(camera.shots ?? []).map(shot => shot.track?.objectId)]) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  const tracked = [...counts].sort((a, b) => b[1] - a[1]).map(([id]) => objects.find(object => object.id === id)).filter((object): object is SceneObject => !!object && /person/i.test(object.asset.shape ?? ""));
  // 群戏（跟拍三人及以上）：轴线随说话的那一对变化，单一轴线判断会误报，不判。
  if (tracked.length >= 3) return [];
  const pair = tracked.slice(0, 2);
  const route = pair.length === 1 ? routes?.get(pair[0]!.id) : undefined;
  const line = pair.length >= 2 ? [pair[0]!.position, pair[1]!.position] : route ? routeAxis(route) : undefined;
  if (!line) return [];
  // 两人走动时轴线按这一镜开始时两人的实际站位算（给了poseAt时），不按开场站位——人走到桌边坐下后，开场的连线早就不对了。
  const axisAt = (time: number): [{ x: number; z: number }, { x: number; z: number }] => {
    if (pair.length < 2 || !poseAt) return line as [{ x: number; z: number }, { x: number; z: number }];
    return [poseAt(pair[0]!.id, time) ?? pair[0]!.position, poseAt(pair[1]!.id, time) ?? pair[1]!.position];
  };
  let [a, b] = axisAt(shots[0]?.start ?? 0);
  let length = Math.hypot(b.x - a.x, b.z - a.z);
  if (length < 0.2 && !poseAt) return [];
  const sideOf = (point: { x: number; z: number }) => ((b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x)) / length;
  const crossings: number[] = [];
  let lastSide = 0;
  for (const shot of shots) {
    const camera = cameras.find(item => item.id === shot.cameraId);
    if (!camera) continue;
    if (poseAt && pair.length >= 2) { [a, b] = axisAt(shot.start); length = Math.hypot(b.x - a.x, b.z - a.z); if (length < 0.2) continue; }
    const take = camera.shots?.find(item => shot.start + 0.001 >= item.start && shot.start < item.end - 0.001) ?? camera;
    const distance = sideOf(take.frame.position);
    // 行进线模式下，机位差不多顺着行进线看（离线的横向距离不到它到线上最近点距离的四分之一）就不算哪一侧。
    const p = take.frame.position, along = Math.max(0, Math.min(length, ((p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z)) / length));
    const reach = Math.hypot(p.x - (a.x + (b.x - a.x) / length * along), p.z - (a.z + (b.z - a.z) / length * along));
    if (Math.abs(distance) < 0.3 || route && Math.abs(distance) < 0.25 * reach) continue;
    const side = Math.sign(distance);
    if (lastSide && side !== lastSide && !crossings.includes(shot.number)) crossings.push(shot.number);
    lastSide = side;
  }
  return crossings;
}

/**
 * ACT: 台词动作：按对白分镜后，说台词的骨骼人物在自己那几句的时间里做“交谈”动作（2.9秒一段首尾接上铺满），听的人保持待机。
 * 每人一条“台词·名字”动作轨，收进默认折叠的“台词动作”分组；重新按对白分镜时整组替换。已经有自己动线的人不动，免得打乱走位。
 */
/**
 * 动线的运动轴：取动线上相距最远的两点（直线走就是起点到终点，来回踱步不会被起终点碰巧靠近带偏）；
 * 整条动线铺开不到3米（原地踱步、几步来回）或满场乱逛就没有运动方向（人横穿画面才有银幕方向），不判越轴。
 */
export function routeAxis(points: readonly { x: number; z: number }[]): [{ x: number; z: number }, { x: number; z: number }] | undefined {
  let best: [{ x: number; z: number }, { x: number; z: number }] | undefined, reach = 3;
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
    const length = Math.hypot(points[j]!.x - points[i]!.x, points[j]!.z - points[i]!.z);
    if (length >= reach) { reach = length; best = [points[i]!, points[j]!]; }
  }
  // 满院子乱逛（各点离这条线横向散开超过线长的35%）也没有一条行进线。
  if (best) {
    const [a, b] = best;
    const spread = Math.max(...points.map(point => Math.abs((b.x - a.x) * (point.z - a.z) - (b.z - a.z) * (point.x - a.x)) / reach));
    if (spread > reach * 0.35) return undefined;
  }
  return best;
}
/** 各人的动线点（起点＋路线点），给 findAxisCrossings 判断运动方向越轴。 */
export function getRouteAxes(document: Pick<SceneDocument, "life" | "objects" | "objectGroups">) {
  const routes = new Map<string, { x: number; z: number }[]>();
  for (const track of getPerformanceTracks(document.life, document.objects, document.objectGroups)) {
    if (track.enabled === false || routes.has(track.objectId)) continue;
    const object = document.objects.find(item => item.id === track.objectId);
    if (!object) continue;
    routes.set(track.objectId, [{ x: object.position.x, z: object.position.z }, ...track.points.map(point => ({ x: point[0]!, z: point[2]! }))]);
  }
  return routes;
}

export function withTalkClips(document: SceneDocument, cameras: SceneCamera[]): Pick<SceneDocument, "life" | "timeline"> | undefined {
  const talk = getCharacterAnimation("cc0Talk");
  if (!talk) return;
  const life = getSceneLife(document.life);
  const kept = (life.tracks ?? []).filter(track => !track.name?.startsWith("台词·"));
  const busy = new Set(kept.map(track => track.objectId));
  const lines = new Map<string, { start: number; end: number }[]>();
  for (const camera of cameras) for (const shot of camera.shots ?? []) {
    const speakerId = (shot.track ?? camera.track)?.objectId;
    const speaker = speakerId && document.objects.find(object => object.id === speakerId);
    if (!shot.note || !speaker || !/^(riggedPerson|person|seatedPerson|kneelingPerson)$/.test(speaker.asset.shape ?? "") || busy.has(speaker.id) || !/^[^：:]{1,20}[：:]/.test(shot.note) || voiceOver.test(shot.note.split(/[：:]/)[0]!)) continue;
    const list = lines.get(speaker.id) ?? [];
    const last = list.at(-1);
    if (last && shot.start - last.end < 0.05) last.end = Math.max(last.end, shot.end); else list.push({ start: shot.start, end: shot.end });
    lines.set(speaker.id, list);
  }
  const tracks: PerformanceTrack[] = [];
  for (const [objectId, spans] of lines) {
    const person = document.objects.find(object => object.id === objectId)!;
    const clips: PerformanceClip[] = [];
    // 胶囊人没有骨骼：说台词时整个人轻轻左右晃（转±6°、侧倾±2°，头部摆约5厘米，0.4秒换一次向），用直接控制轨道的物件动画，一段最多约25秒，长的切成几段。
    if (person.asset.shape !== "riggedPerson") {
      for (const span of spans) for (let start = span.start; start < span.end - 0.3 && clips.length < 60; start += 25) {
        const length = Math.round(Math.min(25, span.end - start) * 1000) / 1000;
        const keyframes: { time: number; rotation: [number, number, number] }[] = [];
        for (let time = 0, index = 0; time < length - 0.001 && keyframes.length < 63; time += 0.4, index++) keyframes.push({ time: Math.round(time * 1000) / 1000, rotation: [0, index === 0 ? 0 : index % 2 ? 6 : -6, index === 0 ? 0 : index % 2 ? 2 : -2] });
        keyframes.push({ time: length, rotation: [0, 0, 0] });
        clips.push({ id: crypto.randomUUID(), name: "说话", kind: "transform", start: Math.round(start * 1000) / 1000, sourceDuration: length, sourceIn: 0, sourceOut: length, rate: 1, keyframes });
      }
      if (clips.length) tracks.push({ id: crypto.randomUUID(), objectId, name: `台词·${person.name}`.slice(0, 160), points: [[person.position.x, person.position.y, person.position.z]], controller: "object", clips });
      continue;
    }
    for (const span of spans) for (let start = span.start; start < span.end - 0.3 && clips.length < 120; start += talk.duration) {
      const length = Math.min(talk.duration, span.end - start);
      clips.push({ id: crypto.randomUUID(), name: talk.name, kind: "pose", start: Math.round(start * 1000) / 1000, sourceDuration: talk.duration, sourceIn: 0, sourceOut: Math.round(length * 1000) / 1000, rate: 1, animation: talk.id });
    }
    if (clips.length) tracks.push({ id: crypto.randomUUID(), objectId, name: `台词·${person.name}`.slice(0, 160), points: [[person.position.x, person.position.y, person.position.z]], clips });
  }
  const oldItems = new Set((life.tracks ?? []).filter(track => track.name?.startsWith("台词·")).map(track => `track:${track.id}`));
  const folders = (document.timeline?.folders ?? []).filter(folder => folder.name !== "台词动作" || !folder.items.some(item => oldItems.has(item)));
  if (!tracks.length && kept.length === (life.tracks ?? []).length) return;
  if (tracks.length) folders.push({ id: `talk-${crypto.randomUUID().slice(0, 8)}`, name: "台词动作", collapsed: true, items: tracks.map(track => `track:${track.id}`) });
  return { life: { ...life, enabled: true, tracks: [...kept, ...tracks] }, timeline: { ...document.timeline, folders: folders.slice(-32) } };
}

/**
 * ACT: 剧本选角（纯数据版，Agent 用；界面版另外用射线确认脚下和视线）：台词里的角色按名字找场景里的人，
 * 找不到的新建骨骼人物：已有对手时站在他身边1.6米、面向他；都没有时在 focus 附近左右相隔1.6米面对面（三人以上围半圆）。
 * 只按陈设占地避让（整块内景、对手所在的大物体算环境），离别人至少0.6米。返回新文档和按台词顺序的人物id。
 */
export function castSpeakers(document: SceneDocument, script: string, focus: { x: number; z: number }, asset: SceneAsset, colors: readonly string[] = ["#b8433b", "#3f6fb5", "#d29a2e", "#4f8a4a", "#7d54a6", "#2f9aa0"]): { document: SceneDocument; ids: string[]; created: string[] } | undefined {
  const speakers = extractSpeakers(script);
  if (speakers.length < 2) return;
  const footprint = measureAssetFootprint(asset);
  if (!footprint) return;
  const people = document.objects.filter(object => object.visible && /person/i.test(object.asset.shape ?? ""));
  const found = speakers.map(name => people.find(object => object.name === name) ?? people.find(object => object.name.includes(name) || name.includes(object.name)));
  const missing = speakers.filter((_, index) => !found[index]);
  if (!missing.length) return { document, ids: found.map(object => object!.id), created: [] };
  const known = found.filter((object): object is SceneObject => !!object);
  const anchor = known.length ? { x: known.reduce((sum, object) => sum + object.position.x, 0) / known.length, z: known.reduce((sum, object) => sum + object.position.z, 0) / known.length } : focus;
  const floor = known.length ? Math.max(...known.map(object => object.position.y)) : 0;
  const environment = (object: SceneObject) => {
    if (/内景|布景·|轿厢/.test(object.asset.name)) return true;
    const print = known.length ? measureAssetFootprint(object.asset) : undefined;
    return !!print && rectsOverlap(rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z), { x: anchor.x, z: anchor.z, hw: 0.05, hd: 0.05, angle: 0 });
  };
  const occupancy = createOccupancy({ ...document, objects: document.objects.filter(object => !/person/i.test(object.asset.shape ?? "") && !environment(object)) });
  const half = (document.terrain?.size ?? 80) / 2 - 1;
  const placed = people.map(object => ({ x: object.position.x, z: object.position.z }));
  const free = (x: number, z: number) => Math.abs(x) < half && Math.abs(z) < half && !occupancy.blocked(rectFor(footprint, x, z, 0, 1, 1, 0.1)) && !placed.some(point => Math.hypot(point.x - x, point.z - z) < 0.6);
  const spots: { x: number; z: number }[] = [];
  if (known.length) {
    for (const _ of missing) {
      let spot: { x: number; z: number } | undefined;
      for (const radius of [1.6, 2.2, 1.2, 3]) for (let step = 0; step < 12 && !spot; step++) { const angle = step * Math.PI / 6; const x = anchor.x + Math.cos(angle) * radius, z = anchor.z + Math.sin(angle) * radius; if (free(x, z)) spot = { x, z }; }
      if (!spot) return;
      spots.push(spot); placed.push(spot);
    }
  } else {
    const count = missing.length;
    const offsets = count === 2 ? [{ x: -0.8, z: 0 }, { x: 0.8, z: 0 }] : Array.from({ length: count }, (_, index) => { const angle = Math.PI * (0.15 + 0.7 * index / (count - 1)); return { x: -Math.cos(angle) * 1.3, z: -Math.sin(angle) * 1.3 }; });
    let center: { x: number; z: number } | undefined;
    for (let ring = 0; ring <= 8 && !center; ring++) for (let step = 0; step < Math.max(1, ring * 6) && !center; step++) {
      const angle = step / Math.max(1, ring * 6) * Math.PI * 2;
      const at = { x: anchor.x + Math.cos(angle) * ring * 1.5, z: anchor.z + Math.sin(angle) * ring * 1.5 };
      if (offsets.every(offset => free(at.x + offset.x, at.z + offset.z))) center = at;
    }
    if (!center) return;
    for (const offset of offsets) spots.push({ x: center.x + offset.x, z: center.z + offset.z });
  }
  const target = known.length ? anchor : { x: spots.reduce((sum, spot) => sum + spot.x, 0) / spots.length, z: spots.reduce((sum, spot) => sum + spot.z, 0) / spots.length };
  const objects = [...document.objects];
  const ids: string[] = [], created: string[] = [];
  let slot = 0;
  for (const [index, name] of speakers.entries()) {
    const existing = found[index];
    if (existing) { ids.push(existing.id); continue; }
    const spot = spots[slot++]!;
    const x = Math.round(spot.x * 100) / 100, z = Math.round(spot.z * 100) / 100;
    const object = createSceneObject(structuredClone(asset), { x, y: floor, z });
    object.name = name;
    object.height = floor;
    object.rotation = { x: 0, y: faceRotation(footprint, { x: target.x - x, z: target.z - z }), z: 0 };
    const used = new Set(objects.filter(item => item.asset.shape === "riggedPerson").map(item => item.color.toLowerCase()));
    object.color = colors.find(color => !used.has(color)) ?? colors[index % colors.length]!;
    objects.push(object);
    ids.push(object.id); created.push(name);
  }
  return { document: { ...document, objects }, ids, created };
}

export type StageMove = { mover: string; kind: "approach" | "exit"; target?: string; run: boolean };
const approachVerbs = /(走到|走向|走近|走上前|上前|凑近|凑到|靠近|逼近|冲到|冲向|扑向|扑到|来到|跑到|跑向|迎上)/;
const exitVerbs = /(转身离开|转身离去|转身就走|离开|离去|走了|走出|出门|退下|退出|拂袖而去|摔门而去|夺门而出|扬长而去|跑出|跑开|跑了)/;
/**
 * ACT: 舞台提示走位：动作行里“某人走到/走向/上前/逼近某人”“某人离开/转身离去/夺门而出”认成走位；
 * names 是场景里有的角色名（长名字优先匹配），动词前面最近的角色是走的人，动词后面的角色是走近的对象。冲、扑、跑、夺门按跑步速度。
 */
export function parseStageMove(text: string, names: readonly string[]): StageMove | undefined {
  const sorted = [...names].filter(Boolean).sort((a, b) => b.length - a.length);
  const found = (part: string) => { const hits = sorted.flatMap(name => { const at = part.lastIndexOf(name); return at >= 0 ? [{ name, at }] : []; }); return hits.sort((a, b) => b.at - a.at)[0]?.name; };
  for (const [kind, pattern] of [["exit", exitVerbs], ["approach", approachVerbs]] as const) {
    const match = pattern.exec(text);
    if (!match) continue;
    const before = text.slice(0, match.index), after = text.slice(match.index + match[0].length);
    // 走的人：动词前面、同一小句里最近的角色名。
    const clause = before.split(/[，。；！？,;!?]/).at(-1) ?? "";
    const mover = found(clause) ?? found(before);
    if (!mover) continue;
    const target = kind === "approach" ? sorted.filter(name => name !== mover).map(name => ({ name, at: after.indexOf(name) })).filter(hit => hit.at >= 0 && hit.at < 8).sort((a, b) => a.at - b.at)[0]?.name : undefined;
    return { mover, kind, ...(target ? { target } : {}), run: /冲|扑|跑|夺门/.test(match[0]) };
  }
  return undefined;
}

/**
 * ACT: 按剧本动作行给人加走位片段（并进“台词·”轨道，重新按对白分镜时一起重算）：动作行在成片里的时刻（它那一段全景镜头的开头）开始走。
 * 走近：停在对方面前1.6米；离开：背对其他人走开4米。步行1.35米/秒，跑3.5米/秒。人已经有别的动线（手排的、群演路人）就不动它；只给骨骼人物走位。
 */
export function withStageMoves(document: SceneDocument, cameras: readonly SceneCamera[], script: string): Pick<SceneDocument, "life" | "timeline"> | undefined {
  const life = getSceneLife(document.life);
  const people = document.objects.filter(object => object.visible && /^(riggedPerson|person)$/.test(object.asset.shape ?? ""));
  if (!people.length) return;
  const byName = (name: string) => people.find(object => object.name === name) ?? people.find(object => object.name.startsWith(name));
  const names = [...new Set([...extractSpeakers(script), ...people.map(object => object.name)])].filter(name => byName(name));
  const notes = cameras.flatMap(camera => (camera.shots ?? []).filter(shot => shot.note).map(shot => ({ note: shot.note!, start: shot.start })));
  const where = new Map(people.map(object => [object.id, { x: object.position.x, y: object.position.y, z: object.position.z }]));
  const moves: { objectId: string; clip: PerformanceClip }[] = [];
  for (const line of parseDialogue(script, extractSpeakers(script).length ? extractSpeakers(script) : ["甲"])) {
    if (line.speaker >= 0) continue;
    const move = parseStageMove(line.text, names);
    // 只给骨骼人物（主演，按剧本新建的角色）走位：胶囊人群演按片段走位在整块布景里常接不上导航，还会丢掉说话时的晃动。
    const mover = move && byName(move.mover);
    if (mover && mover.asset.shape !== "riggedPerson") continue;
    const at = notes.find(item => item.note === line.text.slice(0, 500))?.start;
    if (!move || !mover || at === undefined) continue;
    const from = where.get(mover.id)!;
    let to: { x: number; y: number; z: number } | undefined;
    if (move.kind === "approach") {
      const others = people.filter(object => object.id !== mover.id);
      const target = move.target ? byName(move.target) : others.map(object => ({ object, at: where.get(object.id)! })).sort((a, b) => Math.hypot(a.at.x - from.x, a.at.z - from.z) - Math.hypot(b.at.x - from.x, b.at.z - from.z))[0]?.object;
      const point = target && where.get(target.id);
      if (!point) continue;
      const gap = Math.hypot(from.x - point.x, from.z - point.z);
      // 停在对方面前1.6米（说话的距离；再近导航起步会卡在对方身边，后面的离开走不动）；本来就在2.2米内不用走。
      if (gap < 2.2) continue;
      to = { x: point.x + (from.x - point.x) / gap * 1.6, y: from.y, z: point.z + (from.z - point.z) / gap * 1.6 };
    } else {
      // 背离的是对戏的人（说台词的角色），不是满屋的群演。
      const speakers = new Set(extractSpeakers(script).map(name => byName(name)?.id));
      const others = people.filter(object => object.id !== mover.id && (speakers.size < 2 || speakers.has(object.id))).map(object => where.get(object.id)!);
      const center = others.length ? { x: others.reduce((sum, point) => sum + point.x, 0) / others.length, z: others.reduce((sum, point) => sum + point.z, 0) / others.length } : { x: from.x, z: from.z - 1 };
      const away = { x: from.x - center.x, z: from.z - center.z }, length = Math.hypot(away.x, away.z) || 1;
      to = { x: from.x + away.x / length * 4, y: from.y, z: from.z + away.z / length * 4 };
    }
    const round = (value: number) => Math.round(value * 1000) / 1000;
    const seconds = round(Math.max(0.5, Math.hypot(to.x - from.x, to.z - from.z) / (move.run ? 3.5 : 1.35)));
    moves.push({ objectId: mover.id, clip: { id: crypto.randomUUID(), name: move.kind === "exit" ? "离开" : "走近", kind: "move", start: round(at), sourceDuration: seconds, sourceIn: 0, sourceOut: seconds, rate: 1, points: [[round(from.x), round(from.y), round(from.z)], [round(to.x), round(to.y), round(to.z)]] } });
    where.set(mover.id, to);
  }
  if (!moves.length) return;
  const tracks = [...(life.tracks ?? [])];
  const added: string[] = [];
  for (const objectId of new Set(moves.map(item => item.objectId))) {
    const index = tracks.findIndex(track => track.objectId === objectId);
    const person = people.find(object => object.id === objectId)!;
    const moveClips = moves.filter(item => item.objectId === objectId).map(item => item.clip);
    if (index < 0) {
      const track: PerformanceTrack = { id: crypto.randomUUID(), objectId, name: `台词·${person.name}`.slice(0, 160), points: [[person.position.x, person.position.y, person.position.z]], clips: moveClips };
      tracks.push(track); added.push(track.id);
      continue;
    }
    const existing = tracks[index]!;
    // 只并进按对白生成的“台词·”轨道；胶囊人的晃动是直接控制轨道，和走位不能同轨，走的人就不晃了。
    if (!existing.name?.startsWith("台词·")) continue;
    tracks[index] = existing.controller === "object" ? { id: existing.id, objectId, name: existing.name, points: existing.points, clips: moveClips } : { ...existing, clips: [...(existing.clips ?? []), ...moveClips].sort((a, b) => a.start - b.start) };
  }
  const folders = [...(document.timeline?.folders ?? [])];
  const talkFolder = folders.findIndex(folder => folder.name === "台词动作");
  if (added.length) {
    if (talkFolder >= 0) folders[talkFolder] = { ...folders[talkFolder]!, items: [...folders[talkFolder]!.items, ...added.map(id => `track:${id}`)] };
    else folders.push({ id: `talk-${crypto.randomUUID().slice(0, 8)}`, name: "台词动作", collapsed: true, items: added.map(id => `track:${id}`) });
  }
  return { life: { ...life, enabled: true, tracks }, timeline: { ...document.timeline, folders: folders.slice(-32) } };
}

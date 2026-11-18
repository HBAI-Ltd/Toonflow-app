import { z } from "@toonflow/nodes-scaffold/runtime";

const coordinate = z.number().finite().min(-10000).max(10000);
const vector = z.strictObject({ x: coordinate, y: coordinate, z: coordinate });
const seconds = z.number().finite().min(0).max(86400);
const identifier = z.string().trim().min(1).max(160);
type Vector = z.infer<typeof vector>;
// ACT: 轨迹锚点只管位置；镜头的焦段、转向、俯仰、翻滚由镜头关键点按时间控制。
const pathPoint = vector;
export type PathPoint = z.infer<typeof pathPoint>;
export type PathTurn = { pan: number; tilt: number; roll: number };
// ACT: 镜头关键点：在这段镜头的某一时刻（at为0–1的时间进度）定下焦段、转向、俯仰、翻滚，关键点之间平滑过渡；
// 第一个关键点之前从这段镜头原本的画面过渡过去，最后一个之后保持不变。转向/俯仰/翻滚是相对原朝向的度数，可以超过一圈（整圈翻滚、翻跟头）。
export const shotKeySchema = z.strictObject({
  id: identifier,
  at: z.number().finite().min(0).max(1),
  focal: z.number().finite().min(12).max(200),
  pan: z.number().finite().min(-1440).max(1440),
  tilt: z.number().finite().min(-1440).max(1440),
  roll: z.number().finite().min(-1440).max(1440),
});
export type ShotKey = z.infer<typeof shotKeySchema>;
export type ShotKeyValues = Omit<ShotKey, "id" | "at">;

/** ACT: 成片画幅（宽高比）：横屏16:9、电影宽银幕2.39:1和1.85:1、老电视4:3、竖屏短剧9:16。 */
export const filmFormats = { "16:9": 16 / 9, "2.39:1": 2.39, "1.85:1": 1.85, "4:3": 4 / 3, "9:16": 9 / 16 } as const;
export type FilmFormat = keyof typeof filmFormats;
export const filmFormatNames: Record<FilmFormat, string> = { "16:9": "横屏 16:9", "2.39:1": "宽银幕 2.39", "1.85:1": "遮幅 1.85", "4:3": "4:3", "9:16": "竖屏 9:16" };
/** 当前成片画幅：取景窗、机位视锥、全屏预演、截图、镜头表、预演小样统一使用；由场景文档的 film.format 设定（setFilmFormat）。 */
export let filmAspect = 16 / 9;
export function setFilmFormat(format: FilmFormat | undefined) { filmAspect = filmFormats[format ?? "16:9"] ?? 16 / 9; }
/** 画幅高（毫米）：长边按全画幅36毫米算，竖屏时长边是高。 */
export function getFilmFrameHeight(aspect = filmAspect) { return aspect >= 1 ? 36 / aspect : 36; }
/** 成片像素尺寸：长边longEdge，宽高都取偶数（视频编码要求）。 */
export function getFilmSize(longEdge: number, aspect = filmAspect) {
  const even = (value: number) => Math.max(2, Math.round(value / 2) * 2);
  return aspect >= 1 ? { width: even(longEdge), height: even(longEdge / aspect) } : { width: even(longEdge * aspect), height: even(longEdge) };
}
export const focalLimits = { min: 12, max: 200 } as const;
export const minShotSeconds = 0.2;
/** 只有机位、没有任何演绎动线时，成片的最短长度（秒）。 */
export const minFilmSeconds = 10;
export const maxPathPoints = 256;

function separation(a: Vector, b: Vector) { return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); }

// 一个画面：机位、注视点、焦距和云台横滚角（荷兰角）。
export const cameraFramingSchema = z.strictObject({
  position: vector,
  target: vector,
  focalLength: z.number().finite().min(focalLimits.min).max(focalLimits.max),
  roll: z.number().finite().min(-180).max(180).optional(),
}).refine(framing => separation(framing.position, framing.target) > 0.000001, { path: ["target"], message: "摄像机位置与注视点不能重合" });

// ACT: 点跟踪：point是点中的那一点——有objectId时记在物体自己的坐标里（物体走动、转身都跟着），没有时是场景里固定的一点。
// aim是云台盯住这一点；follow是机位带着当前相对位置跟着它走。
// 云台手感（像稳定器的智能跟随）：smooth是跟随的平滑时间（秒），目标突然变化时镜头柔和地追过去；
// deadzone是死区角度，目标在死区里晃动镜头不动；limit是限位，相对镜头原本朝向最多转多少度，超出就停在限位上。
export const cameraTrackingSchema = z.strictObject({
  objectId: identifier.optional(),
  point: vector.optional(),
  mode: z.enum(["aim", "follow"]),
  smooth: z.number().finite().min(0).max(3).optional(),
  deadzone: z.number().finite().min(0).max(30).optional(),
  limit: z.number().finite().min(5).max(180).optional(),
  // 防抖（0–1）：被拍物体剧烈抖动、高速旋转时，镜头盯的是理顺后的位置，不跟着乱晃乱甩。
  stabilize: z.number().finite().min(0).max(1).optional(),
}).refine(track => !!track.objectId || !!track.point, { path: ["point"], message: "跟踪需要一个物体或一个点" });
export const trackingDefaults = { smooth: 0.4, deadzone: 0, limit: 180, stabilize: 0.5 } as const;

// ACT: 一段镜头只有一个画面frame，再加一条划出来的机位轨迹path：这段时间里机位沿轨迹从头走到尾，镜头始终对着注视点；
// aimEnd是这段镜头结束时的注视点（摇镜）；焦段、转向、翻滚的变化都写在关键点keys里。
const shotFields = {
  frame: cameraFramingSchema,
  path: z.array(pathPoint).min(2).max(maxPathPoints).optional(),
  aimEnd: vector.optional(),
  easing: z.enum(["smooth", "linear"]).optional(),
  // 这段镜头自己的跟踪：同一台机位不同镜头段可以盯不同的东西；没有时沿用机位的跟踪。
  track: cameraTrackingSchema.optional(),
  keys: z.array(shotKeySchema).max(64).optional(),
  // 手持感：shake是晃动强度（0–1），shakeRate是晃动节奏倍数；按时间生成，拖播放头时画面稳定可复现。
  shake: z.number().finite().min(0).max(1).optional(),
  shakeRate: z.number().finite().min(0.25).max(4).optional(),
  // 几台机位的镜头段时间重叠时，成片播front大的那段（在成片行里点选决定）。
  front: z.number().int().min(0).max(1000000).optional(),
  // 镜头备注：这段镜头里的台词或画面说明；监看和全屏预演显示成字幕，镜头表写进备注栏。
  note: z.string().trim().min(1).max(500).optional(),
};

export const cameraShotSchema = z.strictObject({
  id: identifier,
  // 成片时间（秒），0是演绎开始的那一刻。
  start: seconds,
  end: seconds,
  ...shotFields,
}).refine(shot => shot.end - shot.start >= minShotSeconds - 0.000001, { path: ["end"], message: "镜头段不能短于0.2秒" });


// ACT: 机位自身的frame是镜头段以外时刻的画面；shots是在时间轴上框选出来的镜头段，各自在自己的时间范围里生效。
export const cameraTrackSchema = z.strictObject({
  id: identifier,
  name: z.string().trim().min(1).max(160),
  enabled: z.boolean().optional(),
  frame: cameraFramingSchema,
  shots: z.array(cameraShotSchema).max(64).optional(),
  track: cameraTrackingSchema.optional(),
}).superRefine((camera, context) => {
  const shots = camera.shots ?? [];
  if (new Set(shots.map(shot => shot.id)).size !== shots.length) context.addIssue({ code: "custom", path: ["shots"], message: "同一机位的镜头段ID不能重复" });
  for (let index = 1; index < shots.length; index++) {
    if (shots[index]!.start < shots[index - 1]!.end - 0.000001) context.addIssue({ code: "custom", path: ["shots", index, "start"], message: "镜头段须按时间排列且互不重叠" });
  }
});

export type CameraFraming = z.infer<typeof cameraFramingSchema>;
export type CameraShot = z.infer<typeof cameraShotSchema>;
export type CameraTracking = z.infer<typeof cameraTrackingSchema>;
export type SceneCamera = z.infer<typeof cameraTrackSchema>;
/** 一段取景：镜头段，或机位在镜头段以外时刻的画面。 */
export type CameraTake = Pick<CameraShot, "frame" | "path" | "aimEnd" | "easing" | "shake" | "shakeRate" | "track" | "keys">;
/** 取样出来的画面：有关键点时带up（画面上方向），整圈翻滚、翻跟头都能表示；存回文档前用toFraming去掉。 */
export type CameraPose = CameraFraming & { up?: Vector };
export function toFraming(pose: CameraPose): CameraFraming {
  return { position: { ...pose.position }, target: { ...pose.target }, focalLength: pose.focalLength, ...(pose.roll ? { roll: pose.roll } : {}) };
}
/** 跟踪用：给出跟踪点此刻的世界坐标；物体不存在时返回undefined，镜头退回到写下的画面。 */
export type CameraSubjectResolver = (track: CameraTracking) => Vector | undefined;

function clampUnit(value: number) { return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0; }
function clampCoordinate(value: number) { return Math.min(10000, Math.max(-10000, value)); }
function clampVector(value: Vector): Vector { return { x: clampCoordinate(value.x), y: clampCoordinate(value.y), z: clampCoordinate(value.z) }; }
function clampFocal(value: number) { return Math.min(focalLimits.max, Math.max(focalLimits.min, value)); }
function length(value: Vector) { return Math.hypot(value.x, value.y, value.z); }
function scaled(value: Vector, amount: number): Vector { return { x: value.x * amount, y: value.y * amount, z: value.z * amount }; }
function added(a: Vector, b: Vector): Vector { return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function difference(a: Vector, b: Vector): Vector { return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function mixed(a: Vector, b: Vector, amount: number): Vector { return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount, z: a.z + (b.z - a.z) * amount }; }
function normalized(value: Vector): Vector { const size = length(value); return size > 0.000001 ? scaled(value, 1 / size) : { x: 0, y: 0, z: -1 }; }
function cross(a: Vector, b: Vector): Vector { return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function copyFraming(framing: CameraFraming): CameraFraming { return { position: { ...framing.position }, target: { ...framing.target }, focalLength: framing.focalLength, ...(framing.roll ? { roll: framing.roll } : {}) }; }
function withFraming(framing: CameraFraming, position: Vector, target: Vector, focalLength = framing.focalLength): CameraFraming {
  return { ...copyFraming(framing), position, target, focalLength };
}

/** 画面的前、右、上方向和机位到注视点的距离。 */
export function getCameraBasis(framing: CameraFraming) {
  const offset = difference(framing.target, framing.position);
  const forward = normalized(offset);
  const side = cross(forward, { x: 0, y: 1, z: 0 });
  const right = length(side) > 0.000001 ? normalized(side) : { x: 1, y: 0, z: 0 };
  return { forward, right, up: cross(right, forward), distance: Math.max(0.000001, length(offset)) };
}

const pathCache = new WeakMap<readonly Vector[], number[]>();
function pathLengths(points: readonly Vector[]) {
  let lengths = pathCache.get(points);
  if (!lengths) {
    lengths = [0];
    for (let index = 1; index < points.length; index++) lengths.push(lengths[index - 1]! + separation(points[index - 1]!, points[index]!));
    pathCache.set(points, lengths);
  }
  return lengths;
}
// ACT: 轨迹存的是锚点，机位走的是穿过各锚点的平滑曲线（向心Catmull-Rom，不会打圈）；锚点i正好在曲线第i*curveSteps个点上。
// 很密的旧轨迹（几十上百个点）本身已经够顺，原样使用。
export const curveSteps = 12;
const curveCache = new WeakMap<readonly Vector[], readonly Vector[]>();
function curveSegment(p0: Vector, p1: Vector, p2: Vector, p3: Vector, t: number): Vector {
  const knot = (a: Vector, b: Vector) => Math.max(1e-4, Math.sqrt(separation(a, b)));
  const t1 = knot(p0, p1), t2 = t1 + knot(p1, p2), t3 = t2 + knot(p2, p3);
  const u = t1 + (t2 - t1) * t;
  const blend = (a: Vector, b: Vector, from: number, to: number) => mixed(a, b, (u - from) / (to - from));
  const a1 = blend(p0, p1, 0, t1), a2 = blend(p1, p2, t1, t2), a3 = blend(p2, p3, t2, t3);
  return blend(blend(a1, a2, 0, t2), blend(a2, a3, t1, t3), t1, t2);
}
export function getPathCurve(points: readonly Vector[]): readonly Vector[] {
  if (points.length < 2 || points.length > 48) return points;
  let curve = curveCache.get(points);
  if (curve) return curve;
  const result: Vector[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const p1 = points[index]!, p2 = points[index + 1]!;
    const p0 = points[index - 1] ?? difference(scaled(p1, 2), p2), p3 = points[index + 2] ?? difference(scaled(p2, 2), p1);
    for (let step = 0; step < curveSteps; step++) result.push(step ? clampVector(curveSegment(p0, p1, p2, p3, step / curveSteps)) : { ...p1 });
  }
  result.push({ ...points[points.length - 1]! });
  curve = result;
  curveCache.set(points, curve);
  return curve;
}
/** 把手画的线精简成少量锚点（保留拐弯处），最多max个；曲线穿过这些锚点，形状和画的一样顺。 */
export function toPathAnchors<T extends Vector>(points: readonly T[], max = 10): T[] {
  if (points.length <= 2) return points.map(point => ({ ...point }));
  const length = polylineLength(points);
  let tolerance = Math.max(0.03, length * 0.012);
  for (;;) {
    const keep = new Set([0, points.length - 1]);
    const stack: [number, number][] = [[0, points.length - 1]];
    while (stack.length) {
      const [from, to] = stack.pop()!;
      const a = points[from]!, b = points[to]!, chord = difference(b, a), span = Math.max(1e-9, chord.x ** 2 + chord.y ** 2 + chord.z ** 2);
      let worst = -1, worstDistance = tolerance;
      for (let index = from + 1; index < to; index++) {
        const offset = difference(points[index]!, a);
        const t = Math.min(1, Math.max(0, (offset.x * chord.x + offset.y * chord.y + offset.z * chord.z) / span));
        const distance = separation(points[index]!, added(a, scaled(chord, t)));
        if (distance > worstDistance) { worst = index; worstDistance = distance; }
      }
      if (worst > 0) { keep.add(worst); stack.push([from, worst], [worst, to]); }
    }
    if (keep.size <= max) return [...keep].sort((x, y) => x - y).map(index => ({ ...points[index]! }));
    tolerance *= 1.5;
  }
}
/** 沿轨迹曲线按弧长取第progress处的位置，机位在轨迹上匀速前进（再由缓动决定起停）。 */
export function sampleCameraPath(anchors: readonly Vector[], progress: number): Vector {
  const points = getPathCurve(anchors);
  const lengths = pathLengths(points);
  const total = lengths[lengths.length - 1]!;
  if (total <= 0.000001) return { ...points[0]! };
  const goal = total * clampUnit(progress);
  let index = 1;
  while (index < lengths.length - 1 && lengths[index]! < goal) index++;
  const span = lengths[index]! - lengths[index - 1]!;
  return mixed(points[index - 1]!, points[index]!, span > 0 ? (goal - lengths[index - 1]!) / span : 0);
}

export function getPathLength(points: readonly Vector[]) { const curve = getPathCurve(points); return pathLengths(curve)[curve.length - 1]!; }
function polylineLength(points: readonly Vector[]) { return pathLengths(points)[points.length - 1]!; }

/** 一段取景在进度progress（0–1）时的画面，不含跟踪。 */
export function sampleCameraTake(take: CameraTake, progress: number): CameraPose {
  const t = clampUnit(progress);
  const amount = take.easing === "linear" ? t : t * t * (3 - 2 * t);
  const { frame } = take;
  const position = take.path ? sampleCameraPath(take.path, amount) : { ...frame.position };
  let target = take.aimEnd ? mixed(frame.target, take.aimEnd, amount) : { ...frame.target };
  if (separation(position, target) <= 0.000001) target = added(position, getCameraBasis(frame).forward);
  const focalLength = frame.focalLength;
  const roll = frame.roll ?? 0;
  if (!take.keys?.length) return { position, target, focalLength, ...(Math.abs(roll) > 0.0001 ? { roll } : {}) };
  // 镜头关键点按时间（不是缓动后的位置）过渡焦段与朝向。
  const lens = getShotKeyValues(take, t);
  return { ...orientCamera(position, target, roll, lens.pan, lens.tilt, lens.roll), focalLength: clampFocal(lens.focal) };
}

function wrapDegrees(value: number) { const wrapped = ((value + 180) % 360 + 360) % 360 - 180; return Math.abs(wrapped) < 0.0001 ? 0 : Math.round(wrapped * 100) / 100; }
/**
 * 从机位看向注视点的原朝向出发，再转向pan、俯仰tilt、翻滚roll（度）。用“画面上方向”up表示结果，
 * 俯仰越过±90°（翻跟头）、翻滚转整圈都连续，不会在头顶突然翻转。
 */
export function orientCamera(position: Vector, target: Vector, baseRoll: number, pan: number, tilt: number, roll: number): CameraPose {
  const offset = difference(target, position);
  const distance = Math.max(0.000001, length(offset));
  const forward0 = scaled(offset, 1 / distance);
  const yaw = Math.atan2(forward0.x, -forward0.z) + pan * Math.PI / 180;
  const pitch = Math.asin(Math.min(1, Math.max(-1, forward0.y))) + tilt * Math.PI / 180;
  const forward = { x: Math.cos(pitch) * Math.sin(yaw), y: Math.sin(pitch), z: -Math.cos(pitch) * Math.cos(yaw) };
  const right = { x: Math.cos(yaw), y: 0, z: Math.sin(yaw) };
  const up0 = cross(right, forward);
  const angle = (baseRoll + roll) * Math.PI / 180;
  const up = normalized(added(scaled(up0, Math.cos(angle)), scaled(cross(forward, up0), Math.sin(angle))));
  const total = wrapDegrees(baseRoll + roll);
  return { position: { ...position }, target: clampVector(added(position, scaled(forward, distance))), focalLength: 35, ...(total ? { roll: total } : {}), up };
}
/**
 * 曲线穿过每个关键点：中间的关键点按前后走势定斜率（单调三次插值，不会冲过头），首尾斜率为0缓入缓出；
 * 只有两个关键点时就是普通的缓入缓出。速度在关键点处连续，推拉、转向不会每到一个点顿一下。
 */
function throughKeys(times: readonly number[], values: readonly number[], t: number) {
  const count = values.length;
  if (count === 1 || t <= times[0]!) return values[0]!;
  if (t >= times[count - 1]!) return values[count - 1]!;
  let index = 1;
  while (index < count - 1 && t > times[index]!) index++;
  const span = (at: number) => Math.max(0.000001, times[at + 1]! - times[at]!);
  const slope = (at: number) => (values[at + 1]! - values[at]!) / span(at);
  const tangent = (at: number) => {
    if (at <= 0 || at >= count - 1) return 0;
    const before = slope(at - 1), after = slope(at);
    if (before * after <= 0) return 0;
    const w1 = 2 * span(at) + span(at - 1), w2 = span(at) + 2 * span(at - 1);
    return (w1 + w2) / (w1 / before + w2 / after);
  };
  const h = span(index - 1), x = (t - times[index - 1]!) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * values[index - 1]! + (x3 - 2 * x2 + x) * h * tangent(index - 1) + (-2 * x3 + 3 * x2) * values[index]! + (x3 - x2) * h * tangent(index);
}
/** 这段镜头第progress（0–1时间进度）时刻的焦段、转向、俯仰、翻滚：曲线平滑穿过各关键点，焦段按倍率过渡，看起来匀速推拉。 */
export function getShotKeyValues(take: Pick<CameraTake, "frame" | "keys">, progress: number): ShotKeyValues {
  const t = clampUnit(progress);
  const keys = [...(take.keys ?? [])].sort((a, b) => a.at - b.at);
  const start = { at: 0, focal: take.frame.focalLength, pan: 0, tilt: 0, roll: 0 };
  const frames = keys.length && keys[0]!.at <= 0.0001 ? keys : [start, ...keys];
  const times = frames.map(key => key.at);
  const channel = (pick: (key: (typeof frames)[number]) => number) => throughKeys(times, frames.map(pick), t);
  return { focal: Math.exp(channel(key => Math.log(Math.max(1, key.focal)))), pan: channel(key => key.pan), tilt: channel(key => key.tilt), roll: channel(key => key.roll) };
}

/** 每个锚点在轨迹曲线上的弧长位置（米）。 */
function anchorDistances(points: readonly Vector[]) {
  const curve = getPathCurve(points);
  const lengths = pathLengths(curve);
  return points.map((_, index) => lengths[curve === points ? index : index * curveSteps]!);
}
/** 这一刻生效的跟踪：所在镜头段自己的，否则机位的。 */
export function getCameraTrackingAt(camera: SceneCamera, time: number): CameraTracking | undefined {
  return getCameraShotAt(camera, time)?.track ?? camera.track;
}
// ACT: 手持感：几组频率互不成倍数的正弦叠成平滑的随机晃动（位置、转向、俯仰、横滚各一路），由时间和镜头段决定，
// 同一时刻永远是同一个晃法，拖播放头、反复预演都一样。跟踪、云台之后再叠加，像人扛着稳定器拍。
function seedOf(text: string) { let hash = 2166136261; for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619); return (hash >>> 0) / 4294967296; }
export function applyHandheld(pose: CameraFraming, camera: SceneCamera, time: number): CameraFraming {
  const shot = getCameraShotAt(camera, time);
  const amount = shot?.shake ?? 0;
  if (!shot || amount <= 0) return pose;
  const seed = seedOf(shot.id) * 100, t = time * (shot.shakeRate ?? 1);
  const noise = (channel: number) => {
    const phase = seed + channel * 7.31;
    return 0.55 * Math.sin(2 * Math.PI * 0.37 * t + phase) + 0.3 * Math.sin(2 * Math.PI * 0.91 * t + phase * 1.7) + 0.15 * Math.sin(2 * Math.PI * 2.3 * t + phase * 2.9);
  };
  const posed = pose as CameraPose;
  if (posed.up) {
    // 有up（关键点控制的朝向，可能倒着拍）：在镜头自己的坐标里加一点位移、转向、俯仰和翻滚。
    const offsetVector = difference(pose.target, pose.position), distance = length(offsetVector);
    const forward = normalized(offsetVector), up = normalized(posed.up), right = normalized(cross(forward, up));
    const shift = added(added(scaled(right, noise(0) * 0.05 * amount), scaled(up, noise(1) * 0.04 * amount)), scaled(forward, noise(2) * 0.03 * amount));
    const position = clampVector(added(pose.position, shift));
    const turned = normalized(added(added(forward, scaled(right, Math.tan(noise(3) * 1.6 * amount * Math.PI / 180))), scaled(up, Math.tan(noise(4) * 1.2 * amount * Math.PI / 180))));
    const upright = normalized(difference(up, scaled(turned, up.x * turned.x + up.y * turned.y + up.z * turned.z)));
    const angle = noise(5) * 2.2 * amount * Math.PI / 180;
    return { ...pose, position, target: clampVector(added(position, scaled(turned, distance))), up: normalized(added(scaled(upright, Math.cos(angle)), scaled(cross(turned, upright), Math.sin(angle)))) } as CameraPose;
  }
  const { right, up, forward } = getCameraBasis(pose);
  const offset = added(added(scaled(right, noise(0) * 0.05 * amount), scaled(up, noise(1) * 0.04 * amount)), scaled(forward, noise(2) * 0.03 * amount));
  const moved = withFraming(pose, clampVector(added(pose.position, offset)), clampVector(added(pose.target, offset)));
  const looked = lookCamera(moved, noise(3) * 1.6 * amount * Math.PI / 180, noise(4) * 1.2 * amount * Math.PI / 180);
  return rollCamera(looked, noise(5) * 2.2 * amount);
}

export function getCameraShot(camera: SceneCamera, shotId?: string | null) {
  return shotId ? camera.shots?.find(shot => shot.id === shotId) : undefined;
}

/** 盖住这一刻的镜头段。时间范围含头不含尾，相邻两段在交界处属于后一段。 */
export function getCameraShotAt(camera: SceneCamera, time: number) {
  return camera.shots?.find(shot => time >= shot.start && time < shot.end);
}

/** 机位在成片第time秒的画面：落在镜头段里按镜头段走，否则是机位自身的画面；再按跟踪瞄准或跟随物体。 */
export function sampleSceneCamera(camera: SceneCamera, time: number, resolve?: CameraSubjectResolver): CameraFraming {
  const at = Number.isFinite(time) ? Math.max(0, time) : 0;
  const shot = getCameraShotAt(camera, at);
  const pose = shot ? sampleCameraTake(shot, (at - shot.start) / Math.max(0.000001, shot.end - shot.start)) : copyFraming(camera.frame);
  return applyCameraTracking(pose, shot?.track ?? camera.track, resolve);
}

export function applyCameraTracking(pose: CameraFraming, track: CameraTracking | undefined, resolve?: CameraSubjectResolver): CameraFraming {
  const subject = track && resolve?.(track);
  if (!track || !subject) return pose;
  const position = track.mode === "follow" ? clampVector(added(subject, difference(pose.position, pose.target))) : pose.position;
  return separation(position, subject) > 0.000001 ? { ...pose, position, target: { ...subject } } : pose;
}

/** 这一刻有镜头段的机位，按成片优先级排好：front大的在前，一样时开始得晚的在前。 */
export function getCoveringCameras(cameras: readonly SceneCamera[], time: number): { camera: SceneCamera; shot: CameraShot }[] {
  const result: { camera: SceneCamera; shot: CameraShot }[] = [];
  for (const camera of cameras) {
    if (camera.enabled === false) continue;
    const shot = getCameraShotAt(camera, time);
    if (shot) result.push({ camera, shot });
  }
  return result.sort((a, b) => (b.shot.front ?? 0) - (a.shot.front ?? 0) || b.shot.start - a.shot.start);
}
/** 成片这一刻用哪台机位：只有镜头段盖住这一刻的机位才上画，重叠时按优先级；没有镜头段的时刻成片是黑场。 */
export function getProgramCamera(cameras: readonly SceneCamera[], time: number): SceneCamera | undefined {
  return getCoveringCameras(cameras, time)[0]?.camera;
}
/** 所有镜头段里最大的front，新镜头段或被选中上画的镜头段取它加一。 */
export function getTopShotFront(cameras: readonly SceneCamera[]) {
  return cameras.reduce((top, camera) => Math.max(top, ...(camera.shots ?? []).map(shot => shot.front ?? 0)), 0);
}

/** 成片按机位分成的段（相邻同一机位合并），时间轴顶部“成片”行显示它。 */
export function getProgramSegments(cameras: readonly SceneCamera[], duration: number): { start: number; end: number; cameraId: string; choices: string[] }[] {
  const end = Math.max(duration, 0.000001);
  const times = new Set([0]);
  for (const camera of cameras) for (const shot of camera.shots ?? []) { times.add(shot.start); times.add(shot.end); }
  // choices：这一段时间里同时有镜头段的机位（多于一个就是重叠，可在成片行里选播哪个）。
  const segments: { start: number; end: number; cameraId: string; choices: string[] }[] = [];
  let open = false;
  for (const time of [...times].filter(time => time >= 0 && time < end).sort((a, b) => a - b)) {
    const camera = getProgramCamera(cameras, time);
    const last = segments.at(-1);
    // 没有镜头段的空档不出现在成片行里。
    if (!camera) { if (open && last) last.end = time; open = false; continue; }
    const choices = getCoveringCameras(cameras, time).map(item => item.camera.id);
    if (open && last && last.cameraId === camera.id && last.choices.join() === choices.join()) continue;
    if (open && last) last.end = time;
    segments.push({ start: time, end, cameraId: camera.id, choices });
    open = true;
  }
  return segments;
}

/** 所有机位里最晚结束的镜头段的结束时间，用来撑开成片长度。 */
export function getCamerasDuration(cameras: readonly SceneCamera[]) {
  return cameras.reduce((duration, camera) => Math.max(duration, ...(camera.shots ?? []).map(shot => shot.end)), 0);
}

/** time所在的空档（没有镜头段的时间范围）；time落在某个镜头段里时返回undefined。ignoreId用于移动或拉伸自己时把自己排除。 */
export function getCameraGap(camera: SceneCamera, time: number, ignoreId?: string): { start: number; end: number } | undefined {
  let start = 0, end = 86400;
  for (const shot of camera.shots ?? []) {
    if (shot.id === ignoreId) continue;
    if (time >= shot.start && time < shot.end) return undefined;
    if (shot.end <= time) start = Math.max(start, shot.end);
    else end = Math.min(end, shot.start);
  }
  return { start, end };
}

export function createSceneCamera(id: string, name: string, frame: CameraFraming): SceneCamera {
  return { id, name, frame: copyFraming(frame) };
}

/**
 * ACT: 切割镜头段：在成片第time秒把一段镜头切成前后两段，后段id为newId。
 * 切点处机位位置、朝向、焦距、倾斜都接得上：前段的终点和后段的起点就是原镜头那一刻的画面，轨迹在切点处断开成两条。
 */
export function splitCameraShot(camera: SceneCamera, shotId: string, time: number, newId: string): SceneCamera {
  const shot = getCameraShot(camera, shotId);
  if (!shot || !Number.isFinite(time) || time < shot.start + minShotSeconds - 1e-6 || time > shot.end - minShotSeconds + 1e-6) throw new Error("切点离镜头段两端太近（每段至少0.2秒）");
  const progress = (time - shot.start) / (shot.end - shot.start);
  const amount = shot.easing === "linear" ? progress : progress * progress * (3 - 2 * progress);
  const { frame } = shot;
  const actual = sampleCameraTake(shot, progress);
  const baseTarget = shot.aimEnd ? mixed(frame.target, shot.aimEnd, amount) : { ...frame.target };
  const baseFocal = frame.focalLength;
  const baseRoll = frame.roll ?? 0;
  let head: PathPoint[] | undefined, tail: PathPoint[] | undefined;
  if (shot.path) {
    const at = anchorDistances(shot.path);
    const cutArc = at[at.length - 1]! * amount;
    const cut = clampVector(sampleCameraPath(shot.path, amount));
    head = [...shot.path.filter((_, index) => at[index]! < cutArc - 0.01), cut];
    tail = [cut, ...shot.path.filter((_, index) => at[index]! > cutArc + 0.01)];
  }
  // 关键点按时间分到前后两段；切点两边各补一个关键点，切开后焦段、朝向接得上。
  let headKeys: ShotKey[] | undefined, tailKeys: ShotKey[] | undefined;
  if (shot.keys?.length) {
    const values = getShotKeyValues(shot, progress);
    headKeys = [...shot.keys.filter(key => key.at < progress - 0.0001).map(key => ({ ...key, at: Math.min(1, key.at / progress) })), { id: shot.id + "-cut", at: 1, ...values }];
    tailKeys = [{ id: newId + "-cut", at: 0, ...values }, ...shot.keys.filter(key => key.at > progress + 0.0001).map(key => ({ ...key, at: Math.max(0, (key.at - progress) / (1 - progress)) }))];
  }
  const keep = (path: PathPoint[] | undefined) => path && path.length > 1 && getPathLength(path) >= 0.05 ? { path } : {};
  const { id: _id, start: _start, end: _end, path: _path, aimEnd: _aimEnd, keys: _keys, ...shared } = shot;
  const before: CameraShot = { ...shared, id: shot.id, start: shot.start, end: time, ...keep(head), ...(headKeys ? { keys: headKeys } : {}),
    ...(shot.aimEnd ? { aimEnd: baseTarget } : {}) };
  const tailFrame: CameraFraming = { position: tail ? { x: tail[0]!.x, y: tail[0]!.y, z: tail[0]!.z } : { ...frame.position }, target: baseTarget, focalLength: clampFocal(baseFocal), ...(Math.abs(baseRoll) > 0.0001 ? { roll: baseRoll } : {}) };
  const after: CameraShot = { ...shared, id: newId, start: time, end: shot.end, frame: separation(tailFrame.position, tailFrame.target) > 0.000001 ? tailFrame : toFraming(actual), ...keep(tail), ...(tailKeys ? { keys: tailKeys } : {}),
    ...(shot.aimEnd ? { aimEnd: shot.aimEnd } : {}) };
  return { ...camera, shots: (camera.shots ?? []).flatMap(item => item.id === shot.id ? [before, after] : [item]) };
}
export function insertCameraShot(camera: SceneCamera, shot: CameraShot): SceneCamera {
  return { ...camera, shots: [...(camera.shots ?? []), shot].sort((a, b) => a.start - b.start) };
}

export function removeCameraShot(camera: SceneCamera, shotId: string): SceneCamera {
  const shots = (camera.shots ?? []).filter(shot => shot.id !== shotId);
  const { shots: _shots, ...rest } = camera;
  return shots.length ? { ...rest, shots } : rest;
}

const takeKeys = ["frame", "path", "aimEnd", "easing", "shake", "shakeRate", "track", "keys"] as const;
export function getCameraTake(source: CameraTake | SceneCamera): CameraTake {
  const { frame } = source;
  const take = source as CameraTake;
  return { frame, ...(take.path ? { path: take.path } : {}), ...(take.aimEnd ? { aimEnd: take.aimEnd } : {}), ...(take.easing && take.easing !== "smooth" ? { easing: take.easing } : {}), ...(take.shake ? { shake: take.shake } : {}), ...(take.shake && take.shakeRate && take.shakeRate !== 1 ? { shakeRate: take.shakeRate } : {}), ...(take.track ? { track: take.track } : {}), ...(take.keys?.length ? { keys: [...take.keys].sort((a, b) => a.at - b.at) } : {}) };
}
/** 改写一段镜头的取景；shotId为空时改机位自身的画面（只有frame）。 */
export function updateCameraTake(camera: SceneCamera, shotId: string | null | undefined, patch: (take: CameraTake) => CameraTake): SceneCamera {
  if (!shotId) return { ...camera, frame: copyFraming(patch({ frame: camera.frame }).frame) };
  return { ...camera, shots: camera.shots?.map(shot => {
    if (shot.id !== shotId) return shot;
    const next = getCameraTake(patch(getCameraTake(shot)));
    const rest = { ...shot } as Record<string, unknown>;
    for (const key of takeKeys) delete rest[key];
    return { ...rest, ...next } as CameraShot;
  }) };
}

// ACT: 取景窗里调画面是“整体改这段镜头”：把机位的位移加到整条轨迹上，注视点的位移、焦距倍率、横滚差同时加到起止两端，原来的运动保持不变。
export function reframeCameraTake(take: CameraTake, from: CameraFraming, to: CameraFraming): CameraTake {
  const move = difference(to.position, from.position), aim = difference(to.target, from.target);
  const zoom = to.focalLength / from.focalLength, turn = (to.roll ?? 0) - (from.roll ?? 0);
  const shift = <T extends Vector>(point: T): T => ({ ...point, ...clampVector(added(point, move)) });
  const frame: CameraFraming = { position: clampVector(added(take.frame.position, move)), target: clampVector(added(take.frame.target, aim)), focalLength: clampFocal(take.frame.focalLength * zoom), ...(Math.abs((take.frame.roll ?? 0) + turn) > 0.05 ? { roll: Math.max(-180, Math.min(180, (take.frame.roll ?? 0) + turn)) } : {}) };
  if (separation(frame.position, frame.target) <= 0.000001) return take;
  return {
    ...take, frame,
    ...(take.path ? { path: take.path.map(shift) } : {}),
    ...(take.aimEnd ? { aimEnd: clampVector(added(take.aimEnd, aim)) } : {}),
    // 整体变焦时关键点的焦段一起按倍率变，推拉的节奏不变。
    ...(take.keys?.length ? { keys: take.keys.map(key => ({ ...key, focal: clampFocal(key.focal * zoom) })) } : {}),
  };
}

/** 把划出的线变成机位轨迹：起点就是机位的位置，镜头仍对着原来的注视点。 */
export function setCameraTakePath(take: CameraTake, points: readonly PathPoint[]): CameraTake {
  const path = simplifyPath(points);
  if (path.length < 2 || getPathLength(path) < 0.05) { const { path: _path, ...rest } = take; return rest; }
  const frame = { ...copyFraming(take.frame), position: { x: path[0]!.x, y: path[0]!.y, z: path[0]!.z } };
  if (separation(frame.position, frame.target) <= 0.000001) return take;
  return { ...take, frame, path };
}

/**
 * 手绘稳定器：手画的线难免抖，这里替用户把它理顺，不需要钢笔工具。
 * 几乎是直线的一笔直接拉直；否则按弧长等距重采样，再做首尾固定的高斯平滑（线越长抹得越开），
 * 高低起伏一起抹平，机位不会跟着地面颠簸。
 */
export function smoothStroke(points: readonly Vector[]): Vector[] {
  const clean: Vector[] = [];
  for (const point of points) if (!clean.length || separation(clean[clean.length - 1]!, point) >= 0.02) clean.push(clampVector(point));
  if (clean.length < 2) return clean;
  const rawLength = polylineLength(clean);
  if (rawLength < 0.05) return [clean[0]!];
  // 先按弧长等距重采样，再做两遍首尾固定的高斯平滑（线越长抹得越开）。
  const samples = resamplePath(clean, Math.min(1, Math.max(0.1, rawLength / 200)));
  const spacing = polylineLength(samples) / (samples.length - 1);
  const sigma = Math.min(5, Math.max(0.4, rawLength * 0.06)) / spacing;
  let smooth = gaussianPath(gaussianPath(samples, sigma), sigma);
  // 理顺后偏离首尾连线不超过线长的5%，就当作想画一条直线。
  const first = smooth[0]!, last = smooth[smooth.length - 1]!;
  const chord = difference(last, first);
  const chordLength = Math.hypot(chord.x, chord.y, chord.z);
  if (chordLength > 0.05) {
    let deviation = 0;
    for (const point of smooth) {
      const offset = difference(point, first);
      const along = (offset.x * chord.x + offset.y * chord.y + offset.z * chord.z) / chordLength ** 2;
      deviation = Math.max(deviation, separation(point, added(first, scaled(chord, along))));
    }
    if (deviation <= chordLength * 0.05) return [first, last];
  }
  return smooth.length > maxPathPoints ? resamplePath(smooth, polylineLength(smooth) / (maxPathPoints - 1)) : smooth;
}
function resamplePath(points: readonly Vector[], spacing: number): Vector[] {
  const lengths = pathLengths(points);
  const length = lengths[lengths.length - 1]!;
  const count = Math.max(2, Math.min(maxPathPoints, Math.ceil(length / spacing) + 1));
  const result: Vector[] = [];
  let segment = 1;
  for (let index = 0; index < count; index++) {
    const distance = length * index / (count - 1);
    while (segment < points.length - 1 && lengths[segment]! < distance) segment++;
    const from = points[segment - 1]!, to = points[segment]!;
    const span = lengths[segment]! - lengths[segment - 1]!;
    result.push(added(from, scaled(difference(to, from), span > 1e-9 ? (distance - lengths[segment - 1]!) / span : 0)));
  }
  return result;
}
function gaussianPath(samples: readonly Vector[], sigma: number): Vector[] {
  const radius = Math.ceil(sigma * 2);
  const weights = Array.from({ length: radius + 1 }, (_, offset) => Math.exp(-(offset * offset) / (2 * sigma * sigma)));
  return samples.map((point, index) => {
    // 窗口在首尾对称收窄，起止点保持在用户落笔和收笔的位置。
    const reach = Math.min(radius, index, samples.length - 1 - index);
    if (!reach) return point;
    let total = 0; const sum = { x: 0, y: 0, z: 0 };
    for (let offset = -reach; offset <= reach; offset++) {
      const weight = weights[Math.abs(offset)]!, sample = samples[index + offset]!;
      sum.x += sample.x * weight; sum.y += sample.y * weight; sum.z += sample.z * weight; total += weight;
    }
    return { x: sum.x / total, y: sum.y / total, z: sum.z / total };
  });
}

/** 去掉划线里过密的点（相邻不足5厘米），保留起止点，最多maxPathPoints个。 */
export function simplifyPath<T extends Vector>(points: readonly T[]): T[] {
  const keep = (point: T): T => ({ ...point, ...clampVector(point) });
  const result: T[] = [];
  for (const point of points) if (!result.length || separation(result[result.length - 1]!, point) >= 0.05) result.push(keep(point));
  if (points.length > 1 && result.length && separation(result[result.length - 1]!, points[points.length - 1]!) > 0) result[result.length - 1] = keep(points[points.length - 1]!);
  if (result.length <= maxPathPoints) return result;
  const step = (result.length - 1) / (maxPathPoints - 1);
  return Array.from({ length: maxPathPoints }, (_, index) => result[Math.round(index * step)]!);
}

/** 云台转动：机位不动，yaw向右为正、pitch向上为正（弧度）；地平线保持水平，俯仰最多到±88°。 */
export function lookCamera(framing: CameraFraming, yaw: number, pitch: number): CameraFraming {
  const { forward, distance } = getCameraBasis(framing);
  const limit = 88 * Math.PI / 180;
  const nextPitch = Math.min(limit, Math.max(-limit, Math.asin(Math.min(1, Math.max(-1, forward.y))) + pitch));
  const nextYaw = Math.atan2(forward.x, -forward.z) + yaw;
  const direction = { x: Math.cos(nextPitch) * Math.sin(nextYaw), y: Math.sin(nextPitch), z: -Math.cos(nextPitch) * Math.cos(nextYaw) };
  return withFraming(framing, { ...framing.position }, clampVector(added(framing.position, scaled(direction, distance))));
}

/** 云台横滚（荷兰角）：degrees向右倾为正。 */
export function rollCamera(framing: CameraFraming, degrees: number): CameraFraming {
  const value = (((framing.roll ?? 0) + degrees + 180) % 360 + 360) % 360 - 180;
  const { roll: _roll, ...rest } = copyFraming(framing);
  return Math.abs(value) > 0.05 ? { ...rest, roll: Math.round(value * 100) / 100 } : rest;
}

function shifted(framing: CameraFraming, delta: Vector) {
  const { position, target } = framing;
  for (const axis of ["x", "y", "z"] as const) delta[axis] = Math.min(10000 - Math.max(position[axis], target[axis]), Math.max(-10000 - Math.min(position[axis], target[axis]), delta[axis]));
  return withFraming(framing, added(position, delta), added(target, delta));
}

/** 移动机位，注视点一起走：right、up、forward是沿画面右、上、前方向的米数，lift是沿世界竖直方向的米数。 */
export function moveCamera(framing: CameraFraming, right: number, up: number, forward = 0, lift = 0): CameraFraming {
  const basis = getCameraBasis(framing);
  return shifted(framing, {
    x: basis.right.x * right + basis.up.x * up + basis.forward.x * forward,
    y: basis.right.y * right + basis.up.y * up + basis.forward.y * forward + lift,
    z: basis.right.z * right + basis.up.z * up + basis.forward.z * forward,
  });
}

/** 像主视角的WASD那样飞行：forward沿水平视线、right沿画面右方、lift沿竖直方向（米），注视点一起走。 */
export function flyCamera(framing: CameraFraming, forward: number, right: number, lift: number): CameraFraming {
  const basis = getCameraBasis(framing);
  const flat = Math.hypot(basis.forward.x, basis.forward.z) > 0.000001 ? normalized({ x: basis.forward.x, y: 0, z: basis.forward.z }) : normalized({ x: basis.up.x, y: 0, z: basis.up.z });
  return shifted(framing, { x: flat.x * forward + basis.right.x * right, y: lift, z: flat.z * forward + basis.right.z * right });
}

/** 变焦：焦距乘以factor，限制在12–200毫米。 */
export function zoomCamera(framing: CameraFraming, factor: number): CameraFraming {
  return withFraming(framing, { ...framing.position }, { ...framing.target }, clampFocal(framing.focalLength * (Number.isFinite(factor) && factor > 0 ? factor : 1)));
}

/** 竖直视场角（度）：按全画幅长边36毫米换算（横画面36毫米是宽，竖画面36毫米是高），aspect是画面宽高比。 */
export function getCameraFov(focalLength: number, aspect = filmAspect): number {
  const focal = Number.isFinite(focalLength) ? clampFocal(focalLength) : 35;
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return 2 * Math.atan(getFilmFrameHeight(ratio) / (2 * focal)) * 180 / Math.PI;
}

/** getCameraFov的反算：由竖直视场角（度）和画面宽高比得到等效焦距，保持水平视野不变。 */
export function getCameraFocalLength(fov: number, aspect: number): number {
  const ratio = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  return clampFocal(getFilmFrameHeight(ratio) / 2 / Math.tan((Number.isFinite(fov) ? Math.min(170, Math.max(1, fov)) : 50) * Math.PI / 360));
}

/**
 * ACT: 成片镜号：成片行的段按机位重叠会被切细，相邻两段是同一台机位的同一个镜头段时算同一个镜号。
 * 时间轴成片行和镜头表共用这套编号，口头说“第5镜”两边对得上。返回与segments一一对应的镜号（从1开始）。
 */
export function numberProgramSegments(cameras: readonly SceneCamera[], segments: readonly { start: number; end: number; cameraId: string }[]) {
  const numbers: number[] = [];
  let current = 0;
  for (const [index, segment] of segments.entries()) {
    const previous = segments[index - 1];
    const camera = cameras.find(item => item.id === segment.cameraId);
    const same = previous && camera && previous.cameraId === segment.cameraId && Math.abs(previous.end - segment.start) < 0.001
      && getCameraShotAt(camera, (previous.start + previous.end) / 2)?.id === getCameraShotAt(camera, (segment.start + segment.end) / 2)?.id;
    if (!same) current++;
    numbers.push(current);
  }
  return numbers;
}

// ACT: 一键运镜和景别（界面取景窗、Agent worldCameras.moves共用）：只改这段镜头的取景、轨迹和关键点，不是开关。
export const cameraMoveKinds = ["push", "pull", "truckLeft", "truckRight", "craneUp", "craneDown", "panLeft", "panRight", "orbitLeft", "orbitRight", "zoomIn", "clear"] as const;
export const shotSizeKinds = ["extremeWide", "wide", "medium", "close", "closeUp"] as const;
const shotSizeHeights: Record<(typeof shotSizeKinds)[number], number> = { extremeWide: 4, wide: 1.3, medium: 0.65, close: 0.4, closeUp: 0.2 };

/** 运镜：推拉沿视线、横移、升降、绕注视点40°环绕写成轨迹；摇35°、焦段拉长1.8倍写成关键点；clear回到固定机位。 */
export function applyTakeMove(take: CameraTake, kind: (typeof cameraMoveKinds)[number], createId: () => string): CameraTake {
  const { path: _path, keys: _keys, aimEnd: _aim, ...base } = take;
  if (kind === "clear") return base;
  const position = base.frame.position, target = base.frame.target;
  const dx = target.x - position.x, dy = target.y - position.y, dz = target.z - position.z;
  const distance = Math.hypot(dx, dy, dz) || 1, flat = Math.hypot(dx, dz) || 1;
  const forward = { x: dx / distance, y: dy / distance, z: dz / distance }, right = { x: -dz / flat, y: 0, z: dx / flat };
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const at = (offset: Vector, scale: number) => ({ x: position.x + offset.x * scale, y: position.y + offset.y * scale, z: position.z + offset.z * scale });
  const line = (end: Vector) => setCameraTakePath(base, [{ ...position }, end]);
  const keyed = (values: { focal?: number; pan?: number }) => ({ ...base, keys: [{ id: createId(), at: 0, focal: base.frame.focalLength, pan: 0, tilt: 0, roll: 0 }, { id: createId(), at: 1, focal: values.focal ?? base.frame.focalLength, pan: values.pan ?? 0, tilt: 0, roll: 0 }] });
  switch (kind) {
    case "push": return line(at(forward, Math.min(distance * 0.35, 6)));
    case "pull": return line(at(forward, -Math.min(distance * 0.35, 6)));
    case "truckLeft": return line(at(right, -clamp(distance * 0.3, 1, 6)));
    case "truckRight": return line(at(right, clamp(distance * 0.3, 1, 6)));
    case "craneUp": return line(at({ x: 0, y: 1, z: 0 }, clamp(distance * 0.25, 1, 4)));
    case "craneDown": return line(at({ x: 0, y: 1, z: 0 }, -Math.min(clamp(distance * 0.25, 1, 4), Math.max(0.3, position.y - 0.4))));
    case "orbitLeft": case "orbitRight": {
      const sign = kind === "orbitLeft" ? -1 : 1, radius = Math.hypot(position.x - target.x, position.z - target.z), start = Math.atan2(position.x - target.x, position.z - target.z);
      return setCameraTakePath(base, Array.from({ length: 5 }, (_, index) => { const angle = start + sign * (index / 4) * 40 * Math.PI / 180; return { x: target.x + Math.sin(angle) * radius, y: position.y, z: target.z + Math.cos(angle) * radius }; }));
    }
    case "panLeft": return keyed({ pan: -35 });
    case "panRight": return keyed({ pan: 35 });
    case "zoomIn": return keyed({ focal: Math.min(focalLimits.max, Math.round(base.frame.focalLength * 1.8)) });
  }
}

/** 景别：按被拍的人身高（米）算画面要容下的高度换算焦段（按当前画幅高）；超出12–200mm就沿视线前后挪机位，轨迹一起平移，关键点焦段按比例缩放。 */
export function applyTakeSize(take: CameraTake, kind: (typeof shotSizeKinds)[number], subjectHeight = 1.75): CameraTake {
  const { position, target } = take.frame;
  const distance = Math.hypot(target.x - position.x, target.y - position.y, target.z - position.z) || 1;
  const visible = subjectHeight * shotSizeHeights[kind];
  const half = getFilmFrameHeight() / 2;
  let focal = half / Math.tan(Math.atan(visible / 2 / distance)), next = position;
  if (focal < focalLimits.min || focal > focalLimits.max) {
    focal = Math.max(focalLimits.min, Math.min(focalLimits.max, focal));
    const scale = visible / 2 / Math.tan(Math.atan(half / focal)) / distance;
    next = { x: target.x + (position.x - target.x) * scale, y: target.y + (position.y - target.y) * scale, z: target.z + (position.z - target.z) * scale };
  }
  const frame = { ...take.frame, position: next, focalLength: Math.round(focal * 10) / 10 };
  const factor = frame.focalLength / take.frame.focalLength;
  const shift = { x: next.x - position.x, y: next.y - position.y, z: next.z - position.z };
  const path = take.path?.map(point => ({ x: point.x + shift.x, y: point.y + shift.y, z: point.z + shift.z }));
  return { ...take, frame, ...(path ? { path } : {}), ...(take.keys ? { keys: take.keys.map(key => ({ ...key, focal: Math.max(focalLimits.min, Math.min(focalLimits.max, key.focal * factor)) })) } : {}) };
}

// ACT: 机位角度（分镜表最基本的一项）：平视、俯拍、仰拍、顶拍机位绕注视点上下转到对应仰角（距离不变，轨迹一起平移）；荷兰角给画面加15°倾斜（再点一次扶正）。
export const cameraAngleKinds = ["eye", "high", "low", "overhead", "dutch"] as const;
const angleElevations: Record<Exclude<(typeof cameraAngleKinds)[number], "dutch">, number> = { eye: 3, high: 32, low: -22, overhead: 78 };
export function applyTakeAngle(take: CameraTake, kind: (typeof cameraAngleKinds)[number]): CameraTake {
  const frame = take.frame;
  if (kind === "dutch") {
    const roll = Math.abs(frame.roll ?? 0) > 1 ? 0 : 15;
    const { roll: _roll, ...rest } = frame;
    return { ...take, frame: roll ? { ...rest, roll } : rest };
  }
  const { position, target } = frame;
  const distance = Math.hypot(position.x - target.x, position.y - target.y, position.z - target.z) || 1;
  const flat = Math.hypot(position.x - target.x, position.z - target.z);
  // 顶拍时水平方向退化，沿用原来的朝向；完全在正上方时按+Z方向展开。
  const dir = flat > 1e-3 ? { x: (position.x - target.x) / flat, z: (position.z - target.z) / flat } : { x: 0, z: 1 };
  let elevation = angleElevations[kind] * Math.PI / 180;
  // 仰拍机位不能钻到地下：离地至少0.25米，不够就把仰角收小。
  if (target.y + Math.sin(elevation) * distance < 0.25) elevation = Math.asin(Math.max(-1, Math.min(1, (0.25 - target.y) / distance)));
  const next = { x: target.x + dir.x * Math.cos(elevation) * distance, y: target.y + Math.sin(elevation) * distance, z: target.z + dir.z * Math.cos(elevation) * distance };
  const shift = { x: next.x - position.x, y: next.y - position.y, z: next.z - position.z };
  const path = take.path?.map(point => ({ x: point.x + shift.x, y: point.y + shift.y, z: point.z + shift.z }));
  return { ...take, frame: { ...frame, position: { x: Math.round(next.x * 100) / 100, y: Math.round(next.y * 100) / 100, z: Math.round(next.z * 100) / 100 } }, ...(path ? { path } : {}) };
}
/** 按机位和注视点的高低差说角度：顶拍、俯拍、平视、仰拍；有明显倾斜时加“荷兰角”。 */
export function describeCameraAngle(frame: { position: Vector; target: Vector; roll?: number }) {
  const flat = Math.hypot(frame.position.x - frame.target.x, frame.position.z - frame.target.z);
  const pitch = Math.atan2(frame.position.y - frame.target.y, flat) * 180 / Math.PI;
  const name = pitch > 60 ? "顶拍" : pitch > 15 ? "俯拍" : pitch < -10 ? "仰拍" : "平视";
  return Math.abs(frame.roll ?? 0) > 5 ? `${name}·荷兰角` : name;
}

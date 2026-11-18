import type { SkeletalMotion } from "./skeletalMotion";

/*
 * ACT: 胶囊人（头、身子、腿三段关节，见capsuleRig.ts）的姿势，写成和骨骼人物同一种骨骼动作（motion）：
 * hips=整个人（含髋部偏移，米），spine=身子（正X往前弯），head=头，leftThigh/rightThigh=那一段腿（负X往前抬、正X往后折）。
 * 姿势叠在当前状态上：坐着说话、跪着点头不会站起来。
 */
export type CapsuleState = "sit" | "kneel" | "crouch" | "lie" | undefined;
export type CapsuleGesture = "talk" | "nod" | "shake" | "bow" | "lean" | "shoot" | "jump";
type V3 = [number, number, number];
type Pose = { hips?: V3; spine?: V3; head?: V3; leg?: V3; offset?: V3 };

const zero: V3 = [0, 0, 0];
const statePoses: Record<Exclude<CapsuleState, undefined>, Pose> = {
  // 坐在椅子上：身子落到座面（髋从0.6米降到约0.46米），腿往前斜着垂向地面。
  sit: { offset: [0, -0.14, 0], leg: [-72, 0, 0], spine: [-4, 0, 0] },
  // 跪坐：身子坐在脚跟上，腿往后斜着、脚尖着地（像小腿贴地）。
  kneel: { offset: [0, -0.33, 0], leg: [74, 0, 0] },
  // 蹲：身子压低、前倾，腿往前斜。
  crouch: { offset: [0, -0.26, 0], leg: [-55, 0, 0], spine: [22, 0, 0] },
  // 倒地：整个人朝前扑倒，趴在地上。
  lie: { hips: [88, 0, 0], offset: [0, -0.38, 0] },
};
const round = (value: number) => Math.round(value * 1000) / 1000;
function poseOf(state: CapsuleState): Pose { return state ? statePoses[state] : {}; }
function add(a: V3 | undefined, b: V3 | undefined): V3 { return [(a?.[0] ?? 0) + (b?.[0] ?? 0), (a?.[1] ?? 0) + (b?.[1] ?? 0), (a?.[2] ?? 0) + (b?.[2] ?? 0)]; }
function frame(time: number, pose: Pose) {
  const leg = pose.leg ?? zero;
  return {
    time: round(time),
    rotations: { hips: pose.hips ?? zero, spine: pose.spine ?? zero, head: pose.head ?? zero, leftThigh: leg, rightThigh: leg },
    hipsOffset: pose.offset ?? zero,
  };
}
function motion(frames: ReturnType<typeof frame>[]): SkeletalMotion {
  // 关键帧时间严格递增、最多32帧。
  const sorted = frames.filter((item, index) => index === 0 || item.time > frames[index - 1]!.time).slice(0, 32);
  if (sorted.length < 2) sorted.push({ ...sorted[0]!, time: round(sorted[0]!.time + 0.1) });
  return { keyframes: sorted };
}

/** 从一个状态换到另一个状态（坐下、起身、跪下、蹲下、倒地），换完保持到seconds。 */
export function capsuleTransition(from: CapsuleState, to: CapsuleState, seconds: number, ramp = 0.6): SkeletalMotion {
  const total = Math.max(ramp + 0.05, seconds);
  const frames = [frame(0, poseOf(from))];
  // 倒地：先被打得往后一仰，再扑倒。
  if (to === "lie" && from !== "lie") frames.push(frame(Math.min(0.15, ramp / 3), { ...poseOf(from), spine: add(poseOf(from).spine, [-14, 0, 0]) }));
  frames.push(frame(ramp, poseOf(to)), frame(total, poseOf(to)));
  return motion(frames);
}

/** 在当前状态上做一个动作：说话轻轻点头、点头、摇头、鞠躬、朝对方一倾（举手、指向、出拳等胶囊人没有手的动作）、开枪往后一震、起跳。 */
export function capsuleGesture(state: CapsuleState, gesture: CapsuleGesture, seconds: number): SkeletalMotion {
  const base = poseOf(state);
  const at = (time: number, change: Pose) => frame(time, { ...base, spine: add(base.spine, change.spine), head: add(base.head, change.head), offset: add(base.offset, change.offset), leg: add(base.leg, change.leg), hips: add(base.hips, change.hips) });
  const total = Math.max(0.4, seconds);
  if (gesture === "talk") {
    const frames = [at(0, {})];
    for (let time = 0.35, up = true; time < total - 0.1 && frames.length < 30; time += 0.35, up = !up) frames.push(at(time, { head: [up ? 7 : -2, 0, 0], spine: [up ? 2 : 0, 0, 0] }));
    frames.push(at(total, {}));
    return motion(frames);
  }
  if (gesture === "nod" || gesture === "shake") {
    const frames = [at(0, {})];
    const swing: V3 = gesture === "nod" ? [20, 0, 0] : [0, 28, 0];
    for (let time = 0.25, side = 1; time < total - 0.15 && frames.length < 30; time += 0.25, side = -side) frames.push(at(time, { head: gesture === "nod" ? (side > 0 ? swing : zero) : [0, swing[1] * side, 0] }));
    frames.push(at(total, {}));
    return motion(frames);
  }
  if (gesture === "bow") return motion([at(0, {}), at(Math.min(0.5, total / 3), { spine: [45, 0, 0], head: [12, 0, 0] }), at(Math.max(Math.min(0.5, total / 3) + 0.05, total - 0.5), { spine: [45, 0, 0], head: [12, 0, 0] }), at(total, {})]);
  if (gesture === "shoot") return motion([at(0, {}), at(0.08, { spine: [6, 0, 0] }), at(0.18, { spine: [-12, 0, 0], head: [-6, 0, 0] }), at(Math.min(total, 0.6), {}), ...(total > 0.65 ? [at(total, {})] : [])]);
  if (gesture === "jump") return motion([at(0, {}), at(0.15, { offset: [0, -0.08, 0] }), at(0.35, { offset: [0, 0.38, 0], leg: [-25, 0, 0] }), at(Math.min(total, 0.7), {}), ...(total > 0.75 ? [at(total, {})] : [])]);
  // lean：朝对方一倾再回来。
  return motion([at(0, {}), at(Math.min(0.3, total / 3), { spine: [18, 0, 0], head: [-8, 0, 0] }), at(Math.max(Math.min(0.3, total / 3) + 0.05, total - 0.3), { spine: [18, 0, 0], head: [-8, 0, 0] }), at(total, {})]);
}

/** 保持一个状态（坐着、跪着、躺着）一段时间。 */
export function capsuleHold(state: CapsuleState, seconds: number): SkeletalMotion {
  return motion([frame(0, poseOf(state)), frame(Math.max(0.1, seconds), poseOf(state))]);
}

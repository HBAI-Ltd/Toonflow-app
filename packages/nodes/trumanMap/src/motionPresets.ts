import type { SkeletalMotion } from "./skeletalMotion";

/*
 * ACT: 常用肢体动作预设（动作库里没有的：挥手、鞠躬、点头、摇头、指向、出拳、抱拳、举手、捂脸、招手、耸肩、跪下、倒地）。
 * 给“导演工具”stageAct用：模型只说“挥手”，不用自己写骨骼关键帧。数值按 riggedPerson 绑定姿态（手臂自然下垂、正面+Z、
 * 左侧+X）和 skeletalMotionReview 实测的手、头位置调过：挥手手过头顶、抱拳两手在胸前相距约7厘米、指向手臂水平向前。
 * hold：保持型动作（举手、捂脸、跪下、倒地）把最后的姿势一直保持到这一段结束，再按需收回。
 */

type Angles = [number, number, number];
type Frame = { time: number; rotations?: Record<string, Angles>; hipsOffset?: [number, number, number] };
export type MotionPreset = { id: string; name: string; aliases: readonly string[]; seconds: number; hold?: boolean; build: (seconds: number) => SkeletalMotion };

// 基础待机带一点髋、胸扭转；双手要对称的动作把躯干摆正。
const upright = { hips: [0, 0, 0] as Angles, spine: [0, 0, 0] as Angles, chest: [0, 0, 0] as Angles };
const rest = (bones: readonly string[]) => Object.fromEntries(bones.map(bone => [bone, [0, 0, 0] as Angles]));
const round = (value: number) => Math.round(value * 1000) / 1000;

/** 起势→（重复）→收势：frames里的time是起势后的时间，按seconds把中间的往复补满或截短，最后0.4秒回到绑定姿态。 */
function gesture(bones: readonly string[], enter: Frame["rotations"], cycle: Frame["rotations"][], seconds: number, step = 0.3): SkeletalMotion {
  const keyframes: Frame[] = [{ time: 0, rotations: rest(bones) }, { time: 0.35, rotations: enter }];
  let time = 0.35;
  const end = Math.max(0.9, seconds) - 0.4;
  for (let index = 0; cycle.length && time + step <= end - 0.05 && keyframes.length < 29; index++) {
    time += step;
    keyframes.push({ time: round(time), rotations: cycle[index % cycle.length] });
  }
  if (end - time > 0.05) keyframes.push({ time: round(end), rotations: enter });
  keyframes.push({ time: round(Math.max(end + 0.4, time + 0.3)), rotations: rest(bones) });
  return { keyframes: keyframes as SkeletalMotion["keyframes"] };
}

/** 保持型：起势后一直保持到 seconds（可选最后收回）。 */
function pose(frames: Frame[], seconds: number, release?: Frame): SkeletalMotion {
  const last = frames.at(-1)!;
  const keyframes: Frame[] = [...frames];
  const end = Math.max(last.time + 0.1, seconds - (release ? 0.5 : 0));
  keyframes.push({ ...last, time: round(end) });
  if (release) keyframes.push({ ...release, time: round(end + 0.5) });
  return { keyframes: keyframes as SkeletalMotion["keyframes"] };
}

export const motionPresets: readonly MotionPreset[] = [
  {
    id: "wave", name: "挥手", aliases: ["挥手", "招呼", "打招呼", "摆手", "再见", "wave"], seconds: 2.4,
    build: seconds => gesture(["rightUpperArm", "rightForeArm"], { rightUpperArm: [0, 0, -150], rightForeArm: [0, 0, -25] }, [{ rightForeArm: [0, 0, 30] }, { rightForeArm: [0, 0, -25] }], seconds),
  },
  {
    id: "beckon", name: "招手", aliases: ["招手", "叫过来", "示意过来", "beckon"], seconds: 1.8,
    build: seconds => gesture(["rightUpperArm", "rightForeArm"], { rightUpperArm: [-50, 0, 0], rightForeArm: [-60, 0, 0] }, [{ rightForeArm: [-110, 0, 0] }, { rightForeArm: [-60, 0, 0] }], seconds),
  },
  {
    id: "bow", name: "鞠躬", aliases: ["鞠躬", "躬身", "欠身", "行礼", "bow"], seconds: 2,
    build: seconds => pose([
      { time: 0, rotations: { ...upright, head: [0, 0, 0] } },
      { time: 0.5, rotations: { ...upright, spine: [25, 0, 0], chest: [15, 0, 0], head: [10, 0, 0] } },
    ], Math.max(1.2, seconds), { time: 0, rotations: { ...upright, head: [0, 0, 0] } }),
  },
  {
    id: "salute", name: "抱拳", aliases: ["抱拳", "拱手", "作揖", "抱拳行礼", "salute"], seconds: 1.8,
    build: seconds => pose([
      { time: 0, rotations: { ...upright, ...rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm"]) } },
      { time: 0.4, rotations: { ...upright, spine: [8, 0, 0], leftUpperArm: [-30, 0, -70], leftForeArm: [-90, 0, 0], rightUpperArm: [-30, 0, 70], rightForeArm: [-90, 0, 0] } },
    ], Math.max(1, seconds), { time: 0, rotations: { ...upright, ...rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm"]) } }),
  },
  {
    id: "nod", name: "点头", aliases: ["点头", "答应", "同意", "nod"], seconds: 1.2,
    build: seconds => gesture(["head"], { head: [18, 0, 0] }, [{ head: [0, 0, 0] }, { head: [18, 0, 0] }], seconds, 0.25),
  },
  {
    id: "shake", name: "摇头", aliases: ["摇头", "拒绝", "否认", "shake"], seconds: 1.4,
    build: seconds => gesture(["head"], { head: [0, 25, 0] }, [{ head: [0, -25, 0] }, { head: [0, 25, 0] }], seconds, 0.25),
  },
  {
    id: "point", name: "指向", aliases: ["指向", "指着", "指", "手指", "point"], seconds: 2,
    build: seconds => pose([
      { time: 0, rotations: { ...upright, ...rest(["rightUpperArm", "rightForeArm"]) } },
      { time: 0.35, rotations: { ...upright, rightUpperArm: [-88, 0, 8], rightForeArm: [-5, 0, 0] } },
    ], Math.max(1, seconds), { time: 0, rotations: { ...upright, ...rest(["rightUpperArm", "rightForeArm"]) } }),
  },
  {
    id: "punch", name: "出拳", aliases: ["出拳", "揍", "打斗", "挥拳", "打架", "过招", "punch", "fight"], seconds: 1.4,
    build: seconds => {
      const guard = { leftUpperArm: [-30, 0, -10] as Angles, leftForeArm: [-120, 0, 0] as Angles, rightUpperArm: [-30, 0, 10] as Angles, rightForeArm: [-120, 0, 0] as Angles, chest: [0, 0, 0] as Angles };
      const right = { ...guard, chest: [0, -20, 0] as Angles, rightUpperArm: [-88, 0, 15] as Angles, rightForeArm: [-5, 0, 0] as Angles };
      const left = { ...guard, chest: [0, 20, 0] as Angles, leftUpperArm: [-88, 0, -15] as Angles, leftForeArm: [-5, 0, 0] as Angles };
      const keyframes: Frame[] = [{ time: 0, rotations: rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm", "chest"]) }, { time: 0.25, rotations: guard }];
      let time = 0.25;
      for (let index = 0; time + 0.45 <= Math.max(1, seconds) - 0.3 && keyframes.length < 28; index++) {
        keyframes.push({ time: round(time + 0.15), rotations: index % 2 ? left : right }, { time: round(time + 0.4), rotations: guard });
        time += 0.4;
      }
      keyframes.push({ time: round(time + 0.3), rotations: rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm", "chest"]) });
      return { keyframes: keyframes as SkeletalMotion["keyframes"] };
    },
  },
  {
    id: "raise", name: "举手", aliases: ["举手", "抬手", "举起手", "raise"], seconds: 2, hold: true,
    build: seconds => pose([
      { time: 0, rotations: { rightUpperArm: [0, 0, 0] } },
      { time: 0.35, rotations: { rightUpperArm: [0, 0, -170] } },
    ], Math.max(0.8, seconds), { time: 0, rotations: { rightUpperArm: [0, 0, 0] } }),
  },
  {
    id: "cover", name: "捂脸", aliases: ["捂脸", "哭", "哭泣", "掩面", "抽泣", "cry"], seconds: 2.5, hold: true,
    build: seconds => pose([
      { time: 0, rotations: { ...upright, ...rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm", "head"]) } },
      { time: 0.5, rotations: { ...upright, leftUpperArm: [-80, 0, -75], leftForeArm: [-125, 0, 0], rightUpperArm: [-80, 0, 75], rightForeArm: [-125, 0, 0], head: [12, 0, 0] } },
    ], Math.max(1, seconds), { time: 0, rotations: rest(["leftUpperArm", "leftForeArm", "rightUpperArm", "rightForeArm", "head"]) }),
  },
  {
    id: "shrug", name: "耸肩", aliases: ["耸肩", "摊手", "无奈", "shrug"], seconds: 1.4,
    build: seconds => pose([
      { time: 0, rotations: rest(["leftClavicle", "rightClavicle", "leftUpperArm", "rightUpperArm", "leftForeArm", "rightForeArm"]) },
      { time: 0.4, rotations: { leftClavicle: [0, 0, 15], rightClavicle: [0, 0, -15], leftUpperArm: [-15, 0, 20], rightUpperArm: [-15, 0, -20], leftForeArm: [-80, 0, 0], rightForeArm: [-80, 0, 0] } },
    ], Math.max(0.8, seconds), { time: 0, rotations: rest(["leftClavicle", "rightClavicle", "leftUpperArm", "rightUpperArm", "leftForeArm", "rightForeArm"]) }),
  },
  {
    id: "kneel", name: "跪下", aliases: ["跪下", "跪", "下跪", "跪着", "跪拜", "kneel"], seconds: 4, hold: true,
    build: seconds => pose([
      { time: 0, hipsOffset: [0, 0, 0], rotations: { ...upright, ...rest(["leftThigh", "rightThigh", "leftShin", "rightShin", "leftFoot", "rightFoot"]) } },
      // 先屈膝收小腿、髋只降一点（小腿往后抬，脚不扫进地面），再整个人跪下去。
      { time: 0.3, hipsOffset: [0, -0.05, 0], rotations: { ...upright, leftThigh: [0, 0, 0], rightThigh: [0, 0, 0], leftShin: [75, 0, 0], rightShin: [75, 0, 0], leftFoot: [0, 0, 0], rightFoot: [0, 0, 0] } },
      { time: 0.7, hipsOffset: [0, -0.37, 0], rotations: { ...upright, leftThigh: [0, 0, 0], rightThigh: [0, 0, 0], leftShin: [90, 0, 0], rightShin: [90, 0, 0], leftFoot: [0, 0, 0], rightFoot: [0, 0, 0] } },
    ], Math.max(1, seconds)),
  },
  {
    id: "fall", name: "倒地", aliases: ["倒地", "倒下", "躺下", "躺着", "晕倒", "昏倒", "中枪倒地", "死去", "fall", "lie"], seconds: 4, hold: true,
    build: seconds => pose([
      { time: 0, hipsOffset: [0, 0, 0], rotations: { ...upright, ...rest(["leftThigh", "rightThigh", "leftShin", "rightShin"]) } },
      // 腿先软下去（大腿前抬、屈膝），再往后坐倒、躺平；中间帧都按蒙皮最低点不穿地面调过。
      { time: 0.35, hipsOffset: [0, -0.15, 0], rotations: { hips: [-20, 0, 0], spine: [10, 0, 0], chest: [0, 0, 0], leftThigh: [-80, 0, 0], rightThigh: [-80, 0, 0], leftShin: [70, 0, 0], rightShin: [70, 0, 0] } },
      { time: 0.6, hipsOffset: [0, -0.5, 0], rotations: { hips: [-45, 0, 0], spine: [5, 0, 0], chest: [0, 0, 0], leftThigh: [-40, 0, 0], rightThigh: [-40, 0, 0], leftShin: [30, 0, 0], rightShin: [30, 0, 0] } },
      { time: 0.9, hipsOffset: [0, -0.71, 0], rotations: { hips: [-90, 0, 0], spine: [0, 0, 0], chest: [0, 0, 0], leftThigh: [0, 0, 0], rightThigh: [0, 0, 0], leftShin: [0, 0, 0], rightShin: [0, 0, 0] } },
    ], Math.max(1.2, seconds)),
  },
];

export function findMotionPreset(word: string) {
  const text = word.trim().toLowerCase();
  return motionPresets.find(preset => preset.id === text) ?? motionPresets.find(preset => preset.aliases.some(alias => alias === text)) ?? motionPresets.find(preset => preset.aliases.some(alias => text.includes(alias)));
}

import { Quaternion, SkinnedMesh, Vector3 } from "three";
import { createLifeObject } from "./lifeObjectVisual";
import { createRiggedPerson } from "./riggedPerson";
import { disposeObject } from "./sceneResources";
import type { SkeletalMotion } from "./skeletalMotion";

const jointBones = {
  hips: "hips", head: "head", chest: "chest",
  leftHand: "leftHand", rightHand: "rightHand",
  leftFingertips: "leftFingers", rightFingertips: "rightFingers",
  leftKnee: "leftShin", rightKnee: "rightShin",
  leftFoot: "leftFoot", rightFoot: "rightFoot",
};

export function reviewSkeletalMotion(motion: SkeletalMotion, duration: number, animation?: string) {
  if (!Number.isFinite(duration) || duration < 0) throw new Error("骨骼动作的事件时长无效");
  const candidates = [...new Set([0, ...motion.keyframes.map(frame => frame.time).filter(time => time <= duration), duration])].sort((left, right) => left - right);
  const times = candidates.length <= 8 ? candidates : Array.from({ length: 8 }, (_, index) => candidates[Math.round(index * (candidates.length - 1) / 7)]!);
  const checkedTimes = new Set(candidates);
  for (let index = 1; index < motion.keyframes.length; index++) {
    const start = motion.keyframes[index - 1]!.time;
    const end = Math.min(duration, motion.keyframes[index]!.time);
    if (end <= start) continue;
    for (let quarter = 1; quarter <= 3; quarter++) checkedTimes.add(start + (end - start) * quarter / 4);
  }
  const jointWarnings = new Set<string>();
  const dataWarnings = new Set<string>();
  const penetrationSamples: { time: number; depth: number }[] = [];
  const raisedFootSamples: { time: number; height: number }[] = [];
  const worstPenetration = { time: 0, depth: 0 };
  for (const frame of motion.keyframes) for (const [name, angles] of Object.entries(frame.rotations ?? {})) {
    if (!angles || !/ForeArm$|Shin$/.test(name)) continue;
    if (name.endsWith("Shin") && angles[0] < -5 || name.endsWith("ForeArm") && angles[0] > 10) jointWarnings.add(`${name}存在反向弯曲，请核对肘膝的局部X轴方向。`);
    if (Math.abs(angles[1]) > 35 || Math.abs(angles[2]) > 35) jointWarnings.add(`${name}存在较大侧弯或扭转，请检查关节姿态。`);
    if (Math.abs(angles[0]) > 165) jointWarnings.add(`${name}接近极限折叠，请检查肢体穿插。`);
  }
  const person = createRiggedPerson("#bac5d3");
  let visual: ReturnType<typeof createLifeObject> | undefined;
  function rounded(value: number) { return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null; }
  try {
    visual = createLifeObject(person, 0, 0);
    const mesh = person.getObjectByName("riggedPersonBody");
    if (!(mesh instanceof SkinnedMesh)) throw new Error("骨骼动作反馈缺少人物蒙皮");
    const joints = Object.entries(jointBones).map(([name, boneName]) => {
      const bone = person.getObjectByName(boneName);
      if (!bone) throw new Error("骨骼动作反馈缺少骨骼：" + boneName);
      return { name, bone };
    });
    const chest = person.getObjectByName("chest")!;
    const point = new Vector3();
    const rotation = new Quaternion();
    const vertexCount = mesh.geometry.getAttribute("position").count;
    const checkedSamples = [...checkedTimes].sort((left, right) => left - right).map(time => {
      visual!.animate(time, 0, "idle", { motion, time, duration }, animation ? { name: animation, time } : undefined);
      person.updateWorldMatrix(true, true);
      const heights: Record<string, number> = {};
      const positions = Object.fromEntries(joints.map(({ name, bone }) => {
        bone.getWorldPosition(point);
        heights[name] = point.y;
        if (![point.x, point.y, point.z].every(Number.isFinite)) dataWarnings.add(`${rounded(time)}秒：${name}位置出现非有限数值。`);
        return [name, [rounded(point.x), rounded(point.y), rounded(point.z)]];
      }));
      const chestForwardY = point.set(0, 0, 1).applyQuaternion(chest.getWorldQuaternion(rotation)).y;
      if (!Number.isFinite(chestForwardY)) dataWarnings.add(`${rounded(time)}秒：胸部朝向出现非有限数值。`);
      if (heights.hips < 0.5 && Math.abs(chestForwardY) > 0.7 && heights.leftFoot > 0.2 && heights.rightFoot > 0.2) raisedFootSamples.push({ time, height: Math.min(heights.leftFoot, heights.rightFoot) });
      let minY = Infinity;
      let invalidVertices = 0;
      for (let index = 0; index < vertexCount; index++) {
        mesh.getVertexPosition(index, point).applyMatrix4(mesh.matrixWorld);
        if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) { invalidVertices++; continue; }
        minY = Math.min(minY, point.y);
      }
      if (invalidVertices) dataWarnings.add(`${rounded(time)}秒：${invalidVertices}个蒙皮顶点出现非有限数值。`);
      if (!Number.isFinite(minY)) dataWarnings.add(`${rounded(time)}秒：蒙皮没有可用的有限顶点。`);
      const groundPenetrating = Number.isFinite(minY) && minY < -0.03;
      if (Number.isFinite(minY) && -minY > worstPenetration.depth) { worstPenetration.time = time; worstPenetration.depth = -minY; }
      if (groundPenetrating) penetrationSamples.push({ time, depth: -minY });
      return { time, positions, chestForwardY: rounded(chestForwardY), minY: rounded(minY), groundPenetrating, frameContact: Number.isFinite(minY) && Math.abs(minY) <= 0.03 };
    });
    return {
      referencePlane: { space: "模型根局部坐标", unit: "米", y: 0, note: "绑定姿态足底参考平面，不是实际地形；位置为骨骼原点，Hand为腕/掌根，Fingertips为指尖定位骨，Knee为膝，Foot为踝。frameContact仅表示蒙皮最低点距平面不超过3厘米，不代表物理支撑。" },
      supportHeightHints: { note: "仅为角色局部参考平面的尺寸提示，不是支撑硬限制。", fingertips: "指尖定位骨接触参考面时Y接近0米。", foot: "Foot是踝骨，站立支撑时参考Y约0.08至0.12米。", knee: "跪地Knee为膝骨，参考Y约腿半径0.085米。" },
      terrainValidated: false, visuallyApproved: false,
      chestForwardY: "胸前+Z朝向的Y分量：负值朝地，正值朝天。",
      sampling: "检查关键帧及各相邻关键帧区间的四分点，非逐帧完整物理验证；明细最多保留8个主要时刻，异常摘要覆盖全部检查时刻。",
      duration, keyframeCount: motion.keyframes.length, checkedSampleCount: checkedSamples.length, omittedSampleTimes: checkedSamples.length - times.length,
      worstPenetration: worstPenetration.depth > 0 ? { time: rounded(worstPenetration.time), depth: rounded(worstPenetration.depth) } : null,
      groundPenetrating: checkedSamples.some(sample => sample.groundPenetrating),
      frameContact: checkedSamples.some(sample => sample.frameContact),
      samples: checkedSamples.filter(sample => times.includes(sample.time)),
      warningCounts: { joint: jointWarnings.size, nonFinite: dataWarnings.size, groundPenetration: penetrationSamples.length, raisedFeet: raisedFootSamples.length },
      warnings: [
        ...[...jointWarnings].slice(0, 3), ...[...dataWarnings].slice(0, 3),
        ...penetrationSamples.sort((left, right) => right.depth - left.depth).slice(0, 3).map(sample => `${rounded(sample.time)}秒：蒙皮穿过参考平面约${rounded(sample.depth)}米。`),
        ...raisedFootSamples.sort((left, right) => right.height - left.height).slice(0, 3).map(sample => `${rounded(sample.time)}秒：低位横身双脚距参考面较远，非刻意腾空时检查支撑。`),
      ],
    };
  } finally {
    try { visual?.dispose(); } finally { disposeObject(person); }
  }
}

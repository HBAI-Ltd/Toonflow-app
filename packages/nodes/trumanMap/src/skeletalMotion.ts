import { z } from "@toonflow/nodes-scaffold/runtime";
import { Bone, Box3, Euler, Group, MathUtils, Matrix4, Quaternion, SkinnedMesh, Sphere, Vector3 } from "three";
import type { Object3D } from "three";
import { findCapsuleRigs, poseCapsuleRig, resetCapsuleRig, type CapsuleRig } from "./capsuleRig";

export const personBoneNames = [
  "hips", "spine", "chest", "neck", "head", "headTip",
  "leftClavicle", "leftUpperArm", "leftForeArm", "leftHand", "leftFingers", "leftThigh", "leftShin", "leftFoot", "leftToe",
  "rightClavicle", "rightUpperArm", "rightForeArm", "rightHand", "rightFingers", "rightThigh", "rightShin", "rightFoot", "rightToe",
] as const;
type PersonBoneName = typeof personBoneNames[number];
const rotationAngle = z.number().finite().min(-180).max(180);
const hipCoordinate = z.number().finite().min(-1).max(1);
export const skeletalMotionSchema = z.strictObject({
  keyframes: z.array(z.strictObject({
    time: z.number().finite().min(0).max(300),
    rotations: z.partialRecord(z.enum(personBoneNames), z.tuple([rotationAngle, rotationAngle, rotationAngle])).optional(),
    hipsOffset: z.tuple([hipCoordinate, z.number().finite().min(-0.75).max(1), hipCoordinate]).optional(),
  }).refine(frame => !!frame.hipsOffset || !!frame.rotations && Object.keys(frame.rotations).length > 0, "每帧须包含骨骼旋转或髋部偏移")).min(2).max(32),
  loop: z.boolean().optional(),
}).superRefine((motion, context) => {
  if (motion.keyframes[0]?.time !== 0) context.addIssue({ code: "custom", path: ["keyframes", 0, "time"], message: "首帧时间必须为0" });
  motion.keyframes.forEach((frame, index) => {
    if (index && frame.time <= motion.keyframes[index - 1]!.time) context.addIssue({ code: "custom", path: ["keyframes", index, "time"], message: "关键帧时间必须严格递增" });
  });
});
export type SkeletalMotion = z.infer<typeof skeletalMotionSchema>;
export type SkeletalMotionContext = { motion: SkeletalMotion; time: number; duration: number };

type CompiledMotion = {
  times: number[];
  rotations: { name: PersonBoneName; values: Quaternion[] }[];
  hipsOffsets?: Vector3[];
  loop: boolean;
};
const compiledMotions = new WeakMap<SkeletalMotion, CompiledMotion>();

function compileMotion(motion: SkeletalMotion): CompiledMotion {
  const cached = compiledMotions.get(motion);
  if (cached) return cached;
  const value = skeletalMotionSchema.parse(motion);
  const names = personBoneNames.filter(name => value.keyframes.some(frame => frame.rotations?.[name]));
  const euler = new Euler();
  const compiled: CompiledMotion = {
    times: value.keyframes.map(frame => frame.time),
    rotations: names.map(name => {
      let previous = new Quaternion();
      return { name, values: value.keyframes.map(frame => {
        const angles = frame.rotations?.[name];
        if (angles) previous = new Quaternion().setFromEuler(euler.set(MathUtils.degToRad(angles[0]), MathUtils.degToRad(angles[1]), MathUtils.degToRad(angles[2]), "XYZ"));
        return previous.clone();
      }) };
    }),
    loop: value.loop ?? false,
  };
  if (value.keyframes.some(frame => frame.hipsOffset)) {
    let previous = new Vector3();
    compiled.hipsOffsets = value.keyframes.map(frame => {
      if (frame.hipsOffset) previous = new Vector3(...frame.hipsOffset);
      return previous.clone();
    });
  }
  compiledMotions.set(motion, compiled);
  return compiled;
}

function bindPerson(root: Group) {
  const meshes: SkinnedMesh[] = [];
  const descendants = new Set<Object3D>();
  function visit(node: Object3D) {
    if (node !== root && node instanceof Group && node.name === "riggedPerson") return;
    descendants.add(node);
    if (node instanceof SkinnedMesh && node.name === "riggedPersonBody") meshes.push(node);
    node.children.forEach(visit);
  }
  visit(root);
  const mesh = meshes[0];
  if (meshes.length !== 1 || !mesh || mesh.skeleton.bones.length !== personBoneNames.length || mesh.skeleton.boneInverses.length !== personBoneNames.length) throw new Error("骨骼动作需要完整的内置骨骼人物（24骨）");
  const bones = new Map<PersonBoneName, { bone: Bone; bindQuaternion: Quaternion; bindPosition: Vector3 }>();
  const worlds = new Map(mesh.skeleton.bones.map((bone, index) => [bone, mesh.skeleton.boneInverses[index]!.clone().invert()]));
  for (const name of personBoneNames) {
    const matches = mesh.skeleton.bones.filter(bone => bone.name === name && descendants.has(bone));
    const bone = matches[0];
    if (matches.length !== 1 || !bone) throw new Error(`内置骨骼人物缺少或重复骨骼：${name}`);
    const parentWorld = bone.parent === mesh ? mesh.bindMatrix : worlds.get(bone.parent as Bone);
    if (!parentWorld) throw new Error(`内置骨骼人物的骨骼父级无效：${name}`);
    const local = new Matrix4().copy(parentWorld).invert().multiply(worlds.get(bone)!);
    const bindPosition = new Vector3();
    const bindQuaternion = new Quaternion();
    local.decompose(bindPosition, bindQuaternion, new Vector3());
    bones.set(name, { bone, bindQuaternion, bindPosition });
  }
  return { mesh, bones, boundingBox: mesh.boundingBox, boundingSphere: mesh.boundingSphere, expanded: false };
}

export function createSkeletalMotionPlayer(group: Group) {
  let bindings: ReturnType<typeof bindPerson>[] | undefined;
  // 没有骨骼人物时找胶囊人的三段关节（头、身子、腿），按骨名映射摆姿势。
  let capsules: CapsuleRig[] | undefined;
  let capsulePosed = false;
  const baseRotations = new Map<Bone, Quaternion>();
  const basePositions = new Map<Bone, Vector3>();
  const rotation = new Quaternion();
  const target = new Quaternion();
  const offset = new Vector3();
  let disposed = false;
  function restoreBase() {
    if (capsulePosed) { capsules?.forEach(resetCapsuleRig); capsulePosed = false; }
    baseRotations.forEach((value, bone) => bone.quaternion.copy(value));
    basePositions.forEach((value, bone) => bone.position.copy(value));
    baseRotations.clear();
    basePositions.clear();
  }
  return {
    restoreBase,
    apply(context?: SkeletalMotionContext) {
      if (disposed) return;
      restoreBase();
      if (!context) return;
      if (!Number.isFinite(context.time) || !Number.isFinite(context.duration) || context.duration < 0) throw new Error("骨骼动作的播放时间或事件时长无效");
      const compiled = compileMotion(context.motion);
      if (!bindings) {
        const found: ReturnType<typeof bindPerson>[] = [];
        group.traverse(node => {
          if (node instanceof Group && node.name === "riggedPerson") found.push(bindPerson(node));
        });
        bindings = found;
      }
      if (!bindings.length) capsules ??= findCapsuleRigs(group);
      if (!bindings.length && !capsules?.length) throw new Error("自定义骨骼动作仅支持内置骨骼人物和胶囊人");
      if (!context.duration) return;
      // 编排首尾就是实际姿态；不把趴姿等首帧淡回站立，也不提前稀释最后一帧。
      const lastTime = compiled.times[compiled.times.length - 1]!;
      const time = compiled.loop ? context.time % lastTime : MathUtils.clamp(context.time, 0, lastTime);
      let next = 1;
      while (next < compiled.times.length - 1 && compiled.times[next]! < time) next++;
      const previous = next - 1;
      const alpha = (time - compiled.times[previous]!) / (compiled.times[next]! - compiled.times[previous]!);
      if (!bindings.length) {
        const lastFrame = compiled.times[compiled.times.length - 1]!;
        const at = compiled.loop ? context.time % lastFrame : MathUtils.clamp(context.time, 0, lastFrame);
        let after = 1;
        while (after < compiled.times.length - 1 && compiled.times[after]! < at) after++;
        const t = (at - compiled.times[after - 1]!) / (compiled.times[after]! - compiled.times[after - 1]!);
        const rotations = new Map(compiled.rotations.map(track => [track.name as string, new Quaternion().slerpQuaternions(track.values[after - 1]!, track.values[after]!, t)]));
        const hips = compiled.hipsOffsets ? new Vector3().lerpVectors(compiled.hipsOffsets[after - 1]!, compiled.hipsOffsets[after]!, t) : undefined;
        for (const rig of capsules ?? []) poseCapsuleRig(rig, rotations, hips);
        capsulePosed = true;
        return;
      }
      // ACT: 局部关键帧只插值骨骼，不做物理或足底IK；极限关节角的穿插由编排者约束。
      for (const binding of bindings) {
        if (!binding.expanded) {
          // 内置人物最长骨链<2.2m、蒙皮局部半径<1m、髋位移≤√3m，6m覆盖全关节旋转。
          binding.mesh.boundingBox = new Box3(new Vector3(-6, -6, -6), new Vector3(6, 6, 6));
          binding.mesh.boundingSphere = new Sphere(new Vector3(), 6);
          binding.expanded = true;
        }
        for (const track of compiled.rotations) {
          const { bone, bindQuaternion } = binding.bones.get(track.name)!;
          const base = bone.quaternion.clone();
          baseRotations.set(bone, base);
          rotation.slerpQuaternions(track.values[previous]!, track.values[next]!, alpha);
          target.copy(bindQuaternion).multiply(rotation);
          bone.quaternion.copy(target);
        }
        if (compiled.hipsOffsets) {
          const { bone, bindPosition } = binding.bones.get("hips")!;
          const base = bone.position.clone();
          basePositions.set(bone, base);
          offset.lerpVectors(compiled.hipsOffsets[previous]!, compiled.hipsOffsets[next]!, alpha).add(bindPosition);
          bone.position.copy(offset);
        }
      }
    },
    dispose() {
      if (disposed) return;
      restoreBase();
      for (const binding of bindings ?? []) {
        if (!binding.expanded) continue;
        binding.mesh.boundingBox = binding.boundingBox;
        binding.mesh.boundingSphere = binding.boundingSphere;
      }
      disposed = true;
    },
  };
}

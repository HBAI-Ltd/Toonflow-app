import { Quaternion, Vector3 } from "three";
import type { Object3D } from "three";

/*
 * ACT: 胶囊人的三段关节（2026-11-16 用户：胶囊人也有三段式骨骼）。头、身子、腿三段挂在髋、身子、头、腿四个关节上，
 * 站着时和原来的三块网格位置完全一样；骨骼动作按骨骼人物的骨名映射过来：
 * hips（含髋部偏移）→整个人，spine+chest→身子，neck+head→头，左右大腿的平均→腿（只有一段腿，左右相反的走路摆动会抵消）。
 * 手臂、小腿、脚这些胶囊人没有的部位忽略。
 */
export const capsuleRigName = "capsuleRig";
export const capsuleJointNames = { hips: "capsuleHips", torso: "capsuleTorso", head: "capsuleHead", leg: "capsuleLeg" } as const;
/** 站立时髋关节离地高度（身子胶囊底和腿胶囊顶相接处）。 */
export const capsuleHipHeight = 0.6;

export type CapsuleRig = { root: Object3D; hips: Object3D; torso: Object3D; head: Object3D; leg: Object3D; base: Map<Object3D, { position: Vector3; quaternion: Quaternion }> };

export function findCapsuleRigs(group: Object3D): CapsuleRig[] {
  const rigs: CapsuleRig[] = [];
  group.traverse(node => {
    if (node.name !== capsuleRigName) return;
    const hips = node.getObjectByName(capsuleJointNames.hips), torso = node.getObjectByName(capsuleJointNames.torso);
    const head = node.getObjectByName(capsuleJointNames.head), leg = node.getObjectByName(capsuleJointNames.leg);
    if (!hips || !torso || !head || !leg) return;
    const base = new Map([hips, torso, head, leg].map(joint => [joint, { position: joint.position.clone(), quaternion: joint.quaternion.clone() }]));
    rigs.push({ root: node, hips, torso, head, leg, base });
  });
  return rigs;
}

export function resetCapsuleRig(rig: CapsuleRig) {
  rig.base.forEach((value, joint) => { joint.position.copy(value.position); joint.quaternion.copy(value.quaternion); });
}

const combined = new Quaternion();
/** 按骨骼人物的骨名摆胶囊人：rotations是相对站姿的局部旋转，hipsOffset是髋部位移（米）。 */
export function poseCapsuleRig(rig: CapsuleRig, rotations: ReadonlyMap<string, Quaternion>, hipsOffset?: Vector3) {
  resetCapsuleRig(rig);
  const base = (joint: Object3D) => rig.base.get(joint)!;
  const set = (joint: Object3D, rotation: Quaternion | undefined) => { if (rotation) joint.quaternion.copy(base(joint).quaternion).multiply(rotation); };
  set(rig.hips, rotations.get("hips"));
  const spine = rotations.get("spine"), chest = rotations.get("chest");
  set(rig.torso, spine && chest ? combined.copy(spine).multiply(chest).clone() : spine ?? chest);
  const neck = rotations.get("neck"), head = rotations.get("head");
  set(rig.head, neck && head ? combined.copy(neck).multiply(head).clone() : neck ?? head);
  const left = rotations.get("leftThigh"), right = rotations.get("rightThigh");
  set(rig.leg, left && right ? left.clone().slerp(right, 0.5) : left ?? right);
  if (hipsOffset) rig.hips.position.copy(base(rig.hips).position).add(hipsOffset);
}

/** 走路、跑步：腿前后摆、身子跟着步子轻轻起伏，跑起来往前倾。distance是累计走过的米数。 */
export function gaitCapsuleRig(rig: CapsuleRig, distance: number, speed: number) {
  resetCapsuleRig(rig);
  const pace = Math.abs(speed);
  if (pace < 0.02) return;
  const running = pace > 2.5;
  const stride = running ? 1.5 : 0.75;
  const phase = distance / stride * Math.PI * 2;
  const swing = (running ? 30 : 20) * Math.PI / 180;
  rig.leg.quaternion.copy(rig.base.get(rig.leg)!.quaternion).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.sin(phase) * swing));
  const lean = Math.min(1, pace / 5) * (running ? 14 : 5) * Math.PI / 180;
  rig.torso.quaternion.copy(rig.base.get(rig.torso)!.quaternion).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), lean));
  rig.hips.position.copy(rig.base.get(rig.hips)!.position).add(new Vector3(0, Math.abs(Math.sin(phase)) * (running ? 0.05 : 0.025), 0));
}

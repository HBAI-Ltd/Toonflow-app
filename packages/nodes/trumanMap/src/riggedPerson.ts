import {
  AnimationClip, Bone, Box3, BoxGeometry, BufferAttribute, BufferGeometry, CapsuleGeometry, Euler, Group,
  MathUtils, MeshStandardMaterial, Quaternion, QuaternionKeyframeTrack, Skeleton, SkinnedMesh,
  Sphere, SphereGeometry, Vector3, VectorKeyframeTrack,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createCharacterAnimationClips } from "./characterAnimations";

let personClips: AnimationClip[] | undefined;

// 所有尺寸以米为单位，正面 +Z；脚底绑定在 Y=0，骨骼随网格一起克隆和释放。
export function createRiggedPerson(color: string): Group {
  const group = new Group();
  group.name = "riggedPerson";
  const bones: Bone[] = [];
  const boneIndices = new Map<string, number>();
  const restPositions = new Map<string, Vector3>();
  function addBone(name: string, parent: Bone | undefined, x: number, y: number, z = 0) {
    const bone = new Bone();
    bone.name = name;
    bone.position.set(x, y, z);
    parent?.add(bone);
    boneIndices.set(name, bones.length);
    restPositions.set(name, new Vector3(x, y, z).add(parent ? restPositions.get(parent.name)! : new Vector3()));
    bones.push(bone);
    return bone;
  }
  const hips = addBone("hips", undefined, 0, 0.9);
  const spine = addBone("spine", hips, 0, 0.13);
  const chest = addBone("chest", spine, 0, 0.22);
  const neck = addBone("neck", chest, 0, 0.215);
  const head = addBone("head", neck, 0, 0.14);
  addBone("headTip", head, 0, 0.145);
  for (const [side, sign] of [["left", 1], ["right", -1]] as const) {
    const clavicle = addBone(`${side}Clavicle`, chest, sign * 0.15, 0.13);
    const upperArm = addBone(`${side}UpperArm`, clavicle, sign * 0.105, 0);
    const foreArm = addBone(`${side}ForeArm`, upperArm, sign * 0.035, -0.255, 0.005);
    const hand = addBone(`${side}Hand`, foreArm, sign * 0.012, -0.22, 0.005);
    addBone(`${side}Fingers`, hand, 0, -0.085, 0.02);
    const thigh = addBone(`${side}Thigh`, hips, sign * 0.105, -0.025);
    const shin = addBone(`${side}Shin`, thigh, 0, -0.41);
    const foot = addBone(`${side}Foot`, shin, 0, -0.375);
    addBone(`${side}Toe`, foot, 0, -0.035, 0.12);
  }

  const materials = [color, "#202124"]
    .map(value => new MeshStandardMaterial({ color: value, roughness: 0.78, metalness: 0 }));
  materials[0]!.userData.sceneObjectColor = true;
  const parts: BufferGeometry[][] = materials.map(() => []);
  const point = new Vector3();
  function addPart(geometry: BufferGeometry, material: number, chain: readonly string[]) {
    const positions = geometry.getAttribute("position");
    const skinIndices = new Uint16Array(positions.count * 4);
    const skinWeights = new Float32Array(positions.count * 4);
    const joints = chain.map(name => ({ index: boneIndices.get(name)!, y: restPositions.get(name)!.y }));
    for (let index = 0; index < positions.count; index++) {
      point.fromBufferAttribute(positions, index);
      let parent = joints[0]!;
      let child = parent;
      let weight = 0;
      for (let joint = 1; joint < joints.length; joint++) {
        const current = joints[joint]!;
        const previous = joints[joint - 1]!;
        const spacing = Math.abs(current.y - previous.y);
        const nextSpacing = joint + 1 < joints.length ? Math.abs(joints[joint + 1]!.y - current.y) : spacing;
        const halfWidth = Math.min(0.05, spacing * 0.35, nextSpacing * 0.35);
        const distance = (point.y - current.y) * Math.sign(current.y - previous.y);
        if (distance <= -halfWidth) break;
        child = current;
        if (distance < halfWidth) {
          weight = MathUtils.smoothstep(distance, -halfWidth, halfWidth);
          break;
        }
        parent = current;
      }
      skinIndices[index * 4] = parent.index;
      skinIndices[index * 4 + 1] = child.index;
      skinWeights[index * 4] = 1 - weight;
      skinWeights[index * 4 + 1] = weight;
    }
    geometry.setAttribute("skinIndex", new BufferAttribute(skinIndices, 4));
    geometry.setAttribute("skinWeight", new BufferAttribute(skinWeights, 4));
    parts[material]!.push(geometry);
  }
  const torsoChain = ["hips", "spine", "chest", "neck"];
  const headChain = ["head", "headTip"];
  addPart(new CapsuleGeometry(0.205, 0.41, 6, 16, 18).scale(1, 1, 0.72).translate(0, 1.07, 0), 0, torsoChain);
  addPart(new SphereGeometry(0.16, 24, 16).translate(0, 1.59, 0), 0, headChain);
  for (const [side, sign] of [["left", 1], ["right", -1]] as const) {
    const armChain = [`${side}UpperArm`, `${side}ForeArm`, `${side}Hand`, `${side}Fingers`];
    const armJoints = armChain.map(name => restPositions.get(name)!);
    const arm = new CapsuleGeometry(0.065, 0.53, 6, 16, 20).translate(0, 1.115, 0);
    const armPositions = arm.getAttribute("position");
    for (let index = 0; index < armPositions.count; index++) {
      point.fromBufferAttribute(armPositions, index);
      let joint = 0;
      while (joint < armJoints.length - 2 && point.y < armJoints[joint + 1]!.y) joint++;
      const start = armJoints[joint]!;
      const end = armJoints[joint + 1]!;
      const blend = MathUtils.clamp((start.y - point.y) / (start.y - end.y), 0, 1);
      armPositions.setXYZ(index, point.x + MathUtils.lerp(start.x, end.x, blend), point.y, point.z + MathUtils.lerp(start.z, end.z, blend));
    }
    arm.computeVertexNormals();
    // ACT: 连续肢体仅在关节邻域混权；骨段主体保留刚性，极端弯曲仍可能产生局部压缩。
    addPart(arm, 0, armChain);
    const clavicle = restPositions.get(`${side}Clavicle`)!;
    const shoulder = armJoints[0]!;
    const shoulderDirection = shoulder.clone().sub(clavicle);
    const bridge = new CapsuleGeometry(0.07, shoulderDirection.length(), 6, 16, 4);
    bridge.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), shoulderDirection.normalize()));
    bridge.translate(...clavicle.clone().add(shoulder).multiplyScalar(0.5).toArray());
    addPart(bridge, 0, [`${side}Clavicle`]);
    addPart(new CapsuleGeometry(0.085, 0.70, 6, 16, 24).translate(sign * 0.11, 0.435, 0), 0, [`${side}Thigh`, `${side}Shin`, `${side}Foot`, `${side}Toe`]);
  }

  const eyeBar = new CapsuleGeometry(0.009, 0.155, 4, 8, 6).rotateZ(Math.PI / 2).translate(0, 1.61, 0);
  const eyes = eyeBar.getAttribute("position");
  for (let index = 0; index < eyes.count; index++) {
    point.fromBufferAttribute(eyes, index);
    eyes.setZ(index, Math.sqrt(Math.max(0, 0.16 ** 2 - point.x ** 2 - (point.y - 1.59) ** 2)) + point.z * 0.2 + 0.0015);
  }
  eyeBar.computeVertexNormals();
  addPart(eyeBar, 1, headChain);
  const chestMark = new BoxGeometry(0.10, 0.10, 0.004, 4, 4, 1).translate(0, 1.17, 0);
  const mark = chestMark.getAttribute("position");
  for (let index = 0; index < mark.count; index++) {
    point.fromBufferAttribute(mark, index);
    mark.setZ(index, Math.sqrt(Math.max(0, 0.205 ** 2 - point.x ** 2)) * 0.72 + point.z + 0.002);
  }
  chestMark.computeVertexNormals();
  addPart(chestMark, 1, torsoChain);

  const materialParts: BufferGeometry[] = [];
  let geometry: BufferGeometry | undefined;
  try {
    for (const entries of parts) {
      const merged = mergeGeometries(entries, false);
      if (!merged) throw new Error("人物几何合并失败");
      materialParts.push(merged);
    }
    geometry = mergeGeometries(materialParts, true) ?? undefined;
    if (!geometry) throw new Error("人物材质分组合并失败");
    const mesh = new SkinnedMesh(geometry, materials);
    mesh.name = "riggedPersonBody";
    mesh.add(hips);
    mesh.bind(new Skeleton(bones));
    mesh.normalizeSkinWeights();
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    // 包含手势、抬腿及蹲身范围；SkinnedMesh 射线检测也使用这些动态保守边界。
    mesh.boundingBox = new Box3(new Vector3(-1, -0.05, -0.85), new Vector3(1, 1.9, 0.95));
    mesh.boundingSphere = new Sphere(new Vector3(0, 0.9, 0.05), 1.55);
    mesh.frustumCulled = false;
    group.add(mesh);
    personClips ??= createPersonClips(bones.map(bone => bone.name));
    group.animations = [...personClips, ...createCharacterAnimationClips()];
    return group;
  } catch (error) {
    geometry?.dispose();
    materials.forEach(material => material.dispose());
    throw error;
  } finally {
    parts.flat().forEach(part => part.dispose());
    materialParts.forEach(part => part.dispose());
  }
}

function createPersonClips(boneNames: string[]): AnimationClip[] {
  const durations = { Idle: 3.2, Walk: 1.08, Run: 0.68, Interact: 2.4, Work: 1.6, Rest: 3.6, Alert: 2.8, Graze: 2.8 };
  const clips: AnimationClip[] = [];
  const quaternion = new Quaternion();
  const euler = new Euler();
  for (const [name, duration] of Object.entries(durations)) {
    const rotations = new Map(boneNames.map(bone => [bone, [] as number[]]));
    const times: number[] = [];
    const hipPositions: number[] = [];
    const frames = 64;
    for (let frame = 0; frame <= frames; frame++) {
      const phase = frame === frames ? 0 : frame / frames;
      const angle = phase * Math.PI * 2;
      const pose = new Map<string, [number, number, number]>();
      let hipsY = 0.9;
      function rotate(bone: string, x = 0, y = 0, z = 0) { pose.set(bone, [x, y, z]); }
      // 两段腿的原地解算只用于生成关键帧；运行时继续由现有 AnimationMixer 驱动。
      function leg(side: string, z: number, ankleY: number, footPitch = 0, toePitch = 0) {
        const upper = 0.41;
        const lower = 0.375;
        const vertical = hipsY - 0.025 - ankleY;
        const distance = MathUtils.clamp(Math.hypot(vertical, z), Math.abs(upper - lower) + 0.0001, upper + lower - 0.0001);
        const thigh = -Math.atan2(z, vertical) - Math.acos(MathUtils.clamp((upper * upper + distance * distance - lower * lower) / (2 * upper * distance), -1, 1));
        const knee = Math.PI - Math.acos(MathUtils.clamp((upper * upper + lower * lower - distance * distance) / (2 * upper * lower), -1, 1));
        rotate(`${side}Thigh`, thigh);
        rotate(`${side}Shin`, knee);
        rotate(`${side}Foot`, footPitch - thigh - knee);
        rotate(`${side}Toe`, toePitch);
      }
      if (name === "Walk" || name === "Run") {
        const running = name === "Run";
        const stance = running ? 0.35 : 0.62;
        const stride = running ? 0.3 : 0.16;
        hipsY = running ? 0.82 - 0.025 * Math.cos(2 * angle - Math.PI * 0.7) : 0.87 + 0.01 * Math.cos(2 * angle);
        for (const [side, offset] of [["left", 0], ["right", 0.5]] as const) {
          const step = (phase + offset) % 1;
          const swinging = step >= stance;
          const progress = swinging ? (step - stance) / (1 - stance) : step / stance;
          const lift = swinging ? Math.sin(progress * Math.PI) : 0;
          const z = swinging ? MathUtils.lerp(-stride, stride, MathUtils.smoothstep(progress, 0, 1)) : MathUtils.lerp(stride, -stride, progress);
          // 为关键帧之间的骨骼插值预留 2mm 脚底余量。
          leg(side, z, 0.092 + lift * (running ? 0.17 : 0.08), lift * -0.12, lift * 0.12);
          rotate(`${side}UpperArm`, Math.sin(angle + offset * Math.PI * 2) * (running ? 0.7 : 0.32), 0, side === "left" ? 0.045 : -0.045);
          rotate(`${side}ForeArm`, running ? -0.95 + Math.cos(angle + offset * Math.PI * 2) * 0.12 : -0.16);
        }
        rotate("chest", running ? 0.14 : 0.025, Math.sin(angle) * 0.045);
        rotate("head", running ? -0.1 : -0.02);
      } else {
        hipsY = name === "Rest" ? 0.845 + Math.sin(angle) * 0.003 : name === "Work" ? 0.875 : 0.898;
        leg("left", 0, 0.09);
        leg("right", 0, 0.09);
        rotate("chest", Math.sin(angle) * 0.008);
        rotate("leftUpperArm", 0.025 + Math.sin(angle) * 0.012, 0, 0.035);
        rotate("rightUpperArm", 0.025 - Math.sin(angle) * 0.012, 0, -0.035);
        rotate("leftForeArm", -0.07);
        rotate("rightForeArm", -0.07);
        rotate("head", Math.sin(angle) * 0.014, Math.sin(angle) * 0.025);
        if (name === "Interact") {
          rotate("rightUpperArm", -0.6 + Math.sin(angle) * 0.12, 0.1, -0.16);
          rotate("rightForeArm", -0.85 + Math.sin(2 * angle) * 0.2);
          rotate("rightHand", 0, Math.sin(angle) * 0.2, Math.sin(2 * angle) * 0.12);
          rotate("head", Math.sin(2 * angle) * 0.055, -0.12 + Math.sin(angle) * 0.08);
        } else if (name === "Work") {
          rotate("chest", 0.07);
          for (const side of ["left", "right"]) {
            rotate(`${side}UpperArm`, -0.55 + Math.sin(angle) * 0.12, 0, side === "left" ? -0.1 : 0.1);
            rotate(`${side}ForeArm`, -0.8 - Math.sin(angle) * 0.22);
            rotate(`${side}Hand`, Math.sin(angle) * 0.12);
          }
          rotate("head", 0.16);
        } else if (name === "Rest") {
          rotate("chest", 0.04);
          rotate("head", 0.1 + Math.sin(angle) * 0.025);
          rotate("leftForeArm", -0.18);
          rotate("rightForeArm", -0.18);
        } else if (name === "Alert") {
          rotate("head", -0.04, Math.sin(angle) * 0.55);
          rotate("rightUpperArm", -0.45, 0.1, -0.45);
          rotate("rightForeArm", -1.55, 0, -0.18);
          rotate("rightHand", 0.08, 0.12);
        } else if (name === "Graze") {
          const eating = (1 - Math.cos(angle)) * 0.5;
          rotate("rightUpperArm", -0.4 - eating * 0.45, 0.25, 0.12);
          rotate("rightForeArm", -0.95 - eating * 0.9, -0.15);
          rotate("rightHand", -0.15, 0.15);
          rotate("rightFingers", -0.3);
          rotate("head", 0.03 + eating * 0.06);
        }
      }
      times.push(frame / frames * duration);
      hipPositions.push(0, hipsY, 0);
      for (const bone of boneNames) {
        const rotation = pose.get(bone) ?? [0, 0, 0];
        quaternion.setFromEuler(euler.set(...rotation));
        rotations.get(bone)!.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
      }
    }
    clips.push(new AnimationClip(name, duration, [
      new VectorKeyframeTrack("hips.position", times, hipPositions),
      ...boneNames.map(bone => new QuaternionKeyframeTrack(`${bone}.quaternion`, times, rotations.get(bone)!)),
    ]));
  }
  return clips;
}

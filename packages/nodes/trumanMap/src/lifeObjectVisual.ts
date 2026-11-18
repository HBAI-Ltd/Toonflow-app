import { AnimationClip, AnimationMixer, MathUtils, PropertyBinding } from "three";
import type { AnimationAction, Group, Object3D } from "three";
import { createSkeletalMotionPlayer, type SkeletalMotionContext } from "./skeletalMotion";
import { findCapsuleRigs, gaitCapsuleRig } from "./capsuleRig";

export type LifeAction = "graze" | "alert" | "idle" | "walk" | "interact" | "work" | "rest";
export type LifeLibraryAnimation = { name: string; time: number };
export type LifeVisualSnapshot = {
  lastTime: number | undefined;
  distance: number;
  pose?: {
    action?: LifeAction; seconds?: number; speed?: number; rate?: number;
    motion?: SkeletalMotionContext;
    animation?: LifeLibraryAnimation;
    clips?: { index: number; time: number; weight: number; timeScale: number; enabled: boolean }[];
  };
};
export type LifeVisual = {
  group: Group;
  animate: (seconds: number, speed: number, action?: LifeAction, motion?: SkeletalMotionContext, animation?: LifeLibraryAnimation, rate?: number) => void;
  snapshot: () => LifeVisualSnapshot;
  restore: (value: LifeVisualSnapshot) => void;
  dispose: () => void;
};

type AnimationEntry = { clip: AnimationClip; action: AnimationAction; index: number };
const stationaryPatterns: Partial<Record<LifeAction, RegExp>> = {
  graze: /graze|eat|feed|forage|sniff|drink|觅食|进食|嗅探/i,
  alert: /alert|look|watch|scan|guard|警戒|观察/i,
  interact: /talk|speak|gesture|interact|chat|convers|交流|对话|交谈|互动|手势/i,
  work: /work|craft|operate|repair|build|工作|操作|修理|制作/i,
  rest: /rest|relax|sit|sleep|休息|放松|坐下|睡眠/i,
};

// 演绎只借用真实场景模型；几何、材质、纹理及父子层级仍由场景持有。
export function createLifeObject(group: Group, index: number, seed: number): LifeVisual {
  const motionPlayer = createSkeletalMotionPlayer(group);
  // 胶囊人没有动作库：走路、跑步时三段关节自己摆腿、起伏（做骨骼动作时让给动作）。
  const capsules = findCapsuleRigs(group);
  const clips = new Map<AnimationClip, Object3D>();
  group.traverse(node => { for (const clip of node.animations) if (!clips.has(clip)) clips.set(clip, node); });
  const mixers = new Map<Object3D, AnimationMixer>();
  const entries: AnimationEntry[] = [];
  for (const [clip, owner] of clips) {
    if (!(clip.duration > 0)) continue;
    const tracks = clip.tracks.filter(track => {
      const binding = PropertyBinding.parseTrackName(track.name);
      return !["position", "quaternion", "rotation"].includes(binding.propertyName)
        || !!binding.nodeName && binding.nodeName !== owner.name && binding.nodeName !== owner.uuid && binding.nodeName !== ".";
    });
    if (!tracks.length) continue;
    const root = owner;
    let mixer = mixers.get(root);
    if (!mixer) { mixer = new AnimationMixer(root); mixers.set(root, mixer); }
    const actualClip = new AnimationClip(clip.name, clip.duration, tracks, clip.blendMode);
    entries.push({ clip: actualClip, action: mixer.clipAction(actualClip), index: entries.length });
  }
  const phase = Math.abs(Math.imul(index + 1, 2654435761) ^ Math.imul(seed, 1597334677)) % 37 / 37;
  const walkPattern = /walk|walking|locomotion|move|fly|flight|swim|行走|走路|步行|飞行|游泳/i;
  const runPattern = /run|jog|sprint|奔跑|跑步/i;
  const idlePattern = /idle|stand|breath|待机|站立/i;
  function matching(pattern: RegExp) {
    const found = entries.filter(entry => pattern.test(entry.clip.name));
    const library = found.filter(entry => entry.clip.name.startsWith("cc0"));
    const candidates = library.length ? library : found;
    const names = [...new Set(candidates.map(entry => entry.clip.name))];
    const name = names[Math.floor(phase * names.length)];
    return candidates.filter(entry => entry.clip.name === name);
  }
  function choose(action: LifeAction, speed: number) {
    const libraryId = action === "walk" && Math.abs(speed) > 0.02 ? Math.abs(speed) > 2.5 ? "cc0Run" : "cc0Walk" : action === "idle" ? "cc0Idle" : undefined;
    const library = libraryId ? entries.filter(entry => entry.clip.name === libraryId) : [];
    if (library.length) return library;
    if (action === "walk" && Math.abs(speed) > 0.02) {
      const preferred = matching(Math.abs(speed) > 2.5 ? runPattern : walkPattern);
      return preferred.length ? preferred : matching(Math.abs(speed) > 2.5 ? walkPattern : runPattern);
    }
    const pattern = stationaryPatterns[action];
    const desired = pattern ? matching(pattern) : [];
    if (desired.length) return desired;
    const idle = matching(idlePattern);
    return idle.length ? idle : matching(/rest|休息/i);
  }
  let lastTime: number | undefined;
  let distance = 0;
  let currentAction: LifeAction = "idle";
  let currentSpeed = 0;
  let currentMotion: SkeletalMotionContext | undefined;
  let currentAnimation: LifeLibraryAnimation | undefined;
  let currentRate = 1;
  let disposed = false;
  function animate(seconds: number, speed: number, action: LifeAction = Math.abs(speed) > 0.02 ? "walk" : "idle", motion?: SkeletalMotionContext, animation?: LifeLibraryAnimation, rate = 1) {
    if (disposed || !Number.isFinite(seconds) || !Number.isFinite(speed)) return;
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("预设动作播放速率无效");
    if (animation && (!Number.isFinite(animation.time) || animation.time < 0)) throw new Error("动作库采样时间无效");
    const libraryEntries = animation ? entries.filter(entry => entry.clip.name === animation.name) : [];
    if (animation && !libraryEntries.length) throw new Error("人物未载入动作库片段：" + animation.name);
    const switchingMotion = !!motion !== !!currentMotion || animation?.name !== currentAnimation?.name;
    motionPlayer.restoreBase();
    currentMotion = undefined;
    const firstFrame = lastTime === undefined || seconds < lastTime;
    const delta = firstFrame ? 0 : seconds - lastTime!;
    if (lastTime !== undefined && seconds < lastTime) { distance = 0; mixers.forEach(mixer => mixer.stopAllAction()); }
    distance += delta * Math.abs(speed);
    lastTime = seconds;
    currentAction = action;
    currentSpeed = speed;
    currentRate = animation || motion || Math.abs(speed) > 0.02 ? 1 : rate;
    const baseAction = motion ? Math.abs(speed) > 0.02 ? "walk" : "idle" : action;
    const selected = new Set(animation ? libraryEntries : choose(baseAction, speed));
    for (const entry of entries) {
      const desired = Number(selected.has(entry));
      const playing = entry.action.isScheduled();
      if (!playing && !desired) continue;
      let weight = playing ? entry.action.getEffectiveWeight() : 0;
      if (!playing) { entry.action.reset().play(); entry.action.time = phase * entry.clip.duration; }
      weight = firstFrame || switchingMotion ? desired : MathUtils.damp(weight, desired, 16, delta);
      entry.action.setEffectiveWeight(weight);
      const movingClip = walkPattern.test(entry.clip.name) || runPattern.test(entry.clip.name);
      const absoluteSample = !!animation && selected.has(entry);
      if (absoluteSample) entry.action.time = MathUtils.clamp(animation.time, 0, entry.clip.duration - 0.000001);
      entry.action.setEffectiveTimeScale(absoluteSample ? 0 : movingClip ? MathUtils.clamp(Math.abs(speed) / (runPattern.test(entry.clip.name) ? 3.5 : 1.35), 0.1, 3) : currentRate);
      if (!desired && weight < 0.001) entry.action.stop();
    }
    mixers.forEach(mixer => mixer.update(delta));
    motionPlayer.apply(motion);
    if (!motion && !animation) for (const rig of capsules) gaitCapsuleRig(rig, distance, action === "walk" || !action ? speed : 0);
    currentMotion = motion;
    currentAnimation = animation ? { ...animation } : undefined;
  }
  return {
    group, animate,
    snapshot: () => ({ lastTime, distance, pose: {
      action: currentAction, seconds: lastTime ?? 0, speed: currentSpeed, rate: currentRate,
      motion: currentMotion ? structuredClone(currentMotion) : undefined,
      animation: currentAnimation ? { ...currentAnimation } : undefined,
      clips: entries.filter(entry => entry.action.isScheduled()).map(entry => ({ index: entry.index, time: entry.action.time, weight: entry.action.getEffectiveWeight(), timeScale: entry.action.getEffectiveTimeScale(), enabled: entry.action.enabled })),
    } }),
    restore(value) {
      if (disposed) return;
      motionPlayer.restoreBase();
      lastTime = value.lastTime;
      distance = value.distance;
      currentAction = value.pose?.action ?? "idle";
      currentSpeed = value.pose?.speed ?? 0;
      currentRate = value.pose?.rate ?? 1;
      currentMotion = value.pose?.motion ? structuredClone(value.pose.motion) : undefined;
      currentAnimation = value.pose?.animation ? { ...value.pose.animation } : undefined;
      mixers.forEach(mixer => mixer.stopAllAction());
      for (const saved of value.pose?.clips ?? []) {
        const entry = entries[saved.index];
        if (!entry) continue;
        entry.action.reset().play();
        entry.action.time = saved.time;
        entry.action.enabled = saved.enabled;
        entry.action.setEffectiveWeight(saved.weight);
        entry.action.setEffectiveTimeScale(saved.timeScale);
      }
      mixers.forEach(mixer => mixer.update(0));
      motionPlayer.apply(currentMotion);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      motionPlayer.dispose();
      mixers.forEach((mixer, root) => { mixer.stopAllAction(); mixer.uncacheRoot(root); });
    },
  };
}

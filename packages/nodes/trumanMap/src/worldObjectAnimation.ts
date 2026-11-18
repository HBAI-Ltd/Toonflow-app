import { Euler, Group, MathUtils, Matrix4, Mesh, Quaternion, Vector3 } from "three";
import type { Object3D, Scene } from "three";
import { getPerformanceClipDuration, getPerformanceClipSourceTime, getPerformanceClips, type PerformanceClip } from "./performanceClips";
import type { PerformanceTrack } from "./performanceDocument";
import type { SceneDocument } from "./sceneDocument";
import { createPerformanceEffects, type PerformanceEffectSample } from "./performanceEffects";
import { getTerrainHeight } from "./terrainModel";
import { createCollisionShape, transformCollisionShape } from "./sceneCollision";
import { createLifeObject, type LifeAction, type LifeVisual, type LifeVisualSnapshot } from "./lifeObjectVisual";

type ObjectTransform = { position: number[]; quaternion: number[]; scale: number[] };
type ContactAttempt = { time: number; distance: number; bonePosition: number[]; nearestPoint: number[] };
type ObjectRecord = { capsule?: boolean; id: string; track: PerformanceTrack; source: Object3D; base: ObjectTransform; signature: string; applied: boolean; terminal: string; attached: boolean; ready: boolean; error?: string; effectError?: string; poseError?: string; visual?: LifeVisual; visualBase?: LifeVisualSnapshot; poseKey?: string; poseTime?: number; scheduledAt?: number; scheduleStartAt?: number };
export type WorldObjectSnapshot = { starts: [string, number][]; objects: { id: string; transform: ObjectTransform; applied: boolean; terminal: string; attached: boolean; ready?: boolean; scheduledAt?: number; error?: string; visual?: LifeVisualSnapshot; poseKey?: string; poseTime?: number }[]; playing: boolean; contactSignature?: string; contacts?: [string, ContactAttempt][]; attempts?: [string, { first: ContactAttempt; last: ContactAttempt }][] };

function readTransform(source: Object3D): ObjectTransform { return { position: source.position.toArray(), quaternion: source.quaternion.toArray(), scale: source.scale.toArray() }; }
function writeTransform(source: Object3D, value: ObjectTransform) {
  source.position.fromArray(value.position); source.quaternion.fromArray(value.quaternion); source.scale.fromArray(value.scale);
  source.updateWorldMatrix(true, true); source.updateMatrixWorld(true);
}
function clipKey(trackId: string, clipId: string) { return trackId + "\u0000" + clipId; }

export function createWorldObjectAnimation(scene: Scene) {
  const effects = createPerformanceEffects(scene);
  const records = new Map<string, ObjectRecord>();
  let orderedRecords: ObjectRecord[] = [];
  const starts = new Map<string, number>();
  const contacts = new Map<string, ContactAttempt>();
  const attempts = new Map<string, { first: ContactAttempt; last: ContactAttempt }>();
  let contactSignature = "";
  let sources = new Map<string, Object3D>();
  let document: SceneDocument | undefined;
  let playing = false;
  let animating = false;
  const position = new Vector3();
  const scale = new Vector3();
  const quaternion = new Quaternion();
  const euler = new Euler();
  const matrix = new Matrix4();
  const base = new Matrix4();
  const pivot = new Vector3();

  function restorePose(record: ObjectRecord, value = record.visualBase) {
    if (!record.visual || !value) return;
    const root = readTransform(record.source);
    record.visual.restore(value);
    writeTransform(record.source, root);
  }
  function reset(preserveContacts = false) {
    effects.reset();
    for (const record of records.values()) if (record.applied) {
      writeTransform(record.source, record.base);
      record.applied = false; record.terminal = ""; record.attached = false;
      record.error = undefined;
    }
    for (const record of records.values()) {
      restorePose(record);
      record.poseKey = undefined; record.poseTime = undefined; record.poseError = undefined;
      record.ready = false; record.error = undefined; record.effectError = undefined;
    }
    starts.clear(); playing = false; animating = false;
    if (!preserveContacts) { contacts.clear(); attempts.clear(); }
  }
  function sync(value: SceneDocument, tracks: readonly PerformanceTrack[], models: Map<string, Object3D>) {
    sources = models; document = value;
    const nextContactSignature = JSON.stringify([tracks, value.terrain, value.objects.map(object => {
      const source = models.get(object.id), geometry: unknown[] = [];
      source?.traverse(node => { if (node instanceof Mesh) geometry.push([node.uuid, node.geometry.uuid, node.geometry.getAttribute("position")?.version, node.geometry.index?.version]); });
      return [object.id, object.position, object.rotation, object.scale, object.height, object.visible, object.asset.id, object.asset.path, object.asset.sha256, object.asset.contentTransform, source?.uuid, geometry];
    })]);
    const contactChanged = !!contactSignature && contactSignature !== nextContactSignature;
    contactSignature = nextContactSignature;
    const enabled = value.life?.enabled !== false;
    const selected = new Map(tracks.filter(track => enabled && track.controller === "object" && track.enabled !== false && value.objects.some(object => object.id === track.objectId && object.visible) && track.clips?.some(clip => clip.enabled !== false)).map(track => [track.objectId, track]));
    for (const [id, record] of records) {
      const object = value.objects.find(object => object.id === id);
      const signature = object && JSON.stringify([object.position, object.rotation, object.scale, object.height, object.asset, models.get(id)?.children.map(child => child.uuid)]);
      if (!selected.has(id) || record.source !== models.get(id) || signature !== record.signature) {
        // viewport已按新接受态及height校正同一个root；不能先用旧运行base覆盖它。
        if (record.applied && (record.source !== models.get(id) || signature === record.signature)) writeTransform(record.source, record.base);
        const root = readTransform(record.source);
        record.visual?.dispose();
        writeTransform(record.source, root);
        records.delete(id);
      }
    }
    if (contactChanged) reset();
    for (const [id, track] of selected) {
      const object = value.objects.find(object => object.id === id && object.visible);
      const source = models.get(id);
      if (!object || !source) continue;
      let record = records.get(id);
      if (record) {
        if (record.track.id !== track.id) { record.scheduledAt = undefined; record.scheduleStartAt = undefined; record.ready = false; }
        record.track = track;
      }
      else {
        record = { id, track, source, base: readTransform(source), signature: JSON.stringify([object.position, object.rotation, object.scale, object.height, object.asset, source.children.map(child => child.uuid)]), applied: false, terminal: "", attached: false, ready: false };
        records.set(id, record);
      }
      // 胶囊人也有头、身子、腿三段关节：直接控制时同样借一个外观，做骨骼动作、走位时摆腿。
      record.capsule = object.asset.shape === "person";
      const needsVisual = source instanceof Group && (object.asset.shape === "riggedPerson" ? !!track.clips?.some(clip => clip.enabled !== false && clip.kind === "pose") : record.capsule && !!track.clips?.some(clip => clip.enabled !== false && (clip.kind === "pose" || clip.kind === "transform")));
      if (needsVisual && !record.visual) {
        record.visual = createLifeObject(source as Group, 0, value.life?.seed ?? 1);
        record.visualBase = record.visual.snapshot();
      } else if (!needsVisual && record.visual) {
        const root = readTransform(record.source);
        record.visual.dispose(); writeTransform(record.source, root);
        record.visual = undefined; record.visualBase = undefined;
        record.poseKey = undefined; record.poseTime = undefined; record.poseError = undefined;
      }
    }
    orderedRecords = [];
    const visited = new Set<string>();
    function visit(record: ObjectRecord) {
      if (visited.has(record.id)) return;
      visited.add(record.id);
      for (const clip of record.track.clips ?? []) {
        const target = clip.enabled !== false && clip.kind === "attach" ? records.get(clip.targetId) : undefined;
        if (target) visit(target);
      }
      orderedRecords.push(record);
    }
    // ACT: 引用校验已拒绝循环附着；目标先采样，使车辆和乘客在同一世界帧更新。
    for (const record of records.values()) visit(record);
    if (!enabled) reset();
  }
  function notify(trackId: string, clipId: string, time: number) {
    const key = clipKey(trackId, clipId);
    if (!starts.has(key)) starts.set(key, time);
  }
  function setClock(worldClock: number, time: number) {
    for (const record of records.values()) {
      if (record.scheduleStartAt !== record.track.startAt) { record.scheduledAt = undefined; record.scheduleStartAt = record.track.startAt; }
      if (record.scheduledAt !== undefined) continue;
      if (record.track.startAt === undefined) record.scheduledAt = time;
      else {
        let absolute = Math.floor(worldClock / 86400) * 86400 + record.track.startAt;
        if (absolute < worldClock - 0.00001) absolute += 86400;
        record.scheduledAt = absolute - (worldClock - time);
      }
    }
  }
  /**
   * ACT: 演绎“从头重演”时内部时间从time（一般是0）重新开始：直接控制的轨道也要排到同一个起点，
   * 否则还按旧的时间基准排期，重演、拖时间轴时会比导航的人晚开演（坐下、起身、物件动画都等不到）。
   */
  function reschedule(time: number) {
    for (const record of records.values()) {
      record.scheduleStartAt = record.track.startAt;
      record.scheduledAt = record.track.startAt === undefined ? time : undefined;
    }
  }
  function startTime(record: ObjectRecord, clip: PerformanceClip) {
    const trigger = clip.trigger && starts.get(clipKey(clip.trigger.trackId, clip.trigger.clipId));
    return clip.trigger ? trigger === undefined ? undefined : trigger + clip.start : (record.scheduledAt ?? 0) + clip.start;
  }
  function setMatrix(source: Object3D, world: Matrix4) {
    if (source.parent) { source.parent.updateWorldMatrix(true, false); world.premultiply(source.parent.matrixWorld.clone().invert()); }
    world.decompose(source.position, source.quaternion, source.scale);
    source.updateWorldMatrix(true, true); source.updateMatrixWorld(true);
  }
  function transform(record: ObjectRecord, clip: Extract<PerformanceClip, { kind: "transform" }>, time: number) {
    const frames = clip.keyframes;
    let next = 1;
    while (next < frames.length - 1 && frames[next]!.time < time) next++;
    const before = frames[next - 1]!, after = frames[next]!;
    const alpha = MathUtils.clamp((time - before.time) / (after.time - before.time), 0, 1);
    function at(index: number, field: "position" | "rotation" | "scale", fallback: [number, number, number]): [number, number, number] {
      for (let cursor = index; cursor >= 0; cursor--) if (frames[cursor]![field]) return frames[cursor]![field]!;
      return fallback;
    }
    position.fromArray(at(next - 1, "position", [0, 0, 0])).lerp(new Vector3(...at(next, "position", [0, 0, 0])), alpha);
    scale.fromArray(at(next - 1, "scale", [1, 1, 1])).lerp(new Vector3(...at(next, "scale", [1, 1, 1])), alpha);
    const from = at(next - 1, "rotation", [0, 0, 0]);
    const to = at(next, "rotation", [0, 0, 0]);
    quaternion.setFromEuler(euler.set(...from.map(MathUtils.degToRad) as [number, number, number], "XYZ"));
    quaternion.slerp(new Quaternion().setFromEuler(euler.set(...to.map(MathUtils.degToRad) as [number, number, number], "XYZ")), alpha);
    base.compose(new Vector3().fromArray(record.base.position), new Quaternion().fromArray(record.base.quaternion), new Vector3().fromArray(record.base.scale));
    pivot.fromArray(clip.pivot ?? [0, 0, 0]);
    matrix.copy(base).multiply(new Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z));
    matrix.multiply(new Matrix4().compose(position, quaternion, scale)).multiply(new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
    matrix.decompose(record.source.position, record.source.quaternion, record.source.scale);
    record.source.updateWorldMatrix(true, true); record.source.updateMatrixWorld(true);
  }
  function attach(record: ObjectRecord, clip: Extract<PerformanceClip, { kind: "attach" }>, time = 1, worldTime?: number) {
    const target = sources.get(clip.targetId);
    if (!target || target === record.source) { record.error = "附着目标不存在或不能附着到自身。"; return false; }
    let parent = target;
    if (clip.bone) {
      const matches: Object3D[] = [];
      target.traverse(node => { if (node.type === "Bone" && node.name === clip.bone) matches.push(node); });
      if (matches.length !== 1) { record.error = "附着骨骼不存在或名称重复：" + clip.bone; return false; }
      parent = matches[0]!;
    }
    parent.updateWorldMatrix(true, true); parent.updateMatrixWorld(true);
    position.fromArray(clip.position ?? [0, 0, 0]);
    const angles = clip.rotation ?? [0, 0, 0];
    quaternion.setFromEuler(euler.set(...angles.map(MathUtils.degToRad) as [number, number, number], "XYZ"));
    matrix.copy(parent.matrixWorld).multiply(new Matrix4().compose(position, quaternion, new Vector3(1, 1, 1)));
    matrix.decompose(position, quaternion, scale);
    const key = clipKey(record.track.id, clip.id), evidence = contacts.get(key);
    const proven = worldTime !== undefined && evidence !== undefined && evidence.time <= worldTime;
    if (clip.bone && !proven) {
      const hand = parent.getWorldPosition(new Vector3());
      const body = transformCollisionShape(createCollisionShape(record.source), record.source.matrixWorld);
      const nearest = new Vector3(), closest = new Vector3();
      let distance = Infinity;
      for (const part of body.parts) {
        part.obb.clampPoint(hand, nearest);
        const gap = nearest.distanceTo(hand);
        if (gap < distance) { distance = gap; closest.copy(nearest); }
      }
      if (worldTime !== undefined) {
        const attempt: ContactAttempt = { time: worldTime, distance, bonePosition: hand.toArray(), nearestPoint: closest.toArray() };
        attempts.set(key, { first: attempts.get(key)?.first ?? attempt, last: attempt });
        if (distance <= 0.35) contacts.set(key, attempt);
      }
      if (distance > 0.35) { record.error = "手骨距道具包围体 " + (Number.isFinite(distance) ? distance.toFixed(3) + " 米" : "不可测量") + "，超过0.35米接触容差；请先走近并让手接近道具再拾取。"; return false; }
    }
    // 原地附着从首帧就在目标位置；手拿骨骼附着仍保留接触后的短过渡。
    const alpha = clip.bone ? MathUtils.smoothstep(time, 0, 0.16) : 1;
    if (alpha < 1) {
      base.compose(new Vector3().fromArray(record.base.position), new Quaternion().fromArray(record.base.quaternion), new Vector3().fromArray(record.base.scale));
      if (record.source.parent) base.premultiply(record.source.parent.matrixWorld);
      const origin = new Vector3(), orientation = new Quaternion();
      base.decompose(origin, orientation, new Vector3());
      position.lerpVectors(origin, position, alpha); quaternion.slerpQuaternions(orientation, quaternion, alpha);
    }
    scale.fromArray(record.base.scale);
    if (record.source.parent) scale.multiply(record.source.parent.getWorldScale(new Vector3()));
    matrix.compose(position, quaternion, scale);
    setMatrix(record.source, matrix);
    record.error = undefined;
    return true;
  }
  function effectOrigin(record: ObjectRecord, time: number) {
    const current = readTransform(record.source);
    const error = record.error;
    try {
      writeTransform(record.source, record.base);
      const object = document!.objects.find(object => object.id === record.id)!;
      const selected = getPerformanceClips(record.track, object).filter(clip => clip.enabled !== false && (clip.kind === "transform" || clip.kind === "attach"))
        .map(clip => ({ clip, start: startTime(record, clip) })).filter((item): item is { clip: Extract<PerformanceClip, { kind: "transform" | "attach" }>; start: number } => item.start !== undefined && item.start <= time)
        .sort((left, right) => left.start - right.start).at(-1);
      if (selected?.clip.kind === "transform") transform(record, selected.clip, getPerformanceClipSourceTime(selected.clip, time - selected.start));
      else if (selected?.clip.kind === "attach") attach(record, selected.clip);
      // ACT: 爆点按片段开始时刻重采样；attach目标沿用当前姿态，不补演整个世界的历史。
      return record.source.matrixWorld.clone();
    } finally { writeTransform(record.source, current); record.error = error; }
  }
  /** 直接控制的走位此刻走多快（米/秒）：按当前变换片段的关键帧位置差估算。 */
  function transformSpeed(record: ObjectRecord, time: number) {
    const object = document?.objects.find(item => item.id === record.id);
    if (!object) return 0;
    const active = getPerformanceClips(record.track, object).filter(clip => clip.enabled !== false && clip.kind === "transform").map(clip => ({ clip, start: startTime(record, clip) })).filter((item): item is { clip: Extract<PerformanceClip, { kind: "transform" }>; start: number } => item.start !== undefined && item.start <= time).sort((left, right) => left.start - right.start).at(-1);
    if (!active) return 0;
    const frames = active.clip.keyframes;
    const at = (moment: number) => {
      const local = getPerformanceClipSourceTime(active.clip, Math.max(0, moment - active.start));
      let next = 1;
      while (next < frames.length - 1 && frames[next]!.time < local) next++;
      const before = frames[next - 1]!, after = frames[next]!;
      const alpha = MathUtils.clamp((local - before.time) / Math.max(0.0001, after.time - before.time), 0, 1);
      const a = before.position ?? [0, 0, 0], b = after.position ?? a;
      return [a[0]! + (b[0]! - a[0]!) * alpha, a[2]! + (b[2]! - a[2]!) * alpha] as const;
    };
    const now = at(time), earlier = at(time - 0.1);
    return Math.hypot(now[0] - earlier[0], now[1] - earlier[1]) / 0.1 * Math.max(object.scale.x, object.scale.z);
  }
  function samplePose(record: ObjectRecord, time: number) {
    // 胶囊人只认带骨骼动作的姿态片段；说话、站着这些只记时间的片段不打断上一个姿势（坐着说话还坐着）。
    const selected = (record.track.clips ?? []).filter(clip => clip.enabled !== false && clip.kind === "pose" && (!record.capsule || !!clip.motion))
      .map(clip => ({ clip, start: startTime(record, clip) }))
      .filter((item): item is { clip: Extract<PerformanceClip, { kind: "pose" }>; start: number } => item.start !== undefined && item.start <= time)
      .sort((left, right) => left.start - right.start).at(-1);
    if (!selected) {
      if (record.poseKey) { restorePose(record); animating = true; }
      record.poseKey = undefined; record.poseTime = undefined; record.poseError = undefined;
      // 胶囊人沿走位移动时摆腿走路（速度按走位关键帧算）。
      if (record.capsule && record.visual) { const speed = transformSpeed(record, time); record.visual.animate(time, speed, speed > 0.02 ? "walk" : "idle"); if (speed > 0.02) animating = true; }
      return;
    }
    // 胶囊人身上只记时间的说话、站着片段：没有可播的动作，跳过、不算错误。
    if ((!record.visual || !record.visualBase) && !selected.clip.animation && !selected.clip.motion) {
      if (record.poseKey) { restorePose(record); animating = true; }
      record.poseKey = undefined; record.poseTime = undefined; record.poseError = undefined;
      return;
    }
    if (!record.visual || !record.visualBase) { record.poseError = "直接控制的姿态片段需要场景中的完整骨骼人物模型。"; return; }
    const { clip, start } = selected;
    const sourceTime = getPerformanceClipSourceTime(clip, time - start);
    const key = clipKey(record.track.id, clip.id) + ":" + start;
    if (record.poseKey === key && record.poseTime === sourceTime) return;
    const root = readTransform(record.source);
    try {
      // ACT: 根变换由transform/attach独占；骨骼从借用时的基态绝对采样，跳时不依赖上一帧。
      restorePose(record);
      const action: LifeAction = clip.action === "wait" ? "idle" : clip.action === "observe" ? "alert" : clip.action ?? "idle";
      const motion = clip.motion ? { motion: clip.motion, time: sourceTime, duration: clip.motion.keyframes.at(-1)!.time } : undefined;
      const animation = clip.animation ? { name: clip.animation, time: sourceTime } : undefined;
      if (!motion && !animation) record.visual.animate(0, 0, action);
      record.visual.animate(sourceTime, 0, action, motion, animation);
      writeTransform(record.source, root);
      record.poseKey = key; record.poseTime = sourceTime; record.poseError = undefined;
      notify(record.track.id, clip.id, start);
      animating = true;
    } catch (error) {
      restorePose(record);
      writeTransform(record.source, root);
      record.poseKey = undefined; record.poseTime = undefined;
      record.poseError = error instanceof Error ? error.message : String(error);
    }
  }
  function render(time: number, allowStart = false, allowContact = true) {
    playing ||= allowStart;
    if (allowStart) for (const record of records.values()) record.ready = true;
    const navigationChanged = new Set<string>();
    if (!playing || !document) { effects.render([]); return navigationChanged; }
    // ACT: 对象片段可相互触发，最多按对象数传播；不执行脚本、不修改父子层级。
    for (let round = 0; round <= records.size; round++) {
      const count = starts.size;
      for (const record of orderedRecords) {
        if (!record.ready) continue;
        samplePose(record, time);
        const object = document.objects.find(object => object.id === record.id)!;
        const candidates = getPerformanceClips(record.track, object).filter(clip => clip.enabled !== false && (clip.kind === "transform" || clip.kind === "attach")).map(clip => ({ clip, start: startTime(record, clip) })).filter((item): item is { clip: Extract<PerformanceClip, { kind: "transform" | "attach" }>; start: number } => item.start !== undefined && item.start <= time).sort((left, right) => left.start - right.start);
        const selected = candidates.at(-1);
        if (!selected) {
          if (record.applied) { writeTransform(record.source, record.base); record.applied = false; record.attached = false; record.terminal = ""; navigationChanged.add(record.id); animating = true; }
        } else {
          const { clip, start } = selected;
          const attached = clip.kind === "attach";
          if (clip.kind === "transform") transform(record, clip, getPerformanceClipSourceTime(clip, time - start));
          else {
            const evidence = contacts.get(clipKey(record.track.id, clip.id));
            if (clip.bone && !(evidence && evidence.time <= time)) {
              if (!allowContact) continue;
              if (time > start + getPerformanceClipDuration(clip) + 0.00001) { record.error ||= "拾取片段已结束，尚未验证手与道具接触；请调整站位、动作和触发延迟。"; continue; }
            }
            if (!attach(record, clip, getPerformanceClipSourceTime(clip, time - start), time)) continue;
          }
          notify(record.track.id, clip.id, attached ? contacts.get(clipKey(record.track.id, clip.id))?.time ?? time : start);
          record.applied = true;
          const terminal = attached || time >= start + getPerformanceClipDuration(clip) ? clip.id + ":" + start : "";
          animating ||= attached || !terminal || record.terminal !== terminal;
          if (terminal && record.terminal !== terminal || record.attached !== attached) navigationChanged.add(record.id);
          record.terminal = terminal; record.attached = attached;
        }
        for (const clip of getPerformanceClips(record.track, object)) if (clip.kind === "effect" && clip.enabled !== false) {
          const start = startTime(record, clip);
          if (start !== undefined && start <= time) notify(record.track.id, clip.id, start);
        }
      }
      if (starts.size === count) break;
    }
    const samples: PerformanceEffectSample[] = [];
    for (const record of records.values()) {
      if (!record.ready) continue;
      const object = document.objects.find(object => object.id === record.id)!;
      for (const clip of getPerformanceClips(record.track, object)) {
        if (clip.kind !== "effect" || clip.enabled === false) continue;
        const start = startTime(record, clip);
        if (start === undefined || start > time) continue;
        samples.push({ key: clipKey(record.track.id, clip.id), source: record.source, revision: record.signature, clip, time: getPerformanceClipSourceTime(clip, time - start), ground: (x, z) => getTerrainHeight(document?.terrain, x, z), ...(clip.effect === "explosion" ? { origin: effectOrigin(record, start) } : {}) });
      }
    }
    const effectAnimation = effects.render(samples);
    const effectWarnings = effects.getWarnings();
    const warningsBySource = new Map<Object3D, string[]>();
    for (const sample of samples) {
      const warning = effectWarnings.get(sample.key);
      if (!warning) continue;
      const messages = warningsBySource.get(sample.source) ?? [];
      messages.push(warning);
      warningsBySource.set(sample.source, messages);
    }
    for (const record of records.values()) {
      const warning = [record.poseError, ...(warningsBySource.get(record.source) ?? [])].filter(Boolean).join("；") || undefined;
      if (!record.error || record.error === record.effectError) record.error = warning;
      record.effectError = warning;
    }
    animating ||= effectAnimation;
    return navigationChanged;
  }
  function snapshot(): WorldObjectSnapshot {
    return { playing, starts: [...starts], contactSignature, contacts: structuredClone([...contacts]), attempts: structuredClone([...attempts]), objects: [...records].map(([id, record]) => ({ id, transform: readTransform(record.source), applied: record.applied, terminal: record.terminal, attached: record.attached, ready: record.ready, scheduledAt: record.scheduledAt, error: record.error, visual: record.visual?.snapshot(), poseKey: record.poseKey, poseTime: record.poseTime })) };
  }
  function restore(value: WorldObjectSnapshot) {
    if (value.contactSignature !== contactSignature) return false;
    effects.reset();
    starts.clear(); for (const [key, time] of value.starts) starts.set(key, time);
    playing = value.playing;
    contacts.clear(); attempts.clear();
    if (value.contactSignature === contactSignature) {
      for (const [key, contact] of value.contacts ?? []) contacts.set(key, structuredClone(contact));
      for (const [key, attempt] of value.attempts ?? []) attempts.set(key, structuredClone(attempt));
    }
    for (const saved of value.objects) {
      const record = records.get(saved.id);
      if (!record) continue;
      writeTransform(record.source, saved.transform); record.applied = saved.applied; record.terminal = saved.terminal; record.attached = saved.attached; record.ready = saved.ready ?? value.playing; record.scheduledAt = saved.scheduledAt; record.error = saved.error;
      restorePose(record, saved.visual ?? record.visualBase);
      record.poseKey = saved.poseKey; record.poseTime = saved.poseTime;
    }
    return true;
  }
  function duration() {
    let end = 0;
    if (document) for (const record of records.values()) {
      const object = document.objects.find(object => object.id === record.id)!;
      for (const clip of getPerformanceClips(record.track, object)) if (clip.enabled !== false) end = Math.max(end, (startTime(record, clip) ?? (record.scheduledAt ?? 0) + clip.start) + getPerformanceClipDuration(clip));
    }
    return end;
  }
  function getStatus(time: number) {
    return [...records.values()].map(record => {
      const object = document!.objects.find(object => object.id === record.id)!;
      const clips = getPerformanceClips(record.track, object).filter(clip => clip.enabled !== false);
      const samples = clips.map(clip => ({ clip, start: startTime(record, clip) }));
      const current = samples.filter(sample => sample.start !== undefined && sample.start <= time && time < sample.start + getPerformanceClipDuration(sample.clip)).sort((a, b) => a.start! - b.start!).at(-1);
      const completed = playing && record.ready && !record.error && samples.length > 0 && samples.every(sample => sample.start !== undefined && time >= sample.start + getPerformanceClipDuration(sample.clip));
      const activity = record.error ? "演绎未执行" : !playing || !record.ready ? "等待播放" : completed ? record.attached ? "已附着" : "已完成" : current && time < current.start! + getPerformanceClipDuration(current.clip) ? "播放中 · " + current.clip.name : samples.some(sample => sample.start === undefined) ? "等待主体片段触发" : "等待世界时刻";
      return { id: record.track.id, name: record.track.name ?? object.name, count: 1, requested: 1, startTime: record.scheduledAt, completed, activity, ...(record.error ? { blocked: record.error } : {}) };
    });
  }
  function getClipStatuses(time: number) {
    return [...records.values()].flatMap(record => getPerformanceClips(record.track, document!.objects.find(object => object.id === record.id)!).filter(clip => clip.enabled !== false).map(clip => {
      const scheduledStart = startTime(record, clip);
      const end = scheduledStart === undefined ? undefined : scheduledStart + getPerformanceClipDuration(clip);
      const triggeredAt = clip.trigger ? starts.get(clipKey(clip.trigger.trackId, clip.trigger.clipId)) : undefined;
      const state: "waitingTrigger" | "scheduled" | "playing" | "completed" | "blocked" = scheduledStart === undefined ? "waitingTrigger" : !playing || !record.ready || time < scheduledStart ? "scheduled" : record.error ? "blocked" : time >= end! ? "completed" : "playing";
      const key = clipKey(record.track.id, clip.id);
      return { trackId: record.track.id, objectId: record.id, clipId: clip.id, kind: clip.kind, trigger: clip.trigger, triggeredAt, scheduledStart, end, state, firstAttempt: attempts.get(key)?.first && structuredClone(attempts.get(key)!.first), lastAttempt: attempts.get(key)?.last && structuredClone(attempts.get(key)!.last), contact: contacts.get(key) && structuredClone(contacts.get(key)!) };
    }));
  }
  function getContactRequests(time: number) {
    return [...records.values()].flatMap(record => getPerformanceClips(record.track, document!.objects.find(object => object.id === record.id)!).flatMap(clip => {
      const start = startTime(record, clip), contact = contacts.get(clipKey(record.track.id, clip.id));
      return clip.enabled !== false && clip.kind === "attach" && clip.bone && start !== undefined && start <= time && !(contact && contact.time <= time) ? [{ trackId: record.track.id, clipId: clip.id, start, end: Math.min(time, start + getPerformanceClipDuration(clip)) }] : [];
    })).sort((left, right) => left.start - right.start);
  }
  return { sync, setClock, reschedule, notify, render, reset, snapshot, restore, duration, getStatus, getClipStatuses, getContactRequests, isAnimating: () => { const changed = animating; animating = false; return changed; }, getErrors: () => [...records.values()].filter(record => record.error).map(record => ({ id: record.track.id, name: record.track.name, message: record.error! })), getMovingIds: () => new Set([...records].filter(([, record]) => record.applied && !record.attached && !record.terminal).map(([id]) => id)), getClipStart: (trackId: string, clipId: string) => starts.get(clipKey(trackId, clipId)), getObjectIds: () => new Set(records.keys()), getAttachedIds: () => new Set([...records].filter(([, record]) => record.attached).map(([id]) => id)), dispose: () => { reset(); effects.dispose(); for (const record of records.values()) record.visual?.dispose(); records.clear(); orderedRecords = []; sources = new Map(); document = undefined; } };
}

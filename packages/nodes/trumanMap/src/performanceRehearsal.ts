import { Box3, Group, InstancedMesh, LoadingManager, MathUtils, Mesh, Scene, Vector3 } from "three";
import type { Material, Object3D } from "three";
import { resolveAssetModel } from "./assetModelResolver";
import { parseGltfModel } from "./gltfModelLoader";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";
import { getSceneLife } from "./lifeDocument";
import { createModelGroup, modelPartBatches, type ModelDefinition } from "./modelGeometry";
import { getPerformanceClips } from "./performanceClips";
import { getPerformanceSubjectIds, getPerformanceTracks, maxRehearsalTracks, validatePerformanceReferences } from "./performanceDocument";
import { createCollisionShape, measureCollisionBounds, transformCollisionShape } from "./sceneCollision";
import { disposeObject, retainMeshGeometry } from "./sceneResources";
import { applySceneObjectPlacement, createAssetModelContent, createPrimitive } from "./sceneViewport";
import type { SceneAsset, SceneDocument, Vector3Value } from "./sceneDocument";
import { parseSceneDocument } from "./sceneValidation";
import { createWorldLife } from "./worldLife";
import { prebuildNavTiles, yieldToMain } from "./worldLifeNavTiles";
import { getSceneTime } from "./worldTime";

export type PerformanceRehearsalOptions = {
  trackIds?: string[];
  maxSeconds?: number;
  signal?: AbortSignal;
  terrainObstacles?: { min: Vector3Value; max: Vector3Value }[];
};

// ACT: 程序化模型和编辑器视口用同一套装配：重复部件合批成实例网格，按造型定义缓存模板、每次预演只克隆。
// 几何和视口逐顶点一致，预演才能直接用视口已经算好的导航块；也省掉每次预演重建全场模型的时间。
const modelTemplates = new Map<ModelDefinition, { model: Group; bounds: Box3 }>();
function createRehearsalModel(asset: SceneAsset, definition: ModelDefinition) {
  const reusable = !asset.model;
  let template = reusable ? modelTemplates.get(definition) : undefined;
  if (template) { modelTemplates.delete(definition); modelTemplates.set(definition, template); }
  else {
    const model = createModelGroup(definition, undefined, true);
    template = { model, bounds: measureCollisionBounds(model, new Box3()) };
    if (reusable) {
      model.traverse(child => { if (child instanceof Mesh) retainMeshGeometry(child); });
      modelTemplates.set(definition, template);
      if (modelTemplates.size > 32) {
        const oldest = modelTemplates.keys().next().value!;
        disposeObject(modelTemplates.get(oldest)!.model);
        modelTemplates.delete(oldest);
      }
    }
  }
  if (!reusable) return createAssetModelContent(asset, template.model, template.bounds);
  const model = template.model.clone(true);
  const materials = new Map<Material, Material>();
  model.traverse(child => {
    if (!(child instanceof Mesh)) return;
    retainMeshGeometry(child);
    if (child instanceof InstancedMesh) modelPartBatches.add(child);
    const source = child.material as Material;
    if (!materials.has(source)) materials.set(source, source.clone());
    child.material = materials.get(source)!;
  });
  return createAssetModelContent(asset, model, template.bounds);
}

// ACT: GLB 模型按文件内容缓冲区缓存解析结果（调用方一轮里对同一文件返回同一个缓冲区）：一轮要预演好几次，原来每次都重新解析。
// 每次预演克隆一份（带骨骼的用 SkeletonUtils 克隆，几何共享并登记引用，材质各自一份），预演结束只释放克隆。
const gltfTemplates = new Map<ArrayBuffer, Promise<Group>>();
async function rehearsalGltf(bytes: ArrayBuffer, name: string, signal: AbortSignal) {
  let pending = gltfTemplates.get(bytes);
  if (pending) { gltfTemplates.delete(bytes); gltfTemplates.set(bytes, pending); }
  else {
    pending = (async () => {
      const manager = new LoadingManager();
      let resourceFailed = false;
      manager.onError = () => { resourceFailed = true; };
      const model = await parseGltfModel(bytes, manager, signal);
      for (const extra of model.scenes) if (extra !== model.scene) disposeObject(extra);
      if (resourceFailed) { disposeObject(model.scene); throw new Error("预演模型贴图载入失败：" + name); }
      model.scene.animations = model.animations;
      model.scene.traverse(child => { if (child instanceof Mesh) retainMeshGeometry(child); });
      return model.scene;
    })();
    gltfTemplates.set(bytes, pending);
    pending.catch(() => gltfTemplates.delete(bytes));
    while (gltfTemplates.size > 24) {
      const [oldest, template] = gltfTemplates.entries().next().value!;
      gltfTemplates.delete(oldest);
      void template.then(disposeObject, () => {});
    }
  }
  const template = await pending;
  signal.throwIfAborted();
  const copy = cloneSkinned(template) as Group;
  copy.animations = template.animations;
  copy.traverse(child => {
    if (!(child instanceof Mesh)) return;
    retainMeshGeometry(child);
    child.material = Array.isArray(child.material) ? child.material.map(material => material.clone()) : child.material.clone();
  });
  return copy;
}

function selectTracks(document: SceneDocument, ids?: string[]) {
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups).filter(track => track.enabled !== false && document.objects.some(object => object.id === track.objectId && object.visible));
  const selected = new Set(ids ?? tracks.map(track => track.id));
  if ([...selected].some(id => !tracks.some(track => track.id === id))) throw new Error("预演主体不存在、已停用或不可见，请重新读取当前轨道");
  const byObject = new Map(tracks.map(track => [track.objectId, track.id]));
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const track of tracks) {
      const object = document.objects.find(object => object.id === track.objectId)!;
      for (const clip of getPerformanceClips(track, object)) {
        if (clip.enabled === false) continue;
        const related = [clip.trigger?.trackId, clip.kind === "attach" ? byObject.get(clip.targetId) : clip.kind === "pose" && clip.target ? byObject.get(clip.target) : undefined].filter((id): id is string => !!id);
        if (!selected.has(track.id) && !related.some(id => selected.has(id))) continue;
        for (const id of [track.id, ...related]) if (!selected.has(id)) { selected.add(id); expanded = true; }
      }
    }
  }
  // 单次预演上限：交互依赖闭包可能比请求多几条，留出余量；更多轨道由调用方分批。
  if (!selected.size || selected.size > maxRehearsalTracks + 20) throw new Error(`预演须包含1至${maxRehearsalTracks + 20}条启用轨道，交互依赖也计入；请分批限定trackIds`);
  return tracks.filter(track => selected.has(track.id));
}

function readTransform(group: Object3D) {
  return {
    position: { x: group.position.x, y: group.position.y, z: group.position.z },
    rotation: { x: MathUtils.radToDeg(group.rotation.x), y: MathUtils.radToDeg(group.rotation.y), z: MathUtils.radToDeg(group.rotation.z) },
    scale: { x: group.scale.x, y: group.scale.y, z: group.scale.z },
  };
}

function readBones(group: Object3D) {
  const result: Record<string, Vector3Value> = {};
  const names = new Set(["hips", "chest", "head", "leftShin", "rightShin", "leftHand", "rightHand", "leftFingers", "rightFingers", "leftFoot", "rightFoot"]);
  group.traverse(node => {
    if (node.type !== "Bone" || !names.has(node.name)) return;
    const point = node.getWorldPosition(new Vector3());
    result[node.name] = { x: point.x, y: point.y, z: point.z };
  });
  return result;
}

// ACT: 预演复用生产装配和WorldLife，0.1秒离散采样；不提供逐帧物理或视觉批准。
export async function rehearsePerformance(document: SceneDocument, loadModel: (asset: SceneAsset, signal?: AbortSignal) => Promise<ArrayBuffer>, options: PerformanceRehearsalOptions = {}) {
  const maxSeconds = options.maxSeconds ?? 90;
  if (!Number.isFinite(maxSeconds) || maxSeconds < 0.1 || maxSeconds > 120) throw new Error("预演时长须为0.1至120秒");
  const draft = parseSceneDocument(structuredClone(document));
  const tracks = selectTracks(draft, options.trackIds);
  validatePerformanceReferences(tracks, draft.objects, draft.objectGroups);
  const needsNavigation = tracks.some(track => track.controller !== "object");
  const requiredObjects = new Set(tracks.map(track => track.objectId));
  for (const track of tracks) for (const clip of track.clips ?? []) {
    if (clip.enabled === false) continue;
    if (clip.kind === "attach") requiredObjects.add(clip.targetId);
    else if (clip.kind === "pose" && clip.target) requiredObjects.add(clip.target);
  }
  draft.life = { ...getSceneLife(draft.life), enabled: true, running: true, tracks };
  const scene = new Scene();
  const sources = new Map<string, Group>();
  const initial = new Map<string, ReturnType<typeof readTransform>>();
  let life = createWorldLife(scene);
  // ACT: 预演在主线程上算，装配、导航网格、模拟都按约20毫秒一片让出主线程，界面和AI对话不再整段卡死；
  // 片太短时大场景每次让出都要渲染一帧，预演一大半时间在等渲染（2026-11-16 村子场景超过30秒预算）。
  let sliceStart = performance.now();
  const breathe = async () => {
    if (performance.now() - sliceStart < 20) return;
    await yieldToMain();
    sliceStart = performance.now();
  };
  const controller = new AbortController();
  const signal = options.signal ? AbortSignal.any([options.signal, controller.signal]) : controller.signal;
  const budget = 30000 + Math.max(0, tracks.length - 12) * 500;
  // ACT: 预算到了就停在已经算到的时刻、交回这段的结果（大村子、几百秒的戏常常跑不完），不再整份报错；
  // 只有装配和导航网格本身就拖到两倍预算、一帧都没算出来时才算失败。
  const timer = setTimeout(() => controller.abort(new Error(`预演实际计算超过${Math.round(budget * 2 / 1000)}秒，场景装配和导航网格都没算完`)), budget * 2);
  const startedAt = performance.now();
  const contacts: {
    trackId: string; clipId: string; propObjectId: string; targetId: string; bone: string;
    body: ReturnType<typeof transformCollisionShape>;
    closest?: { time: number; distance: number; bonePosition: Vector3Value; actor: ReturnType<typeof readTransform> };
  }[] = [];
  const completedAt = new Map<string, number>();
  const firstBlocked = new Map<string, { time: number; reason: string }>();
  let seconds = 0;
  let samples = 0;
  let stopReason = "simulationBudget";
  let failure: string | undefined;
  let status: ReturnType<typeof life.getStatus> | undefined;
  const time = getSceneTime(draft);
  const worldStart = Date.parse(time.date + "T00:00:00Z") / 1000 + time.hour * 3600;
  try {
    for (const object of draft.objects) {
      // ACT: 无导航的根附着不检查进门通路，仅加载真实主体与引用目标，避免车内摆位等待整场资产。
      if (!object.visible || !needsNavigation && !requiredObjects.has(object.id)) continue;
      signal.throwIfAborted();
      const group = new Group();
      scene.add(group);
      sources.set(object.id, group);
      let content: Group;
      if (object.asset.kind === "primitive") content = createPrimitive(object.asset, object.color);
      else if (!object.asset.path && (object.asset.model || object.asset.recipe || object.asset.blueprint)) {
        const model = resolveAssetModel(object.asset);
        if (!model) throw new Error("预演素材缺少可用模型定义：" + object.name);
        content = createRehearsalModel(object.asset, model);
      } else {
        const bytes = await loadModel(object.asset, signal);
        signal.throwIfAborted();
        content = createAssetModelContent(object.asset, await rehearsalGltf(bytes, object.name, signal));
      }
      group.add(content);
      applySceneObjectPlacement(group, object, draft.terrain);
      initial.set(object.id, readTransform(group));
      await breathe();
    }
    signal.throwIfAborted();
    scene.updateMatrixWorld(true);
    const moving = new Set(tracks.flatMap(track => [...getPerformanceSubjectIds(track, tracks, draft.objectGroups)]));
    const terrainObstacles = (options.terrainObstacles ?? []).map(value => {
      const coordinates = [value.min.x, value.min.y, value.min.z, value.max.x, value.max.y, value.max.z];
      if (!coordinates.every(Number.isFinite) || value.min.x > value.max.x || value.min.y > value.max.y || value.min.z > value.max.z) throw new Error("预演地形障碍包围体无效");
      return new Box3(new Vector3(value.min.x, value.min.y, value.min.z), new Vector3(value.max.x, value.max.y, value.max.z));
    });
    const obstacles = [...terrainObstacles];
    for (const object of draft.objects) {
      const source = sources.get(object.id);
      if (!source || object.navigation || moving.has(object.id)) continue;
      obstacles.push(...transformCollisionShape(createCollisionShape(source), source.matrixWorld).parts.map(part => part.bounds));
    }
    for (const track of tracks) for (const clip of track.clips ?? []) {
      if (clip.enabled === false || clip.kind !== "attach" || !clip.bone) continue;
      const prop = sources.get(track.objectId);
      if (prop) contacts.push({ trackId: track.id, clipId: clip.id, propObjectId: track.objectId, targetId: clip.targetId, bone: clip.bone, body: transformCollisionShape(createCollisionShape(prop), prop.matrixWorld) });
    }
    await breathe();
    // 导航网格缺的块先分片补算；有补算时试跑的那次同步里网格是空的，换一个新的WorldLife重新同步（此时全部命中缓存）。
    if (await prebuildNavTiles(() => life.sync(draft, obstacles, sources, terrainObstacles), signal)) {
      life.dispose();
      life = createWorldLife(scene);
      life.sync(draft, obstacles, sources, terrainObstacles);
    }
    sliceStart = performance.now();
    scene.updateMatrixWorld(true);
    life.animate(0, false, worldStart);
    const nearest = new Vector3();
    for (let step = 0; step <= Math.ceil(maxSeconds * 10); step++) {
      signal.throwIfAborted();
      if (samples && performance.now() - startedAt > budget) { stopReason = "wallTimeBudget"; break; }
      seconds = Math.min(maxSeconds, step / 10);
      if (step) life.animate(seconds, false, worldStart + seconds);
      scene.updateMatrixWorld(true);
      samples++;
      for (const contact of contacts) {
        const actor = sources.get(contact.targetId);
        const bone = actor?.getObjectByName(contact.bone);
        if (!actor || bone?.type !== "Bone") continue;
        const point = bone.getWorldPosition(new Vector3());
        const distance = contact.body.parts.reduce((minimum, part) => Math.min(minimum, part.obb.clampPoint(point, nearest).distanceTo(point)), Infinity);
        if (Number.isFinite(distance) && (!contact.closest || distance < contact.closest.distance)) contact.closest = {
          time: seconds, distance, bonePosition: { x: point.x, y: point.y, z: point.z }, actor: readTransform(actor),
        };
      }
      status = life.getStatus();
      for (const group of status.groups ?? []) {
        if (group.completed && !completedAt.has(group.id)) completedAt.set(group.id, seconds);
        if (group.blocked && !firstBlocked.has(group.id)) firstBlocked.set(group.id, { time: seconds, reason: group.blocked });
      }
      if (status.groups?.length === tracks.length && status.groups.every(group => group.completed)) { stopReason = "completed"; break; }
      if (status.groups?.length === tracks.length && status.groups.every(group => group.completed || group.blocked) && seconds >= (status.playbackRange?.end ?? worldStart) - worldStart) { stopReason = "blocked"; break; }
      await breathe();
    }
  } catch (error) {
    stopReason = options.signal?.aborted ? "cancelled" : controller.signal.aborted ? "wallTimeBudget" : "error";
    failure = error instanceof Error ? error.message : String(error);
  } finally {
    clearTimeout(timer);
    // 在恢复借用姿态前读取结果；dispose只释放本次独立创建的资源。
  }
  try {
    const groups = status?.groups ?? [];
    const clipStatuses = life.getClipStatuses().map(value => ({ ...value, relativeDelay: tracks.find(track => track.id === value.trackId)?.clips?.find(clip => clip.id === value.clipId)?.start }));
    return {
      runtimeVerified: samples > 0,
      visuallyApproved: false,
      allCompleted: stopReason === "completed",
      stopReason,
      message: status?.message,
      ...(failure ? { error: failure } : {}),
      sampledRange: { from: 0, to: seconds, worldStart, worldEnd: worldStart + seconds, stepSeconds: 0.1, samples, maxSeconds, wallMilliseconds: performance.now() - startedAt },
      geometryScope: needsNavigation ? "导航预演加载全部可见场景" : "直接控制仅加载片段主体及引用目标；不校验穿过车身或其他环境的路径",
      tracks: tracks.map(track => {
        const source = sources.get(track.objectId);
        const group = groups.find(group => group.id === track.id);
        const pending = clipStatuses.filter(clip => clip.trackId === track.id && clip.state !== "completed");
        return { trackId: track.id, objectId: track.objectId, name: track.name, controller: track.controller ?? "actor", completed: group?.completed ?? false, requested: group?.requested, count: group?.count, ...(completedAt.has(track.id) ? { completedAt: completedAt.get(track.id) } : {}), activity: group?.activity, blocked: group?.blocked, firstBlocked: firstBlocked.get(track.id), pendingClips: pending.slice(0, 3), pendingClipCount: pending.length, initial: initial.get(track.objectId), final: source ? readTransform(source) : undefined, ...(source && (track.controller !== "object" || draft.objects.find(object => object.id === track.objectId)?.asset.shape === "riggedPerson") ? { bones: readBones(source) } : {}) };
      }),
      attachments: tracks.flatMap(track => {
        const source = sources.get(track.objectId);
        const current = (track.clips ?? []).filter(clip => clip.enabled !== false && clip.kind === "attach").map(clip => ({ clip, execution: clipStatuses.find(status => status.trackId === track.id && status.clipId === clip.id) })).filter(value => value.execution?.scheduledStart !== undefined && value.execution.scheduledStart <= seconds).sort((left, right) => left.execution!.scheduledStart! - right.execution!.scheduledStart!).at(-1);
        if (!source || !current || current.clip.kind !== "attach" || current.clip.bone) return [];
        const target = sources.get(current.clip.targetId);
        if (!target) return [];
        target.updateWorldMatrix(true, false);
        const local = target.worldToLocal(source.getWorldPosition(new Vector3()));
        const expected = new Vector3(...(current.clip.position ?? [0, 0, 0]));
        const hips = source.getObjectByName("hips");
        return [{ trackId: track.id, clipId: current.clip.id, objectId: track.objectId, targetId: current.clip.targetId, targetLocalPosition: local.toArray(), expectedLocalPosition: expected.toArray(), offsetErrorMetres: local.distanceTo(expected), ...(hips?.type === "Bone" ? { hipsTargetLocal: target.worldToLocal(hips.getWorldPosition(new Vector3())).toArray() } : {}), note: "根与髋骨在目标局部坐标中的实际采样，可对照真实座垫位置；不等于已验证座椅接触或车内穿插。" }];
      }),
      contacts: contacts.map(({ body, ...contact }) => ({ ...contact, execution: clipStatuses.find(clip => clip.trackId === contact.trackId && clip.clipId === contact.clipId), withinInitialPropTolerance: (contact.closest?.distance ?? Infinity) <= 0.35, toleranceMetres: 0.35, initialPropBounds: { min: { x: body.bounds.min.x, y: body.bounds.min.y, z: body.bounds.min.z }, max: { x: body.bounds.max.x, y: body.bounds.max.y, z: body.bounds.max.z } } })),
      limitations: "生产WorldLife按0.1秒采样的独立CPU预演，保留实际资产/摆放/地形及传入树木障碍；未渲染图片、未模拟编辑器松手后的重力沉降、不是逐帧完整物理验收。contacts测骨点到道具初态各真实mesh OBB，初态固定，不能替代运行时对当前道具的附着接触判定；Hand为掌骨，Fingers为指骨。world time暂停/倍率不限制此独立预演，定时startAt仍按原世界时钟排期。",
    };
  } finally {
    life.dispose();
    disposeObject(scene);
    scene.clear();
  }
}

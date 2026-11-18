import { Box3, Euler, Group, InstancedMesh, MathUtils, Matrix3, Matrix4, Mesh, Quaternion, Ray, Raycaster, Vector3 } from "three";
import type { Object3D, Scene } from "three";
import { CompositeGoal, GameEntity, Goal, State, StateMachine } from "yuka";
import { DEFAULT_QUERY_FILTER, FindNodePathResultFlags, FindStraightPathOptions, FindStraightPathResultFlags, createFindNearestPolyResult, createGetClosestPointOnPolyResult, getClosestPointOnPoly, queryPolygons, findNearestPoly, findNodePath, findStraightPath, findRandomPoint, findRandomPointAroundCircle } from "navcat";
import type { NavMesh } from "navcat";
import { crowd } from "navcat/blocks";
import { getSceneLife } from "./lifeDocument";
import { compilePerformanceTracks, getPerformanceObjectIds, getPerformanceTracks, type PerformanceTrack } from "./performanceDocument";
import { getPerformanceClips, materializePerformanceTrack } from "./performanceClips";
import { createWorldObjectAnimation, type WorldObjectSnapshot } from "./worldObjectAnimation";
import type { LifeActivity, LifeAnchor, LifeGroup, LifePlan, LifeStatus } from "./lifeDocument";
import type { SceneDocument, SceneObject } from "./sceneDocument";
import { buildLifeNavMesh, buildLifeRoads, invalidateLifeNavigationGeometry, isLifeBodyMovementClear, lifeRoadPoint } from "./worldLifeNavigation";
import type { LifeNavigationGeometry, LifeNavigationProfile } from "./worldLifeNavigation";
import { buildNavTiles, collectMissingNavTiles } from "./worldLifeNavTiles";
import { createLifeObject, type LifeAction, type LifeVisual } from "./lifeObjectVisual";
import { getCharacterAnimation } from "./characterAnimations";
import { getTerrainHeight } from "./terrainModel";
import { createCollisionIndex, createCollisionShape } from "./sceneCollision";
import { intersectSupportObjects } from "./supportRaycast";

type LifeRandom = (() => number) & { state: number };
type LifeRegion = { key: string; navMesh: NavMesh | undefined; simulation: crowd.Crowd; proxies: Map<string, string>; center: Vector3; radius: number; failure: string };
type LifeRoads = ReturnType<typeof buildLifeRoads>;
type LifeEvent = NonNullable<LifeActivity["on"]>[number]["event"];
type LifeGoal = Goal<LifeMind> & { node: number };
type LifeActivityState = { step: number; leg: number; phase: "travel" | "dwell" | "blocked" | "done"; until: number; retryAt: number; blocked: string; slot: number; goal?: Vector3; roadPath: number[]; roadCursor: number; roadGoalEdge: number; roadGoalDistance: number; checked: boolean; loopCount: number; originClip?: string; segmentPoint?: number; segmentLoop?: number; segmentLength?: number; waiting?: boolean; targetNear?: boolean; transferredAt: number; pending?: LifeEvent };
type ActivitySnapshot = Omit<LifeActivityState, "goal"> & { goal?: number[]; tree?: { status: string; nodes: { node: number; status: string }[] } };
type LifeMind = GameEntity & { actor: LifeActor; machine: StateMachine<LifeMind>; random: LifeRandom; until: number; senseAt: number; repathAt: number; target?: Vector3; threat?: Vector3; patrol: number; tree?: CompositeGoal<LifeMind> };
type LifeSite = { point: Vector3; road?: { edge: number; distance: number; point: Vector3 }; nearest?: ReturnType<typeof findNearestPoly> };
type SeekLeg = { point: number; site?: LifeSite; path: Vector3[]; length: number; seconds: number; hold: number; sideways?: boolean; traversal?: { fromDistance: number; toDistance: number; state: LocalTraversal } };
type SeekPlan = { group: LifeGroup; signature: string; origin: Vector3; heading: number; legs: SeekLeg[]; duration: number; cycle: number; blocked: boolean };
type EditTransform = { position: Vector3; quaternion: Quaternion; scale: Vector3; signature: string };
type LifeMember = { objectId: string; signature: string; visual: LifeVisual; editTransform: EditTransform; relative: Matrix4; repositioned?: boolean };
type LifeBodyShape = { bounds: Box3; footprint: Box3; tilt: Quaternion; heading: number; radius: number; height: number; profile: LifeNavigationProfile };
type GroundDisplay = { height: number; target: number; time: number };
type LocalTraversal = { kind: "jump" | "climb" | "vault" | "leap"; phase: "approach" | "flight"; path: [number, number, number][]; start: number; duration: number; heading: number };
type LifeActor = { seekPlan?: SeekPlan; groundDisplay?: GroundDisplay; traversal?: LocalTraversal; sideways?: boolean; id: string; objectId: string; index: number; group: LifeGroup; track: PerformanceTrack; signature: string; bindingSignature: string; primarySignature: string; worldMatrix: Matrix4; visual: LifeVisual; members: LifeMember[]; editTransform: EditTransform; tilt: Quaternion; bodyOffset: Vector3; baseOffset: number; initialPoint?: Vector3; radius: number; height: number; region?: string; agentId?: string; roadEdge: number; roadDistance: number; roadSpeed: number; scheduledAt?: number; started: boolean; previous: Vector3; current: Vector3; velocity: Vector3; speed: number; heading: number; mind: LifeMind; activity?: LifeActivityState };
type ActorSnapshot = { id: string; index: number; groupId: string; signature: string; sideways?: boolean; groundDisplay?: GroundDisplay; traversal?: LocalTraversal; radius: number; height: number; region?: string; agentId?: string; roadEdge: number; roadDistance: number; roadSpeed: number; scheduledAt?: number; started: boolean; initialPoint?: number[]; previous: number[]; current: number[]; velocity: number[]; speed: number; heading: number; state: string; random: number; until: number; senseAt: number; repathAt: number; target?: number[]; threat?: number[]; patrol: number; activity?: ActivitySnapshot; visual: ReturnType<LifeVisual["snapshot"]>; members?: { objectId: string; visual: ReturnType<LifeVisual["snapshot"]> }[] };
export type WorldLifeSnapshot = { signature: string; settingsSignature: string; regions: { key: string; navMesh?: NavMesh; simulation: crowd.Crowd; proxies: [string, string][] }[]; actors: ActorSnapshot[]; objectAnimation?: WorldObjectSnapshot; targetTime: number; steppedTime: number; lastWorldClock: number | undefined };
export type PerformanceActorObject = { trackId: string; objectId?: string; group: Group };

function createLifeRandom(seed: number) {
  const random = (() => {
    random.state = random.state + 0x6d2b79f5 | 0;
    let value = Math.imul(random.state ^ random.state >>> 15, 1 | random.state);
    value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  }) as LifeRandom;
  random.state = seed >>> 0;
  return random;
}

function hashGroup(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function cloneLifeState<T>(value: T, seen = new Map<object, unknown>()): T {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    const output = structuredClone(value);
    seen.set(value, output);
    return output;
  }
  const output: unknown = Array.isArray(value) ? [] : {};
  seen.set(value, output);
  for (const [key, child] of Object.entries(value)) (output as Record<string, unknown>)[key] = cloneLifeState(child, seen);
  return output as T;
}

// 障碍盒按部件给出（大建筑上千个），结构签名只取数值哈希，不再把每个盒序列化成 JSON。
const signatureView = new Float64Array(1);
const signatureWords = new Uint32Array(signatureView.buffer);
function boxesSignature(boxes: readonly Box3[]) {
  let first = 2166136261, second = 0x9e3779b9;
  for (const box of boxes) for (const value of [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z]) {
    signatureView[0] = value;
    for (const word of signatureWords) { first = Math.imul(first ^ word, 16777619); second = Math.imul(second + word | 0, 2246822519) ^ (second >>> 13); }
  }
  return `${boxes.length}/${first >>> 0}/${second >>> 0}`;
}

export function createWorldLife(scene: Scene) {
  const objectAnimation = createWorldObjectAnimation(scene);
  let settings = getSceneLife();
  let document: SceneDocument | undefined;
  let templates = new Map<string, Object3D>();
  let skeletalObjectIds = new Set<string>();
  // 胶囊人（头、身子、腿三段关节）也能播骨骼动作；导航上的特殊走法（侧身、蹲行、翻越）仍只给骨骼人物。
  let capsuleObjectIds = new Set<string>();
  let obstacles: Box3[] = [];
  let navigationGeometry: LifeNavigationGeometry = { models: [], boxes: [] };
  const supportIndex = createCollisionIndex();
  const supportModels = new Map<string, Object3D>();
  const supportCache = new Map<string, { x: number; y: number; z: number; height: number }>();
  const supportRay = new Raycaster();
  const leapRay = new Raycaster();
  const supportBounds = new Box3();
  const supportNormal = new Vector3();
  const supportMatrix = new Matrix4();
  const supportNormalMatrix = new Matrix3();
  const sidePoses = new WeakMap<Group, { bone: Object3D; quaternion: Quaternion; position: Vector3 }[]>();
  let supportSignature = "";
  let objectNavigationSignature = "";
  let samplingSeekContacts = false;
  const bodyShapes = new Map<string, { signature: string; shape: LifeBodyShape }>();
  const regions = new Map<string, LifeRegion>();
  const roadNetworks = new Map<string, LifeRoads>();
  const roadSignatures = new Map<string, string>();
  const sharedRoadNetworks = new Map<string, LifeRoads>();
  const roadPathCache = new WeakMap<LifeRoads, Map<string, number[] | undefined>>();
  const routePlans = new Map<string, LifePlan>();
  const anchorCache = new Map<string, Vector3 | undefined>();
  const siteCache = new Map<string, LifeSite | undefined>();
  let spatialSignature = "";
  let siteSignature = "";
  const shapeSignatures = new Map<string, string>();
  const bindingSignatures = new Map<string, string>();
  const groupMessages = new Map<string, string>();
  let actors: LifeActor[] = [];
  let performanceTracks = new Map<string, PerformanceTrack>();
  let rawPerformanceTracks: PerformanceTrack[] = [];
  let trackMembers = new Map<string, string[]>();
  let actorObjects: PerformanceActorObject[] = [];
  const activeObjectIds = new Set<string>();
  const objectActors = new Map<string, LifeActor>();
  const stoppedProgress = new Map<string, { points: PerformanceTrack["points"]; point: number; loopCount: number; initialPoint?: Vector3; current?: Vector3; previous?: Vector3; heading?: number; speed?: number; startAt?: number; scheduledAt?: number; started: boolean }>();
  let structuralSignature = "";
  let targetTime = 0;
  let steppedTime = 0;
  let lastWorldClock: number | undefined;
  let disposed = false;
  const fixedStep = 1 / 20;
  const states = ["idle", "move", "alert", "flee"] as const;
  const direction = new Vector3();
  const destination = new Vector3();
  const up = new Vector3(0, 1, 0);
  const pitchAxis = new Vector3(1, 0, 0);
  const rotation = new Quaternion();
  const parentRotation = new Quaternion();
  const memberMatrix = new Matrix4();
  const memberParentInverse = new Matrix4();
  const flightRay = new Ray();
  const flightBounds = new Box3();
  const flightHit = new Vector3();
  const noTargetMessage = "没有可感知的追踪目标，请指定目标物体或匹配的目标标签。";

  function heightOffset(group: LifeGroup) { return group.locomotion === "water" ? group.verticalOffset : 0; }
  function isGroupEnabled(group: LifeGroup) { return settings.enabled && group.enabled; }
  function navigationArea(group: LifeGroup) {
    if (!performanceTracks.has(group.id)) return { center: group.center, radius: group.radius };
    const center = { x: Math.round(group.center.x / 16) * 16, y: 0, z: Math.round(group.center.z / 16) * 16 };
    const extent = group.radius + Math.hypot(group.center.x - center.x, group.center.z - center.z);
    // ACT: 邻近独立动线共享固定块导航，避免一个个体生成一张 Navcat 网；超大区域仍受既有网格精度限制。
    return { center, radius: Math.max(16, 16 * 2 ** Math.ceil(Math.log2(extent / 16))) };
  }
  function navigationProfile(group: LifeGroup, sideways = false) {
    const shape = bodyShape(group);
    if (!shape || !sideways) return shape?.profile;
    return { radius: Math.ceil(((shape.bounds.max.z - shape.bounds.min.z) / 2 + 0.025) / 0.05) * 0.05, height: shape.profile.height };
  }
  function regionKey(group: LifeGroup, sideways = false) { return JSON.stringify([group.locomotion === "water" ? "water" : "ground", navigationArea(group), navigationProfile(group, sideways)]); }
  function shapeSignature(group: LifeGroup) {
    const cached = shapeSignatures.get(group.id);
    if (cached !== undefined) return cached;
    const objectId = group.visual.kind === "object" ? group.visual.objectId : undefined;
    const template = objectId ? templates.get(objectId) : undefined;
    const source = objectId ? document?.objects.find(object => object.id === objectId) : undefined;
    const plan = planFor(group);
    const independent = performanceTracks.has(group.id);
    const anchors = plan?.steps.flatMap(activity => [activity.anchor, ...(activity.via ?? []), ...(!independent && activity.face ? [activity.face] : [])]).filter(anchor => anchor.kind === "object").map(anchor => {
      const object = document?.objects.find(item => item.id === anchor.objectId);
      const loaded = templates.get(anchor.objectId);
      loaded?.updateWorldMatrix(true, true);
      return [anchor.objectId, object?.position, object?.rotation, object?.scale, object?.visible, loaded?.uuid, loaded?.matrixWorld.toArray()];
    });
    const steps = independent ? plan?.steps.map(step => [step.id, step.anchor, step.via]) : plan?.steps;
    const signature = JSON.stringify([settings.seed, group.visual, group.locomotion, group.center, group.radius, group.routeObjectId, steps, plan?.loop, anchors, !plan && !!(group.role || group.intent), !!template, bindingSignature(group), source?.color]);
    shapeSignatures.set(group.id, signature);
    return signature;
  }
  function scopedDocument(group: LifeGroup) { return group.routeObjectId ? { ...document!, objects: document!.objects.filter(object => object.id === group.routeObjectId) } : document!; }
  function getRoads(group: LifeGroup) {
    const area = navigationArea(group);
    const track = performanceTracks.get(group.id);
    const source = track && document?.objects.find(object => object.id === track.objectId);
    const signature = JSON.stringify([group.routeObjectId, area, track?.points, track?.loop, source && editTransformSignature(source)]);
    if (roadSignatures.get(group.id) === signature) return roadNetworks.get(group.id)!;
    let roads = track ? undefined : sharedRoadNetworks.get(signature);
    if (!roads) {
      let route: Vector3[] | undefined;
      const shape = track && source && bodyShape(group);
      if (track && source && shape) {
        const pivot = new Vector3(source.position.x, source.position.y, source.position.z);
        const offset = shape.footprint.getCenter(new Vector3());
        offset.y = 0;
        const origin = pivot.clone().add(offset.applyAxisAngle(up, shape.heading));
        origin.y += shape.bounds.min.y;
        const points = track.points.map(point => new Vector3(...point));
        const first = points[0]!;
        if (Math.hypot(first.x - pivot.x, first.z - pivot.z) <= 0.25 && Math.abs(first.y - pivot.y) <= Math.max(0.5, shape.height)) points[0] = origin.clone();
        route = [origin, ...points];
        if (track.loop && points.length > 1) route.push(points[0]!);
      }
      roads = buildLifeRoads(scopedDocument(group), { ...settings, ...area }, route);
      if (!track) sharedRoadNetworks.set(signature, roads);
    }
    roadNetworks.set(group.id, roads);
    roadSignatures.set(group.id, signature);
    return roads;
  }
  function planFor(group: LifeGroup) { return group.plan ?? routePlans.get(group.id); }
  function compileRoutePlan(group: LifeGroup) {
    const kind = group.locomotion === "road" ? "road" : group.locomotion === "ground" ? "walk" : undefined;
    const object = document?.objects.find(item => item.id === group.routeObjectId && item.visible && item.navigation?.kind === kind);
    if (!kind || !object?.navigation || group.plan) return;
    const matrix = new Matrix4().compose(new Vector3(object.position.x, object.position.y, object.position.z), new Quaternion().setFromEuler(new Euler(object.rotation.x * Math.PI / 180, object.rotation.y * Math.PI / 180, object.rotation.z * Math.PI / 180)), new Vector3(object.scale.x, object.scale.y, object.scale.z));
    const points = object.navigation.points.map(point => new Vector3(point.x, point.y, point.z).applyMatrix4(matrix)).filter((point, index, values) => !index || point.distanceToSquared(values[index - 1]!) > 0.01);
    if (points.length < 2) return;
    const anchors = points.map(point => ({ kind: "point" as const, position: { x: point.x, y: point.y, z: point.z } }));
    // ACT: 内部路线来自最多256个真实导航点，完整保留顺序；不写回用户的24个via输入上限。
    routePlans.set(group.id, { summary: "沿绑定线路依次往返", loop: true, steps: [
      { id: "routeReturn", label: "线路起点", anchor: anchors[0]!, via: anchors.slice(1, -1).reverse(), spread: Math.max(1.7, object.navigation.width * Math.min(object.scale.x, object.scale.z) / 3), duration: 0.5, action: "wait" },
      { id: "routeForward", label: "线路终点", anchor: anchors[anchors.length - 1]!, via: anchors.slice(1, -1), spread: Math.max(1.7, object.navigation.width * Math.min(object.scale.x, object.scale.z) / 3), duration: 0.5, action: "wait" },
    ] });
  }
  function getRegion(group: LifeGroup, sideways = false) {
    const key = regionKey(group, sideways);
    let region = regions.get(key);
    if (region) return region;
    let navMesh: NavMesh | undefined;
    let failure = "";
    const area = navigationArea(group);
    try { navMesh = buildLifeNavMesh(document!, { ...settings, ...area }, navigationGeometry, group.locomotion === "water" ? "water" : "ground", navigationProfile(group, sideways)); }
    catch (error) { failure = error instanceof Error ? error.message : String(error); }
    region = { key, navMesh, simulation: crowd.create(8), proxies: new Map(), center: new Vector3(area.center.x, area.center.y, area.center.z), radius: area.radius, failure };
    regions.set(key, region);
    return region;
  }
  function makeVisual(group: LifeGroup, index: number) {
    const objectId = performanceTracks.get(group.id)?.objectId;
    const source = objectId ? templates.get(objectId) : undefined;
    if (!(source instanceof Group) || !document?.objects.some(object => object.id === objectId)) return undefined;
    let owner: Object3D = source;
    while (owner.parent) owner = owner.parent;
    return owner === scene ? createLifeObject(source, index, settings.seed ^ hashGroup(group.id)) : undefined;
  }
  function editTransformSignature(object: SceneObject) { return JSON.stringify([object.position, object.rotation, object.scale, object.height]); }
  function sourceSignature(id: string) {
    return JSON.stringify([settings.seed, id, templates.get(id)?.uuid, document?.objects.find(object => object.id === id)?.asset]);
  }
  function getTrackObjectIds(id: string): readonly string[] { return trackMembers.get(id) ?? []; }
  function bindingSignature(group: LifeGroup) {
    // 模拟每一步都会经 bodyShape/regionKey 问到这里；签名的输入只在 sync 里变，按组记到下次 sync。
    let signature = bindingSignatures.get(group.id);
    if (signature === undefined) {
      signature = JSON.stringify([settings.seed, performanceTracks.get(group.id)?.objectId, getTrackObjectIds(group.id).map(id => {
        const object = document?.objects.find(object => object.id === id);
        return [id, templates.get(id)?.uuid, object?.asset, object && editTransformSignature(object), object?.visible];
      })]);
      bindingSignatures.set(group.id, signature);
    }
    return signature;
  }
  function bodyShape(group: LifeGroup) {
    const id = performanceTracks.get(group.id)?.objectId;
    const source = id ? templates.get(id) : undefined;
    if (!source) return undefined;
    const signature = JSON.stringify([bindingSignature(group), group.locomotion]);
    const cached = bodyShapes.get(group.id);
    if (cached?.signature === signature) return cached.shape;
    source.updateWorldMatrix(true, true);
    const orientation = source.getWorldQuaternion(new Quaternion());
    const heading = new Euler().setFromQuaternion(orientation, "YXZ").y;
    const tilt = new Quaternion().setFromAxisAngle(up, -heading).multiply(orientation);
    const bodyMatrix = new Matrix4().compose(new Vector3(), tilt, source.getWorldScale(new Vector3()));
    const inverse = source.matrixWorld.clone().invert();
    const members = getTrackObjectIds(group.id).flatMap(id => {
      const member = templates.get(id);
      return member && document?.objects.some(object => object.id === id && object.visible) ? [member] : [];
    });
    const bounds = new Box3();
    for (const member of members) {
      member.updateWorldMatrix(true, true);
      bounds.union(createCollisionShape(member).bounds.applyMatrix4(bodyMatrix.clone().multiply(inverse).multiply(member.matrixWorld)));
    }
    if (bounds.isEmpty()) return undefined;
    const height = Math.max(0.2, bounds.max.y - bounds.min.y);
    const footprint = new Box3();
    const point = new Vector3();
    const instanceMatrix = new Matrix4();
    const bodyTop = bounds.min.y + Math.min(1, height * 0.55);
    // 行走用接地至低躯干的真实截面，树冠、举起的手臂或长柄不再扩大脚部避让圈。
    for (const member of members) member.traverseVisible(node => {
      if (!(node instanceof Mesh) || !node.geometry.getAttribute("position")) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      const total = node.geometry.index?.count ?? node.geometry.getAttribute("position").count;
      const ranges = Array.isArray(node.material) ? node.geometry.groups : [{ start: 0, count: total, materialIndex: 0 }];
      for (let instance = 0; instance < (node instanceof InstancedMesh ? node.count : 1); instance++) {
        const matrix = bodyMatrix.clone().multiply(inverse).multiply(node.matrixWorld);
        if (node instanceof InstancedMesh) { node.getMatrixAt(instance, instanceMatrix); matrix.multiply(instanceMatrix); }
        const vertices = new Set<number>();
        for (const range of ranges) {
          const material = materials[range.materialIndex ?? 0];
          if (!material?.visible || material.opacity <= 0) continue;
          const end = Math.min(total, range.start + range.count, node.geometry.drawRange.start + node.geometry.drawRange.count);
          for (let index = Math.max(range.start, node.geometry.drawRange.start); index < end; index++) vertices.add(node.geometry.index?.getX(index) ?? index);
        }
        for (const index of vertices) {
          node.getVertexPosition(index, point).applyMatrix4(matrix);
          if (Number.isFinite(point.x + point.y + point.z) && point.y <= bodyTop + 1e-6) footprint.expandByPoint(point);
        }
      }
    });
    if (footprint.isEmpty() || group.locomotion === "air") footprint.copy(bounds);
    const radius = Math.max(0.1, (footprint.max.x - footprint.min.x) / 2, (footprint.max.z - footprint.min.z) / 2);
    const shape = { bounds, footprint, tilt, heading, radius, height, profile: { radius: Math.ceil(radius * 20 - 1e-8) / 20, height: Math.ceil(height * 10 - 1e-8) / 10 } };
    bodyShapes.set(group.id, { signature, shape });
    return shape;
  }
  function readEditTransform(group: Group, object: SceneObject): EditTransform {
    return { position: group.position.clone(), quaternion: group.quaternion.clone(), scale: group.scale.clone(), signature: editTransformSignature(object) };
  }
  function removeActor(actor: LifeActor, removeAgent = true) {
    supportCache.delete(actor.id);
    restoreSidePose(actor.visual.group);
    actor.mind.tree?.clearSubgoals();
    if (removeAgent && actor.region && actor.agentId) {
      const region = regions.get(actor.region);
      if (region) crowd.removeAgent(region.simulation, actor.agentId);
    }
    actor.visual.dispose();
    const group = actor.visual.group;
    group.position.copy(actor.editTransform.position);
    group.quaternion.copy(actor.editTransform.quaternion);
    group.scale.copy(actor.editTransform.scale);
    group.updateWorldMatrix(true, true);
    if (group.userData.performanceTrackId === actor.group.id) delete group.userData.performanceTrackId;
    for (const member of actor.members) {
      member.visual.dispose();
      const source = member.visual.group;
      source.position.copy(member.editTransform.position);
      source.quaternion.copy(member.editTransform.quaternion);
      source.scale.copy(member.editTransform.scale);
      source.updateWorldMatrix(true, true);
      if (source.userData.performanceTrackId === actor.group.id) delete source.userData.performanceTrackId;
    }
  }
  function refreshActorObjects() {
    activeObjectIds.clear();
    objectActors.clear();
    actorObjects = actors.flatMap(actor => {
      const track = performanceTracks.get(actor.group.id);
      if (!track) return [];
      for (const id of getTrackObjectIds(track.id)) { activeObjectIds.add(id); objectActors.set(id, actor); }
      return [{ trackId: track.id, objectId: track.objectId, group: actor.visual.group }];
    });
    for (const id of objectAnimation.getObjectIds()) activeObjectIds.add(id);
  }
  function clearActors() { for (const actor of actors) removeActor(actor); actors = []; refreshActorObjects(); }

  function clampTarget(group: LifeGroup, point: Vector3) {
    const dx = point.x - group.center.x;
    const dz = point.z - group.center.z;
    const length = Math.hypot(dx, dz);
    const radius = Math.max(0.1, group.radius - 0.35);
    if (length > radius) { point.x = group.center.x + dx / length * radius; point.z = group.center.z + dz / length * radius; }
    if (group.locomotion === "air" && performanceTracks.has(group.id)) point.y = group.groundFollow ? getTerrainHeight(document?.terrain, point.x, point.z) : Math.max(getTerrainHeight(document?.terrain, point.x, point.z) + 0.15, point.y);
    if (group.locomotion === "air" && !performanceTracks.has(group.id)) {
      const floor = getTerrainHeight(document?.terrain, point.x, point.z);
      const height = floor + group.verticalOffset;
      const spread = Math.min(6, Math.abs(group.verticalOffset) * 0.2, group.radius / 2);
      point.y = Math.max(floor + 0.15, MathUtils.clamp(point.y, height - spread, height + spread));
    }
    return point;
  }
  function setTarget(actor: LifeActor, point?: Vector3, radius = 8) {
    const mind = actor.mind;
    if (actor.region && actor.agentId) {
      const region = regions.get(actor.region)!;
      if (!region.navMesh) return false;
      const agent = region.simulation.agents[actor.agentId];
      if (!agent) return false;
      const nearest = findNearestPoly(createFindNearestPolyResult(), region.navMesh, agent.position, [1, 3, 1], DEFAULT_QUERY_FILTER);
      if (!nearest.success) return false;
      let target: ReturnType<typeof findRandomPointAroundCircle> | undefined;
      if (point) {
        const surfacePoint = clampTarget(actor.group, point.clone());
        surfacePoint.y = actor.group.locomotion === "water" ? agent.position[1] : surfacePoint.y;
        target = findNearestPoly(createFindNearestPolyResult(), region.navMesh, surfacePoint.toArray(), [3, actor.group.locomotion === "water" ? 60 : 8, 3], DEFAULT_QUERY_FILTER);
      }
      if (!target?.success) target = findRandomPointAroundCircle(region.navMesh, nearest.nodeRef, agent.position, Math.min(radius, actor.group.radius), DEFAULT_QUERY_FILTER, mind.random);
      if (!target.success) return false;
      const worldTarget = clampTarget(actor.group, new Vector3(...target.position));
      const constrained = findNearestPoly(createFindNearestPolyResult(), region.navMesh, worldTarget.toArray(), [1, 8, 1], DEFAULT_QUERY_FILTER);
      if (!constrained.success) return false;
      mind.target = new Vector3(...constrained.position);
      mind.target.y += heightOffset(actor.group);
      return crowd.requestMoveTarget(region.simulation, actor.agentId, constrained.nodeRef, constrained.position);
    }
    if (!point) {
      const angle = mind.random() * Math.PI * 2;
      const distance = Math.sqrt(mind.random()) * actor.group.radius;
      const x = actor.group.center.x + Math.cos(angle) * distance;
      const z = actor.group.center.z + Math.sin(angle) * distance;
      point = new Vector3(x, getTerrainHeight(document?.terrain, x, z) + (actor.group.locomotion === "air" ? actor.group.verticalOffset + (mind.random() - 0.5) * Math.min(10, actor.group.radius) : 0), z);
    }
    mind.target = clampTarget(actor.group, point.clone());
    if (actor.group.locomotion === "road") {
      const roads = roadNetworks.get(actor.group.id);
      const closest = roads?.nodes.reduce((best, node) => !best || node.position.distanceToSquared(mind.target!) < best.position.distanceToSquared(mind.target!) ? node : best, undefined as LifeRoads["nodes"][number] | undefined);
      if (closest) mind.target.copy(closest.position);
    }
    return true;
  }
  function matchesTags(actor: LifeActor, tags: string[]) { return tags.some(tag => actor.group.tags.includes(tag)); }
  function closestRelated(actor: LifeActor, tags: string[]) {
    if (!tags.length) return undefined;
    let best: LifeActor | undefined;
    let distance = actor.group.perceptionRadius * actor.group.perceptionRadius;
    for (const other of actors) {
      if (other === actor || !matchesTags(other, tags)) continue;
      const candidate = actor.current.distanceToSquared(other.current);
      if (candidate < distance) { best = other; distance = candidate; }
    }
    return best;
  }
  function trackedTarget(actor: LifeActor) {
    const selected = actor.group.targetObjectId ? document?.objects.find(object => object.id === actor.group.targetObjectId) : undefined;
    if (selected) return new Vector3(selected.position.x, selected.position.y, selected.position.z);
    return closestRelated(actor, actor.group.targetTags)?.current.clone();
  }
  function routeTarget(actor: LifeActor) {
    const object = actor.group.routeObjectId ? document?.objects.find(item => item.id === actor.group.routeObjectId) : undefined;
    const points = object?.navigation?.points;
    if (points?.length && object) {
      const period = Math.max(1, (points.length - 1) * 2);
      const index = actor.mind.patrol++ % period;
      const point = points[index < points.length ? index : period - index]!;
      const matrix = new Matrix4().compose(new Vector3(object.position.x, object.position.y, object.position.z), new Quaternion().setFromEuler(new Euler(object.rotation.x * Math.PI / 180, object.rotation.y * Math.PI / 180, object.rotation.z * Math.PI / 180)), new Vector3(object.scale.x, object.scale.y, object.scale.z));
      return new Vector3(point.x, point.y, point.z).applyMatrix4(matrix).add(new Vector3(0, heightOffset(actor.group), 0));
    }
    const angle = actor.mind.patrol++ * Math.PI / 4;
    const x = actor.group.center.x + Math.cos(angle) * actor.group.radius * 0.7;
    const z = actor.group.center.z + Math.sin(angle) * actor.group.radius * 0.7;
    return new Vector3(x, getTerrainHeight(document?.terrain, x, z) + (actor.group.locomotion === "air" ? actor.group.verticalOffset : heightOffset(actor.group)), z);
  }
  function groupTarget(actor: LifeActor) {
    if (actor.group.behavior === "pursue") return trackedTarget(actor);
    if (actor.group.behavior === "patrol") return routeTarget(actor);
    if (actor.group.behavior === "herd" || actor.group.behavior === "forage") {
      const neighbors = actors.filter(other => other !== actor && other.group.id === actor.group.id && actor.current.distanceToSquared(other.current) < actor.group.perceptionRadius * actor.group.perceptionRadius).slice(0, 8);
      if (neighbors.length) {
        const point = new Vector3();
        for (const neighbor of neighbors) point.add(neighbor.current);
        return point.multiplyScalar(1 / neighbors.length).add(new Vector3((actor.mind.random() - 0.5) * 4, 0, (actor.mind.random() - 0.5) * 4));
      }
    }
    return undefined;
  }
  function reachedTarget(actor: LifeActor) {
    if (actor.region && actor.agentId) return crowd.isAgentAtTarget(regions.get(actor.region)!.simulation, actor.agentId, Math.max(0.4, actor.radius));
    const road = actor.group.locomotion === "road" ? roadNetworks.get(actor.group.id)?.edges[actor.roadEdge] : undefined;
    return !!actor.mind.target && actor.current.distanceTo(actor.mind.target) < Math.max(0.6, actor.radius + (road ? Math.min(1.5, road.width / 4) : 0));
  }

  function awaitingPlan(group: LifeGroup) { return !planFor(group) && !!(group.role?.trim() || group.intent?.trim()); }
  function scheduled(group: LifeGroup) { return !!planFor(group) || awaitingPlan(group) || group.locomotion === "road"; }
  function newActivity(): LifeActivityState { return { step: 0, leg: 0, phase: "travel", until: 0, retryAt: 0, blocked: "", slot: 0, roadPath: [], roadCursor: 0, roadGoalEdge: -1, roadGoalDistance: 0, checked: false, loopCount: 0, transferredAt: -1 }; }
  function hasPointPrefix(points: PerformanceTrack["points"], prefix: PerformanceTrack["points"]) {
    if (points.length < prefix.length) return false;
    // ACT: 首点允许移动/瞬移；续播与追加画线只要求首点之后的路段一致，避免移动首点后演绎从头重播。
    for (let index = 1; index < prefix.length; index++) {
      for (let axis = 0; axis < 3; axis++) if (Math.abs(prefix[index]![axis]! - points[index]![axis]!) > 0.0001) return false;
    }
    return true;
  }
  function activityPointIndex(actor: LifeActor) {
    const state = actor.activity;
    if (!state) return 0;
    if (state.phase === "done") return actor.track.points.length;
    const step = planFor(actor.group)!.steps[state.step]!;
    const anchor = Number(step.id.slice(5));
    return state.phase === "dwell" ? anchor : Math.min(anchor, anchor - (step.via?.length ?? 0) + state.leg);
  }
  function activityFromPoint(group: LifeGroup, point: number) {
    const state = newActivity();
    const plan = planFor(group)!;
    if (point > Number(plan.steps[plan.steps.length - 1]!.id.slice(5))) {
      if (!plan.loop) { state.step = plan.steps.length - 1; state.phase = "done"; return state; }
      point = 0;
    }
    state.step = Math.max(0, plan.steps.findIndex(step => Number(step.id.slice(5)) >= point));
    const step = plan.steps[state.step]!;
    state.leg = Math.max(0, point - Number(step.id.slice(5)) + (step.via?.length ?? 0));
    return state;
  }
  function resolveAnchor(anchor: LifeAnchor, approach = true) {
    const actor = anchor.kind === "object" ? objectActors.get(anchor.objectId) : undefined;
    if (actor) {
      if (anchor.kind === "object" && anchor.objectId !== actor.objectId) return computeAnchor(anchor, approach);
      const point = actor.current.clone();
      if (anchor.kind === "object" && anchor.offset) point.add(new Vector3(anchor.offset.x, anchor.offset.y, anchor.offset.z).applyAxisAngle(up, actor.heading));
      else if (approach) point.add(new Vector3(0, 0, actor.radius + 0.5).applyAxisAngle(up, actor.heading));
      return point;
    }
    const key = JSON.stringify([anchor, approach]);
    if (!anchorCache.has(key)) anchorCache.set(key, computeAnchor(anchor, approach));
    return anchorCache.get(key)?.clone();
  }
  function computeAnchor(anchor: LifeAnchor, approach: boolean) {
    if (anchor.kind === "point") return new Vector3(anchor.position.x, anchor.position.y, anchor.position.z);
    const source = templates.get(anchor.objectId);
    if (!source || !document?.objects.some(object => object.id === anchor.objectId && object.visible)) return undefined;
    source.updateWorldMatrix(true, true);
    if (anchor.offset) return new Vector3(anchor.offset.x, anchor.offset.y, anchor.offset.z).applyMatrix4(source.matrixWorld);
    const bounds = new Box3().setFromObject(source);
    if (bounds.isEmpty()) return undefined;
    const point = bounds.getCenter(new Vector3());
    if (!approach) return point;
    const forward = new Vector3(0, 0, 1).transformDirection(source.matrixWorld);
    forward.y = 0;
    if (forward.lengthSq() < 0.001) forward.set(0, 0, 1);
    forward.normalize();
    const size = bounds.getSize(new Vector3());
    point.addScaledVector(forward, (Math.abs(forward.x) * size.x + Math.abs(forward.z) * size.z) / 2 + 1);
    point.y = Math.max(bounds.min.y, getTerrainHeight(document.terrain, point.x, point.z));
    return point;
  }
  function activityPoint(actor: LifeActor, activity: LifeActivity, leg = activity.via?.length ?? 0) {
    if (activity.id === "point0" && leg === 0 && actor.initialPoint) return actor.initialPoint.clone();
    const via = activity.via ?? [];
    const anchor = resolveAnchor(via[leg] ?? activity.anchor);
    if (!anchor) return undefined;
    if (performanceTracks.has(actor.group.id) || leg < via.length || routePlans.has(actor.group.id) && !actor.group.plan) return anchor;
    const slot = actor.activity?.slot ?? 0;
    const angle = actor.index * 2.3999632297 + slot * 1.6180339887 + (hashGroup(actor.group.id) % 628) / 100;
    const distance = activity.spread * Math.sqrt((actor.index + 0.3) / Math.max(1, actor.group.count));
    return anchor.add(new Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance));
  }
  function insideArea(group: LifeGroup, point: Vector3) { return Math.hypot(point.x - group.center.x, point.z - group.center.z) <= group.radius - 0.05; }
  function airObstructed(start: Vector3, end: Vector3, radius: number) {
    const length = start.distanceToSquared(end);
    if (length > 1e-10) flightRay.set(start, direction.copy(end).sub(start).normalize());
    return obstacles.some(box => {
      flightBounds.copy(box).expandByScalar(radius);
      if (flightBounds.containsPoint(start) || flightBounds.containsPoint(end)) return true;
      const hit = length > 1e-10 && flightRay.intersectBox(flightBounds, flightHit);
      return !!hit && hit.distanceToSquared(start) <= length;
    });
  }
  function roadSite(group: LifeGroup, point: Vector3, spread: number, forward?: Vector3) {
    const roads = roadNetworks.get(group.id);
    let best: { edge: number; distance: number; point: Vector3 } | undefined;
    let closest = Infinity;
    for (let index = 0; roads && index < roads.edges.length; index++) {
      const edge = roads.edges[index]!;
      const distance = MathUtils.clamp(point.clone().sub(edge.start).dot(edge.direction), 0, edge.length);
      const candidate = lifeRoadPoint(edge, distance, new Vector3());
      const squared = candidate.distanceToSquared(point);
      const score = squared + (forward ? Math.max(0, 1 - edge.direction.dot(forward)) * 0.1 : 0);
      if (squared <= spread * spread && score < closest && insideArea(group, candidate)) { closest = score; best = { edge: index, distance, point: candidate }; }
    }
    return best;
  }
  function roadPath(roads: LifeRoads, fromEdge: number, fromDistance: number, toEdge: number, toDistance: number) {
    if (fromEdge === toEdge && toDistance >= fromDistance - 0.05) return [];
    if (lifeRoadPoint(roads.edges[fromEdge]!, fromDistance, new Vector3()).distanceToSquared(lifeRoadPoint(roads.edges[toEdge]!, toDistance, new Vector3())) < 0.0001) return [];
    let cache = roadPathCache.get(roads);
    if (!cache) { cache = new Map(); roadPathCache.set(roads, cache); }
    const key = fromEdge + ":" + toEdge;
    if (cache.has(key)) return cache.get(key)?.slice();
    const start = roads.edges[fromEdge]?.to;
    const end = roads.edges[toEdge]?.from;
    if (start === undefined || end === undefined) return undefined;
    const parents = new Map<number, number>();
    const queue = [start];
    parents.set(start, -1);
    // ACT: 计划用有向道路 BFS 保证真实可达；按边数选路，尚不按交通耗时求最短路线。
    for (let index = 0; index < queue.length && !parents.has(end); index++) {
      for (const edgeIndex of roads.nodes[queue[index]!]!.outgoing) {
        const next = roads.edges[edgeIndex]!.to;
        if (!parents.has(next)) { parents.set(next, edgeIndex); queue.push(next); }
      }
    }
    if (!parents.has(end)) { cache.set(key, undefined); return undefined; }
    const path = [toEdge];
    for (let node = end; node !== start;) { const edgeIndex = parents.get(node)!; path.unshift(edgeIndex); node = roads.edges[edgeIndex]!.from; }
    cache.set(key, path);
    return path.slice();
  }
  function activitySite(actor: LifeActor, activity: LifeActivity, leg = activity.via?.length ?? 0): LifeSite | undefined {
    const key = [actor.id, actor.activity?.slot ?? 0, activity.id, leg, actor.group.verticalOffset, !!actor.sideways].join(":");
    if (!siteCache.has(key)) siteCache.set(key, computeActivitySite(actor, activity, leg));
    return siteCache.get(key);
  }
  function computeActivitySite(actor: LifeActor, activity: LifeActivity, leg: number): LifeSite | undefined {
    const point = activityPoint(actor, activity, leg);
    if (!point || !insideArea(actor.group, point)) return undefined;
    if (actor.group.locomotion === "road") {
      const plan = planFor(actor.group)!;
      const index = plan.steps.findIndex(step => step.id === activity.id);
      const previous = leg > 0 ? activity.via?.[leg - 1] : index > 0 ? plan.steps[index - 1]!.anchor : plan.loop ? plan.steps[plan.steps.length - 1]!.anchor : undefined;
      const origin = previous && resolveAnchor(previous);
      const forward = origin ? point.clone().sub(origin).normalize() : undefined;
      const road = roadSite(actor.group, point, Math.max(1.7, activity.spread), forward);
      return road ? { point: road.point, road, nearest: undefined } : undefined;
    }
    if (actor.group.locomotion === "air") {
      // ACT: 沿线轨道：路径点直接贴到地形上，不检查与其他物体相交，画到哪走到哪。
      if (actor.group.groundFollow) { point.y = getTerrainHeight(document?.terrain, point.x, point.z); return { point, road: undefined, nearest: undefined }; }
      if (clampTarget(actor.group, point.clone()).distanceTo(point) > 0.05 || airObstructed(point, point, actor.radius)) return undefined;
      return { point, road: undefined, nearest: undefined };
    }
    const region = getRegion(actor.group, actor.sideways);
    // 飞檐走壁的人可以站在没有导航面的顶面上（屋脊、墙头）；离点太远的导航面（比如墙下的地面）不算。
    const perch = canParkour(actor) ? () => perchSite(actor, point) : () => undefined;
    if (!region.navMesh) return perch();
    const query = point.clone();
    if (actor.group.locomotion === "water") query.y -= actor.group.verticalOffset;
    const snapDistance = actor.group.locomotion === "water" ? Math.max(0.5, actor.radius) : Math.max(0.8, actor.radius + 0.4);
    const nearest = findNearestPoly(createFindNearestPolyResult(), region.navMesh, query.toArray(), [snapDistance, actor.group.locomotion === "water" ? 60 : 2, snapDistance], DEFAULT_QUERY_FILTER);
    if (!nearest.success || !insideArea(actor.group, new Vector3(...nearest.position)) || Math.hypot(nearest.position[0] - point.x, nearest.position[2] - point.z) > snapDistance) return perch();
    if (canParkour(actor) && Math.abs(nearest.position[1] - point.y) > 0.5) { const site = perch(); if (site) return site; }
    const anchor = resolveAnchor(activity.via?.[leg] ?? activity.anchor)!;
    const allowedSpread = Math.max(actor.group.locomotion === "ground" ? snapDistance : 0, leg < (activity.via?.length ?? 0) ? Math.max(0.6, actor.radius) : activity.spread);
    if (activity.id !== "point0" && Math.hypot(nearest.position[0] - anchor.x, nearest.position[2] - anchor.z) > allowedSpread + 0.05) return perch();
    point.set(...nearest.position);
    point.y += heightOffset(actor.group);
    if (actor.group.locomotion === "water") point.y = Math.max(point.y, getTerrainHeight(document?.terrain, point.x, point.z) + 0.04);
    return { point, road: undefined, nearest };
  }
  function completePath(actor: LifeActor, target: NonNullable<LifeSite["nearest"]>) {
    const region = getRegion(actor.group, actor.sideways);
    const agent = actor.agentId ? region.simulation.agents[actor.agentId] : undefined;
    const start = agent?.corridor.path[0];
    if (!region.navMesh || !agent || start === undefined) return undefined;
    const nodes = findNodePath(region.navMesh, start, target.nodeRef, agent.position, target.position, DEFAULT_QUERY_FILTER);
    if (!nodes.success || !(nodes.flags & FindNodePathResultFlags.COMPLETE_PATH)) return undefined;
    const result = findStraightPath(region.navMesh, agent.position, target.position, nodes.path);
    return result.success && !(result.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED)) ? result : undefined;
  }
  function bodyMovementClear(actor: LifeActor, from: Vector3, to: Vector3, heading: number, movingOnly = false, walking = false) {
    const shape = bodyShape(actor.group)!;
    const bounds = shape.bounds.clone().translate(new Vector3(-actor.bodyOffset.x, -shape.bounds.min.y, -actor.bodyOffset.z));
    // ACT: Navcat已验证完整步行走廊，腿部采用同一≤0.45米踏步余量；躯干仍碰门墙，跳攀扫全身，非足部IK。
    // 站在导航点上（原地转身、起跳站位、片段起点）也按 walking 传入；其余全身检查脚底留 0.1 米，
    // 导航面高度有体素误差（一格 0.05 米加细节误差），会比真实楼板低几厘米，不能算“脚插进地板”。
    bounds.min.y += walking ? Math.min(0.45, shape.profile.height * 0.25) + 0.05 : 0.1;
    const area = new Box3().setFromPoints([from, to]);
    area.min.x -= actor.radius; area.max.x += actor.radius; area.min.z -= actor.radius; area.max.z += actor.radius; area.max.y += actor.height;
    const models = movingOnly ? [...objectAnimation.getMovingIds()].flatMap(id => { const model = templates.get(id); return model ? [model] : []; }) : [...supportIndex.query(area).keys()].map(id => supportModels.get(id)!);
    return isLifeBodyMovementClear(bounds, from, to, heading, models);
  }
  function switchPosture(actor: LifeActor, activity: LifeActivity, leg: number, sideways: boolean) {
    if (!!actor.sideways === sideways || actor.group.locomotion !== "ground" || !skeletalObjectIds.has(actor.objectId) || actor.members.length) return false;
    const profile = navigationProfile(actor.group, sideways);
    if (!profile || sideways && profile.radius >= actor.radius - 0.04) return false;
    const point = activityPoint(actor, activity, leg);
    const region = getRegion(actor.group, sideways);
    if (!point || !region.navMesh) return false;
    if (![0.25, 0.5, 0.75, 1].every(fraction => bodyMovementClear(actor, actor.current, actor.current, actor.heading + Math.PI / 2 * (sideways ? fraction : 1 - fraction), false, true))) return false;
    const start = findNearestPoly(createFindNearestPolyResult(), region.navMesh, actor.current.toArray(), [0.2, 0.5, 0.2], DEFAULT_QUERY_FILTER);
    const target = findNearestPoly(createFindNearestPolyResult(), region.navMesh, point.toArray(), [0.8, 2, 0.8], DEFAULT_QUERY_FILTER);
    if (!start.success || !target.success || Math.hypot(start.position[0] - actor.current.x, start.position[2] - actor.current.z) > 0.12) return false;
    const nodes = findNodePath(region.navMesh, start.nodeRef, target.nodeRef, start.position, target.position, DEFAULT_QUERY_FILTER);
    if (!nodes.success || !(nodes.flags & FindNodePathResultFlags.COMPLETE_PATH)) return false;
    const path = findStraightPath(region.navMesh, start.position, target.position, nodes.path, undefined, FindStraightPathOptions.ALL_CROSSINGS);
    if (!path.success || path.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED)) return false;
    let previous = actor.current.clone();
    for (const vertex of path.path) {
      const next = new Vector3(...vertex.position);
      const yaw = next.distanceToSquared(previous) > 1e-8 ? Math.atan2(next.x - previous.x, next.z - previous.z) : actor.heading;
      if (!bodyMovementClear(actor, previous, next, yaw + (sideways ? Math.PI / 2 : 0), false, true)) return false;
      previous = next;
    }
    if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
    actor.agentId = undefined; actor.region = undefined; actor.sideways = sideways;
    actor.seekPlan = undefined; siteCache.clear();
    addNavigationActor(actor, region, start.position);
    return true;
  }
  function trySideways(actor: LifeActor, activity: LifeActivity, leg: number) { return switchPosture(actor, activity, leg, true); }
  function traversalMode(actor: LifeActor, activity: LifeActivity) {
    const clip = rawPerformanceTracks.find(track => track.id === actor.group.id)?.clips?.find(clip => clip.id === activity.clipId && clip.kind === "move");
    return clip?.kind === "move" ? clip.traversal ?? "auto" : "auto";
  }
  // ACT: 飞檐走壁（演绎轨道parkour）：点可以落在屋顶、屋脊、墙头上；走不通或要绕远的段直接飞身过去。
  function canParkour(actor: LifeActor) { return actor.group.parkour === true && actor.group.locomotion === "ground"; }
  /** 没有导航面的落脚处（屋脊、墙头、陡瓦面边）：脚下有真实顶面、头顶没有东西压着就能站。 */
  function perchSite(actor: LifeActor, point: Vector3): LifeSite | undefined {
    const height = groundSupport(point);
    if (height === undefined) return undefined;
    const site = new Vector3(point.x, height, point.z);
    const area = new Box3(site.clone(), site.clone().addScaledVector(up, actor.height));
    return !meshBlocked(area, site.clone().addScaledVector(up, 0.3), up, actor.height - 0.35) ? { point: site } : undefined;
  }
  /** 射线在far以内是否碰到area附近看得见的真实三角面。 */
  function meshBlocked(area: Box3, origin: Vector3, direction: Vector3, far: number, models = [...supportIndex.query(area).keys()].map(id => supportModels.get(id)!)) {
    if (!models.length || far <= 0) return false;
    leapRay.set(origin, direction);
    leapRay.far = far;
    for (const hit of leapRay.intersectObjects(models, true)) {
      if (!(hit.object instanceof Mesh) || !hit.face) continue;
      let visible = true;
      for (let node: Object3D | null = hit.object; node && node !== scene; node = node.parent) if (!node.visible) { visible = false; break; }
      const material = Array.isArray(hit.object.material) ? hit.object.material[hit.face.materialIndex] : hit.object.material;
      if (visible && material?.visible && material.opacity > 0) return true;
    }
    return false;
  }
  /**
   * 飞身一小段是否会撞到真实网格：沿这段在膝、胸、头的高度（胸部再左右各一条）打射线，只看看得见的三角面。
   * 屋顶、屋檐这类大斜面的包围盒会把人整个罩住，所以飞身不用包围盒检查；腿部以下不查，落在瓦坡、屋脊上不算撞。
   */
  function leapSegmentClear(actor: LifeActor, from: Vector3, to: Vector3, heading: number) {
    const delta = to.clone().sub(from), length = delta.length();
    if (length < 1e-4) return true;
    const area = new Box3().setFromPoints([from, to]);
    area.min.x -= actor.radius; area.max.x += actor.radius; area.min.z -= actor.radius; area.max.z += actor.radius; area.max.y += actor.height;
    const models = [...supportIndex.query(area).keys()].map(id => supportModels.get(id)!);
    if (!models.length) return true;
    delta.divideScalar(length);
    const side = new Vector3(Math.cos(heading), 0, -Math.sin(heading));
    const chest = Math.max(0.6, actor.height * 0.6), head = Math.max(0.65, actor.height * 0.95);
    for (const [lift, offset] of [[0.55, 0], [chest, 0], [chest, -0.22], [chest, 0.22], [head, 0]] as const) {
      if (meshBlocked(area, from.clone().addScaledVector(up, lift).addScaledVector(side, offset), delta, length, models)) return false;
    }
    return true;
  }
  /** 两点之间飞身的抛物线：扫掠真实身体（腿部按踏步余量放宽，方便落在瓦坡上），撞到就逐级抬高弧顶，再高也撞就算跳不过去。 */
  function leapArc(actor: LifeActor, from: Vector3, to: Vector3, seconds = 0) {
    const span = Math.hypot(to.x - from.x, to.z - from.z), rise = to.y - from.y;
    if (span > 40 || Math.abs(rise) > 30 || from.distanceTo(to) < 0.3) return undefined;
    const heading = span > 0.05 ? Math.atan2(to.x - from.x, to.z - from.z) : actor.heading;
    const base = Math.min(3, 0.35 + span * 0.12);
    for (const extra of [0, 0.8, 1.8, 3.5]) {
      // 二次曲线控制点：两端等高时弧顶正好比高的一端高 base+extra。
      const control = 2 * (Math.max(from.y, to.y) + base + extra) - (from.y + to.y) / 2;
      const path: Vector3[] = [from.clone()];
      for (let index = 1; index <= 32; index++) {
        const t = index / 32;
        const point = from.clone().lerp(to, t);
        point.y = (1 - t) ** 2 * from.y + 2 * t * (1 - t) * control + t * t * to.y;
        if (index < 32 && point.y < getTerrainHeight(document?.terrain, point.x, point.z) + 0.015 || !leapSegmentClear(actor, path[index - 1]!, point, heading)) break;
        path.push(point);
      }
      // 没写到达时间时和时间轴一样按直线距离/速度计时（飞檐走壁默认“飞快”）。
      if (path.length === 33) return { path, heading, duration: seconds > 0 ? seconds : Math.max(0.45, from.distanceTo(to) / actor.group.speed) };
    }
    return undefined;
  }
  /** 飞檐走壁的人：走得通且不绕远就走，否则飞身。walked是导航走法的长度（走不通为Infinity）。 */
  function prefersLeap(from: Vector3, to: Vector3, walked: number) { return walked > from.distanceTo(to) * 1.6 + 3; }
  function localTraversal(actor: LifeActor, from: Vector3, site: LifeSite, activity: LifeActivity) {
    const mode = traversalMode(actor, activity);
    if (mode === "walk" || mode === "crouch" || actor.group.locomotion !== "ground" || !skeletalObjectIds.has(actor.objectId) || actor.members.length || !site.nearest) return undefined;
    const mesh = getRegion(actor.group).navMesh;
    if (!mesh) return undefined;
    const origin = findNearestPoly(createFindNearestPolyResult(), mesh, from.toArray(), [0.2, 0.5, 0.2], DEFAULT_QUERY_FILTER);
    if (!origin.success) return undefined;
    const partial = findNodePath(mesh, origin.nodeRef, site.nearest.nodeRef, origin.position, site.nearest.position, DEFAULT_QUERY_FILTER);
    if (!partial.success || !partial.path.length || partial.flags & FindNodePathResultFlags.COMPLETE_PATH) return undefined;
    let boundary: ReturnType<typeof findNearestPoly> | undefined;
    let approachNodes: ReturnType<typeof findNodePath> | undefined;
    const samples = Math.min(128, Math.ceil(from.distanceTo(site.point) / 0.2));
    for (let index = 1; index <= samples; index++) {
      const sample = site.point.clone().lerp(from, index / samples);
      const nearest = findNearestPoly(createFindNearestPolyResult(), mesh, sample.toArray(), [0.15, 2, 0.15], DEFAULT_QUERY_FILTER);
      if (!nearest.success || Math.hypot(nearest.position[0] - sample.x, nearest.position[2] - sample.z) > 0.18) continue;
      const route = findNodePath(mesh, origin.nodeRef, nearest.nodeRef, origin.position, nearest.position, DEFAULT_QUERY_FILTER);
      if (!route.success || !(route.flags & FindNodePathResultFlags.COMPLETE_PATH)) continue;
      boundary = nearest; approachNodes = route; break;
    }
    if (!boundary || !approachNodes) return undefined;
    const boundaryRef = boundary.nodeRef;
    const takeoff = new Vector3(...boundary.position);
    const forward = site.point.clone().sub(takeoff); forward.y = 0;
    if (forward.lengthSq() < 0.01) return undefined;
    forward.normalize();
    const nearby = queryPolygons(mesh, [takeoff.x - 3.2, takeoff.y - 1.2, takeoff.z - 3.2, takeoff.x + 3.2, takeoff.y + 2, takeoff.z + 3.2], DEFAULT_QUERY_FILTER);
    const options: { point: Vector3; ref: number; score: number }[] = [];
    for (const ref of nearby.slice(0, 128)) {
      const candidate = getClosestPointOnPoly(createGetClosestPointOnPolyResult(), mesh, ref, takeoff.toArray());
      if (!candidate.success) continue;
      const point = new Vector3(...candidate.position), delta = point.clone().sub(takeoff), distance = Math.hypot(delta.x, delta.z);
      if (distance < 0.45 || distance > 3.2 || delta.dot(forward) < 0.3 || Math.abs(delta.y) > 1.8) continue;
      const reachable = findNodePath(mesh, origin.nodeRef, ref, origin.position, candidate.position, DEFAULT_QUERY_FILTER);
      if (reachable.success && reachable.flags & FindNodePathResultFlags.COMPLETE_PATH) continue;
      const remainder = findNodePath(mesh, ref, site.nearest.nodeRef, candidate.position, site.nearest.position, DEFAULT_QUERY_FILTER);
      if (!remainder.success || !(remainder.flags & FindNodePathResultFlags.COMPLETE_PATH)) continue;
      options.push({ point, ref, score: distance + point.distanceTo(site.point) * 0.1 });
    }
    options.sort((left, right) => left.score - right.score);
    for (const option of options.slice(0, 16)) {
      const landing = option.point, rise = landing.y - takeoff.y, distance = Math.hypot(landing.x - takeoff.x, landing.z - takeoff.z);
      if (groundSupport(landing) === undefined) continue;
      const kind = mode === "auto" ? rise > 0.85 ? "climb" : rise > 0.25 ? "jump" : "vault" : mode;
      if (kind !== "jump" && kind !== "climb" && kind !== "vault" || kind === "climb" && (rise < 0.3 || rise > 1.8 || distance > 1.8) || kind !== "climb" && (rise > 1.1 || rise < -1 || distance > 3.2)) continue;
      const heading = Math.atan2(landing.x - takeoff.x, landing.z - takeoff.z);
      const path: Vector3[] = [];
      // ACT: 仅处理3.2米内已证实的局部跨越；每段扫掠真实身体，落地仍须属于通向目标的导航面。
      for (let index = 0; index <= 32; index++) {
        const t = index / 32;
        const point = kind === "climb" ? t < 0.55
          ? takeoff.clone().addScaledVector(up, (Math.max(0, rise) + 0.12) * t / 0.55)
          : takeoff.clone().lerp(landing, (t - 0.55) / 0.45).setY(landing.y + 0.12 * (1 - (t - 0.55) / 0.45))
          : takeoff.clone().lerp(landing, t).addScaledVector(up, Math.max(kind === "vault" ? 1.05 : 0.65, Math.max(0, rise) * 0.65 + 0.35) * 4 * t * (1 - t));
        if (!insideArea(actor.group, point) || point.y < getTerrainHeight(document?.terrain, point.x, point.z) + 0.015 || index && !bodyMovementClear(actor, path[index - 1]!, point, heading)) break;
        path.push(point);
      }
      if (path.length !== 33) continue;
      const approach = findStraightPath(mesh, origin.position, boundary.position, approachNodes.path, undefined, FindStraightPathOptions.ALL_CROSSINGS);
      if (!approach.success || approach.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED)) continue;
      const remainderNodes = findNodePath(mesh, option.ref, site.nearest.nodeRef, landing.toArray(), site.nearest.position, DEFAULT_QUERY_FILTER);
      const remainder = findStraightPath(mesh, landing.toArray(), site.nearest.position, remainderNodes.path, undefined, FindStraightPathOptions.ALL_CROSSINGS);
      if (!remainder.success || remainder.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED)) continue;
      const raw = rawPerformanceTracks.find(track => track.id === actor.group.id)?.clips?.find(clip => clip.id === activity.clipId);
      const duration = (kind === "climb" ? 1.2 + Math.max(0, rise) * 0.65 : Math.max(0.7, distance / 2.8 + Math.abs(rise) * 0.3)) / (raw?.rate ?? 1);
      return { kind, path, heading, takeoff: boundary, boundaryRef, approach: approach.path.map(point => new Vector3(...point.position)), remainder: remainder.path.map(point => new Vector3(...point.position)), duration: Math.max(0.2, duration) };
    }
    return undefined;
  }
  function beginTraversal(actor: LifeActor, site: LifeSite, activity: LifeActivity) {
    const plan = localTraversal(actor, actor.current, site, activity);
    const region = getRegion(actor.group);
    if (!plan || !actor.agentId || !crowd.requestMoveTarget(region.simulation, actor.agentId, plan.boundaryRef, plan.takeoff.position)) return false;
    actor.sideways = false;
    actor.traversal = { kind: plan.kind, phase: "approach", path: plan.path.map(point => point.toArray()), start: steppedTime, duration: plan.duration, heading: plan.heading };
    actor.activity!.goal = site.point;
    actor.activity!.phase = "travel"; actor.activity!.blocked = "";
    actor.activity!.segmentLength = actor.current.distanceTo(site.point);
    if (activity.clipId) objectAnimation.notify(actor.group.id, activity.clipId, steppedTime);
    actor.mind.target = plan.path[0]!.clone(); actor.mind.machine.changeTo("move");
    return true;
  }
  function updateTraversal(actor: LifeActor) {
    const state = actor.traversal;
    if (!state) return;
    if (state.phase === "approach") {
      const takeoff = new Vector3(...state.path[0]!);
      if (actor.current.distanceTo(takeoff) > 0.08) return;
      if (!bodyMovementClear(actor, actor.current, takeoff, state.heading, false, true)) { actor.traversal = undefined; blockActivity(actor, "起跳站位受阻，请调整路线或先移动障碍。"); return; }
      state.path[0] = actor.current.toArray();
      if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
      actor.agentId = actor.region = undefined; state.phase = "flight"; state.start = steppedTime; actor.heading = state.heading;
    }
    const fraction = MathUtils.clamp((steppedTime - state.start) / state.duration, 0, 1), cursor = fraction * (state.path.length - 1), index = Math.min(state.path.length - 2, Math.floor(cursor));
    const next = new Vector3(...state.path[index]!).lerp(new Vector3(...state.path[index + 1]!), cursor - index);
    if (state.kind === "leap" ? !bodyMovementClear(actor, actor.current, next, state.heading, true, true) : !bodyMovementClear(actor, actor.current, next, state.heading)) { actor.traversal = undefined; blockActivity(actor, "跨越过程中出现真实障碍，已停止，请先移开障碍再继续。"); return; }
    actor.current.copy(next);
    if (fraction < 1) return;
    actor.traversal = undefined; actor.groundDisplay = undefined;
    if (!connectActorNavigation(actor)) { blockActivity(actor, "跨越落点已不再可站立，请调整路线。"); return; }
    beginActivity(actor);
  }
  function validateActivityPlan(actor: LifeActor) {
    const state = actor.activity!;
    const activity = planFor(actor.group)!.steps[state.step]!;
    if (!activitySite(actor, activity, state.leg) && !trySideways(actor, activity, state.leg)) return `“${activity.label}”没有可站立的活动点或途经点，请调整该节点。`;
    if (activity.face && !resolveAnchor(activity.face, false)) return `“${activity.label}”的朝向对象不存在或尚未载入。`;
    // 每一段在 beginActivity 内检查完整导航路径；不让已走过的旧起点阻塞后面的路线。
    return "";
  }
  function stopActor(actor: LifeActor) {
    actor.mind.target = undefined;
    actor.velocity.set(0, 0, 0);
    actor.speed = 0;
    actor.roadSpeed = 0;
    const region = actor.region ? regions.get(actor.region) : undefined;
    const agent = actor.agentId ? region?.simulation.agents[actor.agentId] : undefined;
    if (!region || !agent || !actor.agentId) return;
    crowd.resetMoveTarget(region.simulation, actor.agentId);
    agent.maxSpeed = 0;
    agent.velocity.fill(0);
    agent.newVelocity.fill(0);
  }
  function blockActivity(actor: LifeActor, reason: string) {
    actor.traversal = undefined;
    const state = actor.activity!;
    if (state.phase !== "blocked") state.pending = "blocked";
    state.phase = "blocked";
    state.blocked = reason;
    state.retryAt = steppedTime + 2;
    stopActor(actor);
    actor.mind.machine.changeTo("idle");
  }
  function beginActivity(actor: LifeActor) {
    const state = actor.activity!;
    const activity = planFor(actor.group)!.steps[state.step]!;
    if (activity.clipOrigin && activity.clipId && state.originClip !== activity.clipId + ":" + state.loopCount) {
      const origin = clipOriginSite(actor, activity);
      if (!origin) { blockActivity(actor, "移动片段的源起点没有真实可站立通行面，请调整裁剪入点或源路径。"); return; }
      if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
      actor.agentId = actor.region = undefined; actor.traversal = undefined;
      actor.current.copy(origin.point); actor.previous.copy(actor.current); actor.groundDisplay = undefined;
      if (!connectActorNavigation(actor)) { blockActivity(actor, "移动片段源起点无法接入导航，请调整源路径。"); return; }
      state.originClip = activity.clipId + ":" + state.loopCount;
    }
    if (actor.sideways) switchPosture(actor, activity, state.leg, false);
    let site = activitySite(actor, activity, state.leg);
    if (!site && trySideways(actor, activity, state.leg)) site = activitySite(actor, activity, state.leg);
    if (!site) { blockActivity(actor, `“${activity.label}”的锚点不可用或没有可达站位。`); return; }
    if (activity.face && !resolveAnchor(activity.face, false)) { blockActivity(actor, `“${activity.label}”的朝向对象不可用。`); return; }
    const segmentIndex = Number(activity.id.slice(5)) - 1;
    if (segmentIndex >= 0 && actor.track.teleports?.includes(segmentIndex)) {
      // ACT: 瞬移段不走导航，直接把演员放到下一点；时间轴按0秒通过，与菱形锚点重合。
      stopActor(actor);
      if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
      actor.agentId = actor.region = undefined;
      actor.traversal = undefined;
      actor.current.copy(site.point);
      actor.previous.copy(actor.current);
      actor.groundDisplay = undefined;
      if (!connectActorNavigation(actor)) { blockActivity(actor, "瞬移落点不可通行，请调整路径点。"); return; }
      state.goal = site.point;
      state.phase = "travel";
      state.blocked = "";
      state.retryAt = 0;
      state.segmentPoint = Number(activity.id.slice(5));
      state.segmentLoop = state.loopCount;
      state.segmentLength = 0;
      actor.mind.target = site.point.clone();
      actor.mind.machine.changeTo("move");
      return;
    }
    // ACT: 飞檐走壁：站在没有导航面的顶面上时原地到达；走不通或绕远就从当前位置直接飞身到这一点。
    const pointIndex = Number(activity.id.slice(5)) - (activity.via?.length ?? 0) + state.leg;
    if (canParkour(actor) && pointIndex > 0) {
      const perched = !actor.agentId && actor.current.distanceTo(site.point) <= 0.3;
      const walk = !perched && actor.agentId && site.nearest ? completePath(actor, site.nearest) : undefined;
      let walked = walk ? 0 : Infinity;
      if (walk) { let previous = actor.current.toArray(); for (const point of walk.path) { walked += Math.hypot(point.position[0] - previous[0], point.position[1] - previous[1], point.position[2] - previous[2]); previous = point.position; } }
      const leap = !perched && prefersLeap(actor.current, site.point, walked) ? leapArc(actor, actor.current, site.point, actor.track.segmentSeconds?.[pointIndex - 1] ?? 0) : undefined;
      if (!perched && !leap && !walk) { blockActivity(actor, `飞身到“${activity.label}”会撞上东西，请把起跳点或落点挪开一点。`); return; }
      if (perched || leap) {
        if (leap) {
          stopActor(actor);
          if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
          actor.agentId = actor.region = undefined; actor.sideways = false; actor.groundDisplay = undefined;
          actor.traversal = { kind: "leap", phase: "flight", path: leap.path.map(point => point.toArray()), start: steppedTime, duration: leap.duration, heading: leap.heading };
          actor.heading = leap.heading;
          if (activity.clipId && activity.clipKind === "move") objectAnimation.notify(actor.group.id, activity.clipId, steppedTime);
        }
        state.goal = site.point; state.phase = "travel"; state.blocked = ""; state.retryAt = 0;
        if (state.segmentPoint !== pointIndex || state.segmentLoop !== state.loopCount) { state.segmentPoint = pointIndex; state.segmentLoop = state.loopCount; state.segmentLength = leap ? leap.path.reduce((sum, point, index) => sum + (index ? point.distanceTo(leap.path[index - 1]!) : 0), 0) : 0; }
        actor.mind.target = site.point.clone(); actor.mind.machine.changeTo("move");
        return;
      }
    }
    let length = actor.current.distanceTo(site.point);
    if (site.nearest) {
      const region = getRegion(actor.group, actor.sideways);
      const agent = actor.agentId ? region.simulation.agents[actor.agentId] : undefined;
      const path = agent && completePath(actor, site.nearest);
      if (!path && trySideways(actor, activity, state.leg)) { beginActivity(actor); return; }
      if (!path && beginTraversal(actor, site, activity)) return;
      if (!actor.agentId || !path || !crowd.requestMoveTarget(region.simulation, actor.agentId, site.nearest.nodeRef, site.nearest.position)) { blockActivity(actor, `无法完整到达“${activity.label}”：步行和侧身通道受阻，附近未找到安全落脚点；请先开门、移开障碍或调整路线。`); return; }
      length = 0;
      let previous = agent!.position;
      for (const point of path.path) { length += Math.hypot(point.position[0] - previous[0], point.position[1] - previous[1], point.position[2] - previous[2]); previous = point.position; }
      length += Math.hypot(site.point.x - previous[0], site.point.y - heightOffset(actor.group) - previous[1], site.point.z - previous[2]);
    } else if (site.road) {
      const roads = roadNetworks.get(actor.group.id)!;
      const path = roadPath(roads, actor.roadEdge, actor.roadDistance, site.road.edge, site.road.distance);
      if (!path) { blockActivity(actor, `道路不连通，无法到达“${activity.label}”。`); return; }
      if (!path.length && actor.roadEdge !== site.road.edge) { actor.roadEdge = site.road.edge; actor.roadDistance = site.road.distance; }
      length = path.length ? roads.edges[actor.roadEdge]!.length - actor.roadDistance + path.reduce((sum, edge, index) => sum + (index === path.length - 1 ? site.road!.distance : roads.edges[edge]!.length), 0) : Math.max(0, site.road.distance - actor.roadDistance);
      state.roadPath = path;
      state.roadCursor = 0;
      state.roadGoalEdge = site.road.edge;
      state.roadGoalDistance = site.road.distance;
    } else if (!actor.group.groundFollow && airObstructed(actor.current, site.point, actor.radius)) { blockActivity(actor, `飞往“${activity.label}”的路线受阻，等待重新安排路线。`); return; }
    state.goal = site.point;
    if (activity.clipId && activity.clipKind === "move") objectAnimation.notify(actor.group.id, activity.clipId, steppedTime);
    state.phase = "travel";
    state.blocked = "";
    state.retryAt = 0;
    const point = activityPointIndex(actor);
    if (state.segmentPoint !== point || state.segmentLoop !== state.loopCount) { state.segmentPoint = point; state.segmentLoop = state.loopCount; state.segmentLength = length; }
    actor.mind.target = site.point.clone();
    actor.mind.machine.changeTo("move");
  }
  function arrivedActivity(actor: LifeActor) {
    const state = actor.activity!;
    if (actor.traversal) return false;
    if (!state.goal) return false;
    if (actor.group.locomotion === "road") return actor.roadEdge === state.roadGoalEdge && state.roadCursor >= state.roadPath.length && Math.abs(actor.roadDistance - state.roadGoalDistance) < 0.2 && actor.current.distanceTo(state.goal) < Math.max(0.5, actor.radius);
    // 不能在最后一级下方就因到达半径覆盖台阶而提前停下；高度误差限于一个导航体素。
    if (actor.group.locomotion === "ground" && Math.abs(actor.current.y - state.goal.y) > 0.05) return false;
    return actor.current.distanceTo(state.goal) < Math.max(0.25, Math.min(0.65, actor.radius));
  }
  function faceActivity(actor: LifeActor, immediate = false) {
    if (actor.activity?.phase !== "dwell" || actor.mind.machine.in("alert") || actor.mind.machine.in("flee")) return;
    const activity = planFor(actor.group)!.steps[actor.activity.step]!;
    const counterpart = activity.action === "interact" ? closestRelated(actor, actor.group.targetTags) : undefined;
    const face = activity.face ? resolveAnchor(activity.face, false) : counterpart?.current ?? (activity.anchor.kind === "object" ? resolveAnchor({ kind: "object", objectId: activity.anchor.objectId }, false) : undefined);
    if (!face) return;
    const yaw = Math.atan2(face.x - actor.current.x, face.z - actor.current.z);
    actor.heading += Math.atan2(Math.sin(yaw - actor.heading), Math.cos(yaw - actor.heading)) * (immediate ? 1 : 0.2);
  }
  function changeActivity(actor: LifeActor, next: number) {
    const state = actor.activity!;
    if (state.transferredAt === steppedTime) return false;
    actor.mind.tree?.clearSubgoals();
    actor.mind.tree = undefined;
    stopActor(actor);
    actor.traversal = undefined;
    state.step = next;
    state.leg = 0;
    state.phase = "travel";
    state.until = 0;
    state.retryAt = 0;
    state.blocked = "";
    state.pending = undefined;
    state.goal = undefined;
    state.checked = false;
    state.transferredAt = steppedTime;
    actor.mind.machine.changeTo("idle");
    return true;
  }
  function dispatchActivityEvent(actor: LifeActor) {
    const state = actor.activity!;
    const event = state.pending;
    state.pending = undefined;
    if (!event) return false;
    const plan = planFor(actor.group)!;
    const rule = plan.steps[state.step]!.on?.find(rule => rule.event === event);
    if (!rule) return false;
    const index = plan.steps.findIndex(activity => activity.id === rule.next);
    return index >= 0 && changeActivity(actor, index);
  }
  function senseActivityTarget(actor: LifeActor) {
    const state = actor.activity;
    if (!state) return;
    let target: Vector3 | undefined;
    if (actor.group.targetObjectId) target = resolveAnchor({ kind: "object", objectId: actor.group.targetObjectId }, false);
    if (!target && actor.group.targetTags.length) {
      let distance = Infinity;
      for (const other of actors) {
        if (other === actor || !matchesTags(other, actor.group.targetTags)) continue;
        const candidate = actor.current.distanceToSquared(other.current);
        if (candidate < distance) { distance = candidate; target = other.current; }
      }
    }
    if (!target) { state.targetNear = undefined; return; }
    const near = actor.current.distanceToSquared(target) <= actor.group.perceptionRadius * actor.group.perceptionRadius;
    if (near !== state.targetNear && (near || state.targetNear !== undefined) && !state.pending) state.pending = near ? "targetNear" : "targetFar";
    state.targetNear = near;
  }
  function buildActivityTree(actor: LifeActor, saved?: ActivitySnapshot["tree"]) {
    const state = actor.activity!;
    const activity = planFor(actor.group)!.steps[state.step]!;
    const lastMove = activity.via?.length ?? 0;
    const tree = new CompositeGoal<LifeMind>(actor.mind);
    tree.execute = () => { tree.status = tree.executeSubgoals(); };
    tree.terminate = () => { tree.clearSubgoals(); };
    const nodes = saved ? saved.nodes.map(node => node.node).sort((a, b) => a - b) : state.phase === "dwell" ? [lastMove + 1] : Array.from({ length: lastMove + 2 - state.leg }, (_, index) => index + state.leg);
    for (const node of nodes) {
      const goal = new Goal<LifeMind>(actor.mind) as LifeGoal;
      goal.node = node;
      goal.activate = () => {
        if (node <= lastMove) {
          state.leg = node;
          beginActivity(actor);
          if (state.phase === "blocked") goal.status = Goal.STATUS.FAILED;
        } else if (state.phase !== "dwell") {
          state.phase = "dwell";
          state.until = steppedTime + planFor(actor.group)!.steps[state.step]!.duration;
          if (actor.sideways) switchPosture(actor, activity, state.leg, false);
          if (activity.clipId && activity.clipKind === "pose") objectAnimation.notify(actor.group.id, activity.clipId, steppedTime);
        }
      };
      goal.execute = () => {
        if (!goal.active()) return;
        if (state.phase === "blocked") { goal.status = Goal.STATUS.FAILED; return; }
        if (node <= lastMove) {
          if (!arrivedActivity(actor)) return;
          goal.status = Goal.STATUS.COMPLETED;
          state.leg = node + 1;
          if (node === lastMove) {
            if (movementInertia(actor) <= 0) snapToActivityGoal(actor);
            state.phase = "dwell";
            state.until = steppedTime + planFor(actor.group)!.steps[state.step]!.duration;
            if (actor.sideways) switchPosture(actor, activity, state.leg, false);
            if (activity.clipId && activity.clipKind === "pose") objectAnimation.notify(actor.group.id, activity.clipId, steppedTime);
            state.pending = "arrived";
            stopActor(actor);
            actor.mind.machine.changeTo("idle");
          }
        } else {
          stopActor(actor);
          if (steppedTime >= state.until) { goal.status = Goal.STATUS.COMPLETED; state.pending = "completed"; }
        }
      };
      if (saved) goal.status = saved.nodes.find(saved => saved.node === node)!.status;
      tree.addSubgoal(goal);
    }
    if (saved) tree.status = saved.status;
    actor.mind.tree = tree;
    return tree;
  }
  function updateActivity(actor: LifeActor) {
    if (!actor.activity || actor.mind.machine.in("alert") || actor.mind.machine.in("flee")) return;
    if (actor.traversal?.phase === "flight") return;
    const state = actor.activity;
    if (dispatchActivityEvent(actor)) return;
    if (state.phase === "done") { stopActor(actor); return; }
    if (state.phase === "blocked" && steppedTime < state.retryAt) { stopActor(actor); return; }
    if (!state.checked || state.phase === "blocked") {
      const failure = validateActivityPlan(actor);
      if (failure) { blockActivity(actor, failure); dispatchActivityEvent(actor); return; }
      state.checked = true;
      actor.mind.tree?.clearSubgoals();
      actor.mind.tree = undefined;
    }
    if (state.phase === "dwell" && !arrivedActivity(actor)) {
      actor.mind.tree?.clearSubgoals();
      actor.mind.tree = undefined;
      state.leg = planFor(actor.group)!.steps[state.step]!.via?.length ?? 0;
      state.phase = "travel";
    }
    const tree = actor.mind.tree ?? buildActivityTree(actor);
    if (state.phase === "travel" && !actor.mind.machine.in("move") && tree.active()) beginActivity(actor);
    tree.activateIfInactive();
    tree.execute();
    // ACT: 途经点通过后同一步激活下一叶；按剩余节点数有界，活动事件仍由一次转移门禁控制。
    const viaCount = planFor(actor.group)!.steps[state.step]!.via?.length ?? 0;
    for (let index = 0; index < viaCount && tree.active() && (tree.currentSubgoal() as LifeGoal | null)?.completed() && (tree.currentSubgoal() as LifeGoal).node < viaCount; index++) tree.execute();
    if (dispatchActivityEvent(actor) || actor.mind.tree !== tree) return;
    if (tree.failed()) { stopActor(actor); return; }
    if (!tree.completed()) return;
    const plan = planFor(actor.group)!;
    if (state.step + 1 < plan.steps.length) changeActivity(actor, state.step + 1);
    else if (plan.loop && (plan.steps.length > 1 || plan.steps[0]!.duration > 0 || plan.steps[0]!.via?.length)) { state.loopCount++; changeActivity(actor, 0); }
    else { state.phase = "done"; stopActor(actor); }
  }

  const idleState = new State<LifeMind>();
  idleState.enter = mind => {
    if (scheduled(mind.actor.group)) { stopActor(mind.actor); return; }
    if (mind.actor.region && mind.actor.agentId) crowd.resetMoveTarget(regions.get(mind.actor.region)!.simulation, mind.actor.agentId);
    mind.target = undefined;
    mind.until = steppedTime + (mind.actor.group.behavior === "forage" ? 2 + mind.random() * 5 : 0.5 + mind.random() * 2);
  };
  idleState.execute = mind => { if (!scheduled(mind.actor.group) && mind.actor.group.behavior !== "idle" && steppedTime >= mind.until) mind.machine.changeTo("move"); };
  const moveState = new State<LifeMind>();
  moveState.enter = mind => {
    if (scheduled(mind.actor.group)) return;
    const target = groupTarget(mind.actor);
    if (mind.actor.group.behavior === "pursue" && !target) {
      mind.target = undefined;
      groupMessages.set(mind.actor.group.id, noTargetMessage);
      if (mind.actor.region && mind.actor.agentId) crowd.resetMoveTarget(regions.get(mind.actor.region)!.simulation, mind.actor.agentId);
    } else setTarget(mind.actor, target, mind.actor.group.behavior === "wander" ? 12 : 8);
    mind.until = steppedTime + 25;
    mind.repathAt = steppedTime + 0.8;
  };
  moveState.execute = mind => {
    const actor = mind.actor;
    if (scheduled(actor.group)) return;
    if (actor.group.behavior === "pursue" && steppedTime >= mind.repathAt) {
      const target = trackedTarget(actor);
      if (target) {
        setTarget(actor, target);
        if (groupMessages.get(actor.group.id) === noTargetMessage) groupMessages.delete(actor.group.id);
      } else {
        mind.target = undefined;
        if (actor.region && actor.agentId) crowd.resetMoveTarget(regions.get(actor.region)!.simulation, actor.agentId);
        groupMessages.set(actor.group.id, noTargetMessage);
      }
      mind.repathAt = steppedTime + 0.8;
    }
    if (steppedTime >= mind.until || steppedTime > mind.repathAt - 0.4 && reachedTarget(actor)) mind.machine.changeTo("idle");
  };
  const alertState = new State<LifeMind>();
  alertState.enter = mind => {
    if (mind.actor.group.locomotion === "road") { stopActor(mind.actor); return; }
    if (mind.actor.region && mind.actor.agentId) crowd.resetMoveTarget(regions.get(mind.actor.region)!.simulation, mind.actor.agentId);
    mind.until = steppedTime + 0.3 + mind.random() * 0.25;
  };
  alertState.execute = mind => { if (mind.actor.group.locomotion !== "road" && steppedTime >= mind.until) mind.machine.changeTo("flee"); };
  const fleeState = new State<LifeMind>();
  fleeState.enter = mind => { mind.until = steppedTime + 3 + mind.random() * 2; mind.repathAt = 0; };
  fleeState.execute = mind => {
    if (steppedTime < mind.repathAt) return;
    mind.repathAt = steppedTime + 0.7;
    if (!mind.threat) { mind.machine.changeTo("idle"); return; }
    const away = mind.actor.current.clone().sub(mind.threat);
    if (mind.actor.group.locomotion !== "air") away.y = 0;
    if (away.lengthSq() < 0.001) away.set(mind.random() - 0.5, 0, mind.random() - 0.5);
    setTarget(mind.actor, mind.actor.current.clone().addScaledVector(away.normalize(), 8 + mind.random() * 6), 12);
  };
  function makeMind(actor: LifeActor, random: LifeRandom) {
    const mind = new GameEntity() as LifeMind;
    mind.actor = actor;
    mind.random = random;
    mind.until = 0;
    mind.senseAt = steppedTime + random() * 0.3;
    mind.repathAt = 0;
    mind.patrol = actor.index;
    mind.machine = new StateMachine(mind).add("idle", idleState).add("move", moveState).add("alert", alertState).add("flee", fleeState);
    return mind;
  }
  function sense(actor: LifeActor) {
    const mind = actor.mind;
    if (steppedTime < mind.senseAt) return;
    mind.senseAt = steppedTime + 0.3;
    senseActivityTarget(actor);
    const threat = closestRelated(actor, actor.group.avoidTags);
    if (threat) {
      mind.threat = threat.current.clone();
      if (!mind.machine.in("alert") && !mind.machine.in("flee")) mind.machine.changeTo("alert");
    } else if (actor.group.locomotion === "road" && mind.machine.in("alert") || mind.machine.in("flee") && steppedTime >= mind.until) { mind.threat = undefined; mind.machine.changeTo("idle"); }
  }

  function addNavigationActor(actor: LifeActor, region: LifeRegion, position: [number, number, number]) {
    position = [...position];
    actor.region = region.key;
    const radius = actor.sideways ? navigationProfile(actor.group, true)!.radius : actor.radius;
    actor.agentId = crowd.addAgent(region.simulation, region.navMesh!, position, { radius, height: actor.height, maxAcceleration: 5, maxSpeed: actor.group.speed, collisionQueryRange: Math.max(0.8, radius * 4), pathOptimizationRange: 10, separationWeight: 0.45, updateFlags: crowd.CrowdUpdateFlags.ANTICIPATE_TURNS | crowd.CrowdUpdateFlags.OBSTACLE_AVOIDANCE | crowd.CrowdUpdateFlags.SEPARATION | crowd.CrowdUpdateFlags.OPTIMIZE_VIS | crowd.CrowdUpdateFlags.OPTIMIZE_TOPO, obstacleAvoidance: { ...crowd.DEFAULT_OBSTACLE_AVOIDANCE_PARAMS, horizTime: 1.2, weightSide: 0.35 }, queryFilter: DEFAULT_QUERY_FILTER });
  }

  function bindInitialPoint(actor: LifeActor) {
    actor.initialPoint = undefined;
    const first = actor.track.points[0]!;
    // ACT: 演绎以模型开始位置为起点；起点若因移动模型或存档与模型位置不一致，直接瞬移到起点，避免先走一段导致时间轴错位。
    if (performanceTracks.has(actor.group.id)) {
      const start = new Vector3(first[0], first[1], first[2]);
      if (actor.group.locomotion === "ground") start.y = Math.max(start.y, getTerrainHeight(document?.terrain, start.x, start.z));
      actor.current.copy(start);
      actor.previous.copy(start);
      actor.velocity.set(0, 0, 0);
      actor.initialPoint = start.clone();
      return;
    }
    const pivot = actor.visual.group.getWorldPosition(direction);
    if (Math.hypot(first[0] - pivot.x, first[2] - pivot.z) > 0.25 || Math.abs(first[1] - pivot.y) > Math.max(0.5, actor.height)) return;
    const agent = actor.region && actor.agentId ? regions.get(actor.region)?.simulation.agents[actor.agentId] : undefined;
    actor.initialPoint = agent ? new Vector3(...agent.position) : actor.current.clone();
    if (agent) actor.initialPoint.y += heightOffset(actor.group);
  }

  function samePoint(left: PerformanceTrack["points"][number], right: PerformanceTrack["points"][number]) {
    return Math.abs(left[0] - right[0]) <= 0.0001 && Math.abs(left[1] - right[1]) <= 0.0001 && Math.abs(left[2] - right[2]) <= 0.0001;
  }
  function teleportActorToStart(actor: LifeActor, track: PerformanceTrack, reconnect = true) {
    const first = track.points[0];
    if (!first) return;
    const start = new Vector3(first[0], first[1], first[2]);
    if (actor.group.locomotion === "ground") start.y = Math.max(start.y, getTerrainHeight(document?.terrain, start.x, start.z));
    if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
    actor.agentId = actor.region = undefined;
    actor.traversal = undefined;
    actor.current.copy(start);
    actor.previous.copy(start);
    actor.velocity.set(0, 0, 0);
    actor.initialPoint = start.clone();
    if (reconnect) connectActorNavigation(actor);
  }
  function scheduleActor(actor: LifeActor) {
    if (actor.activity?.phase === "done") changeActivity(actor, 0);
    actor.started = actor.track.startAt === undefined;
    actor.scheduledAt = actor.started ? lastWorldClock : undefined;
    if (actor.started || lastWorldClock === undefined) return;
    actor.scheduledAt = Math.floor(lastWorldClock / 86400) * 86400 + actor.track.startAt!;
    if (actor.scheduledAt < lastWorldClock - 0.00001) actor.scheduledAt += 86400;
  }

  function createActor(group: LifeGroup, index: number, saved?: ActorSnapshot) {
    const objectId = performanceTracks.get(group.id)?.objectId;
    const object = document?.objects.find(object => object.id === objectId);
    if (getTrackObjectIds(group.id).some(id => !(templates.get(id) instanceof Group))) {
      groupMessages.set(group.id, "分组模型尚未全部载入，请等待成员载入后再播放。");
      return undefined;
    }
    const visual = object && makeVisual(group, index);
    if (!visual || !object) { groupMessages.set(group.id, "场景物体尚未载入或已移除，请保留原模型。"); return undefined; }
    const source = visual.group;
    source.updateWorldMatrix(true, true);
    const shape = bodyShape(group);
    if (!shape) { visual.dispose(); groupMessages.set(group.id, "场景物体没有可用模型几何。"); return undefined; }
    const { bounds, tilt, heading, radius, height } = shape;
    const bodyOffset = shape.footprint.getCenter(new Vector3());
    bodyOffset.y = 0;
    const current = source.getWorldPosition(new Vector3());
    current.add(bodyOffset.clone().applyAxisAngle(up, heading));
    current.y += bounds.min.y;
    const inverse = source.matrixWorld.clone().invert();
    const members = getTrackObjectIds(group.id).filter(id => id !== object.id).map(id => {
      const member = templates.get(id)! as Group;
      member.updateWorldMatrix(true, true);
      member.userData.performanceTrackId = group.id;
      return { objectId: id, signature: sourceSignature(id), visual: createLifeObject(member, index, settings.seed ^ hashGroup(group.id)), editTransform: readEditTransform(member, document!.objects.find(object => object.id === id)!), relative: new Matrix4().multiplyMatrices(inverse, member.matrixWorld) };
    });
    const actor = {
      id: group.id + ":" + index, objectId: object.id, index, group, track: performanceTracks.get(group.id)!, signature: shapeSignature(group), bindingSignature: bindingSignature(group), primarySignature: sourceSignature(object.id), worldMatrix: source.matrixWorld.clone(), visual, members,
      editTransform: readEditTransform(source, object), tilt, bodyOffset, baseOffset: bounds.min.y,
      radius, height, roadEdge: 0, roadDistance: 0, roadSpeed: 0,
      previous: current.clone(), current, velocity: new Vector3(), speed: 0, heading,
    } as LifeActor;
    actor.mind = makeMind(actor, createLifeRandom(settings.seed ^ hashGroup(actor.id)));
    source.userData.performanceTrackId = group.id;
    if (saved) return actor;
    const progress = stoppedProgress.get(group.id);
    const continuing = progress && hasPointPrefix(actor.track.points, progress.points);
    actor.activity = activityFromPoint(group, continuing ? progress.point : 0);
    if (continuing) {
      actor.activity.loopCount = progress.loopCount;
      actor.initialPoint = performanceTracks.has(group.id) ? new Vector3(...actor.track.points[0]!) : progress.initialPoint?.clone();
      // ACT: 停用/移动后再启用的演绎从停下的位置继续，不再从模型初始位置走向当前点，避免时间轴错位。
      if (progress.current) {
        actor.current.copy(progress.current);
        actor.previous.copy(progress.previous ?? progress.current);
        actor.heading = progress.heading ?? actor.heading;
        actor.speed = progress.speed ?? 0;
        actor.velocity.set(0, 0, 0);
      }
      if (performanceTracks.has(group.id) && actor.activity && Number(planFor(group)!.steps[actor.activity.step]?.id.slice(5)) === 0) teleportActorToStart(actor, actor.track, false);
    }
    if (continuing && progress.startAt === actor.track.startAt) { actor.scheduledAt = progress.scheduledAt; actor.started = progress.started; }
    else scheduleActor(actor);
    stoppedProgress.delete(group.id);
    actors.push(actor);
    actor.mind.machine.changeTo("idle");
    // ACT: 演绎起点就是模型开始位置；首点若不同则直接瞬移过去，普通生命群组仍从模型当前位置出发。
    if (!continuing) bindInitialPoint(actor);
    const connected = connectActorNavigation(actor);
    if (!connected) blockActivity(actor, "当前位置没有可通行表面，请调整原模型位置或动线。");
    return actor;
  }

  function retargetActor(actor: LifeActor, group: LifeGroup) {
    const track = performanceTracks.get(group.id)!;
    const scheduleChanged = track.startAt !== actor.track.startAt;
    const appended = hasPointPrefix(track.points, actor.track.points);
    const point = appended ? activityPointIndex(actor) : 0;
    const previous = actor.activity;
    const duration = previous ? planFor(actor.group)!.steps[previous.step]!.duration : 0;
    stopActor(actor);
    actor.mind.tree?.clearSubgoals();
    actor.mind.tree = undefined;
    if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
    actor.agentId = undefined;
    actor.region = undefined;
    actor.current.copy(actor.visual.group.getWorldPosition(direction));
    actor.current.add(direction.copy(actor.bodyOffset).applyAxisAngle(up, actor.heading));
    actor.current.y += actor.baseOffset;
    actor.previous.copy(actor.current);
    actor.group = group;
    const previousStart = actor.track.points[0];
    actor.track = track;
    actor.signature = shapeSignature(group);
    actor.activity = activityFromPoint(group, point);
    if (performanceTracks.has(group.id) && actor.activity && !samePoint(previousStart, track.points[0]!) && Number(planFor(group)!.steps[actor.activity.step]?.id.slice(5)) === 0) teleportActorToStart(actor, track, false);
    if (scheduleChanged) scheduleActor(actor);
    if (appended && previous) {
      actor.activity.loopCount = previous.loopCount + Number(previous.phase === "done" && group.plan?.loop);
      if (previous.segmentPoint === activityPointIndex(actor)) { actor.activity.segmentPoint = previous.segmentPoint; actor.activity.segmentLoop = previous.segmentLoop; actor.activity.segmentLength = previous.segmentLength; }
    }
    if (appended && previous?.phase === "dwell" && actor.activity.phase !== "done" && Number(planFor(group)!.steps[actor.activity.step]!.id.slice(5)) === point) {
      actor.activity.phase = "dwell";
      actor.activity.goal = previous.goal;
      actor.activity.until = previous.until + planFor(group)!.steps[actor.activity.step]!.duration - duration;
    }
    actor.mind.machine.changeTo("idle");
    if (!appended) bindInitialPoint(actor);
    else if (performanceTracks.has(group.id)) actor.initialPoint = new Vector3(...actor.track.points[0]!);
    const connected = connectActorNavigation(actor);
    if (!connected) blockActivity(actor, "当前位置没有可通行表面，请调整原模型位置或动线。");
  }

  function rebindActor(actor: LifeActor, group: LifeGroup) {
    const ids = getTrackObjectIds(group.id);
    const source = actor.visual.group;
    source.updateWorldMatrix(true, true);
    if (!actor.members.length && ids.length < 2 || performanceTracks.get(group.id)?.objectId !== actor.objectId
      || actor.primarySignature !== sourceSignature(actor.objectId) || templates.get(actor.objectId) !== source
      || source.matrixWorld.elements.some((value, index) => Math.abs(value - actor.worldMatrix.elements[index]!) > 1e-7)
      || ids.some(id => !(templates.get(id) instanceof Group))) return false;
    for (const member of actor.members) if (!member.repositioned && ids.includes(member.objectId) && templates.get(member.objectId) === member.visual.group) {
      const target = member.visual.group;
      memberMatrix.multiplyMatrices(source.matrixWorld, member.relative);
      if (target.parent) {
        target.parent.updateWorldMatrix(true, false);
        memberMatrix.premultiply(memberParentInverse.copy(target.parent.matrixWorld).invert());
      }
      memberMatrix.decompose(target.position, target.quaternion, target.scale);
      target.updateWorldMatrix(false, true);
    }
    const shape = bodyShape(group);
    if (!shape) return false;
    const previous = new Map(actor.members.map(member => [member.objectId, member]));
    const retained = new Set<LifeMember>();
    const inverse = source.matrixWorld.clone().invert();
    const members = ids.filter(id => id !== actor.objectId).map(id => {
      const source = templates.get(id)! as Group;
      source.updateWorldMatrix(true, true);
      const existing = previous.get(id);
      const signature = sourceSignature(id);
      const member: LifeMember = existing?.visual.group === source && existing.signature === signature ? existing : {
        objectId: id, signature, visual: createLifeObject(source, actor.index, settings.seed ^ hashGroup(group.id)),
        editTransform: readEditTransform(source, document!.objects.find(object => object.id === id)!), relative: new Matrix4(),
      };
      retained.add(member);
      member.relative.multiplyMatrices(inverse, source.matrixWorld);
      member.repositioned = false;
      return member;
    });
    for (const member of actor.members) if (!retained.has(member)) {
      member.visual.dispose();
      if (member.visual.group.userData.performanceTrackId === actor.group.id) delete member.visual.group.userData.performanceTrackId;
    }
    for (const member of members) member.visual.group.userData.performanceTrackId = group.id;
    // ACT: 成员变化只重接组合碰撞和导航，保留主物体排期、当前路段及停留时间；脱组成员停在当前摆放。
    actor.members = members;
    actor.radius = shape.radius;
    actor.height = shape.height;
    actor.bodyOffset.copy(shape.footprint.getCenter(new Vector3()));
    actor.bodyOffset.y = 0;
    actor.baseOffset = shape.bounds.min.y;
    actor.bindingSignature = bindingSignature(group);
    actor.seekPlan = undefined;
    retargetActor(actor, group);
    return true;
  }

  function adjustPopulation() {
    groupMessages.clear();
    const groups = new Map(settings.groups.map(group => [group.id, group]));
    actors = actors.filter(actor => {
      const group = groups.get(actor.group.id);
      const rebindFailed = !!group && isGroupEnabled(group) && actor.index < group.count
        && actor.bindingSignature !== bindingSignature(group) && !rebindActor(actor, group);
      if (!group || !isGroupEnabled(group) || actor.index >= group.count || rebindFailed) {
        // ACT: 移动模型导致的重新绑定也要保留演出进度、位置与排期，避免回到起点并错过原定开始时间。
        if (settings.enabled && group && (!group.enabled || performanceTracks.has(group.id))) stoppedProgress.set(group.id, { points: actor.track.points, point: activityPointIndex(actor), loopCount: actor.activity?.loopCount ?? 0, initialPoint: actor.initialPoint?.clone(), current: actor.current.clone(), previous: actor.previous.clone(), heading: actor.heading, speed: actor.speed, startAt: actor.track.startAt, scheduledAt: actor.scheduledAt, started: actor.started });
        removeActor(actor);
        return false;
      }
      if (actor.signature !== shapeSignature(group)) retargetActor(actor, group);
      const changed = actor.group.behavior !== group.behavior;
      const heightChanged = actor.group.verticalOffset !== group.verticalOffset;
      const perceptionChanged = actor.group.targetObjectId !== group.targetObjectId || actor.group.perceptionRadius !== group.perceptionRadius || JSON.stringify(actor.group.targetTags) !== JSON.stringify(group.targetTags);
      if (performanceTracks.has(group.id) && actor.activity?.phase === "dwell") actor.activity.until += (group.plan?.steps[actor.activity.step]?.duration ?? 0) - (actor.group.plan?.steps[actor.activity.step]?.duration ?? 0);
      if (actor.group.verticalOffset !== group.verticalOffset && (group.locomotion === "air" || group.locomotion === "water")) {
        const change = group.verticalOffset - actor.group.verticalOffset;
        if (actor.mind.target) actor.mind.target.y += change;
        if (group.locomotion === "air") {
          actor.current.y += change;
          actor.previous.y += change;
          clampTarget(group, actor.current);
          clampTarget(group, actor.previous);
        }
        else {
          const agent = actor.region && actor.agentId ? regions.get(actor.region)?.simulation.agents[actor.agentId] : undefined;
          const surface = agent?.position[1] ?? actor.current.y - heightOffset(actor.group);
          actor.current.y = Math.max(surface + group.verticalOffset, getTerrainHeight(document?.terrain, actor.current.x, actor.current.z) + 0.04);
          actor.previous.y = Math.max(surface + group.verticalOffset, getTerrainHeight(document?.terrain, actor.previous.x, actor.previous.z) + 0.04);
        }
      }
      actor.group = group;
      const track = performanceTracks.get(group.id)!;
      const scheduleChanged = track.startAt !== actor.track.startAt;
      const previousStart = actor.track.points[0];
      actor.track = track;
      if (scheduleChanged) scheduleActor(actor);
      if (performanceTracks.has(group.id) && actor.activity && !samePoint(previousStart, track.points[0]!) && Number(planFor(group)!.steps[actor.activity.step]?.id.slice(5)) === 0) teleportActorToStart(actor, track);
      if (actor.activity && heightChanged && (group.locomotion === "air" || group.locomotion === "water")) {
        const activity = planFor(group)!.steps[actor.activity.step]!;
        const site = activitySite(actor, activity, Math.min(actor.activity.leg, activity.via?.length ?? 0));
        if (site) { actor.activity.goal = site.point.clone(); if (actor.activity.phase === "travel") actor.mind.target = site.point.clone(); }
        else blockActivity(actor, "调整高度后活动点不可用，等待重新安排。");
      }
      if (actor.activity && perceptionChanged) { actor.activity.targetNear = undefined; if (actor.activity.pending === "targetNear" || actor.activity.pending === "targetFar") actor.activity.pending = undefined; }
      if (changed && !scheduled(group)) actor.mind.machine.changeTo(group.behavior === "idle" ? "idle" : "move");
      return true;
    });
    if (!settings.enabled) { regions.clear(); roadNetworks.clear(); roadSignatures.clear(); sharedRoadNetworks.clear(); siteCache.clear(); refreshActorObjects(); return; }
    for (const group of settings.groups) {
      if (!isGroupEnabled(group) || !group.count) continue;
      if (!planFor(group) && (group.locomotion === "road" || group.routeObjectId && group.locomotion === "ground")) { groupMessages.set(group.id, "尚无可用固定线路，请绑定对应通行路线或让 AI 安排带途经点的计划。"); continue; }
      if (awaitingPlan(group)) { groupMessages.set(group.id, "角色意图已记录，等待 AI 安排具体活动点和日程。"); continue; }
      const sourceObjectId = group.visual.kind === "object" ? group.visual.objectId : undefined;
      if (sourceObjectId && (!templates.has(sourceObjectId) || !document?.objects.some(object => object.id === sourceObjectId))) { groupMessages.set(group.id, "形象模型尚未载入，请保留源物体并等待模型载入。"); continue; }
      if (group.locomotion === "road") {
        const roads = getRoads(group);
        if (!roads.edges.length) { groupMessages.set(group.id, "车辆动线需要两个不同的位置，请调整路径点。"); continue; }
      } else if (group.locomotion !== "air") {
        const region = getRegion(group);
        if (!region.navMesh) { groupMessages.set(group.id, region.failure || (group.locomotion === "water" ? "活动范围内没有连通水面，请在真实水域放置群组。" : "活动范围内没有可通行地面，请调整范围或移开障碍。")); continue; }
      }
      const existing = new Set(actors.filter(actor => actor.group.id === group.id).map(actor => actor.index));
      for (let index = 0; index < group.count; index++) if (!existing.has(index) && !createActor(group, index)) { if (!groupMessages.has(group.id)) groupMessages.set(group.id, "当前通行空间不足，已保留实际可放置的实例。"); break; }
    }
    const activeRegions = new Set(settings.groups.filter(group => isGroupEnabled(group) && group.count && (group.locomotion === "ground" || group.locomotion === "water")).flatMap(group => [regionKey(group), regionKey(group, true)]));
    let navigationRemoved = false;
    for (const key of regions.keys()) if (!activeRegions.has(key)) { regions.delete(key); navigationRemoved = true; }
    const activeRoads = new Set(settings.groups.filter(group => isGroupEnabled(group) && group.count && group.locomotion === "road").map(group => group.id));
    for (const id of roadNetworks.keys()) if (!activeRoads.has(id)) { roadNetworks.delete(id); roadSignatures.delete(id); navigationRemoved = true; }
    if (navigationRemoved) { siteCache.clear(); }
    refreshActorObjects();
  }

  function syncProxies() {
    if (!regions.size) return;
    const alive = new Map(actors.map(actor => [actor.id, actor]));
    for (const region of regions.values()) {
      if (!region.navMesh) continue;
      for (const [id, agentId] of region.proxies) {
        const actor = alive.get(id);
        if (!actor || actor.region === region.key || Math.hypot(actor.current.x - region.center.x, actor.current.z - region.center.z) > region.radius + actor.radius) { crowd.removeAgent(region.simulation, agentId); region.proxies.delete(id); }
      }
      for (const actor of actors) {
        if (actor.region === region.key || actor.group.locomotion === "air" || actor.traversal?.phase === "flight" || Math.hypot(actor.current.x - region.center.x, actor.current.z - region.center.z) > region.radius + actor.radius) continue;
        let agentId = region.proxies.get(actor.id);
        if (!agentId) {
          const nearest = findNearestPoly(createFindNearestPolyResult(), region.navMesh, actor.current.toArray(), [0.6, 1.2, 0.6], DEFAULT_QUERY_FILTER);
          if (!nearest.success || Math.abs(nearest.position[1] - actor.current.y) > 1.2) continue;
          agentId = crowd.addAgent(region.simulation, region.navMesh, nearest.position, { radius: actor.radius, height: actor.height, maxAcceleration: 0, maxSpeed: 0, collisionQueryRange: 0, separationWeight: 0, updateFlags: 0, queryFilter: DEFAULT_QUERY_FILTER });
          region.proxies.set(actor.id, agentId);
        }
        const agent = region.simulation.agents[agentId];
        if (!agent) continue;
        agent.position[0] = actor.current.x; agent.position[1] = actor.current.y; agent.position[2] = actor.current.z;
        agent.velocity[0] = actor.velocity.x; agent.velocity[1] = actor.velocity.y; agent.velocity[2] = actor.velocity.z;
      }
    }
  }
  function movementSpeed(actor: LifeActor) {
    if (awaitingPlan(actor.group) || actor.activity && !actor.mind.machine.in("flee") && actor.activity.phase !== "travel") return 0;
    if (actor.mind.machine.in("idle") || actor.mind.machine.in("alert") || !actor.activity && actor.group.behavior === "pursue" && !actor.mind.target) return 0;
    const state = actor.activity;
    const segment = state?.segmentPoint ? state.segmentPoint - 1 : state?.segmentLoop ? actor.track.points.length - 1 : -1;
    const seconds = actor.track.segmentSeconds?.[segment] ?? 0;
    const speed = seconds > 0 && state?.segmentLength !== undefined ? Math.min(30, state.segmentLength / seconds) : actor.group.speed;
    return speed * (actor.mind.machine.in("flee") ? 1.8 : 1);
  }
  function movementInertia(actor: LifeActor) {
    // 普通生命群组保持原有的平滑减速；只有演绎轨道读取每点惯性，缺省为 0（无惯性）。
    if (!performanceTracks.has(actor.group.id)) return 1;
    const point = actor.activity?.segmentPoint;
    if (!point) return 0;
    return MathUtils.clamp(actor.track.inertias?.[point] ?? 0, 0, 1);
  }
  function snapToActivityGoal(actor: LifeActor) {
    const goal = actor.activity?.goal;
    if (!goal) return;
    actor.current.copy(goal);
    actor.previous.copy(goal);
    actor.velocity.set(0, 0, 0);
    actor.speed = 0;
    actor.roadSpeed = 0;
    if (!actor.region || !actor.agentId) return;
    const agent = regions.get(actor.region)?.simulation.agents[actor.agentId];
    if (!agent) return;
    agent.position[0] = goal.x; agent.position[1] = goal.y; agent.position[2] = goal.z;
    agent.velocity.fill(0);
  }
  function updateRoad(actor: LifeActor) {
    const roads = roadNetworks.get(actor.group.id);
    let edge = roads?.edges[actor.roadEdge];
    if (!roads || !edge) return;
    const activity = actor.activity;
    if (!activity || activity.phase !== "travel" || actor.mind.machine.in("alert") || actor.mind.machine.in("flee")) return;
    let desired = movementSpeed(actor);
    const inertia = movementInertia(actor);
    if (activity) {
      let remaining = edge.length - actor.roadDistance;
      if (activity.roadCursor >= activity.roadPath.length && actor.roadEdge === activity.roadGoalEdge) remaining = Math.max(0, activity.roadGoalDistance - actor.roadDistance);
      else for (let index = activity.roadCursor; index < activity.roadPath.length; index++) remaining += index === activity.roadPath.length - 1 ? activity.roadGoalDistance : roads.edges[activity.roadPath[index]!]!.length;
      const finalLeg = activity.leg >= (planFor(actor.group)!.steps[activity.step]!.via?.length ?? 0);
      if (finalLeg) desired = Math.min(desired, Math.sqrt(Math.max(0, remaining) * 4));
      if (remaining < 0.05 && activity.goal && actor.roadEdge === activity.roadGoalEdge && activity.roadCursor >= activity.roadPath.length) {
        actor.roadDistance = activity.roadGoalDistance;
        const gap = actor.current.distanceTo(activity.goal);
        if (inertia <= 0) { actor.current.copy(activity.goal); actor.roadSpeed = 0; }
        else actor.current.lerp(activity.goal, gap > 0.001 ? Math.min(1, actor.group.speed * fixedStep / gap) : 1);
        return;
      }
    }
    const rain = document?.weather ? (document.weather.layers?.rain ?? Number(document.weather.condition === "rain")) * document.weather.intensity : 0;
    desired *= 1 - rain * 0.35;
    const forward = Math.atan2(edge.direction.x, edge.direction.z);
    for (const other of actors) {
      if (other === actor || Math.abs(other.current.y - actor.current.y) > Math.max(1, other.height * 0.5)) continue;
      direction.copy(other.current).sub(actor.current);
      const ahead = direction.x * Math.sin(forward) + direction.z * Math.cos(forward);
      const lateral = Math.abs(direction.x * Math.cos(forward) - direction.z * Math.sin(forward));
      const gap = actor.radius + other.radius + 0.6;
      if (ahead > -0.3 && ahead < Math.max(12, gap + 4) && lateral < Math.min(2, other.radius + 0.7)) desired = Math.min(desired, Math.max(0, (ahead - gap) * 0.8));
      if (other.group.locomotion === "road" && other.id < actor.id && other.speed > 0.2 && actor.current.distanceTo(other.current) < gap + 1 && actor.roadDistance > edge.length - 3) desired = Math.min(desired, other.speed);
    }
    const deceleration = 5 + (1 - inertia) * 55;
    const acceleration = 1.4 + (1 - inertia) * 18;
    actor.roadSpeed = MathUtils.damp(actor.roadSpeed, desired, desired < actor.roadSpeed ? deceleration : acceleration, fixedStep);
    if (!actor.roadSpeed) return;
    actor.roadDistance += actor.roadSpeed * fixedStep;
    if (activity && activity.roadCursor >= activity.roadPath.length && actor.roadEdge === activity.roadGoalEdge) actor.roadDistance = Math.min(actor.roadDistance, activity.roadGoalDistance);
    let transitions = 0;
    while (actor.roadDistance >= edge.length && !(activity && activity.roadCursor >= activity.roadPath.length && actor.roadEdge === activity.roadGoalEdge) && transitions++ < 12) {
      actor.roadDistance -= edge.length;
      const next = activity.roadPath[activity.roadCursor++];
      if (next === undefined || roads.edges[next]?.from !== edge.to) { blockActivity(actor, "活动道路路径已失效，等待重新规划。"); return; }
      actor.roadEdge = next;
      edge = roads.edges[actor.roadEdge]!;
      if (activity && activity.roadCursor >= activity.roadPath.length && actor.roadEdge === activity.roadGoalEdge) { actor.roadDistance = Math.min(actor.roadDistance, activity.roadGoalDistance); break; }
    }
    lifeRoadPoint(edge, actor.roadDistance, destination);
    const distance = actor.current.distanceTo(destination);
    actor.current.lerp(destination, distance > 0.001 ? Math.min(1, actor.roadSpeed * fixedStep / distance) : 1);
  }
  function updateAir(actor: LifeActor) {
    const speed = movementSpeed(actor);
    if (actor.activity && !actor.mind.machine.in("flee") && !actor.mind.machine.in("alert") && actor.activity.phase !== "travel") { actor.velocity.set(0, 0, 0); return; }
    direction.set(0, 0, 0);
    if (actor.mind.target && speed) {
      direction.copy(actor.mind.target).sub(actor.current);
      const distance = direction.length();
      direction.multiplyScalar(distance > 0.001 ? Math.min(speed, actor.activity ? distance * 2 : speed) / distance : 0);
    }
    for (const other of actors) {
      if (other === actor) continue;
      destination.copy(actor.current).sub(other.current);
      const distance = destination.length();
      const separation = actor.radius + other.radius + 0.5;
      if (distance > 0.001 && distance < separation) direction.addScaledVector(destination, (separation - distance) / distance * 2);
    }
    const inertia = movementInertia(actor);
    if (inertia <= 0) actor.velocity.copy(direction);
    else actor.velocity.lerp(direction, 1 - Math.exp(-fixedStep * 4 * (0.25 + inertia * 0.75)));
    destination.copy(actor.current).addScaledVector(actor.velocity, fixedStep);
    clampTarget(actor.group, destination);
    // 沿线：每一步都贴回地面，不被其他物体挡住。
    if (actor.group.groundFollow) { destination.y = getTerrainHeight(document?.terrain, destination.x, destination.z); actor.current.copy(destination); return; }
    direction.copy(destination).sub(actor.current);
    const travelSquared = direction.lengthSq();
    if (travelSquared > 1e-10) flightRay.set(actor.current, direction.normalize());
    // ACT: 飞行采用三维转向和连续盒体拦截，尚不求解全局三维绕障；计划受阻明确等待，普通漫游才重选目标。
    if (travelSquared > 1e-10 && obstacles.some(box => {
      flightBounds.copy(box).expandByScalar(actor.radius);
      const hit = flightRay.intersectBox(flightBounds, flightHit);
      return flightBounds.containsPoint(destination) || !!hit && hit.distanceToSquared(actor.current) <= travelSquared;
    })) { actor.velocity.set(0, 0, 0); if (actor.activity && !actor.mind.machine.in("flee")) blockActivity(actor, "飞行活动路线受阻，等待重新安排路线。"); else actor.mind.machine.changeTo("idle"); return; }
    actor.current.copy(destination);
  }
  function step(worldClock: number) {
    steppedTime += fixedStep;
    updateObjectAnimation(steppedTime, true);
    for (const actor of actors) {
      actor.previous.copy(actor.current);
      const state = actor.activity;
      if (!actor.started && actor.scheduledAt !== undefined && worldClock >= actor.scheduledAt) actor.started = true;
      if (state && !actor.started) {
        state.waiting = true;
        if (state.phase === "dwell") state.until += fixedStep;
        stopActor(actor);
        if (actor.region && actor.agentId) crowd.removeAgent(regions.get(actor.region)!.simulation, actor.agentId);
        actor.agentId = undefined; actor.region = undefined;
        if (!actor.mind.machine.in("idle")) actor.mind.machine.changeTo("idle");
        continue;
      }
      if (state?.waiting) {
        state.waiting = false;
        state.checked = false;
        if (!connectActorNavigation(actor)) blockActivity(actor, "当前位置没有可通行表面，请调整原模型位置或动线。");
      }
      sense(actor);
      updateActivity(actor);
      actor.mind.machine.update();
      if (actor.region && actor.agentId) {
        const agent = regions.get(actor.region)!.simulation.agents[actor.agentId];
        if (agent) {
          agent.maxSpeed = movementSpeed(actor);
          // ACT: 演绎轨道惯性为0时用高加速度，转向和急停不再拖出长弧线；普通生命群组保持原平滑手感。
          if (performanceTracks.has(actor.group.id)) agent.maxAcceleration = 40 - movementInertia(actor) * 35;
        }
      }
    }
    syncProxies();
    for (const region of regions.values()) if (region.navMesh) crowd.update(region.simulation, region.navMesh, fixedStep);
    for (const actor of actors) {
      if (!actor.started) continue;
      if (actor.region && actor.agentId) {
        const agent = regions.get(actor.region)!.simulation.agents[actor.agentId];
        if (agent) {
          const next = new Vector3(...agent.position).addScaledVector(up, heightOffset(actor.group));
          if (actor.group.locomotion === "ground" && (!bodyMovementClear(actor, actor.current, next, actor.heading + (actor.sideways ? Math.PI / 2 : 0), true) || actor.sideways && !bodyMovementClear(actor, actor.current, next, actor.heading + Math.PI / 2, false, true))) {
            agent.position[0] = actor.current.x; agent.position[1] = actor.current.y; agent.position[2] = actor.current.z;
            if (actor.activity) blockActivity(actor, "真实身体与通道或正在运动的物体相交，请等待开门完成或调整落点。");
          } else actor.current.copy(next);
        }
        if (agent?.targetState === crowd.AgentTargetState.FAILED && actor.activity?.phase === "travel" && !actor.mind.machine.in("flee")) blockActivity(actor, "活动路径执行失败，已原地等待重新规划。");
        if (actor.group.locomotion === "water") actor.current.y = Math.max(actor.current.y, getTerrainHeight(document?.terrain, actor.current.x, actor.current.z) + 0.04);
      } else if (actor.group.locomotion === "road") updateRoad(actor);
      else if (actor.group.locomotion === "air") updateAir(actor);
      if (actor.traversal) updateTraversal(actor);
      actor.velocity.copy(actor.current).sub(actor.previous).multiplyScalar(1 / fixedStep);
      actor.speed = actor.velocity.length();
      if (Math.hypot(actor.velocity.x, actor.velocity.z) > 0.05) {
        const yaw = Math.atan2(actor.velocity.x, actor.velocity.z);
        const turn = Math.atan2(Math.sin(yaw - actor.heading), Math.cos(yaw - actor.heading)) * 0.35;
        if (!actor.sideways || [0.25, 0.5, 0.75, 1].every(fraction => bodyMovementClear(actor, actor.current, actor.current, actor.heading + turn * fraction + Math.PI / 2, false, true))) actor.heading += turn;
      }
      faceActivity(actor);
    }
  }
  function groundSupport(point: Vector3) {
    // ACT: 只修正导航体素附近的真实支撑面；跨层或没有真实踏面时保留导航高度，不吸附动态姿态。
    const tolerance = 0.15;
    const terrain = getTerrainHeight(document?.terrain, point.x, point.z);
    const terrainSupported = Math.abs(terrain - point.y) <= tolerance;
    let height = terrainSupported ? terrain : undefined;
    let distance = terrainSupported ? Math.abs(terrain - point.y) : Infinity;
    supportBounds.min.set(point.x, point.y - tolerance, point.z);
    supportBounds.max.set(point.x, point.y + tolerance, point.z);
    const models = [...supportIndex.query(supportBounds).keys()].map(id => supportModels.get(id)!);
    if (models.length) {
      supportRay.ray.origin.set(point.x, point.y + tolerance, point.z);
      supportRay.ray.direction.set(0, -1, 0);
      supportRay.far = tolerance * 2;
      for (const hit of intersectSupportObjects(supportRay, models)) {
        if (!(hit.object instanceof Mesh) || !hit.face) continue;
        let visible = true;
        for (let node: Object3D | null = hit.object; node && node !== scene; node = node.parent) if (!node.visible) { visible = false; break; }
        const material = Array.isArray(hit.object.material) ? hit.object.material[hit.face.materialIndex] : hit.object.material;
        if (!visible || !material?.visible || material.opacity <= 0) continue;
        supportMatrix.copy(hit.object.matrixWorld);
        if (hit.object instanceof InstancedMesh && hit.instanceId !== undefined) {
          hit.object.getMatrixAt(hit.instanceId, supportMatrix);
          supportMatrix.premultiply(hit.object.matrixWorld);
        }
        supportNormal.copy(hit.face.normal).applyNormalMatrix(supportNormalMatrix.getNormalMatrix(supportMatrix));
        const delta = Math.abs(hit.point.y - point.y);
        if (supportNormal.y < Math.cos(42 * Math.PI / 180) || delta > tolerance || delta >= distance) continue;
        height = hit.point.y;
        distance = delta;
      }
    }
    return height;
  }
  function renderedGroundHeight(actor: LifeActor, point: Vector3) {
    const cached = supportCache.get(actor.id);
    if (cached && cached.x === point.x && cached.y === point.y && cached.z === point.z) return cached.height;
    const height = groundSupport(point) ?? point.y;
    supportCache.set(actor.id, { x: point.x, y: point.y, z: point.z, height });
    return height;
  }
  function syncSupportIndex(movingObjects: ReadonlySet<string>, force = false) {
    const attached = objectAnimation.getAttachedIds();
    const supports = document!.objects.flatMap(object => {
      const model = templates.get(object.id);
      return object.visible && !movingObjects.has(object.id) && !attached.has(object.id) && model ? [{ id: object.id, model }] : [];
    });
    const next = JSON.stringify(supports.map(({ id, model }) => [id, model.uuid, model.children.map(child => child.uuid), model.matrixWorld.elements]));
    if (!force && next === supportSignature) return;
    supportIndex.clear(); supportModels.clear(); supportCache.clear();
    for (const { id, model } of supports) {
      model.updateWorldMatrix(true, true);
      supportModels.set(id, model);
      supportIndex.set(id, { bounds: new Box3().setFromObject(model), parts: [] });
    }
    supportSignature = next;
  }
  function updateObjectAnimation(time: number, allowStart = false, force = false, allowContact = true) {
    const changed = objectAnimation.render(time, allowStart, allowContact);
    if (force) for (const id of objectAnimation.getObjectIds()) changed.add(id);
    if (!changed.size || !document) return;
    const attached = objectAnimation.getAttachedIds();
    const next = JSON.stringify([...objectAnimation.getObjectIds()].map(id => [id, attached.has(id) ? null : templates.get(id)?.matrixWorld.elements]));
    if (objectNavigationSignature === next) return;
    objectNavigationSignature = next;
    for (const id of changed) { const model = templates.get(id); if (model) invalidateLifeNavigationGeometry(model); }
    const moving = new Set([...performanceTracks.values()].filter(track => track.enabled !== false).flatMap(track => trackMembers.get(track.id) ?? []));
    navigationGeometry.models = document.objects.flatMap(object => {
      const model = templates.get(object.id);
      return object.visible && !object.navigation && !moving.has(object.id) && !attached.has(object.id) && model ? [model] : [];
    });
    // 对象动作只在终态或拿起时重接导航；开合中不逐帧烘焙，也不让角色穿过尚未打开的门。
    regions.clear(); siteCache.clear(); anchorCache.clear();
    for (const actor of actors) {
      actor.region = undefined; actor.agentId = undefined; actor.seekPlan = undefined;
      if (actor.traversal?.phase === "approach") actor.traversal = undefined;
      if (actor.activity) { actor.activity.checked = false; actor.activity.retryAt = 0; }
      actor.mind.tree?.clearSubgoals(); actor.mind.tree = undefined;
    }
    syncSupportIndex(moving, true);
    reconnectNavigation();
    refreshActorObjects();
  }
  function groundDisplayHeight(actor: LifeActor, target: number) {
    const display = actor.groundDisplay;
    const delta = display ? targetTime - display.time : 0;
    // 跳转重建、时间倒退或暂停编辑直接采用目标；同一时刻重复绘制不推进过渡。
    if (!display || delta < 0 || delta === 0 && display.target !== target) actor.groundDisplay = { height: target, target, time: targetTime };
    else if (delta > 0) {
      display.height = MathUtils.damp(display.height, target, 20, delta);
      display.target = target;
      display.time = targetTime;
    }
    return actor.groundDisplay!.height;
  }
  function restoreSidePose(group: Group) {
    for (const saved of sidePoses.get(group) ?? []) { saved.bone.quaternion.copy(saved.quaternion); saved.bone.position.copy(saved.position); }
    sidePoses.delete(group);
  }
  function applySidePose(group: Group) {
    const saved: { bone: Object3D; quaternion: Quaternion; position: Vector3 }[] = [];
    group.traverse(bone => {
      if (bone.type !== "Bone") return;
      saved.push({ bone, quaternion: bone.quaternion.clone(), position: bone.position.clone() });
      if (bone.name === "hips") { bone.position.set(0, 0.9, 0); bone.quaternion.identity(); }
      else if (/spine|chest|neck|head|ForeArm|Hand|Fingers/.test(bone.name)) bone.quaternion.identity();
      else if (/UpperArm/.test(bone.name)) bone.quaternion.setFromEuler(new Euler(0, 0, bone.name.startsWith("left") ? -0.15 : 0.15));
      else if (/Thigh|Shin|Foot|Toe/.test(bone.name)) bone.quaternion.slerp(new Quaternion(), 0.85);
    });
    sidePoses.set(group, saved);
  }
  function drawActors() {
    const alpha = MathUtils.clamp((targetTime - steppedTime) / fixedStep, 0, 1);
    for (const actor of actors) {
      const group = actor.visual.group;
      restoreSidePose(group);
      group.position.lerpVectors(actor.previous, actor.current, alpha);
      if (actor.started && actor.group.locomotion === "ground" && actor.traversal?.phase !== "flight") group.position.y = groundDisplayHeight(actor, renderedGroundHeight(actor, group.position));
      group.position.sub(direction.copy(actor.bodyOffset).applyAxisAngle(up, actor.heading));
      group.position.y -= actor.baseOffset;
      if (group.parent) group.parent.worldToLocal(group.position);
      rotation.setFromAxisAngle(up, actor.heading + (actor.sideways ? Math.PI / 2 : 0));
      if (actor.group.locomotion === "road") {
        const edge = roadNetworks.get(actor.group.id)?.edges[actor.roadEdge];
        if (edge) rotation.multiply(new Quaternion().setFromAxisAngle(pitchAxis, -Math.asin(MathUtils.clamp(edge.direction.y, -1, 1))));
      }
      rotation.multiply(actor.tilt);
      if (group.parent) rotation.premultiply(group.parent.getWorldQuaternion(parentRotation).invert());
      group.quaternion.copy(rotation);
      const activity = actor.activity?.phase === "dwell" && !actor.mind.machine.in("alert") && !actor.mind.machine.in("flee") ? planFor(actor.group)?.steps[actor.activity.step] : undefined;
      const action: LifeAction = actor.mind.machine.in("alert") ? "alert" : activity ? activity.action === "wait" ? "idle" : activity.action === "observe" ? "alert" : activity.action : !actor.activity && actor.mind.machine.in("idle") && actor.group.behavior === "forage" ? "graze" : actor.speed > 0.05 ? "walk" : "idle";
      const event = activity && actor.track.events?.find(event => activity.id === "point" + event.at);
      const elapsed = activity ? Math.max(0, activity.duration - (actor.activity!.until - targetTime)) : 0;
      const sourceTime = Math.min(event?.sourceOut ?? Infinity, (event?.sourceIn ?? 0) + elapsed * (event?.rate ?? 1));
      const motion = event?.motion && activity ? { motion: event.motion, time: sourceTime, duration: event.motion.keyframes.at(-1)!.time } : undefined;
      let library = actor.sideways && actor.speed > 0.05 ? { name: "cc0CrouchWalk", time: targetTime * 0.6 } : event?.animation ? { name: event.animation, time: sourceTime } : undefined;
      if (actor.traversal?.phase === "flight") {
        const flight = actor.traversal, elapsed = Math.max(0, targetTime - flight.start), fraction = MathUtils.clamp(elapsed / flight.duration, 0, 1);
        const name = flight.kind === "climb" ? "cc0ClimbUp" : fraction < 0.2 ? "cc0JumpStart" : fraction > 0.8 ? "cc0JumpLand" : "cc0JumpLoop";
        const duration = getCharacterAnimation(name)?.duration ?? 1;
        library = { name, time: duration * (flight.kind === "climb" ? fraction : fraction < 0.2 ? fraction / 0.2 : fraction > 0.8 ? (fraction - 0.8) / 0.2 : (fraction - 0.2) / 0.6) };
      }
      actor.visual.animate(targetTime, actor.speed, action, skeletalObjectIds.has(actor.objectId) || capsuleObjectIds.has(actor.objectId) ? motion : undefined, library, event?.rate);
      if (actor.sideways && !motion) applySidePose(group);
      group.updateWorldMatrix(false, false);
      actor.worldMatrix.copy(group.matrixWorld);
      // ACT: 一组只运行一份导航，成员复用主物体的刚性变换；不改父层级、不逐帧重算几何。
      for (const member of actor.members) {
        const source = member.visual.group;
        memberMatrix.multiplyMatrices(group.matrixWorld, member.relative);
        if (source.parent) {
          source.parent.updateWorldMatrix(true, false);
          memberMatrix.premultiply(memberParentInverse.copy(source.parent.matrixWorld).invert());
        }
        memberMatrix.decompose(source.position, source.quaternion, source.scale);
        member.visual.animate(targetTime, actor.speed, action, skeletalObjectIds.has(member.objectId) || capsuleObjectIds.has(member.objectId) ? motion : undefined, library, event?.rate);
        source.updateWorldMatrix(false, false);
      }
    }
    updateObjectAnimation(targetTime);
  }
  function getSeekPlan(actor: LifeActor) {
    const cached = actor.seekPlan;
    if (cached?.group === actor.group) return cached;
    // 每次同步会编译新的 group。只有换组时才比较动线内容；通行几何变更时由 sync 主动作废。
    const signature = JSON.stringify([actor.signature, actor.track.segmentSeconds, actor.group.speed, actor.group.plan, actor.group.parkour, actor.initialPoint]);
    if (cached?.signature === signature) {
      cached.group = actor.group;
      return cached;
    }
    const heading = bodyShape(actor.group)!.heading;
    const firstPoint = actor.track.points[0]!;
    // ACT: 演绎的定位起点就是首点，避免时间轴定位时先从模型编辑位置走向首点。
    const origin = performanceTracks.has(actor.group.id) ? new Vector3(firstPoint[0], firstPoint[1], firstPoint[2]) : actor.editTransform.position.clone();
    if (!performanceTracks.has(actor.group.id)) {
      actor.visual.group.parent?.localToWorld(origin);
      origin.add(new Vector3().copy(actor.bodyOffset).applyAxisAngle(up, heading));
      origin.y += actor.baseOffset;
    } else if (actor.group.locomotion === "ground") {
      origin.y = Math.max(origin.y, getTerrainHeight(document?.terrain, origin.x, origin.z));
    }
    const plan: SeekPlan = { group: actor.group, signature, origin, heading, legs: [], duration: 0, cycle: 0, blocked: false };
    const mode = actor.group.locomotion;
    const region = mode === "ground" || mode === "water" ? getRegion(actor.group) : undefined;
    const roads = mode === "road" ? getRoads(actor.group) : undefined;
    let previous: LifeSite = { point: origin.clone() };
    if (region?.navMesh) {
      previous.nearest = findNearestPoly(createFindNearestPolyResult(), region.navMesh, origin.clone().addScaledVector(up, -heightOffset(actor.group)).toArray(), [Math.max(0.6, actor.radius), 2, Math.max(0.6, actor.radius)], DEFAULT_QUERY_FILTER);
      // 飞檐走壁的人从屋脊、墙头起步：下面那块导航面不是他的起点。
      if (canParkour(actor) && previous.nearest.success && (Math.abs(previous.nearest.position[1] - origin.y) > 0.35 || Math.hypot(previous.nearest.position[0] - origin.x, previous.nearest.position[2] - origin.z) > 0.35)) previous.nearest = undefined;
    } else if (roads) previous.road = roadSite(actor.group, origin, Math.max(2, actor.radius));
    const count = actor.track.points.length;
    for (let index = 0; index < count + Number(actor.track.loop === true && count > 1); index++) {
      const point = index % count;
      const state = activityFromPoint(actor.group, point);
      const activity = planFor(actor.group)!.steps[state.step]!;
      const clipOrigin = state.leg === 0 && activity.clipOrigin ? clipOriginSite({ ...actor, sideways: false }, activity) : undefined;
      if (state.leg === 0 && activity.clipOrigin && !clipOrigin) { plan.legs.push({ point, path: [], length: 0, seconds: 0, hold: 0 }); plan.blocked = true; break; }
      if (clipOrigin) previous = clipOrigin;
      const site = computeActivitySite({ ...actor, sideways: false }, activity, state.leg);
      let path: Vector3[] = [];
      let sideways = false;
      let traversal: SeekLeg["traversal"];
      if (site && region?.navMesh && previous.nearest?.success && site.nearest?.success) {
        const nodes = findNodePath(region.navMesh, previous.nearest.nodeRef, site.nearest.nodeRef, previous.nearest.position, site.nearest.position, DEFAULT_QUERY_FILTER);
        if (nodes.success && nodes.flags & FindNodePathResultFlags.COMPLETE_PATH) {
          const straight = findStraightPath(region.navMesh, previous.nearest.position, site.nearest.position, nodes.path, undefined, FindStraightPathOptions.ALL_CROSSINGS);
          if (straight.success && !(straight.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED))) path = straight.path.map(value => new Vector3(...value.position).addScaledVector(up, heightOffset(actor.group)));
        }
        if (!path.length && mode === "ground" && skeletalObjectIds.has(actor.objectId) && !actor.members.length && navigationProfile(actor.group, true)!.radius < actor.radius - 0.04) {
          const narrow = getRegion(actor.group, true).navMesh;
          if (narrow) {
            const from = findNearestPoly(createFindNearestPolyResult(), narrow, previous.point.toArray(), [0.15, 0.5, 0.15], DEFAULT_QUERY_FILTER);
            const to = findNearestPoly(createFindNearestPolyResult(), narrow, site.point.toArray(), [0.15, 0.5, 0.15], DEFAULT_QUERY_FILTER);
            if (from.success && to.success) {
              const route = findNodePath(narrow, from.nodeRef, to.nodeRef, from.position, to.position, DEFAULT_QUERY_FILTER);
              if (route.success && route.flags & FindNodePathResultFlags.COMPLETE_PATH) {
                const straight = findStraightPath(narrow, from.position, to.position, route.path, undefined, FindStraightPathOptions.ALL_CROSSINGS);
                const points = straight.path.map(value => new Vector3(...value.position));
                if (straight.success && !(straight.flags & (FindStraightPathResultFlags.PARTIAL_PATH | FindStraightPathResultFlags.MAX_POINTS_REACHED)) && points.every((point, index) => !index || bodyMovementClear(actor, points[index - 1]!, point, Math.atan2(point.x - points[index - 1]!.x, point.z - points[index - 1]!.z) + Math.PI / 2, false, true))) { path = points; sideways = true; }
              }
            }
          }
        }
        if (!path.length) {
          const cross = localTraversal(actor, previous.point, site, activity);
          if (cross) {
            const prefix = cross.approach.reduce((sum, point, index) => sum + (index ? point.distanceTo(cross.approach[index - 1]!) : 0), 0);
            const length = cross.path.reduce((sum, point, index) => sum + (index ? point.distanceTo(cross.path[index - 1]!) : 0), 0);
            path = [...cross.approach, ...cross.path.slice(1), ...cross.remainder.slice(1)];
            traversal = { fromDistance: prefix, toDistance: prefix + length, state: { kind: cross.kind, phase: "flight", path: cross.path.map(point => point.toArray()), start: 0, duration: cross.duration, heading: cross.heading } };
          }
        }
      } else if (site?.road && previous.road && roads) {
        const route = roadPath(roads, previous.road.edge, previous.road.distance, site.road.edge, site.road.distance);
        if (route) {
          path = [previous.road.point.clone()];
          if (route.length) path.push(lifeRoadPoint(roads.edges[previous.road.edge]!, roads.edges[previous.road.edge]!.length, new Vector3()));
          for (const [cursor, edge] of route.entries()) {
            path.push(lifeRoadPoint(roads.edges[edge]!, 0, new Vector3()), lifeRoadPoint(roads.edges[edge]!, cursor === route.length - 1 ? site.road.distance : roads.edges[edge]!.length, new Vector3()));
          }
          path.push(site.point.clone());
        }
      } else if (site && mode === "air" && !airObstructed(previous.point, site.point, actor.radius)) path = [previous.point.clone(), site.point.clone()];
      const teleport = index > 0 && !!actor.track.teleports?.includes(index - 1);
      // ACT: 飞檐走壁：起点站在屋脊、墙头上也算站好；之后每段走不通或绕远就换成飞身的抛物线（和live播放同一套判断）。
      let leapSeconds: number | undefined;
      if (site && !teleport && canParkour(actor)) {
        if (index === 0 && !path.length && previous.point.distanceTo(site.point) <= 0.3) path = [previous.point.clone(), site.point.clone()];
        else if (index > 0 && prefersLeap(previous.point, site.point, path.length ? path.reduce((sum, value, cursor) => sum + (cursor ? value.distanceTo(path[cursor - 1]!) : 0), 0) : Infinity)) {
          const leap = leapArc(actor, previous.point, site.point, actor.track.segmentSeconds?.[index - 1] ?? 0);
          if (leap) {
            path = leap.path; sideways = false; leapSeconds = leap.duration;
            const arc = leap.path.reduce((sum, value, cursor) => sum + (cursor ? value.distanceTo(leap.path[cursor - 1]!) : 0), 0);
            traversal = { fromDistance: 0, toDistance: arc, state: { kind: "leap", phase: "flight", path: leap.path.map(point => point.toArray()), start: 0, duration: leap.duration, heading: leap.heading } };
          }
        }
      }
      if (teleport && site) path = [site.point.clone()];
      const length = path.reduce((sum, value, cursor) => sum + (cursor ? value.distanceTo(path[cursor - 1]!) : 0), 0);
      const seconds = teleport ? 0 : (index ? actor.track.segmentSeconds?.[index - 1] : 0) || (leapSeconds ?? length / actor.group.speed);
      const hold = index < count && state.leg === (activity.via?.length ?? 0) ? activity.duration : 0;
      plan.legs.push({ point, site, path, length, seconds, hold, sideways, traversal });
      if (!site || !path.length) { plan.blocked = true; break; }
      plan.duration += seconds + hold;
      previous = site;
    }
    plan.cycle = actor.track.loop && !plan.blocked ? plan.duration - (plan.legs[0]?.seconds ?? 0) : 0;
    actor.seekPlan = plan;
    return plan;
  }
  // ACT: 演绎动线实际走的路：导航绕行后的折线（上楼梯、绕栏杆、进门），按经过的路径点分腿；走不到时 blocked 为真，最后一腿就是走不到的那个点。
  function getWalkRoute(trackId: string): { legs: { target: [number, number, number]; path: [number, number, number][] }[]; blocked: boolean } | undefined {
    const actor = actors.find(item => item.group.id === trackId);
    if (!actor || !performanceTracks.has(trackId) || actor.group.locomotion === "air" || !bodyShape(actor.group)) return undefined;
    const plan = getSeekPlan(actor);
    return {
      legs: plan.legs.map(leg => ({ target: [...actor.track.points[leg.point]!] as [number, number, number], path: leg.path.map(point => [point.x, point.y, point.z] as [number, number, number]) })),
      blocked: plan.blocked,
    };
  }
  function getPlaybackRange() {
    if ((!actors.length && !objectAnimation.getObjectIds().size) || lastWorldClock === undefined) return undefined;
    const baseline = lastWorldClock - targetTime;
    let start = Infinity, end = -Infinity;
    for (const actor of actors) {
      const time = actor.scheduledAt ?? lastWorldClock;
      const raw = rawPerformanceTracks.find(track => track.id === actor.group.id);
      const object = document?.objects.find(object => object.id === actor.objectId);
      let delay = 0;
      if (raw && object) for (const clip of getPerformanceClips(raw, object)) {
        const actual = objectAnimation.getClipStart(raw.id, clip.id);
        if (actual !== undefined) delay = Math.max(delay, baseline + actual - time - clip.start);
      }
      start = Math.min(start, time);
      end = Math.max(end, time + getSeekPlan(actor).duration + delay, actor.activity?.phase === "dwell" ? baseline + actor.activity.until : -Infinity);
    }
    for (const group of objectAnimation.getStatus(targetTime)) start = Math.min(start, baseline + (group.startTime ?? targetTime));
    if (!Number.isFinite(start)) start = baseline;
    end = Math.max(end, baseline + objectAnimation.duration());
    return { start, end };
  }
  // ACT: 跳转按导航路段和事件采样，不重演历史拥堵；恢复播放继续使用 Navcat 实时避障。
  function seek(worldSeconds: number, starts?: Record<string, number>, preview = false) {
    if (disposed || !Number.isFinite(worldSeconds)) return false;
    lastWorldClock ??= worldSeconds;
    for (const actor of actors) if (actor.scheduledAt === undefined) {
      if (Number.isFinite(starts?.[actor.group.id])) actor.scheduledAt = starts![actor.group.id];
      else scheduleActor(actor);
    }
    const range = getPlaybackRange();
    if (!range) return false;
    const baseline = lastWorldClock - targetTime;
    lastWorldClock = worldSeconds;
    // ACT: 内部允许负的预卷时间，回到较早轨道起点时不能重定义世界时间基准。
    steppedTime = targetTime = worldSeconds - baseline;
    objectAnimation.setClock(worldSeconds, targetTime);
    objectAnimation.reset(true);
    for (const actor of actors) {
      const raw = rawPerformanceTracks.find(track => track.id === actor.group.id);
      const object = document!.objects.find(object => object.id === actor.objectId);
      if (raw && object) for (const clip of getPerformanceClips(raw, object)) if (clip.enabled !== false) objectAnimation.notify(raw.id, clip.id, (actor.scheduledAt! - baseline) + clip.start);
    }
    updateObjectAnimation(targetTime, true, true, false);
    if (!samplingSeekContacts) {
      const requestedTime = targetTime;
      const pending = objectAnimation.getContactRequests(requestedTime);
      if (pending.length) {
        samplingSeekContacts = true;
        try {
          // ACT: 只采有效拾取窗口的17个真实姿态点，不补演漫长历史；每个点仍执行同一个0.35米接触检查。
          for (const contact of pending) for (let index = 0; index <= 16; index++) {
            if (!objectAnimation.getContactRequests(requestedTime).some(item => item.trackId === contact.trackId && item.clipId === contact.clipId)) break;
            const at = MathUtils.lerp(contact.start, contact.end, index / 16);
            if (!seek(baseline + at, starts, true)) return false;
          }
          return seek(worldSeconds, starts, preview);
        } finally { samplingSeekContacts = false; }
      }
    }
    // 按住播放头时仅把计划位置投影到可走面。松手会统一重接人群，取消则还原拖前快照。
    if (!preview) for (const region of regions.values()) { region.simulation = crowd.create(8); region.proxies.clear(); }
    for (const actor of actors) {
      const plan = getSeekPlan(actor);
      actor.groundDisplay = undefined;
      actor.traversal = undefined;
      actor.mind.tree?.clearSubgoals(); actor.mind.tree = undefined;
      actor.agentId = actor.region = undefined;
      actor.heading = plan.heading;
      actor.current.copy(plan.origin);
      actor.speed = actor.roadSpeed = 0; actor.velocity.set(0, 0, 0);
      const elapsed = worldSeconds - actor.scheduledAt!;
      actor.started = elapsed >= 0;
      let remaining = Math.max(0, elapsed), loops = 0;
      const entry = plan.legs[0]?.seconds ?? 0;
      if (plan.cycle > 0 && remaining >= entry) { loops = Math.floor((remaining - entry) / plan.cycle); remaining = entry + (remaining - entry) % plan.cycle; }
      let selected = plan.legs[0]!, finished = false, holding = false;
      for (let index = 0; actor.started && index < plan.legs.length; index++) {
        selected = plan.legs[index]!;
        if (!selected.path.length) break;
        actor.current.copy(selected.path[selected.path.length - 1]!);
        for (let cursor = selected.path.length - 1; cursor > 0; cursor--) {
          direction.copy(selected.path[cursor]!).sub(selected.path[cursor - 1]!);
          if (direction.lengthSq() > 1e-10) { actor.heading = Math.atan2(direction.x, direction.z); break; }
        }
        if (remaining < selected.seconds) {
          let distance = selected.length * remaining / selected.seconds;
          const totalDistance = distance;
          for (let cursor = 1; cursor < selected.path.length; cursor++) {
            const from = selected.path[cursor - 1]!, to = selected.path[cursor]!, length = from.distanceTo(to);
            if (distance <= length && length > 0) {
              actor.current.copy(from).lerp(to, distance / length);
              actor.velocity.copy(to).sub(from).multiplyScalar(selected.length / selected.seconds / length);
              actor.speed = actor.velocity.length(); actor.heading = Math.atan2(actor.velocity.x, actor.velocity.z);
              break;
            }
            distance -= length;
          }
          if (selected.traversal && totalDistance >= selected.traversal.fromDistance && totalDistance <= selected.traversal.toDistance) {
            const { fromDistance, toDistance, state } = selected.traversal;
            const fraction = (totalDistance - fromDistance) / (toDistance - fromDistance);
            actor.traversal = { ...structuredClone(state), start: steppedTime - fraction * state.duration };
            const cursor = fraction * (state.path.length - 1), index = Math.min(state.path.length - 2, Math.floor(cursor));
            actor.current.set(...state.path[index]!).lerp(new Vector3(...state.path[index + 1]!), cursor - index);
            actor.heading = state.heading;
          }
          break;
        }
        remaining -= selected.seconds;
        if (remaining < selected.hold) { holding = true; break; }
        remaining -= selected.hold;
        finished = index === plan.legs.length - 1;
      }
      const state = actor.activity = activityFromPoint(actor.group, selected.point);
      const selectedActivity = planFor(actor.group)!.steps[state.step]!;
      if (selectedActivity.clipOrigin && selectedActivity.clipId) state.originClip = selectedActivity.clipId + ":" + loops;
      actor.sideways = selected.sideways && !holding && !finished;
      state.loopCount = loops + Number(selected === plan.legs[plan.legs.length - 1] && plan.legs.length > actor.track.points.length);
      state.segmentPoint = selected.point; state.segmentLoop = state.loopCount; state.segmentLength = selected.length;
      state.goal = selected.site?.point;
      state.waiting = !actor.started;
      if (holding) { state.phase = "dwell"; state.until = steppedTime + selected.hold - remaining; }
      else if (finished) state.phase = "done";
      if (selected.site?.road) { state.roadGoalEdge = selected.site.road.edge; state.roadGoalDistance = selected.site.road.distance; }
      actor.mind.machine.changeTo(actor.speed ? "move" : "idle");
      if (actor.started && (!connectActorNavigation(actor, preview) || !selected.path.length)) blockActivity(actor, "动线在此处不可达，请调整路径点。");
      if ((holding || finished) && selected.site?.road) { actor.roadEdge = selected.site.road.edge; actor.roadDistance = selected.site.road.distance; }
      if (actor.region && actor.agentId) actor.current.set(...regions.get(actor.region)!.simulation.agents[actor.agentId]!.position).addScaledVector(up, heightOffset(actor.group));
      actor.previous.copy(actor.current);
      restoreSidePose(actor.visual.group);
      actor.visual.restore({ lastTime: 0, distance: 0 });
      for (const member of actor.members) member.visual.restore({ lastTime: 0, distance: 0 });
    }
    for (const actor of actors) faceActivity(actor, true);
    drawActors();
    return true;
  }
  function resetSimulation() {
    objectAnimation.reset();
    // 内部时间下面归零：直接控制的轨道和导航的人一起从头排期。
    objectAnimation.reschedule(0);
    stoppedProgress.clear();
    clearActors();
    updateObjectAnimation(0, false, true);
    for (const region of regions.values()) { region.simulation = crowd.create(8); region.proxies.clear(); }
    steppedTime = targetTime = 0;
    adjustPopulation();
    for (const actor of actors) { actor.started = true; actor.scheduledAt = lastWorldClock; }
  }
  function advanceTo(seconds: number, fromClock: number, toClock: number) {
    const previous = targetTime;
    targetTime = seconds;
    while (steppedTime + fixedStep <= targetTime + 1e-8) {
      const fraction = MathUtils.clamp((steppedTime + fixedStep - previous) / (targetTime - previous), 0, 1);
      step(MathUtils.lerp(fromClock, toClock, fraction));
    }
    drawActors();
  }
  function connectActorNavigation(actor: LifeActor, preview = false) {
    if (actor.group.locomotion === "air" || actor.traversal?.phase === "flight" || actor.agentId) return true;
    if (actor.group.locomotion === "road") {
      getRoads(actor.group);
      const site = roadSite(actor.group, actor.current, Math.max(2, actor.radius));
      if (!site) return false;
      actor.roadEdge = site.edge;
      actor.roadDistance = site.distance;
    } else {
      const region = getRegion(actor.group, actor.sideways);
      const position = actor.current.clone();
      position.y -= heightOffset(actor.group);
      const nearest = region.navMesh && findNearestPoly(createFindNearestPolyResult(), region.navMesh, position.toArray(), [Math.max(0.6, actor.radius), 2, Math.max(0.6, actor.radius)], DEFAULT_QUERY_FILTER);
      // 飞檐走壁的人站在屋脊、墙头这类没有导航面的顶面上：不接导航，原地站着，下一段再飞身。
      if (canParkour(actor) && (!nearest?.success || Math.abs(nearest.position[1] - position.y) > 0.35 || Math.hypot(nearest.position[0] - position.x, nearest.position[2] - position.z) > 0.35)) return true;
      if (!nearest?.success) return false;
      if (preview) actor.current.set(...nearest.position).addScaledVector(up, heightOffset(actor.group));
      else addNavigationActor(actor, region, nearest.position);
    }
    return true;
  }
  function clipOriginSite(actor: LifeActor, activity: LifeActivity): LifeSite | undefined {
    if (!activity.clipOrigin) return undefined;
    const point = new Vector3(activity.clipOrigin.x, activity.clipOrigin.y, activity.clipOrigin.z);
    if (!insideArea(actor.group, point)) return undefined;
    if (actor.group.locomotion === "air" && actor.group.groundFollow) { point.y = getTerrainHeight(document?.terrain, point.x, point.z); return { point }; }
    if (actor.group.locomotion === "air") return !airObstructed(point, point, actor.radius) && bodyMovementClear(actor, point, point, actor.heading) ? { point } : undefined;
    if (actor.group.locomotion === "road") { const road = roadSite(actor.group, point, 0.3); return road ? { point: road.point, road } : undefined; }
    const region = getRegion(actor.group, actor.sideways);
    const query = point.clone().addScaledVector(up, -heightOffset(actor.group));
    const nearest = region.navMesh && findNearestPoly(createFindNearestPolyResult(), region.navMesh, query.toArray(), [0.25, 0.5, 0.25], DEFAULT_QUERY_FILTER);
    if (!nearest?.success || Math.hypot(nearest.position[0] - query.x, nearest.position[2] - query.z) > 0.25 || Math.abs(nearest.position[1] - query.y) > 0.5) return canParkour(actor) ? perchSite(actor, point) : undefined;
    point.set(...nearest.position).addScaledVector(up, heightOffset(actor.group));
    if (actor.group.locomotion === "ground" && (groundSupport(point) === undefined || !bodyMovementClear(actor, point, point, actor.heading + (actor.sideways ? Math.PI / 2 : 0), false, true))) return undefined;
    return { point, nearest };
  }
  function reconnectNavigation() {
    for (const actor of actors) {
      if (actor.group.locomotion === "air" || actor.agentId) continue;
      const connected = connectActorNavigation(actor);
      actor.previous.copy(actor.current);
      if (actor.activity) {
        actor.activity.checked = false;
        actor.mind.tree?.clearSubgoals();
        actor.mind.tree = undefined;
        if (!connected) blockActivity(actor, "通行表面发生变化，当前位置暂不可达，请调整动线。");
        else if (actor.activity.phase === "travel") actor.mind.machine.changeTo("idle");
      } else actor.mind.machine.changeTo("idle");
    }
  }
  function sync(value: SceneDocument, blocked: Box3[], sources = new Map<string, Object3D>(), terrainObstacles: Box3[] = []) {
    if (disposed) return;
    bindingSignatures.clear();
    const next = getSceneLife(value.life);
    const rawTracks = getPerformanceTracks(value.life, value.objects, value.objectGroups);
    const controlledObjects = new Set(rawTracks.filter(track => track.controller === "object").map(track => track.objectId));
    actors = actors.filter(actor => {
      const object = value.objects.find(object => object.id === actor.objectId);
      const source = sources.get(actor.objectId);
      if (object && source instanceof Group && actor.editTransform.signature !== editTransformSignature(object)) actor.editTransform = readEditTransform(source, object);
      for (const member of actor.members) {
        const object = value.objects.find(object => object.id === member.objectId);
        const source = sources.get(member.objectId);
        member.repositioned = !!object && member.editTransform.signature !== editTransformSignature(object);
        if (object && source instanceof Group && member.repositioned) member.editTransform = readEditTransform(source, object);
      }
      // 接管前先归还导航持有的编辑初态，避免直接控制把上一帧的运行位置当成初态。
      if (controlledObjects.has(actor.objectId)) { removeActor(actor); return false; }
      for (const member of actor.members) if (controlledObjects.has(member.objectId)) {
        member.visual.dispose();
        const source = member.visual.group;
        source.position.copy(member.editTransform.position);
        source.quaternion.copy(member.editTransform.quaternion);
        source.scale.copy(member.editTransform.scale);
        source.updateWorldMatrix(true, true);
        if (source.userData.performanceTrackId === actor.group.id) delete source.userData.performanceTrackId;
        // 仍由后面的rebindActor移出成员，保留其余成员及主物体的导航进度。
      }
      return true;
    });
    objectAnimation.sync(value, rawTracks, sources);
    if (lastWorldClock !== undefined) objectAnimation.setClock(lastWorldClock, targetTime);
    rawPerformanceTracks = rawTracks.filter(track => track.controller !== "object");
    const tracks = rawPerformanceTracks.map(track => materializePerformanceTrack(track, value.objects.find(object => object.id === track.objectId)!));
    performanceTracks = new Map(tracks.map(track => [track.id, track]));
    trackMembers = new Map(tracks.map(track => [track.id, [...getPerformanceObjectIds(track.objectId, value.objectGroups)].filter(id => id === track.objectId || !controlledObjects.has(id))]));
    next.groups = compilePerformanceTracks(rawPerformanceTracks, value.objects);
    const visibleObjects = new Set(value.objects.filter(object => object.visible).map(object => object.id));
    const movingObjects = new Set(next.enabled ? tracks.filter(track => track.enabled !== false && visibleObjects.has(track.objectId)).flatMap(track => trackMembers.get(track.id) ?? []) : []);
    navigationGeometry = { models: value.objects.flatMap(object => {
      const source = sources.get(object.id);
      return object.visible && !object.navigation && !movingObjects.has(object.id) && source ? [source] : [];
    }), boxes: terrainObstacles };
    const seekRequested = document !== undefined && next.seed !== settings.seed;
    if (!next.enabled || seekRequested) stoppedProgress.clear();
    for (const id of stoppedProgress.keys()) if (!performanceTracks.has(id)) stoppedProgress.delete(id);
    for (const id of bodyShapes.keys()) if (!performanceTracks.has(id)) bodyShapes.delete(id);
    // ACT: 只有世界通行几何改变才重建共享导航；方案开关、追加群组及播放设置不能重置其它活动。
    const signature = JSON.stringify([value.terrain, value.objects.filter(object => object.visible && object.navigation).map(object => [object.id, object.position, object.rotation, object.scale, object.navigation]), boxesSignature(blocked), navigationGeometry.models.map(model => [model.uuid, model.matrixWorld.elements])]);
    const rebuild = signature !== structuralSignature;
    document = value;
    templates = sources;
    skeletalObjectIds = new Set(value.objects.filter(object => object.asset.shape === "riggedPerson").map(object => object.id));
    capsuleObjectIds = new Set(value.objects.filter(object => object.asset.shape === "person").map(object => object.id));
    obstacles = blocked;
    settings = next;
    const spatial = JSON.stringify(value.objects.map(object => {
      const source = sources.get(object.id);
      source?.updateWorldMatrix(true, false);
      return [object.id, object.position, object.rotation, object.scale, object.visible, source?.uuid, !activeObjectIds.has(object.id) && source?.matrixWorld.toArray()];
    }));
    const spatialChanged = rebuild || spatial !== spatialSignature;
    if (spatialChanged) { anchorCache.clear(); spatialSignature = spatial; }
    const sites = JSON.stringify(next.groups.map(group => [group.id, group.plan, group.visual, group.routeObjectId, group.enabled, group.count, group.center, group.radius, group.verticalOffset, group.parkour]));
    if (spatialChanged || sites !== siteSignature) { siteCache.clear(); siteSignature = sites; }
    routePlans.clear();
    for (const group of next.groups) compileRoutePlan(group);
    shapeSignatures.clear();
    bindingSignatures.clear();
    if (rebuild) {
      // 增量接管物体会移除它的静态障碍；只重建导航，保留已有个体的动线进度。
      regions.clear(); roadNetworks.clear(); roadSignatures.clear(); sharedRoadNetworks.clear();
      for (const actor of actors) { actor.agentId = undefined; actor.region = undefined; actor.seekPlan = undefined; }
      structuralSignature = signature;
    }
    if (seekRequested) resetSimulation();
    else { adjustPopulation(); if (rebuild) reconnectNavigation(); }
    syncSupportIndex(movingObjects, rebuild);
    drawActors();
  }
  // ACT: 只读探测：按将要同步的文档推出需要哪些导航网格，登记其中还没算过的块；不动个体、物件动画和已建好的网格。
  // 推导与 sync 里准备导航的那段保持一致（不一致也只是少预热几块，真正 sync 时照旧同步补齐）。探测时临时换上新文档的状态，结束后原样换回。
  let probedSignature = "";
  const probedRegions = new Set<string>();
  function probeNavigation(value: SceneDocument, blocked: Box3[], sources: Map<string, Object3D>, terrainObstacles: Box3[]) {
    const next = getSceneLife(value.life);
    if (!next.enabled) return;
    const saved = { settings, document, templates, obstacles, navigationGeometry, performanceTracks, rawPerformanceTracks, trackMembers, routePlans: new Map(routePlans), shapeSignatures: new Map(shapeSignatures), bindingSignatures: new Map(bindingSignatures) };
    try {
      const rawTracks = getPerformanceTracks(value.life, value.objects, value.objectGroups);
      const controlledObjects = new Set(rawTracks.filter(track => track.controller === "object").map(track => track.objectId));
      rawPerformanceTracks = rawTracks.filter(track => track.controller !== "object");
      const tracks = rawPerformanceTracks.map(track => materializePerformanceTrack(track, value.objects.find(object => object.id === track.objectId)!));
      performanceTracks = new Map(tracks.map(track => [track.id, track]));
      trackMembers = new Map(tracks.map(track => [track.id, [...getPerformanceObjectIds(track.objectId, value.objectGroups)].filter(id => id === track.objectId || !controlledObjects.has(id))]));
      next.groups = compilePerformanceTracks(rawPerformanceTracks, value.objects);
      const visibleObjects = new Set(value.objects.filter(object => object.visible).map(object => object.id));
      const movingObjects = new Set(tracks.filter(track => track.enabled !== false && visibleObjects.has(track.objectId)).flatMap(track => trackMembers.get(track.id) ?? []));
      navigationGeometry = { models: value.objects.flatMap(object => {
        const source = sources.get(object.id);
        return object.visible && !object.navigation && !movingObjects.has(object.id) && source ? [source] : [];
      }), boxes: terrainObstacles };
      const signature = JSON.stringify([value.terrain, value.objects.filter(object => object.visible && object.navigation).map(object => [object.id, object.position, object.rotation, object.scale, object.navigation]), boxesSignature(blocked), navigationGeometry.models.map(model => [model.uuid, model.matrixWorld.elements])]);
      document = value; templates = sources; obstacles = blocked; settings = next;
      routePlans.clear();
      for (const group of next.groups) compileRoutePlan(group);
      shapeSignatures.clear(); bindingSignatures.clear();
      // 同一套通行几何下已经探测过的网格不再重复规划；改轨道、改机位这类不动几何的同步，探测几乎不花时间。
      if (signature !== probedSignature) { probedRegions.clear(); probedSignature = signature; }
      for (const group of next.groups) {
        if (!isGroupEnabled(group) || !group.count || group.locomotion !== "ground" && group.locomotion !== "water") continue;
        if (!planFor(group) && group.routeObjectId && group.locomotion === "ground" || awaitingPlan(group)) continue;
        const sourceObjectId = group.visual.kind === "object" ? group.visual.objectId : undefined;
        if (sourceObjectId && (!sources.has(sourceObjectId) || !value.objects.some(object => object.id === sourceObjectId))) continue;
        // ACT: 侧身网格（窄处侧身通过用）也一起预热：restore 每次都要建它，不预热时第一次截图、导出会在这里同步卡住好几秒。
        for (const sideways of [false, true]) {
          const key = regionKey(group, sideways);
          if (probedRegions.has(key)) continue;
          probedRegions.add(key);
          if (signature === structuralSignature && regions.has(key)) continue;
          try { buildLifeNavMesh(value, { ...next, ...navigationArea(group) }, navigationGeometry, group.locomotion === "water" ? "water" : "ground", navigationProfile(group, sideways)); }
          catch { /* 探测模式下生成处必然抛错，缺的块已登记 */ }
        }
      }
    } finally {
      ({ settings, document, templates, obstacles, navigationGeometry, performanceTracks, rawPerformanceTracks, trackMembers } = saved);
      routePlans.clear(); for (const [id, plan] of saved.routePlans) routePlans.set(id, plan);
      shapeSignatures.clear(); for (const [id, signature] of saved.shapeSignatures) shapeSignatures.set(id, signature);
      bindingSignatures.clear(); for (const [id, signature] of saved.bindingSignatures) bindingSignatures.set(id, signature);
    }
  }
  /** 下一次 sync 要用的导航网格里还有没算过的块时，返回一个分片补算的 Promise（完成后再 sync 就不卡）；都算过则返回 undefined，直接 sync 即可。 */
  function prepareNavigation(value: SceneDocument, blocked: Box3[], sources = new Map<string, Object3D>(), terrainObstacles: Box3[] = [], signal?: AbortSignal) {
    if (disposed) return undefined;
    let work: ReturnType<typeof collectMissingNavTiles>;
    try { work = collectMissingNavTiles(() => probeNavigation(value, blocked, sources, terrainObstacles)); }
    catch { return undefined; }
    return work.length ? buildNavTiles(work, signal) : undefined;
  }
  function animate(worldSeconds: number, paused = false, worldClock = worldSeconds, clockJump = false) {
    if (disposed || !Number.isFinite(worldClock)) return false;
    const previous = lastWorldClock;
    lastWorldClock = worldClock;
    objectAnimation.setClock(worldClock, targetTime);
    for (const actor of actors) {
      if (actor.scheduledAt === undefined) {
        if (actor.started) actor.scheduledAt = worldClock;
        else scheduleActor(actor);
      }
      // ACT: 场景时间被文档改动跳变（换氛围、一键布景、按场次标题定日夜、AI提案）：没指定开演时刻的路线整体跟着平移同样的时长，
      // 相对进度不变；否则成片区间还锚在旧时刻，时间轴会从旧时刻一直拉到新时刻（例如8小时）、监看落在黑场。拖动定位、预览时不改。
      else if (clockJump && !paused && previous !== undefined && actor.track.startAt === undefined) actor.scheduledAt += worldClock - previous;
      if (clockJump && actor.scheduledAt !== undefined && worldClock >= actor.scheduledAt) actor.started = true;
    }
    if (paused || !settings.enabled || !settings.running || previous === undefined || clockJump) return false;
    // ACT: 每帧最多 10 个 0.05 世界秒的物理步；超高世界倍率下运动慢于时钟，丢弃超预算路程，避免补帧卡死或瞬移。
    const elapsed = Math.max(0, Math.min(fixedStep * 10, worldClock - previous));
    if (!elapsed) return false;
    advanceTo(targetTime + elapsed, previous, worldClock);
    const objectAnimated = objectAnimation.isAnimating();
    return !!actors.length || objectAnimated;
  }
  function snapshot(): WorldLifeSnapshot {
    return {
      signature: structuralSignature, settingsSignature: JSON.stringify(settings), targetTime, steppedTime, lastWorldClock,
      objectAnimation: objectAnimation.snapshot(),
      regions: [...regions.values()].map(region => ({ key: region.key, navMesh: region.navMesh, simulation: cloneLifeState(region.simulation), proxies: [...region.proxies] })),
      actors: actors.map(actor => ({ id: actor.id, index: actor.index, groupId: actor.group.id, signature: actor.signature, sideways: actor.sideways, traversal: actor.traversal && structuredClone(actor.traversal), groundDisplay: actor.groundDisplay && { ...actor.groundDisplay }, radius: actor.radius, height: actor.height, region: actor.region, agentId: actor.agentId, roadEdge: actor.roadEdge, roadDistance: actor.roadDistance, roadSpeed: actor.roadSpeed, scheduledAt: actor.scheduledAt, started: actor.started, initialPoint: actor.initialPoint?.toArray(), previous: actor.previous.toArray(), current: actor.current.toArray(), velocity: actor.velocity.toArray(), speed: actor.speed, heading: actor.heading, state: states.find(state => actor.mind.machine.in(state)) ?? "idle", random: actor.mind.random.state, until: actor.mind.until, senseAt: actor.mind.senseAt, repathAt: actor.mind.repathAt, ...(actor.mind.target ? { target: actor.mind.target.toArray() } : {}), ...(actor.mind.threat ? { threat: actor.mind.threat.toArray() } : {}), patrol: actor.mind.patrol, ...(actor.activity ? { activity: { ...actor.activity, goal: actor.activity.goal?.toArray(), roadPath: [...actor.activity.roadPath], ...(actor.mind.tree ? { tree: { status: actor.mind.tree.status, nodes: actor.mind.tree.subgoals.map(goal => ({ node: (goal as LifeGoal).node, status: goal.status })) } } : {}) } } : {}), visual: actor.visual.snapshot(), members: actor.members.map(member => ({ objectId: member.objectId, visual: member.visual.snapshot() })) })),
    };
  }
  function restore(value: WorldLifeSnapshot) {
    if (disposed || value.signature !== structuralSignature || value.settingsSignature !== JSON.stringify(settings)) return false;
    const groups = new Map(settings.groups.map(group => [group.id, group]));
    for (const group of groups.values()) if (group.locomotion === "ground" || group.locomotion === "water") { getRegion(group); getRegion(group, true); }
    if (value.regions.some(saved => !regions.has(saved.key)) || value.actors.some(saved => !groups.has(saved.groupId) || shapeSignature(groups.get(saved.groupId)!) !== saved.signature)) return false;
    if (value.objectAnimation && !objectAnimation.restore(value.objectAnimation)) return false;
    objectNavigationSignature = "";
    const moving = new Set([...performanceTracks.values()].flatMap(track => trackMembers.get(track.id) ?? []));
    const attached = objectAnimation.getAttachedIds();
    navigationGeometry.models = document!.objects.flatMap(object => { const source = templates.get(object.id); return object.visible && !object.navigation && !moving.has(object.id) && !attached.has(object.id) && source ? [source] : []; });
    syncSupportIndex(moving, true);
    for (const saved of value.regions) { const region = regions.get(saved.key)!; if (saved.navMesh) region.navMesh = saved.navMesh; region.simulation = cloneLifeState(saved.simulation); region.proxies = new Map(saved.proxies); }
    const previous = new Map(actors.map(actor => [actor.id, actor]));
    const restored: LifeActor[] = [];
    for (const saved of value.actors) {
      let actor = previous.get(saved.id);
      if (!actor || actor.signature !== saved.signature) {
        if (actor) removeActor(actor, false);
        actor = createActor(groups.get(saved.groupId)!, saved.index, saved);
      }
      if (!actor) return false;
      previous.delete(saved.id);
      actor.group = groups.get(saved.groupId)!;
      actor.sideways = saved.sideways;
      actor.traversal = saved.traversal && structuredClone(saved.traversal);
      actor.groundDisplay = saved.groundDisplay && { ...saved.groundDisplay };
      actor.radius = saved.radius; actor.height = saved.height; actor.region = saved.region; actor.agentId = saved.agentId;
      actor.roadEdge = saved.roadEdge; actor.roadDistance = saved.roadDistance;
      actor.roadSpeed = saved.roadSpeed ?? saved.speed;
      actor.scheduledAt = saved.scheduledAt; actor.started = saved.started;
      const initialPoint = saved.initialPoint ? new Vector3().fromArray(saved.initialPoint) : undefined;
      if (initialPoint ? !actor.initialPoint?.equals(initialPoint) : actor.initialPoint !== undefined) {
        actor.seekPlan = undefined;
        siteCache.clear();
      }
      actor.initialPoint = initialPoint;
      actor.previous.fromArray(saved.previous); actor.current.fromArray(saved.current); actor.velocity.fromArray(saved.velocity);
      actor.speed = saved.speed; actor.heading = saved.heading;
      actor.mind.machine.currentState = actor.mind.machine.get(saved.state);
      actor.mind.random.state = saved.random; actor.mind.until = saved.until; actor.mind.senseAt = saved.senseAt; actor.mind.repathAt = saved.repathAt;
      actor.mind.target = saved.target ? new Vector3().fromArray(saved.target) : undefined;
      actor.mind.threat = saved.threat ? new Vector3().fromArray(saved.threat) : undefined;
      actor.mind.patrol = saved.patrol;
      actor.mind.tree?.clearSubgoals();
      actor.mind.tree = undefined;
      actor.activity = undefined;
      if (saved.activity) {
        const { tree, ...activity } = saved.activity;
        actor.activity = { ...activity, goal: activity.goal ? new Vector3().fromArray(activity.goal) : undefined, roadPath: [...activity.roadPath] };
        if (tree) buildActivityTree(actor, tree);
      }
      restoreSidePose(actor.visual.group);
      actor.visual.restore(saved.visual);
      for (const member of actor.members) {
        const visual = saved.members?.find(saved => saved.objectId === member.objectId)?.visual;
        if (visual) member.visual.restore(visual);
      }
      restored.push(actor);
    }
    for (const actor of previous.values()) removeActor(actor, false);
    actors = restored;
    refreshActorObjects();
    targetTime = value.targetTime; steppedTime = value.steppedTime; lastWorldClock = value.lastWorldClock;
    drawActors();
    return true;
  }
  function describeActivity(actor: LifeActor) {
    const state = actor.activity;
    if (!state) return undefined;
    if (!actor.started) {
      const start = actor.track.startAt ?? 0;
      const tomorrow = Math.floor((actor.scheduledAt ?? 0) / 86400) > Math.floor((lastWorldClock ?? 0) / 86400);
      const time = [Math.floor(start / 3600), Math.floor(start / 60) % 60, start % 60].map(value => String(value).padStart(2, "0")).join(":");
      return "等待世界时间 · " + (tomorrow ? "明天 " : "") + time;
    }
    const activity = planFor(actor.group)!.steps[state.step]!;
    const label = { travel: "前往", dwell: "正在", done: "已完成", blocked: "等待" }[state.phase];
    const via = activity.via?.length ?? 0;
    return label + activity.label + (state.phase === "travel" && state.leg < via ? ` · 途经 ${state.leg + 1}/${via}` : "");
  }
  function getStatus(): LifeStatus {
    const groups: LifeStatus["groups"] = settings.groups.map(group => {
      // 一条演绎只绑定一个真实场景物体，复用绑定索引读取其状态。
      const actor = group.visual.kind === "object" ? objectActors.get(group.visual.objectId) : undefined;
      const blocked = actor?.activity?.blocked || groupMessages.get(group.id);
      const activity = actor && describeActivity(actor) || (isGroupEnabled(group) && awaitingPlan(group) ? "等待 AI 安排活动" : undefined);
      return { id: group.id, name: group.name, count: actor ? 1 : 0, startTime: actor?.scheduledAt, completed: actor?.activity?.phase === "done", requested: isGroupEnabled(group) ? group.count : 0, ...(activity ? { activity } : {}), ...(blocked ? { blocked } : {}) };
    });
    const baseline = lastWorldClock === undefined ? 0 : lastWorldClock - targetTime;
    groups.push(...objectAnimation.getStatus(targetTime).map(group => ({ ...group, startTime: group.startTime === undefined ? undefined : baseline + group.startTime })));
    const first = groups.find(group => group.blocked);
    const missingTarget = settings.enabled && !first && settings.groups.find(group => isGroupEnabled(group) && group.count && !scheduled(group) && group.behavior === "pursue" && !document?.objects.some(object => object.id === group.targetObjectId) && !actors.some(actor => actor.group.id === group.id && closestRelated(actor, group.targetTags)));
    return { playbackRange: getPlaybackRange(), pedestrians: 0, vehicles: 0, animals: 0, groups, roads: [...roadNetworks.values()].reduce((total, roads) => total + roads.edges.length / 2, 0), message: first ? first.name + "：" + first.blocked : missingTarget ? missingTarget.name + "：" + noTargetMessage : "" };
  }
  function getAnchorPosition(anchor: LifeAnchor) { const point = resolveAnchor(anchor); return point ? { x: point.x, y: point.y, z: point.z } : undefined; }
  function dispose() { if (disposed) return; disposed = true; clearActors(); objectAnimation.dispose(); stoppedProgress.clear(); bodyShapes.clear(); regions.clear(); roadNetworks.clear(); roadSignatures.clear(); sharedRoadNetworks.clear(); routePlans.clear(); anchorCache.clear(); siteCache.clear(); supportIndex.clear(); supportModels.clear(); supportCache.clear(); }
  // restart：整场演绎从此刻重新开演（不改随机种子）：Agent 结果落地后让新旧轨道、直接控制的物件和成片镜头对齐到同一个起点。
  return { sync, prepareNavigation, animate, seek, restart: () => { if (!disposed && lastWorldClock !== undefined) { resetSimulation(); drawActors(); } }, getPlaybackRange, getWalkRoute, snapshot, restore, getTime: () => Math.max(0, targetTime), getStatus, getClipStatuses: () => objectAnimation.getClipStatuses(targetTime), getAnchorPosition, getTrackObjectIds, getActorObjects: (): readonly PerformanceActorObject[] => actorObjects, getActiveObjectIds: (): ReadonlySet<string> => activeObjectIds, dispose };
}

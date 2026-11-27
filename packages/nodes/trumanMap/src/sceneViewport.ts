import {
  ACESFilmicToneMapping, AmbientLight, AxesHelper, Box3, Box3Helper, BoxGeometry, BufferGeometry,
  CapsuleGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight, Euler, Float32BufferAttribute, Fog, Frustum,
  GridHelper, Group, HemisphereLight, InstancedMesh, Line, LineBasicMaterial, LoadingManager, MathUtils, Mesh,
  Matrix3, Matrix4, MeshBasicMaterial, MeshStandardMaterial, MOUSE, PCFShadowMap, PerspectiveCamera, Plane, PlaneGeometry,
  Quaternion, Raycaster, RingGeometry, Scene, Shape, Path, ShapeGeometry, SphereGeometry, SRGBColorSpace, TorusGeometry, Vector2, Vector3, WebGLRenderer,
} from "three";
import type { Intersection, Material } from "three";
import { Object3D } from "three";
import { parseGltfModel } from "./gltfModelLoader";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TransformControls } from "three/addons/controls/TransformControls.js";
import { createCollisionShape, measureCollisionBounds, transformCollisionShape, translateCollisionBody, intersectsCollision, sweepCollision, getCollisionLift, createCollisionIndex } from "./sceneCollision";
import type { CollisionBody, CollisionShape } from "./sceneCollision";
import { insideSolid } from "./solidProbe";
import { capsuleHipHeight, capsuleJointNames, capsuleRigName } from "./capsuleRig";
import { parseSceneDocument } from "./sceneValidation";
import { disposeObject, retainMeshGeometry } from "./sceneResources";
import { createTerrain, getTerrainHeight, getTerrainWaterLevel, paintTerrain, reconcileTerrainWater, type TerrainBrush } from "./terrainModel";
import { createTerrainSurface } from "./terrainSurface";
import { flushTerrainPaint } from "./terrainPaint";
import { getTerrainSurfaceId } from "./terrainSurfaces";
import { createWorldWeather, getWeatherEnvironment } from "./worldWeather";
import { advanceSceneTime, getSceneTime } from "./worldTime";
import { createWorldCelestials } from "./worldCelestials";
import { createWorldLife } from "./worldLife";
import { createSceneCameras, type EditedCameraPath } from "./sceneCameras";
import { applyHandheld, curveSteps, getCameraTrackingAt, filmAspect, filmFormats, getFilmSize, setFilmFormat, getCameraFov, getCameraShotAt, getCamerasDuration, getPathCurve, getProgramCamera, minFilmSeconds, sampleSceneCamera, smoothStroke, toPathAnchors, trackingDefaults } from "./cameraDocument";
import type { CameraFraming, CameraPose, CameraTracking, PathPoint, SceneCamera } from "./cameraDocument";
import { encodeCanvas } from "./exportBundle";
import { createPerformanceOverlay, matchWalkSegments, type PerformanceLabel, type RouteWalk } from "./performanceOverlay";
import { getClipRoute } from "./performanceClips";
import { getPerformanceObjectIds, getPerformanceSubjectIds, getPerformanceTracks, type PerformanceTrack } from "./performanceDocument";
import { getLifeGroups, type LifeAnchor, type LifeStatus } from "./lifeDocument";
import { buildLifePlanningContext } from "./lifePlanning";
import { getPerformanceEffectParts } from "./performanceEffects";
import { usesNativeScale } from "./assetLibrary";
import { getAssetPlacementScale, isVegetationAsset } from "./assetMetadata";
import { createObjectWeather } from "./objectWeather";
import { createStaticSceneBatches } from "./staticSceneBatches";
import { createModelGroup, modelPartBatches, type ModelDefinition } from "./modelGeometry";
import { resolveAssetModel } from "./assetModelResolver";
import { createRiggedPerson } from "./riggedPerson";
import { createSceneBrushStroke } from "./sceneBrushStroke";
import type { SceneBrushSettings, SceneBrushStatus } from "./sceneBrushAssets";
import { defaultAtmosphere, getObjectGravityEnabled, sharesSceneContent } from "./sceneDocument";
import type {
  EditorTool, EditorView, SceneAnchor, SceneAsset, SceneDocument, SceneObject, SceneTerrain, SceneWeather, SceneTime, Vector3Value,
} from "./sceneDocument";

export { disposeObject } from "./sceneResources";

type ViewportOptions = {
  document: SceneDocument;
  pixelRatio?: number;
  showHelpers?: boolean;
  autoRender?: boolean;
  // ACT: 成片画幅是全局的（取景窗、视锥、镜头表都读它），只能由编辑器的主视口按用户的场景设定；
  // Agent 观察用的隐藏视口传 false：只按自己草稿的画幅出图，不改全局，否则用户刚换成竖屏，主视口就按草稿的横屏出图。
  globalFilmFormat?: boolean;
  loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>;
  canSelect?: () => boolean;
  canSimulateObjects?: () => boolean;
  onSelect: (id: string, additive?: boolean) => void;
  onMultiSelect?: (ids: string[], additive: boolean) => void;
  onTransform: (id: string, values: ObjectTransform) => void;
  /** 多选一起拖完：整批新位置一次交回，宿主只记一个撤销点。 */
  onTransformMany?: (items: { id: string; values: ObjectTransform }[]) => void;
  onViewChange: (view: EditorView) => void;
  onFovChange?: (fov: number) => void;
  onCameraSelect?: (id: string | null) => void;
  onCameraTransform?: (id: string, pose: { position: Vector3Value; target: Vector3Value }) => void;
  // 按住机位脚下的圈拖动划出的线（世界坐标点，已在机位高度上）。
  onCameraPathDraw?: (id: string, points: Vector3Value[]) => void;
  /** 拖动轨迹改形状后的整条新轨迹。 */
  onCameraPathEdit?: (id: string, shotId: string, points: PathPoint[]) => void;
  /** 点选了轨迹锚点（null为取消）；screen是选中锚点在画布上的位置，用来摆锚点卡片。 */
  onCameraAnchorSelect?: (anchor: { id: string; shotId: string; index: number } | null) => void;
  onCameraAnchorScreen?: (screen: { x: number; y: number } | null) => void;
  onFilmPreviewChange?: (active: boolean) => void;
  onWorldHourChange?: (hour: number) => void;
  onWorldTimeChange?: (time: SceneTime) => void;
  onLifeStatus?: (status: LifeStatus) => void;
  onPerformanceSelect?: (trackId: string, pointIndex?: number) => void;
  onPerformanceMove?: (trackId: string, pointIndex: number, position: Vector3Value) => void;
  /** 拖路线中间插了一个点：segment是插在第几段（第segment点之后）。 */
  onPerformanceInsert?: (trackId: string, segment: number, position: Vector3Value) => void;
  /** 双击路径点删除它。 */
  onPerformanceRemovePoint?: (trackId: string, pointIndex: number) => void;
  onPerformanceLabels?: (labels: PerformanceLabel[]) => void;
  onPerformanceDrawPoint?: (position: Vector3Value) => void;
  onPerformanceRouteStart?: () => void;
  /** 演绎里按住选中的物体拖出的一笔路线（已理顺、贴地，第一个点就是物体脚下）。 */
  onPerformanceStroke?: (objectId: string, points: Vector3Value[], appendTo?: string) => void;
  onPerformanceContinueRoute?: (trackId: string) => void;
  onPerformancePointScreen?: (screen: { x: number; y: number } | null) => void;
  onError: (message: string) => void;
  onObjectAnchor?: (anchor: ObjectAnchor | null) => void;
  onObjectPreview?: (id: string, values: ObjectTransform | null) => void;
  /** 正在“搬”一个物体（按住拖动）时为true，宿主据此显示按键提示。 */
  onObjectCarry?: (active: boolean) => void;
  onGravitySettled?: (placements: (ObjectTransform & { id: string })[]) => void;
  onSceneAnchor?: (anchor: SceneAnchor | null) => void;
  onTerrainChange?: (terrain: SceneTerrain) => void;
  onTerrainTreeSelect?: (index: number | null) => void;
  onSceneBrush?: (objects: SceneObject[]) => void;
  onSceneBrushError?: (message: string) => void;
  onSceneBrushStatus?: (status: SceneBrushStatus) => void;
};
type HeightPlacement = { height: number; gravityEnabled: boolean };
/** 成片时钟：time是成片第几秒，duration是成片总长。 */
type FilmClock = { time: number; duration: number };
// ACT: 选中物体的屏幕锚点同时给出顶部工具条位置、右侧悬浮手柄位置和每像素对应的世界高度。
export type ObjectAnchor = { x: number; y: number; handleX: number; handleY: number; metersPerPixel: number };
export type ObjectTransform = Pick<SceneObject, "position" | "rotation" | "scale"> & Partial<HeightPlacement>;
export type AssetPlacement = ObjectTransform & HeightPlacement & { valid: boolean; reason?: string };
type SceneRecord = { group: Group; object: SceneObject; signature: string; loadedSignature?: string; token: object; color: string; transformSignature: string; fallSpeed: number; resting: boolean; placementBounds?: Box3; collider?: CollisionBody; colliderMatrix?: Matrix4; weather?: ReturnType<typeof createObjectWeather> };
type ObjectLoadJob = { record: SceneRecord; object: SceneObject; signature: string; token: object; resolve: () => void };
type ObjectLift = {
  id: string;
  phase: "dragging" | "falling" | "settling";
  height: number;
  offset: number;
  started: number;
  position: Vector3;
  rotation: Euler;
  scale: Vector3;
  samplePosition: Vector3;
  sampleTime: number;
  velocity: Vector3;
  tilt: Vector2;
  tiltVelocity: Vector2;
  quaternion: Quaternion;
  pivotOffset: Vector3;
  footprint: number;
  bounce: number;
  collisions: boolean;
};
type AssetPlacementState = {
  asset: SceneAsset;
  group: Group;
  bounds?: Box3;
  loading: Promise<void>;
  value: AssetPlacement | null;
  materials: { material: MeshStandardMaterial | MeshBasicMaterial; color: Color }[];
};

const toVector = (value: Vector3Value) => new Vector3(value.x, value.y, value.z);
const toValue = (value: Vector3): Vector3Value => ({ x: value.x, y: value.y, z: value.z });

export function createAssetModelContent(asset: SceneAsset, model: Group, measuredBounds?: Box3): Group {
  model.updateMatrixWorld(true);
  const bounds = measuredBounds ?? measureCollisionBounds(model, new Box3());
  const size = bounds.getSize(new Vector3());
  const extent = Math.max(size.x, size.y, size.z);
  if (bounds.isEmpty() || !Number.isFinite(extent) || extent < 0.000001) { disposeObject(model); throw new Error("模型没有可显示的几何体"); }
  const center = bounds.getCenter(new Vector3());
  const pivot = new Group();
  pivot.add(model);
  if (asset.contentTransform) pivot.position.copy(toVector(asset.contentTransform.offset));
  else pivot.position.set(-center.x, -bounds.min.y, -center.z);
  const content = new Group();
  content.add(pivot);
  content.scale.setScalar(asset.contentTransform?.scale ?? (usesNativeScale(asset) ? 1 : getAssetPlacementScale(asset, size)));
  content.traverse(child => { if (child instanceof Mesh) { child.castShadow = true; child.receiveShadow = true; } });
  return content;
}

export function getSceneTerrainSupport(box: Box3, terrain?: SceneTerrain | null, contact?: Vector3) {
  if (!terrain) { contact?.set((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2); return 0; }
  let height = -Infinity;
  for (const x of [box.min.x, (box.min.x + box.max.x) / 2, box.max.x]) for (const z of [box.min.z, (box.min.z + box.max.z) / 2, box.max.z]) {
    const value = getTerrainHeight(terrain, x, z);
    if (value > height) { height = value; contact?.set(x, value, z); }
  }
  const step = terrain.size / terrain.segments;
  const firstX = Math.max(0, Math.ceil((box.min.x + terrain.size / 2) / step));
  const lastX = Math.min(terrain.segments, Math.floor((box.max.x + terrain.size / 2) / step));
  const firstZ = Math.max(0, Math.ceil((box.min.z + terrain.size / 2) / step));
  const lastZ = Math.min(terrain.segments, Math.floor((box.max.z + terrain.size / 2) / step));
  for (let z = firstZ; z <= lastZ; z++) for (let x = firstX; x <= lastX; x++) {
    const value = terrain.heights[z * (terrain.segments + 1) + x]!;
    if (value > height) { height = value; contact?.set(x * step - terrain.size / 2, value, z * step - terrain.size / 2); }
  }
  return height;
}

export function getSceneObjectHeight(object: SceneObject, bounds: Box3) {
  return object.height ?? bounds.min.y;
}

export function applySceneObjectPlacement(group: Group, object: SceneObject, terrain?: SceneTerrain | null) {
  group.position.copy(toVector(object.position));
  group.rotation.set(...[object.rotation.x, object.rotation.y, object.rotation.z].map(MathUtils.degToRad) as [number, number, number]);
  group.scale.copy(toVector(object.scale)); group.visible = object.visible;
  group.updateMatrixWorld(true);
  const bounds = measureCollisionBounds(group, new Box3());
  const height = getSceneObjectHeight(object, bounds);
  if (!bounds.isEmpty() && Number.isFinite(height)) group.position.y += height - bounds.min.y;
  group.updateMatrixWorld(true);
}

export function createPrimitive(asset: SceneAsset, color: string) {
  if (asset.shape === "riggedPerson") return createRiggedPerson(color);
  const group = new Group();
  const material = new MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.05 });
  // ACT: 胶囊人头部正面一条深色“眼带”标出朝向（白模预演惯例），截图里一眼分得清正面还是后脑勺；改衣色时不跟着变（fixedColor）。
  function addEyes(y: number, z: number) {
    const eyes = new Mesh(new BoxGeometry(0.17, 0.035, 0.05), new MeshStandardMaterial({ color: "#2b2f36", roughness: 0.6, metalness: 0.05 }));
    (eyes.material as MeshStandardMaterial).userData.fixedColor = true;
    eyes.position.set(0, y, z);
    eyes.castShadow = false;
    group.add(eyes);
  }
  function add(geometry: BufferGeometry, x = 0, y = 0, z = 0) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  if (asset.shape === "person") {
    // 胶囊人只有头、身子、脚三段：球头 + 单个胶囊身子 + 单个竖直脚胶囊，不生成手臂和双腿。
    // 三段挂在关节上（髋、身子、头、腿，见capsuleRig.ts），能坐、蹲、跪、弯腰、点头、倒地、走路摆腿；站着时位置和原来一样。
    const rig = new Group(); rig.name = capsuleRigName; group.add(rig);
    const joint = (name: string, parent: Object3D, y: number) => { const node = new Object3D(); node.name = name; node.position.y = y; parent.add(node); return node; };
    const hips = joint(capsuleJointNames.hips, rig, capsuleHipHeight);
    const torso = joint(capsuleJointNames.torso, hips, 0);
    const neck = joint(capsuleJointNames.head, torso, 1.44 - capsuleHipHeight);
    const leg = joint(capsuleJointNames.leg, hips, 0);
    const part = (parent: Object3D, geometry: BufferGeometry, y: number) => { add(geometry, 0, y); const mesh = group.children.at(-1)!; parent.attach(mesh); };
    part(neck, new SphereGeometry(0.15, 24, 16), 1.59);
    part(torso, new CapsuleGeometry(0.24, 0.44, 8, 24), 1.02);
    part(leg, new CapsuleGeometry(0.09, 0.44, 6, 16), 0.31);
    addEyes(1.6, 0.13);
    neck.attach(group.children.at(-1)!);
  } else if (asset.shape === "seatedPerson") {
    // ACT: 坐着的胶囊人（坐席群演）：头、身子坐在约0.45米高的座面上，大腿朝正面（+Z）平伸、小腿垂到地面；头顶约1.3米。
    add(new SphereGeometry(0.15, 24, 16), 0, 1.16, -0.06);
    add(new CapsuleGeometry(0.22, 0.22, 8, 24), 0, 0.76, -0.08);
    add(new CapsuleGeometry(0.1, 0.32, 6, 16).rotateX(Math.PI / 2), 0, 0.5, 0.14);
    add(new CapsuleGeometry(0.085, 0.3, 6, 16), 0, 0.24, 0.38);
    addEyes(1.17, 0.07);
  } else if (asset.shape === "kneelingPerson") {
    // ACT: 跪坐的胶囊人（书院、和室、灵堂跪拜、蒲团打坐）：小腿平贴地面往后，臀部坐在脚跟上，身子坐直，头顶约1.17米，正面朝+Z。
    add(new CapsuleGeometry(0.08, 0.36, 6, 16).rotateX(Math.PI / 2), 0, 0.08, -0.08);
    add(new CapsuleGeometry(0.1, 0.24, 6, 16).rotateX(Math.PI / 2), 0, 0.24, 0.06);
    add(new CapsuleGeometry(0.22, 0.2, 8, 24), 0, 0.6, -0.1);
    add(new SphereGeometry(0.15, 24, 16), 0, 1.02, -0.08);
    addEyes(1.03, 0.06);
  } else if (asset.shape === "sphere") {
    add(new SphereGeometry(0.75, 32, 20), 0, 0.75);
  } else if (asset.shape === "cylinder") {
    add(new CylinderGeometry(0.6, 0.6, 1.8, 32), 0, 0.9);
  } else if (asset.shape === "cuboid") {
    add(new BoxGeometry(2.4, 1.2, 1.2), 0, 0.6);
  } else if (asset.shape === "cone") {
    add(new ConeGeometry(0.75, 1.8, 32), 0, 0.9);
  } else if (asset.shape === "frustum") {
    add(new CylinderGeometry(0.4, 0.75, 1.5, 32), 0, 0.75);
  } else if (asset.shape === "torus") {
    add(new TorusGeometry(0.65, 0.2, 16, 48), 0, 0.85);
  } else if (asset.shape === "disc") {
    add(new CylinderGeometry(0.9, 0.9, 0.08, 48), 0, 0.04);
  } else if (asset.shape === "pyramid") {
    add(new ConeGeometry(1.5 / Math.sqrt(2), 1.5, 4).rotateY(Math.PI / 4), 0, 0.75);
  } else if (asset.shape === "capsule") {
    add(new CapsuleGeometry(0.4, 1, 8, 24), 0, 0.9);
  } else if (asset.shape === "backdrop") {
    // ACT: 活动墙（影棚第四面墙）：6×3.4米单面背景板，正面朝本地+Z。景里朝外拍的镜头看得到它；从背面（景外往里拍）看是透明的，射线也穿得过去，不挡全景。
    const panel = new Mesh(new PlaneGeometry(6, 3.4), material);
    panel.position.set(0, 1.7, 0);
    panel.receiveShadow = true;
    panel.userData.backdrop = true;
    group.add(panel);
  } else if (asset.shape === "plane") {
    add(new BoxGeometry(3, 0.08, 3), 0, 0.04);
  } else {
    add(new BoxGeometry(1.5, 1.5, 1.5), 0, 0.75);
  }
  return group;
}

export function createSceneViewport(canvas: HTMLCanvasElement, options: ViewportOptions) {
  let document = options.document;
  let disposed = false;
  let dirty = true;
  let helpersVisible = options.showHelpers !== false;
  let tool: EditorTool = "select";
  let selectedId = "";
  let selectedIds: string[] = [];
  let boxSelection: { pointer: number; x: number; y: number; start: Vector3Value; end: Vector3Value; additive: boolean; moved: boolean } | undefined;
  let selectedTerrainTree: number | null = null;
  let selectedTerrainSeed: number | undefined;
  let dragging = false;
  let wasDragging = false;
  let pendingViewSave = false;
  let viewSignature = JSON.stringify(document.view);
  let pointerStart: { x: number; y: number; button: number } | undefined;
  let navigationEnabled = false;
  let navigationTime = 0;
  const navigationSpeed = 6;
  let firstPersonLook: { pointerId: number; x: number; y: number; locked: boolean; yaw: number; pitch: number; time: number } | undefined;
  let firstPersonTail: { yaw: number; pitch: number; time: number } | undefined;
  const lookRotation = new Euler(0, 0, 0, "YXZ");
  let viewTransition: { from: EditorView; to: EditorView; start: number; duration: number } | undefined;
  let renderedFov: number | undefined;
  let cameraEditingId: string | null = null;
  let camerasVisible = false;
  let filmPreview = false;
  let cameraSignature = "";
  let filmWasRunning = false;
  // 只有机位、没有演绎时，成片第0秒对应的世界时刻。
  let cameraOrigin: number | undefined;
  const cameraOverrides = new Map<string, CameraFraming>();
  // 运镜预览：把成片里from到to这段机位运动在seconds秒内快速走一遍，只给取景窗看，不动世界时钟。
  let cameraShotSelected: { id: string; shotId: string } | undefined;
  // 画轨迹模式：在地面任意处按下拖动，就给这台机位划出轨迹。
  let cameraPathDrawing: string | null = null;
  // ACT: 改轨迹靠锚点：拖锚点挪位置；拖锚点之间的线就在那里加一个锚点并拖动；双击锚点删掉它。
  // lift为true时拖的是空中的锚点，只改高度；否则拖的是地上的点，只改水平位置（离地高度不变）。
  let pathEdit: { id: string; shotId: string; pointer: number; anchors: PathPoint[]; index: number; origin: PathPoint; plane: Plane; start: Vector3; screen: Vector2; changed: boolean; lift: boolean; preview?: readonly Vector3Value[] } | undefined;
  let anchorSelected: { id: string; shotId: string; index: number } | undefined;
  let anchorScreen: { x: number; y: number } | null = null;
  let pathHover = false;
  let anchorClick: { id: string; shotId: string; index: number; time: number } | undefined;
  const anchorCache = new WeakMap<readonly PathPoint[], PathPoint[]>();
  /** 镜头段轨迹的锚点：新划的轨迹存的就是锚点；以前存下的很密的轨迹先精简成锚点。 */
  function pathAnchors(path: readonly PathPoint[]) {
    if (path.length <= 24) return path as PathPoint[];
    let anchors = anchorCache.get(path);
    if (!anchors) { anchors = toPathAnchors(path); anchorCache.set(path, anchors); }
    return anchors;
  }
  // 云台跟踪的滤波状态（每台机位一份）：yaw/pitch是镜头此刻实际朝向，subject是跟拍时平滑后的目标位置。
  const gimbals = new Map<string, { time: number; key: string; yaw: number; pitch: number; subject: Vector3; center: Vector3; velocity: Vector3; offset: Vector3; out: CameraFraming }>();
  let gimbalRunning = false;

  let viewfinder: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D | null } | undefined;
  let viewfinderSkip = false;
  const viewfinderDrawn = new Vector2();
  // 总监看：始终显示按时间轴切换的成片机位，和单机位取景窗各用一块画布。
  let monitor: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D | null } | undefined;
  let monitorSkip = false;
  const monitorDrawn = new Vector2();
  let shotPose: CameraFraming | undefined;
  const subjectHeights = new Map<string, { key: string; height: number }>();
  // 全屏预演的画框收窄程度：0是整幅画布，1是居中的16:9画框。
  let shotLetterbox = 0;
  let shotTransition: { position: Vector3; quaternion: Quaternion; fov: number; letterbox: number; start: number } | undefined;
  let cameraDrag: { id: string; pointer: number; plane: Plane; start: Vector3; screen: Vector2; position: Vector3; target: Vector3; focalLength: number; pose: CameraFraming; previous?: CameraFraming; moved: boolean; delta: Vector3; stroke?: Vector3Value[]; height?: number; smooth?: readonly Vector3Value[]; air?: boolean; screenY?: number } | undefined;
  // ACT: 机位离地超过这个高度（太空、高空场景）就不再贴着地面划线，改在机位所在的高度上画。
  const strokeGroundReach = 40;
  let objectDragEnabled = false;
  let objectBoundsDirty = "";
  let objectDragMode: "plane" | "height" = "plane";
  let objectEditing: string | null = null;
  let gravityWake = true;
  let gravitySleeping = false;
  let gravityTime = 0;
  let objectDrag: { id: string; pointerId: number; plane: Plane; start: Vector3; origin: Vector3; screen: Vector2; moved: boolean; mode: "plane" | "height"; heightPerPixel: number; startHeight: number; heightPolicy: HeightPlacement; overlaps: Set<string>; yaw: number; baseYaw: number; last: Vector2; wheel: number;
    /** 多选一起拖：整批成员（含按住的那件）、绕着转的中心、当前水平位移和抬升量。 */
    members?: { id: string; group: Group; origin: Vector3; baseYaw: number; policy: HeightPlacement; startHeight: number }[]; pivot?: Vector3; shift?: Vector3; rise?: number } | undefined;
  // ACT: 编辑反馈只保留当前一次拾起与落地波，快速改拖另一物体时结束前一次视觉反馈。
  let objectLift: ObjectLift | undefined;
  let landingWave: { started: number; width: number; depth: number; spread: number; strength: number } | undefined;
  let terrainSurface: ReturnType<typeof createTerrainSurface> | undefined;
  let terrainSignature = "";
  let preparedTerrainSurface: ReturnType<typeof createTerrainSurface> | undefined;
  let preparedTerrain: SceneTerrain | undefined;
  let terrainFirstFrame = false;
  let terrainContextLost = false;
  let terrainWarmupTimer: number | undefined;
  let terrainWarmupDelay: number | undefined;
  let terrainWarmupTarget: ReturnType<typeof createTerrainSurface> | undefined;
  let terrainWarmupKey = "";
  let terrainWarmupSerial = 0;
  let terrainReadyKeys = new WeakMap<ReturnType<typeof createTerrainSurface>, string>();
  let terrainFailedKeys = new WeakMap<ReturnType<typeof createTerrainSurface>, string>();
  const terrainCaptureWaiters = new Set<{ surface: ReturnType<typeof createTerrainSurface>; resolve: () => void; reject: (error: Error) => void; timer?: number }>();
  let terrainBrush: TerrainBrush | null = null;
  let brushRadius = 5;
  let brushStrength = 1;
  let brushFlow = 1;
  let brushHardness = 0.35;
  let brushTargetHeight = 0;
  let brushColor: string | undefined;
  let brushPosition: Vector3Value | null = null;
  let terrainStroke: { pointerId: number; materialOnly: boolean; color?: string; draft: SceneTerrain; origin: Vector3Value; direction: number; position: Vector3Value | null; screen: Vector2; points: (Vector3Value | null)[]; last: Vector3Value | null; water: { level: number; reference: SceneTerrain }; changed: boolean; time: number; elapsed: number } | undefined;
  let pendingTerrain: SceneTerrain | undefined;
  let weatherSignature = "";
  let atmosphereSignature = JSON.stringify(document.atmosphere);
  let weatherTerrainSize = 0;
  let weatherSceneSize = 0;
  let worldTimeOrigin = getSceneTime(document);
  let worldTimePreview: SceneTime | undefined;
  let worldClockOrigin = performance.now();
  let worldTimeSource = JSON.stringify(worldTimeOrigin);
  let worldLifeClockJump = false;
  let publishedWorldSecond = "";
  let animationTime = 0;
  /** 上一次只因环境动画而画的时刻（毫秒），用来给环境动画限帧。 */
  let ambientFrameTime = 0;
  const navigationKeys = new Set<string>();
  const navigationCodes = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight", "Space"]);
  const navigationForward = new Vector3();
  const navigationRight = new Vector3();
  const navigationDelta = new Vector3();
  const worldUp = new Vector3(0, 1, 0);
  const ownerDocument = canvas.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  const reducedMotion = ownerWindow?.matchMedia("(prefers-reduced-motion: reduce)");
  const navigationRoot = canvas.closest(".sceneStudio") ?? canvas.parentElement ?? canvas;
  const anchorBox = new Box3();
  const selectionPartBounds = new Box3();
  const floorBounds = new Box3();
  const floorTranslation = new Vector3();
  const floorCache = new WeakMap<Group, { key: string; bounds: Box3 }>();
  const cameraFloorHeight = 0.15;
  const anchorPoint = new Vector3();
  const anchorView = new Vector3();
  const anchorFrustum = new Frustum();
  const anchorProjection = new Matrix4();
  let previousAnchor: ObjectAnchor | null | undefined;
  let previousAnchorId = "";
  let sceneAnchor: SceneAnchor | null = null;
  let sceneAnchorLocal: Vector3 | undefined;
  let sceneAnchorStarted = 0;
  const sceneAnchorNormal = new Vector3(0, 1, 0);
  const sceneAnchorPoint = new Vector3();
  const sceneAnchorAxis = new Vector3(0, 0, 1);
  const records = new Map<string, SceneRecord>();
  const windRecords = new Set<SceneRecord>();
  const collisionShapes = new WeakMap<Group, CollisionShape>();
  const assetCollisionShapes = new Map<string, CollisionShape>();
  const modelTemplates = new Map<ModelDefinition, { model: Group; bounds: Box3; size: Vector3 }>();
  const collisionIndex = createCollisionIndex();
  const pendingLoads = new Set<Promise<void>>();
  const objectLoadQueue: ObjectLoadJob[] = [];
  let loadingObjects = false;
  let activeObjectLoad: ObjectLoadJob | undefined;
  let cancelObjectLoadFrame: (() => void) | undefined;
  let assetPlacement: AssetPlacementState | undefined;
  let sceneBrush: ReturnType<typeof createSceneBrushStroke> | undefined;
  let sceneBrushDrawing = false;
  const modelErrors = new Map<string, string>();
  const scene = new Scene();
  scene.background = new Color("#f5f7fa");
  scene.fog = new Fog("#f5f7fa", 65, 180);
  const camera = new PerspectiveCamera(document.view.fov ?? 50, 1, 0.05, 500);
  camera.position.copy(toVector(document.view.position));
  const shotCamera = camera.clone();
  const shotTargetCamera = camera.clone();
  const viewfinderCamera = camera.clone();
  const shotSize = new Vector2();
  const shotClearColor = new Color();
  const sceneCameras = createSceneCameras();
  scene.add(sceneCameras.root);
  const renderer = new WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
  let parallelShaderCompile = renderer.extensions.get("KHR_parallel_shader_compile") as KHR_parallel_shader_compile | null;
  renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const controls = new OrbitControls(camera, canvas);
  // 右键始终由第一人称环视接管，导航暂停时也不能回退成 OrbitControls 的默认平移。
  controls.mouseButtons.RIGHT = null;
  controls.mouseButtons.LEFT = null;
  controls.mouseButtons.MIDDLE = MOUSE.PAN;
  controls.enableZoom = false;
  controls.target.copy(toVector(document.view.target));
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.minDistance = 0.2;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.update();
  syncCameraControls();
  const transform = new TransformControls(camera, canvas);
  transform.setSize(0.9);
  transform.enabled = helpersVisible;
  const transformHelper = transform.getHelper();
  transformHelper.visible = helpersVisible;
  scene.add(transformHelper);
  const objectRoot = new Group();
  const staticBatches = createStaticSceneBatches(scene, objectRoot);
  const helpers = new Group();
  helpers.visible = helpersVisible;
  scene.add(objectRoot, helpers);
  const selectionBox = new Box3Helper(new Box3(), new Color("#8aabff"));
  selectionBox.visible = false;
  const selectionRoot = new Group();
  selectionRoot.matrixAutoUpdate = false;
  selectionRoot.add(selectionBox);
  helpers.add(selectionRoot);
  const grid = new GridHelper(100, 100, "#708199", "#3b485b");
  grid.position.y = 0.006;
  if (!Array.isArray(grid.material)) {
    grid.material.transparent = true;
    grid.material.opacity = 0.55;
    grid.material.toneMapped = false;
  }
  helpers.add(grid);
  const axes = new AxesHelper(1);
  axes.position.y = 0.012;
  axes.visible = document.display?.axesVisible === true;
  helpers.add(axes);
  const floorBaseColor = new Color("#f5f7fa").lerp(new Color("#dcdfe6"), 0.12);
  const floor = new Mesh<BufferGeometry, MeshStandardMaterial>(new PlaneGeometry(350, 350), new MeshStandardMaterial({ color: floorBaseColor, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const sceneAnchorMarker = new Group();
  sceneAnchorMarker.name = "sceneAnchorMarker";
  sceneAnchorMarker.visible = false;
  for (const [geometry, color, opacity] of [
    [new CircleGeometry(1.8, 48), "#26313e", 0.09],
    [new RingGeometry(0.91, 1.18, 48), "#26313e", 0.26],
    [new RingGeometry(0.94, 1.08, 48), "#ffffff", 0.95],
    [new CircleGeometry(0.3, 32), "#ffffff", 0.98],
  ] as const) {
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }));
    mesh.renderOrder = 40 + sceneAnchorMarker.children.length;
    mesh.position.z = sceneAnchorMarker.children.length * 0.0001;
    sceneAnchorMarker.add(mesh);
  }
  scene.add(sceneAnchorMarker);
  const performanceSelection = new Mesh(new RingGeometry(0.94, 1, 64), new MeshBasicMaterial({ color: "#409eff", transparent: true, opacity: 1, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  performanceSelection.rotation.x = -Math.PI / 2;
  performanceSelection.renderOrder = 39;
  performanceSelection.visible = false;
  scene.add(performanceSelection);
  const performanceBounds = new Box3();
  const brushIndicator = new Line(new BufferGeometry(), new LineBasicMaterial({ color: "#409eff", depthTest: false, toneMapped: false }));
  brushIndicator.visible = false;
  brushIndicator.renderOrder = 30;
  const brushCore = new Line(new BufferGeometry(), new LineBasicMaterial({ color: "#409eff", depthTest: false, toneMapped: false, transparent: true, opacity: 0.45 }));
  brushCore.renderOrder = 31;
  brushIndicator.add(brushCore);
  scene.add(brushIndicator);
  const groundSelectionPoints = new Float32BufferAttribute(new Float32Array(2080 * 3), 3);
  const groundSelection = new Line(new BufferGeometry(), new LineBasicMaterial({ color: "#409eff", depthWrite: false, toneMapped: false, fog: false }));
  groundSelection.geometry.setAttribute("position", groundSelectionPoints);
  groundSelection.geometry.setDrawRange(0, 0);
  groundSelection.frustumCulled = false;
  groundSelection.renderOrder = 32;
  groundSelection.visible = false;
  scene.add(groundSelection);
  const sky = new HemisphereLight("#c6dcff", "#444a50", 2.1);
  const ambient = new AmbientLight("#d6e5ff", 0.35);
  const sun = new DirectionalLight("#fff1dc", 3.2);
  sun.position.set(-12, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 0.5, far: 90 });
  sun.shadow.normalBias = 0.04;
  sun.shadow.bias = -0.0001;
  sun.shadow.camera.updateProjectionMatrix();
  scene.add(sky, ambient, sun, sun.target);
  const terrainEnvSky = new Color(), terrainEnvGround = new Color(), terrainEnvSun = new Color();
  const terrainEnvSunDirection = new Vector3();
  const worldWeather = createWorldWeather();
  scene.add(worldWeather.group);
  const worldCelestials = createWorldCelestials();
  scene.add(worldCelestials.group);
  const worldLife = createWorldLife(scene);
  let performanceSeek: { time: SceneTime; life: ReturnType<typeof worldLife.snapshot>; jump: boolean } | undefined;
  let performanceEditing = false;
  let performanceSelectedId = "";
  let performanceSelectedPoint: number | undefined;
  let performanceDragging = false;
  let performanceDrawing = false;
  const performancePositions = new Map<string, Vector3Value>();
  const performanceOverlay = createPerformanceOverlay({
    scene, camera, canvas, pointAt: (x, y, track) => performancePointAt(x, y, !!track?.parkour), invalidate,
    onSelect: (id, point) => options.onPerformanceSelect?.(id, point),
    onMove: (id, point, position) => options.onPerformanceMove?.(id, point, position),
    onInsert: (id, segment, position) => options.onPerformanceInsert?.(id, segment, position),
    onRemove: (id, point) => options.onPerformanceRemovePoint?.(id, point),
    onDrawPoint: position => options.onPerformanceDrawPoint?.(position),
    onLabels: labels => options.onPerformanceLabels?.(labels),
    onAnchor: screen => options.onPerformancePointScreen?.(screen),
    // 拖末端锚点：从末端接着一笔拖出后续路线（不再进入逐点落点模式）。
    onContinueRoute: (trackId, event) => { if (!beginAppendStroke(trackId, event)) options.onPerformanceContinueRoute?.(trackId); },
  });
  let lifeStatusSignature = "";
  let lifeTimePublished = -1;
  let lifePublishedAt = -Infinity;
  let lifeStatusPending = false;
  let movingShadowAt = -Infinity;
  let movingShadowPending = false;
  let lifeNeedsSync = false;
  let navigationWarmup: Promise<void> | undefined;
  let navigationWarmupRounds = 0;
  let navigationWarmupDocument: SceneDocument | undefined;
  const navigationAbort = new AbortController();

  function getTerrainObstacleBoxes() {
    const boxes: Box3[] = [];
    if (document.terrain && terrainSurface) for (let index = 0; index < document.terrain.surfaces.length; index++) {
      const tree = terrainSurface.getTree(index);
      if (!tree) continue;
      const radius = Math.max(0.12, tree.radius * 0.18);
      boxes.push(new Box3(new Vector3(tree.position.x - radius, tree.position.y, tree.position.z - radius), new Vector3(tree.position.x + radius, tree.position.y + tree.height, tree.position.z + radius)));
    }
    return boxes;
  }

  function getPerformanceTerrainObstacles() {
    return getTerrainObstacleBoxes().map(box => ({ min: toValue(box.min), max: toValue(box.max) }));
  }

  // ACT: immediate=false 时，导航网格里有没算过的块（首次放整套布景、大改场景）就先分片补算，算完再同步，界面不再同步卡几秒；
  // 期间演绎沿用上一次同步的状态。定位、取样、导出这些马上要用结果的路径传 immediate=true，照旧当场同步。
  function syncWorldLife(immediate = false) {
    if (!immediate && navigationWarmup && document.life?.enabled) { lifeNeedsSync = true; return; }
    const visible = new Set(document.objects.filter(object => object.visible).map(object => object.id));
    const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups);
    const sources = new Set(document.life?.enabled ? tracks.filter(track => track.enabled !== false && visible.has(track.objectId)).flatMap(track => [...getPerformanceSubjectIds(track, tracks, document.objectGroups)]) : []);
    // ACT: 同一批素材全部载入后再烘焙导航，避免每件素材都重建一次精细网格。
    // 手柄拖动（缩放/旋转/高度）和数值框编辑期间每次指针移动都会同步文档：和搬动物体一样，等松手后再重算导航，否则每一帧都重烘焙。
    if (document.life?.enabled && (pendingLoads.size || objectDrag || dragging || objectEditing || terrainStroke || sceneBrushDrawing || [...records].some(([id, record]) => !sources.has(id) && record.fallSpeed > 0))) { lifeNeedsSync = true; return; }
    lifeNeedsSync = false;
    const obstacles: Box3[] = [];
    const terrainObstacles = document.life?.enabled ? getTerrainObstacleBoxes() : [];
    if (document.life?.enabled) for (const object of document.objects) {
      if (!object.visible || object.navigation || sources.has(object.id)) continue;
      const record = records.get(object.id);
      if (!record?.placementBounds) continue;
      record.group.updateWorldMatrix(true, false);
      for (const part of recordCollision(object.id, record).parts) obstacles.push(part.bounds);
    }
    obstacles.push(...terrainObstacles);
    const lifeSources = new Map([...records].filter(([, record]) => record.group.children.length && record.loadedSignature === record.signature).map(([id, record]) => [id, record.group]));
    if (!immediate && options.autoRender !== false && document.life?.enabled) {
      // 补算期间几何可能又动了一点（物体落地、文档再改）：算完重新探测，同一份文档最多连着预热3轮，之后当场同步，保证一定推进。
      if (navigationWarmupDocument !== document) { navigationWarmupDocument = document; navigationWarmupRounds = 0; }
      const warmup = navigationWarmupRounds < 3 ? worldLife.prepareNavigation(document, obstacles, lifeSources, terrainObstacles, navigationAbort.signal) : undefined;
      if (warmup) {
        navigationWarmupRounds++;
        lifeNeedsSync = true;
        const settled = navigationWarmup = warmup.catch(() => undefined).then(() => {
          if (navigationWarmup === settled) navigationWarmup = undefined;
          if (!disposed && lifeNeedsSync) syncWorldLife();
        });
        return;
      }
    }
    navigationWarmupRounds = 0;
    worldLife.sync(document, obstacles, lifeSources, terrainObstacles);
    syncPerformanceSources();
    if (performanceEditing) syncOverlay();
    renderer.shadowMap.needsUpdate = true;
    publishLifeStatus();
    invalidate();
  }

  function syncPerformanceSources() {
    const active = worldLife.getActiveObjectIds();
    for (const object of document.objects) {
      const record = records.get(object.id);
      if (!record) continue;
      const visible = object.visible;
      if (record.group.visible !== visible) {
        record.group.visible = visible;
        recordCollision(object.id, record);
      }
      if (active.has(object.id)) { record.resting = true; record.fallSpeed = 0; collisionIndex.remove(object.id); }
      else if (record.placementBounds) recordCollision(object.id, record);
    }
  }

  function setPerformanceEditing(enabled: boolean, selectedId = "", selectedPoint?: number) {
    if (enabled && !performanceEditing) syncOverlay();
    performanceEditing = enabled;
    performanceSelectedId = selectedId; performanceSelectedPoint = selectedPoint;
    performanceOverlay.setEditing(enabled && !isShotView(), selectedId, selectedPoint);
    if (!enabled) cancelPerformanceDrag();
    updateSelection();
    updateCursor();
  }
  // ACT: 片段式动线的路线存在各移动片段里：把它们按时间接成一条显示用路线，拖点由宿主写回对应片段。
  function overlayTracks() {
    return getPerformanceTracks(document.life, document.objects, document.objectGroups).map(track => {
      if (!track.clips || track.controller === "object") return track;
      const route = getClipRoute(track.clips);
      if (route.points.length < 2) return track;
      const moves = track.clips.filter(clip => clip.kind === "move" && clip.enabled !== false);
      const floating = moves.length > 0 && moves.every(clip => clip.kind === "move" && (clip.mode === "air" || clip.mode === "water"));
      return { ...track, points: route.points, events: route.events.map(event => ({ at: event.at, text: event.text, seconds: 0, action: "wait" as const })), segmentSeconds: undefined, teleports: undefined, inertias: undefined, mode: floating ? "air" as const : track.mode === "air" || track.mode === "water" ? undefined : track.mode };
    });
  }
  function syncOverlay() {
    let tracks: PerformanceTrack[];
    try { tracks = overlayTracks(); performanceOverlay.sync(tracks, document.objects); }
    catch (error) { performanceOverlay.sync([], document.objects); performanceOverlay.setWalks(new Map()); options.onError(error instanceof Error ? error.message : "无法读取演绎动线"); return; }
    performanceOverlay.setWalks(routeWalks(tracks));
  }
  // ACT: 和播放用同一张导航网格算出的路线，场景里画的就是人真正会走的路。
  function routeWalks(tracks: readonly PerformanceTrack[]) {
    const walks = new Map<string, RouteWalk>();
    if (!document.life?.enabled) return walks;
    for (const track of tracks) {
      if (track.controller === "object" || track.enabled === false || track.points.length < 2 || track.mode === "air" || track.mode === "path") continue;
      try {
        const walk = worldLife.getWalkRoute(track.id);
        if (walk) walks.set(track.id, matchWalkSegments(track.points, walk.legs, walk.blocked));
      } catch { /* 导航还没准备好时按两点直连显示 */ }
    }
    return walks;
  }

  function cancelPerformanceDrag() {
    const canceled = performanceOverlay.cancel();
    performanceDragging = false;
    syncCameraControls();
    return canceled;
  }

  function setPerformanceDraft(track: PerformanceTrack | null) {
    performanceDrawing = !!track;
    performanceOverlay.setDraft(track);
    invalidate();
  }

  function selectedPerformanceTrack() {
    if (!selectedId) return undefined;
    const groups = document.objectGroups ?? [];
    const members = new Set(getPerformanceObjectIds(selectedId, groups));
    try {
      return getPerformanceTracks(document.life, document.objects, groups).find(track => track.controller !== "object" && (members.has(track.objectId) || getPerformanceObjectIds(track.objectId, groups).includes(selectedId)));
    } catch { return undefined; }
  }

  // ACT: 演绎里画路线：按住选中的物体直接拖，一笔拖出路线（和机位划线一样自动理顺），不再需要去抓脚下的蓝圈。
  // appendTo有值时是从这条动线末端接着画，base是已有的路径点（预览时一起画出）。
  let routeStroke: { pointer: number; objectId: string; points: Vector3Value[]; screen: Vector2; moved: boolean; appendTo?: string; base?: [number, number, number][]; parkour?: boolean } | undefined;
  function beginAppendStroke(trackId: string, event: PointerEvent) {
    if (routeStroke || performanceDrawing) return false;
    // 片段式动线用显示路线（各移动片段接起来）当底稿，和逐点动线一样从终点接着画。
    const track = overlayTracks().find(item => item.id === trackId);
    const last = track?.points.at(-1);
    if (!track || !last || track.controller === "object") return false;
    routeStroke = { pointer: event.pointerId, objectId: track.objectId, points: [{ x: last[0], y: last[1], z: last[2] }], screen: new Vector2(event.clientX, event.clientY), moved: true, appendTo: trackId, base: track.points.map(point => [point[0], point[1], point[2]] as [number, number, number]), parkour: !!track.parkour };
    stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
    updateCursor();
    return true;
  }
  function beginRouteStroke(event: PointerEvent) {
    if (!performanceEditing || performanceDrawing || routeStroke) return false;
    const picked = pickSceneObject(event.clientX, event.clientY);
    if (!picked) return false;
    // 按住任意物体都能直接拖：没选中的先选中它，同一下手势接着画路线。
    const objectId = selectedId && selectedIds.includes(picked) ? selectedId : picked;
    if (objectId !== selectedId) options.onSelect(picked);
    const found = subjectGroup(objectId);
    if (!found) return false;
    found.group.updateWorldMatrix(true, false);
    const origin = new Vector3().setFromMatrixPosition(found.group.matrixWorld);
    const parkour = !!overlayTracks().find(track => track.controller !== "object" && getPerformanceObjectIds(track.objectId, document.objectGroups).includes(objectId))?.parkour;
    origin.y = walkSurfaceBelow(origin.x, origin.z, origin.y + 0.5, parkour);
    event.preventDefault(); event.stopImmediatePropagation();
    routeStroke = { pointer: event.pointerId, objectId, points: [toValue(origin)], screen: new Vector2(event.clientX, event.clientY), moved: false, parkour };
    stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
    try { canvas.setPointerCapture(event.pointerId); } catch { /* 合成事件没有真实指针 */ }
    canvas.focus({ preventScroll: true });
    pointerStart = undefined; updateCursor();
    return true;
  }
  function strokeRoute(points: Vector3Value[], settle = false, open = false) {
    return toPathAnchors(smoothStroke(points.map(point => ({ x: point.x, y: 0, z: point.z }))), 30).map(anchor => {
      let level = points[0]!.y, nearest = Infinity;
      for (const point of points) {
        const distance = (point.x - anchor.x) ** 2 + (point.z - anchor.z) ** 2;
        if (distance < nearest) { nearest = distance; level = point.y; }
      }
      return { x: anchor.x, y: settle ? walkSurfaceBelow(anchor.x, anchor.z, level + 0.6, open) : level, z: anchor.z };
    });
  }
  function moveRouteStroke(event: PointerEvent) {
    const stroke = routeStroke;
    if (!stroke || stroke.pointer !== event.pointerId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!stroke.moved && stroke.screen.distanceTo(new Vector2(event.clientX, event.clientY)) < 4) return;
    const ground = performancePointAt(event.clientX, event.clientY, stroke.parkour) ?? pointOnPlane(event.clientX, event.clientY, 0);
    if (!ground) return;
    const last = stroke.points[stroke.points.length - 1]!;
    stroke.moved = true;
    if (Math.hypot(ground.x - last.x, ground.z - last.z) < 0.15 || stroke.points.length >= 4096) return;
    stroke.points = [...stroke.points, ground];
    const preview = strokeRoute(stroke.points).map(point => [point.x, point.y, point.z] as [number, number, number]);
    performanceOverlay.setDraft({ id: "routeStroke", objectId: stroke.objectId, points: stroke.base ? [...stroke.base, ...preview.slice(1)].slice(0, 64) : preview, events: [] } as PerformanceTrack);
    invalidate();
  }
  function endRouteStroke(event: PointerEvent, commit: boolean) {
    const stroke = routeStroke;
    if (!stroke || stroke.pointer !== event.pointerId) return false;
    routeStroke = undefined;
    if (canvas.hasPointerCapture(stroke.pointer)) canvas.releasePointerCapture(stroke.pointer);
    performanceOverlay.setDraft(null);
    if (performanceDragging) { performanceDragging = false; syncCameraControls(); }
    updateCursor(); invalidate();
    const route = strokeRoute(stroke.points, true, stroke.parkour);
    if (commit && stroke.moved && route.length > 1 && Math.hypot(route.at(-1)!.x - route[0]!.x, route.at(-1)!.z - route[0]!.z) > 0.3) options.onPerformanceStroke?.(stroke.objectId, route, stroke.appendTo);
    else if (stroke.appendTo) options.onPerformanceSelect?.(stroke.appendTo, stroke.base ? stroke.base.length - 1 : undefined);
    return true;
  }
  function cancelRouteStroke() {
    const stroke = routeStroke;
    if (!stroke) return;
    routeStroke = undefined;
    if (canvas.hasPointerCapture(stroke.pointer)) canvas.releasePointerCapture(stroke.pointer);
    performanceOverlay.setDraft(null);
    updateCursor(); invalidate();
  }

  function movePerformancePointer(event: PointerEvent) {
    if ((!performanceDragging && !performanceDrawing) || !performanceOverlay.pointerMove(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function focusPerformance(id: string) {
    const members = worldLife.getTrackObjectIds(id);
    const bounds = new Box3();
    if (members.length && getSelectionBounds(members, bounds)) { focusBounds(bounds); return; }
    const actor = worldLife.getActorObjects().find(actor => actor.trackId === id);
    if (actor) { focusBounds(new Box3().setFromObject(actor.group)); return; }
    const track = document.life?.tracks?.find(track => track.id === id);
    if (track) focusBounds(new Box3().setFromPoints(track.points.map(point => new Vector3(...point))));
  }

  function publishLifeStatus() {
    lifeStatusPending = false;
    lifePublishedAt = performance.now();
    if (!options.onLifeStatus) return;
    const time = Math.floor(worldLife.getTime() * 10) / 10;
    lifeTimePublished = time;
    const status = getLifeStatus();
    const signature = JSON.stringify(status);
    if (signature === lifeStatusSignature) return;
    lifeStatusSignature = signature;
    options.onLifeStatus?.(status);
  }
  function getLifeStatus(): LifeStatus {
    const status = worldLife.getStatus();
    const playbackRange = getFilmRange();
    return playbackRange ? { ...status, playbackRange } : status;
  }
  function getWorldSeconds() { return worldTimeSeconds(worldTimePreview ?? getWorldTime()); }
  // ACT: 成片第0秒是演绎开始；镜头段只会把成片往后撑长。只有机位时，第一次用到成片时间的那一刻记作开头并一直沿用。
  function getFilmRange(): { start: number; end: number } | undefined {
    const actors = worldLife.getPlaybackRange();
    const cameras = document.cameras ?? [];
    if (!cameras.length) { cameraOrigin = undefined; return actors; }
    const shotsEnd = getCamerasDuration(cameras);
    if (actors) return { start: actors.start, end: Math.max(actors.end, actors.start + shotsEnd) };
    cameraOrigin ??= getWorldSeconds();
    return { start: cameraOrigin, end: cameraOrigin + Math.max(minFilmSeconds, shotsEnd) };
  }
  function getFilmClock(): FilmClock {
    const range = document.cameras?.length ? getFilmRange() : undefined;
    return range ? { time: Math.max(0, getWorldSeconds() - range.start), duration: range.end - range.start } : { time: 0, duration: minFilmSeconds };
  }
  // 机位此刻的画面：手动指定的画面优先，其次是正在预览的运镜，最后按成片时间取样。
  function getEffectivePose(value: SceneCamera, clock: FilmClock): CameraFraming {
    const override = cameraOverrides.get(value.id);
    if (override) return override;
    return getFilmPose(value, clock);
  }
  // 成片画面：不受编辑中的指定画面影响，总监看按它取样。
  function getFilmPose(value: SceneCamera, clock: FilmClock): CameraFraming {
    return applyHandheld(gimbalPose(value, sampleSceneCamera(value, clock.time), clock.time), value, clock.time);
  }
  /**
   * ACT: 像手持稳定器的智能跟随：目标突然变化时镜头按smooth柔和地追过去（并限制最大转速），目标在死区里晃动不动镜头，
   * 相对这段镜头原本的朝向最多转limit度。滤波只在成片连续播放时生效；暂停、拖播放头、切到另一段镜头都直接对准。
   */
  function gimbalPose(value: SceneCamera, base: CameraFraming, time: number): CameraFraming {
    // 这一刻所在镜头段的跟踪（同一台机位不同镜头段可以盯不同东西），没有就用机位的。
    const track = getCameraTrackingAt(value, time);
    const parts = track && resolveSubjectParts(track);
    if (!track || !parts) { gimbals.delete(value.id); return base; }
    const key = JSON.stringify(track) + "|" + (getCameraShotAt(value, time)?.id ?? "");
    const state = gimbals.get(value.id);
    const dt = state ? time - state.time : 0;
    if (state && state.key === key && gimbalRunning && Math.abs(dt) < 1e-6) return state.out;
    // ACT: 换镜头段、换跟踪对象时不重置：云台按平滑从上一个目标转到新目标（比如从水瓶摇到手），不会硬切。
    const continuous = !!state && gimbalRunning && dt > 0 && dt < 0.25;
    const smooth = track.smooth ?? trackingDefaults.smooth;
    const k = continuous && smooth > 0 ? 1 - Math.exp(-dt / smooth) : 1;
    // ACT: 防抖：物体中心走自适应低通（One Euro：慢时抹得狠去掉抖动，快时放开减少拖后），
    // 跟踪点相对中心的偏移再单独低通——物体高速自转时偏移来回甩，平均下来贴近转轴，镜头不会被甩来甩去；慢慢转身照样跟上。
    const stabilize = MathUtils.clamp(track.stabilize ?? trackingDefaults.stabilize, 0, 1);
    let center = parts.center, offsetPoint = parts.offset, velocity = new Vector3();
    if (continuous && stabilize > 0) {
      const alpha = (cutoff: number) => 1 / (1 + 1 / (2 * Math.PI * cutoff * dt));
      velocity = state!.velocity.clone().lerp(parts.center.clone().sub(state!.center).divideScalar(dt), alpha(1));
      const cutoff = MathUtils.lerp(8, 0.35, stabilize) + 0.8 * velocity.length();
      center = state!.center.clone().lerp(parts.center, alpha(cutoff));
      offsetPoint = state!.offset.clone().lerp(parts.offset, 1 - Math.exp(-dt / (stabilize * 0.5)));
    }
    const target = center.clone().add(offsetPoint);
    const subject = continuous ? state!.subject.clone().lerp(target, k) : target.clone();
    const offset = toVector(base.position).sub(toVector(base.target));
    const position = track.mode === "follow" ? subject.clone().add(offset) : toVector(base.position);
    const want = target.clone().sub(position);
    const distance = want.length();
    if (distance < 1e-4) return base;
    want.divideScalar(distance);
    const baseDirection = toVector(base.target).sub(toVector(base.position)).normalize();
    const baseYaw = Math.atan2(baseDirection.x, -baseDirection.z), basePitch = Math.asin(MathUtils.clamp(baseDirection.y, -1, 1));
    const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));
    const limit = MathUtils.degToRad(track.limit ?? trackingDefaults.limit), pitchLimit = MathUtils.degToRad(88);
    let yaw = Math.atan2(want.x, -want.z), pitch = Math.asin(MathUtils.clamp(want.y, -1, 1));
    if (limit < Math.PI - 1e-3) { yaw = baseYaw + MathUtils.clamp(wrap(yaw - baseYaw), -limit, limit); pitch = MathUtils.clamp(pitch, basePitch - limit, basePitch + limit); }
    pitch = MathUtils.clamp(pitch, -pitchLimit, pitchLimit);
    if (continuous) {
      const errorYaw = wrap(yaw - state!.yaw), errorPitch = pitch - state!.pitch;
      const error = Math.hypot(errorYaw * Math.cos(state!.pitch), errorPitch);
      const deadzone = MathUtils.degToRad(track.deadzone ?? trackingDefaults.deadzone);
      const reach = error > deadzone ? (error - deadzone) / error : 0;
      let stepYaw = errorYaw * reach * k, stepPitch = errorPitch * reach * k;
      const step = Math.hypot(stepYaw * Math.cos(state!.pitch), stepPitch), maxStep = MathUtils.degToRad(240) * dt;
      if (step > maxStep) { stepYaw *= maxStep / step; stepPitch *= maxStep / step; }
      yaw = state!.yaw + stepYaw; pitch = state!.pitch + stepPitch;
    }
    const direction = new Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.cos(yaw));
    // 跟踪接管朝向时只保留翻滚角，不再用关键点算出的上方向。
    const { up: _up, ...flat } = base as CameraPose;
    const out: CameraFraming = { ...flat, position: toValue(position), target: toValue(position.clone().addScaledVector(direction, distance)) };
    gimbals.set(value.id, { time, key, yaw, pitch, subject, center, velocity, offset: offsetPoint, out });
    return out;
  }
  // ACT: 跟踪点取物体此刻的真实位置（演绎中的演员按其显示位置），高度取包围盒的85%，人物大约对在面部；包围盒只在模型换版时重算。
  function subjectGroup(id: string) {
    const record = records.get(id);
    if (!record) return undefined;
    const actor = worldLife.getActorObjects().find(item => item.objectId === id);
    return { record, group: actor?.group ?? record.group };
  }
  function resolveSubject(track: CameraTracking): Vector3Value | undefined {
    const parts = resolveSubjectParts(track);
    return parts && toValue(parts.center.add(parts.offset));
  }
  /** 跟踪点拆成两部分：物体的中心（平移）和跟踪点相对中心的偏移（随物体转动），分别防抖。 */
  function resolveSubjectParts(track: CameraTracking): { center: Vector3; offset: Vector3 } | undefined {
    if (!track.objectId) return track.point ? { center: toVector(track.point), offset: new Vector3() } : undefined;
    const id = track.objectId;
    const found = subjectGroup(id);
    if (!found) return undefined;
    const { record, group } = found;
    group.updateWorldMatrix(true, false);
    const center = new Vector3().setFromMatrixPosition(group.matrixWorld);
    // 点跟踪：点中的那一点记在物体自己的坐标里，物体走动、转身都跟着。
    if (track.point) return { center, offset: group.localToWorld(toVector(track.point)).sub(center) };
    const key = record.loadedSignature ?? "";
    let cached = subjectHeights.get(id);
    if (!cached || cached.key !== key) {
      record.group.updateWorldMatrix(true, true);
      const box = new Box3().setFromObject(record.group);
      cached = { key, height: box.isEmpty() ? 1.6 : Math.max(0.2, box.max.y - record.group.position.y) };
      subjectHeights.set(id, cached);
    }
    return { center, offset: new Vector3(0, cached.height * 0.85, 0) };
  }
  // aspect是画面实际的宽高比（投影用，不对就会拉伸）；lensAspect是成片画幅，决定焦段换算出的视场角（竖屏时长边是高）。
  function aimCamera(view: PerspectiveCamera, pose: CameraFraming, aspect = filmAspect, lensAspect = filmAspect) {
    view.near = camera.near; view.far = camera.far;
    view.position.set(pose.position.x, pose.position.y, pose.position.z);
    // 有关键点控制朝向时直接用画面上方向（整圈翻滚、翻跟头都对），否则按看向+横滚。
    const up = (pose as CameraPose).up;
    if (up) view.up.set(up.x, up.y, up.z); else view.up.set(0, 1, 0);
    view.lookAt(pose.target.x, pose.target.y, pose.target.z);
    if (!up && pose.roll) view.rotateZ(-MathUtils.degToRad(pose.roll));
    view.up.set(0, 1, 0);
    view.aspect = aspect;
    view.fov = getCameraFov(pose.focalLength, lensAspect);
    view.updateProjectionMatrix(); view.updateMatrixWorld(true);
  }
  // 画布像素按画幅取整到偶数，宽高比会差一点点：差不到2%就认作最接近的那种成片画幅，视场角不随取整抖动。
  function pictureLensAspect(aspect: number) {
    const nearest = Object.values(filmFormats).reduce((best, value) => Math.abs(Math.log(value / aspect)) < Math.abs(Math.log(best / aspect)) ? value : best);
    return Math.abs(Math.log(nearest / aspect)) < 0.02 ? nearest : aspect;
  }
  /** 这个视口出成片画面用的画幅：主视口用全局画幅，Agent 观察视口用自己草稿的画幅。 */
  function viewportFilmAspect() {
    return options.globalFilmFormat === false ? filmFormats[document.film?.format ?? "16:9"] ?? 16 / 9 : filmAspect;
  }
  // 在主画布的一块区域（setViewport的单位）里画出机位画面。
  function drawFilm(view: PerspectiveCamera, _pose: CameraFraming | undefined, x: number, y: number, width: number, height: number) {
    renderer.setViewport(x, y, width, height); renderer.setScissor(x, y, width, height); renderer.setScissorTest(true);
    renderScene(view);
  }
  function getMonitoredCamera(time: number) {
    const cameras = document.cameras ?? [];
    return (cameraEditingId ? cameras.find(item => item.id === cameraEditingId) : undefined) ?? getProgramCamera(cameras, time);
  }
  const raycaster = new Raycaster();
  function worldHitNormal(hit?: Intersection) {
    if (!hit?.face) return worldUp.clone();
    let matrix = hit.object.matrixWorld;
    if (hit.object instanceof InstancedMesh && hit.instanceId !== undefined) {
      const local = new Matrix4();
      hit.object.getMatrixAt(hit.instanceId, local);
      matrix = local.premultiply(matrix);
    }
    return hit.face.normal.clone().applyNormalMatrix(new Matrix3().getNormalMatrix(matrix));
  }
  const landingRay = new Raycaster();
  const pointer = new Vector2();
  const landingCanvas = ownerDocument.createElement("canvas");
  landingCanvas.width = landingCanvas.height = 128;
  const landingContext = landingCanvas.getContext("2d");
  if (landingContext) {
    const gradient = landingContext.createRadialGradient(64, 64, 16, 64, 64, 63);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0)");
    gradient.addColorStop(0.65, "rgba(255,255,255,0.7)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    landingContext.fillStyle = gradient;
    landingContext.fillRect(0, 0, 128, 128);
  }
  const landingPuff = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: new CanvasTexture(landingCanvas), color: "#fff4e1", transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, toneMapped: false }));
  landingPuff.name = "landingPuff";
  landingPuff.visible = false;
  helpers.add(landingPuff);

  function invalidate() { dirty = true; }

  // ACT: 拾起与惯性倾斜仅在绘制和拾取时施加，逻辑高度、姿态、碰撞、保存及观察截图始终使用真实落点。
  function withObjectLift<T>(action: () => T): T {
    const lift = objectLift;
    const record = lift && records.get(lift.id);
    if (!lift || !record || !lift.offset && lift.tilt.lengthSq() < 1e-10) return action();
    const position = record.group.position.clone();
    const rotation = record.group.rotation.clone();
    const pivot = position.clone().add(lift.pivotOffset);
    const base = groupCollision(record.group);
    record.group.position.sub(pivot).applyQuaternion(lift.quaternion).add(pivot);
    record.group.position.y += lift.offset;
    record.group.quaternion.premultiply(lift.quaternion);
    record.group.updateWorldMatrix(true, true);
    if (lift.collisions) {
      const overlaps = () => {
        const body = groupCollision(record.group);
        return [...collisionCandidates(body, undefined, lift.id).values()].some(obstacle => intersectsCollision(body, obstacle) && !intersectsCollision(base, obstacle));
      };
      if (overlaps()) {
        record.group.position.copy(position);
        record.group.position.y += lift.offset;
        record.group.rotation.copy(rotation);
        record.group.updateWorldMatrix(true, true);
        if (overlaps()) { record.group.position.copy(position); record.group.updateWorldMatrix(true, true); }
      }
    }
    record.weather?.syncBounds();
    try { return action(); }
    finally {
      record.group.position.copy(position);
      // 还原原始Euler，保留用户输入的角度表示，避免四元数回转产生等价角与浮点差异。
      record.group.rotation.copy(rotation);
      record.group.updateWorldMatrix(true, true);
      record.weather?.syncBounds();
    }
  }

  function clearObjectMotion() {
    objectLift = undefined;
    landingWave = undefined;
    landingPuff.visible = false;
    renderer.shadowMap.needsUpdate = true;
    updateSelection();
    invalidate();
  }

  function startLandingWave(id: string, time: number, height: number) {
    const group = records.get(id)?.group;
    if (!group?.visible || !landingContext) return false;
    const box = new Box3().setFromObject(group);
    if (box.isEmpty()) return false;
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const surfaces = [floor, terrainSurface?.group.getObjectByName("terrainGround"), ...[...records].filter(([key, record]) => key !== id && record.group.visible).map(([, record]) => record.group)].filter((item): item is Object3D => !!item?.visible);
    for (const surface of surfaces) surface.updateWorldMatrix(true, true);
    landingRay.far = 0.16;
    const support = new Vector3();
    terrainSupport(box, currentTerrain(), support);
    const hit = [center, support].map(point => {
      landingRay.set(new Vector3(point.x, box.min.y + 0.06, point.z), new Vector3(0, -1, 0));
      return landingRay.intersectObjects(surfaces, true)[0];
    }).find(hit => hit && worldHitNormal(hit).y >= 0.35);
    if (!hit) return false;
    const normal = worldHitNormal(hit);
    if (normal.y < 0.35) return false;
    landingPuff.position.copy(hit.point).addScaledVector(normal, 0.018);
    landingPuff.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
    landingPuff.visible = true;
    landingWave = { started: time, width: Math.max(0.3, size.x), depth: Math.max(0.3, size.z), spread: MathUtils.clamp(Math.max(size.x, size.z) * 0.15, 0.2, 0.6), strength: MathUtils.clamp(Math.sqrt(height / 0.16), 0.55, 1) };
    return true;
  }

  function updateObjectMotion(time: number) {
    const lift = objectLift;
    if (reducedMotion?.matches || !navigationEnabled) {
      if (lift || landingWave) clearObjectMotion();
      return false;
    }
    if (lift) {
      const group = records.get(lift.id)?.group;
      if (!group?.visible || lift.phase !== "dragging" && (group.position.distanceToSquared(lift.position) > 1e-8 || !group.rotation.equals(lift.rotation) || !group.scale.equals(lift.scale))) objectLift = undefined;
      else {
        const seconds = Math.max(0.0001, (time - lift.sampleTime) / 1000);
        lift.sampleTime = time;
        if (seconds > 0.2) lift.velocity.set(0, 0, 0);
        // ACT: 只限制视觉惯性的采样速度，防止指针瞬移产生极端脉冲；不限制物体实际移动距离。
        const velocity = seconds > 0.2 ? new Vector3() : group.position.clone().sub(lift.samplePosition).divideScalar(seconds).clampLength(0, 25);
        lift.samplePosition.copy(group.position);
        const nextVelocity = lift.velocity.clone().lerp(velocity, 1 - Math.exp(-seconds / 0.065));
        const acceleration = nextVelocity.clone().sub(lift.velocity).divideScalar(seconds);
        lift.velocity.copy(nextVelocity);
        const target = new Vector2(-acceleration.x, -acceleration.z).multiplyScalar(0.002).clampLength(0, MathUtils.degToRad(0.9));
        if (lift.phase === "settling") target.set(0, 0);
        // 临界阻尼的解析更新，停止输入时也继续采样减速，响应不依赖鼠标事件频率或每帧固定lerp。
        const difference = lift.tilt.clone().sub(target);
        const term = lift.tiltVelocity.clone().addScaledVector(difference, 26);
        const decay = Math.exp(-26 * seconds);
        lift.tilt.copy(difference).addScaledVector(term, seconds).multiplyScalar(decay).add(target);
        lift.tiltVelocity.addScaledVector(term, -26 * seconds).multiplyScalar(decay);
        const progress = MathUtils.clamp((time - lift.started) / (lift.phase === "dragging" ? 120 : lift.phase === "falling" ? 210 : 180), 0, 1);
        if (lift.phase === "dragging") lift.offset = lift.height * (1 - (1 - progress) ** 3);
        else if (lift.phase === "falling") {
          lift.offset = lift.height * (1 - progress * progress);
          if (progress === 1) {
            lift.phase = "settling";
            lift.started = time;
            lift.bounce = startLandingWave(lift.id, time, lift.height) ? Math.min(0.006, lift.height * 0.04) : 0;
          }
        } else {
          lift.offset = lift.bounce * Math.sin(Math.PI * progress) * (1 - progress);
          if (progress === 1) objectLift = undefined;
        }
        const maxTilt = Math.min(MathUtils.degToRad(0.9), Math.atan2(lift.offset * 0.85, lift.footprint));
        lift.tilt.clampLength(0, maxTilt);
        const angle = lift.tilt.length();
        if (angle > 1e-6) lift.quaternion.setFromAxisAngle(new Vector3(lift.tilt.y, 0, -lift.tilt.x).divideScalar(angle), angle);
        else lift.quaternion.identity();
      }
      updateSelection();
    }
    if (landingWave) {
      const progress = MathUtils.clamp((time - landingWave.started) / 440, 0, 1);
      const spread = landingWave.spread * (0.2 + 0.8 * (1 - (1 - progress) ** 2));
      // 纹理环峰位于半径约0.727处，初始就落在足迹外缘，避免被模型底面遮住。
      landingPuff.scale.set((landingWave.width + spread * 2) * 1.5, (landingWave.depth + spread * 2) * 1.5, 1);
      landingPuff.material.opacity = 0.8 * landingWave.strength * Math.sin(Math.PI * progress) * (1 - progress);
      if (progress === 1) { landingWave = undefined; landingPuff.visible = false; }
    }
    return !!lift || !!landingWave;
  }

  function reportModelErrors() { options.onError(modelErrors.values().next().value ?? ""); }

  function publishSceneAnchor() {
    options.onSceneAnchor?.(sceneAnchor ? { ...sceneAnchor, position: { ...sceneAnchor.position } } : null);
  }

  function setSceneAnchor(value: SceneAnchor | null, normal = worldUp) {
    if (value && !Object.values(value.position).every(coordinate => Number.isFinite(coordinate) && Math.abs(coordinate) <= 10000)) throw new Error("场景锚点坐标超出范围");
    sceneAnchor = value && (value.kind === "point" || document.objects.some(object => object.id === value.objectId)) ? { ...value, position: { ...value.position } } : null;
    sceneAnchorLocal = undefined;
    if (sceneAnchor?.kind === "object") {
      const group = records.get(sceneAnchor.objectId)?.group;
      if (group) sceneAnchorLocal = group.worldToLocal(toVector(sceneAnchor.position));
    }
    sceneAnchorNormal.copy(normal).normalize();
    sceneAnchorStarted = performance.now();
    publishSceneAnchor();
    invalidate();
  }

  function updateSceneAnchorMarker() {
    sceneAnchorMarker.visible = false;
    if (!sceneAnchor || !navigationEnabled || disposed) return;
    if (sceneAnchor.kind === "object") {
      const record = records.get(sceneAnchor.objectId);
      if (!record?.group.visible || !record.group.children.length) return;
      if (sceneAnchorLocal) {
        sceneAnchorPoint.copy(sceneAnchorLocal);
        record.group.localToWorld(sceneAnchorPoint);
        if (sceneAnchorPoint.distanceToSquared(toVector(sceneAnchor.position)) > 1e-8) {
          sceneAnchor.position = toValue(sceneAnchorPoint);
          publishSceneAnchor();
        }
      }
      // ACT: 物体锚点只保留给 AI 上下文，不在素材上绘制点击圆环标记。
      return;
    }
    camera.updateMatrixWorld(true);
    sceneAnchorPoint.copy(toVector(sceneAnchor.position)).applyMatrix4(camera.matrixWorldInverse);
    if (sceneAnchorPoint.z >= -camera.near) return;
    const height = renderer.getSize(new Vector2()).y;
    const size = -sceneAnchorPoint.z * Math.tan(MathUtils.degToRad(camera.fov) / 2) * 24 / Math.max(1, height);
    const progress = MathUtils.clamp((performance.now() - sceneAnchorStarted) / 180, 0, 1);
    sceneAnchorMarker.scale.setScalar(size * (0.65 + 0.35 * (1 - (1 - progress) ** 3)));
    sceneAnchorMarker.position.copy(toVector(sceneAnchor.position));
    sceneAnchorMarker.quaternion.setFromUnitVectors(sceneAnchorAxis, sceneAnchorNormal);
    sceneAnchorMarker.position.addScaledVector(sceneAnchorNormal, Math.max(0.01, size * 0.05));
    sceneAnchorMarker.visible = true;
  }

  function publishObjectAnchor(anchor: ObjectAnchor | null) {
    if (previousAnchor !== undefined && previousAnchorId === selectedId && previousAnchor?.x === anchor?.x && previousAnchor?.y === anchor?.y
      && previousAnchor?.handleX === anchor?.handleX && previousAnchor?.handleY === anchor?.handleY && previousAnchor?.metersPerPixel === anchor?.metersPerPixel) return;
    previousAnchor = anchor;
    previousAnchorId = selectedId;
    options.onObjectAnchor?.(anchor);
  }

  function updateObjectAnchor() {
    if (!options.onObjectAnchor) return;
    if (isShotView()) { publishObjectAnchor(null); return; }
    const group = records.get(selectedId)?.group;
    if (selectedIds.length > 1) {
      if (!getSelectionBounds(selectedIds, anchorBox)) { publishObjectAnchor(null); return; }
    } else if (selectedTerrainTree !== null) {
      if (!getTerrainTreeBounds(selectedTerrainTree, anchorBox)) { publishObjectAnchor(null); return; }
    } else {
      // ACT: 选中的物体即使被隐藏也继续发布屏幕锚点，浮动工具条上的眼睛按钮才能再次显示它。
      if (!group || !group.children.length) { publishObjectAnchor(null); return; }
      group.updateWorldMatrix(true, true);
      // ACT: 菜单定位复用几何包围盒，避免导航时逐帧扫描导入模型的所有顶点。
      anchorBox.setFromObject(group);
    }
    camera.updateMatrixWorld(true);
    anchorProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    anchorFrustum.setFromProjectionMatrix(anchorProjection);
    if (anchorBox.isEmpty() || !anchorFrustum.intersectsBox(anchorBox)) { publishObjectAnchor(null); return; }
    let left = Infinity;
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const x of [anchorBox.min.x, anchorBox.max.x]) for (const y of [anchorBox.min.y, anchorBox.max.y]) for (const z of [anchorBox.min.z, anchorBox.max.z]) {
      anchorPoint.set(x, y, z);
      anchorView.copy(anchorPoint).applyMatrix4(camera.matrixWorldInverse);
      if (anchorView.z >= -camera.near) continue;
      anchorPoint.project(camera);
      left = Math.min(left, anchorPoint.x);
      right = Math.max(right, anchorPoint.x);
      top = Math.min(top, -anchorPoint.y);
      bottom = Math.max(bottom, -anchorPoint.y);
    }
    if (![left, right, top, bottom].every(Number.isFinite)) { publishObjectAnchor(null); return; }
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) { publishObjectAnchor(null); return; }
    // 物体还在画面里（上面已按视锥判断）但顶边或中线出了画布——放大后的大件、贴近看的高楼——工具条和手柄贴边停住，
    // 不整个消失：否则缩放拖到一半手柄被卸载，拖动中断、比例被撤回，之后也没有手柄可以缩回去。
    const x = MathUtils.clamp((left + right + 2) / 4 * rect.width, 0, rect.width);
    const y = MathUtils.clamp((top + 1) / 2 * rect.height, 0, rect.height);
    // ACT: 手柄贴右侧边中点；每像素高度用包围盒世界高度/屏幕高度估算，保证不同远近的拖动速度一致。
    const handleX = (right + 1) / 2 * rect.width;
    const handleY = (top + bottom + 2) / 4 * rect.height;
    const pixelHeight = Math.max(1, (bottom - top) / 2 * rect.height);
    const worldHeight = Math.max(0.000001, anchorBox.max.y - anchorBox.min.y);
    const metersPerPixel = Math.min(0.5, Math.max(0.0005, worldHeight / pixelHeight));
    publishObjectAnchor({ x: Math.round(x * 2) / 2, y: Math.round(y * 2) / 2, handleX: Math.round(handleX * 2) / 2, handleY: Math.round(handleY * 2) / 2, metersPerPixel: Math.round(metersPerPixel * 100000) / 100000 });
  }

  function renderScene(view: PerspectiveCamera) {
    const actors = worldLife.getActiveObjectIds();
    staticBatches.render(!pendingLoads.size, id => actors.has(id) || selectedIds.includes(id)
      || objectEditing === id || objectLift?.id === id || !!records.get(id)?.fallSpeed, () => {
        if (view !== shotCamera && view !== viewfinderCamera) { renderer.render(scene, view); return; }
        const overlays = [helpers, transformHelper, grid, axes, brushIndicator, groundSelection, sceneAnchorMarker,
          performanceSelection, sceneCameras.root, scene.getObjectByName("performanceOverlay"), sceneBrush?.root, assetPlacement?.group];
        const visibility = overlays.map(overlay => overlay?.visible);
        try { for (const overlay of overlays) if (overlay) overlay.visible = false; renderer.render(scene, view); }
        finally { overlays.forEach((overlay, index) => { if (overlay) overlay.visible = visibility[index]!; }); }
      }, id => selectedIds.includes(id) || objectEditing === id || objectLift?.id === id || !!records.get(id)?.fallSpeed);
  }

  function updateCameraGizmos(clock = getFilmClock()) {
    const cameras = document.cameras ?? [];
    if (!camerasVisible || !cameras.length) return;
    const edited = cameraEditingId ? cameras.find(item => item.id === cameraEditingId) : undefined;
    let path: EditedCameraPath | undefined;
    if (edited) {
      const pose = getEffectivePose(edited, clock);
      const shot = cameraShotSelected?.id === edited.id ? edited.shots?.find(item => item.id === cameraShotSelected!.shotId) : undefined;
      const editing = pathEdit?.id === edited.id ? pathEdit : undefined;
      const drawing = cameraDrag?.id === edited.id ? cameraDrag.smooth : editing?.preview;
      const anchors = cameraDrag?.stroke ? undefined : editing?.anchors ?? (shot?.path ? pathAnchors(shot.path) : undefined);
      // 机位高高在上（太空、高空）时不在远处地面上画圈，用取景窗的「画轨迹」。
      const groundY = getTerrainHeight(currentTerrain(), pose.position.x, pose.position.z);
      const ring = getCameraShotAt(edited, clock.time) && pose.position.y - groundY <= strokeGroundReach ? { x: pose.position.x, y: groundY, z: pose.position.z } : undefined;
      const drop = drawing && cameraDrag && !cameraDrag.air ? cameraDrag.height : undefined;
      const tracking = getCameraTrackingAt(edited, clock.time);
      const aim = tracking ? resolveSubject(tracking) : undefined;
      const selectedIndex = anchorSelected?.id === edited.id && anchorSelected.shotId === shot?.id ? anchorSelected.index : undefined;
      const anchorGrounds = anchors?.map(point => getTerrainHeight(currentTerrain(), point.x, point.z));
      // 轨迹在地面上的投影：地上的点拖动改水平位置，空中的点拖动改高度。
      const floor = anchors ? getPathCurve(anchors).map(point => ({ x: point.x, y: getTerrainHeight(currentTerrain(), point.x, point.z) + 0.03, z: point.z })) : undefined;
      path = { take: shot, ...(drawing ? { draft: drawing } : {}), ...(ring ? { ring } : {}), ...(drop !== undefined ? { drop } : {}), ...(aim ? { aim } : {}), ...(anchors ? { anchors, anchorGrounds, floor, activeAnchor: editing?.index ?? selectedIndex } : {}) };
      publishAnchorScreen(selectedIndex !== undefined ? anchors?.[selectedIndex] : undefined);
    } else publishAnchorScreen(undefined);
    // ACT: 机位只在自己的镜头段里出现在场景中；镜头段以外的时刻不显示机位标记。
    sceneCameras.update(value => getEffectivePose(value, clock), edited?.id ?? null, camera.position, path, value => (value.enabled !== false || value.id === cameraEditingId) && !!getCameraShotAt(value, clock.time));
  }

  type PictureTarget = { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D | null };
  // 画中画：在主画布左下角按画布所需的设备像素渲染一次，立即拷进那块画布，随后整幅主画面照常覆盖。
  function renderPicture(target: PictureTarget | undefined, drawn: Vector2, skip: boolean, pick: (clock: FilmClock) => { value?: SceneCamera; pose?: CameraFraming }, clock: FilmClock) {
    if (!target || filmPreview || !document.cameras?.length) return skip;
    const { canvas: output, context } = target;
    const { width, height } = output;
    if (!context || !output.isConnected || width <= 0 || height <= 0) return skip;
    const flying = !!firstPersonLook || navigationKeys.size > 0 || !!viewTransition;
    if (flying && skip) return false;
    drawn.set(width, height);
    const { pose } = pick(clock);
    if (!pose) { context.fillStyle = "#000"; context.fillRect(0, 0, width, height); return flying; }
    // ACT: 投影按这块画布自己的宽高比：画布形状就是用户看到的取景窗形状，全局画幅一时没跟上（换画幅、Agent草稿）也不会压扁拉伸。
    const pictureAspect = width / height;
    aimCamera(viewfinderCamera, pose, pictureAspect, pictureLensAspect(pictureAspect));
    const bufferWidth = canvas.width, bufferHeight = canvas.height;
    if (bufferWidth <= 0 || bufferHeight <= 0) return flying;
    const scale = Math.min(1, bufferWidth / width, bufferHeight / height);
    const regionWidth = Math.max(1, Math.floor(width * scale)), regionHeight = Math.max(1, Math.floor(height * scale));
    // ACT: three会把视口和裁剪框乘以像素比再取整（视口四舍五入、阴影贴图归还时向下取整）；多给0.25像素，两种取整都恰好得到所需的设备像素。
    const ratio = renderer.getPixelRatio();
    try {
      drawFilm(viewfinderCamera, pose, 0, 0, (regionWidth + 0.25) / ratio, (regionHeight + 0.25) / ratio);
      // 绘图缓冲不保留到下一帧，必须在同一任务里立刻拷走；源坐标的y从缓冲顶部量起。
      context.drawImage(canvas, 0, bufferHeight - regionHeight, regionWidth, regionHeight, 0, 0, width, height);
    } finally {
      const size = renderer.getSize(shotSize);
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, size.x, size.y);
      renderer.setScissor(0, 0, size.x, size.y);
    }
    return flying;
  }
  function renderViewfinder(clock: FilmClock) {
    viewfinderSkip = renderPicture(viewfinder, viewfinderDrawn, viewfinderSkip, film => { const value = getMonitoredCamera(film.time); return { value, pose: value && getEffectivePose(value, film) }; }, clock);
    monitorSkip = renderPicture(monitor, monitorDrawn, monitorSkip, film => { const value = getProgramCamera(document.cameras ?? [], film.time); return { value, pose: value && getFilmPose(value, film) }; }, clock);
  }

  function getShotRect(width: number, height: number) {
    const filmWidth = Math.min(width, height * filmAspect), filmHeight = filmWidth / filmAspect;
    const rectWidth = Math.max(0.001, MathUtils.lerp(width, filmWidth, shotLetterbox)), rectHeight = Math.max(0.001, MathUtils.lerp(height, filmHeight, shotLetterbox));
    return { x: (width - rectWidth) / 2, y: (height - rectHeight) / 2, width: rectWidth, height: rectHeight };
  }

  function renderView() {
    const view = getRenderCamera();
    if (view !== shotCamera || shotLetterbox <= 0) { renderScene(view); return; }
    // 全屏预演：先把整幅画布涂黑，再只在居中的16:9画框里绘制成片；过渡结束后带上景深。
    const size = renderer.getSize(shotSize);
    const rect = getShotRect(size.x, size.y);
    renderer.getClearColor(shotClearColor);
    const clearAlpha = renderer.getClearAlpha();
    renderer.setClearColor("#000000", 1);
    renderer.clear();
    renderer.setClearColor(shotClearColor, clearAlpha);
    // 成片此刻没有镜头段：全屏预演保持黑场。
    try { if (!filmPreview || shotPose) drawFilm(view, filmPreview && !shotTransition ? shotPose : undefined, rect.x, rect.y, rect.width, rect.height); }
    finally {
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, size.x, size.y);
      renderer.setScissor(0, 0, size.x, size.y);
    }
  }

  function renderFrame() {
    syncTerrainMaterialVariant();
    const clock = getFilmClock();
    updateShotView(performance.now(), clock);
    updateCameraGizmos(clock);
    if (selectedIds.length > 1 || performanceEditing || worldLife.getActiveObjectIds().has(selectedId)) updateSelection();
    if (performanceEditing && !isShotView()) {
      performancePositions.clear();
      for (const actor of worldLife.getActorObjects()) performancePositions.set(actor.trackId, actor.group.position);
      performanceOverlay.update(performancePositions);
    }
    if (renderedFov !== camera.fov) { renderedFov = camera.fov; options.onFovChange?.(camera.fov); }
    if (objectBoundsDirty) {
      const record = records.get(objectBoundsDirty);
      if (record) { record.weather?.syncBounds(); recordCollision(objectBoundsDirty, record); }
      renderer.shadowMap.needsUpdate = true;
      objectBoundsDirty = "";
    }
    updateSceneAnchorMarker();
    const size = renderer.getSize(new Vector2());
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, size.x, size.y);
    const lift = objectLift;
    const logicalGroup = lift && records.get(lift.id)?.group;
    const anchorPosition = sceneAnchorMarker.position.clone();
    const localAnchor = lift && logicalGroup && sceneAnchor?.kind === "object" && sceneAnchor.objectId === lift.id ? logicalGroup.worldToLocal(anchorPosition.clone()) : undefined;
    withObjectLift(() => {
      if (objectLift) { updateSelection(); renderer.shadowMap.needsUpdate = true; }
      if (logicalGroup && localAnchor) sceneAnchorMarker.position.copy(logicalGroup.localToWorld(localAnchor));
      try { renderViewfinder(clock); renderView(); updateObjectAnchor(); }
      finally { sceneAnchorMarker.position.copy(anchorPosition); }
    });
    terrainFirstFrame = true;
    queueTerrainWarmup();
  }

  function stopNavigation() { navigationKeys.clear(); navigationTime = 0; }

  function canNavigateCamera() {
    return navigationEnabled && !disposed && !isShotView() && !cameraDrag && !dragging && !objectDrag && !terrainStroke && !assetPlacement && !sceneBrushDrawing && !performanceDragging && !boxSelection;
  }

  function syncCameraControls() {
    const enabled = canNavigateCamera();
    controls.enabled = enabled && !firstPersonLook;
  }

  function handleWheel(event: WheelEvent) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (objectDrag) {
      // 搬着物体时滚轮转向：每累计一格（约100）转15°。
      objectDrag.wheel += event.deltaY * (event.deltaMode === 1 ? 33 : 1);
      while (Math.abs(objectDrag.wheel) >= 100) { const step = Math.sign(objectDrag.wheel); objectDrag.wheel -= step * 100; rotateObjectDrag(step * -15); }
      return;
    }
    if (!canNavigateCamera()) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? Math.max(1, canvas.clientHeight) : 1);
    if (!Number.isFinite(delta) || !delta) return;
    // 滚轮永远是放大缩小：朝鼠标指着的地方推近、拉远（按住右键环视时光标藏起来了，就朝画面中心）。
    const { left, top, width, height } = canvas.getBoundingClientRect();
    if (firstPersonLook) dollyCamera(left + width / 2, top + height / 2, delta);
    else dollyCamera(event.clientX, event.clientY, delta);
  }

  // 推拉只挪机位，不改焦段；delta 与滚轮同单位，正值拉远，每 100 走掉到目标距离的 15%。
  function dollyCamera(clientX: number, clientY: number, delta: number) {
    const ray = getRay(clientX, clientY);
    if (!ray) return;
    cancelViewTransition();
    const direction = ray.direction.clone();
    const surfaces = [floor, terrainSurface?.group.getObjectByName("terrainGround")].filter((item): item is Object3D => !!item?.visible);
    const hit = raycaster.intersectObjects([...surfaces, ...[...records.values()].filter(record => record.loadedSignature === record.signature && record.group.visible).map(record => record.group)], true)[0];
    // 指着天空或极远处时按当前观察距离推拉，不会一格滚出去几百米。
    const reach = MathUtils.clamp(hit?.distance ?? camera.position.distanceTo(controls.target), 0.5, Math.max(5, camera.position.distanceTo(controls.target)) * 4);
    // 每格（约100）走掉到目标距离的15%；推近时至少留0.3米，不钻进物体里。
    let travel = reach * (1 - Math.pow(0.85, -MathUtils.clamp(delta, -1000, 1000) / 100));
    if (travel > 0) travel = Math.min(travel, Math.max(0, reach - 0.3));
    wheelDolly.copy(direction).multiplyScalar(travel);
    for (const axis of ["x", "y", "z"] as const) {
      wheelDolly[axis] = MathUtils.clamp(wheelDolly[axis], Math.max(-10000 - camera.position[axis], -10000 - controls.target[axis]), Math.min(10000 - camera.position[axis], 10000 - controls.target[axis]));
    }
    wheelDolly.y = Math.max(wheelDolly.y, getTerrainHeight(currentTerrain(), camera.position.x + wheelDolly.x, camera.position.z + wheelDolly.z) + cameraFloorHeight - camera.position.y);
    if (wheelDolly.lengthSq() < 1e-10) return;
    camera.position.add(wheelDolly);
    controls.target.add(wheelDolly);
    pendingViewSave = true;
    invalidate();
  }
  const wheelDolly = new Vector3();

  function updateCursor() {
    canvas.style.cursor = isShotView() ? "default" : routeStroke ? "crosshair" : cameraDrag || pathEdit ? cameraDrag?.stroke ? "crosshair" : "grabbing" : cameraPathDrawing ? "crosshair" : pathHover ? "grab" : firstPersonLook ? "none" : objectDrag ? objectDrag.mode === "height" ? "ns-resize" : "grabbing"
      : terrainBrush || sceneBrush?.isEnabled() || performanceEditing && !!selectedId ? "crosshair"
      : objectDragEnabled && tool === "translate" && selectedIds.length ? objectDragMode === "height" ? "ns-resize" : "grab" : "default";
  }

  function isEditingText(target: EventTarget | null) {
    const element = target as Element | null;
    return element?.nodeType === 1 && !!element.closest("input,textarea,select,[contenteditable]:not([contenteditable='false']),[role='textbox']");
  }

  function isActivationControl(target: EventTarget | null) {
    const element = target as Element | null;
    return element?.nodeType === 1 && !!element.closest("button,a[href],summary,video,[role='button']");
  }

  function handleNavigationKey(event: KeyboardEvent) {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || isEditingText(event.target) || event.code === "Space" && isActivationControl(event.target)) { stopNavigation(); return false; }
    if (!canNavigateCamera() || !navigationCodes.has(event.code)) return false;
    event.preventDefault();
    cancelViewTransition();
    if (!navigationKeys.size) navigationTime = performance.now();
    navigationKeys.add(event.code);
    return true;
  }

  function setNavigationEnabled(enabled: boolean) {
    navigationEnabled = enabled;
    if (!enabled) { cancelCameraDrag(); cancelBoxSelection(); stopNavigation(); cancelFirstPersonLook(); cancelObjectDrag(); clearObjectMotion(); }
    syncCameraControls();
    invalidate();
  }

  function cancelFirstPersonLook(finish = false) {
    const look = firstPersonLook;
    const settling = !!firstPersonTail;
    if (!finish) firstPersonTail = undefined;
    if (!look) return settling;
    firstPersonTail = finish ? { yaw: look.yaw, pitch: look.pitch, time: look.time } : undefined;
    firstPersonLook = undefined;
    if (canvas.hasPointerCapture(look.pointerId)) canvas.releasePointerCapture(look.pointerId);
    if (ownerDocument.pointerLockElement === canvas) ownerDocument.exitPointerLock();
    syncCameraControls();
    updateCursor();
    pointerStart = undefined;
    pendingViewSave = true;
    invalidate();
    return true;
  }

  function queueFirstPersonLook(event: MouseEvent) {
    const look = firstPersonLook;
    if (!look) return;
    if (!(event.buttons & 2)) { cancelFirstPersonLook(true); return; }
    const locked = ownerDocument.pointerLockElement === canvas;
    const x = locked ? event.movementX : event.clientX - look.x;
    const y = locked ? event.movementY : event.clientY - look.y;
    look.x = event.clientX;
    look.y = event.clientY;
    if (!x && !y) return;
    look.yaw -= x * 0.002;
    look.pitch = MathUtils.clamp(look.pitch - y * 0.002, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    event.preventDefault();
    invalidate();
  }

  function updateFirstPersonLook(time: number) {
    const look = firstPersonLook ?? firstPersonTail;
    if (!look) return false;
    const seconds = Math.max(0, time - look.time) / 1000;
    look.time = time;
    const yaw = look.yaw - lookRotation.y;
    const pitch = look.pitch - lookRotation.x;
    if (Math.abs(yaw) + Math.abs(pitch) < 1e-6) { firstPersonTail = undefined; return false; }
    // ACT: 鼠标事件仅累积目标，每帧统一消费；25ms 时间常数平滑合并输入，避免手感随事件频率和屏幕刷新率变化。
    const settled = Math.abs(yaw) + Math.abs(pitch) < 1e-4;
    const amount = settled || reducedMotion?.matches ? 1 : 1 - Math.exp(-seconds / 0.025);
    lookRotation.y += yaw * amount;
    lookRotation.x += pitch * amount;
    camera.quaternion.setFromEuler(lookRotation);
    camera.getWorldDirection(navigationForward);
    controls.target.copy(camera.position).addScaledVector(navigationForward, 5).clampScalar(-10000, 10000);
    if (controls.target.distanceToSquared(camera.position) < 1e-8) controls.target.copy(camera.position).addScaledVector(navigationForward, -0.2).clampScalar(-10000, 10000);
    pendingViewSave = true;
    if (settled || reducedMotion?.matches) firstPersonTail = undefined;
    return true;
  }

  function moveFirstPersonLook(event: MouseEvent) {
    if (ownerDocument.pointerLockElement === canvas) queueFirstPersonLook(event);
  }

  function releaseFirstPersonLook(event: MouseEvent) { if (event.button === 2) cancelFirstPersonLook(true); }

  function moveFirstPersonPointer(event: PointerEvent) {
    if (firstPersonLook?.pointerId !== event.pointerId || ownerDocument.pointerLockElement === canvas) return;
    queueFirstPersonLook(event);
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function beginFirstPersonLook(pointerId: number, x: number, y: number) {
    applyView(readView());
    controls.minPolarAngle = 0.01;
    controls.maxPolarAngle = Math.PI - 0.01;
    lookRotation.setFromQuaternion(camera.quaternion);
    firstPersonLook = { pointerId, x, y, locked: false, yaw: lookRotation.y, pitch: lookRotation.x, time: performance.now() };
    syncCameraControls();
    pointerStart = undefined;
    updateBrushIndicator(null);
    updateCursor();
  }

  // ACT: 触屏双指导航：两指中点拖动环视（同按住右键），捏合朝两指中点推拉（同滚轮）；单指仍走点选、框选与拖动。
  // 第一指已在搬物体、改轨迹、刷地形等编辑中时不接管，第二指忽略；暂不支持双指平移，平移仍靠中键。
  const touchPoints = new Map<number, { x: number; y: number }>();
  let touchGesture: { ids: number[]; distance: number } | undefined;

  function touchCenter(ids: number[]) {
    const [a, b] = ids.map(id => touchPoints.get(id)!);
    return { x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2, distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) };
  }

  function beginTouchGesture() {
    if (cameraDrag || pathEdit || routeStroke || objectDrag || terrainStroke || performanceDragging || firstPersonLook) return false;
    cancelBoxSelection();
    if (!canNavigateCamera()) return false;
    const ids = [...touchPoints.keys()];
    const center = touchCenter(ids);
    cancelViewTransition();
    stopNavigation();
    touchGesture = { ids, distance: center.distance };
    beginFirstPersonLook(ids[0]!, center.x, center.y);
    // 取消框选会释放第一指的捕获，两指都重新捕获，移出画布时仍能收到移动与抬起。
    for (const id of ids) canvas.setPointerCapture(id);
    return true;
  }

  function moveTouchGesture(event: PointerEvent) {
    const point = touchPoints.get(event.pointerId);
    if (!point) return;
    point.x = event.clientX;
    point.y = event.clientY;
    const gesture = touchGesture;
    const look = firstPersonLook;
    if (!gesture?.ids.includes(event.pointerId)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!look) return;
    const center = touchCenter(gesture.ids);
    look.yaw -= (center.x - look.x) * 0.003;
    look.pitch = MathUtils.clamp(look.pitch - (center.y - look.y) * 0.003, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02);
    look.x = center.x;
    look.y = center.y;
    if (center.distance > 0 && gesture.distance > 0 && center.distance !== gesture.distance) {
      // 两指间距放大 s 倍，到目标的距离缩短为 1/s，与滚轮推拉同一公式。
      dollyCamera(center.x, center.y, 100 * Math.log(center.distance / gesture.distance) / Math.log(0.85));
      gesture.distance = center.distance;
    }
    invalidate();
  }

  function endTouchPoint(event: PointerEvent) {
    if (!touchPoints.delete(event.pointerId) || !touchGesture?.ids.includes(event.pointerId)) return false;
    touchGesture = undefined;
    cancelFirstPersonLook(true);
    return true;
  }

  function handlePointerLockChange() {
    if (ownerDocument.pointerLockElement === canvas) {
      if (firstPersonLook) firstPersonLook.locked = true;
      else ownerDocument.exitPointerLock();
    } else if (firstPersonLook?.locked) cancelFirstPersonLook();
  }

  function releaseNavigationKey(event: KeyboardEvent) {
    navigationKeys.delete(event.code);
    if (!navigationKeys.size) navigationTime = 0;
  }

  function clearNavigationOnFocus(event: FocusEvent) {
    if (!navigationRoot.contains(event.target as Node) || isEditingText(event.target) || isActivationControl(event.target)) { stopNavigation(); cancelFirstPersonLook(); }
  }
  function clearNavigationOnModifier(event: KeyboardEvent) {
    if (event.code === "Escape" && filmPreview) { event.preventDefault(); event.stopImmediatePropagation(); setFilmPreview(false); return; }
    if (event.code === "Escape" && cameraDrag) { event.preventDefault(); event.stopImmediatePropagation(); cancelCameraDrag(); return; }
    if (event.code === "Escape" && routeStroke) { event.preventDefault(); event.stopImmediatePropagation(); cancelRouteStroke(); return; }
    if (event.code === "Escape" && pathEdit) { event.preventDefault(); event.stopImmediatePropagation(); cancelPathEdit(); return; }
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey || isEditingText(event.target) || event.code === "Space" && isActivationControl(event.target)) stopNavigation();
  }
  function clearNavigationOnHidden() {
    if (ownerDocument.hidden) { if (!terrainCaptureWaiters.size) cancelTerrainWarmup(); handleWindowBlur(); }
    else { invalidate(); queueTerrainWarmup(); }
  }
  function handleWindowBlur() {
    cancelCameraDrag();
    cancelBoxSelection();
    clearObjectMotion();
    endAssetPlacement();
    sceneBrush?.cancel();
    stopNavigation();
    cancelFirstPersonLook();
    cancelObjectDrag();
    cancelTerrainStroke();
    brushIndicator.visible = false;
    invalidate();
  }

  function updateNavigation(time: number) {
    if (!navigationKeys.size) return false;
    if (!canNavigateCamera() || ownerDocument.hidden || !navigationRoot.contains(ownerDocument.activeElement) || isEditingText(ownerDocument.activeElement)) { stopNavigation(); return false; }
    const seconds = MathUtils.clamp((time - navigationTime) / 1000, 0, 0.05);
    navigationTime = time;
    camera.getWorldDirection(navigationForward);
    navigationForward.y = 0;
    if (navigationForward.lengthSq() < 1e-8) navigationForward.set(-Math.sin(controls.getAzimuthalAngle()), 0, -Math.cos(controls.getAzimuthalAngle()));
    navigationForward.normalize();
    navigationRight.crossVectors(navigationForward, worldUp);
    navigationDelta.copy(navigationForward).multiplyScalar(Number(navigationKeys.has("KeyW")) - Number(navigationKeys.has("KeyS")));
    navigationDelta.addScaledVector(navigationRight, Number(navigationKeys.has("KeyD")) - Number(navigationKeys.has("KeyA")));
    navigationDelta.y = Number(navigationKeys.has("Space")) - Number(navigationKeys.has("ShiftLeft") || navigationKeys.has("ShiftRight"));
    if (!navigationDelta.lengthSq() || !seconds) return false;
    navigationDelta.normalize().multiplyScalar(navigationSpeed * seconds);
    for (const axis of ["x", "y", "z"] as const) {
      navigationDelta[axis] = MathUtils.clamp(navigationDelta[axis], Math.max(-10000 - camera.position[axis], -10000 - controls.target[axis]), Math.min(10000 - camera.position[axis], 10000 - controls.target[axis]));
    }
    navigationDelta.y = Math.max(navigationDelta.y, getTerrainHeight(currentTerrain(), camera.position.x + navigationDelta.x, camera.position.z + navigationDelta.z) + cameraFloorHeight - camera.position.y);
    if (!navigationDelta.lengthSq()) return false;
    camera.position.add(navigationDelta);
    controls.target.add(navigationDelta);
    pendingViewSave = true;
    return true;
  }

  function readView(): EditorView {
    return {
      position: toValue(camera.position),
      target: toValue(controls.target),
      fov: camera.fov,
    };
  }

  function applyView(view: EditorView) {
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
    camera.position.copy(toVector(view.position));
    controls.target.copy(toVector(view.target));
    camera.fov = view.fov ?? 50;
    const size = renderer.getSize(new Vector2());
    camera.aspect = size.x / size.y;
    camera.updateProjectionMatrix();
    controls.update();
    invalidate();
  }

  function cancelViewTransition() {
    firstPersonTail = undefined;
    if (!viewTransition) return;
    viewTransition = undefined;
    pendingViewSave = true;
  }

  function transitionView(view: EditorView) {
    if (isShotView()) return;
    cancelBoxSelection();
    if (viewTransition && JSON.stringify(viewTransition.to) === JSON.stringify(view)) return;
    stopNavigation();
    cancelFirstPersonLook();
    cancelObjectDrag();
    const from = readView();
    viewTransition = undefined;
    pendingViewSave = false;
    if (reducedMotion?.matches || toVector(from.position).distanceToSquared(toVector(view.position)) < 1e-8 && toVector(from.target).distanceToSquared(toVector(view.target)) < 1e-8 && (from.fov ?? 50) === (view.fov ?? 50)) {
      applyView(view);
      pendingViewSave = true;
      return;
    }
    // ACT: 共用渲染循环驱动相机过渡；鼠标和键盘输入可立即接管，不额外创建动画循环。
    viewTransition = { from, to: { position: { ...view.position }, target: { ...view.target }, fov: view.fov ?? 50 }, start: performance.now(), duration: 520 };
    invalidate();
  }

  function updateViewTransition(time: number) {
    const transition = viewTransition;
    if (!transition) return false;
    const progress = reducedMotion?.matches ? 1 : MathUtils.clamp((time - transition.start) / transition.duration, 0, 1);
    const amount = 1 - (1 - progress) ** 3;
    applyView({ position: toValue(toVector(transition.from.position).lerp(toVector(transition.to.position), amount)), target: toValue(toVector(transition.from.target).lerp(toVector(transition.to.target), amount)), fov: MathUtils.lerp(transition.from.fov ?? 50, transition.to.fov ?? 50, amount) });
    if (progress === 1) { viewTransition = undefined; pendingViewSave = true; }
    return true;
  }

  function isShotView() { return filmPreview || !!shotTransition; }
  function getRenderCamera() { return isShotView() ? shotCamera : camera; }

  function setCamerasVisible(visible: boolean) {
    if (!visible) cancelCameraDrag();
    camerasVisible = visible;
    sceneCameras.root.visible = visible;
    invalidate();
  }
  // 正在编辑的机位由宿主决定；ID暂时不在文档里也先记住，等新文档同步进来后生效。
  function setCameraEditing(id: string | null) {
    if (id === cameraEditingId) return;
    if (cameraDrag && cameraDrag.id !== id) cancelCameraDrag();
    if (id) { cancelBoxSelection(); cancelObjectDrag(); }
    cameraEditingId = id;
    invalidate();
  }
  function setCameraPose(id: string, pose: CameraFraming | null) {
    const value = pose ? { ...pose, position: { ...pose.position }, target: { ...pose.target } } : undefined;
    const drag = cameraDrag?.id === id ? cameraDrag : undefined;
    // ACT: 拖动机位标记期间宿主再指定画面时，只记作取消拖动后要恢复的画面，不打断手上正在拖的画面。
    if (drag) drag.previous = value;
    if (!drag?.moved) { if (value) cameraOverrides.set(id, value); else cameraOverrides.delete(id); }
    invalidate();
  }
  function getCameraPose(id: string): CameraFraming | undefined {
    const value = document.cameras?.find(item => item.id === id);
    const pose = value ? getEffectivePose(value, getFilmClock()) : cameraOverrides.get(id);
    return pose && { ...pose, position: { ...pose.position }, target: { ...pose.target } };
  }
  function getProgramCameraId() {
    return document.cameras?.length ? getProgramCamera(document.cameras, getFilmClock().time)?.id ?? null : null;
  }
  function setViewfinder(element: HTMLCanvasElement | null) {
    if (element !== (viewfinder?.canvas ?? null)) viewfinder = element ? { canvas: element, context: element.getContext("2d", { alpha: false }) } : undefined;
    viewfinderSkip = false;
    viewfinderDrawn.set(0, 0);
    invalidate();
  }
  function setMonitor(element: HTMLCanvasElement | null) {
    if (element !== (monitor?.canvas ?? null)) monitor = element ? { canvas: element, context: element.getContext("2d", { alpha: false }) } : undefined;
    monitorSkip = false;
    monitorDrawn.set(0, 0);
    invalidate();
  }
  // ACT: 改变画布的width/height属性会清空画中画；尺寸与上次绘制不同就补画一帧，宿主缩放窗口时不用另行通知。
  function isPictureStale(target: PictureTarget | undefined, drawn: Vector2) {
    const output = target?.canvas;
    return !!output && !!target?.context && !filmPreview && !!document.cameras?.length && output.isConnected && output.width > 0 && output.height > 0
      && (output.width !== drawn.x || output.height !== drawn.y);
  }
  function isViewfinderStale() { return isPictureStale(viewfinder, viewfinderDrawn) || isPictureStale(monitor, monitorDrawn); }
  function setCameraPathDrawing(id: string | null) {
    if (cameraPathDrawing === id) return;
    cameraPathDrawing = id;
    if (!id && cameraDrag?.stroke) cancelCameraDrag();
    updateCursor();
  }
  function setCameraShotSelection(id: string | null, shotId?: string) {
    cameraShotSelected = id && shotId ? { id, shotId } : undefined;
    invalidate();
  }
  /** 场景里点中的物体（含正在演绎、显示位置已移动的演员），用来挑跟踪对象。 */
  function pickSceneObject(clientX: number, clientY: number): string | undefined {
    if (!getRay(clientX, clientY)) return undefined;
    const actors = worldLife.getActorObjects().filter(actor => actor.objectId);
    const targets = [...actors.map(actor => actor.group), ...[...records.values()].filter(record => record.group.visible).map(record => record.group)];
    const hit = raycaster.intersectObjects(targets, true).find(item => item.object.visible);
    for (let node: Object3D | null = hit?.object ?? null; node; node = node.parent) {
      const actor = actors.find(item => item.group === node);
      if (actor) return actor.objectId;
      if (typeof node.userData.sceneObjectId === "string") return node.userData.sceneObjectId;
    }
    return undefined;
  }
  /** 挑跟踪点：点中物体就记下物体上的那一点（物体自身坐标），点在空地上就是场景里固定的一点。 */
  function pickTrackPoint(clientX: number, clientY: number): { objectId?: string; point: Vector3Value } | undefined {
    if (!getRay(clientX, clientY)) return undefined;
    const actors = worldLife.getActorObjects().filter(actor => actor.objectId);
    const targets = [...actors.map(actor => actor.group), ...[...records.values()].filter(record => record.group.visible).map(record => record.group)];
    const hit = raycaster.intersectObjects(targets, true).find(item => item.object.visible);
    for (let node: Object3D | null = hit?.object ?? null; hit && node; node = node.parent) {
      const actor = actors.find(item => item.group === node);
      const id = actor?.objectId ?? (typeof node.userData.sceneObjectId === "string" ? node.userData.sceneObjectId as string : undefined);
      const group = id && subjectGroup(id)?.group;
      if (id && group) { group.updateWorldMatrix(true, false); return { objectId: id, point: toValue(group.worldToLocal(hit.point.clone())) }; }
    }
    const ground = terrainPoint(clientX, clientY) ?? pointOnPlane(clientX, clientY, 0);
    return ground ? { point: ground } : undefined;
  }
  function isFilmRunning(time: SceneTime) {
    if (!document.cameras?.length || !viewfinder && !monitor && !filmPreview && !camerasVisible) return false;
    if (worldTimePreview || performanceSeek || time.paused || !(time.speed > 0)) return false;
    const range = getFilmRange();
    const seconds = worldTimeSeconds(time);
    return !!range && seconds >= range.start && seconds <= range.end;
  }
  function setFilmPreview(active: boolean) {
    const next = active && !!document.cameras?.length;
    if (next === filmPreview) return;
    updateShotView(performance.now());
    const from = getRenderCamera();
    const transition = { position: from.position.clone(), quaternion: from.quaternion.clone(), fov: from.fov, letterbox: isShotView() ? shotLetterbox : 0, start: performance.now() };
    cancelCameraDrag(); cancelBoxSelection(); cancelObjectDrag(); cancelTerrainStroke(); cancelPerformanceDrag();
    sceneBrush?.cancel(); endAssetPlacement(); stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
    filmPreview = next;
    shotTransition = reducedMotion?.matches ? undefined : transition;
    if (!isShotView()) { shotLetterbox = 0; applyView(readView()); camera.updateMatrixWorld(true); }
    // ACT: 预演只更换绘制相机，不写编辑相机、OrbitControls或世界演绎时钟。
    updateShotView(performance.now());
    performanceOverlay.setEditing(performanceEditing && !isShotView(), performanceSelectedId, performanceSelectedPoint);
    syncCameraControls(); attachTransform(); updateCursor(); publishObjectAnchor(null);
    options.onFilmPreviewChange?.(next);
    invalidate();
  }
  function updateShotView(time: number, clock?: FilmClock) {
    if (!isShotView()) { shotLetterbox = 0; return false; }
    const film = clock ?? getFilmClock();
    const monitored = filmPreview ? getMonitoredCamera(film.time) : undefined;
    const pose = monitored && (monitored.id === cameraEditingId ? getEffectivePose(monitored, film) : getFilmPose(monitored, film));
    shotPose = pose;
    shotTargetCamera.near = camera.near; shotTargetCamera.far = camera.far;
    if (pose) aimCamera(shotTargetCamera, pose, shotTargetCamera.aspect);
    else {
      shotTargetCamera.position.copy(camera.position); shotTargetCamera.quaternion.copy(camera.quaternion); shotTargetCamera.fov = camera.fov;
    }
    const transition = shotTransition;
    const progress = transition && !reducedMotion?.matches ? MathUtils.clamp((time - transition.start) / 520, 0, 1) : 1;
    const amount = 1 - (1 - progress) ** 3;
    const letterbox = filmPreview ? 1 : 0;
    shotCamera.position.copy(transition?.position ?? shotTargetCamera.position).lerp(shotTargetCamera.position, amount);
    shotCamera.quaternion.copy(transition?.quaternion ?? shotTargetCamera.quaternion).slerp(shotTargetCamera.quaternion, amount);
    shotCamera.fov = MathUtils.lerp(transition?.fov ?? shotTargetCamera.fov, shotTargetCamera.fov, amount);
    // 画框与镜头一起从整幅画布收拢到16:9，过渡中画面不会被拉伸。
    shotLetterbox = MathUtils.lerp(transition?.letterbox ?? letterbox, letterbox, amount);
    const size = renderer.getSize(shotSize);
    const rect = getShotRect(size.x, size.y);
    shotCamera.aspect = rect.width / rect.height; shotCamera.near = camera.near; shotCamera.far = camera.far;
    shotCamera.updateProjectionMatrix(); shotCamera.updateMatrixWorld(true);
    if (transition && progress === 1) {
      shotTransition = undefined;
      // ACT: 归还编辑相机时同步controls派生的朝向、投影和世界矩阵，不能只恢复绘制引用。
      if (!filmPreview) { shotLetterbox = 0; applyView(readView()); camera.updateMatrixWorld(true); }
      performanceOverlay.setEditing(performanceEditing && !isShotView(), performanceSelectedId, performanceSelectedPoint);
      syncCameraControls(); attachTransform(); updateCursor();
    }
    return true;
  }
  /**
   * 开始划机位轨迹。机位离地不高时贴着地面画、保持原离地高度；太空或高空里改在机位所在高度的水平面上画，
   * 视线几乎水平时改画在正对屏幕、穿过机位的竖直面上（像在玻璃上画）。atCamera为true时从机位当前位置起笔。
   */
  function beginCameraStroke(id: string, pose: CameraFraming, event: PointerEvent, atCamera: boolean) {
    const ray = getRay(event.clientX, event.clientY);
    if (!ray) return false;
    const groundY = getTerrainHeight(currentTerrain(), pose.position.x, pose.position.z);
    const height = Math.max(0.2, pose.position.y - groundY);
    const groundAt = () => terrainPoint(event.clientX, event.clientY);
    let plane = new Plane(worldUp, 0);
    let first: Vector3Value | null = null;
    // 贴地：落在地面上的点抬到机位的离地高度。air为true时在plane上画。
    let ground = height <= strokeGroundReach ? groundAt() : null;
    if (ground) first = { x: ground.x, y: ground.y + height, z: ground.z };
    else {
      const level = new Plane(worldUp, -pose.position.y);
      const levelHit = Math.abs(ray.direction.y) >= 0.2 ? ray.intersectPlane(level, new Vector3()) : null;
      const flat = camera.getWorldDirection(new Vector3()).setY(0);
      if (levelHit && levelHit.distanceTo(camera.position) < 5000) { plane = level; first = toValue(levelHit); }
      else if ((ground = groundAt())) first = { x: ground.x, y: ground.y + height, z: ground.z };
      else if (flat.lengthSq() > 1e-6) {
        plane = new Plane().setFromNormalAndCoplanarPoint(flat.normalize(), toVector(pose.position));
        const hit = ray.intersectPlane(plane, new Vector3());
        if (hit && hit.distanceTo(camera.position) < 5000) first = toValue(hit);
      }
    }
    if (atCamera) first = { ...pose.position };
    if (!first) return false;
    event.preventDefault(); event.stopImmediatePropagation();
    cameraDrag = { id, pointer: event.pointerId, plane, start: new Vector3(), screen: new Vector2(event.clientX, event.clientY), position: toVector(first), target: toVector(pose.target), focalLength: pose.focalLength, pose, moved: false, delta: new Vector3(), stroke: [first], smooth: [first], height, air: !ground && !(atCamera && height <= strokeGroundReach), screenY: event.clientY };
    stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
    canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
    syncCameraControls(); updateCursor(); pointerStart = undefined; invalidate();
    return true;
  }
  /** 划线时鼠标下的轨迹点；按住Shift时鼠标上下移动改为升降机位（摇臂、太空里的上下飞）。 */
  function cameraStrokePoint(drag: NonNullable<typeof cameraDrag>, event: PointerEvent): Vector3Value | null {
    const last = drag.stroke![drag.stroke!.length - 1]!;
    const dy = event.clientY - (drag.screenY ?? event.clientY);
    drag.screenY = event.clientY;
    if (event.shiftKey) {
      const size = renderer.getSize(new Vector2());
      const metersPerPixel = camera.position.distanceTo(toVector(last)) * 2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) / Math.max(1, size.y);
      const lift = -dy * metersPerPixel;
      if (!drag.air) drag.height = Math.max(0.2, (drag.height ?? 1.6) + lift);
      else if (Math.abs(drag.plane.normal.y) > 0.5) drag.plane.constant -= lift;
      return { ...last, y: last.y + lift };
    }
    if (drag.air) {
      const hit = getRay(event.clientX, event.clientY)?.intersectPlane(drag.plane, new Vector3());
      return hit && hit.distanceTo(camera.position) < 5000 ? toValue(hit) : null;
    }
    const ground = terrainPoint(event.clientX, event.clientY) ?? pointOnPlane(event.clientX, event.clientY, 0);
    return ground ? { x: ground.x, y: ground.y + (drag.height ?? 1.6), z: ground.z } : null;
  }
  function publishAnchorScreen(point: Vector3Value | undefined) {
    let next: { x: number; y: number } | null = null;
    if (point) {
      const rect = canvas.getBoundingClientRect();
      const v = toVector(point).project(getRenderCamera());
      if (v.z <= 1) next = { x: (v.x + 1) / 2 * rect.width, y: (1 - v.y) / 2 * rect.height };
    }
    if (next === anchorScreen || next && anchorScreen && Math.abs(next.x - anchorScreen.x) < 0.5 && Math.abs(next.y - anchorScreen.y) < 0.5) return;
    anchorScreen = next;
    options.onCameraAnchorScreen?.(next);
  }
  function selectCameraAnchor(anchor: { id: string; shotId: string; index: number } | null) {
    anchorSelected = anchor ?? undefined;
    options.onCameraAnchorSelect?.(anchor);
    invalidate();
  }
  function setCameraAnchorSelection(anchor: { id: string; shotId: string; index: number } | null) { anchorSelected = anchor ?? undefined; invalidate(); }
  function groundHeightAt(x: number, z: number) { return getTerrainHeight(currentTerrain(), x, z); }
  /**
   * 选中镜头段的轨迹上鼠标下的东西：空中的锚点或线（lift=true，拖动改高度）、地上的投影点或线（lift=false，拖动改水平位置）。
   * 点在线上时insert是要在第几个锚点前插入新锚点，point是插入处（空中位置）。
   */
  function hitEditedPath(clientX: number, clientY: number) {
    if (!camerasVisible || !cameraEditingId || cameraShotSelected?.id !== cameraEditingId) return undefined;
    const value = document.cameras?.find(item => item.id === cameraEditingId);
    const shot = value?.shots?.find(item => item.id === cameraShotSelected!.shotId);
    if (!value || !shot?.path || shot.path.length < 2) return undefined;
    const anchors = pathAnchors(shot.path);
    const rect = canvas.getBoundingClientRect();
    const view = getRenderCamera();
    const toScreen = (point: Vector3Value) => { const v = toVector(point).project(view); return v.z > 1 ? null : new Vector2(rect.left + (v.x + 1) / 2 * rect.width, rect.top + (1 - v.y) / 2 * rect.height); };
    const ground = (point: Vector3Value) => ({ x: point.x, y: getTerrainHeight(currentTerrain(), point.x, point.z) + 0.03, z: point.z });
    const mouse = new Vector2(clientX, clientY);
    const base = { id: value.id, shotId: shot.id, anchors };
    // 先找点（空中的点优先），再找线。
    let best: { index: number; lift: boolean; distance: number } | undefined;
    anchors.forEach((point, index) => {
      for (const lift of [true, false]) {
        const screen = toScreen(lift ? point : ground(point));
        const distance = screen ? screen.distanceTo(mouse) : Infinity;
        if (distance < 12 && (!best || distance < best.distance - (lift ? 0 : 2))) best = { index, lift, distance };
      }
    });
    if (best) return { ...base, index: best.index as number | undefined, insert: undefined as number | undefined, point: undefined as Vector3Value | undefined, lift: best.lift };
    const curve = getPathCurve(anchors);
    let line: { distance: number; index: number; t: number; lift: boolean } | undefined;
    for (const lift of [true, false]) {
      const screen = curve.map(point => toScreen(lift ? point : ground(point)));
      for (let index = 1; index < screen.length; index++) {
        const from = screen[index - 1], to = screen[index];
        if (!from || !to) continue;
        const segment = to.clone().sub(from), span = Math.max(1e-6, segment.lengthSq());
        const t = MathUtils.clamp(mouse.clone().sub(from).dot(segment) / span, 0, 1);
        const distance = from.clone().addScaledVector(segment, t).distanceTo(mouse);
        if (!line || distance < line.distance) line = { distance, index, t, lift };
      }
    }
    if (!line || line.distance > 9) return undefined;
    const point = toValue(toVector(curve[line.index - 1]!).lerp(toVector(curve[line.index]!), line.t));
    // 曲线上第k段锚点区间对应curve里[k*curveSteps, (k+1)*curveSteps]；很密的旧轨迹按最近的锚点区间估算。
    const segment = curve === anchors ? line.index - 1 : Math.min(anchors.length - 2, Math.floor((line.index - 1) / curveSteps));
    return { ...base, index: undefined as number | undefined, insert: segment + 1 as number | undefined, point: point as Vector3Value | undefined, lift: line.lift };
  }
  function beginPathEdit(event: PointerEvent, pointsOnly = false) {
    const hit = hitEditedPath(event.clientX, event.clientY);
    if (pointsOnly && hit?.index === undefined) return false;
    const ray = hit && getRay(event.clientX, event.clientY);
    if (!hit || !ray) return false;
    event.preventDefault(); event.stopImmediatePropagation();
    const anchors = hit.anchors.map(point => ({ ...point }));
    let index = hit.index ?? -1;
    let changed = false;
    if (index < 0 && hit.point && hit.insert !== undefined) { anchors.splice(hit.insert, 0, hit.point); index = hit.insert; changed = true; }
    selectCameraAnchor({ id: hit.id, shotId: hit.shotId, index });
    // 双击锚点删掉它（至少留首尾两个）。
    const now = performance.now();
    if (hit.index !== undefined && anchorClick && anchorClick.id === hit.id && anchorClick.shotId === hit.shotId && anchorClick.index === hit.index && now - anchorClick.time < 350) {
      anchorClick = undefined;
      if (anchors.length > 2) { anchors.splice(hit.index, 1); selectCameraAnchor(null); options.onCameraPathEdit?.(hit.id, hit.shotId, anchors); }
      return true;
    }
    anchorClick = hit.index !== undefined ? { id: hit.id, shotId: hit.shotId, index: hit.index, time: now } : undefined;
    // 空中的点在正对屏幕的竖直面上拖（只取高度）；地上的点在它所在的地面高度上水平拖。
    const origin = anchors[index]!;
    const flat = camera.getWorldDirection(new Vector3()).setY(0);
    const vertical = hit.lift && flat.lengthSq() > 1e-6;
    const floorY = getTerrainHeight(currentTerrain(), origin.x, origin.z);
    const plane = vertical ? new Plane().setFromNormalAndCoplanarPoint(flat.normalize(), toVector(origin)) : new Plane(worldUp, -floorY);
    const start = ray.intersectPlane(plane, new Vector3());
    if (!start) return true;
    pathEdit = { id: hit.id, shotId: hit.shotId, pointer: event.pointerId, anchors, index, origin: { ...origin }, plane, start, screen: new Vector2(event.clientX, event.clientY), changed, lift: hit.lift, preview: changed ? getPathCurve(anchors) : undefined };
    stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
    try { canvas.setPointerCapture(event.pointerId); } catch { /* 合成事件没有真实指针 */ }
    canvas.focus({ preventScroll: true });
    pointerStart = undefined; updateCursor(); invalidate();
    return true;
  }
  function movePathEdit(event: PointerEvent) {
    const edit = pathEdit;
    if (!edit) {
      // 悬停在锚点或轨迹上时换成抓手光标。
      if (event.buttons === 0) { const hover = !cameraDrag && !!hitEditedPath(event.clientX, event.clientY); if (hover !== pathHover) { pathHover = hover; updateCursor(); } }
      return;
    }
    if (edit.pointer !== event.pointerId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!edit.changed && edit.screen.distanceTo(new Vector2(event.clientX, event.clientY)) < 3) return;
    const point = getRay(event.clientX, event.clientY)?.intersectPlane(edit.plane, new Vector3());
    if (!point) return;
    const delta = point.sub(edit.start);
    let moved: PathPoint;
    if (edit.lift) moved = { ...edit.origin, y: edit.origin.y + delta.y };
    else {
      const x = edit.origin.x + delta.x, z = edit.origin.z + delta.z;
      const height = edit.origin.y - getTerrainHeight(currentTerrain(), edit.origin.x, edit.origin.z);
      moved = { ...edit.origin, x, z, y: getTerrainHeight(currentTerrain(), x, z) + height };
    }
    edit.anchors = edit.anchors.map((anchor, index) => index === edit.index ? moved : anchor);
    edit.changed = true;
    edit.preview = getPathCurve(edit.anchors);
    invalidate();
  }
  function finishPathEdit(event: PointerEvent) {
    const edit = pathEdit;
    if (!edit || edit.pointer !== event.pointerId) return;
    movePathEdit(event);
    pathEdit = undefined;
    if (canvas.hasPointerCapture(edit.pointer)) canvas.releasePointerCapture(edit.pointer);
    updateCursor();
    if (edit.changed) { anchorClick = undefined; options.onCameraPathEdit?.(edit.id, edit.shotId, edit.anchors); }
    invalidate();
  }
  function cancelPathEdit() {
    const edit = pathEdit;
    if (!edit) return;
    pathEdit = undefined;
    if (canvas.hasPointerCapture(edit.pointer)) canvas.releasePointerCapture(edit.pointer);
    updateCursor(); invalidate();
  }
  function cancelCameraDrag() {
    const drag = cameraDrag;
    if (!drag) return false;
    cameraDrag = undefined; pointerStart = undefined;
    if (!drag.stroke && drag.moved) { if (drag.previous) cameraOverrides.set(drag.id, drag.previous); else cameraOverrides.delete(drag.id); }
    if (canvas.hasPointerCapture(drag.pointer)) canvas.releasePointerCapture(drag.pointer);
    syncCameraControls(); updateCursor(); invalidate();
    return true;
  }
  function moveCameraDrag(event: PointerEvent) {
    const drag = cameraDrag;
    if (!drag || drag.pointer !== event.pointerId) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!drag.moved && drag.screen.distanceTo(new Vector2(event.clientX, event.clientY)) < 3) return;
    if (drag.stroke) {
      // ACT: 划线：像画演绎动线一样一笔拖出机位轨迹，每隔约10厘米记一个点；画的同时显示稳定器理顺后的线，松手就是这条。
      const next = cameraStrokePoint(drag, event);
      if (!next) return;
      const last = drag.stroke[drag.stroke.length - 1]!;
      drag.moved = true;
      if (Math.hypot(next.x - last.x, next.y - last.y, next.z - last.z) >= 0.1 && drag.stroke.length < 4096) {
        drag.stroke = [...drag.stroke, next];
        drag.smooth = getPathCurve(toPathAnchors(smoothStroke(drag.stroke))) as Vector3Value[];
      }
      invalidate();
      return;
    }
    const point = getRay(event.clientX, event.clientY)?.intersectPlane(drag.plane, new Vector3());
    if (!point) return;
    const delta = point.sub(drag.start);
    for (const axis of ["x", "y", "z"] as const) delta[axis] = MathUtils.clamp(delta[axis], -10000 - Math.min(drag.position[axis], drag.target[axis]), 10000 - Math.max(drag.position[axis], drag.target[axis]));
    drag.delta.copy(delta); drag.moved = true;
    // 拖机位标记：机位跟着走，注视点不动。
    cameraOverrides.set(drag.id, { ...drag.pose, position: toValue(drag.position.clone().add(delta)) });
    invalidate();
  }
  function finishCameraDrag(event: PointerEvent) {
    const drag = cameraDrag;
    if (!drag || drag.pointer !== event.pointerId) return;
    moveCameraDrag(event);
    cameraDrag = undefined; pointerStart = undefined;
    if (canvas.hasPointerCapture(drag.pointer)) canvas.releasePointerCapture(drag.pointer);
    syncCameraControls(); updateCursor();
    // ACT: 松手后保留拖到的画面，等宿主提交的新文档同步进来时再统一清掉，避免先闪回旧位置。
    if (drag.stroke) { const anchors = toPathAnchors(smoothStroke(drag.stroke)); if (drag.moved && anchors.length > 1) options.onCameraPathDraw?.(drag.id, anchors); }
    else if (drag.moved) options.onCameraTransform?.(drag.id, { position: toValue(drag.position.clone().add(drag.delta)), target: toValue(drag.target) });
    invalidate();
  }

  function getTerrainTreeBounds(index: number, box: Box3) {
    const tree = terrainSurface?.getTree(index);
    if (!tree) return false;
    const { position, radius, height } = tree;
    box.min.set(position.x - radius, position.y, position.z - radius);
    box.max.set(position.x + radius, position.y + height, position.z + radius);
    return true;
  }

  function getSelectionBounds(ids: readonly string[], box: Box3) {
    box.makeEmpty();
    for (const id of ids) {
      const record = records.get(id);
      if (!record?.group.visible || !record.group.children.length) continue;
      record.placementBounds ??= localPlacementBounds(record.group);
      record.group.updateWorldMatrix(true, false);
      box.union(selectionPartBounds.copy(record.placementBounds).applyMatrix4(record.group.matrixWorld));
    }
    return !box.isEmpty();
  }

  function updateSelection() {
    performanceSelection.visible = false;
    selectionRoot.matrix.identity();
    selectionRoot.matrixWorldNeedsUpdate = true;
    if (selectedIds.length > 1) {
      selectionBox.visible = helpersVisible && getSelectionBounds(selectedIds, selectionBox.box);
      return;
    }
    if (selectedTerrainTree !== null) {
      selectionBox.visible = helpersVisible && getTerrainTreeBounds(selectedTerrainTree, selectionBox.box);
      return;
    }
    const record = records.get(selectedId);
    const group = record?.group;
    selectionBox.visible = helpersVisible && !performanceEditing && !!group?.visible && !!group.children.length;
    if (!record || !group?.children.length) return;
    record.placementBounds ??= localPlacementBounds(group);
    group.updateWorldMatrix(true, true);
    if (performanceEditing && helpersVisible && group.visible) {
      performanceBounds.copy(record.placementBounds).applyMatrix4(group.matrixWorld);
      performanceSelection.position.set((performanceBounds.min.x + performanceBounds.max.x) / 2, performanceBounds.min.y + 0.025, (performanceBounds.min.z + performanceBounds.max.z) / 2);
      const radius = Math.max(0.35, Math.hypot(performanceBounds.max.x - performanceBounds.min.x, performanceBounds.max.z - performanceBounds.min.z) * 0.6);
      performanceSelection.scale.setScalar(radius);
      performanceSelection.visible = true;
    }
    selectionBox.box.copy(record.placementBounds);
    selectionRoot.matrix.copy(group.matrixWorld);
  }

  function attachTransform() {
    transform.detach();
    if (!helpersVisible || selectedIds.length > 1 || isShotView()) return;
    if (["translate", "rotate", "scale"].includes(tool) && !(objectDragEnabled && tool === "translate")) {
      const record = records.get(selectedId);
      const group = record && record.loadedSignature === record.signature ? record.group : undefined;
      if (group?.visible && group.children.length) {
        transform.setMode(tool as "translate" | "rotate" | "scale");
        transform.setSpace(tool === "translate" ? "world" : "local");
        transform.attach(group);
      }
    }
    invalidate();
  }

  function objectTransformSignature(object: SceneObject) {
    return JSON.stringify([object.position, object.rotation, object.scale, object.height, object.gravityEnabled, object.visible]);
  }

  function applyObject(record: SceneRecord, object: SceneObject, force = false) {
    if (dragging && (record.group === transform.object || objectDrag?.id === object.id || objectDrag?.members?.some(member => member.id === object.id))) return;
    const signature = objectTransformSignature(object);
    if (force || record.transformSignature !== signature) {
      record.transformSignature = signature;
      record.fallSpeed = 0;
      record.resting = false;
      if (record.collider) gravityWake = true;
      gravitySleeping = false;
      record.group.position.copy(toVector(object.position));
      record.group.rotation.set(...[object.rotation.x, object.rotation.y, object.rotation.z].map(MathUtils.degToRad) as [number, number, number]);
      record.group.scale.copy(toVector(object.scale));
      record.group.updateWorldMatrix(true, true);
      // 没写height时按模型底面当前的世界高度。
      let height = object.height;
      if (height === undefined) {
        updateFloorBounds(record.group);
        height = getSceneObjectHeight(object, floorBounds);
      }
      if (Number.isFinite(height)) applyObjectHeight(record.group, { height, gravityEnabled: getObjectGravityEnabled(object) });
      record.weather?.syncBounds();
    }
    record.group.visible = object.visible;
    if (object.asset.kind === "primitive" && record.loadedSignature === record.signature && record.color !== object.color) {
      record.group.traverse(child => {
        if (!(child instanceof Mesh)) return;
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
          if (material instanceof MeshStandardMaterial && !material.userData.fixedColor && (object.asset.shape !== "riggedPerson" || material.userData.sceneObjectColor)) material.color.set(object.color);
        }
      });
      record.color = object.color;
    }
    if (record.placementBounds && records.get(object.id) === record) recordCollision(object.id, record);
  }

  function currentTerrain() { return terrainStroke?.draft ?? pendingTerrain ?? document.terrain; }

  function syncTerrainEnvironment(surface?: ReturnType<typeof createTerrainSurface>) {
    terrainEnvSky.copy(sky.color).multiplyScalar(sky.intensity);
    terrainEnvGround.copy(sky.groundColor).multiplyScalar(sky.intensity);
    terrainEnvSun.copy(sun.color).multiplyScalar(sun.intensity);
    terrainEnvSunDirection.copy(sun.position).sub(sun.target.position).normalize();
    const apply = (target: ReturnType<typeof createTerrainSurface> | undefined) => target?.setEnvironment(terrainEnvSky, terrainEnvGround, terrainEnvSun, terrainEnvSunDirection);
    if (surface) apply(surface);
    else { apply(terrainSurface); apply(preparedTerrainSurface); }
  }

  function getTerrainWarmupKey(surface: ReturnType<typeof createTerrainSurface>) {
    const material = surface.getMaterialWarmupMesh().material;
    return [material.version, scene.fog?.constructor.name ?? "none", renderer.shadowMap.enabled,
      renderer.shadowMap.type, renderer.toneMapping, renderer.outputColorSpace].join("/");
  }

  function cancelTerrainWarmup() {
    terrainWarmupSerial++;
    if (terrainWarmupTimer !== undefined) ownerWindow?.clearTimeout(terrainWarmupTimer);
    if (terrainWarmupDelay !== undefined) ownerWindow?.clearTimeout(terrainWarmupDelay);
    terrainWarmupTimer = undefined; terrainWarmupDelay = undefined;
    terrainWarmupTarget = undefined; terrainWarmupKey = "";
  }

  function settleTerrainCaptures(error?: Error, surface?: ReturnType<typeof createTerrainSurface>) {
    for (const waiter of terrainCaptureWaiters) {
      if (surface && waiter.surface !== surface) continue;
      if (waiter.timer !== undefined) ownerWindow?.clearTimeout(waiter.timer);
      terrainCaptureWaiters.delete(waiter);
      if (error) waiter.reject(error); else waiter.resolve();
    }
  }

  function getTerrainRenderQuality(): "none" | "basic" | "full" {
    if (!terrainSurface) return "none";
    return !terrainContextLost && terrainReadyKeys.get(terrainSurface) === getTerrainWarmupKey(terrainSurface) ? "full" : "basic";
  }

  function waitForTerrainMaterial(): Promise<void> {
    const surface = terrainSurface;
    if (disposed || terrainContextLost) return Promise.reject(new Error("场景渲染器已关闭或上下文已丢失"));
    if (!surface || !parallelShaderCompile || getTerrainRenderQuality() === "full") return Promise.resolve();
    if (!ownerWindow) return Promise.reject(new Error("无法准备精细地貌观察"));
    if (terrainFailedKeys.get(surface) === getTerrainWarmupKey(surface)) return Promise.reject(new Error("精细地貌材质不可用，无法完成精细观察"));
    return new Promise((resolve, reject) => {
      const waiter = { surface, resolve, reject, timer: undefined as number | undefined };
      waiter.timer = ownerWindow.setTimeout(() => {
        terrainCaptureWaiters.delete(waiter);
        reject(new Error("精细地貌材质准备超时，请稍后重新观察"));
        if (!terrainCaptureWaiters.size && options.autoRender === false) cancelTerrainWarmup();
      }, 12000);
      terrainCaptureWaiters.add(waiter);
      queueTerrainWarmup();
    });
  }

  function queueTerrainWarmup() {
    const observing = terrainCaptureWaiters.size > 0;
    if (disposed || terrainContextLost || ownerDocument.hidden && !observing || !terrainFirstFrame && !observing
      || !ownerWindow || terrainWarmupTimer !== undefined || terrainWarmupDelay !== undefined) return;
    const current = terrainSurface ?? preparedTerrainSurface;
    if (current && (!parallelShaderCompile || terrainReadyKeys.get(current) === getTerrainWarmupKey(current)
      || terrainFailedKeys.get(current) === getTerrainWarmupKey(current))) return;
    const serial = terrainWarmupSerial;
    terrainWarmupTimer = ownerWindow.setTimeout(() => {
      terrainWarmupTimer = undefined;
      if (disposed || terrainContextLost || ownerDocument.hidden && !terrainCaptureWaiters.size || serial !== terrainWarmupSerial) return;
      if (!terrainCaptureWaiters.size && (terrainStroke || sceneBrushDrawing || objectDrag || firstPersonLook || performanceDragging || navigationKeys.size)) {
        terrainWarmupDelay = ownerWindow.setTimeout(() => { terrainWarmupDelay = undefined; queueTerrainWarmup(); }, 80);
        return;
      }
      if (!terrainSurface && !preparedTerrainSurface) {
        preparedTerrain = createTerrain();
        preparedTerrainSurface = createTerrainSurface(preparedTerrain);
        preparedTerrainSurface.setWeather(document.weather);
        syncTerrainEnvironment(preparedTerrainSurface);
      }
      const surface = terrainSurface ?? preparedTerrainSurface;
      const parallelExtension = parallelShaderCompile;
      if (!surface || !parallelExtension) return;
      const key = getTerrainWarmupKey(surface);
      surface.setMaterialReady(false);
      terrainWarmupTarget = surface; terrainWarmupKey = key;
      const gl = renderer.getContext();
      let program: WebGLProgram | undefined, fullStage = false, started = 0;
      const currentJob = () => !disposed && !terrainContextLost && serial === terrainWarmupSerial
        && terrainWarmupTarget === surface && (!ownerDocument.hidden || terrainCaptureWaiters.size > 0);
      const fail = (error: unknown) => {
        terrainFailedKeys.set(surface, key);
        cancelTerrainWarmup(); surface.setMaterialReady(false);
        const reason = error instanceof Error ? error : new Error("精细地貌材质无法准备");
        settleTerrainCaptures(reason, surface); options.onError(reason.message);
      };
      const submit = (full: boolean) => {
        const mesh = full ? surface.getMaterialWarmupMesh() : surface.group.getObjectByName("terrainGround");
        if (!(mesh instanceof Mesh)) throw new Error("无法准备地貌材质");
        fullStage = full; started = performance.now();
        // ACT: KHR下仅提交编译；自有25ms轮询可取消，避免Three.compileAsync的内部timer访问已释放材质。
        renderer.compile(mesh, camera, scene);
        const properties = renderer.properties.get(mesh.material) as { currentProgram?: { program?: WebGLProgram } };
        program = properties.currentProgram?.program;
        if (!program) throw new Error("无法准备地貌材质");
        terrainWarmupTimer = ownerWindow.setTimeout(poll, 25);
      };
      const submitFull = () => {
        terrainWarmupTimer = undefined;
        if (!currentJob()) return;
        try {
          if (getTerrainWarmupKey(surface) !== key) { cancelTerrainWarmup(); queueTerrainWarmup(); return; }
          if (!terrainCaptureWaiters.size && (terrainStroke || sceneBrushDrawing || objectDrag || firstPersonLook || performanceDragging || navigationKeys.size)) {
            terrainWarmupTimer = ownerWindow.setTimeout(submitFull, 80);
            return;
          }
          submit(true);
        } catch (error) { fail(error); }
      };
      const poll = () => {
        terrainWarmupTimer = undefined;
        if (!currentJob()) return;
        try {
          if (gl.isContextLost()) { cancelTerrainWarmup(); settleTerrainCaptures(new Error("3D渲染上下文已丢失"), surface); return; }
          if (getTerrainWarmupKey(surface) !== key) { cancelTerrainWarmup(); queueTerrainWarmup(); return; }
          if (performance.now() - started > 60000) throw new Error("地貌材质准备超时，已保留基础材质");
          if (!gl.getProgramParameter(program!, parallelExtension.COMPLETION_STATUS_KHR)) {
            terrainWarmupTimer = ownerWindow.setTimeout(poll, 25);
            return;
          }
          if (!gl.getProgramParameter(program!, gl.LINK_STATUS)) throw new Error("地貌材质编译失败");
          if (!fullStage) { submitFull(); return; }
          terrainReadyKeys.set(surface, key);
          terrainWarmupTarget = undefined; terrainWarmupKey = "";
          surface.setMaterialReady(true); settleTerrainCaptures(undefined, surface); invalidate();
        } catch (error) { fail(error); }
      };
      try { submit(false); } catch (error) { fail(error); }
    }, 0);
  }

  function syncTerrainMaterialVariant() {
    const surface = terrainSurface ?? preparedTerrainSurface;
    if (!surface || terrainContextLost) return;
    const key = getTerrainWarmupKey(surface);
    const ready = terrainReadyKeys.get(surface) === key;
    surface.setMaterialReady(ready);
    if (terrainWarmupTarget && (terrainWarmupTarget !== surface || terrainWarmupKey !== key)) cancelTerrainWarmup();
    if (!ready) queueTerrainWarmup();
  }

  function renderTerrain(terrain?: SceneTerrain, materialOnly = false) {
    if (disposed) return;
    const previousSize = terrainSurface?.group.userData.terrainSize as number | undefined;
    let shadowChanged = false;
    if (terrain) {
      if (terrainSurface && terrainSurface.group.userData.terrainSegments !== terrain.segments) {
        settleTerrainCaptures(new Error("观察期间地形已更换"), terrainSurface);
        cancelTerrainWarmup();
        selectTerrainTree(null);
        scene.remove(terrainSurface.group);
        terrainSurface.dispose();
        terrainSurface = undefined;
        shadowChanged = true;
      }
      if (!terrainSurface) {
        if (preparedTerrainSurface && preparedTerrain?.segments === terrain.segments && preparedTerrain.size === terrain.size) {
          terrainSurface = preparedTerrainSurface;
          preparedTerrainSurface = undefined;
          preparedTerrain = undefined;
          terrainSurface.update(terrain, materialOnly);
        } else {
          if (preparedTerrainSurface) { settleTerrainCaptures(new Error("观察期间地形已更换"), preparedTerrainSurface); cancelTerrainWarmup(); preparedTerrainSurface.dispose(); preparedTerrainSurface = undefined; preparedTerrain = undefined; }
          terrainSurface = createTerrainSurface(terrain);
        }
        scene.add(terrainSurface.group);
        shadowChanged = true;
      } else {
        if (previousSize !== terrain.size) { settleTerrainCaptures(new Error("观察期间世界尺寸已改变"), terrainSurface); cancelTerrainWarmup(); terrainReadyKeys.delete(terrainSurface); terrainFailedKeys.delete(terrainSurface); terrainSurface.setMaterialReady(false); }
        shadowChanged = terrainSurface.update(terrain, materialOnly);
      }
      terrainSurface.group.userData.terrainSize = terrain.size;
      terrainSurface.group.userData.terrainSegments = terrain.segments;
      terrainSurface.setWeather(document.weather);
      syncTerrainEnvironment(terrainSurface);
    } else if (terrainSurface) {
      settleTerrainCaptures(new Error("观察期间地形已移除"), terrainSurface);
      cancelTerrainWarmup();
      scene.remove(terrainSurface.group);
      terrainSurface.dispose();
      terrainSurface = undefined;
      shadowChanged = true;
    }
    if (shadowChanged || previousSize !== terrain?.size) renderer.shadowMap.needsUpdate = true;
    if (previousSize !== terrain?.size) {
      floor.geometry.dispose();
      if (terrain) {
        const half = terrain.size / 2;
        const outside = Math.max(175, half + 40);
        const shape = new Shape();
        shape.moveTo(-outside, -outside).lineTo(outside, -outside).lineTo(outside, outside).lineTo(-outside, outside);
        shape.closePath();
        const hole = new Path();
        hole.moveTo(-half, -half).lineTo(-half, half).lineTo(half, half).lineTo(half, -half);
        hole.closePath();
        shape.holes.push(hole);
        floor.geometry = new ShapeGeometry(shape);
      } else floor.geometry = new PlaneGeometry(350, 350);
      const gridSize = terrain?.size ?? 100;
      const replacement = new GridHelper(gridSize, Math.max(20, Math.ceil(gridSize / 2) * 2));
      grid.geometry.dispose();
      grid.geometry = replacement.geometry;
      if (Array.isArray(replacement.material)) replacement.material.forEach(material => material.dispose());
      else replacement.material.dispose();
      updateTheme();
    }
    controls.maxDistance = Math.max(150, (terrain?.size ?? 0) * 2.4);
    axes.scale.setScalar(MathUtils.clamp((terrain?.size ?? 80) * 0.06, 2, 12));
    camera.far = Math.max(camera.far, 500, (terrain?.size ?? 0) * 4);
    camera.updateProjectionMatrix();
    const shadowExtent = Math.max(35, (terrain?.size ?? 0) * 0.6);
    Object.assign(sun.shadow.camera, { left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent, far: Math.max(90, (terrain?.size ?? 0) * 3) });
    sun.shadow.camera.updateProjectionMatrix();
    invalidate();
  }

  function syncWeather() {
    const terrainSize = currentTerrain()?.size ?? 0;
    const size = new Vector3();
    let sceneSize = 0;
    for (const record of records.values()) if (record.group.visible && record.placementBounds) sceneSize = Math.max(sceneSize, record.placementBounds.getSize(size).multiply(record.group.scale).length());
    const signature = JSON.stringify([document.weather, document.time, document.atmosphere, terrainSize, sceneSize]);
    if (signature === weatherSignature) return;
    weatherSignature = signature;
    weatherTerrainSize = terrainSize;
    weatherSceneSize = sceneSize;
    terrainSurface?.setWeather(document.weather);
    for (const record of records.values()) record.weather?.update(document.weather);
    const environment = getWeatherEnvironment(document.weather, animationTime);
    floor.material.roughness = 0.95 - environment.rain * 0.6;
    floor.material.color.copy(floorBaseColor).multiplyScalar(1 - environment.rain * 0.15);
    updateWorldClock(true);
  }

  function getWorldHour() {
    return getWorldTime().hour;
  }

  function getWorldTime() {
    return advanceSceneTime(worldTimeOrigin, Math.max(0, performance.now() - worldClockOrigin) / 1000);
  }

  function worldTimeSeconds(time: SceneTime) {
    return Date.parse(time.date + "T00:00:00Z") / 1000 + time.hour * 3600;
  }

  function setWorldTimePreview(time?: SceneTime) {
    if (worldTimePreview && !time) worldLifeClockJump = true;
    worldTimePreview = time;
    updateWorldClock(true);
  }

  // ACT: 文档刚改了世界时间（换氛围、按场次定日夜）还没跑到下一帧时，先让演绎按新时钟平移排期，再按成片时间定位，不会按旧锚点把时间拉回去。
  /** 整场演绎从此刻重新开演（Agent 改了演绎或镜头后：新旧轨道、直接控制的物件和成片镜头对齐到同一个起点）。 */
  function restartPerformance() {
    if (disposed || !document.life?.enabled) return;
    if (lifeNeedsSync) syncWorldLife(true);
    worldLife.restart();
    publishLifeStatus();
    invalidate();
  }
  function settleClock() {
    // 也用于演绎还没跑过一帧（刚搭完景、面板隐藏）时先排好期，分镜取样才有真实走位。
    if (disposed || !worldLifeClockJump && (!document.life?.enabled || worldLife.getPlaybackRange())) return;
    if (lifeNeedsSync) syncWorldLife(true);
    animateWorld(animationTime);
    publishLifeStatus();
  }
  function seekPerformance(seconds: number, phase: "start" | "move" | "end" | "cancel") {
    if (phase === "cancel") {
      if (!performanceSeek) return getWorldTime();
      worldLife.restore(performanceSeek.life);
      worldTimeOrigin = performanceSeek.time;
      worldLifeClockJump = performanceSeek.jump;
      performanceSeek = undefined;
    } else {
      if (!Number.isFinite(seconds) || seconds < Date.UTC(1900, 0, 1) / 1000 || seconds >= Date.UTC(2201, 0, 1) / 1000) throw new Error("播放时刻超出世界日期范围");
      performanceSeek ??= { time: getWorldTime(), life: worldLife.snapshot(), jump: worldLifeClockJump };
      const hasActors = document.life?.enabled && getPerformanceTracks(document.life, document.objects, document.objectGroups).some(track => track.enabled !== false);
      let seeked = worldLife.seek(seconds, undefined, phase !== "end");
      // ACT: 刚移动模型可能还有一次延迟的演绎同步；先补同步再重试，避免误报“尚未准备完成”。
      if (!seeked) { syncWorldLife(true); seeked = worldLife.seek(seconds, undefined, phase !== "end"); }
      if (!seeked) {
        if (pendingLoads.size) throw new Error("演绎尚未准备完成，请等待模型载入后再定位");
        // ACT: 只有机位时没有演绎可定位，worldLife.seek必然失败；仍要移动世界时钟，播放头和机位画面才会跟着走。
        if (hasActors || !document.cameras?.length) {
          worldLife.restore(performanceSeek.life);
          worldTimeOrigin = performanceSeek.time;
          worldLifeClockJump = performanceSeek.jump;
          performanceSeek = undefined;
          publishLifeStatus();
          invalidate();
          return getWorldTime();
        }
      }
      worldTimeOrigin = { ...performanceSeek.time, date: new Date(seconds * 1000).toISOString().slice(0, 10), hour: ((seconds % 86400 + 86400) % 86400) / 3600, paused: true };
      worldLifeClockJump = false;
      if (phase === "end") performanceSeek = undefined;
    }
    worldClockOrigin = performance.now();
    if (phase === "move") {
      movingShadowPending = true;
      lifeStatusPending = true;
      updateWorldClock(false, undefined, true);
    } else {
      updateWorldClock(true);
      publishLifeStatus();
    }
    invalidate();
    return getWorldTime();
  }

  function updateWorldClock(force = false, time = worldTimePreview ?? getWorldTime(), deferShadow = false) {
    const hour = time.hour;
    const second = `${time.date}/${Math.floor(hour * 3600)}`;
    const changed = second !== publishedWorldSecond;
    if (!changed && !force) return;
    publishedWorldSecond = second;
    if (changed || force) {
      options.onWorldHourChange?.(hour);
      options.onWorldTimeChange?.(time);
    }
    // ACT: 按世界秒更新天空与光照；时间预览独立于已接受时钟，取消拖动不会倒回上次保存时刻。
    const weather: SceneWeather = { condition: "clear", timeOfDay: "day", intensity: 0, wind: 0, ...document.weather, hour };
    const lighting = worldWeather.update(weather, weatherTerrainSize, weatherSceneSize, time);
    worldCelestials.update(time, weather);
    if (!deferShadow) renderer.shadowMap.needsUpdate = true;
    scene.background = new Color(lighting.background);
    const fog = new Fog(lighting.fogColor, lighting.fogNear, lighting.fogFar);
    const atmosphere = document.atmosphere ?? defaultAtmosphere;
    if (atmosphere.enabled && atmosphere.intensity > 0) {
      const coverage = MathUtils.clamp((fog.far - atmosphere.start) * atmosphere.intensity / atmosphere.distance, 0, 1);
      const airFar = atmosphere.start + atmosphere.distance / atmosphere.intensity;
      // ACT: 用单层 Fog 近似空气与天气叠合，只提前原有遮蔽范围；强度趋零时连续退回天气雾。
      fog.near = MathUtils.lerp(fog.near, Math.min(fog.near, atmosphere.start), coverage);
      fog.far = MathUtils.lerp(fog.far, Math.min(fog.far, airFar), coverage);
      const airColor = new Color(atmosphere.color).lerp(fog.color, atmosphere.weatherInfluence * 0.65);
      fog.color.lerp(airColor, coverage);
    }
    scene.fog = fog;
    camera.far = Math.max(camera.far, lighting.fogFar * 1.1);
    camera.updateProjectionMatrix();
    sun.color.set(lighting.sunColor);
    sun.intensity = lighting.sunIntensity;
    ambient.color.set(lighting.ambientColor);
    ambient.intensity = lighting.ambientIntensity;
    sky.color.set(lighting.skyColor);
    sky.groundColor.set(lighting.groundColor);
    sky.intensity = lighting.skyIntensity;
    sun.position.copy(toVector(lighting.sunPosition));
    renderer.toneMappingExposure = lighting.exposure;
    syncTerrainEnvironment();
    worldWeather.animate(animationTime, toValue(getRenderCamera().position));
    worldCelestials.animate(animationTime, toValue(getRenderCamera().position));
    invalidate();
  }

  function animateWorld(seconds: number, position?: Vector3Value) {
    const shotAnimated = updateShotView(performance.now());
    position ??= toValue(getRenderCamera().position);
    const time = getWorldTime();
    updateWorldClock(false, worldTimePreview ?? time);
    // 成片在走时机位画面随之变化；停下后再补一帧。运镜预览按真实时间扫动，期间每帧都画。
    const filmRunning = isFilmRunning(time);
    gimbalRunning = filmRunning;
    let animated = (terrainSurface?.animate(seconds) ?? false) || shotAnimated || filmRunning || filmWasRunning || isViewfinderStale();
    filmWasRunning = filmRunning;
    const lifeAnimated = worldLife.animate(seconds, performanceDrawing || !!worldTimePreview || !!performanceSeek, worldTimeSeconds(time), worldLifeClockJump);
    worldLifeClockJump = false;
    lifeStatusPending ||= lifeAnimated || !!document.life?.enabled && Math.floor(worldLife.getTime() * 10) / 10 !== lifeTimePublished;
    if (lifeStatusPending && performance.now() - lifePublishedAt >= 100) publishLifeStatus();
    animated = lifeAnimated || animated;
    animated = worldWeather.animate(seconds, position) || animated;
    animated = worldCelestials.animate(seconds, position) || animated;
    const environment = getWeatherEnvironment(document.weather, seconds);
    const terrainWind = !!terrainSurface && Math.hypot(environment.windX, environment.windZ) > 0.0001;
    let windAnimated = false;
    for (const record of windRecords) if (record.group.visible || staticBatches.needsWind(record.group)) windAnimated = (record.weather?.animate(seconds, environment) ?? false) || windAnimated;
    movingShadowPending ||= terrainWind || lifeAnimated || windAnimated;
    // 演绎与风摆按画面帧率更新，动态阴影按真实时间刷新。停止运动后补上最后一帧。
    const now = performance.now();
    if (movingShadowPending && now - movingShadowAt >= 1000 / 24) {
      renderer.shadowMap.needsUpdate = true;
      movingShadowPending = false;
      movingShadowAt = now;
      animated = true;
    }
    animated ||= windAnimated;
    return animated;
  }

  function syncTerrain() {
    if (terrainStroke) return;
    const next = JSON.stringify(document.terrain ?? null);
    if (pendingTerrain && next === JSON.stringify(pendingTerrain)) pendingTerrain = undefined;
    if (next === terrainSignature) return;
    pendingTerrain = undefined;
    terrainSignature = next;
    gravityWake = true;
    renderTerrain(document.terrain);
  }

  function getObjectPlacements(includePerformance = false) {
    return document.objects.flatMap(object => {
      if (!includePerformance && worldLife.getActiveObjectIds().has(object.id)) return [];
      const record = records.get(object.id);
      return record?.group.children.length && record.loadedSignature === record.signature ? [{ id: object.id, ...getObjectTransform(record.group, readObjectPlacement(record.group, object)) }] : [];
    });
  }

  function terrainSupport(box: Box3, terrain: SceneTerrain | null = currentTerrain() ?? null, contact?: Vector3) {
    return getSceneTerrainSupport(box, terrain, contact);
  }

  function updateFloorBounds(group: Group) {
    const elements = group.matrixWorld.elements;
    const key = [elements[0], elements[1], elements[2], elements[4], elements[5], elements[6], elements[8], elements[9], elements[10], ...group.children.map(child => child.uuid)].join(",");
    floorTranslation.set(elements[12]!, elements[13]!, elements[14]!);
    let cached = floorCache.get(group);
    if (!cached || cached.key !== key) {
      // ACT: 损坏模型按真实顶点求底面；只在模型、旋转或缩放变化时重算，平移复用缓存。
      measureCollisionBounds(group, floorBounds);
      cached = { key, bounds: floorBounds.clone().translate(floorTranslation.clone().negate()) };
      floorCache.set(group, cached);
    }
    floorBounds.copy(cached.bounds).translate(floorTranslation);
  }

  function readObjectPlacement(group: Group, object: SceneObject): HeightPlacement {
    const height = floorHeight(group);
    return { height: Number.isFinite(height) ? height : object.height ?? object.position.y, gravityEnabled: getObjectGravityEnabled(object) };
  }

  function floorHeight(group: Group) {
    group.updateWorldMatrix(true, false);
    const matrix = group.matrixWorld.elements;
    const shape = collisionShapes.get(group);
    if (shape && !shape.bounds.isEmpty() && matrix[1] === 0 && matrix[9] === 0)
      return matrix[13]! + matrix[5]! * (matrix[5]! >= 0 ? shape.bounds.min.y : shape.bounds.max.y);
    updateFloorBounds(group);
    return floorBounds.min.y;
  }

  function applyObjectHeight(group: Group, policy: HeightPlacement) {
    if (!group.children.length) return;
    const floor = floorHeight(group);
    if (!Number.isFinite(floor)) return;
    const height = group.position.y + policy.height - floor;
    if (!Number.isFinite(height) || Math.abs(height) > 10000) throw new Error("模型无法在当前尺寸与高度下放置，请调整高度或尺寸");
    group.position.y = height;
    group.updateWorldMatrix(true, true);
  }

  function getObjectHeight(id: string) {
    const record = records.get(id);
    const object = document.objects.find(object => object.id === id);
    if (!record?.group.children.length || record.loadedSignature !== record.signature || !object) return;
    record.group.updateWorldMatrix(true, true);
    updateFloorBounds(record.group);
    if (floorBounds.isEmpty()) return;
    const altitude = floorBounds.min.y;
    const ground = terrainSupport(floorBounds);
    return { altitude, ground };
  }

  function getObjectTransform(group: Group, policy: HeightPlacement): ObjectTransform {
    return {
      position: toValue(group.position),
      rotation: { x: MathUtils.radToDeg(group.rotation.x), y: MathUtils.radToDeg(group.rotation.y), z: MathUtils.radToDeg(group.rotation.z) },
      scale: toValue(group.scale),
      ...policy,
    };
  }

  function keepObjectAboveTerrain(group: Group, body = groupCollision(group)) {
    const clearance = terrainClearance(body);
    group.position.y += Math.max(0, -clearance);
    group.updateWorldMatrix(true, true);
  }

  function terrainClearance(body: CollisionBody) {
    let clearance = Infinity;
    for (const part of body.parts) clearance = Math.min(clearance, part.bounds.min.y - terrainSupport(part.bounds));
    return Number.isFinite(clearance) ? clearance : 0;
  }

  function setObjectEditing(id: string | null) {
    if (id === objectEditing) return;
    objectEditing = id;
    gravityWake = true;
    if (id) {
      const record = records.get(id);
      if (record) record.fallSpeed = 0;
    }
  }

  function updateGravity(seconds: number, settle = false) {
    if (!settle && options.canSimulateObjects?.() === false) return false;
    // 手柄拖动/数值编辑的预览还没定稿：和搬动物体一样先停重力，松手后再结算。否则放大到一半就把旁边的物体顶起并写回文档，
    // 每帧一次提交（卡顿），取消拖动后别的物体也回不去。
    if (pendingLoads.size || dragging || objectDrag || objectEditing || terrainStroke || sceneBrushDrawing) return false;
    if (!gravityWake && gravitySleeping) return false;
    if (gravityWake) { for (const record of records.values()) record.resting = false; gravityWake = false; }
    const actors = worldLife.getActiveObjectIds();
    const active = document.objects.filter(object => {
      const record = records.get(object.id);
      return object.id !== objectEditing && !actors.has(object.id) && object.visible && getObjectGravityEnabled(object) && record?.placementBounds && record.loadedSignature === record.signature && !record.resting;
    });
    gravitySleeping = !active.length;
    if (gravitySleeping) return false;
    // ACT: 仅求竖直重力，不模拟翻滚和冲量；静止物体复用碰撞缓存，只查询经过的空间格。
    active.sort((a, b) => recordCollision(a.id, records.get(a.id)!).bounds.min.y - recordCollision(b.id, records.get(b.id)!).bounds.min.y);
    const awaiting = new Set(active.map(object => object.id));
    const settled: (ObjectTransform & { id: string })[] = [];
    let changed = false;
    for (const object of active) {
      const record = records.get(object.id)!;
      const group = record.group;
      const before = group.position.y;
      const beforeBody = recordCollision(object.id, record);
      const vegetationBody = isVegetationAsset(object.asset);
      const clearance = terrainClearance(beforeBody);
      group.position.y += Math.max(0, -clearance);
      awaiting.delete(object.id);
      let body = recordCollision(object.id, record);
      // 只处理真正相交的模型部件，树冠下和家具内部的空隙不再顶起整件物体。
      // ACT: 顶起只当“迈上台阶”：支撑要在重心正下方，且一共最多抬起自身高度的三成（0.35～1.5米）。
      // 摆得互相穿插（房子压着房子、人站进桌子里）是摆放问题，原地留着交给真实观察报告，不再把整栋房顶上屋顶“起飞”。
      const center = body.bounds.getCenter(new Vector3());
      const stepLimit = Math.min(1.5, Math.max(0.35, (body.bounds.max.y - body.bounds.min.y) * 0.3));
      let lifted = 0;
      for (let pass = 0; pass < 4; pass++) {
        let lift = 0;
        for (const [id, obstacle] of collisionCandidates(body, undefined, object.id)) {
          if (awaiting.has(id) || vegetationBody && isVegetationAsset(records.get(id)!.object.asset) || obstacle.bounds.min.y > body.bounds.min.y + 0.001) continue;
          lift = Math.max(lift, getCollisionLift(body, obstacle, center));
        }
        if (lift <= 0 || lifted + lift > stepLimit + 1e-6) break;
        group.position.y += lift;
        lifted += lift;
        body = recordCollision(object.id, record);
      }
      const distance = Math.max(0, clearance + (group.position.y - before));
      const fall = settle ? distance + 0.001 : record.fallSpeed * seconds + 4.905 * seconds * seconds;
      const travel = Math.min(distance, fall);
      const delta = new Vector3(0, -travel, 0);
      let fraction = 1;
      let supported = distance <= fall + 1e-7;
      if (travel > 1e-8) for (const [id, obstacle] of collisionCandidates(body, delta, object.id)) {
        if (vegetationBody && isVegetationAsset(records.get(id)!.object.asset)) continue;
        const hit = sweepCollision(body, obstacle, delta, true);
        if (hit && hit.time < fraction) { fraction = Math.max(0, hit.time - 0.0001 / travel); supported = true; }
      }
      group.position.addScaledVector(delta, fraction);
      group.updateWorldMatrix(true, true);
      recordCollision(object.id, record);
      record.fallSpeed = supported ? 0 : record.fallSpeed + 9.81 * seconds;
      record.resting = supported;
      const placement = getObjectTransform(group, readObjectPlacement(group, object));
      if (Math.abs(before - group.position.y) > 1e-8) {
        changed = true;
        record.weather?.syncBounds();
        // 支撑物下落时只唤醒原接触范围中的物体，不再每帧唤醒整个世界。
        for (const [id] of collisionIndex.query(beforeBody.bounds.clone().expandByScalar(0.01))) {
          const other = records.get(id);
          if (id !== object.id && other?.resting && other.collider!.bounds.min.y > beforeBody.bounds.min.y) other.resting = false;
        }
        if (selectedId === object.id) options.onObjectPreview?.(object.id, placement);
      }
      if (supported && (object.height === undefined || object.gravityEnabled === undefined || Math.abs(object.position.y - group.position.y) > 1e-7 || Math.abs(object.height - placement.height!) > 1e-7)) settled.push({ id: object.id, ...placement });
    }
    if (settled.length) {
      const placements = new Map(settled.map(placement => [placement.id, placement]));
      document = { ...document, objects: document.objects.map(object => {
        const placement = placements.get(object.id);
        if (!placement) return object;
        const next = { ...object, ...placement };
        const record = records.get(object.id)!;
        record.object = next;
        record.transformSignature = objectTransformSignature(next);
        return next;
      }) };
      options.onGravitySettled?.(settled);
      if (placements.has(selectedId)) options.onObjectPreview?.(selectedId, null);
      lifeNeedsSync = true;
    }
    if (changed) { renderer.shadowMap.needsUpdate = true; updateSelection(); invalidate(); }
    return changed;
  }

/**
   * ACT: 给Agent看的摆放体检：载入真实模型并落地后，哪些物体的网格真的穿插在一起、哪些被别的物体托在半空。
   * 只看真实部件相交（屋里的家具、桌上的杯子不算），关了重力的悬挂物和植物之间的交叠不报；建议挪动小的那个。
   */
  /** 动线体检：导航后走不到的路径点（第几个点、位置），给 Agent 观察用。 */
  function getRouteReport() {
    const tracks = overlayTracks();
    const walks = routeWalks(tracks);
    const names = new Map(document.objects.map(object => [object.id, object.name]));
    return tracks.flatMap(track => {
      const index = walks.get(track.id)?.blocked;
      const point = index === undefined ? undefined : track.points[index];
      return index === undefined || !point ? [] : [{ trackId: track.id, name: track.name ?? names.get(track.objectId) ?? "场景物体", point: index, position: point.map(value => Math.round(value * 100) / 100) }];
    });
  }
  function getPlacementReport(limit = 30) {
    type Overlap = { ids: [string, string]; names: [string, string]; depth: number; move: { id: string; name: string; dx: number; dz: number } };
    type Raised = { id: string; name: string; aboveGround: number; supportedBy?: { id: string; name: string } };
    const overlaps: Overlap[] = [];
    const raised: Raised[] = [];
    const seen = new Set<string>();
    const ready = document.objects.filter(object => {
      const record = records.get(object.id);
      return object.visible && record?.collider && record.loadedSignature === record.signature;
    });
    const footprint = (bounds: Box3) => (bounds.max.x - bounds.min.x) * (bounds.max.z - bounds.min.z);
    for (const object of ready) {
      const record = records.get(object.id)!;
      const body = recordCollision(object.id, record);
      const gravity = getObjectGravityEnabled(object);
      const centerX = (body.bounds.min.x + body.bounds.max.x) / 2, centerZ = (body.bounds.min.z + body.bounds.max.z) / 2;
      const aboveGround = body.bounds.min.y - getTerrainHeight(currentTerrain(), centerX, centerZ);
      if (gravity && aboveGround > 1) {
        // 托着它的是重心正下方最高的那个物体。
        let support: { id: string; top: number } | undefined;
        for (const [id, other] of collisionIndex.query(body.bounds.clone().expandByScalar(0.05))) {
          if (id === object.id || other.bounds.max.y > body.bounds.min.y + 0.05) continue;
          if (centerX < other.bounds.min.x || centerX > other.bounds.max.x || centerZ < other.bounds.min.z || centerZ > other.bounds.max.z) continue;
          if (!support || other.bounds.max.y > support.top) support = { id, top: other.bounds.max.y };
        }
        const supporter = support && records.get(support.id)?.object;
        raised.push({ id: object.id, name: object.name, aboveGround: Math.round(aboveGround * 100) / 100, ...(supporter ? { supportedBy: { id: supporter.id, name: supporter.name } } : {}) });
      }
      if (!gravity) continue;
      for (const [id, other] of collisionCandidates(body, undefined, object.id)) {
        const key = object.id < id ? object.id + "|" + id : id + "|" + object.id;
        if (seen.has(key)) continue;
        seen.add(key);
        const otherObject = records.get(id)?.object;
        if (!otherObject?.visible || !getObjectGravityEnabled(otherObject)) continue;
        if (isVegetationAsset(object.asset) && isVegetationAsset(otherObject.asset)) continue;
        // 铺装、地毯这类薄片垫在下面是正常的。
        if (body.bounds.max.y - body.bounds.min.y < 0.35 || other.bounds.max.y - other.bounds.min.y < 0.35) continue;
        if (!intersectsCollision(body, other)) continue;
        const overlapX = Math.min(body.bounds.max.x, other.bounds.max.x) - Math.max(body.bounds.min.x, other.bounds.min.x);
        const overlapZ = Math.min(body.bounds.max.z, other.bounds.max.z) - Math.max(body.bounds.min.z, other.bounds.min.z);
        const depth = Math.min(overlapX, overlapZ);
        if (depth < 0.15) continue;
        const [small, smallBody, big, bigBody] = footprint(body.bounds) <= footprint(other.bounds) ? [object, body, otherObject, other] : [otherObject, other, object, body];
        const along = overlapX <= overlapZ ? "x" : "z";
        const sign = Math.sign(smallBody.bounds.getCenter(new Vector3())[along] - bigBody.bounds.getCenter(new Vector3())[along]) || 1;
        const distance = Math.round((depth + 0.3) * 100) / 100 * sign;
        overlaps.push({ ids: [object.id, id], names: [object.name, otherObject.name], depth: Math.round(depth * 100) / 100, move: { id: small.id, name: small.name, dx: along === "x" ? distance : 0, dz: along === "z" ? distance : 0 } });
      }
    }
    overlaps.sort((a, b) => b.depth - a.depth);
    raised.sort((a, b) => b.aboveGround - a.aboveGround);
    return { overlaps: overlaps.slice(0, limit), raised: raised.slice(0, limit), checkedObjects: ready.length };
  }

  function getObjectHeightPerPixel(id: string) {
    const group = records.get(id)?.group;
    if (!group?.children.length) return undefined;
    group.updateWorldMatrix(true, true);
    const center = new Box3().setFromObject(group).getCenter(new Vector3());
    const depth = Math.max(camera.near, -camera.worldToLocal(center).z);
    return 2 * depth * Math.tan(MathUtils.degToRad(camera.fov) / 2) / Math.max(1, canvas.getBoundingClientRect().height);
  }
  function constrainTransform(id: string, values: ObjectTransform, deriveHeight = false) {
    const record = records.get(id);
    if (record && (!record.group.children.length || record.loadedSignature !== record.signature)) throw new Error("模型仍在载入，暂不能按旧几何调整位置、旋转或缩放");
    const group = record?.group;
    if (!group) return values;
    const object = document.objects.find(object => object.id === id);
    if (!object) return values;
    const previous = readObjectPlacement(group, object);
    let policy: HeightPlacement = { height: values.height ?? previous.height, gravityEnabled: values.gravityEnabled ?? previous.gravityEnabled };
    const position = group.position.clone();
    const rotation = group.rotation.clone();
    const scale = group.scale.clone();
    try {
      group.position.copy(toVector(values.position));
      group.rotation.set(MathUtils.degToRad(values.rotation.x), MathUtils.degToRad(values.rotation.y), MathUtils.degToRad(values.rotation.z));
      group.scale.copy(toVector(values.scale));
      if (deriveHeight) {
        group.updateWorldMatrix(true, true);
        updateFloorBounds(group);
        if (!floorBounds.isEmpty()) policy = { ...policy, height: floorBounds.min.y };
      }
      applyObjectHeight(group, policy);
      return { ...values, ...policy, position: toValue(group.position) };
    } finally {
      group.position.copy(position);
      group.rotation.copy(rotation);
      group.scale.copy(scale);
      group.updateWorldMatrix(true, true);
    }
  }

  async function loadAssetContent(asset: SceneAsset, color: string, isCurrent: () => boolean, instanceParts = false): Promise<Group | undefined> {
    if (!isCurrent()) return;
    if (asset.kind === "primitive") return createPrimitive(asset, color);
    if (!asset.path && (asset.model || asset.recipe || asset.blueprint)) {
      const definition = resolveAssetModel(asset);
      if (!definition) throw new Error("素材缺少可用的模型定义");
      // 配方和蓝图有稳定的造型定义；每个物件保留自己的材质、天气和变换，几何由最后的使用者释放。
      const reusable = instanceParts && !asset.model;
      let template = reusable ? modelTemplates.get(definition) : undefined;
      if (!template) {
        const model = createModelGroup(definition, undefined, instanceParts);
        const bounds = measureCollisionBounds(model, new Box3());
        const size = bounds.getSize(new Vector3());
        const extent = Math.max(size.x, size.y, size.z);
        if (bounds.isEmpty() || !Number.isFinite(extent) || extent < 0.000001) {
          disposeObject(model);
          throw new Error("模型没有可显示的几何体");
        }
        template = { model, bounds, size };
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
      const model = reusable ? template.model.clone(true) : template.model;
      const box = template.bounds;
      const size = template.size;
      const materials = new Map<Material, Material>();
      if (reusable) model.traverse(child => {
        if (!(child instanceof Mesh)) return;
        retainMeshGeometry(child);
        if (child instanceof InstancedMesh) modelPartBatches.add(child);
        // createModelGroup 的每个部件只使用一种无贴图材质。
        const source = child.material as Material;
        if (!materials.has(source)) materials.set(source, source.clone());
        child.material = materials.get(source)!;
      });
      return createAssetModelContent(asset, model, box);
    }
    const bytes = await options.loadModel(asset);
    if (!isCurrent()) return;
    const manager = new LoadingManager();
    let resourceFailed = false;
    manager.onError = () => { resourceFailed = true; };
    const model = await parseGltfModel(bytes, manager);
    if (!isCurrent()) {
      disposeObject(model.scene);
      return;
    }
    if (resourceFailed) {
      disposeObject(model.scene);
      throw new Error("模型贴图载入失败");
    }
    model.scene.animations = model.animations;
    return createAssetModelContent(asset, model.scene);
  }

  function localPlacementBounds(group: Group) {
    return collisionShape(group).bounds;
  }

  function collisionShape(group: Group) {
    let shape = collisionShapes.get(group);
    if (!shape) { shape = createCollisionShape(group); collisionShapes.set(group, shape); }
    return shape;
  }

  function groupCollision(group: Group) {
    group.updateWorldMatrix(true, false);
    return transformCollisionShape(collisionShape(group), group.matrixWorld);
  }

  function recordCollision(id: string, record: SceneRecord) {
    record.group.updateWorldMatrix(true, false);
    if (!record.collider || !record.colliderMatrix?.equals(record.group.matrixWorld)) {
      record.collider = groupCollision(record.group);
      record.colliderMatrix = record.group.matrixWorld.clone();
    }
    if (!record.group.visible || worldLife.getActiveObjectIds().has(id)) collisionIndex.remove(id);
    else collisionIndex.set(id, record.collider);
    return record.collider;
  }

  function collisionCandidates(body: CollisionBody, delta?: Vector3, excludeId?: string) {
    const bounds = body.bounds.clone();
    if (delta) bounds.union(body.bounds.clone().translate(delta));
    const candidates = collisionIndex.query(bounds.expandByScalar(0.004));
    if (excludeId) candidates.delete(excludeId);
    return candidates;
  }

  async function loadObject(job: ObjectLoadJob) {
    const { record, object, signature, token } = job;
    const isCurrent = () => !disposed && records.get(object.id) === record && record.token === token;
    let staging: Group | undefined;
    let weather: ReturnType<typeof createObjectWeather> | undefined;
    try {
      const content = await loadAssetContent(object.asset, object.color, isCurrent, true);
      if (!content) return;
      staging = new Group();
      staging.add(content);
      if (!isCurrent()) return;
      const current = record.object;
      if (!object.asset.path && !object.asset.model) {
        const shape = assetCollisionShapes.get(signature) ?? collisionShape(staging);
        collisionShapes.set(staging, shape);
        assetCollisionShapes.delete(signature);
        assetCollisionShapes.set(signature, shape);
        if (assetCollisionShapes.size > 64) assetCollisionShapes.delete(assetCollisionShapes.keys().next().value!);
      }
      const shape = collisionShape(staging);
      const next: SceneRecord = { group: staging, object: current, signature, loadedSignature: signature, token, color: object.color, transformSignature: "", fallSpeed: 0, resting: false, placementBounds: shape.bounds };
      if (dragging && (record.group === transform.object || objectDrag?.id === object.id)) {
        staging.position.copy(record.group.position);
        staging.rotation.copy(record.group.rotation);
        staging.scale.copy(record.group.scale);
        staging.visible = current.visible;
        next.transformSignature = record.transformSignature;
      } else applyObject(next, current, true);
      weather = createObjectWeather(content, current.asset);
      weather.update(document.weather);
      weather.animate(animationTime);
      if (!isCurrent()) return;

      // ACT: 外层容器不换；旧几何在新几何、摆放与天气均准备成功后才释放，失败仍保留原画面。
      if (objectLift?.id === object.id) clearObjectMotion();
      staticBatches.remove(record.group);
      windRecords.delete(record);
      const previousWeather = record.weather;
      const previous = new Group();
      if (record.group.children.length) previous.add(...record.group.children);
      record.group.add(content);
      record.group.position.copy(staging.position);
      record.group.rotation.copy(staging.rotation);
      record.group.scale.copy(staging.scale);
      record.group.visible = staging.visible;
      record.loadedSignature = signature;
      record.color = next.color;
      record.transformSignature = next.transformSignature;
      record.fallSpeed = 0;
      record.resting = false;
      record.placementBounds = shape.bounds;
      record.collider = undefined;
      record.colliderMatrix = undefined;
      collisionShapes.set(record.group, shape);
      floorCache.delete(record.group);
      record.weather = weather;
      weather = undefined;
      record.weather.syncBounds();
      recordCollision(object.id, record);
      previousWeather?.dispose();
      disposeObject(previous);
      gravityWake = true;
      gravitySleeping = false;
      if (record.collider && current.visible) {
        const vegetation = isVegetationAsset(current.asset);
        for (const [id] of collisionCandidates(record.collider, undefined, current.id)) {
          const other = records.get(id);
          if (other && !(vegetation && isVegetationAsset(other.object.asset))) other.resting = false;
        }
      }
      if (record.weather.windAnimated) windRecords.add(record);
      // 只合批确定来自同一造型定义的静态模型，导入或带外部资源的 GLB 使用原材质和层级。
      const asset = current.asset;
      if ((!record.weather.windAnimated || record.weather.batchWind) && !asset.path && !asset.url && (asset.model || asset.recipe || asset.blueprint)) {
        staticBatches.register(record.group, JSON.stringify([record.signature, asset.model, current.color]), record.weather.batchWind);
      }
      // 楼、道具（含导入 GLB）各自按材质合成绘制代理；人物等内置形体和随风摆动的植被保持原样。
      if (!record.weather.windAnimated && !asset.shape) staticBatches.registerSolo(record.group);
      renderer.shadowMap.needsUpdate = true;
      if (selectedId === object.id) { updateSelection(); if (!dragging) attachTransform(); }
      modelErrors.delete(object.id);
      reportModelErrors();
      invalidate();
    } catch (error) {
      if (isCurrent()) {
        modelErrors.set(object.id, `“${record.object.name}”载入失败：${error instanceof Error ? error.message : "无法读取模型"}`);
        reportModelErrors();
      }
    } finally {
      weather?.dispose();
      if (staging) disposeObject(staging);
    }
  }

  function queueObjectLoad(record: SceneRecord, object: SceneObject) {
    const loading = new Promise<void>(resolve => objectLoadQueue.push({ record, object, signature: record.signature, token: record.token, resolve }));
    if (!loadingObjects) void loadQueuedObjects();
    return loading;
  }

  async function loadQueuedObjects() {
    loadingObjects = true;
    try {
      while (!disposed && objectLoadQueue.length) {
        await new Promise<void>(resolve => {
          let frame: number | undefined;
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            if (frame !== undefined) ownerWindow?.cancelAnimationFrame(frame);
            clearTimeout(timer);
            cancelObjectLoadFrame = undefined;
            resolve();
          };
          const timer = setTimeout(finish, 32);
          cancelObjectLoadFrame = finish;
          if (ownerWindow && !ownerDocument.hidden) frame = ownerWindow.requestAnimationFrame(finish);
        });
        const start = performance.now();
        // 每帧按耗时让出主线程，轻量模型可以在同一帧载入多件。
        while (!disposed && objectLoadQueue.length && performance.now() - start < 6) {
          const job = objectLoadQueue.shift()!;
          activeObjectLoad = job;
          try {
            if (records.get(job.object.id) === job.record && job.record.token === job.token) await loadObject(job);
          } finally { job.resolve(); if (activeObjectLoad === job) activeObjectLoad = undefined; }
        }
        await Promise.resolve();
        if (!disposed && !objectLoadQueue.length) { syncWeather(); syncWorldLife(); }
      }
    } finally {
      loadingObjects = false;
      if (disposed) for (const job of objectLoadQueue.splice(0)) job.resolve();
    }
  }

  function endAssetPlacement() {
    const state = assetPlacement;
    assetPlacement = undefined;
    if (!state) return;
    syncCameraControls();
    scene.remove(state.group);
    disposeObject(state.group);
    invalidate();
  }

  function beginAssetPlacement(asset: SceneAsset): Promise<void> {
    if (disposed) return Promise.reject(new Error("场景已关闭"));
    if (assetPlacement?.asset === asset) return assetPlacement.loading;
    endAssetPlacement();
    sceneBrush?.cancel();
    cancelViewTransition();
    stopNavigation();
    cancelFirstPersonLook();
    cancelObjectDrag();
    cancelTerrainStroke();
    applyView(readView());
    const state: AssetPlacementState = { asset, group: new Group(), loading: Promise.resolve(), value: null, materials: [] };
    state.group.visible = false;
    assetPlacement = state;
    syncCameraControls();
    scene.add(state.group);
    state.loading = (async () => {
      const content = await loadAssetContent(asset, "#bac5d3", () => !disposed && assetPlacement === state, true);
      if (!content) return;
      if (disposed || assetPlacement !== state) { disposeObject(content); return; }
      const materials = new Set<Material>();
      content.traverse(child => {
        if (!(child instanceof Mesh)) return;
        child.castShadow = false;
        child.receiveShadow = false;
        for (const material of Array.isArray(child.material) ? child.material : [child.material]) materials.add(material);
      });
      for (const material of materials) {
        material.transparent = true;
        material.opacity = 0.48;
        material.depthWrite = false;
        if (material instanceof MeshStandardMaterial || material instanceof MeshBasicMaterial) state.materials.push({ material, color: material.color.clone() });
      }
      state.group.add(content);
      state.bounds = localPlacementBounds(state.group);
      invalidate();
    })().catch(error => {
      if (assetPlacement === state) { endAssetPlacement(); throw error; }
    });
    return state.loading;
  }

  function getAssetPlacement(): AssetPlacement | null {
    const value = assetPlacement?.value;
    return value ? { ...value, position: { ...value.position }, rotation: { ...value.rotation }, scale: { ...value.scale } } : null;
  }

  function nearestPlacementHit(groundHit?: Intersection) {
    const ray = raycaster.ray;
    const probe = new Vector3();
    const candidates: { group: Group; distance: number }[] = [];
    const consider = (record: SceneRecord, bounds: Box3) => {
      if (!record.group.visible || !ray.intersectBox(bounds, probe)) return;
      const distance = bounds.containsPoint(ray.origin) ? 0 : ray.origin.distanceTo(probe);
      if (!groundHit || distance <= groundHit.distance) candidates.push({ group: record.group, distance });
    };
    if (groundHit) {
      const segment = new Box3().setFromPoints([ray.origin, groundHit.point]).expandByScalar(0.001);
      for (const [id, body] of collisionIndex.query(segment)) consider(records.get(id)!, body.bounds);
    } else {
      for (const record of records.values()) if (record.collider && !worldLife.getActiveObjectIds().has(record.object.id)) consider(record, record.collider.bounds);
    }
    // 演绎角色不占用静态碰撞格，按当前动画变换单独拾取。
    const bounds = new Box3();
    for (const id of worldLife.getActiveObjectIds()) {
      const record = records.get(id);
      if (!record?.placementBounds) continue;
      record.group.updateWorldMatrix(true, false);
      consider(record, bounds.copy(record.placementBounds).applyMatrix4(record.group.matrixWorld));
    }
    let hit = groundHit;
    candidates.sort((a, b) => a.distance - b.distance);
    for (const { group, distance } of candidates) {
      if (hit && distance > hit.distance) break;
      group.updateWorldMatrix(true, true);
      const modelHit = raycaster.intersectObject(group, true)[0];
      if (modelHit && (!hit || modelHit.distance < hit.distance)) hit = modelHit;
    }
    return hit;
  }

  function updateAssetPlacement(clientX: number, clientY: number, dropping = false): AssetPlacement | null {
    const state = assetPlacement;
    if (!state) return null;
    const hide = () => { if (state.group.visible) invalidate(); state.group.visible = false; state.value = null; return null; };
    if (disposed || !state.bounds || !Number.isFinite(clientX) || !Number.isFinite(clientY) || !getRay(clientX, clientY) || Math.abs(pointer.x) > 1 || Math.abs(pointer.y) > 1) return hide();
    const ground = [floor, terrainSurface?.group.getObjectByName("terrainGround")].filter((item): item is Object3D => !!item?.visible);
    for (const surface of ground) surface.updateWorldMatrix(true, false);
    const groundHit = raycaster.intersectObjects(ground, false)[0];
    let hit = nearestPlacementHit(groundHit);
    if (!hit) return hide();
    let normal = worldHitNormal(hit);
    if (normal.y < 0.35) { hit = groundHit; if (!hit) return hide(); normal = worldHitNormal(hit); }
    if (normal.y < 0.35) normal.copy(worldUp);
    const onGround = ground.includes(hit.object);
    const alignment = new Quaternion().setFromUnitVectors(worldUp, normal);
    const base = state.bounds.getCenter(new Vector3());
    base.y = state.bounds.min.y;
    let first: AssetPlacement | undefined;
    let chosen: AssetPlacement | undefined;
    for (const yaw of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      state.group.quaternion.copy(alignment).multiply(new Quaternion().setFromAxisAngle(worldUp, yaw));
      state.group.position.copy(hit.point).sub(base.clone().applyQuaternion(state.group.quaternion));
      const body = groupCollision(state.group);
      const offset = onGround ? new Vector3(0, Math.max(0, -terrainClearance(body)) + 0.003, 0) : normal.clone().multiplyScalar(0.003);
      offset.y += 0.5;
      state.group.position.add(offset);
      translateCollisionBody(body, offset);
      const policy: HeightPlacement = { height: body.bounds.min.y, gravityEnabled: true };
      const inRange = [...state.group.position.toArray(), policy.height].every(value => Number.isFinite(value) && Math.abs(value) <= 10000);
      const valid = inRange && ![...collisionCandidates(body).values()].some(obstacle => intersectsCollision(body, obstacle));
      const value: AssetPlacement = { ...getObjectTransform(state.group, policy), ...policy, valid, ...(!valid ? { reason: inRange ? "当前位置与已有物体重叠" : "当前位置超出场景范围" } : {}) };
      first ??= value;
      if (valid) { chosen = value; break; }
    }
    state.value = chosen ?? first!;
    state.group.position.copy(toVector(state.value.position));
    state.group.rotation.set(MathUtils.degToRad(state.value.rotation.x), MathUtils.degToRad(state.value.rotation.y), MathUtils.degToRad(state.value.rotation.z));
    // 提示色和预览位置只需碰撞体，倾斜模型的精确顶点底高在落笔时取一次。
    if (dropping) state.value.height = floorHeight(state.group);
    const tint = new Color(state.value.valid ? "#56c9b3" : "#ff4545");
    for (const { material, color } of state.materials) material.color.copy(color).lerp(tint, state.value.valid ? 0.2 : 0.75);
    state.group.visible = true;
    invalidate();
    return getAssetPlacement();
  }

  function syncView(value: EditorView) {
    const next = JSON.stringify(value);
    if (next !== viewSignature && !dragging && next !== JSON.stringify(readView())) { cancelViewTransition(); applyView(value); }
    viewSignature = next;
  }
  function syncDisplay() {
    // ACT: 成片画幅跟着文档走；变了就重画（机位视锥按画幅缓存，全屏预演画框、监看和取景窗按新比例出图）。
    const aspect = filmAspect;
    if (options.globalFilmFormat !== false) setFilmFormat(document.film?.format);
    if (aspect !== filmAspect) { viewfinderDrawn.set(0, 0); monitorDrawn.set(0, 0); invalidate(); }
    grid.visible = document.gridVisible;
    axes.visible = document.display?.axesVisible === true;
    const shadowsEnabled = document.display?.shadowsEnabled !== false;
    if (renderer.shadowMap.enabled !== shadowsEnabled) {
      renderer.shadowMap.enabled = shadowsEnabled;
      renderer.shadowMap.needsUpdate = true;
    }
  }
  function sync(value: SceneDocument, reuseContent = false) {
    const contentUnchanged = reuseContent && sharesSceneContent(value, document);
    const nextAtmosphereSignature = JSON.stringify(value.atmosphere);
    const atmosphereChanged = nextAtmosphereSignature !== atmosphereSignature;
    atmosphereSignature = nextAtmosphereSignature;
    const nextTime = getSceneTime(value);
    const nextTimeSource = JSON.stringify(nextTime);
    const timeChanged = nextTimeSource !== worldTimeSource;
    if (timeChanged) {
      const currentTime = getWorldTime();
      worldLifeClockJump ||= Math.abs(worldTimeSeconds(nextTime) - worldTimeSeconds(currentTime)) > Math.max(0.5, Math.max(currentTime.speed, nextTime.speed) * 0.5);
      worldTimeOrigin = nextTime;
      worldClockOrigin = performance.now();
      worldTimeSource = nextTimeSource;
      publishedWorldSecond = "";
    }
    const nextCameraSignature = JSON.stringify(value.cameras ?? []);
    const camerasChanged = cameraSignature !== nextCameraSignature;
    const editedBefore = !!cameraEditingId && !!document.cameras?.some(item => item.id === cameraEditingId);
    // ACT: 机位改动来自宿主刚提交的新文档，此前指定的画面和运镜预览都已过期，统一清掉，由宿主按新文档重新指定。
    if (camerasChanged) { cancelCameraDrag(); cameraOverrides.clear(); }
    document = value;
    sceneCameras.sync(value.cameras ?? []);
    cameraSignature = nextCameraSignature;
    if (editedBefore && !value.cameras?.some(item => item.id === cameraEditingId)) { setCameraEditing(null); options.onCameraSelect?.(null); }
    if (!value.cameras?.length) { cameraOrigin = undefined; if (filmPreview) setFilmPreview(false); }
    if (camerasChanged) { publishLifeStatus(); invalidate(); }
    syncDisplay();
    if (contentUnchanged) {
      if (timeChanged || atmosphereChanged) updateWorldClock(true);
      syncView(value.view);
      invalidate();
      return;
    }
    renderer.shadowMap.needsUpdate = true;
    syncTerrain();
    if (selectedTerrainTree !== null && (selectedTerrainSeed !== document.terrain?.seed || !terrainSurface?.getTree(selectedTerrainTree))) selectTerrainTree(null);
    const ids = new Set(document.objects.map(object => object.id));
    if (sceneAnchor?.kind === "object" && !ids.has(sceneAnchor.objectId)) setSceneAnchor(null);
    if (objectDrag && !ids.has(objectDrag.id)) cancelObjectDrag();
    for (const [id, record] of records) {
      if (ids.has(id)) continue;
      if (transform.object === record.group) transform.detach();
      objectRoot.remove(record.group);
      staticBatches.remove(record.group);
      record.weather?.dispose();
      disposeObject(record.group);
      windRecords.delete(record);
      records.delete(id);
      collisionIndex.remove(id);
      gravityWake = true;
      if (modelErrors.delete(id)) reportModelErrors();
    }
    for (const object of document.objects) {
      if (records.get(object.id)?.object === object) continue;
      const signature = JSON.stringify([object.asset.id, object.asset.kind, object.asset.shape, object.asset.path, object.asset.url, object.asset.sha256, object.asset.kiln?.glbSha256, object.asset.contentTransform, object.asset.path ? undefined : [object.asset.model, object.asset.recipe, object.asset.blueprint], usesNativeScale(object.asset)]);
      let record = records.get(object.id);
      let load = false;
      if (record && record.signature !== signature) {
        record.signature = signature;
        record.token = {};
        load = true;
        if (modelErrors.delete(object.id)) reportModelErrors();
      }
      if (!record) {
        record = { group: new Group(), object, signature, token: {}, color: object.color, transformSignature: "", fallSpeed: 0, resting: false };
        record.group.userData.sceneObjectId = object.id;
        records.set(object.id, record);
        objectRoot.add(record.group);
        load = true;
      }
      record.object = object;
      if (load) {
        const loading = queueObjectLoad(record, object);
        pendingLoads.add(loading);
        void loading.then(() => pendingLoads.delete(loading), () => pendingLoads.delete(loading));
      }
      applyObject(record, object);
    }
    syncWeather();
    syncWorldLife();
    syncView(document.view);
    updateSelection();
    if (!dragging) attachTransform();
    invalidate();
  }

  function select(id: string) { selectObjects(id ? [id] : []); }

  // 铺装当地面用：没选中的铺装点一下出场景点、按住拖是框选，不会一点就选中、一拖就挪走整片路面；
  // 在世界列表或框选里选中以后，才能按住拖它。
  function isGroundPaving(id: unknown) {
    return typeof id === "string" && !!id && !selectedIds.includes(id) && !!document.objects.find(object => object.id === id)?.asset.id.startsWith("brushPaving");
  }

  function selectObjects(ids: string[]) {
    const valid = new Set(document.objects.map(object => object.id));
    const next = [...new Set(ids)].filter(id => valid.has(id));
    if (next.length) selectTerrainTree(null);
    if (next.length === selectedIds.length && next.every((id, index) => id === selectedIds[index])) return;
    selectedIds = next;
    selectedId = next[next.length - 1] ?? "";
    const id = selectedId;
    updateSelection();
    attachTransform();
    updateCursor();
    if (id) {
      const record = records.get(id);
      const object = document.objects.find(object => object.id === id);
      if (object) {
        const point = new Vector3();
        if (record?.group.children.length) { record.group.updateWorldMatrix(true, true); new Box3().setFromObject(record.group).getCenter(point); }
        else point.copy(toVector(object.position));
        setSceneAnchor({ kind: "object", objectId: id, position: toValue(point) });
      }
    }
  }

  function selectTerrainTree(index: number | null) {
    const tree = index === null ? undefined : terrainSurface?.getTree(index);
    const next = tree?.index ?? null;
    const seed = tree ? currentTerrain()?.seed : undefined;
    if (selectedTerrainTree === next && selectedTerrainSeed === seed) return;
    selectedTerrainTree = next;
    selectedTerrainSeed = seed;
    if (next !== null) {
      selectedId = "";
      selectedIds = [];
    }
    updateSelection();
    attachTransform();
    options.onTerrainTreeSelect?.(next);
    invalidate();
  }

  function setTool(value: EditorTool) {
    if (tool !== value) { clearObjectMotion(); }
    tool = value;
    updateCursor();
    attachTransform();
  }

  function setObjectDragEnabled(enabled: boolean) {
    if (objectDragEnabled === enabled) return;
    objectDragEnabled = enabled;
    if (!enabled) cancelObjectDrag();
    attachTransform();
    updateCursor();
  }

  function setObjectDragMode(mode: "plane" | "height") {
    if (objectDragMode === mode) return;
    cancelObjectDrag();
    objectDragMode = mode;
    updateCursor();
  }

  function setTerrainBrush(brush: TerrainBrush | null, radius: number, strength: number, settings?: { hardness?: number; targetHeight?: number; flow?: number; color?: string }) {
    const terrain = currentTerrain();
    const minRadius = Math.max(1, Math.ceil((terrain?.size ?? 80) / (terrain?.segments ?? 64) * (brush === "lake" ? 3 : 1) * 2) / 2);
    const nextRadius = Number.isFinite(radius) ? MathUtils.clamp(radius, minRadius, 16) : 4;
    const nextStrength = Number.isFinite(strength) ? MathUtils.clamp(strength, 0.1, 2) : 1;
    const flow = settings?.flow ?? 1, hardness = settings?.hardness ?? 0.35, targetHeight = settings?.targetHeight ?? 0;
    const nextFlow = Number.isFinite(flow) ? MathUtils.clamp(flow, 0, 1) : 1;
    const nextHardness = Number.isFinite(hardness) ? MathUtils.clamp(hardness, 0, 1) : 0.35;
    const nextHeight = Number.isFinite(targetHeight) ? MathUtils.clamp(targetHeight, -12, 40) : 0;
    const nextColor = typeof settings?.color === "string" && /^#[0-9a-f]{6}$/i.test(settings.color) ? settings.color.toLowerCase() : undefined;
    if (brush !== terrainBrush || nextRadius !== brushRadius || nextStrength !== brushStrength || nextFlow !== brushFlow
      || nextHardness !== brushHardness || nextHeight !== brushTargetHeight || nextColor !== brushColor) cancelTerrainStroke();
    if (brush) sceneBrush?.set(null);
    terrainBrush = brush; brushRadius = nextRadius; brushStrength = nextStrength;
    brushFlow = nextFlow; brushHardness = nextHardness; brushTargetHeight = nextHeight; brushColor = nextColor;
    updateBrushIndicator(brush ? brushPosition : null);
    updateCursor();
    invalidate();
  }

  function setSceneBrush(settings: SceneBrushSettings | null) {
    if (settings) setTerrainBrush(null, brushRadius, brushStrength);
    sceneBrush?.set(settings);
    updateCursor();
  }
  function cancelSceneBrush() { return sceneBrush?.cancel() ?? false; }

  function terrainPoint(clientX: number, clientY: number) {
    const ray = getRay(clientX, clientY);
    if (!ray) return null;
    const ground = terrainSurface?.group.getObjectByName("terrainGround");
    const hit = ground ? raycaster.intersectObject(ground, false)[0]?.point : undefined;
    const point = hit ?? ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), new Vector3());
    const size = currentTerrain()?.size ?? 80;
    return point && Math.abs(point.x) <= size / 2 && Math.abs(point.z) <= size / 2 ? toValue(point) : null;
  }

  function updateBrushIndicator(position: Vector3Value | null) {
    brushPosition = position;
    brushIndicator.visible = !!terrainBrush && !!position;
    if (!position || !brushIndicator.visible) { invalidate(); return; }
    const center = position;
    function circle(radius: number) { return Array.from({ length: 65 }, (_, index) => {
      const angle = index / 64 * Math.PI * 2;
      const x = center.x + Math.cos(angle) * radius;
      const z = center.z + Math.sin(angle) * radius;
      return new Vector3(x, getTerrainHeight(currentTerrain(), x, z) + 0.08, z);
    }); }
    brushIndicator.geometry.setFromPoints(circle(brushRadius));
    brushCore.visible = brushHardness > 0 && brushHardness < 1;
    if (brushCore.visible) brushCore.geometry.setFromPoints(circle(brushRadius * brushHardness));
    invalidate();
  }

  function handleTerrainPointer(event: PointerEvent) {
    if (isShotView() || cameraDrag || firstPersonLook) return;
    if (!terrainBrush || !event.isPrimary || terrainStroke && terrainStroke.pointerId !== event.pointerId) return;
    if (terrainStroke?.pointerId === event.pointerId && terrainStroke.screen.x === event.clientX && terrainStroke.screen.y === event.clientY) {
      event.preventDefault();
      event.stopImmediatePropagation();
      updateBrushIndicator(terrainStroke.position);
      return;
    }
    const point = terrainPoint(event.clientX, event.clientY);
    if (terrainStroke?.pointerId === event.pointerId) {
      terrainStroke.position = point;
      const vertical = terrainStroke.screen.y - event.clientY;
      if (Math.abs(vertical) > 0.5) terrainStroke.direction = Math.sign(vertical);
      terrainStroke.screen.set(event.clientX, event.clientY);
      // ACT: 最多保留 64 个指针转折点；折半时保留离场断点，不能把重入连成穿过地图的一笔。
      if (terrainStroke.points.length >= 64) {
        const points: (Vector3Value | null)[] = [];
        for (let index = 0; index < terrainStroke.points.length; index += 2) {
          const first = terrainStroke.points[index]!;
          const second = terrainStroke.points[index + 1];
          points.push(first === null || second === null ? null : second ?? first);
        }
        terrainStroke.points = points;
      }
      terrainStroke.points.push(point);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
    updateBrushIndicator(point);
  }

  function handleTerrainLeave() { if (!terrainStroke) updateBrushIndicator(null); }

  function updateTerrainStroke(time: number, force = false) {
    const stroke = terrainStroke;
    if (!stroke || !terrainBrush || !force && time - stroke.time < 1000 / 30) return;
    const seconds = Math.min(0.1, Math.max(0, (time - stroke.time) / 1000));
    stroke.time = time;
    try {
      const points = stroke.points.splice(0);
      if (!points.length) points.push(stroke.position);
      if (!points.some(point => point !== null)) { stroke.last = null; return; }
      if (seconds <= 0) { stroke.points.unshift(...points); return; }
      if (brushFlow <= 0 || terrainBrush === "ramp" && !stroke.position) { stroke.last = null; return; }
      stroke.elapsed += seconds;
      let changed = false;
      const shapeStroke = { origin: stroke.origin, end: stroke.position ?? stroke.last ?? stroke.origin, startHeight: stroke.origin.y, reference: stroke.water.reference, direction: stroke.direction, elapsed: stroke.elapsed };
      if (terrainBrush === "ramp") {
        changed = paintTerrain(stroke.draft, shapeStroke.end, terrainBrush, brushRadius, brushStrength, seconds, { color: stroke.color, hardness: brushHardness, targetHeight: brushTargetHeight, flow: brushFlow, stroke: shapeStroke });
        if (stroke.position) stroke.last = { ...stroke.position };
      }
      else for (const point of points) {
        if (!point) { stroke.last = null; continue; }
        const previous = stroke.last ?? point;
        const distance = Math.hypot(point.x - previous.x, point.z - previous.z);
        const steps = Math.max(1, Math.min(512, Math.ceil(distance / (brushRadius * 0.25))));
        // ACT: 沿位移补点，但只分摊实际活动时间；快拖和高频鼠标事件不额外增加流量。
        const amount = seconds / points.length / steps;
        for (let index = 1; index <= steps; index++) {
          const progress = index / steps;
          const position = { x: previous.x + (point.x - previous.x) * progress, z: previous.z + (point.z - previous.z) * progress };
          changed = paintTerrain(stroke.draft, position, terrainBrush, brushRadius, brushStrength, amount, { color: stroke.color, hardness: brushHardness, targetHeight: brushTargetHeight, flow: brushFlow, water: stroke.water, stroke: shapeStroke }) || changed;
        }
        stroke.last = point;
      }
      if (!changed) return;
      if (!stroke.materialOnly) reconcileTerrainWater(stroke.draft);
      stroke.changed = true;
      renderTerrain(stroke.draft, stroke.materialOnly);
      if (!stroke.materialOnly) for (const object of document.objects) { const record = records.get(object.id); if (record) applyObject(record, object); }
      updateBrushIndicator(stroke.position);
    } catch (error) { cancelTerrainStroke(); options.onError(error instanceof Error ? error.message : "地形笔刷无法应用"); }
  }

  function releaseTerrainStroke() {
    const stroke = terrainStroke;
    if (!stroke) return;
    terrainStroke = undefined;
    if (stroke && canvas.hasPointerCapture(stroke.pointerId)) canvas.releasePointerCapture(stroke.pointerId);
    syncCameraControls();
    pointerStart = undefined;
    return stroke;
  }

  function cancelTerrainStroke() {
    const stroke = releaseTerrainStroke();
    if (!stroke) return false;
    pendingTerrain = undefined;
    renderTerrain(document.terrain, stroke.materialOnly);
    if (!stroke.materialOnly) for (const object of document.objects) { const record = records.get(object.id); if (record) applyObject(record, object); }
    updateBrushIndicator(null);
    return true;
  }

  function finishTerrainStroke(event?: PointerEvent) {
    if (event) handleTerrainPointer(event);
    updateTerrainStroke(performance.now(), true);
    const stroke = releaseTerrainStroke();
    if (!stroke?.changed) return true;
    try {
      flushTerrainPaint(stroke.draft);
      parseSceneDocument({ ...document, terrain: stroke.draft });
      pendingTerrain = stroke.draft;
      terrainSignature = JSON.stringify(stroke.draft);
      options.onTerrainChange?.(stroke.draft);
      return true;
    } catch (error) {
      pendingTerrain = undefined;
      renderTerrain(document.terrain, stroke.materialOnly);
      if (!stroke.materialOnly) for (const object of document.objects) { const record = records.get(object.id); if (record) applyObject(record, object); }
      options.onError(error instanceof Error ? error.message : "地形绘制失败");
      return false;
    }
  }

  function setHelpersVisible(visible: boolean) {
    helpersVisible = visible;
    if (!visible) { cancelBoxSelection(); cancelObjectDrag(); }
    helpers.visible = visible;
    transform.enabled = visible;
    transformHelper.visible = visible;
    updateSelection();
    attachTransform();
    invalidate();
  }

  function getRay(clientX: number, clientY: number) {
    const { left, top, width, height } = canvas.getBoundingClientRect();
    if (width <= 0 || height <= 0) return null;
    pointer.set(((clientX - left) / width) * 2 - 1, -((clientY - top) / height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.ray;
  }

  function pointOnPlane(clientX: number, clientY: number, height: number) {
    const value = getRay(clientX, clientY)?.intersectPlane(new Plane(new Vector3(0, 1, 0), -height), new Vector3());
    return value ? toValue(value) : null;
  }

  /** 动线能落脚的物体：演绎中的人物和选中的物体本身不算。 */
  function walkSurfaces() {
    const actorIds = new Set([
      ...selectedIds.flatMap(id => getPerformanceObjectIds(id, document.objectGroups)),
      ...worldLife.getActiveObjectIds(),
      ...(document.life?.tracks ?? []).flatMap(track => track.objectId ? getPerformanceObjectIds(track.objectId, document.objectGroups) : []),
    ]);
    return document.objects.flatMap(object => {
      const record = records.get(object.id);
      return object.visible && !actorIds.has(object.id) && record?.group.visible && record.loadedSignature === record.signature ? [record.group] : [];
    });
  }
  // ACT: 普通人不站屋顶、屋檐：往屋里画时落到屋顶正下方的室内楼板；平屋顶、露台、晒台照常能站；飞檐走壁的人（parkour）照常落在屋顶上。只看命中部件自己的名字，不看整栋楼的名字。
  const roofPartName = /屋顶|瓦顶|草顶|屋面|屋盖|屋脊|瓦垄|檐|roof|eave/i;
  const terracePartName = /平屋顶|平顶|露台|天台|晒台|平台|terrace|deck/i;
  // 家具台面（桌、床、柜、凳）不当落脚面：落到家具上就是走到它旁边的地板。
  const furniturePartName = /家具|桌|椅|凳|床|榻|柜|炕|沙发|table|chair|bed|desk|sofa|stool|cabinet/i;
  function hitPartName(hit: Intersection) {
    const names: unknown = hit.object.userData.toonflowPartNames;
    return hit.object instanceof InstancedMesh && hit.instanceId !== undefined && Array.isArray(names) && typeof names[hit.instanceId] === "string" ? names[hit.instanceId] as string : hit.object.name;
  }
  function isRoofHit(hit: Intersection) { const name = hitPartName(hit); return roofPartName.test(name) && !terracePartName.test(name); }
  // 屋里的梁、枋、椽、斗拱顶面不当普通人的落脚面（桥梁除外）。
  const overheadPartName = /梁|枋|椽|檩|桁|斗拱|斗栱|雀替|beam|rafter|purlin|truss/i;
  function isOverheadHit(hit: Intersection) { const name = hitPartName(hit); return overheadPartName.test(name) && !/桥|bridge/i.test(name); }
  function isFurnitureHit(hit: Intersection) {
    if (furniturePartName.test(hitPartName(hit))) return true;
    let node: Object3D | null = hit.object;
    while (node && typeof node.userData.sceneObjectId !== "string") node = node.parent;
    const id = node?.userData.sceneObjectId;
    return typeof id === "string" && document.objects.find(object => object.id === id)?.asset.itemType === "家具";
  }
  function isVisibleHit(hit: Intersection) {
    if (!(hit.object instanceof Mesh) || !hit.face) return false;
    for (let object: Object3D | null = hit.object; object && object !== scene; object = object.parent) if (!object.visible) return false;
    const material = Array.isArray(hit.object.material) ? hit.object.material[hit.face.materialIndex] : hit.object.material;
    return !!material?.visible && material.opacity > 0;
  }
  /** 朝上、看得见、坡度能走的面。 */
  function isOpenSurfaceHit(hit: Intersection) { return isVisibleHit(hit) && worldHitNormal(hit).y >= Math.cos(42 * Math.PI / 180); }
  /** 普通人能站的面（楼板、踏步、平台、地台），屋顶、家具、梁枋除外。 */
  function isStandableHit(hit: Intersection) { return isOpenSurfaceHit(hit) && !isRoofHit(hit) && !isFurnitureHit(hit) && !isOverheadHit(hit); }
  function performancePointAt(clientX: number, clientY: number, open = false) {
    if (!getRay(clientX, clientY)) return null;
    // 普通人：鼠标在屋顶上就落到屋顶正下方的楼板（不顺着视线穿墙落到房后），在家具上就落到旁边的地板。
    const hit = raycaster.intersectObjects(walkSurfaces(), true).find(item => open ? isOpenSurfaceHit(item) : isRoofHit(item) ? isVisibleHit(item) : isOpenSurfaceHit(item) && !isOverheadHit(item));
    const ground = terrainPoint(clientX, clientY);
    if (!hit || ground && camera.position.distanceToSquared(hit.point) >= camera.position.distanceToSquared(toVector(ground))) return ground;
    return !open && (isRoofHit(hit) || isFurnitureHit(hit)) ? { x: hit.point.x, y: walkSurfaceBelow(hit.point.x, hit.point.z, hit.point.y - 0.05), z: hit.point.z } : toValue(hit.point);
  }
  // ACT: 视线检测：从from（一般是被拍的人脸）看向to（机位），返回第一个挡住视线的可见物体的距离；ignore里的物体（被拍的人自己）不算。
  const sightRay = new Raycaster();
  /**
   * ACT: 导演工具（stageAct/stageShots）用的真实几何探针：基于视口里已经载入的模型（含导入的GLB、Kiln模型），
   * 人物不算。surface：某点往下打射线的顶面、地面高度；sight：注视点到机位之间有没有东西挡；bounds：物体的世界包围盒。
   * 包围盒在创建时算一次（一个工具调用里场景不动），射线只打包围盒罩得住的物体。
   */
  function createStageProbe() {
    const entries = [...records.values()].filter(record => record.object.visible && record.group.visible && !/person/i.test(record.object.asset.shape ?? "")).map(record => ({ id: record.object.id, group: record.group, box: new Box3().setFromObject(record.group) })).filter(entry => !entry.box.isEmpty());
    const ray = new Raycaster(), origin = new Vector3(), direction = new Vector3();
    const hitsOf = (groups: Object3D[]) => ray.intersectObjects(groups, true).filter(isVisibleHit);
    return {
      surface(x: number, z: number, fromY: number) {
        const groups = entries.filter(entry => x >= entry.box.min.x && x <= entry.box.max.x && z >= entry.box.min.z && z <= entry.box.max.z && entry.box.min.y < fromY).map(entry => entry.group);
        if (!groups.length) return undefined;
        ray.set(origin.set(x, fromY, z), direction.set(0, -1, 0)); ray.near = 0; ray.far = fromY - Math.min(...entries.map(entry => entry.box.min.y)) + 1;
        const hits = hitsOf(groups);
        if (!hits.length) return undefined;
        return { top: hits[0]!.point.y, floor: hits[hits.length - 1]!.point.y, up: worldHitNormal(hits[0]).y > 0.8 };
      },
      inside(x: number, y: number, z: number) {
        return insideSolid(entries.filter(entry => x >= entry.box.min.x && x <= entry.box.max.x && z >= entry.box.min.z && z <= entry.box.max.z && entry.box.min.y < y && entry.box.max.y > y).map(entry => entry.group), x, y, z);
      },
      sight(aim: Vector3Value, camera: Vector3Value) {
        direction.set(camera.x - aim.x, camera.y - aim.y, camera.z - aim.z);
        const length = direction.length();
        if (length < 0.05) return false;
        const box = new Box3().setFromPoints([new Vector3(aim.x, aim.y, aim.z), new Vector3(camera.x, camera.y, camera.z)]).expandByScalar(0.1);
        const groups = entries.filter(entry => entry.box.intersectsBox(box)).map(entry => entry.group);
        if (!groups.length) return false;
        ray.set(origin.set(aim.x, aim.y, aim.z), direction.normalize()); ray.near = 0.35; ray.far = length;
        return hitsOf(groups).length > 0;
      },
      bounds(id: string) { const entry = entries.find(item => item.id === id); return entry ? { min: { x: entry.box.min.x, y: entry.box.min.y, z: entry.box.min.z }, max: { x: entry.box.max.x, y: entry.box.max.y, z: entry.box.max.z } } : undefined; },
      ready: () => !pendingLoads.size,
    };
  }
  function sightBlocked(from: Vector3Value, to: Vector3Value, ignore: readonly string[] = []) {
    const origin = toVector(from), direction = toVector(to).sub(origin);
    const far = direction.length();
    if (far < 0.01) return undefined;
    sightRay.set(origin, direction.normalize());
    sightRay.near = 0.05; sightRay.far = far;
    const skip = new Set(ignore);
    const groups = document.objects.flatMap(object => { const record = records.get(object.id); return object.visible && !skip.has(object.id) && record?.group.visible ? [record.group] : []; });
    const solid = sightRay.intersectObjects(groups, true).find(hit => isVisibleHit(hit) && !hit.object.userData.backdrop)?.distance;
    // 活动墙是单面的：机位（to）看过去打到它正面才挡；机位在墙背面时看不见它。所以反过来从to往from打一次，只认活动墙。
    if (!document.objects.some(object => object.asset.shape === "backdrop")) return solid;
    const back = toVector(to);
    sightRay.set(back, toVector(from).sub(back).normalize());
    sightRay.near = 0; sightRay.far = far - 0.05;
    const wall = sightRay.intersectObjects(groups, true).find(hit => hit.object.userData.backdrop && isVisibleHit(hit));
    const wallDistance = wall ? far - wall.distance : undefined;
    return solid === undefined ? wallDistance : wallDistance === undefined ? solid : Math.min(solid, wallDistance);
  }
  /** 从from往to第一块看得见的面的材质颜色（#rrggbb）；活动墙要接成和布景墙一个颜色。 */
  function surfaceColorAt(from: Vector3Value, to: Vector3Value, ignore: readonly string[] = []) {
    const origin = toVector(from), direction = toVector(to).sub(origin);
    const far = direction.length();
    if (far < 0.01) return undefined;
    sightRay.set(origin, direction.normalize());
    sightRay.near = 0.05; sightRay.far = far;
    const skip = new Set(ignore);
    const groups = document.objects.flatMap(object => { const record = records.get(object.id); return object.visible && !skip.has(object.id) && record?.group.visible ? [record.group] : []; });
    const hit = sightRay.intersectObjects(groups, true).find(item => isVisibleHit(item) && !item.object.userData.backdrop);
    if (!hit || !(hit.object instanceof Mesh) || !hit.face) return undefined;
    const material = Array.isArray(hit.object.material) ? hit.object.material[hit.face.materialIndex] : hit.object.material;
    const color = (material as { color?: Color } | undefined)?.color;
    return color ? `#${color.getHexString()}` : undefined;
  }
  const surfaceRay = new Raycaster();
  const downward = new Vector3(0, -1, 0);
  /** (x,z)处从top往下第一块能站的面（楼板、踏步、平台；open时屋顶、桌面也算），下面没有物体就是地形。 */
  function walkSurfaceBelow(x: number, z: number, top: number, open = false) {
    const ground = getTerrainHeight(currentTerrain(), x, z);
    if (!(top > ground)) return ground;
    surfaceRay.set(new Vector3(x, top, z), downward);
    surfaceRay.far = top - ground + 0.01;
    const hit = surfaceRay.intersectObjects(walkSurfaces(), true).find(open ? isOpenSurfaceHit : isStandableHit);
    return hit ? Math.max(ground, hit.point.y) : ground;
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "touch") {
      // 新的主触点说明此前的手指都已离开，清掉可能漏收抬起事件的残留触点。
      if (event.isPrimary) {
        touchPoints.clear();
        if (touchGesture) { touchGesture = undefined; cancelFirstPersonLook(true); }
      }
      touchPoints.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (touchGesture || touchPoints.size === 2 && beginTouchGesture()) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    }
    if (isShotView() || cameraDrag) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.button === 0 && event.isPrimary && cameraPathDrawing && camerasVisible && navigationEnabled) {
      const pose = getCameraPose(cameraPathDrawing);
      if (pose && beginCameraStroke(cameraPathDrawing, pose, event, false)) return;
    }
    // 轨迹锚点的圆点优先于机位标记：机位的视锥线常常横穿轨迹，不能让它挡住锚点。
    if (event.button === 0 && event.isPrimary && !pathEdit && navigationEnabled && options.canSelect?.() !== false && !terrainBrush && !sceneBrush?.isEnabled() && !performanceDrawing && beginPathEdit(event, true)) return;
    if (event.button === 0 && event.isPrimary && camerasVisible && navigationEnabled && options.canSelect?.() !== false && !terrainBrush && !sceneBrush?.isEnabled() && !performanceDrawing && document.cameras?.length && getRay(event.clientX, event.clientY)) {
      updateCameraGizmos();
      const picked = sceneCameras.pick(raycaster);
      if (picked) {
        const surfaces = [floor, terrainSurface?.group.getObjectByName("terrainGround")].filter((item): item is Object3D => !!item?.visible);
        const ground = raycaster.intersectObjects(surfaces, false)[0];
        const obstacle = nearestPlacementHit(ground);
        const tree = terrainSurface?.pickTree(raycaster);
        if ((!obstacle || picked.distance <= obstacle.distance + 0.03) && (!tree || picked.distance <= tree.distance + 0.03)) {
          event.preventDefault(); event.stopImmediatePropagation();
          const ray = raycaster.ray.clone();
          const facing = camera.getWorldDirection(new Vector3());
          // ACT: 宿主可能在选中回调里移动播放头或指定画面，拖动必须从回调之后这台机位的实际画面开始。
          options.onCameraSelect?.(picked.id);
          const pose = disposed || cameraDrag || !camerasVisible ? undefined : getCameraPose(picked.id);
          if (!pose) return;
          if (picked.ring) {
            // 按住脚下的圈：开始划机位轨迹，起点就是机位此刻的位置。
            beginCameraStroke(picked.id, pose, event, true);
            return;
          }
          // 默认在水平面上拖；按住Shift改为竖直面，调高低。
          const flat = facing.clone().setY(0);
          const vertical = event.shiftKey && flat.lengthSq() > 1e-6;
          const plane = new Plane().setFromNormalAndCoplanarPoint(vertical ? flat.normalize() : Math.abs(ray.direction.y) > 0.05 ? worldUp : facing, picked.point);
          const start = ray.intersectPlane(plane, new Vector3());
          if (!start) return;
          const previous = cameraOverrides.get(picked.id);
          cameraDrag = { id: picked.id, pointer: event.pointerId, plane, start, screen: new Vector2(event.clientX, event.clientY), position: toVector(pose.position), target: toVector(pose.target), focalLength: pose.focalLength, pose, previous, moved: false, delta: new Vector3() };
          stopNavigation(); cancelFirstPersonLook(); cancelViewTransition();
          canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
          syncCameraControls(); updateCursor(); pointerStart = undefined;
          return;
        }
      }
    }
    if (event.button === 0 && event.isPrimary && !pathEdit && navigationEnabled && options.canSelect?.() !== false && !terrainBrush && !sceneBrush?.isEnabled() && !performanceDrawing && beginPathEdit(event)) return;
    if (boxSelection) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (event.button === 0 && event.isPrimary && options.canSelect?.() !== false && !performanceOverlay.wantsPointer(event) && beginRouteStroke(event)) return;
    if (event.button === 0 && options.canSelect?.() !== false && performanceOverlay.pointerDown(event)) {
      performanceDragging = true;
      pointerStart = undefined;
      cancelViewTransition();
      stopNavigation();
      syncCameraControls();
      canvas.focus({ preventScroll: true });
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (terrainStroke || firstPersonLook) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    cancelViewTransition();
    if (event.button >= 0 && event.button <= 2) canvas.focus({ preventScroll: true });
    pointerStart = { x: event.clientX, y: event.clientY, button: event.button };
    wasDragging = dragging;
    if (event.button === 2) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!event.isPrimary || !canNavigateCamera()) return;
      cancelObjectDrag();
      canvas.setPointerCapture(event.pointerId);
      beginFirstPersonLook(event.pointerId, event.clientX, event.clientY);
      // ACT: 按住右键使用浏览器指针锁；未获支持时仍用文档鼠标移动完成拖拽环视。
      try {
        canvas.requestPointerLock?.()?.then(() => {
          if ((disposed || !firstPersonLook) && ownerDocument.pointerLockElement === canvas) ownerDocument.exitPointerLock();
        }).catch(() => {});
      } catch { /* 浏览器拒绝锁定时使用拖拽环视。 */ }
      return;
    }
    if (terrainBrush && event.button === 0) {
      if (!event.isPrimary || brushFlow <= 0) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const position = terrainPoint(event.clientX, event.clientY);
      if (!position) return;
      const previousTerrain = currentTerrain();
      const terrain = previousTerrain ?? preparedTerrain ?? createTerrain();
      const materialOnly = getTerrainSurfaceId(terrainBrush) !== undefined;
      const column = MathUtils.clamp(Math.round((position.x / terrain.size + 0.5) * terrain.segments), 0, terrain.segments);
      const row = MathUtils.clamp(Math.round((position.z / terrain.size + 0.5) * terrain.segments), 0, terrain.segments);
      const level = MathUtils.clamp(getTerrainWaterLevel(terrain, row * (terrain.segments + 1) + column) ?? position.y - 0.04, -11.8, 39.8);
      const draft = { ...terrain,
        ...(!materialOnly ? { heights: [...terrain.heights], surfaces: [...terrain.surfaces],
          ...(terrain.waterLevels ? { waterLevels: [...terrain.waterLevels] } : {}),
          ...(terrain.waterColors ? { waterColors: { ...terrain.waterColors } } : {}),
          ...(terrain.surfaceBlend ? { surfaceBlend: { surfaces: [...terrain.surfaceBlend.surfaces], weights: [...terrain.surfaceBlend.weights] } } : {}) } : {}),
        ...(terrain.surfacePaint ? { surfacePaint: { ...terrain.surfacePaint } } : {}) };
      terrainStroke = { pointerId: event.pointerId, materialOnly, color: brushColor, draft, origin: { ...position }, direction: 1, position,
        screen: new Vector2(event.clientX, event.clientY), points: [position], last: null, water: { level, reference: terrain }, changed: false, time: performance.now(), elapsed: 0 };
      stopNavigation();
      syncCameraControls();
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
      updateTerrainStroke(performance.now());
      return;
    }
    if (objectDragEnabled && tool === "translate" && event.button === 0 && !dragging && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      getRay(event.clientX, event.clientY);
      const picked = withObjectLift(() => {
        const hit = raycaster.intersectObjects([...records.values()].filter(record => record.loadedSignature === record.signature && record.group.visible).map(record => record.group), true)[0];
        let object: Object3D | null | undefined = hit?.object;
        while (object && !object.userData.sceneObjectId) object = object.parent ?? undefined;
        const id = object?.userData.sceneObjectId;
        const group = typeof id === "string" ? records.get(id)?.group : undefined;
        return hit && { hit, id, localPoint: group?.worldToLocal(hit.point.clone()) };
      });
      const hit = picked?.hit;
      const id = picked?.id;
      const group = typeof id === "string" ? records.get(id)?.group : undefined;
      const treeHit = terrainSurface?.pickTree(raycaster);
      if (group && !isGroundPaving(id) && (!treeHit || hit!.distance <= treeHit.distance)) {
        if (picked?.localPoint) hit!.point.copy(group.localToWorld(picked.localPoint));
        const normal = objectDragMode === "plane" && Math.abs(raycaster.ray.direction.y) > 0.05 ? worldUp : camera.getWorldDirection(new Vector3());
        const plane = new Plane().setFromNormalAndCoplanarPoint(normal, hit!.point);
        const start = raycaster.ray.intersectPlane(plane, new Vector3());
        if (start) {
          // 按住的是多选里的一件：整批一起拖，选择不变；按住别的物体才换成只选它。
          const together = selectedIds.length > 1 && selectedIds.includes(id);
          if (!together) {
            select(id);
            options.onSelect(id);
            setSceneAnchor({ kind: "object", objectId: id, position: toValue(hit!.point) });
          }
          const object = document.objects.find(object => object.id === id)!;
          const heightPolicy = { ...readObjectPlacement(group, object) };
          if (objectDragMode === "height") {
            group.updateWorldMatrix(true, true);
            updateFloorBounds(group);
            if (!floorBounds.isEmpty()) heightPolicy.height = floorBounds.min.y;
          }
          const depth = Math.max(camera.near, -camera.worldToLocal(hit!.point.clone()).z);
          const heightPerPixel = 2 * depth * Math.tan(MathUtils.degToRad(camera.fov) / 2) / Math.max(1, canvas.getBoundingClientRect().height);
          const record = records.get(id)!;
          record.placementBounds ??= localPlacementBounds(group);
          group.updateWorldMatrix(true, true);
          const collider = recordCollision(id, record);
          const overlaps = new Set([...collisionCandidates(collider, undefined, id)].filter(([, obstacle]) => intersectsCollision(collider, obstacle)).map(([key]) => key));
          objectDrag = { yaw: 0, baseYaw: group.rotation.y, last: new Vector2(event.clientX, event.clientY), wheel: 0, id, pointerId: event.pointerId, plane, start, origin: group.position.clone(), screen: new Vector2(event.clientX, event.clientY), moved: false, mode: event.shiftKey ? "height" : objectDragMode, heightPerPixel, startHeight: heightPolicy.height, heightPolicy, overlaps };
          if (together) {
            const members = selectedIds.flatMap(memberId => {
              const member = records.get(memberId);
              const source = document.objects.find(item => item.id === memberId);
              if (!source || !member?.group.children.length || member.loadedSignature !== member.signature) return [];
              const policy = { ...readObjectPlacement(member.group, source) };
              return [{ id: memberId, group: member.group, origin: member.group.position.clone(), baseYaw: member.group.rotation.y, policy, startHeight: policy.height }];
            });
            objectDrag.members = members;
            objectDrag.pivot = members.reduce((sum, member) => sum.add(member.origin), new Vector3()).divideScalar(Math.max(1, members.length));
            objectDrag.shift = new Vector3();
            objectDrag.rise = 0;
          }
          dragging = true;
          if (objectDrag.mode === "height") switchObjectDragMode(objectDrag, true);
          options.onObjectCarry?.(true);
          syncCameraControls();
          stopNavigation();
          transform.detach();
          canvas.setPointerCapture(event.pointerId);
          updateCursor();
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
      }
    }
    if (event.button === 0 && event.isPrimary && options.canSelect?.() !== false && canNavigateCamera() && !terrainBrush && !sceneBrush?.isEnabled() && !performanceDrawing && !performanceEditing && !transform.axis) {
      const start = selectionPoint(event.clientX, event.clientY);
      if (!start) return;
      boxSelection = { pointer: event.pointerId, x: event.clientX, y: event.clientY, start, end: start, additive: event.shiftKey || event.ctrlKey || event.metaKey, moved: false };
      stopNavigation();
      syncCameraControls();
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  // ACT: 框选落点不受世界边长限制：地面铺得比世界大，物件也能摆到界外。视线没落到地面（指向天际或太远）时，
  // 取视线水平方向上的远点，选框一直跟着鼠标走，不会停在世界边界上。
  const selectionGround = new Plane(new Vector3(0, 1, 0), 0);
  const selectionReach = 4000;
  function selectionPoint(clientX: number, clientY: number) {
    const ray = getRay(clientX, clientY);
    if (!ray) return null;
    const ground = terrainSurface?.group.getObjectByName("terrainGround");
    const point = (ground?.visible ? raycaster.intersectObject(ground, false)[0]?.point : undefined) ?? ray.intersectPlane(selectionGround, new Vector3());
    if (point && Math.hypot(point.x - ray.origin.x, point.z - ray.origin.z) <= selectionReach) return toValue(point);
    const flat = Math.hypot(ray.direction.x, ray.direction.z);
    if (flat < 1e-6) return null;
    return { x: ray.origin.x + ray.direction.x / flat * selectionReach, y: 0, z: ray.origin.z + ray.direction.z / flat * selectionReach };
  }
  function moveBoxSelection(event: PointerEvent) {
    const current = boxSelection;
    if (!current || current.pointer !== event.pointerId) return;
    current.moved ||= Math.hypot(current.x - event.clientX, current.y - event.clientY) > 4;
    const end = selectionPoint(event.clientX, event.clientY);
    if (end) current.end = end;
    if (current.moved) updateGroundSelection(current.start, current.end);
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function cancelBoxSelection() {
    const current = boxSelection;
    if (!current) return false;
    boxSelection = undefined;
    pointerStart = undefined;
    groundSelection.visible = false;
    if (canvas.hasPointerCapture(current.pointer)) canvas.releasePointerCapture(current.pointer);
    syncCameraControls();
    invalidate();
    return true;
  }

  function updateGroundSelection(start: Vector3Value, end: Vector3Value) {
    const terrain = currentTerrain();
    let count = 0;
    function edge(from: number, to: number, fixed: number, horizontal: boolean) {
      const values = [from, to];
      if (terrain) {
        const cell = terrain.size / terrain.segments;
        const grid = (fixed / terrain.size + 0.5) * terrain.segments;
        const diagonal = 1 - (grid - Math.floor(grid));
        for (let index = 0; index <= terrain.segments; index++) for (const value of [index, index + diagonal]) {
          const coordinate = -terrain.size / 2 + value * cell;
          if (coordinate > Math.min(from, to) && coordinate < Math.max(from, to)) values.push(coordinate);
        }
      }
      values.sort((a, b) => from <= to ? a - b : b - a);
      for (const value of values) {
        const x = horizontal ? value : fixed;
        const z = horizontal ? fixed : value;
        groundSelectionPoints.setXYZ(count++, x, getTerrainHeight(terrain, x, z) + 0.06, z);
      }
    }
    // ACT: 矩形边沿地形格线与三角对角线逐段取样，避免只连角点时穿过山体；最多256格。
    edge(start.x, end.x, start.z, true);
    edge(start.z, end.z, end.x, false);
    edge(end.x, start.x, end.z, true);
    edge(end.z, start.z, start.x, false);
    groundSelectionPoints.needsUpdate = true;
    groundSelection.geometry.setDrawRange(0, count);
    groundSelection.visible = true;
    invalidate();
  }

  function objectsInBox(start: Vector3Value, end: Vector3Value) {
    const left = Math.min(start.x, end.x), right = Math.max(start.x, end.x);
    const top = Math.min(start.z, end.z), bottom = Math.max(start.z, end.z);
    const footprint = new Box3();
    const result: string[] = [];
    for (const object of document.objects) {
      const record = records.get(object.id);
      if (!object.visible || !record?.group.visible || !record.group.children.length) continue;
      const body = recordCollision(object.id, record);
      footprint.makeEmpty();
      for (const part of body.parts) if (part.bounds.min.y <= body.bounds.min.y + 0.15) footprint.union(part.bounds);
      if (footprint.isEmpty()) footprint.copy(body.bounds);
      const x = (footprint.min.x + footprint.max.x) / 2;
      const z = (footprint.min.z + footprint.max.z) / 2;
      if (x >= left && x <= right && z >= top && z <= bottom) result.push(object.id);
    }
    return result;
  }

  function traceObjectDrag(group: Group, drag: NonNullable<typeof objectDrag>, target: Vector3, policy: HeightPlacement) {
    const start = group.position.clone();
    const delta = target.clone().sub(start);
    const terrain = policy.gravityEnabled && drag.mode === "plane" ? currentTerrain() : undefined;
    const segments = terrain ? Math.max(1, Math.ceil(Math.hypot(delta.x, delta.z) / Math.max(0.05, terrain.size / terrain.segments / 4))) : 1;
    // ACT: 最多64段地形跟随、每段用15轴连续扫掠；超预算停在已验证位置，后续指针事件可继续，避免长距离拖动阻塞渲染。
    for (let segment = 1; segment <= Math.min(64, segments); segment++) {
      const previous = group.position.clone();
      group.updateWorldMatrix(true, true);
      const body = groupCollision(group);
      const candidate = start.clone().addScaledVector(delta, segment / segments);
      group.position.copy(candidate);
      if (policy.gravityEnabled) keepObjectAboveTerrain(group);
      const movement = group.position.clone().sub(previous);
      const obstacles = policy.gravityEnabled ? collisionCandidates(body, movement, drag.id) : new Map<string, CollisionBody>();
      let contact: { time: number; normal: Vector3 } | undefined;
      for (const [id, obstacle] of obstacles) {
        const hit = sweepCollision(body, obstacle, movement, drag.overlaps.has(id));
        if (hit && (!contact || hit.time < contact.time)) contact = hit;
      }
      if (contact) {
        const fraction = Math.max(0, contact.time - 0.0001 / Math.max(0.0001, movement.length()));
        group.position.copy(previous).addScaledVector(movement, fraction);
        if (drag.mode === "plane") {
          if (policy.gravityEnabled) keepObjectAboveTerrain(group);
          group.updateWorldMatrix(true, true);
          const resolved = groupCollision(group);
          if ([...obstacles].some(([id, obstacle]) => !drag.overlaps.has(id) && intersectsCollision(resolved, obstacle))) group.position.copy(previous);
        }
        group.updateWorldMatrix(true, true);
        return contact.normal;
      }
      group.updateWorldMatrix(true, true);
      const accepted = groupCollision(group);
      for (const id of drag.overlaps) {
        const obstacle = obstacles.get(id);
        if (!obstacle || !intersectsCollision(accepted, obstacle)) drag.overlaps.delete(id);
      }
    }
  }

  function constrainObjectDrag(group: Group, drag: NonNullable<typeof objectDrag>, target: Vector3, policy: HeightPlacement) {
    const desired = target.clone();
    for (let attempt = 0; attempt < 4; attempt++) {
      const normal = traceObjectDrag(group, drag, desired, policy);
      if (!normal || drag.mode === "height") return;
      normal.y = 0;
      if (normal.lengthSq() < 1e-10) return;
      normal.normalize();
      const remaining = desired.clone().sub(group.position);
      remaining.y = 0;
      remaining.addScaledVector(normal, -Math.min(0, remaining.dot(normal)));
      if (remaining.lengthSq() < 1e-10) return;
      desired.copy(group.position).add(remaining);
    }
  }

  /**
   * ACT: 像游戏里搬东西：按住拖动是在地面上平移；按住Shift改成上下抬高（抬起来就不再受重力，松手停在那里）；
   * 滚轮每格转15°，R转45°（Shift+R反转）。切换时从物体当前位置接着拖，不会跳。
   */
  function switchObjectDragMode(drag: NonNullable<typeof objectDrag>, lift: boolean) {
    const group = records.get(drag.id)?.group;
    if (!group || (drag.mode === "height") === lift && drag.moved) return;
    drag.origin = group.position.clone();
    drag.screen = drag.last.clone();
    if (drag.members) {
      // 整批从各自当前的位置和朝向接着拖：位移、抬升、转角清零，转动中心跟着换到新位置。
      for (const member of drag.members) {
        const source = document.objects.find(item => item.id === member.id);
        member.origin.copy(member.group.position);
        member.baseYaw = member.group.rotation.y;
        member.policy = { height: source ? readObjectPlacement(member.group, source).height : member.policy.height, gravityEnabled: lift ? false : member.policy.gravityEnabled };
        member.startHeight = member.policy.height;
      }
      drag.pivot = drag.members.reduce((sum, member) => sum.add(member.origin), new Vector3()).divideScalar(Math.max(1, drag.members.length));
      drag.shift!.set(0, 0, 0);
      drag.rise = 0;
      drag.baseYaw = group.rotation.y;
      drag.yaw = 0;
    }
    if (lift) {
      drag.mode = "height";
      drag.heightPolicy = { ...drag.heightPolicy, gravityEnabled: false };
      drag.startHeight = drag.heightPolicy.height;
    } else {
      drag.mode = "plane";
      const ray = getRay(drag.last.x, drag.last.y);
      drag.plane = new Plane().setFromNormalAndCoplanarPoint(worldUp, group.position);
      const start = ray?.intersectPlane(drag.plane, new Vector3());
      if (start) drag.start = start;
    }
    updateCursor();
  }
  function rotateObjectDrag(degrees: number) {
    const drag = objectDrag;
    const group = drag && records.get(drag.id)?.group;
    if (!drag || !group) return;
    drag.yaw = ((drag.yaw + degrees) % 360 + 360) % 360;
    if (drag.members) {
      // 整批绕它们的中心一起转，相对位置不变。
      try { placeDragMembers(drag); }
      catch (error) { cancelObjectDrag(); options.onError(error instanceof Error ? error.message : "物体无法放置"); return; }
    } else {
      group.rotation.y = drag.baseYaw + MathUtils.degToRad(drag.yaw);
      group.updateMatrixWorld(true);
    }
    drag.moved = true;
    objectBoundsDirty = drag.id;
    options.onObjectPreview?.(drag.id, getObjectTransform(group, drag.heightPolicy));
    updateSelection();
    invalidate();
  }
  function objectDragKey(event: KeyboardEvent) {
    const drag = objectDrag;
    if (!drag) return;
    if (event.type === "keydown" && event.code === "KeyR" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); event.stopImmediatePropagation();
      rotateObjectDrag(event.shiftKey ? -45 : 45);
      return;
    }
    if (event.key === "Shift") switchObjectDragMode(drag, event.type === "keydown");
  }
  /** 多选一起拖：按当前位移/抬升/转角把整批成员摆到位。互相之间和别的物体都不挡（整批搬家不做逐件碰撞），松手后各自按重力落稳。 */
  function placeDragMembers(drag: NonNullable<typeof objectDrag>) {
    const yaw = MathUtils.degToRad(drag.yaw);
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const pivot = drag.pivot!, shift = drag.shift!;
    for (const member of drag.members!) {
      const x = member.origin.x - pivot.x, z = member.origin.z - pivot.z;
      member.group.position.set(pivot.x + x * cos + z * sin + shift.x, member.origin.y, pivot.z - x * sin + z * cos + shift.z).clampScalar(-10000, 10000);
      member.group.rotation.y = member.baseYaw + yaw;
      member.group.updateWorldMatrix(true, true);
      if (drag.mode === "height") applyObjectHeight(member.group, { height: MathUtils.clamp(member.startHeight + drag.rise!, -10000, 10000), gravityEnabled: false });
      else if (member.policy.gravityEnabled) keepObjectAboveTerrain(member.group);
    }
  }
  function moveObjectDrag(event: PointerEvent) {
    const drag = objectDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    drag.last.set(event.clientX, event.clientY);
    if (event.shiftKey !== (drag.mode === "height")) switchObjectDragMode(drag, event.shiftKey);
    const distance = drag.mode === "height" ? Math.abs(event.clientY - drag.screen.y) : drag.screen.distanceTo(new Vector2(event.clientX, event.clientY));
    if (!drag.moved && distance < 3) return;
    const group = records.get(drag.id)?.group;
    if (!group) return;
    if (drag.members) {
      if (drag.mode === "height") drag.rise = (drag.screen.y - event.clientY) * drag.heightPerPixel;
      else {
        const point = getRay(event.clientX, event.clientY)?.intersectPlane(drag.plane, new Vector3());
        if (!point || ![point.x, point.z].every(Number.isFinite)) return;
        drag.shift!.set(point.x - drag.start.x, 0, point.z - drag.start.z);
      }
      try { placeDragMembers(drag); }
      catch (error) { cancelObjectDrag(); options.onError(error instanceof Error ? error.message : "物体无法放置"); return; }
      drag.moved = true;
      objectBoundsDirty = drag.id;
      updateSelection();
      invalidate();
      return;
    }
    const previous = group.position.clone();
    const heightPolicy = { ...drag.heightPolicy };
    const position = drag.origin.clone();
    if (drag.mode === "height") {
      heightPolicy.height = MathUtils.clamp(drag.startHeight + (drag.screen.y - event.clientY) * drag.heightPerPixel, -10000, 10000);
    } else {
      const point = getRay(event.clientX, event.clientY)?.intersectPlane(drag.plane, new Vector3());
      if (!point) return;
      position.add(point.sub(drag.start));
      position.y = drag.origin.y;
    }
    if (![position.x, position.y, position.z].every(Number.isFinite)) return;
    group.position.copy(position.clampScalar(-10000, 10000));
    try {
      applyObjectHeight(group, heightPolicy);
      const desired = group.position.clone();
      group.position.copy(previous);
      constrainObjectDrag(group, drag, desired, heightPolicy);
      heightPolicy.height = readObjectPlacement(group, document.objects.find(object => object.id === drag.id)!).height;
      drag.heightPolicy = heightPolicy;
    }
    catch (error) { cancelObjectDrag(); options.onError(error instanceof Error ? error.message : "物体无法放置"); return; }
    drag.moved = true;
    objectBoundsDirty = drag.id;
    options.onObjectPreview?.(drag.id, getObjectTransform(group, drag.heightPolicy));
    if (!reducedMotion?.matches && (objectLift?.id !== drag.id || objectLift.phase !== "dragging")) {
      const box = new Box3().setFromObject(group);
      const size = box.getSize(new Vector3());
      const height = MathUtils.clamp(Math.max(size.x, size.z) * 0.08, 0.08, 0.22);
      const offset = objectLift?.id === drag.id ? Math.min(height, objectLift.offset) : 0;
      const previous = objectLift?.id === drag.id ? objectLift : undefined;
      const pivot = box.getCenter(new Vector3());
      pivot.y = box.min.y;
      const now = performance.now();
      objectLift = {
        id: drag.id, phase: "dragging", height, offset, started: now - 120 * (1 - Math.cbrt(1 - offset / height)),
        position: group.position.clone(), rotation: group.rotation.clone(), scale: group.scale.clone(),
        samplePosition: drag.origin.clone(), sampleTime: now - 1000 / 60, velocity: new Vector3(),
        tilt: previous?.tilt ?? new Vector2(), tiltVelocity: previous?.tiltVelocity ?? new Vector2(), quaternion: previous?.quaternion ?? new Quaternion(),
        pivotOffset: pivot.sub(group.position), footprint: Math.max(0.15, Math.hypot(size.x, size.z) / 2), bounce: 0, collisions: heightPolicy.gravityEnabled,
      };
    }
    updateSelection();
    invalidate();
  }

  function cancelObjectDrag() {
    const drag = objectDrag;
    if (!drag) {
      if (!transform.dragging) return false;
      if (transform.object) transform.reset();
      transform.pointerUp(null);
      return true;
    }
    objectDrag = undefined;
    dragging = false;
    if (objectLift?.id === drag.id) clearObjectMotion();
    syncCameraControls();
    const group = records.get(drag.id)?.group;
    if (drag.members) for (const member of drag.members) { member.group.position.copy(member.origin); member.group.rotation.y = member.baseYaw; member.group.updateWorldMatrix(true, true); }
    else if (group) { group.position.copy(drag.origin); group.rotation.y = drag.baseYaw; }
    objectBoundsDirty = drag.id;
    options.onObjectPreview?.(drag.id, null);
    options.onObjectCarry?.(false);
    if (canvas.hasPointerCapture(drag.pointerId)) canvas.releasePointerCapture(drag.pointerId);
    pointerStart = undefined;
    updateCursor();
    updateSelection();
    attachTransform();
    invalidate();
    return true;
  }

  function finishObjectDrag(event: PointerEvent) {
    moveObjectDrag(event);
    const drag = objectDrag;
    if (!drag) return;
    const group = records.get(drag.id)?.group;
    const position = group && toValue(group.position);
    const lift = objectLift?.id === drag.id ? objectLift : undefined;
    const yaw = drag.yaw;
    if (drag.members) {
      // 整批的最终位置直接从场景里读（取消拖动会把它们放回原处），一次交给宿主，再摆回最终位置等文档同步。
      const lifted = drag.mode === "height";
      const items = !drag.moved ? [] : drag.members.flatMap(member => {
        const source = document.objects.find(item => item.id === member.id);
        if (!source) return [];
        const values = getObjectTransform(member.group, { height: readObjectPlacement(member.group, source).height, gravityEnabled: lifted ? false : member.policy.gravityEnabled });
        values.rotation = { x: source.rotation.x, y: Math.round(((MathUtils.radToDeg(member.group.rotation.y) % 360 + 540) % 360 - 180) * 1000) / 1000, z: source.rotation.z };
        values.scale = { ...source.scale };
        return [{ id: member.id, group: member.group, values }];
      });
      cancelObjectDrag();
      if (!items.length) return;
      try {
        const moved = new Map(items.map(item => [item.id, item.values]));
        parseSceneDocument({ ...document, objects: document.objects.map(object => moved.has(object.id) ? { ...object, ...moved.get(object.id) } : object) });
        if (options.onTransformMany) options.onTransformMany(items.map(({ id, values }) => ({ id, values })));
        else for (const item of items) options.onTransform(item.id, item.values);
        for (const item of items) {
          item.group.position.copy(toVector(item.values.position));
          item.group.rotation.y = MathUtils.degToRad(item.values.rotation.y);
          item.group.updateWorldMatrix(true, true);
        }
      } catch (error) { options.onError(`物体移动无效：${error instanceof Error ? error.message : "超出允许范围"}`); }
      updateSelection();
      invalidate();
      return;
    }
    cancelObjectDrag();
    if (!drag.moved || !group || !position) return;
    if (yaw) group.rotation.y = drag.baseYaw + MathUtils.degToRad(yaw);
    if (lift && drag.heightPolicy.gravityEnabled) {
      position.y += lift.offset;
      drag.heightPolicy.height += lift.offset;
    }
    const object = document.objects.find(object => object.id === drag.id);
    if (!object) return;
    try {
      parseSceneDocument({ ...document, objects: document.objects.map(object => object.id === drag.id ? { ...object, position } : object) });
      const rotation = yaw ? { ...object.rotation, y: Math.round((((object.rotation.y + yaw) % 360 + 540) % 360 - 180) * 1000) / 1000 } : { ...object.rotation };
      options.onTransform(drag.id, { position, rotation, scale: { ...object.scale }, ...drag.heightPolicy });
      group.position.copy(toVector(position));
      objectBoundsDirty = drag.id;
      if (lift && !drag.heightPolicy.gravityEnabled && lift.offset > 0 && !reducedMotion?.matches) {
        lift.phase = "falling";
        lift.height = lift.offset;
        lift.started = performance.now();
        lift.position.copy(group.position);
        lift.rotation.copy(group.rotation);
        lift.scale.copy(group.scale);
        objectLift = lift;
      }
    } catch (error) { options.onError(`物体移动无效：${error instanceof Error ? error.message : "超出允许范围"}`); }
    updateSelection();
    invalidate();
  }

  function handlePointerCancel(event: PointerEvent) {
    if (endTouchPoint(event)) return;
    if (cameraDrag?.pointer === event.pointerId) cancelCameraDrag();
    if (pathEdit?.pointer === event.pointerId) cancelPathEdit();
    endRouteStroke(event, false);
    if (boxSelection?.pointer === event.pointerId) { pointerStart = undefined; cancelBoxSelection(); }
    if (performanceDragging) cancelPerformanceDrag();
    if (event.type === "pointercancel" && firstPersonLook?.pointerId === event.pointerId) cancelFirstPersonLook();
    if (terrainStroke?.pointerId === event.pointerId) cancelTerrainStroke();
    if (objectDrag?.pointerId === event.pointerId) cancelObjectDrag();
  }

  function handlePointerUp(event: PointerEvent) {
    if (endTouchPoint(event)) return;
    if (cameraDrag?.pointer === event.pointerId) { finishCameraDrag(event); return; }
    if (pathEdit?.pointer === event.pointerId) { finishPathEdit(event); return; }
    if (endRouteStroke(event, true)) return;
    if (isShotView()) { pointerStart = undefined; return; }
    const box = boxSelection;
    if (box?.pointer === event.pointerId) {
      const moved = box.moved || Math.hypot(box.x - event.clientX, box.y - event.clientY) > 4;
      const end = selectionPoint(event.clientX, event.clientY);
      if (end) box.end = end;
      const clickStart = pointerStart;
      cancelBoxSelection();
      if (moved) {
        pointerStart = undefined;
        event.preventDefault(); event.stopImmediatePropagation();
        if (options.canSelect?.() === false || disposed) return;
        const ids = objectsInBox(box.start, box.end);
        if (options.onMultiSelect) options.onMultiSelect(ids, box.additive);
        else { selectObjects(box.additive ? [...selectedIds, ...ids] : ids); options.onSelect(selectedId); }
        return;
      }
      pointerStart = clickStart;
    }
    if (performanceDragging) {
      performanceOverlay.pointerUp(event);
      performanceDragging = false;
      pointerStart = undefined;
      syncCameraControls();
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (firstPersonLook?.pointerId === event.pointerId && event.button === 2) { cancelFirstPersonLook(true); return; }
    if (terrainStroke?.pointerId === event.pointerId) { finishTerrainStroke(event); return; }
    if (objectDrag?.pointerId === event.pointerId) { finishObjectDrag(event); return; }
    const start = pointerStart;
    pointerStart = undefined;
    if (!canNavigateCamera() || options.canSelect?.() === false || !start || start.button !== 0 || wasDragging || Math.hypot(start.x - event.clientX, start.y - event.clientY) > 4) return;
    getRay(event.clientX, event.clientY);
    const hit = raycaster.intersectObjects([...records.values()].map(record => record.group).filter(group => group.visible), true)[0];
    const treeHit = terrainSurface?.pickTree(raycaster);
    if (treeHit && (!hit || treeHit.distance < hit.distance)) {
      select("");
      options.onSelect("");
      selectTerrainTree(treeHit.tree.index);
      setSceneAnchor({ kind: "point", position: treeHit.point });
      return;
    }
    selectTerrainTree(null);
    let actorNode: Object3D | null | undefined = hit?.object;
    while (actorNode && !actorNode.userData.performanceTrackId) actorNode = actorNode.parent;
    if (performanceEditing && actorNode?.userData.performanceTrackId) { options.onPerformanceSelect?.(actorNode.userData.performanceTrackId); return; }
    let object: Object3D | null | undefined = hit?.object;
    while (object && !object.userData.sceneObjectId) object = object.parent;
    let id = typeof object?.userData.sceneObjectId === "string" ? object.userData.sceneObjectId : "";
    const paving = isGroundPaving(id) ? hit : undefined;
    if (paving) id = "";
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;
    if (!additive) select(id);
    options.onSelect(id, additive);
    if (id && hit && selectedIds.includes(id)) {
      setSceneAnchor({ kind: "object", objectId: id, position: toValue(hit.point) });
      return;
    }
    const surfaces = [floor, terrainSurface?.group.getObjectByName("terrainGround"), terrainSurface?.group.getObjectByName("terrainWater")].filter((surface): surface is Object3D => !!surface?.visible);
    const ground = raycaster.intersectObjects(surfaces, false)[0];
    // 点在铺装上：场景点落在铺装面上，不是铺装下面的地形。
    const surface = paving && (!ground || paving.distance <= ground.distance) ? paving : ground;
    let point = surface?.point ?? raycaster.ray.intersectPlane(new Plane(worldUp, 0), new Vector3());
    const normal = worldHitNormal(surface);
    if (!point || ![point.x, point.y, point.z].every(coordinate => Number.isFinite(coordinate) && Math.abs(coordinate) <= 10000)) {
      // ACT: 天空没有可命中的表面，按当前观察深度给出空间参考点，不把它冒充地面高度。
      point = raycaster.ray.at(Math.max(5, camera.position.distanceTo(controls.target)), new Vector3()).clampScalar(-10000, 10000);
      normal.copy(camera.getWorldDirection(new Vector3())).negate();
    }
    setSceneAnchor({ kind: "point", position: toValue(point) }, normal);
  }

  function handleDoubleClick(event: MouseEvent) {
    if (isShotView() || terrainBrush || sceneBrush?.isEnabled() || performanceDrawing) return;
    getRay(event.clientX, event.clientY);
    const hit = raycaster.intersectObjects([...records.values()].map(record => record.group).filter(group => group.visible), true)[0];
    const treeHit = terrainSurface?.pickTree(raycaster);
    if (treeHit && (!hit || treeHit.distance < hit.distance)) { focusTerrainTree(treeHit.tree.index); return; }
    let actorNode: Object3D | null | undefined = hit?.object;
    while (actorNode && !actorNode.userData.performanceTrackId) actorNode = actorNode.parent;
    if (actorNode?.userData.performanceTrackId) { focusPerformance(actorNode.userData.performanceTrackId); return; }
    let object: Object3D | null | undefined = hit?.object;
    while (object && !object.userData.sceneObjectId) object = object.parent;
    if (object && !isGroundPaving(object.userData.sceneObjectId)) focus(object.userData.sceneObjectId);
  }

  function onTransformChange() {
    if (dragging && transform.object instanceof Group) {
      const object = document.objects.find(object => object.id === selectedId);
      try { if (object && getObjectGravityEnabled(object)) keepObjectAboveTerrain(transform.object); }
      catch (error) { options.onError(error instanceof Error ? error.message : "物体无法放置"); }
      objectBoundsDirty = selectedId;
      if (object) options.onObjectPreview?.(object.id, getObjectTransform(transform.object, readObjectPlacement(transform.object, object)));
    }
    updateSelection();
    invalidate();
  }

  function onDraggingChanged(event: { value: unknown }) {
    dragging = event.value === true;
    syncCameraControls();
    if (disposed) return;
    if (dragging) { wasDragging = true; return; }
    if (transform.object && selectedId) {
      const object = transform.object;
      const source = document.objects.find(item => item.id === selectedId);
      const values = {
        position: toValue(object.position),
        rotation: { x: MathUtils.radToDeg(object.rotation.x), y: MathUtils.radToDeg(object.rotation.y), z: MathUtils.radToDeg(object.rotation.z) },
        scale: toValue(object.scale),
        ...(source ? readObjectPlacement(object as Group, source) : {}),
      };
      try {
        parseSceneDocument({ ...document, objects: document.objects.map(item => item.id === selectedId ? { ...item, ...values } : item) });
        options.onTransform(selectedId, values);
        reportModelErrors();
      } catch (error) {
        options.onError(`物体调整无效：${error instanceof Error ? error.message : "超出允许范围"}`);
      } finally {
        options.onObjectPreview?.(selectedId, null);
        const current = document.objects.find(item => item.id === selectedId);
        const record = records.get(selectedId);
        if (current && record) applyObject(record, current);
        updateSelection();
      }
    }
    invalidate();
  }

  function onOrbitEnd() {
    if (dragging || disposed) return;
    pendingViewSave = true;
  }

  function saveView() {
    pendingViewSave = false;
    const view = readView();
    viewSignature = JSON.stringify(view);
    options.onViewChange(view);
  }

  function focus(id?: string) {
    const group = id ? worldLife.getActorObjects().find(actor => actor.objectId === id)?.group ?? records.get(id)?.group : undefined;
    const box = new Box3();
    if (group) box.setFromObject(group, true);
    else {
      for (const record of records.values()) if (record.group.visible) box.expandByObject(record.group, true);
      if (terrainSurface) box.expandByObject(terrainSurface.group, true);
      expandLifeBounds(box);
    }
    focusBounds(box);
  }

  function focusObjects(ids: string[]) {
    const box = new Box3();
    if (getSelectionBounds(ids, box)) focusBounds(box);
  }

  function focusTerrainTree(index: number) {
    const box = new Box3();
    if (getTerrainTreeBounds(index, box)) focusBounds(box);
  }

  function focusBounds(box: Box3) {
    if (box.isEmpty()) { transitionView(document.view); return; }
    const target = box.getCenter(new Vector3());
    const radius = box.getSize(new Vector3()).length() / 2;
    const halfFov = Math.atan(Math.tan(MathUtils.degToRad(camera.fov) / 2) * Math.min(camera.aspect, 1));
    const distance = Math.max(controls.minDistance * 1.5, radius + camera.near * 2, radius / Math.sin(halfFov) * 1.12);
    controls.maxDistance = Math.max(controls.maxDistance, distance * 1.2);
    camera.far = Math.max(camera.far, distance + radius * 2);
    camera.updateProjectionMatrix();
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 0.01) direction.set(1, 0.8, 1).normalize();
    transitionView({ position: toValue(target.clone().addScaledVector(direction, distance)), target: toValue(target), fov: camera.fov });
  }

  function getBounds(id?: string): { center: Vector3Value; size: Vector3Value } {
    const box = new Box3();
    for (const [objectId, record] of records) {
      if (id && objectId !== id || !record.group.visible) continue;
      record.group.updateWorldMatrix(true, true);
      box.expandByObject(record.group, true);
    }
    if (!id && terrainSurface) box.expandByObject(terrainSurface.group);
    if (!id) expandLifeBounds(box);
    if (box.isEmpty()) return { center: { x: 0, y: 1, z: 0 }, size: { x: 2, y: 2, z: 2 } };
    return { center: toValue(box.getCenter(new Vector3())), size: toValue(box.getSize(new Vector3())) };
  }

  function getLifePlanningContext() {
    const measured = document.objects.flatMap(object => {
      const record = records.get(object.id);
      if (!object.visible || !record?.placementBounds || !record.group.children.length || record.loadedSignature !== record.signature) return [];
      record.group.updateWorldMatrix(true, true);
        return [{ objectId: object.id, bounds: record.placementBounds.clone().applyMatrix4(record.group.matrixWorld), matrixWorld: record.group.matrixWorld.clone(), effectParts: getPerformanceEffectParts(record.group) }];
    });
    return buildLifePlanningContext(document, measured, worldLife.getStatus());
  }

  function expandLifeBounds(box: Box3) {
    if (document.life?.enabled) for (const group of getLifeGroups(document.life)) {
      if (!group.enabled || !group.count) continue;
      const { center, radius } = group;
      const terrain = document.terrain;
      const column = terrain ? MathUtils.clamp(Math.round((center.x / terrain.size + 0.5) * terrain.segments), 0, terrain.segments) : 0;
      const row = terrain ? MathUtils.clamp(Math.round((center.z / terrain.size + 0.5) * terrain.segments), 0, terrain.segments) : 0;
      const waterLevel = terrain ? getTerrainWaterLevel(terrain, row * (terrain.segments + 1) + column) : null;
      const height = group.locomotion === "water" ? (waterLevel ?? center.y) + group.verticalOffset : getTerrainHeight(terrain, center.x, center.z) + (group.locomotion === "air" ? group.verticalOffset : 0);
      box.expandByPoint(new Vector3(center.x - radius, height, center.z - radius));
      box.expandByPoint(new Vector3(center.x + radius, height + 1.8, center.z + radius));
    }
  }

  function resize() {
    if (disposed) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }

  function updateTheme() {
    const host = canvas.closest(".trumanMapEditor") ?? canvas;
    const style = getComputedStyle(host);
    const readColor = (name: string, fallback: string) => {
      const value = style.getPropertyValue(name).trim();
      return new Color(/^(?:#[\da-f]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\))$/i.test(value) ? value : fallback);
    };
    const fill = readColor("--el-fill-color-light", "#f5f7fa");
    const border = readColor("--el-border-color", "#dcdfe6");
    const secondary = readColor("--el-text-color-secondary", "#909399");
    const primary = readColor("--el-color-primary", "#409eff");
    // ACT: 界面主题只调整编辑辅助元素，世界材质保持既有表现。
    const colors = grid.geometry.getAttribute("color");
    const minor = secondary.clone().lerp(fill, 0.3);
    for (let index = 0; index < colors.count; index++) {
      const color = Math.floor(index / 4) === Math.floor((colors.count / 4 - 1) / 2) ? border : minor;
      colors.setXYZ(index, color.r, color.g, color.b);
    }
    colors.needsUpdate = true;
    if (selectionBox.material instanceof LineBasicMaterial) selectionBox.material.color.copy(primary);
    invalidate();
  }

  async function whenReady() {
    if (disposed) throw new Error("场景编辑器已关闭");
    if (renderer.getContext().isContextLost()) throw new Error("3D 渲染上下文已丢失，请重新打开场景");
    while (pendingLoads.size) {
      await Promise.all([...pendingLoads]);
      if (disposed) throw new Error("场景编辑器已关闭");
    }
    if (modelErrors.size) throw new Error(`无法输出不完整的场景：${modelErrors.values().next().value}`);
    const unloaded = [...records.values()].find(record => record.loadedSignature !== record.signature);
    if (unloaded) throw new Error(`“${unloaded.object.name}”的当前模型版本尚未载入，不能用旧模型作为场景观察结果`);
    if (renderer.getContext().isContextLost()) throw new Error("3D 渲染上下文已丢失，请重新打开场景");
    if (options.autoRender === false) updateGravity(0, true);
    if (lifeNeedsSync) {
      // 先走分片预热（有的话等它算完），再确保已经同步。
      syncWorldLife();
      while (navigationWarmup) { await navigationWarmup; if (disposed) throw new Error("场景编辑器已关闭"); }
      if (lifeNeedsSync) syncWorldLife(true);
    }
  }

  // ACT: framing给定时按这台机位此刻的画面、按成片画幅拍（长边width；镜头表、分镜导出用），否则拍当前编辑视角。
  // 同步编码（encodeCanvas）：toBlob 排在浏览器空闲时段，连续截图或窗口在后台时每张要等约1秒。
  async function capture(framing?: CameraFraming, width = 960, type = "image/png"): Promise<Blob> {
    return encodeCanvas(await captureCanvas(framing, width), type, 0.85);
  }
  /** 截图时藏起机位、动线、辅助线、选中框等编辑用的东西；返回还原函数。 */
  function hideCaptureOverlays() {
    const placement = assetPlacement;
    const items = [sceneCameras.root, scene.getObjectByName("performanceOverlay"), helpers, transformHelper, brushIndicator, groundSelection, sceneBrush?.root, sceneAnchorMarker, performanceSelection, placement?.group].filter((item): item is Object3D => !!item);
    const visible = items.map(item => item.visible);
    for (const item of items) item.visible = false;
    return () => items.forEach((item, index) => { if (item !== placement?.group || assetPlacement === placement) item.visible = visible[index]!; });
  }
  // ACT: 批量截图（导出逐镜、逐帧）：整批期间编辑用的辅助物一直藏着、像素比停在1、画布停在截图尺寸，主循环不画；
  // 每张截完只还原演绎状态，不再重画主视口/取景窗/监看、不来回改画布尺寸（实测那部分占单张截图约3/4的时间）。结束时整体还原并补画一帧。
  let captureBatch: { size: Vector2; pixelRatio: number; showOverlays: () => void } | undefined;
  function beginCaptureBatch() {
    if (captureBatch || disposed) return;
    captureBatch = { size: renderer.getSize(new Vector2()), pixelRatio: renderer.getPixelRatio(), showOverlays: hideCaptureOverlays() };
    renderer.setPixelRatio(1);
  }
  function endCaptureBatch() {
    const batch = captureBatch;
    captureBatch = undefined;
    if (!batch || disposed) return;
    batch.showOverlays();
    renderer.setPixelRatio(batch.pixelRatio);
    resize();
    publishLifeStatus();
    animateWorld(animationTime);
    renderer.shadowMap.needsUpdate = true;
    renderFrame();
    invalidate();
  }
  const captureSize = new Vector2();
  // ACT: 预演小样逐帧用：画到给定画布上（不新建），animationSeconds 给定时动画时钟按它走（离线渲染每帧推进1/帧率秒，步态不随渲染快慢变）。
  async function captureCanvas(framing?: CameraFraming, width = 960, target?: HTMLCanvasElement, animationSeconds?: number): Promise<HTMLCanvasElement> {
    do { await whenReady(); await waitForTerrainMaterial(); } while (pendingLoads.size);
    if (disposed || renderer.getContext().isContextLost()) throw new Error("场景渲染器已关闭或上下文已丢失，观察已取消");
    const batch = captureBatch;
    const output = target ?? canvas.ownerDocument.createElement("canvas");
    const size = batch?.size.clone() ?? renderer.getSize(new Vector2());
    const factor = width / Math.max(1, size.x, size.y);
    const captureAspect = viewportFilmAspect();
    const film = getFilmSize(width, captureAspect);
    const outputWidth = framing ? film.width : Math.max(1, Math.round(size.x * factor));
    const outputHeight = framing ? film.height : Math.max(1, Math.round(size.y * factor));
    // 逐帧画到同一块画布时尺寸不变就不重设（重设会清空并重新分配画布）。
    if (output.width !== outputWidth || output.height !== outputHeight) { output.width = outputWidth; output.height = outputHeight; }
    const context = output.getContext("2d");
    if (!context) throw new Error("无法创建场景观察画布");
    const pixelRatio = renderer.getPixelRatio();
    const captureCamera = camera.clone();
    const lifeState = worldLife.snapshot();
    const savedLifeClockJump = worldLifeClockJump;
    if (framing) aimCamera(captureCamera, framing, output.width / output.height, captureAspect);
    captureCamera.aspect = output.width / output.height;
    captureCamera.updateProjectionMatrix();
    let showOverlays: (() => void) | undefined;
    try {
      if (!batch) { showOverlays = hideCaptureOverlays(); renderer.setPixelRatio(1); }
      const current = renderer.getSize(captureSize);
      if (!batch || current.x !== output.width || current.y !== output.height) renderer.setSize(output.width, output.height, false);
      renderer.setViewport(0, 0, output.width, output.height);
      animateWorld(animationSeconds ?? animationTime, toValue(captureCamera.position));
      renderer.shadowMap.needsUpdate = true;
      renderScene(captureCamera);
      context.clearRect(0, 0, output.width, output.height);
      context.drawImage(canvas, 0, 0);
    } finally {
      worldLife.restore(lifeState);
      worldLifeClockJump = savedLifeClockJump;
      if (!batch) {
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(size.x, size.y, false);
        showOverlays?.();
        publishLifeStatus();
        animateWorld(animationTime);
        renderer.shadowMap.needsUpdate = true;
        renderFrame();
        invalidate();
      }
    }
    return output;
  }

  sceneBrush = createSceneBrushStroke({
    canvas, scene, pointAt: terrainPoint, terrain: currentTerrain, objects: () => document.objects,
    multisampled: renderer.getContext().getContextAttributes()?.antialias === true,
    canPaint: () => !disposed && !isShotView() && !cameraDrag && !firstPersonLook && !pendingLoads.size,
    loadAsset: (asset, current) => loadAssetContent(asset, "#bac5d3", current),
    seedCollision: (group, source) => { collisionShapes.set(group, collisionShape(source)); },
    onStatus: status => options.onSceneBrushStatus?.(status),
    fitToGround: group => {
      const body = groupCollision(group);
      const clearance = terrainClearance(body);
      group.position.y -= clearance;
      if (clearance) translateCollisionBody(body, new Vector3(0, -clearance, 0));
      return { height: group.position.y + collisionShape(group).bounds.min.y * group.scale.y, body };
    },
    isPlacementClear: (vegetation, body) => {
      for (const [id, obstacle] of collisionCandidates(body)) {
        if (vegetation && isVegetationAsset(records.get(id)!.object.asset)) continue;
        if (intersectsCollision(body, obstacle)) return false;
      }
      return true;
    },
    begin: () => {
      endAssetPlacement(); cancelViewTransition(); stopNavigation(); cancelFirstPersonLook(); cancelObjectDrag(); cancelTerrainStroke();
      sceneBrushDrawing = true;
      applyView(readView()); syncCameraControls(); pointerStart = undefined;
    },
    end: () => { sceneBrushDrawing = false; syncCameraControls(); },
    commit: objects => options.onSceneBrush?.(objects),
    error: text => (options.onSceneBrushError ?? options.onError)(text),
    invalidate,
  });

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(canvas.ownerDocument.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
  controls.addEventListener("change", invalidate);
  controls.addEventListener("end", onOrbitEnd);
  transform.addEventListener("objectChange", onTransformChange);
  transform.addEventListener("change", invalidate);
  transform.addEventListener("dragging-changed", onDraggingChanged);
  canvas.addEventListener("pointerdown", handlePointerDown, true);
  canvas.addEventListener("pointermove", moveTouchGesture, true);
  canvas.addEventListener("pointermove", moveBoxSelection, true);
  canvas.addEventListener("pointermove", moveFirstPersonPointer, true);
  canvas.addEventListener("pointermove", movePerformancePointer, true);
  canvas.addEventListener("pointermove", handleTerrainPointer, true);
  canvas.addEventListener("pointerleave", handleTerrainLeave);
  canvas.addEventListener("pointermove", moveCameraDrag, true);
  canvas.addEventListener("pointermove", movePathEdit, true);
  canvas.addEventListener("pointermove", moveRouteStroke, true);
  canvas.addEventListener("pointermove", moveObjectDrag, true);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerCancel);
  canvas.addEventListener("lostpointercapture", handlePointerCancel);
  canvas.addEventListener("dblclick", handleDoubleClick);
  canvas.addEventListener("wheel", handleWheel, { passive: false, capture: true });
  function onContextLost(event: Event) {
    event.preventDefault();
    cancelCameraDrag();
    terrainContextLost = true;
    terrainFirstFrame = false;
    settleTerrainCaptures(new Error("3D渲染上下文已丢失，观察已取消"));
    cancelTerrainWarmup();
    terrainReadyKeys = new WeakMap();
    terrainFailedKeys = new WeakMap();
    terrainSurface?.setMaterialReady(false);
    preparedTerrainSurface?.setMaterialReady(false);
    stopNavigation();
    options.onError("3D 渲染上下文已丢失，请关闭并重新打开编辑器");
  }
  function onContextRestored() {
    if (disposed) return;
    terrainContextLost = false;
    terrainFirstFrame = false;
    parallelShaderCompile = renderer.extensions.get("KHR_parallel_shader_compile") as KHR_parallel_shader_compile | null;
    invalidate();
  }
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  ownerDocument.addEventListener("keydown", clearNavigationOnModifier, true);
  ownerDocument.addEventListener("keydown", objectDragKey, true);
  ownerDocument.addEventListener("keyup", objectDragKey, true);
  ownerDocument.addEventListener("mousemove", moveFirstPersonLook);
  ownerDocument.addEventListener("mouseup", releaseFirstPersonLook, true);
  ownerDocument.addEventListener("pointerlockchange", handlePointerLockChange);
  ownerDocument.addEventListener("focusin", clearNavigationOnFocus);
  ownerDocument.addEventListener("visibilitychange", clearNavigationOnHidden);
  ownerWindow?.addEventListener("keyup", releaseNavigationKey, true);
  ownerWindow?.addEventListener("blur", handleWindowBlur);
  if (options.autoRender !== false) renderer.setAnimationLoop(time => {
    // 批量截图期间画布停在截图尺寸，主循环不画也不推进动画，结束时统一补画。
    if (disposed || captureBatch) return;
    const gravitySeconds = gravityTime ? Math.min(0.05, Math.max(0, (time - gravityTime) / 1000)) : 0;
    gravityTime = time;
    if (navigationEnabled && !ownerDocument.hidden && updateGravity(gravitySeconds)) dirty = true;
    if (lifeNeedsSync && !pendingLoads.size) syncWorldLife();
    updateTerrainStroke(time);
    sceneBrush?.update(time);
    if (updateObjectMotion(time)) dirty = true;
    const transitioning = updateViewTransition(time);
    const looked = updateFirstPersonLook(time);
    const moved = updateNavigation(time);
    const changed = controls.enabled && !firstPersonTail && controls.update();
    const cameraGround = getTerrainHeight(currentTerrain(), camera.position.x, camera.position.z) + cameraFloorHeight;
    if (!isShotView() && camera.position.y < cameraGround) {
      const height = cameraGround - camera.position.y;
      camera.position.y += height;
      controls.target.y += height;
      pendingViewSave = true;
      dirty = true;
    }
    if (changed || looked || moved || transitioning || sceneAnchor && time - sceneAnchorStarted < 180) dirty = true;
    else if (!viewTransition && !navigationKeys.size && pendingViewSave && !dragging && !firstPersonLook && !firstPersonTail) saveView();
    // ACT: 只有环境动画（世界时钟、演绎、天气）要画时，最多约 13ms 推进并画一帧：120/240Hz 高刷屏上不再每个刷新周期都整场重画，
    // 主线程留出余量给界面和输入（实测 240Hz 笔记本上原来每帧都在画，主线程被占满）。镜头/物体交互、视角过渡等置了 dirty 的照常逐帧画。
    const interactive = dirty;
    if (!interactive && time - ambientFrameTime < 13) return;
    animationTime = time / 1000;
    if (animateWorld(animationTime)) dirty = true;
    if (!dirty) return;
    if (!interactive) ambientFrameTime = time;
    renderFrame();
    dirty = false;
  });
  resize();
  updateTheme();
  sync(document);

  function dispose() {
    if (disposed) return;
    cancelCameraDrag();
    cancelBoxSelection();
    filmPreview = false; shotTransition = undefined; shotLetterbox = 0;
    viewfinder = undefined; cameraOverrides.clear(); cameraEditingId = null;
    disposed = true;
    settleTerrainCaptures(new Error("场景编辑器已关闭，观察已取消"));
    cancelTerrainWarmup();
    cancelObjectLoadFrame?.();
    activeObjectLoad?.resolve();
    for (const job of objectLoadQueue.splice(0)) job.resolve();
    staticBatches.dispose();
    navigationAbort.abort(new Error("场景编辑器已关闭"));
    worldLife.dispose();
    sceneCameras.dispose();
    monitor = undefined; cameraShotSelected = undefined; subjectHeights.clear();
    performanceOverlay.dispose();
    sceneBrush?.dispose();
    endAssetPlacement();
    cancelFirstPersonLook();
    cancelTerrainStroke();
    viewTransition = undefined;
    cancelObjectDrag();
    stopNavigation();
    renderer.setAnimationLoop(null);
    resizeObserver.disconnect();
    themeObserver.disconnect();
    canvas.removeEventListener("pointerdown", handlePointerDown, true);
    canvas.removeEventListener("pointermove", moveTouchGesture, true);
    canvas.removeEventListener("pointermove", moveBoxSelection, true);
    canvas.removeEventListener("pointermove", moveFirstPersonPointer, true);
    canvas.removeEventListener("pointermove", movePerformancePointer, true);
    canvas.removeEventListener("pointermove", handleTerrainPointer, true);
    canvas.removeEventListener("pointerleave", handleTerrainLeave);
    canvas.removeEventListener("pointermove", moveCameraDrag, true);
    canvas.removeEventListener("pointermove", moveObjectDrag, true);
    canvas.removeEventListener("pointerup", handlePointerUp);
    canvas.removeEventListener("pointercancel", handlePointerCancel);
    canvas.removeEventListener("lostpointercapture", handlePointerCancel);
    canvas.removeEventListener("dblclick", handleDoubleClick);
    canvas.removeEventListener("wheel", handleWheel, true);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    canvas.removeEventListener("webglcontextrestored", onContextRestored);
    ownerDocument.removeEventListener("keydown", clearNavigationOnModifier, true);
    ownerDocument.removeEventListener("keydown", objectDragKey, true);
    ownerDocument.removeEventListener("keyup", objectDragKey, true);
    ownerDocument.removeEventListener("mousemove", moveFirstPersonLook);
    ownerDocument.removeEventListener("mouseup", releaseFirstPersonLook, true);
    ownerDocument.removeEventListener("pointerlockchange", handlePointerLockChange);
    ownerDocument.removeEventListener("focusin", clearNavigationOnFocus);
    ownerDocument.removeEventListener("visibilitychange", clearNavigationOnHidden);
    ownerWindow?.removeEventListener("keyup", releaseNavigationKey, true);
    ownerWindow?.removeEventListener("blur", handleWindowBlur);
    controls.removeEventListener("change", invalidate);
    controls.removeEventListener("end", onOrbitEnd);
    transform.removeEventListener("objectChange", onTransformChange);
    transform.removeEventListener("change", invalidate);
    transform.removeEventListener("dragging-changed", onDraggingChanged);
    controls.dispose();
    transform.dispose();
    scene.remove(transformHelper);
    if (terrainSurface) { scene.remove(terrainSurface.group); terrainSurface.dispose(); terrainSurface = undefined; }
    preparedTerrainSurface?.dispose(); preparedTerrainSurface = undefined; preparedTerrain = undefined;
    scene.remove(worldWeather.group);
    worldWeather.dispose();
    scene.remove(worldCelestials.group);
    worldCelestials.dispose();
    for (const record of records.values()) record.weather?.dispose();
    disposeObject(scene);
    for (const template of modelTemplates.values()) disposeObject(template.model);
    modelTemplates.clear();
    sun.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    records.clear();
    windRecords.clear();
    collisionIndex.clear();
    assetCollisionShapes.clear();
  }

  return {
    setPerformanceEditing, setPerformanceDraft, cancelPerformanceDrag, focusPerformance,
    beginAssetPlacement, updateAssetPlacement, getAssetPlacement, endAssetPlacement, setSceneBrush, cancelSceneBrush,
    sync, setTool, setHelpersVisible, setObjectDragEnabled, setObjectDragMode, setObjectEditing, setTerrainBrush, cancelTerrainStroke, finishTerrainStroke, cancelObjectDrag, cancelFirstPersonLook, cancelBoxSelection, getObjectPlacements, getObjectHeight, getObjectHeightPerPixel, constrainTransform, setSceneAnchor, setNavigationEnabled, handleNavigationKey, select, selectObjects, selectTerrainTree, focus, focusObjects, focusTerrainTree, getBounds, whenReady, capture, captureCanvas, beginCaptureBatch, endCaptureBatch, getTerrainRenderQuality, dispose,
    getView: readView,
    getEditorView: readView,
    setCamerasVisible, setCameraEditing, setCameraPose, getCameraPose, getProgramCameraId, setViewfinder, setMonitor, setFilmPreview, getFilmRange, getWorldSeconds, setCameraShotSelection, setCameraPathDrawing, pickTrackPoint, setCameraAnchorSelection, groundHeightAt, pickSceneObject, sightBlocked, surfaceColorAt, getSubjectPosition: resolveSubject,
    getWorldHour,
    getWorldTime,
    seekPerformance, settleClock, restartPerformance, createStageProbe,
    setWorldTimePreview,
    markWorldTimeJump: () => { worldLifeClockJump = true; },
    getLifeTime: () => worldLife.getTime(),
    getLifeStatus,
    getPlacementReport, getRouteReport,
    resolveLifeAnchor: worldLife.getAnchorPosition,
    createLifeAnchor: (anchor: SceneAnchor): LifeAnchor => {
      if (anchor.kind === "point") return { kind: "point", position: { ...anchor.position } };
      const source = records.get(anchor.objectId)?.group;
      if (!source?.children.length) throw new Error("锚定物体尚未载入");
      source.updateWorldMatrix(true, false);
      if (Math.abs(source.matrixWorld.determinant()) < 1e-12) throw new Error("物体变换无效，无法设置途经点");
      return { kind: "object", objectId: anchor.objectId, offset: toValue(source.worldToLocal(toVector(anchor.position))) };
    },
    getLifePlanningContext,
    getPerformanceTerrainObstacles,
    getGroundHeight: (x: number, z: number) => getTerrainHeight(currentTerrain(), x, z),
    getEffectParts: (id: string) => { const source = records.get(id)?.group; return source?.children.length ? getPerformanceEffectParts(source) : []; },
    groundPoint: (clientX: number, clientY: number) => terrainPoint(clientX, clientY) ?? pointOnPlane(clientX, clientY, 0),
  };
}

export type SceneViewport = ReturnType<typeof createSceneViewport>;

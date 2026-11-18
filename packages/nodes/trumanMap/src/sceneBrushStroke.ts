import { Box3, BufferGeometry, Color, DynamicDrawUsage, Float32BufferAttribute, Group, InstancedMesh, Line, LineBasicMaterial, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, SkinnedMesh, Sphere, Vector3 } from "three";
import type { Material, Scene } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { createSceneObject } from "./sceneDocument";
import type { SceneAsset, SceneObject, SceneTerrain, Vector3Value } from "./sceneDocument";
import { disposeObject } from "./sceneResources";
import { createPathBrushObject } from "./sceneBrushAssets";
import type { SceneBrushSettings, SceneBrushStatus } from "./sceneBrushAssets";
import { getTerrainHeight } from "./terrainModel";
import { isVegetationAsset } from "./assetMetadata";
import { createCollisionIndex, intersectsCollision, type CollisionBody } from "./sceneCollision";

type BrushOptions = {
  canvas: HTMLCanvasElement;
  scene: Scene;
  multisampled: boolean;
  pointAt: (x: number, y: number) => Vector3Value | null;
  terrain: () => SceneTerrain | undefined;
  objects: () => SceneObject[];
  canPaint: () => boolean;
  loadAsset: (asset: SceneAsset, current: () => boolean) => Promise<Group | undefined>;
  fitToGround: (group: Group) => { height: number; body: CollisionBody };
  seedCollision?: (group: Group, source: Group) => void;
  isPlacementClear: (vegetation: boolean, body: CollisionBody) => boolean;
  onStatus?: (status: SceneBrushStatus) => void;
  begin: () => void;
  end: () => void;
  commit: (objects: SceneObject[]) => void;
  error: (message: string) => void;
  invalidate: () => void;
};
type PreviewPart = { mesh: Mesh; matrices: Matrix4[] };
type PreviewBatch = { meshes: { mesh: InstancedMesh; matrices: Matrix4[] }[]; bounds: Sphere; count: number };
type BrushTemplate = { asset: SceneAsset; content: Group; materials: Material[]; skinned: boolean; parts?: { shapes: PreviewPart[]; bounds: Sphere } };
type TemplateEntry = { asset: SceneAsset; template?: BrushTemplate; loading?: boolean; error?: string };
type BrushSegment = { from: Vector3Value; to: Vector3Value; steps: number; next: number };
type BrushSweep = { point: Vector3Value; x: number; z: number; minX: number; maxX: number; maxZ: number };
type BrushPointer = { x: number; y: number; pointerId: number; final?: boolean };
type BrushStroke = { pointerId: number; points: Vector3Value[]; segments: BrushSegment[]; segmentIndex: number; sweep?: BrushSweep; released: boolean; objects: SceneObject[]; placements?: ReturnType<typeof createCollisionIndex>; vegetationIds: Set<string>; vegetation: Map<string, Vector3Value[]>; cells: Set<string>; assetIndex: number; seed: number; dirty: boolean; stopped: boolean };

export function createSceneBrushStroke(options: BrushOptions) {
  const { canvas, scene } = options;
  const root = new Group();
  root.name = "sceneBrushPreview";
  const indicator = new Line(new BufferGeometry(), new LineBasicMaterial({ color: "#409eff", depthTest: false, transparent: true, opacity: 0.85 }));
  const indicatorPositions = new Float32BufferAttribute(new Float32Array(65 * 3), 3);
  indicatorPositions.setUsage(DynamicDrawUsage);
  indicator.geometry.setAttribute("position", indicatorPositions);
  indicator.frustumCulled = false;
  indicator.renderOrder = 20;
  indicator.visible = false;
  root.add(indicator);
  scene.add(root);
  let settings: SceneBrushSettings | null = null;
  let stroke: BrushStroke | undefined;
  let templates: BrushTemplate[] = [];
  const templateCache = new Map<string, TemplateEntry>();
  const modelKeys = new WeakMap<object, number>();
  let modelKey = 0;
  let selectedKeys: string[] = [];
  let templateToken = 0;
  let templateError = "";
  let statusKey = "";
  const objectRoot = new Group();
  root.add(objectRoot);
  const placementGroup = new Group();
  const instanceMatrix = new Matrix4();
  const previewBounds = new Sphere();
  const previewBatchSize = 128;
  const instancedPreviews = new Map<BrushTemplate, Map<string, PreviewBatch>>();
  let pathPreview: Group | undefined;
  let pathObject: SceneObject | undefined;
  let disposed = false;
  let lastUpdate = 0;
  let indicatorPoint: Vector3Value | null = null;
  let indicatorDirty = false;
  let pendingPointer: BrushPointer | undefined;
  let releaseSample: BrushPointer | undefined;
  const indicatorCircle = Array.from({ length: 65 }, (_, index) => ({ x: Math.cos(index / 64 * Math.PI * 2), z: Math.sin(index / 64 * Math.PI * 2) }));

  function clearPreview() {
    // 普通预览共享模板几何和材质；骨骼克隆只释放自己拥有的骨骼纹理。
    objectRoot.traverse(child => { if (child instanceof SkinnedMesh) child.skeleton.dispose(); if (child instanceof InstancedMesh) child.dispose(); });
    instancedPreviews.clear();
    objectRoot.clear();
    if (pathPreview) { root.remove(pathPreview); disposeObject(pathPreview); pathPreview = undefined; }
    pathObject = undefined;
    options.invalidate();
  }
  function disposeTemplates(values: BrushTemplate[]) {
    for (const template of values) {
      disposeObject(template.content);
      template.materials.forEach(material => material.dispose());
    }
  }
  function clearTemplate() {
    templateToken++;
    clearPreview();
    disposeTemplates([...templateCache.values()].flatMap(entry => entry.template ? [entry.template] : []));
    templateCache.clear();
    templates = [];
    selectedKeys = [];
    templateError = "";
  }
  function cancel() {
    const current = stroke;
    stroke = undefined;
    if (current) {
      if (canvas.hasPointerCapture(current.pointerId)) canvas.releasePointerCapture(current.pointerId);
      options.end();
    }
    indicator.visible = false;
    indicatorPoint = null;
    indicatorDirty = false;
    pendingPointer = undefined;
    releaseSample = undefined;
    clearPreview();
    return !!current;
  }
  function assetKey(asset: SceneAsset) {
    let identity = 0;
    if (asset.model) {
      identity = modelKeys.get(asset.model) ?? ++modelKey;
      modelKeys.set(asset.model, identity);
    }
    // 素材描述、缩略图不影响几何；不用序列化完整程序化模型来比较每次滑块变化。
    return JSON.stringify([asset.id, asset.kind, asset.shape, asset.url, asset.path, asset.sha256, asset.bytes, asset.normalize, identity, asset.recipe, asset.blueprint, asset.kiln]);
  }
  function publishStatus() {
    templates = selectedKeys.flatMap(key => {
      const template = templateCache.get(key)?.template;
      return template ? [template] : [];
    });
    templateError = selectedKeys.map(key => templateCache.get(key)?.error).find(Boolean) ?? "";
    const total = settings?.mode === "assets" ? selectedKeys.length : 0;
    const loading = selectedKeys.filter(key => { const entry = templateCache.get(key); return !entry?.template && !entry?.error; }).length;
    const ready = !!settings && (settings.mode !== "assets" || total > 0 && templates.length === total);
    const key = `${ready},${loading},${total}`;
    if (key !== statusKey) { statusKey = key; options.onStatus?.({ ready, loading, total }); }
    options.invalidate();
  }
  function trimTemplates() {
    // ACT: 活跃选集之外最多保留8个近期模板；关闭笔刷立即释放，包括尚未返回的加载结果。
    let spare = [...templateCache].filter(([key, entry]) => !selectedKeys.includes(key) && !entry.loading).length;
    for (const [key, entry] of templateCache) {
      if (spare <= 8) break;
      if (selectedKeys.includes(key) || entry.loading) continue;
      templateCache.delete(key);
      if (entry.template) disposeTemplates([entry.template]);
      spare--;
    }
  }
  function set(value: SceneBrushSettings | null) {
    const assets = value?.mode === "assets" ? [...new Map(value.assets.map(asset => [asset.id, asset])).values()] : [];
    const keys = assets.map(assetKey);
    const changedAssets = keys.length !== selectedKeys.length || keys.some((key, index) => key !== selectedKeys[index]);
    const unchanged = settings?.mode === value?.mode && (!settings && !value || !!settings && !!value && !changedAssets && settings.style === value.style && settings.radius === value.radius && settings.spacing === value.spacing && settings.size === value.size && settings.width === value.width && settings.height === value.height);
    if (unchanged) return;
    cancel();
    settings = value ? { ...value, assets: [...value.assets] } : null;
    if (!value) { clearTemplate(); publishStatus(); return; }
    for (const [key, entry] of templateCache) if (entry.loading && !keys.includes(key)) templateCache.delete(key);
    selectedKeys = keys;
    assets.forEach((asset, index) => {
      const key = keys[index]!;
      const entry = templateCache.get(key);
      if (entry && (!changedAssets || !entry.error)) {
        templateCache.delete(key);
        entry.asset = asset;
        if (entry.template) entry.template.asset = asset;
        templateCache.set(key, entry);
      } else templateCache.set(key, { asset });
    });
    trimTemplates();
    publishStatus();
  }
  function prepareTemplate(key: string, entry: TemplateEntry) {
    entry.loading = true;
    const token = templateToken;
    const isCurrent = () => !disposed && token === templateToken && templateCache.get(key) === entry;
    void (async () => {
      let template: BrushTemplate | undefined;
      try {
        const content = await options.loadAsset(entry.asset, isCurrent);
        if (!content) { if (isCurrent()) throw new Error("模型未能完整载入"); return; }
        const wrapper = new Group();
        wrapper.add(content);
        template = { asset: entry.asset, content: wrapper, materials: [], skinned: false };
        if (!isCurrent()) return;
        const materials = new Map<Material, Material>();
        const tint = new Color("#56c9b3");
        const vegetationCoverage = options.multisampled && isVegetationAsset(entry.asset);
        let instanceable = true;
        wrapper.updateWorldMatrix(true, true);
        wrapper.traverse(child => {
          if (child instanceof SkinnedMesh) template!.skinned = true;
          if (!(child instanceof Mesh)) return;
          if (child instanceof SkinnedMesh || child instanceof InstancedMesh || child.morphTargetInfluences?.length || child.type !== "Mesh" || child.matrixWorld.determinant() < 0) instanceable = false;
          child.castShadow = false;
          child.receiveShadow = false;
          const translucent = (source: Material) => {
            let material = materials.get(source);
            if (!material) {
              material = source.clone();
              // MSAA 覆盖率保留树木幽灵的半透明效果，已覆盖的深度样本可以挡住后方树冠。
              const coverage = vegetationCoverage && !source.transparent && source.opacity === 1 && !source.alphaTest
                && (source instanceof MeshStandardMaterial || source instanceof MeshBasicMaterial);
              material.transparent = !coverage;
              material.opacity *= 0.6;
              material.alphaTest *= 0.6;
              material.depthWrite = coverage;
              if (coverage) material.alphaToCoverage = true;
              if (material instanceof MeshStandardMaterial || material instanceof MeshBasicMaterial) material.color.lerp(tint, 0.15);
              materials.set(source, material);
              template!.materials.push(source);
            }
            return material;
          };
          child.material = Array.isArray(child.material) ? child.material.map(translucent) : translucent(child.material);
        });
        if (instanceable) {
          const shapes: PreviewPart[] = [];
          const repeated = new Map<string, PreviewPart>();
          wrapper.traverseVisible(child => {
            if (!(child instanceof Mesh)) return;
            const material = child.material;
            const key = !Array.isArray(material) && !material.transparent && material.alphaToCoverage
              ? `${child.geometry.uuid}/${material.uuid}/${child.layers.mask}/${child.renderOrder}` : undefined;
            const existing = key && repeated.get(key);
            if (existing) { existing.matrices.push(child.matrixWorld.clone()); return; }
            const part = { mesh: child, matrices: [child.matrixWorld.clone()] };
            shapes.push(part);
            if (key) repeated.set(key, part);
          });
          template.parts = { shapes, bounds: new Box3().setFromObject(wrapper).getBoundingSphere(new Sphere()) };
        }
        options.seedCollision?.(wrapper, wrapper);
        entry.template = template;
        template = undefined;
      } catch (error) {
        if (isCurrent()) {
          entry.error = `“${entry.asset.name}”载入失败：${error instanceof Error ? error.message : "无法读取模型"}`;
          if (selectedKeys.includes(key)) options.error(entry.error);
        }
      } finally {
        if (template) disposeTemplates([template]);
        if (isCurrent()) { entry.loading = false; trimTemplates(); publishStatus(); }
      }
    })();
  }
  function showIndicator(point: Vector3Value | null) {
    indicatorPoint = point;
    indicatorDirty = true;
    if (!point) indicator.visible = false;
    options.invalidate();
  }
  function updateIndicator() {
    if (!indicatorDirty) return;
    indicatorDirty = false;
    const point = indicatorPoint;
    indicator.visible = !!settings && !!point && !stroke?.released && options.canPaint();
    if (!point || !settings || !indicator.visible) return;
    const radius = settings.mode === "assets" ? settings.radius : Math.max(0.2, settings.width / 2);
    const terrain = options.terrain();
    indicatorCircle.forEach((offset, index) => {
      const x = point.x + offset.x * radius;
      const z = point.z + offset.z * radius;
      indicatorPositions.setXYZ(index, x, getTerrainHeight(terrain, x, z) + 0.06, z);
    });
    indicatorPositions.needsUpdate = true;
    options.invalidate();
  }
  function random(x: number, z: number, seed: number) {
    const value = Math.sin(x * 127.1 + z * 311.7 + seed) * 43758.5453;
    return value - Math.floor(value);
  }
  function nextCell(current: BrushStroke) {
    if (!settings) return;
    const spacing = Math.max(0.5, settings.spacing);
    const radius = Math.max(0.5, settings.radius);
    if (!current.sweep) {
      const segment = current.segments[current.segmentIndex];
      if (!segment) return;
      const progress = segment.next++ / segment.steps;
      const point = { x: segment.from.x + (segment.to.x - segment.from.x) * progress, y: segment.to.y, z: segment.from.z + (segment.to.z - segment.from.z) * progress };
      if (segment.next > segment.steps) {
        current.segmentIndex++;
        if (current.segmentIndex >= 128) { current.segments.splice(0, current.segmentIndex); current.segmentIndex = 0; }
      }
      const minX = Math.floor((point.x - radius) / spacing);
      current.sweep = { point, x: minX, z: Math.floor((point.z - radius) / spacing), minX, maxX: Math.ceil((point.x + radius) / spacing), maxZ: Math.ceil((point.z + radius) / spacing) };
    }
    const sweep = current.sweep;
    const cell = { x: sweep.x, z: sweep.z, point: sweep.point };
    if (++sweep.x > sweep.maxX) { sweep.x = sweep.minX; if (++sweep.z > sweep.maxZ) current.sweep = undefined; }
    return cell;
  }
  function cloneTemplate(template: BrushTemplate) {
    // SkeletonUtils保留根对象的实际类型，声明仅返回Object3D；模板根始终是我们创建的Group。
    return template.skinned ? clone(template.content) as Group : template.content.clone(true);
  }
  function addPreview(template: BrushTemplate, group: Group) {
    if (!template.parts?.shapes.length || !options.seedCollision) {
      const preview = options.seedCollision ? cloneTemplate(template) : group;
      if (preview !== group) { preview.position.copy(group.position); preview.quaternion.copy(group.quaternion); preview.scale.copy(group.scale); }
      objectRoot.add(preview);
      return;
    }
    let cells = instancedPreviews.get(template);
    if (!cells) { cells = new Map(); instancedPreviews.set(template, cells); }
    const cell = `${Math.floor(group.position.x / 32)},${Math.floor(group.position.z / 32)}`;
    let preview = cells.get(cell);
    if (!preview || preview.count === previewBatchSize) {
      preview = { meshes: [], bounds: new Sphere(), count: 0 };
      cells.set(cell, preview);
      for (const part of template.parts.shapes) {
        const mesh = new InstancedMesh(part.mesh.geometry, part.mesh.material, previewBatchSize * part.matrices.length);
        mesh.count = 0;
        mesh.instanceMatrix.setUsage(DynamicDrawUsage);
        mesh.renderOrder = part.mesh.renderOrder;
        mesh.layers.mask = part.mesh.layers.mask;
        mesh.boundingSphere = preview.bounds;
        objectRoot.add(mesh);
        preview.meshes.push({ mesh, matrices: part.matrices });
      }
    }
    group.updateMatrix();
    preview.bounds.union(previewBounds.copy(template.parts.bounds).applyMatrix4(group.matrix));
    for (const part of preview.meshes) {
      const begin = part.mesh.count;
      for (const matrix of part.matrices) part.mesh.setMatrixAt(part.mesh.count++, instanceMatrix.multiplyMatrices(group.matrix, matrix));
      part.mesh.instanceMatrix.addUpdateRange(begin * 16, part.matrices.length * 16);
      part.mesh.instanceMatrix.needsUpdate = true;
    }
    preview.count++;
  }
  function plant(current: BrushStroke, x: number, z: number, point: Vector3Value) {
    if (!settings || !templates.length) return false;
    const cell = `${x},${z}`;
    if (current.cells.has(cell)) return false;
    const spacing = Math.max(0.5, settings.spacing);
    const radius = Math.max(0.5, settings.radius);
    const terrain = options.terrain();
    const halfSize = (terrain?.size ?? 80) / 2;
    const px = (x + (random(x, z, current.seed) - 0.5) * 0.5) * spacing;
    const pz = (z + (random(x, z, current.seed + 7) - 0.5) * 0.5) * spacing;
    if ((px - point.x) ** 2 + (pz - point.z) ** 2 > radius ** 2 || Math.abs(px) > halfSize || Math.abs(pz) > halfSize) return false;
    current.cells.add(cell);
    const template = templates[current.assetIndex++ % templates.length]!;
    const vegetation = isVegetationAsset(template.asset);
    const scale = settings.size * (0.85 + random(x, z, current.seed + 13) * 0.3);
    const rotation = random(x, z, current.seed + 29) * 360;
    const group = options.seedCollision ? placementGroup : cloneTemplate(template);
    if (options.seedCollision) options.seedCollision(group, template.content);
    else objectRoot.add(group);
    group.position.set(px, getTerrainHeight(terrain, px, pz), pz);
    group.rotation.set(0, rotation * Math.PI / 180, 0);
    group.scale.setScalar(scale);
    const { height, body } = options.fitToGround(group);
    let blocked = false;
    if (vegetation && current.vegetation.size) {
      for (let dx = -1; dx <= 1 && !blocked; dx++) for (let dz = -1; dz <= 1 && !blocked; dz++) {
        blocked = current.vegetation.get(`${x + dx},${z + dz}`)?.some(point =>
          (point.x - px) ** 2 + (point.y - body.bounds.min.y) ** 2 + (point.z - pz) ** 2 < (spacing * 0.7) ** 2) ?? false;
      }
    }
    blocked ||= !options.isPlacementClear(vegetation, body);
    if (!blocked && current.placements) for (const [id, obstacle] of current.placements.query(body.bounds)) {
      if (!(vegetation && current.vegetationIds.has(id)) && intersectsCollision(body, obstacle)) { blocked = true; break; }
    }
    if (blocked) {
      if (group !== placementGroup) {
        objectRoot.remove(group);
        group.traverse(child => { if (child instanceof SkinnedMesh) child.skeleton.dispose(); if (child instanceof InstancedMesh) child.dispose(); });
      }
      return false;
    }
    addPreview(template, group);
    const object = createSceneObject(template.asset, { x: px, y: group.position.y, z: pz });
    object.rotation.y = rotation;
    object.scale = { x: scale, y: scale, z: scale };
    object.height = height;
    current.objects.push(object);
    if (current.placements) {
      current.placements.set(object.id, body);
      if (vegetation) current.vegetationIds.add(object.id);
    }
    return true;
  }
  function buildPathPreview() {
    const current = stroke;
    if (!current || !settings || settings.mode === "assets" || current.points.length < 2) return;
    const path = createPathBrushObject(settings.mode, settings.style, current.points, settings.width, settings.height, options.terrain());
    if (!path) return;
    const { object, content } = path;
    content.traverse(child => {
      if (!(child instanceof Mesh)) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) { material.transparent = true; material.opacity = 0.72; }
    });
    if (pathPreview) { root.remove(pathPreview); disposeObject(pathPreview); }
    pathPreview = content;
    pathObject = object;
    root.add(content);
    options.invalidate();
  }
  function consume(event: PointerEvent) { event.preventDefault(); event.stopImmediatePropagation(); }
  function down(event: PointerEvent) {
    if (!settings || !options.canPaint() || event.button !== 0) return;
    consume(event);
    if (!event.isPrimary || stroke) return;
    pendingPointer = undefined;
    const point = options.pointAt(event.clientX, event.clientY);
    if (!point) return;
    if (settings.mode === "assets" && (!templates.length || templates.length !== selectedKeys.length)) { options.error(!settings.assets.length ? "请先从素材库选择笔刷素材" : templateError || "所选素材仍在载入，请稍后再绘制"); return; }
    options.begin();
    const vegetation = new Map<string, Vector3Value[]>();
    const spacing = Math.max(0.5, settings.spacing);
    if (settings.mode === "assets" && templates.some(template => isVegetationAsset(template.asset))) {
      for (const object of options.objects()) {
        if (!object.visible || !isVegetationAsset(object.asset)) continue;
        const { x, z } = object.position;
        const key = `${Math.round(x / spacing)},${Math.round(z / spacing)}`;
        const bucket = vegetation.get(key) ?? [];
        if (!bucket.length) vegetation.set(key, bucket);
        bucket.push({ x, y: object.height ?? object.position.y, z });
      }
    }
    // 同一笔只涂植物时，由采样格决定间距，树冠按原规则允许交叠。
    const placements = settings.mode === "assets" && templates.some(template => !isVegetationAsset(template.asset)) ? createCollisionIndex() : undefined;
    stroke = { pointerId: event.pointerId, points: [point], segments: settings.mode === "assets" ? [{ from: point, to: point, steps: 1, next: 1 }] : [], segmentIndex: 0, released: false, objects: [], placements, vegetationIds: new Set(), vegetation, cells: new Set(), assetIndex: 0, seed: Math.floor(Math.random() * 100000), dirty: true, stopped: false };
    canvas.setPointerCapture(event.pointerId);
    showIndicator(point);
  }
  function appendPoint(current: BrushStroke, point: Vector3Value, final = false) {
    if (!settings || current.stopped) return;
    const previous = current.points.at(-1)!;
    const distance = Math.hypot(point.x - previous.x, point.z - previous.z);
    if (distance < (final ? 0.00001 : 0.15)) return;
    if (settings.mode === "assets") current.segments.push({ from: previous, to: point, steps: Math.min(256, Math.max(1, Math.ceil(distance / Math.max(0.5, settings.radius * 0.5)))), next: 1 });
    current.points.push(point);
    if (current.points.length > 256) current.points = current.points.filter((_, index, points) => index === 0 || index === points.length - 1 || index % 2 === 0);
    current.dirty = true;
  }
  function move(event: PointerEvent) {
    if (!settings || !options.canPaint()) return;
    if (stroke?.released) { consume(event); return; }
    if (!event.isPrimary) return;
    pendingPointer = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    if (stroke?.pointerId === event.pointerId) consume(event);
    options.invalidate();
  }
  function samplePointer() {
    const pointer = pendingPointer;
    const previous = releaseSample;
    pendingPointer = undefined;
    releaseSample = undefined;
    if (!pointer || !settings || !options.canPaint()) return;
    // 高频鼠标按帧求交；松手额外保留最后一个未采样点，防止出界的松手坐标吞掉有效末段。
    for (const sample of previous && pointer.final ? [previous, pointer] : [pointer]) {
      const point = options.pointAt(sample.x, sample.y);
      const current = stroke;
      if (current?.pointerId === sample.pointerId && (!current.released || pointer.final)) {
        if (point) appendPoint(current, point, sample.final);
        else current.stopped = true;
      }
      showIndicator(pointer.final ? null : point);
    }
  }
  function update(time: number) {
    samplePointer();
    updateIndicator();
    if (!settings || disposed) return;
    // 一帧只启动一个新模板，远程最多两项并发；程序化几何不集中阻塞打开面板。
    if (settings.mode === "assets" && selectedKeys.filter(key => templateCache.get(key)?.loading).length < 2) {
      const key = selectedKeys.find(key => { const entry = templateCache.get(key); return entry && !entry.template && !entry.loading && !entry.error; });
      if (key) prepareTemplate(key, templateCache.get(key)!);
    }
    const current = stroke;
    if (!current) return;
    if (!options.canPaint()) { cancel(); return; }
    try {
      if (settings.mode === "assets") {
        const deadline = performance.now() + 4;
        let placed = 0;
        let attempts = 0;
        // 每帧按候选耗时让出主线程；轻量笔刷可在同一帧铺满更多网格。
        while (attempts++ < 256 && performance.now() < deadline) {
          const cell = nextCell(current);
          if (!cell) break;
          if (plant(current, cell.x, cell.z, cell.point)) placed++;
        }
        if (placed) options.invalidate();
        const pending = !!current.sweep || current.segmentIndex < current.segments.length;
        if (pending || !current.released) return;
      } else if (current.dirty) {
        if (!current.released && time - lastUpdate < 1000 / 30) return;
        lastUpdate = time;
        current.dirty = false;
        buildPathPreview();
      }
      if (!current.released || stroke !== current) return;
      const objects = settings.mode === "assets" ? current.objects : pathObject ? [pathObject] : [];
      cancel();
      if (objects.length) options.commit(objects);
    } catch (error) { cancel(); options.error(error instanceof Error ? error.message : "无法生成本笔素材"); }
  }
  function up(event: PointerEvent) {
    if (!stroke || stroke.pointerId !== event.pointerId || event.button !== 0 || stroke.released) return;
    consume(event);
    const current = stroke;
    releaseSample = pendingPointer;
    pendingPointer = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, final: true };
    current.released = true;
    indicator.visible = false;
    if (canvas.hasPointerCapture(current.pointerId)) canvas.releasePointerCapture(current.pointerId);
    options.invalidate();
  }
  function pointerCancel(event: PointerEvent) { if (stroke?.pointerId === event.pointerId && (event.type === "pointercancel" || !stroke.released)) { consume(event); cancel(); } }
  function leave() { if (!stroke) { pendingPointer = undefined; showIndicator(null); } }
  canvas.addEventListener("pointerdown", down, true);
  canvas.addEventListener("pointermove", move, true);
  canvas.addEventListener("pointerup", up, true);
  canvas.addEventListener("pointercancel", pointerCancel, true);
  canvas.addEventListener("lostpointercapture", pointerCancel, true);
  canvas.addEventListener("pointerleave", leave);
  function dispose() {
    disposed = true;
    cancel();
    clearTemplate();
    scene.remove(root);
    disposeObject(root);
    canvas.removeEventListener("pointerdown", down, true);
    canvas.removeEventListener("pointermove", move, true);
    canvas.removeEventListener("pointerup", up, true);
    canvas.removeEventListener("pointercancel", pointerCancel, true);
    canvas.removeEventListener("lostpointercapture", pointerCancel, true);
    canvas.removeEventListener("pointerleave", leave);
  }
  return { set, cancel, update, dispose, root, isEnabled: () => !!settings };
}

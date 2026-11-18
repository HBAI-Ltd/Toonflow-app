import { BoxGeometry, BufferGeometry, CircleGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, Group, Line, LineBasicMaterial, LineDashedMaterial, LineSegments, MathUtils, Matrix4, Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from "three";
import type { Raycaster } from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { filmAspect, getCameraFov, maxPathPoints, sampleCameraTake } from "./cameraDocument";
import type { CameraFraming, CameraPose, CameraTake, SceneCamera } from "./cameraDocument";
import { performanceColor } from "./performanceOverlay";

/**
 * 正在编辑的机位在场景里要画的东西：take是选中镜头段（画它的运镜轨迹），draft是正在划的线，
 * ring是机位脚下地面上的点——在那里显示可拖动的圆圈，按住它拖出机位轨迹。
 */
export type EditedCameraPath = { take?: CameraTake; draft?: readonly { x: number; y: number; z: number }[]; ring?: { x: number; y: number; z: number }; drop?: number; aim?: { x: number; y: number; z: number }; anchors?: readonly { x: number; y: number; z: number }[]; activeAnchor?: number; anchorGrounds?: readonly number[]; floor?: readonly { x: number; y: number; z: number }[] };

const pathSegments = 160;
// 视锥线：机位到画框四角4段、画框4段、画框上方标出“上”的小三角3段。
const frustumSegments = 11;
const worldUp = new Vector3(0, 1, 0);

export function createSceneCameras() {
  const root = new Group();
  root.name = "sceneCameras";
  root.visible = false;
  const bodyGeometry = new BoxGeometry(0.52, 0.32, 0.3);
  const lensGeometry = new CylinderGeometry(0.14, 0.19, 0.24, 12);
  lensGeometry.rotateX(Math.PI / 2);
  const lensMaterial = new MeshBasicMaterial({ color: "#eef4fb", toneMapped: false, fog: false });
  type CameraEntry = { value: SceneCamera; base: Color; pivot: Group; icon: Group; body: MeshBasicMaterial; frustum: LineSegments<BufferGeometry, LineBasicMaterial>; shape: string };
  const entries = new Map<string, CameraEntry>();
  const pathPoints = new Float32BufferAttribute(new Float32Array(Math.max(pathSegments, maxPathPoints) * 3 + 3), 3);
  const pathDistances = new Float32BufferAttribute(new Float32Array(Math.max(pathSegments, maxPathPoints) + 1), 1);
  const path = new Line(new BufferGeometry(), new LineDashedMaterial({ dashSize: 0.32, gapSize: 0.2, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, toneMapped: false, fog: false }));
  path.geometry.setAttribute("position", pathPoints);
  path.geometry.setAttribute("lineDistance", pathDistances);
  path.frustumCulled = false; path.visible = false; path.renderOrder = 33;
  // ACT: 轨迹在地面上的影子：和划线时手画的那条线重合，一眼看出机位从哪走到哪。
  const shadow = new Line(path.geometry, new LineBasicMaterial({ transparent: true, opacity: 0.45, depthWrite: false, toneMapped: false, fog: false }));
  shadow.frustumCulled = false; shadow.visible = false; shadow.renderOrder = 32;
  const arrowGeometry = new ConeGeometry(0.1, 0.28, 12);
  const arrow = new Mesh(arrowGeometry, new MeshBasicMaterial({ toneMapped: false, fog: false, depthTest: false, transparent: true }));
  arrow.visible = false; arrow.renderOrder = 34;
  // ACT: 和演绎里角色脚下的蓝圈一样：机位脚下画一个圈，按住拖动就划出机位轨迹，不需要单独的钢笔工具。
  const ringGeometry = new RingGeometry(0.62, 0.8, 48);
  ringGeometry.rotateX(-Math.PI / 2);
  const ring = new Mesh(ringGeometry, new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false }));
  ring.visible = false; ring.renderOrder = 36;
  const stemGeometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(new Float32Array(6), 3));
  const stem = new Line(stemGeometry, new LineDashedMaterial({ dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false, fog: false }));
  stem.visible = false; stem.frustumCulled = false; stem.renderOrder = 35;
  // 跟踪点标记：一个总朝向观察者的小准星，落在被跟踪的那一点上。
  const aimGeometry = new RingGeometry(0.09, 0.13, 24);
  const aimMark = new Mesh(aimGeometry, new MeshBasicMaterial({ transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false }));
  aimMark.visible = false; aimMark.renderOrder = 37;
  // 轨迹锚点：白边圆点，总朝向观察者；拖动改轨迹。
  const handleOuter = new CircleGeometry(0.11, 20), handleInner = new CircleGeometry(0.075, 20);
  const handleWhite = new MeshBasicMaterial({ color: "#ffffff", transparent: true, depthTest: false, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false });
  const handleFill = new MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false });
  const handles: Group[] = [];
  // 锚点到地面的竖直虚线：看清每个锚点有多高；选中锚点上方的箭头把手上下拖改高度（Z）。
  const dropGeometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(new Float32Array(48 * 6), 3));
  const drops = new LineSegments(dropGeometry, new LineDashedMaterial({ dashSize: 0.1, gapSize: 0.08, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, fog: false }));
  drops.frustumCulled = false; drops.visible = false; drops.renderOrder = 35;
  // ACT: 和演绎动线一个样子：空中是机位真正走的线，地上是它的投影，两条都是白边粗线，锚点上下各一个圆点，中间竖直虚线连着。
  // 地上的点拖动改水平位置，空中的点拖动改高度。
  function fatLine(width: number, order: number, color?: string) {
    const line = new Line2(new LineGeometry(), new LineMaterial({ color: color ?? "#ffffff", linewidth: width, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    line.renderOrder = order; line.visible = false; line.frustumCulled = false;
    return line;
  }
  const upperBorder = fatLine(5, 33), upper = fatLine(3, 34);
  const floorBorder = fatLine(5, 31), floorLine = fatLine(3, 32);
  let upperSource: unknown, floorSource: unknown;
  function setLine(pair: [Line2, Line2], points: readonly { x: number; y: number; z: number }[] | undefined, source: unknown, previous: unknown) {
    const [border, line] = pair;
    border.visible = line.visible = !!points && points.length > 1;
    if (!points || points.length < 2 || source === previous) return;
    const geometry = new LineGeometry();
    geometry.setPositions(points.flatMap(point => [point.x, point.y, point.z]));
    line.geometry.dispose();
    line.geometry = border.geometry = geometry;
  }
  const floorHandles: Group[] = [];
  function floorHandleAt(index: number) {
    let handle = floorHandles[index];
    if (!handle) {
      handle = new Group();
      const outer = new Mesh(handleOuter, handleWhite), inner = new Mesh(handleInner, handleFill);
      outer.renderOrder = 36; inner.renderOrder = 37; inner.position.z = 0.001;
      handle.add(outer, inner);
      floorHandles[index] = handle;
      root.add(handle);
    }
    return handle;
  }
  function handleAt(index: number) {
    let handle = handles[index];
    if (!handle) {
      handle = new Group();
      const outer = new Mesh(handleOuter, handleWhite), inner = new Mesh(handleInner, handleFill);
      outer.renderOrder = 38; inner.renderOrder = 39; inner.position.z = 0.001;
      handle.add(outer, inner);
      handles[index] = handle;
      root.add(handle);
    }
    return handle;
  }
  root.add(path, shadow, arrow, ring, stem, aimMark, drops, upperBorder, upper, floorBorder, floorLine);
  let pathSource: CameraTake | readonly unknown[] | undefined;
  let pathId = "";
  let ringOwner = "";
  const matrix = new Matrix4();
  const eye = new Vector3(), focus = new Vector3(), direction = new Vector3(), upVector = new Vector3();
  const color = new Color(), white = new Color("#ffffff"), grey = new Color("#7d848d");

  function removeEntry(entry: CameraEntry) {
    root.remove(entry.pivot);
    entry.body.dispose(); entry.frustum.geometry.dispose(); entry.frustum.material.dispose();
  }
  function sync(values: readonly SceneCamera[]) {
    const ids = new Set(values.map(value => value.id));
    for (const [id, entry] of entries) if (!ids.has(id)) { removeEntry(entry); entries.delete(id); }
    for (const value of values) {
      const entry = entries.get(value.id);
      if (entry) { entry.value = value; continue; }
      // 机位颜色与时间轴上的机位轨道、取景窗边框一致。
      const base = new Color(performanceColor("camera:" + value.id));
      const pivot = new Group();
      const icon = new Group();
      icon.userData.sceneCameraId = value.id;
      const body = new MeshBasicMaterial({ color: base, transparent: true, toneMapped: false, fog: false });
      const lens = new Mesh(lensGeometry, lensMaterial);
      lens.position.z = -0.25;
      icon.add(new Mesh(bodyGeometry, body), lens);
      const frustum = new LineSegments(new BufferGeometry(), new LineBasicMaterial({ color: base, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
      frustum.geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(frustumSegments * 6), 3));
      frustum.frustumCulled = false;
      pivot.add(icon, frustum);
      root.add(pivot);
      entries.set(value.id, { value, base, pivot, icon, body, frustum, shape: "" });
    }
    if (pathId && !ids.has(pathId)) { pathSource = undefined; pathId = ""; path.visible = arrow.visible = false; }
    if (ringOwner && !ids.has(ringOwner)) { ringOwner = ""; ring.visible = stem.visible = false; }
  }
  function shapeFrustum(entry: CameraEntry, fov: number, depth: number) {
    const key = fov.toFixed(3) + "/" + depth.toFixed(3) + "/" + filmAspect.toFixed(3);
    if (entry.shape === key) return;
    entry.shape = key;
    const h = Math.tan(MathUtils.degToRad(fov) / 2) * depth, w = h * filmAspect, z = -depth;
    const corners = [[-w, -h], [w, -h], [w, h], [-w, h]] as const;
    const values: number[] = [];
    for (const [x, y] of corners) values.push(0, 0, 0, x, y, z);
    corners.forEach(([x, y], index) => { const [nx, ny] = corners[(index + 1) % 4]!; values.push(x, y, z, nx, ny, z); });
    const base = h * 1.12, tip = h * 1.5, half = w * 0.22;
    values.push(-half, base, z, 0, tip, z, 0, tip, z, half, base, z, half, base, z, -half, base, z);
    const position = entry.frustum.geometry.getAttribute("position") as Float32BufferAttribute;
    position.set(values);
    position.needsUpdate = true;
  }
  function updatePath(entry: CameraEntry | undefined, edited: EditedCameraPath | undefined, viewer: Vector3) {
    // 正在划线时画划出来的线；否则画选中镜头段的运镜轨迹（有轨迹或推拉才有）。
    const draft = edited?.draft && edited.draft.length > 1 ? edited.draft : undefined;
    const take = draft ? undefined : edited?.take;
    if (!entry || !draft && !take?.path) { path.visible = arrow.visible = false; pathSource = undefined; pathId = ""; return; }
    const source = draft ?? take!;
    if (pathSource !== source || pathId !== entry.value.id) {
      pathSource = source; pathId = entry.value.id;
      const count = draft ? Math.min(draft.length, pathPoints.count) - 1 : pathSegments;
      let distance = 0;
      for (let index = 0; index <= count; index++) {
        const point = draft ? draft[index]! : sampleCameraTake({ ...take!, easing: "linear" }, index / count).position;
        eye.set(point.x, point.y, point.z);
        if (index) distance += eye.distanceTo(focus.fromBufferAttribute(pathPoints, index - 1));
        pathPoints.setXYZ(index, eye.x, eye.y, eye.z);
        pathDistances.setX(index, distance);
      }
      path.geometry.setDrawRange(0, count + 1);
      pathPoints.needsUpdate = true; pathDistances.needsUpdate = true;
      arrow.position.fromBufferAttribute(pathPoints, count);
      direction.subVectors(arrow.position, focus.fromBufferAttribute(pathPoints, Math.max(0, count - 1)));
      arrow.userData.moving = distance > 0.02 && direction.lengthSq() > 1e-10;
      if (arrow.userData.moving) arrow.quaternion.setFromUnitVectors(worldUp, direction.normalize());
    }
    path.visible = true;
    arrow.visible = arrow.userData.moving === true;
    path.material.color.copy(entry.base);
    arrow.material.color.copy(entry.base);
    arrow.scale.setScalar(MathUtils.clamp(viewer.distanceTo(arrow.position) * 0.026, 0.6, 2.5));
  }
  function updateRing(entry: CameraEntry | undefined, edited: EditedCameraPath | undefined, viewer: Vector3) {
    const point = edited?.ring;
    if (!entry || !point) { ring.visible = stem.visible = false; ringOwner = ""; return; }
    ringOwner = entry.value.id;
    ring.position.set(point.x, point.y + 0.03, point.z);
    ring.scale.setScalar(MathUtils.clamp(viewer.distanceTo(ring.position) * 0.05, 0.6, 4));
    ring.material.color.copy(entry.base).lerp(white, 0.2);
    ring.visible = true;
    // 机位到圈之间的竖直虚线，看得出圈属于哪台机位。
    const position = stemGeometry.getAttribute("position") as Float32BufferAttribute;
    position.setXYZ(0, entry.pivot.position.x, entry.pivot.position.y, entry.pivot.position.z);
    position.setXYZ(1, point.x, point.y + 0.03, point.z);
    position.needsUpdate = true;
    stem.computeLineDistances();
    stem.material.color.copy(entry.base);
    stem.visible = entry.pivot.visible;
  }
  /** 把每台机位标记摆到它此刻的画面；editingId是正在编辑的机位。 */
  /** active：这台机位此刻在不在自己的镜头段里，不在就不在场景里出现。 */
  function update(poseOf: (camera: SceneCamera) => CameraFraming, editingId: string | null, viewer: Vector3, edited?: EditedCameraPath, active: (camera: SceneCamera) => boolean = () => true) {
    for (const [id, entry] of entries) {
      const pose = poseOf(entry.value);
      eye.set(pose.position.x, pose.position.y, pose.position.z);
      focus.set(pose.target.x, pose.target.y, pose.target.z);
      // ACT: 刚从主视角添加的机位就在观察者眼前，标记会糊满整个主画面；离观察者不足1.5米时先隐藏，走开后自然出现。
      entry.pivot.visible = viewer.distanceTo(eye) > 1.5 && active(entry.value);
      entry.pivot.position.copy(eye);
      const up = (pose as CameraPose).up;
      entry.pivot.quaternion.setFromRotationMatrix(matrix.lookAt(eye, focus, up ? upVector.set(up.x, up.y, up.z) : worldUp));
      if (!up && pose.roll) entry.pivot.rotateZ(-MathUtils.degToRad(pose.roll));
      shapeFrustum(entry, getCameraFov(pose.focalLength, filmAspect), MathUtils.clamp(eye.distanceTo(focus), 0.6, 12));
      const editing = id === editingId, disabled = entry.value.enabled === false && !editing;
      color.copy(entry.base);
      if (editing) color.lerp(white, 0.18);
      else if (disabled) color.lerp(grey, 0.65);
      entry.body.color.copy(color);
      entry.body.opacity = disabled ? 0.5 : 1;
      entry.frustum.material.color.copy(color);
      entry.frustum.material.opacity = editing ? 0.95 : disabled ? 0.16 : 0.42;
      entry.icon.scale.setScalar(MathUtils.clamp(viewer.distanceTo(eye) * 0.026, 0.6, 2.5) * (editing ? 1.2 : 1));
    }
    const entry = editingId ? entries.get(editingId) : undefined;
    updatePath(entry, edited, viewer);
    updateRing(entry, edited, viewer);
    // drop：贴地划线时轨迹离手画那条线的高度差，影子落在鼠标下；平时用机位脚下的圈对齐地面。
    aimMark.visible = !!entry && !!edited?.aim;
    if (aimMark.visible) {
      aimMark.position.set(edited!.aim!.x, edited!.aim!.y, edited!.aim!.z);
      aimMark.lookAt(viewer);
      aimMark.scale.setScalar(MathUtils.clamp(viewer.distanceTo(aimMark.position) * 0.05, 0.5, 6));
      aimMark.material.color.copy(entry!.base).lerp(white, 0.25);
    }
    const anchors = entry ? edited?.anchors : undefined;
    if (entry) handleFill.color.copy(entry.base);
    for (let index = 0; index < Math.max(handles.length, anchors?.length ?? 0); index++) {
      const point = anchors?.[index];
      if (!point || index >= 48) { if (handles[index]) handles[index]!.visible = false; continue; }
      const handle = handleAt(index);
      handle.visible = true;
      handle.position.set(point.x, point.y, point.z);
      handle.lookAt(viewer);
      handle.scale.setScalar(MathUtils.clamp(viewer.distanceTo(handle.position) * 0.06, 0.4, 8) * (index === edited?.activeAnchor ? 1.35 : 1));
    }
    // 落地虚线与升降把手。
    const grounds = edited?.anchorGrounds;
    drops.visible = !!anchors && !!grounds;
    if (drops.visible) {
      const position = dropGeometry.getAttribute("position") as Float32BufferAttribute;
      const count = Math.min(48, anchors!.length);
      for (let index = 0; index < count; index++) { const point = anchors![index]!; position.setXYZ(index * 2, point.x, point.y, point.z); position.setXYZ(index * 2 + 1, point.x, grounds![index] ?? point.y, point.z); }
      position.needsUpdate = true;
      dropGeometry.setDrawRange(0, count * 2);
      drops.computeLineDistances();
      drops.material.color.copy(entry!.base);
    }
    for (let index = 0; index < Math.max(floorHandles.length, anchors?.length ?? 0); index++) {
      const point = anchors?.[index], groundY = grounds?.[index];
      if (!point || groundY === undefined || index >= 48) { if (floorHandles[index]) floorHandles[index]!.visible = false; continue; }
      const handle = floorHandleAt(index);
      handle.visible = true;
      handle.position.set(point.x, groundY + 0.03, point.z);
      handle.lookAt(viewer);
      handle.scale.setScalar(MathUtils.clamp(viewer.distanceTo(handle.position) * 0.06, 0.4, 8) * (index === edited?.activeAnchor ? 1.5 : 1.15));
    }
    // 有锚点时用粗线画空中的线（划线中或拖动中画预览）和地上的投影，细虚线的旧画法收起。
    const upperPoints = anchors ? edited?.draft ?? (edited?.take?.path ? Array.from({ length: 121 }, (_, index) => sampleCameraTake({ ...edited.take!, easing: "linear" }, index / 120).position) : undefined) : undefined;
    setLine([upperBorder, upper], upperPoints, edited?.draft ?? edited?.take, upperSource); upperSource = edited?.draft ?? edited?.take;
    setLine([floorBorder, floorLine], anchors ? edited?.floor : undefined, edited?.floor, floorSource); floorSource = edited?.floor;
    if (entry) { upper.material.color.copy(entry.base); floorLine.material.color.copy(entry.base); }
    if (upper.visible) path.visible = false;
    shadow.visible = path.visible && edited?.drop !== undefined;
    if (shadow.visible) { shadow.position.y = edited?.drop !== undefined ? -edited.drop : ring.position.y - entry!.pivot.position.y; shadow.material.color.copy(entry!.base); }
    root.updateMatrixWorld(true);
  }
  /** 点中的机位标记；ring为true表示点中的是脚下用来划线的圈。 */
  function pick(raycaster: Raycaster): { id: string; distance: number; point: Vector3; ring?: boolean } | undefined {
    if (!root.visible) return undefined;
    if (ringOwner && ring.visible) {
      const hit = raycaster.intersectObject(ring, false)[0];
      if (hit) return { id: ringOwner, distance: hit.distance, point: hit.point, ring: true };
    }
    const hit = raycaster.intersectObjects([...entries.values()].filter(entry => entry.pivot.visible).map(entry => entry.icon), true)[0];
    if (!hit) return undefined;
    let node = hit.object;
    while (node.parent && !node.userData.sceneCameraId) node = node.parent;
    return { id: node.userData.sceneCameraId as string, distance: hit.distance, point: hit.point };
  }
  function dispose() {
    for (const entry of entries.values()) removeEntry(entry);
    entries.clear(); root.clear(); root.removeFromParent();
    bodyGeometry.dispose(); lensGeometry.dispose(); lensMaterial.dispose();
    path.geometry.dispose(); path.material.dispose(); shadow.material.dispose(); aimGeometry.dispose(); aimMark.material.dispose(); handleOuter.dispose(); handleInner.dispose(); dropGeometry.dispose(); drops.material.dispose(); for (const line of [upperBorder, upper, floorBorder, floorLine]) line.material.dispose(); upper.geometry.dispose(); floorLine.geometry.dispose(); floorHandles.length = 0; handleWhite.dispose(); handleFill.dispose(); handles.length = 0; arrowGeometry.dispose(); arrow.material.dispose();
    ringGeometry.dispose(); ring.material.dispose(); stemGeometry.dispose(); stem.material.dispose();
    pathSource = undefined;
  }
  return { root, sync, update, pick, dispose };
}

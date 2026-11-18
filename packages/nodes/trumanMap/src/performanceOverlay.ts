import { CircleGeometry, Color, DoubleSide, DynamicDrawUsage, Group, InstancedMesh, Matrix4, MeshBasicMaterial, RingGeometry, Vector3 } from "three";
import type { Camera, InstancedBufferAttribute, InterleavedBufferAttribute, Scene } from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import type { PerformancePoint, PerformanceTrack } from "./performanceDocument";
import type { SceneObject, Vector3Value } from "./sceneDocument";

export type PerformanceLabel = { key: string; trackId: string; pointIndex?: number; x: number; y: number; text: string; color: string; event?: boolean; warning?: boolean };
/** 导航算出的一腿：走到 target 这个路径点的实际折线。 */
export type WalkLeg = { target: PerformancePoint; path: PerformancePoint[] };
/** 按显示路径点分段的实际走法：segments[i] 是第 i 点走到第 i+1 点的折线，sites[i] 是第 i 点实际站的位置，blocked 是走不到的第一个点。 */
export type RouteWalk = { segments: (PerformancePoint[] | undefined)[]; sites: (PerformancePoint | undefined)[]; blocked?: number };

// ACT: 播放用的路线（片段式会展开成含停留重复点的逐点路线）和场景里显示的路径点不一定一一对应，按坐标顺序对齐每一腿。
export function matchWalkSegments(points: readonly PerformancePoint[], legs: readonly WalkLeg[], blocked: boolean): RouteWalk {
  const segments: (PerformancePoint[] | undefined)[] = Array.from({ length: Math.max(0, points.length - 1) }, () => undefined);
  const sites: (PerformancePoint | undefined)[] = Array.from({ length: points.length }, () => undefined);
  const near = (a: PerformancePoint, b: PerformancePoint) => Math.abs(a[0] - b[0]) < 0.06 && Math.abs(a[1] - b[1]) < 0.06 && Math.abs(a[2] - b[2]) < 0.06;
  let cursor = 0;
  let unreachable: number | undefined;
  for (const [index, leg] of legs.entries()) {
    let match = -1;
    for (let next = cursor; next < points.length; next++) if (near(points[next]!, leg.target)) { match = next; break; }
    if (blocked && index === legs.length - 1) { unreachable = match >= 0 ? match : Math.min(points.length - 1, cursor + 1); break; }
    if (match < 0) continue;
    if (match > cursor && leg.path.length >= 2) segments[match - 1] = leg.path.map(point => [point[0], point[1], point[2]]);
    if (leg.path.length) sites[match] = [...leg.path.at(-1)!];
    cursor = match;
  }
  if (!sites[0] && segments[0]) sites[0] = [...segments[0][0]!];
  return unreachable === undefined ? { segments, sites } : { segments, sites, blocked: unreachable };
}
type OverlayOptions = {
  scene: Scene; camera: Camera; canvas: HTMLCanvasElement;
  /** track：正在拖的那条动线（飞檐走壁的人点到哪个顶面落到哪）。 */
  pointAt: (x: number, y: number, track?: PerformanceTrack) => Vector3Value | null;
  onSelect: (id: string, index?: number) => void;
  onMove: (id: string, index: number, point: Vector3Value) => void;
  onDrawPoint: (point: Vector3Value) => void;
  onLabels: (labels: PerformanceLabel[]) => void;
  onAnchor?: (anchor: { x: number; y: number } | null) => void;
  onContinueRoute?: (trackId: string, event: PointerEvent) => void;
  // 拖路线中间就在那里加一个点（segment是第几段），双击路径点删掉它。
  onInsert?: (id: string, segment: number, point: Vector3Value) => void;
  onRemove?: (id: string, index: number) => void;
  invalidate: () => void;
};
type Route = {
  track: PerformanceTrack; name: string; color: string; line: LineSegments2; border: LineSegments2; blocked: LineSegments2; walk?: RouteWalk;
  actorPosition: Vector3; actorLabel?: PerformanceLabel;
  eventPoints: Set<number>; eventsDirty: boolean; events: (PerformanceLabel | undefined)[];
};
// 命中“接着画”小点时的点序号。
const extendIndex = -1;
const routeColors = ["#c9685b", "#518f5c", "#487fbc", "#a88737", "#9269af", "#398d89"];
const blockedColor = "#d4473d";
const lift = 0.04;
export function performanceColor(id: string) {
  let hash = 0;
  for (let index = 0; index < id.length; index++) hash = (Math.imul(hash, 31) + id.charCodeAt(index)) | 0;
  return routeColors[(hash >>> 0) % routeColors.length]!;
}

export function createPerformanceOverlay(options: OverlayOptions) {
  const root = new Group();
  root.name = "performanceOverlay";
  root.visible = false;
  options.scene.add(root);
  const ring = new RingGeometry(0.7, 1, 32);
  const dot = new CircleGeometry(0.56, 24);
  ring.rotateX(-Math.PI / 2);
  dot.rotateX(-Math.PI / 2);
  // ACT: 锚点材质保持透明通道并按 renderOrder 排在路线之上，否则透明路线会盖住不透明锚点。
  const white = new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 1, depthTest: false, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false });
  const colorMaterial = new MeshBasicMaterial({ transparent: true, opacity: 1, depthTest: false, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false });
  const outlines = new InstancedMesh(ring, white, 1024);
  const centers = new InstancedMesh(dot, colorMaterial, 1024);
  // 两层标记一一对应，位置与缩放共用同一实例属性。
  centers.instanceMatrix = outlines.instanceMatrix;
  centers.setColorAt(0, new Color());
  centers.instanceColor!.setUsage(DynamicDrawUsage);
  for (const mesh of [outlines, centers]) { mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(DynamicDrawUsage); root.add(mesh); }
  outlines.renderOrder = 21;
  centers.renderOrder = 22;
  const markerMatrix = new Matrix4();
  const markerColor = new Color();
  const markerPosition = new Vector3();
  const visiblePoints: { route: Route; index: number; x: number; y: number }[] = [];
  const visibleColors: string[] = [];
  const projected = new Vector3();
  const cameraPosition = new Vector3();
  const viewProjection = new Matrix4();
  const previousProjection = new Matrix4();
  let previousWidth = -1;
  let previousHeight = -1;
  let layoutDirty = true;
  let visibleRoutes: Route[] = [];
  let selected: Route | undefined;
  let routes: Route[] = [];
  let enabled = false;
  let selectedId = "";
  let selectedPoint: number | undefined;
  let signature = "";
  let walks: ReadonlyMap<string, RouteWalk> = new Map();
  let walkSignature = "";
  let publishedLabels: PerformanceLabel[] = [];
  let publishedAnchor: { x: number; y: number } | null = null;
  const frameLabels: PerformanceLabel[] = [];
  let drag: { pointer: number; route: Route; index: number; original: PerformancePoint; x: number; y: number; moved: boolean; insert?: { segment: number; snapshot: PerformanceTrack } } | undefined;
  let lastTap: { trackId: string; index: number; time: number } | undefined;
  let draft: Route | undefined;
  let drawPointer: { pointer: number; x: number; y: number } | undefined;
  let continuePointer: { pointer: number; x: number; y: number; trackId: string; index: number; route: Route } | undefined;

  function project(x: number, y: number, z: number) {
    projected.set(x, y, z).applyMatrix4(viewProjection);
    if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1.1 || Math.abs(projected.y) > 1.1) return undefined;
    return projected.set(Math.round((projected.x + 1) * previousWidth / 2), Math.round((1 - projected.y) * previousHeight / 2), 0);
  }
  // 导航算好的实际走法只在路线没被拖改时有效；拖点、画线时按两点直连预览。
  function walkOf(route: Route) { return route !== draft && drag?.route !== route ? route.walk : undefined; }
  /** 第index段从第几段起走不到（之后都画红色虚线）。 */
  function blockedFrom(route: Route) { const blocked = walkOf(route)?.blocked; return blocked === undefined ? Infinity : blocked - 1; }
  /** 第index段在场景里的折线：走得到时是实际走法（上楼梯、绕栏杆），否则两点直连；瞬移段为空。 */
  function segmentPath(route: Route, points: readonly PerformancePoint[], index: number): PerformancePoint[] {
    if (route.track.teleports?.includes(index)) return [];
    return (index < blockedFrom(route) ? walkOf(route)?.segments[index] : undefined) ?? [points[index]!, points[index + 1]!];
  }
  /** 路径点在场景里显示的位置：实际站的位置（贴在楼板、踏步上），没有就是记录的位置。 */
  function shownPoint(route: Route, index: number): PerformancePoint { return walkOf(route)?.sites[index] ?? route.track.points[index]!; }
  // ACT: 拖点仅改共享交错缓冲，避免每帧setPositions遗留旧GPU属性；线段数改变才整体释放几何。
  function writeLines(lines: LineSegments2[], pieces: PerformancePoint[][], dashed: boolean) {
    const values: number[] = [];
    for (const piece of pieces) for (let index = 1; index < piece.length; index++) {
      const from = piece[index - 1]!, to = piece[index]!;
      values.push(from[0], from[1] + lift, from[2], to[0], to[1] + lift, to[2]);
    }
    const count = values.length / 6;
    let geometry = lines[0]!.geometry;
    const start = geometry.getAttribute("instanceStart") as InterleavedBufferAttribute | undefined;
    if (count && start?.count === count) {
      (start.data.array as Float32Array).set(values);
      start.data.needsUpdate = true;
    } else {
      geometry.dispose();
      geometry = new LineSegmentsGeometry();
      if (count) {
        geometry.setPositions(values);
        (geometry.getAttribute("instanceStart") as InterleavedBufferAttribute).data.setUsage(DynamicDrawUsage);
      }
      for (const line of lines) line.geometry = geometry;
    }
    if (count) {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      if (dashed) lines[0]!.computeLineDistances();
    }
    return count;
  }
  function refreshRoute(route: Route, preview?: PerformancePoint) {
    const points = preview ? [...route.track.points, preview] : route.track.points;
    const from = preview ? Infinity : blockedFrom(route);
    const reachable: PerformancePoint[][] = [], unreachable: PerformancePoint[][] = [];
    // ACT: 瞬移段不画连线，场景里显示为间断的动线。
    for (let index = 0; index + 1 < points.length; index++) (index >= from ? unreachable : reachable).push(segmentPath(route, points, index));
    const shown = route === draft || route.track.objectId !== draft?.track.objectId;
    route.line.visible = route.border.visible = writeLines([route.line, route.border], reachable, false) > 0 && shown;
    route.blocked.visible = writeLines([route.blocked], unreachable, true) > 0 && shown;
  }
  function createRoute(track: PerformanceTrack, name: string) {
    const color = performanceColor(track.id);
    const geometry = new LineSegmentsGeometry();
    const line = new LineSegments2(geometry, new LineMaterial({ color, linewidth: 2.5, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    const border = new LineSegments2(geometry, new LineMaterial({ color: "#ffffff", linewidth: 5, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    // 走不到的段：红色虚线。
    const blocked = new LineSegments2(new LineSegmentsGeometry(), new LineMaterial({ color: blockedColor, linewidth: 2.5, dashed: true, dashSize: 0.28, gapSize: 0.2, transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false }));
    border.renderOrder = 19;
    line.renderOrder = 20;
    blocked.renderOrder = 20;
    root.add(border, line, blocked);
    const route: Route = { track: structuredClone(track), name, color, line, border, blocked, walk: walks.get(track.id), actorPosition: new Vector3(NaN, NaN, NaN), eventPoints: new Set(track.events?.map(event => event.at)), eventsDirty: true, events: [] };
    refreshRoute(route);
    return route;
  }
  function removeRoute(route: Route) {
    route.line.geometry.dispose(); route.line.material.dispose(); route.border.material.dispose(); route.blocked.geometry.dispose(); route.blocked.material.dispose(); root.remove(route.line, route.border, route.blocked);
  }
  function setDraft(track: PerformanceTrack | null) {
    if (!track && !draft && !drawPointer) return;
    layoutDirty = true;
    if (!track) {
      if (draft) removeRoute(draft);
      draft = undefined;
      if (drawPointer) release(drawPointer.pointer);
      drawPointer = undefined;
    } else if (draft?.track.id === track.id) {
      draft.track = structuredClone(track);
      draft.eventPoints = new Set(track.events?.map(event => event.at));
      refreshRoute(draft);
    } else {
      if (draft) removeRoute(draft);
      cancel();
      draft = createRoute(track, "起点");
    }
    for (const route of routes) refreshRoute(route);
    options.invalidate();
  }
  function sync(tracks: PerformanceTrack[], objects: SceneObject[] = []) {
    const names = new Map(objects.map(object => [object.id, object.name]));
    const next = JSON.stringify([tracks, tracks.map(track => names.get(track.objectId))]);
    if (next === signature) return;
    cancel();
    layoutDirty = true;
    signature = next;
    for (const route of routes) removeRoute(route);
    routes = tracks.map(source => createRoute(source, source.name ?? names.get(source.objectId) ?? "场景物体"));
    options.invalidate();
  }
  // ACT: 宿主按导航算好每条动线的实际走法后交进来；和路线内容分开比对，算好前后都不重建路线。
  function setWalks(next: ReadonlyMap<string, RouteWalk>) {
    const value = JSON.stringify([...next]);
    if (value === walkSignature) return;
    walkSignature = value;
    walks = next;
    for (const route of routes) {
      route.walk = next.get(route.track.id);
      route.eventsDirty = true;
      refreshRoute(route);
    }
    layoutDirty = true;
    options.invalidate();
  }
  function publish(labels: PerformanceLabel[]) {
    if (labels.length === publishedLabels.length && labels.every((label, index) => label === publishedLabels[index])) return;
    publishedLabels = labels.slice();
    options.onLabels(publishedLabels);
  }
  function publishAnchor(anchor: { x: number; y: number } | null) {
    const previous = publishedAnchor;
    if (previous === anchor) return;
    if (previous && anchor && Math.abs(previous.x - anchor.x) < 0.5 && Math.abs(previous.y - anchor.y) < 0.5) return;
    publishedAnchor = anchor;
    options.onAnchor?.(anchor);
  }
  function markRange(attribute: InstancedBufferAttribute, first: number, last: number) {
    if (first > last) return;
    attribute.addUpdateRange(first * attribute.itemSize, (last - first + 1) * attribute.itemSize);
    attribute.needsUpdate = true;
  }
  function updateLayout(rect: DOMRect) {
    options.camera.getWorldPosition(cameraPosition);
    viewProjection.multiplyMatrices(options.camera.projectionMatrix, options.camera.matrixWorldInverse);
    // 拾取坐标相对画布；滚动只改变 rect.left/top，指针事件在命中前换算。
    if (!layoutDirty && previousWidth === rect.width && previousHeight === rect.height && previousProjection.equals(viewProjection)) return;
    if (layoutDirty) {
      selected = draft ?? routes.find(route => route.track.id === selectedId);
      // ACT: 素材动线只在选中该主体或正在画线时显示，不再把所有路线同时铺在场景里。
      visibleRoutes = selected ? [selected] : [];
    }
    layoutDirty = false;
    previousWidth = rect.width;
    previousHeight = rect.height;
    previousProjection.copy(viewProjection);
    const perspective = "fov" in options.camera ? Math.tan(Number(options.camera.fov) * Math.PI / 360) / Math.max(1, rect.height / 2) : 0;
    let count = 0, firstMatrix = Infinity, lastMatrix = -1, firstColor = Infinity, lastColor = -1;
    for (const route of visibleRoutes) {
      const active = route === selected;
      route.actorPosition.x = NaN;
      route.eventsDirty = true;
      route.line.material.opacity = route.track.enabled === false ? 0.3 : active || !selectedId ? 1 : 0.65;
      route.border.material.opacity = route.track.enabled === false ? 0.3 : active || !selectedId ? 0.95 : 0.65;
      route.line.material.linewidth = active ? 3 : 2.5;
      route.border.material.linewidth = active ? 6 : 5;
      const color = route.track.enabled === false ? "#8d9399" : route.color;
      const unreachable = walkOf(route)?.blocked;
      route.track.points.forEach((_, index) => {
        if (count >= 1024 || !active && selectedId && index !== 0 && !route.eventPoints.has(index)) return;
        const point = shownPoint(route, index);
        const screen = project(...point);
        if (!screen) return;
        markerPosition.set(point[0], point[1] + 0.06, point[2]);
        const radius = perspective ? perspective * cameraPosition.distanceTo(markerPosition) : 0.02;
        const scale = Math.fround(Math.max(0.025, radius * (active && selectedPoint === index ? 16 : 12)));
        const array = outlines.instanceMatrix.array;
        const offset = count * 16;
        if (array[offset] !== scale || array[offset + 12] !== Math.fround(markerPosition.x) || array[offset + 13] !== Math.fround(markerPosition.y) || array[offset + 14] !== Math.fround(markerPosition.z)) {
          outlines.setMatrixAt(count, markerMatrix.makeScale(scale, scale, scale).setPosition(markerPosition));
          firstMatrix = Math.min(firstMatrix, count);
          lastMatrix = count;
        }
        const tone = index === unreachable ? blockedColor : color;
        if (visibleColors[count] !== tone) {
          centers.setColorAt(count, markerColor.set(tone));
          visibleColors[count] = tone;
          firstColor = Math.min(firstColor, count);
          lastColor = count;
        }
        const hit = visiblePoints[count] ??= { route, index, x: 0, y: 0 };
        hit.route = route; hit.index = index; hit.x = screen.x; hit.y = screen.y;
        count++;
      });
      const points = route.track.points;
      if (active && route !== draft && options.onContinueRoute && route.track.enabled !== false && points.length >= 2 && count < 1024) {
        const last = shownPoint(route, points.length - 1);
        let previous = points.at(-2)!;
        for (let cursor = points.length - 2; cursor >= 0 && Math.hypot(last[0] - previous[0], last[2] - previous[2]) < 0.01; cursor--) previous = points[cursor]!;
        const length = Math.hypot(last[0] - previous[0], last[2] - previous[2]);
        const dx = length > 0.01 ? (last[0] - previous[0]) / length : 1, dz = length > 0.01 ? (last[2] - previous[2]) / length : 0;
        markerPosition.set(last[0], last[1] + 0.06, last[2]);
        const radius = perspective ? perspective * cameraPosition.distanceTo(markerPosition) : 0.02;
        const end = project(last[0], last[1] + 0.06, last[2]);
        const endY = end?.y ?? 0;
        // 终点正上方是事件标签：小点不放在终点上方。沿路线方向朝屏幕上方时，改放到屏幕上更低的那一侧。
        let best: { x: number; z: number; y: number } | undefined;
        for (const [ox, oz] of [[dx, dz], [dz, -dx], [-dz, dx]] as const) {
          const x = last[0] + ox * radius * 36, z = last[2] + oz * radius * 36;
          const value = project(x, last[1] + 0.06, z);
          if (!value) continue;
          if (!end || value.y >= endY - 6) { best = { x, z, y: value.y }; break; }
          if (!best || value.y > best.y) best = { x, z, y: value.y };
        }
        let screen: Vector3 | undefined;
        if (best) { markerPosition.set(best.x, last[1] + 0.06, best.z); screen = project(markerPosition.x, markerPosition.y, markerPosition.z); }
        if (screen) {
          const scale = Math.fround(Math.max(0.02, radius * 9));
          outlines.setMatrixAt(count, markerMatrix.makeScale(scale, scale, scale).setPosition(markerPosition));
          firstMatrix = Math.min(firstMatrix, count);
          lastMatrix = count;
          const tint = "#" + markerColor.set(color).lerp(white.color, 0.4).getHexString();
          if (visibleColors[count] !== tint) {
            centers.setColorAt(count, markerColor.set(tint));
            visibleColors[count] = tint;
            firstColor = Math.min(firstColor, count);
            lastColor = count;
          }
          const hit = visiblePoints[count] ??= { route, index: extendIndex, x: 0, y: 0 };
          hit.route = route; hit.index = extendIndex; hit.x = screen.x; hit.y = screen.y;
          count++;
        }
      }
    }
    visiblePoints.length = outlines.count = centers.count = count;
    markRange(outlines.instanceMatrix, firstMatrix, lastMatrix);
    markRange(centers.instanceColor!, firstColor, lastColor);
  }
  function updateEventLabels(route: Route) {
    route.eventsDirty = false;
    route.events.length = route.track.events?.length ?? 0;
    for (const [index, event] of (route.track.events ?? []).entries()) {
      const point = route.track.points[event.at] && shownPoint(route, event.at);
      const location = point && project(point[0], point[1] + 0.3, point[2]);
      if (!location) { route.events[index] = undefined; continue; }
      const old = route.events[index];
      const text = `${index + 1} ${event.text}`;
      if (old?.x === location.x && old.y === location.y && old.text === text && old.pointIndex === event.at) continue;
      route.events[index] = { key: route.track.id + ":" + event.at, trackId: route.track.id, pointIndex: event.at, x: location.x, y: location.y, text, color: route.color, event: true };
    }
  }
  function update(positions?: ReadonlyMap<string, Vector3Value>) {
    if (!enabled) return;
    updateLayout(options.canvas.getBoundingClientRect());
    const anchorPoint = selected && selectedPoint !== undefined && selected.track.points[selectedPoint] ? shownPoint(selected, selectedPoint) : undefined;
    const anchorScreen = anchorPoint ? project(anchorPoint[0], anchorPoint[1] + 0.06, anchorPoint[2]) : undefined;
    publishAnchor(anchorScreen ? { x: anchorScreen.x, y: anchorScreen.y } : null);
    frameLabels.length = 0;
    for (const route of visibleRoutes) {
      if (frameLabels.length >= 96) break;
      const first = route.track.points[0]!;
      const actor = route === draft ? undefined : positions?.get(route.track.id);
      const x = actor?.x ?? first[0], y = actor?.y ?? first[1], z = actor?.z ?? first[2];
      const previous = route.actorPosition;
      if (previous.x !== x || previous.y !== y || previous.z !== z) {
        previous.set(x, y, z);
        const location = project(x, y + (route === draft ? 0.2 : 1.8), z);
        const old = route.actorLabel;
        const text = route === draft && route.track.points.length < 3 ? "起点" : route.name;
        if (!location) route.actorLabel = undefined;
        else if (old?.x !== location.x || old.y !== location.y || old.text !== text) route.actorLabel = { key: route.track.id, trackId: route.track.id, x: location.x, y: location.y, text, color: route.color };
      }
      if (route.actorLabel) frameLabels.push(route.actorLabel);
      if (route !== selected && selectedId || frameLabels.length >= 96) continue;
      if (route.eventsDirty) updateEventLabels(route);
      for (const label of route.events) {
        if (frameLabels.length >= 96) break;
        if (label) frameLabels.push(label);
      }
      // 走不到的点：在点下方挂一个红色提示。
      const unreachable = walkOf(route)?.blocked;
      const blockedPoint = unreachable === undefined ? undefined : route.track.points[unreachable];
      const blockedScreen = blockedPoint && project(blockedPoint[0], blockedPoint[1], blockedPoint[2]);
      if (blockedScreen && frameLabels.length < 96) frameLabels.push({ key: route.track.id + ":blocked", trackId: route.track.id, pointIndex: unreachable, x: blockedScreen.x, y: blockedScreen.y, text: route.track.parkour ? "跳不过去" : "走不到这里", color: blockedColor, event: true, warning: true });
    }
    publish(frameLabels);
  }
  function setEditing(value: boolean, id: string, index?: number) {
    if (!value || drag && drag.route.track.id !== id) cancel();
    layoutDirty ||= enabled !== value || selectedId !== id || selectedPoint !== index;
    enabled = value;
    selectedId = id;
    selectedPoint = index;
    root.visible = value;
    if (!value) publish([]);
    if (!value) publishAnchor(null);
    options.invalidate();
  }
  function hitPoint(event: PointerEvent, rect: DOMRect) {
    let found: { route: Route; index: number } | undefined;
    let distance = 18 ** 2;
    for (const point of visiblePoints) {
      const next = (point.x + rect.left - event.clientX) ** 2 + (point.y + rect.top - event.clientY) ** 2;
      if (point.index === extendIndex ? next <= 12 ** 2 : next <= distance) { distance = point.index === extendIndex ? -1 : next; found = { route: point.route, index: point.index }; }
    }
    return found;
  }
  /** 屏幕上离折线最近的位置：gap是像素距离，t是沿折线屏幕长度的比例，point是对应的场景位置。 */
  function polylineHit(path: readonly PerformancePoint[], x: number, y: number) {
    let total = 0;
    let best: { gap: number; along: number; point: PerformancePoint } | undefined;
    let previous: { x: number; y: number } | undefined;
    for (let index = 0; index < path.length; index++) {
      const world = path[index]!;
      const value = project(world[0], world[1] + lift, world[2]);
      const screen = value ? { x: value.x, y: value.y } : undefined;
      const before = path[index - 1];
      if (previous && screen && before) {
        const dx = screen.x - previous.x, dy = screen.y - previous.y, length = Math.hypot(dx, dy);
        const t = length > 0 ? Math.max(0, Math.min(1, ((x - previous.x) * dx + (y - previous.y) * dy) / (length * length))) : 0;
        const gap = Math.hypot(x - previous.x - dx * t, y - previous.y - dy * t);
        if (!best || gap < best.gap) best = { gap, along: total + length * t, point: [before[0] + (world[0] - before[0]) * t, before[1] + (world[1] - before[1]) * t, before[2] + (world[2] - before[2]) * t] };
        total += length;
      }
      previous = screen;
    }
    return best && { gap: best.gap, t: total > 0 ? best.along / total : 0, length: total, point: best.point };
  }
  // 线只认选中路线、离两端有一段距离的位置；端点附近交给点的命中，避免一按点就变成插点。
  function hitSegment(event: PointerEvent, rect: DOMRect) {
    const route = selected;
    if (!route || route === draft || !options.onInsert || route.track.points.length < 2 || route.track.enabled === false) return undefined;
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    let best: { route: Route; segment: number; t: number; distance: number; point: PerformancePoint } | undefined;
    for (let segment = 0; segment < route.track.points.length - 1; segment++) {
      const hit = polylineHit(segmentPath(route, route.track.points, segment), x, y);
      if (hit && hit.length >= 24 && hit.t > 0.08 && hit.t < 0.92 && hit.gap <= 9 && (!best || hit.gap < best.distance)) best = { route, segment, t: hit.t, distance: hit.gap, point: hit.point };
    }
    return best;
  }
  /** 没选中的路线：点到它的线或点上就选中它（返回路线）。 */
  function hitOtherRoute(event: PointerEvent, rect: DOMRect) {
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    for (const route of routes) {
      if (route === selected || !route.line.visible && !route.blocked.visible || route.track.points.length < 2) continue;
      for (let segment = 0; segment < route.track.points.length - 1; segment++) {
        const hit = polylineHit(segmentPath(route, route.track.points, segment), x, y);
        if (hit && hit.gap <= 8) return route;
      }
    }
    return undefined;
  }
  /** 这一下会落在选中路线的中间点或线段上（起点除外：按住脚下还是重画路线），或者点到别的路线上。 */
  function wantsPointer(event: PointerEvent) {
    if (!enabled || event.button !== 0 || drag || draft) return false;
    const rect = options.canvas.getBoundingClientRect();
    updateLayout(rect);
    const point = hitPoint(event, rect);
    return point ? point.index !== 0 : !!hitSegment(event, rect) || !!hitOtherRoute(event, rect);
  }
  function pointerDown(event: PointerEvent) {
    if (!enabled || event.button !== 0 || drag) return false;
    const rect = options.canvas.getBoundingClientRect();
    updateLayout(rect);
    if (draft) {
      drawPointer = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
      options.canvas.setPointerCapture(event.pointerId);
      return true;
    }
    const found = hitPoint(event, rect);
    if (!found) {
      const segment = hitSegment(event, rect);
      if (!segment) {
        // 点到没选中的路线：选中它（和点人物、点时间轴行一样）。
        const other = hitOtherRoute(event, rect);
        if (!other) return false;
        options.onSelect(other.track.id);
        return true;
      }
      // 拖线插点：本地预览先插一个临时点，按普通拖点处理；松手才交给宿主写入，没拖动就还原。
      const { route } = segment;
      const snapshot = structuredClone(route.track);
      const ground = route.track.mode === "air" || route.track.mode === "water" ? null : options.pointAt(event.clientX, event.clientY, route.track);
      const point: PerformancePoint = ground ? [ground.x, ground.y, ground.z] : segment.point;
      drag = { pointer: event.pointerId, route, index: segment.segment + 1, original: [point[0], point[1], point[2]], x: event.clientX, y: event.clientY, moved: false, insert: { segment: segment.segment, snapshot } };
      route.track.points.splice(segment.segment + 1, 0, point);
      route.track.events = route.track.events?.map(item => ({ ...item, at: item.at > segment.segment ? item.at + 1 : item.at }));
      route.track.teleports = route.track.teleports?.map(value => value > segment.segment ? value + 1 : value);
      route.eventPoints = new Set(route.track.events?.map(item => item.at));
      route.eventsDirty = true;
      layoutDirty = true;
      refreshRoute(route);
      options.canvas.setPointerCapture(event.pointerId);
      options.invalidate();
      return true;
    }
    const { route, index } = found;
    // 双击路径点删掉它（起点留着）。
    const now = performance.now();
    if (options.onRemove && index > 0 && index !== extendIndex && lastTap?.trackId === route.track.id && lastTap.index === index && now - lastTap.time < 350) {
      lastTap = undefined;
      options.onRemove(route.track.id, index);
      return true;
    }
    lastTap = { trackId: route.track.id, index, time: now };
    // ACT: 终点和其他路径点一样拖动改位置；终点外的浅色小点按住拖动才是从末端接着画（手画和片段式动线一致）。
    if (index === extendIndex) {
      const last = route.track.points.length - 1;
      continuePointer = { pointer: event.pointerId, x: event.clientX, y: event.clientY, trackId: route.track.id, index: last, route };
      options.canvas.setPointerCapture(event.pointerId);
      options.onSelect(route.track.id, last);
      return true;
    }
    drag = { pointer: event.pointerId, route, index, original: [...route.track.points[index]!], x: event.clientX, y: event.clientY, moved: false };
    options.canvas.setPointerCapture(event.pointerId);
    options.onSelect(route.track.id, index);
    return true;
  }
  function pointerMove(event: PointerEvent) {
    if (continuePointer && continuePointer.pointer === event.pointerId) {
      if (Math.hypot(event.clientX - continuePointer.x, event.clientY - continuePointer.y) <= 4) return true;
      const pending = continuePointer;
      continuePointer = undefined;
      options.onContinueRoute?.(pending.trackId, event);
      if (draft) {
        drawPointer = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
        return true;
      }
    }
    if (draft && (event.buttons === 0 || drawPointer?.pointer === event.pointerId)) {
      const point = options.pointAt(event.clientX, event.clientY, draft.track);
      if (point) {
        const first = draft.track.points[0]!;
        const y = draft.track.mode === "air" || draft.track.mode === "water" ? first[1] : point.y;
        refreshRoute(draft, [point.x, y, point.z]);
        options.invalidate();
      } else { refreshRoute(draft); options.invalidate(); }
      return !!drawPointer;
    }
    if (!drag || drag.pointer !== event.pointerId) return false;
    drag.moved ||= Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 3;
    if (!drag.moved) return true;
    const point = options.pointAt(event.clientX, event.clientY, drag.route.track);
    if (point) {
      const y = drag.route.track.mode === "air" || drag.route.track.mode === "water" ? drag.original[1] : point.y;
      drag.route.track.points[drag.index] = [point.x, y, point.z];
      layoutDirty = true;
      refreshRoute(drag.route);
      options.invalidate();
    }
    return true;
  }
  function restoreInsert(route: Route, snapshot: PerformanceTrack) {
    route.track = snapshot;
    route.eventPoints = new Set(snapshot.events?.map(item => item.at));
    route.eventsDirty = true;
    layoutDirty = true;
    refreshRoute(route);
  }
  function release(pointer: number) { if (options.canvas.hasPointerCapture(pointer)) options.canvas.releasePointerCapture(pointer); }
  function pointerUp(event: PointerEvent) {
    if (continuePointer?.pointer === event.pointerId) {
      const pending = continuePointer;
      continuePointer = undefined;
      release(event.pointerId);
      options.onSelect(pending.trackId, pending.index);
      return true;
    }
    if (drawPointer?.pointer === event.pointerId) {
      drawPointer = undefined;
      release(event.pointerId);
      // ACT: 画线只在松手处落锚点，不再用点回首点的手势闭合路径。
      const point = options.pointAt(event.clientX, event.clientY, draft?.track);
      if (point) options.onDrawPoint(point);
      if (draft) { refreshRoute(draft); options.invalidate(); }
      return true;
    }
    if (!drag || drag.pointer !== event.pointerId) return false;
    const completed = drag;
    drag = undefined;
    release(event.pointerId);
    if (completed.insert) {
      const point = completed.route.track.points[completed.index]!;
      restoreInsert(completed.route, completed.insert.snapshot);
      if (completed.moved) options.onInsert?.(completed.route.track.id, completed.insert.segment, { x: point[0], y: point[1], z: point[2] });
      else options.invalidate();
      return true;
    }
    if (completed.moved) {
      const point = completed.route.track.points[completed.index]!;
      completed.route.track.points[completed.index] = completed.original;
      layoutDirty = true;
      refreshRoute(completed.route);
      options.onMove(completed.route.track.id, completed.index, { x: point[0], y: point[1], z: point[2] });
    }
    return true;
  }
  function cancel() {
    if (continuePointer) {
      release(continuePointer.pointer);
      continuePointer = undefined;
      return true;
    }
    if (drawPointer) { release(drawPointer.pointer); drawPointer = undefined; return true; }
    if (!drag) return false;
    const previous = drag;
    drag = undefined;
    if (previous.insert) {
      restoreInsert(previous.route, previous.insert.snapshot);
      release(previous.pointer);
      options.invalidate();
      return true;
    }
    previous.route.track.points[previous.index] = previous.original;
    layoutDirty = true;
    refreshRoute(previous.route);
    release(previous.pointer);
    options.invalidate();
    return true;
  }
  function dispose() {
    cancel();
    setDraft(null);
    for (const route of routes) removeRoute(route);
    outlines.dispose(); centers.dispose(); ring.dispose(); dot.dispose(); white.dispose(); colorMaterial.dispose();
    options.scene.remove(root);
    publish([]);
  }
  return { sync, setWalks, setEditing, setDraft, wantsPointer, pointerDown, pointerMove, pointerUp, cancel, update, dispose };
}

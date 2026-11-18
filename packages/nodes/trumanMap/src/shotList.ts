import { filmAspect, getFilmFrameHeight, type CameraShot, type SceneCamera } from "./cameraDocument";
import { estimateLineSeconds } from "./shotCoverage";

/** ACT: 台词说不完：这镜的台词按语速估的时长比镜头长0.3秒以上（手动剪短镜头后常见），返回估计秒数。 */
export function lineOverrun(row: { start: number; end: number; shot?: CameraShot }) {
  const note = row.shot?.note;
  const match = note?.match(/^[^：:]{1,20}[：:](.+)$/);
  if (!match) return undefined;
  const seconds = estimateLineSeconds(match[1]!.trim());
  return seconds > row.end - row.start + 0.3 ? seconds : undefined;
}

// ACT: 预演交付：把成片按镜头导出成镜头表（分镜表）——每个镜头一张机位画面截图，加镜号、机位、起止时间、时长、景别、焦段、运动方式。
// 生成一个自包含HTML（图片内嵌），直接打开、打印或另存PDF交给导演、摄影、美术；不依赖网络。

export type ShotListRow = {
  index: number;
  camera: SceneCamera;
  shot?: CameraShot;
  start: number;
  end: number;
  focalLength: number;
  image?: string;
  subject?: string;
  /** 入画人物：主演（骨骼人物、跟拍主体）的名字，以及其余群演人数；排通告用。 */
  cast?: { names: string[]; extras: number };
  /** 和上一镜的机位在对话双方连线两侧（越轴）。 */
  crossesAxis?: boolean;
  /** 机位角度：平视、俯拍、仰拍、顶拍（·荷兰角），按截图时这台机位的真实画面算。 */
  angle?: string;
  /** 机位离地高度、到主体（跟拍的人，没有就是注视点）的水平距离，米：现场架机用。 */
  cameraHeight?: number;
  subjectDistance?: number;
};

type Point = { x: number; y: number; z: number };
/**
 * 机位画面里有哪些人：按机位位置、看向和焦段算16:9视锥，人物脸部高度那一点落在画面内、离机位60米以内就算入画（不算遮挡）。
 * leads里的人（主演、跟拍主体）列名字，其余人物计为群演。
 */
export function castInFrame(pose: { position: Point; target: Point; focalLength: number }, people: { id: string; name: string; at: Point }[], leads: ReadonlySet<string>) {
  const forward = normalize(sub(pose.target, pose.position));
  const right = normalize(cross(forward, { x: 0, y: 1, z: 0 }));
  const up = cross(right, forward);
  const halfV = Math.atan(getFilmFrameHeight() / 2 / pose.focalLength), halfH = Math.atan(Math.tan(halfV) * filmAspect);
  const names: string[] = [];
  let extras = 0;
  for (const person of people) {
    const v = sub(person.at, pose.position);
    const depth = dot(v, forward);
    if (depth < 0.3 || depth > 60) continue;
    if (Math.abs(Math.atan2(dot(v, right), depth)) > halfH || Math.abs(Math.atan2(dot(v, up), depth)) > halfV) continue;
    if (leads.has(person.id)) names.push(person.name); else extras++;
  }
  return { names, extras };
}
const sub = (a: Point, b: Point) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Point, b: Point) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Point, b: Point) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const normalize = (a: Point) => { const length = Math.hypot(a.x, a.y, a.z) || 1; return { x: a.x / length, y: a.y / length, z: a.z / length }; };
const castText = (cast?: ShotListRow["cast"]) => !cast ? "" : [cast.names.join("、"), cast.extras ? `群演${cast.extras}人` : ""].filter(Boolean).join("；");

export function describeShotSize(camera: SceneCamera, focalLength: number) {
  const named = camera.name.match(/大全景|全景|中景|中近景|近景|特写|过肩/)?.[0];
  if (named === "过肩") return "过肩中近景";
  if (named) return named;
  return focalLength <= 20 ? "大全景" : focalLength <= 30 ? "全景" : focalLength <= 45 ? "中景" : focalLength <= 75 ? "近景" : "特写";
}

export function describeMovement(camera: SceneCamera, shot?: CameraShot) {
  const parts: string[] = [];
  const track = shot?.track ?? camera.track;
  if (shot?.path) parts.push("移动/推拉");
  if (track) parts.push(track.mode === "follow" ? "跟拍" : "摇镜跟踪");
  if (shot?.keys?.some(key => Math.abs(key.focal - shot.frame.focalLength) > 0.5)) parts.push("变焦");
  if (shot?.keys?.some(key => key.pan || key.tilt) || shot?.aimEnd) parts.push("摇");
  if (shot?.keys?.some(key => key.roll)) parts.push("斜角");
  if (shot?.shake) parts.push("手持");
  return parts.length ? parts.join(" + ") : "固定";
}

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

/** 置景与人物清单的一行：同一素材汇总数量。 */
export type InventoryRow = { name: string; kind: string; count: number };

/** 镜头表CSV（UTF-8带BOM，Excel直接打开不乱码）：镜号、机位、景别、焦段、运动、主体、开始、结束、时长、备注。 */
/** ACT: 画面描述（可直接当AI出图、出视频的提示词）：场景，景别（焦段），运镜，画面里的人，台词或说明。 */
export function describeShotPrompt(row: ShotListRow, scene = "") {
  const cast = castText(row.cast);
  return [scene, `${describeShotSize(row.camera, row.focalLength)}（${Math.round(row.focalLength)}mm）`, row.angle ?? "", describeMovement(row.camera, row.shot), cast ? `画面里：${cast}` : "", row.shot?.note ?? ""].filter(Boolean).join("，");
}

export interface EdlEvent { start: number; end: number; label: string; note?: string }
/**
 * ACT: 剪辑表（CMX3600 EDL）：每个成片镜头一条剪辑事件，源素材就是导出的预演小样（clip 名对上文件名，剪辑软件按名字关联），
 * 源时间码=成片时间（预演小样从00:00:00:00开始），记录时间码从01:00:00:00起；镜号景别机位写成标记（LOC），台词写进注释。
 * 剪辑师在 Premiere / Resolve 里导入后，预演小样按镜头切开，后面实拍素材进来逐镜替换。
 */
export function createEdl(title: string, clip: string, events: readonly EdlEvent[], fps = 24) {
  const tc = (seconds: number, hours = 0) => {
    const frames = Math.round(seconds * fps) + hours * 3600 * fps;
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${pad(Math.floor(frames / fps / 3600))}:${pad(Math.floor(frames / fps / 60) % 60)}:${pad(Math.floor(frames / fps) % 60)}:${pad(frames % fps)}`;
  };
  const oneLine = (value: string) => value.replace(/\s+/g, " ").trim();
  const lines = [`TITLE: ${oneLine(title).slice(0, 70) || "PREVIS"}`, "FCM: NON-DROP FRAME", ""];
  events.filter(event => event.end > event.start).forEach((event, index) => {
    lines.push(`${String(index + 1).padStart(3, "0")}  AX       V     C        ${tc(event.start)} ${tc(event.end)} ${tc(event.start, 1)} ${tc(event.end, 1)}`);
    lines.push(`* FROM CLIP NAME: ${clip}`);
    lines.push(`* LOC: ${tc(event.start, 1)} YELLOW  ${oneLine(event.label)}`);
    if (event.note) lines.push(`* COMMENT: ${oneLine(event.note)}`);
    lines.push("");
  });
  return lines.join("\r\n");
}

export function createShotListCsv(rows: ShotListRow[], scene = "") {
  const cell = (value: string | number) => { const text = String(value); return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; };
  const header = ["镜号", "机位", "景别", "角度", "焦段mm", "机位高m", "距主体m", "运动", "主体", "入画人物", "开始秒", "结束秒", "时长秒", "备注", "越轴", "画面描述", "提示"];
  const body = rows.map(row => [row.index, row.camera.name, describeShotSize(row.camera, row.focalLength), row.angle ?? "", Math.round(row.focalLength), row.cameraHeight?.toFixed(1) ?? "", row.subjectDistance?.toFixed(1) ?? "", describeMovement(row.camera, row.shot), row.subject ?? "", castText(row.cast), row.start.toFixed(2), row.end.toFixed(2), (row.end - row.start).toFixed(2), row.shot?.note ?? "", row.crossesAxis ? "越轴" : "", describeShotPrompt(row, scene), (overrun => overrun ? `台词约需${overrun.toFixed(1)}秒，可能说不完` : "")(lineOverrun(row))].map(cell).join(","));
  return "﻿" + [header.join(","), ...body].join("\r\n");
}

export function createShotListHtml(title: string, rows: ShotListRow[], note: string, inventory: InventoryRow[] = [], floorPlan = "", scene = "") {
  const total = rows.at(-1)?.end ?? 0;
  const csv = "data:text/csv;charset=utf-8," + encodeURIComponent(createShotListCsv(rows, scene));
  const castOf = (row: ShotListRow) => escape((row.cast?.names ?? []).join("|"));
  const castNames = [...new Set(rows.flatMap(row => row.cast?.names ?? []))];
  const body = rows.map(row => `<tr data-cast="${castOf(row)}">
<td class="no">${row.index}</td>
<td class="frame">${row.image ? `<img src="${row.image}" alt="镜头${row.index}画面">` : "<div class=\"empty\">无画面</div>"}</td>
<td><strong>${escape(row.camera.name)}</strong><span>${escape(describeShotSize(row.camera, row.focalLength))}${row.angle ? " · " + escape(row.angle) : ""} · ${Math.round(row.focalLength)}mm</span>${row.cameraHeight !== undefined ? `<span>机位高 ${row.cameraHeight.toFixed(1)} 米${row.subjectDistance !== undefined ? ` · 距主体 ${row.subjectDistance.toFixed(1)} 米` : ""}</span>` : ""}<span>${escape(describeMovement(row.camera, row.shot))}</span>${row.subject ? `<span>主体：${escape(row.subject)}</span>` : ""}${row.cast && (row.cast.names.length || row.cast.extras) ? `<span>入画：${escape(castText(row.cast))}</span>` : ""}</td>
<td class="time">${clock(row.start)} – ${clock(row.end)}<span>${(row.end - row.start).toFixed(1)} 秒</span></td>
<td class="notes">${row.crossesAxis ? `<span style="color:#c0392b;font-weight:600">⚠ 越轴：和上一镜的机位在对话双方连线两侧</span>` : ""}${(overrun => overrun ? `<span style="color:#b7791f;font-weight:600">⚠ 台词约需 ${overrun.toFixed(1)} 秒，镜头只有 ${(row.end - row.start).toFixed(1)} 秒，可能说不完</span>` : "")(lineOverrun(row))}${row.shot?.note ? escape(row.shot.note) : ""}</td>
</tr>`).join("\n");
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title>
<style>
:root { color-scheme: light; --line: #d9dde3; --muted: #6b7380; }
a { color: #2f6fde; } @media print { a { display: none; } }
body { margin: 24px; font: 13px/1.5 system-ui, "PingFang SC", "Microsoft YaHei", sans-serif; color: #1f2329; background: #fff; }
h1 { margin: 0 0 4px; font-size: 20px; } p.meta { margin: 0 0 16px; color: var(--muted); }
table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid var(--line); padding: 8px; vertical-align: top; text-align: left; }
th { background: #f4f6f8; font-weight: 600; } td span { display: block; color: var(--muted); font-size: 12px; }
td.no { width: 40px; text-align: center; font-weight: 600; font-size: 16px; } td.frame { width: 320px; } td.frame img { display: block; max-width: 320px; max-height: 240px; border-radius: 4px; }
td.time { width: 120px; font-variant-numeric: tabular-nums; } td.notes { min-width: 140px; } .empty { width: 320px; aspect-ratio: 16 / 9; display: grid; place-items: center; background: #eef0f3; color: var(--muted); }
h2 { margin: 28px 0 4px; font-size: 16px; } table.inventory { width: auto; min-width: 420px; } td.count { text-align: right; font-variant-numeric: tabular-nums; }
tr { break-inside: avoid; } @media print { body { margin: 10mm; } th { background: #eee; } }
nav.views { margin: 0 0 12px; font-size: 13px; } p.castFilter { margin: 0 0 8px; font-size: 13px; } @media print { p.castFilter { display: none; } } nav.views a { margin-right: 12px; }
.board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.panel { break-inside: avoid; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; }
.panel img, .panel .empty { display: block; width: 100%; max-height: 360px; object-fit: contain; background: #111; border-radius: 0; }
.panel .cap { padding: 6px 8px; } .panel .cap b { font-size: 14px; } .panel .cap span { display: block; color: var(--muted); font-size: 12px; } .panel .cap p { margin: 4px 0 0; }
.panel.axis { outline: 2px solid #c0392b; }
@media print { h2.boardTitle { break-before: page; } }
</style></head><body>
<h1>${escape(title)}</h1>
<p class="meta">${rows.length} 个镜头 · 总长 ${clock(total)} · ${escape(note)} · <a href="${csv}" download="${escape(title)}.csv">下载CSV（排期表用）</a></p>
${castNames.length > 1 ? `<p class="castFilter">只看 <select onchange="document.querySelectorAll('[data-cast]').forEach(el => { el.style.display = !this.value || el.dataset.cast.split('|').includes(this.value) ? '' : 'none'; })"><option value="">全部镜头</option>${castNames.map(name => `<option value="${escape(name)}">${escape(name)}</option>`).join("")}</select> 出现的镜头</p>` : ""}
<nav class="views"><a href="#list">镜头表</a><a href="#board">分镜板</a>${floorPlan ? '<a href="#plan">机位平面图</a>' : ""}</nav>
<a id="list"></a>
<table><thead><tr><th>镜号</th><th>画面</th><th>机位 / 景别 / 运动</th><th>时间</th><th>备注</th></tr></thead><tbody>
${body}
</tbody></table>
<h2 class="boardTitle" id="board">分镜板</h2>
<div class="board">
${rows.map(row => `<div class="panel${row.crossesAxis ? " axis" : ""}" data-cast="${castOf(row)}">${row.image ? `<img src="${row.image}" alt="镜头${row.index}画面">` : '<div class="empty">无画面</div>'}<div class="cap"><b>${row.index}</b> · ${escape(describeShotSize(row.camera, row.focalLength))}${row.angle && row.angle !== "平视" ? " · " + escape(row.angle) : ""} · ${Math.round(row.focalLength)}mm<span>${clock(row.start)} – ${clock(row.end)} · ${escape(describeMovement(row.camera, row.shot))}${row.crossesAxis ? " · ⚠越轴" : ""}${lineOverrun(row) ? " · ⚠台词说不完" : ""}</span>${row.shot?.note ? `<p>${escape(row.shot.note)}</p>` : ""}</div></div>`).join("\n")}
</div>
${floorPlan ? `<h2 id="plan">机位平面图</h2>${floorPlan}` : ""}
${(() => {
  // 主演出镜统计：按入画人物汇总每位主演出现在哪几镜、合计多少秒，排演员档期用。
  const stats = new Map<string, { shots: number[]; seconds: number }>();
  for (const row of rows) for (const name of row.cast?.names ?? []) { const entry = stats.get(name) ?? { shots: [], seconds: 0 }; entry.shots.push(row.index); entry.seconds += row.end - row.start; stats.set(name, entry); }
  if (!stats.size) return "";
  return `<h2>主演出镜</h2><table class="inventory"><thead><tr><th>主演</th><th>镜号</th><th>合计</th></tr></thead><tbody>
${[...stats].sort((a, b) => b[1].seconds - a[1].seconds).map(([name, entry]) => `<tr><td>${escape(name)}</td><td>${entry.shots.join("、")}</td><td class="count">${entry.seconds.toFixed(1)} 秒</td></tr>`).join("\n")}
</tbody></table>`;
})()}
${inventory.length ? `<h2>置景与人物清单</h2><p class="meta">共 ${inventory.reduce((sum, row) => sum + row.count, 0)} 件，${inventory.length} 种</p>
<table class="inventory"><thead><tr><th>名称</th><th>类别</th><th>数量</th></tr></thead><tbody>
${inventory.map(row => `<tr><td>${escape(row.name)}</td><td>${escape(row.kind)}</td><td class="count">${row.count}</td></tr>`).join("\n")}
</tbody></table>` : ""}
</body></html>`;
}

/** 平面图里的一件东西：俯视矩形（米、转角度数）或人物点。 */
export type PlanItem = { kind: "set" | "person" | "lead"; name: string; x: number; z: number; width: number; depth: number; rotation: number };
export type PlanCamera = { number: string; name: string; x: number; z: number; tx: number; tz: number; focalLength: number; path?: { x: number; z: number }[] };
export type PlanRoute = { points: { x: number; z: number }[]; lead: boolean };

/**
 * ACT: 机位平面图（俯视，SVG）：陈设占地灰块、群演小点、主演红点和名字、走位路线、机位三角和视野扇形，旁边标它负责的镜号。
 * 视图按所有内容的包围盒取景，正上方为-Z（场景北），给摄影、灯光、美术对位用。
 */
export function createFloorPlanSvg(items: PlanItem[], cameras: PlanCamera[], routes: PlanRoute[]) {
  const xs = [...items.flatMap(item => [item.x - item.width / 2, item.x + item.width / 2]), ...cameras.flatMap(camera => [camera.x, camera.tx]), ...routes.flatMap(route => route.points.map(point => point.x))];
  const zs = [...items.flatMap(item => [item.z - item.depth / 2, item.z + item.depth / 2]), ...cameras.flatMap(camera => [camera.z, camera.tz]), ...routes.flatMap(route => route.points.map(point => point.z))];
  if (!xs.length) return "";
  const pad = 3, minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minZ = Math.min(...zs) - pad, maxZ = Math.max(...zs) + pad;
  const width = 900, scale = width / Math.max(1, maxX - minX), height = Math.round((maxZ - minZ) * scale);
  const px = (x: number) => ((x - minX) * scale).toFixed(1), pz = (z: number) => ((z - minZ) * scale).toFixed(1);
  const sets = items.filter(item => item.kind === "set").map(item => `<rect x="${px(item.x - item.width / 2)}" y="${pz(item.z - item.depth / 2)}" width="${(item.width * scale).toFixed(1)}" height="${(item.depth * scale).toFixed(1)}" transform="rotate(${-item.rotation} ${px(item.x)} ${pz(item.z)})" fill="#d5d9df" stroke="#9aa3ad" stroke-width="1"><title>${escape(item.name)}</title></rect>`).join("");
  const lines = routes.map(route => `<polyline points="${route.points.map(point => `${px(point.x)},${pz(point.z)}`).join(" ")}" fill="none" stroke="${route.lead ? "#d0473b" : "#7aa7d6"}" stroke-width="${route.lead ? 2 : 1}" stroke-dasharray="${route.lead ? "" : "4 3"}" opacity="0.8"/>`).join("");
  const people = items.filter(item => item.kind !== "set").map(item => item.kind === "lead"
    ? `<circle cx="${px(item.x)}" cy="${pz(item.z)}" r="5" fill="#d0473b"/><text x="${(Number(px(item.x)) + 7).toFixed(1)}" y="${(Number(pz(item.z)) + 4).toFixed(1)}" font-size="12" fill="#a1342a">${escape(item.name)}</text>`
    : `<circle cx="${px(item.x)}" cy="${pz(item.z)}" r="2.5" fill="#6b7380"/>`).join("");
  const cams = cameras.map(camera => {
    const angle = Math.atan2(camera.tx - camera.x, camera.tz - camera.z), half = Math.atan(getFilmFrameHeight() * filmAspect / 2 / camera.focalLength), reach = Math.min(Math.hypot(camera.tx - camera.x, camera.tz - camera.z), 12) * scale;
    const cx = Number(px(camera.x)), cz = Number(pz(camera.z));
    const edge = (a: number) => `${(cx + Math.sin(a) * reach).toFixed(1)},${(cz + Math.cos(a) * reach).toFixed(1)}`;
    const path = camera.path?.length ? `<polyline points="${camera.path.map(point => `${px(point.x)},${pz(point.z)}`).join(" ")}" fill="none" stroke="#2f6fde" stroke-width="1.5" marker-end="url(#arrow)"/>` : "";
    return `${path}<polygon points="${cx},${cz} ${edge(angle - half)} ${edge(angle + half)}" fill="#2f6fde" opacity="0.12"/><circle cx="${cx}" cy="${cz}" r="6" fill="#2f6fde"/><text x="${cx + 8}" y="${cz - 8}" font-size="12" font-weight="600" fill="#1f4fa8">${escape(camera.name)} · ${escape(camera.number)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;border:1px solid #d9dde3;border-radius:6px;background:#fafbfc"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#2f6fde"/></marker></defs>${sets}${lines}${people}${cams}<text x="8" y="16" font-size="11" fill="#6b7380">俯视 · 上方为北(-Z) · 比例 1格≈${(50 / scale).toFixed(1)}米</text></svg>`;
}

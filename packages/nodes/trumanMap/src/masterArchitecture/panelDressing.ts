import type { ModelPart } from "../assetModelParts";
import { shade } from "./chineseRoofKit";
import { FacadeBuilder } from "./facadeKit";
import { DEG, yawOf } from "./partMath";
import { bodyHoles, clipRect } from "./shellRegistry";

// 金属、板材外壳的面板细化（单面四边形，很省顶点）：
// 科幻和赛博朋克铺面板接缝并加发光灯带，蒸汽朋克加黄铜箍带和接缝，废土加焊缝和锈蚀补丁，
// 木板墙面按板宽铺竖向板缝。只处理竖直长方体的四个立面，名称带玻璃、窗、水面、地面的不处理。
const NOT_PANEL = /玻璃|窗|水|地|光|灯|屋顶|瓦|栏|梯|桥面|屏|门扇|帘|帐|草|叶|管/;
const WOOD = /木|板|栅|棚屋/;

type Look = "scifi" | "cyber" | "steam" | "waste" | "wood";

export function dressPanels(parts: ModelPart[], theme: string | undefined, room: number, seed: number, maxQuads = 200): ModelPart[] {
  if (room < 1) return [];
  const metal = theme === "科幻" ? "scifi" : theme === "赛博朋克" ? "cyber" : theme === "蒸汽朋克" ? "steam" : theme === "废土" ? "waste" : undefined;
  const b = new FacadeBuilder();
  b.group("seam", "外壳面板接缝", "#3c4650", { roughness: .8, metalness: .3 })
    .group("band", "外壳箍带", "#b08a3a", { roughness: .5, metalness: .5 })
    .group("patch", "锈蚀补丁", "#7a4a2e", { roughness: .95 })
    .group("plank", "木板缝", "#4a382a", { roughness: .95 });
  const neon = seed % 2 ? { color: "#ff7ac8", emissive: "#ff3ea5" } : { color: "#7af2ff", emissive: "#27d8ff" };
  b.group("strip", "外壳灯带", metal === "cyber" ? neon.color : "#8fe4ff", { emissive: metal === "cyber" ? neon.emissive : "#4fd0ff", emissiveIntensity: 1, roughness: .4 });
  let quads = 0, any = false;
  const flat = (key: string, x: number, y: number, z: number, w: number, h: number, dir: number) => { if (quads >= maxQuads) return; quads++; any = true; b.rect(key, x, y, z, w, h, dir); };
  for (const value of parts) {
    if (quads >= maxQuads) break;
    if (value.shape !== "box" || NOT_PANEL.test(value.name)) continue;
    const yaw = yawOf(value);
    if (yaw === undefined) continue;
    const { x: sx, y: sy, z: sz } = value.scale;
    const look: Look | undefined = WOOD.test(value.name) && !/金属|钢|铁/.test(value.name) ? "wood" : metal;
    if (!look || sy < .7 || Math.max(sx, sz) < 1.2 || Math.min(sx, sz) < .4 && sy < 1.4) continue;
    const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), y0 = value.position.y - sy / 2;
    const faces = [
      { width: sx, half: sz / 2, along: true, sign: 1, dir: 0 }, { width: sx, half: sz / 2, along: true, sign: -1, dir: 180 },
      { width: sz, half: sx / 2, along: false, sign: 1, dir: 90 }, { width: sz, half: sx / 2, along: false, sign: -1, dir: 270 },
    ];
    const holes = bodyHoles.get(value);
    for (const [faceId, face] of faces.entries()) {
      if (face.width < .8 || quads >= maxQuads) continue;
      const at = (t: number, n: number): [number, number] => {
        const lx = face.along ? t : face.sign * (face.half + n), lz = face.along ? face.sign * (face.half + n) : t;
        return [value.position.x + lx * c + lz * s, value.position.z - lx * s + lz * c];
      };
      const W = face.width, dir = yaw + face.dir;
      // 贴面件按洞口裁开：给出面内切向区间和高度区间
      const put = (key: string, t0: number, t1: number, ya: number, yb: number, n: number) => {
        for (const [a, e, lo, hi] of clipRect(holes, faceId, t0, t1, ya, yb)) { const [x, z] = at((a + e) / 2, n); flat(key, x, (lo + hi) / 2, z, e - a, hi - lo, dir); }
      };
      if (look === "wood") {
        // 竖向板缝：每 .26m 一道，避开两端
        for (let t = -W / 2 + .26; t < W / 2 - .1; t += .26) put("plank", t - .007, t + .007, y0 + .03, y0 + sy - .03, .012);
        continue;
      }
      // 竖向面板接缝：每 1.3m 一道；横向一条在三分之一高度
      const cols = Math.max(1, Math.round(W / 1.3));
      for (let k = 1; k < cols; k++) { const t = -W / 2 + W * k / cols; put("seam", t - .0125, t + .0125, y0 + .04, y0 + sy - .04, .012); }
      if (sy >= 1.2) put("seam", -W / 2 + .03, W / 2 - .03, y0 + sy / 3 - .0125, y0 + sy / 3 + .0125, .012);
      if (look === "scifi" || look === "cyber") {
        if (sy >= 1.2) { const yc = y0 + sy * (look === "cyber" ? .72 : .8); put("strip", -W / 2 + .15, W / 2 - .15, yc - .035, yc + .035, .018); }
      } else if (look === "steam") {
        for (const f of [.28, .72]) if (sy >= 1.2) { const yc = y0 + sy * f; put("band", -W / 2 + .02, W / 2 - .02, yc - .05, yc + .05, .02); }
      } else {
        // 废土：焊缝之外随机贴两块补丁
        for (let k = 0; k < 2 && sy >= 1.2; k++) {
          const t = ((seed + k * 7 + Math.floor(W * 10)) % 100 / 100 - .5) * (W - .9), pw = .5 + (k % 2) * .25, yc = y0 + sy * (.35 + k * .3);
          put("patch", t - pw / 2, t + pw / 2, yc - .2, yc + .2, .016);
        }
      }
    }
  }
  if (!any) return [];
  const made = b.parts();
  // 接缝颜色随壳体变深，免得在深色壳体上看不出
  for (const value of made) if (value.name === "外壳面板接缝") value.color = shade(parts.find(p => p.shape === "box" && !NOT_PANEL.test(p.name))?.color ?? "#6f7b86", .55);
  return made.slice(0, room);
}

import { DEG, SLAB, addFinish } from "./whitebox";
import type { AB } from "./whiteboxAncientKit";
import { pol } from "./whiteboxRegional";
import { pipe } from "./whiteboxUnderground";
import { prismoid } from "./whiteboxWorld";

// 建筑白模·收尾细化：通用的细化（门窗框、门扇、线脚、柱础柱头、瓦垄……）加在套件里，素材自动获得；
// 下面这些是套件够不着的异形素材（隧道、金字塔、竞技场、碉堡、风车、舱室……）和小构件（玻璃隔断、雨棚、灯位格栅），
// 按素材名称登记收尾函数，在素材建好之后追加该类建筑真实会有的细部。所有坐标都和对应生成器里的一致，
// 只在细节等级 ≥2 时执行，超出部件或三角形预算时整件自动降级。
const tan = (d: number) => Math.tan(d * DEG);

// ---------- 小构件 ----------
addFinish(/墙体·玻璃隔断/, b => { for (const x of [-1.475, -.5, .5, 1.475]) b.box("frame", x, 1.4, 0, .05, 2.7, .05); b.box("frame", 0, 1.0, 0, 3, .04, .05); });
addFinish(/墙体·玻璃幕墙/, b => { for (const x of [-1.45, 0, 1.45]) for (const s of [-1, 1]) b.box("trim", x, 1.4, s * .075, .06, 2.8, .02); });
addFinish(/立面构件·雨棚/, b => { for (const x of [-1.2, 1.2]) b.strut("struct", [x, .95, .04], [x, .15, 1.35], .04, .05); });
addFinish(/立面构件·空调机位/, b => { for (let k = 0; k < 8; k++) b.box("frame", 0, .25 + k * .11, .565, 2.8, .035, .03); });
addFinish(/天花·灯位格栅/, b => { for (let i = 0; i <= 5; i++) for (let j = 0; j <= 3; j++) b.box("rig", -6 + i * 2.4, .46, -4.5 + j * 2.4, .03, .8, .03); });

// ---------- 古建 ----------
addFinish(/古建·石拱桥/, b => {
  for (const z of [-2.35, 2.35]) { b.box("trim", 0, 4.8 + .93, z, 15.04, .06, .42); for (const s of [-1, 1]) b.strut("trim", [s * 7.5, 4.8 + .93, z], [s * 28.5, .93, z], .42, .06); }
});
addFinish(/古建·屋顶·歇山/, b => {
  const yE = -1.8 * tan(30) - .09;
  for (const z of [-7.8, 7.8]) b.box("trim", 0, yE, z, 26.1, .18, .06);
  for (const x of [-13.05, 13.05]) b.box("trim", x, yE, 0, .06, .18, 15.6);
});

// ---------- 民居、工业、军事 ----------
addFinish(/民居·毡房/, b => {
  for (const s of [-1, 1]) { b.box("frame", s * .633, .975, 2.94, .08, 1.95, .2); b.box("door", s * .58, .975, 3.31, .04, 1.91, .56); }
  b.box("frame", 0, 1.99, 2.94, 1.34, .08, .2);
});
addFinish(/工业·集装箱堆场/, b => {
  for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 5; iz++) {
    if ((ix + iz) % 4 === 3) continue;
    const n = (ix * 3 + iz * 2) % 3 + 1;
    for (let k = 0; k < n; k++) {
      const cx = -18.6 + ix * 12.4, cy = 1.295 + k * 2.59, cz = -6 + iz * 3;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box("trim", cx + sx * 6.0, cy + 1.2, cz + sz * 1.14, .24, .24, .24);
      for (const sx of [-1, 1]) for (const dz of [-.5, .5]) b.box("frame", cx + sx * 6.12, cy, cz + dz, .03, 2.3, .04);
    }
  }
});
addFinish(/工业·塔吊/, b => {
  for (const x of [-.3, .3]) b.box("rail", x, 21.8, 1.12, .04, 40.4, .04);
  for (let y = 2; y < 42; y += .6) b.box("rail", 0, y, 1.12, .6, .03, .03);
  b.box("glass", 1.8, 41.6, 2.81, 1.4, .8, .03); b.box("glass", 2.81, 41.6, 1.8, .03, .8, 1.4);
  for (const [dy, h] of [[41.17, .06], [42.03, .06]] as [number, number][]) { b.box("frame", 1.8, dy, 2.82, 1.5, h, .05); b.box("frame", 2.82, dy, 1.8, .05, h, 1.5); }
  for (const dx of [-.72, .72]) { b.box("frame", 1.8 + dx, 41.6, 2.82, .06, .9, .05); b.box("frame", 2.82, 41.6, 1.8 + dx, .05, .9, .06); }
});
addFinish(/军事·碉堡/, b => {
  const R = 3;
  const at =(a: number, off: number, rad = 0): [number, number] => { const p = pol(R, a, 0), c = Math.cos(a * DEG), s = Math.sin(a * DEG); return [p[0] + c * off + s * rad, p[2] - s * off + c * rad]; };
  const put = (key: string, a: number, off: number, y: number, sx: number, sy: number, sz: number) => { const [x, z] = at(a, off); b.boxYaw(key, x, y, z, sx, sy, sz, a); };
  for (const a of [0, 60, 300]) { put("frame", a, 0, 1.533, .92, .06, .64); put("frame", a, 0, 1.167, .92, .06, .64); for (const s of [-1, 1]) put("frame", a, s * .433, 1.35, .06, .36, .64); }
  for (const s of [-1, 1]) put("frame", 180, s * .483, .75, .06, 1.5, .64); put("frame", 180, 0, 1.533, .96, .06, .64);
});
addFinish(/地标·风车/, b => {
  for (const s of [-1, 1]) { b.box("wall", s * 1.275, 1.0, 4.157, 1.35, 2.0, .7); b.box("frame", s * .633, 1.0, 4.157, .06, 2.0, .78); b.box("door", s * .58, 1.0, 4.157 + .35 + .02 + .3, .045, 1.94, .6); }
  b.box("frame", 0, 2.034, 4.157, 1.3, .06, .78);
  for (const [a, tier] of [[90, 1], [270, 1], [0, 2], [180, 2], [90, 3], [270, 3]] as [number, number][]) {
    const r = (4.5 - tier * .32 + .35) * Math.cos(22.5 * DEG), y = tier * 2.4 + 1.3, c = Math.cos(a * DEG), s = Math.sin(a * DEG), p = pol(r, a, 0);
    const put = (key: string, off: number, dy: number, sx: number, sy: number, sz: number, rad = 0) => b.boxYaw(key, p[0] + c * off + s * rad, y + dy, p[2] - s * off + c * rad, sx, sy, sz, a);
    put("glass", 0, 0, .6, 1.0, .06);
    put("frame", 0, .53, .72, .06, .1, .02); put("frame", 0, -.53, .72, .06, .1, .02); put("frame", -.33, 0, .06, 1.0, .1, .02); put("frame", .33, 0, .06, 1.0, .1, .02);
    put("trim", 0, -.56, .8, .06, .2, .06);
  }
});
addFinish(/科幻·圆形指挥舱/, b => {
  const put = (key: string, a: number, off: number, y: number, r: number, sx: number, sy: number, sz: number) => { const p = pol(r, a, 0), c = Math.cos(a * DEG), s = Math.sin(a * DEG); b.boxYaw(key, p[0] + c * off, y, p[2] - s * off, sx, sy, sz, a); };
  for (const a of [0, 120, 240]) { for (const s of [-1, 1]) put("frame", a, s * 1.24, SLAB + 1.0, 8.9, .08, 2.0, .4); put("frame", a, 0, 2.24, 8.9, 2.5, .08, .4); }
  const isDoor = (k: number) => [0, 8, 16].includes((k % 24 + 24) % 24);
  for (let i = 0; i < 24; i++) { if (isDoor(i) || isDoor(i + 1)) continue; put("frame", i * 15 + 7.5, 0, 2.9, 9.0, .08, 1.4, .36); }
  b.cyl("trim", 0, 0, SLAB + 1.1, SLAB + 1.2, 2.6, 16);
});
addFinish(/科幻·圆管舱廊/, b => { for (const z of [-1.5, 0, 1.5]) pipe(b as AB, "trim", 1.63, .07, 1.95, z - .1, z + .1, 16); });
addFinish(/科幻·反应堆舱/, b => {
  for (const s of [-1, 1]) b.box("frame", s * 1.09, 1.5, 7.93, .08, 3.0, .7); b.box("frame", 0, 3.04, 7.93, 2.26, .08, .7);
  for (const y of [2, 5, 8]) b.cyl("trim", 0, 0, y, y + .25, 3.1, 16);
});

// ---------- 地下与隧道 ----------
addFinish(/地下·下水道·圆形主管/, b => {
  for (const s of [-1, 1]) b.rail(s * .55, -15, s * .55, 15, 1.0);
  for (let z = -13.5; z <= 13.6; z += 3) pipe(b as AB, "trim", 2.14, .06, 2.6, z - .1, z + .1, 24);
  for (const s of [-1, 1]) b.box("equip", s * 1.85, 3.3, 0, .3, .05, 30);
});
addFinish(/地下·下水道·交汇井室/, b => {
  const N = 24, top = (i: number): [number, number, number] => pol(2.5, i * 360 / N, 1.6);
  for (let i = 0; i < N; i++) { const p = pol(2.5, i * 360 / N, .6), q = top(i), n = top(i + 1); b.box("rail", p[0], 1.1, p[2], .05, 1.0, .05); b.segment("rail", q, n, .05, .05); }
});
addFinish(/地下·矿道/, b => { for (let z = -15; z <= 15.1; z += 1.5) for (const s of [-1, 1]) b.strut("struct", [s * 1.45, 1.4, z], [s * .85, 2.15, z], .12, .12); });
addFinish(/地下·地铁区间/, b => {
  for (const t of [-1, 1]) {
    const cx = t * 3.2;
    for (const s of [-1, 1]) { b.rail(cx + s * 1.0, -15, cx + s * 1.0, 15, .95); b.box("equip", cx + s * 2.4, 2.6, 0, .35, .06, 30); }
    for (let z = -13.5; z <= 13.6; z += 3) pipe(b as AB, "trim", 2.74, .06, 3.15, z - .1, z + .1, 16, { cx });
  }
});
addFinish(/地下·酒窖/, b => {
  for (const s of [-1, 1]) for (let z = -10; z <= 10.1; z += 2) {
    for (const y of [.4, .8, 1.2]) b.box("frame", s * 1.48, y, z, .03, .04, 1.6);
    for (let k = -2; k <= 2; k++) b.box("frame", s * 1.48, .8, z + k * .4, .03, 1.6, .04);
  }
});
addFinish(/场地·隧道·单洞/, b => {
  for (const s of [-1, 1]) { b.rail(s * 3.5, -15, s * 3.5, 15, .75); for (let z = -12; z <= 12.1; z += 6) b.box("equip", s * 4.4, 3.0, z, .15, .15, .6); }
  b.box("equip", 0, 6.93, 0, .3, .14, 30);
});

// ---------- 地标、古典、交通 ----------
addFinish(/地标·摩天轮/, b => {
  const R = 28, hy = 32;
  for (let i = 0; i < 36; i++) { const x = R * Math.sin(i * 10 * DEG), y = hy + R * Math.cos(i * 10 * DEG); for (const s of [-1, 1]) b.box("glass", x, y - 1.5, s * 1.31, 1.6, 1.0, .03); }
});
addFinish(/交通·铁路桁架桥/, b => { for (const s of [-1, 1]) b.rail(-30, s * 4.5, 30, s * 4.5, 8.0); });
addFinish(/场所·露天集市/, b => {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) { const x = -15.75 + c * 4.5, z = -5.5 + r * 5.5; b.box("trim", x, 2.25, z + 1.4, 3.4, .22, .03); b.box("trim", x, .93, z + .4, 3.1, .06, .9); }
});
addFinish(/地标·背景·摩天楼群/, b => {
  const hs = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  [34, 52, 78, 46, 64, 40, 82, 56, 44, 72, 36, 60, 50, 80, 42, 54].forEach((h, i) => { const x = -75 + i * 10, back = i % 2, z = back ? -14 : 4, w = 8 + hs(i) * 1.6, d = back ? 18 : 14; b.box("trim", x, h + .15, z, w + .5, .3, d + .5); });
});
addFinish(/地标·风力发电机/, b => {
  b.box("door", .5, 1.15, 2.55, .06, 2.3, .7); for (const s of [-1, 1]) b.box("frame", s * .46, 1.15, 2.19, .08, 2.3, .12); b.box("frame", 0, 2.34, 2.19, 1.0, .08, .12);
});
addFinish(/古典·罗马竞技场/, b => {
  const N = 96, sc = .79;
  for (let k = 0; k < 3; k++) for (let i = 0; i < N; i += 2) {
    const a = i * 360 / N, x = 48.25 * Math.sin(a * DEG), z = 48.25 * sc * Math.cos(a * DEG), yaw = Math.atan2(Math.sin(a * DEG), Math.cos(a * DEG) / sc) / DEG;
    b.boxYaw("trim", x, k * 8 + 3.2, z, .9, 6.4, .5, yaw);
  }
});
{
  /** 金字塔：沿坡面外扩 0.1 的腰带和塔尖金顶（比坡面高 0.1，不和坡面共面）。 */
  const bands = (b: AB, cx: number, cz: number, hb: number, ht: number, H: number, ys: [number, number][]) => {
    const hw = (y: number) => hb + (ht - hb) * y / H + .1;
    for (const [y0, y1] of ys) prismoid(b, "trim", [cx - hw(y0), cz - hw(y0), cx + hw(y0), cz + hw(y0)], y0, [cx - hw(y1), cz - hw(y1), cx + hw(y1), cz + hw(y1)], y1);
  };
  addFinish(/古典·埃及大金字塔/, b => {
    bands(b as AB, -13, 0, 70, .3, 92, [[0, 2], [30, 31.5], [60, 61.5], [89, 92]]);
    for (const z of [-28, 0, 28]) bands(b as AB, 71, z, 12, .3, 16, [[0, 1], [14.5, 16]]);
  });
  addFinish(/古典·麦罗埃金字塔群/, b => {
    [10, 12, 8, 14, 9, 11, 13, 10].forEach((w, i) => { const x = -24 + (i % 4) * 16, z = i < 4 ? -9 : 9, h = w * 1.45; bands(b as AB, x, z, w / 2, .2, h, [[0, 1], [h * .5, h * .5 + 1], [h - 1.5, h]]); });
  });
}

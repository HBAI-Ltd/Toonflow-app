import type { ModelPart } from "../assetModelParts";
import { Builder } from "./chineseArchKit";
import { shade } from "./chineseRoofKit";

// 夯土敌台、城台的平顶：沿顶板四周补女墙和垛口，顶面不再是一块光板。
export function dressBattlement(parts: ModelPart[], room: number): ModelPart[] {
  const slabs = parts.filter(value => value.shape === "box" && /(敌台|城台|墩台).*顶$/.test(value.name) && value.scale.y <= .3 && value.scale.x * value.scale.z >= 30 && Math.abs(value.rotation.x) < 1e-6 && Math.abs(value.rotation.z) < 1e-6);
  if (!slabs.length || room < 2) return [];
  const b = new Builder();
  slabs.forEach((slab, index) => {
    const wallColor = shade(slab.color, 1.08);
    b.group(`wall${index}`, "女墙", wallColor, { roughness: .95 }).group(`merlon${index}`, "垛口", shade(slab.color, .94), { roughness: .95 });
    const yawQuarter = Math.round(((slab.rotation.y % 180) + 180) % 180 / 90) % 2 === 1;
    const sx = yawQuarter ? slab.scale.z : slab.scale.x, sz = yawQuarter ? slab.scale.x : slab.scale.z, top = slab.position.y + slab.scale.y / 2;
    const x0 = slab.position.x - sx / 2 + .2, x1 = slab.position.x + sx / 2 - .2, z0 = slab.position.z - sz / 2 + .2, z1 = slab.position.z + sz / 2 - .2;
    const wall = (cx: number, cz: number, w: number, d: number) => b.box(`wall${index}`, cx, top + .45, cz, w, .9, d);
    wall((x0 + x1) / 2, z0, x1 - x0 + .4, .4); wall((x0 + x1) / 2, z1, x1 - x0 + .4, .4); wall(x0, (z0 + z1) / 2, .4, z1 - z0 - .4); wall(x1, (z0 + z1) / 2, .4, z1 - z0 - .4);
    // 垛口：沿四边等距，转角各留一块
    const merlon = (cx: number, cz: number, w: number, d: number) => b.box(`merlon${index}`, cx, top + .9 + .27, cz, w, .54, d);
    for (const z of [z0, z1]) { const count = Math.max(2, Math.round((x1 - x0) / 1.4)); for (let i = 0; i <= count; i++) merlon(x0 + (x1 - x0) * i / count, z, .82, .46); }
    for (const x of [x0, x1]) { const count = Math.max(2, Math.round((z1 - z0) / 1.4)); for (let i = 1; i < count; i++) merlon(x, z0 + (z1 - z0) * i / count, .46, .82); }
  });
  return b.parts().slice(0, room);
}

import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, transportColors, type TransportDefinition } from "./parts";
import { commercialChassis, commercialLights, commercialMirrors } from "./everydayCommercialVehicleBatchOne";
import { flatFrontCommercialCab } from "./everydayCommercialVehicleBatchThree";

// 道路清洗/绿化洒水完整整车，不是旧真空吸污车更换所装液体：独立前低喷、底泵管路和后水炮操作台。
// https://www.fulongmagroup.com/water-truck-flm5250gssdf6/
export const everydayCommercialVehicleBatchFive: TransportDefinition[] = [
  { name: "前低喷后水炮操作台道路洒水汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "道路洒水车", "市政绿化水车", "独立底泵前低喷管路", "后水炮操作平台"], create: () => {
    const parts: ModelPart[] = [...commercialChassis(2.5, 8.1, .49, [-2.8, 1.6, 2.8], .05), ...flatFrontCommercialCab(-2.8), ...commercialLights(2.5, -3.93, 4.1, .96), ...commercialMirrors(2.4, 2.55, -3.77), part("椭圆截面且两端真实封闭的道路清水储罐", "lathe", "#a6b7b4", [0, 2, .9], [1.1, 1, .9], [90, 0, 0], { profile: [{ x: 0, y: -2.4 }, { x: .65, y: -2.35 }, { x: .95, y: -2.15 }, { x: 1, y: -1.9 }, { x: 1, y: 1.9 }, { x: .95, y: 2.15 }, { x: .65, y: 2.35 }, { x: 0, y: 2.4 }] }), cylinder("实际固定在水罐顶部的检修加水口", [0, 2.93, .9], [.48, .08, .48], transportColors.dark)];
    for (const z of [-.75, 2.5]) {
      const profile = [{ x: -1.15, y: .6 }, { x: 1.15, y: .6 }, { x: 1.15, y: 1.7 }, ...Array.from({ length: 9 }, (_, index) => { const x = 1 - index / 4; return { x, y: 2 - .9 * Math.sqrt(1 - (x / 1.1) ** 2) }; }), { x: -1.15, y: 1.7 }];
      parts.push(part("顶部真正随椭圆罐底弯曲且落在车架上的承罐鞍座", "extrude", transportColors.dark, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: .3, profile }), ring("沿水罐真实外周收紧且接入承罐座的环带", transportColors.trim, 1.04, .04, 2, .12, { position: { x: 0, y: 2, z }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 1.1, y: 1, z: .9 } }));
    }
    const cannonHole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [Math.cos(angle) * .105, 3.7 + Math.sin(angle) * .105]; });
    parts.push(polygon("为水炮进水立管真正留孔的后操作平台", transportColors.dark, [[-1.15, 2.8], [1.15, 2.8], [1.15, 4], [-1.15, 4]], .16, [0, 1.04, 0], [cannonHole]), box("与操作台及车架后端相接的固定尾灯横围", [0, .98, 4.01], [2.4, .36, .16], transportColors.body), cylinder("固定在后操作平台下方的独立洒水压力泵", [0, .8, 3.4], [.4, .5, .4], transportColors.dark, [90, 0, 0]));
    for (const side of [-1, 1]) {
      parts.push(box("从后承罐座实际接到操作台的连续承托边梁", [side * .8, 1, 3.3], [.2, .25, 1.4], transportColors.dark), box("从操作台下方实际吊住水泵的独立安装座", [side * .3, .96, 3.4], [.25, .3, .2], transportColors.dark));
      for (const z of [3.35, 3.95]) parts.push(rod("从操作平台真正升起的安全护栏立杆", [side * 1.1, 1.2, z], [side * 1.1, 2.2, z], .035, transportColors.dark));
      parts.push(rod("后水炮操作平台两侧连续安全扶手", [side * 1.1, 2.2, 3.35], [side * 1.1, 2.2, 3.95], .035, transportColors.dark), rod("给人员登台留出中央入口的后扶手", [side * .35, 2.2, 3.95], [side * 1.1, 2.2, 3.95], .035, transportColors.dark), rod("后平台入口两侧实际落地板的短立杆", [side * .35, 1.2, 3.95], [side * .35, 2.2, 3.95], .035, transportColors.dark));
    }
    parts.push(ring("支承水炮且不封堵进水穿孔的实际底法兰", transportColors.trim, .2, .13, 1.23, .1, { position: { x: 0, y: 1.23, z: 3.7 } }), cylinder("穿过平台管孔并连到水炮回转头的竖向压力管", [0, 1.68, 3.7], [.15, 1, .15], transportColors.dark), cylinder("实际接在立管顶端的水炮回转接头", [0, 2.18, 3.7], [.28, .15, .28], transportColors.body));
    const cannonStart: Triple = [0, 2.18, 3.7], cannonEnd: Triple = [1.1, 2.6, 3.7], barrel = rod("从回转接头连续伸出的斜向水炮炮管", cannonStart, cannonEnd, .14, transportColors.dark);
    parts.push(barrel, part("具有真实开放圆孔的外扩水炮喷嘴", "lathe", transportColors.trim, cannonEnd, [1, 1, 1], [barrel.rotation.x, barrel.rotation.y, barrel.rotation.z], { profile: [{ x: .045, y: -.1 }, { x: .075, y: -.1 }, { x: .09, y: .1 }, { x: .065, y: .1 }, { x: .045, y: -.1 }] }), rod("接在水炮回转头两侧的实际操纵手柄", [-.38, 2.18, 3.7], [.18, 2.18, 3.7], .035, transportColors.dark));
    parts.push(part("从罐后出水口绕平台外侧接入下置水泵的供水管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .045, path: [{ x: .9, y: 1.65, z: 3 }, { x: 1.28, y: 1.4, z: 3.4 }, { x: 1.28, y: .8, z: 3.4 }, { x: .1, y: .8, z: 3.4 }] }), part("由水泵穿过真实平台管孔接向水炮立管的支路", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .045, path: [{ x: 0, y: .8, z: 3.4 }, { x: 0, y: .88, z: 3.7 }, { x: 0, y: 1.6, z: 3.7 }] }), part("避开车桥和承罐座且在车架下方连续到前喷杆的压力管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .04, path: [{ x: 0, y: .8, z: 3.4 }, { x: .4, y: .65, z: 3.55 }, { x: .68, y: .35, z: 3.55 }, { x: .68, y: .35, z: -3.65 }, { x: .68, y: .62, z: -4.02 }] }), cylinder("连接左右前低位冲洗喷嘴的横向实际分水杆", [0, .62, -4.02], [.08, 2.4, .08], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) {
      parts.push(rod("前喷分水杆从实际车架前端获得的固定支臂", [side * .68, .54, -3.6], [side * .68, .62, -4.02], .065, transportColors.dark), rod("横向分水杆接入独立鸭嘴喷头的短支管", [side * .9, .62, -4.02], [side * .9, .55, -4.1], .08, transportColors.dark));
      const mouth = polygon("具有真实扁长出水孔的道路前低喷鸭嘴", transportColors.trim, [[-.18, -.045], [.18, -.045], [.18, .045], [-.18, .045]], .1, [side * .9, .55, -4.17], [[[-.14, -.02], [.14, -.02], [.14, .02], [-.14, .02]]]);
      mouth.rotation.x = 90;
      parts.push(mouth);
    }
    for (const y of [.35, .65, .95]) parts.push(box("位于操作台后方而不被平台盖住的登台踏板", [0, y, 4.15], [.65, .12, .3], transportColors.dark));
    for (const side of [-1, 1]) parts.push(rod("从车尾承围真实挂下的后登台梯边杆", [side * .3, .29, 4.15], [side * .3, 1.2, 4], .045, transportColors.dark));
    return parts;
  } },
];

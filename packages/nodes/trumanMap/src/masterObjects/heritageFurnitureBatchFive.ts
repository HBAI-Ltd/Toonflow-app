import { part, type ModelPart } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { combineMeshes, lobe } from "../natureParts";
import { cylinder, cone, material, type MasterPrototype } from "./parts";

// 参考结构类型及实际尺度，几何均为本地原创，不收录馆藏照片或模型。
// https://artmuseum.princeton.edu/art/collections/objects/36437
// https://umaine.edu/hudsonmuseum/hudson-museum-scavenger-hunt/bamileki-stool/
// https://hoodmuseum.dartmouth.edu/objects/s.972.189

export const heritageFurnitureBatchFiveObjects: MasterPrototype[] = [
  { name: "叉顶单木凿阶登梯", theme: "异域", itemType: "家具", build: () => {
    const outline: [number, number][] = [[.0845, 0], [-.0845, 0]];
    for (let step = 0; step < 7; step++) {
      const y = .15 + step * .185;
      outline.push([-.0845, y], [-.025, y], [-.0845, y + .105]);
    }
    outline.push([-.0845, 1.48], [.0845, 1.48]);
    const stem = polygon("由整干前表面真实凿入而不外挂踏杆的连续梯身", material.wood, outline, .17);
    stem.vertices = stem.vertices!.map(point => ({ x: point.y - .085, y: point.z, z: point.x }));
    const fork = polygon("从梯身延续成两根承靠叉尖的完整木叉", material.wood, [[-.085, 1.37], [.085, 1.37], [.105, 1.5], [.205, 1.74], [.18, 1.775], [.1, 1.675], [0, 1.515], [-.1, 1.675], [-.18, 1.775], [-.205, 1.74], [-.105, 1.5]], .169, [0, 0, .0845]);
    fork.rotation.x = -90;
    return [combineMeshes("叉顶与七处凿阶接成一根可单独放置的木梯", material.wood, [stem, fork])];
  } },
  { name: "贯通镂格束腰礼凳", theme: "异域", itemType: "家具", build: () => {
    const parts: ModelPart[] = [
      part("中央微凹且外缘连续上翘的整木承座盘", "lathe", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .418 }, { x: .235, y: .418 }, { x: .26, y: .436 }, { x: .26, y: .472 }, { x: .238, y: .484 }, { x: 0, y: .467 }] }),
      part("接地而中部真实镂空的闭合下足环", "lathe", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .192, y: 0 }, { x: .245, y: 0 }, { x: .248, y: .042 }, { x: .227, y: .055 }, { x: .192, y: .055 }, { x: .192, y: 0 }] }),
      part("镂格交点处不填实中腔的束腰承环", "lathe", material.wood, [0, .226, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .154, y: -.012 }, { x: .185, y: -.012 }, { x: .185, y: .012 }, { x: .154, y: .012 }, { x: .154, y: -.012 }] }),
    ];
    for (const direction of [-1, 1]) {
      const ribs = Array.from({ length: 12 }, (_, index) => {
        const a = index * Math.PI / 6;
        return tapered("真正由下足环跨过束腰而托住座盘的斜向木格肋", material.wood, [
          [Math.cos(a) * .231, .039, Math.sin(a) * .231],
          [Math.cos(a + direction * Math.PI / 12) * .171, .226, Math.sin(a + direction * Math.PI / 12) * .171],
          [Math.cos(a + direction * Math.PI / 6) * .231, .429, Math.sin(a + direction * Math.PI / 6) * .231],
        ], [.017, .017, .017]);
      });
      parts.push(combineMeshes(direction < 0 ? "顺向贯通镂格承重肋" : "逆向交叉镂格承重肋", material.wood, ribs));
    }
    return parts;
  } },
  { name: "举臂人形承座礼凳", theme: "异域", itemType: "家具", build: () => {
    const parts: ModelPart[] = [
      cylinder("人形与双膝共同落在其上的椭圆凳足台", [0, .022, .012], [.31, .044, .25], material.wood),
      cylinder("头顶与双手实际托住的椭圆承座盘", [0, .4345, 0], [.32, .045, .28], material.wood),
      lobe("承载头肩而保持连续的雕刻上躯", material.wood, [0, .242, .016], [.16, .18, .1]),
      lobe("连接躯干和屈膝双腿的宽胯", material.wood, [0, .14, .015], [.19, .095, .15]),
      cylinder("头与肩胸相接的短颈", [0, .329, 0], [.055, .06, .055], material.wood),
      lobe("从颈部一直承到凳盘下缘的完整头颅", material.wood, [0, .374, -.004], [.095, .11, .1]),
      lobe("与头和座盘同时相接的后梳发髻", material.dark, [0, .402, .012], [.11, .055, .11]),
      cone("从面部向前突出的短鼻梁", [0, .375, -.049], [.025, .027, .02], material.wood, [-90, 0, 0]),
    ];
    for (const side of [-1, 1]) {
      parts.push(
        tapered("由胯经前膝折回足踝的连续跪腿", material.wood, [[side * .06, .14, .02], [side * .075, .077, -.035], [side * .06, .068, .084]], [.03, .03, .022]),
        lobe("落在底台上的宽膝承点", material.wood, [side * .07, .075, -.035], [.095, .075, .12]),
        lobe("沿底台向后平放的完整足", material.wood, [side * .06, .052, .1], [.07, .035, .12]),
        tapered("由肩外展后向上举到承座盘的整根手臂", material.wood, [[side * .055, .3, 0], [side * .13, .29, -.005], [side * .112, .401, -.008]], [.024, .02, .017]),
        lobe("掌面接入凳盘底面而不悬挂的手掌", material.wood, [side * .112, .408, -.006], [.047, .018, .055]),
        lobe("嵌在面部而非贴在外面的双眼", material.dark, [side * .022, .385, -.042], [.01, .007, .009]),
        lobe("与头颅连续相接的耳部", material.wood, [side * .042, .373, -.002], [.025, .037, .024]),
      );
    }
    return parts;
  } },
];

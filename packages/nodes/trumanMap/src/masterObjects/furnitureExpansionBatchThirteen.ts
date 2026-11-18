import { type ModelPart, type Triple } from "../assetModelParts";
import { box, ball, rod, cord, material, type MasterPrototype } from "./parts";
import { curvedBand } from "./furnitureExpansionBatchSix";
import { clothPanel } from "./furnitureExpansionBatchNine";
import { caster } from "./furnitureExpansionBatchTwelve";

function linenSack(x: number, color: string): ModelPart[] {
  const top: Triple[] = [[x - .153, .89, -.26], [x + .153, .89, -.26], [x + .153, .89, .26], [x - .153, .89, .26]], bottom: Triple[] = [[x - .12, .33, -.22], [x + .12, .33, -.22], [x + .12, .33, .22], [x - .12, .33, .22]];
  return [clothPanel("挂袋真正封底而仍保留上方开放袋口的厚布底", bottom, color, .009), ...top.map((point, index) => clothPanel("从上方袋框悬到小底而不是实心布方块的袋壁", [point, top[(index + 1) % 4]!, bottom[(index + 1) % 4]!, bottom[index]!], color, .006))];
}

export const furnitureExpansionBatchThirteenObjects: MasterPrototype[] = [
  { name: "双面斜槽图书推车", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].flatMap(z => caster(x * .44, z * .27))), ...[-1, 1].map(z => box("真正托住四轮与A架脚端的通长底梁", [0, .255, z * .28], [1.02, .05, .07], material.dark)), ...[-1, 1].map(x => rod("连接前后底梁的端部横联", [x * .48, .255, -.32], [x * .48, .255, .32], .035, material.dark))];
    for (const side of [-1, 1]) parts.push(...[-1, 1].map(z => rod("侧面从两个脚端汇到同一高点的完整A承架", [side * .48, .24, z * .32], [side * .48, 1.18, 0], .035)), { ...cord("回接到顶层槽托两端的完整U形推把", [[0, .944, -.19], [0, 1.22, -.19], [0, 1.22, .19], [0, .944, .19]], .014, material.dark), position: { x: side * .49, y: 0, z: 0 } });
    for (const y of [.32, .64, .96]) {
      parts.push(...[-1, 1].map(side => box("两面都朝中央背挡倾斜的独立承书槽底", [0, y, side * .156], [.92, .025, .32], material.wood, [-side * 12, 0, 0])), box("同层两面书槽共用的真实中央靠书挡", [0, y + .06, 0], [.92, .2, .015], material.wood));
      for (const side of [-1, 1]) parts.push(curvedBand("跨接A架并分别顶住两块斜槽底的真实V形承托", [[-.32, y + .01], [0, y - .058], [.32, y + .01]], .045, [side * .46, 0, 0], .025, material.steel));
    }
    return parts;
  } },
  { name: "双端挂袋客房服务车", theme: "现代", itemType: "家具", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].flatMap(z => caster(x * .58, z * .24))), box("连续承接中舱及两端挂袋框的完整低底架", [0, .2575, 0], [1.55, .065, .64], material.dark), box("中舱后侧真实封闭的储物背板", [0, .615, .2825], [.8, .65, .025], material.dark), ...[-1, 1].map(x => box("承接储物层和上工作盘的两块完整侧壁", [x * .4, .615, 0], [.035, .65, .59], material.dark)), ...[.3025, .52, .74].map(y => box("中舱面向使用者真正开放的独立储物层", [0, y, 0], [.78, .025, .56], material.ivory)), box("上方工作盘真实封闭的厚底板", [0, .925, 0], [.84, .025, .64], material.ivory), ...[-1, 1].flatMap(side => [box("工作盘左右挡住物品滑落的短边", [side * .4075, .9725, 0], [.025, .07, .64], material.ivory), box("工作盘前后完整薄挡边", [0, .9725, side * .3075], [.79, .07, .025], material.ivory)])];
    for (const side of [-1, 1]) {
      const x = side * .62;
      parts.push(...linenSack(x, side < 0 ? material.wood : material.red), { ...cord("从底架两端升起并贯通前后推手的完整立框", [[.73, .275, -.25], [.78, 1.04, -.25], [.78, 1.04, .25], [.73, .275, .25]], .017, material.steel), rotation: { x: 0, y: side < 0 ? 180 : 0, z: 0 } });
      const mouth: Triple[] = [[x - .16, .9, -.27], [x + .16, .9, -.27], [x + .16, .9, .27], [x - .16, .9, .27]];
      for (let index = 0; index < 4; index++) parts.push(rod("每个挂袋四边真正闭合的独立承口框", mouth[index]!, mouth[(index + 1) % 4]!, .024));
      for (const z of [-.22, .22]) parts.push(rod("将袋框接回中舱侧壁的水平承臂", [side * .4, .9, z], [side * .46, .9, z], .02));
    }
    return parts;
  } },
  { name: "圆冠拱架酒店行李车", theme: "现代", itemType: "家具", build: () => {
    const brass = "#ac9464", parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].flatMap(z => caster(x * .43, z * .27))), box("四角脚轮真正承接的完整行李承台", [0, .265, 0], [1.1, .07, .75], material.dark), box("铺在行李承台上而不会代替实体底板的防滑软毡", [0, .306, 0], [1.02, .012, .67], material.red), ...[-1, 1].flatMap(side => [box("长边保护墙面和旅客箱包的软防撞边", [0, .265, side * .3725], [1.1, .06, .025], material.dark), box("端部与长边相接的短防撞边", [side * .5475, .265, 0], [.025, .06, .72], material.dark)])];
    for (const side of [-1, 1]) parts.push({ ...cord("从两角整根拱起并合到圆冠的纵深端架", [[0, .29, -.3], [0, 1.45, -.3], [0, 1.7, -.22], [0, 1.82, 0], [0, 1.7, .22], [0, 1.45, .3], [0, .29, .3]], .025, brass), position: { x: side * .47, y: 0, z: 0 } }, { ...cord("两端回接拱架直柱而非悬空的小推把", [[.47, 1, -.3], [.53, 1, -.18], [.53, 1, .18], [.47, 1, .3]], .018, brass), rotation: { x: 0, y: side < 0 ? 180 : 0, z: 0 } }, ball("圆冠接梁处封住管端的金属连接帽", [side * .47, 1.82, 0], [.067, .067, .067], brass));
    parts.push(rod("两座端拱顶点间真正贯通且能挂衣的承重长杆", [-.47, 1.82, 0], [.47, 1.82, 0], .03, brass));
    return parts;
  } },
];

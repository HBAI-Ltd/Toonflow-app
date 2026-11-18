import { part, type ModelPart } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, strut, type TransportDefinition } from "./parts";

// 山路敞座滑竿：悬在两根长抬杆内侧的曲背座框和独立吊脚踏，不沿用封闭抬轿的实体厢。
// 两长竹竿与中间特制座椅的类型参考：https://dfz.shaanxi.gov.cn/zslm/fzzlk/xbsxsxz/xbsxz/sls_16207/201405/P020240923605822114828.pdf
export const easternHorseCarriageBatchSeven: TransportDefinition[] = [
  { name: "双长杆曲背敞座滑竿", theme: "中式", tags: ["影视", "人力肩舆", "山路滑竿", "完整开放抬行座具", "双竹抬杆与悬挂脚踏"], create: () => {
    const bamboo = "#a09b70", wood = "#81795b", binding = "#655b46";
    const parts: ModelPart[] = [box("前端吊脚踏在停放时接地的整幅承足板", [0, .035, -.69], [.58, .07, .30], wood)];
    for (const side of [-1, 1]) {
      parts.push(part("沿座框两侧连续贯通且有真实竹腔的长抬杆", "lathe", bamboo, [side * .39, .64, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .023, y: -1.95 }, { x: .031, y: -1.95 }, { x: .031, y: 1.95 }, { x: .023, y: 1.95 }, { x: .023, y: -1.95 }] }), box("座面下方沿前后贯通的独立侧承框", [side * .27, .43, .10], [.06, .08, .72], wood), box("停放时承后座框的短直脚", [side * .25, .2125, .41], [.052, .425, .09], wood), strut("从座框前角连续斜落到独立脚踏的吊撑", [side * .24, .43, -.23], [side * .24, .055, -.69], .035, bamboo), tapered("由后座榫位连续向上后弯的完整粗背框", bamboo, [[side * .27, .43, .43], [side * .29, .75, .54], [side * .31, 1.12, .66]], [.026, .027, .025]));
      for (const z of [-1.5, -.9, -.3, .3, .9, 1.5]) parts.push(part("抬杆表面有厚度且内接竹壁的自然节箍", "lathe", "#8f8c64", [side * .39, .64, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: .0295, y: -.012 }, { x: .036, y: -.012 }, { x: .036, y: .012 }, { x: .0295, y: .012 }, { x: .0295, y: -.012 }] }));
      for (const [poleZ, frameZ] of [[-.34, -.20], [.46, .40]]) parts.push(strut("把低座框荷载引向长抬杆的实际斜承竹撑", [side * .27, .43, frameZ!], [side * .39, .64, poleZ!], .052, bamboo), cylinder("抬杆和座框斜撑交会处的真实短绑带箍", [side * .39, .64, poleZ!], [.079, .052, .079], binding, [90, 0, 0]));
    }
    for (const z of [-.23, .43]) parts.push(box("两侧座承框之间完整搭接的座面横枨", [0, .43, z], [.59, .08, .06], wood));
    for (let index = 0; index < 8; index++) parts.push(box("真实留缝而共同搭在左右座框上的独立宽竹片", [0, .483, -.195 + index * .085], [.56, .026, .073], bamboo));
    for (const x of [-.22, -.11, 0, .11, .22]) parts.push(tapered("从后座横枨连续上弯并连接上下背横枨的独立竹背条", bamboo, [[x, .46, .40], [x, .69, .48], [x, .90, .62], [x, 1.12, .66]], [.017, .019, .019, .017]));
    parts.push(strut("实接五片竹背和两端曲框的完整上搭脑", [-.33, 1.12, .66], [.33, 1.12, .66], .048, bamboo), strut("背中段横向贯通曲条而不悬空的承腰枨", [-.31, .87, .60], [.31, .87, .60], .038, bamboo));
    return parts;
  } },
];

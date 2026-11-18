import type { ModelPart } from "../assetModelParts";
import { box, design, pipe } from "./structures";
import { hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";

const concrete = "#aeb4a8", paving = "#c0bdab", metal = "#73877d";

export const everydayOutdoorSpaceBatchNineDesigns = [
  design("连续阶台街式滑板广场", "中央H形跨台把直行台面与两侧真实下落口分开，前方正常步高阶路配连续滑杆，错向侧坡接入上下场，后场双坡通向高台并从端部弧坡回到平场，外围巡场步道保持贯通", () => {
    const outer: [number, number][] = [[-30, -36], [30, -36], [30, 36], [-30, 36]], inner: [number, number][] = [[-27, -32], [27, -32], [27, 32], [-27, 32]], center: [number, number][] = [[-7, -10], [7, -10], [7, -2], [3, -2], [3, 2], [7, 2], [7, 10], [-7, 10], [-7, 2], [-3, 2], [-3, -2], [-7, -2]], parts: ModelPart[] = [hardPlan("整片街式滑板公共场地共用落地基础", concrete, outer, .18), hardPlan("保持一体平整并连接全部滑行路径的内场", concrete, inner, .02, [0, .18, 0]), hardPlan("外围始终贯通且与内场同高的巡场步道", paving, outer, .02, [0, .18, 0], [inner]), hardPlan("中央真实开双侧跌口且中部仍能直行的H形跨台", concrete, center, 1.4), profileBody("左前方从平场接到跨台的完整侧向实坡", concrete, [[0, 0], [6, 0], [6, 1.4], [0, .2]], 8, [-13, 0, -6]), profileBody("右后方反向接入跨台的完整侧向实坡", concrete, [[0, 0], [6, 0], [6, 1.4], [0, .2]], 8, [13, 0, 6], 180), riseSteps("前场连续接到中央跨台的六级正常步高宽阶", .2, 1.4, 6, .35, 6, [0, 0, -12.1]), pipe("前场宽阶上方贯通且两端悬出踏步的完整滑杆", [0, 1, -12.1], [0, 2.2, -10], .055)];
    parts.push(pipe("滑杆下端实际接在第一踏步上的短支柱", [0, .4, -11.925], [0, 1.1, -11.925], .055), pipe("滑杆上端实际接在最高踏步上的短支柱", [0, 1.4, -10.175], [0, 2.1, -10.175], .055));
    for (const [x, z] of [[7, -6], [-7, 6]]) parts.push(pipe("跨台未设侧坡的立缘上真实接触台面的磨边管", [x!, 1.43, z! - 4], [x!, 1.43, z! + 4], .06));
    for (const x of [-3, 3]) parts.push(pipe("中央直行桥与两侧跌口之间的完整磨边管", [x, 1.43, -2], [x, 1.43, 2], .06));
    parts.push(box("后场两条大坡与端部回接共用的完整高台", 0, 1.1, 26, 44, 2.2, 4, concrete));
    for (const side of [-1, 1]) {
      parts.push(profileBody("后场两侧平场连续进入高台的宽幅上行实坡", concrete, [[0, 0], [8, 0], [8, 2.2], [0, .2]], 12, [side * 16, 0, 16], -90));
      const curved: [number, number][] = [[0, 0], [4, 0], [4, 2.2], [2, 2.2]];
      for (let i = 1; i <= 8; i++) { const a = Math.PI / 2 * (1 - i / 8); curved.push([2 * Math.sin(a), .2 + 2 * (1 - Math.cos(a))]); }
      parts.push(profileBody("高台端部带水平接台段且落回平场的连续弧坡", concrete, curved, 4, [side * 26, 0, 26], side > 0 ? 180 : 0), box("后场高台背缘为人行上阶口留空的连续护墙", side * 11.675, 2.75, 27.95, 20.65, 1.1, .1, metal));
    }
    const backStair = riseSteps("外围巡场步道实际上到后场高台的独立宽阶", .2, 2.2, 10, .35, 2.5, [0, 0, 31.5]); backStair.rotation.y = 90; parts.push(backStair);
    for (const x of [-1.2, 1.2]) {
      parts.push(pipe("后场人行宽阶两侧完整连续扶手", [x, 1.3, 31.5], [x, 3.3, 28], .065));
      for (const [z, floor, top] of [[31.325, .4, 1.4], [29.925, 1.2, 2.2], [28.175, 2.2, 3.2]]) parts.push(pipe("人行上阶扶手真实接到相应踏步的独立立柱", [x, floor!, z!], [x, top!, z!], .065));
    }
    return parts;
  }, "设施", "现代"),
];

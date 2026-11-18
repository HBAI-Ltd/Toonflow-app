import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, colors, cylinder, design, pipe, rail } from "./structures";
import { polygon, tapered } from "../masterNature/shared";

// 主类型按主体承载/水工构造区分，不把直线/曲线重力坝、材料或尺寸变化再计为主项。
// https://www.usbr.gov/pn/about/dams/index.html
// https://www.publications.usace.army.mil/Portals/76/Publications/EngineerManuals/EM_1110-2-1614.pdf
// https://www.dpird.nsw.gov.au/fishing/recreational/resources/artificial-reef/sydney-offshore-artificial-reef
// 均为原创场景模型；没有水压、潮汐或结构分析运行时。
const stone = "#a5afa5", rock = "#909a8f", clay = "#a47c65";

function damPrism(name: string, points: [number, number][], width: number, color = stone): ModelPart {
  return part(name, "extrude", color, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: width, profile: points.map(([z, y]) => ({ x: -z, y })) });
}

function crestGuard(width: number, y: number, z: number): ModelPart[] {
  return [pipe("坝顶通长安全扶手", [-width / 2, y + 1.1, z], [width / 2, y + 1.1, z], .09), ...Array.from({ length: 9 }, (_, i) => pipe("坝顶栏杆竖直支柱", [-width / 2 + i * width / 8, y, z], [-width / 2 + i * width / 8, y + 1.1, z], .07))];
}

function archFootprint(outer: number, inner: number): [number, number][] {
  return [...Array.from({ length: 14 }, (_, i): [number, number] => { const a = (-55 + i * 110 / 13) * Math.PI / 180; return [Math.sin(a) * outer, Math.cos(a) * outer - 40]; }), ...Array.from({ length: 14 }, (_, i): [number, number] => { const a = (55 - i * 110 / 13) * Math.PI / 180; return [Math.sin(a) * inner, Math.cos(a) * inner - 40]; })];
}

function archBand(name: string, outer: number, inner: number, y: number, height: number, color = stone): ModelPart {
  return part(name, "extrude", color, [0, y + height / 2, 0], [1, 1, 1], [-90, 0, 0], { depth: height, profile: archFootprint(outer, inner).map(([x, z]) => ({ x, y: -z })) });
}

export const landscapeSpaceBatchThreeDesigns = [
  design("坝顶通道混凝土重力坝", "近直立迎水面与宽厚下游坝趾形成完整重力截面，坝顶窄通道和两侧护栏属于同一主体，不将曲线或材料款另计", () => [
    damPrism("以完整自重抵抗水压的厚实坝体", [[-6, 0], [-5, 28], [-1, 28], [16, 0]], 64),
    box("坝顶连续检修步道", 0, 28.12, -3, 65, .24, 4.4, "#7b8d86"),
    ...crestGuard(64, 28.24, -5), ...crestGuard(64, 28.24, -1),
    ...[-1, 1].map(s => box("岸侧与坝体相接的承压锚肩", s * 31.8, 6.5, 0, 3, 13, 14, rock)),
    box("下游坝趾连续排水明沟底", 0, .12, 17.2, 62, .24, 1.3),
    ...[-1, 1].map(s => box("坝趾排水沟边缘", 0, .4, 17.2 + s * .6, 62, .4, .12)),
  ], "建筑", "现代"),
  design("峡谷薄壁承压拱坝", "上游凸出的薄壁弧坝把水荷载传向两岸岩肩，坝体背后保持完整谷底净空，区别于自重式厚三角坝体", () => [
    archBand("以水平拱作用向两岸传力的连续薄坝壁", 40, 37.4, 0, 26),
    archBand("与薄坝壁同弧线的窄坝顶道路", 40.25, 37.15, 26, .25, "#7b8d86"),
    archBand("上游弧线完整安全挡墙", 40.28, 40.1, 26.25, 1.15),
    archBand("下游弧线完整安全挡墙", 37.3, 37.12, 26.25, 1.15),
    ...[-1, 1].map(s => part("收拢峡口并承接拱推力的完整岩肩", "box", rock, [s * 32.5, 10, -17], [6, 20, 9], [0, s * 20, 0])),
    ...[-1, 1].map(s => box("拱端与岩肩连接的厚锚块", s * 31.2, 13, -17, 3.8, 26, 4.5)),
  ], "建筑", "现代"),
  design("空腹支墩平板挡水坝", "连续倾斜迎水薄板由分隔的三角支墩承托，支墩之间保持开放空腹，水荷载经肋架传给独立地基", () => {
    const parts: ModelPart[] = [damPrism("连接全部支墩的倾斜防水面板", [[-5, 0], [-1, 22], [0, 22], [-4, 0]], 64), box("支墩顶部连续检修道", 0, 22.15, -.5, 65, .3, 3), ...crestGuard(64, 22.3, -1.85), ...crestGuard(64, 22.3, .85)];
    for (const x of [-28, -20, -12, -4, 4, 12, 20, 28]) {
      const p = damPrism("真实空腹之间的三角混凝土支墩", [[-4, 0], [.1, 22], [13, 0]], .85); p.position.x = x;
      parts.push(p, box("每片支墩独立分压基础", x, .3, 4, 2.8, .6, 20));
    }
    parts.push(box("支墩中段贯通稳定横梁", 0, 8.5, 4.8, 57, .35, .45), box("下游检修横向步道", 0, .78, 11.4, 58, .18, 2));
    return parts;
  }, "建筑", "现代"),
  design("中心黏土芯分区填筑坝", "宽缓上下游填筑壳包围竖向低渗黏土心墙，过滤过渡带位于壳体与心墙之间，端面显示完整不同分区而非整块土坡改色", () => [
    damPrism("上游完整宽缓填筑壳", [[-27, 0], [-2.4, 22], [-2, 22], [-4.5, 0]], 72, rock),
    damPrism("下游完整宽缓填筑壳", [[4.5, 0], [2, 22], [2.4, 22], [27, 0]], 72, colors.earth),
    damPrism("连续到底的低渗黏土心墙", [[-3.2, 0], [-1.5, 22], [1.5, 22], [3.2, 0]], 72, clay),
    damPrism("上游砂砾过渡过滤带", [[-4.5, 0], [-2, 22], [-1.5, 22], [-3.2, 0]], 72, "#bfaf87"),
    damPrism("下游砂砾过渡过滤带", [[3.2, 0], [1.5, 22], [2, 22], [4.5, 0]], 72, "#bfaf87"),
    box("坝顶沿全宽连续检修道", 0, 22.12, 0, 73, .24, 4.8, "#8e9b8f"),
    ...crestGuard(72, 22.24, -2.25), ...crestGuard(72, 22.24, 2.25),
    box("下游排水棱体底脚", 0, .45, 25, 72, .9, 5, rock),
  ], "建筑", "现代"),
  design("反弧挑檐防浪海堤", "厚实海堤迎浪面逐渐上弯并向海侧回挑，把上冲水舌导回外海，后侧独立检修道不占据反弧凹面", () => [
    damPrism("连续闭合且真实回挑的反弧海堤截面", [[-5, 0], [-4, .5], [-2.5, 1.3], [-1.2, 2.8], [-.5, 4.8], [-.4, 6], [-.7, 7], [-1.4, 7.8], [-2.3, 8.15], [-2.6, 8.8], [-1.8, 8.95], [-.7, 8.55], [.1, 7.9], [3.5, 7.9], [3.5, 0]], 60),
    box("陆侧连续防滑检修道", 0, 7.96, 2, 60, .12, 2.5, "#8b9b91"),
    ...crestGuard(59, 8.02, 3.1),
    box("堤趾前方低位抗冲护脚", 0, .2, -5.8, 61, .4, 2.2, rock),
    ...[-1, 1].map(s => box("堤段端部止缝收边", s * 30, 3.8, .8, .25, 7.6, 5.4)),
  ], "建筑", "现代"),
  design("开孔消浪沉箱防波堤", "面向来浪的两排真实通孔通向沉箱内空腔，腔后实壁与隔板耗散往复水流，顶盖和沉箱底板形成完整重力海堤", () => [
    box("沉箱连续压载底板", 0, .3, 0, 61, .6, 11),
    box("沉箱背浪侧完整实壁", 0, 6.3, 4.8, 60, 11.4, .4),
    ...[-1, 1].map(s => box("沉箱左右端封闭隔壁", s * 30, 6.3, 0, .4, 11.4, 10)),
    ...[-24, -12, 0, 12, 24].map(x => box("波浪腔内部完整分隔墙", x, 6.3, 0, .3, 11.4, 9.8)),
    box("迎浪面下方连续承压底墙", 0, 1.7, -4.8, 60, 2.2, .4),
    box("两排开孔之间连续横楣", 0, 6.4, -4.8, 60, .4, .4),
    box("上排孔口上方完整压墙", 0, 11, -4.8, 60, 2, .4),
    ...Array.from({ length: 11 }, (_, i) => box("开孔面保留实厚的承重竖柱", -30 + i * 6, 6.4, -4.8, .5, 7.2, .4)),
    box("完整封盖消浪腔的顶层检修板", 0, 12.25, 0, 61, .5, 10.8),
    ...crestGuard(60, 12.5, 4.8),
  ], "建筑", "现代"),
  design("岸线潮汐海水浴场", "面海孔墙让海水在挡浪浅池中交换，岸侧宽阶台供休息和进入水面，池体独立保留真实端壁和流通孔而非海面贴蓝片", () => [
    box("潮汐浴场完整承水并托住岸后全部阶台的连续基底", 0, .25, 2, 54, .5, 30),
    ...[-1, 1].map(s => box("海水浴场左右侧边挡浪墙", s * 26.7, 1.25, 0, .6, 2, 26)),
    box("临海孔墙下方连续低墙", 0, .65, -12.6, 54, .8, .6),
    box("临海孔墙上方连续挡浪压顶", 0, 1.85, -12.6, 54, .5, .6),
    ...Array.from({ length: 14 }, (_, i) => box("海水交换孔之间实际承重墙墩", -26 + i * 4, 1.325, -12.6, .6, .55, .6)),
    box("浴场静态浅海水面", 0, 1.2, -.5, 52.6, .035, 23.4, colors.water),
    ...Array.from({ length: 5 }, (_, i) => box("岸侧面向浴场的宽休息阶台", 0, .5 + (i + 1) * .32 / 2, 10.5 + i * 1.2, 53, (i + 1) * .32, 1.25)),
    ...[-1, 1].map(s => { const path: Triple[] = [[s * 2.5, 1.6, 7], [s * 2.5, 1.6, 9.875], [s * 2.5, 1.92, 10.5], [s * 2.5, 2.24, 11.7], [s * 2.5, 2.56, 12.9], [s * 2.5, 2.88, 14.1], [s * 2.5, 3.2, 15.3]]; return tapered("随池底和完整岸侧阶台逐级上升的连续扶手", colors.metal, path, path.map(() => .0375)); }),
    ...[-1, 1].flatMap(s => [[7, .5], [11.7, 1.14], [15.3, 2.1]].map(([z, y]) => pipe("柱脚真实接到池底与相应踏步的扶手立柱", [s * 2.5, y!, z!], [s * 2.5, y! + 1.1, z!], .065))),
  ], "建筑", "现代"),
  design("开放多层潜礁塔", "锥收主框、不同标高透孔栖息板和对角撑构成可穿流立体礁体，水流可从四面进入并穿过板孔，整体是完整海底人工生境塔", () => {
    const parts: ModelPart[] = [];
    const levels = [.4, 3.6, 6.8, 10];
    const corners = (i: number): Triple[] => { const y = levels[i]!, w = 14 - i * 10 / 3, d = 12 - i * 8 / 3; return [[-w / 2, y, -d / 2], [w / 2, y, -d / 2], [w / 2, y, d / 2], [-w / 2, y, d / 2]]; };
    for (let i = 0; i < 4; i++) {
      const points = corners(i);
      for (let j = 0; j < 4; j++) parts.push(rail(points[j]!, points[(j + 1) % 4]!, .22, rock));
      if (i < 3) {
        const next = corners(i + 1);
        for (let j = 0; j < 4; j++) parts.push(rail(points[j]!, next[j]!, .24, rock), rail(points[j]!, next[(j + 1) % 4]!, .13, rock));
        const w = 14 - i * 10 / 3 - .2, d = 12 - i * 8 / 3 - .2;
        const holes: [number, number][][] = Array.from({ length: 6 }, (_, k) => { const x = (k % 3 - 1) * w / 3, z = (Math.floor(k / 3) - .5) * d / 2; return [[x - w * .11, z - d * .13], [x + w * .11, z - d * .13], [x + w * .11, z + d * .13], [x - w * .11, z + d * .13]]; });
        const plate = polygon("四边承接框架且拥有六个真实通孔的栖息板", stone, [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], .16, [0, levels[i]! - .08, 0], holes);
        // ACT: 硬质薄板在盖面和孔壁处分开顶点，避免平均法线把平面渲染成三角凹面；仍在512顶点预算内。
        plate.vertices = plate.indices!.map(index => plate.vertices![index]!);
        delete plate.indices;
        parts.push(plate);
      }
    }
    parts.push(...[-1, 1].flatMap(x => [-1, 1].map(z => box("海床上独立宽展抗沉礁脚", x * 7, .16, z * 6, 1.1, .32, 1.1, rock))));
    return parts;
  }, "建筑", "现代"),
];

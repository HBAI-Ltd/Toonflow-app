import type { ModelPart, Triple } from "../assetModelParts";
import { body } from "../masterNature/fishForms";
import { tapered } from "../masterNature/shared";
import { combineMeshes, lobe } from "../natureParts";
import { box, cylinder, cord, plate, loop, cone, cup, piercedPanel, type MasterPrototype } from "./parts";

// 仅参考独立整雕的形体类型；程序化几何为本地原创，不使用远端模型、照片或预烘焙几何。
// https://britishmuseum.iro.bl.uk/entities/publication/5bf77d6d-67f1-4c58-a268-db829885bc0b
// https://www.lacma.org/sites/default/files/module-uploads/E4E_Olmec.pdf
// https://inah.gob.mx/boletines/el-inah-localiza-una-escultura-prehispanica-de-chac-mool-en-patzcuaro-michoacan
// https://www.inah.gob.mx/foto-del-dia/coatlicue-majestuosidad-escultorica-mexica
// https://www.guggenheim.org/wp-content/uploads/2004/08/guggenheim-pub-the-aztec-empire-2004.pdf

function uprightBody(name: string, color: string, sections: [number, number, number, number][]): ModelPart {
  const result = body(name, sections.map(([y, z, width, depth]): [number, number, number, number] => [y, -z, width, depth]), color);
  result.rotation.x = -90;
  return result;
}

export const heritageFurnitureBatchSixObjects: MasterPrototype[] = [
  { name: "长首贴臂摩艾整石像", theme: "异域", itemType: "器物", build: () => {
    const stone = "#a6a594";
    const parts: ModelPart[] = [
      uprightBody("由平底腰腹延续到宽肩而没有独立腿的完整石躯", stone, [[0, .015, .31, .18], [.3, .01, .37, .215], [.78, .015, .46, .22], [1.02, .02, .48, .20], [1.15, .025, .37, .175], [1.25, .015, .21, .16]]),
      uprightBody("长额阔眉深眼窝和前突方下颌形成的整块长首", stone, [[1.05, -.015, .19, .16], [1.26, -.035, .26, .23], [1.6, 0, .30, .21], [1.83, .015, .31, .155], [1.98, -.02, .32, .235], [2.34, 0, .31, .23], [2.42, .025, .26, .20]]),
      plate("从眉间长至口上的厚直鼻梁", [0, 0, -.235], [[-.04, 1.58], [.04, 1.58], [.075, 1.8], [.055, 2], [-.055, 2], [-.075, 1.8]], .18, stone, [0, 0, 0]),
      plate("与方下颌连接且两端收窄的上唇", [0, 1.454, -.235], [[-.13, -.02], [-.09, .025], [.09, .025], [.13, -.02]], .075, stone, [0, 0, 0]),
      plate("口缝下方有厚度的下唇和颏面", [0, 1.405, -.232], [[-.12, .012], [.12, .012], [.1, -.032], [-.1, -.032]], .072, stone, [0, 0, 0]),
    ];
    for (const side of [-1, 1]) {
      parts.push(
        plate("贴合长首侧壁且明显向下延长的整只耳", [0, 0, .012], [[side * .26, 1.41], [side * .325, 1.45], [side * .335, 1.89], [side * .295, 1.98], [side * .26, 1.89]], .105, stone, [0, 0, 0]),
        cord("从眉间向两侧压低的粗重眉弓", [[0, 1.995, -.24], [side * .14, 1.975, -.235], [side * .24, 1.945, -.14]], .035, stone),
        tapered("石躯两侧紧贴身体下伸并向腹前收回的长臂", stone, [[side * .37, 1.035, .02], [side * .39, .58, -.035], [side * .28, .31, -.145], [side * .14, .265, -.19]], [.064, .053, .037, .025]),
        tapered("由颈下向肩头分开的浅凸锁骨", stone, [[0, 1.115, -.13], [side * .14, 1.075, -.155], [side * .28, 1.025, -.11]], [.018, .018, .013]),
      );
    }
    return parts;
  } },
  { name: "盔冠阔颌奥尔梅克巨石首", theme: "异域", itemType: "器物", build: () => {
    const stone = "#8c9082", capStone = "#7b8175";
    const parts: ModelPart[] = [
      uprightBody("没有颈座和身体且下颌直接平落地面的完整巨首", stone, [[0, .06, .52, .43], [.2, .055, .64, .5], [.67, .06, .71, .54], [1.07, .07, .72, .43], [1.22, .07, .715, .4], [1.42, .07, .70, .5], [1.72, .07, .51, .35], [1.84, .07, .25, .12]]),
      uprightBody("完整包住上额与后脑而有下缘帽带的圆顶盔冠", capStone, [[1.36, .07, .71, .515], [1.43, .07, .735, .535], [1.55, .07, .71, .51], [1.75, .07, .51, .365], [1.86, .07, .25, .135]]),
      plate("上窄下阔且从眉根向前伸出的整鼻", [0, 0, -.43], [[-.1, 1.25], [.1, 1.25], [.16, .96], [.235, .79], [.19, .725], [-.19, .725], [-.235, .79], [-.16, .96]], .25, stone, [0, 0, 0]),
      lobe("口鼻下方完整隆起的上唇与人中", stone, [0, .575, -.424], [.75, .24, .30]),
      lobe("宽厚而两端向下收的完整下唇", stone, [0, .417, -.421], [.72, .19, .29]),
      plate("厚唇之间嵌入石体而非悬浮的窄口缝", [0, .486, -.473], [[-.245, -.018], [-.15, .015], [.15, .015], [.245, -.018], [.18, -.025], [-.18, -.025]], .042, "#646e63", [0, 0, 0]),
    ];
    for (const side of [-1, 1]) {
      parts.push(
        lobe("鼻翼两侧与下颌连续相接的宽颊面", stone, [side * .36, .66, -.318], [.67, .72, .40]),
        plate("眼窝上缘从鼻根连向外颞的厚斜眉", [0, 0, -.334], [[side * .06, 1.22], [side * .22, 1.31], [side * .47, 1.28], [side * .51, 1.19], [side * .26, 1.19], [side * .09, 1.13]], .20, stone, [0, 0, 0]),
        tapered("深目下缘自然形成的厚下眼睑", stone, [[side * .105, 1.10, -.343], [side * .28, 1.055, -.37], [side * .46, 1.12, -.30]], [.024, .028, .022]),
        loop("实嵌于两侧头体的卷曲耳廓", [side * .67, .96, .04], .105, .035, [0, 0, 90], stone),
        plate("从盔侧绕耳垂落至宽颌的连续护颊带", [side * .655, 0, .055], [[-.1, .3], [.055, .31], [.085, .84], [.05, 1.38], [-.06, 1.38], [-.045, .84]], .075, capStone, [0, side * 90, 0]),
      );
    }
    return parts;
  } },
  { name: "屈膝侧首腹托盘查克穆尔礼像", theme: "异域", itemType: "家具", build: () => {
    const stone = "#aaa28c";
    const parts: ModelPart[] = [
      box("卧像与双肘脚掌均接在其上的整体矮石台", [0, .04, .025], [.57, .08, 1.04], stone),
      lobe("从背靠低台而延续到屈腿根部的石质臀胯", stone, [0, .12, .05], [.37, .13, .28]),
      body("从腰腹向后上方倾起而非平躺的人形胸背", [[-.36, .455, .145, .11], [-.22, .365, .18, .13], [.025, .25, .17, .13]], stone),
      tapered("由倾斜肩背连续托起侧转头部的短颈", stone, [[0, .47, -.29], [0, .565, -.35]], [.075, .07]),
      lobe("向侧方直立而没有仰向天空的完整头颅", stone, [0, .655, -.35], [.25, .28, .225]),
      cylinder("紧接头顶的扁平环冠", [0, .769, -.35], [.285, .062, .265], stone),
      cone("在侧首面上向侧方突出的鼻", [.108, .65, -.35], [.046, .06, .04], stone, [0, 0, -90]),
      cup("实际落在腹部和双手之间而内部敞开的礼仪浅盘", [0, .363, .024], .165, .077, stone),
      lobe("侧首颏部与头颅相接的平厚下颌", stone, [.043, .568, -.35], [.17, .1, .2]),
    ];
    for (const side of [-1, 1]) {
      parts.push(
        tapered("由肩经落台支肘再回向腹部托盘的整根手臂", stone, [[side * .14, .43, -.24], [side * .218, .13, -.23], [side * .15, .396, .025]], [.055, .055, .039]),
        lobe("从下方扶住敞口礼盘的宽手掌", stone, [side * .15, .397, .024], [.085, .065, .085]),
        tapered("从低胯抬起前膝再落到足踝的完整屈腿", stone, [[side * .1, .245, .035], [side * .133, .51, .265], [side * .133, .145, .47]], [.082, .079, .048]),
        lobe("实际落到石台顶面而没有悬空的长脚掌", stone, [side * .133, .121, .445], [.13, .1, .20]),
        lobe("侧首前面嵌在眼部的两道浅眼", "#787d70", [.102, .678, -.35 + side * .047], [.021, .017, .022]),
      );
    }
    return parts;
  } },
  { name: "双蛇首蛇裙科阿特利奎整石像", theme: "异域", itemType: "器物", build: () => {
    const stone = "#8e907f", recess = "#6e7769";
    const parts: ModelPart[] = [
      box("整座异形雕塑连续落地的薄基石", [0, .05, -.015], [1.5, .1, .94], stone),
      uprightBody("围住双腿且与上身连体的收腰整裙芯", stone, [[.27, 0, .55, .34], [.6, 0, .51, .32], [.94, 0, .47, .295], [1.33, 0, .42, .27]]),
      uprightBody("承住蛇颈及外展双肩的完整宽胸躯", stone, [[1.27, 0, .38, .25], [1.49, .015, .48, .29], [1.78, .025, .49, .29], [1.94, .02, .25, .19]]),
      lobe("蛇裙带下方垂到胸腹中央的头骨饰坠", stone, [0, 1.28, -.325], [.27, .29, .18]),
      box("与头骨饰坠上下连接的宽齿颌", [0, 1.18, -.35], [.19, .105, .12], stone),
    ];
    for (const side of [-1, 1]) {
      parts.push(
        lobe("裙下直接接到基台的宽大兽爪足", stone, [side * .33, .2, -.17], [.47, .3, .59]),
        tapered("爪足和裙内腿根之间的实际承重短踝", stone, [[side * .33, .23, 0], [side * .285, .57, 0]], [.13, .12]),
        tapered("由肩向外折后再举到胸侧的完整粗臂", stone, [[side * .39, 1.76, .025], [side * .63, 1.58, -.01], [side * .61, 1.87, -.13]], [.13, .115, .105]),
        lobe("折臂末端相连的宽爪掌", stone, [side * .61, 1.89, -.15], [.24, .22, .18]),
        tapered("由无头胸顶升起并承接独立蛇首的粗蛇颈", stone, [[side * .15, 1.89, .015], [side * .33, 2.11, 0], [side * .32, 2.22, -.01]], [.15, .145, .13]),
      );
      const outline: [number, number][] = [[0, 2.38], [side * .1, 2.52], [side * .38, 2.57], [side * .49, 2.42], [side * .46, 2.19], [side * .25, 2.14], [side * .14, 2.28], [0, 2.3]];
      const mouth: [number, number][] = [[side * .09, 2.345], [side * .155, 2.402], [side * .32, 2.36], [side * .29, 2.28], [side * .17, 2.292]];
      parts.push(piercedPanel("内向相合且嘴腔真正开通的整只蛇首", [0, 0, .08], outline, [mouth], .32, stone, [-90, 0, 0]), lobe("贴合蛇首前面的圆眼", recess, [side * .365, 2.446, -.24], [.067, .067, .022]));
      for (const x of [.155, .235]) parts.push(cone("从蛇首上颌长入真实口腔的独立尖牙", [side * x, 2.378, -.12], [.035, .068, .07], stone, [180, 0, 0]));
      for (const digit of [-1, 0, 1]) {
        parts.push(tapered("向前下弯并实际落台的完整足爪趾", stone, [[side * .33 + digit * .09, .205, -.34], [side * .33 + digit * .095, .155, -.43], [side * .33 + digit * .10, .1, -.455]], [.041, .032, .009]), tapered("举起爪掌内收而不脱手的指爪", stone, [[side * .61 + digit * .055, 1.92, -.19], [side * .61 + digit * .055, 2.005, -.25], [side * .61 + digit * .05, 1.94, -.285]], [.026, .021, .005]));
      }
    }
    for (const front of [-1, 1]) {
      const coils = Array.from({ length: 6 }, (_, index) => {
        const origin = (index - 2.5) * .139;
        const points = Array.from({ length: 6 }, (_, step): Triple => {
          const y = .32 + step * .19, x = origin + Math.sin(step * Math.PI / 2 + index * Math.PI) * .06;
          const width = .55 - (y - .27) / 1.06 * .13, depth = .34 - (y - .27) / 1.06 * .07;
          return [x, y, front * (depth * Math.sqrt(Math.max(.05, 1 - (x / width) ** 2)) + .002)];
        });
        return tapered("连续沿裙面交叠而不填死裙外空隙的完整蛇形长纹", stone, points, points.map(() => .039));
      });
      parts.push(combineMeshes(front < 0 ? "蛇裙正面完整相连的六条盘蛇" : "蛇裙背面完整相连的六条盘蛇", stone, coils));
    }
    const necklace: Triple[] = [[-.39, 1.77, -.16], [-.27, 1.57, -.255], [0, 1.365, -.29], [.27, 1.57, -.255], [.39, 1.77, -.16]];
    parts.push(cord("将胸前各饰坠连续连到肩部的粗项链", necklace, .035, stone));
    for (let index = 0; index < 8; index++) {
      const x = (index - 3.5) * .087, y = 1.36 + Math.abs(x) * 1.03, z = -.29 + Math.abs(x) * .14;
      if (index % 2) parts.push(lobe("沿项链交错垂挂的心形整饰坠", stone, [x, y, z], [.10, .15, .08]));
      else parts.push(plate("从项链垂下且根部相连的手形整饰坠", [x, y, z], [[-.035, .045], [.03, .045], [.034, -.045], [.02, -.06], [.01, -.045], [0, -.065], [-.01, -.045], [-.025, -.063], [-.037, -.03]], .06, stone, [0, 0, 0]));
    }
    for (const side of [-1, 1]) parts.push(lobe("头骨饰坠面部的深眼窝", recess, [side * .052, 1.315, -.382], [.047, .045, .02]));
    for (const x of [-.057, -.019, .019, .057]) parts.push(box("与宽齿颌连续而不悬浮的头骨齿", [x, 1.162, -.414], [.025, .052, .025], stone));
    return parts;
  } },
];

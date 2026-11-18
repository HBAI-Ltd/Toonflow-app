import { combineMeshes, design, eyes, leaf, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodyStripe } from "./landAnimalExpansionBatchEighteen";

const hide = "#a8b19a";
const pale = "#c6caad";
const dark = "#7d8e78";

// https://animals.sandiegozoo.org/animals/wild-cattle
function capeBuffalo(): ModelPart[] {
  const parts: ModelPart[] = [body("非洲野牛颈短胸深且无印度野牛高肩峰的宽重躯", [[-.98, .92, .27, .43], [-.44, .98, .54, .64], [.6, 1.03, .51, .62], [.87, 1.04, .28, .4]], hide), tapered("非洲野牛从前胸向前下伸的厚短颈", hide, [[0, 1.19, .66], [0, 1.23, 1.17]], [.35, .28]), lobe("非洲野牛宽深而额部巨大的短颅", hide, [0, 1.23, 1.49], [.67, .75, .8]), lobe("非洲野牛平宽而带厚上唇的鼻吻", pale, [0, 1.04, 1.82], [.52, .31, .33]), lobe("非洲野牛宽阔深下颌", hide, [0, .91, 1.51], [.49, .27, .67]), ...eyes([0, 1.42, 1.54], .24, .043), lobe("非洲野牛左右角基在额头中央真正相连的宽角盾", pale, [0, 1.57, 1.285], [.55, .24, .33]), tapered("非洲野牛长而下垂的尾轴", hide, [[0, .88, -.87], [.085, .48, -1.17], [.15, .29, -1.37]], [.065, .038, .019]), lobe("非洲野牛较窄的下垂尾毛簇", dark, [.15, .29, -1.37], [.1, .25, .1])];
  for (const side of [-1, 1]) {
    parts.push(pointed("非洲野牛角盾两侧先向下外展再上内弯的钩角", pale, [[side * .16, 1.59, 1.3], [side * .45, 1.4, 1.28], [side * .69, 1.47, 1.3], [side * .77, 1.71, 1.37], [side * .65, 1.875, 1.44]], [.119, .105, .078, .043, 0]), leaf("非洲野牛角下水平侧展并下垂的宽耳", hide, [side * .265, 1.405, 1.15], .2, .31, [15, side * 23, -side * 101]));
    for (const front of [true, false]) {
      const z = front ? .61 : -.67, ankle: Triple = [side * .475, .14, z + .054];
      parts.push(tapered("非洲野牛粗短而支撑宽胸的承重四肢", hide, [[side * .37, front ? .95 : .83, z], [side * .53, .46, z - .025], ankle], front ? [.18, .12, .067] : [.195, .125, .068]));
      const hoofs: ModelPart[] = [];
      for (const toe of [-1, 1]) hoofs.push(lobe("非洲野牛宽而分离的主蹄瓣", dark, [ankle[0] + toe * .059, .073, ankle[2] + .061], [.104, .13, .235]), lobe("非洲野牛主蹄后上方的小悬蹄", dark, [ankle[0] + toe * .069, .191, ankle[2] - .037], [.048, .068, .061]));
      parts.push(combineMeshes("非洲野牛四肢末端真实分开的宽偶蹄", dark, hoofs));
    }
  }
  return parts;
}

// https://www.sanbi.org/animal-of-the-week/african-wild-dog/
function africanWildDog(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-.49, .43, .095, .135], [-.18, .47, .155, .22], [.32, .5, .145, .215], [.5, .53, .08, .14]];
  const parts: ModelPart[] = [body("非洲野犬细腰深胸且四肢高挑的耐跑躯", sections, hide), tapered("非洲野犬向前举起的较粗短颈", hide, [[0, .59, .37], [0, .695, .58]], [.093, .072]), lobe("非洲野犬后宽而前吻较短的颅", hide, [0, .735, .66], [.225, .25, .3]), lobe("非洲野犬短而宽的深色鼻吻", dark, [0, .666, .815], [.17, .115, .18]), lobe("非洲野犬较短的下颌", hide, [0, .605, .72], [.16, .09, .26]), ...eyes([0, .785, .705], .078, .018), tapered("非洲野犬较粗的下垂毛尾", hide, [[0, .4, -.43], [.065, .23, -.7], [.16, .17, -.94]], [.042, .048, .032]), lobe("非洲野犬蓬松而明显浅色的宽尾尖", pale, [.165, .17, -.94], [.095, .13, .18])];
  for (const side of [-1, 1]) {
    parts.push(lobe("非洲野犬远大于普通犬比例的直立圆盘耳", dark, [side * .09, .91, .562], [.165, .245, .08], [-5, 0, -side * 13]), lobe("非洲野犬宽圆耳内下部的浅色毛", pale, [side * .095, .902, .596], [.106, .155, .027], [-5, 0, -side * 13]));
    for (const front of [true, false]) {
      const z = front ? .32 : -.33, ankle: Triple = [side * .148, .06, z + .046];
      parts.push(tapered(front ? "非洲野犬细直而较长的跑行前肢" : "非洲野犬长胫与高跟的轻巧后肢", hide, front ? [[side * .112, .49, z], [side * .173, .29, z - .017], ankle] : [[side * .116, .415, z], [side * .195, .28, z + .079], [side * .168, .135, z - .034], ankle], front ? [.041, .026, .017] : [.055, .032, .02, .017]), lobe("非洲野犬小而紧实的长途跑行掌", dark, [ankle[0], .037, ankle[2] + .033], front ? [.088, .055, .132] : [.077, .051, .117]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) {
        const x = ankle[0] + (i - 1.5) * .018;
        toes.push(lobe("非洲野犬前后足都只保留四枚功能肉趾", dark, [x, .03, ankle[2] + .086], [.022, .034, .052]), pointed("非洲野犬四趾端短而有力的固定外露爪", pale, [[x, .032, ankle[2] + .104], [x, .015, ankle[2] + .143]], [.007, 0]));
      }
      parts.push(combineMeshes("非洲野犬不添加家犬悬拇趾的完整四趾掌", dark, toes));
    }
  }
  const patches: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) patches.push(bodyStripe(sections, side, -.36 + i * .225 + (side < 0 ? .034 : 0), .048 + i % 2 * .016, -.74 + i % 2 * .37, i % 2 ? dark : pale, 1.36 - i % 3 * .21));
  for (const color of [dark, pale]) parts.push(combineMeshes("非洲野犬贴合窄躯的浅深不规则块状毛面", color, patches.filter(patch => patch.color === color)));
  return parts;
}

// https://animaldiversity.org/accounts/Elaphurus_davidianus/
function pereDavidsDeer(): ModelPart[] {
  const parts: ModelPart[] = [body("麋鹿驴式长而深腹的低腰躯", [[-.77, .74, .14, .24], [-.3, .78, .28, .41], [.4, .8, .265, .4], [.66, .85, .145, .25]], hide), tapered("麋鹿比普通赤鹿更长而下部深的颈", hide, [[0, .96, .47], [0, 1.22, .73], [0, 1.36, .88]], [.17, .135, .092]), lobe("麋鹿长面马状而非驼鹿大垂唇的颅", hide, [0, 1.335, 1.03], [.285, .37, .57], [15, 0, 0]), lobe("麋鹿较长而圆的鼻吻", pale, [0, 1.17, 1.29], [.22, .2, .25]), ...eyes([0, 1.423, 1.075], .102, .027), tapered("麋鹿长于一般鹿并垂到后踝附近的驴式尾", hide, [[0, .73, -.7], [.045, .55, -.84], [.08, .47, -.925]], [.052, .04, .022]), lobe("麋鹿长尾末端深色毛穗", dark, [.08, .47, -.925], [.095, .245, .105])];
  for (const side of [-1, 1]) {
    parts.push(leaf("麋鹿较长而窄圆的侧耳", pale, [side * .108, 1.435, .846], .115, .255, [-10, side * 26, -side * 52]), tapered("麋鹿近角座就分出且向后直伸的长后支", pale, [[side * .1, 1.49, .92], [side * .16, 1.79, .695], [side * .225, 2.095, .41]], [.032, .025, .008]), pointed("麋鹿前支先向前而后反向弯回的主角梁", pale, [[side * .105, 1.52, .925], [side * .22, 1.77, 1.05], [side * .355, 1.99, .91], [side * .43, 2.17, .675]], [.03, .024, .016, 0]), pointed("麋鹿前支上向后而不是向前伸的下叉", pale, [[side * .23, 1.795, 1.035], [side * .34, 1.99, .755], [side * .345, 2.1, .59]], [.018, .013, 0]), pointed("麋鹿前支上向后反伸的上叉", pale, [[side * .34, 1.965, .935], [side * .49, 2.105, .8], [side * .565, 2.22, .65]], [.015, .01, 0]));
    for (const front of [true, false]) {
      const z = front ? .43 : -.52, ankle: Triple = [side * .215, .122, z + .014];
      parts.push(tapered("麋鹿支撑深腹并适于湿地的较粗肢", hide, [[side * .16, front ? .765 : .685, z], [side * .25, .36, z - .04], ankle], [.069, .044, .029]));
      const hoofs: ModelPart[] = [];
      for (const toe of [-1, 1]) {
        const x = ankle[0] + toe * .044;
        hoofs.push(polygon("麋鹿湿地上明显分开而宽展的牛式蹄瓣", dark, [[x - .032, ankle[2] - .039], [x - .044, ankle[2] + .102], [x - .025, ankle[2] + .146], [x + .025, ankle[2] + .146], [x + .044, ankle[2] + .102], [x + .032, ankle[2] - .039]], .075, [0, .017, 0]), lobe("麋鹿宽主蹄后上方的小悬蹄", dark, [ankle[0] + toe * .058, .134, ankle[2] - .032], [.035, .055, .055]));
      }
      parts.push(combineMeshes("麋鹿趾间隙真实贯通的宽偶蹄足", dark, hoofs));
    }
  }
  const throat: ModelPart[] = [];
  for (let i = 0; i < 13; i++) { const t = i / 12; throat.push(leaf("麋鹿深颈下连贯下垂的喉鬃", pale, [Math.sin(i * 2.4) * .043, .89 + t * .37, .62 + t * .225], .028, .17, [157, i * 137.5 % 360, 0])); }
  parts.push(combineMeshes("麋鹿与长颈腹面相接的完整喉鬃", pale, throat));
  return parts;
}

export const landAnimalExpansionBatchTwentyDesigns: MasterNatureDesign[] = [
  design("capeBuffalo", "非洲野牛", "动物", capeBuffalo, ["Syncerus caffer", "非洲水牛", "融合额角盾下外再上内钩角及宽短重胸躯"]),
  design("africanWildDog", "非洲野犬", "动物", africanWildDog, ["Lycaon pictus", "非洲猎犬", "彩绘犬", "高细跑行四肢巨大圆耳前后均四趾且无悬拇趾"]),
  design("pereDavidsDeer", "麋鹿", "动物", pereDavidsDeer, ["Elaphurus davidianus", "四不像", "长深颈驴式长尾湿地宽蹄及低处分叉反向骨角"]),
];

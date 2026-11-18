import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";
import { convexValve } from "./bivalveArchitectures";

const skin = "#9cab9b";
const fin = "#bcc7af";
const armor = "#b1bba0";
const pale = "#d4cfb5";
const dark = "#788d7b";

// https://repository.library.noaa.gov/view/noaa/54370/noaa_54370_DS1.pdf
function strapToothedWhale(): ModelPart[] {
  const parts: ModelPart[] = [body("带齿喙鲸长梭躯体与渐细尾柄", [[1.64, .89, .19, .24], [.84, .85, .44, .51], [-.78, .67, .39, .4], [-1.97, .4, .13, .17], [-2.74, .31, .035, .066]], skin), lobe("带齿喙鲸低斜额顶", skin, [0, .93, 1.63], [.6, .5, .75]), tapered("带齿喙鲸较长而平直的上喙", skin, [[0, .83, 1.72], [0, .825, 2.35], [0, .81, 2.72]], [.135, .065, .018]), tapered("带齿喙鲸与平直上喙分开的下颌", fin, [[0, .71, 1.74], [0, .735, 2.39], [0, .75, 2.75]], [.12, .057, .015]), ...eyes([0, 1.01, 1.76], .223, .033), membrane("带齿喙鲸躯后部小镰形背鳍", fin, [[0, .98, -1.13], [0, 1.46, -1.32], [0, 1.36, -1.5], [0, .69, -1.68]]), ...tail([0, .3, -2.77], .64, false)];
  for (const side of [-1, 1]) {
    parts.push(membrane("带齿喙鲸可贴躯的短窄胸鳍", fin, [[side * .3, .65, 1.07], [side * .69, .36, .67], [side * .64, .29, .43], [side * .29, .56, .81]]), part("从下颌中段长出且越过上吻的真实扁带状牙", "extrude", pale, [side * .072, .75, 2.4], [1, 1, 1], [-30, 0, 0], { depth: .065, profile: [{ x: 0, y: 0 }, { x: side * .035, y: .13 }, { x: side * .026, y: .27 }, { x: -side * .056, y: .355 }, { x: -side * .069, y: .348 }, { x: side * .009, y: .26 }, { x: side * .017, y: .132 }, { x: -side * .015, y: .007 }] }), tapered("带牙尖端真正向上翘的小齿尖", pale, [[-side * .004, 1.056, 2.25], [-side * .004, 1.09, 2.232]], [.011, .0006]));
  }
  const blowhole = part("喙鲸额后独立的新月形呼吸孔缘", "lathe", dark, [0, 1.146, 1.23], [1, 1, 1], [0, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .046, y: .014 }, { x: .039, y: .025 }, { x: .027, y: .022 }, { x: .023, y: .01 }] }); parts.push(blowhole); return parts;
}

// https://www.fisheries.noaa.gov/species/bairds-beaked-whale
function bairdsBeakedWhale(): ModelPart[] {
  const parts: ModelPart[] = [body("贝氏喙鲸长而圆厚的巨大胸腹", [[2.77, 1.52, .27, .34], [1.03, 1.34, .75, .86], [-1.57, 1.13, .72, .74], [-3.75, .71, .3, .35], [-4.83, .5, .073, .13]], skin), lobe("贝氏喙鲸隆起而与长喙区分的圆额", skin, [0, 1.66, 2.61], [1.01, 1.03, 1.41]), tapered("贝氏喙鲸细而明显伸出的上吻", skin, [[0, 1.39, 2.86], [0, 1.37, 3.72], [0, 1.34, 4.27]], [.19, .1, .025]), tapered("贝氏喙鲸超过上吻的较长下颌", fin, [[0, 1.17, 2.83], [0, 1.19, 3.86], [0, 1.24, 4.43]], [.18, .081, .027]), ...eyes([0, 1.68, 2.9], .367, .055), membrane("贝氏喙鲸很靠后的低小圆背鳍", fin, [[0, 1.23, -2.28], [0, 1.83, -2.55], [0, 1.85, -2.78], [0, 1.49, -3], [0, .91, -3.13]]), ...tail([0, .51, -4.86], 1.1, false)];
  for (const side of [-1, 1]) {
    parts.push(membrane("贝氏喙鲸宽短且末端圆收的胸鳍", fin, [[side * .57, 1.04, 1.77], [side * 1.16, .61, 1.33], [side * 1.26, .43, .99], [side * 1.03, .43, .85], [side * .53, .87, 1.37]]));
    for (const rear of [false, true]) parts.push(tapered("贝氏喙鲸下颌前端两对均可外露的锥牙", pale, [[side * (rear ? .065 : .038), 1.26, rear ? 4.04 : 4.32], [side * (rear ? .066 : .041), rear ? 1.35 : 1.42, rear ? 4.045 : 4.33]], [rear ? .025 : .033, .003]));
  }
  parts.push(part("贝氏喙鲸额后呼吸孔的厚壁开口", "lathe", dark, [0, 2.04, 1.95], [1, 1, 1], [0, 0, 0], { profile: [{ x: .05, y: 0 }, { x: .067, y: .019 }, { x: .058, y: .035 }, { x: .038, y: .03 }, { x: .031, y: .007 }] })); return parts;
}

// https://npolar.no/en/species/hooded-seal/
function hoodedSeal(): ModelPart[] {
  const parts: ModelPart[] = [body("冠海豹厚前胸向后收窄的真海豹躯体", [[.65, .41, .14, .17], [.13, .37, .36, .36], [-.61, .24, .21, .22], [-1.06, .14, .047, .066]], skin), tapered("冠海豹粗短的前颈", skin, [[0, .4, .42], [0, .48, .79]], [.19, .16]), lobe("冠海豹相对宽而扁的头部", skin, [0, .5, .84], [.38, .35, .41]), lobe("鼻囊下方宽钝的短吻", fin, [0, .43, 1.01], [.29, .18, .23]), ...eyes([0, .56, .874], .144, .034)];
  for (const side of [-1, 1]) {
    parts.push(lobe("冠海豹鼻额上部相连的双瓣充气鼻囊", dark, [side * .096, .68, .988], [.23, .47, .32]), membrane("冠海豹短而有独立五趾缘的前鳍", fin, [[side * .25, .28, .31], [side * .52, .1, .28], [side * .59, .04, .08], [side * .49, .045, .04], [side * .39, .08, .11], [side * .24, .2, .05]]), membrane("真海豹向后展出的宽蹼后鳍", fin, [[side * .036, .14, -1], [side * .31, .05, -1.25], [side * .38, .035, -1.49], [side * .12, .023, -1.53], [side * .034, .08, -1.2]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("冠海豹短吻两侧弯曲的触须", pale, [[side * .086, .445, 1.06], [side * (.15 + i * .009), .42 - i * .01, 1.13], [side * (.2 + i * .012), .4 - i * .01, 1.13 - i * .018]], [.0019, .0013, .0002]));
  }
  // ACT: 同一物种只登记一个主素材；鼻囊充气是其识别形态，不另列雌雄或收囊状态。
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC5341551/
function crabeaterSeal(): ModelPart[] {
  const parts: ModelPart[] = [body("食蟹海豹修长且肩颈不膨大的体干", [[.67, .37, .13, .15], [.06, .3, .27, .28], [-.67, .2, .18, .18], [-1.08, .13, .038, .052]], skin), tapered("食蟹海豹较细的延长颈", skin, [[0, .37, .5], [0, .43, .84]], [.14, .105]), lobe("食蟹海豹窄长而非豹海豹宽壮的后颅", skin, [0, .46, .9], [.26, .27, .35]), tapered("食蟹海豹张口时分离的细长上吻", skin, [[0, .47, .9], [0, .465, 1.19]], [.083, .04]), tapered("食蟹海豹深下颌及向内收的下牙床", fin, [[0, .3, .87], [0, .31, 1.21]], [.079, .031]), ...eyes([0, .515, .944], .099, .035)];
  for (const side of [-1, 1]) {
    parts.push(membrane("食蟹海豹狭而短的带爪前鳍", fin, [[side * .19, .22, .38], [side * .47, .08, .2], [side * .43, .045, -.03], [side * .24, .15, .1]]), membrane("食蟹海豹向后展开的长蹼后鳍", fin, [[side * .025, .12, -1.02], [side * .27, .045, -1.26], [side * .35, .02, -1.54], [side * .09, .02, -1.51], [side * .022, .08, -1.16]]));
    for (const upper of [false, true]) {
      for (let i = 0; i < 5; i++) parts.push(part("食蟹海豹五尖瓣颊齿形成留有间隙的滤筛", "extrude", pale, [side * .068, upper ? .416 : .351, .94 + i * .044], [1, 1, 1], [0, 90, upper ? 180 : 0], { depth: .009, profile: [{ x: -.019, y: 0 }, { x: -.018, y: .009 }, { x: -.012, y: .021 }, { x: -.009, y: .008 }, { x: -.005, y: .025 }, { x: 0, y: .01 }, { x: .004, y: .031 }, { x: .008, y: .01 }, { x: .013, y: .024 }, { x: .016, y: .008 }, { x: .02, y: .016 }, { x: .022, y: 0 }] }));
      parts.push(tapered("食蟹海豹颊齿前方的单独短犬牙", pale, [[side * .039, upper ? .414 : .351, 1.164], [side * .037, upper ? .365 : .4, 1.168]], [.009, .0007]));
    }
  }
  return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/bramble-shark/
function brambleShark(): ModelPart[] {
  const parts: ModelPart[] = [body("棘鲨短钝头及粗厚的深海躯体", [[1.12, .46, .14, .12], [.59, .47, .28, .29], [-.38, .39, .24, .28], [-1.01, .24, .1, .14], [-1.37, .19, .03, .055]], skin), ...eyes([0, .577, .891], .192, .036), membrane("棘鲨很靠后且无前棘的小第一背鳍", fin, [[0, .6, -.53], [0, .86, -.67], [0, .8, -.81], [0, .39, -.92]]), membrane("棘鲨与前背近等大的第二背鳍", fin, [[0, .36, -1.03], [0, .57, -1.14], [0, .5, -1.28], [0, .24, -1.32]]), membrane("棘鲨几乎没有下叶的不对称尾", fin, [[0, .22, -1.31], [0, .46, -1.61], [0, .51, -1.99], [0, .28, -1.81], [0, .105, -1.52]]), tapered("棘鲨头下短而宽的口缝下缘", armor, [[-.075, .31, .98], [0, .29, 1.085], [.075, .31, .98]], [.012, .012, .012])];
  for (const side of [-1, 1]) {
    parts.push(membrane("棘鲨相对躯体偏小而圆短的胸鳍", fin, [[side * .22, .31, .55], [side * .6, .13, .25], [side * .53, .09, .03], [side * .21, .26, .19]]), membrane("棘鲨成对的小腹鳍且后方没有臀鳍", fin, [[side * .13, .23, -.74], [side * .35, .075, -.9], [side * .24, .07, -1.09], [side * .1, .21, -.94]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("棘鲨每侧独立的五道短鳃缘", dark, [[side * .25, .52, .66 - i * .058], [side * .26, .33, .66 - i * .058]], [.005, .005]));
  }
  const denticles: ModelPart[] = [];
  for (let i = 0; i < 40; i++) { const z = .62 - Math.floor(i / 5) * .19, angle = (i % 5 + .5) / 5 * Math.PI, width = .245 - Math.max(0, -z) * .07, x = Math.cos(angle) * width, y = .44 + Math.sin(angle) * (.27 - Math.max(0, -z) * .08); denticles.push(lobe("棘鲨孤立的大圆盾鳞基盘", armor, [x, y, z], [.049, .018, .05]), tapered("盾鳞基盘中央真正突起的硬刺", pale, [[x, y, z], [x * 1.05, y + .035, z - .008]], [.012, .0005])); }
  for (let i = 0; i < denticles.length; i += 16) parts.push(combineMeshes("棘鲨皮面分散而有独立基盘的粗盾刺", armor, denticles.slice(i, i + 16))); return parts;
}

// https://fishes-fnam.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?id=108750
function angularRoughshark(): ModelPart[] {
  const sections = [[.43, .21, .6], [.23, .22, 1], [-.17, .19, .94], [-.48, .14, .55], [-.64, .12, .14]];
  const contour: [number, number][] = [[0, .24], [-.075, .1], [-.135, -.087], [0, -.1], [.135, -.087], [.075, .1]];
  const vertices = sections.flatMap(([z, y, size]) => contour.map(([x, dy]) => ({ x: x * size!, y: y! + dy * size!, z: z! }))), indices: number[] = [];
  for (let row = 0; row < sections.length - 1; row++) for (let i = 0; i < contour.length; i++) { const a = row * 6 + i, b = row * 6 + (i + 1) % 6; indices.push(a, a + 6, b, b, a + 6, b + 6); }
  for (let i = 1; i < 5; i++) indices.push(0, i, i + 1, 24, 24 + i + 1, 24 + i);
  const parts: ModelPart[] = [part("尖背角鲨真正三角截面且腹部具有左右棱角的躯体", "mesh", skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), lobe("尖背角鲨小而扁的短钝头", skin, [0, .227, .45], [.23, .15, .25]), ...eyes([0, .28, .444], .081, .026), membrane("尖背角鲨高大帆状的第一背鳍", fin, [[0, .4, .22], [0, .7, .13], [0, .78, -.015], [0, .55, -.11], [0, .33, -.18]]), membrane("尖背角鲨同样高而宽的第二背鳍", fin, [[0, .3, -.24], [0, .55, -.34], [0, .58, -.43], [0, .35, -.53], [0, .18, -.58]]), tapered("第一背鳍中段真实向前斜伸的粗棘", pale, [[0, .49, .09], [0, .69, .2]], [.009, .0004]), tapered("第二背鳍中央的短硬棘", pale, [[0, .36, -.39], [0, .54, -.375]], [.007, .0004]), membrane("尖背角鲨很短而上叶较高的尾鳍", fin, [[0, .14, -.62], [0, .3, -.81], [0, .29, -.94], [0, .15, -.8], [0, .08, -.72]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("尖背角鲨低位短胸鳍", fin, [[side * .09, .16, .28], [side * .28, .085, .18], [side * .2, .07, .04], [side * .09, .13, .1]]), membrane("尖背角鲨尾前成对的短腹鳍", fin, [[side * .073, .1, -.37], [side * .22, .04, -.48], [side * .13, .035, -.59], [side * .052, .09, -.5]]), tapered("连接胸腹鳍基部的横向腹侧皮棱", armor, [[side * .126, .125, .15], [side * .12, .105, -.2], [side * .076, .095, -.38]], [.008, .008, .005]), polygon("眼后实际贯通的大型直立喷水孔缘", armor, [[-.025, -.043], [-.032, .035], [.012, .049], [.026, -.029]], .007, [side * .081, .256, .34], [[[-.015, -.03], [.012, -.021], [.003, .033], [-.022, .023]]]));
    const opening = parts.at(-1)!; opening.rotation.z = -side * 90;
    for (let i = 0; i < 5; i++) parts.push(tapered("尖背角鲨头后五道极短鳃缘", dark, [[side * .106, .23, .345 - i * .022], [side * .114, .188, .345 - i * .022]], [.0022, .0022]));
  }
  return parts;
}

// https://www.floridamuseum.ufl.edu/discover-fish/species-profiles/spiny-butterfly-ray/
function spinyButterflyRay(): ModelPart[] {
  const parts: ModelPart[] = [lobe("刺尾蝴蝶鳐非常短而低的中央体盘", skin, [0, .135, .04], [.53, .18, .78]), tapered("蝴蝶鳐明显短于体盘的短细尾", dark, [[0, .12, -.29], [0, .09, -.57], [.035, .065, -.73]], [.019, .011, .001]), ...eyes([0, .21, .288], .096, .028)];
  for (const side of [-1, 1]) parts.push(membrane("蝴蝶鳐横宽远大于前后长度的宽蝶翼", fin, [[side * .13, .165, .32], [side * .64, .14, .25], [side * 1.16, .1, -.015], [side * 1.35, .065, -.22], [side * 1.12, .055, -.39], [side * .55, .08, -.4], [side * .16, .12, -.26]]), tapered("蝴蝶鳐尾根上的独立短锯刺", pale, [[0, .14, -.36], [side * .012, .15, -.52]], [.005, .0004]), lobe("蝴蝶鳐眼后明显隆起的喷水孔缘", armor, [side * .13, .19, .19], [.07, .035, .11]));
  return parts;
}

// https://backend.orbit.dtu.dk/ws/portalfiles/portal/388813786/475-2025-A-guide-to-sharks-and-skates-in-Danish-and-adjacent-waters-1.pdf
function flapperSkate(): ModelPart[] {
  const disc = convexValve("大鳐尖吻及略内凹前翼缘组成的完整菱形体盘", [[0, 1.06], [-.16, .65], [-.59, .32], [-.81, .02], [-.52, -.37], [-.12, -.59], [.12, -.59], [.52, -.37], [.81, .02], [.59, .32], [.16, .65]], .12, .02); disc.position.y = .09; disc.color = skin;
  const parts: ModelPart[] = [disc, tapered("大鳐从体盘后方伸出的有棘长尾", skin, [[0, .12, -.52], [0, .105, -1.05], [.025, .08, -1.56]], [.039, .027, .01]), ...eyes([0, .238, .5], .145, .032), membrane("大鳐尾端之前相邻的第一小背鳍", fin, [[0, .115, -1.23], [0, .24, -1.29], [0, .17, -1.37], [0, .09, -1.38]]), membrane("大鳐几乎紧邻第一枚的第二小背鳍", fin, [[0, .105, -1.39], [0, .22, -1.44], [0, .14, -1.52], [0, .08, -1.53]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("大鳐腹鳍真正分叉为前后两瓣", fin, [[side * .11, .12, -.42], [side * .34, .065, -.53], [side * .35, .045, -.68], [side * .22, .065, -.6], [side * .31, .04, -.8], [side * .15, .05, -.83], [side * .075, .105, -.55]]));
  }
  for (let i = 0; i < 16; i++) parts.push(tapered("大鳐从尾根至首背前方的正中成列独立骨棘", pale, [[0, .15 - i * .002, -.61 - i * .039], [0, .197 - i * .003, -.618 - i * .039]], [.007, .0005]));
  // ACT: D. batis 旧文献混合蓝鳐与大鳐，本件只登记已拆分的 D. intermedius，不再增列旧广义同义主体。
  for (const item of parts) { item.position.x *= .95; item.position.y *= .95; item.position.z *= .95; item.scale.x *= .95; item.scale.y *= .95; item.scale.z *= .95; }
  return parts;
}

// https://doi.org/10.1098/rsos.200272
function titanichthys(): ModelPart[] {
  const roof = convexValve("泰坦鱼宽而低的上颅骨盾", [[-.28, .89], [-.52, .53], [-.57, -.02], [-.37, -.35], [.37, -.35], [.57, -.02], [.52, .53], [.28, .89]], .18, .055); roof.position = { x: 0, y: .77, z: .93 }; roof.color = armor;
  const lower = polygon("泰坦鱼无切割齿板的细长U形下颌", pale, [[-.38, .61], [-.52, 1.08], [-.47, 1.63], [-.22, 1.85], [.22, 1.85], [.47, 1.63], [.52, 1.08], [.38, .61]], .072, [0, .32, 0], [[[-.32, .69], [.32, .69], [.43, 1.1], [.39, 1.56], [.18, 1.75], [-.18, 1.75], [-.39, 1.56], [-.43, 1.1]]]);
  const parts: ModelPart[] = [roof, lower, body("泰坦鱼骨盾后方保守复原的柔性鱼躯", [[.74, .59, .36, .35], [-.24, .53, .42, .42], [-1.49, .38, .19, .24], [-2.29, .23, .036, .063]], skin), polygon("泰坦鱼颈背独立的骨甲板", armor, [[-.39, -.05], [-.46, -.52], [-.24, -.93], [.24, -.93], [.46, -.52], [.39, -.05]], .13, [0, .8, .3]), ...eyes([0, .886, 1.13], .443, .055), membrane("泰坦鱼后躯保守复原的低背鳍", fin, [[0, .83, -.39], [0, 1.21, -.75], [0, .92, -1.11], [0, .51, -1.34]]), ...tail([0, .23, -2.32], .49, true)];
  for (const side of [-1, 1]) parts.push(polygon("泰坦鱼后方接颈关节的独立侧颊甲", armor, [[side * .37, .61], [side * .57, .68], [side * .55, 1.09], [side * .43, 1.23]], .38, [0, .43, 0]), membrane("泰坦鱼两侧真正分开的宽胸鳍", fin, [[side * .29, .35, .45], [side * .99, .13, .03], [side * .82, .08, -.44], [side * .32, .3, -.13]]));
  // ACT: 头盾与无齿长颌有化石依据，后躯仅作保守形态复原；不臆造未保存的滤食鳃耙。
  return parts;
}

// https://doi.org/10.1098/rspb.2024.0262
// https://doi.org/10.1186/s13358-024-00340-7
function ptychodus(): ModelPart[] {
  const parts: ModelPart[] = [body("多齿鲨按完整新化石复原的高速梭形躯", [[2.8, 1.29, .07, .085], [2.04, 1.28, .43, .4], [.43, 1.11, .65, .72], [-1.53, .84, .35, .44], [-2.47, .62, .067, .12]], skin), lobe("多齿鲨圆钝吻下部的独立下颌", armor, [0, .805, 2.24], [.66, .22, .9]), ...eyes([0, 1.43, 2.21], .333, .066), membrane("多齿鲨躯中前部高三角第一背鳍", fin, [[0, 1.75, .96], [0, 2.73, .44], [0, 2.46, .17], [0, 1.59, -.34]]), membrane("多齿鲨尾前明显较小的第二背鳍", fin, [[0, 1, -1.67], [0, 1.35, -1.83], [0, .82, -2.02]]), membrane("多齿鲨深叉尾的高上叶", fin, [[0, .67, -2.42], [0, 1.8, -3.16], [0, 2.01, -3.51], [0, 1.14, -3.12], [0, .49, -2.61]]), membrane("多齿鲨较发达的下尾叶", fin, [[0, .57, -2.43], [0, -.05, -3.01], [0, -.31, -3.27], [0, .24, -2.9]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("多齿鲨狭长后掠的镰形胸鳍", fin, [[side * .44, .91, 1.48], [side * 1.47, .46, .69], [side * 1.78, .22, -.1], [side * 1.08, .33, .07], [side * .43, .79, .65]]), membrane("多齿鲨尾前较短的腹鳍", fin, [[side * .23, .54, -1.29], [side * .7, .21, -1.65], [side * .46, .18, -1.87], [side * .18, .48, -1.58]]));
    for (let i = 0; i < 5; i++) parts.push(tapered("多齿鲨头后真实分开的五道鳃缘", dark, [[side * .45, 1.46, 1.79 - i * .13], [side * .49, .95, 1.8 - i * .13]], [.011, .011]));
  }
  parts.push(membrane("多齿鲨腹鳍后方与尾根之前的独立小臀鳍", fin, [[0, .43, -1.75], [0, .18, -1.89], [0, .43, -2.04]]));
  const crowns: ModelPart[] = [], ridges: ModelPart[] = [];
  for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) { const x = (col - 3) * .067, z = 1.98 + row * .084; crowns.push(lobe("多齿鲨下颌铺面排列的独立磨牙冠", pale, [x, .899, z], [.065, .034, .081])); for (let k = -1; k <= 1; k++) ridges.push(tapered("独立磨牙表面横向而非尖牙的珐琅脊", pale, [[x - .023, .915, z + k * .018], [x, .921, z + k * .018], [x + .023, .915, z + k * .018]], [.003, .003, .003])); }
  for (let i = 0; i < crowns.length; i += 28) parts.push(combineMeshes("多齿鲨实际起伏的研磨牙铺面", pale, crowns.slice(i, i + 28)));
  for (let i = 0; i < ridges.length; i += 16) parts.push(combineMeshes("多齿鲨磨牙冠上的分离横脊", pale, ridges.slice(i, i + 16))); return parts;
}

export const aquaticExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("strapToothedWhale", "带齿喙鲸", "动物", strapToothedWhale, ["Mesoplodon layardii", "真正越过上吻的扁带状下颌牙"]),
  design("bairdsBeakedWhale", "贝氏喙鲸", "动物", bairdsBeakedWhale, ["Berardius bairdii", "圆隆额顶长下颌两对外露齿与圆胸鳍"]),
  design("hoodedSeal", "冠海豹", "动物", hoodedSeal, ["Cystophora cristata", "鼻额部连体双瓣鼻囊"]),
  design("crabeaterSeal", "食蟹海豹", "动物", crabeaterSeal, ["Lobodon carcinophaga", "五尖瓣颊齿留隙形成滤筛"]),
  design("brambleShark", "棘鲨", "动物", brambleShark, ["Echinorhinus brucus", "皮面独立粗盾刺与无棘后双背鳍"]),
  design("angularRoughshark", "尖背角鲨", "动物", angularRoughshark, ["Oxynotus centrina", "三角截面腹棱与带棘高双背帆"]),
  design("spinyButterflyRay", "刺尾蝴蝶鳐", "动物", spinyButterflyRay, ["Gymnura altavela", "横宽蝶翼及远短于体盘的尾"]),
  design("flapperSkate", "大鳐（Dipturus intermedius）", "动物", flapperSkate, ["Dipturus intermedius", "长尖吻尾后相邻双背鳍与分叉腹鳍"]),
  design("titanichthys", "泰坦鱼", "动物", titanichthys, ["Titanichthys", "形态复原", "独立头盾与无切割齿板的长开颌"]),
  design("ptychodus", "多齿鲨", "动物", ptychodus, ["Ptychodus", "形态复原", "完整身体化石轮廓及带横脊的磨齿铺面"]),
];

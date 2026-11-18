import { beam, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, rx: number, ry: number): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return [x + Math.cos(a) * rx, y + Math.sin(a) * ry]; });
}

const skullStations = [[2.55, .065, 1.35], [2.66, .085, 1.40], [2.83, .060, 1.31], [3.03, .025, 1.25]];

function skullWidth(z: number): number {
  const i = Math.max(1, skullStations.findIndex(([p]) => p! >= z)), a = skullStations[i - 1]!, b = skullStations[i]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function contourSkullWall(wall: ModelPart, side: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], locations = new Map<string, number>();
  const indexOf = (point: { x: number; y: number; z: number }) => { const key = [point.x, point.y, point.z].map(v => v.toFixed(10)).join(","); if (!locations.has(key)) { locations.set(key, vertices.length); vertices.push({ ...point, y: point.y + side * (skullWidth(point.x) - .0075) - .0075 }); } return locations.get(key)!; };
  // 先把真实三角沿颅宽转折站切开，再逐段仿射变形；仅改边界顶点会让牙槽下缘跨站拉直。
  for (let triangle = 0; triangle < wall.indices!.length; triangle += 3) {
    let pieces = [wall.indices!.slice(triangle, triangle + 3).map(i => wall.vertices![i]!)];
    for (const cut of [2.66, 2.83]) pieces = pieces.flatMap(points => {
      if (points.every(p => p.x <= cut + 1e-10) || points.every(p => p.x >= cut - 1e-10)) return [points];
      return [-1, 1].map(direction => {
        const clipped: typeof points = [];
        for (const [i, a] of points.entries()) { const b = points[(i + 1) % points.length]!, insideA = (a.x - cut) * direction <= 1e-10, insideB = (b.x - cut) * direction <= 1e-10; if (insideA) clipped.push(a); if (insideA !== insideB) { const t = (cut - a.x) / (b.x - a.x); clipped.push({ x: cut, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }); } }
        return clipped;
      });
    });
    for (const points of pieces) for (let i = 1; i < points.length - 1; i++) { const a = points[0]!, b = points[i]!, c = points[i + 1]!, u = [b.x - a.x, b.y - a.y, b.z - a.z], v = [c.x - a.x, c.y - a.y, c.z - a.z]; if (Math.hypot(u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!) > 1e-12) indices.push(indexOf(a), indexOf(b), indexOf(c)); }
  }
  wall.vertices = vertices; wall.indices = indices; wall.rotation = { x: -90, y: 0, z: -90 }; return wall;
}

function mountedPlate(index: number, root: Triple, width: number, height: number): ModelPart {
  const side = index % 2 ? 1 : -1, thickness = .025 + height * .035;
  const outline: [number, number][] = index < 4 ? [[-width * .32, 0], [-width * .48, height * .43], [-width * .08, height], [width * .39, height * .57], [width * .35, 0]] : index < 13 ? [[-width * .18, 0], [-width * .52, height * .43], [-width * .40, height * .77], [width * .04, height], [width * .46, height * .66], [width * .38, height * .27], [width * .16, 0]] : [[-width * .25, 0], [-width * .5, height * .38], [-width * .34, height * .79], [width * .2, height], [width * .45, height * .44], [width * .24, 0]];
  const plate = polygon(index < 4 ? "颈部短小三角皮骨板" : index < 13 ? "背髋上宽菱形、带厚骨根的交错皮骨板" : "尾部逐渐变窄的长三角皮骨板", specimenBone, outline, thickness, [root[0] - thickness * .5, root[1], root[2]]);
  for (const v of plate.vertices!) v.y += side * v.z * .08;
  plate.rotation = { x: -90, y: 0, z: -90 }; return plate;
}

// 独立完整骨系的综合复原陈列：手、前尾及部分皮骨在参照标本中缺失，不能称Sophie逐骨复制。
// 19片皮骨与4尾刺没有直接长在椎骨上，均用真实细钢架接到中轴承托。
// 原研究指出剑龙无确证骨化胸骨，因此不添加人形胸骨或把肋端焊到虚构胸板。
// https://pmc.ncbi.nlm.nih.gov/articles/PMC4605687/
// https://www.nhm.ac.uk/press-office/press-releases/world_s-most-complete-stegosaurus-goes-on-show.html
// https://www.app.pan.pl/archive/published/app64/app005852018.pdf
function stegosaurusReconstructedSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], mounts: ModelPart[] = [];
  const neck: Triple[] = Array.from({ length: 13 }, (_, i) => [0, 1.18 + i * .020, 2.55 - i * .08]), back: Triple[] = Array.from({ length: 13 }, (_, i) => [0, 1.45 + (1 - Math.cos(i / 12 * Math.PI * .5)) * .56, 1.48 - i * .14]), sacrum: Triple[] = Array.from({ length: 5 }, (_, i) => [0, 2.02, -.36 - i * .12]), tail: Triple[] = Array.from({ length: 45 }, (_, i) => [0, 1.96 - Math.sin(i / 44 * Math.PI * .5) * .78, -1.03 - (i / 44) ** .8 * 2.85]);
  const axis = [...neck, ...back, ...sacrum, ...tail];
  const axisHeight = (z: number) => { const i = Math.max(1, axis.findIndex(p => p[2] <= z)), a = axis[i - 1]!, b = axis[i]!; return a[1] + (b[1] - a[1]) * (z - a[2]) / (b[2] - a[2]); };
  const atlas = polygon("剑龙寰椎的背侧不闭合U形骨环", specimenBone, [[-.047, -.027], [-.065, .016], [-.055, .070], [-.031, .074], [-.030, .019], [0, -.004], [.030, .019], [.031, .074], [.055, .070], [.065, .016], [.047, -.027]], .038, neck[0]!); atlas.rotation.x = -90; bones.push(atlas);
  for (const [i, p] of neck.entries()) {
    if (!i) continue; const radius = .040 + i * .0017;
    bones.push(lobe("前后独立且逐渐增大的剑龙颈椎体", specimenBone, p, [radius * 2, radius * 1.7, .075]), neuralArch(p, radius, .040));
    for (const side of [-1, 1]) bones.push(boneShaft("颈椎高位后关节突及向后伸的关节突架", [side * radius * .65, p[1] + radius, p[2]], [side * radius * .9, p[1] + radius * 1.45, p[2] - .064], .013), tapered("独立小颈肋的双根和后伸骨杆", specimenBone, [[side * .033, p[1] - .01, p[2]], [side * .084, p[1] - .027, p[2] - .015], [side * .075, p[1] - .04, p[2] - .105]], [.014, .012, .006]));
  }
  for (const [i, p] of back.entries()) {
    bones.push(lobe("胸背部独立短椎体", specimenBone, p, [.20, .18, .125]), neuralArch(p, .105, .070), needle("胸背部神经弓上的高椎棘，不冒充皮骨板", specimenBone, [0, p[1] + .21, p[2]], [0, p[1] + .40, p[2] - .02], .024));
    for (const side of [-1, 1]) { const width = .34 + Math.sin((i + 1) / 15 * Math.PI) * .36; bones.push(boneShaft("胸背椎高位附肋横突", [side * .055, p[1] + .12, p[2]], [side * .24, p[1] + .15, p[2]], .024), tapered("宽腹躯中各自独立的弧形胸肋，腹端保持开放", specimenBone, [[side * .23, p[1] + .14, p[2]], [side * width * .8, p[1] + .02, p[2] + .04], [side * width, p[1] - .29, p[2] + .10], [side * width * .83, p[1] - .61, p[2] + .12], [side * width * .47, p[1] - .75, p[2] + .13]], [.026, .025, .023, .019, .013])); }
  }
  for (const p of sacrum) { bones.push(lobe("背骶与四骶体真实相接的融合骶骨", specimenBone, p, [.23, .21, .15]), neuralArch(p, .11, .13)); for (const side of [-1, 1]) bones.push(boneShaft("从骶体贯接髂骨、彼此仍留骶窗的骨性骶肋", [side * .075, 2.02, p[2]], [side * .35, 2.02, p[2]], .045)); }
  bones.push(polygon("融合骶棘的连续顶部骨台", specimenBone, [[-.065, -.93], [-.07, -.32], [.07, -.32], [.065, -.93]], .065, [0, 2.23, 0]));
  for (const [i, p] of tail.entries()) {
    const r = .10 - i / 44 * .083, depth = .075 - i / 44 * .037; bones.push(lobe("从粗根逐节收小的独立尾椎体", specimenBone, p, [r * 2, r * 1.7, depth]));
    if (i < 32) { bones.push(neuralArch(p, r, depth * .6)); for (const side of [-1, 1]) bones.push(boneShaft("前中尾部真实分叉的棘突峰", [0, p[1] + r * 2, p[2]], [side * r * .32, p[1] + r * 3.2, p[2] - .012], r * .19)); }
    if (i > 1 && i < 27) for (const side of [-1, 1]) bones.push(boneShaft("尾椎腹面独立汇合而保留血管孔的人字骨", [side * r * .5, p[1] - r * .45, p[2]], [0, p[1] - r * 2.2, p[2] - .027], r * .17));
  }
  for (const side of [-1, 1]) {
    const scapula = polygon("长肩胛片及前端大矩形肩峰区", specimenBone, [[-.45, .28], [-.35, .60], [.10, .64], [.35, .46], [.48, .25], [.30, .05], [.05, 0], [-.10, .19]], .03, [side < 0 ? -.445 : .415, .9, 1.12]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("肩胛前腹侧独立带真孔的乌喙骨", specimenBone, [[1.36, .95], [1.37, 1.18], [1.66, 1.15], [1.71, .98], [1.51, .88]], .03, [side < 0 ? -.445 : .415, 0, 0], [oval(1.55, 1.06, .026, .022)]); coracoid.rotation = { x: -90, y: 0, z: -90 }; bones.push(coracoid);
    const shoulder: Triple = [side * .43, 1.02, 1.40], elbow: Triple = [side * .45, .62, 1.30], wrist: Triple = [side * .46, .21, 1.55];
    bones.push(lobe("低肩带中的宽肱骨近端球面", specimenBone, shoulder, [.16, .16, .17]), boneShaft("前肢短而粗的独立肱骨", shoulder, elbow, .062), boneShaft("前臂内侧独立桡骨", [elbow[0] - side * .025, elbow[1], elbow[2] + .03], [wrist[0] - side * .018, wrist[1], wrist[2] + .028], .032), boneShaft("前臂外侧带明显肘突的尺骨", [elbow[0] + side * .025, elbow[1] + .075, elbow[2] - .025], [wrist[0] + side * .025, wrist[1], wrist[2] - .028], .037));
    bones.push(lobe("桡侧近排腕骨", specimenBone, [side * .43, .198, 1.58], [.085, .07, .09]), lobe("成体尺侧腕部融合骨单元", specimenBone, [side * .493, .194, 1.53], [.10, .07, .115]));
    for (const [digit, count] of [2, 1, 1, 1, 0].entries()) {
      const a = (digit - 2) * .35, root: Triple = [side * (.46 + Math.sin(a) * .055), .181, 1.554 + Math.cos(a) * .016], end: Triple = [side * (.46 + Math.sin(a) * .14), .085, 1.57 + Math.cos(a) * .10];
      bones.push(boneShaft("半环排布的五枚独立掌骨，非五条平直人手指", root, end, .022));
      for (let phalanx = 0; phalanx < count; phalanx++) { const from: Triple = [end[0], end[1] - phalanx * .025, end[2] + phalanx * .031], to: Triple = [end[0], Math.max(.032, end[1] - (phalanx + 1) * .025), end[2] + (phalanx + 1) * .031]; bones.push(boneShaft(digit === 0 && phalanx === count - 1 ? "第一指短宽骨性蹄末节，不含角质蹄甲" : "前掌压短的独立指骨及圆钝末节", from, to, phalanx === count - 1 ? .028 : .022)); }
    }
    const pelvis = polygon("长髂翼和有真髋臼孔的鸟臀型骨盆", specimenBone, [[.62, .41], [.50, .76], [-.38, .73], [-.64, .42], [-.36, .22], [-.11, .06], [.13, .10], [.25, .31]], .04, [side < 0 ? -.37 : .33, 1.37, -.55], [oval(0, .27, .09, .10)]); pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    bones.push(tapered("髂骨向外呈近直角扩展的髋上骨架", specimenBone, [[side * .27, 2.04, -.56], [side * .48, 2.08, -.56], [side * .50, 2.08, -.36]], [.055, .065, .045]), tapered("鸟臀型骨盆前向的宽前耻骨支", specimenBone, [[side * .35, 1.64, -.43], [side * .43, 1.51, -.02], [side * .43, 1.48, .35]], [.045, .055, .042]), boneShaft("与坐骨区分的向后长耻骨支", [side * .33, 1.59, -.54], [side * .20, .95, -1.16], .028), boneShaft("骨盆向后下伸的独立长坐骨", [side * .35, 1.52, -.67], [side * .15, .93, -1.30], .04));
    const hip: Triple = [side * .35, 1.64, -.55], knee: Triple = [side * .43, .86, -.37], ankle: Triple = [side * .45, .21, -.56];
    bones.push(lobe("后高髋臼中相接的股骨头", specimenBone, hip, [.22, .22, .22]), boneShaft("明显长于肱骨的粗承重股骨", hip, knee, .075), boneShaft("独立粗胫骨", [knee[0] - side * .019, knee[1], knee[2]], [ankle[0] - side * .02, ankle[1], ankle[2]], .057), boneShaft("与胫骨分离的独立细腓骨", [knee[0] + side * .043, knee[1], knee[2] - .035], [ankle[0] + side * .035, ankle[1], ankle[2] - .025], .031), lobe("承接胫骨的独立距骨", specimenBone, [side * .435, .184, -.55], [.145, .08, .14]), lobe("独立于胫骨、承接腓骨的跟骨", specimenBone, [side * .502, .181, -.59], [.072, .072, .10]));
    for (let toe = 0; toe < 3; toe++) {
      const x = side * (.45 + (toe - 1) * .08), metatarsal: Triple = [x, .088, -.36 + Math.abs(toe - 1) * .02], end: Triple = [x, .055, -.22 + Math.abs(toe - 1) * .03];
      bones.push(boneShaft("三趾后足各自独立的短宽跖骨II至IV", [side * (.45 + (toe - 1) * .045), .17, -.53], metatarsal, .033), boneShaft("后足压短的独立近节趾骨", metatarsal, [x, .065, (metatarsal[2] + end[2]) * .5], .03), tapered("宽扁而非尖爪的骨性蹄末节", specimenBone, [[x, .065, (metatarsal[2] + end[2]) * .5], end], [.039, .045]));
    }
    mounts.push(beam("中轴到低前肩厚骨板的钢托", specimenMount, [0, axisHeight(1.28), 1.28], [side * .43, 1.24, 1.28], .017), beam("融合骶轴到左右髂翼的承重横托", specimenMount, [0, 2.02, -.5], [side * .35, 1.97, -.5], .022));
  }
  const roof = polygon("窄长小颅的连续额鼻骨顶，沿同一截面接合左右侧颅", specimenBone, [...skullStations.map(([z, w]) => [-w!, z!] as [number, number]), ...skullStations.toReversed().map(([z, w]) => [w!, z!] as [number, number])], .018);
  for (const v of roof.vertices!) { const i = Math.max(1, skullStations.findIndex(([z]) => z! >= v.z)), a = skullStations[i - 1]!, b = skullStations[i]!; v.y += a[2]! + (b[2]! - a[2]!) * (v.z - a[0]!) / (b[0]! - a[0]!) - .018; } bones.push(roof);
  const occiput = polygon("低小头颅后枕骨与真枕孔", specimenBone, [[-.065, -.05], [-.065, .12], [0, .16], [.065, .12], [.065, -.05]], .035, [0, 1.18, 2.58], [oval(0, .048, .019, .022)]); occiput.rotation.x = -90; bones.push(occiput);
  for (const side of [-1, 1]) {
    const skull = polygon("小楔形颅侧真实鼻孔、眶前窗、眼眶和后颞窗", specimenBone, [[2.55, 1.16], [2.55, 1.35], [2.66, 1.40], [2.83, 1.31], [3.03, 1.25], [3.03, 1.16]], .015, [0, 0, 0], [oval(2.615, 1.33, .020, .023), oval(2.70, 1.29, .050, .047), oval(2.82, 1.265, .029, .026), oval(2.94, 1.217, .032, .023)]);
    bones.push(contourSkullWall(skull, side));
    const jaw = polygon("前段无齿、后段低冠突且有下颌窗的长齿骨", specimenBone, [[2.55, 1.08], [2.55, 1.17], [2.63, 1.17], [2.68, 1.135], [2.94, 1.135], [2.98, 1.10], [2.96, 1.065], [2.70, 1.045]], .015, [0, 0, 0], [oval(2.64, 1.098, .040, .020)]);
    for (const v of jaw.vertices!) v.y += side * (skullWidth(v.x) - .0075) - .0075; jaw.rotation = { x: -90, y: 0, z: -90 }; bones.push(jaw, boneShaft("下颌后端独立方骨关节支", [side * .063, 1.185, 2.59], [side * .063, 1.145, 2.59], .015));
    for (const upper of [true, false]) {
      const count = upper ? 24 : 23;
      for (let t = 0; t < count; t++) { const z = 2.685 + t / (count - 1) * .177, x = side * (skullWidth(z) - .0075), direction = upper ? -1 : 1, length = upper ? .020 : .018;
        const tooth = polygon("仅后颌具小扁铲形齿，骨内齿根和有厚度的叶冠", specimenIvory, [[-.0027, 0], [-.0038, direction * length * .40], [-.0027, direction * length * .76], [0, direction * length], [.0027, direction * length * .76], [.0038, direction * length * .40], [.0027, 0]], .005, [x - .0025, upper ? 1.168 : 1.123, z]); tooth.rotation = { x: -90, y: 0, z: -90 }; bones.push(tooth); }
    }
  }
  bones.push(polygon("无齿前颌骨尖端横桥，外伸于前齿骨而非假上门齿", specimenBone, [[-.033, 2.985], [-.025, 3.045], [.025, 3.045], [.033, 2.985]], .075, [0, 1.16, 0]), polygon("下颌前端独立U形无齿前齿骨", specimenBone, [[-.037, 2.91], [-.032, 2.99], [0, 3.015], [.032, 2.99], [.037, 2.91], [.02, 2.91], [.015, 2.97], [-.015, 2.97], [-.02, 2.91]], .035, [0, 1.07, 0]));
  const plateLocations = [[2.42, .12, .12], [2.17, .15, .16], [1.92, .19, .19], [1.67, .23, .23], [1.40, .37, .42], [1.11, .48, .62], [.80, .62, .82], [.47, .71, .96], [.12, .82, 1.10], [-.25, .88, 1.20], [-.64, .85, 1.23], [-1.06, .77, 1.10], [-1.48, .65, .91], [-1.85, .49, .75], [-2.19, .43, .64], [-2.50, .36, .52], [-2.78, .30, .39], [-3.03, .25, .28], [-3.25, .20, .19]];
  for (const [i, [z, width, height]] of plateLocations.entries()) {
    const side = i % 2 ? 1 : -1, bodyY = axisHeight(z!), clearance = z! > 1.5 ? .18 : z! > -.9 ? .46 : .23, root: Triple = [side * .11, bodyY + clearance, z!]; bones.push(mountedPlate(i, root, width!, height!));
    mounts.push(beam("独立皮骨板下缘真实入骨的陈列细支杆，非骨性椎棘", specimenMount, [0, bodyY, z!], [root[0] + side * .0024, root[1] + .03, root[2]], .014));
  }
  for (const [pair, z] of [-3.49, -3.72].entries()) for (const side of [-1, 1]) {
    const y = axisHeight(z), root: Triple = [side * .13, y + .06, z], tip: Triple = [side * (.55 - pair * .045), y + .25, z - .33]; bones.push(needle("尾端两对向外后方伸出的独立骨性尾刺，无虚构角质延伸", specimenBone, root, tip, .075 - pair * .008)); mounts.push(beam("皮骨尾刺根部到尾轴的真实细钢承托", specimenMount, [0, y, z], root, .014));
  }
  const parts = boneGroups("狭脸剑龙完整骨系综合复原组", bones);
  for (let start = 0; start < axis.length - 1; start += 36) { const path = axis.slice(start, start + 37); parts.push(tapered("穿过各段椎体的细陈列钢芯", specimenMount, path, path.map(() => .012))); }
  parts.push(...specimenStand(1.12, axisHeight(1.12) - .035, .30), ...specimenStand(-.54, 1.98, .30), ...specimenStand(-2.6, axisHeight(-2.6) - .02, .30), ...mounts);
  return parts;
}

export const osteologicalSkeletonExpansionBatchSeventeenDesigns: MasterNatureDesign[] = [
  design("stegosaurusReconstructedOsteologicalSpecimen", "狭脸剑龙完整骨架复原陈列标本", "器物", stegosaurusReconstructedSkeleton, ["Stegosaurus stenops", "高后髋低前肩、五掌三后趾、19片交错独立皮骨板和四尾刺", "原创综合解剖简化复原，非Sophie单件馆藏精确逐骨复制"]),
];

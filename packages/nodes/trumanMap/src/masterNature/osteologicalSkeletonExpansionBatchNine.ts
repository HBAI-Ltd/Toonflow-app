import { beam, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const a = index * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function halfSkullWidth(z: number): number {
  const stations = [[1.53, .23], [1.75, .28], [1.94, .22], [2.55, .12], [2.64, .07]];
  const next = Math.max(1, stations.findIndex(([at]) => at! >= z)), a = stations[next - 1]!, b = stations[next]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function jawPoint(path: Triple[], z: number): Triple {
  const next = Math.max(1, path.findIndex(point => point[2] >= z)), a = path[next - 1]!, b = path[next]!;
  return a.map((value, axis) => value + (b[axis]! - value) * (z - a[2]) / (b[2] - a[2])) as Triple;
}

function dermalBonePlate(position: Triple): ModelPart {
  const vertices = [false, true].flatMap(top => Array.from({ length: 25 }, (_, i) => {
    const x = i % 5, z = Math.floor(i / 5);
    return { x: (x - 2) * .0325, y: top ? .018 + (x === 2 ? .012 : 0) - (x % 2 && z % 2 ? .008 : 0) : 0, z: (z - 2) * .025 };
  }));
  const indices: number[] = [];
  for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) { const a = z * 5 + x, b = a + 1, c = a + 5, d = c + 1; indices.push(a + 25, c + 25, b + 25, b + 25, c + 25, d + 25, a, b, c, b, d, c); }
  const rim = [0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5];
  for (let i = 0; i < rim.length; i++) { const a = rim[i]!, b = rim[(i + 1) % rim.length]!; indices.push(a, b + 25, b, a, a + 25, b + 25); }
  return part("皮内骨板的真实凹坑、背侧骨龙骨及有厚度骨底", "mesh", specimenBone, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 鳄类骨系保留9颈、15躯、2骶及分节长尾，并有二次骨腭、腹肋、皮内骨板及低位外展四肢。
// 皮内骨板在活体内由皮肤支持，标本中用细钢托复原真实位置，不能把它们悬空当外壳。
// https://pmc.ncbi.nlm.nih.gov/articles/PMC4590465/
// https://www.journals.vu.lt/archaeologia-lituana/en/article/download/31772/33197/90226
// https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/ar.24993
// https://www.anatomical-sciences.org.uk/wp-content/uploads/IAS_Magazine_No_187_Jan_Feb_2021.pdf
function nileCrocodileSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [], plates: ModelPart[] = [];
  const spineY = (z: number) => .78 + Math.sin(Math.max(0, Math.min(1, (z + .9) / 2.43)) * Math.PI) * .035;
  const vertebrae = [
    ...Array.from({ length: 9 }, (_, i) => ({ x: 0, y: spineY(1.52 - i * .081), z: 1.52 - i * .081, radius: .054, depth: .077, region: "颈椎" })),
    ...Array.from({ length: 15 }, (_, i) => ({ x: 0, y: spineY(.782 - i * .106), z: .782 - i * .106, radius: .061, depth: .101, region: "躯椎" })),
    ...Array.from({ length: 2 }, (_, i) => ({ x: 0, y: spineY(-.815 - i * .105), z: -.815 - i * .105, radius: .067, depth: .1, region: "骶椎" })),
    ...Array.from({ length: 37 }, (_, i) => ({ x: .31 * (i / 36) ** 2, y: .774 - i * .012, z: -1.022 - i * .057, radius: .064 - i * .00155, depth: .055, region: "尾椎" })),
  ];
  for (const [index, v] of vertebrae.entries()) {
    bones.push(lobe(`尼罗鳄独立${v.region}的短椎体`, specimenBone, [v.x, v.y, v.z], [v.radius * 1.8, v.radius * 1.6, v.depth])); arches.push(neuralArch([v.x, v.y, v.z], v.radius, v.depth * .58));
    bones.push(needle("尼罗鳄分节椎骨上方的神经棘", specimenBone, [v.x, v.y + v.radius * 1.9, v.z], [v.x, v.y + v.radius * 1.9 + (v.region === "尾椎" ? v.radius * .8 : .055), v.z - .01], v.radius * .2));
    for (const side of [-1, 1]) {
      const width = v.region === "骶椎" ? .19 : v.region === "躯椎" ? .108 : v.region === "尾椎" ? v.radius * 1.85 : .072;
      bones.push(boneShaft("椎体两侧的肋关节或骶椎承重横突", [v.x + side * v.radius * .5, v.y + .016, v.z], [v.x + side * width, v.y + .013, v.z], v.radius * .2));
      if (v.region === "颈椎") bones.push(tapered("独立短颈肋，向后延伸而不接胸骨", specimenBone, [[side * .058, v.y, v.z], [side * .09, v.y - .055, v.z - .028], [side * .092, v.y - .058, v.z - .105]], [.013, .011, .004]));
      if (v.region === "尾椎" && index < 56) bones.push(boneShaft("尾椎下方成对汇合的独立人字骨", [v.x + side * v.radius * .45, v.y - v.radius * .5, v.z], [v.x, v.y - v.radius * 2.4, v.z - .01], v.radius * .15));
    }
  }
  for (let rib = 0; rib < 15; rib++) for (const side of [-1, 1]) {
    const z = .782 - rib * .106, y = spineY(z), spread = .2 + Math.sin((rib + 1) / 17 * Math.PI) * .095;
    const path: Triple[] = [[side * .09, y + .012, z], [side * spread * .9, y - .045, z + .022], [side * spread, y - .2, z + .035], [side * spread * .74, y - .31, z + .025]];
    if (rib < 6) path.push([side * .125, .435, .71 - rib * .083]);
    bones.push(tapered("向腹侧弯曲而非围出实心身体的独立长肋骨", specimenBone, path, path.map((_, i) => .014 - i * .0017)));
  }
  bones.push(polygon("尼罗鳄前胸的宽薄骨性胸板", specimenBone, [[-.1, .245], [-.145, .4], [-.13, .77], [0, .83], [.13, .77], [.145, .4], [.1, .245]], .04, [0, .399, 0]));
  for (let row = 0; row < 12; row++) for (const side of [-1, 1]) bones.push(tapered("不附着脊柱的独立皮骨腹肋半支", specimenBone, [[0, .39, .65 - row * .108], [side * .13, .407, .625 - row * .108], [side * .263, .48, .6 - row * .108]], [.0095, .008, .005]));
  for (const side of [-1, 1]) {
    const scapula = polygon("尼罗鳄肩带背侧的窄长扇形肩胛骨", specimenBone, [[-.105, .01], [-.14, .25], [-.075, .355], [.045, .32], [.075, .16], [.035, 0]], .025, [side < 0 ? -.2925 : .2675, .49, .72]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("向前胸板相接的宽乌喙骨", specimenBone, [[side * .28, .63], [side * .24, .64], [side * .105, .425], [side * .16, .405]], .045, [0, 0, .745]); coracoid.rotation.x = -90; bones.push(coracoid);
    const shoulder: Triple = [side * .28, .63, .72], elbow: Triple = [side * .55, .39, .56], wrist: Triple = [side * .66, .155, .78];
    bones.push(lobe("肩胛与乌喙骨接合的前肢关节头", specimenBone, shoulder, [.085, .085, .085]), boneShaft("低位向外展出的独立肱骨", shoulder, elbow, .032), boneShaft("前肢较细独立桡骨", [elbow[0], elbow[1], elbow[2] + .018], [wrist[0], wrist[1], wrist[2] + .018], .02), boneShaft("前肢带肘突的独立尺骨", [elbow[0], elbow[1], elbow[2] - .022], [wrist[0], wrist[1], wrist[2] - .022], .023));
    const ilium = polygon("尼罗鳄骨盆髂翼及真实髋臼骨环", specimenBone, [[-.2, .11], [-.18, .29], [.04, .27], [.15, .15], [.09, .01], [-.1, 0]], .032, [side < 0 ? -.206 : .174, .485, -.83], [oval(0, .15, .052, .056)]); ilium.rotation = { x: -90, y: 0, z: -90 }; bones.push(ilium);
    bones.push(boneShaft("左右骨盆向腹侧会合的坐骨", [side * .19, .615, -.87], [side * .05, .39, -.99], .026), boneShaft("鳄类向前而不直接充当髋关节的独立耻骨", [side * .12, .45, -.88], [side * .05, .39, -.58], .021));
    const hip: Triple = [side * .19, .635, -.83], knee: Triple = [side * .51, .38, -.98], ankle: Triple = [side * .6, .16, -.69];
    bones.push(lobe("落入骨盆髋臼的股骨头", specimenBone, hip, [.113, .113, .113]), boneShaft("低位外展的弯曲股骨", hip, knee, .039), boneShaft("后肢独立承重胫骨", [knee[0], knee[1], knee[2] + .019], [ankle[0], ankle[1], ankle[2] + .018], .026), boneShaft("与胫骨分离可辨的后肢腓骨", [knee[0], knee[1], knee[2] - .023], [ankle[0], ankle[1], ankle[2] - .024], .018));
    for (const [front, joint] of [[true, wrist], [false, ankle]] as [boolean, Triple][]) {
      for (let element = 0; element < 4; element++) bones.push(lobe(front ? "前肢腕部独立腕骨" : "后肢踝部独立距骨跟骨及远跗骨", specimenBone, [joint[0] + side * (element % 2 - .5) * .03, joint[1] - Math.floor(element / 2) * .018, joint[2] + (element % 2 - .5) * .035], [.048, .042, .049]));
      const digits = front ? 5 : 4;
      for (let digit = 0; digit < digits; digit++) {
        const count = front ? [2, 3, 4, 4, 3][digit]! : [2, 3, 4, 4][digit]!, root: Triple = [joint[0] + side * (digit - (digits - 1) / 2) * .014, joint[1] - .013, joint[2] + .01], end: Triple = [joint[0] + side * (digit - (digits - 1) / 2) * .047, .055, joint[2] + .19 + Math.sin((digit + 1) / (digits + 1) * Math.PI) * .05];
        for (let segment = 0; segment <= count; segment++) {
          const a = segment / (count + 1), b = (segment + .98) / (count + 1);
          bones.push(boneShaft(segment ? "鳄类足部独立分节指趾骨" : "从腕跗部独立伸出的掌跖骨", root.map((v, axis) => v + (end[axis]! - v) * a) as Triple, root.map((v, axis) => v + (end[axis]! - v) * b) as Triple, .012 * (1 - a * .6)));
        }
      }
    }
  }
  const skullOutline: [number, number][] = [[-.23, 1.53], [-.28, 1.75], [-.22, 1.94], [-.12, 2.55], [-.07, 2.64], [.07, 2.64], [.12, 2.55], [.22, 1.94], [.28, 1.75], [.23, 1.53]];
  const roof = polygon("扁长鳄颅顶的真眼眶、双颞窗和前端鼻孔", specimenBone, skullOutline, .035, [0, 0, 0], [oval(-.10, 1.64, .043, .05), oval(.10, 1.64, .043, .05), oval(-.175, 1.855, .055, .065), oval(.175, 1.855, .055, .065), oval(0, 2.51, .045, .062)]);
  for (const vertex of roof.vertices!) vertex.y += .9 - (vertex.z - 1.53) / 1.11 * .075;
  const palate = polygon("分隔鼻道与口腔的真实二次骨腭及后鼻孔", specimenBone, skullOutline.map(([x, z]) => [x * .9, z]), .035, [0, 0, 0], [oval(0, 1.65, .035, .045), oval(-.11, 1.91, .043, .09), oval(.11, 1.91, .043, .09)]);
  for (const vertex of palate.vertices!) vertex.y += .75 + (vertex.z - 1.53) / 1.11 * .02;
  const occiput = polygon("后颅连接颈椎、保留真实枕孔的枕骨", specimenBone, [[-.22, 0], [-.245, .08], [-.19, .195], [.19, .195], [.245, .08], [.22, 0]], .04, [0, .74, 1.55], [oval(0, .12, .017, .018)]); occiput.rotation.x = -90;
  bones.push(roof, palate, occiput);
  for (const side of [-1, 1]) {
    const sideWall = polygon("鳄颅外壁真实颞窗及从宽脑颅过渡到窄吻的上颌骨", specimenBone, [[1.53, .745], [1.53, .905], [1.75, .89], [1.94, .875], [2.55, .835], [2.64, .825], [2.64, .765], [2.55, .75], [1.94, .735], [1.75, .735]], .035, [0, 0, 0], [oval(1.665, .815, .055, .036), oval(1.86, .821, .065, .032)]);
    for (const vertex of sideWall.vertices!) vertex.y += side * (halfSkullWidth(vertex.x) - .0175) - .0175;
    sideWall.rotation = { x: -90, y: 0, z: -90 }; bones.push(sideWall);
    const mandible = polygon("有真实下颌窗的独立鳄下颌骨支", specimenBone, [[1.53, .65], [1.6, .72], [1.85, .71], [2.15, .68], [2.58, .695], [2.64, .68], [2.56, .625], [1.91, .6], [1.65, .595], [1.55, .61]], .035, [0, 0, 0], [oval(1.77, .655, .085, .026)]);
    for (const vertex of mandible.vertices!) vertex.y += side * (halfSkullWidth(vertex.x) * .88 - .005) - .0175;
    mandible.rotation = { x: -90, y: 0, z: -90 }; bones.push(mandible);
    const upperRim: Triple[] = [1.75, 1.94, 2.55, 2.64].map(z => [side * (halfSkullWidth(z) - .018), .76 + (z - 1.75) / .89 * .022, z]);
    const lowerRim: Triple[] = [[side * (halfSkullWidth(1.6) * .88 - .005), .711, 1.6], [side * (halfSkullWidth(1.85) * .88 - .005), .7, 1.85], [side * (halfSkullWidth(2.15) * .88 - .005), .674, 2.15], [side * (halfSkullWidth(2.58) * .88 - .005), .687, 2.58], [side * (halfSkullWidth(2.64) * .88 - .005), .676, 2.64]];
    bones.push(tapered("上颌锥齿真正落根的牙槽骨缘", specimenBone, upperRim, upperRim.map(() => .014)), tapered("下颌锥齿真正落根的牙槽骨缘", specimenBone, lowerRim, lowerRim.map(() => .012)), boneShaft("鳄颅后方与下颌关节连续接合的方骨", [side * .24, .80, 1.64], [side * .21, .665, 1.58], .027));
    for (let tooth = 0; tooth < 18; tooth++) {
      const root = jawPoint(upperRim, 1.81 + tooth * .046), length = .028 + (tooth === 3 || tooth === 9 ? .026 : Math.sin(tooth * 1.8) ** 2 * .012);
      bones.push(tapered("插入上牙槽骨的独立非剑齿锥牙", specimenIvory, [root, [root[0], root[1] - length * .75, root[2] + .004], [root[0], root[1] - length, root[2] + .004]], [.008, .004, .0003]));
    }
    for (let tooth = 0; tooth < 15; tooth++) { const root = jawPoint(lowerRim, 1.8 + tooth * .0535), length = .025 + (tooth === 3 ? .025 : Math.sin(tooth * 1.6) ** 2 * .011); bones.push(tapered("插入下牙槽骨的独立锥形齿", specimenIvory, [root, [root[0], root[1] + length * .78, root[2] + .003], [root[0], root[1] + length, root[2] + .003]], [.007, .0035, .0003])); }
  }
  bones.push(boneShaft("前端联合左右上颌骨的前颌骨", [-.07, .787, 2.62], [.07, .787, 2.62], .02), boneShaft("前端联合左右下颌的骨性联合", [-.057, .666, 2.62], [.057, .666, 2.62], .022));
  for (let row = 0; row < 16; row++) for (const x of [-.21, -.07, .07, .21]) { const z = 1.065 - row * .108, y = spineY(z) + .27 - x * x * .4; plates.push(dermalBonePlate([x, y, z])); }
  const parts = [...boneGroups("尼罗鳄椎骨、颅颌与四肢腹肋骨组", bones), ...boneGroups("尼罗鳄真椎孔神经弓组", arches), ...boneGroups("尼罗鳄单独有厚度的皮内骨板组", plates)];
  const steelPath: Triple[] = vertebrae.map(v => [v.x, v.y, v.z]);
  for (let start = 0; start < steelPath.length - 1; start += 30) { const path = steelPath.slice(start, start + 31); parts.push(tapered("穿入独立椎体的陈列中轴钢芯", specimenMount, path, path.map(() => .008))); }
  for (const index of [16, 23, 43]) {
    const v = vertebrae[index]!, stand = specimenStand(v.z, v.y - .035, 1.05);
    for (const p of stand) p.position.x += v.x; parts.push(...stand);
  }
  for (const x of [-.21, -.07, .07, .21]) {
    const path: Triple[] = Array.from({ length: 17 }, (_, i) => { const z = 1.105 - i * .108; return [x, spineY(z) + .267 - x * x * .4, z]; });
    parts.push(tapered("在皮内骨板底部连续接触的纵向陈列细钢托", specimenMount, path, path.map(() => .004)));
  }
  for (const row of [0, 5, 10, 15]) {
    const z = 1.065 - row * .108, y = spineY(z);
    parts.push(beam("椎骨钢芯承接皮骨板横托的短立柱", specimenMount, [0, y, z], [0, y + .265, z], .009), beam("实际穿到四列皮内骨板底部的弧顶横托", specimenMount, [-.22, y + .25, z], [.22, y + .25, z], .007));
    for (const x of [-.21, -.07, .07, .21]) parts.push(beam("横托向上接到各列皮骨板底的短托头", specimenMount, [x, y + .25, z], [x, y + .269 - x * x * .4, z], .005));
  }
  for (const row of [0, 4, 8, 11]) { const z = .65 - row * .108; parts.push(beam("把独立腹肋中线接回陈列主轴的细承托", specimenMount, [0, spineY(z), z], [0, .39, z], .005)); }
  return parts;
}

export const osteologicalSkeletonExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("nileCrocodileOsteologicalSpecimen", "尼罗鳄完整骨架陈列标本", "器物", nileCrocodileSkeleton, ["Crocodylus niloticus", "二次骨腭、腹肋、真实凹坑皮骨板及低位外展四肢", "独立骨骼系统与实际承接皮骨板腹肋的钢架"]),
];

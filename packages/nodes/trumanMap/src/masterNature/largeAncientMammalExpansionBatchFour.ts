import { combineMeshes, design, eyes, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { calibrated } from "./birdExpansionBatchOne";

const hide = "#a7b198";
const pale = "#c9cbb0";
const dark = "#7e907b";

// https://www.floridamuseum.ufl.edu/florida-vertebrate-fossils/species/epicyon-haydeni/
function epicyon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("上犬短强腰和深而宽的承重胸腹", hide, [0, 0.696, -0.12], [0.754, 0.78, 1.445]), lobe("上犬比后腰更宽厚的强壮前肩", hide, [0, 0.785, 0.407], [0.754, 0.77, 0.756]), tapered("上犬支承宽深头颅的短粗前颈", hide, [[0, 0.863, 0.517], [0, 0.983, 0.782]], [0.214, 0.164]), lobe("上犬宽骨腭和大颞肌附着区形成的深厚颅", hide, [0, 1.009, 0.989], [0.495, 0.486, 0.607]), lobe("上犬额骨显著隆起而非狼的平直长鼻线", hide, [0, 1.138, 1.005], [0.342, 0.282, 0.329]), lobe("上犬较狼缩短但并不塌鼻的宽厚吻", pale, [0, 0.871, 1.237], [0.347, 0.264, 0.408]), lobe("上犬容纳粗大第四前臼齿的深下颌", hide, [0, 0.728, 1.081], [0.378, 0.239, 0.62]), ...eyes([0, 1.095, 1.065], 0.185, 0.04), tapered("上犬由厚尾根延伸而不卷曲的中长尾", hide, [[0, 0.692, -0.73], [0.059, 0.453, -1.097], [0.132, 0.264, -1.427]], [0.089, 0.061, 0.023]), lobe("上犬宽吻前端完整的鼻端", dark, [0, 0.922, 1.398], [0.191, 0.094, 0.045])];
  for (const side of [-1, 1]) {
    parts.push(lobe("上犬不画成现代狼巨大尖耳的小外耳", dark, [side * 0.182, 1.169, 0.799], [0.104, 0.154, 0.081]), lobe("上犬头颅后侧实际发达而连续接头的颞肌区", hide, [side * 0.174, 1.017, 0.812], [0.161, 0.258, 0.33]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.286 : 0.274), z = front ? 0.443 : -0.528;
      parts.push(tapered("上犬比奔跑狼更短厚的分节承重腿", hide, [[x * 0.75, front ? 0.738 : 0.673, z], [x * 1.1, front ? 0.427 : 0.454, z + (front ? -0.058 : 0.117)], [x, front ? 0.134 : 0.212, z + (front ? 0.095 : -0.141)], [x, 0.085, z + (front ? 0.126 : -0.051)]], [front ? 0.147 : 0.164, 0.105, 0.053, 0.046]), lobe("上犬腕踝抬起而非熊式跟部着地的厚掌", hide, [x, 0.066, z + (front ? 0.177 : -0.005)], [0.225, 0.129, 0.27]));
      const digits: ModelPart[] = [], claws: ModelPart[] = [], rootZ = z + (front ? 0.126 : -0.051);
      for (let index = 0; index < 4; index++) {
        const toeX = x + (index - 1.5) * 0.052, endZ = rootZ + 0.166 - Math.abs(index - 1.5) * 0.022;
        digits.push(tapered("上犬四根主功能趾骨各自连接掌部", hide, [[x + (index - 1.5) * 0.019, 0.075, rootZ + 0.018], [toeX, 0.042, endZ]], [0.031, 0.02]));
        claws.push(tapered("上犬主功能趾末端的短外露角质爪", pale, [[toeX, 0.044, endZ], [toeX, 0.053, endZ + 0.034], [toeX, 0.02, endZ + 0.059]], [0.017, 0.01, 0.001]));
      }
      parts.push(combineMeshes("上犬四主趾的完整趾行足", hide, digits), combineMeshes("上犬四主趾分别接骨的爪端", pale, claws));
      if (front) parts.push(tapered("上犬只在前肢高置而不接地的第一趾", hide, [[x - side * 0.049, 0.165, rootZ - 0.025], [x - side * 0.087, 0.122, rootZ + 0.024]], [0.021, 0.009]));
    }
    const teeth: ModelPart[] = [];
    for (let index = 0; index < 4; index++) { const z = 1.012 + index * 0.062; teeth.push(lobe("上犬嘴缝内大于前方小前臼齿的厚颊齿", pale, [side * 0.132, 0.789, z], [index < 2 ? 0.052 : 0.034, index < 2 ? 0.069 : 0.044, index < 2 ? 0.058 : 0.039])); }
    parts.push(combineMeshes("上犬强壮的前臼及臼齿列而非只露犬牙", pale, teeth), tapered("上犬宽吻边缘短强而不夸张成剑的犬齿", pale, [[side * 0.113, 0.859, 1.304], [side * 0.12, 0.754, 1.331], [side * 0.117, 0.731, 1.326]], [0.026, 0.015, 0.001]), part("上犬下第一臼齿后跟部真实浅凹盆形齿面", "lathe", pale, [side * 0.134, 0.775, 1.016], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.022, y: 0 }, { x: 0.027, y: 0.014 }, { x: 0.02, y: 0.027 }, { x: 0.01, y: 0.013 }, { x: 0, y: 0.011 }] }));
  }
  return parts;
}

// 缺失段参照同属近完整骨架H.ursinus，而非套用现代熊的宽腰短跗跖行体形。
// https://www.si.edu/object/nmnhpaleobiology_3581958
function hemicyon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("半熊较狭而灵活的延长腰躯", hide, [0, 0.685, -0.112], [0.626, 0.633, 1.313]), lobe("半熊无高脂峰的轻窄前胸", hide, [0, 0.732, 0.355], [0.557, 0.66, 0.636]), tapered("半熊支承狭长头而非短熊脸的长前颈", hide, [[0, 0.808, 0.456], [0, 1.001, 0.737]], [0.161, 0.113]), lobe("半熊低平顶面和长口鼻的细长颅", hide, [0, 1.053, 0.936], [0.371, 0.36, 0.603]), lobe("半熊脑颅前方窄长而下倾的吻", pale, [0, 0.971, 1.178], [0.254, 0.211, 0.359]), lobe("半熊细长而仍有厚颌角的下颌", hide, [0, 0.855, 1.026], [0.267, 0.175, 0.526]), ...eyes([0, 1.13, 1.004], 0.137, 0.033), tapered("半熊不像现代熊短尾的长而渐细尾", hide, [[0, 0.671, -0.67], [0.041, 0.493, -1.015], [0.111, 0.298, -1.31], [0.154, 0.207, -1.43]], [0.074, 0.058, 0.032, 0.014]), lobe("半熊吻尖较小的完整鼻端", dark, [0, 1.011, 1.319], [0.127, 0.074, 0.033])];
  for (const side of [-1, 1]) {
    parts.push(lobe("半熊长颅后方小而圆的外耳", dark, [side * 0.139, 1.171, 0.746], [0.079, 0.121, 0.065]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.233 : 0.24), z = front ? 0.41 : -0.558;
      parts.push(tapered("半熊长而骨肉收束的奔跑肢不是熊的粗短腿", hide, [[x * 0.75, front ? 0.702 : 0.65, z], [x * 1.11, front ? 0.428 : 0.438, z + (front ? -0.057 : 0.121)], [x, front ? 0.153 : 0.226, z + (front ? 0.107 : -0.143)], [x, 0.081, z + (front ? 0.143 : -0.053)]], [front ? 0.112 : 0.133, 0.077, 0.042, 0.033]), lobe("半熊跟部抬起而由指趾腹落地的窄足", hide, [x, 0.059, z + (front ? 0.183 : -0.005)], [0.184, 0.114, 0.245]));
      const digits: ModelPart[] = [], nails: ModelPart[] = [], rootZ = z + (front ? 0.143 : -0.053);
      for (let index = -2; index <= 2; index++) {
        const first = index === -side * 2, toeX = x + index * 0.039, end = rootZ + (first ? 0.083 : 0.153 - Math.abs(index) * 0.016);
        digits.push(tapered("半熊五指趾掌中第一趾缩短但保留骨链", hide, [[x + index * 0.015, 0.076, rootZ], [toeX, first ? 0.062 : 0.039, end]], [first ? 0.02 : 0.026, 0.015]));
        nails.push(tapered("半熊各趾分别接掌的细短外露爪", pale, [[toeX, first ? 0.065 : 0.041, end], [toeX, first ? 0.071 : 0.054, end + 0.031], [toeX, first ? 0.04 : 0.018, end + 0.054]], [0.013, 0.009, 0.001]));
      }
      parts.push(combineMeshes("半熊细长而不平铺跟掌的完整趾行足", hide, digits), combineMeshes("半熊完整指趾上的短爪列", pale, nails));
    }
    parts.push(tapered("半熊长颌中较细而不成剑状的犬牙", pale, [[side * 0.092, 0.956, 1.222], [side * 0.099, 0.877, 1.247], [side * 0.096, 0.859, 1.24]], [0.02, 0.013, 0.001]));
  }
  return parts;
}

// https://doi.org/10.1206/0003-0090(2003)279<0348:C>2.0.CO;2
// https://doi.org/10.26879/929
function synthetoceras(): ModelPart[] {
  const parts: ModelPart[] = [lobe("合角兽短掌跖之上后高前低的森林偶蹄躯", hide, [0, 0.842, -0.1], [0.556, 0.661, 1.297], [6, 0, 0]), tapered("合角兽承托长鼻骨柱的斜举中长颈", hide, [[0, 1.012, 0.405], [0, 1.265, 0.644], [0, 1.455, 0.864]], [0.156, 0.108, 0.074]), lobe("合角兽与普通鹿短面不同的长而深颅面", hide, [0, 1.487, 1.094], [0.32, 0.35, 0.659]), lobe("合角兽鼻骨柱下面窄长的厚唇吻", pale, [0, 1.347, 1.357], [0.209, 0.19, 0.295]), lobe("合角兽长颌联合与较深颌支", hide, [0, 1.268, 1.165], [0.243, 0.18, 0.536]), ...eyes([0, 1.557, 1.075], 0.118, 0.032), tapered("合角兽低尾根发出的短细尾", hide, [[0, 0.941, -0.654], [0.034, 0.715, -0.874], [0.064, 0.546, -0.892]], [0.04, 0.024, 0.008]), tapered("合角兽从鼻骨中线而不是额角基座长出的高骨柱", pale, [[0, 1.544, 1.287], [0, 1.809, 1.491], [0, 2.041, 1.608]], [0.052, 0.039, 0.026])];
  for (const side of [-1, 1]) {
    parts.push(tapered("合角兽中线鼻柱顶端真正分为两支的Y形骨叉", pale, [[0, 2.025, 1.601], [side * 0.127, 2.146, 1.641], [side * 0.218, 2.21, 1.618], [side * 0.23, 2.228, 1.557]], [0.033, 0.025, 0.015, 0.001]), tapered("合角兽眼后独立的一对后弯骨角不是鼻叉分支", pale, [[side * 0.106, 1.61, 0.904], [side * 0.155, 1.805, 0.822], [side * 0.151, 1.941, 0.736]], [0.033, 0.026, 0.001]), leaf("合角兽后角外侧的小圆长耳", hide, [side * 0.121, 1.572, 0.802], 0.102, 0.19, [-12, side * 15, -side * 48]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.199 : 0.216), z = front ? 0.375 : -0.471;
      parts.push(tapered("合角兽前后有比例差而桡胫段最长的肢链", hide, [[x * 0.78, front ? 0.813 : 0.963, z], [x * 1.09, front ? 0.518 : 0.62, z + (front ? -0.045 : 0.123)], [x, front ? 0.231 : 0.271, z + (front ? 0.104 : -0.113)]], [front ? 0.092 : 0.113, 0.062, 0.042]));
      const rootZ = z + (front ? 0.104 : -0.113), bones: ModelPart[] = [], hooves: ModelPart[] = [];
      for (let index = 0; index < 4; index++) {
        const t = index - 1.5, central = index === 1 || index === 2, toeX = x + t * 0.041, y = front ? 0.231 : 0.271, end = rootZ + (front ? 0.139 : 0.173) - (central ? 0 : 0.035);
        bones.push(tapered("合角兽未融合而分别连接四功能趾的短掌跖段", hide, [[x + t * 0.014, y, rootZ], [toeX, 0.096, rootZ + 0.041], [toeX, 0.039, end]], [central ? 0.023 : 0.017, central ? 0.02 : 0.014, central ? 0.017 : 0.011]));
        hooves.push(lobe("合角兽前后每足四根真实落地的功能蹄趾", dark, [toeX, 0.035, end + 0.013], [central ? 0.047 : 0.034, central ? 0.065 : 0.053, central ? 0.1 : 0.072]));
      }
      parts.push(combineMeshes("合角兽不同于鹿融合长炮骨的四指趾骨链", hide, bones), combineMeshes("合角兽前后四功能蹄而不省成后双蹄", dark, hooves));
    }
  }
  return parts;
}

// https://rhinoresourcecenter.com/wp-content/uploads/2026/03/2026-Koenigswald-Anterior-dentition.pdf
// https://www.biodiversitylibrary.org/item/212227
function nesodon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("岛齿兽前后较等高而厚实的长胸腹", hide, [0, 0.939, -0.16], [0.97, 1.13, 1.79]), lobe("岛齿兽没有弓齿兽陡高后臀的较高前肩", hide, [0, 1.034, 0.451], [0.829, 1.05, 0.854]), tapered("岛齿兽由厚胸斜前伸的可辨粗颈", hide, [[0, 1.119, 0.517], [0, 1.287, 0.824]], [0.273, 0.208]), lobe("岛齿兽高深而前后延长的完整颅面", hide, [0, 1.318, 1.122], [0.516, 0.636, 0.795]), lobe("岛齿兽前端收窄而不成扁横铲的鼻吻", pale, [0, 1.138, 1.446], [0.346, 0.313, 0.433]), lobe("岛齿兽厚而深的长下颌及后部咬肌区", hide, [0, 0.986, 1.221], [0.395, 0.315, 0.693]), ...eyes([0, 1.463, 1.186], 0.19, 0.04), tapered("岛齿兽后臀伸出并向下收细的短尾", hide, [[0, 0.925, -0.917], [0.04, 0.603, -1.131], [0.067, 0.359, -1.198]], [0.064, 0.04, 0.012])];
  for (const side of [-1, 1]) {
    parts.push(lobe("岛齿兽高深颅后侧的小圆耳", dark, [side * 0.192, 1.506, 0.831], [0.094, 0.142, 0.085]), lobe("岛齿兽窄吻端侧方的鼻孔", dark, [side * 0.106, 1.178, 1.616], [0.044, 0.025, 0.015]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.326 : 0.342), z = front ? 0.532 : -0.696;
      parts.push(tapered("岛齿兽前后均粗壮而非前短后长的三趾肢", hide, [[x * 0.76, front ? 0.891 : 0.867, z], [x * 1.1, front ? 0.477 : 0.494, z + (front ? -0.073 : 0.113)], [x, 0.119, z + (front ? 0.111 : -0.101)]], [front ? 0.166 : 0.187, 0.112, 0.068]));
      const rootZ = z + (front ? 0.111 : -0.101), digits: ModelPart[] = [], hooves: ModelPart[] = [];
      for (let index = -1; index <= 1; index++) {
        const toeX = x + index * 0.076, endZ = rootZ + (index ? 0.135 : 0.185);
        digits.push(tapered("岛齿兽三根各自负重的粗指趾骨", hide, [[x + index * 0.027, 0.123, rootZ], [toeX, 0.047, endZ]], [index ? 0.043 : 0.052, index ? 0.031 : 0.041]));
        hooves.push(lobe("岛齿兽三主趾分别相接且有真趾缝的蹄甲", dark, [toeX, 0.039, endZ + 0.014], [index ? 0.067 : 0.087, 0.075, index ? 0.122 : 0.157]));
      }
      parts.push(combineMeshes("岛齿兽完整三指趾掌骨", hide, digits), combineMeshes("岛齿兽三枚承重蹄甲", dark, hooves));
    }
    parts.push(combineMeshes("岛齿兽前牙为分离切齿而不作弓齿兽横铲门齿", pale, Array.from({ length: 3 }, (_, index) => lobe("岛齿兽唇缘内的单枚短切齿", pale, [side * (0.022 + index * 0.043), 0.98, 1.566 - index * 0.012], [0.033, 0.053, 0.03]))));
  }
  return parts;
}

export const largeAncientMammalExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("epicyon", "上犬", "动物", () => calibrated(epicyon(), 0.78), ["Epicyon haydeni", "深厚穹额宽腭短强腰四主趾行足及前悬拇趾", "大颊齿和下臼齿凹盆", "骨学约束的完整软组织简化复原"]),
  design("hemicyon", "半熊", "动物", () => calibrated(hemicyon(), 0.82), ["Hemicyon sansaniensis", "长柔腰长尾长颌与高跗趾行跑肢", "缺失段参照同属H.ursinus骨架", "骨学约束的完整软组织简化复原"]),
  design("synthetoceras", "合角兽", "动物", () => calibrated(synthetoceras(), 0.8), ["Synthetoceras tricornatus", "鼻骨Y柱与独立眼后双角长深颅", "每足四功能趾未融合短掌跖及较长后肢", "骨学约束的完整软组织简化复原"]),
  design("nesodon", "岛齿兽", "动物", nesodon, ["Nesodon imbricatus", "高深长颌窄鼻吻前后等高粗肢三主蹄", "分离前切齿而非横向门齿铲", "骨学约束的完整软组织简化复原"]),
];

import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { halfDomeRoof, halfRoundWall } from "../masterArchitecture/spatialShells";
import { tapered } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 独立的大型航天飞行部件；不附加不同宿主、不拆分状态扩主，不提供制造或动力仿真参数。
// https://www.nasa.gov/directorates/stmd/impact-story-roll-out-solar-arrays/
// https://www.jpl.nasa.gov/nmp/st8/tech/solar_array3.html
// https://www.esa.int/Enabling_Support/Space_Transportation/Ariane/Ariane_5_fairing
// https://www.nasa.gov/reference/launch-abort-system/
export const aerospaceExpansionBatchSixteen: TransportDefinition[] = [
  { name: "开缝弹性边梁长幅卷展柔性太阳翼总成", theme: "科幻", itemType: "构件", tags: ["卷展太阳翼", "真正开缝弹性管梁", "连续柔性电池毯", "完整大型航天部件"], create: () => {
    const parts: ModelPart[] = [box("卷展太阳翼与航天器连接的集中安装基座", [0, 0.3, -0.3], [2.0, 0.6, 1.2], transportColors.body), cylinder("在根部横跨整张柔性电池毯的收卷芯轴", [0, 1.2, -0.3], [0.45, 8.3, 0.45], transportColors.dark, [0, 0, 90]), box("将柔性毯根部夹持在收卷机构上的连续压条", [0, 1.2, 0], [8.3, 0.2, 0.15], transportColors.body), box("没有分段刚性背板的连续柔性薄毯基材", [0, 1.18, 20], [7.74, 0.04, 40], transportColors.dark), box("将两根弹性边梁在远端连成整体的端部横条", [0, 1.2, 40], [8.3, 0.18, 0.16], transportColors.body)];
    for (const side of [-1, 1]) {
      const boom = halfRoundWall("沿翼长展开且全长保留真实纵向开缝的弹性薄管边梁", 0.14, 0.02, 40, [side * 4, 1.2, 0], side > 0 ? 342 : 162, transportColors.body, Math.PI * 1.8); boom.rotation.x = 90;
      parts.push(boom, box("根部收卷芯轴的侧向轴承端架", [side * 4, 1.2, -0.1], [0.5, 0.6, 0.6], transportColors.body), strut("集中安装基座向收卷机构外端伸出的承力叉臂", [side * 0.7, 0.5, -0.3], [side * 4, 1.2, -0.2], 0.15));
    }
    for (let index = 0; index < 20; index++) parts.push(box("贴合连续柔性基材并沿翼长排布的光伏电池带", [0, 1.208, 1 + index * 2], [7.7, 0.016, 1.9], index % 2 ? "#496e82" : "#51788a"));
    return parts;
  } },
  { name: "径向支肋扇折圆盘柔性太阳翼总成", theme: "科幻", itemType: "构件", tags: ["径向扇折太阳翼", "中心铰毂", "放射承力肋", "折扇式柔性电池膜"], create: () => {
    const parts: ModelPart[] = [cylinder("独立太阳翼根部与航天器相连的短承力轴", [0, 0.45, 0], [0.96, 0.9, 0.96], transportColors.body), ring("各条扇折支肋围绕的中央展开承力铰毂", transportColors.dark, 0.65, 0.2, 1.1, 0.4), ring("在外缘统一张紧各片柔性膜的细周向拉圈", transportColors.body, 7.52, 0.035, 1.0, 0.05), cylinder("中央铰毂上方的封闭展开机构盖", [0, 1.35, 0], [1.25, 0.16, 1.25], transportColors.body)];
    for (let index = 0; index < 24; index++) {
      const a = index * Math.PI / 12, b = (index + 1) * Math.PI / 12, middle = (a + b) / 2;
      parts.push(surface("在相邻径向肋之间带有真实折脊的柔性光伏扇片", index % 2 ? "#496e82" : "#51788a", [[Math.cos(a) * 0.6, 1.0, Math.sin(a) * 0.6], [Math.cos(a) * 7.5, 1.0, Math.sin(a) * 7.5], [Math.cos(middle) * 7.5, 1.12, Math.sin(middle) * 7.5], [Math.cos(b) * 7.5, 1.0, Math.sin(b) * 7.5], [Math.cos(b) * 0.6, 1.0, Math.sin(b) * 0.6]], [0, 2, 1, 0, 3, 2, 0, 4, 3]), strut("从中央铰毂扇形转开并支承电池膜的独立径向肋", [Math.cos(a) * 0.55, 1.0, Math.sin(a) * 0.55], [Math.cos(a) * 7.5, 1.0, Math.sin(a) * 7.5], 0.045));
    }
    return parts;
  } },
  { name: "双瓣中空复合壳火箭载荷整流罩总成", theme: "现代", itemType: "构件", tags: ["双瓣载荷整流罩", "连续中空薄壳", "内部纵向加强肋", "完整分离罩总成"], create: () => {
    const parts: ModelPart[] = [];
    for (const end of [-1, 1]) {
      const yaw = end > 0 ? 0 : 180, offset = end * 0.55;
      parts.push(halfRoundWall("两片相对配套的半圆筒中空复合壳主体", 2.7, 0.06, 9, [0, 0, offset], yaw, transportColors.body));
      const nose = halfDomeRoof("与半圆筒壳连续相接的细长空心半瓣头罩", 2.7, 0.06, [0, 9, offset], yaw, transportColors.body); nose.scale.y = 6 / 2.7; parts.push(nose);
      for (const y of [0.1, 3.0, 6.0, 8.9]) parts.push(halfRoundWall("在壳体内侧沿周向承力的半环形加强肋", 2.66, 0.1, 0.18, [0, y, offset], yaw, transportColors.trim));
      for (const angle of [Math.PI / 6, Math.PI / 3, Math.PI / 2, Math.PI * 2 / 3, Math.PI * 5 / 6]) parts.push(strut("沿圆筒壳内壁连接各半环肋的长纵向加强筋", [Math.cos(angle) * 2.63, 0.2, offset + end * Math.sin(angle) * 2.63], [Math.cos(angle) * 2.63, 8.95, offset + end * Math.sin(angle) * 2.63], 0.08, transportColors.trim));
      for (const angle of [Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) {
        const path: Triple[] = Array.from({ length: 6 }, (_, index) => {
          const latitude = index * Math.PI / 10, radius = 2.655 * Math.cos(latitude);
          return [Math.cos(angle) * radius, 9 + Math.sin(latitude) * 2.655 * 6 / 2.7, offset + end * Math.sin(angle) * radius];
        });
        parts.push(tapered("从筒体内纵筋接到头罩极点的连续曲面加强肋", transportColors.trim, path, path.map(() => 0.055)));
      }
      for (const side of [-1, 1]) parts.push(strut("沿半瓣壳体两条分离边固定的连续接口边框", [side * 2.7, 0.1, offset], [side * 2.7, 8.95, offset], 0.1, transportColors.dark));
    }
    return parts;
  } },
  { name: "桁架拉拽式载人发射逃逸塔总成", theme: "现代", itemType: "构件", tags: ["载人发射逃逸塔", "开放四腿承力桁架", "外张贯通拉拽喷管", "完整大型飞行安全组件"], create: () => {
    const parts: ModelPart[] = [ring("与载人飞行舱接口相连的连续底部承载环", transportColors.body, 2.1, 0.25, 0.1, 0.2), cylinder("位于承力桁架上方的封闭长筒逃逸动力壳", [0, 6.5, 0], [1.15, 4.4, 1.15], transportColors.body), ring("开放承力桁架上端与动力壳连接的环形节点", transportColors.dark, 0.65, 0.12, 4.4, 0.2), ring("动力壳与上部姿态系统相接的外部结构圈", transportColors.trim, 0.7, 0.13, 7.2, 0.3), part("长筒动力壳顶端连续收分的封闭气动头锥", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 8.7 }, { x: 0.575, y: 8.7 }, { x: 0.4, y: 9.6 }, { x: 0, y: 10.1 }] })];
    const feet: Triple[] = [[-1.4, 0.2, -1.4], [1.4, 0.2, -1.4], [1.4, 0.2, 1.4], [-1.4, 0.2, 1.4]];
    for (let index = 0; index < feet.length; index++) {
      const foot = feet[index]!, next = feet[(index + 1) % feet.length]!, top: Triple = [foot[0] / 3.5, 4.5, foot[2] / 3.5], nextTop: Triple = [next[0] / 3.5, 4.5, next[2] / 3.5];
      parts.push(strut("从飞行舱承载环接到逃逸动力壳的开放桁架长腿", foot, top, 0.13), strut("相邻承力腿之间连接上下节点的抗剪斜杆", foot, nextTop, 0.08));
      for (const t of [0.05, 0.55]) {
        const a: Triple = [foot[0] * (1 - t) + top[0] * t, 0.2 + t * 4.3, foot[2] * (1 - t) + top[2] * t], b: Triple = [next[0] * (1 - t) + nextTop[0] * t, 0.2 + t * 4.3, next[2] * (1 - t) + nextTop[2] * t];
        parts.push(strut("将开放四腿桁架沿高度连成整体的横向承力圈边", a, b, 0.075));
      }
      const angle = index * Math.PI / 2, normal = new Vector3(-Math.cos(angle) * Math.sin(25 * Math.PI / 180), Math.cos(25 * Math.PI / 180), -Math.sin(angle) * Math.sin(25 * Math.PI / 180)), e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
      parts.push(part("从动力壳下部向外下方伸出的真正贯通逃逸喷管", "lathe", transportColors.dark, [Math.cos(angle) * 0.75, 5.4, Math.sin(angle) * 0.75], [1, 1, 1], [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI], { profile: [{ x: 0.32, y: -0.7 }, { x: 0.4, y: -0.7 }, { x: 0.18, y: 0.7 }, { x: 0.12, y: 0.7 }, { x: 0.32, y: -0.7 }] }));
      const p = new Vector3(Math.cos(angle) * 0.64, 8.0, Math.sin(angle) * 0.64), q = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(Math.cos(angle), 0, Math.sin(angle))));
      parts.push(ring("塔顶姿态组件沿周向布置的真实开孔喷口", transportColors.dark, 0.11, 0.035, 0, 0.15, { position: { x: p.x, y: p.y, z: p.z }, rotation: { x: q.x * 180 / Math.PI, y: q.y * 180 / Math.PI, z: q.z * 180 / Math.PI } }));
    }
    return parts;
  } },
];

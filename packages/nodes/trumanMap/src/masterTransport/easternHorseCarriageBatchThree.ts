import type { ModelPart } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { plate } from "../masterObjects/parts";
import { box, strut, transportColors, type TransportDefinition } from "./parts";

export const easternHorseCarriageBatchThree: TransportDefinition[] = [
  { name: "翘首舟厢马拉客雪橇", theme: "中式", tags: ["影视", "畜力车", "完整马拉客雪橇", "冬季交通", "舟形足窝与后高曲靠", "连续翘首长橇"], create: () => {
    const wood = "#987654", iron = transportColors.dark, upholstery = "#8f7661";
    const parts: ModelPart[] = [box("连接两侧高低曲壁的完整低位乘客足窝底", [0, .54, 0], [1.24, .08, 2.3], wood), plate("前足窝两侧曲壁之间真实闭合的薄前挡雪板", [0, 0, -1.29], [[-.62, .53], [.62, .53], [.62, .83], [.44, .91], [-.44, .91], [-.62, .83]], .06, wood, [0, 0, 0]), box("后部双人整幅乘坐板", [0, .84, .61], [1.18, .1, .7], wood), box("真实落在后座板上的薄软垫", [0, .915, .61], [1.13, .06, .66], upholstery), box("从低座后沿向后上方倾起的完整高靠背板", [0, 1.185, 1.05], [1.26, .83, .055], wood, [32.52, 0, 0]), box("贴合倾斜靠背的连续薄软垫", [0, 1.209, 1.012], [1.12, .69, .04], upholstery, [32.52, 0, 0])];
    const cheek: [number, number][] = [[-1.38, .52], [-1.35, .82], [-.92, .95], [-.35, .78], [.35, 1.15], [.65, 1.55], [1.12, 1.68], [1.38, 1.53], [1.40, .65], [.95, .49], [-.55, .43]];
    const runner: [number, number][] = [[1.8, 0], [-1.15, 0], [-1.55, .035], [-1.85, .15], [-2.05, .36], [-2.08, .63], [-1.98, .69], [-1.95, .42], [-1.75, .23], [-1.48, .13], [-1.10, .09], [1.80, .09]];
    const shoe: [number, number][] = [[1.8, 0], [-1.15, 0], [-1.55, .035], [-1.85, .15], [-2.05, .36], [-2.08, .63], [-2.064, .63], [-2.034, .367], [-1.843, .164], [-1.548, .051], [-1.149, .016], [1.8, .016]];
    for (const side of [-1, 1]) {
      parts.push(plate("由低足窝前口连续上升为后高翼的整面舟厢侧壁", [side * .63, 0, 0], cheek.map(([z, y]): [number, number] => [-z, y]), .055, wood, [0, 90, 0]), plate("从后部长平段连续回曲成高翘前鼻的完整木橇", [side * .7, 0, 0], runner.map(([z, y]): [number, number] => [-z, y]), .105, wood, [0, 90, 0]), plate("包住同一木橇下缘并实际接地的连续窄铁橇底", [side * .7, 0, 0], shoe.map(([z, y]): [number, number] => [-z, y]), .11, iron, [0, 90, 0]), box("在曲壁内承到双人坐板的独立短座脚", [side * .46, .69, .61], [.08, .22, .56], wood), box("两道橇撑上方与足窝底直接相接的纵向承舱梁", [side * .56, .48, .15], [.08, .08, 2.0], wood), tapered("从完整舟厢前部伸向马身两侧的弯曲长牵引辕", wood, [[side * .48, .51, -.70], [side * .44, .60, -1.80], [side * .40, .92, -3.40]], [.052, .047, .038]), tapered("低足窝后侧连接到高靠翼的完整木扶臂", wood, [[side * .64, 1.03, -.15], [side * .64, 1.08, .35], [side * .64, 1.22, .82]], [.025, .025, .025]), strut("扶臂前端真正落接曲侧壁的短立托", [side * .64, .76, -.15], [side * .64, 1.03, -.15], .045, wood));
      for (const z of [-.65, .95]) parts.push(strut("从接地长橇上端外展到乘舱底的完整斜橇撑", [side * .7, .08, z], [side * .56, .52, z], .10, wood));
    }
    for (const z of [-.65, .95]) parts.push(box("两根斜橇撑之间连贯承力的宽横枨", [0, .32, z], [1.55, .10, .105], wood));
    return parts;
  } },
];

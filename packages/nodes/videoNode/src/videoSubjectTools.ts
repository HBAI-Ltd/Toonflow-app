import { markMessages } from "@toonflow/i18n/vue";
import { IconBlur, IconFocusCentered } from "@tabler/icons-vue";
import videoSubjectEditor from "./components/videoSubjectEditor.vue";
import { choice, numeric, tool } from "./videoToolJob";

export const subjectTools = markMessages([
  tool("裁剪与尺寸", "reframe", "跟着主体裁剪", [choice("aspect", "成片比例", { portrait: "9∶16 竖屏", square: "1∶1 方形", fourFive: "4∶5 竖幅" }),
    numeric("smooth", "跟随平稳程度", 70, 0, 100)], { modelId: "ormbg", icon: IconFocusCentered, editor: videoSubjectEditor }),
  tool("人物与背景", "blurBackground", "虚化背景", [numeric("radius", "背景模糊程度", 18, 2, 48)],
    { modelId: "ormbg", icon: IconBlur, editor: videoSubjectEditor }),
]);

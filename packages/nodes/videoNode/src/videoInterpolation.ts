import { markMessages, translate } from "@toonflow/i18n/vue";
import { IconMovie, IconUserScan, IconZoomScan } from "@tabler/icons-vue";
import { runMediaModelJob } from "@toonflow/node-shared/mediaModelJob";
import type { MediaTool, MediaToolContext, MediaToolResult } from "@toonflow/node-shared/mediaTools";
import videoEnhanceEditor from "./components/videoEnhanceEditor.vue";
import portraitMattingEditor from "./components/portraitMattingEditor.vue";
import { subjectTools } from "./videoSubjectTools";
import { productionModelTools } from "./videoProductionTools";
import { choice, numeric, tool } from "./videoToolJob";

export const modelVideoTools = markMessages([
  tool("画质与调色", "rifeInterpolation", "让动作更流畅", [numeric("factor", "每秒画面数", 2, 2, 4)], { modelId: "rife", icon: IconMovie, editor: videoEnhanceEditor }),
  tool("画质与调色", "upscale", "高清放大", [numeric("scale", "放大倍数", 2, 2, 4)], { modelId: "realEsrgan", icon: IconZoomScan, editor: videoEnhanceEditor }),
  ...subjectTools,
  ...productionModelTools,
  tool("人物与背景", "portraitMatting", "抠出人物", [choice("outputMode", "输出内容", { transparent: "保留人物，背景透明", mask: "黑白遮罩" })], { modelId: "rvmMobileNet", icon: IconUserScan, editor: portraitMattingEditor }),
]);

export async function runVideoModel(tool: MediaTool, { directory, source, outputDirectory, signal, reportProgress, values }: MediaToolContext): Promise<MediaToolResult[]> {
  signal.throwIfAborted();
  const options = { ...values, operation: tool.id === "rifeInterpolation" ? "interpolate" : tool.id };
  const transparent = options.operation === "portraitMatting" && values.outputMode === "transparent";
  const subtitle = options.operation === "readSubtitles";
  const path = outputDirectory + (subtitle ? "/result.vtt" : transparent ? "/result.webm" : "/result.mp4");
  await runMediaModelJob("video", { directory, source: source.url, output: path, options }, signal, reportProgress);
  return [{ path, mimeType: subtitle ? "text/vtt" : transparent ? "video/webm" : "video/mp4", label: options.operation === "upscale" || options.operation === "interpolate"
    ? `${translate(tool.label)} · ${values.scale ?? values.factor}×` : tool.label }];
}

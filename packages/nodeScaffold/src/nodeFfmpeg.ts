import { inject, onScopeDispose } from "vue";
import { createDisplayError, createTranslator } from "@toonflow/i18n";
import zh from "./locales/zh.json";
import en from "./locales/en.json";

const t = createTranslator({ zh, en });
import { createBrowserFfmpeg } from "@toonflow/ffmpeg/browser";

export type { BrowserFfmpegFactory, BrowserFfmpegCommand, BrowserFfmpegOptions, FfprobeData } from "@toonflow/ffmpeg/browser";

export function useNodeFfmpeg() {
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const lifetime = new AbortController();
  onScopeDispose(() => lifetime.abort());

  return (signal?: AbortSignal) => {
    if (!getDirectory) throw createDisplayError("当前画布未提供工作区目录", () => t("workspaceDirectoryUnavailable"));
    return createBrowserFfmpeg(getDirectory(), signal ? AbortSignal.any([lifetime.signal, signal]) : lifetime.signal);
  };
}

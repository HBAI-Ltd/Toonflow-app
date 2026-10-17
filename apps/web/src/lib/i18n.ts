import axios, { type AxiosInstance } from "axios";
import { computed, watch } from "vue";
import { detectLocale, isRtlLocale } from "@toonflow/i18n";
import { locale, setLocale, translate, msg } from "@toonflow/i18n/vue";
import { uiSettings } from "@/stores/settings";
import type { LocaleConfig } from "vue-stream-markdown";
import "dayjs/locale/zh-cn";
import "dayjs/locale/zh-tw";
import "dayjs/locale/ja";
import "dayjs/locale/ru";
import "dayjs/locale/vi";
import "dayjs/locale/th";
import "dayjs/locale/ko";
import "dayjs/locale/hi";
import "dayjs/locale/id";
import "dayjs/locale/ms";
import "dayjs/locale/tl-ph";
import "dayjs/locale/bn";
import "dayjs/locale/ur";
import "dayjs/locale/ta";
import "dayjs/locale/te";
import "dayjs/locale/mr";
import "dayjs/locale/pa-in";
import "dayjs/locale/ar";
import "dayjs/locale/fa";
import "dayjs/locale/tr";

export function registerApiLanguage(client: AxiosInstance) {
  const interceptor = client.interceptors.request.use(config => {
    const url = new URL(client.getUri(config), window.location.href);
    // ACT: 仅本应用 API 接收界面语言，不改变供应商等外部请求。
    if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) config.headers.set("Accept-Language", locale.value);
    return config;
  });
  return () => client.interceptors.request.eject(interceptor);
}

export function registerLanguage() {
  const applyLanguage = () => setLocale(uiSettings.value.language === "system" ? detectLocale(navigator.languages) : uiSettings.value.language);
  const stopSettings = watch(() => uiSettings.value.language, applyLanguage, { immediate: true, flush: "sync" });
  const stopDocument = watch(locale, value => {
    document.documentElement.lang = value;
    document.documentElement.dir = isRtlLocale(value) ? "rtl" : "ltr";
  }, { immediate: true });
  const stopRequests = registerApiLanguage(axios);
  window.addEventListener("languagechange", applyLanguage);
  return () => {
    stopSettings();
    stopDocument();
    stopRequests();
    window.removeEventListener("languagechange", applyLanguage);
  };
}

// ACT: 只翻译 Markdown 控件，用户输入和模型生成的正文原样显示。
export const markdownLocale = computed<LocaleConfig>(() => ({
  button: {
    zoomIn: translate("放大"), zoomOut: translate("缩小"), resetZoom: translate("重置缩放"),
    preview: translate("预览"), source: translate("代码"), collapse: translate("折叠"),
    copy: translate("复制"), copied: translate("已复制"), download: translate("下载"),
    minimize: translate("最小化"), maximize: translate("最大化"), flipY: translate("垂直翻转"),
    flipX: translate("水平翻转"), rotateLeft: translate("向左旋转"), rotateRight: translate("向右旋转"),
    previous: translate("上一个"), next: translate("下一个"), back: translate("返回"),
    confirm: translate("确认"), cancel: translate("取消"),
  },
  error: {
    vanilla: translate("错误"), image: translate("图片加载失败"), mermaid: translate("Mermaid 渲染失败"),
    katex: translate("KaTeX 渲染失败"), harden: translate("已拦截"),
  },
  link: {
    title: translate("打开外部链接？"), description: translate("你即将访问外部网站"),
    copy: translate("复制链接"), open: translate("打开链接"),
  },
  dialog: { fullscreen: translate("全屏预览"), imagePreview: translate("图片预览") },
}));

export const chatLocale = computed(() => ({
  placeholder: translate("请输入消息..."), stopBtnText: translate("中止"), refreshTipText: translate("重新生成"),
  copyTipText: translate("复制"), likeTipText: translate("点赞"), dislikeTipText: translate("点踩"),
  copyCodeBtnText: translate("复制代码"), copyCodeSuccessText: translate("已复制"), clearHistoryBtnText: translate("清空历史记录"),
  copyTextSuccess: translate("已成功复制到剪贴板"), copyTextFail: translate("复制到剪贴板失败"),
  confirmClearHistory: translate("确定要清空所有的消息吗？"), loadingText: translate("思考中..."), loadingEndText: translate("已深度思考"),
  uploadImageText: translate("上传图片"), uploadAttachmentText: translate("上传附件"), shareTipText: translate("分享"),
}));

// Translate built-in metadata only; custom plugin names and user aliases remain verbatim.
const nodeNames = {
  "remote-textNode": msg`文本`, "remote-imageNode": msg`图片`, "remote-videoNode": msg`视频`,
  "remote-audioNode": msg`音频`, "remote-audioGenerationNode": msg`音频生成`,
  "remote-imageGenerationNode": msg`图片生成`, "remote-videoGenerationNode": msg`视频生成`,
  "remote-director3dNode": msg`3D导演台`,
};
export function nodeDisplayName(type: string | undefined, label: string): string {
  const message = type && Object.hasOwn(nodeNames, type) ? nodeNames[type as keyof typeof nodeNames] : undefined;
  return message?.id === label ? translate(message) : label;
}

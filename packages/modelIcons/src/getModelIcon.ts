const iconFiles = import.meta.glob<string>([
  "../node_modules/@lobehub/icons-static-svg/icons/*.svg",
  "!../node_modules/@lobehub/icons-static-svg/icons/*-text*.svg",
  "!../node_modules/@lobehub/icons-static-svg/icons/*-brand*.svg",
], {
  eager: true,
  import: "default",
  query: "?url&no-inline",
});

const icons = new Map<string, { src: string; monochrome: boolean }>();
for (const [path, src] of Object.entries(iconFiles)) {
  const file = path.split("/").pop()!.replace(/\.svg$/, "");
  const name = file.replace(/-color$/, "");
  if (name.includes("-")) continue;
  const monochrome = file === name;
  if (!icons.has(name) || !monochrome) icons.set(name, { src, monochrome });
}

const fallbackIcon = {
  src: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="sparkleGradient" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a855f7"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs><path fill="url(#sparkleGradient)" d="M10 3c1.1 5.2 3.8 7.9 9 9-5.2 1.1-7.9 3.8-9 9C8.9 15.8 6.2 13.1 1 12c5.2-1.1 7.9-3.8 9-9ZM19 1c.5 2.3 1.7 3.5 4 4-2.3.5-3.5 1.7-4 4-.5-2.3-1.7-3.5-4-4 2.3-.5 3.5-1.7 4-4Z"/></svg>'),
  monochrome: false,
};

// 模型家族名与品牌图标不同的映射；同名品牌自动使用整个图标包中的资源。
const aliases: Record<string, string[]> = {
  openai: ["gpt", "chatgpt", "codex", "whisper", "tts", "o1", "o3", "o4", "全能图片g"],
  claude: ["anthropic"],
  qwen: ["qwq", "qvq", "qwenimage", "cosyvoice", "funasr", "sensevoice", "通义千问"],
  meta: ["llama", "meta-llama"],
  mistral: ["mixtral", "magistral", "codestral", "ministral", "pixtral", "devstral", "voxtral"],
  kimi: ["moonshot"],
  chatglm: ["glm", "智谱"],
  wenxin: ["ernie", "文心"],
  kling: ["klingai", "可灵"],
  vidu: ["viduq"],
  google: ["veo", "imagen", "lyria"],
  runway: ["gen2", "gen3", "gen4", "gen-2", "gen-3", "gen-4"],
  luma: ["ray", "dream-machine"],
  hailuo: ["minimax-hailuo", "海螺"],
  alibaba: ["wan", "wanx", "wanvideo", "wan-video", "万相", "通义万相"],
  bytedance: ["seedance", "seedream", "seededit"],
  jimeng: ["即梦"],
  hunyuan: ["hunyuanvideo", "hunyuanimage", "混元"],
  cogvideo: ["cogvideox"],
  lightricks: ["ltx", "ltxvideo"],
  elevenlabs: ["eleven", "scribe"],
  fishaudio: ["fish-audio", "fish-speech", "fishspeech"],
  minimax: ["speech", "music", "abab"],
  stepfun: ["step", "step-audio", "stepaudio"],
  suno: ["chirp"],
  stability: ["stable-diffusion", "stable-audio", "stable-video", "sdxl", "sd3", "svd"],
  dalle: ["dall-e"],
  flux: ["black-forest-labs"],
};

const modelNames = [...icons.keys()].map(name => ({ prefix: name, brand: name }));
for (const [brand, names] of Object.entries(aliases)) {
  for (const prefix of names) modelNames.unshift({ prefix, brand });
}
modelNames.sort((left, right) => right.prefix.length - left.prefix.length);

export function getModelIcon(model: string) {
  // ACT: 无法凭任意名称可靠识别品牌；优先模型路径末段，未匹配再尝试服务商，最终使用通用图标。
  const segments = model.trim().toLowerCase().replace(/[_.\s]+/g, "-").split("/").reverse();
  for (const name of segments) {
    const match = modelNames.find(({ prefix }) => name.startsWith(prefix)
      && (!name[prefix.length] || /[-:0-9]/.test(name[prefix.length]!)));
    const icon = match && icons.get(match.brand);
    if (icon) return icon;
  }
  return fallbackIcon;
}

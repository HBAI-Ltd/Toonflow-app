// ACT: 此函数也会被序列化到原生壳的预检页面，必须保持自包含，不依赖模块变量。
export function getMissingBrowserFeatures(): string[] {
  const browser = globalThis as typeof globalThis & {
    ResizeObserver?: unknown;
    CSS?: { supports?: (property: string, value: string) => boolean };
  };
  const features: [string, unknown][] = [
    ["Map.groupBy", browser.Map?.groupBy],
    ["URL.canParse", browser.URL?.canParse],
    ["Promise.withResolvers", browser.Promise?.withResolvers],
    ["Intl.Segmenter", browser.Intl?.Segmenter],
    ["crypto.randomUUID", browser.crypto?.randomUUID],
    ["TextDecoderStream", browser.TextDecoderStream],
    ["ReadableStream", browser.ReadableStream],
    ["ResizeObserver", browser.ResizeObserver],
    ["AbortSignal.any", browser.AbortSignal?.any],
    ["AbortSignal.timeout", browser.AbortSignal?.timeout],
    ["structuredClone", browser.structuredClone],
  ];
  const missing = features.filter(([, method]) => typeof method !== "function").map(([name]) => name);
  if (!browser.CSS?.supports?.("color", "color-mix(in srgb, red, blue)")) missing.push("CSS color-mix");
  return missing;
}

export function modelScopeSource(repo: string, revision: string, file: string) {
  return { id: "modelScope", label: "魔搭社区", url: `https://modelscope.cn/models/${repo}/resolve/${revision}/${file}` };
}

export function huggingFaceSources(repo: string, revision: string, file: string, primary: [string, string] | "hfMirrorNet" = "hfMirrorNet") {
  const path = `${repo}/resolve/${revision}/${file}`;
  return [
    primary === "hfMirrorNet" ? { id: "hfMirrorNet", label: "HF-Mirror.net", url: `https://hf-mirror.net/${path}` } : modelScopeSource(...primary, file),
    { id: "hfMirror", label: "HF Mirror", url: `https://hf-mirror.com/${path}` },
    { id: "sufy", label: "Sufy CDN", url: `https://hf-cdn.sufy.com/${path}` },
    { id: "huggingface", label: "Hugging Face", url: `https://huggingface.co/${path}` },
  ];
}

function githubMirrors(url: string) {
  return [
    { id: "ghfast", label: "GHFast", url: `https://ghfast.top/${url}` },
    { id: "ghproxy", label: "GHProxy", url: `https://ghproxy.net/${url}` },
    { id: "github", label: "GitHub", url },
  ];
}

export function githubSources(repo: string, revision: string, file: string) {
  return githubMirrors(`https://github.com/${repo}/releases/download/${revision}/${file}`);
}

export function githubRawSources(repo: string, revision: string, file: string) {
  return githubMirrors(`https://github.com/${repo}/raw/${revision}/${file}`);
}

export const downloadSources = [
  {
    id: "npmmirror",
    label: "阿里镜像（推荐）",
    description: "国内下载源，建议优先使用",
    available: true,
    homepage: "https://npmmirror.com/",
    urlPrefix: "https://cdn.npmmirror.com/binaries/ffmpeg-static/b6.1.1/",
  },
  {
    id: "github",
    label: "GitHub 上游",
    description: "ffmpeg-static 项目发布的预编译程序",
    available: true,
    homepage: "https://github.com/eugeneware/ffmpeg-static/releases/tag/b6.1.1",
    urlPrefix: "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxy",
    label: "GH-Proxy 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh-proxy.org/",
    urlPrefix: "https://gh-proxy.org/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghFast",
    label: "GHFast 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://ghfast.top/",
    urlPrefix: "https://ghfast.top/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxyNet",
    label: "GHProxy.net 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://ghproxy.net/",
    urlPrefix: "https://ghproxy.net/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghJasonZeng",
    label: "JasonZeng 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh.jasonzeng.dev/",
    urlPrefix: "https://gh.jasonzeng.dev/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghGeekertao",
    label: "Geekertao 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh.dpik.top/",
    urlPrefix: "https://gh.dpik.top/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghLlkk",
    label: "LLKK 加速",
    description: "第三方 GitHub 加速渠道，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh.llkk.cc/",
    urlPrefix: "https://gh.llkk.cc/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxyIpv4",
    label: "GH-Proxy IPv4 优选",
    description: "GH-Proxy 的 IPv4 优选线路，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh-proxy.com/",
    urlPrefix: "https://v4.gh-proxy.org/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxyDualStack",
    label: "GH-Proxy 双栈优选",
    description: "GH-Proxy 的 IPv4 / IPv6 线路，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh-proxy.com/",
    urlPrefix: "https://v6.gh-proxy.org/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxyFastly",
    label: "GH-Proxy Fastly 线路",
    description: "GH-Proxy 的 Fastly CDN 线路，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh-proxy.com/",
    urlPrefix: "https://cdn.gh-proxy.org/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "ghProxyAxisNow",
    label: "GH-Proxy AxisNow 线路",
    description: "GH-Proxy 的 AxisNow 线路，下载后会验证文件完整性",
    available: true,
    homepage: "https://gh-proxy.com/",
    urlPrefix: "https://axisnow.gh-proxy.org/https://github.com/eugeneware/ffmpeg-static/releases/download/b6.1.1/",
  },
  {
    id: "tencent",
    label: "腾讯云",
    description: "未提供已核验的同版本构建，暂不支持自动下载",
    available: false,
    homepage: "https://mirrors.cloud.tencent.com/",
  },
  {
    id: "tuna",
    label: "清华大学",
    description: "暂无已核验的独立预编译程序，暂不支持自动下载",
    available: false,
    homepage: "https://mirrors.tuna.tsinghua.edu.cn/",
  },
] as const;

// SHA256 来自上游 b6.1.1 Release API，校验下载的 gzip 文件。
export const builds = {
  "win32-x64": {
    version: "6.1.1",
    ffmpeg: {
      fileName: "ffmpeg-win32-x64.gz",
      sha256: "8883a3dffbd0a16cf4ef95206ea05283f78908dbfb118f73c83f4951dcc06d77",
    },
    ffprobe: {
      fileName: "ffprobe-win32-x64.gz",
      sha256: "f309e6223ad89d2fe54bccd420a7709b66fd27540674e92309578ed491a43c8d",
    },
  },
  "darwin-x64": {
    version: "6.1.1",
    ffmpeg: {
      fileName: "ffmpeg-darwin-x64.gz",
      sha256: "929b375c1182d956c51f7ac25e0b2b0411fb01f6f407aa15c9758efeb4242106",
    },
    ffprobe: {
      fileName: "ffprobe-darwin-x64.gz",
      sha256: "d4da574d6e2e197bd259b47d69cf262df9e312af24ad960444f6d806d3d4c186",
    },
  },
  "darwin-arm64": {
    version: "6.1.1",
    ffmpeg: {
      fileName: "ffmpeg-darwin-arm64.gz",
      sha256: "8923876afa8db5585022d7860ec7e589af192f441c56793971276d450ed3bbfa",
    },
    ffprobe: {
      fileName: "ffprobe-darwin-arm64.gz",
      sha256: "d986a8ec7b030899fe66a8a288ed809a3543338705a3ce178cfb85869c5d80be",
    },
  },
  "linux-x64": {
    version: "6.1.1",
    ffmpeg: {
      fileName: "ffmpeg-linux-x64.gz",
      sha256: "bfe8a8fc511530457b528c48d77b5737527b504a3797a9bc4866aeca69c2dffa",
    },
    ffprobe: {
      fileName: "ffprobe-linux-x64.gz",
      sha256: "25d9b6ccb05e3d9de9e04e31e2506d8dd7f9f0418981965ac6df12e8d3afd067",
    },
  },
  "linux-arm64": {
    version: "6.1.1",
    ffmpeg: {
      fileName: "ffmpeg-linux-arm64.gz",
      sha256: "754a678672298bc68156adff58aa7385a592c2b30b1d0ae8750c45c915c4bac0",
    },
    ffprobe: {
      fileName: "ffprobe-linux-arm64.gz",
      sha256: "2ab6aba60ee84412dff9188720703376cb4e7aaf7e0b5e43aa8249f2acae5bf8",
    },
  },
} as const;

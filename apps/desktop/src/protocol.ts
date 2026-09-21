import type { PluginInstallRequest, PluginInstallType } from "@toonflow/server/desktop";

export function parseInstallUrl(value: string): PluginInstallRequest {
  try {
    if (value.length > 8192) throw new Error("安装链接不能超过 8192 个字符");
    if (/[\u0000-\u001f\u007f]/.test(value)) throw new Error("安装链接不能包含换行或控制字符");
    if (!URL.canParse(value)) throw new Error("安装链接不是有效 URL，应为 toonflow://install?type=node&url=编码后的下载地址");
    const link = new URL(value);
    if (link.protocol !== "toonflow:" || link.hostname !== "install" || !["", "/"].includes(link.pathname)) {
      throw new Error("安装链接格式错误，应为 toonflow://install?type=node&url=编码后的下载地址");
    }
    if (link.username || link.password || link.port || link.hash) throw new Error("安装链接不能包含账号、密码、端口或 # 片段");
    if ([...link.searchParams.keys()].some(key => key !== "type" && key !== "url")) {
      throw new Error("安装链接只能包含 type 和 url 参数；下载地址若带有签名或 & 参数，请先用 encodeURIComponent 编码整个下载地址，再放入 url 参数");
    }
    for (const key of ["type", "url"]) {
      const values = link.searchParams.getAll(key);
      if (!values.length) throw new Error(`安装链接缺少 ${key} 参数`);
      if (values.length > 1) throw new Error(`安装链接的 ${key} 参数不能重复；请先用 encodeURIComponent 编码完整下载地址`);
      if (!values[0]?.trim()) throw new Error(`安装链接的 ${key} 参数不能为空`);
    }
    const type = link.searchParams.get("type") as PluginInstallType;
    const patterns = {
      node: /^[a-z][a-zA-Z0-9]*\.umd\.js$/,
      tool: /^[a-z][a-zA-Z0-9]*\.tool\.js$/,
      skill: /^[^\\/\u0000-\u001f\u007f]+\.(?:md|zip|tar|tar\.gz|tgz)$/i,
      provider: /^[a-z][a-zA-Z0-9]*\.ts$/,
      agent: /^[a-z][a-zA-Z0-9]*\.agent\.zip$/,
    };
    const examples = { node: "imageNode.umd.js", tool: "askUser.tool.js", skill: "skill.zip、SKILL.md、skill.tar、skill.tar.gz 或 skill.tgz", provider: "myProvider.ts", agent: "exampleTeam.agent.zip" };
    if (!Object.hasOwn(patterns, type)) throw new Error("不支持此插件类型；type 仅支持 node（节点）、tool（工具）、skill（技能）、provider（供应商）或 agent（团队）");
    const url = link.searchParams.get("url")!;
    if (url.length > 4096) throw new Error("插件下载地址不能超过 4096 个字符");
    if (/[\u0000-\u001f\u007f]/.test(url)) throw new Error("插件下载地址不能包含换行或控制字符");
    if (!URL.canParse(url)) throw new Error("插件下载地址无效，应为完整的 HTTP / HTTPS 文件直链，例如 https://example.com/imageNode.umd.js；url 参数只需编码一次");
    const address = new URL(url);
    if (!["https:", "http:"].includes(address.protocol)) throw new Error("插件下载地址仅支持 HTTP / HTTPS 协议");
    if (address.username || address.password) throw new Error("插件下载地址不能包含账号密码");
    if (address.hash) throw new Error("插件下载地址不能包含 # 片段，请提供文件直链");
    let fileName: string;
    try { fileName = decodeURIComponent(address.pathname.split("/").at(-1) ?? ""); }
    catch { throw new Error("下载地址中的文件名编码无效，请检查 % 转义是否完整"); }
    if (!fileName) throw new Error(`下载地址缺少文件名，请提供文件直链，例如 ${examples[type]}`);
    if (fileName.length > 128) throw new Error("插件文件名不能超过 128 个字符");
    if (!patterns[type].test(fileName)) throw new Error(`插件文件名或扩展名与 ${type} 类型不符；${type === "skill" ? "支持" : "须使用小驼峰命名，例如"} ${examples[type]}`);
    return { type, url: address.href, fileName };
  } catch (error) {
    throw Object.assign(error instanceof Error ? error : new Error("安装链接无效"), { status: 400 });
  }
}

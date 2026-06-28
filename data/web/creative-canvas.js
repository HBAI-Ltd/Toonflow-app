(function () {
  const VIEWS = [
    { key: "overview", label: "总览" },
    { key: "source", label: "原文管理" },
    { key: "script", label: "剧本" },
    { key: "asset", label: "角色/场景/道具" },
    { key: "storyboard", label: "分镜" },
    { key: "video", label: "视频" },
    { key: "audit", label: "审计" },
  ];

  const AGENT_PROFILES = {
    overview: {
      title: "总览 Agent",
      role: "项目统筹、阶段进度与任务分派",
      placeholder: "询问项目进度、下一步瓶颈，或 @ 节点进行定位/分派",
      lockLabel: "锁定总览上下文",
    },
    source: {
      title: "原文管理 Agent",
      role: "原文章节、事件分析与改编入口",
      placeholder: "询问原文导入、章节事件、事件分析或后续改编入口",
      lockLabel: "锁定原文上下文",
    },
    script: {
      title: "剧本 Agent",
      role: "剧本结构、段落、对白与节奏",
      placeholder: "输入要改写、扩写、压缩或校验的剧本片段",
      lockLabel: "锁定剧本上下文",
    },
    asset: {
      title: "角色/场景/道具 Agent",
      role: "角色、场景、道具与视觉资产",
      placeholder: "输入角色/场景设定、参考图说明或资产修改要求",
      lockLabel: "锁定资产上下文",
    },
    storyboard: {
      title: "分镜 Agent",
      role: "镜头拆解、画面调度与拉片分析",
      placeholder: "输入镜头、构图、运动、声音或分镜调整要求",
      lockLabel: "锁定分镜上下文",
    },
    video: {
      title: "视频 Agent",
      role: "视频 prompt、生成结果与重生任务",
      placeholder: "输入视频 prompt 修改、重生或结果修复要求",
      lockLabel: "锁定视频上下文",
    },
    audit: {
      title: "审计 Agent",
      role: "来源、hash、revision 与下游影响",
      placeholder: "输入要定位、复盘或修改的生成内容句子",
      lockLabel: "锁定审计上下文",
    },
  };

  const AGENT_WIDTH_KEY = "tfcc.agentWidth";
  const SOURCE_REFERENCE_KEY = "tfcc.sourceReferences";
  const AGENT_WIDTH_MIN = 220;
  const AGENT_WIDTH_MAX = 620;

  function savedAgentWidth() {
    try {
      const width = Number(localStorage.getItem(AGENT_WIDTH_KEY));
      return Number.isFinite(width) ? Math.max(AGENT_WIDTH_MIN, Math.min(AGENT_WIDTH_MAX, width)) : 330;
    } catch {
      return 330;
    }
  }

  function savedSourceReferences() {
    try {
      return JSON.parse(localStorage.getItem(SOURCE_REFERENCE_KEY) || "{}") || {};
    } catch {
      return {};
    }
  }

  function persistSourceReferences() {
    try { localStorage.setItem(SOURCE_REFERENCE_KEY, JSON.stringify(state.sourceReferences || {})); } catch {}
  }

  const state = {
    installed: false,
    active: false,
    loading: false,
    message: "",
    view: "overview",
    graph: null,
    projects: [],
    selectedProjectId: null,
    selectedScriptId: null,
    selectedNodeId: null,
    editText: "",
    agentText: "",
    lockedAgentContext: "",
    agentSocket: null,
    agentSocketKey: "",
    agentConnected: false,
    agentConnecting: false,
    agentRunning: false,
    agentStickToOutput: false,
    agentError: "",
    agentPanelWidth: savedAgentWidth(),
    agentMessages: [],
    agentThreadKey: "",
    agentThreads: {},
    agentDrafts: {},
    agentLocks: {},
    agentLoadedThreads: {},
    agentSavePayloads: {},
    agentSaveTimer: null,
    agentMentionPicker: null,
    expandedAssetGroups: {},
    expandedImageFlows: {},
    imageFlowCache: {},
    nodePositionOverrides: {},
    sourceReferences: savedSourceReferences(),
    imageModelOptions: [],
    promptMentionPicker: null,
    agentPlanData: null,
    agentPlanDataId: null,
    syncedAgentMessages: {},
    authToken: "",
    runtimeApiBase: "",
    draggingNode: null,
    resizingNode: null,
    skipNodeClickId: "",
    panning: null,
    saveTimer: null,
    assetPollTimer: null,
    assetImagePollTimer: null,
    canvasResizeTimer: null,
    sourceEventPollTimer: null,
    // 图片流抽屉
    flowDrawer: null, // { targetType:'storyboard'|'asset', targetId, flowId, label, loading, error, upload, generated, references[], prompt, model, ratio, quality, generating, saving }
    // 深度思考开关
    agentThink: false,
    editNovelId: null,
    novelFullCache: {},
  };

  const IMAGE_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];
  const IMAGE_QUALITIES = ["1K", "2K", "4K"];

  function httpOriginFallback() {
    const origin = location.origin || "";
    return origin && origin !== "null" && !origin.startsWith("file:") ? origin : "http://localhost:10588";
  }

  function apiBase() {
    if (state.runtimeApiBase) return state.runtimeApiBase;
    let base = `${httpOriginFallback()}/api`;
    try {
      const raw = localStorage.getItem("setting");
      const parsed = raw ? JSON.parse(raw) : null;
      const stored = parsed?.baseUrl || parsed?.state?.baseUrl;
      if (typeof stored === "string" && stored.trim()) base = stored.trim();
    } catch {
      // Use same-origin fallback.
    }
    return base.replace(/\/+$/, "");
  }

  async function resolveRuntimeApiBase() {
    if (state.runtimeApiBase) return state.runtimeApiBase;
    if (location.protocol === "file:" || location.protocol === "toonflow:") {
      try {
        const data = await fetch("toonflow://getappurl").then((res) => res.json());
        const url = String(data?.url || "").trim();
        if (url) {
          state.runtimeApiBase = url.replace(/\/+$/, "");
          return state.runtimeApiBase;
        }
      } catch {
        // Use stored or same-origin API below.
      }
    }
    state.runtimeApiBase = apiBase();
    return state.runtimeApiBase;
  }

  function socketOrigin() {
    const fallback = httpOriginFallback();
    try {
      const url = new URL(apiBase(), fallback);
      url.pathname = url.pathname.replace(/\/api\/?$/, "") || "/";
      url.search = "";
      url.hash = "";
      const path = url.pathname.replace(/\/+$/, "");
      return `${url.origin}${path && path !== "/" ? path : ""}`;
    } catch {
      return fallback;
    }
  }

  function mediaUrl(value) {
    const text = String(value || "").trim();
    if (!text) return text;
    try {
      const url = new URL(text, socketOrigin());
      if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.port === "0") {
        return new URL(`${url.pathname}${url.search}${url.hash}`, socketOrigin()).toString();
      }
      if (text.startsWith("/") && !text.startsWith("//")) return url.toString();
    } catch {
      // Keep original value below.
    }
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(text)) return text;
    if (!text.startsWith("/")) return text;
    try {
      return new URL(text, socketOrigin()).toString();
    } catch {
      return text;
    }
  }

  function readStoredToken() {
    const keys = ["token", "authToken", "accessToken"];
    for (const store of [window.localStorage, window.sessionStorage]) {
      if (!store) continue;
      for (const key of keys) {
        const value = store.getItem(key);
        if (value) return value;
      }
      for (const key of ["user", "userInfo", "account"]) {
        const raw = store.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const value = parsed?.token || parsed?.state?.token || parsed?.data?.token;
          if (value) return value;
        } catch {
          // Keep scanning.
        }
      }
    }
    return "";
  }

  async function getAuthToken() {
    const stored = readStoredToken();
    if (stored) {
      state.authToken = stored;
      return stored;
    }
    if (state.authToken) return state.authToken;
    const isLocal = !location.hostname || ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
    if (!isLocal) return "";
    const login = await fetch(`${await resolveRuntimeApiBase()}/login/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123" }),
    })
      .then((res) => res.json())
      .catch(() => null);
    const token = login?.data?.token || "";
    if (token) state.authToken = token;
    return token;
  }

  async function api(path, options = {}) {
    const base = await resolveRuntimeApiBase();
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = token;
    return fetch(`${base}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(async (res) => {
      const text = await res.text();
      let json = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new Error("接口返回非 JSON，可能连接到了错误的前端地址或旧服务");
      }
      const hasCode = Object.prototype.hasOwnProperty.call(json, "code");
      const hasData = Object.prototype.hasOwnProperty.call(json, "data");
      if (!res.ok || (hasCode && Number(json.code) !== 200)) throw new Error(json.message || res.statusText || "请求失败");
      if (!hasCode && !hasData && json.message) throw new Error(json.message);
      return hasData ? json.data : json;
    });
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SVG_TAGS = new Set(["svg", "path", "g", "circle", "rect", "line", "polyline", "polygon", "defs", "marker", "text"]);

  function h(tag, attrs = {}, children = []) {
    const isSvg = SVG_TAGS.has(tag);
    const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
    let pendingValue;
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "class") {
        if (isSvg) el.setAttribute("class", value);
        else el.className = value;
      } else if (key === "text") el.textContent = value;
      else if (key === "html") el.innerHTML = value;
      else if (key === "title") {
        if (isSvg) el.setAttribute("title", value);
        else el.title = value;
      } else if (key === "value") pendingValue = value;
      else if (key === "disabled") el.disabled = Boolean(value);
      else if (key === "style" && typeof value === "object") Object.assign(el.style, value);
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === "src" && ["img", "video", "source"].includes(tag)) el.setAttribute(key, mediaUrl(value));
      else el.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child === undefined || child === null) return;
      el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    if (pendingValue !== undefined) el.value = pendingValue;
    return el;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderInlineMarkdown(value) {
    const codeSpans = [];
    let text = String(value ?? "").replace(/`([^`]+)`/g, (_match, code) => {
      const token = `\u0000CODE${codeSpans.length}\u0000`;
      codeSpans.push(`<code>${escapeHtml(code)}</code>`);
      return token;
    });
    text = escapeHtml(text)
      .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
      .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
      .replace(/~~([^~\n]+)~~/g, "<del>$1</del>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    codeSpans.forEach((html, index) => {
      text = text.replaceAll(`\u0000CODE${index}\u0000`, html);
    });
    return text;
  }

  function isMarkdownTableSeparator(line) {
    return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line || "");
  }

  function markdownTableCells(line) {
    return String(line || "")
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function renderMarkdownTable(lines) {
    const header = markdownTableCells(lines[0]);
    const body = lines.slice(2).map(markdownTableCells);
    return [
      "<table>",
      "<thead><tr>",
      header.map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`).join(""),
      "</tr></thead>",
      "<tbody>",
      body.map((row) => `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`).join(""),
      "</tbody></table>",
    ].join("");
  }

  function renderMarkdown(text) {
    const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
    const html = [];
    let paragraph = [];
    let list = null;
    let codeBlock = null;

    const flushParagraph = () => {
      if (!paragraph.length) return;
      html.push(`<p>${paragraph.map(renderInlineMarkdown).join("<br>")}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!list) return;
      html.push(`<${list.type}>${list.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</${list.type}>`);
      list = null;
    };

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^\s*```/.test(line)) {
        flushParagraph();
        flushList();
        if (codeBlock) {
          html.push(`<pre><code>${escapeHtml(codeBlock.join("\n"))}</code></pre>`);
          codeBlock = null;
        } else {
          codeBlock = [];
        }
        continue;
      }
      if (codeBlock) {
        codeBlock.push(line);
        continue;
      }
      if (!line.trim()) {
        flushParagraph();
        flushList();
        continue;
      }
      if (lines[index + 1] && line.includes("|") && isMarkdownTableSeparator(lines[index + 1])) {
        flushParagraph();
        flushList();
        const tableLines = [line, lines[index + 1]];
        index += 2;
        while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
          tableLines.push(lines[index]);
          index += 1;
        }
        index -= 1;
        html.push(renderMarkdownTable(tableLines));
        continue;
      }
      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = Math.min(heading[1].length + 2, 6);
        html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }
      const unordered = line.match(/^\s*[-*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        flushParagraph();
        const type = ordered ? "ol" : "ul";
        if (!list || list.type !== type) flushList();
        if (!list) list = { type, items: [] };
        list.items.push((unordered || ordered)[1]);
        continue;
      }
      const quote = line.match(/^\s*>\s?(.+)$/);
      if (quote) {
        flushParagraph();
        flushList();
        html.push(`<blockquote>${renderInlineMarkdown(quote[1])}</blockquote>`);
        continue;
      }
      paragraph.push(line);
    }
    if (codeBlock) html.push(`<pre><code>${escapeHtml(codeBlock.join("\n"))}</code></pre>`);
    flushParagraph();
    flushList();
    return html.join("");
  }

  function short(value, max = 120) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max)}...` : text;
  }

  function shortMarkdown(value, max = 360) {
    const text = String(value || "").trim();
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
  }

  function nodePreviewLimit(node, fallback = 260) {
    const width = Number(node?.width || 260);
    const height = Number(node?.height || 140);
    return Math.max(fallback, Math.min(1800, Math.round((width * height) / 120)));
  }

  function nodeMarkdownPreview(node, value, fallback = 260) {
    return h("div", {
      class: "tfcc-node-markdown tfcc-markdown",
      html: renderMarkdown(shortMarkdown(value, nodePreviewLimit(node, fallback))),
    });
  }

  function assetTypeLabel(type) {
    if (type === "scene") return "场景";
    if (type === "tool" || type === "props" || type === "prop") return "道具";
    if (type === "clip") return "片段";
    return "角色";
  }

  function parseMaybeJson(value, fallback = {}) {
    if (!value) return fallback;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function formatTime(value) {
    if (!value) return "-";
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  function baseGraphNodes() {
    return state.graph?.nodes || [];
  }

  function expandedAssetNodes(nodes = baseGraphNodes()) {
    const out = [];
    nodes
      .filter((node) => node.type === "assetGroup" && state.expandedAssetGroups[node.id])
      .forEach((group) => {
        const items = group.data?.items || [];
        const baseX = group.position.x + (group.width || 320) + 90;
        const baseY = group.position.y + 30 - Math.min(items.length, 6) * 42;
        items.forEach((item, index) => {
          const col = Math.floor(index / 6);
          const row = index % 6;
          const promptPreview = item.promptPreview || "";
          const typeLabel = assetTypeLabel(item.type);
          const assetName = item.name || `资产 ${item.id}`;
          out.push({
            id: `expandedAsset:${group.id}:${item.id}`,
            type: "asset",
            label: `#${item.id} ${typeLabel} · ${assetName}`,
            position: { x: baseX + col * 520, y: baseY + row * 236 },
            width: 220,
            height: 210,
            status: item.promptState === "failed" || item.promptState === "error" ? "需复核" : "已完成",
            sourceLabel: group.sourceLabel,
            data: {
              expandedFromGroup: group.id,
              thumbnail: item.thumbnail || "",
              promptPreview,
              asset: {
                ...item,
                projectId: projectId(),
                scriptId: scriptId(),
                prompt: item.prompt || promptPreview,
                describe: item.describe || promptPreview,
              },
            },
          });
          (item.images || []).forEach((image, imageIndex) => {
            out.push({
              id: `expandedAssetImage:${group.id}:${item.id}:${image.id || imageIndex}`,
              type: "assetImage",
              label: `图#${image.id || imageIndex + 1} ${typeLabel} · ${assetName}`,
              position: { x: baseX + col * 520 + 280 + imageIndex * 160, y: baseY + row * 236 + 16 },
              width: 140,
              height: 178,
              status: image.selected ? "已选中" : (image.state || "图片"),
              sourceLabel: item.name || `资产 ${item.id}`,
              data: {
                expandedImageFromAsset: `expandedAsset:${group.id}:${item.id}`,
                image,
                asset: item,
                thumbnail: image.thumbnail || "",
              },
            });
          });
        });
      });
    return out;
  }

  function imageFlowNodeId(assetNodeId, flowNodeId) {
    return `imageFlow:${assetNodeId}:${flowNodeId}`;
  }

  function imageFlowNodeImage(flowNode) {
    const data = flowNode?.data || {};
    if (flowNode?.type === "generated") return data.generatedImage || "";
    return data.image || "";
  }

  function imageFlowMentionName(prompt, index) {
    const match = String(prompt || "").match(new RegExp(`@(?:图片|图)${index}\\s*为([^@，,。\\n]+)`));
    return match ? match[1].trim() : "";
  }

  function expandedImageFlowNodes(nodes) {
    const out = [];
    Object.entries(state.expandedImageFlows).forEach(([assetNodeId, flowId]) => {
      const assetNode = nodes.find((node) => node.id === assetNodeId);
      const flow = state.imageFlowCache[flowId];
      const flowNodes = flow?.nodes || [];
      if (!assetNode || !flowNodes.length) return;
      const generatedNode = flowNodes.find((node) => node.type === "generated") || {};
      const generatedPrompt = generatedNode.data?.prompt || generatedNode.data?.text || "";
      const mentions = flowNodes
        .filter((node) => node.type !== "generated")
        .map((node, index) => ({
          token: `@图片${index + 1}`,
          label: imageFlowMentionName(generatedPrompt, index + 1) || `参考图 ${index + 1}`,
          image: imageFlowNodeImage(node),
        }));
      const baseX = assetNode.position.x + (assetNode.width || 180) + 120;
      const baseY = assetNode.position.y - 12;
      const uploadNodes = flowNodes.filter((node) => node.type !== "generated");
      const flowHeight = Math.max(150, uploadNodes.length * 178 - 28);
      flowNodes.forEach((flowNode, index) => {
        const isGenerated = flowNode.type === "generated";
        const data = flowNode.data || {};
        const uploadIndex = uploadNodes.findIndex((node) => node === flowNode);
        out.push({
          id: imageFlowNodeId(assetNodeId, flowNode.id || index),
          type: isGenerated ? "imageFlowGenerated" : "imageFlowUpload",
          label: isGenerated ? "图片生成" : `参考图 ${index + 1}`,
          position: {
            x: isGenerated ? baseX + 240 : baseX,
            y: isGenerated ? baseY + Math.max(0, Math.round((flowHeight - 260) / 2)) : baseY + uploadIndex * 178,
          },
          width: isGenerated ? 320 : 160,
          height: isGenerated ? 260 : 150,
          status: isGenerated ? "已生成" : "参考",
          sourceLabel: assetNode.label,
          data: {
            expandedFlowFromAsset: assetNodeId,
            flowId: Number(flowId),
            flowNodeId: flowNode.id || index,
            image: imageFlowNodeImage(flowNode),
            promptPreview: data.prompt || data.text || "",
            model: data.model || "",
            ratio: data.ratio || "",
            quality: data.quality || "",
            mentions: isGenerated ? mentions : [],
          },
        });
      });
    });
    return out;
  }

  function sourceReferenceKey(data) {
    const pid = projectId();
    const id = data?.id ?? data?.novelId;
    return pid && id ? `${pid}:${id}` : "";
  }

  function sourceReferenceNodes(nodes = baseGraphNodes()) {
    const pid = projectId();
    if (!pid) return [];
    return Object.entries(state.sourceReferences || {})
      .filter(([key, ref]) => key.startsWith(`${pid}:`) && ref?.url)
      .map(([key, ref]) => {
        const source = nodes.find((node) => node.id === ref.sourceNodeId)
          || nodes.find((node) => node.id === `novelSection:${ref.novelId}`)
          || nodes.find((node) => node.id === `novelChapter:${ref.novelId}`);
        if (!source) return null;
        return {
          id: `sourceReference:${key}`,
          type: "sourceReference",
          label: "风格参考图",
          position: {
            x: source.position.x + (source.width || 320) + 90,
            y: source.position.y,
          },
          width: 260,
          height: 300,
          status: "已生成",
          sourceLabel: source.label,
          data: {
            sourceReferenceFrom: source.id,
            novelId: ref.novelId,
            image: ref.url,
            prompt: ref.prompt || "",
            ratio: ref.ratio || "",
            quality: ref.quality || "",
            model: ref.model || "",
            createdAt: ref.createdAt || null,
          },
        };
      })
      .filter(Boolean);
  }

  function isVirtualNode(node) {
    return Boolean(node?.data?.expandedFromGroup || node?.data?.expandedFlowFromAsset || node?.data?.expandedImageFromAsset || node?.data?.sourceReferenceFrom);
  }

  function savedLayoutPosition(item) {
    if (item?.position && typeof item.position.x === "number" && typeof item.position.y === "number") return item.position;
    if (typeof item?.x === "number" && typeof item?.y === "number") return { x: item.x, y: item.y };
    return null;
  }

  function restoreVirtualNodePositions() {
    const saved = state.graph?.layout?.nodesLayout || {};
    state.nodePositionOverrides = Object.fromEntries(Object.entries(saved)
      .filter(([id]) => id.startsWith("expandedAsset:") || id.startsWith("expandedAssetImage:") || id.startsWith("imageFlow:") || id.startsWith("sourceReference:"))
      .map(([id, item]) => [id, savedLayoutPosition(item)])
      .filter((entry) => entry[1]));
  }

  function withPositionOverrides(nodes) {
    return nodes.map((node) => {
      const position = state.nodePositionOverrides[node.id];
      return position ? { ...node, position: { ...position } } : node;
    });
  }

  function graphNodes() {
    const nodes = baseGraphNodes();
    const expanded = expandedAssetNodes(nodes);
    const withAssets = expanded.length ? [...nodes, ...expanded] : nodes;
    const flowNodes = expandedImageFlowNodes(withAssets);
    const withFlows = flowNodes.length ? [...withAssets, ...flowNodes] : withAssets;
    const references = sourceReferenceNodes(withFlows);
    return withPositionOverrides(references.length ? [...withFlows, ...references] : withFlows);
  }

  function baseGraphEdges() {
    return state.graph?.edges || [];
  }

  function expandedAssetEdges(nodes = baseGraphNodes()) {
    return nodes
      .filter((node) => node.type === "assetGroup" && state.expandedAssetGroups[node.id])
      .flatMap((group) => (group.data?.items || []).flatMap((item) => {
        const assetNodeId = `expandedAsset:${group.id}:${item.id}`;
        return [
          { source: group.id, target: assetNodeId, type: "expands" },
          ...(item.images || []).map((image, imageIndex) => ({
            source: assetNodeId,
            target: `expandedAssetImage:${group.id}:${item.id}:${image.id || imageIndex}`,
            type: "renders",
          })),
        ];
      }));
  }

  function expandedImageFlowEdges(nodes) {
    return Object.entries(state.expandedImageFlows).flatMap(([assetNodeId, flowId]) => {
      const flow = state.imageFlowCache[flowId];
      const flowNodes = flow?.nodes || [];
      if (!nodes.some((node) => node.id === assetNodeId) || !flowNodes.length) return [];
      const generated = flowNodes.find((node) => node.type === "generated") || flowNodes[0];
      const edges = [{ source: assetNodeId, target: imageFlowNodeId(assetNodeId, generated.id || 0), type: "expands" }];
      (flow.edges || []).forEach((edge) => {
        edges.push({
          source: imageFlowNodeId(assetNodeId, edge.source),
          target: imageFlowNodeId(assetNodeId, edge.target),
          type: "renders",
        });
      });
      return edges;
    });
  }

  function sourceReferenceEdges(nodes) {
    return nodes
      .filter((node) => node.type === "sourceReference" && node.data?.sourceReferenceFrom)
      .map((node) => ({ source: node.data.sourceReferenceFrom, target: node.id, type: "references" }));
  }

  function graphEdges() {
    const edges = baseGraphEdges();
    const expanded = expandedAssetEdges();
    const nodes = graphNodes();
    const flowEdges = expandedImageFlowEdges(nodes);
    const referenceEdges = sourceReferenceEdges(nodes);
    return expanded.length || flowEdges.length || referenceEdges.length ? [...edges, ...expanded, ...flowEdges, ...referenceEdges] : edges;
  }

  function viewport() {
    if (!state.graph) return { x: 0, y: 0, zoom: 0.72 };
    state.graph.viewport = state.graph.viewport || { x: 0, y: 0, zoom: 0.72 };
    return state.graph.viewport;
  }

  function selectedNode() {
    return graphNodes().find((node) => node.id === state.selectedNodeId) || graphNodes()[0] || null;
  }

  function projectId() {
    return Number(state.selectedProjectId || state.graph?.project?.id || 0) || null;
  }

  function scriptId() {
    if (state.view === "script") return null;
    return Number(state.selectedScriptId || state.graph?.scriptId || 0) || null;
  }

  function usesScriptFilterForView(view = state.view) {
    return view !== "script";
  }

  function scriptOptions() {
    if (Array.isArray(state.graph?.scriptOptions) && state.graph.scriptOptions.length) return state.graph.scriptOptions;
    return graphNodes()
      .filter((node) => node.type === "script")
      .map((node) => ({ id: node.data?.script?.id, name: node.label }))
      .filter((item) => item.id != null);
  }

  function activeScriptLabel() {
    const id = scriptId();
    return scriptLabel(id);
  }

  function scriptLabel(id) {
    const option = scriptOptions().find((item) => Number(item.id) === Number(id));
    if (option?.name) return option.name;
    const node = graphNodes().find((item) => item.type === "script" && Number(item.data?.script?.id) === Number(id));
    return node?.label || (id ? `剧本 ${id}` : "当前项目");
  }

  function scriptNodeById(id) {
    return graphNodes().find((item) => item.type === "script" && Number(item.data?.script?.id) === Number(id)) || null;
  }

  function scriptIdFromNode(node) {
    const data = node?.data || {};
    const value = data.script?.id ?? data.scriptId ?? data.storyboard?.scriptId ?? data.videoTrack?.scriptId ?? data.video?.scriptId ?? scriptId();
    return value == null || value === "" ? null : Number(value);
  }

  function activeAssetIdsForScript(targetScriptId) {
    const nodeId = targetScriptId ? `script:${targetScriptId}` : null;
    if (!nodeId) return [];
    // 资产已聚合为组卡：脚本边指向 assetGroup:*，真实资产数取组卡 items 总和
    const groupTargets = graphEdges()
      .filter((edge) => edge.source === nodeId && String(edge.target || "").startsWith("assetGroup:"))
      .map((edge) => edge.target);
    if (groupTargets.length) {
      const ids = [];
      groupTargets.forEach((groupId) => {
        const group = graphNodes().find((node) => node.id === groupId);
        const items = group?.data?.items || [];
        items.forEach((item) => ids.push(`asset:${item.id}`));
      });
      return ids;
    }
    // 兼容旧图：直接指向 asset: 节点
    return graphEdges().filter((edge) => edge.source === nodeId && /^asset:/.test(String(edge.target || ""))).map((edge) => edge.target);
  }

  function currentScriptAssetItems() {
    const groups = graphNodes().filter((node) => node.type === "assetGroup");
    const seen = new Set();
    return groups.flatMap((group) => group.data?.items || []).filter((asset) => {
      const id = Number(asset?.id || 0);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  function assetHasActiveOrCompleteImage(asset) {
    return (asset?.images || []).some((image) =>
      image?.selected || image?.filePath || image?.thumbnail || /生成中|排队|running|pending/i.test(String(image?.state || "")),
    );
  }

  function assetImageTargets() {
    return currentScriptAssetItems().filter((asset) => !assetHasActiveOrCompleteImage(asset));
  }

  function latestCompletedAssetExtractionTask() {
    return currentAssetTasks().slice().reverse().find((task) => {
      if (isTaskRunning(task)) return false;
      return /已完成|complete|finished/i.test(String(task?.state || ""))
        || taskProgressFor(task.id).some((item) => item.phase === "finished" && item.status === "complete");
    }) || null;
  }

  function hasPromptedAssetImageNextStage(taskId) {
    return state.agentMessages.some((message) => {
      const text = agentDisplayText(message);
      return text.includes(`资产提取任务 #${taskId} 已完成`) && text.includes("自动生成全部资产图");
    });
  }

  function maybePromptAssetImageNextStage() {
    if (agentModeKey() !== "asset") return;
    const task = latestCompletedAssetExtractionTask();
    if (!task || hasPromptedAssetImageNextStage(task.id)) return;
    const targets = assetImageTargets();
    if (!targets.length) return;
    pushLocalAgentMessage(
      "assistant",
      [
        `资产提取任务 #${task.id} 已完成。`,
        `已关联 ${currentScriptAssetItems().length} 个资产，其中 ${targets.length} 个还没有候选图。`,
        "是否进入下一阶段「自动生成全部资产图」？回复「进入下一阶段」或「生成全部资产图」即可开始。",
      ].join("\n"),
      "warning",
      agentProfile().title,
    );
  }

  function isAssetExtracting(script) {
    const value = Number(script?.extractState);
    return value === 0 || value === 2;
  }

  function assetExtractMeta(script, assetCount) {
    const value = Number(script?.extractState);
    const reason = String(script?.errorReason || "");
    if (isAssetExtracting(script)) {
      return {
        key: "running",
        statusText: assetCount ? "复核中" : "提取中",
        detail: assetCount ? `已有 ${assetCount} 个资产，正在重新提取/复核` : value === 2 ? "资产提取任务已提交" : "正在从剧本提取资产",
      };
    }
    if (value === 1 && assetCount && /保留|复核|未返回/.test(reason)) {
      return {
        key: "warning",
        statusText: "需复核",
        detail: short(reason, 68),
        actionLabel: "重新提取",
        actionDisabled: false,
      };
    }
    if (value === -1) {
      if (assetCount) {
        return {
          key: "warning",
          statusText: "需复核",
          detail: short(`已有 ${assetCount} 个资产；最近提取失败：${script?.errorReason || "资产提取失败"}`, 68),
          actionLabel: "重新提取",
          actionDisabled: false,
        };
      }
      return {
        key: "error",
        statusText: "失败",
        detail: short(`提取失败：${script?.errorReason || "资产提取失败"}`, 52),
        actionLabel: assetCount ? "重新提取" : "重试提取",
        actionDisabled: false,
      };
    }
    return {
      actionLabel: assetCount ? "重新提取" : "提取资产",
      actionDisabled: false,
    };
  }

  function agentThreadKey() {
    const pid = projectId() || "project";
    const mode = agentModeKey();
    if (mode === "script") return `${pid}:scriptAgent:${scriptId() || "project"}`;
    return `${pid}:${mode}`;
  }

  function compactAgentMessages(messages) {
    try {
      return JSON.parse(JSON.stringify((messages || []).slice(-30)));
    } catch {
      return [];
    }
  }

  function currentAgentHistoryPayload() {
    if (!state.agentThreadKey || !projectId()) return null;
    const messages = compactAgentMessages(state.agentMessages);
    const draft = state.agentText || "";
    const lockedContext = state.lockedAgentContext || "";
    if (!messages.length && !draft && !lockedContext) return null;
    return {
      projectId: Number(projectId()),
      scriptId: scriptId() ? Number(scriptId()) : null,
      threadKey: state.agentThreadKey,
      agentMode: agentModeKey(),
      messages,
      draft,
      lockedContext,
    };
  }

  function scheduleSaveAgentThread(payload = currentAgentHistoryPayload()) {
    if (!payload) return;
    state.agentSavePayloads[payload.threadKey] = payload;
    clearTimeout(state.agentSaveTimer);
    state.agentSaveTimer = setTimeout(() => {
      flushAgentThreadSaves().catch((err) => console.warn("[CreativeCanvas] 保存 Agent 会话失败", err));
    }, 700);
  }

  async function flushAgentThreadSaves() {
    const payloads = Object.values(state.agentSavePayloads);
    state.agentSavePayloads = {};
    clearTimeout(state.agentSaveTimer);
    state.agentSaveTimer = null;
    await Promise.all(
      payloads.map((payload) =>
        api("/creativeCanvas/chatHistory/save", { method: "POST", body: payload }).catch((err) => {
          console.warn("[CreativeCanvas] 保存 Agent 会话失败", err);
        }),
      ),
    );
  }

  function persistAgentThread() {
    if (!state.agentThreadKey) return;
    state.agentThreads[state.agentThreadKey] = state.agentMessages;
    state.agentDrafts[state.agentThreadKey] = state.agentText;
    state.agentLocks[state.agentThreadKey] = state.lockedAgentContext;
    scheduleSaveAgentThread();
  }

  async function loadAgentThreadFromServer(key, force = false) {
    if (state.agentLoadedThreads[key] && !force) return;
    const data = await api("/creativeCanvas/chatHistory/load", { method: "POST", body: { threadKey: key } });
    state.agentLoadedThreads[key] = true;
    if (state.agentThreadKey !== key) return;
    if (Array.isArray(data?.messages) && data.messages.length) {
      data.messages.forEach((message) => {
        const existing = state.agentMessages.find((item) => item.id === message.id);
        if (existing) Object.assign(existing, message, { content: message.content || existing.content || [] });
        else state.agentMessages.push({ ...message, content: message.content || [] });
      });
      state.agentThreads[key] = state.agentMessages;
    }
    if (!state.agentText && data?.draft) {
      state.agentText = data.draft;
      state.agentDrafts[key] = state.agentText;
    }
    if (!state.lockedAgentContext && data?.lockedContext) {
      state.lockedAgentContext = data.lockedContext;
      state.agentLocks[key] = state.lockedAgentContext;
    }
    renderAgentOnly();
  }

  function restoreAgentThread() {
    const key = agentThreadKey();
    if (state.agentThreadKey === key) return;
    state.agentThreadKey = key;
    state.agentMessages = state.agentThreads[key] || [];
    state.agentThreads[key] = state.agentMessages;
    state.agentText = state.agentDrafts[key] || "";
    state.lockedAgentContext = state.agentLocks[key] || "";
    state.agentRunning = false;
    loadAgentThreadFromServer(key).catch((err) => {
      state.agentError = err?.message || String(err);
      renderAgentOnly();
    });
  }

  function nodeCategory(node) {
    if (!node) return "overview";
    if (node.data?.expandedFlowFromAsset || node.data?.expandedImageFromAsset || node.type === "imageFlowUpload" || node.type === "imageFlowGenerated" || node.type === "assetImage") return "asset";
    if (node.type === "novelChapter" || node.type === "novelSection" || node.type === "sourceReference") return "source";
    if (node.type === "storySkeleton" || node.type === "adaptationStrategy" || node.type === "script") return "script";
    if (node.type === "asset" || node.type === "assetGroup") return "asset";
    if (node.type === "scriptPlan" || node.type === "storyboardTable" || node.type === "storyboard" || node.type === "storyboardAnalysis") return "storyboard";
    if (node.type === "videoPrompt" || node.type === "video" || node.type === "videoPromptGroup" || node.type === "videoGroup") return "video";
    if (node.type === "auditArtifact" || node.type === "auditSegment") return "audit";
    return "overview";
  }

  // 概览视图：聚合卡（assetGroup / videoPromptGroup / videoGroup）代表整组；
  // 个体卡（asset / videoPrompt / video）只在各自分类视图里展开。
  const OVERVIEW_HIDDEN_TYPES = new Set(["assetExtractionTask", "task", "asset", "assetImage", "videoPrompt", "video", "storyboard", "auditArtifact", "auditSegment"]);
  const GROUP_TYPES = new Set(["assetGroup", "videoPromptGroup", "videoGroup"]);

  function agentProfile() {
    return AGENT_PROFILES[agentModeKey()] || AGENT_PROFILES.overview;
  }

  function agentModeKey() {
    return AGENT_PROFILES[state.view] ? state.view : "overview";
  }

  function connectScriptAgentForCurrentContext() {
    if (state.view !== "script") return;
    ensureScriptAgentSocket().catch((err) => {
      state.agentError = err && err.message ? err.message : String(err);
      renderAgentOnly();
    });
  }

  async function switchView(viewKey) {
    persistAgentThread();
    state.view = viewKey;
    await loadGraph();
    connectScriptAgentForCurrentContext();
  }

  function visibleNodeIds() {
    if (state.view === "overview") return new Set(graphNodes().filter((node) => !node.data?.expandedFromGroup && !node.data?.expandedFlowFromAsset && !node.data?.expandedImageFromAsset && !OVERVIEW_HIDDEN_TYPES.has(node.type)).map((node) => node.id));
    const keep = new Set();
    graphNodes().forEach((node) => {
      if (node.type === "assetExtractionTask") return;
      if (node.data?.expandedFlowFromAsset && state.view === "asset") keep.add(node.id);
      // 概览聚合卡在分类视图里隐藏，改为展开个体卡
      if (GROUP_TYPES.has(node.type)) {
        // 资产视图保留资产组卡（资产没有个体视图）
        if (!(state.view === "asset" && node.type === "assetGroup")) return;
      }
      if (node.type === "project") keep.add(node.id);
      if (node.type === "task") {
        if (state.view === "asset") return;
        const category = taskNodeCategory(node);
        if (category === state.view || (state.view === "storyboard" && category === "video")) keep.add(node.id);
        return;
      }
      if (state.view === "script" && (node.type === "novelChapter" || node.type === "novelSection")) keep.add(node.id);
      if (nodeCategory(node) === state.view) keep.add(node.id);
      if (state.view === "storyboard" && node.type === "assetGroup") keep.add(node.id);
      if (state.view === "video" && node.type === "storyboard") keep.add(node.id);
    });
    return keep;
  }

  function markMessage(message) {
    state.message = message || "";
    render();
  }

  function agentBodyScrollSnapshot() {
    const body = document.querySelector(".tfcc-chat-body");
    if (!body) return null;
    return {
      top: body.scrollTop,
      bottomGap: Math.max(0, body.scrollHeight - body.clientHeight - body.scrollTop),
    };
  }

  function restoreAgentOutputScroll(snapshot, stickToOutput = false) {
    const run = () => {
      const body = document.querySelector(".tfcc-chat-body");
      if (!body) return;
      body.scrollTop = stickToOutput || !snapshot
        ? body.scrollHeight
        : Math.max(0, body.scrollHeight - body.clientHeight - snapshot.bottomGap);
    };
    if (window.requestAnimationFrame) window.requestAnimationFrame(run);
    else setTimeout(run, 0);
  }

  function renderAgentOnly(stickToOutput = false) {
    const snapshot = agentBodyScrollSnapshot();
    const panel = document.querySelector(".tfcc-agent");
    if (!panel) return;
    const shouldStick = stickToOutput || state.agentStickToOutput;
    panel.replaceWith(renderAgentPanel());
    restoreAgentOutputScroll(snapshot, shouldStick);
    state.agentStickToOutput = false;
  }

  function setAgentPanelWidth(width) {
    const next = Math.max(AGENT_WIDTH_MIN, Math.min(AGENT_WIDTH_MAX, Math.round(width)));
    state.agentPanelWidth = next;
    document.querySelector(".tfcc-layout")?.style.setProperty("--tfcc-agent-width", `${next}px`);
    try { localStorage.setItem(AGENT_WIDTH_KEY, String(next)); } catch {}
  }

  function startAgentResize(event) {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = state.agentPanelWidth || 330;
    const move = (moveEvent) => setAgentPanelWidth(startWidth + moveEvent.clientX - startX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.classList.remove("tfcc-resizing-agent");
    };
    document.body.classList.add("tfcc-resizing-agent");
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function withLoading(task) {
    state.loading = true;
    state.message = "";
    render();
    try {
      await task();
    } catch (err) {
      state.message = err && err.message ? err.message : String(err);
    } finally {
      state.loading = false;
      render();
    }
  }

  async function loadProjects() {
    state.projects = await api("/project/getProject", { method: "POST", body: {} }).catch(() => []);
  }

  async function loadImageModelOptions() {
    const vendors = await api("/setting/vendorConfig/getVendorList", { method: "POST", body: {} }).catch(() => []);
    state.imageModelOptions = (Array.isArray(vendors) ? vendors : []).flatMap((vendor) => {
      if (!vendor || vendor.enable === 0 || vendor.enable === false) return [];
      const vendorId = vendor.id || "";
      const vendorName = vendor.name || vendorId;
      return (vendor.models || [])
        .filter((model) => model?.type === "image" && (model.modelName || model.model))
        .map((model) => {
          const modelName = model.modelName || model.model;
          return {
            value: `${vendorId}:${modelName}`,
            label: `${vendorName} / ${model.name || modelName}`,
          };
        });
    });
  }

  async function loadGraph() {
    persistAgentThread();
    const body = {
      projectId: state.selectedProjectId ? Number(state.selectedProjectId) : undefined,
      viewKey: state.view || "overview",
    };
    if (usesScriptFilterForView() && state.selectedScriptId) body.scriptId = Number(state.selectedScriptId);
    state.graph = await api("/creativeCanvas/getGraph", { method: "POST", body });
    restoreVirtualNodePositions();
    if (state.graph?.project?.id) state.selectedProjectId = Number(state.graph.project.id);
    if (usesScriptFilterForView() && state.graph?.scriptId) state.selectedScriptId = Number(state.graph.scriptId);
    if (!state.selectedNodeId || !graphNodes().some((node) => node.id === state.selectedNodeId)) {
      state.selectedNodeId = graphNodes()[0]?.id || null;
    }
    if (state.view !== "overview") {
      const current = selectedNode();
      if (!current || nodeCategory(current) !== state.view) {
        const next = graphNodes().find((node) => nodeCategory(node) === state.view);
        if (next) state.selectedNodeId = next.id;
        else {
          const visible = visibleNodeIds();
          const fallback = graphNodes().find((node) => visible.has(node.id));
          state.selectedNodeId = fallback?.id || null;
        }
      }
    }
    const node = selectedNode();
    state.editText = node?.data?.segment?.text || "";
    restoreAgentThread();
    if (state.view === "asset") {
      ensureReadableAssetLayout();
      maybePromptAssetImageNextStage();
    }
    scheduleAssetExtractionPoll();
    scheduleAssetImagePoll();
    scheduleSourceEventPoll();
  }

  function currentScriptAssetMeta(targetScriptId = scriptId()) {
    const script = scriptNodeById(targetScriptId)?.data?.script || null;
    const assetIds = activeAssetIdsForScript(targetScriptId);
    return {
      script,
      assetCount: assetIds.length,
      meta: assetExtractMeta(script, assetIds.length),
    };
  }

  function taskRelatedData(task) {
    return parseMaybeJson(task?.relatedObjects || task?.payload, {});
  }

  function taskScriptId(task) {
    return taskScriptIds(task)[0] ?? null;
  }

  function taskScriptIds(task) {
    const related = taskRelatedData(task);
    const values = [
      related.scriptId,
      related.data?.scriptId,
      related.payload?.scriptId,
      task?.scriptId,
      ...(Array.isArray(related.scriptIds) ? related.scriptIds : []),
      ...(Array.isArray(related.data?.scriptIds) ? related.data.scriptIds : []),
      ...(Array.isArray(related.payload?.scriptIds) ? related.payload.scriptIds : []),
    ];
    return [...new Set(values.map((value) => (value == null || value === "" ? null : Number(value))).filter((value) => Number.isFinite(value)))];
  }

  function isAssetExtractionTask(task) {
    const related = taskRelatedData(task);
    return /资产提取|extractAssets/i.test(String(task?.taskClass || "")) || related.source === "script.extractAssets";
  }

  function taskNodeCategory(node) {
    const task = node.data?.task || {};
    const related = taskRelatedData(task);
    const text = `${task.taskClass || ""} ${task.describe || ""} ${related.type || ""}`;
    if (related.videoId || related.trackId || /视频|video/i.test(text)) return "video";
    if (related.storyboardId || /分镜|storyboard/i.test(text)) return "storyboard";
    if (/角色|场景|道具|资产|图片|image|asset/i.test(text)) return "asset";
    return "overview";
  }

  function currentAssetTask() {
    return currentAssetTasks().slice(-1)[0] || null;
  }

  function currentAssetTasks() {
    const sid = Number(scriptId());
    return (state.graph?.tasks || [])
      .filter((task) => isAssetExtractionTask(task) && taskScriptIds(task).includes(sid))
      .sort((a, b) => Number(a.startTime || a.id || 0) - Number(b.startTime || b.id || 0));
  }

  function taskProgressFor(taskId) {
    return (state.graph?.taskProgress || []).filter((item) => Number(item.taskId) === Number(taskId));
  }

  function isTaskRunning(task) {
    return /进行中|排队|running|pending/i.test(String(task?.state || ""));
  }

  function scheduleAssetExtractionPoll() {
    clearTimeout(state.assetPollTimer);
    state.assetPollTimer = null;
    if (!state.active) return;
    const { script } = currentScriptAssetMeta();
    const task = currentAssetTask();
    if (!isAssetExtracting(script) && !isTaskRunning(task)) return;
    state.assetPollTimer = setTimeout(async () => {
      try {
        await loadGraph();
        render();
      } catch (err) {
        state.message = err && err.message ? err.message : String(err);
        render();
      }
    }, 5000);
  }

  function hasAssetImageWorkInProgress() {
    const runningImage = currentScriptAssetItems().some((asset) =>
      (asset.images || []).some((image) => /生成中|排队|执行中|running|pending/i.test(String(image?.state || ""))),
    );
    const runningQueue = (state.graph?.queues || []).some((queue) =>
      queue.kind === "assetImage" && /排队中|执行中|running|pending/i.test(String(queue.state || "")),
    );
    return runningImage || runningQueue;
  }

  function scheduleAssetImagePoll() {
    clearTimeout(state.assetImagePollTimer);
    state.assetImagePollTimer = null;
    if (!state.active || state.view !== "asset" || !hasAssetImageWorkInProgress()) return;
    state.assetImagePollTimer = setTimeout(async () => {
      try {
        await loadGraph();
        render();
      } catch (err) {
        state.message = err?.message || String(err);
        render();
      }
    }, 5000);
  }

  function sourcePendingNovelIds() {
    return graphNodes()
      .filter((node) => node.type === "novelChapter" && Number(sourceDisplayData(node).eventState) === 0)
      .map((node) => Number(node.data?.id || node.data?.novelId || 0))
      .filter((id) => Number.isFinite(id) && id > 0);
  }

  function scheduleSourceEventPoll() {
    clearTimeout(state.sourceEventPollTimer);
    state.sourceEventPollTimer = null;
    if (!state.active || !sourcePendingNovelIds().length) return;
    state.sourceEventPollTimer = setTimeout(async () => {
      try {
        const pid = projectId();
        if (pid) delete state.novelFullCache[pid];
        await loadGraph();
        await loadNovelFull({ force: true });
        render();
      } catch (err) {
        state.message = err?.message || String(err);
        render();
      }
    }, 3000);
  }

  async function openCanvas(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    state.active = true;
    syncCanvasHostInset();
    document.body.classList.add("tfcc-lock");
    await withLoading(async () => {
      await loadProjects();
      await loadImageModelOptions();
      await loadGraph();
    });
  }

  function closeCanvas() {
    persistAgentThread();
    flushAgentThreadSaves().catch((err) => console.warn("[CreativeCanvas] 保存 Agent 会话失败", err));
    state.active = false;
    document.body.classList.remove("tfcc-lock");
    document.documentElement.style.removeProperty("--tfcc-host-top");
    clearTimeout(state.canvasResizeTimer);
    state.canvasResizeTimer = null;
    clearTimeout(state.assetPollTimer);
    state.assetPollTimer = null;
    clearTimeout(state.assetImagePollTimer);
    state.assetImagePollTimer = null;
    render();
  }

  function installEntry() {
    if (document.querySelector(".tfcc-entry")) {
      refreshEntryVisibility();
      return;
    }
    const button = h("button", { class: "tfcc-entry", title: "Creative Canvas", onClick: openCanvas }, [
      h("span", { class: "tfcc-entry-icon", text: "✦" }),
      h("span", { text: "Creative Canvas" }),
    ]);
    document.body.appendChild(button);
    refreshEntryVisibility();
  }

  function refreshEntryVisibility() {
    const button = document.querySelector(".tfcc-entry");
    if (!button) return;
    const hash = location.hash || "";
    const hidden = /setting|login/i.test(hash);
    button.classList.toggle("is-hidden", hidden);
  }

  function saveLayoutDebounced() {
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveLayout, 450);
  }

  async function saveLayout() {
    if (!state.graph || !projectId()) return;
    const nodesLayout = graphNodes().map((node) => ({
      id: node.id,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      width: node.width,
      height: node.height,
    }));
    await api("/creativeCanvas/saveLayout", {
      method: "POST",
      body: {
        projectId: projectId(),
        scriptId: scriptId(),
        viewKey: state.view || "overview",
        nodesLayout,
        viewport: viewport(),
      },
    });
  }

  function applyWorldTransform(root) {
    const world = root || document.querySelector(".tfcc-world");
    if (!world) return;
    const vp = viewport();
    world.style.transform = `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`;
  }

  function beginPan(event) {
    if (event.button !== 0 || event.target.closest(".tfcc-node")) return;
    state.panning = { x: event.clientX, y: event.clientY, vx: viewport().x, vy: viewport().y };
    document.addEventListener("mousemove", onPanMove);
    document.addEventListener("mouseup", endPan);
  }

  function onPanMove(event) {
    if (!state.panning) return;
    const vp = viewport();
    vp.x = state.panning.vx + event.clientX - state.panning.x;
    vp.y = state.panning.vy + event.clientY - state.panning.y;
    applyWorldTransform();
  }

  function endPan() {
    if (state.panning) saveLayoutDebounced();
    state.panning = null;
    document.removeEventListener("mousemove", onPanMove);
    document.removeEventListener("mouseup", endPan);
  }

  function onWheel(event) {
    if (!state.graph) return;
    event.preventDefault();
    const vp = viewport();
    const before = vp.zoom;
    const next = Math.min(1.6, Math.max(0.28, before + (event.deltaY > 0 ? -0.06 : 0.06)));
    const rect = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const wx = (mx - vp.x) / before;
    const wy = (my - vp.y) / before;
    vp.zoom = Number(next.toFixed(2));
    vp.x = mx - wx * vp.zoom;
    vp.y = my - wy * vp.zoom;
    applyWorldTransform();
    updateZoomLabel();
    saveLayoutDebounced();
  }

  function zoomBy(delta) {
    const vp = viewport();
    vp.zoom = Math.min(1.6, Math.max(0.28, Number((vp.zoom + delta).toFixed(2))));
    applyWorldTransform();
    updateZoomLabel();
    saveLayoutDebounced();
  }

  function updateZoomLabel() {
    const label = document.querySelector(".tfcc-zoom-value");
    if (label) label.textContent = `${Math.round(viewport().zoom * 100)}%`;
  }

  function hostTitleBarInset() {
    const titleBar = document.querySelector(".titleBar");
    if (!titleBar) return 0;
    const style = window.getComputedStyle(titleBar);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    const rect = titleBar.getBoundingClientRect();
    return Math.max(0, Math.round(rect.height || rect.bottom || 0));
  }

  function syncCanvasHostInset() {
    document.documentElement.style.setProperty("--tfcc-host-top", `${hostTitleBarInset()}px`);
  }

  function scheduleCanvasResizeFit() {
    if (!state.active) return;
    syncCanvasHostInset();
    clearTimeout(state.canvasResizeTimer);
    state.canvasResizeTimer = setTimeout(() => {
      state.canvasResizeTimer = null;
      if (!state.active || !document.querySelector(".tfcc-canvas")) return;
      fitView({ persist: false });
    }, 120);
  }

  function fitView(options = {}) {
    const visible = new Set(visibleNodeIds());
    const nodes = graphNodes().filter((node) => visible.has(node.id));
    if (!nodes.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((node) => {
      const x = Number(node.position?.x || 0);
      const y = Number(node.position?.y || 0);
      const w = node.width || 260;
      const hh = node.height || 140;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + hh);
    });
    const canvas = document.querySelector(".tfcc-canvas");
    if (!canvas) return;
    const cw = canvas.clientWidth || 800;
    const ch = canvas.clientHeight || 600;
    const pad = 80;
    const contentW = maxX - minX || 1;
    const contentH = maxY - minY || 1;
    const zoom = Math.min(1.6, Math.max(0.28, Math.min((cw - pad * 2) / contentW, (ch - pad * 2) / contentH)));
    const vp = viewport();
    vp.zoom = Number(zoom.toFixed(2));
    // center content
    vp.x = (cw - contentW * vp.zoom) / 2 - minX * vp.zoom;
    vp.y = (ch - contentH * vp.zoom) / 2 - minY * vp.zoom;
    applyWorldTransform();
    updateZoomLabel();
    if (options.persist !== false) saveLayoutDebounced();
  }

  function layoutNodeHeight(node) {
    return Number(node?.height || 150);
  }

  function scriptEpisodeOrderValue(node) {
    const text = `${node?.data?.script?.name || ""} ${node?.label || ""}`;
    const match = text.match(/\bEP\s*0*(\d+)\b/i) || text.match(/第\s*0*(\d+)\s*集/);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  }

  function layoutOrderValue(node) {
    const data = node?.data || {};
    if (node?.type === "script") {
      const episodeOrder = scriptEpisodeOrderValue(node);
      if (episodeOrder != null) return episodeOrder;
    }
    const raw =
      data.storyboard?.index ??
      data.script?.id ??
      data.videoTrack?.id ??
      data.video?.id ??
      data.task?.id ??
      String(node?.id || "").match(/(\d+)/)?.[1];
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  }

  function orderedLayoutNodes(nodes) {
    return [...nodes].sort((a, b) => layoutOrderValue(a) - layoutOrderValue(b) || String(a.id).localeCompare(String(b.id)));
  }

  function stackHeight(nodes, gap = 28) {
    if (!nodes.length) return 0;
    return nodes.reduce((sum, node, index) => sum + layoutNodeHeight(node) + (index ? gap : 0), 0);
  }

  function stackY(rowY, rowHeight, contentHeight) {
    return Math.round(rowY + Math.max(0, (rowHeight - contentHeight) / 2));
  }

  function stackAt(nodes, x, y, gap = 28) {
    let cursor = y;
    orderedLayoutNodes(nodes).forEach((node) => {
      node.position = { x, y: cursor };
      cursor += layoutNodeHeight(node) + gap;
    });
    return cursor;
  }

  function placeStack(nodes, x, y, gap = 36) {
    return stackAt(nodes, x, y, gap);
  }

  function placeWrappedStack(nodes, x, y, gapY = 28, rows = 8, gapX = 340) {
    const cursors = [];
    orderedLayoutNodes(nodes).forEach((node, index) => {
      const column = Math.floor(index / rows);
      const cursor = cursors[column] ?? y;
      node.position = {
        x: x + column * gapX,
        y: cursor,
      };
      cursors[column] = cursor + layoutNodeHeight(node) + gapY;
    });
  }

  function uniqueLayoutNodes(nodes) {
    const seen = new Set();
    return nodes.filter((node) => {
      if (!node || seen.has(node.id)) return false;
      seen.add(node.id);
      return true;
    });
  }

  function edgeTargets(sourceId, type, nodeMap) {
    return orderedLayoutNodes(uniqueLayoutNodes(graphEdges()
      .filter((edge) => edge.source === sourceId)
      .map((edge) => nodeMap.get(edge.target))
      .filter((node) => node && (!type || node.type === type))));
  }

  function layoutStoryboardRows(storyboards, tasks, nodeMap, options) {
    const usedTasks = new Set();
    let cursor = options.y;
    orderedLayoutNodes(storyboards).forEach((storyboard) => {
      const rowTasks = edgeTargets(storyboard.id, "task", nodeMap);
      rowTasks.forEach((task) => usedTasks.add(task.id));
      const tasksHeight = stackHeight(rowTasks, 24);
      const rowHeight = Math.max(layoutNodeHeight(storyboard), tasksHeight, 210);
      storyboard.position = { x: options.storyboardX, y: cursor };
      stackAt(rowTasks, options.taskX, stackY(cursor, rowHeight, tasksHeight), 24);
      cursor += rowHeight + (options.gap || 52);
    });
    const leftovers = tasks.filter((task) => !usedTasks.has(task.id));
    placeWrappedStack(leftovers, options.taskX, cursor, 28, 8, 340);
  }

  function layoutVideoRows(storyboards, videoPrompts, videos, tasks, nodeMap, options) {
    const usedPrompts = new Set();
    const usedVideos = new Set();
    const usedTasks = new Set();
    let cursor = options.y;

    orderedLayoutNodes(storyboards).forEach((storyboard) => {
      const prompt = edgeTargets(storyboard.id, "videoPrompt", nodeMap)[0];
      const rowVideos = prompt ? edgeTargets(prompt.id, "video", nodeMap) : [];
      const rowTasks = uniqueLayoutNodes([
        ...edgeTargets(storyboard.id, "task", nodeMap),
        ...(prompt ? edgeTargets(prompt.id, "task", nodeMap) : []),
        ...rowVideos.flatMap((video) => edgeTargets(video.id, "task", nodeMap)),
      ]);
      if (prompt) usedPrompts.add(prompt.id);
      rowVideos.forEach((video) => usedVideos.add(video.id));
      rowTasks.forEach((task) => usedTasks.add(task.id));

      const videoHeight = stackHeight(rowVideos, 24);
      const taskHeight = stackHeight(rowTasks, 24);
      const rowHeight = Math.max(layoutNodeHeight(storyboard), prompt ? layoutNodeHeight(prompt) : 0, videoHeight, taskHeight, 210);
      storyboard.position = { x: options.storyboardX, y: cursor };
      if (prompt) prompt.position = { x: options.promptX, y: stackY(cursor, rowHeight, layoutNodeHeight(prompt)) };
      stackAt(rowVideos, options.videoX, stackY(cursor, rowHeight, videoHeight), 24);
      stackAt(rowTasks, options.taskX, stackY(cursor, rowHeight, taskHeight), 24);
      cursor += rowHeight + (options.gap || 54);
    });

    const orphanPrompts = videoPrompts.filter((prompt) => !usedPrompts.has(prompt.id));
    orderedLayoutNodes(orphanPrompts).forEach((prompt) => {
      const rowVideos = edgeTargets(prompt.id, "video", nodeMap).filter((video) => !usedVideos.has(video.id));
      rowVideos.forEach((video) => usedVideos.add(video.id));
      const videoHeight = stackHeight(rowVideos, 24);
      const rowHeight = Math.max(layoutNodeHeight(prompt), videoHeight, 190);
      prompt.position = { x: options.promptX, y: cursor };
      stackAt(rowVideos, options.videoX, stackY(cursor, rowHeight, videoHeight), 24);
      cursor += rowHeight + (options.gap || 54);
    });

    placeWrappedStack(videos.filter((video) => !usedVideos.has(video.id)), options.videoX, cursor, 28, 8, 340);
    placeWrappedStack(tasks.filter((task) => !usedTasks.has(task.id)), options.taskX, cursor, 28, 8, 340);
  }

  function optimizeLayout() {
    if (!state.graph) return;
    const visible = visibleNodeIds();
    const nodes = baseGraphNodes().filter((node) => visible.has(node.id));
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));
    const byType = (type) => nodes.filter((node) => node.type === type);
    const project = byType("project");
    const novelChapters = nodes.filter((node) => node.type === "novelChapter");
    const novelSections = nodes.filter((node) => node.type === "novelSection");
    const novelGroups = novelChapters;
    const eventGroups = novelSections;
    const storySkeletons = byType("storySkeleton");
    const adaptationStrategies = byType("adaptationStrategy");
    const productionScriptPlans = byType("scriptPlan");
    const storyboardTables = byType("storyboardTable");
    const scripts = byType("script");
    const assetGroups = byType("assetGroup");
    const storyboardAnalysis = byType("storyboardAnalysis");
    const storyboards = byType("storyboard");
    const videoPrompts = byType("videoPrompt");
    const videoPromptGroups = byType("videoPromptGroup");
    const videoGroups = byType("videoGroup");
    const videos = byType("video");
    const tasks = byType("task");
    const auditArtifacts = byType("auditArtifact");
    const auditSegments = byType("auditSegment");

    if (state.view === "source") {
      placeStack(project, -80, -140);
      placeStack(novelGroups, 300, -140);
      placeStack(eventGroups, 700, -140);
    } else if (state.view === "script") {
      placeStack(project, -80, -140);
      const sourceShift = (novelGroups.length ? 400 : 0) + (eventGroups.length ? 400 : 0);
      const planShift = (storySkeletons.length ? 400 : 0) + (adaptationStrategies.length ? 400 : 0);
      placeStack(novelGroups, 300, -140);
      placeStack(eventGroups, novelGroups.length ? 700 : 300, -140);
      placeStack(storySkeletons, 300 + sourceShift, -140);
      placeStack(adaptationStrategies, 300 + sourceShift + (storySkeletons.length ? 400 : 0), -140);
      placeStack(scripts, 300 + sourceShift + planShift, -140);
      placeWrappedStack(tasks, 760 + sourceShift + planShift, -140);
    } else if (state.view === "asset") {
      placeStack(project, -80, -160);
      placeStack(assetGroups, 340, -220, 54);
      placeWrappedStack(tasks, 1120, -220);
    } else if (state.view === "storyboard") {
      placeStack(project, -80, -160);
      placeStack(scripts, 320, -220, 42);
      placeStack(productionScriptPlans, 740, -240, 58);
      placeStack(storyboardTables, 1180, -240, 58);
      placeStack(assetGroups, 320, 160, 54);
      placeStack(storyboardAnalysis, 1640, -240, 70);
      layoutStoryboardRows(storyboards, tasks, nodeMap, { storyboardX: 2640, taskX: 3000, y: -260 });
    } else if (state.view === "video") {
      placeStack(project, -80, -160);
      layoutVideoRows(storyboards, videoPrompts, videos, tasks, nodeMap, {
        storyboardX: 320,
        promptX: 760,
        videoX: 1180,
        taskX: 1540,
        y: -260,
      });
    } else if (state.view === "audit") {
      placeStack(project, -80, -160);
      placeStack(auditArtifacts, 300, -240, 40);
      placeStack(auditSegments, 720, -240, 32);
      placeWrappedStack(tasks, 1160, -240);
    } else {
      const sourceColumns = (novelGroups.length ? 1 : 0) + (eventGroups.length ? 1 : 0);
      const shift = sourceColumns * 400;
      const planShift = (storySkeletons.length ? 400 : 0) + (adaptationStrategies.length ? 400 : 0);
      const productionShift = (productionScriptPlans.length ? 420 : 0) + (storyboardTables.length ? 460 : 0);
      placeStack(project, -80, -120);
      placeStack(novelGroups, 300, -120);
      placeStack(eventGroups, novelGroups.length ? 700 : 300, -120);
      placeStack(storySkeletons, 300 + shift, -120);
      placeStack(adaptationStrategies, 300 + shift + (storySkeletons.length ? 400 : 0), -120);
      placeStack(scripts, 300 + shift + planShift, -120);
      placeStack(productionScriptPlans, 680 + shift + planShift, -120, 58);
      placeStack(storyboardTables, 680 + shift + planShift + (productionScriptPlans.length ? 420 : 0), -120, 58);
      placeStack(assetGroups, 680 + shift + planShift + productionShift, -260, 54);
      placeStack(storyboardAnalysis, 1040 + shift + planShift + productionShift, -260, 70);
      placeStack(videoPromptGroups, 2040 + shift + planShift + productionShift, -260, 54);
      placeStack(videoGroups, 2440 + shift + planShift + productionShift, -260, 54);
    }
    render();
    fitView();
  }

  function ensureReadableAssetLayout() {
    if (!state.graph) return;
    const assets = graphNodes().filter((node) => node.type === "asset");
    if (assets.length < 2) return;
    const typeSet = new Set(assets.map((node) => node.data?.asset?.type || "other"));
    const xs = assets.map((node) => Number(node.position?.x || 0));
    const spanX = Math.max(...xs) - Math.min(...xs);
    const cramped = assets.some((node) => Number(node.width || 0) < 250) || (assets.length >= 8 && typeSet.size > 1 && spanX < 620);
    const tooZoomedOut = viewport().zoom < 0.5;
    if (!cramped && !tooZoomedOut) return;

    const typeOrder = ["role", "scene", "tool", "props", "clip", "other"];
    const labels = { role: "role", scene: "scene", tool: "tool", props: "tool", clip: "clip" };
    const groups = new Map();
    assets.forEach((node) => {
      const rawType = node.data?.asset?.type || "other";
      const type = labels[rawType] || rawType || "other";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(node);
    });
    const orderedTypes = typeOrder.filter((type) => groups.has(type)).concat([...groups.keys()].filter((type) => !typeOrder.includes(type)));
    orderedTypes.forEach((type, groupIndex) => {
      const items = groups.get(type).sort((a, b) => String(a.label || "").localeCompare(String(b.label || ""), "zh-Hans-CN"));
      items.forEach((node, index) => {
        node.width = 280;
        node.height = 170;
        node.position = {
          x: 360 + groupIndex * 340,
          y: -260 + index * 190,
        };
      });
    });
    const vp = viewport();
    if (vp.zoom < 0.58) vp.zoom = 0.58;
    vp.x = Math.max(48, vp.x);
    vp.y = Math.max(220, vp.y);
    saveLayoutDebounced();
  }

  function beginNodeDrag(event, node) {
    if (event.button !== 0) return;
    event.stopPropagation();
    state.skipNodeClickId = "";
    state.draggingNode = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      x: node.position.x,
      y: node.position.y,
      virtual: isVirtualNode(node),
      moved: false,
    };
    selectNode(node.id);
    document.addEventListener("mousemove", onNodeDrag);
    document.addEventListener("mouseup", endNodeDrag);
  }

  function onNodeDrag(event) {
    const drag = state.draggingNode;
    if (!drag) return;
    const node = graphNodes().find((item) => item.id === drag.id);
    if (!node) return;
    const vp = viewport();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.moved = drag.moved || Math.abs(dx) + Math.abs(dy) > 3;
    const nextPosition = {
      x: drag.x + dx / vp.zoom,
      y: drag.y + dy / vp.zoom,
    };
    if (drag.virtual) state.nodePositionOverrides[node.id] = nextPosition;
    node.position.x = nextPosition.x;
    node.position.y = nextPosition.y;
    const el = document.querySelector(`[data-tfcc-node="${CSS.escape(node.id)}"]`);
    if (el) {
      el.style.left = `${node.position.x}px`;
      el.style.top = `${node.position.y}px`;
    }
    renderEdges();
  }

  function endNodeDrag() {
    if (state.draggingNode?.moved) {
      const id = state.draggingNode.id;
      state.skipNodeClickId = id;
      const clearSkip = () => {
        if (state.skipNodeClickId === id) state.skipNodeClickId = "";
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(clearSkip);
      else setTimeout(clearSkip, 0);
    }
    if (state.draggingNode && !state.draggingNode.virtual) saveLayoutDebounced();
    state.draggingNode = null;
    document.removeEventListener("mousemove", onNodeDrag);
    document.removeEventListener("mouseup", endNodeDrag);
  }

  function beginNodeResize(event, node) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    state.skipNodeClickId = "";
    state.resizingNode = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      width: node.width || 260,
      height: node.height || 120,
      virtual: isVirtualNode(node),
      moved: false,
    };
    selectNode(node.id);
    document.addEventListener("mousemove", onNodeResize);
    document.addEventListener("mouseup", endNodeResize);
  }

  function onNodeResize(event) {
    const resize = state.resizingNode;
    if (!resize) return;
    const node = graphNodes().find((item) => item.id === resize.id);
    if (!node) return;
    const vp = viewport();
    const dx = (event.clientX - resize.startX) / vp.zoom;
    const dy = (event.clientY - resize.startY) / vp.zoom;
    resize.moved = resize.moved || Math.abs(dx) + Math.abs(dy) > 3;
    node.width = Math.max(180, Math.round(resize.width + dx));
    node.height = Math.max(110, Math.round(resize.height + dy));
    const el = document.querySelector(`[data-tfcc-node="${CSS.escape(node.id)}"]`);
    if (el) {
      el.style.width = `${node.width}px`;
      el.style.height = `${node.height}px`;
    }
    renderEdges();
  }

  function endNodeResize() {
    if (state.resizingNode?.moved) {
      const id = state.resizingNode.id;
      state.skipNodeClickId = id;
      const clearSkip = () => {
        if (state.skipNodeClickId === id) state.skipNodeClickId = "";
      };
      if (window.requestAnimationFrame) window.requestAnimationFrame(clearSkip);
      else setTimeout(clearSkip, 0);
    }
    if (state.resizingNode && !state.resizingNode.virtual) saveLayoutDebounced();
    state.resizingNode = null;
    document.removeEventListener("mousemove", onNodeResize);
    document.removeEventListener("mouseup", endNodeResize);
    render();
  }

  function selectNode(nodeId) {
    state.selectedNodeId = nodeId;
    state.promptMentionPicker = null;
    state.agentMentionPicker = null;
    document.querySelectorAll(".tfcc-mention-menu").forEach((el) => el.remove());
    const node = selectedNode();
    state.editText = node?.data?.segment?.text || "";
    if ((node?.type === "novelChapter" || node?.type === "novelSection") && !fullNovelItem(node.data)) {
      loadNovelFull()
        .then(() => renderInspector())
        .catch((err) => { state.message = err?.message || String(err); render(); });
    }
    document.querySelectorAll(".tfcc-node").forEach((el) => el.classList.toggle("is-selected", el.getAttribute("data-tfcc-node") === nodeId));
    renderInspector();
  }

  async function toggleAssetFlow(node) {
    const flowId = Number(node.data?.asset?.flowId || 0);
    selectNode(node.id);
    if (!flowId) {
      state.message = "该资产未找到原图片生成过程";
      render();
      return;
    }
    if (state.expandedImageFlows[node.id]) {
      delete state.expandedImageFlows[node.id];
      render();
      return;
    }
    if (!state.imageFlowCache[flowId]) {
      state.message = "正在加载原图片生成过程...";
      render();
      state.imageFlowCache[flowId] = await api("/production/editImage/getImageFlow", { method: "POST", body: { id: flowId } });
    }
    state.expandedImageFlows[node.id] = flowId;
    state.message = "";
    render();
  }

  function updateImageFlowPrompt(node, value) {
    updateImageFlowField(node, "prompt", value);
  }

  function updateImageFlowField(node, field, value) {
    const flow = state.imageFlowCache[node.data?.flowId];
    const flowNode = flow?.nodes?.find((item) => String(item.id) === String(node.data?.flowNodeId));
    if (!flowNode) return;
    flowNode.data = flowNode.data || {};
    flowNode.data[field] = value;
    if (field === "prompt") node.data.promptPreview = value;
    else node.data[field] = value;
  }

  async function saveImageFlowPrompt(node) {
    const flowId = Number(node.data?.flowId || 0);
    const flow = state.imageFlowCache[flowId];
    if (!flow) return;
    await api("/production/editImage/updateImageFlow", {
      method: "POST",
      body: { flowId, nodes: flow.nodes || [], edges: flow.edges || [] },
    });
  }

  function updateVideoPromptText(node, value) {
    node.data.prompt = value;
    node.data.promptPreview = value;
    if (node.data.videoTrack) node.data.videoTrack.prompt = value;
  }

  async function saveVideoPromptText(node) {
    const id = Number(node.data?.videoTrack?.id || 0);
    if (!id) return;
    await api("/production/workbench/updateVideoPrompt", {
      method: "POST",
      body: { id, prompt: node.data?.prompt || "" },
    });
  }

  function updateStoryboardPromptText(node, value) {
    node.data.prompt = value;
    node.data.promptPreview = value;
    if (node.data.storyboard) node.data.storyboard.prompt = value;
  }

  async function saveStoryboardPromptText(node) {
    const storyboard = node.data?.storyboard || {};
    const id = Number(storyboard.id || 0);
    if (!id) return;
    await api("/production/storyboard/editStoryboardInfo", {
      method: "POST",
      body: { id, prompt: node.data?.prompt || "", videoDesc: node.data?.videoDesc ?? storyboard.videoDesc ?? "" },
    });
  }

  async function toggleAssetGroup(node) {
    if (!(node.data?.items || []).length) {
      selectNode(node.id);
      return;
    }
    const next = !state.expandedAssetGroups[node.id];
    state.expandedAssetGroups[node.id] = next;
    selectNode(node.id);
    Object.keys(state.expandedImageFlows)
      .filter((key) => key.startsWith(`expandedAsset:${node.id}:`))
      .forEach((key) => delete state.expandedImageFlows[key]);
    render();
  }

  async function patchSelectedSegment() {
    const node = selectedNode();
    const segmentId = node?.data?.segment?.id;
    if (!segmentId || !state.editText.trim()) return;
    await withLoading(async () => {
      const result = await api("/creativeCanvas/patchText", {
        method: "POST",
        body: {
          segmentId: Number(segmentId),
          newText: state.editText,
          note: "creative canvas edit",
        },
      });
      state.message = `已修改片段，影响 ${result.staleNodeIds?.length || 0} 个下游节点`;
      await loadGraph();
    });
  }

  function normalizeOrderValue(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeNovelSaveItem(item = {}) {
    const index = normalizeOrderValue(item.index ?? item.chapterIndex ?? item.chapterOrder, normalizeOrderValue(item.chapterOrder, 0));
    const chapterOrder = normalizeOrderValue(item.chapterOrder ?? item.index ?? item.chapterIndex, index);
    const sectionOrder = normalizeOrderValue(item.sectionOrder, 0);
    return {
      id: Number(item.id),
      index,
      chapterOrder,
      sectionOrder,
      reel: item.reel || "",
      chapter: item.chapter || "",
      section: item.section || "",
      chapterData: item.chapterData || "",
      event: item.event || "",
    };
  }

  async function loadNovelFull(options = {}) {
    const pid = projectId();
    if (!pid || (state.novelFullCache[pid] && !options.force)) return;
    const result = await api("/novel/getNovelData", { method: "POST", body: { projectId: pid, page: 1, limit: 500 } });
    state.novelFullCache[pid] = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.list)
          ? result.list
          : Array.isArray(result?.rows)
            ? result.rows
            : [];
  }

  async function saveNovelItem(item) {
    const normalized = normalizeNovelSaveItem(item);
    await api("/novel/updateNovel", {
      method: "POST",
      body: normalized,
    });
    const pid = projectId();
    if (pid) {
      delete state.novelFullCache[pid];
      await loadNovelFull({ force: true });
    }
    state.editNovelId = null;
    await loadGraph();
  }

  function fullNovelItem(data) {
    const pid = projectId();
    const items = state.novelFullCache[pid] || [];
    return items.find((item) => Number(item.id) === Number(data?.id || data?.novelId)) || null;
  }

  function patchNovelFullCache(novelId, patch) {
    const pid = projectId();
    const items = state.novelFullCache[pid];
    if (!Array.isArray(items)) return;
    const index = items.findIndex((row) => Number(row.id) === Number(novelId));
    if (index >= 0) items[index] = { ...items[index], ...patch };
  }

  async function editNovelNode(node) {
    if (!node?.data?.id) return;
    selectNode(node.id);
    await withLoading(async () => {
      await loadNovelFull();
      state.editNovelId = node.data.id;
    });
  }

  async function analyzeNovelEvents(node) {
    const novelId = Number(node?.data?.id || node?.data?.novelId || 0);
    const pid = Number(projectId());
    if (!pid || !novelId) return;
    selectNode(node.id);
    await withLoading(async () => {
      await api("/novel/event/generateEvents", {
        method: "POST",
        body: { projectId: pid, novelIds: [novelId], concurrentCount: 1 },
      });
      patchNovelFullCache(novelId, { event: "", eventState: 0, errorReason: null });
      state.message = "章节事件分析任务已提交";
      await loadGraph();
      await loadNovelFull({ force: true });
      scheduleSourceEventPoll();
    });
  }

  function sourceReferencePrompt(node) {
    const project = state.graph?.project || {};
    const data = node?.data || {};
    const sectionTitle = data.section ? ` / ${data.section}` : "";
    const chapterTitle = `${data.chapter || data.sourceLabel || node?.label || "当前章节"}${sectionTitle}`;
    const chapterText = data.chapterData || "";
    const eventText = data.event || "";
    const base = [
      `项目：${project.name || state.graph?.project?.title || "当前项目"}`,
      `章节：${chapterTitle}`,
      chapterText ? `章节正文：${short(chapterText, 520)}` : "",
      eventText ? `关键事件：${short(eventText, 360)}` : "",
    ].filter(Boolean).join("\n");
    return `${base}\n\n请生成一张用于影视改编的章节风格参考概念图。要求：体现本章的核心情绪、时代氛围、人物关系和关键环境；电影感构图，光影层次明确，适合作为后续分镜、角色、场景、道具设计的视觉基准；不要生成文字、水印或 Logo。`;
  }

  async function generateSourceReference(node) {
    const project = state.graph?.project || {};
    const novelId = Number(node?.data?.id || node?.data?.novelId || 0);
    const pid = Number(projectId());
    if (!pid || !novelId) return;
    if (!project.imageModel) {
      state.message = "当前项目未配置图片模型，无法生成参考图";
      render();
      return;
    }
    selectNode(node.id);
    await withLoading(async () => {
      const prompt = sourceReferencePrompt(node);
      const result = await api("/production/editImage/generateFlowImage", {
        method: "POST",
        body: {
          model: project.imageModel || "",
          references: [],
          quality: project.imageQuality || "1K",
          ratio: project.videoRatio || "16:9",
          prompt,
          projectId: pid,
        },
      });
      const key = sourceReferenceKey({ novelId });
      const eventNodeId = `novelSection:${novelId}`;
      const sourceNodeId = graphNodes().some((item) => item.id === eventNodeId) ? eventNodeId : node.id;
      state.sourceReferences[key] = {
        projectId: pid,
        novelId,
        sourceNodeId,
        url: result?.url || "",
        prompt,
        ratio: project.videoRatio || "16:9",
        quality: project.imageQuality || "1K",
        model: project.imageModel || "",
        createdAt: Date.now(),
      };
      persistSourceReferences();
      state.message = "章节参考图已生成";
    });
  }

  async function extractAssetsForScript(targetScriptId) {
    const sid = Number(targetScriptId || scriptId());
    const pid = Number(projectId());
    if (!pid || !sid) throw new Error("缺少当前项目或剧集，无法提取资产");
    const label = scriptLabel(sid);
    const { script, assetCount, meta } = currentScriptAssetMeta(sid);
    if (!script) throw new Error("未找到当前剧集剧本，无法提取资产");
    if (!meta.actionLabel || meta.actionDisabled || isAssetExtracting(script)) {
      state.message = assetCount ? `「${label}」已有 ${assetCount} 个资产，正在重新提取/复核` : `「${label}」资产提取正在进行`;
      scheduleAssetExtractionPoll();
      return;
    }
    if (assetCount > 0) {
      const ok = window.confirm(`当前剧集「${label}」已有 ${assetCount} 个关联资产。\n重新提取会刷新剧本与资产关联，并可能影响后续分镜和视频引用。\n是否继续？`);
      if (!ok) {
        state.message = "已取消资产重新提取";
        return;
      }
    }
    const result = await api("/script/extractAssets", {
      method: "POST",
      body: {
        projectId: pid,
        scriptIds: [sid],
        groupSize: 1,
      },
    });
    if (!result?.taskId) throw new Error("资产提取接口未返回任务编号，任务未提交成功");
    state.view = "asset";
    state.selectedScriptId = sid;
    await loadGraph();
    const taskVisible = currentAssetTasks().some((task) => Number(task.id) === Number(result.taskId));
    state.message = taskVisible
      ? `已提交「${label}」资产提取任务 #${result.taskId}`
      : `已提交「${label}」资产提取任务 #${result.taskId}，正在刷新任务状态`;
    scheduleAssetExtractionPoll();
    return { ...result, label };
  }

  function assetRequestType(type) {
    if (type === "scene") return "scene";
    if (type === "tool" || type === "props" || type === "prop") return "tool";
    return "role";
  }

  async function submitAllAssetImages() {
    const project = state.graph?.project || {};
    const pid = Number(project.id || projectId());
    if (!pid) throw new Error("缺少当前项目，无法生成资产图");
    if (!project.imageModel) throw new Error("当前项目未配置图片模型，无法生成资产图");
    const targets = assetImageTargets();
    if (!targets.length) return 0;
    await api("/assetsGenerate/batchGenerateImageAssets", {
      method: "POST",
      body: {
        projectId: pid,
        model: project.imageModel || "",
        resolution: project.imageQuality || "1K",
        candidateCount: 4,
        enableScore: true,
        items: targets.map((asset) => ({
          id: Number(asset.id),
          type: assetRequestType(asset.type),
          name: asset.name || `资产 ${asset.id}`,
          prompt: asset.prompt || asset.describe || "",
        })),
      },
    });
    await loadGraph();
    return targets.length;
  }

  async function runNodeAction(action, targetNode) {
    const node = targetNode || selectedNode();
    if (!node || !state.graph?.project) return;
    const project = state.graph.project;
    await withLoading(async () => {
      if (action === "extractAssets") {
        await extractAssetsForScript(scriptIdFromNode(node));
        return;
      }
      if (action === "assetImage") {
        const asset = node.data.asset;
        if (!asset) {
          state.message = "请选择具体 Prompt 卡再生成候选图";
          return;
        }
        const references = resolveAssetReferences(asset.prompt || "", assetMentions(node));
        await api("/assetsGenerate/generateAssets", {
          method: "POST",
          body: {
            projectId: Number(asset.projectId),
            model: project.imageModel || "",
            resolution: project.imageQuality || "1K",
            id: Number(asset.id),
            type: asset.type || "scene",
            name: asset.name || "",
            prompt: asset.prompt || asset.describe || "",
            references,
            candidateCount: 4,
            enableScore: true,
          },
        });
        await loadGraph();
        state.message = "候选图生成任务已提交，完成后会自动按评分选中一张";
      }
      if (action === "storyboardImage") {
        const storyboard = node.data.storyboard;
        await api("/production/storyboard/batchGenerateImage", {
          method: "POST",
          body: {
            storyboardIds: [Number(storyboard.id)],
            projectId: Number(storyboard.projectId),
            scriptId: Number(storyboard.scriptId),
            concurrentCount: 1,
            compulsory: true,
          },
        });
        state.message = "分镜图生成任务已提交";
      }
      if (action === "videoPrompt") {
        const track = node.data.videoTrack;
        await api("/production/workbench/generateVideoPrompt", {
          method: "POST",
          body: {
            trackId: Number(track.id),
            projectId: Number(track.projectId),
            info: [],
            model: project.videoModel || "",
            mode: "text",
          },
        });
        state.message = "视频 prompt 生成任务已提交";
      }
      if (action === "video") {
        await submitVideos([node]);
        state.message = "视频生成任务已提交";
      }
      await loadGraph();
    });
  }

  function renderEdges() {
    const svg = document.querySelector(".tfcc-edges");
    if (!svg) return;
    svg.replaceChildren(...edgePaths());
  }

  function edgePaths() {
    const visible = visibleNodeIds();
    const nodeMap = new Map(graphNodes().map((node) => [node.id, node]));
    return graphEdges()
      .filter((edge) => visible.has(edge.source) && visible.has(edge.target))
      .map((edge) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        const sx = source.position.x + (source.width || 260);
        const sy = source.position.y + (source.height || 140) / 2;
        const tx = target.position.x;
        const ty = target.position.y + (target.height || 140) / 2;
        const dx = Math.max(80, Math.abs(tx - sx) * 0.42);
        const path = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
        const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
        el.setAttribute("class", `tfcc-edge tfcc-edge-${edge.type || "default"}`);
        el.setAttribute("d", path);
        return el;
      })
      .filter(Boolean);
  }

  function renderNode(node) {
    if (node.type === "assetExtractionTask") return null;
    if (!visibleNodeIds().has(node.id)) {
      return null;
    }
    const classes = [
      "tfcc-node",
      `tfcc-node-${node.type}`,
      node.stale ? "is-stale" : "",
      node.data?.expandedFromGroup ? "is-expanded-child" : "",
      node.id === state.selectedNodeId ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return h(
      "div",
      {
        class: classes,
        "data-tfcc-node": node.id,
        style: {
          left: `${node.position.x}px`,
          top: `${node.position.y}px`,
          width: `${node.width || 260}px`,
          height: `${node.height || 120}px`,
        },
        onMouseDown: (event) => beginNodeDrag(event, node),
        onClick: (event) => {
          event.stopPropagation();
          if (state.skipNodeClickId === node.id) {
            state.skipNodeClickId = "";
            return;
          }
          if (node.type === "assetGroup") toggleAssetGroup(node).catch((err) => { state.message = err?.message || String(err); render(); });
          else if (node.type === "asset" && node.data?.asset?.flowId) toggleAssetFlow(node).catch((err) => { state.message = err?.message || String(err); render(); });
          else selectNode(node.id);
        },
      },
      [...renderNodeContent(node), h("div", { class: "tfcc-node-resize", title: "拖动调整卡片尺寸", onMouseDown: (event) => beginNodeResize(event, node) })],
    );
  }

  function statusBadgeClass(status) {
    if (status === "需复核") return "tfcc-badge warn";
    if (status === "生成中") return "tfcc-badge running";
    if (status === "已完成") return "tfcc-badge done";
    if (status === "待补齐") return "tfcc-badge pending";
    return "tfcc-badge";
  }

  function nodeTitle(node) {
    const badges = [];
    if (node.status) badges.push(h("span", { class: statusBadgeClass(node.status), text: node.status }));
    else if (node.stale) badges.push(h("span", { class: "tfcc-badge warn", text: "需复核" }));
    return h("div", { class: "tfcc-node-title" }, [h("span", { class: "tfcc-node-title-text", text: node.label }), ...badges]);
  }

  function nodeSource(node) {
    if (!node.sourceLabel) return null;
    return h("div", { class: "tfcc-node-source", text: node.sourceLabel });
  }

  function thumbTile(src, extraClass) {
    if (src) {
      return h("div", { class: `tfcc-thumb ${extraClass || ""}`.trim() }, [h("img", { src, loading: "lazy", alt: "" })]);
    }
    return h("div", { class: `tfcc-thumb is-empty ${extraClass || ""}`.trim() }, []);
  }

  function videoTile(src) {
    return h("div", { class: "tfcc-video-tile", onMouseDown: (event) => event.stopPropagation(), onClick: (event) => event.stopPropagation() }, [
      src ? h("video", { src, controls: true, preload: "metadata" }) : null,
      src ? null : h("span", { class: "tfcc-video-play", text: "▶" }),
    ].filter(Boolean));
  }

  function promptGraphicTextFromNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    if (node.dataset?.token) return node.dataset.token;
    return [...node.childNodes].map(promptGraphicTextFromNode).join("");
  }

  function promptGraphicText(el) {
    return [...el.childNodes].map(promptGraphicTextFromNode).join("");
  }

  function promptGraphicTextBeforeCaret(el) {
    const selection = window.getSelection?.();
    if (!selection?.rangeCount) return promptGraphicText(el);
    const range = selection.getRangeAt(0);
    if (!el.contains(range.endContainer)) return promptGraphicText(el);
    if (range.endContainer === el) return [...el.childNodes].slice(0, range.endOffset).map(promptGraphicTextFromNode).join("");
    let text = "";
    let done = false;
    const visit = (node) => {
      if (done) return;
      if (node === range.endContainer) {
        if (node.nodeType === Node.TEXT_NODE) text += (node.textContent || "").slice(0, range.endOffset);
        else text += [...node.childNodes].slice(0, range.endOffset).map(promptGraphicTextFromNode).join("");
        done = true;
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE && node.contains(range.endContainer) && !node.dataset?.token) {
        [...node.childNodes].forEach(visit);
        return;
      }
      text += promptGraphicTextFromNode(node);
    };
    [...el.childNodes].forEach(visit);
    return text;
  }

  function addUniqueOption(options, value, label) {
    const normalized = String(value || "").trim();
    if (!normalized || options.some((option) => option.value === normalized)) return;
    options.push({ value: normalized, label: label || normalized });
  }

  function imageModelOptions(currentValue) {
    const options = [];
    (state.imageModelOptions || []).forEach((option) => addUniqueOption(options, option.value, option.label));
    addUniqueOption(options, state.graph?.project?.imageModel, state.graph?.project?.imageModel);
    addUniqueOption(options, currentValue, currentValue);
    if (!options.length) options.push({ value: "", label: "未配置模型" });
    return options;
  }

  function selectOptions(values, currentValue) {
    const options = [];
    values.forEach((value) => addUniqueOption(options, value, value));
    addUniqueOption(options, currentValue, currentValue);
    return options;
  }

  function saveImageFlowField(node, field, value) {
    updateImageFlowField(node, field, value);
    saveImageFlowPrompt(node).catch((err) => {
      state.message = err?.message || String(err);
      render();
    });
  }

  function renderFlowSelect(label, value, options, onChange, extraClass = "") {
    return h("label", { class: `tfcc-flow-select-field ${extraClass}`.trim() }, [
      h("span", { text: label }),
      h("select", {
        value: value || "",
        title: label,
        onMouseDown: (event) => event.stopPropagation(),
        onClick: (event) => event.stopPropagation(),
        onChange,
      }, options.map((option) => h("option", { value: option.value, text: option.label }))),
    ]);
  }

  function renderImageFlowControls(node, data) {
    return h("div", { class: "tfcc-flow-node-controls", onMouseDown: (event) => event.stopPropagation(), onClick: (event) => event.stopPropagation() }, [
      renderFlowSelect("模型", data.model || "", imageModelOptions(data.model), (event) => saveImageFlowField(node, "model", event.target.value), "is-model"),
      renderFlowSelect("比例", data.ratio || "", selectOptions(IMAGE_RATIOS, data.ratio), (event) => saveImageFlowField(node, "ratio", event.target.value)),
      renderFlowSelect("质量", data.quality || "", selectOptions(IMAGE_QUALITIES, data.quality), (event) => saveImageFlowField(node, "quality", event.target.value)),
    ]);
  }

  function promptMentionTrigger(value) {
    const match = String(value || "").match(/@[\u4e00-\u9fa5\w]*$/);
    return match ? match[0].slice(1) : null;
  }

  function mentionPickerPosition(el) {
    const editorRect = el.getBoundingClientRect();
    let rect = editorRect;
    const selection = window.getSelection?.();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      if (el.contains(range.endContainer)) {
        rect = range.cloneRange().getBoundingClientRect();
        if (!rect.width && !rect.height) rect = editorRect;
      }
    }
    const width = 280;
    const height = 230;
    const x = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left || editorRect.left));
    const below = (rect.bottom || editorRect.bottom) + 6;
    const above = (rect.top || editorRect.top) - height - 6;
    const y = below + height > window.innerHeight && above > 12 ? above : below;
    return { x: Math.round(x), y: Math.round(Math.max(12, y)) };
  }

  function imageFlowMentionItems(mentions, query) {
    const needle = String(query || "").toLowerCase();
    return (mentions || [])
      .filter((item) => item?.token)
      .filter((item) => {
        if (!needle) return true;
        return `${item.token || ""} ${item.label || ""}`.toLowerCase().includes(needle);
      })
      .slice(0, 8);
  }

  function handleImageFlowPromptInput(node, el, mentions) {
    const value = promptGraphicText(el);
    updateImageFlowPrompt(node, value);
    const beforeCaret = promptGraphicTextBeforeCaret(el);
    const query = promptMentionTrigger(beforeCaret);
    if (query === null) {
      if (state.promptMentionPicker?.nodeId === node.id) {
        state.promptMentionPicker = null;
        render();
      }
      return;
    }
    const items = imageFlowMentionItems(mentions, query);
    state.promptMentionPicker = { nodeId: node.id, kind: "imageFlow", query, items, at: beforeCaret.length - query.length - 1, ...mentionPickerPosition(el) };
    render();
  }

  function insertImageFlowMention(node, item, event) {
    event.preventDefault();
    event.stopPropagation();
    const token = item?.token || "";
    if (!token) return;
    const picker = state.promptMentionPicker;
    const current = node.data?.promptPreview || "";
    const next = picker?.nodeId === node.id && Number.isFinite(picker.at)
      ? `${current.slice(0, picker.at)}${token} ${current.slice(picker.at + picker.query.length + 1)}`
      : promptMentionTrigger(current) === null
      ? `${current}${current && !/\s$/.test(current) ? " " : ""}${token} `
      : current.replace(/(^|\s)@[\u4e00-\u9fa5\w]*$/, `$1${token} `);
    updateImageFlowPrompt(node, next);
    state.promptMentionPicker = null;
    saveImageFlowPrompt(node).catch((err) => { state.message = err?.message || String(err); });
    render();
  }

  function renderImageFlowMentionPicker(node) {
    return null;
  }

  function handleStoryboardPromptInput(node, el, mentions) {
    const value = promptGraphicText(el);
    updateStoryboardPromptText(node, value);
    const beforeCaret = promptGraphicTextBeforeCaret(el);
    const query = promptMentionTrigger(beforeCaret);
    if (query === null) {
      if (state.promptMentionPicker?.nodeId === node.id) {
        state.promptMentionPicker = null;
        render();
      }
      return;
    }
    const items = imageFlowMentionItems(mentions, query);
    state.promptMentionPicker = { nodeId: node.id, kind: "storyboard", query, items, at: beforeCaret.length - query.length - 1, ...mentionPickerPosition(el) };
    render();
  }

  function insertStoryboardMention(node, item, event) {
    event.preventDefault();
    event.stopPropagation();
    const token = item?.token || "";
    if (!token) return;
    const picker = state.promptMentionPicker;
    const current = node.data?.prompt || "";
    const next = picker?.nodeId === node.id && Number.isFinite(picker.at)
      ? `${current.slice(0, picker.at)}${token} ${current.slice(picker.at + picker.query.length + 1)}`
      : promptMentionTrigger(current) === null
      ? `${current}${current && !/\s$/.test(current) ? " " : ""}${token} `
      : current.replace(/(^|\s)@[\u4e00-\u9fa5\w]*$/, `$1${token} `);
    updateStoryboardPromptText(node, next);
    state.promptMentionPicker = null;
    saveStoryboardPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); });
    render();
  }

  function handleVideoPromptInput(node, el, mentions) {
    const value = promptGraphicText(el);
    updateVideoPromptText(node, value);
    const beforeCaret = promptGraphicTextBeforeCaret(el);
    const query = promptMentionTrigger(beforeCaret);
    if (query === null) {
      if (state.promptMentionPicker?.nodeId === node.id) {
        state.promptMentionPicker = null;
        render();
      }
      return;
    }
    const items = imageFlowMentionItems(mentions, query);
    state.promptMentionPicker = { nodeId: node.id, kind: "videoPrompt", query, items, at: beforeCaret.length - query.length - 1, ...mentionPickerPosition(el) };
    render();
  }

  function insertVideoPromptMention(node, item, event) {
    event.preventDefault();
    event.stopPropagation();
    const token = item?.token || "";
    if (!token) return;
    const picker = state.promptMentionPicker;
    const current = node.data?.prompt || "";
    const next = picker?.nodeId === node.id && Number.isFinite(picker.at)
      ? `${current.slice(0, picker.at)}${token} ${current.slice(picker.at + picker.query.length + 1)}`
      : promptMentionTrigger(current) === null
      ? `${current}${current && !/\s$/.test(current) ? " " : ""}${token} `
      : current.replace(/(^|\s)@[\u4e00-\u9fa5\w]*$/, `$1${token} `);
    updateVideoPromptText(node, next);
    state.promptMentionPicker = null;
    saveVideoPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); });
    render();
  }

  // ─── 资产节点 prompt 的 @ 图文引用 ────────────────────────
  // 候选：项目资产库（角色/场景/道具图，按类型编号 @角色N/@场景N/@道具N）
  //       + 该资产自身 imageFlow 的参考图节点（@图片N）
  function assetMentions(node) {
    const out = [];
    const typeToken = { role: "@角色", scene: "@场景", tool: "@道具" };
    const counters = { role: 0, scene: 0, tool: 0 };
    (state.graph?.nodes || []).forEach((group) => {
      if (group.type !== "assetGroup") return;
      (group.data?.items || []).forEach((item) => {
        if (!item.thumbnail) return;
        const key = item.type === "scene" || item.type === "tool" ? item.type : "role";
        counters[key] += 1;
        out.push({
          token: `${typeToken[key]}${counters[key]}`,
          label: item.name || `资产${item.id}`,
          image: item.thumbnail,
          assetId: item.id,
        });
      });
    });
    const flowId = Number(node?.data?.asset?.flowId || 0);
    const flow = state.imageFlowCache?.[flowId];
    if (flow) {
      const flowNodes = flow.nodes || [];
      const generatedPrompt = (flowNodes.find((n) => n.type === "generated")?.data?.prompt) || "";
      let picIdx = 0;
      flowNodes.forEach((fn) => {
        if (fn.type === "generated") return;
        picIdx += 1;
        const img = imageFlowNodeImage(fn);
        if (!img) return;
        out.push({
          token: `@图片${picIdx}`,
          label: imageFlowMentionName(generatedPrompt, picIdx) || `参考图 ${picIdx}`,
          image: img,
          url: img,
        });
      });
    }
    return out;
  }

  function handleAssetPromptInput(node, el, mentions) {
    const value = promptGraphicText(el);
    if (node.data.asset) {
      node.data.asset.prompt = value;
      node.data.promptPreview = value;
    }
    const beforeCaret = promptGraphicTextBeforeCaret(el);
    const query = promptMentionTrigger(beforeCaret);
    if (query === null) {
      if (state.promptMentionPicker?.nodeId === node.id) {
        state.promptMentionPicker = null;
        render();
      }
      return;
    }
    const items = imageFlowMentionItems(mentions, query);
    state.promptMentionPicker = { nodeId: node.id, kind: "asset", query, items, at: beforeCaret.length - query.length - 1, ...mentionPickerPosition(el) };
    render();
  }

  function insertAssetMention(node, item, event) {
    event.preventDefault();
    event.stopPropagation();
    const token = item?.token || "";
    if (!token) return;
    const picker = state.promptMentionPicker;
    const current = node.data?.asset?.prompt || "";
    const next = picker?.nodeId === node.id && Number.isFinite(picker.at)
      ? `${current.slice(0, picker.at)}${token} ${current.slice(picker.at + picker.query.length + 1)}`
      : promptMentionTrigger(current) === null
      ? `${current}${current && !/\s$/.test(current) ? " " : ""}${token} `
      : current.replace(/(^|\s)@[\u4e00-\u9fa5\w]*$/, `$1${token} `);
    if (node.data.asset) {
      node.data.asset.prompt = next;
      node.data.promptPreview = next;
    }
    state.promptMentionPicker = null;
    saveAssetPrompt(node).catch((err) => { state.message = err?.message || String(err); render(); });
    render();
  }

  function renderAssetMentionPicker(node) {
    return null;
  }

  function renderPromptMentionPicker() {
    const picker = state.promptMentionPicker;
    if (!picker) return null;
    const node = graphNodes().find((item) => item.id === picker.nodeId);
    if (!node) return null;
    const items = picker.items || [];
    const insert = picker.kind === "asset" ? insertAssetMention : picker.kind === "storyboard" ? insertStoryboardMention : picker.kind === "videoPrompt" ? insertVideoPromptMention : insertImageFlowMention;
    return h("div", {
      class: "tfcc-mention-menu",
      style: { left: `${picker.x || 12}px`, top: `${picker.y || 12}px` },
      onMouseDown: (event) => event.stopPropagation(),
    }, items.length
      ? items.map((item) => h("button", { onMouseDown: (event) => insert(node, item, event) }, [
          item.image ? h("img", { src: item.image, loading: "lazy", alt: "" }) : null,
          h("span", { text: `${item.token} ${item.label || ""}`.trim() }),
        ].filter(Boolean)))
      : [h("div", { class: "tfcc-mention-empty", text: "没有匹配的角色或参考图" })]);
  }

  async function saveAssetPrompt(node) {
    const asset = node.data?.asset;
    if (!asset?.id) return;
    await api("/assets/updateAssets", {
      method: "POST",
      body: {
        id: Number(asset.id),
        name: asset.name || "",
        describe: asset.describe || "",
        remark: asset.remark ?? "",
        prompt: asset.prompt || "",
      },
    });
  }

  // 按 prompt 中 @ token 出现顺序解析引用，去重后返回 {assetId?,url?} 列表
  function resolveAssetReferences(prompt, mentions) {
    const text = String(prompt || "");
    const byToken = new Map();
    (mentions || []).forEach((item) => {
      if (item?.token) byToken.set(String(item.token), item);
    });
    // 按长度倒序匹配，避免 @图1 抢先于 @图片1 / @角色1
    const tokens = [...byToken.keys()].sort((a, b) => b.length - a.length).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const out = [];
    const seen = new Set();
    if (tokens.length) {
      const re = new RegExp(`(${tokens.join("|")})`, "g");
      let match;
      while ((match = re.exec(text)) !== null) {
        const item = byToken.get(match[0]);
        if (!item) continue;
        const key = item.assetId ? `a:${item.assetId}` : `u:${item.url || ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (item.assetId) out.push({ assetId: Number(item.assetId) });
        else if (item.url) out.push({ url: item.url });
      }
    }
    return out;
  }

  function renderPromptGraphic(value, mentions, options = {}) {
    const refs = new Map();
    (mentions || []).forEach((item) => {
      if (!item?.token) return;
      const token = String(item.token);
      const index = token.match(/\d+/)?.[0] || "";
      const aliases = [token, token.replace(/^@图片/, "@图"), token.replace(/^@/, "@ "), token.replace(/^@图片/, "@ 图")];
      if (index && /角色/.test(String(item.label || ""))) aliases.push(`@角色${index}`, `@ 角色${index}`);
      if (index && /场景|街道|教室|面馆|宿舍|房间/.test(String(item.label || ""))) aliases.push(`@场景${index}`, `@ 场景${index}`);
      if (index && /道具|工具|盒饭|旧伞|纸条|请柬/.test(String(item.label || ""))) aliases.push(`@道具${index}`, `@ 道具${index}`);
      aliases.forEach((alias) => refs.set(alias, item));
    });
    const tokens = [...refs.keys()].sort((a, b) => b.length - a.length);
    const attrs = {
      class: `tfcc-prompt-graphic ${options.editable ? "is-editable" : ""}`.trim(),
      contenteditable: options.editable ? "true" : null,
      role: options.editable ? "textbox" : null,
      spellcheck: options.editable ? "false" : null,
      onInput: options.onInput,
      onBlur: options.onBlur,
      onMouseDown: (event) => { if (options.editable) event.stopPropagation(); },
      onClick: (event) => { if (options.editable) event.stopPropagation(); },
    };
    if (!tokens.length) return h("div", { ...attrs, text: value || "" });
    const pattern = new RegExp(`(${tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    return h("div", attrs, String(value || "").split(pattern).map((part) => {
      const ref = refs.get(part);
      if (!ref) return part;
      return h("span", { class: "tfcc-prompt-ref", title: ref.label, contenteditable: "false", "data-token": part }, [
        ref.image ? h("img", { src: ref.image, loading: "lazy", alt: "" }) : null,
        h("span", { text: `${part} ${ref.label}` }),
      ].filter(Boolean));
    }));
  }

  function thumbGrid(thumbnails, total, max, variant) {
    const list = Array.isArray(thumbnails) ? thumbnails : [];
    const shown = list.slice(0, max);
    const tiles = shown.map((src) => thumbTile(src));
    const overflow = (total || list.length) - shown.length;
    if (overflow > 0) tiles.push(h("div", { class: "tfcc-thumb is-more", text: `+${overflow}` }));
    if (!tiles.length) tiles.push(h("div", { class: "tfcc-thumb is-empty", text: "暂无图" }));
    return h("div", { class: `tfcc-thumb-grid ${variant === "row" ? "is-row" : ""}`.trim() }, tiles);
  }

  function nodeActionButton(label, onClick, variant = "") {
    return h("button", {
      class: `tfcc-source-action ${variant}`.trim(),
      onMouseDown: (event) => event.stopPropagation(),
      onClick: (event) => {
        event.preventDefault();
        event.stopPropagation();
        Promise.resolve(onClick()).catch((err) => {
          state.message = err?.message || String(err);
          render();
        });
      },
      text: label,
    });
  }

  function eventTypeLabel(value) {
    const text = String(value || "");
    if (/决定|选择|秘密|发现|揭开|背叛|转折/.test(text)) return "关键转折";
    if (/结局|收束|最后/.test(text)) return "结局事件";
    if (/相遇|重逢|冲突|误会|分歧/.test(text)) return "结构事件";
    return "主剧情突变";
  }

  function sourceEventBadge(data = {}) {
    const stateValue = Number(data.eventState);
    if (stateValue === 0) return { text: "分析中", className: "is-pending", done: false, running: true };
    if (stateValue === -1) return { text: "分析失败", className: "is-pending", done: false, failed: true };
    if (data.event) return { text: "已分析", className: "is-done", done: true };
    return { text: "待分析", className: "is-pending", done: false };
  }

  function sourceEventPreview(data = {}, eventBadge = sourceEventBadge(data)) {
    if (eventBadge.running) return "事件正在分析，完成后会自动刷新。";
    if (eventBadge.failed) return "事件分析失败，请查看失败原因后重试。";
    if (data.event) return short(data.event, 145);
    return "尚未生成事件分析。";
  }

  function sourceCardTitle(node, options = {}) {
    return h("div", { class: "tfcc-source-card-head" }, [
      h("span", { class: "tfcc-source-dot" }),
      h("span", { class: "tfcc-source-title", text: node.label }),
      options.pill ? h("span", { class: `tfcc-source-pill ${options.pillClass || ""}`.trim(), text: options.pill }) : null,
      node.status ? h("span", { class: statusBadgeClass(node.status), text: node.status }) : null,
    ].filter(Boolean));
  }

  function sourceChapterDisplayTitle(data = {}, fallbackLabel = "") {
    const chapterOrder = Number(data.chapterOrder ?? data.order);
    const sectionOrder = Number(data.sectionOrder ?? 0);
    const chapterName = data.chapter || fallbackLabel || "未命名章节";
    const sectionName = data.section || "";
    const chapterPart = Number.isFinite(chapterOrder) && chapterOrder > 0 ? `第 ${chapterOrder} 章 ${chapterName}` : chapterName;
    const hasSection = sectionName || (Number.isFinite(sectionOrder) && sectionOrder > 0);
    if (!hasSection) return chapterPart;
    const sectionPart = `第 ${Number.isFinite(sectionOrder) ? sectionOrder : 0} 节${sectionName ? ` ${sectionName}` : ""}`;
    return `${chapterPart} ${sectionPart}`;
  }

  function sourceDisplayData(node) {
    const data = node?.data || {};
    const full = fullNovelItem(data);
    if (!full) return data;
    const merged = { ...data, ...full };
    if (data.eventState != null) {
      merged.eventState = data.eventState;
      merged.errorReason = data.errorReason;
      if (Number(data.eventState) === 0) merged.event = "";
    }
    return merged;
  }

  function renderNovelChapterNode(node) {
    const data = sourceDisplayData(node);
    const title = sourceChapterDisplayTitle(data, node.label);
    const eventBadge = sourceEventBadge(data);
    return [
      sourceCardTitle({ ...node, status: "", label: title }, { pill: eventBadge.text, pillClass: eventBadge.className }),
      h("div", { class: "tfcc-source-preview", text: short(data.chapterData, 150) }),
      h("div", { class: "tfcc-source-actions" }, [
        nodeActionButton("编辑章节", () => editNovelNode(node)),
        nodeActionButton("分析事件", () => analyzeNovelEvents(node)),
        nodeActionButton("参考风格画图", () => generateSourceReference(node), "primary"),
      ]),
    ];
  }

  function renderNovelSectionNode(node) {
    const data = sourceDisplayData(node);
    const label = `事件 ${data.eventIndex || ""} ${sourceChapterDisplayTitle(data, node.label)}`.trim();
    const eventBadge = sourceEventBadge(data);
    return [
      sourceCardTitle({ ...node, status: "", label }, {
        pill: eventBadge.done ? eventTypeLabel(data.event) : eventBadge.text,
        pillClass: eventBadge.done ? "is-done" : eventBadge.className,
      }),
      h("div", { class: "tfcc-source-preview", text: sourceEventPreview(data, eventBadge) }),
      data.errorReason ? h("div", { class: "tfcc-source-error", text: short(data.errorReason, 90) }) : null,
    ].filter(Boolean);
  }

  function renderSourceReferenceNode(node) {
    const data = node.data || {};
    return [
      sourceCardTitle({ ...node, status: "" }, { pill: node.status || "已生成", pillClass: "is-done" }),
      h("div", { class: "tfcc-source-ref-image" }, [
        data.image ? h("img", { src: data.image, loading: "lazy", alt: "" }) : h("span", { text: "暂无参考图" }),
      ]),
      h("div", { class: "tfcc-source-ref-chips" }, [
        h("span", { text: "画风手册" }),
        h("span", { text: data.ratio || "16:9" }),
        h("span", { text: "概念图" }),
      ]),
      nodeActionButton("重新生成", () => generateSourceReference(node)),
    ];
  }

  function sourceProjectStats(summary = {}) {
    const nodes = graphNodes();
    const sourceNodes = nodes.filter((item) => item.type === "novelChapter");
    const chapterKeys = new Set(sourceNodes.map((item) => {
      const data = sourceDisplayData(item);
      return data.chapterOrder ?? data.chapterIndex ?? data.index ?? data.id ?? item.id;
    }));
    return {
      chapterCount: chapterKeys.size || Number(summary.novelCount || 0),
      sectionCount: sourceNodes.length || Number(summary.novelCount || 0),
      eventCount: nodes.filter((item) => item.type === "novelSection").length || Number(summary.eventCount || 0),
      referenceCount: nodes.filter((item) => item.type === "sourceReference").length,
    };
  }

  function renderNodeContent(node) {
    const data = node.data || {};
    const title = nodeTitle(node);
    if (node.type === "project") {
      const summary = state.graph?.summary || {};
      const sourceStats = sourceProjectStats(summary);
      return [
        title,
        h("div", { class: "tfcc-node-sub", text: short(data.introPreview, 110) }),
        h("div", { class: "tfcc-chips" }, state.view === "source" ? [
          chip(sourceStats.chapterCount, "章"),
          chip(sourceStats.sectionCount, "节"),
          chip(sourceStats.eventCount, "事件"),
          chip(sourceStats.referenceCount, "参考图"),
        ] : [
          chip(sourceStats.chapterCount, "章"),
          chip(sourceStats.sectionCount, "节"),
          chip(summary.scriptCount, "集"),
          chip(summary.eventCount, "事件"),
          chip(summary.assetCount, "资产"),
          chip(summary.storyboardCount, "分镜"),
          chip(summary.videoCount, "视频"),
        ]),
      ];
    }
    if (node.type === "novelChapter") {
      return renderNovelChapterNode(node);
    }
    if (node.type === "novelSection") {
      return renderNovelSectionNode(node);
    }
    if (node.type === "sourceReference") {
      return renderSourceReferenceNode(node);
    }
    if (node.type === "storySkeleton" || node.type === "adaptationStrategy" || node.type === "scriptPlan" || node.type === "storyboardTable") {
      const subtitles = {
        storySkeleton: "剧本 Agent 生成的故事结构",
        adaptationStrategy: "剧本 Agent 生成的改编策略",
        scriptPlan: "分镜 Agent 生成的导演规划",
        storyboardTable: "分镜 Agent 生成的分镜表",
      };
      return [
        title,
        h("div", {
          class: "tfcc-node-sub",
          text: subtitles[node.type] || "Agent 生成的生产资料",
        }),
        nodeMarkdownPreview(node, data.content || data.contentPreview, 300),
        nodeSource(node),
      ];
    }
    if (node.type === "assetGroup") {
      const count = data.count || (data.items ? data.items.length : 0);
      const unit = data.assetType === "scene" ? "个场景" : data.assetType === "tool" ? "个道具" : "个角色";
      const expanded = !!state.expandedAssetGroups[node.id];
      return [
        title,
        thumbGrid(data.thumbnails, count, 4, "row"),
        h("div", { class: "tfcc-node-count", text: `${count} ${unit}` }),
        h("div", { class: "tfcc-node-sub", text: expanded ? "点击收起资产卡片" : "点击展开资产卡片" }),
        nodeSource(node),
      ];
    }
    if (node.type === "storyboardAnalysis") {
      const shots = data.shots || [];
      const thumbs = (data.thumbnails && data.thumbnails.length ? data.thumbnails : shots.map((s) => s.thumbnail).filter(Boolean));
      return [
        title,
        h("div", { class: "tfcc-node-count", text: `${data.shotCount ?? shots.length} 个分镜节点` }),
        thumbGrid(thumbs, data.shotCount ?? shots.length, 5),
        nodeSource(node),
      ];
    }
      if (node.type === "asset") {
      const asset = data.asset || {};
      if (data.expandedFromGroup) {
        const opened = !!state.expandedImageFlows[node.id];
        const hint = asset.flowId ? (opened ? "点击收起生成过程" : "点击展开生成过程") : (asset.type || "-");
        const promptText = asset.prompt || data.promptPreview || "";
        return [
          title,
          data.thumbnail ? thumbTile(data.thumbnail, "tfcc-asset-node-thumb") : null,
          h("p", { class: "tfcc-asset-prompt-preview", text: short(promptText, 110) || "暂无 prompt" }),
          h("div", { class: "tfcc-node-sub", text: hint }),
        ].filter(Boolean);
      }
      return [title, data.thumbnail ? thumbTile(data.thumbnail, "tfcc-asset-node-thumb") : null, h("div", { class: "tfcc-node-sub", text: asset.type || "-" }), h("p", { text: short(data.promptPreview, 180) }), nodeSource(node)].filter(Boolean);
    }
    if (node.type === "assetImage") {
      const scoreText = data.image?.score == null ? "" : ` · ${data.image.score}分`;
      return [
        title,
        data.thumbnail ? thumbTile(data.thumbnail, "tfcc-asset-image-thumb") : h("div", { class: "tfcc-thumb is-empty tfcc-asset-image-thumb", text: "暂无图" }),
        h("div", { class: "tfcc-node-sub", text: `${data.image?.state || "图片结果"}${scoreText}` }),
        data.image?.scoreReason ? h("p", { text: short(data.image.scoreReason, 56) }) : null,
        nodeSource(node),
      ].filter(Boolean);
    }
    if (node.type === "imageFlowUpload") {
      return [title, data.image ? thumbTile(data.image, "tfcc-flow-node-thumb") : h("div", { class: "tfcc-thumb is-empty tfcc-flow-node-thumb", text: "暂无图" }), nodeSource(node)].filter(Boolean);
    }
    if (node.type === "imageFlowGenerated") {
      const mentions = data.mentions || [];
      const promptText = data.promptPreview || "";
      return [
        title,
        data.image ? thumbTile(data.image, "tfcc-flow-node-wide") : h("div", { class: "tfcc-thumb is-empty tfcc-flow-node-wide", text: "暂无生成图" }),
        renderImageFlowControls(node, data),
        renderPromptGraphic(promptText, mentions, {
          editable: true,
          onInput: (event) => {
            handleImageFlowPromptInput(node, event.currentTarget, mentions);
          },
          onBlur: (event) => {
            updateImageFlowPrompt(node, promptGraphicText(event.currentTarget));
            saveImageFlowPrompt(node).catch((err) => { state.message = err?.message || String(err); render(); });
          },
        }),
        renderImageFlowMentionPicker(node),
      ].filter(Boolean);
    }
    if (node.type === "script") return [title, nodeMarkdownPreview(node, data.script?.content || data.content || data.contentPreview, 300), nodeSource(node)];
    if (node.type === "storyboard") {
      const mentions = data.mentions || [];
      const promptText = data.prompt || data.promptPreview || "";
      const children = [title];
      if (data.thumbnail) children.push(thumbTile(data.thumbnail, "tfcc-thumb-wide"));
      children.push(renderPromptGraphic(promptText, mentions, {
        editable: true,
        onInput: (event) => handleStoryboardPromptInput(node, event.currentTarget, mentions),
        onBlur: (event) => {
          updateStoryboardPromptText(node, promptGraphicText(event.currentTarget));
          saveStoryboardPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); });
        },
      }));
      children.push(nodeSource(node));
      return children.filter(Boolean);
    }
    if (node.type === "videoPrompt") {
      const mentions = data.mentions || [];
      const promptText = data.prompt || data.promptPreview || "";
      return [
        title,
        renderPromptGraphic(promptText, mentions, {
          editable: true,
          onInput: (event) => handleVideoPromptInput(node, event.currentTarget, mentions),
          onBlur: (event) => {
            updateVideoPromptText(node, promptGraphicText(event.currentTarget));
            saveVideoPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); });
          },
        }),
        nodeSource(node),
      ].filter(Boolean);
    }
    if (node.type === "videoPromptGroup") {
      const samples = data.samples || [];
      return [
        title,
        h("div", { class: "tfcc-node-count", text: `${data.count || 0} 条 Prompt 已生成` }),
        h("div", { class: "tfcc-prompt-cols" }, samples.map((sample) => h("div", { class: "tfcc-prompt-col", text: short(sample, 64) }))),
        nodeSource(node),
      ];
    }
    if (node.type === "videoGroup") {
      const posters = data.posters || [];
      const total = data.count || 0;
      const done = data.doneCount || 0;
      const tiles = posters.slice(0, 3).map((src) => videoTile(src));
      const overflow = total - tiles.length;
      if (overflow > 0) tiles.push(h("div", { class: "tfcc-video-tile is-more", text: `+${overflow}` }));
      return [
        title,
        h("div", { class: "tfcc-node-count", text: done < total ? `生成中 ${done}/${total}` : `已完成 ${total}` }),
        h("div", { class: "tfcc-video-row" }, tiles),
        nodeSource(node),
      ];
    }
    if (node.type === "video") {
      const video = data.video || {};
      const poster = data.poster || "";
      return [
        title,
        videoTile(poster),
        h("div", { class: "tfcc-node-sub", text: video.state || "-" }),
        nodeSource(node),
      ];
    }
    if (node.type === "auditArtifact") {
      const artifact = data.artifact || {};
      return [
        title,
        h("div", { class: "tfcc-node-sub", text: `${artifact.artifactType || "-"} · ${formatTime(artifact.createTime)}` }),
        h("p", { text: short(data.contentPreview, 160) }),
      ];
    }
    if (node.type === "auditSegment") {
      const segment = data.segment || {};
      return [title, h("div", { class: "tfcc-node-sub", text: `#${segment.segmentIndex ?? "-"} · ${segment.segmentType || "-"}` }), h("p", { text: short(segment.text, 160) })];
    }
    if (node.type === "task") {
      const task = data.task || {};
      return [title, data.src ? videoTile(data.src) : null, h("div", { class: "tfcc-node-sub", text: task.state || "-" }), h("p", { text: short(task.describe, 140) })].filter(Boolean);
    }
    if (node.type === "assetExtractionTask") {
      const task = data.task || {};
      const progress = data.progress || [];
      const latest = progress[progress.length - 1];
      return [
        title,
        h("div", { class: "tfcc-node-sub", text: `${task.state || "-"} · ${formatTime(task.startTime)}` }),
        h("p", { text: short(latest?.message || task.describe, 140) }),
      ];
    }
    return [title];
  }

  function metric(label, value) {
    return h("div", { class: "tfcc-metric" }, [h("strong", { text: String(value || 0) }), h("span", { text: label })]);
  }

  function chip(value, label) {
    return h("span", { class: "tfcc-chip" }, [h("strong", { text: String(value || 0) }), h("span", { text: label })]);
  }

  function renderCanvas() {
    const vp = viewport();
    const world = h(
      "div",
      {
        class: "tfcc-world",
        style: { transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
      },
      [
        h("svg", { class: "tfcc-edges", width: "4200", height: "2600", viewBox: "-320 -520 4200 2600" }, edgePaths()),
        h("div", { class: "tfcc-node-layer" }, graphNodes().map(renderNode).filter(Boolean)),
      ],
    );
    return h("main", { class: "tfcc-canvas", onMouseDown: beginPan, onWheel }, [
      world,
      h("div", { class: "tfcc-zoom" }, [
        h("button", { title: "缩小", onClick: () => zoomBy(-0.08), text: "−" }),
        h("span", { class: "tfcc-zoom-value", text: `${Math.round(vp.zoom * 100)}%` }),
        h("button", { title: "放大", onClick: () => zoomBy(0.08), text: "+" }),
        h("button", { class: "tfcc-zoom-fit", title: "适配视图", onClick: () => fitView(), text: "⛶" }),
      ]),
    ]);
  }

  function buildAgentNodeContext(node) {
    if (!node) return "";
    const payload = {
      view: state.view,
      nodeId: node.id,
      nodeType: node.type,
      nodeTitle: node.label,
      stale: Boolean(node.stale),
      data: node.data || {},
    };
    return `【Creative Canvas 当前节点】\n${JSON.stringify(payload, null, 2)}`;
  }

  function agentStatusText() {
    const mode = agentModeKey();
    if (mode === "overview") return "总览模式：查看项目状态、定位节点并分派到阶段任务";
    if (mode === "source") return "原文模式：查看章节导入、事件分析与后续改编入口";
    if (mode === "asset") return "资产模式已接入画布动作：提取、复核与候选图生成";
    if (mode !== "script") return "当前模式支持查看节点上下文，生成动作在右侧节点详情中触发";
    if (state.agentError) return state.agentError;
    if (state.agentConnected) return `已连接旧版 scriptAgent · ${activeScriptLabel()}`;
    if (state.agentConnecting) return "正在连接 scriptAgent...";
    return "未连接";
  }

  function loadSocketIoClient() {
    if (window.io) return Promise.resolve(window.io);
    if (window.__tfccSocketIoPromise) return window.__tfccSocketIoPromise;
    window.__tfccSocketIoPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${socketOrigin()}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => {
        if (window.io) resolve(window.io);
        else {
          window.__tfccSocketIoPromise = null;
          reject(new Error("Socket.IO client 未加载"));
        }
      };
      script.onerror = () => {
        window.__tfccSocketIoPromise = null;
        reject(new Error("Socket.IO client 加载失败"));
      };
      document.head.appendChild(script);
    });
    return window.__tfccSocketIoPromise;
  }

  async function getScriptAgentPlanData(force = false) {
    if (!force && state.agentPlanData) return state.agentPlanData;
    const data = await api("/scriptAgent/getPlanData", {
      method: "POST",
      body: { projectId: projectId(), agentType: "scriptAgent" },
    });
    state.agentPlanData = data?.data || { storySkeleton: "", adaptationStrategy: "", script: [] };
    state.agentPlanDataId = data?.id || null;
    return state.agentPlanData;
  }

  function upsertAgentMessage(message) {
    const existing = state.agentMessages.find((item) => item.id === message.id);
    if (existing) Object.assign(existing, message, { content: message.content || existing.content || [] });
    else state.agentMessages.push({ ...message, content: message.content || [] });
    persistAgentThread();
  }

  function updateAgentMessage(update) {
    const message = state.agentMessages.find((item) => item.id === update.id);
    if (!message) return;
    Object.assign(message, update);
    if (update.status === "complete" || update.status === "error" || update.status === "stop") {
      state.agentRunning = false;
      syncScriptAgentArtifacts(message.id, true).catch((err) => {
        state.agentError = err.message || String(err);
        renderAgentOnly();
      });
      syncProductionAgentArtifacts(message.id).catch((err) => {
        state.agentError = err.message || String(err);
        renderAgentOnly();
      });
    }
    persistAgentThread();
  }

  function addAgentContent(event) {
    const message = state.agentMessages.find((item) => item.id === event.messageId);
    if (!message) return;
    message.content = message.content || [];
    const content = event.content || {};
    const existing = message.content.find((item) => item.id && item.id === content.id);
    if (existing) Object.assign(existing, content);
    else message.content.push(content);
    persistAgentThread();
  }

  function mergeAgentContentData(current, next, strategy) {
    if (strategy === "append") {
      if (typeof current === "string" || typeof next === "string") return `${current || ""}${next || ""}`;
      if (Array.isArray(current) || Array.isArray(next)) return [...(Array.isArray(current) ? current : []), ...(Array.isArray(next) ? next : [])];
    }
    if (strategy === "merge" && typeof current === "object" && current && typeof next === "object" && next) return { ...current, ...next };
    return next === undefined ? current : next;
  }

  function updateAgentContent(event) {
    const message = state.agentMessages.find((item) => item.id === event.messageId);
    if (!message) return;
    message.content = message.content || [];
    let content = message.content.find((item) => item.id === event.contentId);
    if (!content) {
      content = { id: event.contentId, type: event.type || "text", data: "", status: "pending" };
      message.content.push(content);
    }
    content.type = event.type || content.type;
    content.data = mergeAgentContentData(content.data, event.data, event.strategy);
    content.status = event.status || content.status;
    persistAgentThread();
    syncScriptAgentArtifacts(message.id).catch((err) => {
      state.agentError = err.message || String(err);
    });
    syncProductionAgentArtifacts(message.id).catch((err) => {
      state.agentError = err.message || String(err);
    });
  }

  function contentText(content) {
    if (!content) return "";
    if (content.type === "text" || content.type === "markdown") return String(content.data || "");
    if (content.type === "thinking") return `${content.data?.title || "思考"}\n${content.data?.text || ""}`.trim();
    if (content.type === "toolcall") {
      const data = content.data || {};
      return [`工具：${data.toolCallName || data.toolCallId || "-"}`, data.args ? `参数：${data.args}` : "", data.result ? `结果：${data.result}` : ""].filter(Boolean).join("\n");
    }
    if (content.type === "activity") return JSON.stringify(content.data?.content || content.data || {}, null, 2);
    return typeof content.data === "string" ? content.data : JSON.stringify(content.data || {}, null, 2);
  }

  function messagePlainText(message) {
    return (message?.content || []).map(contentText).join("\n").trim();
  }

  function isTerminalAgentMessage(message) {
    return ["complete", "error", "stop"].includes(message?.status || "");
  }

  function isAgentProcessLine(line) {
    return /^(?:正在|获取|查询|读取|写入|同步|已(?:获取|查询|读取|写入|同步)).*(?:\.\.\.|…|完成|失败|数据|内容|事件|工作区)$/.test(String(line || "").trim());
  }

  function stripCompletedAgentProcessText(text) {
    const lines = String(text || "").split("\n");
    let end = lines.length;
    while (end > 0 && !lines[end - 1].trim()) end -= 1;
    let cut = end;
    while (cut > 0 && isAgentProcessLine(lines[cut - 1])) cut -= 1;
    return cut < end ? lines.slice(0, cut).join("\n").trim() : String(text || "").trim();
  }

  function agentDisplayContentText(content, message) {
    if (content?.type === "thinking" && content.status === "complete") return "";
    const text = contentText(content);
    if ((isTerminalAgentMessage(message) || content?.status === "complete") && (content?.type === "text" || content?.type === "markdown")) {
      return stripCompletedAgentProcessText(text);
    }
    return text;
  }

  function agentDisplayText(message) {
    return (message?.content || []).map((content) => agentDisplayContentText(content, message)).filter(Boolean).join("\n").trim();
  }

  function pushLocalAgentMessage(role, text, status = "complete", name) {
    state.agentMessages.push({
      id: `local-${role}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`,
      role,
      name,
      status,
      datetime: new Date().toISOString(),
      content: [{ type: "text", id: `local-content:${Date.now()}`, data: text, status }],
    });
    state.agentStickToOutput = true;
    persistAgentThread();
  }

  function parseScriptAgentArtifacts(text) {
    const result = { storySkeleton: null, adaptationStrategy: null, scripts: [] };
    const skeleton = text.match(/<storySkeleton>([\s\S]*?)<\/storySkeleton>/);
    if (skeleton) result.storySkeleton = skeleton[1].trim();
    const adaptation = text.match(/<adaptationStrategy>([\s\S]*?)<\/adaptationStrategy>/);
    if (adaptation) result.adaptationStrategy = adaptation[1].trim();
    const scriptRe = /<scriptItem\b([^>]*)>([\s\S]*?)<\/scriptItem>/g;
    let match;
    while ((match = scriptRe.exec(text))) {
      const attrs = match[1] || "";
      const name = (attrs.match(/\bname=["']([^"']+)["']/) || [])[1] || `剧本 ${result.scripts.length + 1}`;
      result.scripts.push({ name: name.trim(), content: match[2].trim() });
    }
    return result;
  }

  function parseProductionAgentArtifacts(text) {
    const result = { scriptPlan: null, storyboardTable: null };
    const scriptPlan = text.match(/<scriptPlan>([\s\S]*?)<\/scriptPlan>/);
    if (scriptPlan) result.scriptPlan = scriptPlan[1].trim();
    const storyboardTable = text.match(/<storyboardTable>([\s\S]*?)<\/storyboardTable>/);
    if (storyboardTable) result.storyboardTable = storyboardTable[1].trim();
    return result;
  }

  function scriptArtifactIssue(text) {
    const opens = [...String(text || "").matchAll(/<scriptItem\b([^>]*)>/g)];
    const closes = String(text || "").match(/<\/scriptItem>/g) || [];
    if (opens.length <= closes.length) return "";
    const attrs = opens[opens.length - 1]?.[1] || "";
    const name = (attrs.match(/\bname=["']([^"']+)["']/) || [])[1] || "当前剧本";
    return `${name} 生成未完成，缺少 </scriptItem>，未写入剧本卡片。请重新生成该集。`;
  }

  function markIncompleteAgentMessage(message, reason) {
    if (!message || message.role === "user") return false;
    const issue = scriptArtifactIssue(messagePlainText(message));
    if (!issue) return false;
    message.status = "error";
    const text = `${reason ? `${reason}：` : ""}${issue}`;
    if (!(message.content || []).some((item) => item.id === "script-artifact-incomplete-warning")) {
      message.content = message.content || [];
      message.content.push({ id: "script-artifact-incomplete-warning", type: "text", data: `\n\n> ${text}`, status: "error" });
    }
    state.agentError = text;
    return true;
  }

  function markStaleAgentArtifacts(reason) {
    const changed = state.agentMessages.some((message) => markIncompleteAgentMessage(message, reason));
    if (changed) persistAgentThread();
    return changed;
  }

  async function syncScriptAgentArtifacts(messageId, final = false) {
    const message = state.agentMessages.find((item) => item.id === messageId);
    if (final && markIncompleteAgentMessage(message, "生成异常")) {
      persistAgentThread();
      return;
    }
    const parsed = parseScriptAgentArtifacts(messagePlainText(message));
    if (!parsed.storySkeleton && !parsed.adaptationStrategy && !parsed.scripts.length) return;
    const fingerprint = JSON.stringify(parsed);
    if (state.syncedAgentMessages[messageId] === fingerprint) return;

    const current = await getScriptAgentPlanData(true);
    const next = {
      storySkeleton: current.storySkeleton || "",
      adaptationStrategy: current.adaptationStrategy || "",
      script: Array.isArray(current.script) ? [...current.script] : [],
    };
    if (parsed.storySkeleton) next.storySkeleton = parsed.storySkeleton;
    if (parsed.adaptationStrategy) next.adaptationStrategy = parsed.adaptationStrategy;
    parsed.scripts.forEach((script) => {
      const index = next.script.findIndex((item) => item.name === script.name || item.id === script.id);
      if (index >= 0) next.script[index] = { ...next.script[index], ...script };
      else next.script.push(script);
    });

    await api("/scriptAgent/setPlanData", {
      method: "POST",
      body: { projectId: projectId(), agentType: "scriptAgent", data: next },
    });
    state.syncedAgentMessages[messageId] = fingerprint;
    state.agentPlanData = next;
    state.message = "剧本 Agent 已写入工作区，画布已刷新";
    await loadGraph();
    render();
  }

  async function syncProductionAgentArtifacts(messageId) {
    if (!state.agentSocketKey || !state.agentSocketKey.startsWith("productionAgent:")) return;
    const productionContext = state.agentSocket?.__tfccProductionContext;
    if (!productionContext?.projectId || !productionContext?.scriptId) return;
    const message = state.agentMessages.find((item) => item.id === messageId);
    const parsed = parseProductionAgentArtifacts(messagePlainText(message));
    if (!parsed.scriptPlan && !parsed.storyboardTable) return;
    const fingerprint = JSON.stringify(parsed);
    const syncKey = `production:${messageId}`;
    if (state.syncedAgentMessages[syncKey] === fingerprint) return;

    const current = await getProductionFlowData(productionContext);
    const next = {
      script: current?.script || "",
      scriptPlan: current?.scriptPlan || "",
      assets: Array.isArray(current?.assets) ? current.assets : [],
      storyboardTable: current?.storyboardTable || "",
      storyboard: Array.isArray(current?.storyboard) ? current.storyboard : [],
    };
    if (parsed.scriptPlan) next.scriptPlan = parsed.scriptPlan;
    if (parsed.storyboardTable) next.storyboardTable = parsed.storyboardTable;

    await saveProductionFlowData(next, productionContext);
    state.syncedAgentMessages[syncKey] = fingerprint;
    state.message = "分镜 Agent 已写入生产工作区，画布已刷新";
    await loadGraph();
    render();
  }

  async function ensureScriptAgentSocket() {
    if (agentModeKey() !== "script") return null;
    const pid = projectId();
    if (!pid) throw new Error("缺少 projectId，无法连接剧本 Agent");
    const sid = scriptId();
    const socketKey = `scriptAgent:${pid}:${sid || "project"}`;
    if (state.agentSocket && state.agentSocketKey === socketKey) return state.agentSocket;
    if (state.agentSocket) state.agentSocket.disconnect();

    state.agentConnecting = true;
    state.agentConnected = false;
    state.agentError = "";
    renderAgentOnly();

    await getScriptAgentPlanData(true);
    await loadSocketIoClient();
    const token = await getAuthToken();
    const socket = window.io(`${socketOrigin()}/api/socket/scriptAgent`, {
      auth: { token, isolationKey: `${pid}:scriptAgent${sid ? `:${sid}` : ""}`, threadKey: state.agentThreadKey, projectId: pid, scriptId: sid },
      transports: ["websocket", "polling"],
    });
    state.agentSocket = socket;
    state.agentSocketKey = socketKey;

    socket.on("connect", () => {
      state.agentConnecting = false;
      state.agentConnected = true;
      state.agentError = "";
      renderAgentOnly();
      loadAgentThreadFromServer(state.agentThreadKey, true).catch((err) => {
        state.agentError = err?.message || String(err);
        renderAgentOnly();
      });
    });
    socket.on("disconnect", () => {
      state.agentConnected = false;
      state.agentConnecting = state.agentRunning;
      renderAgentOnly();
    });
    socket.on("connect_error", (err) => {
      state.agentConnecting = false;
      state.agentConnected = false;
      state.agentError = `scriptAgent 连接失败：${err.message || err}`;
      renderAgentOnly();
    });
    socket.on("message", (message) => {
      upsertAgentMessage(message);
      state.agentRunning = true;
      renderAgentOnly(true);
    });
    socket.on("message:update", (update) => {
      updateAgentMessage(update);
      renderAgentOnly(true);
    });
    socket.on("content:add", (event) => {
      addAgentContent(event);
      renderAgentOnly(true);
    });
    socket.on("content:update", (event) => {
      updateAgentContent(event);
      renderAgentOnly(true);
    });
    socket.on("getPlanData", async (_payload, callback) => {
      try {
        const data = await getScriptAgentPlanData(true);
        callback?.(data);
      } catch (err) {
        callback?.({ storySkeleton: "", adaptationStrategy: "", script: [], error: err.message || String(err) });
      }
    });
    return socket;
  }

  function usesProductionAgentForMode(mode = agentModeKey()) {
    return mode === "storyboard";
  }

  function productionAgentContext() {
    const pid = projectId();
    const sid = scriptId();
    if (!pid) throw new Error("缺少 projectId，无法连接生产 Agent");
    if (!sid) throw new Error("请先选择要处理的剧集，再进行分镜分析。");
    return { projectId: Number(pid), scriptId: Number(sid) };
  }

  async function getProductionFlowData(context) {
    const { projectId: pid, scriptId: sid } = context || productionAgentContext();
    return api("/production/getFlowData", {
      method: "POST",
      body: { projectId: pid, episodesId: sid },
    });
  }

  async function saveProductionFlowData(data, context) {
    const { projectId: pid, scriptId: sid } = context || productionAgentContext();
    return api("/production/saveFlowData", {
      method: "POST",
      body: { projectId: pid, episodesId: sid, data },
    });
  }

  function normalizeNumberArray(value) {
    if (Array.isArray(value)) return value.map(Number).filter((item) => Number.isFinite(item));
    if (typeof value === "string") {
      const text = value.trim();
      if (!text) return [];
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return normalizeNumberArray(parsed);
      } catch {}
      return text.split(/[,\s，、]+/).map(Number).filter((item) => Number.isFinite(item));
    }
    const number = Number(value);
    return Number.isFinite(number) ? [number] : [];
  }

  function normalizeStoryboardToolItem(raw = {}) {
    const duration = Number(raw.duration || raw.seconds || 3);
    const src = raw.src || raw.image || null;
    const prompt = String(raw.prompt || raw.videoDesc || raw.desc || "").trim() || "待补充分镜图片提示词";
    const videoDesc = String(raw.videoDesc || raw.desc || raw.prompt || "").trim() || prompt;
    const shouldGenerateImage = typeof raw.shouldGenerateImage === "string"
      ? (/^(?:true|1|yes|y|是|需要|生成)$/i.test(raw.shouldGenerateImage.trim()) ? 1 : 0)
      : Number(raw.shouldGenerateImage || 0) ? 1 : 0;
    return {
      prompt,
      duration: Number.isFinite(duration) && duration > 0 ? duration : 3,
      track: String(raw.track || raw.group || "主轨道").trim() || "主轨道",
      state: raw.state || (src ? "已完成" : "未生成"),
      src,
      videoDesc,
      shouldGenerateImage,
      associateAssetsIds: normalizeNumberArray(raw.associateAssetsIds || raw.assetsIds || raw.assetIds),
    };
  }

  async function addStoryboardFromProductionTool(raw, context) {
    const { projectId: pid, scriptId: sid } = context || productionAgentContext();
    const data = [normalizeStoryboardToolItem(raw)];
    const result = await api("/production/storyboard/batchAddStoryboardInfo", {
      method: "POST",
      body: { projectId: pid, scriptId: sid, data },
    });
    await loadGraph();
    render();
    return result;
  }

  async function generateStoryboardFromProductionTool(raw = {}, context) {
    const { projectId: pid, scriptId: sid } = context || productionAgentContext();
    const ids = normalizeNumberArray(raw.ids || raw.storyboardIds || raw.id);
    if (!ids.length) throw new Error("缺少要生成图片的分镜 ID");
    const result = await api("/production/storyboard/batchGenerateImage", {
      method: "POST",
      body: {
        storyboardIds: ids,
        projectId: pid,
        scriptId: sid,
        concurrentCount: 1,
        compulsory: Boolean(raw.compulsory),
      },
    });
    await loadGraph();
    render();
    return result;
  }

  function callbackSuccess(callback, data) {
    callback?.(data === undefined ? { success: true } : data);
  }

  function callbackError(callback, err) {
    callback?.({ error: err?.message || String(err) });
  }

  async function ensureProductionAgentSocket() {
    const mode = agentModeKey();
    if (!usesProductionAgentForMode(mode)) return null;
    const { projectId: pid, scriptId: sid } = productionAgentContext();
    const productionContext = { projectId: pid, scriptId: sid };
    const socketKey = `productionAgent:${pid}:${sid}:${mode}`;
    if (state.agentSocket && state.agentSocketKey === socketKey) return state.agentSocket;
    if (state.agentSocket) state.agentSocket.disconnect();

    state.agentConnecting = true;
    state.agentConnected = false;
    state.agentError = "";
    renderAgentOnly();

    await loadSocketIoClient();
    const token = await getAuthToken();
    const socket = window.io(`${socketOrigin()}/api/socket/productionAgent`, {
      auth: { token, isolationKey: `${pid}:productionAgent:${mode}:${sid}`, projectId: pid, scriptId: sid },
      transports: ["websocket", "polling"],
    });
    state.agentSocket = socket;
    state.agentSocketKey = socketKey;
    socket.__tfccProductionContext = productionContext;

    socket.on("connect", () => {
      state.agentConnecting = false;
      state.agentConnected = true;
      state.agentError = "";
      renderAgentOnly();
      loadAgentThreadFromServer(state.agentThreadKey, true).catch((err) => {
        state.agentError = err?.message || String(err);
        renderAgentOnly();
      });
    });
    socket.on("disconnect", () => {
      state.agentConnected = false;
      state.agentConnecting = state.agentRunning;
      renderAgentOnly();
    });
    socket.on("connect_error", (err) => {
      state.agentConnecting = false;
      state.agentConnected = false;
      state.agentError = `productionAgent 连接失败：${err.message || err}`;
      renderAgentOnly();
    });
    socket.on("message", (message) => {
      upsertAgentMessage(message);
      state.agentRunning = true;
      renderAgentOnly(true);
    });
    socket.on("message:update", (update) => {
      updateAgentMessage(update);
      renderAgentOnly(true);
    });
    socket.on("content:add", (event) => {
      addAgentContent(event);
      renderAgentOnly(true);
    });
    socket.on("content:update", (event) => {
      updateAgentContent(event);
      renderAgentOnly(true);
    });
    socket.on("getFlowData", async (_payload, callback) => {
      try {
        callbackSuccess(callback, await getProductionFlowData(productionContext));
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("saveFlowData", async (payload, callback) => {
      try {
        callbackSuccess(callback, await saveProductionFlowData(payload?.data || payload, productionContext));
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("addStoryboard", async (payload, callback) => {
      try {
        callbackSuccess(callback, await addStoryboardFromProductionTool(payload, productionContext));
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("generateStoryboard", async (payload, callback) => {
      try {
        callbackSuccess(callback, await generateStoryboardFromProductionTool(payload, productionContext));
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("addDeriveAsset", async (payload, callback) => {
      try {
        await loadGraph();
        render();
        callbackSuccess(callback, payload || { success: true });
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("delDeriveAsset", async (payload, callback) => {
      try {
        await loadGraph();
        render();
        callbackSuccess(callback, payload || { success: true });
      } catch (err) {
        callbackError(callback, err);
      }
    });
    socket.on("generateDeriveAsset", async (payload, callback) => {
      try {
        await loadGraph();
        render();
        callbackSuccess(callback, payload || { success: true });
      } catch (err) {
        callbackError(callback, err);
      }
    });
    return socket;
  }

  function lockAgentContext() {
    const node = selectedNode();
    const profile = agentProfile();
    state.lockedAgentContext = buildAgentNodeContext(node);
    if (state.agentThreadKey) state.agentLocks[state.agentThreadKey] = state.lockedAgentContext;
    persistAgentThread();
    markMessage(node ? `${profile.title} 已锁定：${node.label}` : "");
  }

  function isStatusQuestion(text) {
    return /是否|是不是|有没有|都.*(?:生成|完成)|(?:生成|完成).*吗|(?:生成|完成)了?(?:几个|几条|多少)|(?:几个|几条|多少|哪些|数量).*?(?:视频|结果)|状态|进度|完整|缺|还差|未生成|未完成/.test(text);
  }

  function isAssetStatusQuestion(text) {
    const value = String(text || "");
    if (isStatusQuestion(value)) return true;
    if (/(?:资产|角色|场景|道具).*(?:如何了|怎么样|咋样|什么情况|进展)|(?:如何了|怎么样|咋样|什么情况|进展).*(?:资产|角色|场景|道具)/.test(value)) return true;
    if (/生成|重生|重新|补齐|执行|提交|提取|抽取|修改|改成|改为|出图|生图/.test(value)) return false;
    return /(?:资产|角色|场景|道具).*(?:如何|怎样|怎么样|咋样|什么情况|进展)|(?:如何|怎样|怎么样|咋样|什么情况|进展).*(?:资产|角色|场景|道具)/.test(value);
  }

  function agentMentionTrigger(value, caret) {
    const before = String(value || "").slice(0, caret ?? String(value || "").length);
    const match = before.match(/@[\u4e00-\u9fa5\w]*$/);
    if (!match) return null;
    return { query: match[0].slice(1), at: before.length - match[0].length, end: before.length };
  }

  function agentNodeToken(node) {
    return `@${String(node?.label || node?.id || "").replace(/\s+/g, "")}`;
  }

  function agentNodeImage(node) {
    const data = node?.data || {};
    return data.thumbnail || data.poster || data.image || data.thumbnails?.[0] || "";
  }

  function agentVisibleNodes() {
    const visible = visibleNodeIds();
    return graphNodes().filter((node) => visible.has(node.id) && node.type !== "project");
  }

  function agentMentionItems(query = "", limit = 12) {
    const q = String(query || "").trim().toLowerCase();
    return agentVisibleNodes()
      .map((node) => ({
        token: agentNodeToken(node),
        label: node.label || node.id,
        type: node.type,
        image: agentNodeImage(node),
        node,
      }))
      .filter((item) => !q || `${item.token} ${item.label} ${item.type}`.toLowerCase().includes(q))
      .slice(0, limit);
  }

  function agentMentionTargets(text) {
    const seen = new Set();
    return agentMentionItems("", Number.MAX_SAFE_INTEGER)
      .filter((item) => String(text || "").includes(item.token))
      .map((item) => item.node)
      .filter((node) => {
        if (!node || seen.has(node.id)) return false;
        seen.add(node.id);
        return true;
      });
  }

  function linkedCanvasNodes(sourceNode, type) {
    const nodeMap = new Map(graphNodes().map((node) => [node.id, node]));
    return graphEdges()
      .filter((edge) => edge.source === sourceNode?.id)
      .map((edge) => nodeMap.get(edge.target))
      .filter((node) => node && (!type || node.type === type));
  }

  function videoPromptTargets(nodes) {
    const out = [];
    nodes.forEach((node) => {
      if (node.type === "videoPrompt") out.push(node);
      if (node.type === "storyboard") out.push(...linkedCanvasNodes(node, "videoPrompt"));
    });
    return uniqueLayoutNodes(out);
  }

  function nodeStatusText(node) {
    if (node?.stale) return "需复核";
    const raw = node?.status || node?.data?.storyboard?.state || node?.data?.videoTrack?.state || node?.data?.video?.state || "current";
    const labels = {
      complete: "已完成",
      current: "当前",
      pending: "等待中",
      running: "执行中",
      failed: "失败",
    };
    return labels[raw] || raw;
  }

  function nodeStatusDone(node) {
    return /已完成|生成成功|成功/.test(nodeStatusText(node)) && !node?.stale;
  }

  function isVideoCountQuestion(text) {
    return /(?:生成|完成)了?(?:几个|几条|多少)|(?:几个|几条|多少|哪些|数量).*?(?:视频|结果)/.test(text);
  }

  function linkedVideoNodes(nodes) {
    const videos = [];
    nodes.forEach((node) => {
      if (node.type === "video") videos.push(node);
      if (node.type === "videoPrompt") videos.push(...linkedCanvasNodes(node, "video"));
      if (node.type === "storyboard") videoPromptTargets([node]).forEach((prompt) => videos.push(...linkedCanvasNodes(prompt, "video")));
    });
    return uniqueLayoutNodes(videos);
  }

  function selectedTrackVideoId(track) {
    const value = Number(track?.videoId || track?.selectVideoId);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function videoWorkflowSnapshot() {
    const prompts = orderedLayoutNodes(graphNodes().filter((node) => node.type === "videoPrompt"));
    const videos = graphNodes().filter((node) => node.type === "video");
    const tasks = (state.graph?.tasks || []).filter((task) => /视频生成/.test(String(task.taskClass || "")) || taskRelatedData(task).videoId);
    const promptRows = prompts.map((node) => {
      const track = node.data?.videoTrack || {};
      const linkedVideos = linkedCanvasNodes(node, "video");
      const selectedId = selectedTrackVideoId(track);
      const successfulVideos = linkedVideos.filter((video) => /生成成功|已完成|成功/.test(nodeStatusText(video)));
      return { node, track, linkedVideos, selectedId, successfulVideos };
    });
    return {
      prompts,
      videos,
      tasks,
      promptRows,
      reviewWarnings: videos.filter((node) => ["failed", "warning"].includes(String(node.data?.review?.status || ""))),
      missingPrompts: promptRows.filter((row) => !String(row.track.prompt || "").trim()),
      missingVideos: promptRows.filter((row) => !row.linkedVideos.length),
      missingSelected: promptRows.filter((row) => row.successfulVideos.length && !row.selectedId),
      readyRows: promptRows.filter((row) => row.selectedId),
    };
  }

  function videoStatusAnswer(text) {
    const value = String(text || "");
    if (!isStatusQuestion(value) && !/(?:视频|成片|合成|拼接).*(?:如何|怎样|怎么样|咋样|什么情况|进展)|(?:如何|怎样|怎么样|咋样|什么情况|进展).*(?:视频|成片|合成|拼接)/.test(value)) return "";
    const snapshot = videoWorkflowSnapshot();
    const successVideos = snapshot.videos.filter((node) => /生成成功|已完成|成功/.test(nodeStatusText(node)));
    const failedVideos = snapshot.videos.filter((node) => /失败|生成失败/.test(nodeStatusText(node)));
    const runningTasks = snapshot.tasks.filter((task) => /进行中|生成中|running|pending/i.test(String(task.state || "")));
    const warningTasks = snapshot.tasks.filter((task) => taskProgressFor(task.id).some((item) => item.status === "warning"));
    const latestLines = runningTasks.slice(0, 3).map((task) => {
      const latest = taskProgressFor(task.id).slice(-1)[0];
      return `- 任务 #${task.id}：${latest?.message || task.state || "进行中"}`;
    });
    const blockers = [
      snapshot.missingPrompts.length ? `${snapshot.missingPrompts.length} 条视频 Prompt 缺提示词` : "",
      snapshot.missingVideos.length ? `${snapshot.missingVideos.length} 条 Prompt 还没有视频结果` : "",
      snapshot.missingSelected.length ? `${snapshot.missingSelected.length} 条已有成功视频但未选片` : "",
      failedVideos.length ? `${failedVideos.length} 个视频失败` : "",
      snapshot.reviewWarnings.length ? `${snapshot.reviewWarnings.length} 个视频 QA 需复核` : "",
      warningTasks.length ? `${warningTasks.length} 个视频任务有质检警告` : "",
    ].filter(Boolean);
    const canCompose = snapshot.prompts.length > 0 && snapshot.readyRows.length === snapshot.prompts.length;
    return [
      `当前「${activeScriptLabel()}」视频阶段：${snapshot.prompts.length} 条视频 Prompt，${successVideos.length}/${snapshot.prompts.length || 0} 条已有成功视频，${snapshot.readyRows.length}/${snapshot.prompts.length || 0} 条已选片。`,
      runningTasks.length ? `进行中任务：${runningTasks.length} 个` : "当前没有进行中的视频生成任务。",
      latestLines.length ? latestLines.join("\n") : "",
      blockers.length ? `缺口：${blockers.join("；")}。` : "缺口：暂无。",
      canCompose ? "下一步：可以提交单镜头合成或整集拼接。" : "下一步：先补齐缺口，再合成。",
    ].filter(Boolean).join("\n");
  }

  function shotNumbersInText(text) {
    const nums = [];
    String(text || "").replace(/(?:镜头|第)\s*(\d+)/g, (_, raw) => {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) nums.push(n);
      return "";
    });
    return [...new Set(nums)];
  }

  function videoPromptTargetsByShotNumber(text) {
    const nums = shotNumbersInText(text);
    if (!nums.length) return [];
    const storyboards = orderedLayoutNodes(graphNodes().filter((node) => node.type === "storyboard"));
    return uniqueLayoutNodes(nums.flatMap((num) => {
      const storyboard = storyboards.find((node) => Number(node.data?.storyboard?.index) === num) || storyboards[num - 1];
      return storyboard ? videoPromptTargets([storyboard]) : [];
    }));
  }

  function wantsVideoPromptRegeneration(text) {
    const value = String(text || "");
    return /(视频\s*Prompt|视频prompt|video\s*prompt|提示词|prompt)/i.test(value) && /生成|重生|重新|刷新|补齐|执行/.test(value);
  }

  function wantsVideoGeneration(text) {
    const value = String(text || "");
    if (wantsVideoPromptRegeneration(value)) return false;
    return (/视频|成片|渲染/.test(value) || shotNumbersInText(value).length > 0) && /生成|执行|提交|开始/.test(value) && !isStatusQuestion(value);
  }

  function wantsVideoCompose(text) {
    const value = String(text || "");
    return /合成|拼接|整集|导出/.test(value) && !/(视频\s*Prompt|视频prompt|video\s*prompt|提示词|prompt)/i.test(value) && !isStatusQuestion(value);
  }

  function agentTargetStatusAnswer(text, targets) {
    if (!isStatusQuestion(text) || !targets.length) return "";
    if (isVideoCountQuestion(text)) {
      const prompts = videoPromptTargets(targets);
      const videos = linkedVideoNodes(targets);
      const names = videos.slice(0, 8).map((node) => node.label).join("、");
      return [
        `已关联 ${prompts.length} 条视频 Prompt，生成 ${videos.length} 个视频。`,
        names ? `视频：${names}${videos.length > 8 ? "…" : ""}` : "当前还没有关联视频结果。",
      ].join("\n");
    }
    const related = uniqueLayoutNodes(targets.flatMap((node) => {
      if (node.type === "storyboard") {
        const prompts = linkedCanvasNodes(node, "videoPrompt");
        const videos = prompts.flatMap((prompt) => linkedCanvasNodes(prompt, "video"));
        return [node, ...prompts, ...videos];
      }
      if (node.type === "videoPrompt") return [node, ...linkedCanvasNodes(node, "video")];
      return [node];
    }));
    const lines = related.slice(0, 8).map((node) => `- ${node.label}：${nodeStatusText(node)}`);
    const prefix = related.every(nodeStatusDone) ? "完整，关联节点均已完成。" : "还不完整，当前状态如下：";
    return [prefix, ...lines, related.length > 8 ? `- 另有 ${related.length - 8} 个关联节点未展开显示` : ""].filter(Boolean).join("\n");
  }

  function assetStatusAnswer(text) {
    if (!isAssetStatusQuestion(text)) return "";
    const groups = graphNodes().filter((node) => node.type === "assetGroup");
    const assets = groups.flatMap((group) => group.data?.items || []);
    const { assetCount, meta } = currentScriptAssetMeta();
    const withImages = assets.filter((asset) => (asset.images || []).length);
    const selectedImages = assets.filter((asset) => (asset.images || []).some((image) => image.selected));
    const needsReview = groups.filter((group) => group.stale || group.status === "需复核");
    const groupLines = groups.map((group) => `- ${group.label}：${group.data?.count || 0} 个，${nodeStatusText(group)}`);
    return [
      `当前「${activeScriptLabel()}」资产完整度：${meta.statusText || (assetCount ? "已提取" : "待提取")}。`,
      `已关联 ${assetCount} 个资产；${withImages.length}/${assets.length} 个已有候选图，${selectedImages.length}/${assets.length} 个已选中资产图。`,
      meta.detail ? `提取结果：${meta.detail}` : "",
      groupLines.length ? groupLines.join("\n") : "当前还没有角色/场景/道具资产组。",
      needsReview.length ? `需要复核：${needsReview.map((group) => group.label).join("、")}` : "",
    ].filter(Boolean).join("\n");
  }

  function agentIntentNodeSummary(node) {
    const data = node?.data || {};
    const text = data.prompt || data.text || data.description || data.asset?.prompt || data.asset?.describe || data.storyboard?.prompt || data.videoTrack?.prompt || "";
    return {
      id: node.id,
      label: node.label || node.id,
      type: node.type,
      token: agentNodeToken(node),
      status: nodeStatusText(node),
      summary: String(text || "").replace(/\s+/g, " ").trim().slice(0, 180),
    };
  }

  async function resolveAgentIntent(text, mentionedNodes, selected) {
    const visibleNodes = agentVisibleNodes();
    if (!visibleNodes.length) return null;
    try {
      const intent = await api("/creativeCanvas/resolveIntent", {
        method: "POST",
        body: {
          mode: agentModeKey(),
          text,
          selectedNodeId: selected?.id || null,
          mentionedNodeIds: mentionedNodes.map((node) => node.id),
          nodes: visibleNodes.map(agentIntentNodeSummary).slice(0, 80),
        },
      });
      if (!intent || intent.action === "unknown" || Number(intent.confidence || 0) < 0.62) return null;
      return intent;
    } catch {
      return null;
    }
  }

  function agentIntentTargets(intent, fallbackNodes = []) {
    const visibleMap = new Map(agentVisibleNodes().map((node) => [node.id, node]));
    const targets = Array.isArray(intent?.targetIds)
      ? intent.targetIds.map((id) => visibleMap.get(id)).filter(Boolean)
      : [];
    return uniqueLayoutNodes(targets.length ? targets : fallbackNodes.filter(Boolean));
  }

  async function handleAgentIntent(intent, profile, fallbackNodes = []) {
    const targets = agentIntentTargets(intent, fallbackNodes);
    if (intent.action === "query_status") {
      const answer = agentTargetStatusAnswer("状态", targets);
      if (!answer) return false;
      pushLocalAgentMessage("assistant", answer, "complete", profile.title);
      return true;
    }
    if (intent.action === "query_video_count") {
      const answer = agentTargetStatusAnswer("生成了几个视频", targets);
      if (!answer) return false;
      pushLocalAgentMessage("assistant", answer, "complete", profile.title);
      return true;
    }
    if (intent.action === "focus_node") {
      if (!targets.length) return false;
      focusCanvasNode(targets[0].id);
      pushLocalAgentMessage("assistant", `已定位到「${targets[0].label}」。`, "complete", profile.title);
      return true;
    }
    if (intent.action === "regenerate_asset_image") {
      const assetNode = targets.find((node) => node.type === "asset");
      if (!assetNode) return false;
      await runNodeAction("assetImage", assetNode);
      pushLocalAgentMessage("assistant", `已根据资产「${assetNode.label}」提交候选图生成任务。`, "complete", profile.title);
      return true;
    }
    if (intent.action === "generate_storyboard_image") {
      const storyboards = targets.filter((node) => node.type === "storyboard");
      if (!storyboards.length) return false;
      await submitStoryboardImages(storyboards);
      pushLocalAgentMessage("assistant", `已提交 ${storyboards.length} 个分镜图生成任务。`, "complete", profile.title);
      return true;
    }
    if (intent.action === "regenerate_video_prompt") {
      const prompts = videoPromptTargets(targets);
      if (!prompts.length) return false;
      await submitVideoPrompts(prompts);
      pushLocalAgentMessage("assistant", `已提交 ${prompts.length} 条视频 Prompt 重生任务。`, "complete", profile.title);
      return true;
    }
    return false;
  }

  function syncAgentMentionMenu() {
    document.querySelectorAll(".tfcc-mention-menu.is-agent").forEach((el) => el.remove());
    const menu = renderAgentMentionPicker();
    if (menu) document.body.appendChild(menu);
  }

  function handleAgentComposerInput(el) {
    state.agentText = el.value;
    if (state.agentThreadKey) state.agentDrafts[state.agentThreadKey] = state.agentText;
    scheduleSaveAgentThread();
    const sendBtn = document.querySelector(".tfcc-chat-send:not(.is-stop)");
    if (sendBtn && !state.agentRunning) sendBtn.disabled = !state.agentText.trim();
    const trigger = agentMentionTrigger(state.agentText, el.selectionStart);
    if (!trigger || agentModeKey() === "script") {
      state.agentMentionPicker = null;
      syncAgentMentionMenu();
      return;
    }
    const rect = el.getBoundingClientRect();
    state.agentMentionPicker = {
      ...trigger,
      items: agentMentionItems(trigger.query),
      x: rect.left + 8,
      y: Math.max(12, rect.top - 236),
    };
    syncAgentMentionMenu();
  }

  function insertAgentMention(item, event) {
    event.preventDefault();
    event.stopPropagation();
    const picker = state.agentMentionPicker;
    const current = state.agentText || "";
    const token = item?.token || "";
    if (!picker || !token) return;
    const next = `${current.slice(0, picker.at)}${token} ${current.slice(picker.end)}`;
    state.agentText = next;
    state.agentMentionPicker = null;
    if (state.agentThreadKey) state.agentDrafts[state.agentThreadKey] = state.agentText;
    scheduleSaveAgentThread();
    syncAgentMentionMenu();
    const input = document.querySelector(".tfcc-chat-input");
    if (input) {
      const caret = picker.at + token.length + 1;
      input.value = next;
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function renderAgentMentionPicker() {
    const picker = state.agentMentionPicker;
    if (!picker) return null;
    const items = picker.items || [];
    return h("div", {
      class: "tfcc-mention-menu is-agent",
      style: { left: `${picker.x || 12}px`, top: `${picker.y || 12}px` },
      onMouseDown: (event) => event.stopPropagation(),
    }, items.length
      ? items.map((item) => h("button", { onMouseDown: (event) => insertAgentMention(item, event) }, [
          item.image ? h("img", { src: item.image, loading: "lazy", alt: "" }) : null,
          h("span", { text: `${item.token} ${item.label}`.trim() }),
        ].filter(Boolean)))
      : [h("div", { class: "tfcc-mention-empty", text: "没有匹配的画布元素" })]);
  }

  function storyboardStatusAnswer(text) {
    if (!isStatusQuestion(text)) return "";
    const storyboards = graphNodes().filter((node) => node.type === "storyboard");
    if (!storyboards.length) return `当前剧集还没有分镜节点。`;
    const done = storyboards.filter((node) => node.status === "已完成" && !node.stale);
    const running = storyboards.filter((node) => node.status === "生成中");
    const review = storyboards.filter((node) => node.stale || node.status === "需复核");
    const pending = storyboards.filter((node) => !done.includes(node) && !running.includes(node) && !review.includes(node));
    if (done.length === storyboards.length) return `是，当前剧集 ${storyboards.length} 个分镜都已生成完成。`;
    const pendingLabels = pending.concat(review).slice(0, 5).map((node) => node.label).join("、");
    return [
      `还没有全部完成：共 ${storyboards.length} 个分镜，已完成 ${done.length}，生成中 ${running.length}，需复核 ${review.length}，待补齐 ${pending.length}。`,
      pendingLabels ? `需要关注：${pendingLabels}${pending.length + review.length > 5 ? "…" : ""}` : "",
    ].filter(Boolean).join("\n");
  }

  function isOverviewQuestion(text) {
    return isStatusQuestion(text) || /下一步|瓶颈|风险|阶段|优先|该.*做|现在.*做什么|卡在哪里/.test(text);
  }

  function progressStageLabel(item) {
    const labels = {
      source: "原文管理",
      event: "原文管理",
      script: "剧本",
      projectScript: "剧本",
      asset: "角色/场景/道具",
      projectAsset: "角色/场景/道具",
      analysis: "分镜",
      storyboard: "分镜",
      projectStoryboard: "分镜",
      videoPrompt: "视频",
      video: "视频",
      projectVideo: "视频",
      stale: "审计",
      projectStale: "审计",
    };
    return labels[item?.id] || "总览";
  }

  function progressStageView(item) {
    const views = {
      source: "source",
      event: "source",
      script: "script",
      projectScript: "script",
      asset: "asset",
      projectAsset: "asset",
      analysis: "storyboard",
      storyboard: "storyboard",
      projectStoryboard: "storyboard",
      videoPrompt: "video",
      video: "video",
      projectVideo: "video",
      stale: "audit",
      projectStale: "audit",
    };
    return views[item?.id] || "overview";
  }

  function nextProgressBlocker() {
    const scriptContext = hasCurrentScriptContext();
    const items = scriptContext ? currentEpisodeProgressItems() : currentProjectProgressItems();
    return items.find((item) => ["error", "stale", "warning", "missing", "running"].includes(item.key)) || null;
  }

  function wantsNextStage(text) {
    const value = String(text || "");
    return /下一阶段|下一步|进入下一|进入下个|切到下一|转到下一|继续推进|往后推进|推进到下/.test(value);
  }

  async function enterNextStageFromAgent(profile) {
    const next = nextProgressBlocker();
    if (!next) {
      await switchView("audit");
      state.message = "当前剧集主流程已完成，已进入审计复核。";
      pushLocalAgentMessage("assistant", "当前剧集主流程已完成，已切到「审计」做发布前复核。", "complete", agentProfile().title);
      render();
      return true;
    }
    const targetView = progressStageView(next);
    const targetLabel = progressStageLabel(next);
    await switchView(targetView);
    const targetNode = graphNodes().find((node) => node.id === next.targetNodeId);
    if (targetNode && (nodeCategory(targetNode) === targetView || visibleNodeIds().has(targetNode.id))) {
      focusCanvasNode(next.targetNodeId);
    }
    state.message = `已进入「${targetLabel}」阶段`;
    pushLocalAgentMessage(
      "assistant",
      `已从「${profile.title}」进入「${targetLabel}」阶段。建议先处理「${next.label}」：${next.detail}`,
      "complete",
      agentProfile().title,
    );
    render();
    return true;
  }

  function overviewStatusAnswer(text) {
    if (!isOverviewQuestion(text)) return "";
    const scriptContext = hasCurrentScriptContext();
    const items = scriptContext ? currentEpisodeProgressItems() : currentProjectProgressItems();
    if (!items.length) return `当前项目还没有可汇总的剧集进度。`;
    const next = nextProgressBlocker();
    const lines = items.map((item) => `- ${item.label}：${item.labelStatus}，${item.detail}`);
    return [
      scriptContext ? `当前「${activeScriptLabel()}」进度：` : `当前「${state.graph?.project?.name || "当前项目"}」项目进度：`,
      ...lines,
      next
        ? `建议下一步：切到「${progressStageLabel(next)}」处理「${next.label}」。`
        : "建议下一步：进入「审计」做发布前复核。",
    ].join("\n");
  }

  function wantsStageGeneration(text) {
    return /生成|重生|重新|补齐|执行/.test(text) && !isStatusQuestion(text);
  }

  function wantsStoryboardAnalysisAction(text) {
    const value = String(text || "");
    if (!value.trim()) return false;
    if (isStatusQuestion(value) && !/开始|处理|分析|拆解|拆分|生成|重做|重新|写入|落库|调用/.test(value)) return false;
    return /开始处理|分镜分析|镜头拆解|拆分镜|生成分镜(?:分析|拆解|面板|卡片)?|生成镜头|创建分镜|补齐分镜|重(?:新)?分析分镜|写入(?:真实)?分镜(?:面板|节点|卡片)?|分镜(?:面板|节点|卡片).*写入|真实分镜节点|add_flowData_storyboard|落库.*分镜/.test(value);
  }

  function recentAgentDialogueText(limit = 6) {
    return state.agentMessages
      .slice(-limit)
      .map((message) => {
        const speaker = message.role === "user" ? "用户" : (message.name || agentProfile().title || "Agent");
        const text = agentDisplayText(message) || messagePlainText(message);
        return text ? `${speaker}：${shortMarkdown(text, 900)}` : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function recentStoryboardDecisionPrompt() {
    const context = recentAgentDialogueText(8);
    if (!context) return "";
    return /需要您(?:决策|决定)|请选择|请告知|方案\s*[A-CＡ-Ｃ]|时长修复策略|高山台词位置|光影(?:调|处理)/.test(context)
      ? context
      : "";
  }

  function wantsStoryboardDecisionExecution(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    const context = recentStoryboardDecisionPrompt();
    if (!context) return false;
    if (/完整修复|完整分镜|完善分镜|确认(?:执行|修复)?|继续(?:处理|修复|推进|执行)?|开始(?:处理|执行)|执行(?:修复|方案)?/.test(value)) return true;
    if (/时长修复策略/.test(context) && /(方案\s*[ABＡＢ]|延长|拆分|补足短镜)/.test(value)) return true;
    if (/高山台词位置/.test(context) && /(Sc\d+|F\d+|第\s*\d+|放在|插入|新增|新镜|原文)/i.test(value)) return true;
    if (/光影(?:调|处理)/.test(context) && /(接受|同意|确认|删除|物象|承载|prompt|保留|不接受)/i.test(value)) return true;
    return false;
  }

  function storyboardDecisionReplyAnswer(text) {
    const value = String(text || "").trim();
    if (!value) return "";
    const context = recentStoryboardDecisionPrompt();
    if (!context) return "";
    if (/时长修复/.test(value) && /时长修复策略/.test(context) && !/(方案\s*[ABＡＢ]|延长|拆分|补足短镜)/.test(value)) {
      return [
        "我理解你要处理「时长修复」，但上一轮问的是具体策略，还需要明确：",
        "- 方案A：延长各镜时长，改动小，但节奏可能变慢。",
        "- 方案B：拆分长台词镜并补足短镜，改动更大，但更适合修复节奏。",
        "请回复「方案A」或「方案B」，我再继续执行。",
      ].join("\n");
    }
    if (/高山台词/.test(value) && /高山台词位置/.test(context) && !/(Sc\d+|F\d+|第\s*\d+|放在|插入|新增|新镜|原文)/i.test(value)) {
      return "你提到「高山台词」，但还需要明确放置位置。请回复类似「放在 Sc1/F2」或「新增一镜插入原文」。";
    }
    if (/光影/.test(value) && /光影(?:调|处理)/.test(context) && !/(接受|同意|确认|删除|物象|承载|prompt|保留|不接受)/i.test(value)) {
      return "你提到「光影处理」，但还需要明确处理方式。请回复「接受用物象替代」或「保留光影描述」。";
    }
    return "";
  }

  function wantsStoryboardPipelineContinuation(text) {
    const value = String(text || "").trim();
    if (!value) return false;
    if (wantsStoryboardAnalysisAction(value)) return true;
    if (wantsStoryboardDecisionExecution(value)) return true;
    return /方案\s*[A-CＡ-Ｃ]|完整修复|审[计核]修复|修复审[计核]|按.*审[计核].*修复|(?:^|[，,。；;\s])(?:修复|完整分镜|完善分镜)(?:$|[，,。；;\s])|按.*方案|确认(?:执行|修复)?|继续(?:处理|修复|推进|执行)?|开始(?:处理|执行)|执行(?:修复|方案)?|可以(?:继续|执行|修复)?/.test(value);
  }

  function wantsStoryboardImageAction(text) {
    const value = String(text || "");
    if (!/分镜|镜头|图片|图像|出图|生图/.test(value)) return false;
    return /分镜图|图片|图像|出图|生图|重生|重新生成/.test(value) && !/分析|拆解|面板|卡片/.test(value);
  }

  function isHowToActionQuestion(text) {
    const value = String(text || "");
    return /(?:如何|怎么|怎样).*(?:生成|提取|抽取|出图|生图)|(?:生成|提取|抽取|出图|生图).*(?:如何|怎么|怎样)/.test(value)
      && !/(?:帮我|请|开始|执行|提交|现在|重新)/.test(value);
  }

  function wantsAssetAction(text) {
    const value = String(text || "");
    if (isAssetStatusQuestion(value) || isHowToActionQuestion(value)) return false;
    return /生成|重生|重新|补齐|执行|提交|提取|抽取|出图|生图/.test(value);
  }

  function recentAssetImageNextStagePrompt() {
    return state.agentMessages.slice().reverse().find((message) => {
      const text = agentDisplayText(message);
      return text.includes("是否进入下一阶段「自动生成全部资产图」");
    }) || null;
  }

  function wantsAllAssetImageAction(text) {
    const value = String(text || "");
    if (isAssetStatusQuestion(value)) return false;
    if (!/(资产|角色|场景|道具|候选图|资产图|出图|生图|下一阶段)/.test(value)) return false;
    return /(全部|所有|全量|自动生成|下一阶段)/.test(value) && /(生成|出图|生图|开始|执行|继续|进入)/.test(value);
  }

  function confirmsAssetImageNextStage(text) {
    if (!recentAssetImageNextStagePrompt()) return false;
    const value = String(text || "").trim();
    if (!value || /(?:不|否|不用|取消|暂不|先不)/.test(value)) return false;
    return /^(?:好|是|对|行|可以|确认|ok|OK)$|进入下一阶段|下一阶段|继续|开始|执行|生成全部资产图|自动生成全部资产图/.test(value);
  }

  function declinesAssetImageNextStage(text) {
    return Boolean(recentAssetImageNextStagePrompt()) && /(?:不|否|不用|取消|暂不|先不|不要生成)/.test(String(text || ""));
  }

  function wantsSelectedTarget(text) {
    return /这个|当前|选中|该/.test(text);
  }

  async function runOverviewDispatch(text, profile) {
    if (!wantsStageGeneration(text)) return false;
    if (/角色|场景|道具|资产/.test(text)) {
      const result = await extractAssetsForScript(scriptId());
      pushLocalAgentMessage("assistant", `已提交「${result.label || activeScriptLabel()}」角色/场景/道具资产提取任务 #${result.taskId}。`, "complete", profile.title);
      return true;
    }
    if (/分镜|镜头/.test(text)) {
      const storyboards = graphNodes().filter((node) => node.type === "storyboard");
      if (!storyboards.length) throw new Error("当前剧集还没有可生成的分镜节点。");
      await submitStoryboardImages(storyboards);
      pushLocalAgentMessage("assistant", `已提交 ${storyboards.length} 个分镜图生成任务。`, "complete", profile.title);
      return true;
    }
    if (/视频\s*Prompt|视频prompt|video\s*prompt|prompt/i.test(text)) {
      const prompts = graphNodes().filter((node) => node.type === "videoPrompt");
      if (!prompts.length) throw new Error("当前剧集还没有可重生的视频 Prompt。");
      await submitVideoPrompts(prompts);
      pushLocalAgentMessage("assistant", `已提交 ${prompts.length} 条视频 Prompt 重生任务。`, "complete", profile.title);
      return true;
    }
    return false;
  }

  async function submitStoryboardImages(nodes) {
    const storyboards = nodes.map((node) => node.data?.storyboard).filter((item) => item?.id);
    if (!storyboards.length) throw new Error("当前分镜标签下没有可生成的分镜。");
    await api("/production/storyboard/batchGenerateImage", {
      method: "POST",
      body: {
        storyboardIds: storyboards.map((item) => Number(item.id)),
        projectId: Number(storyboards[0].projectId),
        scriptId: Number(storyboards[0].scriptId),
        concurrentCount: 1,
        compulsory: true,
      },
    });
    await loadGraph();
  }

  async function submitStoryboardAnalysis(text) {
    const socket = await ensureProductionAgentSocket();
    const label = activeScriptLabel();
    const content = [
      `请基于当前剧本「${label}」执行分镜 Agent 的完整生产流水线，并把阶段结果写入画布。`,
      "流水线要求：1. 先读取工作区数据 get_flowData；2. 若导演规划 scriptPlan 为空或用户要求重做，运行导演规划并调用 save_flowData 保存 scriptPlan；3. 基于剧本和已有角色/场景/道具资产进行可用性检查，缺失资产只提出补齐建议，不要阻塞分镜拆解；4. 若分镜表 storyboardTable 为空或用户要求重做，构建分镜表并调用 save_flowData 保存 storyboardTable；5. 必须调用 add_flowData_storyboard 写入真实分镜卡片，不要只回复文本；每个镜头需要包含 videoDesc、prompt、track、duration、associateAssetsIds、shouldGenerateImage。",
      "画布映射要求：导演规划、分镜表、分镜卡都必须有可持久化数据；完成后画布应形成 剧本 -> 导演规划 -> 分镜表 -> 分镜分析 -> 分镜卡 的链路。",
      "默认不要生成分镜图片；只有用户明确要求出图时才调用 generate_storyboard。",
      `最近对话上下文：\n${recentAgentDialogueText(8) || "无"}`,
      `用户原始请求：${text}`,
    ].join("\n");
    socket.emit("updateThinkConfig", { think: Boolean(state.agentThink), thinlLevel: state.agentThink ? 1 : 0 });
    socket.emit("storyboardPipeline", { content });
  }

  async function submitVideoPrompts(nodes) {
    const project = state.graph?.project || {};
    const prompts = nodes.map((node) => node.data?.videoTrack).filter((item) => item?.id);
    if (!prompts.length) throw new Error("当前视频标签下没有可重生的视频 Prompt。");
    for (const track of prompts) {
      await api("/production/workbench/generateVideoPrompt", {
        method: "POST",
        body: {
          trackId: Number(track.id),
          projectId: Number(track.projectId),
          info: [],
          model: project.videoModel || "",
          mode: "text",
        },
      });
    }
    await loadGraph();
  }

  async function submitVideos(nodes) {
    const project = state.graph?.project || {};
    if (!project.videoModel) throw new Error("当前项目未配置视频模型，无法生成视频。");
    const tracks = nodes.map((node) => node.data?.videoTrack).filter((item) => item?.id);
    if (!tracks.length) throw new Error("当前视频标签下没有可生成的视频 Prompt。");
    for (const track of tracks) {
      if (!track.prompt) throw new Error(`视频 Prompt ${track.id} 还没有提示词，先生成视频 Prompt。`);
      await api("/production/workbench/generateVideo", {
        method: "POST",
        body: {
          trackId: Number(track.id),
          projectId: Number(track.projectId),
          scriptId: Number(track.scriptId || scriptId()),
          uploadData: [],
          prompt: track.prompt || "",
          model: project.videoModel || "",
          mode: project.mode || "text",
          resolution: project.videoResolution || "720p",
          duration: Number(track.duration || 5),
        },
      });
    }
    await loadGraph();
  }

  async function submitVideoCompose(text) {
    const pid = Number(projectId());
    const sid = Number(scriptId());
    if (!pid || !sid) throw new Error("缺少项目或剧集上下文，无法提交合成。");
    const snapshot = videoWorkflowSnapshot();
    const missing = snapshot.promptRows.filter((row) => !row.selectedId);
    if (!snapshot.promptRows.length) throw new Error("当前剧集还没有视频 Prompt，无法合成。");
    if (missing.length) {
      throw new Error(`还有 ${missing.length} 条视频 Prompt 未选定成功视频，先完成生成/选片。`);
    }
    if (/整集|拼接|导出/.test(String(text || ""))) {
      await api("/production/workbench/mergeEpisode", {
        method: "POST",
        body: { projectId: pid, scriptId: sid },
      });
      await loadGraph();
      return "已提交整集拼接任务。";
    }
    const trackIds = snapshot.readyRows.map((row) => Number(row.track.id)).filter((id) => Number.isFinite(id));
    await api("/production/workbench/composeVideo", {
      method: "POST",
      body: { projectId: pid, scriptId: sid, trackIds },
    });
    await loadGraph();
    return `已提交 ${trackIds.length} 个单镜头合成任务。`;
  }

  async function sendAgentMessage() {
    const profile = agentProfile();
    const text = state.agentText.trim();
    if (!text) {
      markMessage(`请输入要发送给${profile.title}的内容`);
      return;
    }
    if (agentModeKey() !== "script") {
      await routeStageAgentMessage(text);
      return;
    }
    const socket = await ensureScriptAgentSocket();
    const context = state.lockedAgentContext || buildAgentNodeContext(selectedNode());
    const content = [text, context].filter(Boolean).join("\n\n");
    pushLocalAgentMessage("user", text);
    state.agentText = "";
    state.agentMentionPicker = null;
    syncAgentMentionMenu();
    state.agentRunning = true;
    persistAgentThread();
    socket.emit("chat", { content, think: state.agentThink, thinkLevel: state.agentThink ? 1 : 0 });
    renderAgentOnly(true);
  }

  async function routeStageAgentMessage(text) {
    const mode = agentModeKey();
    const mentionedNodes = agentMentionTargets(text);
    const node = mentionedNodes[0] || selectedNode();
    const profile = agentProfile();
    let keepAgentRunning = false;
    pushLocalAgentMessage("user", text);
    state.agentText = "";
    state.agentMentionPicker = null;
    syncAgentMentionMenu();
    state.agentRunning = true;
    renderAgentOnly(true);
    try {
      const shouldRunStoryboardPipeline = mode === "storyboard" && wantsStoryboardPipelineContinuation(text) && !wantsStoryboardImageAction(text);
      const overviewAnswer = mode === "overview" ? overviewStatusAnswer(text) : "";
      const storyboardDecisionAnswer = mode === "storyboard" && !shouldRunStoryboardPipeline ? storyboardDecisionReplyAnswer(text) : "";
      const stageAnswer = mode === "storyboard" && !shouldRunStoryboardPipeline ? storyboardStatusAnswer(text) : "";
      const assetAnswer = mode === "asset" ? assetStatusAnswer(text) : "";
      const videoAnswer = mode === "video" ? videoStatusAnswer(text) : "";
      const shouldSubmitAllAssetImages = mode === "asset" && (wantsAllAssetImageAction(text) || confirmsAssetImageNextStage(text));
      const targetAnswer = agentTargetStatusAnswer(text, mentionedNodes);
      if (targetAnswer) {
        pushLocalAgentMessage("assistant", targetAnswer, "complete", profile.title);
      } else if (mode === "asset" && declinesAssetImageNextStage(text)) {
        pushLocalAgentMessage("assistant", "已暂停自动生成资产图。需要时回复「生成全部资产图」即可继续。", "complete", profile.title);
      } else if (shouldSubmitAllAssetImages) {
        const count = await submitAllAssetImages();
        pushLocalAgentMessage("assistant", count ? `已提交 ${count} 个资产的候选图生成任务；每个资产生成 4 张候选图，完成后自动评分选中。` : "当前没有需要生成候选图的资产。", "complete", profile.title);
      } else if (overviewAnswer) {
        pushLocalAgentMessage("assistant", overviewAnswer, "complete", profile.title);
      } else if (mode === "asset" && wantsNextStage(text)) {
        await enterNextStageFromAgent(profile);
      } else if (storyboardDecisionAnswer) {
        pushLocalAgentMessage("assistant", storyboardDecisionAnswer, "warning", profile.title);
      } else if (stageAnswer) {
        pushLocalAgentMessage("assistant", stageAnswer, "complete", profile.title);
      } else if (assetAnswer) {
        pushLocalAgentMessage("assistant", assetAnswer, "complete", profile.title);
      } else if (videoAnswer) {
        pushLocalAgentMessage("assistant", videoAnswer, "complete", profile.title);
      } else if (mentionedNodes.length && /查看|定位|打开|选中|聚焦/.test(text)) {
        focusCanvasNode(mentionedNodes[0].id);
        pushLocalAgentMessage("assistant", `已定位到「${mentionedNodes[0].label}」。`, "complete", profile.title);
      } else {
        const fallbackTargets = mentionedNodes.length ? mentionedNodes : node ? [node] : [];
        const handleFallbackIntent = async () => {
          const intent = await resolveAgentIntent(text, mentionedNodes, node);
          return Boolean(intent && await handleAgentIntent(intent, profile, fallbackTargets));
        };
        if (mode === "overview") {
          if (!(await runOverviewDispatch(text, profile)) && !(await handleFallbackIntent())) {
            pushLocalAgentMessage("assistant", overviewStatusAnswer("下一步") || "请说明要查看哪个阶段，或输入 @ 选择画布节点。", "warning", profile.title);
          }
        } else if (mode === "asset") {
          const assetNode = mentionedNodes.find((item) => item.type === "asset") || (wantsSelectedTarget(text) && node?.type === "asset" ? node : null);
          if (assetNode && wantsAssetAction(text)) {
            await runNodeAction("assetImage", assetNode);
            pushLocalAgentMessage("assistant", `已根据资产「${assetNode.label}」提交候选图生成任务。`, "complete", profile.title);
          } else if (wantsAssetAction(text)) {
            const result = await extractAssetsForScript(scriptId());
            pushLocalAgentMessage("assistant", `已提交「${result.label || activeScriptLabel()}」角色/场景/道具资产提取任务 #${result.taskId}。`, "complete", profile.title);
          } else if (!(await handleFallbackIntent())) {
            pushLocalAgentMessage("assistant", assetStatusAnswer("资产状态") || "请说明要查看资产状态，还是要重新提取或生成某个资产图。", "warning", profile.title);
          }
        } else if (mode === "storyboard") {
          const targets = mentionedNodes.filter((item) => item.type === "storyboard");
          const storyboards = targets.length
            ? targets
            : wantsSelectedTarget(text) && node?.type === "storyboard"
            ? [node]
            : wantsStoryboardImageAction(text)
            ? graphNodes().filter((item) => item.type === "storyboard")
            : [];
          if (shouldRunStoryboardPipeline) {
            await submitStoryboardAnalysis(text);
            keepAgentRunning = true;
          } else if (storyboards.length) {
            await submitStoryboardImages(storyboards);
            pushLocalAgentMessage("assistant", `已提交 ${storyboards.length} 个分镜图生成任务。`, "complete", profile.title);
          } else if (!(await handleFallbackIntent())) {
            pushLocalAgentMessage("assistant", storyboardStatusAnswer("分镜状态") || "请说明要做「分镜分析」还是「生成分镜图」，也可以输入 @ 选择具体分镜卡。", "warning", profile.title);
          }
        } else if (mode === "video") {
          if (wantsVideoCompose(text)) {
            const message = await submitVideoCompose(text);
            pushLocalAgentMessage("assistant", message, "complete", profile.title);
            return;
          }
          const directTargets = videoPromptTargets(mentionedNodes);
          const shotTargets = videoPromptTargetsByShotNumber(text);
          const prompts = directTargets.length
            ? directTargets
            : shotTargets.length
            ? shotTargets
            : wantsSelectedTarget(text) && node?.type === "videoPrompt"
            ? [node]
            : wantsSelectedTarget(text) && node?.type === "storyboard"
            ? videoPromptTargets([node])
            : wantsVideoGeneration(text) || wantsVideoPromptRegeneration(text)
            ? graphNodes().filter((item) => item.type === "videoPrompt")
            : [];
          if (prompts.length) {
            if (wantsVideoGeneration(text)) {
              pushLocalAgentMessage("assistant", `已收到，开始提交 ${prompts.length} 个视频生成任务。`, "complete", profile.title);
              persistAgentThread();
              renderAgentOnly(true);
              await submitVideos(prompts);
              pushLocalAgentMessage("assistant", `已提交 ${prompts.length} 个视频生成任务。`, "complete", profile.title);
            } else {
              pushLocalAgentMessage("assistant", `已收到，开始提交 ${prompts.length} 条视频 Prompt 重生任务。`, "complete", profile.title);
              persistAgentThread();
              renderAgentOnly(true);
              await submitVideoPrompts(prompts);
              pushLocalAgentMessage("assistant", `已提交 ${prompts.length} 条视频 Prompt 重生任务。`, "complete", profile.title);
            }
          } else if (!(await handleFallbackIntent())) {
            throw new Error("请描述要处理的视频任务，或在会话框输入 @ 选择视频 Prompt 卡。");
          }
        } else if (mode === "audit" && node?.data?.segment) {
          const rewrite = text.match(/^(?:改为|修改为|替换为)[:：]?\s*([\s\S]+)/);
          if (!rewrite) throw new Error("审计 Agent 当前只接受「修改为：...」来改写选中的审计片段。");
          state.editText = rewrite[1].trim();
          await patchSelectedSegment();
          pushLocalAgentMessage("assistant", `已提交审计片段修改，并刷新受影响下游节点。`, "complete", profile.title);
        } else if (await handleFallbackIntent()) {
          // handled by LLM intent fallback.
        } else {
          pushLocalAgentMessage("assistant", `请选择当前标签下的具体节点后再发送任务。`, "warning", profile.title);
        }
      }
    } catch (err) {
      pushLocalAgentMessage("assistant", err?.message || String(err), "error", profile.title);
    } finally {
      if (!keepAgentRunning) state.agentRunning = false;
      persistAgentThread();
      render();
    }
  }

  function stopAgentMessage() {
    state.agentSocket?.emit("stop");
    markStaleAgentArtifacts("已停止生成");
    state.agentRunning = false;
    renderAgentOnly();
  }

  function focusCanvasNode(nodeId) {
    const node = graphNodes().find((item) => item.id === nodeId);
    if (!node) return;
    const category = nodeCategory(node);
    state.view = category === "overview" || node.type === "task" ? "overview" : category;
    state.selectedNodeId = node.id;
    state.editText = node.data?.segment?.text || "";
    const canvas = document.querySelector(".tfcc-canvas");
    if (canvas && state.graph) {
      const rect = canvas.getBoundingClientRect();
      const vp = viewport();
      const nodeWidth = node.width || 260;
      const nodeHeight = node.height || 140;
      vp.x = Math.round(rect.width / 2 - (node.position.x + nodeWidth / 2) * vp.zoom);
      vp.y = Math.round(rect.height / 2 - (node.position.y + nodeHeight / 2) * vp.zoom);
      saveLayoutDebounced();
    }
    render();
  }

  function progressStatus(nodeIds, missing) {
    const nodes = nodeIds.map((id) => graphNodes().find((node) => node.id === id)).filter(Boolean);
    if (nodes.some((node) => node.stale)) return { key: "stale", statusText: "需复核" };
    if (missing) return { key: "missing", statusText: "待补齐" };
    return { key: "complete", statusText: "完成" };
  }

  function hasCurrentScriptContext() {
    const sid = scriptId();
    return Boolean(sid && scriptNodeById(sid));
  }

  function summaryCount(key) {
    return Number(state.graph?.summary?.[key] || 0);
  }

  function firstNodeIdOfTypes(types) {
    const allowed = new Set(Array.isArray(types) ? types : [types]);
    return graphNodes().find((node) => allowed.has(node.type))?.id || null;
  }

  function projectStageStatus(count, ready) {
    if (count > 0) return { key: "complete", statusText: "完成" };
    if (ready) return { key: "missing", statusText: "待处理" };
    return { key: "neutral", statusText: "未开始" };
  }

  function currentProjectProgressItems() {
    const novelCount = summaryCount("novelCount");
    const eventCount = summaryCount("eventCount");
    const scriptCount = summaryCount("scriptCount");
    const assetCount = summaryCount("assetCount");
    const storyboardCount = summaryCount("storyboardCount");
    const videoPromptCount = summaryCount("videoPromptCount");
    const videoCount = summaryCount("videoCount");
    const staleNodes = graphNodes().filter((node) => node.stale);
    const item = ({ id, label, count, ready, detail, targetTypes }) => ({
      id,
      label,
      detail,
      targetNodeId: firstNodeIdOfTypes(targetTypes),
      ...projectStageStatus(count, ready),
    });

    return [
      item({
        id: "source",
        label: "原文管理",
        count: novelCount,
        ready: true,
        detail: novelCount ? `${novelCount} 个章节已导入` : "尚未导入原文",
        targetTypes: ["novelChapter", "novelSection", "project"],
      }),
      item({
        id: "event",
        label: "事件分析",
        count: eventCount,
        ready: novelCount > 0,
        detail: eventCount ? `${eventCount} 个章节事件已分析` : novelCount ? "等待分析章节事件" : "导入原文后可分析事件",
        targetTypes: ["novelSection", "novelChapter", "project"],
      }),
      item({
        id: "projectScript",
        label: "剧本内容",
        count: scriptCount,
        ready: eventCount > 0,
        detail: scriptCount ? `${scriptCount} 集剧本` : eventCount ? "可从事件进入剧本改编" : "等待事件分析后改编",
        targetTypes: ["script", "novelSection", "project"],
      }),
      item({
        id: "projectAsset",
        label: "角色/场景资产",
        count: assetCount,
        ready: scriptCount > 0,
        detail: assetCount ? `${assetCount} 个资产` : scriptCount ? "剧本生成后可提取资产" : "等待剧本生成后提取",
        targetTypes: ["assetGroup", "asset", "script", "project"],
      }),
      item({
        id: "projectStoryboard",
        label: "分镜图",
        count: storyboardCount,
        ready: scriptCount > 0,
        detail: storyboardCount ? `${storyboardCount} 个分镜节点` : scriptCount ? "可从剧本进入分镜拆解" : "等待剧本生成后拆解",
        targetTypes: ["storyboardAnalysis", "storyboard", "script", "project"],
      }),
      item({
        id: "projectVideo",
        label: "视频结果",
        count: videoCount,
        ready: videoPromptCount > 0 || storyboardCount > 0,
        detail: videoCount ? `${videoCount} 个视频结果` : videoPromptCount ? `${videoPromptCount} 条视频 Prompt 待生成视频` : storyboardCount ? "等待生成视频 Prompt/视频" : "等待分镜完成后生成",
        targetTypes: ["video", "videoPrompt", "storyboard", "project"],
      }),
      {
        id: "projectStale",
        label: "下游复核",
        detail: staleNodes.length ? `${staleNodes.length} 个节点受上游修改影响` : "当前无过期节点",
        targetNodeId: staleNodes[0]?.id || firstNodeIdOfTypes(["project"]),
        key: staleNodes.length ? "stale" : "complete",
        statusText: staleNodes.length ? "需复核" : "正常",
      },
    ].map((entry) => ({
      ...entry,
      labelStatus: entry.statusText || "-",
    }));
  }

  function currentEpisodeProgressItems() {
    const sid = scriptId();
    const scriptNodeId = sid ? `script:${sid}` : null;
    const nodes = graphNodes();
    const edges = graphEdges();
    const scriptNode = scriptNodeId ? nodes.find((node) => node.id === scriptNodeId) : null;
    const activeAssetIds = activeAssetIdsForScript(sid);
    const assetGroupNodes = edges
      .filter((edge) => edge.source === scriptNodeId && String(edge.target || "").startsWith("assetGroup:"))
      .map((edge) => nodes.find((node) => node.id === edge.target))
      .filter(Boolean);
    const assetMeta = assetExtractMeta(scriptNode?.data?.script, activeAssetIds.length);
    const assetStatus = assetMeta.key ? { key: assetMeta.key, statusText: assetMeta.statusText } : progressStatus(activeAssetIds, activeAssetIds.length === 0);
    const analysisNode = sid ? nodes.find((node) => node.id === `storyboardAnalysis:${sid}`) : null;
    const storyboardNodes = nodes.filter((node) => node.type === "storyboard");
    const videoPromptNodes = nodes.filter((node) => node.type === "videoPrompt");
    const videoNodes = nodes.filter((node) => node.type === "video");
    const staleNodes = nodes.filter((node) => node.stale && ["script", "asset", "assetGroup", "storyboardAnalysis", "storyboard", "videoPrompt", "video"].includes(node.type));
    const first = (items, fallback) => items[0]?.id || fallback || null;

    return [
      {
        id: "script",
        label: "剧本内容",
        detail: scriptNode ? short(scriptNode.data?.contentPreview, 52) : "未找到当前剧集剧本",
        targetNodeId: scriptNodeId,
        ...progressStatus(scriptNodeId ? [scriptNodeId] : [], !scriptNode),
      },
      {
        id: "asset",
        label: "角色/场景资产",
        detail: assetMeta.detail || (activeAssetIds.length ? `${activeAssetIds.length} 个资产已关联` : "当前剧集尚未关联资产"),
        targetNodeId: first(assetGroupNodes, scriptNodeId),
        action: scriptNode && assetMeta.actionLabel
          ? {
              label: assetMeta.actionLabel,
              disabled: assetMeta.actionDisabled,
              action: "extractAssets",
            }
          : null,
        ...assetStatus,
      },
      {
        id: "analysis",
        label: "分镜分析",
        detail: storyboardNodes.length ? `已结构化 ${storyboardNodes.length} 个镜头` : "缺少分镜分析/镜头拆解",
        targetNodeId: analysisNode?.id || scriptNodeId,
        ...progressStatus(analysisNode ? [analysisNode.id] : [], storyboardNodes.length === 0),
      },
      {
        id: "storyboard",
        label: "分镜图",
        detail: storyboardNodes.length ? `${storyboardNodes.length} 个分镜节点` : "尚无分镜节点",
        targetNodeId: first(storyboardNodes, analysisNode?.id || scriptNodeId),
        ...progressStatus(storyboardNodes.map((node) => node.id), storyboardNodes.length === 0),
      },
      {
        id: "videoPrompt",
        label: "视频 Prompt",
        detail: videoPromptNodes.length ? `${videoPromptNodes.length} 条视频 Prompt` : "等待分镜生成视频 Prompt",
        targetNodeId: first(videoPromptNodes, first(storyboardNodes, analysisNode?.id || scriptNodeId)),
        ...progressStatus(videoPromptNodes.map((node) => node.id), videoPromptNodes.length === 0),
      },
      {
        id: "video",
        label: "视频结果",
        detail: videoNodes.length ? `${videoNodes.length} 个视频结果` : "等待视频生成/合成",
        targetNodeId: first(videoNodes, first(videoPromptNodes, first(storyboardNodes, scriptNodeId))),
        ...progressStatus(videoNodes.map((node) => node.id), videoNodes.length === 0),
      },
      {
        id: "stale",
        label: "下游复核",
        detail: staleNodes.length ? `${staleNodes.length} 个节点受上游修改影响` : "当前无过期节点",
        targetNodeId: staleNodes[0]?.id || scriptNodeId,
        key: staleNodes.length ? "stale" : "complete",
        statusText: staleNodes.length ? "需复核" : "正常",
      },
    ].map((item) => ({
      ...item,
      labelStatus: item.statusText || "-",
    }));
  }

  function taskTargetNodeId(task) {
    if (isAssetExtractionTask(task)) return null;
    const related = taskRelatedData(task);
    if (related.videoId) return `video:${related.videoId}`;
    if (related.trackId) return `videoPrompt:${related.trackId}`;
    if (related.storyboardId) return `storyboard:${related.storyboardId}`;
    if (Array.isArray(related.storyboardIds) && related.storyboardIds.length) return `storyboard:${related.storyboardIds[0]}`;
    if (related.assetId || related.assetsId || related.id) {
      const type = related.type || task.taskClass || task.kind || "";
      if (/资产|asset/i.test(type)) return `asset:${related.assetId || related.assetsId || related.id}`;
    }
    if (related.scriptId) return `script:${related.scriptId}`;
    return null;
  }

  function taskStatusClass(value) {
    const text = String(value || "");
    if (/需复核|警告|warning/i.test(text)) return "warning";
    if (/失败|error|fail/i.test(text)) return "error";
    if (/生成中|执行中|排队|合成中|拼接中|running|pending/i.test(text)) return "running";
    if (/完成|成功|complete|success/i.test(text)) return "complete";
    return "neutral";
  }

  function renderProgressItem(item) {
    const status = item.key || "neutral";
    const click = item.targetNodeId ? () => focusCanvasNode(item.targetNodeId) : undefined;
    const classes = [`tfcc-progress-item`, `is-${status}`, item.targetNodeId ? "is-clickable" : "is-disabled"].join(" ");
    const action = item.action
      ? h("button", {
          class: "tfcc-progress-action",
          disabled: item.action.disabled,
          onClick: (event) => {
            event.stopPropagation();
            if (!item.action.disabled && item.action.action === "extractAssets") withLoading(() => extractAssetsForScript(scriptId()));
          },
          text: item.action.label,
        })
      : null;
    return h("div", { class: classes, onClick: click }, [
      h("span", { class: "tfcc-progress-dot" }),
      h("span", { class: "tfcc-progress-main" }, [h("strong", { text: item.label }), h("em", { text: item.detail })]),
      h("span", { class: "tfcc-progress-side" }, [h("span", { class: "tfcc-progress-status", text: item.labelStatus }), action]),
    ]);
  }

  function renderTaskRow(task, kind) {
    const target = taskTargetNodeId(task);
    const label = task.taskClass || task.kind || `${kind} ${task.id || ""}`;
    const stateText = task.state || "-";
    return h("button", { class: `tfcc-task is-${taskStatusClass(stateText)}`, disabled: !target, onClick: target ? () => focusCanvasNode(target) : undefined }, [
      h("span", { class: "tfcc-task-main" }, [h("strong", { text: label }), h("em", { text: short(task.describe || task.reason || task.errorReason || formatTime(task.startTime || task.updateTime || task.createTime), 54) })]),
      h("span", { text: stateText }),
    ]);
  }

  function renderProgressBoard() {
    const tasks = state.graph?.tasks || [];
    const queues = state.graph?.queues || [];
    const sid = scriptId();
    const scriptContext = hasCurrentScriptContext();
    const inCurrentScript = (task) => sid && taskScriptIds(task).includes(Number(sid));
    const currentTasks = scriptContext ? tasks.filter(inCurrentScript) : tasks.filter((task) => !taskScriptIds(task).length);
    const projectTasks = scriptContext ? tasks.filter((task) => !inCurrentScript(task)) : tasks.filter((task) => taskScriptIds(task).length);
    const currentQueues = scriptContext ? queues.filter(inCurrentScript) : queues.filter((task) => !taskScriptIds(task).length);
    const projectQueues = scriptContext ? queues.filter((task) => !inCurrentScript(task)) : queues.filter((task) => taskScriptIds(task).length);
    const currentRuns = [...currentTasks.map((task) => ({ ...task, __kind: "任务" })), ...currentQueues.map((task) => ({ ...task, __kind: "队列" }))]
      .filter((task) => !isAssetExtractionTask(task))
      .slice(0, 5);
    const projectRuns = [...projectTasks.map((task) => ({ ...task, __kind: "任务" })), ...projectQueues.map((task) => ({ ...task, __kind: "队列" }))]
      .filter((task) => !isAssetExtractionTask(task))
      .slice(0, 5);
    const progressItems = scriptContext ? currentEpisodeProgressItems() : currentProjectProgressItems();
    return h("section", { class: "tfcc-task-panel" }, [
      h("div", { class: "tfcc-panel-title", text: scriptContext ? "当前剧集进度" : "当前项目进度" }),
      h("div", { class: "tfcc-progress-sub", text: scriptContext ? activeScriptLabel() : state.graph?.project?.name || "当前项目" }),
      h("div", { class: "tfcc-progress-list" }, progressItems.map(renderProgressItem)),
      h("div", { class: "tfcc-panel-subtitle", text: scriptContext ? "当前剧集执行" : "当前项目执行" }),
      currentRuns.length ? h("div", { class: "tfcc-task-list" }, currentRuns.map((task) => renderTaskRow(task, task.__kind))) : h("div", { class: "tfcc-empty", text: scriptContext ? "当前剧集暂无运行任务" : "当前项目暂无运行任务" }),
      h("div", { class: "tfcc-panel-subtitle", text: scriptContext ? "项目/历史任务" : "剧集/历史任务" }),
      projectRuns.length ? h("div", { class: "tfcc-task-list" }, projectRuns.map((task) => renderTaskRow(task, task.__kind))) : h("div", { class: "tfcc-empty", text: "暂无项目级任务" }),
    ]);
  }

  function msgStatusLabel(status) {
    const map = { pending: "生成中", running: "生成中", complete: "完成", warning: "需复核", error: "失败" };
    return map[status] || "";
  }

  function renderAgentMessages() {
    const items = state.agentMessages.slice(-12);
    if (!items.length) return h("div", { class: "tfcc-agent-empty", text: `${activeScriptLabel()} 暂无对话。发送任务后会显示 Agent 的思考、工具调用和回复。` });
    return items.map((message) => {
      const isUser = message.role === "user";
      const statusLabel = msgStatusLabel(message.status);
      return h("div", { class: `tfcc-agent-msg ${message.role || "assistant"} is-${message.status || "pending"}` }, [
        h("div", { class: "tfcc-agent-msg-head" }, [
          h("span", { class: "tfcc-msg-who" }, [
            h("span", { class: `tfcc-msg-avatar ${isUser ? "is-user" : ""}`, text: isUser ? "你" : "✦" }),
            h("strong", { text: message.name || (isUser ? "你" : "Agent") }),
          ]),
          statusLabel ? h("span", { class: "tfcc-msg-status", text: statusLabel }) : null,
        ].filter(Boolean)),
        h("div", { class: "tfcc-agent-msg-body tfcc-markdown", html: renderMarkdown(agentDisplayText(message) || "...") }),
      ]);
    });
  }

  function taskProgressLabel(item) {
    const map = {
      pending: "等待",
      running: "执行中",
      complete: "完成",
      warning: "需复核",
      error: "失败",
    };
    return map[item?.status] || item?.status || "-";
  }

  function progressBar(item) {
    if (!item || !item.total || item.total <= 0) return null;
    const current = Math.max(0, Math.min(Number(item.current ?? 0), Number(item.total)));
    const pct = Math.round((current / Number(item.total)) * 100);
    const running = item.status === "running" || (current < Number(item.total));
    return h("div", { class: "tfcc-progress-bar" }, [
      h("div", { class: "tfcc-progress-bar-label", text: `${running ? "生成中" : "已完成"} ${current}/${item.total} · ${pct}%` }),
      h("div", { class: "tfcc-progress-bar-track" }, [h("div", { class: "tfcc-progress-bar-fill", style: { width: `${pct}%` } })]),
    ]);
  }

  function renderAssetAgentProgress() {
    const tasks = currentAssetTasks().slice(-4);
    if (!tasks.length) {
      const { script, assetCount } = currentScriptAssetMeta();
      const text = isAssetExtracting(script)
        ? assetCount
          ? `已有 ${assetCount} 个资产，但未找到本次任务记录，请刷新或重新提交`
          : "资产提取状态异常：脚本处于提取中，但未找到任务记录，请刷新或重新提交"
        : `${activeScriptLabel()} 暂无资产提取执行记录`;
      return h("div", { class: "tfcc-agent-stream" }, [h("div", { class: "tfcc-agent-empty", text })]);
    }
    const messages = [];
    tasks.forEach((task) => {
      const progress = taskProgressFor(task.id);
      const latest = progress[progress.length - 1];
      const taskState = task.state || taskProgressLabel(latest);
      messages.push(
        h("div", { class: "tfcc-agent-msg user" }, [
          h("div", { class: "tfcc-agent-msg-head" }, [h("strong", { text: "你" }), h("span", { text: "complete" })]),
          h("div", { class: "tfcc-agent-msg-body tfcc-markdown", html: renderMarkdown(`重新提取「${activeScriptLabel()}」角色/场景/道具资产\n\n任务 #${task.id || "-"}`) }),
        ]),
      );
      const progressLines = progress.length
        ? progress
            .slice(-10)
            .map((item) => {
              const count = item.total ? ` (${item.current ?? 0}/${item.total})` : "";
              return `- **${taskProgressLabel(item)}** \`${item.phase || "-"}\`：${item.message || "-"}${count}`;
            })
            .join("\n")
        : "- 任务已建立，等待执行日志";
      const body = [
        `**资产提取任务 #${task.id || "-"}**`,
        `状态：${taskState || "-"}`,
        task.reason ? `结果：${task.reason}` : "",
        `时间：${formatTime(task.startTime || task.createTime)}`,
        "",
        progressLines,
      ]
        .filter((line) => line !== "")
        .join("\n");
      messages.push(
        h("div", { class: `tfcc-agent-msg assistant is-${taskStatusClass(taskState || latest?.status)}` }, [
          h("div", { class: "tfcc-agent-msg-head" }, [h("strong", { text: "角色/场景/道具 Agent" }), h("span", { text: taskState || "-" })]),
          progressBar(latest),
          h("div", { class: "tfcc-agent-msg-body tfcc-markdown", html: renderMarkdown(body) }),
        ].filter(Boolean)),
      );
    });
    return h("div", { class: "tfcc-agent-stream tfcc-agent-history" }, messages);
  }

  function renderAgentPanel() {
    const node = selectedNode();
    const profile = agentProfile();
    const mode = agentModeKey();
    const isScriptMode = mode === "script";
    const isAssetMode = mode === "asset";
    const connected = isScriptMode ? state.agentConnected : true;
    const locked = !!state.lockedAgentContext;

    // 顶部:agent 名 + 连接状态点
    const header = h("div", { class: "tfcc-chat-head" }, [
      h("div", { class: "tfcc-chat-head-main" }, [
        h("strong", { class: "tfcc-chat-title", text: profile.title }),
        h("span", { class: "tfcc-chat-role", text: profile.role }),
      ]),
      h("span", { class: `tfcc-chat-status ${connected ? "is-connected" : state.agentConnecting ? "is-connecting" : ""}` }, [
        h("span", { class: "tfcc-chat-status-dot" }),
        h("span", { text: connected ? "已连接" : state.agentConnecting ? "连接中" : "未连接" }),
      ]),
    ]);

    // 锁定上下文横幅
    const lockBanner = locked
      ? h("div", { class: "tfcc-chat-lock" }, [
          h("span", { class: "tfcc-chat-lock-text", text: `已锁定上下文：${node ? node.label : "当前节点"}` }),
          h("button", { class: "tfcc-chat-lock-clear", title: "解除锁定", onClick: () => { state.lockedAgentContext = ""; if (state.agentThreadKey) state.agentLocks[state.agentThreadKey] = ""; persistAgentThread(); renderAgentOnly(); }, text: "解除" }),
        ])
      : null;

    // 中部:可滚动会话历史
    const localMessages = state.agentMessages.length ? renderAgentMessages() : [];
    const body = isAssetMode
      ? h("div", { class: "tfcc-chat-body" }, [...(Array.isArray(localMessages) ? localMessages : [localMessages]), renderAssetAgentProgress()])
      : h("div", { class: "tfcc-chat-body" }, renderAgentMessages());

    // 底部:固定 composer
    const canSend = true;
    const composer = h("div", { class: "tfcc-chat-composer" }, [
      h("div", { class: "tfcc-chat-tools" }, [
        isScriptMode
          ? h("button", {
              class: `tfcc-chat-think ${state.agentThink ? "is-on" : ""}`,
              title: "深度思考：让 Agent 在回答前进行更长的推理",
              onClick: () => { state.agentThink = !state.agentThink; renderAgentOnly(); },
              text: state.agentThink ? "🧠 深度思考 开" : "🧠 深度思考",
            })
          : null,
        h("button", { class: `tfcc-chat-lockchip ${locked ? "is-on" : ""}`, title: profile.lockLabel, onClick: () => { if (locked) { state.lockedAgentContext = ""; if (state.agentThreadKey) state.agentLocks[state.agentThreadKey] = ""; persistAgentThread(); } else { lockAgentContext(); } renderAgentOnly(); }, text: locked ? "⌖ 已锁定上下文" : "⌖ 锁定上下文" }),
      ].filter(Boolean)),
      h("div", { class: "tfcc-chat-inputrow" }, [
        h("textarea", {
          class: "tfcc-chat-input",
          value: state.agentText,
          placeholder: profile.placeholder,
          onInput: (event) => {
            handleAgentComposerInput(event.target);
          },
          onKeydown: (event) => {
            if (event.key === "Escape" && state.agentMentionPicker) {
              state.agentMentionPicker = null;
              syncAgentMentionMenu();
              return;
            }
            if (canSend && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (!state.agentRunning) withLoading(sendAgentMessage);
            }
          },
        }),
        state.agentRunning && isScriptMode
          ? h("button", { class: "tfcc-chat-send is-stop", title: "停止", onClick: stopAgentMessage, text: "■" })
          : h("button", { class: "tfcc-chat-send", title: "发送 (⌘/Ctrl+Enter)", disabled: !state.agentText.trim(), onClick: () => withLoading(sendAgentMessage), text: "➤" }),
      ].filter(Boolean)),
    ]);

    return h("aside", { class: "tfcc-agent tfcc-chat" }, [header, lockBanner, body, composer, h("div", { class: "tfcc-agent-resizer", title: "拖动调整 Agent 区宽度", onPointerdown: startAgentResize })].filter(Boolean));
  }

  function renderInspectorPanel() {
    const node = selectedNode();
    return h("aside", { class: "tfcc-side" }, [
      h("section", { class: "tfcc-inspector" }, renderInspectorContent(node)),
      renderProgressBoard(),
    ]);
  }

  function renderInspector() {
    const panel = document.querySelector(".tfcc-side");
    if (!panel) return;
    panel.replaceWith(renderInspectorPanel());
  }

  function kv(label, value) {
    return h("div", { class: "tfcc-kv-row" }, [h("span", { text: label }), h("strong", { text: value == null || value === "" ? "-" : String(value) })]);
  }

  function sourceReferenceFor(data) {
    const key = sourceReferenceKey(data || {});
    return key ? state.sourceReferences[key] || null : null;
  }

  function inspectorStatusRow(label, ok, extra = null, statusText = null) {
    return h("div", { class: "tfcc-source-status-row" }, [
      h("div", { class: "tfcc-source-status-main" }, [
        h("span", { class: `tfcc-status-dot is-${ok ? "done" : "warn"}` }),
        h("span", { text: label }),
      ]),
      h("span", { class: `tfcc-source-pill ${ok ? "is-done" : "is-pending"}`, text: statusText || (ok ? "已完成" : "待处理") }),
      extra,
    ].filter(Boolean));
  }

  function renderSourceInspectorContent(node) {
    const data = node.data || {};
    const full = fullNovelItem(data);
    const draft = sourceDisplayData(node);
    const hasFull = Boolean(full);
    const eventBadge = sourceEventBadge(draft);
    const hasEvent = eventBadge.done;
    const ref = sourceReferenceFor(data);
    const save = () => {
      if (!full) return editNovelNode(node);
      return withLoading(() => saveNovelItem({
        id: full.id,
        index: full.index ?? full.chapterIndex ?? data.index ?? data.chapterIndex ?? 0,
        chapterOrder: full.chapterOrder ?? data.chapterOrder ?? full.index ?? full.chapterIndex ?? data.index ?? data.chapterIndex ?? 0,
        sectionOrder: full.sectionOrder ?? data.sectionOrder ?? 0,
        reel: full.reel || "",
        chapter: full.chapter || "",
        section: full.section || "",
        chapterData: full.chapterData || "",
        event: full.event || "",
      })).catch((err) => { state.message = err?.message || String(err); render(); });
    };
    return [
      h("div", { class: "tfcc-inspector-head" }, [
        h("div", { class: "tfcc-inspector-section", text: "章节详情" }),
        h("div", { class: "tfcc-inspector-icons" }, [
          h("button", { class: "tfcc-icon-btn", title: "编辑章节", onClick: () => editNovelNode(node), text: "✎" }),
          h("button", { class: "tfcc-icon-btn", title: "生成参考图", onClick: () => generateSourceReference(node), text: "↗" }),
        ]),
      ]),
      h("div", { class: "tfcc-source-form" }, [
        h("label", { class: "tfcc-source-label", text: "章 Order" }),
        h("input", {
          class: "tfcc-source-field",
          type: "number",
          min: "1",
          value: draft.chapterOrder ?? draft.order ?? draft.index ?? draft.chapterIndex ?? "",
          disabled: !hasFull,
          onInput: (event) => { if (full) full.chapterOrder = event.target.value; },
        }),
        h("label", { class: "tfcc-source-label", text: "章名称" }),
        h("input", {
          class: "tfcc-source-field",
          value: draft.chapter || "",
          disabled: !hasFull,
          maxlength: "50",
          onInput: (event) => { if (full) full.chapter = event.target.value; },
        }),
        h("div", { class: "tfcc-source-count", text: `${String(draft.chapter || "").length}/50` }),
        h("label", { class: "tfcc-source-label", text: "节 Order" }),
        h("input", {
          class: "tfcc-source-field",
          type: "number",
          min: "0",
          value: draft.sectionOrder ?? 0,
          disabled: !hasFull,
          onInput: (event) => { if (full) full.sectionOrder = event.target.value; },
        }),
        h("label", { class: "tfcc-source-label", text: "节名称" }),
        h("input", {
          class: "tfcc-source-field",
          value: draft.section || "",
          disabled: !hasFull,
          maxlength: "50",
          onInput: (event) => { if (full) full.section = event.target.value; },
        }),
        h("div", { class: "tfcc-source-count", text: `${String(draft.section || "").length}/50` }),
        h("label", { class: "tfcc-source-label", text: "正文内容" }),
        h("textarea", {
          class: "tfcc-source-textarea",
          value: draft.chapterData || "",
          disabled: !hasFull,
          onInput: (event) => { if (full) full.chapterData = event.target.value; },
        }),
        h("div", { class: "tfcc-source-count", text: `${String(draft.chapterData || "").length} 字` }),
      ]),
      h("div", { class: "tfcc-source-inspector-block" }, [
        inspectorStatusRow("事件分析状态", hasEvent, h("button", { class: "tfcc-source-mini-btn", disabled: !hasEvent, onClick: () => selectNode(node.type === "novelSection" ? node.id : `novelSection:${data.id}`), text: "查看分析报告" }), eventBadge.text),
        hasEvent ? h("p", { class: "tfcc-inspect-text", text: short(draft.event || data.event, 220) }) : h("p", { class: "tfcc-inspect-text", text: eventBadge.running ? "事件正在重新分析，完成后会自动刷新。" : eventBadge.failed ? short(draft.errorReason || data.errorReason || "事件分析失败。", 220) : "当前章节尚未生成事件分析。" }),
      ]),
      h("div", { class: "tfcc-source-inspector-block" }, [
        inspectorStatusRow("参考图状态", Boolean(ref?.url)),
        ref?.url ? h("div", { class: "tfcc-source-inspector-ref" }, [
          h("img", { src: ref.url, loading: "lazy", alt: "" }),
          h("div", {}, [
            h("strong", { text: "章节风格参考图" }),
            h("span", { text: `画面比例 ${ref.ratio || "16:9"}` }),
            h("span", { text: `质量 ${ref.quality || "-"}` }),
          ]),
        ]) : h("p", { class: "tfcc-inspect-text", text: "尚未生成参考图，可基于章节正文和事件分析生成。" }),
      ]),
      h("div", { class: "tfcc-source-inspector-actions" }, [
        h("button", { class: "primary", onClick: save, text: "保存章节" }),
        h("button", { onClick: () => analyzeNovelEvents(node), text: "重新分析事件" }),
        h("button", { onClick: () => generateSourceReference(node), text: "生成参考图" }),
      ]),
    ];
  }

  function renderSourceEventInspectorContent(node) {
    const data = sourceDisplayData(node);
    const eventBadge = sourceEventBadge(data);
    return [
      h("div", { class: "tfcc-inspector-head" }, [
        h("div", { class: "tfcc-inspector-section", text: "事件详情" }),
      ]),
      h("div", { class: "tfcc-source-inspector-block" }, [
        inspectorStatusRow("事件分析状态", eventBadge.done, null, eventBadge.text),
        h("div", { class: "tfcc-panel-subtitle", text: sourceChapterDisplayTitle(data, node.label) }),
        h("p", { class: "tfcc-inspect-text", text: sourceEventPreview(data, eventBadge) }),
        data.errorReason ? h("p", { class: "tfcc-source-error", text: short(data.errorReason, 220) }) : null,
      ].filter(Boolean)),
      h("div", { class: "tfcc-source-inspector-actions" }, [
        h("button", { class: "primary", onClick: () => analyzeNovelEvents(node), text: "重新分析事件" }),
      ]),
    ];
  }

  function renderSourceReferenceInspectorContent(node) {
    const data = node.data || {};
    return [
      h("div", { class: "tfcc-inspector-head" }, [
        h("div", { class: "tfcc-inspector-section", text: "参考图详情" }),
        h("div", { class: "tfcc-inspector-icons" }, [
          h("button", { class: "tfcc-icon-btn", title: "重新生成", onClick: () => generateSourceReference(node), text: "↻" }),
        ]),
      ]),
      h("div", { class: "tfcc-source-inspector-block" }, [
        h("div", { class: "tfcc-source-inspector-ref is-large" }, [
          data.image ? h("img", { src: data.image, loading: "lazy", alt: "" }) : h("span", { text: "暂无参考图" }),
        ]),
      ]),
      kv("来源", node.sourceLabel || "-"),
      kv("比例", data.ratio || "16:9"),
      kv("质量", data.quality || "-"),
      h("div", { class: "tfcc-source-inspector-block" }, [
        h("div", { class: "tfcc-panel-subtitle", text: "生成 Prompt" }),
        h("p", { class: "tfcc-inspect-text", text: data.prompt || "-" }),
      ]),
      h("div", { class: "tfcc-source-inspector-actions" }, [
        h("button", { class: "primary", onClick: () => generateSourceReference(node), text: "重新生成" }),
      ]),
    ];
  }

  function renderInspectorContent(node) {
    if (!node) return [h("div", { class: "tfcc-panel-title", text: "节点详情" }), h("div", { class: "tfcc-empty", text: "未选择节点" })];
    if (node.type === "novelChapter") return renderSourceInspectorContent(node);
    if (node.type === "novelSection") return renderSourceEventInspectorContent(node);
    if (node.type === "sourceReference") return renderSourceReferenceInspectorContent(node);
    const artifact = node.data?.artifact || null;
    const segment = node.data?.segment || null;
    const statusText = node.status || (node.stale ? node.staleReason || "需复核" : "current");
    const statusKey = node.status === "需复核" || node.stale ? "warn" : node.status === "生成中" ? "running" : node.status === "已完成" ? "done" : "neutral";
    const rows = [
      kv("类型", node.type),
      kv("ID", node.id),
      h("div", { class: "tfcc-kv-row" }, [
        h("span", { text: "状态" }),
        h("strong", { class: "tfcc-status-cell" }, [h("span", { class: `tfcc-status-dot is-${statusKey}` }), h("span", { text: statusText })]),
      ]),
    ];
    if (node.version != null) rows.push(kv("版本", `v${node.version}`));
    if (node.updateTime != null) rows.push(kv("更新", formatTime(node.updateTime)));
    if (node.sourceHash) {
      rows.push(
        h("div", { class: "tfcc-kv-row" }, [
          h("span", { text: "来源 Hash" }),
          h("span", { class: "tfcc-hash" }, [
            h("strong", { text: `${String(node.sourceHash).slice(0, 8)}…${String(node.sourceHash).slice(-6)}` }),
            h("button", { class: "tfcc-copy", title: "复制 Hash", onClick: () => navigator.clipboard?.writeText(String(node.sourceHash)), text: "⧉" }),
          ]),
        ]),
      );
    }
    if (node.sourceLabel) rows.push(kv("来源", node.sourceLabel.replace(/^来源：/, "")));
    if (artifact) {
      rows.push(kv("promptHash", artifact.promptHash));
      rows.push(kv("source", artifact.promptSource));
      rows.push(kv("model", artifact.modelName));
    }
    if (segment) {
      rows.push(kv("hash", segment.hash));
      rows.push(kv("artifact", segment.artifactId));
    }
    const actions = [];
    if (node.type === "script") {
      const targetScriptId = scriptIdFromNode(node);
      const assetAction = currentScriptAssetMeta(targetScriptId);
      const text = assetAction.meta.actionLabel ? `${assetAction.meta.actionLabel}角色/场景/道具` : "资产提取中";
      actions.push(h("button", { class: "primary", disabled: !assetAction.meta.actionLabel || assetAction.meta.actionDisabled, onClick: () => runNodeAction("extractAssets"), text }));
    }
    if (node.type === "storyboard") {
      actions.push(h("button", { onClick: () => runNodeAction("storyboardImage"), text: "生成分镜图" }));
      const sbFlowId = node.data?.storyboard?.flowId;
      actions.push(h("button", { class: "primary", title: sbFlowId ? "" : "尚未建立图片流", onClick: () => openFlowDrawer("storyboard", node.data?.storyboard?.id, sbFlowId, node.label), text: "展开图片流" }));
    }
    if (node.type === "videoPrompt") {
      actions.push(h("button", { class: "primary", onClick: () => runNodeAction("video"), text: "生成视频" }));
      actions.push(h("button", { onClick: () => runNodeAction("videoPrompt"), text: "重生视频 Prompt" }));
    }
    // 内容预览（组卡展示成员列表，其余展示来源内容预览）
    let preview = null;
    if (node.type === "novelChapter" || node.type === "novelSection") {
      const pid = projectId();
      const d = node.data || {};
      const fullItems = state.novelFullCache[pid] || [];
      const full = fullItems.find((f) => f.id === d.id);
      const isEditing = state.editNovelId === d.id;
      if (isEditing && full) {
        preview = h("div", { class: "tfcc-inspect-preview" }, [
          h("div", { class: "tfcc-novel-card is-editing" }, [
            h("input", { class: "tfcc-novel-input", value: full.chapter, placeholder: "章节名", onInput: (e) => { full.chapter = e.target.value; } }),
            h("textarea", { class: "tfcc-novel-textarea", value: full.chapterData, placeholder: "章节内容", onInput: (e) => { full.chapterData = e.target.value; } }),
            h("div", { class: "tfcc-novel-actions" }, [
              h("button", { onClick: () => { state.editNovelId = null; renderInspector(); }, text: "取消" }),
              h("button", { class: "primary", onClick: () => withLoading(() => saveNovelItem({ id: full.id, index: full.index ?? full.chapterIndex ?? 0, chapterOrder: full.chapterOrder ?? full.index ?? full.chapterIndex ?? 0, sectionOrder: full.sectionOrder ?? 0, reel: full.reel || "", chapter: full.chapter, section: full.section || "", chapterData: full.chapterData, event: full.event || "" })).catch((err) => { state.message = err?.message || String(err); render(); }), text: "保存" }),
            ]),
          ]),
        ]);
      } else {
        preview = h("div", { class: "tfcc-inspect-preview" }, [
          h("div", { class: "tfcc-panel-subtitle" }, [
            h("span", { text: node.type === "novelChapter" ? "章节内容" : "节/事件内容" }),
            h("button", { class: "tfcc-novel-load-btn", onClick: async () => { await withLoading(loadNovelFull); state.editNovelId = d.id; renderInspector(); }, text: "编辑" }),
          ]),
          d.chapterData ? h("p", { class: "tfcc-inspect-text", text: d.chapterData }) : null,
          (node.type === "novelSection" && d.event) ? h("p", { class: "tfcc-inspect-text", style: { marginTop: "6px", color: "rgba(243,245,251,.5)" }, text: d.event }) : null,
        ].filter(Boolean));
      }
    } else if (node.type === "assetGroup") {
      const items = node.data?.items || [];
      preview = h("div", { class: "tfcc-inspect-preview" }, [
        h("div", { class: "tfcc-panel-subtitle", text: "内容预览（点击展开图片流）" }),
        h("div", { class: "tfcc-asset-list" }, items.slice(0, 12).map((item) =>
          h("div", {
            class: `tfcc-asset-list-row ${item.flowId ? "is-clickable" : ""}`.trim(),
            title: item.flowId ? "展开图片流" : "尚未建立图片流",
            onClick: () => openFlowDrawer("asset", item.id, item.flowId, item.name || `资产 ${item.id}`),
          }, [
            item.thumbnail ? h("img", { src: item.thumbnail, loading: "lazy", alt: "" }) : h("span", { class: "tfcc-asset-list-noimg", text: "—" }),
            h("span", { class: "tfcc-asset-list-name", text: item.name || `资产 ${item.id}` }),
            item.flowId ? h("span", { class: "tfcc-asset-list-go", text: "❏" }) : null,
          ].filter(Boolean)),
        )),
      ]);
    } else if ((node.type === "storyboard" || node.type === "videoPrompt") && (node.data?.prompt || node.data?.promptPreview)) {
      preview = h("div", { class: "tfcc-inspect-preview" }, [
        h("div", { class: "tfcc-panel-subtitle", text: "内容预览" }),
        renderPromptGraphic(node.data?.prompt || node.data?.promptPreview || "", node.data?.mentions || []),
      ]);
    } else {
      const previewText = node.data?.contentPreview || node.data?.promptPreview || node.data?.introPreview || "";
      if (previewText) {
        preview = h("div", { class: "tfcc-inspect-preview" }, [
          h("div", { class: "tfcc-panel-subtitle", text: "内容预览" }),
          h("p", { class: "tfcc-inspect-text", text: short(previewText, 220) }),
        ]);
      }
    }
    return [
      h("div", { class: "tfcc-inspector-head" }, [
        h("div", { class: "tfcc-inspector-section", text: "节点详情" }),
        h("div", { class: "tfcc-inspector-icons" }, [
          h("button", { class: "tfcc-icon-btn", title: "编辑", onClick: () => { if (segment) { state.editText = segment.text || ""; renderInspector(); } }, text: "✎" }),
          h("button", { class: "tfcc-icon-btn", title: "复制节点 ID", onClick: () => navigator.clipboard?.writeText(node.id), text: "🔗" }),
          h("button", { class: "tfcc-icon-btn", title: "复制节点数据", onClick: () => navigator.clipboard?.writeText(JSON.stringify(node.data || {}, null, 2)), text: "⋮" }),
        ]),
      ]),
      h("div", { class: "tfcc-panel-title", text: node.label }),
      h("div", { class: "tfcc-kv" }, rows),
      preview,
      segment
        ? h("div", { class: "tfcc-edit" }, [
            h("textarea", {
              value: state.editText,
              onInput: (event) => {
                state.editText = event.target.value;
              },
            }),
            h("button", { class: "primary", onClick: patchSelectedSegment, text: "应用修改" }),
          ])
        : null,
      actions.length ? h("div", { class: "tfcc-actions" }, actions) : null,
    ].filter(Boolean);
  }

  function renderHeader() {
    const scripts = scriptOptions();
    return h("header", { class: "tfcc-header" }, [
      h("div", { class: "tfcc-brand" }, [
        h("span", { class: "tfcc-logo", text: "✦" }),
        h("strong", { class: "tfcc-brand-name", text: "Toonflow" }),
        h("span", { class: "tfcc-brand-sep", text: "·" }),
        h("span", { class: "tfcc-brand-project", text: state.graph?.project?.name || "创作画布" }),
      ]),
      h("div", { class: "tfcc-selectors" }, [
        h("div", { class: "tfcc-select-wrap tfcc-select-project" }, [
          h("span", { class: "tfcc-select-icon", text: "▦" }),
          h(
            "select",
            {
              value: state.selectedProjectId || "",
              onChange: async (event) => {
                persistAgentThread();
                state.selectedProjectId = event.target.value ? Number(event.target.value) : null;
                state.selectedScriptId = null;
                await withLoading(loadGraph);
                connectScriptAgentForCurrentContext();
              },
            },
            state.projects.map((project) => h("option", { value: project.id, text: project.name || `项目 ${project.id}` })),
          ),
        ]),
        usesScriptFilterForView()
          ? h("div", { class: "tfcc-select-wrap tfcc-select-ep" }, [
              h(
                "select",
                {
                  value: state.selectedScriptId || "",
                  onChange: async (event) => {
                    persistAgentThread();
                    state.selectedScriptId = event.target.value ? Number(event.target.value) : null;
                    await withLoading(loadGraph);
                    connectScriptAgentForCurrentContext();
                  },
                },
                scripts.map((script) => h("option", { value: script.id, text: script.name || `剧本 ${script.id}` })),
              ),
            ])
          : null,
      ]),
      h("nav", { class: "tfcc-tabs" }, VIEWS.map((view) => h("button", { class: state.view === view.key ? "is-active" : "", onClick: () => withLoading(() => switchView(view.key)), text: view.label }))),
      h("div", { class: "tfcc-header-actions" }, [
        h("button", { class: "tfcc-ghost", onClick: () => withLoading(loadGraph), text: "刷新" }),
        h("button", { class: "tfcc-ghost", title: "按当前视图重新排布节点", onClick: optimizeLayout, text: "优化布局" }),
        h("button", { class: "tfcc-ghost", onClick: () => withLoading(saveLayout), text: "保存布局" }),
        h("button", { class: "tfcc-publish", title: "发布（开发中）", onClick: () => { state.message = "发布功能开发中"; render(); }, text: "发布" }),
        h("button", { class: "primary", onClick: closeCanvas, text: "关闭" }),
      ]),
    ]);
  }

  function renderIconRail() {
    const items = [
      { key: "overview", icon: "▦", title: "总览" },
      { key: "source", icon: "文", title: "原文管理" },
      { key: "script", icon: "✎", title: "剧本 Agent" },
      { key: "asset", icon: "❏", title: "角色/场景/道具" },
      { key: "storyboard", icon: "▤", title: "分镜" },
    ];
    return h("nav", { class: "tfcc-rail" }, items.map((item) =>
      h("button", {
        class: `tfcc-rail-btn ${state.view === item.key ? "is-active" : ""}`,
        title: item.title,
        onClick: () => withLoading(() => switchView(item.key)),
        text: item.icon,
      }),
    ));
  }

  // ─── 图片流抽屉 ──────────────────────────────────────────────
  function flowNodeOf(flow, type) {
    return (flow?.nodes || []).find((n) => n.type === type) || null;
  }

  async function openFlowDrawer(targetType, targetId, flowId, label) {
    if (!flowId) {
      state.message = "该项尚未建立图片流，请先在生产工作台生成图片";
      render();
      return;
    }
    const project = state.graph?.project || {};
    state.flowDrawer = {
      targetType, targetId, flowId, label,
      loading: true, error: "",
      upload: "", generated: "", references: [],
      prompt: "", model: project.imageModel || "", ratio: project.videoRatio || "16:9", quality: project.imageQuality || "1K",
      generating: false, saving: false,
    };
    renderFlowDrawer();
    try {
      const [flow, defaults] = await Promise.all([
        api("/production/editImage/getImageFlow", { method: "POST", body: { id: Number(flowId) } }),
        api("/production/editImage/getImageDefaultModle", { method: "POST", body: { projectId: Number(project.id) } }).catch(() => null),
      ]);
      const d = state.flowDrawer;
      if (!d || d.flowId !== flowId) return; // 已切换/关闭
      const uploadNode = flowNodeOf(flow, "upload");
      const genNode = flowNodeOf(flow, "generated");
      d.upload = uploadNode?.data?.image || "";
      d.generated = genNode?.data?.generatedImage || "";
      d.references = (genNode?.data?.references || []).map((r) => r.image).filter(Boolean);
      d.prompt = genNode?.data?.prompt || genNode?.data?.text || "";
      d.model = genNode?.data?.model || defaults?.imageModel || d.model;
      d.ratio = genNode?.data?.ratio || d.ratio;
      d.quality = genNode?.data?.quality || defaults?.imageQuality || d.quality;
      d.loading = false;
    } catch (err) {
      if (state.flowDrawer) {
        state.flowDrawer.loading = false;
        state.flowDrawer.error = err && err.message ? err.message : String(err);
      }
    }
    renderFlowDrawer();
  }

  function closeFlowDrawer() {
    state.flowDrawer = null;
    renderFlowDrawer();
  }

  async function generateFlowImage() {
    const d = state.flowDrawer;
    if (!d || d.generating) return;
    const project = state.graph?.project || {};
    if (!d.model) { d.error = "未配置图像模型"; renderFlowDrawer(); return; }
    d.generating = true; d.error = ""; renderFlowDrawer();
    try {
      const refs = [d.upload, ...d.references].filter(Boolean);
      const result = await api("/production/editImage/generateFlowImage", {
        method: "POST",
        body: { model: d.model, references: refs, quality: d.quality, ratio: d.ratio, prompt: d.prompt, projectId: Number(project.id) },
      });
      d.generated = result?.url || d.generated;
    } catch (err) {
      d.error = err && err.message ? err.message : String(err);
    }
    d.generating = false;
    renderFlowDrawer();
  }

  async function saveFlowImage() {
    const d = state.flowDrawer;
    if (!d || d.saving || !d.generated) return;
    d.saving = true; d.error = ""; renderFlowDrawer();
    try {
      const endpoint = d.targetType === "storyboard" ? "/production/storyboard/updateStoryboardUrl" : "/production/assets/updateAssetsUrl";
      await api(endpoint, { method: "POST", body: { id: Number(d.targetId), url: d.generated, flowId: Number(d.flowId) } });
      state.message = "已保存生成图到" + (d.targetType === "storyboard" ? "分镜" : "资产");
      d.saving = false;
      closeFlowDrawer();
      await withLoading(loadGraph);
    } catch (err) {
      d.error = err && err.message ? err.message : String(err);
      d.saving = false;
      renderFlowDrawer();
    }
  }

  function renderFlowDrawer() {
    document.querySelector(".tfcc-flow-drawer-mask")?.remove();
    const d = state.flowDrawer;
    if (!d) return;
    const mask = h("div", { class: "tfcc-flow-drawer-mask", onMouseDown: (e) => { if (e.target.classList.contains("tfcc-flow-drawer-mask")) closeFlowDrawer(); } }, [
      h("div", { class: "tfcc-flow-drawer" }, renderFlowDrawerBody(d)),
    ]);
    document.body.appendChild(mask);
  }

  function renderFlowDrawerBody(d) {
    const head = h("div", { class: "tfcc-flow-head" }, [
      h("div", { class: "tfcc-flow-title" }, [h("span", { class: "tfcc-flow-ico", text: "❏" }), h("strong", { text: `${d.label} · 图片流` })]),
      h("button", { class: "tfcc-icon-btn", title: "关闭", onClick: closeFlowDrawer, text: "✕" }),
    ]);
    if (d.loading) return [head, h("div", { class: "tfcc-flow-empty", text: "加载图片流中…" })];
    const imgCell = (src, label, cls) => h("div", { class: `tfcc-flow-cell ${cls || ""}`.trim() }, [
      h("div", { class: "tfcc-flow-cell-label", text: label }),
      src ? h("img", { src, loading: "lazy", alt: "" }) : h("div", { class: "tfcc-flow-cell-empty", text: "暂无" }),
    ]);
    const refs = h("div", { class: "tfcc-flow-refs" }, [
      h("div", { class: "tfcc-flow-cell-label", text: "参考图" }),
      h("div", { class: "tfcc-flow-ref-row" }, (d.references.length ? d.references : [""]).map((src) => src ? h("div", { class: "tfcc-flow-ref" }, [h("img", { src, loading: "lazy", alt: "" })]) : h("div", { class: "tfcc-flow-ref is-empty", text: "—" }))),
    ]);
    const form = h("div", { class: "tfcc-flow-form" }, [
      h("textarea", { class: "tfcc-flow-prompt", value: d.prompt, placeholder: "画面 prompt…", onInput: (e) => { d.prompt = e.target.value; } }),
      h("div", { class: "tfcc-flow-controls" }, [
        h("select", { class: "tfcc-flow-model", value: d.model, title: "图像模型", onChange: (e) => { d.model = e.target.value; } }, imageModelOptions(d.model).map((option) => h("option", { value: option.value, text: option.label }))),
        h("select", { value: d.ratio, title: "比例", onChange: (e) => { d.ratio = e.target.value; } }, selectOptions(IMAGE_RATIOS, d.ratio).map((r) => h("option", { value: r.value, text: r.label }))),
        h("select", { value: d.quality, title: "质量", onChange: (e) => { d.quality = e.target.value; } }, selectOptions(IMAGE_QUALITIES, d.quality).map((q) => h("option", { value: q.value, text: q.label }))),
      ]),
      d.error ? h("div", { class: "tfcc-flow-error", text: d.error }) : null,
      h("div", { class: "tfcc-flow-actions" }, [
        h("button", { class: "primary", disabled: d.generating, onClick: generateFlowImage, text: d.generating ? "生成中…" : "生成" }),
        h("button", { disabled: !d.generated || d.saving, onClick: saveFlowImage, text: d.saving ? "保存中…" : "保存到" + (d.targetType === "storyboard" ? "分镜" : "资产") }),
      ].filter(Boolean)),
    ].filter(Boolean));
    return [
      head,
      h("div", { class: "tfcc-flow-stage" }, [imgCell(d.upload, "上传图"), h("span", { class: "tfcc-flow-arrow", text: "→" }), imgCell(d.generated, "生成图", "is-out")]),
      refs,
      form,
    ];
  }

  function renderOverlay() {
    if (!state.active) return null;
    syncCanvasHostInset();
    return h("div", { class: "tfcc-overlay" }, [
      renderHeader(),
      state.message ? h("div", { class: "tfcc-message", text: state.message }) : null,
      state.loading ? h("div", { class: "tfcc-loading", text: "Loading..." }) : null,
      h("div", { class: "tfcc-layout", style: { "--tfcc-agent-width": `${state.agentPanelWidth}px` } }, [renderIconRail(), renderAgentPanel(), renderCanvas(), renderInspectorPanel()]),
      renderPromptMentionPicker(),
    ]);
  }

  function render() {
    const snapshot = agentBodyScrollSnapshot();
    const shouldStickAgent = state.agentRunning || state.agentStickToOutput;
    document.querySelector(".tfcc-overlay")?.remove();
    const overlay = renderOverlay();
    if (overlay) document.body.appendChild(overlay);
    if (state.active) restoreAgentOutputScroll(snapshot, shouldStickAgent);
    state.agentStickToOutput = false;
  }

  function boot() {
    if (state.installed) return;
    state.installed = true;
    installEntry();
    window.addEventListener("hashchange", refreshEntryVisibility);
    window.addEventListener("resize", scheduleCanvasResizeFit);
    window.visualViewport?.addEventListener("resize", scheduleCanvasResizeFit);
    const observer = new MutationObserver(() => installEntry());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

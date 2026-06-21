(function () {
  const VIEWS = [
    { key: "overview", label: "总览" },
    { key: "script", label: "剧本" },
    { key: "asset", label: "角色/场景/道具" },
    { key: "storyboard", label: "分镜" },
    { key: "video", label: "视频" },
    { key: "audit", label: "审计" },
  ];

  const AGENT_PROFILES = {
    overview: {
      title: "总览 Agent",
      role: "总览上下文",
      placeholder: "拖拽 / 粘贴图片或输入要处理的节点上下文",
      lockLabel: "锁定上下文",
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
    agentError: "",
    agentMessages: [],
    agentThreadKey: "",
    agentThreads: {},
    agentDrafts: {},
    agentLocks: {},
    agentLoadedThreads: {},
    agentSavePayloads: {},
    agentSaveTimer: null,
    expandedAssetGroups: {},
    expandedImageFlows: {},
    imageFlowCache: {},
    imageModelOptions: [],
    promptMentionPicker: null,
    agentPlanData: null,
    agentPlanDataId: null,
    syncedAgentMessages: {},
    authToken: "",
    draggingNode: null,
    panning: null,
    saveTimer: null,
    assetPollTimer: null,
    // 图片流抽屉
    flowDrawer: null, // { targetType:'storyboard'|'asset', targetId, flowId, label, loading, error, upload, generated, references[], prompt, model, ratio, quality, generating, saving }
    // 深度思考开关
    agentThink: false,
  };

  const IMAGE_RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4"];
  const IMAGE_QUALITIES = ["1K", "2K", "4K"];

  function apiBase() {
    let base = `${location.origin || "http://localhost:10588"}/api`;
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
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
    if (!isLocal) return "";
    const login = await fetch(`${apiBase()}/login/login`, {
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
    const token = await getAuthToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = token;
    return fetch(`${apiBase()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.code === 400) throw new Error(json.message || res.statusText || "请求失败");
      return json.data;
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
          out.push({
            id: `expandedAsset:${group.id}:${item.id}`,
            type: "asset",
            label: item.name || `资产 ${item.id}`,
            position: { x: baseX + col * 210, y: baseY + row * 168 },
            width: 180,
            height: 150,
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
      const minX = Math.min(...flowNodes.map((node) => Number(node.position?.x || 0)));
      const minY = Math.min(...flowNodes.map((node) => Number(node.position?.y || 0)));
      const baseX = assetNode.position.x + (assetNode.width || 180) + 120;
      const baseY = assetNode.position.y - 20;
      flowNodes.forEach((flowNode, index) => {
        const isGenerated = flowNode.type === "generated";
        const data = flowNode.data || {};
        out.push({
          id: imageFlowNodeId(assetNodeId, flowNode.id || index),
          type: isGenerated ? "imageFlowGenerated" : "imageFlowUpload",
          label: isGenerated ? "图片生成" : `参考图 ${index + 1}`,
          position: {
            x: baseX + (Number(flowNode.position?.x || 0) - minX) * 0.45,
            y: baseY + (Number(flowNode.position?.y || 0) - minY) * 0.22,
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

  function graphNodes() {
    const nodes = baseGraphNodes();
    const expanded = expandedAssetNodes(nodes);
    const withAssets = expanded.length ? [...nodes, ...expanded] : nodes;
    const flowNodes = expandedImageFlowNodes(withAssets);
    return flowNodes.length ? [...withAssets, ...flowNodes] : withAssets;
  }

  function baseGraphEdges() {
    return state.graph?.edges || [];
  }

  function expandedAssetEdges(nodes = baseGraphNodes()) {
    return nodes
      .filter((node) => node.type === "assetGroup" && state.expandedAssetGroups[node.id])
      .flatMap((group) => (group.data?.items || []).map((item) => ({
        source: group.id,
        target: `expandedAsset:${group.id}:${item.id}`,
        type: "expands",
      })));
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

  function graphEdges() {
    const edges = baseGraphEdges();
    const expanded = expandedAssetEdges();
    const flowEdges = expandedImageFlowEdges(graphNodes());
    return expanded.length || flowEdges.length ? [...edges, ...expanded, ...flowEdges] : edges;
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
    return Number(state.selectedScriptId || state.graph?.scriptId || 0) || null;
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

  async function loadAgentThreadFromServer(key) {
    if (state.agentLoadedThreads[key]) return;
    const data = await api("/creativeCanvas/chatHistory/load", { method: "POST", body: { threadKey: key } });
    state.agentLoadedThreads[key] = true;
    if (state.agentThreadKey !== key) return;
    if (Array.isArray(data?.messages) && data.messages.length && !state.agentMessages.length) {
      state.agentMessages = data.messages;
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
    if (node.data?.expandedFlowFromAsset || node.type === "imageFlowUpload" || node.type === "imageFlowGenerated") return "asset";
    if (node.type === "script") return "script";
    if (node.type === "asset" || node.type === "assetGroup") return "asset";
    if (node.type === "storyboard" || node.type === "storyboardAnalysis") return "storyboard";
    if (node.type === "videoPrompt" || node.type === "video" || node.type === "videoPromptGroup" || node.type === "videoGroup") return "video";
    if (node.type === "auditArtifact" || node.type === "auditSegment") return "audit";
    return "overview";
  }

  // 概览视图：聚合卡（assetGroup / videoPromptGroup / videoGroup）代表整组；
  // 个体卡（asset / videoPrompt / video）只在各自分类视图里展开。
  const OVERVIEW_HIDDEN_TYPES = new Set(["assetExtractionTask", "task", "asset", "videoPrompt", "video", "storyboard"]);
  const GROUP_TYPES = new Set(["assetGroup", "videoPromptGroup", "videoGroup"]);

  function agentProfile() {
    const node = selectedNode();
    const key = state.view === "overview" ? nodeCategory(node) : state.view;
    return AGENT_PROFILES[key] || AGENT_PROFILES.overview;
  }

  function agentModeKey() {
    const node = selectedNode();
    const key = state.view === "overview" ? nodeCategory(node) : state.view;
    return AGENT_PROFILES[key] ? key : "overview";
  }

  function connectScriptAgentForCurrentContext() {
    if (state.view !== "script") return;
    ensureScriptAgentSocket().catch((err) => {
      state.agentError = err && err.message ? err.message : String(err);
      renderAgentOnly();
    });
  }

  function switchView(viewKey) {
    persistAgentThread();
    state.view = viewKey;
    if (viewKey !== "overview") {
      const current = selectedNode();
      if (!current || nodeCategory(current) !== viewKey) {
        const next = graphNodes().find((node) => nodeCategory(node) === viewKey);
        if (next) state.selectedNodeId = next.id;
      }
    }
    const visible = visibleNodeIds();
    if (!visible.has(state.selectedNodeId)) {
      const next = graphNodes().find((node) => visible.has(node.id));
      if (next) state.selectedNodeId = next.id;
    }
    if (viewKey === "asset") ensureReadableAssetLayout();
    restoreAgentThread();
    render();
    connectScriptAgentForCurrentContext();
  }

  function visibleNodeIds() {
    if (state.view === "overview") return new Set(graphNodes().filter((node) => !node.data?.expandedFromGroup && !node.data?.expandedFlowFromAsset && !OVERVIEW_HIDDEN_TYPES.has(node.type)).map((node) => node.id));
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

  function renderAgentOnly() {
    const panel = document.querySelector(".tfcc-agent");
    if (!panel) return;
    panel.replaceWith(renderAgentPanel());
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
      scriptId: state.selectedScriptId ? Number(state.selectedScriptId) : undefined,
      viewKey: "overview",
    };
    state.graph = await api("/creativeCanvas/getGraph", { method: "POST", body });
    if (state.graph?.project?.id) state.selectedProjectId = Number(state.graph.project.id);
    if (state.graph?.scriptId) state.selectedScriptId = Number(state.graph.scriptId);
    if (!state.selectedNodeId || !graphNodes().some((node) => node.id === state.selectedNodeId)) {
      state.selectedNodeId = graphNodes()[0]?.id || null;
    }
    if (state.view !== "overview") {
      const current = selectedNode();
      if (!current || nodeCategory(current) !== state.view) {
        const next = graphNodes().find((node) => nodeCategory(node) === state.view);
        if (next) state.selectedNodeId = next.id;
      }
    }
    const node = selectedNode();
    state.editText = node?.data?.segment?.text || "";
    restoreAgentThread();
    if (state.view === "asset") ensureReadableAssetLayout();
    scheduleAssetExtractionPoll();
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

  async function openCanvas(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    state.active = true;
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
    clearTimeout(state.assetPollTimer);
    state.assetPollTimer = null;
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
    const nodesLayout = baseGraphNodes().map((node) => ({
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
        viewKey: "overview",
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

  function fitView() {
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
    saveLayoutDebounced();
  }

  function layoutColumn(nodes, x, y, gap = 260) {
    nodes.forEach((node, index) => {
      node.position = { x, y: y + index * gap };
    });
  }

  function layoutWrappedColumn(nodes, x, y, gapY = 140, rows = 10, gapX = 320) {
    nodes.forEach((node, index) => {
      node.position = {
        x: x + Math.floor(index / rows) * gapX,
        y: y + (index % rows) * gapY,
      };
    });
  }

  function optimizeLayout() {
    if (!state.graph) return;
    const visible = visibleNodeIds();
    const nodes = baseGraphNodes().filter((node) => visible.has(node.id));
    const byType = (type) => nodes.filter((node) => node.type === type);
    const project = byType("project");
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

    if (state.view === "script") {
      layoutColumn(project, -80, -140, 260);
      layoutColumn(scripts, 300, -140, 260);
      layoutWrappedColumn(tasks, 760, -140, 140);
    } else if (state.view === "asset") {
      layoutColumn(project, -80, -160, 260);
      layoutColumn(assetGroups, 340, -220, 260);
      layoutWrappedColumn(tasks, 1120, -220, 140);
    } else if (state.view === "storyboard") {
      layoutColumn(project, -80, -160, 260);
      layoutColumn(assetGroups, 300, -240, 250);
      layoutColumn(storyboardAnalysis, 700, -240, 620);
      layoutColumn(storyboards, 1660, -260, 380);
      layoutWrappedColumn(tasks, 2020, -240, 140);
    } else if (state.view === "video") {
      layoutColumn(project, -80, -160, 260);
      layoutColumn(storyboards, 320, -260, 380);
      layoutColumn(videoPrompts, 720, -260, 390);
      layoutColumn(videos, 1120, -260, 180);
      layoutWrappedColumn(tasks, 1460, -260, 130);
    } else if (state.view === "audit") {
      layoutColumn(project, -80, -160, 260);
      layoutColumn(auditArtifacts, 300, -240, 190);
      layoutColumn(auditSegments, 720, -240, 140);
      layoutWrappedColumn(tasks, 1160, -240, 140);
    } else {
      layoutColumn(project, -80, -120, 260);
      layoutColumn(scripts, 300, -120, 260);
      layoutColumn(assetGroups, 680, -260, 250);
      layoutColumn(storyboardAnalysis, 1040, -260, 620);
      layoutColumn(videoPromptGroups, 2040, -260, 260);
      layoutColumn(videoGroups, 2040, 20, 260);
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
    state.draggingNode = {
      id: node.id,
      startX: event.clientX,
      startY: event.clientY,
      x: node.position.x,
      y: node.position.y,
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
    node.position.x = drag.x + (event.clientX - drag.startX) / vp.zoom;
    node.position.y = drag.y + (event.clientY - drag.startY) / vp.zoom;
    const el = document.querySelector(`[data-tfcc-node="${CSS.escape(node.id)}"]`);
    if (el) {
      el.style.left = `${node.position.x}px`;
      el.style.top = `${node.position.y}px`;
    }
    renderEdges();
  }

  function endNodeDrag() {
    if (state.draggingNode) saveLayoutDebounced();
    state.draggingNode = null;
    document.removeEventListener("mousemove", onNodeDrag);
    document.removeEventListener("mouseup", endNodeDrag);
  }

  function selectNode(nodeId) {
    state.selectedNodeId = nodeId;
    state.promptMentionPicker = null;
    document.querySelectorAll(".tfcc-mention-menu").forEach((el) => el.remove());
    const node = selectedNode();
    state.editText = node?.data?.segment?.text || "";
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
    if ((node.data?.items || []).length < 2) {
      selectNode(node.id);
      return;
    }
    const next = !state.expandedAssetGroups[node.id];
    state.expandedAssetGroups[node.id] = next;
    selectNode(node.id);
    Object.keys(state.expandedImageFlows)
      .filter((key) => key.startsWith(`expandedAsset:${node.id}:`))
      .forEach((key) => delete state.expandedImageFlows[key]);
    const firstFlowItem = next ? (node.data?.items || []).find((item) => Number(item.flowId || 0)) : null;
    if (firstFlowItem) {
      const flowId = Number(firstFlowItem.flowId);
      const assetNodeId = `expandedAsset:${node.id}:${firstFlowItem.id}`;
      if (!state.imageFlowCache[flowId]) state.imageFlowCache[flowId] = await api("/production/editImage/getImageFlow", { method: "POST", body: { id: flowId } });
      state.expandedImageFlows[assetNodeId] = flowId;
    }
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
    state.view = "asset";
    state.message = result?.taskId ? `已提交「${label}」资产提取任务 #${result.taskId}` : `已提交「${label}」资产提取任务`;
    await loadGraph();
    scheduleAssetExtractionPoll();
  }

  async function runNodeAction(action) {
    const node = selectedNode();
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
          state.message = "请选择具体资产再生成资产图";
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
            candidateCount: 1,
          },
        });
        state.message = "资产图生成任务已提交";
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
          minHeight: `${node.height || 120}px`,
        },
        onMouseDown: (event) => {
          if (node.data?.expandedFromGroup || node.data?.expandedFlowFromAsset) event.stopPropagation();
          else beginNodeDrag(event, node);
        },
        onClick: (event) => {
          event.stopPropagation();
          if (node.type === "assetGroup") toggleAssetGroup(node).catch((err) => { state.message = err?.message || String(err); render(); });
          else if (node.type === "asset" && node.data?.asset?.flowId) toggleAssetFlow(node).catch((err) => { state.message = err?.message || String(err); render(); });
          else selectNode(node.id);
        },
      },
      renderNodeContent(node),
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
    const insert = picker.kind === "asset" ? insertAssetMention : insertImageFlowMention;
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

  function renderNodeContent(node) {
    const data = node.data || {};
    const title = nodeTitle(node);
    if (node.type === "project") {
      const summary = state.graph?.summary || {};
      return [
        title,
        h("div", { class: "tfcc-node-sub", text: short(data.introPreview, 110) }),
        h("div", { class: "tfcc-chips" }, [
          chip(summary.scriptCount, "集"),
          chip(summary.assetCount, "资产"),
          chip(summary.storyboardCount, "分镜"),
          chip(summary.videoCount, "视频"),
        ]),
      ];
    }
    if (node.type === "assetGroup") {
      const count = data.count || (data.items ? data.items.length : 0);
      const unit = data.assetType === "scene" ? "个场景" : data.assetType === "tool" ? "个道具" : "个角色";
      const expanded = !!state.expandedAssetGroups[node.id];
      const hasFlow = (data.items || []).some((item) => item.flowId);
      return [
        title,
        thumbGrid(data.thumbnails, count, 4, "row"),
        h("div", { class: "tfcc-node-count", text: `${count} ${unit}` }),
        h("div", { class: "tfcc-node-sub", text: expanded ? "点击收起明细" : (hasFlow ? "点击展开明细与生成过程" : "点击展开明细") }),
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
        const mentions = assetMentions(node);
        const promptText = asset.prompt || data.promptPreview || "";
        return [
          title,
          data.thumbnail ? thumbTile(data.thumbnail, "tfcc-asset-node-thumb") : null,
          renderPromptGraphic(promptText, mentions, {
            editable: true,
            onInput: (event) => handleAssetPromptInput(node, event.currentTarget, mentions),
            onBlur: (event) => {
              const value = promptGraphicText(event.currentTarget);
              if (node.data.asset) {
                node.data.asset.prompt = value;
                node.data.promptPreview = value;
              }
              saveAssetPrompt(node).catch((err) => { state.message = err?.message || String(err); render(); });
            },
          }),
          renderAssetMentionPicker(node),
          h("div", { class: "tfcc-node-sub", text: hint }),
        ].filter(Boolean);
      }
      return [title, data.thumbnail ? thumbTile(data.thumbnail, "tfcc-asset-node-thumb") : null, h("div", { class: "tfcc-node-sub", text: asset.type || "-" }), h("p", { text: short(data.promptPreview, 180) }), nodeSource(node)].filter(Boolean);
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
    if (node.type === "script") return [title, h("p", { text: short(data.contentPreview, 220) }), nodeSource(node)];
    if (node.type === "storyboard") {
      const mentions = data.mentions || [];
      const promptText = data.prompt || data.promptPreview || "";
      const children = [title];
      if (data.thumbnail) children.push(thumbTile(data.thumbnail, "tfcc-thumb-wide"));
      children.push(renderPromptGraphic(promptText, mentions));
      children.push(h("textarea", {
        class: "tfcc-video-prompt-inline",
        value: promptText,
        placeholder: "输入 @图1 / @图片1 修改引用",
        onInput: (event) => {
          updateStoryboardPromptText(node, event.target.value);
          const graphic = event.currentTarget.closest(".tfcc-node")?.querySelector(".tfcc-prompt-graphic");
          if (graphic) graphic.replaceWith(renderPromptGraphic(event.target.value, mentions));
        },
        onBlur: () => saveStoryboardPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); }),
        onMouseDown: (event) => event.stopPropagation(),
        onClick: (event) => event.stopPropagation(),
      }));
      children.push(nodeSource(node));
      return children.filter(Boolean);
    }
    if (node.type === "videoPrompt") {
      const mentions = data.mentions || [];
      const promptText = data.prompt || data.promptPreview || "";
      return [
        title,
        renderPromptGraphic(promptText, mentions),
        h("textarea", {
          class: "tfcc-video-prompt-inline",
          value: promptText,
          placeholder: "输入 @图片1 / @镜头33 修改引用",
          onInput: (event) => {
            updateVideoPromptText(node, event.target.value);
            const graphic = event.currentTarget.closest(".tfcc-node")?.querySelector(".tfcc-prompt-graphic");
            if (graphic) graphic.replaceWith(renderPromptGraphic(event.target.value, mentions));
          },
          onBlur: () => saveVideoPromptText(node).catch((err) => { state.message = err?.message || String(err); render(); }),
          onMouseDown: (event) => event.stopPropagation(),
          onClick: (event) => event.stopPropagation(),
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
    if (mode === "asset") return "资产模式已接入画布动作：提取、复核与生成资产图";
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
      script.src = `${location.origin}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => (window.io ? resolve(window.io) : reject(new Error("Socket.IO client 未加载")));
      script.onerror = () => reject(new Error("Socket.IO client 加载失败"));
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
      state.agentRunning = state.agentMessages.some((item) => item.role === "assistant" && item.status === "pending");
      syncScriptAgentArtifacts(message.id).catch((err) => {
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
    if (content.status === "complete") {
      syncScriptAgentArtifacts(message.id).catch((err) => {
        state.agentError = err.message || String(err);
      });
    }
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

  async function syncScriptAgentArtifacts(messageId) {
    if (state.syncedAgentMessages[messageId]) return;
    const message = state.agentMessages.find((item) => item.id === messageId);
    const parsed = parseScriptAgentArtifacts(messagePlainText(message));
    if (!parsed.storySkeleton && !parsed.adaptationStrategy && !parsed.scripts.length) return;
    state.syncedAgentMessages[messageId] = true;

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
    state.agentPlanData = next;
    state.message = "剧本 Agent 已写入工作区，画布已刷新";
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
    const socket = window.io(`${location.origin}/api/socket/scriptAgent`, {
      auth: { token, isolationKey: `${pid}:scriptAgent${sid ? `:${sid}` : ""}`, projectId: pid, scriptId: sid },
      transports: ["websocket", "polling"],
    });
    state.agentSocket = socket;
    state.agentSocketKey = socketKey;

    socket.on("connect", () => {
      state.agentConnecting = false;
      state.agentConnected = true;
      state.agentError = "";
      renderAgentOnly();
    });
    socket.on("disconnect", () => {
      state.agentConnected = false;
      state.agentRunning = false;
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
      renderAgentOnly();
    });
    socket.on("message:update", (update) => {
      updateAgentMessage(update);
      renderAgentOnly();
    });
    socket.on("content:add", (event) => {
      addAgentContent(event);
      renderAgentOnly();
    });
    socket.on("content:update", (event) => {
      updateAgentContent(event);
      renderAgentOnly();
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

  function lockAgentContext() {
    const node = selectedNode();
    const profile = agentProfile();
    state.lockedAgentContext = buildAgentNodeContext(node);
    if (state.agentThreadKey) state.agentLocks[state.agentThreadKey] = state.lockedAgentContext;
    persistAgentThread();
    markMessage(node ? `${profile.title} 已锁定：${node.label}` : "");
  }

  async function sendAgentMessage() {
    const profile = agentProfile();
    if (agentModeKey() !== "script") {
      markMessage(`${profile.title} 暂未接入执行链路`);
      return;
    }
    const text = state.agentText.trim();
    if (!text) {
      markMessage("请输入要发送给剧本 Agent 的内容");
      return;
    }
    const socket = await ensureScriptAgentSocket();
    const context = state.lockedAgentContext || buildAgentNodeContext(selectedNode());
    const content = [text, context].filter(Boolean).join("\n\n");
    state.agentMessages.push({
      id: `local-user:${Date.now()}`,
      role: "user",
      status: "complete",
      datetime: new Date().toISOString(),
      content: [{ type: "text", id: `local-content:${Date.now()}`, data: text, status: "complete" }],
    });
    state.agentText = "";
    state.agentRunning = true;
    persistAgentThread();
    socket.emit("chat", { content, think: state.agentThink, thinkLevel: state.agentThink ? 1 : 0 });
    renderAgentOnly();
  }

  function stopAgentMessage() {
    state.agentSocket?.emit("stop");
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
    const currentTasks = tasks.filter((task) => taskScriptIds(task).includes(Number(sid)));
    const projectTasks = tasks.filter((task) => !taskScriptIds(task).includes(Number(sid)));
    const currentQueues = queues.filter((task) => taskScriptIds(task).includes(Number(sid)));
    const projectQueues = queues.filter((task) => !taskScriptIds(task).includes(Number(sid)));
    const currentRuns = [...currentTasks.map((task) => ({ ...task, __kind: "任务" })), ...currentQueues.map((task) => ({ ...task, __kind: "队列" }))]
      .filter((task) => !isAssetExtractionTask(task))
      .slice(0, 5);
    const projectRuns = [...projectTasks.map((task) => ({ ...task, __kind: "任务" })), ...projectQueues.map((task) => ({ ...task, __kind: "队列" }))]
      .filter((task) => !isAssetExtractionTask(task))
      .slice(0, 5);
    return h("section", { class: "tfcc-task-panel" }, [
      h("div", { class: "tfcc-panel-title", text: "当前剧集进度" }),
      h("div", { class: "tfcc-progress-sub", text: activeScriptLabel() }),
      h("div", { class: "tfcc-progress-list" }, currentEpisodeProgressItems().map(renderProgressItem)),
      h("div", { class: "tfcc-panel-subtitle", text: "当前剧集执行" }),
      currentRuns.length ? h("div", { class: "tfcc-task-list" }, currentRuns.map((task) => renderTaskRow(task, task.__kind))) : h("div", { class: "tfcc-empty", text: "当前剧集暂无运行任务" }),
      h("div", { class: "tfcc-panel-subtitle", text: "项目/历史任务" }),
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
        h("div", { class: "tfcc-agent-msg-body tfcc-markdown", html: renderMarkdown(messagePlainText(message) || "...") }),
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
          ? `已有 ${assetCount} 个资产，等待任务日志写入`
          : "资产提取正在进行，等待任务日志写入"
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
    const assetAction = isAssetMode ? currentScriptAssetMeta() : null;
    const connected = state.agentConnected || isAssetMode;
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
    const body = isAssetMode
      ? h("div", { class: "tfcc-chat-body" }, [renderAssetAgentProgress()])
      : h("div", { class: "tfcc-chat-body" }, renderAgentMessages());

    // 底部:固定 composer
    const canSend = isScriptMode;
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
        (isScriptMode || isAssetMode)
          ? h("button", { class: `tfcc-chat-lockchip ${locked ? "is-on" : ""}`, title: profile.lockLabel, onClick: () => { if (locked) { state.lockedAgentContext = ""; if (state.agentThreadKey) state.agentLocks[state.agentThreadKey] = ""; persistAgentThread(); } else { lockAgentContext(); } renderAgentOnly(); }, text: locked ? "⌖ 已锁定上下文" : "⌖ 锁定上下文" })
          : null,
      ].filter(Boolean)),
      h("div", { class: "tfcc-chat-inputrow" }, [
        h("textarea", {
          class: "tfcc-chat-input",
          value: state.agentText,
          placeholder: profile.placeholder,
          onInput: (event) => {
            state.agentText = event.target.value;
            if (state.agentThreadKey) state.agentDrafts[state.agentThreadKey] = state.agentText;
            scheduleSaveAgentThread();
            const sendBtn = document.querySelector(".tfcc-chat-send:not(.is-stop)");
            if (sendBtn && !state.agentRunning) sendBtn.disabled = !state.agentText.trim();
          },
          onKeydown: (event) => {
            if (canSend && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (!state.agentRunning) withLoading(sendAgentMessage);
            }
          },
        }),
        isScriptMode
          ? (state.agentRunning
              ? h("button", { class: "tfcc-chat-send is-stop", title: "停止", onClick: stopAgentMessage, text: "■" })
              : h("button", { class: "tfcc-chat-send", title: "发送 (⌘/Ctrl+Enter)", disabled: !state.agentText.trim(), onClick: () => withLoading(sendAgentMessage), text: "➤" }))
          : null,
        isAssetMode
          ? h("button", {
              class: "tfcc-chat-send",
              title: assetAction?.meta?.actionLabel || "资产提取中",
              disabled: !assetAction?.meta?.actionLabel || assetAction?.meta?.actionDisabled,
              onClick: () => withLoading(() => extractAssetsForScript(scriptId())),
              text: "➤",
            })
          : null,
      ].filter(Boolean)),
    ]);

    const composerHint = (isScriptMode || isAssetMode)
      ? composer
      : h("div", { class: "tfcc-chat-readonly", text: "当前模式支持查看节点上下文，生成动作在右侧节点详情中触发" });

    return h("aside", { class: "tfcc-agent tfcc-chat" }, [header, lockBanner, body, composerHint].filter(Boolean));
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

  function renderInspectorContent(node) {
    if (!node) return [h("div", { class: "tfcc-panel-title", text: "节点详情" }), h("div", { class: "tfcc-empty", text: "未选择节点" })];
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
    if (node.type === "asset") actions.push(h("button", { onClick: () => runNodeAction("assetImage"), text: "生成资产图" }));
    if (node.type === "storyboard") {
      actions.push(h("button", { onClick: () => runNodeAction("storyboardImage"), text: "生成分镜图" }));
      const sbFlowId = node.data?.storyboard?.flowId;
      actions.push(h("button", { class: "primary", title: sbFlowId ? "" : "尚未建立图片流", onClick: () => openFlowDrawer("storyboard", node.data?.storyboard?.id, sbFlowId, node.label), text: "展开图片流" }));
    }
    if (node.type === "videoPrompt") actions.push(h("button", { onClick: () => runNodeAction("videoPrompt"), text: "重生视频 Prompt" }));
    // 内容预览（组卡展示成员列表，其余展示来源内容预览）
    let preview = null;
    if (node.type === "assetGroup") {
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
        h("div", { class: "tfcc-select-wrap tfcc-select-ep" }, [
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
        ]),
      ]),
      h("nav", { class: "tfcc-tabs" }, VIEWS.map((view) => h("button", { class: state.view === view.key ? "is-active" : "", onClick: () => switchView(view.key), text: view.label }))),
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
      { key: "script", icon: "✎", title: "剧本 Agent" },
      { key: "asset", icon: "❏", title: "角色/场景/道具" },
      { key: "storyboard", icon: "▤", title: "分镜" },
    ];
    return h("nav", { class: "tfcc-rail" }, items.map((item) =>
      h("button", {
        class: `tfcc-rail-btn ${state.view === item.key ? "is-active" : ""}`,
        title: item.title,
        onClick: () => switchView(item.key),
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
    return h("div", { class: "tfcc-overlay" }, [
      renderHeader(),
      state.message ? h("div", { class: "tfcc-message", text: state.message }) : null,
      state.loading ? h("div", { class: "tfcc-loading", text: "Loading..." }) : null,
      h("div", { class: "tfcc-layout" }, [renderIconRail(), renderAgentPanel(), renderCanvas(), renderInspectorPanel()]),
      renderPromptMentionPicker(),
    ]);
  }

  function render() {
    document.querySelector(".tfcc-overlay")?.remove();
    const overlay = renderOverlay();
    if (overlay) document.body.appendChild(overlay);
  }

  function boot() {
    if (state.installed) return;
    state.installed = true;
    installEntry();
    window.addEventListener("hashchange", refreshEntryVisibility);
    const observer = new MutationObserver(() => installEntry());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

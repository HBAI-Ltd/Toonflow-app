(function () {
  "use strict";

  var ENTRY_ID = "tf-desk-compose-entry";
  var PROJECT_ENTRY_ID = "tf-desk-compose-project-entry";
  var FLOAT_ID = "tf-desk-compose-float";
  var PROJECT_FLOAT_ID = "tf-desk-compose-project-float";
  var PANEL_ID = "tf-desk-compose-panel";
  var CONTEXT_KEY = "toonflow-compose-desk-context";
  var POLL_INTERVAL_MS = 3000;
  var POLL_TICKS = 24;
  var MAX_CONTEXTS = 24;
  var DEMO_PROJECT_ID = 1781118846784;
  var DEMO_SCRIPT_ID = 1781118846785;
  var CUT_MARKERS = ["剪辑素材", "属性面板", "导出视频"];
  var CUT_TAB_MARKERS = ["视频", "媒体", "图片", "音频", "字幕", "转场", "特效", "滤镜"];

  var state = {
    open: false,
    loading: false,
    error: "",
    notice: "",
    context: null,
    contextSource: "",
    tracks: [],
    composeRecords: [],
    mergeRecords: [],
    hasLoaded: false,
    pollTimer: null,
    pollKind: "",
    pollRemaining: 0,
  };

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function toNumber(value) {
    if (value == null || value === "") return null;
    var num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  function normalizeToken(value) {
    if (value == null) return "";
    var text = String(value).trim();
    if (!text || text.length > 2000) return "";
    if ((text[0] === '"' && text[text.length - 1] === '"') || (text[0] === "'" && text[text.length - 1] === "'")) {
      text = text.slice(1, -1).trim();
    }
    return text;
  }

  function tokenFromObject(value, depth) {
    if (!value || depth > 4 || typeof value !== "object") return "";
    var fields = ["token", "accessToken", "access_token", "authorization", "Authorization"];
    for (var i = 0; i < fields.length; i += 1) {
      var direct = normalizeToken(value[fields[i]]);
      if (direct) return direct;
    }
    var keys = Object.keys(value).slice(0, 60);
    for (var j = 0; j < keys.length; j += 1) {
      var nested = tokenFromObject(value[keys[j]], depth + 1);
      if (nested) return nested;
    }
    return "";
  }

  function getAuthToken() {
    var exactKeys = ["token", "Authorization", "authorization", "accessToken", "access_token"];
    for (var i = 0; i < exactKeys.length; i += 1) {
      var direct = normalizeToken(localStorage.getItem(exactKeys[i]));
      if (direct) return direct;
    }
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index);
      if (!key) continue;
      var value = localStorage.getItem(key) || "";
      var lower = key.toLowerCase();
      if (lower.indexOf("token") !== -1 || lower.indexOf("authorization") !== -1) {
        var token = normalizeToken(value);
        if (token) return token;
      }
      if (value && value.length < 200000 && (value[0] === "{" || value[0] === "[")) {
        try {
          var nested = tokenFromObject(JSON.parse(value), 0);
          if (nested) return nested;
        } catch (error) {
          // Ignore non-JSON storage values.
        }
      }
    }
    return "";
  }

  async function apiPost(path, body) {
    var token = getAuthToken();
    var headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = token;
    var response = await fetch(path, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body || {}),
      credentials: "same-origin",
    });
    var text = await response.text();
    var payload = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        payload = null;
      }
    }
    if (!response.ok) {
      var httpMessage = payload && (payload.data || payload.message);
      throw new Error(String(httpMessage || "请求失败：" + response.status));
    }
    if (payload && payload.code && payload.code !== 200) {
      throw new Error(payload.message || payload.data || "请求失败");
    }
    return payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload;
  }

  function isProductionRoute() {
    return location.hash.indexOf("/production") !== -1;
  }

  function isProjectRoute() {
    return location.hash.indexOf("/project") !== -1;
  }

  function bodyText() {
    return document.body ? document.body.innerText || "" : "";
  }

  function isCutDeskOpen() {
    if (!isProductionRoute() || !document.body) return false;
    var text = bodyText();
    var hasMarkers = CUT_MARKERS.every(function (marker) {
      return text.indexOf(marker) !== -1;
    });
    var tabMatches = CUT_TAB_MARKERS.filter(function (marker) {
      return text.indexOf(marker) !== -1;
    }).length;
    return hasMarkers && tabMatches >= 5;
  }

  function isProjectDemoVisible() {
    return isProjectRoute() && bodyText().indexOf("视频合成演示项目") !== -1;
  }

  function isPanelAllowed() {
    return isCutDeskOpen() || isProjectDemoVisible();
  }

  function findExportButton() {
    return all("button, [role='button'], .t-button").find(function (element) {
      var text = (element.innerText || element.textContent || "").trim();
      return text.indexOf("导出视频") !== -1;
    });
  }

  function buildEntry() {
    var button = document.createElement("button");
    button.id = ENTRY_ID;
    button.type = "button";
    button.className = "tf-desk-entry";
    button.textContent = "合成任务";
    button.title = "查看合成任务并执行首条轨道合成或整集拼接";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      state.open = !state.open;
      if (state.open && !state.hasLoaded) {
        loadAutoContext();
      } else {
        renderPanel();
      }
      syncEntry();
    });
    return button;
  }

  function buildProjectEntry() {
    var button = document.createElement("button");
    button.id = PROJECT_ENTRY_ID;
    button.type = "button";
    button.className = "tf-desk-entry tf-desk-project-entry";
    button.textContent = "合成演示";
    button.title = "打开演示项目的合成任务面板";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      state.open = !state.open;
      if (state.open && !state.hasLoaded) {
        loadAutoContext();
      } else {
        renderPanel();
      }
      syncEntry();
    });
    return button;
  }

  function ensurePanel() {
    var panel = $("#" + PANEL_ID);
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.className = "tf-desk-panel";
    document.body.appendChild(panel);
    return panel;
  }

  function removeEntry() {
    var entry = $("#" + ENTRY_ID);
    if (entry) entry.remove();
    var float = $("#" + FLOAT_ID);
    if (float) float.remove();
  }

  function removeProjectEntry() {
    var entry = $("#" + PROJECT_ENTRY_ID);
    if (entry) entry.remove();
    var float = $("#" + PROJECT_FLOAT_ID);
    if (float) float.remove();
  }

  function ensureProjectEntry() {
    if (!isProjectDemoVisible()) {
      removeProjectEntry();
      if (!isCutDeskOpen()) {
        state.open = false;
        stopPolling();
        renderPanel();
      }
      return;
    }
    ensurePanel();
    var entry = $("#" + PROJECT_ENTRY_ID) || buildProjectEntry();
    if (!$("#" + PROJECT_FLOAT_ID)) {
      var wrapper = document.createElement("div");
      wrapper.id = PROJECT_FLOAT_ID;
      wrapper.className = "tf-desk-project-float-entry";
      wrapper.appendChild(entry);
      document.body.appendChild(wrapper);
    }
    syncEntry();
  }

  function ensureEntry() {
    if (!isCutDeskOpen()) {
      removeEntry();
      if (!isProjectDemoVisible()) {
        state.open = false;
        stopPolling();
        renderPanel();
      }
      return;
    }
    removeProjectEntry();
    ensurePanel();
    var entry = $("#" + ENTRY_ID) || buildEntry();
    var exportButton = findExportButton();
    if (exportButton && exportButton.parentElement) {
      var float = $("#" + FLOAT_ID);
      if (float) float.remove();
      if (entry.parentElement !== exportButton.parentElement || entry.nextSibling !== exportButton) {
        exportButton.parentElement.insertBefore(entry, exportButton);
      }
    } else {
      if (entry.parentElement) entry.remove();
      if (!$("#" + FLOAT_ID)) {
        var wrapper = document.createElement("div");
        wrapper.id = FLOAT_ID;
        wrapper.className = "tf-desk-float-entry";
        wrapper.appendChild(entry);
        document.body.appendChild(wrapper);
      }
    }
    syncEntry();
  }

  function syncEntry() {
    var entry = $("#" + ENTRY_ID);
    if (entry) entry.classList.toggle("is-open", state.open);
    var projectEntry = $("#" + PROJECT_ENTRY_ID);
    if (projectEntry) projectEntry.classList.toggle("is-open", state.open);
  }

  function contextName(context, type) {
    if (!context) return "未识别";
    var id = type === "project" ? context.projectId : context.scriptId;
    var name = type === "project" ? context.projectName : context.scriptName;
    if (name && id != null) return name + "（" + id + "）";
    if (id != null) return String(id);
    return "未识别";
  }

  function renderPanel() {
    var panel = ensurePanel();
    var visible = state.open && isPanelAllowed();
    panel.classList.toggle("is-open", visible);
    if (!visible) return;
    var context = state.context;
    var first = findFirstTrackCandidate(state.tracks);
    var disabled = state.loading || !context;
    panel.innerHTML =
      '<div class="tf-desk-head">' +
      '<div class="tf-desk-title">合成任务</div>' +
      '<button type="button" class="tf-desk-close" data-tf-desk-action="close" aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="tf-desk-body">' +
      renderContext(context, first) +
      renderMessages() +
      '<div class="tf-desk-actions">' +
      '<button type="button" class="tf-desk-btn" data-tf-desk-action="refresh" ' + (state.loading ? "disabled" : "") + ">刷新</button>" +
      '<button type="button" class="tf-desk-btn primary" data-tf-desk-action="compose-first" ' + (disabled ? "disabled" : "") + ">合成首条可用轨道</button>" +
      '<button type="button" class="tf-desk-btn primary" data-tf-desk-action="merge" ' + (disabled ? "disabled" : "") + ">整集拼接</button>" +
      "</div>" +
      renderTrackHint(first) +
      renderRecords("合成记录", state.composeRecords, renderComposeRecord) +
      renderRecords("整集拼接记录", state.mergeRecords, renderMergeRecord) +
      "</div>";
  }

  function renderContext(context, first) {
    var source = context ? state.contextSource || context.source || "已识别" : "等待识别";
    var tokenText = getAuthToken() ? "已检测" : "未检测";
    var trackText = first ? "轨道 " + first.trackId + " / 视频 " + first.videoId : "未找到";
    return (
      '<div class="tf-desk-context">' +
      '<div class="tf-desk-label">当前项目</div><div class="tf-desk-value">' + escapeHtml(contextName(context, "project")) + "</div>" +
      '<div class="tf-desk-label">当前剧集</div><div class="tf-desk-value">' + escapeHtml(contextName(context, "script")) + "</div>" +
      '<div class="tf-desk-label">上下文来源</div><div class="tf-desk-value">' + escapeHtml(source) + "</div>" +
      '<div class="tf-desk-label">首条可用轨道</div><div class="tf-desk-value">' + escapeHtml(trackText) + "</div>" +
      '<div class="tf-desk-label">Authorization</div><div class="tf-desk-value">' + escapeHtml(tokenText) + "</div>" +
      "</div>"
    );
  }

  function renderMessages() {
    var html = "";
    if (state.error) {
      html += '<div class="tf-desk-msg error">' + escapeHtml(state.error) + "</div>";
    }
    if (state.loading || state.notice || state.pollRemaining > 0) {
      var text = state.loading ? "正在处理..." : state.notice || "";
      if (state.pollRemaining > 0) {
        text += (text ? "，" : "") + "自动刷新 " + state.pollRemaining + " 次";
      }
      html += '<div class="tf-desk-msg">' + escapeHtml(text) + "</div>";
    }
    return html;
  }

  function renderTrackHint(first) {
    if (!state.context) {
      return '<div class="tf-desk-section"><div class="tf-desk-section-title">轨道检查</div><div class="tf-desk-empty">打开后会读取当前项目/剧集上下文。</div></div>';
    }
    if (!first) {
      return '<div class="tf-desk-section"><div class="tf-desk-section-title">轨道检查</div><div class="tf-desk-empty">未找到同时带有 src 和 id 的视频候选。</div></div>';
    }
    var selectedText = first.hasSelectedVideo ? "已选视频" : "将先自动绑定候选视频";
    return (
      '<div class="tf-desk-section">' +
      '<div class="tf-desk-section-title">轨道检查<span class="tf-desk-pill ok">' + escapeHtml(selectedText) + "</span></div>" +
      '<div class="tf-desk-item">' +
      '<div class="tf-desk-item-head"><strong>轨道 ' + escapeHtml(first.trackId) + "</strong><span>视频 " + escapeHtml(first.videoId) + "</span></div>" +
      '<div class="tf-desk-muted">' + escapeHtml(shortText(first.video.src, 96)) + "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function renderRecords(title, records, renderer) {
    var count = records && records.length ? records.length : 0;
    return (
      '<div class="tf-desk-section">' +
      '<div class="tf-desk-section-title">' + escapeHtml(title) + '<span class="tf-desk-muted">' + count + "</span></div>" +
      (count ? records.slice(0, 6).map(renderer).join("") : '<div class="tf-desk-empty">暂无记录。</div>') +
      "</div>"
    );
  }

  function renderComposeRecord(record) {
    return (
      '<div class="tf-desk-item">' +
      '<div class="tf-desk-item-head"><div><strong>#' + escapeHtml(record.id) + "</strong> 轨道 " + escapeHtml(record.trackId || "-") + renderState(record.state) + "</div>" +
      renderLink(record.fileUrl) +
      "</div>" +
      '<div class="tf-desk-muted">视频ID：' + escapeHtml(record.videoId || "-") + "，创建：" + escapeHtml(formatTime(record.createTime)) + "</div>" +
      renderError(record.errorReason) +
      "</div>"
    );
  }

  function renderMergeRecord(record) {
    return (
      '<div class="tf-desk-item">' +
      '<div class="tf-desk-item-head"><div><strong>#' + escapeHtml(record.id) + "</strong>" + renderState(record.state) + "</div>" +
      renderLink(record.fileUrl) +
      "</div>" +
      '<div class="tf-desk-muted">时长：' + escapeHtml(formatDuration(record.duration)) + "，创建：" + escapeHtml(formatTime(record.createTime)) + "</div>" +
      renderError(record.errorReason) +
      "</div>"
    );
  }

  function renderState(value) {
    var text = String(value || "未知");
    var className = text.indexOf("中") !== -1 ? "warn" : text.indexOf("失败") !== -1 ? "warn" : "ok";
    return '<span class="tf-desk-pill ' + className + '">' + escapeHtml(text) + "</span>";
  }

  function renderLink(url) {
    if (!url) return '<span class="tf-desk-muted">暂无文件</span>';
    return '<a class="tf-desk-link" href="' + escapeAttr(url) + '" target="_blank" rel="noreferrer">打开</a>';
  }

  function renderError(reason) {
    return reason ? '<div class="tf-desk-msg error">' + escapeHtml(reason) + "</div>" : "";
  }

  function shortText(text, maxLength) {
    var value = String(text || "").replace(/\s+/g, " ").trim();
    return value.length > maxLength ? value.slice(0, maxLength - 1) + "..." : value;
  }

  function formatDuration(value) {
    var seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0) return "-";
    if (seconds > 10000) seconds = seconds / 1000;
    var mins = Math.floor(seconds / 60);
    var secs = Math.round(seconds % 60);
    return mins ? mins + "m " + secs + "s" : secs + "s";
  }

  function formatTime(value) {
    var num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "-";
    try {
      return new Date(num).toLocaleString();
    } catch (error) {
      return "-";
    }
  }

  function normalizeArray(value) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.list)) return value.list;
    if (value && Array.isArray(value.rows)) return value.rows;
    if (value && Array.isArray(value.records)) return value.records;
    return [];
  }

  function normalizeTracks(data) {
    if (!data) return [];
    return normalizeArray(data.trackList || data.tracks || data.videoTracks || []);
  }

  function videoSrc(video) {
    return video && (video.src || video.fileUrl || video.url || video.filePath || "");
  }

  function videoId(video) {
    return toNumber(video && (video.id || video.videoId || video.assetId));
  }

  function trackId(track) {
    return toNumber(track && (track.id || track.trackId || track.videoTrackId));
  }

  function selectedVideoId(track) {
    return toNumber(track && (track.selectVideoId || track.selectedVideoId || track.videoId));
  }

  function hasSelectedVideo(track) {
    var id = selectedVideoId(track);
    return id != null && id !== 0;
  }

  function collectVideos(track) {
    var lists = [track && track.videoList, track && track.videos, track && track.videoCandidates, track && track.candidates];
    var result = [];
    var seen = {};
    lists.forEach(function (list) {
      normalizeArray(list).forEach(function (video) {
        var id = videoId(video);
        var src = videoSrc(video);
        var key = String(id || "") + ":" + src;
        if (id != null && src && !seen[key]) {
          seen[key] = true;
          result.push(video);
        }
      });
    });
    return result;
  }

  function findFirstTrackCandidate(tracks) {
    var list = normalizeArray(tracks);
    for (var i = 0; i < list.length; i += 1) {
      var track = list[i];
      var id = trackId(track);
      if (id == null) continue;
      var videos = collectVideos(track);
      for (var j = 0; j < videos.length; j += 1) {
        var candidate = videos[j];
        var candidateId = videoId(candidate);
        if (candidateId == null || !videoSrc(candidate)) continue;
        return {
          track: track,
          trackId: id,
          video: candidate,
          videoId: candidateId,
          hasSelectedVideo: hasSelectedVideo(track),
        };
      }
    }
    return null;
  }

  async function loadAutoContext() {
    state.loading = true;
    state.error = "";
    state.notice = "";
    renderPanel();
    try {
      var candidates = await collectContextCandidates();
      var loaded = await loadBestContext(candidates);
      if (!loaded) throw new Error("未能识别当前项目/剧集，也没有找到可用项目脚本。");
      state.hasLoaded = true;
      state.notice = state.contextSource === "demo fallback" ? "未从前端状态识别到剧集，已回退到 demo 数据。" : "已载入合成任务数据。";
    } catch (error) {
      state.error = error.message || String(error);
    } finally {
      state.loading = false;
      renderPanel();
      syncEntry();
    }
  }

  async function collectContextCandidates() {
    var candidates = [];
    addContext(candidates, readStoredContext(), "上次面板", "local");
    addContext(candidates, readUrlContext(), "URL", "local");
    readLocalStorageContexts().forEach(function (context) {
      addContext(candidates, context, "localStorage", "local");
    });
    try {
      var apiContexts = await readApiContexts();
      apiContexts.forEach(function (context) {
        addContext(candidates, context, context.source || "项目列表", "api");
      });
    } catch (error) {
      if (!candidates.length) throw error;
    }
    addContext(candidates, { projectId: DEMO_PROJECT_ID, scriptId: DEMO_SCRIPT_ID }, "demo fallback", "demo");
    return dedupeContexts(candidates).slice(0, MAX_CONTEXTS);
  }

  function addContext(list, context, source, origin) {
    if (!context) return;
    var projectId = toNumber(context.projectId);
    var scriptId = toNumber(context.scriptId);
    if (projectId == null || scriptId == null) return;
    list.push({
      projectId: projectId,
      scriptId: scriptId,
      projectName: context.projectName || context.project || "",
      scriptName: context.scriptName || context.script || "",
      source: context.source || source,
      origin: origin || context.origin || "unknown",
    });
  }

  function dedupeContexts(list) {
    var seen = {};
    return list.filter(function (context) {
      var key = context.projectId + ":" + context.scriptId;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function readStoredContext() {
    try {
      return JSON.parse(localStorage.getItem(CONTEXT_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function readUrlContext() {
    var text = location.href;
    var projectMatch = text.match(/[?&#](?:projectId|project)=([0-9]+)/i);
    var scriptMatch = text.match(/[?&#](?:scriptId|script)=([0-9]+)/i);
    if (!projectMatch || !scriptMatch) return null;
    return { projectId: projectMatch[1], scriptId: scriptMatch[1] };
  }

  function readLocalStorageContexts() {
    var contexts = [];
    for (var index = 0; index < localStorage.length; index += 1) {
      var key = localStorage.key(index);
      var value = key ? localStorage.getItem(key) || "" : "";
      if (!value || value.length > 300000) continue;
      scanContextText(key + " " + value, contexts);
      if (value[0] === "{" || value[0] === "[") {
        try {
          scanContextObject(JSON.parse(value), contexts, 0);
        } catch (error) {
          // Ignore non-JSON storage values.
        }
      }
    }
    return contexts;
  }

  function scanContextText(text, contexts) {
    var projectMatch = text.match(/projectId["'\s:=]+([0-9]+)/i);
    var scriptMatch = text.match(/scriptId["'\s:=]+([0-9]+)/i);
    if (projectMatch && scriptMatch) {
      contexts.push({ projectId: projectMatch[1], scriptId: scriptMatch[1] });
    }
  }

  function scanContextObject(value, contexts, depth) {
    if (!value || depth > 5) return;
    if (Array.isArray(value)) {
      value.slice(0, 50).forEach(function (item) {
        scanContextObject(item, contexts, depth + 1);
      });
      return;
    }
    if (typeof value !== "object") return;
    if (value.projectId != null && value.scriptId != null) {
      contexts.push({
        projectId: value.projectId,
        scriptId: value.scriptId,
        projectName: value.projectName || "",
        scriptName: value.scriptName || "",
      });
    }
    Object.keys(value)
      .slice(0, 80)
      .forEach(function (key) {
        scanContextObject(value[key], contexts, depth + 1);
      });
  }

  async function readApiContexts() {
    var projects = normalizeArray(await apiPost("/api/project/getProject", {}));
    var text = bodyText();
    var contexts = [];
    projects
      .slice()
      .sort(function (a, b) {
        return scoreName(text, b.name) - scoreName(text, a.name) || Number(b.id || 0) - Number(a.id || 0);
      })
      .slice(0, 12)
      .forEach(function (project) {
        contexts.push({ project: project });
      });

    var result = [];
    for (var i = 0; i < contexts.length && result.length < MAX_CONTEXTS; i += 1) {
      var projectItem = contexts[i].project;
      var projectId = toNumber(projectItem && projectItem.id);
      if (projectId == null) continue;
      var scripts = normalizeArray(await apiPost("/api/script/getScrptApi", { projectId: projectId }));
      scripts
        .slice()
        .sort(function (a, b) {
          return scoreName(text, b.name) - scoreName(text, a.name) || Number(a.id || 0) - Number(b.id || 0);
        })
        .forEach(function (script) {
          var scriptId = toNumber(script && script.id);
          if (scriptId == null || result.length >= MAX_CONTEXTS) return;
          result.push({
            projectId: projectId,
            scriptId: scriptId,
            projectName: projectItem.name || "",
            scriptName: script.name || "",
            source: scoreName(text, projectItem.name) || scoreName(text, script.name) ? "页面匹配" : "项目列表",
            origin: "api",
          });
        });
    }
    return result;
  }

  function scoreName(text, name) {
    return name && text.indexOf(String(name)) !== -1 ? 1 : 0;
  }

  async function loadBestContext(candidates) {
    var firstApiLoad = null;
    var firstAnyLoad = null;
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = candidates[i];
      try {
        var loaded = await loadContext(candidate);
        if (!firstAnyLoad) firstAnyLoad = loaded;
        if (candidate.origin === "api" && !firstApiLoad) firstApiLoad = loaded;
        if (loaded.tracks.length || candidate.origin === "local" || candidate.origin === "demo") return loaded;
      } catch (error) {
        if (/token|登录|401|403/i.test(error.message || "")) throw error;
      }
    }
    return firstApiLoad || firstAnyLoad;
  }

  async function loadContext(context) {
    var projectId = toNumber(context.projectId);
    var scriptId = toNumber(context.scriptId);
    if (projectId == null || scriptId == null) throw new Error("项目或剧集 ID 无效。");
    var generateData = await apiPost("/api/production/workbench/getGenerateData", { projectId: projectId, scriptId: scriptId });
    state.context = {
      projectId: projectId,
      scriptId: scriptId,
      projectName: context.projectName || "",
      scriptName: context.scriptName || "",
      source: context.source || "",
    };
    state.contextSource = context.source || "";
    state.tracks = normalizeTracks(generateData);
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(state.context));
    await refreshRecords();
    return { context: state.context, tracks: state.tracks };
  }

  async function refreshRecords() {
    if (!state.context) return;
    var body = { projectId: state.context.projectId, scriptId: state.context.scriptId };
    var compose = await apiPost("/api/production/workbench/getComposeList", body);
    var merge = await apiPost("/api/production/workbench/getMergeList", body);
    state.composeRecords = normalizeArray(compose);
    state.mergeRecords = normalizeArray(merge);
  }

  async function refreshAll() {
    state.loading = true;
    state.error = "";
    renderPanel();
    try {
      if (state.context) {
        await loadContext({
          projectId: state.context.projectId,
          scriptId: state.context.scriptId,
          projectName: state.context.projectName,
          scriptName: state.context.scriptName,
          source: state.contextSource || "当前上下文",
        });
      } else {
        await loadAutoContext();
        if (!state.context) return;
      }
      state.hasLoaded = true;
      state.notice = "已刷新合成/拼接记录。";
    } catch (error) {
      state.error = error.message || String(error);
    } finally {
      state.loading = false;
      renderPanel();
    }
  }

  async function composeFirstAvailableTrack() {
    state.loading = true;
    state.error = "";
    state.notice = "";
    renderPanel();
    try {
      if (!state.context) await loadAutoContext();
      if (!state.context) throw new Error("缺少项目/剧集上下文。");
      var generateData = await apiPost("/api/production/workbench/getGenerateData", {
        projectId: state.context.projectId,
        scriptId: state.context.scriptId,
      });
      state.tracks = normalizeTracks(generateData);
      var first = findFirstTrackCandidate(state.tracks);
      if (!first) throw new Error("未找到带 src/id 的视频候选，需先完成视频生成。");
      if (!first.hasSelectedVideo) {
        await apiPost("/api/production/workbench/selectVideo", { trackId: first.trackId, videoId: first.videoId });
        first.track.selectVideoId = first.videoId;
      }
      var result = await apiPost("/api/production/workbench/composeVideo", {
        projectId: state.context.projectId,
        scriptId: state.context.scriptId,
        trackIds: [first.trackId],
      });
      state.notice = result && result.message ? result.message : "合成任务已加入队列。";
      await refreshRecords();
      startPolling("compose");
    } catch (error) {
      state.error = error.message || String(error);
    } finally {
      state.loading = false;
      renderPanel();
    }
  }

  async function mergeEpisode() {
    state.loading = true;
    state.error = "";
    state.notice = "";
    renderPanel();
    try {
      if (!state.context) await loadAutoContext();
      if (!state.context) throw new Error("缺少项目/剧集上下文。");
      var result = await apiPost("/api/production/workbench/mergeEpisode", {
        projectId: state.context.projectId,
        scriptId: state.context.scriptId,
      });
      state.notice = result && result.message ? result.message : "整集拼接任务已加入队列。";
      await refreshRecords();
      startPolling("merge");
    } catch (error) {
      state.error = error.message || String(error);
    } finally {
      state.loading = false;
      renderPanel();
    }
  }

  function startPolling(kind) {
    stopPolling();
    state.pollKind = kind;
    state.pollRemaining = POLL_TICKS;
    state.pollTimer = window.setInterval(async function () {
      if (!state.context || !isPanelAllowed()) {
        stopPolling();
        renderPanel();
        return;
      }
      state.pollRemaining -= 1;
      try {
        if (kind === "compose") {
          state.composeRecords = normalizeArray(
            await apiPost("/api/production/workbench/getComposeList", {
              projectId: state.context.projectId,
              scriptId: state.context.scriptId,
            }),
          );
        } else {
          state.mergeRecords = normalizeArray(
            await apiPost("/api/production/workbench/getMergeList", {
              projectId: state.context.projectId,
              scriptId: state.context.scriptId,
            }),
          );
        }
      } catch (error) {
        state.error = error.message || String(error);
        stopPolling();
      }
      if (state.pollRemaining <= 0 || (state.pollRemaining < POLL_TICKS - 1 && !hasRunningRecords(kind))) {
        stopPolling();
      }
      renderPanel();
    }, POLL_INTERVAL_MS);
  }

  function stopPolling() {
    if (state.pollTimer) window.clearInterval(state.pollTimer);
    state.pollTimer = null;
    state.pollKind = "";
    state.pollRemaining = 0;
  }

  function hasRunningRecords(kind) {
    var records = kind === "merge" ? state.mergeRecords : state.composeRecords;
    return normalizeArray(records).some(function (record) {
      return /中|queued|pending|running|processing/i.test(String(record.state || ""));
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target && event.target.closest ? event.target.closest("[data-tf-desk-action]") : null;
    if (!target || !$("#" + PANEL_ID) || !$("#" + PANEL_ID).contains(target)) return;
    var action = target.getAttribute("data-tf-desk-action");
    if (action === "close") {
      state.open = false;
      renderPanel();
      syncEntry();
    } else if (action === "refresh") {
      refreshAll();
    } else if (action === "compose-first") {
      composeFirstAvailableTrack();
    } else if (action === "merge") {
      mergeEpisode();
    }
  });

  function tick() {
    ensureEntry();
    ensureProjectEntry();
  }

  function boot() {
    ensurePanel();
    tick();
    var timer = null;
    var observer = new MutationObserver(function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", function () {
      state.open = false;
      stopPolling();
      tick();
    });
    window.setInterval(tick, 1500);
    window.__toonflowComposeDesk = {
      state: state,
      isCutDeskOpen: isCutDeskOpen,
      refresh: tick,
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

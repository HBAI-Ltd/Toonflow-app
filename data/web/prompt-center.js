(function () {
  const GROUPS = [
    { key: "agent", label: "Agent Prompt" },
    { key: "function", label: "功能 Prompt" },
    { key: "video", label: "视频模型 Prompt" },
    { key: "skill", label: "风格/故事 Skill" },
  ];

  const state = {
    installed: false,
    active: false,
    group: "agent",
    items: null,
    selected: null,
    effective: null,
    versions: [],
    testResult: null,
    content: "",
    note: "",
    loading: false,
    message: "",
  };
  let rendering = false;

  function apiBase() {
    let base = `${location.origin || "http://localhost:10588"}/api`;
    try {
      const raw = localStorage.getItem("setting");
      const parsed = raw ? JSON.parse(raw) : null;
      const stored = parsed?.baseUrl || parsed?.state?.baseUrl;
      if (typeof stored === "string" && stored.trim()) base = stored.trim();
    } catch {
      // Keep the same-origin fallback.
    }
    return base.replace(/\/+$/, "");
  }

  function api(path, options = {}) {
    const token = localStorage.getItem("token") || "";
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

  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === false) return;
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key === "title") el.title = value;
      else if (key === "disabled") el.disabled = Boolean(value);
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value);
      else el.setAttribute(key, String(value));
    });
    (Array.isArray(children) ? children : [children]).forEach((child) => {
      if (child === undefined || child === null) return;
      el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return el;
  }

  function compactHash(hash) {
    return hash ? `${hash.slice(0, 12)}...${hash.slice(-8)}` : "-";
  }

  function formatTime(value) {
    if (!value) return "-";
    const date = new Date(Number(value));
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString();
  }

  function descriptor(item) {
    if (!item) return null;
    return {
      scope: item.scope,
      key: item.key,
      sourcePath: item.sourcePath,
      promptType: item.promptType,
      vendorId: item.vendorId,
      model: item.model,
      mode: item.mode,
    };
  }

  function itemTitle(item) {
    if (!item) return "";
    if (item.scope === "function") return item.name || item.key;
    if (item.scope === "videoModel") return `${item.vendorName || item.vendorId || ""} / ${item.name || item.model || item.key}`;
    return item.sourcePath || item.key;
  }

  function itemMeta(item) {
    if (!item) return "";
    if (item.scope === "function") return `type: ${item.promptType || item.key}`;
    if (item.scope === "videoModel") return `model: ${item.model || "-"} | mode: ${item.mode || "text"} | ${item.sourcePath || "auto/fallback"}`;
    if (item.scope === "modelPrompt") return "modelPrompt file";
    return item.key || item.scope;
  }

  function groupItems() {
    if (!state.items) return [];
    if (state.group === "video") {
      return [...(state.items.videoModel || []), ...(state.items.modelPrompt || [])];
    }
    return state.items[state.group] || [];
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

  async function loadList() {
    await withLoading(async () => {
      state.items = await api("/setting/promptCenter/list");
      const list = groupItems();
      if (!state.selected && list.length) await selectItem(list[0], false);
    });
  }

  async function selectItem(item, shouldRender = true) {
    state.selected = item;
    state.effective = null;
    state.versions = [];
    state.testResult = null;
    if (shouldRender) render();
    const input = descriptor(item);
    state.effective = await api("/setting/promptCenter/getEffective", { method: "POST", body: input });
    state.content = state.effective.content || "";
    state.note = "";
    state.versions = await api("/setting/promptCenter/getVersions", {
      method: "POST",
      body: { scope: state.effective.scope, key: state.effective.key },
    });
  }

  async function switchGroup(group) {
    state.group = group;
    state.selected = null;
    state.effective = null;
    state.versions = [];
    state.testResult = null;
    const list = groupItems();
    if (list.length) await withLoading(() => selectItem(list[0], false));
    else render();
  }

  async function saveDraft() {
    if (!state.effective) return;
    await withLoading(async () => {
      await api("/setting/promptCenter/createDraft", {
        method: "POST",
        body: {
          scope: state.effective.scope,
          key: state.effective.key,
          sourceType: state.effective.sourceType,
          sourcePath: state.effective.sourcePath || null,
          promptType: state.effective.promptType || null,
          content: state.content,
          note: state.note || null,
        },
      });
      state.message = "草稿已保存，当前生效内容未改变";
      state.versions = await api("/setting/promptCenter/getVersions", {
        method: "POST",
        body: { scope: state.effective.scope, key: state.effective.key },
      });
    });
  }

  async function publishVersion(version) {
    if (!state.effective || !version) return;
    await withLoading(async () => {
      const path = version.status === "archived" ? "/setting/promptCenter/rollback" : "/setting/promptCenter/publish";
      await api(path, { method: "POST", body: { versionId: Number(version.id) } });
      state.message = version.status === "archived" ? "已回滚到所选版本" : "版本已发布";
      await selectItem(state.selected, false);
    });
  }

  async function runTest() {
    if (!state.selected) return;
    await withLoading(async () => {
      state.testResult = await api("/setting/promptCenter/runTest", {
        method: "POST",
        body: { ...descriptor(state.selected), content: state.content },
      });
    });
  }

  async function seedBaseline() {
    await withLoading(async () => {
      const result = await api("/setting/promptCenter/seedBaseline", { method: "POST", body: {} });
      state.message = `已登记基线 ${result.created} 条，跳过 ${result.skipped} 条，失败 ${result.failed.length} 条`;
      if (state.selected) await selectItem(state.selected, false);
    });
  }

  function renderMenuItem() {
    const menu = document.querySelector(".settingMenu .t-menu");
    if (!menu || menu.querySelector(".tfpc-menu-item")) return;
    const item = h("li", { class: "t-menu__item tfpc-menu-item", onClick: openPromptCenter }, [
      h("span", { class: "tfpc-menu-icon" }),
      h("span", { text: "Prompt Center" }),
    ]);
    const promptMenu = [...menu.querySelectorAll(".t-menu__item")].find((el) => el.textContent.trim() === "提示词管理");
    if (promptMenu && promptMenu.nextSibling) menu.insertBefore(item, promptMenu.nextSibling);
    else menu.appendChild(item);
  }

  function openPromptCenter(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    state.active = true;
    document.querySelectorAll(".settingMenu .t-menu__item").forEach((el) => el.classList.remove("t-is-active"));
    document.querySelector(".tfpc-menu-item")?.classList.add("t-is-active");
    const title = document.querySelector(".sectionTitle");
    if (title) title.textContent = "Prompt Center";
    render();
    if (!state.items) loadList();
  }

  function deactivateOnNativeMenuClick(event) {
    const custom = event.target.closest(".tfpc-menu-item");
    if (custom) return;
    if (event.target.closest(".settingMenu .t-menu__item")) state.active = false;
  }

  function render() {
    if (!state.active || rendering) return;
    const content = document.querySelector(".settingContent");
    const title = document.querySelector(".sectionTitle");
    if (!content) return;
    if (title) title.textContent = "Prompt Center";
    rendering = true;
    content.replaceChildren(renderRoot());
    rendering = false;
  }

  function renderRoot() {
    const root = h("div", { class: "tfpc" });
    root.appendChild(renderTabs());
    if (state.message) root.appendChild(h("div", { class: "tfpc-card tfpc-muted", text: state.message }));
    root.appendChild(h("div", { class: "tfpc-layout" }, [renderList(), renderDetail()]));
    return root;
  }

  function renderTabs() {
    return h("div", { class: "tfpc-tabs" }, [
      ...GROUPS.map((group) =>
        h("button", {
          class: `tfpc-tab${state.group === group.key ? " is-active" : ""}`,
          text: group.label,
          onClick: () => switchGroup(group.key),
        }),
      ),
      h("button", { class: "tfpc-btn", text: "登记基线", disabled: state.loading, onClick: seedBaseline }),
    ]);
  }

  function renderList() {
    const list = groupItems();
    if (!list.length) return h("aside", { class: "tfpc-list" }, h("div", { class: "tfpc-empty", text: state.loading ? "加载中..." : "暂无条目" }));
    return h("aside", { class: "tfpc-list" }, list.map((item) =>
      h("div", {
        class: `tfpc-list-item${state.selected === item ? " is-active" : ""}`,
        onClick: () => withLoading(() => selectItem(item, false)),
      }, [
        h("div", { class: "tfpc-list-title", text: itemTitle(item) }),
        h("div", { class: "tfpc-list-meta", text: itemMeta(item) }),
      ]),
    ));
  }

  function renderDetail() {
    if (state.loading && !state.effective) return h("main", { class: "tfpc-detail" }, h("div", { class: "tfpc-empty", text: "加载中..." }));
    if (!state.selected) return h("main", { class: "tfpc-detail" }, h("div", { class: "tfpc-empty", text: "请选择一个 Prompt 条目" }));
    if (!state.effective) return h("main", { class: "tfpc-detail" }, h("div", { class: "tfpc-empty", text: "正在解析生效 Prompt..." }));

    const textarea = h("textarea", { class: "tfpc-textarea" });
    textarea.value = state.content;
    textarea.addEventListener("input", () => {
      state.content = textarea.value;
    });
    const note = h("input", { class: "tfpc-note", placeholder: "版本备注" });
    note.value = state.note;
    note.addEventListener("input", () => {
      state.note = note.value;
    });

    return h("main", { class: "tfpc-detail" }, [
      renderEffectiveCard(),
      h("div", { class: "tfpc-card" }, [
        h("div", { class: "tfpc-actions" }, [
          note,
          h("button", { class: "tfpc-btn primary", text: "保存草稿", disabled: state.loading, onClick: saveDraft }),
          h("button", { class: "tfpc-btn", text: "运行测试", disabled: state.loading, onClick: runTest }),
        ]),
        h("div", { style: "height:8px" }),
        textarea,
      ]),
      renderTestResult(),
      renderVersions(),
    ]);
  }

  function renderEffectiveCard() {
    const e = state.effective;
    const rows = [
      ["sourceType", e.sourceType || "-"],
      ["source", e.sourcePath || e.promptType || "-"],
      ["hash", e.hash || "-"],
      ["version", e.versionId ? `active #${e.versionId}` : e.activeVersionId ? `hash mismatch, active #${e.activeVersionId}` : "unversioned"],
    ];
    const kv = h("div", { class: "tfpc-kv" }, rows.flatMap(([label, value]) => [
      h("div", { class: "tfpc-kv-label", text: label }),
      h("div", { class: "tfpc-code", title: value, text: label === "hash" ? compactHash(value) : value }),
    ]));
    const trace = h("ul", { class: "tfpc-trace" }, (e.fallbackTrace || []).map((item) =>
      h("li", { text: `${item.found ? "OK" : "MISS"} ${item.message}${item.sourcePath ? ` | ${item.sourcePath}` : ""}${item.promptType ? ` | ${item.promptType}` : ""}` }),
    ));
    return h("div", { class: "tfpc-card" }, [
      kv,
      h("div", { class: "tfpc-muted", style: "margin-top:10px", text: "fallbackTrace" }),
      trace,
    ]);
  }

  function renderTestResult() {
    if (!state.testResult) return h("div");
    return h("div", { class: "tfpc-card" }, [
      h("div", {
        class: state.testResult.passed ? "tfpc-test-pass tfpc-status" : "tfpc-test-fail tfpc-status",
        text: state.testResult.passed ? "测试通过" : "测试失败",
      }),
      h("ul", { class: "tfpc-checks" }, (state.testResult.checks || []).map((check) =>
        h("li", { text: `${check.passed ? "OK" : "FAIL"} ${check.name}: ${check.message}` }),
      )),
    ]);
  }

  function renderVersions() {
    const header = h("tr", {}, ["ID", "状态", "hash", "备注", "创建时间", "发布时间", "操作"].map((text) => h("th", { text })));
    const rows = (state.versions || []).map((version) => h("tr", {}, [
      h("td", { text: String(version.id) }),
      h("td", {}, h("span", { class: `tfpc-status ${version.status}`, text: version.status })),
      h("td", { class: "tfpc-code", title: version.hash || "", text: compactHash(version.hash || "") }),
      h("td", { text: version.note || "-" }),
      h("td", { text: formatTime(version.createTime) }),
      h("td", { text: formatTime(version.publishTime) }),
      h("td", {}, version.status === "active" ? h("span", { class: "tfpc-muted", text: "当前生效" }) : h("button", {
        class: "tfpc-btn",
        text: version.status === "archived" ? "回滚" : "发布",
        disabled: state.loading,
        onClick: () => publishVersion(version),
      })),
    ]));
    return h("div", { class: "tfpc-card" }, [
      h("div", { class: "tfpc-actions" }, [
        h("strong", { text: "版本记录" }),
        h("span", { class: "tfpc-muted", text: `${(state.versions || []).length} 条` }),
      ]),
      h("table", { class: "tfpc-table" }, [h("thead", {}, header), h("tbody", {}, rows)]),
    ]);
  }

  function install() {
    const panel = document.querySelector(".settingPanel");
    if (!panel) return;
    renderMenuItem();
    if (!state.installed) {
      state.installed = true;
      document.addEventListener("click", deactivateOnNativeMenuClick, true);
    }
  }

  const observer = new MutationObserver(() => {
    install();
    if (state.active && !rendering && !document.querySelector(".tfpc")) render();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();

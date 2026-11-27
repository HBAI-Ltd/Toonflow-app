<template>
  <div class="home" :class="{ sidebarCollapsed }" :inert="creating || opening || workspaceStore.projectLoadingVisible">
    <bg class="pageBackground" :scrollTop="backgroundScrollTop" />
    <homeAdvertisementCarousel class="topPromotion" :advertisements="advertisements.banners" placement="banner" :mode="advertisements.bannerMode" :interval="advertisements.bannerInterval" @activate="activateAdvertisement" />
    <aside id="homeSidebar" class="homeSidebar" aria-label="首页侧栏">
      <div class="sidebarHeader">
        <div class="sidebarBrand">
          <el-image class="sidebarLogo" :src="logoUrl" fit="contain" alt="Toonflow" />
          <span class="brandName">Toonflow</span>
        </div>
        <button class="sidebarToggle" type="button" :aria-label="sidebarCollapsed ? '展开侧栏' : '收起侧栏'" :title="sidebarCollapsed ? '展开侧栏' : '收起侧栏'" :aria-expanded="!sidebarCollapsed" aria-controls="homeSidebar" @click="sidebarCollapsed = !sidebarCollapsed">
          <icon-layout-sidebar-left-expand v-if="sidebarCollapsed" :size="18" aria-hidden="true" />
          <icon-layout-sidebar-left-collapse v-else :size="18" aria-hidden="true" />
        </button>
      </div>
      <nav class="sidebarNav" aria-label="首页导航">
        <button v-for="section in homeSections" :key="section.id" class="sidebarItem" :class="{ active: activeSection === section.id }" type="button" :aria-current="activeSection === section.id ? 'page' : undefined" :aria-label="translate(section.label)" :title="translate(section.label)" @click="showSection(section.id)">
          <component :is="section.icon" :size="18" aria-hidden="true" />
          <span class="sidebarText">{{ translate(section.label) }}</span>
        </button>
        <button v-if="currentUser?.role !== 'user'" class="sidebarItem" :class="{ active: activeSection === 'assets' }" type="button" :aria-current="activeSection === 'assets' ? 'page' : undefined" aria-label="素材库" title="素材库" @click="showSection('assets')">
          <icon-library-photo :size="18" aria-hidden="true" />
          <span class="sidebarText">素材库</span>
        </button>
        <button v-if="!publicWeb" class="sidebarItem" :class="{ active: activeSection === 'pluginMarket' }" type="button" :aria-current="activeSection === 'pluginMarket' ? 'page' : undefined" aria-label="插件市场" title="插件市场" @click="showSection('pluginMarket')">
          <icon-building-store :size="18" aria-hidden="true" />
          <span class="sidebarText">插件市场</span>
        </button>
        <hr v-if="currentUser?.role !== 'user'" class="sidebarDivider" />
        <button class="sidebarItem" :class="{ active: activeSection === 'trumanMap' }" type="button" :aria-current="activeSection === 'trumanMap' ? 'page' : undefined" aria-label="白模预演 TrumanMap" title="白模预演 TrumanMap" @click="showSection('trumanMap')">
          <icon-cube :size="18" aria-hidden="true" />
          <span class="sidebarText">白模预演</span>
        </button>
      </nav>
      <div class="sidebarFooter">
        <homeAdvertisementCarousel class="sidebarPromotion" :advertisements="advertisements.sidebar" @activate="activateAdvertisement" />
        <homeAccount :collapsed="sidebarCollapsed" @openSettings="settingsVisible = true" @openAccount="settingsDialog?.openPanel('account')" @openUpdate="settingsDialog?.openPanel('about')" @openDeviceLink="mobileConnectVisible = true" />
      </div>
    </aside>
    <el-scrollbar v-show="activeSection !== 'assets'" ref="pageScroll" class="pageScroll" @scroll="backgroundScrollTop = $event.scrollTop">
      <div class="pageBody">
        <el-main class="pageContent">
          <homePage v-show="activeSection === 'home'" :disabled="creating || opening" :loading="creating" @create="createProject" @open="openProject" @showSection="showSection" />
          <projectsPage v-show="activeSection === 'projects'" :disabled="creating || opening" :loading="creating || !!relocationPicker?.selecting" @create="createProject()" @open="openProject" />
          <explorePage v-show="activeSection === 'explore'" :scrollElement="pageScroll?.wrapRef" />
          <section v-if="!publicWeb && activeSection === 'pluginMarket'" class="marketPage" aria-labelledby="marketTitle">
            <h2 id="marketTitle">插件市场</h2>
            <pluginMarket />
          </section>
          <trumanMapPage v-show="activeSection === 'trumanMap'" />
        </el-main>
      </div>
    </el-scrollbar>
    <!-- 素材库自带内部滚动，需要确定高度，所以与滚动区占同一格，而不放进滚动区。 -->
    <assetsPage v-if="currentUser?.role !== 'user'" v-show="activeSection === 'assets'" :active="activeSection === 'assets'" />
    <settings ref="settingsDialog" v-model="settingsVisible" />
    <mobileConnect v-if="!publicWeb" v-model="mobileConnectVisible" />
    <workspacePicker ref="relocationPicker" hideTrigger />
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import axios from "axios";
import { defineAsyncComponent, onMounted, onUnmounted, provide, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type ScrollbarInstance } from "element-plus";
import { IconHome, IconCompass, IconFolder } from "@tabler/icons-vue";
import type { HomeAdvertisement, HomeAdvertisements } from "@toonflow/server/channel";
import logoUrl from "@toonflow/assets/logo.svg";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import { currentUser, publicWeb } from "@/stores/multiTenant";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import http from "@/lib/http";
import { waitForControlValue } from "@/lib/mcpControl";
import settings from "@/components/settings/index.vue";
import bg from "./bg.vue";
import workspacePicker from "./workspacePicker.vue";
import homeAdvertisementCarousel from "./homeAdvertisementCarousel.vue";
import homeAccount from "./homeAccount.vue";
import homePage from "./pages/home/index.vue";
import projectsPage from "./pages/projects/index.vue";
import explorePage from "./pages/explore/index.vue";
import assetsPage from "./pages/assets/index.vue";
import trumanMapPage from "./pages/trumanMap/index.vue";

const settingsVisible = ref(false);
const settingsDialog = ref<InstanceType<typeof settings>>();
provide("openSettingsPanel", (id: string) => settingsDialog.value?.openPanel(id));
const advertisements = ref<HomeAdvertisements>({ banner: null, banners: [], bannerMode: "carousel", bannerInterval: 5, sidebar: [] });
const mobileConnectVisible = ref(false);
const sidebarCollapsed = ref(false);
const pageScroll = ref<ScrollbarInstance>();
const backgroundScrollTop = ref(0);
const activeSection = ref("home");
const homeSections = [
  { id: "home", label: "首页", icon: IconHome },
  { id: "projects", label: "项目", icon: IconFolder },
  { id: "explore", label: "探索", icon: IconCompass },
];
const mobileConnect = defineAsyncComponent(() => import("@/components/mobileConnect.vue"));
const pluginMarket = defineAsyncComponent(() => import("@/components/settings/panels/pluginMarket/index.vue"));
const router = useRouter();
const pageLifetime = new AbortController();
const creating = ref(false);
const opening = ref(false);
const relocationPicker = ref<InstanceType<typeof workspacePicker>>();
const workspaceStore = useWorkspaceStore();

onMounted(() => {
  void loadAdvertisements();
});

onUnmounted(() => {
  pageLifetime.abort();
  if (router.currentRoute.value.path !== "/workspace") workspaceStore.projectLoading = false;
});
watch([creating, opening], ([creating, opening]) => {
  if (creating || opening) {
    workspaceStore.projectLoadingDrawn = false;
    workspaceStore.projectLoading = true;
  } else if (router.currentRoute.value.path !== "/workspace") {
    workspaceStore.projectLoading = false;
  }
}, { flush: "sync" });
// 在设置里切换为子账号后素材库入口会隐藏，停留在素材库会让右侧空白。
watch(() => currentUser.value?.role, role => {
  if (role === "user" && activeSection.value === "assets") showSection("home");
});

async function loadAdvertisements() {
  // ACT: 默认读取后台配置；开发环境显式指定预览模式时才使用临时预览。
  const preview = router.currentRoute.value.query.advertisementPreview;
  if (import.meta.env.DEV && typeof preview === "string" && ["text", "image", "web", "carousel", "stack"].includes(preview)) {
    const now = Date.now();
    const previewSlides: { title: string; subtitle: string; color: string; actionType: HomeAdvertisement["actionType"]; actionTarget: string }[] = [
      { title: "探索创作灵感", subtitle: "从一个想法，开始你的下一个作品", color: "#273442", actionType: preview === "web" ? "web" : "path", actionTarget: preview === "web" ? "https://github.com/HBAI-Ltd/Toonflow-app" : "/home?section=explore" },
      { title: "搭建你的工作流", subtitle: "前往插件市场，发现更多创作工具", color: "#2c303b", actionType: "settings", actionTarget: "pluginMarket" },
      { title: "一起创造更多", subtitle: "在 GitHub 了解 Toonflow 的新进展", color: "#243734", actionType: "web", actionTarget: "https://github.com/HBAI-Ltd/Toonflow-app" },
    ];
    const sidebar = previewSlides.map((slide, index): HomeAdvertisement => ({
      title: slide.title,
      content: "",
      imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
        <defs><linearGradient id="background" x2="1" y2="1"><stop stop-color="${slide.color}"/><stop offset="1" stop-color="#13202f"/></linearGradient></defs>
        <rect width="640" height="360" fill="url(#background)"/>
        <circle cx="562" cy="60" r="150" fill="#409eff" opacity=".15"/>
        <path d="M330 235H400V160H485" fill="none" stroke="#6db5ff" stroke-width="4"/>
        <rect x="280" y="205" width="100" height="64" rx="12" fill="#337ecc"/>
        <rect x="450" y="125" width="110" height="70" rx="12" fill="#409eff"/>
        <circle cx="330" cy="237" r="12" fill="#fff" opacity=".85"/>
        <path d="m495 146 25 14-25 14z" fill="#fff"/>
        <g fill="#fff" font-family="Arial, Microsoft YaHei, sans-serif">
          <text x="40" y="58" font-size="17" letter-spacing="3" opacity=".7">TOONFLOW · PREVIEW</text>
          <text x="40" y="136" font-size="38" font-weight="bold">${slide.title}</text>
          <text x="40" y="177" font-size="19" opacity=".7">${slide.subtitle}</text>
          <text x="40" y="303" font-size="16" opacity=".6">侧栏轮播预览 · ${index + 1} / 3</text>
        </g>
      </svg>`)}`,
      buttonText: "",
      actionType: slide.actionType,
      actionTarget: slide.actionTarget,
      endsAt: null,
      updatedAt: now,
    }));
    const bannerImage = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="40" viewBox="0 0 1000 40">
        <rect width="1000" height="40" rx="4" fill="#23262b"/>
        <g fill="#d8dce3" font-family="Arial, Microsoft YaHei, sans-serif">
          <text x="12" y="25" font-size="14" font-weight="500">创作灵感，从这里开始</text>
          <text x="178" y="25" font-size="12" opacity=".65">探索更多工具，开始你的下一个作品</text>
        </g>
      </svg>`)}`;
    const banner: HomeAdvertisement = {
      title: "创作灵感，从这里开始",
      content: "探索 **节点与技能**，开始你的下一个作品。\n[创作灵感](/home?section=explore) · [插件市场](settings:pluginMarket) · [项目主页](https://github.com/HBAI-Ltd/Toonflow-app)",
      imageUrl: preview === "image" ? bannerImage : "",
      buttonText: "发现工具",
      actionType: "settings",
      actionTarget: "pluginMarket",
      endsAt: now + 2 * 86400000 + 3 * 3600000,
      updatedAt: now,
      appearance: { mode: preview === "image" ? "image" : "text", backgroundColor: "", backgroundEndColor: "", textColor: "", buttonColor: "", buttonTextColor: "" },
    };
    const banners = preview === "carousel" || preview === "stack"
      ? previewSlides.map((slide, index): HomeAdvertisement => ({ ...banner, title: slide.title, content: index === 0 ? banner.content : slide.subtitle, buttonText: "立即查看", actionType: slide.actionType, actionTarget: slide.actionTarget }))
      : [banner];
    advertisements.value = {
      banner: banners[0] ?? null,
      banners,
      bannerMode: preview === "stack" ? "stack" : "carousel",
      bannerInterval: 5,
      sidebar,
    };
    return;
  }
  try {
    const result = await http<HomeAdvertisements>({ method: "GET", url: "/api/channel/community/getAdvertisements", signal: pageLifetime.signal });
    if (!pageLifetime.signal.aborted) advertisements.value = result;
  } catch (error) {
    if (!pageLifetime.signal.aborted) console.warn("加载首页广告失败", error);
  }
}

async function activateAdvertisement(advertisement: HomeAdvertisement) {
  if (advertisement.actionType === "settings") {
    if (!settingsDialog.value?.openPanel(advertisement.actionTarget)) ElMessage.warning("当前设备不支持该设置项");
    return;
  }
  if (advertisement.actionType !== "path") return;
  const target = advertisement.actionTarget;
  if (!target.startsWith("/") || target.startsWith("//") || /[\\\u0000-\u0020]/.test(target)) return;
  const resolved = router.resolve(target);
  if (!resolved.matched.length) {
    ElMessage.warning("当前版本不支持该页面");
    return;
  }
  if (resolved.matched.some(route => ["/workspace", "/canvas"].includes(route.path)) && !workspaceStore.project?.directory) {
    ElMessage.info("请先打开一个项目");
    return;
  }
  try {
    await router.push(target);
    if (resolved.matched.some(route => route.path === "/home")) {
      const section = typeof resolved.query.section === "string" ? resolved.query.section : resolved.hash.slice(1);
      showSection(homeSections.some(item => item.id === section) ? section : "home");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "无法打开页面");
  }
}

function showSection(section: string) {
  activeSection.value = section;
  pageScroll.value?.setScrollTop(0);
}

async function enterWorkspace() {
  await waitForControlValue(() => workspaceStore.projectLoadingDrawn || undefined, pageLifetime.signal).catch(error => {
    if (!pageLifetime.signal.aborted) throw error;
  });
  if (pageLifetime.signal.aborted) return;
  if (!document.hidden) await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  if (pageLifetime.signal.aborted) return;
  await router.push("/workspace");
}

async function openProject(project: Project) {
  if (creating.value || opening.value) return;
  opening.value = true;
  try {
    const directory = project.directory;
    try { await workspaceStore.openProject(directory); }
    catch (err) {
      if (!axios.isAxiosError(err) || err.response?.status !== 404) throw err;
      const reselect = await ElMessageBox.confirm(`项目“${project.name}”的文件夹不存在，是否重新选择文件夹？`, "工作目录不存在", {
        confirmButtonText: "重新选择", cancelButtonText: "取消", type: "warning",
      }).then(() => true, () => false);
      if (!reselect) return;
      const directory = await relocationPicker.value?.chooseDirectory();
      if (!directory) return;
      await workspaceStore.openProject(directory, project.directory);
    }
    await enterWorkspace();
  } catch (err) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(err)
      ? err.response?.data.message || "无法打开项目，请重试"
      : err instanceof Error ? err.message : "无法打开项目，请重试");
  } finally { opening.value = false; }
}

// 首页面板传入创作请求；项目面板不传，改为选择文件夹新建或打开。
async function createProject(request?: NonNullable<typeof workspaceStore.pendingAgentMessage>) {
  if (creating.value || opening.value) return;
  const path = request ? request.directory : await relocationPicker.value?.chooseDirectory();
  if (!path || creating.value || opening.value || pageLifetime.signal.aborted) return;
  creating.value = true;
  try {
    const { directory, empty } = await useWorkspaceFiles(path).list();
    if (request && !empty) return ElMessage.warning("该文件夹不为空，请重新选择空文件夹；已有项目请使用“新建项目”入口或点击项目列表打开。");
    if (empty) await useWorkspaceFiles(directory).writeJson("画布1.json", { toonflowCanvas: true, nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }, true);
    await workspaceStore.openProject(directory);
    if (request && (request.prompt.trim() || request.attachments?.length)) {
      workspaceStore.pendingAgentMessage = { ...request, directory: workspaceStore.project!.directory };
    }
    await enterWorkspace();
  } catch (err) {
    ElMessage.error(axios.isAxiosError<{ message?: string }>(err)
      ? err.response?.data.message || "无法打开或创建项目，请重试"
      : err instanceof Error ? err.message : "无法打开或创建项目，请重试");
  } finally {
    creating.value = false;
  }
}
</script>

<style lang="scss" scoped>
.home {
  --sidebarWidth: 240px;
  --sidebarMotion: 220ms;
  --sidebarFade: 140ms;
  position: relative;
  display: grid;
  grid-template-columns: var(--sidebarWidth) minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  height: 100dvh;
  overflow: hidden;
  color: var(--el-text-color-primary);
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-text-color-primary));
  transition: grid-template-columns var(--sidebarMotion) ease;

  @media (prefers-reduced-motion: reduce) { transition: none; }

  .topPromotion { grid-column: 1 / -1; grid-row: 1; z-index: 1; }

  .pageBackground {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--sidebarWidth);
    width: calc(100% - var(--sidebarWidth));
    transition: inset-inline-start var(--sidebarMotion) ease, width var(--sidebarMotion) ease;

    @media (prefers-reduced-motion: reduce) { transition: none; }
  }

  &.sidebarCollapsed {
    --sidebarWidth: 72px;

    .homeSidebar {
      .sidebarPromotion { display: none; }
      .sidebarHeader {
        .sidebarBrand {
          gap: 0;

          .brandName { max-width: 0; opacity: 0; }
        }

        .sidebarToggle { inset-inline-start: 9px; opacity: 0; }

        @media (min-width: 901px) {
          &:hover, &:has(.sidebarToggle:focus-visible) {
            .sidebarLogo { opacity: 0; }
            .sidebarToggle { opacity: 1; }
          }
        }

        // 触屏没有悬停，收起后直接显示展开按钮。
        @media (min-width: 901px) and (any-pointer: coarse) {
          .sidebarLogo { opacity: 0; }
          .sidebarToggle { opacity: 1; }
        }
      }

      .sidebarItem {
        gap: 0;
        padding-inline: 14px;

        .sidebarText { max-width: 0; opacity: 0; }
      }
    }
  }

  .homeSidebar {
    position: relative;
    grid-column: 1;
    grid-row: 2;
    min-height: 0;
    display: flex;
    flex: 0 0 var(--sidebarWidth);
    flex-direction: column;
    width: var(--sidebarWidth);
    padding: 20px 12px 16px;
    overflow-x: hidden;
    overflow-y: auto;
    border-inline-end: 1px solid var(--el-border-color-lighter);
    background: inherit;
    transition: flex-basis var(--sidebarMotion) ease, width var(--sidebarMotion) ease;

    .sidebarHeader {
      position: relative;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      height: 30px;
      gap: 8px;
      margin-bottom: 24px;
      padding: 0 8px;

      .sidebarBrand {
        display: flex;
        align-items: center;
        min-width: 0;
        gap: 9px;
        overflow: hidden;
        transition: gap var(--sidebarMotion) ease;

        .sidebarLogo {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          transition: opacity var(--sidebarFade) ease;

          .dark & { filter: invert(1); }
        }

        .brandName {
          max-width: 150px;
          overflow: hidden;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.5px;
          white-space: nowrap;
          transition: max-width var(--sidebarMotion) ease, opacity var(--sidebarFade) ease;
        }
      }

      .sidebarToggle {
        position: absolute;
        top: 1px;
        inset-inline-start: calc(100% - 32px);
        display: grid;
        flex-shrink: 0;
        place-items: center;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 0;
        border-radius: var(--ui-radius);
        background: transparent;
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition: inset-inline-start var(--sidebarMotion) ease, opacity var(--sidebarFade) ease;

        &:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
        &:dir(rtl) svg { transform: scaleX(-1); }
      }
    }

    .sidebarItem {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      min-height: 42px;
      width: 100%;
      gap: 10px;
      padding: 10px 12px;
      border: 0;
      border-radius: var(--ui-radius);
      background: transparent;
      color: var(--el-text-color-regular);
      font: inherit;
      font-size: 14px;
      line-height: 1.5;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
      transition: gap var(--sidebarMotion) ease, padding var(--sidebarMotion) ease;

      > svg { flex-shrink: 0; }
      .sidebarText {
        min-width: 0;
        max-width: 180px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        transition: max-width var(--sidebarMotion) ease, opacity var(--sidebarFade) ease;
      }

      &:hover:not(:disabled) { background: var(--el-fill-color); color: var(--el-text-color-primary); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      &:disabled { cursor: wait; opacity: 0.6; }
      &.active { background: var(--el-fill-color-darker); color: var(--el-text-color-primary); font-weight: 500; }
    }

    .sidebarNav, .sidebarFooter { display: flex; flex-direction: column; gap: 4px; }
    .sidebarNav {
      .sidebarDivider { margin: 12px 8px; border: 0; border-top: 1px solid var(--el-border-color-lighter); }
    }
    .sidebarFooter { margin-top: auto; padding-top: 24px; }

    @media (prefers-reduced-motion: reduce) {
      --sidebarMotion: 0ms;
      --sidebarFade: 0ms;
    }
  }

  .pageScroll {
    grid-column: 2;
    grid-row: 2;
    position: relative;
    flex: 1;
    min-width: 0;
    height: 100%;

    :deep(.el-scrollbar__view) { min-height: 100%; }

    .pageBody {
      position: relative;
      min-height: 100%;

      .pageContent {
        padding: 24px clamp(20px, 4vw, 56px) 56px;

        .marketPage {
          max-width: 1280px;
          margin-inline: auto;

          h2 { margin: 0 0 16px; font-size: 22px; font-weight: 600; line-height: 1.5; }
          :deep(.marketToolbar) { position: static; background: transparent; }
          :deep(.ffmpegPanel .advancedSettings) {
            --el-collapse-header-bg-color: transparent;
            --el-collapse-content-bg-color: transparent;
          }
        }
      }
    }
  }

  .assetsPanel {
    position: relative;
    grid-column: 2;
    grid-row: 2;
    padding: 24px clamp(20px, 4vw, 56px);
  }

  @media (max-width: 900px) {
    --sidebarWidth: 72px;

    .homeSidebar {
      .sidebarPromotion { display: none; }
      .sidebarHeader {
        .sidebarBrand {
          gap: 0;

          .brandName { max-width: 0; opacity: 0; }
        }

        .sidebarToggle { display: none; }
      }

      .sidebarItem {
        gap: 0;
        padding-inline: 14px;

        .sidebarText { max-width: 0; opacity: 0; }
      }
    }
  }

  @media (max-width: 560px) {
    .pageScroll .pageBody .pageContent { padding: 24px 16px 40px; }
    .assetsPanel { padding: 16px; }
    .homeSidebar .sidebarItem { min-height: 44px; }
  }
}
</style>

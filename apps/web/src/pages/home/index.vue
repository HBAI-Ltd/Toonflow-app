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
        <button v-for="section in homeSections" :key="section.id" class="sidebarItem" :class="{ active: activeSection === section.id }" type="button" :aria-current="activeSection === section.id ? 'location' : undefined" :aria-label="translate(section.label)" :title="translate(section.label)" @click="scrollToSection(section.id)">
          <component :is="section.icon" :size="18" aria-hidden="true" />
          <span class="sidebarText">{{ translate(section.label) }}</span>
        </button>
        <hr class="sidebarDivider" />
        <button class="sidebarItem" :class="{ active: assetsVisible }" type="button" aria-label="素材库" title="素材库" aria-haspopup="dialog" :aria-expanded="assetsVisible" @click="assetsVisible = true">
          <icon-library-photo :size="18" aria-hidden="true" />
          <span class="sidebarText">素材库</span>
        </button>
      </nav>
      <div class="sidebarFooter">
        <homeAdvertisementCarousel class="sidebarPromotion" :advertisements="advertisements.sidebar" @activate="activateAdvertisement" />
        <button class="sidebarItem deviceButton" :class="{ connected: deviceHubEnabled || mobileConnection.online === true }" type="button" :aria-label="mobileConnectionLabel" :title="mobileConnectionLabel" @click="mobileConnectVisible = true">
          <span class="sidebarIcon">
            <component :is="deviceHubEnabled || mobileConnection.mode === 'remote' ? IconDeviceDesktop : IconQrcode" :size="18" aria-hidden="true" />
            <span v-if="deviceHubEnabled || mobileConnection.online === true" class="connectionDot" />
          </span>
          <span class="sidebarText">{{ mobileConnectionLabel }}</span>
        </button>
        <button class="sidebarItem" type="button" :aria-label="hasDesktopUpdate ? '设置，有新版本可用' : '设置'" :title="hasDesktopUpdate ? '设置，有新版本可用' : '设置'" @click="settingsVisible = true">
          <span class="sidebarIcon">
            <icon-settings :size="18" aria-hidden="true" />
            <span v-if="hasDesktopUpdate" class="updateDot" />
          </span>
          <span class="sidebarText">设置</span>
        </button>
        <a class="sidebarItem githubLink" href="https://github.com/HBAI-Ltd/Toonflow-app" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <icon-brand-github :size="18" aria-hidden="true" />
          <span class="sidebarText">GitHub</span>
        </a>
      </div>
    </aside>
    <el-scrollbar ref="pageScroll" class="pageScroll" @scroll="updateActiveSection">
      <div class="pageBody">
        <el-main class="pageContent">
          <section class="creationPanel" data-home-section="home" aria-label="创建项目">
            <div class="brand">
              <el-image class="brandLogo" :src="logoUrl" fit="contain" alt="Toonflow" />
              <h1>今天要做点什么？</h1>
            </div>
            <div class="promptArea">
              <el-card class="promptCard" :class="{ draggingAttachments }" shadow="never" @dragenter.capture="dragEnterAttachments" @dragover.capture="dragOverAttachments" @dragleave.capture="dragLeaveAttachments" @drop.capture="dropAttachments">
                <div v-if="draggingAttachments" class="attachmentDropOverlay" role="status" aria-live="polite">
                  <icon-paperclip :size="20" aria-hidden="true" />
                  <strong>松开添加附件</strong>
                  <span>图片、视频、文档或代码文件</span>
                </div>
                <input ref="attachmentInput" type="file" :accept="attachmentAccept" multiple hidden :disabled="creating || opening" @change="selectAttachments" />
                <attachmentList v-if="promptAttachments.length" class="promptAttachments" :attachments="promptAttachments" removable restorable :disabled="creating || opening" @remove="promptAttachments.splice($event, 1)" @restore="restoreAttachment" />
                <el-input ref="promptInput" v-model="prompt" type="textarea" :autosize="{ minRows: 3, maxRows: 8 }" resize="none" :disabled="creating || opening" :placeholder="promptPlaceholder" aria-label="创作描述" @paste.capture="pasteAttachments" />
                <template #footer>
                  <div class="composerFooter">
                    <div class="composerTools">
                      <el-button class="attachmentButton" text circle :icon="IconPaperclip" :disabled="creating || opening" aria-label="添加附件" title="添加附件" @click="attachmentInput?.click()" />
                      <workspacePicker ref="promptWorkspacePicker" v-model="workspaceDirectory" :disabled="creating || opening" />
                    </div>
                    <div class="sendActions">
                      <modelPopover v-model="selectedModel" v-model:reasoningEffort="reasoningEffort" class="modelSelect" :disabled="creating || opening" />
                      <el-button class="sendButton" type="primary" :circle="!!workspaceDirectory" :icon="workspaceDirectory ? IconArrowUp : IconFolder" :loading="creating" :disabled="creating || opening" :aria-label="workspaceDirectory ? '发送' : '选择工作目录'" @click="workspaceDirectory ? createProject() : promptWorkspacePicker?.chooseDirectory()">
                        <template v-if="!workspaceDirectory" #default>选择工作目录</template>
                      </el-button>
                    </div>
                  </div>
                </template>
              </el-card>
              <p v-if="!workspaceDirectory" class="workspaceHint" role="status">请先选择一个空文件夹作为工作目录，画布和素材会保存在这里。</p>
            </div>
          </section>
          <section class="projectList" data-home-section="projects" aria-labelledby="projectListTitle">
            <h2 id="projectListTitle">项目</h2>
            <div class="projectItems">
              <el-card class="projectLaunchCard" shadow="never" :bodyStyle="{ padding: '0', height: '100%' }">
                <button class="projectLaunch" type="button" :disabled="creating || opening || relocationPicker?.selecting" :aria-busy="creating || relocationPicker?.selecting" title="选择空文件夹新建，或打开已有项目" @click="createProject(false)">
                  <span class="launchIcon">
                    <icon-loader-2 v-if="creating || relocationPicker?.selecting" class="isLoading" :size="24" aria-hidden="true" />
                    <icon-plus v-else :size="24" aria-hidden="true" />
                  </span>
                  <span class="launchText">
                    <span class="launchTitle">新建项目</span>
                    <span class="launchDescription">或打开已有项目</span>
                  </span>
                </button>
              </el-card>
              <projectCard v-for="project in sortedProjects" :key="project.directory" :project="project" :disabled="creating || opening" :actionsVisible="exportingDirectory === project.directory" @select="openProject(project)">
                <template #actions>
                  <el-button circle :icon="IconFileZip" :loading="exportingDirectory === project.directory" :disabled="creating || opening || !!exportingDirectory" :aria-label="`打包导出项目 ${project.name}`" title="打包导出 ZIP" @click="exportProject(project)" />
                  <el-button circle :icon="IconEdit" :disabled="creating || opening || exportingDirectory === project.directory" :aria-label="`重命名项目 ${project.name}`" title="重命名" @click="renameProject(project)" />
                  <el-button circle plain type="danger" :icon="IconTrash" :disabled="creating || opening || exportingDirectory === project.directory" :aria-label="`移除项目 ${project.name}`" title="从列表移除，不删除文件" @click="workspaceStore.removeProject(project.directory)" />
                </template>
              </projectCard>
            </div>
          </section>
          <div data-home-section="explore"><explore :scrollElement="pageScroll?.wrapRef" /></div>
        </el-main>
      </div>
    </el-scrollbar>
    <assetLibraryDialog v-model="assetsVisible" />
    <settings ref="settingsDialog" v-model="settingsVisible" />
    <mobileConnect v-model="mobileConnectVisible" />
    <workspacePicker ref="relocationPicker" hideTrigger />
  </div>
</template>

<script setup lang="ts">
import { locale, translate } from "@toonflow/i18n/vue";
import axios from "axios";
import { storeToRefs } from "pinia";
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, type InputInstance, type ScrollbarInstance } from "element-plus";
import { getReadableFileMimeType, readableFileAccept } from "@toonflow/server/documentFormats";
import {
  IconQrcode, IconDeviceDesktop, IconHome, IconCompass,
  IconArrowUp, IconPlus, IconLoader2,
  IconFolder, IconEdit, IconFileZip,
  IconTrash, IconPaperclip,
} from "@tabler/icons-vue";
import modelPopover from "@/components/modelPopover.vue";
import attachmentList from "@/components/agent/attachmentList.vue";
import { createPastedTextFile, readTextAttachment } from "@/components/agent/textAttachments";
import type { AgentAttachment } from "@/components/agent/types";
import type { HomeAdvertisement, HomeAdvertisements } from "@toonflow/server/channel";
import logoUrl from "@toonflow/assets/logo.svg";
import { useWorkspaceStore, type Project } from "@/stores/workspace";
import { hasDesktopUpdate } from "@/stores/desktopUpdate";
import { deviceHubEnabled, mobileConnection, mobileConnectionLabel } from "@/lib/mobile";
import useWorkspaceFiles from "@/lib/workspaceFiles";
import saveFile from "@/lib/saveFile";
import http from "@/lib/http";
import { waitForControlValue } from "@/lib/mcpControl";
import settings from "@/components/settings/index.vue";
import assetLibraryDialog from "./assetLibraryDialog.vue";
import bg from "./bg.vue";
import explore from "./explore.vue";
import projectCard from "./projectCard.vue";
import workspacePicker from "./workspacePicker.vue";
import homeAdvertisementCarousel from "./homeAdvertisementCarousel.vue";

const settingsVisible = ref(false);
const settingsDialog = ref<InstanceType<typeof settings>>();
const advertisements = ref<HomeAdvertisements>({ banner: null, banners: [], bannerMode: "carousel", bannerInterval: 5, sidebar: [] });
const assetsVisible = ref(false);
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
const router = useRouter();
const pageLifetime = new AbortController();
const creating = ref(false);
const opening = ref(false);
const exportingDirectory = ref("");
const promptWorkspacePicker = ref<InstanceType<typeof workspacePicker>>();
const relocationPicker = ref<InstanceType<typeof workspacePicker>>();
const prompt = ref("");
const promptInput = ref<InputInstance>();
const promptAttachments = ref<AgentAttachment[]>([]);
const attachmentInput = ref<HTMLInputElement>();
const attachmentAccept = `image/*,video/*,${readableFileAccept}`;
const draggingAttachments = ref(false);
let attachmentDragDepth = 0;
const workspaceStore = useWorkspaceStore();
const { project, projectList } = storeToRefs(workspaceStore);
const workspaceDirectory = ref(project.value?.directory ?? "");
const placeholderPhrases = [
  "描述你想创作的内容，让灵感从这里开始…",
  "把一个故事灵感，变成一段精彩的短片…",
  "为你的主角设计独特的外形和性格…",
  "创作一段雨夜街头的电影感镜头…",
  "把这段文字拆解成连贯的分镜画面…",
  "为一场奇幻冒险生成场景和角色…",
  "为你的画面配上一段合适的音乐…",
  "写一段温暖的旁白，讲述这个故事…",
  "设计一支富有想象力的产品宣传片…",
  "从一句话开始，搭建你的创作工作流…",
];
const promptPlaceholder = ref(translate(placeholderPhrases[0]!));

onMounted(() => {
  void loadAdvertisements();
  window.addEventListener("dragend", clearAttachmentDrag, true);
  window.addEventListener("drop", clearAttachmentDrag, true);
  window.addEventListener("blur", clearAttachmentDrag);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let phraseIndex = 0;
  watch([() => !!prompt.value, locale], ([hasInput], _previous, onCleanup) => {
    if (reduceMotion) {
      promptPlaceholder.value = translate(placeholderPhrases[0]!);
      return;
    }
    if (hasInput) return;
    const segmenter = new Intl.Segmenter(locale.value, { granularity: "grapheme" });
    const phrases = placeholderPhrases.map(phrase => [...segmenter.segment(translate(phrase))].map(part => part.segment));
    let characterCount = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    promptPlaceholder.value = "";

    function typePlaceholder() {
      const phrase = phrases[phraseIndex]!;
      characterCount += deleting ? -1 : 1;
      promptPlaceholder.value = phrase.slice(0, characterCount).join("");
      let delay = deleting ? 35 : 85;
      if (characterCount === phrase.length) {
        deleting = true;
        delay = 1800;
      } else if (characterCount === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % placeholderPhrases.length;
        delay = 300;
      }
      timer = setTimeout(typePlaceholder, delay);
    }

    timer = setTimeout(typePlaceholder, 300);
    onCleanup(() => clearTimeout(timer));
  }, { immediate: true });
});

onUnmounted(() => {
  pageLifetime.abort();
  if (router.currentRoute.value.path !== "/workspace") workspaceStore.projectLoading = false;
  window.removeEventListener("dragend", clearAttachmentDrag, true);
  window.removeEventListener("drop", clearAttachmentDrag, true);
  window.removeEventListener("blur", clearAttachmentDrag);
});
watch([creating, opening], ([creating, opening]) => {
  if (creating || opening) {
    clearAttachmentDrag();
    workspaceStore.projectLoadingDrawn = false;
    workspaceStore.projectLoading = true;
  } else if (router.currentRoute.value.path !== "/workspace") {
    workspaceStore.projectLoading = false;
  }
}, { flush: "sync" });

const selectedModel = ref("");
const reasoningEffort = ref("");
const sortedProjects = computed(() => [...projectList.value].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt));

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
      await nextTick();
      const section = typeof resolved.query.section === "string" ? resolved.query.section : resolved.hash.slice(1);
      scrollToSection(homeSections.some(item => item.id === section) ? section : "home");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "无法打开页面");
  }
}

function scrollToSection(section: string) {
  const wrap = pageScroll.value?.wrapRef;
  const target = wrap?.querySelector<HTMLElement>(`[data-home-section="${section}"]`);
  if (!wrap || !target) return;
  activeSection.value = section;
  pageScroll.value?.scrollTo({
    top: section === "home" ? 0 : wrap.scrollTop + target.getBoundingClientRect().top - wrap.getBoundingClientRect().top - 32,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
  });
}

function updateActiveSection() {
  const wrap = pageScroll.value?.wrapRef;
  if (!wrap) return;
  backgroundScrollTop.value = wrap.scrollTop;
  if (wrap.scrollTop > 0 && wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 2) {
    activeSection.value = "explore";
    return;
  }
  const top = wrap.getBoundingClientRect().top + 120;
  for (const section of wrap.querySelectorAll<HTMLElement>("[data-home-section]")) {
    if (section.getBoundingClientRect().top <= top) activeSection.value = section.dataset.homeSection!;
  }
}

function pasteAttachments(event: ClipboardEvent) {
  if (creating.value || opening.value) return;
  try {
    const files = Array.from(event.clipboardData?.files ?? []);
    if (!files.length) {
      const file = createPastedTextFile(event.clipboardData?.getData("text/plain") ?? "");
      if (file) files.push(file);
    }
    if (!files.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    addAttachments(files);
  } catch (error) {
    event.preventDefault();
    event.stopImmediatePropagation();
    ElMessage.error(error instanceof Error ? error.message : "添加附件失败，请重试");
  }
}

function selectAttachments(event: Event) {
  const input = event.target as HTMLInputElement;
  addAttachments(Array.from(input.files ?? []));
  input.value = "";
}

function clearAttachmentDrag() {
  attachmentDragDepth = 0;
  draggingAttachments.value = false;
}

function dragEnterAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  if (creating.value || opening.value) return clearAttachmentDrag();
  attachmentDragDepth++;
  draggingAttachments.value = true;
}

function dragOverAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  event.dataTransfer.dropEffect = creating.value || opening.value ? "none" : "copy";
  if (creating.value || opening.value) return clearAttachmentDrag();
  attachmentDragDepth = Math.max(1, attachmentDragDepth);
  draggingAttachments.value = true;
}

function dragLeaveAttachments(event: DragEvent) {
  if (!draggingAttachments.value) return;
  attachmentDragDepth = Math.max(0, attachmentDragDepth - 1);
  const target = event.currentTarget;
  if (!attachmentDragDepth || (target instanceof Node && event.relatedTarget instanceof Node && !target.contains(event.relatedTarget))) clearAttachmentDrag();
}

function dropAttachments(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  clearAttachmentDrag();
  addAttachments(Array.from(event.dataTransfer.files));
}

function addAttachments(files: File[]) {
  if (creating.value || opening.value) return;
  for (const file of files) {
    const readableMimeType = getReadableFileMimeType(file.name, file.type);
    const mimeType = readableMimeType ?? file.type.split(";")[0]!.trim().toLowerCase();
    if (!readableMimeType && !/^(image|video)\//.test(mimeType)) {
      ElMessage.warning("只支持图片、视频和受支持的文本或文档文件");
      continue;
    }
    if (!file.size || file.size > 100 * 1024 * 1024) {
      ElMessage.warning("附件不能为空且不能超过 100 MB");
      continue;
    }
    if (mimeType === "text/plain" && file.size > 400000) {
      ElMessage.warning("文本附件不能超过 400 KB（400000 字节），请缩减内容后重试。");
      continue;
    }
    if (promptAttachments.value.length >= 20) {
      ElMessage.warning("每条消息最多添加 20 个附件");
      break;
    }
    promptAttachments.value.push({ name: file.name, path: "", mimeType, file });
  }
}

async function restoreAttachment(index: number) {
  const attachment = promptAttachments.value[index];
  if (attachment?.mimeType !== "text/plain" || creating.value || opening.value) return;
  try {
    const text = await readTextAttachment(attachment);
    const currentIndex = promptAttachments.value.indexOf(attachment);
    if (currentIndex < 0 || creating.value || opening.value) return;
    prompt.value += `${prompt.value ? "\n" : ""}${text}`;
    promptAttachments.value.splice(currentIndex, 1);
    await nextTick();
    promptInput.value?.focus();
    promptInput.value?.textarea?.setSelectionRange(prompt.value.length, prompt.value.length);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "取回文本失败，请重试");
  }
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

async function exportProject(project: Project) {
  if (creating.value || opening.value || exportingDirectory.value) return;
  const directory = project.directory;
  exportingDirectory.value = directory;
  try {
    let name = project.name.replace(/[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/g, "_").slice(0, 120).replace(/[. ]+$/, "");
    if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = "Toonflow";
    const files = useWorkspaceFiles(directory);
    await saveFile(() => files.exportZip(pageLifetime.signal), `${name}.zip`);
  } catch (error) {
    if (pageLifetime.signal.aborted) return;
    let message = error instanceof Error ? error.message : translate("导出项目失败，请重试");
    if (axios.isAxiosError(error)) {
      const data = error.response?.data instanceof Blob
        ? await error.response.data.text().then(JSON.parse).catch(() => null) : error.response?.data;
      if (typeof data?.message === "string") message = data.message;
    }
    ElMessage.error(message);
  } finally { exportingDirectory.value = ""; }
}

async function renameProject(project: Project) {
  const result = await ElMessageBox.prompt("请输入项目名称", "重命名项目", {
    inputValue: project.name, confirmButtonText: "保存", cancelButtonText: "取消",
    inputValidator: value => !!value?.trim() || "项目名称不能为空",
  }).catch(() => null);
  if (result) workspaceStore.renameProject(project.directory, result.value);
}

async function createProject(fromPrompt = true) {
  if (creating.value || opening.value || (fromPrompt && !workspaceDirectory.value)) return;
  const path = fromPrompt ? workspaceDirectory.value : await relocationPicker.value?.chooseDirectory();
  if (!path || creating.value || opening.value || pageLifetime.signal.aborted) return;
  creating.value = true;
  try {
    const { directory, empty } = await useWorkspaceFiles(path).list();
    if (fromPrompt && !empty) return ElMessage.warning("该文件夹不为空，请重新选择空文件夹；已有项目请使用“新建项目”入口或点击项目列表打开。");
    if (empty) await useWorkspaceFiles(directory).writeJson("画布1.json", { toonflowCanvas: true, nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }, true);
    await workspaceStore.openProject(directory);
    if (fromPrompt && (prompt.value.trim() || promptAttachments.value.length)) {
      workspaceStore.pendingAgentMessage = { directory: workspaceStore.project!.directory, prompt: prompt.value, attachments: [...promptAttachments.value], model: selectedModel.value, reasoningEffort: reasoningEffort.value };
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

      .sidebarIcon {
        position: relative;
        display: inline-flex;
        flex-shrink: 0;

        .connectionDot, .updateDot {
          position: absolute;
          top: -2px;
          inset-inline-end: -3px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--el-color-success);
          box-shadow: 0 0 0 2px var(--el-bg-color);
        }

        .updateDot { background: var(--el-color-danger); }
      }

      &:hover:not(:disabled) { background: var(--el-fill-color); color: var(--el-text-color-primary); }
      &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 2px; }
      &:disabled { cursor: wait; opacity: 0.6; }
      &.active { background: var(--el-fill-color-darker); color: var(--el-text-color-primary); font-weight: 500; }
      &.connected { color: var(--el-color-success); }
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

        .creationPanel {
          max-width: 800px;
          margin: clamp(32px, 6vh, 64px) auto 56px;

          .brand {
            display: flex;
            align-items: center;
            gap: clamp(8px, 1vw, 12px);
            margin-bottom: 28px;

            .brandLogo {
              flex-shrink: 0;
              width: clamp(28px, 3.4vw, 44px);
              height: clamp(28px, 3.4vw, 44px);

              .dark & {
                filter: invert(1);
              }
            }

            h1 {
              margin: 0;
              font-size: clamp(22px, 3vw, 34px);
              font-weight: 500;
              line-height: 1.3;
              letter-spacing: -0.5px;
            }
          }

          .promptArea {
            position: relative;

            .promptCard {
              position: relative;
              border-radius: calc(var(--ui-radius) * 3);
              border-color: var(--el-border-color-light);
              background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
              box-shadow: 0 12px 36px rgb(0 0 0 / 6%), inset 0 1px 0 color-mix(in srgb, var(--el-text-color-primary) 4%, transparent);
              transition: border-color 0.2s, box-shadow 0.2s;

              &:focus-within, &.draggingAttachments {
                border-color: var(--el-color-primary-light-5);
                box-shadow: 0 12px 36px rgb(0 0 0 / 6%), 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
              }

              :deep(.el-card__body) {
                padding: 20px 22px 8px;
              }

              .attachmentDropOverlay {
                position: absolute;
                inset: 0;
                z-index: 2;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
                border-radius: inherit;
                background: var(--el-bg-color);
                color: var(--el-text-color-primary);
                pointer-events: none;

                > svg { color: var(--el-text-color-secondary); }
                strong { font-size: 14px; font-weight: 500; }
                span { color: var(--el-text-color-secondary); font-size: 12px; }
              }

              .promptAttachments {
                margin-bottom: 12px;
              }

              :deep(.el-textarea__inner) {
                padding: 4px 0;
                box-shadow: none;
                background: transparent;
                font-size: 15px;
                line-height: 1.9;
              }

              :deep(.el-card__footer) {
                padding: 8px 14px 14px;
                border-top: 0;
                background: transparent;
              }

              .composerFooter {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 10px;

                .composerTools {
                  display: flex;
                  align-items: center;
                  flex: 1 1 160px;
                  min-width: 0;
                  gap: 6px;

                  .attachmentButton {
                    flex-shrink: 0;
                    width: 36px;
                    height: 36px;
                    margin: 0;
                    background: var(--el-fill-color-light);
                    color: var(--el-text-color-regular);

                    &:hover:not(:disabled) {
                      background: var(--el-color-primary-light-9);
                      color: var(--el-color-primary);
                    }
                  }

                  :deep(.workspaceButton) {
                    max-width: calc(100% - 42px);
                    height: 36px;
                    margin: 0;
                    padding: 0 10px;
                    border-radius: calc(var(--ui-radius) * 2);
                    color: var(--el-text-color-secondary);
                  }
                }

                .sendActions {
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  min-width: 0;
                  max-width: 100%;
                  margin-inline-start: auto;
                  gap: 8px;

                  .modelSelect {
                    min-width: 0;
                    max-width: 280px;

                    :deep(.modelButton) {
                      height: 36px;
                      border-radius: calc(var(--ui-radius) * 2);
                    }
                  }

                  .sendButton {
                    flex-shrink: 0;
                    height: 38px;
                    margin: 0;
                    border-radius: calc(var(--ui-radius) * 2);

                    &.is-circle { width: 38px; border-radius: 50%; }
                  }
                }

                @media (max-width: 560px) {
                  .composerTools { flex-basis: 100%; }

                  .sendActions {
                    width: 100%;
                    justify-content: space-between;

                    .modelSelect { flex: 1; }
                  }
                }
              }

              @media (prefers-reduced-motion: reduce) {
                transition: none;
              }
            }

            .workspaceHint {
              margin: 12px 16px 0;
              color: var(--el-text-color-secondary);
              font-size: 12px;
              line-height: 1.7;
            }
          }
        }

        .projectList {
          max-width: 1280px;
          margin: 0 auto;

          h2 {
            margin: 0 0 20px;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.5;
          }

          .projectItems {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
            grid-auto-rows: 1fr;
            gap: 20px;

            .projectLaunchCard {
              position: relative;
              border-radius: calc(var(--ui-radius) * 2.5);
              border-color: var(--el-border-color-lighter);
              background: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
              box-shadow: var(--el-box-shadow-lighter);

              &:focus-within {
                border-color: var(--el-color-primary-light-5);
              }

              .projectLaunch {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
                width: 100%;
                height: 100%;
                min-height: 240px;
                padding: 20px;
                border: 0;
                border-radius: calc(var(--ui-radius) * 2.5);
                background: transparent;
                color: inherit;
                font: inherit;
                text-align: center;
                cursor: pointer;

                &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
                &:disabled { cursor: wait; opacity: 0.6; }
                .launchIcon {
                  display: grid;
                  place-items: center;
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  background: var(--el-color-primary);
                  color: var(--el-color-white);

                  .isLoading { animation: launchSpin 1.5s linear infinite; }

                  @media (prefers-reduced-motion: reduce) {
                    .isLoading { animation: none; }
                  }
                }

                .launchText {
                  display: flex;
                  flex-direction: column;
                  gap: 6px;

                  .launchTitle { font-size: 15px; font-weight: 500; line-height: 1.8; }
                  .launchDescription { color: var(--el-text-color-regular); font-size: 13px; line-height: 1.6; }
                }
              }
            }
          }
        }
      }
    }
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
    .homeSidebar .sidebarItem { min-height: 44px; }
  }
}
@keyframes launchSpin {
  to { transform: rotate(360deg); }
}
</style>

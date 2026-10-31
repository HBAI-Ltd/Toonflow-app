<template>
  <div class="pluginMarket">
    <div class="marketToolbar">
      <div class="marketHeader">
        <nav class="marketNav" aria-label="插件列表">
          <button class="navButton" type="button" :aria-pressed="isMarketTab" @click="activeTab = 'discover'">发现插件</button>
          <button class="navButton" type="button" :aria-pressed="activeTab === 'installed'" @click="activeTab = 'installed'">已安装</button>
          <button class="navButton" type="button" :aria-pressed="activeTab === 'mcp'" @click="activeTab = 'mcp'">MCP</button>
          <button class="navButton" type="button" :aria-pressed="activeTab === 'ffmpeg'" @click="activeTab = 'ffmpeg'">FFmpeg</button>
        </nav>
        <div class="marketLinks">
          <el-button tag="a" href="https://api.toonflow.net/console/plugIn" target="_blank" rel="noopener noreferrer" size="small" text :icon="IconExternalLink">
            网页版市场
          </el-button>
          <el-button tag="a" href="https://qcn7xdsqgc4z.feishu.cn/docx/KNBNd9naqolsy6xjAOCcEAkqnRd" target="_blank" rel="noopener noreferrer" size="small" text :icon="IconBook">
            开发者文档
          </el-button>
        </div>
      </div>
      <div v-if="isMarketTab || activeTab === 'installed'" class="marketControls">
        <form class="marketSearch" role="search" @submit.prevent="applySearch">
          <el-input v-model="searchQuery" size="small" placeholder="搜索插件" aria-label="搜索插件" clearable @clear="applySearch" />
          <el-button size="small" nativeType="submit">搜索</el-button>
        </form>
        <div class="marketActions">
          <el-button
            size="small"
            type="primary"
            plain
            :icon="IconCloudUpload"
            :disabled="!accountToken"
            :title="accountToken ? '上传插件到市场' : '请先在账号与余额中登录'"
            @click="openUpload()">上传插件</el-button>
          <template v-if="activeTab === 'installed'">
            <el-button size="small" type="primary" :icon="IconUpload" :loading="installing" aria-label="安装本地插件" @click="pluginFileInput?.click()">
              安装插件
            </el-button>
            <input ref="pluginFileInput" type="file" :accept="agentMarketEnabled ? '.umd.js,.tool.js,.agent.zip,.zip,.md,.tar,.tar.gz,.tgz' : '.umd.js,.tool.js,.zip,.md,.tar,.tar.gz,.tgz'" hidden @change="installFile" />
            <template v-if="agentMarketEnabled && selectedType === 'agent'">
              <el-button size="small" :icon="IconLink" :disabled="loading || !canManageAgents" @click="agentConnectVisible = true">连接远程 Agent</el-button>
              <el-button size="small" :icon="IconSettings" :disabled="loading || !canManageAgents" @click="a2aSettingsVisible = true">A2A 服务</el-button>
            </template>
          </template>
        </div>
      </div>
      <div v-if="isMarketTab || activeTab === 'installed'" class="marketFilters">
        <div class="typeFilters" role="group" aria-label="插件类型">
          <button class="filterButton" type="button" :aria-pressed="selectedType === 'all'" @click="selectedType = 'all'">
            全部
            <span v-if="activeTab === 'installed' && installedCounts.all !== undefined" class="filterCount">{{ installedCounts.all }}</span>
          </button>
          <button
            v-for="(category, type) in pluginTypes"
            :key="type"
            class="filterButton"
            type="button"
            :disabled="type === 'agent' && !agentMarketEnabled"
            :title="type === 'agent' && !agentMarketEnabled ? '测试阶段，暂未开放' : undefined"
            :aria-pressed="selectedType === type"
            @click="selectedType = type">
            {{ category.label }}
            <span v-if="activeTab === 'installed' && installedCounts[type] !== undefined" class="filterCount">{{ installedCounts[type] }}</span>
          </button>
        </div>
        <div class="filterOptions">
          <div class="personalFilters" role="group" aria-label="我的插件">
            <button class="filterButton" type="button" :aria-pressed="selectedType === 'collection'" @click="selectedType = 'collection'">收藏</button>
            <button class="filterButton" type="button" :aria-pressed="selectedType === 'my'" @click="selectedType = 'my'">我的</button>
          </div>
          <el-checkbox v-if="activeTab === 'installed'" v-model="hideBuiltin" class="builtinFilter" size="small">隐藏内置插件</el-checkbox>
        </div>
      </div>
    </div>

    <ffmpeg v-if="activeTab === 'ffmpeg'" :visible />
    <mcpServers v-else-if="activeTab === 'mcp'" :visible />
    <template v-else>
      <template v-if="activeTab === 'installed'">
        <el-alert v-for="message in visibleLoadErrors" :key="message" class="loadError" :title="message" type="error" :closable="false" showIcon />
        <el-alert v-if="pluginExistenceError" class="loadError" :title="pluginExistenceError" type="warning" :closable="false" showIcon>
          <el-button size="small" @click="pluginExistenceRefreshKey++">重新检查</el-button>
        </el-alert>
        <p v-if="checkingPluginExistence" class="listStatus" role="status">正在检查插件是否已在市场中…</p>
      </template>
      <el-alert v-else-if="!accountToken" class="loadError" title="请先在账号与余额中登录 Toonflow 账号，再浏览和收藏插件。" type="info" :closable="false" showIcon />
      <el-alert v-else-if="marketError" class="loadError" :title="marketError" type="error" :closable="false" showIcon>
        <el-button size="small" @click="marketRefreshKey++">重试</el-button>
      </el-alert>

      <div
        class="pluginList"
        :aria-label="`${selectedType === 'collection' ? '收藏' : selectedType === 'my' ? '我的' : tabs[activeTab]}列表`"
        :aria-busy="activeTab === 'installed' ? loading : marketLoading">
        <el-card
          v-for="plugin in visiblePlugins"
          :key="plugin.key"
          class="pluginCard"
          :class="{ viewable: canViewPlugin(plugin) }"
          shadow="never"
          role="group"
          :aria-label="plugin.displayName"
          :aria-haspopup="canViewPlugin(plugin) ? 'dialog' : undefined"
          :tabindex="canViewPlugin(plugin) ? 0 : undefined"
          @click="openPlugin(plugin)"
          @keydown.enter.self.prevent="openPlugin(plugin)"
          @keydown.space.self.prevent="openPlugin(plugin)">
          <img v-if="plugin.type === 'node' && plugin.coverUrl" class="pluginCover" :src="plugin.coverUrl" :alt="`${plugin.displayName} 节点截图`" loading="lazy" referrerpolicy="no-referrer" />
          <div class="pluginHeader">
            <div class="pluginHeading">
              <h3 class="pluginName">
                <component :is="pluginTypes[plugin.type].icon" :size="18" aria-hidden="true" />
                <span class="pluginTitle">{{ plugin.displayName }}</span>
                <a
                  v-if="plugin.github"
                  class="repoLink"
                  :href="plugin.github"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`${plugin.displayName} 的 GitHub`"
                  title="GitHub"
                  @click.stop>
                  <icon-external-link :size="14" aria-hidden="true" />
                </a>
              </h3>
              <span class="pluginId" :title="plugin.name">{{ plugin.name }}</span>
            </div>
            <div class="pluginTags">
              <el-tag v-if="plugin.demoVideoUrl" type="info" size="small" effect="plain">效果演示</el-tag>
              <el-tag v-if="plugin.builtin || installedByKey.get(`${plugin.type}:${plugin.name}`)?.builtin" type="info" size="small" effect="plain">内置</el-tag>
              <el-tag
                v-for="(tag, index) in plugin.tags"
                :key="index"
                class="pluginLabel"
                type="info"
                size="small"
                effect="plain"
                :style="getPluginTagStyle(tag.color)">{{ tag.text }}</el-tag>
              <el-tag :type="pluginTypes[plugin.type].tagType" size="small">{{ pluginTypes[plugin.type].label }}</el-tag>
            </div>
          </div>
          <p v-if="plugin.description" class="pluginDescription">{{ plugin.description }}</p>
          <div v-if="isMarketTab && selectedType === 'my'" class="reviewStatus" :class="{ rejected: plugin.state === 2 }">
            <el-tag :type="plugin.state === 1 ? 'success' : plugin.state === 2 ? 'danger' : 'warning'" size="small" effect="plain">
              {{ plugin.state === 1 ? '已发布' : plugin.state === 2 ? '审核未通过' : '待审核' }}
            </el-tag>
            <p v-if="plugin.state === 2 && plugin.rejectReason" class="reviewReason"><span>审核意见</span>{{ plugin.rejectReason }}</p>
          </div>
          <el-text v-if="plugin.loadError" type="danger" size="small">{{ plugin.loadError }}</el-text>
          <div v-if="plugin.author || plugin.version" class="pluginMeta">
            <span v-if="plugin.author" class="pluginAuthor">{{ plugin.author }}</span>
            <span v-if="plugin.version" class="pluginVersion" type="info" size="small" effect="plain">v{{ plugin.version }}</span>
          </div>
          <div v-if="isMarketTab" class="pluginFooter" @click.stop>
            <el-button size="small" :aria-label="`查看 ${plugin.displayName} 的详情`" @click="openPlugin(plugin)">查看详情</el-button>
            <el-button
              v-if="selectedType === 'my'"
              size="small"
              type="primary"
              :disabled="plugin.state === 0 || loading || deletingPlugins.has(plugin.key) || collectingPlugins.has(plugin.key) || pendingPlugins.has(plugin.key)"
              :aria-label="`${plugin.state === 1 ? '更新版本' : plugin.state === 2 ? '修改后重新提交' : '等待审核'} ${plugin.displayName}`"
              @click="openResubmit(plugin)">{{ plugin.state === 1 ? '更新版本' : plugin.state === 2 ? '修改后重新提交' : '等待审核' }}</el-button>
            <el-text v-if="installLabel(plugin) === '已安装'" type="info" size="small">已安装</el-text>
            <el-popconfirm
              v-else-if="pluginTypes[plugin.type].path && plugin.url && plugin.fileName"
              :title="`${translate(installLabel(plugin))}${pluginTypes[plugin.type].label}“${plugin.displayName}”（${plugin.fileName}）？`"
              width="280"
              :confirmButtonText="translate(installLabel(plugin))"
              cancelButtonText="取消"
              @confirm="installMarketPlugin(plugin)">
              <template #reference>
                <el-button
                  size="small"
                  type="primary"
                  :loading="pendingPlugins.has(plugin.key)"
                  :disabled="loading || pendingPlugins.has(plugin.key) || deletingPlugins.has(plugin.key)"
                  :aria-label="`${translate(installLabel(plugin))} ${plugin.displayName}`">
                  {{ translate(installLabel(plugin)) }}
                </el-button>
              </template>
            </el-popconfirm>
            <el-text v-else type="info" size="small">{{ plugin.type === 'agent' && !agentMarketEnabled ? '测试阶段，暂未开放' : '暂不支持安装' }}</el-text>
            <div v-if="plugin.state === 1 || selectedType === 'my'" class="pluginActions">
              <component
                v-if="plugin.state === 1"
                :is="plugin.isCollected ? IconStarFilled : IconStar"
                class="collectionIcon"
                :size="18"
                role="button"
                tabindex="0"
                :aria-disabled="collectingPlugins.has(plugin.key) || deletingPlugins.has(plugin.key)"
                :aria-pressed="plugin.isCollected === true"
                :aria-label="`${plugin.isCollected ? '取消收藏' : '添加收藏'} ${plugin.displayName}`"
                :title="plugin.isCollected ? '取消收藏' : '添加收藏'"
                @click="toggleCollection(plugin)"
                @keydown.enter.prevent="toggleCollection(plugin)"
                @keydown.space.prevent="toggleCollection(plugin)" />
              <el-popconfirm
                v-if="selectedType === 'my'"
                :title="`确定从市场删除“${plugin.displayName}”吗？`"
                width="280"
                confirmButtonText="删除"
                cancelButtonText="取消"
                confirmButtonType="danger"
                @confirm="deletePlugin(plugin)">
                <template #reference>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :loading="deletingPlugins.has(plugin.key)"
                    :disabled="deletingPlugins.has(plugin.key) || collectingPlugins.has(plugin.key) || pendingPlugins.has(plugin.key)"
                    :aria-label="`从市场删除 ${plugin.displayName}`">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <div v-else class="pluginFooter pluginControls" @click.stop>
            <label class="pluginToggle">
              <span>{{ plugin.enabled === false ? "已禁用" : "已启用" }}</span>
              <el-switch
                :modelValue="plugin.enabled !== false"
                size="small"
                :loading="pendingPlugins.has(plugin.key)"
                :disabled="!canEditPlugin(plugin) || loading || pendingPlugins.has(plugin.key)"
                :aria-label="`启用 ${plugin.displayName}`"
                @change="updatePlugin(plugin, 'setEnabled', $event === true)" />
            </label>
            <div class="pluginActions">
              <el-button
                v-if="uploadablePluginKeys.has(plugin.key)"
                size="small"
                :icon="IconCloudUpload"
                :disabled="loading || pendingPlugins.has(plugin.key) || exportingPlugins.has(plugin.key)"
                :aria-label="`上传 ${plugin.displayName} 到市场`"
                title="上传到市场"
                @click="openUpload(plugin)">上传</el-button>
              <el-button
                v-if="plugin.type === 'node' || plugin.type === 'skill' || plugin.type === 'tool' || plugin.type === 'ext' || (plugin.type === 'agent' && plugin.kind === 'local')"
                size="small"
                :icon="IconShare"
                :loading="exportingPlugins.has(plugin.key)"
                :disabled="loading || pendingPlugins.has(plugin.key) || (plugin.type === 'tool' && !canManageTools) || (plugin.type === 'agent' && !canManageAgents) || (plugin.type === 'ext' && !plugin.canManage)"
                :aria-label="`导出分享 ${plugin.displayName}`"
                title="导出分享"
                @click="exportPlugin(plugin)" />
              <el-button v-if="plugin.type === 'agent' && plugin.kind === 'local'" size="small" :disabled="!canManageAgents || loading || pendingPlugins.has(plugin.key)" @click="selectedAgent = plugin">编辑</el-button>
              <el-button v-if="plugin.type === 'agent' && plugin.cardUrl" size="small" :icon="IconCopy" @click="copyCard(plugin.cardUrl)">Card</el-button>
              <el-badge v-if="(plugin.type === 'tool' || plugin.type === 'node' || plugin.type === 'ext') && plugin.configRules?.length" isDot :hidden="!hasMissingConfig(plugin)">
                <el-button
                  size="small"
                  :disabled="!canConfigurePlugin(plugin) || loading || pendingPlugins.has(plugin.key)"
                  :aria-label="`配置 ${plugin.displayName}${hasMissingConfig(plugin) ? '，有必填配置未填写' : ''}`"
                  @click="
                    selectedConfigPlugin = plugin;
                    configVisible = true;
                  ">
                  配置
                </el-button>
              </el-badge>
              <el-popconfirm
                v-if="plugin.author !== 'Toonflow' || plugin.type === 'skill' || plugin.type === 'agent' || plugin.type === 'ext'"
                :title="`确定卸载“${plugin.displayName}”${plugin.type === 'skill' ? '及其附属文件' : ''}吗？`"
                width="280"
                confirmButtonText="卸载"
                cancelButtonText="取消"
                confirmButtonType="danger"
                hideIcon
                @confirm="updatePlugin(plugin, 'uninstall')">
                <template #reference>
                  <el-button
                    size="small"
                    :loading="pendingPlugins.has(plugin.key)"
                    :disabled="!canEditPlugin(plugin) || loading || pendingPlugins.has(plugin.key) || exportingPlugins.has(plugin.key)"
                    :aria-label="`卸载 ${plugin.displayName}`">
                    卸载
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
        </el-card>
      </div>
      <p v-if="activeTab === 'installed' ? loading : marketLoading" class="listStatus" role="status">正在加载插件…</p>
      <p v-else-if="!visiblePlugins.length && (isMarketTab ? accountToken && !marketError : !visibleLoadErrors.length)" class="listStatus">
        {{ activeTab === "installed" ? "暂无符合条件的已安装插件" : selectedType === "collection" ? "暂无符合条件的收藏插件" : selectedType === "my" ? "暂无符合条件的已上传插件" : "未找到相关插件" }}
      </p>
      <el-pagination
        v-if="isMarketTab && accountToken && !marketError"
        v-model:currentPage="marketPage"
        class="marketPagination"
        :pageSize="marketPageSize"
        :total="marketTotal"
        :disabled="marketLoading"
        :pagerCount="5"
        layout="total, prev, pager, next"
        size="small" />
      <pluginConfigDialog v-if="selectedConfigPlugin" v-model="configVisible" :plugin="selectedConfigPlugin" :canManage="canConfigurePlugin(selectedConfigPlugin)" />
      <uploadPluginDialog
        v-if="uploadVisible"
        :plugin="selectedUploadPlugin"
        :marketPlugin="selectedMarketPlugin"
        :token="accountToken"
        @uploaded="onPluginUploaded"
        @closed="uploadVisible = false; selectedUploadPlugin = undefined; selectedMarketPlugin = undefined" />
      <agentEditorDialog v-if="selectedAgent" :key="selectedAgent.key" :agent="selectedAgent" :canManage="canManageAgents" @saved="refreshInstalled" @closed="selectedAgent = undefined" />
      <agentConnectDialog v-if="agentConnectVisible" @saved="refreshInstalled" @closed="agentConnectVisible = false" />
      <a2aSettingsDialog v-if="a2aSettingsVisible" @saved="refreshInstalled" @closed="a2aSettingsVisible = false" />
      <skillEditorDialog
        v-if="selectedSkill"
        :key="selectedSkill.key"
        :skill="selectedSkill"
        @saved="refreshInstalled"
        @closed="selectedSkill = undefined" />
      <el-dialog
        v-if="selectedPlugin"
        v-model="detailsVisible"
        :title="selectedPlugin.displayName"
        width="min(800px, calc(100vw - 32px))"
        alignCenter
        appendToBody
        destroyOnClose
        @closed="selectedPlugin = undefined">
        <div class="pluginContent" tabindex="0" aria-label="插件详情">
          <div v-if="selectedPlugin.id !== undefined" class="detailMeta">
            <el-tag :type="pluginTypes[selectedPlugin.type].tagType" size="small">{{ pluginTypes[selectedPlugin.type].label }}</el-tag>
            <span>{{ selectedPlugin.name }}</span>
            <span v-if="selectedPlugin.version">v{{ selectedPlugin.version }}</span>
            <span v-if="selectedPlugin.author">{{ selectedPlugin.author }}</span>
          </div>
          <div v-if="selectedPlugin.tags?.length" class="detailLabels" aria-label="插件标签">
            <el-tag
              v-for="(tag, index) in selectedPlugin.tags"
              :key="index"
              type="info"
              size="small"
              effect="plain"
              :style="getPluginTagStyle(tag.color)">{{ tag.text }}</el-tag>
          </div>
          <p v-if="selectedPlugin.description && selectedPlugin.id !== undefined" class="detailDescription">{{ selectedPlugin.description }}</p>
          <img v-if="selectedPlugin.coverUrl" class="detailCover" :src="selectedPlugin.coverUrl" :alt="`${selectedPlugin.displayName} 插件封面`" referrerpolicy="no-referrer" />
          <section v-if="selectedPlugin.demoVideoUrl" class="detailDemo" aria-label="效果演示">
            <h3>效果演示</h3>
            <el-alert v-if="demoVideoFailed" title="演示视频加载失败，请重试" type="error" :closable="false" showIcon>
              <el-button size="small" @click="demoVideoFailed = false">重试</el-button>
            </el-alert>
            <videoPlayer
              v-else
              :key="selectedPlugin.demoVideoUrl"
              class="demoPlayer"
              :src="selectedPlugin.demoVideoUrl"
              :label="`${selectedPlugin.displayName} 效果演示`"
              :active="detailsVisible && visible"
              @error="demoVideoFailed = true" />
          </section>
          <messageMarkdown v-if="selectedPlugin.readme" :content="selectedPlugin.readme" />
        </div>
      </el-dialog>
    </template>
  </div>
</template>

<script setup lang="ts">
import { translate } from "@toonflow/i18n/vue";
import axios from "axios";
import parse from "semver/functions/parse";
import { computed, defineAsyncComponent, markRaw, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { IconBox, IconBook, IconTool, IconFileText, IconExternalLink, IconSparkles2, IconUpload, IconCloudUpload, IconShare, IconStar, IconStarFilled, IconLink, IconSettings, IconCopy } from "@tabler/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { settings } from "@/stores/settings";
import http from "@/lib/http";
import videoPlayer from "@/components/videoPlayer.vue";
import type { Plugin as MarketPlugin, PluginExistence } from "@toonflow/server/channel";
import saveFile from "@/lib/saveFile";
import { writeClipboardText } from "@/lib/clipboard";
import pluginConfigDialog from "./pluginConfigDialog.vue";
import uploadPluginDialog from "./uploadPluginDialog.vue";
import skillEditorDialog from "./skillEditorDialog.vue";
import ffmpeg from "./ffmpeg.vue";
import mcpServers from "./mcpServers.vue";
import agentEditorDialog from "./agentEditorDialog.vue";
import agentConnectDialog from "./agentConnectDialog.vue";
import a2aSettingsDialog from "./a2aSettingsDialog.vue";
import type { Plugin, PluginType } from "./types";
import { installPluginFile } from "../../installPluginFile";

const { visible = true } = defineProps<{ visible?: boolean }>();
// ACT: Agent 插件市场仍在测试，暂时关闭入口。
const agentMarketEnabled = false;
const pluginTypes = {
  node: { label: "节点", path: "nodes", icon: IconBox, tagType: "primary" },
  ext: { label: "文件扩展", path: "ext", icon: IconFileText, tagType: "info" },
  skill: { label: "技能", path: "skills", icon: IconBook, tagType: "success" },
  tool: { label: "工具", path: "tools", icon: IconTool, tagType: "warning" },
  agent: { label: "Agent", path: agentMarketEnabled ? "agents" : null, icon: IconSparkles2, tagType: "danger" },
} as const;
const tabs = { get discover() { return translate("发现插件"); }, get installed() { return translate("已安装"); }, mcp: "MCP", ffmpeg: "FFmpeg" } as const;
const activeTab = ref<keyof typeof tabs>("discover");
const isMarketTab = computed(() => activeTab.value === "discover");
const marketPage = ref(1);
const marketPageSize = 20;
const marketTotal = ref(0);
const selectedTypes = ref<{ discover: PluginType | "all" | "collection" | "my"; installed: PluginType | "all" }>({ discover: "all", installed: "all" });
const selectedType = computed({
  get: () => selectedTypes.value[activeTab.value === "installed" ? "installed" : "discover"],
  set: (type: PluginType | "all" | "collection" | "my") => {
    if (activeTab.value !== "discover" && activeTab.value !== "installed") return;
    if (type === "collection" || type === "my") {
      activeTab.value = "discover";
      selectedTypes.value.discover = type;
    } else {
      if (selectedTypes.value[activeTab.value] === type) return;
      selectedTypes.value[activeTab.value] = type;
    }
    if (activeTab.value === "discover") marketPage.value = 1;
  },
});
const installedPlugins = ref<Plugin[]>([]);
const hideBuiltin = ref(false);
const filteredInstalledPlugins = computed(() => installedPlugins.value.filter(plugin => !hideBuiltin.value || !plugin.builtin));
const installedByKey = computed(() => new Map(installedPlugins.value.map((plugin) => [plugin.key, plugin])));
const marketPlugins = ref<Plugin[]>([]);
const marketLoading = ref(false);
const marketError = ref("");
const marketRefreshKey = ref(0);
const loading = ref(false);
const loadErrors = ref<Partial<Record<PluginType, string>>>({});
const canManageTools = ref(false);
const canManageAgents = ref(false);
const selectedAgent = ref<Plugin>();
const agentConnectVisible = ref(false);
const a2aSettingsVisible = ref(false);
const pendingPlugins = ref(new Set<string>());
const collectingPlugins = ref(new Set<string>());
const deletingPlugins = ref(new Set<string>());
let marketMutationController = new AbortController();
const exportingPlugins = ref(new Set<string>());
const selectedUploadPlugin = ref<Plugin>();
const selectedMarketPlugin = ref<Plugin>();
const uploadVisible = ref(false);
const accountToken = computed(() => {
  const account = settings.value.toonflowAccount as { token?: unknown } | null | undefined;
  return typeof account?.token === "string" ? account.token.trim() : "";
});
const localUploadCandidates = computed(() => installedPlugins.value.filter(canUploadLocalPlugin));
const pluginExistence = ref(new Map<string, boolean>());
const checkingPluginExistence = ref(false);
const pluginExistenceError = ref("");
const pluginExistenceRefreshKey = ref(0);
const uploadablePluginKeys = computed(() => new Set(localUploadCandidates.value
  .filter(plugin => pluginExistence.value.get(plugin.key) === false).map(plugin => plugin.key)));
const pluginFileInput = ref<HTMLInputElement>();
const installing = ref(false);
const refreshKey = ref(0);
const refreshInstalled = () => {
  refreshKey.value++;
};
onMounted(() => window.addEventListener("toonflow:plugin-installed", refreshInstalled));
onBeforeUnmount(() => window.removeEventListener("toonflow:plugin-installed", refreshInstalled));
onBeforeUnmount(() => marketMutationController.abort());
watch(
  () => [visible, activeTab.value, accountToken.value],
  () => {
    marketMutationController.abort();
    marketMutationController = new AbortController();
    collectingPlugins.value.clear();
    deletingPlugins.value.clear();
    uploadVisible.value = false;
    selectedUploadPlugin.value = undefined;
    selectedMarketPlugin.value = undefined;
    detailsVisible.value = false;
  },
  { flush: "sync" }
);
const selectedConfigPlugin = ref<Plugin>();
const configVisible = ref(false);
const selectedPlugin = ref<Plugin>();
const selectedSkill = ref<Plugin>();
const detailsVisible = ref(false);
const demoVideoFailed = ref(false);
const messageMarkdown = defineAsyncComponent(() => import("@/components/messageMarkdown.vue"));
const requestHeaders = { "x-toonflow-workspace": "1" };

function getPluginTagStyle(color: string) {
  const backgroundColor = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(color) ? color : "#0052D9";
  return { backgroundColor, borderColor: backgroundColor, color: "#FFFFFF" };
}

const searchQuery = ref("");
const appliedQuery = ref("");
const installedCounts = computed(() => {
  const counts: Partial<Record<PluginType | "all", number>> = {};
  if (loading.value) return counts;
  if (!Object.keys(loadErrors.value).length) counts.all = filteredInstalledPlugins.value.length;
  for (const type of Object.keys(pluginTypes) as PluginType[]) {
    if (!loadErrors.value[type]) counts[type] = filteredInstalledPlugins.value.filter((plugin) => plugin.type === type).length;
  }
  return counts;
});
const visibleLoadErrors = computed(() =>
  Object.entries(loadErrors.value)
    .filter(([type]) => selectedType.value === "all" || type === selectedType.value)
    .map(([, message]) => message)
);
const visiblePlugins = computed(() => {
  if (isMarketTab.value) return marketPlugins.value;
  return filteredInstalledPlugins.value.filter(
    (plugin) =>
      (selectedType.value === "all" || plugin.type === selectedType.value) &&
      [plugin.name, plugin.displayName, plugin.author, plugin.description].some((value) =>
        value?.toLowerCase().includes(appliedQuery.value.toLowerCase())
      )
  );
});
function canUploadLocalPlugin(plugin: Plugin) {
  return !!accountToken.value && !plugin.builtin && !plugin.loadError && canManageTools.value
    && (plugin.type !== "ext" || plugin.canManage === true)
    && (plugin.type !== "agent" || (agentMarketEnabled && plugin.kind === "local" && canManageAgents.value));
}

function openUpload(plugin?: Plugin) {
  if (!visible || !accountToken.value || (!isMarketTab.value && activeTab.value !== "installed")) return;
  if (plugin && (!installedPlugins.value.includes(plugin) || !uploadablePluginKeys.value.has(plugin.key))) return;
  selectedUploadPlugin.value = plugin;
  selectedMarketPlugin.value = undefined;
  uploadVisible.value = true;
}

function openResubmit(plugin: Plugin) {
  if (!visible || !isMarketTab.value || selectedType.value !== "my" || !accountToken.value
    || plugin.id === undefined || !marketPlugins.value.includes(plugin) || (plugin.state !== 1 && plugin.state !== 2)
    || loading.value || deletingPlugins.value.has(plugin.key) || collectingPlugins.value.has(plugin.key) || pendingPlugins.value.has(plugin.key)) return;
  const localPlugin = installedByKey.value.get(`${plugin.type}:${plugin.name}`);
  selectedUploadPlugin.value = localPlugin && canUploadLocalPlugin(localPlugin) ? localPlugin : undefined;
  selectedMarketPlugin.value = plugin;
  uploadVisible.value = true;
}

function onPluginUploaded() {
  marketRefreshKey.value++;
  pluginExistenceRefreshKey.value++;
  searchQuery.value = "";
  appliedQuery.value = "";
  selectedType.value = "my";
}

function canViewPlugin(plugin: Plugin) {
  if (isMarketTab.value) return true;
  return activeTab.value === "installed" && (plugin.type === "skill" || (plugin.type === "agent" && plugin.kind === "local" && canManageAgents.value))
    ? !loading.value && !pendingPlugins.value.has(plugin.key)
    : !!plugin.readme?.trim();
}

function openPlugin(plugin: Plugin) {
  if (!canViewPlugin(plugin)) return;
  if (activeTab.value === "installed" && plugin.type === "agent" && plugin.kind === "local" && canManageAgents.value) {
    selectedAgent.value = plugin;
    return;
  }
  if (activeTab.value === "installed" && plugin.type === "skill") {
    selectedSkill.value = plugin;
    return;
  }
  demoVideoFailed.value = false;
  selectedPlugin.value = plugin;
  detailsVisible.value = true;
}

function canConfigurePlugin(plugin: Plugin) {
  return plugin.type === "node" || plugin.type === "ext" ? plugin.canConfigure === true : plugin.type === "tool" && canManageTools.value;
}

function hasMissingConfig(plugin: Plugin) {
  if (!canConfigurePlugin(plugin)) return false;
  return (plugin.configRules ?? []).some((rule) => {
    const required = rule.required === true || (Array.isArray(rule.validate) && rule.validate.some((validation) =>
      validation && typeof validation === "object" && "required" in validation && validation.required === true));
    if (!required || typeof rule.field !== "string") return false;
    const config = plugin.config ?? {};
    const value = Object.hasOwn(config, rule.field) ? config[rule.field] : rule.value;
    return value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
  });
}

watch([activeTab, accountToken], () => { marketPage.value = 1; });

watch(
  () => [visible, activeTab.value, selectedTypes.value.discover, marketPage.value, appliedQuery.value, marketRefreshKey.value, accountToken.value],
  async (_value, _previous, onCleanup) => {
    marketLoading.value = false;
    marketError.value = "";
    marketPlugins.value = [];
    marketTotal.value = 0;
    const token = accountToken.value;
    if (!visible || !isMarketTab.value || !token) return;
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    marketLoading.value = true;
    try {
      const pageData = await http<{ list: MarketPlugin[]; total: number }>({
        method: "POST", url: "/api/channel/plugin/getPlugins",
        data: {
          page: marketPage.value,
          limit: marketPageSize,
          type: selectedTypes.value.discover,
          ...(appliedQuery.value ? { searchKeyword: appliedQuery.value } : {}),
        },
        signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
      });
      if (controller.signal.aborted || accountToken.value !== token) return;
      marketTotal.value = pageData.total;
      const lastPage = Math.max(1, Math.ceil(pageData.total / marketPageSize));
      if (marketPage.value > lastPage) {
        marketPage.value = lastPage;
        return;
      }
      marketPlugins.value = pageData.list.map((item) => ({
        key: `market:${item.id}`,
        id: item.id,
        isCollected: item.isCollected,
        state: item.state,
        rejectReason: item.rejectReason,
        tags: item.tags,
        demoVideoUrl: item.demoVideoUrl,
        coverUrl: item.coverUrl,
        type: item.type,
        name: item.identifier.trim(),
        displayName: item.name.trim() || item.identifier.trim(),
        author: typeof item.supplier === "string" ? item.supplier : "",
        description: typeof item.desc === "string" ? item.desc : "",
        url: item.link,
        fileName: item.fileName?.trim(),
        version: item.version,
      }));
    } catch (error) {
      if (!controller.signal.aborted && accountToken.value === token) {
        marketTotal.value = 0;
        marketError.value = errorMessage(error, "加载插件市场失败，请重试");
      }
    } finally {
      if (!controller.signal.aborted && accountToken.value === token) marketLoading.value = false;
    }
  },
  { immediate: true }
);
watch(
  () => [visible, activeTab.value, refreshKey.value],
  async (_value, _previous, onCleanup) => {
    if (!visible || (activeTab.value !== "discover" && activeTab.value !== "installed")) return;
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    loading.value = true;
    loadErrors.value = {};
    canManageTools.value = false;
    canManageAgents.value = false;
    installedPlugins.value = [];
    const results = await Promise.all(
      (Object.keys(pluginTypes) as PluginType[]).map(async (type) => {
        const category = pluginTypes[type];
        if (!category.path) return [];
        try {
          const { data } = await axios.get(`/api/${category.path}/${type === "ext" ? "list" : "get"}`, {
            signal: controller.signal,
            headers: { ...requestHeaders, "Cache-Control": "no-cache" },
          });
          const items = type === "tool" ? data.data?.tools : type === "agent" ? data.data?.agents : data.data;
          if (data.code !== 200 || !Array.isArray(items) || items.some((item) => !item || typeof item.name !== "string"))
            throw new Error(`${category.label}列表格式错误`);
          if (controller.signal.aborted) return [];
          if (type === "tool") canManageTools.value = data.data.canManage === true;
          if (type === "agent") canManageAgents.value = data.data.canManage === true;
          return items.map((item) => ({
            ...item,
            type,
            key: `${type}:${item.name}`,
            displayName: item.displayName || item.name,
            configRules: markRaw(item.configRules ?? []),
          } as Plugin));
        } catch (error) {
          if (!controller.signal.aborted) loadErrors.value[type] = errorMessage(error, `加载${category.label}失败，请重新打开列表重试`);
          return [];
        }
      })
    );
    if (controller.signal.aborted) return;
    installedPlugins.value = results.flat().sort((left, right) => (right.installedAt ?? 0) - (left.installedAt ?? 0));
    loading.value = false;
  },
  { immediate: true }
);

watch(
  () => [visible, activeTab.value, accountToken.value, loading.value, localUploadCandidates.value, pluginExistenceRefreshKey.value],
  async (_value, _previous, onCleanup) => {
    pluginExistence.value = new Map();
    pluginExistenceError.value = "";
    checkingPluginExistence.value = false;
    const token = accountToken.value;
    if (!visible || activeTab.value !== "installed" || loading.value || !token || !localUploadCandidates.value.length) return;
    const controller = new AbortController();
    onCleanup(() => controller.abort());
    const plugins = localUploadCandidates.value.map(plugin => ({ type: plugin.type, identifier: plugin.name }));
    checkingPluginExistence.value = true;
    try {
      // ACT: 整批只请求一次；未接入或失败时保持未知，不查询市场分页兜底。
      const results = await http<PluginExistence[]>({
        method: "POST", url: "/api/channel/plugin/getPluginExistence", data: { plugins },
        signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
      });
      if (controller.signal.aborted || accountToken.value !== token) return;
      pluginExistence.value = new Map(results.map(item => [`${item.type}:${item.identifier}`, item.exists]));
    } catch (error) {
      if (!controller.signal.aborted && accountToken.value === token) {
        pluginExistenceError.value = errorMessage(error, "检查插件市场状态失败，请重试");
      }
    } finally {
      if (!controller.signal.aborted) checkingPluginExistence.value = false;
    }
  },
  { immediate: true }
);

function applySearch() {
  appliedQuery.value = searchQuery.value.trim();
  marketPage.value = 1;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && "status" in error && error.status === 401) return translate("账号登录已失效，请到账号与余额重新登录");
  if (axios.isAxiosError(error)) return typeof error.response?.data?.message === "string" ? error.response.data.message : fallback;
  return error instanceof Error ? error.message : fallback;
}

async function copyCard(url: string) {
  try {
    await writeClipboardText(url);
    ElMessage.success("Agent Card 地址已复制");
  } catch {
    await ElMessageBox.alert(url, "Agent Card 地址", { confirmButtonText: "关闭" }).catch(() => {});
  }
}

function canEditPlugin(plugin: Plugin) {
  return (
    activeTab.value === "installed" &&
    (plugin.type === "node" || plugin.type === "skill" || (plugin.type === "ext" && plugin.canManage === true) || (plugin.type === "tool" && canManageTools.value) || (plugin.type === "agent" && canManageAgents.value))
  );
}

function installLabel(plugin: Plugin) {
  const installed = installedByKey.value.get(`${plugin.type}:${plugin.name}`);
  if (!installed) return "安装";
  const [current, incoming] = [installed.version, plugin.version].map(value => {
    const version = parse(value ?? "");
    if (!version || version.raw.trim().startsWith("v")
      || version.prerelease.some(part => /^\d+$/.test(String(part)) && !Number.isSafeInteger(Number(part)))) return null;
    return version;
  });
  return current && incoming && incoming.compare(current) > 0 ? "更新" : "已安装";
}

async function toggleCollection(plugin: Plugin) {
  const token = accountToken.value;
  if (!visible || !isMarketTab.value || !token || plugin.id === undefined || plugin.state !== 1 || collectingPlugins.value.has(plugin.key) || deletingPlugins.value.has(plugin.key)) return;
  const controller = marketMutationController;
  collectingPlugins.value.add(plugin.key);
  try {
    const { collected } = await http<{ collected: boolean }>({
      method: "POST", url: "/api/channel/plugin/toggleCollection", data: { pluginId: plugin.id },
      signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (controller.signal.aborted || accountToken.value !== token) return;
    const current = marketPlugins.value.find(item => item.id === plugin.id);
    if (current) current.isCollected = collected;
    if (selectedType.value === "collection" || marketLoading.value) marketRefreshKey.value++;
    ElMessage.success(collected ? "收藏成功" : "已取消收藏");
  } catch (error) {
    if (!controller.signal.aborted && accountToken.value === token) ElMessage.error(errorMessage(error, "修改收藏失败，请重试"));
  } finally {
    if (marketMutationController === controller) collectingPlugins.value.delete(plugin.key);
  }
}

async function deletePlugin(plugin: Plugin) {
  const token = accountToken.value;
  if (!visible || !isMarketTab.value || selectedType.value !== "my" || !token || plugin.id === undefined
    || !marketPlugins.value.includes(plugin) || deletingPlugins.value.has(plugin.key)
    || collectingPlugins.value.has(plugin.key) || pendingPlugins.value.has(plugin.key)) return;
  const controller = marketMutationController;
  deletingPlugins.value.add(plugin.key);
  try {
    const message = await http<string>({
      method: "POST", url: "/api/channel/plugin/deletePlugin", data: { id: plugin.id },
      signal: controller.signal, headers: { Authorization: `Bearer ${token}` },
    });
    if (controller.signal.aborted || accountToken.value !== token) return;
    marketRefreshKey.value++;
    pluginExistenceRefreshKey.value++;
    ElMessage.success(message || "插件已从市场删除");
  } catch (error) {
    if (!controller.signal.aborted && accountToken.value === token) ElMessage.error(errorMessage(error, "删除插件失败，请重试"));
  } finally {
    if (marketMutationController === controller) deletingPlugins.value.delete(plugin.key);
  }
}

async function installMarketPlugin(plugin: Plugin) {
  const path = pluginTypes[plugin.type].path;
  if (!path || !plugin.url || !plugin.fileName || loading.value || pendingPlugins.value.has(plugin.key) || deletingPlugins.value.has(plugin.key)) return;
  const action = installLabel(plugin);
  if (action === "已安装") return;
  pendingPlugins.value.add(plugin.key);
  try {
    const { data } = await axios.post(`/api/${path}/install`, { url: plugin.url, fileName: plugin.fileName, version: plugin.version }, { headers: requestHeaders });
    if (data.code !== 200) throw new Error(data.message || "安装插件失败");
    window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type: plugin.type, name: data.data.name } }));
    if (plugin.type === "ext") window.dispatchEvent(new CustomEvent("toonflow:ext-updated", { detail: { name: data.data.name } }));
    ElMessage.success(action === "更新" ? `${plugin.displayName}已更新` : `${plugin.displayName}已安装`);
  } catch (error) {
    ElMessage.error(errorMessage(error, "安装插件失败，请重试"));
  } finally {
    pendingPlugins.value.delete(plugin.key);
  }
}

async function installFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || installing.value) return;
  installing.value = true;
  try {
    const type = /\.agent\.zip$/i.test(file.name)
      ? "agent"
      : /^ext-[a-z][a-zA-Z0-9]*\.umd\.js$/.test(file.name)
      ? "ext"
      : /\.umd\.js$/i.test(file.name)
      ? "node"
      : /\.tool\.js$/i.test(file.name)
      ? "tool"
      : /\.(zip|md|tar|tar\.gz|tgz)$/i.test(file.name)
      ? "skill"
      : undefined;
    if (!type) throw new Error("不支持这个安装文件。支持的格式：文件扩展 ext-*.umd.js；Agent .agent.zip；节点 .umd.js；工具 .tool.js；技能 .zip、.md、.tar、.tar.gz、.tgz。");
    if (type === "agent" && !agentMarketEnabled) throw new Error("Agent 功能处于测试阶段，暂未开放安装");
    await installPluginFile(type, file);
    ElMessage.success(`${pluginTypes[type].label}已安装`);
  } catch (error) {
    ElMessage.error(errorMessage(error, "安装插件失败，请重试"));
  } finally {
    installing.value = false;
  }
}

async function exportPlugin(plugin: Plugin) {
  if (
    activeTab.value !== "installed" ||
    (plugin.type === "agent" && (plugin.kind !== "local" || !canManageAgents.value)) ||
    exportingPlugins.value.has(plugin.key) ||
    pendingPlugins.value.has(plugin.key) ||
    loading.value ||
    (plugin.type === "tool" && !canManageTools.value) ||
    (plugin.type === "ext" && !plugin.canManage)
  )
    return;
  exportingPlugins.value.add(plugin.key);
  try {
    const fileName = `${plugin.name}.${plugin.type === "node" || plugin.type === "ext" ? "umd.js" : plugin.type === "tool" ? "tool.js" : plugin.type === "agent" ? "agent.zip" : "zip"}`;
    await saveFile(
      () =>
        axios
          .get<Blob>("/api/plugins/export", { params: { type: plugin.type, name: plugin.name }, responseType: "blob", headers: requestHeaders })
          .then(({ data }) => data),
      fileName
    );
  } catch (error) {
    let message = errorMessage(error, "导出插件失败，请重试");
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const data = await error.response.data
        .text()
        .then(JSON.parse)
        .catch(() => null);
      if (typeof data?.message === "string") message = data.message;
    }
    ElMessage.error(message);
  } finally {
    exportingPlugins.value.delete(plugin.key);
  }
}

async function updatePlugin(plugin: Plugin, action: "setEnabled" | "uninstall", enabled?: boolean) {
  if (
    !canEditPlugin(plugin) ||
    loading.value ||
    pendingPlugins.value.has(plugin.key) ||
    exportingPlugins.value.has(plugin.key) ||
    (action === "uninstall" && plugin.author === "Toonflow" && (plugin.type === "node" || plugin.type === "tool"))
  )
    return;
  pendingPlugins.value.add(plugin.key);
  const actionLabel = action === "uninstall" ? translate("卸载插件") : translate("更新插件状态");
  try {
    const url = `/api/${pluginTypes[plugin.type].path}/${action}`;
    const { data } =
      action === "uninstall"
        ? await axios.delete(url, { data: { name: plugin.name }, headers: requestHeaders })
        : await axios.put(url, { name: plugin.name, enabled }, { headers: requestHeaders });
    if (data.code !== 200) throw new Error(data.message || `${actionLabel}失败`);
    if (action === "uninstall") {
      installedPlugins.value = installedPlugins.value.filter((item) => item.key !== plugin.key);
      if (selectedSkill.value?.key === plugin.key) selectedSkill.value = undefined;
      if (selectedAgent.value?.key === plugin.key) selectedAgent.value = undefined;
      if (selectedConfigPlugin.value?.key === plugin.key) {
        configVisible.value = false;
        selectedConfigPlugin.value = undefined;
      }
      if (selectedPlugin.value?.key === plugin.key) {
        detailsVisible.value = false;
        selectedPlugin.value = undefined;
      }
      ElMessage.success("插件已卸载");
    } else plugin.enabled = enabled;
    if (plugin.type === "node")
      window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type: plugin.type, name: plugin.name } }));
    if (plugin.type === "ext") window.dispatchEvent(new CustomEvent("toonflow:ext-updated", { detail: { name: plugin.name } }));
  } catch (error) {
    ElMessage.error(errorMessage(error, `${actionLabel}失败，请重试`));
  } finally {
    pendingPlugins.value.delete(plugin.key);
  }
}
</script>

<style lang="scss" scoped>
.pluginMarket {
  .marketToolbar {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 20px;
    background: var(--el-bg-color);

    .el-button { margin-left: 0; }

    .marketHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .marketNav {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 24px;

        .navButton {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          padding: 0 0 6px;
          border: 0;
          background: transparent;
          color: var(--el-text-color-secondary);
          font: inherit;
          cursor: pointer;

          &[aria-pressed="true"] {
            color: var(--el-text-color-primary);
            font-weight: 600;
            &::after {
              position: absolute;
              right: 0;
              bottom: 0;
              left: 0;
              height: 2px;
              border-radius: 2px;
              background: currentColor;
              content: "";
            }
          }
          &:hover {
            color: var(--el-text-color-primary);
          }
          &:focus-visible {
            outline: 2px solid var(--el-color-primary);
            outline-offset: 3px;
          }
        }
      }

      .marketLinks {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-left: auto;
      }
    }

    .marketControls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px 24px;

      .marketSearch {
        display: flex;
        flex: 1 1 220px;
        min-width: 0;
        max-width: 400px;
        gap: 8px;

        .el-input { flex: 1; min-width: 0; }
      }

      .marketActions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        max-width: 100%;
        gap: 8px;
        margin-left: auto;
      }
    }

    .marketFilters {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px 24px;

      .typeFilters {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .filterOptions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-left: auto;

        .personalFilters {
          display: flex;
          gap: 6px;
        }

        .builtinFilter { margin: 0; }
      }

      .filterButton {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border: 0;
        border-radius: var(--el-border-radius-base);
        background: transparent;
        color: var(--el-text-color-secondary);
        font: inherit;
        font-size: 12px;
        cursor: pointer;

        .filterCount {
          padding: 1px 6px;
          border-radius: 6px;
          background: var(--el-fill-color);
          font-size: 11px;
          font-weight: 500;
        }

        &:hover:not(:disabled) {
          background: var(--el-fill-color-light);
        }
        &:disabled {
          color: var(--el-text-color-disabled);
          cursor: not-allowed;
        }
        &[aria-pressed="true"] {
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
        }
        &:focus-visible {
          outline: 2px solid var(--el-color-primary);
          outline-offset: 2px;
        }
      }
    }
  }

  .loadError {
    margin-bottom: 12px;
  }

  .pluginList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
    gap: 16px;
    padding-bottom: 4px;

    .pluginCard {
      min-width: 0;

      .pluginCover {
        display: block;
        width: 100%;
        aspect-ratio: 16 / 9;
        margin-bottom: 12px;
        object-fit: contain;
        background: var(--el-fill-color-light);
        border-radius: var(--el-border-radius-base);
      }

      &.viewable {
        cursor: pointer;

        &:focus-visible {
          outline: 2px solid var(--el-color-primary);
          outline-offset: 2px;
        }
      }

      :deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 12px;
        box-sizing: border-box;
      }

      .pluginHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;

        .pluginTags {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 4px;
          flex-shrink: 0;
          max-width: 50%;

          .pluginLabel {
            max-width: 100%;
            height: auto;
            min-height: 20px;
            white-space: normal;
            overflow-wrap: anywhere;
          }
        }

        .pluginHeading {
          min-width: 0;

          .pluginName {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            overflow-wrap: anywhere;

            .pluginTitle {
              min-width: 0;
            }

            svg {
              flex-shrink: 0;
            }
            .repoLink {
              display: inline-flex;
              flex-shrink: 0;
              color: var(--el-text-color-secondary);
              &:hover {
                color: var(--el-color-primary);
              }
              &:focus-visible {
                outline: 2px solid var(--el-color-primary);
                outline-offset: 2px;
              }
            }
          }

          .pluginId {
            display: block;
            margin-top: 6px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            line-height: 1.5;
            color: var(--el-text-color-placeholder);
          }
        }
      }

      .pluginMeta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px 12px;
        margin-top: 12px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-secondary);
        overflow-wrap: anywhere;

        .pluginAuthor {
          flex: 1;
          min-width: 0;
        }

        .pluginVersion {
          flex-shrink: 0;
          margin-left: auto;
        }
      }
      .pluginDescription {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
        margin: 10px 0 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--el-text-color-regular);
        overflow-wrap: anywhere;
      }

      .reviewStatus {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        margin-top: 12px;
        text-align: left;

        &.rejected {
          padding: 10px;
          border-radius: 6px;
          background: var(--el-color-danger-light-9);
        }

        .reviewReason {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--el-text-color-regular);
          white-space: pre-wrap;
          overflow-wrap: anywhere;

          span {
            display: block;
            margin-bottom: 2px;
            color: var(--el-color-danger);
          }
        }
      }

      .pluginFooter {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: auto;
        padding-top: 12px;

        &.pluginControls {
          align-items: stretch;
          flex-direction: column;
          gap: 12px;

          &::before {
            border-top: 1px solid var(--el-border-color-lighter);
            content: "";
          }
        }

        .pluginToggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: var(--el-text-color-secondary);
          font-size: 12px;
          cursor: pointer;

          > .el-switch {
            flex-shrink: 0;
          }
        }
        .pluginActions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          max-width: 100%;
          min-width: 0;
          margin-left: auto;
          .el-button {
            margin-left: 0;
          }
          .collectionIcon {
            color: var(--el-text-color-secondary);
            cursor: pointer;

            &[aria-pressed="true"] {
              color: #f5c518;
            }
            &[aria-disabled="true"] {
              opacity: 0.5;
              cursor: wait;
            }
            &:focus-visible {
              outline: 2px solid currentColor;
              outline-offset: 3px;
            }
          }
        }
      }
    }
  }

  .marketPagination {
    justify-content: center;
    margin-top: 16px;
  }

  .listStatus {
    margin: 24px 0;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}

.pluginContent {
  max-height: min(65vh, calc(100dvh - 160px));
  overflow: auto;
  overflow-wrap: anywhere;
  padding: 0 4px;
  font-size: 14px;
  line-height: 1.7;

  .detailMeta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 16px;
    margin-bottom: 16px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .detailLabels {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;

    .el-tag {
      max-width: 100%;
      height: auto;
      min-height: 20px;
      white-space: normal;
      overflow-wrap: anywhere;
    }
  }

  .detailDescription {
    margin: 0 0 16px;
    white-space: pre-wrap;
  }

  .detailCover {
    display: block;
    width: 100%;
    max-height: 50vh;
    margin-bottom: 16px;
    border-radius: var(--el-border-radius-base);
    object-fit: contain;
  }

  .detailDemo {
    margin-bottom: 16px;

    h3 {
      margin: 0 0 12px;
      font-size: 14px;
    }

    .demoPlayer {
      height: auto;
      border-radius: var(--el-border-radius-base);
      overflow: hidden;
    }
  }
}
</style>

<template>
  <section ref="exploreElement" class="explore" aria-labelledby="exploreTitle">
    <div class="exploreToolbar">
      <h2 id="exploreTitle">探索</h2>
      <div class="toolbarActions">
        <el-input v-model="search" class="searchInput" :prefixIcon="IconSearch" placeholder="搜索项目" aria-label="搜索云端项目" clearable />
        <el-button :icon="IconPlus" aria-haspopup="dialog" :aria-expanded="publishVisible" @click="publishVisible = true">发布作品</el-button>
      </div>
    </div>
    <div class="categoryFilters" role="group" aria-label="项目分类">
      <button type="button" :class="{ active: !selectedCategory }" :aria-pressed="!selectedCategory" @click="selectedCategory = ''">全部</button>
      <button v-for="category in categories" :key="category.id" type="button" :class="{ active: selectedCategory === category.id }" :aria-pressed="selectedCategory === category.id" @click="selectedCategory = category.id">{{ category.name }}</button>
    </div>
    <div ref="gridElement" class="projectGrid" :style="{ height: `${rowVirtualizer.getTotalSize()}px` }" :aria-busy="loading" aria-label="云端项目">
      <div v-for="{ row, items } in visibleRows" :key="String(row.key)" class="projectRow" :style="{ height: `${row.size}px`, gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`, transform: `translateY(${row.start - scrollMargin}px)` }">
        <button v-for="item in items" :key="item.id" class="projectCard" type="button" :aria-label="`查看作品：${item.title}，作者 ${item.author.name}`" @click="selectedProjectId = item.id">
          <img v-if="item.coverUrl" class="cardCover" :src="item.coverUrl" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          <span class="cardShade" />
          <span class="cardFooter">
            <span class="cardInfo">
              <span class="authorName">{{ item.author.name }}</span>
              <strong class="projectTitle">{{ item.title }}</strong>
            </span>
            <span class="cardStats">
              <span :aria-label="`${item.likeCount} 次点赞`"><icon-heart :size="14" aria-hidden="true" />{{ item.likeCount }}</span>
            </span>
          </span>
        </button>
      </div>
    </div>
    <div v-if="unavailable" class="loadStatus" role="status" aria-live="polite">未开放</div>
    <div v-else-if="loading || loadError" class="loadStatus" :role="loadError ? 'alert' : 'status'" aria-live="polite">
      <template v-if="loadError">
        <span>{{ loadError }}</span>
        <el-button text @click="loadMore">重试</el-button>
      </template>
      <span v-else>正在加载作品…</span>
    </div>
    <exploreDetail v-if="selectedProjectId" :projectId="selectedProjectId" @close="selectedProjectId = ''" />
    <publishWorkDialog v-if="publishVisible" @closed="publishVisible = false" />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { IconHeart, IconPlus, IconSearch } from "@tabler/icons-vue";
import type { ExploreCategory, ExplorePage, ExploreProject } from "@toonflow/server/channel";
import http from "@/lib/http";
import exploreDetail from "./exploreDetail.vue";
import publishWorkDialog from "./publishWorkDialog.vue";

const props = defineProps<{ scrollElement?: HTMLElement }>();
const exploreElement = ref<HTMLElement>();
const gridElement = ref<HTMLElement>();
const categories = ref<ExploreCategory[]>([]);
const projects = ref<ExploreProject[]>([]);
const selectedCategory = ref("");
const selectedProjectId = ref("");
const publishVisible = ref(false);
const search = ref("");
const loading = ref(false);
const loadError = ref("");
const unavailable = ref(false);
const columnCount = ref(4);
const rowHeight = ref(200);
const scrollMargin = ref(0);
const rowVirtualizer = useVirtualizer<HTMLElement, HTMLDivElement>(computed(() => {
  const items = projects.value;
  const columns = columnCount.value;
  const height = rowHeight.value;
  return {
    count: Math.ceil(items.length / columns),
    getScrollElement: () => props.scrollElement ?? null,
    getItemKey: (index: number) => `${columns}:${items[index * columns]!.id}`,
    estimateSize: () => height,
    gap: 16,
    overscan: 2,
    scrollMargin: scrollMargin.value,
    useAnimationFrameWithResizeObserver: true,
  };
}));
const visibleRows = computed(() => rowVirtualizer.value.getVirtualItems().map(row => ({ row, items: projects.value.slice(row.index * columnCount.value, (row.index + 1) * columnCount.value) })));
const loadedIds = new Set<string>();
const loadedCursors = new Set<string | undefined>();
let nextCursor: string | undefined;
let hasMore = true;
let requestController: AbortController | undefined;
let searchTimer: ReturnType<typeof setTimeout> | undefined;
let filterPending = false;
let filterVersion = 0;
let layoutFrame = 0;
let disposed = false;

async function loadMore() {
  if (disposed || loading.value || !hasMore || filterPending) return;
  const controller = new AbortController();
  requestController = controller;
  const cursor = nextCursor;
  loading.value = true;
  loadError.value = "";
  unavailable.value = false;
  try {
    const result = await http<ExplorePage>({
      method: "POST", url: "/api/channel/community/getExploreProjects", signal: controller.signal,
      data: { cursor, limit: 24, categoryId: selectedCategory.value || undefined, searchKeyword: search.value.trim() || undefined },
    });
    if (controller.signal.aborted) return;
    if (result.nextCursor !== null && (result.nextCursor === cursor || loadedCursors.has(result.nextCursor))) throw new Error("云端分页游标重复，请重试");
    const newItems = [...new Map(result.list.map(item => [item.id, item])).values()].filter(item => !loadedIds.has(item.id));
    if (!newItems.length && result.nextCursor !== null) throw new Error("云端没有返回新的作品，请重试");
    categories.value = result.categories;
    for (const item of newItems) loadedIds.add(item.id);
    projects.value.push(...newItems);
    loadedCursors.add(cursor);
    nextCursor = result.nextCursor ?? undefined;
    hasMore = result.nextCursor !== null;
  } catch (error) {
    if (controller.signal.aborted) return;
    unavailable.value = error instanceof Error && "status" in error && error.status === 404;
    if (!unavailable.value) loadError.value = error instanceof Error ? error.message : "加载作品失败，请重试";
  } finally {
    if (!controller.signal.aborted) {
      loading.value = false;
      await nextTick();
      scheduleLayout();
    }
  }
}

function scheduleLayout() {
  if (layoutFrame || disposed) return;
  layoutFrame = requestAnimationFrame(async () => {
    layoutFrame = 0;
    const scroll = props.scrollElement;
    const grid = gridElement.value;
    if (!scroll || !grid || !grid.clientWidth) return;
    columnCount.value = Math.min(4, Math.max(1, Math.floor((grid.clientWidth + 16) / 256)));
    rowHeight.value = Math.ceil((grid.clientWidth - (columnCount.value - 1) * 16) / columnCount.value * 2 / 3);
    scrollMargin.value = grid.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - scroll.clientTop;
    await nextTick();
    if (disposed || scroll !== props.scrollElement) return;
    const listBottom = scrollMargin.value + rowVirtualizer.value.getTotalSize();
    if (!unavailable.value && !loadError.value && scroll.scrollTop + scroll.clientHeight + 600 >= listBottom) void loadMore();
  });
}

watch(rowHeight, () => rowVirtualizer.value.measure(), { flush: "post" });
watch([() => props.scrollElement, exploreElement], ([scroll, element], _previous, onCleanup) => {
  if (!scroll || !element) return;
  const observer = new ResizeObserver(scheduleLayout);
  observer.observe(scroll);
  observer.observe(element);
  if (scroll.firstElementChild) observer.observe(scroll.firstElementChild);
  scroll.addEventListener("scroll", scheduleLayout, { passive: true });
  scheduleLayout();
  onCleanup(() => {
    observer.disconnect();
    scroll.removeEventListener("scroll", scheduleLayout);
  });
}, { immediate: true, flush: "post" });

watch([selectedCategory, search], ([category], [previousCategory]) => {
  const version = ++filterVersion;
  requestController?.abort();
  clearTimeout(searchTimer);
  loading.value = false;
  loadError.value = "";
  filterPending = true;
  searchTimer = setTimeout(async () => {
    projects.value = [];
    loadedIds.clear();
    loadedCursors.clear();
    nextCursor = undefined;
    hasMore = true;
    await nextTick();
    if (disposed || version !== filterVersion) return;
    const scroll = props.scrollElement;
    if (scroll && exploreElement.value) {
      const top = scroll.scrollTop + exploreElement.value.getBoundingClientRect().top - scroll.getBoundingClientRect().top - 24;
      if (scroll.scrollTop > top) scroll.scrollTo({ top: Math.max(0, top), behavior: "instant" });
    }
    filterPending = false;
    void loadMore();
    scheduleLayout();
  }, category === previousCategory ? 300 : 0);
}, { flush: "sync" });

onMounted(() => {
  void loadMore();
  scheduleLayout();
});
onUnmounted(() => {
  disposed = true;
  requestController?.abort();
  clearTimeout(searchTimer);
  cancelAnimationFrame(layoutFrame);
});
</script>

<style scoped lang="scss">
.explore {
  max-width: 1280px;
  margin: 56px auto 0;
  padding-top: 32px;
  border-top: 1px solid var(--el-border-color-lighter);

  button {
    font: inherit;

    &:focus-visible {
      outline: 2px solid var(--el-color-primary);
      outline-offset: 3px;
    }
  }

  .exploreToolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px 24px;

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      line-height: 1.5;
    }

    .toolbarActions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;

      .searchInput { width: 216px; }
    }
  }

  .categoryFilters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 20px 0 24px;

    button {
      padding: 9px 12px;
      border: 0;
      border-radius: var(--ui-radius-large);
      background: transparent;
      color: var(--el-text-color-secondary);
      font-size: 13px;
      cursor: pointer;

      &:hover { color: var(--el-text-color-primary); }

      &.active {
        background: var(--el-fill-color);
        color: var(--el-text-color-primary);
        font-weight: 600;
      }
    }
  }

  .projectGrid {
    position: relative;
    overflow-anchor: none;

    .projectRow {
      position: absolute;
      top: 0;
      left: 0;
      display: grid;
      width: 100%;
      gap: 16px;

      .projectCard {
        position: relative;
        min-width: 0;
        height: 100%;
        padding: 0;
        overflow: hidden;
        border: 1px solid var(--el-border-color-extra-light);
        border-radius: calc(var(--ui-radius) * 2);
        background: var(--el-fill-color-light);
        color: white;
        text-align: start;
        cursor: pointer;

        &:focus-visible { outline-offset: -3px; }

        .cardCover, .cardShade {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .cardCover { object-fit: cover; }
        .cardShade { background: linear-gradient(180deg, transparent 30%, rgb(0 0 0 / 78%)); }

        .cardFooter {
          position: absolute;
          right: 12px;
          bottom: 14px;
          left: 12px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;

          .cardInfo {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 6px;
            min-width: 0;

            .authorName, .projectTitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .authorName { font-size: 12px; opacity: 0.85; }
            .projectTitle { font-size: 14px; line-height: 1.5; }
          }

          .cardStats {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 5px;
            font-size: 11px;

            > span {
              display: flex;
              align-items: center;
              gap: 4px;

            }
          }
        }
      }
    }
  }

  .loadStatus {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    padding: 20px 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  @media (max-width: 480px) {
    .exploreToolbar .toolbarActions {
      width: 100%;

      .searchInput { flex: 1; width: 0; }
    }
  }
}
</style>

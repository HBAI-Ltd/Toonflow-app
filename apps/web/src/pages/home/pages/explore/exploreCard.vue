<template>
  <button class="exploreCard" type="button" :aria-label="`查看作品：${item.title}，作者 ${item.author.name}`">
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
</template>

<script setup lang="ts">
import type { ExploreProject } from "@toonflow/server/channel";

defineProps<{ item: ExploreProject }>();
</script>

<style lang="scss" scoped>
.exploreCard {
  position: relative;
  width: 100%;
  min-width: 0;
  aspect-ratio: 3 / 2;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: calc(var(--ui-radius) * 2);
  background: var(--el-fill-color-light);
  color: white;
  font: inherit;
  text-align: start;
  cursor: pointer;

  // 与探索面板内按钮的焦点样式一致，避免两处样式按加载顺序互相覆盖。
  &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }

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
</style>

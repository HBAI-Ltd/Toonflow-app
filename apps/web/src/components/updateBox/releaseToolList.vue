<template>
  <section class="releaseToolList" aria-label="媒体工具">
    <p class="entryCount">{{ t`${entryCount} 个入口` }}</p>
    <section v-for="category in categories" :key="category.label" class="mediaCategory">
      <h5>{{ translate(category.label) }} <span>{{ category.count }}</span></h5>
      <ul class="toolGroups">
        <li v-for="group in category.groups" :key="group.label">
          <strong>{{ translate(group.label) }}</strong>
          <ul class="toolNames"><li v-for="tool in group.tools" :key="tool">{{ translate(tool) }}</li></ul>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { t, translate } from "@toonflow/i18n/vue";
import { releaseMediaCatalog } from "./releaseMediaCatalog";

const categories = releaseMediaCatalog.map(category => ({
  ...category,
  count: category.groups.reduce((sum, group) => sum + group.tools.length, 0),
}));
const entryCount = categories.reduce((sum, category) => sum + category.count, 0);
</script>

<style scoped lang="scss">
.releaseToolList {
  margin-block: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.8;

  .entryCount { margin: 0; }
  .mediaCategory {
    margin-top: 8px;
    h5 {
      margin: 0;
      color: var(--el-text-color-primary);
      font-size: 13px;
      span { font-weight: normal; }
    }
    .toolGroups {
      margin: 2px 0 0;
      padding-inline-start: 18px;
      > li { padding-block: 2px; }
      strong { margin-inline-end: 8px; color: var(--el-text-color-primary); }
      .toolNames {
        display: inline;
        margin: 0;
        padding: 0;
        list-style: none;
        li { display: inline-block; max-width: 100%; }
        li:not(:last-child)::after { content: "·"; margin-inline: .4em; color: var(--el-text-color-secondary); }
      }
    }
  }
}
</style>

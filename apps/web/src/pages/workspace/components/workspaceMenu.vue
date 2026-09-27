<template>
  <div class="workspaceMenu">
    <el-card shadow="never" :bodyStyle="{ padding: '5px 10px' }">
      <div class="menuContent">
        <el-button class="toolButton" text :aria-label="t('exitProject')" :title="t('exitProject')" @click="exitVisible = true">
          <icon-x :size="17" aria-hidden="true" />
        </el-button>
        <el-button class="toolButton" text :aria-label="hasDesktopUpdate ? t('settingsUpdate') : t('settings')" :title="t('settings')" @click="emit('openSettings')">
          <el-badge isDot :hidden="!hasDesktopUpdate">
            <icon-settings :size="17" aria-hidden="true" />
          </el-badge>
        </el-button>
      </div>
    </el-card>
    <el-dialog v-model="exitVisible" :title="t('exitProject')" width="360px" alignCenter appendToBody>
      <span>{{ t("exitThisProjectAndReturn") }}</span>
      <template #footer>
        <el-button @click="exitVisible = false">{{ t("cancel") }}</el-button>
        <el-button type="primary" :loading="leaving" @click="exitProject">{{ t("exitProject") }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { t } from "@/pages/i18n";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { IconX, IconSettings } from "@tabler/icons-vue";
import { hasDesktopUpdate } from "@/stores/desktopUpdate";

const emit = defineEmits<{ openSettings: [] }>();
const router = useRouter();
const exitVisible = ref(false);
const leaving = ref(false);

async function exitProject() {
  if (leaving.value) return;
  leaving.value = true;
  try {
    await router.push("/home");
  } finally {
    leaving.value = false;
  }
}
</script>

<style scoped lang="scss">
.workspaceMenu {
  .menuContent {
    display: flex;
    align-items: center;
    gap: 10px;

    .toolButton {
      width: 28px;
      height: 28px;
      margin: 0;
      padding: 0;
    }
  }
}
</style>

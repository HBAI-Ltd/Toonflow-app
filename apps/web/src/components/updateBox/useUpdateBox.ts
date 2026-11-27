import { ref, shallowRef } from "vue";
import { ElMessage } from "element-plus";
import { saveSettings, settings } from "@/stores/settings";

export function useUpdateBox() {
  const updateBoxVisible = ref(false);
  const updateBoxBuild = shallowRef<{ version: string; hash: string }>();
  const dismissedBuilds = new Set<string>();

  function showUpdateBox(version: string, hash: string) {
    const buildKey = `${version}:${hash}`;
    const seenBuilds = settings.value.updateBoxSeenBuilds;
    if (dismissedBuilds.has(buildKey) || Array.isArray(seenBuilds) && seenBuilds.includes(buildKey)) return;
    if (updateBoxVisible.value && updateBoxBuild.value?.version === version && updateBoxBuild.value.hash === hash) return;
    updateBoxBuild.value = { version, hash };
    updateBoxVisible.value = true;
  }

  function rememberUpdateBox() {
    if (!updateBoxBuild.value) return;
    const buildKey = `${updateBoxBuild.value.version}:${updateBoxBuild.value.hash}`;
    dismissedBuilds.add(buildKey);
    // ACT: 桌面端启动端口会变化，用户关闭过的构建记录保存在应用设置中。
    void saveSettings(current => {
      const seenBuilds = Array.isArray(current.updateBoxSeenBuilds) ? current.updateBoxSeenBuilds.filter(value => typeof value === "string") : [];
      return seenBuilds.includes(buildKey) ? undefined : { updateBoxSeenBuilds: [...seenBuilds, buildKey] };
    }).catch(() => { ElMessage.warning("更新说明的展示记录保存失败，下次启动时可能再次显示。"); });
  }

  return { updateBoxVisible, updateBoxBuild, showUpdateBox, rememberUpdateBox };
}

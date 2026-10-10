import UIAbility from "@ohos.app.ability.UIAbility";
import window from "@ohos.window";
import runtime from "libtoonflowRuntime.so";

export default class entryAbility extends UIAbility {
  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent("pages/index").catch((error: Error) => console.error(`无法加载 Toonflow：${error.message}`));
    windowStage.getMainWindow().then((mainWindow: window.Window) => {
      mainWindow.setPreferredOrientation(window.Orientation.AUTO_ROTATION_LANDSCAPE)
        .catch((error: Error) => console.error(`无法设置横屏：${error.message}`));
      mainWindow.setWindowLayoutFullScreen(true)
        .catch((error: Error) => console.error(`无法设置全屏：${error.message}`));
      mainWindow.setWindowSystemBarEnable([])
        .catch((error: Error) => console.error(`无法隐藏系统栏：${error.message}`));
    }).catch((error: Error) => console.error(`无法获取应用窗口：${error.message}`));
  }

  onDestroy(): void {
    // ACT: Bun 随 Ability 运行；需要后台长任务时再接入鸿蒙后台任务机制。
    runtime.stop();
  }
}

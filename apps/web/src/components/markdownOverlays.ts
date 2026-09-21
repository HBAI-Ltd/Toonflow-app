import { defineComponent, h, ref, watch, type Component, type PropType } from "vue";
import { useZIndex } from "element-plus";
import { UI } from "vue-stream-markdown";

const openLayers = new Map<symbol, number>();

function withOverlayLayer(component: Component, isAlert = false) {
  return defineComponent({
    inheritAttrs: false,
    props: { open: Boolean, close: Function as PropType<() => void> },
    emits: ["update:open", "cancel"],
    setup(props, { attrs, emit, slots }) {
      const key = Symbol();
      const { nextZIndex } = useZIndex();
      const zIndex = ref(0);
      watch(() => props.open, (open, _previous, onCleanup) => {
        if (!open) return;
        // Alert 的遮罩使用 zIndex - 1，两个层级一起分配，确保遮罩也高于父窗口。
        nextZIndex();
        zIndex.value = nextZIndex();
        openLayers.set(key, zIndex.value);
        let closeOnKeyup = false;
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key !== "Escape" || event.isComposing || zIndex.value !== Math.max(...openLayers.values())) return;
          if (event.type === "keydown") {
            closeOnKeyup = !Array.from(document.querySelectorAll<HTMLElement>(".el-overlay, .el-drawer"))
              .some(element => element.getClientRects().length && Number(getComputedStyle(element).zIndex) > zIndex.value);
            if (!closeOnKeyup) return;
          }
          // 原组件在 keyup 关闭，Element Plus 在 keydown 关闭；同一次 Esc 只交给最上层。
          event.stopImmediatePropagation();
          if (event.type !== "keyup" || !closeOnKeyup) return;
          if (props.close) props.close();
          else {
            if (isAlert) emit("cancel");
            emit("update:open", false);
          }
        };
        window.addEventListener("keydown", handleEscape, true);
        window.addEventListener("keyup", handleEscape, true);
        onCleanup(() => {
          openLayers.delete(key);
          window.removeEventListener("keydown", handleEscape, true);
          window.removeEventListener("keyup", handleEscape, true);
        });
      }, { immediate: true });
      return () => h(component, {
        ...attrs, open: props.open, close: props.close, zIndex: zIndex.value,
        "onUpdate:open": (value: boolean) => emit("update:open", value),
        onCancel: () => emit("cancel"),
      }, slots);
    },
  });
}

export default { Alert: withOverlayLayer(UI.Alert, true), Modal: withOverlayLayer(UI.Modal) };

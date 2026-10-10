declare const browser: {
  runtime: {
    connectNative(name: string): {
      postMessage(message: unknown): void;
      onMessage: { addListener(listener: (message: { type: string; detail?: { requestId: string; saved: boolean; error?: string } }) => void): void };
    };
  };
};
declare function cloneInto(value: unknown, target: Window): unknown;

const port = browser.runtime.connectNative("toonflow");
port.onMessage.addListener(message => {
  if (message.type !== "save" || typeof message.detail?.requestId !== "string" || typeof message.detail.saved !== "boolean") return;
  window.dispatchEvent(new CustomEvent("toonflow:mobile-save", { detail: cloneInto(message.detail, window) }));
});

const probe = document.querySelector<HTMLMetaElement>('meta[name="toonflowBrowserProbe"]');
if (probe?.content) port.postMessage({ type: "probe", result: JSON.parse(probe.content) });

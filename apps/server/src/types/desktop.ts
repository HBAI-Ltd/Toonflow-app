export type PluginInstallType = "node" | "tool" | "skill" | "provider" | "agent";
export type PluginInstallRequest = { type: PluginInstallType; url: string; fileName: string };

export type updateSnapshot = {
  version: string;
  channel: string;
  hash: string;
  latestVersion: string;
  latestHash: string;
  error: string;
  updateAvailable: boolean;
  updateReady: boolean;
  updating: boolean;
  canUpdate: boolean;
};

export interface DesktopRuntime {
  openUrl(url: string): void;
  readClipboardText(): string | null;
  writeClipboardText(text: string): void;
  selectProviderFile(): Promise<string | null>;
  selectDirectory(): Promise<string | null>;
  selectSaveFile(fileName: string): Promise<string | null>;
  saveFile(token: string, content: Uint8Array): Promise<boolean>;
  ready(failed?: boolean): Promise<void>;
  openDevTools(): void;
  updater: {
    getLocalInfo(): Promise<{ version: string; channel: string; hash: string; baseUrl: string }>;
    updateInfo(): { version?: string; hash?: string; error?: string; updateAvailable?: boolean; updateReady?: boolean } | undefined;
    checkForUpdate(): Promise<{ error?: string }>;
    downloadUpdate?(): Promise<void>;
    applyUpdate?(): Promise<void>;
  };
}

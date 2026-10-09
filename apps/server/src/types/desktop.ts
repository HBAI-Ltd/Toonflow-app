export type PluginInstallType = "node" | "tool" | "skill" | "provider" | "agent" | "ext";
export type PluginInstallRequest = { type: PluginInstallType; url: string; fileName: string };

export type desktopUpdateAttempt = {
  attemptId: string;
  runtimeId: string;
  channel: string;
  targetVersion: string;
  targetHash: string;
  failure?: string;
};

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
  updateProgress?: { phase: "downloading" | "preparing"; received: number; total?: number };
  installFailure?: {
    attemptId: string;
    targetVersion: string;
    targetHash: string;
    currentVersion: string;
    currentHash: string;
    message: string;
    downloadUrl: string;
  };
};

export interface DesktopRuntime {
  openUrl(url: string): void;
  showItemInFolder(path: string): void;
  readClipboardText(): string | null;
  readClipboardImage(): Uint8Array | null;
  writeClipboardImage(image: Uint8Array): void;
  writeClipboardText(text: string): void;
  selectProviderFile(): Promise<string | null>;
  selectDirectory(): Promise<string | null>;
  selectSaveFile(fileName: string): Promise<string | null>;
  saveFile(token: string, content: Uint8Array): Promise<boolean>;
  ready(failed?: boolean): Promise<void>;
  openDevTools(): void;
  updater: {
    getLocalInfo(): Promise<{ version: string; channel: string; hash: string; baseUrl: string }>;
    updateInfo(): { version?: string; hash?: string; error?: string; installError?: string; updateAvailable?: boolean; updateReady?: boolean; updateProgress?: updateSnapshot["updateProgress"] } | undefined;
    checkForUpdate(): Promise<{ error?: string }>;
    onStatusChange?(callback: ((entry: { status: string; details?: { bytesDownloaded?: number; totalBytes?: number } }) => void) | null): void;
    confirmStartup?(failed?: boolean): void | Promise<void>;
    downloadUpdate?(): Promise<void>;
    applyUpdate?(): Promise<void>;
  };
}

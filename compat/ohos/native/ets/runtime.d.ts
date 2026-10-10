export const start: (runtimePath: string, programDir: string, dataDir: string, cacheDir: string) => Promise<string>;
export const stop: () => void;
export const getError: () => string;

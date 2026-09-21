/// <reference path="./types.d.ts" />

import tfRouterLanguage from "./src/language/tfRouter";
import deepSeek from "./src/language/deepSeek";
import tfRouterMedia from "./src/media/tfRouter";

export type Provider = ProviderDefinition;
export type ProviderTools = ProviderContext["tool"];
export type AudioConvertOptions = Parameters<ProviderTools["audio"]["convert"]>[1];
export type FfmpegConvertOptions = Parameters<ProviderTools["ffmpeg"]["convert"]>[1];

export const languageProviders = [tfRouterLanguage, deepSeek] as const;
export const mediaProviders = [tfRouterMedia] as const;

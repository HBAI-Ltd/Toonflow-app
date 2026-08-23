/**
 * Toonflow AI provider template
 * @version 2.0
 */

// ============================================================
// Type definitions
// ============================================================

type VideoMode =
  | "singleImage" // single image reference
  | "startEndRequired" // first/last frame (both required)
  | "endFrameOptional" // first/last frame (last frame optional)
  | "startFrameOptional" // first/last frame (first frame optional)
  | "text" // text
  | (`videoReference:${number}` | `imageReference:${number}` | `audioReference:${number}`)[]; // multi-reference (the number indicates the limit)

interface TextModel {
  name: string;
  modelName: string;
  type: "text";
  think: boolean;
}

interface ImageModel {
  name: string;
  modelName: string;
  type: "image";
  mode: ("text" | "singleImage" | "multiReference")[];
  associationSkills?: string;
}

interface VideoModel {
  name: string;
  modelName: string;
  type: "video";
  mode: VideoMode[];
  associationSkills?: string;
  audio: "optional" | false | true;
  durationResolutionMap: { duration: number[]; resolution: string[] }[];
}

interface TTSModel {
  name: string;
  modelName: string;
  type: "tts";
  voices: { title: string; voice: string }[];
}

interface VendorConfig {
  id: string; // unique ID, used as the filename stored on the user's disk, symbols forbidden
  version: string; // version number, format x.y, must follow semantic versioning
  name: string; // provider name
  author: string; // author
  description?: string; // description, supports Markdown format
  icon?: string; // icon, Base64 format only, recommended size 128x128 pixels
  inputs: { key: string; label: string; type: "text" | "password" | "url"; required: boolean; placeholder?: string }[];
  inputValues: Record<string, string>;
  models: (TextModel | ImageModel | VideoModel | TTSModel)[];
}

type ReferenceList =
  | { type: "image"; sourceType: "base64"; base64: string }
  | { type: "audio"; sourceType: "base64"; base64: string }
  | { type: "video"; sourceType: "base64"; base64: string };

interface ImageConfig {
  prompt: string;
  referenceList?: Extract<ReferenceList, { type: "image" }>[];
  size: "1K" | "2K" | "4K";
  aspectRatio: `${number}:${number}`;
}

interface VideoConfig {
  duration: number;
  resolution: string;
  aspectRatio: "16:9" | "9:16";
  prompt: string;
  referenceList?: ReferenceList[];
  audio?: boolean;
  mode: VideoMode[];
}

interface TTSConfig {
  text: string;
  voice: string;
  speechRate: number;
  pitchRate: number;
  volume: number;
  referenceList?: Extract<ReferenceList, { type: "audio" }>[];
}

interface PollResult {
  completed: boolean;
  data?: string;
  error?: string;
}

// ============================================================
// Global declarations
// ============================================================

declare const axios: any; // HTTP request library
declare const logger: (msg: string) => void; // logging function
declare const jsonwebtoken: any; // JWT handling library
declare const zipImage: (base64: string, size: number) => Promise<string>; // image compression function, returns a headed base64 string
declare const zipImageResolution: (base64: string, w: number, h: number) => Promise<string>; // image resolution adjustment function, returns a headed base64 string
declare const mergeImages: (base64Arr: string[], maxSize?: string) => Promise<string>; // image compositing function, returns a headed base64 string
declare const urlToBase64: (url: string) => Promise<string>; // URL-to-Base64 function, returns a headed base64 string
declare const pollTask: (fn: () => Promise<PollResult>, interval?: number, timeout?: number) => Promise<PollResult>; // polling function, fn is an async function, interval is the polling interval, timeout is the timeout, returns fn's result
declare const createOpenAI: any;
declare const createDeepSeek: any;
declare const createZhipu: any;
declare const createQwen: any;
declare const createAnthropic: any;
declare const createOpenAICompatible: any;
declare const createXai: any;
declare const createMinimax: any;
declare const createGoogleGenerativeAI: any;
declare const exports: {
  vendor: VendorConfig;
  textRequest: (m: TextModel, t: boolean, tl: 0 | 1 | 2 | 3) => any; // text model
  imageRequest: (c: ImageConfig, m: ImageModel) => Promise<string>; // image model, returns a headed base64 string
  videoRequest: (c: VideoConfig, m: VideoModel) => Promise<string>; // video model, returns a headed base64 string
  ttsRequest: (c: TTSConfig, m: TTSModel) => Promise<string>; // (not yet available) speech model, returns a headed base64 string
  checkForUpdates?: () => Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }>; // update-check function, returns whether an update is available, the latest version, and release notes (supports Markdown format)
  updateVendor?: () => Promise<string>; // update function, returns the latest code text
};

// ============================================================
// Provider configuration
// ============================================================

const vendor: VendorConfig = {
  id: "null",
  version: "2.0",
  author: "Toonflow",
  name: "Blank Template",
  description: "## Development template, you can use this template for Vibe Coding",
  inputs: [
    { key: "apiKey", label: "API Key", type: "password", required: true },
    { key: "baseUrl", label: "Request URL", type: "url", required: true, placeholder: "Example: https://api.openai.com/v1" },
  ],
  inputValues: { apiKey: "", baseUrl: "https://api.openai.com/v1" },
  models: [{ name: "GPT-4o", modelName: "gpt-4o", type: "text", think: false }],
};

// ============================================================
// Adapter functions
// ============================================================

const textRequest = (model: TextModel, think: boolean, thinkLevel: 0 | 1 | 2 | 3) => {
  if (!vendor.inputValues.apiKey) throw new Error("Missing API Key");
  const apiKey = vendor.inputValues.apiKey.replace(/^Bearer\s+/i, "");
  return createOpenAI({ baseURL: vendor.inputValues.baseUrl, apiKey }).chat(model.modelName);
};

const imageRequest = async (config: ImageConfig, model: ImageModel): Promise<string> => {
  return "";
};

const videoRequest = async (config: VideoConfig, model: VideoModel): Promise<string> => {
  return "";
};

const ttsRequest = async (config: TTSConfig, model: TTSModel): Promise<string> => {
  return "";
};

const checkForUpdates = async (): Promise<{ hasUpdate: boolean; latestVersion: string; notice: string }> => {
  return { hasUpdate: false, latestVersion: "2.0", notice: "## New version release notes" };
};

const updateVendor = async (): Promise<string> => {
  return "";
};

// ============================================================
// Exports
// ============================================================

exports.vendor = vendor;
exports.textRequest = textRequest;
exports.imageRequest = imageRequest;
exports.videoRequest = videoRequest;
exports.ttsRequest = ttsRequest;
exports.checkForUpdates = checkForUpdates;
exports.updateVendor = updateVendor;

// This line ensures the current file is recognized as a module, avoiding global variable conflicts
export {};

/**
 * ============================================================
 * AI Code Generation Guide
 * ============================================================
 *
 * 【Overview】
 * This file is the Toonflow AI provider adapter template. When an AI generates
 * new provider adapter code, it must strictly follow the rules below, and must
 * ask the user for the target platform's curl call examples or API documentation
 * as the basis for the input.
 *
 * 【Prerequisites】
 * Before generating code, ask the user for at least one of the following:
 *   1. A curl request example for the target API (including the request URL,
 *      Headers, Body structure, and response structure)
 *   2. A link to the target API's official documentation, or documentation
 *      screenshots/text content
 *   3. The model type(s) to adapt (text / image / video / tts) and their
 *      capability descriptions
 * If there isn't enough information, proactively ask follow-up questions —
 * do not fabricate the API structure.
 *
 * 【Code Rules】
 *
 * 1. Do not introduce any external packages
 *    Do not use import / require — only use the methods and objects already
 *    declared in this file's "Global declarations" section, including:
 *    axios, logger, jsonwebtoken, zipImage, zipImageResolution, mergeImages,
 *    urlToBase64, pollTask, and the AI SDK factory functions createOpenAI,
 *    createDeepSeek, createZhipu, createQwen, createAnthropic,
 *    createOpenAICompatible, createXai, createMinimax, createGoogleGenerativeAI.
 *
 * 2. Do not declare discrete, all-caps constants outside the exports.* functions
 *    Bad example: const API_URL = "https://..."; const MAX_RETRY = 3;
 *    If a configurable constant value is genuinely needed, it must be declared
 *    in vendor.inputValues, and accessed via vendor.inputValues.xxx, so the
 *    user can configure it in the UI.
 *    If it's a purely internal temporary variable used only within a single
 *    function's logic, inline it inside the relevant exports.* function body,
 *    using camelCase naming.
 *
 * 3. Keep logic aggregated inside the exports.* functions as much as possible
 *    Each adapter function (textRequest / imageRequest / videoRequest /
 *    ttsRequest) should be self-contained, with request construction, sending,
 *    polling, and result parsing logic written inside the function body —
 *    avoid splitting into many external helper functions.
 *    If multiple functions genuinely share common logic (e.g. signature
 *    calculation, token generation, request header construction), it may be
 *    extracted into a camelCase-named function within the file, placed in the
 *    "Helper utilities" section before the "Adapter functions" section, and
 *    must not use all-caps naming.
 *
 * 4. Naming conventions
 *    All variables and functions must use camelCase; UPPER_SNAKE_CASE is
 *    forbidden.
 *
 * 5. No need to redeclare types
 *    All interfaces and types (VendorConfig, ImageConfig, VideoConfig,
 *    TTSConfig, TextModel, ImageModel, VideoModel, TTSModel, ReferenceList,
 *    PollResult, etc.) are already fully defined at the top of this file —
 *    use them directly when generating code, do not redeclare them.
 *
 * 6. Return value conventions
 *    - textRequest(model): returns an AI SDK chat model instance (created via
 *      a factory function such as createOpenAI).
 *    - imageRequest(config, model): returns a headed base64 string (e.g.
 *      "data:image/png;base64,..."). config.referenceList is of type
 *      Extract<ReferenceList, { type: "image" }>[], and every reference entry
 *      is in base64 form (sourceType is always "base64").
 *    - videoRequest(config, model): returns a headed base64 string (e.g.
 *      "data:video/mp4;base64,..."). config.referenceList is of type
 *      ReferenceList[] and can include image / video / audio references,
 *      and every reference entry is in base64 form (sourceType is always
 *      "base64"). config.mode is the array of currently active video modes —
 *      use it to decide how to consume referenceList.
 *    - ttsRequest(config, model): returns a headed base64 string (e.g.
 *      "data:audio/mp3;base64,..."). config.referenceList is of type
 *      Extract<ReferenceList, { type: "audio" }>[] (audio reference).
 *    When the API returns a URL rather than binary data, convert it with
 *    urlToBase64(url).
 *
 * 7. ReferenceList and VideoMode explained
 *    ReferenceList is the unified multimedia reference type; each entry
 *    contains:
 *      - type: "image" | "audio" | "video" (media type)
 *      - sourceType: "base64" (fixed to base64 in this template)
 *      - base64 (the corresponding data)
 *
 *    VideoMode defines the input modes a video model supports:
 *      - "text": pure text-to-video
 *      - "singleImage": a single first-frame image
 *      - "startEndRequired": first/last frame (both must be provided)
 *      - "endFrameOptional": first/last frame (last frame optional)
 *      - "startFrameOptional": first/last frame (first frame optional)
 *      - Array form such as ["imageReference:9", "videoReference:3",
 *        "audioReference:3"]: multimodal reference mode, where the number
 *        indicates the maximum count for that type.
 *
 *    In videoRequest, config.mode indicates the currently selected mode —
 *    use its value to decide:
 *      - how to extract the corresponding type of reference from
 *        config.referenceList
 *      - how to construct the image/video/audio parameters in the API
 *        request body
 *
 * 8. Handling asynchronous tasks
 *    For asynchronous tasks that require polling, such as video generation,
 *    use the global pollTask function:
 *    const result = await pollTask(async () => {
 *      const resp = await axios.get(...);
 *      if (resp.data.status === "SUCCESS") return { completed: true, data: resp.data.url };
 *      if (resp.data.status === "FAILED") return { completed: true, error: resp.data.message };
 *      return { completed: false };
 *    }, 5000, 600000); // poll every 5 seconds, 10-minute timeout
 *    if (result.error) throw new Error(result.error);
 *    return await urlToBase64(result.data!);
 *
 * 9. Error handling
 *    Validate required parameters (such as the API Key) at the start of each
 *    function, and throw with throw new Error("...") when missing.
 *    When an API request fails, extract a meaningful error message from the
 *    response and throw it — do not swallow the exception.
 *
 * 10. Logging
 *     Use logger("...") at key steps to output logs (e.g. "starting task
 *     submission", "task ID: xxx", "polling..."), to aid debugging.
 *
 * 11. Filling in the vendor configuration
 *     - id: lowercase English only, used as the filename, no special symbols
 *       or spaces.
 *     - version: semantic version format "x.y".
 *     - inputs: configure the authentication information required by the
 *       target API (API Key, Secret, request URL, etc.).
 *     - models: fill in based on the model list supported by the target
 *       platform, taking care to set type and each model's specific fields
 *       correctly.
 *       - VideoModel's mode corresponds to the input modes the API supports
 *         (see the VideoMode explanation in rule 7).
 *       - VideoModel's audio field: true (always generates audio), false
 *         (never generates audio), "optional" (user's choice).
 *       - VideoModel's durationResolutionMap corresponds to the resolutions
 *         available for each duration.
 *       - VideoModel's associationSkills is optional, used to describe the
 *         model's special capabilities.
 *       - ImageModel's mode corresponds to the image generation modes the
 *         API supports ("text" pure text, "singleImage" single-image
 *         reference, "multiReference" multi-image reference).
 *       - TTSModel's voices corresponds to the list of available voices.
 *
 * 12. Image processing
 *     - Use zipImage(base64, maxSizeKB) to compress image size when needed.
 *     - Use zipImageResolution(base64, width, height) to adjust image
 *       resolution when needed.
 *     - Use mergeImages(base64Arr, maxSize) to merge multiple images into
 *       one when needed.
 *     - All of the above functions accept and return headed base64 strings.
 *
 * 13. File structure
 *     Generated code must preserve this template's overall structure:
 *     Type definitions → Global declarations → Provider configuration →
 *     [Helper utilities (optional)] → Adapter functions → Exports
 *     Do not reorder these sections, and do not remove the existing
 *     structural comment separators.
 *     The helper utilities section is for camelCase-named helper functions
 *     shared by multiple adapter functions (e.g. getHeaders, getBaseUrl).
 *
 * 14. Export conventions
 *     The following fields must be exported (via exports.xxx = xxx
 *     assignment):
 *       - exports.vendor (required)
 *       - exports.textRequest (required)
 *       - exports.imageRequest (required)
 *       - exports.videoRequest (required)
 *       - exports.ttsRequest (required)
 *       - exports.checkForUpdates (optional)
 *       - exports.updateVendor (optional)
 *     Unimplemented adapter functions must keep an empty implementation
 *     (return ""); their export must not be omitted.
 *     The file must end with export {}; to ensure it is recognized as a
 *     module.
 *
 * 【Generation Workflow】
 * When a user requests generating a new provider adapter:
 *   1. Confirm the user has provided a curl example or API documentation.
 *   2. Analyze the API's authentication method, endpoint addresses, and
 *      request/response structure.
 *   3. Based on this template's structure, fill in the vendor configuration
 *      and the corresponding adapter functions.
 *   4. Following this template's ReferenceList definition, construct and
 *      consume referenceList in base64 form.
 *   5. Only implement the model types the user needs; leave unused functions
 *      with an empty implementation (return "").
 *   6. Generate complete, working code, ensuring there are no syntax errors
 *      and no missing exports.
 */

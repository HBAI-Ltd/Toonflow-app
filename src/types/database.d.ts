// @db-hash 674b008771764f291435651cc6d65979
//该文件由脚本自动生成，请勿手动修改

export interface t_aiModelMap {
  'configId'?: number | null;
  'id'?: number;
  'key'?: string | null;
  'name'?: string | null;
}
export interface t_artStyle {
  'id'?: number;
  'name'?: string | null;
  'styles'?: string | null;
}
export interface t_assets {
  'duration'?: string | null;
  'episode'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'intro'?: string | null;
  'name'?: string | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'remark'?: string | null;
  'scriptId'?: number | null;
  'segmentId'?: number | null;
  'shotIndex'?: number | null;
  'state'?: string | null;
  'type'?: string | null;
  'videoPrompt'?: string | null;
}
export interface t_chatHistory {
  'data'?: string | null;
  'id'?: number;
  'novel'?: string | null;
  'projectId'?: number | null;
  'type'?: string | null;
}
export interface t_config {
  'apiKey'?: string | null;
  'baseUrl'?: string | null;
  'createTime'?: number | null;
  'id'?: number;
  'manufacturer'?: string | null;
  'model'?: string | null;
  'modelType'?: string | null;
  'type'?: string | null;
  'userId'?: number | null;
}
export interface t_image {
  'assetsId'?: number | null;
  'filePath'?: string | null;
  'id'?: number;
  'projectId'?: number | null;
  'scriptId'?: number | null;
  'state'?: string | null;
  'type'?: string | null;
  'videoId'?: number | null;
}
export interface t_imageModel {
  'grid'?: number | null;
  'id'?: number;
  'manufacturer'?: string | null;
  'model'?: string | null;
  'type'?: string | null;
}
export interface t_novel {
  'chapter'?: string | null;
  'chapterData'?: string | null;
  'chapterIndex'?: number | null;
  'createTime'?: number | null;
  'id'?: number;
  'projectId'?: number | null;
  'reel'?: string | null;
}
export interface t_outline {
  'data'?: string | null;
  'episode'?: number | null;
  'id'?: number;
  'projectId'?: number | null;
}
export interface t_project {
  'artStyle'?: string | null;
  'createTime'?: number | null;
  'id'?: number | null;
  'intro'?: string | null;
  'name'?: string | null;
  'type'?: string | null;
  'userId'?: number | null;
  'videoRatio'?: string | null;
}
export interface t_prompts {
  'code'?: string | null;
  'customValue'?: string | null;
  'defaultValue'?: string | null;
  'id'?: number;
  'name'?: string | null;
  'parentCode'?: string | null;
  'type'?: string | null;
}
export interface t_script {
  'content'?: string | null;
  'id'?: number;
  'name'?: string | null;
  'outlineId'?: number | null;
  'projectId'?: number | null;
}
export interface t_setting {
  'id'?: number;
  'imageModel'?: string | null;
  'languageModel'?: string | null;
  'projectId'?: number | null;
  'tokenKey'?: string | null;
  'userId'?: number | null;
}
export interface t_storyline {
  'content'?: string | null;
  'id'?: number;
  'name'?: string | null;
  'novelIds'?: string | null;
  'projectId'?: number | null;
}
export interface t_taskList {
  'endTime'?: string | null;
  'id'?: number;
  'name'?: string | null;
  'projectName'?: number | null;
  'prompt'?: string | null;
  'startTime'?: string | null;
  'state'?: string | null;
}
export interface t_textModel {
  'id'?: number;
  'image'?: number | null;
  'manufacturer'?: string | null;
  'model'?: string | null;
  'responseFormat'?: string | null;
  'think'?: number | null;
  'tool'?: number | null;
}
export interface t_user {
  'id'?: number;
  'name'?: string | null;
  'password'?: string | null;
}
export interface t_video {
  'aiConfigId'?: number | null;
  'configId'?: number | null;
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'firstFrame'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'prompt'?: string | null;
  'resolution'?: string | null;
  'scriptId'?: number | null;
  'state'?: number | null;
  'storyboardImgs'?: string | null;
  'time'?: number | null;
}
export interface t_videoConfig {
  'aiConfigId'?: number | null;
  'audioEnabled'?: number | null;
  'createTime'?: number | null;
  'duration'?: number | null;
  'endFrame'?: string | null;
  'id'?: number;
  'images'?: string | null;
  'manufacturer'?: string | null;
  'mode'?: string | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'resolution'?: string | null;
  'scriptId'?: number | null;
  'selectedResultId'?: number | null;
  'startFrame'?: string | null;
  'storyboardId'?: number | null;
  'updateTime'?: number | null;
}
export interface t_videoModel {
  'aspectRatio'?: string | null;
  'audio'?: number | null;
  'durationResolutionMap'?: string | null;
  'id'?: number;
  'manufacturer'?: string | null;
  'model'?: string | null;
  'type'?: string | null;
}

export interface DB {
  "t_aiModelMap": t_aiModelMap;
  "t_artStyle": t_artStyle;
  "t_assets": t_assets;
  "t_chatHistory": t_chatHistory;
  "t_config": t_config;
  "t_image": t_image;
  "t_imageModel": t_imageModel;
  "t_novel": t_novel;
  "t_outline": t_outline;
  "t_project": t_project;
  "t_prompts": t_prompts;
  "t_script": t_script;
  "t_setting": t_setting;
  "t_storyline": t_storyline;
  "t_taskList": t_taskList;
  "t_textModel": t_textModel;
  "t_user": t_user;
  "t_video": t_video;
  "t_videoConfig": t_videoConfig;
  "t_videoModel": t_videoModel;
}

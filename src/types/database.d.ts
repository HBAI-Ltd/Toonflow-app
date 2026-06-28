// @db-hash 95fa033f929f6ef666b54a5370bd43f1
//该文件由脚本自动生成，请勿手动修改

export interface memories {
  'content': string;
  'createTime': number;
  'embedding'?: string | null;
  'id'?: string;
  'isolationKey': string;
  'name'?: string | null;
  'relatedMessageIds'?: string | null;
  'role'?: string | null;
  'summarized'?: number | null;
  'type': string;
}
export interface o_agentChatHistory {
  'agentMode'?: string | null;
  'createTime'?: number | null;
  'draft'?: string | null;
  'id'?: number;
  'lockedContext'?: string | null;
  'messages'?: string | null;
  'projectId': number;
  'scriptId'?: number | null;
  'threadKey': string;
  'updateTime'?: number | null;
}
export interface o_agentDeploy {
  'desc'?: string | null;
  'disabled'?: boolean | null;
  'id'?: number;
  'key'?: string | null;
  'maxOutputTokens'?: number | null;
  'model'?: string | null;
  'modelName'?: string | null;
  'name'?: string | null;
  'temperature'?: number | null;
  'type'?: string | null;
  'vendorId'?: string | null;
}
export interface o_agentWorkData {
  'createTime'?: number | null;
  'data'?: string | null;
  'episodesId'?: number | null;
  'id'?: number;
  'key'?: string | null;
  'projectId'?: number | null;
  'updateTime'?: number | null;
}
export interface o_artStyle {
  'fileUrl'?: string | null;
  'id'?: number;
  'label'?: string | null;
  'name'?: string | null;
  'prompt'?: string | null;
}
export interface o_assets {
  'assetsId'?: number | null;
  'audioBindState'?: number | null;
  'describe'?: string | null;
  'flowId'?: number | null;
  'id'?: number;
  'imageId'?: number | null;
  'name'?: string | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'promptErrorReason'?: string | null;
  'promptState'?: string | null;
  'remark'?: string | null;
  'scriptId'?: number | null;
  'startTime'?: number | null;
  'type'?: string | null;
}
export interface o_assets2Storyboard {
  'assetId'?: number;
  'storyboardId'?: number;
}
export interface o_assetsRole2Audio {
  'assetsAudioId'?: number;
  'assetsRoleId'?: number;
}
export interface o_creativeCanvasState {
  'createTime'?: number | null;
  'edgesLayout'?: string | null;
  'id'?: number;
  'nodesLayout'?: string | null;
  'projectId': number;
  'scriptId'?: number | null;
  'updateTime'?: number | null;
  'viewKey'?: string | null;
  'viewport'?: string | null;
}
export interface o_episodeMerge {
  'createTime'?: number | null;
  'duration'?: number | null;
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'projectId'?: number | null;
  'scriptId'?: number | null;
  'state'?: string | null;
}
export interface o_event {
  'createTime'?: number | null;
  'detail'?: string | null;
  'id'?: number;
  'name'?: string | null;
}
export interface o_eventChapter {
  'eventId'?: number | null;
  'id'?: number;
  'novelId'?: number | null;
}
export interface o_generationArtifact {
  'artifactType'?: string | null;
  'content'?: string | null;
  'contentHash'?: string | null;
  'createTime'?: number | null;
  'id'?: number;
  'meta'?: string | null;
  'modelName'?: string | null;
  'parentArtifactId'?: number | null;
  'projectId'?: number | null;
  'promptHash'?: string | null;
  'promptSource'?: string | null;
  'promptUsageId'?: number | null;
  'promptVersionId'?: number | null;
  'targetField'?: string | null;
  'targetId'?: string | null;
  'targetType'?: string | null;
  'taskId'?: number | null;
  'title'?: string | null;
}
export interface o_generationRevision {
  'afterHash'?: string | null;
  'afterText'?: string | null;
  'artifactId'?: number | null;
  'beforeHash'?: string | null;
  'beforeText'?: string | null;
  'createdBy'?: string | null;
  'createTime'?: number | null;
  'id'?: number;
  'note'?: string | null;
  'projectId'?: number | null;
  'segmentId'?: number | null;
  'targetField'?: string | null;
  'targetId'?: string | null;
  'targetType'?: string | null;
}
export interface o_generationSegment {
  'artifactId'?: number | null;
  'artifactType'?: string | null;
  'createTime'?: number | null;
  'endOffset'?: number | null;
  'hash'?: string | null;
  'id'?: number;
  'projectId'?: number | null;
  'segmentIndex'?: number | null;
  'segmentType'?: string | null;
  'startOffset'?: number | null;
  'text'?: string | null;
}
export interface o_genQueue {
  'createTime'?: number | null;
  'errorReason'?: string | null;
  'id'?: number;
  'kind'?: string | null;
  'maxRetry'?: number | null;
  'payload'?: string | null;
  'priority'?: number | null;
  'projectId'?: number | null;
  'retryCount'?: number | null;
  'state'?: string | null;
  'updateTime'?: number | null;
  'vendorId'?: string | null;
}
export interface o_image {
  'assetsId'?: number | null;
  'batchId'?: string | null;
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'resolution'?: string | null;
  'score'?: number | null;
  'scoreReason'?: string | null;
  'selected'?: number | null;
  'state'?: string | null;
  'type'?: string | null;
}
export interface o_imageFlow {
  'flowData': string;
  'id'?: number;
}
export interface o_modelPrompt {
  'fileName'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'path'?: string | null;
  'vendorId'?: string | null;
}
export interface o_novel {
  'chapter'?: string | null;
  'chapterData'?: string | null;
  'chapterIndex'?: number | null;
  'chapterOrder'?: number | null;
  'createTime'?: number | null;
  'errorReason'?: string | null;
  'event'?: string | null;
  'eventState'?: number | null;
  'id'?: number;
  'projectId'?: number | null;
  'reel'?: string | null;
  'section'?: string | null;
  'sectionOrder'?: number | null;
}
export interface o_project {
  'artStyle'?: string | null;
  'createTime'?: number | null;
  'directorManual'?: string | null;
  'id'?: number | null;
  'imageModel'?: string | null;
  'imageQuality'?: string | null;
  'intro'?: string | null;
  'mode'?: string | null;
  'name'?: string | null;
  'projectType'?: string | null;
  'type'?: string | null;
  'userId'?: number | null;
  'videoModel'?: string | null;
  'videoRatio'?: string | null;
}
export interface o_prompt {
  'data'?: string | null;
  'id'?: number;
  'name'?: string | null;
  'type'?: string | null;
  'useData'?: string | null;
}
export interface o_promptUsage {
  'createTime'?: number | null;
  'id'?: number;
  'key'?: string | null;
  'meta'?: string | null;
  'modelName'?: string | null;
  'promptHash'?: string | null;
  'promptSource'?: string | null;
  'promptVersionId'?: number | null;
  'relatedId'?: string | null;
  'relatedType'?: string | null;
  'scope'?: string | null;
  'taskId'?: number | null;
}
export interface o_promptVersion {
  'content'?: string | null;
  'createdBy'?: string | null;
  'createTime'?: number | null;
  'hash'?: string | null;
  'id'?: number;
  'key'?: string | null;
  'note'?: string | null;
  'promptType'?: string | null;
  'publishTime'?: number | null;
  'scope'?: string | null;
  'sourcePath'?: string | null;
  'sourceType'?: string | null;
  'status'?: string | null;
}
export interface o_script {
  'content'?: string | null;
  'createTime'?: number | null;
  'errorReason'?: string | null;
  'extractState'?: number | null;
  'id'?: number;
  'name'?: string | null;
  'projectId'?: number | null;
}
export interface o_scriptAssets {
  'assetId'?: number;
  'scriptId'?: number;
}
export interface o_setting {
  'key'?: string | null;
  'value'?: string | null;
}
export interface o_skillAttribution {
  'attribution'?: string;
  'skillId'?: string;
}
export interface o_skillList {
  'createTime': number;
  'description': string;
  'embedding'?: string | null;
  'id'?: string;
  'md5': string;
  'name': string;
  'path': string;
  'state': number;
  'type': string;
  'updateTime': number;
}
export interface o_storyboard {
  'cameraMovement'?: string | null;
  'createTime'?: number | null;
  'dialogue'?: string | null;
  'duration'?: string | null;
  'filePath'?: string | null;
  'flowId'?: number | null;
  'id'?: number;
  'index'?: number | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'reason'?: string | null;
  'scriptId'?: number | null;
  'shotType'?: string | null;
  'shouldGenerateImage'?: number | null;
  'soundEffect'?: string | null;
  'state'?: string | null;
  'track'?: string | null;
  'trackId'?: number | null;
  'videoDesc'?: string | null;
}
export interface o_taskProgress {
  'createTime'?: number | null;
  'current'?: number | null;
  'id'?: number;
  'message'?: string | null;
  'meta'?: string | null;
  'phase'?: string | null;
  'projectId': number;
  'scriptId'?: number | null;
  'status'?: string | null;
  'taskId': number;
  'total'?: number | null;
  'updateTime'?: number | null;
}
export interface o_tasks {
  'describe'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'projectId'?: number | null;
  'promptHash'?: string | null;
  'promptSource'?: string | null;
  'promptVersionId'?: number | null;
  'reason'?: string | null;
  'relatedObjects'?: string | null;
  'startTime'?: number | null;
  'state'?: string | null;
  'taskClass'?: string | null;
}
export interface o_user {
  'id'?: number;
  'name'?: string | null;
  'password'?: string | null;
}
export interface o_vendorConfig {
  'enable'?: number | null;
  'id'?: string;
  'inputValues'?: string | null;
  'models'?: string | null;
}
export interface o_video {
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'projectId'?: number | null;
  'scriptId'?: number | null;
  'state'?: string | null;
  'time'?: number | null;
  'videoTrackId'?: number | null;
}
export interface o_videoCompose {
  'audioPath'?: string | null;
  'createTime'?: number | null;
  'dialogue'?: string | null;
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'projectId'?: number | null;
  'scriptId'?: number | null;
  'state'?: string | null;
  'subtitlePath'?: string | null;
  'trackId'?: number | null;
  'videoId'?: number | null;
}
export interface o_videoTrack {
  'duration'?: number | null;
  'id'?: number;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'reason'?: string | null;
  'scriptId'?: number | null;
  'selectVideoId'?: number | null;
  'state'?: string | null;
  'videoId'?: number | null;
}

export interface DB {
  "memories": memories;
  "o_agentChatHistory": o_agentChatHistory;
  "o_agentDeploy": o_agentDeploy;
  "o_agentWorkData": o_agentWorkData;
  "o_artStyle": o_artStyle;
  "o_assets": o_assets;
  "o_assets2Storyboard": o_assets2Storyboard;
  "o_assetsRole2Audio": o_assetsRole2Audio;
  "o_creativeCanvasState": o_creativeCanvasState;
  "o_episodeMerge": o_episodeMerge;
  "o_event": o_event;
  "o_eventChapter": o_eventChapter;
  "o_generationArtifact": o_generationArtifact;
  "o_generationRevision": o_generationRevision;
  "o_generationSegment": o_generationSegment;
  "o_genQueue": o_genQueue;
  "o_image": o_image;
  "o_imageFlow": o_imageFlow;
  "o_modelPrompt": o_modelPrompt;
  "o_novel": o_novel;
  "o_project": o_project;
  "o_prompt": o_prompt;
  "o_promptUsage": o_promptUsage;
  "o_promptVersion": o_promptVersion;
  "o_script": o_script;
  "o_scriptAssets": o_scriptAssets;
  "o_setting": o_setting;
  "o_skillAttribution": o_skillAttribution;
  "o_skillList": o_skillList;
  "o_storyboard": o_storyboard;
  "o_taskProgress": o_taskProgress;
  "o_tasks": o_tasks;
  "o_user": o_user;
  "o_vendorConfig": o_vendorConfig;
  "o_video": o_video;
  "o_videoCompose": o_videoCompose;
  "o_videoTrack": o_videoTrack;
}

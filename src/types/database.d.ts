// @db-hash cfda16e8b7eca975fa0e7178d24cdfab
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
  'commercialAllowed'?: number | null;
  'describe'?: string | null;
  'flowId'?: number | null;
  'id'?: number;
  'imageId'?: number | null;
  'licenseNote'?: string | null;
  'licenseType'?: string | null;
  'name'?: string | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'promptErrorReason'?: string | null;
  'promptState'?: string | null;
  'remark'?: string | null;
  'scriptId'?: number | null;
  'sourceOwner'?: string | null;
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
export interface o_image {
  'assetsId'?: number | null;
  'errorReason'?: string | null;
  'filePath'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'resolution'?: string | null;
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
  'createTime'?: number | null;
  'errorReason'?: string | null;
  'event'?: string | null;
  'eventState'?: number | null;
  'id'?: number;
  'projectId'?: number | null;
  'reel'?: string | null;
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
export interface o_sr_asset_binding {
  'assetId'?: number | null;
  'bindingStatus'?: string | null;
  'createdAt'?: number | null;
  'id'?: number;
  'note'?: string | null;
  'shotId'?: string | null;
  'slotName'?: string | null;
  'slotType'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_asset_gap {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'id'?: number;
  'missingCount'?: number | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_consistency_report {
  'createdAt'?: number | null;
  'id'?: number;
  'reportJson'?: string | null;
  'reportMarkdown'?: string | null;
  'status'?: string | null;
  'taskId'?: number | null;
}
export interface o_sr_dialogue_structure {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'id'?: number;
  'status'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
  'version'?: number | null;
}
export interface o_sr_frame_sample {
  'createdAt'?: number | null;
  'filePath'?: string | null;
  'frameType'?: string | null;
  'id'?: number;
  'qualityScore'?: number | null;
  'shotId'?: string | null;
  'taskId'?: number | null;
  'timeSec'?: number | null;
}
export interface o_sr_frame_understanding {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'id'?: number;
  'provider'?: string | null;
  'reviewRequired'?: number | null;
  'shotId'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_generation_candidate {
  'candidateIndex'?: number | null;
  'createdAt'?: number | null;
  'durationSec'?: number | null;
  'errorReason'?: string | null;
  'generationJobId'?: number | null;
  'id'?: number;
  'metadataJson'?: string | null;
  'model'?: string | null;
  'providerId'?: string | null;
  'qualityScore'?: number | null;
  'selected'?: number | null;
  'shotId'?: string | null;
  'status'?: string | null;
  'taskId'?: number | null;
  'thumbnailPath'?: string | null;
  'updatedAt'?: number | null;
  'videoPath'?: string | null;
}
export interface o_sr_generation_cost {
  'candidateId'?: number | null;
  'createdAt'?: number | null;
  'errorCode'?: string | null;
  'errorReason'?: string | null;
  'estimatedCost'?: number | null;
  'generationJobId'?: number | null;
  'id'?: number;
  'latencyMs'?: number | null;
  'model'?: string | null;
  'providerId'?: string | null;
  'requestSizeBytes'?: number | null;
  'shotId'?: string | null;
  'taskId'?: number | null;
}
export interface o_sr_generation_job {
  'attempt'?: number | null;
  'candidateCount'?: number | null;
  'costJson'?: string | null;
  'createdAt'?: number | null;
  'errorReason'?: string | null;
  'finishedAt'?: number | null;
  'id'?: number;
  'inputPackageJson'?: string | null;
  'model'?: string | null;
  'providerId'?: string | null;
  'resultVideoPath'?: string | null;
  'shotId'?: string | null;
  'startedAt'?: number | null;
  'status'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_job {
  'attempt'?: number | null;
  'cancelRequested'?: number | null;
  'createdAt'?: number | null;
  'errorReason'?: string | null;
  'finishedAt'?: number | null;
  'id'?: number;
  'inputJson'?: string | null;
  'jobType'?: string | null;
  'lockedAt'?: number | null;
  'lockedBy'?: string | null;
  'nextRunAt'?: number | null;
  'parentJobId'?: number | null;
  'progress'?: number | null;
  'recoverable'?: number | null;
  'resultJson'?: string | null;
  'stage'?: string | null;
  'startedAt'?: number | null;
  'status'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_model_probe_result {
  'createdAt'?: number | null;
  'errorReason'?: string | null;
  'id'?: number;
  'latencyMs'?: number | null;
  'model'?: string | null;
  'providerId'?: string | null;
  'resultJson'?: string | null;
  'status'?: string | null;
}
export interface o_sr_model_route {
  'createdAt'?: number | null;
  'downgradeReasonsJson'?: string | null;
  'fallbackPlanJson'?: string | null;
  'id'?: number;
  'requiredCapabilitiesJson'?: string | null;
  'routeStatus'?: string | null;
  'selectedModel'?: string | null;
  'selectedProviderId'?: string | null;
  'shotId'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_provider_capability {
  'baseUrl'?: string | null;
  'capabilityJson'?: string | null;
  'createdAt'?: number | null;
  'displayName'?: string | null;
  'enabled'?: number | null;
  'id'?: number;
  'providerId'?: string | null;
  'providerType'?: string | null;
  'updatedAt'?: number | null;
}
export interface o_sr_quality_report {
  'candidateId'?: number | null;
  'createdAt'?: number | null;
  'id'?: number;
  'reportJson'?: string | null;
  'score'?: number | null;
  'shotId'?: string | null;
  'status'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_regenerated_storyboard {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'id'?: number;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
  'version'?: number | null;
}
export interface o_sr_shot_detection {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'engine'?: string | null;
  'id'?: number;
  'shotCount'?: number | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_shot_adaptation {
  'adaptedVisual'?: string | null;
  'assetMatchScore'?: number | null;
  'blockedReasonsJson'?: string | null;
  'createdAt'?: number | null;
  'downgradeReasonsJson'?: string | null;
  'id'?: number;
  'level'?: string | null;
  'matchedAssetsJson'?: string | null;
  'requiredSlotsJson'?: string | null;
  'shotId'?: string | null;
  'strategy'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_source_media {
  'audioPath'?: string | null;
  'coverPath'?: string | null;
  'createdAt'?: number | null;
  'durationSec'?: number | null;
  'fps'?: number | null;
  'hasAudio'?: number | null;
  'height'?: number | null;
  'id'?: number;
  'mediaJson'?: string | null;
  'normalizedPath'?: string | null;
  'sha256'?: string | null;
  'sizeBytes'?: number | null;
  'sourcePath'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
  'width'?: number | null;
}
export interface o_sr_story_ir {
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'id'?: number;
  'shotCount'?: number | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_storyboard_mapping {
  'createdAt'?: number | null;
  'id'?: number;
  'shotId'?: string | null;
  'storyboardId'?: number | null;
  'taskId'?: number | null;
  'trackId'?: number | null;
}
export interface o_sr_task {
  'aspectRatio'?: string | null;
  'cleanupAfter'?: number | null;
  'complianceStatus'?: string | null;
  'createdAt'?: number | null;
  'errorReason'?: string | null;
  'id'?: number;
  'lastSmokeResultJson'?: string | null;
  'lastVerifiedAt'?: number | null;
  'name'?: string | null;
  'platform'?: string | null;
  'projectId'?: number | null;
  'scriptId'?: number | null;
  'status'?: string | null;
  'updatedAt'?: number | null;
}
export interface o_sr_timeline_export {
  'candidateIdsJson'?: string | null;
  'createdAt'?: number | null;
  'errorReason'?: string | null;
  'expiresAt'?: number | null;
  'id'?: number;
  'outputPath'?: string | null;
  'reportJson'?: string | null;
  'status'?: string | null;
  'subtitleMode'?: string | null;
  'taskId'?: number | null;
  'updatedAt'?: number | null;
}
export interface o_sr_transcript {
  'avgSpeechRateCps'?: number | null;
  'createdAt'?: number | null;
  'dataJson'?: string | null;
  'engine'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'taskId'?: number | null;
}
export interface o_sr_upload_part {
  'createdAt'?: number | null;
  'id'?: number;
  'partIndex'?: number | null;
  'partSha256'?: string | null;
  'partSize'?: number | null;
  'path'?: string | null;
  'taskId'?: number | null;
  'uploadId'?: string | null;
}
export interface o_storyboard {
  'createTime'?: number | null;
  'duration'?: string | null;
  'filePath'?: string | null;
  'flowId'?: number | null;
  'id'?: number;
  'index'?: number | null;
  'projectId'?: number | null;
  'prompt'?: string | null;
  'reason'?: string | null;
  'scriptId'?: number | null;
  'shouldGenerateImage'?: number | null;
  'state'?: string | null;
  'track'?: string | null;
  'trackId'?: number | null;
  'videoDesc'?: string | null;
}
export interface o_tasks {
  'describe'?: string | null;
  'id'?: number;
  'model'?: string | null;
  'projectId'?: number | null;
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
  "o_agentDeploy": o_agentDeploy;
  "o_agentWorkData": o_agentWorkData;
  "o_artStyle": o_artStyle;
  "o_assets": o_assets;
  "o_assets2Storyboard": o_assets2Storyboard;
  "o_assetsRole2Audio": o_assetsRole2Audio;
  "o_event": o_event;
  "o_eventChapter": o_eventChapter;
  "o_image": o_image;
  "o_imageFlow": o_imageFlow;
  "o_modelPrompt": o_modelPrompt;
  "o_novel": o_novel;
  "o_project": o_project;
  "o_prompt": o_prompt;
  "o_script": o_script;
  "o_scriptAssets": o_scriptAssets;
  "o_setting": o_setting;
  "o_skillAttribution": o_skillAttribution;
  "o_skillList": o_skillList;
  "o_sr_asset_binding": o_sr_asset_binding;
  "o_sr_asset_gap": o_sr_asset_gap;
  "o_sr_consistency_report": o_sr_consistency_report;
  "o_sr_dialogue_structure": o_sr_dialogue_structure;
  "o_sr_frame_sample": o_sr_frame_sample;
  "o_sr_frame_understanding": o_sr_frame_understanding;
  "o_sr_generation_candidate": o_sr_generation_candidate;
  "o_sr_generation_cost": o_sr_generation_cost;
  "o_sr_generation_job": o_sr_generation_job;
  "o_sr_job": o_sr_job;
  "o_sr_model_probe_result": o_sr_model_probe_result;
  "o_sr_model_route": o_sr_model_route;
  "o_sr_provider_capability": o_sr_provider_capability;
  "o_sr_quality_report": o_sr_quality_report;
  "o_sr_regenerated_storyboard": o_sr_regenerated_storyboard;
  "o_sr_shot_adaptation": o_sr_shot_adaptation;
  "o_sr_shot_detection": o_sr_shot_detection;
  "o_sr_source_media": o_sr_source_media;
  "o_sr_story_ir": o_sr_story_ir;
  "o_sr_storyboard_mapping": o_sr_storyboard_mapping;
  "o_sr_task": o_sr_task;
  "o_sr_timeline_export": o_sr_timeline_export;
  "o_sr_transcript": o_sr_transcript;
  "o_sr_upload_part": o_sr_upload_part;
  "o_storyboard": o_storyboard;
  "o_tasks": o_tasks;
  "o_user": o_user;
  "o_vendorConfig": o_vendorConfig;
  "o_video": o_video;
  "o_videoTrack": o_videoTrack;
}

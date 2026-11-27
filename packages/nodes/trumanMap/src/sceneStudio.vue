<template>
  <div ref="studioRoot" class="sceneStudio" :class="{ splitLayout: timelineVisible, filmPreview, inspectorBeside: !!editorPanel && editorPanel !== 'life' }" :style="{ '--performanceBottom': timelineVisible ? (timelineCollapsed ? '68px' : `${timelineHeight + 24}px`) : '0px', '--chatHeight': `${chatHeight}px` }" tabindex="-1" @keydown.stop="handleKeyDown">
    <main class="worldCanvas" :class="{ dragOver, trackPicking }" @dragover.prevent.stop @drop.prevent.stop @pointerdown.capture="cancelTrackPick">
      <canvas ref="canvas" tabindex="0" aria-label="3D 场景，左键拖动框选，中键平移，按住右键环视，WASD 移动，Shift 下降，空格上升，滚轮放大缩小；触屏单指框选，双指拖动环视、捏合推拉" @contextmenu.prevent />
      <div v-if="filmPreview && filmAspectValue < 1" class="filmSafeFrame" aria-hidden="true"><i /></div>
    </main>

    <div v-if="performanceLabels.length" class="performanceLabels" aria-label="演绎动线与关键事件">
      <button v-for="label in performanceLabels" :key="label.key" type="button" :class="{ eventLabel: label.event, warningLabel: label.warning, selected: selectedTrackId === label.trackId }" :style="{ left: `${label.x}px`, top: `${label.y}px`, '--trackColor': label.color }" :disabled="locked" @click="selectPerformance(label.trackId, label.pointIndex)"><span class="trackDot" />{{ label.text }}</button>
    </div>

    <header class="worldHeader">
      <div class="worldInfo">
        <span>世界时间 {{ worldTimeLabel }}</span>
      </div>
      <div class="worldActions">
        <span class="saveStatus" role="status">{{ busy || (aiController ? 'AI 正在创作' : statusMessage) }}</span>
        <button type="button" :disabled="locked || (performanceDraft ? performanceDraft.points.length < 2 : !history.length)" aria-label="撤销" title="撤销 Ctrl+Z" @click="undo"><icon-arrow-back-up :size="18" /></button>
        <button type="button" class="redoAction" :disabled="locked || !!performanceDraft || !redoHistory.length" aria-label="重做" title="重做 Ctrl+Shift+Z" @click="redo"><icon-arrow-forward-up :size="18" /></button>
        <el-popover v-model:visible="exportMenuOpen" trigger="click" placement="bottom-end" :width="288" popperClass="exportMenuPopover" :disabled="locked || !studioCameras.length">
          <template #reference><button type="button" :class="{ exportHint: exportHint && studioCameras.length }" :disabled="locked || !studioCameras.length" aria-label="导出" :title="studioCameras.length ? '导出：分镜图、四视图、白模视频、场景微缩图、预演小样、镜头表（保存用 Ctrl+S，关闭时自动保存）' : '先分镜或加机位，再导出（保存用 Ctrl+S，关闭时自动保存）'"><icon-table-export :size="19" /></button></template>
          <div class="exportPanel">
            <section v-for="group in exportGroups" :key="group.name" :aria-label="translate(group.name)">
              <header>{{ translate(group.name) }}<small v-if="group.perShot && exportShotCount">{{ exportShotCount }} 镜</small></header>
              <div class="exportChoices">
                <el-checkbox v-for="key in group.keys" :key="key" :modelValue="exportPicks[key]" :title="translate(exportItemInfo[key].title)" @update:modelValue="value => setExportPick(key, !!value)"><component :is="exportIcons[key]" :size="15" />{{ translate(exportItemInfo[key].name) }}</el-checkbox>
              </div>
            </section>
            <footer>
              <button type="button" class="videoQuality" :title="videoEdge === 1920 ? '1080p（长边1920）：画质高、文件大、导出慢一些' : '720p（长边1280）：够看、导出快'" @click="setVideoEdge(videoEdge === 1920 ? 1280 : 1920)">{{ videoEdge === 1920 ? '1080p' : '720p' }}</button>
              <el-button v-if="exportTarget !== 'files'" size="small" text :disabled="!exportPickCount" :title="exportTarget === 'canvas' ? '不建节点，打成一个ZIP下载' : '不存素材库，打成一个ZIP下载'" @click="startExport('files')">下载</el-button>
              <el-button type="primary" size="small" :disabled="!exportPickCount" @click="startExport(exportTarget)">{{ { canvas: '导出到画布', assets: '导出到素材库', files: '下载' }[exportTarget] }}</el-button>
            </footer>
          </div>
        </el-popover>
        <button type="button" class="closeStudio" aria-label="关闭场景" title="保存并关闭场景" @click="requestClose"><icon-x :size="19" /></button>
      </div>
    </header>

    <p v-if="filmPreview && programCaption" class="filmCaption" :class="{ portrait: filmAspectValue < 1 }">{{ programCaption }}</p>
    <transition v-bind="panelTransition">
      <div v-if="filmPreview" class="filmPreviewBar floatingPanel" aria-label="全屏预演"><i class="cameraDot" :style="{ backgroundColor: monitorCamera ? cameraColor(monitorCamera.id) : undefined }" /><span>{{ monitorCamera && monitorCamera.id === programCamera?.id ? programLabel : monitorCamera?.name }}</span><button type="button" title="退出预演（Esc）" @click="setFilmPreview(false)"><icon-minimize :size="15" /><kbd>Esc</kbd></button></div>
    </transition>

    <transition v-bind="panelTransition">
      <div v-if="error || notice" class="studioNotice" role="alert"><span>{{ error || notice }}</span><button type="button" aria-label="关闭提示" @click="notice = ''"><icon-x :size="14" /></button></div>
    </transition>
    <transition v-bind="panelTransition">
      <div v-if="exportProgress" class="exportProgress">
        <div class="exportProgressCard floatingPanel" role="progressbar" aria-label="导出进度" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="exportPercent">
          <canvas ref="exportPreview" class="exportPreview" :width="exportPreviewSize.width" :height="exportPreviewSize.height" aria-hidden="true" />
          <div class="exportProgressInfo"><strong>{{ exportPercent }}%</strong><span>{{ translate(exportProgress.phase) }}</span><small v-if="exportEtaText">{{ exportEtaText }}</small></div>
          <el-progress :percentage="exportPercent" :showText="false" :strokeWidth="6" />
          <el-button size="small" @click="cancelExport"><icon-player-stop :size="14" />停止</el-button>
        </div>
      </div>
    </transition>

    <nav class="worldDock" aria-label="场景工具">
      <button type="button" :class="{ active: editorPanel === 'view' }" :aria-expanded="editorPanel === 'view'" :disabled="locked" aria-label="世界设置" title="世界" @click="toggleView"><icon-world :size="23" stroke="1.4" /><span>世界</span></button>
      <button type="button" :class="{ active: assetsOpen }" :aria-expanded="assetsOpen" title="素材库" @click="toggleAssets"><icon-package :size="23" stroke="1.4" /><span>素材</span></button>
      <button type="button" :class="{ active: brushPanelOpen }" :aria-expanded="brushPanelOpen" :disabled="locked" aria-label="画笔，地形与物件绘制" title="画笔" @click="toggleBrushPanel"><icon-brush :size="23" stroke="1.4" /><span>画笔</span></button>
      <button type="button" :class="{ active: editorPanel === 'life', hinting: performanceHint && editorPanel !== 'life' }" :aria-expanded="editorPanel === 'life'" :disabled="locked" aria-label="场景演绎" :title="performanceHint ? '演绎：播放、一键分镜、导出镜头表' : '演绎'" @click="toggleLife"><icon-heartbeat :size="23" stroke="1.4" /><span>演绎</span></button>
    </nav>
    <transition v-bind="panelTransition">
      <cameraViewfinder v-if="viewfinderVisible && monitorCamera" class="cameraViewfinder" :aspect="filmAspectValue" :name="monitorCamera.name" :color="cameraColor(monitorCamera.id)" :focalLength="viewfinderFocalLength" :rangeLabel="monitorRangeLabel" :recording="timelineRunning" :disabled="cameraLocked"
        @cameraMove="applyCameraMove" @shotSize="applyShotSize" @cameraAngle="applyCameraAngle" :hasPath="!!editTake?.path" :roll="monitorFraming?.roll ?? 0" :tracking="activeTrack?.mode ?? ''" :trackName="trackName" :trackPicking="trackPicking" :drawingPath="cameraPathDrawing" :trackSmooth="activeTrack?.smooth ?? trackingDefaults.smooth" :trackDeadzone="activeTrack?.deadzone ?? trackingDefaults.deadzone" :trackLimit="activeTrack?.limit ?? trackingDefaults.limit" :trackStabilize="activeTrack?.stabilize ?? trackingDefaults.stabilize" @trackSettings="setTrackingSettings" :shake="editTake?.shake ?? 0" :shakeRate="editTake?.shakeRate ?? 1" :hasShot="!!editTake" :keyActive="!!selectedShotKey && selectedShotKey.cameraId === monitorCamera.id" :easeInOut="editTake?.easing !== 'linear'" @shotFeel="setShotFeel"
        @canvas="setViewfinderCanvas" @gestureStart="beginCameraGesture" @gesture="moveCameraGesture" @gestureEnd="finishCameraGesture" @gestureCancel="cancelCameraGesture" @expand="setFilmPreview(true)"
        @track="toggleCameraTracking" @trackMode="setTrackingMode" @drawPath="toggleCameraPathDrawing" @addKey="addShotKeyAtPlayhead" @clearPath="clearCameraPath" />
    </transition>
    <transition v-bind="panelTransition">
      <cameraViewfinder v-if="viewfinderVisible" monitor storageKey="trumanMap.monitor" :defaultRight="16" :defaultTop="236" :name="programLabel" :aspect="filmAspectValue" :format="filmFormat" :formats="filmFormatItems" @format="setFilmFormatChoice" :color="programCamera ? cameraColor(programCamera.id) : '#8d9399'" :focalLength="programFraming?.focalLength ?? 35" :rangeLabel="filmClockLabel" :recording="timelineRunning" :caption="programCaption" @canvas="setMonitorCanvas" @expand="setFilmPreview(true)" />
    </transition>
    <transition v-bind="panelTransition">
      <cameraAnchorEditor v-if="anchorEditor" :key="anchorEditor.key" :style="anchorEditorStyle" :name="anchorEditor.name" :color="anchorEditor.color" :index="anchorEditor.index" :total="anchorEditor.total" :height="anchorEditor.height" :disabled="cameraLocked"
        @update="updateCameraAnchor" @remove="removeCameraAnchor" @close="closeCameraAnchor" />
    </transition>
    <transition v-bind="panelTransition">
      <cameraKeyEditor v-if="keyEditor" :key="keyEditor.key" :style="keyEditorStyle" :name="keyEditor.name" :color="keyEditor.color" :time="keyEditor.time" :values="keyEditor.values" :disabled="cameraLocked"
        @update="updateShotKey" @remove="removeShotKey" @close="closeShotKey" />
    </transition>
    <transition v-bind="panelTransition">
      <performancePointEditor v-if="selectedPointEditor" :key="selectedPointEditor.key" class="performancePointCard" :style="pointEditorStyle" :name="selectedPointEditor.name" :color="selectedPointEditor.color" :index="selectedPointEditor.index" :total="selectedPointEditor.total" :arrival="selectedPointEditor.arrival" :dwell="selectedPointEditor.dwell" :speed="selectedPointEditor.speed" :height="selectedPointEditor.height" :eventText="selectedPointEditor.eventText" :inertia="selectedPointEditor.inertia" :teleportNext="selectedPointEditor.teleportNext" :clipRoute="selectedPointEditor.clipRoute" :followLine="selectedPointEditor.followLine" @updateFollowLine="changeFollowLine" :parkour="selectedPointEditor.parkour" @updateParkour="changeParkour" :incomingTeleport="selectedPointEditor.incomingTeleport" :disabled="locked" @updateArrival="changePointArrival" @updateDwell="changePointDwell" @updateSpeed="changePointSpeed" @updateHeight="changePointHeight" @updateEventText="changePointEventText" @updateInertia="changePointInertia" @updateTeleport="changePointTeleport" @remove="removeSelectedPoint" @close="closePointEditor" />
    </transition>
    <div v-if="objectCarrying" class="drawRouteHint floatingPanel carryHint" role="status"><kbd>滚轮</kbd>/<kbd>R</kbd> 转向 · 按住 <kbd>Shift</kbd> 抬高 · <kbd>Esc</kbd> 放回</div>
    <div v-else-if="trackPicking" class="drawRouteHint floatingPanel trackPickHint" role="status"><icon-target :size="14" />点要跟踪的那一点（物体上或地面上）· Esc 取消</div>
    <div v-else-if="cameraPathDrawing" class="drawRouteHint floatingPanel trackPickHint" role="status"><icon-route :size="14" />拖出机位轨迹 · 按住 Shift 升降 · Esc 取消</div>
    <div v-else-if="performanceDraft" class="drawRouteHud floatingPanel" role="status">
      <span class="drawRouteState"><icon-route :size="15" />正在画路线 · {{ performanceDraft.points.length }} 个点</span>
      <button type="button" :disabled="locked || performanceDraft.points.length < 2" @click="undoPerformanceRoutePoint"><icon-arrow-back-up :size="14" />撤回</button>
      <button type="button" :disabled="locked || performanceDraft.points.length < 2" title="完成路线（Enter）" @click="finishPerformanceRoute()"><icon-check :size="14" />完成 <kbd>Enter</kbd></button>
      <button type="button" :disabled="locked" title="退出画线（Esc）" @click="exitPerformanceRoute">退出 <kbd>Esc</kbd></button>
    </div>
    <div v-else-if="editorPanel === 'life' && !selectedPointEditor && !selectedCameraId && !filmPreview && !selectedPerformanceRoute && (subjectId || !timelineTracks.length)" class="drawRouteHint floatingPanel" role="note">按住物体拖出路线</div>
    <div v-else-if="editorPanel === 'life' && !selectedPointEditor && !selectedCameraId && !filmPreview && selectedTrackId && timelineTracks.some(track => track.id === selectedTrackId && track.controller !== 'object')" class="drawRouteHint floatingPanel" role="note">拖点改位置 · 拖线加点 · 双击删点 · 拖终点外的小点接着画</div>

    <transition v-bind="panelTransition">
      <div v-if="selectedObject && selectedObjectIds.length < 2 && objectAnchor && editorPanel !== 'life' && editorPanel !== 'terrain' && !(editorPanel === 'brush' && sceneBrushPainting)" class="selectionToolbar floatingPanel" :ref="measureToolbar" :style="toolbarStyle" aria-label="选中物体操作">
        <button v-if="!nameEditing" type="button" class="objectNameButton" :disabled="locked" title="点击改名" @click="startObjectNameEdit"><span class="objectNameText">{{ selectedObject.name }}</span></button>
        <input v-else ref="nameInput" v-model="nameDraft" class="objectNameInput" maxlength="160" :disabled="locked" aria-label="修改物体名称" title="回车确认，Esc 取消" @blur="commitObjectNameEdit" @keydown.enter.prevent="commitObjectNameEdit" @keydown.esc.prevent.stop="cancelObjectNameEdit" />
        <label v-if="selectedObject.asset.kind === 'primitive'" class="toolbarColor" :title="`物体颜色 ${selectedObject.color}`">
          <input type="color" :value="selectedObject.color" :disabled="locked" aria-label="物体颜色" @change="updateObject(selectedObject.id, { color: ($event.target as HTMLInputElement).value })" />
          <span :style="{ backgroundColor: selectedObject.color }" aria-hidden="true" />
        </label>
        <button type="button" :disabled="locked" title="编辑此物体的演绎动线（E）" aria-keyshortcuts="E" @click="editObjectPerformance">动线<kbd>E</kbd></button>
        <span class="toolbarDivider" />
        <button type="button" :disabled="locked" aria-label="交给助手" title="交给助手，围绕这个物体继续修改" @click="handToAssistant"><icon-sparkles :size="17" /></button>
        <button type="button" :disabled="locked" :aria-label="selectedObject.visible ? '隐藏物体' : '显示物体'" :aria-pressed="selectedObject.visible" :title="selectedObject.visible ? '隐藏物体（眼睛）' : '显示物体（眼睛）'" @click="toggleObjectVisibility"><component :is="selectedObject.visible ? IconEye : IconEyeOff" :size="17" /></button>
        <button type="button" :disabled="locked" aria-label="聚焦选中物体" title="聚焦 F" @click="viewport?.focus(subjectId)"><icon-focus-centered :size="17" /></button>
        <button v-if="selectedObject.asset.shape === 'person'" type="button" :disabled="locked" aria-label="换成骨骼人物" title="设为主角：换成骨骼人物，能做肢体动作；位置、朝向、动线和机位跟拍都保留" @click="promoteToRigged"><icon-user-star :size="17" /></button>
        <button type="button" :disabled="locked" :class="{ active: !!replaceTargets.length }" aria-label="替换素材" title="替换素材：再去素材库点一件，换掉这件；位置、朝向、缩放、动线都保留" @click="beginReplace([subjectId])"><icon-replace :size="17" /></button>
        <button type="button" :disabled="locked" aria-label="复制物体" title="复制 Ctrl+D" @click="duplicateObject"><icon-copy :size="17" /></button>
        <button type="button" :disabled="locked" aria-label="移除场景物体" title="移除 Delete" @click="removeObject"><icon-trash :size="17" /></button>
      </div>
    </transition>
    <transition v-bind="panelTransition">
      <div v-if="selectedObjectIds.length > 1 && objectAnchor" class="selectionToolbar floatingPanel" :ref="measureToolbar" :style="toolbarStyle" aria-label="多选物体操作"><span>已选 {{ selectedObjectIds.length }} 件</span><button v-if="selectedObjectGroup" type="button" :disabled="locked" title="编辑整组演绎动线" @click="editObjectPerformance">动线</button><button type="button" :disabled="locked" title="聚焦 F" @click="viewport?.focusObjects(selectedObjectIds)"><icon-focus-centered :size="16" />聚焦</button><button type="button" :disabled="locked" title="打组 Ctrl+G" @click="groupSelectedObjects"><icon-package :size="16" />打组</button><button type="button" :disabled="locked" :class="{ active: !!replaceTargets.length }" title="替换素材：再去素材库点一件，所选全部换成它" @click="beginReplace(selectedObjectIds)"><icon-replace :size="16" />替换</button><button type="button" :disabled="locked" title="复制 Ctrl+D" @click="duplicateObjects"><icon-copy :size="16" />复制</button><button type="button" :disabled="locked" title="删除 Delete" @click="removeObjects(selectedObjectIds)"><icon-trash :size="16" />删除</button></div>
      <div v-else-if="selectedTerrainTree !== null && objectAnchor && !(editorPanel === 'terrain' && terrainPainting) && !(editorPanel === 'brush' && sceneBrushPainting)" class="selectionToolbar floatingPanel" :ref="measureToolbar" :style="toolbarStyle" aria-label="选中森林树木操作">
        <strong>森林树木</strong><span class="toolbarDivider" />
        <button type="button" :disabled="locked" aria-label="聚焦选中树木" title="聚焦 F" @click="focusTerrainTree"><icon-focus-centered :size="17" /></button>
        <button type="button" :disabled="locked" aria-label="删除选中树木" title="删除 Delete" @click="removeTerrainTree"><icon-trash :size="17" /></button>
      </div>
    </transition>

    <transition v-bind="panelTransition">
      <div v-if="showObjectHandles" class="objectHandles" :style="objectHandleStyle" aria-label="悬浮调整手柄">
        <div class="objectHandle heightHandle" :class="{ active: handleDrag?.kind === 'height' }" role="button" tabindex="0" :aria-disabled="locked" aria-label="上下拖动手柄调整底部高度；点击上半升高，下半降低" title="上下拖动调整高度；点击上半升高 0.1 m，下半降低 0.1 m" @pointerdown="beginObjectHandleDrag('height', $event)" @pointermove="moveObjectHandleDrag" @pointerup="endObjectHandleDrag($event)" @pointercancel="cancelObjectHandleDrag($event)" @lostpointercapture="cancelObjectHandleDrag($event)" @keydown.up.prevent="stepObjectHeight(0.1)" @keydown.down.prevent="stepObjectHeight(-0.1)">
          <icon-chevron-up :size="15" aria-hidden="true" />
          <icon-chevron-down :size="15" aria-hidden="true" />
        </div>
        <div class="objectHandleRow">
        <div class="objectHandle rotateHandle" :class="{ active: handleDrag?.kind === 'rotate' }" role="button" tabindex="0" :aria-disabled="locked" aria-label="左右拖动水平旋转物体，每次一度；单击旋转一度，双击还原" title="左右拖动水平旋转（Y，每次一度）；单击旋转 1°；双击还原" @dblclick.prevent.stop="resetObjectHandle('rotate')" @pointerdown="beginObjectHandleDrag('rotate', $event)" @pointermove="moveObjectHandleDrag" @pointerup="endObjectHandleDrag($event)" @pointercancel="cancelObjectHandleDrag($event)" @lostpointercapture="cancelObjectHandleDrag($event)" @keydown.left.prevent="stepObjectRotation(-1)" @keydown.right.prevent="stepObjectRotation(1)">
          <icon-rotate :size="16" aria-hidden="true" />
        </div>
        <div class="objectHandle tiltHandle" :class="{ active: handleDrag?.kind === 'tilt' }" role="button" tabindex="0" :aria-disabled="locked" aria-label="上下拖动前后倾斜、左右拖动左右侧倾，每次一度；单击向前倾斜一度，双击还原" title="上下拖动前后倾斜（X）、左右拖动左右侧倾（Z），每次一度；单击向前倾斜 1°；双击还原" @dblclick.prevent.stop="resetObjectHandle('tilt')" @pointerdown="beginObjectHandleDrag('tilt', $event)" @pointermove="moveObjectHandleDrag" @pointerup="endObjectHandleDrag($event)" @pointercancel="cancelObjectHandleDrag($event)" @lostpointercapture="cancelObjectHandleDrag($event)" @keydown.up.prevent="stepObjectTilt('x', 1)" @keydown.down.prevent="stepObjectTilt('x', -1)" @keydown.left.prevent="stepObjectTilt('z', -1)" @keydown.right.prevent="stepObjectTilt('z', 1)">
          <icon-tilt-shift :size="16" aria-hidden="true" />
        </div>
        <div class="objectHandle scaleHandle" :class="{ active: handleDrag?.kind === 'scale' }" role="button" tabindex="0" :aria-disabled="locked" aria-label="左右或上下拖动等比缩放物体；单击放大一成，双击还原" title="拖动等比缩放（右/上放大，左/下缩小）；单击放大 10%；双击还原原始大小" @dblclick.prevent.stop="resetObjectHandle('scale')" @pointerdown="beginObjectHandleDrag('scale', $event)" @pointermove="moveObjectHandleDrag" @pointerup="endObjectHandleDrag($event)" @pointercancel="cancelObjectHandleDrag($event)" @lostpointercapture="cancelObjectHandleDrag($event)" @keydown.left.prevent="stepObjectScale(1 / 1.1)" @keydown.right.prevent="stepObjectScale(1.1)">
          <icon-arrows-diagonal :size="16" aria-hidden="true" />
        </div>
        <div class="objectHandle gravityHandle" :class="{ active: objectGravity }" role="button" tabindex="0" :aria-disabled="locked" :aria-pressed="objectGravity" :aria-label="objectGravity ? '受重力已开启，点击关闭' : '受重力已关闭，点击开启'" :title="objectGravity ? '受重力：开（松手下落）· 点击关闭' : '受重力：关（自由悬空）· 点击开启'" @click="toggleObjectGravity" @keydown.enter.prevent="toggleObjectGravity" @keydown.space.prevent="toggleObjectGravity">
          <component :is="objectGravity ? IconArrowBarDown : IconFeather" :size="16" aria-hidden="true" />
        </div>
        </div>
        <span v-if="handleBadge" class="handleBadge" role="status">{{ handleBadge }}</span>
      </div>
    </transition>

    <transition v-bind="panelTransition">
      <aside v-if="editorPanel && editorPanel !== 'life'" class="editPanel floatingPanel" :class="{ terrainPanel: editorPanel === 'terrain', viewPanel: editorPanel === 'view' }" aria-label="场景内编辑">
        <div class="panelHeading"><button v-if="editorPanel === 'object'" type="button" aria-label="返回场景物体列表" @click="openInspector('scene')"><icon-chevron-left :size="15" /></button><input v-if="editorPanel === 'object' && selectedObject" class="objectTitleInput" :value="selectedObject.name" :disabled="locked" maxlength="160" aria-label="修改物体名称" title="修改名称，回车确认" @blur="renameObject" @keydown.enter="commitObjectName" @keydown.esc="cancelObjectName" /><h2 v-else><icon-brush v-if="brushPanelOpen" :size="17" /><icon-world v-else-if="editorPanel === 'view'" :size="17" />{{ brushPanelOpen ? '画笔' : editorPanel === 'view' ? '世界' : '编辑场景' }}</h2><button v-if="editorPanel === 'terrain' || editorPanel === 'brush'" type="button" :class="{ active: !(editorPanel === 'terrain' ? terrainPainting : sceneBrushPainting) }" :disabled="locked" :aria-pressed="!(editorPanel === 'terrain' ? terrainPainting : sceneBrushPainting)" :aria-label="`${(editorPanel === 'terrain' ? terrainPainting : sceneBrushPainting) ? '暂停' : '继续'}${editorPanel === 'terrain' ? '地形' : '场景'}绘制`" :title="(editorPanel === 'terrain' ? terrainPainting : sceneBrushPainting) ? '暂停绘制，自由浏览' : '继续绘制'" @click="togglePainting"><component :is="(editorPanel === 'terrain' ? terrainPainting : sceneBrushPainting) ? IconPlayerPause : IconBrush" :size="16" /></button><button type="button" aria-label="收起编辑面板" title="收起 Esc" @click="closeInspector"><icon-x :size="17" /></button></div>
        <div v-if="brushPanelOpen" class="brushPanelModes" role="group" aria-label="画笔类别">
          <button type="button" :class="{ active: editorPanel === 'terrain' }" :aria-pressed="editorPanel === 'terrain'" :disabled="locked" @click="chooseBrushPanel('terrain')"><icon-mountain :size="15" />地形</button>
          <button type="button" :class="{ active: editorPanel === 'brush' }" :aria-pressed="editorPanel === 'brush'" :disabled="locked" @click="chooseBrushPanel('brush')"><icon-brush :size="15" />物件</button>
        </div>
        <div v-if="editorPanel === 'view'" class="worldTabs" role="group" aria-label="世界设置分类">
          <button v-for="tab in worldTabs" :key="tab.id" type="button" :class="{ active: worldTab === tab.id }" :aria-pressed="worldTab === tab.id" @click="selectWorldTab(tab.id)"><component :is="tab.icon" :size="15" stroke="1.6" />{{ translate(tab.name) }}</button>
        </div>
        <div class="editScroll" :class="{ worldScroll: editorPanel === 'view' }">
          <sceneBrushPanel v-if="editorPanel === 'brush'" v-model="sceneBrushSettings" :availableAssets="brushAvailableAssets" :loadModel="loadModel" :disabled="locked" :painting="sceneBrushPainting" :status="sceneBrushStatus" @togglePainting="togglePainting" @choose="chooseSceneBrush" @assetsLoaded="mergeAvailableAssets" @selecting="sceneBrushSelecting = $event" />
          <template v-else-if="editorPanel === 'terrain'">
            <section class="editSection terrainBrushPanel" aria-label="地形笔刷">
              <div v-for="group in terrainBrushGroups" :key="group.name" class="terrainBrushGroup"><h4>{{ translate(group.name) }}</h4><div class="terrainBrushes" :class="{ shapeBrushes: group.name !== '水体', landformBrushes: group.name === '自然地形', waterBrushes: group.name === '水体' }" role="group" :aria-label="`${translate(group.name)}笔刷`"><button v-for="brush in group.brushes" :key="brush.id" type="button" :class="{ active: terrainPainting && terrainBrush === brush.id }" :disabled="locked" :aria-pressed="terrainPainting && terrainBrush === brush.id" @click="chooseTerrainBrush(brush.id)"><svg v-if="brush.profile" class="brushProfile" viewBox="0 0 36 22" fill="none" aria-hidden="true"><path :d="brush.profile" /></svg><component v-else :is="brush.icon" :size="18" stroke="1.6" /><span>{{ translate(brush.name) }}</span></button></div></div>
              <div v-if="selectedTerrainPaint" class="terrainPalette">
                <div class="paletteHeading"><span>{{ isTerrainWaterBrush ? "水体颜色" : "画笔颜色" }}</span><button type="button" :disabled="locked" @click="applyTerrainColor(selectedTerrainPaint.color)">还原</button></div>
                <div class="paletteColors" role="group" aria-label="画笔颜色"><button v-for="color in terrainPaletteColors" :key="color" type="button" :style="{ backgroundColor: color }" :class="{ active: terrainColor.toLowerCase() === color }" :disabled="locked" :aria-label="`使用颜色 ${color}`" :aria-pressed="terrainColor.toLowerCase() === color" @click="applyTerrainColor(color)" /><label class="customTerrainColor" title="自定义颜色"><input type="color" :value="terrainColor" :disabled="locked" aria-label="自定义画笔颜色" @focus="beginTerrainColor" @pointerdown="beginTerrainColor" @keydown.enter="beginTerrainColor" @keydown.space="beginTerrainColor" @input="previewTerrainColor" @change="commitTerrainColor" @blur="cancelTerrainColor" @keydown.esc.stop="cancelTerrainColor" /></label></div>
                <p class="terrainHint">用于接下来的笔触，已刷区域保持原色。</p>
              </div>
              <div class="terrainBrushGroup">
                <h4>地貌<span v-if="selectedTerrainSurface" class="selectedSurfaceName">{{ translate(selectedTerrainSurface.name) }}</span></h4>
                <div class="terrainSurfaceGroups" role="group" aria-label="地表类别"><button v-for="group in terrainSurfaceGroups" :key="group.id" type="button" :class="{ active: terrainSurfaceGroup === group.id }" :aria-pressed="terrainSurfaceGroup === group.id" :disabled="locked" @click="terrainSurfaceGroup = group.id">{{ translate(group.name) }}</button></div>
                <div class="terrainBrushes surfaceBrushes" role="group" aria-label="地表材质"><button v-for="surface in surfaceBrushes" :key="surface.id" type="button" :class="{ active: terrainPainting && terrainBrush === surface.brush }" :aria-pressed="terrainPainting && terrainBrush === surface.brush" :disabled="locked" @click="chooseTerrainBrush(surface.brush)"><span class="surfaceSwatch" :style="{ backgroundColor: terrainBrushColors[String(surface.id)] ?? surface.color }" aria-hidden="true" /><span>{{ translate(surface.name) }}</span></button></div>

                <p class="terrainHint">涂刷地表材质，不改变地形高度。</p>
              </div>
              <div class="brushSettings">
                <label class="terrainRange"><span>半径 <output>{{ terrainRadius.toFixed(1) }} <small>m</small></output></span><el-slider v-model="terrainRadius" :min="terrainMinRadius" :max="16" :step="0.5" :disabled="locked" :showTooltip="false" aria-label="地形笔刷半径" /></label>
                <label class="terrainRange"><span>强度 <output>{{ terrainStrength.toFixed(1) }}</output></span><el-slider v-model="terrainStrength" :min="0.1" :max="2" :step="0.1" :disabled="locked" :showTooltip="false" aria-label="地形笔刷强度" /></label>
                <label class="terrainRange"><span>流量 <output>{{ Math.round(terrainFlow * 100) }}<small>%</small></output></span><el-slider v-model="terrainFlow" :min="0" :max="1" :step="0.01" :disabled="locked" :showTooltip="false" aria-label="地形笔刷流量，每秒叠加量" /></label>
                <label class="terrainRange"><span>硬度 <output>{{ Math.round(terrainHardness * 100) }}<small>%</small></output></span><el-slider v-model="terrainHardness" :min="0" :max="1" :step="0.05" :disabled="locked" :showTooltip="false" aria-label="地形笔刷硬度" /></label>
                <label v-if="terrainBrush === 'flatten' || terrainBrush === 'ramp'" class="terrainTargetField"><span>{{ terrainBrush === 'ramp' ? '坡道终点高度' : '目标高度' }}</span><span class="numberWithUnit"><input type="number" :value="terrainTargetHeight" min="-12" max="40" step="any" :disabled="locked" :aria-label="terrainBrush === 'ramp' ? '坡道终点高度' : '定高目标高度'" @change="changeTerrainTargetHeight" /><span>m</span></span></label>
              </div>
              <p class="terrainHint">{{ terrainPainting ? '左键绘制 · [ ] 调半径 · Esc 取消本笔' : '按住右键环视，选择笔刷继续绘制' }}</p>
              <p class="terrainHint">{{ isTerrainWaterBrush ? "流量越低，河道开挖与水域形成越慢。" : "流量越低叠加越慢；停留或反复涂刷逐渐加深。" }}</p>
              <p v-if="terrainBrush === 'auto'" class="terrainHint">向上拖动抬高，向下拖动降低。</p>
              <p v-else-if="terrainBrush === 'ramp'" class="terrainHint">起笔处作为起点，拖出通往目标高度的直线坡道。</p>
              <p v-else-if="terrainBrush === 'terrace'" class="terrainHint">将已有山坡整理为梯级，半径越大台阶越高。</p>
              <p v-if="terrainBrush === 'river'" class="terrainHint">点按形成湖泊，拖动沿地势由高向低绘制河流。水体颜色用于本笔覆盖的水域。</p>
            </section>
          </template>
          <template v-else-if="editorPanel === 'view'">
            <sceneAssetsPanel v-if="worldTab === 'assets'" :objects="modelValue.objects" :groups="modelValue.objectGroups" :selectedIds="selectedObjectIds" :disabled="locked" @select="selectObjects" @focus="viewport?.focusObjects($event)" @remove="removeObjects" @removeGroup="removeObjectGroup" @group="groupSelectedObjects" @ungroup="ungroupObjects" @renameGroup="renameObjectGroup" />
            <div v-show="worldTab === 'space'" class="worldTabContent" role="region" aria-label="空间设置">
              <section class="editSection worldSizeSection">
                <div class="sectionHeading"><h3>世界大小</h3><output>{{ worldSize }} × {{ worldSize }} <small>m</small></output></div>
                <div class="worldSizeField"><label for="worldSizeInput">边长</label><div class="worldSizeInput"><input id="worldSizeInput" v-model="worldSizeInput" type="number" :min="worldSizeLimits.min" :max="worldSizeLimits.max" step="any" :disabled="locked" aria-label="世界边长" @keydown.enter.prevent="applyWorldSize" /><span>m</span></div><button type="button" :disabled="locked || !worldSizeValid || Number(worldSizeInput) === worldSize" @click="applyWorldSize">应用</button></div>
              </section>
              <section class="editSection spaceAtmosphere">
                <div class="sectionHeading"><h3>空气透视</h3><el-switch :modelValue="atmosphere.enabled" :disabled="locked" aria-label="空气透视" @update:modelValue="value => updateAtmosphere({ enabled: Boolean(value) })" /></div>
                <div v-if="atmosphere.enabled" @pointerdown.capture="beginAtmosphereEdit" @keydown.capture="beginAtmosphereEdit">
                  <label v-for="field in atmosphereFields" :key="field.key" class="terrainRange"><span>{{ translate(field.name) }}<output>{{ field.percent ? Math.round(atmosphere[field.key] * 100) : atmosphere[field.key] }}<small>{{ field.percent ? '%' : 'm' }}</small></output></span><el-slider :modelValue="atmosphere[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="locked" :showTooltip="false" :aria-label="`空气透视${translate(field.name)}`" @update:modelValue="value => previewAtmosphere({ [field.key]: Number(value) })" @change="commitAtmosphereDraft" /></label>
                  <label class="lightingColor"><span>散射颜色</span><output>{{ atmosphere.color }}</output><input type="color" :value="atmosphere.color" :disabled="locked" aria-label="空气透视散射颜色" @focus="beginAtmosphereEdit" @input="previewAtmosphere({ color: ($event.target as HTMLInputElement).value })" @change="commitAtmosphereDraft" /></label>
                </div>
              </section>
              <section class="editSection spaceDisplay"><h3>显示效果</h3><div class="worldGridToggle"><span>地面网格</span><el-switch :modelValue="modelValue.gridVisible" :disabled="locked" aria-label="显示网格" @update:modelValue="value => commit({ ...modelValue, gridVisible: Boolean(value) })" /></div><div v-for="option in spaceDisplayOptions" :key="option.key" class="worldGridToggle"><span>{{ translate(option.name) }}</span><el-switch :modelValue="modelValue.display?.[option.key] ?? option.defaultValue" :disabled="locked" :aria-label="translate(option.name)" @update:modelValue="value => updateSpaceDisplay(option.key, Boolean(value))" /></div></section>
            </div>
            <div v-show="worldTab === 'time'" class="worldTabContent" role="region" aria-label="时间与天象设置">
              <worldTimePanel :modelValue="displayTime" :disabled="locked" @begin="beginTimeEdit" @preview="previewTime" @commit="commitTimeDraft" @update="updateTime" />
            </div>
            <div v-show="worldTab === 'weather'" class="worldTabContent" role="region" aria-label="天气设置">
              <section class="editSection weatherSection">
                <div class="sectionHeading"><h3>天气叠加</h3><button type="button" :disabled="locked || !activeWeatherLayers.length" @click="clearWeatherLayers">清空</button></div>
                <p class="worldHint">{{ effectiveRain > 0 ? `${rainLevel} · ` : '' }}选择效果后可独立调整强度。</p>
                <div v-for="group in weatherGroups" :key="group.id" class="weatherGroup">
                  <h4>{{ translate(group.name) }}</h4>
                  <div class="weatherOptions" role="group" :aria-label="`${translate(group.name)}，可叠加`"><button v-for="layer in weatherLayerOptions.filter(layer => layer.group === group.id)" :key="layer.key" type="button" :class="{ active: weatherLayers[layer.key] > 0 }" :aria-pressed="weatherLayers[layer.key] > 0" :disabled="locked" @click="toggleWeatherLayer(layer.key)"><component :is="layer.icon" :size="21" stroke="1.5" /><span>{{ translate(layer.name) }}</span></button></div>
                  <div class="weatherLayers" @pointerdown.capture="beginWeatherEdit" @keydown.capture="beginWeatherEdit"><label v-for="layer in activeWeatherLayers.filter(layer => layer.group === group.id)" :key="layer.key" class="layerIntensity"><span>{{ translate(layer.strengthLabel) }}</span><el-slider :modelValue="weatherLayers[layer.key]" :min="0" :max="1" :step="0.05" :disabled="locked" :showTooltip="false" :aria-label="`${translate(layer.name)}强度`" @update:modelValue="value => previewWeatherLayers({ ...weatherLayers, [layer.key]: Number(value) })" @change="commitWeatherDraft" /><output>{{ Math.round(weatherLayers[layer.key] * 100) }}<small>%</small></output></label></div>
                </div>
                <div v-if="weatherLayers.aurora > 0" class="auroraSettings" @pointerdown.capture="beginWeatherEdit" @keydown.capture="beginWeatherEdit">
                  <label class="lightingColor"><span>极光颜色</span><output>{{ weather.auroraColor ?? '#7ce8b7' }}</output><input type="color" :value="weather.auroraColor ?? '#7ce8b7'" :disabled="locked" aria-label="极光颜色" @focus="beginWeatherEdit" @input="previewWeather({ auroraColor: ($event.target as HTMLInputElement).value })" @change="commitWeatherDraft" /></label>
                  <label class="terrainRange"><span>极光方位<output>{{ Math.round(weather.auroraDirection ?? 270) }}<small>°</small></output></span><el-slider :modelValue="weather.auroraDirection ?? 270" :min="0" :max="360" :step="1" :disabled="locked" :showTooltip="false" aria-label="极光方位" @update:modelValue="value => previewWeather({ auroraDirection: Number(value) })" @change="commitWeatherDraft" /></label>
                </div>
                <p class="worldHint">极光和流星在夜间显现，云雾会遮挡；彩虹在太阳较低时出现于背太阳方向。</p>
              </section>
              <section class="editSection weatherSection weatherTuning" @pointerdown.capture="beginWeatherEdit" @keydown.capture="beginWeatherEdit">
                <h3>强度与风</h3>
                <label class="terrainRange"><span>总强度 <output>{{ Math.round(weather.intensity * 100) }}<small>%</small></output></span><el-slider :modelValue="weather.intensity" :min="0" :max="1" :step="0.05" :disabled="locked" :showTooltip="false" aria-label="天气总强度" @update:modelValue="value => previewWeather({ intensity: Number(value) })" @change="commitWeatherDraft" /></label>
                <label class="terrainRange"><span><span class="fieldWithIcon"><icon-wind :size="14" />风力</span><output>{{ Math.round(weather.wind * 100) }}<small>%</small></output></span><el-slider :modelValue="weather.wind" :min="0" :max="1" :step="0.05" :disabled="locked" :showTooltip="false" aria-label="风力" @update:modelValue="value => previewWeather({ wind: Number(value) })" @change="commitWeatherDraft" /></label>
                <label class="windDirectionField"><span>风向（吹向）</span><select :value="weather.windDirection ?? 45" :disabled="locked" aria-label="风向，风吹向的方向" @change="updateWeather({ windDirection: Number(($event.target as HTMLSelectElement).value) })"><option v-for="direction in windDirectionOptions" :key="direction.value" :value="direction.value">{{ direction.label }}</option></select></label>
                <p class="worldHint">风会带动降水、扬尘和植被；沙尘暴、暴风雪会增强风场并降低能见度。</p>
              </section>
            </div>
            <div v-show="worldTab === 'lighting'" class="worldTabContent" role="region" aria-label="光照设置">
              <section class="editSection weatherSection lightingSection" @pointerdown.capture="beginWeatherEdit" @keydown.capture="beginWeatherEdit">
                <div class="sectionHeading"><h3>光照</h3><button type="button" :disabled="locked || !weather.lighting" title="恢复当前时段的默认光照" @click="updateWeather({ lighting: undefined })">重置</button></div>
                <div class="moodPresets" role="group" aria-label="光线氛围"><button v-for="mood in moodPresets" :key="mood.name" type="button" :disabled="locked" :title="translate(mood.title)" @click="applyMood(mood)">{{ translate(mood.name) }}</button></div>
                <div class="lightingGroup">
                  <h4>主光</h4>
                  <label v-for="field in sunlightFields" :key="field.key" class="terrainRange"><span>{{ translate(field.name) }}<output>{{ field.unit === '°' ? Math.round(weatherLighting[field.key] * 10) / 10 : round(weatherLighting[field.key]) }}<small>{{ field.unit }}</small></output></span><el-slider :modelValue="weatherLighting[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="locked" :showTooltip="false" :aria-label="translate(field.name)" @update:modelValue="value => previewLighting({ [field.key]: Number(value) })" @change="commitWeatherDraft" /></label>
                  <label class="lightingColor"><span>主光颜色</span><output>{{ weatherLighting.sunColor }}</output><input type="color" :value="weatherLighting.sunColor" :disabled="locked" aria-label="主光颜色" @focus="beginWeatherEdit" @input="previewLighting({ sunColor: ($event.target as HTMLInputElement).value })" @change="commitWeatherDraft" /></label>
                  <p class="lightingHint">光源来向：0° 东，90° 南，180° 西，270° 北。</p>
              </div>
              <div class="lightingGroup">
                <h4>环境</h4>
                <label v-for="field in environmentLightFields" :key="field.key" class="terrainRange"><span>{{ translate(field.name) }}<output>{{ round(weatherLighting[field.key]) }}</output></span><el-slider :modelValue="weatherLighting[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="locked" :showTooltip="false" :aria-label="translate(field.name)" @update:modelValue="value => previewLighting({ [field.key]: Number(value) })" @change="commitWeatherDraft" /></label>
                <label class="lightingColor"><span>补光颜色</span><output>{{ weatherLighting.ambientColor }}</output><input type="color" :value="weatherLighting.ambientColor" :disabled="locked" aria-label="补光颜色" @focus="beginWeatherEdit" @input="previewLighting({ ambientColor: ($event.target as HTMLInputElement).value })" @change="commitWeatherDraft" /></label>
              </div>
              <div class="lightingGroup">
                <h4>成像与天气</h4>
                <label v-for="field in lightingResponseFields" :key="field.key" class="terrainRange"><span>{{ translate(field.name) }}<output>{{ field.key === 'weatherInfluence' ? Math.round(weatherLighting[field.key] * 100) : round(weatherLighting[field.key]) }}<small>{{ field.unit }}</small></output></span><el-slider :modelValue="weatherLighting[field.key]" :min="field.min" :max="field.max" :step="field.step" :disabled="locked" :showTooltip="false" :aria-label="translate(field.name)" @update:modelValue="value => previewLighting({ [field.key]: Number(value) })" @change="commitWeatherDraft" /></label>
                <p class="lightingHint">云雨、雪与雾会影响最终亮度和色调。联动为 0% 时保持手动光照，未调整的光照项跟随时段。</p>
              </div>
            </section>
            </div>
          </template>
          <template v-else>
            <section class="editSection sceneObjects"><div v-for="object in modelValue.objects" :key="object.id" class="sceneObjectRow" :class="{ selected: subjectId === object.id }"><button type="button" :disabled="locked" @click="selectObject(object.id)"><icon-package :size="16" /><span>{{ object.name }}</span><icon-chevron-right :size="14" /></button><button type="button" :disabled="locked" :aria-label="`${object.visible ? '隐藏' : '显示'}${object.name}`" @click="updateObject(object.id, { visible: !object.visible })"><component :is="object.visible ? IconEye : IconEyeOff" :size="16" /></button></div></section>
          </template>
        </div>
      </aside>
    </transition>

    <transition v-bind="panelTransition">
      <aside v-show="assetsOpen" class="assetPanel floatingPanel">
        <button type="button" class="closeAssets" aria-label="收起素材库" @click="assetsOpen = false"><icon-x :size="16" /></button>
        <div v-if="replaceTargets.length" class="replaceBanner" role="status"><icon-replace :size="14" /><span>点一件素材，替换所选 {{ replaceTargets.length }} 件</span><button type="button" aria-label="取消替换" title="取消替换" @click="replaceTargets = []"><icon-x :size="13" /></button></div>
        <assetShelf :localAssets="sceneAssets" :loadModel="loadModel" :disabled="locked" @assetsLoaded="availableAssets = $event" @addSet="id => { const template = setTemplates.find(item => item.id === id); if (template) applySetTemplate(template); }" @add="asset => replaceTargets.length ? replaceWithAsset(asset) : addAsset(asset)" @import="importFile" @assetDragStart="startAssetPlacement" @assetDragMove="moveAssetPlacement" @assetDrop="dropAsset" @assetDragCancel="cancelAssetPlacement" />
      </aside>
    </transition>

    <transition v-bind="panelTransition">
      <form v-show="!filmPreview" ref="chatBox" class="quickCreation" :class="{ draggingFiles }" @submit.prevent="submitPrompt()" @paste="pastePromptFiles" @dragenter="dragPromptFiles" @dragover="dragPromptFiles" @dragleave="leavePromptFiles" @drop="dropPromptFiles">
        <div v-if="draggingFiles" class="fileDropHint" role="status"><icon-paperclip :size="18" /><span>松开添加附件</span><small>图片或文本文档</small></div>
        <transition v-bind="panelTransition">
          <section v-if="chatOpen && (messages.length || aiController || historySessions.length)" class="assistantConversation" aria-label="Agent 对话">
            <agentMenu :name="activeSessionName" :history="historyItems" :sessionId="activeSession.id" :busy="sessionBusy" @newChat="newSession" @select="selectSession" @rename="renameSession" @remove="removeSession" @close="chatOpen = false" />
            <agentConversation v-if="messages.length" :messages="messages" :previewing="!!aiPreviewDocument" :summary="activeSession.summary" :summaryThrough="activeSession.summaryThrough" :locked="sessionBusy || locked" :editingId="editingMessageId" @edit="editMessage" @branch="branchFromMessage" @remove="removeMessage" @cancelEdit="cancelEditMessage" />
            <div v-if="compacting && !aiController" class="compactionStatus" role="status"><el-icon class="is-loading" aria-hidden="true"><icon-loader-2 :size="14" /></el-icon><span>正在压缩上下文…</span><button type="button" aria-label="停止压缩" title="停止压缩" @click="compactionController?.abort()"><icon-x :size="12" /></button></div>
          </section>
        </transition>
        <div v-if="!modelValue.objects.length && !isPerformanceConversation && !aiController" class="setTemplates" role="group" aria-label="一键布景"><el-popover v-if="!upstreamPrevis" trigger="click" placement="top-start" :width="320" popperClass="pasteScriptPopover"><template #reference><button type="button" class="scriptPaste" :disabled="locked" title="粘贴一场戏的剧本（“角色：台词”），按地点搭景、按角色站位、按对白分镜"><icon-movie :size="13" /><span>粘贴剧本</span></button></template><div class="pasteScript" @keydown.stop><textarea v-model="pastedScript" rows="7" maxlength="6000" aria-label="剧本" placeholder="第7场 客栈大堂 夜 内&#10;店小二：客官，小店打烊了。&#10;林冲（冷笑）：给我一壶酒。&#10;（店小二转身离去）" /><button type="button" :disabled="locked || !pastedScript.trim()" @click="previsFromScript(pastedScript)">一键预演</button></div></el-popover><button v-if="upstreamPrevis" type="button" class="scriptPrevis" :disabled="locked" :title="upstreamPrevis" @click="previsFromUpstream"><icon-movie :size="13" /><span>按剧本一键预演</span></button><span class="setGenres"><button v-for="genre in setTemplateGenres" :key="genre" type="button" :class="{ active: setGenre === genre }" :aria-pressed="setGenre === genre" :title="setGenre === genre ? '显示全部布景' : `只看${translate(genre)}布景`" @click="setGenre = setGenre === genre ? '' : genre"><component :is="setTemplateIcons[genre]" :size="12" /><span>{{ translate(genre) }}</span></button></span><button v-for="template in visibleSetTemplates" :key="template.id" type="button" :disabled="locked" :title="`一键搭好${translate(template.name)}（${translate(template.genre)}），每件都可再改`" @click="applySetTemplate(template)"><component :is="setTemplateIcons[template.genre]" :size="13" /><span>{{ translate(template.name) }}</span></button></div>
        <div v-if="isPerformanceConversation" class="promptAnchorRow"><span class="promptAnchorChip"><icon-heartbeat :size="14" /><span>演绎 · {{ performanceContextLabel }}</span><button type="button" :disabled="locked" aria-label="退出演绎对话" title="返回场景对话" @click="clearPerformanceConversation"><icon-x :size="13" /></button></span></div>
        <div v-if="sceneAnchor" class="promptAnchorRow"><span class="promptAnchorChip" :title="sceneAnchorTitle"><component :is="sceneAnchor.kind === 'object' ? IconPackage : IconFocusCentered" :size="14" /><span>{{ sceneAnchorName }}</span><small v-if="sceneAnchor.kind === 'point'">{{ sceneAnchorCoordinates }}</small><button type="button" aria-label="移除选中锚点" title="移除锚点" @click="clearSceneAnchor"><icon-x :size="13" /></button></span></div>
        <section v-if="promptQueue.length" class="promptQueue" aria-label="排队消息">
          <div v-for="item in promptQueue" :key="item.id" class="queueMessage">
            <component :is="item.steer ? IconCornerDownRight : IconListDetails" class="queueIcon" :size="14" aria-hidden="true" />
            <p class="queueContent" :title="item.text">{{ item.text }}</p>
            <div class="queueActions">
              <span v-if="item.steer" class="queueSteering" title="等 Agent 做完手上这一步就交给它">引导中</span>
              <el-button v-else class="queueSteer" text size="small" :disabled="!aiController" title="发送引导，按这条消息继续当前任务，已完成的操作不会撤销" @click="steerQueued(item.id)"><icon-corner-down-right :size="14" aria-hidden="true" /><span>引导</span></el-button>
              <el-button class="queueIconButton" text circle aria-label="删除排队消息" title="删除" @click="removeQueued(item.id)"><icon-trash :size="14" /></el-button>
              <el-button class="queueIconButton" text circle aria-label="编辑排队消息" title="编辑，暂时移出队列" @click="editQueued(item.id)"><icon-pencil :size="14" /></el-button>
            </div>
          </div>
        </section>
        <div v-if="editingMessageId" class="editingBanner"><span>编辑消息，发送后从这里重新生成</span><el-button text size="small" :disabled="!!aiController" @click="cancelEditMessage">取消</el-button></div>
        <div v-if="promptImages.length" class="promptImages" role="list" aria-label="本轮参考图片"><div v-for="(image, index) in promptImages" :key="image.id" class="promptImage" role="listitem"><img :src="image.dataUrl" :alt="image.name" :title="image.name" /><span>{{ index + 1 }}</span><button type="button" :disabled="locked || imagesReading" :aria-label="`移除图片 ${image.name}`" title="移除图片" @click="promptImages = promptImages.filter(item => item.id !== image.id)"><icon-x :size="12" /></button></div></div>
        <div v-if="promptDocuments.length" class="promptFiles" role="list" aria-label="本轮附件"><span v-for="file in promptDocuments" :key="file.id" class="promptFile" role="listitem" :title="`${file.name}（${formatFileSize(file.size)}）`"><icon-file-text :size="13" /><span>{{ file.name }}</span><button type="button" :disabled="locked" :aria-label="`移除附件 ${file.name}`" title="移除附件" @click="promptDocuments = promptDocuments.filter(item => item.id !== file.id)"><icon-x :size="11" /></button></span></div>
        <input ref="imagePicker" class="imagePicker" type="file" :accept="promptFileAccept" multiple tabindex="-1" aria-label="选择附件" @change="selectPromptImages" />
        <div class="quickCreationInput">
          <button type="button" :class="{ active: chatOpen && (messages.length || historySessions.length) }" :disabled="!messages.length && !historySessions.length" :aria-expanded="chatOpen && !!(messages.length || historySessions.length)" aria-label="Agent 对话" title="查看 Agent 对话" @click="toggleChat"><icon-sparkles :size="18" stroke="1.5" /></button>
          <textarea ref="promptInput" v-model="prompt" rows="1" :disabled="locked || voiceActive" aria-label="描述场景或修改要求" :placeholder="composerPlaceholder" maxlength="12000" @keydown="promptKeydown" @input="updatePromptMenu" @click="updatePromptMenu" @keyup="promptKeyup" @blur="promptMenuDismissed = true" @focus="promptMenuDismissed = false" />
          <agentPromptMenu ref="promptMenu" :open="promptMenuState.open" :kind="promptMenuState.kind" :items="promptMenuState.items" :loading="promptMenuState.kind === 'skill' && skillsLoading" @select="selectPromptMenuItem" @dismiss="promptMenuDismissed = true" />
        </div>
        <div class="promptToolbar">
          <div class="promptSettings">
            <agentModelPicker ref="modelPicker" v-model="modelKey" v-model:thinking="thinkingLevel" :models="aiModels ?? []" :loading="modelsLoading" :disabled="locked || voiceActive || !!aiController" @open="!aiModels?.length && !modelsLoading && emit('loadModels')" />
          </div>
          <div class="promptActions">
          <button type="button" :disabled="locked || imagesReading || !!aiController || promptImages.length >= 4 && promptDocuments.length >= 10" aria-label="添加附件" :title="aiController ? '生成期间仅支持发送文字' : '添加图片或文本文档，也可直接粘贴、拖进来；图片最多 4 张（单张 10 MB），文档最多 10 个（单个 400 KB）'" @click="imagePicker?.click()"><icon-paperclip :size="17" /></button>
          <button v-if="!aiController" type="button" :class="{ active: voiceActive }" :disabled="locked || !voiceSupported || voiceState === 'stopping'" :aria-label="voiceActive ? '停止语音输入' : '语音输入'" :aria-pressed="voiceActive" :title="!voiceSupported ? '当前浏览器未提供语音识别，请使用文字输入' : voiceActive ? '停止语音输入' : '语音输入'" @click="toggleVoiceInput"><component :is="voiceActive ? IconPlayerStop : IconMicrophone" :size="17" /></button>
          <agentContextUsage v-if="generateAi" :tokens="contextTokens" :budget="contextBudgetTokens" :canCompact="canCompact" :compacting="compacting && !aiController" :disabled="sessionBusy || locked" @compact="compactNow" />
          <button v-if="aiController" type="button" class="stopPrompt" aria-label="停止生成" title="停止生成" @click="stopAi"><icon-player-stop-filled :size="14" /></button>
          <button type="submit" class="sendPrompt" :disabled="sendDisabled" :aria-label="aiController ? '排队发送' : editingMessageId ? '重发消息' : '发送给 Agent'" :title="sendTitle"><icon-arrow-up :size="17" /></button>
          </div>
        </div>
        <p v-if="!modelsLoading && !aiModels?.length" class="modelHint">{{ generateAi ? '请先在 Toonflow 设置中配置文本模型。' : '独立预览不连接 AI，请在 Toonflow 节点中使用。' }}</p>
        <p v-if="voiceActive" class="voiceStatus" role="status">{{ voiceState === 'stopping' ? '正在完成识别…' : '正在听，点击停止后发送' }}</p>
        <p v-if="imagesReading" class="imageStatus" role="status">正在读取图片…</p>
      </form>
    </transition>

    <transition v-bind="panelTransition">
      <performanceTimeline v-if="timelineVisible" :folders="modelValue.timeline?.folders ?? []" :snapping="timelineSnapping" @update:folders="updateTimelineFolders" @update:snapping="setTimelineSnapping" :cameras="studioCameras" :selectedCameraId="selectedCameraId" :selectedShotId="selectedShotId" :clock="timelineClock" @addCamera="addCamera" @autoCoverage="(script, pace) => coverScript(script, pace)" @fixLineTiming="fixLineTiming" :canExportFrames="!!exportCanvas" :exportHint="exportHint" :upstreamScript="upstreamText ?? ''" @selectCamera="selectCamera" @createShot="createCameraShot" @changeShot="changeCameraShot" @removeShot="removeCameraShot" @removeCamera="removeCamera" @pickProgram="pickProgramCamera" @splitShot="splitCameraShotAt" @splitClip="splitPerformanceClipAt" @moveItems="moveTimelineItems" :selectedShotKey="selectedShotKey?.keyId ?? ''" @addShotKey="addShotKey" @selectShotKey="selectShotKey" @moveShotKey="moveShotKey" @removeShotKey="removeShotKey" @removeItems="removeTimelineItems" @renameCamera="renameCamera" @toggleCamera="toggleCameraEnabled" @duplicateItems="duplicateTimelineItems" :height="timelineHeight" @update:height="setTimelineHeight" v-model:collapsed="timelineCollapsed" class="timelinePanel floatingPanel" :tracks="timelineTracks" :objects="aiPreviewDocument?.objects ?? modelValue.objects" :groups="aiPreviewDocument?.objectGroups ?? modelValue.objectGroups" :worldSeconds="timelineWorldSeconds" :starts="timelineStarts" :range="lifeStatus.playbackRange" :selectedTrackId="selectedTrackId" :selectedPoint="selectedPerformancePoint" :selectedClipId="selectedPerformanceClipId" :disabled="locked || !!performanceDraft" :running="timelineRunning" :completed="timelineCompleted" @change="changeTimelineTrack" @selectClip="selectPerformanceClip" @removeClip="removePerformanceClip" @remove="removePerformanceTrack" @select="selectPerformance" @togglePlayback="toggleTimelinePlayback" @seek="seekTimeline" />
    </transition>
    <transition v-bind="panelTransition">
      <div v-if="stageError" class="stageProblem floatingPanel" role="alert">{{ stageError }}</div>
    </transition>
    <transition v-bind="panelTransition">
      <div v-if="dragOver" class="dropDirection">{{ assetDragMessage }}</div>
    </transition>
</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { ElButton, ElCheckbox, ElIcon, ElPopover, ElProgress, ElSlider, ElSwitch } from "element-plus";
import { markMessages, t, translate } from "@toonflow/i18n/vue";
import { IconTableExport, IconCut, IconX, IconSparkles, IconPackage, IconArrowUp, IconArrowBackUp, IconArrowForwardUp, IconPlayerPause, IconCopy, IconTrash, IconLoader2, IconFocusCentered, IconChevronUp, IconChevronDown, IconChevronLeft, IconChevronRight, IconRotate, IconTiltShift, IconArrowsDiagonal, IconArrowBarDown, IconFeather, IconEye, IconEyeOff } from "@tabler/icons-vue";
import { IconMountain, IconRipple, IconSun, IconDiamond, IconSnowflake, IconBrush, IconCloud, IconCloudRain, IconMist, IconWind, IconWorld, IconClock, IconBolt, IconRainbow, IconMeteor } from "@tabler/icons-vue";
import { IconPaperclip, IconPencil, IconCornerDownRight, IconListDetails, IconPlayerStopFilled } from "@tabler/icons-vue";
import { IconMicrophone, IconPlayerStop, IconCheck, IconHeartbeat, IconRoute, IconMinimize, IconTarget, IconBuildingPavilion, IconBuildingSkyscraper, IconBuildingArch, IconWand, IconUserStar, IconReplace, IconMovie } from "@tabler/icons-vue";
import { applySceneCoverage, extractSpeakers, findAxisCrossings, getRouteAxes, routeAxis, splitScenes, withStageMoves, withTalkClips } from "./shotCoverage";
import { stagePoseAt } from "./stageShots";
import { IconPhoto, IconLayoutGrid, IconMap, IconFileText, IconVideo } from "@tabler/icons-vue";
import { createYielder, createZip, defaultExportPicks, encodeCanvas, exportEta, exportItemInfo, exportItemKeys, yieldToBrowser, type CanvasExportBundle, type ExportItem, type ExportPicks, type ExportProgress } from "./exportBundle";
import { captureFourViews, captureOverview, countVideoFrames, previsFps, renderProgramVideos, type ProgramPlan } from "./exportRender";
import { castInFrame, createEdl, createFloorPlanSvg, createShotListHtml, describeShotPrompt, describeShotSize, lineOverrun, type InventoryRow, type PlanCamera, type PlanItem, type PlanRoute, type ShotListRow } from "./shotList";
import { getAssetItemType } from "./assetMetadata";
import { builtinAssets } from "./assetLibrary";
import { getAssetSearchText, isCatalogDerivative, matchesSearchToken } from "./assetCatalog";
import { summarizeScene, type StudioEventFile, type StudioEventInput, type StudioEventName } from "./editorEvents";
import { createOccupancy, faceRotation, measureAssetFootprint, rectFor, rectsOverlap, replaceObjectsAsset } from "./setDressing";
import { buildSetTemplate, findSetTemplateSpot, getWorldHalf, matchSetTemplate, setTemplates, type SetTemplate } from "./setTemplates";
import { createBrowserAsr, isBrowserAsrSupported, type BrowserAsrState, type NodeAiModel } from "@toonflow/nodes-scaffold/runtime";
import { answerAgentQuestion, type AgentSteering, type CreationImage, type CreationProgress, type ThinkingLevel } from "./singleAgent";
import agentModelPicker from "./agentConversation/agentModelPicker.vue";
import agentPromptMenu, { type PromptMenuItem } from "./agentConversation/agentPromptMenu.vue";
import { parseSkillCommand, type HostSkill } from "./agentHost";
import { createReplyStream, type AgentMessage, type AgentTextPart, type AgentToolPart } from "./agentConversation";
import { validatePromptImages } from "./promptImages";
import agentConversation from "./agentConversation.vue";
import agentMenu from "./agentConversation/agentMenu.vue";
import agentContextUsage from "./agentConversation/agentContextUsage.vue";
import { agentSessionName, applyCompaction, autoCompactableMessages, compactableMessages, compactionPrompt, compactionSystemPrompt, contextBudgetTokens, createAgentSession, maxSessions, restoreAgentSessions, sessionContextTokens, sessionHistory, storeAgentSessions, trimSession, type AgentSession, type StoredAgentSessions } from "./agentSessions";
import assetShelf from "./assetShelf.vue";
import sceneBrushPanel from "./sceneBrushPanel.vue";
import sceneAssetsPanel from "./sceneAssetsPanel.vue";
import performancePointEditor from "./performancePointEditor.vue";
import cameraViewfinder, { type ViewfinderDelta } from "./cameraViewfinder.vue";
import cameraAnchorEditor from "./cameraAnchorEditor.vue";
import cameraKeyEditor from "./cameraKeyEditor.vue";
import { cameraTrackSchema, splitCameraShot, type CameraShot, getShotKeyValues, toFraming, type ShotKeyValues, type CameraTake, type CameraTracking, getTopShotFront, toPathAnchors, trackingDefaults, type PathPoint, createSceneCamera, flyCamera, getCameraBasis, getCameraFocalLength, getCameraFov, getCameraGap, getCameraShot, getCameraShotAt, getPathLength, getProgramCamera, getProgramSegments, numberProgramSegments, filmAspect, getFilmFrameHeight, getFilmSize, setFilmFormat, filmFormats, filmFormatNames, type FilmFormat, insertCameraShot, applyTakeMove, applyTakeSize, applyTakeAngle, cameraAngleKinds, describeCameraAngle, cameraMoveKinds, shotSizeKinds, lookCamera, minFilmSeconds, minShotSeconds, moveCamera, reframeCameraTake, removeCameraShot as withoutCameraShot, rollCamera, sampleSceneCamera, setCameraTakePath, updateCameraTake, zoomCamera, type CameraFraming, type SceneCamera } from "./cameraDocument";
import type { TimelineFolder } from "./sceneDocument";
import { agentTouchedObjectIds, mergeSceneEdits } from "./sceneMerge";
import performanceTimeline, { type TimelineItem } from "./performanceTimeline.vue";
import { getPerformanceDefaultSpeed, getPerformanceEventDuration, getPerformanceObjectIds, getPerformancePointArrival, getPerformanceSegmentLength, getPerformanceSegmentDuration, getPerformanceTracks, insertPerformancePoint, mergePerformanceTracks, type PerformancePoint, type PerformanceTrack } from "./performanceDocument";
import { disableDependentPerformanceClips, findClipRoutePoint, getClipRoute, getClipRouteEventText, getClipRouteSpeed, getClipRouteTiming, getPerformanceClips, insertClipRouteSegmentPoint, materializePerformanceTrack, moveClipRoutePoint, removeClipRoutePoint, setClipRouteArrival, setClipRouteDwell, setClipRouteEventText, setClipRouteFollowLine, setClipRouteSpeed, splitPerformanceClip, type PerformanceClip } from "./performanceClips";
import { performanceColor, type PerformanceLabel } from "./performanceOverlay";
import worldTimePanel from "./worldTimePanel.vue";
import { getSceneLife, type LifeStatus, type SceneLife } from "./lifeDocument";
import { treeBrushAssets, type SceneBrushSettings, type SceneBrushStatus } from "./sceneBrushAssets";
import { createSceneViewport, type AssetPlacement, type ObjectAnchor, type ObjectTransform } from "./sceneViewport";
import { createSceneDocument, createSceneObject, defaultAtmosphere, getObjectGravityEnabled, sharesSceneContent, type SceneAsset, type SceneAtmosphere, type SceneDocument, type SceneObject, type EditorTool, type SceneAnchor, type SceneTerrain, type SceneWeather, type SceneLighting, type SceneTime, type Vector3Value } from "./sceneDocument";
import { getWeatherLighting } from "./worldWeather";
import { getSceneTime } from "./worldTime";
import { getWeatherLayers, weatherLayerKeys, type WeatherLayerKey } from "./weatherModel";
import { parseSceneDocument, sceneAtmosphereSchema, sceneTimeSchema, sceneViewSchema } from "./sceneValidation";
import { sameJson, sameSceneContent } from "./sameJson";
import { getTerrainHeight, resizeTerrain, terrainWaterColor, worldSizeLimits, type TerrainBrush } from "./terrainModel";
import { terrainSurfaceOptions } from "./terrainSurfaces";

type PerformanceConversation = { objectId?: string; trackId?: string; clipId?: string };
type SceneHistory = { document: SceneDocument; timeChanged: boolean; lifeTimeChanged: boolean };
type PromptImage = CreationImage & { id: string; bytes: number };
type AiModel = NodeAiModel & { reasoningLevels?: ThinkingLevel[] };
type ObjectNumericField = "x" | "y" | "z" | "height";
type TerrainBrushOption = { id: TerrainBrush; name: string; profile?: string; icon?: typeof IconMountain };
type AiCreationInput = { prompt: string; /** 用户自己这句话（不含界面追加的说明），Agent按它分流。 */ userPrompt?: string; images?: CreationImage[]; modelKey: string; thinkingLevel?: ThinkingLevel; document: SceneDocument; assets: SceneAsset[]; terrainObstacles?: { min: Vector3Value; max: Vector3Value }[]; selectedId?: string; lifeGroupId?: string; performanceClipId?: string; performanceOnly?: boolean; anchor?: SceneAnchor; history?: { role: "user" | "assistant"; content: string; images?: CreationImage[] }[]; historySummary?: string; /** 本轮附的文本文档（剧本、说明、表格）。 */ documents?: { name: string; text: string }[]; /** 用户用 /skill:名字 点名的技能。 */ skill?: string; /** 生成途中的引导：Agent 每做完一步世界工具取一次。 */ takeSteering?: () => AgentSteering[]; signal: AbortSignal; onStatus: (message: string) => void; onProgress: (event: CreationProgress) => void; onPreviewDocument: (document: SceneDocument | null) => void };
const props = defineProps<{
  modelValue: SceneDocument;
  loadModel: (asset: SceneAsset) => Promise<ArrayBuffer>;
  prepareAsset: (asset: SceneAsset, signal: AbortSignal) => Promise<SceneAsset>;
  importModel: (file: File, signal: AbortSignal) => Promise<SceneAsset>;
  saving?: boolean; statusMessage?: string; error?: string;
  aiModels?: AiModel[]; modelsLoading?: boolean;
  canSnapshotRuntime?: () => boolean;
  /**
   * 画布里才有：导出包建成画布节点（每镜一行：分镜图、四视图、白模视频；左边一列微缩图、分镜总览、分镜脚本、预演小样），返回建了几个节点。
   * check 在渲染前先查画布有没有图片、视频节点插件，缺了直接报错，别等整段渲染完。
   */
  exportCanvas?: { check: (needs: { image: boolean; video: boolean }) => void; deliver: (bundle: CanvasExportBundle, signal: AbortSignal, onNode?: () => void) => Promise<number> };
  /** 白模预演独立打开时才有：导出包按 ZIP 里的目录结构存进全局素材库的新文件夹，返回实际文件夹路径。 */
  exportAssets?: (folder: string, files: { path: string; file: Blob }[], signal: AbortSignal) => Promise<string>;
  /** 导出到素材库前让用户选位置、给文件夹命名，返回素材库内路径；取消返回 undefined。 */
  chooseAssetFolder?: (defaultName: string) => Promise<string | undefined>;
  /** 画布上连进来的上游剧本文字。 */
  upstreamText?: string;
  generateAi?: (input: AiCreationInput) => Promise<{ document: SceneDocument; summary: string; changed?: boolean }>;
  saveAi?: () => Promise<boolean>;
  /** 不带工具的纯文本生成，压缩对话上下文时用。 */
  generateText?: (input: { modelKey: string; systemPrompt: string; prompt: string; signal: AbortSignal }) => Promise<string>;
  /** 输入 / 时列出宿主技能（画布里才有）。 */
  listSkills?: (signal: AbortSignal) => Promise<HostSkill[]>;
  /** 对话存取（画布里存在节点素材目录）；load 在还没有存过时返回 null。 */
  conversationStore?: { load: (signal: AbortSignal) => Promise<unknown>; save: (value: StoredAgentSessions) => Promise<void> };
}>();
const emit = defineEmits<{ "update:modelValue": [value: SceneDocument]; save: []; close: []; loadModels: []; }>();
const canvas = ref<HTMLCanvasElement>();
const panelTransition = { enterActiveClass: "panelEnterActive", enterFromClass: "panelEnterFrom", enterToClass: "panelEnterTo", leaveActiveClass: "panelLeaveActive", leaveFromClass: "panelLeaveFrom", leaveToClass: "panelLeaveTo" };
const studioRoot = ref<HTMLElement>();
const atmosphereDraft = shallowRef<SceneAtmosphere>();
const atmosphere = computed(() => atmosphereDraft.value ?? props.modelValue.atmosphere ?? defaultAtmosphere);
let atmosphereEditCanceled = false;
const atmosphereFields = markMessages([{ key: "intensity", name: "强度", min: 0, max: 2, step: 0.01, percent: true }, { key: "start", name: "起始距离", min: 0, max: 2000, step: 1, percent: false }, { key: "distance", name: "衰减距离", min: 10, max: 4000, step: 1, percent: false }, { key: "weatherInfluence", name: "天气联动", min: 0, max: 1, step: 0.01, percent: true }] as const);
const spaceDisplayOptions = markMessages([{ key: "axesVisible", name: "坐标轴", defaultValue: false }, { key: "shadowsEnabled", name: "物体阴影", defaultValue: true }] as const);
const worldTime = shallowRef(getSceneTime(props.modelValue));
const timeDraft = shallowRef<SceneTime>();
let timeEditCanceled = false;
const displayTime = computed(() => timeDraft.value ?? worldTime.value);
const worldTimeLabel = computed(() => {
  const seconds = Math.floor(displayTime.value.hour * 3600) % 86400;
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, "0")).join(":");
});
const editorPanel = ref<"" | "scene" | "object" | "terrain" | "brush" | "view" | "life">("");
const worldTab = ref<"assets" | "space" | "time" | "weather" | "lighting">("assets");
const worldTabs = markMessages([{ id: "assets", name: "资产", icon: IconPackage }, { id: "space", name: "空间", icon: IconWorld }, { id: "time", name: "时间", icon: IconClock }, { id: "weather", name: "天气", icon: IconCloud }, { id: "lighting", name: "光照", icon: IconSun }] as const);
const worldSize = computed(() => props.modelValue.terrain?.size ?? worldSizeLimits.default);
const worldSizeInput = ref(String(worldSize.value));
const worldSizeValid = computed(() => Number.isFinite(Number(worldSizeInput.value)) && Number(worldSizeInput.value) >= worldSizeLimits.min && Number(worldSizeInput.value) <= worldSizeLimits.max);
const brushPanelMode = ref<"terrain" | "brush">("terrain");
const brushPanelOpen = computed(() => editorPanel.value === "terrain" || editorPanel.value === "brush");
const editTool = ref<EditorTool>("select");
const objectDragMode = ref<"plane" | "height">("plane");
const objectDraft = shallowRef<SceneObject>();
const objectInputText = shallowRef<{ id: string; field: ObjectNumericField; value: string }>();
let gravityCommitPending = false;
let gravityCommitVersion = 0;
const objectDragPreview = shallowRef<{ id: string; values: ObjectTransform }>();
type ObjectHandleDrag = { startScale?: Vector3Value; kind: "height" | "rotate" | "tilt" | "scale"; axis?: "x" | "z"; id: string; pointerId: number; startX: number; startY: number; startHeight: number; startRotation: number; startTilt: number; startRoll: number; metersPerPixel: number; direction: number; moved: boolean; element: HTMLElement; style: { left: string; top: string } };
const handleDrag = shallowRef<ObjectHandleDrag>();
const terrainBrush = ref<TerrainBrush>("raise");
const terrainPainting = ref(true);
const terrainSurfaceGroup = ref<"natural" | "built" | "biome" | "scifi">("natural");
const terrainSurfaceGroups = markMessages([{ id: "natural", name: "自然" }, { id: "built", name: "人工" }, { id: "biome", name: "荒漠冰雪" }, { id: "scifi", name: "科幻" }] as const);
const surfaceBrushes = computed(() => terrainSurfaceOptions.flatMap(surface => surface.brush && surface.group === terrainSurfaceGroup.value ? [{ ...surface, brush: surface.brush }] : []));
const selectedTerrainSurface = computed(() => terrainSurfaceOptions.find(surface => surface.brush === terrainBrush.value));
const isTerrainWaterBrush = computed(() => terrainBrush.value === "river" || terrainBrush.value === "lake");
const selectedTerrainPaint = computed(() => selectedTerrainSurface.value ?? (isTerrainWaterBrush.value ? { id: 2, color: terrainWaterColor, group: undefined } : undefined));
const terrainBrushColors = ref<Record<string, string>>(Object.fromEntries(Object.entries(props.modelValue.terrain?.surfaceColors ?? {}).filter(([key]) => key !== "2")));
const terrainColorDraft = ref("");
let terrainColorEditingId: number | undefined;
const terrainPaletteColors = computed(() => isTerrainWaterBrush.value ? [terrainWaterColor, "#248eac", "#49bfa7", "#9bc6b8", "#b69a65", "#e37645", "#b485d6", "#4e647f"] : selectedTerrainSurface.value?.group === "scifi" ? ["#e4edf5", "#8c9dae", "#343c48", "#46d9ed", "#8cafff", "#b58aff", "#ff78b8", "#98f0c0"] : ["#d8cfb2", "#bd7754", "#685044", "#7c9160", "#b8b9b5", "#555a62", "#dce6e9", "#eee8d9"]);
const terrainColor = computed(() => terrainColorDraft.value || (selectedTerrainPaint.value ? terrainBrushColors.value[String(selectedTerrainPaint.value.id)] ?? selectedTerrainPaint.value.color : "#ffffff"));
const terrainRadius = ref(4);
const terrainStrength = ref(1);
const terrainFlow = ref(1);
const terrainHardness = ref(0.35);
const terrainTargetHeight = ref(0);
const sceneBrushPainting = ref(true);
const sceneBrushSelecting = ref(false);
const sceneBrushStatus = shallowRef<SceneBrushStatus>({ ready: false, loading: 0, total: 0 });
const sceneBrushSettings = shallowRef<SceneBrushSettings>({ mode: "assets", assets: [treeBrushAssets[0]!], style: "brick", radius: 4, spacing: 3, size: 1, width: 0.25, height: 1.8 });
// ACT: 素材库和 Agent 对话各开各的：对话开着也能翻素材、拖素材进场景、开编辑面板。
const assetsOpen = ref(false);
const chatOpen = ref(false);
const subjectId = ref("");
const selectedObjectIds = ref<string[]>([]);
const selectedTerrainTree = ref<number | null>(null);
const sceneAnchor = shallowRef<SceneAnchor | null>(null);
const objectAnchor = shallowRef<ObjectAnchor | null>(null);
const nameEditing = ref(false);
const nameDraft = ref("");
const nameInput = ref<HTMLInputElement>();
const availableAssets = shallowRef<SceneAsset[]>([]);
const sceneAssets = computed(() => props.modelValue.objects.map(object => object.asset));
const brushAvailableAssets = computed(() => [...availableAssets.value, ...sceneAssets.value]);
const busy = ref("");
const notice = ref("");
const stageError = ref("");
const lifeStatus = shallowRef<LifeStatus>({ pedestrians: 0, vehicles: 0, roads: 0, animals: 0, message: "" });
const selectedTrackId = ref("");
// ACT: 机位的编辑对象是“镜头段”：在时间轴上框出一段时间，在场景里按住机位脚下的圈划出机位轨迹，在取景窗里调画面；选中机位后取景窗一直显示它。
const selectedCameraId = ref("");
const selectedShotId = ref("");
const filmPreview = ref(false);
// 取景窗手势：start是开始时的画面，framing是手上调到的画面；committed表示已提交、等新文档同步回来再清掉，避免闪回旧画面。
const cameraGesture = shallowRef<{ id: string; shotId: string; start: CameraFraming; framing: CameraFraming; committed?: boolean }>();
let viewfinderCanvas: HTMLCanvasElement | null = null;
let monitorCanvas: HTMLCanvasElement | null = null;
let cameraPoseId = "";
let appliedCameraPose: CameraFraming | null = null;
const studioCameras = computed(() => aiPreviewDocument.value?.cameras ?? props.modelValue.cameras ?? []);
const cameraLocked = computed(() => locked.value || !!performanceDraft.value);
const filmRange = computed(() => lifeStatus.value.playbackRange);
const filmDuration = computed(() => { const range = filmRange.value; return range ? Math.max(0.2, range.end - range.start) : minFilmSeconds; });
const filmTime = computed(() => { const range = filmRange.value; return range ? Math.max(0, timelineWorldSeconds.value - range.start) : 0; });
const selectedCamera = computed(() => studioCameras.value.find(camera => camera.id === selectedCameraId.value));
// 取景窗显示选中的机位，没有选中时显示播放头所在时刻的成片机位。
const programCamera = computed(() => getProgramCamera(studioCameras.value, filmTime.value));
// ACT: 成片画幅（监看窗标题栏的小标签切换）：横屏16:9、宽银幕、竖屏短剧9:16；存进场景，取景窗、视锥、截图、镜头表、预演小样都跟着走。
const filmFormat = computed<FilmFormat>(() => props.modelValue.film?.format ?? "16:9");
const filmAspectValue = computed(() => filmFormats[filmFormat.value]);
const filmFormatItems = (Object.keys(filmFormats) as FilmFormat[]).map(key => ({ key, name: filmFormatNames[key], aspect: filmFormats[key] }));
function setFilmFormatChoice(key: string) {
  if (locked.value || !(key in filmFormats) || key === filmFormat.value) return;
  const format = key as FilmFormat;
  setFilmFormat(format);
  commit({ ...props.modelValue, film: { ...props.modelValue.film, format } });
  notice.value = t`成片画幅改为${translate(filmFormatNames[format])}`;
}
// ACT: 成片监看和全屏预演标出此刻是第几镜、是否越轴（和时间轴成片行、镜头表同一套编号与越轴判断）。
const programCuts = computed(() => {
  const cameras = studioCameras.value.filter(camera => camera.enabled !== false);
  if (!cameras.some(camera => camera.shots?.length)) return [];
  const segments = getProgramSegments(cameras, filmDuration.value);
  const numbers = numberProgramSegments(cameras, segments);
  const crossings = new Set(findAxisCrossings(props.modelValue.objects, cameras, segments.map((segment, index) => ({ ...segment, number: numbers[index]! })), getRouteAxes(props.modelValue), (id, time) => stagePoseAt(props.modelValue, id, time)?.at));
  return segments.map((segment, index) => ({ ...segment, number: numbers[index]!, crossesAxis: crossings.has(numbers[index]!) }));
});
const programCut = computed(() => programCuts.value.find(cut => filmTime.value >= cut.start && filmTime.value < cut.end));
const programLabel = computed(() => programCamera.value ? `${programCut.value ? `第${programCut.value.number}镜 · ` : ""}${programCamera.value.name.replace(/^分镜·/, "")}${programCut.value?.crossesAxis ? " ⚠越轴" : ""}` : "黑场");
const monitorCamera = computed(() => selectedCamera.value ?? programCamera.value);
// 取景窗正在调的那段镜头：选中的镜头段，否则播放头所在的镜头段；都没有就是机位自身的画面（shotId为空）。
const editShotId = computed(() => {
  const camera = monitorCamera.value;
  if (!camera) return "";
  if (camera.id === selectedCameraId.value && getCameraShot(camera, selectedShotId.value)) return selectedShotId.value;
  return getCameraShotAt(camera, filmTime.value)?.id ?? "";
});
const editTake = computed(() => { const camera = monitorCamera.value; return camera && (getCameraShot(camera, editShotId.value) ?? undefined); });
const monitorFraming = computed(() => {
  const camera = monitorCamera.value;
  if (!camera) return undefined;
  if (cameraGesture.value?.id === camera.id) return cameraGesture.value.framing;
  return sampleSceneCamera(camera, filmTime.value);
});
// 成片这一刻镜头段的备注（台词、画面说明），监看和全屏预演显示成字幕。
const programCaption = computed(() => programCamera.value ? getCameraShotAt(programCamera.value, filmTime.value)?.note ?? "" : "");
// ACT: 朗读台词（监看窗标题栏的喇叭，默认关）：播放到带台词的镜头时用浏览器语音合成念出来（去掉“角色：”），听对白节奏；括号动作说明不念。停下或关掉就停。
// 右上角导出面板（替换原来的保存按钮；保存用 Ctrl+S，关闭时自动保存）。
const exportMenuOpen = ref(false);
const videoEdge = ref((() => { try { return localStorage.getItem("trumanMap.videoEdge") === "1920" ? 1920 : 1280; } catch { return 1280; } })());
function setVideoEdge(value: number) { videoEdge.value = value; try { localStorage.setItem("trumanMap.videoEdge", String(value)); } catch { /* 存不下就只在本次生效 */ } }
// ACT: 导出面板：勾选要导出的内容（每镜三样、整场五样），勾选和清晰度记在本机，下次打开还是这几项。
const exportGroups: { name: string; perShot: boolean; keys: ExportItem[] }[] = markMessages([{ name: "每镜", perShot: true, keys: ["frames", "views", "clips"] }, { name: "整场", perShot: false, keys: ["overview", "script", "previs", "shotList", "edl"] }]);
const exportIcons = { frames: IconPhoto, views: IconLayoutGrid, clips: IconMovie, overview: IconMap, script: IconFileText, previs: IconVideo, shotList: IconTableExport, edl: IconCut } satisfies Record<ExportItem, unknown>;
const exportPicks = ref<ExportPicks>((() => {
  try {
    const saved = JSON.parse(localStorage.getItem("trumanMap.exportPicks") ?? "null") as Partial<ExportPicks> | null;
    if (saved && typeof saved === "object") return Object.fromEntries(exportItemKeys.map(key => [key, typeof saved[key] === "boolean" ? saved[key] : defaultExportPicks[key]])) as ExportPicks;
  } catch { /* 读不到用默认 */ }
  return { ...defaultExportPicks };
})());
function setExportPick(key: ExportItem, value: boolean) { exportPicks.value = { ...exportPicks.value, [key]: value }; try { localStorage.setItem("trumanMap.exportPicks", JSON.stringify(exportPicks.value)); } catch { /* 存不下就只在本次生效 */ } }
const exportPickCount = computed(() => exportItemKeys.filter(key => exportPicks.value[key]).length);
const exportShotCount = computed(() => Math.min(120, new Set(programCuts.value.map(cut => cut.number)).size));
// 导出面板的主按钮：画布里建节点，白模预演里存素材库，独立预览只能下载。
const exportTarget = computed(() => props.exportCanvas ? "canvas" : props.exportAssets ? "assets" : "files");
function startExport(destination: ExportDestination) { exportMenuOpen.value = false; void runExport(exportItemKeys.filter(key => exportPicks.value[key]), destination, videoEdge.value); }
const programFraming = computed(() => programCamera.value && sampleSceneCamera(programCamera.value, filmTime.value));
const viewfinderFocalLength = computed(() => monitorFraming.value?.focalLength ?? 35);
const monitorRangeLabel = computed(() => { const shot = editTake.value; return shot ? `${shot.start.toFixed(1)}–${shot.end.toFixed(1)}s` : ""; });
const viewfinderVisible = computed(() => editorPanel.value === "life" && studioCameras.value.length > 0 && !filmPreview.value);
// 取景窗显示、修改的跟踪：正在编辑的镜头段自己的，没有就是机位的（同一台机位不同镜头段可以盯不同东西）。
const activeTrack = computed(() => editTake.value?.track ?? monitorCamera.value?.track);
const trackName = computed(() => {
  const track = activeTrack.value;
  if (!track) return "";
  return track.objectId ? props.modelValue.objects.find(object => object.id === track.objectId)?.name ?? translate("物体") : translate("定点");
});
const trackPicking = ref(false);
const objectCarrying = ref(false);
const cameraPathDrawing = ref(false);
function readSnapping() { try { return localStorage.getItem("trumanMap.timelineSnap") !== "off"; } catch { return true; } }
const timelineSnapping = ref(readSnapping());
function setTimelineSnapping(value: boolean) { timelineSnapping.value = value; try { localStorage.setItem("trumanMap.timelineSnap", value ? "on" : "off"); } catch { /* 存不下时只在本次生效 */ } }
function cameraColor(id: string) { return performanceColor("camera:" + id); }
const filmClockLabel = computed(() => { const value = Math.max(0, filmTime.value); return `${Math.floor(value / 60)}:${(value % 60).toFixed(1).padStart(4, "0")}`; });
function timelineClock() { return viewport?.getWorldSeconds() ?? timelineWorldSeconds.value; }
/** 此刻精确的成片时间。 */
function currentFilmTime() {
  const range = viewport?.getFilmRange() ?? filmRange.value;
  return range ? Math.max(0, (viewport?.getWorldSeconds() ?? timelineWorldSeconds.value) - range.start) : 0;
}
const selectedPerformancePoint = ref<number>();
const selectedPerformanceClipId = ref("");
const performanceDraft = shallowRef<PerformanceTrack | null>(null);
const timelineCollapsed = ref(false);
function readTimelineHeight() { try { const value = Number(localStorage.getItem("trumanMap.timelineHeight")); return Number.isFinite(value) && value >= 120 ? value : 214; } catch { return 214; } }
const timelineHeight = ref(readTimelineHeight());
function setTimelineHeight(value: number) {
  timelineHeight.value = Math.round(Math.min(Math.max(value, 120), Math.max(160, window.innerHeight * 0.8)));
  try { localStorage.setItem("trumanMap.timelineHeight", String(timelineHeight.value)); } catch { /* 存不下时只在本次生效 */ }
}
const timelineSeeking = ref(false);
const timelineTracks = computed(() => getPerformanceTracks(aiPreviewDocument.value?.life ?? props.modelValue.life, aiPreviewDocument.value?.objects ?? props.modelValue.objects, aiPreviewDocument.value?.objectGroups ?? props.modelValue.objectGroups));
const timelineVisible = computed(() => editorPanel.value === "life");
const timelineWorldSeconds = computed(() => Date.parse(displayTime.value.date + "T00:00:00Z") / 1000 + displayTime.value.hour * 3600);
const timelineStarts = computed(() => Object.fromEntries((lifeStatus.value.groups ?? []).flatMap(group => group.startTime === undefined ? [] : [[group.id, group.startTime]])));
const timelineCompleted = computed(() => {
  const active = lifeStatus.value.groups?.filter(group => group.requested > 0) ?? [];
  const filming = studioCameras.value.some(camera => camera.enabled !== false);
  const range = filmRange.value;
  return active.length + Number(filming) > 0 && active.every(group => group.completed) && (!filming || !!range && timelineWorldSeconds.value >= range.end - 0.05);
});
const timelineRunning = computed(() => !timelineCompleted.value && !worldTime.value.paused && getSceneLife(props.modelValue.life).enabled && getSceneLife(props.modelValue.life).running);
const performanceLabels = shallowRef<PerformanceLabel[]>([]);
const performancePointAnchor = ref<{ x: number; y: number } | null>(null);
const selectedPointEditor = computed(() => {
  if (editorPanel.value !== "life") return undefined;
  const index = selectedPerformancePoint.value;
  const track = timelineTracks.value.find(item => item.id === selectedTrackId.value);
  if (!track || index === undefined) return undefined;
  const object = (aiPreviewDocument.value?.objects ?? props.modelValue.objects).find(item => item.id === track.objectId);
  if (track.clips) {
    // ACT: Agent或剪辑生成的片段式动线：到达、停靠、速度、高度、沿线、关键事件都从移动/动作片段换算，和手画动线同一张卡。
    if (track.controller === "object") return undefined;
    const timing = getClipRouteTiming(track.clips);
    const point = timing.route.points[index];
    if (!point) return undefined;
    const moves = track.clips.filter(clip => clip.kind === "move" && clip.enabled !== false);
    return {
      key: `${track.id}:${index}:${timing.route.points.length}`,
      track, clipRoute: true,
      name: track.name ?? object?.name ?? "场景物体",
      color: performanceColor(track.id),
      index,
      total: timing.route.points.length,
      arrival: timing.arrivals[index]!,
      dwell: Math.max(0, Math.round((timing.departures[index]! - timing.arrivals[index]!) * 10) / 10),
      speed: getClipRouteSpeed(track.clips, index) ?? getPerformanceDefaultSpeed(track),
      height: Math.round((point[1] - (viewport?.getGroundHeight(point[0], point[2]) ?? 0)) * 10) / 10,
      eventText: getClipRouteEventText(track.clips, index),
      inertia: 0, teleportNext: false, incomingTeleport: false,
      followLine: moves.length > 0 && moves.every(clip => clip.kind === "move" && clip.mode === "path"),
      parkour: track.parkour === true,
    };
  }
  if (!track.points[index]) return undefined;
  const point = track.points[index]!;
  const event = track.events?.find(item => item.at === index);
  return {
    key: `${track.id}:${index}:${track.points.length}`,
    track,
    name: track.name ?? object?.name ?? "场景物体",
    color: performanceColor(track.id),
    index,
    total: track.points.length,
    arrival: getPerformancePointArrival(track, index),
    dwell: event ? getPerformanceEventDuration(event) : 0,
    speed: pointSpeedTo(track, index),
    height: Math.round((point[1] - (viewport?.getGroundHeight(point[0], point[2]) ?? 0)) * 10) / 10,
    eventText: event?.text ?? "",
    inertia: Math.max(0, Math.min(1, track.inertias?.[index] ?? 0)),
    teleportNext: !!track.teleports?.includes(index),
    incomingTeleport: index > 0 && !!track.teleports?.includes(index - 1),
    followLine: track.mode === "path",
    parkour: track.parkour === true,
    clipRoute: false,
  };
});
/** 卡片改片段式动线：用当前片段换算出新的片段列表。 */
function changeClipRoute(change: (clips: PerformanceClip[], index: number) => PerformanceClip[]) {
  const editor = selectedPointEditor.value;
  if (!editor?.clipRoute) return false;
  changePerformance(editor.track.id, current => ({ ...current, clips: change(current.clips ?? [], editor.index) }));
  return true;
}
const selectedPerformanceRoute = computed(() => {
  const id = subjectId.value;
  if (!id) return undefined;
  const groups = props.modelValue.objectGroups;
  const members = new Set(getPerformanceObjectIds(id, groups));
  return timelineTracks.value.find(track => track.controller !== "object" && (members.has(track.objectId) || getPerformanceObjectIds(track.objectId, groups).includes(id)));
});
const pointEditorStyle = computed(() => {
  const anchor = performancePointAnchor.value;
  const width = canvas.value?.clientWidth ?? 960;
  const height = canvas.value?.clientHeight ?? 540;
  if (!anchor) return { left: "12px", top: "50%", visibility: "hidden" as const };
  // 时间轴打开时卡片不钻到时间轴下面：放不下就贴顶，卡片里自己滚动。
  const bottom = height - (timelineVisible.value ? (timelineCollapsed.value ? 68 : timelineHeight.value + 24) : 0) - 8;
  const left = Math.round(Math.min(Math.max(anchor.x + 18, 12), Math.max(12, width - 316)));
  const top = Math.round(Math.min(Math.max(anchor.y - 150, 64), Math.max(64, bottom - 390)));
  return { left: `${left}px`, top: `${top}px`, maxHeight: `${Math.max(160, bottom - top)}px`, overflowY: "auto" as const };
});
function changePointArrival(seconds: number) {
  if (changeClipRoute((clips, index) => setClipRouteArrival(clips, index, seconds))) return;
  const editor = selectedPointEditor.value;
  if (!editor || editor.index === 0 || editor.incomingTeleport) return;
  const { track, index } = editor;
  const previousEvent = track.events?.find(event => event.at === index - 1);
  const previousDwell = previousEvent ? getPerformanceEventDuration(previousEvent) : 0;
  const duration = Math.max(0.1, Math.round((seconds - getPerformancePointArrival(track, index - 1) - previousDwell) * 10) / 10);
  changePerformance(track.id, current => ({
    ...current,
    segmentSeconds: Array.from({ length: Math.max(current.segmentSeconds?.length ?? 0, index) }, (_, cursor) => cursor === index - 1 ? duration : current.segmentSeconds?.[cursor] ?? 0),
  }));
}
function changePointDwell(seconds: number) {
  if (changeClipRoute((clips, index) => setClipRouteDwell(clips, index, Math.max(0, Math.min(300, seconds))))) return;
  const editor = selectedPointEditor.value;
  if (!editor) return;
  const { track, index } = editor;
  const nextSeconds = Math.max(0, Math.min(300, Math.round(seconds * 2) / 2));
  changePerformance(track.id, current => {
    const events = [...(current.events ?? [])];
    const existing = events.findIndex(event => event.at === index);
    if (existing >= 0) {
      const event = events[existing]!;
      const removable = nextSeconds <= 0 && event.text === "停留" && !event.action && !event.target && !event.motion && !event.animation && !event.clipId;
      if (removable) events.splice(existing, 1);
      else events[existing] = { ...event, seconds: nextSeconds };
    } else if (nextSeconds > 0) {
      events.push({ at: index, text: "停留", seconds: nextSeconds });
      events.sort((a, b) => a.at - b.at);
    }
    return { ...current, events };
  });
}
function changePointEventText(text: string) {
  if (changeClipRoute((clips, index) => setClipRouteEventText(clips, index, text))) return;
  const editor = selectedPointEditor.value;
  if (!editor) return;
  const { track, index } = editor;
  changePerformance(track.id, current => {
    const events = [...(current.events ?? [])];
    const existing = events.findIndex(event => event.at === index);
    if (existing >= 0) events[existing] = { ...events[existing]!, text: text || "路径点 " + (index + 1) };
    else if (text) {
      events.push({ at: index, text });
      events.sort((a, b) => a.at - b.at);
    }
    return { ...current, events };
  });
}
function pointSpeedTo(track: PerformanceTrack, index: number) {
  const fallback = getPerformanceDefaultSpeed(track);
  if (index <= 0) return fallback;
  const seconds = track.segmentSeconds?.[index - 1] ?? 0;
  const length = getPerformanceSegmentLength(track, index - 1);
  return seconds > 0 && length > 0.001 ? length / seconds : fallback;
}
/** 整条动线是否严格沿画的线走（贴地、不寻路绕行）。 */
function changeFollowLine(value: boolean) {
  if (changeClipRoute(clips => setClipRouteFollowLine(clips, value))) return;
  const editor = selectedPointEditor.value;
  if (!editor) return;
  changePerformance(editor.track.id, current => { const { mode: _mode, ...rest } = current; return value ? { ...rest, mode: "path" } : rest; });
}
/** 飞檐走壁：整条动线的人能上房、跨越，走不通或绕远就飞身（手画和片段式动线一样记在轨道上）。 */
function changeParkour(value: boolean) {
  const editor = selectedPointEditor.value;
  if (!editor) return;
  changePerformance(editor.track.id, current => { const { parkour: _parkour, ...rest } = current; return value ? { ...rest, parkour: true } : rest; });
}
function changePointSpeed(speed: number) {
  if (changeClipRoute((clips, index) => setClipRouteSpeed(clips, index, speed))) return;
  const editor = selectedPointEditor.value;
  if (!editor || editor.index === 0 || editor.incomingTeleport) return;
  const { track, index } = editor;
  const length = getPerformanceSegmentLength(track, index - 1);
  const duration = Math.max(0.1, Math.round((length > 0.001 ? length / speed : 0.1) * 10) / 10);
  changePerformance(track.id, current => ({
    ...current,
    segmentSeconds: Array.from({ length: Math.max(current.segmentSeconds?.length ?? 0, index) }, (_, cursor) => cursor === index - 1 ? duration : current.segmentSeconds?.[cursor] ?? 0),
  }));
}
function changePointInertia(value: number) {  const editor = selectedPointEditor.value;
  if (!editor) return;
  const { track, index } = editor;
  const inertia = Math.max(0, Math.min(1, Math.round(value * 10) / 10));
  changePerformance(track.id, current => ({
    ...current,
    inertias: Array.from({ length: current.points.length }, (_, cursor) => cursor === index ? inertia : current.inertias?.[cursor] ?? 0),
  }));
}
function changePointTeleport(next: boolean) {
  const editor = selectedPointEditor.value;
  if (!editor) return;
  const { track, index } = editor;
  if (index >= track.points.length - 1) return;
  const values = new Set(track.teleports ?? []);
  if (next) values.add(index);
  else values.delete(index);
  changePerformance(track.id, current => ({ ...current, teleports: [...values].sort((left, right) => left - right) }));
}
function changePointHeight(height: number) {
  const editor = selectedPointEditor.value;
  if (!editor) return;
  if (editor.clipRoute && editor.track.clips) {
    const point = getClipRoute(editor.track.clips).points[editor.index];
    if (!point) return;
    const ground = viewport?.getGroundHeight(point[0], point[2]) ?? 0;
    changeClipRoute((clips, index) => moveClipRoutePoint(clips, index, [point[0], Math.round((ground + height) * 100) / 100, point[2]]));
    return;
  }
  const { track, index } = editor;
  const point = track.points[index]!;
  const ground = viewport?.getGroundHeight(point[0], point[2]) ?? 0;
  changePerformance(track.id, current => ({
    ...current,
    points: current.points.map((item, cursor) => cursor === index ? [item[0], Math.round((ground + height) * 100) / 100, item[2]] : item),
  }));
}
function removeSelectedPoint() {
  const clipTrack = timelineTracks.value.find(item => item.id === selectedTrackId.value && item.clips);
  if (clipTrack?.clips && selectedPerformancePoint.value !== undefined) {
    const index = selectedPerformancePoint.value;
    try { changePerformance(clipTrack.id, current => ({ ...current, clips: removeClipRoutePoint(current.clips ?? [], index) })); }
    catch (error) { fail(error); return; }
    selectedPerformancePoint.value = undefined;
    performancePointAnchor.value = null;
    return;
  }
  const editor = selectedPointEditor.value;
  if (!editor) return;
  const { track, index } = editor;
  if (track.points.length <= 1) return;
  const points = track.points.filter((_, cursor) => cursor !== index);
  const events = track.events?.filter(event => event.at !== index).map(event => ({ ...event, at: event.at > index ? event.at - 1 : event.at }));
  // ACT: 删除节点合并的两段恢复自动速度，其余用时继续绑定原段起点，避免把旧用时套给新段。
  const incoming = (index + track.points.length - 1) % track.points.length;
  const segmentSeconds = track.segmentSeconds && track.points.flatMap((_, cursor) => cursor === index ? [] : [cursor === incoming ? 0 : track.segmentSeconds?.[cursor] ?? 0]);
  const teleports = track.teleports?.flatMap(value => value === index - 1 || value === index ? [] : [value > index ? value - 1 : value]);
  const inertias = track.inertias && track.points.flatMap((_, cursor) => cursor === index ? [] : [track.inertias?.[cursor] ?? 0]);
  changePerformance(track.id, current => ({ ...current, points: current.points.filter((_, cursor) => cursor !== index), events, segmentSeconds, teleports, inertias }));
  selectedPerformancePoint.value = undefined;
  performancePointAnchor.value = null;
}
function closePointEditor() {
  selectedPerformancePoint.value = undefined;
  performancePointAnchor.value = null;
}
function exitPerformanceRoute() {
  if (!performanceDraft.value) return;
  if (performanceDraft.value.points.length >= 2) finishPerformanceRoute();
  else cancelPerformanceRoute();
}
const dragOver = ref(false);
const draggedAsset = shallowRef<SceneAsset>();
const assetPlacementLoading = ref(false);
const assetDragMessage = ref("");
const history = shallowRef<SceneHistory[]>([]);
const redoHistory = shallowRef<SceneHistory[]>([]);
// ACT: 和宿主 Agent 一样分会话：可新建、切换、改名、移除；每个会话各自带压缩后的记忆摘要。
const sessions = ref<AgentSession[]>([createAgentSession()]);
const activeSessionId = ref(sessions.value[0]!.id);
const activeSession = computed(() => sessions.value.find(session => session.id === activeSessionId.value) ?? sessions.value[0]!);
const messages = computed(() => activeSession.value.messages);
const activeSessionName = computed(() => agentSessionName(activeSession.value));
const historySessions = computed(() => sessions.value.filter(session => session.messages.length).sort((a, b) => b.updatedAt - a.updatedAt));
const historyItems = computed(() => historySessions.value.map(session => ({ id: session.id, name: agentSessionName(session) })));
const compacting = ref(false);
const compactionController = shallowRef<AbortController>();
const contextTokens = computed(() => sessionContextTokens(activeSession.value));
const canCompact = computed(() => !!props.generateText && compactableMessages(activeSession.value, 2).length > 0);
const prompt = ref("");
// ACT: 对话框固定在右下角，右侧编辑面板叠在它上方；量出对话框的实际高度，编辑面板据此收短，两者不互相遮挡。
const chatBox = ref<HTMLFormElement>();
const chatHeight = ref(0);
let chatObserver: ResizeObserver | undefined;
const promptInput = ref<HTMLTextAreaElement>();
const imagePicker = ref<HTMLInputElement>();
const promptImages = shallowRef<PromptImage[]>([]);
const imagesReading = ref(false);
const modelPicker = ref<InstanceType<typeof agentModelPicker>>();
// ACT: 和宿主画布 Agent 的输入框对齐：多行输入（Enter 发送、Shift+Enter 换行）、附件（图片 + 文本文档，可粘贴、拖进来）、
// @ 提及场景里的人物物件机位、/ 选技能、生成中 Enter 排队 / Ctrl+Enter 引导、编辑重发。
type PromptDocument = { id: string; name: string; text: string; size: number };
const promptDocuments = shallowRef<PromptDocument[]>([]);
const promptFileAccept = "image/png,image/jpeg,image/webp,image/gif,.txt,.md,.markdown,.json,.csv,.tsv,.srt,.vtt,.ass,.fountain,.fdx,.xml,.yaml,.yml,.html,.htm,.log,text/plain,text/markdown,text/csv,application/json";
const textFilePattern = /\.(?:txt|md|markdown|json|csv|tsv|srt|vtt|ass|fountain|fdx|xml|ya?ml|html?|log)$/i;
const draggingFiles = ref(false);
let fileDragDepth = 0;
type QueuedPrompt = { id: string; text: string; steer: boolean };
const promptQueue = ref<QueuedPrompt[]>([]);
/** 已经交给模型、还没在对话里显示的引导（等 steered 事件把它们放进对话）。 */
const deliveredSteering = new Map<string, string>();
const editingMessageId = ref("");
let editDraft: { prompt: string; images: PromptImage[]; documents: PromptDocument[] } | undefined;
const promptMenu = ref<InstanceType<typeof agentPromptMenu>>();
const promptMenuDismissed = ref(false);
const promptCaret = ref(0);
const hostSkills = shallowRef<HostSkill[]>();
const skillsLoading = ref(false);
/** 本轮（含因引导拆出来的）助手消息：工具结束事件按 id 找回原来那张卡。 */
let turnAssistants: AgentMessage[] = [];
const performanceContext = shallowRef<PerformanceConversation>();
const isPerformanceConversation = computed(() => !!performanceContext.value || editorPanel.value === "life");
const performanceContextLabel = computed(() => {
  const context = performanceContext.value;
  const object = props.modelValue.objects.find(object => object.id === (context?.objectId ?? subjectId.value));
  const track = timelineTracks.value.find(track => track.id === (context?.trackId ?? selectedTrackId.value));
  const clip = object && track && getPerformanceClips(track, object).find(clip => clip.id === (context?.clipId ?? selectedPerformanceClipId.value));
  return [object?.name, clip?.name].filter(Boolean).join(" · ") || translate("场景演绎");
});
const performancePlanningId = ref("");
const modelKey = ref("");
const thinkingLevel = ref<ThinkingLevel | "">("");
const thinkingLabels: Record<ThinkingLevel, string> = { off: "关闭", minimal: "最小", low: "低", medium: "中", high: "高", xhigh: "极高", max: "最高" };
const selectedAiModel = computed(() => props.aiModels?.find(model => JSON.stringify([model.providerId, model.modelId]) === modelKey.value));
const reasoningLevels = computed(() => selectedAiModel.value?.reasoningLevels?.filter(level => Object.hasOwn(thinkingLabels, level)) ?? []);
const voiceSupported = isBrowserAsrSupported();
const voiceState = ref<BrowserAsrState>("idle");
const voiceActive = computed(() => voiceState.value !== "idle");
let voiceAsr: ReturnType<typeof createBrowserAsr> | undefined;
let voicePrefix = "";
let voiceFinalText = "";
const aiController = shallowRef<AbortController>();
const aiPreviewDocument = shallowRef<SceneDocument>();
let activeReplyStream: ReturnType<typeof createReplyStream> | undefined;
let aiProgressFrame = 0;
// Agent 开工时的场景底稿：生成期间用户照常编辑，预览和交付都按它和用户当前场景三方合并（sceneMerge.ts）。
let aiBaseDocument: SceneDocument | undefined;
let aiResultAdopted = false;
/** Agent 结果采用进场景的次数（外部总Agent据此判断这一轮有没有改场景）。 */
let aiAdoptions = 0;
let previewMerge: { ours: SceneDocument; preview: SceneDocument; merged: SceneDocument; touched: Set<string> } | undefined;
function mergedAiPreview(ours: SceneDocument) {
  const preview = aiPreviewDocument.value!;
  if (previewMerge?.ours !== ours || previewMerge.preview !== preview) {
    const base = aiBaseDocument ?? ours;
    previewMerge = { ours, preview, merged: mergeSceneEdits(base, ours, preview), touched: previewMerge?.preview === preview ? previewMerge.touched : agentTouchedObjectIds(base, preview) };
  }
  return previewMerge;
}
const pendingAiProgress = new Map<string, CreationProgress>();
const operationController = new AbortController();
let viewport: ReturnType<typeof createSceneViewport> | undefined;
let disposed = false;
let assetPlacementVersion = 0;
let assetDropVersion = 0;
let sceneBrushVersion = 0;
let assetDragPoint: { x: number; y: number } | undefined;
let assetDragWindow: Window | null = null;
let assetDragFrame: number | undefined;
const axes = ["x", "y", "z"] as const;
const positionAxes = ["x", "y", "z"] as const;
const transformFields = [{ key: "rotation", label: "旋转（°）" }, { key: "scale", label: "缩放" }] as const;
const terrainBrushGroups: { name: string; brushes: TerrainBrushOption[] }[] = markMessages([
  { name: "塑形", brushes: [
    { id: "auto", name: "自动", profile: "M3 18h5c5 0 4-12 9-12s4 12 9 12h7M16 2v4m-5-2 3 3m7-3-3 3" },
    { id: "raise", name: "抬高", profile: "M3 18h5c5 0 5-13 10-13s5 13 10 13h5" },
    { id: "plateau", name: "台地", profile: "M3 18h6l4-12h10l4 12h6" },
    { id: "lower", name: "挖沟", profile: "M3 5h7l5 13h6l5-13h7" },
    { id: "smooth", name: "抹平", profile: "M3 12c5-8 8 6 15 0s9 2 15-3" },
    { id: "level", name: "压平", profile: "M3 17h30M18 3v9m-4-4 4 4 4-4" },
    { id: "flatten", name: "定高", profile: "M3 12h30M7 9v6m6-6v6m6-6v6m6-6v6m6-6v6" },
    { id: "ramp", name: "坡道", profile: "M3 18h6L26 5h7" },
    { id: "slope", name: "陡缓", profile: "M3 18h6c10 0 8-13 15-13h9" },
    { id: "ridge", name: "山脊", profile: "M3 18h6l8-14 4 7 4-3 5 10h3" },
    { id: "terrace", name: "梯级", profile: "M3 18h6v-5h7V8h7V3h10" },
    { id: "cliff", name: "陡崖", profile: "M3 18h13V5h17" },
    { id: "noise", name: "起伏", profile: "m3 16 4-3 4 2 3-9 4 5 4-7 3 9 4-2 4 5" },
  ] },
  { name: "自然地形", brushes: [
    { id: "hills", name: "丘陵", profile: "M3 18c3 0 3-8 7-8s4 8 7 8c4 0 3-13 8-13s5 13 8 13" },
    { id: "dunes", name: "沙丘", profile: "M3 18c4-1 7-4 10-12l4 12c5-1 8-4 12-12l4 12" },
    { id: "gullies", name: "沟壑", profile: "M3 6l4 12 5-12 5 12 5-12 5 12 6-12" },
    { id: "canyon", name: "峡谷", profile: "M3 5h8l4 13h7l4-13h7" },
    { id: "basin", name: "盆地", profile: "M3 5c6 0 4 13 12 13h7c7 0 5-13 11-13" },
    { id: "volcano", name: "火山", profile: "M3 18 13 5l5 5 5-5 10 13" },
  ] },
  { name: "水体", brushes: [{ id: "river", name: "河流", icon: IconRipple }] },
]);
const defaultWeather: SceneWeather = { condition: "clear", timeOfDay: "day", intensity: 0.6, wind: 0.25, windDirection: 45 };
const weatherDraft = shallowRef<SceneWeather>();
let weatherEditCanceled = false;
const weather = computed(() => ({ ...defaultWeather, ...(weatherDraft.value ?? props.modelValue.weather) }));
const weatherLighting = computed(() => getWeatherLighting(weather.value, displayTime.value));
const sunlightFields = markMessages([
  { key: "sunIntensity", name: "主光强度", min: 0, max: 10, step: 0.05, unit: "" },
  { key: "sunAzimuth", name: "光源方位", min: 0, max: 360, step: 1, unit: "°" },
  { key: "sunElevation", name: "光源高度角", min: 0, max: 90, step: 1, unit: "°" },
] as const);
const environmentLightFields = markMessages([
  { key: "ambientIntensity", name: "环境补光", min: 0, max: 3, step: 0.05 },
  { key: "skyIntensity", name: "天空亮度", min: 0, max: 5, step: 0.05 },
] as const);
const lightingResponseFields = markMessages([
  { key: "exposure", name: "曝光", min: 0.1, max: 3, step: 0.05, unit: "×" },
  { key: "weatherInfluence", name: "天气联动", min: 0, max: 1, step: 0.05, unit: "%" },
] as const);
const weatherLayerOptions = markMessages([
  { key: "clouds", condition: "cloudy", group: "precipitation", name: "多云", strengthLabel: "云量", icon: IconCloud },
  { key: "rain", condition: "rain", group: "precipitation", name: "降雨", strengthLabel: "雨量", icon: IconCloudRain },
  { key: "snow", condition: "snow", group: "precipitation", name: "降雪", strengthLabel: "雪量", icon: IconSnowflake },
  { key: "fog", condition: "fog", group: "precipitation", name: "浓雾", strengthLabel: "雾量", icon: IconMist },
  { key: "hail", condition: "rain", group: "precipitation", name: "冰雹", strengthLabel: "冰雹", icon: IconDiamond },
  { key: "thunder", condition: "cloudy", group: "precipitation", name: "雷电", strengthLabel: "雷电", icon: IconBolt },
  { key: "dust", condition: "fog", group: "extreme", name: "扬尘", strengthLabel: "扬尘", icon: IconWind },
  { key: "sandstorm", condition: "fog", group: "extreme", name: "沙尘暴", strengthLabel: "沙尘暴", icon: IconWind },
  { key: "haze", condition: "fog", group: "extreme", name: "霾", strengthLabel: "霾", icon: IconMist },
  { key: "blizzard", condition: "snow", group: "extreme", name: "暴风雪", strengthLabel: "暴风雪", icon: IconSnowflake },
  { key: "aurora", condition: "clear", group: "sky", name: "极光", strengthLabel: "极光", icon: IconSparkles },
  { key: "rainbow", condition: "clear", group: "sky", name: "彩虹", strengthLabel: "彩虹", icon: IconRainbow },
  { key: "meteors", condition: "clear", group: "sky", name: "流星", strengthLabel: "流星", icon: IconMeteor },
] as const);
const weatherGroups = markMessages([{ id: "precipitation", name: "云雾与降水" }, { id: "extreme", name: "风沙与极端天气" }, { id: "sky", name: "天空现象" }] as const);
const weatherLayers = computed(() => getWeatherLayers(weather.value));
const acceptedWeatherLayers = computed(() => getWeatherLayers(props.modelValue.weather));
const activeWeatherLayers = computed(() => weatherLayerOptions.filter(layer => weatherLayers.value[layer.key] > 0 || !!weatherDraft.value && acceptedWeatherLayers.value[layer.key] > 0));
const effectiveRain = computed(() => weatherLayers.value.rain * weather.value.intensity);
const rainLevel = computed(() => effectiveRain.value < 0.25 ? translate("小雨") : effectiveRain.value < 0.5 ? translate("中雨") : effectiveRain.value < 0.8 ? translate("大雨") : translate("暴雨"));
const windDirectionOptions = computed(() => {
  const direction = weather.value.windDirection ?? 45;
  const options = [
    { value: 0, label: "东（+X · 0°）" }, { value: 45, label: "东南（45°）" },
    { value: 90, label: "南（+Z · 90°）" }, { value: 135, label: "西南（135°）" },
    { value: 180, label: "西（−X · 180°）" }, { value: 225, label: "西北（225°）" },
    { value: 270, label: "北（−Z · 270°）" }, { value: 315, label: "东北（315°）" },
  ];
  return options.some(option => option.value === direction) ? options : [...options, { value: direction, label: `自定义（${round(direction)}°）` }].sort((a, b) => a.value - b.value);
});
const selectedObject = computed(() => {
  const accepted = props.modelValue.objects.find(object => object.id === subjectId.value);
  if (!accepted) return;
  const object = objectDraft.value?.id === accepted.id ? objectDraft.value : accepted;
  return objectDragPreview.value?.id === accepted.id ? { ...object, ...objectDragPreview.value.values } : object;
});
const selectedObjectGroup = computed(() => props.modelValue.objectGroups?.find(group => group.objectIds.length > 1 && group.objectIds.length === selectedObjectIds.value.length && group.objectIds.every(id => selectedObjectIds.value.includes(id))));
function objectHandlePosition(anchor: ObjectAnchor) {
  const width = canvas.value?.clientWidth ?? 960;
  const height = canvas.value?.clientHeight ?? 540;
  // ACT: 右侧任意编辑面板打开时都为手柄预留宽度，避免手柄被面板压住。
  const reserved = editorPanel.value && editorPanel.value !== "life" ? (editorPanel.value === "view" ? 372 : 336) : 0;
  // 手柄一排四个共 138px 宽，贴右边时整排留在画面里（原先只留 120，最右的重力开关被切掉一截）。
  const left = Math.min(Math.max(anchor.handleX + 16, 16), Math.max(16, width - reserved - 154));
  // 手柄块以 top 为中线、上下各约 47px：上沿让开右上角的撤销/保存按钮（到 70px），也不压住物体工具条。
  let top = Math.min(Math.max(anchor.handleY, 125), Math.max(125, height - 150));
  const toolbar = toolbarPlacement(anchor);
  const half = toolbarWidth.value / 2;
  if (left < toolbar.left + half + 8 && left + 138 > toolbar.left - half - 8 && top - 47 < toolbar.top + 8 && top + 47 > toolbar.top - 44) top = toolbar.top + 8 + 47;
  return { left, top };
}
/** 物体工具条的位置：left 是水平中线，top 是它的下沿（工具条自身向上长）。 */
function toolbarPlacement(anchor: ObjectAnchor) {
  const width = canvas.value?.clientWidth ?? 960;
  const half = toolbarWidth.value / 2 + 12;
  return { left: Math.round(Math.min(Math.max(anchor.x, half), Math.max(half, width - half))), top: Math.round(Math.max(anchor.y - 12, 116)) };
}
// ACT: 点选素材后只在视口右侧悬浮升降/旋转手柄；蓝色包围盒和右侧工具条不再覆盖素材本身。
// 正在拖手柄时即使物体暂时没有屏幕锚点也保留手柄（停在按下的位置）：卸载它会丢掉指针捕获，拖动半路中断。
const showObjectHandles = computed(() => !locked.value && !!selectedObject.value && selectedObject.value.visible !== false && selectedObjectIds.value.length < 2 && (!!objectAnchor.value || !!handleDrag.value)
  && editorPanel.value !== "life" && editorPanel.value !== "terrain" && !(editorPanel.value === "brush" && sceneBrushPainting.value));
// ACT: 按住物体就能直接拖：不用先点一下选中，多选时按住其中一件整批一起走；不依赖右侧编辑面板。
const objectDragActive = computed(() => !locked.value && editorPanel.value !== "life" && editorPanel.value !== "terrain" && !(editorPanel.value === "brush" && sceneBrushPainting.value));
// ACT: 选中物体的工具条跟着物体，但不出画面：按实际宽度夹在视口左右边缘以内，也不顶到最上面的状态栏。
const toolbarWidth = ref(320);
let toolbarObserver: ResizeObserver | undefined;
function measureToolbar(element: unknown) {
  toolbarObserver?.disconnect(); toolbarObserver = undefined;
  if (!(element instanceof HTMLElement)) return;
  toolbarObserver = new ResizeObserver(() => { toolbarWidth.value = element.offsetWidth || toolbarWidth.value; });
  toolbarObserver.observe(element);
}
const toolbarStyle = computed(() => {
  const anchor = objectAnchor.value;
  if (!anchor) return {};
  const { left, top } = toolbarPlacement(anchor);
  return { left: `${left}px`, top: `${top}px` };
});
const objectHandleStyle = computed(() => {
  // ACT: 拖高度时手柄和模型一起上升，像抓着模型本身；拖旋转/倾斜/缩放时手柄停在按下的位置——包围盒一变手柄就漂走，
  // 光标和手柄对不上；物体暂时不在画面里时也停在按下的位置。
  const anchor = objectAnchor.value;
  if (!anchor || handleDrag.value && handleDrag.value.kind !== "height") return handleDrag.value?.style ?? {};
  const { left, top } = objectHandlePosition(anchor);
  return { left: `${left}px`, top: `${top}px` };
});
const handleBadge = computed(() => {
  const drag = handleDrag.value;
  const object = selectedObject.value;
  if (!drag || !object) return "";
  if (drag.kind === "height") return t`高度 ${round(object.height ?? 0)} m`;
  if (drag.kind === "rotate") return t`水平旋转 ${round(object.rotation.y)}°`;
  if (drag.kind === "scale") { const scale = objectDraft.value?.id === object.id ? objectDraft.value.scale : object.scale; return t`缩放 ×${round(scale.x)}`; }
  return t`前后倾斜 ${round(object.rotation.x)}° · 左右侧倾 ${round(object.rotation.z)}°`;
});
const objectGravity = computed(() => !!selectedObject.value && getObjectGravityEnabled(selectedObject.value));
const sceneAnchorName = computed(() => {
  const anchor = sceneAnchor.value;
  return anchor?.kind === "object" ? props.modelValue.objects.find(object => object.id === anchor.objectId)?.name ?? translate("场景物体") : translate("场景点");
});
const sceneAnchorCoordinates = computed(() => sceneAnchor.value ? [sceneAnchor.value.position.x, sceneAnchor.value.position.y, sceneAnchor.value.position.z].map(round).join(", ") : "");
const sceneAnchorTitle = computed(() => `${sceneAnchorName.value} · XYZ（m）：${sceneAnchorCoordinates.value}`);
const terrainMinRadius = computed(() => Math.max(1, Math.ceil((props.modelValue.terrain?.size ?? 80) / (props.modelValue.terrain?.segments ?? 64) * 2) / 2));
const locked = computed(() => !!busy.value || !!props.saving);
const navigationEnabled = computed(() => !props.saving);
function round(value: number) { return Math.round(value * 1000) / 1000; }
function viewportDocument(value = props.modelValue) {
  value = aiPreviewDocument.value && aiController.value ? { ...mergedAiPreview(value).merged, view: value.view, time: value.time } : value;
  const draft = objectDraft.value;
  return { ...value, objects: draft ? value.objects.map(object => object.id === draft.id ? draft : object) : value.objects, weather: weatherDraft.value ?? value.weather, atmosphere: atmosphereDraft.value ?? value.atmosphere };
}
function clone(value: SceneDocument): SceneDocument { return JSON.parse(JSON.stringify(value)); }
function fail(error: unknown) { for (const sink of failureSinks) sink(error); if (!disposed) notice.value = error instanceof Error ? error.message : translate("操作失败，请重试"); }
// 外部总Agent的操作（hostEvents）在执行期间收集界面报错，作为调用失败返回；界面提示照常显示。
const failureSinks = new Set<(error: unknown) => void>();
// 外部总Agent导出镜头表、剪辑表时，文件交给节点存进工作区，不弹浏览器下载。
let fileSink: ((file: File) => void) | undefined;
function deliverFile(file: File) {
  if (fileSink) { fileSink(file); return; }
  const link = window.document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  window.document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
}
function clearSceneAnchor() { sceneAnchor.value = null; viewport?.setSceneAnchor(null); }
function rememberPerformanceContext(objectId = subjectId.value, trackId = selectedTrackId.value, clipId = selectedPerformanceClipId.value) {
  const object = props.modelValue.objects.find(object => object.id === objectId);
  const members = object && getPerformanceObjectIds(object.id, props.modelValue.objectGroups);
  const track = object && (timelineTracks.value.find(track => track.id === trackId && (track.controller === "object" ? track.objectId === object.id : members?.includes(track.objectId))) ?? performanceTrackForObject(object.id));
  const source = props.modelValue.objects.find(object => object.id === track?.objectId);
  const clip = track && source && getPerformanceClips(track, source).find(clip => clip.id === clipId);
  performanceContext.value = { objectId: track?.objectId ?? object?.id, trackId: track?.id, clipId: clip?.id };
}
function clearPerformanceConversation() {
  performanceContext.value = undefined;
  if (editorPanel.value === "life") closeInspector();
}
function toggleAssets() {
  assetsOpen.value = !assetsOpen.value;
  if (assetsOpen.value) closeInspector();
}
function toggleChat() {
  if (!chatOpen.value && editorPanel.value === "life") rememberPerformanceContext();
  chatOpen.value = !chatOpen.value;
}
function finishVoiceInput() {
  if (!voiceAsr) return;
  const asr = voiceAsr;
  voiceAsr = undefined;
  prompt.value = (voicePrefix + voiceFinalText).slice(0, 12000);
  try { asr.destroy(); }
  catch (error) { fail(error); }
  finally { voiceState.value = "idle"; }
}
function toggleVoiceInput() {
  if (voiceActive.value) {
    try { voiceAsr?.stop(); }
    catch (error) { finishVoiceInput(); fail(error); }
    return;
  }
  if (locked.value || !voiceSupported) return;
  voicePrefix = prompt.value + (prompt.value && !/\s$/.test(prompt.value) ? " " : "");
  voiceFinalText = "";
  try {
    const asr = createBrowserAsr({
      lang: "zh-CN", continuous: true,
      onStateChange(state) {
        if (voiceAsr !== asr) return;
        if (state === "idle") { finishVoiceInput(); void nextTick(() => promptInput.value?.focus()); }
        else voiceState.value = state;
      },
      onResult({ text, finalText }) {
        if (voiceAsr !== asr) return;
        voiceFinalText = finalText;
        prompt.value = (voicePrefix + text).slice(0, 12000);
      },
      onError({ code }) {
        if (voiceAsr !== asr) return;
        finishVoiceInput();
        const errors: Record<string, string> = {
          "not-allowed": "麦克风权限未获允许，请在浏览器或系统设置中开启。",
          "service-not-allowed": "当前浏览器未允许使用语音识别服务，请使用文字输入。",
          "audio-capture": "无法使用麦克风，请检查设备连接和占用情况。",
          "no-speech": "未检测到语音，请重试。",
          network: "语音识别服务连接失败，请检查网络后重试。",
          "language-not-supported": "当前语音识别服务不支持中文，请使用文字输入。",
        };
        fail(new Error(errors[code] ?? "语音识别失败，请重试或使用文字输入。"));
      },
    });
    voiceAsr = asr;
    asr.start();
  } catch (error) { finishVoiceInput(); fail(error); }
}
function handleVoiceVisibility() { if (window.document.hidden) finishVoiceInput(); }
function toggleBrushPanel() {
  if (locked.value) return;
  if (brushPanelOpen.value) { closeInspector(); return; }
  chooseBrushPanel(brushPanelMode.value);
}
function chooseBrushPanel(mode: "terrain" | "brush") {
  if (locked.value || editorPanel.value === mode) return;
  brushPanelMode.value = mode;
  openInspector(mode);
}
function togglePainting() {
  if (locked.value) return;
  if (editorPanel.value === "terrain") terrainPainting.value = !terrainPainting.value;
  else if (editorPanel.value === "brush") sceneBrushPainting.value = !sceneBrushPainting.value;
}
function chooseSceneBrush(settings: SceneBrushSettings) {
  if (locked.value) return;
  viewport?.cancelSceneBrush();
  sceneBrushSettings.value = settings;
  sceneBrushPainting.value = true;
}
function mergeAvailableAssets(assets: SceneAsset[]) {
  const existing = new Map(availableAssets.value.map(asset => [asset.id, asset]));
  if (assets.every(asset => existing.get(asset.id) === asset)) return;
  availableAssets.value = [...new Map([...availableAssets.value, ...assets].map(asset => [asset.id, asset])).values()];
}
function toggleView() {
  if (locked.value) return;
  if (editorPanel.value === "view") { closeInspector(); return; }
  openInspector("view");
}
function selectWorldTab(value: typeof worldTab.value) {
  cancelAtmosphereDraft();
  cancelTimeDraft();
  cancelWeatherDraft();
  worldTab.value = value;
}
function beginAtmosphereEdit(event: Event) {
  if (locked.value || event instanceof KeyboardEvent && (event.key === "Escape" || event.ctrlKey || event.metaKey || event.altKey)) return;
  atmosphereEditCanceled = false;
}
function previewAtmosphere(patch: Partial<SceneAtmosphere>) {
  if (disposed || locked.value || atmosphereEditCanceled || editorPanel.value !== "view" || worldTab.value !== "space") return;
  try {
    atmosphereDraft.value = sceneAtmosphereSchema.parse({ ...atmosphere.value, ...patch });
    viewport?.sync(viewportDocument(), true);
  } catch (error) { cancelAtmosphereDraft(); fail(error); }
}
function commitAtmosphereDraft() {
  if (!atmosphereDraft.value || atmosphereEditCanceled) return;
  if (locked.value || editorPanel.value !== "view" || worldTab.value !== "space") { cancelAtmosphereDraft(); return; }
  const value = atmosphereDraft.value;
  atmosphereDraft.value = undefined;
  try { commit({ ...props.modelValue, atmosphere: value }); }
  catch (error) { viewport?.sync(viewportDocument(), true); fail(error); }
}
function cancelAtmosphereDraft() {
  if (!atmosphereDraft.value) return false;
  atmosphereEditCanceled = true;
  atmosphereDraft.value = undefined;
  if (!disposed) viewport?.sync(viewportDocument(), true);
  return true;
}
function updateAtmosphere(patch: Partial<SceneAtmosphere>) {
  if (locked.value) return;
  cancelAtmosphereDraft();
  try { commit({ ...props.modelValue, atmosphere: { ...defaultAtmosphere, ...props.modelValue.atmosphere, ...patch } }); }
  catch (error) { fail(error); }
}
function updateSpaceDisplay(key: keyof NonNullable<SceneDocument["display"]>, value: boolean) {
  if (locked.value) return;
  commit({ ...props.modelValue, display: { ...props.modelValue.display, [key]: value } });
}
function applyWorldSize() {
  if (locked.value || !worldSizeValid.value) return;
  viewport?.cancelTerrainStroke();
  try {
    const terrain = resizeTerrain(props.modelValue.terrain, Number(worldSizeInput.value));
    selectedTerrainTree.value = null;
    viewport?.selectTerrainTree(null);
    if (updateTerrain(terrain)) {
      worldSizeInput.value = String(terrain.size);
    }
  } catch (error) { fail(error); }
}
function editorFraming(): CameraFraming {
  const view = viewport?.getEditorView() ?? props.modelValue.view;
  const aspect = Math.max(0.01, (canvas.value?.clientWidth ?? 960) / Math.max(1, canvas.value?.clientHeight ?? 540));
  return { position: { ...view.position }, target: { ...view.target }, focalLength: getCameraFocalLength(view.fov ?? 50, aspect) };
}
function getStoredCamera(id: string) { return latestScene().cameras?.find(camera => camera.id === id); }
function sameFraming(a: CameraFraming, b: CameraFraming) { return JSON.stringify(a) === JSON.stringify(b); }
function roundTime(value: number) { return Math.round(value * 1000) / 1000; }
function changeCamera(next: SceneCamera, remember = true) {
  if (cameraLocked.value) return false;
  try {
    const camera = cameraTrackSchema.parse(next);
    const scene = latestScene();
    commit({ ...scene, cameras: (scene.cameras ?? []).map(entry => entry.id === camera.id ? camera : entry) }, remember);
    return true;
  } catch (error) { fail(error); return false; }
}
// ACT: 取景窗与场景标记平时直接显示镜头段插值的结果；只有手上正在调时才用手上的画面临时盖住。
function applyCameraPose() {
  if (!viewport) return;
  const id = editorPanel.value === "life" && !locked.value ? monitorCamera.value?.id ?? "" : "";
  const live = cameraGesture.value?.id === id ? cameraGesture.value.framing : null;
  if (cameraPoseId && cameraPoseId !== id && appliedCameraPose) viewport.setCameraPose(cameraPoseId, null);
  if (cameraPoseId !== id) appliedCameraPose = null;
  cameraPoseId = id;
  if (!id || live === appliedCameraPose) return;
  appliedCameraPose = live;
  viewport.setCameraPose(id, live);
}
function displayedFraming(camera: SceneCamera): CameraFraming {
  return viewport?.getCameraPose(camera.id) ?? sampleSceneCamera(camera, currentFilmTime(), id => viewport?.getSubjectPosition(id));
}
function cancelTrackPick(event: PointerEvent) {
  if (!trackPicking.value) return;
  // ACT: 挑跟踪对象时直接在场景里拾取，正在演绎、位置已经移动的演员也能点中；右键取消。
  event.preventDefault(); event.stopPropagation();
  if (event.button === 2) { trackPicking.value = false; return; }
  if (event.button !== 0 || !viewport) return;
  const picked = viewport.pickTrackPoint(event.clientX, event.clientY);
  if (picked) pickTrackingSubject(picked);
}
function setViewfinderCanvas(element: HTMLCanvasElement | null) {
  viewfinderCanvas = element;
  viewport?.setViewfinder(element);
}
function setMonitorCanvas(element: HTMLCanvasElement | null) {
  monitorCanvas = element;
  viewport?.setMonitor(element);
}
function updateTimelineFolders(folders: TimelineFolder[]) {
  if (locked.value) return;
  const { timeline, ...rest } = props.modelValue;
  commit(folders.length ? { ...rest, timeline: { ...timeline, folders } } : rest);
}
function clearCameraSelection() {
  trackPicking.value = false;
  selectedCameraId.value = ""; selectedShotId.value = "";
}
function focusCamera(id: string, shotId = "") {
  selectedCameraId.value = id; selectedShotId.value = shotId;
  selectedTrackId.value = ""; selectedPerformancePoint.value = undefined; selectedPerformanceClipId.value = "";
  subjectId.value = ""; selectedObjectIds.value = []; selectedTerrainTree.value = null;
  if (editorPanel.value !== "life") openInspector("life");
}
function seekFilm(time: number) {
  const range = filmRange.value;
  if (!range || cameraLocked.value) return;
  seekTimeline(range.start + Math.max(0, time), "end");
}
function addCamera() {
  if (cameraLocked.value) return;
  const cameras = props.modelValue.cameras ?? [];
  if (cameras.length >= 24) { fail(new Error("最多放置24个机位")); return; }
  let number = 1;
  while (cameras.some(camera => camera.name === "机位 " + number)) number++;
  try {
    // ACT: 机位只在镜头段里出现和上成片，所以新机位直接带一段镜头：第一台盖住整部成片，之后的从播放头起拍3秒（或到成片结尾）。
    const frame = editorFraming();
    const start = cameras.length ? roundTime(filmTime.value) : 0;
    const end = cameras.length ? roundTime(Math.max(start + minShotSeconds, Math.min(start + 3, filmDuration.value > start + 0.5 ? filmDuration.value : start + 3))) : roundTime(filmDuration.value);
    const shotId = crypto.randomUUID();
    const camera = cameraTrackSchema.parse({ ...createSceneCamera(crypto.randomUUID(), "机位 " + number, frame), shots: [{ id: shotId, start, end, frame, front: getTopShotFront(cameras) + 1 }] });
    commit({ ...props.modelValue, cameras: [...cameras, camera], time: { ...(viewport?.getWorldTime() ?? worldTime.value), paused: true } });
    cancelCameraGesture(); cancelPerformanceRoute();
    focusCamera(camera.id, shotId);
  } catch (error) { fail(error); }
}
// ACT: 一键分镜：选中两个人排对话戏正反打，选中一个围绕他排，否则自动取走动线最长的人；之前的“分镜·”机位整组替换，手动机位保留。
/** 主体在这些镜头段开头、中间、结尾的真实位置（走动的人按演绎定位，最多均匀挑8段）；取样完回到原来的时刻。 */
function subjectSamples(objectId: string, shots: readonly { start: number; end: number }[]): Vector3Value[] {
  const range = viewport?.getFilmRange();
  if (!viewport || !range) return [];
  const original = viewport.getWorldSeconds();
  const samples: Vector3Value[] = [];
  // 镜头段多于8段时均匀挑8段（整段走位都照顾到，不只看前几段）。
  const picked = shots.length > 8 ? Array.from({ length: 8 }, (_, index) => shots[Math.round(index * (shots.length - 1) / 7)]!) : shots;
  for (const shot of picked) for (const share of [0.05, 0.5, 0.95]) {
    const time = range.start + shot.start + (shot.end - shot.start) * share;
    viewport.seekPerformance(time, "start"); viewport.seekPerformance(time, "end");
    const at = viewport.getSubjectPosition({ objectId, mode: "aim" });
    if (at) samples.push(at);
  }
  viewport.seekPerformance(original, "start"); viewport.seekPerformance(original, "end");
  return samples;
}
function clearCoverageCamera(camera: SceneCamera, ignore: string[], partners: readonly string[] = []): SceneCamera {
  // 单人分镜的全景沿用当前视角（fitCoverageWide单独处理）；双人、群戏全景是按人算出来的，窄走廊、小房间里会顶到墙，也要避让（转±80°以内仍在轴线同侧，不越轴）。
  if (!viewport || camera.name === "分镜·全景") return camera;
  const frame = camera.frame, target = frame.target;
  const dx = frame.position.x - target.x, dz = frame.position.z - target.z;
  // 候选机位：原位，再绕主体水平转±40°、±80°（过肩机位只能原方向往前推，转了就不是过肩、还可能越轴）。
  const angles = camera.name.includes("过肩") ? [0] : [0, -40, 40, -80, 80];
  // 跟拍机位和人保持同样的相对位置一起走：在每段镜头开头、中间、结尾人的真实位置上检查（人走到墙边时机位别钻进墙里），挑所有时刻都看得见的方向。
  const followId = camera.track?.mode === "follow" ? camera.track.objectId : undefined;
  const samples = followId ? subjectSamples(followId, camera.shots ?? []) : [];
  if (samples.length > 1) {
    let pick: { position: Vector3Value; clear: number } | undefined;
    // 转机位时不换到行进线另一侧（运动方向不越轴）。
    const axis = routeAxis(samples), line = axis ? { x: axis[1].x - axis[0].x, z: axis[1].z - axis[0].z } : { x: 0, z: 0 };
    const lineSide = (x: number, z: number) => Math.hypot(line.x, line.z) > 1 ? Math.sign(line.x * z - line.z * x) : 0;
    const originalSide = lineSide(dx, dz);
    // 窄走廊、小巷里转方向也躲不开时，再把机位往人跟前收（0.75倍、0.55倍距离），焦段不变，景别略紧。
    search: for (const scale of [1, 0.75, 0.55]) for (const degrees of angles) {
      const a = degrees * Math.PI / 180;
      const ox = (dx * Math.cos(a) + dz * Math.sin(a)) * scale, oz = (-dx * Math.sin(a) + dz * Math.cos(a)) * scale, oy = frame.position.y - target.y;
      if (originalSide && lineSide(ox, oz) !== originalSide) continue;
      const clear = samples.filter(sample => viewport!.sightBlocked(sample, { x: sample.x + ox, y: sample.y + oy, z: sample.z + oz }, ignore) === undefined).length;
      if (!pick || clear > pick.clear) pick = { position: { x: target.x + ox, y: frame.position.y, z: target.z + oz }, clear };
      if (clear === samples.length) break search;
    }
    if (!pick || pick.position.x === frame.position.x && pick.position.z === frame.position.z) return camera;
    const moved = { ...frame, position: { x: Math.round(pick.position.x * 100) / 100, y: Math.round(pick.position.y * 100) / 100, z: Math.round(pick.position.z * 100) / 100 } };
    return { ...camera, frame: moved, shots: camera.shots?.map(shot => ({ ...shot, frame: moved })) };
  }
  // 看得见主体的方向里再挑画面干净的：镜头前近处没有别人糊住半个画面，主体身后是景（墙、楼、人）而不是三壁布景敞开那面的空地和天。
  // 转方向时不越轴：双人戏不换到两人连线另一侧，单人走动戏不换到行进线另一侧（和一键分镜的越轴检查同一条线）。
  const route = partners.length === 1 ? getRouteAxes(props.modelValue).get(partners[0]!) : undefined;
  const pair = partners.length === 2 ? partners.map(id => viewport!.getSubjectPosition({ objectId: id, mode: "aim" })) : route ? routeAxis(route) ?? [] : [];
  const pairSide = (x: number, z: number) => pair[0] && pair[1] ? Math.sign((pair[1].x - pair[0].x) * (z - pair[0].z) - (pair[1].z - pair[0].z) * (x - pair[0].x)) : 0;
  const originalPairSide = pairSide(frame.position.x, frame.position.z);
  const people = props.modelValue.objects.filter(object => object.visible && /person/i.test(object.asset.shape ?? "") && !ignore.includes(object.id) && object.id !== camera.track?.objectId)
    .map(object => viewport!.getSubjectPosition({ objectId: object.id, mode: "aim" })).filter((point): point is Vector3Value => !!point);
  const halfWidth = Math.atan(getFilmFrameHeight() * filmAspect / 2 / frame.focalLength);
  const insideSet = setFootprintTest(props.modelValue.objects);
  const penalty = (position: Vector3Value) => {
    const fx = target.x - position.x, fz = target.z - position.z, distance = Math.hypot(fx, fz);
    if (distance < 0.05) return 0;
    // 前景：比主体近一半以上、落在画框里（算上0.25米身宽）的其他人。
    const clutter = people.filter(point => {
      const px = point.x - position.x, pz = point.z - position.z;
      const along = (px * fx + pz * fz) / distance, across = Math.abs(px * fz - pz * fx) / distance;
      return along > 0.1 && along < distance * 0.6 && Math.atan2(Math.max(0, across - 0.25), along) < halfWidth;
    }).length;
    // 背景：沿视线水平延伸20米内什么都没打到就是空场。
    // 三壁内景里对着敞开面不扣分：分完镜会在主体身后推活动墙补上，不用为了躲空背景把正面近景转成侧脸。
    const empty = !insideSet(target) && viewport!.sightBlocked(target, { x: target.x + fx / distance * 20, y: target.y, z: target.z + fz / distance * 20 }, [...ignore, ...(camera.track?.objectId ? [camera.track.objectId] : [])]) === undefined;
    return clutter * 2 + (empty ? 1 : 0);
  };
  // 跟踪着人的机位实际对准的是他的瞄准点（坐在案后的人比取景目标点低），两个点都要看得见。
  const aim = camera.track?.objectId ? viewport.getSubjectPosition({ objectId: camera.track.objectId, mode: "aim" }) : undefined;
  const blockedAt = (position: Vector3Value) => viewport!.sightBlocked(target, position, ignore) ?? (aim ? viewport!.sightBlocked(aim, position, ignore) : undefined);
  // 脸看得见、胸口被桌案挡住（近景只露个头）也算没拍好，同样升机位往下拍。
  const chest = aim ? { ...aim, y: aim.y - 0.3 } : undefined;
  const chestHidden = (position: Vector3Value) => !!chest && viewport!.sightBlocked(chest, position, ignore) !== undefined;
  let best: { position: Vector3Value; hit?: number; penalty?: number; chest?: boolean } | undefined;
  // 平着每个方向都被挡（坐在公案、柜台、讲台后面的人）：像现场一样把机位升高0.45米、0.9米从上面越过去。
  // 先原方向往人跟前推（0.75倍、0.55倍距离，构图不变、景别略紧），再绕主体转方向：被前排的人、桌案挡住时推近比转成侧面好。
  const candidates = [[0, 1], [0, 0.75], [0, 0.55], ...angles.filter(degrees => degrees).map(degrees => [degrees, 1])] as [number, number][];
  search: for (const lift of [0, 0.45, 0.9]) {
    if (best && best.hit === undefined && !best.chest) break;
    for (const [degrees, scale] of candidates) {
      const a = degrees * Math.PI / 180;
      const position = { x: target.x + (dx * Math.cos(a) + dz * Math.sin(a)) * scale, y: frame.position.y + lift, z: target.z + (-dx * Math.sin(a) + dz * Math.cos(a)) * scale };
      if (degrees && originalPairSide && pairSide(position.x, position.z) !== originalPairSide) continue;
      const hit = blockedAt(position);
      if (hit === undefined) {
        const hidden = chestHidden(position), score = penalty(position) + (hidden ? 1 : 0);
        if (!best || best.hit !== undefined || score < (best.penalty ?? 0)) best = { position, penalty: score, chest: hidden };
        if (score === 0) break search;
        continue;
      }
      // 升高后的被挡候选不替换平拍的（推近时仍按平拍处理）。
      if (!best || (best.hit !== undefined && !lift && best.hit < hit)) best = { position, hit };
    }
  }
  if (!best) return camera;
  let position = best.position;
  if (best.hit !== undefined) {
    // 每个方向都被挡：取遮挡最远的方向，把机位推到遮挡物前面0.35米（太近就不动）。
    const length = Math.hypot(position.x - target.x, position.y - target.y, position.z - target.z);
    const keep = best.hit - 0.35;
    if (keep < 0.8) return camera;
    const ratio = keep / length;
    position = { x: target.x + (position.x - target.x) * ratio, y: target.y + (position.y - target.y) * ratio, z: target.z + (position.z - target.z) * ratio };
  }
  if (position === frame.position) return camera;
  const moved = { ...frame, position: { x: Math.round(position.x * 100) / 100, y: Math.round(position.y * 100) / 100, z: Math.round(position.z * 100) / 100 } };
  return { ...camera, frame: moved, shots: camera.shots?.map(shot => ({ ...shot, frame: moved })) };
}
// ACT: 单人分镜的全景沿用当前视角，但当前视角看不到这个人（被楼挡住、人不在画面里）时，在他周围找一个看得见的全景机位：
// 从当前视角的方向开始每30°试一圈，14米、9米、6米由远到近，略高于头顶俯拍24mm；都被挡就保留原样（总比乱放好）。
function fitCoverageWide(camera: SceneCamera, subjectId: string, keepSide?: Vector3Value): SceneCamera {
  if (!viewport || camera.name !== "分镜·全景") return camera;
  const subject = props.modelValue.objects.find(object => object.id === subjectId);
  if (!subject) return camera;
  const measured = (measureAssetFootprint(subject.asset)?.height ?? 1.75) * subject.scale.y;
  const height = Number.isFinite(measured) && measured > 0.2 ? measured : 1.75;
  // 主体在全景每段镜头中间时刻的真实位置（走动的人按演绎定位），全景要在这些时刻都看得见他；取样完回到原来的时刻。
  const samples = subjectSamples(subject.id, camera.shots ?? []);
  if (!samples.length) samples.push({ x: subject.position.x, y: subject.position.y + height * 0.8, z: subject.position.z });
  const focus = samples[0]!;
  // 运动方向不越轴：主体在走时，全景要和跟拍的中景、近景在行进线同一侧（keepSide 是中景机位位置），另一侧的候选降一档。
  const [first, last] = routeAxis(samples) ?? [samples[0]!, samples[0]!];
  const lineLength = Math.hypot(last.x - first.x, last.z - first.z);
  const sideOf = (point: Vector3Value) => Math.sign((last.x - first.x) * (point.z - first.z) - (last.z - first.z) * (point.x - first.x));
  const requiredSide = keepSide && lineLength > 1 ? sideOf(keepSide) : 0;
  const wrongSide = (position: Vector3Value) => !!requiredSide && sideOf(position) !== requiredSide;
  const seen = (position: Vector3Value) => samples.filter(sample => viewport!.sightBlocked(sample, position, [subject.id]) === undefined).length - (wrongSide(position) ? 0.5 : 0);
  const frame = camera.frame;
  const view = { x: frame.target.x - frame.position.x, y: frame.target.y - frame.position.y, z: frame.target.z - frame.position.z };
  const toSubject = { x: focus.x - frame.position.x, y: focus.y - frame.position.y, z: focus.z - frame.position.z };
  const cos = (view.x * toSubject.x + view.y * toSubject.y + view.z * toSubject.z) / Math.max(1e-6, Math.hypot(view.x, view.y, view.z) * Math.hypot(toSubject.x, toSubject.y, toSubject.z));
  // 横向半视场按当前画幅和焦段算，留两成边；走动的主体全景会摇着跟（aim），不要求起点就在画面里。
  const halfWidth = Math.atan(getFilmFrameHeight() * filmAspect / 2 / frame.focalLength) * 0.8;
  const tracked = !!camera.track;
  if ((tracked || cos > Math.cos(halfWidth)) && seen(frame.position) === samples.length) return camera;
  const half = getWorldHalf(props.modelValue) - 1;
  const center = { x: samples.reduce((sum, sample) => sum + sample.x, 0) / samples.length, z: samples.reduce((sum, sample) => sum + sample.z, 0) / samples.length };
  const base = Math.atan2(frame.position.z - center.z, frame.position.x - center.x);
  let best: { position: Vector3Value; seen: number } = { position: frame.position, seen: seen(frame.position) };
  for (const distance of [14, 9, 6]) for (let step = 0; step < 12 && best.seen < samples.length; step++) {
    const angle = base + Math.ceil(step / 2) * (step % 2 ? 1 : -1) * Math.PI / 6;
    const position = { x: center.x + Math.cos(angle) * distance, y: subject.position.y + height + distance * 0.3, z: center.z + Math.sin(angle) * distance };
    if (Math.abs(position.x) > half || Math.abs(position.z) > half) continue;
    const count = seen(position);
    if (count > best.seen) best = { position, seen: count };
  }
  if (best.position === frame.position) return camera;
  const round = (point: Vector3Value) => ({ x: Math.round(point.x * 100) / 100, y: Math.round(point.y * 100) / 100, z: Math.round(point.z * 100) / 100 });
  const position = best.position;
  const moved: CameraFraming = { position: round(position), target: round(focus), focalLength: 24 };
  const pushed = round({ x: position.x + (focus.x - position.x) * 0.12, y: position.y + (focus.y - position.y) * 0.12, z: position.z + (focus.z - position.z) * 0.12 });
  return { ...camera, frame: moved, shots: camera.shots?.map(shot => ({ ...shot, frame: moved, ...(shot.path ? { path: [moved.position, pushed] } : {}) })) };
}
/**
 * ACT: 剧本选角站位：台词里的角色（最多6个）先按名字找场景里的人；没有的新建骨骼人物（主角能做动作），
 * 两人面对面相隔1.6米横在画面中间（侧面对着当前视角，正好是双人镜头），三人以上围成半圆面向圆心；整组找一块不压陈设的空地。
 */
const castColors = ["#b8433b", "#3f6fb5", "#d29a2e", "#4f8a4a", "#7d54a6", "#2f9aa0"];
function castFromScript(script: string): { document: SceneDocument; ids: string[]; note: string } | undefined {
  const speakers = extractSpeakers(script);
  if (speakers.length < 2) return;
  const people = props.modelValue.objects.filter(object => object.visible && /person/i.test(object.asset.shape ?? ""));
  const found = speakers.map(name => people.find(object => object.name === name) ?? people.find(object => object.name.includes(name) || name.includes(object.name)));
  const missing = speakers.filter((_, index) => !found[index]);
  if (!missing.length) return { document: props.modelValue, ids: found.map(object => object!.id), note: "" };
  const rigged = builtinAssets.find(asset => asset.id === "riggedPerson");
  const footprint = rigged && measureAssetFootprint(rigged);
  if (!rigged || !footprint) return;
  const view = editorFraming();
  const forward = { x: view.target.x - view.position.x, z: view.target.z - view.position.z };
  const length = Math.hypot(forward.x, forward.z) || 1;
  const right = { x: -forward.z / length, z: forward.x / length };
  const known = found.filter((object): object is SceneObject => !!object);
  const anchor = known.length ? { x: known.reduce((sum, object) => sum + object.position.x, 0) / known.length, z: known.reduce((sum, object) => sum + object.position.z, 0) / known.length } : { x: view.target.x, z: view.target.z };
  // 脚底高度：已有对手站在站台、舞台上时新角色站同一层，否则站地形上。
  const anchorY = known.length ? Math.max(...known.map(object => object.position.y)) : -Infinity;
  // 低台面（大帐里满铺的木台、戏台、舞台地台，比地形高不到0.35米）也算地面，人站在台面上，不陷进去也不被判成“脚下有东西”。
  const raisedFloor = (x: number, z: number) => {
    const terrain = getTerrainHeight(props.modelValue.terrain, x, z);
    const hit = viewport?.sightBlocked({ x, y: terrain + 1, z }, { x, y: terrain - 0.05, z });
    if (hit === undefined) return terrain;
    const top = terrain + 1 - hit;
    return top <= terrain + 0.35 ? top : terrain;
  };
  const floorAt = (x: number, z: number) => Math.max(raisedFloor(x, z), anchorY);
  // 能不能站：不出世界、不压陈设（整块内景、布景不算，人本来就站在里面）、离别人至少0.6米；
  // 有视口时再用射线确认脚下是空地（不是长凳、病床）、和对手之间没有墙。
  // 对手本来就站在它占地里的物体（站台、整块内景、大厅）算环境不算障碍，墙和台子交给射线判断。
  const environment = (object: SceneObject) => {
    if (/内景|布景·|轿厢/.test(object.asset.name)) return true;
    const print = known.length ? measureAssetFootprint(object.asset) : undefined;
    return !!print && rectsOverlap(rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z), { x: anchor.x, z: anchor.z, hw: 0.05, hd: 0.05, angle: 0 });
  };
  const occupancy = createOccupancy({ ...props.modelValue, objects: props.modelValue.objects.filter(object => !/person/i.test(object.asset.shape ?? "") && !environment(object)) });
  const half = getWorldHalf(props.modelValue) - 1;
  const placed: { x: number; z: number }[] = props.modelValue.objects.filter(object => object.visible && /person/i.test(object.asset.shape ?? "")).map(object => ({ x: object.position.x, z: object.position.z }));
  const standable = (x: number, z: number, partner?: { x: number; z: number }, relaxed = false) => {
    if (Math.abs(x) > half || Math.abs(z) > half || occupancy.blocked(rectFor(footprint, x, z, 0, 1, 1, 0.1))) return false;
    if (placed.some(point => Math.hypot(point.x - x, point.z - z) < 0.6)) return false;
    if (!viewport) return true;
    // 射线高度都按各自脚下的地面算（山坡、台阶上也对）。
    const ground = floorAt(x, z);
    if (viewport.sightBlocked({ x, y: ground + 2.2, z }, { x, y: ground + 0.15, z }) !== undefined) return false;
    if (!partner) return true;
    const partnerGround = floorAt(partner.x, partner.z);
    if (viewport.sightBlocked({ x: partner.x, y: partnerGround + 1.2, z: partner.z }, { x, y: ground + 1.2, z }, known.map(object => object.id)) !== undefined) return false;
    if (relaxed) return true;
    // 身后留出1.5米给过肩机位（贴墙站的话，越过他肩膀拍对手的机位会在墙外）。
    const away = Math.hypot(x - partner.x, z - partner.z) || 1;
    const back = { x: x + (x - partner.x) / away * 1.5, z: z + (z - partner.z) / away * 1.5 };
    return Math.abs(back.x) < half && Math.abs(back.z) < half && viewport.sightBlocked({ x, y: ground + 1.5, z }, { x: back.x, y: ground + 1.5, z: back.z }) === undefined;
  };
  // 站位：两人沿画面左右排开；多人在视角背面一侧围半圆（脸朝镜头这边）。已有对手时新角色站在他身边1.6米、从画面右侧开始每30°找。
  const count = missing.length + known.length;
  const offsets = count === 2 ? [-0.8, 0.8].map(u => ({ x: right.x * u, z: right.z * u }))
    : Array.from({ length: count }, (_, index) => { const angle = Math.PI * (0.15 + 0.7 * index / (count - 1)); const radius = 1.3; return { x: right.x * Math.cos(angle) * -radius + forward.x / length * Math.sin(angle) * radius, z: right.z * Math.cos(angle) * -radius + forward.z / length * Math.sin(angle) * radius }; });
  const spots: { x: number; z: number }[] = [];
  if (known.length) {
    const base = Math.atan2(right.z, right.x);
    for (const _ of missing) {
      let spot: { x: number; z: number } | undefined;
      for (const radius of [1.6, 2.2, 1.2, 3]) for (let step = 0; step < 12 && !spot; step++) {
        const angle = base + Math.ceil(step / 2) * (step % 2 ? 1 : -1) * Math.PI / 6;
        const x = anchor.x + Math.cos(angle) * radius, z = anchor.z + Math.sin(angle) * radius;
        if (standable(x, z, anchor)) spot = { x, z };
      }
      if (!spot) return;
      spots.push(spot); placed.push(spot);
    }
  } else {
    // 视角中心在整块内景、影棚布景里时只在景里找（小卧室、小书房里床和家具占了大半，以前一圈圈往外找会站到墙外去）：
    // 先按严格条件（身后留得出过肩机位）每0.75米找一圈，找不到就放宽（只要站得下、互相看得见），景里都不行才按原来的往外找。
    const insideSet = setFootprintTest(props.modelValue.objects);
    const findCenter = (spacing: number, relaxed: boolean, requireInside: boolean) => {
      for (let ring = 0; ring <= 8; ring++) for (let step = 0; step < Math.max(1, ring * 6); step++) {
        const angle = step / Math.max(1, ring * 6) * Math.PI * 2;
        const at = { x: anchor.x + Math.cos(angle) * ring * spacing, z: anchor.z + Math.sin(angle) * ring * spacing };
        const points = offsets.map(offset => ({ x: at.x + offset.x, z: at.z + offset.z }));
        if (requireInside && !points.every(insideSet)) continue;
        // 景里找时还要和视角中心在同一间屋：胸口高度看过去不隔墙（布景占地的外框比屋子大，走廊尽头墙后也在框里）。
        if (requireInside && viewport && points.some(point => viewport!.sightBlocked({ x: anchor.x, y: floorAt(anchor.x, anchor.z) + 1.2, z: anchor.z }, { x: point.x, y: floorAt(point.x, point.z) + 1.2, z: point.z }, props.modelValue.objects.filter(object => /person/i.test(object.asset.shape ?? "")).map(object => object.id)) !== undefined)) continue;
        // 两人对话：互相看得见、各自身后留得出过肩机位；三人以上只要站得下。
        const ok = count === 2
          ? standable(points[0]!.x, points[0]!.z, points[1], relaxed) && standable(points[1]!.x, points[1]!.z, points[0], relaxed)
          : points.every(point => standable(point.x, point.z));
        if (ok) return at;
      }
      return undefined;
    };
    const center = (insideSet(anchor) ? findCenter(0.75, false, true) ?? findCenter(0.75, true, true) : undefined) ?? findCenter(1.5, false, false);
    if (!center) return;
    for (const offset of offsets) spots.push({ x: center.x + offset.x, z: center.z + offset.z });
  }
  const focus = known.length ? anchor : { x: spots.reduce((sum, spot) => sum + spot.x, 0) / spots.length, z: spots.reduce((sum, spot) => sum + spot.z, 0) / spots.length };
  const objects = [...props.modelValue.objects];
  const ids: string[] = [];
  let slot = 0;
  for (const [index, name] of speakers.entries()) {
    const existing = found[index];
    if (existing) { ids.push(existing.id); continue; }
    const spot = spots[slot++]!;
    const x = Math.round(spot.x * 100) / 100, z = Math.round(spot.z * 100) / 100;
    const ground = floorAt(x, z);
    const object = createSceneObject(structuredClone(rigged), { x, y: ground, z });
    object.name = name;
    object.height = ground;
    object.rotation = { x: 0, y: faceRotation(footprint, { x: focus.x - x, z: focus.z - z }), z: 0 };
    // 每个角色一种好分辨的衣色（镜头里一眼看出谁是谁），避开场景里主角已经用的颜色。
    const used = new Set(objects.filter(item => item.asset.shape === "riggedPerson").map(item => item.color.toLowerCase()));
    object.color = castColors.find(color => !used.has(color)) ?? castColors[index % castColors.length]!;
    objects.push(object);
    ids.push(object.id);
  }
  return { document: { ...props.modelValue, objects }, ids, note: `按剧本新建了角色：${missing.join("、")}（骨骼人物，${known.length ? `站在${known.map(object => object.name).join("、")}旁边` : "站在画面中间"}，可拖动调整站位）` };
}
/**
 * ACT: 空场景按剧本分镜：先按场次标题、地点词挑一套整套景搭好（客栈、法庭、便利店、地铁……），再选角、定日夜、分镜。
 * 粘一段剧本就出一版完整预演；挑不到景就在空地上直接选角分镜。场景里已有东西时不动景。
 */
// ACT: 画布上连了剧本（上游文字）且场景还空着：模板标签最前面多一个“按剧本一键预演”，一点就搭景、选角、定日夜、分镜并打开时间轴。
const upstreamPrevis = computed(() => {
  const full = props.upstreamText?.trim();
  if (!full || props.modelValue.objects.length) return "";
  const { scene: script, count } = firstScene(full);
  const speakers = extractSpeakers(script), template = matchSetTemplate(script);
  if (speakers.length < 2 && !template) return "";
  return `按上游剧本${count > 1 ? `第一场（共${count}场）` : ""}${template ? "搭" + template.name + "、" : ""}${speakers.length >= 2 ? "让" + speakers.join("、") + "站好位、按对白分镜" : "一键分镜"}`;
});
// 粘贴剧本（没连上游时的同一条路）：搭景、选角、定日夜、分镜并打开时间轴。
const pastedScript = ref("");
async function previsFromScript(text: string) {
  const full = text.trim();
  if (!full || locked.value) return;
  await coverScript(full, 1);
  if (!disposed && editorPanel.value !== "life" && props.modelValue.cameras?.length) openInspector("life");
}
async function previsFromUpstream() {
  const full = props.upstreamText?.trim();
  if (!full || locked.value) return;
  const script = firstScene(full).scene;
  if (extractSpeakers(script).length >= 2) await coverScript(full, 1);
  else {
    const template = matchSetTemplate(script);
    if (template) await applySetTemplate(template);
    if (disposed || !props.modelValue.objects.length) return;
    await nextTick();
    addShotCoverage(undefined, 1);
  }
  if (!disposed && editorPanel.value !== "life" && props.modelValue.cameras?.length) openInspector("life");
}
/** 多场剧本只做第一场有对白或地点的那一段；返回这一段和总场数。 */
function firstScene(script: string) {
  const scenes = splitScenes(script);
  const real = scenes.filter(block => extractSpeakers(block).length >= 1 || matchSetTemplate(block));
  return { scene: real[0] ?? scenes[0] ?? script, count: Math.max(1, real.length) };
}
async function coverScript(script?: string, pace?: number) {
  if (cameraLocked.value) return;
  let sceneNote = "";
  notice.value = "";
  if (script) {
    const { scene, count } = firstScene(script);
    if (count > 1) { script = scene; sceneNote = t`剧本有${count}场，先做了第一场；要做别的场，把那一段粘进对白框再按对白剪辑`; }
  }
  const template = script && !props.modelValue.objects.length ? matchSetTemplate(script) : undefined;
  if (template) {
    await applySetTemplate(template);
    if (disposed || !props.modelValue.objects.length) return;
    await nextTick();
  }
  addShotCoverage(script, pace);
  if (template || sceneNote) notice.value = [template ? t`按剧本搭了${translate(template.name)}` : "", notice.value, sceneNote].filter(Boolean).join(translate("；"));
}
function addShotCoverage(script?: string, pace?: number) {
  if (cameraLocked.value) return;
  try {
    // 演绎还没跑过一帧时先排好期，分镜按整段走位取样才准。
    viewport?.settleClock();
    // 没选人时沿用上一次分镜的主体（“分镜·”机位跟踪的人）：换节奏、换剧本重剪时不用再选一遍。
    const previous = [...new Set((props.modelValue.cameras ?? []).filter(camera => camera.name.startsWith("分镜·")).map(camera => camera.track?.objectId).filter((id): id is string => !!id && props.modelValue.objects.some(object => object.id === id)))];
    let subjectIds = selectedObjectIds.value.length >= 2 ? [...selectedObjectIds.value] : subjectId.value ? [subjectId.value] : previous;
    // 按剧本分镜但没选够人：按台词里的角色名找场景里同名的人，找不到的就新建骨骼人物、在画面中间面对面站好。
    let base = props.modelValue, castNote = "";
    if (script && subjectIds.length < 2) {
      const cast = castFromScript(script);
      if (cast) { base = cast.document; subjectIds = cast.ids; castNote = cast.note; }
    }
    const mood = script ? moodFromHeading(script) : undefined;
    if (mood) { base = { ...base, ...moodPatch(base, mood, true) }; castNote = [castNote, `按场次标题换成${mood.name}`].filter(Boolean).join("；"); viewport?.markWorldTimeJump(); }
    const { cameras: all, created: raw } = applySceneCoverage(base, { view: editorFraming(), subjectIds, duration: filmDuration.value, script, pace, createId: () => crypto.randomUUID() });
    // 中景、近景、过肩被墙、柱子、别的人挡住时，沿视线把机位推到遮挡物前面（全景沿用当前视角，不动）。
    const subjects = [...new Set([...subjectIds, ...raw.flatMap(camera => camera.track?.objectId ? [camera.track.objectId] : [])])];
    // 过肩机位排除两个人（前景肩膀本来就要入画）；其他机位只排除自己拍的那个人，别的主体挡脸也算遮挡。
    const single = subjectIds.length === 1 ? subjectIds[0] : subjectIds.length ? undefined : raw.find(camera => camera.track?.objectId)?.track?.objectId;
    const mediumAt = raw.find(camera => camera.name.includes("中景"))?.frame.position;
    const created = raw.map(camera => single ? fitCoverageWide(camera, single, mediumAt) : camera).map(camera => clearCoverageCamera(camera, /过肩|全景|双人/.test(camera.name) ? subjects : camera.track?.objectId ? [camera.track.objectId] : [], subjects));
    const cameras = [...all.filter(camera => !raw.includes(camera)), ...created];
    const walls = addWildWalls(base, created);
    if (walls.count) castNote = [castNote, `反打对着三壁景敞开的一面，在主体身后推了${walls.count}块活动墙`].filter(Boolean).join("；");
    base = walls.document;
    const spoken = script ? withTalkClips(base, created) : undefined;
    // 剧本动作行里的走位（走到某人面前、离开）并进台词轨道。
    const staged = script ? withStageMoves({ ...base, ...(spoken ?? {}) }, created, script) : undefined;
    const talking = staged ? clearExitPaths(staged) : spoken;
    commit({ ...base, ...(talking ?? {}), cameras, time: mood && base.time ? { ...base.time, paused: true } : { ...(viewport?.getWorldTime() ?? worldTime.value), paused: true } });
    cancelCameraGesture(); cancelPerformanceRoute();
    focusCamera(created[0]!.id, created[0]!.shots?.[0]?.id);
    if (castNote) notice.value = castNote;
    exportHint.value = true;
    // 分好镜把播放头放回开头：监看立刻是第1镜，不会停在成片结尾之后的黑场（新建的骨骼人物、活动墙载入完再定位）。
    void nextTick(async () => {
      await viewport?.whenReady();
      if (disposed) return;
      viewport?.settleClock();
      const dropped = staged ? dropBlockedStageMoves() : "";
      seekFilm(0);
      if (dropped) notice.value = [notice.value, dropped].filter(Boolean).join(translate("；"));
    });
  } catch (error) { fail(error); }
}
/**
 * 剧本走位落地前按射线校正（纯数据算不出整块布景里的家具）：
 * 走近——以对方为中心、在原方向±30°、±60°、±90°和1.6/1.3/2米里挑一个脚下是地面、一路腰部（0.5米）胸口（1.2米）都不碰东西的落点；
 * 离开——先背对对手，不通再转±45°、±90°、±135°、180°，4米不通缩到2.5米，落点同样要是地面。
 * 都找不到就不走这一段（留着走不到的动线会让整条台词轨道卡住，连说话动作都不播）。前一段改了终点，后一段从新位置起步。
 */
function clearExitPaths<T extends Pick<SceneDocument, "life">>(patch: T): T {
  const tracks = patch.life?.tracks;
  if (!viewport || !tracks?.length) return patch;
  const people = props.modelValue.objects.filter(object => /person/i.test(object.asset.shape ?? "")).map(object => object.id);
  type Point = [number, number, number];
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const lineClear = (from: Point, to: Point) => [0.5, 1.2].every(height => viewport!.sightBlocked({ x: from[0], y: from[1] + height, z: from[2] }, { x: to[0], y: from[1] + height, z: to[2] }, people) === undefined);
  // 脚下是地面：从1.8米高往下打，第一块面不高过脚底0.15米（打到桌面、床面、柜子就不是）。
  const floorAt = (point: Point) => { const hit = viewport!.sightBlocked({ x: point[0], y: point[1] + 1.8, z: point[2] }, { x: point[0], y: point[1] - 0.3, z: point[2] }, people); return hit === undefined || point[1] + 1.8 - hit <= point[1] + 0.15; };
  let changed = false;
  const next = tracks.map(track => {
    if (!track.name?.startsWith("台词·") || !track.clips?.some(clip => clip.kind === "move")) return track;
    let at: Point | undefined;
    const clips = [...track.clips].sort((a, b) => a.start - b.start).flatMap(clip => {
      if (clip.kind !== "move" || (clip.name !== "离开" && clip.name !== "走近")) return [clip];
      const from = at ?? clip.points[0]!, planned = clip.points.at(-1)!;
      const speed = clip.sourceDuration > 0 ? Math.hypot(planned[0] - clip.points[0]![0], planned[2] - clip.points[0]![2]) / clip.sourceDuration : 1.35;
      const candidates: Point[] = [];
      if (clip.name === "走近") {
        const length = Math.hypot(planned[0] - clip.points[0]![0], planned[2] - clip.points[0]![2]) || 1;
        const target = [planned[0] + (planned[0] - clip.points[0]![0]) / length * 1.6, planned[1], planned[2] + (planned[2] - clip.points[0]![2]) / length * 1.6] as Point;
        const base = Math.atan2(from[2] - target[2], from[0] - target[0]);
        for (const reach of [1.6, 1.3, 2]) for (const turn of [0, 30, -30, 60, -60, 90, -90]) { const angle = base + turn * Math.PI / 180; candidates.push([round(target[0] + Math.cos(angle) * reach), from[1], round(target[2] + Math.sin(angle) * reach)]); }
      } else {
        const base = Math.atan2(planned[2] - clip.points[0]![2], planned[0] - clip.points[0]![0]);
        for (const reach of [4, 2.5]) for (const turn of [0, 45, -45, 90, -90, 135, -135, 180]) { const angle = base + turn * Math.PI / 180; candidates.push([round(from[0] + Math.cos(angle) * reach), from[1], round(from[2] + Math.sin(angle) * reach)]); }
      }
      // 落点四周0.45米（身体半径）不贴墙和家具，不然到了也站不住。
      const roomy = (point: Point) => [0, 1, 2, 3, 4, 5, 6, 7].every(step => { const angle = step * Math.PI / 4; return viewport!.sightBlocked({ x: point[0], y: point[1] + 0.6, z: point[2] }, { x: point[0] + Math.cos(angle) * 0.45, y: point[1] + 0.6, z: point[2] + Math.sin(angle) * 0.45 }, people) === undefined; });
      const pick = candidates.find(point => floorAt(point) && roomy(point) && lineClear(from, point));
      if (!pick) { changed = true; return []; }
      at = pick;
      if (pick === candidates[0] && from === clip.points[0]) return [clip];
      changed = true;
      const seconds = round(Math.max(0.5, Math.hypot(pick[0] - from[0], pick[2] - from[2]) / speed));
      return [{ ...clip, sourceDuration: seconds, sourceOut: seconds, points: [from, pick] as typeof clip.points }];
    });
    return { ...track, clips };
  });
  return changed ? { ...patch, life: { ...patch.life!, tracks: next } } : patch;
}
/**
 * 剧本走位落地后试播到结尾：哪条台词轨道报“走不通”（人站在导航网格收缩掉的桌边、柜前，起步就接不上），
 * 就去掉它的剧本走位、保住说话动作，返回提示让用户在演绎里拖动路线；走得通的照常留着。并进上一步撤销。
 */
function dropBlockedStageMoves() {
  const range = viewport?.getFilmRange();
  const life = props.modelValue.life;
  if (!viewport || !range || !life?.tracks?.length) return "";
  const isStage = (clip: NonNullable<PerformanceTrack["clips"]>[number]) => clip.kind === "move" && (clip.name === "走近" || clip.name === "离开");
  const staged = life.tracks.filter(track => track.name?.startsWith("台词·") && track.clips?.some(isStage));
  if (!staged.length) return "";
  const original = viewport.getWorldSeconds();
  viewport.seekPerformance(range.end - 0.05, "start"); viewport.seekPerformance(range.end - 0.05, "end");
  const blocked = new Set((viewport.getLifeStatus().groups ?? []).filter(group => group.blocked).map(group => group.id));
  viewport.seekPerformance(original, "start"); viewport.seekPerformance(original, "end");
  const stuck = staged.filter(track => blocked.has(track.id));
  if (!stuck.length) return "";
  commit({ ...props.modelValue, life: { ...life, tracks: life.tracks.map(track => stuck.includes(track) ? { ...track, clips: track.clips!.filter(clip => !isStage(clip)) } : track) } }, false);
  return t`${stuck.map(track => track.name!.replace(/^台词·/, "")).join(translate("、"))}的剧本走位在这里接不上导航（站在桌边柜前，或这件整块布景的地面没有导航网格），已去掉，可在演绎里拖动路线`;
}
/** 已落地的“分镜·”机位（Agent 生成的）补遮挡避让和活动墙，并进上一步撤销。 */
function refineCoverageCameras(ids: readonly string[]) {
  const document = props.modelValue;
  const cameras = document.cameras ?? [];
  const coverage = cameras.filter(camera => camera.name.startsWith("分镜·"));
  const subjects = [...new Set(coverage.flatMap(camera => camera.track?.objectId ? [camera.track.objectId] : []))];
  const refined = coverage.filter(camera => ids.includes(camera.id)).map(camera => clearCoverageCamera(camera, /过肩|全景|双人/.test(camera.name) ? subjects : camera.track?.objectId ? [camera.track.objectId] : [], subjects));
  if (!refined.length) return;
  const walls = addWildWalls(document, coverage.map(camera => refined.find(item => item.id === camera.id) ?? camera));
  const moved = refined.some(camera => camera !== cameras.find(item => item.id === camera.id));
  if (!moved && walls.document === document) return;
  commit({ ...walls.document, cameras: cameras.map(camera => refined.find(item => item.id === camera.id) ?? camera) }, false);
}
/**
 * ACT: Agent导演工具stageShots摆的“镜头·”机位也是纯数据算的：落地后每段镜头按真实模型查视线，被墙、柱子、别人挡住就绕主体转±25°/±50°/±80°，
 * 还挡就往主体跟前收（过肩只往前收、不转，转了就不是过肩）；轨迹一起平移。并进上一步撤销。
 */
function refineStageShots(ids: readonly string[]) {
  if (!viewport) return;
  const document = props.modelValue;
  const people = document.objects.filter(object => /person/i.test(object.asset.shape ?? "")).map(object => object.id);
  let changed = false;
  const cameras = (document.cameras ?? []).map(camera => {
    if (!ids.includes(camera.id) || !camera.shots?.length) return camera;
    const shoulder = camera.name.includes("过肩");
    return { ...camera, shots: camera.shots.map(shot => {
      const subject = (shot.track ?? camera.track)?.objectId;
      const ignore = shoulder ? people : subject ? [subject] : [];
      const { position, target } = shot.frame;
      if (viewport!.sightBlocked(target, position, ignore) === undefined) return shot;
      const dx = position.x - target.x, dz = position.z - target.z;
      for (const scale of shoulder ? [0.85, 0.7, 0.55] : [1, 0.75, 0.55]) for (const degrees of shoulder ? [0] : [25, -25, 50, -50, 80, -80]) {
        const a = degrees * Math.PI / 180;
        const next = { x: Math.round((target.x + (dx * Math.cos(a) + dz * Math.sin(a)) * scale) * 100) / 100, y: position.y, z: Math.round((target.z + (-dx * Math.sin(a) + dz * Math.cos(a)) * scale) * 100) / 100 };
        if (viewport!.sightBlocked(target, next, ignore) !== undefined) continue;
        changed = true;
        const shift = { x: next.x - position.x, z: next.z - position.z };
        return { ...shot, frame: { ...shot.frame, position: next }, ...(shot.path ? { path: shot.path.map(point => ({ ...point, x: point.x + shift.x, z: point.z + shift.z })) } : {}) };
      }
      return shot;
    }) };
  });
  if (changed) commit({ ...document, cameras }, false);
}
/** 点是否落在三壁内景、影棚布景（整块布景素材）的占地里。 */
function setFootprintTest(objects: readonly SceneObject[]) {
  const sets = objects.flatMap(object => { const print = object.visible && /三壁|布景·/.test(object.asset.name) ? measureAssetFootprint(object.asset) : undefined; return print ? [rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z)] : []; });
  return (point: { x: number; z: number }) => sets.some(rect => rectsOverlap(rect, { x: point.x, z: point.z, hw: 0.05, hd: 0.05, angle: 0 }));
}
/**
 * 活动墙：三壁内景里朝敞开那面拍的反打、近景，主体身后是空地和天。像影棚一样在主体身后推一块活动墙（单面背景板，正面朝镜头）：
 * 景里朝外拍的镜头看得到它；景外往里拍的全景看到的是背面，不显示也不挡视线。每次分镜按新机位重新生成，手动放的活动墙不动。
 */
const wildWallName = "活动墙·分镜";
function addWildWalls(document: SceneDocument, cameras: readonly SceneCamera[]): { document: SceneDocument; count: number } {
  const old = document.objects.filter(object => object.asset.shape === "backdrop" && object.name === wildWallName);
  const kept = old.length ? document.objects.filter(object => !old.includes(object)) : document.objects;
  const asset = builtinAssets.find(item => item.id === "backdrop");
  if (!viewport || !asset) return { document: old.length ? { ...document, objects: kept } : document, count: 0 };
  const people = kept.filter(object => /person/i.test(object.asset.shape ?? ""));
  const ignore = [...people.map(object => object.id), ...old.map(object => object.id)];
  // 墙不能切到人：站着的人现在的位置，加上所有人动线上的点（走过去会穿墙）。
  const standing = [...people.map(object => viewport!.getSubjectPosition({ objectId: object.id, mode: "aim" }) ?? object.position), ...[...getRouteAxes(document).values()].flat()];
  // 只在三壁内景、影棚布景的占地里补（街道两边有楼、顺着街看出去也是“空”，不能在街上立墙）。
  const insideSet = setFootprintTest(kept);
  const walls: { x: number; z: number; ux: number; uz: number; color?: string }[] = [];
  for (const camera of cameras) {
    // 跟拍走动的人不补（人走开了墙还在原地）。
    if (camera.name.includes("全景") || !camera.track?.objectId || camera.track.mode === "follow") continue;
    const { position, target } = camera.frame;
    const dx = target.x - position.x, dz = target.z - position.z, length = Math.hypot(dx, dz);
    if (length < 0.3 || !insideSet(target)) continue;
    const ux = dx / length, uz = dz / length;
    // 沿视线水平往主体身后打20米什么都没碰到，才是对着敞开面。
    if (viewport.sightBlocked(target, { x: target.x + ux * 20, y: target.y, z: target.z + uz * 20 }, ignore) !== undefined) continue;
    // 只给三壁内景补：主体背后（机位那边）7米内有墙、左右至少一边有墙，只有前面敞开；街上、野外看远处的空不算。
    const wallWithin = (x: number, z: number) => viewport!.sightBlocked(target, { x: target.x + x * 7, y: target.y, z: target.z + z * 7 }, ignore) !== undefined;
    if (!wallWithin(-ux, -uz) || !wallWithin(uz, -ux) && !wallWithin(-uz, ux)) continue;
    // 墙离主体1.6到3.6米，挑一个不切到人的位置（墙宽6米）。
    const distance = [2.4, 2, 2.8, 1.6, 3.2, 3.6].find(step => !standing.some(point => {
      const along = (point.x - target.x) * ux + (point.z - target.z) * uz, across = Math.abs((point.x - target.x) * uz - (point.z - target.z) * ux);
      return Math.abs(along - step) < 0.4 && across < 3.2;
    }));
    if (distance === undefined) continue;
    const at = { x: target.x + ux * distance, z: target.z + uz * distance };
    if (walls.some(wall => Math.hypot(wall.x - at.x, wall.z - at.z) < 2 && wall.ux * ux + wall.uz * uz > 0.8)) continue;
    // 颜色接布景：取主体左右最近那面墙在胸口高度的颜色，反打里看着是同一间屋子。
    const sides = [[uz, -ux], [-uz, ux]] as const;
    const color = sides.map(([x, z]) => viewport!.surfaceColorAt({ x: target.x, y: target.y - 0.2, z: target.z }, { x: target.x + x * 7, y: target.y - 0.2, z: target.z + z * 7 }, ignore)).find(Boolean);
    walls.push({ x: at.x, z: at.z, ux, uz, color });
  }
  const added = walls.map(wall => {
    const object = createSceneObject(asset, { x: Math.round(wall.x * 100) / 100, y: getTerrainHeight(document.terrain, wall.x, wall.z), z: Math.round(wall.z * 100) / 100 });
    object.name = wildWallName;
    object.rotation = { x: 0, y: Math.round(Math.atan2(-wall.ux, -wall.uz) * 180 / Math.PI), z: 0 };
    object.color = wall.color ?? "#8c8378";
    return object;
  });
  if (!added.length && !old.length) return { document, count: 0 };
  return { document: { ...document, objects: [...kept, ...added] }, count: added.length };
}
// ACT: 成片按镜号合并后的镜头段（镜头表、导出到画布共用）；没有镜头段时提示并返回undefined。
function programShots() {
  if (!viewport) return;
  const cameras = (props.modelValue.cameras ?? []).filter(camera => camera.enabled !== false);
  const range = viewport.getFilmRange();
  if (!range || !cameras.some(camera => camera.shots?.length)) { fail(new Error("还没有镜头段：先点“分镜”或“机位”排好镜头再导出")); return; }
  const program = getProgramSegments(cameras, range.end - range.start);
  const numbers = numberProgramSegments(cameras, program);
  const segments = program.reduce<{ start: number; end: number; cameraId: string }[]>((list, segment, index) => {
    const last = list.at(-1);
    if (last && numbers[index] === numbers[index - 1]) last.end = segment.end;
    else list.push({ start: segment.start, end: segment.end, cameraId: segment.cameraId });
    return list;
  }, []).slice(0, 120);
  if (!segments.length) { fail(new Error("成片里没有镜头段，先排好镜头再导出")); return; }
  return { cameras, range, segments };
}
/** 定位到这一镜的中间时刻，按这台机位此刻的真实画面（含跟拍）截图，并算出入画人物。批量导出时（settle=false）不等主循环跑帧（批量期间主循环本来就停着），只让出一下主线程。 */
async function captureProgramShot(index: number, segment: { start: number; end: number; cameraId: string }, cameras: SceneCamera[], rangeStart: number, width: number, settle = true) {
  const middle = (segment.start + segment.end) / 2;
  viewport!.seekPerformance(rangeStart + middle, "start");
  viewport!.seekPerformance(rangeStart + middle, "end");
  await viewport!.whenReady();
  await (settle ? new Promise(resolve => setTimeout(resolve, 120)) : yieldToBrowser());
  const camera = cameras.find(item => item.id === segment.cameraId)!;
  const shot = getCameraShotAt(camera, middle);
  const pose = viewport!.getCameraPose(camera.id) ?? shot?.frame ?? camera.frame;
  const tracked = (shot?.track ?? camera.track)?.objectId;
  // 入画人物按此刻的真实位置（走动中的人取演绎位置）算，脸部约1.5米高。
  const people = props.modelValue.objects.filter(object => object.visible && /person/i.test(object.asset.shape ?? "")).map(object => { const at = viewport!.getSubjectPosition({ objectId: object.id, mode: "aim" }) ?? { ...object.position, y: object.position.y + 1.5 }; return { id: object.id, name: object.name, at }; });
  const leads = new Set([...props.modelValue.objects.filter(object => object.asset.shape === "riggedPerson").map(object => object.id), ...cameras.flatMap(item => [item.track?.objectId, ...(item.shots ?? []).map(entry => entry.track?.objectId)]).filter((id): id is string => !!id)]);
  const blob = await viewport!.capture(pose, width, "image/jpeg");
  // 现场架机参数：机位离地高度（减去脚下地形）、到跟拍主体（没有就是注视点）的水平距离。
  const subjectAt = tracked ? viewport!.getSubjectPosition({ objectId: tracked, mode: "aim" }) ?? pose.target : pose.target;
  const cameraHeight = Math.round((pose.position.y - getTerrainHeight(props.modelValue.terrain, pose.position.x, pose.position.z)) * 10) / 10;
  const subjectDistance = Math.round(Math.hypot(subjectAt.x - pose.position.x, subjectAt.z - pose.position.z) * 10) / 10;
  const row: ShotListRow = { index: index + 1, camera, shot, start: segment.start, end: segment.end, focalLength: pose.focalLength, angle: describeCameraAngle(pose), cameraHeight, subjectDistance, subject: props.modelValue.objects.find(object => object.id === tracked)?.name, cast: castInFrame(pose, people, leads) };
  return { row, blob, pose, subjectAt };
}
// ACT: 勾选式导出（右上角导出面板、外部总Agent的editorExport共用）：每镜的分镜图、场景四视图、白模视频，整场的场景微缩图、分镜脚本、预演小样、镜头表、剪辑表，一次导出。
// 画布里图片、视频、脚本按镜分行建成节点（镜头表、剪辑表照常下载）；独立打开或点“下载”时打成一个ZIP（只有一个文件就直接下载）。
// 视频每帧只渲染一次：白模片段拿干净画面，预演小样叠字幕（exportRender.ts）。
// 不卡：整次导出用视口的批量截图（每张截完不重画编辑器视口），每约30毫秒让出一次主线程；视口上盖一张进度卡（正在导出的画面、进度条、剩余时间、停止）。
const previsMaxSeconds = 600;
// 分好镜还没导出过时，导出按钮呼吸提示；导出任何一种后停止。
const exportHint = ref(false);
const exporting = ref(false);
let exportController: AbortController | undefined;
function cancelExport() { exportController?.abort(new DOMException("已取消导出", "AbortError")); }
const exportProgress = shallowRef<ExportProgress>();
const exportPercent = computed(() => exportProgress.value ? Math.min(99, Math.floor(exportProgress.value.done / Math.max(1, exportProgress.value.total) * 100)) : 0);
const exportEtaText = computed(() => exportProgress.value ? exportEta(exportProgress.value) : "");
const exportPreview = ref<HTMLCanvasElement>();
const exportPreviewSize = shallowRef({ width: 288, height: 162 });
let exportState: ExportProgress | undefined, exportShownAt = 0, exportPreviewAt = 0;
/** 记一步进度：工作量按耗时估（一帧视频≈1），界面每120毫秒刷新一次，不随每帧重绘。 */
function advanceExport(phase: string, units = 1) {
  if (!exportState) return;
  exportState.done = Math.min(exportState.total, exportState.done + units);
  exportState.phase = phase;
  const now = performance.now();
  if (now - exportShownAt < 120) return;
  exportShownAt = now;
  exportProgress.value = { ...exportState };
  busy.value = t`导出 ${exportPercent.value}%`;
}
/** 进度卡上的缩略图：正在导出的这一帧（每250毫秒最多画一次）。 */
function showExportPreview(source: HTMLCanvasElement | Blob) {
  const now = performance.now();
  if (now - exportPreviewAt < 250) return;
  exportPreviewAt = now;
  const target = exportPreview.value, context = target?.getContext("2d");
  if (!target || !context) return;
  const draw = (image: HTMLCanvasElement | ImageBitmap) => {
    const scale = Math.min(target.width / image.width, target.height / image.height), width = image.width * scale, height = image.height * scale;
    context.fillStyle = "#000"; context.fillRect(0, 0, target.width, target.height);
    context.drawImage(image, (target.width - width) / 2, (target.height - height) / 2, width, height);
  };
  if (source instanceof Blob) void createImageBitmap(source).then(bitmap => { draw(bitmap); bitmap.close(); }, () => {});
  else draw(source);
}
function exportStamp(date = new Date()) { return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`; }
function blobToDataUrl(blob: Blob) { return new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); }); }
/** 镜头标签：“第N镜 · 景别·角度 · 台词”，图片节点名、分镜总览格子下的字用。 */
function shotLabel(row: ShotListRow) { return [`第${row.index}镜`, describeShotSize(row.camera, row.focalLength) + (row.angle && row.angle !== "平视" ? "·" + row.angle : ""), row.shot?.note].filter(Boolean).join(" · ").slice(0, 80); }
/** 分镜脚本：逐镜的景别、角度、焦段、时间、画面描述（提示词）和台词，建成文本节点可连到出图、出视频节点。 */
function storyboardScript(rows: ShotListRow[]) {
  const { label: sceneLabel } = sceneInfo();
  const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
  return [`# 分镜脚本（${sceneLabel} · 画幅${filmFormat.value} · ${rows.length} 个镜头）`, ...rows.map(row => [
    `## 第${row.index}镜 · ${describeShotSize(row.camera, row.focalLength)} · ${row.angle ?? "平视"} · ${Math.round(row.focalLength)}mm · ${clock(row.start)}–${clock(row.end)}${row.cameraHeight !== undefined ? ` · 机位高${row.cameraHeight.toFixed(1)}米` : ""}${row.subjectDistance !== undefined ? ` · 距主体${row.subjectDistance.toFixed(1)}米` : ""}`,
    `画面：${describeShotPrompt({ ...row, shot: row.shot && { ...row.shot, note: undefined } }, sceneLabel)}`,
    ...(row.shot?.note ? [`台词/动作：${row.shot.note}`] : []),
  ].join("\n"))].join("\n\n");
}
/** 分镜总览：所有镜头拼成一张三列小图（每格下方写镜号·景别·台词），审片一眼看完，也能整张喂给多图参考的模型。 */
async function contactSheet(frames: { label: string; file: Blob }[]) {
  const columns = 3, cell = filmAspect >= 1 ? { width: 480, height: Math.round(480 / filmAspect) } : { width: Math.round(360 * filmAspect), height: 360 }, caption = 44, gap = 8;
  const rowsCount = Math.ceil(frames.length / columns);
  const sheet = Object.assign(window.document.createElement("canvas"), { width: columns * cell.width + (columns + 1) * gap, height: rowsCount * (cell.height + caption) + (rowsCount + 1) * gap });
  const context = sheet.getContext("2d")!;
  context.fillStyle = "#111"; context.fillRect(0, 0, sheet.width, sheet.height);
  for (const [index, frame] of frames.entries()) {
    const image = await createImageBitmap(frame.file);
    const x = gap + (index % columns) * (cell.width + gap), y = gap + Math.floor(index / columns) * (cell.height + caption + gap);
    context.drawImage(image, x, y, cell.width, cell.height);
    image.close();
    context.fillStyle = "#fff"; context.font = "600 15px system-ui, \"Microsoft YaHei\", sans-serif"; context.textBaseline = "top";
    let text = frame.label;
    while (context.measureText(text).width > cell.width - 8 && text.length > 4) text = text.slice(0, -2) + "…";
    context.fillText(text, x + 4, y + cell.height + 8);
  }
  return encodeCanvas(sheet, "image/jpeg", 0.85);
}
type ExportDestination = "canvas" | "assets" | "files";
async function runExport(items: readonly ExportItem[], destination: ExportDestination, longEdge = 1280): Promise<{ nodes?: number; fileCount: number } | undefined> {
  if (locked.value || !viewport) return;
  exportHint.value = false;
  const pick = new Set(items);
  if (!pick.size) { fail(new Error("先勾选要导出的内容")); return; }
  const target = destination === "canvas" ? props.exportCanvas : undefined;
  const plan = programShots();
  if (!plan) return;
  const { cameras, range, segments } = plan;
  const duration = range.end - range.start;
  const videos = pick.has("clips") || pick.has("previs");
  if (videos && duration > previsMaxSeconds) { fail(new Error(`成片 ${Math.round(duration)} 秒，视频一次最多导出 ${previsMaxSeconds / 60} 分钟，请先缩短演绎时长`)); return; }
  // 存素材库：渲染前先选好位置和名称（默认同ZIP名），取消就不导出，免得渲染完才问。
  let assetFolder = `分镜包${fileSceneName()}-${exportStamp()}`;
  if (destination === "assets" && props.chooseAssetFolder) {
    const chosen = await props.chooseAssetFolder(assetFolder);
    if (!chosen || disposed || locked.value || !viewport) return;
    assetFolder = chosen;
  }
  const width = longEdge === 1920 ? 1920 : 1280;
  const view = viewport;
  const original = view.getWorldSeconds();
  const controller = exportController = new AbortController();
  const signal = AbortSignal.any([operationController.signal, controller.signal]);
  // 工作量（按实测耗时估，一帧视频≈1）：微缩图4；每镜定位加关键帧3、四视图每张2、镜头表小图1.5；视频每帧1；交付每个文件0.5。
  const shotPass = pick.has("frames") || pick.has("views") || pick.has("script") || pick.has("shotList");
  const outputCount = (pick.has("overview") ? 1 : 0) + (pick.has("frames") ? segments.length + 1 : 0) + (pick.has("views") ? segments.length : 0) + (pick.has("clips") ? segments.length : 0) + ["script", "previs", "shotList", "edl"].filter(key => pick.has(key as ExportItem)).length;
  const total = (pick.has("overview") ? 4 : 0) + (shotPass ? segments.length * (3 + (pick.has("views") ? 8 : 0) + (pick.has("shotList") ? 1.5 : 0)) : 0) + (videos ? countVideoFrames(plan, pick.has("previs")) : 0) + outputCount * 0.5;
  exportState = { phase: "准备", done: 0, total, startedAt: performance.now() };
  exportProgress.value = { ...exportState };
  const fit = Math.min(288 / filmAspect, 162);
  exportPreviewSize.value = { width: Math.round(fit * filmAspect), height: Math.round(fit) };
  exportPreviewAt = 0;
  const slice = createYielder(30);
  exporting.value = true;
  busy.value = translate("导出 0%");
  try {
    // 画布缺图片/视频节点插件时先报，别等整段渲染完才发现建不了节点。
    target?.check({ image: pick.has("overview") || pick.has("frames") || pick.has("views"), video: videos });
    // 按成片画幅出片：长边1280或1920（横屏1280×720、宽银幕1280×536、竖屏720×1280）。
    setFilmFormat(filmFormat.value);
    const date = new Date(), stamp = exportStamp(date), sceneName = fileSceneName(), info = sceneInfo();
    // 先让进度卡画出来再开始截图。
    await nextTick(); await yieldToBrowser();
    view.beginCaptureBatch();
    let overview: Blob | undefined;
    if (pick.has("overview")) {
      advanceExport("场景微缩图", 0);
      overview = await captureOverview(view, props.modelValue, plan, width);
      if (overview) showExportPreview(overview);
      advanceExport("场景微缩图", 4);
      await slice();
    }
    // 逐镜定位到镜头中间：关键帧、四视图、镜头表小图都在这一刻拍。
    const shots: { row: ShotListRow; frame?: Blob; views?: Blob }[] = [];
    if (shotPass) {
      for (const [index, segment] of segments.entries()) {
        signal.throwIfAborted();
        const at = t`第${index + 1}/${segments.length}镜`;
        advanceExport(t`${at} · 分镜图`, 0);
        const { row, blob, pose, subjectAt } = await captureProgramShot(index, segment, cameras, range.start, width, false);
        showExportPreview(blob);
        advanceExport(t`${at} · 分镜图`, 3);
        const shot: (typeof shots)[number] = { row, ...(pick.has("frames") ? { frame: blob } : {}) };
        if (pick.has("views")) {
          shot.views = await captureFourViews(view, props.modelValue, pose, subjectAt, width, { signal, step: async () => { advanceExport(t`${at} · 四视图`, 2); await slice(); } });
          showExportPreview(shot.views);
        }
        if (pick.has("shotList")) { row.image = await blobToDataUrl(await view.capture(pose, 640, "image/jpeg")); advanceExport(t`${at} · 镜头表`, 1.5); }
        shots.push(shot);
        await slice();
      }
    }
    let previs: File | undefined;
    const clips: File[] = [];
    if (videos) {
      const kind = pick.has("clips") ? "白模视频" : "预演小样";
      const rendered = await renderProgramVideos(view, plan, {
        longEdge: width, previs: pick.has("previs"), clips: pick.has("clips"), signal,
        slate: { title: info.label, detail: `画幅 ${filmFormat.value} · ${segments.length} 个镜头 · ${Math.round(duration)} 秒` },
        step: async (frame, shotIndex) => {
          showExportPreview(frame);
          advanceExport(shotIndex >= 0 ? t`第${shotIndex + 1}/${segments.length}镜 · ${translate(kind)}` : "预演小样 · 黑场");
          await slice();
        },
      });
      if (rendered.previs) { previs = new File([rendered.previs.blob], `预演小样${sceneName}-${stamp}.${rendered.previs.extension}`, { type: rendered.previs.mimeType }); lastPrevisFile = previs.name; }
      for (const { index, video } of rendered.clips) clips[index] = new File([video.blob], `第${index + 1}镜-白模视频.${video.extension}`, { type: video.mimeType });
    }
    view.endCaptureBatch();
    view.seekPerformance(original, "start"); view.seekPerformance(original, "end");
    const rows = shots.map(shot => shot.row);
    const script = pick.has("script") && rows.length ? storyboardScript(rows) : undefined;
    const framed = shots.filter(shot => shot.frame);
    if (framed.length > 1) advanceExport("拼分镜总览", 0);
    const sheet = framed.length > 1 ? await contactSheet(framed.map(shot => ({ label: shotLabel(shot.row), file: shot.frame! }))) : undefined;
    const shotList = pick.has("shotList") ? createShotListFile(rows, cameras, date, stamp) : undefined;
    const edl = pick.has("edl") ? createEdlFile(plan, stamp) : undefined;
    const issues = programIssues();
    if (target) {
      advanceExport("在画布上建节点", 0);
      const jpeg = (blob: Blob, name: string) => new File([blob], name, { type: "image/jpeg" });
      const nodes = await target.deliver({
        ...(overview ? { overview: { file: jpeg(overview, "场景微缩图.jpg"), label: `场景微缩图 · ${info.label}` } } : {}),
        ...(sheet ? { sheet: { file: jpeg(sheet, "分镜总览.jpg"), label: `分镜总览 · ${segments.length} 个镜头` } } : {}),
        ...(script ? { script } : {}),
        ...(previs ? { previs: { file: previs, label: `预演小样${sceneName.replace("-", " · ")} · ${segments.length} 个镜头 · ${Math.round(duration)} 秒` } } : {}),
        shots: segments.map((segment, index) => {
          const shot = shots[index], clip = clips[index];
          return {
            ...(shot?.frame ? { frame: { file: jpeg(shot.frame, `第${index + 1}镜.jpg`), label: shotLabel(shot.row) } } : {}),
            ...(shot?.views ? { views: { file: jpeg(shot.views, `第${index + 1}镜-四视图.jpg`), label: `第${index + 1}镜 · 四视图` } } : {}),
            ...(clip ? { clip: { file: clip, label: `第${index + 1}镜 · 白模视频 · ${(segment.end - segment.start).toFixed(1)}秒` } } : {}),
          };
        }).filter(shot => shot.frame || shot.views || shot.clip),
      }, signal, () => advanceExport("在画布上建节点", 0.5));
      for (const file of [shotList, edl]) if (file) deliverFile(file);
      const downloaded = [shotList && translate("镜头表"), edl && translate("剪辑表")].filter(Boolean).join(translate("、"));
      notice.value = t`已在画布上建了 ${nodes} 个节点${downloaded ? (fileSink ? t`，${downloaded}已存进工作区` : t`，${downloaded}已下载`) : ""}${issues}`;
      return { nodes, fileCount: [shotList, edl].filter(Boolean).length };
    }
    // 打包：整场的放最外层，每镜一个文件夹（第01镜/分镜图.jpg、四视图.jpg、白模视频.mp4）。
    const pad = (value: number) => String(value).padStart(segments.length >= 100 ? 3 : 2, "0");
    const entries: { path: string; file: File }[] = [
      ...(overview ? [{ path: "场景微缩图.jpg", file: new File([overview], `场景微缩图${sceneName}.jpg`, { type: "image/jpeg" }) }] : []),
      ...(sheet ? [{ path: "分镜总览.jpg", file: new File([sheet], `分镜总览${sceneName}.jpg`, { type: "image/jpeg" }) }] : []),
      ...(script ? [{ path: "分镜脚本.md", file: new File([script], `分镜脚本${sceneName}.md`, { type: "text/markdown" }) }] : []),
      ...(previs ? [{ path: previs.name, file: previs }] : []),
      ...(shotList ? [{ path: shotList.name, file: shotList }] : []),
      ...(edl ? [{ path: edl.name, file: edl }] : []),
      ...segments.flatMap((_, index) => {
        const folder = `第${pad(index + 1)}镜`, shot = shots[index], clip = clips[index];
        return [
          ...(shot?.frame ? [{ path: `${folder}/分镜图.jpg`, file: new File([shot.frame], `${folder}-分镜图.jpg`, { type: "image/jpeg" }) }] : []),
          ...(shot?.views ? [{ path: `${folder}/四视图.jpg`, file: new File([shot.views], `${folder}-四视图.jpg`, { type: "image/jpeg" }) }] : []),
          ...(clip ? [{ path: `${folder}/白模视频.${clip.name.split(".").pop()}`, file: new File([clip], `${folder}-白模视频.${clip.name.split(".").pop()}`, { type: clip.type }) }] : []),
        ];
      }),
    ];
    if (!entries.length) throw new Error("没有可导出的内容");
    const megabytes = (entries.reduce((sum, entry) => sum + entry.file.size, 0) / 1048576).toFixed(1);
    const edlNote = edl && !lastPrevisFile ? translate("（剪辑表对应的预演小样还没导出过：一起勾上预演小样）") : "";
    // 白模预演：按打包的目录结构存进全局素材库里选好的文件夹。
    if (destination === "assets" && props.exportAssets) {
      advanceExport("存进素材库", 0);
      const folder = await props.exportAssets(assetFolder, entries, signal);
      notice.value = t`已存进素材库“${folder}”：${segments.length} 个镜头 · ${entries.length} 个文件 · ${megabytes} MB${edlNote}${issues}`;
      return { fileCount: entries.length };
    }
    // 外部总Agent：每个文件单独存进工作区；只有一个文件直接下载；多个打成ZIP。
    if (fileSink) for (const entry of entries) deliverFile(entry.file);
    else if (entries.length === 1) deliverFile(entries[0]!.file);
    else { advanceExport("打包", 0); deliverFile(new File([await createZip(entries, date, () => advanceExport("打包", 0.5))], `分镜包${sceneName}-${stamp}.zip`, { type: "application/zip" })); }
    notice.value = entries.length === 1 ? t`已导出 ${entries[0]!.file.name} · ${megabytes} MB${edlNote}${issues}` : fileSink ? t`已导出 ${segments.length} 个镜头 · ${entries.length} 个文件 · ${megabytes} MB${edlNote}${issues}` : t`已导出 ${segments.length} 个镜头 · ${entries.length} 个文件（ZIP） · ${megabytes} MB${edlNote}${issues}`;
    return { fileCount: entries.length };
  } catch (error) { if (!disposed) fail(error); return undefined; }
  finally {
    exporting.value = false;
    exportState = undefined; exportProgress.value = undefined;
    if (exportController === controller) exportController = undefined;
    if (!disposed) { view.endCaptureBatch(); view.seekPerformance(original, "start"); view.seekPerformance(original, "end"); busy.value = ""; }
  }
}
// ACT: 场景信息（场记、通告、画面描述用）：日/夜按世界时间，内/外按场景里有没有围起来的墙或整块内景，天气按当前天气层；label 是成套景名＋日夜内外天气。
/** ACT: 导出后的检查提示：越轴的镜号、台词说不完的镜号、成片里没有镜头覆盖的黑场时段；没有问题返回空。 */
function programIssues() {
  const cuts = programCuts.value;
  const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(1).padStart(4, "0")}`;
  const axis = cuts.filter(cut => cut.crossesAxis).map(cut => cut.number);
  const cameras = props.modelValue.cameras ?? [];
  // 一刀里可能有好几段镜头（反应段接台词段），每段都查。
  const long = [...new Set(cuts.filter(cut => (cameras.find(camera => camera.id === cut.cameraId)?.shots ?? []).some(shot => shot.end > cut.start + 0.001 && shot.start < cut.end - 0.001 && lineOverrun({ start: shot.start, end: shot.end, shot }))).map(cut => cut.number))];
  const gaps = cuts.slice(1).flatMap((cut, index) => cut.start - cuts[index]!.end > 0.3 ? [`${clock(cuts[index]!.end)}–${clock(cut.start)}`] : []);
  const parts = [axis.length ? t`第${[...new Set(axis)].join(translate("、"))}镜越轴` : "", long.length ? t`第${long.join(translate("、"))}镜台词说不完` : "", gaps.length ? t`黑场 ${gaps.slice(0, 3).join(translate("、"))}` : ""].filter(Boolean);
  return parts.length ? t`；检查：${parts.join(translate("；"))}` : "";
}
/** 导出文件名里的场景名：第一个成套景（模板集合）的名字，只留文字和数字，前面带“-”；没有就空。 */
// 最近一次导出的预演小样文件名：剪辑表里的片段名对上它，剪辑软件导入时自动关联。
let lastPrevisFile = "";
/** ACT: 剪辑表（EDL）：成片每个镜头一条剪辑事件，源素材是预演小样，镜号景别机位写成标记、台词写进注释。 */
function createEdlFile({ cameras, segments }: ProgramPlan, stamp: string) {
  const events = segments.map((segment, index) => {
    const camera = cameras.find(item => item.id === segment.cameraId)!;
    const shot = getCameraShotAt(camera, (segment.start + segment.end) / 2);
    const focal = shot?.frame?.focalLength ?? camera.frame.focalLength;
    return { start: segment.start, end: segment.end, label: `第${index + 1}镜 ${describeShotSize(camera, focal)} ${Math.round(focal)}mm ${camera.name.replace(/^分镜·/, "")}`, note: shot?.note };
  });
  const clip = lastPrevisFile || `预演小样${fileSceneName()}.mp4`;
  return new File([createEdl(sceneInfo().label, clip, events, previsFps)], `剪辑表${fileSceneName()}-${stamp}.edl`, { type: "text/plain" });
}
function fileSceneName() {
  const name = (props.modelValue.objectGroups?.[0]?.name ?? "").replace(/[^\p{L}\p{N}]/gu, "").slice(0, 20);
  return name ? `-${name}` : "";
}
function sceneInfo() {
  const hour = props.modelValue.time?.hour ?? worldTime.value.hour;
  const daypart = hour < 5 || hour >= 19.5 ? "夜" : hour < 7 ? "晨" : hour >= 17.5 ? "昏" : "日";
  const interior = props.modelValue.objects.filter(object => object.visible && object.asset.id.startsWith("brushWall")).length >= 3 || props.modelValue.objects.some(object => object.visible && /内景|布景·|轿厢/.test(object.asset.name)) ? "内" : "外";
  const layers: Partial<Record<WeatherLayerKey, number>> = props.modelValue.weather?.layers ?? {};
  const weatherName = (layers.rain ?? 0) > 0.2 ? "雨" : (layers.snow ?? 0) > 0.2 ? "雪" : (layers.fog ?? 0) > 0.3 ? "雾" : (layers.clouds ?? 0) > 0.5 ? "阴" : "晴";
  const label = [...(props.modelValue.objectGroups ?? []).map(group => group.name).slice(0, 2), `${daypart}·${interior === "内" ? "内景" : "外景"}·${weatherName}`].join("，");
  return { daypart, interior, weatherName, label };
}
// ACT: 镜头表：逐镜截图（rows里已经带好640宽小图）、景别、入画人物、台词，越轴标记，置景与人物清单，机位平面图，生成自包含HTML。
function createShotListFile(rows: ShotListRow[], cameras: SceneCamera[], date: Date, stamp: string) {
  // 越轴：和时间轴成片行同一套判断。
  const crossings = new Set(findAxisCrossings(props.modelValue.objects, cameras, rows.map(row => ({ number: row.index, cameraId: row.camera.id, start: row.start, end: row.end })), getRouteAxes(props.modelValue), (id, time) => stagePoseAt(props.modelValue, id, time)?.at));
  for (const row of rows) if (crossings.has(row.index)) row.crossesAxis = true;
  // 置景与人物清单：按素材汇总；群演（胶囊人）、演员（骨骼人物）、墙体和铺装单独归类，给美术、制片备景备人。
  const inventory = new Map<string, InventoryRow>();
  for (const object of props.modelValue.objects.filter(object => object.visible)) {
    const asset = object.asset;
    const kind = asset.shape === "person" || asset.shape === "seatedPerson" || asset.shape === "kneelingPerson" ? "群演" : asset.shape === "riggedPerson" ? "演员" : asset.id.startsWith("brushWall") ? "墙体" : asset.id.startsWith("brushPaving") ? "地面铺装" : getAssetItemType(asset) ?? asset.category ?? "其他";
    const name = asset.shape === "person" ? "群演（胶囊人）" : asset.shape === "seatedPerson" ? "群演（坐席）" : asset.shape === "kneelingPerson" ? "群演（跪坐）" : asset.shape === "riggedPerson" ? object.name : asset.name;
    const key = kind + "|" + name;
    const row = inventory.get(key) ?? { name, kind, count: 0 };
    row.count++;
    inventory.set(key, row);
  }
  const order = ["演员", "群演"];
  const items = [...inventory.values()].sort((a, b) => (order.indexOf(b.kind) - order.indexOf(a.kind)) || a.kind.localeCompare(b.kind, "zh") || b.count - a.count);
  const { daypart, interior, weatherName, label: sceneLabel } = sceneInfo();
  // 机位平面图：陈设按实测占地画灰块（地面铺装不画），主演（骨骼人物、被跟拍的人）红点，走位路线，机位和它负责的镜号。
  const leadIds = new Set([...props.modelValue.objects.filter(object => object.asset.shape === "riggedPerson").map(object => object.id), ...cameras.flatMap(camera => [camera.track?.objectId, ...(camera.shots ?? []).map(shot => shot.track?.objectId)]).filter((id): id is string => !!id)]);
  const planItems: PlanItem[] = props.modelValue.objects.filter(object => object.visible && !object.asset.id.startsWith("brushPaving")).flatMap<PlanItem>(object => {
    if (/person/i.test(object.asset.shape ?? "")) return [{ kind: leadIds.has(object.id) ? "lead" as const : "person" as const, name: object.name, x: object.position.x, z: object.position.z, width: 0.5, depth: 0.5, rotation: 0 }];
    const footprint = measureAssetFootprint(object.asset);
    return footprint ? [{ kind: "set" as const, name: object.name, x: object.position.x, z: object.position.z, width: footprint.width * object.scale.x, depth: footprint.depth * object.scale.z, rotation: object.rotation.y }] : [];
  });
  const planCameras: PlanCamera[] = cameras.flatMap(camera => {
    const numbers = rows.filter(row => row.camera.id === camera.id).map(row => row.index);
    if (!numbers.length) return [];
    const shot = rows.find(row => row.camera.id === camera.id)?.shot;
    const frame = shot?.frame ?? camera.frame;
    return [{ number: `第${numbers.join("、")}镜`, name: camera.name.replace(/^分镜·/, ""), x: frame.position.x, z: frame.position.z, tx: frame.target.x, tz: frame.target.z, focalLength: frame.focalLength, ...(shot?.path ? { path: shot.path.map(point => ({ x: point.x, z: point.z })) } : {}) }];
  });
  const planRoutes: PlanRoute[] = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups).flatMap(track => {
    const object = props.modelValue.objects.find(item => item.id === track.objectId);
    return object ? [{ lead: leadIds.has(object.id), points: [{ x: object.position.x, z: object.position.z }, ...track.points.map(point => ({ x: point[0]!, z: point[2]! }))] }] : [];
  });
  const html = createShotListHtml("预演镜头表", rows, `${daypart} · ${interior} · ${weatherName} · 画幅${filmFormat.value} · ${props.modelValue.objects.length} 件陈设与人物 · 导出于 ${date.toLocaleString()}`, items, createFloorPlanSvg(planItems, planCameras, planRoutes), sceneLabel);
  return new File([html], `镜头表${fileSceneName()}-${stamp}.html`, { type: "text/html" });
}
function selectCamera(id: string | null, shotId?: string) {
  if (locked.value) return;
  cancelCameraGesture(); cancelPerformanceRoute();
  if (!id) { clearCameraSelection(); return; }
  const camera = studioCameras.value.find(camera => camera.id === id);
  if (!camera) return;
  const shot = getCameraShot(camera, shotId);
  const changed = selectedCameraId.value !== id || selectedShotId.value !== (shot?.id ?? "");
  focusCamera(id, shot?.id ?? "");
  if (shot && changed && (filmTime.value < shot.start || filmTime.value >= shot.end)) seekFilm(shot.start);
}
function pickCamera(id: string | null) {
  if (!id) { clearCameraSelection(); return; }
  if (locked.value || id === selectedCameraId.value) return;
  selectCamera(id);
}
/** 用from→to这次调整整体改这台机位正在编辑的那段镜头（没有镜头段时改机位自身的画面）。 */
function reframeCamera(camera: SceneCamera, shotId: string, from: CameraFraming, to: CameraFraming) {
  if (!shotId) return changeCamera({ ...camera, frame: reframeCameraTake({ frame: camera.frame }, from, to).frame });
  return changeCamera(updateCameraTake(camera, shotId, take => reframeCameraTake(take, from, to)));
}
// 场景里拖机位标记：机位挪到哪，这段镜头整体跟着挪（轨迹一起平移），注视点不动。
function transformCamera(id: string, pose: { position: Vector3Value; target: Vector3Value }) {
  const camera = getStoredCamera(id);
  if (!camera) { applyCameraPose(); return; }
  const from = sampleSceneCamera(camera, currentFilmTime());
  if (!reframeCamera(camera, editShotId.value, from, { ...from, position: { ...pose.position }, target: { ...from.target } })) applyCameraPose();
}
// ACT: 划线：落在已选或播放头所在的镜头段上；还没有镜头段时从播放头起自动开一段，长度按轨迹长度约每秒2米估算，并夹进后面的空档。
function drawCameraPath(id: string, points: Vector3Value[]) {
  const camera = getStoredCamera(id);
  if (!camera || cameraLocked.value) return;
  let shotId = camera.id === monitorCamera.value?.id ? editShotId.value : getCameraShotAt(camera, filmTime.value)?.id ?? "";
  let next = camera;
  if (!shotId) {
    const start = roundTime(filmTime.value);
    const gap = getCameraGap(camera, start);
    const length = getPathLength(points);
    const end = gap ? roundTime(Math.min(gap.end, start + Math.min(12, Math.max(2, length / 2)))) : start;
    if (!gap || end - start < minShotSeconds) { notice.value = translate("播放头这里已经被别的镜头段占满，先在时间轴上框出一段时间"); return; }
    shotId = crypto.randomUUID();
    next = insertCameraShot(camera, { id: shotId, start, end, frame: toFraming(sampleSceneCamera(camera, start)), front: getTopShotFront(studioCameras.value) + 1 });
  }
  cameraPathDrawing.value = false;
  if (changeCamera(updateCameraTake(next, shotId, take => setCameraTakePath(take, points)))) focusCamera(id, shotId);
}
function removeCamera(id: string) {
  if (cameraLocked.value) return;
  cancelCameraGesture();
  commit({ ...props.modelValue, cameras: props.modelValue.cameras?.filter(camera => camera.id !== id) ?? [] });
  if (selectedCameraId.value === id) clearCameraSelection();
  if (!(props.modelValue.cameras?.length ?? 0) && filmPreview.value) setFilmPreview(false);
}
async function createCameraShot(id: string, start: number, end: number) {
  const camera = getStoredCamera(id);
  if (!camera || cameraLocked.value) return;
  cancelCameraGesture();
  // 新镜头段先沿用这一刻原本拍到的画面，再划轨迹或在取景窗里调。
  // 新镜头段排在最前：和别的机位重叠时成片先播它，可在成片行里改。
  const shot = { id: crypto.randomUUID(), start: roundTime(start), end: roundTime(end), frame: toFraming(sampleSceneCamera(camera, start)), front: getTopShotFront(studioCameras.value) + 1 };
  if (!changeCamera(insertCameraShot(camera, shot))) return;
  focusCamera(id, shot.id);
  // ACT: 定位播放头也会提交文档；等新镜头段先写进props，否则会用旧文档覆盖掉它。
  await nextTick();
  if (!disposed && selectedShotId.value === shot.id) seekFilm(shot.start);
}
// ACT: 一键拉长台词说不完的镜头：每个太短的镜头拉到台词需要的时长（多留0.2秒），它后面所有机位的镜头整体往后推同样的时长（波纹剪辑），台词动作跟着重排；一次提交。
function fixLineTiming() {
  if (cameraLocked.value) return;
  try {
    const scene = latestScene();
    const cameras = scene.cameras ?? [];
    const all = cameras.flatMap(camera => camera.shots ?? []);
    // 每个太短的镜头：拉到台词需要的时长；只有拉长后压到下一个镜头时才把后面整体推后（推压到的那部分），原来就有空档的不推。
    const longer = new Map<string, number>();
    const pushes = all.flatMap(shot => {
      const seconds = lineOverrun({ start: shot.start, end: shot.end, shot });
      if (!seconds) return [];
      const end = shot.start + seconds + 0.2;
      longer.set(shot.id, end);
      const nextStart = Math.min(Infinity, ...all.filter(other => other !== shot && other.start >= shot.end - 0.001).map(other => other.start));
      return [{ at: shot.end, delta: Number.isFinite(nextStart) ? Math.max(0, roundTime(end - nextStart)) : 0 }];
    }).sort((a, b) => a.at - b.at);
    if (!longer.size) return;
    const shiftAt = (time: number) => pushes.reduce((sum, push) => push.at <= time + 0.001 ? sum + push.delta : sum, 0);
    const next = cameras.map(camera => camera.shots?.length ? cameraTrackSchema.parse({ ...camera, shots: camera.shots.map(shot => { const start = roundTime(shot.start + shiftAt(shot.start)); const stretched = longer.get(shot.id); return { ...shot, start, end: stretched ? roundTime(stretched + shiftAt(shot.start)) : roundTime(shot.end + shiftAt(shot.end)) }; }) }) : camera);
    const talking = withTalkClips({ ...scene, cameras: next }, next.filter(camera => camera.name.startsWith("分镜·")));
    commit({ ...scene, cameras: next, ...(talking ?? {}) });
    const pushed = pushes.reduce((sum, push) => sum + push.delta, 0);
    notice.value = pushed > 0.05 ? t`拉长了 ${longer.size} 个镜头，后面的镜头整体往后推了 ${pushed.toFixed(1)} 秒` : t`拉长了 ${longer.size} 个镜头（后面原本有空档，不用推）`;
  } catch (error) { fail(error); }
}
function changeCameraShot(id: string, shotId: string, start: number, end: number) {
  const camera = getStoredCamera(id);
  if (!camera?.shots) return;
  const next = { ...camera, shots: camera.shots.map(shot => shot.id === shotId ? { ...shot, start: roundTime(start), end: roundTime(end) } : shot).sort((a, b) => a.start - b.start) };
  const scene = latestScene();
  // ACT: 拖动“分镜·”镜头段改了台词的起止时，台词动作（交谈、晃动）按新切点一起重排，说话的动作不和画面错开；同一次提交。
  if (!camera.name.startsWith("分镜·") || !(scene.life?.tracks ?? []).some(track => track.name?.startsWith("台词·"))) { changeCamera(next); return; }
  if (cameraLocked.value) return;
  try {
    const parsed = cameraTrackSchema.parse(next);
    const cameras = (scene.cameras ?? []).map(entry => entry.id === parsed.id ? parsed : entry);
    const talking = withTalkClips({ ...scene, cameras }, cameras.filter(entry => entry.name.startsWith("分镜·")));
    commit({ ...scene, cameras, ...(talking ?? {}) });
  } catch (error) { fail(error); }
}
function removeCameraShot(id: string, shotId: string) {
  const camera = getStoredCamera(id);
  if (!camera || cameraLocked.value) return;
  cancelCameraGesture();
  if (changeCamera(withoutCameraShot(camera, shotId)) && selectedShotId.value === shotId) selectedShotId.value = "";
}
// 取景窗里没有选中机位就动手时，自动接管当前成片机位。
function ensureCameraSelection() {
  if (cameraLocked.value) return undefined;
  if (selectedCamera.value) return selectedCamera.value;
  const camera = monitorCamera.value;
  if (!camera) return undefined;
  cancelPerformanceRoute();
  focusCamera(camera.id, getCameraShotAt(camera, filmTime.value)?.id ?? "");
  return camera;
}
function pausePlayback() {
  if (timelineRunning.value) commitPlayback({ ...(viewport?.getWorldTime() ?? worldTime.value), paused: true }, false);
}
function beginCameraGesture() {
  const camera = ensureCameraSelection();
  if (!camera) return;
  pausePlayback();
  const start = displayedFraming(camera);
  cameraGesture.value = { id: camera.id, shotId: editShotId.value, start, framing: start };
  applyCameraPose();
}
function moveCameraGesture(delta: ViewfinderDelta) {
  const gesture = cameraGesture.value;
  if (!gesture || gesture.committed) return;
  let framing = gesture.framing;
  if (delta.kind === "look") framing = lookCamera(framing, delta.yaw, delta.pitch);
  else if (delta.kind === "zoom") framing = zoomCamera(framing, delta.factor);
  else if (delta.kind === "fly") framing = flyCamera(framing, delta.forward, delta.right, delta.lift);
  else if (delta.kind === "roll") framing = rollCamera(framing, delta.degrees);
  else if (delta.kind === "truck") {
    // 平移量以画面高度为单位：在注视点那么远的地方，一个画面高度对应多少米。
    const height = 2 * getCameraBasis(framing).distance * Math.tan(getCameraFov(framing.focalLength) * Math.PI / 360);
    framing = moveCamera(framing, delta.right * height, delta.up * height);
  } else return;
  cameraGesture.value = { ...gesture, framing };
  applyCameraPose();
}
// ACT: 手一松就把这次调整整体写进这段镜头（轨迹、注视点、焦距一起挪），不用另按保存。
/** 选中关键点时，取景窗里的变焦、转向、翻滚改的是这个关键点。 */
function applyGestureToKey(gesture: NonNullable<typeof cameraGesture.value>) {
  const target = keyTarget();
  if (!target || target.camera.id !== gesture.id || target.shot.id !== gesture.shotId) return false;
  const { start, framing } = gesture;
  if (Math.hypot(start.position.x - framing.position.x, start.position.y - framing.position.y, start.position.z - framing.position.z) > 0.0001) return false;
  const angles = (value: CameraFraming) => { const basis = getCameraBasis(value); return { yaw: Math.atan2(basis.forward.x, -basis.forward.z) * 180 / Math.PI, pitch: Math.asin(Math.min(1, Math.max(-1, basis.forward.y))) * 180 / Math.PI }; };
  const before = angles(start), after = angles(framing);
  const wrap = (value: number) => ((value + 180) % 360 + 360) % 360 - 180;
  const key = target.key;
  return writeShotKeys(target.camera.id, target.shot.id, keys => keys.map(item => item.id !== key.id ? item : { ...item, ...roundKey({
    focal: Math.min(200, Math.max(12, key.focal * framing.focalLength / start.focalLength)),
    pan: key.pan + wrap(after.yaw - before.yaw),
    tilt: key.tilt + (after.pitch - before.pitch),
    roll: key.roll + wrap((framing.roll ?? 0) - (start.roll ?? 0)),
  }) }));
}
function finishCameraGesture() {
  const gesture = cameraGesture.value;
  if (!gesture || gesture.committed) return;
  if (!sameFraming(gesture.start, gesture.framing) && applyGestureToKey(gesture)) { cameraGesture.value = { ...gesture, committed: true }; return; }
  const camera = getStoredCamera(gesture.id);
  if (camera && !sameFraming(gesture.start, gesture.framing)) {
    cameraGesture.value = { ...gesture, committed: true };
    if (reframeCamera(camera, gesture.shotId, gesture.start, gesture.framing)) return;
  }
  cameraGesture.value = undefined;
  applyCameraPose();
}
function cancelCameraGesture() {
  if (!cameraGesture.value) return false;
  const active = !cameraGesture.value.committed;
  cameraGesture.value = undefined;
  applyCameraPose();
  return active;
}
function clearCameraPath() {
  const camera = ensureCameraSelection() && getStoredCamera(selectedCameraId.value);
  if (camera && editShotId.value) changeCamera(updateCameraTake(camera, editShotId.value, take => ({ ...take, path: undefined })));
}
function toggleCameraPathDrawing() {
  if (!ensureCameraSelection()) return;
  trackPicking.value = false;
  cameraPathDrawing.value = !cameraPathDrawing.value;
}
/**
 * ACT: 改跟踪：有正在编辑的镜头段时改这段镜头自己的跟踪，否则改机位的。
 * 第一次按镜头段改时，把机位上的旧跟踪分给各镜头段，之后每段各管各的（关掉一段不影响别的段）。
 */
function writeTracking(update: (track: CameraTracking | undefined) => CameraTracking | undefined, live = false) {
  const camera = getStoredCamera(selectedCameraId.value || monitorCamera.value?.id || "");
  if (!camera || cameraLocked.value) return false;
  const shotId = camera.id === monitorCamera.value?.id ? editShotId.value : "";
  if (!shotId) {
    const next = update(camera.track);
    const { track: _track, ...rest } = camera;
    return changeCameraLive(next ? { ...rest, track: next } : rest, live);
  }
  const { track: inherited, ...base } = camera;
  const shots = (camera.shots ?? []).map(shot => {
    const own = shot.track ?? inherited;
    const next = shot.id === shotId ? update(own) : own;
    const { track: _track, ...rest } = shot;
    return next ? { ...rest, track: next } : rest;
  });
  return changeCameraLive({ ...base, shots }, live);
}
function toggleCameraTracking() {
  cameraPathDrawing.value = false;
  if (!ensureCameraSelection()) return;
  if (activeTrack.value) { trackPicking.value = false; writeTracking(() => undefined); return; }
  trackPicking.value = !trackPicking.value;
}
// ACT: 点跟踪：记下点中的那一点（物体上的点随物体动，地面上的点固定），沿用之前的瞄准/跟拍和云台手感。
function pickTrackingSubject(picked: { objectId?: string; point: Vector3Value }) {
  trackPicking.value = false;
  writeTracking(track => {
    const { objectId: _objectId, point: _point, ...feel } = track ?? activeTrack.value ?? { mode: "aim" as const };
    return { ...feel, ...(picked.objectId ? { objectId: picked.objectId } : {}), point: picked.point };
  });
}
// ACT: 滑块拖动中实时生效但不记撤销；一次拖动只在开头记一步，松手结束。
let liveCameraEdit = false;
function changeCameraLive(next: SceneCamera, live: boolean) {
  const remember = !liveCameraEdit;
  liveCameraEdit = live;
  return changeCamera(next, remember);
}
function setTrackingSettings(patch: { smooth?: number; deadzone?: number; limit?: number; stabilize?: number }, live = false) {
  writeTracking(current => {
    if (!current) return current;
    const track = { ...current, ...patch };
    if (track.limit !== undefined && track.limit >= 180) delete track.limit;
    if (track.deadzone !== undefined && track.deadzone <= 0) delete track.deadzone;
    return track;
  }, live);
}
/** 这段镜头的手持感（晃动、节奏）。 */
/** 这段镜头的手持感（晃动、节奏）、结束焦距与希区柯克变焦。 */
function setShotFeel(patch: { shake?: number; shakeRate?: number; easing?: "smooth" | "linear" }, live = false) {
  const camera = monitorCamera.value && getStoredCamera(monitorCamera.value.id);
  const shotId = editShotId.value;
  if (!camera || !shotId || cameraLocked.value) return;
  changeCameraLive(updateCameraTake(camera, shotId, take => {
    const next: CameraTake = { ...take, ...patch };
    if (next.easing === "smooth") delete next.easing;
    return next;
  }), live);
}

// ACT: 景别、一键运镜：计算在 cameraDocument（applyTakeSize / applyTakeMove，Agent 的 worldCameras.moves 共用），这里只取当前这段镜头和被拍的人。
function applyShotSize(kind: string) {
  const camera = monitorCamera.value && getStoredCamera(monitorCamera.value.id);
  const shotId = editShotId.value;
  if (!camera || !shotId || cameraLocked.value || !(shotSizeKinds as readonly string[]).includes(kind)) return;
  const shot = camera.shots?.find(item => item.id === shotId);
  const subject = props.modelValue.objects.find(object => object.id === (shot?.track ?? camera.track)?.objectId);
  const height = subject ? (measureAssetFootprint(subject.asset)?.height ?? 1.75) * subject.scale.y : 1.75;
  changeCameraLive(updateCameraTake(camera, shotId, take => applyTakeSize(take, kind as (typeof shotSizeKinds)[number], height)), false);
}
function applyCameraAngle(kind: string) {
  const camera = monitorCamera.value && getStoredCamera(monitorCamera.value.id);
  const shotId = editShotId.value;
  if (!camera || !shotId || cameraLocked.value || !(cameraAngleKinds as readonly string[]).includes(kind)) return;
  changeCameraLive(updateCameraTake(camera, shotId, take => applyTakeAngle(take, kind as (typeof cameraAngleKinds)[number])), false);
}
function applyCameraMove(kind: string) {
  const camera = monitorCamera.value && getStoredCamera(monitorCamera.value.id);
  const shotId = editShotId.value;
  if (!camera || !shotId || cameraLocked.value || !(cameraMoveKinds as readonly string[]).includes(kind)) return;
  changeCameraLive(updateCameraTake(camera, shotId, take => applyTakeMove(take, kind as (typeof cameraMoveKinds)[number], () => crypto.randomUUID())), false);
}
// 轨迹锚点卡片：点选锚点后在旁边弹出，改离地高度。
const cameraAnchor = ref<{ id: string; shotId: string; index: number }>();
const cameraAnchorScreen = ref<{ x: number; y: number } | null>(null);
function anchorTarget() {
  const anchor = cameraAnchor.value;
  const camera = anchor && getStoredCamera(anchor.id);
  const shot = camera && getCameraShot(camera, anchor!.shotId);
  if (!anchor || !camera || !shot?.path) return undefined;
  const anchors = shot.path.length > 24 ? toPathAnchors(shot.path) : shot.path;
  return anchor.index < anchors.length ? { camera, shot, anchors, index: anchor.index } : undefined;
}
const anchorEditor = computed(() => {
  const target = anchorTarget();
  if (!target || editorPanel.value !== "life" || filmPreview.value) return undefined;
  const point = target.anchors[target.index]!;
  const ground = viewport?.groundHeightAt(point.x, point.z) ?? 0;
  return {
    key: target.camera.id + ":" + target.shot.id + ":" + target.index, name: target.camera.name, color: cameraColor(target.camera.id), index: target.index, total: target.anchors.length,
    height: point.y - ground,
  };
});
const anchorEditorStyle = computed(() => {
  const screen = cameraAnchorScreen.value;
  const width = canvas.value?.clientWidth ?? 960, height = canvas.value?.clientHeight ?? 540;
  if (!screen) return { left: "12px", top: "50%", visibility: "hidden" as const };
  // 锚点卡片放在锚点右侧、左侧或下方，选第一个不盖住取景窗的位置。
  const host = canvas.value?.getBoundingClientRect();
  const windows = host ? [...(studioRoot.value?.querySelectorAll<HTMLElement>(".cameraViewfinder") ?? [])].map(element => { const rect = element.getBoundingClientRect(); return { left: rect.left - host.left, top: rect.top - host.top, right: rect.right - host.left, bottom: rect.bottom - host.top }; }) : [];
  const place = (x: number, y: number) => ({ left: Math.round(Math.min(Math.max(x, 12), Math.max(12, width - 290))), top: Math.round(Math.min(Math.max(y, 64), Math.max(64, height - 260))) });
  const options = [place(screen.x + 22, screen.y - 90), place(screen.x - 22 - 272, screen.y - 90), place(screen.x - 136, screen.y + 26)];
  const clear = options.find(option => !windows.some(rect => option.left < rect.right && option.left + 272 > rect.left && option.top < rect.bottom && option.top + 240 > rect.top)) ?? options[0]!;
  return { left: `${clear.left}px`, top: `${clear.top}px` };
});
function writeAnchors(target: NonNullable<ReturnType<typeof anchorTarget>>, anchors: PathPoint[], live: boolean) {
  return changeCameraLive(updateCameraTake(target.camera, target.shot.id, take => setCameraTakePath(take, anchors)), live);
}
function updateCameraAnchor(patch: { height?: number }, live: boolean) {
  const target = anchorTarget();
  if (!target || cameraLocked.value) return;
  const anchors = target.anchors.map((point, index) => {
    if (index !== target.index) return point;
    const next: PathPoint = { ...point };
    if (patch.height !== undefined) next.y = (viewport?.groundHeightAt(point.x, point.z) ?? 0) + patch.height;
    return next;
  });
  writeAnchors(target, anchors, live);
}
function removeCameraAnchor() {
  const target = anchorTarget();
  if (!target || target.anchors.length <= 2) return;
  if (writeAnchors(target, target.anchors.filter((_, index) => index !== target.index), false)) closeCameraAnchor();
}
function closeCameraAnchor() {
  cameraAnchor.value = undefined;
  viewport?.setCameraAnchorSelection(null);
}

// ACT: 镜头关键点：时间轴镜头段上的菱形。在播放头处加一个就记下此刻的焦段与朝向，之后改它：卡片里拖滑块，
// 或者直接在取景窗里滚轮变焦、右键转向、Q/E 翻滚；关键点之间自动平滑过渡。
const selectedShotKey = ref<{ cameraId: string; shotId: string; keyId: string; x: number }>();
function keyTarget() {
  const selected = selectedShotKey.value;
  const camera = selected && getStoredCamera(selected.cameraId);
  const shot = camera && getCameraShot(camera, selected!.shotId);
  const key = shot?.keys?.find(item => item.id === selected!.keyId);
  return selected && camera && shot && key ? { selected, camera, shot, key } : undefined;
}
const keyEditor = computed(() => {
  const target = keyTarget();
  if (!target || editorPanel.value !== "life" || filmPreview.value) return undefined;
  const { camera, shot, key } = target;
  return { key: camera.id + ":" + shot.id + ":" + key.id, name: camera.name, color: cameraColor(camera.id), time: (shot.start + key.at * (shot.end - shot.start)).toFixed(1) + "s", values: { focal: key.focal, pan: key.pan, tilt: key.tilt, roll: key.roll } };
});
const keyEditorStyle = computed(() => {
  const x = selectedShotKey.value?.x ?? 0;
  const host = studioRoot.value?.getBoundingClientRect();
  const width = host?.width ?? 960;
  return { left: `${Math.round(Math.min(Math.max(x - (host?.left ?? 0) - 160, 12), Math.max(12, width - 332)))}px`, bottom: "calc(var(--performanceBottom) + 10px)" };
});
function writeShotKeys(cameraId: string, shotId: string, change: (keys: NonNullable<CameraShot["keys"]>) => NonNullable<CameraShot["keys"]>, live = false) {
  const camera = getStoredCamera(cameraId);
  if (!camera || cameraLocked.value) return false;
  return changeCameraLive({ ...camera, shots: camera.shots?.map(shot => {
    if (shot.id !== shotId) return shot;
    const keys = change([...(shot.keys ?? [])]).sort((a, b) => a.at - b.at);
    const { keys: _keys, ...rest } = shot;
    return keys.length ? { ...rest, keys } : rest;
  }) }, live);
}
function roundKey(values: ShotKeyValues): ShotKeyValues {
  return { focal: Math.round(values.focal * 10) / 10, pan: Math.round(values.pan * 10) / 10, tilt: Math.round(values.tilt * 10) / 10, roll: Math.round(values.roll * 10) / 10 };
}
/** 在这段镜头的at（0–1）处加关键点，值取此刻原本的焦段与朝向，加上之后画面不跳。 */
function addShotKey(cameraId: string, shotId: string, at: number, x?: number) {
  const camera = getStoredCamera(cameraId);
  const shot = camera && getCameraShot(camera, shotId);
  if (!camera || !shot) return;
  const time = Math.min(1, Math.max(0, Math.round(at * 10000) / 10000));
  const existing = shot.keys?.find(key => Math.abs(key.at - time) * (shot.end - shot.start) < 0.05);
  if (existing) { selectShotKey(cameraId, shotId, existing.id, x); return; }
  if ((shot.keys?.length ?? 0) >= 64) { notice.value = translate("一段镜头最多64个关键点"); return; }
  const id = crypto.randomUUID();
  // 新关键点要等存档回写后才查得到，这里直接按已知的时刻选中它。
  if (writeShotKeys(cameraId, shotId, keys => [...keys, { id, at: time, ...roundKey(getShotKeyValues(shot, time)) }])) openShotKey(cameraId, shot, id, time, x);
}
function addShotKeyAtPlayhead() {
  const camera = monitorCamera.value && getStoredCamera(monitorCamera.value.id);
  const shot = camera && getCameraShotAt(camera, filmTime.value);
  if (!camera || !shot) { notice.value = translate("播放头要在一段镜头里才能加关键点"); return; }
  // 关键点卡片出现在时间轴播放头上方。
  const needle = studioRoot.value?.querySelector<HTMLElement>(".timelinePanel .worldNeedle")?.getBoundingClientRect();
  const host = studioRoot.value?.getBoundingClientRect();
  addShotKey(camera.id, shot.id, (filmTime.value - shot.start) / (shot.end - shot.start), needle?.width ? needle.left : host ? host.left + host.width * 0.35 : undefined);
}
function selectShotKey(cameraId: string, shotId: string, keyId: string, x?: number) {
  const camera = getStoredCamera(cameraId);
  const shot = camera && getCameraShot(camera, shotId);
  const key = shot?.keys?.find(item => item.id === keyId);
  if (shot && key) openShotKey(cameraId, shot, keyId, key.at, x);
}
function openShotKey(cameraId: string, shot: CameraShot, keyId: string, at: number, x?: number) {
  if (selectedCameraId.value !== cameraId || selectedShotId.value !== shot.id) focusCamera(cameraId, shot.id);
  closeCameraAnchor();
  selectedShotKey.value = { cameraId, shotId: shot.id, keyId, x: x ?? selectedShotKey.value?.x ?? 0 };
  // 播放头跳到关键点，取景窗里看到的就是这一刻的画面。
  seekFilm(shot.start + at * (shot.end - shot.start));
}
function updateShotKey(patch: Partial<ShotKeyValues>, live: boolean) {
  const target = keyTarget();
  if (!target) return;
  writeShotKeys(target.camera.id, target.shot.id, keys => keys.map(key => key.id === target.key.id ? { ...key, ...roundKey({ ...key, ...patch }) } : key), live);
}
/** 拖过的关键点同时选中，播放头跟到新时刻，取景窗里看到的就是它。 */
function moveShotKey(cameraId: string, shotId: string, keyId: string, at: number, x?: number) {
  const time = Math.min(1, Math.max(0, Math.round(at * 10000) / 10000));
  if (!writeShotKeys(cameraId, shotId, keys => keys.map(key => key.id === keyId ? { ...key, at: time } : key))) return;
  const camera = getStoredCamera(cameraId), shot = camera && getCameraShot(camera, shotId);
  if (shot) openShotKey(cameraId, shot, keyId, time, x);
}
function removeShotKey() {
  const target = keyTarget();
  if (!target) return;
  if (writeShotKeys(target.camera.id, target.shot.id, keys => keys.filter(key => key.id !== target.key.id))) closeShotKey();
}
function closeShotKey() { selectedShotKey.value = undefined; }
// 成片行里选了重叠处播哪个机位：把那台机位的这段镜头提到最前。
function pickProgramCamera(id: string, time: number) {
  const camera = getStoredCamera(id);
  const shot = camera && getCameraShotAt(camera, time);
  if (!camera || !shot || cameraLocked.value) return;
  const front = getTopShotFront(studioCameras.value) + 1;
  if (changeCamera({ ...camera, shots: camera.shots?.map(item => item.id === shot.id ? { ...item, front } : item) })) focusCamera(id, shot.id);
}
/** 拖动轨迹改完形状。 */
function editCameraPath(id: string, shotId: string, points: Vector3Value[]) {
  const camera = getStoredCamera(id);
  if (!camera || cameraLocked.value || !getCameraShot(camera, shotId)) return;
  if (changeCamera(updateCameraTake(camera, shotId, take => setCameraTakePath(take, points)))) focusCamera(id, shotId);
}
function setTrackingMode(mode: "aim" | "follow") {
  writeTracking(track => track && { ...track, mode });
}
function setFilmPreview(active: boolean) {
  if (active && (!studioCameras.value.length || locked.value || performanceDraft.value)) return;
  cancelCameraGesture();
  if (active) {
    // 全屏预演看的是成片：退出机位编辑，从当前位置播放，播完则从头。
    clearCameraSelection();
    if (!timelineRunning.value) toggleTimelinePlayback();
  }
  filmPreview.value = active;
  viewport?.setFilmPreview(active);
}
// ACT: 一键布景后“演绎”图标轻轻呼吸，提示下一步（播放、分镜、导出都在里面）；打开演绎或场景清空就停。
const performanceHint = ref(false);
watch(() => props.modelValue.objects.length, count => { if (!count) performanceHint.value = false; });
function toggleLife() {
  performanceHint.value = false;
  if (locked.value) return;
  if (editorPanel.value === "life") { closeInspector(); return; }
  openInspector("life");
}
function updateLife(value: SceneLife, extra: Partial<SceneDocument> = {}) {
  if (locked.value) return;
  const time = viewport?.getLifeTime() ?? value.time;
  const previousTracks = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups);
  const nextTracks = getPerformanceTracks(value, props.modelValue.objects, props.modelValue.objectGroups);
  const controlled = new Set([...previousTracks, ...nextTracks].filter(track => track.controller === "object").map(track => track.objectId));
  const next = new Set(nextTracks.filter(track => track.enabled !== false).flatMap(track => track.controller === "object" ? [track.objectId] : [...getPerformanceObjectIds(track.objectId, props.modelValue.objectGroups)]));
  const stopped = new Set(previousTracks.filter(track => track.enabled !== false && track.controller !== "object").flatMap(track => [...getPerformanceObjectIds(track.objectId, props.modelValue.objectGroups)]).filter(id => !next.has(id) && !controlled.has(id)));
  const placements = new Map((stopped.size ? viewport?.getObjectPlacements(true) ?? [] : []).filter(placement => stopped.has(placement.id)).map(placement => [placement.id, placement]));
  commit({ ...props.modelValue, ...extra, objects: props.modelValue.objects.map(object => ({ ...object, ...placements.get(object.id) })), life: { ...value, time: Math.min(86400, time) } });
}
function selectPerformance(id: string, pointIndex?: number) {
  if (locked.value) return;
  selectedPerformanceClipId.value = "";
  cancelCameraGesture(); clearCameraSelection();
  if (performanceDraft.value) {
    if (id === performanceDraft.value.id) { if (performanceDraft.value.points.length >= 3) finishPerformanceRoute(); return; }
    cancelPerformanceRoute();
  }
  if (!id) { selectedTrackId.value = ""; selectedPerformancePoint.value = undefined; return; }
  const track = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups).find(track => track.id === id);
  if (!track) return;
  subjectId.value = track.objectId;
  selectedObjectIds.value = track.controller === "object" ? [track.objectId] : [...getPerformanceObjectIds(track.objectId, props.modelValue.objectGroups)];
  selectedTerrainTree.value = null;
  selectedTrackId.value = id;
  selectedPerformancePoint.value = pointIndex;
  rememberPerformanceContext();
  if (editorPanel.value !== "life") openInspector("life");
  viewport?.selectObjects(selectedObjectIds.value);
}
function changePerformance(id: string, change: (track: PerformanceTrack) => PerformanceTrack) {
  if (locked.value) return;
  try {
    const tracks = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups).map(track => track.id === id ? change(track) : track);
    updateLife({ ...getSceneLife(props.modelValue.life), tracks: mergePerformanceTracks(props.modelValue.life, tracks, props.modelValue.objects) });
  } catch (error) { fail(error); }
}
function removePerformanceTrack(id: string) {
  if (locked.value || performanceDraft.value || timelineSeeking.value) return;
  const life = getSceneLife(props.modelValue.life);
  const tracks = life.tracks;
  if (!tracks?.some(track => track.id === id && track.objectId)) return;
  try {
    const current = getPerformanceTracks(life, props.modelValue.objects, props.modelValue.objectGroups);
    const remaining = disableDependentPerformanceClips(current, id).filter(track => track.id !== id);
    updateLife({ ...life, tracks: mergePerformanceTracks(life, remaining, props.modelValue.objects) });
    if (selectedTrackId.value === id) selectPerformance("");
    studioRoot.value?.focus({ preventScroll: true });
  } catch (error) { fail(error); }
}
/** 场景里拖路线中间插了一个点：插在第segment段，按它在这段里的位置分配用时，插完选中它。 */
function insertPerformanceRoutePoint(id: string, segment: number, position: Vector3Value) {
  if (locked.value || performanceDraft.value) return;
  const track = timelineTracks.value.find(item => item.id === id);
  if (!track) return;
  const point: PerformancePoint = [position.x, position.y, position.z];
  try {
    if (track.clips) {
      const inserted = insertClipRouteSegmentPoint(track.clips, segment, point);
      changePerformance(id, current => ({ ...current, clips: inserted.clips }));
      selectPerformance(id, findClipRoutePoint(getClipRoute(inserted.clips), inserted.ref));
      return;
    }
    const from = track.points[segment], to = track.points[segment + 1];
    if (!from || !to) return;
    const before = Math.hypot(point[0] - from[0], point[2] - from[2]), after = Math.hypot(to[0] - point[0], to[2] - point[2]);
    const patch = insertPerformancePoint(track, segment, point, before / Math.max(0.001, before + after));
    changePerformance(id, current => ({ ...current, ...patch }));
    selectPerformance(id, segment + 1);
  } catch (error) { fail(error); }
}
/** 双击路径点删除它。 */
function removePerformanceRoutePoint(id: string, index: number) {
  if (locked.value || performanceDraft.value) return;
  selectPerformance(id, index);
  removeSelectedPoint();
}
function movePerformancePoint(id: string, index: number, position: Vector3Value) {
  // 片段式动线：点是各移动片段路径点接起来的，写回对应片段。
  changePerformance(id, track => track.clips ? { ...track, clips: moveClipRoutePoint(track.clips, index, [position.x, position.y, position.z]) } : { ...track, points: track.points.map((point, cursor) => cursor === index ? [position.x, position.y, position.z] : point) });
}
// ACT: 时间轴剪辑：切割镜头段/片段、框选后成组移动或删除，各算一步撤销。
function splitCameraShotAt(id: string, shotId: string, time: number) {
  const camera = getStoredCamera(id);
  if (!camera || cameraLocked.value) return;
  try {
    const newId = crypto.randomUUID();
    if (changeCamera(splitCameraShot(camera, shotId, time, newId))) focusCamera(id, newId);
  } catch (error) { fail(error); }
}
function splitPerformanceClipAt(trackId: string, clipId: string, time: number) {
  if (performanceDraft.value || timelineSeeking.value) return;
  const object = props.modelValue.objects.find(object => object.id === timelineTracks.value.find(track => track.id === trackId)?.objectId);
  if (!object) return;
  try {
    let created = "";
    changePerformance(trackId, track => ({ ...track, clips: getPerformanceClips(track, object).flatMap(clip => {
      if (clip.id !== clipId) return [clip];
      const [head, tail] = splitPerformanceClip(clip, time);
      created = tail.id;
      return [head, { ...tail, name: clip.name + " ·2" }];
    }) }));
    if (created) selectPerformanceClip(trackId, created);
  } catch (error) { fail(error); }
}
function timelineGroups(items: TimelineItem[]) {
  const shots = new Map<string, Set<string>>(), clips = new Map<string, Set<string>>();
  for (const item of items) { const map = item.kind === "shot" ? shots : clips; if (!map.has(item.owner)) map.set(item.owner, new Set()); map.get(item.owner)!.add(item.id); }
  return { shots, clips };
}
function editTimelineItems(items: TimelineItem[], shot: (shot: CameraShot) => CameraShot | null, clip: (clip: PerformanceClip) => PerformanceClip | null) {
  if (locked.value || cameraLocked.value || performanceDraft.value || timelineSeeking.value) return;
  const { shots, clips } = timelineGroups(items);
  try {
    const cameras = (props.modelValue.cameras ?? []).map(camera => {
      const ids = shots.get(camera.id);
      if (!ids) return camera;
      const next = (camera.shots ?? []).flatMap(value => { if (!ids.has(value.id)) return [value]; const result = shot(value); return result ? [result] : []; }).sort((a, b) => a.start - b.start);
      return cameraTrackSchema.parse({ ...camera, shots: next });
    });
    if (!clips.size) { commit({ ...props.modelValue, cameras }); return; }
    const life = getSceneLife(props.modelValue.life);
    let tracks = getPerformanceTracks(life, props.modelValue.objects, props.modelValue.objectGroups);
    for (const [trackId, ids] of clips) {
      const object = props.modelValue.objects.find(object => object.id === tracks.find(track => track.id === trackId)?.objectId);
      if (!object) continue;
      const removed: string[] = [];
      tracks = tracks.map(track => track.id !== trackId ? track : { ...track, clips: getPerformanceClips(track, object).flatMap(value => {
        if (!ids.has(value.id)) return [value];
        const result = clip(value);
        if (!result) removed.push(value.id);
        return result ? [result] : [];
      }) });
      for (const clipId of removed) tracks = disableDependentPerformanceClips(tracks, trackId, clipId);
    }
    updateLife({ ...life, tracks: mergePerformanceTracks(life, tracks, props.modelValue.objects) }, { cameras });
  } catch (error) { fail(error); }
}
/** Ctrl+D：把所选镜头段与片段复制一份，整体接在所选之后；镜头段放不下（压到同机位别的镜头段）时不复制。 */
function duplicateTimelineItems(items: TimelineItem[]) {
  if (locked.value || cameraLocked.value || performanceDraft.value) return;
  const { shots, clips } = timelineGroups(items);
  let first = Infinity, last = -Infinity;
  for (const camera of props.modelValue.cameras ?? []) for (const shot of camera.shots ?? []) if (shots.get(camera.id)?.has(shot.id)) { first = Math.min(first, shot.start); last = Math.max(last, shot.end); }
  for (const track of timelineTracks.value) {
    const ids = clips.get(track.id), object = ids && props.modelValue.objects.find(item => item.id === track.objectId);
    if (object) for (const clip of getPerformanceClips(track, object)) if (ids!.has(clip.id)) { first = Math.min(first, clip.start); last = Math.max(last, clip.start + (clip.sourceOut - clip.sourceIn) / clip.rate); }
  }
  if (!Number.isFinite(first)) return;
  const span = Math.round((last - first) * 1000) / 1000;
  try {
    const cameras = (props.modelValue.cameras ?? []).map(camera => {
      const ids = shots.get(camera.id);
      if (!ids) return camera;
      const copies = (camera.shots ?? []).filter(shot => ids.has(shot.id)).map(shot => ({ ...shot, id: crypto.randomUUID(), start: Math.round((shot.start + span) * 1000) / 1000, end: Math.round((shot.end + span) * 1000) / 1000 }));
      const all = [...(camera.shots ?? []), ...copies].sort((a, b) => a.start - b.start);
      for (let index = 1; index < all.length; index++) if (all[index]!.start < all[index - 1]!.end - 1e-6) throw new Error(`“${camera.name}”后面放不下复制的镜头段，先腾出时间`);
      return cameraTrackSchema.parse({ ...camera, shots: all });
    });
    if (!clips.size) { commit({ ...props.modelValue, cameras }); return; }
    const life = getSceneLife(props.modelValue.life);
    const tracks = getPerformanceTracks(life, props.modelValue.objects, props.modelValue.objectGroups).map(track => {
      const ids = clips.get(track.id), object = ids && props.modelValue.objects.find(item => item.id === track.objectId);
      if (!object) return track;
      const current = getPerformanceClips(track, object);
      return { ...track, clips: [...current, ...current.filter(clip => ids!.has(clip.id)).map(clip => ({ ...clip, id: crypto.randomUUID(), name: clip.name + " 副本", start: Math.round((clip.start + span) * 1000) / 1000 }))].sort((a, b) => a.start - b.start) };
    });
    updateLife({ ...life, tracks: mergePerformanceTracks(life, tracks, props.modelValue.objects) }, { cameras });
  } catch (error) { fail(error); }
}
function renameCamera(id: string, name: string) {
  const camera = getStoredCamera(id);
  if (camera && name.trim()) changeCamera({ ...camera, name: name.trim() });
}
/** 停用的机位保留镜头段但不上成片（场景和监看里都不出现）。 */
function toggleCameraEnabled(id: string) {
  const camera = getStoredCamera(id);
  if (!camera) return;
  const { enabled: _enabled, ...rest } = camera;
  changeCamera(camera.enabled === false ? rest : { ...rest, enabled: false });
}
function moveTimelineItems(items: TimelineItem[], delta: number) {
  const shift = (value: number) => Math.max(0, Math.round((value + delta) * 1000) / 1000);
  // 由别的片段触发的片段跟着触发源走，不单独平移。
  editTimelineItems(items, shot => ({ ...shot, start: shift(shot.start), end: shift(shot.end) }), clip => clip.trigger ? clip : { ...clip, start: shift(clip.start) });
}
function removeTimelineItems(items: TimelineItem[]) {
  editTimelineItems(items, () => null, () => null);
  if (selectedShotId.value && items.some(item => item.kind === "shot" && item.id === selectedShotId.value)) selectedShotId.value = "";
  if (selectedPerformanceClipId.value && items.some(item => item.kind === "clip" && item.id === selectedPerformanceClipId.value)) selectedPerformanceClipId.value = "";
}
function changeTimelineTrack(id: string, patch: Partial<PerformanceTrack>) {
  if (performanceDraft.value) return;
  changePerformance(id, track => ({ ...track, ...patch }));
}
function selectPerformanceClip(id: string, clipId: string) {
  selectPerformance(id);
  if (selectedTrackId.value === id) { selectedPerformanceClipId.value = clipId; rememberPerformanceContext(); }
}
function changePerformanceClip(id: string, clipId: string, patch: Partial<PerformanceClip>) {
  const object = props.modelValue.objects.find(object => object.id === timelineTracks.value.find(track => track.id === id)?.objectId);
  if (!object) return;
  changePerformance(id, track => ({ ...track, clips: getPerformanceClips(track, object).map(clip => clip.id === clipId ? { ...clip, ...patch } as PerformanceClip : clip) }));
}
function removePerformanceClip(id: string, clipId: string) {
  if (locked.value || performanceDraft.value || timelineSeeking.value) return;
  const object = props.modelValue.objects.find(object => object.id === timelineTracks.value.find(track => track.id === id)?.objectId);
  if (!object) return;
  try {
    const life = getSceneLife(props.modelValue.life);
    const tracks = getPerformanceTracks(life, props.modelValue.objects, props.modelValue.objectGroups).map(track => track.id === id ? { ...track, clips: getPerformanceClips(track, object).filter(clip => clip.id !== clipId) } : track);
    updateLife({ ...life, tracks: mergePerformanceTracks(life, disableDependentPerformanceClips(tracks, id, clipId), props.modelValue.objects) });
    if (selectedPerformanceClipId.value === clipId) selectedPerformanceClipId.value = "";
  } catch (error) { fail(error); }
}
function toggleTimelinePlayback() {
  if (locked.value || performanceDraft.value) return;
  if (timelineCompleted.value) { resetLife(); return; }
  commitPlayback({ ...(viewport?.getWorldTime() ?? worldTime.value), paused: timelineRunning.value }, true);
}
function commitPlayback(time: SceneTime, remember: boolean) {
  const scene = latestScene();
  const life = scene.life;
  if (life?.enabled && life.running !== false) commitPresentation({ time }, remember);
  else commit({ ...scene, time, life: { ...getSceneLife(life), enabled: true, running: true } }, remember);
}
function seekTimeline(seconds: number, phase: "start" | "move" | "end" | "cancel", play = false) {
  if (!viewport) return;
  if (phase === "cancel") { viewport.seekPerformance(seconds, phase); timelineSeeking.value = false; return; }
  if (locked.value || performanceDraft.value) return;
  try {
    cancelTimeDraft();
    timelineSeeking.value = phase !== "end";
    const time = viewport.seekPerformance(seconds, phase);
    if (phase === "end") commitPlayback({ ...time, paused: !play }, false);
  } catch (error) { viewport.seekPerformance(seconds, "cancel"); timelineSeeking.value = false; fail(error); }
}
function editObjectPerformance() {
  if (locked.value || !selectedObject.value) return;
  selectPerformanceObject(selectedObject.value.id);
}
function selectPerformanceObject(id: string) {
  selectObject(id);
  clearCameraSelection();
  performancePointAnchor.value = null;
  const track = performanceTrackForObject(id);
  if (track) { selectPerformance(track.id); return; }
  selectedObjectIds.value = [...getPerformanceObjectIds(id, props.modelValue.objectGroups)];
  selectedTrackId.value = "";
  selectedPerformancePoint.value = undefined;
  if (editorPanel.value !== "life") openInspector("life");
}
function performanceTrackForObject(id: string) {
  const members = getPerformanceObjectIds(id, props.modelValue.objectGroups);
  const tracks = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups);
  return tracks.find(track => track.objectId === id && track.controller === "object") ?? tracks.find(track => track.controller !== "object" && members.includes(track.objectId));
}
function startPerformanceRoute(continueTrackId?: string) {
  const tracks = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups);
  const previous = continueTrackId ? tracks.find(track => track.id === continueTrackId) : performanceTrackForObject(subjectId.value);
  const object = props.modelValue.objects.find(object => object.id === (previous?.objectId ?? subjectId.value));
  if (locked.value || !object || !viewport) return;
  subjectId.value = object.id;
  selectedObjectIds.value = [...getPerformanceObjectIds(object.id, props.modelValue.objectGroups)];
  const origin = viewport.getObjectPlacements(true).find(placement => placement.id === object.id)?.position ?? object.position;
  // ACT: 拖拽末端锚点会保留已有路径、事件和分段用时继续追加；只有无动线时蓝圈才从落点重新起笔。
  const base = continueTrackId && previous ? (previous.clips ? materializePerformanceTrack(previous, object) : previous) : undefined;
  const points = base ? base.points.map(point => [point[0], point[1], point[2]] as [number, number, number]) : [[origin.x, origin.y, origin.z] as [number, number, number]];
  const draft: PerformanceTrack = {
    ...(base ?? previous ?? {}),
    id: previous?.id ?? crypto.randomUUID(),
    objectId: object.id,
    enabled: true,
    loop: false,
    clips: undefined,
    segmentSeconds: base?.segmentSeconds ? [...base.segmentSeconds] : undefined,
    events: base?.events ? base.events.map(event => ({ ...event })) : [],
    points,
    // ACT: 车辆、道具等非人物默认严格沿线走：大体积物体按导航网格寻路很容易在坡上、窄处卡住。骨骼人物和胶囊人照常寻路。
    ...(!previous?.mode && object.asset.shape !== "riggedPerson" && object.asset.shape !== "person" ? { mode: "path" as const } : {}),
  };
  performanceDraft.value = draft;
  selectedPerformancePoint.value = undefined;
  viewport.setPerformanceDraft(performanceDraft.value);
  studioRoot.value?.focus({ preventScroll: true });
}
// ACT: 按住物体拖出的一笔路线：重画这条动线（保留速度、沿线等设置；旧的逐点数据和新点对不上，一并清掉）。
function drawPerformanceStroke(objectId: string, points: Vector3Value[], appendTo?: string) {
  if (locked.value || points.length < 2) return;
  if (performanceDraft.value) cancelPerformanceRoute();
  subjectId.value = objectId;
  if (appendTo) {
    const clipTrack = timelineTracks.value.find(item => item.id === appendTo && item.clips);
    if (clipTrack?.clips) { appendClipRoute(clipTrack, points); return; }
    // 从末端接着画：保留已有的路径点、事件和分段用时，把新的一笔接在后面。
    startPerformanceRoute(appendTo);
    const draft = performanceDraft.value;
    if (!draft) return;
    const end = draft.points.at(-1)!;
    const added = points.slice(1).filter(point => Math.hypot(point.x - end[0], point.z - end[2]) > 0.2).map(point => [point.x, point.y, point.z] as [number, number, number]);
    if (!added.length) { cancelPerformanceRoute(); return; }
    if (draft.points.length + added.length > 64) notice.value = translate("动线最多64个点，多出的部分没有加上。");
    performanceDraft.value = { ...draft, points: [...draft.points, ...added].slice(0, 64) };
    finishPerformanceRoute();
    return;
  }
  // ACT: 带动作/特效片段的动线（如Agent编排的）只替换移动片段，保留其余片段，避免重画路线把动作弄丢。
  const existing = performanceTrackForObject(objectId);
  if (existing?.clips?.some(clip => clip.kind !== "move")) {
    const object = props.modelValue.objects.find(item => item.id === existing.objectId);
    if (!object) return;
    const clips = getPerformanceClips(existing, object);
    const moves = clips.filter(clip => clip.kind === "move");
    const route = points.slice(0, 64).map(point => [point.x, point.y, point.z] as [number, number, number]);
    let length = 0;
    for (let index = 1; index < route.length; index++) length += Math.hypot(route[index]![0] - route[index - 1]![0], route[index]![2] - route[index - 1]![2]);
    const duration = Math.max(0.5, Math.round(length / getPerformanceDefaultSpeed(existing) * 100) / 100);
    const move: PerformanceClip = { id: crypto.randomUUID(), name: "移动", start: moves.length ? Math.min(...moves.map(clip => clip.start)) : 0, sourceDuration: duration, sourceIn: 0, sourceOut: duration, rate: 1, kind: "move", points: route, ...(existing.mode === "path" ? { mode: "path" as const } : {}) };
    try {
      const life = getSceneLife(props.modelValue.life);
      let tracks = getPerformanceTracks(life, props.modelValue.objects, props.modelValue.objectGroups).map(track => track.id === existing.id ? { ...track, clips: [...clips.filter(clip => clip.kind !== "move"), move].sort((a, b) => a.start - b.start) } : track);
      for (const removed of moves) tracks = disableDependentPerformanceClips(tracks, existing.id, removed.id);
      updateLife({ ...life, tracks: mergePerformanceTracks(life, tracks, props.modelValue.objects) });
      selectedTrackId.value = existing.id;
    } catch (error) { fail(error); }
    return;
  }
  startPerformanceRoute();
  const draft = performanceDraft.value;
  if (!draft) return;
  const origin = draft.points[0]!;
  const rest = points.slice(1).filter(point => Math.hypot(point.x - origin[0], point.z - origin[2]) > 0.2).map(point => [point.x, point.y, point.z] as [number, number, number]);
  if (!rest.length) { cancelPerformanceRoute(); return; }
  const { segmentSeconds: _segments, teleports: _teleports, inertias: _inertias, ...base } = draft;
  performanceDraft.value = { ...base, events: [], points: [origin, ...rest].slice(0, 64) };
  finishPerformanceRoute();
}
/** 片段式动线从终点接着画：在最后一个片段（含终点的动作）之后接一段新的移动，速度沿用最后一段移动。 */
function appendClipRoute(track: PerformanceTrack, points: Vector3Value[]) {
  if (!track.clips) return;
  const timing = getClipRouteTiming(track.clips);
  const end = timing.route.points.at(-1);
  if (!end) return;
  const added = points.slice(1).filter(point => Math.hypot(point.x - end[0], point.z - end[2]) > 0.2).map(point => [point.x, point.y, point.z] as [number, number, number]);
  if (!added.length) return;
  if (added.length + 1 > 64) notice.value = translate("一段移动最多64个点，多出的部分没有加上。");
  const route = [[end[0], end[1], end[2]] as [number, number, number], ...added].slice(0, 64);
  let length = 0;
  for (let index = 1; index < route.length; index++) length += Math.hypot(route[index]![0] - route[index - 1]![0], route[index]![2] - route[index - 1]![2]);
  const lastMove = [...track.clips].filter(clip => clip.kind === "move" && clip.enabled !== false).sort((a, b) => a.start - b.start).at(-1);
  const speed = (timing.route.points.length > 1 ? getClipRouteSpeed(track.clips, timing.route.points.length - 1) : undefined) ?? getPerformanceDefaultSpeed(track);
  const duration = Math.max(0.5, Math.round(length / Math.max(0.1, speed) * 100) / 100);
  const start = Math.round(Math.max(timing.departures.at(-1) ?? 0, ...track.clips.filter(clip => clip.enabled !== false).map(clip => clip.start + clip.sourceOut / clip.rate - clip.sourceIn / clip.rate)) * 1000) / 1000;
  const move: PerformanceClip = { id: crypto.randomUUID(), name: "移动", start, sourceDuration: duration, sourceIn: 0, sourceOut: duration, rate: 1, kind: "move", points: route, ...(lastMove?.kind === "move" && lastMove.mode ? { mode: lastMove.mode } : {}) };
  const clips = [...track.clips, move].sort((a, b) => a.start - b.start);
  changePerformance(track.id, current => ({ ...current, clips }));
  selectPerformance(track.id, getClipRoute(clips).points.length - 1);
}
function addPerformanceRoutePoint(position: Vector3Value) {
  const draft = performanceDraft.value;
  if (!draft || locked.value) return;
  if (draft.points.length >= 64) { notice.value = translate("路线已达到 64 个点，请完成或撤回一点。"); return; }
  const previous = draft.points.at(-1)!;
  const y = draft.mode === "air" || draft.mode === "water" ? previous[1] : position.y;
  if (Math.hypot(position.x - previous[0], y - previous[1], position.z - previous[2]) < 0.05) return;
  // ACT: 动线是开放路径，不允许再落一个回到起点的末点形成闭环。
  const first = draft.points[0]!;
  if (draft.points.length >= 2 && Math.hypot(position.x - first[0], position.z - first[2]) < 0.2) return;
  performanceDraft.value = { ...draft, points: [...draft.points, [position.x, y, position.z]] };
  viewport?.setPerformanceDraft(performanceDraft.value);
}
function undoPerformanceRoutePoint() {
  const draft = performanceDraft.value;
  if (!draft || draft.points.length < 2) return;
  performanceDraft.value = { ...draft, points: draft.points.slice(0, -1) };
  viewport?.setPerformanceDraft(performanceDraft.value);
}
function cancelPerformanceRoute() {
  if (!performanceDraft.value) return false;
  performanceDraft.value = null;
  viewport?.setPerformanceDraft(null);
  notice.value = "";
  return true;
}
function finishPerformanceRoute() {
  const draft = performanceDraft.value;
  if (!draft || draft.points.length < 2 || locked.value) return;
  const members = getPerformanceObjectIds(draft.objectId, props.modelValue.objectGroups);
  const tracks = getPerformanceTracks(props.modelValue.life, props.modelValue.objects, props.modelValue.objectGroups).filter(track => track.controller === "object" || !members.includes(track.objectId));
  try {
    updateLife({ ...getSceneLife(props.modelValue.life), enabled: true, running: true, tracks: mergePerformanceTracks(props.modelValue.life, disableDependentPerformanceClips([...tracks, { ...draft, loop: false }], draft.id), props.modelValue.objects) });
  } catch (error) { fail(error); return; }
  cancelPerformanceRoute();
  selectedTrackId.value = draft.id;
  selectedPerformancePoint.value = undefined;
}
function resetLife() {
  if (locked.value) return;
  const range = lifeStatus.value.playbackRange;
  if (range) seekTimeline(range.start, "end", true);
}
async function activateLifeWorld() {
  if (locked.value || voiceActive.value || !props.generateAi) return;
  selectedTrackId.value = "";
  subjectId.value = "";
  rememberPerformanceContext();
  const instruction = "让场景中已有的模型开始演绎。根据模型的用途，只给适合运动的真实物体安排少量动线点和关键事件，保留建筑和环境。不要创建、复制或替换任何模型。分小批提交，先让已有结果动起来。";
  prompt.value = prompt.value.trim() ? instruction + "\n补充要求：" + prompt.value.trim() : instruction;
  await nextTick();
  if (!selectedAiModel.value) {
    notice.value = translate("请在下方选择模型和思考强度，然后发送。");
    modelPicker.value?.open();
    return;
  }
  await runAi();
}
async function askPerformanceObject(id: string) {
  if (locked.value || voiceActive.value || !props.generateAi) return;
  selectPerformanceObject(id);
  rememberPerformanceContext();
  chatOpen.value = true;
  await nextTick();
  promptInput.value?.focus();
}
function updateWeather(patch: Partial<SceneWeather>) {
  if (locked.value) return;
  cancelWeatherDraft();
  try { commit({ ...props.modelValue, weather: { ...defaultWeather, ...props.modelValue.weather, ...patch } }); }
  catch (error) { fail(error); }
}
function beginTimeEdit() { if (!locked.value) timeEditCanceled = false; }
function previewTime(patch: Partial<SceneTime>) {
  if (disposed || locked.value || timeEditCanceled || editorPanel.value !== "view" || worldTab.value !== "time") return;
  try {
    timeDraft.value = sceneTimeSchema.parse({ ...displayTime.value, ...patch });
    viewport?.setWorldTimePreview(timeDraft.value);
  } catch (error) { cancelTimeDraft(); fail(error); }
}
function commitTimeDraft() {
  if (!timeDraft.value || timeEditCanceled) return;
  if (locked.value || editorPanel.value !== "view" || worldTab.value !== "time") { cancelTimeDraft(); return; }
  const time = timeDraft.value;
  timeDraft.value = undefined;
  viewport?.setWorldTimePreview();
  try { commitPresentation({ time }, true); }
  catch (error) { fail(error); }
}
// ACT: 光线氛围：一键设好时间、天气和光照（日戏、黄昏、夜戏、阴天、雨夜），一次提交可撤销；之后仍可在下面的滑杆上细调。
// 夜戏按影视“月光夜景”布光：冷蓝主光当月光、提高环境补光和曝光，暗而看得清，不是一片黑。
type MoodPreset = { name: string; title: string; hour: number; layers: Partial<Record<WeatherLayerKey, number>>; lighting?: SceneLighting };
const moonlight: SceneLighting = { sunIntensity: 1.4, sunAzimuth: 200, sunElevation: 35, sunColor: "#a9bdf0", ambientIntensity: 0.9, ambientColor: "#7f93c9", skyIntensity: 0.6, exposure: 1.5, weatherInfluence: 1 };
const moodPresets: MoodPreset[] = markMessages([
  { name: "日戏", title: "上午10点、晴、自然光", hour: 10, layers: {} },
  { name: "黄昏", title: "傍晚18:10夕阳暖光", hour: 18.17, layers: {} },
  { name: "夜戏", title: "晚上21点月光夜景：冷蓝月光加补光，暗而看得清", hour: 21, layers: {}, lighting: moonlight },
  { name: "阴天", title: "午后13点浓云、柔光", hour: 13, layers: { clouds: 0.85 } },
  { name: "雨夜", title: "晚上21点下雨、云层，月光补光", hour: 21, layers: { clouds: 0.8, rain: 0.7 }, lighting: moonlight },
]);
/** 套用氛围预设后的时间和天气（界面氛围按钮、按场次标题自动切换共用）。 */
function moodPatch(document: SceneDocument, mood: MoodPreset, paused = worldTime.value.paused): Pick<SceneDocument, "time" | "weather"> {
  const layers = Object.fromEntries(weatherLayerKeys.map(key => [key, mood.layers[key] ?? 0])) as NonNullable<SceneWeather["layers"]>;
  const condition = mood.layers.rain ? "rain" : mood.layers.clouds ? "cloudy" : "clear";
  const { lighting: _lighting, ...current } = { ...defaultWeather, ...document.weather };
  const time = sceneTimeSchema.parse({ ...worldTime.value, hour: mood.hour, paused });
  return { time, weather: { ...current, layers, condition, ...(mood.lighting ? { lighting: { ...mood.lighting } } : {}) } };
}
function applyMood(mood: MoodPreset) {
  if (locked.value) return;
  cancelTimeDraft(); cancelWeatherDraft();
  try {
    viewport?.markWorldTimeJump();
    commit({ ...props.modelValue, ...moodPatch(props.modelValue, mood) });
  } catch (error) { fail(error); }
}
/**
 * ACT: 剧本场次标题里的日夜（“第3场 客厅 夜 内”“EXT. STREET - NIGHT”）：和场景当前时间对不上时换成对应氛围（夜/雨夜/黄昏/日戏）；
 * 只看前三行里不带冒号的标题行，没写就不动。
 */
function moodFromHeading(script: string): MoodPreset | undefined {
  const heading = script.split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 3).find(line => (!/[：:]/.test(line) || /^(场景|场次)/.test(line)) && /场景|场次|第.{1,4}[场幕集]|内景|外景|INT\.|EXT\.|(^|[\s·\-—])(日|夜|晨|昏|黄昏|傍晚|清晨|凌晨|深夜|白天|DAY|NIGHT|DUSK)([\s·\-—]|$)/i.test(line));
  if (!heading) return;
  const hour = props.modelValue.time?.hour ?? worldTime.value.hour;
  const now = hour < 5 || hour >= 19.5 ? "night" : hour >= 17.5 ? "dusk" : "day";
  const named = (name: string) => moodPresets.find(mood => mood.name === name);
  if (/夜|凌晨|NIGHT/i.test(heading)) return /雨/.test(heading) ? named("雨夜") : now === "night" ? undefined : named("夜戏");
  if (/黄昏|傍晚|日落|昏|DUSK/i.test(heading)) return now === "dusk" ? undefined : named("黄昏");
  if (/日|白天|上午|下午|清晨|晨|DAY/i.test(heading)) return now === "day" ? undefined : named("日戏");
}
function updateTime(patch: Partial<SceneTime>) {
  if (locked.value) return;
  cancelTimeDraft();
  try {
    const time = sceneTimeSchema.parse({ ...worldTime.value, ...patch });
    if (patch.hour !== undefined || patch.date !== undefined) viewport?.markWorldTimeJump();
    commitPresentation({ time }, true);
  }
  catch (error) { fail(error); }
}
function cancelTimeDraft() {
  if (!timeDraft.value) return false;
  timeEditCanceled = true;
  timeDraft.value = undefined;
  if (!disposed) viewport?.setWorldTimePreview();
  return true;
}
function beginWeatherEdit(event: Event) {
  if (locked.value) return;
  if (event.type === "keydown") {
    const keyEvent = event as KeyboardEvent;
    if (keyEvent.key === "Escape" || keyEvent.ctrlKey || keyEvent.metaKey || keyEvent.altKey) return;
  }
  weatherEditCanceled = false;
}
function previewWeather(patch: Partial<SceneWeather>) {
  if (disposed || locked.value || weatherEditCanceled || editorPanel.value !== "view") return;
  try {
    weatherDraft.value = { ...defaultWeather, ...props.modelValue.weather, ...weatherDraft.value, ...patch };
    viewport?.sync(viewportDocument());
  } catch (error) { cancelWeatherDraft(); fail(error); }
}
function previewWeatherLayers(layers: NonNullable<SceneWeather["layers"]>) {
  previewWeather({ layers, condition: weatherLayerOptions.find(layer => (layers[layer.key] ?? 0) > 0)?.condition ?? "clear" });
}
function previewLighting(patch: Partial<SceneLighting>) {
  previewWeather({ lighting: { ...weather.value.lighting, ...patch } });
}
function commitWeatherDraft() {
  if (!weatherDraft.value || weatherEditCanceled) return;
  if (locked.value || editorPanel.value !== "view") { cancelWeatherDraft(); return; }
  try {
    commit({ ...props.modelValue, weather: weatherDraft.value });
    weatherDraft.value = undefined;
  } catch (error) { cancelWeatherDraft(); fail(error); }
}
function cancelWeatherDraft() {
  if (!weatherDraft.value) return false;
  // ACT: ElSlider 松手后仍会再次发送当前位置，取消后忽略该笔晚到事件，下一次真实输入才重新开启。
  weatherEditCanceled = true;
  weatherDraft.value = undefined;
  if (!disposed) viewport?.sync(viewportDocument());
  return true;
}
function toggleWeatherLayer(key: WeatherLayerKey) {
  cancelWeatherDraft();
  updateWeatherLayers({ ...weatherLayers.value, [key]: weatherLayers.value[key] > 0 ? 0 : 1 });
}
function clearWeatherLayers() { updateWeatherLayers(getWeatherLayers()); }
function updateWeatherLayers(layers: NonNullable<SceneWeather["layers"]>) {
  updateWeather({ layers, condition: weatherLayerOptions.find(layer => (layers[layer.key] ?? 0) > 0)?.condition ?? "clear" });
}
function beginTerrainColor() { terrainColorEditingId = selectedTerrainPaint.value?.id; }
function commitTerrainColor(event: Event) {
  if (terrainColorEditingId !== selectedTerrainPaint.value?.id) { cancelTerrainColor(); return; }
  applyTerrainColor((event.target as HTMLInputElement).value);
}
function previewTerrainColor(event: Event) {
  const color = (event.target as HTMLInputElement).value;
  const surface = selectedTerrainPaint.value;
  if (locked.value || !surface || terrainColorEditingId !== surface.id || !/^#[a-f\d]{6}$/i.test(color)) return;
  viewport?.cancelTerrainStroke();
  terrainColorDraft.value = color;
}
function cancelTerrainColor() {
  if (!terrainColorDraft.value && terrainColorEditingId === undefined) return false;
  terrainColorEditingId = undefined;
  terrainColorDraft.value = "";
  return true;
}
function applyTerrainColor(color: string) {
  const surface = selectedTerrainPaint.value;
  if (locked.value || !surface || !/^#[a-f\d]{6}$/i.test(color)) return false;
  viewport?.cancelTerrainStroke();
  cancelTerrainColor();
  const colors = { ...terrainBrushColors.value };
  if (color.toLowerCase() === surface.color.toLowerCase()) delete colors[String(surface.id)];
  else colors[String(surface.id)] = color.toLowerCase();
  terrainBrushColors.value = colors;
  return true;
}
function chooseTerrainBrush(brush: TerrainBrush) {
  if (locked.value) return;
  terrainBrush.value = brush;
  if (brush === "ramp" && terrainTargetHeight.value === 0) terrainTargetHeight.value = 3;
  terrainPainting.value = true;
}
function changeTerrainTargetHeight(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!locked.value && input.checkValidity() && Number.isFinite(input.valueAsNumber)) terrainTargetHeight.value = input.valueAsNumber;
  else input.value = String(terrainTargetHeight.value);
}
function updateTerrain(terrain: SceneTerrain) {
  if (locked.value) return false;
  try {
    viewport?.sync({ ...props.modelValue, terrain });
    const placements = new Map(viewport?.getObjectPlacements().map(placement => [placement.id, placement]) ?? []);
    const objects = props.modelValue.objects.map(object => {
      const placement = placements.get(object.id);
      return placement ? { ...object, ...placement } : object;
    });
    commit({ ...props.modelValue, terrain, objects });
    return true;
  } catch (error) { viewport?.sync(viewportDocument()); fail(error); return false; }
}
async function applySceneBrush(objects: SceneObject[]) {
  if (locked.value || disposed || !objects.length) return;
  const base = props.modelValue;
  const version = ++sceneBrushVersion;
  busy.value = translate("完成绘制");
  try {
    // 笔刷只追加物件，已有文档和分组已经校验；新物件仍走导入时的完整物件规则。
    const accepted = parseSceneDocument({ ...createSceneDocument(), objects }).objects;
    const prepared = new Map<string, SceneAsset>();
    for (const object of accepted) {
      if (!object.asset.url || prepared.has(object.asset.id)) continue;
      operationController.signal.throwIfAborted();
      prepared.set(object.asset.id, await props.prepareAsset(object.asset, operationController.signal));
    }
    operationController.signal.throwIfAborted();
    if (disposed || version !== sceneBrushVersion) return;
    const scene = props.modelValue;
    if (sceneChangedSince(scene, base)) throw new Error("场景已发生修改，本笔绘制未覆盖当前场景，请重新绘制");
    const added = prepared.size ? parseSceneDocument({ ...createSceneDocument(), objects: accepted.map(object => ({ ...object, asset: prepared.get(object.asset.id) ?? object.asset })) }).objects : accepted;
    appendValidatedObjects(scene, added);

    subjectId.value = "";
    await nextTick();
    await viewport?.whenReady();
  } catch (error) { if (!disposed && version === sceneBrushVersion) { viewport?.sync(viewportDocument()); fail(error); } }
  finally { if (!disposed && version === sceneBrushVersion) busy.value = ""; }
}

// ACT: 空场景一键布景：复用AI的布景工具在本地搭整套景，一次提交可撤销；搭的过程中场景被改就不覆盖。
const setTemplateIcons = { 古装: IconBuildingPavilion, 现代: IconBuildingSkyscraper, 奇幻: IconWand, 民国: IconBuildingArch } as const;
// 一键布景按题材筛：点一个题材只看这类景，再点一次回到全部。
const setTemplateGenres = markMessages(["古装", "民国", "现代", "奇幻"] as const).filter(genre => setTemplates.some(template => template.genre === genre));
const setGenre = ref<"" | (typeof setTemplateGenres)[number]>("");
const visibleSetTemplates = computed(() => setGenre.value ? setTemplates.filter(template => template.genre === setGenre.value) : setTemplates);
// 已有场景（素材库“整套景”）：在当前视野中心附近找一块放得下的空地，保留原有物体和时间。
async function applySetTemplate(template: SetTemplate) {
  if (locked.value || disposed) return;
  const base = props.modelValue;
  let at = { x: 0, z: 0 };
  if (base.objects.length) {
    const target = viewport?.getView().target ?? base.view.target;
    const spot = findSetTemplateSpot(template, base, { x: target.x, z: target.z });
    if (!spot) { fail(new Error(`场景里没有足够的空地放下${template.name}（约${template.half[0] * 2}×${template.half[1] * 2}米），可删掉一些物体或扩大世界后再试`)); return; }
    at = spot;
  }
  busy.value = t`搭建${translate(template.name)}`;
  try {
    const next = await buildSetTemplate(template, base, operationController.signal, at);
    if (disposed) return;
    if (sceneChangedSince(props.modelValue, base)) throw new Error("场景已发生修改，未覆盖当前场景，请重新选择布景");
    commit(next);
    if (editorPanel.value !== "life") performanceHint.value = true;
    await nextTick();
    await viewport?.whenReady();
    fitSeatedPeople();
  } catch (error) { if (!disposed) fail(error); }
  finally { if (!disposed) busy.value = ""; }
}

/**
 * 入座校正：坐着的胶囊人默认座面在身下0.45米，椅子、长凳、吧凳、官椅的真实座面高低不一，有的长椅靠背正好在人身上。
 * 搭完景按射线实测：大腿下面几处往下打取最低的座面（高过0.92米的是桌面、柜台，不算），身子那一列打到比座面高0.2米以上的东西（靠背）就往前挪到让开为止，
 * 再把人放到座面上；差不到3厘米不动。并进上一步撤销。
 */
function fitSeatedPeople() {
  if (!viewport) return;
  const document = props.modelValue;
  const peopleIds = document.objects.filter(object => /person/i.test(object.asset.shape ?? "")).map(object => object.id);
  let changed = 0;
  const objects = document.objects.map(object => {
    if (object.asset.shape !== "seatedPerson" || !object.visible) return object;
    const angle = object.rotation.y * Math.PI / 180, fx = Math.sin(angle), fz = Math.cos(angle);
    const base = object.position.y;
    // along：沿人的正面方向的偏移；返回(base+0.2, base+limit]内最高的表面，没有就undefined。
    const surface = (shift: number, along: number, limit: number, headroom = 0) => {
      const x = object.position.x + fx * (shift + along), z = object.position.z + fz * (shift + along), top = base + limit;
      const hit = viewport!.sightBlocked({ x, y: top, z }, { x, y: base + 0.2, z }, peopleIds);
      if (hit === undefined) return undefined;
      const y = top - hit;
      // 座面上方要空出headroom（坐得下身子）：射线起点落在桌板里时打到的是桌板底面，上面紧贴着桌面，不是座位。
      return headroom && viewport!.sightBlocked({ x, y: y + headroom, z }, { x, y: y + 0.03, z }, peopleIds) !== undefined ? undefined : y;
    };
    // 座面取几处里偏低的中位数：座沿的倒角、伸到大腿上方的桌面都不会带偏（射线起点前5厘米不算，从0.93米打下来最高认到0.88米的吧凳）。
    const seatAt = (shift: number) => {
      const heights = [0.02, 0.08, 0.14, 0.2].map(along => surface(shift, along, 0.93, 0.6)).filter((value): value is number => value !== undefined).sort((a, b) => a - b);
      return heights.length ? heights[Math.floor((heights.length - 1) / 2)] : undefined;
    };
    let shift = 0, seat = seatAt(0);
    if (seat === undefined) return object;
    // 身子在本地 z=-0.30..0.14（中心-0.08、半径0.22）：这一段每7厘米打一列，薄靠背也能打到。
    const backrest = (at: number, height: number) => [-0.26, -0.19, -0.12, -0.05, 0.02, 0.09].some(along => { const top = surface(at, along, 1.3); return top !== undefined && top > height + 0.2; });
    if (backrest(0, seat)) {
      shift = [0.08, 0.16, 0.24, 0.32].find(step => { const next = seatAt(step); return next !== undefined && !backrest(step, next); }) ?? 0;
      if (shift) seat = seatAt(shift)!;
    }
    const y = Math.round((seat - 0.45) * 1000) / 1000;
    if (!shift && Math.abs(y - base) < 0.03) return object;
    changed++;
    const position = { x: Math.round((object.position.x + fx * shift) * 1000) / 1000, y, z: Math.round((object.position.z + fz * shift) * 1000) / 1000 };
    return { ...object, position, height: y };
  });
  if (changed) commit({ ...document, objects }, false);
}

function appendValidatedObjects(scene: SceneDocument, added: SceneObject[]) {
  const ids = new Set(scene.objects.map(object => object.id));
  if (added.some(object => ids.has(object.id))) throw new Error("场景物体 ID 不能重复");
  publishScene({ ...scene, objects: [...scene.objects, ...added] }, true);
}

function sceneChangedSince(scene: SceneDocument, base: SceneDocument) {
  return (!sharesSceneContent(scene, base) || scene.time !== base.time) && !sameSceneContent(scene, base);
}

function commit(value: SceneDocument, remember = true) {
  const next = parseSceneDocument(value);
  const current = latestScene();
  if (sameJson(next, current)) return;
  publishScene(next, remember);
}
// ACT: 同一拍里连着改两次（例如加关键点后马上跳播放头）时宿主还没把新文档传回来；
// 后一笔基于刚发出的文档继续改，不会拿旧文档把前一笔盖掉。宿主一传回新文档就恢复以它为准。
let published: { base: SceneDocument; next: SceneDocument } | undefined;
function latestScene() { return published && published.base === props.modelValue ? published.next : props.modelValue; }
function commitPresentation(patch: Partial<Pick<SceneDocument, "view" | "time">>, remember = false) {
  const scene = latestScene();
  const view = patch.view ? sceneViewSchema.parse(patch.view) : scene.view;
  const time = patch.time ? sceneTimeSchema.parse(patch.time) : scene.time;
  if (JSON.stringify([view, time]) === JSON.stringify([scene.view, scene.time])) return;
  // 只替换已校验的镜头/时刻。场景导入、AI 提案与物体编辑仍校验整份文档。
  publishScene({ ...scene, view, time }, remember);
}
function publishScene(next: SceneDocument, remember: boolean) {
  if (remember) {
    const timeChanged = JSON.stringify(next.time) !== JSON.stringify(props.modelValue.time);
    history.value = [...history.value.slice(-19), historySnapshot(timeChanged, next.life?.seed !== props.modelValue.life?.seed)];
    redoHistory.value = [];
  }
  published = { base: props.modelValue, next };
  emit("update:modelValue", next);
}
function historySnapshot(timeChanged: boolean, lifeTimeChanged: boolean): SceneHistory {
  // 节点和编辑器都按整份文档替换。快照可共享旧模型和地形，只复制需要冻结的运行时钟。
  const document = { ...props.modelValue };
  if (timeChanged && viewport) document.time = viewport.getWorldTime();
  if (document.life && viewport) document.life = { ...document.life, time: Math.min(86400, viewport.getLifeTime()) };
  return { document, timeChanged, lifeTimeChanged };
}
function undo() {
  if (performanceDraft.value) { undoPerformanceRoutePoint(); return; }
  if (locked.value || abortObjectHandleDrag() || viewport?.cancelObjectDrag() || viewport?.cancelSceneBrush() || viewport?.cancelTerrainStroke() || cancelCameraGesture() || cancelTerrainColor() || cancelAtmosphereDraft() || cancelTimeDraft() || cancelWeatherDraft() || cancelObjectDraft() || !history.value.length) return;

  const previous = history.value.at(-1)!;
  if (previous.timeChanged) viewport?.markWorldTimeJump();
  redoHistory.value = [...redoHistory.value.slice(-19), historySnapshot(previous.timeChanged, previous.lifeTimeChanged)];
  history.value = history.value.slice(0, -1);
  const life = previous.document.life;
  // 历史只恢复编辑内容，镜头取实时视口，避免回退到快照或尚未同步的旧视角。
  commit({ ...previous.document, view: viewport?.getView() ?? props.modelValue.view, time: previous.timeChanged ? previous.document.time : props.modelValue.time, life: life && !previous.lifeTimeChanged ? { ...life, time: Math.min(86400, viewport?.getLifeTime() ?? life.time) } : life }, false);
}
function redo() {
  if (performanceDraft.value) return;
  if (locked.value || abortObjectHandleDrag() || viewport?.cancelObjectDrag() || viewport?.cancelSceneBrush() || viewport?.cancelTerrainStroke() || cancelCameraGesture() || cancelTerrainColor() || cancelAtmosphereDraft() || cancelTimeDraft() || cancelWeatherDraft() || cancelObjectDraft() || !redoHistory.value.length) return;

  const next = redoHistory.value.at(-1)!;
  if (next.timeChanged) viewport?.markWorldTimeJump();
  redoHistory.value = redoHistory.value.slice(0, -1);
  history.value = [...history.value.slice(-19), historySnapshot(next.timeChanged, next.lifeTimeChanged)];
  const life = next.document.life;
  commit({ ...next.document, view: viewport?.getView() ?? props.modelValue.view, time: next.timeChanged ? next.document.time : props.modelValue.time, life: life && !next.lifeTimeChanged ? { ...life, time: Math.min(86400, viewport?.getLifeTime() ?? life.time) } : life }, false);
}

/** 画面里没被面板挡住的那块区域的中心（屏幕坐标）：避开左边的素材面板、右边的编辑面板和底部的对话框、时间轴。 */
function visibleCenter() {
  const rect = canvas.value?.getBoundingClientRect();
  if (!rect) return undefined;
  let left = rect.left, right = rect.right, top = rect.top + 64, bottom = rect.bottom;
  for (const element of studioRoot.value?.querySelectorAll<HTMLElement>(".assetPanel, .editPanel, .quickCreation, .timelinePanel") ?? []) {
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    if (box.height > rect.height * 0.45 && box.left < rect.left + rect.width / 2) left = Math.max(left, box.right);
    else if (box.height > rect.height * 0.45) right = Math.min(right, box.left);
    else if (box.top > rect.top + rect.height / 2) bottom = Math.min(bottom, box.top);
  }
  return right - left > 120 && bottom - top > 120 ? { x: (left + right) / 2, y: (top + bottom) / 2 } : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
/** 别的物体占住的地面圆（中心与半径）。 */
function objectFootprints(except = "") {
  return props.modelValue.objects.filter(object => object.visible && object.id !== except).map(object => {
    const bounds = viewport?.getBounds(object.id);
    return bounds ? { x: bounds.center.x, z: bounds.center.z, radius: Math.max(0.4, Math.max(bounds.size.x, bounds.size.z) / 2) } : { x: object.position.x, z: object.position.z, radius: 0.8 };
  });
}
/** 从center起沿螺旋找第一个放得下半径radius的空位。 */
function freeSpot(center: { x: number; z: number }, radius: number, except = "") {
  const taken = objectFootprints(except);
  const step = Math.max(1.2, radius);
  for (let index = 0; index < 60; index++) {
    const angle = index * 2.39996, distance = index ? step * Math.sqrt(index) : 0;
    const x = center.x + Math.cos(angle) * distance, z = center.z + Math.sin(angle) * distance;
    if (taken.every(other => Math.hypot(other.x - x, other.z - z) > other.radius + radius + 0.3)) return { x, z };
  }
  return center;
}
function newAssetPosition(position?: Vector3Value) {
  const point = visibleCenter();
  const surface = position ?? (point ? viewport?.groundPoint(point.x, point.y) : undefined) ?? { x: 0, y: 0, z: 0 };
  if (position) return { ...surface, y: surface.y + 0.5 };
  // ACT: 点一下素材就放在画面里看得见的中央；那里已经有东西时沿螺旋找最近的空位，连点几个不会叠在一起。
  const spot = freeSpot(surface, 0.8);
  return { x: spot.x, y: (viewport?.getGroundHeight(spot.x, spot.z) ?? surface.y) + 0.5, z: spot.z };
}
/** 新模型载入后按真实大小再检查一次：压到别的物体就挪到最近的空位（并入添加这一步，不另记撤销）。 */
async function settleNewObject(id: string) {
  await viewport?.whenReady();
  const object = props.modelValue.objects.find(item => item.id === id);
  const bounds = viewport?.getBounds(id);
  if (!object || !bounds || disposed) return;
  const radius = Math.max(0.4, Math.max(bounds.size.x, bounds.size.z) / 2);
  const spot = freeSpot({ x: bounds.center.x, z: bounds.center.z }, radius, id);
  const dx = spot.x - bounds.center.x, dz = spot.z - bounds.center.z;
  if (Math.hypot(dx, dz) < 0.05) return;
  const x = object.position.x + dx, z = object.position.z + dz;
  commit({ ...props.modelValue, objects: props.modelValue.objects.map(item => item.id === id ? { ...item, position: { ...item.position, x, z } } : item) }, false);
}
async function addAsset(asset: SceneAsset, position?: Vector3Value) {
  if (locked.value) return;
  busy.value = t`载入${asset.name}`;
  let added = "";
  try {
    const prepared = await props.prepareAsset(asset, operationController.signal);
    if (disposed) return;
    const object = createSceneObject(prepared, newAssetPosition(position));
    commit({ ...props.modelValue, objects: [...props.modelValue.objects, object] });
    added = object.id;
  } catch (error) { fail(error); }
  finally { if (!disposed) busy.value = ""; }
  // 新放的模型直接选中（等载入锁解除后），马上可以搬动、转向、调高度。
  if (added && !disposed) { await nextTick(); selectObject(added); if (!position) await settleNewObject(added); }
}
function cancelAssetDragFrame() {
  if (assetDragFrame !== undefined) assetDragWindow?.cancelAnimationFrame(assetDragFrame);
  assetDragFrame = undefined;
}
function cancelAssetPlacement() {
  cancelAssetDragFrame();
  assetPlacementVersion++;
  draggedAsset.value = undefined;
  assetPlacementLoading.value = false;
  assetDragPoint = undefined;
  dragOver.value = false;
  viewport?.endAssetPlacement();
}
function updateAssetDragMessage(placement: AssetPlacement | null) {
  assetDragMessage.value = assetPlacementLoading.value ? t`正在载入${draggedAsset.value?.name ?? translate("模型")}，请稍候再放置` : placement?.valid ? translate("松开，将素材放入场景") : placement?.reason ? translate(placement.reason) : translate("请移动到可放置的表面");
}
async function startAssetPlacement(asset: SceneAsset) {
  cancelAssetPlacement();
  if (locked.value || !viewport || disposed) return;

  draggedAsset.value = asset;
  assetPlacementLoading.value = true;
  const version = assetPlacementVersion;
  try {
    await viewport.beginAssetPlacement(asset);
    if (disposed || version !== assetPlacementVersion) return;
    assetPlacementLoading.value = false;
    if (assetDragPoint) scheduleAssetDrag();
  } catch (error) { if (!disposed && version === assetPlacementVersion) { cancelAssetPlacement(); fail(error); } }
}
function isAssetCanvasPoint(x: number, y: number) {
  const element = canvas.value;
  if (!element || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  return element.ownerDocument.elementFromPoint(x, y) === element;
}
function scheduleAssetDrag() {
  if (assetDragFrame !== undefined || !assetDragWindow) return;
  assetDragFrame = assetDragWindow.requestAnimationFrame(() => {
    assetDragFrame = undefined;
    const point = assetDragPoint;
    if (!point || !viewport || !draggedAsset.value) return;
    if (isAssetCanvasPoint(point.x, point.y)) {
      dragOver.value = true;
      updateAssetDragMessage(assetPlacementLoading.value ? null : viewport.updateAssetPlacement(point.x, point.y));
    } else if (dragOver.value) {
      dragOver.value = false;
      viewport.updateAssetPlacement(Number.NaN, Number.NaN);
    }
  });
}
function moveAssetPlacement(x: number, y: number) {
  if (!draggedAsset.value || locked.value || !viewport) return;
  assetDragPoint = { x, y };
  scheduleAssetDrag();
}
async function dropAsset(x: number, y: number) {
  const asset = draggedAsset.value;
  if (!asset || locked.value || !viewport || !isAssetCanvasPoint(x, y)) { cancelAssetPlacement(); return; }
  const placement = viewport.updateAssetPlacement(x, y, true);
  if (assetPlacementLoading.value || !placement?.valid) {
    fail(new Error(assetPlacementLoading.value ? "模型仍在载入，请加载完成后重新拖入" : placement?.reason || "此处无法放置素材"));
    cancelAssetPlacement();
    return;
  }
  const values = { position: { ...placement.position }, rotation: { ...placement.rotation }, scale: { ...placement.scale }, height: placement.height, gravityEnabled: placement.gravityEnabled };
  const version = ++assetDropVersion;
  const base = props.modelValue;
  cancelAssetPlacement();
  busy.value = t`放置${asset.name}`;
  let dropped = "";
  try {
    const prepared = await props.prepareAsset(asset, operationController.signal);
    if (disposed || version !== assetDropVersion) return;
    operationController.signal.throwIfAborted();
    const scene = props.modelValue;
    if (sceneChangedSince(scene, base)) throw new Error("场景已发生修改，请重新拖放素材");
    const object = { ...createSceneObject(prepared, values.position), ...values };
    const added = parseSceneDocument({ ...createSceneDocument(), objects: [object] }).objects;
    appendValidatedObjects(scene, added);
    dropped = added[0]?.id ?? "";
  } catch (error) { if (!disposed && version === assetDropVersion) fail(error); }
  finally { if (!disposed && version === assetDropVersion) busy.value = ""; }
  if (dropped && !disposed && version === assetDropVersion) { await nextTick(); selectObject(dropped); }
}
async function importFile(file: File) {
  if (locked.value) return;
  busy.value = translate("导入模型");
  try {
    const asset = await props.importModel(file, operationController.signal);
    if (disposed) return;
    commit({ ...props.modelValue, objects: [...props.modelValue.objects, createSceneObject(asset, newAssetPosition())] });
  } catch (error) { fail(error); }
  finally { if (!disposed) busy.value = ""; }
}

const sessionBusy = computed(() => !!aiController.value || compacting.value);
let sessionsLoaded = !props.conversationStore;
let sessionSave: Promise<void> | undefined;
let sessionSaveQueued = false;
let sessionSaveFailed = false;
function saveSessions() {
  const store = props.conversationStore;
  if (!store || !sessionsLoaded) return;
  if (sessionSave) { sessionSaveQueued = true; return; }
  sessionSave = store.save(storeAgentSessions(historySessions.value, activeSessionId.value)).then(() => { sessionSaveFailed = false; }, error => {
    if (!disposed && !sessionSaveFailed) notice.value = t`对话没有保存下来：${error instanceof Error ? error.message : translate("写入失败")}`;
    sessionSaveFailed = true;
  }).finally(() => {
    sessionSave = undefined;
    if (sessionSaveQueued) { sessionSaveQueued = false; saveSessions(); }
  });
}
async function loadSessions() {
  const store = props.conversationStore;
  if (!store) return;
  try {
    const restored = restoreAgentSessions(await store.load(operationController.signal));
    if (disposed) return;
    // 读取期间用户可能已经开聊：当前对话留着，读回的排在后面。
    const started = sessions.value.filter(session => session.messages.length);
    const ids = new Set(started.map(session => session.id));
    const loaded = restored.sessions.filter(session => !ids.has(session.id));
    if (loaded.length) {
      sessions.value = [...(started.length ? sessions.value : []), ...loaded];
      if (!started.length) activeSessionId.value = restored.activeId || historySessions.value[0]!.id;
    }
    sessionsLoaded = true;
    if (started.length) saveSessions();
  } catch (error) {
    if (!disposed && !operationController.signal.aborted) notice.value = t`历史对话没有读出来，本次对话不会保存：${error instanceof Error ? error.message : translate("读取失败")}`;
  }
}
function newSession() {
  if (sessionBusy.value) return;
  // 当前已经是空对话就不再新建，直接让用户输入。
  if (messages.value.length) {
    const session = createAgentSession();
    sessions.value = [session, ...historySessions.value.slice(0, maxSessions - 1)];
    activeSessionId.value = session.id;
    saveSessions();
  }
  void nextTick(() => promptInput.value?.focus({ preventScroll: true }));
}
function selectSession(id: string) {
  if (sessionBusy.value || id === activeSessionId.value || !sessions.value.some(session => session.id === id)) return;
  activeSessionId.value = id;
  sessions.value = sessions.value.filter(session => session.messages.length);
  saveSessions();
}
function renameSession(id: string, name: string) {
  const session = sessions.value.find(session => session.id === id);
  const value = name.trim().slice(0, 80);
  if (!session || !value || value === agentSessionName(session)) return;
  session.name = value;
  saveSessions();
}
// 和宿主一样：点一下就移除，只剩一段对话时不能移除。
function removeSession(id: string) {
  if (sessionBusy.value || historySessions.value.length <= 1 || !historySessions.value.some(session => session.id === id)) return;
  sessions.value = sessions.value.filter(session => session.id !== id);
  if (!sessions.value.some(session => session.id === activeSessionId.value)) activeSessionId.value = historySessions.value[0]!.id;
  saveSessions();
}
/** 把 fold 这些较早的消息折成记忆摘要（并入已有摘要），之后每轮只带摘要和没折的消息。 */
async function compactSession(session: AgentSession, fold: AgentMessage[], signal: AbortSignal) {
  if (!fold.length) return false;
  if (!props.generateText || !selectedAiModel.value) throw new Error("请先选择模型");
  compacting.value = true;
  try {
    const summary = await props.generateText({ modelKey: modelKey.value, systemPrompt: compactionSystemPrompt, prompt: compactionPrompt(session.summary, fold), signal });
    signal.throwIfAborted();
    if (!applyCompaction(session, summary, fold.at(-1)!.id)) throw new Error("模型没有返回摘要");
    saveSessions();
    return true;
  } finally { compacting.value = false; }
}
async function compactNow() {
  if (sessionBusy.value || locked.value || !canCompact.value) return;
  if (!selectedAiModel.value) { notice.value = translate("请先在下方选择模型，再压缩上下文。"); modelPicker.value?.open(); return; }
  const controller = new AbortController();
  compactionController.value = controller;
  const session = activeSession.value;
  try { await compactSession(session, compactableMessages(session, 2), AbortSignal.any([controller.signal, operationController.signal])); }
  catch (error) { if (!disposed && !controller.signal.aborted) notice.value = t`上下文压缩没有完成：${error instanceof Error ? error.message : translate("摘要生成失败")}`; }
  finally { compactionController.value = undefined; }
}
/** 给附图做一张 160px 的小图：存盘和释放旧原图后，对话里还能看到发过什么。 */
async function createThumbnail(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, 160 / Math.max(image.naturalWidth, image.naturalHeight, 1));
  const surface = window.document.createElement("canvas");
  surface.width = Math.max(1, Math.round(image.naturalWidth * scale));
  surface.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = surface.getContext("2d");
  if (!context) throw new Error("无法生成缩略图");
  context.drawImage(image, 0, 0, surface.width, surface.height);
  return surface.toDataURL("image/jpeg", 0.72);
}

function activeAssistantMessage() {
  return messages.value.find(message => message.role === "assistant" && message.streaming);
}
function finishAssistantMessage(message: AgentMessage | undefined, status: "success" | "error" | "interrupted", summary = "", error = "") {
  if (!message) return;
  if (activeReplyStream) {
    activeReplyStream.finish(status);
    activeReplyStream = undefined;
  } else message.streaming = false;
  message.endedAt = performance.now();
  message.statusText = "";
  // 模型自己写过说明时，只补上它没写到的那几行（预演阻塞、自动分镜、没做完的说明、生成期间你的改动已保留），原来这些会被直接丢掉。
  const shown = message.parts?.filter((part): part is AgentTextPart => part.type === "text").map(part => part.content).join("\n") ?? "";
  const extra = shown.trim() ? summary.split("\n").map(line => line.trim()).filter(line => line && !shown.includes(line)).join("\n") : summary;
  if (extra) {
    message.parts ??= [];
    message.parts.push({ id: crypto.randomUUID(), type: "text", content: extra });
    message.content = shown.trim() ? `${message.content}\n\n${extra}` : extra;
  }
  if (error) message.error = error;
  // 每个会话保留最近 120 条消息，更早轮次的原图和观察截图随之释放；带给模型的历史由摘要 + 未压缩消息组成。
  const session = activeSession.value;
  session.updatedAt = Date.now();
  trimSession(session);
  saveSessions();
}
function flushAiProgress() {
  if (aiProgressFrame) cancelAnimationFrame(aiProgressFrame);
  aiProgressFrame = 0;
  const message = activeAssistantMessage();
  for (const event of pendingAiProgress.values()) {
    if (!message) continue;
    if (event.type === "status") {
      if (event.warning) {
        const warnings = message.warnings ?? (message.warnings = []);
        if (!warnings.includes(event.message)) message.warnings = [...warnings.slice(-3), event.message];
      } else message.statusText = event.message;
    } else if (event.type === "image") {
      const views = message.views ?? (message.views = []);
      const view = { id: event.id, label: event.label, src: event.src };
      const index = views.findIndex(item => item.id === event.id);
      if (index >= 0) views[index] = view;
      else views.push(view);
      if (views.length > 8) views.splice(0, views.length - 8);
    } else if (event.type === "complete") message.statusText = "模型回复已完成，正在接入场景";
    else if (event.type === "tool" || event.type === "text" || event.type === "thinking" || event.type === "question") activeReplyStream?.receive(event);
  }
  pendingAiProgress.clear();
}
function receiveAiProgress(event: CreationProgress) {
  // 引导交给模型的那一刻立刻拆分回复：先把攒着的进度落到前一段，后面的进展进新的一段。
  if (event.type === "steered") { flushAiProgress(); splitForSteering(event.ids); return; }
  const key = event.type === "tool" || event.type === "text" || event.type === "thinking" || event.type === "image" || event.type === "question" ? `${event.type}:${event.id}` : event.type === "status" && event.warning ? `warning:${event.message}` : event.type;
  pendingAiProgress.set(key, event);
  aiProgressFrame ||= requestAnimationFrame(flushAiProgress);
}
function clearAiTimers() {
  if (aiProgressFrame) cancelAnimationFrame(aiProgressFrame);
  aiProgressFrame = 0;
}
function previewAiDocument(value: SceneDocument | null) {
  if (disposed || !aiController.value || aiController.value.signal.aborted) return;
  try {
    aiPreviewDocument.value = value ? parseSceneDocument(value) : undefined;
    viewport?.setWorldTimePreview(JSON.stringify(aiPreviewDocument.value?.time) !== JSON.stringify(props.modelValue.time) ? aiPreviewDocument.value?.time : undefined);
    viewport?.sync({ ...viewportDocument(), view: viewport.getView() });
  } catch (error) {
    receiveAiProgress({ type: "status", warning: true, message: `草稿预览暂不可用：${error instanceof Error ? error.message : "模型仍在载入"}` });
  }
}
function selectPromptImages(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  void addPromptFiles(files);
}
async function addPromptImages(files: File[]) {
  if (!files.length || locked.value) return;
  if (imagesReading.value) { fail(new Error("正在读取图片，请稍候再添加。")); return; }
  try {
    validatePromptImages(files, promptImages.value.map(image => image.bytes));
    imagesReading.value = true;
    const added: PromptImage[] = [];
    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error(`无法读取图片“${file.name}”。`));
        reader.onerror = () => reject(new Error(`无法读取图片“${file.name}”，请重新选择。`));
        reader.readAsDataURL(file);
      });
      const image = new Image();
      image.src = dataUrl;
      try { await image.decode(); }
      catch { throw new Error(`图片“${file.name}”无法打开，请选择有效图片。`); }
      added.push({ id: crypto.randomUUID(), name: file.name || "粘贴图片", dataUrl, bytes: file.size });
    }
    if (disposed) return;
    promptImages.value = [...promptImages.value, ...added];
    if (!voiceActive.value) promptInput.value?.focus({ preventScroll: true });
  } catch (error) { fail(error); }
  finally { imagesReading.value = false; }
}
// ===== ACT: 输入框（与宿主画布 Agent 对齐）=====
const composerPlaceholder = computed(() => voiceActive.value ? translate("正在听，请说话…") : aiController.value ? translate("Enter 排队，Ctrl + Enter 引导当前任务") : isPerformanceConversation.value ? translate("继续描述要修改的动作、时间或速度…") : translate("描述场景或修改要求，@ 提及，/ 技能"));
const sendDisabled = computed(() => aiController.value
  ? !prompt.value.trim() || !!editingMessageId.value || voiceActive.value
  : locked.value || compacting.value || !!performanceDraft.value || voiceActive.value || imagesReading.value || (!prompt.value.trim() && !promptImages.value.length && !promptDocuments.value.length) || !selectedAiModel.value || !props.generateAi);
const sendTitle = computed(() => aiController.value ? "排队发送，本轮完成后处理（Enter）；Ctrl/Cmd + Enter 引导当前任务" : performanceDraft.value ? "请先完成或取消路线" : editingMessageId.value ? "重发消息（Enter）" : "发送（Enter；Shift + Enter 换行）");
const peopleShapes = new Set(["person", "riggedPerson", "seatedPerson"]);
const promptMenuState = computed<{ open: boolean; kind: "mention" | "skill"; items: PromptMenuItem[]; start: number }>(() => {
  const closed = { open: false, kind: "mention" as const, items: [], start: 0 };
  if (promptMenuDismissed.value || locked.value || voiceActive.value) return closed;
  const before = prompt.value.slice(0, Math.min(promptCaret.value, prompt.value.length));
  const skill = /^\/([^\s/]*)$/.exec(before);
  if (skill && props.listSkills && !aiController.value) {
    const query = skill[1]!.replace(/^skill:/, "").toLowerCase();
    const items = (hostSkills.value ?? []).filter(item => !query || item.name.toLowerCase().includes(query) || item.displayName.toLowerCase().includes(query))
      .slice(0, 30).map(item => ({ id: `skill:${item.name}`, label: item.displayName, hint: item.description, kind: "skill" as const, value: item.name }));
    return { open: true, kind: "skill", items, start: 0 };
  }
  const mention = /(?:^|[^\w@])@([^\s@]*)$/.exec(before);
  if (!mention) return closed;
  const query = mention[1]!.toLowerCase();
  const scene = aiPreviewDocument.value ?? props.modelValue;
  const objects = scene.objects.filter(object => !query || object.name.toLowerCase().includes(query))
    .sort((a, b) => Number(peopleShapes.has(b.asset.shape ?? "")) - Number(peopleShapes.has(a.asset.shape ?? "")))
    .map(object => peopleShapes.has(object.asset.shape ?? "")
      ? { id: object.id, label: object.name, hint: "人物", kind: "person" as const, value: object.name }
      : { id: object.id, label: object.name, hint: object.asset.name !== object.name ? object.asset.name : "", kind: "object" as const, value: object.name });
  const cameras = (scene.cameras ?? []).filter(camera => !query || camera.name.toLowerCase().includes(query)).map(camera => ({ id: `camera:${camera.id}`, label: camera.name, hint: "机位", kind: "camera" as const, value: camera.name }));
  return { open: true, kind: "mention", items: [...objects, ...cameras].slice(0, 40), start: before.length - mention[1]!.length - 1 };
});
watch(() => promptMenuState.value.open && promptMenuState.value.kind === "skill", open => { if (open) void loadSkills(); });
async function loadSkills() {
  if (!props.listSkills || skillsLoading.value) return;
  skillsLoading.value = !hostSkills.value;
  try { hostSkills.value = await props.listSkills(operationController.signal); }
  catch { hostSkills.value ??= []; }
  finally { skillsLoading.value = false; }
}
function resizePrompt() {
  const element = promptInput.value;
  if (!element) return;
  element.style.height = "auto";
  const max = Math.max(60, Math.min(240, window.innerHeight * 0.3));
  element.style.height = `${Math.min(element.scrollHeight, max)}px`;
  element.style.overflowY = element.scrollHeight > max ? "auto" : "hidden";
}
watch(prompt, () => void nextTick(resizePrompt));
function updatePromptMenu() {
  promptCaret.value = promptInput.value?.selectionStart ?? prompt.value.length;
  promptMenuDismissed.value = false;
}
function promptKeyup(event: KeyboardEvent) {
  if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) promptCaret.value = promptInput.value?.selectionStart ?? prompt.value.length;
}
function promptKeydown(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) return;
  if (promptMenu.value?.handleKeydown(event)) { event.preventDefault(); event.stopPropagation(); return; }
  if (event.key === "Escape" && editingMessageId.value) { event.preventDefault(); event.stopPropagation(); cancelEditMessage(); return; }
  if (event.key !== "Enter" || event.shiftKey || event.altKey) return;
  event.preventDefault();
  submitPrompt(event.ctrlKey || event.metaKey ? "steer" : "followUp");
}
function selectPromptMenuItem(item: PromptMenuItem) {
  const state = promptMenuState.value;
  const text = prompt.value;
  const caret = Math.min(promptCaret.value, text.length);
  const insert = item.kind === "skill" ? `/skill:${item.value} ` : `@${item.value} `;
  const start = state.kind === "skill" ? 0 : state.start;
  prompt.value = text.slice(0, start) + insert + text.slice(caret);
  const next = start + insert.length;
  promptCaret.value = next;
  void nextTick(() => {
    const element = promptInput.value;
    if (!element) return;
    element.focus();
    element.setSelectionRange(next, next);
    resizePrompt();
  });
}
/** 空闲时发送；生成中按宿主的做法排队（Enter）或作为引导交给正在干活的 Agent（Ctrl/Cmd + Enter）。 */
function submitPrompt(mode: "steer" | "followUp" = "followUp") {
  if (aiController.value) { queuePrompt(mode); return; }
  void runAi();
}
function queuePrompt(mode: "steer" | "followUp") {
  const text = prompt.value.trim();
  if (!text || voiceActive.value) return;
  if (editingMessageId.value) { notice.value = translate("生成期间不能重发编辑的消息，请等本轮完成或先停止。"); return; }
  if (promptImages.value.length || promptDocuments.value.length) { notice.value = translate("生成期间仅支持发送文字，附件请在本轮结束后发送；当前草稿已保留。"); return; }
  promptQueue.value = [...promptQueue.value, { id: crypto.randomUUID(), text, steer: mode === "steer" }];
  prompt.value = "";
}
function steerQueued(id: string) { promptQueue.value = promptQueue.value.map(item => item.id === id ? { ...item, steer: true } : item); }
function removeQueued(id: string) { promptQueue.value = promptQueue.value.filter(item => item.id !== id); }
function editQueued(id: string) {
  const item = promptQueue.value.find(entry => entry.id === id);
  if (!item) return;
  if (prompt.value.trim() || promptImages.value.length || promptDocuments.value.length) { notice.value = translate("请先发送或清空输入框，再编辑排队消息。"); return; }
  removeQueued(id);
  prompt.value = item.text;
  void nextTick(() => promptInput.value?.focus());
}
/** Agent 每做完一步世界工具来取一次引导：取走后等 steered 事件把它们显示进对话。 */
function takeSteering(): AgentSteering[] {
  const items = promptQueue.value.filter(item => item.steer);
  if (!items.length) return [];
  promptQueue.value = promptQueue.value.filter(item => !item.steer);
  for (const item of items) deliveredSteering.set(item.id, item.text);
  return items.map(({ id, text }) => ({ id, text }));
}
function turnToolLookup(id: string) {
  for (const message of turnAssistants) {
    const part = message.parts?.find((item): item is AgentToolPart => item.type === "tool" && item.id === id);
    if (part) return part;
  }
  return undefined;
}
/** 引导交给模型后：前一段回复收尾，引导作为一条“引导”消息显示，后面的进展进新的一段回复（和宿主对话里的顺序一致）。 */
function splitForSteering(ids: string[]) {
  const steering = ids.flatMap(id => { const text = deliveredSteering.get(id); deliveredSteering.delete(id); return text ? [{ id, text }] : []; });
  const previous = activeAssistantMessage();
  if (!previous || !steering.length) return;
  activeReplyStream?.finish("success");
  previous.statusText = "";
  previous.endedAt = performance.now();
  for (const item of steering) messages.value.push({ id: item.id, role: "user", content: item.text, delivery: "steer" });
  messages.value.push({ id: crypto.randomUUID(), role: "assistant", content: "", parts: [], streaming: true, statusText: "按引导继续", startedAt: performance.now(), views: [], warnings: [] });
  const next = messages.value[messages.value.length - 1]!;
  turnAssistants.push(next);
  activeReplyStream = createReplyStream(next, turnToolLookup);
}
// 本轮做完（不是被停止）还有排队的消息：接着发下一条。停止时排队的文字放回输入框。
watch(() => !aiController.value && !locked.value && !compacting.value && !voiceActive.value && promptQueue.value.length > 0, ready => { if (ready) void runNextQueued(); });
async function runNextQueued() {
  await nextTick();
  if (aiController.value || disposed || !promptQueue.value.length || locked.value || compacting.value || voiceActive.value || !selectedAiModel.value || !props.generateAi) return;
  const [next, ...rest] = promptQueue.value;
  promptQueue.value = rest;
  await runAi({ text: next!.text });
}
function notifyDone() {
  if (!window.document.hidden || typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try { new Notification("Toonflow", { body: "Agent 已完成回复" }); }
  catch { /* 有的环境只允许 Service Worker 发通知 */ }
}
function formatFileSize(bytes: number) {
  return bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
async function addPromptFiles(files: File[]) {
  if (!files.length || locked.value) return;
  if (aiController.value) { notice.value = translate("生成期间仅支持发送文字，请在本轮完成后添加附件。"); return; }
  const images = files.filter(file => /^image\//.test(file.type));
  const documents = files.filter(file => !/^image\//.test(file.type) && (textFilePattern.test(file.name) || /^text\//.test(file.type) || file.type === "application/json"));
  if (images.length + documents.length < files.length) fail(new Error("只支持图片和文本文档（txt、md、json、csv、srt 等），其余文件没有添加。"));
  if (documents.length) await addPromptDocuments(documents);
  if (images.length) await addPromptImages(images);
}
async function addPromptDocuments(files: File[]) {
  try {
    if (promptDocuments.value.length + files.length > 10) throw new Error("每条消息最多添加 10 个文档。");
    const added: PromptDocument[] = [];
    for (const file of files) {
      if (!file.size || file.size > 400000) throw new Error(`文档“${file.name}”为空或超过 400 KB，请缩减内容后重试。`);
      const text = (await file.text()).replace(/^﻿/, "");
      if (text.includes("\u0000")) throw new Error(`“${file.name}”不是文本文件。`);
      added.push({ id: crypto.randomUUID(), name: file.name || "文本", text, size: file.size });
    }
    if (disposed) return;
    promptDocuments.value = [...promptDocuments.value, ...added];
    if (!voiceActive.value) promptInput.value?.focus({ preventScroll: true });
  } catch (error) { fail(error); }
}
function pastePromptFiles(event: ClipboardEvent) {
  const files = Array.from(event.clipboardData?.files ?? []);
  if (!files.length) return;
  event.preventDefault();
  event.stopPropagation();
  void addPromptFiles(files);
}
function dragPromptFiles(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.type === "dragenter") fileDragDepth++;
  draggingFiles.value = !locked.value && !aiController.value;
  event.dataTransfer.dropEffect = draggingFiles.value ? "copy" : "none";
}
function leavePromptFiles(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  if (--fileDragDepth <= 0) { fileDragDepth = 0; draggingFiles.value = false; }
}
function dropPromptFiles(event: DragEvent) {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
  fileDragDepth = 0;
  draggingFiles.value = false;
  void addPromptFiles(Array.from(event.dataTransfer.files));
}
// ===== ACT: 消息操作（与宿主一致：编辑重发、删除、从此处分支）=====
/** 一轮 = 用户消息 + 它的回复（含中途的引导和拆出来的回复），到下一条普通用户消息为止。 */
function turnEnd(list: AgentMessage[], index: number) {
  let end = index + 1;
  if (list[index]?.role === "user") while (end < list.length && !(list[end]!.role === "user" && list[end]!.delivery !== "steer")) end++;
  return end;
}
function editMessage(message: AgentMessage) {
  if (sessionBusy.value || locked.value || message.role !== "user") return;
  if (!editingMessageId.value) editDraft = { prompt: prompt.value, images: promptImages.value, documents: promptDocuments.value };
  editingMessageId.value = message.id;
  prompt.value = message.content;
  promptImages.value = (message.images ?? []).filter(image => !image.archived).map(image => ({ id: crypto.randomUUID(), name: image.name, dataUrl: image.dataUrl, bytes: Math.round(image.dataUrl.length * 0.75) }));
  promptDocuments.value = [];
  void nextTick(() => { promptInput.value?.focus(); resizePrompt(); });
}
function cancelEditMessage() {
  if (!editingMessageId.value) return;
  const draft = editDraft;
  editingMessageId.value = "";
  editDraft = undefined;
  prompt.value = draft?.prompt ?? "";
  promptImages.value = draft?.images ?? [];
  promptDocuments.value = draft?.documents ?? [];
}
watch(activeSessionId, () => cancelEditMessage());
/** 被删掉的消息里有压缩边界：边界退到前一条；前面没有了就连摘要一起去掉。 */
function keepSummaryBoundary(session: AgentSession, removed: AgentMessage[], index: number) {
  if (!session.summaryThrough || !removed.some(item => item.id === session.summaryThrough)) return;
  const previous = session.messages[index - 1];
  if (previous) session.summaryThrough = previous.id;
  else { session.summary = undefined; session.summaryThrough = undefined; }
}
function removeMessage(message: AgentMessage) {
  if (sessionBusy.value || locked.value) return;
  const session = activeSession.value;
  const index = session.messages.findIndex(item => item.id === message.id);
  if (index < 0) return;
  const removed = session.messages.splice(index, turnEnd(session.messages, index) - index);
  keepSummaryBoundary(session, removed, index);
  if (editingMessageId.value && removed.some(item => item.id === editingMessageId.value)) cancelEditMessage();
  session.updatedAt = Date.now();
  saveSessions();
}
function branchFromMessage(message: AgentMessage) {
  if (sessionBusy.value || locked.value) return;
  const source = activeSession.value;
  const index = source.messages.findIndex(item => item.id === message.id);
  if (index < 0) return;
  const kept = JSON.parse(JSON.stringify(source.messages.slice(0, turnEnd(source.messages, index)))) as AgentMessage[];
  const branch = createAgentSession();
  branch.name = `${agentSessionName(source)} · 分支`.slice(0, 80);
  branch.messages = kept.map(item => ({ ...item, streaming: false }));
  if (source.summary && source.summaryThrough && kept.some(item => item.id === source.summaryThrough)) { branch.summary = source.summary; branch.summaryThrough = source.summaryThrough; }
  sessions.value = [branch, ...historySessions.value.slice(0, maxSessions - 1)];
  activeSessionId.value = branch.id;
  chatOpen.value = true;
  saveSessions();
}
function stopAi() {
  aiController.value?.abort();
  flushAiProgress();
  const message = activeAssistantMessage();
  if (message) message.statusText = aiResultAdopted ? "生成模型已保留，正在结束创作会话" : "已恢复原场景，正在关闭创作会话";
  aiPreviewDocument.value = undefined; viewport?.setWorldTimePreview();
  viewport?.sync({ ...viewportDocument(), view: viewport.getView() });
}
/** queued：排队消息轮到时直接发它的文字，不动输入框里正在写的草稿。 */
async function runAi(queued?: { text: string }) {
  if (performanceDraft.value) { notice.value = translate("请先完成或取消正在绘制的路线。"); return; }
  if (aiController.value || locked.value || compacting.value || voiceActive.value || imagesReading.value || !props.generateAi || (queued ? !queued.text.trim() : !prompt.value.trim() && !promptImages.value.length && !promptDocuments.value.length) || !selectedAiModel.value) return;

  if (objectDraft.value) {
    try {
      const draft = objectDraft.value;
      commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => object.id === draft.id ? draft : object) });
      objectDraft.value = undefined;
      objectInputText.value = undefined;
      viewport?.setObjectEditing(null);
      await nextTick();
    } catch (error) { fail(error); return; }
  }
  flushView();
  await nextTick();
  if (locked.value || aiController.value) return;
  const instruction = (queued ? queued.text : prompt.value).trim();
  const attachments = queued ? [] : promptImages.value;
  const documents = queued ? [] : promptDocuments.value;
  const editing = queued ? "" : editingMessageId.value;
  const images = attachments.map(({ name, dataUrl }) => ({ name, dataUrl }));
  // /skill:名字 开头：对话里照原样显示，给模型的要求去掉命令，技能正文由 Agent 一侧带上。
  const skill = parseSkillCommand(instruction);
  const said = skill ? skill.rest || `按技能「${skill.name}」执行。` : instruction;
  const performanceOnly = isPerformanceConversation.value;
  if (performanceOnly) {
    const context = performanceContext.value;
    if (context?.objectId && !props.modelValue.objects.some(object => object.id === context.objectId)) {
      clearPerformanceConversation();
      notice.value = translate("原对话的物体已移除，请选择要修改的动画后继续。");
      return;
    }
    const track = timelineTracks.value.find(track => track.id === context?.trackId);
    const object = props.modelValue.objects.find(object => object.id === track?.objectId);
    if (context?.trackId && (!track || !object) || context?.clipId && (!track || !object || !getPerformanceClips(track, object).some(clip => clip.id === context.clipId))) {
      notice.value = translate("原对话的轨道或片段已移除，请重新选择要修改的动画。");
      return;
    }
    if (editorPanel.value === "life" && (subjectId.value || !context?.objectId)) rememberPerformanceContext();
    else rememberPerformanceContext(context?.objectId ?? "", context?.trackId ?? "", context?.clipId ?? "");
  }
  const planningTrackId = performanceOnly ? performanceContext.value?.trackId : undefined;
  const planningObjectId = performanceOnly ? performanceContext.value?.objectId : undefined;
  const planningClipId = performanceOnly ? performanceContext.value?.clipId : undefined;
  // 选中的人和片段按名字告诉模型（弱模型对不上UUID）；默认走导演工具，只改选中片段的快慢入出点才用高级工具。
  const planningName = planningObjectId ? props.modelValue.objects.find(object => object.id === planningObjectId)?.name : undefined;
  const planningTrack = planningTrackId ? timelineTracks.value.find(track => track.id === planningTrackId) : undefined;
  const planningObject = planningTrack ? props.modelValue.objects.find(object => object.id === planningTrack.objectId) : undefined;
  const planningClipName = planningClipId && planningTrack && planningObject ? getPerformanceClips(planningTrack, planningObject).find(clip => clip.id === planningClipId)?.name : undefined;
  const modelInstruction = performanceOnly
    // 短：只说选中了谁、哪段（工具怎么用在系统提示词里，舞台简报由 Agent 附在消息末尾），不让模型多读多想。
    ? said + (planningName || planningClipId ? "\n\n（" + (planningName ? `选中的人：“${planningName}”，没说别人时就安排他。` : "") + (planningClipId ? `选中的片段：“${planningClipName ?? "片段"}”（trackId ${planningTrackId}，clipId ${planningClipId}），只改这一段的快慢、长短时用 worldEditAnimation。` : "") + "）" : "")
    : said;
  performancePlanningId.value = performanceOnly ? planningTrackId ?? "performance" : "";
  const anchor = !performanceOnly && sceneAnchor.value ? { ...sceneAnchor.value, position: { ...sceneAnchor.value.position } } : undefined;
  const baseDocument = clone(props.modelValue);
  const session = activeSession.value;
  const turnId = crypto.randomUUID();
  const startedAt = performance.now();
  session.updatedAt = Date.now();
  // 编辑重发：从被编辑的那条起，后面的对话换成这次的。
  if (editing) {
    const index = session.messages.findIndex(message => message.id === editing);
    if (index >= 0) keepSummaryBoundary(session, session.messages.splice(index), index);
    editingMessageId.value = "";
    editDraft = undefined;
  }
  messages.value.push({ id: turnId, role: "user", content: instruction, images: images.length ? images.map(image => ({ ...image })) : undefined, attachments: documents.length ? documents.map(({ name, size }) => ({ name, size })) : undefined });
  for (const image of messages.value.at(-1)!.images ?? []) void createThumbnail(image.dataUrl).then(thumbnail => { image.thumbnail = thumbnail; }, () => {});
  const assistant: AgentMessage = { id: crypto.randomUUID(), role: "assistant", content: "", parts: [], streaming: true, statusText: "连接创作服务", startedAt, views: [], warnings: [] };
  messages.value.push(assistant);
  turnAssistants = [messages.value[messages.value.length - 1]!];
  activeReplyStream = createReplyStream(turnAssistants[0]!, turnToolLookup);
  deliveredSteering.clear();
  if (!queued) {
    prompt.value = "";
    promptImages.value = [];
    promptDocuments.value = [];
  }
  const generationController = new AbortController();
  aiController.value = generationController;
  aiBaseDocument = baseDocument;
  previewMerge = undefined;
  aiResultAdopted = false;
  clearAiTimers();
  pendingAiProgress.clear();
  aiPreviewDocument.value = undefined; viewport?.setWorldTimePreview();
  chatOpen.value = true;
  // 不再锁场景：Agent 干活时照常编辑、放素材、操控，交付时三方合并。
  let saved = false;
  try {
    // 对话记忆超过预算：先把较早的消息压成摘要再发送；压缩失败不拦这一轮，只带最近的对话。
    const fold = sessionContextTokens(session, turnId) > contextBudgetTokens ? autoCompactableMessages(session, turnId) : [];
    if (fold.length) {
      // 直接改消息上的状态：进度事件要等下一帧才刷新，面板不在前台时会一直停在“连接创作服务”。
      const pending = activeAssistantMessage();
      if (pending) pending.statusText = "正在压缩上下文…";
      try { await compactSession(session, fold, generationController.signal); }
      catch (error) {
        generationController.signal.throwIfAborted();
        receiveAiProgress({ type: "status", warning: true, message: `上下文没有压缩成功，本轮只带最近的对话：${error instanceof Error ? error.message : "摘要生成失败"}` });
      }
    }
    const context = sessionHistory(session, turnId);
    const result = await props.generateAi({ prompt: modelInstruction, userPrompt: said, images, documents: documents.map(({ name, text }) => ({ name, text })), skill: skill?.name, takeSteering: () => aiController.value === generationController ? takeSteering() : [], modelKey: modelKey.value, thinkingLevel: thinkingLevel.value || undefined, document: clone(baseDocument), assets: availableAssets.value, terrainObstacles: viewport?.getPerformanceTerrainObstacles(), selectedId: performanceOnly ? planningObjectId : anchor?.kind === "object" ? anchor.objectId : undefined, performanceOnly, lifeGroupId: planningTrackId, performanceClipId: planningClipId, anchor, history: context.turns, historySummary: context.summary, signal: generationController.signal,
      onStatus: text => { if (!disposed && aiController.value === generationController && !generationController.signal.aborted) receiveAiProgress({ type: "status", message: text }); },
      onProgress: event => { if (!disposed && aiController.value === generationController && (!generationController.signal.aborted || event.type === "status" && event.warning)) receiveAiProgress(event); },
      onPreviewDocument: value => { if (aiController.value === generationController) previewAiDocument(value); },
    });
    generationController.signal.throwIfAborted();
    if (disposed) return;
    flushAiProgress();
    if (result.changed === false) {
      finishAssistantMessage(activeAssistantMessage(), "success", result.summary);
      notifyDone();
      return;
    }
    // Agent 没带回来的大块（地形、时刻、天气、演绎）算“没改”：用底稿补齐，合并时保留用户这边的。
    const delivered = { ...result.document, terrain: result.document.terrain ?? baseDocument.terrain, time: result.document.time ?? baseDocument.time, weather: result.document.weather ?? baseDocument.weather, life: result.document.life ?? baseDocument.life };
    // 生成期间用户也在改：三方合并，用户动过的保留，Agent 的改动叠上去。
    const ours = latestScene();
    const userEdited = !sameSceneContent(ours, baseDocument);
    const proposal = mergeSceneEdits(baseDocument, ours, delivered);
    aiPreviewDocument.value = undefined; viewport?.setWorldTimePreview();
    const before = props.modelValue.cameras ?? [];
    const performanceChanged = JSON.stringify(props.modelValue.life?.tracks ?? []) !== JSON.stringify(proposal.life?.tracks ?? []) || JSON.stringify(before) !== JSON.stringify(proposal.cameras ?? []);
    commit(proposal);
    aiResultAdopted = true;
    aiAdoptions++;
    await nextTick();
    if (proposal.objects.some(object => object.asset.shape === "seatedPerson")) { await viewport?.whenReady(); fitSeatedPeople(); }
    // Agent 改了演绎或镜头：整场从现在重新开演。否则新轨道按提交那一刻开演，比场景载入时排好的老轨道晚，成片镜头对不上新表演。
    if (performanceChanged) { await viewport?.whenReady(); viewport?.settleClock(); viewport?.restartPerformance(); }
    // Agent 的一键分镜是纯数据算的，没有射线：落地后对它新建、改动过的“分镜·”机位补一遍遮挡避让和活动墙（和界面里一键分镜一致）。
    const changed = (proposal.cameras ?? []).filter(camera => camera.name.startsWith("分镜·") && !before.some(old => old.id === camera.id && JSON.stringify(old) === JSON.stringify(camera)));
    if (changed.length) { await viewport?.whenReady(); viewport?.settleClock(); refineCoverageCameras(changed.map(camera => camera.id)); }
    const staged = (props.modelValue.cameras ?? []).filter(camera => camera.name.startsWith("镜头·") && !before.some(old => old.id === camera.id && JSON.stringify(old) === JSON.stringify(camera)));
    if (staged.length) { await viewport?.whenReady(); viewport?.settleClock(); refineStageShots(staged.map(camera => camera.id)); }
    if (props.saveAi) {
      const message = activeAssistantMessage();
      if (message) message.statusText = "正在保存生成场景";
      saved = await props.saveAi();
      if (!saved) throw new Error("场景保存失败");
    }
    generationController.signal.throwIfAborted();
    flushAiProgress();
    finishAssistantMessage(activeAssistantMessage(), "success", userEdited ? `${result.summary}\n\n（生成期间你做的改动都保留了，和这次结果合在一起。）` : result.summary);
    notifyDone();
  } catch (error) {
    if (!disposed) {
      flushAiProgress();
      const detail = error instanceof Error ? error.message : "生成失败，请重试。";
      let message = generationController.signal.aborted ? "已停止，场景保持原样。" : detail;
      if (aiResultAdopted) message = generationController.signal.aborted
        ? `已停止，生成模型已保留${saved ? "并保存" : "在当前场景，请手动保存"}。`
        : `${detail}。生成模型已保留在当前场景，请重试保存。`;
      finishAssistantMessage(activeAssistantMessage(), generationController.signal.aborted ? "interrupted" : "error", "", message);
      if (!generationController.signal.aborted) notice.value = message;
      if (!aiResultAdopted && !queued && !prompt.value.trim() && !promptImages.value.length && !promptDocuments.value.length) { prompt.value = instruction; promptImages.value = attachments; promptDocuments.value = documents; }
    }
  } finally {
    clearAiTimers();
    if (!disposed) {
      flushAiProgress();
      aiPreviewDocument.value = undefined; viewport?.setWorldTimePreview();
      aiController.value = undefined;
      aiBaseDocument = undefined;
      previewMerge = undefined;
      aiResultAdopted = false;
      performancePlanningId.value = "";
      turnAssistants = [];
      deliveredSteering.clear();
      // 停止：排队的文字放回输入框，不自动接着发（和宿主停止时清掉队列一致，但不丢用户写的字）。
      if (generationController.signal.aborted && promptQueue.value.length) {
        prompt.value = [prompt.value.trim(), ...promptQueue.value.map(item => item.text)].filter(Boolean).join("\n");
        promptQueue.value = [];
      }
      viewport?.sync({ ...viewportDocument(), view: viewport.getView() });
    }
  }
}

function syncEditing() {
  if (editorPanel.value !== "life" || locked.value) cancelCameraGesture();
  if (editorPanel.value !== "terrain" || locked.value) cancelTerrainColor();
  if (editorPanel.value !== "view" || worldTab.value !== "space" || locked.value) cancelAtmosphereDraft();
  if (editorPanel.value !== "life" || locked.value || performanceDraft.value && performanceDraft.value.objectId !== subjectId.value) cancelPerformanceRoute();
  if (locked.value) cancelAssetPlacement();
  if (editorPanel.value !== "view" || worldTab.value !== "time" || locked.value) cancelTimeDraft();
  if (editorPanel.value !== "view" || locked.value) cancelWeatherDraft();
  // 悬浮手柄不依赖物体面板：正在拖手柄时面板没开也保留草稿，否则拖动中文档一有别的改动（别的物体落地写回、演绎状态）比例就被撤回。
  if (editorPanel.value !== "object" && !handleDrag.value || locked.value || objectDraft.value && objectDraft.value.id !== subjectId.value) cancelObjectDraft();
  if (!viewport) return;
  if (selectedTerrainTree.value !== null && (subjectId.value || editorPanel.value === "terrain" && terrainPainting.value || editorPanel.value === "brush" && sceneBrushPainting.value)) selectedTerrainTree.value = null;
  viewport.selectTerrainTree(selectedTerrainTree.value);
  if (selectedTerrainTree.value === null) viewport.selectObjects(selectedObjectIds.value.length > 1 ? selectedObjectIds.value : subjectId.value ? [subjectId.value] : []);
  viewport.setHelpersVisible(!locked.value && (props.modelValue.gridVisible || props.modelValue.display?.axesVisible || !!editorPanel.value || !!subjectId.value || selectedTerrainTree.value !== null));
  viewport.setTool(objectDragActive.value ? "translate" : editorPanel.value && !locked.value ? editTool.value : "select");
  viewport.setObjectDragMode(objectDragMode.value);
  viewport.setObjectDragEnabled(objectDragActive.value);
  viewport.setTerrainBrush(editorPanel.value === "terrain" && terrainPainting.value && !locked.value ? terrainBrush.value : null, terrainRadius.value, terrainStrength.value, { hardness: terrainHardness.value, targetHeight: terrainTargetHeight.value, flow: terrainFlow.value, color: selectedTerrainPaint.value ? terrainColor.value : undefined });
  viewport.setSceneBrush(editorPanel.value === "brush" && sceneBrushPainting.value && !sceneBrushSelecting.value && !locked.value ? sceneBrushSettings.value : null);
  viewport.setPerformanceEditing(editorPanel.value === "life" || !!performancePlanningId.value, selectedTrackId.value, selectedPerformancePoint.value);
  viewport.sync(viewportDocument(), true);
  viewport.setCamerasVisible(editorPanel.value === "life" && !locked.value);
  viewport.setCameraEditing(editorPanel.value === "life" && !locked.value ? selectedCameraId.value || null : null);
  applyCameraPose();
  viewport.setCameraShotSelection(editorPanel.value === "life" ? monitorCamera.value?.id ?? null : null, editShotId.value);
  if (editorPanel.value !== "life" || cameraLocked.value || !monitorCamera.value) cameraPathDrawing.value = false;
  viewport.setCameraPathDrawing(cameraPathDrawing.value ? monitorCamera.value?.id ?? null : null);
}
function openInspector(panel: "scene" | "object" | "terrain" | "brush" | "view" | "life") {
  if (locked.value || !viewport) return;
  cancelCameraGesture();
  if (panel !== "life" && filmPreview.value) setFilmPreview(false);
  cancelAtmosphereDraft();
  cancelTimeDraft();
  cancelWeatherDraft();
  cancelObjectDraft();

  const view = viewport.getView();
  const scene = props.modelValue;

  // 编辑面板在右边，素材库在左边让出位置；Agent 对话不收，边聊边改。
  assetsOpen.value = false;

  editorPanel.value = panel === "object" && !selectedObject.value ? "scene" : panel;
  if (editorPanel.value === "life") rememberPerformanceContext();
  editTool.value = editorPanel.value === "object" ? "translate" : "select";
  if (editorPanel.value === "object") objectDragMode.value = "plane";
  viewport.select(subjectId.value);

  const members = new Set(getPerformanceObjectIds(subjectId.value, scene.objectGroups));
  const placements = new Map((panel === "object" ? viewport.getObjectPlacements(true) : []).filter(placement => members.has(placement.id)).map(placement => [placement.id, placement]));
  const life = panel === "object" && scene.life?.tracks?.some(track => members.has(track.objectId ?? "") && track.enabled !== false)
    ? { ...scene.life, tracks: scene.life.tracks.map(track => members.has(track.objectId ?? "") ? { ...track, enabled: false } : track) } : scene.life;
  if (placements.size || life !== scene.life) commit({ ...scene, view, life, objects: placements.size ? scene.objects.map(object => ({ ...object, ...placements.get(object.id) })) : scene.objects }, false);
  else commitPresentation({ view });
  syncEditing();
  studioRoot.value?.focus({ preventScroll: true });
}
function closeInspector() {
  selectedPerformancePoint.value = undefined;
  performancePointAnchor.value = null;
  cancelCameraGesture();
  clearCameraSelection();
  if (filmPreview.value) setFilmPreview(false);
  cancelTerrainColor();
  cancelAtmosphereDraft();
  cancelPerformanceRoute();
  viewport?.cancelPerformanceDrag();
  cancelTimeDraft();
  cancelWeatherDraft();
  cancelObjectDraft();
  editorPanel.value = "";
  editTool.value = "select";
  viewport?.select(subjectId.value);
  syncEditing();
  studioRoot.value?.focus({ preventScroll: true });
}
function selectObject(id: string, additive = false) {
  if (trackPicking.value && id && editorPanel.value === "life") { viewport?.select(subjectId.value); return; }
  if (additive) { selectObjects(id ? [id] : [], true); return; }
  if (locked.value) { viewport?.select(subjectId.value); return; }
  if (editorPanel.value === "terrain" && terrainPainting.value || editorPanel.value === "brush" && sceneBrushPainting.value) { viewport?.select(subjectId.value); return; }
  nameEditing.value = false;
  selectedTerrainTree.value = null;
  if (id !== subjectId.value) { cancelObjectDraft(); objectDragPreview.value = undefined; objectAnchor.value = null; }
  subjectId.value = id;
  selectedObjectIds.value = id ? [id] : [];
  if (editorPanel.value === "life") {
    if (id) { cancelCameraGesture(); clearCameraSelection(); }
    selectedTrackId.value = performanceTrackForObject(id)?.id ?? "";
    if (id) selectedObjectIds.value = [...getPerformanceObjectIds(id, props.modelValue.objectGroups)];
    selectedPerformancePoint.value = undefined;
  }
  if (id && performanceContext.value) rememberPerformanceContext(id, selectedTrackId.value, "");
  viewport?.select(id);
  syncEditing();
}
function selectObjects(ids: string[], additive = false) {
  if (locked.value || editorPanel.value === "terrain" && terrainPainting.value || editorPanel.value === "brush" && sceneBrushPainting.value) return;
  const valid = new Set(props.modelValue.objects.map(object => object.id));
  const picked = [...new Set(ids)].filter(id => valid.has(id));
  const previous = selectedObjectIds.value;
  const next = additive ? picked.every(id => previous.includes(id)) ? previous.filter(id => !picked.includes(id)) : [...new Set([...previous, ...picked])] : picked;
  selectObject(next.at(-1) ?? "");
  selectedObjectIds.value = next;
  viewport?.selectObjects(next);
  syncEditing();
}
function groupSelectedObjects() {
  if (locked.value || !selectedObjectIds.value.length) return;
  const ids = selectedObjectIds.value;
  const groups = props.modelValue.objectGroups ?? [];
  let index = 1;
  while (groups.some(group => group.name === `分组 ${index}`)) index++;
  const members = new Set(ids.flatMap(id => [...getPerformanceObjectIds(id, groups)]));
  const placements = new Map((viewport?.getObjectPlacements(true) ?? []).filter(placement => members.has(placement.id)).map(placement => [placement.id, placement]));
  commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => ({ ...object, ...placements.get(object.id) })), objectGroups: [...groups.map(group => ({ ...group, objectIds: group.objectIds.filter(id => !ids.includes(id)) })), { id: crypto.randomUUID(), name: `分组 ${index}`, objectIds: [...ids] }] });
  editorPanel.value = "view"; worldTab.value = "assets";
}
function ungroupObjects(id: string) {
  if (locked.value) return;
  const members = new Set(props.modelValue.objectGroups?.find(group => group.id === id)?.objectIds);
  const placements = new Map((viewport?.getObjectPlacements(true) ?? []).filter(placement => members.has(placement.id)).map(placement => [placement.id, placement]));
  commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => ({ ...object, ...placements.get(object.id) })), objectGroups: props.modelValue.objectGroups?.filter(group => group.id !== id) });
}
function renameObjectGroup(id: string, name: string) {
  if (!locked.value && name.trim()) commit({ ...props.modelValue, objectGroups: props.modelValue.objectGroups?.map(group => group.id === id ? { ...group, name: name.trim() } : group) });
}
function selectTerrainTree(index: number | null) {
  if (disposed || selectedTerrainTree.value === index) return;
  if (index !== null) {
    cancelObjectDraft();
    subjectId.value = "";
    objectDragPreview.value = undefined;
    objectAnchor.value = null;
    if (editorPanel.value === "object") editorPanel.value = "";
  }
  selectedTerrainTree.value = index;
}
function focusTerrainTree() {
  if (!locked.value && selectedTerrainTree.value !== null) viewport?.focusTerrainTree(selectedTerrainTree.value);
}
function removeTerrainTree() {
  const terrain = props.modelValue.terrain;
  const index = selectedTerrainTree.value;
  if (locked.value || index === null || !terrain) return;
  const removedTrees = [...new Set([...(terrain.removedTrees ?? []), index])].sort((a, b) => a - b);
  if (updateTerrain({ ...terrain, removedTrees })) {
    selectedTerrainTree.value = null;
    viewport?.selectTerrainTree(null);
  }
}
function objectNumericValue(object: SceneObject, field: ObjectNumericField) {
  return field === "height" ? viewport?.getObjectHeight(object.id)?.altitude ?? object.height ?? object.position.y : object.position[field];
}
function objectInputValue(field: ObjectNumericField) {
  const object = selectedObject.value;
  if (!object) return "";
  const input = objectInputText.value;
  return input?.id === object.id && input.field === field ? input.value : String(round(objectNumericValue(object, field)));
}
function beginObjectInput(field: ObjectNumericField, event: Event) {
  if (locked.value || !selectedObject.value) return;
  const id = selectedObject.value.id;
  const input = event.target as HTMLInputElement;
  if (!objectInputText.value || objectInputText.value.id !== id) {
    viewport?.setObjectEditing(id);
    const placement = viewport?.getObjectPlacements().find(placement => placement.id === id);
    if (placement) {
      saveObjectPlacements([placement]);
      if (field === "height" && placement.height !== undefined) input.value = String(round(placement.height));
      else if (field !== "height") input.value = String(round(placement.position[field]));
    }
  }
  objectInputText.value = { id, field, value: input.value };
}
function previewObjectInput(field: ObjectNumericField, event: Event) {
  if (locked.value || !viewport || editorPanel.value !== "object") return;
  const accepted = props.modelValue.objects.find(object => object.id === subjectId.value);
  if (!accepted) return;
  const input = event.target as HTMLInputElement;
  beginObjectInput(field, event);
  if (!input.checkValidity() || !Number.isFinite(input.valueAsNumber)) return;
  try {
    const placement = viewport.getObjectPlacements().find(placement => placement.id === accepted.id);
    const current = objectDraft.value?.id === accepted.id ? objectDraft.value : { ...accepted, ...placement };
    const next = field === "height" ? { ...current, height: input.valueAsNumber } : { ...current, position: { ...current.position, [field]: input.valueAsNumber } };
    objectDraft.value = { ...next, ...viewport.constrainTransform(accepted.id, next, field === "y") };
    viewport.sync(viewportDocument());
  } catch (error) { cancelObjectDraft(); fail(error); }
}
function commitObjectInput(field: ObjectNumericField, event: Event) {
  if (!objectInputText.value && !objectDraft.value) return;
  if (objectInputText.value && objectInputText.value.field !== field) return;
  const input = event.target as HTMLInputElement;
  const accepted = props.modelValue.objects.find(object => object.id === subjectId.value);
  if (!accepted) { cancelObjectDraft(); return; }
  let updated = accepted;
  if (locked.value || !input.checkValidity() || !Number.isFinite(input.valueAsNumber)) cancelObjectDraft();
  else {
    try {
      if (objectDraft.value?.id === accepted.id) {
        updated = objectDraft.value;
        commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => object.id === updated.id ? updated : object) });
      }
      objectDraft.value = undefined;
      objectInputText.value = undefined;
      viewport?.setObjectEditing(null);
    } catch (error) { cancelObjectDraft(); updated = accepted; fail(error); }
  }
  input.value = String(objectNumericValue(updated, field));
  if (event.type === "keydown") input.blur();
}
function cancelObjectDraft() {
  const changed = !!objectDraft.value;
  const editing = !!objectInputText.value;
  objectDraft.value = undefined;
  objectInputText.value = undefined;
  if (changed && !disposed) viewport?.sync(viewportDocument());
  viewport?.setObjectEditing(null);
  return changed || editing;
}
function cancelObjectInput(field: ObjectNumericField, event: Event) {
  cancelObjectDraft();
  const input = event.target as HTMLInputElement;
  input.value = objectInputValue(field);
  input.blur();
  studioRoot.value?.focus({ preventScroll: true });
}
function changeObjectGravity(event: Event) {
  const input = event.target as HTMLInputElement;
  const object = props.modelValue.objects.find(object => object.id === subjectId.value);
  if (!object || !viewport || locked.value) { input.checked = !!object && getObjectGravityEnabled(object); return; }
  const placement = viewport.getObjectPlacements().find(placement => placement.id === object.id);
  cancelObjectDraft();
  if (!updateObject(object.id, { ...placement, gravityEnabled: input.checked })) input.checked = getObjectGravityEnabled(object);
}
function updateObject(id: string, patch: Partial<SceneObject>) {
  if (locked.value) return;
  const object = props.modelValue.objects.find(object => object.id === id);
  if (!object) return;
  try {
    const placement = viewport?.getObjectPlacements().find(placement => placement.id === id);
    const next = { ...object, ...placement, ...patch };
    const values = patch.position || patch.rotation || patch.scale || patch.height !== undefined || patch.gravityEnabled !== undefined ? viewport?.constrainTransform(id, next, !!patch.position && patch.height === undefined) : undefined;
    const updated = { ...next, ...values };
    commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => object.id === id ? updated : object) });
    return updated;
  } catch (error) { fail(error); }
}
function renameObject(event: Event) {
  const input = event.target as HTMLInputElement;
  const object = selectedObject.value;
  const name = input.value.trim();
  const updated = object && name && name !== object.name ? updateObject(object.id, { name }) : object;
  input.value = updated?.name ?? object?.name ?? "";
}
function cancelObjectName(event: KeyboardEvent) {
  if (event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  const input = event.target as HTMLInputElement;
  input.value = selectedObject.value?.name ?? "";
  input.blur();
}
function commitObjectName(event: KeyboardEvent) {
  if (event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  (event.target as HTMLInputElement).blur();
}
function changeTransform(field: "rotation" | "scale", axis: keyof Vector3Value, event: Event) {
  if (!selectedObject.value) return;
  const input = event.target as HTMLInputElement;
  if (input.checkValidity() && Number.isFinite(input.valueAsNumber)) {
    const updated = updateObject(selectedObject.value.id, { [field]: { ...selectedObject.value[field], [axis]: input.valueAsNumber } });
    input.value = String((updated ?? selectedObject.value)[field][axis]);
  }
  else input.value = String(selectedObject.value[field][axis]);
}
function normalizedRotation(value: number) {
  return Math.round((((value + 180) % 360 + 360) % 360 - 180) * 1000) / 1000;
}
function objectHandleValues(id: string) {
  const object = props.modelValue.objects.find(item => item.id === id);
  if (!object) return;
  const placement = viewport?.getObjectPlacements().find(item => item.id === id);
  return { ...object, ...placement };
}
function beginObjectHandleDrag(kind: "height" | "rotate" | "tilt" | "scale", event: PointerEvent) {
  if (locked.value || event.button !== 0 || !viewport || !selectedObject.value) return;
  const element = event.currentTarget as HTMLElement | null;
  if (!element) return;
  // ACT: 输入框还停在编辑态时先让 blur 提交数值，再用最新几何开始拖拽。
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.matches("input,select,textarea")) active.blur();
  const current = objectHandleValues(selectedObject.value.id);
  if (!current) return;
  const rect = element.getBoundingClientRect();
  const anchor = objectAnchor.value;
  const position = anchor ? objectHandlePosition(anchor) : { left: 16, top: 96 };
  handleDrag.value = {
    kind, id: current.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    startHeight: current.height ?? current.position.y, startRotation: current.rotation.y,
    startTilt: current.rotation.x, startRoll: current.rotation.z, startScale: { ...current.scale },
    metersPerPixel: viewport.getObjectHeightPerPixel(current.id) ?? anchor?.metersPerPixel ?? 0.01,
    direction: kind === "height" && event.clientY > rect.top + rect.height / 2 ? -1 : 1,
    moved: false, element, style: { left: `${position.left}px`, top: `${position.top}px` },
  };
  viewport.setObjectEditing(current.id);
  try { element.setPointerCapture(event.pointerId); }
  catch { /* 捕获失败时仍按普通指针事件处理 */ }
  event.preventDefault();
  event.stopPropagation();
}
function moveObjectHandleDrag(event: PointerEvent) {
  const drag = handleDrag.value;
  const controller = viewport;
  if (!drag || drag.pointerId !== event.pointerId || !controller) return;
  event.preventDefault();
  event.stopPropagation();
  const accepted = objectHandleValues(drag.id);
  if (!accepted) return;
  const current = objectDraft.value?.id === drag.id ? objectDraft.value : accepted;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  try {
    if (drag.kind === "height") {
      if (!drag.moved && Math.abs(dy) < 2) return;
      // ACT: 按物体所在深度的实时屏幕比例换算，拖动高度时物体跟随鼠标移动。
      const metersPerPixel = controller.getObjectHeightPerPixel(drag.id) ?? drag.metersPerPixel;
      const height = Math.min(9999, Math.max(-9999, drag.startHeight + (drag.startY - event.clientY) * metersPerPixel));
      // 用手柄定了高度就停在那里：和搬动时按 Shift 抬高一样自动关掉重力，否则一松手又掉回地面，等于白拖。要落回去点旁边的重力开关。
      const next = { ...current, height, gravityEnabled: false, position: { ...accepted.position } };
      objectDraft.value = { ...next, ...controller.constrainTransform(drag.id, next, false) };
    } else if (drag.kind === "scale") {
      if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      // ACT: 等比缩放：向右或向上拖放大，每100像素约×2.7；保持各轴比例，夹在0.01到1000倍之间。
      const factor = Math.exp((dx - dy) * 0.01);
      const start = drag.startScale ?? accepted.scale;
      const scale = { x: clampScale(start.x * factor), y: clampScale(start.y * factor), z: clampScale(start.z * factor) };
      const next = { ...current, scale };
      objectDraft.value = { ...next, ...controller.constrainTransform(drag.id, next, false) };
    } else if (drag.kind === "rotate") {
      if (!drag.moved && Math.abs(dx) < 2) return;
      const rotation = { ...accepted.rotation, y: normalizedRotation(Math.round(drag.startRotation + dx * 0.5)) };
      const next = { ...current, rotation };
      objectDraft.value = { ...next, ...controller.constrainTransform(drag.id, next, false) };
    } else {
      if (!drag.moved && Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      // ACT: 倾斜手柄同时响应上下与左右，支持斜向的 4 方向调整，并按整度吸附。
      const rotation = { ...accepted.rotation };
      rotation.x = normalizedRotation(Math.round(drag.startTilt - dy * 0.5));
      rotation.z = normalizedRotation(Math.round(drag.startRoll + dx * 0.5));
      const next = { ...current, rotation };
      objectDraft.value = { ...next, ...controller.constrainTransform(drag.id, next, false) };
    }
  } catch (error) { cancelObjectDraft(); fail(error); return; }
  drag.moved = true;
  controller.sync(viewportDocument());
}
function endObjectHandleDrag(event: PointerEvent) {
  const drag = handleDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  event.preventDefault();
  event.stopPropagation();
  handleDrag.value = undefined;
  if (drag.element.hasPointerCapture(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId);
  viewport?.setObjectEditing(null);
  if (!drag.moved) {
    const before = history.value.at(-1);
    if (drag.kind === "height") stepObjectHeight(drag.direction * 0.1);
    else if (drag.kind === "rotate") stepObjectRotation(1);
    else if (drag.kind === "scale") stepObjectScale(1.1);
    else stepObjectTilt("x", 1);
    // 记下这一下单击留的撤销点：紧跟着的双击还原要把它们并掉。
    const snapshot = history.value.at(-1);
    if (snapshot && snapshot !== before) handleClickSteps = [...handleClickSteps, { kind: drag.kind, id: drag.id, time: performance.now(), snapshot }].slice(-2);
    return;
  }
  const draft = objectDraft.value;
  objectDraft.value = undefined;
  if (!draft || draft.id !== drag.id) return;
  try { commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => object.id === draft.id ? draft : object) }); }
  catch (error) { fail(error); viewport?.sync(viewportDocument()); }
}
function cancelObjectHandleDrag(event: PointerEvent) {
  if (handleDrag.value && event.pointerId === handleDrag.value.pointerId) abortObjectHandleDrag();
}
/** 收掉正在拖的手柄并撤回预览；有拖动被收掉时返回 true（Esc、撤销键据此只取消这一下，不再往下执行）。 */
function abortObjectHandleDrag() {
  const drag = handleDrag.value;
  if (!drag) return false;
  handleDrag.value = undefined;
  if (drag.element.isConnected && drag.element.hasPointerCapture(drag.pointerId)) drag.element.releasePointerCapture(drag.pointerId);
  cancelObjectDraft();
  viewport?.setObjectEditing(null);
  return true;
}
let handleClickSteps: { kind: "height" | "rotate" | "tilt" | "scale"; id: string; time: number; snapshot: SceneHistory }[] = [];
function stepObjectHeight(delta: number) {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  const current = objectHandleValues(object.id);
  if (!current) return;
  updateObject(object.id, { height: Math.min(9999, Math.max(-9999, (current.height ?? current.position.y) + delta)), gravityEnabled: false });
}
function stepObjectRotation(delta: number) {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  const current = objectHandleValues(object.id);
  if (!current) return;
  updateObject(object.id, { rotation: { ...current.rotation, y: normalizedRotation(current.rotation.y + delta) } });
}
function stepObjectTilt(axis: "x" | "z", delta: number) {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  const current = objectHandleValues(object.id);
  if (!current) return;
  updateObject(object.id, { rotation: { ...current.rotation, [axis]: normalizedRotation(current.rotation[axis] + delta) } });
}
function clampScale(value: number) { return Math.round(Math.min(1000, Math.max(0.01, value)) * 1000) / 1000; }
function stepObjectScale(factor: number) {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  const current = objectHandleValues(object.id);
  if (!current) return;
  updateObject(object.id, { scale: { x: clampScale(current.scale.x * factor), y: clampScale(current.scale.y * factor), z: clampScale(current.scale.z * factor) } });
}
function resetObjectHandle(kind: "rotate" | "tilt" | "scale") {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  const current = objectHandleValues(object.id);
  if (!current) return;
  // 双击的头两下各算一次单击（转 1°、放大一成）并各留了一个撤销点：还原后把它们并掉，一次撤销就回到双击之前。
  const steps = handleClickSteps.filter(step => step.kind === kind && step.id === object.id && performance.now() - step.time < 700);
  handleClickSteps = [];
  if (kind === "scale") updateObject(object.id, { scale: { x: 1, y: 1, z: 1 } });
  else if (kind === "rotate") updateObject(object.id, { rotation: { ...current.rotation, y: 0 } });
  else updateObject(object.id, { rotation: { ...current.rotation, x: 0, z: 0 } });
  const index = steps.length ? history.value.indexOf(steps[0]!.snapshot) : -1;
  if (index < 0) return;
  // 还原后和双击之前一模一样（本来就没转、没缩放过）时连这一步也不留，免得撤销一次什么都没变。
  const unchanged = sameSceneContent(history.value[index]!.document, latestScene());
  history.value = history.value.slice(0, unchanged ? index : index + 1);
}
function toggleObjectGravity() {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  cancelObjectDraft();
  updateObject(object.id, { gravityEnabled: !getObjectGravityEnabled(object) });
}
function toggleObjectVisibility() {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  cancelObjectDraft();
  updateObject(object.id, { visible: !object.visible });
}
function startObjectNameEdit() {
  const object = selectedObject.value;
  if (!object || locked.value) return;
  nameDraft.value = object.name;
  nameEditing.value = true;
  void nextTick(() => { nameInput.value?.focus(); nameInput.value?.select(); });
}
function commitObjectNameEdit() {
  if (!nameEditing.value) return;
  nameEditing.value = false;
  const object = selectedObject.value;
  const name = nameDraft.value.trim();
  if (object && name && name !== object.name) updateObject(object.id, { name });
}
function cancelObjectNameEdit() {
  if (!nameEditing.value) return;
  nameEditing.value = false;
  nameDraft.value = "";
  studioRoot.value?.focus({ preventScroll: true });
}
// ACT: 替换素材（白模迭代最常见的操作）：所选物体换成另一件素材，保留ID、位置、缩放、动线和集合关系；
// 朝向按两件素材各自识别的正面校正，换完仍朝同一方向（椅子还是对着桌子、铺子还是朝街）。名字里带旧素材名的换成新素材名（“大堂条凳”→“大堂餐椅”）。
const replaceTargets = ref<string[]>([]);
function beginReplace(ids: string[]) {
  if (locked.value) return;
  const targets = ids.filter(id => props.modelValue.objects.some(object => object.id === id));
  if (!targets.length) return;
  replaceTargets.value = targets;
  assetsOpen.value = true;
}
async function replaceWithAsset(asset: SceneAsset) {
  const targets = new Set(replaceTargets.value);
  if (locked.value || !targets.size) return;
  busy.value = t`替换为${asset.name}`;
  try {
    const prepared = await props.prepareAsset(asset, operationController.signal);
    if (disposed) return;
    const objects = replaceObjectsAsset(props.modelValue.objects, targets, prepared);
    commit({ ...props.modelValue, objects });
    notice.value = t`已把 ${targets.size} 件换成${asset.name}`;
    replaceTargets.value = [];
  } catch (error) { fail(error); }
  finally { if (!disposed) busy.value = ""; }
}
// ACT: 设为主角：胶囊人（群演）换成骨骼人物，保留同一个物体ID、位置、朝向、缩放、颜色和名字，演绎动线和机位跟踪都不用重做。
function promoteToRigged() {
  const source = selectedObject.value;
  const rigged = builtinAssets.find(asset => asset.id === "riggedPerson");
  if (locked.value || !source || source.asset.shape !== "person" || !rigged) return;
  try { commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => object.id === source.id ? { ...object, asset: structuredClone(rigged) } : object) }); }
  catch (error) { fail(error); }
}
function duplicateObject() {
  if (locked.value || !selectedObject.value) return;
  const source = clone(props.modelValue).objects.find(object => object.id === subjectId.value)!;
  const placement = viewport?.getObjectPlacements().find(placement => placement.id === source.id);
  const object = { ...source, ...placement };
  const copy = { ...object, id: crypto.randomUUID(), name: `${object.name.slice(0, 156)} 副本`, position: { ...object.position, x: object.position.x + (object.position.x < 9999 ? 1 : -1) } };
  commit({ ...props.modelValue, objects: [...props.modelValue.objects, copy] });
  selectObject(copy.id);
}
/** 多选整批复制：每件往旁边错开 1 米，复制完选中新的一批，接着就能一起拖走。 */
function duplicateObjects() {
  const ids = new Set(selectedObjectIds.value);
  if (locked.value || ids.size < 2) return;
  const placements = new Map((viewport?.getObjectPlacements() ?? []).map(placement => [placement.id, placement]));
  const copies = clone(props.modelValue).objects.filter(object => ids.has(object.id)).map(source => {
    const object = { ...source, ...placements.get(source.id) };
    return { ...object, id: crypto.randomUUID(), name: `${object.name.slice(0, 156)} 副本`, position: { ...object.position, x: object.position.x + (object.position.x < 9999 ? 1 : -1) } };
  });
  try { commit({ ...props.modelValue, objects: [...props.modelValue.objects, ...copies] }); }
  catch (error) { fail(error); return; }
  // 新物体要等宿主把文档传回来才选得中。
  void nextTick(() => { if (!disposed) selectObjects(copies.map(copy => copy.id)); });
}
/** 多选一起拖完：整批位置一次提交，撤销一步回到拖之前。 */
function updateObjects(items: { id: string; values: ObjectTransform }[]) {
  if (locked.value || !items.length) return;
  const values = new Map(items.map(item => [item.id, item.values]));
  try { commit({ ...props.modelValue, objects: props.modelValue.objects.map(object => values.has(object.id) ? { ...object, ...values.get(object.id) } : object) }); }
  catch (error) { fail(error); viewport?.sync(viewportDocument()); }
}
function removeObject() {
  removeObjects(subjectId.value ? [subjectId.value] : []);
}
function removeObjectGroup(id: string) {
  const group = props.modelValue.objectGroups?.find(group => group.id === id);
  if (group) removeObjects(group.objectIds, id);
}
function removeObjects(ids: string[], groupId?: string) {
  if (locked.value || !ids.length && !groupId) return;
  const removed = new Set(ids);
  const affected = new Set(ids.flatMap(id => [...getPerformanceObjectIds(id, props.modelValue.objectGroups)]));
  const placements = new Map((viewport?.getObjectPlacements(true) ?? []).filter(placement => affected.has(placement.id) && !removed.has(placement.id)).map(placement => [placement.id, placement]));
  const life = props.modelValue.life;
  const tracks = life?.tracks?.filter(track => !removed.has(track.objectId)).map(track => ({ ...track, events: track.events?.map(event => removed.has(event.target ?? "") ? { ...event, target: undefined } : event) }));
  commit({ ...props.modelValue, objects: props.modelValue.objects.filter(object => !removed.has(object.id)).map(object => ({ ...object, ...placements.get(object.id) })), objectGroups: props.modelValue.objectGroups?.filter(group => group.id !== groupId).map(group => ({ ...group, objectIds: group.objectIds.filter(id => !removed.has(id)) })), ...(life && tracks ? { life: { ...life, tracks } } : {}) });
  selectObjects(selectedObjectIds.value.filter(id => !removed.has(id)));
  studioRoot.value?.focus({ preventScroll: true });
}
function handToAssistant() {
  if (editorPanel.value === "life") rememberPerformanceContext();
  else performanceContext.value = undefined;
  chatOpen.value = true;
  void nextTick(() => promptInput.value?.focus({ preventScroll: true }));
}
function saveObjectPlacements(placements: (ObjectTransform & { id: string })[]) {
  if (disposed || locked.value || !placements.length) return;
  const currentId = objectInputText.value?.id ?? objectDraft.value?.id;
  // Agent 草稿预览期间，它动过的物体在视口里是 Agent 的位置，回写不能算成用户改的；其余物体照常落地保存。
  const agentOwned = aiPreviewDocument.value && aiController.value ? mergedAiPreview(props.modelValue).touched : undefined;
  const changed = new Map(placements.filter(placement => placement.id !== currentId && !agentOwned?.has(placement.id)).map(placement => [placement.id, placement]));
  let updated = false;
  const objects = props.modelValue.objects.map(object => {
    const placement = changed.get(object.id);
    if (!placement) return object;
    const next = { ...object, ...placement };
    if (JSON.stringify([object.position, object.rotation, object.scale, object.height, getObjectGravityEnabled(object)]) === JSON.stringify([next.position, next.rotation, next.scale, next.height, getObjectGravityEnabled(next)])) return object;
    updated = true;
    return next;
  });
  if (!updated) return;
  const version = ++gravityCommitVersion;
  gravityCommitPending = true;
  try { commit({ ...props.modelValue, objects }, false); }
  catch (error) { fail(error); }
  void nextTick(() => { if (version === gravityCommitVersion) gravityCommitPending = false; });
}
function flushView() {
  if (!viewport) return;
  const atmosphereValue = atmosphereDraft.value ?? props.modelValue.atmosphere;
  const atmosphereChanged = !!atmosphereDraft.value && JSON.stringify(atmosphereDraft.value) !== JSON.stringify(props.modelValue.atmosphere);
  atmosphereDraft.value = undefined;
  const life = props.modelValue.life;
  const snapshotRuntime = !busy.value && !aiController.value && !aiPreviewDocument.value && props.canSnapshotRuntime?.() !== false;
  const placements = new Map((!snapshotRuntime || locked.value ? [] : viewport.getObjectPlacements()).map(placement => [placement.id, placement]));
  const objects = props.modelValue.objects.map(object => ({ ...object, ...placements.get(object.id) }));
  const time = snapshotRuntime ? viewport.getWorldTime() : props.modelValue.time;
  commit({ ...props.modelValue, objects, time, atmosphere: atmosphereValue, view: viewport.getView(), ...(life && snapshotRuntime ? { life: { ...life, time: Math.min(86400, viewport.getLifeTime()) } } : {}) }, atmosphereChanged);
}
async function requestSave() {
  finishCameraGesture();
  if (performanceDraft.value) { notice.value = translate("请先完成或取消正在绘制的路线，再保存场景。"); return; }
  if (terrainColorDraft.value && !applyTerrainColor(terrainColorDraft.value)) return;
  if (viewport?.finishTerrainStroke() === false) return;
  await nextTick();
  flushView(); await nextTick(); emit("save");
}
function requestClose() {
  cancelCameraGesture();
  cancelTerrainColor();
  cancelAtmosphereDraft();
  if (timelineSeeking.value) seekTimeline(0, "cancel");
  finishVoiceInput();

  sceneBrushVersion++;
  viewport?.cancelSceneBrush();
  assetDropVersion++;
  cancelAssetPlacement();
  cancelTimeDraft();
  cancelWeatherDraft();
  cancelObjectDraft();
  viewport?.setNavigationEnabled(false);
  aiController.value?.abort();
  operationController.abort();
  emit("close");
}
async function handleKeyDown(event: KeyboardEvent) {
  if (event.isComposing) return;
  if ((event.key === "Escape" || (event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase())) && viewport?.cancelBoxSelection()) { event.preventDefault(); return; }
  if (timelineSeeking.value) { if (event.key === "Escape") seekTimeline(0, "cancel"); return; }
  if (performanceDraft.value && !locked.value && !(event.target as HTMLElement).closest("input,textarea,select,[contenteditable='true']")) {
    if (event.key === "Escape") { event.preventDefault(); exitPerformanceRoute(); return; }
    if (event.key === "Enter" && !(event.target as HTMLElement).closest("button,a,summary,[role='button']")) { event.preventDefault(); finishPerformanceRoute(); return; }
    if (event.key === "Backspace" || (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undoPerformanceRoutePoint(); return; }
  }
  if (event.key === "Escape" && !locked.value && (viewport?.cancelPerformanceDrag())) { event.preventDefault(); notice.value = ""; return; }
  if (event.key === "Escape" && selectedPerformancePoint.value !== undefined) { event.preventDefault(); closePointEditor(); return; }
  if (event.key === "Escape" && filmPreview.value) { event.preventDefault(); setFilmPreview(false); return; }
  if (event.key === "Escape" && trackPicking.value) { event.preventDefault(); trackPicking.value = false; return; }
  if (event.key === "Escape" && cameraPathDrawing.value) { event.preventDefault(); cameraPathDrawing.value = false; return; }
  if (event.key === "Escape" && cameraAnchor.value) { event.preventDefault(); closeCameraAnchor(); return; }
  if (event.key === "Escape" && voiceActive.value) { event.preventDefault(); finishVoiceInput(); return; }
  if (event.key === "Escape" && draggedAsset.value) { event.preventDefault(); cancelAssetPlacement(); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); (event.target as HTMLElement).blur(); await nextTick(); await requestSave(); return; }
  if (event.key === "Escape" && !locked.value) { event.preventDefault(); if (abortObjectHandleDrag() || viewport?.cancelFirstPersonLook() || viewport?.cancelObjectDrag() || viewport?.cancelSceneBrush() || viewport?.cancelTerrainStroke() || cancelCameraGesture() || cancelTerrainColor() || cancelAtmosphereDraft() || cancelTimeDraft() || cancelWeatherDraft() || cancelObjectDraft()) return; (event.target as HTMLElement).blur(); if (!assetsOpen.value && !editorPanel.value) chatOpen.value = false; assetsOpen.value = false; closeInspector(); return; }
  // ACT: 有单个物体选中时 E 进入演绎动线，优先于相机按键；输入框内和画线过程中不抢键。
  {
    const target = event.target as HTMLElement;
    const typing = target.isContentEditable || !!target.closest("input,textarea,select,[role='textbox']");
    if (!typing && !locked.value && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat
      && !performanceDraft.value && selectedObject.value && selectedObjectIds.value.length < 2
      && editorPanel.value !== "life" && event.key.toLowerCase() === "e") {
      event.preventDefault();
      editObjectPerformance();
      return;
    }
  }
  if (viewport?.handleNavigationKey(event)) return;
  if ((event.target as HTMLElement).isContentEditable || (event.target as HTMLElement).closest("input,textarea,select,[role='textbox']") || locked.value) return;
  if (event.key === "Delete" && editorPanel.value === "life" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    const target = event.target as HTMLElement;
    if (target !== studioRoot.value && target !== canvas.value && !target.closest(".performanceLabels,.performancePointCard,.cameraViewfinder,.timelinePanel,.drawRouteHud")) return;
    event.preventDefault();
    if (event.repeat || performanceDraft.value) return;
    if (selectedShotKey.value) { removeShotKey(); return; }
    if (selectedCameraId.value) { if (selectedShotId.value) removeCameraShot(selectedCameraId.value, selectedShotId.value); else removeCamera(selectedCameraId.value); return; }
    if (selectedPerformanceClipId.value) { removePerformanceClip(selectedTrackId.value, selectedPerformanceClipId.value); return; }
    if (selectedPerformancePoint.value !== undefined) removeSelectedPoint();
    else removePerformanceTrack(selectedTrackId.value);
    return;
  }
  if (selectedTerrainTree.value !== null && (event.key === "Delete" || event.key === "Backspace")) { event.preventDefault(); removeTerrainTree(); return; }
  if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "g" && selectedObjectIds.value.length) { event.preventDefault(); groupSelectedObjects(); return; }
  if (event.key === "Delete" && editorPanel.value !== "life" && selectedObjectIds.value.length && !event.repeat) { event.preventDefault(); removeObjects(selectedObjectIds.value); return; }
  if (editorPanel.value === "terrain" && !event.ctrlKey && !event.metaKey && !event.altKey && (event.key === "[" || event.key === "]")) { event.preventDefault(); terrainRadius.value = Math.min(16, Math.max(terrainMinRadius.value, terrainRadius.value + (event.key === "[" ? -0.5 : 0.5))); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? redo() : undo(); }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") { event.preventDefault(); redo(); }
  // R / Shift+R：选中的物体转45°，和搬动时一样。
  if (event.code === "KeyR" && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat && selectedObject.value && selectedObjectIds.value.length < 2 && editorPanel.value !== "life") { event.preventDefault(); stepObjectRotation(event.shiftKey ? -45 : 45); return; }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && subjectId.value) { event.preventDefault(); if (selectedObjectIds.value.length < 2) duplicateObject(); else duplicateObjects(); return; }
  if (event.key.toLowerCase() === "f") { if (selectedTerrainTree.value !== null) focusTerrainTree(); else if (selectedObjectIds.value.length > 1) viewport?.focusObjects(selectedObjectIds.value); else viewport?.focus(subjectId.value || undefined); }
  if (editorPanel.value === "object") {
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); removeObject(); }
  }
}
function mountViewport() {
  if (!canvas.value || disposed) return;
  try {
    viewport = createSceneViewport(canvas.value, { document: viewportDocument(), loadModel: props.loadModel, showHelpers: false, canSelect: () => !locked.value,
      onWorldTimeChange: time => { if (!disposed) worldTime.value = time; },
      onLifeStatus: status => { if (!disposed) lifeStatus.value = status; },
      onCameraSelect: pickCamera, onCameraTransform: transformCamera, onCameraPathDraw: drawCameraPath, onCameraPathEdit: editCameraPath, onCameraAnchorSelect: anchor => { cameraAnchor.value = anchor ?? undefined; }, onCameraAnchorScreen: screen => { cameraAnchorScreen.value = screen; },
      onFilmPreviewChange: active => { if (!disposed) filmPreview.value = active; },
      onPerformanceSelect: selectPerformance,
      onPerformanceMove: movePerformancePoint,
      onPerformanceInsert: insertPerformanceRoutePoint,
      onPerformanceRemovePoint: removePerformanceRoutePoint,
      onPerformanceLabels: labels => { if (!disposed) performanceLabels.value = labels; },
      onPerformancePointScreen: screen => { if (!disposed) performancePointAnchor.value = screen; },
      onPerformanceRouteStart: startPerformanceRoute,
      onPerformanceStroke: drawPerformanceStroke,
      onPerformanceContinueRoute: trackId => startPerformanceRoute(trackId),
      onPerformanceDrawPoint: addPerformanceRoutePoint,
      onGravitySettled: saveObjectPlacements,
      canSimulateObjects: () => !locked.value && !aiPreviewDocument.value && !timelineSeeking.value,
      onMultiSelect: (ids, additive) => selectObjects(additive ? [...new Set([...selectedObjectIds.value, ...ids])] : ids),
      onSelect: selectObject, onObjectCarry: active => { objectCarrying.value = active; }, onTransform: updateObject, onTransformMany: updateObjects, onViewChange: view => { if (!disposed) commitPresentation({ view }); },
      onError: text => { if (!disposed) { if (aiPreviewDocument.value) { if (text) receiveAiProgress({ type: "status", warning: true, message: `草稿预览：${text}` }); return; } stageError.value = text; } },
      onObjectAnchor: anchor => { objectAnchor.value = anchor; },
      onTerrainTreeSelect: selectTerrainTree,
      onObjectPreview: (id, values) => { if (!disposed) objectDragPreview.value = values ? { id, values } : undefined; },
      onSceneAnchor: (anchor: SceneAnchor | null) => { if (!disposed) sceneAnchor.value = anchor; },
      onTerrainChange: updateTerrain,
      onSceneBrush: objects => { void applySceneBrush(objects); },
      onSceneBrushError: text => { fail(new Error(text)); },
      onSceneBrushStatus: status => { if (!disposed) sceneBrushStatus.value = status; },
    });
    viewport.setNavigationEnabled(navigationEnabled.value);
    if (viewfinderCanvas) viewport.setViewfinder(viewfinderCanvas);
    if (monitorCanvas) viewport.setMonitor(monitorCanvas);
    syncEditing();
    studioRoot.value?.focus({ preventScroll: true });
  } catch (error) { fail(error); }
}
watch(() => props.modelValue, (value, previous) => {
  if (value.cameras !== previous.cameras) {
    if (cameraGesture.value?.committed) cameraGesture.value = undefined;
    const camera = value.cameras?.find(camera => camera.id === selectedCameraId.value);
    if (!camera) clearCameraSelection();
    else if (selectedShotId.value && !getCameraShot(camera, selectedShotId.value)) selectedShotId.value = "";
    if (filmPreview.value && !value.cameras?.length) setFilmPreview(false);
  }
  if (value.terrain !== previous.terrain) cancelTerrainColor();
  const contentUnchanged = sharesSceneContent(value, previous);
  if (contentUnchanged && value.time === previous.time) {
    viewport?.sync(viewportDocument(value), true);
    return;
  }
  if (timelineSeeking.value && !sameSceneContent(value, previous)) seekTimeline(0, "cancel");
  const anchor = sceneAnchor.value;
  if (anchor?.kind === "object" && !value.objects.some(object => object.id === anchor.objectId)) clearSceneAnchor();
  const tree = selectedTerrainTree.value;
  if (tree !== null && (!value.terrain || value.terrain.removedTrees?.includes(tree))) {
    selectedTerrainTree.value = null;
    viewport?.selectTerrainTree(null);
  }
  if (!contentUnchanged && value.objects.length === previous.objects.length && sameSceneContent(value, previous)) {
    viewport?.sync(viewportDocument(value));
    return;
  }
  if (!gravityCommitPending) {
    cancelTimeDraft();
    cancelWeatherDraft();
    cancelObjectDraft();
  }
  selectedObjectIds.value = selectedObjectIds.value.filter(id => value.objects.some(object => object.id === id));
  if (subjectId.value && !value.objects.some(object => object.id === subjectId.value)) subjectId.value = selectedObjectIds.value.at(-1) ?? "";
  if (editorPanel.value === "life" && !performanceDraft.value && (value.life?.tracks !== previous.life?.tracks || value.objectGroups !== previous.objectGroups)) {
    const id = performanceTrackForObject(subjectId.value)?.id ?? "";
    if (selectedTrackId.value !== id) { selectedTrackId.value = id; selectedPerformancePoint.value = undefined; }
  }
  if (editorPanel.value === "object" && !subjectId.value) editorPanel.value = "scene";
  syncEditing();
});
watch([selectedCameraId, selectedShotId, editShotId, cameraPathDrawing], syncEditing);
watch([() => monitorCamera.value?.id, editShotId, editorPanel], () => {
  const anchor = cameraAnchor.value;
  if (anchor && (anchor.id !== monitorCamera.value?.id || anchor.shotId !== editShotId.value || editorPanel.value !== "life")) closeCameraAnchor();
  const key = selectedShotKey.value;
  if (key && (key.cameraId !== monitorCamera.value?.id || key.shotId !== editShotId.value || editorPanel.value !== "life")) closeShotKey();
});
watch([cameraGesture, monitorCamera], () => applyCameraPose());
watch([editorPanel, subjectId, selectedTerrainTree, locked, objectDragMode, () => props.modelValue.gridVisible, () => props.modelValue.display?.axesVisible], syncEditing);
watch(subjectId, id => { if (!id || !selectedObjectIds.value.includes(id)) selectedObjectIds.value = id ? [id] : []; });
watch([timelineTracks, selectedTrackId], () => {
  if (!selectedPerformanceClipId.value) return;
  const track = timelineTracks.value.find(track => track.id === selectedTrackId.value);
  const object = props.modelValue.objects.find(object => object.id === track?.objectId);
  if (!track || !object || !getPerformanceClips(track, object).some(clip => clip.id === selectedPerformanceClipId.value)) selectedPerformanceClipId.value = "";
});
watch(selectedObjectIds, syncEditing);
watch([selectedTrackId, selectedPerformancePoint, performancePlanningId], syncEditing);
watch(terrainBrush, cancelTerrainColor);
watch([terrainBrush, terrainPainting, terrainRadius, terrainStrength, terrainFlow, terrainHardness, terrainTargetHeight, terrainColor], syncEditing);
watch([sceneBrushSettings, sceneBrushPainting, sceneBrushSelecting], syncEditing);
watch(terrainMinRadius, min => { terrainRadius.value = Math.max(min, terrainRadius.value); });
watch(navigationEnabled, enabled => viewport?.setNavigationEnabled(enabled));
watch(modelKey, () => { thinkingLevel.value = ""; });
watch(worldSize, value => { worldSizeInput.value = String(value); });
watch(reasoningLevels, levels => { if (thinkingLevel.value && !levels.includes(thinkingLevel.value)) thinkingLevel.value = ""; });
// 手柄在拖动中被收起（锁定、换面板、取消选中）：元素一卸载就收不到松手事件，这里把拖动收干净，不留半截草稿和悬着的角标。
watch(showObjectHandles, shown => { if (!shown) abortObjectHandleDrag(); });
watch(locked, disabled => { if (disabled) finishVoiceInput(); });
onMounted(() => { void loadSessions(); mountViewport(); if (chatBox.value) { const element = chatBox.value; chatObserver = new ResizeObserver(() => { chatHeight.value = Math.ceil(element.offsetHeight); }); chatObserver.observe(element); }assetDragWindow = canvas.value?.ownerDocument.defaultView ?? null; window.document.addEventListener("visibilitychange", handleVoiceVisibility); emit("loadModels"); });
onBeforeUnmount(() => { if (aiController.value) saveSessions(); compactionController.value?.abort(); toolbarObserver?.disconnect(); chatObserver?.disconnect();finishVoiceInput(); clearAiTimers(); pendingAiProgress.clear(); window.document.removeEventListener("visibilitychange", handleVoiceVisibility); disposed = true; assetDropVersion++; sceneBrushVersion++; cancelAssetPlacement(); operationController.abort(); aiController.value?.abort(); viewport?.dispose(); });
// ===== ACT: 外部总Agent事件桥 =====
// 画布上的总Agent通过节点函数（index.vue 按 editorEvents.ts 逐个注册成 nodeTools）操作编辑器：每个界面操作一个入口，
// 像用户点一样立即生效、可撤销；返回结果，执行期间界面报的错（fail）作为调用失败抛出。参数用名字（物体名、机位名、第N镜），这里换成id。
type HostResult = Record<string, unknown> & { files?: StudioEventFile[] };
const hostRound = (value: number) => Math.round(value * 100) / 100;
function hostDefined<T extends object>(value: T) { return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as Partial<T>; }
function hostBusyError() { return new Error(`编辑器正忙（${busy.value || "正在保存场景"}），用editorWait等后台任务做完或稍后再试`); }
async function hostAction(run: (failed: () => boolean) => HostResult | void | Promise<HostResult | void>, options: { whileLocked?: boolean } = {}): Promise<HostResult> {
  if (disposed || !viewport) throw new Error("场景编辑器还没打开或已经关闭");
  if (!options.whileLocked && locked.value) throw hostBusyError();
  let failure: unknown;
  const sink = (error: unknown) => { failure ??= error; };
  failureSinks.add(sink);
  const before = latestScene();
  if (!options.whileLocked) notice.value = "";
  try {
    const value = await run(() => failure !== undefined);
    await nextTick();
    if (failure !== undefined) throw failure instanceof Error ? failure : new Error(String(failure));
    return { ...(value ?? {}), ...(latestScene() !== before ? { changed: true, undoSteps: history.value.length } : {}), ...(notice.value && !options.whileLocked ? { notice: notice.value } : {}) };
  } finally { failureSinks.delete(sink); }
}
/** 物体名或id → 物体；“食客们”“食客*”= 所有名字带“食客”的；同名多个时报出候选让调用方写id。 */
function hostFindObjects(targets: readonly string[]) {
  const objects = latestScene().objects;
  const found = new Map<string, SceneObject>();
  for (const raw of targets) {
    const name = raw.trim();
    const exact = objects.filter(object => object.id === name || object.name === name);
    if (exact.length === 1) { found.set(exact[0]!.id, exact[0]!); continue; }
    const many = /[们*]$/.test(name) ? name.replace(/[们*]+$/, "") : "";
    if (many) {
      const matched = objects.filter(object => object.name.includes(many));
      if (!matched.length) throw new Error(`场景里没有名字带“${many}”的物体，用editorState查看物体名`);
      for (const object of matched) found.set(object.id, object);
      continue;
    }
    const candidates = exact.length ? exact : objects.filter(object => object.name.includes(name) || object.asset.name === name);
    if (candidates.length === 1) { found.set(candidates[0]!.id, candidates[0]!); continue; }
    if (!candidates.length) throw new Error(`场景里没有“${name}”，用editorState查看物体名字和id`);
    throw new Error(`“${name}”对上了${candidates.length}个物体：${candidates.slice(0, 8).map(object => `${object.name}(${object.id})`).join("、")}${candidates.length > 8 ? "…" : ""}；写全名或id，全都要就写“${name}们”`);
  }
  return [...found.values()];
}
function hostFindCamera(name: string) {
  const cameras = latestScene().cameras ?? [];
  const query = name.trim();
  const plain = (value: string) => value.replace(/^(分镜|镜头)·/, "");
  const exact = cameras.find(camera => camera.id === query || camera.name === query);
  if (exact) return exact;
  const list = cameras.filter(camera => plain(camera.name) === plain(query) || camera.name.includes(query));
  if (list.length === 1) return list[0]!;
  if (!cameras.length) throw new Error("场景里还没有机位：先一键分镜（editorAutoCoverage）或用stageShots摆镜头");
  throw new Error(list.length ? `“${query}”对上了多个机位：${list.map(camera => camera.name).join("、")}，写全名或id` : `没有机位“${query}”，现有：${cameras.slice(0, 16).map(camera => camera.name).join("、")}`);
}
/** 第N镜（成片行、镜头表的镜号）→ 机位、这一镜里这台机位的全部镜头段（一镜可能是反应段接台词段），以及at时刻（缺省取中间）所在的那段。 */
function hostProgramShot(number: number, at?: number) {
  const cuts = programCuts.value;
  const cut = cuts.find(item => item.number === number);
  if (!cut) throw new Error(cuts.length ? `没有第${number}镜（共${cuts.at(-1)!.number}镜）` : "还没有镜头段：先一键分镜（editorAutoCoverage）或用stageShots排镜头");
  const end = cuts.filter(item => item.number === number).at(-1)!.end;
  const camera = getStoredCamera(cut.cameraId);
  const segments = (camera?.shots ?? []).filter(shot => shot.end > cut.start + 0.001 && shot.start < end - 0.001).sort((a, b) => a.start - b.start);
  const shot = camera && getCameraShotAt(camera, at !== undefined && at >= cut.start && at < end ? at : (cut.start + cut.end) / 2);
  if (!camera || !shot || !segments.length) throw new Error(`第${number}镜的机位刚变过，请先用editorState重读镜头表`);
  return { camera, shot, segments, start: cut.start, end };
}
function hostShotList() {
  const list: { shot: number; camera: string; start: number; end: number; line?: string; crossesAxis?: true }[] = [];
  for (const cut of programCuts.value) {
    const last = list.at(-1);
    if (last && last.shot === cut.number) { last.end = hostRound(cut.end); continue; }
    const camera = studioCameras.value.find(item => item.id === cut.cameraId);
    const line = camera ? getCameraShotAt(camera, (cut.start + cut.end) / 2)?.note : undefined;
    list.push({ shot: cut.number, camera: camera?.name ?? cut.cameraId, start: hostRound(cut.start), end: hostRound(cut.end), ...(line ? { line: line.slice(0, 120) } : {}), ...(cut.crossesAxis ? { crossesAxis: true as const } : {}) });
  }
  return list.slice(0, 200);
}
function hostSelection() {
  const scene = latestScene();
  const camera = selectedCamera.value;
  const shot = camera && selectedShotId.value ? programCuts.value.find(cut => cut.cameraId === camera.id && getCameraShotAt(camera, (cut.start + cut.end) / 2)?.id === selectedShotId.value)?.number : undefined;
  return { objects: selectedObjectIds.value.map(id => ({ id, name: scene.objects.find(object => object.id === id)?.name ?? id })), ...(camera ? { camera: camera.name } : {}), ...(shot ? { shot } : {}) };
}
function hostAssets() { return [...new Map([...builtinAssets, ...availableAssets.value, ...sceneAssets.value].map(asset => [asset.id, asset])).values()]; }
/** 和素材库搜索框同一套：空格分词，名字里就有的排前面。 */
function hostSearchAssets(query: string, limit: number) {
  const lower = query.trim().toLocaleLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  const assets = hostAssets().filter(asset => !isCatalogDerivative(asset));
  if (!tokens.length) return assets.slice(0, limit);
  const tier = (asset: SceneAsset) => { const name = asset.name.toLocaleLowerCase(); return name === lower ? 0 : tokens.some(token => name.includes(token)) ? 1 : 2; };
  return assets.filter(asset => { const text = getAssetSearchText(asset); return tokens.every(token => matchesSearchToken(text, token)); })
    .map((asset, index) => ({ asset, index })).sort((a, b) => tier(a.asset) - tier(b.asset) || a.index - b.index).slice(0, limit).map(entry => entry.asset);
}
function hostFindAsset(name: string) {
  const query = name.trim();
  const assets = hostAssets();
  const exact = assets.find(asset => asset.id === query) ?? assets.find(asset => asset.name === query);
  if (exact) return exact;
  const matched = hostSearchAssets(query, 8);
  const named = matched.filter(asset => asset.name.includes(query));
  if (named.length === 1) return named[0]!;
  if (!named.length && matched.length === 1) return matched[0]!;
  throw new Error(matched.length ? `“${query}”对上了多个素材：${matched.map(asset => `${asset.name}(${asset.id})`).join("、")}，写全名或id` : `素材库里没有“${query}”，用editorFindAssets换个关键词`);
}
function hostFindTemplate(name: string) {
  const query = name.trim();
  const exact = setTemplates.find(template => template.id === query || template.name === query);
  if (exact) return exact;
  const list = setTemplates.filter(template => template.name.includes(query) || query.includes(template.name));
  if (list.length === 1) return list[0]!;
  throw new Error(list.length ? `“${query}”对上了多个布景：${list.map(template => template.name).join("、")}` : `没有“${query}”这个布景，可用：${setTemplates.map(template => template.name).join("、")}`);
}
function hostFindGroup(name: string) {
  const groups = latestScene().objectGroups ?? [];
  const exact = groups.find(group => group.id === name || group.name === name);
  if (exact) return exact;
  const list = groups.filter(group => group.name.includes(name));
  if (list.length === 1) return list[0]!;
  throw new Error(groups.length ? `没有分组“${name}”，现有：${groups.map(group => group.name).join("、")}` : "场景里还没有分组");
}
function hostModelKey(model: AiModel) { return JSON.stringify([model.providerId, model.modelId]); }
async function hostEnsureModels() {
  if (!props.aiModels?.length && !props.modelsLoading) emit("loadModels");
  for (let tries = 0; tries < 150 && (props.modelsLoading || !props.aiModels?.length); tries++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (tries > 10 && !props.modelsLoading && !props.aiModels?.length) break;
  }
  return props.aiModels ?? [];
}
function hostFindModel(name: string, models: AiModel[]) {
  const query = name.trim().toLocaleLowerCase();
  // 宿主模型选择器的值（[供应商, 模型]）精确匹配，避免不同供应商同名模型选错。
  const found = models.find(model => hostModelKey(model) === name.trim()) ?? models.find(model => model.modelId.toLocaleLowerCase() === query || model.label.toLocaleLowerCase() === query)
    ?? models.find(model => `${model.providerLabel} ${model.label} ${model.modelId}`.toLocaleLowerCase().includes(query));
  if (!found) throw new Error(`没有模型“${name}”，可选：${models.slice(0, 20).map(model => model.label).join("、")}`);
  return found;
}

function hostState(options: { objects?: boolean; query?: string }) {
  const scene = latestScene();
  const time = viewport?.getWorldTime() ?? worldTime.value;
  const layers = Object.fromEntries(Object.entries(getWeatherLayers(scene.weather)).filter(([, value]) => value > 0).map(([key, value]) => [key, hostRound(value)]));
  const lastReply = messages.value.findLast(message => message.role === "assistant");
  return {
    ...(busy.value ? { busy: busy.value } : {}), ...(props.saving ? { saving: true } : {}), ...(notice.value ? { notice: notice.value } : {}), ...(stageError.value ? { error: stageError.value } : {}),
    ...(performanceDraft.value ? { drawingRoute: "正在画演绎路线，很多操作要先完成或取消它" } : {}),
    panel: editorPanel.value || "none", ...(editorPanel.value === "view" ? { tab: worldTab.value } : {}), assetsOpen: assetsOpen.value, chatOpen: chatOpen.value, filmPreview: filmPreview.value,
    selection: hostSelection(),
    ...summarizeScene(scene, options),
    world: { size: scene.terrain?.size ?? worldSizeLimits.default, hour: hostRound(time.hour), date: time.date, paused: time.paused, weather: scene.weather?.condition ?? "clear", layers, ...(scene.weather?.lighting ? { lighting: "手动" } : {}) },
    film: { format: filmFormat.value, duration: hostRound(filmDuration.value), playhead: hostRound(filmTime.value), running: timelineRunning.value, ...(timelineCompleted.value ? { completed: true } : {}), shots: hostShotList() },
    performers: timelineTracks.value.slice(0, 80).map(track => {
      const object = scene.objects.find(item => item.id === track.objectId);
      return { who: object?.name ?? track.objectId, trackId: track.id, ...(track.enabled === false ? { enabled: false } : {}), clips: object ? getPerformanceClips(track, object).slice(0, 40).map(clip => ({ id: clip.id, name: clip.name, start: hostRound(clip.start) })) : [] };
    }),
    history: { undo: history.value.length, redo: redoHistory.value.length },
    agent: {
      running: !!aiController.value, ...(aiController.value ? { status: activeAssistantMessage()?.statusText || "回复中" } : {}),
      ...(pendingQuestionTool()?.question ? { question: (({ title, question, options, fields }) => ({ title, question, ...(options ? { options } : {}), ...(fields ? { fields } : {}) }))(pendingQuestionTool()!.question!) } : {}),
      ...(promptQueue.value.length ? { queued: promptQueue.value.map(item => ({ text: item.text.slice(0, 200), ...(item.steer ? { steer: true } : {}) })) } : {}),
      model: selectedAiModel.value?.label ?? "", models: (props.aiModels ?? []).slice(0, 40).map(model => ({ name: model.label, id: model.modelId, provider: model.providerLabel })),
      session: { id: activeSession.value.id, name: agentSessionName(activeSession.value), messages: activeSession.value.messages.length },
      ...(lastReply ? { lastReply: { text: lastReply.content.trim().slice(-1500), ...(lastReply.error ? { error: lastReply.error } : {}) } } : {}),
    },
    ...(props.upstreamText?.trim() ? { upstreamScript: props.upstreamText.trim().slice(0, 300) } : {}),
  };
}
async function hostCapture(args: StudioEventInput<"editorCapture">): Promise<HostResult | void> {
  const view = viewport!;
  const width = args.width ?? 1280;
  if (args.shot !== undefined) {
    const plan = programShots();
    if (!plan) return;
    const segment = plan.segments[args.shot - 1];
    if (!segment) throw new Error(`没有第${args.shot}镜（共${plan.segments.length}镜）`);
    const original = view.getWorldSeconds();
    try {
      const { row, blob } = await captureProgramShot(args.shot - 1, segment, plan.cameras, plan.range.start, width);
      const label = [`第${row.index}镜`, describeShotSize(row.camera, row.focalLength), row.angle, row.shot?.note].filter(Boolean).join(" · ").slice(0, 120);
      return { label, camera: row.camera.name, start: hostRound(row.start), end: hostRound(row.end), focalLength: Math.round(row.focalLength), ...(row.cast ? { cast: row.cast } : {}), files: [{ label, file: new File([blob], `第${row.index}镜.jpg`, { type: "image/jpeg" }) }] };
    } finally { view.seekPerformance(original, "start"); view.seekPerformance(original, "end"); }
  }
  const camera = args.camera ? hostFindCamera(args.camera) : undefined;
  const pose = camera ? view.getCameraPose(camera.id) ?? sampleSceneCamera(camera, filmTime.value) : undefined;
  const blob = await view.capture(pose, width, "image/jpeg");
  const label = camera ? `机位 ${camera.name}` : "编辑视角";
  return { label, files: [{ label, file: new File([blob], camera ? "机位画面.jpg" : "编辑视角.jpg", { type: "image/jpeg" }) }] };
}
async function hostHistory({ action, steps = 1 }: StudioEventInput<"editorHistory">) {
  let done = 0;
  for (let index = 0; index < steps; index++) {
    const before = `${history.value.length}/${redoHistory.value.length}`;
    if (action === "undo") undo(); else redo();
    await nextTick();
    if (`${history.value.length}/${redoHistory.value.length}` === before) break;
    done++;
  }
  if (!done) throw new Error(action === "undo" ? "没有可撤销的步骤" : "没有可重做的步骤");
  return { done, history: { undo: history.value.length, redo: redoHistory.value.length } };
}
function hostPanel({ panel, tab }: StudioEventInput<"editorPanel">) {
  if (panel === "closeAll") { closeInspector(); assetsOpen.value = false; chatOpen.value = false; }
  else if (panel === "assets") { if (!assetsOpen.value) toggleAssets(); }
  else if (panel === "chat") { if (!chatOpen.value) toggleChat(); }
  else {
    if (panel === "object" && !selectedObject.value) throw new Error("先用editorSelect选中一个物体，再打开物体面板");
    openInspector(panel);
    if (panel === "view" && tab) selectWorldTab(tab);
  }
  return { panel: editorPanel.value || "none", ...(editorPanel.value === "view" ? { tab: worldTab.value } : {}), assetsOpen: assetsOpen.value, chatOpen: chatOpen.value };
}
async function hostSelect(args: StudioEventInput<"editorSelect">) {
  if (args.clear) { selectObject(""); clearCameraSelection(); }
  if (args.objects?.length) {
    const ids = hostFindObjects(args.objects).map(object => object.id);
    selectObjects(ids);
    if (ids.some(id => !selectedObjectIds.value.includes(id))) throw new Error("现在选不了物体（地形或画笔面板正在刷）：先editorPanel closeAll");
    if (args.focus) viewport!.focusObjects(ids);
  }
  if (args.shot !== undefined) { const found = hostProgramShot(args.shot); selectCamera(found.camera.id, found.shot.id); }
  else if (args.camera) selectCamera(hostFindCamera(args.camera).id);
  else if (args.focus && !args.objects?.length && subjectId.value) viewport!.focus(subjectId.value);
  await nextTick();
  return { selection: hostSelection() };
}
async function hostObjects(args: StudioEventInput<"editorObjects">): Promise<HostResult | void> {
  const view = viewport!;
  const need = <T,>(value: T | undefined, message: string) => { if (value === undefined || Array.isArray(value) && !value.length) throw new Error(message); return value; };
  const brief = (objects: SceneObject[]) => objects.map(object => ({ id: object.id, name: object.name }));
  switch (args.action) {
    case "edit": {
      const items = need(args.items, "edit要给items：[{target, name/visible/gravity/color/position/rotation/scale/height}]");
      const scene = latestScene();
      const placements = new Map(view.getObjectPlacements().map(placement => [placement.id, placement]));
      const updates = new Map<string, SceneObject>();
      for (const item of items) for (const object of hostFindObjects([item.target])) {
        const base = updates.get(object.id) ?? { ...object, ...placements.get(object.id) };
        const scale = item.scale === undefined ? undefined : typeof item.scale === "number" ? { x: item.scale, y: item.scale, z: item.scale } : { ...base.scale, ...hostDefined(item.scale) };
        const next: SceneObject = { ...base, ...hostDefined({ name: item.name, visible: item.visible, color: item.color, gravityEnabled: item.gravity, height: item.height, scale }),
          ...(item.position ? { position: { ...base.position, ...hostDefined(item.position) } } : {}),
          ...(item.rotation ? { rotation: { ...base.rotation, ...hostDefined(item.rotation) } } : {}) };
        const moved = !!item.position || !!item.rotation || scale !== undefined || item.height !== undefined || item.gravity !== undefined;
        updates.set(object.id, { ...next, ...(moved ? view.constrainTransform(object.id, next, !!item.position && item.height === undefined) : {}) });
      }
      commit({ ...scene, objects: scene.objects.map(object => updates.get(object.id) ?? object) });
      return { edited: brief([...updates.values()]) };
    }
    case "remove": {
      const objects = hostFindObjects(need(args.targets, "remove要给targets"));
      removeObjects(objects.map(object => object.id));
      return { removed: brief(objects) };
    }
    case "duplicate": {
      const objects = hostFindObjects(need(args.targets, "duplicate要给targets"));
      const scene = latestScene();
      const placements = new Map(view.getObjectPlacements().map(placement => [placement.id, placement]));
      const copies = objects.map(source => {
        const object: SceneObject = JSON.parse(JSON.stringify({ ...source, ...placements.get(source.id) }));
        return { ...object, id: crypto.randomUUID(), name: `${object.name.slice(0, 156)} 副本`, position: { ...object.position, x: object.position.x + (object.position.x < 9999 ? 1 : -1) } };
      });
      commit({ ...scene, objects: [...scene.objects, ...copies] });
      await nextTick();
      selectObjects(copies.map(copy => copy.id));
      return { created: brief(copies) };
    }
    case "group": {
      const ids = hostFindObjects(need(args.targets, "group要给targets")).map(object => object.id);
      const before = new Set((latestScene().objectGroups ?? []).map(group => group.id));
      selectObjects(ids);
      if (ids.some(id => !selectedObjectIds.value.includes(id))) throw new Error("现在选不了这些物体（地形或画笔面板正在刷）：先editorPanel closeAll");
      groupSelectedObjects();
      await nextTick();
      const group = (latestScene().objectGroups ?? []).find(item => !before.has(item.id));
      if (!group) return;
      if (args.name) { renameObjectGroup(group.id, args.name); await nextTick(); }
      return { group: { id: group.id, name: args.name ?? group.name, objects: ids.length } };
    }
    case "ungroup": {
      const group = hostFindGroup(need(args.group, "ungroup要给group"));
      ungroupObjects(group.id);
      return { ungrouped: group.name };
    }
    case "renameGroup": {
      const group = hostFindGroup(need(args.group, "renameGroup要给group"));
      renameObjectGroup(group.id, need(args.name, "renameGroup要给name"));
      return { group: { id: group.id, name: args.name } };
    }
    case "replace": {
      const objects = hostFindObjects(need(args.targets, "replace要给targets"));
      const asset = hostFindAsset(need(args.asset, "replace要给asset（素材名或id）"));
      replaceTargets.value = objects.map(object => object.id);
      try { await replaceWithAsset(asset); }
      finally { replaceTargets.value = []; }
      return { replaced: brief(objects), asset: { id: asset.id, name: asset.name } };
    }
  }
}
function hostFindAssetsResult({ query = "", limit = 30 }: StudioEventInput<"editorFindAssets">) {
  const assets = hostSearchAssets(query, limit);
  const text = query.trim();
  const templates = setTemplates.filter(template => !text || text.split(/\s+/).some(token => template.name.includes(token) || template.genre.includes(token) || token.includes(template.name)));
  return {
    assets: assets.map(asset => ({ id: asset.id, name: asset.name, category: asset.category, ...(asset.theme ? { theme: asset.theme } : {}), ...(asset.shape ? { shape: asset.shape } : {}) })),
    ...(templates.length ? { setTemplates: templates.slice(0, 40).map(template => ({ id: template.id, name: template.name, genre: template.genre })) } : {}),
    ...(assets.length ? {} : { hint: "没找到：换个更短或更常见的词，比如“桌子”“古代 房子”" }),
  };
}
async function hostAddAssets(items: StudioEventInput<"editorAddAssets">["items"], failed: () => boolean): Promise<HostResult> {
  const added: { id: string; name: string }[] = [];
  for (const item of items) {
    const asset = hostFindAsset(item.asset);
    for (let index = 0; index < (item.count ?? 1); index++) {
      const before = new Set(latestScene().objects.map(object => object.id));
      const spot = item.position;
      const x = spot ? spot.x + (index % 4) * 1.5 : 0, z = spot ? spot.z + Math.floor(index / 4) * 1.5 : 0;
      await addAsset(asset, spot ? { x, y: spot.y ?? viewport!.getGroundHeight(x, z), z } : undefined);
      if (failed()) return { added };
      await nextTick();
      const object = latestScene().objects.find(item => !before.has(item.id));
      if (!object) throw new Error(`没能放下“${asset.name}”${notice.value ? "：" + notice.value : ""}`);
      if (item.name || item.rotation !== undefined) {
        const scene = latestScene();
        commit({ ...scene, objects: scene.objects.map(entry => entry.id === object.id ? { ...entry, ...(item.name ? { name: item.name } : {}), ...(item.rotation !== undefined ? { rotation: { ...entry.rotation, y: item.rotation } } : {}) } : entry) }, false);
        await nextTick();
      }
      added.push({ id: object.id, name: item.name ?? object.name });
    }
  }
  return { added };
}
async function hostSetTemplate({ template }: StudioEventInput<"editorSetTemplate">) {
  const found = hostFindTemplate(template);
  const before = latestScene().objects.length;
  await applySetTemplate(found);
  await nextTick();
  return { template: found.name, added: latestScene().objects.length - before };
}
async function hostImportModel({ file, name, position }: StudioEventInput<"editorImportModel">): Promise<HostResult | void> {
  if (!file) throw new Error("没有读到模型文件");
  const before = new Set(latestScene().objects.map(object => object.id));
  await importFile(file);
  await nextTick();
  const object = latestScene().objects.find(item => !before.has(item.id));
  if (!object) return;
  if (name || position) {
    const scene = latestScene();
    const at = position && { x: position.x, y: (position.y ?? viewport!.getGroundHeight(position.x, position.z)) + 0.5, z: position.z };
    commit({ ...scene, objects: scene.objects.map(entry => entry.id === object.id ? { ...entry, ...(name ? { name } : {}), ...(at ? { position: at, height: at.y } : {}) } : entry) }, false);
    await nextTick();
  }
  return { added: { id: object.id, name: name ?? object.name } };
}
function hostWorld(args: StudioEventInput<"editorWorld">) {
  const view = viewport!;
  let next: SceneDocument = { ...latestScene() };
  let jump = false;
  if (args.mood) { const mood = moodPresets.find(item => item.name === args.mood)!; next = { ...next, ...moodPatch(next, mood) }; jump = true; }
  if (args.time) {
    next.time = sceneTimeSchema.parse({ ...(args.mood ? next.time : view.getWorldTime()), ...hostDefined(args.time) });
    if (args.time.hour !== undefined || args.time.date !== undefined) jump = true;
  }
  if (args.layers || args.clearLayers || args.weather || args.lighting !== undefined) {
    let weather: SceneWeather = { ...defaultWeather, ...next.weather };
    if (args.clearLayers || args.layers) {
      const layers = { ...(args.clearLayers ? Object.fromEntries(weatherLayerKeys.map(key => [key, 0])) : getWeatherLayers(weather)), ...hostDefined(args.layers ?? {}) } as NonNullable<SceneWeather["layers"]>;
      weather = { ...weather, layers, condition: weatherLayerOptions.find(layer => (layers[layer.key] ?? 0) > 0)?.condition ?? "clear" };
    }
    if (args.weather) weather = { ...weather, ...hostDefined(args.weather) };
    if (args.lighting === null) { const { lighting: _lighting, ...rest } = weather; weather = rest; }
    else if (args.lighting) weather = { ...weather, lighting: { ...weather.lighting, ...hostDefined(args.lighting) } };
    next.weather = weather;
  }
  if (args.atmosphere) next.atmosphere = { ...defaultAtmosphere, ...next.atmosphere, ...hostDefined(args.atmosphere) };
  if (args.grid !== undefined) next.gridVisible = args.grid;
  if (args.axes !== undefined || args.shadows !== undefined) next.display = { ...next.display, ...hostDefined({ axesVisible: args.axes, shadowsEnabled: args.shadows }) };
  if (args.worldSize !== undefined) {
    view.cancelTerrainStroke();
    const terrain = resizeTerrain(next.terrain, args.worldSize);
    view.sync({ ...next, terrain });
    const placements = new Map(view.getObjectPlacements().map(placement => [placement.id, placement]));
    next = { ...next, terrain, objects: next.objects.map(object => ({ ...object, ...placements.get(object.id) })) };
    selectedTerrainTree.value = null;
    view.selectTerrainTree(null);
  }
  cancelTimeDraft(); cancelWeatherDraft(); cancelAtmosphereDraft();
  if (jump) view.markWorldTimeJump();
  try { commit(next); }
  catch (error) { view.sync(viewportDocument()); throw error; }
  return { world: { size: next.terrain?.size ?? worldSizeLimits.default, hour: next.time?.hour, weather: next.weather?.condition ?? "clear" } };
}
async function hostPlayback({ action, seconds, shot }: StudioEventInput<"editorPlayback">) {
  if (performanceDraft.value) throw new Error("编辑器里正在画演绎路线，先完成或取消");
  const range = filmRange.value;
  if (action === "play") { if (!timelineRunning.value) toggleTimelinePlayback(); }
  else if (action === "pause") pausePlayback();
  else if (action === "restart") { if (!range) throw new Error("还没有演绎可以播放"); resetLife(); }
  else if (action === "seek") {
    if (!range) throw new Error("还没有演绎或镜头，没有可定位的成片时间");
    const at = shot !== undefined ? hostProgramShot(shot).start : seconds;
    if (at === undefined) throw new Error("seek要给seconds（成片第几秒）或shot（第N镜）");
    seekFilm(at);
  } else if (action === "preview") {
    if (!studioCameras.value.length) throw new Error("还没有机位：先一键分镜（editorAutoCoverage）");
    setFilmPreview(true);
  } else setFilmPreview(false);
  await nextTick();
  return { playhead: hostRound(filmTime.value), duration: hostRound(filmDuration.value), running: timelineRunning.value, filmPreview: filmPreview.value };
}
async function hostCameras(args: StudioEventInput<"editorCameras">): Promise<HostResult | void> {
  if (cameraLocked.value) throw new Error("编辑器里正在画演绎路线，先完成或取消");
  const camera = () => hostFindCamera(args.camera ?? (() => { throw new Error(`${args.action}要给camera（机位名或id）`); })());
  const shot = () => hostProgramShot(args.shot ?? (() => { throw new Error(`${args.action}要给shot（第几镜）`); })());
  switch (args.action) {
    case "add": {
      const before = new Set((latestScene().cameras ?? []).map(item => item.id));
      addCamera();
      await nextTick();
      const added = (latestScene().cameras ?? []).find(item => !before.has(item.id));
      if (!added) return;
      if (args.name) { renameCamera(added.id, args.name); await nextTick(); }
      return { camera: { id: added.id, name: args.name ?? added.name } };
    }
    case "remove": { const found = camera(); removeCamera(found.id); return { removed: found.name }; }
    case "rename": { if (!args.name) throw new Error("rename要给name"); const found = camera(); renameCamera(found.id, args.name); return { camera: { id: found.id, name: args.name } }; }
    case "enable": case "disable": {
      const found = camera();
      if ((found.enabled !== false) !== (args.action === "enable")) toggleCameraEnabled(found.id);
      return { camera: found.name, enabled: args.action === "enable" };
    }
    case "format": {
      if (!args.format) throw new Error("format要给format：16:9/2.39:1/1.85:1/4:3/9:16");
      setFilmFormatChoice(args.format);
      return { format: args.format };
    }
    case "createShot": {
      const found = camera();
      if (args.start === undefined || args.end === undefined || args.end - args.start < minShotSeconds) throw new Error(`createShot要给start、end（成片秒），至少${minShotSeconds}秒`);
      await createCameraShot(found.id, args.start, args.end);
      await nextTick();
      return { shots: hostShotList() };
    }
    case "retimeShot": {
      // 这一镜的头 = 第一段的开头，尾 = 最后一段的结尾；中间的反应段、台词段切点不动。
      if (args.start === undefined && args.end === undefined) throw new Error("retimeShot要给start或end（成片秒）");
      const found = shot();
      const first = found.segments[0]!, last = found.segments.at(-1)!;
      if (args.start !== undefined) {
        if ((first === last ? args.end ?? last.end : first.end) - args.start < minShotSeconds) throw new Error(`镜头段至少${minShotSeconds}秒`);
        changeCameraShot(found.camera.id, first.id, args.start, first === last ? args.end ?? first.end : first.end);
      }
      if (args.end !== undefined && (first !== last || args.start === undefined)) {
        const start = first === last ? args.start ?? last.start : last.start;
        if (args.end - start < minShotSeconds) throw new Error(`镜头段至少${minShotSeconds}秒`);
        await nextTick();
        changeCameraShot(found.camera.id, last.id, start, args.end);
      }
      await nextTick();
      const camera = getStoredCamera(found.camera.id);
      return { camera: found.camera.name, segments: (camera?.shots ?? []).filter(item => found.segments.some(segment => segment.id === item.id)).map(item => ({ start: item.start, end: item.end })), shots: hostShotList(), note: "改的是这台机位的镜头段；和别的机位的镜头段重叠时，成片按前后层次取，shots是成片实际的镜头表" };
    }
    case "removeShot": {
      const found = shot();
      cancelCameraGesture();
      let next = found.camera;
      for (const segment of found.segments) next = withoutCameraShot(next, segment.id);
      if (changeCamera(next) && found.segments.some(segment => segment.id === selectedShotId.value)) selectedShotId.value = "";
      await nextTick();
      return { removed: `第${args.shot}镜（${found.camera.name}，${found.segments.length}段）`, shots: hostShotList() };
    }
    case "splitShot": {
      if (args.at === undefined) throw new Error("splitShot要给at（成片第几秒）");
      const at = args.at;
      const found = shot();
      if (at <= found.start || at >= found.end) throw new Error(`第${args.shot}镜在成片${hostRound(found.start)}–${hostRound(found.end)}秒，at要在这中间`);
      if (found.segments.some(segment => Math.abs(segment.start - at) < 0.001 || Math.abs(segment.end - at) < 0.001)) throw new Error(`第${args.shot}镜在${at}秒处本来就分成前后两段了`);
      splitCameraShotAt(found.camera.id, hostProgramShot(args.shot!, at).shot.id, at);
      await nextTick();
      return { shots: hostShotList() };
    }
    case "fixLineTiming": fixLineTiming(); await nextTick(); return { shots: hostShotList() };
  }
}
function hostPerformance(args: StudioEventInput<"editorPerformance">) {
  if (performanceDraft.value) throw new Error("编辑器里正在画演绎路线，先完成或取消");
  const objects = hostFindObjects([args.who]);
  if (objects.length !== 1) throw new Error(`“${args.who}”对上了${objects.length}个物体，一次只改一个人的演绎`);
  const object = objects[0]!;
  const track = performanceTrackForObject(object.id);
  if (!track) throw new Error(`${object.name}还没有演绎`);
  if (args.action === "removeTrack") { removePerformanceTrack(track.id); return { removed: object.name }; }
  const source = latestScene().objects.find(item => item.id === track.objectId) ?? object;
  const clips = getPerformanceClips(track, source);
  if (!args.clip) throw new Error(`${args.action}要给clip，${object.name}的片段：${clips.map(clip => clip.name).join("、")}`);
  const query = args.clip;
  const describe = (list: typeof clips) => list.map(item => `${item.name}(id ${item.id}，${hostRound(item.start)}秒起)`).join("、");
  const exact = clips.filter(item => item.id === query || item.name === query);
  const candidates = exact.length ? exact : clips.filter(item => item.name.includes(query));
  if (candidates.length > 1) throw new Error(`${object.name}有${candidates.length}个片段对得上“${query}”：${describe(candidates)}，用id指定`);
  const clip = candidates[0];
  if (!clip) throw new Error(`${object.name}没有片段“${query}”，现有：${describe(clips)}`);
  if (args.action === "removeClip") { removePerformanceClip(track.id, clip.id); return { removed: `${object.name} · ${clip.name}` }; }
  if (args.at === undefined) throw new Error("splitClip要给at（从片段开头算起第几秒）");
  splitPerformanceClipAt(track.id, clip.id, clip.start + args.at);
  return { split: `${object.name} · ${clip.name}` };
}
async function hostAutoCoverage({ script, pace }: StudioEventInput<"editorAutoCoverage">) {
  if (cameraLocked.value) throw new Error("编辑器里正在画演绎路线，先完成或取消");
  if (!latestScene().objects.length && !script) throw new Error("场景是空的：先搭景放人（editorSetTemplate/editorAddAssets），或给script让它按剧本搭景");
  await coverScript(script, pace);
  await nextTick();
  return { shots: hostShotList() };
}
async function hostPrevis({ script }: StudioEventInput<"editorPrevisScript">) {
  if (cameraLocked.value) throw new Error("编辑器里正在画演绎路线，先完成或取消");
  if (script) await previsFromScript(script);
  else {
    if (!props.upstreamText?.trim()) throw new Error("没有剧本：给script，或在画布上把剧本文本节点连到本节点的输入口");
    await previsFromUpstream();
  }
  await nextTick();
  return { objects: latestScene().objects.length, shots: hostShotList() };
}
async function hostExport({ items, longEdge, to }: StudioEventInput<"editorExport">) {
  const destination = to ?? (props.exportCanvas ? "canvas" : "files");
  if (destination === "canvas" && !props.exportCanvas) throw new Error("导出到画布要在 Toonflow 画布的节点里用；改用to:\"files\"存进工作区");
  const files: File[] = [];
  fileSink = file => files.push(file);
  let result: Awaited<ReturnType<typeof runExport>>;
  try { result = await runExport(items, destination, longEdge ?? 1280); } finally { fileSink = undefined; }
  return { items, to: destination, ...(result ?? {}), ...(files.length ? { files: files.map(file => ({ label: file.name, file })) } : {}) };
}
async function hostAgentChat(args: StudioEventInput<"editorAgentChat">): Promise<HostResult> {
  if (disposed || !viewport) throw new Error("场景编辑器还没打开或已经关闭");
  if (!props.generateAi) throw new Error("当前环境没有内置Agent");
  // 和对话框一样：回复期间可以排队或引导（只收文字）。
  if (aiController.value) {
    if (!args.whileRunning) throw new Error("内置Agent正在回复上一条：用editorWait等它做完、editorAgentStop停下，或带whileRunning=queue排队、steer引导");
    if (args.files?.length) throw new Error("内置Agent回复期间只能排队或引导文字，附件等本轮做完再发");
    promptQueue.value = [...promptQueue.value, { id: crypto.randomUUID(), text: args.message, steer: args.whileRunning === "steer" }];
    return { queued: true, mode: args.whileRunning, position: promptQueue.value.length, note: args.whileRunning === "steer" ? "它做完手上这一步就按这句调整；本轮结束前没交出去的会接着当新消息发" : "本轮做完会接着发这句" };
  }
  if (compacting.value) throw new Error("内置Agent正在压缩对话上下文，稍后再试");
  if (performanceDraft.value) throw new Error("编辑器里正在画演绎路线，先完成或取消再发");
  if (locked.value) throw hostBusyError();
  const models = await hostEnsureModels();
  if (!models.length) throw new Error("还没有可用的文本模型：先在 Toonflow 设置里添加模型");
  const model = args.model ? hostFindModel(args.model, models) : selectedAiModel.value ?? models[0]!;
  // 先校验再切换，校验失败不改用户对话框里选的模型。
  const levels = model.reasoningLevels?.filter(level => Object.hasOwn(thinkingLabels, level)) ?? [];
  if (args.thinking && !levels.includes(args.thinking)) throw new Error(`${model.label}${levels.length ? `的思考强度只能选：${levels.join("、")}` : "不支持调思考强度，去掉thinking"}`);
  if (modelKey.value !== hostModelKey(model)) { modelKey.value = hostModelKey(model); await nextTick(); }
  if (args.thinking) thinkingLevel.value = args.thinking;
  finishVoiceInput();
  if (args.newSession) newSession();
  // 默认按场景对话（能搭景改物体）；演绎面板开着时界面上会变成只改演绎的对话，这里先收起。
  if (args.performance) rememberPerformanceContext();
  else { performanceContext.value = undefined; if (editorPanel.value === "life") closeInspector(); }
  // 外部总 Agent 发来的是新的一句：退出“编辑重发”，不带用户草稿里的附件。
  cancelEditMessage();
  promptImages.value = [];
  promptDocuments.value = [];
  if (args.files?.length) {
    let failure: unknown;
    const sink = (error: unknown) => { failure ??= error; };
    failureSinks.add(sink);
    try { await addPromptFiles(args.files); }
    finally { failureSinks.delete(sink); }
    if (failure !== undefined) throw failure instanceof Error ? failure : new Error(String(failure));
  }
  prompt.value = args.message;
  await nextTick();
  const session = activeSession.value;
  const count = session.messages.length;
  const adoptions = aiAdoptions;
  await runAi();
  const reply = session.messages.length > count ? session.messages.findLast(message => message.role === "assistant") : undefined;
  if (!reply || reply.error) {
    // 界面失败时会把这句话放回输入框等用户重发；外部调用的不留在用户的输入框里。
    if (prompt.value === args.message) { prompt.value = ""; promptImages.value = []; }
    if (!reply) throw new Error(notice.value || "内置Agent没有开始回复，用editorState看看编辑器状态");
  }
  return {
    reply: reply.content.trim().slice(0, 6000), ...(reply.error ? { error: reply.error } : {}), ...(reply.warnings?.length ? { warnings: reply.warnings } : {}),
    changed: aiAdoptions !== adoptions, session: { id: session.id, name: agentSessionName(session) }, model: model.label,
  };
}
function hostAgentStop(): HostResult {
  const running = !!aiController.value || !!compactionController.value;
  if (aiController.value) stopAi();
  compactionController.value?.abort();
  return { stopped: running };
}
/** 内置Agent正在等用户回答的提问卡（最新一条）。 */
function pendingQuestionTool() {
  for (const message of [...messages.value].reverse()) {
    if (message.role !== "assistant" || !message.streaming) continue;
    const part = message.parts?.findLast((item): item is AgentToolPart => item.type === "tool" && item.tool.status === "running" && !!item.tool.question);
    if (part) return part.tool;
  }
  return undefined;
}
async function hostAgentAnswer(args: StudioEventInput<"editorAgentAnswer">): Promise<HostResult> {
  const tool = pendingQuestionTool();
  if (!tool?.question) throw new Error("内置Agent现在没有在等提问卡的回答");
  if (!args.skip && !args.answer && !args.values) throw new Error("给answer、values，或skip=true跳过");
  if (args.values && !tool.question.fields?.length) throw new Error("这张提问卡没有表单字段，用answer回答");
  await answerAgentQuestion(tool.question, args.skip ? { skipped: true } : args.values ? { values: args.values } : { answer: args.answer });
  return { answered: true, question: tool.question.title };
}
async function hostSessions({ action, id, name, limit = 10, n }: StudioEventInput<"editorAgentSessions">): Promise<HostResult> {
  const find = (value = id) => {
    const session = value ? sessions.value.find(item => item.id === value || agentSessionName(item) === value) : activeSession.value;
    if (!session) throw new Error(`没有对话“${value}”，用list查看`);
    return session;
  };
  const list = () => historySessions.value.map(session => ({ id: session.id, name: agentSessionName(session), messages: session.messages.length, updatedAt: new Date(session.updatedAt).toISOString(), ...(session.id === activeSessionId.value ? { active: true } : {}) }));
  const idle = () => { if (sessionBusy.value) throw new Error("内置Agent正在回复或压缩，先等它做完（editorWait）或editorAgentStop"); };
  switch (action) {
    case "list": return { sessions: list() };
    case "read": {
      const session = find();
      return { id: session.id, name: agentSessionName(session), ...(session.summary ? { summary: session.summary.slice(0, 2000) } : {}),
        messages: session.messages.map((message, index) => ({ n: index + 1, message })).slice(-limit).map(({ n, message }) => ({ n, role: message.role, text: message.content.slice(0, 3000), ...(message.delivery === "steer" ? { steer: true } : {}), ...(message.error ? { error: message.error } : {}), ...(message.images?.length ? { images: message.images.length } : {}), ...(message.attachments?.length ? { documents: message.attachments.map(file => file.name) } : {}), ...(message.streaming ? { streaming: true } : {}) })) };
    }
    case "deleteMessage":
    case "branch": {
      if (!n) throw new Error(`${action}要给n（read返回的消息序号）`);
      idle();
      const message = activeSession.value.messages[n - 1];
      if (!message) throw new Error(`当前对话没有第${n}条消息，共${activeSession.value.messages.length}条`);
      if (action === "deleteMessage") { removeMessage(message); return { id: activeSession.value.id, messages: activeSession.value.messages.length }; }
      branchFromMessage(message);
      return { id: activeSession.value.id, name: agentSessionName(activeSession.value), messages: activeSession.value.messages.length };
    }
    case "new": idle(); newSession(); return { id: activeSessionId.value };
    case "select": { if (!id) throw new Error("select要给id"); const session = find(); idle(); selectSession(session.id); return { id: activeSessionId.value }; }
    case "rename": { if (!name) throw new Error("rename要给name"); const session = find(); renameSession(session.id, name); return { id: session.id, name: agentSessionName(session) }; }
    case "remove": {
      if (!id) throw new Error("remove要给id");
      const session = find();
      idle();
      if (historySessions.value.length <= 1) throw new Error("只剩一段对话，不能删");
      removeSession(session.id);
      return { sessions: list() };
    }
    case "compact": {
      idle();
      if (locked.value) throw hostBusyError();
      if (!canCompact.value) throw new Error("这段对话还短，不用压缩");
      if (!selectedAiModel.value) {
        const model = (await hostEnsureModels())[0];
        if (!model) throw new Error("还没有可用的文本模型");
        modelKey.value = hostModelKey(model);
        await nextTick();
      }
      await compactNow();
      return { summary: activeSession.value.summary?.slice(0, 2000) ?? "" };
    }
  }
}
const hostEvents: { [Name in StudioEventName]: (args: StudioEventInput<Name>) => Promise<HostResult> } = {
  editorState: async args => hostState(args),
  editorCapture: args => hostAction(() => hostCapture(args)),
  editorHistory: args => hostAction(() => hostHistory(args)),
  editorPanel: args => hostAction(() => hostPanel(args)),
  editorSelect: args => hostAction(() => hostSelect(args)),
  editorObjects: args => hostAction(() => hostObjects(args)),
  editorFindAssets: async args => hostFindAssetsResult(args),
  editorAddAssets: args => hostAction(failed => hostAddAssets(args.items, failed)),
  editorSetTemplate: args => hostAction(() => hostSetTemplate(args)),
  editorImportModel: args => hostAction(() => hostImportModel(args)),
  editorWorld: args => hostAction(() => hostWorld(args)),
  editorPlayback: args => hostAction(() => hostPlayback(args)),
  editorCameras: args => hostAction(() => hostCameras(args)),
  editorPerformance: args => hostAction(() => hostPerformance(args)),
  editorAutoCoverage: args => hostAction(() => hostAutoCoverage(args)),
  editorPrevisScript: args => hostAction(() => hostPrevis(args)),
  editorExport: args => hostAction(() => hostExport(args)),
  editorAgentChat: args => hostAgentChat(args),
  editorAgentStop: async () => hostAgentStop(),
  editorAgentAnswer: args => hostAgentAnswer(args),
  editorAgentSessions: args => hostAction(() => hostSessions(args), { whileLocked: true }),
};
function runHostEvent<Name extends StudioEventName>(name: Name, args: StudioEventInput<Name>) {
  return (hostEvents[name] as (args: StudioEventInput<Name>) => Promise<HostResult>)(args);
}
/** 节点等编辑器的3D视口建好、模型载入完再派发事件。 */
async function hostReady() {
  if (!viewport) await nextTick();
  if (!viewport || disposed) throw new Error(stageError.value || "3D视口没有启动（当前环境可能不支持WebGL）");
  await viewport.whenReady();
}
function hostStatus() {
  const question = pendingQuestionTool()?.question;
  return { ...(busy.value ? { busy: busy.value } : {}), ...(aiController.value ? { agent: activeAssistantMessage()?.statusText || "内置Agent回复中" } : {}), ...(question ? { question: `内置Agent在等回答：“${question.title}”，用editorAgentAnswer回答或跳过（editorState看选项）` } : {}), ...(notice.value ? { notice: notice.value } : {}) };
}

// 导演工具（Agent stageAct/stageShots）用视口里已载入的真实模型（含导入的GLB）量占地、找座面、查视线。
defineExpose({ flushView, stageProbe: () => viewport?.createStageProbe(), hostReady, hostStatus, runHostEvent, hostClose: requestClose });
</script>

<style scoped lang="scss">
@keyframes exportHint { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-primary) 0%, transparent); } 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 30%, transparent); color: var(--el-color-primary); } }
.sceneStudio {
  --studioGlassBackground: color-mix(in srgb, var(--el-bg-color-overlay) 70%, transparent);
  --studioControlBackground: color-mix(in srgb, var(--el-fill-color) 45%, transparent);
  --studioHoverBackground: color-mix(in srgb, var(--el-fill-color) 70%, transparent);
  --studioPressedBackground: color-mix(in srgb, var(--el-text-color-primary) 12%, transparent);
  --studioActiveBackground: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  --studioActiveText: color-mix(in srgb, var(--el-color-primary) 15%, var(--el-text-color-primary));
  --studioActionBackground: color-mix(in srgb, var(--el-text-color-primary) 84%, transparent);
  --studioBorderColor: var(--el-border-color-light);
  --studioShadow: none;

  position: relative; width: 100%; height: 100%; min-height: 360px; overflow: hidden; color: var(--el-text-color-primary); background: var(--el-bg-color); font: inherit; font-size: 12px; line-height: 1.5;
  * { box-sizing: border-box; }
  h1, h2, h3, p { margin: 0; }
  h2 { font-size: 13px; font-weight: 600; }
  ::selection { background: var(--el-color-primary-light-7); }
  :deep(*) { scrollbar-width: thin; scrollbar-color: var(--el-border-color) transparent; }
  button, input, select { font: inherit; color: inherit; }
  button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 7px; border: 0; border-radius: var(--ui-radius-small, 6px); background: transparent; cursor: pointer; text-decoration: none; white-space: nowrap; -webkit-tap-highlight-color: transparent; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &:active:not(:disabled) { background: var(--studioPressedBackground); } &:disabled { opacity: 0.4; cursor: default; } &.active { color: var(--el-color-primary); background: var(--studioActiveBackground); } }
  button, input, select, canvas { &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  input, select { min-width: 0; width: 100%; padding: 6px 8px; border: 1px solid var(--el-border-color-light); border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); caret-color: var(--el-color-primary); }
  input::placeholder { color: var(--el-text-color-regular); }
  select option { color: var(--el-text-color-primary); background: var(--el-bg-color-overlay); }

  :deep(.el-slider) {
    --el-slider-runway-bg-color: color-mix(in srgb, var(--el-text-color-primary) 14%, transparent);
    .el-slider__button { background: color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent); }
  }
  .spinning { animation: studioSpin 1s linear infinite; }
  button { transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease; }
  .panelEnterActive { transition: opacity 220ms ease-out, translate 220ms cubic-bezier(0.16, 1, 0.3, 1), scale 220ms cubic-bezier(0.16, 1, 0.3, 1); }
  .panelLeaveActive { transition: opacity 140ms ease-in, translate 140ms ease-in, scale 140ms ease-in; pointer-events: none; }
  .panelEnterFrom, .panelLeaveTo { opacity: 0; translate: var(--panelShiftX, 0px) var(--panelShiftY, 8px); scale: 0.985; }
  .assetPanel { --panelShiftX: -12px; --panelShiftY: 0px; }
  .editPanel { --panelShiftX: 12px; --panelShiftY: 0px; }
  .selectionToolbar { --panelShiftY: 4px; }

  .floatingPanel { background: var(--studioGlassBackground); border-radius: var(--ui-radius-large, 14px); box-shadow: var(--studioShadow); }
  .panelHeading { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 16px 8px; h2 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; } button { width: 28px; height: 28px; padding: 5px; color: var(--el-text-color-regular); border-radius: 7px; } }
  .worldCanvas { position: absolute; inset: 0; > canvas { display: block; width: 100%; height: 100%; touch-action: none; } &.dragOver { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  .performanceLabels { position: absolute; inset: 0; z-index: 3; overflow: hidden; pointer-events: none;
    > button { position: absolute; translate: -50% -100%; display: inline-flex; align-items: center; gap: 6px; max-width: 260px; padding: 4px 7px; border: 0; background: transparent; color: #fff; font-size: 12px; line-height: 1.4; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; text-shadow: 0 1px 3px #000; pointer-events: auto;
      .trackDot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--trackColor); }
      &.eventLabel { border-radius: 14px; background: #17191de8; text-shadow: none; }
      &.warningLabel { translate: -50% 45%; background: #c0392bf0; .trackDot { display: none; } }
      &.selected .trackDot { outline: 1px solid #fff; outline-offset: 2px; }
      &:focus-visible { outline: 2px solid var(--trackColor); }
    }
  }
  .filmPreviewBar { position: absolute; z-index: 15; top: 16px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; max-width: calc(100% - 36px); padding: 5px 5px 5px 12px; border-radius: 12px; font-size: 12px; > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } > button { gap: 5px; padding: 5px 8px; border-radius: 8px; background: var(--studioControlBackground); } kbd { color: var(--el-text-color-secondary); font: inherit; font-size: 10px; } .cameraDot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-primary); animation: filmRecording 1.4s ease-in-out infinite; } }
  &.filmPreview .worldHeader .worldInfo, &.filmPreview .worldDock, &.filmPreview .performanceLabels { opacity: 0; pointer-events: none; }
  .worldHeader .worldInfo, .worldDock { transition: opacity 200ms ease; }
  .worldHeader { position: absolute; z-index: 4; inset: 16px 16px auto; display: flex; align-items: center; justify-content: space-between; gap: 14px; pointer-events: none;
    .worldInfo { display: flex; flex-direction: column; flex-shrink: 0; gap: 3px; color: #fff; font-size: 13px; font-weight: 500; line-height: 1.5; font-variant-numeric: tabular-nums; white-space: nowrap; text-shadow: 0 1px 2px rgb(0 0 0 / 55%), 0 0 8px rgb(0 0 0 / 25%); }
    .worldActions { display: flex; align-items: center; min-height: 40px; padding: 4px 8px; border-radius: 12px; background: var(--studioGlassBackground); box-shadow: var(--studioShadow); pointer-events: auto; }
    // 分好镜还没导出时，右上角导出按钮呼吸提示。
    .exportHint { animation: exportHint 1.6s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .exportHint { animation: none; color: var(--el-color-primary); } }
    .worldActions { gap: 3px; > button { width: 32px; height: 32px; padding: 6px; border-radius: 8px; } .saveStatus { max-width: 180px; padding-inline: 6px 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-regular); font-size: 11px; }   .closeStudio { margin-left: 3px; } }
  }

  .studioNotice { position: absolute; z-index: 10; top: 68px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; max-width: min(540px, calc(100% - 140px)); padding: 9px 12px; border-radius: var(--el-border-radius-base); background: color-mix(in srgb, var(--el-color-warning) 10%, var(--studioGlassBackground)); color: var(--el-text-color-regular); box-shadow: var(--studioShadow); }
  // 导出进度卡：盖住整个编辑器（导出期间本来就锁着），中间一张卡：正在导出的画面、百分比、这一步、剩余时间、进度条、停止。
  .exportProgress { position: absolute; z-index: 30; inset: 0; display: grid; place-items: center; background: color-mix(in srgb, #000 40%, transparent); backdrop-filter: blur(6px);
    .exportProgressCard { display: flex; flex-direction: column; gap: 10px; width: min(320px, calc(100% - 32px)); padding: 16px; }
    .exportPreview { align-self: center; max-width: 100%; border-radius: 10px; background: #000; }
    .exportProgressInfo { display: flex; align-items: baseline; gap: 8px; min-width: 0;
      strong { font-size: 20px; font-weight: 600; font-variant-numeric: tabular-nums; }
      span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-text-color-regular); font-size: 12px; }
      small { flex-shrink: 0; color: var(--el-text-color-secondary); font-size: 11px; }
    }
    .el-button { align-self: center; :deep(> span) { gap: 4px; } }
  }
  .worldDock { position: absolute; z-index: 5; top: 50%; left: 16px; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; gap: 3px; width: 60px; max-height: calc(100% - 152px); overflow: auto; padding: 6px; border-radius: 16px; background: var(--studioGlassBackground); box-shadow: var(--studioShadow);
    > button { flex-shrink: 0; flex-direction: column; width: 48px; min-height: 51px; padding: 7px 4px; gap: 3px; border-radius: 11px; color: var(--el-text-color-regular); > span { font-size: 10px; line-height: 1.2; } &.active { color: var(--el-bg-color); background: var(--studioActionBackground); } }
  }
  .selectionToolbar { position: absolute; z-index: 5; transform: translate(-50%, -100%); transform-origin: center bottom; display: flex; align-items: center; gap: 3px; width: max-content; max-width: calc(100% - 24px); padding: 5px 7px; white-space: nowrap;
    &.panelEnterActive { transition-duration: 160ms; }
    &.panelLeaveActive { transition-duration: 110ms; }
    > strong { overflow: hidden; text-overflow: ellipsis; max-width: 160px; padding: 0 7px; font-size: 12px; font-weight: 600; }
    > .objectNameButton { display: inline-flex; align-items: center; gap: 4px; overflow: hidden; max-width: 190px; padding-inline: 7px; font-size: 12px; font-weight: 600; background: transparent;
      .objectNameText { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      kbd { flex-shrink: 0; }
    }
    > .objectNameInput { width: 132px; min-height: 30px; padding: 4px 7px; font-size: 12px; font-weight: 600; }
    > .toolbarColor { position: relative; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 7px; cursor: pointer;
      &:hover:not(.disabled) { background: var(--studioHoverBackground); }
      input { position: absolute; inset: 0; width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; opacity: 0; cursor: pointer; }
      > span { width: 16px; height: 16px; border-radius: 4px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-text-color-primary) 18%, transparent); }
    }
    > button { flex-shrink: 0; min-height: 30px; padding: 5px 7px; border-radius: 7px; }
    kbd { padding: 0 4px; border-radius: var(--ui-radius-small, 4px); background: var(--studioHoverBackground); color: var(--el-text-color-regular); font: inherit; font-size: 10px; }
    .toolbarDivider { flex-shrink: 0; height: 16px; width: 1px; margin-inline: 4px; background: var(--el-border-color-light); }
  }
  .objectHandles { position: absolute; z-index: 5; translate: 0 -50%; display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none;
    &.panelEnterActive { transition-duration: 160ms; }
    &.panelLeaveActive { transition-duration: 110ms; }
  }
  .objectHandle { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 30px; border-radius: 15px; background: var(--studioGlassBackground); outline: 1px solid var(--studioBorderColor); outline-offset: -1px; box-shadow: var(--studioShadow); color: var(--el-text-color-regular); cursor: grab; pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none;
    &:hover { color: var(--el-color-primary); }
    &.active { color: var(--studioActiveText); background: var(--studioActiveBackground); cursor: grabbing; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
  }
  .heightHandle { height: 58px; justify-content: space-between; padding-block: 11px; }
  .objectHandleRow { display: flex; gap: 6px; }
  .rotateHandle { height: 30px; cursor: ew-resize; }
  .tiltHandle { height: 30px; cursor: move; }
  .scaleHandle { height: 30px; cursor: nwse-resize; }
  .gravityHandle { height: 30px; cursor: pointer; }
  .handleBadge { position: absolute; top: calc(100% + 6px); left: 50%; transform: translateX(-50%); padding: 3px 7px; border-radius: 6px; background: var(--studioGlassBackground); outline: 1px solid var(--studioBorderColor); outline-offset: -1px; box-shadow: var(--studioShadow); color: var(--el-text-color-regular); font-size: 10px; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
  .selectionToolbar > button, .editPanel .editTools > button, .editPanel .objectDragModes > button {
    transition: background-color 140ms ease, color 140ms ease, opacity 140ms ease, translate 140ms cubic-bezier(0.16, 1, 0.3, 1), scale 140ms cubic-bezier(0.16, 1, 0.3, 1);
    &:active:not(:disabled) { translate: 0 0; scale: 0.975; transition-duration: 70ms; }
    &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
    &:disabled { translate: none; scale: none; }
  }
  .editPanel { position: absolute; z-index: 6; top: 72px; right: 16px; display: flex; flex-direction: column; width: 312px; max-height: max(160px, min(calc(100% - 144px), calc(100% - 100px - var(--chatHeight, 0px)))); overflow: hidden;
    &.viewPanel {
      width: min(352px, calc(100% - 112px));
      .panelHeading { min-height: 48px; padding-inline: 18px 12px; }
      .worldTabs { display: grid; flex-shrink: 0; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; margin: 12px 16px 4px; padding: 3px; border-radius: 10px; background: var(--studioControlBackground);
        > button { min-height: 34px; padding: 6px 8px; border-radius: 7px; color: var(--el-text-color-regular); font-size: 12px;
          &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); font-weight: 600; }
        }
      }
      .worldScroll { padding: 0 18px 8px; }
      .worldTabContent {
        animation: worldContentEnter 160ms ease-out;
        .editSection { padding-block: 16px; }
        .sectionHeading { gap: 8px; margin-bottom: 14px; > output { flex-shrink: 0; color: var(--el-text-color-primary); font-size: 13px; font-variant-numeric: tabular-nums; small { color: var(--el-text-color-regular); font-size: 11px; } } }
        h3 { color: var(--el-text-color-primary); font-size: 12px; font-weight: 600; }
        .worldHint { margin-top: 10px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.7; & + .worldHint { margin-top: 4px; } }
        .worldSizeField { display: flex; align-items: center; gap: 10px; > label { flex: 1; color: var(--el-text-color-regular); font-size: 12px; } > button { flex-shrink: 0; min-height: 34px; padding-inline: 14px; background: var(--studioActiveBackground); color: var(--studioActiveText); } }
        .worldSizeInput { position: relative; width: 112px; input { min-height: 34px; padding: 6px 26px 6px 10px; font-variant-numeric: tabular-nums; appearance: textfield; &::-webkit-inner-spin-button { appearance: none; } } > span { position: absolute; top: 50%; right: 10px; transform: translateY(-50%); color: var(--el-text-color-regular); font-size: 11px; pointer-events: none; } }
        .worldGridToggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 28px; color: var(--el-text-color-primary); font-size: 12px; }
        .spaceAtmosphere .lightingColor { display: grid; grid-template-columns: minmax(0, 1fr) auto 38px; align-items: center; gap: 8px; min-height: 34px; margin-top: 10px; color: var(--el-text-color-regular); font-size: 12px; output { color: var(--el-text-color-primary); font-size: 11px; font-variant-numeric: tabular-nums; } input { width: 38px; height: 28px; padding: 2px; cursor: pointer; } }
        .spaceDisplay { h3 { margin-bottom: 10px; } .worldGridToggle { min-height: 36px; } }
        .weatherOptions { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; > button { min-height: 54px; padding: 8px 2px; gap: 5px; font-size: 12px; > svg { width: 20px; height: 20px; } &.active { color: var(--studioActiveText); } } }
        .weatherGroup { margin-top: 18px; h4 { margin-bottom: 8px; color: var(--el-text-color-regular); font-size: 11px; font-weight: 500; } }
        .weatherLayers { gap: 6px; &:empty { display: none; } .layerIntensity { grid-template-columns: 54px minmax(0, 1fr) 38px; gap: 10px; min-height: 30px; font-size: 12px; } }
        .auroraSettings { margin-top: 14px; }
        .terrainRange { display: grid; grid-template-columns: 84px minmax(0, 1fr) 42px; align-items: center; gap: 12px; min-height: 34px; margin-top: 4px;
          > span { display: contents; font-size: 12px; output { grid-column: 3; min-width: 40px; text-align: right; font-size: 12px; } }
          > .el-slider { grid-column: 2; grid-row: 1; min-width: 0; height: 30px; --el-slider-height: 4px; --el-slider-button-size: 12px; }
          & + .terrainRange { margin-top: 4px; }
        }
        .windDirectionField { min-height: 34px; margin-top: 8px; font-size: 12px; select { width: 172px; min-height: 34px; font-size: 12px; } }
        .lightingSection { .moodPresets { display: flex; flex-wrap: wrap; gap: 5px; margin: -4px 0 14px; > button { min-height: 26px; padding: 3px 10px; border-radius: 13px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; &:hover:not(:disabled) { color: var(--el-color-primary); } } } .sectionHeading > button { min-height: 28px; padding-inline: 8px; font-size: 11px; } .lightingGroup { & + .lightingGroup { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--el-border-color-lighter); } h4 { margin-bottom: 8px; color: var(--el-text-color-regular); font-size: 11px; } } .lightingColor { min-height: 34px; margin-top: 8px; font-size: 12px; output { font-size: 11px; } input { width: 38px; height: 30px; } } .lightingHint { font-size: 11px; line-height: 1.7; } }
      }
    }
    .panelHeading .objectTitleInput { flex: 1; min-width: 0; padding: 4px 6px; border-color: transparent; background: transparent; font-size: 13px; font-weight: 600; &:hover:not(:disabled), &:focus { border-color: var(--el-border-color-light); background: var(--studioControlBackground); } }
    .editTools kbd, .objectDragModes kbd { margin-left: 2px; color: var(--el-text-color-regular); font: inherit; font-size: 10px; opacity: 0.75; }
    .panelHeading { flex-shrink: 0; min-height: 48px; padding: 9px 12px 9px 16px; border-bottom: 1px solid var(--el-border-color-lighter); h2 { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; > svg { flex-shrink: 0; color: var(--el-text-color-regular); } } > button { flex-shrink: 0; } }
    .brushPanelModes { display: grid; flex-shrink: 0; grid-template-columns: 1fr 1fr; gap: 4px; margin: 12px 16px 2px; padding: 3px; border-radius: 9px; background: var(--studioControlBackground); > button { gap: 6px; min-height: 32px; padding: 6px; border-radius: 6px; color: var(--el-text-color-regular); &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } } }
    .editScroll { flex: 1; min-height: 0; overflow: auto; padding: 0 16px 14px; }
    .editSection { padding-block: 14px; border-bottom: 1px solid var(--el-border-color-lighter); &:last-child { border-bottom: 0; } }
    h3 { margin-bottom: 10px; font-size: 12px; font-weight: 500; }
    .sectionHeading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; h3 { margin: 0; } }
    .settingField { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; color: var(--el-text-color-regular); &:last-child { margin-bottom: 0; } input, select { color: var(--el-text-color-primary); } }
    .editTools { display: flex; gap: 4px; margin-block: 4px 12px; &:last-child { margin-bottom: 0; } > button { flex: 1; padding: 7px 5px; background: var(--studioControlBackground); } }
    .objectDragModes { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; > button { min-height: 30px; padding: 5px; border-radius: 6px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; &.active { background: var(--studioActiveBackground); color: var(--el-color-primary); } } }
    .dragHint { margin-top: 7px; color: var(--el-text-color-regular); font-size: 10px; line-height: 1.6; }
    .vectorField { margin-bottom: 14px; > span { display: block; margin-bottom: 7px; color: var(--el-text-color-regular); } }
    .vectorInputs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; label { position: relative; > span { position: absolute; top: 7px; left: 7px; font-size: 10px; color: var(--el-text-color-regular); } input { padding: 6px 3px 6px 20px; font-variant-numeric: tabular-nums; appearance: textfield; &::-webkit-inner-spin-button { appearance: none; } } } }
    .colorField, .visibilityField { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; color: var(--el-text-color-regular); input { width: auto; } }
    .colorField input { width: 48px; height: 28px; padding: 2px; cursor: pointer; }
    .visibilityField { justify-content: flex-start; input { margin: 0; accent-color: var(--el-color-primary); } }
    .assetDetails { display: flex; flex-direction: column; gap: 5px; overflow-wrap: anywhere; color: var(--el-text-color-regular); a { color: var(--el-color-primary); text-underline-offset: 3px; } }
    .terrainBrushPanel { padding-top: 10px; padding-bottom: 0; }
    .terrainPalette { margin-bottom: 12px; .paletteHeading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; color: var(--el-text-color-regular); font-size: 11px; > button { padding: 3px 6px; border-radius: 4px; color: var(--el-text-color-regular); font-size: 11px; &:hover:not(:disabled) { background: var(--studioHoverBackground); } } } .paletteColors { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); gap: 6px; > button, .customTerrainColor { height: 24px; padding: 0; border: 1px solid var(--el-border-color); border-radius: 5px; &.active { outline: 2px solid var(--el-color-primary); outline-offset: 1px; } } .customTerrainColor { overflow: hidden; cursor: pointer; input { display: block; width: 100%; height: 100%; min-height: 0; padding: 0; border: 0; cursor: pointer; } } } .terrainHint { margin-top: 6px; } }
    .terrainSurfaceGroups { display: grid; grid-template-columns: 1fr 1fr 1.35fr 1fr; gap: 4px; margin-bottom: 7px; padding: 3px; border-radius: 7px; background: var(--studioControlBackground); > button { min-height: 28px; padding: 4px; border-radius: 5px; color: var(--el-text-color-regular); font-size: 11px; &.active { color: var(--studioActiveText); background: var(--studioActiveBackground); } } }
    .terrainBrushGroup { .selectedSurfaceName { float: right; color: var(--el-text-color-primary); } .surfaceBrushes > button { justify-content: flex-start; padding-inline: 7px; min-width: 0; .surfaceSwatch { flex-shrink: 0; width: 18px; height: 18px; border-radius: 4px; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-text-color-primary) 12%, transparent); } > span:last-child { overflow-wrap: anywhere; text-align: left; } } }
    .terrainBrushGroup { margin-bottom: 12px; h4 { margin: 0 0 6px; color: var(--el-text-color-regular); font-size: 11px; font-weight: 500; } .terrainBrushes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 5px; > button { min-height: 36px; padding: 6px 4px; gap: 5px; border-radius: 7px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; line-height: 1.25; > svg { flex-shrink: 0; } &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { background: var(--studioActiveBackground); color: var(--studioActiveText); } } &.shapeBrushes { grid-template-columns: repeat(4, minmax(0, 1fr)); > button { flex-direction: column; min-height: 58px; gap: 6px; } .brushProfile { width: 30px; height: 20px; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; } } &.landformBrushes { grid-template-columns: repeat(3, minmax(0, 1fr)); } &.waterBrushes { grid-template-columns: minmax(0, 1fr); } } }
    .brushSettings { padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); .terrainRange { display: grid; grid-template-columns: 106px 1fr; align-items: center; gap: 12px; min-height: 28px; margin-top: 2px; > span { gap: 5px; } &:first-child { margin-top: 0; } } }
    .terrainRange { display: block; margin-top: 8px; &:first-child { margin-top: 0; } > span { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: var(--el-text-color-regular); font-size: 11px; output { color: var(--el-text-color-primary); font-size: 12px; font-variant-numeric: tabular-nums; small { font-size: 10px; color: var(--el-text-color-regular); } } } .el-slider { height: 26px; padding-inline: 4px; --el-slider-height: 3px; --el-slider-button-size: 10px; } }
    .terrainTargetField { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; margin-top: 4px; color: var(--el-text-color-regular); font-size: 11px; .numberWithUnit { position: relative; width: 112px; input { min-height: 30px; padding: 4px 24px 4px 9px; font-size: 12px; font-variant-numeric: tabular-nums; appearance: textfield; &::-webkit-inner-spin-button { appearance: none; } } > span { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font-size: 10px; } } }
    .terrainHint { margin-top: 10px; color: var(--el-text-color-regular); font-size: 10px; line-height: 1.6; }
    .weatherOptions { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; > button { flex-direction: column; min-height: 65px; gap: 8px; padding: 10px 3px; border-radius: 8px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &.active { color: var(--el-color-primary); background: var(--studioActiveBackground); } } }
    .weatherSection { padding-block: 14px; h3 { margin-bottom: 12px; color: var(--el-text-color-regular); font-size: 11px; } .sectionHeading { margin-bottom: 12px; h3 { margin-bottom: 0; } } .weatherMixHint { color: var(--el-text-color-regular); font-size: 10px; } .weatherLayers { display: grid; gap: 3px; margin-top: 12px; .layerIntensity { display: grid; grid-template-columns: 36px minmax(0, 1fr) 34px; align-items: center; gap: 10px; min-height: 26px; color: var(--el-text-color-regular); font-size: 11px; .el-slider { height: 26px; padding-inline: 4px; --el-slider-height: 3px; --el-slider-button-size: 10px; } output { text-align: right; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; small { font-size: 9px; color: var(--el-text-color-regular); } } } } .terrainRange + .terrainRange { margin-top: 12px; } .fieldWithIcon { display: inline-flex; align-items: center; gap: 5px; } }
    .weatherTuning { .terrainRange { display: grid; grid-template-columns: 106px 1fr; align-items: center; gap: 12px; min-height: 28px; & + .terrainRange { margin-top: 6px; } } .windDirectionField { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; color: var(--el-text-color-regular); font-size: 11px; select { width: 150px; min-height: 30px; padding-block: 4px; color: var(--el-text-color-primary); font-size: 11px; } } }
    .lightingSection {
      .sectionHeading > button { padding: 3px 6px; font-size: 10px; }
      .lightingGroup { & + .lightingGroup { margin-top: 16px; } h4 { margin: 0 0 7px; color: var(--el-text-color-regular); font-size: 11px; font-weight: 500; } }
      .lightingColor { display: grid; grid-template-columns: minmax(0, 1fr) auto 38px; align-items: center; gap: 8px; margin-top: 9px; color: var(--el-text-color-regular); font-size: 11px; output { color: var(--el-text-color-primary); font-size: 10px; font-variant-numeric: tabular-nums; } input { width: 38px; height: 27px; padding: 2px; cursor: pointer; } }
      .lightingHint { margin-top: 7px; color: var(--el-text-color-regular); font-size: 10px; line-height: 1.6; }
    }
    .heightHint { margin-bottom: 14px; color: var(--el-text-color-regular); font-size: 11px; line-height: 1.6; }
    .preciseSection {
      summary { display: flex; align-items: center; justify-content: space-between; color: var(--el-text-color-regular); font-size: 12px; cursor: pointer; list-style: none;
        &::-webkit-details-marker { display: none; }
        &::after { content: "展开"; color: var(--el-text-color-secondary); font-size: 10px; }
      }
      &[open] summary { margin-bottom: 12px; color: var(--el-text-color-primary); &::after { content: "收起"; } }
      .vectorField:last-child { margin-bottom: 0; }
    }
    .wideAction { width: 100%; margin-top: 10px; justify-content: flex-start; }
    .sceneObjects { display: flex; flex-direction: column; gap: 3px; .sceneObjectRow { display: flex; align-items: center; gap: 4px; border-radius: var(--ui-radius-small, 4px); &.selected { background: var(--studioActiveBackground); } > button:first-child { flex: 1; min-width: 0; justify-content: flex-start; > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: left; } > svg { flex-shrink: 0; } } } }
  }
  .assetPanel { position: absolute; z-index: 6; left: 88px; top: 72px; bottom: 196px; width: min(520px, calc(100% - 112px), max(320px, calc(100% - 120px - var(--chatWidth)))); max-height: 760px; overflow: hidden; padding-top: 2px; .closeAssets { position: absolute; z-index: 1; top: 13px; right: 10px; padding: 3px; } > :deep(.assetShelf) { height: 100%; .shelfHeader { padding-right: 39px; } } }

  .timelinePanel { position: absolute; z-index: 9; bottom: 16px; left: 16px; right: 16px; transition: right 240ms cubic-bezier(0.16, 1, 0.3, 1); }
  // 时间轴打开时左侧工具栏挪到时间轴上方，不被盖住。
  &.splitLayout .worldDock { top: auto; bottom: calc(var(--performanceBottom) + 12px); transform: none; max-height: calc(100% - var(--performanceBottom) - 64px); > button { min-height: 36px; padding-block: 6px; > span { display: none; } } }
  .editPanel.performancePanel { max-height: calc(100% - 96px - var(--performanceBottom)); }
  .performancePointCard { position: absolute; z-index: 9; }
  .drawRouteHud { position: absolute; z-index: 11; top: 16px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; max-width: calc(100% - 180px); padding: 5px 7px; border-radius: 12px;
    .drawRouteState { display: inline-flex; align-items: center; gap: 6px; padding-inline: 5px 7px; color: var(--el-text-color-regular); font-size: 12px; white-space: nowrap; }
    > button { min-height: 30px; padding: 5px 8px; border-radius: 7px; color: var(--el-text-color-regular); font-size: 12px; background: var(--studioControlBackground); }
    > button:last-child { background: transparent; }
    kbd { color: var(--el-text-color-regular); font-size: 10px; }
  }
  .worldCanvas.trackPicking > canvas { cursor: cell !important; }
  .recHint { display: flex; align-items: center; gap: 8px; color: var(--el-text-color-primary) !important; outline: 1.5px solid var(--el-color-danger) !important;
    .recDot { width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-danger); animation: filmRecording 1s ease-in-out infinite; }
  }
  .carryHint { display: flex; align-items: center; gap: 4px; color: var(--el-text-color-primary) !important; pointer-events: none; kbd { padding: 0 5px; border-radius: 4px; background: var(--studioControlBackground, rgb(0 0 0 / 6%)); font: inherit; font-size: 11px; } }
  .trackPickHint { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-primary) !important; outline-color: var(--el-color-primary) !important; }
  .drawRouteHint { position: absolute; z-index: 11; top: 16px; left: 50%; transform: translateX(-50%); padding: 7px 12px; border-radius: 10px; color: var(--el-text-color-regular); font-size: 11px; white-space: nowrap; pointer-events: none; }
  .replaceBanner { display: flex; align-items: center; gap: 6px; margin: 0 0 8px; padding: 6px 8px; border-radius: 8px; background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); font-size: 12px; > span { flex: 1; } > button { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 4px; background: none; color: inherit; cursor: pointer; } }
  // 全屏预演竖屏时同样画出平台安全区（上约9%、下约22%、左右约6%）。
  .filmSafeFrame { position: absolute; inset: 0; z-index: 8; display: grid; place-items: center; pointer-events: none;
    > i { position: relative; height: 100%; max-width: 100%; aspect-ratio: 9 / 16;
      &::after { content: ""; position: absolute; top: 9%; bottom: 22%; left: 6%; right: 6%; border: 1px dashed rgb(255 255 255 / 50%); border-radius: 4px; } } }
  .filmCaption.portrait { bottom: 23%; font-size: 18px; }
  .filmCaption { position: absolute; z-index: 9; left: 10%; right: 10%; bottom: calc(28px + var(--performanceBottom, 0px)); margin: 0; text-align: center; color: #fff; font-size: 22px; line-height: 1.4; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9), 0 0 8px rgba(0, 0, 0, 0.6); pointer-events: none; }
  .quickCreation { position: absolute; z-index: 8; bottom: calc(16px + var(--performanceBottom)); left: calc(100% - 16px - var(--chatWidth)); display: flex; flex-direction: column; gap: 8px; width: var(--chatWidth); padding: 12px; border-radius: 16px; background: var(--studioGlassBackground); box-shadow: var(--studioShadow); transition: left 240ms cubic-bezier(0.16, 1, 0.3, 1), width 240ms cubic-bezier(0.16, 1, 0.3, 1), bottom 240ms cubic-bezier(0.16, 1, 0.3, 1), transform 240ms cubic-bezier(0.16, 1, 0.3, 1); &:focus-within { outline: 1px solid var(--el-color-primary); outline-offset: 2px; }
    .assistantConversation { display: flex; flex-direction: column; min-height: 0; overflow: hidden; padding-bottom: 8px; border-bottom: 1px solid var(--studioBorderColor);
      .panelHeading { padding: 0 3px 6px; }
      .compactionStatus { display: flex; flex-shrink: 0; align-items: center; gap: 6px; margin: 0 4px; padding-top: 4px; color: var(--el-text-color-secondary); font-size: 12px; > button { width: 20px; height: 20px; padding: 3px; border-radius: 5px; } }
    }
    .promptToolbar { display: flex; align-items: center; gap: 6px; min-height: 34px; }
    .promptSettings { display: flex; flex: 1; align-items: center; gap: 4px; min-width: 0; }
    .promptActions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; > button { width: 30px; height: 30px; padding: 6px; border-radius: 50%; } .stopPrompt { width: 28px; height: 28px; padding: 7px; color: var(--el-text-color-regular); } .sendPrompt { width: 34px; height: 34px; background: var(--studioActionBackground); color: var(--el-bg-color); } }
    &.draggingFiles { outline: 1px solid var(--el-color-primary); outline-offset: 2px; }
    .fileDropHint { position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border-radius: inherit; background: var(--studioGlassBackground); color: var(--el-text-color-primary); font-size: 13px; font-weight: 500; pointer-events: none; > svg, small { color: var(--el-text-color-secondary); } small { font-size: 11px; font-weight: 400; } }
    .promptQueue { flex-shrink: 0; max-height: 132px; overflow-y: auto; border: 1px solid var(--studioBorderColor); border-radius: 10px; background: var(--studioControlBackground);
      .queueMessage { display: flex; align-items: center; gap: 6px; padding: 3px 6px 3px 9px; color: var(--el-text-color-regular); font-size: 12px; & + .queueMessage { border-top: 1px solid var(--studioBorderColor); } }
      .queueIcon { flex-shrink: 0; color: var(--el-text-color-secondary); }
      .queueContent { flex: 1; min-width: 0; margin: 0; overflow: hidden; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
      .queueActions { display: flex; flex-shrink: 0; align-items: center; gap: 2px; .el-button { height: 22px; margin: 0; color: var(--el-text-color-secondary); } .queueSteer { padding: 0 5px; > span { gap: 3px; } } .queueIconButton { width: 22px; padding: 0; } .queueSteering { padding: 0 5px; color: var(--el-color-primary); font-size: 11px; } }
    }
    .editingBanner { display: flex; align-items: center; justify-content: space-between; padding: 0 3px 0 5px; color: var(--el-text-color-secondary); font-size: 11px; .el-button { height: 22px; } }
    .promptFiles { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 3px; .promptFile { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; min-height: 22px; padding: 1px 2px 1px 7px; border-radius: 7px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; > span { min-width: 0; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } > svg { flex-shrink: 0; } > button { flex-shrink: 0; width: 18px; height: 18px; padding: 3px; border-radius: 5px; } } }
    .modelHint, .voiceStatus, .imageStatus { margin: 0; padding-inline: 5px; font-size: 11px; line-height: 16px; color: var(--el-text-color-regular); }
    .voiceStatus { color: var(--el-color-primary); }
    .imagePicker { display: none; }
    .promptImages { display: flex; gap: 8px; flex-wrap: wrap; padding: 2px 3px; .promptImage { position: relative; width: 72px; height: 64px; border-radius: var(--el-border-radius-base); background: var(--studioControlBackground); > img { display: block; width: 100%; height: 100%; border-radius: inherit; object-fit: contain; } > span, > button { background: var(--studioGlassBackground); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); } > span { position: absolute; left: 3px; bottom: 3px; min-width: 16px; padding: 0 4px; border-radius: 4px; color: var(--el-text-color-primary); font-size: 10px; text-align: center; font-variant-numeric: tabular-nums; } > button { position: absolute; top: -4px; right: -4px; width: 20px; height: 20px; padding: 3px; border: 1px solid var(--studioBorderColor); border-radius: 50%; &:hover:not(:disabled) { background: var(--studioHoverBackground); } } } }
    .setTemplates { display: flex; flex-wrap: wrap; gap: 5px; max-height: min(28vh, 116px); overflow-y: auto; padding: 0 2px; > button.scriptPaste { color: var(--el-color-primary); font-weight: 600; > svg { color: var(--el-color-primary); } }
      > button.scriptPrevis { background: var(--el-color-primary); color: #fff; font-weight: 600; > svg { color: #fff; } &:hover:not(:disabled) { color: #fff; filter: brightness(1.08); } }
      > .setGenres { display: inline-flex; gap: 2px; padding: 2px; border-radius: 12px; background: var(--studioControlBackground); > button { display: inline-flex; align-items: center; gap: 3px; min-height: 20px; padding: 1px 7px; border-radius: 10px; color: var(--el-text-color-secondary); font-size: 11px; &.active { background: var(--el-color-primary); color: #fff; } &:hover:not(.active) { color: var(--el-color-primary); } } } > button { display: inline-flex; align-items: center; gap: 4px; min-height: 24px; padding: 3px 8px; border-radius: 12px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; > svg { flex-shrink: 0; color: var(--el-color-primary); } &:hover:not(:disabled) { color: var(--el-color-primary); } } }
    .promptAnchorRow { display: flex; align-items: center; min-width: 0; padding: 1px 3px 0; }
    .promptAnchorChip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; min-height: 22px; padding: 2px 3px 2px 7px; border-radius: 7px; background: var(--studioControlBackground); color: var(--el-text-color-regular); font-size: 11px; > svg { flex-shrink: 0; } > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } small { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; font-variant-numeric: tabular-nums; } > button { flex-shrink: 0; width: 20px; height: 20px; padding: 3px; border-radius: 5px; } }
    .quickCreationInput { position: relative; display: flex; align-items: flex-start; gap: 7px; min-height: 38px; textarea { flex: 1; min-width: 0; height: 34px; max-height: 240px; padding: 7px 2px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; line-height: 20px; resize: none; overflow-y: hidden; outline: none; &::placeholder { color: var(--el-text-color-placeholder); } } > button { flex-shrink: 0; width: 28px; height: 28px; margin-top: 3px; padding: 5px; border-radius: 7px; color: var(--el-color-primary); &:disabled { opacity: 1; } } }
  }

  .stageProblem, .dropDirection { position: absolute; z-index: 10; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: calc(100% - 150px); padding: 15px 20px; text-align: center; }
  .dropDirection { top: auto; bottom: 90px; transform: translateX(-50%); pointer-events: none; padding: 9px 14px; border-radius: var(--el-border-radius-base); background: var(--studioGlassBackground); box-shadow: var(--studioShadow); font-size: 11px; }

  .worldDock > button.hinting { animation: dockHint 1.6s ease-in-out infinite; }
  @keyframes dockHint { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-primary) 0%, transparent); color: inherit; } 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 28%, transparent); color: var(--el-color-primary); } }
  @media (prefers-reduced-motion: reduce) { .worldDock > button.hinting { animation: none; color: var(--el-color-primary); } }
  .worldDock > button.active:hover:not(:disabled), .quickCreation .sendPrompt:hover:not(:disabled) { color: var(--el-bg-color); background: var(--studioActionBackground); }
  .floatingPanel, .worldHeader .worldActions, .worldDock, .quickCreation, .studioNotice, .dropDirection, .stageProblem {
    outline: 1px solid var(--studioBorderColor);
    outline-offset: -1px;
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    box-shadow: var(--studioShadow);
  }
  .stageProblem { border-radius: var(--el-border-radius-base); background: var(--studioGlassBackground); }
  .editPanel .editTools > button.active { background: var(--studioActiveBackground); }
}
@keyframes studioSpin { to { transform: rotate(360deg); } }
@keyframes filmRecording { 50% { opacity: 0.35; } }
// ACT: Agent 对话框始终贴在右下角（约占右侧 3 成宽），开不开演绎都在同一个位置；右侧编辑面板叠在它上方，开着编辑面板时对话记录让出一半高度。
.sceneStudio { --chatWidth: max(320px, calc(30% - 16px)); }
.sceneStudio.inspectorBeside { --agentConversationMax: min(420px, max(120px, calc(50dvh - 220px))); }
// ACT: 演绎时间轴打开时与对话框左右并排（7:3），时间轴收到对话框左侧、底边对齐；窄屏时间轴占满宽，对话框叠在它上方。
@media (min-width: 901px) { .sceneStudio.splitLayout {
  .timelinePanel { right: calc(var(--chatWidth) + 24px); }
  .quickCreation { --performanceBottom: 0px; }
} }
@keyframes worldContentEnter { from { opacity: 0; translate: 0 4px; } to { opacity: 1; translate: 0 0; } }
@media (max-width: 1100px) { .sceneStudio .worldHeader .worldActions .saveStatus { display: none; } }
@media (max-width: 700px) { .sceneStudio {
  .worldHeader { inset: 12px 10px auto; gap: 8px; .worldInfo { font-size: 12px; } .worldActions { gap: 0; padding-inline: 4px; > button { width: 29px; padding: 5px; }   } }

  .worldDock { left: 8px; width: 48px; padding-inline: 3px; > button { width: 42px; min-height: 46px; padding-block: 6px; } }
  .selectionToolbar > strong { max-width: 100px; }
  .editPanel { top: 76px; right: 10px; width: min(312px, calc(100% - 76px)); max-height: max(160px, min(calc(100% - 154px), calc(100% - 106px - var(--chatHeight, 0px)))); &.viewPanel { width: min(352px, calc(100% - 76px)); } }
  .assetPanel { left: 64px; top: 72px; bottom: 90px; width: min(480px, calc(100% - 76px)); }

  .quickCreation { bottom: calc(18px + var(--performanceBottom)); left: calc(50% + 22px); transform: translateX(-50%); width: 390px; max-width: calc(100% - 86px); padding: 10px; .promptToolbar { gap: 4px; } }
} }
@media (max-width: 390px) { .sceneStudio .worldHeader .worldActions .redoAction { display: none; } }
@media (hover: hover) and (pointer: fine) { .sceneStudio {
  .selectionToolbar > button, .editPanel .editTools > button, .editPanel .objectDragModes > button {
    &:hover:not(:disabled):not(:active) { translate: 0 -1px; }
  }
} }
@media (prefers-reduced-motion: reduce) { .sceneStudio {
  .spinning { animation: none; }
  .timelinePanel, .quickCreation { transition: none; }
  .filmPreviewBar .cameraDot { animation: none; }
  .worldTabContent { animation: none; }
  .panelEnterActive, .panelLeaveActive { transition: opacity 90ms ease; }
  .panelEnterFrom, .panelLeaveTo { translate: none; scale: none; }

  .selectionToolbar { &.panelEnterActive, &.panelLeaveActive { transition: opacity 90ms ease; } }
  .selectionToolbar > button, .editPanel .editTools > button, .editPanel .objectDragModes > button {
    &, &:hover:not(:disabled):not(:active), &:active:not(:disabled) { translate: none; scale: none; transition: background-color 90ms ease, color 90ms ease, opacity 90ms ease; }
  }
} }
</style>

<style lang="scss">
/* 粘贴剧本弹层（Element Plus 弹层挂在 body 上，不能用 scoped 样式）。 */
.pasteScriptPopover.el-popover.el-popper { padding: 10px; }
.pasteScriptPopover .pasteScript { display: grid; gap: 8px;
  textarea { box-sizing: border-box; width: 100%; min-height: 120px; padding: 8px; border: 1px solid var(--el-border-color); border-radius: 6px; background: var(--el-fill-color-blank); color: var(--el-text-color-primary); font: inherit; font-size: 12px; line-height: 1.5; resize: vertical; outline: none; &:focus { border-color: var(--el-color-primary); } }
  button { justify-self: end; height: 28px; padding: 0 14px; border: 0; border-radius: 6px; background: var(--el-color-primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; &:disabled { opacity: 0.5; cursor: default; } }
}
</style>

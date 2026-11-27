<template>
  <section ref="root" class="performanceTimeline" :class="{ collapsed, resizing: !!resizeDrag, razor: tool === 'razor', groupMoving: !!groupDrag, multiPick: picked.size > 1 }" :style="collapsed ? undefined : { height: `${panelHeight}px`, '--groupShift': `${groupShift}px` }" tabindex="-1" aria-label="演绎时间轴" @pointermove="move" @pointerup="finish" @pointercancel="cancel" @lostpointercapture="cancel" @wheel.stop="wheel">
    <div v-if="!collapsed" class="resizeGrip" role="separator" aria-orientation="horizontal" aria-label="拖动调整时间轴高度" title="拖动调整高度" @pointerdown.stop="beginResize" @pointermove.stop="moveResize" @pointerup.stop="endResize" @pointercancel.stop="endResize" @lostpointercapture.stop="endResize" @dblclick="emit('update:height', defaultHeight)" />
    <header class="timelineHeader">
      <timelineTransport :disabled="disabled || interacting" :running="running" :completed="completed" :totalLabel="totalLabel" @rewind="seekTo(playbackRange.start)" @togglePlayback="emit('togglePlayback')">
        <span ref="elapsedWhole" /><span ref="elapsedFraction" class="fraction" />
      </timelineTransport>
      <template v-if="!collapsed">
        <i class="headerDivider" aria-hidden="true" />
        <div class="editTools" role="group" aria-label="编辑">
          <button type="button" :disabled="disabled || interacting || cameraCount >= maxCameras" aria-label="添加机位" title="添加机位" @click="emit('addCamera')"><icon-camera-plus :size="16" /><span class="toolLabel">机位</span></button>
          <button v-if="overrunCount" type="button" class="lineFix" :disabled="disabled || interacting" :title="`有${overrunCount}个镜头太短、台词说不完：把它们拉长到台词需要的时长，后面的镜头整体往后推`" @click="emit('fixLineTiming')">⚠ 台词太长 {{ overrunCount }} 处 · 拉长</button>
          <button type="button" :disabled="disabled || interacting || cameraCount + 3 > maxCameras" aria-label="一键分镜" title="一键分镜：给主体（选中的人；没选时挑走动线最长的人，没人走动就挑画面中心最近的人）排全景、中景跟拍、近景三台机位，镜头按全景→中景→近景交替切好；选中两个人时排对话戏正反打（双人全景+两个过肩，不越轴），选中3到6人排群戏（全景+每人近景轮切）。再点一次重新生成，每段都可再拖、再切" @click="emit('autoCoverage', undefined, coveragePace)"><icon-movie :size="16" /><span class="primaryLabel">分镜</span></button>
          <el-popover trigger="click" placement="top-start" :width="300" popperClass="dialogueCoveragePopover" :disabled="disabled || interacting">
            <template #reference><button type="button" class="coverageMore" :disabled="disabled || interacting || cameraCount + 3 > maxCameras" aria-label="按对白分镜" title="按对白分镜：粘贴“角色：台词”（两人正反打，3到6人群戏），按每句台词切到说话的人并配字幕；场景里没有的角色自动新建站位"><icon-chevron-down :size="12" /></button></template>
            <div class="dialogueCoverage" @keydown.stop>
              <div class="coveragePace" role="radiogroup" aria-label="剪辑节奏"><span>节奏</span><button v-for="item in paceOptions" :key="item.value" type="button" role="radio" :aria-checked="coveragePace === item.value" :class="{ active: coveragePace === item.value }" :title="item.title" @click="coveragePace = item.value">{{ translate(item.name) }}</button></div>
              <textarea v-model="dialogueScript" rows="6" maxlength="6000" placeholder="每行一句“角色：台词”；场景里没有这些角色会自动新建并站好位（也可先选中说话的人）：&#10;林冲：这风雪，怕是要下一夜了。&#10;陆谦：兄长且饮一杯。&#10;（两人对视）" aria-label="对白" />
              <small v-if="scriptSpeakers.length" class="scriptSpeakers">识别到 {{ scriptSpeakers.length }} 个角色：{{ scriptSpeakers.join("、") }}{{ scriptSpeakers.length === 1 ? "（至少要两个人说话）" : "" }}</small>
              <template v-if="upstreamScenes.length > 1"><button v-for="(scene, index) in upstreamScenes" :key="index" type="button" class="paceApply" :title="'把上游剧本的这一场填进对白框：' + sceneTitle(scene)" @click="dialogueScript = scene">带入第{{ index + 1 }}场</button></template>
              <button v-else-if="upstreamScript" type="button" class="paceApply" title="把画布上连进来的上游剧本填进对白框，可再删改" @click="dialogueScript = upstreamScript">带入上游剧本</button>
              <button type="button" class="dialogueApply" :disabled="!dialogueScript.trim()" @click="emit('autoCoverage', dialogueScript, coveragePace)">按对白剪辑</button>
              <button type="button" class="paceApply" @click="emit('autoCoverage', undefined, coveragePace)">只按节奏重新分镜</button>
            </div>
          </el-popover>
          <button type="button" :disabled="disabled || interacting || (selectedCameraId ? !keyShotAtPlayhead : !selectedRouteRow)" :aria-label="selectedCameraId ? '在播放头处加镜头关键点' : '在播放头处添加锚点'" :title="selectedCameraId ? (keyShotAtPlayhead ? '在播放头处加镜头关键点：这一刻的焦段、转向、俯仰、翻滚' : '把播放头放进这台机位的一段镜头里再加关键点') : '在播放头处添加锚点'" @click="addPointAtPlayhead"><icon-map-pin-plus :size="16" /><span class="toolLabel">加点</span></button>
          <button type="button" :disabled="disabled || interacting || folderCount >= maxFolders" aria-label="新建分组" :title="selectedRowKey && !folderOf.has(selectedRowKey) ? '把所选轨道放进新分组' : '新建分组（把轨道名拖进分组即可归组）'" @click="createFolder"><icon-folder-plus :size="16" /><span class="toolLabel">分组</span></button>
          <button type="button" class="toolToggle" :class="{ active: tool === 'razor' }" :aria-pressed="tool === 'razor'" :disabled="disabled || interacting" aria-label="切割" title="切割：点镜头段或片段，就在那里切成两段（Ctrl+B 在播放头处切开所选）" @click="toggleRazor"><icon-scissors :size="16" /><span class="toolLabel">切割</span></button>
          <button type="button" class="deleteAction" :disabled="disabled || interacting || !deleteTarget" :aria-label="deleteTarget?.label ?? '删除所选'" :title="`${deleteTarget?.label ?? '删除所选'}（Delete）`" @click="deleteSelection"><icon-trash :size="16" /></button>
        </div>
      </template>
      <span v-if="error" class="timelineError" role="alert" :title="error">{{ error }}</span>
      <div v-if="!collapsed" class="zoomGroup" role="group" aria-label="时间轴缩放">
        <button type="button" class="snapToggle" :class="{ active: snapping }" :aria-pressed="snapping" :title="snapping ? '吸附已开：拖动时贴到播放头、镜头段和片段边缘（按住 Alt 临时关闭）' : '吸附已关：可自由放到任意时刻'" @click="emit('update:snapping', !snapping)"><icon-magnet :size="16" /></button>
        <button type="button" aria-label="适应全片" title="缩放到正好放下整部成片" :disabled="interacting" @click="fitZoom"><icon-arrows-horizontal :size="16" /></button>
        <button type="button" aria-label="缩小时间轴" :title="`缩小时间轴（${translate(zoomHint)}）`" :disabled="interacting || scale <= minZoom" @click="zoomBy(0.5)"><icon-zoom-out :size="16" /></button>
        <button type="button" aria-label="放大时间轴" :title="`放大时间轴（${translate(zoomHint)}）`" :disabled="interacting || scale >= maxScale" @click="zoomBy(2)"><icon-zoom-in :size="16" /></button>
      </div>
      <button type="button" class="collapseAction" :aria-label="collapsed ? '展开时间轴' : '收起时间轴'" :title="collapsed ? '展开时间轴' : '收起时间轴'" :aria-expanded="!collapsed" @click="cancel(); emit('update:collapsed', !collapsed)"><icon-chevron-down :size="16" /></button>
    </header>
    <div v-show="!collapsed" ref="scroll" class="timelineScroll" @scroll="measure" @pointerdown="beginEmpty" @pointermove="hoverRazor" @pointerleave="razorX = null">
      <div class="timelineContent" :style="{ width: `${width + 150}px` }">
        <div class="timelineRuler" role="slider" tabindex="0" aria-label="播放位置" title="点击或拖动定位，空格播放 / 暂停" :aria-valuemin="0" :aria-valuemax="roundTenth(filmLength)" :aria-valuenow="roundTenth(filmNow)" :aria-valuetext="filmStamp(filmNow)" :aria-disabled="disabled" @pointerdown="beginSeek" @keydown="seekKey">
          <span class="rulerLabel" aria-hidden="true" />
          <i class="filmBand" aria-hidden="true" :style="{ left: `${150 + filmX(0)}px`, width: `${filmLength * scale}px` }" />
          <i v-if="minorStep" class="rulerMinor" aria-hidden="true" :style="{ left: `${150 + filmX(0)}px`, width: `${Math.max(0, width - filmX(0))}px`, '--minor': `${minorStep}px` }" />
          <time v-for="tick in ticks" :key="tick" :style="{ left: `${150 + filmX(tick)}px` }">{{ tickLabel(tick) }}</time>
        </div>
        <div class="timelineRows" :style="{ height: `${rows.length * 34}px` }">
          <div v-for="(row, index) in visibleRows" :key="row.key" class="timelineRow" :class="{ selected: selectedRowKey === row.key, stopped: row.kind !== 'folder' && row.kind !== 'program' && row.enabled === false, cameraRow: row.kind === 'camera', folderRow: row.kind === 'folder', programRow: row.kind === 'program', inFolder: folderOf.has(row.key), dropTarget: dropKey === row.key, lastCamera: row.kind === 'camera' && rows[firstRow + index + 1]?.kind === 'track' }" :style="{ top: `${(firstRow + index) * 34}px`, '--trackColor': row.color }" @keydown="removeRow($event, row)">
            <div class="rowHeader" @dragover="dragOverRow($event, row)" @dragleave="dropKey === row.key && (dropKey = '')" @drop="dropOnRow($event, row)">
              <template v-if="row.kind === 'folder'">
                <button type="button" class="folderToggle" :aria-expanded="!row.collapsed" :aria-label="row.collapsed ? '展开分组' : '收起分组'" @click="toggleFolder(row.id)"><icon-chevron-right :size="14" /></button>
                <input v-if="renamingFolder === row.id" ref="folderInput" class="folderName" :value="row.name" maxlength="40" aria-label="分组名称" @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" @keydown.esc.prevent="renamingFolder = ''" @blur="renameFolder(row.id, ($event.target as HTMLInputElement).value)" />
                <button v-else type="button" class="rowName" :title="`${row.name} · 双击改名`" @click="toggleFolder(row.id)" @dblclick.prevent="startRename(row.id)"><icon-folder :size="14" />{{ row.name }}<small>{{ row.count }}</small></button>
                <button type="button" class="removeTrack" :disabled="disabled || interacting" aria-label="解散分组" title="解散分组（轨道保留）" @click="removeFolder(row.id)"><icon-folder-off :size="15" /></button>
              </template>
              <span v-else-if="row.kind === 'program'" class="rowName programName" title="成片：每一刻实际播出的机位，由各机位的镜头段决定"><icon-broadcast :size="14" />成片</span>
              <template v-else>
                <input v-if="row.kind === 'camera' && renamingCamera === row.id" ref="cameraInput" class="folderName" :value="row.name" maxlength="40" aria-label="机位名称" @keydown.enter.prevent="($event.target as HTMLInputElement).blur()" @keydown.esc.prevent="renamingCamera = ''" @blur="finishCameraRename(row.id, ($event.target as HTMLInputElement).value)" />
                <button v-else type="button" class="rowName" :disabled="disabled" :title="row.kind === 'camera' ? `${row.name} · 双击改名 · 拖到分组上可归组` : `${row.name} · 拖到分组上可归组`" draggable="true" @dragstart="dragRow($event, row)" @dragend="dropKey = ''" @click="selectRow(row)" @dblclick.prevent="row.kind === 'camera' && startCameraRename(row.id)" @keydown="row.kind === 'track' && nudge($event, row)"><icon-camera v-if="row.kind === 'camera'" :size="14" /><i v-else />{{ row.name }}</button>
                <button v-if="row.kind === 'camera'" type="button" class="muteToggle" :class="{ muted: row.enabled === false }" :disabled="disabled || interacting" :aria-pressed="row.enabled === false" :aria-label="row.enabled === false ? `让${row.name}重新上成片` : `${row.name}不上成片`" :title="row.enabled === false ? '已停用：不上成片，点击恢复' : '点击停用：暂时不上成片（保留镜头段）'" @click="emit('toggleCamera', row.id)"><component :is="row.enabled === false ? IconEyeOff : IconEye" :size="14" /></button>
                <button v-if="selectedRowKey === row.key" type="button" class="removeTrack" :disabled="disabled || interacting" :aria-label="row.kind === 'camera' ? `删除${row.name}` : `删除${row.name}的动线`" :title="row.kind === 'camera' ? '删除机位（Delete）' : '删除动线（Delete），保留物体'" @click="remove(row)"><icon-trash :size="15" /></button>
              </template>
            </div>
            <div v-if="row.kind === 'folder'" class="rowLane folderLane"><i v-if="row.end !== undefined && row.start !== undefined" class="folderSpan" :style="{ left: `${(row.start - origin) * scale}px`, width: `${Math.max(6, (row.end - row.start) * scale)}px` }" /></div>
            <div v-else-if="row.kind === 'program'" class="rowLane programLane">
              <button v-for="segment in row.cuts" :key="segment.start + segment.cameraId" type="button" class="cutBlock" :class="{ active: selectedCameraId === segment.cameraId }" :style="{ left: `${filmX(segment.start)}px`, width: `${Math.max(3, (segment.end - segment.start) * scale)}px`, '--cutColor': segment.color }" :disabled="disabled" :title="`${filmStamp(segment.start)} – ${filmStamp(segment.end)} · 第${segment.number}镜 · ${segment.name}${segment.crossesAxis ? ' · ⚠ 越轴：和上一镜的机位在对话双方连线的两侧，观众会觉得两人左右对调' : ''}${segment.overrun ? ' · ⚠ 台词约需' + segment.overrun.toFixed(1) + '秒，这镜太短可能说不完' : ''}${segment.note ? ' · 「' + segment.note + '」' : ''}${segment.choices.length > 1 ? ' · 这里有' + segment.choices.length + '个机位重叠，点击选择播哪个' : ''}`" @click="clickCut(segment)"><span><b class="cutNumber" :class="{ axisWarning: segment.crossesAxis || !!segment.overrun }">{{ segment.crossesAxis || segment.overrun ? '⚠' : '' }}{{ segment.number }}</b>{{ segment.note || segment.name.replace(/^分镜·/, '') }}</span><b v-if="segment.choices.length > 1" class="cutStack">{{ segment.choices.length }}</b></button>
              <div v-if="programMenu" ref="programMenuEl" class="programMenu" role="menu" aria-label="选择这一段播出的机位" :style="{ left: `${filmX(programMenu.start)}px` }" @pointerdown.stop>
                <button v-for="id in programMenu.choices" :key="id" type="button" role="menuitem" :class="{ active: id === programMenu.cameraId }" :style="{ '--cutColor': performanceColor('camera:' + id) }" @click="chooseProgram(id)"><i />{{ cameraMap.get(id)?.name ?? '机位' }}</button>
              </div>
            </div>
            <div v-else-if="row.kind === 'camera'" class="rowLane cameraLane" @pointerdown="beginLane($event, row)">
              <button type="button" class="cameraStrip" :class="{ active: selectedCameraId === row.id && !selectedShotId }" :style="{ left: `${filmX(0)}px`, width: `${filmLength > 0 ? Math.max(8, filmLength * scale) : 0}px` }" :disabled="disabled" :title="`${row.name} · 在轨道上拖出一段时间就是一段镜头`" :aria-label="`${row.name}，拖动框选镜头段`" @click="keyboardCamera($event, row)" />
              <button v-for="shot in row.shots" :key="shot.id" type="button" class="shotBlock" :data-shot="shot.id" :data-item="'shot:' + row.id + ':' + shot.id" :class="{ active: selectedCameraId === row.id && selectedShotId === shot.id, dragging: shotDrag?.shotId === shot.id, picked: picked.has('shot:' + row.id + ':' + shot.id) }" :style="{ left: `${filmX(shot.start)}px`, width: `${Math.max(8, (shot.end - shot.start) * scale)}px` }" :disabled="disabled" :title="`${filmStamp(shot.start)} – ${filmStamp(shot.end)}${shot.path ? ' · 有机位轨迹' : ''}`" :aria-label="`${row.name}镜头段 ${filmStamp(shot.start)} 到 ${filmStamp(shot.end)}，左右键移动，Delete删除`" @pointerdown="beginShot($event, row, shot)" @keydown="nudgeShot($event, row, shot)" @click="keyboardCamera($event, row, shot.id)"><span>{{ (shot.end - shot.start).toFixed(1) }}s</span><icon-route v-if="shot.path" :size="12" /><i class="grip" data-edge="start" aria-hidden="true" /><i class="grip" data-edge="end" aria-hidden="true" /></button>
              <template v-for="shot in row.shots" :key="'keys:' + shot.id"><button v-for="key in shotKeys(row, shot)" :key="key.id" type="button" class="shotKey" :class="{ active: selectedShotKey === key.id, dragging: keyDrag?.keyId === key.id }" :style="{ left: `${filmX(shot.start + key.at * (shot.end - shot.start))}px` }" :disabled="disabled" :title="`关键点 ${filmStamp(shot.start + key.at * (shot.end - shot.start))} · ${Math.round(key.focal)}mm${key.roll ? ' · 翻滚 ' + Math.round(key.roll) + '°' : ''} · 拖动改时刻，点开调整`" :aria-label="`${row.name}镜头关键点 ${filmStamp(shot.start + key.at * (shot.end - shot.start))}，左右键移动，Delete删除`" @pointerdown="beginShotKey($event, row, shot, key)" @keydown="nudgeShotKey($event, row, shot, key)" @click="keyboardShotKey($event, row, shot, key)" /></template>
              <i v-if="shotPreview && !shotPreview.shotId && shotPreview.key === row.key" class="shotGhost" :class="{ invalid: !shotPreview.valid }" aria-hidden="true" :style="{ left: `${filmX(shotPreview.start)}px`, width: `${Math.max(2, (shotPreview.end - shotPreview.start) * scale)}px` }"><span>{{ (shotPreview.end - shotPreview.start).toFixed(1) }}s</span></i>
            </div>
            <div v-else class="rowLane">
              <button type="button" class="startHandle" :style="{ left: `${(row.start - origin) * scale}px` }" :disabled="disabled" :aria-label="`${row.name}开始于${stamp(row.start)}，左右键调整一秒`" :title="`${row.startAt === undefined ? '立即 · ' : ''}${stamp(row.start)} · 起点不能拖入过去`" @pointerdown="begin($event, row)" @keydown="nudge($event, row)" @click="keyboardSelect($event, row)" />
              <template v-if="row.anchors.length"><button v-for="anchor in row.anchors" :key="'anchor' + anchor.index" type="button" class="routeAnchor" :class="{ active: selectedRowKey === row.key && selectedPoint === anchor.index, first: anchor.index === 0, teleport: anchor.teleport }" :style="{ left: `${(row.start + anchor.offset - origin) * scale}px` }" :disabled="disabled" :aria-label="`${row.name}第${anchor.index + 1}个锚点，拖动调整到达时间和速度`" :title="`第 ${anchor.index + 1} 个锚点 · ${stamp(row.start + anchor.offset)} ${anchor.teleport ? ' · 此点后瞬移' : ''} · 拖动调整到达/速度`" @pointerdown="beginAnchor($event, row, anchor)" @click="keyboardSelect($event, row, anchor.index)" /></template>
              <button v-for="block in row.blocks" :key="block.clip.id" type="button" class="timelineBlock" :data-item="'clip:' + row.id + ':' + block.clip.id" :class="{ eventBlock: block.clip.kind === 'pose', approximate: block.approximate, clipStopped: block.clip.enabled === false, active: selectedRowKey === row.key && selectedClipId === block.clip.id, picked: picked.has('clip:' + row.id + ':' + block.clip.id) }" :style="{ left: `${(row.start + block.offset - origin) * scale}px`, width: `${Math.max(8, block.seconds * scale)}px` }" :disabled="disabled" :title="`${block.label} · ${stamp(row.start + block.offset)} · ${block.seconds.toFixed(1)} 秒 · ${block.clip.rate}× · ${block.clip.enabled === false ? '已停用 · ' : ''}拖动移动片段`" :aria-label="`${block.label}，左右键移动一秒，Delete删除片段`" @pointerdown="beginBlock($event, row, block)" @keydown="nudge($event, row, block)" @click="keyboardSelect($event, row, block.index, block.clip.id)"><span>{{ block.label }}</span></button>
            </div>
          </div>
        </div>
        <i v-if="marquee" class="marquee" aria-hidden="true" :style="marqueeStyle" />
        <i v-if="tool === 'razor' && razorX !== null && !interacting" class="razorLine" aria-hidden="true" :style="{ left: `${razorX}px` }" />
        <div ref="needle" class="worldNeedle"><button type="button" class="playheadHandle" :disabled="disabled" aria-label="拖动播放头，左右键逐秒定位" :title="stamp(playhead)" @pointerdown="beginSeek" @keydown="seekKey" /></div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import { nextTick } from "vue";
import { markMessages, translate } from "@toonflow/i18n/vue";
import { extractSpeakers, findAxisCrossings, splitScenes } from "./shotCoverage";
import { lineOverrun } from "./shotList";
// 对白框里识别到的角色（按出场先后），让人点之前就知道谁会被站位、拍到。
const scriptSpeakers = computed(() => dialogueScript.value.trim() ? extractSpeakers(dialogueScript.value) : []);
// 上游剧本有好几场时按场带入（只列有对白的场，最多8场）。
const upstreamScenes = computed(() => props.upstreamScript ? splitScenes(props.upstreamScript).filter(scene => extractSpeakers(scene).length >= 1).slice(0, 8) : []);
function sceneTitle(scene: string) { return scene.split(/\r?\n/)[0]?.trim() ?? ""; }
import { ElPopover } from "element-plus";
import { IconEye, IconEyeOff, IconScissors, IconChevronDown, IconChevronRight, IconTrash, IconCamera, IconCameraPlus, IconMapPinPlus, IconZoomIn, IconZoomOut, IconArrowNarrowRight, IconRoute, IconFolder, IconFolderPlus, IconFolderOff, IconMagnet, IconArrowsHorizontal, IconBroadcast, IconMovie } from "@tabler/icons-vue";
import timelineTransport from "./timelineTransport.vue";
import { getCameraGap, getCameraShot, getCamerasDuration, getProgramSegments, minFilmSeconds, numberProgramSegments, type CameraShot, type SceneCamera, type ShotKey } from "./cameraDocument";
import type { TimelineFolder } from "./sceneDocument";
import { getPerformanceEventDuration, getPerformanceSegmentDuration, insertPerformancePoint, performanceTrackSchema, type PerformanceTrack } from "./performanceDocument";
import { findClipRoutePoint, getClipRoute, getClipRouteTiming, setClipRouteArrival, getPerformanceClips, getPerformanceClipDuration, getPerformanceClipSourceTime, getPerformancePointOffsets, insertClipRoutePoint, type PerformanceClip } from "./performanceClips";
import { performanceColor } from "./performanceOverlay";
import type { SceneObject, SceneObjectGroup } from "./sceneDocument";

const props = defineProps<{ folders?: TimelineFolder[]; snapping?: boolean; tracks: PerformanceTrack[]; objects: SceneObject[]; groups?: SceneObjectGroup[]; cameras?: SceneCamera[]; worldSeconds: number; clock?: () => number; starts?: Record<string, number>; selectedTrackId?: string; selectedPoint?: number; selectedClipId?: string; selectedCameraId?: string; selectedShotId?: string; selectedShotKey?: string; disabled?: boolean; collapsed?: boolean; running: boolean; completed?: boolean; range?: { start: number; end: number }; height?: number; canExportFrames?: boolean; exportHint?: boolean; upstreamScript?: string }>();
// 按对白分镜的剧本，本次编辑会话里保留。
const dialogueScript = ref("");
// 剪辑节奏：一键分镜时每个镜头的时长倍数（动作戏快切、文戏舒缓），本次编辑会话里保留。
const paceOptions = markMessages([{ name: "快切", value: 0.6, title: "镜头约2秒一切，适合打斗、追逐、紧张场面" }, { name: "标准", value: 1, title: "镜头约3到4秒一切" }, { name: "舒缓", value: 1.6, title: "镜头约5到6秒一切，适合文戏、抒情、交代环境" }]);
const coveragePace = ref(1);
const emit = defineEmits<{ change: [id: string, patch: Partial<PerformanceTrack>]; select: [id: string, index?: number]; selectClip: [id: string, clipId: string]; removeClip: [id: string, clipId: string]; remove: [id: string]; addCamera: []; autoCoverage: [script?: string, pace?: number]; exportShots: []; exportEdl: []; exportFrames: []; exportVideo: [longEdge: number]; fixLineTiming: []; selectCamera: [id: string, shotId?: string]; createShot: [id: string, start: number, end: number]; changeShot: [id: string, shotId: string, start: number, end: number]; removeShot: [id: string, shotId: string]; removeCamera: [id: string]; "update:collapsed": [value: boolean]; togglePlayback: []; seek: [seconds: number, phase: "start" | "move" | "end" | "cancel"]; "update:folders": [value: TimelineFolder[]]; "update:snapping": [value: boolean]; "update:height": [value: number]; pickProgram: [cameraId: string, time: number];
  splitShot: [cameraId: string, shotId: string, time: number]; splitClip: [trackId: string, clipId: string, time: number];
  moveItems: [items: TimelineItem[], delta: number]; removeItems: [items: TimelineItem[]];
  renameCamera: [id: string, name: string]; toggleCamera: [id: string]; duplicateItems: [items: TimelineItem[]];
  addShotKey: [cameraId: string, shotId: string, at: number, clientX?: number]; selectShotKey: [cameraId: string, shotId: string, keyId: string, clientX?: number];
  moveShotKey: [cameraId: string, shotId: string, keyId: string, at: number, clientX?: number]; removeShotKey: [] }>();
// 时间轴上可框选、成组移动、切割的东西：镜头段（owner=机位）或演绎片段（owner=动线）。
export type TimelineItem = { kind: "shot" | "clip"; owner: string; id: string };
type Block = { index: number; offset: number; seconds: number; label: string; approximate: boolean; clip: PerformanceClip };
type Anchor = { index: number; offset: number; teleport: boolean };
type TrackRow = { kind: "track"; key: string; id: string; enabled?: boolean; startAt?: number; name: string; start: number; length: number; color: string; blocks: Block[]; anchors: Anchor[]; track: PerformanceTrack };
type CameraRow = { kind: "camera"; key: string; id: string; enabled?: boolean; name: string; color: string; camera: SceneCamera; shots: CameraShot[] };
type FolderRow = { kind: "folder"; key: string; id: string; name: string; color: string; collapsed: boolean; count: number; start?: number; end?: number };
type Cut = { start: number; end: number; cameraId: string; choices: string[]; name: string; color: string; number: number; crossesAxis?: boolean; overrun?: number; note?: string };
type ProgramRow = { kind: "program"; key: string; id: string; name: string; color: string; cuts: Cut[] };
type Row = TrackRow | CameraRow | FolderRow | ProgramRow;
type Drag = { pointer: number; x: number; scroll: number; scale: number; now: number; row: TrackRow; block?: Block; index?: number; delta: number };

// 机位时间都是成片秒：from/to是按下时的镜头段范围（新建时两者都是按下的时刻）。
type ShotMode = "create" | "move" | "start" | "end";
// 机位时间都是成片秒：from/to是按下时的镜头段范围（新建时两者都是按下的时刻）。
type ShotDrag = { pointer: number; x: number; scroll: number; scale: number; key: string; id: string; mode: ShotMode; shotId?: string; from: number; to: number; delta: number };
const maxCameras = 24;
const maxShots = 64;
const minDragShot = 0.3;
const zoomHint = markMessages("Ctrl / ⌘ + 滚轮缩放 · Shift + 滚轮横移");
const maxFolders = 32;
// ACT: 缩放从整天总览（约每像素百秒）到逐帧（每秒2400像素，1/24秒约100像素）；内容宽度上限按浏览器可承受的DOM宽度给。
const minZoom = 0.01, maxZoom = 2400;
const frameSeconds = 1 / 24;
const tickSteps: [number, number][] = [[1 / 24, 1 / 120], [0.1, 1 / 48], [0.25, 1 / 24], [0.5, 0.1], [1, 0.2], [2, 0.5], [5, 1], [10, 2], [15, 5], [30, 5], [60, 10], [120, 30], [300, 60], [600, 120], [900, 300], [1800, 300], [3600, 600], [7200, 1800], [21600, 3600], [43200, 7200], [86400, 14400]];
const root = ref<HTMLElement>();
const scroll = ref<HTMLElement>();
const needle = ref<HTMLElement>();
const elapsedWhole = ref<HTMLElement>();
const elapsedFraction = ref<HTMLElement>();
const drag = shallowRef<Drag>();
const shotDrag = shallowRef<ShotDrag>();
const seekDrag = shallowRef<{ pointer: number; before: number; position: number }>();
let seekFrame: number | undefined;
let seekClientX = 0;
let liveFrame: number | undefined;
const pan = shallowRef<{ pointer: number; x: number; scroll: number }>();
const anchorDrag = shallowRef<{ pointer: number; x: number; scroll: number; scale: number; now: number; row: TrackRow; index: number; delta: number }>();
// 拖镜头关键点：只在本段镜头里左右移动，改的是它在这段里的时刻（0–1）。
const keyDrag = shallowRef<{ pointer: number; x: number; scroll: number; scale: number; cameraId: string; shotId: string; keyId: string; from: number; start: number; span: number; delta: number }>();
function anchorPatchFor(row: TrackRow, index: number, delta: number): Partial<PerformanceTrack> {
  if (index <= 0 || row.track.teleports?.includes(index - 1)) return {};
  if (row.track.clips) {
    // 片段式动线：拖锚点改走到这一点那一段的用时，之后的片段整体顺延。
    const timing = getClipRouteTiming(row.track.clips);
    const base = row.start - filmStart.value;
    const snapped = snapFilm(base + (timing.arrivals[index] ?? 0) + delta, `anchor:${row.id}:${index}`) - base;
    return { clips: setClipRouteArrival(row.track.clips, index, Math.max((timing.departures[index - 1] ?? 0) + 0.1, snapped)) };
  }
  const offsets = row.anchors.map(anchor => anchor.offset);
  const previous = offsets[index - 1] ?? 0;
  const current = offsets[index] ?? previous;
  const next = offsets[index + 1] ?? Infinity;
  const event = row.track.events?.find(item => item.at === index - 1);
  const dwell = event ? getPerformanceEventDuration(event) : 0;
  const nextEvent = row.track.events?.find(item => item.at === index);
  const nextDwell = nextEvent ? getPerformanceEventDuration(nextEvent) : 0;
  const base = row.start - filmStart.value;
  const snapped = snapFilm(base + current + delta, `anchor:${row.id}:${index}`) - base;
  const target = Math.max(previous + dwell + 0.1, Math.min(next - nextDwell - 0.1, snapped));
  const duration = Math.max(0.1, Math.round((target - previous - dwell) * 1000) / 1000);
  return { segmentSeconds: Array.from({ length: Math.max(row.track.segmentSeconds?.length ?? 0, index) }, (_, cursor) => cursor === index - 1 ? duration : row.track.segmentSeconds?.[cursor] ?? 0) };
}
function beginAnchor(event: PointerEvent, row: TrackRow, anchor: { index: number; offset: number }) {
  if (props.disabled || event.button !== 0 || !event.isPrimary || interacting.value) return;
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  emit("select", row.id, anchor.index);
  if (anchor.index <= 0 || row.track.teleports?.includes(anchor.index - 1)) return;
  anchorDrag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, now: props.worldSeconds, row, index: anchor.index, delta: 0 };
  root.value?.setPointerCapture(event.pointerId);
}
const interacting = computed(() => !!(drag.value || shotDrag.value || keyDrag.value || anchorDrag.value || seekDrag.value || pan.value || marquee.value || groupDrag.value));
const playhead = computed(() => clampSeek(seekDrag.value?.position ?? props.worldSeconds));
const zoom = ref(8);
let zoomOffset: number | undefined;
const scrollX = ref(0);
const scrollY = ref(0);
const viewportWidth = ref(900);
const viewportHeight = ref(170);
const error = ref("");
const initialTime = Number.isFinite(props.worldSeconds) ? props.worldSeconds : 0;
const firstSeen = new Map<string, { time: number; startAt?: number }>();
let observer: ResizeObserver | undefined;
let centered = false;
watch(() => props.tracks, tracks => {
  if (drag.value) cancel();
  const ids = new Set(tracks.map(track => track.id));
  for (const id of firstSeen.keys()) if (!ids.has(id)) firstSeen.delete(id);
  for (const track of tracks) {
    const previous = firstSeen.get(track.id);
    if (!previous || previous.startAt !== track.startAt) firstSeen.set(track.id, { time: Number.isFinite(props.worldSeconds) ? props.worldSeconds : initialTime, startAt: track.startAt });
  }
}, { immediate: true });
// ACT: 选中镜头段时宿主会定位播放头并提交文档，cameras随之换成新数组；只有拖动中的机位或镜头段真的没了才中断拖动。
watch(() => props.cameras, cameras => {
  const current = shotDrag.value;
  if (!current) return;
  const camera = cameras?.find(item => item.id === current.id);
  if (!camera || current.shotId && !getCameraShot(camera, current.shotId)) cancel();
});
watch(() => props.disabled, disabled => { if (disabled) cancel(); });
watch(() => props.collapsed, collapsed => { if (collapsed) cancel(); });
function clockValue(seconds: number) { return ((Math.round(seconds) % 86400) + 86400) % 86400; }
/** 成片时间文字：m:ss，满一小时为h:mm:ss；digits为小数位。 */
function clock(seconds: number, digits = 0) {
  const value = Number.isFinite(seconds) ? seconds : 0, unit = 10 ** digits;
  const scaled = Math.floor(Math.abs(value) * unit + 0.000001), whole = Math.floor(scaled / unit);
  const hours = Math.floor(whole / 3600), minutes = Math.floor(whole / 60) % 60;
  const text = `${hours ? `${hours}:${String(minutes).padStart(2, "0")}` : minutes}:${String(whole % 60).padStart(2, "0")}${digits ? "." + String(scaled % unit).padStart(digits, "0") : ""}`;
  return value < 0 && scaled ? "-" + text : text;
}
function filmStamp(time: number) { return clock(time, 1); }
function stamp(seconds: number) { return filmStamp(seconds - filmStart.value); }
function roundTenth(value: number) { return Math.round(value * 10) / 10; }
function snap(value: number, owner = "") { return snapFilm(value, owner); }
let snapBypass = false;
// 吸附点（成片秒）：成片首尾、播放头、各机位镜头段边缘、动作片段边缘和动线锚点。owner用于拖动时排除自己。
const snapPoints = computed(() => {
  const points: { time: number; owner: string }[] = [{ time: 0, owner: "" }, { time: filmLength.value, owner: "" }];
  for (const camera of props.cameras ?? []) for (const shot of camera.shots ?? []) points.push({ time: shot.start, owner: "shot:" + shot.id }, { time: shot.end, owner: "shot:" + shot.id });
  for (const row of trackRows.value) {
    const base = row.start - filmStart.value;
    for (const block of row.blocks) points.push({ time: base + block.offset, owner: "clip:" + block.clip.id }, { time: base + block.offset + block.seconds, owner: "clip:" + block.clip.id });
    for (const anchor of row.anchors) points.push({ time: base + anchor.offset, owner: `anchor:${row.id}:${anchor.index}` });
  }
  return points;
});
/** 成片秒的落点：开吸附时8像素内贴到最近的吸附点，否则落到帧（放大时）或0.1秒；关吸附时只取到0.01秒。 */
function snapFilm(time: number, owner = "", grid = true) {
  if (!props.snapping || snapBypass) return Math.round(time * 100) / 100;
  let best = time, distance = 8 / scale.value;
  const head = (seekDrag.value ? undefined : clampSeek(playhead.value) - filmStart.value);
  if (owner !== "playhead" && head !== undefined && Math.abs(head - time) < distance) { best = head; distance = Math.abs(head - time); }
  for (const point of snapPoints.value) if (point.owner !== owner || !owner) { const gap = Math.abs(point.time - time); if (gap < distance && (!owner || point.owner !== owner)) { best = point.time; distance = gap; } }
  if (best !== time) return Math.round(best * 1000) / 1000;
  if (!grid) return Math.round(time * 100) / 100;
  const unit = scale.value >= 120 ? frameSeconds : 0.1;
  return Math.round(Math.round(time / unit) * unit * 1000) / 1000;
}
function tickLabel(time: number) {
  const step = tickStep.value[0];
  if (time >= 60) return clock(time, step < 1 ? 1 : 0);
  // 逐帧刻度标成“秒+帧”，更细的刻度按小数显示。
  if (step < 0.1) { const whole = Math.floor(time + 0.000001); return `${whole}s+${Math.round((time - whole) * 24)}f`; }
  return `${Math.round(time * 100) / 100}s`;
}
function schedule(startAt: number, now: number) { const value = Math.floor(now / 86400) * 86400 + startAt; return value < now ? value + 86400 : value; }
function trackStart(track: PerformanceTrack) {
  const fallback = firstSeen.get(track.id)?.time ?? initialTime;
  const actual = props.starts?.[track.id];
  return actual !== undefined && Number.isFinite(actual) ? actual : track.startAt === undefined ? fallback : schedule(track.startAt, fallback);
}
function clipStart(track: PerformanceTrack, clip: PerformanceClip, visited = new Set<string>()): number {
  const key = track.id + ":" + clip.id;
  if (!clip.trigger || visited.has(key)) return trackStart(track) + clip.start;
  visited.add(key);
  const source = props.tracks.find(track => track.id === clip.trigger!.trackId);
  const object = source && props.objects.find(object => object.id === source.objectId);
  const trigger = source && object && getPerformanceClips(source, object).find(item => item.id === clip.trigger!.clipId);
  return source && trigger ? clipStart(source, trigger, visited) + clip.start : trackStart(track) + clip.start;
}
function makeRow(track: PerformanceTrack, start: number): TrackRow {
  const object = props.objects.find(object => object.id === track.objectId);
  const clips = object ? getPerformanceClips(track, object) : [];
  const blocks: Block[] = clips.map((clip, index) => ({ index, offset: clip.trigger ? clipStart(track, clip) - start : clip.start, seconds: getPerformanceClipDuration(clip), label: clip.name, approximate: !!clip.trigger || !track.clips && clip.kind === "move", clip }));
  // ACT: 时间轴纵深感来自路径点；按move片段边界生成可拖动锚点，与场景里的锚点一一对应。
  // 片段式动线（Agent或剪辑生成）同样按路线点的到达时刻给锚点，和场景里的路径点一一对应。
  const anchors: Anchor[] = track.clips ? (track.controller === "object" ? [] : getClipRouteTiming(track.clips).arrivals.map((offset, index) => ({ index, offset, teleport: false })))
    : getPerformancePointOffsets(clips, track.points.length).map((offset, index) => ({ index, offset, teleport: !!track.teleports?.includes(index) }));
  const length = Math.max(0, ...blocks.map(block => block.offset + block.seconds));
  return { kind: "track", key: "track:" + track.id, id: track.id, enabled: track.enabled, startAt: track.startAt, track, start, length, blocks, anchors, name: track.name ?? object?.name ?? translate("场景物体"), color: performanceColor(track.id) };
}
function makeCameraRow(camera: SceneCamera): CameraRow {
  return { kind: "camera", key: "camera:" + camera.id, id: camera.id, enabled: camera.enabled, camera, shots: camera.shots ?? [], name: camera.name, color: performanceColor("camera:" + camera.id) };
}
const cameraMap = computed(() => new Map((props.cameras ?? []).map(camera => [camera.id, camera])));
const cameraCount = computed(() => props.cameras?.length ?? 0);
const trackRows = computed(() => props.tracks.map(track => makeRow(track, trackStart(track))));
// ACT: 面板高度可拖上沿调整（双击恢复默认），宿主保存；行区跟着变高变矮。
const defaultHeight = 214;
const panelHeight = computed(() => Math.round(Math.min(Math.max(props.height ?? defaultHeight, 120), Math.max(160, window.innerHeight * 0.8))));
const resizeDrag = shallowRef<{ pointer: number; y: number; height: number }>();
function beginResize(event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  resizeDrag.value = undefined;
  try { (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId); } catch { /* 没有真实指针时不捕获 */ }
  resizeDrag.value = { pointer: event.pointerId, y: event.clientY, height: panelHeight.value };
}
function moveResize(event: PointerEvent) {
  const drag = resizeDrag.value;
  if (!drag || drag.pointer !== event.pointerId) return;
  emit("update:height", Math.round(drag.height + drag.y - event.clientY));
}
function endResize(event: PointerEvent) { if (resizeDrag.value?.pointer === event.pointerId) resizeDrag.value = undefined; }

// 成片行：几台机位的镜头段重叠的那段，点一下弹出机位列表，选谁就播谁。
const programMenu = shallowRef<Cut>();
const programMenuEl = ref<HTMLElement | null>(null);
function closeProgramMenu() { programMenu.value = undefined; window.removeEventListener("pointerdown", onProgramMenuPointer, true); window.removeEventListener("keydown", onProgramMenuKey, true); }
function onProgramMenuPointer(event: PointerEvent) { if (!programMenuEl.value?.contains(event.target as Node)) closeProgramMenu(); }
function onProgramMenuKey(event: KeyboardEvent) { if (event.key === "Escape") { event.stopPropagation(); closeProgramMenu(); } }
function clickCut(segment: Cut) {
  if (segment.choices.length < 2) { closeProgramMenu(); emit("selectCamera", segment.cameraId); return; }
  if (programMenu.value?.start === segment.start) { closeProgramMenu(); return; }
  programMenu.value = segment;
  window.addEventListener("pointerdown", onProgramMenuPointer, true);
  window.addEventListener("keydown", onProgramMenuKey, true);
}
function chooseProgram(cameraId: string) {
  const segment = programMenu.value;
  closeProgramMenu();
  if (segment) emit("pickProgram", cameraId, (segment.start + segment.end) / 2);
}
onBeforeUnmount(closeProgramMenu);
const folderList = computed(() => props.folders ?? []);
const folderCount = computed(() => folderList.value.length);
// 每条轨道属于哪个分组（行key → 分组id）；分组里登记了但已不存在的轨道直接忽略。
const folderOf = computed(() => { const map = new Map<string, string>(); for (const folder of folderList.value) for (const key of folder.items) if (!map.has(key)) map.set(key, folder.id); return map; });
function rowSpan(row: TrackRow | CameraRow): [number, number] {
  if (row.kind === "track") return [row.start, row.start + row.length];
  return row.shots.length ? [filmStart.value + Math.min(...row.shots.map(shot => shot.start)), filmStart.value + Math.max(...row.shots.map(shot => shot.end))] : [filmStart.value, filmStart.value + filmLength.value];
}
// 预演小样清晰度：720p（长边1280）或1080p（长边1920），记在本机。
// 成片里台词说不完的镜头数（工具栏出现“拉长”按钮）。
const overrunCount = computed(() => programRow.value?.cuts.filter(cut => cut.overrun).length ?? 0);
const programRow = computed<ProgramRow | undefined>(() => {
  const cameras = props.cameras ?? [];
  if (!cameras.length) return undefined;
  return { kind: "program", key: "program", id: "program", name: "成片", color: "var(--el-color-danger)", cuts: (() => { const segments = getProgramSegments(cameras, filmLength.value); const numbers = numberProgramSegments(cameras, segments); const routes = new Map(props.tracks.filter(track => track.enabled !== false).map(track => { const object = props.objects.find(item => item.id === track.objectId); return [track.objectId, [...(object ? [{ x: object.position.x, z: object.position.z }] : []), ...track.points.map(point => ({ x: point[0]!, z: point[2]! }))]] as const; })); const crossings = new Set(findAxisCrossings(props.objects, cameras, segments.map((segment, index) => ({ ...segment, number: numbers[index]! })), routes)); return segments.map((segment, index) => ({ ...segment, number: numbers[index]!, crossesAxis: crossings.has(numbers[index]!), ...(camera => { const shots = camera?.shots?.filter(item => item.end > segment.start + 0.001 && item.start < segment.end - 0.001) ?? []; const overrun = Math.max(0, ...shots.map(shot => lineOverrun({ start: shot.start, end: shot.end, shot }) ?? 0)); return { overrun: overrun || undefined, note: shots.find(shot => shot.note)?.note }; })(cameraMap.value.get(segment.cameraId)), name: cameraMap.value.get(segment.cameraId)?.name ?? "", color: performanceColor("camera:" + segment.cameraId) })); })() };
});
// ACT: 行的顺序：成片 → 各分组（组头 + 展开时的成员）→ 未分组的机位 → 未分组的动线；组内保持加入分组的先后。
const baseRows = computed<Row[]>(() => {
  const cameraRows = (props.cameras ?? []).map(makeCameraRow);
  const all = new Map<string, TrackRow | CameraRow>([...cameraRows, ...trackRows.value].map(row => [row.key, row]));
  const result: Row[] = programRow.value ? [programRow.value] : [];
  const grouped = folderOf.value;
  for (const folder of folderList.value) {
    const members = folder.items.flatMap(key => { const row = all.get(key); return row && grouped.get(key) === folder.id ? [row] : []; });
    const spans = members.map(rowSpan);
    result.push({ kind: "folder", key: "folder:" + folder.id, id: folder.id, name: folder.name, color: "var(--el-text-color-secondary)", collapsed: !!folder.collapsed, count: members.length, ...(spans.length ? { start: Math.min(...spans.map(span => span[0])), end: Math.max(...spans.map(span => span[1])) } : {}) });
    if (!folder.collapsed) result.push(...members);
  }
  result.push(...cameraRows.filter(row => !grouped.has(row.key)), ...trackRows.value.filter(row => !grouped.has(row.key)));
  return result;
});
const selectedRowKey = computed(() => props.selectedCameraId ? "camera:" + props.selectedCameraId : props.selectedTrackId ? "track:" + props.selectedTrackId : "");
const selectedShot = computed(() => { const camera = props.selectedCameraId ? cameraMap.value.get(props.selectedCameraId) : undefined; return camera ? getCameraShot(camera, props.selectedShotId) : undefined; });
// 选中变化时把它滚进视野：镜头段对准段首，整条机位只滚到那一行。
const selectedRevealTime = computed(() => props.selectedCameraId ? selectedShot.value && filmStart.value + selectedShot.value.start : trackRows.value.find(row => row.id === props.selectedTrackId)?.start);
const selectedClipBlock = computed(() => {
  const row = trackRows.value.find(row => row.id === props.selectedTrackId);
  const block = row?.blocks.find(block => block.clip.id === props.selectedClipId);
  return row && block ? { row, block } : undefined;
});
// 逐点动线和带移动片段的片段式动线都能加点。
const selectedRouteRow = computed(() => trackRows.value.find(row => row.id === props.selectedTrackId && row.track.controller !== "object" && (!row.track.clips || row.track.clips.some(clip => clip.kind === "move" && clip.enabled !== false))));
const deleteTarget = computed(() => {
  if (picked.value.size > 1) { const items = pickedItems(); return { label: `删除所选 ${items.length} 项`, run: () => { emit("removeItems", items); clearPicks(); } }; }
  if (props.selectedShotKey && selectedShot.value?.keys?.some(key => key.id === props.selectedShotKey)) return { label: translate("删除关键点"), run: () => emit("removeShotKey") };
  const camera = props.selectedCameraId ? cameraMap.value.get(props.selectedCameraId) : undefined;
  const shot = selectedShot.value;
  if (camera && shot) return { label: translate("删除镜头段"), run: () => emit("removeShot", camera.id, shot.id) };
  const clip = selectedClipBlock.value;
  if (clip) return { label: translate("删除片段"), run: () => emit("removeClip", clip.row.id, clip.block.clip.id) };
  if (camera) return { label: translate("删除机位"), run: () => emit("removeCamera", camera.id) };
  const track = props.selectedTrackId ? props.tracks.find(track => track.id === props.selectedTrackId) : undefined;
  return track ? { label: translate("删除动线"), run: () => emit("remove", track.id) } : undefined;
});
const playbackRange = computed(() => {
  const range = props.range;
  if (range && Number.isFinite(range.start) && Number.isFinite(range.end) && range.end >= range.start) return range;
  const tracks = trackRows.value, cameras = props.cameras ?? [];
  const start = tracks.length ? Math.min(...tracks.map(row => row.start)) : initialTime;
  return { start, end: Math.max(start, ...tracks.map(row => row.start + row.length), cameras.length ? start + Math.max(minFilmSeconds, getCamerasDuration(cameras)) : start) };
});
const filmStart = computed(() => playbackRange.value.start);
const filmLength = computed(() => Math.max(0, playbackRange.value.end - playbackRange.value.start));
const filmNow = computed(() => clampSeek(playhead.value) - filmStart.value);
const totalLabel = computed(() => clock(Math.max(0, Math.ceil(filmLength.value - 0.05))));
const origin = computed(() => Math.floor(Math.min(filmStart.value, ...trackRows.value.map(row => row.start))) - 1);
// ACT: 空时间轴（只等着加机位）也至少铺开minFilmSeconds秒，宽度不会塌成0或NaN。
const span = computed(() => Math.max(filmStart.value + Math.max(minFilmSeconds, filmLength.value), ...trackRows.value.map(row => row.start + row.length)) - origin.value + 4);
const maxScale = computed(() => Math.min(maxZoom, 8000000 / span.value));
const scale = computed(() => Math.min(zoom.value, maxScale.value));
const width = computed(() => Math.max(0, viewportWidth.value - 150) + span.value * scale.value);
const needleLeft = computed(() => 150 + (playhead.value - origin.value) * scale.value);
function filmX(time: number) { return (filmStart.value + time - origin.value) * scale.value; }
const shotPreview = computed(() => {
  const current = shotDrag.value;
  if (!current || Math.abs(dragOffset(current) * current.scale) <= 3) return undefined;
  const camera = cameraMap.value.get(current.id);
  const target = camera && shotTarget(camera, current.mode, current.from, current.to, dragOffset(current), current.shotId);
  return target ? { key: current.key, shotId: current.shotId, ...target, valid: target.end - target.start >= minDragShot - 0.000001 } : undefined;
});
const rows = computed<Row[]>(() => baseRows.value.map(row => {
  if (row.kind === "folder" || row.kind === "program") return row;
  if (row.kind === "camera") {
    const preview = shotPreview.value;
    return preview?.shotId && preview.key === row.key ? { ...row, shots: row.shots.map(shot => shot.id === preview.shotId ? { ...shot, start: preview.start, end: preview.end } : shot) } : row;
  }
  const pendingAnchor = anchorDrag.value;
  if (pendingAnchor && pendingAnchor.row.key === row.key && Math.abs(dragOffset(pendingAnchor)) > 0.001) {
    return makeRow({ ...row.track, ...anchorPatchFor(row, pendingAnchor.index, dragOffset(pendingAnchor)) }, row.start);
  }
  const current = drag.value;
  if (!current || current.row.key !== row.key || Math.abs(dragOffset(current) * current.scale) <= 3) return row;
  const now = Number.isFinite(props.worldSeconds) ? props.worldSeconds : current.now;
  const patch = patchFor(current.row, current.block, dragOffset(current));
  return makeRow({ ...current.row.track, ...patch }, patch.startAt === undefined ? row.start : schedule(patch.startAt, now));
}));
const firstRow = computed(() => Math.max(0, Math.floor((scrollY.value - 26) / 34) - 1));
// ACT: 只渲染看得见的行；行数按行区实际高度算（面板可拖高），多留两行余量，否则下面的动线行会不显示。
const visibleRows = computed(() => rows.value.slice(firstRow.value, firstRow.value + Math.ceil(viewportHeight.value / 34) + 3));
const tickStep = computed(() => tickSteps.find(([step]) => step * scale.value >= 56) ?? [21600, 3600]);
const minorStep = computed(() => { const size = tickStep.value[1] * scale.value; return size >= 6 ? size : 0; });
// 刻度从成片0秒起算，0秒之前不标。
const ticks = computed(() => {
  const [step] = tickStep.value;
  const first = Math.max(0, Math.floor((origin.value + scrollX.value / scale.value - filmStart.value) / step) * step);
  const last = origin.value + width.value / scale.value - filmStart.value;
  return Array.from({ length: Math.ceil(viewportWidth.value / scale.value / step) + 2 }, (_, index) => first + index * step).filter(value => value <= last);
});
function measure() {
  const area = scroll.value;
  if (!area?.clientWidth) return;
  if (!centered) {
    centered = true;
    zoomOffset = 0;
    zoom.value = Math.max(minZoom, Math.min(240, (area.clientWidth - 150) / span.value));
  }
  scrollX.value = area.scrollLeft;
  scrollY.value = area.scrollTop;
  viewportWidth.value = area.clientWidth;
  viewportHeight.value = area.clientHeight;
}
watch([origin, scale, scroll, selectedRowKey, selectedRevealTime], ([value, size, area, key, time], [previous, oldSize, oldArea, oldKey, oldTime]) => {
  if (!area?.clientWidth) return;
  if (area === oldArea && (value !== previous || size !== oldSize)) {
    const x = zoomOffset ?? (viewportWidth.value - 150) / 2;
    area.scrollLeft = ((previous - value) + (scrollX.value + x) / oldSize) * size - x;
  }
  zoomOffset = undefined;
  measure();
  if (interacting.value || !key || area === oldArea && key === oldKey && time === oldTime) return;
  const index = baseRows.value.findIndex(row => row.key === key);
  if (index < 0) return;
  if (time !== undefined) revealTime(time);
  const top = index * 34;
  if (top < area.scrollTop) area.scrollTop = top;
  else if (top + 60 > area.scrollTop + area.clientHeight) area.scrollTop = top + 60 - area.clientHeight;
  measure();
}, { flush: "post" });
function liveSeconds() {
  const seeking = seekDrag.value;
  if (seeking) return seeking.position;
  const value = props.running && props.clock ? props.clock() : props.worldSeconds;
  return Number.isFinite(value) ? value : props.worldSeconds;
}
// ACT: 播放头和已播时间直接写DOM：播放时每帧读一次精确时钟，组件本身只随粗粒度的worldSeconds重渲染。
function paint() {
  const seconds = clampSeek(liveSeconds());
  const line = needle.value;
  if (line) {
    const x = 150 + (seconds - origin.value) * scale.value;
    line.style.transform = `translateX(${x}px)`;
    line.style.visibility = x - scrollX.value >= 150 && x - scrollX.value <= viewportWidth.value ? "" : "hidden";
  }
  const tenths = Math.floor(Math.max(0, seconds - filmStart.value) * 10 + 0.000001);
  const whole = clock(Math.floor(tenths / 10)), fraction = "." + (tenths % 10);
  if (elapsedWhole.value && elapsedWhole.value.textContent !== whole) elapsedWhole.value.textContent = whole;
  if (elapsedFraction.value && elapsedFraction.value.textContent !== fraction) elapsedFraction.value.textContent = fraction;
}
function stopLive() { if (liveFrame !== undefined) cancelAnimationFrame(liveFrame); liveFrame = undefined; }
function live() { liveFrame = requestAnimationFrame(live); paint(); }
watch(() => props.running && !!props.clock, active => { stopLive(); if (active) liveFrame = requestAnimationFrame(live); }, { immediate: true });
watch([playhead, origin, scale, scrollX, viewportWidth, filmStart, () => props.running, needle, elapsedWhole], () => paint(), { flush: "post" });
onMounted(() => {
  observer = new ResizeObserver(measure);
  if (scroll.value) observer.observe(scroll.value);
  window.addEventListener("keydown", cancelInteractionKey, true);
  window.addEventListener("keydown", editKey, true);
  window.addEventListener("blur", cancel);
  measure();
  paint();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", cancelInteractionKey, true);
  window.removeEventListener("keydown", editKey, true);
  window.removeEventListener("blur", cancel);
  stopLive();
  cancel();
  observer?.disconnect();
});
function startAtFor(row: TrackRow, delta: number) { return clockValue(Math.max(Math.round(row.start + delta), Math.ceil(Number.isFinite(props.worldSeconds) ? props.worldSeconds : row.start))); }
function patchFor(row: TrackRow, block: Block | undefined, delta: number): Partial<PerformanceTrack> {
  if (!block) return { startAt: startAtFor(row, delta) };
  const film = row.start + block.offset - filmStart.value;
  const moved = snapFilm(film + delta, "clip:" + block.clip.id) - film;
  return { clips: row.blocks.map(item => ({ ...item.clip, ...(item.clip.id === block.clip.id ? { start: Math.max(0, Math.min(86400, Math.round((item.clip.start + moved) * 1000) / 1000)) } : {}) })) };
}
function beginBlock(event: PointerEvent, row: TrackRow, block: Block) {
  if (pickBlock(event, "clip:" + row.id + ":" + block.clip.id, () => splitClipAt(row, block, snapFilm(laneTime(event.clientX), "clip:" + block.clip.id)))) return;
  emit("selectClip", row.id, block.clip.id);
  begin(event, row, block, block.index);
}
/** 选中的机位在播放头处的那段镜头，以及播放头在这段里的时刻（0–1）。 */
const keyShotAtPlayhead = computed(() => {
  const camera = props.selectedCameraId ? cameraMap.value.get(props.selectedCameraId) : undefined;
  if (!camera) return undefined;
  const time = clampSeek(playhead.value) - filmStart.value;
  const inside = (shot: CameraShot) => time >= shot.start - 0.0001 && time <= shot.end + 0.0001;
  const shot = selectedShot.value && inside(selectedShot.value) ? selectedShot.value : camera.shots?.find(inside);
  return shot ? { camera, shot, at: Math.min(1, Math.max(0, (time - shot.start) / Math.max(0.001, shot.end - shot.start))) } : undefined;
});
function addPointAtPlayhead() {
  error.value = "";
  if (!props.selectedCameraId) { addAnchorAtPlayhead(); return; }
  const target = keyShotAtPlayhead.value;
  if (!target) { error.value = "把播放头放进这台机位的一段镜头里再加关键点"; return; }
  emit("addShotKey", target.camera.id, target.shot.id, target.at, needle.value?.getBoundingClientRect().left);
}
function keyDragAt(current: NonNullable<typeof keyDrag.value>) {
  const film = snapFilm(current.start + current.from * current.span + dragOffset(current), "key:" + current.keyId);
  return Math.min(1, Math.max(0, (film - current.start) / current.span));
}
function shotKeys(row: CameraRow, shot: CameraShot): ShotKey[] {
  const current = keyDrag.value;
  if (!current || current.cameraId !== row.id || current.shotId !== shot.id || Math.abs(dragOffset(current) * current.scale) <= 3) return shot.keys ?? [];
  return (shot.keys ?? []).map(key => key.id === current.keyId ? { ...key, at: keyDragAt(current) } : key);
}
function beginShotKey(event: PointerEvent, row: CameraRow, shot: CameraShot, key: ShotKey) {
  // 切割、框选照常交给轨道处理。
  if (event.button !== 0 || props.disabled || tool.value === "razor" || event.shiftKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault(); event.stopPropagation();
  clearPicks();
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  keyDrag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, cameraId: row.id, shotId: shot.id, keyId: key.id, from: key.at, start: shot.start, span: Math.max(0.001, shot.end - shot.start), delta: 0 };
  root.value?.setPointerCapture(event.pointerId);
}
function finishShotKey(event: PointerEvent) {
  const current = keyDrag.value;
  if (!current) return;
  const moved = Math.abs(dragOffset(current) * current.scale) > 3;
  const at = keyDragAt(current);
  keyDrag.value = undefined;
  release(event.pointerId);
  if (props.disabled) return;
  if (moved && Math.abs(at - current.from) > 0.00001) emit("moveShotKey", current.cameraId, current.shotId, current.keyId, at, event.clientX);
  else emit("selectShotKey", current.cameraId, current.shotId, current.keyId, event.clientX);
}
function nudgeShotKey(event: KeyboardEvent, row: CameraRow, shot: CameraShot, key: ShotKey) {
  if (props.disabled || interacting.value) return;
  if (event.key === "Delete" && !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
    event.preventDefault(); event.stopPropagation();
    if (event.repeat) return;
    if (props.selectedShotKey === key.id) emit("removeShotKey"); else emit("selectShotKey", row.id, shot.id, key.id, (event.currentTarget as HTMLElement).getBoundingClientRect().left);
    return;
  }
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const span = Math.max(0.001, shot.end - shot.start);
  const at = Math.min(1, Math.max(0, key.at + (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1) / span));
  if (Math.abs(at - key.at) > 0.00001) emit("moveShotKey", row.id, shot.id, key.id, at, (event.currentTarget as HTMLElement).getBoundingClientRect().left);
}
function keyboardShotKey(event: MouseEvent, row: CameraRow, shot: CameraShot, key: ShotKey) { if (!props.disabled && event.detail === 0) emit("selectShotKey", row.id, shot.id, key.id, (event.currentTarget as HTMLElement).getBoundingClientRect().left); }
function addAnchorAtPlayhead() {
  error.value = "";
  const row = trackRows.value.find(item => item.id === props.selectedTrackId);
  if (!row) { error.value = "先在时间轴选择一条动线"; return; }
  const track = row.track;
  if (track.clips) {
    // 片段式动线：在播放头所在（或选中）的移动片段里按路程插一个点，场景里接着就能拖它。
    const time = clampSeek(playhead.value) - row.start;
    const moves = track.clips.filter(clip => clip.kind === "move" && clip.enabled !== false);
    const inside = (clip: PerformanceClip) => time >= clip.start - 0.001 && time <= clip.start + getPerformanceClipDuration(clip) + 0.001;
    const clip = moves.find(item => item.id === props.selectedClipId && inside(item)) ?? moves.find(inside);
    if (!clip) { error.value = "把播放头放到一段移动片段里再加点"; return; }
    try {
      const inserted = insertClipRoutePoint(track.clips, clip.id, getPerformanceClipSourceTime(clip, time - clip.start));
      emit("change", track.id, { clips: inserted.clips });
      emit("select", track.id, findClipRoutePoint(getClipRoute(inserted.clips), inserted.ref));
    } catch (failure) { error.value = failure instanceof Error ? failure.message : "加点失败"; }
    return;
  }
  const time = clampSeek(playhead.value) - row.start;
  const index = row.anchors.findIndex((anchor, cursor) => cursor < row.anchors.length - 1 && time > anchor.offset + 0.001 && time < row.anchors[cursor + 1]!.offset - 0.001);
  if (index < 0) { error.value = "把播放头放到该动线两个锚点之间再加点"; return; }
  const from = row.anchors[index]!, to = row.anchors[index + 1]!;
  const fraction = Math.max(0.01, Math.min(0.99, (time - from.offset) / Math.max(0.001, to.offset - from.offset)));
  const a = track.points[index]!, b = track.points[index + 1]!;
  const point: [number, number, number] = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction, a[2] + (b[2] - a[2]) * fraction];
  try { emit("change", track.id, insertPerformancePoint(track, index, point, fraction)); }
  catch (failure) { error.value = failure instanceof Error ? failure.message : "加点失败"; return; }
  emit("select", track.id, index + 1);
}
const dropKey = ref("");
const renamingFolder = ref("");
// 机位改名：双击名字就地输入，回车或失焦确认，Esc 放弃。
const renamingCamera = ref("");
const cameraInput = ref<HTMLInputElement[]>();
function startCameraRename(id: string) { if (props.disabled) return; renamingCamera.value = id; void nextTick(() => { const input = cameraInput.value?.[0]; input?.focus(); input?.select(); }); }
function finishCameraRename(id: string, value: string) {
  if (renamingCamera.value !== id) return;
  renamingCamera.value = "";
  const name = value.trim();
  if (name && name !== cameraMap.value.get(id)?.name) emit("renameCamera", id, name.slice(0, 40));
}
const folderInput = ref<HTMLInputElement[]>();
function writeFolders(folders: TimelineFolder[]) { emit("update:folders", folders.filter(folder => folder.name.trim())); }
function createFolder() {
  if (props.disabled || folderCount.value >= maxFolders) return;
  const names = new Set(folderList.value.map(folder => folder.name));
  let number = 1;
  while (names.has("分组 " + number)) number++;
  const key = selectedRowKey.value && !folderOf.value.has(selectedRowKey.value) ? selectedRowKey.value : "";
  const id = crypto.randomUUID();
  writeFolders([...folderList.value, { id, name: "分组 " + number, items: key ? [key] : [] }]);
  if (!key) startRename(id);
}
function toggleFolder(id: string) { writeFolders(folderList.value.map(folder => folder.id === id ? { ...folder, collapsed: !folder.collapsed } : folder)); }
function removeFolder(id: string) { writeFolders(folderList.value.filter(folder => folder.id !== id)); }
function startRename(id: string) { renamingFolder.value = id; void nextTick(() => { const input = folderInput.value?.[0]; input?.focus(); input?.select(); }); }
function renameFolder(id: string, name: string) {
  if (renamingFolder.value !== id) return;
  renamingFolder.value = "";
  const value = name.trim().slice(0, 40);
  if (value) writeFolders(folderList.value.map(folder => folder.id === id ? { ...folder, name: value } : folder));
}
// ACT: 归组用原生拖放：把轨道名拖到组头放进该组，拖到组里的成员上也进同一组，拖到未分组的轨道上就移出分组。
function dragRow(event: DragEvent, row: Row) {
  if (props.disabled || row.kind === "folder" || row.kind === "program" || !event.dataTransfer) return;
  event.dataTransfer.setData("text/x-timeline-row", row.key);
  event.dataTransfer.effectAllowed = "move";
}
function dragOverRow(event: DragEvent, row: Row) {
  if (props.disabled || row.kind === "program" || !event.dataTransfer?.types.includes("text/x-timeline-row")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  dropKey.value = row.key;
}
function dropOnRow(event: DragEvent, row: Row) {
  const key = event.dataTransfer?.getData("text/x-timeline-row");
  dropKey.value = "";
  if (!key || props.disabled || row.kind === "program" || key === row.key) return;
  event.preventDefault();
  const target = row.kind === "folder" ? row.id : folderOf.value.get(row.key);
  const folders = folderList.value.map(folder => ({ ...folder, items: folder.items.filter(item => item !== key) }));
  writeFolders(target ? folders.map(folder => {
    if (folder.id !== target) return folder;
    const at = row.kind === "folder" ? folder.items.length : Math.max(0, folder.items.indexOf(row.key) + 1);
    return { ...folder, collapsed: false, items: [...folder.items.slice(0, at), key, ...folder.items.slice(at)] };
  }) : folders);
}

function fitZoom() {
  const area = scroll.value;
  if (!area || interacting.value) return;
  zoomOffset = 0;
  zoom.value = Math.max(minZoom, Math.min(maxScale.value, (area.clientWidth - 170) / Math.max(1, span.value)));
  void nextTick(() => { area.scrollLeft = 0; measure(); });
}
function deleteSelection() { if (!props.disabled && !interacting.value) deleteTarget.value?.run(); }
function commit(row: TrackRow, block: Block | undefined, delta: number) {
  if (props.disabled) return;
  const patch = patchFor(row, block, delta);
  const parsed = performanceTrackSchema.safeParse({ ...row.track, ...patch });
  if (!parsed.success) { error.value = parsed.error.issues[0]?.message ?? "时间设置无效"; return; }
  error.value = "";
  emit("change", row.id, patch);
}
function begin(event: PointerEvent, row: TrackRow, block?: Block, index?: number) {
  if (props.disabled || event.button !== 0 || !event.isPrimary || interacting.value) return;
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  drag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, now: props.worldSeconds, row, block, index, delta: 0 };
  root.value?.setPointerCapture(event.pointerId);
}
/** 镜头段拖动的结果（成片秒，已吸附并夹进空档）。新建时from是按下的时刻；按在已有镜头段里时没有结果。 */
function shotTarget(camera: SceneCamera, mode: ShotMode, from: number, to: number, offset: number, shotId?: string) {
  if (mode === "create") {
    const gap = getCameraGap(camera, from);
    if (!gap) return undefined;
    const low = Math.max(0, gap.start), high = Math.min(86400, gap.end);
    const a = Math.min(high, Math.max(low, snap(from))), b = Math.min(high, Math.max(low, snap(from + offset)));
    return { start: Math.min(a, b), end: Math.max(a, b) };
  }
  const gap = getCameraGap(camera, from, shotId) ?? { start: from, end: to };
  const low = Math.max(0, gap.start), high = Math.min(86400, gap.end);
  if (mode === "move") {
    const length = to - from, raw = from + offset, owner = "shot:" + (shotId ?? "");
    const byStart = snap(raw, owner), byEnd = snap(raw + length, owner) - length;
    const chosen = Math.abs(byEnd - raw) < Math.abs(byStart - raw) ? byEnd : byStart;
    const start = Math.max(low, Math.min(Math.max(low, high - length), chosen));
    return { start, end: start + length };
  }
  // 拉两端时最短0.3秒；本来就更短的旧镜头段只能拉长。
  if (mode === "start") return { start: Math.max(low, Math.min(to - minDragShot, snap(from + offset, "shot:" + shotId))), end: to };
  return { start: from, end: Math.min(high, Math.max(from + minDragShot, snap(to + offset, "shot:" + shotId))) };
}
function laneTime(clientX: number) {
  const area = scroll.value;
  return area ? origin.value + (clientX - area.getBoundingClientRect().left + area.scrollLeft - 150) / scale.value - filmStart.value : 0;
}
// ACT: 在机位轨道空白处拖动框出一段时间就是新镜头段；单击只选中机位并把播放头放到那一刻。
function beginLane(event: PointerEvent, row: CameraRow) {
  if (props.disabled || event.button !== 0 || !event.isPrimary || interacting.value) return;
  if (event.shiftKey || event.ctrlKey || event.metaKey) { beginMarquee(event); return; }
  if (tool.value === "razor") {
    const time = laneTime(event.clientX), shot = row.shots.find(value => time > value.start && time < value.end);
    event.preventDefault(); event.stopPropagation();
    if (shot) splitShotAt(row, shot, snapFilm(time, "shot:" + shot.id));
    return;
  }
  clearPicks();
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).querySelector<HTMLElement>(".cameraStrip")?.focus({ preventScroll: true });
  const time = laneTime(event.clientX), from = Math.max(0, time);
  // 按在镜头段上下的空白里也算点中那一段。
  const inside = row.shots.find(shot => time >= shot.start && time < shot.end);
  if (inside) { if (props.selectedCameraId !== row.id || props.selectedShotId !== inside.id) emit("selectCamera", row.id, inside.id); return; }
  shotDrag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, key: row.key, id: row.id, mode: "create", from, to: from, delta: 0 };
  root.value?.setPointerCapture(event.pointerId);
}
function beginShot(event: PointerEvent, row: CameraRow, shot: CameraShot) {
  if (pickBlock(event, "shot:" + row.id + ":" + shot.id, () => splitShotAt(row, shot, snapFilm(laneTime(event.clientX), "shot:" + shot.id)))) return;
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  const edge = (event.target as HTMLElement).closest<HTMLElement>("[data-edge]")?.dataset.edge;
  if (props.selectedCameraId !== row.id || props.selectedShotId !== shot.id) emit("selectCamera", row.id, shot.id);
  shotDrag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, key: row.key, id: row.id, mode: edge === "start" || edge === "end" ? edge : "move", shotId: shot.id, from: shot.start, to: shot.end, delta: 0 };
  root.value?.setPointerCapture(event.pointerId);
}
function finishShot(pointer: number) {
  const current = shotDrag.value;
  if (!current) return;
  const offset = dragOffset(current);
  const moved = Math.abs(offset * current.scale) > 3;
  const camera = cameraMap.value.get(current.id);
  const target = camera && shotTarget(camera, current.mode, current.from, current.to, offset, current.shotId);
  shotDrag.value = undefined;
  release(pointer);
  if (props.disabled || !camera) return;
  if (current.mode === "create") {
    if (!moved || !target || target.end - target.start < minDragShot - 0.000001) {
      emit("selectCamera", current.id);
      emit("seek", filmStart.value + Math.max(0, Math.min(filmLength.value, snap(current.from, "playhead"))), "end");
      return;
    }
    if ((camera.shots?.length ?? 0) >= maxShots) { error.value = `一个机位最多${maxShots}个镜头段`; return; }
    error.value = "";
    emit("createShot", current.id, target.start, target.end);
    return;
  }
  if (!moved || !target || !current.shotId || Math.abs(target.start - current.from) <= 0.000001 && Math.abs(target.end - current.to) <= 0.000001) return;
  error.value = "";
  emit("changeShot", current.id, current.shotId, target.start, target.end);
}
function nudgeShot(event: KeyboardEvent, row: CameraRow, shot: CameraShot) {
  if (props.disabled || interacting.value || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const target = shotTarget(row.camera, "move", shot.start, shot.end, (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1), shot.id);
  if (target && Math.abs(target.start - shot.start) > 0.000001) emit("changeShot", row.id, shot.id, target.start, target.end);
}
function keyboardCamera(event: MouseEvent, row: CameraRow, shotId?: string) { if (!props.disabled && event.detail === 0) emit("selectCamera", row.id, shotId); }
function dragOffset(current: { delta: number; scroll: number; scale: number }) { return current.delta + (scrollX.value - current.scroll) / current.scale; }
function clampSeek(seconds: number) { return Math.max(playbackRange.value.start, Math.min(playbackRange.value.end, Number.isFinite(seconds) ? seconds : playbackRange.value.start)); }
function pointerTime(clientX: number) {
  const area = scroll.value;
  if (!area) return clampSeek(playhead.value);
  const raw = origin.value + (clientX - area.getBoundingClientRect().left + area.scrollLeft - 150) / scale.value;
  // 拖播放头时也贴到镜头段与片段边缘，方便对齐剪辑点。
  return clampSeek(filmStart.value + snapFilm(raw - filmStart.value, "playhead", false));
}
function revealTime(seconds: number) {
  const area = scroll.value;
  if (!area) return;
  const left = (seconds - origin.value) * scale.value;
  if (left < area.scrollLeft || left > area.scrollLeft + area.clientWidth - 150) area.scrollLeft = Math.max(0, left - 80);
  measure();
}
function seekTo(seconds: number) {
  if (props.disabled || interacting.value) return;
  const position = clampSeek(seconds);
  emit("seek", position, "end");
  revealTime(position);
}
function seekKey(event: KeyboardEvent) {
  if (event.key === " ") { event.preventDefault(); event.stopPropagation(); if (!props.disabled && !interacting.value && !event.repeat) emit("togglePlayback"); return; }
  if (!['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  seekTo(event.key === "Home" ? playbackRange.value.start : event.key === "End" ? playbackRange.value.end : playhead.value + (event.key === "ArrowLeft" ? -1 : 1));
}
function beginSeek(event: PointerEvent) {
  if (props.disabled || interacting.value || event.button !== 0 || !event.isPrimary || (event.target as HTMLElement).closest('.rulerLabel')) return;
  event.preventDefault(); event.stopPropagation();
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  const position = pointerTime(event.clientX);
  seekDrag.value = { pointer: event.pointerId, before: props.worldSeconds, position };
  root.value?.setPointerCapture(event.pointerId);
  emit("seek", position, "start");
}
// ACT: 剪辑操作：空白处拖动是框选（机位轨道上按住Shift，因为那里直接拖是框出新镜头段）；Ctrl/Shift点选加减；拖动选中的任一块整组一起移动；
// 切割工具下点镜头段或片段就在那里切开，Ctrl+B在播放头处切开所选。中键拖动平移时间轴。
const tool = ref<"select" | "razor">("select");
const picked = ref<Set<string>>(new Set());
const marquee = shallowRef<{ pointer: number; x0: number; y0: number; x1: number; y1: number; additive: boolean; base: Set<string> }>();
const groupDrag = shallowRef<{ pointer: number; x: number; scroll: number; scale: number; delta: number; items: TimelineItem[]; lead: number }>();
const razorX = ref<number | null>(null);
const groupShift = computed(() => { const current = groupDrag.value; return current ? groupDelta(current) * scale.value : 0; });
/** 选中各块最早的开始时刻（成片秒），成组拖动时用它吸附。 */
function itemsLead(items: TimelineItem[]) {
  let lead = Infinity;
  for (const item of items) {
    if (item.kind === "shot") { const shot = cameraMap.value.get(item.owner)?.shots?.find(value => value.id === item.id); if (shot) lead = Math.min(lead, shot.start); }
    else { const row = trackRows.value.find(value => value.id === item.owner); const block = row?.blocks.find(value => value.clip.id === item.id); if (row && block) lead = Math.min(lead, row.start + block.offset - filmStart.value); }
  }
  return Number.isFinite(lead) ? lead : 0;
}
/** 成组拖动的实际位移：最早的开始时刻吸附到镜头段、片段边缘或播放头，再夹进允许范围。 */
function groupDelta(current: { delta: number; scroll: number; scale: number; items: TimelineItem[]; lead: number }) {
  const raw = dragOffset(current);
  return clampGroupDelta(current.items, snapFilm(current.lead + raw, "group") - current.lead);
}
const marqueeStyle = computed(() => { const box = marquee.value; return box ? { left: `${Math.min(box.x0, box.x1)}px`, top: `${Math.min(box.y0, box.y1)}px`, width: `${Math.abs(box.x1 - box.x0)}px`, height: `${Math.abs(box.y1 - box.y0)}px` } : undefined; });
function itemOf(key: string): TimelineItem | undefined {
  const [kind, owner, id] = key.split(":");
  return (kind === "shot" || kind === "clip") && owner && id ? { kind, owner, id } : undefined;
}
function pickedItems() { return [...picked.value].map(itemOf).filter((item): item is TimelineItem => !!item && itemExists(item)); }
function itemExists(item: TimelineItem) {
  return item.kind === "shot" ? !!cameraMap.value.get(item.owner)?.shots?.some(shot => shot.id === item.id) : !!trackRows.value.find(row => row.id === item.owner)?.blocks.some(block => block.clip.id === item.id);
}
function clearPicks() { if (picked.value.size) picked.value = new Set(); }
function togglePick(key: string) { const next = new Set(picked.value); if (next.has(key)) next.delete(key); else next.add(key); picked.value = next; }
function toggleRazor() { tool.value = tool.value === "razor" ? "select" : "razor"; razorX.value = null; }
function contentPoint(event: PointerEvent) {
  const area = scroll.value!;
  const rect = area.getBoundingClientRect();
  return { x: event.clientX - rect.left + area.scrollLeft, y: event.clientY - rect.top + area.scrollTop };
}
function hoverRazor(event: PointerEvent) {
  if (tool.value !== "razor" || !scroll.value || interacting.value) return;
  const point = contentPoint(event);
  razorX.value = point.x > 150 ? 150 + filmX(snapFilm(laneTime(event.clientX))) : null;
}
function beginMarquee(event: PointerEvent) {
  if (!scroll.value) return;
  event.preventDefault(); event.stopPropagation();
  const point = contentPoint(event);
  const additive = event.ctrlKey || event.metaKey || event.shiftKey;
  marquee.value = { pointer: event.pointerId, x0: point.x, y0: point.y, x1: point.x, y1: point.y, additive, base: additive ? new Set(picked.value) : new Set() };
  root.value?.setPointerCapture(event.pointerId);
}
function updateMarquee(event: PointerEvent) {
  const box = marquee.value, area = scroll.value;
  if (!box || !area) return;
  const point = contentPoint(event);
  marquee.value = { ...box, x1: point.x, y1: point.y };
  const rect = area.getBoundingClientRect();
  const left = rect.left - area.scrollLeft + Math.min(box.x0, point.x), right = rect.left - area.scrollLeft + Math.max(box.x0, point.x);
  const top = rect.top - area.scrollTop + Math.min(box.y0, point.y), bottom = rect.top - area.scrollTop + Math.max(box.y0, point.y);
  const next = new Set(box.base);
  for (const element of area.querySelectorAll<HTMLElement>("[data-item]")) {
    const item = element.getBoundingClientRect();
    if (item.right >= left && item.left <= right && item.bottom >= top && item.top <= bottom) next.add(element.dataset.item!);
  }
  picked.value = next;
}
/** 成组移动能挪多远：不能挪到0秒之前，镜头段不能压到同一机位上没选中的镜头段。 */
function clampGroupDelta(items: TimelineItem[], delta: number) {
  let low = -Infinity, high = Infinity;
  for (const item of items) {
    if (item.kind === "shot") {
      const shots = cameraMap.value.get(item.owner)?.shots ?? [];
      const shot = shots.find(value => value.id === item.id);
      if (!shot) continue;
      low = Math.max(low, -shot.start);
      for (const other of shots) {
        if (items.some(value => value.kind === "shot" && value.owner === item.owner && value.id === other.id)) continue;
        if (other.end <= shot.start + 1e-6) low = Math.max(low, other.end - shot.start);
        if (other.start >= shot.end - 1e-6) high = Math.min(high, other.start - shot.end);
      }
    } else {
      const block = trackRows.value.find(row => row.id === item.owner)?.blocks.find(value => value.clip.id === item.id);
      if (block && !block.clip.trigger) low = Math.max(low, -block.clip.start);
    }
  }
  return Math.min(high, Math.max(low, delta));
}
function beginGroupDrag(event: PointerEvent) {
  event.preventDefault(); event.stopPropagation();
  const items = pickedItems();
  groupDrag.value = { pointer: event.pointerId, x: event.clientX, scroll: scroll.value?.scrollLeft ?? scrollX.value, scale: scale.value, delta: 0, items, lead: itemsLead(items) };
  root.value?.setPointerCapture(event.pointerId);
}
/** 点在一块上：处理切割、Ctrl/Shift加减选、拖动整组；返回true表示已处理，不再走单块拖动。 */
function pickBlock(event: PointerEvent, key: string, split: () => void) {
  if (props.disabled || event.button !== 0 || !event.isPrimary || interacting.value) return true;
  if (tool.value === "razor") { event.preventDefault(); event.stopPropagation(); split(); return true; }
  if (event.ctrlKey || event.metaKey || event.shiftKey) { event.preventDefault(); event.stopPropagation(); togglePick(key); return true; }
  if (picked.value.has(key) && picked.value.size > 1) { beginGroupDrag(event); return true; }
  picked.value = new Set([key]);
  return false;
}
function splitShotAt(row: CameraRow, shot: CameraShot, time: number) {
  if (time <= shot.start + 0.2 - 1e-6 || time >= shot.end - 0.2 + 1e-6) { error.value = "切点离镜头段两端太近"; return; }
  error.value = "";
  emit("splitShot", row.id, shot.id, Math.round(time * 1000) / 1000);
}
function splitClipAt(row: TrackRow, block: Block, filmTime: number) {
  const blockFilm = row.start + block.offset - filmStart.value;
  const local = filmTime - blockFilm;
  if (local <= 0.05 || local >= block.seconds - 0.05) { error.value = "切点离片段两端太近"; return; }
  error.value = "";
  emit("splitClip", row.id, block.clip.id, Math.round((block.clip.start + local) * 1000) / 1000);
}
/** Ctrl+B：在播放头处切开所选的镜头段与片段（没有框选时切当前选中的那一块）。 */
function splitAtPlayhead() {
  const time = playhead.value - filmStart.value;
  const items = picked.value.size ? pickedItems() : [
    ...(props.selectedCameraId && props.selectedShotId ? [{ kind: "shot" as const, owner: props.selectedCameraId, id: props.selectedShotId }] : []),
    ...(selectedClipBlock.value ? [{ kind: "clip" as const, owner: selectedClipBlock.value.row.id, id: selectedClipBlock.value.block.clip.id }] : []),
  ];
  let done = 0;
  for (const item of items) {
    if (item.kind === "shot") {
      const row = rows.value.find((value): value is CameraRow => value.kind === "camera" && value.id === item.owner);
      const shot = row?.shots.find(value => value.id === item.id);
      if (row && shot && time > shot.start + 0.2 && time < shot.end - 0.2) { emit("splitShot", row.id, shot.id, Math.round(time * 1000) / 1000); done++; }
    } else {
      const row = trackRows.value.find(value => value.id === item.owner);
      const block = row?.blocks.find(value => value.clip.id === item.id);
      if (row && block) { const local = time - (row.start + block.offset - filmStart.value); if (local > 0.05 && local < block.seconds - 0.05) { emit("splitClip", row.id, block.clip.id, Math.round((block.clip.start + local) * 1000) / 1000); done++; } }
    }
  }
  error.value = done || !items.length ? "" : "播放头不在所选的镜头段或片段中间";
}
function editKey(event: KeyboardEvent) {
  const target = event.target instanceof Element ? event.target : null;
  if (props.disabled || props.collapsed || target?.closest("input,textarea,[contenteditable]")) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") { event.preventDefault(); event.stopPropagation(); splitAtPlayhead(); return; }
  if (event.key === "Escape" && (tool.value === "razor" || picked.value.size)) { tool.value = "select"; razorX.value = null; clearPicks(); return; }
  if ((event.key === "Delete" || event.key === "Backspace") && picked.value.size > 1) { event.preventDefault(); event.stopPropagation(); deleteSelection(); return; }
  // Ctrl+D 复制所选，接在所选之后；多选时左右键整组微移（Shift 一秒）。
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d" && (picked.value.size || props.selectedShotId || selectedClipBlock.value)) {
    event.preventDefault(); event.stopPropagation();
    const items = picked.value.size ? pickedItems() : [
      ...(props.selectedCameraId && props.selectedShotId ? [{ kind: "shot" as const, owner: props.selectedCameraId, id: props.selectedShotId }] : []),
      ...(selectedClipBlock.value ? [{ kind: "clip" as const, owner: selectedClipBlock.value.row.id, id: selectedClipBlock.value.block.clip.id }] : []),
    ];
    if (items.length) emit("duplicateItems", items);
    return;
  }
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && picked.value.size > 1 && !interacting.value) {
    event.preventDefault(); event.stopPropagation();
    const items = pickedItems();
    const delta = Math.round(clampGroupDelta(items, (event.key === "ArrowRight" ? 1 : -1) * (event.shiftKey ? 1 : 0.1)) * 1000) / 1000;
    if (delta) emit("moveItems", items, delta);
  }
}
// 空白处：中键拖动平移；左键拖动框选。
function beginEmpty(event: PointerEvent) {
  const area = scroll.value;
  if (!area || interacting.value || !event.isPrimary) return;
  if (event.button === 0 && !(event.target as HTMLElement).closest("button,input,.timelineRuler,.rowHeader")) {
    const rect = area.getBoundingClientRect();
    if (event.clientX >= rect.left + area.clientWidth || event.clientY >= rect.top + area.clientHeight) return;
    if (!(event.ctrlKey || event.metaKey || event.shiftKey)) clearPicks();
    beginMarquee(event);
    return;
  }
  beginPan(event);
}
function beginPan(event: PointerEvent) {
  const area = scroll.value;
  if (!area || interacting.value || !event.isPrimary || event.button !== 1) return;
  const rect = area.getBoundingClientRect();
  if (event.clientX >= rect.left + area.clientWidth || event.clientY >= rect.top + area.clientHeight) return;
  event.preventDefault(); event.stopPropagation();
  pan.value = { pointer: event.pointerId, x: event.clientX, scroll: area.scrollLeft };
  root.value?.setPointerCapture(event.pointerId);
}
function zoomBy(factor: number, clientX?: number) {
  const area = scroll.value;
  if (!area || interacting.value || props.collapsed) return;
  const next = Math.min(maxScale.value, Math.max(minZoom, scale.value * factor));
  if (next === scale.value) return;
  const lane = Math.max(0, area.clientWidth - 150);
  const x = clientX === undefined ? needleLeft.value - area.scrollLeft - 150 : clientX - area.getBoundingClientRect().left - 150;
  zoomOffset = x < 0 || x > lane ? lane / 2 : x;
  scrollX.value = area.scrollLeft;
  zoom.value = next;
}
function wheel(event: WheelEvent) {
  const area = scroll.value;
  if (!area || !(event.ctrlKey || event.metaKey || event.shiftKey)) return;
  event.preventDefault();
  if (props.collapsed || interacting.value) return;
  const delta = (Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? area.clientWidth : 1);
  if (event.ctrlKey || event.metaKey) zoomBy(2 ** (-Math.max(-200, Math.min(200, delta)) / 200), event.clientX);
  else { area.scrollLeft += delta; measure(); }
}
function previewSeek() {
  seekFrame = undefined;
  const current = seekDrag.value;
  if (!current) return;
  const position = pointerTime(seekClientX);
  if (position === current.position) return;
  seekDrag.value = { ...current, position };
  emit("seek", position, "move");
}
function clearSeekFrame() {
  if (seekFrame !== undefined) cancelAnimationFrame(seekFrame);
  seekFrame = undefined;
}
function move(event: PointerEvent) {
  if (!Number.isFinite(event.clientX)) return;
  snapBypass = event.altKey;
  if (marquee.value?.pointer === event.pointerId) { event.preventDefault(); updateMarquee(event); return; }
  if (groupDrag.value?.pointer === event.pointerId) { event.preventDefault(); groupDrag.value = { ...groupDrag.value, delta: (event.clientX - groupDrag.value.x) / groupDrag.value.scale }; return; }
  if (anchorDrag.value?.pointer === event.pointerId) {
    event.preventDefault();
    anchorDrag.value = { ...anchorDrag.value, delta: (event.clientX - anchorDrag.value.x) / anchorDrag.value.scale };
    return;
  }
  if (shotDrag.value?.pointer === event.pointerId) {
    event.preventDefault();
    shotDrag.value = { ...shotDrag.value, delta: (event.clientX - shotDrag.value.x) / shotDrag.value.scale };
    return;
  }
  if (keyDrag.value?.pointer === event.pointerId) {
    event.preventDefault();
    keyDrag.value = { ...keyDrag.value, delta: (event.clientX - keyDrag.value.x) / keyDrag.value.scale };
    return;
  }
  if (seekDrag.value?.pointer === event.pointerId) {
    event.preventDefault();
    seekClientX = event.clientX;
    seekFrame ??= requestAnimationFrame(previewSeek);
    return;
  }
  if (pan.value?.pointer === event.pointerId && scroll.value) {
    event.preventDefault();
    scroll.value.scrollLeft = pan.value.scroll + pan.value.x - event.clientX;
    measure();
    return;
  }
  const current = drag.value;
  if (!current || current.pointer !== event.pointerId) return;
  event.preventDefault();
  drag.value = { ...current, delta: (event.clientX - current.x) / current.scale };
}
function release(pointer: number) { if (root.value?.hasPointerCapture(pointer)) root.value.releasePointerCapture(pointer); }
function cancel() {
  clearSeekFrame();
  const seeking = seekDrag.value;
  const pointer = (drag.value ?? shotDrag.value ?? keyDrag.value ?? anchorDrag.value ?? seeking ?? pan.value ?? marquee.value ?? groupDrag.value)?.pointer;
  drag.value = undefined; shotDrag.value = undefined; keyDrag.value = undefined; anchorDrag.value = undefined; seekDrag.value = undefined; pan.value = undefined; marquee.value = undefined; groupDrag.value = undefined;
  if (pointer !== undefined) release(pointer);
  if (seeking) emit("seek", seeking.before, "cancel");
}
function finish(event: PointerEvent) {
  if (marquee.value?.pointer === event.pointerId) { updateMarquee(event); marquee.value = undefined; release(event.pointerId); return; }
  if (groupDrag.value?.pointer === event.pointerId) {
    move(event);
    const current = groupDrag.value;
    const delta = Math.round(groupDelta(current) * 1000) / 1000;
    groupDrag.value = undefined;
    release(event.pointerId);
    if (Math.abs(delta * current.scale) > 3 && current.items.length) { error.value = ""; emit("moveItems", current.items, delta); }
    return;
  }
  if (seekDrag.value?.pointer === event.pointerId && event.button === 0) {
    clearSeekFrame();
    const position = pointerTime(event.clientX);
    seekDrag.value = undefined;
    release(event.pointerId);
    emit("seek", position, "end");
    revealTime(position);
    return;
  }
  if (pan.value?.pointer === event.pointerId) { move(event); pan.value = undefined; release(event.pointerId); return; }
  if (anchorDrag.value?.pointer === event.pointerId && event.button === 0) {
    move(event);
    const current = anchorDrag.value;
    const delta = dragOffset(current);
    anchorDrag.value = undefined;
    release(event.pointerId);
    if (Math.abs(delta * current.scale) > 3) {
      const patch = anchorPatchFor(current.row, current.index, delta);
      const parsed = performanceTrackSchema.safeParse({ ...current.row.track, ...patch });
      if (!parsed.success) error.value = parsed.error.issues[0]?.message ?? "锚点时间设置无效";
      else { error.value = ""; emit("change", current.row.id, patch); }
    } else emit("select", current.row.id, current.index);
    return;
  }
  if (shotDrag.value?.pointer === event.pointerId && event.button === 0) { move(event); measure(); finishShot(event.pointerId); return; }
  if (keyDrag.value?.pointer === event.pointerId && event.button === 0) { move(event); finishShotKey(event); return; }
  if (!drag.value || drag.value.pointer !== event.pointerId || event.button !== 0) return;
  move(event);
  measure();
  const current = drag.value;
  const delta = dragOffset(current);
  cancel();
  if (Math.abs(delta * current.scale) > 3) commit(current.row, current.block, delta);
  else if (!props.disabled) { if (current.block) emit("selectClip", current.row.id, current.block.clip.id); else selectRow(current.row, current.index); }
}
function cancelInteractionKey(event: KeyboardEvent) {
  if (!interacting.value) return;
  const undo = (event.ctrlKey || event.metaKey) && ["z", "y"].includes(event.key.toLowerCase());
  if (event.key !== "Escape" && event.code !== "Escape" && !undo) return;
  event.preventDefault();
  event.stopPropagation();
  cancel();
}
function nudge(event: KeyboardEvent, row: TrackRow, block?: Block) { if (props.disabled || interacting.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); event.stopPropagation(); commit(row, block, event.key === "ArrowRight" ? 1 : -1); }
function selectRow(row: Row, index?: number) { if (row.kind === "camera") emit("selectCamera", row.id); else if (row.kind === "track") emit("select", row.id, index); }
function keyboardSelect(event: MouseEvent, row: TrackRow, index?: number, clipId?: string) {
  if (props.disabled || event.detail !== 0) return;
  if (clipId) { emit("selectClip", row.id, clipId); return; }
  selectRow(row, index);
}
function remove(row: Row) { if (row.kind === "camera") emit("removeCamera", row.id); else if (row.kind === "track") emit("remove", row.id); else if (row.kind === "folder") removeFolder(row.id); }
function removeRow(event: KeyboardEvent, row: Row) {
  if (event.key !== "Delete" || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.repeat || props.disabled || interacting.value || row.kind === "program") return;
  if (row.kind === "folder") { removeFolder(row.id); return; }
  if (row.kind === "camera") {
    // 选着关键点先删关键点；焦点在镜头段上删那一段；否则有选中的镜头段删镜头段，没有才删整个机位。
    if (props.selectedShotKey && props.selectedCameraId === row.id && selectedShot.value?.keys?.some(key => key.id === props.selectedShotKey)) { emit("removeShotKey"); return; }
    const shotId = (event.target as HTMLElement).closest<HTMLElement>("[data-shot]")?.dataset.shot || (props.selectedCameraId === row.id ? props.selectedShotId : "");
    if (shotId && row.shots.some(shot => shot.id === shotId)) emit("removeShot", row.id, shotId); else emit("removeCamera", row.id);
    return;
  }
  if (props.selectedTrackId === row.id && props.selectedClipId) emit("removeClip", row.id, props.selectedClipId); else remove(row);
}
</script>

<style scoped lang="scss">
// 分好镜还没导出过：导出按钮轻轻呼吸，提示下一步可以导出预演小样、镜头表。
.scriptSpeakers { display: block; margin: 2px 0 4px; color: var(--el-text-color-secondary); font-size: 11px; }
.lineFix { color: #b7791f !important; font-weight: 600; white-space: nowrap; }
.exportHint { animation: exportHint 1.6s ease-in-out infinite; }
@keyframes exportHint { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-primary) 0%, transparent); } 50% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 30%, transparent); color: var(--el-color-primary); } }
@media (prefers-reduced-motion: reduce) { .exportHint { animation: none; color: var(--el-color-primary); } }
.coverageMore { min-width: 0 !important; width: 16px !important; padding: 0 !important; margin-left: -6px; }
.performanceTimeline {
  container: performanceTimeline / inline-size;
  position: relative; display: flex; flex-direction: column; height: 214px; overflow: hidden; color: var(--el-text-color-primary); font: inherit; font-size: 12px; &.collapsed { height: 44px; }
  .muteToggle { display: grid; place-items: center; flex-shrink: 0; width: 24px; height: 24px; padding: 0; color: var(--el-text-color-secondary); opacity: 0; &.muted { opacity: 1; color: var(--el-color-warning); } }
  .timelineRow:hover .muteToggle, .timelineRow.selected .muteToggle, .muteToggle:focus-visible { opacity: 1; }
  .marquee { position: absolute; z-index: 6; border: 1px solid var(--el-color-primary); border-radius: 3px; background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); pointer-events: none; }
  .razorLine { position: absolute; z-index: 6; top: 0; bottom: 0; width: 0; margin-left: -1px; border-left: 2px dashed var(--el-color-danger); pointer-events: none; }
  &.razor .timelineScroll { cursor: crosshair; .shotBlock, .timelineBlock, .rowLane { cursor: crosshair; } }
  &.multiPick .shotBlock.picked, &.multiPick .timelineBlock.picked { outline: 2px solid var(--el-color-primary); outline-offset: 1px; }
  &.groupMoving .picked { transform: translateX(var(--groupShift)); opacity: 0.85; }
  .toolToggle.active { color: var(--studioActiveText, var(--el-color-primary)); background: var(--studioActiveBackground, color-mix(in srgb, var(--el-color-primary) 14%, transparent)); }
  .resizeGrip { position: absolute; z-index: 8; top: 0; left: 0; right: 0; height: 6px; cursor: ns-resize; touch-action: none;
    &::after { content: ""; position: absolute; top: 2px; left: 50%; width: 36px; height: 3px; margin-left: -18px; border-radius: 2px; background: var(--el-border-color); opacity: 0; transition: opacity 140ms ease; }
  }
  &:hover .resizeGrip::after, &.resizing .resizeGrip::after { opacity: 1; }
  &.resizing { user-select: none; }
  * { box-sizing: border-box; }
  button { font: inherit; color: inherit; border: 0; border-radius: 6px; background: transparent; cursor: pointer; transition: background-color 140ms ease, color 140ms ease, box-shadow 140ms ease, transform 120ms ease, filter 140ms ease; &:hover:not(:disabled) { background: var(--studioHoverBackground); } &:disabled { opacity: 0.45; cursor: default; } }
  button, input, .timelineRuler { &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; } }
  .timelineHeader {
    display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px; white-space: nowrap;
    button { display: inline-flex; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; min-width: 30px; height: 30px; padding: 0 7px; &:active:not(:disabled) { background: var(--studioPressedBackground); transform: scale(0.94); } }
    .headerDivider { flex-shrink: 0; width: 1px; height: 18px; background: var(--el-border-color-lighter); }
    .editTools, .zoomGroup { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
    .editTools .deleteAction:hover:not(:disabled) { color: var(--el-color-danger); }
    .snapToggle.active { color: var(--studioActiveText); background: var(--studioActiveBackground); }
    .timelineError { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--el-color-danger); }
    .zoomGroup { margin-inline-start: auto; }
    .collapseAction svg { transition: transform 180ms cubic-bezier(0.2, 0, 0, 1); }
  }
  &.collapsed .collapseAction { margin-inline-start: auto; svg { transform: rotate(180deg); } }
  .timelineScroll { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--el-border-color) transparent; }
  .timelineContent { position: relative; min-height: 100%; }
  .timelineRuler {
    position: sticky; top: 0; z-index: 4; height: 26px; background: var(--studioGlassBackground); border-bottom: 1px solid var(--el-border-color-lighter); cursor: ew-resize; touch-action: none; user-select: none;
    time { position: absolute; top: 0; bottom: 0; padding: 4px 0 0 5px; border-left: 1px solid var(--el-border-color); color: var(--el-text-color-secondary); font-size: 11px; line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; }
    .filmBand { position: absolute; bottom: 0; height: 2px; border-radius: 1px; background: color-mix(in srgb, var(--el-color-primary) 60%, transparent); pointer-events: none; }
    .rulerMinor { position: absolute; bottom: 0; height: 5px; background-image: linear-gradient(to right, var(--el-border-color) 1px, transparent 1px); background-size: var(--minor) 100%; pointer-events: none; }
    .rulerLabel { position: sticky; left: 0; z-index: 1; display: block; width: 150px; height: 25px; background: var(--el-bg-color-overlay); }
  }
  .timelineRows { position: relative; cursor: grab; touch-action: pan-y; }
  .timelineRow {
    position: absolute; width: 100%; height: 34px; border-bottom: 1px solid var(--el-border-color-lighter); transition: background-color 140ms ease;
    &.selected { background: var(--studioActiveBackground); .rowHeader { background: linear-gradient(var(--studioActiveBackground) 0 0), var(--el-bg-color-overlay); box-shadow: inset 3px 0 0 var(--trackColor); } .rowName { font-weight: 600; } }
    &.stopped .rowLane { opacity: 0.45; }
    &.lastCamera { border-bottom-color: var(--el-border-color); }
    .rowHeader {
      position: sticky; left: 0; z-index: 3; display: flex; align-items: center; width: 150px; height: 33px; background: var(--el-bg-color-overlay);
      .rowName { flex: 1; min-width: 0; height: 100%; padding: 4px 10px; border-radius: 0; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; i { display: inline-block; width: 6px; height: 6px; margin-right: 7px; border-radius: 50%; background: var(--trackColor); } svg { display: inline-block; margin-right: 6px; vertical-align: -3px; color: var(--trackColor); } }
      .removeTrack { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; color: var(--el-text-color-regular); &:hover:not(:disabled) { color: var(--el-color-danger); } }
    }
    .rowLane { position: absolute; z-index: 0; inset: 0 0 0 150px; }
    .startHandle { position: absolute; z-index: 2; top: 2px; width: 9px; height: 30px; padding: 0; transform: translateX(-6px); border-left: 2px solid var(--trackColor); border-radius: 0; cursor: ew-resize; touch-action: none; }
    .routeAnchor { position: absolute; z-index: 4; top: 5px; width: 16px; height: 24px; padding: 0; transform: translateX(-8px); border: 0; background: transparent; border-radius: 0; cursor: ew-resize; touch-action: none; &.first { pointer-events: none; opacity: 0.75; } &.teleport::before { border-style: dashed; } &::before { content: ""; display: block; width: 9px; height: 9px; margin: 0 auto; border: 2px solid var(--trackColor); border-radius: 2px; background: var(--el-bg-color-overlay); transform: rotate(45deg); } &:hover:not(:disabled)::before { border-color: var(--el-color-primary); } &.active::before { background: var(--trackColor); border-color: var(--el-bg-color-overlay); box-shadow: 0 0 0 2px var(--trackColor); } }
    .timelineBlock {
      position: absolute; top: 6px; display: flex; align-items: center; height: 22px; min-width: 8px; padding: 0 7px; border-radius: 6px; background: color-mix(in srgb, var(--trackColor) 28%, var(--el-bg-color-overlay)); cursor: pointer; touch-action: none;
      > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      &:hover:not(:disabled) { background: color-mix(in srgb, var(--trackColor) 40%, var(--el-bg-color-overlay)); }
      &.eventBlock { z-index: 1; background: var(--studioControlBackground); border: 1px solid var(--trackColor); }
      &.approximate { border-bottom: 1px dashed var(--trackColor); }
      &.active { outline: 1px solid var(--trackColor); outline-offset: 1px; }
      &.clipStopped { opacity: 0.4; text-decoration: line-through; }
    }
    .cameraLane { cursor: crosshair; }
    &.inFolder .rowHeader { padding-left: 14px; &::before { content: ""; position: absolute; left: 9px; top: 0; bottom: 0; width: 1px; background: var(--el-border-color); } }
    &.dropTarget .rowHeader { box-shadow: inset 0 0 0 2px var(--el-color-primary); }
    &.folderRow { background: color-mix(in srgb, var(--el-fill-color) 40%, transparent);
      .rowHeader { gap: 0; background: linear-gradient(color-mix(in srgb, var(--el-fill-color) 40%, transparent) 0 0), var(--el-bg-color-overlay); }
      .rowName { padding-left: 2px; font-weight: 600; svg { color: var(--el-text-color-secondary); } small { margin-left: 6px; padding: 0 5px; border-radius: 8px; background: var(--studioControlBackground); color: var(--el-text-color-secondary); font-size: 10px; font-weight: 400; } }
      .removeTrack { opacity: 0; } &:hover .removeTrack { opacity: 1; }
    }
    .folderToggle { flex-shrink: 0; display: grid; place-items: center; width: 22px; height: 26px; padding: 0; margin-left: 4px; color: var(--el-text-color-secondary); svg { transition: transform 160ms cubic-bezier(0.2, 0, 0, 1); } &[aria-expanded="true"] svg { transform: rotate(90deg); } }
    .folderName { flex: 1; min-width: 0; height: 24px; margin-right: 4px; padding: 0 6px; border: 1px solid var(--el-color-primary); border-radius: 5px; background: var(--el-bg-color-overlay); color: inherit; font: inherit; font-weight: 600; }
    .folderSpan { position: absolute; top: 13px; height: 8px; border-radius: 4px; background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--el-text-color-secondary) 30%, transparent) 0 4px, color-mix(in srgb, var(--el-text-color-secondary) 14%, transparent) 4px 8px); }
    &.programRow:has(.programMenu) { z-index: 6; }
    &.programRow { border-bottom-color: var(--el-border-color);
      .programName { display: flex; align-items: center; gap: 6px; padding: 4px 10px; color: var(--el-text-color-secondary); font-weight: 600; cursor: default; svg { margin: 0; color: var(--el-color-danger); } }
    }
    .programLane { cursor: default; }
    .cutNumber { margin-right: 4px; font-weight: 700; font-variant-numeric: tabular-nums; &.axisWarning { color: #ffd84d; } }
    .cutBlock { position: absolute; top: 8px; display: flex; align-items: center; height: 18px; min-width: 3px; padding: 0 6px; overflow: hidden; border-radius: 4px; border-left: 2px solid rgb(255 255 255 / 0.85); background: color-mix(in srgb, var(--cutColor) 78%, var(--el-bg-color-overlay)); color: #fff; font-size: 10px; font-weight: 600; white-space: nowrap;
      > span { overflow: hidden; text-overflow: ellipsis; }
      &:hover:not(:disabled) { background: var(--cutColor); }
      &.active { box-shadow: 0 0 0 1.5px var(--el-bg-color-overlay), 0 0 0 3px var(--cutColor); }
      .cutStack { flex-shrink: 0; display: grid; place-items: center; min-width: 14px; height: 12px; margin-left: 4px; padding: 0 3px; border-radius: 6px; background: rgb(255 255 255 / 0.9); color: var(--cutColor); font-size: 9px; }
    }
    .programMenu { position: absolute; z-index: 6; top: 28px; display: grid; gap: 2px; min-width: 120px; padding: 4px; border-radius: 8px; background: var(--el-bg-color-overlay); box-shadow: var(--el-box-shadow-light);
      > button { display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 8px; font-size: 12px; text-align: left; white-space: nowrap;
        > i { width: 8px; height: 8px; border-radius: 50%; background: var(--cutColor); }
        &.active { font-weight: 600; background: color-mix(in srgb, var(--cutColor) 16%, transparent); }
      }
    }
    .cameraStrip {
      position: absolute; top: 11px; height: 12px; min-width: 0; padding: 0; border-radius: 6px; background-color: color-mix(in srgb, var(--trackColor) 22%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--trackColor) 38%, transparent); cursor: crosshair; transition: background-color 140ms ease, box-shadow 140ms ease, top 140ms ease, height 140ms ease;
      &:hover:not(:disabled) { background-color: color-mix(in srgb, var(--trackColor) 16%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--trackColor) 70%, transparent); }
      &.active { top: 9px; height: 16px; background-color: color-mix(in srgb, var(--trackColor) 30%, transparent); box-shadow: inset 0 0 0 1.5px var(--trackColor), 0 0 10px color-mix(in srgb, var(--trackColor) 45%, transparent); }
    }
    .shotBlock {
      position: absolute; z-index: 1; top: 5px; display: flex; align-items: center; gap: 3px; height: 24px; min-width: 8px; padding: 0 9px; overflow: hidden; border-radius: 6px; color: #fff; font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; background: color-mix(in srgb, var(--trackColor) 86%, var(--el-bg-color-overlay)); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.22); cursor: grab; touch-action: none;
      > span { min-width: 0; overflow: hidden; white-space: nowrap; }
      > svg { flex-shrink: 0; }
      &:hover:not(:disabled) { background: color-mix(in srgb, var(--trackColor) 90%, #fff); }
      &.active { z-index: 2; box-shadow: 0 0 0 2px var(--el-bg-color-overlay), 0 0 0 3.5px var(--trackColor), 0 0 14px color-mix(in srgb, var(--trackColor) 60%, transparent); }
      &.dragging { cursor: grabbing; filter: brightness(1.08); }
      .grip { position: absolute; top: 0; bottom: 0; width: min(7px, 30%); cursor: ew-resize; opacity: 0; transition: opacity 120ms ease; &::after { content: ""; position: absolute; top: 6px; bottom: 6px; left: 50%; width: 2px; margin-left: -1px; border-radius: 1px; background: rgb(255 255 255 / 0.9); } &[data-edge="start"] { left: 0; } &[data-edge="end"] { right: 0; } }
      &:hover .grip, &.active .grip, &:focus-visible .grip { opacity: 1; }
    }
    .shotKey {
      position: absolute; z-index: 4; top: 24px; width: 9px; height: 9px; min-width: 0; margin-left: -4.5px; padding: 0; border: 0; border-radius: 2px; transform: rotate(45deg); background: var(--el-bg-color-overlay); box-shadow: inset 0 0 0 2px var(--trackColor), 0 1px 2px rgb(0 0 0 / 0.25); cursor: ew-resize; touch-action: none; transition: transform 120ms ease, background-color 120ms ease;
      &:hover:not(:disabled), &:focus-visible { transform: rotate(45deg) scale(1.25); }
      &.active { background: var(--trackColor); box-shadow: 0 0 0 2px var(--el-bg-color-overlay), 0 0 8px color-mix(in srgb, var(--trackColor) 70%, transparent); }
      &.dragging { cursor: grabbing; transform: rotate(45deg) scale(1.3); }
    }
    .shotGhost { position: absolute; z-index: 3; top: 5px; display: flex; align-items: center; height: 24px; padding: 0 7px; overflow: hidden; border: 1.5px dashed var(--trackColor); border-radius: 6px; background: color-mix(in srgb, var(--trackColor) 16%, transparent); color: var(--el-text-color-primary); font-size: 11px; font-style: normal; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; pointer-events: none; &.invalid { border-color: var(--el-text-color-secondary); color: var(--el-text-color-secondary); background: transparent; } }
  }
  .worldNeedle { position: absolute; z-index: 5; top: 0; bottom: 0; left: 0; width: 2px; margin-left: -1px; background: var(--el-color-primary); pointer-events: none; will-change: transform; .playheadHandle { position: sticky; display: block; top: 2px; width: 14px; height: 22px; padding: 0; transform: translateX(-6px); border-radius: 2px; background: var(--el-color-primary); clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%); pointer-events: auto; cursor: ew-resize; touch-action: none; } }
  @media (prefers-reduced-motion: reduce) { &, * { transition: none !important; } }
  // 触屏没有悬停：常显静音、删除轨道和片段拖柄，高度拖条加大到手指可按。
  @media (any-pointer: coarse) {
    .muteToggle { opacity: 1; }
    .resizeGrip { height: 14px; &::after { top: 5px; opacity: 1; } }
    .timelineRow.folderRow .removeTrack { opacity: 1; }
    .timelineRow .shotBlock .grip { width: min(14px, 30%); opacity: 1; }
  }
}
// ACT: 时间轴宽度跟着窗口70%走，按自身宽度而不是视口宽度收起次要元素：先藏文字标签，再藏小数和分隔线，最后藏缩放。
@container performanceTimeline (max-width: 720px) { .performanceTimeline .toolLabel { display: none; } }
@container performanceTimeline (max-width: 440px) { .performanceTimeline .timeReadout .fraction, .performanceTimeline .headerDivider { display: none; } .performanceTimeline .timelineHeader { gap: 4px; padding: 0 4px; } }
@container performanceTimeline (max-width: 360px) { .performanceTimeline .zoomGroup { display: none; } .performanceTimeline .collapseAction { margin-inline-start: auto; } }
</style>

<style lang="scss">
.dialogueCoveragePopover .dialogueCoverage { display: flex; flex-direction: column; gap: 8px;
  .coveragePace { display: flex; align-items: center; gap: 4px; font-size: 12px; span { margin-right: 4px; color: var(--el-text-color-secondary); } button { padding: 2px 10px; border: 0; border-radius: 11px; cursor: pointer; background: var(--el-fill-color-light); color: var(--el-text-color-regular); &.active { background: var(--el-color-primary); color: #fff; } } }
  .paceApply { align-self: flex-end; padding: 2px 4px; border: 0; cursor: pointer; background: none; color: var(--el-color-primary); font-size: 12px; }
  textarea { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid var(--el-border-color); border-radius: 6px; background: var(--el-fill-color-blank); color: var(--el-text-color-primary); font: inherit; font-size: 12px; line-height: 1.5; resize: vertical; outline: none; &:focus { border-color: var(--el-color-primary); } }
  .dialogueApply { align-self: flex-end; padding: 4px 12px; border: 0; cursor: pointer; border-radius: 6px; background: var(--el-color-primary); color: #fff; font-size: 12px; &:disabled { opacity: 0.5; } }
}
</style>

<style lang="scss">
.exportMenuPopover .videoQuality { flex-shrink: 0; height: 22px; padding: 0 8px; margin-right: auto; border: 1px solid var(--el-border-color); border-radius: 11px; background: transparent; color: var(--el-text-color-regular); font-size: 11px; font-weight: 600; cursor: pointer; &:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); } }
// 勾选式导出面板：每镜、整场两组，两列勾选；底部清晰度和导出按钮。
.exportMenuPopover .exportPanel { display: flex; flex-direction: column; gap: 10px;
  section > header { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; color: var(--el-text-color-secondary); font-size: 11px; font-weight: 600; small { font-weight: 400; } }
  .exportChoices { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px;
    .el-checkbox { height: 28px; margin-right: 0; }
    .el-checkbox__label { display: inline-flex; align-items: center; gap: 5px; padding-left: 6px; font-size: 12px; svg { flex-shrink: 0; color: var(--el-color-primary); } }
  }
  footer { display: flex; align-items: center; gap: 4px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); .el-button + .el-button { margin-left: 0; } }
}
</style>

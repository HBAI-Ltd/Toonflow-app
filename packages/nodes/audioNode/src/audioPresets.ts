import { markMessages } from "@toonflow/i18n/vue";

type AudioPreset = [label: string, values: Record<string, number>];

export const audioPresets = markMessages<Record<string, AudioPreset[]>>({
  audioSpeed: [["0.75×", { speed: 0.75 }], ["1.25×", { speed: 1.25 }], ["1.5×", { speed: 1.5 }], ["2×", { speed: 2 }]],
  audioLoop: [["2×", { count: 2 }], ["3×", { count: 3 }], ["4×", { count: 4 }]],
  audioDenoise: [["轻度", { reduction: 6 }], ["适中", { reduction: 12 }], ["较强", { reduction: 22 }]],
  audioFilter: [["嗡嗡声", { low: 120, high: 20000 }], ["嘶嘶声", { low: 20, high: 6500 }], ["两者都有", { low: 120, high: 6500 }]],
  audioGain: [["轻一点", { gain: -3 }], ["响一点", { gain: 3 }], ["更响", { gain: 6 }]],
  audioNormalize: [["对白", { loudness: -16 }], ["音乐", { loudness: -14 }], ["广播", { loudness: -23 }]],
  audioCompress: [["轻度", { threshold: -14, ratio: 2 }], ["适中", { threshold: -18, ratio: 3 }], ["较强", { threshold: -24, ratio: 5 }]],
  audioFade: [["只淡入", { fadeIn: 0.2, fadeOut: 0 }], ["只淡出", { fadeIn: 0, fadeOut: 0.5 }], ["淡入淡出", { fadeIn: 0.2, fadeOut: 0.5 }]],
  duckMusic: [["轻度", { bed: -5, threshold: -22, release: 350 }], ["适中", { bed: -10, threshold: -25, release: 500 }], ["较强", { bed: -16, threshold: -30, release: 650 }]],
  audioEqualize: [["突出对白", { bass: 0, mid: 2, treble: 0 }], ["突出低音", { bass: 4, mid: 0, treble: 0 }], ["突出高音", { bass: 0, mid: 0, treble: 4 }]],
  audioPitch: [["低一点", { pitch: -2 }], ["高一点", { pitch: 2 }]],
  audioReverb: [["小房间", { room: 18, wet: 12 }], ["房间", { room: 35, wet: 25 }], ["大厅", { room: 70, wet: 42 }]],
});

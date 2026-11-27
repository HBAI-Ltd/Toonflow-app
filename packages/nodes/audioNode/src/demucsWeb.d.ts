declare module "demucs-web/processor" {
  export function prepareModelInput(left: Float32Array, right: Float32Array): {
    waveform: Float32Array; magSpec: Float32Array; numBins: number; numFrames: number;
  };
  export function standaloneIspec(spectrum: {
    leftReal: Float32Array; leftImag: Float32Array; rightReal: Float32Array; rightImag: Float32Array;
  }, length: number): { left: Float32Array; right: Float32Array };
}

declare module "threejson/core" {
  import type { Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";

  export interface SceneRuntime {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    start(): void;
    invalidate(): boolean;
    dispose(): void;
  }
  export function createJsonScene(payload: object, options: {
    canvas: HTMLCanvasElement;
    beforeFrame?: () => void;
    onRuntimeReady?: (context: { runtime: SceneRuntime }) => void;
  }): Promise<SceneRuntime>;
  export function getObjectByThreeJsonId(threeJsonId: string, runtimeScope: Scene): Object3D | null;
  export function registerObject(object: Object3D, descriptor: object, options: { recursive: boolean }, runtimeScope: Scene): Object3D;
}

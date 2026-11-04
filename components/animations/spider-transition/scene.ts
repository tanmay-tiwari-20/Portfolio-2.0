import * as THREE from "three";
import { createCharacter } from "./character";
import { createPageCloth } from "./cloth";
import { createWeb } from "./web";
import {
  createAdaptiveResolution,
  getTransitionResolution,
} from "./performance";
import {
  sampleSwing,
  CONTACT_TIME,
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
} from "./motion";
export { CONTACT_TIME, DURATION } from "./motion";

export type TransitionScene = ReturnType<typeof createTransitionScene>;

/** A persistent renderer, character rig and web; only the page mesh is transient. */
export function createTransitionScene(
  canvas: HTMLCanvasElement,
  renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  }),
) {
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10000);
  camera.position.z = 5000;
  scene.add(new THREE.HemisphereLight(0xeaf3ff, 0x312330, 2.15));
  const key = new THREE.DirectionalLight(0xffeee1, 3.2);
  key.position.set(-400, 800, 1400);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9abaff, 3.6);
  rim.position.set(800, 350, -700);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.65);
  fill.position.set(400, -500, 900);
  scene.add(fill);
  const character = createCharacter(),
    web = createWeb();
  scene.add(character.group, web.group);
  let cloth: ReturnType<typeof createPageCloth> | undefined;
  let texture: THREE.CanvasTexture | undefined;
  const blank = new THREE.DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1,
  );
  blank.colorSpace = THREE.SRGBColorSpace;
  blank.needsUpdate = true;
  let width = 1,
    height = 1,
    scale = 1,
    low = false;
  let density = 0;
  let disposed = false;
  let adaptation = createAdaptiveResolution(1);
  const palm = new THREE.Vector3(),
    webPalm = new THREE.Vector3(),
    grip = new THREE.Vector3();
  const anchor = new THREE.Vector3(),
    entry = new THREE.Vector3();
  let heldTime = 0,
    lastTime = -1;

  function clear() {
    if (cloth) {
      cloth.mesh.visible = false;
      cloth.mesh.material.uniforms.pageMap.value = blank;
    }
    texture?.dispose();
    texture = undefined;
    if (!disposed) renderer.clear();
  }

  function configure(w: number, h: number) {
    const dpr = devicePixelRatio || 1;
    if (cloth && width === w && height === h && density === dpr) return;
    if (cloth) {
      scene.remove(cloth.mesh);
      cloth.dispose();
    }
    width = w;
    height = h;
    density = dpr;
    const resolution = getTransitionResolution(
      width,
      height,
      dpr,
      navigator.hardwareConcurrency || 8,
    );
    low = resolution.low;
    adaptation = createAdaptiveResolution(resolution.renderRatio);
    // One allocation; separate setPixelRatio/setSize calls resize twice.
    renderer.setDrawingBufferSize(width, height, resolution.renderRatio);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    scale = Math.min(height * 0.22, width * 0.22, 195);
    character.group.scale.setScalar(scale);
    cloth = createPageCloth(blank, width, height, low ? "low" : "high");
    cloth.mesh.visible = false;
    scene.add(cloth.mesh);
  }

  function warmup(w: number, h: number) {
    if (disposed) return;
    configure(w, h);
    // Called during idle/intent preparation while the canvas is hidden. Compile
    // all materials, then upload the real rig/web geometry in one hidden draw.
    renderer.compile(scene, camera);
    cloth!.mesh.visible = true;
    render(CONTACT_TIME + 0.4, 0, 0);
    clear();
  }

  function begin(snapshot: HTMLCanvasElement, w: number, h: number) {
    if (disposed) return;
    clear();
    configure(w, h);
    texture = new THREE.CanvasTexture(snapshot);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    cloth!.mesh.material.uniforms.pageMap.value = texture;
    cloth!.mesh.visible = true;
    heldTime = 0;
    lastTime = -1;
    render(0, 0);
  }

  function render(time: number, dt: number, frameDt = dt) {
    if (disposed) return;
    if (time === CONTACT_TIME && lastTime === CONTACT_TIME) heldTime += dt;
    lastTime = time;
    const motion = sampleSwing(time, width, height, scale);
    const { pull } = motion;
    // A slow route retains subtle body motion and web settling while the
    // actual grip and undeformed page remain locked at contact.
    character.pose(time + heldTime * 0.4, pull, false);
    character.group.visible = time > 0.24;
    // Arc accelerates into the bottom of the swing, then rises with the sheet.
    character.group.rotation.set(...motion.rotation);
    character.group.position.set(0, 0, 0);
    character.group.updateMatrixWorld(true);
    palm.setFromMatrixPosition(character.gripHand.matrixWorld);
    grip.set(...motion.grip);
    character.group.position.copy(grip).sub(palm);
    character.group.updateMatrixWorld(true);
    webPalm.setFromMatrixPosition(character.webHand.matrixWorld);
    palm.setFromMatrixPosition(character.gripHand.matrixWorld);
    anchor.set(width * 0.08, height * 0.49, 30);
    entry.set(-width * 0.65, height * 0.1, 35);
    entry.lerp(webPalm, THREE.MathUtils.smoothstep(time, 0.27, 0.48));
    web.update(
      entry,
      anchor,
      time + heldTime,
      THREE.MathUtils.smoothstep(
        time,
        WEB_RELEASE_TIME,
        WEB_RELEASE_TIME + WEB_RELEASE_DURATION,
      ),
      Math.max(0.65, scale / 150),
    );
    cloth?.update(dt, palm, pull);
    const nextRatio = adaptation.sample(frameDt);
    if (nextRatio !== undefined)
      renderer.setDrawingBufferSize(width, height, nextRatio);
    // Resize before drawing, so quality adjustments cannot expose a cleared frame.
    renderer.render(scene, camera);
  }

  return {
    begin,
    warmup,
    render,
    clear,
    get diagnostics() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
        pixelRatio: renderer.getPixelRatio(),
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clear();
      cloth?.dispose();
      cloth = undefined;
      blank.dispose();
      character.dispose();
      web.dispose();
      renderer.dispose();
    },
  };
}

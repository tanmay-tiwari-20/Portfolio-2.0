import * as THREE from "three";
import { createCharacter } from "./character";
import { createPageCloth } from "./cloth";
import { createWeb } from "./web";
import {
  sampleSwing,
  CONTACT_TIME,
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
} from "./motion";
export { CONTACT_TIME, DURATION } from "./motion";

export type TransitionScene = ReturnType<typeof createTransitionScene>;

/** A persistent renderer, character rig and web; only the page mesh is transient. */
export function createTransitionScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
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
  let width = 1,
    height = 1,
    scale = 1,
    low = false;
  const palm = new THREE.Vector3(),
    webPalm = new THREE.Vector3(),
    grip = new THREE.Vector3();
  const anchor = new THREE.Vector3(),
    entry = new THREE.Vector3();
  let frameCount = 0,
    slowFrames = 0;
  let heldTime = 0,
    lastTime = -1;

  function clear() {
    if (cloth) {
      scene.remove(cloth.mesh);
      cloth.dispose();
      cloth = undefined;
    }
    texture?.dispose();
    texture = undefined;
    renderer.clear();
  }

  function begin(snapshot: HTMLCanvasElement, w: number, h: number) {
    clear();
    width = w;
    height = h;
    low = width < 700 || (navigator.hardwareConcurrency || 8) <= 4;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, low ? 1.25 : 1.75));
    renderer.setSize(width, height, false);
    camera.left = -width / 2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = -height / 2;
    camera.updateProjectionMatrix();
    scale = Math.min(height * 0.22, width * 0.22, 195);
    character.group.scale.setScalar(scale);
    texture = new THREE.CanvasTexture(snapshot);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    cloth = createPageCloth(texture, width, height, low ? "low" : "high");
    scene.add(cloth.mesh);
    frameCount = 0;
    slowFrames = 0;
    heldTime = 0;
    lastTime = -1;
    render(0, 0);
  }

  function render(time: number, dt: number, frameDt = dt) {
    if (time === CONTACT_TIME && lastTime === CONTACT_TIME) heldTime += dt;
    lastTime = time;
    const motion = sampleSwing(time, width, height, scale);
    const { pull } = motion;
    // A slow route retains subtle body motion and web settling while the
    // actual grip and undeformed page remain locked at contact.
    character.pose(time + heldTime * 0.4, pull);
    character.group.visible = time > 0.24;
    // Arc accelerates into the bottom of the swing, then rises with the sheet.
    character.group.rotation.set(...motion.rotation);
    character.group.position.set(0, 0, 0);
    character.group.updateMatrixWorld(true);
    character.gripHand.getWorldPosition(palm);
    grip.set(...motion.grip);
    character.group.position.copy(grip).sub(palm);
    character.group.updateMatrixWorld(true);
    character.webHand.getWorldPosition(webPalm);
    character.gripHand.getWorldPosition(palm);
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
    renderer.render(scene, camera);
    // Reduce fill-rate once if sustained frame pressure is detected. No React work.
    if (frameDt > 0.027) slowFrames++;
    if (++frameCount === 36 && slowFrames > 16) renderer.setPixelRatio(1);
  }

  return {
    begin,
    render,
    clear,
    get diagnostics() {
      return {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
      };
    },
    dispose() {
      clear();
      character.dispose();
      web.dispose();
      renderer.dispose();
    },
  };
}

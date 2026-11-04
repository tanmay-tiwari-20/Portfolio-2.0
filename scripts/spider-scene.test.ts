import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createTransitionScene } from "../components/animations/spider-transition/scene";

type Cloth = THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;

class Renderer {
  outputColorSpace = "";
  toneMapping = 0;
  toneMappingExposure = 1;
  capabilities = { getMaxAnisotropy: () => 8 };
  info = {
    render: { calls: 0, triangles: 0 },
    memory: { textures: 0, geometries: 0 },
  };
  events: string[] = [];
  sizes: Array<[number, number, number]> = [];
  draws: Array<{ cloth: Cloth; texture: THREE.Texture; visible: boolean }> = [];
  compileCount = 0;
  disposeCount = 0;
  ratio = 1;
  camera?: THREE.OrthographicCamera;

  setClearColor() {}
  setDrawingBufferSize(width: number, height: number, ratio: number) {
    this.events.push("resize");
    this.sizes.push([width, height, ratio]);
    this.ratio = ratio;
  }
  getPixelRatio() {
    return this.ratio;
  }
  compile(scene: THREE.Scene) {
    this.events.push("compile");
    this.compileCount++;
    assert.ok(scene.getObjectByName("outgoing-page-cloth"));
  }
  render(scene: THREE.Scene, camera: THREE.OrthographicCamera) {
    this.events.push("render");
    this.camera = camera;
    const cloth = scene.getObjectByName("outgoing-page-cloth") as Cloth;
    assert.ok(cloth);
    this.draws.push({
      cloth,
      texture: cloth.material.uniforms.pageMap.value,
      visible: cloth.visible,
    });
  }
  clear() {
    this.events.push("clear");
  }
  dispose() {
    this.disposeCount++;
  }
}

function setup() {
  const names = ["devicePixelRatio", "navigator"] as const;
  const descriptors = names.map((name) =>
    Object.getOwnPropertyDescriptor(globalThis, name),
  );
  Object.defineProperty(globalThis, "devicePixelRatio", {
    configurable: true,
    value: 2,
  });
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { hardwareConcurrency: 8 },
  });
  const renderer = new Renderer();
  const snapshot = { width: 1440, height: 900 } as HTMLCanvasElement;
  const engine = createTransitionScene(
    snapshot,
    renderer as unknown as THREE.WebGLRenderer,
  );
  return {
    renderer,
    snapshot,
    engine,
    restore() {
      engine.dispose();
      names.forEach((name, index) => {
        if (descriptors[index])
          Object.defineProperty(globalThis, name, descriptors[index]!);
        else Reflect.deleteProperty(globalThis, name);
      });
    },
  };
}

function assertFlat(cloth: Cloth, width: number, height: number) {
  const positions = cloth.geometry.getAttribute("position");
  const uv = cloth.geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    assert.ok(Math.abs(positions.getX(i) - (uv.getX(i) - 0.5) * width) < 0.001);
    assert.ok(
      Math.abs(positions.getY(i) - (uv.getY(i) - 0.5) * height) < 0.001,
    );
    assert.equal(positions.getZ(i), 0);
  }
  assert.equal(cloth.material.uniforms.bendAmount.value, 0);
}

test("warmup compiles and draws the real scene, then begin reuses and resets its cloth", () => {
  const { engine, renderer, snapshot, restore } = setup();
  try {
    engine.warmup(1440, 900);
    assert.equal(renderer.compileCount, 1);
    assert.ok(
      renderer.events.indexOf("compile") < renderer.events.indexOf("render"),
    );
    const warm = renderer.draws[0];
    assert.equal(
      warm.visible,
      true,
      "warmup must actually draw the page material",
    );
    assert.equal(warm.cloth.visible, false, "warmup leaves no visible cloth");
    assert.ok(warm.texture instanceof THREE.DataTexture);
    engine.begin(snapshot, 1440, 900);
    const start = renderer.draws.at(-1)!;
    assert.equal(start.cloth, warm.cloth);
    assert.equal(
      renderer.sizes.length,
      1,
      "same viewport must not allocate a new backing store",
    );
    assert.ok(start.texture instanceof THREE.CanvasTexture);
    assert.equal(start.texture.image, snapshot);
    assertFlat(start.cloth, 1440, 900);
  } finally {
    restore();
  }
});

test("clear releases page textures while repeated flights reuse reset geometry and material", () => {
  const { engine, renderer, snapshot, restore } = setup();
  try {
    engine.begin(snapshot, 1440, 900);
    const first = renderer.draws.at(-1)!;
    const geometry = first.cloth.geometry,
      material = first.cloth.material;
    let textureDisposals = 0,
      geometryDisposals = 0,
      materialDisposals = 0;
    first.texture.addEventListener("dispose", () => textureDisposals++);
    geometry.addEventListener("dispose", () => geometryDisposals++);
    material.addEventListener("dispose", () => materialDisposals++);
    engine.render(1.6, 1 / 60, 1 / 60);
    assert.ok(
      Array.from(geometry.getAttribute("position").array).some(
        (value, index) => index % 3 === 2 && Math.abs(value) > 0.01,
      ),
    );
    engine.clear();
    engine.clear();
    assert.equal(textureDisposals, 1);
    assert.equal(first.cloth.visible, false);
    assert.ok(material.uniforms.pageMap.value instanceof THREE.DataTexture);
    const blank = material.uniforms.pageMap.value as THREE.Texture;
    let blankDisposals = 0;
    blank.addEventListener("dispose", () => blankDisposals++);
    engine.begin(snapshot, 1440, 900);
    const second = renderer.draws.at(-1)!;
    assert.notEqual(second.texture, first.texture);
    assert.equal(second.cloth.geometry, geometry);
    assert.equal(second.cloth.material, material);
    assert.equal(geometryDisposals + materialDisposals, 0);
    assertFlat(second.cloth, 1440, 900);
    engine.dispose();
    engine.dispose();
    assert.deepEqual(
      [
        geometryDisposals,
        materialDisposals,
        blankDisposals,
        renderer.disposeCount,
      ],
      [1, 1, 1, 1],
    );
    const draws = renderer.draws.length;
    engine.begin(snapshot, 1440, 900);
    engine.warmup(1440, 900);
    engine.render(2, 1 / 60);
    assert.equal(
      renderer.draws.length,
      draws,
      "disposed engines cannot resume rendering",
    );
  } finally {
    restore();
  }
});

test("viewport changes dispose the old cloth and produce exact new viewport bounds", () => {
  const { engine, renderer, snapshot, restore } = setup();
  try {
    engine.begin(snapshot, 1440, 900);
    const old = renderer.draws.at(-1)!;
    let geometryDisposals = 0,
      materialDisposals = 0,
      textureDisposals = 0;
    old.cloth.geometry.addEventListener("dispose", () => geometryDisposals++);
    old.cloth.material.addEventListener("dispose", () => materialDisposals++);
    old.texture.addEventListener("dispose", () => textureDisposals++);
    engine.begin({ width: 390, height: 844 } as HTMLCanvasElement, 390, 844);
    const next = renderer.draws.at(-1)!;
    assert.notEqual(next.cloth, old.cloth);
    assert.deepEqual(
      [geometryDisposals, materialDisposals, textureDisposals],
      [1, 1, 1],
    );
    assert.equal(renderer.sizes.length, 2);
    assert.equal(renderer.camera!.left, -195);
    assert.equal(renderer.camera!.top, 422);
    assertFlat(next.cloth, 390, 844);
    engine.dispose();
    assert.deepEqual(
      [geometryDisposals, materialDisposals, textureDisposals],
      [1, 1, 1],
    );
  } finally {
    restore();
  }
});

test("sustained slow frames resize before drawing and keep the lower ratio for later flights", () => {
  const { engine, renderer, snapshot, restore } = setup();
  try {
    engine.begin(snapshot, 1440, 900);
    const initial = renderer.ratio;
    renderer.events.length = 0;
    for (let frame = 0; frame < 30; frame++)
      engine.render(0.4 + frame / 60, 1 / 60, 0.04);
    assert.ok(renderer.ratio < initial);
    assert.ok(renderer.events.includes("resize"));
    renderer.events.forEach((event, index) => {
      if (event === "resize")
        assert.equal(
          renderer.events[index + 1],
          "render",
          "quality changes must be immediately covered by a drawn frame",
        );
    });
    const reduced = renderer.ratio,
      sizes = renderer.sizes.length;
    engine.clear();
    engine.begin(snapshot, 1440, 900);
    assert.equal(renderer.ratio, reduced);
    assert.equal(renderer.sizes.length, sizes);
  } finally {
    restore();
  }
});

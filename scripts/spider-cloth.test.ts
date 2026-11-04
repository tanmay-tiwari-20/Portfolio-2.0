import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  createPageCloth,
  type ClothQuality,
} from "../components/animations/spider-transition/cloth";

const close = (actual: number, expected: number, tolerance = 0.001) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);
};

function gripVertex(cloth: ReturnType<typeof createPageCloth>) {
  const uv = cloth.mesh.geometry.getAttribute("uv");
  for (let index = 0; index < uv.count; index++) {
    if (uv.getX(index) === 0 && Math.abs(uv.getY(index) - 0.45) < 0.00001)
      return index;
  }
  throw new Error("No vertex at the physical grip point");
}

test("cloth begins with exact viewport bounds, readable UVs, and an exact hand vertex", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [768, 1024],
    [3440, 1440],
  ]) {
    for (const quality of ["high", "low"] as ClothQuality[]) {
      const texture = new THREE.Texture();
      const cloth = createPageCloth(texture, width, height, quality);
      const position = cloth.mesh.geometry.getAttribute("position");
      const uv = cloth.mesh.geometry.getAttribute("uv");
      assert.ok(
        position.count <= 2000,
        "mesh must remain within the vertex budget",
      );
      for (let index = 0; index < position.count; index++) {
        close(position.getX(index), (uv.getX(index) - 0.5) * width);
        close(position.getY(index), (uv.getY(index) - 0.5) * height);
        assert.equal(position.getZ(index), 0);
      }
      const pin = gripVertex(cloth);
      close(position.getX(pin), -width / 2);
      close(position.getY(pin), -height * 0.05);
      assert.equal(cloth.mesh.material.uniforms.bendAmount.value, 0);
      cloth.dispose();
      texture.dispose();
    }
  }
});

test("the hand constraint is exact while deformation propagates and the far edge lags", () => {
  const width = 1440;
  const height = 900;
  const texture = new THREE.Texture();
  const cloth = createPageCloth(texture, width, height, "high");
  const pin = gripVertex(cloth);
  const grip = new THREE.Vector3(-width / 2 + 120, -height * 0.05 + 25, 18);
  cloth.update(1 / 60, grip, 0.07);
  const positions = cloth.mesh.geometry.getAttribute("position");
  close(positions.getX(pin), grip.x);
  close(positions.getY(pin), grip.y);
  close(positions.getZ(pin), grip.z);
  const rightTop = Array.from({ length: positions.count }, (_, i) => i).find(
    (index) => cloth.mesh.geometry.getAttribute("uv").getX(index) === 1,
  )!;
  close(positions.getX(rightTop), width / 2);
  close(positions.getY(rightTop), height / 2);
  assert.ok(
    Array.from({ length: positions.count }, (_, i) => positions.getZ(i)).some(
      (z) => Math.abs(z) > 0.1,
    ),
    "cloth must bend in depth instead of shifting a flat rectangle",
  );
  cloth.dispose();
  texture.dispose();
});

test("swinging sheet stays finite, forms broad folds and leaves the viewport on every aspect ratio", () => {
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [768, 1024],
    [3440, 1440],
  ]) {
    for (const quality of ["high", "low"] as ClothQuality[]) {
      const texture = new THREE.Texture();
      const cloth = createPageCloth(texture, width, height, quality);
      const position = cloth.mesh.geometry.getAttribute("position");
      const grip = new THREE.Vector3();
      const pin = gripVertex(cloth);
      let maximumDepth = 0;
      for (let frame = 1; frame <= 90; frame++) {
        const progress = frame / 90;
        grip.set(
          -width / 2 + width * 1.9 * progress,
          -height * 0.05 + Math.sin(progress * Math.PI) * height * 0.18,
          Math.sin(progress * Math.PI) * 35,
        );
        cloth.update(1 / 60, grip, progress);
        close(position.getX(pin), grip.x);
        close(position.getY(pin), grip.y);
        close(position.getZ(pin), grip.z);
        for (let index = 0; index < position.count; index++) {
          const x = position.getX(index);
          const y = position.getY(index);
          const z = position.getZ(index);
          assert.ok(
            Number.isFinite(x + y + z),
            "numerical instability must not poison WebGL buffers",
          );
          assert.ok(
            Math.abs(x) < width * 4 &&
              Math.abs(y) < height * 4 &&
              Math.abs(z) < width * 4,
          );
          maximumDepth = Math.max(maximumDepth, Math.abs(z));
          if (frame === 90)
            assert.ok(
              x > width / 2,
              "no trailing corner may remain visible at completion",
            );
        }
      }
      assert.ok(
        maximumDepth > Math.min(width, height) * 0.05,
        "the fabric must visibly fold in 3D",
      );
      cloth.dispose();
      texture.dispose();
    }
  }
});

test("interrupted animation can reset and resume without retained momentum or NaN values", () => {
  const texture = new THREE.Texture();
  const cloth = createPageCloth(texture, 1280, 800, "high");
  const original = Array.from(
    cloth.mesh.geometry.getAttribute("position").array,
  );
  cloth.update(2, new THREE.Vector3(300, 20, 50), 0.5);
  cloth.update(0, new THREE.Vector3(-640, -40, 0), 0);
  assert.deepEqual(
    Array.from(cloth.mesh.geometry.getAttribute("position").array),
    original,
  );
  cloth.update(Number.NaN, new THREE.Vector3(0, 0, 0), 0.3);
  assert.deepEqual(
    Array.from(cloth.mesh.geometry.getAttribute("position").array),
    original,
  );
  cloth.update(15, new THREE.Vector3(1280 * 1.4, 0, 0), 1);
  const positions = cloth.mesh.geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index++)
    assert.ok(positions.getX(index) > 640);
  cloth.dispose();
  texture.dispose();
});

test("sheet disposal is idempotent and preserves the caller-owned texture", () => {
  const texture = new THREE.Texture();
  const cloth = createPageCloth(texture, 1280, 800, "low");
  const calls = { texture: 0, geometry: 0, material: 0 };
  texture.addEventListener("dispose", () => calls.texture++);
  cloth.mesh.geometry.addEventListener("dispose", () => calls.geometry++);
  cloth.mesh.material.addEventListener("dispose", () => calls.material++);
  cloth.dispose();
  cloth.dispose();
  cloth.update(1 / 60, new THREE.Vector3(), 0.7);
  assert.deepEqual(calls, { texture: 0, geometry: 1, material: 1 });
  texture.dispose();
});

test("invalid viewport dimensions fail before allocating an unusable sheet", () => {
  const texture = new THREE.Texture();
  for (const [width, height] of [
    [0, 800],
    [1440, -1],
    [Number.NaN, 800],
    [Infinity, 800],
  ]) {
    assert.throws(
      () => createPageCloth(texture, width, height, "high"),
      RangeError,
    );
  }
  texture.dispose();
});

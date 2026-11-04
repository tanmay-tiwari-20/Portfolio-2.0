import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createWeb } from "../components/animations/spider-transition/web";
import {
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
} from "../components/animations/spider-transition/motion";

const start = new THREE.Vector3(-610, -130, 65);
const end = new THREE.Vector3(95, 441, 30);

function mesh(web: ReturnType<typeof createWeb>, name: string) {
  const object = web.group.getObjectByName(name);
  assert.ok(object instanceof THREE.Mesh, `missing ${name}`);
  return object as THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
}

test("the top attachment spreads into a broad, genuinely three-dimensional network", () => {
  const web = createWeb();
  try {
    web.update(start, end, 1.2, 0, 1);
    const anchor = web.group.getObjectByName("spread-adhesive-web")!;
    const bounds = new THREE.Box3().setFromObject(anchor);
    const size = bounds.getSize(new THREE.Vector3());
    assert.ok(size.x > 190 && size.x < 270, `anchor width ${size.x}`);
    assert.ok(
      bounds.min.y < end.y - 80,
      "most of the attachment must remain below the viewport's top edge",
    );
    assert.ok(
      size.z > 7,
      "the anchor must have curved 3D depth, not a flat decal",
    );
    const fibers = mesh(web, "load-bearing-web-fibers");
    const wisps = mesh(web, "crosslinked-silk-wisps");
    const patches = mesh(web, "translucent-silk-patches");
    assert.ok(fibers.geometry.getAttribute("position").count > 4000);
    assert.ok(wisps.geometry.getAttribute("position").count > 4000);
    assert.ok(patches.material.transparent && patches.material.opacity < 0.2);
    assert.ok(patches.material.bumpMap instanceof THREE.DataTexture);
    const fullWidth = size.x;
    web.update(start, end, 1.2, 0, 0.65);
    const narrow = new THREE.Box3()
      .setFromObject(anchor)
      .getSize(new THREE.Vector3());
    assert.ok(
      narrow.x > 100 && narrow.x < 140,
      "phone fan should stay readable without dominating the viewport",
    );
    assert.ok(narrow.x / fullWidth < 0.58);
  } finally {
    web.dispose();
  }
});

test("the visible silk bundle has thickness, microtexture and exact tether centers", () => {
  const web = createWeb();
  try {
    web.update(start, end, 1, 0, 1);
    const cable = mesh(web, "braided-silk-cable");
    const positions = cable.geometry.getAttribute("position");
    const sides = 6,
      rings = 97;
    const center = (ring: number) => {
      const p = new THREE.Vector3();
      for (let side = 0; side < sides; side++)
        p.add(
          new THREE.Vector3().fromBufferAttribute(
            positions,
            ring * sides + side,
          ),
        );
      return p.divideScalar(sides);
    };
    assert.ok(center(0).distanceTo(start) < 0.0001);
    assert.ok(center(rings - 1).distanceTo(end) < 0.0001);
    const lateral = new THREE.Vector3(
      -(end.y - start.y),
      end.x - start.x,
      0,
    ).normalize();
    let minimum = Infinity,
      maximum = -Infinity;
    for (let strand = 0; strand < 13; strand++)
      for (let side = 0; side < sides; side++) {
        const p = new THREE.Vector3().fromBufferAttribute(
          positions,
          strand * rings * sides + 48 * sides + side,
        );
        const n = p.dot(lateral);
        minimum = Math.min(minimum, n);
        maximum = Math.max(maximum, n);
      }
    assert.ok(
      maximum - minimum > 6,
      "bundle must be visibly wider than the former ~3px strand",
    );
    const texture = cable.material.bumpMap;
    assert.ok(texture instanceof THREE.DataTexture);
    const data = texture.image.data;
    const values = new Set(
      Array.from(data as Uint8Array).filter((_, i) => i % 4 === 0),
    );
    assert.ok(
      values.size > 90,
      "surface needs varying fibrous roughness rather than a uniform material",
    );
  } finally {
    web.dispose();
  }
});

test("shot, tension and release reuse finite buffers with bounded draw calls", () => {
  const web = createWeb();
  const meshes: THREE.Mesh[] = [];
  web.group.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  const buffers = meshes.map(
    (object) => object.geometry.getAttribute("position").array,
  );
  assert.equal(
    meshes.length,
    4,
    "batch attachment filaments instead of allocating a mesh for every fiber",
  );
  try {
    for (let i = 0; i <= 210; i++) {
      const time = i / 60;
      const source = i === 0 ? end : start;
      web.update(
        source,
        end,
        time,
        THREE.MathUtils.smoothstep(
          time,
          WEB_RELEASE_TIME,
          WEB_RELEASE_TIME + WEB_RELEASE_DURATION,
        ),
        0.65 + i / 400,
      );
      for (let m = 0; m < meshes.length; m++) {
        const geometry = meshes[m].geometry;
        assert.equal(geometry.getAttribute("position").array, buffers[m]);
        if (i % 30 === 0)
          for (const value of geometry.getAttribute("position").array)
            assert.ok(Number.isFinite(value));
      }
    }
    assert.equal(web.group.visible, false, "release must finish invisibly");
    web.update(start, end, 0.2, 0, 1);
    assert.equal(
      web.group.getObjectByName("spread-adhesive-web")!.visible,
      false,
    );
    web.update(start, end, 0.35, 0, 1);
    assert.equal(
      web.group.getObjectByName("spread-adhesive-web")!.visible,
      true,
    );
    web.update(start, end, 1, 0, 1);
    assert.ok(mesh(web, "load-bearing-web-fibers").material.opacity > 0.8);
  } finally {
    web.dispose();
  }
});

test("web disposal releases shared resources once and permits no later mutation", () => {
  const web = createWeb();
  let geometryDisposals = 0,
    materialDisposals = 0,
    textureDisposals = 0;
  const textures = new Set<THREE.Texture>();
  web.group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.addEventListener("dispose", () => geometryDisposals++);
    const material = object.material as THREE.MeshPhysicalMaterial;
    material.addEventListener("dispose", () => materialDisposals++);
    if (material.bumpMap) textures.add(material.bumpMap);
  });
  textures.forEach((texture) =>
    texture.addEventListener("dispose", () => textureDisposals++),
  );
  web.dispose();
  web.dispose();
  web.update(start, end, 1, 0, 1);
  assert.equal(geometryDisposals, 4);
  assert.equal(materialDisposals, 4);
  assert.equal(textureDisposals, 1);
  assert.equal(web.group.children.length, 0);
});

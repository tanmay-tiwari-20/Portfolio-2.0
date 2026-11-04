import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const smooth = THREE.MathUtils.smoothstep;

/** Silk microstructure is generated locally, and shared by cable and web patch. */
function silkTexture() {
  const width = 64,
    height = 128;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const grain = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const fibril = Math.sin(x * 1.65 + Math.sin(y * 0.19) * 0.8);
      const weave = Math.cos(y * 0.75 + x * 0.15);
      const value = clamp(
        151 + fibril * 48 + weave * 17 + (grain - Math.floor(grain) - 0.5) * 38,
        0,
        255,
      );
      const index = (y * width + x) * 4;
      pixels[index] = pixels[index + 1] = pixels[index + 2] = value;
      pixels[index + 3] = 255;
    }
  const texture = new THREE.DataTexture(pixels, width, height);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function tube(points: THREE.Vector3[], radius: number, subdivisions = 14) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points),
    subdivisions,
    radius,
    5,
    false,
  );
}

function merged(parts: THREE.BufferGeometry[]) {
  const geometry = mergeGeometries(parts)!;
  parts.forEach((part) => part.dispose());
  return geometry;
}

/**
 * A ragged, cross-linked adhesive spray with most of its area BELOW the anchor.
 * Its radial strands branch, and scalloped bridges leave real holes between them.
 * There is no screen-space line, image decal, or full opaque disc at the anchor.
 */
function attachmentPatch() {
  const spokes = 19;
  const fibers: THREE.BufferGeometry[] = [],
    wisps: THREE.BufferGeometry[] = [];
  const tips: THREE.Vector3[] = [];
  const hub = new THREE.Vector3(0, -1, 3);
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * TAU;
    const irregular = 1 + Math.sin(i * 2.7) * 0.13 + Math.cos(i * 5.2) * 0.05;
    tips.push(
      new THREE.Vector3(
        Math.cos(angle) * 105 * irregular,
        -37 + Math.sin(angle) * 54 * irregular,
        1.2 + Math.sin(i * 1.7) * 1.2,
      ),
    );
  }
  const point = (index: number, fraction: number) => {
    const target = tips[(index + spokes) % spokes];
    return hub
      .clone()
      .lerp(target, fraction)
      .add(
        new THREE.Vector3(
          Math.sin(index * 2.1) * Math.sin(fraction * Math.PI) * 4,
          -Math.sin(fraction * Math.PI) * 5,
          Math.sin(fraction * Math.PI) * (5 + Math.cos(index) * 2),
        ),
      );
  };
  for (let i = 0; i < spokes; i++) {
    const path = [0, 0.22, 0.46, 0.72, 1].map((f) => point(i, f));
    fibers.push(tube(path, 0.57 + (i % 3) * 0.17, 20));
    // Split tips give the anchor an adhesive-spray silhouette, rather than a wheel.
    const tip = tips[i];
    for (const side of [-1, 1]) {
      const fork = tip
        .clone()
        .add(new THREE.Vector3(side * (4 + (i % 6)), -(3 + (i % 5)), 0.35));
      wisps.push(
        tube(
          [
            point(i, 0.7),
            point(i, 0.84).add(new THREE.Vector3(side * 3, -1, 0.7)),
            fork,
          ],
          0.23,
          10,
        ),
      );
    }
    for (let ring = 1; ring <= 5; ring++) {
      if (ring === 5 && i % 4 === 0) continue;
      const fraction = (ring / 5) * (0.91 + Math.sin(i * 2.2 + ring) * 0.055);
      const a = point(i, fraction),
        b = point(i + 1, fraction + Math.sin(i) * 0.025);
      const middle = a
        .clone()
        .lerp(b, 0.5)
        .lerp(hub, 0.065 + ring * 0.008);
      middle.z += 1.5;
      const bridge = tube([a, middle, b], ring < 3 ? 0.4 : 0.26, 9);
      (ring < 3 ? fibers : wisps).push(bridge);
      if ((i + ring) % 3 === 0) {
        const secondary = middle.clone().add(new THREE.Vector3(1.3, -1.8, 0.5));
        wisps.push(tube([a, secondary, b], 0.13, 7));
      }
    }
    if (i % 2 === 0) {
      wisps.push(
        tube([point(i, 0.22), point(i + 1, 0.44), point(i + 1, 0.65)], 0.2, 12),
      );
    }
  }

  // Sparse curved translucent silk between the dense central fibers. Small
  // disconnected patches keep the rest of the network open and dimensional.
  const position: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let spoke = 0; spoke < spokes; spoke++) {
    if (spoke % 4 === 0) continue;
    const first = position.length / 3;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++) {
        const radius = 0.08 + (r / 3) * (0.32 + (spoke % 3) * 0.055);
        const p = point(spoke, radius).lerp(point(spoke + 1, radius), c / 3);
        p.z += Math.sin((c / 3) * Math.PI) * Math.sin((r / 3) * Math.PI) * 1.1;
        position.push(p.x, p.y, p.z);
        uv.push(p.x / 40, p.y / 40);
        if (r < 3 && c < 3) {
          const a = first + r * 4 + c;
          indices.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);
        }
      }
  }
  const membrane = new THREE.BufferGeometry();
  membrane.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(position, 3),
  );
  membrane.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  membrane.setIndex(indices);
  membrane.computeVertexNormals();
  return { fibers: merged(fibers), wisps: merged(wisps), membrane };
}

/** A reusable, textured bundle of silk with a broad 3D attachment web. */
export function createWeb() {
  const group = new THREE.Group();
  group.name = "fibrous-swing-web";
  const texture = silkTexture();
  const cableMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xf0f0e7,
    roughness: 0.43,
    metalness: 0.035,
    transparent: true,
    opacity: 0.97,
    clearcoat: 0.2,
    sheen: 0.8,
    sheenColor: new THREE.Color(0xc5d6e7),
    sheenRoughness: 0.52,
    bumpMap: texture,
    bumpScale: 0.23,
    roughnessMap: texture,
    depthWrite: false,
    vertexColors: true,
  });
  const anchorMaterial = cableMaterial.clone();
  anchorMaterial.vertexColors = false;
  anchorMaterial.opacity = 0.91;
  anchorMaterial.bumpScale = 0.18;
  const wispMaterial = anchorMaterial.clone();
  wispMaterial.opacity = 0.67;
  wispMaterial.color.setHex(0xbfcdd3);
  const membraneMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xd8e2e1,
    transparent: true,
    opacity: 0.14,
    roughness: 0.61,
    metalness: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    bumpMap: texture,
    bumpScale: 0.18,
    clearcoat: 0.18,
  });
  const materials = [
    cableMaterial,
    anchorMaterial,
    wispMaterial,
    membraneMaterial,
  ];

  const segments = 96,
    sides = 6,
    strands = 13;
  const count = (segments + 1) * sides * strands;
  const cable = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(
    new Float32Array(count * 3),
    3,
  ).setUsage(THREE.DynamicDrawUsage);
  const normals = new THREE.BufferAttribute(
    new Float32Array(count * 3),
    3,
  ).setUsage(THREE.DynamicDrawUsage);
  const uvs = new THREE.BufferAttribute(
    new Float32Array(count * 2),
    2,
  ).setUsage(THREE.DynamicDrawUsage);
  const colors = new Float32Array(count * 3),
    indices: number[] = [];
  const offsets = new Float32Array(strands),
    thickness = new Float32Array(strands);
  const phases = new Float32Array(strands),
    cos = new Float32Array(sides),
    sin = new Float32Array(sides);
  for (let side = 0; side < sides; side++) {
    cos[side] = Math.cos((side / sides) * TAU);
    sin[side] = Math.sin((side / sides) * TAU);
  }
  for (let strand = 0; strand < strands; strand++) {
    offsets[strand] = strand === 0 ? 0 : strand <= 8 ? 2.5 : 3.5;
    thickness[strand] =
      strand === 0 ? 1.65 : strand <= 8 ? 0.61 + (strand % 3) * 0.095 : 0.18;
    phases[strand] = ((strand - 1) / (strand <= 8 ? 8 : 4)) * TAU;
    const tint =
      strand === 0 ? 0.69 : strand <= 8 ? 0.9 + (strand % 3) * 0.04 : 0.79;
    for (let ring = 0; ring <= segments; ring++)
      for (let side = 0; side < sides; side++) {
        const i = strand * (segments + 1) * sides + ring * sides + side;
        colors[i * 3] = tint;
        colors[i * 3 + 1] = tint;
        colors[i * 3 + 2] = tint * 0.985;
        if (ring < segments) {
          const next =
            strand * (segments + 1) * sides +
            ring * sides +
            ((side + 1) % sides);
          indices.push(i, next, i + sides, next, next + sides, i + sides);
        }
      }
  }
  cable.setAttribute("position", positions);
  cable.setAttribute("normal", normals);
  cable.setAttribute("uv", uvs);
  cable.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  cable.setIndex(indices);
  const cableMesh = new THREE.Mesh(cable, cableMaterial);
  cableMesh.name = "braided-silk-cable";
  cableMesh.frustumCulled = false;
  group.add(cableMesh);

  const patch = attachmentPatch(),
    anchor = new THREE.Group();
  anchor.name = "spread-adhesive-web";
  for (const [name, geometry, material] of [
    ["load-bearing-web-fibers", patch.fibers, anchorMaterial],
    ["crosslinked-silk-wisps", patch.wisps, wispMaterial],
    ["translucent-silk-patches", patch.membrane, membraneMaterial],
  ] as const) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    anchor.add(mesh);
  }
  group.add(anchor);
  const delta = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3();
  let disposed = false;

  return {
    group,
    update(
      start: THREE.Vector3,
      end: THREE.Vector3,
      time: number,
      release: number,
      scale: number,
    ) {
      if (disposed) return;
      const density = Math.max(0.4, scale),
        fade = 1 - clamp(release, 0, 1);
      const shoot = smooth(time, 0, 0.27);
      group.visible = shoot > 0.0001 && fade > 0.0001;
      cableMaterial.opacity = 0.97 * fade;
      anchorMaterial.opacity = 0.91 * fade;
      wispMaterial.opacity = 0.67 * fade;
      membraneMaterial.opacity = 0.14 * fade;
      delta.subVectors(end, start);
      const length = delta.length();
      normal.set(-delta.y, delta.x, 0);
      if (normal.lengthSq() < 0.000001) normal.set(1, 0, 0);
      else normal.normalize();
      binormal.crossVectors(delta, normal);
      if (binormal.lengthSq() < 0.000001) binormal.set(0, 0, 1);
      else binormal.normalize();
      const ringDown = Math.exp(-Math.max(0, time - 0.27) * 5.8);
      const stretch = clamp(1 - Math.max(0, length - 720) / 6000, 0.78, 1);
      for (let strand = 0; strand < strands; strand++) {
        for (let ring = 0; ring <= segments; ring++) {
          const along = ring / segments,
            t = along * shoot;
          const envelope = Math.sin(along * Math.PI);
          const join = smooth(along, 0, 0.045) * (1 - smooth(along, 0.94, 1));
          const sag =
            envelope *
            (Math.sin(time * 26 - t * 10) * ringDown * 7.5 +
              Math.sin(time * 9 - t * 5) * 0.5) *
            density;
          const braid =
            phases[strand] +
            t * (strand <= 8 ? 87 : -64) +
            Math.sin(t * 19 + strand) * 0.2;
          const fuzz = strand > 8 ? Math.sin(t * 43 + strand * 2.1) * 1.1 : 0;
          const bundle = (offsets[strand] + fuzz) * join * density * stretch;
          const radius =
            thickness[strand] * density * stretch * (0.72 + 0.28 * envelope);
          const centerN = sag + Math.cos(braid) * bundle;
          const centerB = Math.sin(braid) * bundle;
          const droop = clamp(release, 0, 1) * envelope * density * 74;
          for (let side = 0; side < sides; side++) {
            const i = strand * (segments + 1) * sides + ring * sides + side;
            const n = centerN + cos[side] * radius,
              b = centerB + sin[side] * radius;
            positions.setXYZ(
              i,
              start.x + delta.x * t + normal.x * n + binormal.x * b,
              start.y + delta.y * t + normal.y * n + binormal.y * b - droop,
              start.z + delta.z * t + normal.z * n + binormal.z * b,
            );
            normals.setXYZ(
              i,
              normal.x * cos[side] + binormal.x * sin[side],
              normal.y * cos[side] + binormal.y * sin[side],
              normal.z * cos[side] + binormal.z * sin[side],
            );
            uvs.setXY(i, side / sides, (t * length) / 42);
          }
        }
      }
      positions.needsUpdate = normals.needsUpdate = uvs.needsUpdate = true;
      anchor.position.copy(end);
      anchor.visible = time > 0.25;
      const spread = smooth(time, 0.25, 0.43);
      const settle = 1 + Math.sin((time - 0.27) * 22) * ringDown * 0.055;
      // Broad on desktop, but don't let the adhesive fan cover most of a phone.
      const attachmentDensity = Math.pow(Math.min(density, 1.05), 1.6);
      anchor.scale.setScalar(
        attachmentDensity *
          Math.max(0.001, spread) *
          settle *
          (1 - release * 0.12),
      );
      anchor.rotation.z =
        clamp(delta.x / Math.max(length, 1), -1, 1) * 0.045 * spread;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cable.dispose();
      patch.fibers.dispose();
      patch.wisps.dispose();
      patch.membrane.dispose();
      materials.forEach((material) => material.dispose());
      texture.dispose();
      group.clear();
    },
  };
}

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  CONTACT_TIME,
  PULL_DURATION,
  WEB_ATTACH_TIME,
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
} from "./motion";

/** Original, generated model. No downloaded meshes, textures, or movie assets. */
export interface SpiderCharacter {
  group: THREE.Group;
  webHand: THREE.Object3D;
  gripHand: THREE.Object3D;
  pose(time: number, pull: number, updateWorldMatrices?: boolean): void;
  dispose(): void;
}

type Profile = readonly (readonly [number, number, number])[];
type Surface = (t: number, angle: number) => THREE.Vector3;
type Weights = (p: THREE.Vector3) => [number, number, number];
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const smooth = (n: number) => THREE.MathUtils.smoothstep(n, 0, 1);

// Interpolated anatomical cross sections avoid the ball-and-cylinder silhouette.
function profileSurface(profile: Profile, centerX = 0, centerY = 0): Surface {
  return (t, angle) => {
    const at = clamp(t, 0, 1) * (profile.length - 1);
    const i = Math.min(Math.floor(at), profile.length - 2);
    const f = at - i;
    const value = (axis: number) => {
      const a = profile[Math.max(0, i - 1)][axis];
      const b = profile[i][axis];
      const c = profile[i + 1][axis];
      const d = profile[Math.min(profile.length - 1, i + 2)][axis];
      return (
        0.5 *
        (2 * b +
          (-a + c) * f +
          (2 * a - 5 * b + 4 * c - d) * f * f +
          (-a + 3 * b - 3 * c + d) * f * f * f)
      );
    };
    return new THREE.Vector3(
      centerX + Math.cos(angle) * Math.max(0.001, value(1)),
      centerY + value(0),
      Math.sin(angle) * Math.max(0.001, value(2)),
    );
  };
}

function surfaceGeometry(surface: Surface, rings = 44, sides = 40) {
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const ascending = surface(1, 0).y > surface(0, 0).y;
  for (let r = 0; r <= rings; r++) {
    for (let s = 0; s <= sides; s++) {
      positions.push(...surface(r / rings, (s / sides) * TAU).toArray());
      uvs.push(s / sides, r / rings);
      if (r < rings && s < sides) {
        const a = r * (sides + 1) + s,
          b = a + sides + 1;
        if (ascending) indices.push(a, b, a + 1, b, b + 1, a + 1);
        else indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function tube(points: THREE.Vector3[], radius: number, closed = false) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points, closed),
    Math.max(8, points.length * 2),
    radius,
    5,
    closed,
  );
}

function merge(parts: THREE.BufferGeometry[]) {
  const geometry = mergeGeometries(parts);
  parts.forEach((part) => part.dispose());
  if (!geometry) throw new Error("Unable to assemble character geometry");
  return geometry;
}

function fabricTexture() {
  // A deterministic microscopic knitted weave; shared by all suit panels.
  const size = 128,
    data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const diagonal = Math.sin(((x + (y % 8 < 4 ? y : -y)) * Math.PI) / 4);
      const warp = Math.sin((x * Math.PI) / 2) * Math.cos((y * Math.PI) / 2);
      const n = Math.round(140 + diagonal * 22 + warp * 17);
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = n;
      data[i + 3] = 255;
    }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 8);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createCharacter(): SpiderCharacter {
  const group = new THREE.Group();
  group.name = "Original woven spider suit";
  const weave = fabricTexture();
  const red = new THREE.Color("#aa1d28"),
    blue = new THREE.Color("#10294d");
  const suit = new THREE.MeshPhysicalMaterial({
    color: "white",
    vertexColors: true,
    roughness: 0.54,
    metalness: 0.1,
    bumpMap: weave,
    bumpScale: 0.0028,
    clearcoat: 0.15,
    clearcoatRoughness: 0.6,
    sheen: 0.7,
    sheenColor: new THREE.Color("#dfb8b3"),
    sheenRoughness: 0.8,
  });
  const crimson = suit.clone();
  crimson.vertexColors = false;
  crimson.color.copy(red);
  const webMaterial = new THREE.MeshStandardMaterial({
    color: "#25222a",
    roughness: 0.43,
    metalness: 0.34,
  });
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: "#3b131e",
    roughness: 0.75,
  });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: "#f4f4e9",
    roughness: 0.2,
    metalness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    emissive: "#b2c7d7",
    emissiveIntensity: 0.1,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: "#11121c",
    roughness: 0.34,
    metalness: 0.38,
  });
  const materials = [
    suit,
    crimson,
    webMaterial,
    seamMaterial,
    lensMaterial,
    rimMaterial,
  ];

  const bones: THREE.Bone[] = [];
  const bone = (
    name: string,
    parent: THREE.Object3D,
    x: number,
    y: number,
    z = 0,
  ) => {
    const result = new THREE.Bone();
    result.name = name;
    result.position.set(x, y, z);
    parent.add(result);
    bones.push(result);
    return result;
  };
  const pelvis = bone("pelvis", group, 0, 0);
  const spine = bone("lumbar", pelvis, 0, 0.22);
  const chest = bone("ribcage", spine, 0, 0.23);
  const neck = bone("neck", chest, 0, 0.19);
  const head = bone("head", neck, 0, 0.08);
  const leftArm = bone("grip shoulder", chest, -0.225, 0.105);
  const leftElbow = bone("grip elbow", leftArm, 0, -0.29);
  const leftWrist = bone("grip wrist", leftElbow, 0, -0.27);
  const rightArm = bone("web shoulder", chest, 0.225, 0.105);
  const rightElbow = bone("web elbow", rightArm, 0, -0.29);
  const rightWrist = bone("web wrist", rightElbow, 0, -0.27);
  const leftHip = bone("left hip", pelvis, -0.102, -0.01);
  const leftKnee = bone("left knee", leftHip, 0, -0.47);
  const leftAnkle = bone("left ankle", leftKnee, 0, -0.44);
  const rightHip = bone("right hip", pelvis, 0.102, -0.01);
  const rightKnee = bone("right knee", rightHip, 0, -0.47);
  const rightAnkle = bone("right ankle", rightKnee, 0, -0.44);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);

  const skin = (
    geometry: THREE.BufferGeometry,
    weights: Weights,
    material: THREE.Material,
  ) => {
    const position = geometry.getAttribute("position"),
      indices: number[] = [],
      values: number[] = [];
    const point = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i);
      const [a, b, blend] = weights(point);
      indices.push(a, b, 0, 0);
      values.push(1 - blend, blend, 0, 0);
    }
    geometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(indices, 4),
    );
    geometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(values, 4),
    );
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    mesh.bind(skeleton);
    return mesh;
  };
  const colorize = (
    geometry: THREE.BufferGeometry,
    isRed: (p: THREE.Vector3) => boolean,
  ) => {
    const position = geometry.getAttribute("position"),
      colors: number[] = [],
      p = new THREE.Vector3();
    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i);
      const color = isRed(p) ? red : blue;
      // Subtle muscle/shadow printing similar to woven practical costumes.
      const variation = 0.94 + 0.06 * Math.sin(p.y * 28) * Math.cos(p.x * 18);
      colors.push(
        color.r * variation,
        color.g * variation,
        color.b * variation,
      );
    }
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
  };

  const torsoBase = profileSurface([
    [-0.1, 0.065, 0.06],
    [-0.065, 0.128, 0.093],
    [0.03, 0.145, 0.106],
    [0.13, 0.125, 0.093],
    [0.23, 0.126, 0.086],
    [0.32, 0.159, 0.103],
    [0.42, 0.2, 0.125],
    [0.51, 0.222, 0.127],
    [0.56, 0.228, 0.1],
    [0.6, 0.155, 0.078],
    [0.64, 0.061, 0.062],
    [0.7, 0.056, 0.059],
  ]);
  const torso: Surface = (t, a) => {
    const p = torsoBase(t, a);
    const front = Math.max(0, Math.sin(a));
    // Paired pectorals, tapered obliques, and restrained rectus definition.
    const pec =
      Math.exp(-Math.pow((p.y - 0.465) / 0.069, 2)) *
      Math.exp(-Math.pow((Math.abs(p.x) - 0.098) / 0.07, 2));
    const abs =
      Math.exp(-Math.pow(p.x / 0.069, 4)) *
      Math.exp(-Math.pow((p.y - 0.28) / 0.12, 4)) *
      (0.5 + Math.cos(p.y * 79) * 0.5);
    p.z += front * (0.017 * pec + 0.006 * abs);
    return p;
  };
  const torsoWeights: Weights = (p) =>
    p.y < 0.25
      ? [0, 1, smooth((p.y - 0.07) / 0.18)]
      : p.y < 0.6
        ? [1, 2, smooth((p.y - 0.27) / 0.2)]
        : [2, 3, smooth((p.y - 0.6) / 0.1)];
  const torsoRed = (p: THREE.Vector3) =>
    p.y > 0.58 ||
    (p.y > 0.095 && p.y < 0.145) ||
    (p.y > 0.13 &&
      Math.abs(p.x) < (p.y > 0.4 ? 0.186 : 0.063 + (p.y - 0.13) * 0.24));
  skin(colorize(surfaceGeometry(torso, 72, 64), torsoRed), torsoWeights, suit);

  const raisedWeb = (
    surface: Surface,
    rings: number,
    spokes: number,
    radius: number,
    include: (p: THREE.Vector3) => boolean = () => true,
  ) => {
    const lines: THREE.BufferGeometry[] = [];
    const lift = (p: THREE.Vector3) =>
      new THREE.Vector3(p.x * 1.008, p.y, p.z * 1.023);
    for (let s = 0; s < spokes; s++) {
      let section: THREE.Vector3[] = [];
      for (let r = 1; r < 50; r++) {
        const p = surface(r / 50, (s / spokes) * TAU);
        if (include(p)) section.push(lift(p));
        else if (section.length > 1) {
          lines.push(tube(section, radius));
          section = [];
        } else section = [];
      }
      if (section.length > 1) lines.push(tube(section, radius));
    }
    for (let r = 1; r < rings; r++) {
      for (let s = 0; s < spokes; s++) {
        const points = Array.from({ length: 7 }, (_, k) => {
          const u = k / 6;
          return lift(
            surface(
              (r + Math.sin(u * Math.PI) * 0.21) / rings,
              ((s + u) / spokes) * TAU,
            ),
          );
        });
        if (points.every(include)) lines.push(tube(points, radius));
      }
    }
    return merge(lines);
  };
  skin(raisedWeb(torso, 14, 16, 0.0017, torsoRed), torsoWeights, webMaterial);

  // Tailored seams follow the red/blue boundary on both sides of the body.
  const torsoSeams: THREE.BufferGeometry[] = [];
  for (const side of [-1, 1])
    for (const face of [-1, 1]) {
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 90; step++) {
        const t = step / 90;
        const section = torso(t, 0);
        if (section.y <= 0.15 || section.y >= 0.58) continue;
        const boundary =
          section.y > 0.4 ? 0.186 : 0.063 + (section.y - 0.13) * 0.24;
        const angle = Math.acos(clamp(boundary / section.x, 0, 1));
        const p = torso(t, side > 0 ? angle * face : Math.PI - angle * face);
        p.multiply(new THREE.Vector3(1.01, 1, 1.025));
        points.push(p);
      }
      torsoSeams.push(tube(points, 0.0021));
    }
  skin(merge(torsoSeams), torsoWeights, seamMaterial);

  const armProfile: Profile = [
    [0.07, 0.004, 0.004],
    [0.025, 0.071, 0.069],
    [-0.035, 0.086, 0.079],
    [-0.11, 0.071, 0.082],
    [-0.2, 0.056, 0.064],
    [-0.27, 0.048, 0.048],
    [-0.31, 0.05, 0.049],
    [-0.38, 0.061, 0.062],
    [-0.46, 0.048, 0.052],
    [-0.535, 0.036, 0.035],
    [-0.58, 0.034, 0.028],
  ];
  const legProfile: Profile = [
    [0.06, 0.049, 0.067],
    [-0.015, 0.098, 0.109],
    [-0.1, 0.104, 0.11],
    [-0.22, 0.089, 0.096],
    [-0.36, 0.061, 0.069],
    [-0.45, 0.055, 0.055],
    [-0.49, 0.058, 0.059],
    [-0.59, 0.072, 0.075],
    [-0.71, 0.059, 0.064],
    [-0.83, 0.038, 0.043],
    [-0.925, 0.036, 0.041],
  ];
  for (const side of [-1, 1]) {
    const arm = profileSurface(armProfile, side * 0.225, 0.555);
    const base = side < 0 ? 5 : 8;
    const weights: Weights = (p) => {
      const d = 0.555 - p.y;
      return d < 0.43
        ? [base, base + 1, smooth((d - 0.235) / 0.105)]
        : [base + 1, base + 2, smooth((d - 0.5) / 0.08)];
    };
    const armRed = (p: THREE.Vector3) => p.y > 0.5 || p.y < 0.19 || p.z > 0.031;
    skin(colorize(surfaceGeometry(arm, 52, 32), armRed), weights, suit);
    skin(raisedWeb(arm, 15, 10, 0.00135, armRed), weights, webMaterial);
    const leg = profileSurface(legProfile, side * 0.102, -0.01);
    const hip = side < 0 ? 11 : 14;
    const legWeights: Weights = (p) => {
      const d = -p.y - 0.01;
      return d < 0.77
        ? [hip, hip + 1, smooth((d - 0.405) / 0.125)]
        : [hip + 1, hip + 2, smooth((d - 0.855) / 0.08)];
    };
    const legRed = (p: THREE.Vector3) => p.y < -0.56;
    skin(colorize(surfaceGeometry(leg, 60, 32), legRed), legWeights, suit);
    skin(raisedWeb(leg, 20, 10, 0.0015, legRed), legWeights, webMaterial);

    // Sculpted foot includes heel, instep and a rounded toe; no block-shaped boots.
    const foot = new THREE.SphereGeometry(1, 28, 18);
    const position = foot.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i),
        y = position.getY(i),
        z = position.getZ(i);
      position.setXYZ(
        i,
        x * (0.047 + z * 0.004),
        y * (0.039 - z * 0.011) - 0.059,
        z * 0.112 + 0.044,
      );
    }
    foot.computeVertexNormals();
    const boot = new THREE.Mesh(foot, crimson);
    (side < 0 ? leftAnkle : rightAnkle).add(boot);
    const sole = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 12),
      rimMaterial,
    );
    sole.scale.set(0.045, 0.009, 0.105);
    sole.position.set(0, -0.089, 0.044);
    (side < 0 ? leftAnkle : rightAnkle).add(sole);
  }

  const mask = profileSurface([
    [-0.049, 0.035, 0.045],
    [-0.031, 0.064, 0.071],
    [0.004, 0.084, 0.087],
    [0.047, 0.108, 0.098],
    [0.1, 0.116, 0.101],
    [0.158, 0.114, 0.106],
    [0.206, 0.093, 0.091],
    [0.237, 0.049, 0.052],
    [0.25, 0.002, 0.002],
  ]);
  const maskSurface: Surface = (t, a) => {
    const p = mask(t, a);
    // The bridge, brow and tapered jaw sit beneath fabric instead of a sphere.
    const nose =
      Math.exp(-Math.pow(p.x / 0.027, 2)) *
      Math.exp(-Math.pow((p.y - 0.056) / 0.04, 2));
    p.z += Math.max(0, Math.sin(a)) * nose * 0.018;
    return p;
  };
  const maskMesh = new THREE.Mesh(
    surfaceGeometry(maskSurface, 48, 56),
    crimson,
  );
  head.add(maskMesh);
  head.add(
    new THREE.Mesh(raisedWeb(maskSurface, 12, 18, 0.00155), webMaterial),
  );

  // Curved pear/almond lenses conform to the mask in all three axes.
  for (const side of [-1, 1]) {
    const outline = new THREE.Shape();
    outline.moveTo(0.018, 0.104);
    outline.bezierCurveTo(0.04, 0.116, 0.071, 0.137, 0.104, 0.15);
    outline.bezierCurveTo(0.102, 0.105, 0.091, 0.066, 0.059, 0.062);
    outline.bezierCurveTo(0.036, 0.062, 0.024, 0.08, 0.018, 0.104);
    const points = outline.getPoints(24);
    const projected = (x: number, y: number, offset: number) =>
      new THREE.Vector3(
        side * x,
        y,
        0.111 * Math.sqrt(Math.max(0.15, 1 - (x * x) / (0.122 * 0.122))) +
          offset,
      );
    const lens = new THREE.ShapeGeometry(outline, 24);
    const lp = lens.getAttribute("position");
    for (let i = 0; i < lp.count; i++) {
      const p = projected(lp.getX(i), lp.getY(i), 0.006);
      lp.setXYZ(i, p.x, p.y, p.z);
    }
    // Mirroring reverses winding; invert it for the left eye.
    if (side < 0 && lens.index) {
      for (let i = 0; i < lens.index.count; i += 3) {
        const a = lens.index.getX(i);
        lens.index.setX(i, lens.index.getX(i + 2));
        lens.index.setX(i + 2, a);
      }
    }
    lens.computeVertexNormals();
    head.add(new THREE.Mesh(lens, lensMaterial));
    const border = points.slice(0, -1).map((p) => projected(p.x, p.y, 0.006));
    head.add(new THREE.Mesh(tube(border, 0.0045, true), rimMaterial));
  }

  const emblem = (back: boolean) => {
    const pieces: THREE.BufferGeometry[] = [];
    const y = 0.465,
      z = back ? -0.134 : 0.147,
      scale = back ? 1.24 : 1;
    const body = new THREE.SphereGeometry(1, 16, 12);
    body.scale(0.012 * scale, 0.026 * scale, 0.005);
    body.translate(0, y, z);
    pieces.push(body);
    const smallHead = new THREE.SphereGeometry(0.01, 12, 8);
    smallHead.scale(0.75, 0.9, 0.45);
    smallHead.translate(0, y + 0.028 * scale, z);
    pieces.push(smallHead);
    for (const s of [-1, 1])
      for (let leg = 0; leg < 4; leg++) {
        const upper = leg < 2;
        const startY = y + (1.5 - leg) * 0.011 * scale;
        pieces.push(
          tube(
            [
              new THREE.Vector3(s * 0.006, startY, z),
              new THREE.Vector3(
                s * (0.025 + leg * 0.003) * scale,
                startY + (upper ? 0.025 : -0.014) * scale,
                z - (back ? -0.004 : 0.004),
              ),
              new THREE.Vector3(
                s * (0.037 + (leg % 2) * 0.012) * scale,
                y +
                  (upper ? 0.065 + leg * 0.011 : -0.072 - (leg - 2) * 0.01) *
                    scale,
                z - (back ? -0.014 : 0.014),
              ),
            ],
            0.0028,
          ),
        );
      }
    skin(merge(pieces), torsoWeights, back ? crimson : rimMaterial);
  };
  emblem(false);
  emblem(true);

  // Both hands use real curled digits. The returned nodes are palm attachment
  // points, so web and cloth use exactly the posed world-space hand position.
  const fingerRoots: {
    joint: THREE.Group;
    hand: number;
    digit: number;
    link: number;
  }[] = [];
  const hand = (wrist: THREE.Bone, index: number) => {
    const palmShape = profileSurface([
      [0.014, 0.032, 0.026],
      [-0.023, 0.037, 0.025],
      [-0.063, 0.043, 0.025],
      [-0.098, 0.04, 0.021],
      [-0.122, 0.031, 0.012],
    ]);
    wrist.add(new THREE.Mesh(surfaceGeometry(palmShape, 20, 20), crimson));
    wrist.add(new THREE.Mesh(raisedWeb(palmShape, 5, 8, 0.001), webMaterial));
    for (let digit = 0; digit < 5; digit++) {
      const thumb = digit === 4;
      let parent: THREE.Object3D = wrist;
      for (let link = 0; link < 3; link++) {
        const joint = new THREE.Group();
        joint.name = `${index === 0 ? "web" : "grip"} finger ${digit} joint ${link}`;
        if (link === 0)
          joint.position.set(
            thumb ? -0.04 : (digit - 1.5) * 0.021,
            thumb ? -0.055 : -0.106,
            0,
          );
        else joint.position.y = -(link === 1 ? 0.035 : 0.024);
        if (thumb && link === 0) joint.rotation.z = -0.7;
        const length = link === 0 ? 0.037 : link === 1 ? 0.027 : 0.023;
        const width = (thumb ? 0.012 : 0.009) * (1 - link * 0.13);
        const segment = profileSurface([
          [0.004, width * 0.7, width * 0.72],
          [-0.003, width, width * 0.84],
          [-length * 0.7, width * 0.85, width * 0.78],
          [-length, width * 0.3, width * 0.3],
        ]);
        joint.add(new THREE.Mesh(surfaceGeometry(segment, 8, 8), crimson));
        parent.add(joint);
        fingerRoots.push({ joint, hand: index, digit, link });
        parent = joint;
      }
    }
    const anchor = new THREE.Object3D();
    anchor.name = index === 0 ? "web palm anchor" : "cloth palm anchor";
    anchor.position.set(0, -0.102, 0.035);
    wrist.add(anchor);
    // Low-profile wrist mechanism and a tiny nozzle catch the key light.
    const cuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.037, 0.006, 6, 20),
      rimMaterial,
    );
    cuff.rotation.x = Math.PI / 2;
    cuff.scale.y = 0.8;
    cuff.position.y = -0.006;
    wrist.add(cuff);
    return anchor;
  };
  const webHand = hand(rightWrist, 0),
    gripHand = hand(leftWrist, 1);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Only the bones/finger joints animate. Their attached meshes keep the
      // same local transforms, so compose these once and still inherit every
      // parent world-matrix update normally.
      obj.updateMatrix();
      obj.matrixAutoUpdate = false;
    }
  });

  function pose(time: number, pull: number, updateWorldMatrices = true) {
    const p = clamp(pull, 0, 1);
    const entry = smooth(
      (time - WEB_ATTACH_TIME) / (CONTACT_TIME - WEB_ATTACH_TIME),
    );
    const reach = smooth((entry - 0.23) / 0.77);
    // Finish the readable tuck/kick while the actor is inside the viewport;
    // the sheet's remaining progress is its longer trailing exit.
    const action = clamp(
      (p * PULL_DURATION) /
        (WEB_RELEASE_TIME - CONTACT_TIME + WEB_RELEASE_DURATION * 0.6),
      0,
      1,
    );
    const release = smooth(
      (p * PULL_DURATION - (WEB_RELEASE_TIME - CONTACT_TIME)) /
        WEB_RELEASE_DURATION,
    );
    const load = Math.sin(smooth(action / 0.3) * Math.PI);
    const leftTuck =
      smooth(action / 0.23) * (1 - smooth((action - 0.27) / 0.35));
    const rightTuck =
      smooth((action - 0.11) / 0.25) * (1 - smooth((action - 0.42) / 0.34));
    const leftKick = smooth((action - 0.3) / 0.43);
    const rightKick = smooth((action - 0.5) / 0.43);
    const travel = smooth(p);
    // Secondary motion is deliberately smaller than the authored action. The
    // opposite timing of each leg makes the silhouette change, even head-on.
    const settle = Math.sin(time * 3.1) * 0.025;
    pelvis.rotation.set(
      0.04 * load,
      -0.08 * load + 0.1 * leftKick,
      0.08 * load - 0.1 * rightKick,
    );
    spine.rotation.set(
      -0.07 - load * 0.19 - travel * 0.08,
      0.09 + travel * 0.1,
      -0.17 * load + 0.05 * rightKick,
    );
    chest.rotation.set(
      -0.04 + load * 0.09 + travel * 0.07,
      -0.19 + travel * 0.28,
      0.1 * load - 0.09 * leftKick + settle,
    );
    neck.rotation.set(
      0.035 - 0.055 * load,
      -0.1 + travel * 0.14,
      0.025 - 0.05 * load,
    );
    head.rotation.set(
      0.035 - travel * 0.12,
      0.15 + reach * 0.1 + travel * 0.15,
      -0.045 + load * 0.1,
    );
    // The loaded shoulder drops and elbow flexes as the web takes his weight,
    // then opens as the body accelerates out of the bottom of the swing.
    rightArm.rotation.set(
      -0.22 - load * 0.19 + travel * 0.1 + release * 0.35,
      0.2 - load * 0.13,
      2.55 - load * 0.27 + leftKick * 0.18 - release * 0.85,
    );
    rightElbow.rotation.set(
      -0.27 - load * 0.31 + rightKick * 0.12,
      -0.1,
      0.3 + load * 0.55 - leftKick * 0.24 + release * 0.35,
    );
    rightWrist.rotation.set(
      -0.2 - load * 0.09 + release * 0.35,
      -0.08 + travel * 0.08,
      0.13 - load * 0.11,
    );
    // Reach behind the torso, absorb the sheet's load, and drive the elbow
    // backward. Keeping the palm behind the ribs preserves page contact while
    // the shoulders and legs visibly articulate in front of the opaque cloth.
    leftArm.rotation.set(
      0.5 - reach * 0.1 + load * 0.1,
      0.16 - travel * 0.3,
      -0.4 - reach * 0.73 + travel * 0.38 - load * 0.06,
    );
    leftElbow.rotation.set(
      0.36 + travel * 0.22 + load * 0.07,
      -0.12 - load * 0.07,
      0.48 - reach * 0.28 + load * 0.38 + travel * 0.36,
    );
    leftWrist.rotation.set(
      0.08 + travel * 0.12,
      0.1,
      0.18 + load * 0.12 + travel * 0.08,
    );
    // Long trailing legs on entry become an asymmetric compact tuck at the
    // bottom. The leading leg kicks through first; the trailing leg follows
    // later in the visible swing. Z rotation makes this action legible in projection
    // instead of hiding most of the knee movement along the camera's depth axis.
    leftHip.rotation.set(
      0.18 - entry * 0.78 - leftTuck * 0.83 + leftKick * 0.91,
      -0.12 - leftTuck * 0.13,
      -0.55 + entry * 0.09 - leftTuck * 0.23 + leftKick * 0.91,
    );
    leftKnee.rotation.set(
      0.22 + entry * 0.48 + leftTuck * 1.31 - leftKick * 0.47,
      -leftTuck * 0.08,
      0.04 + leftTuck * 0.14 - leftKick * 0.08,
    );
    leftAnkle.rotation.set(
      -0.16 - leftTuck * 0.25 + leftKick * 0.29,
      0.05,
      -0.1 + leftTuck * 0.1,
    );
    rightHip.rotation.set(
      0.15 - entry * 0.17 - rightTuck * 0.98 + rightKick * 0.63,
      0.14 + rightTuck * 0.12,
      -0.19 + entry * 0.43 + rightTuck * 0.47 - rightKick * 0.81,
    );
    rightKnee.rotation.set(
      0.16 + entry * 0.24 + rightTuck * 1.51 - rightKick * 0.18,
      rightTuck * 0.08,
      -0.04 - rightTuck * 0.13 + rightKick * 0.05,
    );
    rightAnkle.rotation.set(
      -0.2 - rightTuck * 0.3 + rightKick * 0.24,
      -0.06,
      0.07 - rightTuck * 0.1,
    );
    for (const finger of fingerRoots) {
      const grip =
        finger.hand === 0
          ? 0.83 - release * 0.72
          : 0.12 + smooth((reach - 0.7) / 0.3) * 0.81;
      finger.joint.rotation.x = -grip * (finger.link === 0 ? 0.85 : 1.15);
      if (finger.digit === 4)
        finger.joint.rotation.z = finger.link === 0 ? -0.8 : -0.28;
    }
    if (updateWorldMatrices) group.updateMatrixWorld(true);
  }
  pose(0, 0);
  return {
    group,
    webHand,
    gripHand,
    pose,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      weave.dispose();
      skeleton.dispose();
      group.clear();
    },
  };
}

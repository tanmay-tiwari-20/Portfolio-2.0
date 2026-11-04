import * as THREE from "three";

export type ClothQuality = "high" | "low";

export interface PageCloth {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
  update(dt: number, grip: THREE.Vector3, pull: number): void;
  dispose(): void;
}

const clamp = (value: number, low = 0, high = 1) =>
  Math.max(low, Math.min(high, value));

const smooth = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

/**
 * A viewport-sized, two-sided fabric sheet. Coordinates are CSS pixels, with
 * the camera facing -Z and the viewport center at the origin. Its material
 * retains the captured page's colors until the hand starts bending the sheet.
 *
 * The texture belongs to the caller: disposing a sheet never disposes its map.
 */
export function createPageCloth(
  texture: THREE.Texture,
  width: number,
  height: number,
  quality: ClothQuality,
): PageCloth {
  if (!(width > 0 && height > 0 && Number.isFinite(width + height))) {
    throw new RangeError(
      "Page cloth requires finite, positive viewport dimensions",
    );
  }

  const rows = quality === "high" ? 32 : 18;
  const columns = Math.round(
    clamp(
      (rows * width) / height,
      quality === "high" ? 20 : 12,
      quality === "high" ? 52 : 30,
    ),
  );
  const stride = columns + 1;
  const count = stride * (rows + 1);
  const gripRow = Math.round(rows * 0.55);
  const gripIndex = gripRow * stride;
  const gripY = -height * 0.05;
  const positions = new Float32Array(count * 3);
  const previous = new Float32Array(count * 3);
  const rest = new Float32Array(count * 3);
  const goals = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const mobility = new Float32Array(count);
  const indices: number[] = [];
  const edges: number[] = [];

  // A row lies exactly through the grip. The nonuniform last few pixels avoid
  // snapping the hand to an arbitrary nearest mesh vertex on smaller devices.
  for (let row = 0; row <= rows; row++) {
    const v =
      row <= gripRow
        ? (row / gripRow) * 0.55
        : 0.55 + ((row - gripRow) / (rows - gripRow)) * 0.45;
    for (let column = 0; column <= columns; column++) {
      const index = row * stride + column;
      const u = column / columns;
      positions[index * 3] = (u - 0.5) * width;
      positions[index * 3 + 1] = (0.5 - v) * height;
      uv[index * 2] = u;
      uv[index * 2 + 1] = 1 - v;
      if (row < rows && column < columns) {
        const next = index + stride;
        indices.push(index, next, index + 1, index + 1, next, next + 1);
      }
    }
  }
  rest.set(positions);
  previous.set(positions);

  const edge = (a: number, b: number, stiffness: number) => {
    const ax = rest[a * 3] - rest[b * 3];
    const ay = rest[a * 3 + 1] - rest[b * 3 + 1];
    edges.push(a, b, Math.hypot(ax, ay), stiffness);
  };
  for (let row = 0; row <= rows; row++) {
    for (let column = 0; column <= columns; column++) {
      const index = row * stride + column;
      if (column < columns) edge(index, index + 1, 0.92);
      if (row < rows) edge(index, index + stride, 0.92);
      if (row < rows && column < columns) {
        edge(index, index + stride + 1, 0.4);
        edge(index + 1, index + stride, 0.4);
      }
      // Weak bending constraints retain broad folds instead of a noisy mesh.
      if (column < columns - 1) edge(index, index + 2, 0.035);
      if (row < rows - 1) edge(index, index + stride * 2, 0.035);
    }
  }
  const constraints = new Float32Array(edges);
  const geometry = new THREE.BufferGeometry();
  const attribute = new THREE.BufferAttribute(positions, 3);
  attribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", attribute);
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      pageMap: { value: texture },
      bendAmount: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vClothNormal;
      varying float vDepth;
      void main() {
        vUv = uv;
        vClothNormal = normalize(normalMatrix * normal);
        vDepth = position.z;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D pageMap;
      uniform float bendAmount;
      varying vec2 vUv;
      varying vec3 vClothNormal;
      varying float vDepth;
      void main() {
        vec4 page = texture2D(pageMap, vUv);
        vec3 n = normalize(vClothNormal);
        if (!gl_FrontFacing) n = -n;
        vec3 light = normalize(vec3(-0.35, 0.55, 0.9));
        float diffuse = max(0.0, dot(n, light));
        float rim = pow(1.0 - abs(n.z), 3.0);
        float shade = 0.56 + 0.50 * diffuse;
        if (!gl_FrontFacing) shade *= 0.77;
        // No light/color change on the flat initial page, including white pages.
        vec3 color = page.rgb * mix(1.0, shade, bendAmount);
        color += vec3(0.085, 0.085, 0.095) * rim * bendAmount;
        gl_FragColor = vec4(color, page.a);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.DoubleSide,
    transparent: false,
    depthTest: true,
    depthWrite: true,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "outgoing-page-cloth";
  // The original bounds stop describing the sheet once it leaves the viewport.
  mesh.frustumCulled = false;
  const lastGrip = new THREE.Vector3(-width / 2, gripY, 0);
  const stepGrip = new THREE.Vector3();
  let lastPull = 0;
  let disposed = false;

  function pin(grip: THREE.Vector3) {
    const i = gripIndex * 3;
    positions[i] = grip.x;
    positions[i + 1] = grip.y;
    positions[i + 2] = grip.z;
  }

  function simulate(dt: number, grip: THREE.Vector3, pull: number) {
    const displacementX = grip.x + width / 2;
    const displacementY = grip.y - gripY;
    const damping = Math.pow(0.82, dt * 60);
    const settling = smooth(0.78, 1, pull);
    const attraction = (62 + settling * 120) * dt * dt;

    for (let index = 0; index < count; index++) {
      const i = index * 3;
      const u = uv[index * 2];
      const v = 1 - uv[index * 2 + 1];
      const verticalDistance = v - 0.55;
      const distance = Math.hypot(u * 0.8, verticalDistance * 0.9);
      const wave = smooth(distance * 0.22, 0.48 + distance * 0.22, pull);
      mobility[index] = wave;
      const gather = smooth(0.2 + distance * 0.13, 0.96, pull);
      const turn = gather * Math.PI;
      const foldPhase = u * Math.PI * 3.2 + verticalDistance * 2.7 - pull * 3;
      const foldAmplitude =
        Math.sin(u * Math.PI * 0.92) * width * 0.17 * gather;
      const curl = Math.sin(turn) * u * width * 0.2;
      const transverseFold = Math.sin(verticalDistance * 12 + u * 5 - pull * 9);
      const xOffset = u * width * (1 - gather * 1.58);
      const yOffset = -verticalDistance * height * (1 - gather * 0.16);
      const wrinkle =
        Math.sin(distance * 32 - pull * 27) * wave * (1 - gather * 0.6);

      // This moving rest surface describes the broad billow, while the solver
      // below supplies inertial lag, stretch limits and local grip puckering.
      // Its disturbance reaches distant/right-hand vertices later.
      goals[i] =
        rest[i] +
        wave *
          (displacementX +
            xOffset -
            u * width +
            Math.sin(foldPhase) * foldAmplitude * 0.14);
      goals[i + 1] =
        rest[i + 1] +
        wave *
          (displacementY +
            yOffset +
            verticalDistance * height -
            Math.sin(u * Math.PI) * height * 0.075 * gather +
            transverseFold * height * 0.018 * gather);
      goals[i + 2] =
        wave *
        (grip.z +
          curl +
          Math.sin(foldPhase) * foldAmplitude +
          wrinkle * Math.min(width, height) * 0.014 +
          Math.sin(verticalDistance * 15 + u * 5) * height * 0.025 * gather);

      if (wave < 0.00001) {
        positions[i] = previous[i] = rest[i];
        positions[i + 1] = previous[i + 1] = rest[i + 1];
        positions[i + 2] = previous[i + 2] = 0;
        continue;
      }

      for (let axis = 0; axis < 3; axis++) {
        const component = i + axis;
        const current = positions[component];
        const velocity = (current - previous[component]) * damping;
        previous[component] = current;
        positions[component] =
          current + velocity + (goals[component] - current) * attraction;
      }
      positions[i + 1] -= height * 0.4 * dt * dt * wave;
    }

    pin(grip);
    const iterations = quality === "high" ? 4 : 3;
    for (let iteration = 0; iteration < iterations; iteration++) {
      for (let edgeIndex = 0; edgeIndex < constraints.length; edgeIndex += 4) {
        const a = constraints[edgeIndex];
        const b = constraints[edgeIndex + 1];
        const ai = a * 3;
        const bi = b * 3;
        const ax = positions[bi] - positions[ai];
        const ay = positions[bi + 1] - positions[ai + 1];
        const az = positions[bi + 2] - positions[ai + 2];
        const length = Math.sqrt(ax * ax + ay * ay + az * az);
        if (length < 0.00001) continue;
        const restLength = constraints[edgeIndex + 2];
        const stiffness = constraints[edgeIndex + 3];
        // Fabric resists extension but can compress into a fold. Short edges
        // retain a little stiffness to avoid collapsing to zero-area triangles.
        const compression = length < restLength ? 0.2 : 1;
        const correction =
          ((length - restLength) / length) * stiffness * compression;
        const aWeight = a === gripIndex ? 0 : mobility[a];
        const bWeight = b === gripIndex ? 0 : mobility[b];
        const total = aWeight + bWeight;
        if (total === 0) continue;
        const aShare = (correction * aWeight) / total;
        const bShare = (correction * bWeight) / total;
        positions[ai] += ax * aShare;
        positions[ai + 1] += ay * aShare;
        positions[ai + 2] += az * aShare;
        positions[bi] -= ax * bShare;
        positions[bi + 1] -= ay * bShare;
        positions[bi + 2] -= az * bShare;
      }
      pin(grip);
    }

    // Once the bundle is leaving, converge to its gathered rest surface. This
    // also makes a skipped/hidden-tab final frame deterministic without a
    // lingering fabric corner. It does not alter the visible initial peel.
    const exitConvergence = smooth(0.84, 1, pull);
    if (exitConvergence > 0) {
      for (let i = 0; i < positions.length; i++) {
        positions[i] += (goals[i] - positions[i]) * exitConvergence;
      }
      pin(grip);
    }
  }

  return {
    mesh,
    update(dt, grip, pull) {
      if (disposed || !Number.isFinite(dt + pull + grip.x + grip.y + grip.z))
        return;
      const progress = clamp(pull);
      if (progress === 0) {
        positions.set(rest);
        previous.set(rest);
        lastGrip.set(-width / 2, gripY, 0);
        lastPull = 0;
      } else {
        // Bound catch-up work after tab suspension and avoid unstable large
        // integration steps. Grip interpolation prevents frame-sized impulses.
        const boundedDt = clamp(dt, 1 / 240, 1 / 15);
        const steps = Math.min(4, Math.ceil(boundedDt / (1 / 50)));
        for (let step = 1; step <= steps; step++) {
          const fraction = step / steps;
          stepGrip.lerpVectors(lastGrip, grip, fraction);
          simulate(
            boundedDt / steps,
            stepGrip,
            lastPull + (progress - lastPull) * fraction,
          );
        }
        lastGrip.copy(grip);
        lastPull = progress;
      }
      material.uniforms.bendAmount.value = smooth(0, 0.13, progress);
      attribute.needsUpdate = true;
      geometry.computeVertexNormals();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      geometry.dispose();
      material.dispose();
    },
  };
}

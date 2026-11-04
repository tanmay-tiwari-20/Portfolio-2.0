import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createCharacter } from "../components/animations/spider-transition/character";
import { createPageCloth } from "../components/animations/spider-transition/cloth";
import {
  CONTACT_TIME,
  DURATION,
  PULL_DURATION,
  WEB_ATTACH_TIME,
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
  sampleSwing,
} from "../components/animations/spider-transition/motion";

const viewports = [
  [320, 568],
  [390, 844],
  [768, 1024],
  [1366, 768],
  [1440, 900],
  [3440, 1440],
] as const;

const characterScale = (width: number, height: number) =>
  Math.min(height * 0.22, width * 0.22, 195);

const close = (actual: number, expected: number, tolerance = 0.001) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`);

test("the authored swing reaches the real page edge continuously and moves beyond its trailing width", () => {
  for (const [width, height] of viewports) {
    const scale = characterScale(width, height);
    const contact = sampleSwing(CONTACT_TIME, width, height, scale);
    assert.equal(contact.pull, 0);
    close(contact.grip[0], -width / 2);
    close(contact.grip[1], -height * 0.05);
    assert.equal(contact.grip[2], 0);
    for (const boundary of [
      WEB_ATTACH_TIME,
      CONTACT_TIME,
      WEB_RELEASE_TIME,
      CONTACT_TIME + PULL_DURATION,
    ]) {
      const before = sampleSwing(boundary - 0.000001, width, height, scale);
      const after = sampleSwing(boundary + 0.000001, width, height, scale);
      for (let axis = 0; axis < 3; axis++) {
        close(before.grip[axis], after.grip[axis], 0.01);
        close(before.rotation[axis], after.rotation[axis], 0.0001);
      }
    }
    let previousX = -Infinity;
    for (let frame = 0; frame <= 210; frame++) {
      const motion = sampleSwing(frame / 60, width, height, scale);
      assert.ok(
        motion.grip[0] >= previousX,
        "the hand must not reverse across the page",
      );
      assert.ok(motion.pull >= 0 && motion.pull <= 1);
      assert.ok([...motion.grip, ...motion.rotation].every(Number.isFinite));
      assert.ok(
        motion.rotation[1] < 0,
        "keep the torso on the camera side of the grip",
      );
      previousX = motion.grip[0];
    }
    const exit = sampleSwing(DURATION, width, height, scale);
    assert.equal(exit.pull, 1);
    assert.ok(
      exit.grip[0] >= width * 1.4,
      "the entire trailing sheet needs room to exit",
    );
  }
});

test("the grab keeps momentum and the web releases into continuous tangent flight", () => {
  const delta = 0.0001;
  for (const [width, height] of viewports) {
    const scale = characterScale(width, height);
    const point = (time: number) =>
      new THREE.Vector3(...sampleSwing(time, width, height, scale).grip);
    for (const time of [CONTACT_TIME, WEB_RELEASE_TIME]) {
      const p = point(time);
      const incoming = p
        .clone()
        .sub(point(time - delta))
        .divideScalar(delta);
      const outgoing = point(time + delta)
        .sub(p)
        .divideScalar(delta);
      assert.ok(
        incoming.x > width * 0.25,
        "contact and release must not stop the horizontal motion",
      );
      assert.ok(
        incoming.distanceTo(outgoing) < width * 0.005,
        "position continuity alone is insufficient: velocity must also match",
      );
    }
    const contact = point(CONTACT_TIME);
    const release = point(WEB_RELEASE_TIME);
    assert.ok(
      release.x > width * 0.4 && release.x < width * 0.5,
      "release the loaded web at the right edge rather than stretching it offscreen",
    );
    let lowest = Infinity;
    let fastest = 0;
    for (let time = CONTACT_TIME; time < WEB_RELEASE_TIME; time += 0.01) {
      lowest = Math.min(lowest, point(time).y);
      fastest = Math.max(
        fastest,
        point(time + delta).sub(point(time)).x / delta,
      );
    }
    assert.ok(
      lowest < contact.y - height * 0.15,
      "swing must visibly descend through a low arc",
    );
    const contactVX = point(CONTACT_TIME + delta).sub(contact).x / delta;
    assert.ok(
      fastest > contactVX * 1.8,
      "the actor must accelerate through the bottom",
    );
    const firstVelocity = point(WEB_RELEASE_TIME + 0.1 + delta)
      .sub(point(WEB_RELEASE_TIME + 0.1))
      .divideScalar(delta);
    const laterVelocity = point(WEB_RELEASE_TIME + 0.6 + delta)
      .sub(point(WEB_RELEASE_TIME + 0.6))
      .divideScalar(delta);
    close(firstVelocity.x, laterVelocity.x, 0.01);
    assert.ok(
      laterVelocity.y < firstVelocity.y,
      "airborne motion should fall under gravity",
    );
  }
  assert.ok(
    WEB_RELEASE_TIME + WEB_RELEASE_DURATION < CONTACT_TIME + PULL_DURATION,
  );
});

test("the posed hand stays attached and the actual scene trajectory clears the cloth at every viewport", () => {
  const character = createCharacter();
  const palm = new THREE.Vector3();
  const target = new THREE.Vector3();
  try {
    for (const [width, height] of viewports) {
      const scale = characterScale(width, height);
      character.group.scale.setScalar(scale);
      const texture = new THREE.Texture();
      const cloth = createPageCloth(
        texture,
        width,
        height,
        width < 700 ? "low" : "high",
      );
      try {
        const uv = cloth.mesh.geometry.getAttribute("uv");
        const position = cloth.mesh.geometry.getAttribute("position");
        let pin = -1;
        for (let i = 0; i < uv.count; i++) {
          if (uv.getX(i) === 0 && Math.abs(uv.getY(i) - 0.45) < 0.00001)
            pin = i;
        }
        assert.ok(pin >= 0);
        for (let frame = 0; frame <= Math.ceil(DURATION * 60); frame++) {
          const time = frame / 60;
          const motion = sampleSwing(time, width, height, scale);
          character.pose(time, motion.pull);
          character.group.rotation.set(...motion.rotation);
          character.group.position.set(0, 0, 0);
          character.group.updateMatrixWorld(true);
          character.gripHand.getWorldPosition(palm);
          target.fromArray(motion.grip);
          character.group.position.copy(target).sub(palm);
          character.group.updateMatrixWorld(true);
          character.gripHand.getWorldPosition(palm);
          assert.ok(
            palm.distanceTo(target) < 0.00001,
            "rig articulation must preserve the world-space grasp",
          );
          cloth.update(1 / 60, palm, motion.pull);
          if (motion.pull > 0) {
            close(position.getX(pin), palm.x);
            close(position.getY(pin), palm.y);
            close(position.getZ(pin), palm.z);
          }
          for (let i = 0; i < position.count; i++) {
            assert.ok(
              Number.isFinite(
                position.getX(i) + position.getY(i) + position.getZ(i),
              ),
            );
            assert.ok(
              Math.abs(position.getZ(i)) < 4900,
              "fabric must stay inside the orthographic camera depth",
            );
            if (time >= CONTACT_TIME + PULL_DURATION) {
              assert.ok(
                position.getX(i) > width / 2,
                "the completed route cannot retain a visible page fragment",
              );
            }
          }
        }
      } finally {
        cloth.dispose();
        texture.dispose();
      }
    }
  } finally {
    character.dispose();
  }
});

test("the face and chest remain in front of the opaque cloth during the visible pull", () => {
  const character = createCharacter();
  const palm = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3(0, 0, -1);
  // Points on the front of the model's mask and ribcage, in their bone frames.
  const landmarks: [string, THREE.Vector3][] = [
    ["head", new THREE.Vector3(0, 0.1, 0.103)],
    ["ribcage", new THREE.Vector3(0, 0.03, 0.14)],
  ];
  let checked = 0;
  try {
    for (const [width, height] of viewports) {
      const scale = characterScale(width, height);
      character.group.scale.setScalar(scale);
      const texture = new THREE.Texture();
      const cloth = createPageCloth(
        texture,
        width,
        height,
        width < 700 ? "low" : "high",
      );
      try {
        for (let frame = 0; frame <= 150; frame++) {
          const time = frame / 60;
          const motion = sampleSwing(time, width, height, scale);
          character.pose(time, motion.pull);
          character.group.rotation.set(...motion.rotation);
          character.group.position.set(0, 0, 0);
          character.group.updateMatrixWorld(true);
          character.gripHand.getWorldPosition(palm);
          character.group.position.fromArray(motion.grip).sub(palm);
          character.group.updateMatrixWorld(true);
          character.gripHand.getWorldPosition(palm);
          cloth.update(1 / 60, palm, motion.pull);
          if (motion.pull === 0 || frame % 6 !== 0) continue;
          cloth.mesh.geometry.computeBoundingSphere();
          for (const [name, point] of landmarks) {
            const bone = character.group.getObjectByName(name)!;
            const world = bone.localToWorld(point.clone());
            if (Math.abs(world.x) > width / 2 || Math.abs(world.y) > height / 2)
              continue;
            ray.set(new THREE.Vector3(world.x, world.y, 5000), rayDirection);
            const hit = ray.intersectObject(cloth.mesh)[0];
            assert.ok(
              !hit || world.z > hit.point.z,
              `${name} is hidden by the cloth at ${width}×${height}, t=${time.toFixed(2)}: face z=${world.z.toFixed(1)}, sheet z=${hit?.point.z.toFixed(1)}`,
            );
            checked++;
          }
        }
      } finally {
        cloth.dispose();
        texture.dispose();
      }
    }
    assert.ok(
      checked > 50,
      "visibility regression must cover the visible swing, not only offscreen poses",
    );
  } finally {
    character.dispose();
  }
});

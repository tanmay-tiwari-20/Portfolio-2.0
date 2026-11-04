import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createCharacter } from "../components/animations/spider-transition/character";
import {
  CONTACT_TIME,
  PULL_DURATION,
  WEB_ATTACH_TIME,
  WEB_RELEASE_TIME,
  WEB_RELEASE_DURATION,
} from "../components/animations/spider-transition/motion";

const projectedDistance = (a: THREE.Vector3, b: THREE.Vector3) =>
  Math.hypot(a.x - b.x, a.y - b.y);

test("the limbs visibly compress and kick in staggered phases without moving the actor root", () => {
  const actor = createCharacter();
  // A fixed camera-facing orientation: measured motion can only come from the rig.
  actor.group.rotation.set(0.08, -0.5, 0);
  const sample = (pull: number) => {
    actor.pose(CONTACT_TIME + PULL_DURATION * pull, pull);
    const position = (name: string) =>
      actor.group.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
    return {
      left: position("left ankle"),
      right: position("right ankle"),
      chest: actor.group.getObjectByName("ribcage")!.quaternion.clone(),
      elbow: actor.group.getObjectByName("web elbow")!.quaternion.clone(),
    };
  };
  try {
    const contact = sample(0),
      tuck = sample(0.13),
      drive = sample(0.41),
      exit = sample((WEB_RELEASE_TIME - CONTACT_TIME) / PULL_DURATION);
    assert.ok(
      tuck.left.y - contact.left.y > 0.25,
      "leading knee should visibly compress toward the torso",
    );
    assert.ok(
      projectedDistance(tuck.left, drive.left) > 0.45,
      "leading leg must move over 80 desktop pixels through the tuck/kick, not only along depth",
    );
    assert.ok(
      projectedDistance(sample(0.21).right, exit.right) > 0.28,
      "trailing leg must also change its projected silhouette",
    );
    assert.ok(
      contact.elbow.angleTo(sample(0.08).elbow) > 0.45,
      "the web elbow must visibly absorb the initial load",
    );
    assert.ok(
      contact.chest.angleTo(sample(0.08).chest) > 0.1,
      "the ribcage must counterrotate through the swing",
    );

    let leftPeak = 0,
      rightPeak = 0,
      leftY = -Infinity,
      rightY = -Infinity;
    for (let step = 0; step <= 50; step++) {
      const pull = step / 100;
      const pose = sample(pull);
      if (pose.left.y > leftY) {
        leftY = pose.left.y;
        leftPeak = pull;
      }
      if (pose.right.y > rightY) {
        rightY = pose.right.y;
        rightPeak = pull;
      }
    }
    assert.ok(
      rightPeak - leftPeak >= 0.035,
      "the legs must not tuck and extend in synchronized lockstep",
    );
    assert.deepEqual(actor.group.position.toArray(), [0, 0, 0]);
  } finally {
    actor.dispose();
  }
});

test("the actual skinned suit and renderer palette follow the articulated legs", () => {
  const actor = createCharacter();
  let leg: THREE.SkinnedMesh | undefined;
  let vertex = -1;
  actor.group.traverse((object) => {
    if (!(object instanceof THREE.SkinnedMesh) || leg) return;
    const indices = object.geometry.getAttribute("skinIndex");
    const weights = object.geometry.getAttribute("skinWeight");
    for (let index = 0; index < indices.count; index++) {
      if (indices.getY(index) === 13 && weights.getY(index) > 0.9) {
        leg = object;
        vertex = index;
        break;
      }
    }
  });
  assert.ok(
    leg && vertex >= 0,
    "test the woven ankle surface, not only a rigid foot prop",
  );
  const mesh = leg;
  const renderedVertex = () => {
    // This is the same palette update Three's WebGLObjects performs once each
    // rendered frame. Compare the shader's weighted matrices to CPU skinning.
    mesh.skeleton.update();
    const boneMatrices = mesh.skeleton.boneMatrices;
    assert.ok(
      boneMatrices,
      "the rendered skeleton must retain its matrix palette",
    );
    const base = new THREE.Vector3()
      .fromBufferAttribute(mesh.geometry.getAttribute("position"), vertex)
      .applyMatrix4(mesh.bindMatrix);
    const indices = mesh.geometry.getAttribute("skinIndex"),
      weights = mesh.geometry.getAttribute("skinWeight");
    const result = new THREE.Vector3(),
      matrix = new THREE.Matrix4();
    for (let influence = 0; influence < 4; influence++) {
      const bone = indices.getComponent(vertex, influence),
        weight = weights.getComponent(vertex, influence);
      if (!weight) continue;
      matrix.fromArray(boneMatrices, bone * 16);
      result.addScaledVector(base.clone().applyMatrix4(matrix), weight);
    }
    result.applyMatrix4(mesh.bindMatrixInverse);
    assert.ok(
      result.distanceTo(mesh.getVertexPosition(vertex, new THREE.Vector3())) <
        0.00001,
      "rendered bone palette and CPU deformation must agree",
    );
    return result;
  };
  try {
    actor.pose(CONTACT_TIME + PULL_DURATION * 0.13, 0.13);
    const tucked = renderedVertex();
    const palette = mesh.skeleton.boneMatrices?.slice();
    assert.ok(palette);
    actor.pose(CONTACT_TIME + PULL_DURATION * 0.41, 0.41);
    const driven = renderedVertex();
    const drivenPalette = mesh.skeleton.boneMatrices;
    assert.ok(drivenPalette);
    assert.ok(
      projectedDistance(tucked, driven) > 0.35,
      "the suit vertices themselves must animate by a clearly visible amount",
    );
    assert.ok(
      palette.some(
        (value, index) => Math.abs(value - drivenPalette[index]) > 0.25,
      ),
      "the render palette cannot remain in one frozen pose",
    );
  } finally {
    actor.dispose();
  }
});

test("swing articulation remains continuous, finite and connected during entry and route holds", () => {
  const actor = createCharacter();
  const bones: THREE.Bone[] = [];
  actor.group.traverse((object) => {
    if (object instanceof THREE.Bone) bones.push(object);
  });
  const previous = new Map<THREE.Bone, THREE.Quaternion>();
  const palm = new THREE.Vector3();
  try {
    for (let frame = 0; frame <= 250; frame++) {
      const time = frame / 75;
      const pull = THREE.MathUtils.clamp(
        (time - CONTACT_TIME) / PULL_DURATION,
        0,
        1,
      );
      actor.pose(time, pull);
      for (const bone of bones) {
        assert.ok(bone.matrixWorld.elements.every(Number.isFinite));
        const prior = previous.get(bone);
        if (prior)
          assert.ok(
            prior.angleTo(bone.quaternion) < 0.13,
            `${bone.name} jumps between consecutive poses`,
          );
        previous.set(bone, bone.quaternion.clone());
      }
      actor.gripHand.getWorldPosition(palm);
      assert.ok(palm.toArray().every(Number.isFinite));
      if (time >= CONTACT_TIME)
        assert.ok(
          palm.z < 0,
          "the grabbing hand stays behind the body so the sheet cannot obscure the torso",
        );
    }
    for (const boundary of [WEB_ATTACH_TIME, CONTACT_TIME]) {
      actor.pose(boundary - 1e-6, 0);
      const before = actor.gripHand.getWorldPosition(new THREE.Vector3());
      actor.pose(boundary + 1e-6, 0);
      const after = actor.gripHand.getWorldPosition(new THREE.Vector3());
      assert.ok(before.distanceTo(after) < 0.00001);
    }
    actor.pose(CONTACT_TIME + 4, 0);
    assert.ok(
      actor.webHand.getWorldPosition(palm).toArray().every(Number.isFinite),
    );
  } finally {
    actor.dispose();
  }
});

test("the web hand opens on release while the cloth grasp survives and route holds keep their web", () => {
  const actor = createCharacter();
  const webFinger = actor.group.getObjectByName("web finger 0 joint 0")!;
  const clothFinger = actor.group.getObjectByName("grip finger 0 joint 0")!;
  const shoulder = actor.group.getObjectByName("web shoulder")!;
  try {
    const releasePull = (WEB_RELEASE_TIME - CONTACT_TIME) / PULL_DURATION;
    actor.pose(WEB_RELEASE_TIME, releasePull);
    const closedWeb = webFinger.rotation.x;
    const closedCloth = clothFinger.rotation.x;
    const loadedShoulder = shoulder.quaternion.clone();
    actor.pose(
      WEB_RELEASE_TIME + WEB_RELEASE_DURATION,
      releasePull + WEB_RELEASE_DURATION / PULL_DURATION,
    );
    assert.ok(
      webFinger.rotation.x - closedWeb > 0.5,
      "the fingers must visibly release the strand",
    );
    assert.ok(
      loadedShoulder.angleTo(shoulder.quaternion) > 0.75,
      "the released arm needs a visible follow-through",
    );
    assert.ok(
      Math.abs(clothFinger.rotation.x - closedCloth) < 0.00001,
      "the other hand must keep its grip on the sheet",
    );
    actor.pose(CONTACT_TIME + 6, 0);
    assert.ok(
      Math.abs(webFinger.rotation.x - closedWeb) < 0.00001,
      "elapsed idle time cannot release the web before route preparation finishes",
    );
  } finally {
    actor.dispose();
  }
});

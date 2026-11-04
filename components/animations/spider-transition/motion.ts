export const CONTACT_TIME = 1.05;
export const DURATION = 3.45;
// Keep the choreography intact; 0.8x playback makes the sequence last ~4.3s.
export const PLAYBACK_RATE = 0.8;
export const PULL_DURATION = 2;
export const WEB_ATTACH_TIME = 0.27;
export const WEB_RELEASE_TIME = CONTACT_TIME + PULL_DURATION * 0.48;
export const WEB_RELEASE_DURATION = 0.24;

export interface SwingFrame {
  pull: number;
  grip: [number, number, number];
  rotation: [number, number, number];
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));
function hermite(
  start: number,
  end: number,
  startVelocity: number,
  endVelocity: number,
  t: number,
  duration: number,
) {
  const t2 = t * t,
    t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * start +
    (t3 - 2 * t2 + t) * startVelocity * duration +
    (-2 * t3 + 3 * t2) * end +
    (t3 - t2) * endVelocity * duration
  );
}

/**
 * The world-space palm trajectory, independent of rendering and the rig pose.
 * The scene subtracts the posed palm's local world offset from this position,
 * so articulation never separates the grabbing hand from the cloth vertex.
 */
export function sampleSwing(
  time: number,
  width: number,
  height: number,
  scale: number,
): SwingFrame {
  const pull = clamp((time - CONTACT_TIME) / PULL_DURATION);
  const arc = Math.sin(pull * Math.PI);
  // A framed projection of a swing plane: the hand descends into the arc,
  // passes its low point with momentum, and leaves on the rising tangent.
  const startAngle = -1,
    releaseAngle = 0.54;
  const radiusX = (width * 0.58) / -Math.sin(startAngle);
  const radiusY = height * 0.38;
  const pivotX = width * 0.08;
  const pivotY = -height * 0.05 + radiusY * Math.cos(startAngle);
  const swingDuration = WEB_RELEASE_TIME - CONTACT_TIME;
  const angleDistance = releaseAngle - startAngle;
  const phase = clamp((time - CONTACT_TIME) / swingDuration);
  // Nonzero contact/release velocity, with acceleration through the low arc.
  const swept =
    0.65 * phase + 0.7 * phase * phase - 0.35 * phase * phase * phase;
  const angle = startAngle + angleDistance * swept;
  const contactSpeed = (angleDistance * 0.65) / swingDuration;
  const releaseSpeed = angleDistance / swingDuration;
  const contactVX = radiusX * Math.cos(startAngle) * contactSpeed;
  const contactVY = radiusY * Math.sin(startAngle) * contactSpeed;
  const grip: SwingFrame["grip"] = [
    pivotX + radiusX * Math.sin(angle),
    pivotY - radiusY * Math.cos(angle),
    arc * arc * scale * 0.55,
  ];
  let roll = angle * 0.65;

  if (time < CONTACT_TIME) {
    const duration = CONTACT_TIME - WEB_ATTACH_TIME;
    const approach = clamp((time - WEB_ATTACH_TIME) / duration);
    const startX = -width / 2 - Math.max(width * 0.32, scale * 2.5);
    grip[0] = hermite(
      startX,
      -width / 2,
      width * 0.3,
      contactVX,
      approach,
      duration,
    );
    grip[1] = hermite(
      height * 0.29,
      -height * 0.05,
      -height * 0.4,
      contactVY,
      approach,
      duration,
    );
    grip[2] = 0;
    roll = hermite(
      -1.05,
      startAngle * 0.65,
      0.22,
      contactSpeed * 0.65,
      approach,
      duration,
    );
  } else if (time > WEB_RELEASE_TIME) {
    const flight = Math.min(
      time - WEB_RELEASE_TIME,
      CONTACT_TIME + PULL_DURATION - WEB_RELEASE_TIME,
    );
    grip[0] =
      pivotX +
      radiusX * Math.sin(releaseAngle) +
      radiusX * Math.cos(releaseAngle) * releaseSpeed * flight;
    grip[1] =
      pivotY -
      radiusY * Math.cos(releaseAngle) +
      radiusY * Math.sin(releaseAngle) * releaseSpeed * flight -
      height * 0.04 * flight * flight;
    // Angular momentum continues after release and gradually damps in flight.
    roll =
      releaseAngle * 0.65 +
      (releaseSpeed * 0.65 * (1 - Math.exp(-flight * 1.4))) / 1.4;
  }

  return {
    pull,
    grip,
    rotation: [
      0.1 * arc,
      // Rotate the torso toward the camera while its palm remains on the sheet.
      // The opposite yaw puts the head and chest behind the opaque cloth.
      -0.28 - 0.36 * arc,
      roll,
    ],
  };
}

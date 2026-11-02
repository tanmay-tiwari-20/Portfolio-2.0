/**
 * Original pen artwork for Tanmay Tiwari, drawn as connected cubic gestures.
 * The filled contours retain pressure variation while each centerline can be
 * used as a reveal mask. No font, canvas measurement, or network asset is used.
 */
type Point = readonly [number, number];
type Curve = readonly [number, number, number, number, number, number];

type PenGesture = {
  id: string;
  start: Point;
  curves: readonly Curve[];
  duration: number;
  delay?: number;
  weight?: number;
};

export type SignatureStroke = {
  id: string;
  path: string;
  ink: string;
  /** Time in milliseconds, excluding the preceding pen lift. */
  duration: number;
  /** Pen lift in milliseconds before this gesture. */
  delay: number;
};

export const SIGNATURE_WIDTH = 670;
export const SIGNATURE_HEIGHT = 190;
export const SIGNATURE_VIEWBOX = `0 0 ${SIGNATURE_WIDTH} ${SIGNATURE_HEIGHT}`;

const gestures: readonly PenGesture[] = [
  {
    id: "first-t-crossbar",
    start: [25, 53],
    curves: [
      [39, 29, 82, 27, 110, 30],
      [129, 32, 146, 33, 158, 27],
    ],
    duration: 330,
    weight: 0.86,
  },
  {
    id: "first-t-downstroke",
    start: [106, 30],
    curves: [
      [98, 50, 76, 98, 67, 122],
      [60, 142, 73, 128, 91, 105],
    ],
    duration: 270,
    delay: 35,
  },
  {
    id: "anmay",
    start: [93, 104],
    curves: [
      // a: the counter closes before the exit stroke returns to the baseline.
      [101, 92, 112, 80, 123, 84],
      [134, 89, 121, 108, 111, 110],
      [97, 113, 102, 91, 125, 86],
      [125, 91, 115, 109, 122, 112],
      [128, 115, 136, 99, 142, 87],
      // n
      [136, 103, 133, 119, 142, 104],
      [150, 89, 157, 85, 160, 91],
      [164, 97, 149, 114, 160, 113],
      [166, 112, 173, 96, 180, 85],
      // m
      [174, 99, 168, 120, 180, 101],
      [190, 84, 197, 82, 197, 90],
      [196, 96, 184, 117, 194, 105],
      [204, 86, 213, 83, 215, 90],
      [217, 97, 202, 112, 212, 111],
      [218, 110, 223, 98, 231, 89],
      // a
      [240, 79, 253, 79, 254, 87],
      [255, 94, 244, 109, 237, 106],
      [226, 102, 238, 83, 256, 83],
      [252, 95, 246, 108, 254, 109],
      [261, 110, 269, 93, 274, 84],
      // y: a looped descender returns into a light terminal.
      [269, 96, 263, 110, 272, 106],
      [281, 101, 287, 86, 290, 81],
      [283, 103, 273, 136, 257, 151],
      [244, 163, 245, 143, 261, 133],
      [278, 121, 305, 106, 321, 86],
    ],
    duration: 1040,
    delay: 25,
  },
  {
    id: "second-t-crossbar",
    start: [343, 47],
    curves: [
      [363, 29, 400, 31, 425, 33],
      [441, 34, 456, 32, 468, 27],
    ],
    duration: 260,
    delay: 140,
    weight: 0.86,
  },
  {
    id: "second-t-downstroke",
    start: [417, 29],
    curves: [
      [405, 54, 389, 94, 380, 118],
      [374, 137, 391, 119, 405, 101],
    ],
    duration: 250,
    delay: 30,
  },
  {
    id: "iwari",
    start: [406, 100],
    curves: [
      // i
      [413, 91, 417, 84, 419, 81],
      [414, 94, 405, 110, 414, 108],
      [421, 106, 430, 87, 434, 80],
      // w: two open, rounded valleys, ending in a short raised hook.
      [429, 93, 422, 111, 432, 107],
      [440, 103, 449, 84, 451, 79],
      [446, 93, 439, 110, 449, 106],
      [459, 101, 469, 82, 468, 78],
      [466, 76, 460, 83, 466, 88],
      [472, 93, 480, 89, 486, 83],
      // a
      [495, 75, 506, 77, 505, 85],
      [504, 94, 493, 106, 487, 101],
      [479, 95, 491, 80, 508, 80],
      [503, 91, 498, 105, 506, 104],
      [513, 103, 521, 87, 525, 77],
      // r: a small shoulder above the x-height.
      [521, 88, 516, 104, 523, 96],
      [529, 85, 532, 73, 538, 75],
      [543, 78, 532, 87, 539, 88],
      [547, 89, 551, 80, 555, 75],
      // i and the long, rising terminal.
      [550, 87, 543, 104, 552, 102],
      [563, 99, 575, 86, 582, 81],
      [595, 70, 608, 67, 616, 68],
    ],
    duration: 800,
    delay: 30,
  },
  {
    id: "first-i-dot",
    start: [425, 64],
    curves: [[425, 63, 426, 61, 427, 60]],
    duration: 75,
    delay: 75,
    weight: 1.3,
  },
  {
    id: "last-i-dot",
    start: [560, 59],
    curves: [[560, 58, 561, 56, 562, 55]],
    duration: 75,
    delay: 55,
    weight: 1.3,
  },
  {
    id: "signoff",
    start: [144, 161],
    curves: [
      [219, 146, 416, 129, 538, 127],
      [581, 126, 615, 128, 634, 131],
    ],
    duration: 330,
    delay: 110,
    weight: 0.68,
  },
];

const round = (value: number) => Number(value.toFixed(2));
const pointText = ([x, y]: Point) => `${round(x)} ${round(y)}`;

/** Sample a cubic without relying on browser-only SVG geometry APIs. */
function sampleCurve(start: Point, curve: Curve, t: number): Point {
  const u = 1 - t;
  return [
    u ** 3 * start[0] +
      3 * u ** 2 * t * curve[0] +
      3 * u * t ** 2 * curve[2] +
      t ** 3 * curve[4],
    u ** 3 * start[1] +
      3 * u ** 2 * t * curve[1] +
      3 * u * t ** 2 * curve[3] +
      t ** 3 * curve[5],
  ];
}

function makeInk(gesture: PenGesture): string {
  const points: Point[] = [gesture.start];
  let start = gesture.start;
  for (const curve of gesture.curves) {
    // Keep wide flourishes just as smooth as the short letter loops.
    const controlLength =
      Math.hypot(curve[0] - start[0], curve[1] - start[1]) +
      Math.hypot(curve[2] - curve[0], curve[3] - curve[1]) +
      Math.hypot(curve[4] - curve[2], curve[5] - curve[3]);
    const steps = Math.max(16, Math.ceil(controlLength / 2));
    for (let index = 1; index <= steps; index++) {
      points.push(sampleCurve(start, curve, index / steps));
    }
    start = [curve[4], curve[5]];
  }

  const left: Point[] = [];
  const right: Point[] = [];
  points.forEach(([x, y], index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next[0] - previous[0];
    const dy = next[1] - previous[1];
    const length = Math.hypot(dx, dy) || 1;
    const progress = index / (points.length - 1);
    // Downstrokes carry the nib; upward joins are light. The rounded taper
    // prevents a hard digital edge where the pen touches and leaves the page.
    const pressure = 0.76 + 0.77 * Math.max(0, dy / length);
    const taper = Math.min(1, 0.4 + Math.sin(Math.PI * progress) * 5);
    const radius = pressure * taper * (gesture.weight ?? 1);
    const nx = (-dy / length) * radius;
    const ny = (dx / length) * radius;
    left.push([x + nx, y + ny]);
    right.push([x - nx, y - ny]);
  });

  return `M${pointText(left[0])} ${left
    .slice(1)
    .map((point) => `L${pointText(point)}`)
    .join(" ")} ${right
    .reverse()
    .map((point) => `L${pointText(point)}`)
    .join(" ")} Z`;
}

export const SIGNATURE_STROKES: readonly SignatureStroke[] = gestures.map(
  (gesture) => ({
    id: gesture.id,
    path: `M${pointText(gesture.start)} ${gesture.curves
      .map((curve) => `C${curve.join(" ")}`)
      .join(" ")}`,
    ink: makeInk(gesture),
    duration: gesture.duration,
    delay: gesture.delay ?? 0,
  }),
);

import type {
  ContributionData,
  ContributionDay,
  ContributionLevel,
} from "./github-contributions";

export type CityPoint = { x: number; y: number };
export type CityPalette = {
  front: string;
  side: string;
  top: string;
  edge: string;
};
export type CityBuilding = {
  /** Original chronological daily-array index, independent of painter order. */
  index: number;
  day: ContributionDay;
  week: number;
  weekday: number;
  district: number;
  x: number;
  y: number;
  width: number;
  depthX: number;
  depthY: number;
  height: number;
  delay: number;
  palette: CityPalette;
};
export type CityDistrict = {
  index: number;
  top: number;
  bottom: number;
  startDate: string;
  endDate: string;
  ground: CityPoint[];
};
export type CityLayout = {
  width: number;
  height: number;
  buildings: CityBuilding[];
  districts: CityDistrict[];
  peak: CityBuilding | null;
};
export type CityGeometry = {
  front: CityPoint[];
  side: CityPoint[];
  top: CityPoint[];
  roof: CityPoint;
  height: number;
};

const DAY = 86_400_000;
const RISE_DURATION = 780;
const WAVE_DURATION = 1470;
const ANNOTATION_START = 2280;
export const CITY_DURATION = 2800;
export const CITY_GROUND = { fill: "#e0cbbb", stroke: "#aa877d" };
export const CITY_LEADER = "#713139";

const PALETTES: Record<ContributionLevel, CityPalette> = {
  NONE: { front: "#c7aea0", side: "#b5968b", top: "#dbc6b7", edge: "#a7887d" },
  FIRST_QUARTILE: {
    front: "#98706c",
    side: "#704b50",
    top: "#c79d87",
    edge: "#e4bf9f",
  },
  SECOND_QUARTILE: {
    front: "#a65e58",
    side: "#783d46",
    top: "#d78e73",
    edge: "#ebba92",
  },
  THIRD_QUARTILE: {
    front: "#ae4b43",
    side: "#79323c",
    top: "#df7e60",
    edge: "#f0aa80",
  },
  FOURTH_QUARTILE: {
    front: "#b43e38",
    side: "#792933",
    top: "#e87555",
    edge: "#f5ab78",
  },
};
const SELECTED: CityPalette = {
  front: "#ca493d",
  side: "#852d37",
  top: "#f1a46e",
  edge: "#ffcd95",
};
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** A restrained ease-out-back: a small architectural settle, no bouncing loop. */
function riseProgress(elapsedMs: number, delay: number) {
  const progress =
    elapsedMs === Infinity ? 1 : clamp01((elapsedMs - delay) / RISE_DURATION);
  if (!Number.isFinite(progress) || progress <= 0) return 0;
  if (progress >= 1) return 1;
  const shifted = progress - 1;
  return 1 + 2.05 * shifted ** 3 + 1.05 * shifted ** 2;
}

/**
 * A calendar viewed from slightly above its Saturday/front edge. Sunday is
 * the far row; weeks remain left-to-right. Phones use two chronological
 * districts so each day retains a useful width instead of shrinking to a dot.
 * This work runs on resize/data changes, never inside the animation loop.
 */
export function createCityLayout(
  data: ContributionData,
  width: number,
  height: number,
): CityLayout {
  const w = Number.isFinite(width) ? Math.max(0, width) : 0;
  const h = Number.isFinite(height) ? Math.max(0, height) : 0;
  const layout: CityLayout = {
    width: w,
    height: h,
    buildings: [],
    districts: [],
    peak: null,
  };
  if (w < 64 || h < 120 || !data.days.length) return layout;

  const firstDate = new Date(`${data.days[0].date}T00:00:00Z`);
  const firstSunday = firstDate.getTime() - firstDate.getUTCDay() * DAY;
  const entries = data.days.map((day, index) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const offset = Math.round((date.getTime() - firstSunday) / DAY);
    return {
      day,
      index,
      week: Math.floor(offset / 7),
      weekday: date.getUTCDay(),
    };
  });
  const weekCount = Math.max(...entries.map((entry) => entry.week)) + 1;
  const districtCount = w < 600 && weekCount > 30 ? 2 : 1;
  const weeksPerDistrict = Math.ceil(weekCount / districtCount);
  const districtHeight = h / districtCount;
  const inset = w < 600 ? 14 : 30;
  // Each far row shifts by .43 cells. The .32-cell extrusion leaves an
  // alley between successive rows and keeps adjacent weeks distinct.
  const pitch = (w - inset * 2) / (weeksPerDistrict + 6 * 0.43 + 0.32);
  const buildingWidth = pitch * 0.64;
  const depthX = pitch * 0.32;
  const depthY = Math.min(8, pitch * 0.3);
  const rowX = pitch * 0.43;
  const rowY = depthY + Math.min(2.5, pitch * 0.12);
  const maximum = Math.max(
    0,
    ...entries.map(({ day }) => day.contributionCount),
  );
  const maxHeight = Math.min(195, districtHeight * 0.45);

  for (let districtIndex = 0; districtIndex < districtCount; districtIndex++) {
    const districtEntries = entries.filter(
      (entry) => Math.floor(entry.week / weeksPerDistrict) === districtIndex,
    );
    if (!districtEntries.length) continue;
    const localWeeks =
      Math.max(
        ...districtEntries.map((entry) => entry.week % weeksPerDistrict),
      ) + 1;
    const footprintWidth =
      (localWeeks - 1) * pitch + buildingWidth + depthX + 6 * rowX;
    const originX = (w - footprintWidth) / 2;
    const top = districtIndex * districtHeight;
    const baseline = top + districtHeight - (w < 600 ? 32 : 42);
    const right = originX + (localWeeks - 1) * pitch + buildingWidth;
    layout.districts.push({
      index: districtIndex,
      top,
      bottom: top + districtHeight,
      startDate: districtEntries[0].day.date,
      endDate: districtEntries[districtEntries.length - 1].day.date,
      ground: [
        { x: originX - 5, y: baseline + 5 },
        { x: right + 5, y: baseline + 5 },
        {
          x: right + 6 * rowX + depthX + 5,
          y: baseline - 6 * rowY - depthY - 5,
        },
        {
          x: originX + 6 * rowX + depthX - 5,
          y: baseline - 6 * rowY - depthY - 5,
        },
      ],
    });
    for (const entry of districtEntries) {
      const behind = 6 - entry.weekday;
      layout.buildings.push({
        ...entry,
        district: districtIndex,
        x: originX + (entry.week % weeksPerDistrict) * pitch + behind * rowX,
        y: baseline - behind * rowY,
        width: buildingWidth,
        depthX,
        depthY,
        height:
          maximum && entry.day.contributionCount
            ? maxHeight * Math.sqrt(entry.day.contributionCount / maximum)
            : 0,
        delay:
          WAVE_DURATION *
          ((0.8 * entry.weekday) / 6 +
            (0.2 * entry.week) / Math.max(1, weekCount - 1)),
        palette: PALETTES[entry.day.contributionLevel],
      });
    }
  }
  // Back rows first; reverse this exact order for picking visible surfaces.
  layout.buildings.sort(
    (a, b) =>
      a.district - b.district || a.weekday - b.weekday || a.week - b.week,
  );
  layout.peak =
    maximum > 0
      ? (layout.buildings.find(
          (building) => building.day.date === data.maxDay?.date,
        ) ?? null)
      : null;
  return layout;
}

export function getBuildingGeometry(
  building: CityBuilding,
  elapsedMs: number,
): CityGeometry {
  const { x, y, width: w, depthX: dx, depthY: dy } = building;
  const height = building.height * riseProgress(elapsedMs, building.delay);
  const roofY = y - height;
  return {
    height,
    front: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: roofY },
      { x, y: roofY },
    ],
    side: [
      { x: x + w, y },
      { x: x + w + dx, y: y - dy },
      { x: x + w + dx, y: roofY - dy },
      { x: x + w, y: roofY },
    ],
    top: [
      { x, y: roofY },
      { x: x + w, y: roofY },
      { x: x + w + dx, y: roofY - dy },
      { x: x + dx, y: roofY - dy },
    ],
    roof: { x: x + w / 2 + dx / 2, y: roofY - dy / 2 },
  };
}

export function getPeakAnnotation(layout: CityLayout, elapsedMs: number) {
  if (!layout.peak) return null;
  const district = layout.districts[layout.peak.district];
  const progress =
    elapsedMs === Infinity
      ? 1
      : clamp01(
          (elapsedMs - ANNOTATION_START) / (CITY_DURATION - ANNOTATION_START),
        );
  return {
    anchor: getBuildingGeometry(layout.peak, elapsedMs).roof,
    end: {
      x: clamp(layout.peak.x + 18, 16, Math.max(16, layout.width - 200)),
      y: district.top + 62,
    },
    progress: Number.isFinite(progress) ? progress : 0,
  };
}

function tracePolygon(ctx: CanvasRenderingContext2D, points: CityPoint[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index++)
    ctx.lineTo(points[index].x, points[index].y);
  ctx.closePath();
}

function fillPolygon(
  ctx: CanvasRenderingContext2D,
  points: CityPoint[],
  fill: string,
) {
  tracePolygon(ctx, points);
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawLeader(
  ctx: CanvasRenderingContext2D,
  points: CityPoint[],
  progress: number,
) {
  const lengths = points
    .slice(1)
    .map((point, index) =>
      Math.hypot(point.x - points[index].x, point.y - points[index].y),
    );
  let remaining = lengths.reduce((sum, value) => sum + value, 0) * progress;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let index = 0; index < lengths.length; index++) {
    const fraction = lengths[index]
      ? Math.min(1, remaining / lengths[index])
      : 1;
    ctx.lineTo(
      points[index].x + (points[index + 1].x - points[index].x) * fraction,
      points[index].y + (points[index + 1].y - points[index].y) * fraction,
    );
    remaining -= lengths[index];
    if (remaining <= 0) break;
  }
  ctx.stroke();
}

/** One frame only. The owning component controls DPR, scheduling and cleanup. */
export function drawCity(
  ctx: CanvasRenderingContext2D,
  layout: CityLayout,
  elapsedMs: number,
  selectedIndex: number | null = null,
) {
  ctx.clearRect(0, 0, layout.width, layout.height);
  ctx.save();
  ctx.lineJoin = "round";
  for (const district of layout.districts) {
    fillPolygon(ctx, district.ground, CITY_GROUND.fill);
    ctx.strokeStyle = CITY_GROUND.stroke;
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }

  const annotation = getPeakAnnotation(layout, elapsedMs);
  for (const building of layout.buildings) {
    const geometry = getBuildingGeometry(building, elapsedMs);
    const isSelected = building.index === selectedIndex;
    const isPeak = building === layout.peak && Boolean(annotation?.progress);
    const palette = isSelected || isPeak ? SELECTED : building.palette;
    if (geometry.height > 0.2) {
      fillPolygon(ctx, geometry.side, palette.side);
      fillPolygon(ctx, geometry.front, palette.front);
    }
    fillPolygon(
      ctx,
      geometry.top,
      geometry.height > 0.2 || isSelected ? palette.top : PALETTES.NONE.top,
    );
    ctx.strokeStyle = geometry.height > 0.2 ? palette.edge : PALETTES.NONE.edge;
    ctx.lineWidth = isSelected ? 1 : 0.45;
    ctx.globalAlpha = isSelected ? 0.95 : 0.48;
    ctx.stroke();
    if (geometry.height > 5) {
      // One lit vertical edge keeps very narrow neighboring buildings legible.
      ctx.beginPath();
      ctx.moveTo(building.x, building.y);
      ctx.lineTo(building.x, building.y - geometry.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (annotation && annotation.progress > 0) {
    ctx.strokeStyle = CITY_LEADER;
    ctx.lineWidth = 1;
    ctx.globalAlpha = annotation.progress;
    drawLeader(
      ctx,
      [
        annotation.anchor,
        { x: annotation.anchor.x, y: annotation.end.y },
        annotation.end,
      ],
      annotation.progress,
    );
    ctx.beginPath();
    ctx.arc(annotation.anchor.x, annotation.anchor.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = CITY_LEADER;
    ctx.fill();
  }
  ctx.restore();
}

function inPolygon(point: CityPoint, polygon: CityPoint[]) {
  let inside = false;
  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const a = polygon[index];
    const b = polygon[previous];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      inside = !inside;
  }
  return inside;
}

/** Pick the visible roof/face, not the calendar cell hidden behind it. */
export function hitTestCity(
  layout: CityLayout,
  x: number,
  y: number,
  elapsedMs: number,
): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (let index = layout.buildings.length - 1; index >= 0; index--) {
    const building = layout.buildings[index];
    const geometry = getBuildingGeometry(building, elapsedMs);
    if (
      x < building.x ||
      x > building.x + building.width + building.depthX ||
      y > building.y ||
      y < building.y - geometry.height - building.depthY
    )
      continue;
    if (
      inPolygon({ x, y }, geometry.top) ||
      inPolygon({ x, y }, geometry.front) ||
      inPolygon({ x, y }, geometry.side)
    )
      return building.index;
  }
  return null;
}

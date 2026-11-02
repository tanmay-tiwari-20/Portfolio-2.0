type RadialPopLayoutOptions = {
  count: number;
  cardSize: number;
  heroSize: number;
  heroPadding?: number;
  radius: number;
  jitter: number;
};

export const MAX_CENTER_OVERLAP = 0.12;

export function createRadialPopLayout({
  count,
  cardSize,
  heroSize,
  heroPadding = 0,
  radius,
  jitter,
}: RadialPopLayoutOptions) {
  const heroHalf = heroSize / 2 + heroPadding;
  let outerExtent = heroHalf;

  const positions = Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    const seed = 233280 * Math.sin(9301 * index + 49297);
    const rotate = ((seed - Math.floor(seed)) * 2 - 1) * jitter;
    const rotation = (rotate * Math.PI) / 180;
    const halfExtent =
      (cardSize / 2) * (Math.abs(Math.cos(rotation)) + Math.abs(Math.sin(rotation)));

    // Use the rotated card's outer box as a conservative overlap bound.
    // Diagonal cards need more travel than the ones above/beside the portrait.
    const overlapAt = (distance: number) => {
      const x = Math.abs(directionX * distance);
      const y = Math.abs(directionY * distance);
      const width = Math.max(
        0,
        Math.min(heroHalf, x + halfExtent) - Math.max(-heroHalf, x - halfExtent),
      );
      const height = Math.max(
        0,
        Math.min(heroHalf, y + halfExtent) - Math.max(-heroHalf, y - halfExtent),
      );
      return width * height;
    };

    let distance = radius;
    if (overlapAt(distance) > cardSize * cardSize * MAX_CENTER_OVERLAP) {
      let lower = radius;
      let upper = Math.max(radius, (heroHalf + halfExtent) * Math.SQRT2);
      for (let step = 0; step < 24; step++) {
        const middle = (lower + upper) / 2;
        if (overlapAt(middle) > cardSize * cardSize * MAX_CENTER_OVERLAP) {
          lower = middle;
        } else {
          upper = middle;
        }
      }
      distance = upper;
    }

    const x = directionX * distance;
    const y = directionY * distance;
    outerExtent = Math.max(
      outerExtent,
      Math.abs(x) + halfExtent,
      Math.abs(y) + halfExtent,
    );
    return { x, y, rotate };
  });

  // Fit the actual card corners rather than the widest possible circle, so
  // spreading the fan does not needlessly shrink the center portrait.
  const dimension = Math.ceil(outerExtent * 2 + cardSize * 0.06);
  return { positions, dimension };
}

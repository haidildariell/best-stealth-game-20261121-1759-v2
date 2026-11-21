// MOONMARKET — sight and light maths: ray-cast vision cones clipped by
// walls, line-of-sight checks, and how much lantern light falls on a point.

import { LANTERN_RADIUS } from './config.js';

// Distance from (x,y) along the unit ray (dx,dy) to the nearest wall edge,
// or `maxDist` when nothing is hit. Slab test per rect.
export function rayHitDistance(x, y, dx, dy, walls, maxDist) {
  let best = maxDist;
  for (const w of walls) {
    let tmin = 0;
    let tmax = best;
    // X slab
    if (Math.abs(dx) < 1e-9) {
      if (x < w.x || x > w.x + w.w) continue;
    } else {
      let t1 = (w.x - x) / dx;
      let t2 = (w.x + w.w - x) / dx;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    // Y slab
    if (Math.abs(dy) < 1e-9) {
      if (y < w.y || y > w.y + w.h) continue;
    } else {
      let t1 = (w.y - y) / dy;
      let t2 = (w.y + w.h - y) / dy;
      if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (tmin > 0.5 && tmin < best) best = tmin;
  }
  return best;
}

// True when the straight line between two points crosses no wall.
export function lineOfSightClear(x1, y1, x2, y2, walls) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  if (d < 1) return true;
  const hit = rayHitDistance(x1, y1, dx / d, dy / d, walls, d);
  return hit >= d - 1;
}

// The visible polygon of a cone: fan of rays from the eye, each clipped by
// the nearest wall, so cones bend around stall corners the way players expect.
export function conePolygon(x, y, angle, range, halfAngle, walls, steps = 26) {
  const pts = [{ x, y }];
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = rayHitDistance(x, y, dx, dy, walls, range);
    pts.push({ x: x + dx * d, y: y + dy * d });
  }
  return pts;
}

export function pointInCone(x, y, gx, gy, angle, range, halfAngle) {
  const dx = x - gx;
  const dy = y - gy;
  const d = Math.hypot(dx, dy);
  if (d > range) return false;
  if (d < 26) return true; // point blank: always seen
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

// 0 in full shadow, 1 inside a lantern's bright core. Doused lanterns and
// lanterns still relighting are skipped by the caller passing `lit` flags.
export function lightLevelAt(x, y, lanterns) {
  let level = 0;
  for (const l of lanterns) {
    if (!l.lit) continue;
    const d = Math.hypot(x - l.x, y - l.y);
    if (d < LANTERN_RADIUS) {
      const v = 1 - d / LANTERN_RADIUS;
      if (v > level) level = v;
    }
  }
  return level;
}

// Is the player hidden by cover from this guard? True when the player is
// sneaking and a wall block sits between them in the guard's half of the gap.
export function coverBetween(px, py, gx, gy, walls) {
  const mx = (px + gx) / 2;
  const my = (py + gy) / 2;
  for (const w of walls) {
    if (mx > w.x - 6 && mx < w.x + w.w + 6 && my > w.y - 6 && my < w.y + w.h + 6) return true;
  }
  return false;
}

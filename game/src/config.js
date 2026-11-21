// MOONMARKET — shared constants: stage geometry, palette, tuning.
// Everything visual derives from these numbers so the render, the HUD and
// the screenshot staging all agree on where the playfield sits.

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const TILE = 40;
export const COLS = 22;
export const ROWS = 17;
export const FIELD_X = 200; // playfield left edge (right of the left panel)
export const FIELD_Y = 62; // playfield top edge (below the top bar)
export const FIELD_W = COLS * TILE; // 880
export const FIELD_H = ROWS * TILE; // 680

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED_WALK = 138;
export const PLAYER_SPEED_SNEAK = 80;
export const PLAYER_SPEED_SPRINT = 224;

export const GUARD_RADIUS = 14;
export const GUARD_SPEED_PATROL = 64;
export const GUARD_SPEED_INVESTIGATE = 102;
export const GUARD_SPEED_CHASE = 176;
export const GUARD_SPEED_RETURN = 96;

export const CONE_RANGE = 196;
export const CONE_HALF_ANGLE = 0.56; // ~32 degrees
export const CATCH_RADIUS = 24;
export const ALARMS_TO_FAIL = 3;

export const LANTERN_RADIUS = 92;
export const LANTERN_DOUSE_TIME = 12; // seconds a doused lantern stays dark
export const COIN_THROW_RANGE = 280;
export const COIN_NOISE_RADIUS = 118;
export const SPRINT_NOISE_RADIUS = 96;

export const OWL_RANGE = 268;
export const OWL_HALF_ANGLE = 0.34;

export const COLORS = {
  ink: '#0b0e1d',
  panel: '#10142a',
  panelEdge: '#262c52',
  panelText: '#c9cee8',
  panelDim: '#7c84ad',
  gold: '#f2b544',
  goldSoft: '#ffd98a',
  red: '#e5484d',
  teal: '#2dd4bf',
  green: '#4ade80',
  floorA: '#171c38',
  floorB: '#141830',
  shadow: '#0a0c1a',
  coneCalm: 'rgba(255, 214, 130, 0.16)',
  coneEdge: 'rgba(255, 214, 130, 0.55)',
  coneAlert: 'rgba(255, 92, 92, 0.22)',
  coneAlertEdge: 'rgba(255, 92, 92, 0.7)',
  owlBeam: 'rgba(255, 226, 150, 0.20)',
  owlBeamEdge: 'rgba(255, 226, 150, 0.65)',
};

// Tile-space helpers: levels are authored in tiles, the world runs in pixels.
export function tileCX(tx) { return FIELD_X + (tx + 0.5) * TILE; }
export function tileCY(ty) { return FIELD_Y + (ty + 0.5) * TILE; }
export function tileRect(r) {
  return { x: FIELD_X + r.x * TILE, y: FIELD_Y + r.y * TILE, w: r.w * TILE, h: r.h * TILE, kind: r.kind };
}
export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
export function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
// Stable per-position pseudo-random (0..1) so floor sparkle never flickers.
export function hashRand(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

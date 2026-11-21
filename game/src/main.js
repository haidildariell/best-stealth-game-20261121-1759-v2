// MOONMARKET — boot, the world builder, input, and the frame loop.
// The world object built here is the one contract every other module reads:
// render.js draws it, hud.js frames it, guards.js and player.js move in it.

import {
  VIEW_W, VIEW_H, FIELD_X, FIELD_Y, FIELD_W, TILE,
  tileCX, tileCY, tileRect, clamp, dist,
  CONE_RANGE, CONE_HALF_ANGLE, OWL_RANGE, OWL_HALF_ANGLE,
  CATCH_RADIUS, ALARMS_TO_FAIL, COIN_THROW_RANGE, COLORS,
} from './config.js';
import { LEVELS, TREASURES, LOOT_KINDS } from './levels.js';
import { Guard, GUARD_STATES } from './guards.js';
import { Player } from './player.js';
import { Floaters, Rings, Puffs } from './fx.js';
import { lightLevelAt, pointInCone, lineOfSightClear, coverBetween } from './vision.js';
import { drawWorld } from './render.js';
import { drawHud } from './hud.js';
import { sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = { up: false, down: false, left: false, right: false, sneak: false, sprint: false };
let world = null;

function buildWorld(levelIndex, score, alarms, ghostRun) {
  const level = LEVELS[levelIndex];
  const wallsPx = level.walls.map(tileRect);
  const daisRect = tileRect(level.dais);
  wallsPx.push(daisRect);
  const w = {
    mode: 'title',
    paused: false,
    frozen: false,
    level,
    levelIndex,
    levelNames: LEVELS.map((l) => l.name),
    wallsPx,
    rugsPx: level.rugs.map(tileRect),
    lanterns: level.lanterns.map((l) => ({ x: tileCX(l.x), y: tileCY(l.y), lit: true, douseT: 0 })),
    guards: level.guards.map((g) => new Guard(g, g.path.map(([tx, ty]) => ({ x: tileCX(tx), y: tileCY(ty) })))),
    lootItems: level.loot.map((l) => ({
      x: tileCX(l.x), y: tileCY(l.y), kind: l.kind, value: LOOT_KINDS[l.kind].value, taken: false,
    })),
    treasure: {
      x: daisRect.x + daisRect.w / 2, y: daisRect.y + daisRect.h / 2,
      kind: level.treasure, name: TREASURES[level.treasure].name,
      value: TREASURES[level.treasure].value, taken: false,
    },
    exitRect: tileRect(level.exit),
    owl: level.owl ? {
      x: tileCX(level.owl.x), y: tileCY(level.owl.y),
      sweep: level.owl.sweep, period: level.owl.period, angle: Math.PI / 2,
    } : null,
    player: new Player(tileCX(level.spawn.x), tileCY(level.spawn.y)),
    floaters: new Floaters(),
    rings: new Rings(),
    puffs: new Puffs(),
    log: [],
    time: 0,
    levelTime: 0,
    score,
    scoreAtLevelStart: score,
    alarms,
    ghost: true,
    ghostRun,
    lootTaken: 0,
    lootTotal: level.loot.length,
    exposureNow: 0,
    noiseLevel: 0,
    noiseLabelText: 'SILENT',
    noiseT: 0,
    owlHeat: 0,
    pendingCoins: [],
    coneRange: CONE_RANGE,
    coneHalf: CONE_HALF_ANGLE,
    owlRange: OWL_RANGE,
    owlHalf: OWL_HALF_ANGLE,

    circleHitsWall(x, y, r = 14) {
      if (x < FIELD_X + r || x > FIELD_X + FIELD_W - r) return true;
      if (y < FIELD_Y + r || y > FIELD_Y + 680 - r) return true;
      for (const wall of this.wallsPx) {
        const nx = clamp(x, wall.x, wall.x + wall.w);
        const ny = clamp(y, wall.y, wall.y + wall.h);
        if (dist(x, y, nx, ny) < r) return true;
      }
      return false;
    },

    logEvent(text) {
      this.log.push(text);
      if (this.log.length > 30) this.log.shift();
    },

    emitNoise(x, y, radius, kind) {
      if (kind === 'steps') {
        this.rings.add(x, y, radius * 0.5, 'rgba(200, 205, 235, 0.35)');
        sfx.step(true);
      }
      this.noiseLevel = Math.min(1, radius / 130);
      this.noiseLabelText = kind === 'coin' ? 'CLINK!' : 'RUNNING — LOUD';
      this.noiseT = 0.9;
      for (const g of this.guards) {
        if (dist(g.x, g.y, x, y) <= radius + 30) g.hearNoise(x, y, this);
      }
    },

    playerLight() {
      return lightLevelAt(this.player.x, this.player.y, this.lanterns);
    },

    huggingCover() {
      const p = this.player;
      for (const wall of this.wallsPx) {
        const nx = clamp(p.x, wall.x, wall.x + wall.w);
        const ny = clamp(p.y, wall.y, wall.y + wall.h);
        if (dist(p.x, p.y, nx, ny) < 30) return true;
      }
      return false;
    },

    computeHidden(player) {
      if (player.stance !== 'sneak') return false;
      const light = this.playerLight();
      if (light < 0.28) return true;
      if (!this.huggingCover()) return false;
      return this.guards.some((g) => coverBetween(player.x, player.y, g.x, g.y, this.wallsPx)
        && dist(player.x, player.y, g.x, g.y) < 240);
    },

    detectionState() {
      let maxS = 0;
      let chasing = false;
      let hunting = false;
      for (const g of this.guards) {
        maxS = Math.max(maxS, g.suspicion);
        if (g.state === GUARD_STATES.CHASE) chasing = true;
        if (g.alertLevel === 1) hunting = true;
      }
      if (chasing) return { label: 'SPOTTED!', color: '#e5484d', level: 1, hint: 'Break the line of sight — run or hide.' };
      if (hunting || maxS > 0.2) return { label: 'SUSPICIOUS', color: '#f2b544', level: Math.max(maxS, 0.45), hint: 'Something caught an eye. Freeze, or slip away.' };
      return { label: 'UNSEEN', color: '#4ade80', level: maxS, hint: 'No warden has marked you. Keep it so.' };
    },

    visibilityLabel() {
      if (this.player.hidden) return 'HIDDEN';
      const light = this.playerLight();
      if (light > 0.66) return 'IN LAMPLIGHT';
      if (light > 0.28) return 'HALF-LIT';
      return 'IN SHADOW';
    },

    visibilityColor() {
      if (this.player.hidden) return '#2dd4bf';
      const light = this.playerLight();
      if (light > 0.66) return '#f59e0b';
      if (light > 0.28) return '#c9cee8';
      return '#7c84ad';
    },

    noiseLabel() { return this.noiseLabelText; },
  };
  w.logEvent(`${level.name} — ${level.sub}.`);
  w.logEvent(`Steal ${TREASURES[level.treasure].name}.`);
  return w;
}

function resetPositions(w) {
  const fresh = buildWorld(w.levelIndex, w.scoreAtLevelStart, w.alarms, w.ghostRun);
  w.guards = fresh.guards;
  w.player = fresh.player;
  w.lanterns = fresh.lanterns;
  w.pendingCoins = [];
  w.owlHeat = 0;
}

function startRun() {
  world = buildWorld(0, 0, 0, true);
  world.mode = 'playing';
}

function caught() {
  world.alarms += 1;
  world.ghostRun = false;
  sfx.caught();
  world.logEvent('Caught! The wardens drag Sable back to the gate.');
  if (world.alarms >= ALARMS_TO_FAIL) {
    world.mode = 'lost';
  } else {
    resetPositions(world);
  }
}

function throwCoin(tx, ty) {
  const p = world.player;
  if (p.coins <= 0) {
    world.floaters.add(p.x, p.y - 24, 'NO COINS', '#e5484d', 12);
    return;
  }
  if (dist(p.x, p.y, tx, ty) > COIN_THROW_RANGE) {
    world.floaters.add(p.x, p.y - 24, 'TOO FAR', '#e5484d', 12);
    return;
  }
  p.coins -= 1;
  world.pendingCoins.push({ x: tx, y: ty, t: 0.38 });
}

function douseNearestLantern() {
  const p = world.player;
  let best = null;
  let bestD = 58;
  for (const l of world.lanterns) {
    if (!l.lit) continue;
    const d = dist(p.x, p.y, l.x, l.y);
    if (d < bestD) { bestD = d; best = l; }
  }
  if (!best) return;
  best.lit = false;
  best.douseT = 12;
  world.puffs.add(best.x, best.y - 8, 8);
  sfx.douse();
  world.logEvent('A lantern gutters out. The dark moves closer.');
}

function update(dt) {
  const w = world;
  w.time += dt;
  w.levelTime += dt;
  w.player.update(dt, input, w);
  const light = w.playerLight();
  w.exposureNow = w.player.exposure(light, w.huggingCover());

  // The Brass Owl sweeps its beam; standing in it fills a slower alarm.
  if (w.owl) {
    w.owl.angle = Math.PI / 2 + Math.sin((w.time / w.owl.period) * Math.PI * 2) * w.owl.sweep;
    const p = w.player;
    const inBeam = pointInCone(p.x, p.y, w.owl.x, w.owl.y, w.owl.angle, OWL_RANGE, OWL_HALF_ANGLE)
      && lineOfSightClear(w.owl.x, w.owl.y, p.x, p.y, w.wallsPx);
    if (inBeam && w.exposureNow > 0.15) {
      w.owlHeat = Math.min(1, w.owlHeat + dt * 0.85 * w.exposureNow);
      if (w.owlHeat >= 1) {
        w.owlHeat = 0.35;
        w.ghost = false;
        let nearest = null;
        let nd = 1e9;
        for (const g of w.guards) { const d = dist(g.x, g.y, p.x, p.y); if (d < nd) { nd = d; nearest = g; } }
        if (nearest) {
          nearest.state = GUARD_STATES.CHASE;
          nearest.suspicion = 1;
          nearest.lastSeen = { x: p.x, y: p.y };
        }
        w.floaters.add(p.x, p.y - 30, 'THE OWL SEES YOU!', '#e5484d', 14);
        sfx.spotted();
        w.logEvent("The Brass Owl's beam pins Sable in the light!");
      }
    } else {
      w.owlHeat = Math.max(0, w.owlHeat - dt * 0.25);
    }
  }

  for (const g of w.guards) {
    const spottedNow = g.perceive(w.player, w.exposureNow, w.wallsPx, dt);
    if (spottedNow) {
      w.ghost = false;
      w.ghostRun = false;
      w.floaters.add(w.player.x, w.player.y - 30, 'SPOTTED!', '#e5484d', 15);
      sfx.spotted();
      w.logEvent(`${g.name} has her — run!`);
    }
    g.update(dt, w);
    if (dist(g.x, g.y, w.player.x, w.player.y) < CATCH_RADIUS) {
      caught();
      return;
    }
  }

  // Lantern timers.
  for (const l of w.lanterns) {
    if (!l.lit) {
      l.douseT -= dt;
      if (l.douseT <= 0) {
        l.lit = true;
        w.puffs.add(l.x, l.y - 8, 4, 'rgba(255, 202, 106, 0.5)');
        sfx.relight();
      }
    }
  }

  // Coins in flight land with a clink.
  for (const c of w.pendingCoins) {
    c.t -= dt;
    if (c.t <= 0 && !c.done) {
      c.done = true;
      w.rings.add(c.x, c.y, 118);
      w.floaters.add(c.x, c.y - 14, 'CLINK!', '#ffd98a', 13);
      sfx.clink();
      w.emitNoise(c.x, c.y, 118, 'coin');
      w.logEvent('A coin clinks against the stones…');
    }
  }
  w.pendingCoins = w.pendingCoins.filter((c) => !c.done);

  // Noise HUD decay.
  if (w.noiseT > 0) {
    w.noiseT -= dt;
    if (w.noiseT <= 0) {
      w.noiseLevel = w.player.stance === 'sprint' ? 0.6 : 0;
      w.noiseLabelText = w.player.stance === 'sprint' ? 'RUNNING — LOUD' : 'SILENT';
    }
  } else if (w.player.stance !== 'sprint') {
    w.noiseLevel = Math.max(0, w.noiseLevel - dt * 2);
    w.noiseLabelText = 'SILENT';
  }

  // Pickups.
  const p = w.player;
  for (const item of w.lootItems) {
    if (!item.taken && dist(p.x, p.y, item.x, item.y) < 24) {
      item.taken = true;
      w.lootTaken += 1;
      w.score += item.value;
      w.floaters.add(item.x, item.y - 16, `+$${item.value}`, '#ffd98a', 14);
      sfx.pickup();
    }
  }
  if (!w.treasure.taken && dist(p.x, p.y, w.treasure.x, w.treasure.y) < 52) {
    w.treasure.taken = true;
    p.hasTreasure = true;
    w.score += w.treasure.value;
    w.floaters.add(w.treasure.x, w.treasure.y - 34, `${w.treasure.name.toUpperCase()} — $${w.treasure.value}`, '#ffd98a', 15);
    sfx.treasure();
    w.logEvent(`${w.treasure.name} is yours. The Moon Gate stands open.`);
  }
  if (p.hasTreasure) {
    const e = w.exitRect;
    if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
      if (w.levelIndex >= LEVELS.length - 1) {
        w.mode = 'won';
        sfx.win();
      } else {
        w.mode = 'levelclear';
        sfx.pickup();
      }
    }
  }

  w.floaters.update(dt);
  w.rings.update(dt);
  w.puffs.update(dt);
}

// ---- input -----------------------------------------------------------------
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
};
window.addEventListener('keydown', (ev) => {
  if (KEYMAP[ev.code]) { input[KEYMAP[ev.code]] = true; ev.preventDefault(); }
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') input.sneak = true;
  if (ev.code === 'Space') { input.sprint = true; ev.preventDefault(); }
  if (!world) return;
  if (ev.code === 'Enter') {
    if (world.mode === 'title') startRun();
    else if (world.mode === 'levelclear') {
      const next = buildWorld(world.levelIndex + 1, world.score, world.alarms, world.ghostRun && world.ghost);
      next.mode = 'playing';
      world = next;
    } else if (world.mode === 'won' || world.mode === 'lost') startRun();
  }
  if (world.mode !== 'playing') return;
  if (ev.code === 'KeyP') world.paused = !world.paused;
  if (ev.code === 'KeyR') {
    const alarms = world.alarms;
    const score = world.scoreAtLevelStart;
    const idx = world.levelIndex;
    const gr = world.ghostRun;
    world = buildWorld(idx, score, alarms, gr);
    world.mode = 'playing';
  }
  if (ev.code === 'KeyE') douseNearestLantern();
  if (ev.code === 'KeyF') {
    const p = world.player;
    throwCoin(p.x + Math.cos(p.angle) * 170, p.y + Math.sin(p.angle) * 170);
  }
});
window.addEventListener('keyup', (ev) => {
  if (KEYMAP[ev.code]) input[KEYMAP[ev.code]] = false;
  if (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') input.sneak = false;
  if (ev.code === 'Space') input.sprint = false;
});
canvas.addEventListener('mousedown', (ev) => {
  if (!world || world.mode !== 'playing' || world.frozen) return;
  const rect = canvas.getBoundingClientRect();
  const tx = (ev.clientX - rect.left) * (VIEW_W / rect.width);
  const ty = (ev.clientY - rect.top) * (VIEW_H / rect.height);
  if (tx > FIELD_X && tx < FIELD_X + FIELD_W) throwCoin(tx, ty);
});

// ---- boot ------------------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
world = buildWorld(0, 0, 0, true);
if (shotName) {
  world = stageShot(shotName, (idx, score, alarms) => {
    const staged = buildWorld(idx, score, alarms, true);
    staged.mode = 'playing';
    staged.frozen = true;
    return staged;
  });
}
window.__mm = () => world;

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (world.mode === 'playing' && !world.paused && !world.frozen) update(dt);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawWorld(ctx, world);
  drawHud(ctx, world);
  if (world.paused) {
    ctx.fillStyle = 'rgba(5,6,14,0.6)';
    ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, 680);
    ctx.fillStyle = '#ffd98a';
    ctx.font = '700 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD_X + FIELD_W / 2, FIELD_Y + 340);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

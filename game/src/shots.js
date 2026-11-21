// MOONMARKET — screenshot staging. Each scene builds a real world with the
// game's own builder, then poses it mid-action: a warden's cone raking past
// Sable's shoulder, a thrown coin mid-clink, the Brass Owl's beam sweeping
// the pavilion. The capture script loads ?shot=<name> and photographs the
// canvas — the same pixels a player would see, frozen at the telling moment.

import { tileCX, tileCY } from './config.js';
import { GUARD_STATES } from './guards.js';

function guardNamed(world, name) {
  return world.guards.find((g) => g.name === name);
}

function poseGuard(g, tx, ty, angle, state = GUARD_STATES.PATROL, suspicion = 0) {
  g.x = tileCX(tx);
  g.y = tileCY(ty);
  g.angle = angle;
  g.state = state;
  g.suspicion = suspicion;
  if (suspicion > 0) g.lastSeen = { x: g.x + Math.cos(angle) * 60, y: g.y + Math.sin(angle) * 60 };
}

function posePlayer(world, tx, ty, angle, stance = 'sneak', hidden = false) {
  const p = world.player;
  p.x = tileCX(tx);
  p.y = tileCY(ty);
  p.angle = angle;
  p.stance = stance;
  p.moving = stance !== 'sneak' || hidden;
  p._hidden = hidden;
}

function setLog(world, lines) {
  world.log = lines.slice();
}

export function stageShot(name, make) {
  switch (name) {
    case 'cover': return stageCover(make);
    case 'sneak': return stageSneak(make);
    case 'coin': return stageCoin(make);
    case 'owl': return stageOwl(make);
    default: return make(0, 0, 0);
  }
}

// COVER — the Lantern Court at full bustle: Sable slips behind Warden Cress
// at the very edge of her cone while the Brass Owl sweeps the court.
function stageCover(make) {
  const w = make(1, 620, 0);
  w.time = 74;
  w.lootTaken = 3;
  w.lootItems[0].taken = true;
  w.lootItems[2].taken = true;
  w.lootItems[3].taken = true;
  poseGuard(guardNamed(w, 'Warden Cress'), 9, 8.6, 0.35, GUARD_STATES.SUSPICIOUS, 0.42);
  poseGuard(guardNamed(w, 'Warden Odo'), 15, 8, Math.PI, GUARD_STATES.PATROL, 0);
  poseGuard(guardNamed(w, 'Warden Pell'), 11, 16, Math.PI, GUARD_STATES.PATROL, 0);
  posePlayer(w, 6.4, 8.2, 0.5, 'sneak', true);
  if (w.owl) w.owl.angle = Math.PI / 2 - 0.85;
  setLog(w, [
    'The Lantern Court — the Brass Owl keeps watch.',
    'Steal the Pearl Koi.',
    'Warden Cress heard something…',
  ]);
  return w;
}

// SNEAK — night one: Sable in Bram's blind spot, close enough to count the
// stitches on his coat, the astrolabe glowing across the bazaar.
function stageSneak(make) {
  const w = make(0, 150, 0);
  w.time = 47;
  w.lootTaken = 1;
  w.lootItems[0].taken = true;
  poseGuard(guardNamed(w, 'Warden Bram'), 8, 5, 0, GUARD_STATES.PATROL, 0.08);
  poseGuard(guardNamed(w, 'Warden Yara'), 16, 10, Math.PI / 2, GUARD_STATES.PATROL, 0);
  posePlayer(w, 6.7, 5.1, 0.2, 'sneak', true);
  setLog(w, [
    'The Outer Bazaar — learn the lanterns.',
    'Steal the Brass Astrolabe.',
  ]);
  return w;
}

// COIN — the gadget moment: a moon-coin has just clinked by the silk stall
// and Warden Odo is turning toward it, cone swinging away from Sable.
function stageCoin(make) {
  const w = make(1, 450, 0);
  w.time = 98;
  w.lootTaken = 2;
  w.lootItems[1].taken = true;
  w.lootItems[4].taken = true;
  w.player.coins = 2;
  const odo = guardNamed(w, 'Warden Odo');
  poseGuard(odo, 14, 8, 0.9, GUARD_STATES.INVESTIGATE, 0.62);
  odo.target = { x: tileCX(16.5), y: tileCY(9.5) };
  poseGuard(guardNamed(w, 'Warden Cress'), 5, 6, Math.PI / 2, GUARD_STATES.PATROL, 0);
  poseGuard(guardNamed(w, 'Warden Pell'), 8, 16, 0, GUARD_STATES.PATROL, 0);
  posePlayer(w, 5.4, 11.2, 2.6, 'sneak', true);
  w.rings.items.push({
    x: tileCX(16.5), y: tileCY(9.5), maxRadius: 118, color: 'rgba(255, 217, 138, 0.8)', t: 0.38, life: 0.85,
  });
  w.floaters.add(tileCX(16.5), tileCY(9.5) - 12, 'CLINK!', '#ffd98a', 14);
  w.floaters.items[w.floaters.items.length - 1].t = 0.35;
  if (w.owl) w.owl.angle = Math.PI / 2 + 0.7;
  setLog(w, [
    'The Lantern Court — the Brass Owl keeps watch.',
    'A coin clinks against the stones…',
    'Warden Odo heard something…',
  ]);
  return w;
}

// OWL — night three, the endgame: the Jade Fox is already in Sable's sack,
// the Moon Gate stands open, and every warden in the pavilion is awake.
function stageOwl(make) {
  const w = make(2, 1150, 1);
  w.time = 125;
  w.lootTaken = 4;
  w.lootItems[0].taken = true;
  w.lootItems[1].taken = true;
  w.lootItems[3].taken = true;
  w.lootItems[5].taken = true;
  w.treasure.taken = true;
  w.player.hasTreasure = true;
  w.player.coins = 1;
  poseGuard(guardNamed(w, 'Warden Bram'), 6, 8, 0.2, GUARD_STATES.PATROL, 0.12);
  poseGuard(guardNamed(w, 'Warden Cress'), 17.5, 8.6, Math.PI / 2, GUARD_STATES.SUSPICIOUS, 0.38);
  poseGuard(guardNamed(w, 'Warden Odo'), 8, 14, -Math.PI / 2, GUARD_STATES.PATROL, 0);
  poseGuard(guardNamed(w, 'Warden Yara'), 18, 13, Math.PI, GUARD_STATES.PATROL, 0);
  posePlayer(w, 13.6, 10.6, -0.7, 'sneak', true);
  if (w.owl) w.owl.angle = Math.PI / 2 - 0.5;
  setLog(w, [
    'The Jade Pavilion — every warden is awake.',
    'The Jade Fox is yours. The Moon Gate stands open.',
  ]);
  return w;
}

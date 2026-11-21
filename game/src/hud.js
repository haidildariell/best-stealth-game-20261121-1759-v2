// MOONMARKET — the frame around the playfield: top bar with the night's
// objective, left panel with the plan and the market log, right panel with
// the big DETECTION banner and every warden's state, plus the title, caught
// and triumph overlays.

import { VIEW_W, VIEW_H, FIELD_X, FIELD_Y, FIELD_W, COLORS, ALARMS_TO_FAIL } from './config.js';
import { TREASURES } from './levels.js';
import { GUARD_STATES } from './guards.js';

export function drawHud(ctx, world) {
  drawChrome(ctx, world);
  if (world.mode === 'title') drawTitle(ctx, world);
  if (world.mode === 'won') drawEndCard(ctx, world, true);
  if (world.mode === 'lost') drawEndCard(ctx, world, false);
  if (world.mode === 'levelclear') drawLevelClear(ctx, world);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = COLORS.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.panelEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

function heading(ctx, x, y, text, color = COLORS.goldSoft) {
  ctx.fillStyle = color;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(text, x, y);
}

function drawChrome(ctx, world) {
  // The page background is painted by the frame loop before the world; the
  // chrome only paints its own panels so it never buries the playfield.
  // ---- top bar ------------------------------------------------------------
  panel(ctx, 0, 0, VIEW_W, 52);
  ctx.fillStyle = COLORS.gold;
  ctx.font = '700 25px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('MOONMARKET', 16, 35);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '600 11px system-ui, sans-serif';
  ctx.fillText(`NIGHT ${world.levelIndex + 1} · ${world.level.name.toUpperCase()}`, 232, 22);
  const treasure = TREASURES[world.level.treasure];
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '600 12.5px system-ui, sans-serif';
  const obj = world.player.hasTreasure
    ? `◆ ${treasure.name} is yours — reach the Moon Gate unseen`
    : `◆ Steal ${treasure.name}, then reach the Moon Gate unseen`;
  ctx.fillText(obj, 232, 41);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('TIME', VIEW_W - 118, 20);
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '700 21px Georgia, serif';
  ctx.fillText(formatTime(world.time), VIEW_W - 62, 24);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('ALARMS', VIEW_W - 118, 42);
  for (let i = 0; i < ALARMS_TO_FAIL; i++) {
    ctx.fillStyle = i < world.alarms ? COLORS.red : '#2c3358';
    ctx.beginPath();
    ctx.arc(VIEW_W - 96 + i * 18, 38, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  drawLeftPanel(ctx, world);
  drawRightPanel(ctx, world);
  // ---- bottom bar ----------------------------------------------------------
  panel(ctx, 0, VIEW_H - 34, VIEW_W, 34);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'WASD / ARROWS move · SHIFT sneak (quiet, half-seen) · SPACE sprint (fast, loud) · CLICK / F throw a coin · E douse a lantern · P pause · R restart',
    VIEW_W / 2, VIEW_H - 12,
  );
}

function drawLeftPanel(ctx, world) {
  const x = 8;
  const w = 176;
  panel(ctx, x, 60, w, 682);
  let y = 84;
  heading(ctx, x + 12, y, 'OBJECTIVES');
  y += 8;
  const treasure = TREASURES[world.level.treasure];
  y = checkLine(ctx, x + 12, y + 14, world.treasure.taken, `Steal ${treasure.name}`);
  y = checkLine(ctx, x + 12, y + 14, false, `Loot the stalls  ${world.lootTaken}/${world.lootTotal}`);
  y = checkLine(ctx, x + 12, y + 14, world.player.hasTreasure, 'Reach the Moon Gate');
  y = checkLine(ctx, x + 12, y + 14, world.ghost, 'GHOST — never spotted');
  y += 22;
  heading(ctx, x + 12, y, 'GADGETS');
  y += 20;
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText(`◉ Moon-coins ×${world.player.coins}`, x + 12, y);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '500 10.5px system-ui, sans-serif';
  ctx.fillText('CLICK / F — throw one to', x + 12, y + 14);
  ctx.fillText('pull a warden off patrol', x + 12, y + 27);
  y += 52;
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('✦ Lantern douse', x + 12, y);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '500 10.5px system-ui, sans-serif';
  ctx.fillText('E near a lit lantern —', x + 12, y + 14);
  ctx.fillText('dark is cover that moves', x + 12, y + 27);
  y += 54;
  heading(ctx, x + 12, y, 'THE THREE NIGHTS');
  y += 6;
  world.levelNames.forEach((name, i) => {
    y += 19;
    ctx.fillStyle = i === world.levelIndex ? COLORS.gold : i < world.levelIndex ? COLORS.green : '#3c4368';
    ctx.fillRect(x + 12, y - 9, 9, 9);
    ctx.fillStyle = i === world.levelIndex ? COLORS.panelText : COLORS.panelDim;
    ctx.font = `${i === world.levelIndex ? '700' : '500'} 11.5px system-ui, sans-serif`;
    ctx.fillText(`${i + 1} · ${name}`, x + 28, y);
  });
  y += 30;
  heading(ctx, x + 12, y, 'MARKET LOG');
  y += 4;
  ctx.font = '500 11px system-ui, sans-serif';
  for (const line of world.log.slice(-6)) {
    y += 15;
    ctx.fillStyle = COLORS.panelDim;
    wrapLine(ctx, line, x + 12, y, w - 24);
  }
  // Score block at the panel foot.
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.fillText('TAKE', x + 12, 706);
  ctx.fillStyle = COLORS.gold;
  ctx.font = '700 22px Georgia, serif';
  ctx.fillText(`$${world.score}`, x + 12, 730);
}

function checkLine(ctx, x, y, done, text) {
  ctx.fillStyle = done ? COLORS.green : '#3c4368';
  ctx.fillRect(x, y - 9, 10, 10);
  if (done) {
    ctx.strokeStyle = '#0b0e1d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 2, y - 4);
    ctx.lineTo(x + 4.4, y - 1.6);
    ctx.lineTo(x + 8.4, y - 7.6);
    ctx.stroke();
  }
  ctx.fillStyle = done ? COLORS.panelDim : COLORS.panelText;
  ctx.font = '500 11.5px system-ui, sans-serif';
  ctx.fillText(text, x + 16, y);
  return y;
}

function wrapLine(ctx, text, x, y, maxW) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width > maxW && line) {
      ctx.fillText(line, x, y);
      return; // log lines are one-per-slot; the tail is trimmed by design
    }
    line = trial;
  }
  ctx.fillText(line, x, y);
}

function drawRightPanel(ctx, world) {
  const x = VIEW_W - 184;
  const w = 176;
  panel(ctx, x, 60, w, 682);
  let y = 84;
  heading(ctx, x + 12, y, 'DETECTION');
  y += 8;
  const det = world.detectionState(); // {label, color, level}
  ctx.fillStyle = det.color;
  ctx.fillRect(x + 12, y, w - 24, 34);
  ctx.fillStyle = '#0b0e1d';
  ctx.font = '800 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(det.label, x + w / 2, y + 23);
  ctx.textAlign = 'left';
  y += 48;
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '500 11px system-ui, sans-serif';
  ctx.fillText(det.hint, x + 12, y);
  y += 24;
  heading(ctx, x + 12, y, 'VISIBILITY');
  y += 17;
  ctx.fillStyle = world.visibilityColor();
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText(world.visibilityLabel(), x + 12, y);
  y += 15;
  meter(ctx, x + 12, y, w - 24, world.exposureNow, world.visibilityColor());
  y += 26;
  heading(ctx, x + 12, y, 'NOISE');
  y += 17;
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '700 13px system-ui, sans-serif';
  ctx.fillText(world.noiseLabel(), x + 12, y);
  y += 15;
  meter(ctx, x + 12, y, w - 24, world.noiseLevel, '#f59e0b');
  y += 28;
  heading(ctx, x + 12, y, 'THE WARDENS');
  y += 6;
  for (const g of world.guards) {
    y += 21;
    ctx.fillStyle = COLORS.panelText;
    ctx.font = '600 11.5px system-ui, sans-serif';
    ctx.fillText(g.name.replace('Warden ', ''), x + 12, y);
    const chip = stateChip(g.state);
    ctx.fillStyle = chip.color;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(chip.label, x + w - 12, y);
    ctx.textAlign = 'left';
    y += 6;
    meter(ctx, x + 12, y, w - 24, g.suspicion, chip.color);
    y += 4;
  }
  y += 16;
  heading(ctx, x + 12, y, 'LEGEND');
  y += 18;
  const rows = [
    ['#c65a2e', 'Warden + vision cone'],
    ['#2dd4bf', 'Sable (you) — stay dark'],
    ['#f2b544', 'Lantern light: you are seen'],
    ['#a93448', 'Stall / crate: blocks sight'],
    ['#4ade80', 'Moon Gate: exit, needs prize'],
  ];
  ctx.font = '500 10.5px system-ui, sans-serif';
  for (const [color, text] of rows) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 12, y - 8, 9, 9);
    ctx.fillStyle = COLORS.panelDim;
    ctx.fillText(text, x + 27, y);
    y += 16;
  }
}

function stateChip(state) {
  switch (state) {
    case GUARD_STATES.CHASE: return { label: 'CHASE!', color: COLORS.red };
    case GUARD_STATES.INVESTIGATE: return { label: 'INVESTIGATING', color: '#f59e0b' };
    case GUARD_STATES.SUSPICIOUS: return { label: 'SUSPICIOUS', color: '#f59e0b' };
    case GUARD_STATES.SEARCH: return { label: 'SEARCHING', color: '#f59e0b' };
    case GUARD_STATES.RETURN: return { label: 'RETURNING', color: '#7c84ad' };
    default: return { label: 'PATROL', color: '#4ade80' };
  }
}

function meter(ctx, x, y, w, value, color) {
  ctx.fillStyle = '#232848';
  ctx.fillRect(x, y, w, 7);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, value)), 7);
}

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function veil(ctx) {
  ctx.fillStyle = 'rgba(5, 6, 14, 0.72)';
  ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, 680);
}

function drawTitle(ctx, world) {
  veil(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = '700 64px Georgia, serif';
  ctx.fillText('MOONMARKET', FIELD_X + FIELD_W / 2, 300);
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '500 17px Georgia, serif';
  ctx.fillText('Three nights. Three treasures. One shadow.', FIELD_X + FIELD_W / 2, 340);
  ctx.fillStyle = COLORS.panelDim;
  ctx.font = '500 13.5px system-ui, sans-serif';
  ctx.fillText('Steal each night’s prize from the lantern-lit market and slip out of the Moon Gate unseen.', FIELD_X + FIELD_W / 2, 384);
  ctx.fillText('Wardens watch in cones of lantern light — hug the dark, throw coins, douse flames.', FIELD_X + FIELD_W / 2, 406);
  ctx.fillStyle = COLORS.goldSoft;
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('Press ENTER to begin night one', FIELD_X + FIELD_W / 2, 452);
  void world;
}

function drawLevelClear(ctx, world) {
  veil(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.green;
  ctx.font = '700 40px Georgia, serif';
  ctx.fillText('THE GATE CLOSES BEHIND YOU', FIELD_X + FIELD_W / 2, 330);
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText(`${world.level.name} is stripped. Take so far: $${world.score}${world.ghost ? ' · GHOST — never spotted' : ''}`, FIELD_X + FIELD_W / 2, 368);
  ctx.fillStyle = COLORS.goldSoft;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('Press ENTER for the next night', FIELD_X + FIELD_W / 2, 410);
}

function drawEndCard(ctx, world, wonGame) {
  veil(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = wonGame ? COLORS.gold : COLORS.red;
  ctx.font = '700 44px Georgia, serif';
  ctx.fillText(wonGame ? 'THE MARKET NEVER KNEW' : 'CAUGHT IN THE LANTERN LIGHT', FIELD_X + FIELD_W / 2, 322);
  ctx.fillStyle = COLORS.panelText;
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText(
    wonGame
      ? `All three treasures lifted. Final take $${world.score}${world.ghostRun ? ' · a perfect ghost run' : ''}.`
      : `Three alarms on ${world.level.name} — the wardens drag Sable into the light.`,
    FIELD_X + FIELD_W / 2, 360,
  );
  ctx.fillStyle = COLORS.goldSoft;
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillText('Press ENTER to play again', FIELD_X + FIELD_W / 2, 402);
}

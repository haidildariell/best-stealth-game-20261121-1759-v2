// MOONMARKET — every pixel of the playfield: lantern-lit floor, striped
// stall canopies you can read as cover at a glance, warm pools of light,
// translucent vision cones clipped by the stalls, the Brass Owl's sweeping
// beam, and the little figures of Sable and the Lantern Wardens.

import {
  FIELD_X, FIELD_Y, FIELD_W, FIELD_H, TILE, COLS, ROWS, COLORS,
  LANTERN_RADIUS, hashRand,
} from './config.js';
import { conePolygon } from './vision.js';
import { GUARD_STATES } from './guards.js';

const STALL_PAINT = {
  'stall-red': { main: '#a93448', dark: '#6e2233', stripe: '#e8b4a0' },
  'stall-teal': { main: '#17756b', dark: '#0e4a44', stripe: '#a7e8dc' },
  'stall-gold': { main: '#b07d24', dark: '#75500f', stripe: '#ffe1a1' },
};

export function drawWorld(ctx, world) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
  ctx.clip();
  drawFloor(ctx, world);
  drawRugs(ctx, world);
  drawExitGate(ctx, world);
  for (const w of world.wallsPx) drawCoverBlock(ctx, w);
  drawTreasure(ctx, world);
  drawLootItems(ctx, world);
  drawLightPools(ctx, world);
  drawVisionCones(ctx, world);
  if (world.owl) drawOwlBeam(ctx, world);
  for (const g of world.guards) drawGuardFigure(ctx, g, world);
  drawPlayerFigure(ctx, world);
  world.rings.draw(ctx);
  world.puffs.draw(ctx);
  world.floaters.draw(ctx);
  drawLanterns(ctx, world);
  drawVignette(ctx);
  ctx.restore();
  drawFieldFrame(ctx);
}

function drawFloor(ctx, world) {
  ctx.fillStyle = COLORS.floorA;
  ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if ((tx + ty) % 2 === 0) continue;
      ctx.fillStyle = COLORS.floorB;
      ctx.fillRect(FIELD_X + tx * TILE, FIELD_Y + ty * TILE, TILE, TILE);
    }
  }
  // Worn stone sparkle: a few stable flecks per tile, denser near lantern light.
  ctx.fillStyle = 'rgba(200, 205, 235, 0.05)';
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const r = hashRand(tx, ty);
      if (r > 0.45) continue;
      const fx = FIELD_X + tx * TILE + 6 + r * 60 % (TILE - 10);
      const fy = FIELD_Y + ty * TILE + 6 + (r * 97) % (TILE - 10);
      ctx.fillRect(fx, fy, 2, 2);
    }
  }
  // The market's chalk lane lines.
  ctx.strokeStyle = 'rgba(242, 181, 68, 0.07)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(FIELD_X + 12, FIELD_Y + FIELD_H / 2);
  ctx.lineTo(FIELD_X + FIELD_W - 12, FIELD_Y + FIELD_H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  void world;
}

function drawRugs(ctx, world) {
  const hues = { red: '#5e2438', teal: '#17454e', gold: '#5e4517' };
  const edges = { red: '#a93448', teal: '#2dd4bf', gold: '#f2b544' };
  for (const r of world.rugsPx) {
    ctx.fillStyle = hues[r.hue] || hues.red;
    ctx.fillRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    ctx.strokeStyle = edges[r.hue] || edges.red;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x + 7, r.y + 7, r.w - 14, r.h - 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 12, r.y + 12, r.w - 24, r.h - 24);
  }
}

function drawExitGate(ctx, world) {
  const e = world.exitRect;
  const open = world.player.hasTreasure;
  const pulse = 0.55 + 0.25 * Math.sin(world.time * 2.6);
  ctx.save();
  ctx.fillStyle = open ? `rgba(74, 222, 128, ${0.20 + 0.1 * pulse})` : 'rgba(74, 222, 128, 0.07)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? COLORS.green : 'rgba(74, 222, 128, 0.4)';
  ctx.lineWidth = 3;
  ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
  ctx.fillStyle = open ? '#bbf7d0' : 'rgba(187, 247, 208, 0.55)';
  ctx.font = '700 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('MOON', e.x + e.w / 2, e.y + e.h / 2 - 4);
  ctx.fillText('GATE', e.x + e.w / 2, e.y + e.h / 2 + 12);
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.fillText(open ? '— OPEN —' : '— SEALED —', e.x + e.w / 2, e.y + e.h / 2 + 26);
  ctx.restore();
}

export function drawCoverBlock(ctx, w) {
  // Soft shadow first so blocks sit on the floor.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(w.x + 4, w.y + 6, w.w, w.h);
  if (STALL_PAINT[w.kind]) return drawStallCanopy(ctx, w, STALL_PAINT[w.kind]);
  switch (w.kind) {
    case 'crate': return drawCrate(ctx, w);
    case 'barrel': return drawBarrels(ctx, w);
    case 'hedge': return drawHedge(ctx, w);
    case 'counter': return drawCounter(ctx, w);
    case 'dais': return drawDais(ctx, w);
    default:
      ctx.fillStyle = '#2a3054';
      ctx.fillRect(w.x, w.y, w.w, w.h);
  }
}

function drawStallCanopy(ctx, w, paint) {
  ctx.fillStyle = paint.dark;
  ctx.fillRect(w.x, w.y, w.w, w.h);
  // Striped canopy.
  const stripeW = 16;
  ctx.save();
  ctx.beginPath();
  ctx.rect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
  ctx.clip();
  ctx.fillStyle = paint.main;
  ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, w.h - 6);
  ctx.fillStyle = paint.stripe;
  ctx.globalAlpha = 0.5;
  for (let x = w.x - w.h; x < w.x + w.w; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, w.y + w.h);
    ctx.lineTo(x + stripeW, w.y + w.h);
    ctx.lineTo(x + stripeW + w.h, w.y);
    ctx.lineTo(x + w.h, w.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // Scalloped canopy edge + posts + goods dots under the awning.
  ctx.fillStyle = paint.main;
  const n = Math.max(2, Math.floor(w.w / 20));
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.arc(w.x + (i + 0.5) * (w.w / n), w.y + w.h - 3, 7, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(w.x + 4, w.y + 4, 5, w.h - 8);
  ctx.fillRect(w.x + w.w - 9, w.y + 4, 5, w.h - 8);
  ctx.fillStyle = 'rgba(255, 217, 138, 0.5)';
  for (let i = 0; i < 4; i++) {
    const gx = w.x + 14 + hashRand(w.x, i) * (w.w - 28);
    const gy = w.y + 14 + hashRand(w.y, i) * (w.h - 28);
    ctx.beginPath();
    ctx.arc(gx, gy, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
}

function drawCrate(ctx, w) {
  ctx.fillStyle = '#6d4c2a';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.strokeStyle = '#4a3319';
  ctx.lineWidth = 3;
  ctx.strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w.x + 3, w.y + 3);
  ctx.lineTo(w.x + w.w - 3, w.y + w.h - 3);
  ctx.moveTo(w.x + w.w - 3, w.y + 3);
  ctx.lineTo(w.x + 3, w.y + w.h - 3);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 220, 160, 0.13)';
  ctx.fillRect(w.x, w.y, w.w, 7);
}

function drawBarrels(ctx, w) {
  const r = 15;
  const spots = [
    [w.x + 20, w.y + 20], [w.x + w.w - 20, w.y + 20],
    [w.x + 20, w.y + w.h - 20], [w.x + w.w - 20, w.y + w.h - 20],
    [w.x + w.w / 2, w.y + w.h / 2],
  ];
  for (const [bx, by] of spots) {
    ctx.fillStyle = '#7a5230';
    ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#4a3319';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(bx, by, r - 2, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#99754a';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx, by, r - 7, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawHedge(ctx, w) {
  ctx.fillStyle = '#14351f';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  for (let i = 0; i < 26; i++) {
    const hx = w.x + 6 + hashRand(i, w.x) * (w.w - 12);
    const hy = w.y + 6 + hashRand(i, w.y) * (w.h - 12);
    ctx.fillStyle = i % 3 ? '#1d5230' : '#2a7042';
    ctx.beginPath();
    ctx.arc(hx, hy, 6 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
}

function drawCounter(ctx, w) {
  ctx.fillStyle = '#54401f';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#8a6a35';
  ctx.fillRect(w.x, w.y, w.w, 10);
  ctx.fillStyle = 'rgba(255, 217, 138, 0.55)';
  for (let x = w.x + 12; x < w.x + w.w - 6; x += 22) {
    ctx.beginPath(); ctx.arc(x, w.y + w.h / 2 + 3, 2.4, 0, Math.PI * 2); ctx.fill();
  }
}

function drawDais(ctx, w) {
  ctx.fillStyle = '#232848';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.fillStyle = '#2e3462';
  ctx.fillRect(w.x + 7, w.y + 7, w.w - 14, w.h - 14);
  ctx.fillStyle = '#7a1f2b';
  ctx.fillRect(w.x + 15, w.y + 15, w.w - 30, w.h - 30);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(w.x + 7, w.y + 7, w.w - 14, w.h - 14);
}

function drawTreasure(ctx, world) {
  const t = world.treasure;
  if (t.taken) return;
  const bob = Math.sin(world.time * 2.2) * 2.5;
  const x = t.x;
  const y = t.y + bob;
  // Halo so the prize reads from across the court.
  const grad = ctx.createRadialGradient(x, y, 2, x, y, 40);
  grad.addColorStop(0, 'rgba(255, 217, 138, 0.5)');
  grad.addColorStop(1, 'rgba(255, 217, 138, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, 40, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(x, y);
  if (t.kind === 'fox') {
    ctx.fillStyle = '#3fae6a';
    ctx.beginPath();
    ctx.moveTo(-11, -4); ctx.lineTo(-13, -16); ctx.lineTo(-4, -10);
    ctx.lineTo(4, -10); ctx.lineTo(13, -16); ctx.lineTo(11, -4);
    ctx.lineTo(6, 10); ctx.lineTo(0, 14); ctx.lineTo(-6, 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0e1d';
    ctx.beginPath(); ctx.arc(-4.5, 0, 1.7, 0, Math.PI * 2); ctx.arc(4.5, 0, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(2, 6); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill();
  } else if (t.kind === 'koi') {
    ctx.fillStyle = '#f3ede2';
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 7.5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e07b39';
    ctx.beginPath(); ctx.ellipse(-3, -1, 6, 4, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(11, -2); ctx.lineTo(18, -8); ctx.lineTo(17, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0b0e1d';
    ctx.beginPath(); ctx.arc(-9, -2, 1.6, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = COLORS.goldSoft;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(11, 0);
    ctx.moveTo(0, -11); ctx.lineTo(0, 11);
    ctx.stroke();
    ctx.fillStyle = COLORS.goldSoft;
    ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255, 217, 138, 0.9)';
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t.name.toUpperCase(), x, y + 30);
}

function drawLootItems(ctx, world) {
  for (const item of world.lootItems) {
    if (item.taken) continue;
    const tw = 0.6 + 0.4 * Math.sin(world.time * 3 + item.x);
    ctx.save();
    ctx.translate(item.x, item.y);
    if (item.kind === 'coin') {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a86f14';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#a86f14';
      ctx.font = '700 8px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('M', 0, 3);
    } else if (item.kind === 'silk') {
      ctx.fillStyle = '#c9506e';
      ctx.fillRect(-10, -6, 20, 12);
      ctx.fillStyle = '#e88aa5';
      ctx.fillRect(-10, -6, 20, 4);
      ctx.strokeStyle = '#7e2c42';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -6, 20, 12);
    } else {
      ctx.fillStyle = '#c96a2c';
      ctx.fillRect(-6, -4, 12, 11);
      ctx.fillStyle = '#8a4a1c';
      ctx.fillRect(-4, -8, 8, 4);
      ctx.fillStyle = '#ffd98a';
      ctx.fillRect(-6, -1, 12, 2);
    }
    ctx.restore();
    if (tw > 0.85) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillRect(item.x + 6, item.y - 10, 2, 2);
    }
  }
}

function drawLightPools(ctx, world) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of world.lanterns) {
    if (!l.lit) continue;
    const flicker = 1 + Math.sin(world.time * 7 + l.x * 0.7) * 0.03;
    const r = LANTERN_RADIUS * 1.18 * flicker;
    const grad = ctx.createRadialGradient(l.x, l.y, 4, l.x, l.y, r);
    grad.addColorStop(0, 'rgba(255, 176, 84, 0.34)');
    grad.addColorStop(0.55, 'rgba(255, 150, 60, 0.13)');
    grad.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(l.x, l.y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawVisionCones(ctx, world) {
  for (const g of world.guards) {
    const poly = conePolygon(g.x, g.y, g.angle, world.coneRange, world.coneHalf, world.wallsPx);
    const alert = g.state === GUARD_STATES.CHASE;
    const warm = g.suspicion > 0.2 || g.state === GUARD_STATES.SUSPICIOUS || g.state === GUARD_STATES.INVESTIGATE;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fillStyle = alert ? COLORS.coneAlert : warm ? 'rgba(255, 170, 80, 0.19)' : COLORS.coneCalm;
    ctx.fill();
    ctx.strokeStyle = alert ? COLORS.coneAlertEdge : warm ? 'rgba(255, 170, 80, 0.6)' : COLORS.coneEdge;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }
}

function drawOwlBeam(ctx, world) {
  const owl = world.owl;
  const poly = conePolygon(owl.x, owl.y, owl.angle, world.owlRange, world.owlHalf, world.wallsPx);
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fillStyle = COLORS.owlBeam;
  ctx.fill();
  ctx.strokeStyle = COLORS.owlBeamEdge;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  // The Brass Owl itself: post, round body, two great eyes.
  ctx.fillStyle = '#3a3f66';
  ctx.fillRect(owl.x - 3, owl.y - 4, 6, 22);
  ctx.fillStyle = '#c9973f';
  ctx.beginPath(); ctx.arc(owl.x, owl.y - 10, 11, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7c5a17';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(owl.x, owl.y - 10, 10, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath(); ctx.arc(owl.x - 4, owl.y - 11, 3.2, 0, Math.PI * 2); ctx.arc(owl.x + 4, owl.y - 11, 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b0e1d';
  ctx.beginPath(); ctx.arc(owl.x - 4, owl.y - 11, 1.5, 0, Math.PI * 2); ctx.arc(owl.x + 4, owl.y - 11, 1.5, 0, Math.PI * 2); ctx.fill();
}

function drawGuardFigure(ctx, g, world) {
  // Shadow + coat + head + cap, with a facing wedge.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + 10, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
  const bob = Math.sin(g.stepPhase) * 1.2;
  ctx.fillStyle = g.state === GUARD_STATES.CHASE ? '#d93a3a' : '#c65a2e';
  ctx.beginPath(); ctx.arc(g.x, g.y + bob * 0.3, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#5e2c10';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(g.x, g.y + bob * 0.3, 13, 0, Math.PI * 2); ctx.stroke();
  const fx = Math.cos(g.angle);
  const fy = Math.sin(g.angle);
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(g.x + fx * 5, g.y + fy * 5 + bob * 0.3, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c3550';
  ctx.beginPath(); ctx.arc(g.x + fx * 5, g.y + fy * 5 + bob * 0.3, 6.8, Math.PI, Math.PI * 2); ctx.fill();
  // Lantern carried in the off hand.
  ctx.fillStyle = COLORS.goldSoft;
  ctx.beginPath(); ctx.arc(g.x - fy * 13, g.y + fx * 13, 3.4, 0, Math.PI * 2); ctx.fill();
  // Name label.
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const label = g.name.replace('Warden ', '').toUpperCase();
  const wText = ctx.measureText(label).width + 10;
  ctx.fillStyle = 'rgba(8, 10, 22, 0.72)';
  ctx.fillRect(g.x - wText / 2, g.y - 34, wText, 13);
  ctx.fillStyle = '#e8e4d8';
  ctx.fillText(label, g.x, g.y - 24);
  // Suspicion bar.
  if (g.suspicion > 0.02) {
    const wBar = 34;
    ctx.fillStyle = 'rgba(8,10,22,0.75)';
    ctx.fillRect(g.x - wBar / 2, g.y - 44, wBar, 5);
    ctx.fillStyle = g.suspicion > 0.75 ? COLORS.red : g.suspicion > 0.4 ? '#f59e0b' : '#a3e635';
    ctx.fillRect(g.x - wBar / 2 + 1, g.y - 43, (wBar - 2) * Math.min(1, g.suspicion), 3);
  }
  // State bubble.
  if (g.state === GUARD_STATES.CHASE) {
    drawBubble(ctx, g.x + 16, g.y - 30, '!', COLORS.red);
  } else if (g.state === GUARD_STATES.SUSPICIOUS || g.state === GUARD_STATES.INVESTIGATE || g.state === GUARD_STATES.SEARCH) {
    drawBubble(ctx, g.x + 16, g.y - 30, '?', COLORS.gold);
  }
  void world;
}

function drawBubble(ctx, x, y, mark, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b0e1d';
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(mark, x, y + 4);
}

function drawPlayerFigure(ctx, world) {
  const p = world.player;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 10, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  if (p.hidden) {
    ctx.save();
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.arc(p.x, p.y, 21, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.teal;
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y + 32);
    ctx.restore();
  }
  const squash = p.stance === 'sneak' ? 0.86 : 1;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, squash);
  ctx.fillStyle = '#0d5c50';
  ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.teal;
  ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2); ctx.fill();
  const fx = Math.cos(p.angle);
  const fy = Math.sin(p.angle);
  ctx.fillStyle = '#0b2e29';
  ctx.beginPath(); ctx.arc(fx * 3.5, fy * 3.5, 6.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe9c9';
  ctx.beginPath(); ctx.arc(fx * 5.5, fy * 5.5, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (p.stance === 'sprint') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOUD!', p.x, p.y - 22);
  } else if (p.stance === 'sneak' && p.moving) {
    ctx.fillStyle = 'rgba(45, 212, 191, 0.8)';
    ctx.font = '700 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', p.x, p.y - 22);
  }
}

function drawLanterns(ctx, world) {
  for (const l of world.lanterns) {
    ctx.fillStyle = '#232848';
    ctx.fillRect(l.x - 2, l.y - 4, 4, 18);
    if (l.lit) {
      ctx.fillStyle = '#ffca6a';
      ctx.beginPath(); ctx.arc(l.x, l.y - 8, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a35';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(l.x, l.y - 8, 6.5, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.fillStyle = '#3a3f55';
      ctx.beginPath(); ctx.arc(l.x, l.y - 8, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(200,205,220,0.5)';
      ctx.font = '700 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OUT', l.x, l.y - 16);
    }
  }
}

function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(
    FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2, FIELD_H * 0.42,
    FIELD_X + FIELD_W / 2, FIELD_Y + FIELD_H / 2, FIELD_H * 0.86,
  );
  grad.addColorStop(0, 'rgba(4, 5, 12, 0)');
  grad.addColorStop(1, 'rgba(4, 5, 12, 0.42)');
  ctx.fillStyle = grad;
  ctx.fillRect(FIELD_X, FIELD_Y, FIELD_W, FIELD_H);
}

function drawFieldFrame(ctx) {
  ctx.strokeStyle = COLORS.gold;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.strokeRect(FIELD_X - 3, FIELD_Y - 3, FIELD_W + 6, FIELD_H + 6);
  ctx.globalAlpha = 1;
}

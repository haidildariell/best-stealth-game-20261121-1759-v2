// MOONMARKET — transient visual effects: floating text ("+100", "A COIN?"),
// expanding noise rings, lantern smoke puffs and treasure sparkles. Purely
// cosmetic; the world owns the lists and steps them every frame.

export class Floaters {
  constructor() { this.items = []; }
  add(x, y, text, color = '#ffd98a', size = 15) {
    this.items.push({ x, y, text, color, size, t: 0, life: 1.5 });
  }
  update(dt) {
    for (const f of this.items) { f.t += dt; f.y -= dt * 26; }
    this.items = this.items.filter((f) => f.t < f.life);
  }
  draw(ctx) {
    for (const f of this.items) {
      const a = f.t < 0.15 ? f.t / 0.15 : 1 - Math.max(0, (f.t - 0.9) / (f.life - 0.9));
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, a));
      ctx.font = `700 ${f.size}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = f.color;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }
}

export class Rings {
  constructor() { this.items = []; }
  add(x, y, maxRadius, color = 'rgba(255, 217, 138, 0.8)') {
    this.items.push({ x, y, maxRadius, color, t: 0, life: 0.85 });
  }
  update(dt) {
    for (const r of this.items) r.t += dt;
    this.items = this.items.filter((r) => r.t < r.life);
  }
  draw(ctx) {
    for (const r of this.items) {
      const p = r.t / r.life;
      ctx.save();
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.maxRadius * (0.15 + 0.85 * p), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

export class Puffs {
  constructor() { this.items = []; }
  add(x, y, n = 7, color = 'rgba(160, 165, 190, 0.5)') {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (i % 3) * 0.4;
      this.items.push({
        x, y, vx: Math.cos(a) * (12 + (i % 4) * 7), vy: Math.sin(a) * (10 + (i % 3) * 6) - 14,
        r: 3 + (i % 3) * 2, color, t: 0, life: 0.9,
      });
    }
  }
  update(dt) {
    for (const p of this.items) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 7; }
    this.items = this.items.filter((p) => p.t < p.life);
  }
  draw(ctx) {
    for (const p of this.items) {
      ctx.save();
      ctx.globalAlpha = (1 - p.t / p.life) * 0.55;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

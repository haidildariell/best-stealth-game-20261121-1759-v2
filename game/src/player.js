// MOONMARKET — Sable, the shadow-thief. Walks, sneaks (quiet, low, hard to
// see) and sprints (fast, loud, obvious); throws moon-coins to pull wardens
// off their loops and douses lanterns to make pools of safe dark.

import {
  PLAYER_SPEED_WALK, PLAYER_SPEED_SNEAK, PLAYER_SPEED_SPRINT,
  SPRINT_NOISE_RADIUS, clamp,
} from './config.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = -Math.PI / 2;
    this.stance = 'walk'; // 'sneak' | 'walk' | 'sprint'
    this.moving = false;
    this.coins = 3;
    this.hasTreasure = false;
    this.noisePulse = 0; // seconds until the next sprint footstep ring
    this.stepPhase = 0;
  }

  // Exposure is how visible Sable is to a warden right now: stance first,
  // then the lantern light she stands in, then cover she hugs while sneaking.
  exposure(lightLevel, huggingCover) {
    let base = this.stance === 'sprint' ? 1.05 : this.stance === 'sneak' ? 0.42 : 0.72;
    if (!this.moving && this.stance !== 'sprint') base *= 0.8;
    const lightFactor = 0.35 + 0.85 * lightLevel; // shadow shrinks her, light betrays her
    const coverFactor = this.stance === 'sneak' && huggingCover ? 0.45 : 1;
    return clamp(base * lightFactor * coverFactor, 0, 1.25);
  }

  get hidden() {
    return this._hidden === true;
  }

  update(dt, input, world) {
    const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    this.moving = dx !== 0 || dy !== 0;
    this.stance = input.sprint && this.moving ? 'sprint' : input.sneak ? 'sneak' : 'walk';
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      const speed = this.stance === 'sprint' ? PLAYER_SPEED_SPRINT
        : this.stance === 'sneak' ? PLAYER_SPEED_SNEAK : PLAYER_SPEED_WALK;
      const vx = (dx / len) * speed * dt;
      const vy = (dy / len) * speed * dt;
      if (!world.circleHitsWall(this.x + vx, this.y)) this.x += vx;
      if (!world.circleHitsWall(this.x, this.y + vy)) this.y += vy;
      this.angle = Math.atan2(dy, dx);
      this.stepPhase += dt * speed * 0.11;
      if (this.stance === 'sprint') {
        this.noisePulse -= dt;
        if (this.noisePulse <= 0) {
          this.noisePulse = 0.34;
          world.emitNoise(this.x, this.y, SPRINT_NOISE_RADIUS, 'steps');
        }
      }
    }
    this._hidden = world.computeHidden(this);
  }
}

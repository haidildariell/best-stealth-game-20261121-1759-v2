// MOONMARKET — the Lantern Wardens. Each guard patrols a loop of waypoints,
// fills a suspicion meter when the player crosses its cone, investigates
// noises and glimpses, chases on full sight, and gives up back to patrol —
// detection always leaves the player a chance to break away and recover.

import {
  GUARD_SPEED_PATROL, GUARD_SPEED_INVESTIGATE, GUARD_SPEED_CHASE,
  GUARD_SPEED_RETURN, CONE_RANGE, CONE_HALF_ANGLE, angleLerp, clamp, dist,
} from './config.js';
import { pointInCone, lineOfSightClear } from './vision.js';

export const GUARD_STATES = {
  PATROL: 'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  INVESTIGATE: 'INVESTIGATE',
  CHASE: 'CHASE',
  SEARCH: 'SEARCH',
  RETURN: 'RETURN',
};

export class Guard {
  constructor(def, waypointsPx) {
    this.name = def.name;
    this.path = waypointsPx;
    this.x = waypointsPx[0].x;
    this.y = waypointsPx[0].y;
    this.wp = 1 % waypointsPx.length;
    this.angle = Math.atan2(
      waypointsPx[this.wp].y - this.y,
      waypointsPx[this.wp].x - this.x,
    );
    this.state = GUARD_STATES.PATROL;
    this.suspicion = 0; // 0..1, 1 = spotted
    this.stateT = 0;
    this.pauseT = 0;
    this.target = null; // {x, y} point of interest
    this.lastSeen = null;
    this.searchSpin = 0;
    this.stepPhase = Math.random() * 6;
  }

  get alertLevel() {
    if (this.state === GUARD_STATES.CHASE) return 2;
    if (this.suspicion > 0.25 || this.state === GUARD_STATES.INVESTIGATE || this.state === GUARD_STATES.SEARCH) return 1;
    return 0;
  }

  // A noise at (x, y): patrol and suspicious guards go and look.
  hearNoise(x, y, world) {
    if (this.state === GUARD_STATES.CHASE) return;
    this.target = { x, y };
    this.state = GUARD_STATES.INVESTIGATE;
    this.stateT = 0;
    this.suspicion = Math.max(this.suspicion, 0.55);
    world.logEvent(`${this.name} heard something…`);
  }

  // Perception: called each frame with the player's exposure (0..1.2).
  // Returns true on the frame the guard fully spots the player.
  perceive(player, exposure, walls, dt) {
    const d = dist(this.x, this.y, player.x, player.y);
    const inCone = d < 30 || (pointInCone(player.x, player.y, this.x, this.y, this.angle, CONE_RANGE, CONE_HALF_ANGLE)
      && lineOfSightClear(this.x, this.y, player.x, player.y, walls));
    if (inCone && exposure > 0.03) {
      const nearBoost = clamp(1.35 - d / CONE_RANGE, 0.45, 1.35);
      this.suspicion += dt * exposure * nearBoost * 0.9;
      this.lastSeen = { x: player.x, y: player.y };
      if (this.state === GUARD_STATES.PATROL && this.suspicion > 0.2) {
        this.state = GUARD_STATES.SUSPICIOUS;
        this.stateT = 0;
      }
      if (this.suspicion >= 1) {
        this.suspicion = 1;
        if (this.state !== GUARD_STATES.CHASE) {
          this.state = GUARD_STATES.CHASE;
          this.stateT = 0;
          return true; // newly spotted
        }
      }
    } else {
      const decay = this.state === GUARD_STATES.CHASE ? 0.10 : 0.22;
      this.suspicion = Math.max(0, this.suspicion - dt * decay);
      if (this.state === GUARD_STATES.SUSPICIOUS && this.suspicion <= 0.05) {
        this.state = GUARD_STATES.PATROL;
      }
    }
    return false;
  }

  moveToward(tx, ty, speed, dt, world) {
    const d = dist(this.x, this.y, tx, ty);
    if (d < 4) return true;
    const want = Math.atan2(ty - this.y, tx - this.x);
    this.angle = angleLerp(this.angle, want, clamp(dt * 7, 0, 1));
    const step = Math.min(d, speed * dt);
    const nx = this.x + Math.cos(this.angle) * step;
    const ny = this.y + Math.sin(this.angle) * step;
    // Guards slide along stall edges instead of sticking on corners.
    if (!world.circleHitsWall(nx, this.y)) this.x = nx;
    if (!world.circleHitsWall(this.x, ny)) this.y = ny;
    this.stepPhase += dt * speed * 0.09;
    return d <= Math.max(6, speed * dt + 2);
  }

  update(dt, world) {
    this.stateT += dt;
    switch (this.state) {
      case GUARD_STATES.PATROL: {
        if (this.pauseT > 0) { this.pauseT -= dt; break; }
        const wp = this.path[this.wp];
        if (this.moveToward(wp.x, wp.y, GUARD_SPEED_PATROL, dt, world)) {
          this.wp = (this.wp + 1) % this.path.length;
          this.pauseT = 0.7;
        }
        break;
      }
      case GUARD_STATES.SUSPICIOUS: {
        // Freeze and stare toward the last glimpse.
        if (this.lastSeen) {
          const want = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
          this.angle = angleLerp(this.angle, want, clamp(dt * 5, 0, 1));
        }
        if (this.stateT > 1.4) {
          this.target = this.lastSeen;
          this.state = this.target ? GUARD_STATES.INVESTIGATE : GUARD_STATES.PATROL;
          this.stateT = 0;
        }
        break;
      }
      case GUARD_STATES.INVESTIGATE: {
        if (!this.target) { this.state = GUARD_STATES.RETURN; break; }
        if (this.moveToward(this.target.x, this.target.y, GUARD_SPEED_INVESTIGATE, dt, world)) {
          this.state = GUARD_STATES.SEARCH;
          this.stateT = 0;
          this.searchSpin = this.angle;
        }
        if (this.stateT > 6) { this.state = GUARD_STATES.RETURN; this.stateT = 0; }
        break;
      }
      case GUARD_STATES.CHASE: {
        if (this.lastSeen) {
          this.moveToward(this.lastSeen.x, this.lastSeen.y, GUARD_SPEED_CHASE, dt, world);
        }
        if (this.suspicion <= 0.35) {
          this.state = GUARD_STATES.SEARCH;
          this.stateT = 0;
          this.searchSpin = this.angle;
          this.target = this.lastSeen;
        }
        break;
      }
      case GUARD_STATES.SEARCH: {
        this.angle += Math.sin(this.stateT * 2.4) * dt * 1.7;
        if (this.stateT > 2.2) {
          this.state = GUARD_STATES.RETURN;
          this.stateT = 0;
          this.suspicion = Math.min(this.suspicion, 0.3);
        }
        break;
      }
      case GUARD_STATES.RETURN: {
        const wp = this.path[this.wp];
        if (this.moveToward(wp.x, wp.y, GUARD_SPEED_RETURN, dt, world)) {
          this.state = GUARD_STATES.PATROL;
          this.stateT = 0;
        }
        break;
      }
      default:
        this.state = GUARD_STATES.PATROL;
    }
  }
}

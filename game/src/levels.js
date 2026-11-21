// MOONMARKET — the three nights of the market, authored in tile space.
// Wall kinds double as cover: stall-red / stall-teal / stall-gold are market
// stalls with striped canopies, crate and barrel are loose stock, hedge is a
// clipped tea hedge, counter is a shop counter, dais is the treasure plinth
// (blocks walking, never blocks the grab — you take the treasure from beside it).

export const TREASURES = {
  astrolabe: { name: 'the Brass Astrolabe', value: 300 },
  koi: { name: 'the Pearl Koi', value: 400 },
  fox: { name: 'the Jade Fox', value: 600 },
};

export const LOOT_KINDS = {
  coin: { name: 'moon coin', value: 50 },
  silk: { name: 'silk bolt', value: 100 },
  spice: { name: 'spice jar', value: 75 },
};

export const LEVELS = [
  {
    name: 'The Outer Bazaar',
    sub: 'Night one — learn the lanterns',
    treasure: 'astrolabe',
    spawn: { x: 1, y: 14 },
    exit: { x: 20, y: 15, w: 2, h: 2 },
    treasureSpot: { x: 10, y: 2 },
    dais: { x: 10, y: 2, w: 2, h: 2, kind: 'dais' },
    walls: [
      { x: 2, y: 2, w: 3, h: 2, kind: 'stall-red' },
      { x: 7, y: 1, w: 2, h: 2, kind: 'crate' },
      { x: 13, y: 2, w: 3, h: 2, kind: 'stall-teal' },
      { x: 18, y: 2, w: 3, h: 2, kind: 'stall-gold' },
      { x: 3, y: 7, w: 2, h: 2, kind: 'crate' },
      { x: 8, y: 6, w: 3, h: 2, kind: 'stall-teal' },
      { x: 15, y: 7, w: 2, h: 2, kind: 'barrel' },
      { x: 2, y: 12, w: 3, h: 2, kind: 'stall-gold' },
      { x: 8, y: 12, w: 2, h: 2, kind: 'crate' },
      { x: 14, y: 11, w: 3, h: 2, kind: 'stall-red' },
      { x: 19, y: 11, w: 2, h: 2, kind: 'hedge' },
    ],
    rugs: [
      { x: 5, y: 9, w: 4, h: 2, hue: 'red' },
      { x: 16, y: 4, w: 3, h: 2, hue: 'teal' },
      { x: 10, y: 14, w: 4, h: 1, hue: 'gold' },
    ],
    lanterns: [
      { x: 5, y: 4 }, { x: 11, y: 4 }, { x: 16, y: 5 }, { x: 6, y: 10 },
      { x: 12, y: 9 }, { x: 17, y: 13 }, { x: 3, y: 15 }, { x: 20, y: 8 },
    ],
    guards: [
      { name: 'Warden Bram', path: [[5, 5], [11, 5], [11, 10], [5, 10]] },
      { name: 'Warden Yara', path: [[13, 14], [18, 14], [18, 9], [13, 9]] },
    ],
    owl: null,
    loot: [
      { x: 6, y: 3, kind: 'coin' }, { x: 16, y: 3, kind: 'coin' },
      { x: 19, y: 5, kind: 'silk' }, { x: 10, y: 15, kind: 'coin' },
      { x: 4, y: 15, kind: 'spice' }, { x: 12, y: 13, kind: 'coin' },
    ],
  },
  {
    name: 'The Lantern Court',
    sub: 'Night two — the Brass Owl keeps watch',
    treasure: 'koi',
    spawn: { x: 20, y: 15 },
    exit: { x: 0, y: 0, w: 2, h: 2 },
    treasureSpot: { x: 10, y: 13 },
    dais: { x: 10, y: 13, w: 2, h: 2, kind: 'dais' },
    walls: [
      { x: 3, y: 2, w: 3, h: 2, kind: 'stall-teal' },
      { x: 9, y: 1, w: 2, h: 2, kind: 'crate' },
      { x: 15, y: 2, w: 3, h: 2, kind: 'stall-red' },
      { x: 2, y: 7, w: 2, h: 3, kind: 'hedge' },
      { x: 6, y: 6, w: 3, h: 2, kind: 'stall-gold' },
      { x: 14, y: 6, w: 3, h: 2, kind: 'stall-gold' },
      { x: 19, y: 7, w: 2, h: 3, kind: 'hedge' },
      { x: 3, y: 12, w: 3, h: 2, kind: 'stall-red' },
      { x: 16, y: 12, w: 2, h: 2, kind: 'barrel' },
      { x: 6, y: 15, w: 2, h: 1, kind: 'counter' },
      { x: 15, y: 15, w: 2, h: 1, kind: 'counter' },
    ],
    rugs: [
      { x: 9, y: 7, w: 5, h: 3, hue: 'red' },
      { x: 4, y: 4, w: 3, h: 1, hue: 'gold' },
      { x: 16, y: 10, w: 3, h: 2, hue: 'teal' },
    ],
    lanterns: [
      { x: 7, y: 3 }, { x: 13, y: 3 }, { x: 5, y: 9 }, { x: 18, y: 9 },
      { x: 8, y: 11 }, { x: 14, y: 11 }, { x: 11, y: 15 }, { x: 2, y: 5 },
    ],
    guards: [
      { name: 'Warden Cress', path: [[4, 5], [10, 5], [10, 10], [4, 10]] },
      { name: 'Warden Odo', path: [[12, 11], [18, 11], [18, 5], [12, 5]] },
      { name: 'Warden Pell', path: [[5, 16], [18, 16]] },
    ],
    owl: { x: 11, y: 8, sweep: 1.15, period: 9 },
    loot: [
      { x: 5, y: 3, kind: 'coin' }, { x: 18, y: 3, kind: 'silk' },
      { x: 11, y: 5, kind: 'coin' }, { x: 4, y: 14, kind: 'spice' },
      { x: 19, y: 14, kind: 'coin' }, { x: 8, y: 8, kind: 'coin' },
    ],
  },
  {
    name: 'The Jade Pavilion',
    sub: 'Night three — every warden is awake',
    treasure: 'fox',
    spawn: { x: 1, y: 15 },
    exit: { x: 20, y: 0, w: 2, h: 2 },
    treasureSpot: { x: 10, y: 7 },
    dais: { x: 10, y: 7, w: 3, h: 3, kind: 'dais' },
    walls: [
      { x: 2, y: 2, w: 3, h: 2, kind: 'stall-red' },
      { x: 8, y: 2, w: 2, h: 2, kind: 'crate' },
      { x: 14, y: 2, w: 3, h: 2, kind: 'stall-teal' },
      { x: 19, y: 4, w: 2, h: 2, kind: 'barrel' },
      { x: 2, y: 8, w: 2, h: 3, kind: 'hedge' },
      { x: 5, y: 6, w: 2, h: 2, kind: 'stall-gold' },
      { x: 16, y: 6, w: 2, h: 2, kind: 'stall-gold' },
      { x: 19, y: 10, w: 2, h: 3, kind: 'hedge' },
      { x: 3, y: 13, w: 3, h: 2, kind: 'stall-teal' },
      { x: 9, y: 13, w: 2, h: 2, kind: 'crate' },
      { x: 15, y: 13, w: 3, h: 2, kind: 'stall-red' },
    ],
    rugs: [
      { x: 9, y: 11, w: 5, h: 1, hue: 'gold' },
      { x: 5, y: 10, w: 3, h: 2, hue: 'red' },
      { x: 15, y: 10, w: 3, h: 2, hue: 'teal' },
    ],
    lanterns: [
      { x: 9, y: 6 }, { x: 14, y: 6 }, { x: 9, y: 11 }, { x: 14, y: 11 },
      { x: 5, y: 4 }, { x: 18, y: 4 }, { x: 6, y: 15 }, { x: 17, y: 15 },
    ],
    guards: [
      { name: 'Warden Bram', path: [[4, 5], [9, 5], [9, 10], [4, 10]] },
      { name: 'Warden Cress', path: [[13, 11], [18, 11], [18, 5], [13, 5]] },
      { name: 'Warden Odo', path: [[6, 15], [12, 15], [12, 12], [6, 12]] },
      { name: 'Warden Yara', path: [[18, 15], [18, 11]] },
    ],
    owl: { x: 11, y: 3, sweep: 1.3, period: 8 },
    loot: [
      { x: 6, y: 3, kind: 'coin' }, { x: 17, y: 8, kind: 'silk' },
      { x: 4, y: 11, kind: 'coin' }, { x: 12, y: 15, kind: 'spice' },
      { x: 19, y: 14, kind: 'coin' }, { x: 7, y: 8, kind: 'coin' },
    ],
  },
];

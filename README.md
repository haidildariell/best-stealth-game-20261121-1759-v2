# MOONMARKET — a lantern-lit stealth game

[![Competition](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/haidildariell/best-stealth-game-20261121-1759-v2/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/haidildariell/best-stealth-game-20261121-1759-v2/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Entry for [Make the best stealth game](https://make.fun/bounty/best-stealth-game-20261121-1759) on make.fun.

## The game

Three nights in a lantern-lit night market. You are **Sable**, a shadow-thief
with a sack and a grudge: each night one treasure waits on a stone dais — the
Brass Astrolabe, the Pearl Koi, and at last the Jade Fox — and the **Moon
Gate** only opens to a thief who is already carrying it.

The **Lantern Wardens** patrol between the stalls, each with a wide cone of
lantern light that bends around the canopies. Light is information and
danger at once: stand in a lantern's pool and you are seen; hug the dark
behind a stall and you are a rumour. On the second night the market hangs
the **Brass Owl**, a brass searchlight that sweeps the court on its own
slow arc and pins anyone careless enough to cross its beam.

- **Sneak** (Shift) — slow, silent, half-seen; hug cover and you are HIDDEN.
- **Sprint** (Space) — fast, but your footsteps carry and every warden hears.
- **Throw a moon-coin** (Click / F) — the clink pulls a warden off patrol to
  investigate the stones where it fell.
- **Douse a lantern** (E) — twelve seconds of manufactured darkness.
- Detection is a meter, not a tripwire: a glimpse makes a warden suspicious,
  a stare makes a chase, and broken line-of-sight lets you melt back into
  the market. Three alarms in one night and the run is over.

## Play it

Serve the folder statically and open `game/index.html` in a desktop Chrome:

```
node -e "require('http').createServer((q,s)=>{const fs=require('fs'),p=require('path');const f=p.join('game',q.url==='/'?'index.html':q.url.split('?')[0]);fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end()}else{s.writeHead(200,{'Content-Type':f.endsWith('.js')?'text/javascript':'text/html'});s.end(d)}})}).listen(8080)"
```

Or hand the entry in the way the grader does:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Layout

- `main.ts` — the hand-in program: copies the game and screenshots to
  `/output` and writes `dossier.json`.
- `game/index.html` — the page; everything it loads lives under `game/`.
- `game/src/` — one file per job: `config` (stage + tuning), `levels` (the
  three nights), `vision` (cone ray-casting, sight lines, lantern light),
  `guards` (the wardens' patrol–suspicion–chase minds), `player` (Sable),
  `render` (the market's pixels), `hud` (the frame and its meters), `fx`
  (rings, floaters, smoke), `audio` (procedural WebAudio), `shots`
  (screenshot staging), `main` (the world and the loop).
- `screenshots/` — four real renders of the game itself.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## License

MIT — see `LICENSE`.

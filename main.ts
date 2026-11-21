// MOONMARKET — hand-in program (Node 22, standard library only).
// The game itself is the static site under game/ (open game/index.html in a
// desktop browser and play; it asks the network for nothing). This program
// delivers it: it copies game/ and screenshots/ into /output and writes the
// dossier the judge reads, built by the vendored make.fun library so the
// bytes match the gate's own rebuild exactly.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import {
  cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// ---- maker's pre-flight audit ---------------------------------------------
// The gate refuses entries whose screenshots are oversize, malformed, or the
// wrong shape, and whose game tree busts the file/byte caps — but it refuses
// them after upload. Audit the same facts here, before a single byte is
// copied, so a bad hand-in fails at the maker's desk with a readable reason.

const SHOT_MAX_BYTES = 262144;
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;

function jpegSize(buf) {
  // Walk JPEG markers to the start-of-frame segment that carries dimensions.
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker === 0xd9 || marker === 0xda) return null;
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

function auditScreenshots(dir) {
  const names = readdirSync(dir).filter((n) => /\.(jpe?g|png)$/i.test(n)).sort();
  if (names.length < 3 || names.length > 4) {
    throw new Error(`screenshots: need 3-4 images, found ${names.length}`);
  }
  for (const name of names) {
    const buf = readFileSync(join(dir, name));
    if (buf.length > SHOT_MAX_BYTES) {
      throw new Error(`screenshots/${name}: ${buf.length} bytes over the ${SHOT_MAX_BYTES} cap`);
    }
    if (/\.png$/i.test(name)) continue; // PNG dimensions ride in the dossier audit
    const size = jpegSize(buf);
    if (!size) throw new Error(`screenshots/${name}: not a readable JPEG`);
    const long = Math.max(size.width, size.height);
    const short = Math.min(size.width, size.height);
    if (long > 1280 || short < 480) {
      throw new Error(`screenshots/${name}: ${size.width}x${size.height} outside the frame rules`);
    }
  }
  return names.length;
}

function auditGameTree(dir) {
  let files = 0;
  let bytes = 0;
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const p = join(d, name);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      files += 1;
      bytes += statSync(p).size;
      if (Buffer.byteLength(relative(dir, p)) > 1000) {
        throw new Error(`game path too long: ${relative(dir, p)}`);
      }
    }
  };
  walk(dir);
  if (files > GAME_MAX_FILES) throw new Error(`game: ${files} files over the ${GAME_MAX_FILES} cap`);
  if (bytes > GAME_MAX_BYTES) throw new Error(`game: ${bytes} bytes over the ${GAME_MAX_BYTES} cap`);
  return { files, bytes };
}

const GAME_CARD = {
  title: 'MOONMARKET',
  pitch: 'A lantern-lit stealth game: rob a night market over three nights, one treasure a night, unseen.',
  controls: 'WASD move · Shift sneak · Space sprint · Click/F throw a coin · E douse a lantern',
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const shots = auditScreenshots(join(here, 'screenshots'));
const tree = auditGameTree(join(here, 'game'));
console.log(`pre-flight ok: ${shots} screenshots, game tree ${tree.files} files / ${tree.bytes} bytes`);

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, mirrored from the competition's gate so an entry the
// scorer would refuse fails here first, at the maker's desk, with a reason.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`${GAME_CARD.title} handed in: ${GAME_CARD.pitch}`);
console.log(`controls — ${GAME_CARD.controls}`);

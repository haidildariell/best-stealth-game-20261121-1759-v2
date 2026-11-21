// MOONMARKET — tiny procedural WebAudio sounds: coin clinks, soft steps,
// pickup chimes, a doused lantern's hiss and the alarm sting. No audio files;
// every sound is an oscillator or a noise burst, and everything fails silent
// where audio is unavailable or not yet unlocked by a key press.

let ctx = null;

function ac() {
  if (typeof window === 'undefined' || !window.AudioContext) return null;
  if (!ctx) {
    try { ctx = new window.AudioContext(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.05, slideTo = null, delay = 0) {
  const a = ac();
  if (!a) return;
  try {
    const t0 = a.currentTime + delay;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* audio is decoration only */ }
}

function noiseBurst(dur, gain = 0.04, delay = 0) {
  const a = ac();
  if (!a) return;
  try {
    const t0 = a.currentTime + delay;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource();
    src.buffer = buf;
    const g = a.createGain();
    g.gain.value = gain;
    const filter = a.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2400;
    src.connect(filter).connect(g).connect(a.destination);
    src.start(t0);
  } catch { /* ignore */ }
}

export const sfx = {
  step(run = false) { noiseBurst(0.05, run ? 0.05 : 0.018); },
  clink() { tone(2093, 0.12, 'sine', 0.06); tone(2637, 0.18, 'sine', 0.045, null, 0.05); },
  pickup() { tone(880, 0.09, 'triangle', 0.05); tone(1318, 0.14, 'triangle', 0.05, null, 0.07); },
  treasure() { tone(659, 0.12, 'triangle', 0.06); tone(880, 0.12, 'triangle', 0.06, null, 0.1); tone(1318, 0.24, 'triangle', 0.06, null, 0.2); },
  douse() { noiseBurst(0.28, 0.05); },
  relight() { tone(523, 0.1, 'sine', 0.03); },
  spotted() { tone(392, 0.16, 'square', 0.045); tone(311, 0.26, 'square', 0.045, null, 0.12); },
  caught() { tone(220, 0.3, 'sawtooth', 0.05, 110); },
  win() { tone(523, 0.14, 'triangle', 0.06); tone(659, 0.14, 'triangle', 0.06, null, 0.12); tone(784, 0.14, 'triangle', 0.06, null, 0.24); tone(1046, 0.3, 'triangle', 0.06, null, 0.36); },
};

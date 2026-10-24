/* Small synthesized sound effects (Web Audio), kept quiet on purpose. */
(function (AIB) {
  'use strict';
  let ctx = null, out = null, noise = null;
  let enabled = true;

  // Created on the first sound, which always follows a click (autoplay rules).
  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    }
    const C = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    out = ctx.createGain();
    out.gain.value = 0.35;
    out.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  // Quick attack, exponential decay to silence.
  function env(t, dur, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out);
    return g;
  }
  function tone(t, dur, peak, type, f, f2) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    o.connect(env(t, dur, peak));
    o.start(t);
    o.stop(t + dur + 0.05);
  }
  function hiss(t, dur, peak, type, f, f2, q = 1) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const flt = ctx.createBiquadFilter();
    flt.type = type;
    flt.Q.value = q;
    flt.frequency.setValueAtTime(f, t);
    if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur);
    s.connect(flt).connect(env(t, dur, peak));
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  const FX = {
    play: t => tone(t, 0.09, 0.3, 'triangle', 520, 360),
    pick: t => tone(t, 0.05, 0.18, 'triangle', 900),
    undo: t => tone(t, 0.1, 0.2, 'sine', 440, 300),
    ignite: t => hiss(t, 0.22, 0.6, 'bandpass', 900, 3200, 1.2),
    discard: t => { hiss(t, 0.18, 0.3, 'lowpass', 700, 150); tone(t, 0.16, 0.25, 'sine', 150, 60); },
    win: t => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(t + i * 0.09, 0.4, 0.22, 'triangle', f)),
    lose: t => { hiss(t, 1.1, 0.4, 'lowpass', 1000, 80); tone(t, 0.7, 0.35, 'sine', 120, 35); },
  };

  AIB.sound = {
    get on() { return enabled; },
    set on(v) { enabled = !!v; },
    play(name) {
      // Audio is a nicety: a failing audio stack must never stop the game.
      try {
        if (!enabled || !init()) return;
        FX[name](ctx.currentTime + 0.01);
      } catch (err) {
        console.warn('sound disabled:', err);
        enabled = false;
      }
    },
  };
})(globalThis.AIB);

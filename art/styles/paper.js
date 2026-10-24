/* Papercut: layered paper shapes with soft shadows, rounded type, a crafty feel.
   Passive sides are cool blue paper under a calm night sky, with every fuse still unlit; ignited
   sides are orange paper with flames, embers and lit sparks. */
(function (Art) {
  'use strict';
  const INK = '#3b3340';
  const SIDE = {
    pas: { frame: '#d3e2ea', sky: '#c3e1ef', land: ['#a4cee3', '#80b6d6', '#5c9bc4'], pill: '#35648c', ring: '#8db4cb', cls: '#4b6c84' },
    ign: { frame: '#f3a56c', sky: '#ffd59c', land: ['#ffa75e', '#f57a3d', '#df532b'], pill: '#cc4024', ring: '#e8703c', cls: '#7a3418' },
  };
  const KW = { royal: '#f5b5ac', urgent: '#ffd95e', absolute: '#fffdf7' };
  const PAINT = {
    k: INK, w: '#fffdf7', eg: '#f8ecd2', sk: '#f7d4bd', ck: 'rgba(240,110,120,.32)', pk: '#f4a7b9', hr: '#e8664c', hy: '#f5c95c', hb: '#9a6038',
    gy: '#bdb8c4', dg: '#4c4655', c1: '#8a6cb6', c2: '#cbb6e4', c3: '#f4c542', rd: '#e0533d', or: '#f59a3c', yl: '#fbe38a',
    gr: '#5fa35c', lg: '#a5d38b', bl: '#4f8fd1', lb: '#c4e3f3', nv: '#34437a', tl: '#3fa7a0', br: '#8a5a3b', tn: '#f0c27b', bd: '#c9773b',
    wg: 'rgba(255,255,255,.72)', fm: '#c9e6a2', fx: '#ffd84a', fx2: '#f2803a', sh: 'rgba(43,29,16,.16)', hl: 'rgba(255,255,255,.5)', tip: INK,
  };

  // Flame tongues along a baseline, for the ignited background.
  function flames(y0, amp, step, phase, w = 376, h = 270) {
    let d = `M0 ${h}L0 ${y0}`, x = -phase, i = 0;
    while (x < w) {
      const a = amp * (0.75 + 0.25 * Math.sin(i++ * 2.1));
      d += `C${x + step * .15} ${y0 - a * .45} ${x + step * .45} ${y0 - a * .7} ${x + step * .55} ${y0 - a}`
        + `C${x + step * .6} ${y0 - a * .55} ${x + step * .8} ${y0 - a * .3} ${x + step} ${y0}`;
      x += step;
    }
    return `${d}L${w} ${h}Z`;
  }
  const ember = (x, y, s) => Art.star(x, y, 4, 6 * s, 1.6 * s, '').replace('class=""', 'fill="#fff3b8"');

  Art.style({
    id: 'paper',
    name: 'Papercut',
    blurb: 'Layered cut paper with soft shadows, rounded type.',
    fonts: ['600 20px "Fredoka"', '700 20px "Fredoka"', '700 20px "Nunito"', '800 20px "Nunito"', '900 20px "Nunito"', 'italic 700 20px "Nunito"'],
    defs: `
      <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="1.3" stdDeviation="1.1" flood-color="#2b1d10" flood-opacity=".38"/>
      </filter>
      <filter id="paper-shadow-lg" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#2b1d10" flood-opacity=".35"/>
      </filter>
      <filter id="paper-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="11" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .3 0 0 0 0 .22 0 0 0 0 .12 .6 0 0 0 -.22"/>
      </filter>`,
    css: `
      .s-paper { color: ${INK}; font-family: 'Nunito', sans-serif; }
      .s-paper.pas { background: ${SIDE.pas.frame}; } .s-paper.ign { background: ${SIDE.ign.frame}; }
      .s-paper .sc > g, .s-paper .icon .sc > g { filter: url(#paper-shadow); }
      .s-paper .sc * { stroke: none; }
      ${Object.entries(PAINT).map(([k, v]) => `.s-paper .${k} { fill: ${v}; }`).join(' ')}
      .s-paper .ln, .s-paper .lnb, .s-paper .fuse { fill: none; stroke: ${INK}; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.1; }
      .s-paper .lnb { stroke-width: 3; } .s-paper .fuse { stroke: #6b4f3a; stroke-width: 2.4; }
      .s-paper.pas .spark { display: none; }
      .s-paper .bomb b { color: #fff6e6; font: 700 74px 'Fredoka', sans-serif; top: 24px; }
      .s-paper .kw { left: 170px; top: 10px; width: 212px; height: 42px; filter: drop-shadow(0 2px 2px rgba(43,29,16,.35)); }
      .s-paper .kw span { font: 700 19px 'Fredoka', sans-serif; letter-spacing: .26em; margin-left: .26em; text-transform: uppercase; color: ${INK}; }
      .s-paper .title { top: 52px; left: 140px; right: 12px; }
      .s-paper.kw-none .title { top: 40px; }
      .s-paper .title b { font: 700 36px 'Fredoka', sans-serif; color: ${INK}; }
      .s-paper .title small { font: 800 14px 'Nunito', sans-serif; letter-spacing: .22em; text-transform: uppercase; line-height: 1.1; margin-top: 1px; }
      .s-paper.pas .title small { color: ${SIDE.pas.cls}; } .s-paper.ign .title small { color: ${SIDE.ign.cls}; }
      .s-paper .box { top: 392px; height: 144px; left: 22px; right: 22px; background: #fffdf7; border-radius: 18px; }
      .s-paper.pas .box { box-shadow: 0 0 0 3px ${SIDE.pas.ring}, 0 4px 7px rgba(43,29,16,.3); }
      .s-paper.ign .box { box-shadow: 0 0 0 3px ${SIDE.ign.ring}, 0 4px 7px rgba(43,29,16,.3); }
      .s-paper.yel .box { background: #ffe27a; }
      .s-paper .txt { font-size: 21px; line-height: 1.22; font-weight: 700; }
      .s-paper .cap { font-weight: 900; letter-spacing: .02em; font-size: .92em; }
      .s-paper .lbl { font-weight: 900; color: #e0603c; text-transform: uppercase; font-size: .9em; }
      .s-paper.yel .lbl { color: #9a5a12; }
      .s-paper.yel .txt { font-style: italic; }
      .s-paper .hlt { background: #e8664c; color: #fffdf7; border-radius: 12px; padding: .2em .5em; margin: .3em 0; box-shadow: 0 2px 3px rgba(43,29,16,.3); }
      .s-paper .sm { opacity: .75; }
      .s-paper .state { bottom: 12px; padding: 6px 16px; color: #fff6e6; border-radius: 20px; font: 600 19px 'Fredoka', sans-serif; letter-spacing: .12em; text-transform: uppercase; box-shadow: 0 2px 3px rgba(43,29,16,.35); }
      .s-paper.pas .state { background: ${SIDE.pas.pill}; } .s-paper.ign .state { background: ${SIDE.ign.pill}; }
      .s-paper .state svg { height: 20px; }
      .s-paper .exp { left: 12px; bottom: 10px; width: 50px; height: 50px; background: #fffdf7; border-radius: 50%; box-sizing: border-box; padding: 5px; box-shadow: 0 2px 4px rgba(43,29,16,.35); }
      .s-paper .sym { color: ${INK}; }
      .iconbox.s-paper { background: #fffdf7; border-radius: 50%; box-sizing: border-box; padding: 7px; box-shadow: 0 2px 5px rgba(0,0,0,.4); }
    `,
    bg: d => {
      const s = SIDE[d.ign ? 'ign' : 'pas'], [h1, h2, h3] = s.land;
      const scenery = d.ign
        ? `${d.type === 'all' ? '' : `${Art.star(316, 58, 16, 48, 31, '').replace('class=""', 'fill="#ffe68c" filter="url(#paper-shadow)"')}
           <circle cx="316" cy="58" r="22" fill="#fff4cc"/>`}
           ${[[40, 40, 1], [118, 22, .8], [196, 60, 1.1], [250, 26, .7], [70, 96, .7], [360, 120, .8], [150, 110, .6]].map(e => ember(...e)).join('')}
           <path d="${flames(178, 40, 50, 10)}" fill="${h1}" filter="url(#paper-shadow-lg)"/>
           <path d="${flames(214, 34, 42, 30)}" fill="${h2}" filter="url(#paper-shadow-lg)"/>
           <path d="${flames(248, 26, 36, 4)}" fill="${h3}" filter="url(#paper-shadow-lg)"/>`
        : `<g filter="url(#paper-shadow)"><circle cx="316" cy="56" r="25" fill="#fbf4dd"/></g>
           <circle cx="306" cy="50" r="4.5" fill="#eee2c2"/><circle cx="324" cy="64" r="3.2" fill="#eee2c2"/><circle cx="322" cy="46" r="2.2" fill="#eee2c2"/>
           <g filter="url(#paper-shadow)" fill="#f6fbfd"><path d="M30 82a16 16 0 0 1 28-12a20 20 0 0 1 36 8a12 12 0 0 1 4 22H34a12 12 0 0 1-4-18Z"/>
             <path d="M178 46a12 12 0 0 1 22-9a15 15 0 0 1 27 6a9 9 0 0 1 3 17h-48a9 9 0 0 1-4-14Z"/></g>
           ${[[130, 30], [262, 112], [24, 30], [360, 128], [230, 92]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fffdf7"/>`).join('')}
           <path d="M0 170C60 140 120 150 190 170S310 150 376 140V270H0Z" fill="${h1}" filter="url(#paper-shadow-lg)"/>
           <path d="M0 210C80 180 160 200 230 214S330 196 376 190V270H0Z" fill="${h2}" filter="url(#paper-shadow-lg)"/>
           <path d="M0 246C90 226 190 240 260 250S340 238 376 236V270H0Z" fill="${h3}" filter="url(#paper-shadow-lg)"/>`;
      return `<svg viewBox="0 0 400 601">
        <rect width="400" height="601" fill="${s.frame}"/>
        <g filter="url(#paper-shadow-lg)"><rect x="12" y="118" width="376" height="270" rx="18" fill="${s.sky}"/></g>
        <svg x="12" y="118" width="376" height="270" viewBox="0 0 376 270">
          <clipPath id="paper-panel-${d.side}"><rect width="376" height="270" rx="18"/></clipPath>
          <g clip-path="url(#paper-panel-${d.side})">${scenery}</g>
        </svg>
        <rect width="400" height="601" filter="url(#paper-grain)"/>
      </svg>`;
    },
    bomb: d => `<svg viewBox="0 0 132 132">
      ${d.ign ? '<circle cx="121" cy="9" r="17" fill="#ffe68c" opacity=".7"/>' : ''}
      <g filter="url(#paper-shadow-lg)">
        <path d="M100 18C106 10 113 8 121 9" stroke="#6b4f3a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <rect x="84" y="20" width="22" height="16" rx="4" transform="rotate(45 95 28)" fill="#5a5160"/>
        <circle cx="58" cy="72" r="52" fill="${INK}"/>
      </g>
      <path d="M22 66A37 37 0 0 1 50 34" stroke="#5a5160" stroke-width="8" fill="none" stroke-linecap="round"/>
      ${d.ign ? `<g filter="url(#paper-shadow)">${Art.star(121, 9, 8, 16, 6, '').replace('class=""', 'fill="#ffd84a"')}<circle cx="121" cy="9" r="5.5" fill="#f2803a"/></g>`
        : '<circle cx="121" cy="9" r="3" fill="#3b3340"/>'}
    </svg>`,
    kw: d => `<svg viewBox="0 0 212 42"><path d="M2 4H210L200 21L210 38H2L12 21Z" fill="${KW[d.kw]}"/></svg>`,
    state: d => d.ign ? `<span>Ignited</span>${Art.glyph.boom}` : `<span>Passive</span>${Art.glyph.flip}`,
  });
})(globalThis.AIBArt);

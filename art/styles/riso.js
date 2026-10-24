/* Risograph: three spot inks (blue, fluorescent pink, yellow), halftone dots, grain, and outlines
   printed slightly out of register. */
(function (Art) {
  'use strict';
  const BLUE = '#0078bf', PINK = '#ff48b0', YELLOW = '#ffe800', PAPER = '#f6f1e7';
  const KW = { royal: PINK, urgent: YELLOW, absolute: BLUE };

  const dots = (id, c, r, step = 5, rot = 20) =>
    `<pattern id="${id}" width="${step}" height="${step}" patternUnits="userSpaceOnUse" patternTransform="rotate(${rot})"><circle cx="${step / 2}" cy="${step / 2}" r="${r}" fill="${c}"/></pattern>`;

  Art.style({
    id: 'riso',
    name: 'Risograph print',
    blurb: 'Two or three spot inks, halftone dots, grainy paper, slightly off-register lines.',
    fonts: ['500 20px "Space Grotesk"', '700 20px "Space Grotesk"', '400 20px "Space Mono"', '700 20px "Space Mono"', 'italic 400 20px "Space Mono"'],
    defs: `
      ${dots('riso-b1', BLUE, 1.3)}${dots('riso-b2', BLUE, 2.1)}${dots('riso-p1', PINK, 1.6, 5, 70)}${dots('riso-y', YELLOW, 2.4, 5, 5)}
      ${dots('riso-sh', BLUE, .95, 2.6, 20)}
      <filter id="riso-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="7" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .1 0 0 0 0 .12 0 0 0 0 .2 1.1 0 0 0 -.5"/>
      </filter>`,
    css: `
      .s-riso { background: ${PAPER}; color: ${BLUE}; font-family: 'Space Grotesk', sans-serif; }
      .s-riso .sc * { stroke: none; }
      .s-riso .k { fill: #1d3f8f; } .s-riso .w { fill: #fdfaf3; } .s-riso .sk { fill: #ffc4dc; }
      .s-riso .hr { fill: ${PINK}; } .s-riso .c1 { fill: #6c55b8; } .s-riso .c2 { fill: #ff9fcf; }
      .s-riso .c3 { fill: ${YELLOW}; } .s-riso .eg { fill: #fff3b5; } .s-riso .gr { fill: #3ea350; }
      .s-riso .bl { fill: #3a8fd8; } .s-riso .wg { fill: rgba(170,215,245,.6); }
      .s-riso .fx { fill: ${YELLOW}; } .s-riso .fx2 { fill: ${PINK}; }
      .s-riso .sh { fill: url(#riso-sh); } .s-riso .hl { fill: rgba(255,255,255,.55); }
      .s-riso .ln, .s-riso .lnb, .s-riso .fuse { fill: none; stroke: ${BLUE}; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.6; }
      .s-riso .lnb { stroke-width: 2.6; }
      .s-riso .reg { mix-blend-mode: multiply; }
      .s-riso .reg * { fill: none !important; stroke: ${BLUE} !important; stroke-width: 1.2; }
      .s-riso .reg .sh, .s-riso .reg .hl, .s-riso .reg .wg { stroke: none !important; }
      .s-riso .reg .lnb { stroke-width: 2.6; } .s-riso .reg .ln, .s-riso .reg .fuse { stroke-width: 1.6; }
      .s-riso .bomb b { color: ${PAPER}; font: 700 80px 'Space Grotesk', sans-serif; letter-spacing: -.04em; top: 24px; }
      .s-riso .kw { left: 170px; top: 12px; width: 210px; height: 40px; }
      .s-riso .kw span { font: 700 18px 'Space Mono', monospace; letter-spacing: .32em; margin-left: .32em; text-transform: uppercase; color: ${BLUE}; }
      .s-riso.kw-royal .kw span, .s-riso.kw-absolute .kw span { color: ${PAPER}; }
      .s-riso .title { top: 56px; left: 138px; }
      .s-riso.kw-none .title { top: 38px; }
      .s-riso .title b { font: 700 38px 'Space Grotesk', sans-serif; letter-spacing: -.02em; text-shadow: 2px 1.5px 0 rgba(255,72,176,.85); }
      .s-riso .title small { font: 700 14px 'Space Mono', monospace; letter-spacing: .26em; text-transform: uppercase; color: ${PINK}; margin-top: 4px; }
      .s-riso .box { top: 392px; height: 144px; left: 22px; right: 22px; border: 2.5px solid ${BLUE}; background: #fdfaf3; }
      .s-riso .box::before { content: ''; position: absolute; inset: -2.5px; transform: translate(4px, 3px); border: 2.5px solid ${PINK}; mix-blend-mode: multiply; pointer-events: none; }
      .s-riso.yel .box { background: #fff38a; }
      .s-riso .txt { font-size: 20px; line-height: 1.25; font-weight: 500; color: #134f8f; }
      .s-riso .cap { font-weight: 700; letter-spacing: .02em; }
      .s-riso .lbl { font: 700 .82em 'Space Mono', monospace; text-transform: uppercase; color: ${PINK}; }
      .s-riso.yel .txt { font-style: italic; }
      .s-riso .hlt { background: ${PINK}; color: ${PAPER}; padding: .2em .4em; font-weight: 700; margin: .3em 0; }
      .s-riso .sm { opacity: .8; }
      .s-riso .state { bottom: 14px; padding: 5px 14px; background: ${BLUE}; color: ${PAPER}; font: 700 16px 'Space Mono', monospace; letter-spacing: .2em; text-transform: uppercase; box-shadow: 3px 2px 0 rgba(255,72,176,.85); }
      .s-riso.ign .state { background: ${PINK}; box-shadow: 3px 2px 0 rgba(0,120,191,.85); }
      .s-riso .state svg { height: 20px; }
      .s-riso .exp { left: 14px; bottom: 12px; width: 48px; height: 48px; border: 2.5px solid ${BLUE}; border-radius: 50%; box-sizing: border-box; padding: 4px; background: ${PAPER}; }
      .s-riso .sym { color: ${PINK}; }
      .iconbox.s-riso { border: 3px solid ${BLUE}; border-radius: 50%; box-sizing: border-box; padding: 6px; background: ${PAPER}; }
    `,
    wrap: src => `<g class="sc">${src}</g><g class="reg" transform="translate(1.3 .9)">${src}</g>`,
    bg: d => `<svg viewBox="0 0 400 601">
      <rect width="400" height="601" fill="${PAPER}"/>
      ${d.ign
        ? `<rect x="14" y="124" width="372" height="260" fill="url(#riso-y)"/><rect x="18" y="127" width="372" height="260" fill="url(#riso-p1)" style="mix-blend-mode:multiply"/>`
        : `<rect x="14" y="124" width="372" height="260" fill="url(#riso-b1)"/><rect x="16" y="300" width="372" height="86" fill="url(#riso-b2)" style="mix-blend-mode:multiply"/>`}
    </svg>`,
    deco: () => `<svg viewBox="0 0 400 601"><rect width="400" height="601" filter="url(#riso-grain)" style="mix-blend-mode:multiply"/></svg>`,
    bomb: d => `<svg viewBox="0 0 132 132">
      <circle cx="61" cy="75" r="51" fill="${PINK}"/>
      <g style="mix-blend-mode:multiply">
        <rect x="84" y="20" width="22" height="16" rx="2" transform="rotate(45 95 28)" fill="${BLUE}"/>
        <path d="M100 18C106 10 113 8 121 9" stroke="${BLUE}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <circle cx="57" cy="71" r="51" fill="${BLUE}"/>
      </g>
      ${d.ign ? `<g style="mix-blend-mode:multiply">${Art.star(121, 9, 8, 15, 6, '').replace('class=""', `fill="${YELLOW}"`)}<circle cx="122" cy="10" r="5" fill="${PINK}"/></g>` : ''}
    </svg>`,
    kw: d => `<svg viewBox="0 0 210 40"><rect x="3" y="3" width="204" height="34" fill="${KW[d.kw]}"/><rect x="0" y="0" width="204" height="34" fill="none" stroke="${d.kw === 'royal' ? BLUE : PINK}" stroke-width="2" style="mix-blend-mode:multiply"/></svg>`,
    state: d => d.ign ? `<span>Ignited</span>${Art.glyph.boom}` : `<span>Passive</span>${Art.glyph.flip}`,
  });
})(globalThis.AIBArt);

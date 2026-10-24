/* Storybook: wobbly ink lines and watercolour washes on cream paper. */
(function (Art) {
  'use strict';
  const INK = '#2b2420', PAPER = '#efe4cf';
  const WASH = { pas: '#9fcbe2', ign: '#f2ad72' };
  const KW = { royal: '#f1bfb5', urgent: '#f2d55a', absolute: '#fbf7ee' };

  Art.style({
    id: 'ink',
    name: 'Storybook ink',
    blurb: 'Wobbly pen lines, watercolour washes, cream paper.',
    fonts: ['40px "IM Fell English"', 'italic 40px "IM Fell English"', '40px "IM Fell English SC"'],
    defs: `
      <filter id="ink-wobble" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="ink-wobble-lg" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="9" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="ink-wash" x="-8%" y="-8%" width="116%" height="116%">
        <feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="3" seed="3" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="22" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency=".011" numOctaves="2" seed="12" result="m"/>
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.9 0 0 0 -.25" result="ma"/>
        <feComposite in="d" in2="ma" operator="in" result="w"/>
        <feGaussianBlur in="w" stdDeviation="1.4"/>
      </filter>
      <filter id="ink-paper" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="2" result="n"/>
        <feColorMatrix in="n" type="matrix" values="0 0 0 0 .42 0 0 0 0 .32 0 0 0 0 .2 .55 0 0 0 -.18"/>
      </filter>
      <pattern id="ink-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
        <line x1=".5" y1="0" x2=".5" y2="3.2" stroke="${INK}" stroke-width=".75" stroke-opacity=".6"/>
      </pattern>`,

    css: `
      .s-ink { background: ${PAPER}; color: ${INK}; font-family: 'IM Fell English', Georgia, serif; }
      .s-ink .sc { filter: url(#ink-wobble); }
      .s-ink .sc * { stroke: ${INK}; stroke-width: 1.3; stroke-linejoin: round; stroke-linecap: round; }
      .s-ink .k { fill: ${INK}; } .s-ink .w { fill: #fbf7ee; } .s-ink .sk { fill: #f3d3bd; }
      .s-ink .hr { fill: #d8644f; } .s-ink .c1 { fill: #8f77b6; } .s-ink .c2 { fill: #c6b5de; }
      .s-ink .c3 { fill: #e7bf57; } .s-ink .eg { fill: #f5e8cc; } .s-ink .gr { fill: #86a96f; }
      .s-ink .bl { fill: #74abd1; } .s-ink .wg { fill: rgba(255,255,255,.55); }
      .s-ink .fx { fill: #ffd84a; } .s-ink .fx2 { fill: #f07f3c; }
      .s-ink .sh { fill: url(#ink-hatch); stroke: none; }
      .s-ink .hl { fill: rgba(255,255,255,.6); stroke: none; }
      .s-ink .ln, .s-ink .lnb, .s-ink .fuse { fill: none; }
      .s-ink .lnb { stroke-width: 2.4; } .s-ink .fuse { stroke-width: 1.7; }
      .s-ink .spark * { stroke-width: .8; }
      .s-ink .bomb b { color: ${PAPER}; font-size: 74px; top: 22px; }
      .s-ink .kw span { font: 22px 'IM Fell English SC', serif; letter-spacing: .28em; text-transform: lowercase; margin-left: .28em; }
      .s-ink .title b { font-size: 37px; }
      .s-ink .title small { font: 17px 'IM Fell English SC', serif; letter-spacing: .14em; text-transform: lowercase; color: #5a4a3f; margin-top: 3px; font-size: 19px; }
      .s-ink .txt { font-size: 24px; line-height: 1.2; }
      .s-ink .cap { font-family: 'IM Fell English SC', serif; text-transform: lowercase; letter-spacing: .02em; }
      .s-ink .lbl { font-family: 'IM Fell English SC', serif; font-weight: 400; }
      .s-ink.yel .txt { font-style: italic; }
      .s-ink .hlt { background: #c4473b; color: #fbf3e6; border-radius: 40% 46% 42% 48% / 60% 50% 56% 48%; padding: .22em .5em; font-size: 1.08em; margin: .3em 0; }
      .s-ink .sm { color: #5d4d42; }
      .s-ink .state { bottom: 12px; padding: 6px 16px 6px 18px; background: ${INK}; color: ${PAPER}; border-radius: 22px; font: 19px 'IM Fell English SC', serif; letter-spacing: .14em; text-transform: lowercase; }
      .s-ink .state svg { height: 22px; }
      .s-ink .exp { background: #fbf7ee; border: 2.5px solid ${INK}; border-radius: 50%; box-sizing: border-box; padding: 4px; }
      .s-ink .sym { color: ${INK}; }
      .s-ink .icon .sc * { stroke-width: 1.1; }
      .iconbox.s-ink { background: #fbf7ee; border-radius: 50%; box-sizing: border-box; padding: 6px; border: 3px solid ${INK}; }
    `,

    bg: d => `<svg viewBox="0 0 400 601">
      <rect width="400" height="601" fill="${PAPER}"/>
      <rect x="18" y="112" width="364" height="276" rx="30" fill="${WASH[d.ign ? 'ign' : 'pas']}" filter="url(#ink-wash)"/>
      <rect width="400" height="601" filter="url(#ink-paper)"/>
      <path d="M150 118 Q270 112 386 120" stroke="${INK}" stroke-width="2" fill="none" filter="url(#ink-wobble-lg)" opacity=".7"/>
    </svg>`,

    bomb: d => `<svg viewBox="0 0 132 132"><g filter="url(#ink-wobble-lg)">
      <path d="M102 16C108 9 114 8 121 9" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="84" y="20" width="22" height="16" rx="3" transform="rotate(45 95 28)" fill="${INK}"/>
      <circle cx="58" cy="72" r="52" fill="#25201d"/>
      <path d="M22 62A38 38 0 0 1 46 32" stroke="${PAPER}" stroke-opacity=".45" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${d.ign ? `<g transform="translate(122 9) scale(2)" class="sc-spark">${Art.spark(0, 0, 1).replace(/class="fx"/, `fill="#ffd84a" stroke="${INK}" stroke-width=".6"`).replace(/class="fx2"/, 'fill="#f07f3c"')}</g>` : ''}
    </g></svg>`,

    kw: d => `<svg viewBox="0 0 228 46"><path d="M8 5H220L210 23L220 41H8L18 23Z" fill="${KW[d.kw]}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round" filter="url(#ink-wobble-lg)"/></svg>`,

    box: d => `<svg viewBox="0 0 352 150" preserveAspectRatio="none"><rect x="3" y="3" width="346" height="144" rx="26" fill="${d.yellow ? '#f3dc70' : '#fbf7ee'}" stroke="${INK}" stroke-width="2.4" filter="url(#ink-wobble-lg)"/></svg>`,

    state: d => d.ign ? `<span>ignited</span>${Art.glyph.boom}` : `<span>passive</span>${Art.glyph.flip}`,
  });
})(globalThis.AIBArt);

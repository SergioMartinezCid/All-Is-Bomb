/* Poster: flat mid-century shapes, a sunburst behind the art, no outlines. */
(function (Art) {
  'use strict';
  const NAVY = '#233142', CREAM = '#f7f0e1', MUSTARD = '#e9c46a', CORAL = '#e76f51';
  const SKY = { pas: ['#2a9d8f', '#33ae9f'], ign: ['#e76f51', '#ee8467'] };
  const KW = { royal: '#eda6a3', urgent: MUSTARD, absolute: CREAM };

  function burst(cx, cy, n, r, c) {
    let s = '';
    for (let i = 0; i < n; i++) {
      const a0 = (i * 2) * Math.PI / (n * 2), a1 = (i * 2 + 1) * Math.PI / (n * 2);
      s += `<path d="M${cx} ${cy}L${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy + r * Math.sin(a0)).toFixed(1)}L${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy + r * Math.sin(a1)).toFixed(1)}Z" fill="${c}"/>`;
    }
    return s;
  }

  Art.style({
    id: 'poster',
    name: 'Flat poster',
    blurb: 'Bold flat colour, sunburst backgrounds, condensed type.',
    fonts: ['40px "Bebas Neue"', '500 20px "Work Sans"', '700 20px "Work Sans"', '800 20px "Work Sans"', 'italic 500 20px "Work Sans"'],
    defs: `<clipPath id="poster-art"><rect x="0" y="128" width="400" height="258"/></clipPath>`,
    css: `
      .s-poster { background: ${NAVY}; color: ${NAVY}; font-family: 'Work Sans', sans-serif; }
      .s-poster .sc * { stroke: none; }
      .s-poster .k { fill: ${NAVY}; } .s-poster .w { fill: #fffaf0; } .s-poster .sk { fill: #f5c7a5; }
      .s-poster .hr { fill: ${CORAL}; } .s-poster .c1 { fill: #6d597a; } .s-poster .c2 { fill: #eda6a3; }
      .s-poster .c3 { fill: ${MUSTARD}; } .s-poster .eg { fill: #f4e4c4; } .s-poster .gr { fill: #7fae5f; }
      .s-poster .bl { fill: #3f7fc9; } .s-poster .wg { fill: rgba(255,250,240,.7); }
      .s-poster .fx { fill: #f9d548; } .s-poster .fx2 { fill: ${CORAL}; }
      .s-poster .sh { fill: rgba(35,49,66,.22); } .s-poster .hl { fill: rgba(255,255,255,.45); }
      .s-poster.ign .hr, .s-poster.ign .fx2 { fill: #c4462b; }
      .s-poster .ln, .s-poster .lnb, .s-poster .fuse { fill: none; stroke: ${NAVY}; stroke-linecap: round; stroke-linejoin: round; }
      .s-poster .ln { stroke-width: 1.8; } .s-poster .lnb { stroke-width: 2.8; } .s-poster .fuse { stroke-width: 2; }
      .s-poster .bomb b { color: ${CREAM}; font: 96px 'Bebas Neue', sans-serif; top: 26px; }
      .s-poster .kw { left: 184px; top: 14px; width: 196px; height: 36px; border-radius: 18px; }
      .s-poster.kw-royal .kw { background: ${KW.royal}; } .s-poster.kw-urgent .kw { background: ${KW.urgent}; } .s-poster.kw-absolute .kw { background: ${KW.absolute}; }
      .s-poster .kw span { font: 27px 'Bebas Neue', sans-serif; letter-spacing: .2em; margin-left: .2em; color: ${NAVY}; }
      .s-poster .title { top: 50px; left: 140px; right: 14px; }
      .s-poster.kw-none .title { top: 30px; }
      .s-poster .title b { font: 46px 'Bebas Neue', sans-serif; color: ${CREAM}; letter-spacing: .02em; }
      .s-poster .title small { font: 700 14px 'Work Sans', sans-serif; letter-spacing: .24em; text-transform: uppercase; color: ${MUSTARD}; margin-top: -2px; }
      .s-poster .box { top: 396px; height: 142px; left: 20px; right: 20px; background: #fffaf0; border-radius: 22px; }
      .s-poster.yel .box { background: ${MUSTARD}; }
      .s-poster .txt { font-size: 21px; line-height: 1.25; font-weight: 500; }
      .s-poster .cap { font-weight: 800; font-size: .9em; letter-spacing: .03em; }
      .s-poster .lbl { font-weight: 800; color: ${CORAL}; text-transform: uppercase; font-size: .9em; letter-spacing: .04em; }
      .s-poster.yel .lbl { color: ${NAVY}; }
      .s-poster.yel .txt { font-style: italic; }
      .s-poster .hlt { background: ${CORAL}; color: #fffaf0; border-radius: 12px; padding: .2em .5em; font-weight: 700; margin: .3em 0; }
      .s-poster .sm { opacity: .75; }
      .s-poster .state { bottom: 14px; color: ${CREAM}; font: 26px 'Bebas Neue', sans-serif; letter-spacing: .22em; }
      .s-poster .state svg { height: 22px; }
      .s-poster .exp { left: 14px; bottom: 10px; width: 48px; height: 48px; background: ${CREAM}; border-radius: 50%; padding: 5px; box-sizing: border-box; }
      .s-poster .sym { color: ${CREAM}; right: 18px; bottom: 16px; }
      .iconbox.s-poster { background: ${CREAM}; border-radius: 50%; padding: 7px; box-sizing: border-box; }
    `,
    bg: d => {
      const [base, ray] = SKY[d.ign ? 'ign' : 'pas'];
      return `<svg viewBox="0 0 400 601">
        <rect width="400" height="601" fill="${NAVY}"/>
        <g clip-path="url(#poster-art)"><rect y="128" width="400" height="258" fill="${base}"/>${burst(200, 370, 28, 520, ray)}
          <circle cx="200" cy="560" r="190" fill="${d.ign ? '#d9603f' : '#25897d'}"/></g>
        <rect y="122" width="400" height="6" fill="${MUSTARD}"/><rect y="386" width="400" height="6" fill="${MUSTARD}"/>
      </svg>`;
    },
    bomb: d => `<svg viewBox="0 0 132 132">
      <path d="M100 18C106 10 113 8 121 9" stroke="${CREAM}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <rect x="84" y="20" width="22" height="16" rx="3" transform="rotate(45 95 28)" fill="${MUSTARD}"/>
      <circle cx="58" cy="72" r="52" fill="#141c26"/>
      <circle cx="58" cy="72" r="52" fill="none" stroke="${CREAM}" stroke-width="4"/>
      <path d="M24 60A36 36 0 0 1 44 34" stroke="${CREAM}" stroke-opacity=".35" stroke-width="6" fill="none" stroke-linecap="round"/>
      ${d.ign ? Art.star(121, 9, 8, 15, 6, '').replace('class=""', `fill="#f9d548"`) + `<circle cx="121" cy="9" r="5" fill="${CORAL}"/>` : ''}
    </svg>`,
    state: d => d.ign ? `<span>Ignited</span>${Art.glyph.boom}` : `<span>Passive</span>${Art.glyph.flip}`,
  });
})(globalThis.AIBArt);

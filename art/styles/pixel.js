/* Pixel art: the shared illustrations are drawn on a coarse grid, snapped to a 16-colour palette
   and outlined, then shown with chunky pixel type and stepped frames. */
(function (Art) {
  'use strict';
  const P = {
    black: '#000000', navy: '#1d2b53', plum: '#7e2553', green: '#008751', brown: '#ab5236', gray: '#5f574f',
    light: '#c2c3c7', white: '#fff1e8', red: '#ff004d', orange: '#ffa300', yellow: '#ffec27', lime: '#00e436',
    sky: '#29adff', lav: '#83769c', pink: '#ff77a8', peach: '#ffccaa',
  };
  const PAL = Object.values(P).map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  // One step darker, for shading (drawn as a checkerboard).
  const DARK = {
    white: 'light', light: 'lav', peach: 'pink', pink: 'plum', red: 'plum', orange: 'brown', yellow: 'orange',
    lime: 'green', green: 'navy', sky: 'navy', lav: 'navy', plum: 'navy', brown: 'plum', gray: 'black', navy: 'black', black: 'black',
  };
  const KEYS = Object.keys(P);
  const rgbKey = rgb => KEYS[PAL.findIndex(c => c[0] === rgb[0] && c[1] === rgb[1] && c[2] === rgb[2])];

  const PAINT = `
    .k{fill:${P.black}} .w{fill:${P.white}} .sk{fill:${P.peach}} .hr{fill:${P.red}} .c1{fill:${P.lav}} .c2{fill:${P.pink}}
    .c3{fill:${P.yellow}} .eg{fill:${P.white}} .gr{fill:${P.green}} .bl{fill:${P.sky}} .wg{fill:${P.light}}
    .fx{fill:${P.yellow}} .fx2{fill:${P.orange}} .sh,.hl{display:none} .tip{fill:${P.black}}
    .ck{fill:${P.pink}} .pk{fill:${P.pink}} .hy{fill:${P.yellow}} .hb{fill:${P.brown}} .gy{fill:${P.light}} .dg{fill:${P.gray}}
    .rd{fill:${P.red}} .or{fill:${P.orange}} .yl{fill:${P.yellow}} .lg{fill:${P.lime}} .lb{fill:${P.white}} .nv{fill:${P.navy}}
    .tl{fill:${P.green}} .br{fill:${P.brown}} .tn{fill:${P.peach}} .bd{fill:${P.brown}} .fm{fill:${P.lime}}
    .ln,.lnb,.fuse{fill:none;stroke:${P.black};stroke-width:2.4;stroke-linecap:square}
    .lnb{stroke-width:2.6} .fuse{stroke:${P.brown};stroke-width:3}`;
  const ONLY_SHADOW = `*{fill:none;stroke:none} .sh{fill:#000}`;

  const SCALE = 4;             // card pixels per art pixel
  const nearest = (r, g, b) => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < PAL.length; i++) {
      const c = PAL[i], d = 2 * (r - c[0]) ** 2 + 4 * (g - c[1]) ** 2 + 3 * (b - c[2]) ** 2;
      if (d < bd) { bd = d; best = i; }
    }
    return PAL[best];
  };

  function raster(markup, vb, w, h, css) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" shape-rendering="crispEdges"><style>${css}</style><g class="sc">${markup}</g></svg>`;
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return img.decode().then(() => {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0, w, h);
      return x.getImageData(0, 0, w, h);
    });
  }

  // Snap to the palette and outline the silhouette; returns rows of [r,g,b] or null.
  function sprite(data, w, h, outline = PAL[0]) {
    const px = [];
    for (let i = 0; i < w * h; i++) {
      const d = data.data;
      px.push(d[i * 4 + 3] >= 128 ? nearest(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) : null);
    }
    const out = px.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (px[y * w + x]) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const X = x + dx, Y = y + dy;
        return X >= 0 && Y >= 0 && X < w && Y < h && px[Y * w + X];
      });
      if (n) out[y * w + x] = outline;
    }
    return out;
  }

  // Ordered dithering between palette colours for the sky gradient.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function sky(w, h, ign) {
    const stops = ign ? [[255, 163, 0], [255, 0, 77]] : [[41, 173, 255], [131, 118, 156]];
    const px = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const t = Math.min(1, Math.max(0, (y / h - .15) * 1.25)), b = (BAYER[(y % 4) * 4 + x % 4] / 16 - .5) * 90;
      const c = stops[0].map((v, i) => v + (stops[1][i] - v) * t + b);
      px.push(nearest(...c));
    }
    // A few clouds on the passive side, embers on the ignited one.
    const blobs = ign ? [[12, 50, 2], [88, 14, 2], [80, 56, 1], [20, 10, 1]] : [[14, 12, 4], [22, 11, 5], [30, 13, 3], [80, 22, 4], [87, 21, 5]];
    for (const [cx, cy, r] of blobs) for (let y = -r; y <= r; y++) for (let x = -r * 2; x <= r * 2; x++) {
      if ((x / 2) ** 2 + y * y <= r * r && cx + x >= 0 && cx + x < w && cy + y >= 0 && cy + y < h) px[(cy + y) * w + cx + x] = PAL[KEYS.indexOf(ign ? 'yellow' : 'white')];
    }
    return px;
  }

  function paint(canvas, px, w, h) {
    canvas.width = w; canvas.height = h;
    const x = canvas.getContext('2d');
    const im = x.createImageData(w, h);
    px.forEach((c, i) => { if (c) { im.data.set(c, i * 4); im.data[i * 4 + 3] = 255; } });
    x.putImageData(im, 0, 0);
  }

  // Each top-level group is drawn and outlined on its own, so overlapping parts stay readable.
  function layers(markup) {
    const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, 'image/svg+xml');
    return [...doc.documentElement.children].map(e => e.outerHTML);
  }
  async function drawArt(canvas, scene, ign) {
    const w = 400 / SCALE, h = 260 / SCALE, vb = '0 0 200 130';
    const px = sky(w, h, ign);
    for (const m of layers(scene)) {
      const [base, shadow] = await Promise.all([raster(m, vb, w, h, PAINT), raster(m, vb, w, h, ONLY_SHADOW)]);
      const fg = sprite(base, w, h);
      for (let i = 0; i < px.length; i++) {
        if (fg[i]) px[i] = fg[i];
        if (shadow.data[i * 4 + 3] >= 128 && (i % w + Math.floor(i / w)) % 2 === 0) px[i] = PAL[KEYS.indexOf(DARK[rgbKey(px[i])])];
      }
    }
    paint(canvas, px, w, h);
  }

  async function drawIcon(canvas, key, n = 20) {
    const data = await raster(Art.icons[key], '0 0 40 40', n, n, PAINT);
    paint(canvas, sprite(data, n, n), n, n);
  }

  // Hand-placed sprites: the bomb, the campaign marks and the state glyphs.
  function bombSprite(ign) {
    const n = 24, px = [];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const d = Math.hypot(x + .5 - 10.5, y + .5 - 13.5), a = Math.atan2(y + .5 - 13.5, x + .5 - 10.5) * 180 / Math.PI;
      let c = null;
      if (d <= 8.7) c = d > 5 && d < 7.2 && a > -170 && a < -110 ? 'gray' : 'black';
      else if (d <= 9.9) c = 'white';
      px.push(c);
    }
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < n && y < n) px[y * n + x] = c; };
    [[16, 4], [17, 4], [16, 5], [17, 5], [15, 5], [16, 6], [15, 6], [17, 3]].forEach(([x, y]) => put(x, y, 'gray'));
    [[18, 2], [19, 2], [20, 1]].forEach(([x, y]) => put(x, y, 'brown'));
    if (ign) {
      put(21, 1, 'white');
      [[20, 0], [22, 0], [20, 2], [22, 2]].forEach(([x, y]) => put(x, y, 'orange'));
      [[21, 0], [23, 1], [21, 2], [19, 1]].forEach(([x, y]) => put(x, y, 'yellow'));
      put(21, 3, 'yellow'); put(19, 0, 'orange');
    }
    return rects(px, n, n);
  }
  function rects(px, w, h, color) {
    let s = '';
    px.forEach((c, i) => { if (c) s += `<rect x="${i % w}" y="${Math.floor(i / w)}" width="1.02" height="1.02" fill="${color || P[c]}"/>`; });
    return `<svg viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${s}</svg>`;
  }
  const grid = (rows, color) => rects(rows.join('').split('').map(ch => ch === '#' ? 'x' : null), rows[0].length, rows.length, color);
  const STAR = ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'];
  const RING = ['..###..', '.#...#.', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'];
  const FLIP = ['..####.#.', '.#....##.', '#....###.', '#........', '#.......#', '#.......#', '.#.....#.', '..#####..', '.........'];
  const BOOM = ['.....#...#.....#', '......#.#.....#.', '.......#.....#..', '###########.#...', '.......#.....#..', '......#.#.....#.', '.....#...#.....#', '................'];

  const step = n => `polygon(0 ${n}px,${n}px ${n}px,${n}px 0,calc(100% - ${n}px) 0,calc(100% - ${n}px) ${n}px,100% ${n}px,100% calc(100% - ${n}px),calc(100% - ${n}px) calc(100% - ${n}px),calc(100% - ${n}px) 100%,${n}px 100%,${n}px calc(100% - ${n}px),0 calc(100% - ${n}px))`;
  const KW = { royal: P.pink, urgent: P.yellow, absolute: P.white };

  Art.style({
    id: 'pixel',
    name: 'Pixel art',
    lossless: true,
    blurb: '16-colour palette, chunky pixels, retro game type.',
    fonts: ['20px "Press Start 2P"', '400 20px "Pixelify Sans"', '600 20px "Pixelify Sans"', '700 20px "Pixelify Sans"'],
    css: `
      .s-pixel { background: ${P.navy}; color: ${P.navy}; font-family: 'Pixelify Sans', monospace; }
      .s-pixel canvas, .iconbox.s-pixel canvas { image-rendering: pixelated; }
      .s-pixel .art { top: 124px; height: 260px; }
      .s-pixel .bomb b { color: ${P.white}; font: 34px 'Press Start 2P', monospace; left: 7px; top: 24px; text-shadow: 3px 3px 0 ${P.black}; }
      .s-pixel .kw { left: 170px; top: 12px; width: 212px; height: 36px; clip-path: ${step(4)}; }
      .s-pixel.kw-royal .kw { background: ${KW.royal}; } .s-pixel.kw-urgent .kw { background: ${KW.urgent}; } .s-pixel.kw-absolute .kw { background: ${KW.absolute}; }
      .s-pixel .kw span { font: 14px 'Press Start 2P', monospace; letter-spacing: .12em; text-transform: uppercase; color: ${P.black}; margin-top: 3px; }
      .s-pixel .title { top: 62px; left: 140px; right: 12px; }
      .s-pixel.kw-none .title { top: 40px; }
      .s-pixel .title b { font: 19px/1.25 'Press Start 2P', monospace; color: ${P.white}; text-shadow: 3px 3px 0 ${P.black}; }
      .s-pixel .title small { font: 600 18px 'Pixelify Sans', monospace; letter-spacing: .18em; text-transform: uppercase; color: ${P.light}; margin-top: 8px; }
      .s-pixel .box { top: 396px; height: 142px; left: 18px; right: 18px; background: ${P.black}; clip-path: ${step(6)}; padding: 14px 24px; }
      .s-pixel .box::before { content: ''; position: absolute; inset: 5px; background: ${P.white}; clip-path: ${step(5)}; }
      .s-pixel.yel .box::before { background: ${P.yellow}; }
      .s-pixel .txt { font-size: 22px; line-height: 1.12; font-weight: 400; color: ${P.navy}; }
      .s-pixel .cap { font-weight: 700; }
      .s-pixel .lbl { font-weight: 700; color: ${P.red}; text-transform: uppercase; }
      .s-pixel.yel .lbl { color: ${P.plum}; }
      .s-pixel .hlt { background: ${P.red}; color: ${P.white}; padding: .15em .3em; margin: .25em 0; font-weight: 600; clip-path: ${step(4)}; }
      .s-pixel .sm { color: ${P.gray}; }
      .s-pixel .state { bottom: 12px; padding: 9px 14px 7px; background: ${P.black}; color: ${P.white}; font: 13px 'Press Start 2P', monospace; letter-spacing: .08em; clip-path: ${step(4)}; gap: 12px; }
      .s-pixel.ign .state { color: ${P.orange}; }
      .s-pixel .state svg { height: 18px; }
      .s-pixel .exp { left: 12px; bottom: 10px; width: 52px; height: 52px; background: ${P.light}; clip-path: ${step(4)}; padding: 4px; box-sizing: border-box; }
      .s-pixel .sym { right: 16px; bottom: 16px; width: 21px; height: 21px; }
      .s-pixel .sym svg { width: 100%; height: 100%; display: block; }
      .iconbox.s-pixel { background: ${P.light}; clip-path: ${step(5)}; padding: 4px; box-sizing: border-box; }
    `,
    bg: () => `<svg viewBox="0 0 400 601" shape-rendering="crispEdges">
      <rect width="400" height="601" fill="${P.navy}"/>
      <rect y="116" width="400" height="8" fill="${P.black}"/><rect y="384" width="400" height="8" fill="${P.black}"/>
      <rect y="112" width="400" height="4" fill="${P.lav}"/><rect y="392" width="400" height="4" fill="${P.lav}"/>
    </svg>`,
    art: () => '<canvas class="px"></canvas>',
    icon: () => '<canvas class="px"></canvas>',
    bomb: d => bombSprite(d.ign),
    sym: s => grid(s === 'star' ? STAR : RING, P.white),
    state: d => d.ign ? `<span>IGNITED</span>${grid(BOOM, P.orange)}` : `<span>PASSIVE</span>${grid(FLIP, P.white)}`,
    async post(e, d) {
      const jobs = [];
      if (d.scene) jobs.push(drawArt(e.querySelector('.art canvas'), Art.scenes[d.scene], d.ign));
      else jobs.push(drawArt(e.querySelector('.art canvas'), '', d.ign));
      if (d.exp && Art.icons[d.exp]) jobs.push(drawIcon(e.querySelector('.exp canvas'), d.exp));
      await Promise.all(jobs);
    },
    postIcon: (w, key) => drawIcon(w.querySelector('canvas'), key),
  });
})(globalThis.AIBArt);

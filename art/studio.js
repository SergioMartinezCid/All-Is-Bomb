/* Card studio: lays out any card of the game, from the data in docs/js/cards.js, in one of the art
 * styles in art/styles/. Pages:
 *   studio.html                         style samples, side by side
 *   studio.html?view=deck&style=paper     every card in one style
 *   studio.html?view=card&style=paper&id=princess&side=p
 * tools/render_cards.py drives the same functions to save the cards as image files.
 */
(function (Art) {
  'use strict';
  const { TYPES, INST, INST_LIST, EXPANSIONS } = globalThis.AIB;

  Art.styles = Art.styles || {};
  Art.style = s => { Art.styles[s.id] = s; };

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Game terms written in capitals (DECK, DESIRED DISH…) get their own look in each style.
  const caps = s => esc(s).replace(/\b[A-Z][A-Z'’]+(?:\s+[A-Z][A-Z'’]+)*\b/g, m => `<span class="cap">${m}</span>`);
  const upFirst = s => s.charAt(0).toUpperCase() + s.slice(1);

  Art.glyph = {
    flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12a7 7 0 1 1-2.05-4.95"/><path d="M17.6 3.2v4.4h-4.4"/></svg>',
    boom: '<svg viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h14M12 7l5 5-5 5"/><path d="M25 5l12 14M37 5 25 19"/></svg>',
  };

  // The card's rules text as HTML paragraphs.
  function text(t, s) {
    const raw = t.txt[s];
    const pro = raw.match(/^PROPHECY: (.*?)\.\s*(.*)$/);
    if (pro) {
      return '<p><b class="lbl">Action:</b> trigger the <span class="cap">PROPHECY</span>.</p>'
        + `<p class="hlt">${caps(upFirst(pro[1]))}</p>`
        + (pro[2] ? `<p>${caps(pro[2])}</p>` : '')
        + '<p class="sm">Only if it is the first prophecy. Then set this card aside.</p>';
    }
    if (t.yellow[s]) {
      const lead = raw.match(/^(When played:|ABSOLUTE:)\s*(.*)$/);
      return lead ? `<p><b class="lbl">${caps(lead[1])}</b> ${caps(lead[2])}</p>` : `<p>${caps(raw)}</p>`;
    }
    return `<p><b class="lbl">Action:</b> ${caps(raw)}</p>`;
  }

  // Everything a style needs to draw one side of one card.
  function data(id, side) {
    const inst = INST[id], t = TYPES[inst.type], s = side === 'i' ? 1 : 0;
    return {
      id, type: inst.type, side, ign: !!s, t,
      num: String(t.num[s]), kw: t.kw[s], name: t.name,
      cls: t.cls.map(c => c[0] + c.slice(1).toLowerCase()).join(' · '),
      yellow: t.yellow[s], html: text(t, s),
      exp: t.exp === 'base' ? null : t.exp, sym: inst.sym,
      scene: Art.scenes[inst.type] != null ? inst.type : null,
    };
  }
  Art.data = data;

  const VB = '0 0 200 130';
  function sceneSvg(st, name, vb = VB) {
    const src = name == null ? '' : vb === VB ? Art.scenes[name] : Art.icons[name];
    const body = src ? (st.wrap ? st.wrap(src) : `<g class="sc">${src}</g>`) : '';
    return `<svg class="scene" viewBox="${vb}">${body}</svg>`;
  }
  const IVB = '0 0 40 40';
  const iconSvg = (st, key) => st.icon ? st.icon(key) : sceneSvg(st, key, IVB).replace('class="scene"', 'class="icon"');
  Art.sceneSvg = sceneSvg;

  function card(styleId, id, side) {
    const st = Art.styles[styleId], d = data(id, side);
    const e = document.createElement('div');
    e.className = `card s-${styleId} ${d.ign ? 'ign' : 'pas'} kw-${d.kw || 'none'}${d.yellow ? ' yel' : ''}`;
    e.dataset.id = id;
    e.dataset.side = side;
    e.innerHTML = [
      `<div class="layer bg">${st.bg ? st.bg(d) : ''}</div>`,
      `<div class="art">${st.art ? st.art(d) : sceneSvg(st, d.scene)}</div>`,
      st.deco ? `<div class="layer deco">${st.deco(d)}</div>` : '',
      `<div class="bomb">${st.bomb(d)}<b>${esc(d.num)}</b></div>`,
      d.kw ? `<div class="kw">${st.kw ? st.kw(d) : ''}<span>${d.kw}</span></div>` : '',
      `<div class="title"><b>${esc(d.name)}</b>${d.cls ? `<small>${esc(d.cls)}</small>` : ''}</div>`,
      `<div class="box">${st.box ? st.box(d) : ''}<div class="txt">${d.html}</div></div>`,
      `<div class="state">${st.state(d)}</div>`,
      d.exp ? `<div class="exp">${iconSvg(st, d.exp)}</div>` : '',
      d.sym ? `<div class="sym">${st.sym ? st.sym(d.sym) : d.sym === 'star' ? '★' : '○'}</div>` : '',
    ].join('');
    return e;
  }

  // Shrink the name until it fits on one line, and the rules text until it fits its box.
  function fit(e) {
    const title = e.querySelector('.title'), name = title.querySelector('b');
    let ns = parseFloat(getComputedStyle(name).fontSize);
    while (ns > 10 && name.scrollWidth > title.clientWidth) { ns -= .5; name.style.fontSize = `${ns}px`; }
    const box = e.querySelector('.box'), txt = e.querySelector('.txt');
    const cs = getComputedStyle(box);
    const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    let fs = parseFloat(getComputedStyle(txt).fontSize);
    while (fs > 10 && txt.offsetHeight > room) { fs -= .5; txt.style.fontSize = `${fs}px`; }
  }

  let fontsReady = null;
  function loadFonts() {
    if (!fontsReady) {
      const specs = Object.values(Art.styles).flatMap(s => s.fonts || []);
      fontsReady = Promise.all(specs.map(f => document.fonts.load(f).catch(() => null))).then(() => document.fonts.ready);
    }
    return fontsReady;
  }

  Art.mount = async (parent, styleId, id, side) => {
    await loadFonts();
    const e = card(styleId, id, side);
    parent.append(e);
    fit(e);
    const st = Art.styles[styleId];
    if (st.post) await st.post(e, data(id, side));
    return e;
  };
  Art.mountIcon = async (parent, styleId, key) => {
    const st = Art.styles[styleId];
    const w = document.createElement('div');
    w.className = `iconbox s-${styleId}`;
    w.innerHTML = iconSvg(st, key);
    parent.append(w);
    if (st.postIcon) await st.postIcon(w, key);
    return w;
  };

  // Style CSS and shared SVG definitions (filters, patterns) go in once per page.
  function install() {
    const css = document.createElement('style');
    css.textContent = Object.values(Art.styles).map(s => s.css || '').join('\n');
    document.head.append(css);
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    defs.setAttribute('class', 'defs');
    defs.setAttribute('aria-hidden', 'true');
    defs.innerHTML = `<defs>${Object.values(Art.styles).map(s => s.defs || '').join('')}</defs>`;
    document.body.prepend(defs);
  }

  // ---------- pages ----------
  const SAMPLE = [['princess', 'p'], ['eggsProphet', 'i'], ['squeek', 'i'], ['all', 'p']];
  const SAMPLE_ICONS = ['mosquitos', 'all', 'gifts'];
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  async function samples(out) {
    out.className = 'samples';
    let n = 0;
    for (const st of Object.values(Art.styles)) {
      const row = h('section', 'style-row');
      row.id = st.id;
      row.append(h('h2', null, `${++n}. ${st.name}`), h('p', null, st.blurb || ''));
      const cards = h('div', 'cards');
      row.append(cards);
      out.append(row);
      for (const [id, side] of SAMPLE) {
        const cell = h('div', 'cell');
        cards.append(cell);
        await Art.mount(cell, st.id, id, side);
      }
      const side = h('div', 'extras');
      const ic = h('div', 'icons');
      for (const k of SAMPLE_ICONS) await Art.mountIcon(ic, st.id, k);
      const minis = h('div', 'minis');
      for (const [id, s] of SAMPLE) {
        const m = h('div', 'mini');
        minis.append(m);
        await Art.mount(m, st.id, id, s);
      }
      side.append(h('small', null, 'Icons'), ic, h('small', null, 'In the deck row'), minis);
      cards.append(side);
    }
  }

  async function deck(out, styleId) {
    out.className = 'deck';
    for (const i of INST_LIST) {
      if (/\d$/.test(i.id) && !i.id.endsWith('1')) continue; // duplicates look the same
      for (const side of ['p', 'i']) {
        const cell = h('div', 'cell');
        out.append(cell);
        await Art.mount(cell, styleId, i.id, side);
      }
    }
  }

  async function boot() {
    install();
    const q = new URLSearchParams(location.search);
    const out = document.getElementById('out');
    const view = q.get('view') || 'samples';
    if (view === 'samples') await samples(out);
    else if (view === 'deck') await deck(out, q.get('style'));
    else if (view === 'card') { out.className = 'single'; await Art.mount(out, q.get('style'), q.get('id'), q.get('side') || 'p'); }
    document.documentElement.dataset.ready = '1';
  }
  Art.EXPANSIONS = EXPANSIONS;
  document.addEventListener('DOMContentLoaded', boot);
})(globalThis.AIBArt = globalThis.AIBArt || {});

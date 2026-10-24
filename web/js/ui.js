/* DOM rendering and input for ALL IS BOMB. */
(function (AIB) {
  'use strict';
  const { Game, makeConfig, TYPES, INST, INST_LIST, EXPANSIONS, CAMPAIGN } = AIB;

  const $ = q => document.querySelector(q);
  const h = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  // Card art, made with the card studio in art/ (tools/render_cards.py).
  const cardFile = name => `img/cards/${name}.webp`;
  const src = (id, ign) => cardFile(`${id}_${ign ? 'i' : 'p'}`);
  const iconSrc = k => `img/icons/${k}.webp`;

  const KEYS = { save: 'aib.save.1', setup: 'aib.setup.1', camp: 'aib.campaign.1', sound: 'aib.sound.1' };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } },
  };

  const SVG = {
    undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5"/></svg>',
    log: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6M12 17h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    flip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9a8 8 0 0 1 14-3l2 2M20 4v4h-4M20 15a8 8 0 0 1-14 3l-2-2M4 20v-4h4"/></svg>',
    bubble: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c5 0 9 3.1 9 7s-4 7-9 7c-.9 0-1.8-.1-2.6-.3L4 19l1.4-3.6C3.9 14.1 3 12.6 3 10c0-3.9 4-7 9-7z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.5 3.5 5 5.5 5 11a5 5 0 0 1-10 0c0-2.6 1.4-4.3 2.6-5.4.1 1.7.9 2.9 2 3.3C11 8.2 11 5 12 2z"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z"/></svg>',
    throne: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10v10h2v10h-2v-4H7v4H5V12h2z"/></svg>',
    bin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  };

  const DISH = { croissant: 'Croissant', eggs: 'Eggs', pancakes: 'Pancakes', juice: 'Juice', allBreakfast: 'All' };
  const FAIL = {
    prophecy: 'no prophecy was made',
    dish: 'the dish wasn\'t ignited',
    dishGone: 'the dish wasn\'t discarded',
    princess: 'the Princess didn\'t eat it herself',
    mosquitos: 'a Mosquito is still buzzing',
    dreamGuide: 'the Dream Guide was never played',
    gifts: 'fewer than 3 gifts were opened',
    juice: 'the dish wasn\'t The Juice',
    all: 'ALL wasn\'t equipped',
  };
  const LOSS = {
    draw: o => `Tried to draw ${o.n} from a deck of ${o.have}.`,
    stuck: () => 'No equipped card could be played.',
    all: () => 'ALL ran out of turns.',
    conds: o => `The game ended, but ${o.failed.map(k => FAIL[k]).join(', ')}.`,
  };
  // Win conditions: icon, name and what each one asks for.
  const COND = {
    prophecy: { icon: SVG.bubble, name: 'Prophecy', goal: 'Play an ignited Prophet' },
    dish: { icon: SVG.flame, name: 'Dish', goal: 'Ignite the desired dish' },
    dishGone: { icon: SVG.bin, name: 'Dish', goal: 'Discard the desired dish' },
    princess: { icon: SVG.crown, name: 'Princess', goal: 'Play her ignited and equip the ignited dish' },
    throne: { icon: SVG.throne, name: 'Throne', goal: 'Ignite it for the Princess to equip' },
    mosquitos: { icon: 'mosquitos', name: 'Mosquitos', goal: 'Discard both Mosquitos' },
    dreamGuide: { icon: 'dreamGuide', name: 'Dream Guide', goal: 'Play the Dream Guide once' },
    gifts: { icon: 'gifts', name: 'Gifts', goal: 'Play 3 Gifts' },
    juice: { icon: 'juice', name: 'The Juice', goal: 'The Juice must be the desired dish' },
    all: { icon: 'all', name: 'ALL', goal: 'Have ALL equipped when the game ends' },
  };
  const PHASES = ['Play', 'Draw', 'Action', 'Ignite', 'Clean-up'];
  const ITCH = 'https://letibus.itch.io/aib';
  const sfx = name => AIB.sound.play(name);

  let game = null;
  let pending = null;     // { req, res } — the engine is waiting for the player
  let seq = [];           // ids picked so far for a 'seq' request
  let hoverId = null;     // card shown in the preview panel
  let planId = null;      // hovered playable card: show where its draw lands
  let drawHover = null;   // hovered deck card while choosing ALL's draw
  let animate = true;
  const nodes = new Map(); // card id -> persistent element (lets cards glide between zones)

  const io = {
    ask(req) {
      return new Promise(res => { pending = { req, res }; seq = []; render(); });
    },
    step(ms = 280) {
      render();
      return new Promise(r => setTimeout(r, ms));
    },
    cancel() {
      if (!pending) return;
      const p = pending;
      pending = null;
      p.res(null);
    },
  };
  function answer(v) {
    const p = pending;
    pending = null;
    seq = [];
    p.res(v);
  }

  // ---------- card elements ----------
  function cardNode(c, size) {
    let e = nodes.get(c.id);
    if (!e) {
      e = h('div');
      e.dataset.id = c.id;
      const img = h('img');
      img.draggable = false;
      e.append(img, h('span', 'nm'));
      nodes.set(c.id, e);
    }
    const t = TYPES[INST[c.id].type];
    const img = e.firstChild;
    const s = src(c.id, c.ign);
    if (img.getAttribute('src') !== s) {
      img.src = s;
      img.alt = `${t.name}${c.ign ? ' (ignited)' : ''}: ${t.txt[c.ign ? 1 : 0]}`;
    }
    e.children[1].textContent = t.name;
    e.className = `card ${size}`;
    e.dataset.ign = c.ign ? '1' : '0';
    e.querySelectorAll('.ord, .tick').forEach(x => x.remove());
    return e;
  }

  function measure() {
    const m = new Map();
    document.querySelectorAll('#table .card[data-id]').forEach(e => {
      if (e.isConnected) m.set(e.dataset.id, { r: e.getBoundingClientRect(), ign: e.dataset.ign, gone: !!e.closest('#discard') });
    });
    return m;
  }
  function glide(prev) {
    document.querySelectorAll('#table .card[data-id]').forEach(e => {
      const p = prev.get(e.dataset.id);
      e.getAnimations().forEach(a => a.cancel());
      const r = e.getBoundingClientRect();
      if (!p) {
        e.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
        return;
      }
      const dx = p.r.left - r.left, dy = p.r.top - r.top, sx = p.r.width / r.width, sy = p.r.height / r.height;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || Math.abs(sx - 1) > .02) {
        e.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` }, { transform: 'none' }],
          { duration: 380, easing: 'cubic-bezier(.2, .75, .25, 1)' });
      }
      if (p.ign !== e.dataset.ign) {
        e.firstChild.animate([{ transform: 'scaleX(0)', filter: 'brightness(2.2)' }, { transform: 'none', filter: 'none' }],
          { duration: 320, easing: 'ease-out' });
      }
    });
  }

  // ---------- render ----------
  function render() {
    if (!game) return;
    const prev = animate ? measure() : null;
    renderHeader();
    renderWin();
    renderZones();
    renderPrompt();
    renderPreview();
    renderLog();
    applyPlan();
    if (prev) {
      if (game.busy) cue(prev);
      glide(prev);
    }
    animate = true;
  }

  // One sound for what the last engine step did: a card discarded, else a card ignited.
  function cue(prev) {
    let ign = false, gone = false;
    document.querySelectorAll('#table .card[data-id]').forEach(e => {
      const p = prev.get(e.dataset.id);
      if (!p) return;
      if (p.ign === '0' && e.dataset.ign === '1') ign = true;
      if (!p.gone && e.closest('#discard')) gone = true;
    });
    if (gone) sfx('discard');
    else if (ign) sfx('ignite');
  }

  const icon = i => i.startsWith('<svg') ? i : `<img src="${iconSrc(i)}" alt="">`;
  function chip(c) {
    const e = h('span', `chip${c.ok === true ? ' ok' : ''}`);
    e.title = `${COND[c.k].name}: ${goal(c)}`;
    e.innerHTML = icon(COND[c.k].icon);
    const v = condValue(c);
    if (v instanceof Node) e.append(v); else e.append(String(v));
    return e;
  }
  const dot = v => h('span', `dot ${v}`);
  const stateWord = { pas: 'passive', ign: 'ignited', gone: 'discarded' };

  // Short progress value shown next to a condition.
  function condValue(c) {
    switch (c.k) {
      case 'prophecy': return c.v ? DISH[c.v] : '?';
      case 'dishGone': return c.v.length ? `${c.v.filter(id => game.where(game.byId(id)) === 'discard').length}/${c.v.length}` : '—';
      case 'princess': case 'throne': return dot(c.v);
      case 'mosquitos': case 'gifts': return c.v;
      case 'all': return c.ok ? (c.v != null ? `${c.v}/3` : '✓') : '—';
      default: return c.ok ? '✓' : '—';
    }
  }
  // What the condition asks for, filled in with the current game where that helps.
  function goal(c) {
    const p = game.s.prophecy;
    const dish = p === 'allBreakfast' ? 'every breakfast' : p ? DISH[p] : null;
    switch (c.k) {
      case 'prophecy': return p === 'allBreakfast' ? 'The princess wants every breakfast' : p ? `The princess wants ${DISH[p]}` : COND.prophecy.goal;
      case 'dish': return dish ? `Ignite ${dish}` : COND.dish.goal;
      case 'dishGone': return dish ? `Discard ${dish}` : COND.dishGone.goal;
      case 'princess': return game.cfg.conds.includes('wu') ? 'Play her ignited and equip the ignited Throne' : COND.princess.goal;
      case 'all': return c.v != null ? `Ignited: ${3 - c.v} turn${3 - c.v === 1 ? '' : 's'} left` : COND.all.goal;
      default: return COND[c.k].goal;
    }
  }

  function renderHeader() {
    $('#conds').replaceChildren(...game.conditions().map(chip));
    const camp = game.cfg.campaign;
    $('#turn').textContent = (camp != null ? `Game ${camp + 1}/6 · ` : '') + `Turn ${game.s.turn}`;
    $('#btn-undo').disabled = !game.hist.length && !game.busy;
  }

  function renderWin() {
    const over = game.s.over;
    $('#win').replaceChildren(...game.conditions().map(c => {
      const e = h('div', `cond${c.ok ? ' ok' : over && c.ok === false ? ' miss' : ''}`);
      e.innerHTML = icon(COND[c.k].icon);
      const st = h('span', 'cond-st');
      if (c.ok === null) st.append(dot(c.v), stateWord[c.v]); // Princess / Throne: show which side is up
      else {
        if (c.k === 'mosquitos' || c.k === 'gifts' || (c.k === 'dishGone' && c.v.length > 1)) st.append(condValue(c));
        st.append(h('i', `mark${c.ok ? ' on' : ''}`));
      }
      const hd = h('div', 'cond-hd');
      hd.append(h('b', null, COND[c.k].name), st);
      const txt = h('div', 'cond-txt');
      txt.append(hd, h('small', null, goal(c)));
      e.append(txt);
      return e;
    }));
  }

  function renderZones() {
    const s = game.s, req = pending && pending.req;
    const pick = req && (req.kind === 'pick' || req.kind === 'seq') ? new Set(req.ids) : null;
    const idle = !game.busy && !pending && !s.over;
    const legal = new Set(idle ? game.legal().map(c => c.id) : []);
    $('#table').classList.toggle('picking', !!pick);

    const dress = e => {
      const id = e.dataset.id;
      if (pick && pick.has(id)) e.classList.add('pickable');
      const k = seq.indexOf(id);
      if (k >= 0) { e.classList.add('picked'); e.append(h('span', 'ord', k + 1)); }
      if (s.newly === id && game.busy) e.classList.add('new');
      return e;
    };

    // Deck (top first), with insertion slots when placing a card.
    const deck = $('#deck');
    const slots = req && req.kind === 'slot';
    const slot = i => { const b = h('button', 'slot'); b.dataset.i = i; b.title = 'Put it here'; return b; };
    const items = [];
    s.deck.forEach((c, i) => {
      if (slots) items.push(slot(i));
      const w = h('div', 'dk');
      w.append(dress(cardNode(c, 'mini')), h('span', 'ix', i + 1));
      items.push(w);
    });
    if (slots) items.push(slot(s.deck.length));
    if (!items.length) items.push(h('span', 'empty', 'empty'));
    deck.replaceChildren(...items);
    $('#n-deck').textContent = s.deck.length;

    const fill = (sel, cards, size, empty) => {
      const box = $(sel);
      const list = cards.map(c => dress(cardNode(c, size)));
      box.replaceChildren(...(list.length ? list : empty ? [h('span', 'empty', empty)] : []));
      return list;
    };
    fill('#discard', s.discard, 'mini', 'empty');
    $('#n-discard').textContent = s.discard.length;
    fill('#aside', s.aside, 'mini', '');

    const eq = fill('#equipped', s.equipped, 'big', 'nothing equipped');
    eq.forEach(e => {
      const c = game.byId(e.dataset.id);
      if (legal.has(c.id)) { e.classList.add('playable'); e.title = 'Play'; } else { e.title = ''; if (idle) e.classList.add('locked'); }
      if (game.type(c) === 'all' && c.ign) e.append(h('span', 'tick', `${s.turn - c.eq}/3`));
    });
    $('#urgent-all').textContent = s.urgentAll === s.turn && !s.over ? 'all urgent' : '';
    fitEquipped();

    const play = [];
    if (s.play) play.push(cardNode(s.play, 'big'));
    if (s.held) { const e = cardNode(s.held, 'mini'); e.classList.add('held'); play.push(e); }
    $('#play').replaceChildren(...play);

    $('#phases').innerHTML = PHASES.map((p, i) =>
      `<li class="${s.phase === i + 1 ? 'on' : s.phase > i + 1 ? 'done' : ''}">${p}</li>`).join('');
  }

  // Overlap equipped cards just enough to keep them on one row.
  function fitEquipped() {
    const box = $('#equipped');
    const cards = box.querySelectorAll('.card');
    let ov = 0;
    if (cards.length > 1) {
      const n = cards.length, w = parseFloat(getComputedStyle(cards[0]).width), gap = 12;
      const room = box.getBoundingClientRect().width;
      if (n * w + (n - 1) * gap > room) ov = (room - n * w) / (n - 1) - gap;
    }
    box.style.setProperty('--ov', `${ov}px`);
  }

  function renderPrompt() {
    const box = $('#prompt');
    const s = game.s;
    const bar = h('div', 'bar');
    const btns = h('div', 'btns');
    const btn = (label, fn) => { const b = h('button', null, label); b.onclick = fn; btns.append(b); };

    if (pending) {
      const r = pending.req;
      bar.append(h('span', null, r.prompt));
      if (r.kind === 'seq') {
        if (seq.length) btn('Reset', () => { seq = []; render(); });
        if (!r.all && seq.length) btn('Done', () => answer(seq.slice()));
        if (r.skip && !seq.length) btn(r.skip, () => answer(r.optional ? null : r.ids.slice()));
      } else if (r.kind === 'pick' && r.optional) {
        btn(r.skip || 'Skip', () => answer(null));
      }
    } else if (s.over) {
      bar.classList.add(s.over.win ? 'win' : 'lose');
      bar.append(h('span', null, s.over.win ? 'Breakfast is served.' : 'Boom.'));
      btn('Result', showResult);
    } else if (game.busy) {
      box.replaceChildren();
      return;
    } else {
      bar.classList.add('idle');
      bar.append(h('span', null, 'Play an equipped card'));
    }
    if (btns.children.length) bar.append(btns);
    box.replaceChildren(bar);
  }

  function renderPreview() {
    const box = $('#preview');
    const c = (hoverId && game.byId(hoverId)) || game.s.play || game.s.held;
    if (!c) { box.replaceChildren(h('div', 'pv-empty', 'hover a card')); return; }
    const t = TYPES[INST[c.id].type];
    const main = h('div', 'pv-main');
    const img = h('img');
    img.src = src(c.id, c.ign);
    img.alt = `${t.name}: ${t.txt[c.ign ? 1 : 0]}`;
    main.append(img);
    const alt = h('div', 'pv-alt');
    const altImg = h('img');
    altImg.src = src(c.id, !c.ign);
    altImg.alt = `Other side: ${t.txt[c.ign ? 0 : 1]}`;
    const wrap = h('div');
    wrap.append(altImg);
    const lab = h('span');
    lab.innerHTML = SVG.flip;
    lab.title = 'Other side';
    alt.append(lab, wrap);
    box.replaceChildren(main, alt);
  }

  function renderLog() {
    const box = $('#log');
    if ($('#log-box').hidden) return;
    let last = null;
    if (!game.s.log.length) { box.replaceChildren(h('i', null, 'No moves yet')); return; }
    box.replaceChildren(...game.s.log.slice(-80).map(line => {
      const [turn, msg] = line.split(/\|(.*)/s);
      const d = h('div', turn !== last ? 't' : '');
      d.append(h('i', null, turn !== last ? turn : ''), h('span', null, msg));
      last = turn;
      return d;
    }));
    box.scrollTop = box.scrollHeight;
  }

  // Hovering a playable card highlights the deck card its draw would equip.
  function applyPlan() {
    if (!game) return;
    const deckEls = [...document.querySelectorAll('#deck .card')];
    document.querySelectorAll('#table .target, #table .tobottom').forEach(e => e.classList.remove('target', 'tobottom'));
    $('#z-deck').classList.remove('boom');
    let n = 0, target = null;
    if (planId && !pending && !game.busy) {
      const c = game.byId(planId);
      if (!c || game.where(c) !== 'equipped') return;
      const p = game.drawPreview(c);
      if (p.boom) $('#z-deck').classList.add('boom');
      else if (p.n) n = p.n;
      else if (p.special) target = p.special;
    } else if (pending && pending.req.hint === 'draw' && drawHover) {
      n = game.s.deck.findIndex(c => c.id === drawHover) + 1;
    }
    deckEls.forEach((e, i) => {
      if (i < n - 1) e.classList.add('tobottom');
      if (i === n - 1) e.classList.add('target');
    });
    if (target && nodes.get(target)) nodes.get(target).classList.add('target');
  }

  // ---------- input ----------
  async function doPlay(id) {
    if (game.busy) return;
    planId = null;
    sfx('play');
    await game.play(id);
    pending = null;
    render();
    save();
    if (game.s.over) {
      sfx(game.s.over.win ? 'win' : 'lose');
      setTimeout(showResult, 500);
    }
  }

  function onTableClick(e) {
    if (!game) return;
    const slot = e.target.closest('.slot');
    if (slot && pending && pending.req.kind === 'slot') { sfx('pick'); return answer(+slot.dataset.i); }
    const ce = e.target.closest('.card');
    if (!ce) return;
    const id = ce.dataset.id;
    hoverId = id;
    if (pending) {
      const r = pending.req;
      if (!r.ids || !r.ids.includes(id)) return compact() ? showZoom(id) : renderPreview();
      sfx('pick');
      if (r.kind === 'pick') return answer(id);
      if (r.kind === 'seq') {
        const k = seq.indexOf(id);
        if (k >= 0) seq.splice(k, 1); else seq.push(id);
        if (r.all && seq.length === r.ids.length - 1) seq.push(r.ids.find(x => !seq.includes(x)));
        if (r.all && seq.length === r.ids.length) return answer(seq.slice());
        return render();
      }
      return;
    }
    if (compact()) showZoom(id, ce.classList.contains('playable'));
    else if (ce.classList.contains('playable')) doPlay(id);
    else renderPreview();
  }
  // Without the hover preview panel (small screens), a tap opens the card instead.
  const compact = () => matchMedia('(max-width: 1100px)').matches;

  function onTableHover(e) {
    if (!game) return;
    const ce = e.target.closest('.card');
    const id = ce ? ce.dataset.id : null;
    if (id && id !== hoverId) { hoverId = id; renderPreview(); }
    const p = ce && ce.classList.contains('playable') ? id : null;
    const d = ce && pending && pending.req.hint === 'draw' && ce.closest('#deck') ? id : null;
    if (p !== planId || d !== drawHover) { planId = p; drawHover = d; applyPlan(); }
  }

  function undo() {
    if (!game) return;
    if (game.busy) { sfx('undo'); game.undo(); return; } // the running turn unwinds itself
    if (game.undo()) { sfx('undo'); closeOverlay(); render(); save(); }
  }

  // ---------- game lifecycle ----------
  function abandon() {
    if (game && game.busy) { game.aborted = true; io.cancel(); }
    pending = null;
    seq = [];
  }
  function startGame(cfg, state, hist) {
    abandon();
    game = new Game(cfg, io, state, hist);
    hoverId = planId = drawHover = null;
    animate = false;
    closeOverlay();
    render();
    save();
  }
  function save() {
    if (!game || game.busy) return;
    store.set(KEYS.save, { cfg: game.cfg, s: game.s, hist: game.hist.slice(-40) });
  }

  // ---------- overlays ----------
  let overlayBack = null; // reopens the previous overlay when this one closes
  function overlay(content, dismissable = true, back = null) {
    const o = $('#overlay');
    overlayBack = back;
    o.replaceChildren(content);
    o.hidden = false;
    o.onclick = e => { if (dismissable && e.target === o) closeOverlay(); };
    o.dataset.dismissable = dismissable ? '1' : '';
  }
  function closeOverlay() {
    const back = overlayBack;
    overlayBack = null;
    $('#overlay').hidden = true;
    if (back) back();
  }
  function panel(cls = '') {
    const p = h('div', `panel ${cls}`);
    return p;
  }
  function closeBtn(p) {
    const b = h('button', 'tool close');
    b.innerHTML = SVG.close;
    b.title = 'Close';
    b.onclick = closeOverlay;
    p.append(b);
  }
  function button(label, fn, primary) {
    const b = h('button', `btn${primary ? ' primary' : ''}`, label);
    b.onclick = fn;
    return b;
  }

  function showSetup() {
    const st = Object.assign({ exps: [], blitz: false }, store.get(KEYS.setup));
    const p = panel();
    if (game) closeBtn(p);
    const fan = h('div', 'fan');
    for (const id of ['croissantProphet', 'princess', 'rascal1']) {
      const i = h('img'); i.src = src(id, id === 'croissantProphet'); i.alt = ''; fan.append(i);
    }
    const title = h('h1');
    title.innerHTML = 'All is <span>Bomb</span>';
    p.append(fan, title, h('p', 'tag', 'Serve the princess her breakfast before everything explodes.'));

    const tiles = h('div', 'tiles');
    const blitz = h('label', 'check');
    const bx = h('input'); bx.type = 'checkbox'; bx.checked = st.blitz;
    blitz.append(bx, 'Blitz · base only, 13 cards');
    const sync = () => tiles.querySelectorAll('.tile').forEach(t => {
      t.classList.toggle('on', st.exps.includes(t.dataset.exp) && !st.blitz);
      t.disabled = st.blitz;
    });
    for (const k of ['hands', ...CAMPAIGN]) {
      const ex = EXPANSIONS[k];
      const t = h('button', 'tile');
      t.dataset.exp = k;
      const n = INST_LIST.filter(i => i.exp === k).length;
      t.title = `${ex.name}: ${n} cards`;
      t.innerHTML = `<img src="${iconSrc(k)}" alt=""><span><b></b><small></small></span>`;
      t.querySelector('b').textContent = ex.name;
      t.querySelector('small').textContent = ex.goal;
      t.onclick = () => {
        st.exps = st.exps.includes(k) ? st.exps.filter(x => x !== k) : [...st.exps, k];
        sync();
      };
      tiles.append(t);
    }
    bx.onchange = () => { st.blitz = bx.checked; sync(); };
    sync();

    const opts = h('div', 'row-opts');
    opts.append(blitz);
    const btns = h('div', 'btns-row');
    btns.append(button('Play', () => {
      store.set(KEYS.setup, st);
      startGame(makeConfig({ exps: CAMPAIGN.concat('hands').filter(k => st.exps.includes(k)), blitz: st.blitz }));
    }, true));
    const camp = store.get(KEYS.camp);
    if (camp && camp.idx < 6) btns.append(button(`Continue campaign · ${camp.idx + 1}/6`, () => campaignGame(camp)));
    btns.append(button('New campaign', campaignStart), button('Rules', () => showRules(showSetup)), installButton());
    const credit = h('p', 'credit');
    credit.innerHTML = `Unofficial fan version of <a href="${ITCH}" target="_blank" rel="noopener">All Is Bomb</a> by Blaž Urban Gracar ·
      support the designer: <a href="${ITCH}" target="_blank" rel="noopener">get the game on itch.io</a> ·
      <a href="https://github.com/SergioMartinezCid/All-Is-Bomb" target="_blank" rel="noopener">source</a>`;
    p.append(tiles, opts, btns, credit);
    overlay(p, !!game);
  }

  function showRules(back) {
    const p = panel('rules');
    p.append($('#rules-tpl').content.cloneNode(true));
    p.append($('#page-tpl').content.cloneNode(true));
    p.querySelectorAll('.credits').forEach(e => p.append(e));
    p.querySelectorAll('img[data-card]').forEach(i => { i.src = cardFile(i.dataset.card); });
    p.querySelectorAll('img[data-icon]').forEach(i => { i.src = iconSrc(i.dataset.icon); });
    p.querySelectorAll('figure.anat').forEach(anatomy);
    const toc = p.querySelector('.toc');
    const links = h('div', 'toc-links');
    for (const sec of p.querySelectorAll('section')) {
      const b = h('button', null, sec.querySelector('h3').textContent.replace(/^[A-I]\.\s*/, ''));
      b.onclick = () => p.scrollTo({ top: sec.offsetTop - toc.offsetHeight - 4, behavior: 'smooth' });
      links.append(b);
    }
    toc.append(links);
    closeBtn(toc);
    overlay(p, true, typeof back === 'function' ? back : null);
    p.scrollTop = 0;
  }

  // The card diagram: letters around the card, with arrows to the parts they name.
  const ANATOMY = { A: [36, 78], B: [205, 24], C: [384, 60], D: [300, 108], E: [40, 460], F: [118, 576] };
  const BADGE = { A: t => [-44, t[1]], B: () => [120, -44], C: () => [452, 40], D: () => [452, 132], E: t => [-44, t[1]], F: t => [-44, t[1]] };
  function anatomy(fig) {
    const r = n => Math.round(n * 10) / 10;
    let paths = '', badges = '';
    for (const [k, [tx, ty]] of Object.entries(ANATOMY)) {
      const [bx, by] = BADGE[k]([tx, ty]);
      const len = Math.hypot(tx - bx, ty - by), ux = (tx - bx) / len, uy = (ty - by) / len;
      const sx = tx - 18 * ux, sy = ty - 18 * uy, px = -uy * 8, py = ux * 8;
      paths += `<path d="M${bx} ${by}L${r(sx)} ${r(sy)}M${tx} ${ty}L${r(sx + px)} ${r(sy + py)}L${r(sx - px)} ${r(sy - py)}Z"/>`;
      badges += `<b style="left:${r(bx / 4)}%;top:${r(by / 6.01)}%">${k}</b>`;
    }
    fig.insertAdjacentHTML('beforeend', `<svg class="ptr" viewBox="0 0 400 601" aria-hidden="true"><g class="u">${paths}</g><g class="o">${paths}</g></svg>${badges}`);
  }

  function showResult() {
    if (!game || !game.s.over) return;
    const o = game.s.over;
    const p = panel(`result ${o.win ? 'win' : 'lose'}`);
    closeBtn(p);
    p.append(h('h2', null, o.win ? 'Breakfast is served!' : 'Boom.'));
    p.append(h('p', null, o.win ? `The princess eats. Turn ${game.s.turn}.` : LOSS[o.reason](o)));
    const btns = h('div', 'btns-row');
    btns.append(button('Undo', undo));
    if (game.cfg.campaign != null) {
      btns.append(button(game.cfg.campaign < 5 ? 'Next game' : 'Final score', campaignAdvance, true));
    } else {
      btns.append(button('Retry deal', () => startGame(game.cfg)));
      btns.append(button('New game', showSetup, true));
    }
    p.append(btns);
    overlay(p);
  }

  function showZoom(id, playable) {
    const c = game.byId(id);
    if (!c) return;
    const wrap = h('div', 'zoom-wrap');
    const z = h('div', 'zoom');
    for (const ign of [false, true]) {
      const i = h('img', c.ign === ign ? 'cur' : '');
      i.src = src(id, ign);
      i.alt = TYPES[INST[id].type].txt[ign ? 1 : 0];
      z.append(i);
    }
    z.onclick = closeOverlay;
    wrap.append(z);
    if (playable) {
      const b = h('div', 'btns-row');
      b.append(button('Play', () => { closeOverlay(); doPlay(id); }, true));
      wrap.append(b);
    }
    overlay(wrap);
  }

  // ---------- campaign ----------
  function campaignStart() {
    const camp = { idx: 0, pool: INST_LIST.filter(i => i.exp === 'base' || i.exp === 'hands').map(i => i.id), wins: [], stars: 0 };
    store.set(KEYS.camp, camp);
    campaignGame(camp);
  }
  function campaignGame(camp) {
    const exp = CAMPAIGN[camp.idx];
    let pool = camp.pool.concat(INST_LIST.filter(i => i.exp === exp).map(i => i.id));
    if (exp === 'wakingUp') pool = pool.filter(id => id !== 'princess' && id !== 'king');
    const conds = [camp.idx >= 4 ? 'wu' : 'base'].concat(exp === 'wakingUp' ? [] : [exp]);
    if (camp.idx === 5) { camp.stars = pool.filter(id => INST[id].sym === 'star').length; store.set(KEYS.camp, camp); }
    startGame(makeConfig({ exps: ['hands', exp], pool, conds, campaign: camp.idx }));
    overlay(campaignIntro(camp));
  }
  function track(camp) {
    const t = h('div', 'camp-track');
    CAMPAIGN.forEach((k, i) => {
      const sp = h('span', i === camp.idx ? 'cur' : i < camp.wins.length ? (camp.wins[i] ? 'w' : 'l') : '');
      sp.title = EXPANSIONS[k].name;
      sp.innerHTML = `<img src="${iconSrc(k)}" alt="">`;
      t.append(sp);
    });
    return t;
  }
  function campaignIntro(camp) {
    const p = panel();
    const exp = CAMPAIGN[camp.idx];
    p.append(h('h2', null, `Game ${camp.idx + 1} · ${EXPANSIONS[exp].name}`), track(camp));
    p.append(h('p', 'tag', `${EXPANSIONS[exp].goal}. ${game.cfg.pool.length} cards.`));
    const b = h('div', 'btns-row');
    b.append(button('Begin', closeOverlay, true));
    p.append(b);
    return p;
  }
  function campaignAdvance() {
    const camp = store.get(KEYS.camp);
    if (!camp || camp.idx !== game.cfg.campaign) return showSetup();
    // Remove every ○ card, and the ★ cards that ended in the discard pile.
    camp.pool = game.cards()
      .filter(c => INST[c.id].sym !== 'circle' && !(INST[c.id].sym === 'star' && game.where(c) === 'discard'))
      .map(c => c.id);
    camp.wins.push(!!game.s.over.win);
    camp.idx++;
    store.set(KEYS.camp, camp);
    if (camp.idx < 6) return campaignGame(camp);
    store.del(KEYS.save);
    const wins = camp.wins.slice(0, 5).filter(Boolean).length;
    const allWin = camp.wins[5] ? 3 : 0;
    const total = camp.stars + wins + allWin;
    const p = panel('result win');
    p.append(h('h2', null, 'Campaign complete'), track(camp));
    const sc = h('div', 'score');
    sc.innerHTML = `<span>★ cards kept</span><b>${camp.stars}</b><span>Wins</span><b>${wins}</b><span>ALL won</span><b>${allWin}</b><span>Total</span><b>${total}</b>`;
    p.append(sc, h('div', 'medal', total >= 15 ? 'Golden win' : total >= 10 ? 'Silver win' : total >= 5 ? 'Bronze win' : 'No medal'));
    const b = h('div', 'btns-row');
    b.append(button('Home', showSetup, true));
    p.append(b);
    overlay(p, false);
  }

  function showLog(open) {
    $('#log-box').hidden = !open;
    $('#btn-log').classList.toggle('on', open);
    renderLog();
  }

  // ---------- install as an app ----------
  // Chromium browsers offer installation through this event; other browsers use their own menus.
  let installPrompt = null;
  addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    document.querySelectorAll('.install').forEach(b => { b.hidden = false; });
  });
  addEventListener('appinstalled', () => {
    installPrompt = null;
    document.querySelectorAll('.install').forEach(b => { b.hidden = true; });
  });
  function installButton() {
    const b = button('Install app', () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      installPrompt.userChoice.then(r => { if (r.outcome === 'accepted') b.hidden = true; });
      installPrompt = null;
    });
    b.classList.add('install');
    b.hidden = !installPrompt;
    return b;
  }

  // ---------- boot ----------
  function boot() {
    $('#btn-undo').innerHTML = SVG.undo;
    $('#btn-restart').innerHTML = SVG.restart;
    $('#btn-log').innerHTML = SVG.log;
    $('#btn-rules').innerHTML = SVG.help;
    $('#btn-undo').onclick = undo;
    $('#btn-restart').onclick = () => game && startGame(game.cfg);
    $('#btn-log').onclick = () => showLog($('#log-box').hidden);
    $('#btn-log-close').innerHTML = SVG.close;
    $('#btn-log-close').onclick = () => showLog(false);
    const soundBtn = () => {
      $('#btn-sound').innerHTML = AIB.sound.on ? SVG.soundOn : SVG.soundOff;
      $('#btn-sound').title = AIB.sound.on ? 'Mute' : 'Unmute';
    };
    AIB.sound.on = store.get(KEYS.sound) !== false;
    soundBtn();
    $('#btn-sound').onclick = () => {
      AIB.sound.on = !AIB.sound.on;
      store.set(KEYS.sound, AIB.sound.on);
      soundBtn();
      sfx('pick');
    };
    $('#btn-rules').onclick = showRules;
    $('#btn-home').onclick = showSetup;

    const table = $('#table');
    addEventListener('resize', () => game && fitEquipped());
    table.addEventListener('click', onTableClick);
    table.addEventListener('mousemove', onTableHover);
    table.addEventListener('mouseleave', () => { planId = drawHover = null; applyPlan(); });
    document.addEventListener('contextmenu', e => {
      const ce = e.target.closest('#table .card');
      if (ce && game) { e.preventDefault(); showZoom(ce.dataset.id); }
    });
    document.addEventListener('keydown', e => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'Escape' && !$('#overlay').hidden) { if ($('#overlay').dataset.dismissable) closeOverlay(); }
      else if (e.key === 'Escape' && !$('#log-box').hidden) showLog(false);
      else if ((e.key === 'z' || e.key === 'Z') && !e.altKey && ($('#overlay').hidden || $('#overlay .result'))) { e.preventDefault(); undo(); }
    });

    // Offline support (needs http/https: service workers don't run from file://).
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

    // Warm the image cache so cards never flash while flipping.
    for (const i of INST_LIST) for (const ign of [false, true]) new Image().src = src(i.id, ign);

    const sv = store.get(KEYS.save);
    if (sv && sv.cfg && sv.s) {
      try {
        startGame(sv.cfg, sv.s, sv.hist || []);
        if (game.s.over) showResult();
        return;
      } catch (err) {
        store.del(KEYS.save);
      }
    }
    showSetup();
  }

  document.addEventListener('DOMContentLoaded', boot);
})(globalThis.AIB);

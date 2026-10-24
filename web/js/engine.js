/* Rules engine. UI-agnostic: talks to the outside world through an `io` object:
 *   io.ask(req)  -> Promise<answer>   (player choices)
 *   io.step(ms)  -> Promise           (render + short pause)
 *   io.cancel()                        (abort a pending ask)
 * Deck and discard arrays are ordered top-first (index 0 = top). */
(function (AIB) {
  'use strict';
  const { TYPES, INST, INST_LIST, BLITZ_REMOVED } = AIB;
  const CANCEL = { cancelled: true };
  const PRINCESS = 'Princess', KING = 'King';

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(a, r) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Build a serializable game config. opts: { exps: [...], blitz, seed, pool?, conds?, campaign? } */
  function makeConfig(opts) {
    const exps = opts.blitz ? [] : (opts.exps || []).slice();
    const wu = exps.includes('wakingUp');
    let pool = opts.pool;
    if (!pool) {
      pool = INST_LIST.filter(i => i.exp === 'base' || exps.includes(i.exp)).map(i => i.id);
      if (opts.blitz) pool = pool.filter(id => !BLITZ_REMOVED.includes(id));
      if (wu) pool = pool.filter(id => id !== 'princess' && id !== 'king');
    }
    const conds = opts.conds || [wu ? 'wu' : 'base', ...exps.filter(e => e !== 'hands' && e !== 'wakingUp')];
    return {
      exps, blitz: !!opts.blitz, pool, conds,
      seed: opts.seed ?? Math.floor(Math.random() * 2 ** 31),
      campaign: opts.campaign ?? null,
    };
  }

  class Game {
    constructor(cfg, io, state, hist) {
      this.cfg = cfg;
      this.io = io;
      this.hist = hist || [];
      this.busy = false;
      this.aborted = false;
      this.s = state || this.deal();
    }

    deal() {
      const r = rng(this.cfg.seed);
      for (let tries = 0; ; tries++) {
        this.s = {
          deck: shuffle(this.cfg.pool.map(id => ({ id, ign: false })), r),
          equipped: [], discard: [], aside: [], play: null, held: null,
          prophecy: null, giftsPlayed: 0, dgPlayed: false, urgentAll: 0,
          turn: 1, phase: 0, over: null, log: [], newly: null,
        };
        for (const c of this.s.deck.splice(0, 3)) { c.eq = 0; this.s.equipped.push(c); }
        // Be kind: never deal an opening with no legal play.
        if (this.legal().length || tries > 50) return this.s;
      }
    }

    // ---------- queries ----------
    type(c) { return INST[c.id].type; }
    T(c) { return TYPES[INST[c.id].type]; }
    name(c) { return this.T(c).name; }
    side(c) { const t = this.T(c), k = c.ign ? 1 : 0; return { num: t.num[k], kw: t.kw[k], yellow: t.yellow[k] }; }
    is(c, cls) { return this.T(c).cls.includes(cls); }
    cards() {
      const s = this.s;
      return [...s.deck, ...s.equipped, ...s.discard, ...s.aside, ...(s.play ? [s.play] : []), ...(s.held ? [s.held] : [])];
    }
    byId(id) { return this.cards().find(c => c.id === id) || null; }
    where(c) {
      const s = this.s;
      for (const z of ['deck', 'equipped', 'discard', 'aside']) if (s[z].includes(c)) return z;
      if (s.play === c) return 'play';
      if (s.held === c) return 'held';
      return null;
    }
    // "Find" searches everywhere a card can be (FAQ): deck, equipped and discard pile.
    find(pred) { const s = this.s; return [...s.deck, ...s.equipped, ...s.discard].filter(pred); }
    deckOrEquipped(pred) { return [...this.s.deck, ...this.s.equipped].filter(pred); }

    canPlay(c) {
      const s = this.s;
      const onlyMosquitos = () => s.equipped.every(x => this.is(x, 'MOSQUITO'));
      switch (this.type(c)) {
        case 'squeek': return s.deck.length <= (c.ign ? 8 : 6) || onlyMosquitos();
        case 'skoot': return s.deck.length <= (c.ign ? 9 : 8) || onlyMosquitos();
        case 'advisor': return c.ign
          ? !s.deck.some(x => this.is(x, 'CONSPIRATOR'))
          : this.cards().some(x => this.type(x) === 'throne' && x.ign);
        case 'all': return !c.ign;
      }
      return true;
    }

    legal() {
      const s = this.s;
      if (s.over) return [];
      const ok = s.equipped.filter(c => this.canPlay(c));
      const abs = ok.filter(c => this.side(c).kw === 'absolute');
      if (abs.length) return abs;
      if (s.urgentAll === s.turn) return ok;
      if (ok.some(c => this.side(c).kw === 'urgent')) return ok.filter(c => ['urgent', 'royal'].includes(this.side(c).kw));
      return ok;
    }

    /* Where would playing `c` draw to? { n, boom } or { special } — used for hover hints. */
    drawPreview(c) {
      const s = this.s, t = this.type(c), num = this.side(c).num;
      let n = num;
      if (t === 'king') {
        const p = this.cards().find(x => this.name(x) === PRINCESS);
        if (!c.ign && p && this.where(p) !== 'equipped') return { special: p.id };
        if (c.ign) return { any: true };
        n = 5;
      } else if (t === 'wuKing') {
        if (!c.ign) {
          const i = s.deck.findIndex(x => this.is(x, 'CONSPIRATOR'));
          n = i < 0 ? 5 : i + 1;
        } else {
          const k = this.deckOrEquipped(x => x !== c && this.is(x, 'CONSPIRATOR')).length;
          n = k ? 5 * k : 5;
        }
      } else if (t === 'all') return { any: true };
      return { n, boom: n > s.deck.length };
    }

    desired() {
      const p = this.s.prophecy;
      if (!p) return [];
      if (p === 'allBreakfast') return this.cards().filter(c => this.is(c, 'BREAKFAST'));
      return this.cards().filter(c => this.type(c) === p);
    }

    /* Live status of every win condition in play. */
    conditions() {
      const s = this.s, out = [];
      const dish = this.desired();
      const princess = this.cards().find(c => this.name(c) === PRINCESS);
      for (const k of this.cfg.conds) {
        if (k === 'base' || k === 'wu') {
          out.push({ k: 'prophecy', ok: !!s.prophecy, v: s.prophecy });
          if (k === 'base') out.push({ k: 'dish', ok: dish.length > 0 && dish.every(c => c.ign), v: dish.map(c => c.id) });
          else out.push({ k: 'dishGone', ok: dish.length > 0 && dish.every(c => this.where(c) === 'discard'), v: dish.map(c => c.id) });
          out.push({ k: 'princess', ok: null, v: princess ? (this.where(princess) === 'discard' ? 'gone' : princess.ign ? 'ign' : 'pas') : 'gone' });
          if (k === 'wu') {
            const th = this.cards().find(c => this.type(c) === 'throne');
            out.push({ k: 'throne', ok: null, v: th ? (this.where(th) === 'discard' ? 'gone' : th.ign ? 'ign' : 'pas') : 'gone' });
          }
        } else if (k === 'mosquitos') {
          const m = this.cards().filter(c => this.is(c, 'MOSQUITO'));
          const d = m.filter(c => this.where(c) === 'discard').length;
          out.push({ k, ok: d === m.length, v: `${d}/${m.length}` });
        } else if (k === 'dreamGuide') out.push({ k, ok: s.dgPlayed, v: s.dgPlayed });
        else if (k === 'gifts') out.push({ k, ok: s.giftsPlayed >= 3, v: `${Math.min(s.giftsPlayed, 3)}/3` });
        else if (k === 'juice') out.push({ k, ok: s.prophecy === 'juice' || (s.prophecy === 'allBreakfast' && dish.some(c => this.type(c) === 'juice')), v: s.prophecy });
        else if (k === 'all') {
          const a = s.equipped.find(c => this.type(c) === 'all');
          out.push({ k, ok: !!a, v: a && a.ign ? s.turn - a.eq : null });
        }
      }
      return out;
    }

    // ---------- mutations ----------
    log(msg) { this.s.log.push(`${this.s.turn}|${msg}`); if (this.s.log.length > 300) this.s.log.shift(); }
    remove(c) {
      const s = this.s, z = this.where(c);
      if (z === 'play') s.play = null;
      else if (z === 'held') s.held = null;
      else if (z) s[z].splice(s[z].indexOf(c), 1);
      return z;
    }
    toBottom(c) { this.remove(c); this.s.deck.push(c); }
    toTop(c) { this.remove(c); this.s.deck.unshift(c); }
    equip(c) { this.remove(c); c.eq = this.s.turn; this.s.equipped.push(c); }
    discard(c) {
      if (this.where(c) === 'discard') return false; // already there: ignored
      this.remove(c);
      this.s.discard.unshift(c);
      this.log(`✖ ${this.name(c)}`);
      return true;
    }
    ignite(c) {
      if (!c.ign) { c.ign = true; this.log(`🔥 ${this.name(c)}`); } else this.discard(c);
    }
    setAside(c) { this.remove(c); this.s.aside.push(c); }

    drawEquip(n) {
      const s = this.s;
      if (n > s.deck.length) return this.gameOver(false, 'draw', { n, have: s.deck.length });
      if (n <= 0) return;
      const drawn = s.deck.splice(0, n);
      const last = drawn.pop();
      s.deck.push(...drawn);
      this.equip(last);
      s.newly = last.id;
      this.log(`Draw ${n} → ${this.name(last)}`);
    }

    gameOver(win, reason, extra) {
      this.s.over = Object.assign({ win, reason }, extra);
      this.log(win ? '★ Victory' : '💥 Boom');
    }

    // The Princess (or copied action) ends the game: check every condition.
    endByPrincess(ctx) {
      const failed = this.conditions().filter(c => c.ok === false).map(c => c.k);
      if (ctx.copy) failed.push('princess');
      this.gameOver(failed.length === 0, failed.length ? 'conds' : 'win', { failed });
    }

    // ---------- choices ----------
    async step(ms) {
      await this.io.step(ms);
      if (this.aborted) throw CANCEL;
    }
    async ask(req) {
      const r = await this.io.ask(req);
      if (this.aborted) throw CANCEL;
      return r;
    }
    /* Pick one card. A single mandatory option is taken automatically. */
    async pick(prompt, cards, opt = {}) {
      if (!cards.length) return null;
      if (cards.length === 1 && !opt.optional) return cards[0];
      const id = await this.ask({ kind: 'pick', prompt, ids: cards.map(c => c.id), optional: !!opt.optional, skip: opt.skip, hint: opt.hint });
      return id == null ? null : this.byId(id);
    }
    /* Pick an ordered sequence. all: every card must be ordered. */
    async pickSeq(prompt, cards, opt = {}) {
      if (opt.all && cards.length < 2) return cards.slice();
      const ids = await this.ask({ kind: 'seq', prompt, ids: cards.map(c => c.id), all: !!opt.all, optional: !!opt.optional, skip: opt.skip });
      return ids == null ? null : ids.map(id => this.byId(id));
    }
    async pickSlot(prompt) {
      return this.ask({ kind: 'slot', prompt });
    }

    // ---------- turn ----------
    async play(id) {
      if (this.busy || this.s.over) return false;
      const c = this.s.equipped.find(x => x.id === id);
      if (!c || !this.legal().includes(c)) return false;
      this.hist.push(structuredClone(this.s));
      if (this.hist.length > 200) this.hist.shift();
      this.busy = true;
      try {
        await this.turn(c);
      } catch (e) {
        if (e !== CANCEL) throw e;
      } finally {
        this.busy = false;
        if (this.aborted) { this.aborted = false; this.s = this.hist.pop(); }
      }
      return true;
    }

    undo() {
      if (this.busy) { this.aborted = true; this.io.cancel(); return true; }
      if (!this.hist.length) return false;
      this.s = this.hist.pop();
      return true;
    }

    async turn(c) {
      const s = this.s;
      const ctx = { card: c, ign: c.ign, skipIgnite: false, aside: false, copy: false };
      s.newly = null;
      this.remove(c);
      s.play = c;
      s.phase = 1;
      if (this.type(c) === 'dreamGuide') s.dgPlayed = true;
      this.log(`▶ ${this.name(c)}${c.ign ? ' (ignited)' : ''}`);
      await this.step();

      s.phase = 2;
      await this.drawPhase(c);
      if (s.over) return;
      await this.step();

      s.phase = 3;
      const fn = ACTIONS[this.type(c)][ctx.ign ? 1 : 0];
      if (fn) { await fn(this, ctx); await this.step(); }
      if (s.over) return;

      s.phase = 4;
      if (s.play === c && !ctx.aside) {
        if (ctx.skipIgnite) this.log('Ignite skipped');
        else { this.ignite(c); await this.step(); }
      }

      s.phase = 5;
      if (s.play === c) { s.play = null; s.deck.push(c); await this.step(); }

      s.phase = 0;
      s.newly = null;
      this.endTurn();
    }

    endTurn() {
      const s = this.s;
      const all = s.equipped.find(c => this.type(c) === 'all' && c.ign);
      if (all && s.turn - all.eq >= 3) return this.gameOver(false, 'all');
      s.turn++;
      if (!this.legal().length) this.gameOver(false, 'stuck');
    }

    async drawPhase(c) {
      const s = this.s, t = this.type(c);
      if (t === 'king' && !c.ign) {
        const p = this.cards().find(x => this.name(x) === PRINCESS);
        if (p && this.where(p) === 'equipped') return this.drawEquip(5);
        if (p && ['deck', 'discard'].includes(this.where(p))) {
          this.equip(p); s.newly = p.id; this.log(`Equip ${PRINCESS}`);
        }
        return;
      }
      if (t === 'king' && c.ign) {
        const x = await this.pick('Search the deck: equip a card', s.deck);
        if (x) { this.equip(x); s.newly = x.id; this.log(`Equip ${this.name(x)}`); }
        return;
      }
      if (t === 'wuKing') {
        const conspirators = this.deckOrEquipped(x => this.is(x, 'CONSPIRATOR'));
        if (!c.ign) {
          const i = s.deck.findIndex(x => this.is(x, 'CONSPIRATOR'));
          return this.drawEquip(i < 0 ? 5 : i + 1);
        }
        return this.drawEquip(conspirators.length ? 5 * conspirators.length : 5);
      }
      if (t === 'all') {
        const x = await this.pick('Draw down to which card?', s.deck, { optional: true, skip: 'Draw 0', hint: 'draw' });
        if (x) this.drawEquip(s.deck.indexOf(x) + 1);
        return;
      }
      return this.drawEquip(this.side(c).num);
    }
  }

  // ---------- card actions: [passive, ignited] ----------
  const newly = g => { const n = g.s.newly && g.byId(g.s.newly); return n && g.where(n) === 'equipped' ? n : null; };

  async function prophecy(g, ctx) {
    if (g.s.prophecy) { g.log('Prophecy already made'); return; }
    g.s.prophecy = g.T(ctx.card).dish;
    g.setAside(ctx.card);
    ctx.aside = true;
    g.log(`🔮 ${TYPES[g.s.prophecy] ? TYPES[g.s.prophecy].name : 'All breakfast'}`);
  }
  const igniteNewly = async g => { const n = newly(g); if (n) g.ignite(n); };
  const findToBottom = type => async g => {
    const [x] = g.find(c => g.type(c) === type);
    if (x) { g.toBottom(x); g.log(`↓ ${g.name(x)}`); }
  };
  const igniteTop = n => async g => {
    for (const c of g.s.deck.slice(0, n)) { g.ignite(c); await g.step(160); }
  };
  async function princessMove(g) {
    const c = await g.pick('Move a deck card…', g.s.deck, { optional: true });
    if (!c) return;
    g.remove(c);
    g.s.held = c;
    const i = await g.pickSlot('…put it back where?');
    g.s.held = null;
    g.s.deck.splice(i, 0, c);
  }
  async function reorder(g, from, count) {
    const d = g.s.deck;
    const start = from === 'top' ? 0 : Math.max(0, d.length - count);
    const block = d.slice(start, start + count);
    if (block.length < 2) return;
    const ord = await g.pickSeq(`Reorder (1 = ${from === 'top' ? 'top' : 'highest'})`, block, { all: true, optional: true, skip: 'Keep' });
    if (ord) g.s.deck.splice(start, block.length, ...ord);
  }
  const giftAside = (g, ctx) => { g.setAside(ctx.card); ctx.aside = true; g.s.giftsPlayed++; };
  const giftDiscard = cls => async (g, ctx) => {
    const x = await g.pick(`Discard a ${cls}`, g.deckOrEquipped(c => g.is(c, cls)));
    if (x) { g.discard(x); await g.step(); }
    giftAside(g, ctx);
  };
  const discardAllOrdered = async (g, cards, prompt) => {
    const ord = await g.pickSeq(prompt, cards, { all: true });
    for (const c of ord) { g.discard(c); await g.step(140); }
  };

  const ACTIONS = {
    princess: [princessMove, async (g, ctx) => {
      const n = newly(g);
      if (n && n.ign && g.desired().includes(n)) g.endByPrincess(ctx);
    }],
    king: [null, null],
    croissantProphet: [async g => { const c = g.s.deck[0]; if (c) g.discard(c); }, prophecy],
    eggsProphet: [async g => {
      const c = await g.pick('Discard an equipped card', g.s.equipped);
      if (c) { g.discard(c); await g.step(); }
      if (g.s.deck[0]) g.equip(g.s.deck[0]);
    }, prophecy],
    pancakesProphet: [async g => { const c = g.s.deck[g.s.deck.length - 1]; if (c) g.discard(c); }, prophecy],
    croissant: [igniteNewly, findToBottom('pancakes')],
    eggs: [igniteNewly, findToBottom('croissant')],
    pancakes: [igniteNewly, findToBottom('eggs')],
    mender: [async g => { if (g.s.deck[0]) g.ignite(g.s.deck[0]); }, async g => {
      const c = await g.pick('Return a discarded card (ignited)', g.s.discard);
      if (c) { g.toBottom(c); c.ign = true; g.log(`↓ ${g.name(c)}`); }
    }],
    joker: [async g => {
      const eq = g.s.equipped.slice();
      if (!eq.length) return;
      const ord = await g.pickSeq('Order to the bottom (1 first)', eq, { all: true, skip: 'As is' });
      for (const c of ord) g.toBottom(c);
      await g.step();
      for (let i = 0; i < ord.length && g.s.deck.length; i++) g.equip(g.s.deck[0]);
    }, async g => { if (g.s.deck[0]) g.equip(g.s.deck[0]); }],
    librarian: [g => reorder(g, 'top', 3), g => reorder(g, 'bottom', 5)],
    rascal: [igniteTop(2), igniteTop(4)],
    guardian: [async g => {
      const c = await g.pick('Send a deck card to the bottom', g.s.deck, { optional: true });
      if (c) g.toBottom(c);
    }, async g => {
      const c = await g.pick('Discard a deck card', g.s.deck);
      if (c) g.discard(c);
    }],

    rightHand: [async g => { g.s.urgentAll = g.s.turn + 1; g.log('Next turn: all urgent'); }, async (g, ctx) => {
      const opts = g.s.equipped.filter(c => {
        const sd = g.side(c);
        return !sd.yellow && !g.is(c, 'PROPHET') && !g.is(c, 'GIFT') && ACTIONS[g.type(c)][c.ign ? 1 : 0];
      });
      const c = await g.pick('Copy an equipped card\'s action', opts);
      if (!c) return;
      g.log(`Copy ${g.name(c)}`);
      ctx.copy = true;
      await ACTIONS[g.type(c)][c.ign ? 1 : 0](g, ctx);
      ctx.copy = false;
    }],
    leftHand: [async g => {
      const c = await g.pick('Swap an equipped card with the deck top', g.s.equipped);
      if (!c) return;
      const top = g.s.deck[0];
      g.toTop(c);
      if (top) g.equip(top);
    }, async g => {
      const c = await g.pick('Discard an equipped card', g.s.equipped);
      if (c) { g.discard(c); await g.step(); }
      const d = await g.pick('Equip a card from the discard pile', g.s.discard);
      if (d) g.equip(d);
    }],

    squeek: [null, null],
    skoot: [null, null],

    dreamGuide: [null, null], // filled below (same on both sides)
    maiden: [async g => {
      const c = await g.pick('Ignite one of the top 4', g.s.deck.slice(0, 4));
      if (c) g.ignite(c);
    }, async g => { for (const c of g.s.deck.slice(0, 4)) c.ign = false; }],
    gardener: [async g => {
      const c = await g.pick('Bring a deck card to the top', g.s.deck, { optional: true });
      if (c) g.toTop(c);
    }, async g => {
      const ord = await g.pickSeq('Equipped → top of deck (1 = top)', g.s.equipped, { optional: true, skip: 'None' });
      if (!ord || !ord.length) return;
      for (const c of ord.slice().reverse()) g.toTop(c);
      await g.step();
      for (let i = 0; i < ord.length && g.s.deck.length; i++) g.equip(g.s.deck[g.s.deck.length - 1]);
    }],
    prince: [async g => {
      for (const k of g.find(c => g.name(c) === KING)) g.discard(k);
    }, async g => {
      const p = g.cards().find(c => g.name(c) === PRINCESS);
      if (p && ['deck', 'equipped'].includes(g.where(p))) g.ignite(p);
    }],
    queen: [async (g, ctx) => { ctx.skipIgnite = true; }, async g => {
      g.s.deck.reverse();
      for (const c of g.s.deck) c.ign = !c.ign;
      g.log('Deck flipped');
    }],

    loudGift: [giftDiscard('COURT'), async (g, ctx) => giftAside(g, ctx)],
    smellyGift: [giftDiscard('COURT'), async (g, ctx) => giftAside(g, ctx)],
    fieryGift: [giftDiscard('COURT'), async (g, ctx) => giftAside(g, ctx)],
    monkeyGift: [giftDiscard('GIFT'), async (g, ctx) => {
      for (const c of g.deckOrEquipped(c => g.is(c, 'GIFT'))) { g.discard(c); await g.step(140); }
      giftAside(g, ctx);
    }],

    juiceProphet: [async g => {
      if (g.s.equipped.length) await discardAllOrdered(g, g.s.equipped.slice(), 'Discard order (1 first)');
      for (let i = 0; i < 3 && g.s.deck.length; i++) g.equip(g.s.deck[0]);
    }, prophecy],
    juice: [async g => {
      const b = g.deckOrEquipped(c => g.is(c, 'BREAKFAST'));
      if (b.length) await discardAllOrdered(g, b, 'Discard order (1 first)');
    }, async g => {
      const top = g.s.discard.slice(0, 3);
      if (!top.length) return;
      const ord = await g.pickSeq('Order to the bottom (1 first)', top, { all: true, skip: 'As is' });
      for (const c of ord) g.toBottom(c);
    }],
    heretic: [async g => {
      const c = await g.pick('Discard a prophet', g.deckOrEquipped(c => g.is(c, 'PROPHET')));
      if (c) g.discard(c);
    }, async g => {
      for (const c of g.s.aside.filter(c => g.is(c, 'PROPHET'))) g.discard(c);
      if (g.s.prophecy) g.log('Prophecy undone');
      g.s.prophecy = null;
    }],

    wuPrincess: [princessMove, async (g, ctx) => {
      const n = newly(g);
      if (n && n.ign && g.type(n) === 'throne') g.endByPrincess(ctx);
    }],
    wuKing: [null, null],
    assassin: [async g => {
      const k = g.deckOrEquipped(c => g.is(c, 'CONSPIRATOR')).length;
      for (let i = 0; i < k && g.s.deck.length; i++) { g.discard(g.s.deck[g.s.deck.length - 1]); await g.step(140); }
    }, async g => { const n = newly(g); if (n) g.discard(n); }],
    prophetMother: [async g => {
      for (const c of g.deckOrEquipped(c => g.is(c, 'PROPHET'))) c.ign = false;
    }, prophecy],
    advisor: [null, null],
    throne: [async g => {
      const cs = g.find(c => g.is(c, 'CONSPIRATOR'));
      if (!cs.length) return;
      const ord = await g.pickSeq('Order on top (1 = top)', cs, { all: true, skip: 'As is' });
      for (const c of ord.slice().reverse()) g.toTop(c);
    }, async g => {
      const c = await g.pick('Equip a card from deck or discard', [...g.s.deck, ...g.s.discard]);
      if (c) g.equip(c);
    }],

    all: [null, null],
  };
  const dreamGuide = async g => {
    for (const p of g.find(c => g.name(c) === PRINCESS)) g.discard(p);
    await g.step();
    [g.s.deck, g.s.discard] = [g.s.discard, g.s.deck];
    g.log('Deck ⇄ discard');
  };
  ACTIONS.dreamGuide = [dreamGuide, dreamGuide];

  Object.assign(AIB, { Game, makeConfig, ACTIONS, CANCEL, rng });
})(globalThis.AIB = globalThis.AIB || {});

/* Card data for ALL IS BOMB. Each type lists [passive, ignited] values. */
(function (AIB) {
  'use strict';

  const EXPANSIONS = {
    hands:      { name: 'Hands',       goal: 'Helper pack',          helper: true },
    mosquitos:  { name: 'Mosquitos',   goal: 'Discard both' },
    dreamGuide: { name: 'Dream Guide', goal: 'Play it once' },
    gifts:      { name: 'Gifts',       goal: 'Play 3 gifts' },
    juice:      { name: 'The Juice',   goal: 'Juice is the dish' },
    wakingUp:   { name: 'Waking Up',   goal: 'Discard dish, crown the Throne' },
    all:        { name: 'All',         goal: 'Keep ALL equipped' },
  };
  // Campaign order (Hands are included from the start).
  const CAMPAIGN = ['mosquitos', 'dreamGuide', 'gifts', 'juice', 'wakingUp', 'all'];

  const T = (name, exp, num, kw, txt, extra) =>
    Object.assign({ name, exp, num, kw, txt, cls: [], yellow: [false, false] }, extra);

  const TYPES = {
    // Base game
    princess: T('Princess', 'base', [3, 3], ['royal', 'royal'], [
      'Take any card from the DECK and put it back any place in the DECK.',
      'If you EQUIP the ignited "DESIRED DISH" this turn, the game ends.'], { cls: ['COURT'] }),
    king: T('King', 'base', ['K', 'K'], [null, null], [
      'When played: don\'t draw. Search for the PRINCESS and EQUIP her. If she is already EQUIPPED, play this as a 5 card.',
      'When played: don\'t draw. Search for any card in the DECK and EQUIP it.'], { cls: ['COURT'], yellow: [true, true] }),
    croissantProphet: T('Croissant Prophet', 'base', [6, 6], ['urgent', 'urgent'], [
      'DISCARD the top card from the DECK.',
      'PROPHECY: the DESIRED DISH is the CROISSANT.'], { cls: ['PROPHET'], dish: 'croissant' }),
    eggsProphet: T('Eggs Prophet', 'base', [6, 6], ['urgent', 'urgent'], [
      'DISCARD any EQUIPPED card and EQUIP the top card from the DECK.',
      'PROPHECY: the DESIRED DISH is the EGGS.'], { cls: ['PROPHET'], dish: 'eggs' }),
    pancakesProphet: T('Pancakes Prophet', 'base', [6, 6], ['urgent', 'urgent'], [
      'DISCARD the bottom card from the DECK.',
      'PROPHECY: the DESIRED DISH is the PANCAKES.'], { cls: ['PROPHET'], dish: 'pancakes' }),
    croissant: T('Croissant', 'base', [2, 2], [null, 'urgent'], [
      'IGNITE the newly EQUIPPED card.',
      'Find the PANCAKES and put them to the bottom of the DECK.'], { cls: ['BREAKFAST'] }),
    eggs: T('Eggs', 'base', [2, 2], [null, 'urgent'], [
      'IGNITE the newly EQUIPPED card.',
      'Find the CROISSANT and put it to the bottom of the DECK.'], { cls: ['BREAKFAST'] }),
    pancakes: T('Pancakes', 'base', [2, 2], [null, 'urgent'], [
      'IGNITE the newly EQUIPPED card.',
      'Find the EGGS and put them to the bottom of the DECK.'], { cls: ['BREAKFAST'] }),
    mender: T('Mender', 'base', [5, 5], [null, 'urgent'], [
      'IGNITE the top card of the DECK.',
      'Take any card from the DISCARD PILE and put it to the bottom of the DECK, IGNITED side up.']),
    joker: T('Joker', 'base', [1, 1], [null, 'urgent'], [
      'Put all EQUIPPED cards to the bottom of the DECK (any order) and EQUIP that many from the top.',
      'EQUIP an additional card from the top of the DECK.'], { cls: ['COURT'] }),
    librarian: T('Librarian', 'base', [4, 4], [null, null], [
      'You may change the order of the top 3 cards of the DECK.',
      'You may change the order of the bottom 5 cards of the DECK.']),
    rascal: T('Rascal', 'base', [4, 4], ['urgent', 'urgent'], [
      'IGNITE the top 2 cards of the DECK.',
      'IGNITE the top 4 cards of the DECK.']),
    guardian: T('Guardian', 'base', [3, 3], [null, 'urgent'], [
      'Take any card from the DECK and put it to the bottom of the DECK.',
      'DISCARD any card from the DECK.']),

    // Hands (helper pack)
    rightHand: T('Right Hand', 'hands', [4, 4], ['royal', 'royal'], [
      'The next turn, all EQUIPPED cards count as URGENT.',
      'Copy the ACTION of an EQUIPPED card (not yellow text, PROPHET or GIFT).']),
    leftHand: T('Left Hand', 'hands', [1, 1], ['royal', 'royal'], [
      'Exchange any EQUIPPED card with the top card of the DECK.',
      'DISCARD an EQUIPPED card. EQUIP a card from the DISCARD PILE.']),

    // Mosquitos
    squeek: T('Squeek', 'mosquitos', [2, 2], [null, null], [
      'Can\'t be played unless the DECK has 6 or fewer cards, or only MOSQUITOS are EQUIPPED.',
      'Can\'t be played unless the DECK has 8 or fewer cards, or only MOSQUITOS are EQUIPPED.'], { cls: ['MOSQUITO'], yellow: [true, true] }),
    skoot: T('Skoot', 'mosquitos', [3, 3], [null, null], [
      'Can\'t be played unless the DECK has 8 or fewer cards, or only MOSQUITOS are EQUIPPED.',
      'Can\'t be played unless the DECK has 9 or fewer cards, or only MOSQUITOS are EQUIPPED.'], { cls: ['MOSQUITO'], yellow: [true, true] }),

    // Dream Guide
    dreamGuide: T('Dream Guide', 'dreamGuide', [7, 7], ['royal', 'royal'], [
      'Find and DISCARD the PRINCESS. Then the DECK and the DISCARD PILE swap places.',
      'Find and DISCARD the PRINCESS. Then the DECK and the DISCARD PILE swap places.']),
    maiden: T('Maiden', 'dreamGuide', [5, 5], [null, null], [
      'IGNITE one of the top 4 cards of the DECK.',
      'Turn the top 4 cards of the DECK to their PASSIVE sides.']),
    gardener: T('Gardener', 'dreamGuide', [2, 2], [null, 'urgent'], [
      'Take any card from the DECK and put it to the top of the DECK.',
      'Put any number of EQUIPPED cards on top of the DECK (any order) and EQUIP as many from the bottom.']),
    prince: T('Prince', 'dreamGuide', [1, 1], ['urgent', 'urgent'], [
      'Find and DISCARD the KING.',
      'IGNITE the PRINCESS, unless she\'s in the DISCARD PILE.'], { cls: ['COURT'] }),
    queen: T('Queen', 'dreamGuide', [3, 3], ['royal', 'urgent'], [
      'Skip the Ignite phase of this turn.',
      'Flip over the whole DECK: bottom becomes top, PASSIVE becomes IGNITED and vice versa.'], { cls: ['COURT'] }),

    // Gifts
    loudGift: T('Loud Gift', 'gifts', [2, 2], ['urgent', 'urgent'], [
      'DISCARD a COURT card from the DECK or EQUIPPED. Set this card aside.',
      'Set this card aside.'], { cls: ['GIFT'] }),
    smellyGift: T('Smelly Gift', 'gifts', [4, 4], [null, 'urgent'], [
      'DISCARD a COURT card from the DECK or EQUIPPED. Set this card aside.',
      'Set this card aside.'], { cls: ['GIFT'] }),
    fieryGift: T('Fiery Gift', 'gifts', [6, 6], [null, 'urgent'], [
      'DISCARD a COURT card from the DECK or EQUIPPED. Set this card aside.',
      'Set this card aside.'], { cls: ['GIFT'] }),
    monkeyGift: T('Monkey Gift', 'gifts', [12, 12], ['urgent', 'urgent'], [
      'DISCARD a GIFT card from the DECK or EQUIPPED. Set this card aside.',
      'DISCARD all GIFT cards from the DECK and EQUIPPED. Set this card aside.'], { cls: ['GIFT'] }),

    // The Juice
    juiceProphet: T('The Juice Prophet', 'juice', [6, 6], ['urgent', 'urgent'], [
      'DISCARD all EQUIPPED cards (any order) and EQUIP 3 cards from the top of the DECK.',
      'PROPHECY: the DESIRED DISH is THE JUICE.'], { cls: ['PROPHET'], dish: 'juice' }),
    juice: T('The Juice', 'juice', [2, 2], [null, 'urgent'], [
      'DISCARD all BREAKFAST cards that are EQUIPPED or in the DECK (any order).',
      'Put the top 3 cards of the DISCARD PILE to the bottom of the DECK in any order.'], { cls: ['BREAKFAST'] }),
    heretic: T('Heretic', 'juice', [1, 1], [null, 'urgent'], [
      'DISCARD a PROPHET card from the DECK or EQUIPPED.',
      'If a PROPHET is set aside, DISCARD it. No PROPHECY has been triggered yet.']),

    // Waking Up (replaces base Princess and King)
    wuPrincess: T('Princess', 'wakingUp', [3, 3], ['royal', 'royal'], [
      'Take any card from the DECK and put it back any place in the DECK.',
      'If you EQUIP the ignited THRONE this turn, the game ends.'], { cls: ['COURT'] }),
    wuKing: T('King', 'wakingUp', ['K', 'K'], ['urgent', 'urgent'], [
      'When played: draw until you draw a CONSPIRATOR. If there are none in the DECK, play this as a 5 card.',
      'When played: draw 5 x the CONSPIRATORS EQUIPPED or in the DECK. If none, play this as a 5 card.'],
      { cls: ['CONSPIRATOR', 'COURT'], yellow: [true, true] }),
    assassin: T('Assassin', 'wakingUp', [3, 3], ['urgent', 'urgent'], [
      'Count the CONSPIRATORS in the DECK or EQUIPPED. DISCARD that many cards from the bottom of the DECK.',
      'DISCARD the newly EQUIPPED card.'], { cls: ['CONSPIRATOR'] }),
    prophetMother: T('Prophet Mother', 'wakingUp', [6, 6], ['urgent', 'urgent'], [
      'Turn all PROPHET cards that are EQUIPPED or in the DECK to their PASSIVE sides.',
      'PROPHECY: all BREAKFAST cards are DESIRED DISHES. You must DISCARD them all.'],
      { cls: ['CONSPIRATOR', 'PROPHET'], dish: 'allBreakfast' }),
    advisor: T('Advisor', 'wakingUp', [4, 4], [null, null], [
      'Can\'t be played unless the THRONE is IGNITED.',
      'Can\'t be played unless there are no CONSPIRATORS in the DECK.'], { cls: ['CONSPIRATOR'], yellow: [true, true] }),
    throne: T('Throne', 'wakingUp', [2, 2], [null, null], [
      'Find all CONSPIRATOR cards and put them on top of the DECK (any order).',
      'EQUIP any card from the DECK or the DISCARD PILE.']),

    // All
    all: T('All', 'all', ['A', 'A'], ['absolute', null], [
      'ABSOLUTE: play this before any other card. Draw any number of cards.',
      'Can\'t be played. While EQUIPPED, the game ends after 3 more turns.'], { yellow: [true, true] }),
  };

  // Physical cards. sym: campaign symbol in the lower-right corner ('star' | 'circle').
  const INST_LIST = [
    ['princess'], ['king'], ['croissantProphet'], ['eggsProphet'], ['pancakesProphet'],
    ['croissant'], ['eggs'], ['pancakes'],
    ['mender1', 'mender'], ['mender2', 'mender'], ['joker1', 'joker'], ['joker2', 'joker'],
    ['librarian1', 'librarian'], ['librarian2', 'librarian', 'star'],
    ['rascal1', 'rascal'], ['rascal2', 'rascal', 'star'],
    ['guardian1', 'guardian'], ['guardian2', 'guardian', 'star'],
    ['rightHand'], ['leftHand'],
    ['squeek', 'squeek', 'star'], ['skoot', 'skoot', 'star'],
    ['dreamGuide', 'dreamGuide', 'star'], ['maiden', 'maiden', 'star'], ['gardener', 'gardener', 'star'],
    ['prince', 'prince', 'star'], ['queen', 'queen', 'star'],
    ['loudGift', 'loudGift', 'circle'], ['smellyGift', 'smellyGift', 'circle'],
    ['fieryGift', 'fieryGift', 'circle'], ['monkeyGift', 'monkeyGift', 'circle'],
    ['juiceProphet', 'juiceProphet', 'circle'], ['juice', 'juice', 'circle'], ['heretic', 'heretic', 'star'],
    ['wuPrincess'], ['wuKing', 'wuKing', 'star'], ['assassin', 'assassin', 'star'],
    ['prophetMother', 'prophetMother', 'star'], ['advisor', 'advisor', 'star'], ['throne', 'throne', 'star'],
    ['all'],
  ].map(([id, type, sym]) => ({ id, type: type || id, sym: sym || null, exp: TYPES[type || id].exp }));

  const INST = Object.fromEntries(INST_LIST.map(i => [i.id, i]));
  const BLITZ_REMOVED = ['mender2', 'joker2', 'librarian2', 'rascal2', 'guardian2'];

  Object.assign(AIB, { EXPANSIONS, CAMPAIGN, TYPES, INST_LIST, INST, BLITZ_REMOVED });
})(globalThis.AIB = globalThis.AIB || {});

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function clampFakePercent(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}

export function pickFlashcard(realCards, fakeCards, fakePercent, rng = Math.random) {
  const safePercent = clampFakePercent(fakePercent);
  const useFake = fakeCards.length > 0 && rng() * 100 < safePercent;
  const pool = useFake ? fakeCards : realCards;
  const fallbackPool = pool.length ? pool : [...realCards, ...fakeCards];
  const picked = fallbackPool[Math.floor(rng() * fallbackPool.length)];
  return useFake ? makeFakeCard(picked) : makeRealCard(picked);
}

export function makeRealCard(card) {
  return {
    ...card,
    fake: false,
    front: `${card.cation} + ${card.anion}`,
    back: card.product,
  };
}

export function makeFakeCard(card) {
  return {
    ...card,
    fake: true,
    front: `${card.cation} + ${card.anion}`,
    back: "Nothing happens",
    product: "Nothing happens",
    fill: "FFFFFF",
  };
}

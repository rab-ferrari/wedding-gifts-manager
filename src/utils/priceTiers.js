/**
 * A "price tier" groups every gift that shares the same price into a
 * single unit, since the Gifts page shows one card per distinct price
 * (with a carousel of all gifts at that price), not one card per gift.
 *
 * Naming: "tier" was chosen over alternatives like "group" (too generic
 * to search for) or "bundle" (implies the gifts are purchased together,
 * which they're not -- each is still an independent gift; they just
 * share a price level).
 */

/**
 * Groups a flat array of gifts (as read from gifts.json) into price
 * tiers, sorted by price ascending. Gifts within a tier preserve their
 * original relative order from the input array.
 *
 * Prices are grouped via a fixed-precision (2 decimal place) string key
 * rather than raw float equality. Since gift prices come directly from
 * static JSON with no runtime arithmetic applied to them beforehand,
 * direct float equality would actually be safe here too -- but keying
 * on a fixed-precision string costs nothing and removes any doubt about
 * floating-point comparison edge cases (e.g. a future price computed
 * from a calculation rather than typed literally into the JSON).
 *
 * @param {Array<{id: string, name: string, price: number, image: string, pixPayload: string}>} gifts
 * @returns {Array<{price: number, priceKey: string, gifts: Array}>}
 */
export function groupGiftsByPriceTier(gifts) {
  const tiersByKey = new Map();

  for (const gift of gifts) {
    const priceKey = gift.price.toFixed(2);

    if (!tiersByKey.has(priceKey)) {
      tiersByKey.set(priceKey, {
        price: gift.price,
        priceKey,
        gifts: [],
      });
    }

    tiersByKey.get(priceKey).gifts.push(gift);
  }

  return Array.from(tiersByKey.values()).sort((a, b) => a.price - b.price);
}

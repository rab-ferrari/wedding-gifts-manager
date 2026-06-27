import { useState } from "react";
import { useText } from "../context/SiteDataContext";
import "../styles/giftCarousel.css";

/**
 * GiftCarousel's interaction model for 3+ gifts (see below for the
 * 1-2 gift special cases):
 *
 * There are always exactly 3 visible "slots", showing 3 circularly-
 * consecutive gifts starting at `windowStart`. The carousel tracks
 * ONLY `windowStart` as its own state -- which slot is highlighted
 * ("highlightSlot") is always DERIVED from the parent-owned
 * `selectedIndex` and `windowStart` (rather than tracked
 * separately), so the two can never disagree.
 *
 * Arrow clicks move the highlight smoothly between the 3 already-
 * visible slots first; only once the highlight is already at the
 * left/right edge slot does an arrow click slide the window by one
 * (changing which gifts are shown), and even then the highlight
 * stays in that same edge slot -- it does not jump to the middle and
 * then recenter. This avoids the previous design's two-step "jump
 * then reposition" artifact.
 *
 * Clicking a thumbnail directly selects that slot immediately with
 * no window change, since the clicked gift is by definition already
 * visible.
 */
function getVisibleIndices(windowStart, total) {
  return [0, 1, 2].map((slot) => (windowStart + slot) % total);
}

function getHighlightSlot(selectedIndex, windowStart, total) {
  return (selectedIndex - windowStart + total) % total;
}

/**
 * Carousel for a single price tier's gifts. Shows the currently selected
 * gift's image large (cropped to a square), with a thumbnail row below
 * it for browsing gifts within the tier. The row's behavior depends on
 * how many gifts share the price:
 *
 * - 1 gift: a single slot, always selected, arrows disabled.
 * - 2 gifts: both slots always visible; the highlight just flips
 *   between slot 0 and slot 1.
 * - 3+ gifts: exactly 3 slots visible at a time (see module-level
 *   comment above for the windowing/highlight behavior).
 *
 * The thumbnail row always renders, even for a single-gift tier, so
 * every PriceTierCard in the list has the same height regardless of
 * how many gifts share that price.
 *
 * Controlled component: `selectedIndex` (which gift is selected) is
 * owned by the parent (PriceTierCard), not here -- the parent also
 * needs it to show the gift's name, so lifting it up avoids having two
 * independent copies that could drift out of sync. `windowStart` (which
 * 3 gifts are currently visible, for the 3+ case) is a pure carousel
 * concern with no meaning outside this component, so it stays as local
 * state here.
 */
export default function GiftCarousel({ gifts, selectedIndex, onSelect }) {
  const claimedLabel = useText("gifts_claimed_label");
  const selectedGift = gifts[selectedIndex];
  const total = gifts.length;
  const hasMultiple = total > 1;
  const usesWindow = total > 2;

  const [windowStart, setWindowStart] = useState(0);

  function goToPrevious() {
    if (!usesWindow) {
      onSelect((selectedIndex - 1 + total) % total);
      return;
    }

    const slot = getHighlightSlot(selectedIndex, windowStart, total);
    if (slot === 0) {
      setWindowStart((current) => (current - 1 + total) % total);
    }
    onSelect((selectedIndex - 1 + total) % total);
  }

  function goToNext() {
    if (!usesWindow) {
      onSelect((selectedIndex + 1) % total);
      return;
    }

    const slot = getHighlightSlot(selectedIndex, windowStart, total);
    if (slot === 2) {
      setWindowStart((current) => (current + 1) % total);
    }
    onSelect((selectedIndex + 1) % total);
  }

  function selectIndexDirectly(index) {
    // Clicking a visible thumbnail directly selects it -- no window
    // change, since the clicked gift is by definition already shown.
    onSelect(index);
  }

  const visibleIndices = usesWindow
    ? getVisibleIndices(windowStart, total)
    : gifts.map((_, index) => index); // 1-2 gift case: everything's visible

  return (
    <div className="gift-carousel">
      <div className="gift-carousel__main">
        <img
          className="gift-carousel__main-image"
          src={selectedGift.image}
          alt={selectedGift.name}
        />
        {selectedGift.claimed && (
          <div className="gift-carousel__claimed-watermark" aria-hidden="true">
            {claimedLabel}
          </div>
        )}
      </div>

      <div className="gift-carousel__thumb-row">
        <button
          type="button"
          className="gift-carousel__arrow"
          onClick={goToPrevious}
          disabled={!hasMultiple}
          aria-label="Presente anterior"
        >
          <ArrowIcon direction="left" />
        </button>

        <div className="gift-carousel__thumb-list">
          {/* Keyed by slot position (0/1/2), not gift.id: the 3 slots
              are themselves the stable UI concept here (left/middle/
              right), with no per-thumbnail internal state that keying
              by content identity would need to preserve. Keying by
              slot makes React update the SAME 3 DOM elements in place
              (new src/class) when the window slides, instead of
              unmounting the edge thumbnail and mounting a new one --
              which was a contributing factor to a perceived selection
              "jump" during edge transitions (the border highlight
              visibly flickering to the wrong slot for a frame) even
              though the underlying selectedIndex/windowStart state
              was already verified correct at every step. */}
          {visibleIndices.map((index, slot) => {
            const gift = gifts[index];
            const isSelected = index === selectedIndex;
            return (
              <button
                key={slot}
                type="button"
                className={
                  "gift-carousel__thumb" + (isSelected ? " is-selected" : "")
                }
                onClick={() => selectIndexDirectly(index)}
                aria-label={gift.name}
                aria-current={isSelected}
              >
                <img
                  className="gift-carousel__thumb-image"
                  src={gift.image}
                  alt={gift.name}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="gift-carousel__arrow"
          onClick={goToNext}
          disabled={!hasMultiple}
          aria-label="Próximo presente"
        >
          <ArrowIcon direction="right" />
        </button>
      </div>
    </div>
  );
}

/* Simple geometric arrow, drawn inline rather than as a separate SVG
   asset file -- these are plain UI chevrons, not part of the project's
   provided icon set (home/gift/about/maps/whatsapp/github), so there's
   no asset to keep consistent with by externalizing them. */
function ArrowIcon({ direction }) {
  const points = direction === "left" ? "15,4 7,12 15,20" : "9,4 17,12 9,20";
  return (
    <svg viewBox="0 0 24 24" className="gift-carousel__arrow-icon" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { useState } from "react";
import GiftCarousel from "./GiftCarousel";
import GiftModal from "./GiftModal";
import Tooltip from "./Tooltip";
import { useText } from "../context/SiteDataContext";
import "../styles/priceTierCard.css";

/**
 * Formats a price as Brazilian currency (R$ 1.234,56), since this is a
 * Brazilian Pix-based gift list -- matches the locale convention buyers
 * would expect, rather than a generic/US-style format.
 */
function formatPriceBRL(price) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * One card per distinct price ("price tier" -- see utils/priceTiers.js
 * for the grouping logic and naming rationale). Shows a carousel of all
 * gifts sharing that price on the left, and a bordered info box on the
 * right containing the currently selected gift's name + the shared
 * price, both centered within that box.
 *
 * The info box fills the remaining width next to the carousel (rather
 * than being centered across the full card), so the text always has
 * its own clearly bounded area and never visually overlaps the
 * carousel's image, regardless of viewport width or zoom.
 *
 * Owns the "which gift in this tier is currently selected" state, since
 * both the carousel (which image is large/highlighted) and the info
 * box (which name is shown) need to stay in sync with it. Also owns
 * "is the payment modal open", since the modal always refers to
 * whichever gift is currently selected in this card.
 *
 * When the currently selected gift is claimed, the info box is dimmed
 * and loses its click/hover behavior entirely -- there's nothing to
 * open a payment modal for, so the handlers are never attached rather
 * than attached-but-disabled.
 */
export default function PriceTierCard({ tier }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverText = useText("gifts_hover");
  const selectedGift = tier.gifts[selectedIndex];
  const isClaimed = Boolean(selectedGift.claimed);

  return (
    <article className="price-tier-card">
      <GiftCarousel
        gifts={tier.gifts}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />

      <ConditionalTooltip text={isClaimed ? null : hoverText}>
        <div
          className={
            "price-tier-card__info-box" +
            (isClaimed ? " price-tier-card__info-box--claimed" : "")
          }
          onClick={isClaimed ? undefined : () => setIsModalOpen(true)}
          role={isClaimed ? undefined : "button"}
          tabIndex={isClaimed ? undefined : 0}
          onKeyDown={
            isClaimed
              ? undefined
              : (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsModalOpen(true);
                  }
                }
          }
        >
          <div className="price-tier-card__info">
            <h3 className="price-tier-card__name">{selectedGift.name}</h3>
            <p className="price-tier-card__price">{formatPriceBRL(tier.price)}</p>
          </div>
        </div>
      </ConditionalTooltip>

      {isModalOpen && (
        <GiftModal gift={selectedGift} onClose={() => setIsModalOpen(false)} />
      )}
    </article>
  );
}

/**
 * Tooltip wraps its child in an extra <span>, which would otherwise
 * always be present even for claimed gifts (just with no bubble ever
 * showing, since text would be null) -- this thin wrapper skips that
 * extra element entirely when there's no tooltip to show, so a claimed
 * gift's info box has no stray wrapper element for no reason.
 *
 * Passes the --fill-parent modifier since this specific usage (the
 * info box) needs its Tooltip wrapper to fill the remaining width of
 * .price-tier-card's flex row, not size to its own content.
 */
function ConditionalTooltip({ text, children }) {
  if (!text) return children;
  return (
    <Tooltip text={text} className="tooltip-wrapper--fill-parent">
      {children}
    </Tooltip>
  );
}

import { useState } from "react";
import GiftModal from "./GiftModal";
import Tooltip from "./Tooltip";
import { useText } from "../context/SiteDataContext";
import "../styles/giftCard.css";

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
 * One card per gift: a square image on the left (cropped to fill the
 * box, not letterboxed -- this is a small product-style preview, not
 * a full photo that must stay fully visible), and a bordered info box
 * on the right with the gift's name + price, both centered within it.
 *
 * This replaces the earlier PriceTierCard/GiftCarousel design, which
 * grouped multiple gifts sharing a price into one card with a
 * carousel to browse between them. Beta testing found the carousel
 * unintuitive, so the simpler one-card-per-gift structure replaces it
 * here -- the carousel UI/logic itself is preserved on a separate
 * branch rather than deleted outright, in case it's useful again.
 *
 * The info box fills the remaining width next to the image (rather
 * than being centered across the full card), so the text always has
 * its own clearly bounded area and never visually overlaps the image,
 * regardless of viewport width or zoom.
 *
 * Owns "is the payment modal open" for this gift. When the gift is
 * claimed, the info box is dimmed and loses its click/hover behavior
 * entirely -- there's nothing to open a payment modal for, so the
 * handlers are never attached rather than attached-but-disabled.
 */
export default function GiftCard({ gift }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hoverText = useText("gifts_hover");
  const claimedLabel = useText("gifts_claimed_label");
  const isClaimed = Boolean(gift.claimed);

  return (
    <article className="gift-card">
      <div className="gift-card__image-box">
        <img
          className="gift-card__image"
          src={gift.image}
          alt={gift.name}
        />
        {isClaimed && (
          <div className="gift-card__claimed-watermark" aria-hidden="true">
            {claimedLabel}
          </div>
        )}
      </div>

      <ConditionalTooltip text={isClaimed ? null : hoverText}>
        <div
          className={
            "gift-card__info-box" +
            (isClaimed ? " gift-card__info-box--claimed" : "")
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
          <div className="gift-card__info">
            <h3 className="gift-card__name">{gift.name}</h3>
            <p className="gift-card__price">{formatPriceBRL(gift.price)}</p>
          </div>
        </div>
      </ConditionalTooltip>

      {isModalOpen && (
        <GiftModal gift={gift} onClose={() => setIsModalOpen(false)} />
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
 * .gift-card's flex row, not size to its own content.
 */
function ConditionalTooltip({ text, children }) {
  if (!text) return children;
  return (
    <Tooltip text={text} className="tooltip-wrapper--fill-parent">
      {children}
    </Tooltip>
  );
}

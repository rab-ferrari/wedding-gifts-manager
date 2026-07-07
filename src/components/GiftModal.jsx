import { useEffect, useState } from "react";
import { useText } from "../context/SiteDataContext";
import { useQrCode } from "../hooks/useQrCode";
import { copyToClipboard } from "../utils/clipboard";
import Tooltip from "./Tooltip";
import "../styles/giftModal.css";

/**
 * Formats a price as Brazilian currency (R$ 1.234,56) -- duplicated
 * from GiftCard rather than imported, since it's a single small pure
 * function; a shared utils/formatPrice.js would be reasonable too if
 * a third use case comes up.
 */
function formatPriceBRL(price) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Modal shown when a (non-claimed) gift's info box is clicked. Shows a
 * QR code (generated lazily -- only once this modal actually opens, not
 * for every gift on page load, see useQrCode), a short static subtitle
 * ("Clique para copiar"), the gift name, and price.
 *
 * The QR code itself doubles as a copy-to-clipboard button for the Pix
 * payload string, since scanning isn't always convenient (e.g. testing
 * on the same device) and the underlying string is exactly what a Pix
 * app needs if pasted into a manual "pay with Pix code" flow. The hover
 * tooltip alone wouldn't convey this on a touch device (nothing to
 * hover), so the subtitle is a persistent, always-visible hint instead.
 */
export default function GiftModal({ gift, onClose }) {
  const qrHoverText = useText("qr_code_hover");
  const qrCopiedText = useText("qr_code_copied");
  const qrSubtitle = useText("qr_code_subtitle");
  const [justCopied, setJustCopied] = useState(false);

  const { dataUrl, isLoading, error } = useQrCode(gift.pixPayload, true);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleQrClick() {
    const success = await copyToClipboard(gift.pixPayload);
    if (success) {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    }
  }

  function handleOverlayClick(event) {
    // Only close when the click is on the overlay itself, not bubbling
    // up from a click inside the modal content.
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      className="gift-modal-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="gift-modal"
        role="dialog"
        aria-modal="true"
        aria-label={gift.name}
      >
        <button
          type="button"
          className="gift-modal__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>

        <Tooltip text={justCopied ? qrCopiedText : qrHoverText}>
          <button
            type="button"
            className="gift-modal__qr-button"
            onClick={handleQrClick}
            aria-label={qrHoverText}
          >
            {isLoading && (
              <div className="gift-modal__qr-placeholder" aria-busy="true" />
            )}
            {error && (
              <div className="gift-modal__qr-placeholder gift-modal__qr-error">
                {error}
              </div>
            )}
            {dataUrl && (
              <img
                className="gift-modal__qr-image"
                src={dataUrl}
                alt="QR code Pix"
              />
            )}
          </button>
        </Tooltip>

        <p className="gift-modal__subtitle">{qrSubtitle}</p>

        <h3 className="gift-modal__name">{gift.name}</h3>
        {gift.price && (<p className="gift-modal__price">{formatPriceBRL(gift.price)}</p>)}
      </div>
    </div>
  );
}

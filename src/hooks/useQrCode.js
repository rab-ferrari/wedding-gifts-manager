import { useEffect, useState } from "react";
import QRCode from "qrcode";

/**
 * Generates a QR code as a data URL (base64 PNG) from the given text,
 * but ONLY when `enabled` is true -- callers pass `enabled={isModalOpen}`
 * so the (relatively expensive, synchronous-feeling) QR encoding work
 * only happens once a gift's modal is actually opened, not eagerly for
 * every gift on the page on initial load. Per gift, the result is
 * cached for the lifetime of the component instance (in a ref-free way,
 * via state) so reopening the same modal doesn't regenerate the image.
 */
export function useQrCode(text, enabled) {
  const [dataUrl, setDataUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !text) return;
    if (dataUrl) return; // already generated for this text, don't regenerate

    let cancelled = false;

    QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to generate QR code");
      });

    return () => {
      cancelled = true;
    };
  }, [text, enabled, dataUrl]);

  return { dataUrl, isLoading: enabled && !dataUrl && !error, error };
}

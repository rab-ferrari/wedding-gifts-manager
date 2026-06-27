import { useState } from "react";
import "../styles/tooltip.css";

/**
 * Wraps a single child element, showing a small text tooltip above it
 * on hover. Used for both the "Dar presente" hint on the gift info box
 * and the "Copiar código PIX" / "Código copiado!" hint on the QR code.
 *
 * `className` lets each call site control how the wrapper participates
 * in ITS OWN layout context (e.g. filling a flex row's remaining width
 * for the info box, vs. sizing naturally for the QR button) -- a single
 * fixed wrapper style can't correctly serve both cases at once (this
 * replaced an earlier `display: contents` attempt that also failed:
 * contents removes the wrapper from the box model entirely, which
 * incidentally breaks position:absolute children from anchoring to
 * any sibling, since only a true ancestor box can serve as that
 * anchor -- confirmed by inspecting the tooltip bubble's actual
 * offsetParent, which resolved all the way up to <body> instead of
 * the wrapped element).
 *
 * The wrapper itself is always position: relative, so the tooltip
 * bubble (an absolutely-positioned child) anchors correctly to it
 * regardless of what additional layout className adds.
 */
export default function Tooltip({ text, children, className }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <span
      className={"tooltip-wrapper" + (className ? " " + className : "")}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {children}
      {isHovering && text && (
        <span className="tooltip-bubble" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}

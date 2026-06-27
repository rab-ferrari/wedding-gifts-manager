import { useInlineSvg } from "../hooks/useInlineSvg";

/**
 * Renders an SVG file's markup inline (see useInlineSvg for why), so the
 * icon can inherit `color` from CSS via `currentColor` fills/strokes in
 * the source SVG files. Falls back to rendering nothing visible (but
 * keeping layout space) if the icon fails to load, rather than a broken
 * image icon.
 */
export default function Icon({ src, className, title }) {
  const markup = useInlineSvg(src);
  const combinedClassName = ["icon", className].filter(Boolean).join(" ");

  return (
    <span
      className={combinedClassName}
      role={title ? "img" : "presentation"}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : "true"}
      dangerouslySetInnerHTML={{ __html: markup || "" }}
    />
  );
}

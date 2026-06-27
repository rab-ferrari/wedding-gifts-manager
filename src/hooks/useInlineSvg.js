import { useEffect, useState } from "react";

/**
 * Fetches the raw markup of an SVG file and returns it as a string so it
 * can be injected inline (via dangerouslySetInnerHTML) rather than used as
 * an <img src="...">. This is necessary because SVGs loaded through <img>
 * are treated as opaque raster content by the browser -- they ignore CSS
 * `color` and any `fill="currentColor"` inside the file is locked to
 * whatever the file's own default is. Inlining the markup keeps it as
 * real DOM, so currentColor resolves against our theme and icons can
 * change color on hover/active states without needing multiple image
 * files per icon.
 *
 * Returns null while loading or if the fetch fails (callers should
 * render a fallback/empty state in that case).
 */
export function useInlineSvg(src) {
  const [markup, setMarkup] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setMarkup(null);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load icon: ${src}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setMarkup(text);
      })
      .catch(() => {
        if (!cancelled) setMarkup(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return markup;
}

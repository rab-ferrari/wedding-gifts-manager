import { useEffect, useState } from "react";

/**
 * Loads gifts.json once. Scoped as a page-local hook (rather than added to
 * the app-wide SiteDataContext) since only the Gifts page needs this data.
 */
export function useGifts() {
  const [gifts, setGifts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/assets/gifts.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load gifts.json");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setGifts(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { gifts, isLoading: !error && gifts === null, error };
}

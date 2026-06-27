import { createContext, useContext, useEffect, useState } from "react";

const SiteDataContext = createContext(null);

/**
 * Loads the site-wide static JSON content (interface texts and external
 * links) once at app start and makes it available to any component via
 * useSiteData(). Both files live in /public/assets so they're fetched as
 * plain static files -- no bundling needed, and non-technical collaborators
 * can edit them without touching the React code.
 */
export function SiteDataProvider({ children }) {
  const [texts, setTexts] = useState(null);
  const [links, setLinks] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/assets/texts.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load texts.json");
        return r.json();
      }),
      fetch("/assets/links.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load links.json");
        return r.json();
      }),
    ])
      .then(([textsData, linksData]) => {
        setTexts(textsData);
        setLinks(linksData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const isLoading = !error && (texts === null || links === null);

  return (
    <SiteDataContext.Provider value={{ texts, links, isLoading, error }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) {
    throw new Error("useSiteData must be used within a SiteDataProvider");
  }
  return ctx;
}

/**
 * Convenience accessor for a single text key, with a visible fallback
 * (rather than a blank string) if the key is missing -- makes content
 * gaps obvious during development instead of silently rendering empty.
 */
export function useText(key) {
  const { texts } = useSiteData();
  if (!texts) return "";
  return texts[key] ?? `[[missing text: ${key}]]`;
}

import Icon from "./Icon";
import { useSiteData } from "../context/SiteDataContext";
import "../styles/navbar.css";

const LINK_ITEMS = [
  { key: "maps", icon: "/assets/icons/maps.svg", labelKey: "maps" },
  { key: "whatsapp", icon: "/assets/icons/whatsapp.svg", labelKey: "whatsapp" },
  { key: "github", icon: "/assets/icons/github.svg", labelKey: "github" },
];

/**
 * Bottom bar holding external links (maps, whatsapp, github). Visually
 * matches the top NavBar (same .nav-bar foundation, icon size, and
 * inter-item spacing via .nav-bar__inner) but is a distinct component
 * because its items are plain external links: icon-only, no text label,
 * and no "active route" concept (NavLink's isActive doesn't apply here).
 *
 * Reads its own data via useSiteData() (mirroring how NavBar reads texts
 * via useText()), so it's a self-contained, site-wide component rendered
 * once from Layout.jsx rather than needing each page to pass links in.
 */
export default function LinkBar() {
  const { links, isLoading } = useSiteData();

  if (isLoading) {
    return null;
  }

  return (
    <nav className="nav-bar nav-bar--bottom" aria-label="Links externos">
      <div className="nav-bar__inner">
        {LINK_ITEMS.map(({ key, icon, labelKey }) => (
          <a
            key={key}
            className="nav-bar__link"
            href={links[labelKey]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labelKey}
          >
            <Icon src={icon} className="nav-bar__icon" title={labelKey} />
          </a>
        ))}
      </div>
    </nav>
  );
}

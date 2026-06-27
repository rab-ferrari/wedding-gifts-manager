import { NavLink } from "react-router-dom";
import Icon from "./Icon";
import { useText } from "../context/SiteDataContext";
import "../styles/navbar.css";

const NAV_ITEMS = [
  { to: "/", icon: "assets/icons/home.svg", labelKey: "nav_home" },
  { to: "/gifts", icon: "assets/icons/gift.svg", labelKey: "nav_gifts" },
  { to: "/about", icon: "assets/icons/about.svg", labelKey: "nav_about" },
];

function NavItem({ to, icon, labelKey }) {
  const label = useText(labelKey);
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        "nav-bar__item" + (isActive ? " is-active" : "")
      }
    >
      <Icon src={icon} className="nav-bar__icon" title={label} />
      <span className="nav-bar__label">{label}</span>
    </NavLink>
  );
}

export default function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Navegação principal">
      <div className="nav-bar__inner">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}

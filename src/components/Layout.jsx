import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import LinkBar from "./LinkBar";

export default function Layout() {
  return (
    <>
      <NavBar />
      {/* main is a plain block (not flex) so it doesn't impose
          flex-stretch sizing on whatever page Outlet renders --
          that stretch was silently collapsing/inflating page
          content's own height calculations (verified via rendered
          layout testing). main is simply "the space between the
          top NavBar and bottom LinkBar," scrollable on its own if
          a page's content (e.g. the future Gifts list) is taller
          than the available space; pages like Home and About
          instead fill it exactly with no scroll, via their own
          height: 100% (see home.css / about.css). */}
      <main style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <Outlet />
      </main>
      <LinkBar />
    </>
  );
}

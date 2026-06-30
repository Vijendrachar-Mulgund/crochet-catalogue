// Layout — app shell shared by every route: top bar + the routed view.
// Rendered inside RouterProvider, so it (and the Header) can use router hooks.
import { Outlet } from "react-router";
import { Header } from "./Header";

export function Layout() {
  return (
    <>
      <div id="app">
        <Header />
        <main id="main" className="main">
          <Outlet />
        </main>
      </div>

      {/* Print surface — filled by the share module, visible only when printing. */}
      <div id="print-area" />
    </>
  );
}

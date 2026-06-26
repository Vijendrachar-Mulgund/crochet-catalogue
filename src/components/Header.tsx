import { useLocation, useNavigate } from "react-router";
import logoMark from "../assets/logo-mark.svg";

const NAV: { label: string; path: string }[] = [
  { label: "Catalogue", path: "/" },
  { label: "Share", path: "/share" },
  { label: "Settings", path: "/settings" },
];

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src={logoMark} alt="" />
        <span className="brand-text">Charming Yarns</span>
      </div>
      <nav className="nav">
        {NAV.map((n) => (
          <button
            key={n.path}
            className={"nav-btn" + (pathname === n.path ? " active" : "")}
            onClick={() => navigate(n.path)}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

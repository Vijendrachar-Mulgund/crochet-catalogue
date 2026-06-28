import { useLocation, useNavigate } from "react-router";
import logoMark from "../assets/logo-mark.svg";
import profileImage from "../assets/profile.png";

const NAV: { label: string; path: string }[] = [
  { label: "Catalogue", path: "/" },
  { label: "Share", path: "/share" },
];

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleOnClickProfileImage = () => {
    navigate("/settings");
  };

  const handleOnClickLogoImage = () => {
    navigate("/");
  };

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src={logoMark} alt="charming yarns" onClick={handleOnClickLogoImage} />
      </div>
      <div className="brand">
        <img className="brand-mark" src={profileImage} alt="profile image" onClick={handleOnClickProfileImage} />
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

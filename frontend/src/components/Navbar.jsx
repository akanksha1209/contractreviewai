import { Link, NavLink, useNavigate } from "react-router-dom";
import { isLoggedIn, getEmail, clearAuth } from "../auth";
import { useEffect, useState } from "react";

function Glyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </svg>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(getEmail());
  const [logged, setLogged] = useState(isLoggedIn());

  useEffect(() => {
    const sync = () => {
      setEmail(getEmail());
      setLogged(isLoggedIn());
    };
    window.addEventListener("storage", sync);
    const interval = setInterval(sync, 500);
    return () => {
      window.removeEventListener("storage", sync);
      clearInterval(interval);
    };
  }, []);

  const logout = () => {
    clearAuth();
    setEmail("");
    setLogged(false);
    navigate("/");
  };

  const linkCls = ({ isActive }) =>
    `px-2.5 py-1.5 rounded-md text-sm transition-colors ${
      isActive
        ? "text-paper-100 bg-ink-800"
        : "text-paper-300 hover:text-paper-100 hover:bg-ink-800"
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/95 backdrop-blur supports-[backdrop-filter]:bg-ink-950/80">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <Glyph />
            <span className="text-sm font-semibold tracking-tight text-paper-100">
              Contract Review
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={linkCls}>
              Scan
            </NavLink>
            <NavLink to="/documents" className={linkCls}>
              Documents
            </NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {logged ? (
            <>
              <span className="hidden sm:inline text-xxs font-mono text-paper-400 px-2 py-1 rounded bg-ink-800 border border-ink-700">
                {email}
              </span>
              <button onClick={logout} className="btn-ghost">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

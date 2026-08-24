import {
  NavLink,
  Outlet
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const links = [
  {
    to: "/",
    label: "Overview",
    icon: "⌂"
  },
  {
    to: "/orders",
    label: "Orders",
    icon: "▤"
  },
  {
    to: "/orders/new",
    label: "New delivery",
    icon: "+"
  }
];

export default function Layout() {

  const {
    user,
    logout
  } = useAuth();

  const roleLinks =
    user?.role === "AGENT"
      ? [
          {
            to: "/agent",
            label: "Agent desk",
            icon: "◉"
          }
        ]
      : user?.role === "ADMIN"
        ? [
            {
              to: "/admin",
              label: "Operations",
              icon: "◈"
            }
          ]
        : [];

  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            LM
          </div>

          <div>
            <strong>
              LAST-MILE
            </strong>

            <span>
              delivery console
            </span>
          </div>

        </div>

        <nav className="nav">

          {[...links, ...roleLinks].map(
            (link) => (

              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
              >

                <span className="nav-icon">
                  {link.icon}
                </span>

                {link.label}

              </NavLink>

            )
          )}

        </nav>

        <div className="sidebar-bottom">

          <div className="user-card">

            <div className="avatar">
              {(user?.name || "U")
                .slice(0, 1)
                .toUpperCase()}
            </div>

            <div className="user-meta">

              <strong>
                {user?.name || "User"}
              </strong>

              <span>
                {user?.role || "CUSTOMER"}
              </span>

            </div>

          </div>

          <button
            className="ghost-button full"
            onClick={logout}
          >
            Sign out
          </button>

        </div>

      </aside>

      <main className="main-content">

        <header className="topbar">

          <div>

            <div className="eyebrow">
              DISPATCH / LIVE CONSOLE
            </div>

            <div className="topbar-title">
              Last-mile operations
            </div>

          </div>

          <div className="connection">

            <span className="pulse" />

            API READY

          </div>

        </header>

        <div className="page-content">
          <Outlet />
        </div>

      </main>

    </div>
  );
}
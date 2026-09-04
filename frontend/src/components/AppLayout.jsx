import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = [
  { to: '/', label: 'Dashboard', icon: 'D', end: true },
  { to: '/schedules', label: 'Schedules', icon: 'S' },
  { to: '/rooms', label: 'Rooms', icon: 'R' },
  { to: '/events', label: 'Events', icon: 'E' },
  { to: '/announcements', label: 'Announcements', icon: 'N' },
  { to: '/assignments', label: 'Assignments', icon: 'T' },
  { to: '/assistant', label: 'AI Assistant', icon: 'AI' },
]

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const activePage = navigation.find((item) =>
    item.end ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">C</span>
          <div>
            <strong>CampusOS</strong>
            <small>Academic Portal</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="live-dot" />
          Live campus data
        </div>
      </aside>

      {menuOpen && (
        <button
          className="menu-backdrop"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-button"
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              ☰
            </button>
            <div>
              <strong>{activePage?.label || 'CampusOS'}</strong>
              <small>Current university operations</small>
            </div>
          </div>
          <div className="profile-chip">
            <span className="profile-avatar">A</span>
            <span>Campus Admin</span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

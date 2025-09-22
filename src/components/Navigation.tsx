import { NavLink } from 'react-router-dom'

const routes = [
  { to: '/map', label: 'Map' },
  { to: '/run', label: 'Run' },
  { to: '/daily', label: 'Daily' },
  { to: '/boss/core', label: 'Boss' },
  { to: '/notice/sample', label: 'Notice Builder' },
  { to: '/practice', label: 'Practice' },
  { to: '/skills', label: 'Skills' },
  { to: '/admin', label: 'Admin' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
]

const Navigation = () => {
  return (
    <nav className="app-nav" aria-label="Primary">
      <ul>
        {routes.map((route) => (
          <li key={route.to}>
            <NavLink to={route.to} className={({ isActive }) => (isActive ? 'active' : undefined)}>
              {route.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navigation

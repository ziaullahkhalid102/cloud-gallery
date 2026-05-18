import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Cloud, Image, LayoutDashboard, BookOpen, Settings,
  LogOut, Sun, Moon, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navItems = [
    { to: '/gallery', icon: Image, label: 'Gallery' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/api-docs', icon: BookOpen, label: 'API Docs' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="layout">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Cloud size={28} className="logo-icon" />
          <span className="logo-text">CloudGallery</span>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            {user?.picture && <img src={user.picture} alt="" className="user-avatar" />}
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <div className="sidebar-actions">
            <button onClick={toggleTheme} className="icon-btn" title="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={handleLogout} className="icon-btn" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <main className="main-content">
        <header className="top-bar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="top-bar-right">
            <button onClick={toggleTheme} className="icon-btn desktop-only" title="Toggle theme">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

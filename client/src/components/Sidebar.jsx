import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const adminNav = [
  { to: '/dashboard',  icon: '📊', label: 'Dashboard' },
  { to: '/members',    icon: '👥', label: 'Members' },
  { to: '/plans',      icon: '📋', label: 'Plans' },
  { to: '/attendance', icon: '⏱️', label: 'Attendance' },
  { to: '/payments',   icon: '💳', label: 'Payments' },
];

const memberNav = [
  { to: '/portal',      icon: '🏠', label: 'Overview' },
  { to: '/my-payments', icon: '💳', label: 'Pay Membership' },
  { to: '/receipts',    icon: '📄', label: 'My Receipts' },
];

export default function Sidebar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNav : memberNav;

  const displayName = profile?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Brand Header with G Logo */}
      <div className="sidebar-header">
        <Logo size="sm" to={isAdmin ? '/dashboard' : '/portal'} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', padding: '6px 12px 10px' }}>
          {isAdmin ? 'Administration' : 'Member Portal'}
        </div>

        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar Footer with Theme Toggle & User Info */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemeToggle />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
            title="Sign out"
            style={{ fontSize: 13 }}
          >
            Sign out
          </button>
        </div>

        <div className="user-profile-badge" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
          <div className="user-avatar">{initials}</div>
          <div className="user-info" style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {isAdmin ? 'Administrator' : (profile?.member_code || 'Member')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Pages
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Members     from './pages/Members';
import Plans       from './pages/Plans';
import Attendance  from './pages/Attendance';
import Payments    from './pages/Payments';
import MemberPortal from './pages/MemberPortal';
import MyPayments  from './pages/MyPayments';
import Receipts    from './pages/Receipts';

// ── Protected layout ────────────────────────────────────────
function ProtectedLayout({ children, allowedRole }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/dashboard' : '/portal'} replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toast />
          <Routes>
            {/* Front Landing Page */}
            <Route path="/" element={<Landing />} />

            {/* Login */}
            <Route path="/login" element={<Login />} />

            {/* Admin routes */}
            <Route path="/dashboard" element={<ProtectedLayout allowedRole="admin"><Dashboard /></ProtectedLayout>} />
            <Route path="/members"   element={<ProtectedLayout allowedRole="admin"><Members /></ProtectedLayout>} />
            <Route path="/plans"     element={<ProtectedLayout allowedRole="admin"><Plans /></ProtectedLayout>} />
            <Route path="/attendance"element={<ProtectedLayout allowedRole="admin"><Attendance /></ProtectedLayout>} />
            <Route path="/payments"  element={<ProtectedLayout allowedRole="admin"><Payments /></ProtectedLayout>} />

            {/* Member routes */}
            <Route path="/portal"      element={<ProtectedLayout allowedRole="member"><MemberPortal /></ProtectedLayout>} />
            <Route path="/my-payments" element={<ProtectedLayout allowedRole="member"><MyPayments /></ProtectedLayout>} />
            <Route path="/receipts"    element={<ProtectedLayout allowedRole="member"><Receipts /></ProtectedLayout>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  const features = [
    {
      icon: '👥',
      title: 'Member Profile Management',
      desc: 'Complete directory of gym members with active plan tracking, contact information, profile photos, and membership expiration monitoring.',
    },
    {
      icon: '💳',
      title: 'Razorpay Payment Gateway',
      desc: 'Seamless India-ready checkout via Razorpay Orders API. Automatic HMAC-SHA256 signature verification and webhook reconciliation.',
    },
    {
      icon: '📄',
      title: 'Automated PDF Receipts & S3',
      desc: 'Server-side PDF invoices generated instantly via PDFKit. Uploaded to private AWS S3 buckets and downloaded securely via 60-minute presigned URLs.',
    },
    {
      icon: '⏱️',
      title: 'Daily Attendance Logging',
      desc: 'Quick 1-click member check-in and check-out tracking with timestamps, monthly presence history, and member analytics.',
    },
    {
      icon: '📋',
      title: 'Flexible Membership Plans',
      desc: 'Configure custom plans (Monthly, Quarterly, Semi-Annual, Elite) with duration, pricing, and feature access perks.',
    },
    {
      icon: '🛡️',
      title: 'Role-Based Cloud Security',
      desc: 'Secure JWT authentication with dedicated portals for Gym Admins and Gym Members. Built for enterprise AWS cloud deployment.',
    },
  ];

  const plans = [
    { name: 'Basic', duration: '1 Month', price: '₹999', features: ['Gym Floor Access', 'Locker Room', 'Basic Equipment'] },
    { name: 'Standard', duration: '3 Months', price: '₹2,499', features: ['All Basic Features', 'Cardio & Strength Zones', '1 Personal Training Session'] },
    { name: 'Premium', duration: '6 Months', price: '₹4,499', popular: true, features: ['Full Equipment Access', '5 Personal Training Sessions', 'Diet Consultation', 'Sauna Access'] },
    { name: 'Elite', duration: '12 Months', price: '₹7,999', features: ['All Gym & Spa Amenities', 'Unlimited Personal Training', 'Nutritionist Support', '2 Guest Passes'] },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      {/* ── Minimalist Landing Navbar ── */}
      <nav className="landing-navbar">
        <Logo size="md" to="/" />

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#architecture">Architecture</a>
          <a href="#plans">Plans</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />
          <Link to="/login" className="btn btn-primary btn-sm">
            Sign In →
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="landing-hero">
        <div className="landing-badge">
          <span>⚡</span> Cloud-Native Gym Management Platform
        </div>

        <h1 className="landing-title">
          Simple, minimalist operating system for modern gyms.
        </h1>

        <p className="landing-lead">
          Manage memberships, log daily attendance, process Razorpay payments, and generate automated AWS S3 PDF receipts — all in one clean, distraction-free interface.
        </p>

        <div className="landing-cta-group">
          <Link to="/login" className="btn btn-primary btn-lg">
            Access Dashboard
          </Link>
          <a href="#features" className="btn btn-secondary btn-lg">
            Explore Features
          </a>
        </div>
      </section>

      {/* ── Core Functions / Feature Grid ── */}
      <section id="features" className="landing-features-section">
        <div className="section-header">
          <div className="section-tag">System Capabilities</div>
          <h2 className="section-title">Everything you need to run your facility</h2>
          <p className="section-subtitle">
            Built from the ground up for high reliability, fast checkout flows, and seamless member engagement.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, idx) => (
            <div key={idx} className="feature-box">
              <div className="feature-icon-wrapper">
                <span>{f.icon}</span>
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cloud Architecture Banner ── */}
      <section id="architecture" style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div className="section-header" style={{ marginBottom: 24 }}>
          <div className="section-tag">Cloud Infrastructure</div>
          <h2 className="section-title">Production-Ready Architecture</h2>
          <p className="section-subtitle">Engineered on modern cloud services following AWS best practices.</p>
        </div>

        <div className="architecture-banner">
          <div>
            <div className="arch-item-icon">⚛️</div>
            <div className="arch-item-title">React & Vite</div>
            <div className="arch-item-sub">Fast, minimalist client with light/dark theming</div>
          </div>
          <div>
            <div className="arch-item-icon">🟩</div>
            <div className="arch-item-title">Node / Express</div>
            <div className="arch-item-sub">REST APIs, JWT Auth, PDFKit generation</div>
          </div>
          <div>
            <div className="arch-item-icon">🐬</div>
            <div className="arch-item-title">Amazon RDS MySQL</div>
            <div className="arch-item-sub">Relational database in private multi-AZ subnets</div>
          </div>
          <div>
            <div className="arch-item-icon">🪣</div>
            <div className="arch-item-title">Amazon S3</div>
            <div className="arch-item-sub">Private PDF storage & presigned downloads</div>
          </div>
          <div>
            <div className="arch-item-icon">💳</div>
            <div className="arch-item-title">Razorpay</div>
            <div className="arch-item-sub">Checkout, orders API, HMAC verification</div>
          </div>
        </div>
      </section>

      {/* ── Membership Plans Preview ── */}
      <section id="plans" className="landing-features-section">
        <div className="section-header">
          <div className="section-tag">Membership Tiers</div>
          <h2 className="section-title">Transparent pricing for every fitness goal</h2>
          <p className="section-subtitle">
            Members can browse, subscribe, and pay directly through their dedicated portal.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {plans.map((p, i) => (
            <div
              key={i}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                border: p.popular ? '2px solid var(--border-focus)' : '1px solid var(--border)',
              }}
            >
              {p.popular && (
                <span
                  className="badge badge-neutral"
                  style={{ position: 'absolute', top: 16, right: 16, fontSize: 11 }}
                >
                  Most Popular
                </span>
              )}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{p.name}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{p.duration}</div>
                <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>
                  {p.price}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                  {p.features.map((feat, fi) => (
                    <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span> {feat}
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/login" className={`btn ${p.popular ? 'btn-primary' : 'btn-secondary'} btn-full`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Minimalist Footer ── */}
      <footer className="landing-footer">
        <Logo size="sm" to="/" showSubtitle={false} />
        <div>Cloud Gym Management System &copy; {new Date().getFullYear()}</div>
      </footer>
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', to = '/', showSubtitle = true }) {
  const iconSizes = {
    sm: { box: 28, text: 16, sub: 10 },
    md: { box: 36, text: 20, sub: 11 },
    lg: { box: 48, text: 26, sub: 13 },
  };

  const current = iconSizes[size] || iconSizes.md;

  const content = (
    <div className="brand-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
      {/* Modern minimalist "G" Emblem */}
      <div
        className="brand-logo-icon"
        style={{
          width: current.box,
          height: current.box,
          borderRadius: Math.max(6, Math.floor(current.box * 0.26)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width={Math.floor(current.box * 0.65)}
          height={Math.floor(current.box * 0.65)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bold geometric minimalist "G" */}
          <path
            d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12H12V15.5H16.85C16.05 18.05 13.5 19.5 11 19.2C8.5 18.9 6.5 16.9 6.2 14.4C5.9 11.9 7.4 9.5 9.8 8.8C10.5 8.6 11.3 8.6 12 8.8C13.5 9.1 14.8 10 15.5 11.2L18.5 9.2C17.2 7.2 15 5.5 12 5.5"
            fill="currentColor"
          />
        </svg>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          className="brand-logo-text"
          style={{
            fontSize: current.text,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Gym<span className="brand-logo-accent">MS</span>
        </span>
        {showSubtitle && (
          <span
            className="brand-logo-sub"
            style={{
              fontSize: current.sub,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Management
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link>;
  }

  return content;
}

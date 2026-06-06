// ─── BottomNav ────────────────────────────────────────────────────────────────
// Three-tab navigation bar. Mobile-first: 44px+ touch targets, no hover states.

const TABS = [
  { id: "play",     icon: "✦",  label: "Play"     },
  { id: "sky",      icon: "✦",  label: "Sky"      },
  { id: "settings", icon: "⊙",  label: "Settings" },
];

export default function BottomNav({ active, onChange, starCount }) {
  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: "linear-gradient(to top, #020810ee, #020810cc)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: "1px solid #ffffff0a",
      display: "flex",
      zIndex: 200,
      // Safe area for notched phones
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              transition: "opacity .15s",
              opacity: isActive ? 1 : 0.45,
            }}
          >
            {/* Icon with optional star badge */}
            <div style={{ position: "relative" }}>
              <span style={{
                fontSize: tab.id === "sky" ? 18 : 16,
                color: isActive
                  ? (tab.id === "sky" ? "#ffcc44" : "#6bcbff")
                  : "#8899bb",
                transition: "color .2s",
                display: "block",
                lineHeight: 1,
              }}>
                {tab.id === "sky" ? "★" : tab.icon}
              </span>
              {/* Star count badge on Sky tab */}
              {tab.id === "sky" && starCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -5, right: -8,
                  background: "#ffcc44",
                  color: "#06080f",
                  fontSize: 9,
                  fontWeight: 800,
                  borderRadius: 8,
                  padding: "1px 4px",
                  lineHeight: 1.4,
                  minWidth: 14,
                  textAlign: "center",
                }}>
                  {starCount}
                </span>
              )}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#e2e8f0" : "#64748b",
              letterSpacing: "0.04em",
              fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
          }
          

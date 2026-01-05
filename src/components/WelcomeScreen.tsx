import { spacing, typography, borders, colors } from '../styles/designTokens'

interface WelcomeScreenProps {
  onScanProject: () => void
  loading?: boolean
}

export function WelcomeScreen({ onScanProject, loading }: WelcomeScreenProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--framer-color-bg)'
    }}>
      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        paddingBottom: '120px'
      }}>
        {/* App icon with animations */}
        <div style={{ marginBottom: '28px' }}>
          <AnimatedIcon />
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: '20px',
          fontWeight: typography.fontWeight.semibold,
          color: 'var(--framer-color-text)',
          margin: 0,
          marginBottom: spacing.sm,
          textAlign: 'center',
          lineHeight: 1.3,
          letterSpacing: '-0.02em'
        }}>
          Bandwidth Check
        </h1>

        {/* Description */}
        <p style={{
          fontSize: typography.fontSize.sm,
          color: 'var(--framer-color-text-secondary)',
          margin: 0,
          marginBottom: spacing.xl,
          textAlign: 'center',
          maxWidth: '240px',
          lineHeight: 1.5
        }}>
          Analyze your project's bandwidth usage and find optimization opportunities.
        </p>

        {/* USP Cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: '100%',
          maxWidth: '280px'
        }}>
          <ValueProp
            icon={<ChartIcon />}
            title="Usage estimates"
            description="Monthly bandwidth based on traffic"
          />
          <ValueProp
            icon={<ImageIcon />}
            title="Image insights"
            description="Find oversized assets to optimize"
          />
        </div>
      </div>

      {/* Sticky button container */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        background: 'linear-gradient(to top, var(--framer-color-bg) 60%, transparent)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={onScanProject}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: '280px',
            padding: '14px 20px',
            backgroundColor: colors.accent.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: borders.radius.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            boxShadow: '0 4px 12px rgba(0, 139, 232, 0.25)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#0080D4'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 139, 232, 0.35)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.accent.primary
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 139, 232, 0.25)'
            }
          }}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              Scanning...
            </>
          ) : (
            'Scan project'
          )}
        </button>
      </div>
    </div>
  )
}

// Animated app icon with rotating internal shapes
function AnimatedIcon() {
  return (
    <>
      <style>
        {`
          @keyframes iconFloat {
            0%, 100% {
              transform: translateY(0);
              filter: drop-shadow(0 8px 20px rgba(0, 139, 232, 0.25));
            }
            50% {
              transform: translateY(-8px);
              filter: drop-shadow(0 16px 28px rgba(0, 139, 232, 0.2));
            }
          }
          @keyframes breatheTopLeft {
            0%, 25% { transform: translate(0, 0); }
            45%, 75% { transform: translate(-6px, -6px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes breatheBottomRight {
            0%, 25% { transform: translate(0, 0); }
            45%, 75% { transform: translate(6px, 6px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes breatheBottomLeft {
            0%, 25% { transform: translate(0, 0); }
            45%, 75% { transform: translate(-6px, 6px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes breatheTopRight {
            0%, 25% { transform: translate(0, 0); }
            45%, 75% { transform: translate(6px, -6px); }
            100% { transform: translate(0, 0); }
          }
        `}
      </style>
      <svg
        width="88"
        height="88"
        viewBox="0 0 197 197"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'iconFloat 5s ease-in-out infinite',
          borderRadius: '22px'
        }}
      >
        <defs>
          <radialGradient id="iconGradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(90.7857 27.7222) rotate(66.3599) scale(279.962)">
            <stop stopColor="#008BE8"/>
            <stop offset="1" stopColor="#84C8F5"/>
          </radialGradient>
          <clipPath id="iconClip">
            <rect width="197" height="197" rx="44" fill="white"/>
          </clipPath>
        </defs>
        <g clipPath="url(#iconClip)">
          {/* Background */}
          <rect x="-16" y="-17" width="230" height="230" rx="54.7619" fill="url(#iconGradient)"/>

          {/* Top-left circle */}
          <g style={{ animation: 'breatheTopLeft 5s ease-in-out infinite' }}>
            <circle cx="63.7809" cy="62.7809" r="32.7809" fill="white"/>
          </g>

          {/* Bottom-right circle */}
          <g style={{ animation: 'breatheBottomRight 5s ease-in-out infinite' }}>
            <circle cx="134.219" cy="133.219" r="32.7809" fill="white"/>
          </g>

          {/* Bottom-left rounded square */}
          <g style={{ animation: 'breatheBottomLeft 5s ease-in-out infinite' }}>
            <path d="M31 100.438H96.5618V131.322C96.5618 150.474 81.0362 166 61.8845 166H31V100.438Z" fill="white"/>
          </g>

          {/* Top-right rounded square */}
          <g style={{ animation: 'breatheTopRight 5s ease-in-out infinite' }}>
            <path d="M101.438 64.6773C101.438 45.5256 116.964 30 136.116 30H167V95.5618H101.438V64.6773Z" fill="white"/>
          </g>
        </g>
      </svg>
    </>
  )
}

// Value proposition card
function ValueProp({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: 'var(--framer-color-bg-secondary)',
      borderRadius: borders.radius.sm,
      border: '1px solid var(--framer-color-divider)'
    }}>
      <div style={{
        color: colors.accent.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '20px',
        height: '20px',
        flexShrink: 0,
        marginTop: '1px'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.semibold,
          color: 'var(--framer-color-text)',
          marginBottom: '2px'
        }}>
          {title}
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: 'var(--framer-color-text-secondary)',
          lineHeight: 1.4
        }}>
          {description}
        </div>
      </div>
    </div>
  )
}

// Loading spinner
function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <style>
        {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
      </style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="10"
      />
    </svg>
  )
}

// Icons
function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  )
}

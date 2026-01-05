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
        paddingBottom: '100px',
        overflowY: 'auto'
      }}>
        {/* Hero illustration - abstract visualization */}
        <div style={{
          width: '100%',
          maxWidth: '240px',
          marginBottom: spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          {/* Global animation styles */}
          <style>
            {`
              @keyframes barBreath {
                0%, 100% {
                  transform: scaleY(1);
                }
                50% {
                  transform: scaleY(0.8);
                }
              }
            `}
          </style>

          {/* Animated bars representing bandwidth analysis */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '4px',
            height: '64px',
            padding: '14px 16px',
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderRadius: '16px'
          }}>
            <Bar height={18} color="#93C5FD" delay={0} />
            <Bar height={32} color="#60A5FA" delay={0.12} />
            <Bar height={24} color="#3B82F6" delay={0.24} />
            <Bar height={40} color="#2563EB" delay={0.36} />
            <Bar height={28} color="#3B82F6" delay={0.48} />
            <Bar height={36} color="#60A5FA" delay={0.6} />
            <Bar height={20} color="#93C5FD" delay={0.72} />
          </div>

        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: 'var(--framer-color-text)',
          margin: 0,
          marginBottom: spacing.sm,
          textAlign: 'center',
          lineHeight: typography.lineHeight.tight
        }}>
          Estimate bandwidth usage
        </h1>

        {/* Description */}
        <p style={{
          fontSize: typography.fontSize.sm,
          color: 'var(--framer-color-text-secondary)',
          margin: 0,
          marginBottom: spacing.xl,
          textAlign: 'center',
          maxWidth: '260px',
          lineHeight: typography.lineHeight.relaxed
        }}>
          Scan your project to see estimated monthly bandwidth and get image optimization tips.
        </p>

        {/* Value props */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: '100%',
          maxWidth: '260px'
        }}>
          <ValueProp
            icon={<CalculatorIcon />}
            title="Monthly estimates"
            description="Based on page weight and traffic"
          />
          <ValueProp
            icon={<ImageIcon />}
            title="Image optimization"
            description="Find oversized images to compress"
          />
        </div>

        {/* Future paywall/limit placeholder */}
        <div style={{ marginTop: spacing.xl }} />
      </div>

      {/* Sticky button container */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        background: 'linear-gradient(to top, var(--framer-color-bg) 70%, transparent)',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button
          onClick={onScanProject}
          disabled={loading}
          style={{
            width: '100%',
            maxWidth: '260px',
            padding: `14px ${spacing.lg}`,
            backgroundColor: colors.accent.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: borders.radius.sm,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            boxShadow: '0 2px 8px rgba(0, 153, 255, 0.3)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#0088E6'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 153, 255, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.accent.primary
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 153, 255, 0.3)'
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

// Animated bar for hero visualization
function Bar({ height, color, delay }: { height: number; color: string; delay: number }) {
  return (
    <div
      style={{
        width: '8px',
        height: `${height}px`,
        backgroundColor: color,
        borderRadius: '4px',
        transformOrigin: 'bottom',
        animation: `barBreath 4s ease-in-out ${delay}s infinite`
      }}
    />
  )
}

// Value proposition item
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
function CalculatorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="8" y2="10.01" />
      <line x1="12" y1="10" x2="12" y2="10.01" />
      <line x1="16" y1="10" x2="16" y2="10.01" />
      <line x1="8" y1="14" x2="8" y2="14.01" />
      <line x1="12" y1="14" x2="12" y2="14.01" />
      <line x1="16" y1="14" x2="16" y2="14.01" />
      <line x1="8" y1="18" x2="8" y2="18.01" />
      <line x1="12" y1="18" x2="16" y2="18" />
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

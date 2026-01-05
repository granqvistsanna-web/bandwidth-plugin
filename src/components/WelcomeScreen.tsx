import { spacing, typography, borders, surfaces, framerColors, colors } from '../styles/designTokens'

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
      {/* Main content area - scrollable */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        paddingBottom: '100px', // Space for sticky button
        overflowY: 'auto'
      }}>
        {/* Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: borders.radius.lg,
          backgroundColor: surfaces.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg
        }}>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.accent.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: framerColors.text,
          margin: 0,
          marginBottom: spacing.sm,
          textAlign: 'center',
          lineHeight: typography.lineHeight.tight
        }}>
          Usage estimates made clear
        </h1>

        {/* Description */}
        <p style={{
          fontSize: typography.fontSize.sm,
          color: framerColors.textSecondary,
          margin: 0,
          marginBottom: spacing.xl,
          textAlign: 'center',
          maxWidth: '320px',
          lineHeight: typography.lineHeight.relaxed
        }}>
          Estimate your website's bandwidth usage based on page weight and traffic. Compare light, medium, and heavy pages against real benchmarks to avoid surprises.
        </p>

        {/* Feature highlights */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          width: '100%',
          maxWidth: '280px'
        }}>
          <FeatureItem
            icon={<ScanIcon />}
            text="Scan all pages and assets"
          />
          <FeatureItem
            icon={<ChartIcon />}
            text="See bandwidth by device type"
          />
          <FeatureItem
            icon={<OptimizeIcon />}
            text="Get optimization recommendations"
          />
        </div>

        {/* Future paywall/limit notice placeholder */}
        {/* This div can be used to insert scan limits or upgrade prompts */}
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
            maxWidth: '280px',
            padding: `${spacing.md} ${spacing.lg}`,
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
            gap: spacing.sm
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#0088E6'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = colors.accent.primary
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

// Feature item component
function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: spacing.sm,
      padding: `${spacing.sm} ${spacing.md}`,
      backgroundColor: surfaces.secondary,
      borderRadius: borders.radius.sm
    }}>
      <div style={{
        color: framerColors.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        flexShrink: 0
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: typography.fontSize.xs,
        color: framerColors.text,
        fontWeight: typography.fontWeight.medium
      }}>
        {text}
      </span>
    </div>
  )
}

// Small loading spinner for button
function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        animation: 'spin 1s linear infinite'
      }}
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
function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  )
}

function OptimizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
    </svg>
  )
}

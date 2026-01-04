import { spacing, typography, borders, surfaces, backgrounds, framerColors } from '../../styles/designTokens'
import { useTheme, type ThemeMode } from '../../hooks/useTheme'
import { useSettings } from '../../hooks/useSettings'
import { StatusIndicator } from '../common/StatusIndicator'

interface SettingsPanelProps {
  lastScanned?: Date | null
  loading?: boolean
  onSettingsChange?: () => void
}

export function SettingsPanel({ lastScanned, loading, onSettingsChange }: SettingsPanelProps) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { includeFramerOptimization, toggleFramerOptimization } = useSettings()

  const handleOptimizationToggle = () => {
    toggleFramerOptimization()
    // Notify parent to trigger rescan
    onSettingsChange?.()
  }

  const themeOptions: { value: ThemeMode; label: string; icon: JSX.Element }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    },
    {
      value: 'system',
      label: 'System',
      icon: (
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    }
  ]

  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: backgrounds.page,
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm
        }}>
          <h1 style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            margin: 0,
            lineHeight: typography.lineHeight.tight
          }}>
            Settings
          </h1>
          <StatusIndicator
            lastScanned={lastScanned}
            loading={loading}
          />
        </div>

      {/* Theme Selection */}
      <div>
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              marginBottom: '2px'
            }}>
              Theme
            </div>
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                lineHeight: '1.4'
              }}
            >
              Choose your preferred appearance
            </p>
          </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
          {themeOptions.map((option) => {
            const isSelected = theme === option.value
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: `${spacing.md} ${spacing.sm}`,
                  minHeight: '48px',
                  backgroundColor: isSelected ? 'var(--surface-tertiary)' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                  borderRadius: borders.radius.sm,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left' as const,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)'
                    e.currentTarget.style.borderColor = 'var(--border-default)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  }
                }}
              >
                <div
                  style={{
                    color: isSelected ? framerColors.text : framerColors.textSecondary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '14px',
                    height: '14px'
                  }}
                >
                  {option.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: isSelected ? typography.fontWeight.semibold : typography.fontWeight.medium,
                      color: framerColors.text,
                      marginBottom: '1px',
                    }}
                  >
                    {option.label}
                  </div>
                  {option.value === 'system' && (
                    <div
                      style={{
                        fontSize: typography.fontSize.xs,
                        color: framerColors.textSecondary,
                        lineHeight: '1.3'
                      }}
                    >
                      Currently: {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: framerColors.text }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
        </div>
      </div>

      {/* Estimation Settings */}
      <div>
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              marginBottom: '2px'
            }}>
              Estimation
            </div>
            <p
              style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                lineHeight: '1.4',
                margin: 0
              }}
            >
              Configure how bandwidth is calculated
            </p>
          </div>

          <button
            onClick={handleOptimizationToggle}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.sm,
              padding: `${spacing.md} ${spacing.sm}`,
              width: '100%',
              backgroundColor: includeFramerOptimization ? 'var(--surface-tertiary)' : 'transparent',
              border: `1px solid ${includeFramerOptimization ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
              borderRadius: borders.radius.sm,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left' as const,
            }}
            onMouseEnter={(e) => {
              if (!includeFramerOptimization) {
                e.currentTarget.style.backgroundColor = 'var(--surface-tertiary)'
                e.currentTarget.style.borderColor = 'var(--border-default)'
              }
            }}
            onMouseLeave={(e) => {
              if (!includeFramerOptimization) {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border-subtle)'
              }
            }}
          >
            {/* Checkbox */}
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                border: `1.5px solid ${includeFramerOptimization ? 'var(--framer-color-tint)' : 'var(--border-default)'}`,
                backgroundColor: includeFramerOptimization ? 'var(--framer-color-tint)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '1px'
              }}
            >
              {includeFramerOptimization && (
                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: framerColors.text,
                  marginBottom: '4px',
                }}
              >
                Include Framer image optimization
              </div>
              <div
                style={{
                  fontSize: typography.fontSize.xs,
                  color: framerColors.textSecondary,
                  lineHeight: '1.4'
                }}
              >
                Framer automatically converts images to WebP/AVIF when publishing. Enable for realistic estimates, disable to see source file sizes.
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* About Section */}
      <div>
        <div
          style={{
            padding: spacing.lg,
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
          }}
        >
          <div style={{ marginBottom: spacing.sm }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              marginBottom: '2px'
            }}>
              Bandwidth Check Plugin
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
            }}>
              Analyze and optimize your Framer site's performance
            </div>
          </div>

          <div style={{
            paddingTop: spacing.sm,
            borderTop: '1px solid var(--framer-color-divider)',
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.xs
          }}>
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-tint)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: spacing.xs,
                marginLeft: `-${spacing.xs}`,
                borderRadius: borders.radius.sm,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Report an issue
            </a>
            <a
              href="https://www.framer.com/learn/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-tint)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
                padding: spacing.xs,
                marginLeft: `-${spacing.xs}`,
                borderRadius: borders.radius.sm,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Framer documentation
            </a>
          </div>
        </div>
      </div>

      </div>
    </div>
  )
}

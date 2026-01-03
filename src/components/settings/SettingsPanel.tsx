import { spacing, typography } from '../../styles/designTokens'

interface SettingsPanelProps {
  // Settings panel props - can be expanded later
}

export function SettingsPanel({}: SettingsPanelProps) {
  return (
    <div className="p-6" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
      <div style={{ marginBottom: spacing.xl }}>
        <h2
          style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.xs,
          }}
        >
          Settings
        </h2>
        <p
          style={{
            fontSize: typography.fontSize.sm,
            color: 'var(--framer-color-text-secondary)',
          }}
        >
          Configure plugin preferences and analysis options.
        </p>
      </div>

      <div
        className="rounded-lg p-6 border"
        style={{
          backgroundColor: '#FAF9F8',
          borderColor: 'var(--framer-color-divider)',
        }}
      >
        <div className="text-center py-8">
          <svg 
            className="w-12 h-12 mx-auto mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            style={{ color: 'var(--framer-color-text-tertiary)' }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
            />
          </svg>
          <h3
            style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)',
              marginBottom: spacing.xs,
            }}
          >
            No Settings Available
          </h3>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text-secondary)',
              maxWidth: '400px',
              margin: '0 auto',
            }}
          >
            Settings will be available in a future update. The plugin currently uses default analysis settings optimized for most projects.
          </p>
        </div>
      </div>
    </div>
  )
}

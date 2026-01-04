import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'
import { spacing, typography, borders, colors } from '../../styles/designTokens'
import { CollapsibleSection } from '../overview/CollapsibleSection'
import { formatTimestamp } from '../../utils/formatTimestamp'

interface RecommendationsPanelProps {
  analysis: ProjectAnalysis
  selectedPageId?: string | 'all' | null
  ignoredRecommendationIds: Set<string>
  onIgnoreRecommendation: (id: string) => void
  onUnignoreRecommendation: (id: string) => void
  lastScanned?: Date | null
  loading?: boolean
}

export function RecommendationsPanel({ 
  analysis, 
  ignoredRecommendationIds, 
  onIgnoreRecommendation, 
  onUnignoreRecommendation,
  lastScanned,
  loading
}: RecommendationsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Safety check: ensure analysis exists
  if (!analysis) {
    return (
      <div style={{ padding: spacing.lg, backgroundColor: 'var(--framer-color-bg)' }}>
        <div style={{ 
          textAlign: 'center',
          padding: spacing.xl,
          color: 'var(--framer-color-text-secondary)'
        }}>
          No analysis data available. Please run a scan first.
        </div>
      </div>
    )
  }

  try {
    // Always use all recommendations, sorted globally by impact (potentialSavings)
    // This ensures recommendations are ranked by impact regardless of page filter
    // The page filter in the UI is informational only - recommendations show all pages
    const allRecommendations = analysis.allRecommendations || []
  
  // Stable sort: ensure consistent ordering across renders
  const sortedRecommendations = [...allRecommendations].sort((a, b) => {
    // Primary sort: by potential savings (descending)
    if (b.potentialSavings !== a.potentialSavings) {
      return b.potentialSavings - a.potentialSavings
    }
    // Secondary sort: by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) {
      return priorityDiff
    }
    // Tertiary sort: by node name (alphabetical) for stable ordering
    const nameA = a.nodeName || ''
    const nameB = b.nodeName || ''
    if (nameA !== nameB) {
      return nameA.localeCompare(nameB)
    }
    // Final sort: by node ID for complete stability
    return (a.nodeId || a.id).localeCompare(b.nodeId || b.id)
  })

  // Separate ignored and active recommendations
  const activeRecommendations = sortedRecommendations.filter(rec => !ignoredRecommendationIds.has(rec.id))
  const ignoredRecommendations = sortedRecommendations.filter(rec => ignoredRecommendationIds.has(rec.id))

  const filteredRecommendations = filter === 'all'
    ? activeRecommendations
    : activeRecommendations.filter(rec => rec.priority === filter)

  const totalSavings = calculateTotalSavings(activeRecommendations)

    const priorityCounts = {
      high: activeRecommendations.filter(r => r.priority === 'high').length,
      medium: activeRecommendations.filter(r => r.priority === 'medium').length,
      low: activeRecommendations.filter(r => r.priority === 'low').length
    }

    return (
    <div style={{ padding: spacing.lg, backgroundColor: 'var(--framer-color-bg)', minHeight: '100vh' }}>
      {/* Compact Header */}
      <div style={{
        marginBottom: spacing.xl
      }}>
        <h1 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: colors.almostBlack,
          margin: 0,
          marginBottom: spacing.xs,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: '-0.02em'
        }}>
          Recommendations
        </h1>
        {lastScanned && (
          <div style={{
            fontSize: typography.fontSize.xs,
            color: colors.warmGray[500]
          }}>
            {loading ? 'Analyzing...' : `Scanned ${formatTimestamp(lastScanned)}`}
          </div>
        )}
      </div>

      {/* Enhanced Savings Card */}
      {sortedRecommendations.length > 0 && (
        <div
          style={{
            padding: spacing.lg,
            marginBottom: spacing.lg,
            backgroundColor: colors.white,
            borderRadius: borders.radius.lg,
            border: `1px solid ${colors.warmGray[200]}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: typography.fontWeight.bold,
              color: colors.almostBlack,
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {formatBytes(totalSavings)}
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.warmGray[500],
              fontWeight: typography.fontWeight.medium
            }}>
              can be saved
            </div>
          </div>

          {/* Compact Priority Breakdown */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            fontSize: typography.fontSize.xs,
            color: colors.warmGray[600]
          }}>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.high} high
            </span>
            <span style={{ color: colors.warmGray[400] }}>·</span>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.medium} medium
            </span>
            <span style={{ color: colors.warmGray[400] }}>·</span>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.low} low
            </span>
          </div>
        </div>
      )}

      {/* Compact Filter Dropdown */}
      <div style={{
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm
      }}>
        <label style={{
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: colors.warmGray[600]
        }}>
          Show:
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
          style={{
            padding: `${spacing.xs} ${spacing.sm}`,
            paddingRight: spacing.lg,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.almostBlack,
            backgroundColor: colors.white,
            border: `1px solid ${colors.warmGray[200]}`,
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            minWidth: '140px'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.warmGray[400]
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 0, 0, 0.05)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.warmGray[200]
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <option value="all">All ({activeRecommendations.length})</option>
          <option value="high">High priority ({priorityCounts.high})</option>
          <option value="medium">Medium priority ({priorityCounts.medium})</option>
          <option value="low">Low priority ({priorityCounts.low})</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {filteredRecommendations.map(recommendation => (
          <RecommendationCard 
            key={recommendation.id} 
            recommendation={recommendation}
            allPages={(analysis.pages || []).map(p => ({ pageId: p.pageId, pageName: p.pageName }))}
            onIgnore={() => onIgnoreRecommendation(recommendation.id)}
          />
        ))}

        {/* Ignored Recommendations Section */}
        {ignoredRecommendations.length > 0 && (
          <CollapsibleSection
            title={`Ignored (${ignoredRecommendations.length})`}
            defaultCollapsed={true}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
              {ignoredRecommendations.map(recommendation => (
                <div key={recommendation.id} style={{ opacity: 0.7 }}>
                  <RecommendationCard 
                    recommendation={recommendation}
                    allPages={(analysis.pages || []).map(p => ({ pageId: p.pageId, pageName: p.pageName }))}
                    onIgnore={() => onUnignoreRecommendation(recommendation.id)}
                    isIgnored={true}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {filteredRecommendations.length === 0 && activeRecommendations.length > 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: `${spacing.xl} ${spacing.md}`
          }}>
            <div style={{ 
              fontSize: typography.fontSize.xl,
              marginBottom: spacing.md
            }}>🔍</div>
            <div style={{ 
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.sm,
              color: 'var(--framer-color-text)',
              fontSize: typography.fontSize.md
            }}>
              No {filter} Priority Recommendations
            </div>
            <div style={{ 
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text-secondary)'
            }}>
              Try selecting a different priority filter to see other recommendations.
            </div>
          </div>
        )}

        {activeRecommendations.length === 0 && (
          <div style={{ 
            textAlign: 'center',
            padding: `${spacing.xl} ${spacing.md}`,
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <div style={{ 
              fontSize: '48px',
              marginBottom: spacing.md
            }}>✓</div>
            <div style={{ 
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.lg,
              marginBottom: spacing.sm,
              color: 'var(--framer-color-text)'
            }}>
              Great! No Optimization Needed
            </div>
            <div style={{ 
              fontSize: typography.fontSize.sm,
              marginBottom: spacing.md,
              lineHeight: typography.lineHeight.relaxed,
              color: 'var(--framer-color-text-secondary)'
            }}>
              <p style={{ marginBottom: spacing.sm }}>Your assets are well-optimized.</p>
              <p style={{ 
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-tertiary)'
              }}>
                Your images are properly sized and formatted. All assets are under recommended thresholds and using efficient formats like WebP or AVIF.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    )
  } catch (error) {
    console.error('Error rendering RecommendationsPanel:', error)
    return (
      <div style={{ padding: spacing.lg, backgroundColor: 'var(--framer-color-bg)' }}>
        <div style={{ 
          textAlign: 'center',
          padding: spacing.xl,
          color: 'var(--framer-color-text)'
        }}>
          <div style={{ 
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            marginBottom: spacing.md
          }}>
            Error Loading Recommendations
          </div>
          <div style={{ 
            fontSize: typography.fontSize.sm,
            color: 'var(--framer-color-text-secondary)',
            marginBottom: spacing.md
          }}>
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </div>
          <div style={{ 
            fontSize: typography.fontSize.xs,
            color: 'var(--framer-color-text-tertiary)'
          }}>
            Please try rescanning your project.
          </div>
        </div>
      </div>
    )
  }
}

import { useState } from 'react'
import type { ProjectAnalysis } from '../../types/analysis'
import { RecommendationCard } from './RecommendationCard'
import { Pagination } from '../assets/Pagination'
import { formatBytes } from '../../utils/formatBytes'
import { calculateTotalSavings } from '../../services/recommendations'
import { spacing, typography, borders, backgrounds, surfaces, themeElevation, framerColors } from '../../styles/designTokens'
import { CollapsibleSection } from '../overview/CollapsibleSection'
import { StatusIndicator } from '../common/StatusIndicator'

const ITEMS_PER_PAGE = 20

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
  const [currentPage, setCurrentPage] = useState(1)

  // Safety check: ensure analysis exists
  if (!analysis) {
    return (
      <div style={{ padding: spacing.lg, backgroundColor: backgrounds.page }}>
        <div style={{ 
          textAlign: 'center',
          padding: spacing.xl,
          color: framerColors.textSecondary
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

  // Pagination
  const totalPages = Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE)
  const paginationStart = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedRecommendations = filteredRecommendations.slice(paginationStart, paginationStart + ITEMS_PER_PAGE)

  // Reset page when filter changes
  const handleFilterChange = (newFilter: 'all' | 'high' | 'medium' | 'low') => {
    setFilter(newFilter)
    setCurrentPage(1)
  }

  const totalSavings = calculateTotalSavings(activeRecommendations)

    const priorityCounts = {
      high: activeRecommendations.filter(r => r.priority === 'high').length,
      medium: activeRecommendations.filter(r => r.priority === 'medium').length,
      low: activeRecommendations.filter(r => r.priority === 'low').length
    }

    return (
    <div style={{ padding: spacing.lg, backgroundColor: backgrounds.page, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg
      }}>
        <h1 style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          margin: 0,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: typography.letterSpacing.tighter
        }}>
          Recommendations
        </h1>
        <StatusIndicator
          lastScanned={lastScanned}
          loading={loading}
        />
      </div>

      {/* Enhanced Savings Card */}
      {sortedRecommendations.length > 0 && (
        <div
          style={{
            padding: spacing.lg,
            marginBottom: spacing.md,
            backgroundColor: surfaces.secondary,
            borderRadius: borders.radius.lg,
            boxShadow: themeElevation.subtle
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: framerColors.text,
              lineHeight: typography.lineHeight.none,
              letterSpacing: typography.letterSpacing.tighter
            }}>
              {formatBytes(totalSavings)}
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
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
            color: framerColors.textSecondary
          }}>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.high} high
            </span>
            <span style={{ color: framerColors.textTertiary }}>·</span>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.medium} medium
            </span>
            <span style={{ color: framerColors.textTertiary }}>·</span>
            <span style={{ fontWeight: typography.fontWeight.medium }}>
              {priorityCounts.low} low
            </span>
          </div>
        </div>
      )}

      {/* Filter Dropdown */}
      <div style={{
        marginBottom: spacing.md,
        position: 'relative'
      }}>
        <select
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as 'all' | 'high' | 'medium' | 'low')}
          style={{
            width: '100%',
            padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            backgroundColor: filter !== 'all' ? surfaces.secondary : surfaces.primary,
            border: filter !== 'all' 
              ? `1px solid var(--framer-color-tint)` 
              : 'none',
            borderRadius: borders.radius.md,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            boxShadow: filter !== 'all' 
              ? `0 0 0 1px var(--framer-color-tint-dimmed)` 
              : 'none'
          }}
        >
          <option value="all">All ({activeRecommendations.length})</option>
          <option value="high">High priority ({priorityCounts.high})</option>
          <option value="medium">Medium priority ({priorityCounts.medium})</option>
          <option value="low">Low priority ({priorityCounts.low})</option>
        </select>
        {/* Chevron icon - always visible */}
        <svg
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          style={{
            position: 'absolute',
            right: spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: filter !== 'all' ? 'var(--framer-color-tint)' : framerColors.textSecondary,
            transition: 'color 0.15s ease'
          }}
        >
          <path
            d="M1 1L4 4L7 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {/* Active filter indicator dot - only when filter is active */}
        {filter !== 'all' && (
          <div style={{
            position: 'absolute',
            right: `calc(${spacing.md} + 12px)`, // Position to the left of chevron
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--framer-color-tint)',
              flexShrink: 0
            }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {paginatedRecommendations.map(recommendation => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            allPages={(analysis.pages || []).map(p => ({ pageId: p.pageId, pageName: p.pageName }))}
            onIgnore={() => onIgnoreRecommendation(recommendation.id)}
          />
        ))}

        {/* Pagination */}
        {filteredRecommendations.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRecommendations.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}

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
              marginBottom: spacing.md,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={framerColors.textTertiary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div style={{
              fontWeight: typography.fontWeight.semibold,
              marginBottom: spacing.sm,
              color: framerColors.text,
              fontSize: typography.fontSize.md
            }}>
              No {filter} Priority Recommendations
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: framerColors.textSecondary
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
              marginBottom: spacing.md,
              display: 'flex',
              justifyContent: 'center'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--status-success-solid)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div style={{
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.lg,
              marginBottom: spacing.sm,
              color: framerColors.text
            }}>
              No Optimization Needed
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              marginBottom: spacing.md,
              lineHeight: typography.lineHeight.relaxed,
              color: framerColors.textSecondary
            }}>
              <p style={{ marginBottom: spacing.sm }}>Your assets are well-optimized.</p>
              <p style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textTertiary
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
      <div style={{ padding: spacing.lg, backgroundColor: backgrounds.page }}>
        <div style={{ 
          textAlign: 'center',
          padding: spacing.xl,
          color: framerColors.text
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
            color: framerColors.textSecondary,
            marginBottom: spacing.md
          }}>
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </div>
          <div style={{ 
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary
          }}>
            Please try rescanning your project.
          </div>
        </div>
      </div>
    )
  }
}

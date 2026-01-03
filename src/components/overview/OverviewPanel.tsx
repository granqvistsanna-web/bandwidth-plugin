import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../../types/analysis'
import { formatBytes } from '../../utils/formatBytes'
import { BreakdownChart } from './BreakdownChart'
import { generateMarkdownReport, copyToClipboard, downloadJSON } from '../../utils/exportReport'
import { CMSAssetsNotice } from './CMSAssetsNotice'
import { debugLog } from '../../utils/debugLog'
import type { ManualCMSEstimate } from '../../hooks/useAnalysis'
import { CollapsibleSection } from './CollapsibleSection'
import { spacing, typography, borders, colors } from '../../styles/designTokens'
import { calculateLoadTime, formatLoadTime } from '../../utils/loadTime'

interface OverviewPanelProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
  onRescan?: () => void
  manualCMSEstimates?: ManualCMSEstimate[]
  addManualCMSEstimate?: (estimate: Omit<ManualCMSEstimate, 'id' | 'createdAt'>) => void
  updateManualCMSEstimate?: (id: string, estimate: Partial<Omit<ManualCMSEstimate, 'id' | 'createdAt'>>) => void
  removeManualCMSEstimate?: (id: string) => void
}

export function OverviewPanel({
  analysis,
  onNavigateToRecommendations,
  onRescan,
  manualCMSEstimates = [],
  removeManualCMSEstimate,
  addManualCMSEstimate,
  updateManualCMSEstimate
}: OverviewPanelProps) {

  const breakpointData = analysis.overallBreakpoints.desktop
  const recommendations = analysis.allRecommendations
  const pageCount = analysis.totalPages
  const customCode = analysis.publishedData?.customCode

  const handleExportMarkdown = async () => {
    try {
      const markdown = generateMarkdownReport(analysis)
      const success = await copyToClipboard(markdown)
      if (success) {
        framer.notify('Markdown report copied to clipboard!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to copy report', { variant: 'error' })
      }
    } catch (error) {
      debugLog.error('Export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  const handleExportJSON = async () => {
    try {
      const success = await downloadJSON(analysis)
      if (success) {
        framer.notify('JSON report downloaded!', { variant: 'success', durationMs: 2000 })
      } else {
        framer.notify('Failed to download report', { variant: 'error' })
      }
    } catch (error) {
      debugLog.error('JSON export failed:', error)
      framer.notify('Export failed', { variant: 'error' })
    }
  }

  const totalSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0)
  const currentTotal = breakpointData.totalBytes
  const optimizedTotal = Math.max(0, currentTotal - totalSavings)
  const savingsPercent = currentTotal > 0 ? (totalSavings / currentTotal) * 100 : 0

  // Calculate load time estimates
  const loadTime3G = calculateLoadTime(currentTotal, '3g')
  const loadTime4G = calculateLoadTime(currentTotal, '4g')
  const optimizedLoadTime3G = calculateLoadTime(optimizedTotal, '3g')
  const optimizedLoadTime4G = calculateLoadTime(optimizedTotal, '4g')
  
  // Determine warning level for page weight
  const mb = currentTotal / (1024 * 1024)
  const showWarning = mb >= 5
  const showCritical = mb >= 10

  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: 'var(--framer-color-bg)',
      minHeight: '100%'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: spacing.lg }}>

        {/* Hero Section - Total Page Weight */}
        <div style={{
          backgroundColor: colors.warmGray[50],
          borderRadius: borders.radius.lg,
          padding: spacing.xl,
          border: `1px solid var(--framer-color-divider)`,
          position: 'relative',
        }}>
          <div style={{ marginBottom: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: 'var(--framer-color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Total Page Weight
              </div>
              {showWarning && (
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: showCritical ? '#ef4444' : '#f59e0b' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: typography.fontWeight.bold,
              lineHeight: 1.1,
              marginBottom: spacing.sm,
              color: showCritical ? '#ef4444' : showWarning ? '#f59e0b' : 'var(--framer-color-text)',
            }}>
              {formatBytes(currentTotal)}
            </div>
            {totalSavings > 0 && (
              <div style={{
                display: 'inline-block',
                padding: `${spacing.xs} ${spacing.md}`,
                backgroundColor: 'var(--framer-color-bg-secondary)',
                borderRadius: borders.radius.full,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: 'var(--framer-color-text)',
                border: `1px solid var(--framer-color-divider)`,
              }}>
                {savingsPercent.toFixed(0)}% optimization potential
              </div>
            )}
          </div>

          {/* Load Time Estimates */}
          <div style={{
            display: 'flex',
            gap: spacing.lg,
            marginBottom: spacing.lg,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-tertiary)',
                marginBottom: '4px',
              }}>
                3G
              </div>
              <div style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: loadTime3G > 10 ? '#f59e0b' : 'var(--framer-color-text)',
              }}>
                {formatLoadTime(loadTime3G)}
                {totalSavings > 0 && (
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: 'var(--framer-color-text-secondary)',
                    marginLeft: spacing.xs,
                  }}>
                    → {formatLoadTime(optimizedLoadTime3G)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-tertiary)',
                marginBottom: '4px',
              }}>
                4G
              </div>
              <div style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: loadTime4G > 5 ? '#f59e0b' : 'var(--framer-color-text)',
              }}>
                {formatLoadTime(loadTime4G)}
                {totalSavings > 0 && (
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: 'var(--framer-color-text-secondary)',
                    marginLeft: spacing.xs,
                  }}>
                    → {formatLoadTime(optimizedLoadTime4G)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-tertiary)',
                marginBottom: '4px',
              }}>
                Pages
              </div>
              <div style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: 'var(--framer-color-text)',
              }}>
                {pageCount}
              </div>
            </div>
          </div>

          {/* Potential Savings */}
          {totalSavings > 0 && (
            <div style={{
              padding: spacing.md,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              borderRadius: borders.radius.md,
              border: `1px solid var(--framer-color-divider)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} style={{ color: '#22c55e' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div style={{
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: 'var(--framer-color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Potential Savings
                </div>
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: typography.fontWeight.bold,
                color: '#22c55e',
                lineHeight: 1.2,
                marginBottom: '4px',
              }}>
                {formatBytes(totalSavings)}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-secondary)',
                marginBottom: spacing.sm,
              }}>
                ({savingsPercent.toFixed(0)}% reduction)
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--framer-color-divider)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(savingsPercent, 100)}%`,
                  height: '100%',
                  backgroundColor: '#22c55e',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: spacing.md
        }}>
          {/* Assets Card */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.warmGray[50],
            borderRadius: borders.radius.lg,
            border: `1px solid var(--framer-color-divider)`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: borders.radius.md,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              border: `1px solid var(--framer-color-divider)`,
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--framer-color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: typography.fontWeight.bold,
              color: 'var(--framer-color-text)',
              marginBottom: spacing.xs
            }}>
              {breakpointData.assets.length}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text-secondary)'
            }}>
              Total Assets
            </div>
          </div>

          {/* Opportunities Card */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.warmGray[50],
            borderRadius: borders.radius.lg,
            border: `1px solid var(--framer-color-divider)`,
            cursor: recommendations.length > 0 ? 'pointer' : 'default',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onClick={recommendations.length > 0 ? onNavigateToRecommendations : undefined}
          onMouseEnter={(e) => {
            if (recommendations.length > 0) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
            }
          }}
          onMouseLeave={(e) => {
            if (recommendations.length > 0) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: borders.radius.md,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              border: `1px solid var(--framer-color-divider)`,
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: recommendations.length > 0 ? 'var(--framer-color-text)' : 'var(--framer-color-text-tertiary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: typography.fontWeight.bold,
              color: 'var(--framer-color-text)',
              marginBottom: spacing.xs
            }}>
              {recommendations.length}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text-secondary)'
            }}>
              {recommendations.length === 0 ? 'No optimizations needed' : 'Optimization opportunities'}
            </div>
          </div>

          {/* Breakdown Card */}
          <div style={{
            padding: spacing.lg,
            backgroundColor: colors.warmGray[50],
            borderRadius: borders.radius.lg,
            border: `1px solid var(--framer-color-divider)`,
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: borders.radius.md,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              border: `1px solid var(--framer-color-divider)`,
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--framer-color-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: typography.fontWeight.bold,
              color: 'var(--framer-color-text)',
              marginBottom: spacing.xs
            }}>
              {formatBytes(breakpointData.breakdown.images + breakpointData.breakdown.svgs)}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text-secondary)'
            }}>
              Images & SVGs
            </div>
          </div>
        </div>

        {/* Top Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md
            }}>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: 'var(--framer-color-text)'
              }}>
                Top Opportunities
              </h3>
              {onNavigateToRecommendations && (
                <button
                  onClick={onNavigateToRecommendations}
                  style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: 'var(--framer-color-text)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: `${spacing.xs} ${spacing.sm}`,
                    borderRadius: borders.radius.md,
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  View all →
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
              {[...recommendations]
                .sort((a, b) => b.potentialSavings - a.potentialSavings)
                .slice(0, 3)
                .map((rec, index) => (
                <div
                  key={index}
                  style={{
                    padding: spacing.md,
                    backgroundColor: 'var(--framer-color-bg-secondary)',
                    borderRadius: borders.radius.md,
                    border: `1px solid var(--framer-color-divider)`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                  onClick={onNavigateToRecommendations}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: borders.radius.md,
                    backgroundColor: 'var(--framer-color-bg-secondary)',
                    border: `1px solid var(--framer-color-divider)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.bold,
                      color: 'var(--framer-color-text)'
                    }}>
                      {index + 1}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: 'var(--framer-color-text)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {rec.nodeName}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: 'var(--framer-color-text-secondary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {rec.actionable || rec.description}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    flexShrink: 0
                  }}>
                    <div style={{
                      fontSize: typography.fontSize.md,
                      fontWeight: typography.fontWeight.bold,
                      color: '#22c55e'
                    }}>
                      -{formatBytes(rec.potentialSavings)}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: 'var(--framer-color-text-secondary)'
                    }}>
                      savings
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Asset Breakdown Chart */}
        <div>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.md
          }}>
            Asset Breakdown
          </h3>
          <div style={{
            padding: spacing.lg,
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderRadius: borders.radius.lg,
            border: `1px solid var(--framer-color-divider)`
          }}>
            <BreakdownChart breakdown={breakpointData.breakdown} totalBytes={breakpointData.totalBytes} />
          </div>
        </div>

        {/* CMS Assets Notice */}
        <CMSAssetsNotice
          analysis={analysis}
          onCMSEstimateAdded={onRescan}
          manualCMSEstimates={manualCMSEstimates}
          onEditEstimate={(estimate) => {}}
          onRemoveEstimate={(id) => {
            if (!id || !removeManualCMSEstimate) return
            try {
              removeManualCMSEstimate(id)
              if (onRescan) {
                setTimeout(() => onRescan(), 500)
              }
            } catch (error) {
              debugLog.error('Failed to remove estimate:', error)
              framer.notify('Failed to remove estimate', { variant: 'error' })
            }
          }}
          onAddEstimate={addManualCMSEstimate}
          onUpdateEstimate={updateManualCMSEstimate}
        />

        {/* Custom Code Assets */}
        {customCode && customCode.hasCustomCode && (
          <CollapsibleSection
            title={`Custom Code Assets (${customCode.assets.length})`}
            defaultCollapsed={false}
          >
            <div style={{
              padding: spacing.lg,
              backgroundColor: 'var(--framer-color-bg-secondary)',
              borderRadius: borders.radius.lg,
              border: `1px solid var(--framer-color-divider)`
            }}>
              <div style={{ marginBottom: spacing.md }}>
                <p style={{
                  fontSize: typography.fontSize.xs,
                  color: 'var(--framer-color-text-secondary)',
                  marginBottom: spacing.sm
                }}>
                  Assets loaded dynamically by custom code (code overrides/components)
                </p>
                <div style={{
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: 'var(--framer-color-text)'
                }}>
                  {formatBytes(customCode.totalEstimatedBytes)}
                </div>
              </div>

              {customCode.assets.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                  {customCode.assets.slice(0, 5).map((asset, i) => (
                    <div
                      key={i}
                      style={{
                        padding: spacing.sm,
                        backgroundColor: 'var(--framer-color-bg)',
                        borderRadius: borders.radius.md,
                        fontSize: typography.fontSize.xs
                      }}
                    >
                      <div style={{
                        fontWeight: typography.fontWeight.medium,
                        color: 'var(--framer-color-text)',
                        marginBottom: spacing.xs,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {asset.url}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: `2px ${spacing.xs}`,
                          borderRadius: borders.radius.sm,
                          fontSize: '10px',
                          fontWeight: typography.fontWeight.medium,
                          backgroundColor: '#e0e7ff',
                          color: '#6366f1'
                        }}>
                          {asset.type}
                        </span>
                        {asset.isLazyLoaded && (
                          <span style={{
                            padding: `2px ${spacing.xs}`,
                            borderRadius: borders.radius.sm,
                            fontSize: '10px',
                            fontWeight: typography.fontWeight.medium,
                            backgroundColor: 'var(--framer-color-bg-secondary)',
                            color: 'var(--framer-color-text-secondary)'
                          }}>
                            Lazy
                          </span>
                        )}
                        {asset.estimatedBytes && (
                          <span style={{ color: 'var(--framer-color-text-secondary)' }}>
                            {formatBytes(asset.estimatedBytes)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {customCode.assets.length > 5 && (
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: 'var(--framer-color-text-secondary)',
                      textAlign: 'center',
                      paddingTop: spacing.xs
                    }}>
                      + {customCode.assets.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Export Actions */}
        <div>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.md
          }}>
            Export Report
          </h3>
          <div style={{
            padding: spacing.lg,
            backgroundColor: 'var(--framer-color-bg-secondary)',
            borderRadius: borders.radius.lg,
            border: `1px solid var(--framer-color-divider)`,
            display: 'flex',
            gap: spacing.md
          }}>
            <button
              onClick={handleExportMarkdown}
              style={{
                flex: 1,
                padding: spacing.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.white,
                backgroundColor: colors.black,
                border: 'none',
                borderRadius: borders.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Markdown
            </button>
            <button
              onClick={handleExportJSON}
              style={{
                flex: 1,
                padding: spacing.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: 'var(--framer-color-text)',
                backgroundColor: 'var(--framer-color-bg)',
                border: `1px solid var(--framer-color-divider)`,
                borderRadius: borders.radius.md,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download JSON
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

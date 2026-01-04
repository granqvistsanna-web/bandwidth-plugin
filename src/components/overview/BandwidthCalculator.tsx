import { useState, useMemo, useEffect } from 'react'
import { formatBytes } from '../../utils/formatBytes'
import { calculateDeviceWeightedBandwidth, getBreakpointInfo } from '../../utils/deviceBandwidth'
import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'
import { CollapsibleSection } from './CollapsibleSection'
import { Button } from '../primitives/Button'

interface BandwidthCalculatorProps {
  analysis: ProjectAnalysis
  onNavigateToRecommendations?: () => void
}

// Framer plan limits (approximate)
const FRAMER_PLANS = {
  free: {
    name: 'Free',
    bandwidthGB: 1,
  },
  mini: {
    name: 'Mini',
    bandwidthGB: 10,
  },
  basic: {
    name: 'Basic',
    bandwidthGB: 50,
  },
  pro: {
    name: 'Pro',
    bandwidthGB: 200,
  }
} as const

type PlanKey = keyof typeof FRAMER_PLANS

export function BandwidthCalculator({ analysis, onNavigateToRecommendations }: BandwidthCalculatorProps) {
  const pages = analysis.pages || []
  const pageCount = pages.length
  
  // Set intelligent defaults based on project size
  const getDefaultPageviews = () => {
    if (pageCount < 10) return 5000
    if (pageCount < 50) return 25000
    return 100000
  }
  
  const getDefaultPagesPerVisit = () => {
    if (pageCount < 10) return 2.5
    if (pageCount < 50) return 3.5
    return 4.5
  }
  
  const [monthlyPageviews, setMonthlyPageviews] = useState(getDefaultPageviews())
  const [averagePagesPerVisit, setAveragePagesPerVisit] = useState(getDefaultPagesPerVisit())
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('basic')
  const [pageviewsMode, setPageviewsMode] = useState<'preset' | 'custom'>('preset')
  const [pagesPerVisitMode, setPagesPerVisitMode] = useState<'preset' | 'custom'>('preset')

  // Safety check for overallBreakpoints
  if (!analysis.overallBreakpoints) {
    return (
      <div style={{ padding: spacing.lg, color: framerColors.text }}>
        <p>Analysis data is incomplete. Please rescan the project.</p>
      </div>
    )
  }

  const { mobile: mobileData, tablet: tabletData, desktop: desktopData } = analysis.overallBreakpoints
  
  // Calculate device-weighted bandwidth (Framer serves different image sizes per device)
  const { bytesPerVisit, bandwidthPer1000, monthlyBandwidthGB } = useMemo(() => {
    if (pages.length === 0) {
      // Fallback: use device-weighted overall breakpoint data
      const weightedBytes = calculateDeviceWeightedBandwidth({
        mobile: mobileData,
        tablet: tabletData,
        desktop: desktopData
      })
      const pageWeightMB = weightedBytes / (1024 * 1024)
      const pageWeightGB = weightedBytes / (1024 * 1024 * 1024)
      const bandwidthPer1000 = (pageWeightMB * 1000) / 1024
      const monthlyBandwidthGB = pageWeightGB * monthlyPageviews
      return {
        bytesPerVisit: weightedBytes,
        bandwidthPer1000,
        monthlyBandwidthGB
      }
    }
    
    // Strategy: Use the heaviest page + weighted average of other pages
    // Calculate device-weighted bytes for each page
    const sortedPages = [...pages].sort((a, b) => {
      const aWeighted = calculateDeviceWeightedBandwidth(a.breakpoints)
      const bWeighted = calculateDeviceWeightedBandwidth(b.breakpoints)
      return bWeighted - aWeighted
    })
    
    const heaviestPage = sortedPages[0]
    const otherPages = sortedPages.slice(1)
    
    // Calculate average device-weighted bytes for other pages
    const avgOtherPageBytes = otherPages.length > 0
      ? otherPages.reduce((sum, page) => {
          const weighted = calculateDeviceWeightedBandwidth(page.breakpoints)
          return sum + weighted
        }, 0) / otherPages.length
      : 0
    
    // Calculate device-weighted bytes per visit:
    // - Always includes the heaviest page (usually landing page)
    // - Plus (averagePagesPerVisit - 1) × average of other pages
    const heaviestPageWeighted = calculateDeviceWeightedBandwidth(heaviestPage.breakpoints)
    const additionalPages = Math.max(0, averagePagesPerVisit - 1)
    const bytesPerVisit = heaviestPageWeighted + (additionalPages * avgOtherPageBytes)
    
    // Convert to GB for display
    const bytesPerVisitMB = bytesPerVisit / (1024 * 1024)
    const bytesPerVisitGB = bytesPerVisit / (1024 * 1024 * 1024)
    const bandwidthPer1000 = (bytesPerVisitMB * 1000) / 1024
    const monthlyBandwidthGB = bytesPerVisitGB * monthlyPageviews
    
    return {
      bytesPerVisit,
      bandwidthPer1000,
      monthlyBandwidthGB
    }
  }, [mobileData.totalBytes, tabletData.totalBytes, desktopData.totalBytes, monthlyPageviews, averagePagesPerVisit, pages])

  const planLimit = FRAMER_PLANS[selectedPlan].bandwidthGB
  const usagePercent = (monthlyBandwidthGB / planLimit) * 100
  const overageGB = Math.max(0, monthlyBandwidthGB - planLimit)
  
  // Suggest appropriate plan based on estimate
  const suggestedPlan = useMemo(() => {
    if (monthlyBandwidthGB <= FRAMER_PLANS.free.bandwidthGB) return 'free'
    if (monthlyBandwidthGB <= FRAMER_PLANS.mini.bandwidthGB) return 'mini'
    if (monthlyBandwidthGB <= FRAMER_PLANS.basic.bandwidthGB) return 'basic'
    return 'pro'
  }, [monthlyBandwidthGB])

  // Auto-select suggested plan on initial load
  useEffect(() => {
    setSelectedPlan(suggestedPlan)
  }, []) // Empty deps = run once on mount

  // Determine risk level
  let riskLevel: 'safe' | 'warning' | 'danger' = 'safe'
  let riskMessage = ''
  let riskTitle = ''

  if (usagePercent > 100) {
    riskLevel = 'danger'
    riskTitle = 'Exceeds plan limit'
    riskMessage = `Your estimate exceeds the ${FRAMER_PLANS[selectedPlan].name} plan limit by ${formatBytes(overageGB * 1024 * 1024 * 1024)}`
  } else if (usagePercent > 80) {
    riskLevel = 'warning'
    riskTitle = 'Approaching limit'
    riskMessage = `Using ${usagePercent.toFixed(0)}% of your ${FRAMER_PLANS[selectedPlan].name} plan monthly limit`
  } else {
    riskLevel = 'safe'
    riskTitle = 'Within limits'
    riskMessage = `Using ${usagePercent.toFixed(0)}% of your ${FRAMER_PLANS[selectedPlan].name} plan monthly limit`
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.lg,
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Hero: Monthly Bandwidth */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle,
        marginBottom: spacing.lg
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xs
        }}>
          <div style={{
            fontSize: typography.fontSize['2xl'],
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            lineHeight: typography.lineHeight.tight,
            letterSpacing: typography.letterSpacing.tighter
          }}>
            {monthlyBandwidthGB.toFixed(2)} GB/month
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: riskLevel === 'danger' ? 'var(--status-error-solid)' :
                   riskLevel === 'warning' ? 'var(--status-warning-solid)' :
                   'var(--status-success-solid)',
            backgroundColor: riskLevel === 'danger' ? 'rgba(239, 68, 68, 0.1)' :
                              riskLevel === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                              'rgba(34, 197, 94, 0.1)',
            padding: `${spacing.xxs} ${spacing.sm}`,
            borderRadius: borders.radius.full,
            whiteSpace: 'nowrap' as const
          }}>
            {riskTitle}
          </div>
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: framerColors.textSecondary
        }}>
          Based on {monthlyPageviews.toLocaleString()} pageviews
        </div>
      </div>

      {/* Combined: Traffic Estimate + Plan Status */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle,
        marginBottom: spacing.lg
      }}>
        {/* Traffic Estimate Section */}
        <div style={{ marginBottom: spacing.lg }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.md
          }}>
            Traffic Estimate
          </div>

        {/* Monthly Pageviews */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            marginBottom: spacing.xs,
            display: 'block'
          }}>
            Monthly pageviews
          </label>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            marginBottom: spacing.xs,
            lineHeight: typography.lineHeight.relaxed
          }}>
            Check your analytics for actual data. New sites typically start at 1–5K.
          </div>
          <select
            value={pageviewsMode === 'custom' ? 'custom' : monthlyPageviews}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'custom') {
                setPageviewsMode('custom')
              } else {
                setPageviewsMode('preset')
                setMonthlyPageviews(parseInt(value))
              }
            }}
            style={{
              width: '100%',
              padding: `6px 32px 6px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.subtle}`,
              borderRadius: borders.radius.md,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = framerColors.text
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = themeBorders.subtle
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <option value="1000">1K pageviews</option>
            <option value="5000">5K pageviews</option>
            <option value="10000">10K pageviews</option>
            <option value="25000">25K pageviews</option>
            <option value="50000">50K pageviews</option>
            <option value="100000">100K pageviews</option>
            <option value="custom">Custom</option>
          </select>
          {pageviewsMode === 'custom' && (
            <input
              type="number"
              value={monthlyPageviews}
              onChange={(e) => setMonthlyPageviews(Math.max(1, parseInt(e.target.value) || 0))}
              style={{
                width: '100%',
                marginTop: spacing.sm,
                padding: `6px ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text,
                backgroundColor: surfaces.primary,
                border: `1px solid ${themeBorders.subtle}`,
                borderRadius: borders.radius.md,
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = framerColors.text
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = themeBorders.subtle
                e.currentTarget.style.boxShadow = 'none'
              }}
              placeholder="Enter custom pageviews"
              min="1"
              step="1000"
            />
          )}
        </div>

        {/* Pages per Visit */}
        <div>
          <label style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            marginBottom: spacing.xs,
            display: 'block'
          }}>
            Pages per visit
          </label>
          <select
            value={pagesPerVisitMode === 'custom' ? 'custom' : averagePagesPerVisit}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'custom') {
                setPagesPerVisitMode('custom')
              } else {
                setPagesPerVisitMode('preset')
                setAveragePagesPerVisit(parseFloat(value))
              }
            }}
            style={{
              width: '100%',
              padding: `6px 32px 6px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.subtle}`,
              borderRadius: borders.radius.md,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = framerColors.text
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = themeBorders.subtle
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <option value="1.0">Landing only (1.0)</option>
            <option value="2.5">Light (2.5)</option>
            <option value="3.5">Typical (3.5)</option>
            <option value="4.5">Moderate (4.5)</option>
            <option value="6.0">Deep (6.0)</option>
            <option value="custom">Custom</option>
          </select>
          {pagesPerVisitMode === 'custom' && (
            <input
              type="number"
              value={averagePagesPerVisit}
              onChange={(e) => setAveragePagesPerVisit(Math.max(0.1, parseFloat(e.target.value) || 1))}
              style={{
                width: '100%',
                marginTop: spacing.sm,
                padding: `6px ${spacing.sm}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text,
                backgroundColor: surfaces.primary,
                border: `1px solid ${themeBorders.subtle}`,
                borderRadius: borders.radius.md,
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = framerColors.text
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = themeBorders.subtle
                e.currentTarget.style.boxShadow = 'none'
              }}
              placeholder="Enter custom value"
              min="0.1"
              max={pages.length || 10}
              step="0.1"
            />
          )}
        </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          backgroundColor: themeBorders.subtle,
          margin: `${spacing.lg} 0`
        }} />

        {/* Plan Status Section */}
        <div>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.md
          }}>
            Plan Status
          </div>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanKey)}
            style={{
              width: '100%',
              padding: `6px 32px 6px ${spacing.sm}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.subtle}`,
              borderRadius: borders.radius.md,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23525252' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = framerColors.text
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = themeBorders.subtle
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => (
              <option key={plan} value={plan}>
                {FRAMER_PLANS[plan].name} - {FRAMER_PLANS[plan].bandwidthGB} GB/month
              </option>
            ))}
          </select>

          {/* Usage Progress Bar */}
          {monthlyBandwidthGB > 0 && (
            <div style={{ marginTop: spacing.lg }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text
              }}>
                {riskTitle}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.textSecondary
              }}>
                {usagePercent.toFixed(1)}% used
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '10px',
              backgroundColor: surfaces.tertiary,
              borderRadius: borders.radius.full,
              overflow: 'hidden',
              marginBottom: spacing.md
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: riskLevel === 'danger' ? 'var(--status-error-solid)' :
                                  riskLevel === 'warning' ? 'var(--status-warning-solid)' :
                                  'var(--status-success-solid)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
              lineHeight: typography.lineHeight.relaxed
            }}>
              {riskMessage}
            </div>
            {overageGB > 0 && (
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text,
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTop: `1px solid ${themeBorders.subtle}`
              }}>
                Estimated overage: {overageGB.toFixed(2)} GB beyond plan limit
              </div>
            )}
            {suggestedPlan && suggestedPlan !== selectedPlan && (
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginTop: spacing.md,
                paddingTop: spacing.md,
                borderTop: `1px solid ${themeBorders.subtle}`
              }}>
                Based on your estimate, we recommend the <strong style={{ color: framerColors.text }}>{FRAMER_PLANS[suggestedPlan].name}</strong> plan
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Technical Details */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle
      }}>
        <CollapsibleSection
          title="Details"
          defaultCollapsed={true}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md
          }}>
            <div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginBottom: spacing.xs
              }}>
                Per visit
              </div>
              <div style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text
              }}>
                {formatBytes(bytesPerVisit)}
              </div>
            </div>
            <div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginBottom: spacing.xs
              }}>
                Per 1,000 views
              </div>
              <div style={{
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text
              }}>
                {bandwidthPer1000.toFixed(3)} GB
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Breakpoint Estimates"
          defaultCollapsed={true}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.md
          }}>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textSecondary,
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing.sm
            }}>
              Framer serves different image sizes based on viewport. Each breakpoint shows the estimated page weight for that device type.
            </div>

            {(['mobile', 'tablet', 'desktop'] as const).map((breakpoint) => {
              const data = analysis.overallBreakpoints[breakpoint]
              const info = getBreakpointInfo(breakpoint)
              const pageWeightMB = data.totalBytes / (1024 * 1024)
              const monthlyGB = (pageWeightMB * monthlyPageviews) / 1024

              return (
                <div
                  key={breakpoint}
                  style={{
                    padding: spacing.md,
                    backgroundColor: surfaces.tertiary,
                    borderRadius: borders.radius.md
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: spacing.xs
                  }}>
                    <div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: framerColors.text,
                        marginBottom: spacing.xxs
                      }}>
                        {info.label} ({info.width})
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: framerColors.textSecondary
                      }}>
                        {info.description} • {info.distribution}
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.bold,
                        color: framerColors.text
                      }}>
                        {formatBytes(data.totalBytes)}
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        color: framerColors.textSecondary
                      }}>
                        {monthlyGB.toFixed(2)} GB/month
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CollapsibleSection>
      </div>

      {/* Action Items */}
      {(usagePercent > 80 || overageGB > 0) && (
        <div style={{
          padding: spacing.lg,
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          boxShadow: themeElevation.subtle
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.sm
          }}>
            Reduce bandwidth usage
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textSecondary,
            lineHeight: typography.lineHeight.relaxed,
            marginBottom: onNavigateToRecommendations ? spacing.md : 0
          }}>
            Optimize your largest images, convert PNGs to WebP, and enable Framer's image optimization.
          </div>
          {onNavigateToRecommendations && (
            <Button
              onClick={onNavigateToRecommendations}
              variant="primary"
              size="sm"
              fullWidth
            >
              View recommendations
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

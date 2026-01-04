import { useState, useMemo } from 'react'
import { formatBytes } from '../../utils/formatBytes'
import { calculateDeviceWeightedBandwidth, getBreakpointInfo } from '../../utils/deviceBandwidth'
import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, surfaces, themeBorders, themeElevation, framerColors } from '../../styles/designTokens'
import { CollapsibleSection } from './CollapsibleSection'

interface BandwidthCalculatorProps {
  analysis: ProjectAnalysis
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

export function BandwidthCalculator({ analysis }: BandwidthCalculatorProps) {
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
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Hero: Monthly Bandwidth */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        border: `1px solid ${themeBorders.subtle}`,
        boxShadow: themeElevation.default
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: spacing.sm,
          marginBottom: spacing.xs
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: typography.fontWeight.bold,
            color: framerColors.text,
            lineHeight: 1,
            letterSpacing: '-0.02em'
          }}>
            {monthlyBandwidthGB.toFixed(2)} GB
          </div>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: framerColors.textSecondary,
            fontWeight: typography.fontWeight.medium
          }}>
            per month
          </div>
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: framerColors.textSecondary,
          marginBottom: spacing.xs
        }}>
          Based on {monthlyPageviews.toLocaleString()} pageviews
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: framerColors.textTertiary,
          lineHeight: typography.lineHeight.relaxed
        }}>
          Estimate accounts for responsive images: Framer serves smaller images to mobile devices, larger to desktop. Weighted by typical device distribution (55% mobile, 15% tablet, 30% desktop).
        </div>
      </div>

      {/* Breakpoint Breakdown */}
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
                  backgroundColor: surfaces.primary,
                  borderRadius: borders.radius.md,
                  border: `1px solid ${themeBorders.subtle}`
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
                      marginBottom: '2px'
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
                      color: framerColors.textTertiary
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

      {/* Traffic Estimate Inputs */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        border: `1px solid ${themeBorders.subtle}`,
        boxShadow: themeElevation.default
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.semibold,
          color: framerColors.text,
          marginBottom: spacing.lg
        }}>
          Traffic Estimate
        </div>

        {/* Monthly Pageviews */}
        <div style={{ marginBottom: spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            marginBottom: spacing.xs
          }}>
            Monthly pageviews
          </label>
          <input
            type="number"
            value={monthlyPageviews}
            onChange={(e) => setMonthlyPageviews(Math.max(1, parseInt(e.target.value) || 0))}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.default}`,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = framerColors.text
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = themeBorders.default
              e.currentTarget.style.boxShadow = 'none'
            }}
            min="1"
            step="1000"
          />
          {/* Quick values */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.xs,
            marginTop: spacing.sm
          }}>
            {[1000, 5000, 10000, 25000, 50000, 100000].map(value => (
              <button
                key={value}
                onClick={() => setMonthlyPageviews(value)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: monthlyPageviews === value ? surfaces.primary : framerColors.text,
                  backgroundColor: monthlyPageviews === value ? framerColors.text : surfaces.tertiary,
                  border: 'none',
                  borderRadius: borders.radius.md,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (monthlyPageviews !== value) {
                    e.currentTarget.style.backgroundColor = framerColors.bgSecondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (monthlyPageviews !== value) {
                    e.currentTarget.style.backgroundColor = surfaces.tertiary
                  }
                }}
              >
                {value >= 1000 ? `${value / 1000}K` : value}
              </button>
            ))}
          </div>
        </div>

        {/* Pages per Visit */}
        <div>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: framerColors.text,
            marginBottom: spacing.xs
          }}>
            Pages per visit
            <span title="Most visitors view 1–3 pages. Landing page is always included, other pages are weighted by this value." style={{ cursor: 'help' }}>
              <svg
                style={{
                  width: '14px',
                  height: '14px',
                  color: framerColors.textTertiary
                }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </label>
          <input
            type="number"
            value={averagePagesPerVisit}
            onChange={(e) => setAveragePagesPerVisit(Math.max(0.1, parseFloat(e.target.value) || 1))}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.default}`,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = framerColors.text
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(128, 128, 128, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = themeBorders.default
              e.currentTarget.style.boxShadow = 'none'
            }}
            min="0.1"
            max={pages.length || 10}
            step="0.1"
          />
          {/* Quick values */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: spacing.xs,
            marginTop: spacing.sm
          }}>
            {[
              { value: 1.0, label: 'Landing only' },
              { value: 2.5, label: 'Light' },
              { value: 3.5, label: 'Typical' },
              { value: 4.5, label: 'Moderate' },
              { value: 6.0, label: 'Deep' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAveragePagesPerVisit(value)}
                style={{
                  padding: `${spacing.xs} ${spacing.sm}`,
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: averagePagesPerVisit === value ? surfaces.primary : framerColors.text,
                  backgroundColor: averagePagesPerVisit === value ? framerColors.text : surfaces.tertiary,
                  border: 'none',
                  borderRadius: borders.radius.md,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (averagePagesPerVisit !== value) {
                    e.currentTarget.style.backgroundColor = framerColors.bgSecondary
                  }
                }}
                onMouseLeave={(e) => {
                  if (averagePagesPerVisit !== value) {
                    e.currentTarget.style.backgroundColor = surfaces.tertiary
                  }
                }}
              >
                {label} ({value})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Status */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        border: `1px solid ${themeBorders.subtle}`,
        boxShadow: themeElevation.default
      }}>
        <div style={{
          marginBottom: spacing.lg
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text,
            marginBottom: spacing.md
          }}>
            Your Plan
          </div>
          <select
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value as PlanKey)}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.text,
              backgroundColor: surfaces.primary,
              border: `1px solid ${themeBorders.default}`,
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
              e.currentTarget.style.borderColor = themeBorders.default
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => (
              <option key={plan} value={plan}>
                {FRAMER_PLANS[plan].name} - {FRAMER_PLANS[plan].bandwidthGB} GB/month
              </option>
            ))}
          </select>
        </div>

        {/* Usage Progress Bar */}
        {monthlyBandwidthGB > 0 && (
          <div>
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

      {/* Secondary Metrics - Collapsible */}
      <CollapsibleSection
        title="Details"
        defaultCollapsed={true}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          paddingTop: spacing.sm
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

      {/* Action Items */}
      {(usagePercent > 80 || overageGB > 0) && (
        <div style={{
          padding: spacing.lg,
          backgroundColor: surfaces.secondary,
          borderRadius: borders.radius.lg,
          border: `1px solid ${themeBorders.subtle}`,
          boxShadow: themeElevation.default
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
            lineHeight: typography.lineHeight.relaxed
          }}>
            Optimize your largest images, convert PNGs to WebP, and enable Framer's image optimization. See the Recommendations page for specific opportunities.
          </div>
        </div>
      )}
    </div>
  )
}

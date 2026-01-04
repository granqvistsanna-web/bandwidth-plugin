import { useState, useMemo } from 'react'
import { formatBytes } from '../../utils/formatBytes'
import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, colors } from '../../styles/designTokens'
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
    if (pageCount < 10) return 1.5
    if (pageCount < 50) return 2.0
    return 2.5
  }
  
  const [monthlyPageviews, setMonthlyPageviews] = useState(getDefaultPageviews())
  const [averagePagesPerVisit, setAveragePagesPerVisit] = useState(getDefaultPagesPerVisit())
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('basic')

  const desktopData = analysis.overallBreakpoints.desktop
  
  // Calculate realistic bandwidth based on average pages per visit
  const { bytesPerVisit, bandwidthPer1000, monthlyBandwidthGB } = useMemo(() => {
    if (pages.length === 0) {
      // Fallback: if no pages, use total bytes per pageview
      const pageWeightMB = desktopData.totalBytes / (1024 * 1024)
      const pageWeightGB = desktopData.totalBytes / (1024 * 1024 * 1024)
      const bandwidthPer1000 = (pageWeightMB * 1000) / 1024
      const monthlyBandwidthGB = pageWeightGB * monthlyPageviews
      return {
        bytesPerVisit: desktopData.totalBytes,
        bandwidthPer1000,
        monthlyBandwidthGB
      }
    }
    
    // Strategy: Use the heaviest page + weighted average of other pages
    // Sort pages by total bytes (heaviest first)
    const sortedPages = [...pages].sort((a, b) => {
      const aBytes = a.breakpoints.desktop.totalBytes
      const bBytes = b.breakpoints.desktop.totalBytes
      return bBytes - aBytes
    })
    
    const heaviestPage = sortedPages[0]
    const otherPages = sortedPages.slice(1)
    
    // Calculate average bytes for other pages
    const avgOtherPageBytes = otherPages.length > 0
      ? otherPages.reduce((sum, page) => sum + page.breakpoints.desktop.totalBytes, 0) / otherPages.length
      : 0
    
    // Calculate bytes per visit:
    // - Always includes the heaviest page (usually landing page)
    // - Plus (averagePagesPerVisit - 1) × average of other pages
    const additionalPages = Math.max(0, averagePagesPerVisit - 1)
    const bytesPerVisit = heaviestPage.breakpoints.desktop.totalBytes + (additionalPages * avgOtherPageBytes)
    
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
  }, [desktopData.totalBytes, monthlyPageviews, averagePagesPerVisit, pages])

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
        backgroundColor: colors.white,
        borderRadius: borders.radius.lg,
        padding: spacing.lg,
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '36px',
          fontWeight: typography.fontWeight.bold,
          lineHeight: '1',
          color: 'var(--framer-color-text)',
          marginBottom: spacing.xs,
          letterSpacing: '-0.02em'
        }}>
          {monthlyBandwidthGB.toFixed(2)} GB
        </div>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: 'var(--framer-color-text-secondary)',
          marginBottom: spacing.xs
        }}>
          Estimated monthly bandwidth
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: 'var(--framer-color-text-tertiary)'
        }}>
          For {monthlyPageviews.toLocaleString()} pageviews
        </div>
      </div>

      {/* Traffic Estimate Inputs */}
      <div style={{
        backgroundColor: colors.warmGray[100],
        borderRadius: borders.radius.lg,
        padding: spacing.md
      }}>
        <div style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          color: 'var(--framer-color-text)',
          marginBottom: spacing.md
        }}>
          Traffic Estimate
        </div>

        {/* Monthly Pageviews */}
        <div style={{ marginBottom: spacing.md }}>
          <label style={{
            display: 'block',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.xs
          }}>
            Monthly pageviews
          </label>
          
          {/* Quick Preset Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.xs,
            marginBottom: spacing.sm,
            flexWrap: 'wrap'
          }}>
            {[
              { label: '1K', value: 1000 },
              { label: '10K', value: 10000 },
              { label: '50K', value: 50000 },
              { label: '100K', value: 100000 },
              { label: '500K', value: 500000 },
              { label: '1M', value: 1000000 }
            ].map(preset => {
              const isSelected = Math.abs(monthlyPageviews - preset.value) < 500
              return (
                <button
                  key={preset.value}
                  onClick={() => setMonthlyPageviews(preset.value)}
                  style={{
                    padding: `${spacing.xs} ${spacing.sm}`,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    borderRadius: borders.radius.sm,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    minWidth: '44px',
                    textAlign: 'center',
                    ...(isSelected ? {
                      backgroundColor: 'var(--framer-color-text)',
                      color: 'var(--framer-color-bg)',
                    } : {
                      backgroundColor: colors.white,
                      color: 'var(--framer-color-text)',
                      border: `1px solid var(--framer-color-divider)`
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.warmGray[50]
                      e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.white
                      e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                    }
                  }}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          <input
            type="number"
            value={monthlyPageviews}
            onChange={(e) => setMonthlyPageviews(Math.max(1, parseInt(e.target.value) || 0))}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text)',
              backgroundColor: colors.white,
              border: `1px solid var(--framer-color-divider)`,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-text)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            min="1"
            step="1000"
          />
        </div>

        {/* Pages per Visit */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            marginBottom: spacing.xs
          }}>
            <label style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium,
              color: 'var(--framer-color-text)'
            }}>
              Pages per visit
            </label>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <svg 
                style={{ 
                  width: '14px', 
                  height: '14px', 
                  color: 'var(--framer-color-text-tertiary)',
                  cursor: 'help'
                }} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div style={{
                position: 'absolute',
                left: 0,
                bottom: '100%',
                marginBottom: spacing.xs,
                width: '240px',
                padding: spacing.sm,
                fontSize: typography.fontSize.xs,
                borderRadius: borders.radius.md,
                backgroundColor: 'var(--framer-color-text)',
                color: 'var(--framer-color-text-reversed)',
                opacity: 0,
                pointerEvents: 'none',
                transition: 'opacity 0.15s ease',
                zIndex: 10,
                whiteSpace: 'normal'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
              >
                Most visitors view 1–3 pages. Landing page is always included, other pages are weighted by this value.
              </div>
            </div>
          </div>
          
          {/* Preset Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.xs,
            marginBottom: spacing.sm,
            flexWrap: 'wrap'
          }}>
            {[
              { label: 'Landing only', value: 1.0, subtitle: '1.0' },
              { label: 'Light', value: 1.5, subtitle: '1.5' },
              { label: 'Typical', value: 2.0, subtitle: '2.0' },
              { label: 'Deep', value: 3.0, subtitle: '3.0+' }
            ].map(preset => {
              const isSelected = Math.abs(averagePagesPerVisit - preset.value) < 0.1
              return (
                <button
                  key={preset.value}
                  onClick={() => setAveragePagesPerVisit(preset.value)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    borderRadius: borders.radius.sm,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '70px',
                    ...(isSelected ? {
                      backgroundColor: 'var(--framer-color-text)',
                      color: 'var(--framer-color-bg)',
                    } : {
                      backgroundColor: colors.white,
                      color: 'var(--framer-color-text)',
                      border: `1px solid var(--framer-color-divider)`
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.warmGray[50]
                      e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.white
                      e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                    }
                  }}
                >
                  <span>{preset.label}</span>
                  <span style={{
                    fontSize: '10px',
                    opacity: isSelected ? 0.8 : 0.6,
                    fontWeight: typography.fontWeight.regular
                  }}>
                    {preset.subtitle}
                  </span>
                </button>
              )
            })}
          </div>

          <input
            type="number"
            value={averagePagesPerVisit}
            onChange={(e) => setAveragePagesPerVisit(Math.max(0.1, parseFloat(e.target.value) || 1))}
            style={{
              width: '100%',
              padding: `${spacing.sm} ${spacing.md}`,
              fontSize: typography.fontSize.sm,
              color: 'var(--framer-color-text)',
              backgroundColor: colors.white,
              border: `1px solid var(--framer-color-divider)`,
              borderRadius: borders.radius.md,
              transition: 'all 0.15s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-text)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 0, 0, 0.05)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            min="0.1"
            max={pages.length || 10}
            step="0.1"
          />
          <div style={{
            fontSize: typography.fontSize.xs,
            color: 'var(--framer-color-text-tertiary)',
            marginTop: spacing.xs
          }}>
            {averagePagesPerVisit === 1 ? 'Visitors only view landing page' :
             averagePagesPerVisit < 2 ? 'Most visitors view 1–2 pages' :
             averagePagesPerVisit < 3 ? 'Visitors typically browse 2–3 pages' :
             'Visitors view multiple pages per visit'}
          </div>
        </div>
      </div>

      {/* Plan Status */}
      <div style={{
        backgroundColor: colors.warmGray[100],
        borderRadius: borders.radius.lg,
        padding: spacing.md
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: 'var(--framer-color-text)',
              marginBottom: '2px'
            }}>
              Plan: {FRAMER_PLANS[selectedPlan].name}
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)'
            }}>
              {planLimit} GB/month limit
            </div>
          </div>
          <div style={{
            display: 'flex',
            gap: spacing.xs,
            flexWrap: 'wrap'
          }}>
            {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => {
              const isSelected = selectedPlan === plan
              return (
                <button
                  key={plan}
                  onClick={() => setSelectedPlan(plan)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.medium,
                    borderRadius: borders.radius.sm,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    minWidth: '60px',
                    ...(isSelected ? {
                      backgroundColor: 'var(--framer-color-text)',
                      color: 'var(--framer-color-bg)',
                    } : {
                      backgroundColor: colors.white,
                      color: 'var(--framer-color-text)',
                      border: `1px solid var(--framer-color-divider)`
                    })
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.warmGray[50]
                      e.currentTarget.style.borderColor = 'var(--framer-color-text-secondary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = colors.white
                      e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
                    }
                  }}
                  title={`${FRAMER_PLANS[plan].bandwidthGB} GB/month limit`}
                >
                  <span>{FRAMER_PLANS[plan].name}</span>
                  <span style={{
                    fontSize: '10px',
                    opacity: isSelected ? 0.8 : 0.6,
                    fontWeight: typography.fontWeight.regular
                  }}>
                    {FRAMER_PLANS[plan].bandwidthGB}GB
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Usage Progress Bar */}
        {monthlyBandwidthGB > 0 && (
          <div style={{ marginTop: spacing.md }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.xs
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: 'var(--framer-color-text)'
              }}>
                {riskTitle}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-secondary)'
              }}>
                {usagePercent.toFixed(1)}% used
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--framer-color-divider)',
              borderRadius: borders.radius.full,
              overflow: 'hidden',
              marginBottom: spacing.sm
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: riskLevel === 'danger' ? 'var(--framer-color-text)' :
                                  riskLevel === 'warning' ? 'var(--framer-color-text-secondary)' :
                                  'var(--framer-color-text-tertiary)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)',
              lineHeight: typography.lineHeight.relaxed
            }}>
              {riskMessage}
            </div>
            {overageGB > 0 && (
              <div style={{
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: 'var(--framer-color-text)',
                marginTop: spacing.sm,
                paddingTop: spacing.sm,
                borderTop: `1px solid var(--framer-color-divider)`
              }}>
                Estimated overage: {overageGB.toFixed(2)} GB beyond plan limit
              </div>
            )}
            {suggestedPlan && suggestedPlan !== selectedPlan && (
              <div style={{
                fontSize: typography.fontSize.xs,
                color: 'var(--framer-color-text-secondary)',
                marginTop: spacing.sm,
                paddingTop: spacing.sm,
                borderTop: `1px solid var(--framer-color-divider)`
              }}>
                Based on your estimate, we recommend the <strong style={{ color: 'var(--framer-color-text)' }}>{FRAMER_PLANS[suggestedPlan].name}</strong> plan
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
              color: 'var(--framer-color-text-secondary)',
              marginBottom: spacing.xs
            }}>
              Per visit
            </div>
            <div style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)'
            }}>
              {formatBytes(bytesPerVisit)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: 'var(--framer-color-text-secondary)',
              marginBottom: spacing.xs
            }}>
              Per 1,000 views
            </div>
            <div style={{
              fontSize: typography.fontSize.md,
              fontWeight: typography.fontWeight.semibold,
              color: 'var(--framer-color-text)'
            }}>
              {bandwidthPer1000.toFixed(3)} GB
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Action Items */}
      {(usagePercent > 80 || overageGB > 0) && (
        <div style={{
          backgroundColor: colors.warmGray[100],
          borderRadius: borders.radius.lg,
          padding: spacing.md
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: 'var(--framer-color-text)',
            marginBottom: spacing.xs
          }}>
            Reduce bandwidth usage
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: 'var(--framer-color-text-secondary)',
            lineHeight: typography.lineHeight.relaxed
          }}>
            Optimize your largest images, convert PNGs to WebP, and enable Framer's image optimization. See the Recommendations page for specific opportunities.
          </div>
        </div>
      )}
    </div>
  )
}

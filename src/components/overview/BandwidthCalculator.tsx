import { useState, useMemo, useEffect } from 'react'
import { formatBytes } from '../../utils/formatBytes'
import { calculateDeviceWeightedBandwidth, getBreakpointInfo } from '../../utils/deviceBandwidth'
import { calculateMonthlyBandwidth, BANDWIDTH_CALIBRATION } from '../../services/bandwidth'
import type { ProjectAnalysis } from '../../types/analysis'
import { spacing, typography, borders, surfaces, themeBorders, themeElevation, framerColors, status } from '../../styles/designTokens'
import { CollapsibleSection } from './CollapsibleSection'
import { Button } from '../primitives/Button'
import { InfoTooltip } from '../common/InfoTooltip'
import { getFramerOptimizationSetting } from '../../hooks/useSettings'

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

// localStorage keys for persisting user settings
const STORAGE_KEYS = {
  pageviews: 'bandwidth-calc-pageviews',
  pagesPerVisit: 'bandwidth-calc-pages-per-visit',
  plan: 'bandwidth-calc-plan',
  pageviewsMode: 'bandwidth-calc-pageviews-mode',
  pagesPerVisitMode: 'bandwidth-calc-pages-per-visit-mode'
}

function getStoredNumber(key: string, defaultValue: number): number {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return parseFloat(stored)
  } catch { /* ignore */ }
  return defaultValue
}

function getStoredString<T extends string>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return stored as T
  } catch { /* ignore */ }
  return defaultValue
}

export function BandwidthCalculator({ analysis, onNavigateToRecommendations }: BandwidthCalculatorProps) {
  // Memoize pages to prevent unnecessary re-renders
  const pages = useMemo(() => analysis.pages || [], [analysis.pages])

  // Load persisted values or use defaults (1K pageviews, 2.5 pages/visit)
  const [monthlyPageviews, setMonthlyPageviews] = useState(() =>
    getStoredNumber(STORAGE_KEYS.pageviews, 1000)
  )
  const [averagePagesPerVisit, setAveragePagesPerVisit] = useState(() =>
    getStoredNumber(STORAGE_KEYS.pagesPerVisit, 2.5)
  )
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(() =>
    getStoredString(STORAGE_KEYS.plan, 'basic')
  )
  const [pageviewsMode, setPageviewsMode] = useState<'preset' | 'custom'>(() =>
    getStoredString(STORAGE_KEYS.pageviewsMode, 'preset')
  )
  const [pagesPerVisitMode, setPagesPerVisitMode] = useState<'preset' | 'custom'>(() =>
    getStoredString(STORAGE_KEYS.pagesPerVisitMode, 'preset')
  )

  // Persist values to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pageviews, String(monthlyPageviews))
      localStorage.setItem(STORAGE_KEYS.pagesPerVisit, String(averagePagesPerVisit))
      localStorage.setItem(STORAGE_KEYS.plan, selectedPlan)
      localStorage.setItem(STORAGE_KEYS.pageviewsMode, pageviewsMode)
      localStorage.setItem(STORAGE_KEYS.pagesPerVisitMode, pagesPerVisitMode)
    } catch { /* ignore */ }
  }, [monthlyPageviews, averagePagesPerVisit, selectedPlan, pageviewsMode, pagesPerVisitMode])

  // Memoize breakpoint data with fallbacks to prevent unnecessary re-renders
  const defaultBreakpointData = useMemo(() => ({ totalBytes: 0, assets: [] as const }), [])
  const mobileData = useMemo(
    () => analysis.overallBreakpoints?.mobile || defaultBreakpointData,
    [analysis.overallBreakpoints?.mobile, defaultBreakpointData]
  )
  const tabletData = useMemo(
    () => analysis.overallBreakpoints?.tablet || defaultBreakpointData,
    [analysis.overallBreakpoints?.tablet, defaultBreakpointData]
  )
  const desktopData = useMemo(
    () => analysis.overallBreakpoints?.desktop || defaultBreakpointData,
    [analysis.overallBreakpoints?.desktop, defaultBreakpointData]
  )
  const hasValidData = analysis.overallBreakpoints !== null && analysis.overallBreakpoints !== undefined

  // Get Framer optimization setting
  const framerOptimizationEnabled = getFramerOptimizationSetting()

  // Calculate device-weighted bandwidth (Framer serves different image sizes per device)
  const monthlyEstimate = useMemo(() => {
    if (!hasValidData) {
      return calculateMonthlyBandwidth(0, monthlyPageviews, framerOptimizationEnabled)
    }

    let calculatedBytesPerVisit: number

    if (pages.length === 0) {
      // Fallback: use device-weighted overall breakpoint data
      calculatedBytesPerVisit = calculateDeviceWeightedBandwidth({
        mobile: mobileData,
        tablet: tabletData,
        desktop: desktopData
      })
    } else {
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
      calculatedBytesPerVisit = heaviestPageWeighted + (additionalPages * avgOtherPageBytes)
    }

    // Calculate tiered monthly estimates (realistic + worst-case)
    return calculateMonthlyBandwidth(
      calculatedBytesPerVisit,
      monthlyPageviews,
      framerOptimizationEnabled
    )
  }, [hasValidData, mobileData, tabletData, desktopData, monthlyPageviews, averagePagesPerVisit, pages, framerOptimizationEnabled])

  // Extract values for display
  const monthlyBandwidthGB = monthlyEstimate.realistic / (1024 * 1024 * 1024)
  const worstCaseBandwidthGB = monthlyEstimate.worstCase / (1024 * 1024 * 1024)
  const bandwidthPer1000 = (monthlyEstimate.perVisitorRealistic * 1000) / (1024 * 1024 * 1024)

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty deps = run once on mount

  // Safety check for overallBreakpoints - now after all hooks
  if (!hasValidData) {
    return (
      <div style={{ padding: spacing.lg, color: framerColors.text }}>
        <p>Analysis data is incomplete. Please rescan the project.</p>
      </div>
    )
  }

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
      gap: spacing.md,
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Hero: Monthly Bandwidth - Tiered Estimates */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle
      }}>
        {/* Badge at the top */}
        <div style={{
          display: 'inline-flex',
          marginBottom: spacing.sm
        }}>
          <div style={{
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: riskLevel === 'danger' ? 'var(--status-error-solid)' :
                   riskLevel === 'warning' ? 'var(--status-warning-solid)' :
                   'var(--status-success-solid)',
            backgroundColor: riskLevel === 'danger' ? status.error.bg :
                              riskLevel === 'warning' ? status.warning.bg :
                              status.success.bg,
            padding: `${spacing.xxs} ${spacing.sm}`,
            borderRadius: borders.radius.full,
            whiteSpace: 'nowrap' as const
          }}>
            {riskTitle}
          </div>
        </div>

        {/* Realistic Estimate - Primary */}
        <div style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          lineHeight: typography.lineHeight.tight,
          letterSpacing: typography.letterSpacing.tighter,
          marginBottom: spacing.xxs
        }}>
          ~{monthlyBandwidthGB.toFixed(2)} GB/month
        </div>

        {/* Realistic label */}
        <div style={{
          fontSize: typography.fontSize.xs,
          color: framerColors.textSecondary,
          marginBottom: spacing.md
        }}>
          {BANDWIDTH_CALIBRATION.labels.realistic} • {monthlyPageviews.toLocaleString()} pageviews
        </div>

        {/* Worst Case - Secondary */}
        <div style={{
          paddingTop: spacing.md,
          borderTop: `1px solid ${themeBorders.subtle}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline'
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: framerColors.textSecondary
            }}>
              {worstCaseBandwidthGB.toFixed(2)} GB/month
            </div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: framerColors.textTertiary
            }}>
              {BANDWIDTH_CALIBRATION.labels.worstCase}
            </div>
          </div>
          <InfoTooltip text={`${BANDWIDTH_CALIBRATION.labels.worstCaseSubtext}. Realistic estimate accounts for Framer CDN, browser caching, and responsive images.`} position="left" />
        </div>
      </div>

      {/* Combined: Traffic Estimate + Plan Status */}
      <div style={{
        padding: spacing.lg,
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle
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
            marginBottom: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            Monthly pageviews
            <InfoTooltip text="Total page loads per month. Check Google Analytics or similar." />
          </label>
          <div style={{ position: 'relative' }}>
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
                padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text,
                backgroundColor: surfaces.tertiary,
                border: 'none',
                borderRadius: borders.radius.md,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                appearance: 'none'
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
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              fill="none"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <path
                d="M1 1L4 4L7 1"
                stroke={framerColors.textSecondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
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
            marginBottom: spacing.sm,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            Pages per visit
            <InfoTooltip text="Average pages viewed per session. Typically 2-4 for most sites." />
          </label>
          <div style={{ position: 'relative' }}>
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
                padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text,
                backgroundColor: surfaces.tertiary,
                border: 'none',
                borderRadius: borders.radius.md,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                appearance: 'none'
              }}
            >
              <option value="1.0">Landing only (1.0)</option>
              <option value="2.5">Light (2.5)</option>
              <option value="3.5">Typical (3.5)</option>
              <option value="4.5">Moderate (4.5)</option>
              <option value="6.0">Deep (6.0)</option>
              <option value="custom">Custom</option>
            </select>
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              fill="none"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <path
                d="M1 1L4 4L7 1"
                stroke={framerColors.textSecondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
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
            marginBottom: spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            Plan Status
            <InfoTooltip text="Your Framer plan's monthly bandwidth allowance." />
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value as PlanKey)}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.md}`,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.medium,
                color: framerColors.text,
                backgroundColor: surfaces.tertiary,
                border: 'none',
                borderRadius: borders.radius.md,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                appearance: 'none'
              }}
            >
              {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => (
                <option key={plan} value={plan}>
                  {FRAMER_PLANS[plan].name} - {FRAMER_PLANS[plan].bandwidthGB} GB/month
                </option>
              ))}
            </select>
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              fill="none"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <path
                d="M1 1L4 4L7 1"
                stroke={framerColors.textSecondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

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

      {/* Calculation Breakdown */}
      <div style={{
        backgroundColor: surfaces.secondary,
        borderRadius: borders.radius.lg,
        boxShadow: themeElevation.subtle,
        overflow: 'hidden'
      }}>
        <CollapsibleSection
          title="Calculation breakdown"
          defaultCollapsed={true}
        >
          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: spacing.sm,
            marginBottom: spacing.md
          }}>
            <div style={{
              padding: spacing.md,
              backgroundColor: surfaces.tertiary,
              borderRadius: borders.radius.md
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginBottom: spacing.xs
              }}>
                Data per visit
              </div>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text
              }}>
                {formatBytes(monthlyEstimate.perVisitorRealistic)}
              </div>
            </div>
            <div style={{
              padding: spacing.md,
              backgroundColor: surfaces.tertiary,
              borderRadius: borders.radius.md
            }}>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginBottom: spacing.xs
              }}>
                Per 1K pageviews
              </div>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: framerColors.text
              }}>
                {bandwidthPer1000.toFixed(2)} GB
              </div>
            </div>
          </div>

          {/* Calibration note */}
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            lineHeight: typography.lineHeight.relaxed
          }}>
            Estimate uses {(monthlyEstimate.calibrationFactor * 100).toFixed(0)}% calibration factor
            {framerOptimizationEnabled
              ? ' accounting for Framer CDN, browser caching, and lazy loading.'
              : ' for browser caching only.'}
          </div>
        </CollapsibleSection>

        <div style={{ height: '1px', backgroundColor: themeBorders.subtle }} />

        <CollapsibleSection
          title="Device breakdown"
          defaultCollapsed={true}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}>
            {(['desktop', 'tablet', 'mobile'] as const).map((breakpoint) => {
              const data = analysis.overallBreakpoints[breakpoint]
              const info = getBreakpointInfo(breakpoint)

              return (
                <div
                  key={breakpoint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    backgroundColor: surfaces.tertiary,
                    borderRadius: borders.radius.md
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.medium,
                      color: framerColors.text
                    }}>
                      {info.label}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: framerColors.textTertiary
                    }}>
                      {info.distribution}
                    </div>
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    fontWeight: typography.fontWeight.semibold,
                    color: framerColors.text
                  }}>
                    {formatBytes(data.totalBytes)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{
            fontSize: typography.fontSize.xs,
            color: framerColors.textTertiary,
            marginTop: spacing.md
          }}>
            Framer serves optimized images per device size
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

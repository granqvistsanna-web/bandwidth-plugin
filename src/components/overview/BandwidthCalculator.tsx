import { useState, useMemo } from 'react'
import { formatBytes } from '../../utils/formatBytes'
import type { ProjectAnalysis } from '../../types/analysis'

interface BandwidthCalculatorProps {
  analysis: ProjectAnalysis
}

// Framer plan limits (approximate)
const FRAMER_PLANS = {
  free: {
    name: 'Free',
    bandwidthGB: 1,
    color: 'gray'
  },
  mini: {
    name: 'Mini',
    bandwidthGB: 10,
    color: 'blue'
  },
  basic: {
    name: 'Basic',
    bandwidthGB: 50,
    color: 'green'
  },
  pro: {
    name: 'Pro',
    bandwidthGB: 200,
    color: 'purple'
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

  if (usagePercent > 100) {
    riskLevel = 'danger'
    riskMessage = `⚠️ You'll exceed your ${FRAMER_PLANS[selectedPlan].name} plan monthly limit by ${formatBytes(overageGB * 1024 * 1024 * 1024)}`
  } else if (usagePercent > 80) {
    riskLevel = 'warning'
    riskMessage = `⚡ You're using ${usagePercent.toFixed(0)}% of your ${FRAMER_PLANS[selectedPlan].name} plan monthly bandwidth limit`
  } else {
    riskLevel = 'safe'
    riskMessage = `✓ You're using ${usagePercent.toFixed(0)}% of your ${FRAMER_PLANS[selectedPlan].name} plan monthly bandwidth limit`
  }

  const riskStyles = {
    safe: { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#166534' },
    warning: { backgroundColor: '#fef3c7', borderColor: '#facc15', color: '#92400e' },
    danger: { backgroundColor: '#fee2e2', borderColor: '#f87171', color: '#991b1b' }
  }

  return (
    <div 
      className="rounded-lg p-4"
      style={{
        background: 'linear-gradient(to bottom right, var(--framer-color-bg-secondary), var(--framer-color-bg-tertiary))'
      }}
    >
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--framer-color-text)' }}>Bandwidth Usage Estimator</h3>

      {/* Per 1,000 Pageviews - Prominent Display */}
      <div 
        className="rounded-lg p-3 border-2 mb-4 shadow-sm"
        style={{
          backgroundColor: 'var(--framer-color-bg)',
          borderColor: 'var(--framer-color-tint)'
        }}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <div className="text-xs font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>Per 1,000 Pageviews</div>
          <div className="relative group">
            <svg className="w-3.5 h-3.5 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ backgroundColor: 'var(--framer-color-text)', color: 'var(--framer-color-text-reversed)' }}>
              This is how much bandwidth 1,000 pageviews will use based on your average pages per visit setting.
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {bandwidthPer1000.toFixed(3)} GB
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          Based on {formatBytes(bytesPerVisit)} per visit
        </div>
      </div>

      {/* Average Pages per Visit Input */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <label className="text-xs font-medium block" style={{ color: 'var(--framer-color-text)' }}>
            Average Pages per Visit
          </label>
          <div className="relative group">
            <svg className="w-3.5 h-3.5 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--framer-color-text-tertiary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" style={{ backgroundColor: 'var(--framer-color-text)', color: 'var(--framer-color-text-reversed)' }}>
              Most visitors view 1–3 pages. Adjust based on your site's navigation patterns. Landing page is always included (100%), other pages are weighted by this value.
            </div>
          </div>
        </div>
        <div className="flex gap-1 mb-2">
          {[
            { label: 'Landing only', value: 1.0 },
            { label: 'Light (1.5)', value: 1.5 },
            { label: 'Typical (2.0)', value: 2.0 },
            { label: 'Deep (3.0+)', value: 3.0 }
          ].map(preset => (
            <button
              key={preset.value}
              onClick={() => setAveragePagesPerVisit(preset.value)}
              className="px-2 py-1 text-xs rounded transition-colors"
              style={Math.abs(averagePagesPerVisit - preset.value) < 0.1 ? {
                backgroundColor: 'var(--framer-color-tint)',
                color: 'var(--framer-color-text-reversed)'
              } : {
                backgroundColor: 'var(--framer-color-bg-secondary)',
                color: 'var(--framer-color-text)',
                border: '1px solid var(--framer-color-divider)'
              }}
              onMouseEnter={(e) => {
                if (Math.abs(averagePagesPerVisit - preset.value) >= 0.1) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
                }
              }}
              onMouseLeave={(e) => {
                if (Math.abs(averagePagesPerVisit - preset.value) >= 0.1) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                }
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          type="number"
          value={averagePagesPerVisit}
          onChange={(e) => setAveragePagesPerVisit(Math.max(0.1, parseFloat(e.target.value) || 1))}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--framer-color-divider)',
            backgroundColor: 'var(--framer-color-bg)',
            color: 'var(--framer-color-text)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-tint)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--framer-color-tint-dimmed)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          min="0.1"
          max={pages.length || 10}
          step="0.1"
        />
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          {averagePagesPerVisit === 1 ? 'Visitors only view one page (usually landing page)' :
           averagePagesPerVisit < 2 ? 'Most visitors view 1–2 pages' :
           averagePagesPerVisit < 3 ? 'Visitors typically browse 2–3 pages' :
           'Visitors view multiple pages per visit'}
        </div>
      </div>

      {/* Pageviews Input */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--framer-color-text)' }}>
          Expected Monthly Pageviews
        </label>
        <input
          type="number"
          value={monthlyPageviews}
          onChange={(e) => setMonthlyPageviews(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2"
          style={{
            borderColor: 'var(--framer-color-divider)',
            backgroundColor: 'var(--framer-color-bg)',
            color: 'var(--framer-color-text)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-tint)'
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--framer-color-tint-dimmed)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--framer-color-divider)'
            e.currentTarget.style.boxShadow = 'none'
          }}
          min="1"
          step="1000"
          placeholder="Enter expected pageviews"
        />
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          Common: 1K, 10K, 50K, 100K, 500K, 1M+
        </div>
      </div>

      {/* Monthly Total - Prominent */}
      <div 
        className="rounded-lg p-3 border mb-3"
        style={{
          backgroundColor: 'var(--framer-color-bg)',
          borderColor: 'var(--framer-color-divider)'
        }}
      >
        <div className="text-xs mb-1" style={{ color: 'var(--framer-color-text-secondary)' }}>Bandwidth per Visit</div>
        <div className="text-sm font-medium mb-2" style={{ color: 'var(--framer-color-text)' }}>
          {formatBytes(bytesPerVisit)}
        </div>
        <div className="text-xs mb-1 pt-2 border-t" style={{ borderColor: 'var(--framer-color-divider)', color: 'var(--framer-color-text-secondary)' }}>Estimated Monthly Bandwidth</div>
        <div className="text-xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {monthlyBandwidthGB.toFixed(2)} GB
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          For {monthlyPageviews.toLocaleString()} pageviews
        </div>
      </div>

      {/* Plan Selector */}
      <div className="mb-3">
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--framer-color-text)' }}>
          Your Framer Plan
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className="px-2 py-1.5 text-xs font-medium rounded transition-colors"
              style={selectedPlan === plan ? {
                backgroundColor: 'var(--framer-color-tint)',
                color: 'var(--framer-color-text-reversed)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              } : {
                backgroundColor: 'var(--framer-color-bg)',
                color: 'var(--framer-color-text)',
                border: '1px solid var(--framer-color-divider)'
              }}
              onMouseEnter={(e) => {
                if (selectedPlan !== plan) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedPlan !== plan) {
                  e.currentTarget.style.backgroundColor = 'var(--framer-color-bg)'
                }
              }}
            >
              {FRAMER_PLANS[plan].name}
            </button>
          ))}
        </div>
        <div className="text-xs mt-1 font-medium" style={{ color: 'var(--framer-color-text-secondary)' }}>
          {planLimit} GB/month limit
        </div>
        {monthlyBandwidthGB > 0 && (() => {
          let recommendedPlan: PlanKey | null = null
          if (monthlyBandwidthGB <= FRAMER_PLANS.free.bandwidthGB) recommendedPlan = 'free'
          else if (monthlyBandwidthGB <= FRAMER_PLANS.mini.bandwidthGB) recommendedPlan = 'mini'
          else if (monthlyBandwidthGB <= FRAMER_PLANS.basic.bandwidthGB) recommendedPlan = 'basic'
          else recommendedPlan = 'pro'
          
          if (recommendedPlan && recommendedPlan !== selectedPlan) {
            return (
              <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: 'var(--framer-color-divider)', color: 'var(--framer-color-text-secondary)' }}>
                💡 Based on your estimate, we recommend the <strong>{FRAMER_PLANS[recommendedPlan].name}</strong> plan
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Risk Warning */}
      <div 
        className="rounded-lg p-3 border-2"
        style={riskStyles[riskLevel]}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              {riskLevel === 'danger' && '⚠️ Risk of Overage'}
              {riskLevel === 'warning' && '⚡ Approaching Limit'}
              {riskLevel === 'safe' && '✓ Within Plan Limits'}
            </div>
            <div className="text-xs">
              {riskMessage}
            </div>
            {overageGB > 0 && (
              <div className="text-xs mt-2 font-medium opacity-90">
                Estimated monthly overage: <span className="font-bold">{overageGB.toFixed(2)} GB</span> beyond plan limit
              </div>
            )}
            {usagePercent > 0 && usagePercent <= 100 && (
              <div className="mt-2">
                <div 
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: 'var(--framer-color-bg-tertiary)' }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(usagePercent, 100)}%`,
                      backgroundColor: riskLevel === 'danger' ? '#ef4444' :
                                      riskLevel === 'warning' ? '#eab308' :
                                      '#22c55e'
                    }}
                  />
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {usagePercent.toFixed(1)}% of monthly plan limit used
                </div>
              </div>
            )}
          </div>
        </div>
        {overageGB > 0 && (
          <div className="text-xs mt-2 pt-2 border-t" style={{ borderColor: 'currentColor', opacity: 0.2 }}>
            <strong>Action needed:</strong> Optimize images (see Recommendations) or upgrade to a higher plan to avoid monthly overage charges.
          </div>
        )}
      </div>

      {/* Quick Tips */}
      {usagePercent > 80 && (
        <div 
          className="mt-3 text-xs rounded p-2"
          style={{
            color: 'var(--framer-color-text)',
            backgroundColor: 'var(--framer-color-bg)',
            opacity: 0.9
          }}
        >
          <div className="font-medium mb-1">Quick fixes:</div>
          <ul className="list-disc list-inside space-y-0.5 opacity-90">
            <li>Optimize your largest images (see Recommendations)</li>
            <li>Convert PNGs to WebP format</li>
            <li>Enable Framer's image optimization</li>
          </ul>
        </div>
      )}
    </div>
  )
}

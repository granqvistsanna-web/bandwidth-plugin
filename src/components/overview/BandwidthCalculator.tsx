import { useState } from 'react'
import { formatBytes } from '../../utils/formatBytes'

interface BandwidthCalculatorProps {
  pageWeightBytes: number
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

export function BandwidthCalculator({ pageWeightBytes }: BandwidthCalculatorProps) {
  const [monthlyPageviews, setMonthlyPageviews] = useState(10000)
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('basic')

  const pageWeightMB = pageWeightBytes / (1024 * 1024)
  const pageWeightGB = pageWeightBytes / (1024 * 1024 * 1024)

  // Calculate bandwidth usage
  const bandwidthPer1000 = (pageWeightMB * 1000) / 1024 // GB per 1,000 pageviews
  const monthlyBandwidthGB = pageWeightGB * monthlyPageviews

  const planLimit = FRAMER_PLANS[selectedPlan].bandwidthGB
  const usagePercent = (monthlyBandwidthGB / planLimit) * 100
  const overageGB = Math.max(0, monthlyBandwidthGB - planLimit)

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
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--framer-color-text-secondary)' }}>Per 1,000 Pageviews</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--framer-color-text)' }}>
          {bandwidthPer1000.toFixed(3)} GB
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--framer-color-text-tertiary)' }}>
          Based on {formatBytes(pageWeightBytes)} page weight
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
        <div className="text-xs mb-1" style={{ color: 'var(--framer-color-text-secondary)' }}>Estimated Monthly Bandwidth</div>
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

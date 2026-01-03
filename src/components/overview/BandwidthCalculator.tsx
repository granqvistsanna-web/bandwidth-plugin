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

  const riskColors = {
    safe: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    danger: 'bg-red-50 border-red-200 text-red-800'
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-purple-900 mb-3">Bandwidth Usage Estimator</h3>

      {/* Per 1,000 Pageviews - Prominent Display */}
      <div className="bg-white rounded-lg p-3 border-2 border-purple-300 mb-4 shadow-sm">
        <div className="text-xs font-medium text-purple-700 mb-1">Per 1,000 Pageviews</div>
        <div className="text-2xl font-bold text-purple-900">
          {bandwidthPer1000.toFixed(3)} GB
        </div>
        <div className="text-xs text-purple-600 mt-1">
          Based on {formatBytes(pageWeightBytes)} page weight
        </div>
      </div>

      {/* Pageviews Input */}
      <div className="mb-3">
        <label className="text-xs font-medium text-purple-800 block mb-1">
          Expected Monthly Pageviews
        </label>
        <input
          type="number"
          value={monthlyPageviews}
          onChange={(e) => setMonthlyPageviews(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          min="1"
          step="1000"
          placeholder="Enter expected pageviews"
        />
        <div className="text-xs text-purple-600 mt-1">
          Common: 1K, 10K, 50K, 100K, 500K, 1M+
        </div>
      </div>

      {/* Monthly Total - Prominent */}
      <div className="bg-white rounded-lg p-3 border border-purple-200 mb-3">
        <div className="text-xs text-purple-700 mb-1">Estimated Monthly Bandwidth</div>
        <div className="text-xl font-bold text-purple-900">
          {monthlyBandwidthGB.toFixed(2)} GB
        </div>
        <div className="text-xs text-purple-600 mt-1">
          For {monthlyPageviews.toLocaleString()} pageviews
        </div>
      </div>

      {/* Plan Selector */}
      <div className="mb-3">
        <label className="text-xs font-medium text-purple-800 block mb-1">
          Your Framer Plan
        </label>
        <div className="grid grid-cols-4 gap-1">
          {(Object.keys(FRAMER_PLANS) as PlanKey[]).map((plan) => (
            <button
              key={plan}
              onClick={() => setSelectedPlan(plan)}
              className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                selectedPlan === plan
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-200'
              }`}
            >
              {FRAMER_PLANS[plan].name}
            </button>
          ))}
        </div>
        <div className="text-xs text-purple-700 mt-1 font-medium">
          {planLimit} GB/month limit
        </div>
      </div>

      {/* Risk Warning */}
      <div className={`rounded-lg p-3 border-2 ${riskColors[riskLevel]}`}>
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
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      riskLevel === 'danger' ? 'bg-red-500' :
                      riskLevel === 'warning' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
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
          <div className="text-xs mt-2 pt-2 border-t border-current border-opacity-20">
            <strong>Action needed:</strong> Optimize images (see Recommendations) or upgrade to a higher plan to avoid monthly overage charges.
          </div>
        )}
      </div>

      {/* Quick Tips */}
      {usagePercent > 80 && (
        <div className="mt-3 text-xs text-purple-700 bg-white bg-opacity-50 rounded p-2">
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

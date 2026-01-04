import { framer } from "framer-plugin"
import { useState, useEffect } from "react"
import { SidebarNavigation } from "./components/SidebarNavigation"
import { OverviewPanel } from "./components/overview/OverviewPanel"
import { AssetsPanel } from "./components/assets/AssetsPanel"
import { RecommendationsPanel } from "./components/recommendations/RecommendationsPanel"
import { BandwidthPanel } from "./components/bandwidth/BandwidthPanel"
import { SettingsPanel } from "./components/settings/SettingsPanel"
import { DebugPanel } from "./components/DebugPanel"
import { LoadingSpinner } from "./components/common/LoadingSpinner"
import { ErrorMessage } from "./components/common/ErrorMessage"
import { useAnalysis } from "./hooks/useAnalysis"
import { useTheme } from "./hooks/useTheme"
import { spacing, typography } from "./styles/designTokens"
import { formatTimestamp } from "./utils/formatTimestamp"

framer.showUI({
    position: "top right",
    width: 500,
    height: 600,
    resizable: true,
    minWidth: 400,
    minHeight: 500,
    maxWidth: 900,
    maxHeight: 900,
})

type Tab = 'overview' | 'assets' | 'recommendations' | 'bandwidth' | 'settings' | 'debug'

export function App() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const { 
      analysis, 
      loading, 
      error, 
      runAnalysis, 
      lastScanned, 
      excludedPageIds, 
      togglePageExclusion,
      manualCMSEstimates,
      addManualCMSEstimate,
      updateManualCMSEstimate,
      removeManualCMSEstimate,
      ignoredRecommendationIds,
      ignoreRecommendation,
      unignoreRecommendation
    } = useAnalysis()

    // Initialize theme
    useTheme()

    // Auto-run analysis on mount
    useEffect(() => {
        runAnalysis()
    }, [runAnalysis])

    return (
        <div className="relative h-full w-full" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
            {!loading && !error && (
                <SidebarNavigation 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                  onRefresh={runAnalysis}
                  loading={loading}
                  lastScanned={lastScanned}
                />
            )}

            <div className="w-full h-full flex flex-col pl-16">
                <div className="flex-1 overflow-y-auto">
                    {loading && <LoadingSpinner />}

                    {error && <ErrorMessage error={error} onRetry={runAnalysis} />}

                    {analysis && !loading && !error && (
                        <>
                            {activeTab === 'overview' && (
                                <OverviewPanel
                                    analysis={analysis}
                                    onNavigateToRecommendations={() => setActiveTab('recommendations')}
                                    onNavigateToBandwidth={() => setActiveTab('bandwidth')}
                                    manualCMSEstimates={manualCMSEstimates}
                                    addManualCMSEstimate={addManualCMSEstimate}
                                    updateManualCMSEstimate={updateManualCMSEstimate}
                                    removeManualCMSEstimate={removeManualCMSEstimate}
                                    onRescan={runAnalysis}
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                            {activeTab === 'assets' && (
                                <AssetsPanel
                                    analysis={analysis}
                                    selectedPageId={selectedPageId}
                                    onPageChange={setSelectedPageId}
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                            {activeTab === 'recommendations' && (
                                <RecommendationsPanel
                                    analysis={analysis}
                                    selectedPageId={selectedPageId}
                                    ignoredRecommendationIds={ignoredRecommendationIds}
                                    onIgnoreRecommendation={ignoreRecommendation}
                                    onUnignoreRecommendation={unignoreRecommendation}
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                            {activeTab === 'bandwidth' && (
                                <BandwidthPanel 
                                    analysis={analysis}
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                            {activeTab === 'settings' && (
                                <SettingsPanel 
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                            {activeTab === 'debug' && (
                                <DebugPanel 
                                    analysis={analysis}
                                    lastScanned={lastScanned}
                                    loading={loading}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

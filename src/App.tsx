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
import { spacing } from "./styles/designTokens"

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
    
    // Initialize theme first
    useTheme()
    
    const {
      analysis,
      loading,
      error,
      runAnalysis,
      lastScanned,
      manualCMSEstimates,
      addManualCMSEstimate,
      updateManualCMSEstimate,
      removeManualCMSEstimate,
      ignoredRecommendationIds,
      ignoreRecommendation,
      unignoreRecommendation
    } = useAnalysis()

    // Auto-run analysis on mount
    useEffect(() => {
        runAnalysis()
    }, [runAnalysis])

    return (
        <div style={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--framer-color-bg)'
        }}>
            {!loading && !error && (
                <SidebarNavigation 
                  activeTab={activeTab} 
                  onTabChange={setActiveTab}
                  onRefresh={runAnalysis}
                  loading={loading}
                  lastScanned={lastScanned}
                />
            )}

            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                paddingLeft: '64px' // pl-16 equivalent
            }}>
                <div style={{
                    flex: 1,
                    overflowY: 'auto'
                }}>
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
                                    onNavigateToRecommendations={() => setActiveTab('recommendations')}
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
                    
                    {!loading && !error && !analysis && (
                        <div style={{
                            padding: spacing.lg,
                            color: 'var(--framer-color-text)',
                            textAlign: 'center'
                        }}>
                            <p>No analysis data available. Click rescan to analyze your project.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

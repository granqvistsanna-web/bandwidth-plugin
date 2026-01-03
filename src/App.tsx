import { framer } from "framer-plugin"
import { useState, useEffect } from "react"
import { Header } from "./components/Header"
import { SidebarNavigation } from "./components/SidebarNavigation"
import { OverviewPanel } from "./components/overview/OverviewPanel"
import { AssetsPanel } from "./components/assets/AssetsPanel"
import { RecommendationsPanel } from "./components/recommendations/RecommendationsPanel"
import { DebugPanel } from "./components/DebugPanel"
import { LoadingSpinner } from "./components/common/LoadingSpinner"
import { ErrorMessage } from "./components/common/ErrorMessage"
import { useAnalysis } from "./hooks/useAnalysis"

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

type Tab = 'overview' | 'assets' | 'recommendations' | 'debug'

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
      removeManualCMSEstimate
    } = useAnalysis()

    // Auto-run analysis on mount
    useEffect(() => {
        runAnalysis()
    }, [runAnalysis])

    return (
        <div className="relative h-full w-full" style={{ backgroundColor: 'var(--framer-color-bg)' }}>
            {!loading && !error && (
                <SidebarNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <div className="w-full h-full flex flex-col pl-16">
                <Header onRefresh={runAnalysis} loading={loading} lastScanned={lastScanned} />

                <div className="flex-1 overflow-y-auto">
                    {loading && <LoadingSpinner />}

                    {error && <ErrorMessage error={error} onRetry={runAnalysis} />}

                    {analysis && !loading && !error && (
                        <>
                            {activeTab === 'overview' && (
            <OverviewPanel
              analysis={analysis}
              onNavigateToRecommendations={() => setActiveTab('recommendations')}
              excludedPageIds={excludedPageIds}
              onTogglePageExclusion={togglePageExclusion}
              onRescan={runAnalysis}
              manualCMSEstimates={manualCMSEstimates}
              addManualCMSEstimate={addManualCMSEstimate}
              updateManualCMSEstimate={updateManualCMSEstimate}
              removeManualCMSEstimate={removeManualCMSEstimate}
            />
                            )}
                            {activeTab === 'assets' && (
                                <AssetsPanel
                                    analysis={analysis}
                                    selectedPageId={selectedPageId}
                                    onPageChange={setSelectedPageId}
                                />
                            )}
                            {activeTab === 'recommendations' && (
                                <RecommendationsPanel 
                                    analysis={analysis}
                                    selectedPageId={selectedPageId}
                                />
                            )}
                            {activeTab === 'debug' && (
                                <DebugPanel analysis={analysis} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

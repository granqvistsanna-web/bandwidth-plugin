import { framer } from "framer-plugin"
import { useState, useEffect } from "react"
import { Header } from "./components/Header"
import { TabNavigation } from "./components/TabNavigation"
import { OverviewPanel } from "./components/overview/OverviewPanel"
import { AssetsPanel } from "./components/assets/AssetsPanel"
import { RecommendationsPanel } from "./components/recommendations/RecommendationsPanel"
import { LoadingSpinner } from "./components/common/LoadingSpinner"
import { ErrorMessage } from "./components/common/ErrorMessage"
import { useAnalysis } from "./hooks/useAnalysis"

framer.showUI({
    position: "top right",
    width: 400,
    height: 600,
    resizable: true,
    minWidth: 350,
    minHeight: 500,
    maxWidth: 800,
    maxHeight: 900,
})

type Tab = 'overview' | 'assets' | 'recommendations'

export function App() {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const { analysis, loading, error, runAnalysis } = useAnalysis()

    // Auto-run analysis on mount
    useEffect(() => {
        runAnalysis()
    }, [runAnalysis])

    return (
        <div className="flex flex-col h-full bg-white">
            <Header onRefresh={runAnalysis} loading={loading} />

            {!loading && !error && analysis && (
                <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            )}

            <div className="flex-1 overflow-y-auto">
                {loading && <LoadingSpinner />}

                {error && <ErrorMessage error={error} onRetry={runAnalysis} />}

                {analysis && !loading && !error && (
                    <>
                        {activeTab === 'overview' && (
                            <OverviewPanel analysis={analysis} />
                        )}
                        {activeTab === 'assets' && (
                            <AssetsPanel analysis={analysis} />
                        )}
                        {activeTab === 'recommendations' && (
                            <RecommendationsPanel analysis={analysis} />
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

import { framer } from 'framer-plugin'
import type { Recommendation } from '../../types/analysis'
import { Badge } from '../common/Badge'
import { formatBytes } from '../../utils/formatBytes'

interface RecommendationCardProps {
  recommendation: Recommendation
  allPages?: { pageId: string; pageName: string }[]
}

export function RecommendationCard({ recommendation, allPages = [] }: RecommendationCardProps) {
  const handleNavigate = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Select in Canvas clicked:', {
      nodeId: recommendation.nodeId,
      nodeName: recommendation.nodeName,
      pageId: recommendation.pageId,
      pageName: recommendation.pageName,
      hasNodeId: !!recommendation.nodeId && recommendation.nodeId.trim() !== ''
    })

    // Validate nodeId before attempting selection
    if (!recommendation.nodeId || recommendation.nodeId.trim() === '') {
      framer.notify('This recommendation applies to multiple items and cannot select a specific node', { variant: 'info', durationMs: 3000 })
      return
    }

    try {
      // If recommendation has page info, try to navigate to that page first
      if (recommendation.pageId && recommendation.pageName) {
        try {
          console.log(`Navigating to page: ${recommendation.pageName} (${recommendation.pageId})`)
          
          // Try to get the page node and set it as selection to navigate
          // Framer doesn't have a direct navigateToPage API, but selecting the page node should work
          const pageNode = await framer.getNode(recommendation.pageId)
          
          if (pageNode) {
            // Select the page to navigate to it
            await framer.setSelection([recommendation.pageId])
            // Small delay to allow page navigation to complete
            await new Promise(resolve => setTimeout(resolve, 300))
            console.log(`Navigated to page: ${recommendation.pageName}`)
          } else {
            console.warn(`Page node not found: ${recommendation.pageId}, continuing with node selection`)
            framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
          }
        } catch (pageNavError) {
          console.warn('Page navigation failed, continuing with node selection:', pageNavError)
          // Continue with node selection even if page navigation fails
          framer.notify(`Could not navigate to page "${recommendation.pageName}". Selecting node directly...`, { variant: 'info', durationMs: 2000 })
        }
      }
      
      console.log('Attempting to select node:', {
        nodeId: recommendation.nodeId,
        nodeName: recommendation.nodeName
      })
      
      // Verify the node exists
      const node = await framer.getNode(recommendation.nodeId)
      
      if (!node) {
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been deleted.`, { variant: 'error' })
        return
      }
      
      console.log('Node found:', {
        id: node.id,
        name: node.name,
        type: node.type
      })
      
      // Attempt selection
      await framer.setSelection([recommendation.nodeId])
      
      console.log('Selection successful')
      const pageInfo = recommendation.pageName ? ` on "${recommendation.pageName}"` : ''
      framer.notify(`Selected "${recommendation.nodeName}"${pageInfo} in canvas`, { variant: 'success', durationMs: 2000 })
    } catch (error) {
      console.error('Selection failed:', error)
      
      // Try to get more info about the error
      try {
        const node = await framer.getNode(recommendation.nodeId)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        
        if (node) {
          // Node exists but selection failed - this is unusual
          framer.notify(`Found node but couldn't select it${pageInfo}. Try selecting "${recommendation.nodeName}" manually in the canvas.`, { variant: 'error', durationMs: 4000 })
        } else {
          framer.notify(`Node "${recommendation.nodeName}"${pageInfo} not found. It may have been deleted or renamed.`, { variant: 'error' })
        }
      } catch (getNodeError) {
        console.error('getNode failed:', getNodeError)
        const pageInfo = recommendation.pageName ? ` on page "${recommendation.pageName}"` : ''
        framer.notify(`Could not find "${recommendation.nodeName}"${pageInfo}. Look for it manually in the canvas.`, { variant: 'error', durationMs: 4000 })
      }
    }
  }

  const typeLabels = {
    oversized: 'Oversized',
    format: 'Format',
    compression: 'Compression'
  }

  const canSelect = recommendation.nodeId && recommendation.nodeId.trim() !== ''
  const hasPreview = recommendation.url && !recommendation.url.includes('.svg')

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3 mb-3">
        {/* Preview thumbnail */}
        {hasPreview && (
          <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-50">
            <img
              src={recommendation.url}
              alt={recommendation.nodeName}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        {!hasPreview && (
          <div className="flex-shrink-0 w-16 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-2 flex-wrap">
              <Badge variant={recommendation.priority}>
                {recommendation.priority.toUpperCase()}
              </Badge>
              <Badge variant="default">
                {typeLabels[recommendation.type]}
              </Badge>
            </div>
            <div className="text-sm font-semibold text-green-600 flex-shrink-0">
              Save {formatBytes(recommendation.potentialSavings)}
            </div>
          </div>

          {/* Prominent node name */}
          <div className="mb-1">
            <h4 className="font-semibold text-gray-900 text-base break-words">{recommendation.nodeName || 'Unnamed'}</h4>
            {recommendation.pageName && (
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Page: {recommendation.pageName}</span>
              </div>
            )}
            {!canSelect && (
              <div className="text-xs text-amber-600 mt-1">
                <div className="flex items-center gap-1 mb-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>CMS/Settings image - cannot select in canvas</span>
                </div>
                {recommendation.usedInPages && recommendation.usedInPages.length > 0 && (
                  <div className="text-gray-600 mt-1">
                    Used on: {recommendation.usedInPages.map(p => p.pageName).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
        <div className="text-xs font-medium text-blue-900 mb-1">Action</div>
        <div className="text-sm text-blue-800">{recommendation.actionable}</div>
      </div>

      <button
        onClick={handleNavigate}
        disabled={!canSelect}
        className={`w-full px-4 py-2.5 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
          !canSelect
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
        }`}
        title={!canSelect 
          ? 'This recommendation applies to multiple items' 
          : `Select "${recommendation.nodeName}" in canvas`
        }
      >
        {canSelect ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>
              {recommendation.pageName 
                ? `Select on "${recommendation.pageName}"`
                : `Select "${recommendation.nodeName}"`
              }
            </span>
          </>
        ) : (
          <span>Multiple Items</span>
        )}
      </button>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { framer } from 'framer-plugin'
import type { ProjectAnalysis } from '../types/analysis'
import { debugLog, type DebugLogEntry } from '../utils/debugLog'
import { spacing, typography, borders, surfaces, framerColors, backgrounds } from '../styles/designTokens'
import { StatusIndicator } from './common/StatusIndicator'

interface DebugPanelProps {
  analysis: ProjectAnalysis
  lastScanned?: Date | null
  loading?: boolean
}

export function DebugPanel({ analysis, lastScanned, loading }: DebugPanelProps) {
  const assets = analysis.overallBreakpoints.desktop.assets
  const [logs, setLogs] = useState<DebugLogEntry[]>([])
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    // Update logs periodically
    const interval = setInterval(() => {
      setLogs(debugLog.getRecentLogs(200))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const getLogColor = (level: DebugLogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'success': return 'text-green-400'
      case 'info': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const inspectSelectedNode = async () => {
    try {
      const selection = await framer.getSelection()
      if (selection.length === 0) {
        debugLog.warn('No node selected. Please select a node in the canvas first.')
        framer.notify('Please select a node in the canvas', { variant: 'error' })
        return
      }

      const node = selection[0]
      debugLog.info('=== INSPECTING SELECTED NODE ===', {
        id: node.id,
        name: node.name,
        type: node.type
      })

      // Get full node details
      const fullNode = await framer.getNode(node.id)
      
      // Log full structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fullStructure: any = {}
      for (const key of Object.keys(fullNode)) {
        if (key.startsWith('__')) continue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (fullNode as any)[key]
        if (typeof value === 'string' && value.length > 200) {
          fullStructure[key] = value.substring(0, 200) + '...'
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          fullStructure[key] = {
            type: 'object',
            keys: Object.keys(value).slice(0, 30),
            sample: JSON.stringify(value).substring(0, 500)
          }
        } else if (Array.isArray(value)) {
          fullStructure[key] = {
            type: 'array',
            length: value.length,
            firstItem: value[0] ? (typeof value[0] === 'object' ? Object.keys(value[0]) : String(value[0]).substring(0, 100)) : null
          }
        } else {
          fullStructure[key] = value
        }
      }
      
      debugLog.info('Full selected node structure:', fullStructure)
      framer.notify('Node structure logged to debug panel', { variant: 'success' })
    } catch (error) {
      debugLog.error('Error inspecting selected node', error)
      framer.notify('Error inspecting node', { variant: 'error' })
    }
  }

  return (
    <div style={{ 
      padding: spacing.lg, 
      backgroundColor: backgrounds.page,
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.md
    }}>
      {/* Page Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm
      }}>
        <h1 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.bold,
          color: framerColors.text,
          margin: 0,
          lineHeight: typography.lineHeight.tight
        }}>
          Debug
        </h1>
        <StatusIndicator
          lastScanned={lastScanned}
          loading={loading}
        />
      </div>

      <div
        style={{
          backgroundColor: surfaces.tertiary,
          borderRadius: borders.radius.lg,
          padding: spacing.md
        }}
      >
        <h3 style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          color: framerColors.text,
          marginBottom: spacing.sm
        }}>Debug Info</h3>

        <div className="space-y-2 text-xs font-mono">
          <div>
            <span style={{ color: framerColors.textSecondary }}>Total pages:</span>{' '}
            <span style={{ color: framerColors.text }}>{analysis.totalPages}</span>
          </div>
          <div>
            <span style={{ color: framerColors.textSecondary }}>Total assets found:</span>{' '}
            <span style={{ color: framerColors.text }}>{assets.length}</span>
          </div>
          <div>
            <span style={{ color: framerColors.textSecondary }}>Total bytes:</span>{' '}
            <span style={{ color: framerColors.text }}>
              {analysis.overallBreakpoints.desktop.totalBytes.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: surfaces.tertiary,
          borderRadius: borders.radius.lg,
          padding: spacing.md
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.sm
        }}>
          <h3 style={{
            fontSize: typography.fontSize.md,
            fontWeight: typography.fontWeight.semibold,
            color: framerColors.text
          }}>Debug Logs</h3>
          <div className="flex gap-2 items-center">
            <button
              onClick={inspectSelectedNode}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: 'var(--framer-color-tint-dimmed)',
                color: 'var(--framer-color-tint)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-tint)'
                e.currentTarget.style.color = framerColors.textReversed
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-tint-dimmed)'
                e.currentTarget.style.color = 'var(--framer-color-tint)'
              }}
              title="Inspect the currently selected node in Framer"
            >
              Inspect Selected
            </button>
            <label className="text-xs flex items-center gap-1" style={{ color: framerColors.textSecondary }}>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              Auto-scroll
            </label>
            <button
              onClick={() => {
                debugLog.clear()
                setLogs([])
              }}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{
                backgroundColor: 'var(--framer-color-bg-tertiary)',
                color: framerColors.text
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--framer-color-bg-tertiary)'
              }}
            >
              Clear
            </button>
          </div>
        </div>

        <div
          className="rounded p-3 font-mono text-xs max-h-96 overflow-y-auto"
          style={{ 
            fontSize: '10px',
            backgroundColor: framerColors.text,
            color: framerColors.textReversed
          }}
          ref={(el: HTMLDivElement | null) => {
            if (el && autoScroll) {
              el.scrollTop = el.scrollHeight
            }
          }}
        >
          {logs.length === 0 ? (
            <div style={{ color: framerColors.textReversed, opacity: 0.6, fontStyle: 'italic' }}>No logs yet. Run analysis to see debug information.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span style={{ color: framerColors.textReversed, opacity: 0.6 }}>[{formatTime(log.timestamp)}]</span>{' '}
                <span className={getLogColor(log.level)}>[{log.level.toUpperCase()}]</span>{' '}
                <span style={{ color: framerColors.textReversed }}>{log.message}</span>
                {log.data && (
                  <details className="ml-4 mt-1">
                    <summary className="cursor-pointer" style={{ color: framerColors.textReversed, opacity: 0.7 }}>
                      Details
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap break-all" style={{ color: framerColors.textReversed, opacity: 0.7 }}>
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          backgroundColor: surfaces.tertiary,
          borderRadius: borders.radius.lg,
          padding: spacing.md
        }}
      >
        <h3 style={{
          fontSize: typography.fontSize.md,
          fontWeight: typography.fontWeight.semibold,
          color: framerColors.text,
          marginBottom: spacing.sm
        }}>Assets Detail</h3>

        {assets.length === 0 ? (
          <p className="text-sm" style={{ color: framerColors.textSecondary }}>No assets found</p>
        ) : (
          <div className="space-y-3">
            {assets.slice(0, 10).map((asset, index) => (
              <div key={asset.nodeId} className="border-b pb-2" style={{ borderColor: 'var(--framer-color-divider)' }}>
                <div className="text-xs font-mono space-y-1">
                  <div><span style={{ color: framerColors.textSecondary }}>#{index + 1}</span> <span className="font-semibold" style={{ color: framerColors.text }}>{asset.nodeName}</span></div>
                  <div style={{ color: framerColors.textSecondary }}>
                    Type: <span style={{ color: framerColors.text }}>{asset.type}</span> |
                    Format: <span style={{ color: framerColors.text }}>{asset.format || 'unknown'}</span>
                  </div>
                  <div style={{ color: framerColors.textSecondary }}>
                    Dimensions: <span style={{ color: framerColors.text }}>{asset.dimensions.width} × {asset.dimensions.height}px</span>
                  </div>
                  <div style={{ color: framerColors.textSecondary }}>
                    Estimated: <span className="font-semibold" style={{ color: asset.estimatedBytes === 0 ? '#ef4444' : '#22c55e' }}>
                      {asset.estimatedBytes.toLocaleString()} bytes
                    </span>
                  </div>
                  {asset.url && (
                    <div style={{ color: framerColors.textSecondary }} className="truncate">
                      URL: <span className="text-[10px]" style={{ color: framerColors.text }}>{asset.url}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {assets.length > 10 && (
              <p className="text-xs italic" style={{ color: framerColors.textTertiary }}>
                ...and {assets.length - 10} more assets
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

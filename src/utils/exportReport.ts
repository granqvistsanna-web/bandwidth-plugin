import type { ProjectAnalysis } from '../types/analysis'
import { formatBytes } from './formatBytes'
import { debugLog } from './debugLog'

export function generateMarkdownReport(analysis: ProjectAnalysis): string {
  const desktop = analysis.overallBreakpoints.desktop
  const breakdown = desktop.breakdown
  const totalBytes = desktop.totalBytes
  
  let markdown = `# Bandwidth Report\n\n`
  
  // Summary
  markdown += `## Summary\n\n`
  const totalBytesFormatted = isFinite(totalBytes) && !isNaN(totalBytes) && totalBytes > 0 
    ? formatBytes(totalBytes) 
    : 'Unable to calculate'
  markdown += `- **Total Estimated Size:** ${totalBytesFormatted}\n`
  markdown += `- **Total Assets:** ${desktop.assets.length}\n`
  markdown += `- **Total Pages:** ${analysis.totalPages}\n`
  markdown += `- **Recommendations:** ${analysis.allRecommendations.length}\n\n`
  
  // Breakdown
  markdown += `## Breakdown\n\n`
  const isValidTotal = isFinite(totalBytes) && !isNaN(totalBytes) && totalBytes > 0
  const imagesPercent = isValidTotal ? ((breakdown.images / totalBytes) * 100).toFixed(1) : 'N/A'
  const svgPercent = isValidTotal ? ((breakdown.svg / totalBytes) * 100).toFixed(1) : 'N/A'
  const fontsPercent = isValidTotal ? ((breakdown.fonts / totalBytes) * 100).toFixed(1) : 'N/A'
  const htmlCssPercent = isValidTotal ? ((breakdown.htmlCss / totalBytes) * 100).toFixed(1) : 'N/A'
  
  markdown += `| Category | Size | Percentage |\n`
  markdown += `|----------|------|------------|\n`
  markdown += `| Images | ${formatBytes(breakdown.images)} | ${imagesPercent}% |\n`
  markdown += `| SVG | ${formatBytes(breakdown.svg)} | ${svgPercent}% |\n`
  markdown += `| Fonts | ${formatBytes(breakdown.fonts)} | ${fontsPercent}% |\n`
  markdown += `| HTML/CSS/JS | ${formatBytes(breakdown.htmlCss)} | ${htmlCssPercent}% |\n\n`
  
  // Top 10 Assets
  const topAssets = [...desktop.assets]
    .sort((a, b) => b.estimatedBytes - a.estimatedBytes)
    .slice(0, 10)
  
  if (topAssets.length > 0) {
    markdown += `## Top 10 Assets\n\n`
    markdown += `| Asset | Type | Size | Dimensions |\n`
    markdown += `|-------|------|------|------------|\n`
    
    for (const asset of topAssets) {
      // Format dimensions properly
      let dimensions = 'Unknown'
      if (asset.actualDimensions && asset.actualDimensions.width > 0 && asset.actualDimensions.height > 0) {
        const actualW = Math.round(asset.actualDimensions.width)
        const actualH = Math.round(asset.actualDimensions.height)
        const renderedW = asset.dimensions.width > 0 ? Math.round(asset.dimensions.width) : actualW
        const renderedH = asset.dimensions.height > 0 ? Math.round(asset.dimensions.height) : actualH
        dimensions = `${actualW}×${actualH} → ${renderedW}×${renderedH}px`
      } else if (asset.dimensions.width > 0 && asset.dimensions.height > 0) {
        dimensions = `${Math.round(asset.dimensions.width)}×${Math.round(asset.dimensions.height)}px`
      }
      
      markdown += `| ${asset.nodeName} | ${asset.type.toUpperCase()} | ${formatBytes(asset.estimatedBytes)} | ${dimensions} |\n`
    }
    markdown += `\n`
  }
  
  // Recommendations
  if (analysis.allRecommendations.length > 0) {
    markdown += `## Recommendations\n\n`
    
    const highPriority = analysis.allRecommendations.filter(r => r.priority === 'high')
    const mediumPriority = analysis.allRecommendations.filter(r => r.priority === 'medium')
    const lowPriority = analysis.allRecommendations.filter(r => r.priority === 'low')
    
    if (highPriority.length > 0) {
      markdown += `### High Priority (${highPriority.length})\n\n`
      for (const rec of highPriority) {
        markdown += `- **[HIGH]** ${rec.nodeName}: ${rec.actionable} (Save ${formatBytes(rec.potentialSavings)})\n`
      }
      markdown += `\n`
    }
    
    if (mediumPriority.length > 0) {
      markdown += `### Medium Priority (${mediumPriority.length})\n\n`
      for (const rec of mediumPriority) {
        markdown += `- **[MEDIUM]** ${rec.nodeName}: ${rec.actionable} (Save ${formatBytes(rec.potentialSavings)})\n`
      }
      markdown += `\n`
    }
    
    if (lowPriority.length > 0) {
      markdown += `### Low Priority (${lowPriority.length})\n\n`
      for (const rec of lowPriority) {
        markdown += `- **[LOW]** ${rec.nodeName}: ${rec.actionable} (Save ${formatBytes(rec.potentialSavings)})\n`
      }
      markdown += `\n`
    }
    
    // Total potential savings
    const totalSavings = analysis.allRecommendations.reduce((sum, r) => sum + r.potentialSavings, 0)
    markdown += `### Total Potential Savings\n\n`
    markdown += `**${formatBytes(totalSavings)}** if all recommendations are implemented.\n\n`
  }
  
  // Pages breakdown
  if (analysis.pages.length > 1) {
    markdown += `## Pages Breakdown\n\n`
    markdown += `| Page | Assets | Size |\n`
    markdown += `|------|--------|------|\n`
    
    for (const page of analysis.pages) {
      const pageSize = page.breakpoints.desktop.totalBytes
      markdown += `| ${page.pageName} | ${page.totalAssets} | ${formatBytes(pageSize)} |\n`
    }
    markdown += `\n`
  }
  
  // Footer
  markdown += `---\n\n`
  markdown += `*Report generated by Bandwidth Check Plugin*\n`
  markdown += `*These are estimates based on canvas analysis, not actual build output.*\n`
  
  return markdown
}

export function generateJSONReport(analysis: ProjectAnalysis): string {
  return JSON.stringify(analysis, null, 2)
}

export async function downloadJSON(analysis: ProjectAnalysis, filename: string = 'bandwidth-report.json'): Promise<boolean> {
  try {
    const json = generateJSONReport(analysis)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch (error) {
    debugLog.error('Failed to download JSON:', error)
    return false
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    debugLog.error('Failed to copy to clipboard:', error)
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      debugLog.error('Fallback copy failed:', fallbackError)
      return false
    }
  }
}


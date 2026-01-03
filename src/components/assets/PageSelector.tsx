import type { PageAnalysis } from '../../types/analysis'

export interface PageSelectorProps {
  pages: PageAnalysis[]
  selectedPageId: string | null
  onPageChange: (pageId: string | null) => void
}

export function PageSelector({ pages, selectedPageId, onPageChange }: PageSelectorProps) {
  const selectedPage = pages.find(p => p.pageId === selectedPageId)
  const selectedLabel = selectedPageId === null
    ? 'All pages'
    : selectedPage?.pageName || 'Unknown page'

  return (
    <div className="flex items-center gap-2">
      <label
        className="text-xs font-medium whitespace-nowrap"
        style={{ color: 'var(--framer-color-text-secondary)' }}
      >
        Show assets from:
      </label>
      <select
        value={selectedPageId || ''}
        onChange={(e) => onPageChange(e.target.value || null)}
        className="px-3 py-1.5 rounded-lg text-sm border cursor-pointer min-w-[150px]"
        style={{
          backgroundColor: 'var(--framer-color-bg-secondary)',
          borderColor: 'var(--framer-color-divider)',
          color: 'var(--framer-color-text)',
        }}
      >
        <option value="">All pages ({pages.length})</option>
        {pages.map(page => (
          <option key={page.pageId} value={page.pageId}>
            {page.pageName}
          </option>
        ))}
      </select>
    </div>
  )
}

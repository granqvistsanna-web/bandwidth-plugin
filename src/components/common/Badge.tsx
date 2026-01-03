interface BadgeProps {
  children: React.ReactNode
  variant?: 'high' | 'medium' | 'low' | 'default'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantStyles = {
    high: { backgroundColor: '#fee2e2', color: '#991b1b' },
    medium: { backgroundColor: '#fef3c7', color: '#92400e' },
    low: { backgroundColor: '#dcfce7', color: '#166534' },
    default: { 
      backgroundColor: 'var(--framer-color-bg-tertiary)', 
      color: 'var(--framer-color-text)' 
    }
  }

  return (
    <span className="px-2 py-1 rounded text-xs font-medium" style={variantStyles[variant]}>
      {children}
    </span>
  )
}

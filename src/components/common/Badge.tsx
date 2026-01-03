interface BadgeProps {
  children: React.ReactNode
  variant?: 'high' | 'medium' | 'low' | 'default'
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variantClasses = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}

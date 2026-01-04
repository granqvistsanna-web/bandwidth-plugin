import { Component, ReactNode, ErrorInfo } from 'react'
import { spacing, typography, colors, borders, surfaces, framerColors } from '../styles/designTokens'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          padding: spacing.xl,
          backgroundColor: surfaces.secondary,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            maxWidth: '600px',
            padding: spacing.xl,
            backgroundColor: surfaces.tertiary,
            borderRadius: borders.radius.lg,
            border: `1px solid ${colors.accent.primary}`
          }}>
            <h1 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: framerColors.text,
              marginBottom: spacing.md
            }}>
              ⚠️ Plugin Error
            </h1>

            <p style={{
              fontSize: typography.fontSize.sm,
              color: framerColors.textSecondary,
              marginBottom: spacing.lg,
              lineHeight: typography.lineHeight.normal
            }}>
              The plugin encountered an error and couldn't load properly. Please check the console for details.
            </p>

            <div style={{
              padding: spacing.md,
              backgroundColor: surfaces.secondary,
              borderRadius: borders.radius.md,
              marginBottom: spacing.lg,
              fontFamily: 'monospace',
              fontSize: typography.fontSize.xs,
              color: framerColors.text,
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              <strong>Error:</strong> {this.state.error.message}
            </div>

            {this.state.errorInfo && (
              <details style={{
                fontSize: typography.fontSize.xs,
                color: framerColors.textSecondary,
                marginBottom: spacing.md
              }}>
                <summary style={{
                  cursor: 'pointer',
                  marginBottom: spacing.sm,
                  fontWeight: typography.fontWeight.medium
                }}>
                  Component Stack
                </summary>
                <pre style={{
                  fontSize: typography.fontSize.xs,
                  padding: spacing.sm,
                  backgroundColor: surfaces.secondary,
                  borderRadius: borders.radius.sm,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.errorInfo}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: `${spacing.sm} ${spacing.lg}`,
                backgroundColor: colors.accent.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borders.radius.md,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer'
              }}
            >
              Reload Plugin
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

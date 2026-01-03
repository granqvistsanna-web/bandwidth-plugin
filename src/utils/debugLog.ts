// Simple in-memory debug log for UI display
export interface DebugLogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
}

class DebugLogger {
  private logs: DebugLogEntry[] = []
  private maxLogs = 500

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log(level: DebugLogEntry['level'], message: string, data?: any) {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data
    })
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
    
    // Also log to console for developers
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'
    console[consoleMethod](`[${level.toUpperCase()}]`, message, data || '')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(message: string, data?: any) {
    this.log('info', message, data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(message: string, data?: any) {
    this.log('warn', message, data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(message: string, data?: any) {
    this.log('error', message, data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success(message: string, data?: any) {
    this.log('success', message, data)
  }

  getLogs(): DebugLogEntry[] {
    return [...this.logs]
  }

  clear() {
    this.logs = []
  }

  getRecentLogs(count: number = 100): DebugLogEntry[] {
    return this.logs.slice(-count)
  }
}

export const debugLog = new DebugLogger()


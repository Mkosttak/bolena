'use client'

import React from 'react'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error('[ErrorBoundary]', { error, componentStack: info.componentStack })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <p className="text-destructive font-medium mb-2">Bir hata oluştu</p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <p className="text-muted-foreground text-xs mb-4 max-w-md font-mono">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="text-sm underline text-primary hover:no-underline"
          >
            Tekrar Dene
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

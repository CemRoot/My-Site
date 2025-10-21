import * as Sentry from '@sentry/react';
import { Component, ReactNode } from 'react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary Component with Sentry Integration
 * 
 * Catches React errors and sends them to Sentry
 * Provides a user-friendly fallback UI
 */
class ErrorBoundaryComponent extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', {
        componentStack: errorInfo.componentStack,
      });
      Sentry.captureException(error);
    });

    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Bir şeyler yanlış gitti
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Üzgünüz, beklenmeyen bir hata oluştu. Hata raporlanmıştır ve en kısa sürede düzeltilecektir.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-left">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                Tekrar Dene
              </Button>
              
              <Button
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                Ana Sayfaya Dön
              </Button>
            </div>

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Hata ID: {Sentry.lastEventId()}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Sentry-wrapped Error Boundary
 * Use this in your app to catch and report errors
 */
export const ErrorBoundary = Sentry.withErrorBoundary(ErrorBoundaryComponent, {
  fallback: ({ error, resetError }) => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Beklenmeyen Hata
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error?.message || 'Bir hata oluştu'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={resetError} variant="outline" className="flex-1">
            Tekrar Dene
          </Button>
          
          <Button onClick={() => window.location.href = '/'} className="flex-1">
            Ana Sayfa
          </Button>
        </div>
      </div>
    </div>
  ),
  showDialog: false, // Don't show Sentry dialog
});

export default ErrorBoundary;


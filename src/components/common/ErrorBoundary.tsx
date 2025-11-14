import React from 'react';

type ErrorBoundaryProps = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dashboard error boundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Always include the underlying error message to aid diagnostics.
      const details = (
        <div className="mt-2 text-xs text-red-600 dark:text-red-300">
          {this.state.error?.message ? `Error: ${this.state.error.message}` : 'An unknown error occurred.'}
        </div>
      );
      if (this.props.fallback) {
        return (
          <div>
            {this.props.fallback}
            {details}
          </div>
        );
      }
      return (
        <div className="max-w-2xl mx-auto p-6 bg-red-50 text-red-700 border border-red-200 rounded-md dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm">The dashboard failed to render. Please try reloading the page.</p>
          {details}
        </div>
      );
    }
    return this.props.children;
  }
}
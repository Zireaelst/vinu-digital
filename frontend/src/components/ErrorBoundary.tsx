'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out known MetaMask and extension errors that don't affect app functionality
    const isExtensionError = error.message.includes('ethereum') || 
                             error.message.includes('MetaMask') ||
                             error.message.includes('provider') ||
                             error.stack?.includes('extension');
    
    if (!isExtensionError) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a browser extension error that we can ignore
      const isExtensionError = this.state.error?.message.includes('ethereum') || 
                               this.state.error?.message.includes('MetaMask') ||
                               this.state.error?.message.includes('provider');
      
      if (isExtensionError) {
        // For extension errors, render children normally
        return this.props.children;
      }
      
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Oops! Something went wrong.
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please refresh the page to try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

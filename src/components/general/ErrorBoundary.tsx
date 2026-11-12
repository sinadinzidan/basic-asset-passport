import { Component, type ErrorInfo, type ReactNode } from 'react';

import { RENDER_ERROR_DESCRIPTION, RENDER_ERROR_TITLE } from '../../constants/labels';

import { NeonStage } from './NeonStage';
import { RetryAlert } from './RetryAlert';

type ErrorBoundaryProps = {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {
    onError: (error: Error, info: ErrorInfo): void => {
      console.error('Unexpected render error.', error, info.componentStack);
    },
  };

  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <NeonStage>
          <div className="p-4 sm:p-6 lg:p-8">
            <RetryAlert
              title={RENDER_ERROR_TITLE}
              description={RENDER_ERROR_DESCRIPTION}
              isRetrying={false}
              onRetry={this.handleRetry}
            />
          </div>
        </NeonStage>
      );
    }

    return this.props.children;
  }
}

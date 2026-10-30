import { Button } from '@cognite/aura/components/button';
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { StateMessage } from './StateMessage';

interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <StateMessage
        type="error-generic"
        title="Something went wrong"
        description="The page hit an unexpected error. Your CDF data was not changed."
        action={<Button variant="secondary" onClick={() => this.setState({ hasError: false })}>Try again</Button>}
      />
    );
  }
}

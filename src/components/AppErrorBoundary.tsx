import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keep details out of the UI; monitoring can be added at the deployment boundary.
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen gradient-dark flex items-center justify-center p-6">
          <section className="glass-card max-w-md rounded-2xl p-6 text-center" aria-labelledby="app-error-title">
            <h1 id="app-error-title" className="text-xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please try again. Your saved financial records have not been changed.
            </p>
            <Button className="mt-5" onClick={this.handleRetry}>
              Try again
            </Button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

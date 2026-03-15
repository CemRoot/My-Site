import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service here (e.g. Sentry)
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5 w-full my-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              {this.props.title || 'Something went wrong'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

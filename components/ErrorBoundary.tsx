import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View className="flex-1 bg-slate-50 items-center justify-center px-6 py-10">
          <Text className="text-slate-800 font-bold text-lg text-center mb-2">Something went wrong</Text>
          <Text className="text-slate-500 text-sm text-center mb-6">
            {this.state.error?.message || 'Please try again.'}
          </Text>
          {this.props.onRetry && (
            <Pressable
              onPress={() => this.setState({ hasError: false, error: undefined })}
              className="bg-primary px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Try again</Text>
            </Pressable>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

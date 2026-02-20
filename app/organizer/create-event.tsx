import React from 'react';
import CreateEventScreen from '../../screens/CreateEventScreen';
import { ErrorBoundary } from '../../components/ErrorBoundary';

export default function CreateEventRoute() {
  return (
    <ErrorBoundary onRetry={() => {}}>
      <CreateEventScreen />
    </ErrorBoundary>
  );
}

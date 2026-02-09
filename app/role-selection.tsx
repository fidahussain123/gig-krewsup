import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

const RoleSelectionRoute: React.FC = () => {
  const { isLoggedIn, role, isOnboarded, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/" />;
  }

  if (role && isOnboarded) {
    return <Redirect href={`/${role}`} />;
  }

  return <RoleSelectionScreen />;
};

export default RoleSelectionRoute;

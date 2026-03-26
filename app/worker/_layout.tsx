import React from 'react';
import { Tabs, Redirect, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const WorkerLayout: React.FC = () => {
  const { isLoggedIn, role, isOnboarded, isLoading } = useAuth();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/" />;
  }

  if (!role) {
    return <Redirect href="/role-selection" />;
  }

  if (!isOnboarded && segments[1] !== 'onboarding') {
    return <Redirect href="/worker/onboarding" />;
  }

  if (role !== 'worker') {
    return <Redirect href={`/${role}`} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E94560',
        tabBarInactiveTintColor: '#B8B8D0',
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.3,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#F1F3F8',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
          height: 60 + Math.max(insets.bottom, 12),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="explore" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="chat-bubble-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="account-balance-wallet" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applied',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="bookmark-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="gig/[id]" options={{ href: null }} />
      <Tabs.Screen name="event/[id]" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
    </Tabs>
  );
};

export default WorkerLayout;

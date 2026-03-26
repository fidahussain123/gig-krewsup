import React from 'react';
import { Tabs, Redirect, useSegments } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const CENTER_BUTTON_SIZE = 54;

const OrganizerLayout: React.FC = () => {
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
    return <Redirect href="/organizer/onboarding" />;
  }

  if (role !== 'organizer') {
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
          title: 'Home',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="event-note" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="create-event"
        options={{
          title: 'Create',
          tabBarShowLabel: true,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <Pressable
              {...props}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
              onPress={props.onPress}
            >
              <View
                style={{
                  width: CENTER_BUTTON_SIZE,
                  height: CENTER_BUTTON_SIZE,
                  borderRadius: CENTER_BUTTON_SIZE / 2,
                  backgroundColor: '#E94560',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: -20,
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <MaterialIcons name="add" color="#fff" size={28} />
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 10,
                  marginTop: 4,
                  color: props.focused ? '#E94560' : '#B8B8D0',
                }}
              >
                Create
              </Text>
            </Pressable>
          ),
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="events/[id]" options={{ href: null }} />
      <Tabs.Screen name="workers/[id]" options={{ href: null }} />
    </Tabs>
  );
};

export default OrganizerLayout;

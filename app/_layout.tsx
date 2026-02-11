import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import socketClient from '../lib/socket';
import '../tailwind.css';

const PushRegistration: React.FC = () => {
  const { token, role } = useAuth();

  useEffect(() => {
    if (!token || role !== 'worker') {
      return;
    }

    const register = async () => {
      if (Platform.OS === 'web' || !Device.isDevice) {
        return;
      }
      const permissions = await Notifications.getPermissionsAsync();
      if (permissions.status !== 'granted') {
        const request = await Notifications.requestPermissionsAsync();
        if (request.status !== 'granted') return;
      }
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken?.data) {
        await api.registerDeviceToken(deviceToken.data, Platform.OS);
      }
    };
    register().catch(() => undefined);
  }, [token, role]);

  return null;
};

const CallInviteListener: React.FC = () => {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!socketClient.isConnected()) {
      socketClient.connect(token);
    }

    const unsubscribe = socketClient.onCallInvite((data) => {
      if (!data?.callId) {
        return;
      }
      const conversationId = data.conversationId ? `?conversationId=${data.conversationId}` : '';
      router.push(`/call/${data.callId}${conversationId}`);
    });

    return () => {
      unsubscribe();
    };
  }, [token, router]);

  return null;
};

const RootLayout: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PushRegistration />
          <CallInviteListener />
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;

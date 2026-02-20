// Load .env from project root so we can switch API URL (production vs localhost)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const DEFAULT_API = 'http://51.21.245.127:3001/api';
const DEFAULT_SOCKET = 'http://51.21.245.127:3001/';
const apiUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API).trim();
const socketUrl = (process.env.EXPO_PUBLIC_SOCKET_URL || DEFAULT_SOCKET).trim();
console.log('[KrewsUp] Using API:', apiUrl);

module.exports = {
  expo: {
    name: 'KrewsUp',
    slug: 'krewsup',
    scheme: 'krewsup',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSMicrophoneUsageDescription: 'Voice calls need microphone access.',
      },
    },
    android: {
      permissions: ['RECORD_AUDIO'],
      package: 'com.fidasp.krewsup',
      softwareKeyboardLayoutMode: 'pan',
      // CRITICAL: Allow HTTP (cleartext) so app can reach http://51.21.245.127:3001
      // Without this, Android 9+ blocks all HTTP traffic
      usesCleartextTraffic: true,
    },
    web: {
      bundler: 'metro',
    },
    extra: {
      apiUrl,
      socketUrl,
      eas: {
        projectId: '21f05b5d-b4d1-4ee2-9a99-1be0a5900871',
      },
    },
    plugins: ['@react-native-community/datetimepicker', './plugins/withCleartextTraffic.js'],
  },
};

// Load .env from project root so we can switch API URL (production vs localhost)
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://gig-krewsup.onrender.com/api').trim();
const socketUrl = (process.env.EXPO_PUBLIC_SOCKET_URL || 'https://gig-krewsup.onrender.com/').trim();
console.log('[KrewsUp] Using Render API:', apiUrl);

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
    plugins: ['@react-native-community/datetimepicker'],
  },
};

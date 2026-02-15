/**
 * App config: all API and socket URLs point to Render production.
 * Override via .env (EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SOCKET_URL) if needed.
 */
import Constants from 'expo-constants';

const RENDER_API = 'https://gig-krewsup.onrender.com/api';
const RENDER_SOCKET = 'https://gig-krewsup.onrender.com/';

export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) ??
  RENDER_API;

export const SOCKET_BASE_URL =
  Constants.expoConfig?.extra?.socketUrl ??
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SOCKET_URL) ??
  RENDER_SOCKET;

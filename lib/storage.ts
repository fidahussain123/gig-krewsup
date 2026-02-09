// File Upload via Backend Proxy
// This module handles file uploads through our backend, which proxies to Appwrite
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001/api';

export interface UploadResult {
  success: boolean;
  fileId?: string;
  fileUrl?: string;
  error?: string;
}

export interface UploadAsset {
  uri: string;
  name: string;
  mimeType?: string;
}

export async function uploadFile(file: UploadAsset): Promise<UploadResult> {
  try {
    // Get auth token
    const token = await AsyncStorage.getItem('auth_token');
    
    const formData = new FormData();
    if (Platform.OS === 'web') {
      const blobResponse = await fetch(file.uri);
      const blob = await blobResponse.blob();
      formData.append('file', blob, file.name);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/uploads/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Upload failed' };
    }

    const data = await response.json();
    return { 
      success: true, 
      fileId: data.fileId, 
      fileUrl: data.fileUrl 
    };
  } catch (error: any) {
    console.error('File upload error:', error);
    return { success: false, error: error.message || 'Upload failed' };
  }
}

// Simple function to convert file to base64 for preview (optional)
export async function fileToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:application/octet-stream;base64,${base64}`;
}

// Get file URL from our backend (if needed)
export function getFileUrl(fileId: string): string {
  return `${API_BASE_URL}/uploads/file/${fileId}`;
}

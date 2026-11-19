import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolveBaseUrl = (): string => {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const envUrl = rawUrl ? rawUrl.replace(/\/+$/, '') : undefined;

  // If envUrl is explicitly provided and is a specific remote/LAN host (not localhost), use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // When running on a physical device or emulator where 'localhost' refers to the phone,
  // automatically extract the development machine's IP address from Expo's hostUri
  if (Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri;
    if (hostUri) {
      const hostIp = hostUri.split(':')[0];
      if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
        return `http://${hostIp}:8000`;
      }
    }
  }

  return envUrl || 'http://localhost:8000';
};

export const API_BASE_URL = resolveBaseUrl();
console.log('[Kaizen API] Configured Base URL:', API_BASE_URL);

class ApiClient {
  private token: string | null = null;

  async getToken(): Promise<string | null> {
    if (this.token) return this.token;
    try {
      this.token = await AsyncStorage.getItem('authToken');
      return this.token;
    } catch {
      return null;
    }
  }

  async setToken(token: string | null): Promise<void> {
    this.token = token;
    try {
      if (token) {
        await AsyncStorage.setItem('authToken', token);
      } else {
        await AsyncStorage.removeItem('authToken');
      }
    } catch (e) {
      console.warn('Failed to persist auth token', e);
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401 && token) {
          await this.setToken(null);
        }
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // use fallback status message
        }
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (err: any) {
      if (err.message === 'Network request failed' || err.name === 'TypeError') {
        throw new Error(
          `Cannot reach API server at ${API_BASE_URL}. Ensure the backend is running and on the same Wi-Fi network.`
        );
      }
      throw err;
    }
  }

  get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;

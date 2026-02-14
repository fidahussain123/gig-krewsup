import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;
  private initialized = false;

  constructor() {
    this.init().catch(() => undefined);
  }

  async init() {
    if (this.initialized) return;
    this.token = await AsyncStorage.getItem('auth_token');
    this.initialized = true;
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.initialized) {
      await this.init();
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error: any) {
      console.error('API request failed:', error);
      return { error: error.message || 'Network error' };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.data?.token) {
      await this.setToken(result.data.token);
    }
    return result;
  }

  async getMe() {
    return this.request<{ user: any; profile: any }>('/auth/me');
  }

  async setRole(role: 'organizer' | 'worker') {
    const result = await this.request<{ role: string; token: string }>('/auth/set-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (result.data?.token) {
      await this.setToken(result.data.token);
    }
    return result;
  }

  async completeOnboarding(data: any) {
    return this.request('/auth/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // User endpoints
  async getProfile() {
    return this.request<any>('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateWorkerProfile(data: any) {
    return this.request('/users/worker-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateOrganizerProfile(data: any) {
    return this.request('/users/organizer-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getWalletSummary() {
    return this.request<{ pendingTotal: number }>('/users/wallet-summary');
  }

  async registerDeviceToken(token: string, platform: string) {
    return this.request('/users/device-token', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    });
  }

  // Events endpoints
  async getEvents() {
    return this.request<{ events: any[] }>('/events');
  }

  async getEvent(id: string) {
    return this.request<{ event: any; gigs: any[] }>(`/events/${id}`);
  }

  async createEvent(data: any) {
    return this.request<{ eventId: string }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async browseEvents() {
    return this.request<{ events: any[] }>('/events/browse/all');
  }

  async getNearbyEvents(lat: number, lng: number, radiusKm = 25) {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusKm: String(radiusKm),
    });
    return this.request<{ events: any[] }>(`/events/nearby?${params.toString()}`);
  }

  async applyToEvent(eventId: string, coverLetter?: string) {
    return this.request(`/events/${eventId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    });
  }

  // Gigs endpoints
  async browseGigs() {
    return this.request<{ gigs: any[] }>('/gigs/browse/all');
  }

  async getGig(id: string) {
    return this.request<{ gig: any }>(`/gigs/${id}`);
  }

  async applyToGig(gigId: string, coverLetter?: string) {
    return this.request(`/gigs/${gigId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ coverLetter }),
    });
  }

  async getMyApplications() {
    return this.request<{ applications: any[] }>('/gigs/my/applications');
  }

  // Messages endpoints
  async getConversations() {
    return this.request<{ conversations: any[] }>('/messages/conversations');
  }

  async getMessages(conversationId: string) {
    return this.request<{ messages: any[] }>(`/messages/conversations/${conversationId}`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async startConversation(participantId: string, initialMessage?: string) {
    return this.request<{ conversationId: string }>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId, initialMessage }),
    });
  }

  async getConversation(conversationId: string) {
    return this.request<{ conversation: any; participants: any[] }>(`/messages/conversations/${conversationId}/info`);
  }

  async getEventConversation(eventId: string) {
    return this.request<{ conversationId: string }>(`/events/${eventId}/conversation`);
  }

  async createEventConversation(eventId: string) {
    return this.request<{ conversationId: string }>(`/events/${eventId}/conversation`, {
      method: 'POST',
    });
  }

  async getMyEventApplications() {
    return this.request<{ eventIds: string[] }>('/events/my/applications');
  }

  async getMyEventApplicationsDetails() {
    return this.request<{ applications: any[] }>('/events/my/applications/details');
  }

  // Event applicants endpoints
  async getEventApplicants(eventId: string) {
    return this.request<{ applicants: any[] }>(`/events/${eventId}/applicants`);
  }

  async updateApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
    return this.request(`/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getWorkerProfile(workerId: string) {
    return this.request<{ worker: any; photos: any[] }>(`/users/worker/${workerId}`);
  }

  logout() {
    this.setToken(null);
  }
}

export const api = new ApiClient();
export default api;

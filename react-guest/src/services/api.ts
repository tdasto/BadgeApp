import { Guest, BadgeHolder, ApiResponse } from '../types/Guest';

const API_BASE_URL = 'http://localhost:8080';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createGuest(guest: Partial<Guest>): Promise<ApiResponse<Guest>> {
    return this.request<Guest>('/api-guest-create.php', {
      method: 'POST',
      body: JSON.stringify(guest),
    });
  }

  async updateGuest(id: number, guest: Partial<Guest>): Promise<ApiResponse<Guest>> {
    return this.request<Guest>(`/guest/api-update?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(guest),
    });
  }

  async deleteGuest(id: number): Promise<ApiResponse> {
    return this.request(`/guest/api-delete?id=${id}`, {
      method: 'DELETE',
    });
  }

  async getGuests(params?: any): Promise<ApiResponse<Guest[]>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<Guest[]>(`/api-guest-list.php${queryString}`);
  }

  async checkoutGuest(id: number): Promise<ApiResponse> {
    return this.request(`/guest/api-checkout?id=${id}`, {
      method: 'POST',
    });
  }

  async getBadgeHolder(badgeNumber: number): Promise<ApiResponse<BadgeHolder>> {
    return this.request<BadgeHolder>(`/api-badge-holder.php/${badgeNumber}`);
  }

  async processPayment(paymentData: any): Promise<ApiResponse> {
    return this.request('/payment/charge', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }
}

export const apiService = new ApiService();

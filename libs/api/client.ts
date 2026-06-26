/**
 * Typed fetch client for all API calls
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status,
      }));
      const err: any = new Error(error.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.errors = error.errors;
      throw err;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return this.request<T>(url.pathname + url.search, {
      method: 'GET',
    });
  }

  async post<T, D = any>(path: string, data?: D): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T, D = any>(path: string, data?: D): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T = void>(path: string): Promise<T> {
    return this.request<T>(path, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();

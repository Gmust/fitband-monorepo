import type { User, AuthResponse, LoginDto, RegisterDto } from "../types";
import { apiClient } from "./api";

class AuthService {
  private readonly TOKEN_KEY = "token";
  private readonly USER_KEY = "user";

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.login(data);
    this.setAuth(response.access_token, response.user);
    return response;
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.register(data);
    this.setAuth(response.access_token, response.user);
    return response;
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = "/auth/login";
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();

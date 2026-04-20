import { apiClient } from './api-client';
import { User } from '../../interfaces/user.interface';

interface LoginResponse {
    token: string;
    user: User & { role: string };
}

export const authService = {
    async login(email: string, password: string): Promise<LoginResponse> {
        return await apiClient.post<LoginResponse>('/login', { email, password });
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getToken(): string | null {
        return localStorage.getItem('token');
    },

    getCurrentUser(): (User & { role: string }) | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated(): boolean {
        return !!this.getToken();
    }
};
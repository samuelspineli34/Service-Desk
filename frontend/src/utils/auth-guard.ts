// frontend/src/utils/auth-guard.ts
import { authService } from '../services/api/auth.service';

export const protectRoute = () => {
    // Se não estiver autenticado e não estiver na página de login, manda pro login
    if (!authService.isAuthenticated() && window.location.pathname !== '/login') {
        window.location.href = '/login';
    } 
    // Se estiver autenticado e estiver na página de login, manda pro dashboard
    else if (authService.isAuthenticated() && window.location.pathname === '/login') {
        window.location.href = '/dashboard';
    }
};
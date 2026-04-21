// frontend/src/utils/auth-guard.ts
import { authService } from '../services/api/auth.service';

export const protectRoute = () => {
    const isAuthenticated = authService.isAuthenticated();
    const isLoginPage = window.location.pathname.includes('login');

    // Se não estiver logado e tentar acessar algo que não seja login -> Vai pro login
    if (!isAuthenticated && !isLoginPage) {
        window.location.href = '/login';
        return;
    } 

    // Se já estiver logado e tentar entrar no login -> Vai pro dashboard
    if (isAuthenticated && isLoginPage) {
        window.location.href = '/dashboard';
        return;
    }
};
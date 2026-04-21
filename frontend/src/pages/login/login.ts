import { authService } from '../../services/api/auth.service';
import { Modal } from '../../utils/modal';
import { showLoader, hideLoader } from '../../utils/loaders';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    
    try {
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        showLoader(); 

        // Agora, se os elementos não existirem, ele cai no CATCH e esconde o loader!
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;

        if (!emailInput || !passwordInput) {
            throw new Error('Erro no HTML: Inputs de email ou senha não encontrados pelo ID.');
        }

        const email = emailInput.value;
        const password = passwordInput.value;

        const rememberMe = (document.getElementById('remember') as HTMLInputElement)?.checked;
        if (rememberMe) {
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('savedEmail');
        }

        // Corre corrida: O login vs um timer de 10 segundos
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 10000); // 10s
        });

        const response: any = await Promise.race([
            authService.login(email, password),
            timeoutPromise
        ]);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        window.location.href = '/dashboard';

    } catch (err: any) {
        hideLoader(); // Esconde o loader IMEDIATAMENTE
        submitBtn.disabled = false; // Reativa apenas se der erro
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        
        console.error("Erro capturado:", err); // <-- Isso vai te mostrar o erro real no F12

        if (err.message === 'timeout') {
            Modal.show({
                title: 'Connection Error',
                message: 'The server is taking too long to respond. Please try again.',
                type: 'error'
            });
        } else {
            Modal.show({
                title: 'Access Denied',
                message: err.message || 'The email or password you entered is incorrect.',
                type: 'error'
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Esconde o loader por segurança caso o HTML não tenha o "hidden"
    hideLoader(); 

    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const savedEmail = localStorage.getItem('savedEmail');

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        const rememberMe = document.getElementById('remember') as HTMLInputElement | null;
        if (rememberMe) rememberMe.checked = true;
    }
});
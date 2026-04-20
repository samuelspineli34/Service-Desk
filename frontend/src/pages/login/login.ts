import { authService } from '../../services/api/auth.service';
import { Modal } from '../../utils/modal';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    try {
        const response = await authService.login(email, password);
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        window.location.href = '/dashboard';
    } catch (err) {
        Modal.show({
            title: 'Access Denied',
            message: 'The email or password you entered is incorrect.',
            type: 'error'
        });
    }
});
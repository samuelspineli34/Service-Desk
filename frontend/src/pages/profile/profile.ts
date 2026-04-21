import { initSidebar } from '../../components/sidebar';
import { apiClient } from '../../services/api/api-client';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
protectRoute(); 

async function initProfilePage() {
    initSidebar();

    // 1. Carrega dados do localStorage
    const userJson = localStorage.getItem('user');
    if (!userJson) {
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userJson);

    // 2. Preenche a UI
    document.getElementById('header-name')!.textContent = user.name;
    document.getElementById('header-dept')!.textContent = user.department;
    document.getElementById('user-name')!.textContent = user.name;
    document.getElementById('user-email')!.textContent = user.email;
    document.getElementById('user-role')!.textContent = user.role;

    // Avatar dinâmico usando a API de UI Avatars
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff&size=256&bold=true`;
    (document.getElementById('profile-avatar') as HTMLImageElement).src = avatarUrl;

    // 3. Lógica de troca de senha
    const passwordForm = document.getElementById('password-form') as HTMLFormElement;
    passwordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const oldPassword = (document.getElementById('old-password') as HTMLInputElement).value;
        const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;

        try {
            await apiClient.put('/me/password', { oldPassword, newPassword });
            Modal.show({
                title: 'Security Updated',
                message: 'Your password has been successfully changed.',
                type: 'success'
            }); passwordForm.reset();
        } catch (err: any) {
            Modal.show({
                title: 'Failure',
                message: 'Password update has failed.',
                type: 'error'
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', initProfilePage);
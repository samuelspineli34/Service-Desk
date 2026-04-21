import { initSidebar } from '../../components/sidebar';
import { apiClient } from '../../services/api/api-client';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
import { showLoader, hideLoader } from '../../utils/loaders';

protectRoute();

async function initProfilePage() {
    showLoader(); 

    try {
        initSidebar();

        const userJson = localStorage.getItem('user');
        if (!userJson) {
            window.location.href = '/login';
            return;
        }

        const user = JSON.parse(userJson);

        document.getElementById('header-name')!.textContent = user.name;
        document.getElementById('header-dept')!.textContent = user.department;
        document.getElementById('user-name')!.textContent = user.name;
        document.getElementById('user-email')!.textContent = user.email;
        document.getElementById('user-role')!.textContent = user.role;

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=d97706&color=fff&size=256&bold=true`;
        (document.getElementById('profile-avatar') as HTMLImageElement).src = avatarUrl;

        // --- LÓGICA DE TROCA DE SENHA COM TRAVA DE BOTÃO ---
        const passwordForm = document.getElementById('password-form') as HTMLFormElement;
        
        passwordForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Busca o botão e aplica a trava
            const submitBtn = passwordForm.querySelector('button[type="submit"]') as HTMLButtonElement;
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            
            showLoader(); 

            const oldPassword = (document.getElementById('old-password') as HTMLInputElement).value;
            const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;

            try {
                await apiClient.put('/me/password', { oldPassword, newPassword });
                
                Modal.show({
                    title: 'Security Updated',
                    message: 'Your password has been successfully changed.',
                    type: 'success'
                });
                
                passwordForm.reset();
            } catch (err: any) {
                Modal.show({
                    title: 'Failure',
                    message: 'Password update has failed. Please check your current password.',
                    type: 'error'
                });
            } finally {
                // Reativa o botão e esconde o loader
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                hideLoader(); 
            }
        });

    } catch (e) {
        console.error("Profile load error:", e);
    } finally {
        hideLoader(); 
    }
}

document.addEventListener('DOMContentLoaded', initProfilePage);
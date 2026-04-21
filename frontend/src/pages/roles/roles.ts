import { initSidebar } from '../../components/sidebar';
import { apiClient } from '../../services/api/api-client';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
import { showLoader, hideLoader } from '../../utils/loaders';

protectRoute();

interface Permission { id: string; code: string; description: string; }
interface Role { id: string; name: string; permissions: string[]; }

let availablePermissions: Permission[] = [];

// --- FUNÇÕES DE CONTROLE ---

const closeRoleModal = () => {
    document.getElementById('role-modal')?.classList.add('hidden');
};

const openRoleModal = async (role?: Role) => {
    const modal = document.getElementById('role-modal');
    const title = document.getElementById('modal-title');
    const permissionsContainer = document.getElementById('permissions-list');

    if (availablePermissions.length === 0) {
        availablePermissions = await apiClient.get<Permission[]>('/permissions');
    }

    // Template dos Checkboxes: Fundo branco, borda laranja 2, texto marrom
    permissionsContainer!.innerHTML = availablePermissions.map(p => `
        <label class="flex items-center gap-4 p-5 bg-white border-2 border-orange-100 rounded-2xl cursor-pointer hover:bg-orange-50 hover:border-[#d97706] transition-all group">
            <input type="checkbox" name="permissions" value="${p.code}" ${role?.permissions.includes(p.code) ? 'checked' : ''} 
                   class="w-5 h-5 rounded-lg border-2 border-orange-200 text-[#d97706] focus:ring-[#d97706]">
            <div>
                <p class="font-black text-[#2d1a0f] text-sm uppercase tracking-tighter group-hover:text-[#d97706]">${p.code.replace(/_/g, ' ')}</p>
                <p class="text-[10px] text-[#6b4423]/60 font-bold leading-tight mt-0.5">${p.description}</p>
            </div>
        </label>
    `).join('');

    if (role) {
        title!.textContent = 'Edit Authority';
        (document.getElementById('field-role-id') as HTMLInputElement).value = role.id;
        (document.getElementById('field-role-name') as HTMLInputElement).value = role.name;
    } else {
        title!.textContent = 'New Authority';
        (document.getElementById('role-form') as HTMLFormElement).reset();
        (document.getElementById('field-role-id') as HTMLInputElement).value = '';
    }
    modal?.classList.remove('hidden');
};

(window as any).openRoleModal = openRoleModal;
(window as any).closeRoleModal = closeRoleModal;

// --- RENDERING ---
async function loadRoles() {
    showLoader();
    initSidebar();
    const grid = document.getElementById('roles-grid');
    if (!grid) return;

    try {
        const roles = await apiClient.get<Role[]>('/roles');
        grid.innerHTML = roles.map(role => `
            <div class="osaka-card p-10 rounded-[3.5rem] group animate-in">
                <div class="flex justify-between items-start mb-8">
                    <div class="p-3 bg-orange-50 text-[#d97706] rounded-2xl border border-orange-100">
                        <span class="material-icons-round text-2xl">shield</span>
                    </div>
                    <div class="flex gap-1">
                        <button onclick='window.openRoleModal(${JSON.stringify(role)})' 
                                class="p-2 text-orange-200 hover:text-[#d97706] transition-colors">
                            <span class="material-icons-round text-sm">edit</span>
                        </button>
                    </div>
                </div>
                
                <h3 class="text-2xl font-[900] text-[#2d1a0f] mb-4 tracking-tighter capitalize">${role.name}</h3>
                
                <div class="flex flex-wrap gap-2">
                    ${role.permissions.map(p => `
                        <span class="px-3 py-1 bg-orange-50 text-[#6b4423] text-[9px] font-black rounded-lg border border-orange-100 uppercase tracking-widest">
                            ${p}
                        </span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
    finally {
        hideLoader();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRoles();

    document.getElementById('role-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        const id = (document.getElementById('field-role-id') as HTMLInputElement).value;
        const checkboxes = document.querySelectorAll('input[name="permissions"]:checked');
        const selectedPermissions = Array.from(checkboxes).map((cb: any) => cb.value);

        const data = {
            name: (document.getElementById('field-role-name') as HTMLInputElement).value,
            permissions: selectedPermissions
        };

        try {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            showLoader();

            id ? await apiClient.put(`/roles/${id}`, data) : await apiClient.post('/roles', data);

            closeRoleModal();
            loadRoles();
            Modal.show({ title: 'System Updated', message: 'The authority was saved.', type: 'success' });
        } catch (err) {
            Modal.show({ title: 'Error', message: 'Failed to save role.', type: 'error' });
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            hideLoader();
        }
    });
});
import { initSidebar } from '../../components/sidebar';
import { apiClient } from '../../services/api/api-client';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
protectRoute(); 

interface Permission { id: string; code: string; description: string; }
interface Role { id: string; name: string; permissions: string[]; }

let availablePermissions: Permission[] = [];

// --- FUNÇÕES DE CONTROLE (Locais para o TS não reclamar) ---

const closeRoleModal = () => {
    document.getElementById('role-modal')?.classList.add('hidden');
};

const openRoleModal = async (role?: Role) => {
    const modal = document.getElementById('role-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('role-form') as HTMLFormElement;
    const permissionsContainer = document.getElementById('permissions-list');

    if (availablePermissions.length === 0) {
        availablePermissions = await apiClient.get<Permission[]>('/permissions');
    }

    permissionsContainer!.innerHTML = availablePermissions.map(p => `
        <label class="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group">
            <input type="checkbox" name="permissions" value="${p.code}" ${role?.permissions.includes(p.code) ? 'checked' : ''} 
                   class="w-5 h-5 rounded-lg border-slate-300 text-blue-600">
            <div>
                <p class="font-bold text-slate-800 text-sm group-hover:text-blue-600">${p.code.replace(/_/g, ' ')}</p>
                <p class="text-[10px] text-slate-400 font-medium">${p.description}</p>
            </div>
        </label>
    `).join('');

    if (role) {
        title!.textContent = 'Edit Role';
        (document.getElementById('field-role-id') as HTMLInputElement).value = role.id;
        (document.getElementById('field-role-name') as HTMLInputElement).value = role.name;
    } else {
        title!.textContent = 'Create New Role';
        form.reset();
        (document.getElementById('field-role-id') as HTMLInputElement).value = '';
    }
    modal?.classList.remove('hidden');
};

// --- EXPOSIÇÃO PARA O HTML (Usando window) ---
// Agora o HTML pode usar onclick="window.openRoleModal()"
(window as any).openRoleModal = openRoleModal;
(window as any).closeRoleModal = closeRoleModal;

// --- RENDERING ---
async function loadRoles() {
    initSidebar();
    const grid = document.getElementById('roles-grid');
    if (!grid) return;

    try {
        const roles = await apiClient.get<Role[]>('/roles');
        grid.innerHTML = roles.map(role => `
            <div class="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                <div class="flex justify-between items-start mb-6">
                    <div class="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                        <span class="material-icons-round">shield</span>
                    </div>
                    <div class="flex gap-1">
                        <!-- Usamos single quotes para o JSON não quebrar o HTML -->
                        <button onclick='window.openRoleModal(${JSON.stringify(role)})' class="p-2 text-slate-300 hover:text-blue-600">
                            <span class="material-icons-round text-sm">edit</span>
                        </button>
                    </div>
                </div>
                <h3 class="text-xl font-black text-slate-800 mb-2 capitalize">${role.name}</h3>
                <div class="flex flex-wrap gap-1.5">
                    ${role.permissions.map(p => `
                        <span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded border border-slate-200 uppercase">${p}</span>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRoles();
    
    document.getElementById('role-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (document.getElementById('field-role-id') as HTMLInputElement).value;
        const checkboxes = document.querySelectorAll('input[name="permissions"]:checked');
        const selectedPermissions = Array.from(checkboxes).map((cb: any) => cb.value);

        const data = {
            name: (document.getElementById('field-role-name') as HTMLInputElement).value,
            permissions: selectedPermissions
        };

        try {
            id ? await apiClient.put(`/roles/${id}`, data) : await apiClient.post('/roles', data);
            
            closeRoleModal(); 
            
            loadRoles();
            Modal.show({ title: 'Success', message: 'Role saved successfully.', type: 'success' });
        } catch (err) { 
            Modal.show({ title: 'Error', message: 'Failed to save role.', type: 'error' }); 
        }
    });
});
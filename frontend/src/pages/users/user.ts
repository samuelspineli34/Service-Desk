import { initSidebar } from '../../components/sidebar';
import { userService } from '../../services/api/user.service';
import { User } from '../../interfaces/user.interface';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
import { showLoader, hideLoader } from '../../utils/loaders';

protectRoute();

// 1. Funções globais para o Modal
(window as any).openUserModal = (user?: User) => {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('user-form') as HTMLFormElement;

    if (user) {
        title!.textContent = 'Edit Member';
        (document.getElementById('field-id') as HTMLInputElement).value = user.id.toString();
        (document.getElementById('field-name') as HTMLInputElement).value = user.name;
        (document.getElementById('field-email') as HTMLInputElement).value = user.email;
        (document.getElementById('field-dept') as HTMLInputElement).value = user.department;
    } else {
        title!.textContent = 'New Member';
        form.reset();
        (document.getElementById('field-id') as HTMLInputElement).value = '';
    }
    modal?.classList.remove('hidden');
};

(window as any).closeUserModal = () => {
    document.getElementById('user-modal')?.classList.add('hidden');
};

(window as any).deleteUser = (id: string) => {
    Modal.confirm({
        title: 'Archive Member?',
        message: 'This member will lose access to the system. This can be undone later.',
        type: 'warning',
        confirmText: 'Yes, Archive',
        onConfirm: async () => {
            await userService.deleteUser(id);
            initPage();
            Modal.show({ title: 'Updated', message: 'User moved to archives.', type: 'success' });
        }
    });
};

const renderUserItem = (user: User): string => {
    const userJson = JSON.stringify(user).replace(/'/g, "&apos;");

    return `
        <li class="flex items-center justify-between p-6 bg-white hover:bg-orange-50/30 transition-all group">
            <div class="flex items-center gap-6">
                <!-- Avatar Temático -->
                <div class="w-14 h-14 rounded-2xl bg-orange-50 border-2 border-orange-100 flex items-center justify-center text-[#d97706] font-[900] text-xl shadow-sm">
                    ${user.name.charAt(0)}
                </div>
                <div>
                    <h4 class="font-black text-[#2d1a0f] text-lg tracking-tight">${user.name}</h4>
                    <div class="flex items-center gap-2 mt-0.5">
                        <span class="text-[10px] font-black text-[#d97706] uppercase tracking-widest bg-white border border-orange-100 px-2 py-0.5 rounded-md">${user.department}</span>
                        <p class="text-xs text-[#6b4423]/40 font-bold font-mono">${user.email}</p>
                    </div>
                </div>
            </div>
            <div class="flex gap-3">
                <button onclick='window.openUserModal(${userJson})' 
                        class="p-3 bg-white border-2 border-orange-50 text-orange-200 hover:text-[#d97706] hover:border-orange-100 rounded-2xl shadow-sm transition-all">
                    <span class="material-icons-round text-sm">edit</span>
                </button>
                <button onclick="window.deleteUser('${user.id}')" 
                        class="p-3 bg-white border-2 border-orange-50 text-orange-200 hover:text-red-500 hover:border-red-100 rounded-2xl shadow-sm transition-all">
                    <span class="material-icons-round text-sm">delete</span>
                </button>
            </div>
        </li>
    `;
};

async function initPage() {
    showLoader();
    initSidebar();
    const listElement = document.getElementById('user-list');
    if (!listElement) return;

    try {
        const users = await userService.getAllUsers();
        listElement.innerHTML = users.map(renderUserItem).join('');
    } catch (error) {
        console.error(error);
        listElement.innerHTML = '<p class="p-10 text-center text-orange-300 font-bold italic">No members found in the organization.</p>';
    }
    finally {
        hideLoader();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPage();

    const form = document.getElementById('user-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;

        const id = (document.getElementById('field-id') as HTMLInputElement).value;
        const data = {
            name: (document.getElementById('field-name') as HTMLInputElement).value,
            email: (document.getElementById('field-email') as HTMLInputElement).value,
            department: (document.getElementById('field-dept') as HTMLInputElement).value,
        };

        try {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            showLoader();

            if (id) {
                await userService.updateUser(id, data);
            } else {
                await userService.createUser(data);
            }

            (window as any).closeUserModal();
            initPage();
            Modal.show({ title: 'Success', message: 'Staff records updated.', type: 'success' });
        } catch (err) {
            Modal.show({ title: 'Error', message: 'Could not save member.', type: 'error' });
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            hideLoader();
        }
    });
});
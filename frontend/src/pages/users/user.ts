import { initSidebar } from '../../components/sidebar';
import { userService } from '../../services/api/user.service';
import { User } from '../../interfaces/user.interface';
import { Modal } from '../../utils/modal';

// 1. Funções globais para o Modal (precisam estar no window para o HTML acessar)
(window as any).openUserModal = (user?: User) => {
    const modal = document.getElementById('user-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('user-form') as HTMLFormElement;

    if (user) {
        title!.textContent = 'Edit User';
        (document.getElementById('field-id') as HTMLInputElement).value = user.id.toString();
        (document.getElementById('field-name') as HTMLInputElement).value = user.name;
        (document.getElementById('field-email') as HTMLInputElement).value = user.email;
        (document.getElementById('field-dept') as HTMLInputElement).value = user.department;
    } else {
        title!.textContent = 'Add New User';
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
        title: 'Delete User?',
        message: 'This action cannot be undone. The user will be moved to the archive.',
        type: 'warning',
        confirmText: 'Yes, Delete',
        onConfirm: async () => {
            await userService.deleteUser(id);
            initPage();
            Modal.show({ title: 'Deleted', message: 'User removed successfully.', type: 'success' });
        }
    });
};

const renderUserItem = (user: User): string => {
    // Escapar as aspas do objeto JSON para o botão Edit funcionar
    const userJson = JSON.stringify(user).replace(/'/g, "&apos;");
    
    return `
        <li class="flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-all">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    ${user.name.charAt(0)}
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">${user.name}</h4>
                    <p class="text-xs text-slate-400 font-mono">${user.email}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick='window.openUserModal(${userJson})' class="p-2 text-slate-400 hover:text-blue-600">
                    <span class="material-icons-round">edit</span>
                </button>
                <button onclick="window.deleteUser('${user.id}')" class="p-2 text-slate-400 hover:text-red-600">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </li>
    `;
};


async function initPage() {
    initSidebar();
    const listElement = document.getElementById('user-list');
    if (!listElement) return;

    try {
        const users = await userService.getAllUsers();
        listElement.innerHTML = users.map(renderUserItem).join('');
    } catch (error) {
        console.error(error);
    }
}

// 3. Listener do Formulário
document.addEventListener('DOMContentLoaded', () => {
    initPage();
    
    const form = document.getElementById('user-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (document.getElementById('field-id') as HTMLInputElement).value;
        const data = {
            name: (document.getElementById('field-name') as HTMLInputElement).value,
            email: (document.getElementById('field-email') as HTMLInputElement).value,
            department: (document.getElementById('field-dept') as HTMLInputElement).value,
        };

        if (id) {
            await userService.updateUser(id, data);
        } else {
            await userService.createUser(data);
        }

        (window as any).closeUserModal();
        initPage();
    });
});
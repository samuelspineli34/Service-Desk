import { initSidebar } from '../../components/sidebar';
import { ticketService } from '../../services/api/ticket.service';
import { userService } from '../../services/api/user.service';
import { Ticket } from '../../interfaces/ticket.interface';
import { Modal } from '../../utils/modal';

// --- MODAL LOGIC ---
(window as any).openTicketModal = async (ticket?: Ticket) => {
    const modal = document.getElementById('ticket-modal');
    const userSelect = document.getElementById('field-user') as HTMLSelectElement;

    // Carregar usuários para o select
    const users = await userService.getAllUsers();
    userSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    if (ticket) {
        (document.getElementById('modal-title')!).textContent = 'Edit Ticket';
        (document.getElementById('field-id') as HTMLInputElement).value = ticket.id;
        (document.getElementById('field-title') as HTMLInputElement).value = ticket.title;
        (document.getElementById('field-desc') as HTMLTextAreaElement).value = ticket.description;
        (document.getElementById('field-status') as HTMLSelectElement).value = ticket.status;
        (document.getElementById('field-priority') as HTMLSelectElement).value = ticket.priority;
        userSelect.value = ticket.user_id;
    } else {
        (document.getElementById('modal-title')!).textContent = 'New Ticket';
        (document.getElementById('ticket-form') as HTMLFormElement).reset();
        (document.getElementById('field-id') as HTMLInputElement).value = '';
    }
    modal?.classList.remove('hidden');
};

(window as any).closeTicketModal = () => document.getElementById('ticket-modal')?.classList.add('hidden');

(window as any).deleteTicket = (id: string) => {
    Modal.confirm({
        title: 'Delete Ticket?',
        message: 'This action cannot be undone. The ticket will be moved to the archive.',
        type: 'warning',
        confirmText: 'Yes, Delete',
        onConfirm: async () => {
            await ticketService.deleteTicket(id);
            loadPage();
            Modal.show({ title: 'Deleted', message: 'User removed successfully.', type: 'success' });
        }
    });
};

// --- RENDERING ---
async function loadPage() {
    initSidebar();
    const list = document.getElementById('ticket-list');
    if (!list) return;

    try {
        const tickets = await ticketService.getAllTickets();
        list.innerHTML = tickets.map(t => `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                <td class="px-6 py-4 font-bold text-slate-800">${t.title}</td>
                <td class="px-6 py-4"><span class="text-xs px-2 py-1 rounded bg-slate-100 font-bold">${t.status}</span></td>
                <td class="px-6 py-4"><span class="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold">${t.priority}</span></td>
                <td class="px-6 py-4 text-sm text-slate-600">${t.user_name}</td>
                <td class="px-6 py-4 flex gap-2">
                    <button onclick='window.openTicketModal(${JSON.stringify(t)})' class="text-slate-400 hover:text-blue-600"><span class="material-icons-round">edit</span></button>
                    <button onclick="window.deleteTicket('${t.id}')" class="text-slate-400 hover:text-red-600"><span class="material-icons-round">delete</span></button>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    loadPage();
    document.getElementById('ticket-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = (document.getElementById('field-id') as HTMLInputElement).value;
        const data = {
            title: (document.getElementById('field-title') as HTMLInputElement).value,
            description: (document.getElementById('field-desc') as HTMLTextAreaElement).value,
            status: (document.getElementById('field-status') as HTMLSelectElement).value as 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
            priority: (document.getElementById('field-priority') as HTMLSelectElement).value as 'LOW' | 'MEDIUM' | 'HIGH',
            user_id: (document.getElementById('field-user') as HTMLSelectElement).value
        };
        id ? await ticketService.updateTicket(id, data) : await ticketService.createTicket(data);
        (window as any).closeTicketModal();
        loadPage();
    });
});
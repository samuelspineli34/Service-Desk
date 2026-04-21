import { initSidebar } from '../../components/sidebar';
import { ticketService } from '../../services/api/ticket.service';
import { userService } from '../../services/api/user.service';
import { authService } from '../../services/api/auth.service';
import { apiClient } from '../../services/api/api-client';
import { Ticket } from '../../interfaces/ticket.interface';
import { Modal } from '../../utils/modal';

const currentUser = authService.getCurrentUser();
const isStaff = ['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(currentUser?.role || '');

// --- LOGICA DE AVALIAÇÃO (RATING) ---
function openRatingModal(ticketId: string) {
    const ratingHtml = `
        <div id="rating-modal-container" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            <div class="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center">
                <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-50 text-amber-500 mb-6">
                    <span class="material-icons-round text-3xl">stars</span>
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-2">Rate Service</h3>
                <p class="text-slate-500 font-medium mb-8">How satisfied are you with the resolution?</p>
                
                <div class="flex justify-center gap-2 mb-8">
                    ${[1, 2, 3, 4, 5].map(n => `
                        <button data-star="${n}" class="w-10 h-10 rounded-xl border-2 border-slate-100 hover:border-amber-400 hover:bg-amber-50 text-slate-400 hover:text-amber-600 font-bold transition-all">${n}</button>
                    `).join('')}
                </div>
                <button id="close-rating-modal" class="text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', ratingHtml);

    // Evento para fechar o modal
    document.getElementById('close-rating-modal')?.addEventListener('click', () => {
        document.getElementById('rating-modal-container')?.remove();
    });

    // Evento para cada estrelinha (botão de nota)
    const starButtons = document.querySelectorAll('[data-star]');
    starButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const rating = button.getAttribute('data-star');
            if (rating) {
                try {
                    await apiClient.put(`/ticket/${ticketId}/rate`, { rating: Number(rating) });
                    document.getElementById('rating-modal-container')?.remove();
                    Modal.show({ title: 'Thank you!', message: 'Your feedback was saved.', type: 'success' });
                    loadPage();
                } catch (e) {
                    Modal.show({ title: 'Error', message: 'Could not save rating.', type: 'error' });
                }
            }
        });
    });
}

// --- CRUD MODAL ---
async function openTicketModal(ticket?: Ticket) {
    const modal = document.getElementById('ticket-modal');
    const userSelect = document.getElementById('field-user') as HTMLSelectElement;

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
        if (!isStaff) {
            userSelect.value = currentUser?.id || '';
            document.getElementById('user-assign-container')!.style.display = 'none';
        }
    }
    modal?.classList.remove('hidden');
}

function deleteTicket(id: string) {
    Modal.confirm({
        title: 'Delete Ticket?',
        message: 'This will remove the ticket from active lists.',
        type: 'warning',
        confirmText: 'Yes, Delete',
        onConfirm: async () => {
            await ticketService.deleteTicket(id);
            loadPage();
            Modal.show({ title: 'Deleted', message: 'Ticket removed.', type: 'success' });
        }
    });
}

// Expõe para os botões do HTML que ainda usam onclick puro
(window as any).openTicketModal = openTicketModal;
(window as any).closeTicketModal = () => document.getElementById('ticket-modal')?.classList.add('hidden');

// --- RENDER ---
async function loadPage() {
    initSidebar();
    const list = document.getElementById('ticket-list');
    if (!list) return;

    try {
        const tickets = await ticketService.getAllTickets();
        
        list.innerHTML = tickets.map(t => {
            const canRate = t.status === 'CLOSED' && !t.rating && t.user_id === currentUser?.id;

            return `
                <tr class="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
                    <td class="px-8 py-6">
                        <p class="font-bold text-slate-800">${t.title}</p>
                        <p class="text-[10px] text-slate-400 font-mono uppercase">${t.id.substring(0,8)}</p>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 rounded-lg text-[10px] font-black border uppercase 
                            ${t.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                              t.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'}">
                            ${t.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-3 py-1 rounded-lg text-[10px] font-black border uppercase 
                            ${t.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : 
                              t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-slate-100 text-slate-500 border-slate-200'}">
                            ${t.priority}
                        </span>
                    </td>
                    <td class="px-8 py-6">
                        ${t.rating 
                            ? `<div class="flex text-amber-400 text-xs">${'★'.repeat(t.rating)}</div>` 
                            : canRate 
                                ? `<button data-rate-id="${t.id}" class="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-[10px] font-black hover:bg-amber-100 transition-all uppercase tracking-tighter">Rate Service</button>`
                                : `<span class="text-slate-300 text-[10px] font-bold uppercase italic">Pending</span>`
                        }
                    </td>
                    <td class="px-8 py-6 text-sm text-slate-600 font-bold">${t.user_name}</td>
                    <td class="px-8 py-6 text-right">
                        <div class="flex justify-end gap-2">
                            ${isStaff ? `
                                <button data-edit-id='${JSON.stringify(t)}' class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><span class="material-icons-round text-sm">edit</span></button>
                                <button data-delete-id='${t.id}' class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><span class="material-icons-round text-sm">delete</span></button>
                            ` : `<span class="text-slate-200 material-icons-round text-sm">lock</span>`}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // ATIVAÇÃO DOS EVENTOS SEM ONCLICK (Delegação de Eventos)
        
        // Botões de Avaliar
        document.querySelectorAll('[data-rate-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-rate-id');
                if (id) openRatingModal(id);
            });
        });

        // Botões de Deletar
        document.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-delete-id');
                if (id) deleteTicket(id);
            });
        });

        // Botões de Editar
        document.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ticketData = btn.getAttribute('data-edit-id');
                if (ticketData) openTicketModal(JSON.parse(ticketData));
            });
        });

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
            status: (document.getElementById('field-status') as HTMLSelectElement).value as any,
            priority: (document.getElementById('field-priority') as HTMLSelectElement).value as any,
            user_id: (document.getElementById('field-user') as HTMLSelectElement).value
        };

        try {
            id ? await ticketService.updateTicket(id, data) : await ticketService.createTicket(data);
            document.getElementById('ticket-modal')?.classList.add('hidden');
            loadPage();
            Modal.show({ title: 'Success', message: 'Ticket saved.', type: 'success' });
        } catch (err) {
            Modal.show({ title: 'Error', message: 'Could not save.', type: 'error' });
        }
    });
});
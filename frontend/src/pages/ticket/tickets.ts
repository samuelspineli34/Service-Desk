import { initSidebar } from '../../components/sidebar';
import { ticketService } from '../../services/api/ticket.service';
import { userService } from '../../services/api/user.service';
import { authService } from '../../services/api/auth.service';
import { apiClient } from '../../services/api/api-client';
import { Ticket } from '../../interfaces/ticket.interface';
import { Modal } from '../../utils/modal';
import { protectRoute } from '../../utils/auth-guard';
import { showLoader, hideLoader } from '../../utils/loaders';

protectRoute();

const currentUser = authService.getCurrentUser();
const isStaff = ['ADMIN', 'MANAGER', 'TECHNICIAN'].includes(currentUser?.role || '');

// --- LOGICA DE AVALIAÇÃO (RATING) ---
function openRatingModal(ticketId: string) {
    const ratingHtml = `
        <div id="rating-modal-container" class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div class="fixed inset-0 bg-[#2d1a0f]/60 backdrop-blur-md"></div>
            <div class="relative bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-10 text-center border-2 border-orange-100">
                <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-[2rem] bg-orange-50 text-[#d97706] mb-6 border-2 border-orange-100">
                    <span class="material-icons-round text-4xl">stars</span>
                </div>
                <h3 class="text-2xl font-[900] text-[#2d1a0f] mb-2">Rate Service</h3>
                <p class="text-[#6b4423]/60 font-bold mb-8 text-sm">How satisfied are you with the resolution?</p>
                
                <div class="flex justify-center gap-2 mb-10">
                    ${[1, 2, 3, 4, 5].map(n => `
                        <button data-star="${n}" class="w-12 h-12 rounded-2xl border-2 border-orange-50 bg-white text-[#6b4423] hover:border-[#d97706] hover:bg-orange-50 font-black transition-all">${n}</button>
                    `).join('')}
                </div>
                <button id="close-rating-modal" class="text-[#6b4423]/40 font-black uppercase text-[10px] tracking-widest hover:text-[#d97706] transition-colors">Cancel</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', ratingHtml);

    document.getElementById('close-rating-modal')?.addEventListener('click', () => {
        document.getElementById('rating-modal-container')?.remove();
    });

    const starButtons = document.querySelectorAll('[data-star]');
    starButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const rating = button.getAttribute('data-star');
            if (rating) {
                try {
                    await ticketService.rateTicket(ticketId, Number(rating));
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
    const statusField = document.getElementById('field-status') as HTMLSelectElement;
    const statusContainer = document.getElementById('status-container');
    const auditSection = document.getElementById('audit-section');
    const historyContainer = document.getElementById('ticket-history-list');
    const resContainer = document.getElementById('resolution-container');
    const resField = document.getElementById('field-resolution') as HTMLTextAreaElement;
    const userContainer = document.getElementById('user-assign-container');

    if (historyContainer) historyContainer.innerHTML = '<div class="p-10 text-center text-[#6b4423]/40 text-xs font-bold uppercase tracking-widest animate-pulse">Consulting archives...</div>';

    const users = await userService.getAllUsers();
    userSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    if (ticket) {
        // MODO EDIÇÃO
        (document.getElementById('modal-title')!).textContent = 'Modify Ticket';
        (document.getElementById('field-id') as HTMLInputElement).value = ticket.id;
        (document.getElementById('field-title') as HTMLInputElement).value = ticket.title;
        (document.getElementById('field-desc') as HTMLTextAreaElement).value = ticket.description;
        statusField.value = ticket.status;
        (document.getElementById('field-priority') as HTMLSelectElement).value = ticket.priority;
        userSelect.value = ticket.user_id;
        resField.value = ticket.resolution || '';

        // Regras de visibilidade conforme o cargo
        if (!isStaff) {
            statusContainer?.classList.add('hidden');
            userContainer?.classList.add('hidden');
        } else {
            statusContainer?.classList.remove('hidden');
            userContainer?.classList.remove('hidden');
        }

        // Resolução só aparece se estiver fechado
        ticket.status === 'CLOSED' ? resContainer?.classList.remove('hidden') : resContainer?.classList.add('hidden');

        auditSection?.classList.remove('hidden');
        loadTicketHistory(ticket.id);
    } else {
        // MODO CRIAÇÃO
        (document.getElementById('modal-title')!).textContent = 'New Ticket';
        (document.getElementById('ticket-form') as HTMLFormElement).reset();
        (document.getElementById('field-id') as HTMLInputElement).value = '';
        
        statusField.value = 'OPEN';
        auditSection?.classList.add('hidden');
        resContainer?.classList.add('hidden');

        if (!isStaff) {
            statusContainer?.classList.add('hidden');
            userContainer?.classList.add('hidden');
            userSelect.value = currentUser?.id || '';
        } else {
            statusContainer?.classList.remove('hidden');
            userContainer?.classList.remove('hidden');
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

(window as any).openTicketModal = openTicketModal;
(window as any).closeTicketModal = () => document.getElementById('ticket-modal')?.classList.add('hidden');

// --- RENDER ---
async function loadPage() {
    showLoader();
    initSidebar();

    const list = document.getElementById('ticket-list');
    if (!list) return;

    try {
        const tickets = await ticketService.getAllTickets();

        list.innerHTML = tickets.map(t => {
            const canRate = t.status === 'CLOSED' && !t.rating && t.user_id === currentUser?.id;

            const resolutionHtml = t.resolution ? `
                <div class="mt-4 p-4 bg-orange-50/50 rounded-2xl border-2 border-orange-100 max-w-md animate-in">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-icons-round text-[16px] text-[#d97706]">verified</span>
                        <span class="text-[9px] font-black text-[#d97706] uppercase tracking-[0.2em]">Official Resolution</span>
                    </div>
                    <p class="text-xs text-[#2d1a0f] leading-relaxed font-bold italic">"${t.resolution}"</p>
                </div>
            ` : '';

            return `
                <tr class="hover:bg-white transition-colors group">
                    <td class="px-8 py-8 align-top">
                        <div class="flex flex-col">
                            <p class="font-black text-[#2d1a0f] text-base tracking-tight">${t.title}</p>
                            <p class="text-[10px] text-orange-300 font-bold uppercase mt-1 tracking-widest">${t.id.substring(0, 8)}</p>
                            ${resolutionHtml}
                        </div>
                    </td>
                    <td class="px-8 py-8 align-top">
                        <span class="px-3 py-1.5 rounded-lg text-[10px] font-black border-2 uppercase tracking-tighter
                            ${t.status === 'CLOSED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            t.status === 'IN_PROGRESS' ? 'bg-orange-50 text-[#d97706] border-orange-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'}">
                            ${t.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td class="px-8 py-8 align-top">
                        <span class="px-3 py-1.5 rounded-lg text-[10px] font-black border-2 uppercase tracking-tighter
                            ${t.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-100' :
                            t.priority === 'MEDIUM' ? 'bg-orange-50 text-[#d97706] border-orange-100' :
                                'bg-slate-50 text-slate-600 border-slate-200'}">
                            ${t.priority}
                        </span>
                    </td>
                    <td class="px-8 py-8 align-top">
                        ${t.rating
                            ? `<div class="flex text-[#d97706] gap-0.5">${'★'.repeat(t.rating)}</div>`
                            : canRate
                                ? `<button data-rate-id="${t.id}" class="px-4 py-2 bg-orange-100 text-[#d97706] border-2 border-orange-200 rounded-xl text-[9px] font-black hover:bg-[#d97706] hover:text-white transition-all uppercase tracking-widest">Rate Now</button>`
                                : `<span class="text-orange-200 text-[9px] font-black uppercase tracking-widest italic">Pending</span>`
                        }
                    </td>
                    <td class="px-8 py-8 align-top text-xs text-[#6b4423] font-black uppercase tracking-tighter">${t.user_name}</td>
                    <td class="px-8 py-8 align-top text-right">
                        <div class="flex justify-end gap-3">
                            ${isStaff ? `
                                <button data-edit-id='${JSON.stringify(t)}' class="p-2.5 bg-white border-2 border-orange-50 text-orange-200 hover:text-[#d97706] hover:border-orange-100 rounded-2xl shadow-sm transition-all">
                                    <span class="material-icons-round text-sm">edit</span>
                                </button>
                                <button data-delete-id='${t.id}' class="p-2.5 bg-white border-2 border-orange-50 text-orange-200 hover:text-red-500 hover:border-red-100 rounded-2xl shadow-sm transition-all">
                                    <span class="material-icons-round text-sm">delete</span>
                                </button>
                            ` : `<span class="p-2 text-orange-100 material-icons-round text-sm">lock</span>`}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('[data-rate-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-rate-id');
                if (id) openRatingModal(id);
            });
        });

        document.querySelectorAll('[data-delete-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-delete-id');
                if (id) deleteTicket(id);
            });
        });

        document.querySelectorAll('[data-edit-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                const ticketData = btn.getAttribute('data-edit-id');
                if (ticketData) openTicketModal(JSON.parse(ticketData));
            });
        });

    } catch (e) { console.error(e); }
    finally {
        hideLoader();
    }
}

async function loadTicketHistory(ticketId: string) {
    const container = document.getElementById('ticket-history-list');
    if (!container) return;

    try {
        const history = await ticketService.getHistory(ticketId);

        container.innerHTML = history.map(log => {
            const icon = log.action.includes('STATUS') ? 'sync' : 'priority_high';
            const iconColor = log.action.includes('STATUS') ? 'text-blue-500' : 'text-[#d97706]';

            return `
                <div class="relative pl-6 pb-8 border-l-2 border-orange-100 last:border-0">
                    <div class="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-white border-2 border-orange-100 flex items-center justify-center shadow-sm">
                        <span class="material-icons-round text-[10px] ${iconColor}">${icon}</span>
                    </div>
                    <div class="text-xs">
                        <p class="text-[#2d1a0f] font-black uppercase tracking-tighter mb-1">${log.user}</p>
                        <p class="text-[#6b4423]/70 font-bold leading-relaxed">
                            Changed <span class="text-[#2d1a0f] font-black">${log.action.replace('_CHANGE', '').toLowerCase()}</span> 
                            from <span class="text-[#6b4423]/40 line-through">${log.old}</span> 
                            to <span class="text-[#d97706] font-black">${log.new}</span>
                        </p>
                        <p class="text-[10px] text-orange-300 font-bold mt-2 uppercase tracking-widest">${log.date}</p>
                    </div>
                </div>
            `;
        }).join('') || '<div class="text-center py-10 text-orange-200 text-[10px] font-black uppercase tracking-[0.2em] italic">No activity recorded.</div>';
    } catch (e) {
        container.innerHTML = '<p class="text-red-400 text-xs text-center font-bold p-4">History unavailable.</p>';
    }
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
            user_id: (document.getElementById('field-user') as HTMLSelectElement).value,
            resolution: (document.getElementById('field-resolution') as HTMLTextAreaElement).value
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

    document.getElementById('field-status')?.addEventListener('change', (e) => {
        const status = (e.target as HTMLSelectElement).value;
        const resContainer = document.getElementById('resolution-container');
        status === 'CLOSED' ? resContainer?.classList.remove('hidden') : resContainer?.classList.add('hidden');
    });
});
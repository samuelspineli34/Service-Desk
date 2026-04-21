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
    const auditSection = document.getElementById('audit-section'); // Seleciona a nova aba de log
    const historyContainer = document.getElementById('ticket-history-list');
    const resContainer = document.getElementById('resolution-container');
    const resField = document.getElementById('field-resolution') as HTMLTextAreaElement;

    // Mostra o loader interno se necessário ou limpa o histórico anterior
    if (historyContainer) historyContainer.innerHTML = '<div class="p-10 text-center text-slate-400 text-xs">Loading history...</div>';

    const users = await userService.getAllUsers();
    userSelect.innerHTML = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    if (ticket) {
        // MODO EDIÇÃO
        (document.getElementById('modal-title')!).textContent = 'Edit Ticket';
        (document.getElementById('field-id') as HTMLInputElement).value = ticket.id;
        (document.getElementById('field-title') as HTMLInputElement).value = ticket.title;
        (document.getElementById('field-desc') as HTMLTextAreaElement).value = ticket.description;
        (document.getElementById('field-status') as HTMLSelectElement).value = ticket.status;
        (document.getElementById('field-priority') as HTMLSelectElement).value = ticket.priority;
        userSelect.value = ticket.user_id;
        resField.value = ticket.resolution || '';

        // Se já estiver fechado, mostra a resolução
        if (ticket.status === 'CLOSED') {
            resContainer?.classList.remove('hidden');
        } else {
            resContainer?.classList.add('hidden');
        }

        // --- Lógica da Auditoria ---
        auditSection?.classList.remove('hidden'); // Mostra a coluna da direita
        loadTicketHistory(ticket.id); // Chama a função que você já tem no código
    } else {
        // MODO CRIAÇÃO
        (document.getElementById('modal-title')!).textContent = 'New Ticket';
        (document.getElementById('ticket-form') as HTMLFormElement).reset();
        (document.getElementById('field-id') as HTMLInputElement).value = '';

        auditSection?.classList.add('hidden'); // Esconde a coluna da direita em tickets novos

        if (!isStaff) {
            userSelect.value = currentUser?.id || '';
            const container = document.getElementById('user-assign-container');
            if (container) container.style.display = 'none';
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
    showLoader();
    initSidebar();

    const list = document.getElementById('ticket-list');
    if (!list) return;

    try {
        const tickets = await ticketService.getAllTickets();

        list.innerHTML = tickets.map(t => {
            const canRate = t.status === 'CLOSED' && !t.rating && t.user_id === currentUser?.id;

            // Bloco de Resolução com Alto Contraste
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
    finally {
        hideLoader();
    }
}

async function loadTicketHistory(ticketId: string) {
    const container = document.getElementById('ticket-history-list');
    if (!container) return;

    try {
        const history = await apiClient.get<any[]>(`/ticket/${ticketId}/history`);

        container.innerHTML = history.map(log => {
            // Ícones dinâmicos conforme o tipo de alteração
            const icon = log.action.includes('STATUS') ? 'sync' : 'priority_high';
            const iconColor = log.action.includes('STATUS') ? 'text-blue-500' : 'text-amber-500';

            return `
                <div class="relative pl-6 pb-6 border-l-2 border-slate-100 last:border-0">
                    <!-- Dot do Indicador -->
                    <div class="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                        <span class="material-icons-round text-[10px] ${iconColor}">${icon}</span>
                    </div>
                    
                    <div class="text-xs">
                        <p class="text-slate-800 font-black uppercase tracking-tighter mb-1">${log.user}</p>
                        <p class="text-slate-500 font-medium leading-relaxed">
                            Changed <span class="text-slate-900 font-bold">${log.action.replace('_CHANGE', '').toLowerCase()}</span> 
                            from <span class="text-slate-400 line-through">${log.old}</span> 
                            to <span class="text-blue-600 font-bold">${log.new}</span>
                        </p>
                        <p class="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-widest">${log.date}</p>
                    </div>
                </div>
            `;
        }).join('') || '<div class="text-center py-10 text-slate-300 text-xs italic font-medium">No activity recorded for this ticket.</div>';
    } catch (e) {
        container.innerHTML = '<p class="text-red-400 text-xs text-center p-4">Error loading activity log.</p>';
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


    // Escutador para mudanças no Select de Status dentro do DOMContentLoaded
    document.getElementById('field-status')?.addEventListener('change', (e) => {
        const status = (e.target as HTMLSelectElement).value;
        const resContainer = document.getElementById('resolution-container');
        if (status === 'CLOSED') {
            resContainer?.classList.remove('hidden');
        } else {
            resContainer?.classList.add('hidden');
        }
    });

});
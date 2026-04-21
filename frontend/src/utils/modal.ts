type ModalType = 'success' | 'error' | 'info' | 'warning';

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    onConfirm?: () => void;
}

export const Modal = {
    show({ title, message, type = 'info', confirmText = 'Entendido' }: ModalOptions) {
        this._inject(title, message, type, confirmText, false);
    },

    confirm({ title, message, type = 'warning', confirmText = 'Confirmar', onConfirm }: ModalOptions) {
        this._inject(title, message, type, confirmText, true, onConfirm);
    },

    _inject(title: string, message: string, type: ModalType, confirmText: string, isConfirm: boolean, onConfirm?: () => void) {
        // Remove modal anterior se existir
        const oldModal = document.getElementById('global-modal-container');
        if (oldModal) oldModal.remove();

        // Configuração de Cores Osaka High-Contrast
        const colors = {
            success: { 
                bg: 'bg-emerald-50', 
                text: 'text-emerald-600', 
                icon: 'check_circle', 
                border: 'border-emerald-100' 
            },
            error: { 
                bg: 'bg-red-50', 
                text: 'text-red-600', 
                icon: 'dangerous', 
                border: 'border-red-100' 
            },
            warning: { 
                bg: 'bg-orange-50', 
                text: 'text-[#d97706]', 
                icon: 'warning', 
                border: 'border-orange-100' 
            },
            info: { 
                bg: 'bg-blue-50', 
                text: 'text-blue-600', 
                icon: 'info', 
                border: 'border-blue-100' 
            }
        };

        const config = colors[type];

        const modalHtml = `
        <div id="global-modal-container" class="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <!-- Backdrop: Marrom Café com desfoque -->
            <div class="fixed inset-0 bg-[#2d1a0f]/60 backdrop-blur-md"></div>
            
            <!-- Card: Bubbly Style com Borda Reforçada -->
            <div class="relative bg-white w-full max-w-sm rounded-[3.5rem] shadow-[0_32px_64px_-12px_rgba(69,26,3,0.3)] p-10 border-2 border-orange-100 transform animate-in zoom-in-95 duration-200">
                <div class="text-center">
                    <!-- Ícone em Container Arredondado -->
                    <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-[2rem] ${config.bg} ${config.text} border-2 ${config.border} mb-6 shadow-sm">
                        <span class="material-icons-round text-4xl">${config.icon}</span>
                    </div>
                    
                    <h3 class="text-2xl font-[900] text-[#2d1a0f] mb-3 tracking-tight">${title}</h3>
                    <p class="text-[#6b4423]/70 font-bold leading-relaxed mb-10 text-sm">${message}</p>
                </div>

                <div class="flex flex-col gap-3">
                    <button id="modal-confirm" class="w-full py-4 bg-[#1e130c] hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em]">
                        ${confirmText}
                    </button>
                    
                    ${isConfirm ? `
                        <button id="modal-cancel" class="w-full py-3 text-[#6b4423]/40 font-black hover:text-[#d97706] transition-colors uppercase text-[10px] tracking-widest">
                            Cancelar
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const close = () => {
            const container = document.getElementById('global-modal-container');
            container?.classList.add('opacity-0');
            setTimeout(() => container?.remove(), 300);
        };

        document.getElementById('modal-confirm')?.addEventListener('click', () => {
            if (onConfirm) onConfirm();
            close();
        });

        document.getElementById('modal-cancel')?.addEventListener('click', close);
    }
};
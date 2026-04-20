type ModalType = 'success' | 'error' | 'info' | 'warning';

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    onConfirm?: () => void;
}

export const Modal = {
    show({ title, message, type = 'info', confirmText = 'OK' }: ModalOptions) {
        this._inject(title, message, type, confirmText, false);
    },

    confirm({ title, message, type = 'warning', confirmText = 'Confirm', onConfirm }: ModalOptions) {
        this._inject(title, message, type, confirmText, true, onConfirm);
    },

    _inject(title: string, message: string, type: ModalType, confirmText: string, isConfirm: boolean, onConfirm?: () => void) {
        // Remove modal anterior se existir
        const oldModal = document.getElementById('global-modal-container');
        if (oldModal) oldModal.remove();

        const colors = {
            success: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'check_circle', btn: 'bg-emerald-600' },
            error: { bg: 'bg-red-50', text: 'text-red-600', icon: 'error', btn: 'bg-red-600' },
            warning: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'warning', btn: 'bg-amber-600' },
            info: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'info', btn: 'bg-blue-600' }
        };

        const config = colors[type];

        const modalHtml = `
        <div id="global-modal-container" class="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <!-- Backdrop -->
            <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
            
            <!-- Card -->
            <div class="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200">
                <div class="text-center">
                    <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl ${config.bg} ${config.text} mb-6">
                        <span class="material-icons-round text-3xl">${config.icon}</span>
                    </div>
                    <h3 class="text-2xl font-black text-slate-900 mb-2">${title}</h3>
                    <p class="text-slate-500 font-medium leading-relaxed mb-8">${message}</p>
                </div>

                <div class="flex gap-3">
                    ${isConfirm ? `
                        <button id="modal-cancel" class="flex-1 px-4 py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Cancel</button>
                    ` : ''}
                    <button id="modal-confirm" class="flex-1 px-4 py-3 ${config.btn} text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95">
                        ${confirmText}
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Lógica dos botões
        const close = () => document.getElementById('global-modal-container')?.remove();

        document.getElementById('modal-confirm')?.addEventListener('click', () => {
            close();
            if (onConfirm) onConfirm();
        });

        document.getElementById('modal-cancel')?.addEventListener('click', close);
    }
};
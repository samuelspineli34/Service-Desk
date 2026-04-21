export function initSidebar() {
    const userJson = localStorage.getItem('user');
    
    // 1. VERIFICAÇÃO DE SEGURANÇA:
    // Se não existir usuário no storage, manda de volta pro login imediatamente
    if (!userJson) {
        console.warn("Sessão não encontrada. Redirecionando...");
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userJson);
    
    // 2. USO SEGURO (Optional Chaining):
    // Usamos o ?. para garantir que se algo estiver faltando no objeto, o código não trave
    const permissions: string[] = user?.permissions || [];
    const hasPermission = (p: string) => permissions.includes(p) || user?.role === 'ADMIN';

    const sidebarHtml = `
    <aside class="flex flex-col w-64 h-screen px-5 py-8 overflow-y-auto bg-slate-900 border-r border-slate-700 fixed left-0 top-0 z-50">
        <div class="flex items-center gap-3 px-4">
            <span class="bg-white rounded-xl flex items-center justify-center">
                <img src="/agent.png" alt="Agent" class="w-12 h-12">
            </span>
            <span class="text-xl font-bold text-white tracking-tight">Service Desk</span>
        </div>

        <nav class="flex-1 mt-10 space-y-2">
            <a href="/dashboard" class="nav-link flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-2xl group">
                <span class="material-icons-round">dashboard</span>
                <span class="mx-3 font-bold text-sm">Dashboard</span>
            </a>

            ${hasPermission('manage_users') ? `
            <a href="/users" class="nav-link flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-2xl group">
                <span class="material-icons-round">group</span>
                <span class="mx-3 font-bold text-sm">Users</span>
            </a>` : ''}

            ${hasPermission('manage_roles') ? `
            <a href="/roles" class="nav-link flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-2xl group">
                <span class="material-icons-round">admin_panel_settings</span>
                <span class="mx-3 font-bold text-sm">Roles & Permissions</span>
            </a>` : ''}

            <a href="/tickets" class="nav-link flex items-center px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white transition-all rounded-2xl group">
                <span class="material-icons-round">confirmation_number</span>
                <span class="mx-3 font-bold text-sm">Tickets</span>
            </a>
        </nav>

        <div class="mt-auto border-t border-slate-800 pt-6">
            <a href="/profile" class="flex items-center gap-x-3 px-2 group">
                <img class="w-10 h-10 rounded-xl ring-2 ring-blue-500/20" src="https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff">
                <div class="text-left leading-tight overflow-hidden">
                    <h1 class="text-sm font-bold text-white truncate">${user?.name || 'Guest'}</h1>
                    <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">${user?.role || 'USER'}</p>
                </div>
            </a>
            <button onclick="localStorage.clear(); window.location.href='/login'" class="mt-4 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-red-400 transition-colors">
                <span class="material-icons-round text-sm">logout</span> Sign Out
            </button>
        </div>
    </aside>
    `;

    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHtml;

        // Ativar link atual
        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPath === href || currentPath.startsWith(href))) {
                link.classList.remove('text-slate-300');
                link.classList.add('bg-slate-800', 'text-white', 'ring-1', 'ring-slate-700');
            }
        });
    }
}
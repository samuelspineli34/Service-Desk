export function initSidebar() {
    const userJson = localStorage.getItem('user');
    
    if (!userJson) {
        window.location.href = '/login';
        return;
    }

    const user = JSON.parse(userJson);
    const permissions: string[] = user?.permissions || [];
    const hasPermission = (p: string) => permissions.includes(p) || user?.role === 'ADMIN';

    const sidebarHtml = `
    <aside class="flex flex-col w-64 h-screen px-6 py-8 overflow-y-auto bg-white border-r border-[#eaddc5] shadow-[10px_0_30px_rgba(0,0,0,0.02)] fixed left-0 top-0 z-50 animate-in">
        <div class="flex items-center gap-3 px-2 mb-12">
            <div class="bg-slate-50 p-2 rounded-[1.2rem] border border-orange-100 flex items-center justify-center">
                <img src="/agent.png" alt="Agent" class="w-12 h-12">
            </div>
            <div class="leading-none">
                <span class="text-xl font-[900] text-[#2d1a0f] tracking-tighter">Osaka Tech</span>
                <p class="text-[8px] font-black text-[#d97706] uppercase tracking-[0.2em] mt-0.5">Infrastructure</p>
            </div>
        </div>

        <nav class="flex-1 space-y-2">
            <a href="/dashboard" class="nav-link flex items-center px-4 py-3.5 text-[#6b4423] hover:bg-orange-50 hover:text-[#2d1a0f] transition-all rounded-[1.5rem] group">
                <span class="material-icons-round text-xl opacity-60">dashboard</span>
                <span class="mx-3 font-bold text-sm tracking-tight">Overview</span>
            </a>

            ${hasPermission('manage_users') ? `
            <a href="/users" class="nav-link flex items-center px-4 py-3.5 text-[#6b4423] hover:bg-orange-50 hover:text-[#2d1a0f] transition-all rounded-[1.5rem] group">
                <span class="material-icons-round text-xl opacity-60">group</span>
                <span class="mx-3 font-bold text-sm tracking-tight">Organization</span>
            </a>` : ''}

            ${hasPermission('manage_roles') ? `
            <a href="/roles" class="nav-link flex items-center px-4 py-3.5 text-[#6b4423] hover:bg-orange-50 hover:text-[#2d1a0f] transition-all rounded-[1.5rem] group">
                <span class="material-icons-round text-xl opacity-60">admin_panel_settings</span>
                <span class="mx-3 font-bold text-sm tracking-tight">Permissions</span>
            </a>` : ''}

            <a href="/tickets" class="nav-link flex items-center px-4 py-3.5 text-[#6b4423] hover:bg-orange-50 hover:text-[#2d1a0f] transition-all rounded-[1.5rem] group">
                <span class="material-icons-round text-xl opacity-60">confirmation_number</span>
                <span class="mx-3 font-bold text-sm tracking-tight">Service Desk</span>
            </a>
        </nav>

        <div class="mt-auto pt-6">
            <div class="bg-[#fdfaf3] border border-[#f1e4d1] rounded-[2.5rem] p-5 shadow-sm">
                <a href="/profile" class="flex items-center gap-x-3 group">
                    <img class="w-10 h-10 rounded-2xl ring-2 ring-orange-100 object-cover" 
                         src="https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2d1a0f&color=fff&bold=true">
                    <div class="text-left leading-tight overflow-hidden">
                        <h1 class="text-xs font-black text-[#2d1a0f] truncate">${user?.name || 'Guest'}</h1>
                        <p class="text-[9px] text-[#d97706] font-black uppercase tracking-widest mt-0.5">${user?.role || 'USER'}</p>
                    </div>
                </a>
                <button onclick="localStorage.clear(); window.location.href='/login'" 
                    class="mt-5 w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest text-[#6b4423] hover:text-red-600 transition-all border-t border-white pt-4">
                    <span class="material-icons-round text-sm">logout</span> 
                    <span>Sair do Sistema</span>
                </button>
            </div>
        </div>
    </aside>
    `;

    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHtml;

        const currentPath = window.location.pathname;
        const links = container.querySelectorAll('.nav-link');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && (currentPath === href || currentPath.startsWith(href))) {
                link.classList.remove('text-[#6b4423]');
                // Ativo: Fundo creme suave com borda e texto marrom
                link.classList.add('bg-[#fdfaf3]', 'text-[#2d1a0f]', 'shadow-sm', 'border', 'border-[#eaddc5]');
                link.querySelector('span')?.classList.remove('opacity-60');
                link.querySelector('span')?.classList.add('text-[#d97706]');
            }
        });
    }
}
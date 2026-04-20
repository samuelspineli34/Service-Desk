export function initSidebar() {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const role = user?.role || 'USER';
    const userName = user?.name || 'Guest User';

    const sidebarHtml = `
    <aside class="flex flex-col w-64 h-screen px-5 py-8 overflow-y-auto bg-slate-900 border-r border-slate-700 fixed left-0 top-0">
        <div class="flex items-center gap-x-3 px-2">
            <span class="bg-white rounded-xl flex items-center justify-center">
                <img src="/agent.png" alt="Agent" class="w-12 h-12">
            </span>
            <span class="text-xl font-bold text-white tracking-tight">Service Desk</span>
        </div>

        <nav class="flex-1 mt-10 space-y-2">
            <a href="/dashboard" class="nav-link flex items-center px-3 py-2 text-slate-300 transition-colors duration-200 rounded-lg hover:bg-slate-800 hover:text-white group">
                <span class="material-icons-round">dashboard</span>
                <span class="mx-3 font-medium">Dashboard</span>
            </a>

            ${role === 'ADMIN' ? `
            <a href="/users" class="nav-link flex items-center px-3 py-2 text-slate-300 transition-colors duration-200 rounded-lg hover:bg-slate-800 hover:text-white group">
                <span class="material-icons-round">group</span>
                <span class="mx-3 font-medium">Users</span>
            </a> ` : ''}

            <a href="/ticket" class="nav-link flex items-center px-3 py-2 text-slate-300 transition-colors duration-200 rounded-lg hover:bg-slate-800 hover:text-white group">
                <span class="material-icons-round">confirmation_number</span>
                <span class="mx-3 font-medium">Tickets</span>
            </a>
        </nav>

        <div class="flex items-center gap-x-2 px-2 mt-auto border-t border-slate-800 pt-6 text-white">
            <a href="/profile">
                <img class="w-9 h-9 rounded-full ring-2 ring-blue-500/20" src="https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff">
            </a>    
            <div class="text-left leading-tight">
                <h1 class="text-sm font-semibold truncate w-32">${userName}</h1>
                <p class="text-[10px] text-slate-400 font-bold uppercase">${role}</p>
            </div>
            <!-- Botão de Logout -->
            <button onclick="localStorage.clear(); window.location.href='/login'" class="ml-auto text-slate-500 hover:text-red-500 transition-colors">
                <span class="material-icons-round text-sm">logout</span>
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
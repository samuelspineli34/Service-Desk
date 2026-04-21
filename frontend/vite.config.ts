import { defineConfig, ViteDevServer } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/',
    root: './',
    // Criamos um pequeno plugin interno para resolver as rotas limpas
    plugins: [
        {
            name: 'html-rewrite',
            configureServer(server: ViteDevServer) {
                server.middlewares.use((req, res, next) => {
                    // Remove a query string se houver (ex: /users?id=1 -> /users)
                    const url = req.url?.split('?')[0];

                    if (url === '/login') req.url = '/src/pages/login/login.html';
                    else if (url === '/dashboard') req.url = '/src/pages/dashboard/dashboard.html';
                    else if (url === '/users') req.url = '/src/pages/users/user.html';
                    else if (url === '/tickets') req.url = '/src/pages/ticket/tickets.html';
                    else if (url === '/profile') req.url = '/src/pages/profile/profile.html';
                    else if (url === '/roles') req.url = '/src/pages/roles/roles.html';

                    next();
                });
            },
        },
    ],
    server: {
        port: 3000,
        open: true,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                login: resolve(__dirname, 'src/pages/login/login.html'),
                dashboard: resolve(__dirname, 'src/pages/dashboard/dashboard.html'),
                users: resolve(__dirname, 'src/pages/users/user.html'),
                tickets: resolve(__dirname, 'src/pages/ticket/tickets.html'),
                profile: resolve(__dirname, 'src/pages/profile/profile.html'),
                roles: resolve(__dirname, 'src/pages/roles/roles.html'),
            },
        },
    },
});
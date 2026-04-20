import { initSidebar } from '../../components/sidebar';
import { apiClient } from '../../services/api/api-client';

async function loadDashboard() {
    initSidebar();
    
    try {
        const stats = await apiClient.get<any>('/dashboard/stats');
        
        document.getElementById('stat-tickets')!.textContent = stats.openTickets;
        document.getElementById('stat-users')!.textContent = stats.totalUsers;
        document.getElementById('stat-resolved')!.textContent = stats.resolvedTickets;
        document.getElementById('stat-rating')!.textContent = stats.averageRating.toFixed(1);
        
    } catch (e) {
        console.error("Dashboard error:", e);
    }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
import { apiClient } from './api-client';
import { Ticket } from '../../interfaces/ticket.interface';

type TicketInput = Omit<Ticket, 'id' | 'user_name' | 'created_at' | 'rating'>;

export const ticketService = {
    async getAllTickets(): Promise<Ticket[]> {
        return await apiClient.get<Ticket[]>('/ticket');
    },

    async createTicket(data: TicketInput) {
        return await apiClient.post('/ticket', data);
    },

    // No update, o 'data' agora conterá automaticamente a 'resolution' se ela estiver na Interface
    async updateTicket(id: string, data: TicketInput & { status: string }) {
        return await apiClient.put(`/ticket/${id}`, data);
    },

    async deleteTicket(id: string) {
        return await apiClient.delete(`/ticket/${id}`);
    },

    async rateTicket(id: string, rating: number) { 
        // CORREÇÃO: O backend espera um objeto JSON { "rating": x }
        return await apiClient.put(`/ticket/${id}/rate`, { rating });
    },

    // Novo método para buscar o histórico que criamos anteriormente
    async getHistory(id: string): Promise<any[]> {
        return await apiClient.get<any[]>(`/ticket/${id}/history`);
    }
};
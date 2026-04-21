import { apiClient } from './api-client';
import { Ticket } from '../../interfaces/ticket.interface';

// Omitimos o 'id', 'user_name' e 'created_at' na criação, pois o banco gera/resolve isso
type TicketInput = Omit<Ticket, 'id' | 'user_name' | 'created_at' | 'rating'>;

export const ticketService = {
    async getAllTickets(): Promise<Ticket[]> {
        return await apiClient.get<Ticket[]>('/ticket');
    },

    async createTicket(data: TicketInput) {
        return await apiClient.post('/ticket', data);
    },

    async updateTicket(id: string, data: TicketInput & { status: string }) {
        return await apiClient.put(`/ticket/${id}`, data);
    },

    async deleteTicket(id: string) {
        // Como implementamos Soft Delete, a rota continua sendo DELETE no padrão REST
        return await apiClient.delete(`/ticket/${id}`);
    },

    async rateTicket(id: string, rating: number) { 
        return await apiClient.put(`/ticket/${id}/rate`, rating);
    }
};
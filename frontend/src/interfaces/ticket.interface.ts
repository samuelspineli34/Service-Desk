export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    user_id: string;
    user_name: string;
    created_at: string;
    rating?: number;
    resolution?: string | null;
}
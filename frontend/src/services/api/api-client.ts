const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response: Response) => {
    // SÓ desloga se o token for inválido (401)
    if (response.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    
    // Se for 404 ou 500, o erro aparece no console mas NÃO te desloga
    if (!response.ok) {
        console.error(`Erro na API (${response.status}):`, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server error');
    }
    return await response.json();
};

export const apiClient = {
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: getHeaders()
        });
        return await handleResponse(response);
    },

    async post<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(response);
    },

    async put<T>(endpoint: string, data: any): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return await handleResponse(response);
    },

    async delete<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return await handleResponse(response);
    }
};
import { apiClient } from './api-client';
import { Role } from '../../interfaces/roles.interface';
import { Permission } from '../../interfaces/permission.interface';

export const roleService = {
    async getAllRoles(): Promise<Role[]> {
        return await apiClient.get<Role[]>('/roles');
    },

    async getPermissions(): Promise<Permission[]> {
        return await apiClient.get<Permission[]>('/permissions');
    },

    async createRole(data: { name: string, permissions: string[] }) {
        return await apiClient.post('/roles', data);
    }
};
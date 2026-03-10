import api from './axios';
import { UserResponse } from './authService';
export interface UserZone {
    id: number;
    zone_number: number;
    low_limit: number;
    high_limit: number;
    type_zone: number;
}

class UserService {
    async getUserZones(userId: number): Promise<UserZone[]> {
        const response = await api.get<UserZone[]>(`/User/UserZones/${userId}`);
        return response.data;
    }

    async updateUser(userId: number, data: {
        user_surname: string;
        user_name: string;
        user_fathername: string;
        user_email: string;
        user_nickname: string;
        password: string;
        user_birthday: string;
        user_gender: boolean;
        user_height: number;
        user_weight: number;
        user_only_coach: boolean;
        user_hr_rest: number;
        user_hr_max: number;
        user_pace_max: number | null;
    }): Promise<UserResponse> {
        const response = await api.put<UserResponse>('/User/Update', {
            id: userId,
            ...data
        });
        return response.data;
    }

    async changePassword(userId: number, last_password: string, new_password: string): Promise<void> {
        await api.patch(`/User/ChangePassword/${userId}`, null, {
            params: {
                last_password,
                new_password
            }
        });
    }

    async changeNickname(userId: number, new_nickname: string): Promise<UserResponse> {
        const response = await api.patch<UserResponse>(`/User/ChangeNickname/${userId}`, null, {
            params: {
                new_nickname
            }
        });
        return response.data;
    }

    async changeEmail(userId: number, new_email: string): Promise<UserResponse> {
        const response = await api.patch<UserResponse>(`/User/ChangeEmail/${userId}`, null, {
            params: {
                new_email
            }
        });
        return response.data;
    }

    async deleteUser(userId: number): Promise<void> {
        await api.delete(`/User/Delete/${userId}`);
    }
}

export default new UserService();
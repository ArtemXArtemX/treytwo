import api from './axios';

export interface LoginRequest {
    login: string;
    password: string;
}

export interface RegisterRequest {
    id: number;
    user_surname: string;
    user_name: string;
    user_fathername: string;
    user_nickname: string;
    user_email: string;
    password: string;
    user_birthday: string;
    user_gender: boolean;
    user_height: number;
    user_weight: number;
    user_only_coach: boolean;
    user_hr_rest: number;
    user_hr_max: number;
    user_pace_max: number | null;
    sportId: number;
}

export interface UserResponse {
    id: number;
    user_surname: string;
    user_name: string;
    user_fathername: string;
    user_email: string;
    user_nickname: string;
    user_birthday: string;
    user_gender: boolean;
    user_height: number;
    user_weight: number;
    user_only_coach: boolean;
    user_hr_rest: number;
    user_hr_max: number;
    user_pace_max: number | null;
    sportId: number;
    token?: string;
}

class AuthService {
    async login(data: LoginRequest): Promise<UserResponse> {
        const response = await api.post<any>('/User/Auth', data);
        const userData = response.data as UserResponse;

        if (userData) {
            if (userData.token) {
                localStorage.setItem('token', userData.token);
            }

            localStorage.setItem('user', JSON.stringify(userData));

            if (userData.id) {
                localStorage.setItem('userId', String(userData.id));
            }
        }
        return userData;
    }

    async register(data: RegisterRequest): Promise<UserResponse> {
        const response = await api.post<any>('/User/Create', data);
        const userData = response.data as UserResponse;
        
        if (userData && userData.token) {
            localStorage.setItem('token', userData.token);
        }

        return userData;
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userId');
        window.location.href = '/login';
    }

    getCurrentUser(): UserResponse | null {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr) as UserResponse;
            } catch {
                return null;
            }
        }
        return null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
}

export default new AuthService();
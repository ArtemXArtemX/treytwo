import api from './api';

export interface RegisterUserData {
    user_surname: string;
    user_name: string;
    user_fathername?: string | null;
    user_email: string;
    user_nickname: string;
    password: string;
    user_birthday: string;
    user_gender: number;
    user_height: number;
    user_weight: number;
    user_only_coach: number;
    user_hr_rest?: number;
    user_hr_max?: number;
    user_pace_max?: number | null;
}

export interface LoginData {
    email?: string;
    nickname?: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        user_id: number;
        user_surname: string;
        user_name: string;
        user_email: string;
        user_nickname: string;
        user_only_coach: number;
    };
}

class AuthService {
    async register(userData: RegisterUserData): Promise<AuthResponse> {
        try {
            console.log('📤 Sending registration request to:', '/api/User/Create');
            console.log('📦 Registration data:', userData);

            const response = await api.post<AuthResponse>('/api/User/Create', userData);

            console.log('📥 Registration response:', response.data);

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Registration error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Ошибка регистрации');
        }
    }

    async auth(login: string, password: string): Promise<AuthResponse> {
        try {
            const isEmail = login.includes('@');

            const payload: LoginData = {
                password
            };

            if (isEmail) {
                payload.email = login;
            } else {
                payload.nickname = login;
            }

            console.log('📤 Sending auth request to:', '/api/User/Auth');
            console.log('📦 Auth data:', payload);

            const response = await api.post<AuthResponse>('/api/User/Auth', payload);

            console.log('📥 Auth response:', response.data);

            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Auth error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Неверный логин или пароль');
        }
    }

    async getUser(userId: number) {
        try {
            const response = await api.get(`/api/User/Get/${userId}`);
            return response.data;
        } catch (error: any) {
            console.error('Get user error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Ошибка получения данных');
        }
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'http://localhost:3000/login';
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                return JSON.parse(userStr);
            } catch {
                return null;
            }
        }
        return null;
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    }
}

export default new AuthService();
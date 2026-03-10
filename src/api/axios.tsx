import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7001/api',
    timeout: 60000
});

api.interceptors.response.use(
    (response) => response,
    (error: any) => {
        if (error.code === 'ECONNABORTED') {
            console.error('Timeout error');
        }
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            window.location.href = 'http://localhost:3000/login';
        }
        return Promise.reject(error);
    }
);

api.interceptors.request.use(
    (config: any) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);

export default api;
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5120/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

api.interceptors.request.use((config) => {
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await api.post('/User/refresh', {}, { withCredentials: true });
                return api(originalRequest);
            } catch (refreshError) {
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
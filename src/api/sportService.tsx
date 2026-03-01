import api from './axios';
import { Sport } from '../models/sport';

class SportService {
    async getSports(): Promise<Sport[]> {
        try {
            const response = await api.get('/Sport');
            return response.data as Sport[];
        } catch (error) {
            console.error('Ошибка загрузки видов спорта:', error);
            return [];
        }
    }
}

export default new SportService();
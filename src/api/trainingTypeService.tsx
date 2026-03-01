import api from './axios';
import { TrainingType } from '../models/trainingType';

class TrainingTypeService {
    async getTrainingTypes(): Promise<TrainingType[]> {
        try {
            const response = await api.get('/TypeTraining');
            return response.data as TrainingType[];
        } catch (error) {
            console.error('Ошибка загрузки типов тренировок:', error);
            return [];
        }
    }
}

export default new TrainingTypeService();
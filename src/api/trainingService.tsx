import api from './axios';
export interface TrainingUploadData {
    sportsman_id: number;
    sport_id: number;
    type_training_id: number;
    name_training: string;
    time_start: string;
    local_timestamp: string;
    duration: number;
    distance: number;
    avg_heart_rate: number;
    min_heart_rate: number;
    max_heart_rate: number;
    avg_speed: number;
    max_speed: number;
    avg_running_cadence: number;
    max_running_cadence: number;
    avg_power: number;
    max_power: number;
    total_descent: number;
    total_ascent: number;
    start_position_lat: number;
    start_position_long: number;
    max_altitude: number;
    calories: number;
    is_gps: boolean;
    stress_score: number;
    feeling_score: number;
    comment_sportsman: string;
    coach_creator: number | null;
    comment_coach: string | null;
    status_training: number;
    laps: null;
    trackpoints: null;
    heart_rates?: Array<{
        timestamp: string;
        heart_rate: number;
    }> | null;
    paces?: Array<{
        timestamp: string;
        pace: number;
    }> | null;
    altitudes?: Array<{
        timestamp: string;
        altitude: number;
    }> | null;
}

export interface GetLowResponse {
    trainings: TrainingResponse[];
    report: {
        total_trainings: number;
        total_duration: number;
        total_distance: number;
        total_calories: number;
    };
}

export interface TrainingResponse {
    id: number;
    sportsman_id: number;
    sport_id: number;
    type_training_id: number;
    name_training: string;
    time_start: string;
    local_timestamp: string;
    duration: number;
    distance: number;
    avg_heart_rate: number | null;
    min_heart_rate: number | null;
    max_heart_rate: number | null;
    avg_speed: number | null;
    max_speed: number | null;
    avg_running_cadence: number | null;
    max_running_cadence: number | null;
    avg_power: number | null;
    max_power: number | null;
    total_descent: number | null;
    total_ascent: number | null;
    start_position_lat: number | null;
    start_position_long: number | null;
    max_altitude: number | null;
    calories: number | null;
    is_gps: boolean;
    stress_score: number | null;
    feeling_score: number | null;
    comment_sportsman: string | null;
    coach_creator: number | null;
    comment_coach: string | null;
    status_training: number;
    sport?: string;
    type_training?: string;
    trackpoints?: Array<{
        duration_point: string;
        latitude: number;
        longitude: number;
    }>;
    heart_rates?: Array<{
        timestamp: string;
        heart_rate: number;
    }>;
    paces?: Array<{
        timestamp: string;
        pace: number;
    }>;
    altitudes?: Array<{
        timestamp: string;
        altitude: number;
    }>;

    laps?: Array<{
        lap_number: number;
        lap_caption: string;
        distance: number | null;
        duration: number;
        timestamp: string;
        start_time: string;
        avg_heart_rate: number | null;
        min_heart_rate: number | null;
        max_heart_rate: number | null;
        avg_speed: number | null;
        max_speed: number | null;
        avg_running_cadence: number | null;
        max_running_cadence: number | null;
        avg_power: number | null;
        max_power: number | null;
        total_descent: number | null;
        total_ascent: number | null;
    }>;
}

class TrainingService {
    async uploadTraining(data: TrainingUploadData, file: File): Promise<TrainingResponse> {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(data).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, String(value));
            }
        });

        const response = await api.post<TrainingResponse>('/Training/upload-training', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async getTrainings(sportsmanId: number, startDate: string, endDate: string): Promise<GetLowResponse> {
        const response = await api.get<GetLowResponse>('/Training/GetLow', {
            params: {
                start: startDate,
                end: endDate,
                start_report: startDate,
                end_report: endDate
            }
        });
        return response.data;
    }
    async getTrainingById(id: number): Promise<TrainingResponse> {
        const response = await api.get<TrainingResponse>(`/Training/Get/${id}`);
        return response.data;
    }
    async getTrainingMid(id: number): Promise<TrainingResponse> {
        const response = await api.get<TrainingResponse>(`/Training/GetMid/${id}`);
        return response.data;
    }

    async createTraining(data: any): Promise<TrainingResponse> {
        const response = await api.post<TrainingResponse>('/Training/CreateTraining', data);
        return response.data;
    }

    async deleteTraining(id: number): Promise<void> {
        await api.delete(`/Training/Delete/${id}`);
    }

    async patchTrainingName(id: number, name: string): Promise<TrainingResponse> {
        const response = await api.patch<TrainingResponse>(`/Training/Patch/Name/${id}`, null, {
            params: { name }
        });
        return response.data;
    }

    async patchLapCaption(id: number, lapId: number, caption: string): Promise<TrainingResponse> {
        const response = await api.patch<TrainingResponse>(`/Training/Patch/LapCaption/${id}`, null, {
            params: { lap_id: lapId, caption }
        });
        return response.data;
    }

    async updateTraining(id: number, data: any): Promise<TrainingResponse> {
        const response = await api.put<TrainingResponse>(`/Training/Update`, data);
        return response.data;
    }

    async createPlannedTraining(data: any): Promise<any> {
        const response = await api.post('/Training/CreatePlannedTrainingBySportsman', data);
        return response.data;
    }

    async completeTrainingWithFile(
        id: number,
        file: File,
        stress_score?: number,
        feeling_score?: number,
        comment_sportsman?: string
    ): Promise<TrainingResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('id', String(id));
        if (stress_score !== undefined) formData.append('stress_score', String(stress_score));
        if (feeling_score !== undefined) formData.append('feeling_score', String(feeling_score));
        if (comment_sportsman !== undefined) formData.append('comment_sportsman', comment_sportsman);

        const response = await api.put<TrainingResponse>(`/Training/UpdatePlanToCompleteFile`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    async completeTrainingWithoutFile(
        id: number,
        data: {
            stress_score?: number;
            feeling_score?: number;
            comment_sportsman?: string;
            time_start: string;
            local_timestamp: string;
            duration: number;
            distance: number;
            avg_heart_rate?: number;
            avg_speed?: number;
            calories?: number;
        }
    ): Promise<TrainingResponse> {
        const response = await api.put<TrainingResponse>(`/Training/UpdatePlanToCompleteWithoutFile`, {
            id: id,
            time_start: data.time_start,
            local_timestamp: data.local_timestamp,
            duration: data.duration,
            distance: data.distance,
            avg_heart_rate: data.avg_heart_rate || 0,
            avg_speed: data.avg_speed || 0,
            calories: data.calories || 0,
            stress_score: data.stress_score,
            feeling_score: data.feeling_score,
            comment_sportsman: data.comment_sportsman
        });
        return response.data;
    }

    async getLowPlannedTrainings(
        start: string,
        end: string,
        startReport: string,
        endReport: string
    ): Promise<GetLowResponse> {
        const response = await api.get<GetLowResponse>('/Training/GetLowPlanned', {
            params: {
                start,
                end,
                start_report: startReport,
                end_report: endReport,
            },
        });

        return response.data;
    }
}

export default new TrainingService();
import api from './axios';

export interface ReportOverview {
    total_trainings: number;
    total_duration: number;
    total_distance: number;
    total_calories: number;
    avg_pace: number;
    total_ascent: number;
    total_descent: number;
}

export interface ReportBin {
    total_trainings: number;
    total_duration: number;
    total_distance: number;
    total_calories: number;
    avg_pace: number;
    total_ascent: number;
    total_descent: number;
    bin_period: string;
    max_speed: number;
    avg_heart_rate: number;
}

export interface PieItem {
    caption: string;
    value: number;
}

export interface ReportResponse {
    overview: ReportOverview;
    reportBins: ReportBin[];
    typePie: PieItem[];
    sportSessionPie: PieItem[];
    sportDistancePie: PieItem[];
    sportDurationPie: PieItem[];
}

class ReportService {
    async getReport(startDate: string, endDate: string, bin: 'day' | 'week' | 'month'): Promise<ReportResponse> {
        const response = await api.get<ReportResponse>('/Training/GetReport', {
            params: {
                start: startDate,
                end: endDate,
                bin
            }
        });
        return response.data;
    }
}

export default new ReportService();
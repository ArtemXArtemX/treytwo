import api from './axios';
import { GetLowResponse, TrainingResponse } from './trainingService';

export interface SportsmanResponse {
    id: number;
    fullname?: string;
    surname?: string;
    name?: string;
    fathername?: string;
    nickname?: string;
    email?: string;
    relation_id?: number;
}

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

export interface SportsmanReportResponse {
    overview: ReportOverview;
    reportBins: ReportBin[];

    typePie: PieItem[];
    sportSessionPie: PieItem[];
    sportDistancePie: PieItem[];
    sportDurationPie: PieItem[];
}

export interface CoachResponse {
    id: number;
    fullname: string;
    user_id?: number;
    nickname?: string;
    email?: string;
    relation_id?: number;
}

export interface InviteResponse {
    id: number;
    sportsman_id: number;
    fullname: string;
    nickname?: string;
    email?: string;
    status: number;
}

class CoachService {

    async getSportsmans(): Promise<SportsmanResponse[]> {
        const response = await api.get<SportsmanResponse[]>(
            '/Coach/Get/Sportsmen'
        );

        return response.data;
    }

    async getSportsmanTrainings(
        sportsmanId: number,
        startDate: string,
        endDate: string
    ): Promise<GetLowResponse> {

        const response = await api.get<GetLowResponse>(
            '/Coach/Sportsman/Training/GetLow',
            {
                params: {
                    id_sportsman: sportsmanId,
                    start: startDate,
                    end: endDate,
                    start_report: startDate,
                    end_report: endDate
                }
            }
        );

        return response.data;
    }

    async getSportsmanTrainingById(
        trainingId: number,
        sportsmanId: number
    ): Promise<TrainingResponse> {
        const response = await api.get<TrainingResponse>(
            `/Coach/Sportsman/Training/Get/${trainingId}`,
            {
                params: {
                    id_training: trainingId,
                    id_sportsman: sportsmanId
                }
            }
        );

        return response.data;
    }

    async getSportsmanTrainingMid(
        trainingId: number,
        sportsmanId: number
    ): Promise<TrainingResponse> {
        const response = await api.get<TrainingResponse>(
            `/Coach/Sportsman/Training/GetMid/${trainingId}`,
            {
                params: {
                    id_training: trainingId,
                    sportsman_id: sportsmanId
                }
            }
        );

        return response.data;
    }

    async createPlannedTrainingByCoach(
        sportsmanId: number,
        data: any
    ): Promise<any> {
        const response = await api.post(
            '/Coach/CreatePlannedTrainingByCoach',
            data,
            {
                params: {
                    id_sportsman: sportsmanId
                }
            }
        );

        return response.data;
    }

    async getSportsmanReport(
        sportsmanId: number,
        start: string,
        end: string,
        bin: string
    ): Promise<SportsmanReportResponse> {

    const response = await api.get<SportsmanReportResponse>(
        "/Coach/Sportsman/GetReport",
        {
            params: {
                sportsman_id: sportsmanId,
                start,
                end,
                bin
            }
        }
    );

    return response.data;
    }
    async getCoaches(): Promise<CoachResponse[]> {
        const response = await api.get<CoachResponse[]>('/Coach/Get/Coaches');
        return response.data;
    }

    async createInvite(coachId: number): Promise<any> {
        const response = await api.post('/Coach/CreateInvite', null, {
            params: {
                id_coach: coachId
            }
        });

        return response.data;
    }

    async cancelInvite(inviteId: number): Promise<any> {
        const response = await api.post('/Coach/CanceledInvite', null, {
            params: {
                id_invite: inviteId
            }
        });

        return response.data;
    }

    async getMyCoaches(): Promise<CoachResponse[]> {
        const response = await api.get<CoachResponse[]>('/User/GetCoaches');
        return response.data;
    }

    async getInvites(): Promise<InviteResponse[]> {
        const response = await api.get<InviteResponse[]>('/Coach/Invites');
        return response.data;
    }

    async acceptInvite(inviteId: number): Promise<any> {
        const response = await api.post('/Coach/AcceptedInvite', null, {
            params: {
                id_invite: inviteId
            }
        });

        return response.data;
    }

    async removeRelation(relationId: number): Promise<any> {
        const response = await api.delete('/Coach/RemoveRelation', {
            params: {
                id_relation: relationId
            }
        });

        return response.data;
    }

    async rejectInvite(inviteId: number): Promise<any> {
        const response = await api.post('/Coach/RejectedInvite', null, {
            params: {
                id_invite: inviteId
            }
        });

        return response.data;
    }

    async patchTrainingComment(
        trainingId: number,
        comment: string
    ): Promise<any> {
        const response = await api.patch('/Coach/Training/PatchComment', null, {
            params: {
                id_training: trainingId,
                comment
            }
        });

        return response.data;
    }
}

export default new CoachService();
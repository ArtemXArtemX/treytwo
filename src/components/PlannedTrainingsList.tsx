import React, { useEffect, useState } from 'react';
import { TrainingEvent } from '../pages/Athlete/CalendarPage';
import trainingService from '../api/trainingService';

type Props = {
    onSelect: (training: TrainingEvent) => void;
    onClose: () => void;
};

const PlannedTrainingsList: React.FC<Props> = ({ onSelect, onClose }) => {
    const [plannedTrainings, setPlannedTrainings] = useState<TrainingEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlannedTrainings = async () => {
            try {
                const response = await trainingService.getLowPlannedTrainings(
                    '2000-01-01',
                    '2100-01-01',
                    '2000-01-01',
                    '2100-01-01'
                );

                const trainings = response.trainings.map((item: any): TrainingEvent => ({
                    id: String(item.id),
                    date: item.local_timestamp?.split('T')[0] || '',
                    startTime: item.local_timestamp?.split('T')[1]?.substring(0, 5),
                    status: 'planned',
                    name: item.name_training || 'Тренировка',
                    sport: item.sport_id,
                    distanceKm: item.distance ? item.distance / 1000 : undefined,
                    durationSec: item.duration || undefined,
                }));

                setPlannedTrainings(trainings);
            } catch (error) {
                console.error('Ошибка загрузки запланированных тренировок:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPlannedTrainings();
    }, []);

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                    <div className="modal-header" style={{ borderBottom: "1px solid #e9ecef", padding: "1.5rem 1.5rem 1rem" }}>
                        <h5 className="modal-title" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
                            Выберите запланированную тренировку
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body p-4">
                        {loading ? (
                            <div className="text-center py-5 text-muted">Загрузка...</div>
                        ) : plannedTrainings.length === 0 ? (
                            <div className="text-center py-5 text-muted">Нет запланированных тренировок</div>
                        ) : (
                            <div className="row g-3">
                                {plannedTrainings.map(t => (
                                    <div key={t.id} className="col-md-6 col-lg-4">
                                        <div
                                            className="card h-100 border-0 shadow-sm"
                                            style={{ borderRadius: "12px", cursor: "pointer" }}
                                            onClick={() => onSelect(t)}
                                        >
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-2">{t.name || "Тренировка"}</h6>
                                                <div className="small text-muted">{t.date} {t.startTime}</div>

                                                {t.distanceKm && (
                                                    <div className="mt-2 small">
                                                        Дистанция: {t.distanceKm.toFixed(1)} км
                                                    </div>
                                                )}

                                                {t.durationSec && (
                                                    <div className="small">
                                                        Время: {Math.floor(t.durationSec / 3600).toString().padStart(2, '0')}:
                                                        {Math.floor((t.durationSec % 3600) / 60).toString().padStart(2, '0')}:
                                                        {(t.durationSec % 60).toString().padStart(2, '0')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlannedTrainingsList;
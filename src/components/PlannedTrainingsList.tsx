import React from 'react';
import { TrainingEvent } from '../pages/Athlete/CalendarPage';

type Props = {
    trainings: TrainingEvent[];
    onSelect: (training: TrainingEvent) => void;
    onClose: () => void;
};

const PlannedTrainingsList: React.FC<Props> = ({ trainings, onSelect, onClose }) => {
    const plannedTrainings = trainings.filter(t => t.status === "planned");

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                    <div className="modal-header" style={{ borderBottom: "1px solid #e9ecef", padding: "1.5rem 1.5rem 1rem" }}>
                        <h5 className="modal-title" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Выберите запланированную тренировку</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body p-4">
                        {plannedTrainings.length === 0 ? (
                            <div className="text-center py-5 text-muted">Нет запланированных тренировок</div>
                        ) : (
                            <div className="row g-3">
                                {plannedTrainings.map(t => (
                                    <div key={t.id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: "12px", cursor: "pointer" }} onClick={() => onSelect(t)}>
                                            <div className="card-body">
                                                <h6 className="fw-bold mb-2">{t.name || "Тренировка"}</h6>
                                                <div className="small text-muted">{t.date} {t.startTime}</div>
                                                {t.distanceKm && <div className="mt-2 small">Дистанция: {t.distanceKm.toFixed(1)} км</div>}
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
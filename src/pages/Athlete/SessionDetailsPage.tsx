import React from "react";
import { useParams, Link } from "react-router-dom";
import { TrainingSession } from "../../types/training";

type Props = {
    sessions: TrainingSession[];
};

const SessionDetailsPage: React.FC<Props> = ({ sessions }) => {
    const { id } = useParams();
    const session = sessions.find((s) => s.id === id);

    if (!session) {
        return (
            <div className="container py-4">
                <div className="alert alert-warning">Занятие не найдено</div>
                <Link to="/calendar">← Назад в календарь</Link>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                    <h2 className="mb-1">{session.title}</h2>
                    <div className="text-muted">
                        {session.date} {session.startTime ? `• ${session.startTime}` : ""}
                    </div>
                </div>

                <Link className="btn btn-outline-secondary" to="/calendar">
                    ← К календарю
                </Link>
            </div>

            <div className="card shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="text-muted small">Вид спорта</div>
                            <div className="fw-semibold">{session.sport}</div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-muted small">Тип тренировки</div>
                            <div className="fw-semibold">{session.type}</div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-muted small">Статус</div>
                            <div className="fw-semibold">{session.status === "done" ? "Выполнено" : "Запланировано"}</div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-muted small">Расстояние</div>
                            <div className="fw-semibold">{session.distanceKm ? `${session.distanceKm} км` : "—"}</div>
                        </div>

                        <div className="col-md-4">
                            <div className="text-muted small">Длительность</div>
                            <div className="fw-semibold">{session.durationMin ? `${session.durationMin} мин` : "—"}</div>
                        </div>

                        <div className="col-12">
                            <hr />
                            <div className="text-muted small mb-1">Примечание</div>
                            <div>{session.note || "—"}</div>
                        </div>

                        {session.stats && (
                            <div className="col-12">
                                <hr />
                                <h6 className="mb-3">Статистика</h6>
                                <div className="row g-3">
                                    <div className="col-md-3"><div className="text-muted small">Ср. пульс</div><div className="fw-semibold">{session.stats.avgHr ?? "—"}</div></div>
                                    <div className="col-md-3"><div className="text-muted small">Ср. темп</div><div className="fw-semibold">{session.stats.avgPace ?? "—"}</div></div>
                                    <div className="col-md-2"><div className="text-muted small">Подъём</div><div className="fw-semibold">{session.stats.ascent ?? "—"}</div></div>
                                    <div className="col-md-2"><div className="text-muted small">Спуск</div><div className="fw-semibold">{session.stats.descent ?? "—"}</div></div>
                                    <div className="col-md-2"><div className="text-muted small">Ккал</div><div className="fw-semibold">{session.stats.calories ?? "—"}</div></div>
                                </div>
                            </div>
                        )}

                        {/* GPS блок подготовлен заранее */}
                        <div className="col-12">
                            <hr />
                            <h6 className="mb-2">GPS-трек</h6>
                            {session.gpsTrack?.length ? (
                                <div className="alert alert-secondary mb-0">
                                    GPS-точки есть ({session.gpsTrack.length}). На следующем этапе подключим Яндекс Tiles API и нарисуем трек.
                                </div>
                            ) : (
                                <div className="text-muted">Нет GPS-данных</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetailsPage;

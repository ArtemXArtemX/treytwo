import React from "react";
import { useNavigate } from "react-router-dom";
import { TrainingEvent } from "../../pages/Athlete/CalendarPage";
import GpsMap from "../GpsMap";

type Props = {
    training: TrainingEvent;
    onClose: () => void;
    formatHms: (totalSec: number) => string;
    formatPace: (paceSecPerKm: number) => string;
};

const TrainingDetailsModal: React.FC<Props> = ({ training, onClose, formatHms, formatPace }) => {
    const navigate = useNavigate();

    const formatTimeWithoutSeconds = (timeStr?: string) => {
        if (!timeStr) return "";
        return timeStr.split(':').slice(0, 2).join(':');
    };

    const formatDurationHMS = (seconds?: number) => {
        if (!seconds) return "-";
        return formatHms(seconds);
    };

    const formatDistance = (km?: number) => {
        if (!km) return "-";
        return `${km.toFixed(2)}`;
    };

    const formatElevation = (meters?: number) => {
        if (!meters) return "-";
        return `${meters}`;
    };

    const formatCalories = (cal?: number) => {
        if (!cal) return "-";
        return `${cal}`;
    };

    const formatPaceWithoutUnit = (paceSecPerKm?: number) => {
        if (!paceSecPerKm) return "-";
        const paceStr = formatPace(paceSecPerKm);
        return paceStr.replace(' /км', '');
    };

    const handleDetailsClick = () => {
        // Используем training.id, который мы предполагаем, что приходит из календаря
        // ID должен быть строкой, как определено в TrainingEvent
        navigate(`/training/${training.id}`);
        onClose(); // Закрываем модальное окно после перехода
    };

    return (
        <div className="modal-backdrop" style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
        }} onClick={onClose}>
            <div className="modal-content" style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                maxWidth: 800,
                width: "95%",
                maxHeight: "90vh",
                overflowY: "auto",
            }} onClick={(e) => e.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        <h3 style={{
                            margin: 0,
                            color: "#1a1a1a",
                            fontWeight: 600
                        }}>
                            Имя пользователя
                        </h3>

                        <div style={{
                            color: "#666",
                            fontSize: 16,
                            marginTop: 4,
                        }}>
                            <span>
                                {training.date}
                                {training.startTime && ` ${formatTimeWithoutSeconds(training.startTime)}`}
                            </span>

                            <span style={{
                                padding: "2px 8px",
                                borderRadius: 4,
                                backgroundColor: training.status === "done" ? "rgba(25,135,84,0.1)" : "rgba(13,110,253,0.1)",
                                color: training.status === "done" ? "#198754" : "#0d6efd",
                                fontWeight: 500,
                                fontSize: 12,
                                marginLeft: 12
                            }}>
                                {training.status === "done" ? "Выполнено" : "Запланировано"}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: 28,
                            cursor: "pointer",
                            color: "#666",
                            lineHeight: 1,
                            padding: 0
                        }}
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                </div>

                {training.name && (
                    <div style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: "#1a1a1a",
                        marginBottom: 24,
                        paddingBottom: 16,
                        borderBottom: "1px solid #e7eaf0"
                    }}>
                        {training.name}
                    </div>
                )}

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: "1px solid #e7eaf0"
                }}>
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#D1001C",
                            marginBottom: 4
                        }}>
                            {formatDistance(training.distanceKm)}
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#666",
                            fontWeight: 500
                        }}>
                            Расстояние, км
                        </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#D1001C",
                            marginBottom: 4
                        }}>
                            {formatDurationHMS(training.durationSec)}
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#666",
                            fontWeight: 500
                        }}>
                            Время
                        </div>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#D1001C",
                            marginBottom: 4
                        }}>
                            {formatPaceWithoutUnit(training.avgPaceSecPerKm)}
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#666",
                            fontWeight: 500
                        }}>
                            Средний темп, мин/км
                        </div>
                    </div>

                    {/* Общий подъем */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#D1001C",
                            marginBottom: 4
                        }}>
                            {formatElevation(training.elevationGainM)}
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#666",
                            fontWeight: 500
                        }}>
                            Общий подъём, м
                        </div>
                    </div>

                    {/* Калории */}
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 28,
                            fontWeight: 700,
                            color: "#D1001C",
                            marginBottom: 4
                        }}>
                            {formatCalories(training.calories)}
                        </div>
                        <div style={{
                            fontSize: 14,
                            color: "#666",
                            fontWeight: 500
                        }}>
                            Калории
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <GpsMap points={training.gpsPoints || []} />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <button
                        onClick={handleDetailsClick}
                        style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "transparent",
                            color: "#D1001C",
                            border: "1px solid #D1001C",
                            borderRadius: 8,
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "pointer"
                        }}
                    >
                        Подробнее
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrainingDetailsModal;
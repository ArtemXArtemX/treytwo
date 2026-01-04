import React from "react";
import { TrainingEvent } from "../../pages/Athlete/CalendarPage";
import GpsMap from "../GpsMap";

type Props = {
    training: TrainingEvent;
    onClose: () => void;
    formatHms: (totalSec: number) => string;
    formatPace: (paceSecPerKm: number) => string;
};

const TrainingDetailsModal: React.FC<Props> = ({ training, onClose, formatHms, formatPace }) => {
    // 1. Форматируем время без секунд (только часы:минуты)
    const formatTimeWithoutSeconds = (timeStr?: string) => {
        if (!timeStr) return "";
        // Оставляем только часы и минуты (HH:MM)
        return timeStr.split(':').slice(0, 2).join(':');
    };

    // 2. Форматируем время тренировки в ЧАСЫ:МИНУТЫ:СЕКУНДЫ
    const formatDurationHMS = (seconds?: number) => {
        if (!seconds) return "-";
        return formatHms(seconds); // Используем готовую функцию
    };

    // 3. Форматируем дистанцию -> РАССТОЯНИЕ с 2 знаками после точки
    const formatDistance = (km?: number) => {
        if (!km) return "-";
        return `${km.toFixed(2)}`; // Два знака после запятой
    };

    // 4. Форматируем подъем
    const formatElevation = (meters?: number) => {
        if (!meters) return "-";
        return `${meters}`;
    };

    // 5. Форматируем калории
    const formatCalories = (cal?: number) => {
        if (!cal) return "-";
        return `${cal}`;
    };

    // 6. Форматируем темп без /км
    const formatPaceWithoutUnit = (paceSecPerKm?: number) => {
        if (!paceSecPerKm) return "-";
        const paceStr = formatPace(paceSecPerKm);
        // Убираем "/км" из строки
        return paceStr.replace(' /км', '');
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
                {/* Заголовок с кнопкой закрытия */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                    <div>
                        {/* Имя пользователя */}
                        <h3 style={{
                            margin: 0,
                            color: "#1a1a1a",
                            fontWeight: 600
                        }}>
                            Имя пользователя
                        </h3>

                        {/* Время начала тренировки - БЕЗ ТОЧКИ и без секунд */}
                        <div style={{
                            color: "#666",
                            fontSize: 16,
                            marginTop: 4,
                        }}>
                            <span>
                                {training.date}
                                {training.startTime && ` ${formatTimeWithoutSeconds(training.startTime)}`}
                            </span>

                            {/* Статус тренировки */}
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

                {/* Название тренировки */}
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

                {/* Строка с основными метриками - БЕЗ ИКОНОК */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: 16,
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: "1px solid #e7eaf0"
                }}>
                    {/* РАССТОЯНИЕ с 2 знаками после точки */}
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

                    {/* Время в формате Ч:М:С */}
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

                    {/* Средний темп */}
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
                            Средний темп
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

                {/* Карта с GPS-треком - БЕЗ ЗАГОЛОВКА */}
                <div style={{ marginBottom: 24 }}>
                    <GpsMap points={training.gpsPoints || []} />
                </div>

                {/* Кнопка "Подробнее" - меньше */}
                <div style={{ marginBottom: 16 }}>
                    <button
                        onClick={() => {
                            // Здесь будет переход на страницу тренировки
                            console.log("Переход на страницу тренировки с ID:", training.id);
                            // TODO: Добавить навигацию на страницу тренировки
                        }}
                        style={{
                            width: "100%",
                            padding: "10px 16px",
                            background: "transparent",
                            color: "#666",
                            border: "1px solid #ddd",
                            borderRadius: 8,
                            fontWeight: 500,
                            fontSize: 14,
                            cursor: "pointer",
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
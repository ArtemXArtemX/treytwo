import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrainingEvent } from "../../pages/Athlete/CalendarPage";
import GpsMap from "../GpsMap";
import trainingService from "../../api/trainingService";

type Props = {
    training: TrainingEvent;
    onClose: () => void;
    formatHms: (totalSec: number) => string;
    formatPace: (paceSecPerKm: number) => string;
};

const TrainingDetailsModal: React.FC<Props> = ({ training, onClose, formatHms, formatPace }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        navigate(`/training/${training.id}`);
        onClose();
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        setShowDeleteConfirm(true);
        setDeleteConfirmed(false);
        setError(null);
    };

    const handleDelete = async () => {
        if (!deleteConfirmed) return;

        setIsDeleting(true);
        setError(null);

        try {
            await trainingService.deleteTraining(Number(training.id));
            onClose();
        } catch (err: any) {
            console.error("Ошибка при удалении тренировки:", err);
            setError(err.response?.data?.message || "Ошибка при удалении тренировки");
        } finally {
            setIsDeleting(false);
        }
    };

    const gpsPoints = training.gpsPoints?.map(point => ({
        lat: point.lat,
        lon: point.lon
    })) || [];

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
                position: "relative"
            }} onClick={(e) => e.stopPropagation()}>
                {showDeleteConfirm && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1002
                    }} onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmed(false);
                        setError(null);
                    }}>
                        <div style={{
                            background: "white",
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 400,
                            width: "90%",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            border: "1px solid #e7eaf0"
                        }} onClick={(e) => e.stopPropagation()}>
                            <h4 style={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                                Удалить занятие?
                            </h4>
                            <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
                                Вы уверены? Это действие нельзя отменить.
                            </p>

                            {error && (
                                <div style={{
                                    color: "#dc3545",
                                    fontSize: 14,
                                    marginBottom: 16,
                                    padding: 12,
                                    background: "#f8d7da",
                                    borderRadius: 8
                                }}>
                                    {error}
                                </div>
                            )}

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={deleteConfirmed}
                                        onChange={(e) => setDeleteConfirmed(e.target.checked)}
                                        style={{ width: 18, height: 18, cursor: "pointer" }}
                                    />
                                    <span style={{ color: "#333", fontSize: 14 }}>
                        Подтверждаю удаление
                    </span>
                                </label>
                            </div>

                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmed(false);
                                        setError(null);
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        background: "transparent",
                                        border: "1px solid #6c757d",
                                        color: "#6c757d",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: "pointer"
                                    }}
                                    disabled={isDeleting}
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={!deleteConfirmed || isDeleting}
                                    style={{
                                        padding: "8px 16px",
                                        borderRadius: 8,
                                        background: !deleteConfirmed || isDeleting ? "#dc354580" : "#dc3545",
                                        border: "none",
                                        color: "white",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        cursor: !deleteConfirmed || isDeleting ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {isDeleting ? "Удаление..." : "Удалить"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: 20,
                                    cursor: "pointer",
                                    color: "#666",
                                    lineHeight: 1,
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                    letterSpacing: "2px"
                                }}
                                aria-label="Меню"
                            >
                                ⋯
                            </button>

                            {showMenu && !showDeleteConfirm && (
                                <div style={{
                                    position: "absolute",
                                    top: "100%",
                                    right: 0,
                                    background: "white",
                                    borderRadius: 12,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    border: "1px solid #e7eaf0",
                                    minWidth: 140,
                                    zIndex: 1001,
                                    overflow: "hidden"
                                }}>
                                    <button
                                        onClick={handleDeleteClick}
                                        style={{
                                            width: "100%",
                                            padding: "12px 16px",
                                            textAlign: "left",
                                            background: "none",
                                            border: "none",
                                            color: "#dc3545",
                                            fontSize: 14,
                                            cursor: "pointer"
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                                        onMouseOut={(e) => e.currentTarget.style.background = "none"}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}
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
                    <GpsMap points={gpsPoints} apiKey="3ce511d9-9924-4617-972c-73d5ec89be1a" />
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
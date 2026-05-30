import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocation } from "react-router-dom";
import Header from '../components/Header';
import trainingService from '../api/trainingService';
import { TrainingResponse } from '../api/trainingService';
import MarkAsCompleteModal from '../components/modals/MarkAsCompleteModal';
import sportService from '../api/sportService';
import trainingTypeService from '../api/trainingTypeService';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import GpsMap from "../components/GpsMap";
import coachService from '../api/coachService';
import { useRole } from '../context/RoleContext';
import authService from '../api/authService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TrainingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isCoach } = useRole();
    const [training, setTraining] = useState<TrainingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'stats' | 'splits' | 'zones'>('stats');
    const [contentHeight, setContentHeight] = useState(0);
    const statsRef = useRef<HTMLDivElement>(null);
    const splitsRef = useRef<HTMLDivElement>(null);
    const zonesRef = useRef<HTMLDivElement>(null);

    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<any>({});

    const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);

    const [sports, setSports] = useState<any[]>([]);
    const [trainingTypes, setTrainingTypes] = useState<any[]>([]);

    const [durationHours, setDurationHours] = useState<string>("");
    const [durationMinutes, setDurationMinutes] = useState<string>("");
    const [durationSeconds, setDurationSeconds] = useState<string>("");

    const handleCompleteRefresh = async () => {
        if (!training) return;
        const updatedTraining = await trainingService.getTrainingById(training.id);
        setTraining(updatedTraining);
        setEditForm(updatedTraining);
    };

    const location = useLocation();
    const sportsmanId = location.state?.sportsmanId;

    const [coachComment, setCoachComment] = useState("");
    const [isEditingCoachComment, setIsEditingCoachComment] = useState(false);
    const [isSavingCoachComment, setIsSavingCoachComment] = useState(false);
    const currentUser = authService.getCurrentUser();
    const currentUserId = Number(currentUser?.id);

    const isDoneTraining = String(training?.status_training) === "Завершено" || Number(training?.status_training) === 1;

    const canCoachComment =
        isCoach &&
        isDoneTraining &&
        Number(training?.coach_creator) === currentUserId;

    const hasCoachComment = Boolean(training?.comment_coach || coachComment);

    const feelingLabels = [
        "😫 Очень слабым",
        "😔 Слабым",
        "😐 Нормально",
        "😊 Сильным",
        "😁 Очень сильным"
    ];

    useEffect(() => {
        const fetchTraining = async () => {
            if (!id) {
                setError("ID тренировки не указан");
                setLoading(false);
                return;
            }

            const trainingId = parseInt(id, 10);
            if (isNaN(trainingId)) {
                setError("Некорректный ID тренировки");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const data = isCoach
                    ? await coachService.getSportsmanTrainingById(trainingId, sportsmanId)
                    : await trainingService.getTrainingById(trainingId);
                console.log("Данные тренировки:", data);
                setTraining(data);
                setEditForm(data);
                setCoachComment(data.comment_coach || "");
                setIsEditingCoachComment(!data.comment_coach);

                const totalSec = data.duration || 0;
                setDurationHours(Math.floor(totalSec / 3600).toString());
                setDurationMinutes(Math.floor((totalSec % 3600) / 60).toString());
                setDurationSeconds((totalSec % 60).toString());
            } catch (err: any) {
                console.error("Ошибка загрузки тренировки:", err);
                setError(err.response?.data?.message || "Не удалось загрузить данные тренировки");
            } finally {
                setLoading(false);
            }
        };

        fetchTraining();
    }, [id]);

    useEffect(() => {
        const fetchDicts = async () => {
            try {
                const [sportsData, typesData] = await Promise.all([
                    sportService.getSports(),
                    trainingTypeService.getTrainingTypes()
                ]);
                setSports(sportsData);
                setTrainingTypes(typesData);
            } catch (error) {
                console.error('Ошибка загрузки справочников:', error);
            }
        };
        fetchDicts();
    }, []);

    useEffect(() => {
        const updateContentHeight = () => {
            if (activeTab === 'stats' && statsRef.current) {
                setContentHeight(statsRef.current.scrollHeight);
            } else if (activeTab === 'splits' && splitsRef.current) {
                setContentHeight(splitsRef.current.scrollHeight);
            } else if (activeTab === 'zones' && zonesRef.current) {
                setContentHeight(zonesRef.current.scrollHeight);
            }
        };

        updateContentHeight();
        window.addEventListener('resize', updateContentHeight);

        return () => window.removeEventListener('resize', updateContentHeight);
    }, [activeTab, training]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return "";

        const timestamp = training?.local_timestamp || training?.time_start || isoString;

        const [datePart, timePart] = timestamp.split('T');
        const [year, month, day] = datePart.split('-');
        const time = timePart.substring(0, 5);

        return `${day}.${month}.${year} • ${time}`;
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "-";

        if (seconds > 1000000) {
            seconds = seconds / 1000000;
        }

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatPaceDisplay = (speedMps?: number | null) => {
        if (!speedMps) return "-";
        const paceSecPerKm = Math.round(1000 / speedMps);
        const minutes = Math.floor(paceSecPerKm / 60);
        const seconds = paceSecPerKm % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')} /км`;
    };

    const handleSaveEdit = async () => {
        if (!training) return;

        const hours = parseInt(durationHours) || 0;
        const minutes = parseInt(durationMinutes) || 0;
        const seconds = parseInt(durationSeconds) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        const updateData = {
            id: training.id,
            sportsman_id: training.sportsman_id,
            sport_id: editForm.sport_id || training.sport_id || 1,
            type_training_id: editForm.type_training_id || training.type_training_id || 1,
            name_training: editForm.name_training || training.name_training || "",
            duration: totalSeconds,
            distance: editForm.distance || training.distance || 0,
            calories: editForm.calories || training.calories || 0,
            stress_score: editForm.stress_score || training.stress_score || 0,
            feeling_score: editForm.feeling_score || training.feeling_score || 0,
            comment_sportsman: editForm.comment_sportsman || training.comment_sportsman || "",
            time_start: training.time_start,
            local_timestamp: training.local_timestamp,
            is_gps: training.is_gps || false,
            avg_speed: training.avg_speed || 0,
            max_speed: training.max_speed || 0,
            avg_heart_rate: training.avg_heart_rate || 0,
            max_heart_rate: training.max_heart_rate || 0,
            min_heart_rate: training.min_heart_rate || 0,
            total_ascent: training.total_ascent || 0,
            total_descent: training.total_descent || 0,
            max_altitude: training.max_altitude || 0,
            avg_running_cadence: training.avg_running_cadence || 0,
            max_running_cadence: training.max_running_cadence || 0,
            avg_power: training.avg_power || 0,
            max_power: training.max_power || 0,
            status_training: Number(training.status_training) || 1
        };

        try {
            await trainingService.updateTraining(training.id, updateData);
            const updatedTraining = isCoach
                ? await coachService.getSportsmanTrainingById(training.id, sportsmanId)
                : await trainingService.getTrainingById(training.id);
            setTraining(updatedTraining);
            setEditForm(updatedTraining);
            setIsEditing(false);
        } catch (err: any) {
            console.error("Ошибка при обновлении тренировки:", err);
            alert(err.response?.data?.message || "Ошибка при сохранении изменений");
        }
    };

    const handleCancelEdit = () => {
        if (training) {
            setEditForm({
                sport_id: training.sport_id,
                type_training_id: training.type_training_id,
                name_training: training.name_training,
                duration: training.duration,
                distance: training.distance,
                calories: training.calories,
                stress_score: training.stress_score,
                feeling_score: training.feeling_score,
                comment_sportsman: training.comment_sportsman
            });

            const totalSec = training.duration || 0;
            setDurationHours(Math.floor(totalSec / 3600).toString());
            setDurationMinutes(Math.floor((totalSec % 3600) / 60).toString());
            setDurationSeconds((totalSec % 60).toString());
        }
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        setShowDeleteConfirm(true);
        setDeleteConfirmed(false);
        setDeleteError(null);
    };

    const handleDelete = async () => {
        if (!deleteConfirmed || !training) return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await trainingService.deleteTraining(training.id);
            navigate('/calendar');
        } catch (err: any) {
            console.error("Ошибка при удалении тренировки:", err);
            setDeleteError(err.response?.data?.message || "Ошибка при удалении тренировки");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSaveCoachComment = async () => {
        if (!training) return;

        try {
            setIsSavingCoachComment(true);

            await coachService.patchTrainingComment(
                training.id,
                coachComment
            );

            setTraining({
                ...training,
                comment_coach: coachComment
            });

        } catch (err: any) {
            alert(err.response?.data?.message || "Ошибка сохранения комментария");
        } finally {
            setIsSavingCoachComment(false);
        }
        setIsEditingCoachComment(false);
    };
    const getHeartRateData = () => {
        const validHeartRates = training?.heart_rates?.filter(
            (item) => item.heart_rate && item.heart_rate > 0
        );

        if (!validHeartRates || validHeartRates.length === 0) return null;

        const sortedPoints = [...validHeartRates].sort((a, b) =>
            Number(a.timestamp) - Number(b.timestamp)
        );

        return {
            datasets: [{
                label: 'Пульс (уд/мин)',
                data: sortedPoints.map((item) => ({
                    x: Number(item.timestamp),
                    y: item.heart_rate,
                })),
                borderColor: '#D1001C',
                backgroundColor: 'rgba(209, 0, 28, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                borderWidth: 2,
            }],
        };
    };

    const getPaceData = () => {
        if (!training?.paces || training.paces.length === 0) return null;

        const sortedPoints = [...training.paces].sort((a, b) =>
            Number(a.timestamp) - Number(b.timestamp)
        );

        return {
            datasets: [{
                label: 'Темп',
                data: sortedPoints.map((item) => {
                    const speedMps = Number(item.pace);

                    return {
                        x: Number(item.timestamp),
                        y: speedMps > 0 ? speedMps * 3.6 : null,
                    };
                }),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                borderWidth: 2,
            }],
        };
    };

    const getAltitudeData = () => {
        if (!training?.altitudes || training.altitudes.length === 0) return null;

        const sortedPoints = [...training.altitudes].sort((a, b) =>
            Number(a.timestamp) - Number(b.timestamp)
        );

        return {
            datasets: [{
                label: 'Высота (м)',
                data: sortedPoints.map((item) => ({
                    x: Number(item.timestamp),
                    y: item.altitude,
                })),
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                borderWidth: 2,
            }],
        };
    };

    const formatChartTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const getChartTimeOptions = () => {
        const duration = training?.duration || 0;

        return {
            type: 'linear' as const,
            min: 0,
            max: duration,
            display: true,
            grid: {
                display: false,
            },
            ticks: {
                maxTicksLimit: 10,
                callback: (value: string | number): string => {
                    return formatChartTime(Number(value));
                },
            },
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    title: (items: any[]): string => {
                        return formatChartTime(Number(items[0].parsed.x));
                    },
                    label: (context: any) => {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                }
            },
        },
        scales: {
            x: getChartTimeOptions(),
            y: {
                display: true,
                beginAtZero: false,
                ticks: {
                    maxTicksLimit: 6,
                },
            },
        },
        elements: {
            point: {
                radius: 0,
            },
        },
    };

    const paceChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    title: (items: any[]): string => {
                        return formatChartTime(Number(items[0].parsed.x));
                    },
                    label: (context: any): string => {
                        return `Темп: ${formatPaceFromKmh(Number(context.parsed.y))}`;
                    },
                },
            },
        },
        scales: {
            x: getChartTimeOptions(),
            y: {
                display: true,
                beginAtZero: false,
                min: 5,
                ticks: {
                    maxTicksLimit: 6,
                    callback: (value: string | number): string => {
                        return formatPaceFromKmh(Number(value));
                    },
                },
            },
        },
    };

    const formatPaceFromKmh = (speedKmh: number) => {
        if (!Number.isFinite(speedKmh) || speedKmh <= 1) return "";

        const speedMps = speedKmh / 3.6;
        const paceMin = 16.67 / speedMps;
        const minutes = Math.floor(paceMin);
        const seconds = Math.round((paceMin - minutes) * 60);

        return `${minutes}:${seconds.toString().padStart(2, "0")} /км`;
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
                <Header />
                <div className="container py-4 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !training) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
                <Header />
                <div className="container py-4">
                    <div className="alert alert-danger" role="alert">
                        {error || "Тренировка не найдена"}
                    </div>
                    <button className="btn btn-secondary" onClick={() => navigate('/calendar')}>
                        Вернуться в календарь
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header />

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
                    zIndex: 1002,
                    backgroundColor: "rgba(0,0,0,0.5)"
                }} onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmed(false);
                    setDeleteError(null);
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

                        {deleteError && (
                            <div style={{
                                color: "#dc3545",
                                fontSize: 14,
                                marginBottom: 16,
                                padding: 12,
                                background: "#f8d7da",
                                borderRadius: 8
                            }}>
                                {deleteError}
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
                                    setDeleteError(null);
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

            <div className="container py-4">
                <div className="row mb-4">
                    <div className="col-12">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>

                                {isEditing && (
                                    <div className="row mb-4">
                                        <div className="col-12">
                                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    style={{
                                                        padding: "8px 20px",
                                                        borderRadius: "8px",
                                                        background: "transparent",
                                                        border: "1px solid #6c757d",
                                                        color: "#6c757d",
                                                        fontSize: "14px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    style={{
                                                        padding: "8px 20px",
                                                        borderRadius: "8px",
                                                        background: "#D1001C",
                                                        border: "none",
                                                        color: "white",
                                                        fontSize: "14px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Сохранить
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isEditing ? (
                                    <h1 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "28px", marginBottom: "8px" }}>
                                        {training.name_training || "Тренировка"}
                                    </h1>
                                ) : (
                                    <input
                                        type="text"
                                        value={editForm.name_training || ""}
                                        onChange={(e) => setEditForm({ ...editForm, name_training: e.target.value })}
                                        style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", border: "1px solid #D1001C", borderRadius: "8px", padding: "4px 8px", width: "100%" }}
                                    />
                                )}
                                <div style={{ color: "#666", fontSize: "14px", marginTop: "4px", marginBottom: "12px" }}>
                                    {formatTime(training.time_start)}
                                </div>
                                {!isEditing ? (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#f8f9fa",
            padding: "6px 16px",
            borderRadius: "20px",
            border: "1px solid #e7eaf0",
            fontSize: "14px",
            color: "#333"
        }}>
            Вид спорта: {training.sport || "Не указан"}
        </span>
                                        <span style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            background: "#f8f9fa",
                                            padding: "6px 16px",
                                            borderRadius: "20px",
                                            border: "1px solid #e7eaf0",
                                            fontSize: "14px",
                                            color: "#333"
                                        }}>
            Тип тренировки: {training.type_training || "Не указан"}
        </span>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                        <select
                                            value={editForm.sport_id || training.sport_id || 1}
                                            onChange={(e) => setEditForm({ ...editForm, sport_id: parseInt(e.target.value) })}
                                            style={{
                                                width: "200px",
                                                padding: "8px 32px 8px 16px",
                                                borderRadius: "20px",
                                                background: "white",
                                                border: "1px solid #e0e4e8",
                                                color: "#1a1a1a",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                outline: "none",
                                                transition: "all 0.2s ease",
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                MozAppearance: "none",
                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D1001C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                backgroundRepeat: "no-repeat",
                                                backgroundPosition: "right 12px center",
                                                backgroundSize: "14px"
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#D1001C";
                                                e.target.style.boxShadow = "0 0 0 3px rgba(209, 0, 28, 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "#e0e4e8";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        >
                                            {sports.map(sport => (
                                                <option key={sport.id} value={sport.id}>
                                                    {sport.sport_name || sport.name || `Вид спорта ${sport.id}`}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            value={editForm.type_training_id || training.type_training_id || 1}
                                            onChange={(e) => setEditForm({ ...editForm, type_training_id: parseInt(e.target.value) })}
                                            style={{
                                                width: "200px",
                                                padding: "8px 32px 8px 16px",
                                                borderRadius: "20px",
                                                background: "white",
                                                border: "1px solid #e0e4e8",
                                                color: "#1a1a1a",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                cursor: "pointer",
                                                fontFamily: "inherit",
                                                outline: "none",
                                                transition: "all 0.2s ease",
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                MozAppearance: "none",
                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23D1001C' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                backgroundRepeat: "no-repeat",
                                                backgroundPosition: "right 12px center",
                                                backgroundSize: "14px"
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#D1001C";
                                                e.target.style.boxShadow = "0 0 0 3px rgba(209, 0, 28, 0.1)";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = "#e0e4e8";
                                                e.target.style.boxShadow = "none";
                                            }}
                                        >
                                            {trainingTypes.map(type => (
                                                <option key={type.id} value={type.id}>
                                                    {type.type_training_name || type.name || `Тип тренировки ${type.id}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div style={{ position: "relative" }}>
                                <button
                                    onClick={() => setShowMenu(!showMenu)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: 24,
                                        cursor: "pointer",
                                        color: "#666",
                                        lineHeight: 1,
                                        padding: "4px 12px",
                                        borderRadius: 4,
                                        letterSpacing: "2px"
                                    }}
                                    aria-label="Меню"
                                >
                                    {!isCoach && (
                                        <div style={{ position: "relative" }}>
                                            ⋯
                                        </div>
                                    )}
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
                                        minWidth: 200,
                                        zIndex: 1001,
                                        overflow: "hidden"
                                    }}>
                                        <button
                                            onClick={() => {
                                                setShowMarkCompleteModal(true);
                                                setShowMenu(false);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                color: "#333",
                                                fontSize: 14,
                                                cursor: "pointer"
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "none"}
                                        >
                                            Отметить выполнение
                                        </button>

                                        <button
                                            onClick={() => {
                                                setIsEditing(true);
                                                setShowMenu(false);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                color: "#333",
                                                fontSize: 14,
                                                cursor: "pointer"
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#f8f9fa"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "none"}
                                        >
                                            Редактировать
                                        </button>

                                        <button
                                            onClick={handleDeleteClick}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                textAlign: "left",
                                                background: "none",
                                                border: "none",
                                                color: "#333",
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
                        </div>
                    </div>
                </div>


                <div className="row mb-5">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body">
                                <div className="row g-0 text-center">
                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Дистанция
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editForm.distance ? (editForm.distance / 1000).toFixed(2) : 0}
                                                onChange={(e) => setEditForm({ ...editForm, distance: Math.round(parseFloat(e.target.value) * 1000) })}
                                                style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700, width: "120px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px", padding: "4px" }}
                                            />
                                        ) : (
                                            <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                                {training.distance ? (training.distance / 1000).toFixed(2) : "-"} км
                                            </div>
                                        )}
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Время
                                        </div>
                                        {isEditing ? (
                                            <div style={{ display: "flex", gap: "4px", alignItems: "center", justifyContent: "center" }}>
                                                <input
                                                    type="number"
                                                    placeholder="Ч"
                                                    value={durationHours}
                                                    onChange={(e) => setDurationHours(e.target.value)}
                                                    style={{ width: "50px", padding: "4px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
                                                />
                                                <span>:</span>
                                                <input
                                                    type="number"
                                                    placeholder="М"
                                                    value={durationMinutes}
                                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                                    style={{ width: "50px", padding: "4px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
                                                />
                                                <span>:</span>
                                                <input
                                                    type="number"
                                                    placeholder="С"
                                                    value={durationSeconds}
                                                    onChange={(e) => setDurationSeconds(e.target.value)}
                                                    style={{ width: "50px", padding: "4px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                                {formatDuration(training.duration)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Средний темп
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {formatPaceDisplay(training.avg_speed)}
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Общий подъём
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {training.total_ascent ?? "-"} м
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Калории
                                        </div>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={editForm.calories || 0}
                                                onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                                                style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700, width: "100px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px", padding: "4px" }}
                                            />
                                        ) : (
                                            <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                                {training.calories ?? "-"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row g-4 mb-5 align-items-stretch">
                    <div className="col-lg-6">
                        <div
                            className="card border-0 shadow-sm"
                            style={{
                                borderRadius: "12px",
                                height: "100%"
                            }}
                        >
                            <div
                                className="card-body p-4"
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%"
                                }}
                            >
                                <h5
                                    style={{
                                        color: "#1a1a1a",
                                        fontWeight: 600,
                                        marginBottom: "20px"
                                    }}
                                >
                                    GPS-трек
                                </h5>

                                <div
                                    style={{
                                        flex: 1,
                                        minHeight: "430px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        overflow: "hidden"
                                    }}
                                >
                                    {training.is_gps && training.trackpoints ? (
                                        <GpsMap
                                            points={training.trackpoints.map(tp => ({
                                                lat: tp.latitude,
                                                lon: tp.longitude
                                            }))}
                                            apiKey="3ce511d9-9924-4617-972c-73d5ec89be1a"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#666"
                                            }}
                                        >
                                            GPS данные отсутствуют
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", flex: 1 }}>
                                <div className="card-body p-4">
                                    <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                        Примечания
                                    </h5>

                                    <div
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "8px",
                                            padding: "15px",
                                            minHeight: "140px"
                                        }}
                                    >
                                        {isEditing ? (
                                            <textarea
                                                value={editForm.comment_sportsman || ""}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, comment_sportsman: e.target.value })
                                                }
                                                style={{
                                                    width: "100%",
                                                    minHeight: "120px",
                                                    border: "1px solid #D1001C",
                                                    borderRadius: "8px",
                                                    padding: "8px",
                                                    resize: "none"
                                                }}
                                            />
                                        ) : (
                                            <div style={{ whiteSpace: "pre-wrap" }}>
                                                {training.comment_sportsman || "Нет примечаний"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", flex: 1 }}>
                                <div className="card-body p-4">
                                    <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                        Комментарий тренера
                                    </h5>

                                    <div
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            borderRadius: "8px",
                                            padding: "15px",
                                            minHeight: "140px",
                                            display: "flex",
                                            flexDirection: "column"
                                        }}
                                    >
                                        {isCoach ? (
                                            canCoachComment ? (
                                                isEditingCoachComment ? (
                                                    <>
                <textarea
                    value={coachComment}
                    onChange={(e) => setCoachComment(e.target.value)}
                    placeholder="Напишите комментарий спортсмену..."
                    style={{
                        width: "100%",
                        minHeight: "95px",
                        border: "1px solid #D1001C",
                        borderRadius: "8px",
                        padding: "10px",
                        resize: "none"
                    }}
                />

                                                        <div style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                            marginTop: "12px"
                                                        }}>
                                                            <button
                                                                onClick={handleSaveCoachComment}
                                                                disabled={isSavingCoachComment || !coachComment.trim()}
                                                                style={{
                                                                    flex: 1,
                                                                    padding: "10px 16px",
                                                                    borderRadius: "8px",
                                                                    background: "#D1001C",
                                                                    border: "none",
                                                                    color: "white",
                                                                    fontWeight: 500,
                                                                    cursor: isSavingCoachComment || !coachComment.trim() ? "not-allowed" : "pointer",
                                                                    opacity: isSavingCoachComment || !coachComment.trim() ? 0.7 : 1
                                                                }}
                                                            >
                                                                {isSavingCoachComment
                                                                    ? "Сохранение..."
                                                                    : training.comment_coach
                                                                        ? "Сохранить"
                                                                        : "Отправить"}
                                                            </button>

                                                            {training.comment_coach && (
                                                                <button
                                                                    onClick={() => {
                                                                        setCoachComment(training.comment_coach || "");
                                                                        setIsEditingCoachComment(false);
                                                                    }}
                                                                    disabled={isSavingCoachComment}
                                                                    style={{
                                                                        padding: "10px 16px",
                                                                        borderRadius: "8px",
                                                                        background: "transparent",
                                                                        border: "1px solid #6c757d",
                                                                        color: "#6c757d",
                                                                        fontWeight: 500,
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Отмена
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div style={{ position: "relative", minHeight: "95px" }}>
                                                        <button
                                                            onClick={() => setIsEditingCoachComment(true)}
                                                            title="Редактировать комментарий"
                                                            style={{
                                                                position: "absolute",
                                                                top: 0,
                                                                right: 0,
                                                                border: "none",
                                                                background: "transparent",
                                                                color: "#D1001C",
                                                                cursor: "pointer",
                                                                fontSize: "18px",
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            ✎
                                                        </button>

                                                        <div style={{
                                                            whiteSpace: "pre-wrap",
                                                            lineHeight: 1.5,
                                                            paddingRight: "28px"
                                                        }}>
                                                            {training.comment_coach}
                                                        </div>
                                                    </div>
                                                )
                                            ) : (
                                                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#666" }}>
                                                    {training.comment_coach || "Комментарий тренера недоступен для этой тренировки"}
                                                </div>
                                            )
                                        ) : (
                                            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                                                {training.comment_coach || "Комментарий тренера отсутствует"}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="row mb-5">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h5>Высота</h5>
                                <div style={{ height: "200px" }}>
                                    {getAltitudeData() ? <Line data={getAltitudeData()!} options={chartOptions} /> : "Нет данных"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h5>Темп</h5>
                                <div style={{ height: "200px" }}>
                                    {getPaceData() ? <Line data={getPaceData()!} options={paceChartOptions} /> : "Нет данных"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-body p-4">
                                <h5>Пульс</h5>
                                <div style={{ height: "200px" }}>
                                    {getHeartRateData() ? <Line data={getHeartRateData()!} options={chartOptions} /> : "Нет данных"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-0">
                                <div className="d-flex border-bottom">
                                    <button
                                        className={`btn btn-link text-decoration-none py-3 px-4 ${activeTab === 'stats' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('stats')}
                                        style={{
                                            flex: 1,
                                            color: activeTab === 'stats' ? '#D1001C' : '#666',
                                            fontWeight: activeTab === 'stats' ? 600 : 500,
                                            borderBottom: activeTab === 'stats' ? '3px solid #D1001C' : 'none',
                                            borderRadius: 0,
                                            transition: 'none'
                                        }}
                                    >
                                        Статистика
                                    </button>
                                    <button
                                        className={`btn btn-link text-decoration-none py-3 px-4 ${activeTab === 'splits' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('splits')}
                                        style={{
                                            flex: 1,
                                            color: activeTab === 'splits' ? '#D1001C' : '#666',
                                            fontWeight: activeTab === 'splits' ? 600 : 500,
                                            borderBottom: activeTab === 'splits' ? '3px solid #D1001C' : 'none',
                                            borderRadius: 0,
                                            transition: 'none'
                                        }}
                                    >
                                        Круги
                                    </button>
                                    <button
                                        className={`btn btn-link text-decoration-none py-3 px-4 ${activeTab === 'zones' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('zones')}
                                        style={{
                                            flex: 1,
                                            color: activeTab === 'zones' ? '#D1001C' : '#666',
                                            fontWeight: activeTab === 'zones' ? 600 : 500,
                                            borderBottom: activeTab === 'zones' ? '3px solid #D1001C' : 'none',
                                            borderRadius: 0,
                                            transition: 'none'
                                        }}
                                    >
                                        Время в зонах
                                    </button>
                                </div>

                                <div
                                    className="p-4"
                                    style={{
                                        minHeight: contentHeight > 0 ? `${contentHeight}px` : 'auto',
                                        transition: 'min-height 0.3s ease'
                                    }}
                                >
                                    {activeTab === 'stats' && (
                                        <div ref={statsRef}>
                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Расстояние
                                                    </h6>
                                                    <div style={{ fontSize: "18px", color: "#1a1a1a" }}>
                                                        {training.distance ? (training.distance / 1000).toFixed(2) : "-"} км
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Оценка собственного состояния
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Воспринимаемые усилия
                                                            </div>
                                                            {isEditing ? (
                                                                <div>
                                                                    <div className="d-flex align-items-center">
                                                                        <input
                                                                            type="range"
                                                                            className="form-range"
                                                                            min="1"
                                                                            max="10"
                                                                            step="1"
                                                                            value={editForm.stress_score || 1}
                                                                            onChange={(e) => setEditForm({ ...editForm, stress_score: parseInt(e.target.value) })}
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <span className="ms-3 fw-bold" style={{ minWidth: "30px", textAlign: "center" }}>
                                                                            {editForm.stress_score || 1}/10
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                    {training.stress_score ?? "-"}/10
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Как вы себя чувствовали?
                                                            </div>
                                                            {isEditing ? (
                                                                <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
                                                                    {feelingLabels.map((label, idx) => (
                                                                        <button
                                                                            key={idx + 1}
                                                                            type="button"
                                                                            onClick={() => setEditForm({ ...editForm, feeling_score: idx + 1 })}
                                                                            style={{
                                                                                flex: "1 1 0",
                                                                                borderRadius: "8px",
                                                                                padding: "8px",
                                                                                border: "1px solid #D1001C",
                                                                                backgroundColor: editForm.feeling_score === idx + 1 ? "#D1001C" : "transparent",
                                                                                color: editForm.feeling_score === idx + 1 ? "white" : "#D1001C",
                                                                                cursor: "pointer",
                                                                                fontSize: "12px"
                                                                            }}
                                                                        >
                                                                            {label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                    {training.feeling_score ? feelingLabels[training.feeling_score - 1] : "-"}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Пульс
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Средняя частота пульса
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.avg_heart_rate ?? "-"} уд/мин
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальная частота пульса
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.max_heart_rate ?? "-"} уд/мин
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Минимальная частота пульса
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.min_heart_rate ?? "-"} уд/мин
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Высота
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Общий подъём
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.total_ascent ?? "-"} м
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Общий спуск
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.total_descent ?? "-"} м
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальная высота
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.max_altitude ?? "-"} м
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Темп и скорость
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Средний темп
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {formatPaceDisplay(training.avg_speed)}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальный темп
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {formatPaceDisplay(training.max_speed)}
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Средняя скорость
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.avg_speed ? (training.avg_speed * 3.6).toFixed(1) : "-"} км/ч
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Макс. скорость
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.max_speed ? (training.max_speed * 3.6).toFixed(1) : "-"} км/ч
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {(training.avg_running_cadence || training.max_running_cadence || training.avg_power || training.max_power) && (
                                                <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                    <div className="card-body p-4">
                                                        <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                            Дополнительные показатели
                                                        </h6>
                                                        <div className="row">
                                                            {training.avg_running_cadence && (
                                                                <div className="col-md-6 mb-3">
                                                                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                        Средний каденс
                                                                    </div>
                                                                    <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                        {training.avg_running_cadence} шаг/мин
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {training.max_running_cadence && (
                                                                <div className="col-md-6 mb-3">
                                                                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                        Макс. каденс
                                                                    </div>
                                                                    <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                        {training.max_running_cadence} шаг/мин
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {training.avg_power && (
                                                                <div className="col-md-6 mb-3">
                                                                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                        Средняя мощность
                                                                    </div>
                                                                    <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                        {training.avg_power} Вт
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {training.max_power && (
                                                                <div className="col-md-6 mb-3">
                                                                    <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                        Макс. мощность
                                                                    </div>
                                                                    <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                        {training.max_power} Вт
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'splits' && (
                                        <div ref={splitsRef}>
                                            <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                                Круги
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table" style={{ border: "none", marginBottom: "0" }}>
                                                    <thead>
                                                    <tr>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Круг</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Время</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Дистанция</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Ср. пульс</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Макс. пульс</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Ср. мощность</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Макс. мощность</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px", textAlign: "center" }}>Описание</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {training.laps && training.laps.length > 0 ? (
                                                        training.laps.map((lap, index) => (
                                                            <tr key={index} style={{ borderTop: "1px solid #e7eaf0" }}>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", fontWeight: 500, textAlign: "center" }}>
                                                                    {index + 1}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {formatDuration(lap.duration)}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.distance ? (lap.distance / 1000).toFixed(2) : "-"} км
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.avg_heart_rate ?? "-"} уд/мин
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.max_heart_rate ?? "-"} уд/мин
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.avg_power ?? "-"} Вт
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.max_power ?? "-"} Вт
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", textAlign: "center" }}>
                                                                    {lap.lap_caption === "time" ? "-" : (lap.lap_caption || "-")}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={8} className="text-center text-muted py-3" style={{ textAlign: "center" }}>
                                                                Нет данных по кругам
                                                            </td>
                                                        </tr>
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'zones' && (
                                        <div ref={zonesRef} style={{ minHeight: "400px" }}>
                                            <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                                Время в зонах пульса
                                            </h6>
                                            <div className="text-center text-muted py-5">
                                                Данные по зонам пульса отсутствуют
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {!isCoach && showMarkCompleteModal && training && (
                <MarkAsCompleteModal
                    training={{
                        id: String(training.id),
                        date: training.time_start?.split('T')[0] || '',
                        status: String(training.status_training) === "Завершено" ? "done" : "planned",
                        name: training.name_training || undefined,
                        sport: training.sport_id,
                        typeTraining: training.type_training_id,
                        note: training.comment_sportsman || undefined,
                        startTime: training.time_start?.split('T')[1]?.substring(0, 5),
                        distanceKm: training.distance ? training.distance / 1000 : undefined,
                        durationSec: training.duration || undefined,
                        avgHr: training.avg_heart_rate || undefined,
                        avgPaceSecPerKm: training.avg_speed ? Math.round(1000 / training.avg_speed) : undefined,
                        elevationGainM: training.total_ascent || undefined,
                        elevationLossM: training.total_descent || undefined,
                        calories: training.calories || undefined,
                        stress_score: training.stress_score,
                        feeling_score: training.feeling_score,
                    }}
                    onClose={() => setShowMarkCompleteModal(false)}
                    onComplete={handleCompleteRefresh}
                />
            )}
        </div>
    );
};

export default TrainingDetailPage;
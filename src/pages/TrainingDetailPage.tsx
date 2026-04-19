import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import trainingService from '../api/trainingService';
import { TrainingResponse } from '../api/trainingService';

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
                const data = await trainingService.getTrainingById(trainingId);
                setTraining(data);
                setEditForm(data);
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

    const [editingLapId, setEditingLapId] = useState<number | null>(null);
    const [editingLapCaption, setEditingLapCaption] = useState("");
    const handleSaveLapCaption = async (lapId: number) => {
        if (!training) return;
        try {
            await trainingService.patchLapCaption(training.id, lapId, editingLapCaption);
            const updatedTraining = await trainingService.getTrainingById(training.id);
            setTraining(updatedTraining);
            setEditingLapId(null);
            setEditingLapCaption("");
        } catch (error) {
            console.error("Ошибка сохранения описания круга:", error);
        }
    };

    const handleEditClick = () => {
        setShowMenu(false);
        setIsEditing(true);
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

    const handleSaveEdit = async () => {
        if (!training) return;

        const updateData = {
            id: training.id,
            sportsman_id: training.sportsman_id,
            sport_id: training.sport_id || 1,
            type_training_id: training.type_training_id || 1,
            name_training: editForm.name_training || training.name_training || "",
            duration: editForm.duration || training.duration || 0,
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

        console.log("Sending updateData:", updateData);

        try {
            await trainingService.updateTraining(training.id, updateData);
            const updatedTraining = await trainingService.getTrainingById(training.id);
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
        }
        setIsEditing(false);
    };

    const getHeartRateData = () => {
        if (!training?.heart_rates || training.heart_rates.length === 0) return null;

        const sortedPoints = [...training.heart_rates].sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const startTime = new Date(sortedPoints[0].timestamp).getTime();

        return {
            labels: sortedPoints.map((item) => {
                const currentTime = new Date(item.timestamp).getTime();
                const secondsFromStart = Math.floor((currentTime - startTime) / 1000);
                const minutes = Math.floor(secondsFromStart / 60);
                const seconds = secondsFromStart % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }),
            datasets: [{
                label: 'Пульс (уд/мин)',
                data: sortedPoints.map((item) => item.heart_rate),
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
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const startTime = new Date(sortedPoints[0].timestamp).getTime();

        return {
            labels: sortedPoints.map((item) => {
                const currentTime = new Date(item.timestamp).getTime();
                const secondsFromStart = Math.floor((currentTime - startTime) / 1000);
                const minutes = Math.floor(secondsFromStart / 60);
                const seconds = secondsFromStart % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }),
            datasets: [{
                label: 'Темп (мин/км)',
                data: sortedPoints.map((item) => item.pace),
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
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const startTime = new Date(sortedPoints[0].timestamp).getTime();

        return {
            labels: sortedPoints.map((item) => {
                const currentTime = new Date(item.timestamp).getTime();
                const secondsFromStart = Math.floor((currentTime - startTime) / 1000);
                const minutes = Math.floor(secondsFromStart / 60);
                const seconds = secondsFromStart % 60;
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }),
            datasets: [{
                label: 'Высота (м)',
                data: sortedPoints.map((item) => item.altitude),
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                borderWidth: 2,
            }],
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
            },
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false,
                },
            },
            y: {
                display: true,
                beginAtZero: false,
            },
        },
        elements: {
            point: {
                radius: 0,
            },
        },
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
                            <div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.name_training || ""}
                                        onChange={(e) => setEditForm({ ...editForm, name_training: e.target.value })}
                                        style={{
                                            fontSize: "28px",
                                            fontWeight: 700,
                                            color: "#1a1a1a",
                                            border: "1px solid #D1001C",
                                            borderRadius: "8px",
                                            padding: "4px 12px",
                                            width: "100%",
                                            maxWidth: "400px"
                                        }}
                                    />
                                ) : (
                                    <h1 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "28px" }}>
                                        {training.name_training || "Тренировка"}
                                    </h1>
                                )}
                                <div style={{ color: "#666", fontSize: "14px" }}>
                                    {formatTime(training.time_start)}
                                </div>
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
                                            onClick={handleEditClick}
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
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="row mb-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <h5 style={{ marginBottom: "20px", color: "#1a1a1a", fontWeight: 600 }}>Редактирование тренировки</h5>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Название тренировки</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editForm.name_training || ""}
                                                onChange={(e) => setEditForm({ ...editForm, name_training: e.target.value })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Вид спорта (ID)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editForm.sport_id || 0}
                                                onChange={(e) => setEditForm({ ...editForm, sport_id: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Тип тренировки (ID)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editForm.type_training_id || 0}
                                                onChange={(e) => setEditForm({ ...editForm, type_training_id: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Длительность (сек)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editForm.duration || 0}
                                                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Дистанция (м)</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editForm.distance || 0}
                                                onChange={(e) => setEditForm({ ...editForm, distance: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Калории</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editForm.calories || 0}
                                                onChange={(e) => setEditForm({ ...editForm, calories: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Нагрузка (1-10)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="form-control"
                                                value={editForm.stress_score || 0}
                                                onChange={(e) => setEditForm({ ...editForm, stress_score: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Самочувствие (1-5)</label>
                                            <select
                                                className="form-control"
                                                value={editForm.feeling_score || 0}
                                                onChange={(e) => setEditForm({ ...editForm, feeling_score: parseInt(e.target.value) || 0 })}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            >
                                                <option value="0">Выберите</option>
                                                {feelingLabels.map((label, idx) => (
                                                    <option key={idx + 1} value={idx + 1}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-12 mb-3">
                                            <label style={{ display: "block", marginBottom: "5px", color: "#666", fontSize: "14px" }}>Комментарий</label>
                                            <textarea
                                                className="form-control"
                                                value={editForm.comment_sportsman || ""}
                                                onChange={(e) => setEditForm({ ...editForm, comment_sportsman: e.target.value })}
                                                rows={3}
                                                style={{ borderRadius: "8px", border: "1px solid #ddd", padding: "8px 12px" }}
                                            />
                                        </div>
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                                value={editForm.distance || 0}
                                                onChange={(e) => setEditForm({ ...editForm, distance: parseInt(e.target.value) || 0 })}
                                                style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700, width: "100px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
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
                                            <input
                                                type="number"
                                                value={editForm.duration || 0}
                                                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                                                style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700, width: "120px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
                                            />
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
                                                style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700, width: "100px", textAlign: "center", border: "1px solid #D1001C", borderRadius: "4px" }}
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

                <div className="row mb-5">
                    <div className="col-md-8 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "400px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    GPS-трек
                                </h5>
                                {training.is_gps && training.trackpoints ? (
                                    <GpsMap
                                        points={training.trackpoints.map(tp => ({
                                            lat: tp.latitude,
                                            lon: tp.longitude
                                        }))}
                                        apiKey="3ce511d9-9924-4617-972c-73d5ec89be1a"
                                    />
                                ) : (
                                    <div style={{
                                        height: "300px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "8px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#666"
                                    }}>
                                        GPS данные отсутствуют
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "400px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    Примечания
                                </h5>
                                <div style={{
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    padding: "15px",
                                    minHeight: "300px"
                                }}>
                                    {isEditing ? (
                                        <textarea
                                            value={editForm.comment_sportsman || ""}
                                            onChange={(e) => setEditForm({ ...editForm, comment_sportsman: e.target.value })}
                                            style={{ width: "100%", minHeight: "260px", border: "1px solid #D1001C", borderRadius: "8px", padding: "8px" }}
                                        />
                                    ) : (
                                        training.comment_sportsman || "Нет примечаний"
                                    )}
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
                                    {getPaceData() ? <Line data={getPaceData()!} options={chartOptions} /> : "Нет данных"}
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
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    max="10"
                                                                    value={editForm.stress_score || 0}
                                                                    onChange={(e) => setEditForm({ ...editForm, stress_score: parseInt(e.target.value) || 0 })}
                                                                    style={{ fontSize: "18px", width: "80px", border: "1px solid #D1001C", borderRadius: "4px", padding: "4px" }}
                                                                />
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
                                                                <select
                                                                    value={editForm.feeling_score || 0}
                                                                    onChange={(e) => setEditForm({ ...editForm, feeling_score: parseInt(e.target.value) || 0 })}
                                                                    style={{ fontSize: "18px", border: "1px solid #D1001C", borderRadius: "4px", padding: "4px" }}
                                                                >
                                                                    <option value="0">Выберите</option>
                                                                    {feelingLabels.map((label, idx) => (
                                                                        <option key={idx + 1} value={idx + 1}>{label}</option>
                                                                    ))}
                                                                </select>
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
        </div>
    );
};

export default TrainingDetailPage;
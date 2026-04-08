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

            <div className="container py-4">
                <div className="row mb-4">
                    <div className="col-12">
                        <h1 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "28px" }}>
                            {training.name_training || "Тренировка"}
                        </h1>
                        <div style={{ color: "#666", fontSize: "14px" }}>
                            {formatTime(training.time_start)}
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
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {training.distance ? (training.distance / 1000).toFixed(2) : "-"} км
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Время
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {formatDuration(training.duration)}
                                        </div>
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
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {training.calories ?? "-"}
                                        </div>
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
                                    {training.comment_sportsman || "Нет примечаний"}
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
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.stress_score ?? "-"}/10
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Как вы себя чувствовали?
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {training.feeling_score ? feelingLabels[training.feeling_score - 1] : "-"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Пульс */}
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

                                            {/* Высота */}
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

                                            {/* Темп и скорость */}
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

                                            {/* Каденс и мощность */}
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
                                                Сплиты (круги)
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table" style={{ border: "none", marginBottom: "0" }}>
                                                    <thead>
                                                    <tr>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Круг</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Описание</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Время</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Дистанция</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Ср. пульс</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Макс. пульс</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Макс. скорость</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Ср. мощность</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Действия</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {training.laps && training.laps.length > 0 ? (
                                                        training.laps.map((lap) => (
                                                            <tr key={lap.lap_number} style={{ borderTop: "1px solid #e7eaf0" }}>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                    {lap.lap_number}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {editingLapId === lap.lap_number ? (
                                                                        <input
                                                                            type="text"
                                                                            value={editingLapCaption}
                                                                            onChange={(e) => setEditingLapCaption(e.target.value)}
                                                                            onBlur={() => handleSaveLapCaption(lap.lap_number)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') handleSaveLapCaption(lap.lap_number);
                                                                            }}
                                                                            autoFocus
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "4px 8px",
                                                                                borderRadius: "4px",
                                                                                border: "1px solid #D1001C",
                                                                                outline: "none"
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span>{lap.lap_caption || "-"}</span>
                                                                    )}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {formatDuration(lap.duration)}
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lap.distance ? (lap.distance / 1000).toFixed(2) : "-"} км
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lap.avg_heart_rate ?? "-"} уд/мин
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lap.max_heart_rate ?? "-"} уд/мин
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lap.max_speed ? (lap.max_speed * 3.6).toFixed(1) : "-"} км/ч
                                                                </td>
                                                                <td style={{ padding: "12px 15px", color: "#1a1a1a" }}>
                                                                    {lap.avg_power ?? "-"} Вт
                                                                </td>
                                                                <td style={{ padding: "12px 15px" }}>
                                                                    {editingLapId !== lap.lap_number && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingLapId(lap.lap_number);
                                                                                setEditingLapCaption(lap.lap_caption || "");
                                                                            }}
                                                                            style={{
                                                                                background: "none",
                                                                                border: "none",
                                                                                cursor: "pointer",
                                                                                fontSize: "16px",
                                                                                color: "#D1001C"
                                                                            }}
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={9} className="text-center text-muted py-3">
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
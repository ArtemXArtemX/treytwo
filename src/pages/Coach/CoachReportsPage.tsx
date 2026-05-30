import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import Header from '../../components/Header';
import coachService from "../../api/coachService";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

interface Metrics {
    totalTrainings: number;
    totalDistance: number;
    totalDuration: number;
    avgPace: number;
    totalCalories: number;
    totalAscent: number;
    totalDescent: number;
}

interface ChartDataPoint {
    date: string;
    distance: number;
    duration: number;
    sessions: number;
    avgSpeed: number;
    maxSpeed: number;
    avgHr: number;
    ascent: number;
    descent: number;
}

interface ExtraChart {
    id: string;
    metric: string;
    color: string;
}

interface Athlete {
    id: number;
    fullname?: string;
    surname?: string;
    name?: string;
    fathername?: string;
    nickname?: string;
    email?: string;
}

type Period = 'year' | 'month' | 'week' | 'custom';

const formatDurationHM = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours} ч ${minutes} мин`;
    return `${minutes} мин`;
};

const formatTimeHMS = (value: number): string => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const seconds = Math.floor(value % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const metricOptions = [
    { value: 'distance', label: 'Дистанция (км)', type: 'bar', unit: 'км' },
    { value: 'duration', label: 'Продолжительность', type: 'bar', unit: 'ч:мм:сс' },
    { value: 'ascent', label: 'Подъём (м)', type: 'bar', unit: 'м' },
    { value: 'descent', label: 'Спуск (м)', type: 'bar', unit: 'м' },
    { value: 'pace', label: 'Темп (мин/км)', type: 'line', unit: 'мин/км' },
    { value: 'maxSpeed', label: 'Макс. скорость (м/с)', type: 'line', unit: 'м/с' },
    { value: 'avgHr', label: 'Пульс (уд/мин)', type: 'line', unit: 'уд/мин' },
    { value: 'sessions', label: 'Количество сессий', type: 'bar', unit: 'шт' },
];

const CoachReportsPage: React.FC = () => {
    const [period, setPeriod] = useState<Period>('month');
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [metrics, setMetrics] = useState<Metrics>({
        totalTrainings: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 0,
        totalCalories: 0,
        totalAscent: 0,
        totalDescent: 0
    });
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

    const [barMetric, setBarMetric] = useState<'distance' | 'duration' | 'ascent' | 'descent'>('distance');
    const [leftLineMetric, setLeftLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('pace');
    const [rightLineMetric, setRightLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('none');

    const [extraCharts, setExtraCharts] = useState<ExtraChart[]>([
        { id: 'extra1', metric: 'avgHr', color: '#D1001C' },
    ]);

    const [typePie, setTypePie] = useState<any[]>([]);
    const [sportSessionPie, setSportSessionPie] = useState<any[]>([]);
    const [sportDistancePie, setSportDistancePie] = useState<any[]>([]);
    const [sportDurationPie, setSportDurationPie] = useState<any[]>([]);

    const toApiDate = (date: Date): string => {
        return date.toISOString().split("T")[0];
    };

    const getReportRange = (period: Period, customStart: Date | null, customEnd: Date | null) => {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        if (period === "year") {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            return { start: toApiDate(start), end: toApiDate(end), bin: "month" };
        }

        if (period === "month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { start: toApiDate(start), end: toApiDate(end), bin: "day" };
        }

        if (period === "week") {
            const day = now.getDay() || 7;
            start = new Date(now);
            start.setDate(now.getDate() - day + 1);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            return { start: toApiDate(start), end: toApiDate(end), bin: "day" };
        }

        return {
            start: customStart ? toApiDate(customStart) : toApiDate(now),
            end: customEnd ? toApiDate(customEnd) : toApiDate(now),
            bin: "day",
        };
    };

    useEffect(() => {
        const loadSportsmans = async () => {
            try {
                const data = await coachService.getSportsmans();

                setAthletes(data);

                if (data.length > 0) {
                    setSelectedAthlete(data[0]);
                }
            } catch (error) {
                console.error("Ошибка загрузки спортсменов:", error);
            }
        };

        loadSportsmans();
    }, []);

    useEffect(() => {
        const loadReport = async () => {
            if (!selectedAthlete) {
                setChartData([]);
                setMetrics({
                    totalTrainings: 0,
                    totalDistance: 0,
                    totalDuration: 0,
                    avgPace: 0,
                    totalCalories: 0,
                    totalAscent: 0,
                    totalDescent: 0,
                });
                return;
            }

            const range = getReportRange(period, customStart, customEnd);

            const report = await coachService.getSportsmanReport(
                selectedAthlete.id,
                range.start,
                range.end,
                range.bin
            );

            setMetrics({
                totalTrainings: report.overview.total_trainings ?? 0,
                totalDistance: report.overview.total_distance ?? 0,
                totalDuration: report.overview.total_duration ?? 0,
                avgPace: report.overview.avg_pace ?? 0,
                totalCalories: report.overview.total_calories ?? 0,
                totalAscent: report.overview.total_ascent ?? 0,
                totalDescent: report.overview.total_descent ?? 0,
            });

            setChartData(
                report.reportBins.map((bin) => ({
                    date: bin.bin_period,
                    distance: (bin.total_distance ?? 0) / 1000,
                    duration: bin.total_duration ?? 0,
                    sessions: bin.total_trainings ?? 0,
                    avgSpeed: bin.avg_pace && bin.avg_pace > 0
                        ? 1000 / bin.avg_pace
                        : 0,
                    maxSpeed: bin.max_speed ?? 0,
                    avgHr: bin.avg_heart_rate ?? 0,
                    ascent: bin.total_ascent ?? 0,
                    descent: bin.total_descent ?? 0,
                }))
            );
            setTypePie(report.typePie || []);
            setSportSessionPie(report.sportSessionPie || []);
            setSportDistancePie(report.sportDistancePie || []);
            setSportDurationPie(report.sportDurationPie || []);
        };

        loadReport();
    }, [selectedAthlete, period, customStart, customEnd]);

    const addExtraChart = () => {
        const newId = `extra${extraCharts.length + 1}`;
        setExtraCharts([...extraCharts, { id: newId, metric: 'avgHr', color: '#198754' }]);
    };

    const removeExtraChart = (id: string) => {
        if (extraCharts.length > 0) {
            setExtraCharts(extraCharts.filter(c => c.id !== id));
        }
    };

    const updateExtraChartMetric = (id: string, metric: string) => {
        setExtraCharts(extraCharts.map(c => c.id === id ? { ...c, metric } : c));
    };

    const barLabels = chartData.map(d => d.date);
    const barDataValues = chartData.map(d => {
        switch (barMetric) {
            case 'distance': return d.distance;
            case 'duration': return d.duration;
            case 'ascent': return d.ascent;
            case 'descent': return d.descent;
            default: return d.distance;
        }
    });

    const getLineData = (metric: string) => {
        if (metric === 'none') return [];
        if (metric === 'pace') {
            return chartData.map(d => d.avgSpeed > 0 ? d.avgSpeed / 60 : 0);
        }
        return chartData.map(d => d[metric as keyof ChartDataPoint] as number);
    };

    const leftLineDataValues = getLineData(leftLineMetric);
    const rightLineDataValues = getLineData(rightLineMetric);

    const getLineLabel = (metric: string) => {
        if (metric === 'pace') return 'Темп (мин/км)';
        if (metric === 'maxSpeed') return 'Макс. скорость (м/с)';
        if (metric === 'avgHr') return 'Пульс (уд/мин)';
        return '';
    };

    const getLineUnit = (metric: string) => {
        if (metric === 'pace') return 'мин/км';
        if (metric === 'maxSpeed') return 'м/с';
        if (metric === 'avgHr') return 'уд/мин';
        return '';
    };

    const barUnit = barMetric === 'distance' ? 'км' : barMetric === 'duration' ? 'ч:мм:сс' : 'м';

    const getExtraChartData = (metric: string) => {
        switch (metric) {
            case 'distance': return chartData.map(d => d.distance);
            case 'duration': return chartData.map(d => d.duration / 60);
            case 'ascent': return chartData.map(d => d.ascent);
            case 'descent': return chartData.map(d => d.descent);
            case 'pace': return chartData.map(d => {
                const paceMinPerKm = d.avgSpeed > 0 ? 1000 / (d.avgSpeed * 60) : 0;
                return paceMinPerKm;
            });
            case 'maxSpeed': return chartData.map(d => d.maxSpeed);
            case 'avgHr': return chartData.map(d => d.avgHr);
            case 'sessions': return chartData.map(d => d.sessions);
            default: return chartData.map(d => d.distance);
        }
    };

    const getExtraChartUnit = (metric: string) => {
        const option = metricOptions.find(o => o.value === metric);
        return option?.unit || '';
    };

    const getPaceAxisRange = (values: number[]) => {
        const valid = values.filter(v => v > 0);

        if (valid.length === 0) {
            return {};
        }

        const min = Math.min(...valid);
        const max = Math.max(...valid);
        const padding = Math.max((max - min) * 0.25, 0.3);

        return {
            min: Math.max(0, min - padding),
            max: max + padding,
        };
    };

    const combinedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        plugins: {
            legend: { position: 'top' as const },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const label = context.dataset.label || '';
                        let value = context.raw;
                        if (label.includes('Темп') && value > 0) {
                            const minutes = Math.floor(value);
                            const seconds = Math.round((value - minutes) * 60);
                            return `${label}: ${minutes}:${seconds.toString().padStart(2, '0')} /км`;
                        }
                        if (label.includes('Продолжительность')) {
                            return `${label}: ${formatTimeHMS(value)}`;
                        }
                        if (label.includes('Дистанция')) {
                            return `${label}: ${value} км`;
                        }
                        if (label.includes('Подъём') || label.includes('Спуск')) {
                            return `${label}: ${value} м`;
                        }
                        if (label.includes('Пульс')) {
                            return `${label}: ${value} уд/мин`;
                        }
                        if (label.includes('Макс. скорость')) {
                            return `${label}: ${value} м/с`;
                        }
                        return `${label}: ${value}`;
                    }
                }
            }
        },
        scales: {
            y: {
                title: { display: true, text: barUnit },
                beginAtZero: true,
                grid: { color: '#e9ecef' },
            },
            y1: {
                position: 'right' as const,
                title: { display: true, text: getLineUnit(leftLineMetric) },
                beginAtZero: true,
                reverse: leftLineMetric === 'pace',
                ...(leftLineMetric === 'pace' ? getPaceAxisRange(leftLineDataValues) : {}),
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: (value: any) => {
                        if (leftLineMetric === 'pace') {
                            const minutes = Math.floor(value);
                            const seconds = Math.round((value - minutes) * 60);
                            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                        }
                        return value;
                    }
                }
            },
            ...(rightLineMetric !== 'none' && {
                y2: {
                    position: 'right' as const,
                    title: { display: true, text: getLineUnit(rightLineMetric) },
                    beginAtZero: true,
                    grid: { drawOnChartArea: false },
                    ticks: { color: '#D1001C' },
                }
            })
        },
    };

    const combinedChartConfig = {
        labels: barLabels,
        datasets: [
            {
                label: barMetric === 'distance' ? 'Дистанция (км)' :
                    barMetric === 'duration' ? 'Продолжительность (мин)' :
                        barMetric === 'ascent' ? 'Подъём (м)' : 'Спуск (м)',
                data: barDataValues,
                backgroundColor: 'rgba(209, 0, 28, 0.6)',
                borderColor: '#D1001C',
                borderWidth: 1,
                type: 'bar' as const,
                yAxisID: 'y',
                barPercentage: 0.7,
                categoryPercentage: 0.8,
            },
            ...(leftLineMetric !== 'none' ? [{
                label: getLineLabel(leftLineMetric),
                data: leftLineDataValues,
                borderColor: '#0d6efd',
                backgroundColor: 'transparent',
                fill: false,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                type: 'line' as const,
                yAxisID: 'y1',
            }] : []),
            ...(rightLineMetric !== 'none' ? [{
                label: getLineLabel(rightLineMetric),
                data: rightLineDataValues,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 5,
                type: 'line' as const,
                yAxisID: 'y2',
            }] : []),
        ],
    };

    const pieColors = [
        '#D1001C',
        '#0d6efd',
        '#198754',
        '#ffc107',
        '#6f42c1',
        '#fd7e14',
        '#20c997',
        '#dc3545',
    ];

    const createPieConfig = (data: any[]) => {
        const total = data.reduce((sum, d) => sum + d.value, 0);

        return {
            data: {
                labels: data.map(d => d.caption),
                datasets: [{
                    data: data.map(d => d.value),
                    backgroundColor: pieColors.slice(0, data.length),
                    borderWidth: 0,
                }],
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const value = context.raw;
                                const percentage = total > 0
                                    ? ((value / total) * 100).toFixed(1)
                                    : 0;

                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    },

                    legend: {
                        position: 'bottom' as const,
                        labels: {
                            font: { size: 11 },
                            boxWidth: 12
                        }
                    }
                }
            }
        };
    };

    const metricsCards = [
        { label: 'Всего тренировок', value: metrics.totalTrainings ?? 0, unit: '' },
        { label: 'Общая дистанция', value: metrics.totalDistance ? (metrics.totalDistance / 1000).toFixed(2) : '0', unit: 'км' },
        { label: 'Общее время', value: metrics.totalDuration ? formatDurationHM(metrics.totalDuration) : '0', unit: '' },
        { label: 'Калории', value: metrics.totalCalories ?? 0, unit: 'ккал' },
        { label: 'Набор высоты', value: metrics.totalAscent ? metrics.totalAscent.toFixed(1) : '0', unit: 'м' },
        { label: 'Спуск', value: metrics.totalDescent ? metrics.totalDescent.toFixed(1) : '0', unit: 'м' },
    ];

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true } },
    };

    const getFullName = (athlete: Athlete) => {
        if (athlete.fullname) return athlete.fullname;
        return `${athlete.surname || ''} ${athlete.name || ''} ${athlete.fathername || ''}`.trim();
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header/>
            <main style={{ flex: 1, position: "relative" }}>
                <div className="container py-4">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        style={{
                            position: "fixed",
                            left: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 1000,
                            background: "#D1001C",
                            border: "none",
                            borderRadius: "0 12px 12px 0",
                            padding: "12px 8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12h18M3 6h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    {/* Выдвижная панель */}
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: "300px",
                        background: "white",
                        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
                        transition: "transform 0.3s ease",
                        zIndex: 1050,
                        boxShadow: "2px 0 12px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <div style={{
                            padding: "20px 16px",
                            borderBottom: "1px solid #e7eaf0",
                            background: "#f8f9fa",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>Мои спортсмены</h5>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    color: "#666",
                                    padding: "0 8px"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                            {athletes.map(athlete => (
                                <div
                                    key={athlete.id}
                                    onClick={() => {
                                        setSelectedAthlete(athlete);
                                        setDrawerOpen(false);
                                    }}
                                    style={{
                                        padding: "14px 16px",
                                        cursor: "pointer",
                                        background: selectedAthlete?.id === athlete.id ? "#f0f2f5" : "white",
                                        borderBottom: "1px solid #e7eaf0"
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>
                                        {getFullName(athlete)}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>
                                        {athlete.nickname ? `@${athlete.nickname}` : athlete.email || "Без никнейма"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {drawerOpen && (
                        <div
                            onClick={() => setDrawerOpen(false)}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(0,0,0,0.3)",
                                zIndex: 1040
                            }}
                        />
                    )}

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Отчёты</h1>
                        {selectedAthlete && (
                            <div style={{ color: "#666", fontSize: "14px", background: "#f8f9fa", padding: "6px 12px", borderRadius: "8px" }}>
                                Спортсмен: <strong>{getFullName(selectedAthlete)}</strong> ({selectedAthlete.nickname
                                ? `@${selectedAthlete.nickname}`
                                : selectedAthlete.email || "Без никнейма"})
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                        <div className="d-flex gap-3 align-items-center flex-wrap">
                            <div className="btn-group" role="group">
                                <button
                                    className={`btn ${period === 'year' ? 'btn-active' : 'btn-outline-secondary'}`}
                                    onClick={() => { setPeriod('year'); setShowCustomPicker(false); }}
                                    style={{
                                        borderRadius: "8px 0 0 8px",
                                        transition: "none",
                                        backgroundColor: period === 'year' ? '#D1001C' : 'transparent',
                                        color: period === 'year' ? 'white' : '#6c757d',
                                        borderColor: '#ced4da'
                                    }}
                                >
                                    Год
                                </button>
                                <button
                                    className={`btn ${period === 'month' ? 'btn-active' : 'btn-outline-secondary'}`}
                                    onClick={() => { setPeriod('month'); setShowCustomPicker(false); }}
                                    style={{
                                        transition: "none",
                                        backgroundColor: period === 'month' ? '#D1001C' : 'transparent',
                                        color: period === 'month' ? 'white' : '#6c757d',
                                        borderColor: '#ced4da'
                                    }}
                                >
                                    Месяц
                                </button>
                                <button
                                    className={`btn ${period === 'week' ? 'btn-active' : 'btn-outline-secondary'}`}
                                    onClick={() => { setPeriod('week'); setShowCustomPicker(false); }}
                                    style={{
                                        transition: "none",
                                        backgroundColor: period === 'week' ? '#D1001C' : 'transparent',
                                        color: period === 'week' ? 'white' : '#6c757d',
                                        borderColor: '#ced4da'
                                    }}
                                >
                                    Неделя
                                </button>
                                <button
                                    className={`btn ${showCustomPicker ? 'btn-active' : 'btn-outline-secondary'}`}
                                    onClick={() => { setShowCustomPicker(!showCustomPicker); if (!showCustomPicker) setPeriod('custom'); }}
                                    style={{
                                        borderRadius: "0 8px 8px 0",
                                        transition: "none",
                                        backgroundColor: showCustomPicker ? '#D1001C' : 'transparent',
                                        color: showCustomPicker ? 'white' : '#6c757d',
                                        borderColor: '#ced4da'
                                    }}
                                >
                                    Свои даты
                                </button>
                            </div>
                        </div>
                    </div>

                    {showCustomPicker && (
                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-3 d-flex gap-3 align-items-center flex-wrap">
                                <label className="fw-semibold">С:</label>
                                <input type="date" className="form-control w-auto" onChange={(e) => setCustomStart(e.target.valueAsDate)} />
                                <label className="fw-semibold">По:</label>
                                <input type="date" className="form-control w-auto" onChange={(e) => setCustomEnd(e.target.valueAsDate)} />
                            </div>
                        </div>
                    )}

                    <div className="row g-3 mb-5">
                        {metricsCards.map((card, idx) => (
                            <div key={idx} className="col-md-3 col-6">
                                <div className="card border-0 shadow-sm text-center p-3" style={{ borderRadius: "12px" }}>
                                    <div style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>{card.label}</div>
                                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#D1001C" }}>
                                        {card.value} {card.unit && <span style={{ fontSize: "14px" }}>{card.unit}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                                <h5 style={{ fontWeight: 600, margin: 0 }}>Анализ тренировок</h5>
                                <div className="d-flex gap-3 flex-wrap">
                                    <select className="form-select form-select-sm w-auto" value={barMetric} onChange={(e) => setBarMetric(e.target.value as any)}>
                                        <option value="distance">Дистанция (км)</option>
                                        <option value="duration">Продолжительность</option>
                                        <option value="ascent">Подъём (м)</option>
                                        <option value="descent">Спуск (м)</option>
                                    </select>
                                    <select className="form-select form-select-sm w-auto" value={leftLineMetric} onChange={(e) => setLeftLineMetric(e.target.value as any)}>
                                        <option value="none">— левая ось —</option>
                                        <option value="pace">Темп (мин/км)</option>
                                        <option value="maxSpeed">Макс. скорость (м/с)</option>
                                        <option value="avgHr">Пульс (уд/мин)</option>
                                    </select>
                                    <select className="form-select form-select-sm w-auto" value={rightLineMetric} onChange={(e) => setRightLineMetric(e.target.value as any)}>
                                        <option value="none">— правая ось —</option>
                                        <option value="pace">Темп (мин/км)</option>
                                        <option value="maxSpeed">Макс. скорость (м/с)</option>
                                        <option value="avgHr">Пульс (уд/мин)</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ height: "400px" }}>
                                <Line data={combinedChartConfig as any} options={combinedChartOptions as any} />
                            </div>
                        </div>
                    </div>

                    {extraCharts.map((chart, index) => {
                        const data = getExtraChartData(chart.metric);
                        const unit = getExtraChartUnit(chart.metric);
                        const option = metricOptions.find(o => o.value === chart.metric);
                        const isBar = option?.type === 'bar';

                        const chartConfig = {
                            labels: barLabels,
                            datasets: [{
                                label: option?.label || chart.metric,
                                data: data,
                                backgroundColor: isBar ? `${chart.color}80` : 'transparent',
                                borderColor: chart.color,
                                borderWidth: isBar ? 1 : 2,
                                tension: 0.4,
                                fill: !isBar,
                                pointRadius: isBar ? 0 : 3,
                                barPercentage: 0.7,
                                categoryPercentage: 0.8,
                            }],
                        };

                        const opts = {
                            ...chartOptions,
                            scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, title: { display: true, text: unit } } }
                        };

                        return (
                            <div key={chart.id} className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <div className="d-flex align-items-center gap-3">
                                            <h5 style={{ fontWeight: 600, margin: 0 }}>График {index + 1}</h5>
                                            <select
                                                className="form-select form-select-sm w-auto"
                                                value={chart.metric}
                                                onChange={(e) => updateExtraChartMetric(chart.id, e.target.value)}
                                                style={{ width: "180px" }}
                                            >
                                                {metricOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {extraCharts.length > 0 && (
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeExtraChart(chart.id)}
                                                style={{ borderRadius: "8px" }}
                                            >
                                                ✕ Удалить
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ height: "350px" }}>
                                        {isBar ? (
                                            <Bar data={chartConfig} options={opts} />
                                        ) : (
                                            <Line data={chartConfig} options={opts} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <div className="text-center mb-5">
                        <button
                            className="btn btn-outline-danger"
                            style={{ borderRadius: "12px", padding: "10px 24px", borderColor: '#D1001C', color: '#D1001C' }}
                            onClick={addExtraChart}
                        >
                            + Добавить график
                        </button>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <h5 style={{ fontWeight: 600, marginBottom: "20px" }}>Распределение по видам спорта</h5>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <h6 className="text-center mb-3">По продолжительности</h6>
                                            <div style={{ height: "300px" }}>
                                                <Pie {...createPieConfig(sportDurationPie)} />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <h6 className="text-center mb-3">По дистанции</h6>
                                            <div style={{ height: "300px" }}>
                                                <Pie {...createPieConfig(sportDistancePie)} />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <h6 className="text-center mb-3">По количеству сессий</h6>
                                            <div style={{ height: "300px" }}>
                                                <Pie {...createPieConfig(sportSessionPie)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4">
                                    <h5 style={{ fontWeight: 600, marginBottom: "20px" }}>Распределение по типам тренировок</h5>
                                    <div className="row">
                                        <div className="col-md-6 mx-auto">
                                            <h6 className="text-center mb-3">По количеству сессий</h6>
                                            <div style={{ height: "300px" }}>
                                                <Pie {...createPieConfig(typePie)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col-12">
                            <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                                <div className="card-body p-4 text-center">
                                    <h5 style={{ fontWeight: 600, marginBottom: "20px" }}>Зоны пульса</h5>
                                    <div className="py-5 text-muted">
                                        <i className="bi bi-heart-pulse fs-1"></i>
                                        <p className="mt-3">Данные по зонам пульса появятся как Эмилька разберется с этим</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CoachReportsPage;
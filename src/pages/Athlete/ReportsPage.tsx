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
import reportService, { ReportResponse, PieItem } from '../../api/reportService';

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

type Period = 'year' | 'month' | 'week' | 'custom';
type BinType = 'day' | 'week' | 'month';

const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} ч ${m} мин`;
    return `${m} мин`;
};

const formatPace = (paceSecPerKm: number): string => {
    const minutes = Math.floor(paceSecPerKm / 60);
    const seconds = Math.floor(paceSecPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const metricOptions = [
    { value: 'distance', label: 'Дистанция (км)', type: 'bar', unit: 'км' },
    { value: 'duration', label: 'Продолжительность (мин)', type: 'bar', unit: 'мин' },
    { value: 'ascent', label: 'Подъём (м)', type: 'bar', unit: 'м' },
    { value: 'descent', label: 'Спуск (м)', type: 'bar', unit: 'м' },
    { value: 'pace', label: 'Темп (мин/км)', type: 'line', unit: 'мин/км' },
    { value: 'maxSpeed', label: 'Макс. скорость (м/с)', type: 'line', unit: 'м/с' },
    { value: 'avgHr', label: 'Пульс (уд/мин)', type: 'line', unit: 'уд/мин' },
    { value: 'sessions', label: 'Количество сессий', type: 'bar'},
];

const ReportsPage: React.FC = () => {
    const [period, setPeriod] = useState<Period>('month');
    const [customStart, setCustomStart] = useState<Date | null>(null);
    const [customEnd, setCustomEnd] = useState<Date | null>(null);
    const [showCustomPicker, setShowCustomPicker] = useState(false);
    const [loading, setLoading] = useState(true);

    const [metrics, setMetrics] = useState<Metrics>({
        totalTrainings: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 0,
        totalCalories: 0,
        totalAscent: 0,
        totalDescent: 0
    });

    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

    const [sportSessionPie, setSportSessionPie] = useState<PieItem[]>([]);
    const [sportDistancePie, setSportDistancePie] = useState<PieItem[]>([]);
    const [sportDurationPie, setSportDurationPie] = useState<PieItem[]>([]);
    const [typePie, setTypePie] = useState<PieItem[]>([]);
    const avgPaceSecPerKm = metrics.avgPace && metrics.avgPace > 0 ? 1000 / metrics.avgPace : 0;

    const pieColors = ['#D1001C', '#0d6efd', '#198754', '#ffc107', '#6f42c1', '#fd7e14', '#20c997', '#dc3545'];

    const [barMetric, setBarMetric] = useState<'distance' | 'duration' | 'ascent' | 'descent'>('distance');
    const [leftLineMetric, setLeftLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('pace');
    const [rightLineMetric, setRightLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('none');
    const [extraCharts, setExtraCharts] = useState<ExtraChart[]>([
        { id: 'extra1', metric: 'avgHr', color: 'rgba(209, 0, 28, 0.6)' },
    ]);

    const getBinFromPeriod = (period: Period, startDate?: Date, endDate?: Date): BinType => {
        if (period === 'year') return 'month';
        if (period === 'month') return 'day';
        if (period === 'week') return 'day';

        if (startDate && endDate) {
            const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            if (daysDiff <= 7) return 'day';
            if (daysDiff <= 30) return 'day';
            if (daysDiff <= 90) return 'week';
            return 'month';
        }
        return 'day';
    };

    const getDateRange = (): { start: string; end: string } => {
        const now = new Date();
        let start: Date;
        let end: Date;

        if (period === 'year') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else if (period === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'week') {
            const day = now.getDay();
            const diff = day === 0 ? 6 : day - 1;
            start = new Date(now);
            start.setDate(now.getDate() - diff);
            start.setHours(0, 0, 0, 0);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else if (customStart && customEnd) {
            start = customStart;
            end = customEnd;
        } else {
            start = new Date();
            start.setDate(now.getDate() - 30);
            end = now;
        }

        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const { start, end } = getDateRange();
            const bin = getBinFromPeriod(period, customStart || undefined, customEnd || undefined);

            const data: ReportResponse = await reportService.getReport(start, end, bin);

            setMetrics({
                totalTrainings: data.overview.total_trainings,
                totalDistance: data.overview.total_distance,
                totalDuration: data.overview.total_duration,
                avgPace: data.overview.avg_pace,
                totalCalories: data.overview.total_calories,
                totalAscent: data.overview.total_ascent,
                totalDescent: data.overview.total_descent
            });

            const binsData: ChartDataPoint[] = data.reportBins.map(bin => ({
                date: bin.bin_period,
                distance: bin.total_distance / 1000,
                duration: bin.total_duration,
                sessions: bin.total_trainings,
                avgSpeed: bin.avg_pace > 0 ? 1000 / bin.avg_pace : 0,
                maxSpeed: bin.max_speed,
                avgHr: bin.avg_heart_rate,
                ascent: bin.total_ascent,
                descent: bin.total_descent
            }));
            setChartData(binsData);

            setSportSessionPie(data.sportSessionPie);
            setSportDistancePie(data.sportDistancePie);
            setSportDurationPie(data.sportDurationPie);
            setTypePie(data.typePie);

        } catch (error) {
            console.error('Ошибка загрузки отчёта:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [period, customStart, customEnd]);

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
            case 'distance': return parseFloat(d.distance.toFixed(2));
            case 'duration': return d.duration / 60;
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

    const barUnit = barMetric === 'distance' ? 'км' : barMetric === 'duration' ? 'мин' : 'м';

    const getExtraChartData = (metric: string) => {
        switch (metric) {
            case 'distance': return chartData.map(d => parseFloat(d.distance.toFixed(2)));
            case 'duration': return chartData.map(d => d.duration / 60);
            case 'ascent': return chartData.map(d => d.ascent);
            case 'descent': return chartData.map(d => d.descent);
            case 'pace': return chartData.map(d => d.avgSpeed > 0 ? d.avgSpeed / 60 : 0);
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
                ticks: {
                    callback: (value: any) => {
                        return value;
                    }
                }
            },
            y1: {
                position: 'right' as const,
                title: { display: true, text: getLineUnit(leftLineMetric) },
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                ticks: {
                    callback: (value: any) => {
                        if (getLineUnit(leftLineMetric) === 'мин/км') {
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
                    ticks: {
                        color: '#D1001C',
                        callback: (value: any) => {
                            if (getLineUnit(rightLineMetric) === 'мин/км') {
                                const minutes = Math.floor(value);
                                const seconds = Math.round((value - minutes) * 60);
                                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                            }
                            return value;
                        }
                    }
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
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                fill: true,
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

    const createPieConfig = (data: PieItem[], valueType: 'distance' | 'duration' | 'sessions') => {
        const total = data.reduce((sum, item) => sum + item.value, 0);

        const formatValue = (value: number, type: string) => {
            if (type === 'distance') {
                const km = value / 1000;
                return `${km.toFixed(2)} км`;
            }
            if (type === 'duration') {
                const hours = Math.floor(value / 3600);
                const minutes = Math.floor((value % 3600) / 60);
                if (hours > 0) {
                    return `${hours} ч ${minutes} мин`;
                }
                return `${minutes} мин`;
            }
            return `${value}`;
        };

        return {
            data: {
                labels: data.map(item => `${item.caption} (${((item.value / total) * 100).toFixed(1)}%)`),
                datasets: [{
                    data: data.map(item => item.value),
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
                                const percentage = ((value / total) * 100).toFixed(1);
                                const formattedValue = formatValue(value, valueType);
                                return `${context.label.split(' (')[0]}: ${formattedValue} (${percentage}%)`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom' as const,
                        labels: { font: { size: 11 }, boxWidth: 12 }
                    }
                }
            }
        };
    };

    const metricsCards = [
        { label: 'Всего тренировок', value: metrics.totalTrainings ?? 0, unit: '' },
        { label: 'Общая дистанция', value: metrics.totalDistance ? (metrics.totalDistance / 1000).toFixed(2) : '0', unit: 'км' },
        { label: 'Общее время', value: metrics.totalDuration ? formatDuration(metrics.totalDuration) : '0', unit: '' },
        { label: 'Средний темп', value: metrics.avgPace ? formatPace(avgPaceSecPerKm) : '0:00', unit: '/км' },
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

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
                <Header/>
                <div className="container py-4 text-center">
                    <div className="spinner-border text-danger" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header/>
            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Отчёты</h1>
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

                {chartData.length > 0 && (
                    <>
                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap mb-4">
                                    <h5 style={{ fontWeight: 600, margin: 0 }}>Анализ тренировок</h5>
                                    <div className="d-flex gap-3 flex-wrap">
                                        <select className="form-select form-select-sm w-auto" value={barMetric} onChange={(e) => setBarMetric(e.target.value as any)}>
                                            <option value="distance">Дистанция (км)</option>
                                            <option value="duration">Продолжительность (мин)</option>
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
                                plugins: {
                                    tooltip: {
                                        callbacks: {
                                            label: (context: any) => {
                                                const label = context.dataset.label || '';
                                                let value = context.raw;
                                                if ((label.includes('Темп') || unit === 'мин/км') && value > 0) {
                                                    const minutes = Math.floor(value);
                                                    const seconds = Math.round((value - minutes) * 60);
                                                    return `${label}: ${minutes}:${seconds.toString().padStart(2, '0')} /км`;
                                                }
                                                return `${label}: ${value} ${unit}`;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        title: { display: true, text: unit },
                                        ticks: {
                                            callback: (value: any) => {
                                                if (unit === 'мин/км') {
                                                    const minutes = Math.floor(value);
                                                    const seconds = Math.round((value - minutes) * 60);
                                                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                                                }
                                                return value;
                                            }
                                        }
                                    }
                                }
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
                    </>
                )}

                <div className="row g-4 mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ fontWeight: 600, marginBottom: "20px" }}>Распределение по видам спорта</h5>
                                <div className="row">
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По количеству сессий</h6>
                                        <div style={{ height: "300px" }}>
                                            {sportSessionPie.length > 0 ? (
                                                <Pie {...createPieConfig(sportSessionPie, 'sessions')} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Нет данных</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По дистанции</h6>
                                        <div style={{ height: "300px" }}>
                                            {sportDistancePie.length > 0 ? (
                                                <Pie {...createPieConfig(sportDistancePie, 'distance')} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Нет данных</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По продолжительности</h6>
                                        <div style={{ height: "300px" }}>
                                            {sportDurationPie.length > 0 ? (
                                                <Pie {...createPieConfig(sportDurationPie, 'duration')} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Нет данных</div>
                                            )}
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
                                            {typePie.length > 0 ? (
                                                <Pie {...createPieConfig(typePie, 'sessions')} />
                                            ) : (
                                                <div className="text-center text-muted py-5">Нет данных</div>
                                            )}
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
        </div>
    );
};

export default ReportsPage;
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

interface Distribution {
    id: number;
    name: string;
    duration: number;
    distance: number;
    sessions: number;
    color: string;
}

interface ExtraChart {
    id: string;
    metric: string;
    color: string;
}

type Period = 'year' | 'month' | 'week' | 'custom';

const generateMockData = (period: Period): { chartData: ChartDataPoint[], metrics: Metrics } => {
    let points: ChartDataPoint[] = [];
    let metrics: Metrics = {
        totalTrainings: 0,
        totalDistance: 0,
        totalDuration: 0,
        avgPace: 0,
        totalCalories: 0,
        totalAscent: 0,
        totalDescent: 0
    };

    if (period === 'year') {
        const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        for (let i = 0; i < 12; i++) {
            const distance = 50 + Math.random() * 100;
            const duration = 18000 + Math.random() * 36000;
            const sessions = Math.floor(5 + Math.random() * 15);
            const ascent = 200 + Math.random() * 800;
            const descent = 180 + Math.random() * 750;
            const avgSpeedMps = 3 + Math.random() * 4;

            points.push({
                date: months[i],
                distance: distance,
                duration: duration,
                sessions: sessions,
                avgSpeed: avgSpeedMps,
                maxSpeed: 5 + Math.random() * 6,
                avgHr: 120 + Math.random() * 40,
                ascent: ascent,
                descent: descent,
            });

            metrics.totalTrainings += sessions;
            metrics.totalDistance += distance;
            metrics.totalDuration += duration;
            metrics.totalAscent += ascent;
            metrics.totalDescent += descent;
        }
    } else if (period === 'month') {
        for (let i = 1; i <= 30; i++) {
            const distance = 3 + Math.random() * 15;
            const duration = 1800 + Math.random() * 5400;
            const sessions = Math.floor(1 + Math.random() * 3);
            const avgSpeedMps = 3 + Math.random() * 4;

            points.push({
                date: `${i}`,
                distance: distance,
                duration: duration,
                sessions: sessions,
                avgSpeed: avgSpeedMps,
                maxSpeed: 5 + Math.random() * 6,
                avgHr: 120 + Math.random() * 40,
                ascent: 20 + Math.random() * 150,
                descent: 15 + Math.random() * 130,
            });

            metrics.totalTrainings += sessions;
            metrics.totalDistance += distance;
            metrics.totalDuration += duration;
        }
    } else {
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        for (let i = 0; i < 7; i++) {
            const distance = 3 + Math.random() * 12;
            const duration = 1200 + Math.random() * 3600;
            const sessions = Math.floor(1 + Math.random() * 2);
            const avgSpeedMps = 3 + Math.random() * 4;

            points.push({
                date: days[i],
                distance: distance,
                duration: duration,
                sessions: sessions,
                avgSpeed: avgSpeedMps,
                maxSpeed: 5 + Math.random() * 6,
                avgHr: 120 + Math.random() * 40,
                ascent: 15 + Math.random() * 100,
                descent: 10 + Math.random() * 90,
            });

            metrics.totalTrainings += sessions;
            metrics.totalDistance += distance;
            metrics.totalDuration += duration;
        }
    }

    const totalHours = metrics.totalDuration / 3600;
    const avgSpeedMps = totalHours > 0 ? metrics.totalDistance / totalHours : 0;
    metrics.avgPace = avgSpeedMps > 0 ? 1000 / avgSpeedMps : 0;
    metrics.totalCalories = Math.round(metrics.totalDistance * 70);

    return { chartData: points, metrics };
};

const sportDistributions: Distribution[] = [
    { id: 1, name: 'Бег', duration: 28000, distance: 110, sessions: 15, color: '#D1001C' },
    { id: 2, name: 'Велоспорт', duration: 12000, distance: 35, sessions: 5, color: '#0d6efd' },
    { id: 3, name: 'Плавание', duration: 4000, distance: 8, sessions: 2, color: '#198754' },
    { id: 4, name: 'Силовая', duration: 1120, distance: 3.8, sessions: 1, color: '#ffc107' },
];

const trainingTypeDistributions: Distribution[] = [
    { id: 1, name: 'Длительная', duration: 18000, distance: 70, sessions: 8, color: '#D1001C' },
    { id: 2, name: 'Интервальная', duration: 12000, distance: 45, sessions: 6, color: '#0d6efd' },
    { id: 3, name: 'Темповая', duration: 9000, distance: 30, sessions: 5, color: '#198754' },
    { id: 4, name: 'Восстановительная', duration: 6120, distance: 11.8, sessions: 4, color: '#ffc107' },
];

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
    { value: 'sessions', label: 'Количество сессий', type: 'bar', unit: 'шт' },
];

const ReportsPage: React.FC = () => {
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

    const [barMetric, setBarMetric] = useState<'distance' | 'duration' | 'ascent' | 'descent'>('distance');
    const [leftLineMetric, setLeftLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('pace');
    const [rightLineMetric, setRightLineMetric] = useState<'pace' | 'maxSpeed' | 'avgHr' | 'none'>('none');

    const [extraCharts, setExtraCharts] = useState<ExtraChart[]>([
        { id: 'extra1', metric: 'avgHr', color: '#D1001C' },
    ]);

    useEffect(() => {
        const { chartData: data, metrics: newMetrics } = generateMockData(period);
        setChartData(data);
        setMetrics(newMetrics);
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
            case 'distance': return d.distance;
            case 'duration': return d.duration / 60;
            case 'ascent': return d.ascent;
            case 'descent': return d.descent;
            default: return d.distance;
        }
    });

    const getLineData = (metric: string) => {
        if (metric === 'none') return [];
        if (metric === 'pace') {
            return chartData.map(d => d.avgSpeed > 0 ? 1000 / d.avgSpeed : 0);
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
            case 'distance': return chartData.map(d => d.distance);
            case 'duration': return chartData.map(d => d.duration / 60);
            case 'ascent': return chartData.map(d => d.ascent);
            case 'descent': return chartData.map(d => d.descent);
            case 'pace': return chartData.map(d => d.avgSpeed > 0 ? 1000 / d.avgSpeed : 0);
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
        plugins: { legend: { position: 'top' as const } },
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
                grid: { drawOnChartArea: false },
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

    const createPieConfig = (data: Distribution[], valueKey: 'duration' | 'distance' | 'sessions') => {
        const total = data.reduce((sum, d) => sum + d[valueKey], 0);
        return {
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => d[valueKey]),
                    backgroundColor: data.map(d => d.color),
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
                                const unit = valueKey === 'duration' ? 'мин' : valueKey === 'distance' ? 'км' : 'сессий';
                                return `${context.label}: ${value} ${unit} (${percentage}%)`;
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
        { label: 'Всего тренировок', value: metrics.totalTrainings, unit: '' },
        { label: 'Общая дистанция', value: metrics.totalDistance.toFixed(1), unit: 'км' },
        { label: 'Общее время', value: formatDuration(metrics.totalDuration), unit: '' },
        { label: 'Средний темп', value: formatPace(metrics.avgPace), unit: '/км' },
        { label: 'Калории', value: metrics.totalCalories, unit: 'ккал' },
        { label: 'Набор высоты', value: metrics.totalAscent.toFixed(1), unit: 'м' },
        { label: 'Спуск', value: metrics.totalDescent.toFixed(1), unit: 'м' },
    ];

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const } },
        scales: { y: { beginAtZero: true } },
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header active="report" />
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
                                            <Pie {...createPieConfig(sportDistributions, 'duration')} />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По дистанции</h6>
                                        <div style={{ height: "300px" }}>
                                            <Pie {...createPieConfig(sportDistributions, 'distance')} />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По количеству сессий</h6>
                                        <div style={{ height: "300px" }}>
                                            <Pie {...createPieConfig(sportDistributions, 'sessions')} />
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
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По продолжительности</h6>
                                        <div style={{ height: "300px" }}>
                                            <Pie {...createPieConfig(trainingTypeDistributions, 'duration')} />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По дистанции</h6>
                                        <div style={{ height: "300px" }}>
                                            <Pie {...createPieConfig(trainingTypeDistributions, 'distance')} />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <h6 className="text-center mb-3">По количеству сессий</h6>
                                        <div style={{ height: "300px" }}>
                                            <Pie {...createPieConfig(trainingTypeDistributions, 'sessions')} />
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
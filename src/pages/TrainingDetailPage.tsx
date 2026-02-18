import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const TrainingDetailPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'stats' | 'splits' | 'zones'>('stats');
    const [contentHeight, setContentHeight] = useState(0);
    const statsRef = useRef<HTMLDivElement>(null);
    const splitsRef = useRef<HTMLDivElement>(null);
    const zonesRef = useRef<HTMLDivElement>(null);

    // Данные для отображения
    const trainingData = {
        distance: 3.19,
        time: "22:11",
        avgPace: "6:57",
        elevationGain: 72,
        calories: 206,
        avgHr: 142,
        maxHr: 162,
        maxPace: "5:45",
        elevationLoss: 68,
        minElevation: 850,
        maxElevation: 920,
        stressScore: 6,
        feelingScore: 4, // 1-5, где 1 - очень слабым, 5 - очень сильным
        feelingLabels: [
            "😫 Очень слабым",
            "😔 Слабым",
            "😐 Нормально",
            "😊 Сильным",
            "😁 Очень сильным"
        ]
    };

    // Поддержание постоянной высоты контента
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
    }, [activeTab]);

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header />

            <div className="container py-4">
                <div className="row mb-4">
                    <div className="col-12">
                        <h1 style={{ color: "#1a1a1a", fontWeight: 700, fontSize: "28px" }}>
                            Кисловодск Бег
                        </h1>
                        <div style={{ color: "#666", fontSize: "14px" }}>
                            15 января 2024 • 10:30
                        </div>
                    </div>
                </div>

                {/* Единый блок с 5 основными показателями */}
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
                                            {trainingData.distance} км
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Время
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {trainingData.time}
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Средний темп
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {trainingData.avgPace} /км
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px", borderRight: "1px solid #e9ecef" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Общий подъём
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {trainingData.elevationGain} м
                                        </div>
                                    </div>

                                    <div className="col" style={{ padding: "20px 10px" }}>
                                        <div style={{ color: "#666", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
                                            Калории
                                        </div>
                                        <div style={{ color: "#D1001C", fontSize: "22px", fontWeight: 700 }}>
                                            {trainingData.calories}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Карта и примечания */}
                <div className="row mb-5">
                    <div className="col-md-8 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "400px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    GPS-трек тренировки
                                </h5>
                                <div style={{
                                    height: "300px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666"
                                }}>
                                    Блок для карты с GPS-треком
                                </div>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блоки для графиков */}
                <div className="row mb-5">
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    Высота
                                </h5>
                                <div style={{
                                    height: "200px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666"
                                }}>
                                    Блок для графика высоты
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    Темп
                                </h5>
                                <div style={{
                                    height: "200px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666"
                                }}>
                                    Блок для графика темпа
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                    Пульс
                                </h5>
                                <div style={{
                                    height: "200px",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#666"
                                }}>
                                    Блок для графика пульса
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
                                                        {trainingData.distance} км
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
                                                                Воспринимаемые усилиия
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.stressScore}/10
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Как вы себя чувствовали?
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.feelingLabels[trainingData.feelingScore - 1]}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Блок Пульс */}
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
                                                                {trainingData.avgHr} уд/мин
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальная частота пульса
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.maxHr} уд/мин
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Блок Высота */}
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
                                                                {trainingData.elevationGain} м
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Общий спуск
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.elevationLoss} м
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Минимальная высота
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.minElevation} м
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальная высота
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.maxElevation} м
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Блок Темп */}
                                            <div className="card mb-4 border-0" style={{ backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                <div className="card-body p-4">
                                                    <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "15px" }}>
                                                        Темп
                                                    </h6>
                                                    <div className="row">
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Средний темп
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.avgPace} /км
                                                            </div>
                                                        </div>
                                                        <div className="col-md-6 mb-3">
                                                            <div style={{ color: "#666", fontSize: "14px", marginBottom: "5px" }}>
                                                                Максимальный темп
                                                            </div>
                                                            <div style={{ fontSize: "18px", color: "#1a1a1a", fontWeight: 500 }}>
                                                                {trainingData.maxPace} /км
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Круги */}
                                    {activeTab === 'splits' && (
                                        <div ref={splitsRef} style={{ minHeight: "400px" }}>
                                            <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                                Сплиты (круги)
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table" style={{ border: "none", marginBottom: "0" }}>
                                                    <thead>
                                                    <tr>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Круг</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Дистанция</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Время</th>
                                                        <th style={{ color: "#666", fontWeight: 500, border: "none", padding: "12px 15px" }}>Темп</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    <tr>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>1</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>1.00 км</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>7:15</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>7:15 /км</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>2</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>1.00 км</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>6:45</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>6:45 /км</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>3</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>1.00 км</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>6:30</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>6:30 /км</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>4</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>0.19 км</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>1:41</td>
                                                        <td style={{ color: "#1a1a1a", border: "none", padding: "12px 15px" }}>8:52 /км</td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Время в зонах */}
                                    {activeTab === 'zones' && (
                                        <div ref={zonesRef} style={{ minHeight: "400px" }}>
                                            <h6 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "20px" }}>
                                                Время в зонах пульса (5 зон)
                                            </h6>
                                            <div style={{ marginBottom: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                    <span style={{ color: "#666", fontSize: "14px" }}>Зона 1 - Разминка</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 500 }}>5:30</span>
                                                </div>
                                                <div style={{
                                                    height: "8px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: "20%",
                                                        height: "100%",
                                                        backgroundColor: "#5bc0de"
                                                    }} />
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                    <span style={{ color: "#666", fontSize: "14px" }}>Зона 2 - Легкая</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 500 }}>8:15</span>
                                                </div>
                                                <div style={{
                                                    height: "8px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: "32%",
                                                        height: "100%",
                                                        backgroundColor: "#5cb85c"
                                                    }} />
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                    <span style={{ color: "#666", fontSize: "14px" }}>Зона 3 - Аэробная</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 500 }}>6:45</span>
                                                </div>
                                                <div style={{
                                                    height: "8px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: "27%",
                                                        height: "100%",
                                                        backgroundColor: "#f0ad4e"
                                                    }} />
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                    <span style={{ color: "#666", fontSize: "14px" }}>Зона 4 - Пороговая</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 500 }}>1:41</span>
                                                </div>
                                                <div style={{
                                                    height: "8px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: "7%",
                                                        height: "100%",
                                                        backgroundColor: "#d9534f"
                                                    }} />
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: "15px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                    <span style={{ color: "#666", fontSize: "14px" }}>Зона 5 - Максимальная</span>
                                                    <span style={{ color: "#1a1a1a", fontWeight: 500 }}>0:00</span>
                                                </div>
                                                <div style={{
                                                    height: "8px",
                                                    backgroundColor: "#e9ecef",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div style={{
                                                        width: "0%",
                                                        height: "100%",
                                                        backgroundColor: "#8b0000"
                                                    }} />
                                                </div>
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
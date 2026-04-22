import React, { useState } from 'react';
import Header from '../../components/Header';

interface Athlete {
    id: number;
    surname: string;
    name: string;
    fathername?: string;
    nickname: string;
}

const SportsmanPage: React.FC = () => {
    const [athletes] = useState<Athlete[]>([
        { id: 1, surname: 'Татарников', name: 'Артём', fathername: 'Павлович', nickname: 'tematrkv' },
        { id: 2, surname: 'Иванов', name: 'Иван', fathername: 'Иванович', nickname: 'ivan_runner' },
        { id: 3, surname: 'Петрова', name: 'Анна', fathername: 'Сергеевна', nickname: 'anna_run' },
    ]);

    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(athletes[0]);
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!message.trim()) return;
        console.log('Отправка сообщения спортсмену:', selectedAthlete, message);
        setMessage('');
    };

    const getFullName = (athlete: Athlete) => {
        return `${athlete.surname} ${athlete.name} ${athlete.fathername || ''}`.trim();
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header active="coach" />
            <div className="container py-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden", height: "calc(100vh - 140px)" }}>
                    <div className="row g-0" style={{ height: "100%" }}>
                        {/* Левая колонка — список спортсменов */}
                        <div className="col-md-4" style={{ borderRight: "1px solid #e7eaf0", background: "white", height: "100%", overflowY: "auto" }}>
                            <div className="p-3 border-bottom" style={{ background: "#f8f9fa" }}>
                                <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>Мои спортсмены</h5>
                                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{athletes.length} человек</p>
                            </div>
                            <div>
                                {athletes.map(athlete => (
                                    <div
                                        key={athlete.id}
                                        onClick={() => setSelectedAthlete(athlete)}
                                        style={{
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            background: selectedAthlete?.id === athlete.id ? "#f0f2f5" : "white",
                                            borderBottom: "1px solid #e7eaf0",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedAthlete?.id !== athlete.id) {
                                                e.currentTarget.style.background = "#f8f9fa";
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedAthlete?.id !== athlete.id) {
                                                e.currentTarget.style.background = "white";
                                            }
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>
                                            {getFullName(athlete)}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#666" }}>
                                            @{athlete.nickname}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-8" style={{ background: "white", height: "100%", display: "flex", flexDirection: "column" }}>
                            {selectedAthlete ? (
                                <>
                                    <div className="p-3 border-bottom" style={{ background: "#f8f9fa" }}>
                                        <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
                                            {getFullName(selectedAthlete)}
                                        </h5>
                                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666" }}>
                                            @{selectedAthlete.nickname}
                                        </p>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", minHeight: "300px" }}>
                                        <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>
                                            Здесь будут сообщения со спортсменом
                                        </div>
                                    </div>
                                    <div className="p-3 border-top" style={{ background: "white", display: "flex", gap: "12px" }}>
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Введите сообщение..."
                                            style={{
                                                flex: 1,
                                                padding: "10px 16px",
                                                border: "1px solid #e7eaf0",
                                                borderRadius: "8px",
                                                outline: "none",
                                                fontSize: "14px"
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            style={{
                                                background: "#D1001C",
                                                border: "none",
                                                borderRadius: "8px",
                                                padding: "8px 20px",
                                                color: "white",
                                                fontWeight: 500,
                                                cursor: "pointer"
                                            }}
                                        >
                                            Отправить
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999" }}>
                                    Выберите спортсмена из списка
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SportsmanPage;
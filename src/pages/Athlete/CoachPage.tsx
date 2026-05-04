import React, { useState } from 'react';
import Header from '../../components/Header';

interface Coach {
    id: number;
    surname: string;
    name: string;
    fathername?: string;
}

const CoachPage: React.FC = () => {
    const [coaches] = useState<Coach[]>([
        { id: 1, surname: 'Петров', name: 'Иван', fathername: 'Иванович' },
        { id: 2, surname: 'Иванова', name: 'Мария', fathername: 'Петровна' },
        { id: 3, surname: 'Сидоров', name: 'Дмитрий', fathername: 'Александрович' },
    ]);

    const [selectedCoach, setSelectedCoach] = useState<Coach | null>(coaches[0]);
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!message.trim()) return;
        setMessage('');
    };

    const getFullName = (coach: Coach) => {
        return `${coach.surname} ${coach.name} ${coach.fathername || ''}`.trim();
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header/>
            <div className="container py-4">
                <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden", height: "calc(100vh - 140px)" }}>
                    <div className="row g-0" style={{ height: "100%" }}>
                        <div className="col-md-4" style={{ borderRight: "1px solid #e7eaf0", background: "white", height: "100%", overflowY: "auto" }}>
                            <div className="p-3 border-bottom" style={{ background: "#f8f9fa" }}>
                                <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>Мои тренеры</h5>
                            </div>
                            <div>
                                {coaches.map(coach => (
                                    <div
                                        key={coach.id}
                                        onClick={() => setSelectedCoach(coach)}
                                        style={{
                                            padding: "16px",
                                            cursor: "pointer",
                                            background: selectedCoach?.id === coach.id ? "#f0f2f5" : "white",
                                            borderBottom: "1px solid #e7eaf0"
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                                            {getFullName(coach)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="col-md-8" style={{ background: "white", height: "100%", display: "flex", flexDirection: "column" }}>
                            {selectedCoach ? (
                                <>
                                    <div className="p-3 border-bottom" style={{ background: "#f8f9fa" }}>
                                        <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>
                                            {getFullName(selectedCoach)}
                                        </h5>
                                    </div>
                                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", minHeight: "300px" }}>
                                        <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>
                                            Здесь будут сообщения с тренером
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
                                    Выберите тренера из списка
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
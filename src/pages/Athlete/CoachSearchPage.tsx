import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import coachService, { CoachResponse } from '../../api/coachService';

const CoachSearchPage: React.FC = () => {

    const [coaches, setCoaches] = useState<CoachResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');

    const [invitedCoaches, setInvitedCoaches] = useState<number[]>([]);

    useEffect(() => {
        const loadCoaches = async () => {
            try {
                const data = await coachService.getCoaches();
                setCoaches(data);
                console.log(data);
            } catch (error) {
                console.error('Ошибка загрузки тренеров:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCoaches();
    }, []);

    const handleInvite = async (coachId: number) => {
        try {
            await coachService.createInvite(coachId);

            setInvitedCoaches(prev => [...prev, coachId]);

        } catch (error) {
            console.error('Ошибка приглашения:', error);
        }
    };

    const handleCancelInvite = async (coachId: number) => {
        try {
            await coachService.cancelInvite(coachId);

            setInvitedCoaches(prev =>
                prev.filter(id => id !== coachId)
            );

        } catch (error) {
            console.error('Ошибка отмены приглашения:', error);
        }
    };

    const getFullName = (coach: CoachResponse) => {
        return coach.fullname;
    };

    const filteredCoaches = coaches.filter(coach => {
        const searchLower = search.toLowerCase();

        return (
            getFullName(coach).toLowerCase().includes(searchLower) ||
            coach.nickname?.toLowerCase().includes(searchLower) ||
            coach.email?.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fa"
            }}
        >
            <Header />

            <div className="container py-4">

                <div
                    className="d-flex justify-content-between align-items-center mb-4"
                >
                    <h1
                        style={{
                            fontSize: "28px",
                            fontWeight: 700,
                            margin: 0
                        }}
                    >
                        Поиск тренеров
                    </h1>
                </div>

                <div
                    className="card border-0 shadow-sm mb-4"
                    style={{
                        borderRadius: "16px"
                    }}
                >
                    <div className="card-body p-3">

                        <input
                            type="text"
                            className="form-control"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                borderRadius: "10px",
                                padding: "12px 16px"
                            }}
                        />

                    </div>
                </div>

                <div
                    className="card border-0 shadow-sm"
                    style={{
                        borderRadius: "16px",
                        overflow: "hidden"
                    }}
                >

                    {loading ? (

                        <div className="p-5 text-center">
                            Загрузка...
                        </div>

                    ) : filteredCoaches.length === 0 ? (

                        <div className="p-5 text-center text-muted">
                            Тренеры не найдены
                        </div>

                    ) : (

                        filteredCoaches.map(coach => (

                            <div
                                key={coach.id}
                                style={{
                                    padding: "18px 20px",
                                    borderBottom: "1px solid #e7eaf0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >

                                <div>

                                    <div
                                        style={{
                                            fontWeight: 600,
                                            fontSize: "16px",
                                            color: "#1a1a1a"
                                        }}
                                    >
                                        {getFullName(coach)}
                                    </div>

                                    <div
                                        style={{
                                            color: "#6c757d",
                                            fontSize: "14px",
                                            marginTop: "4px"
                                        }}
                                    >
                                        {coach.nickname
                                            ? `@${coach.nickname}`
                                            : coach.email || 'Без никнейма'}
                                    </div>

                                </div>

                                {!invitedCoaches.includes(coach.id) ? (

                                    <button
                                        onClick={() => handleInvite(coach.id)}
                                        style={{
                                            background: "#D1001C",
                                            border: "none",
                                            borderRadius: "10px",
                                            padding: "10px 18px",
                                            color: "white",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Пригласить
                                    </button>

                                ) : (

                                    <button
                                        onClick={() => handleCancelInvite(coach.id)}
                                        style={{
                                            background: "#6c757d",
                                            border: "none",
                                            borderRadius: "10px",
                                            padding: "10px 18px",
                                            color: "white",
                                            fontWeight: 600,
                                            cursor: "pointer"
                                        }}
                                    >
                                        Отозвать
                                    </button>

                                )}

                            </div>

                        ))

                    )}

                </div>

            </div>
        </div>
    );
};

export default CoachSearchPage;
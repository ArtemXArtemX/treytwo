import React, { useState } from 'react';
import Header from '../../components/Header';
import { useNavigate } from "react-router-dom";
import { useEffect } from 'react';
import coachService, { CoachResponse } from '../../api/coachService';

const CoachPage: React.FC = () => {
    const [coaches, setCoaches] = useState<CoachResponse[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<CoachResponse | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [coachToDelete, setCoachToDelete] = useState<CoachResponse | null>(null);
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!message.trim()) return;
        setMessage('');
    };

    const openDeleteModal = (coach: CoachResponse) => {
        setCoachToDelete(coach);
        setShowDeleteConfirm(true);
        setDeleteConfirmed(false);
        setDeleteError(null);
        setOpenMenuId(null);
    };

    const handleDeleteRelation = async () => {
        if (!coachToDelete?.relation_id) {
            setDeleteError("Не найден id связи");
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await coachService.removeRelation(coachToDelete.relation_id);

            setCoaches(prev => prev.filter(a => a.id !== coachToDelete.id));

            if (selectedCoach?.id === coachToDelete.id) {
                setSelectedCoach(null);
            }

            setShowDeleteConfirm(false);
            setSelectedCoach(null);
            setDeleteConfirmed(false);
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || "Ошибка удаления связи");
        } finally {
            setIsDeleting(false);
        }
    };

    const getFullName = (coach: CoachResponse) => {
        return `${coach.nickname ? `@${coach.nickname}` : coach.email || "Без никнейма"}`.trim();
    };

    const navigate = useNavigate();

    useEffect(() => {
        const loadCoaches = async () => {
            try {
                const data = await coachService.getMyCoaches();

                setCoaches(data);

                if (data.length > 0) {
                    setSelectedCoach(data[0]);
                }

            } catch (error) {
                console.error('Ошибка загрузки тренеров:', error);
            }
        };

        loadCoaches();
    }, []);

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header/>
            {showDeleteConfirm && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1002,
                        background: "rgba(0,0,0,0.35)"
                    }}
                    onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmed(false);
                        setDeleteError(null);
                        setCoachToDelete(null);
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: 16,
                            padding: 24,
                            maxWidth: 400,
                            width: "90%",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            border: "1px solid #e7eaf0"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 style={{ color: "#1a1a1a", fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
                            Удалить связь с тренером?
                        </h4>

                        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
                            Тренер будет удалён из вашего списка. Это действие нельзя отменить.
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
                                    setCoachToDelete(null);
                                }}
                                disabled={isDeleting}
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
                            >
                                Отмена
                            </button>

                            <button
                                onClick={handleDeleteRelation}
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
                <div className="card border-0 shadow-sm" style={{ borderRadius: "16px", overflow: "hidden", height: "calc(100vh - 140px)" }}>
                    <div className="row g-0" style={{ height: "100%" }}>
                        <div className="col-md-4" style={{ borderRight: "1px solid #e7eaf0", background: "white", height: "100%", overflowY: "auto" }}>
                            <div
                                className="p-3 border-bottom"
                                style={{
                                    background: "#f8f9fa",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                }}
                            >
                                <h5
                                    style={{
                                        margin: 0,
                                        fontWeight: 600,
                                        color: "#1a1a1a"
                                    }}
                                >
                                    Мои тренеры
                                </h5>

                                <button
                                    onClick={() => navigate("/coaches/search")}
                                    style={{
                                        background: "#D1001C",
                                        border: "none",
                                        borderRadius: "8px",
                                        padding: "8px 14px",
                                        color: "white",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        fontSize: "14px"
                                    }}
                                >
                                    Найти тренера
                                </button>
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
                                            borderBottom: "1px solid #e7eaf0",
                                            position: "relative",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            gap: "12px"
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: "#1a1a1a" }}>
                                                {coach.fullname}
                                            </div>

                                            <div style={{ color: "#6c757d", fontSize: "14px", marginTop: "4px" }}>
                                                {coach.nickname ? `@${coach.nickname}` : coach.email || 'Без никнейма'}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === coach.id ? null : coach.id);
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#D1001C",
                                                fontSize: "20px",
                                                cursor: "pointer",
                                                lineHeight: 1,
                                                padding: "4px 8px",
                                                borderRadius: 4
                                            }}
                                        >
                                            ⋯
                                        </button>

                                        {openMenuId === coach.id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    position: "absolute",
                                                    top: "40px",
                                                    right: "12px",
                                                    background: "white",
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "10px",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                                    zIndex: 10,
                                                    minWidth: "220px",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(coach)}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 14px",
                                                        background: "white",
                                                        border: "none",
                                                        color: "#dc3545",
                                                        textAlign: "left",
                                                        fontSize: "14px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    Удалить связь с тренером
                                                </button>
                                            </div>
                                        )}
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
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                height: "100%",
                                                color: "#999",
                                                fontSize: "15px"
                                            }}
                                        >
                                            Личные сообщения скоро появятся
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
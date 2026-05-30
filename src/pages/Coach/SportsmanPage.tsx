import React, { useState } from 'react';
import Header from '../../components/Header';
import { useEffect } from 'react';
import coachService, { InviteResponse } from '../../api/coachService';

interface Athlete {
    id: number;
    fullname?: string;
    surname?: string;
    name?: string;
    fathername?: string;
    nickname?: string;
    email?: string;
    id_relation?: number;
}

const SportsmanPage: React.FC = () => {
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(true);
    const [invites, setInvites] = useState<InviteResponse[]>([]);

    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(athletes[0]);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmed, setDeleteConfirmed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
    const [message, setMessage] = useState('');

    const handleSendMessage = () => {
        if (!message.trim()) return;
        console.log('Отправка сообщения спортсмену:', selectedAthlete, message);
        setMessage('');
    };

    const handleAcceptInvite = async (inviteId: number) => {
        try {
            await coachService.acceptInvite(inviteId);

            const invitesData = await coachService.getInvites();
            setInvites(invitesData.filter(invite => invite.status === 0));

            const sportsmans = await coachService.getSportsmans();
            setAthletes(sportsmans);

            if (sportsmans.length > 0) {
                setSelectedAthlete(sportsmans[0]);
            }

        } catch (error) {
            console.error('Ошибка принятия заявки:', error);
        }
    };

    const handleRejectInvite = async (inviteId: number) => {
        try {
            await coachService.rejectInvite(inviteId);

            setInvites(prev =>
                prev.filter(invite => invite.id !== inviteId)
            );

        } catch (error) {
            console.error('Ошибка отклонения заявки:', error);
        }
    };

    const openDeleteModal = (athlete: Athlete) => {
        setAthleteToDelete(athlete);
        setShowDeleteConfirm(true);
        setDeleteConfirmed(false);
        setDeleteError(null);
        setOpenMenuId(null);
    };

    const handleDeleteRelation = async () => {
        if (!athleteToDelete?.id_relation) {
            setDeleteError("Не найден id связи");
            return;
        }

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await coachService.removeRelation(athleteToDelete.id_relation);

            setAthletes(prev => prev.filter(a => a.id !== athleteToDelete.id));

            if (selectedAthlete?.id === athleteToDelete.id) {
                setSelectedAthlete(null);
            }

            setShowDeleteConfirm(false);
            setAthleteToDelete(null);
            setDeleteConfirmed(false);
        } catch (error: any) {
            setDeleteError(error.response?.data?.message || "Ошибка удаления связи");
        } finally {
            setIsDeleting(false);
        }
    };

    const getFullName = (athlete: Athlete) => {
        if (athlete.fullname) return athlete.fullname;

        return `${athlete.surname || ''} ${athlete.name || ''} ${athlete.fathername || ''}`.trim();
    };

    useEffect(() => {
        const loadSportsmans = async () => {
            try {
                const data = await coachService.getSportsmans();
                const invitesData = await coachService.getInvites();
                setInvites(invitesData.filter(invite => invite.status === 0));
                setAthletes(data);

                if (data.length > 0) {
                    setSelectedAthlete(data[0]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        loadSportsmans();
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
                        setAthleteToDelete(null);
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
                            Удалить связь со спортсменом?
                        </h4>

                        <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
                            Спортсмен будет удалён из вашего списка. Это действие нельзя отменить.
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
                                    setAthleteToDelete(null);
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
                        {/* Левая колонка — список спортсменов */}
                        <div className="col-md-4" style={{ borderRight: "1px solid #e7eaf0", background: "white", height: "100%", overflowY: "auto" }}>
                            <div className="p-3 border-bottom" style={{ background: "#f8f9fa" }}>
                                <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>Мои спортсмены</h5>
                                <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>{athletes.length} человек</p>
                            </div>
                            <div>
                                {invites.length > 0 && (
                                    <div
                                        style={{
                                            borderBottom: "1px solid #e7eaf0",
                                            background: "#fff8f8"
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: "12px 16px",
                                                fontWeight: 600,
                                                color: "#D1001C",
                                                fontSize: "14px",
                                                borderBottom: "1px solid #f1d4d8"
                                            }}
                                        >
                                            Входящие заявки
                                        </div>

                                        {invites.map(invite => (
                                            <div
                                                key={invite.id}
                                                style={{
                                                    padding: "14px 16px",
                                                    borderBottom: "1px solid #f1d4d8"
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontWeight: 600,
                                                        color: "#1a1a1a",
                                                        marginBottom: "4px"
                                                    }}
                                                >
                                                    {invite.fullname}
                                                </div>

                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#666",
                                                        marginBottom: "10px"
                                                    }}
                                                >
                                                    {invite.nickname
                                                        ? `@${invite.nickname}`
                                                        : invite.email || "Без никнейма"}
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px"
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => handleAcceptInvite(invite.id)}
                                                        style={{
                                                            background: "#198754",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            padding: "6px 12px",
                                                            color: "white",
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Принять
                                                    </button>

                                                    <button
                                                        onClick={() => handleRejectInvite(invite.id)}
                                                        style={{
                                                            background: "#dc3545",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            padding: "6px 12px",
                                                            color: "white",
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Отклонить
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {athletes.map(athlete => (
                                    <div
                                        key={athlete.id}
                                        onClick={() => setSelectedAthlete(athlete)}
                                        style={{
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            background: selectedAthlete?.id === athlete.id ? "#f0f2f5" : "white",
                                            borderBottom: "1px solid #e7eaf0",
                                            transition: "background 0.2s",
                                            position: "relative",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            gap: "12px"
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>
                                                {getFullName(athlete)}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666" }}>
                                                {athlete.nickname ? `@${athlete.nickname}` : athlete.email || "Без никнейма"}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === athlete.id ? null : athlete.id);
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: 20,
                                                cursor: "pointer",
                                                color: "#D1001C",
                                                lineHeight: 1,
                                                padding: "4px 8px",
                                                borderRadius: 4
                                            }}
                                        >
                                            ⋯
                                        </button>

                                        {openMenuId === athlete.id && (
                                            <div
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    position: "absolute",
                                                    top: "36px",
                                                    right: "12px",
                                                    background: "white",
                                                    border: "1px solid #e7eaf0",
                                                    borderRadius: "10px",
                                                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                                                    zIndex: 10,
                                                    minWidth: "230px",
                                                    overflow: "hidden"
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(athlete)}
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
                                                    Удалить связь со спортсменом
                                                </button>
                                            </div>
                                        )}
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
                                            {selectedAthlete.nickname
                                                ? `@${selectedAthlete.nickname}`
                                                : selectedAthlete.email || "Без никнейма"}
                                        </p>                                    </div>
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
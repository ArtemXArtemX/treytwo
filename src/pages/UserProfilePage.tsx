import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import authService from '../api/authService';
import api from '../api/axios';

interface UserData {
    user_surname: string;
    user_name: string;
    user_fathername: string;
    user_email: string;
    user_nickname: string;
    user_birthday: string;
    user_gender: boolean;
    user_height: number;
    user_weight: number;
    user_only_coach: boolean;
    user_hr_rest: number;
    user_hr_max: number;
    user_pace_max: number | null;
    id: number;
}

const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const currentUser = authService.getCurrentUser();
                if (!currentUser || !currentUser.id) {
                    navigate('/login');
                    return;
                }

                const response = await api.get(`/User/Get/${currentUser.id}`);
                setUserData(response.data as UserData);
            } catch (err) {
                console.error('Ошибка загрузки данных пользователя:', err);
                setError('Не удалось загрузить данные профиля');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const stats = [
        { label: "Занятия", value: "0" },
        { label: "Расстояние", value: "0 км" },
        { label: "Время", value: "0 ч" },
        { label: "Калории", value: "0" },
    ];

    const formatDate = (dateString: string) => {
        if (!dateString) return "Не указано";
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const getGenderText = (gender: boolean) => {
        return gender ? "Мужской" : "Женский";
    };

    const getFullName = () => {
        if (!userData) return "Не указано";
        return `${userData.user_surname} ${userData.user_name} ${userData.user_fathername || ''}`.trim();
    };

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
                <Header />
                <div className="container py-4 text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Загрузка...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
                <Header />
                <div className="container py-4">
                    <div className="alert alert-danger" role="alert">
                        {error || "Ошибка загрузки данных"}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
            <Header />

            <div className="container py-4">
                <div className="row">
                    <div className="col-md-4 d-flex flex-column">
                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: "12px", height: "400px" }}>
                            <div className="card-body p-4 d-flex flex-column" style={{ height: "100%" }}>
                                <div className="text-center mb-4">
                                    <div
                                        className="rounded-circle mx-auto mb-3 border"
                                        style={{
                                            width: "140px",
                                            height: "140px",
                                            backgroundColor: "#f8f9fa",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            border: "3px solid #e7eaf0"
                                        }}
                                    >
                                        <i className="bi bi-person" style={{ fontSize: "60px", color: "#6c757d" }}></i>
                                    </div>

                                    <h3 style={{ color: "#1a1a1a", fontWeight: 600 }}>
                                        {getFullName()}
                                    </h3>

                                    <div className="text-muted mb-3">
                                        {userData.user_email}
                                    </div>
                                    <div className="text-muted mb-3">
                                        @{userData.user_nickname}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="d-grid gap-2">
                                        <button
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 20px",
                                                fontWeight: 500,
                                                backgroundColor: "transparent",
                                                color: "#6c757d",
                                                border: "1px solid #6c757d",
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: "none"
                                            }}
                                            onClick={() => navigate('/settings')}
                                        >
                                            <i className="bi bi-pencil me-2"></i>
                                            Редактировать профиль
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4">
                                <h5 style={{ color: "#1a1a1a", fontWeight: 600, marginBottom: "16px" }}>
                                    <i className="bi bi-graph-up me-2"></i>
                                    Статистика
                                    <span style={{
                                        color: "#666",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        marginLeft: "12px"
                                    }}>
                                        Последние 12 месяцев
                                    </span>
                                </h5>
                                <div className="row">
                                    {stats.map((stat, index) => (
                                        <div key={index} className="col-6 mb-3">
                                            <div className="text-center p-3 rounded" style={{ backgroundColor: "#f8f9fa" }}>
                                                <div style={{
                                                    fontSize: "24px",
                                                    fontWeight: 700,
                                                    color: "#D1001C",
                                                    marginBottom: "4px"
                                                }}>
                                                    {stat.value}
                                                </div>
                                                <div style={{
                                                    fontSize: "12px",
                                                    color: "#666",
                                                    fontWeight: 500
                                                }}>
                                                    {stat.label}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "400px" }}>
                            <div className="card-body p-4 d-flex flex-column" style={{ height: "100%" }}>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0" style={{ color: "#1a1a1a", fontWeight: 600 }}>
                                        <i className="bi bi-person-badge me-2"></i>
                                        Информация о пользователе
                                    </h5>
                                </div>

                                <div className="row flex-grow-1">
                                    <div className="col-md-6 d-flex flex-column">
                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Дата рождения
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {formatDate(userData.user_birthday)}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Вес
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {userData.user_weight ? `${userData.user_weight} кг` : "Не указано"}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пульс покоя
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {userData.user_hr_rest ? `${userData.user_hr_rest} уд/мин` : "Не указано"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6 d-flex flex-column">
                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Пол
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {getGenderText(userData.user_gender)}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Рост
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {userData.user_height ? `${userData.user_height} м` : "Не указано"}
                                            </div>
                                        </div>

                                        <div className="mb-4 flex-grow-1">
                                            <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                                Макс. пульс
                                            </label>
                                            <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                                {userData.user_hr_max ? `${userData.user_hr_max} уд/мин` : "Не указано"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
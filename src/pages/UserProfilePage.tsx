import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

const UserProfilePage: React.FC = () => {
    const navigate = useNavigate();

    const userData = {
        name: "",
        email: "",
        birthDate: "",
        weight: "",
        height: "",
        location: "",
        bio: "",
        gender: ""
    };

    const stats = [
        { label: "Занятия", value: "0" },
        { label: "Расстояние", value: "0 км" },
        { label: "Время", value: "0 ч" },
        { label: "Калории", value: "0" },
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
            <Header />

            <div className="container py-4">
                <div className="row">
                    <div className="col-md-4 d-flex flex-column">
                        <div className="card border-0 shadow-sm mb-4 flex-grow-1" style={{ borderRadius: "12px" }}>
                            <div className="card-body p-4 d-flex flex-column">
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
                                        {userData.name || "Не указано"}
                                    </h3>

                                    <div className="text-muted mb-3">
                                        {userData.email || "Не указано"}
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
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "12px", height: "auto", minHeight: "300px" }}>
                            <div className="card-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h5 className="mb-0" style={{ color: "#1a1a1a", fontWeight: 600 }}>
                                        <i className="bi bi-person-badge me-2"></i>
                                        Информация о пользователе
                                    </h5>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            Дата рождения
                                        </label>
                                        <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                            {userData.birthDate || "Не указано"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            Пол
                                        </label>
                                        <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                            {userData.gender || "Не указано"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            Город
                                        </label>
                                        <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                            {userData.location || "Не указано"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            Вес (кг)
                                        </label>
                                        <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                            {userData.weight ? `${userData.weight} кг` : "Не указано"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            Рост (см)
                                        </label>
                                        <div className="form-control-plaintext" style={{ color: "#1a1a1a" }}>
                                            {userData.height ? `${userData.height} см` : "Не указано"}
                                        </div>
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label" style={{ color: "#666", fontWeight: 500 }}>
                                            О себе
                                        </label>
                                        <div className="form-control-plaintext" style={{
                                            color: "#1a1a1a",
                                            whiteSpace: "pre-wrap",
                                            minHeight: "38px"
                                        }}>
                                            {userData.bio || "Нет информации"}
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
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import logo from "../assets/logo.svg";
import api from "../api/axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

type Props = {
    active?: "calendar" | "report" | "analysis" | "coach" | "challenges" | "sportsmans";
};

const Header: React.FC<Props> = ({ active }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isCoach } = useRole();

    const getActiveTab = () => {
        if (active) return active;

        const path = location.pathname;
        if (path === "/calendar" || path === "/") return "calendar";
        if (path === "/reports") return "report";
        if (path === "/analysis") return "analysis";
        if (isCoach && path === "/sportsmans") return "sportsmans";
        if (!isCoach && path === "/coaches") return "coach";
        if (path === "/challenges") return "challenges";
        return "calendar";
    };

    const activeTab = getActiveTab();

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                await api.post("/User/logout", { refreshToken });
            }
        } catch (error) {
            console.error("Ошибка при выходе:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            localStorage.removeItem("userId");
            window.location.href = "/login";
        }
    };

    return (
        <header className="bg-white border-bottom">
            <div className="container py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                    <Link to="/calendar">
                        <img src={logo} alt="TREY logo" style={{ height: 42, width: "auto" }} />
                    </Link>
                </div>

                <nav className="d-none d-md-flex gap-4">
                    <Link
                        className={`trey-navlink ${activeTab === "calendar" ? "is-active" : ""}`}
                        to="/calendar"
                    >
                        Календарь
                    </Link>

                    <Link
                        className={`trey-navlink ${activeTab === "report" ? "is-active" : ""}`}
                        to="/reports"
                    >
                        Отчёты
                    </Link>

                    {isCoach ? (
                        <Link
                            className={`trey-navlink ${activeTab === "sportsmans" ? "is-active" : ""}`}
                            to="/sportsmans"
                        >
                            Спортсмены
                        </Link>
                    ) : (
                        <Link
                            className={`trey-navlink ${activeTab === "coach" ? "is-active" : ""}`}
                            to="/coaches"
                        >
                            Тренеры
                        </Link>
                    )}

                    <div
                        className="trey-navlink"
                        style={{
                            cursor: "not-allowed",
                        }}
                    >
                        Анализ
                    </div>

                    <div
                        className="trey-navlink"
                        style={{
                            cursor: "not-allowed",
                        }}
                    >
                        Челленджи
                    </div>
                </nav>

                <div className="d-flex align-items-center gap-3">
                    <button
                        type="button"
                        style={{
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            border: "0px",
                            justifyContent: "center",
                            backgroundColor: "transparent",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            padding: 0
                        }}
                        aria-label="Уведомления"
                    >
                        <i className="bi bi-bell fs-5"></i>
                    </button>

                    <div className="dropdown">
                        <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                                width: 36,
                                height: 36,
                                background: "#0d6efd",
                                color: "#fff",
                                fontWeight: 700,
                                cursor: "pointer"
                            }}
                            title="Профиль"
                            data-bs-toggle="dropdown"
                        >
                            AB
                        </div>

                        <div className="dropdown-menu dropdown-menu-end">
                            <Link to="/profile" className="dropdown-item">
                                <i className="bi bi-person me-2"></i>
                                Профиль
                            </Link>

                            <Link to="/settings" className="dropdown-item">
                                <i className="bi bi-gear me-2"></i>
                                Настройки
                            </Link>

                            <div className="dropdown-divider"></div>
                            <button onClick={handleLogout} className="dropdown-item text-danger">
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Выйти
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
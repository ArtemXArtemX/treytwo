import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";

type Props = {
    active?: "calendar" | "report" | "analysis" | "coach" | "challenges";
    notificationsCount?: number;
};

const Header: React.FC<Props> = ({ active = "calendar", notificationsCount = 3 }) => {
    return (
        <header className="bg-white border-bottom">
            <div className="container py-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                    <img src={logo} alt="TREY logo" style={{ height: 42, width: "auto" }} />
                </div>

                <nav className="d-none d-md-flex gap-4">
                    <Link
                        className={`trey-navlink ${active === "calendar" ? "is-active" : ""}`}
                        to="/calendar"
                    >
                        Календарь
                    </Link>

                    <a className={`trey-navlink ${active === "report" ? "is-active" : ""}`} href="#report">
                        Отчёт
                    </a>

                    <a className={`trey-navlink ${active === "analysis" ? "is-active" : ""}`} href="#analysis">
                        Анализ
                    </a>

                    <a className={`trey-navlink ${active === "coach" ? "is-active" : ""}`} href="#coach">
                        Тренер
                    </a>

                    <a
                        className={`trey-navlink ${active === "challenges" ? "is-active" : ""}`}
                        href="#challenges"
                    >
                        Челленджи
                    </a>
                </nav>

                <div className="d-flex align-items-center gap-3">
                    <button
                        className="btn btn-light position-relative"
                        type="button"
                        aria-label="Уведомления"
                    >
                        <i className="bi bi-bell" style={{ fontSize: 18 }} />

                        {notificationsCount > 0 && (
                            <span
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                                style={{ background: "#D1001C" }}
                            >
                              {notificationsCount}
                            </span>
                        )}
                    </button>

                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{ width: 36, height: 36, background: "#0d6efd", color: "#fff", fontWeight: 700 }}
                        title="Профиль"
                    >
                        AB
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

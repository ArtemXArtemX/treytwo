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
                    <Link className={`text-decoration-none ${active === "calendar" ? "fw-bold" : "text-muted"}`} to="/athlete/calendar">
                        Календарь
                    </Link>
                    <a className="text-decoration-none text-muted" href="#report">Отчёт</a>
                    <a className="text-decoration-none text-muted" href="#analysis">Анализ</a>
                    <a className="text-decoration-none text-muted" href="#coach">Тренер</a>
                    <a className="text-decoration-none text-muted" href="#challenges">Челленджи</a>
                </nav>

                <div className="d-flex align-items-center gap-3">
                    <button className="btn btn-light position-relative" type="button" aria-label="Уведомления">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22Z"
                                fill="currentColor"
                            />
                            <path
                                d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinejoin="round"
                            />
                        </svg>

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

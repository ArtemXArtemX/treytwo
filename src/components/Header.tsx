import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.svg";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

type Props = {
    active?: "calendar" | "report" | "analysis" | "coach" | "challenges";
};

const Header: React.FC<Props> = ({ active = "calendar" }) => {
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
                        type="button"
                        className="btn btn-light rounded-circle position-relative"
                        style={{
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                        aria-label="Уведомления"
                    >
                        <i className="bi bi-bell fs-5"></i>
                    </button>

                    <div
                        className="rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: 36,
                            height: 36,
                            background: "#0d6efd",
                            color: "#fff",
                            fontWeight: 700
                        }}
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
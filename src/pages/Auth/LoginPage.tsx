import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

const MOCK_USER = {
    email: "coach@mail.ru",
    password: "12345678",
};

const LoginPage: React.FC = () => {
    const [form, setForm] = useState<LoginForm>({
        email: "",
        password: "",
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
        e.preventDefault();

        if (
            form.email === MOCK_USER.email &&
            form.password === MOCK_USER.password
        ) {
            setError(null);
            setSuccess("Успешный вход.");
            console.log("LOGIN SUCCESS:", form);
        } else {
            setSuccess(null);
            setError("Неверный логин или пароль.");
            console.log("LOGIN FAILED:", form);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <img
                    src={logo}
                    alt="TREY Logo"
                    style={{
                        display: "block",
                        margin: "0 auto 16px",
                        width: "160px",
                    }}
                />

                <h2 className="text-center mb-1" style={{ fontWeight: 600 }}>
                </h2>

                <p className="text-center auth-subtitle mb-4">
                    Войдите в свой аккаунт
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label" htmlFor="email">
                            Адрес электронной почты
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="form-control"
                            placeholder="Введите ваш email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label" htmlFor="password">
                            Пароль
                        </label>
                        <div className="input-group">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                placeholder="Введите ваш пароль"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                style={{
                                    backgroundColor: "white",
                                    border: "1px solid #ced4da",
                                    borderLeft: "none",
                                    color: "#6c757d",
                                    padding: "0 12px",
                                    cursor: "pointer"
                                }}
                            >
                                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="form-check mb-3">
                        <input
                            id="remember"
                            name="remember"
                            type="checkbox"
                            className="form-check-input"
                            checked={form.remember}
                            onChange={handleChange}
                        />
                        <label
                            htmlFor="remember"
                            className="form-check-label"
                        >
                            Сохранить вход
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 mb-2"
                        style={{
                            backgroundColor: "#D1001C",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            fontWeight: 600
                        }}
                    >
                        Войти
                    </button>
                </form>

                {error && (
                    <div className="mt-2 text-danger" style={{ fontSize: 14 }}>
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mt-2 text-success" style={{ fontSize: 14 }}>
                        {success}
                    </div>
                )}

                <div className="text-center mt-3">
                    <a href="#" className="auth-link d-block">
                        Забыли пароль?
                    </a>
                    <span className="text-center">
                        Нет аккаунта?{" "}
                        <Link to="/register">
                            Зарегистрироваться
                        </Link>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
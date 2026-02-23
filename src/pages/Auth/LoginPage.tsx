import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.svg";
import { apiFetch } from "../../api/http";

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const result = await apiFetch<any>("/api/User/Auth", {
                method: "POST",
                body: JSON.stringify({
                    login: form.email,
                    password: form.password,
                }),
            });

            console.log("Данные от сервера:", result); // ПОСМОТРИ В КОНСОЛЬ

            localStorage.setItem("user", JSON.stringify(result));

            if (result.id) {
                localStorage.setItem("userId", String(result.id));
            }

            localStorage.setItem("token", result.token);
            localStorage.setItem("userId", String(result.userId));

            setSuccess("Успешный вход");

        } catch (err: any) {
            console.error(err);
            setError("Неверный логин или пароль");
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
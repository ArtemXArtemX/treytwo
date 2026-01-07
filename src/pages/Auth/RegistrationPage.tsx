import React, { useState, ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.svg";

type Role = "athlete" | "coach";

interface RegistrationForm {
    lastName: string;
    firstName: string;
    fatherName?: string;
    nickname: string;
    email: string;
    confirmEmail: string;
    password: string;
    confirmPassword: string;
    role: Role;
    sportType: string;
    birthDate?: string;
    gender?: "male" | "female" | "other";
}

const SPORT_OPTIONS = [
    { value: "", label: "Выберите вид спорта" },
    { value: "orienteering", label: "Ориентирование" },
    { value: "running", label: "Бег" },
    { value: "cycling", label: "Велоспорт" },
    { value: "swimming", label: "Плавание" },
    { value: "strength", label: "Силовые" },
    { value: "other", label: "Другой" },
];

const RegistrationPage: React.FC = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState<RegistrationForm>({
        lastName: "",
        firstName: "",
        fatherName: "",
        nickname: "",
        email: "",
        confirmEmail: "",
        password: "",
        confirmPassword: "",
        role: "athlete",
        sportType: "",
        birthDate: "",
        gender: "other",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const err: Record<string, string> = {};

        if (!form.lastName.trim()) err.lastName = "Введите фамилию";
        if (!form.firstName.trim()) err.firstName = "Введите имя";

        if (!form.email.trim()) err.email = "Введите email";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            err.email = "Неверный формат email";

        if (!form.confirmEmail.trim()) err.confirmEmail = "Подтвердите email";
        else if (form.confirmEmail !== form.email)
            err.confirmEmail = "Email не совпадают";

        if (!form.password) err.password = "Введите пароль";
        else if (form.password.length < 6)
            err.password = "Минимум 6 символов";

        if (!form.confirmPassword) err.confirmPassword = "Подтвердите пароль";
        else if (form.confirmPassword !== form.password)
            err.confirmPassword = "Пароли не совпадают";

        if (!form.birthDate) err.birthDate = "Укажите дату рождения";

        if (!form.sportType)
            err.sportType = "Укажите вид спорта";

        if (!form.nickname.trim()) err.nickname = "Введите никнейм";

        if (form.gender === "other") {
            err.gender = "Выберите пол";
        }

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validate()) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const payload = {
            lastName: form.lastName,
            firstName: form.firstName,
            fatherName: form.fatherName || null,
            nickname: form.nickname,
            email: form.email,
            role: form.role,
            sportType: form.sportType,
            birthDate: form.birthDate,
            gender: form.gender,
        };

        console.log("MOCK REGISTER PAYLOAD:", payload);

        navigate("/login");
    };

    return (
        <div style={{ minHeight: "100vh", background: "#f4f6fa", padding: 16 }}>
            <div
                className="card mx-auto shadow-sm"
                style={{ maxWidth: 900, borderRadius: 12, padding: 22 }}
            >
                <div className="text-center mb-3">
                    <img
                        src={logo}
                        alt="logo"
                        style={{
                            maxWidth: 140,
                            display: "block",
                            margin: "0 auto 12px",
                        }}
                    />
                    <p className="text-center auth-subtitle mb-4">
                        Создайте свой аккаунт
                    </p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-4">
                        <label className="form-label fw-bold">Выберите вашу роль</label>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <div
                                    onClick={() => setForm((p) => ({ ...p, role: "athlete" }))}
                                    className={`p-3 border rounded-3 text-center role-card ${
                                        form.role === "athlete" ? "border-primary shadow-sm" : "border-secondary"
                                    }`}
                                    style={{ cursor: "pointer", transition: "0.2s" }}
                                >
                                    <h5 className="mt-2 mb-1">Спортсмен</h5>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div
                                    onClick={() => setForm((p) => ({ ...p, role: "coach" }))}
                                    className={`p-3 border rounded-3 text-center role-card ${
                                        form.role === "coach" ? "border-primary shadow-sm" : "border-secondary"
                                    }`}
                                    style={{ cursor: "pointer", transition: "0.2s" }}
                                >
                                    <h5 className="mt-2 mb-1">Тренер</h5>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Фамилия</label>
                            <input
                                name="lastName"
                                value={form.lastName}
                                onChange={handleInput}
                                className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                            />
                            {errors.lastName && (
                                <div className="invalid-feedback">{errors.lastName}</div>
                            )}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Имя</label>
                            <input
                                name="firstName"
                                value={form.firstName}
                                onChange={handleInput}
                                className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                            />
                            {errors.firstName && (
                                <div className="invalid-feedback">{errors.firstName}</div>
                            )}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Отчество*</label>
                            <input
                                name="fatherName"
                                value={form.fatherName}
                                onChange={handleInput}
                                className="form-control"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Никнейм</label>
                        <input
                            name="nickname"
                            value={form.nickname}
                            onChange={handleInput}
                            className={`form-control ${errors.nickname ? "is-invalid" : ""}`}
                        />
                        {errors.nickname && <div className="invalid-feedback">{errors.nickname}</div>}
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Пол</label>
                            <select
                                name="gender"
                                value={form.gender}
                                onChange={handleInput}
                                className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                            >
                                <option value="other">Не указано</option>
                                <option value="male">Мужской</option>
                                <option value="female">Женский</option>
                            </select>

                            {errors.gender && (
                                <div className="invalid-feedback d-block">{errors.gender}</div>
                            )}
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Дата рождения</label>
                            <input
                                type="date"
                                name="birthDate"
                                value={form.birthDate}
                                onChange={handleInput}
                                className={`form-control ${
                                    errors.birthDate ? "is-invalid" : ""
                                }`}
                            />
                            {errors.birthDate && (
                                <div className="invalid-feedback">{errors.birthDate}</div>
                            )}
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Основной вид спорта</label>
                        <select
                            name="sportType"
                            value={form.sportType}
                            onChange={handleInput}
                            className={`form-select ${errors.sportType ? "is-invalid" : ""}`}
                        >
                            {SPORT_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        {errors.sportType && (
                            <div className="invalid-feedback">{errors.sportType}</div>
                        )}
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleInput}
                                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                            />
                            {errors.email && (
                                <div className="invalid-feedback">{errors.email}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Подтверждение email</label>
                            <input
                                name="confirmEmail"
                                type="email"
                                value={form.confirmEmail}
                                onChange={handleInput}
                                className={`form-control ${
                                    errors.confirmEmail ? "is-invalid" : ""
                                }`}
                            />
                            {errors.confirmEmail && (
                                <div className="invalid-feedback">{errors.confirmEmail}</div>
                            )}
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-md-6">
                            <label className="form-label">Пароль</label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleInput}
                                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                            />
                            {errors.password && (
                                <div className="invalid-feedback">{errors.password}</div>
                            )}
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Подтверждение пароля</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                value={form.confirmPassword}
                                onChange={handleInput}
                                className={`form-control ${
                                    errors.confirmPassword ? "is-invalid" : ""
                                }`}
                            />
                            {errors.confirmPassword && (
                                <div className="invalid-feedback">{errors.confirmPassword}</div>
                            )}
                        </div>
                    </div>

                    <div className="d-grid mb-3">
                        <button
                            className="btn"
                            type="submit"
                            style={{
                                backgroundColor: "#D1001C",
                                color: "white",
                                border: "none",
                                padding: "10px 20px",
                                borderRadius: "8px"
                            }}
                        >
                            Зарегистрироваться
                        </button>
                    </div>

                    <div className="text-center">
                        Уже есть аккаунт?{" "}
                        <Link to="/login">
                            Войти
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegistrationPage;

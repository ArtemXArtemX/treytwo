import React, { useState, ChangeEvent, FormEvent } from "react";

export type CreateSessionPayload = {
    date: string;
    name: string;
    sport: string;
    typeTraining: string;
    note: string;
    startTime: string;
    distanceKm?: number;
    durationSec?: number;
    avgHr?: number;
    avgPaceSecPerKm?: number;
    elevationGainM?: number;
    elevationLossM?: number;
    calories?: number;
};

type Props = {
    onClose: () => void;
    onSubmit: (payload: CreateSessionPayload) => void;
};

const SPORT_OPTIONS = [
    { value: "", label: "Выберите вид спорта" },
    { value: "orienteering", label: "Ориентирование" },
    { value: "running", label: "Бег" },
    { value: "trail", label: "Трейл" },
    { value: "cycling", label: "Велосипед" },
    { value: "swimming", label: "Плавание" },
    { value: "strength", label: "Силовые" },
    { value: "other", label: "Другой" },
];

const TRAINING_TYPES = [
    { value: "", label: "Выберите тип тренировки" },
    { value: "interval", label: "Интервальная" },
    { value: "tempo", label: "Темповая" },
    { value: "long", label: "Длинная" },
    { value: "recovery", label: "Восстановительная" },
    { value: "steady", label: "Поддерживающая" },
    { value: "strength", label: "Силовая" },
    { value: "other", label: "Другое" },
];

const CreateSessionModal: React.FC<Props> = ({ onClose, onSubmit }) => {
    const [openStats, setOpenStats] = useState(false);

    const [form, setForm] = useState({
        name: "",
        sport: "",
        typeTraining: "",
        note: "",
        date: "",
        startTime: "",
        distanceKm: "",
        durationHours: "0",
        durationMinutes: "0",
        durationSeconds: "0",
        avgHr: "",
        calories: "",
        elevationGainM: "",
        elevationLossM: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handle = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (["durationHours", "durationMinutes", "durationSeconds", "avgHr", "calories", "elevationGainM", "elevationLossM"].includes(name)) {
            if (value === "" || /^\d*$/.test(value)) {
                const numValue = value === "" ? "" : value;
                setForm((p) => ({ ...p, [name]: numValue }));
            }
        } else if (name === "distanceKm") {
            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setForm((p) => ({ ...p, [name]: value }));
            }
        } else {
            setForm((p) => ({ ...p, [name]: value }));
        }

        setErrors((p) => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const e: Record<string, string> = {};

        if (!form.name.trim()) e.name = "Введите имя";
        if (!form.sport) e.sport = "Выберите вид спорта";
        if (!form.typeTraining) e.typeTraining = "Выберите тип тренировки";
        if (!form.date) e.date = "Укажите дату";
        if (!form.startTime) e.startTime = "Укажите время начала";

        if (!form.distanceKm.trim()) {
            e.distanceKm = "Введите расстояние";
        } else {
            const distance = parseFloat(form.distanceKm);
            if (isNaN(distance) || distance <= 0) {
                e.distanceKm = "Введите корректное расстояние";
            }
        }

        const hours = parseInt(form.durationHours) || 0;
        const minutes = parseInt(form.durationMinutes) || 0;
        const seconds = parseInt(form.durationSeconds) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds <= 0) {
            e.duration = "Введите продолжительность тренировки";
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const parseTimeInputToSeconds = (): number => {
        const hours = parseInt(form.durationHours) || 0;
        const minutes = parseInt(form.durationMinutes) || 0;
        const seconds = parseInt(form.durationSeconds) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    };

    const parsePaceToSeconds = (): number | undefined => {
        const distance = parseFloat(form.distanceKm);
        const durationSec = parseTimeInputToSeconds();

        if (distance > 0 && durationSec > 0) {
            return Math.round(durationSec / distance);
        }
        return undefined;
    };

    const submit = (ev: FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        const payload: CreateSessionPayload = {
            name: form.name,
            sport: form.sport,
            typeTraining: form.typeTraining,
            note: form.note,
            date: form.date,
            startTime: form.startTime,
            distanceKm: parseFloat(form.distanceKm),
            durationSec: parseTimeInputToSeconds(),
            avgHr: form.avgHr ? parseInt(form.avgHr, 10) : undefined,
            avgPaceSecPerKm: parsePaceToSeconds(),
            elevationGainM: form.elevationGainM ? parseInt(form.elevationGainM, 10) : undefined,
            elevationLossM: form.elevationLossM ? parseInt(form.elevationLossM, 10) : undefined,
            calories: form.calories ? parseInt(form.calories, 10) : undefined,
        };

        onSubmit(payload);
    };

    const calculatePaceDisplay = (): string => {
        const paceSecPerKm = parsePaceToSeconds();
        if (!paceSecPerKm) return "";

        const paceMinutes = Math.floor(paceSecPerKm / 60);
        const paceSeconds = Math.floor(paceSecPerKm % 60);
        return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
    };

    const paceDisplay = calculatePaceDisplay();

    return (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                    <div className="modal-header" style={{
                        borderBottom: "1px solid #e9ecef",
                        padding: "1.5rem 1.5rem 1rem"
                    }}>
                        <h5 className="modal-title" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Создать занятие</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                    </div>

                    <form onSubmit={submit} noValidate>
                        <div className="modal-body" style={{ padding: "1.5rem" }}>
                            <div className="mb-4">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-medium">
                                            Имя занятия
                                        </label>
                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handle}
                                            className={`form-control ${errors.name ? "is-invalid" : ""}`}
                                            style={{ borderRadius: "8px", padding: "10px 12px" }}
                                        />
                                        {errors.name && <div className="invalid-feedback" style={{ fontSize: "0.875rem" }}>{errors.name}</div>}
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-medium">
                                            Вид спорта
                                        </label>
                                        <select
                                            name="sport"
                                            value={form.sport}
                                            onChange={handle}
                                            className={`form-select ${errors.sport ? "is-invalid" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 32px 10px 12px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                paddingRight: errors.sport ? "50px" : "32px"
                                            }}
                                        >
                                            {SPORT_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.sport && <div className="invalid-feedback" style={{ fontSize: "0.875rem" }}>{errors.sport}</div>}
                                    </div>

                                    <div className="col-md-3">
                                        <label className="form-label fw-medium">
                                            Тип тренировки
                                        </label>
                                        <select
                                            name="typeTraining"
                                            value={form.typeTraining}
                                            onChange={handle}
                                            className={`form-select ${errors.typeTraining ? "is-invalid" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 32px 10px 12px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                paddingRight: errors.typeTraining ? "50px" : "32px"
                                            }}
                                        >
                                            {TRAINING_TYPES.map((o) => (
                                                <option key={o.value} value={o.value}>
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.typeTraining && <div className="invalid-feedback" style={{ fontSize: "0.875rem" }}>{errors.typeTraining}</div>}
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-medium">
                                            Дата
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={form.date}
                                            onChange={handle}
                                            className={`form-control ${errors.date ? "is-invalid border-danger" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 12px",
                                                backgroundImage: "none"
                                            }}
                                        />
                                        {errors.date && (
                                            <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                                                {errors.date}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-medium">
                                            Время начала
                                        </label>
                                        <input
                                            type="time"
                                            name="startTime"
                                            value={form.startTime}
                                            onChange={handle}
                                            className={`form-control ${errors.startTime ? "is-invalid border-danger" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 12px",
                                                backgroundImage: "none"
                                            }}
                                        />
                                        {errors.startTime && (
                                            <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                                                {errors.startTime}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label fw-medium">
                                            Расстояние
                                        </label>
                                        <div className={`input-group ${errors.distanceKm ? "is-invalid" : ""}`}>
                                            <input
                                                name="distanceKm"
                                                value={form.distanceKm}
                                                onChange={handle}
                                                className={`form-control ${errors.distanceKm ? "is-invalid" : ""}`}
                                                inputMode="decimal"
                                                style={{
                                                    borderRadius: "8px 0 0 8px",
                                                    padding: "10px 12px",
                                                    borderRight: "none"
                                                }}
                                            />
                                            <span className="input-group-text" style={{
                                                borderLeft: "none",
                                                borderRadius: "0 8px 8px 0",
                                                backgroundColor: "#f8f9fa",
                                                border: errors.distanceKm ? "1px solid #dc3545" : "1px solid #ced4da"
                                            }}>км</span>
                                        </div>
                                        {errors.distanceKm && (
                                            <div className="invalid-feedback d-block" style={{ fontSize: "0.875rem" }}>
                                                {errors.distanceKm}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="form-label fw-medium">
                                            Продолжительность
                                        </label>

                                        <div className="row g-2">
                                            <div className="col-auto">
                                                <div className="input-group">
                                                    <input
                                                        name="durationHours"
                                                        value={form.durationHours}
                                                        onChange={handle}
                                                        className="form-control"
                                                        placeholder="0"
                                                        maxLength={2}
                                                        style={{
                                                            borderRadius: "8px",
                                                            padding: "10px 12px",
                                                            width: "80px",
                                                            textAlign: "center"
                                                        }}
                                                    />
                                                    <span className="input-group-text" style={{
                                                        borderLeft: "none",
                                                        borderRadius: "0 8px 8px 0",
                                                        backgroundColor: "#f8f9fa",
                                                        fontSize: "0.875rem"
                                                    }}>ч</span>
                                                </div>
                                            </div>
                                            <div className="col-auto">
                                                <div className="input-group">
                                                    <input
                                                        name="durationMinutes"
                                                        value={form.durationMinutes}
                                                        onChange={handle}
                                                        className="form-control"
                                                        placeholder="30"
                                                        maxLength={2}
                                                        style={{
                                                            borderRadius: "8px",
                                                            padding: "10px 12px",
                                                            width: "80px",
                                                            textAlign: "center"
                                                        }}
                                                    />
                                                    <span className="input-group-text" style={{
                                                        borderLeft: "none",
                                                        borderRadius: "0 8px 8px 0",
                                                        backgroundColor: "#f8f9fa",
                                                        fontSize: "0.875rem"
                                                    }}>м</span>
                                                </div>
                                            </div>
                                            <div className="col-auto">
                                                <div className="input-group">
                                                    <input
                                                        name="durationSeconds"
                                                        value={form.durationSeconds}
                                                        onChange={handle}
                                                        className="form-control"
                                                        placeholder="0"
                                                        maxLength={2}
                                                        style={{
                                                            borderRadius: "8px",
                                                            padding: "10px 12px",
                                                            width: "80px",
                                                            textAlign: "center"
                                                        }}
                                                    />
                                                    <span className="input-group-text" style={{
                                                        borderLeft: "none",
                                                        borderRadius: "0 8px 8px 0",
                                                        backgroundColor: "#f8f9fa",
                                                        fontSize: "0.875rem"
                                                    }}>с</span>
                                                </div>
                                            </div>
                                        </div>
                                        {errors.duration && <div className="text-danger mb-2" style={{ fontSize: "0.875rem" }}>{errors.duration}</div>}
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">
                                            Примечания*
                                        </label>
                                        <textarea
                                            name="note"
                                            value={form.note}
                                            onChange={handle}
                                            className="form-control"
                                            rows={3}
                                            placeholder="Как прошла тренировка?"
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 12px",
                                                fontSize: "0.875rem"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={() => setOpenStats((p) => !p)}
                                    style={{
                                        borderRadius: "8px",
                                        padding: "8px 16px",
                                        fontSize: "0.875rem",
                                        backgroundColor: "transparent",
                                        color: "#D1001C",
                                        border: "1px solid #D1001C",
                                        cursor: "pointer"
                                    }}
                                >
                                    {openStats ? "Скрыть статистику" : "Дополнительная статистика"}
                                    <i className={`bi ${openStats ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                                </button>

                                {openStats && (
                                    <div className="row g-3 mt-3">
                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Средний пульс*
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    name="avgHr"
                                                    value={form.avgHr}
                                                    onChange={handle}
                                                    className="form-control"
                                                    style={{ borderRadius: "8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>уд/мин</span>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Калории*
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    name="calories"
                                                    value={form.calories}
                                                    onChange={handle}
                                                    className="form-control"
                                                    style={{ borderRadius: "8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>ккал</span>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Общий подъём*
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    name="elevationGainM"
                                                    value={form.elevationGainM}
                                                    onChange={handle}
                                                    className="form-control"
                                                    style={{ borderRadius: "8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>м</span>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">
                                                Общий спуск*
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    name="elevationLossM"
                                                    value={form.elevationLossM}
                                                    onChange={handle}
                                                    className="form-control"
                                                    style={{ borderRadius: "8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>м</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer" style={{
                            borderTop: "1px solid #e9ecef",
                            padding: "1rem 1.5rem"
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
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
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="btn btn-danger"
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontWeight: 600,
                                    backgroundColor: "#D1001C",
                                    border: "none"
                                }}
                            >
                                Создать тренировку
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionModal;
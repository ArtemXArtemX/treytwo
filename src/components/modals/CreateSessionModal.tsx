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
    { value: "steady", label: "Ровная" },
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
        durationMin: "",
        avgHr: "",
        avgPace: "",
        elevationGainM: "",
        elevationLossM: "",
        calories: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handle = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm((p) => ({ ...p, [name]: value }));
        setErrors((p) => ({ ...p, [name]: "" }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = "Введите название";
        if (!form.sport) e.sport = "Выберите вид спорта";
        if (!form.typeTraining) e.typeTraining = "Выберите тип тренировки";
        if (!form.date) e.date = "Укажите дату";
        if (!form.startTime) e.startTime = "Укажите время начала";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const parsePaceToSeconds = (paceStr: string): number | undefined => {
        if (!paceStr) return undefined;
        const parts = paceStr.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            if (!isNaN(minutes) && !isNaN(seconds)) {
                return minutes * 60 + seconds;
            }
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
            distanceKm: form.distanceKm ? parseFloat(form.distanceKm) : undefined,
            durationSec: form.durationMin ? parseInt(form.durationMin, 10) * 60 : undefined,
            avgHr: form.avgHr ? parseInt(form.avgHr, 10) : undefined,
            avgPaceSecPerKm: parsePaceToSeconds(form.avgPace),
            elevationGainM: form.elevationGainM ? parseInt(form.elevationGainM, 10) : undefined,
            elevationLossM: form.elevationLossM ? parseInt(form.elevationLossM, 10) : undefined,
            calories: form.calories ? parseInt(form.calories, 10) : undefined,
        };

        onSubmit(payload);
    };

    return (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                <div className="modal-content" style={{ borderRadius: 16 }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Создать занятие</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                    </div>

                    <form onSubmit={submit} noValidate>
                        <div className="modal-body">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Название занятия *</label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handle}
                                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                                    />
                                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Вид спорта *</label>
                                    <select
                                        name="sport"
                                        value={form.sport}
                                        onChange={handle}
                                        className={`form-select ${errors.sport ? "is-invalid" : ""}`}
                                    >
                                        {SPORT_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.sport && <div className="invalid-feedback">{errors.sport}</div>}
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">Тип тренировки *</label>
                                    <select
                                        name="typeTraining"
                                        value={form.typeTraining}
                                        onChange={handle}
                                        className={`form-select ${errors.typeTraining ? "is-invalid" : ""}`}
                                    >
                                        {TRAINING_TYPES.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.typeTraining && <div className="invalid-feedback">{errors.typeTraining}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Дата *</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handle}
                                        className={`form-control ${errors.date ? "is-invalid" : ""}`}
                                    />
                                    {errors.date && <div className="invalid-feedback">{errors.date}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Время начала *</label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={form.startTime}
                                        onChange={handle}
                                        className={`form-control ${errors.startTime ? "is-invalid" : ""}`}
                                    />
                                    {errors.startTime && <div className="invalid-feedback">{errors.startTime}</div>}
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Расстояние (км)</label>
                                    <input
                                        name="distanceKm"
                                        value={form.distanceKm}
                                        onChange={handle}
                                        className="form-control"
                                        inputMode="decimal"
                                    />
                                </div>

                                <div className="col-md-4">
                                    <label className="form-label">Время тренировки (мин)</label>
                                    <input
                                        name="durationMin"
                                        value={form.durationMin}
                                        onChange={handle}
                                        className="form-control"
                                        inputMode="numeric"
                                    />
                                </div>

                                <div className="col-12">
                                    <label className="form-label">Примечания</label>
                                    <textarea
                                        name="note"
                                        value={form.note}
                                        onChange={handle}
                                        className="form-control"
                                        rows={3}
                                        placeholder="Как прошла тренировка?"
                                    />
                                </div>
                            </div>

                            <hr className="my-3" />

                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setOpenStats((p) => !p)}
                            >
                                {openStats ? "Скрыть дополнительную статистику" : "Показать дополнительную статистику"}
                            </button>

                            {openStats && (
                                <div className="row g-3 mt-2">
                                    <div className="col-md-4">
                                        <label className="form-label">Средний пульс</label>
                                        <input name="avgHr" value={form.avgHr} onChange={handle} className="form-control" />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Средний темп (мин:сек)</label>
                                        <input
                                            name="avgPace"
                                            value={form.avgPace}
                                            onChange={handle}
                                            className="form-control"
                                            placeholder="например 4:30"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Калории</label>
                                        <input name="calories" value={form.calories} onChange={handle} className="form-control" />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">Общий подъём (м)</label>
                                        <input name="elevationGainM" value={form.elevationGainM} onChange={handle} className="form-control" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Общий спуск (м)</label>
                                        <input name="elevationLossM" value={form.elevationLossM} onChange={handle} className="form-control" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                                Отмена
                            </button>
                            <button type="submit" className="btn btn-danger">
                                Создать
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateSessionModal;
import React, { useState, useEffect } from 'react';
import trainingService from '../../api/trainingService';
import { TrainingEvent } from '../../pages/Athlete/CalendarPage';

type Props = {
    training: TrainingEvent;
    onClose: () => void;
    onComplete: () => void;
};

const MarkAsCompleteModal: React.FC<Props> = ({ training, onClose, onComplete }) => {
    const [mode, setMode] = useState<'file' | 'manual'>('file');
    const [openStats, setOpenStats] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [stressScore, setStressScore] = useState('5');
    const [feelingScore, setFeelingScore] = useState('3');
    const [comment, setComment] = useState('');

    const [file, setFile] = useState<File | null>(null);

    const [form, setForm] = useState({
        time_start: training.date ? `${training.date}T${training.startTime || '00:00'}` : new Date().toISOString().slice(0, 16),
        local_timestamp: training.date ? `${training.date}T${training.startTime || '00:00'}` : new Date().toISOString().slice(0, 16),
        durationHours: '',
        durationMinutes: '',
        durationSeconds: '',
        distanceKm: (training.distanceKm || 0).toString(),
        avgHr: (training.avgHr || 0).toString(),
        calories: (training.calories || 0).toString(),
    });

    useEffect(() => {
        if (training.durationSec) {
            const hours = Math.floor(training.durationSec / 3600);
            const minutes = Math.floor((training.durationSec % 3600) / 60);
            const seconds = training.durationSec % 60;
            setForm(prev => ({
                ...prev,
                durationHours: hours.toString(),
                durationMinutes: minutes.toString(),
                durationSeconds: seconds.toString()
            }));
        }
    }, [training]);

    const feelingLabels = [
        { value: "1", label: "😫 Очень слабым" },
        { value: "2", label: "😔 Слабым" },
        { value: "3", label: "😐 Нормально" },
        { value: "4", label: "😊 Сильным" },
        { value: "5", label: "😁 Очень сильным" }
    ];

    const parseTimeInputToSeconds = (): number => {
        const hours = parseInt(form.durationHours) || 0;
        const minutes = parseInt(form.durationMinutes) || 0;
        const seconds = parseInt(form.durationSeconds) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            if (mode === 'file') {
                if (!file) {
                    setError('Выберите файл');
                    setLoading(false);
                    return;
                }
                await trainingService.completeTrainingWithFile(
                    Number(training.id),
                    file,
                    stressScore ? parseInt(stressScore, 10) : undefined,
                    feelingScore ? parseInt(feelingScore, 10) : undefined,
                    comment
                );
            } else {
                const durationSec = parseTimeInputToSeconds();
                const distanceKm = parseFloat(form.distanceKm);
                const avgSpeed = durationSec > 0 && distanceKm > 0 ? (distanceKm * 1000) / durationSec : 0;

                await trainingService.completeTrainingWithoutFile(Number(training.id), {
                    time_start: form.time_start,
                    local_timestamp: form.local_timestamp,
                    duration: durationSec,
                    distance: distanceKm * 1000,
                    avg_heart_rate: form.avgHr ? parseInt(form.avgHr, 10) : 0,
                    avg_speed: avgSpeed,
                    calories: form.calories ? parseInt(form.calories, 10) : 0,
                    stress_score: stressScore ? parseInt(stressScore, 10) : 0,
                    feeling_score: feelingScore ? parseInt(feelingScore, 10) : 0,
                    comment_sportsman: comment
                });
            }

            onComplete();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ошибка при сохранении');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                    <div className="modal-header" style={{ borderBottom: "1px solid #e9ecef", padding: "1.5rem 1.5rem 1rem" }}>
                        <h5 className="modal-title" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Отметить выполнение</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body" style={{ padding: "1.5rem" }}>
                        {error && <div className="alert alert-danger">{error}</div>}

                        <div className="d-flex gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setMode('file')}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    borderColor: mode === 'file' ? "#D1001C" : "#ced4da",
                                    backgroundColor: mode === 'file' ? "#D1001C" : "transparent",
                                    color: mode === 'file' ? "white" : "#495057",
                                    fontWeight: mode === 'file' ? 600 : 500,
                                    cursor: "pointer"
                                }}
                            >
                                Загрузить файл
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid",
                                    borderColor: mode === 'manual' ? "#D1001C" : "#ced4da",
                                    backgroundColor: mode === 'manual' ? "#D1001C" : "transparent",
                                    color: mode === 'manual' ? "white" : "#495057",
                                    fontWeight: mode === 'manual' ? 600 : 500,
                                    cursor: "pointer"
                                }}
                            >
                                Ввести вручную
                            </button>
                        </div>

                        {mode === 'file' ? (
                            <>
                                <div className="mb-3">
                                    <label className="form-label">Файл тренировки</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".fit,.tcx,.gpx"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        style={{ borderRadius: "8px", padding: "10px 12px" }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Дата и время старта*</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={form.time_start}
                                                onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                                                style={{ borderRadius: "8px", padding: "10px 12px" }}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Локальное время*</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={form.local_timestamp}
                                                onChange={(e) => setForm({ ...form, local_timestamp: e.target.value })}
                                                style={{ borderRadius: "8px", padding: "10px 12px" }}
                                            />
                                        </div>

                                        <div className="col-md-4">
                                            <label className="form-label">Дистанция (км)*</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={form.distanceKm}
                                                    onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                                                    style={{ borderRadius: "8px 0 0 8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>км</span>
                                            </div>
                                        </div>

                                        <div className="col-md-8">
                                            <label className="form-label">Продолжительность*</label>
                                            <div className="row g-2">
                                                <div className="col-4">
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Ч"
                                                            value={form.durationHours}
                                                            onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                                                            style={{ borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}
                                                        />
                                                        <span className="input-group-text" style={{
                                                            borderLeft: "none",
                                                            borderRadius: "0 8px 8px 0",
                                                            backgroundColor: "#f8f9fa"
                                                        }}>ч</span>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Мин"
                                                            value={form.durationMinutes}
                                                            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                                                            style={{ borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}
                                                        />
                                                        <span className="input-group-text" style={{
                                                            borderLeft: "none",
                                                            borderRadius: "0 8px 8px 0",
                                                            backgroundColor: "#f8f9fa"
                                                        }}>м</span>
                                                    </div>
                                                </div>
                                                <div className="col-4">
                                                    <div className="input-group">
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Сек"
                                                            value={form.durationSeconds}
                                                            onChange={(e) => setForm({ ...form, durationSeconds: e.target.value })}
                                                            style={{ borderRadius: "8px", padding: "10px 12px", textAlign: "center" }}
                                                        />
                                                        <span className="input-group-text" style={{
                                                            borderLeft: "none",
                                                            borderRadius: "0 8px 8px 0",
                                                            backgroundColor: "#f8f9fa"
                                                        }}>с</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label className="form-label">Средний пульс</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={form.avgHr}
                                                    onChange={(e) => setForm({ ...form, avgHr: e.target.value })}
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
                                            <label className="form-label">Калории</label>
                                            <div className="input-group">
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={form.calories}
                                                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                                                    style={{ borderRadius: "8px", padding: "10px 12px" }}
                                                />
                                                <span className="input-group-text" style={{
                                                    borderLeft: "none",
                                                    borderRadius: "0 8px 8px 0",
                                                    backgroundColor: "#f8f9fa"
                                                }}>ккал</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setOpenStats(!openStats)}
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
                                    </button>

                                    {openStats && (
                                        <div className="row g-3 mt-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Ср. скорость</label>
                                                <div className="input-group">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="form-control"
                                                        readOnly
                                                        value={(() => {
                                                            const durationSec = parseTimeInputToSeconds();
                                                            const distanceKm = parseFloat(form.distanceKm);
                                                            const speed = durationSec > 0 && distanceKm > 0 ? (distanceKm * 1000) / durationSec : 0;
                                                            return speed.toFixed(2);
                                                        })()}
                                                        style={{ borderRadius: "8px", padding: "10px 12px", backgroundColor: "#f8f9fa" }}
                                                    />
                                                    <span className="input-group-text" style={{
                                                        borderLeft: "none",
                                                        borderRadius: "0 8px 8px 0",
                                                        backgroundColor: "#f8f9fa"
                                                    }}>м/с</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="mb-4">
                            <div className="row g-3">
                                <div className="col-md-12">
                                    <label className="form-label">Воспринимаемые усилия (1-10)</label>
                                    <div className="d-flex align-items-center">
                                        <input
                                            type="range"
                                            className="form-range"
                                            min="1"
                                            max="10"
                                            step="1"
                                            value={stressScore}
                                            onChange={(e) => setStressScore(e.target.value)}
                                        />
                                        <span className="ms-3 fw-bold" style={{ minWidth: "30px", textAlign: "center" }}>{stressScore}</span>
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label">Как вы себя чувствовали?</label>
                                    <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
                                        {feelingLabels.map(feeling => (
                                            <button
                                                key={feeling.value}
                                                type="button"
                                                onClick={() => setFeelingScore(feeling.value)}
                                                style={{
                                                    flex: "1 1 0",
                                                    minWidth: "0",
                                                    borderRadius: "8px",
                                                    padding: "10px 8px",
                                                    border: "1px solid #D1001C",
                                                    backgroundColor: feelingScore === feeling.value ? "#D1001C" : "transparent",
                                                    color: feelingScore === feeling.value ? "white" : "#D1001C",
                                                    fontSize: "0.875rem",
                                                    cursor: "pointer",
                                                    outline: "none",
                                                    whiteSpace: "nowrap",
                                                    textAlign: "center"
                                                }}
                                            >
                                                {feeling.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-md-12">
                                    <label className="form-label">Примечания</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Как прошла тренировка?"
                                        style={{ borderRadius: "8px", padding: "10px 12px", fontSize: "0.875rem" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ borderTop: "1px solid #e9ecef", padding: "1rem 1.5rem" }}>
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
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                borderRadius: "8px",
                                padding: "10px 20px",
                                fontWeight: 600,
                                backgroundColor: "#D1001C",
                                border: "none",
                                color: "white",
                                cursor: loading ? "not-allowed" : "pointer",
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? "Сохранение..." : "Сохранить"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarkAsCompleteModal;
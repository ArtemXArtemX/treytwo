import React, { useState, ChangeEvent, useEffect } from "react";
import { GpsPoint } from "../../pages/Athlete/CalendarPage";
import sportService from "../../api/sportService";
import trainingTypeService from "../../api/trainingTypeService";
import { TrainingType } from "../../models/trainingType";

export type UploadParsedPayload = {
    date: string;
    status: "done";
    name?: string;
    sport?: string;
    typeTraining?: string;
    note?: string;
    startTime?: string;
    distanceKm?: number;
    durationSec?: number;
    avgHr?: number;
    avgPaceSecPerKm?: number;
    elevationGainM?: number;
    elevationLossM?: number;
    calories?: number;
    gpsPoints?: GpsPoint[];
    isRace?: boolean;
    isTest?: boolean;
    comment_sportsmen?: string;
    stress_score?: number;
    feeling_score?: number;
    type_training_id?: number;
    name_training?: string;
    coach_creator?: string | null;
    planned_training?: boolean;
    sportsmen_id?: number;
    sport_id?: number;
};

type Props = {
    onClose: () => void;
    onParsed: (data: UploadParsedPayload) => void;
};

interface Sport {
    id: number;
    sport_name: string;
}


const semicirclesToDegrees = (semicircles: number): number => {
    return semicircles * (180 / Math.pow(2, 31));
};

const isSemicircleCoordinate = (num: number): boolean => {
    return Math.abs(num) > 1000000;
};

const calculatePaceFromSpeed = (speedMps: number): number | undefined => {
    if (!speedMps || speedMps <= 0) return undefined;
    const paceSecPerKm = 1000 / speedMps;
    return Math.round(paceSecPerKm);
};

const UploadSessionModal: React.FC<Props> = ({ onClose, onParsed }) => {
    const [error, setError] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sports, setSports] = useState<Sport[]>([]);
    const [loadingSports, setLoadingSports] = useState(true);
    const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([]);
    const [loadingTrainingTypes, setLoadingTrainingTypes] = useState(true);

    useEffect(() => {
        const fetchSports = async () => {
            setLoadingSports(true);
            try {
                const sportsData = await sportService.getSports();
                const transformedSports: Sport[] = sportsData.map((item: any) => ({
                    id: item.id,
                    sport_name: item.sport_name || item.name || item.label || "Неизвестно"
                }));

                setSports(transformedSports);
            } catch (error) {
                console.error("Ошибка загрузки видов спорта:", error);
            } finally {
                setLoadingSports(false);
            }
        };
        fetchSports();
    }, []);
    const [showDataForm, setShowDataForm] = useState(false);
    const [formData, setFormData] = useState({
        comment_sportsmen: "",
        stress_score: 0,
        feeling_score: 0,
        type_training_id: "",
        name_training: "",
        sport_id: "",
    });

    useEffect(() => {
        const fetchTrainingTypes = async () => {
            setLoadingTrainingTypes(true);
            try {
                const typesData = await trainingTypeService.getTrainingTypes();
                setTrainingTypes(typesData);
            } catch (error) {
                console.error("Ошибка загрузки типов тренировок:", error);
            } finally {
                setLoadingTrainingTypes(false);
            }
        };
        fetchTrainingTypes();
    }, []);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [parsedData, setParsedData] = useState<any>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        setError("");
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.json') && !file.name.toLowerCase().endsWith('.txt')) {
            setError("Выберите JSON или TXT файл");
            return;
        }

        setSelectedFile(file);
    };

    const parseFile = async () => {
        if (!selectedFile) {
            setError("Выберите файл");
            return;
        }

        setError("");

        try {
            const text = await selectedFile.text();
            const parsed = JSON.parse(text);
            setParsedData(parsed);
            setShowDataForm(true);
        } catch (err: any) {
            setError(`Ошибка при обработке файла: ${err.message}`);
        }
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.sport_id) {
            errors.sport_id = "Выберите вид спорта";
        }

        if (!formData.type_training_id) {
            errors.type_training_id = "Выберите тип тренировки";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = () => {
        if (!parsedData || !validateForm()) return;

        try {
            let date: string;
            if (parsedData.time_start) {
                date = parsedData.time_start.split('T')[0];
            } else if (parsedData.training_gps_hr_points && parsedData.training_gps_hr_points.length > 0) {
                const firstPoint = parsedData.training_gps_hr_points[0];
                date = firstPoint.duration_point ?
                    firstPoint.duration_point.split('T')[0] :
                    new Date().toISOString().split('T')[0];
            } else {
                date = new Date().toISOString().split('T')[0];
            }

            const startTime = parsedData.time_start ?
                parsedData.time_start.split('T')[1].substring(0, 8) :
                undefined;

            const distanceKm = parsedData.distance ?
                parseFloat((parsedData.distance / 1000).toFixed(2)) :
                undefined;

            const durationSec = parsedData.duration ?
                Math.round(parsedData.duration) :
                undefined;

            const avgPaceSecPerKm = parsedData.avg_speed ?
                calculatePaceFromSpeed(parsedData.avg_speed) :
                undefined;

            let gpsPoints: GpsPoint[] = [];

            if (parsedData.training_gps_hr_points && Array.isArray(parsedData.training_gps_hr_points)) {
                const maxPoints = 500;
                const step = Math.max(1, Math.floor(parsedData.training_gps_hr_points.length / maxPoints));

                parsedData.training_gps_hr_points.forEach((point: any, index: number) => {
                    if (index % step === 0 && point.latitude !== undefined && point.longitude !== undefined) {
                        let lat: number;
                        let lon: number;

                        if (isSemicircleCoordinate(point.latitude)) {
                            lat = semicirclesToDegrees(point.latitude);
                            lon = semicirclesToDegrees(point.longitude);
                        } else {
                            lat = point.latitude;
                            lon = point.longitude;
                        }

                        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                            gpsPoints.push({ lat, lon });
                        }
                    }
                });
            }

            if (parsedData.start_position_lat && parsedData.start_position_long && gpsPoints.length === 0) {
                let startLat: number;
                let startLon: number;

                if (isSemicircleCoordinate(parsedData.start_position_lat)) {
                    startLat = semicirclesToDegrees(parsedData.start_position_lat);
                    startLon = semicirclesToDegrees(parsedData.start_position_long);
                } else {
                    startLat = parsedData.start_position_lat;
                    startLon = parsedData.start_position_long;
                }

                gpsPoints.push({ lat: startLat, lon: startLon });
            }

            const selectedSport = sports.find(s => s.id.toString() === formData.sport_id);
            const selectedType = trainingTypes.find(t => t.id.toString() === formData.type_training_id);

            const payload: UploadParsedPayload = {
                date: date,
                status: "done",
                name: parsedData.name || "Импортированная тренировка",
                sport: selectedSport?.sport_name || formData.sport_id,
                typeTraining: selectedType?.type_training_name || formData.type_training_id,
                note: `Импортировано из файла ${selectedFile?.name}.${distanceKm ? ` Дистанция: ${distanceKm} км.` : ''}${durationSec ? ` Время: ${Math.floor(durationSec / 60)} мин.` : ''}${gpsPoints.length ? ` GPS точек: ${gpsPoints.length}.` : ''}${formData.comment_sportsmen ? `\n${formData.comment_sportsmen}` : ''}`,
                startTime: startTime,
                distanceKm: distanceKm,
                durationSec: durationSec,
                avgHr: parsedData.avg_heart_rate,
                avgPaceSecPerKm: avgPaceSecPerKm,
                elevationGainM: parsedData.total_ascent,
                elevationLossM: parsedData.total_descent,
                calories: parsedData.calories,
                gpsPoints: gpsPoints.length > 0 ? gpsPoints : undefined,
                isRace: false,
                isTest: false,

                comment_sportsmen: formData.comment_sportsmen || undefined,
                stress_score: formData.stress_score,
                feeling_score: formData.feeling_score || undefined,
                type_training_id: formData.type_training_id ? Number(formData.type_training_id) : undefined,
                name_training: formData.name_training || undefined,
                coach_creator: null,
                planned_training: false,
                sportsmen_id: parsedData.sportsmen_id,
                sport_id: formData.sport_id ? Number(formData.sport_id) : undefined,
            };

            onParsed(payload);
            onClose();
        } catch (err: any) {
            setError(`Ошибка при обработке данных: ${err.message}`);
        }
    };

    const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const feelingLabels = [
        { value: 1, label: "😫 Очень слабым" },
        { value: 2, label: "😔 Слабым" },
        { value: 3, label: "😐 Нормально" },
        { value: 4, label: "😊 Сильным" },
        { value: 5, label: "😁 Очень сильным" }
    ];

    if (loadingSports) {
        return (
            <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Загрузка...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (showDataForm && parsedData) {
        return (
            <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
                    <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                        <div className="modal-header" style={{
                            borderBottom: "1px solid #e9ecef",
                            padding: "1.5rem 1.5rem 1rem"
                        }}>
                            <h5 className="modal-title" style={{ fontSize: "1.25rem", fontWeight: 600 }}>Введите данные о занятии</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                        </div>

                        <div className="modal-body" style={{ padding: "1.5rem" }}>
                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="mb-4">
                                <div className="row g-3">
                                    <div className="col-md-12">
                                        <label className="form-label">
                                            Имя занятия
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name_training"
                                            value={formData.name_training}
                                            onChange={handleFormChange}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 12px",
                                                fontSize: "0.875rem"
                                            }}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">
                                            Тип тренировки*
                                        </label>
                                        <select
                                            name="type_training_id"
                                            value={formData.type_training_id}
                                            onChange={handleFormChange}
                                            className={`form-select ${formErrors.type_training_id ? "is-invalid" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 32px 10px 12px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                paddingRight: formErrors.type_training_id ? "50px" : "32px",
                                                height: "44px"
                                            }}
                                        >
                                            <option value="">Выберите тип тренировки</option>
                                            {trainingTypes.map((type) => (
                                                <option key={type.id} value={type.id}>
                                                    {type.type_training_name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.type_training_id && (
                                            <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                                                {formErrors.type_training_id}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">
                                            Вид спорта*
                                        </label>
                                        <select
                                            name="sport_id"
                                            value={formData.sport_id}
                                            onChange={handleFormChange}
                                            className={`form-select ${formErrors.sport_id ? "is-invalid" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 32px 10px 12px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                paddingRight: formErrors.sport_id ? "50px" : "32px",
                                                height: "44px"
                                            }}
                                        >
                                            <option value="">Выберите вид спорта</option>
                                            {sports.map((sport) => (
                                                <option key={sport.id} value={sport.id}>
                                                    {sport.sport_name}
                                                </option>
                                            ))}
                                        </select>
                                        {formErrors.sport_id && (
                                            <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                                                {formErrors.sport_id}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label">
                                            Воспринимаемые усилия
                                        </label>
                                        <div className="d-flex align-items-center">
                                            <input
                                                type="range"
                                                className="form-range"
                                                min="0"
                                                max="10"
                                                step="1"
                                                name="stress_score"
                                                value={formData.stress_score}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData(prev => ({ ...prev, stress_score: value }));
                                                    e.target.style.setProperty('--range-progress', `${(value / 10) * 100}%`);
                                                }}
                                                style={{
                                                    '--range-progress': `${(formData.stress_score / 10) * 100}%`
                                                } as React.CSSProperties}
                                            />
                                            <span className="ms-3 fw-bold" style={{ minWidth: "30px", textAlign: "center" }}>{formData.stress_score}</span>
                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label">
                                            Как вы себя чувствовали?
                                        </label>
                                        <div className="d-flex flex-wrap" style={{ gap: "0.5rem" }}>
                                            {feelingLabels.map(feeling => (
                                                <button
                                                    key={feeling.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            feeling_score: prev.feeling_score === feeling.value ? 0 : feeling.value
                                                        }));
                                                    }}
                                                    style={{
                                                        flex: "1 1 0",
                                                        minWidth: "0",
                                                        borderRadius: "8px",
                                                        padding: "10px 8px",
                                                        border: "1px solid #D1001C",
                                                        backgroundColor: formData.feeling_score === feeling.value ? "#D1001C" : "transparent",
                                                        color: formData.feeling_score === feeling.value ? "white" : "#D1001C",
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
                                        <label className="form-label">
                                            Примечания
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="comment_sportsmen"
                                            value={formData.comment_sportsmen}
                                            onChange={handleFormChange}
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
                        </div>

                        <div className="modal-footer" style={{
                            borderTop: "1px solid #e9ecef",
                            padding: "1rem 1.5rem"
                        }}>
                            <button
                                type="button"
                                onClick={() => setShowDataForm(false)}
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
                                Назад
                            </button>
                            <button
                                type="button"
                                onClick={handleFormSubmit}
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 20px",
                                    fontWeight: 600,
                                    backgroundColor: "#D1001C",
                                    border: "none",
                                    color: "white",
                                    cursor: "pointer"
                                }}
                            >
                                Сохранить занятие
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 8 }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Загрузить занятие</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        <div className="mb-3">
                            <input
                                className="form-control"
                                type="file"
                                accept=".json,.txt"
                                onChange={handleFileSelect}
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 12px"
                                }}
                            />
                            <div className="form-text mt-1">
                                Поддерживаются форматы: .fit, .tcx, .gpx
                            </div>
                        </div>
                        {error && <div className="text-danger mb-3">{error}</div>}
                    </div>

                    <div className="modal-footer">
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
                            onClick={parseFile}
                            disabled={!selectedFile}
                            style={{
                                borderRadius: "8px",
                                padding: "10px 20px",
                                fontWeight: 600,
                                backgroundColor: "#D1001C",
                                border: "none",
                                color: "white",
                                cursor: selectedFile ? "pointer" : "not-allowed",
                                opacity: selectedFile ? 1 : 0.65
                            }}
                        >
                            Далее
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadSessionModal;
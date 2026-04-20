import React, { useState, ChangeEvent, useEffect } from "react";
import { GpsPoint } from "../../pages/Athlete/CalendarPage";
import sportService from "../../api/sportService";
import trainingTypeService from "../../api/trainingTypeService";
import trainingService from "../../api/trainingService";
import authService from "../../api/authService";
import { TrainingType } from "../../models/trainingType";
import { useNavigate } from 'react-router-dom';

export type UploadParsedPayload = {
    id?: string;
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

    sportsman_id?: number;
    sport_id?: number;
    type_training?: number;
    name_training?: string;
    time_start?: string;
    local_timestamp?: string;
    duration?: number;
    distance?: number;
    avg_heart_rate?: number;
    min_heart_rate?: number;
    max_heart_rate?: number;
    avg_speed?: number;
    max_speed?: number;
    avg_running_cadence?: number;
    max_running_cadence?: number;
    avg_power?: number;
    max_power?: number;
    total_descent?: number;
    total_ascent?: number;
    start_position_lat?: number;
    start_position_long?: number;
    max_altitude?: number;
    is_gps?: boolean;
    stress_score?: number;
    feeling_score?: number;
    comment_sportsman?: string;
    coach_creator?: number | null;
    comment_coach?: string | null;
    status_training?: number;
    laps?: null;
    trackpoints?: null;
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
    const navigate = useNavigate();

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

    const [showDataForm, setShowDataForm] = useState(false);
    const [formData, setFormData] = useState({
        comment_sportsman: "",
        stress_score: 0,
        feeling_score: 0,
        type_training: "",
        name_training: "",
        sport_id: "",
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [parsedData, setParsedData] = useState<any>(null);

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        setError("");
        const file = e.target.files?.[0];
        if (!file) return;

        const allowedExtensions = ['.fit', '.tcx', '.gpx', '.json', '.txt'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!allowedExtensions.includes(fileExt)) {
            setError("Выберите файл формата .fit, .tcx, .gpx, .json или .txt");
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
            if (selectedFile.name.toLowerCase().endsWith('.json') || selectedFile.name.toLowerCase().endsWith('.txt')) {
                const text = await selectedFile.text();
                const parsed = JSON.parse(text);
                setParsedData(parsed);
            } else {
                setParsedData({
                    name: selectedFile.name.replace(/\.[^/.]+$/, ""),
                    time_start: new Date().toISOString(),
                    distance: 0,
                    duration: 0
                });
            }
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

        if (!formData.type_training) {
            errors.type_training = "Выберите тип тренировки";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFormSubmit = async () => {
        if (!parsedData || !validateForm()) return;

        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            setError("Ошибка авторизации. Пожалуйста, войдите снова.");
            return;
        }

        try {

            const startTimeRaw =
                parsedData.time_start ||
                parsedData.local_timestamp ||
                new Date().toISOString();

            const durationSec = parsedData.duration
                ? Math.round(parsedData.duration)
                : undefined;

            const distanceKm = parsedData.distance
                ? parseFloat((parsedData.distance / 1000).toFixed(2))
                : undefined;

            const avgPaceSecPerKm = parsedData.avg_speed
                ? calculatePaceFromSpeed(parsedData.avg_speed)
                : undefined;

            let gpsPoints: GpsPoint[] = [];

            if (parsedData.training_gps_hr_points && Array.isArray(parsedData.training_gps_hr_points)) {
                const maxPoints = 2000;

                if (parsedData.training_gps_hr_points.length <= maxPoints) {
                    parsedData.training_gps_hr_points.forEach((point: any, index: number) => {
                        if (point.latitude === undefined || point.longitude === undefined) return;

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
                    });
                } else {
                    const step = Math.floor(parsedData.training_gps_hr_points.length / maxPoints);
                    parsedData.training_gps_hr_points.forEach((point: any, index: number) => {
                        if (index % step !== 0) return;
                        if (point.latitude === undefined || point.longitude === undefined) return;

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
                    });
                }
            }

            const selectedSport = sports.find(
                s => s.id.toString() === formData.sport_id
            );

            const selectedType = trainingTypes.find(
                t => t.id.toString() === formData.type_training
            );

            const trainingData = {
                sportsman_id: currentUser.id,
                sport_id: Number(formData.sport_id),
                type_training_id: Number(formData.type_training),

                name_training: formData.name_training || parsedData.name || "Импортированная тренировка",

                time_start: startTimeRaw,
                local_timestamp: startTimeRaw,

                duration: durationSec || 0,
                distance: distanceKm ? distanceKm * 1000 : 0,

                avg_heart_rate: parsedData.avg_heart_rate || 0,
                min_heart_rate: parsedData.min_heart_rate || 0,
                max_heart_rate: parsedData.max_heart_rate || 0,

                avg_speed: parsedData.avg_speed || 0,
                max_speed: parsedData.max_speed || 0,

                avg_running_cadence: parsedData.avg_running_cadence || 0,
                max_running_cadence: parsedData.max_running_cadence || 0,

                avg_power: parsedData.avg_power || 0,
                max_power: parsedData.max_power || 0,

                total_descent: parsedData.total_descent || 0,
                total_ascent: parsedData.total_ascent || 0,

                start_position_lat: parsedData.start_position_lat || 0,
                start_position_long: parsedData.start_position_long || 0,

                max_altitude: parsedData.max_altitude || 0,

                calories: parsedData.calories || 0,

                is_gps: gpsPoints.length > 0,

                stress_score: formData.stress_score || 0,
                feeling_score: formData.feeling_score || 0,

                comment_sportsman: formData.comment_sportsman || "",

                coach_creator: null,
                comment_coach: null,

                status_training: 1,

                laps: null,
                trackpoints: null,

                heart_rates: parsedData.heart_rates || null,
                paces: parsedData.paces || null,
                altitudes: parsedData.altitudes || null
            };

            const uploadedTraining = await trainingService.uploadTraining(trainingData, selectedFile!);

            navigate(`/training/${uploadedTraining.id}`);

            const localTime = uploadedTraining.local_timestamp || uploadedTraining.time_start;
            const serverDate = localTime.split("T")[0];
            const serverStartTime = localTime.split("T")[1]?.substring(0, 5);
            const serverDistanceKm = uploadedTraining.distance ? parseFloat((uploadedTraining.distance / 1000).toFixed(2)) : undefined;
            const serverDurationSec = uploadedTraining.duration || undefined;

            const payload: UploadParsedPayload = {
                id: String(uploadedTraining.id),

                sportsman_id: currentUser.id,
                sport_id: Number(formData.sport_id),
                type_training: Number(formData.type_training),

                name_training:
                    formData.name_training ||
                    parsedData.name ||
                    "Импортированная тренировка",

                time_start: parsedData.time_start
                    ? new Date(parsedData.time_start).toISOString()
                    : new Date().toISOString(),

                local_timestamp: parsedData.time_start
                    ? parsedData.time_start
                    : new Date().toISOString(),

                duration: durationSec || 0,
                distance: distanceKm ? distanceKm * 1000 : 0,

                avg_heart_rate: parsedData.avg_heart_rate || 0,
                min_heart_rate: parsedData.min_heart_rate || 0,
                max_heart_rate: parsedData.max_heart_rate || 0,

                avg_speed: parsedData.avg_speed || 0,
                max_speed: parsedData.max_speed || 0,

                avg_running_cadence: parsedData.avg_running_cadence || 0,
                max_running_cadence: parsedData.max_running_cadence || 0,

                avg_power: parsedData.avg_power || 0,
                max_power: parsedData.max_power || 0,

                total_descent: parsedData.total_descent || 0,
                total_ascent: parsedData.total_ascent || 0,

                start_position_lat: parsedData.start_position_lat || 0,
                start_position_long: parsedData.start_position_long || 0,

                max_altitude: parsedData.max_altitude || 0,
                calories: parsedData.calories || 0,

                is_gps: gpsPoints.length > 0,

                stress_score: formData.stress_score || 0,
                feeling_score: formData.feeling_score || 0,

                comment_sportsman: formData.comment_sportsman || "",

                coach_creator: null,
                comment_coach: null,

                status_training: 1,

                laps: null,
                trackpoints: null,

                date: serverDate,
                status: "done",

                sport: selectedSport?.sport_name || formData.sport_id,
                typeTraining:
                    selectedType?.type_training_name || formData.type_training,

                note: formData.comment_sportsman || undefined,

                startTime: serverStartTime,
                distanceKm: serverDistanceKm,
                durationSec: serverDurationSec,

                avgHr: parsedData.avg_heart_rate,
                avgPaceSecPerKm: avgPaceSecPerKm,

                elevationGainM: parsedData.total_ascent,
                elevationLossM: parsedData.total_descent,

                gpsPoints: gpsPoints.length > 0 ? gpsPoints : undefined,
            };

            onParsed(payload);
            onClose();

        } catch (err: any) {

            console.error("Ошибка при отправке тренировки:", err);

            setError(
                `Ошибка при сохранении тренировки: ${
                    err.response?.data?.message || err.message
                }`
            );

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

    if (loadingSports || loadingTrainingTypes) {
        return (
            <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.35)" }}>
                <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                    <div className="modal-content" style={{ borderRadius: 16, border: "none" }}>
                        <div className="modal-body text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Загрузка...</span>
                            </div>
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
                                            placeholder="Например: Контрольный бег (3 км)"
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
                                            name="type_training"
                                            value={formData.type_training}
                                            onChange={handleFormChange}
                                            className={`form-select ${formErrors.type_training ? "is-invalid" : ""}`}
                                            style={{
                                                borderRadius: "8px",
                                                padding: "10px 32px 10px 12px",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                paddingRight: formErrors.type_training ? "50px" : "32px",
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
                                        {formErrors.type_training && (
                                            <div className="d-flex align-items-center text-danger mt-1" style={{ fontSize: "0.875rem" }}>
                                                {formErrors.type_training}
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
                                            Воспринимаемые усилия (1-10)
                                        </label>
                                        <div className="d-flex align-items-center">
                                            <input
                                                type="range"
                                                className="form-range"
                                                min="1"
                                                max="10"
                                                step="1"
                                                name="stress_score"
                                                value={formData.stress_score}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setFormData(prev => ({ ...prev, stress_score: value }));
                                                }}
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
                                            Комментарий
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="comment_sportsman"
                                            value={formData.comment_sportsman}
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
                                accept=".fit,.tcx,.gpx,.json,.txt"
                                onChange={handleFileSelect}
                                style={{
                                    borderRadius: "8px",
                                    padding: "10px 12px"
                                }}
                            />
                            <div className="form-text mt-1">
                                Поддерживаются форматы: .fit, .tcx, .gpx, .json, .txt
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
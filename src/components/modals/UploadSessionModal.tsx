import React, { useState, ChangeEvent } from "react";
import { GpsPoint } from "../../pages/Athlete/CalendarPage";

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
};

type Props = {
    onClose: () => void;
    onParsed: (data: UploadParsedPayload) => void;
};

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
    const [isRace, setIsRace] = useState(false);
    const [isTest, setIsTest] = useState(false);

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

    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Выберите файл");
            return;
        }

        setError("");

        try {
            const text = await selectedFile.text();
            const parsed = JSON.parse(text);

            let date: string;
            if (parsed.time_start) {
                date = parsed.time_start.split('T')[0];
            } else if (parsed.training_gps_hr_points && parsed.training_gps_hr_points.length > 0) {
                const firstPoint = parsed.training_gps_hr_points[0];
                date = firstPoint.duration_point ?
                    firstPoint.duration_point.split('T')[0] :
                    new Date().toISOString().split('T')[0];
            } else {
                date = new Date().toISOString().split('T')[0];
            }

            const startTime = parsed.time_start ?
                parsed.time_start.split('T')[1].substring(0, 8) :
                undefined;

            const distanceKm = parsed.distance ?
                parseFloat((parsed.distance / 1000).toFixed(2)) :
                undefined;

            const durationSec = parsed.duration ?
                Math.round(parsed.duration) :
                undefined;

            const avgPaceSecPerKm = parsed.avg_speed ?
                calculatePaceFromSpeed(parsed.avg_speed) :
                undefined;

            let gpsPoints: GpsPoint[] = [];

            if (parsed.training_gps_hr_points && Array.isArray(parsed.training_gps_hr_points)) {
                const maxPoints = 500;
                const step = Math.max(1, Math.floor(parsed.training_gps_hr_points.length / maxPoints));

                parsed.training_gps_hr_points.forEach((point: any, index: number) => {
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

            if (parsed.start_position_lat && parsed.start_position_long && gpsPoints.length === 0) {
                let startLat: number;
                let startLon: number;

                if (isSemicircleCoordinate(parsed.start_position_lat)) {
                    startLat = semicirclesToDegrees(parsed.start_position_lat);
                    startLon = semicirclesToDegrees(parsed.start_position_long);
                } else {
                    startLat = parsed.start_position_lat;
                    startLon = parsed.start_position_long;
                }

                gpsPoints.push({ lat: startLat, lon: startLon });
            }

            const payload: UploadParsedPayload = {
                date: date,
                status: "done",
                name: parsed.name || "Импортированная тренировка",
                sport: parsed.sport_id || "running",
                typeTraining: parsed.type_training_id ? String(parsed.type_training_id) : "1",
                note: `Импортировано из файла ${selectedFile.name}.${distanceKm ? ` Дистанция: ${distanceKm} км.` : ''}${durationSec ? ` Время: ${Math.floor(durationSec / 60)} мин.` : ''}${gpsPoints.length ? ` GPS точек: ${gpsPoints.length}.` : ''}`,
                startTime: startTime,
                distanceKm: distanceKm,
                durationSec: durationSec,
                avgHr: parsed.avg_heart_rate,
                avgPaceSecPerKm: avgPaceSecPerKm,
                elevationGainM: parsed.total_ascent,
                elevationLossM: parsed.total_descent,
                calories: parsed.calories,
                gpsPoints: gpsPoints.length > 0 ? gpsPoints : undefined,
                isRace: isRace,
                isTest: isTest,
            };

            onParsed(payload);
            onClose();
        } catch (err: any) {
            setError(`Ошибка при обработке файла: ${err.message}`);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 8 }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Загрузить тренировку</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        <div className="mb-3">
                            <input
                                className="form-control"
                                type="file"
                                accept=".json,.txt"
                                onChange={handleFileSelect}
                            />
                            <div className="form-text mt-1">
                                Поддерживаются форматы: .fit, .tcx, .gpx, .csv
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="d-flex gap-2 w-100">
                                <div
                                    onClick={() => setIsRace(!isRace)}
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "8px",
                                        fontSize: "0.875rem",
                                        fontWeight: isRace ? "500" : "400",
                                        backgroundColor: isRace ? "#D1001C" : "#f8f9fa",
                                        color: isRace ? "white" : "#495057",
                                        border: isRace ? "1px solid #D1001C" : "1px solid #ced4da",
                                        transition: "all 0.2s ease",
                                        userSelect: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flex: 1,
                                        height: "44px",
                                        padding: "0.5rem 0.75rem"
                                    }}
                                >
                                    <i
                                        className="bi bi-trophy me-1"
                                        style={{
                                            fontSize: "0.875rem",
                                            color: isRace ? "white" : "#D1001C"
                                        }}
                                    ></i>
                                    Гонка
                                </div>

                                <div
                                    onClick={() => setIsTest(!isTest)}
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "8px",
                                        fontSize: "0.875rem",
                                        fontWeight: isTest ? "500" : "400",
                                        backgroundColor: isTest ? "#D1001C" : "#f8f9fa",
                                        color: isTest ? "white" : "#495057",
                                        border: isTest ? "1px solid #D1001C" : "1px solid #ced4da",
                                        transition: "all 0.2s ease",
                                        userSelect: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flex: 1,
                                        height: "44px",
                                        padding: "0.5rem 0.75rem"
                                    }}
                                >
                                    <i
                                        className="bi bi-clipboard-data me-1"
                                        style={{
                                            fontSize: "0.875rem",
                                            color: isTest ? "white" : "#D1001C"
                                        }}
                                    ></i>
                                    Контрольная
                                </div>
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
                            onClick={handleUpload}
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
                            Загрузить тренировку
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadSessionModal;
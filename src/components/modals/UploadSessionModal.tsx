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

    // Секунд на км = 1000 / скорость_в_м/с
    const paceSecPerKm = 1000 / speedMps;
    return Math.round(paceSecPerKm);
};

const UploadSessionModal: React.FC<Props> = ({ onClose, onParsed }) => {
    const [error, setError] = useState<string>("");

    const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
        setError("");
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);

            let date: string;
            if (parsed.time_start) {
                date = parsed.time_start.split('T')[0];
                console.log("Дата из time_start:", date);
            } else if (parsed.training_gps_hr_points && parsed.training_gps_hr_points.length > 0) {
                // Берем дату из первой GPS точки
                const firstPoint = parsed.training_gps_hr_points[0];
                if (firstPoint.duration_point) {
                    date = firstPoint.duration_point.split('T')[0];
                    console.log("Дата из первой GPS точки:", date);
                } else {
                    date = new Date().toISOString().split('T')[0];
                    console.log("Используем сегодняшнюю дату");
                }
            } else {
                date = new Date().toISOString().split('T')[0];
                console.log("Используем сегодняшнюю дату (по умолчанию)");
            }

            // Время начала
            const startTime = parsed.time_start ?
                parsed.time_start.split('T')[1].substring(0, 8) :
                undefined;

            // Дистанция из метров в км
            const distanceKm = parsed.distance ?
                parseFloat((parsed.distance / 1000).toFixed(2)) :
                undefined;

            // Длительность в секундах
            const durationSec = parsed.duration ?
                Math.round(parsed.duration) :
                undefined;

            // Темп: скорость м/с -> сек/км
            const avgPaceSecPerKm = parsed.avg_speed ?
                calculatePaceFromSpeed(parsed.avg_speed) :
                undefined;

            // Выводим информацию о темпе для отладки
            if (parsed.avg_speed) {
                console.log(`Скорость: ${parsed.avg_speed} м/с`);
                console.log(`Темп: ${avgPaceSecPerKm} сек/км (${Math.floor(avgPaceSecPerKm! / 60)}:${String(avgPaceSecPerKm! % 60).padStart(2, '0')} мин/км)`);
            }

            // === ИЗВЛЕКАЕМ GPS ТОЧКИ ===
            let gpsPoints: GpsPoint[] = [];

            // 1. Проверяем массив training_gps_hr_points (основное место)
            if (parsed.training_gps_hr_points && Array.isArray(parsed.training_gps_hr_points)) {
                console.log(`Найдено тренировочных точек: ${parsed.training_gps_hr_points.length}`);

                // Ограничиваем количество точек для производительности (максимум 500)
                const maxPoints = 500;
                const step = Math.max(1, Math.floor(parsed.training_gps_hr_points.length / maxPoints));

                let processedCount = 0;
                parsed.training_gps_hr_points.forEach((point: any, index: number) => {
                    if (index % step === 0 && point.latitude !== undefined && point.longitude !== undefined) {
                        let lat: number;
                        let lon: number;

                        // Проверяем формат координат и конвертируем если нужно
                        if (isSemicircleCoordinate(point.latitude)) {
                            lat = semicirclesToDegrees(point.latitude);
                            lon = semicirclesToDegrees(point.longitude);
                        } else {
                            // Предполагаем, что координаты уже в градусах
                            lat = point.latitude;
                            lon = point.longitude;
                        }

                        // Проверяем валидность координат
                        if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                            gpsPoints.push({ lat, lon });
                            processedCount++;

                            // Выводим первые 3 точки для отладки
                            if (processedCount <= 3) {
                                console.log(`Точка ${processedCount}:`);
                                console.log(`  Исходные: lat=${point.latitude}, lon=${point.longitude}`);
                                console.log(`  Используемые: lat=${lat.toFixed(6)}, lon=${lon.toFixed(6)}`);
                            }
                        }
                    }
                });

                console.log(`Извлечено GPS точек: ${gpsPoints.length} (шаг ${step})`);
            } else {
                console.log("Нет массива training_gps_hr_points в JSON");
            }

            // 2. Добавляем стартовую позицию, если есть
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

                console.log(`Стартовая позиция: ${startLat.toFixed(6)}, ${startLon.toFixed(6)}`);

                gpsPoints.push({ lat: startLat, lon: startLon });
            }

            // Выводим итоговую информацию о GPS точках
            console.log(`Итого GPS точек: ${gpsPoints.length}`);
            if (gpsPoints.length > 0) {
                console.log(`Первая точка: lat=${gpsPoints[0].lat.toFixed(6)}, lon=${gpsPoints[0].lon.toFixed(6)}`);
                console.log(`Последняя точка: lat=${gpsPoints[gpsPoints.length-1].lat.toFixed(6)}, lon=${gpsPoints[gpsPoints.length-1].lon.toFixed(6)}`);
            }

            // Создаем payload
            const payload: UploadParsedPayload = {
                date: date,
                status: "done",
                name: parsed.name || "Импортированная тренировка",
                sport: parsed.sport_id || "running",
                typeTraining: parsed.type_training_id ? String(parsed.type_training_id) : "1",
                note: `Импортировано из файла ${file.name}.${distanceKm ? ` Дистанция: ${distanceKm} км.` : ''}${durationSec ? ` Время: ${Math.floor(durationSec / 60)} мин.` : ''}${gpsPoints.length ? ` GPS точек: ${gpsPoints.length}.` : ''}`,
                startTime: startTime,
                distanceKm: distanceKm,
                durationSec: durationSec,
                avgHr: parsed.avg_heart_rate,
                avgPaceSecPerKm: avgPaceSecPerKm,
                elevationGainM: parsed.total_ascent,
                elevationLossM: parsed.total_descent,
                calories: parsed.calories,
                gpsPoints: gpsPoints.length > 0 ? gpsPoints : undefined,
            };

            console.log("Финальный payload:", payload);
            console.log("=== КОНЕЦ ПАРСИНГА ===");

            onParsed(payload);
            onClose();
        } catch (err: any) {
            console.error("Ошибка при обработке файла:", err);
            console.error("Стек ошибки:", err.stack);
            setError(`Ошибка при обработке файла: ${err.message}`);
        }
    };

    return (
        <div className="modal d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(0,0,0,0.35)" }}>
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content" style={{ borderRadius: 16 }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Загрузить занятие</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
                    </div>

                    <div className="modal-body">
                        <div className="text-muted mb-2">
                            Загрузите JSON файл с данными тренировки. Поддерживаются файлы с GPS точками в массиве training_gps_hr_points.
                        </div>

                        <input
                            className="form-control"
                            type="file"
                            accept=".json,.txt"
                            onChange={handleFile}
                        />

                        {error && <div className="text-danger mt-2">{error}</div>}

                        <div className="mt-3 small text-muted">
                            <strong>Для отладки:</strong> Откройте консоль браузера (F12 → Console) чтобы увидеть детали обработки файла.
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadSessionModal;
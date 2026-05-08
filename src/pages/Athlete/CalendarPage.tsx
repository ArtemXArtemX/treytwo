import React, { useMemo, useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/fullcalendar.css";

import Header from "../../components/Header";
import TrainingDetailsModal from "../../components/modals/TrainingDetailsModal";
import CreateSessionModal, { CreateSessionPayload } from "../../components/modals/CreateSessionModal";
import UploadSessionModal, { UploadParsedPayload } from "../../components/modals/UploadSessionModal";
import PlanTrainingModal from "../../components/modals/PlanSessionModal";
import authService from "../../api/authService";
import trainingService from "../../api/trainingService";

import MarkAsCompleteModal from '../../components/modals/MarkAsCompleteModal';
import PlannedTrainingsList from '../../components/PlannedTrainingsList';

export type TrainingStatus = "planned" | "done";

export type GpsPoint = { lat: number; lon: number };

export type TrainingEvent = {
    id: string;
    date: string;
    status: TrainingStatus;
    name?: string;
    sport?: number;
    typeTraining?: number;
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

    avg_speed?: number | null;
    max_speed?: number | null;
    max_heart_rate?: number | null;
    min_heart_rate?: number | null;
    max_altitude?: number | null;
    avg_power?: number | null;
    max_power?: number | null;
    stress_score?: number | null;
    feeling_score?: number | null;
};

const toYmdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const formatHms = (totalSec: number) => {
    const s = Math.max(0, Math.floor(totalSec));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
};

const formatPace = (paceSecPerKm: number) => {
    const s = Math.max(0, Math.floor(paceSecPerKm));
    const mm = Math.floor(s / 60);
    const ss = s % 60;
    return `${mm}:${String(ss).padStart(2, "0")} /км`;
};

const AthleteCalendarPage: React.FC = () => {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [view, setView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
    const [title, setTitle] = useState<string>("");
    const [trainings, setTrainings] = useState<TrainingEvent[]>([]);
    const [createOpen, setCreateOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [selectedTraining, setSelectedTraining] = useState<TrainingEvent | null>(null);
    const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPlannedTraining, setSelectedPlannedTraining] = useState<TrainingEvent | null>(null);
    const [showPlannedList, setShowPlannedList] = useState(false);
    const [completeMode, setCompleteMode] = useState<'withFile' | 'withoutFile' | null>(null);

    const handleCompletePlannedTraining = async () => {
        if (!selectedPlannedTraining) return;

        try {
            const updatedTrainingData = await trainingService.getTrainingMid(Number(selectedPlannedTraining.id));

            const updatedTraining: TrainingEvent = {
                id: String(updatedTrainingData.id),
                date: updatedTrainingData.time_start.split('T')[0],
                status: "done",
                name: updatedTrainingData.name_training || selectedPlannedTraining.name,
                sport: updatedTrainingData.sport_id,
                typeTraining: updatedTrainingData.type_training_id,
                note: updatedTrainingData.comment_sportsman || undefined,
                startTime: updatedTrainingData.time_start.split('T')[1]?.substring(0, 5),
                distanceKm: updatedTrainingData.distance ? updatedTrainingData.distance / 1000 : selectedPlannedTraining.distanceKm,
                durationSec: updatedTrainingData.duration || selectedPlannedTraining.durationSec,
                avgHr: updatedTrainingData.avg_heart_rate || undefined,
                avgPaceSecPerKm: updatedTrainingData.avg_speed ? Math.round(1000 / updatedTrainingData.avg_speed) : undefined,
                avg_speed: updatedTrainingData.avg_speed,
                max_speed: updatedTrainingData.max_speed,
                max_heart_rate: updatedTrainingData.max_heart_rate,
                min_heart_rate: updatedTrainingData.min_heart_rate,
                max_altitude: updatedTrainingData.max_altitude,
                avg_power: updatedTrainingData.avg_power,
                max_power: updatedTrainingData.max_power,
                elevationGainM: updatedTrainingData.total_ascent || undefined,
                elevationLossM: updatedTrainingData.total_descent || undefined,
                calories: updatedTrainingData.calories || undefined,
            };

            setTrainings(prev => prev.map(t =>
                t.id === selectedPlannedTraining.id ? updatedTraining : t
            ));

            setSelectedPlannedTraining(null);
        } catch (error) {
            console.error("Ошибка обновления тренировки:", error);
        }
    };

    const [reportData, setReportData] = useState({
        total_trainings: 0,
        total_duration: 0,
        total_distance: 0,
        total_calories: 0
    });

    useEffect(() => {
        const fetchTrainingsForPeriod = async () => {
            if (!currentDateRange) return;

            const currentUser = authService.getCurrentUser();
            if (!currentUser) return;

            setIsLoading(true);
            try {
                const startStr = currentDateRange.start.toISOString();
                const endStr = currentDateRange.end.toISOString();

                const response = await trainingService.getTrainings(
                    currentUser.id,
                    startStr,
                    endStr
                );

                setReportData(response.report || {
                    total_trainings: 0,
                    total_duration: 0,
                    total_distance: 0,
                    total_calories: 0
                });

                const trainingsData = response.trainings || [];
                const fetchedTrainings: TrainingEvent[] = trainingsData.map((item: any) => {
                    let date = '';
                    let startTime = undefined;

                    if (item.time_start) {
                        const [datePart, timePart] = item.time_start.split('T');
                        date = datePart;
                        if (timePart) {
                            startTime = timePart.substring(0, 5);
                        }
                    } else if (item.local_timestamp) {
                        const [datePart, timePart] = item.local_timestamp.split('T');
                        date = datePart;
                        if (timePart) {
                            startTime = timePart.substring(0, 5);
                        }
                    }

                    return {
                        id: String(item.id),
                        date: date,
                        status: String(item.status_training) === "Завершено" ? "done" : "planned",
                        name: item.name_training || "Тренировка",
                        sport: item.sport_id,
                        typeTraining: item.type_training_id,
                        note: item.comment_sportsman || undefined,
                        startTime: startTime,
                        distanceKm: item.distance ? parseFloat((item.distance / 1000).toFixed(2)) : undefined,
                        durationSec: item.duration || undefined,
                        avgHr: item.avg_heart_rate || undefined,
                        avgPaceSecPerKm: item.avg_speed ? Math.round(1000 / item.avg_speed) : undefined,
                        avg_speed: item.avg_speed,
                        max_speed: item.max_speed,
                        max_heart_rate: item.max_heart_rate,
                        min_heart_rate: item.min_heart_rate,
                        max_altitude: item.max_altitude,
                        avg_power: item.avg_power,
                        max_power: item.max_power,
                        elevationGainM: item.total_ascent || undefined,
                        elevationLossM: item.total_descent || undefined,
                        calories: item.calories || undefined,
                    };
                });

                setTrainings(fetchedTrainings);
            } catch (error) {
                console.error("Ошибка загрузки тренировок за период:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (currentDateRange) {
            fetchTrainingsForPeriod();
        }
    }, [currentDateRange]);

    const trainingsByDate = useMemo(() => {
        const map = new Map<string, TrainingEvent[]>();
        trainings.forEach((t) => {
            const key = t.date;
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(t);
        });
        map.forEach((trainingsList) => {
            trainingsList.sort((a, b) => {
                return (a.startTime || "").localeCompare(b.startTime || "");
            });
        });
        return map;
    }, [trainings]);

    const statsData = useMemo(() => {
        if (!currentDateRange) return {
            totalTrainings: 0,
            totalDistance: 0,
            totalTime: 0,
            totalCalories: 0
        };

        return {
            totalTrainings: reportData.total_trainings,
            totalDistance: reportData.total_distance / 1000,
            totalTime: reportData.total_duration,
            totalCalories: reportData.total_calories
        };
    }, [reportData, currentDateRange]);

    const goPrev = () => calendarRef.current?.getApi().prev();
    const goNext = () => calendarRef.current?.getApi().next();

    const onCreateSubmit = (payload: CreateSessionPayload) => {
        const newTraining: TrainingEvent = {
            id: crypto.randomUUID(),
            date: payload.date,
            status: "done",
            name: payload.name,
            sport: Number(payload.sport),
            typeTraining: Number(payload.typeTraining),
            note: payload.note,
            startTime: payload.startTime,
            distanceKm: payload.distanceKm,
            durationSec: payload.durationSec,
            avgHr: payload.avgHr,
            avgPaceSecPerKm: typeof payload.avgPaceSecPerKm === "number"
                ? payload.avgPaceSecPerKm
                : payload.distanceKm && payload.durationSec
                    ? (payload.durationSec / payload.distanceKm)
                    : undefined,
            elevationGainM: payload.elevationGainM,
            elevationLossM: payload.elevationLossM,
            calories: payload.calories,
        };
        setTrainings((prev) => [...prev, newTraining]);
        setCreateOpen(false);
    };

    const onUploadParsed = (parsed: UploadParsedPayload) => {
        const newTraining: TrainingEvent = {
            id: crypto.randomUUID(),
            date: parsed.date,
            status: String(parsed.status_training) === "Завершено" ? "done" : "planned",
            name: parsed.name_training,
            sport: Number(parsed.sport),
            typeTraining: Number(parsed.typeTraining),
            note: parsed.note,
            startTime: parsed.startTime,
            distanceKm: parsed.distanceKm,
            durationSec: parsed.durationSec,
            avgHr: parsed.avgHr,
            avgPaceSecPerKm: parsed.avgPaceSecPerKm,
            elevationGainM: parsed.elevationGainM,
            elevationLossM: parsed.elevationLossM,
            calories: parsed.calories,
            gpsPoints: parsed.gpsPoints,

            avg_speed: parsed.avg_speed,
            max_speed: parsed.max_speed,
            max_heart_rate: parsed.max_heart_rate,
            min_heart_rate: parsed.min_heart_rate,
            max_altitude: parsed.max_altitude,
            avg_power: parsed.avg_power,
            max_power: parsed.max_power,
        };
        setTrainings((prev) => [...prev, newTraining]);
        setUploadOpen(false);
    };

    const onPlanSubmit = (payload: any) => {
        const newTraining: TrainingEvent = {
            id: crypto.randomUUID(),
            date: payload.date,
            status: "planned",
            name: payload.name,
            sport: payload.sport_id,
            typeTraining: payload.type_training_id,
            note: payload.note,
            startTime: payload.startTime,
            distanceKm: payload.distanceKm,
            durationSec: payload.durationSec
        };
        setTrainings((prev) => [...prev, newTraining]);
        setPlanOpen(false);
    };
    const [planOpen, setPlanOpen] = useState(false);

    const handleTrainingClick = async (training: TrainingEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        try {
            const midData = await trainingService.getTrainingMid(Number(training.id));

            const updatedTraining: TrainingEvent = {
                id: training.id,
                date: training.date,
                status: String(midData.status_training) === "Завершено" ? "done" : "planned",
                name: midData.name_training || training.name,
                sport: midData.sport_id,
                typeTraining: midData.type_training_id,
                note: midData.comment_sportsman || undefined,
                startTime: training.startTime,
                distanceKm: midData.distance ? midData.distance / 1000 : training.distanceKm,
                durationSec: midData.duration || training.durationSec,
                avgHr: midData.avg_heart_rate || undefined,
                avgPaceSecPerKm: midData.avg_speed ? Math.round(1000 / midData.avg_speed) : undefined,
                avg_speed: midData.avg_speed,
                max_speed: midData.max_speed,
                max_heart_rate: midData.max_heart_rate,
                min_heart_rate: midData.min_heart_rate,
                max_altitude: midData.max_altitude,
                avg_power: midData.avg_power,
                max_power: midData.max_power,
                elevationGainM: midData.total_ascent || undefined,
                elevationLossM: midData.total_descent || undefined,
                calories: midData.calories || undefined,
                gpsPoints: midData.trackpoints?.map(tp => ({
                    lat: tp.latitude,
                    lon: tp.longitude
                })) || []
            };

            setTrainings(prev => prev.map(t =>
                t.id === training.id ? updatedTraining : t
            ));

            setSelectedTraining(updatedTraining);
        } catch (error) {
            console.error("Ошибка загрузки деталей тренировки:", error);
            setSelectedTraining(training);
        }
    };

    const onDatesSet = (arg: any) => {
        setTitle(arg.view.title);
        setCurrentDateRange({
            start: arg.view.currentStart,
            end: arg.view.currentEnd
        });
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--trey-bg)" as any }}>
            <Header/>
            <main style={{ flex: 1 }}>
                <div className="container py-4">
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
                        <div>
                            <div className="trey-page-title" style={{ fontSize: 34 }}>Календарь тренировок</div>
                        </div>
                        <div className="d-flex gap-2">
                            <div className="dropdown">
                                <button
                                    className="btn dropdown-toggle"
                                    type="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    style={{
                                        backgroundColor: "#D1001C",
                                        color: "white",
                                        borderRadius: 12,
                                        padding: "10px 16px",
                                        fontWeight: 700,
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px"
                                    }}
                                >
                                    Создать занятие
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end" style={{
                                    borderRadius: 12,
                                    border: "1px solid #e7eaf0",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    padding: "8px 0",
                                    minWidth: "200px"
                                }}>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => {
                                                setShowPlannedList(true);
                                            }}
                                            style={{
                                                padding: "10px 20px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                                                e.currentTarget.style.color = "#D1001C";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.color = "#333";
                                            }}
                                        >
                                            Отметить выполнение запланированного занятия
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => setCreateOpen(true)}
                                            style={{
                                                padding: "10px 20px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                                                e.currentTarget.style.color = "#D1001C";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.color = "#333";
                                            }}
                                        >
                                            Новое занятие
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            className="dropdown-item"
                                            onClick={() => setPlanOpen(true)}
                                            style={{
                                                padding: "10px 20px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px"
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                                                e.currentTarget.style.color = "#D1001C";
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = "transparent";
                                                e.currentTarget.style.color = "#333";
                                            }}
                                        >
                                            Запланировать занятие
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            <button
                                className="btn border border-secondary text-secondary"
                                style={{
                                    borderRadius: 12,
                                    padding: "10px 14px",
                                    fontWeight: 700,
                                    backgroundColor: 'transparent'
                                }}
                                type="button"
                                onClick={() => setUploadOpen(true)}
                                aria-label="Загрузить занятие"
                                title="Загрузить занятие"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: "block" }}>
                                    <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M7 9l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="trey-calendar-card p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center gap-2 trey-legend">
                                        <span className="trey-legend-color trey-legend-color--planned"/>
                                        <span>Запланировано</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 trey-legend">
                                        <span className="trey-legend-color trey-legend-color--done"/>
                                        <span>Выполнено</span>
                                    </div>
                                </div>
                            </div>
                            <div className="trey-segment" role="tablist" aria-label="Переключение вида">
                                <button type="button" className={view === "dayGridMonth" ? "active" : ""} onClick={() => { setView("dayGridMonth"); calendarRef.current?.getApi().changeView("dayGridMonth"); }}>Месяц</button>
                                <button type="button" className={view === "dayGridWeek" ? "active" : ""} onClick={() => { setView("dayGridWeek"); calendarRef.current?.getApi().changeView("dayGridWeek"); }}>Неделя</button>
                            </div>
                        </div>
                        <div className="trey-cal-header">
                            <div className="trey-cal-header__left">
                                <button className="trey-arrow" type="button" onClick={goPrev} aria-label="Предыдущий период">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                <button className="trey-arrow" type="button" onClick={goNext} aria-label="Следующий период">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="trey-cal-header__center">{title}</div>
                            <div className="trey-cal-header__right" />
                        </div>
                        <FullCalendar
                            ref={calendarRef}
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView={view}
                            locale="ru"
                            timeZone="local"
                            firstDay={1}
                            height="auto"
                            contentHeight="auto"
                            headerToolbar={false}
                            datesSet={onDatesSet}
                            fixedWeekCount={false}
                            selectable={false}
                            dayMaxEvents={0}
                            displayEventTime={false}
                            dateClick={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const dayTrainings = trainingsByDate.get(key);
                                if (dayTrainings && dayTrainings.length === 1) {
                                    setSelectedTraining(dayTrainings[0]);
                                }
                            }}
                            dayCellContent={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const dayTrainings = trainingsByDate.get(key);
                                return (
                                    <div className="trey-daycell">
                                        <div className={`trey-daynum ${arg.isOther ? "trey-daynum--other" : ""}`}>{arg.dayNumberText}</div>
                                        {dayTrainings && dayTrainings.length > 0 && (
                                            <div className="trey-training-blocks">
                                                {dayTrainings.map((training) => {
                                                    const name = training.name || "Тренировка";
                                                    const nameLength = name.length;
                                                    const shouldMoveDistance = nameLength > 15;

                                                    return (
                                                        <div
                                                            key={training.id}
                                                            className={`trey-training-block ${training.status === "done" ? "trey-training-block--done" : "trey-training-block--planned"}`}
                                                            onClick={(e) => handleTrainingClick(training, e)}
                                                            style={{
                                                                cursor: 'pointer',
                                                                marginBottom: '4px',
                                                                padding: '6px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                                lineHeight: '1.4',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <div className="trey-training-block-title" style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                marginBottom: shouldMoveDistance || training.durationSec ? '4px' : '0'
                                                            }}>
                                                                <span style={{
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    flex: 1,
                                                                    marginRight: '8px'
                                                                }}>
                                                                    {name}
                                                                </span>
                                                                {training.distanceKm && !shouldMoveDistance && (
                                                                    <span className="trey-training-block-distance" style={{
                                                                        whiteSpace: 'nowrap',
                                                                        background: 'rgba(255, 255, 255, 0.2)',
                                                                        padding: '2px 6px',
                                                                        borderRadius: '3px',
                                                                        fontWeight: '600',
                                                                        fontSize: '11px'
                                                                    }}>
                                                                        {training.distanceKm.toFixed(2)} км
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {(shouldMoveDistance || training.durationSec) && (
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '8px'
                                                                }}>
                                                                    {shouldMoveDistance && training.distanceKm && (
                                                                        <span className="trey-training-block-distance" style={{
                                                                            whiteSpace: 'nowrap',
                                                                            background: 'rgba(255, 255, 255, 0.2)',
                                                                            padding: '2px 6px',
                                                                            borderRadius: '3px',
                                                                            fontWeight: '600',
                                                                            fontSize: '11px'
                                                                        }}>
                                                                            {training.distanceKm.toFixed(2)} км
                                                                        </span>
                                                                    )}
                                                                    {training.durationSec && (
                                                                        <span className="trey-training-block-time" style={{
                                                                            whiteSpace: 'nowrap',
                                                                            fontSize: '11px',
                                                                            opacity: '0.9'
                                                                        }}>
                                                                            {formatHms(training.durationSec)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                        <div className="trey-calendar-stats mt-4 pt-3 border-top">
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{statsData.totalTrainings}</div>
                                        <div className="text-muted small">Занятий</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{statsData.totalDistance.toFixed(2)}</div>
                                        <div className="text-muted small">км</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{formatHms(statsData.totalTime)}</div>
                                        <div className="text-muted small">Время</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{statsData.totalCalories}</div>
                                        <div className="text-muted small">ккал</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {createOpen && (<CreateSessionModal onClose={() => setCreateOpen(false)} onSubmit={onCreateSubmit} />)}
            {uploadOpen && (<UploadSessionModal onClose={() => setUploadOpen(false)} onParsed={onUploadParsed} />)}
            {planOpen && (<PlanTrainingModal onClose={() => setPlanOpen(false)} onSubmit={onPlanSubmit} />)}
            {selectedTraining && (<TrainingDetailsModal training={selectedTraining} onClose={() => setSelectedTraining(null)} formatHms={formatHms} formatPace={formatPace} />)}
            {/* Список запланированных тренировок */}
            {showPlannedList && (
                <PlannedTrainingsList
                    trainings={trainings.filter(t => t.status === "planned")}
                    onSelect={(training) => {
                        setSelectedPlannedTraining(training);
                        setShowPlannedList(false);
                    }}
                    onClose={() => setShowPlannedList(false)}
                />
            )}

            {selectedPlannedTraining && !completeMode && (
                <MarkAsCompleteModal
                    training={selectedPlannedTraining}
                    onClose={() => setSelectedPlannedTraining(null)}
                    onComplete={async () => {
                        await handleCompletePlannedTraining();
                        setCompleteMode(null);
                        setSelectedPlannedTraining(null);
                    }}
                />
            )}
        </div>
    );
};

export default AthleteCalendarPage;
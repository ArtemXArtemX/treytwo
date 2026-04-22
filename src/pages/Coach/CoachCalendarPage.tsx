import React, { useMemo, useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/fullcalendar.css";

import Header from "../../components/Header";
import TrainingDetailsModal from "../../components/modals/TrainingDetailsModal";
import PlanTrainingModal from "../../components/modals/PlanSessionModal";
import authService from "../../api/authService";
import trainingService from "../../api/trainingService";

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

interface Athlete {
    id: number;
    surname: string;
    name: string;
    fathername?: string;
    nickname: string;
}

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

const CoachCalendarPage: React.FC = () => {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [view, setView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
    const [title, setTitle] = useState<string>("");
    const [trainings, setTrainings] = useState<TrainingEvent[]>([]);
    const [selectedTraining, setSelectedTraining] = useState<TrainingEvent | null>(null);
    const [currentDateRange, setCurrentDateRange] = useState<{ start: Date; end: Date } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [planOpen, setPlanOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [athletes, setAthletes] = useState<Athlete[]>([
        { id: 1, surname: "Татарников", name: "Артём", fathername: "Павлович", nickname: "tematrkv" },
        { id: 2, surname: "Иванов", name: "Иван", fathername: "Иванович", nickname: "ivan_runner" },
        { id: 3, surname: "Петрова", name: "Анна", fathername: "Сергеевна", nickname: "anna_run" },
    ]);
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(athletes[0]);

    useEffect(() => {
        const fetchAthleteTrainings = async () => {
            if (!selectedAthlete) return;

            setIsLoading(true);
            try {
                const startDate = "2000-01-01";
                const endDate = "2100-01-01";

                const response = await trainingService.getTrainings(
                    selectedAthlete.id,
                    startDate,
                    endDate
                );

                const fetchedTrainings: TrainingEvent[] = response.map((item) => {
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
                console.error("Ошибка загрузки тренировок спортсмена:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAthleteTrainings();
    }, [selectedAthlete]);

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

    const goPrev = () => calendarRef.current?.getApi().prev();
    const goNext = () => calendarRef.current?.getApi().next();

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
        };
        setTrainings((prev) => [...prev, newTraining]);
        setPlanOpen(false);
    };

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

    const stats = useMemo(() => {
        if (!currentDateRange) return {
            totalTrainings: 0,
            totalDistance: 0,
            totalTime: 0,
            totalCalories: 0
        };

        const { start, end } = currentDateRange;
        const filteredTrainings = trainings.filter(training => {
            const trainingDate = new Date(training.date);
            return trainingDate >= start && trainingDate < end;
        });

        const stats = {
            totalTrainings: 0,
            totalDistance: 0,
            totalTime: 0,
            totalCalories: 0
        };

        filteredTrainings.forEach(training => {
            stats.totalTrainings++;
            if (training.distanceKm) stats.totalDistance += training.distanceKm;
            if (training.durationSec) stats.totalTime += training.durationSec;
            if (training.calories) stats.totalCalories += training.calories;
        });

        return stats;
    }, [trainings, currentDateRange]);

    const getFullName = (athlete: Athlete) => {
        return `${athlete.surname} ${athlete.name} ${athlete.fathername || ''}`.trim();
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f5f7fa" }}>
            <Header active="calendar" />
            <main style={{ flex: 1, position: "relative" }}>
                <div className="container py-4">
                    {/* Кнопка открытия панели */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        style={{
                            position: "fixed",
                            left: 20,
                            top: "50%",
                            transform: "translateY(-50%)",
                            zIndex: 1000,
                            background: "#D1001C",
                            border: "none",
                            borderRadius: "0 12px 12px 0",
                            padding: "12px 8px",
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12h18M3 6h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>

                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: "300px",
                        background: "white",
                        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
                        transition: "transform 0.3s ease",
                        zIndex: 1050,
                        boxShadow: "2px 0 12px rgba(0,0,0,0.1)",
                        display: "flex",
                        flexDirection: "column"
                    }}>
                        <div style={{
                            padding: "20px 16px",
                            borderBottom: "1px solid #e7eaf0",
                            background: "#f8f9fa",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h5 style={{ margin: 0, fontWeight: 600, color: "#1a1a1a" }}>Мои спортсмены</h5>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    fontSize: "24px",
                                    cursor: "pointer",
                                    color: "#666",
                                    padding: "0 8px"
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                            {athletes.map(athlete => (
                                <div
                                    key={athlete.id}
                                    onClick={() => {
                                        setSelectedAthlete(athlete);
                                        setDrawerOpen(false);
                                    }}
                                    style={{
                                        padding: "14px 16px",
                                        cursor: "pointer",
                                        background: selectedAthlete?.id === athlete.id ? "#f0f2f5" : "white",
                                        borderBottom: "1px solid #e7eaf0",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedAthlete?.id !== athlete.id) {
                                            e.currentTarget.style.background = "#f8f9fa";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedAthlete?.id !== athlete.id) {
                                            e.currentTarget.style.background = "white";
                                        }
                                    }}
                                >
                                    <div style={{ fontWeight: 600, color: "#1a1a1a", marginBottom: "4px" }}>
                                        {getFullName(athlete)}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>
                                        @{athlete.nickname}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {drawerOpen && (
                        <div
                            onClick={() => setDrawerOpen(false)}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: "rgba(0,0,0,0.3)",
                                zIndex: 1040
                            }}
                        />
                    )}
                    
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
                        <div className="trey-page-title" style={{ fontSize: 34 }}>Календарь тренировок</div>
                        <button
                            className="btn"
                            onClick={() => setPlanOpen(true)}
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
                            Запланировать занятие
                        </button>
                    </div>

                    {selectedAthlete && (
                        <div style={{ marginBottom: "16px", color: "#666", fontSize: "14px" }}>
                            Спортсмен: <strong>{getFullName(selectedAthlete)}</strong> (@{selectedAthlete.nickname})
                        </div>
                    )}

                    <div className="trey-calendar-card p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
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
                                        <div className="fs-5 fw-bold">{stats.totalTrainings}</div>
                                        <div className="text-muted small">Занятий</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{stats.totalDistance.toFixed(1)}</div>
                                        <div className="text-muted small">км</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{formatHms(stats.totalTime)}</div>
                                        <div className="text-muted small">Время</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className="text-center">
                                        <div className="fs-5 fw-bold">{stats.totalCalories}</div>
                                        <div className="text-muted small">ккал</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            {planOpen && (<PlanTrainingModal onClose={() => setPlanOpen(false)} onSubmit={onPlanSubmit} />)}
            {selectedTraining && (<TrainingDetailsModal training={selectedTraining} onClose={() => setSelectedTraining(null)} formatHms={formatHms} formatPace={formatPace} />)}
        </div>
    );
};

export default CoachCalendarPage;
import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/fullcalendar.css";

import Header from "../../components/Header";
import TrainingDetailsModal from "../../components/modals/TrainingDetailsModal";
import CreateSessionModal, { CreateSessionPayload } from "../../components/modals/CreateSessionModal";
import UploadSessionModal, { UploadParsedPayload } from "../../components/modals/UploadSessionModal";

export type TrainingStatus = "planned" | "done";

export type GpsPoint = { lat: number; lon: number };

export type TrainingEvent = {
    id: string;
    date: string;
    status: TrainingStatus;

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

    const [trainings, setTrainings] = useState<TrainingEvent[]>([
        { id: "t1", date: "2026-01-07", status: "planned", name: "Интервалы", distanceKm: 8, durationSec: 3200 },
        { id: "t2", date: "2026-01-09", status: "done", name: "Темповая", distanceKm: 10, durationSec: 3600 },
    ]);

    const [createOpen, setCreateOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);

    const [selectedTraining, setSelectedTraining] = useState<TrainingEvent | null>(null);

    const statusByDate = useMemo(() => {
        const map = new Map<string, TrainingStatus>();
        trainings.forEach((t) => {
            const prev = map.get(t.date);
            if (!prev) map.set(t.date, t.status);
            else if (prev !== "done" && t.status === "done") map.set(t.date, "done");
        });
        return map;
    }, [trainings]);

    const trainingByDate = useMemo(() => {
        const map = new Map<string, TrainingEvent>();
        trainings.forEach((t) => {
            const prev = map.get(t.date);
            if (!prev) map.set(t.date, t);
            else if (prev.status !== "done" && t.status === "done") map.set(t.date, t);
        });
        return map;
    }, [trainings]);

    const goPrev = () => calendarRef.current?.getApi().prev();
    const goNext = () => calendarRef.current?.getApi().next();

    const onDatesSet = (arg: any) => setTitle(arg.view.title);

    const onCreateSubmit = (payload: CreateSessionPayload) => {
        setTrainings((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                date: payload.date,
                status: "done",
                name: payload.name,
                sport: payload.sport,
                typeTraining: payload.typeTraining,
                note: payload.note,
                startTime: payload.startTime,
                distanceKm: payload.distanceKm,
                durationSec: payload.durationSec,
                avgHr: payload.avgHr,
                elevationGainM: payload.elevationGainM,
                elevationLossM: payload.elevationLossM,
                calories: payload.calories,
                avgPaceSecPerKm:
                    typeof payload.avgPaceSecPerKm === "number"
                        ? payload.avgPaceSecPerKm
                        : payload.distanceKm && payload.durationSec
                            ? (payload.durationSec / payload.distanceKm)
                            : undefined,
            },
        ]);
        setCreateOpen(false);
    };

    const onUploadParsed = (parsed: UploadParsedPayload) => {
        const date = parsed.date;

        setTrainings((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                date,
                status: parsed.status,
                name: parsed.name,
                sport: parsed.sport,
                typeTraining: parsed.typeTraining,
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
            },
        ]);

        setUploadOpen(false);
    };

    const onDayClick = (arg: any) => {
        const key = toYmdLocal(arg.date);
        const t = trainingByDate.get(key);
        if (t) setSelectedTraining(t);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                background: "var(--trey-bg)" as any,
            }}
        >
            <Header/>

            <main style={{ flex: 1 }}>
                <div className="container py-4">
                    {/* top title row */}
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
                        <div>
                            <div className="trey-page-title" style={{ fontSize: 34 }}>
                                Календарь тренировок
                            </div>
                        </div>

                        <div className="d-flex gap-2">
                            <button
                                className="btn text-white"
                                style={{
                                    background: "#D1001C",
                                    borderRadius: 12,
                                    padding: "10px 16px",
                                    fontWeight: 700,
                                }}
                                type="button"
                                onClick={() => setCreateOpen(true)}
                            >
                                Создать занятие
                            </button>

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
                                    <path
                                        d="M12 16V4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d="M7 9l5-5 5 5"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 20h16"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="trey-calendar-card p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
                            {/* legend */}
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-2 text-muted trey-legend">
                  <span
                      style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: "rgba(13,110,253,0.55)",
                      }}
                  />
                                    <span style={{ fontSize: 14 }}>Запланировано</span>
                                </div>

                                <div className="d-flex align-items-center gap-2 text-muted trey-legend">
                  <span
                      style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: "rgba(25,135,84,0.55)",
                      }}
                  />
                                    <span style={{ fontSize: 14 }}>Выполнено</span>
                                </div>
                            </div>

                            <div className="trey-segment" role="tablist" aria-label="Переключение вида">
                                <button
                                    type="button"
                                    className={view === "dayGridMonth" ? "active" : ""}
                                    onClick={() => {
                                        setView("dayGridMonth");
                                        calendarRef.current?.getApi().changeView("dayGridMonth");
                                    }}
                                >
                                    Месяц
                                </button>

                                <button
                                    type="button"
                                    className={view === "dayGridWeek" ? "active" : ""}
                                    onClick={() => {
                                        setView("dayGridWeek");
                                        calendarRef.current?.getApi().changeView("dayGridWeek");
                                    }}
                                >
                                    Неделя
                                </button>
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
                            dateClick={onDayClick}
                            dayCellClassNames={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const status = statusByDate.get(key);
                                if (status === "done") return ["trey-day--done"];
                                if (status === "planned") return ["trey-day--planned"];
                                return [];
                            }}
                            dayCellContent={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const t = trainingByDate.get(key);

                                const name = t?.name?.trim() || "";
                                const dist = typeof t?.distanceKm === "number" ? `${t!.distanceKm} км` : "";
                                const time = typeof t?.durationSec === "number" ? formatHms(t!.durationSec) : "";

                                return (
                                    <div className="trey-daycell">
                                        {/* число всегда как было: справа сверху */}
                                        <div className={`trey-daynum ${arg.isOther ? "trey-daynum--other" : ""}`}>
                                            {arg.dayNumberText}
                                        </div>

                                        {/* подписи только если есть тренировка */}
                                        {t && (
                                            <div className="trey-celltext">
                                                <div className="trey-celltitle">
                                                    {name || "Тренировка"}
                                                    {dist ? <span className="trey-celldist">{" "}{dist}</span> : null}
                                                </div>
                                                {time ? <div className="trey-celltime">{time}</div> : null}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </main>

            {/* Модалки */}
            {createOpen && (
                <CreateSessionModal onClose={() => setCreateOpen(false)} onSubmit={onCreateSubmit} />
            )}

            {uploadOpen && (
                <UploadSessionModal onClose={() => setUploadOpen(false)} onParsed={onUploadParsed} />
            )}

            {selectedTraining && (
                <TrainingDetailsModal
                    training={selectedTraining}
                    onClose={() => setSelectedTraining(null)}
                    formatHms={formatHms}
                    formatPace={formatPace}
                />
            )}
        </div>
    );
};

export default AthleteCalendarPage;

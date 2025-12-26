import React, { useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../../styles/fullcalendar.css";

import Header from "../../components/Header";

type TrainingStatus = "planned" | "done";

type TrainingEvent = {
    id: string;
    date: string;
    status: TrainingStatus;
};

const toYmdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

const AthleteCalendarPage: React.FC = () => {
    const calendarRef = useRef<FullCalendar | null>(null);

    const [view, setView] = useState<"dayGridMonth" | "dayGridWeek">("dayGridMonth");
    const [title, setTitle] = useState<string>("");

    const trainings: TrainingEvent[] = useMemo(
        () => [
            { id: "t1", date: "2026-01-07", status: "planned" },
            { id: "t2", date: "2026-01-09", status: "done" },
            { id: "t3", date: "2026-01-18", status: "planned" },
            { id: "t4", date: "2026-01-23", status: "done" },
        ],
        []
    );

    const statusByDate = useMemo(() => {
        const map = new Map<string, TrainingStatus>();
        trainings.forEach((t) => {
            const prev = map.get(t.date);
            if (!prev) map.set(t.date, t.status);
            else if (prev !== "done" && t.status === "done") map.set(t.date, "done");
        });
        return map;
    }, [trainings]);

    const goPrev = () => calendarRef.current?.getApi().prev();
    const goNext = () => calendarRef.current?.getApi().next();

    const onDatesSet = (arg: any) => {
        setTitle(arg.view.title);
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
            <Header active="calendar" notificationsCount={3} />

            <main style={{ flex: 1 }}>
                <div className="container py-4">
                    {/* top title row */}
                    <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-3">
                        <div>
                            <div className="trey-page-title" style={{ fontSize: 34 }}>
                                Календарь тренировок
                            </div>
                        </div>

                        <button
                            className="btn text-white"
                            style={{
                                background: "#D1001C",
                                borderRadius: 12,
                                padding: "10px 16px",
                                fontWeight: 700,
                            }}
                            type="button"
                        >
                            Создать сессию
                        </button>
                    </div>

                    <div className="trey-calendar-card p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
                            {/* legend */}
                            <div className="d-flex align-items-center gap-3">
                                <div className="d-flex align-items-center gap-2 text-muted">
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

                                <div className="d-flex align-items-center gap-2 text-muted">
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

                            dayCellClassNames={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const status = statusByDate.get(key);
                                if (status === "done") return ["trey-day--done"];
                                if (status === "planned") return ["trey-day--planned"];
                                return [];
                            }}

                            dayCellContent={(arg) => {
                                const key = toYmdLocal(arg.date);
                                const status = statusByDate.get(key);

                                return (
                                    <div className="trey-daycell">
                                        <div className={`trey-daynum ${arg.isOther ? "trey-daynum--other" : ""}`}>
                                            {arg.dayNumberText}
                                        </div>

                                        {status && (
                                            <div className={`trey-status trey-status--${status}`}>
                                                {status === "done" ? "Выполнено" : "Запланировано"}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AthleteCalendarPage;

export type TrainingStatus = "planned" | "done";

export type SportType = "running" | "cycling" | "swimming" | "strength" | "other";

export type TrainingType =
    | "strength"
    | "speed"
    | "interval"
    | "long"
    | "tempo"
    | "recovery"
    | "steady"
    | "other";

export type GpsPoint = {
    lat: number;
    lon: number;
    ele?: number;
    ts?: string;
};

export type TrainingStats = {
    avgHr?: number;
    avgPace?: string;
    ascent?: number;
    descent?: number;
    calories?: number;
};

export type TrainingSession = {
    id: string;

    title: string;
    sport: SportType;
    type: TrainingType;

    note?: string;
    status: TrainingStatus;

    date: string;
    startTime?: string;

    distanceKm?: number;
    durationMin?: number;

    stats?: TrainingStats;

    source?: "manual" | "file";
    gpsTrack?: GpsPoint[];
};

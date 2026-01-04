import React, { useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker } from "react-leaflet";
import type { GpsPoint } from "../pages/Athlete/CalendarPage";
import 'leaflet/dist/leaflet.css';

type Props = {
    points: GpsPoint[];
};

const GpsMap: React.FC<Props> = ({ points = [] }) => {
    const leafletPoints = useMemo(() =>
            points.map((p) => [p.lat, p.lon] as [number, number]),
        [points]
    );

    const center = useMemo(() => {
        if (leafletPoints.length === 0) return [55.7558, 37.6173] as [number, number];

        const sumLat = leafletPoints.reduce((sum, point) => sum + point[0], 0);
        const sumLon = leafletPoints.reduce((sum, point) => sum + point[1], 0);

        return [sumLat / leafletPoints.length, sumLon / leafletPoints.length] as [number, number];
    }, [leafletPoints]);

    const hasPoints = leafletPoints.length > 0;

    if (!hasPoints) {
        return (
            <div style={{
                height: 280,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #e7eaf0",
                background: "#f8f9fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div style={{ color: "#666", textAlign: "center" }}>
                    <div>Нет данных GPS</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            height: 280,
            borderRadius: 14,
            overflow: "hidden",
            border: "1px solid #e7eaf0",
            position: "relative"
        }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
                key={`map-${points.length}`}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maxZoom={19}
                    minZoom={1}
                />

                {leafletPoints.length > 1 && (
                    <Polyline
                        positions={leafletPoints}
                        pathOptions={{
                            color: '#D1001C',
                            weight: 4,
                            opacity: 0.8,
                            lineCap: 'round',
                            lineJoin: 'round'
                        }}
                    />
                )}

                {leafletPoints.length > 0 && (
                    <>
                        <Marker position={leafletPoints[0]} />
                        {leafletPoints.length > 1 && (
                            <Marker position={leafletPoints[leafletPoints.length - 1]} />
                        )}
                    </>
                )}
            </MapContainer>

            <div style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(255,255,255,0.9)",
                padding: "4px 8px",
                borderRadius: 4,
                fontSize: 12,
                color: "#666",
                zIndex: 1000
            }}>
                {leafletPoints.length} точек
            </div>
        </div>
    );
};

export default GpsMap;
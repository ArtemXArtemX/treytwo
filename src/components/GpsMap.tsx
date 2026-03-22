import React, {useEffect, useMemo} from "react";
import {MapContainer, TileLayer, Polyline, Marker, useMap} from "react-leaflet";
import type { GpsPoint } from "../pages/Athlete/CalendarPage";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import yandexLogo from '../assets/yndex_logo_ru.svg';

const FitBoundsToTrack: React.FC<{ points: [number, number][] }> = ({ points }) => {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, {
                padding: [30, 30],
                maxZoom: 30
            });
        }
    }, [map, points]);

    return null;
};

const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="
            background-color: #4CAF50;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 14px solid white;
                transform: rotate(90deg);
                margin-left: 2px;
            "></div>
        </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
});

const finishIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
        <div style="
            background-color: #D1001C;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 14px;
                height: 14px;
                background-color: white;
                border-radius: 2px;
            "></div>
        </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
});

delete (L.Icon.Default.prototype as any)._getIconUrl;

type Props = {
    points: GpsPoint[];
    apiKey?: string;
};

const GpsMap: React.FC<Props> = ({ points = [], apiKey }) => {
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

    const bounds = useMemo(() => {
        if (leafletPoints.length === 0) return null;
        return L.latLngBounds(leafletPoints);
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
                bounds={bounds || undefined}
                crs={L.CRS.EPSG3395}
                attributionControl={false}

            >
                <TileLayer
                    url={`https://tiles.api-maps.yandex.ru/v1/tiles/?x={x}&y={y}&z={z}&lang=ru_RU&l=map&apikey=${apiKey}`}
                    attribution='&copy; <a href="https://yandex.ru/legal/maps_termsofuse/">Яндекс.Карты</a>'
                    maxZoom={20}
                    minZoom={1}
                />

                <FitBoundsToTrack points={leafletPoints} />

                <div style={{
                    position: "absolute",
                    bottom: "15px",
                    right: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(255,255,255,0.9)",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    backdropFilter: "blur(2px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    zIndex: 1000
                }}>
                    <a
                        href="https://yandex.ru/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            lineHeight: 0
                        }}
                    >
                        <img
                            src={yandexLogo}
                            alt="Яндекс.Карты"
                            style={{
                                height: "30px",
                                width: "auto",
                                objectFit: "contain"
                            }}
                        />
                    </a>

                    <div style={{
                        width: "1px",
                        height: "20px",
                        background: "#ddd",
                        margin: "0 4px"
                    }} />

                    <a
                        href="https://leafletjs.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: "#0078A8",
                            textDecoration: "none",
                            fontWeight: 500,
                            fontSize: "12px",
                            letterSpacing: "0.3px"
                        }}
                    >
                        Leaflet
                    </a>
                </div>

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
                        <Marker
                            position={leafletPoints[0]}
                            icon={startIcon}
                        />

                        {leafletPoints.length > 1 && (
                            <Marker
                                position={leafletPoints[leafletPoints.length - 1]}
                                icon={finishIcon}
                            />
                        )}
                    </>
                )}
            </MapContainer>
        </div>
    );
};

export default GpsMap;
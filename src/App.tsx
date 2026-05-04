import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from './context/RoleContext';

import LoginPage from "./pages/Auth/LoginPage";
import RegistrationPage from "./pages/Auth/RegistrationPage";
import Footer from "./components/Footer";

import AthleteCalendarPage from "./pages/Athlete/CalendarPage";
import AthleteCoachPage from "./pages/Athlete/CoachPage";
import AthleteReportsPage from "./pages/Athlete/ReportsPage";

import CoachCalendarPage from "./pages/Coach/CoachCalendarPage";
import CoachReportsPage from "./pages/Coach/CoachReportsPage";
import CoachSportsmanPage from "./pages/Coach/SportsmanPage";

import UserProfilePage from "./pages/UserProfilePage";
import SettingsPage from './pages/SettingsPage';
import TrainingDetailPage from "./pages/TrainingDetailPage";

const AppRoutes: React.FC = () => {
    const { isCoach, isLoading } = useRole();
    console.log("App.tsx — isCoach:", isCoach);

    if (isLoading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/training/:id" element={<TrainingDetailPage />} />

            {!isCoach && (
                <>
                    <Route path="/" element={<Navigate to="/calendar" replace />} />
                    <Route path="/calendar" element={<AthleteCalendarPage />} />
                    <Route path="/coaches" element={<AthleteCoachPage />} />
                    <Route path="/reports" element={<AthleteReportsPage />} />
                </>
            )}

            {isCoach && (
                <>
                    <Route path="/" element={<Navigate to="/calendar" replace />} />
                    <Route path="/calendar" element={<CoachCalendarPage />} />
                    <Route path="/sportsmans" element={<CoachSportsmanPage />} />
                    <Route path="/reports" element={<CoachReportsPage />} />
                </>
            )}
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <RoleProvider>
                <div className="wrapper">
                    <main className="content">
                        <AppRoutes />
                    </main>
                    <Footer />
                </div>
            </RoleProvider>
        </BrowserRouter>
    );
}

export default App;
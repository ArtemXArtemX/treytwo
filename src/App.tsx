import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage";
import RegistrationPage from "./pages/Auth/RegistrationPage";
import Footer from "./components/Footer";
import CalendarPage from "./pages/Athlete/CalendarPage";
import UserProfilePage from "./pages/UserProfilePage";
import SettingsPage from './pages/SettingsPage';
import TrainingDetailPage from './pages/TrainingDetailPage';
const App: React.FC = () => {
    return (
        <BrowserRouter>
            <div className="wrapper">

                <main className="content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/calendar" replace />} />

                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/training/:id" element={<TrainingDetailPage />} />
                    </Routes>
                </main>

                <Footer />
            </div>
        </BrowserRouter>
    );
};
export default App;
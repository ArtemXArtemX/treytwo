import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Auth/LoginPage";
import RegistrationPage from "./pages/Auth/RegistrationPage";
import Footer from "./components/Footer";

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <div className="wrapper">

                <main className="content">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegistrationPage />} />
                        {/* Добавьте другие маршруты позже */}
                    </Routes>
                </main>

                <Footer />
            </div>
        </BrowserRouter>
    );
};
export default App;
import React, { createContext, useContext, useState } from "react";
import { SportsmanResponse } from "../api/coachService";

interface SelectedSportsmanContextType {
    selectedSportsman: SportsmanResponse | null;
    setSelectedSportsman: (sportsman: SportsmanResponse | null) => void;
}

const SelectedSportsmanContext = createContext<SelectedSportsmanContextType>({
    selectedSportsman: null,
    setSelectedSportsman: () => {},
});

export const useSelectedSportsman = () => useContext(SelectedSportsmanContext);

export const SelectedSportsmanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSportsman, setSelectedSportsmanState] = useState<SportsmanResponse | null>(() => {
        const saved = localStorage.getItem("selectedSportsman");
        return saved ? JSON.parse(saved) : null;
    });

    const setSelectedSportsman = (sportsman: SportsmanResponse | null) => {
        setSelectedSportsmanState(sportsman);

        if (sportsman) {
            localStorage.setItem("selectedSportsman", JSON.stringify(sportsman));
        } else {
            localStorage.removeItem("selectedSportsman");
        }
    };

    return (
        <SelectedSportsmanContext.Provider value={{ selectedSportsman, setSelectedSportsman }}>
            {children}
        </SelectedSportsmanContext.Provider>
    );
};
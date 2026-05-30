import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import authService from '../api/authService';

interface RoleContextType {
    isCoach: boolean;
    isLoading: boolean;
}

const RoleContext = createContext<RoleContextType>({ isCoach: false, isLoading: true });

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCoach, setIsCoach] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const routingLocation = useLocation();

    useEffect(() => {
        const checkRole = async () => {
            setIsLoading(true);
            const user = authService.getCurrentUser();
            setIsCoach(Number(user?.user_only_coach) === 1);
            setIsLoading(false);
        };
        checkRole();
    }, [routingLocation.pathname]);

    return (
        <RoleContext.Provider value={{ isCoach, isLoading }}>
            {children}
        </RoleContext.Provider>
    );
};
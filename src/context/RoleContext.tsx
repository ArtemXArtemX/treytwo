import React, { createContext, useContext, useState, useEffect } from 'react';
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

    useEffect(() => {
        const checkRole = async () => {
            const user = authService.getCurrentUser();
            setIsCoach(user?.user_only_coach === 1);
            setIsLoading(false);
        };
        checkRole();
    }, []);

    return (
        <RoleContext.Provider value={{ isCoach, isLoading }}>
            {children}
        </RoleContext.Provider>
    );
};
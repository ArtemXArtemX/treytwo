import { useEffect, useState } from "react";
import { apiFetch } from "../api/http";

export function useCurrentUser() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const id = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!id || !token) return;

        apiFetch(`/api/User/Get/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }).then(setUser);
    }, []);

    return user;
}

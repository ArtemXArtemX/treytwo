export const API_URL = "https://localhost:7001";

export async function apiFetch<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const res = await fetch(API_URL + url, {
        headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
        },
        ...options,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Ошибка запроса");
    }

    return res.json();
}

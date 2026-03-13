export const AUTH_TOKEN_KEY = "plantz-auth-token";

export function getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
        return {};
    }

    return { Authorization: `Bearer ${token}` };
}

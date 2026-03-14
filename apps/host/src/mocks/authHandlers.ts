import { http, HttpResponse } from "msw";

import { AUTH_TOKEN_KEY, getUserId, usersDb } from "@packages/plants-core/db";

export const authHandlers = [
    http.post("/api/auth/login", async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        const user = usersDb.getByEmail(body.email);

        if (!user || user.password !== body.password) {
            return new HttpResponse(null, { status: 401 });
        }

        sessionStorage.setItem(AUTH_TOKEN_KEY, user.id);

        return HttpResponse.json({ token: user.id });
    }),

    http.post("/api/auth/logout", () => {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);

        return new HttpResponse(null, { status: 200 });
    }),

    http.put("/api/auth/profile", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { name: string };
        const user = usersDb.updateName(userId, body.name);

        if (!user) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json({ id: user.id, name: user.name, email: user.email });
    }),

    http.get("/api/auth/session", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const user = usersDb.getById(userId);

        if (!user) {
            return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({ id: user.id, name: user.name, email: user.email });
    }),
];

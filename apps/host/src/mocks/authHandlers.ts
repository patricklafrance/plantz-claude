import { http, HttpResponse } from "msw";

import { getUserId, usersDb } from "@packages/plants-core/db";

export const authHandlers = [
    http.post("/api/auth/login", async ({ request }) => {
        const body = (await request.json()) as { email: string; password: string };
        const user = usersDb.getByEmail(body.email);

        if (!user || user.password !== body.password) {
            return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({ token: user.id });
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

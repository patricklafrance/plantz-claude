import { http, HttpResponse } from "msw";

import { plantsDb } from "@packages/plants-core/db";

export const todayPlantHandlers = [
    http.get("/api/today/plants", () => {
        const plants = plantsDb.getAll();

        return HttpResponse.json(plants);
    }),

    http.delete("/api/today/plants/:id", ({ params }) => {
        const { id } = params;
        const deleted = plantsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.delete("/api/today/plants", async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        plantsDb.deleteMany(body.ids);

        return new HttpResponse(null, { status: 204 });
    }),
];

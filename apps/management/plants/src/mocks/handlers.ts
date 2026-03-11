import { http, HttpResponse } from "msw";

import type { Plant } from "@packages/plants-core";
import { plantsDb } from "@packages/plants-core/db";

export const managementPlantHandlers = [
    http.get("/api/management/plants", () => {
        const plants = plantsDb.getAll();

        return HttpResponse.json(plants);
    }),

    http.get("/api/management/plants/:id", ({ params }) => {
        const { id } = params;
        const plant = plantsDb.get(id as string);

        if (!plant) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(plant);
    }),

    http.post("/api/management/plants", async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        const now = new Date();

        const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const plant = plantsDb.insert({
            ...(body as Record<string, unknown>),
            id,
            creationDate: now,
            lastUpdateDate: now,
        } as Plant);

        return HttpResponse.json(plant, { status: 201 });
    }),

    http.put("/api/management/plants/:id", async ({ params, request }) => {
        const { id } = params;
        const body = (await request.json()) as Record<string, unknown>;
        const plant = plantsDb.update(id as string, body as Partial<Plant>);

        if (!plant) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(plant);
    }),

    http.delete("/api/management/plants/:id", ({ params }) => {
        const { id } = params;
        const deleted = plantsDb.delete(id as string);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    http.delete("/api/management/plants", async ({ request }) => {
        const body = (await request.json()) as { ids: string[] };
        plantsDb.deleteMany(body.ids);

        return new HttpResponse(null, { status: 204 });
    }),
];

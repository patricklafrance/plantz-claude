import { http, HttpResponse } from "msw";

import { getUserId, householdDb } from "@packages/core-module/db";
import type { Plant } from "@packages/core-plants";
import { plantsDb } from "@packages/core-plants/db";

export const managementPlantHandlers = [
    // GET /api/management/plants/households — user's households with members (placed BEFORE /:id)
    http.get("/api/management/plants/households", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const households = householdDb.getHouseholdsForUser(userId);
        const result = households.map((h) => ({
            ...h,
            members: householdDb.getMembers(h.id),
        }));

        return HttpResponse.json(result);
    }),

    // GET /api/management/plants/households/:householdId/members — members of a specific household
    http.get("/api/management/plants/households/:householdId/members", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.householdId as string;
        const members = householdDb.getMembers(householdId);

        return HttpResponse.json(members);
    }),

    http.get("/api/management/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plants = plantsDb.getAllByUser(userId);

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
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as Record<string, unknown>;
        const now = new Date();

        const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        const plant = plantsDb.insert({
            ...(body as Record<string, unknown>),
            id,
            userId,
            creationDate: now,
            lastUpdateDate: now,
        } as Plant);

        return HttpResponse.json(plant, { status: 201 });
    }),

    http.put("/api/management/plants/:id", async ({ params, request }) => {
        const { id } = params;
        const body = (await request.json()) as Record<string, unknown>;

        // Convert null values to undefined so optional Plant fields are properly cleared
        const updates: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(body)) {
            updates[key] = value === null ? undefined : value;
        }

        const plant = plantsDb.update(id as string, updates as Partial<Plant>);

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

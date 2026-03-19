import { http, HttpResponse } from "msw";

import { getUserId, householdDb } from "@packages/core-module/db";
import { plantsDb } from "@packages/core-plants/db";

export const todayPlantHandlers = [
    http.get("/api/today/plants", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        // Get user's own plants
        const ownPlants = plantsDb.getAllByUser(userId);

        // Get plants shared with user's households
        const householdIdSet = new Set(householdDb.getUserHouseholdIds(userId));
        const allPlants = plantsDb.getAll();
        const sharedPlants = allPlants.filter((p) => p.householdId && householdIdSet.has(p.householdId) && p.userId !== userId);

        // Combine and deduplicate
        const plantMap = new Map(ownPlants.map((p) => [p.id, p]));
        for (const plant of sharedPlants) {
            if (!plantMap.has(plant.id)) {
                plantMap.set(plant.id, plant);
            }
        }

        return HttpResponse.json([...plantMap.values()]);
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

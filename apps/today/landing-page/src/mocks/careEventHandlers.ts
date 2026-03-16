import { http, HttpResponse } from "msw";

import { getUserId } from "@packages/core-module/db";
import type { CareEventType } from "@packages/core-plants/care-event";

import { careEventsDb } from "./careEventsDb.ts";

export const todayCareEventHandlers = [
    http.get("/api/today/care-events", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const url = new URL(request.url);
        const plantId = url.searchParams.get("plantId");

        if (!plantId) {
            return HttpResponse.json([]);
        }

        const events = careEventsDb.getAllByPlant(plantId);

        return HttpResponse.json(events);
    }),

    http.post("/api/today/care-events", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { plantId: string; eventType: CareEventType; notes?: string };

        const event = {
            id: crypto.randomUUID(),
            plantId: body.plantId,
            eventType: body.eventType,
            eventDate: new Date(),
            notes: body.notes,
        };

        careEventsDb.insert(event);

        return HttpResponse.json(event, { status: 201 });
    }),
];

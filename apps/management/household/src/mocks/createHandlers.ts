import { delay, http, HttpResponse } from "msw";

import type { Household, HouseholdMember } from "@packages/core-module";
import type { Plant } from "@packages/core-plants";

interface HouseholdData {
    households: Household[];
    members: HouseholdMember[];
    plants: Plant[];
}

type HouseholdHandlerData = HouseholdData | "loading" | "error";

export function createManagementHouseholdHandlers(data: HouseholdHandlerData) {
    return [
        http.get("/api/management/household", async () => {
            if (data === "loading") {
                await delay("infinite");

                return HttpResponse.json([]);
            }

            if (data === "error") {
                return new HttpResponse(null, { status: 500 });
            }

            return HttpResponse.json(data.households);
        }),
        http.get("/api/management/household/:id", ({ params }) => {
            if (typeof data === "string") {
                return new HttpResponse(null, { status: 404 });
            }

            const household = data.households.find((h) => h.id === params.id);

            return household ? HttpResponse.json(household) : new HttpResponse(null, { status: 404 });
        }),
        http.get("/api/management/household/:id/members", ({ params }) => {
            if (typeof data === "string") {
                return HttpResponse.json([]);
            }

            const members = data.members.filter((m) => m.householdId === params.id);

            return HttpResponse.json(members);
        }),
        http.get("/api/management/household/:id/plants", ({ params }) => {
            if (typeof data === "string") {
                return HttpResponse.json([]);
            }

            const plants = data.plants.filter((p) => p.householdId === params.id);

            return HttpResponse.json(plants);
        }),
        http.post("/api/management/household", () => HttpResponse.json({}, { status: 201 })),
        http.put("/api/management/household/:id", () => HttpResponse.json({}, { status: 200 })),
        http.delete("/api/management/household/:id", () => new HttpResponse(null, { status: 204 })),
        http.post("/api/management/household/:id/invitations", () => HttpResponse.json({}, { status: 201 })),
        http.delete("/api/management/household/:id/members/:userId", () => new HttpResponse(null, { status: 204 })),
        http.put("/api/management/household/:id/plants/:plantId/assignment", () => HttpResponse.json({}, { status: 200 })),
    ];
}

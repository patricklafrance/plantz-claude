import { http, HttpResponse } from "msw";

import { getUserId, householdDb, usersDb } from "@packages/core-module/db";
import type { Plant } from "@packages/core-plants";
import { plantsDb } from "@packages/core-plants/db";

export const managementHouseholdHandlers = [
    // GET /api/management/household — list user's households
    http.get("/api/management/household", ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const households = householdDb.getHouseholdsForUser(userId);

        return HttpResponse.json(households);
    }),

    // POST /api/management/household — create household
    http.post("/api/management/household", async ({ request }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const body = (await request.json()) as { name: string };
        const user = usersDb.getById(userId);

        const household = householdDb.createHousehold({
            id: crypto.randomUUID(),
            name: body.name,
            ownerId: userId,
            creationDate: new Date(),
        });

        // Add the creator as owner member
        householdDb.addMember({
            id: crypto.randomUUID(),
            householdId: household.id,
            userId,
            userName: user?.name ?? "Unknown",
            role: "owner",
            joinedDate: new Date(),
        });

        return HttpResponse.json(household, { status: 201 });
    }),

    // GET /api/management/household/:id — get household detail
    http.get("/api/management/household/:id/plants", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const allPlants = plantsDb.getAll();
        const sharedPlants = allPlants.filter((p) => p.householdId === householdId);

        return HttpResponse.json(sharedPlants);
    }),

    http.get("/api/management/household/:id/members", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const members = householdDb.getMembers(householdId);

        return HttpResponse.json(members);
    }),

    http.get("/api/management/household/:id", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const id = params.id as string;
        const household = householdDb.getHousehold(id);

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(household);
    }),

    // PUT /api/management/household/:id — update household
    http.put("/api/management/household/:id", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const id = params.id as string;
        const body = (await request.json()) as { name?: string };
        const household = householdDb.updateHousehold(id, body);

        if (!household) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(household);
    }),

    // DELETE /api/management/household/:id — delete household
    http.delete("/api/management/household/:id", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const id = params.id as string;
        const deleted = householdDb.deleteHousehold(id);

        if (!deleted) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    // POST /api/management/household/:id/invitations — create invitation
    http.post("/api/management/household/:id/invitations", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const body = (await request.json()) as { email: string };

        // Look up the invitee by email to auto-accept for dev convenience
        const inviteeUser = usersDb.getByEmail(body.email);

        const invitation = householdDb.createInvitation({
            id: crypto.randomUUID(),
            householdId,
            inviterUserId: userId,
            inviteeEmail: body.email,
            status: "pending",
            creationDate: new Date(),
        });

        // Auto-accept and add member if the user exists (dev convenience)
        if (inviteeUser) {
            householdDb.acceptInvitation(invitation.id);
            householdDb.addMember({
                id: crypto.randomUUID(),
                householdId,
                userId: inviteeUser.id,
                userName: inviteeUser.name,
                role: "member",
                joinedDate: new Date(),
            });
        }

        return HttpResponse.json(invitation, { status: 201 });
    }),

    // POST /api/management/household/:id/invitations/:invId/accept — accept invitation
    http.post("/api/management/household/:id/invitations/:invId/accept", ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const invId = params.invId as string;
        const invitation = householdDb.acceptInvitation(invId);

        if (!invitation) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(invitation);
    }),

    // DELETE /api/management/household/:id/members/:userId — remove member
    http.delete("/api/management/household/:id/members/:userId", ({ request, params }) => {
        const currentUserId = getUserId(request);

        if (!currentUserId) {
            return new HttpResponse(null, { status: 401 });
        }

        const householdId = params.id as string;
        const targetUserId = params.userId as string;
        const removed = householdDb.removeMember(householdId, targetUserId);

        if (!removed) {
            return new HttpResponse(null, { status: 404 });
        }

        return new HttpResponse(null, { status: 204 });
    }),

    // PUT /api/management/household/:id/plants/:plantId/assignment — set responsibility
    http.put("/api/management/household/:id/plants/:plantId/assignment", async ({ request, params }) => {
        const userId = getUserId(request);

        if (!userId) {
            return new HttpResponse(null, { status: 401 });
        }

        const plantId = params.plantId as string;
        const body = (await request.json()) as { responsibilityUserId: string | null };

        let responsibilityUserName: string | undefined;
        if (body.responsibilityUserId) {
            const user = usersDb.getById(body.responsibilityUserId);
            responsibilityUserName = user?.name;
        }

        const plant = plantsDb.update(plantId, {
            responsibilityUserId: body.responsibilityUserId ?? undefined,
            responsibilityUserName,
        } as Partial<Plant>);

        if (!plant) {
            return new HttpResponse(null, { status: 404 });
        }

        return HttpResponse.json(plant);
    }),
];

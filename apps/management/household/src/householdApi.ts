import { getAuthHeaders, householdSchema, householdMemberSchema } from "@packages/core-module";
import type { Household, HouseholdMember, HouseholdInvitation } from "@packages/core-module";
import { plantSchema } from "@packages/core-plants";
import type { Plant } from "@packages/core-plants";

const API_BASE = "/api/management/household";

export async function fetchHouseholds(): Promise<Household[]> {
    const response = await fetch(API_BASE, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch households: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => householdSchema.parse(item));
}

export async function fetchHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    const response = await fetch(`${API_BASE}/${householdId}/members`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch household members: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => householdMemberSchema.parse(item));
}

export async function fetchHouseholdPlants(householdId: string): Promise<Plant[]> {
    const response = await fetch(`${API_BASE}/${householdId}/plants`, {
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch household plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
}

export async function createHousehold(name: string): Promise<Household> {
    const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        throw new Error(`Failed to create household: ${response.status}`);
    }

    const data = await response.json();

    return householdSchema.parse(data);
}

export async function inviteMember(householdId: string, email: string): Promise<HouseholdInvitation> {
    const response = await fetch(`${API_BASE}/${householdId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        throw new Error(`Failed to invite member: ${response.status}`);
    }

    return (await response.json()) as HouseholdInvitation;
}

export async function removeMember(householdId: string, userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${householdId}/members/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!response.ok) {
        throw new Error(`Failed to remove member: ${response.status}`);
    }
}

export async function updatePlantAssignment(householdId: string, plantId: string, responsibilityUserId: string | null): Promise<Plant> {
    const response = await fetch(`${API_BASE}/${householdId}/plants/${plantId}/assignment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ responsibilityUserId }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update assignment: ${response.status}`);
    }

    const data = await response.json();

    return plantSchema.parse(data);
}

export async function unsharePlant(plantId: string): Promise<void> {
    const response = await fetch(`/api/management/plants/${plantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ householdId: null, responsibilityUserId: null, responsibilityUserName: null }),
    });

    if (!response.ok) {
        throw new Error(`Failed to unshare plant: ${response.status}`);
    }
}

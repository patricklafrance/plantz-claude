import { plantSchema, type Plant } from "./plantSchema.ts";

const API_BASE = "/api/plants";

export async function fetchPlants(): Promise<Plant[]> {
    const response = await fetch(API_BASE);

    if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
}

export async function fetchPlant(id: string): Promise<Plant> {
    const response = await fetch(`${API_BASE}/${id}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch plant ${id}: ${response.status}`);
    }

    const data: unknown = await response.json();

    return plantSchema.parse(data);
}

export async function createPlant(data: Omit<Plant, "id" | "creationDate" | "lastUpdateDate">): Promise<Plant> {
    const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to create plant: ${response.status}`);
    }

    const result: unknown = await response.json();

    return plantSchema.parse(result);
}

export async function updatePlant(id: string, data: Partial<Plant>): Promise<Plant> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to update plant ${id}: ${response.status}`);
    }

    const result: unknown = await response.json();

    return plantSchema.parse(result);
}

export async function deletePlant(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error(`Failed to delete plant ${id}: ${response.status}`);
    }
}

export async function deletePlants(ids: string[]): Promise<void> {
    const response = await fetch(API_BASE, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
        throw new Error(`Failed to delete plants: ${response.status}`);
    }
}

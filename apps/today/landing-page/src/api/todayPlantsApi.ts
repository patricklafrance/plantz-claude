import { plantSchema, type Plant } from "@packages/plants-core";

const API_BASE = "/api/today/plants";

export async function fetchPlants(): Promise<Plant[]> {
    const response = await fetch(API_BASE);

    if (!response.ok) {
        throw new Error(`Failed to fetch plants: ${response.status}`);
    }

    const data: unknown[] = await response.json();

    return data.map((item) => plantSchema.parse(item));
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

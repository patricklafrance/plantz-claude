import type { Plant } from "./plantSchema.ts";

export function isDueForWatering(plant: Plant): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(plant.nextWateringDate);
    next.setHours(0, 0, 0, 0);
    return next <= today;
}

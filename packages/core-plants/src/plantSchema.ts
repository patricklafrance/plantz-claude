import { z } from "zod";

export const plantSchema = z.object({
    id: z.string(),
    userId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    family: z.string().optional(),
    location: z.string(),
    luminosity: z.string(),
    mistLeaves: z.boolean(),
    soilType: z.string().optional(),
    wateringFrequency: z.string(),
    wateringQuantity: z.string(),
    wateringType: z.string(),
    nextWateringDate: z.coerce.date(),
    creationDate: z.coerce.date(),
    lastUpdateDate: z.coerce.date(),
    householdId: z.string().optional(),
    responsibilityUserId: z.string().optional(),
    responsibilityUserName: z.string().optional(),
    lastWateredByActorName: z.string().optional(),
    lastWateredDate: z.coerce.date().optional(),
});

export type Plant = z.infer<typeof plantSchema>;

import type { Plant } from "../plantSchema.ts";

export const plantSpecies = [
    { name: "Monstera Deliciosa", family: "Araceae" },
    { name: "Fiddle Leaf Fig", family: "Moraceae" },
    { name: "Snake Plant", family: "Asparagaceae" },
    { name: "Pothos", family: "Araceae" },
    { name: "Peace Lily", family: "Araceae" },
    { name: "Spider Plant", family: "Asparagaceae" },
    { name: "Rubber Plant", family: "Moraceae" },
    { name: "ZZ Plant", family: "Araceae" },
    { name: "Aloe Vera", family: "Asphodelaceae" },
    { name: "Bird of Paradise", family: "Strelitziaceae" },
    { name: "Calathea Orbifolia", family: "Marantaceae" },
    { name: "Chinese Evergreen", family: "Araceae" },
    { name: "Dracaena Marginata", family: "Asparagaceae" },
    { name: "English Ivy", family: "Araliaceae" },
    { name: "Fern Boston", family: "Nephrolepidaceae" },
    { name: "Golden Barrel Cactus", family: "Cactaceae" },
    { name: "Hoya Carnosa", family: "Apocynaceae" },
    { name: "Jade Plant", family: "Crassulaceae" },
    { name: "Kentia Palm", family: "Arecaceae" },
    { name: "Lavender", family: "Lamiaceae" },
    { name: "Maidenhair Fern", family: "Pteridaceae" },
    { name: "Neon Pothos", family: "Araceae" },
    { name: "Orchid Phalaenopsis", family: "Orchidaceae" },
    { name: "Parlor Palm", family: "Arecaceae" },
    { name: "Philodendron Brasil", family: "Araceae" },
    { name: "Ponytail Palm", family: "Asparagaceae" },
    { name: "Prayer Plant", family: "Marantaceae" },
    { name: "Rattlesnake Plant", family: "Marantaceae" },
    { name: "String of Pearls", family: "Asteraceae" },
    { name: "Swiss Cheese Plant", family: "Araceae" },
    { name: "Tradescantia Zebrina", family: "Commelinaceae" },
    { name: "Umbrella Plant", family: "Araliaceae" },
    { name: "Venus Fly Trap", family: "Droseraceae" },
    { name: "Wandering Jew", family: "Commelinaceae" },
    { name: "Yucca", family: "Asparagaceae" },
    { name: "Zebra Plant", family: "Acanthaceae" },
    { name: "African Violet", family: "Gesneriaceae" },
    { name: "Begonia Rex", family: "Begoniaceae" },
    { name: "Croton", family: "Euphorbiaceae" },
    { name: "Dieffenbachia", family: "Araceae" },
    { name: "Elephant Ear", family: "Araceae" },
    { name: "Ficus Audrey", family: "Moraceae" },
    { name: "Gardenia", family: "Rubiaceae" },
    { name: "Heartleaf Philodendron", family: "Araceae" },
    { name: "Inch Plant", family: "Commelinaceae" },
    { name: "Japanese Maple Bonsai", family: "Sapindaceae" },
    { name: "Kangaroo Paw Fern", family: "Polypodiaceae" },
    { name: "Lucky Bamboo", family: "Asparagaceae" },
    { name: "Money Tree", family: "Malvaceae" },
    { name: "Norfolk Island Pine", family: "Araucariaceae" },
    { name: "Oxalis Triangularis", family: "Oxalidaceae" },
    { name: "Peperomia Watermelon", family: "Piperaceae" },
    { name: "Queen Anthurium", family: "Araceae" },
    { name: "Rosemary", family: "Lamiaceae" },
    { name: "Sago Palm", family: "Cycadaceae" },
    { name: "Tiger Tooth Aloe", family: "Asphodelaceae" },
    { name: "Urn Plant", family: "Bromeliaceae" },
    { name: "Velvet Calathea", family: "Marantaceae" },
    { name: "Wax Plant", family: "Apocynaceae" },
    { name: "Xerographica", family: "Bromeliaceae" },
    { name: "Yesterday Today Tomorrow", family: "Solanaceae" },
    { name: "Zanzibar Gem", family: "Araceae" },
    { name: "Alocasia Polly", family: "Araceae" },
    { name: "Boston Fern", family: "Nephrolepidaceae" },
    { name: "Cast Iron Plant", family: "Asparagaceae" },
    { name: "Dragon Tree", family: "Asparagaceae" },
    { name: "Echeveria", family: "Crassulaceae" },
    { name: "Flamingo Flower", family: "Araceae" },
    { name: "Gerbera Daisy", family: "Asteraceae" },
    { name: "Haworthia", family: "Asphodelaceae" },
    { name: "Ivy Geranium", family: "Geraniaceae" },
    { name: "Jasmine", family: "Oleaceae" },
    { name: "Kalanchoe", family: "Crassulaceae" },
    { name: "Lipstick Plant", family: "Gesneriaceae" },
    { name: "Majesty Palm", family: "Arecaceae" },
    { name: "Nerve Plant", family: "Acanthaceae" },
] as const;

export const soilTypes = ["Potting mix", "Cactus mix", "Orchid bark", "Peat moss", "Sandy loam", "Clay mix", "Perlite blend", "Coconut coir"] as const;

export const wateringQuantities = ["50ml", "100ml", "150ml", "200ml", "250ml", "300ml", "400ml", "500ml"] as const;

const locationIds = ["basement", "bathroom", "bedroom", "dining-room", "living-room", "kitchen"] as const;
const luminosityIds = ["low", "medium", "high"] as const;
const wateringFrequencyIds = ["0.5-week", "1-week", "1.5-weeks", "2-weeks", "2.5-weeks"] as const;
const wateringTypeIds = ["deep", "surface"] as const;

export function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]!;
}

export function randomDate(daysFromNow: number, spread: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow + Math.floor(Math.random() * spread));
    date.setHours(0, 0, 0, 0);

    return date;
}

function generateId(): string {
    // Use crypto.randomUUID when available, fallback for environments without it
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function generatePlants(count?: number, userId?: string): Plant[] {
    const total = count ?? 220 + Math.floor(Math.random() * 60);
    const plants: Plant[] = [];

    for (let i = 0; i < total; i++) {
        const species = pick(plantSpecies);
        const suffix = i >= plantSpecies.length ? ` #${Math.floor(i / plantSpecies.length) + 1}` : "";

        const isDue = Math.random() < 0.2;
        const nextWateringDate = isDue ? randomDate(-7, 7) : randomDate(1, 14);
        const creationDate = randomDate(-90, 60);

        plants.push({
            id: generateId(),
            userId: userId ?? "user-alice",
            name: `${species.name}${suffix}`,
            description: Math.random() > 0.3 ? `A beautiful ${species.name.toLowerCase()} plant.` : undefined,
            family: species.family,
            location: pick(locationIds),
            luminosity: pick(luminosityIds),
            mistLeaves: Math.random() > 0.4,
            soilType: Math.random() > 0.3 ? pick(soilTypes) : undefined,
            wateringFrequency: pick(wateringFrequencyIds),
            wateringQuantity: pick(wateringQuantities),
            wateringType: pick(wateringTypeIds),
            nextWateringDate,
            creationDate,
            lastUpdateDate: new Date(),
        });
    }

    return plants;
}

// Pre-generated stable seed data for consistent dev experience
export const defaultSeedPlants: Plant[] = generatePlants(125, "user-alice").concat(generatePlants(125, "user-bob"));

// Small focused data sets for story variants
export const emptyPlants: Plant[] = [];

export const singlePlant: Plant[] = [
    {
        id: "single-plant-1",
        userId: "user-alice",
        name: "Monstera Deliciosa",
        description: "A beautiful tropical plant with large fenestrated leaves.",
        family: "Araceae",
        location: "living-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Potting mix",
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 8, 0, 0, 0, 0), // Past date = due for watering
        creationDate: new Date(2026, 0, 1, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 2, 1, 0, 0, 0, 0),
    },
];

export const manyDueForWatering: Plant[] = [
    {
        id: "due-1",
        userId: "user-alice",
        name: "Aloe Vera",
        description: "A succulent plant known for its healing properties.",
        family: "Asphodelaceae",
        location: "kitchen",
        luminosity: "high",
        mistLeaves: false,
        soilType: "Cactus mix",
        wateringFrequency: "2-weeks",
        wateringQuantity: "100ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 5, 0, 0, 0, 0),
        creationDate: new Date(2025, 11, 1, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 2, 1, 0, 0, 0, 0),
    },
    {
        id: "due-2",
        userId: "user-alice",
        name: "Boston Fern",
        description: "A lush fern with cascading fronds.",
        family: "Nephrolepidaceae",
        location: "bathroom",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Peat moss",
        wateringFrequency: "0.5-week",
        wateringQuantity: "300ml",
        wateringType: "deep",
        nextWateringDate: new Date(2026, 2, 7, 0, 0, 0, 0),
        creationDate: new Date(2025, 10, 15, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 2, 2, 0, 0, 0, 0),
    },
    {
        id: "due-3",
        userId: "user-alice",
        name: "Calathea Orbifolia",
        description: "Stunning round leaves with silver-green stripes.",
        family: "Marantaceae",
        location: "living-room",
        luminosity: "low",
        mistLeaves: true,
        soilType: "Potting mix",
        wateringFrequency: "1-week",
        wateringQuantity: "200ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 6, 0, 0, 0, 0),
        creationDate: new Date(2025, 9, 20, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 1, 28, 0, 0, 0, 0),
    },
    {
        id: "due-4",
        userId: "user-alice",
        name: "Dracaena Marginata",
        description: "A tall plant with slender red-edged leaves.",
        family: "Asparagaceae",
        location: "bedroom",
        luminosity: "medium",
        mistLeaves: false,
        soilType: "Sandy loam",
        wateringFrequency: "1.5-weeks",
        wateringQuantity: "250ml",
        wateringType: "deep",
        nextWateringDate: new Date(2026, 2, 4, 0, 0, 0, 0),
        creationDate: new Date(2025, 8, 10, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 1, 25, 0, 0, 0, 0),
    },
    {
        id: "due-5",
        userId: "user-alice",
        name: "English Ivy",
        description: "A classic trailing vine with lobed leaves.",
        family: "Araliaceae",
        location: "dining-room",
        luminosity: "medium",
        mistLeaves: true,
        soilType: "Potting mix",
        wateringFrequency: "1-week",
        wateringQuantity: "150ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 3, 0, 0, 0, 0),
        creationDate: new Date(2025, 7, 5, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 1, 20, 0, 0, 0, 0),
    },
    {
        id: "due-6",
        userId: "user-alice",
        name: "Fiddle Leaf Fig",
        description: "Large violin-shaped leaves on a tall trunk.",
        family: "Moraceae",
        location: "living-room",
        luminosity: "high",
        mistLeaves: false,
        soilType: "Perlite blend",
        wateringFrequency: "1-week",
        wateringQuantity: "400ml",
        wateringType: "deep",
        nextWateringDate: new Date(2026, 2, 9, 0, 0, 0, 0),
        creationDate: new Date(2025, 6, 1, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 2, 5, 0, 0, 0, 0),
    },
    {
        id: "due-7",
        userId: "user-alice",
        name: "Golden Barrel Cactus",
        family: "Cactaceae",
        location: "basement",
        luminosity: "high",
        mistLeaves: false,
        soilType: "Cactus mix",
        wateringFrequency: "2.5-weeks",
        wateringQuantity: "50ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 2, 0, 0, 0, 0),
        creationDate: new Date(2025, 5, 15, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 1, 15, 0, 0, 0, 0),
    },
    {
        id: "due-8",
        userId: "user-alice",
        name: "Hoya Carnosa",
        description: "A waxy-leaved trailing plant that produces fragrant clusters of star-shaped flowers.",
        family: "Apocynaceae",
        location: "bedroom",
        luminosity: "medium",
        mistLeaves: false,
        soilType: "Orchid bark",
        wateringFrequency: "1.5-weeks",
        wateringQuantity: "150ml",
        wateringType: "surface",
        nextWateringDate: new Date(2026, 2, 1, 0, 0, 0, 0),
        creationDate: new Date(2025, 4, 10, 0, 0, 0, 0),
        lastUpdateDate: new Date(2026, 1, 10, 0, 0, 0, 0),
    },
];

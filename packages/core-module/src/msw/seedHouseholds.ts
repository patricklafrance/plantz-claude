import type { Household, HouseholdMember } from "../householdTypes.ts";

export const DEFAULT_HOUSEHOLD_ID = "household-1";

export const defaultSeedHouseholds: Household[] = [
    {
        id: DEFAULT_HOUSEHOLD_ID,
        name: "Our Apartment",
        ownerId: "user-alice",
        creationDate: new Date(2024, 0, 15),
    },
];

export const defaultSeedHouseholdMembers: HouseholdMember[] = [
    {
        id: "member-1",
        householdId: DEFAULT_HOUSEHOLD_ID,
        userId: "user-alice",
        userName: "Alice",
        role: "owner",
        joinedDate: new Date(2024, 0, 15),
    },
    {
        id: "member-2",
        householdId: DEFAULT_HOUSEHOLD_ID,
        userId: "user-bob",
        userName: "Bob",
        role: "member",
        joinedDate: new Date(2024, 1, 1),
    },
];

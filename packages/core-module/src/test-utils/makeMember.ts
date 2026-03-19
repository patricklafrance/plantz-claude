import type { HouseholdMember } from "../householdTypes.ts";

export const FIXED_JOINED = new Date(2024, 0, 15, 0, 0, 0, 0);

export function makeMember(overrides: Partial<HouseholdMember> & { id: string; userId: string; userName: string }): HouseholdMember {
    return {
        householdId: "household-1",
        role: "member",
        joinedDate: FIXED_JOINED,
        ...overrides,
    };
}

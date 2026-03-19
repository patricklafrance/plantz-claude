import { getAuthHeaders, householdMemberSchema } from "@packages/core-module";
import type { HouseholdMember } from "@packages/core-module";

interface UserHouseholdsWithMembers {
    households: Array<{ id: string; name: string }>;
    members: HouseholdMember[];
}

export async function fetchUserHouseholdsWithMembers(households: Array<{ id: string; name: string }>): Promise<UserHouseholdsWithMembers> {
    if (households.length === 0) {
        return { households: [], members: [] };
    }

    // Fetch members for each household
    const memberPromises = households.map(async (h) => {
        const response = await fetch(`/api/management/plants/households/${h.id}/members`, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) return [];

        const data: unknown[] = await response.json();

        return data.map((item) => householdMemberSchema.parse(item));
    });

    const memberArrays = await Promise.all(memberPromises);

    return {
        households,
        members: memberArrays.flat(),
    };
}

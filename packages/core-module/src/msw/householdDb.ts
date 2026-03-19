import type { Household, HouseholdInvitation, HouseholdMember } from "../householdTypes.ts";

export interface HouseholdSeedData {
    households: Household[];
    members: HouseholdMember[];
    invitations?: HouseholdInvitation[];
}

class HouseholdDb {
    #households = new Map<string, Household>();
    #members = new Map<string, HouseholdMember[]>();
    #invitations = new Map<string, HouseholdInvitation>();

    // --- Households ---

    createHousehold(household: Household): Household {
        this.#households.set(household.id, household);

        return household;
    }

    getHousehold(id: string): Household | undefined {
        return this.#households.get(id);
    }

    getHouseholdsForUser(userId: string): Household[] {
        const householdIds = this.getUserHouseholdIds(userId);

        return householdIds.map((id) => this.#households.get(id)).filter((h): h is Household => h !== undefined);
    }

    updateHousehold(id: string, data: Partial<Household>): Household | undefined {
        const existing = this.#households.get(id);

        if (!existing) return undefined;

        const updated = { ...existing, ...data };
        this.#households.set(id, updated);

        return updated;
    }

    deleteHousehold(id: string): boolean {
        this.#members.delete(id);

        return this.#households.delete(id);
    }

    // --- Members ---

    addMember(member: HouseholdMember): HouseholdMember {
        const members = this.#members.get(member.householdId) ?? [];
        members.push(member);
        this.#members.set(member.householdId, members);

        return member;
    }

    removeMember(householdId: string, userId: string): boolean {
        const members = this.#members.get(householdId);

        if (!members) return false;

        const index = members.findIndex((m) => m.userId === userId);

        if (index === -1) return false;

        members.splice(index, 1);

        return true;
    }

    getMembers(householdId: string): HouseholdMember[] {
        return this.#members.get(householdId) ?? [];
    }

    getUserHouseholdIds(userId: string): string[] {
        const ids: string[] = [];

        for (const [householdId, members] of this.#members) {
            if (members.some((m) => m.userId === userId)) {
                ids.push(householdId);
            }
        }

        return ids;
    }

    // --- Invitations ---

    createInvitation(invitation: HouseholdInvitation): HouseholdInvitation {
        this.#invitations.set(invitation.id, invitation);

        return invitation;
    }

    getInvitation(id: string): HouseholdInvitation | undefined {
        return this.#invitations.get(id);
    }

    getInvitationsForHousehold(householdId: string): HouseholdInvitation[] {
        return [...this.#invitations.values()].filter((inv) => inv.householdId === householdId);
    }

    acceptInvitation(invitationId: string): HouseholdInvitation | undefined {
        const invitation = this.#invitations.get(invitationId);

        if (!invitation || invitation.status !== "pending") return undefined;

        invitation.status = "accepted";

        return invitation;
    }

    // --- Reset ---

    reset(seed: HouseholdSeedData): void {
        this.#households.clear();
        this.#members.clear();
        this.#invitations.clear();

        for (const household of seed.households) {
            this.#households.set(household.id, household);
        }

        for (const member of seed.members) {
            const members = this.#members.get(member.householdId) ?? [];
            members.push(member);
            this.#members.set(member.householdId, members);
        }

        if (seed.invitations) {
            for (const invitation of seed.invitations) {
                this.#invitations.set(invitation.id, invitation);
            }
        }
    }
}

export const householdDb = new HouseholdDb();

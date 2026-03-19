export interface Household {
    id: string;
    name: string;
    ownerId: string;
    creationDate: Date;
}

export interface HouseholdMember {
    id: string;
    householdId: string;
    userId: string;
    userName: string;
    role: "owner" | "member";
    joinedDate: Date;
}

export interface HouseholdInvitation {
    id: string;
    householdId: string;
    inviterUserId: string;
    inviteeEmail: string;
    status: "pending" | "accepted" | "declined";
    creationDate: Date;
}

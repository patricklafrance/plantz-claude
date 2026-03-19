import { z } from "zod";

export const householdSchema = z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    creationDate: z.coerce.date(),
});

export const householdMemberSchema = z.object({
    id: z.string(),
    householdId: z.string(),
    userId: z.string(),
    userName: z.string(),
    role: z.enum(["owner", "member"]),
    joinedDate: z.coerce.date(),
});

export const householdInvitationSchema = z.object({
    id: z.string(),
    householdId: z.string(),
    inviterUserId: z.string(),
    inviteeEmail: z.string(),
    status: z.enum(["pending", "accepted", "declined"]),
    creationDate: z.coerce.date(),
});

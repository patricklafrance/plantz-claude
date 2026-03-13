import { createContext, useContext, type ReactNode } from "react";

export interface Session {
    id: string;
    name: string;
    email: string;
}

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ session, children }: { session: Session; children: ReactNode }) {
    return <SessionContext value={session}>{children}</SessionContext>;
}

export function useSession(): Session | null {
    return useContext(SessionContext);
}

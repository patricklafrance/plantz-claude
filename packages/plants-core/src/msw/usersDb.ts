import type { User } from "../userSchema.ts";

class UsersDb {
    #users: User[] = [
        { id: "user-alice", name: "Alice", email: "alice@example.com", password: "password" },
        { id: "user-bob", name: "Bob", email: "bob@example.com", password: "password" },
    ];

    getByEmail(email: string): User | undefined {
        return this.#users.find((u) => u.email === email);
    }

    getById(id: string): User | undefined {
        return this.#users.find((u) => u.id === id);
    }
}

export const usersDb = new UsersDb();

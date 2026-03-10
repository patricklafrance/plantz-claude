export const plantsKeys = {
    all: ["plants"] as const,
    lists: () => [...plantsKeys.all, "list"] as const,
    detail: (id: string) => [...plantsKeys.all, "detail", id] as const,
};

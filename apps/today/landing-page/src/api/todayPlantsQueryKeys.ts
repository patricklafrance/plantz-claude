export const todayPlantsKeys = {
    all: ["today", "plants"] as const,
    lists: () => [...todayPlantsKeys.all, "list"] as const,
};

export const managementPlantsKeys = {
    all: ["management", "plants"] as const,
    lists: () => [...managementPlantsKeys.all, "list"] as const,
    detail: (id: string) => [...managementPlantsKeys.all, "detail", id] as const,
};

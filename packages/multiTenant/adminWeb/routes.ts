import type { RouteRecordRaw } from "vue-router";

export const adminRoutes: RouteRecordRaw[] = [
  { path: "", redirect: { name: "multiTenantOverview" } },
  { path: "overview", name: "multiTenantOverview", component: () => import("./pages/overview.vue") },
  { path: "users", name: "multiTenantUsers", component: () => import("./pages/users.vue") },
  { path: "providers", name: "multiTenantProviders", component: () => import("./pages/providers.vue") },
  { path: "sourceMapping", name: "multiTenantSourceMapping", component: () => import("./pages/sourceMapping.vue") },
  { path: "models", name: "multiTenantModels", component: () => import("./pages/models.vue") },
  { path: "prices", name: "multiTenantPrices", component: () => import("./pages/prices.vue") },
  { path: "configuration", name: "multiTenantConfiguration", component: () => import("./pages/configuration.vue") },
  { path: ":pathMatch(.*)*", redirect: { name: "multiTenantOverview" } },
];

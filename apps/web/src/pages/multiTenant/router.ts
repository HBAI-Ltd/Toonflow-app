import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import { adminRoutes } from "@toonflow/multi-tenant-admin-web/routes";
import { publicWeb } from "@/stores/multiTenant";

export const adminRoute: RouteRecordRaw = {
  path: "/multiTenant",
  component: () => import("./index.vue"),
  beforeEnter: () => publicWeb.value ? { path: "/home", replace: true } : true,
  children: adminRoutes,
};

export function createAdminRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      adminRoute,
      { path: "/:pathMatch(.*)*", redirect: { name: "multiTenantOverview" } },
    ],
  });
}

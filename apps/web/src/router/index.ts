import { createRouter, createWebHashHistory } from "vue-router";
import { useHelloStore } from "@/stores/hello";
import { useWorkspaceStore } from "@/stores/workspace";
import { publicWeb } from "@/stores/multiTenant";
import { adminRoute } from "@/pages/multiTenant/router";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: () => publicWeb.value ? "/home" : "/hello",
    },
    {
      path: "/hello",
      beforeEnter: async () => publicWeb.value || await useHelloStore().load() ? { path: "/home", replace: true } : true,
      component: () => import("@/pages/hello/index.vue"),
    },
    {
      path: "/home",
      component: () => import("@/pages/home/index.vue"),
    },
    {
      path: "/canvas",
      redirect: "/workspace",
    },
    {
      path: "/workspace",
      beforeEnter: () => publicWeb.value && !useWorkspaceStore().project ? { path: "/home", replace: true } : true,
      component: () => import("@/pages/workspace/index.vue"),
    },
    adminRoute,
  ],
});
export default router;

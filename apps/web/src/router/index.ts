import { createRouter, createWebHashHistory } from "vue-router";
import { useHelloStore } from "@/stores/hello";
import { accountEnabled } from "@/lib/account";
import { useWorkspaceStore } from "@/stores/workspace";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/hello",
    },
    {
      path: "/hello",
      beforeEnter: async () => accountEnabled.value || await useHelloStore().load() ? { path: "/home", replace: true } : true,
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
      beforeEnter: () => accountEnabled.value && !useWorkspaceStore().project ? { path: "/home", replace: true } : true,
      component: () => import("@/pages/workspace/index.vue"),
    },
  ],
});
export default router;

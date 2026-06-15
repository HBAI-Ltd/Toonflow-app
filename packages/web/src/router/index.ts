import { createRouter, createWebHashHistory } from "vue-router";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/:catchAll(.*)",
      name: "404",
      meta: {
        title: "404",
      },
      component: () => import("@/pages/error/404.vue"),
    },
    {
      path: "/",
      redirect: "/loading",
    },
    {
      path: "/loading",
      component: () => import("@/pages/loading/index.vue"),
    },
    {
      path: "/workbench",
      component: () => import("@/pages/workbench/index.vue"),
      redirect: "/project",
      children: [
        {
          path: "/project",
          component: () => import("@/views/project/index.vue"),
        },
        // {
        //   path: "/task",
        //   component: () => import("@/views/task/index.vue"),
        // },
        // {
        //   path: "/flowProject",
        //   component: () => import("@/views/flowProject/index.vue"),
        // },
        // {
        //   path: "/novel",
        //   component: () => import("@/views/novel/index.vue"),
        // },
        // {
        //   path: "/script",
        //   component: () => import("@/views/script/index.vue"),
        // },
        // {
        //   path: "/scriptAgent",
        //   component: () => import("@/views/scriptAgent/index.vue"),
        // },
        // {
        //   path: "/cornerScape",
        //   component: () => import("@/views/cornerScape/index.vue"),
        // },
        // {
        //   path: "/production",
        //   component: () => import("@/views/production/index.vue"),
        // },
        // {
        //   path: "/assets",
        //   component: () => import("@/views/assets/index.vue"),
        // },
        // {
        //   path: "/test",
        //   component: () => import("@/views/test/index.vue"),
        // },
        // {
        //   path: "/infiniteCanvas",
        //   component: () => import("@/views/infiniteCanvas/index.vue"),
        // },
      ],
    },
    {
      path: "/login",
      component: () => import("@/pages/login/index.vue"),
    },
  ],
});
router.beforeEach((to, from, next) => {
  if ((window as any).process?.versions?.electron) {
    return next();
  }
  if (to.path === "/login") {
    return next();
  }
  if (to.path === "/loading") {
    return next();
  }
  if (localStorage.getItem("token")) {
    return next();
  }
  return next("/login");
});
export default router;

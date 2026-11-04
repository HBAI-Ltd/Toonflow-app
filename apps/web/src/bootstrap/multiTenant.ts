import { createApp, h, type App } from "vue";
import { ElConfigProvider } from "element-plus";
import { elementLocales } from "@toonflow/i18n/elementPlus";
import { locale } from "@toonflow/i18n/vue";
import type { UserSession } from "@toonflow/multi-tenant-user-web/types";
import logoUrl from "@toonflow/assets/logo.svg";
import http from "@/lib/http";
import { actualPlatform } from "@/lib/platform";
import { currentUser, publicWeb, hostWeb } from "@/stores/multiTenant";

export async function initializeMultiTenant(): Promise<{ session: UserSession; app: App<Element> | undefined }> {
  const hostWindow = window as Window & { toonflowHostReady?: Promise<void> };
  await hostWindow.toonflowHostReady;
  const session = await http<UserSession>({ method: "GET", url: "/api/multiTenant/user/session", headers: { "Accept-Language": locale.value } });
  currentUser.value = session.user;
  publicWeb.value = session.publicWeb;
  hostWeb.value = session.host;
  let app: App<Element> | undefined;

  if (session.publicWeb && !session.user) {
    const [{ default: userWeb }, { default: authBackdrop }] = await Promise.all([
      import("@toonflow/multi-tenant-user-web"), import("@/pages/hello/bg.vue"),
    ]);
    app = createApp({ render: () => h(ElConfigProvider, { locale: elementLocales[locale.value] }, () => h(userWeb, {
      request: http, logoUrl, registrationEnabled: session.registrationEnabled, onAuthenticated: () => window.location.reload(),
    }, { art: () => h(authBackdrop) })) });
  } else if (!session.publicWeb && (session.enabled || window.location.hash.startsWith("#/multiTenant"))) {
    const [{ createAdminRouter }, { RouterView }] = await Promise.all([
      import("@/pages/multiTenant/router"), import("vue-router"),
    ]);
    const router = createAdminRouter();
    app = createApp({ render: () => h(ElConfigProvider, { locale: elementLocales[locale.value] }, () => h(RouterView)) });
    app.use(router);
    await router.isReady();
    if (actualPlatform.isLocalDesktop) {
      const { registerDesktopProtocol } = await import("@/lib/desktopProtocol");
      app.onUnmount(registerDesktopProtocol());
    }
  }
  return { session, app };
}

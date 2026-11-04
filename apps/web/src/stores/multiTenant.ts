import { ref, shallowRef } from "vue";
import type { UserIdentity } from "@toonflow/multi-tenant-user-web/types";

export const currentUser = shallowRef<UserIdentity | null>(null);
export const publicWeb = ref(false);
export const hostWeb = ref(false);

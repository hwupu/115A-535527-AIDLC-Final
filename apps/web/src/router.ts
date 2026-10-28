import { createRouter, createWebHistory } from "vue-router";
import RoleSelectView from "./views/RoleSelectView.vue";
import RolePlaceholderView from "./views/RolePlaceholderView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "role-select", component: RoleSelectView },
    // Placeholders: replaced by real screens in later tickets (nurse session, physician view, ...).
    { path: "/patient", name: "patient", component: RolePlaceholderView, props: { role: "patient" } },
    { path: "/nurse", name: "nurse", component: RolePlaceholderView, props: { role: "nurse" } },
    { path: "/doctor", name: "doctor", component: RolePlaceholderView, props: { role: "doctor" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

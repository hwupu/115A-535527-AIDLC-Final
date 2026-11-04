import { createRouter, createWebHistory } from "vue-router";
import RoleSelectView from "./views/RoleSelectView.vue";
import RolePlaceholderView from "./views/RolePlaceholderView.vue";
import NurseView from "./views/NurseView.vue";
import PatientView from "./views/PatientView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "role-select", component: RoleSelectView },
    { path: "/patient", name: "patient", component: PatientView },
    // Placeholders: replaced by real screens in later tickets.
    { path: "/nurse", name: "nurse", component: NurseView },
    { path: "/doctor", name: "doctor", component: RolePlaceholderView, props: { role: "doctor" } },
    { path: "/admin", name: "admin", component: RolePlaceholderView, props: { role: "admin" } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

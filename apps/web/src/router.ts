import { createRouter, createWebHistory } from "vue-router";
import RoleSelectView from "./views/RoleSelectView.vue";
import AdminView from "./views/AdminView.vue";
import DoctorListView from "./views/DoctorListView.vue";
import DoctorReportView from "./views/DoctorReportView.vue";
import NurseView from "./views/NurseView.vue";
import PatientView from "./views/PatientView.vue";

export const router = createRouter({
  history: createWebHistory(),
  // Back from a report returns to the same place in the (cached) list.
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  routes: [
    { path: "/", name: "role-select", component: RoleSelectView },
    { path: "/patient", name: "patient", component: PatientView },
    { path: "/nurse", name: "nurse", component: NurseView },
    { path: "/doctor", name: "doctor", component: DoctorListView },
    { path: "/doctor/:id", name: "doctor-report", component: DoctorReportView, props: true },
    { path: "/admin", name: "admin", component: AdminView },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

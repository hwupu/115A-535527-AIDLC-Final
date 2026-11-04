<script setup lang="ts">
import NurseHome from "@/components/nurse/NurseHome.vue";
import NurseSession from "@/components/nurse/NurseSession.vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { useNurseSessionStore } from "@/stores/nurseSession";

const store = useNurseSessionStore();
</script>

<template>
  <RoleHeader role="nurse" class="print:hidden" />
  <NurseSession v-if="store.active" />
  <NurseHome v-else />
</template>

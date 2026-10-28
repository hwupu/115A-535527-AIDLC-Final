<script setup lang="ts">
import { computed } from "vue";
import { roleById, type RoleId } from "../roles";

const props = defineProps<{ role: RoleId }>();
const role = computed(() => roleById(props.role));
</script>

<template>
  <header class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
    <h1 class="text-xl font-semibold">{{ role.icon }} {{ role.label }}</h1>
    <RouterLink
      to="/"
      class="rounded-lg border border-slate-300 px-4 py-3 text-base font-medium hover:bg-slate-100"
    >
      切換角色
    </RouterLink>
  </header>
  <main class="mx-auto max-w-5xl px-6 py-10">
    <p class="text-lg text-slate-600">{{ role.description }}。此畫面尚在建置中。</p>
  </main>
</template>

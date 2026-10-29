<script setup lang="ts">
import { computed } from "vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { roleById, type RoleId } from "@/roles";

const props = defineProps<{ role: RoleId }>();
const role = computed(() => roleById(props.role));
</script>

<template>
  <RoleHeader :role="props.role" />
  <main class="mx-auto max-w-5xl px-6 py-10">
    <p class="text-xl text-muted-foreground">{{ role.description }}。此畫面尚在建置中。</p>
  </main>
</template>

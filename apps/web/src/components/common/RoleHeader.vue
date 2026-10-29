<script setup lang="ts">
import { computed } from "vue";
import { roleById, type RoleId } from "@/roles";
import { Button } from "@/components/ui/button";

const props = defineProps<{ role: RoleId }>();
const role = computed(() => roleById(props.role));
</script>

<template>
  <header class="flex items-center justify-between gap-4 border-b-2 border-border bg-card px-6 py-3">
    <h1 class="flex items-center gap-3 text-2xl font-bold">
      <component :is="role.icon" class="size-8 text-primary" aria-hidden="true" />
      {{ role.label }}
    </h1>
    <Button variant="outline" as-child>
      <RouterLink to="/">切換角色</RouterLink>
    </Button>
  </header>
</template>

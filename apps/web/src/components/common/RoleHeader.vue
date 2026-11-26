<script setup lang="ts">
// Default slot: screen context next to the role (back button, 就診號), so staff screens need no second bar.
import { computed } from "vue";
import { roleById, type RoleId } from "@/roles";
import { Button } from "@/components/ui/button";

const props = defineProps<{ role: RoleId }>();
const role = computed(() => roleById(props.role));
</script>

<template>
  <header class="flex items-center gap-4 border-b-2 border-border bg-card px-6 py-3 compact:gap-3 compact:border-b compact:px-4 compact:py-1.5">
    <h1 class="flex shrink-0 items-center gap-3 text-2xl font-bold compact:gap-2 compact:text-xl">
      <component :is="role.icon" class="size-8 text-primary compact:size-6" aria-hidden="true" />
      {{ role.label }}
    </h1>
    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <slot />
    </div>
    <Button variant="outline" as-child>
      <RouterLink to="/">切換角色</RouterLink>
    </Button>
  </header>
</template>

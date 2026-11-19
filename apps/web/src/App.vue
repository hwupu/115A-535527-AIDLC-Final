<script setup lang="ts">
import { watchEffect } from "vue";
import { useRoute } from "vue-router";

// Staff routes are marked `compact` in router.ts; style.css sizes text from this attribute.
const route = useRoute();
watchEffect(() => (document.documentElement.dataset.density = route.meta.compact ? "compact" : "comfortable"));
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <RouterView />
  </div>
</template>

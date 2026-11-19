<script setup lang="ts">
import { roles } from "@/roles";
</script>

<template>
  <!-- Exactly one screen: the role buttons share whatever height is left, so there is no scrollbar (phones may scroll). -->
  <main class="mx-auto flex min-h-dvh max-w-6xl flex-col px-6 py-6 sm:h-dvh">
    <h1 class="text-center text-3xl font-bold tracking-tight md:text-4xl">AI 語音檢傷問診輔助系統</h1>
    <p class="mt-2 text-center text-xl text-muted-foreground">請選擇您的角色（示範用）</p>

    <!-- Tablet: 2×2 large buttons; wide desktop: one row of four; phone: stacked. -->
    <nav class="mt-6 grid min-h-0 flex-1 gap-5 sm:grid-cols-2 sm:grid-rows-2 2xl:grid-cols-4 2xl:grid-rows-1" aria-label="角色選擇">
      <RouterLink
        v-for="role in roles"
        :key="role.id"
        :to="role.path"
        class="group flex min-h-40 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-border bg-card p-6 text-center shadow-sm transition hover:border-primary hover:shadow-md active:scale-[0.98] sm:min-h-0"
      >
        <component :is="role.icon" class="size-14 text-primary" aria-hidden="true" />
        <span class="text-2xl font-bold">{{ role.label }}</span>
        <span class="text-lg text-muted-foreground">{{ role.description }}</span>
      </RouterLink>
    </nav>
  </main>
</template>

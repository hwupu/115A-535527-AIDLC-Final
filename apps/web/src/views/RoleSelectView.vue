<script setup lang="ts">
import { roles } from "../roles";
</script>

<template>
  <main class="mx-auto flex min-h-[calc(100dvh-2.5rem)] max-w-5xl flex-col justify-center px-6 py-10">
    <h1 class="text-center text-3xl font-bold tracking-tight md:text-4xl">AI 語音檢傷問診輔助系統</h1>
    <p class="mt-3 text-center text-lg text-slate-600">請選擇您的角色（示範用）</p>

    <!-- Tablet: three large buttons in a row (landscape) or stacked (portrait / phone). -->
    <nav class="mt-10 grid gap-5 md:grid-cols-3" aria-label="角色選擇">
      <RouterLink
        v-for="role in roles"
        :key="role.id"
        :to="role.path"
        class="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-sky-500 hover:shadow-md focus-visible:outline-4 focus-visible:outline-sky-500 active:scale-[0.98] md:min-h-72"
      >
        <span class="text-6xl" aria-hidden="true">{{ role.icon }}</span>
        <span class="text-2xl font-semibold">{{ role.label }}</span>
        <span class="text-base text-slate-600">{{ role.description }}</span>
      </RouterLink>
    </nav>
  </main>
</template>

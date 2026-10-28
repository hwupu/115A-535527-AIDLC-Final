<script setup lang="ts">
import { onMounted, ref } from "vue";

const status = ref("檢查中…");

onMounted(async () => {
  try {
    const res = await fetch("/api/health");
    status.value = res.ok ? "api 連線正常" : `api 回應 ${res.status}`;
  } catch {
    status.value = "api 無法連線";
  }
});
</script>

<template>
  <main>
    <h1>AI 語音檢傷問診輔助系統</h1>
    <p>骨架（stub）。{{ status }}</p>
  </main>
</template>

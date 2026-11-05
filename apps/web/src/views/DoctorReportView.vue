<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";
import { storeToRefs } from "pinia";
import { onUnmounted } from "vue";
import ReadonlyReport from "@/components/doctor/ReadonlyReport.vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/composables/usePolling";
import { useDoctorStore } from "@/stores/doctor";

const props = defineProps<{ id: string }>();
const store = useDoctorStore();
const { report, reportState, reportError } = storeToRefs(store);

// Until the nurse confirms, keep checking so the report appears by itself.
usePolling(() => reportState.value !== "ready" && store.loadReport(props.id), 4000);
onUnmounted(() => store.closeReport());
</script>

<template>
  <RoleHeader role="doctor">
    <Button variant="outline" as-child>
      <RouterLink to="/doctor">
        <ArrowLeft aria-hidden="true" />
        返回清單
      </RouterLink>
    </Button>
  </RoleHeader>
  <main class="mx-auto max-w-6xl px-4 py-3">
    <p v-if="reportState === 'loading'" class="text-lg text-muted-foreground">讀取中…</p>
    <section v-else-if="reportState === 'waiting'" class="rounded-lg bg-warning px-4 py-3 text-warning-foreground" role="status">
      <h2 class="text-xl font-bold">尚未確認</h2>
      <p class="text-lg">護理師還沒有儲存這位病患的報告。確認後會自動顯示在這裡。</p>
    </section>
    <p v-else-if="reportState === 'error'" class="text-lg font-semibold text-destructive" role="alert">{{ reportError }}</p>
    <ReadonlyReport v-else-if="report" :report="report" />
  </main>
</template>

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
  <RoleHeader role="doctor" />
  <main class="mx-auto max-w-4xl px-6 py-6">
    <Button variant="outline" size="lg" class="mb-4" as-child>
      <RouterLink to="/doctor">
        <ArrowLeft aria-hidden="true" />
        返回清單
      </RouterLink>
    </Button>

    <p v-if="reportState === 'loading'" class="text-xl text-muted-foreground">讀取中…</p>
    <section v-else-if="reportState === 'waiting'" class="rounded-xl border-2 border-warning-foreground/50 bg-warning p-6 text-warning-foreground" role="status">
      <h2 class="text-2xl font-bold">尚未確認</h2>
      <p class="mt-1 text-lg">護理師還沒有儲存這位病患的報告。確認後會自動顯示在這裡。</p>
    </section>
    <p v-else-if="reportState === 'error'" class="text-lg font-semibold text-destructive" role="alert">{{ reportError }}</p>
    <ReadonlyReport v-else-if="report" :report="report" />
  </main>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";
import NurseHome from "@/components/nurse/NurseHome.vue";
import NurseSession from "@/components/nurse/NurseSession.vue";
import RoleHeader from "@/components/common/RoleHeader.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNurseSessionStore } from "@/stores/nurseSession";

const store = useNurseSessionStore();
</script>

<template>
  <RoleHeader role="nurse" class="print:hidden">
    <template v-if="store.active">
      <Button variant="outline" @click="store.leave()">
        <ArrowLeft aria-hidden="true" />
        返回清單
      </Button>
      <span class="text-xl font-bold">就診號 {{ store.visitNo }}</span>
      <Badge :variant="store.confirmed ? 'default' : 'outline'">
        {{ store.confirmed ? "已確認" : store.status === "in_progress" ? "進行中" : store.status }}
      </Badge>
    </template>
  </RoleHeader>
  <NurseSession v-if="store.active" />
  <NurseHome v-else />
</template>

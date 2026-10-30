<script setup lang="ts">
// C13 contract (keep props and emits; restyle or extend freely):
//   props: def (what the field is), field (value, status, source), selected, readonly
//   emits: select(path)  - nurse tapped the field/source, so the transcript highlights the source sentence
//          edit(path, value) - nurse saved a value (null clears it back to 未提及)
//          confirm(path) - nurse accepts the AI draft as it is
import { Check, Pencil, Quote } from "@lucide/vue";
import { computed, ref } from "vue";
import FieldStatusBadge from "./FieldStatusBadge.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Field, FieldValue } from "@/api";
import { formatValue, parseInput, type FieldDef } from "@/report/schema";

const props = defineProps<{ def: FieldDef; field: Field<FieldValue>; selected?: boolean; readonly?: boolean }>();
const emit = defineEmits<{
  select: [path: string];
  edit: [path: string, value: FieldValue];
  confirm: [path: string];
}>();

const display = computed(() => formatValue(props.def, props.field.value));
const editing = ref(false);
const draft = ref("");
const invalid = ref(false);

const choices = computed(() =>
  props.def.kind === "yesno" ? ["有", "無"] : props.def.kind === "bool" ? ["是", "否"] : (props.def.options ?? []),
);
const isChoice = computed(() => ["yesno", "bool", "choice"].includes(props.def.kind));

function startEdit() {
  draft.value =
    props.def.kind === "list" && Array.isArray(props.field.value)
      ? props.field.value.join("，")
      : props.def.kind === "date" && props.field.value
        ? formatValue(props.def, props.field.value)
        : props.field.value === null
          ? ""
          : String(props.field.value);
  invalid.value = false;
  editing.value = true;
}

function save(raw: string) {
  const value = parseInput(props.def, raw);
  if (value === undefined) {
    invalid.value = true;
    return;
  }
  emit("edit", props.def.path, value);
  editing.value = false;
}
</script>

<template>
  <li
    :id="`field-${def.path}`"
    class="rounded-xl border-2 bg-card p-3"
    :class="selected ? 'border-primary bg-accent' : 'border-border'"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-base font-semibold text-muted-foreground">{{ def.label }}</p>
        <p v-if="!editing" class="text-xl font-semibold wrap-break-word" :class="!display && 'font-normal text-muted-foreground'">
          {{ display || "未提及" }}
        </p>
      </div>
      <FieldStatusBadge :status="field.status" class="shrink-0" />
    </div>

    <button
      v-if="field.source_span && !editing"
      type="button"
      class="mt-2 flex min-h-12 w-full items-start gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left text-base text-muted-foreground hover:bg-muted"
      :aria-pressed="selected"
      @click="emit('select', def.path)"
    >
      <Quote class="mt-1 size-4 shrink-0" aria-hidden="true" />
      <span>來源：「{{ field.source_span }}」</span>
    </button>

    <div v-if="editing" class="mt-3 grid gap-3">
      <div v-if="isChoice" class="flex flex-wrap gap-2">
        <Button v-for="c in choices" :key="c" variant="outline" size="lg" @click="save(c)">{{ c }}</Button>
        <Button variant="ghost" size="lg" @click="save('')">清除</Button>
      </div>
      <Textarea v-else-if="def.kind === 'longtext'" v-model="draft" :aria-label="def.label" />
      <Input
        v-else
        v-model="draft"
        :aria-label="def.label"
        :inputmode="def.kind === 'number' ? 'decimal' : 'text'"
        :placeholder="def.hint"
        @keydown.enter="save(draft)"
      />
      <p v-if="invalid" class="text-base font-semibold text-destructive" role="alert">格式不正確，請再確認。</p>
      <p v-if="def.hint && !isChoice" class="text-base text-muted-foreground">{{ def.hint }}</p>
      <div class="flex gap-2">
        <Button v-if="!isChoice" size="lg" @click="save(draft)">儲存</Button>
        <Button variant="outline" size="lg" @click="editing = false">取消</Button>
      </div>
    </div>

    <div v-else-if="!readonly" class="mt-3 flex flex-wrap gap-2">
      <Button v-if="field.status === 'AI 草稿'" size="lg" @click="emit('confirm', def.path)">
        <Check aria-hidden="true" />
        確認
      </Button>
      <Button variant="outline" size="lg" @click="startEdit">
        <Pencil aria-hidden="true" />
        {{ field.status === "未提及" ? "填寫" : "修改" }}
      </Button>
    </div>
  </li>
</template>

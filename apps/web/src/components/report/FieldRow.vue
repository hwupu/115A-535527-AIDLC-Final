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
  <!-- One row per field: label and value on the left, status and actions on the right. An empty field is one line. -->
  <li
    :id="`field-${def.path}`"
    class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-3 py-1.5"
    :class="selected && 'bg-accent'"
  >
    <div class="min-w-0">
      <p class="text-base font-semibold text-muted-foreground">{{ def.label }}</p>
      <p v-if="!editing && display" class="text-lg leading-snug font-semibold wrap-break-word">{{ display }}</p>
      <button
        v-if="field.source_span && !editing"
        type="button"
        class="flex min-h-12 w-full items-center gap-1.5 rounded-md text-left text-base text-muted-foreground hover:bg-muted"
        :class="selected && 'text-foreground'"
        :aria-pressed="selected"
        @click="emit('select', def.path)"
      >
        <Quote class="size-4 shrink-0" aria-hidden="true" />
        <span>來源：「{{ field.source_span }}」</span>
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-2">
      <FieldStatusBadge :status="field.status" />
      <template v-if="!editing && !readonly">
        <Button v-if="field.status === 'AI 草稿'" @click="emit('confirm', def.path)">
          <Check aria-hidden="true" />
          確認
        </Button>
        <Button variant="outline" @click="startEdit">
          <Pencil aria-hidden="true" />
          {{ field.status === "未提及" ? "填寫" : "修改" }}
        </Button>
      </template>
    </div>

    <div v-if="editing" class="col-span-2 mt-1 grid gap-2">
      <div v-if="isChoice" class="flex flex-wrap gap-2">
        <Button v-for="c in choices" :key="c" variant="outline" @click="save(c)">{{ c }}</Button>
        <Button variant="ghost" @click="save('')">清除</Button>
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
      <div class="flex gap-2 pb-1">
        <Button v-if="!isChoice" @click="save(draft)">儲存</Button>
        <Button variant="outline" @click="editing = false">取消</Button>
      </div>
    </div>
  </li>
</template>

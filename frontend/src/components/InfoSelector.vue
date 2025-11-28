<template>
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-3">
      Select Information Types to Extract:
    </label>
    <div class="flex flex-wrap gap-3">
      <label
        v-for="option in options"
        :key="option.value"
        class="flex items-center gap-2 cursor-pointer px-4 py-2 border-2 rounded-md transition-colors hover:border-indigo-500 hover:bg-indigo-50"
        :class="selected.includes(option.value) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
      >
        <input
          type="checkbox"
          :value="option.value"
          :checked="selected.includes(option.value)"
          @change="handleChange(option.value, $event.target.checked)"
          class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <span class="text-sm font-medium text-gray-700">{{ option.label }}</span>
      </label>
    </div>

    <div class="mt-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Custom keywords (optional)
      </label>
      <div class="flex flex-col gap-3 sm:flex-row">
        <input
          v-model="customKeywordInput"
          type="text"
          placeholder="e.g. payment gateway, reseller"
          @keyup.enter="addCustomKeyword"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm px-3 py-2"
        />
        <button
          type="button"
          @click="addCustomKeyword"
          class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!customKeywordInput.trim()"
        >
          Add keyword
        </button>
      </div>

      <div v-if="customKeywords.length" class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="keyword in customKeywords"
          :key="keyword"
          class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm text-indigo-700 border border-indigo-200"
        >
          <span class="font-medium">{{ keyword }}</span>
          <button
            type="button"
            class="text-indigo-500 hover:text-indigo-700"
            @click="removeCustomKeyword(keyword)"
            aria-label="Remove keyword"
          >
            &times;
          </button>
        </span>
      </div>
      <p class="mt-3 text-xs text-gray-500">
        We will look for these words across every scraped page and include the findings alongside the standard data points.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const CUSTOM_PREFIX = 'custom:';

const options = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'phone', label: 'Phone' },
  { value: 'whmcs', label: 'WHMCS' }
];

const parseModelValue = (value = []) => {
  const base = [];
  const custom = [];
  value.forEach(item => {
    if (typeof item !== 'string') {
      return;
    }
    if (item.startsWith(CUSTOM_PREFIX)) {
      const keyword = item.slice(CUSTOM_PREFIX.length).trim();
      if (keyword) {
        custom.push(keyword);
      }
    } else {
      base.push(item);
    }
  });
  return { base, custom };
};

const { base, custom } = parseModelValue(props.modelValue);

const selected = ref([...base]);
const customKeywords = ref([...custom]);
const customKeywordInput = ref('');

const emitUpdate = () => {
  const combined = [
    ...selected.value,
    ...customKeywords.value.map(keyword => `${CUSTOM_PREFIX}${keyword}`)
  ];
  emit('update:modelValue', combined);
};

const handleChange = (value, checked) => {
  if (checked) {
    selected.value = Array.from(new Set([...selected.value, value]));
  } else {
    selected.value = selected.value.filter(v => v !== value);
  }
  emitUpdate();
};

const addCustomKeyword = () => {
  const keyword = customKeywordInput.value.trim();
  if (!keyword) {
    return;
  }

  const exists = customKeywords.value.some(k => k.toLowerCase() === keyword.toLowerCase());
  if (!exists) {
    customKeywords.value.push(keyword);
    emitUpdate();
  }
  customKeywordInput.value = '';
};

const removeCustomKeyword = (keyword) => {
  customKeywords.value = customKeywords.value.filter(k => k !== keyword);
  emitUpdate();
};

watch(() => props.modelValue, (newValue) => {
  const { base: newBase, custom: newCustom } = parseModelValue(newValue);
  selected.value = [...newBase];
  customKeywords.value = [...newCustom];
}, { deep: true });
</script>

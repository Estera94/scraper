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

const options = [
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'twitter', label: 'Twitter' },
  { value: 'phone', label: 'Phone' },
  { value: 'whmcs', label: 'WHMCS' }
];

const selected = ref([...props.modelValue]);

const handleChange = (value, checked) => {
  if (checked) {
    if (!selected.value.includes(value)) {
      selected.value.push(value);
    }
  } else {
    selected.value = selected.value.filter(v => v !== value);
  }
  emit('update:modelValue', [...selected.value]);
};

watch(() => props.modelValue, (newValue) => {
  selected.value = [...newValue];
}, { deep: true });
</script>

<template>
  <div class="mb-6">
    <label for="websites" class="block text-sm font-medium text-gray-700 mb-2">
      Websites (one per line or comma-separated):
    </label>
    <textarea
      id="websites"
      v-model="websitesInput"
      placeholder="acumenLogs.com&#10;guru.co.uk&#10;example.com"
      rows="6"
      class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
    ></textarea>
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

const websitesInput = ref('');

watch(websitesInput, (newValue) => {
  // Parse websites from input (support both newline and comma-separated)
  const websites = newValue
    .split(/[,\n]/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
  emit('update:modelValue', websites);
});

watch(() => props.modelValue, (newValue) => {
  if (newValue.length === 0) {
    websitesInput.value = '';
  }
}, { immediate: true });
</script>

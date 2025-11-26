<template>
  <div class="website-form">
    <label for="websites">Websites (one per line or comma-separated):</label>
    <textarea
      id="websites"
      v-model="websitesInput"
      placeholder="acumenLogs.com&#10;guru.co.uk&#10;example.com"
      rows="6"
      class="website-input"
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

<style scoped>
.website-form {
  margin-bottom: 1.5rem;
}

.website-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.website-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s;
}

.website-input:focus {
  outline: none;
  border-color: #4a90e2;
}
</style>


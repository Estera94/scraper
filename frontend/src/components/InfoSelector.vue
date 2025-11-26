<template>
  <div class="info-selector">
    <label>Select Information Types to Extract:</label>
    <div class="checkbox-group">
      <label v-for="option in options" :key="option.value" class="checkbox-label">
        <input
          type="checkbox"
          :value="option.value"
          :checked="selected.includes(option.value)"
          @change="handleChange(option.value, $event.target.checked)"
        />
        <span>{{ option.label }}</span>
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

<style scoped>
.info-selector {
  margin-bottom: 1.5rem;
}

.info-selector > label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #333;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.3s;
  user-select: none;
}

.checkbox-label:hover {
  border-color: #4a90e2;
  background-color: #f0f7ff;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4a90e2;
}

.checkbox-label span {
  font-size: 1rem;
  color: #333;
}
</style>


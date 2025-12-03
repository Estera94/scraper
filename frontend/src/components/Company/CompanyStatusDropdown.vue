<template>
  <div class="relative" ref="dropdownContainer">
    <!-- Status Dropdown Button (smaller, icon-only when status exists) -->
    <button
      type="button"
      @click.stop="toggleDropdown"
      class="inline-flex items-center justify-center px-2 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      :disabled="loading"
      :title="status ? `Change status (${status})` : 'Set status'"
    >
      <span v-if="loading" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
      <svg
        v-else
        class="w-4 h-4"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      @click.stop
      class="absolute z-50 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
      style="min-width: 14rem; right: 0;"
    >
      <div class="py-1">
        <!-- Default Status Options -->
        <button
          v-for="defaultStatus in defaultStatuses"
          :key="defaultStatus"
          type="button"
          @click="selectStatus(defaultStatus)"
          class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
          :class="{ 'bg-gray-50 font-medium': status === defaultStatus }"
        >
          {{ defaultStatus }}
        </button>

        <!-- Divider -->
        <div class="border-t border-gray-200 my-1"></div>

        <!-- Saved Custom Statuses -->
        <div v-if="savedCustomStatuses.length > 0 && !showCustomInput">
          <button
            v-for="customStatus in savedCustomStatuses"
            :key="customStatus.id"
            type="button"
            @click="selectCustomStatus(customStatus)"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center gap-2"
            :class="{ 'bg-gray-50 font-medium': status === customStatus.label }"
          >
            <span
              class="w-3 h-3 rounded-full border border-gray-300"
              :style="{ backgroundColor: getColorValue(customStatus.color) }"
            ></span>
            {{ customStatus.label }}
          </button>
          <div class="border-t border-gray-200 my-1"></div>
        </div>

        <!-- Custom Status Input -->
        <div v-if="showCustomInput" class="px-4 py-2">
          <input
            ref="customInput"
            v-model="customStatusValue"
            type="text"
            placeholder="Enter custom status"
            maxlength="50"
            @keyup.enter="saveCustomStatus"
            @keyup.esc="cancelCustomStatus"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
          />
          
          <!-- Color Picker -->
          <div class="mb-2">
            <label class="block text-xs font-medium text-gray-700 mb-1">Color</label>
            <div class="flex gap-2 flex-wrap">
              <button
                v-for="colorOption in colorOptions"
                :key="colorOption.value"
                type="button"
                @click="selectedColor = colorOption.value"
                class="w-8 h-8 rounded-full border-2 transition-all"
                :class="selectedColor === colorOption.value ? 'border-gray-800 scale-110' : 'border-gray-300'"
                :style="{ backgroundColor: colorOption.value }"
                :title="colorOption.label"
              ></button>
              <input
                type="color"
                v-model="selectedColor"
                class="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                title="Custom color"
              />
            </div>
          </div>
          
          <div class="flex gap-2 mt-2">
            <button
              type="button"
              @click="saveCustomStatus"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Save
            </button>
            <button
              type="button"
              @click="cancelCustomStatus"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
            >
              Cancel
            </button>
          </div>
        </div>

        <!-- Add Custom Status Button -->
        <button
          v-else
          type="button"
          @click="showCustomInput = true"
          class="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:bg-indigo-50"
        >
          + Add Custom Status
        </button>

        <!-- Clear Status Option -->
        <div v-if="status" class="border-t border-gray-200 my-1"></div>
        <button
          v-if="status"
          type="button"
          @click="clearStatus"
          class="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
        >
          Clear Status
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
import { updateCompanyStatus, getCustomStatuses, createCustomStatus } from '../../services/api.js';

const props = defineProps({
  companyId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: null
  },
  customStatusColorMap: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:status', 'status-changed', 'status-error', 'custom-status-created']);

const defaultStatuses = ['Contacted', 'Waiting Response', 'Not Interested'];
const isOpen = ref(false);
const showCustomInput = ref(false);
const customStatusValue = ref('');
const selectedColor = ref('#6B7280'); // Default gray
const loading = ref(false);
const customInput = ref(null);
const dropdownContainer = ref(null);
const savedCustomStatuses = ref([]);

const colorOptions = [
  { label: 'Gray', value: '#6B7280' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Yellow', value: '#F59E0B' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Teal', value: '#14B8A6' }
];

const getColorValue = (color) => {
  // If it's a hex color, return it; otherwise try to convert named colors
  if (color.startsWith('#')) {
    return color;
  }
  // Map common color names to hex
  const colorMap = {
    gray: '#6B7280',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    orange: '#F97316',
    red: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
    indigo: '#6366F1',
    teal: '#14B8A6'
  };
  return colorMap[color.toLowerCase()] || color;
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value && showCustomInput.value) {
    showCustomInput.value = false;
    customStatusValue.value = '';
  }
};

const handleClickOutside = (event) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target)) {
    isOpen.value = false;
    showCustomInput.value = false;
    customStatusValue.value = '';
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadCustomStatuses();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Removed getStatusButtonClass - no longer needed since we show status as a badge

const selectStatus = async (newStatus) => {
  if (newStatus === props.status) {
    isOpen.value = false;
    return;
  }

  await updateStatus(newStatus);
};

const saveCustomStatus = async () => {
  const trimmed = customStatusValue.value.trim();
  if (!trimmed) {
    return;
  }

  // Save the custom status with color
  try {
    await createCustomStatus(trimmed, selectedColor.value);
    await loadCustomStatuses();
    emit('custom-status-created', { label: trimmed, color: selectedColor.value });
  } catch (error) {
    console.error('Error saving custom status:', error);
  }

  // Apply the status to the company
  await updateStatus(trimmed);
  showCustomInput.value = false;
  customStatusValue.value = '';
  selectedColor.value = '#6B7280'; // Reset to default
};

const cancelCustomStatus = () => {
  showCustomInput.value = false;
  customStatusValue.value = '';
  selectedColor.value = '#6B7280'; // Reset to default
};

const selectCustomStatus = async (customStatus) => {
  await updateStatus(customStatus.label);
};

const loadCustomStatuses = async () => {
  try {
    const response = await getCustomStatuses();
    savedCustomStatuses.value = response.customStatuses || [];
  } catch (error) {
    console.error('Error loading custom statuses:', error);
  }
};

const clearStatus = async () => {
  await updateStatus(null);
};

const updateStatus = async (newStatus) => {
  loading.value = true;
  try {
    const response = await updateCompanyStatus(props.companyId, newStatus);
    if (response.company) {
      emit('update:status', response.company.status);
      emit('status-changed', response.company.status);
    }
    isOpen.value = false;
    showCustomInput.value = false;
    customStatusValue.value = '';
  } catch (error) {
    console.error('Error updating status:', error);
    // Emit error event for parent to handle if needed
    emit('status-error', error);
  } finally {
    loading.value = false;
  }
};

watch(showCustomInput, async (newVal) => {
  if (newVal) {
    await nextTick();
    if (customInput.value) {
      customInput.value.focus();
    }
  }
});
</script>


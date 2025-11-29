<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">Notes & comments</h3>
        <p class="text-sm text-gray-500">Share context for your team while prospecting.</p>
      </div>
      <button
        type="button"
        class="text-sm text-gray-600 hover:text-gray-900"
        @click="refresh"
      >
        Refresh
      </button>
    </div>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2" for="note-input">
        Add a note
      </label>
      <textarea
        id="note-input"
        v-model="draft"
        rows="3"
        class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
        placeholder="Next steps, objections, or reminders..."
      ></textarea>
      <div class="mt-2 flex justify-between items-center">
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          :disabled="!draft.trim() || submitting"
          @click="submit"
        >
          <span v-if="submitting">Saving...</span>
          <span v-else>Save note</span>
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-500">
      Loading notes...
    </div>

    <div v-else-if="notes.length === 0" class="text-sm text-gray-500">
      No notes yet. Be the first to add context for this company.
    </div>

    <ul v-else class="space-y-3">
      <li
        v-for="note in notes"
        :key="note.id"
        class="border border-gray-100 rounded-md p-4"
      >
        <div class="flex justify-between items-center mb-2">
          <div>
            <p class="text-sm font-semibold text-gray-800">
              {{ note.user?.email || 'You' }}
            </p>
            <p class="text-xs text-gray-500">
              {{ formatDate(note.createdAt) }}
            </p>
          </div>
          <button
            type="button"
            class="text-xs text-red-600 hover:text-red-700"
            @click="$emit('delete', note.id)"
          >
            Delete
          </button>
        </div>
        <p class="text-sm text-gray-900 whitespace-pre-line">
          {{ note.body }}
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  notes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['create', 'delete', 'refresh']);

const draft = ref('');
const submitting = ref(false);
const errorMessage = ref('');

const refresh = () => emit('refresh');

const submit = async () => {
  const value = draft.value.trim();
  if (!value || submitting.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = '';
  try {
    await emit('create', value);
    draft.value = '';
  } catch (error) {
    errorMessage.value = error.message || 'Failed to save note.';
  } finally {
    submitting.value = false;
  }
};

watch(() => props.error, (newVal) => {
  if (newVal) {
    errorMessage.value = newVal;
  }
});

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};
</script>



<template>
  <div class="mt-8">
    <div v-if="results.length === 0" class="text-center py-12 text-gray-500 italic">
      No results yet. Start scraping to see results here.
    </div>
    
    <div v-else>
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Scraping Results</h2>
        <div class="flex gap-2">
          <button
            @click="exportResults"
            class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
          >
            Export JSON
          </button>
          <button
            @click="handleDeleteAll"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Delete All
          </button>
        </div>
      </div>
      
      <div class="space-y-4">
        <div
          v-for="result in results"
          :key="result.id || result.website"
          class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h3 class="text-xl font-semibold text-gray-900">{{ result.website }}</h3>
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500">{{ formatDate(result.timestamp) }}</span>
              <button
                @click="handleDelete(result.id || result.website)"
                class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                :title="'Delete ' + result.website"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <div v-if="result.error || !result.results" class="text-red-700 bg-red-50 p-3 rounded-md">
            Error: {{ result.error || 'Failed to scrape website' }}
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="(value, key) in result.results"
              :key="key"
              class="flex items-center gap-3 py-2"
            >
              <span class="text-sm font-semibold text-gray-600 min-w-[100px]">
                {{ formatLabel(key) }}:
              </span>
              <span v-if="key === 'whmcs'" class="text-sm text-gray-900">
                {{ value ? 'Yes' : 'No' }}
              </span>
              <span v-else-if="value" class="flex items-center gap-2 text-sm text-gray-900">
                <span class="break-all">{{ value }}</span>
                <button
                  @click="copyToClipboard(value)"
                  class="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                  :title="'Copy ' + formatLabel(key)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </span>
              <span v-else class="text-sm text-gray-400 italic">Not found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  results: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['delete', 'delete-all']);

const formatLabel = (key) => {
  const labels = {
    linkedin: 'LinkedIn',
    email: 'Email',
    twitter: 'Twitter',
    phone: 'Phone',
    whmcs: 'WHMCS'
  };
  return labels[key] || key;
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString();
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};

const exportResults = () => {
  const dataStr = JSON.stringify(props.results, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scraping-results-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const handleDelete = (id) => {
  if (confirm(`Are you sure you want to delete this result?`)) {
    emit('delete', id);
  }
};

const handleDeleteAll = () => {
  if (confirm('Are you sure you want to delete all results? This action cannot be undone.')) {
    emit('delete-all');
  }
};
</script>

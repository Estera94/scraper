<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">Scrape history</h3>
        <p class="text-sm text-gray-500">Each run captures the signals requested at that time.</p>
      </div>
      <button
        v-if="scrapes.length"
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        :disabled="loading || !hasMore"
        @click="$emit('load-more')"
      >
        {{ hasMore ? 'Load more' : 'All history loaded' }}
      </button>
    </div>

    <div v-if="!scrapes.length" class="text-sm text-gray-500">
      No scraping history yet. Run the scraper to populate this list.
    </div>

    <div class="space-y-4" v-else>
      <div
        v-for="scrape in scrapes"
        :key="scrape.id"
        class="border border-gray-100 rounded-lg p-4"
      >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
          <div>
            <p class="text-sm font-semibold text-gray-800">
              {{ formatDate(scrape.createdAt || scrape.timestamp) }}
            </p>
            <p class="text-xs text-gray-500">
              Tool: {{ scrape.tool }} · Signals: {{ (scrape.infoTypes || []).length }}
            </p>
          </div>
          <button
            type="button"
            class="text-sm text-red-600 hover:text-red-700"
            @click="$emit('delete', scrape.id)"
          >
            Delete run
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="field in getFields(scrape.results)"
            :key="field.key"
            class="border border-gray-100 rounded-md p-3"
          >
            <p class="text-xs font-semibold text-gray-500 uppercase mb-1">
              {{ field.label }}
            </p>
            <p v-if="field.key === 'whmcs'" class="text-sm text-gray-900">
              {{ formatBoolean(field.value) }}
            </p>
            <p v-else-if="field.value" class="text-sm text-gray-900 break-words">
              {{ field.value }}
            </p>
            <p v-else class="text-sm text-gray-400 italic">Not found</p>
          </div>
        </div>

        <div v-if="scrape.infoTypes?.length" class="mt-3">
          <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Signals requested</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="type in scrape.infoTypes"
              :key="type + scrape.id"
              class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700"
            >
              {{ formatInfoType(type) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  scrapes: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  }
});

defineEmits(['load-more', 'delete']);

const getFields = (results = {}) => ([
  { key: 'email', label: 'Email', value: results?.email },
  { key: 'phone', label: 'Phone', value: results?.phone },
  { key: 'linkedin', label: 'LinkedIn', value: results?.linkedin },
  { key: 'twitter', label: 'Twitter', value: results?.twitter },
  { key: 'whmcs', label: 'WHMCS', value: results?.whmcs }
]);

const formatBoolean = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
};

const formatDate = (value) => {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
};

const formatInfoType = (value) => {
  if (!value) return '';
  if (value.startsWith('custom:')) {
    return `Keyword: ${value.replace('custom:', '')}`;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};
</script>


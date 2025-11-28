<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">{{ displayName }}</h3>
        <p class="text-sm text-gray-500">
          <span v-if="scrapedAt">Last scraped {{ scrapedAt }}</span>
          <span v-else>Not scraped yet</span>
        </p>
      </div>
      <div class="flex gap-2">
        <router-link
          :to="{ name: 'CompanyProfile', params: { id: company.id } }"
          class="px-4 py-2 text-sm font-medium rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          View profile
        </router-link>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
          @click="$emit('delete', company.id)"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="field in fields"
        :key="field.key"
        class="flex flex-col border border-gray-100 rounded-md p-3"
      >
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {{ field.label }}
        </span>
        <span v-if="field.key === 'whmcs'" class="text-base text-gray-900 mt-1">
          {{ formatBoolean(field.value) }}
        </span>
        <span v-else-if="field.value" class="text-sm text-gray-900 mt-1 break-all">
          {{ field.value }}
        </span>
        <span v-else class="text-sm text-gray-400 mt-1 italic">
          Not found
        </span>
      </div>
    </div>

    <div
      v-if="customKeywords.length"
      class="mt-4 rounded-md bg-indigo-50 border border-indigo-100 p-3 text-sm text-indigo-800"
    >
      Custom keywords: {{ customKeywords.length }} tracked
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  company: {
    type: Object,
    required: true
  }
});

defineEmits(['delete']);

const normalizeSnapshot = (snapshot, fallbackDomain, fallbackDate) => {
  if (!snapshot) {
    return null;
  }

  if (snapshot.results) {
    return snapshot;
  }

  return {
    tool: snapshot.tool,
    scrapedAt: snapshot.scrapedAt || fallbackDate,
    website: snapshot.website || fallbackDomain,
    infoTypes: snapshot.infoTypes || [],
    results: snapshot
  };
};

const snapshot = computed(() => normalizeSnapshot(
  props.company?.latestSnapshot,
  props.company?.domain,
  props.company?.updatedAt
));

const results = computed(() => snapshot.value?.results || {});

const displayName = computed(() => props.company.displayName || props.company.domain);
const scrapedAt = computed(() => {
  const dateSource = snapshot.value?.scrapedAt || props.company?.updatedAt;
  if (!dateSource) {
    return '';
  }
  return new Date(dateSource).toLocaleString();
});

const fields = computed(() => ([
  { key: 'email', label: 'Email', value: results.value.email },
  { key: 'phone', label: 'Phone', value: results.value.phone },
  { key: 'linkedin', label: 'LinkedIn', value: results.value.linkedin },
  { key: 'twitter', label: 'Twitter', value: results.value.twitter },
  { key: 'whmcs', label: 'WHMCS', value: results.value.whmcs }
]));

const customKeywords = computed(() => results.value.customKeywords || []);

const formatBoolean = (value) => {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return 'Unknown';
};
</script>


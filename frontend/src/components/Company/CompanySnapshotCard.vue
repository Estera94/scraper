<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">Latest Snapshot</h3>
        <p class="text-sm text-gray-500">
          <span v-if="scrapedAt">Captured {{ scrapedAt }}</span>
          <span v-else>Not scraped yet</span>
        </p>
      </div>
      <span
        v-if="snapshot?.website"
        class="text-xs font-medium uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
      >
        {{ snapshot.website }}
      </span>
    </div>

    <div v-if="!snapshot">
      <p class="text-gray-500 text-sm">
        No scrape has been recorded for this company yet. Run the scraper to populate the profile.
      </p>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="field in fields"
          :key="field.key"
          class="border border-gray-100 rounded-md p-4"
        >
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {{ field.label }}
          </p>
          <p v-if="field.key === 'whmcs'" class="text-base text-gray-900">
            {{ formatBoolean(field.value) }}
          </p>
          <p v-else-if="field.value" class="text-sm text-gray-900 break-words">
            {{ field.value }}
          </p>
          <p v-else class="text-sm text-gray-400 italic">Not found</p>
        </div>
      </div>

      <div v-if="infoTypes.length" class="mt-6">
        <p class="text-sm font-semibold text-gray-700 mb-2">Signals requested</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="type in infoTypes"
            :key="type"
            class="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700"
          >
            {{ formatInfoType(type) }}
          </span>
        </div>
      </div>

      <div v-if="customKeywords.length" class="mt-6">
        <p class="text-sm font-semibold text-gray-700 mb-3">Custom keywords</p>
        <div class="space-y-2">
          <div
            v-for="keyword in customKeywords"
            :key="keyword.keyword"
            class="border border-gray-100 rounded-md p-3"
          >
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span class="text-sm font-medium text-gray-800">{{ keyword.keyword }}</span>
              <span
                class="text-xs font-semibold uppercase"
                :class="keyword.found ? 'text-green-700' : 'text-gray-400'"
              >
                {{ keyword.found ? 'Found' : 'Not found' }}
              </span>
            </div>
            <p
              v-for="(snippet, index) in keyword.matches"
              :key="index"
              class="text-xs text-gray-500 italic mt-1"
            >
              “…{{ snippet }}…”
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  snapshot: {
    type: Object,
    default: null
  }
});

const normalizedSnapshot = computed(() => {
  if (!props.snapshot) {
    return null;
  }
  if (props.snapshot.results) {
    return props.snapshot;
  }
  return {
    tool: props.snapshot.tool,
    scrapedAt: props.snapshot.scrapedAt,
    website: props.snapshot.website,
    infoTypes: props.snapshot.infoTypes || [],
    results: props.snapshot
  };
});

const results = computed(() => normalizedSnapshot.value?.results || {});

const scrapedAt = computed(() => {
  const dateSource = normalizedSnapshot.value?.scrapedAt;
  if (!dateSource) {
    return '';
  }
  return new Date(dateSource).toLocaleString();
});

const infoTypes = computed(() => normalizedSnapshot.value?.infoTypes || []);
const customKeywords = computed(() => results.value.customKeywords || normalizedSnapshot.value?.customKeywords || []);

const fields = computed(() => ([
  { key: 'email', label: 'Email', value: results.value.email },
  { key: 'phone', label: 'Phone', value: results.value.phone },
  { key: 'linkedin', label: 'LinkedIn', value: results.value.linkedin },
  { key: 'twitter', label: 'Twitter', value: results.value.twitter },
  { key: 'whmcs', label: 'WHMCS', value: results.value.whmcs }
]));

const formatBoolean = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Unknown';
};

const formatInfoType = (value) => {
  if (!value) return '';
  if (value.startsWith('custom:')) {
    return `Keyword: ${value.replace('custom:', '')}`;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};
</script>


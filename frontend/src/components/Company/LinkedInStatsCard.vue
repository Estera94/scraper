<template>
  <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h3 class="text-xl font-semibold text-gray-900">LinkedIn overview</h3>
        <p class="text-sm text-gray-500">
          Last scraped
          <span v-if="profile?.lastScrapedAt">
            {{ formatDate(profile.lastScrapedAt) }}
          </span>
          <span v-else>not yet</span>
        </p>
      </div>
      <div v-if="profile?.companyUrl">
        <a
          :href="profile.companyUrl"
          target="_blank"
          rel="noreferrer"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          View on LinkedIn →
        </a>
      </div>
    </div>

    <div v-if="!profile" class="text-sm text-gray-500">
      No LinkedIn data yet. Run a LinkedIn scrape to populate this section.
    </div>

    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="border border-gray-100 rounded-md p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase">Followers</p>
          <p class="text-2xl font-bold text-gray-900">{{ formatNumber(profile.followerCount) }}</p>
        </div>
        <div class="border border-gray-100 rounded-md p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase">Employee size</p>
          <p class="text-lg font-medium text-gray-900">{{ formatEmployeeRange(profile) }}</p>
        </div>
        <div class="border border-gray-100 rounded-md p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase">Industry</p>
          <p class="text-sm text-gray-900">{{ profile.industry || 'Unknown' }}</p>
        </div>
        <div class="border border-gray-100 rounded-md p-4">
          <p class="text-xs font-semibold text-gray-500 uppercase">Website</p>
          <a
            v-if="profile.website"
            :href="profile.website"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-indigo-600 break-all"
          >
            {{ profile.website }}
          </a>
          <p v-else class="text-sm text-gray-400">Not provided</p>
        </div>
      </div>

      <div v-if="profile.headline || profile.description" class="border border-gray-100 rounded-md p-4">
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">About</p>
        <p class="text-sm text-gray-900 whitespace-pre-line">
          {{ profile.headline || profile.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  profile: {
    type: Object,
    default: null
  }
});

const formatNumber = (value) => {
  if (!value && value !== 0) return '—';
  return new Intl.NumberFormat().format(value);
};

const formatEmployeeRange = (profile) => {
  if (!profile) return 'Unknown';
  if (profile.employeeCountMin && profile.employeeCountMax) {
    return `${formatNumber(profile.employeeCountMin)} - ${formatNumber(profile.employeeCountMax)}`;
  }
  if (profile.employeeCountMin) {
    return `${formatNumber(profile.employeeCountMin)}+`;
  }
  return 'Unknown';
};

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleString();
};
</script>



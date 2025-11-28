<template>
  <section class="mt-8">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Company Profiles</h2>
        <p class="text-sm text-gray-500">
          Every domain you scrape becomes a profile. Revisit it anytime for history and new tools.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          @click="$emit('refresh')"
        >
          Refresh
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!companies.length"
          @click="$emit('delete-all')"
        >
          Delete All
        </button>
      </div>
    </div>

    <div v-if="error" class="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
      {{ error }}
    </div>

    <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
      Loading companies...
    </div>

    <div
      v-else-if="companies.length === 0"
      class="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500"
    >
      No companies yet. Run a scrape to create your first profile.
    </div>

    <div v-else class="space-y-4">
      <CompanySummaryCard
        v-for="company in companies"
        :key="company.id"
        :company="company"
        @delete="$emit('delete', company.id)"
      />
    </div>
  </section>
</template>

<script setup>
import CompanySummaryCard from './CompanySummaryCard.vue';

defineProps({
  companies: {
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

defineEmits(['delete', 'delete-all', 'refresh']);
</script>


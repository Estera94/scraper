<template>
  <div class="min-h-screen bg-gray-50">
    <NavBar />
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Scrape Batches</h2>
            <router-link
              to="/tools/website-scraper"
              class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Create New Batch
            </router-link>
          </div>

          <!-- Status Filter -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="status in statusOptions"
                :key="status.value"
                @click="filters.status = filters.status === status.value ? null : status.value; applyFilters()"
                :class="[
                  'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                  filters.status === status.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ status.label }}
              </button>
            </div>
          </div>

          <!-- Results Count -->
          <div class="mb-4 text-sm text-gray-600">
            Showing {{ batches.length }} {{ batches.length === 1 ? 'batch' : 'batches' }}
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 rounded-md bg-red-50 border border-red-200 p-4">
          <div class="text-sm text-red-700">{{ error }}</div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-500">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p class="mt-2">Loading batches...</p>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="batches.length === 0"
          class="bg-white border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500"
        >
          <p>No batches yet. Create your first scrape batch to get started.</p>
        </div>

        <!-- Batch List -->
        <div v-else class="space-y-4">
          <div
            v-for="batch in batches"
            :key="batch.id"
            class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <h3 class="text-xl font-semibold text-gray-900">
                    Batch #{{ batch.id.slice(-8) }}
                  </h3>
                  <span
                    :class="[
                      'px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getStatusClass(batch.status)
                    ]"
                  >
                    {{ formatStatus(batch.status) }}
                  </span>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                  <span>Created: {{ formatDate(batch.createdAt) }}</span>
                  <span v-if="batch.updatedAt !== batch.createdAt">
                    Updated: {{ formatDate(batch.updatedAt) }}
                  </span>
                </div>

                <!-- Progress Bar -->
                <div class="mb-3">
                  <div class="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress: {{ batch.completedJobs }} / {{ batch.totalJobs }} jobs</span>
                    <span>{{ batch.progress }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div
                      :class="[
                        'h-2 rounded-full transition-all duration-300',
                        getProgressBarClass(batch.status)
                      ]"
                      :style="{ width: `${batch.progress}%` }"
                    ></div>
                  </div>
                </div>

                <!-- Job Summary -->
                <div class="flex flex-wrap items-center gap-3">
                  <span
                    v-if="batch.completedJobs > 0"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {{ batch.completedJobs }} completed
                  </span>
                  <span
                    v-if="batch.failedJobs > 0"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                  >
                    {{ batch.failedJobs }} failed
                  </span>
                  <span
                    v-if="batch.metadata?.infoTypes"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {{ batch.metadata.infoTypes.length }} info types
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <router-link
                  :to="{ name: 'BatchDetail', params: { id: batch.id } }"
                  class="px-4 py-2 text-sm font-medium rounded-md border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  View Details
                </router-link>
                <button
                  v-if="batch.status === 'pending'"
                  type="button"
                  class="px-4 py-2 text-sm font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  @click="handleDelete(batch.id)"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from '../components/NavBar.vue';
import { getBatches, deleteBatch } from '../services/batchApi.js';

const batches = ref([]);
const loading = ref(true);
const error = ref(null);

const filters = ref({
  status: null
});

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'queued', label: 'Queued' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' }
];

const applyFilters = async () => {
  loading.value = true;
  error.value = null;

  try {
    const filterParams = {
      status: filters.value.status || null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const response = await getBatches(filterParams);
    batches.value = response.batches || [];
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to load batches';
    console.error('Error loading batches:', err);
  } finally {
    loading.value = false;
  }
};

const handleDelete = async (batchId) => {
  if (!confirm('Are you sure you want to cancel this batch? This action cannot be undone.')) {
    return;
  }

  try {
    await deleteBatch(batchId);
    await applyFilters();
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Failed to delete batch';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    queued: 'Queued',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  };
  return statusMap[status] || status;
};

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800',
    queued: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
};

const getProgressBarClass = (status) => {
  const classes = {
    pending: 'bg-yellow-500',
    queued: 'bg-blue-500',
    processing: 'bg-indigo-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  };
  return classes[status] || 'bg-gray-500';
};

onMounted(() => {
  applyFilters();
});
</script>

